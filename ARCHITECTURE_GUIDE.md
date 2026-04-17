# 📐 Guía de Arquitectura del Módulo Settings

## 1. Estructura Implementada

```
settings/
├── settings.component.ts          # Componente principal (orquestador)
├── settings.component.html        # Template principal
├── settings.component.css         # Estilos globales
│
├── shared/                        # 🔧 Código compartido entre todos los submodulos
│   ├── models/
│   │   ├── index.ts
│   │   ├── user.model.ts          # Interfaces de Usuario
│   │   ├── settings.models.ts     # Políticas, Estados, Reglas, etc
│   │   └── pagination.model.ts    # Paginación genérica
│   │
│   ├── components/
│   │   ├── index.ts
│   │   ├── generic-table/
│   │   │   └── generic-table.component.ts    # Tabla reutilizable
│   │   └── modal-editor/
│   │       └── modal-editor.component.ts     # Modal reutilizable
│   │
│   └── services/
│       ├── index.ts
│       └── settings-facade.service.ts        # Orquestador centralizado
│
├── modules/                       # 📦 Submodulos independientes
│   ├── users/                     # Gestión de Usuarios
│   │   ├── users.component.ts
│   │   ├── users.component.html
│   │   ├── users.component.css
│   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── users.service.ts   # Llamadas API específicas
│   │   └── index.ts
│   │
│   ├── policies/                  # (Próxima implementación)
│   │   └── ...similar structure...
│   │
│   ├── case-statuses/
│   │   └── ...similar structure...
│   │
│   ├── assignment-rules/
│   │   └── ...similar structure...
│   │
│   ├── file-structure/
│   │   └── ...similar structure...
│   │
│   └── security/
│       └── ...similar structure...
│
└── tabs/                          # (Legado - se eliminarán gradualmente)
    ├── settings-users-tab.component.ts         # DEPRECADO (usar modules/users)
    ├── settings-policies-tab.component.ts      # DEPRECADO
    └── ...otros tabs antiguos...
```

---

## 2. Patrones y Conceptos Clave

### 📍 A. Facade Pattern (SettingsFacadeService)

El `SettingsFacadeService` actúa como intermediario entre los componentes y los servicios especializados:

```typescript
// ✅ CORRECTO: Uso a través del facade
export class UsersComponent {
  constructor(private facade: SettingsFacadeService) {}
  
  ngOnInit() {
    this.facade.loadUsers();  // Carga usuarios
    this.facade.getRoles();   // Obtiene roles disponibles
  }
}
```

**Ventajas:**
- Single source of truth para el estado
- Fácil de testear
- Cambios en APIs solo afectan el facade
- Control centralizado

---

### 📍 B. Signals (Estado Reactivo)

Todos los estados usan Angular Signals para reactividad:

```typescript
// En el facade
private usersState = signal<User[]>([]);
readonly users = this.usersState.asReadonly();  // Expone como readonly

// En el componente
users = this.facade.users;  // Acceso reactivo

// En el template
{{ users().length }}  // Reactivo automáticamente
```

---

### 📍 C. Componentes Genéricos Reutilizables

#### GenericTable
Tabla reutilizable que funciona con cualquier tipo de datos:

```typescript
<app-generic-table
  [columns]="usersColumns"           // Definición de columnas
  [data]="users()"                   // Datos
  [loading]="usersLoading()"         # Estado
  [showActions]="true"               # Mostrar Editar/Eliminar
  (editClick)="onTableEdit($event)"
  (deleteClick)="onTableDelete($event)"
/>
```

#### ModalEditor
Modal reutilizable para crear/editar:

```typescript
<app-modal-editor
  [isOpen]="showEditModal"
  [config]="{ title: 'Editar Usuario', submitLabel: 'Guardar' }"
  [submitting]="savingUser()"
  (onSubmit)="submitEdit()"
  (onClose)="closeModal()"
>
  <!-- Tu contenido del modal aquí -->
  <input [(ngModel)]="user.name" />
</app-modal-editor>
```

