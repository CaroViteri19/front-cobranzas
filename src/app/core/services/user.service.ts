import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
 *   1. register()     → crea el usuario con rol USER por defecto
 *   2. assignRole()   → asigna el rol definitivo usando el ID devuelto
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private http   = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/auth';

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
   * Registra un nuevo usuario en el backend.
   * El usuario se crea con rol USER por defecto; usa assignRole() para cambiar el rol.
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return firstValueFrom(
      this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data)
    );
  }

  /**
   * Asigna un rol a un usuario ya registrado.
   * Requiere token de ADMINISTRADOR.
   *
   * @param userId ID del usuario (devuelto por register()).
   * @param roleId ID del rol (devuelto por getRoles()).
   */

}
