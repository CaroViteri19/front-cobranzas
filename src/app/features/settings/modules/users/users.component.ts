// ============================================================================
// MÓDULO DE GESTIÓN DE USUARIOS
// ============================================================================
// Este componente maneja la lista de usuarios, creación y edición
// Usa la arquitectura modular con Façade Service centralizado
// ============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsFacadeService } from '../../shared/services/settings-facade.service';
import { RoleOption } from '../../shared/models/user.model';

// Interfaz que representa un usuario en la APP (mapeo local)
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

// Interfaz que representa la respuesta del BACKEND (datos crudos del servidor)
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
  selector: 'app-users-module',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  // ========================================================================
  // INYECCIÓN DE DEPENDENCIAS
  // ========================================================================
  // El Façade Service es el orquestador central que maneja toda la lógica
  // No llamamos directamente al backend, todo pasa por el Façade
  private readonly facade = inject(SettingsFacadeService);

  // ========================================================================
  // SEÑALES (SIGNALS) - Estado Reactivo
  // ========================================================================
  // Las signals son variables reactivas de Angular 17+
  // Cuando cambian, Angular automáticamente actualiza el template

  // ¿Se muestra el formulario para crear nuevo usuario?
  usersTableOpen = signal(true);


  // Lista de usuarios que se renderiza en la tabla
  users = signal<AppUser[]>([]);

  // ¿Se muestra el formulario inline para crear usuario?
  showNewUser = signal(false);

  // ¿Está guardando un usuario? (para mostrar spinner)
  savingUser = signal(false);

  // Mensaje de error si algo falla
  userError = signal('');

  // Lista de roles disponibles (ADMINISTRADOR, SUPERVISOR, etc)
  availableRoles = signal<RoleOption[]>([]);

  // ¿Se muestra la contraseña o está oculta?
  showNewUserPwd = signal(false);

  // ========================================================================
  // 🆕 EDICIÓN DE USUARIOS
  // ========================================================================
  // ID del usuario que está expandido para edición
  expandedUserId = signal<string | null>(null);

  // Usuario que se está editando
  editingUser = signal<AppUser | null>(null);

  // ¿Está guardando los cambios?
  savingEdit = signal(false);

  // ========================================================================
  // DATOS DEL FORMULARIO
  // ========================================================================
  // Objeto que guarda los datos del nuevo usuario que se está creando
  // Se vincula con ngModel en el template
  newUser = {
    fullName: '',
    username: '',
    typeDocument: '',
    document: null,
    email: '',
    password: '',
    roleId: '',
  };

  // Opciones de roles disponibles (constante, no cambia)
  readonly roleOptions = ['ADMINISTRADOR', 'SUPERVISOR', 'AGENTE', 'AUDITOR'];

  // Roles por defecto si el backend no devuelve nada
  private readonly fallbackRoles: RoleOption[] = [
    { id: 1, name: 'ADMINISTRADOR', description: 'Acceso total al sistema' },
    { id: 2, name: 'SUPERVISOR', description: 'Gestion de equipos y reportes' },
    { id: 3, name: 'AGENTE', description: 'Gestion de casos asignados' },
    { id: 4, name: 'AUDITOR', description: 'Acceso de solo lectura' },
  ];

  // ========================================================================
  // VARIABLES COMPUTADAS (Calculadas automáticamente)
  // ========================================================================
  // Esta cuenta cuántos usuarios están activos
  // Se actualiza automáticamente cuando la lista de usuarios cambia
  readonly activeUsersCount = computed(() =>
    this.users().filter((u) => u.status === 'Activo').length
  );

  // ========================================================================
  // CICLO DE VIDA
  // ========================================================================
  // Se ejecuta cuando el componente se carga
  ngOnInit(): void {
    void this.loadInitialData();
    console.log("Usuarios después de cargar datos iniciales", this.users());
  }

  // ========================================================================
  // MÉTODOS PÚBLICOS (Usados desde el template)
  // ========================================================================

  // Cuenta cuántos usuarios tiene un rol específico (y están activos)
  roleCount(role: string): number {
    return this.users().filter((u) => u.role === role && u.status === 'Activo').length;
  }

  // Crea un nuevo usuario
  // 1. Valida los datos
  // 2. Verifica la contraseña
  // 3. Llama al Façade para guardar
  // 4. Actualiza la lista local
  async addUser(): Promise<void> {
    this.userError.set('');

    // Validar que todos los campos requeridos están llenos
    if (!this.newUser.fullName || !this.newUser.username || !this.newUser.email || !this.newUser.password) {
      this.userError.set('Todos los campos son obligatorios.');
      return;
    }

    // Validar que seleccionó un rol
    if (!this.newUser.roleId) {
      this.userError.set('Debes seleccionar un rol.');
      return;
    }

    // Validar que la contraseña cumple requisitos:
    // - Mínimo 12 caracteres
    // - Al menos 1 carácter especial (!@#$%^&* etc)
    const passwordRegex = /^(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]).{12,}$/;
    if (!passwordRegex.test(this.newUser.password)) {
      this.userError.set('La contrasena debe tener minimo 12 caracteres y al menos un caracter especial.');
      return;
    }

    // Mostrar indicador de carga
    this.savingUser.set(true);

    try {
      // Llamar al Façade para crear el usuario en el backend
      const created = await this.facade.createUserDirect({
        fullName: this.newUser.fullName,
        username: this.newUser.username,
        email: this.newUser.email,
        password: this.newUser.password,
        role: Number(this.newUser.roleId),
      });

      // Obtener el nombre del rol del usuario creado
      const roleName =
        created.roles[0] ??
        this.availableRoles().find((r) => r.id === Number(this.newUser.roleId))?.name ??
        'AGENTE';

      // Agregar el nuevo usuario a la lista local (sin recargarse de internet)
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

      // Limpiar el formulario
      this.newUser = {
        fullName: '',
        username: '',
        typeDocument: '',
        document: null,
        email: '',
        password: '',
        roleId: '',
      };

      // Cerrar el formulario
      this.showNewUser.set(false);
    } catch (err: any) {
      // Mostrar error si algo falla
      if (err?.error?.message) {
        this.userError.set(err.error.message);
      } else {
        this.userError.set('Error al crear el usuario. Verifica los datos.');
      }
    } finally {
      // Quitar indicador de carga
      this.savingUser.set(false);
    }
  }

  // Cambia el estado del usuario (Activo <-> Inactivo)
  toggleUserStatus(id: string): void {
    this.users.update((list) =>
      list.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Activo' ? 'Inactivo' : 'Activo' } : u,
      ),
    );
  }

  // Elimina un usuario de la lista local
  removeUser(id: string): void {
    this.users.update((list) => list.filter((u) => u.id !== id));
  }

  // ========================================================================
  // 🆕 MÉTODOS PARA EDICIÓN DE USUARIOS
  // ========================================================================

  /**
   * Abre el panel expandible para editar un usuario
   */
  openEditPanel(user: AppUser): void {
    this.expandedUserId.set(user.id);
    this.editingUser.set({ ...user });
  }

  /**
   * Cierra el panel expandible
   */
  closeEditPanel(): void {
    this.expandedUserId.set(null);
    this.editingUser.set(null);
  }

  /**
   * Guarda los cambios del usuario editado
   * Envía al backend: {userId, email, enabled}
   */
  async saveUserChanges(): Promise<void> {
    const editingUser = this.editingUser();
    if (!editingUser) return;

    this.savingEdit.set(true);

    try {
      // Preparar datos para el backend
      const updateData = {
        userId: Number(editingUser.id),
        email: editingUser.email,
        enabled: editingUser.status === 'Activo',
      };

      console.log('💾 Guardando cambios:', updateData);

      // Llamar al servicio para actualizar
      const updated = await this.facade.updateUserDirect(updateData);

      console.log('✅ Usuario actualizado:', updated);

      // Actualizar en la lista local
      this.users.update((list) =>
        list.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                email: updated.email || u.email,
                status: updated.status?.toLowerCase() === 'active' ? 'Activo' : 'Inactivo',
              }
            : u
        )
      );

      // Cerrar panel
      this.closeEditPanel();
    } catch (err: any) {
      console.error('❌ Error al actualizar:', err);
      this.userError.set(err?.error?.message || 'Error al guardar cambios');
    } finally {
      this.savingEdit.set(false);
    }
  }

  // ========================================================================
  // MÉTODOS PRIVADOS
  // ========================================================================

  // Carga los datos iniciales cuando se abre la página
  private async loadInitialData(): Promise<void> {
    // 1. Obtener los roles disponibles del Façade
    this.facade.getRoles();
    this.availableRoles.set(this.fallbackRoles);

    try {
      // 2. Cargar la lista de usuarios desde el backend (a través del Façade)
      this.facade.loadUsers();

      // 3. ESPERAR a que los datos lleguen
      // La petición HTTP es asincrónica, así que esperamos un poco
      await new Promise(resolve => setTimeout(resolve, 100));

      // 4. Obtener los usuarios del Façade (AHORA ya deberían estar aquí)
      const backendUsers = this.facade.users();
      console.log('📋 Usuarios del backend:', backendUsers);
      console.log('📊 Cantidad:', backendUsers?.length || 0);

      // 5. Transformar cada usuario del backend al formato local (AppUser)
      const transformed = backendUsers.map((u, index) => this.mapBackendUser(u, index));
      console.log('✅ Usuarios transformados:', transformed);

      // 6. Guardar en el signal (esto actualiza el template automáticamente)
      this.users.set(transformed);
      console.log('✨ Signal actualizado. Total:', this.users().length);

    } catch (err) {
      console.error('❌ Error:', err);
      // Si algo falla, dejar la lista vacía
      this.users.set([]);
    }
  }

  // Transforma un usuario del backend (formato crudo) al formato de la app (AppUser)
  // El backend devuelve datos con diferentes nombres y formatos, esto lo normaliza
  private mapBackendUser(user: any, index: number): AppUser {
    console.log('🔄 Transformando usuario #' + (index + 1) + ':', user);

    // Obtener el rol (puede estar en "role" o en "roles[0]")
    const role = user.role ?? user.roles?.[0] ?? 'AGENTE';

    // Obtener el nombre (el backend puede devolver "fullname", "name", "username" o "email")
    const name = user.fullname ?? user.name ?? user.username ?? user.email ?? `Usuario ${index + 1}`;

    // Convertir el estado del backend ("active"/"Active") a formato app ("Activo"/"Inactivo")
    const backendStatus = user.status?.toLowerCase() ?? 'active';
    const isActive = backendStatus === 'active';

    // Formatear el último acceso como fecha legible
    let lastLogin = 'Nunca';
    if (user.lastSeen) {
      const date = new Date(user.lastSeen);
      if (!Number.isNaN(date.getTime())) {
        // Convertir a formato: "17/04/2026 14:30"
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

    // Construir y retornar el usuario transformado
    const appUser: AppUser = {
      id: String(user.id ?? index + 1),
      name,
      typeDocument: user.typeDocument ?? 'CC',
      document: user.document ?? 0n,
      email: user.email ?? '—',
      role,
      status: isActive ? 'Activo' : 'Inactivo',
      lastLogin,
    };

    console.log('✅ Usuario transformado:', appUser);
    return appUser;
  }
}