---

### 📍 D. Estructura de un Servicio Especializado

**`modules/users/services/users.service.ts`:**

```typescript
@Injectable({ providedIn: 'root' })
export class UsersService {
  private apiUrl = 'http://localhost:8080/users';

  constructor(private http: HttpClient) {}

  // Métodos específicos del dominio
  getAll(): Observable<User[]> { }
  getById(id: string): Observable<User> { }
  create(user: CreateUserDTO): Observable<User> { }
  update(id: string, user: Partial<User>): Promise<User> { }
  delete(id: string): Promise<void> { }
  getRoles(): Promise<RoleOption[]> { }
}
```

**Responsabilidades:**
- ✅ Llamadas HTTP específicas
- ✅ Mapeo de DTOs
- ✅ Caché local (opcional)
- ❌ NO gestiona estado global
- ❌ NO lógica de negocio compleja

---

## 3. Cómo Usar la Arquitectura

### 🔵 Para Crear un Nuevo Submodulo (Ej: Policies)

**Paso 1: Crear estructura**
```bash
mkdir -p src/app/features/settings/modules/policies/{services,components}
touch src/app/features/settings/modules/policies/policies.component.ts
touch src/app/features/settings/modules/policies/policies.component.html
touch src/app/features/settings/modules/policies/services/policies.service.ts
```

**Paso 2: Crear modelo**
```typescript
// policies.model.ts
export interface Policy {
  id: string;
  name: string;
  segment: string;
  intensity: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}
```

**Paso 3: Crear servicio**
```typescript
@Injectable({ providedIn: 'root' })
export class PoliciesService {
  constructor(private http: HttpClient) {}
  
  getAll(): Observable<Policy[]> {
    return this.http.get<Policy[]>('http://localhost:8080/policies');
  }
  
  create(policy: Policy): Observable<Policy> {
    return this.http.post<Policy>('http://localhost:8080/policies', policy);
  }
  
  update(id: string, policy: Partial<Policy>): Observable<Policy> {
    return this.http.put<Policy>(`http://localhost:8080/policies/${id}`, policy);
  }
  
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`http://localhost:8080/policies/${id}`);
  }
}
```

**Paso 4: Extender el Facade**
```typescript
// En settings-facade.service.ts, agregar:
private policiesState = signal<Policy[]>([]);
readonly policies = this.policiesState.asReadonly();

loadPolicies() {
  this.policiesService.getAll()
    .pipe(
      tap((policies) => this.policiesState.set(policies)),
      catchError((err) => {
        this.errorState.set(err.message);
        return of([]);
      })
    )
    .subscribe();
}

createPolicy(policy: Policy) {
  return this.policiesService.create(policy).pipe(
    tap((created) => {
      this.policiesState.update((list) => [...list, created]);
    })
  ).toPromise();
}
```

**Paso 5: Crear componente**
```typescript
@Component({
  selector: 'app-policies-module',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalEditorComponent],
  templateUrl: './policies.component.html'
})
export class PoliciesComponent implements OnInit {
  constructor(private facade: SettingsFacadeService) {}
  
  policies = this.facade.policies;
  
  ngOnInit() {
    this.facade.loadPolicies();
  }
  
  createPolicy(policy: Policy) {
    this.facade.createPolicy(policy);
  }
}
```

**Paso 6: Registrar en Settings**
```typescript
// settings.component.ts
import { PoliciesComponent } from './modules/policies/policies.component';

@Component({
  imports: [
    // ...existing...
    PoliciesComponent
  ]
})
export class SettingsComponent {}

