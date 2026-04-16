# Guia detallada (principiantes): Gestion de usuarios paso a paso

> Esta version esta pensada para que NO te pierdas al pegar codigo.
>
> En cada paso te digo exactamente: que archivo abrir, que bloque buscar, que reemplazar y donde pegar.

---

## Checklist de implementacion (en orden)

- [ ] Paso 0: preparar respaldo y validar que compila antes de tocar.
- [ ] Paso 1: extraer `loadUsers()` en `settings-users-tab.component.ts`.
- [ ] Paso 2: refrescar lista al crear usuario (`addUser`).
- [ ] Paso 3: agregar busqueda y filtros con `signal` + `computed`.
- [ ] Paso 4: actualizar HTML para usar `filteredUsers()`.
- [ ] Paso 5: persistir activar/desactivar en API (`user.service.ts` + componente).
- [ ] Paso 6: preparar base de edicion (sin modal complejo aun).
- [ ] Paso 7: pruebas manuales de cada flujo.

---

## Paso 0 - Preparacion segura (2 minutos)

### Archivos que vas a tocar

1. `src/app/features/settings/tabs/settings-users-tab.component.ts`
2. `src/app/features/settings/tabs/settings-users-tab.component.html`
3. `src/app/core/services/user.service.ts`

### Recomendacion anti errores

- Haz una copia de cada archivo (por ejemplo `*.bak`) antes de editar.
- Edita de a un paso; compila; luego sigues.

---

## Paso 1 - Crear `loadUsers()` reutilizable

## 1.1 Abre `src/app/features/settings/tabs/settings-users-tab.component.ts`

### 1.2 Busca este bloque exacto (al final del archivo)

```ts
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
```

### 1.3 Reemplazalo por este bloque

```ts
private async loadInitialData(): Promise<void> {
  if (this.auth.hasAnyRole('ADMINISTRADOR')) {
    this.userService
      .getRoles()
      .then((roles) => this.availableRoles.set(roles))
      .catch(() => this.availableRoles.set(this.fallbackRoles));
  } else {
    this.availableRoles.set(this.fallbackRoles);
  }

  await this.loadUsers();
}

private async loadUsers(): Promise<void> {
  try {
    const backendUsers = (await this.userService.getUsers()) as unknown as BackendUserSummary[];
    this.users.set(backendUsers.map((u, index) => this.mapBackendUser(u, index)));
  } catch {
    this.users.set([]);
  }
}
```

### 1.4 Que acabas de lograr

- Separaste la carga de usuarios en un metodo reutilizable.
- Luego lo usaras tras crear, editar y activar/desactivar.

---

## Paso 2 - Refrescar tabla al crear usuario

## 2.1 En el mismo archivo (`settings-users-tab.component.ts`) busca dentro de `addUser()` este bloque

```ts
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
```

### 2.2 Reemplazalo por esto

```ts
await this.loadUsers();
```

### 2.3 Nota importante

- Puedes dejar `const created = await this.userService.register(...)` porque se usa para validar que la creacion fue OK.
- Ya NO dependes de construir usuario localmente.

---

## Paso 3 - Agregar busqueda y filtros (TS)

## 3.1 En `settings-users-tab.component.ts`, busca esta zona cerca de arriba

```ts
usersTableOpen = signal(true);
users = signal<AppUser[]>([]);

showNewUser = signal(false);
```

### 3.2 Justo debajo de `users = signal<AppUser[]>([]);` pega esto

```ts
searchTerm = signal('');
selectedRole = signal('TODOS');
selectedStatus = signal<'TODOS' | 'Activo' | 'Inactivo'>('TODOS');
```

### 3.3 Busca este `computed` actual

```ts
readonly activeUsersCount = computed(() => this.users().filter((u) => u.status === 'Activo').length);
```

### 3.4 Debajo de ese bloque pega este `computed` nuevo

```ts
readonly filteredUsers = computed(() => {
  const term = this.searchTerm().trim().toLowerCase();
  const role = this.selectedRole();
  const status = this.selectedStatus();

  return this.users().filter((u) => {
    const matchesText =
      term.length === 0 ||
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.id.toLowerCase().includes(term);

    const matchesRole = role === 'TODOS' || u.role === role;
    const matchesStatus = status === 'TODOS' || u.status === status;

    return matchesText && matchesRole && matchesStatus;
  });
});
```

### 3.5 Debajo de `roleCount(...)` pega helper para limpiar filtros

```ts
clearFilters(): void {
  this.searchTerm.set('');
  this.selectedRole.set('TODOS');
  this.selectedStatus.set('TODOS');
}
```

---

## Paso 4 - Actualizar HTML para usar busqueda/filtros

## 4.1 Abre `src/app/features/settings/tabs/settings-users-tab.component.html`

### 4.2 Busca este bloque (cabecera colapsable)

```html
<div class="collapse-right">
  <span class="collapse-count">{{ users().length }} registros</span>
  <button class="collapse-btn" type="button">{{ usersTableOpen() ? '▼' : '▶' }}</button>
</div>
```

### 4.3 Reemplazalo por esto

```html
<div class="collapse-right">
  <span class="collapse-count">{{ filteredUsers().length }} de {{ users().length }} registros</span>
  <button class="collapse-btn" type="button">{{ usersTableOpen() ? '▼' : '▶' }}</button>
</div>
```

### 4.4 Dentro de `@if (usersTableOpen()) {`, justo antes de `<div class="ut-scroll-wrapper">`, pega esta barra

