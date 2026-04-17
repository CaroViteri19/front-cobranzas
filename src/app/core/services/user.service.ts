import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_PATHS } from '../config/api.config';

// ── DTOs que reflejan el contrato del backend ─────────────────────────────────

/** Rol disponible en el sistema (viene de GET /api/v1/auth/roles). */
export interface RoleOption {
  id: number;
  name: string;        // ej: "ADMINISTRADOR"
  description: string;
}

/** Cuerpo para POST /api/v1/auth/register. */
export interface RegisterRequest {
  username: string;
  password: string;    // mínimo 12 caracteres y al menos 1 carácter especial
  fullName: string;
  email: string;
  role: number;
}

/** Respuesta de POST /api/v1/auth/register. */
export interface RegisterResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  enabled: boolean;
}

/**
 * Servicio para gestión de usuarios: registro y asignación de roles.
 *
 * Flujo de creación de usuario:
 *   - register() crea el usuario con el rol seleccionado directamente.
 *   - assignRole() permite cambiar el rol de un usuario ya existente (solo ADMINISTRADOR).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private http   = inject(HttpClient);
  private apiUrl = API_PATHS.auth;

  /**
   * Obtiene los roles disponibles en el sistema.
   * Requiere token de ADMINISTRADOR (lo agrega authInterceptor automáticamente).
   */
  async getRoles(): Promise<RoleOption[]> {
    return firstValueFrom(
      this.http.get<RoleOption[]>(`${this.apiUrl}/roles`)
    );
  }

  /**
   * Registra un nuevo usuario en el backend con el rol indicado en `data.role`.
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return firstValueFrom(
      this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data)
    );
  }

  /**
   * Cambia el rol de un usuario ya registrado.
   * Requiere token de ADMINISTRADOR.
   *
   * @param userId ID del usuario.
   * @param roleId ID del nuevo rol.
   */
  async assignRole(userId: number, roleId: number): Promise<string> {
    return firstValueFrom(
      this.http.post<string>(`${this.apiUrl}/role`, { idUser: userId, role: [roleId] })
    );
  }
}