// settings.component.html
@case ('policies') {
  <app-policies-module></app-policies-module>
}
```

---

## 4. Flujo de Datos (Data Flow)

```
┌─────────────────────────────────────────────────┐
│         Usuario interactúa con UI               │
│      (Click en Editar, Crear, Eliminar)         │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│    UsersComponent (.ts)                         │
│    - Detecta evento (editClick)                 │
│    - Llama facade.updateUser()                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│    SettingsFacadeService                        │
│    - Orquesta la llamada                        │
│    - Llama UsersService.update()                │
│    - Actualiza state con signal                 │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│    UsersService                                 │
│    - Hace POST HTTP a /users/{id}               │
│    - Retorna Observable<User>                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│    Backend API                                  │
│    - Procesa request                            │
│    - Retorna User actualizado                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│    Facade recibe respuesta                      │
│    - Actualiza usersState signal                │
│    - Todos los componentes reaccionan           │
│      (GenericTable se re-renderiza)             │
└─────────────────────────────────────────────────┘
```

---

## 5. Testing

### Testear un Servicio
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService]
    });
    
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch users', () => {
    const mockUsers: User[] = [
      { id: '1', fullname: 'Test', email: 'test@test.com', role: 'AGENTE', status: 'Active', lastSeen: new Date().toISOString() }
    ];

    service.getAll().subscribe((users) => {
      expect(users.length).toBe(1);
      expect(users[0].fullname).toBe('Test');
    });

    const req = httpMock.expectOne('http://localhost:8080/users/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});
```

### Testear el Facade
```typescript
describe('SettingsFacadeService', () => {
  let facade: SettingsFacadeService;
  let usersServiceMock: jasmine.SpyObj<UsersService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('UsersService', ['getAll']);
    
    TestBed.configureTestingModule({
      providers: [
        SettingsFacadeService,
        { provide: UsersService, useValue: spy }
      ]
    });
    
    facade = TestBed.inject(SettingsFacadeService);
    usersServiceMock = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
  });

  it('should load users and update state', () => {
    const mockUsers: User[] = [...];
    usersServiceMock.getAll.and.returnValue(of(mockUsers));

    facade.loadUsers();

    expect(facade.users().length).toBe(1);
  });
});
```

---

## 6. Performance Tips

### ✅ DO
- Usar `signal().asReadonly()` para exponer estado
- Implementar `OnDestroy` y unsubscribe en componentes
- Usar `shareReplay()` en observables del facade
- Lazy load módulos cuando sea posible

### ❌ DON'T
- No cambiar estado directamente desde componentes
- No hacer llamadas HTTP sin el facade
- No usar RxJS sin manejar subscripciones
- No crear servicios sin inyección de dependencias

---

## 7. Migración de Componentes Antiguos

**Pasos para migrar un tab antiguo a nuevo módulo:**

1. **Copiar lógica** del tab antiguo al nuevo componente
2. **Reemplazar UserService (core)** por el nuevo UsersService
3. **Usar Facade** en lugar de llamadas directas
4. **Usar GenericTable y ModalEditor** para UI consistente
5. **Eliminar tab antiguo** después de validar

---

## 8. Checklist para Nuevo Submodulo

```
☐ Crear carpeta en modules/
☐ Crear archivo .component.ts
☐ Crear archivo .component.html
☐ Crear archivo .component.css
☐ Crear archivo .model.ts en shared/models/
☐ Crear archivo .service.ts en modules/{submodulo}/services/
☐ Extender SettingsFacadeService con nuevas acciones
☐ Crear GenericTableComponent si aplica
☐ Registrar en settings.component.ts imports
☐ Registrar en settings.component.html switch case
☐ Testear en navegador
☐ Implementar lazy loading de rutas (opcional)
```

---

## 9. URLs Importantes

- **Backend Users**: `http://localhost:8080/users`
- **Backend Users All**: `http://localhost:8080/users/all`

---

## 10. Próximos Pasos

1. ✅ Validar que Users funciona correctamente
2. ⏳ Implementar Policies usando el mismo patrón
3. ⏳ Implementar CaseStatuses
4. ⏳ Implementar AssignmentRules
5. ⏳ Implementar FileStructure
6. ⏳ Implementar Security
7. ⏳ Implementar Lazy Loading de rutas
8. ⏳ Eliminar tabs antiguos gradualmente

---

**Versión**: 1.0  
**Fecha**: 2026-04-17  
**Status**: En Implementación

