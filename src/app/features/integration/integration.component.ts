import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import {
  BatchResultResponse,
  IntegrationService,
} from './integration.service';

interface BatchRecord {
  id: string;
  name: string;
  records: number;
  errors: number;
  date: string;
  status: 'Exitoso' | 'Parcial' | 'Error';
}

interface EndpointRecord {
  id: string;
  path: string;
  method: 'POST';
  status: number;
  time: string;
}

@Component({
  selector: 'app-integration',
  imports: [CommonModule],
  templateUrl: './integration.component.html',
  styleUrl: './integration.component.css'
})
export class IntegrationComponent implements OnDestroy {
  private readonly integrationService = inject(IntegrationService);

  private uploadSub: Subscription | null = null;

  uploading = signal(false);
  progress = signal(0);
  uploadError = signal('');
  uploadingFileName = signal('');

  coreStatus = signal<'ONLINE' | 'OFFLINE' | 'SIN_VERIFICAR'>('SIN_VERIFICAR');
  coreMeta = signal('Sin conexiones recientes');

  endpoints = signal<EndpointRecord[]>([]);
  batches = signal<BatchRecord[]>([]);

  openFilePicker(input: HTMLInputElement): void {
    if (this.uploading()) {
      return;
    }

    input.click();
  }

  onFileSelected(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    this.uploadFile(file);
  }

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
  }

  private uploadFile(file: File): void {
    this.uploadSub?.unsubscribe();
    this.uploading.set(true);
    this.progress.set(0);
    this.uploadError.set('');
    this.uploadingFileName.set(file.name);

    const startedAt = new Date();

    this.uploadSub = this.integrationService.uploadBatch(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Sent) {
          this.progress.set(5);
          return;
        }

        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const pct = Math.round((event.loaded / event.total) * 100);
            this.progress.set(Math.min(pct, 95));
          }
          return;
        }

        if (event.type === HttpEventType.Response) {
          const response = event as HttpResponse<BatchResultResponse>;
          this.progress.set(100);
          this.coreStatus.set('ONLINE');
          this.coreMeta.set(this.formatCoreMeta(startedAt));
          this.registerEndpoint(response.status, startedAt);
          this.registerBatch(file.name, response.body ?? this.emptyBatchResult(), startedAt);
          this.uploading.set(false);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.progress.set(0);
        this.coreStatus.set('OFFLINE');
        this.coreMeta.set('No se pudo completar la conexion con backend');

        const status = typeof err?.status === 'number' ? err.status : 0;
        this.registerEndpoint(status, startedAt);

        const backendResult = this.integrationService.extractBatchErrorPayload(err);
        if (backendResult) {
          this.registerBatch(file.name, backendResult, startedAt);
        }

        this.uploadError.set(this.integrationService.extractErrorMessage(err));
      },
      complete: () => {
        this.uploadSub = null;
      },
    });
  }

  private registerEndpoint(status: number, when: Date): void {
    const item: EndpointRecord = {
      id: `${when.getTime()}-${status}`,
      path: '/api/carga-batch',
      method: 'POST',
      status,
      time: this.formatRelativeTime(when),
    };

    this.endpoints.update((list) => [item, ...list].slice(0, 8));
  }

  private registerBatch(fileName: string, result: BatchResultResponse, when: Date): void {
    const errorsCount = result.fallidos;
    const status: BatchRecord['status'] = errorsCount === 0
      ? 'Exitoso'
      : result.exitosos > 0
      ? 'Parcial'
      : 'Error';

    const item: BatchRecord = {
      id: `${when.getTime()}-${fileName}`,
      name: fileName,
      records: result.totalRegistros,
      errors: errorsCount,
      date: when.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status,
    };

    this.batches.update((list) => [item, ...list].slice(0, 10));
  }

  private emptyBatchResult(): BatchResultResponse {
    return {
      totalRegistros: 0,
      exitosos: 0,
      fallidos: 0,
      errores: [],
    };
  }

  private formatCoreMeta(when: Date): string {
    return `Ultima respuesta: ${when.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  }

  private formatRelativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60_000);

    if (diffMinutes <= 0) {
      return 'Hace unos segundos';
    }

    if (diffMinutes === 1) {
      return 'Hace 1 min';
    }

    return `Hace ${diffMinutes} min`;
  }
}