```html
<div class="inline-form" style="margin-bottom: 12px;">
  <div class="form-row-3">
    <div class="form-group">
      <label>Buscar</label>
      <input
        class="input"
        [ngModel]="searchTerm()"
        (ngModelChange)="searchTerm.set($event)"
        placeholder="Nombre, correo o id"
      />
    </div>

    <div class="form-group">
      <label>Rol</label>
      <select class="input" [ngModel]="selectedRole()" (ngModelChange)="selectedRole.set($event)">
        <option value="TODOS">Todos</option>
        @for (role of roleOptions; track role) {
          <option [value]="role">{{ role }}</option>
        }
      </select>
    </div>

    <div class="form-group">
      <label>Estado</label>
      <select class="input" [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)">
        <option value="TODOS">Todos</option>
        <option value="Activo">Activo</option>
        <option value="Inactivo">Inactivo</option>
      </select>
    </div>
  </div>

  <div class="inline-form-actions" style="margin-top: 8px;">
    <button class="btn-secondary btn-sm" type="button" (click)="clearFilters()">Limpiar filtros</button>
  </div>
</div>
```

### 4.5 Busca este `@for`

```html
@for (u of users(); track u.id) {
```

### 4.6 Cambialo por

```html
@for (u of filteredUsers(); track u.id) {
```

---

## Paso 5 - Persistir activar/desactivar en backend

## 5.1 Abre `src/app/core/services/user.service.ts`

### 5.2 Debajo de `assignRole(...)` pega este metodo

> Ajusta URL/body segun tu backend real.

```ts
async toggleUserStatus(userId: number | string, enabled: boolean): Promise<void> {
  await firstValueFrom(
    this.http.patch<void>(`http://localhost:8080/users/${userId}/status`, { enabled })
  );
}
```

## 5.3 Vuelve a `settings-users-tab.component.ts`

### 5.4 Busca el metodo actual

```ts
toggleUserStatus(id: string): void {
  this.users.update((list) =>
    list.map((u) =>
      u.id === id ? { ...u, status: u.status === 'Activo' ? 'Inactivo' : 'Activo' } : u,
    ),
  );
}
```

### 5.5 Reemplazalo por este metodo async

```ts
async toggleUserStatus(id: string): Promise<void> {
  const target = this.users().find((u) => u.id === id);
  if (!target) return;

  const shouldEnable = target.status !== 'Activo';

  try {
    await this.userService.toggleUserStatus(id, shouldEnable);
    await this.loadUsers();
  } catch (err: any) {
    this.userError.set(err?.error?.message ?? 'No se pudo actualizar el estado del usuario.');
  }
}
```

---

## Paso 6 - Base para edicion (primer nivel)

> Aqui te dejo base minima para que el siguiente paso sea modal completo.

## 6.1 En `user.service.ts` agrega base `updateUser`

```ts
async updateUser(
  userId: number | string,
  payload: { fullName: string; email: string; role?: string }
): Promise<void> {
  await firstValueFrom(
    this.http.patch<void>(`http://localhost:8080/users/${userId}`, payload)
  );
}
```

## 6.2 En `settings-users-tab.component.ts` agrega estado inicial de edicion (debajo de `showNewUserPwd`)

```ts
showEditModal = signal(false);
savingEdit = signal(false);
editError = signal('');
editingUserId = signal<string | null>(null);

editForm = {
  fullName: '',
  email: '',
  role: '',
};
```

Con eso ya dejas preparada la estructura para el modal.

---

## Paso 7 - Verificacion rapida en cada paso

Despues de cada paso, compila y prueba visualmente.

Comando sugerido (PowerShell):

```powershell
npm run start
```

Si prefieres build sin levantar servidor:

```powershell
npm run build
```

---

## Checklist de pruebas manuales (muy concreto)

### 1) Carga inicial

- [ ] Abres la pestana de usuarios y ves registros reales.
- [ ] Si apagas backend, no se rompe la pantalla.

### 2) Crear usuario

- [ ] Si falta un campo, sale error.
- [ ] Si password invalida, bloquea creacion.
- [ ] Al crear, el usuario aparece por refresco (`loadUsers`).

### 3) Busqueda/filtros

- [ ] Buscar por nombre funciona.
- [ ] Buscar por correo funciona.
- [ ] Filtro rol y estado funcionan combinados.
- [ ] Limpiar filtros vuelve a mostrar todos.

### 4) Activar/desactivar

- [ ] Cambia estado y persiste al recargar la pagina.
- [ ] Si backend devuelve error, ves mensaje.

---

## Errores frecuentes al pegar codigo (y como evitarlos)

1. Pegar metodos fuera de la clase `SettingsUsersTabComponent`.
   - Solucion: siempre pega entre `{` y `}` de la clase.
2. Duplicar nombre de metodo (`loadUsers`, `toggleUserStatus`).
   - Solucion: busca antes si ya existe y reemplaza.
3. Usar `[(ngModel)]` directo sobre `signal()`.
   - Solucion: usar `[ngModel]` y `(ngModelChange)` como en la guia.
4. Endpoint distinto al real del backend.
   - Solucion: adapta URL y payload antes de probar.

---

## Mini glosario Angular (para que entiendas lo que haces)

- `signal(...)`: estado reactivo local (valor mutable controlado).
- `computed(...)`: valor derivado automatico (se recalcula cuando cambian signals).
- `inject(...)`: forma moderna de pedir servicios en Angular.
- `firstValueFrom(...)`: convierte Observable HTTP en Promise para usar `async/await`.

---

## Siguiente paso recomendado

Cuando termines esta guia, hacemos una segunda guia enfocada solo en modal de edicion completo (abrir, validar, guardar, cerrar, y refrescar lista).


