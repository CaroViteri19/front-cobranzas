import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntegrationService } from './integration.service';

interface BatchRecord {
  name: string;
  records: number;
  errors: number;
  date: string;
  status: 'Exitoso' | 'Parcial' | 'Error';
}

@Component({
  selector: 'app-integration',
  imports: [CommonModule],
  templateUrl: './integration.component.html',
  styleUrl: './integration.component.css'
})
export class IntegrationComponent {
  private readonly integrationService = inject(IntegrationService);

  uploading = signal(false);
  progress  = signal(0);
  private timer: any;

  readonly endpoints = [
    { path: '/api/v1/cartera/sync',       method: 'POST', status: 200, time: 'Hace 2 min' },
    { path: '/api/v1/pagos/notificar',    method: 'POST', status: 200, time: 'Hace 5 min' },
    { path: '/api/v1/asociados/perfil',   method: 'GET',  status: 200, time: 'Hace 12 min' },
  ];

  readonly batches: BatchRecord[] = [
    { name: 'Lote_Marzo_Q1.txt',     records: 12500, errors: 0,  date: '15 Mar 2024', status: 'Exitoso' },
    { name: 'Novedades_Nomina.csv',  records: 4200,  errors: 12, date: '14 Mar 2024', status: 'Parcial' },
    { name: 'Ajustes_Saldos_V2.txt', records: 850,   errors: 0,  date: '12 Mar 2024', status: 'Exitoso' },
  ];

  simulateUpload(): void {
    this.uploading.set(true);
    this.progress.set(0);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const next = this.progress() + 5;
      if (next >= 100) {
        this.progress.set(100);
        clearInterval(this.timer);
        setTimeout(() => this.uploading.set(false), 800);
      } else {
        this.progress.set(next);
      }
    }, 100);
  }
}
