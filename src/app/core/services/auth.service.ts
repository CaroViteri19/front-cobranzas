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

const SESSION_KEY = 'auth_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/auth';

  /**
   * Señal interna con la sesión activa.
   * Se inicializa desde localStorage para sobrevivir recargas de página.
   */
  private _session = signal<AuthSession | null>(this.loadSession());

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
   * Almacena la sesión en memoria y en localStorage.
   */
  async login(username: string, password: string): Promise<AuthSession> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password })
      );

      const session: AuthSession = {
        token:    response.token,
        username: response.username,
        roles:    response.roles.map(r => r.toUpperCase()),
      };

      this._session.set(session);
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    } catch {
      throw new Error('Credenciales incorrectas o error de servidor');
    }
  }

  /** Cierra sesión y limpia el almacenamiento local. */
  logout(): void {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  // ── helpers privados ──────────────────────────────────────────────────────

  private loadSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }
}
