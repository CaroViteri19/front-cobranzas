import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
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
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'integracion',
        loadComponent: () =>
          import('./features/integration/integration.component').then(m => m.IntegrationComponent)
      },
      {
        path: 'analitica',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'politicas',
        loadComponent: () =>
          import('./features/policies/policies.component').then(m => m.PoliciesComponent)
      },
      {
        path: 'orquestacion',
        loadComponent: () =>
          import('./features/orchestration/orchestration.component').then(m => m.OrchestrationComponent)
      },
      {
        path: 'gestion-casos',
        loadComponent: () =>
          import('./features/case-management/case-management.component').then(m => m.CaseManagementComponent)
      },
      {
        path: 'recaudo',
        loadComponent: () =>
          import('./features/recaudo/recaudo.component').then(m => m.RecaudoComponent)
      },
      {
        path: 'reporting',
        loadComponent: () =>
          import('./features/reporting/reporting.component').then(m => m.ReportingComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
