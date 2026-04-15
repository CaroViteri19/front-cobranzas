import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

/**
 * Matriz de permisos por módulo (fuente: settings.component.ts)
 *
 * Módulo          | ADMINISTRADOR | SUPERVISOR | AGENTE | AUDITOR
 * --------------- | ------------- | ---------- | ------ | -------
 * Dashboard       | full          | full       | full   | read    → todos
 * Integración     | full          | read       | none   | read    → sin AGENTE
 * Analítica       | full          | full       | none   | read    → sin AGENTE
 * Políticas       | full          | read       | none   | read    → sin AGENTE
 * Orquestación    | full          | full       | none   | read    → sin AGENTE
 * Gestión Casos   | full          | full       | full   | read    → todos
 * Recaudo         | full          | full       | full   | read    → todos
 * Reportes        | full          | full       | read   | full    → todos
 * Configuración   | full          | none       | none   | read    → ADMIN y AUDITOR
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
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // M1 Integración – sin AGENTE
      {
        path: 'integracion',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/integration/integration.component').then(m => m.IntegrationComponent)
      },

      // M2 Analítica – sin AGENTE
      {
        path: 'analitica',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },

      // M3 Políticas – sin AGENTE
      {
        path: 'politicas',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/policies/policies.component').then(m => m.PoliciesComponent)
      },

      // M4 Orquestación – sin AGENTE
      {
        path: 'orquestacion',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR'] },
        loadComponent: () =>
          import('./features/orchestration/orchestration.component').then(m => m.OrchestrationComponent)
      },

      // M5 Gestión de Casos – todos los roles
      {
        path: 'gestion-casos',
        loadComponent: () =>
          import('./features/case-management/case-management.component').then(m => m.CaseManagementComponent)
      },

      // M6 Recaudo – todos los roles
      {
        path: 'recaudo',
        loadComponent: () =>
          import('./features/recaudo/recaudo.component').then(m => m.RecaudoComponent)
      },

      // M7 Reportes – todos los roles
      {
        path: 'reporting',
        loadComponent: () =>
          import('./features/reporting/reporting.component').then(m => m.ReportingComponent)
      },

      // M8 Configuración – solo ADMINISTRADOR y AUDITOR
      {
        path: 'configuracion',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR', 'AUDITOR', 'ADMIN'] },
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
