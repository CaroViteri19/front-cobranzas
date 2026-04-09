import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de roles que protege rutas según la matriz de permisos definida en app.routes.ts.
 *
 * Uso en la definición de ruta:
 * ```ts
 * {
 *   path: 'integracion',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR'] },
 *   loadComponent: () => import(...)
 * }
 * ```
 *
 * Si la ruta no define `data.roles`, se permite el acceso a cualquier usuario autenticado.
 * Si el usuario no tiene el rol requerido, se redirige a /unauthorized (403).
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Si la ruta no especifica roles permitidos, cualquier usuario autenticado puede acceder
  const requiredRoles: string[] | undefined = route.data['roles'];
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Verificar si el usuario tiene al menos uno de los roles requeridos
  if (auth.hasAnyRole(...requiredRoles)) {
    return true;
  }

  // Sin permiso → redirigir a página 403
  router.navigate(['/unauthorized']);
  return false;
};
