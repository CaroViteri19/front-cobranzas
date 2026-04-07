import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  store = inject(StoreService);

  readonly stats = [
    { label: 'Cartera Total',         value: '$1.2B',  change: '+2.4%', positive: true,  icon: '🗄️' },
    { label: 'Tasa de Recuperación',  value: '78.5%',  change: '+5.2%', positive: true,  icon: '📊' },
    { label: 'Casos Activos',         value: '1,240',  change: '-12',   positive: false, icon: '💼' },
    { label: 'Efectividad Contacto',  value: '64.2%',  change: '+1.8%', positive: true,  icon: '💬' },
  ];

  readonly activityLog = [
    { user: 'Asesor 01',   action: 'Registró promesa de pago',       target: 'Lucía Méndez',      time: 'Hace 5m' },
    { user: 'Sistema IA',  action: 'Desbordó caso por alto riesgo',   target: 'Fernando Soto',     time: 'Hace 12m' },
    { user: 'Asesor 03',   action: 'Adjuntó evidencia de contacto',   target: 'Roberto Jaramillo', time: 'Hace 25m' },
    { user: 'Sistema IA',  action: 'Cerró caso por recaudo exitoso',  target: 'Elena Rivas',       time: 'Hace 1h' },
  ];
}
