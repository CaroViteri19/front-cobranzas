📖 GUÍA DE COMPRENSIÓN - MÓDULO DE USUARIOS

═══════════════════════════════════════════════════════════════════════════════

🎯 FLUJO DE DATOS EXPLICADO PASO A PASO

═══════════════════════════════════════════════════════════════════════════════

CUANDO EL USUARIO CARGA LA PÁGINA
───────────────────────────────────────────────────────────────────────────────

1. Se carga: users.component.ts
   └─ ngOnInit() se ejecuta

2. ngOnInit() llama a: loadInitialData()
   ├─ facade.getRoles() → obtiene lista de roles
   └─ facade.loadUsers() → carga usuarios del backend

3. El Façade llamó a: UsersService.getAll()
   └─ HTTP GET a: http://localhost:8080/users/all

4. Backend responde con lista de usuarios

5. El componente recibe los usuarios:
   ├─ Los transforma con mapBackendUser()
   └─ Los guarda en: users = signal<AppUser[]>([])

6. Template se actualiza automáticamente:
   ├─ Tabla se renderiza
   ├─ Cards muestran estadísticas
   └─ Usuario ve la interfaz completa

═══════════════════════════════════════════════════════════════════════════════

CUANDO EL USUARIO CREA UN NUEVO USUARIO
───────────────────────────────────────────────────────────────────────────────

1. Usuario hace click en: "+ Nuevo Usuario"
   └─ showNewUser.set(true) → muestra formulario

2. Usuario llena el formulario:
   ├─ Nombre completo
   ├─ Usuario
   ├─ Email
   ├─ Rol
   └─ Contraseña (con validaciones)

3. Usuario hace click en: "Crear usuario"
   └─ addUser() se ejecuta

4. addUser() valida:
   ├─ ¿Todos los campos están llenos?
   ├─ ¿Seleccionó un rol?
   └─ ¿La contraseña es segura? (12+ caracteres + 1 especial)

5. Si pasa validaciones:
   └─ Llama a: facade.createUserDirect(userData)

6. El Façade llama a: UsersService.register(userData)
   └─ HTTP POST a: http://localhost:8080/users/register
   └─ Envía los datos del nuevo usuario

7. Backend crea el usuario y devuelve los datos

8. El componente recibe el usuario creado:
   ├─ Lo agrega a la lista local: users.update(...)
   ├─ Limpia el formulario
   ├─ Cierra el formulario (showNewUser = false)
   └─ La tabla se actualiza automáticamente

═══════════════════════════════════════════════════════════════════════════════

CUANDO EL USUARIO CAMBIA ESTADO (Activo/Inactivo)
───────────────────────────────────────────────────────────────────────────────

1. Usuario hace click en botón: "Desactivar" o "Activar"
   └─ toggleUserStatus(userId) se ejecuta

2. Se cambia el estado en la lista local:
   ├─ Si estaba "Activo" → cambia a "Inactivo"
   └─ Si estaba "Inactivo" → cambia a "Activo"

3. Template se actualiza automáticamente:
   └─ El badge cambia color (verde ↔ naranja)

═══════════════════════════════════════════════════════════════════════════════

CUANDO EL USUARIO ELIMINA UN USUARIO
───────────────────────────────────────────────────────────────────────────────

1. Usuario hace click en botón: "Eliminar"
   └─ removeUser(userId) se ejecuta

2. Se elimina de la lista local:
   └─ users.update(list => list.filter(u => u.id !== id))

3. Template se actualiza automáticamente:
   └─ La fila desaparece de la tabla

═══════════════════════════════════════════════════════════════════════════════

🏗️ ARQUITECTURA EXPLICADA
───────────────────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│ COMPONENTE (users.component.ts)                             │
│ ✓ Maneja lógica de la página (mostrar formularios, etc)    │
│ ✓ Interactúa con el usuario (click, validar)              │
│ ✓ Usa Signals para estado reactivo                         │
│ ✗ NO hace llamadas HTTP directas al backend               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Inyección de dependencias
                     │ private readonly facade = inject(...)
                     │
┌────────────────────▼────────────────────────────────────────┐
│ FAÇADE SERVICE (settings-facade.service.ts)                │
│ ✓ Orquesta la lógica central                              │
│ ✓ Maneja estado con Signals                               │
│ ✓ Llama al servicio de usuarios cuando es necesario       │
│ ✓ Actualiza el estado de forma centralizada               │
│ ✗ NO hace llamadas HTTP directas                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Inyección de dependencias
                     │ constructor(private usersService: UsersService)
                     │
