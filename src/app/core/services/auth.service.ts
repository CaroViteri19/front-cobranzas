import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** Respuesta de autenticación que devuelve el backend Spring Boot. */
export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  roles: string[];       // ej: ["ADMINISTRADOR"]
  expiresAt: string;
}

/** Sesión activa del usuario almacenada en el estado de la app. */
export interface AuthSession {
  token: string;
  username: string;
  roles: string[];       // en mayúsculas tal como llegan del backend
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/auth';
  private readonly SESSION_KEY = 'auth_session';
  private readonly TAB_ID_KEY = 'auth_tab_id';
  private readonly CLOSE_MARKER_KEY = 'auth_tab_closed_marker';
  private readonly CLOSE_MARKER_TTL_MS = 30_000;

  private readonly tabId = this.ensureTabId();

  /**
   * Señal interna con la sesión activa.
   * Se hidrata desde sessionStorage para sobrevivir recargas en la misma pestaña.
   */
  private _session = signal<AuthSession | null>(this.loadSession());

  constructor() {
    this.registerCloseMarker();
  }

  /** Sesión de solo lectura expuesta a los consumidores. */
  readonly session = this._session.asReadonly();

  /** true si hay sesión activa. */
  readonly isLoggedIn = computed(() => this._session() !== null);

  /** Primer rol del usuario (ej: "ADMINISTRADOR"). Null si no hay sesión. */
  readonly currentRole = computed(() => this._session()?.roles[0] ?? null);

  /** Todos los roles del usuario. */
  readonly roles = computed(() => this._session()?.roles ?? []);

  /** Nombre de usuario autenticado. */
  readonly username = computed(() => this._session()?.username ?? null);

  /** Comprueba si el usuario tiene al menos uno de los roles indicados. */
  hasAnyRole(...requiredRoles: string[]): boolean {
    const userRoles = this._session()?.roles ?? [];
    return requiredRoles.some(r => userRoles.includes(r.toUpperCase()));
  }

  /** Devuelve el token JWT para usarlo en interceptores HTTP. */
  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  /**
   * Inicia sesión contra el backend.
   * Almacena la sesión en memoria y en sessionStorage (solo por pestaña).
   */
  async login(username: string, password: string): Promise<AuthSession> {
    // Normalizar email igual que el backend
    const email = username.trim().toLowerCase();
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      );

      const session: AuthSession = {
        token:    response.token,
        username: response.username,
        roles:    response.roles.map(r => r.toUpperCase()),
      };

      this._session.set(session);
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      this.clearCloseMarker();
      return session;
    } catch (err: any) {
      const status: number | undefined = err?.status;
      const msg: string =
        err?.error?.message ?? err?.error?.error ?? err?.message ?? '';

      if (status === 0) {
        throw new Error('No se puede conectar con el servidor. ¿Está el backend corriendo en el puerto 8080?');
      }
      if (status === 401 || status === 403) {
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
      if (status === 400) {
        throw new Error(`Datos inválidos: ${msg || 'revisa email y contraseña'}`);
      }
      throw new Error(msg || `Error ${status ?? 'desconocido'} al iniciar sesión`);
    }
  }

  /** Cierra sesión y limpia el almacenamiento local. */
  logout(): void {
    this._session.set(null);
    // Limpieza defensiva por si quedaron tokens guardados de versiones anteriores.
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.TAB_ID_KEY);
    this.clearCloseMarker();
  }

  // ── helpers privados ──────────────────────────────────────────────────────
  private loadSession(): AuthSession | null {
    try {
      if (this.wasTabRestoredAfterClose()) {
        sessionStorage.removeItem(this.SESSION_KEY);
        return null;
      }

      const raw = sessionStorage.getItem(this.SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  private ensureTabId(): string {
    const existing = sessionStorage.getItem(this.TAB_ID_KEY);
    if (existing) return existing;

    const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    sessionStorage.setItem(this.TAB_ID_KEY, id);
    return id;
  }

  private registerCloseMarker(): void {
    window.addEventListener('pagehide', () => {
      this.markTabClosing();
    });
  }

  private markTabClosing(): void {
    const payload = JSON.stringify({
      tabId: this.tabId,
      closedAt: Date.now(),
    });
    localStorage.setItem(this.CLOSE_MARKER_KEY, payload);
  }

  private clearCloseMarker(): void {
    const markerRaw = localStorage.getItem(this.CLOSE_MARKER_KEY);
    if (!markerRaw) return;

    try {
      const marker = JSON.parse(markerRaw) as { tabId?: string };
      if (marker.tabId === this.tabId) {
        localStorage.removeItem(this.CLOSE_MARKER_KEY);
      }
    } catch {
      localStorage.removeItem(this.CLOSE_MARKER_KEY);
    }
  }

  private wasTabRestoredAfterClose(): boolean {
    const markerRaw = localStorage.getItem(this.CLOSE_MARKER_KEY);
    if (!markerRaw) return false;

    try {
      const marker = JSON.parse(markerRaw) as { tabId?: string; closedAt?: number };
      const isSameTab = marker.tabId === this.tabId;
      const hasFreshMarker = typeof marker.closedAt === 'number'
        && (Date.now() - marker.closedAt) <= this.CLOSE_MARKER_TTL_MS;
      const navType = this.getNavigationType();
      const isReload = navType === 'reload';

      if (isSameTab && hasFreshMarker && !isReload) {
        localStorage.removeItem(this.CLOSE_MARKER_KEY);
        return true;
      }

      if (isSameTab) {
        localStorage.removeItem(this.CLOSE_MARKER_KEY);
      }
      return false;
    } catch {
      localStorage.removeItem(this.CLOSE_MARKER_KEY);
      return false;
    }
  }

  private getNavigationType(): string {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return navEntry?.type ?? 'navigate';
  }
}
