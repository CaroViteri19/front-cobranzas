import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── DTOs (reflejan el contrato del backend) ───────────────────────────────────

/** Error de validación en una fila/campo específico del CSV. */
export interface RowError {
  rowNumber: number;   // -1 = error global del archivo
  field:     string | null;
  message:   string;
  severity:  'ERROR' | 'WARNING';
}

/** Respuesta unificada del proceso de carga masiva. */
export interface CargaMasivaResult {
  success:        boolean;
  totalRows:      number;
  totalInserted:  number;
  totalErrors:    number;
  fileName:       string;
  processedAt:    string;
  errors:         RowError[];
}

/** Estado del progreso de carga. */
export interface UploadProgress {
  phase:      'uploading' | 'processing' | 'done' | 'error';
  percent:    number;   // 0–100 (upload HTTP progress)
  result?:    CargaMasivaResult;
  error?:     string;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

/**
 * Servicio Angular para la carga masiva de asociados vía CSV.
 *
 * Expone un Observable de {@link UploadProgress} que emite actualizaciones
 * durante la carga HTTP y al finalizar el procesamiento del servidor.
 *
 * Uso:
 * ```typescript
 * this.cargaMasivaService.upload(file).subscribe(progress => {
 *   this.uploadProgress.set(progress);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CargaMasivaService {
  private http   = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/carga-masiva';

  /**
   * Sube el archivo CSV al backend y emite progreso en tiempo real.
   *
   * @param file Archivo CSV seleccionado por el usuario
   * @returns Observable que emite actualizaciones de {@link UploadProgress}
   */
  upload(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    // 'observe' pertenece a http.get()/post(), no al constructor HttpRequest.
    // http.request(req) ya devuelve Observable<HttpEvent<T>> cuando reportProgress=true.
    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true,
    });

    return new Observable<UploadProgress>(observer => {
      // Estado inicial
      observer.next({ phase: 'uploading', percent: 0 });

      this.http.request<CargaMasivaResult>(req).subscribe({
        next: (event: HttpEvent<CargaMasivaResult>) => {
          if (event.type === HttpEventType.UploadProgress) {
            // Progreso de carga al servidor (0–95%)
            const percent = event.total
              ? Math.round((event.loaded / event.total) * 95)
              : 50;
            observer.next({ phase: 'uploading', percent });

          } else if (event.type === HttpEventType.Sent) {
            // Petición enviada, servidor procesando
            observer.next({ phase: 'processing', percent: 96 });

          } else if (event.type === HttpEventType.Response) {
            // Respuesta del servidor
            const result = event.body!;
            observer.next({
              phase:   result.success ? 'done' : 'error',
              percent: 100,
              result,
            });
            observer.complete();
          }
        },
        error: (err) => {
          // Manejar respuesta de error HTTP (422 con errores de validación, etc.)
          const errorBody = err.error as CargaMasivaResult | undefined;
          if (errorBody && Array.isArray(errorBody.errors)) {
            observer.next({
              phase:   'error',
              percent: 100,
              result:  errorBody,
            });
          } else {
            observer.next({
              phase:   'error',
              percent: 100,
              error:   err.status === 413
                ? 'El archivo excede el tamaño máximo permitido (50MB).'
                : err.status === 401
                ? 'Sesión expirada. Vuelve a iniciar sesión.'
                : err.status === 403
                ? 'No tienes permisos para realizar esta operación.'
                : `Error del servidor (${err.status}): ${err.message}`,
            });
          }
          observer.complete();
        },
      });
    });
  }
}
