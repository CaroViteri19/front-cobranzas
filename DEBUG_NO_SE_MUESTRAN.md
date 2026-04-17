🔍 DEBUG: POR QUÉ NO SE MUESTRAN LOS USUARIOS

═══════════════════════════════════════════════════════════════════════════════

PASO 1: VERIFICAR QUE EL BACKEND ESTÁ CORRIENDO
───────────────────────────────────────────────────────────────────────────────

En otra terminal, ejecuta:

```bash
# Verificar si el backend está en línea
curl http://localhost:8080/users/all
```

Si ves un ERROR:
├─ "Connection refused" → El backend NO está corriendo
├─ Timeout → El backend está muy lento
└─ JSON response → ✅ El backend SÍ responde

SOLUCIÓN: Si el backend no responde, tienes que iniciarlo PRIMERO.

═══════════════════════════════════════════════════════════════════════════════

PASO 2: VERIFICAR LA CONSOLA DEL NAVEGADOR
───────────────────────────────────────────────────────────────────────────────

En el navegador (Chrome/Firefox):

1. Abre: http://localhost:4200/settings
2. Click derecho → "Inspeccionar" (o F12)
3. Ve a la pestaña "Console"
4. Busca ERRORES en rojo

¿QUÉ BUSCAR?

❌ ERROR: "Cannot find module"
   └─ Componente no está registrado

❌ ERROR: "Cannot read property 'users'"
   └─ El façade no existe o no está inyectado

❌ ERROR: "Failed to fetch"
   └─ El backend no responde

❌ ERROR: "Unexpected token"
   └─ Error en el JSON del backend

✅ MENSAJE: "Renderizando tabla..."
   └─ Significa que la tabla se está dibujando

═══════════════════════════════════════════════════════════════════════════════

PASO 3: VERIFICAR QUE EL COMPONENTE ESTÁ REGISTRADO
───────────────────────────────────────────────────────────────────────────────

En settings.component.ts:

```typescript
import { UsersComponent } from './modules/users/users.component';

@Component({
  imports: [
    // ... otros imports ...
    UsersComponent,  // 👈 ¿ESTÁ AQUÍ?
  ]
})
export class SettingsComponent {}
```

❌ Si NO está importado:
   └─ Agrega la línea de import

En settings.component.html:

```html
@switch (activeTab()) {
  @case ('users') {
    <app-users-module></app-users-module>  <!-- 👈 ¿ESTÁ AQUÍ? -->
  }
}
```

❌ Si NO está aquí:
   └─ Agrega este caso al switch

═══════════════════════════════════════════════════════════════════════════════

PASO 4: BUSCAR ERRORES EN EL COMPONENTE
───────────────────────────────────────────────────────────────────────────────

En la consola (F12), ejecuta:

```javascript
// Verifica que el componente existe
console.log('UsersComponent cargado:', typeof UsersComponent);

// Verifica que el façade inyecta
console.log('Componente creado correctamente');
```

═══════════════════════════════════════════════════════════════════════════════

PASO 5: BUSCAR ERRORES EN NETWORK (Peticiones HTTP)
───────────────────────────────────────────────────────────────────────────────

En el navegador (F12):

1. Ve a la pestaña "Network"
2. Recarga la página (F5)
3. Busca una petición a: "localhost:8080/users/all"

¿QUÉ VES?

❌ NO VES NADA:
   └─ El componente no está haciendo la petición
   └─ Verifica que ngOnInit() se ejecuta

✅ VES UNA PETICIÓN:
   └─ Click en ella
   └─ Ve la pestaña "Response"
   └─ ¿Ves JSON con usuarios? (Si)
   └─ ¿O ves error? (No)

❌ VES ERROR:
   └─ Status 404: El endpoint no existe
   └─ Status 500: Error en el backend
   └─ Status 0: No hay conexión al backend

═══════════════════════════════════════════════════════════════════════════════

PASO 6: AGREGAR LOGS PARA DEBUG
───────────────────────────────────────────────────────────────────────────────

En users.component.ts, modifica ngOnInit():

```typescript
ngOnInit(): void {
  console.log('1. ngOnInit ejecutado');
  void this.loadInitialData();
}

private async loadInitialData(): Promise<void> {
  console.log('2. loadInitialData ejecutado');
  
  this.facade.getRoles();
  this.availableRoles.set(this.fallbackRoles);

  try {
    console.log('3. Llamando a facade.loadUsers()');
    this.facade.loadUsers();
    
    const backendUsers = this.facade.users();
    console.log('4. Usuarios del facade:', backendUsers);
    
    const transformed = backendUsers.map((u, index) => {
      console.log('5. Transformando usuario:', u);
      return this.mapBackendUser(u, index);
    });
    
    console.log('6. Usuarios transformados:', transformed);
    this.users.set(transformed);
    console.log('7. Users signal actualizado');
  } catch (err) {
    console.error('ERROR en loadInitialData:', err);
    this.users.set([]);
  }
}
```

ABRE LA CONSOLA Y VE LOS NÚMEROS 1-7:

✅ 1 → ngOnInit se ejecuta
❌ NO ves 1 → El componente no se está creando

✅ 1,2,3 → La cadena se ejecuta
❌ Para en 3 → El façade no existe o error

