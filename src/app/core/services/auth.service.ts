import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Importa esto
import { User } from '../models';
import { firstValueFrom, tap } from 'rxjs'; // Útiles para manejar promesas

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient); // Inyecta el cliente HTTP
  private apiUrl = 'http://localhost:8080/api/v1/auth'; // La URL de tu Spring Boot

  private _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  // Cambiamos la lógica para usar el backend real
  async login(username: string, password: string): Promise<User> {
    const credentials = { username, password };

    try {
      // firstValueFrom convierte el Observable de Angular en una Promesa
      // para que no tengas que cambiar la lógica de tus componentes
      const user = await firstValueFrom(
        this.http.post<User>(`${this.apiUrl}/login`, credentials).pipe(
          tap(userResponse => this._user.set(userResponse))
        )
      );
      return user;
    } catch (error) {
      // Si el backend devuelve 401 o 403, caerá aquí
      throw new Error('Credenciales incorrectas o error de servidor');
    }
  }

  logout(): void {
    this._user.set(null);
    // Opcional: llamar al endpoint de logout del backend si es necesario
  }
}
