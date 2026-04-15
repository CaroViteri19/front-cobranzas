import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RoleOption, UserService } from '../../../core/services/user.service';

interface AppUser {
  id: string;
  name: string;
  typeDocument: string;
  document: bigint;
  email: string;
  role: string;
  status: 'Activo' | 'Inactivo';
  lastLogin: string;
}

interface BackendUserSummary {
  id?: string | number;
  fullname?: string;
  name?: string;
  typeDocument?: string;
  document?: bigint;
  username?: string;
  email?: string;
  role?: string;
  roles?: string[];
  status?: string;
  lastSeen?: string;
}

@Component({
  selector: 'app-settings-users-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-users-tab.component.html',
})
export class SettingsUsersTabComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);

  usersTableOpen = signal(true);
  users = signal<AppUser[]>([]);

  showNewUser = signal(false);
  savingUser = signal(false);
  userError = signal('');
  availableRoles = signal<RoleOption[]>([]);
  showNewUserPwd = signal(false);

  newUser = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    roleId: '',
  };

  readonly roleOptions = ['ADMINISTRADOR', 'SUPERVISOR', 'AGENTE', 'AUDITOR'];

  private readonly fallbackRoles: RoleOption[] = [
    { id: 1, name: 'ADMINISTRADOR', description: 'Acceso total al sistema' },
    { id: 2, name: 'SUPERVISOR', description: 'Gestion de equipos y reportes' },
    { id: 3, name: 'AGENTE', description: 'Gestion de casos asignados' },
    { id: 4, name: 'AUDITOR', description: 'Acceso de solo lectura' },
  ];

  readonly activeUsersCount = computed(() => this.users().filter((u) => u.status === 'Activo').length);

  ngOnInit(): void {
    void this.loadInitialData();
  }

  roleCount(role: string): number {
    return this.users().filter((u) => u.role === role && u.status === 'Activo').length;
  }

  async addUser(): Promise<void> {
    this.userError.set('');

    if (!this.newUser.fullName || !this.newUser.username || !this.newUser.email || !this.newUser.password) {
      this.userError.set('Todos los campos son obligatorios.');
      return;
    }

    if (!this.newUser.roleId) {
      this.userError.set('Debes seleccionar un rol.');
      return;
    }

    const passwordRegex = /^(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]).{12,}$/;
    if (!passwordRegex.test(this.newUser.password)) {
      this.userError.set('La contrasena debe tener minimo 12 caracteres y al menos un caracter especial.');
      return;
    }

    this.savingUser.set(true);

    try {
      const created = await this.userService.register({
        fullName: this.newUser.fullName,
        username: this.newUser.username,
        email: this.newUser.email,
        password: this.newUser.password,
        role: Number(this.newUser.roleId),
      });

      const roleName =
        created.roles[0] ??
        this.availableRoles().find((r) => r.id === Number(this.newUser.roleId))?.name ??
        'AGENTE';

      this.users.update((list) => [
        ...list,
        {
          id: String(created.id),
          name: created.fullName,
          typeDocument: 'CC',
          document: 0n,
          email: created.email,
          role: roleName,
          status: 'Activo',
          lastLogin: 'Nunca',
        },
      ]);

      this.newUser = {
        fullName: '',
        username: '',
        email: '',
        password: '',
        roleId: '',
      };

      this.showNewUser.set(false);
    } catch (err: any) {
      if (err?.error?.message) {
        this.userError.set(err.error.message);
      } else {
        this.userError.set('Error al crear el usuario. Verifica los datos.');
      }
    } finally {
      this.savingUser.set(false);
    }
  }

  toggleUserStatus(id: string): void {
    this.users.update((list) =>
      list.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Activo' ? 'Inactivo' : 'Activo' } : u,
      ),
    );
  }

  removeUser(id: string): void {
    this.users.update((list) => list.filter((u) => u.id !== id));
  }

  private async loadInitialData(): Promise<void> {
    if (this.auth.hasAnyRole('ADMINISTRADOR')) {
      this.userService
        .getRoles()
        .then((roles) => this.availableRoles.set(roles))
        .catch(() => this.availableRoles.set(this.fallbackRoles));
    } else {
      this.availableRoles.set(this.fallbackRoles);
    }

    try {
      const backendUsers = (await this.userService.getUsers()) as unknown as BackendUserSummary[];
      this.users.set(backendUsers.map((u, index) => this.mapBackendUser(u, index)));
    } catch {
      this.users.set([]);
    }
  }

  private mapBackendUser(user: BackendUserSummary, index: number): AppUser {
    const role = user.role ?? user.roles?.[0] ?? 'AGENTE';
    const name = user.fullname ?? user.name ?? user.username ?? user.email ?? `Usuario ${index + 1}`;

    const backendStatus = user.status?.toLowerCase() ?? 'active';
    const isActive = backendStatus === 'active';

    let lastLogin = 'Nunca';
    if (user.lastSeen) {
      const date = new Date(user.lastSeen);
      if (!Number.isNaN(date.getTime())) {
        lastLogin = date.toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        lastLogin = user.lastSeen;
      }
    }

    return {
      id: String(user.id ?? index + 1),
      name,
      typeDocument: user.typeDocument ?? 'CC',
      document: user.document ?? 0n,
      email: user.email ?? '—',
      role,
      status: isActive ? 'Activo' : 'Inactivo',
      lastLogin,
    };
  }
}

