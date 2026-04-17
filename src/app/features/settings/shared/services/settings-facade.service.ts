import { Injectable, signal, effect } from '@angular/core';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { User, CreateUserDTO, RoleOption } from '../models/user.model';
import { UsersService } from '../../modules/users/services/users.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsFacadeService {
  // ========== USERS STATE ==========
  private usersState = signal<User[]>([]);
  private usersLoadingState = signal<boolean>(false);
  private usersErrorState = signal<string | null>(null);
  private rolesState = signal<RoleOption[]>([]);

  readonly users = this.usersState.asReadonly();
  readonly usersLoading = this.usersLoadingState.asReadonly();
  readonly usersError = this.usersErrorState.asReadonly();
  readonly roles = this.rolesState.asReadonly();

  constructor(private usersService: UsersService) {
    // Inicializar datos si es necesario
  }

  // ========== USERS OPERATIONS ==========

  loadUsers() {
    this.usersLoadingState.set(true);
    this.usersErrorState.set(null);

    this.usersService
      .getAll()
      .pipe(
        tap((users) => {
          this.usersState.set(users);
          this.usersLoadingState.set(false);
          console.log("****||||",users);
        }),
        catchError((err) => {
          const errorMsg = err?.error?.message || 'Error al cargar usuarios';
          this.usersErrorState.set(errorMsg);
          this.usersLoadingState.set(false);
          return of([]);
        })
      )
      .subscribe();
  }

  getRoles() {
    this.usersService
      .getRoles()
      .then((roles) => this.rolesState.set(roles))
      .catch(() => {
        this.rolesState.set([
          { id: 1, name: 'ADMINISTRADOR', description: 'Acceso total al sistema' },
          { id: 2, name: 'SUPERVISOR', description: 'Gestión de equipos y reportes' },
          { id: 3, name: 'AGENTE', description: 'Gestión de casos asignados' },
          { id: 4, name: 'AUDITOR', description: 'Acceso de solo lectura' },
        ]);
      });
  }

  createUserDirect(userData: CreateUserDTO): Promise<any> {
    return this.usersService.register(userData);
  }

  // 🆕 Método para actualizar usuario directamente (sin pasar por updateUser)
  updateUserDirect(updateData: { userId: number; email: string; enabled: boolean }): Promise<any> {
    return this.usersService.updateUser(updateData);
  }

  createUser(userData: CreateUserDTO) {
    this.usersLoadingState.set(true);
    this.usersErrorState.set(null);

    return this.usersService.register(userData).then(
      (created) => {
        const newUser: User = {
          id: String(created.id),
          fullname: created.fullName,
          email: created.email,
          role: (created.roles?.[0] || 'AGENTE') as any,
          status: 'Active',
          lastSeen: new Date().toISOString(),
        };

        this.usersState.update((list) => [...list, newUser]);
        this.usersLoadingState.set(false);
        return newUser;
      },
      (err) => {
        const errorMsg = err?.error?.message || 'Error al crear usuario';
        this.usersErrorState.set(errorMsg);
        this.usersLoadingState.set(false);
        throw err;
      }
    );
  }

  updateUser(id: string, userData: Partial<User>) {
    this.usersLoadingState.set(true);
    this.usersErrorState.set(null);

    return this.usersService.update(id, userData).then(
      (updated) => {
        this.usersState.update((list) =>
          list.map((u) => (u.id === id ? updated : u))
        );
        this.usersLoadingState.set(false);
        return updated;
      },
      (err) => {
        const errorMsg = err?.error?.message || 'Error al actualizar usuario';
        this.usersErrorState.set(errorMsg);
        this.usersLoadingState.set(false);
        throw err;
      }
    );
  }

  deleteUser(id: string) {
    this.usersLoadingState.set(true);
    this.usersErrorState.set(null);

    return this.usersService.delete(id).then(
      () => {
        this.usersState.update((list) => list.filter((u) => u.id !== id));
        this.usersLoadingState.set(false);
      },
      (err) => {
        const errorMsg = err?.error?.message || 'Error al eliminar usuario';
        this.usersErrorState.set(errorMsg);
        this.usersLoadingState.set(false);
        throw err;
      }
    );
  }

  toggleUserStatus(id: string, newStatus: 'Active' | 'Inactive') {
    const users = this.usersState();
    const user = users.find((u) => u.id === id);

    if (!user) return Promise.reject('Usuario no encontrado');

    return this.updateUser(id, { ...user, status: newStatus });
  }

  clearError() {
    this.usersErrorState.set(null);
  }
}

