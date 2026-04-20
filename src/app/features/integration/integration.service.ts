import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BatchErrorDetail {
  fila: number;
  mensaje: string;
}

export interface BatchResultResponse {
  totalRegistros: number;
  exitosos: number;
  fallidos: number;
  errores: BatchErrorDetail[];
}

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  private readonly http = inject(HttpClient);
  private readonly batchUrl = 'http://localhost:8080/api/carga-batch';

  uploadBatch(file: File): Observable<HttpEvent<BatchResultResponse>> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const request = new HttpRequest<unknown>('POST', this.batchUrl, formData, {
      reportProgress: true,
      responseType: 'json',
    });

    return this.http.request<BatchResultResponse>(request);
  }

  extractBatchErrorPayload(error: unknown): BatchResultResponse | null {
    if (!(error instanceof HttpErrorResponse) || !error.error || typeof error.error !== 'object') {
      return null;
    }

    const payload = error.error as Partial<BatchResultResponse>;
    if (
      typeof payload.totalRegistros !== 'number'
      || typeof payload.exitosos !== 'number'
      || typeof payload.fallidos !== 'number'
      || !Array.isArray(payload.errores)
    ) {
      return null;
    }

    return {
      totalRegistros: payload.totalRegistros,
      exitosos: payload.exitosos,
      fallidos: payload.fallidos,
      errores: payload.errores,
    };
  }

  extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = this.extractBatchErrorPayload(error);
      const backendMessage = payload?.errores?.[0]?.mensaje;
      if (backendMessage) {
        return backendMessage;
      }

      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }

      if (error.status === 0) {
        return 'No se pudo conectar con el backend en http://localhost:8080';
      }

      return `Error ${error.status}: no fue posible completar la carga`;
    }

    return 'Error inesperado al cargar el archivo';
  }
}

