import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import {
  ADMIN_AND_AUDITOR,
  ALL_ROLES,
  NON_AGENT_ROLES,
} from './core/auth/roles';

/**
 * Matriz de permisos por módulo.
 *
 * Módulo          | ADMINISTRADOR | SUPERVISOR | AGENTE | AUDITOR
 * --------------- | ------------- | ---------- | ------ | -------
 * Dashboard       | full          | full       | full   | read    → ALL_ROLES
 * Integración     | full          | read       | none   | read    → NON_AGENT_ROLES
 * Analítica       | full          | full       | none   | read    → NON_AGENT_ROLES
 * Políticas       | full          | read       | none   | read    → NON_AGENT_ROLES
 * Orquestación    | full          | full       | none   | read    → NON_AGENT_ROLES
 * Gestión Casos   | full          | full       | full   | read    → ALL_ROLES
 * Recaudo         | full          | full       | full   | read    → ALL_ROLES
 * Reportes        | full          | full       | read   | full    → ALL_ROLES
 * Configuración   | full          | none       | none   | read    → ADMIN_AND_AUDITOR
 *
 * Nota: ADMINISTRADOR está presente en TODAS las listas. Usar las constantes
 * de `core/auth/roles.ts` en lugar de literales para no introducir drift.
 */
export const routes: Routes = [
  // ── Pública ──────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  // ── Acceso denegado (403) ─────────────────────────────────────────────────
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // ── Área protegida ────────────────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // Dashboard – todos los roles
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: [...ALL_ROLES] },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // M1 Integración – sin AGENTE
      {
        path: 'integracion',
        canActivate: [roleGuard],
        data: { roles: [...NON_AGENT_ROLES] },
        loadComponent: () =>
          import('./features/integration/integration.component').then(m => m.IntegrationComponent)
      },

      // M2 Analítica – sin AGENTE
      {
        path: 'analitica',
        canActivate: [roleGuard],
        data: { roles: [...NON_AGENT_ROLES] },
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },

      // M3 Políticas – sin AGENTE
      {
        path: 'politicas',
        canActivate: [roleGuard],
        data: { roles: [...NON_AGENT_ROLES] },
        loadComponent: () =>
          import('./features/policies/policies.component').then(m => m.PoliciesComponent)
      },

      // M4 Orquestación – sin AGENTE
      {
        path: 'orquestacion',
        canActivate: [roleGuard],
        data: { roles: [...NON_AGENT_ROLES] },
        loadComponent: () =>
          import('./features/orchestration/orchestration.component').then(m => m.OrchestrationComponent)
      },

      // M5 Gestión de Casos – todos los roles
      {
        path: 'gestion-casos',
        canActivate: [roleGuard],
        data: { roles: [...ALL_ROLES] },
        loadComponent: () =>
          import('./features/case-management/case-management.component').then(m => m.CaseManagementComponent)
      },

      // M6 Recaudo – todos los roles
      {
        path: 'recaudo',
        canActivate: [roleGuard],
        data: { roles: [...ALL_ROLES] },
        loadComponent: () =>
          import('./features/recaudo/recaudo.component').then(m => m.RecaudoComponent)
      },

      // M7 Reportes – todos los roles
      {
        path: 'reporting',
        canActivate: [roleGuard],
        data: { roles: [...ALL_ROLES] },
        loadComponent: () =>
          import('./features/reporting/reporting.component').then(m => m.ReportingComponent)
      },

      // M8 Configuración – solo ADMINISTRADOR y AUDITOR
      {
        path: 'configuracion',
        canActivate: [roleGuard],
        data: { roles: [...ADMIN_AND_AUDITOR] },
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