┌────────────────────▼────────────────────────────────────────┐
│ USERS SERVICE (users.service.ts)                           │
│ ✓ ÚNICA responsabilidad: Llamadas HTTP                     │
│ ✓ getAll() → GET /users/all                               │
│ ✓ register() → POST /users/register                        │
│ ✓ update() → PUT /users/{id}                              │
│ ✓ delete() → DELETE /users/{id}                            │
│ ✗ NO maneja lógica de negocio                              │
│ ✗ NO gestiona estado                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Client
                     │
┌────────────────────▼────────────────────────────────────────┐
│ BACKEND API (http://localhost:8080)                        │
│ ✓ Recibe las peticiones HTTP                               │
│ ✓ Procesa la lógica del servidor                           │
│ ✓ Devuelve datos en formato JSON                           │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

📝 SIGNALS (Reactividad)
───────────────────────────────────────────────────────────────────────────────

¿Qué son?
  └─ Variables "mágicas" que avisanautomáticamente cuando cambian

¿Cómo funcionan en users.component.ts?

  users = signal<AppUser[]>([])
  └─ Lista de usuarios que se muestra en la tabla

  Cuando haces:
    users.set([...])  ← Cambias el valor
    └─ ¡Automáticamente el template se actualiza!
    └─ No necesitas hacer manualmente re-renders

  Ejemplo en el template:
    {{ users().length }}
    └─ Siempre muestra el número actualizado
    └─ Si agregas un usuario, el número aumenta automáticamente

═══════════════════════════════════════════════════════════════════════════════

💡 VENTAJAS DE ESTA ARQUITECTURA
───────────────────────────────────────────────────────────────────────────────

✅ SEPARACIÓN DE RESPONSABILIDADES
   ├─ Componente: UI y lógica de presentación
   ├─ Façade: Orquestación y lógica central
   └─ Servicio: Comunicación con backend

✅ FÁCIL DE TESTEAR
   ├─ Cada parte se puede testear independientemente
   └─ No necesitas el backend para testear el componente

✅ REUTILIZABLE
   ├─ Otro componente puede usar el mismo Façade
   └─ Outro componente puede usar el mismo Servicio

✅ MANTENIBLE
   ├─ Si el backend cambia, solo cambias el Servicio
   ├─ Si la lógica cambia, solo cambias el Façade
   └─ Si la UI cambia, solo cambias el Componente

═══════════════════════════════════════════════════════════════════════════════

🔄 CAMBIAR DATOS LOCALES (Sin ir al backend)
───────────────────────────────────────────────────────────────────────────────

Algunas acciones NO van al backend, solo actualizan la UI local:

❌ toggleUserStatus()
   └─ Solo cambia la UI (Activo ↔ Inactivo)
   └─ En el backend aún tiene el estado anterior
   └─ Esto debería mejorarase en el futuro

❌ removeUser()
   └─ Solo elimina de la lista visual
   └─ En el backend el usuario sigue existiendo
   └─ Esto debería mejorarase en el futuro

✅ addUser()
   └─ Va al backend y guarda
   └─ Luego actualiza la lista local
   └─ Es correcto

═══════════════════════════════════════════════════════════════════════════════

📊 FLUJO GENERAL (RESUMEN)

Usuario                Template              Componente           Façade
  │                       │                       │                 │
  ├─→ Click "+Nuevo"     │                       │                 │
  │                       ├─→ showNewUser.set() │                 │
  │                    (Formulario)              │                 │
  │                       │                       │                 │
  ├─→ Rellena datos       │                       │                 │
  │                       │                       │                 │
  ├─→ Click "Crear"       │                       │                 │
  │                       ├─→ addUser()          │                 │
  │                       │                    ├─→ Valida        │
  │                       │                    ├─→ createUserDirect()
  │                       │                    │                  ├─→ UsersService.register()
  │                       │                    │                  │  └─→ HTTP POST
  │                       │                    │                  │
  │                       │              (Espera respuesta)
  │                       │                    │                  │
  │                       │                 (Recibe usuario)      │
  │                       │                    │                  │
  │                       ├─ users.update()   │                 │
  │                       │ (Tabla se actualiza automáticamente)
  │                       │                       │                 │
  └─→ Ve usuario agregado │                       │                 │

═══════════════════════════════════════════════════════════════════════════════

✨ CONCLUSIÓN

La arquitectura es como un **flujo de agua**:

  Usuario
    ↓
  Componente (recibe clicks)
    ↓
  Façade (organiza la lógica)
    ↓
  Servicio (habla con el backend)
    ↓
  Backend (procesa)
    ↓
  Servicio (devuelve datos)
    ↓
  Façade (actualiza estado)
    ↓
  Componente (actualiza template)
    ↓
  Usuario (ve el resultado)

Cada paso tiene una responsabilidad clara y no se cruza con los otros.

═══════════════════════════════════════════════════════════════════════════════

