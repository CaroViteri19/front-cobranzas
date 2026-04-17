🔄 FLUJO COMPLETO: MOSTRAR USUARIOS EN LA TABLA

═══════════════════════════════════════════════════════════════════════════════

ESCENARIO: El usuario abre Settings y hace click en "Gestión de Usuarios"

═══════════════════════════════════════════════════════════════════════════════

PASO 1: COMPONENTE SE CARGA
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: users.component.ts

```typescript
export class UsersComponent implements OnInit {
  // El componente se crea
  // ...
  
  ngOnInit(): void {
    // 🎯 Este método se ejecuta AUTOMÁTICAMENTE cuando el componente carga
    void this.loadInitialData();
  }
}
```

🎯 ¿QUÉ SUCEDE?
└─ Angular crea el componente
└─ Automáticamente llama a ngOnInit()
└─ ngOnInit() llama a loadInitialData()

═══════════════════════════════════════════════════════════════════════════════

PASO 2: CARGA LOS DATOS INICIALES
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: users.component.ts - Método loadInitialData()

```typescript
private async loadInitialData(): Promise<void> {
  // Paso A: Obtener roles disponibles
  this.facade.getRoles();
  this.availableRoles.set(this.fallbackRoles);

  // Paso B: Cargar usuarios desde el backend
  try {
    this.facade.loadUsers();  // 👈 AQUÍ PIDE LOS USUARIOS AL BACKEND
    const backendUsers = this.facade.users();
    
    // Paso C: Transformar usuarios del backend al formato de la app
    this.users.set(backendUsers.map((u, index) => this.mapBackendUser(u, index)));
  } catch {
    this.users.set([]);
  }
}
```

🎯 ¿QUÉ SUCEDE?
├─ A) Obtiene los roles (ADMINISTRADOR, SUPERVISOR, etc)
├─ B) Pide usuarios al Façade → El Façade llama al Servicio → El Servicio hace HTTP GET
└─ C) Recibe usuarios del backend y los transforma

═══════════════════════════════════════════════════════════════════════════════

PASO 3: EL FAÇADE ORQUESTA LA LLAMADA
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: shared/services/settings-facade.service.ts - Método loadUsers()

```typescript
export class SettingsFacadeService {
  // Estado reactivo donde se almacenan los usuarios
  private usersState = signal<User[]>([]);
  readonly users = this.usersState.asReadonly();

  loadUsers() {
    // Paso 1: Mostrar indicador de carga
    this.usersLoadingState.set(true);
    this.usersErrorState.set(null);

    // Paso 2: Llamar al Servicio de Usuarios
    this.usersService
      .getAll()  // 👈 AQUÍ SE HACE LA LLAMADA HTTP
      .pipe(
        tap((data) => {
          // Paso 3: Si funciona, guardar los datos
          this.usersState.set(data);
          this.usersLoadingState.set(false);
        }),
        catchError((err) => {
          // Paso 4: Si falla, guardar error
          this.usersErrorState.set(err?.error?.message || 'Error');
          this.usersLoadingState.set(false);
          return of([]);
        })
      )
      .subscribe();
  }
}
```

🎯 ¿QUÉ SUCEDE?
├─ Paso 1: Marca que está cargando (usersLoadingState = true)
├─ Paso 2: Llama al servicio para obtener usuarios (HTTP GET)
├─ Paso 3: Si éxito → guarda en usersState signal
└─ Paso 4: Si error → guarda mensaje de error

═══════════════════════════════════════════════════════════════════════════════

PASO 4: EL SERVICIO HACE LA LLAMADA HTTP
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: modules/users/services/users.service.ts - Método getAll()

```typescript
export class UsersService {
  private apiUrl = 'http://localhost:8080/users';

  getAll(): Observable<User[]> {
    // 👇 AQUÍ SE HACE LA LLAMADA HTTP AL BACKEND
    return this.http.get<User[]>(`${this.apiUrl}/all`);
  }
}
```

🎯 ¿QUÉ SUCEDE?
├─ Se construye la URL: http://localhost:8080/users/all
├─ Se envía HTTP GET al backend
└─ El observable espera la respuesta

