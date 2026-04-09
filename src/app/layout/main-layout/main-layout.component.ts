import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  readonly session   = this.auth.session;
  readonly collapsed = signal(false);

  readonly navItems: NavItem[] = [
    { id: 'dashboard',     label: 'Dashboard General', icon: '⊞',  route: '/dashboard' },
    { id: 'integracion',   label: 'M1. Integración',   icon: '🔗', route: '/integracion' },
    { id: 'analitica',     label: 'M2. Analítica',     icon: '📊', route: '/analitica' },
    { id: 'politicas',     label: 'M3. Políticas',     icon: '⚙️', route: '/politicas' },
    { id: 'orquestacion',  label: 'M4. Orquestación',  icon: '💬', route: '/orquestacion' },
    { id: 'gestion-casos', label: 'M5. Gestión Casos', icon: '💼', route: '/gestion-casos' },
    { id: 'recaudo',       label: 'M6. Recaudo',       icon: '💰', route: '/recaudo' },
    { id: 'reporting',     label: 'M7. Reporting',     icon: '📈', route: '/reporting' },
    { id: 'configuracion', label: 'Configuración',     icon: '🔧', route: '/configuracion' },
  ];

  readonly userInitials = computed(() => {
    const name = this.session()?.username ?? '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  });

  toggleSidebar(): void {
    this.collapsed.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
