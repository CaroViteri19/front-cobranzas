import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);

  readonly user    = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@fintra.co' && password === 'admin123') {
          const user: User = { name: 'Camilo Cantor', email, role: 'Administrador' };
          this._user.set(user);
          resolve(user);
        } else {
          reject(new Error('Credenciales incorrectas. Use admin@fintra.co / admin123'));
        }
      }, 900);
    });
  }

  logout(): void {
    this._user.set(null);
  }
}