═══════════════════════════════════════════════════════════════════════════════

PASO 5: BACKEND RECIBE LA PETICIÓN Y RESPONDE
───────────────────────────────────────────────────────────────────────────────

⚙️ Backend (http://localhost:8080)

Petición HTTP:
```
GET /users/all
```

Backend procesa:
└─ Busca en la base de datos
└─ Obtiene lista de usuarios

Respuesta HTTP (JSON):
```json
[
  {
    "id": 1,
    "fullname": "System Administrator",
    "email": "admin@coovitel.co",
    "role": "ADMINISTRADOR",
    "lastSeen": "2026-04-14T09:03:51.492737",
    "status": "Active"
  },
  {
    "id": 2,
    "fullname": "Laura Rodriguez",
    "email": "supervisor@coovitel.co",
    "role": "SUPERVISOR",
    "lastSeen": "2026-04-14T09:03:51.588122",
    "status": "Active"
  }
]
```

═══════════════════════════════════════════════════════════════════════════════

PASO 6: EL FRONTEND RECIBE LA RESPUESTA
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: shared/services/settings-facade.service.ts

```typescript
this.usersService
  .getAll()  // ← Obtuvo respuesta del backend
  .pipe(
    tap((data) => {
      // 👇 data = array de usuarios del backend
      console.log('Usuarios recibidos:', data);
      
      // Guardar en el signal
      this.usersState.set(data);
    })
  )
```

🎯 ¿QUÉ SUCEDE?
└─ Recibe el JSON del backend
└─ Lo guarda en el signal usersState
└─ ¡Automáticamente los componentes que usan este signal se actualizan!

═══════════════════════════════════════════════════════════════════════════════

PASO 7: EL COMPONENTE RECIBE LOS DATOS DEL FAÇADE
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: users.component.ts - En loadInitialData()

```typescript
private async loadInitialData(): Promise<void> {
  // ...
  
  try {
    this.facade.loadUsers();  // ← El facade cargó los usuarios
    const backendUsers = this.facade.users();  // ← Obtiene los usuarios del facade
    
    // Transforma los usuarios al formato de la app
    this.users.set(
      backendUsers.map((u, index) => this.mapBackendUser(u, index))
    );
  } catch {
    this.users.set([]);
  }
}
```

🎯 ¿QUÉ SUCEDE?
├─ El componente llama a facade.users()
├─ Obtiene el array de usuarios del backend
└─ Los transforma al formato local (mapBackendUser)

═══════════════════════════════════════════════════════════════════════════════

PASO 8: TRANSFORMAR DATOS DEL BACKEND
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: users.component.ts - Método mapBackendUser()

Backend devuelve:
```json
{
  "id": 1,
  "fullname": "System Administrator",
  "email": "admin@coovitel.co",
  "role": "ADMINISTRADOR",
  "lastSeen": "2026-04-14T09:03:51.492737",
  "status": "Active"
}
```

El componente transforma:
```typescript
private mapBackendUser(user: any, index: number): AppUser {
  // Obtener el rol
  const role = user.role ?? user.roles?.[0] ?? 'AGENTE';
  
  // Obtener el nombre
  const name = user.fullname ?? user.name ?? `Usuario ${index + 1}`;
  
  // Convertir estado del backend ("Active") al formato app ("Activo")
  const backendStatus = user.status?.toLowerCase() ?? 'active';
  const isActive = backendStatus === 'active';
  
  // Formatear la fecha
  let lastLogin = 'Nunca';
  if (user.lastSeen) {
    const date = new Date(user.lastSeen);
    lastLogin = date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Retorna el usuario transformado
  return {
    id: String(user.id),
    name,
    typeDocument: user.typeDocument ?? 'CC',
    document: user.document ?? 0n,
    email: user.email ?? '—',
    role,
    status: isActive ? 'Activo' : 'Inactivo',  // Traducción
    lastLogin,
  };
}
```

ANTES (Backend):                    DESPUÉS (Componente):
─────────────────────              ─────────────────────
fullname: "System..."       ──→     name: "System..."
status: "Active"            ──→     status: "Activo"
role: "ADMINISTRADOR"       ──→     role: "ADMINISTRADOR"
lastSeen: "2026-04-14..."   ──→     lastLogin: "14/04/2026 09:03"

═══════════════════════════════════════════════════════════════════════════════

PASO 9: GUARDAR EN EL SIGNAL LOCAL
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: users.component.ts

```typescript
// Signal donde se guardan los usuarios
users = signal<AppUser[]>([]);

// Guardar los usuarios transformados
this.users.set(backendUsers.map((u, index) => this.mapBackendUser(u, index)));
```

RESULTADO:
```
users = [
  {
    id: "1",
    name: "System Administrator",
    email: "admin@coovitel.co",
    role: "ADMINISTRADOR",
    status: "Activo",
    lastLogin: "14/04/2026 09:03",
    ...
  },
  {
    id: "2",
    name: "Laura Rodriguez",
    email: "supervisor@coovitel.co",
    role: "SUPERVISOR",
    status: "Activo",
    lastLogin: "14/04/2026 09:03",
    ...
  }
]
```

🎯 ¿QUÉ SUCEDE?
└─ Ahora el signal `users` contiene la lista de usuarios
└─ ¡El template automáticamente se actualiza!

═══════════════════════════════════════════════════════════════════════════════

PASO 10: TEMPLATE SE RENDERIZA AUTOMÁTICAMENTE
───────────────────────────────────────────────────────────────────────────────

📍 Archivo: users.component.html

```html
<!-- El template verifica si usersTableOpen() es true -->
@if (usersTableOpen()) {
  <div class="ut-scroll-wrapper">
    <div class="users-table">
      
      <!-- Encabezado -->
      <div class="ut-header">
        <span>Usuario</span>
        <span>Correo</span>
        <span>Rol</span>
        <span>Ultimo acceso</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>

      <!-- 👇 AQUÍ SE RENDERIZA CADA USUARIO 👇 -->
      @for (u of users(); track u.id) {
        <div class="ut-row">
          
          <!-- Columna 1: Avatar y nombre -->
          <div class="ut-name-cell">
            <div class="ut-avatar">{{ u.name.charAt(0) }}</div>
            <div>
              <div class="ut-name">{{ u.name }}</div>
              <div class="ut-id">{{ u.id }}</div>
            </div>
          </div>

          <!-- Columna 2: Email -->
          <div class="ut-email">{{ u.email }}</div>

          <!-- Columna 3: Rol -->
          <div class="ut-role">
            <span class="badge">{{ u.role }}</span>
          </div>

          <!-- Columna 4: Último acceso -->
          <div class="ut-login">{{ u.lastLogin }}</div>

          <!-- Columna 5: Estado -->
          <div class="ut-status">
            @if (u.status === 'Activo') {
              <span class="badge badge-success">Activo</span>
            } @else {
              <span class="badge badge-warning">Inactivo</span>
            }
          </div>

          <!-- Columna 6: Acciones -->
          <div class="ut-actions">
            <button (click)="toggleUserStatus(u.id)">
              {{ u.status === 'Activo' ? 'Desactivar' : 'Activar' }}
            </button>
            <button (click)="removeUser(u.id)">Eliminar</button>
          </div>
        </div>
      }
    </div>
  </div>
}
```

🎯 ¿QUÉ SUCEDE?
├─ @for (u of users(); track u.id) → Itera cada usuario del array
├─ {{ u.name }} → Renderiza el nombre
├─ {{ u.email }} → Renderiza el email
├─ {{ u.role }} → Renderiza el rol
├─ {{ u.lastLogin }} → Renderiza última fecha de acceso
├─ {{ u.status }} → Renderiza estado con color diferente
└─ Botones que llaman toggleUserStatus() o removeUser()

═══════════════════════════════════════════════════════════════════════════════

RESULTADO FINAL EN LA PANTALLA
───────────────────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────────────────┐
│ Gestión de Usuarios y Roles                                                 │
│ Control de acceso por rol para módulos del sistema.                        │
│                                                         [+ Nuevo Usuario]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Usuarios activos: 4  │ ADMINISTRADOR: 1  │ SUPERVISOR: 1  │ AGENTE: 1     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ▼ Tabla de Usuarios (4 registros)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Usuario              │ Correo                    │ Rol           │ ...     │
├─────────────────────────────────────────────────────────────────────────────┤
│ S System Adm.       │ admin@coovitel.co        │ ADMINISTRADOR │ ...     │
│   ID: 1             │                           │              │          │
├─────────────────────────────────────────────────────────────────────────────┤
│ L Laura Rodriguez    │ supervisor@coovitel.co   │ SUPERVISOR   │ ...     │
│   ID: 2             │                           │              │          │
├─────────────────────────────────────────────────────────────────────────────┤
│ A Agente Primero     │ agente01@coovitel.co     │ AGENTE       │ ...     │
│   ID: 3             │                           │              │          │
├─────────────────────────────────────────────────────────────────────────────┤
│ C Carlos Mejia       │ auditor@coovitel.co      │ AUDITOR      │ ...     │
│   ID: 4             │                           │              │          │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

📊 DIAGRAMA COMPLETO DEL FLUJO
───────────────────────────────────────────────────────────────────────────────

USUARIO ABRE SETTINGS
        │
        ▼
ngOnInit() se ejecuta
        │
        ▼
loadInitialData() se llama
        │
        ├─→ facade.getRoles()
        │
        └─→ facade.loadUsers() ◄────┐
                │                    │
                ▼                    │
        usersService.getAll()        │ (1) Pedir datos
                │                    │
                ▼                    │
        HTTP GET /users/all          │
                │                    │
    ┌───────────┴──────────────────┐ │
    │                              │ │
    │     BACKEND RESPONDE         │ │
    │     [usuario1, usuario2...]  │ │
    │                              │ │
    └──────────────┬───────────────┘ │
                   │                 │
                   ▼                 │
        tap() recibe respuesta ◄─────┘
                   │
                   ▼
        this.usersState.set(data)  (2) Guardar en signal
                   │
                   ▼
        this.facade.users()
        (El componente obtiene los usuarios)
                   │
                   ▼
        backendUsers.map(u => mapBackendUser(u))  (3) Transformar
                   │
                   ▼
        this.users.set(transformed)  (4) Guardar localmente
                   │
                   ▼
        Template se actualiza  (5) Renderizar tabla
                   │
                   ▼
        @if (usersTableOpen()) {
          @for (u of users()) {
            <div class="ut-row">...</div>
          }
        }
                   │
                   ▼
        TABLA CON USUARIOS VISIBLE EN PANTALLA ✅

═══════════════════════════════════════════════════════════════════════════════

⏱️ TIMELINE TEMPORAL
───────────────────────────────────────────────────────────────────────────────

T=0ms     Usuario abre Settings
T=50ms    ngOnInit() se ejecuta
T=100ms   loadInitialData() se llama
T=150ms   HTTP GET enviado al backend
T=200ms   Backend procesa la petición
T=250ms   Backend devuelve JSON
T=300ms   Frontend recibe respuesta (tap intercepts)
T=320ms   Data guardada en usersState signal
T=330ms   Componente obtiene usuarios del facade
T=340ms   Usuarios transformados con mapBackendUser()
T=350ms   Users signal actualizado
T=360ms   Template se re-renderiza
T=400ms   ✅ TABLA VISIBLE CON USUARIOS

═══════════════════════════════════════════════════════════════════════════════

🔑 PUNTOS CLAVE A RECORDAR
───────────────────────────────────────────────────────────────────────────────

1️⃣ ngOnInit() se ejecuta AUTOMÁTICAMENTE
   └─ Es el lugar perfecto para cargar datos

2️⃣ El Façade es el intermediario
   └─ El componente NO llama directamente al servicio
   └─ El componente NO hace HTTP directamente

3️⃣ El Servicio hace UNA SOLA cosa
   └─ Hacer la llamada HTTP

4️⃣ Los Signals son reactivos
   └─ Cuando usersState cambia, el template se actualiza automáticamente
   └─ No necesitas hacer nada más

5️⃣ mapBackendUser() transforma datos
   └─ El backend devuelve un formato
   └─ El componente lo convierte a otro formato
   └─ Esto desacopla frontend del backend

═══════════════════════════════════════════════════════════════════════════════