✅ 1,2,3,4 → El façade tiene usuarios
❌ 4 está vacío → El backend no devolvió datos

═══════════════════════════════════════════════════════════════════════════════

PASO 7: VERIFICAR EL FAÇADE
───────────────────────────────────────────────────────────────────────────────

En settings-facade.service.ts:

```typescript
loadUsers() {
  console.log('Facade: iniciando carga de usuarios');
  
  this.usersLoadingState.set(true);
  this.usersErrorState.set(null);

  this.usersService
    .getAll()
    .pipe(
      tap((data) => {
        console.log('Facade: datos recibidos del backend:', data);
        this.usersState.set(data);
        this.usersLoadingState.set(false);
      }),
      catchError((err) => {
        console.error('Facade: ERROR', err);
        this.usersErrorState.set(err?.error?.message || 'Error al cargar');
        this.usersLoadingState.set(false);
        return of([]);
      })
    )
    .subscribe();
}
```

═══════════════════════════════════════════════════════════════════════════════

PASO 8: REVISAR users.component.html
───────────────────────────────────────────────────────────────────────────────

⚠️ ENCONTRÉ UN PROBLEMA:

```html
@if (usersTableOpen()) {
  console.log('Renderizando tabla de usuarios con', users().length, 'usuarios');
  <div class="ut-scroll-wrapper">
```

❌ ESTO NO FUNCIONA: No puedes poner console.log() en el HTML

SOLUCIÓN: Elimina esa línea

```html
@if (usersTableOpen()) {
  <!-- Línea del console.log ELIMINADA -->
  <div class="ut-scroll-wrapper">
```

═══════════════════════════════════════════════════════════════════════════════

RESUMEN DE PROBLEMAS COMUNES Y SOLUCIONES
───────────────────────────────────────────────────────────────────────────────

PROBLEMA 1: La tabla está colapsada
├─ SÍNTOMA: No ves la tabla (solo ves el botón ▶)
├─ CAUSA: usersTableOpen está en false
└─ SOLUCIÓN: Click en el botón "Tabla de Usuarios" para expandir

PROBLEMA 2: La tabla está vacía (0 registros)
├─ SÍNTOMA: Ves "0 registros" pero users() está vacío
├─ CAUSA: Los usuarios no se cargaron del backend
└─ SOLUCIÓN:
   ├─ Verifica que el backend devuelve usuarios
   ├─ Verifica que la URL es correcta: /users/all
   └─ Verifica en Network que ves la petición

PROBLEMA 3: Error "Cannot find module"
├─ SÍNTOMA: Rojo en la consola
├─ CAUSA: El componente no está importado en settings.component.ts
└─ SOLUCIÓN: Agrega import en settings.component.ts

PROBLEMA 4: Tabla aparece pero no llena
├─ SÍNTOMA: Ves estructura pero sin datos
├─ CAUSA: El @for no itera
└─ SOLUCIÓN:
   ├─ Verifica que users() tiene datos
   ├─ Verifica que @for está dentro de @if
   └─ Verifica que track u.id es correcto

═══════════════════════════════════════════════════════════════════════════════

PASO A PASO PARA VALIDAR TODO:
───────────────────────────────────────────────────────────────────────────────

1️⃣ TERMINAL: Verifica backend
```bash
curl http://localhost:8080/users/all
```
✅ Si ves JSON, el backend funciona
❌ Si ves error, inicia el backend

2️⃣ NAVEGADOR: Abre DevTools (F12)
├─ Console
└─ Network

3️⃣ RECARGA: Presiona F5

4️⃣ CONSOLA: Busca los logs que agregaste
├─ ¿Ves "1. ngOnInit ejecutado"?
├─ ¿Ves "2. loadInitialData ejecutado"?
├─ ¿Ves "4. Usuarios del facade:"?
└─ Si ves todos, entonces LOS DATOS SÍ LLEGARON

5️⃣ NETWORK: Busca la petición HTTP
├─ ¿Ves POST/GET a localhost:8080?
├─ ¿Response tiene usuarios?
└─ Si sí, entonces el backend funciona

6️⃣ PÁGINA: ¿Ves la tabla?
├─ ¿Está expandida (click en ▼)?
├─ ¿Tiene registros?
└─ Si no, revisa los logs

═══════════════════════════════════════════════════════════════════════════════

HOJA DE CHEQUEO FINAL:
───────────────────────────────────────────────────────────────────────────────

□ Backend está corriendo (curl devuelve JSON)
□ Componente está importado en settings.component.ts
□ Componente está en settings.component.html (@case 'users')
□ ngOnInit() se ejecuta (ves log 1)
□ loadInitialData() se ejecuta (ves log 2)
□ Petición HTTP se hace (ves en Network)
□ Datos llegan del backend (ves log 4 con datos)
□ Tabla está expandida (click en botón para expandir)
□ @for renderiza cada usuario (ves filas)
□ Datos aparecen en celdas

═══════════════════════════════════════════════════════════════════════════════

¿TIENES ERRORES EN CONSOLA?

Cópiame el error exacto (la línea roja) y aquí te digo qué hacer.

═══════════════════════════════════════════════════════════════════════════════

