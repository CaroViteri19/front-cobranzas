import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-policies',
  imports: [CommonModule],
  templateUrl: './policies.component.html',
  styleUrl: './policies.component.css'
})
export class PoliciesComponent {
  store = inject(StoreService);

  readonly contactChannels = [
    { label: 'WhatsApp',     icon: '💬', allowed: true,  detail: 'Mensajes de texto y multimedia' },
    { label: 'SMS',          icon: '📱', allowed: true,  detail: 'Mensajes cortos' },
    { label: 'Email',        icon: '✉️', allowed: true,  detail: 'Correo formal' },
    { label: 'Llamada',      icon: '📞', allowed: true,  detail: 'L-V 7am - 7pm' },
    { label: 'Visita Domicilio', icon: '🏠', allowed: false, detail: 'No permitido Ley 2300' },
    { label: 'Redes Sociales',  icon: '👥', allowed: false, detail: 'No permitido Ley 2300' },
  ];

  readonly intensityColors: Record<string, string> = {
    'Baja':    'badge-success',
    'Media':   'badge-info',
    'Alta':    'badge-warning',
    'Crítica': 'badge-danger',
  };

  associatesInSegment(segmentName: string): number {
    return this.store.associates().filter(a => a.segment === segmentName).length;
  }
}
