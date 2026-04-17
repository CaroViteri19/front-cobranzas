# ⚡ QUICK START - ARQUITECTURA SETTINGS

## En 5 Minutos: Lo que Necesitas Saber

### La Estructura
```
settings/
├── shared/          ← Reutilizable (Models, Componentes, Servicios)
├── modules/         ← Submodulos (Usuarios, Políticas, etc)
└── settings.component.ts ← Orquestador
```

### Los 5 Patrones Clave
1. **Façade** - Un servicio orquesta todo
2. **Signals** - Estado reactivo automático
3. **Generic Table** - Una tabla para todo
4. **Generic Modal** - Un modal para todo
5. **Servicios Especializados** - Cada submodulo su servicio

---

## Cómo Crear un Nuevo Módulo en 5 Pasos

### Paso 1: Copiar Estructura de Users
```bash
cp -r modules/users modules/policies
```

### Paso 2: Cambiar Nombres
```bash
# En policies.component.ts:
PoliciesComponent (era: UsersComponent)
Policies (era: Users)
```

### Paso 3: Crear Servicio
```typescript
// modules/policies/services/policies.service.ts
export class PoliciesService {
  getAll(): Observable<Policy[]> { }
  create(data): Observable<Policy> { }
  // ... resto
}
```

### Paso 4: Extender Façade
```typescript
// En settings-facade.service.ts:
private policiesState = signal<Policy[]>([]);
loadPolicies() { /* carga datos */ }
createPolicy(data) { /* crea */ }
```

### Paso 5: Registrar en Settings
```typescript
// settings.component.ts
import { PoliciesComponent } from './modules/policies/policies.component';

@case ('policies') {
  <app-policies-module></app-policies-module>
}
```

¡Listo! Tu nuevo módulo está funcionando.

---

## Comandos Rápidos

```bash
# Ver la app
npm serve
# http://localhost:4200/settings

# Compilar
npm run build

# Validar estructura
bash validate-architecture.sh

# Leer documentación
cat ARCHITECTURE_GUIDE.md
cat TEMPLATE_NUEVO_MODULO.ts
```

---

## Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `shared/services/settings-facade.service.ts` | Orquestador central |
| `shared/components/generic-table/` | Tabla reutilizable |
| `shared/components/modal-editor/` | Modal reutilizable |
| `modules/users/` | Ejemplo completo |
| `TEMPLATE_NUEVO_MODULO.ts` | Plantilla copypasta |

---

## Troubleshooting

**Error: Module not found**
→ Verifica rutas relativas con `../`

**Modal no aparece**
→ Usa `[isOpen]="miSignal"` no `[isOpen]="true"`

**Tabla no se actualiza**
→ Usa `users()` con paréntesis

**Backend no responde**
→ Verifica `http://localhost:8080`

---

## Próximos Pasos

1. Probar en navegador (5 min)
2. Crear módulo de Políticas (2 horas)
3. Crear módulo de Estados (2 horas)
4. Leer documentación completa (1 hora)

---

**¿Necesitas ayuda?** Lee:
- `DOCUMENTATION_INDEX.md` - Índice de todo
- `ARCHITECTURE_GUIDE.md` - Guía completa
- `TEMPLATE_NUEVO_MODULO.ts` - Paso a paso

**¡Ahora sí, a trabajar!** 🚀

