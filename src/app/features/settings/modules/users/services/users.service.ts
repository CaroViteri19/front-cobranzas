import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User, CreateUserDTO, RoleOption } from '../../../shared/models';

// ============================================================================
// SERVICIO DE USUARIOS
// ============================================================================
// Este servicio es responsable ÚNICAMENTE de hacer llamadas HTTP al backend
// No maneja lógica de negocio, solo comunicación con la API
// El Façade Service es quien orquesta este servicio
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  // URL base del backend para usuarios
  private apiUrl = 'http://localhost:8080/users';

  constructor(private http: HttpClient) {}

  // ========================================================================
  // MÉTODOS GET (Obtener datos del backend)
  // ========================================================================

  /**
   * Obtiene la lista de todos los usuarios
   * Endpoint: GET /users/all
   * Retorna: Observable<User[]>
   */

    getAll(): Observable<User[]> {
      return this.http.get<User[]>(`${this.apiUrl}/all`).pipe(
        tap(data => console.log("Usuarios obtenidos:", data))
      );
    }

  /**
   * Obtiene un usuario específico por su ID
   * Endpoint: GET /users/{id}
   * @param id - ID del usuario a obtener
   * Retorna: Observable<User>
   */
  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene la lista de roles disponibles en el sistema
   * Nota: Por ahora devuelve roles locales, podría venir del backend
   * Retorna: Promise<RoleOption[]>
   */
  getRoles(): Promise<RoleOption[]> {
    return Promise.resolve([
      { id: 1, name: 'ADMINISTRADOR', description: 'Acceso total al sistema' },
      { id: 2, name: 'SUPERVISOR', description: 'Gestión de equipos y reportes' },
      { id: 3, name: 'AGENTE', description: 'Gestión de casos asignados' },
      { id: 4, name: 'AUDITOR', description: 'Acceso de solo lectura' },
    ]);
  }

  // ========================================================================
  // MÉTODOS POST (Crear datos en el backend)
  // ========================================================================

  /**
   * Crea un nuevo usuario en el backend
   * Endpoint: POST /users
   * @param user - Datos del nuevo usuario
   * Retorna: Observable<User>
   */
  create(user: CreateUserDTO): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  // ========================================================================
  // MÉTODOS PUT (Actualizar datos en el backend)
  // ========================================================================

  /**
   * Actualiza un usuario existente
   * Endpoint: PUT /users/{id}
   * @param id - ID del usuario a actualizar
   * @param user - Datos parciales del usuario a actualizar
   * Retorna: Promise<User>
   */
  update(id: string, user: Partial<User>): Promise<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user).toPromise().then(
      (res) => res!,
      (err) => {
        throw err;
      }
    );
  }

  // ========================================================================
  // MÉTODOS DELETE (Eliminar datos del backend)
  // ========================================================================

  /**
   * Elimina un usuario del backend
   * Endpoint: DELETE /users/{id}
   * @param id - ID del usuario a eliminar
   * Retorna: Promise<void>
   */
  delete(id: string): Promise<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).toPromise().then(() => undefined);
  }

  // ========================================================================
  // MÉTODOS ESPECIALES
  // ========================================================================

  /**
   * Registra un nuevo usuario (endpoint específico para registro)
   * Endpoint: POST /users/register
   * @param userData - Datos del nuevo usuario
   * Retorna: Promise<any>
   */
  register(userData: CreateUserDTO): Promise<any> {
    return this.http
      .post<any>(`${this.apiUrl}/register`, userData)
      .toPromise()
      .then((res) => res!);
  }

  /**
   * Actualiza un usuario existente
   * Endpoint: PUT /users/update
   * @param userData - Datos a actualizar {userId, email, enabled}
   * Retorna: Promise<User>
   */
  updateUser(userData: { userId: number; email: string; enabled: boolean }): Promise<any> {
    return this.http
      .put<any>(`${this.apiUrl}/update`, userData)
      .toPromise()
      .then((res) => res!);
  }

  /**
   * Cambia el estado del usuario (Activo/Inactivo)
   * Endpoint: PATCH /users/{id}/toggle-status
   * @param id - ID del usuario
   * Retorna: Observable<User>
   */
  toggleStatus(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}



