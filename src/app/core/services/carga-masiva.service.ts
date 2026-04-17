import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_PATHS } from '../config/api.config';
import { CargaMasivaResultResponse } from '../models/carga-masiva.model';

/**
 * Cliente HTTP para `/api/v1/carga-masiva`.
 *
 * <p>Expone el endpoint {@code POST /upload} con {@code multipart/form-data}.
 * El interceptor global inyecta el JWT automáticamente.
 */
@Injectable({ providedIn: 'root' })
export class CargaMasivaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_PATHS.cargaMasiva;

  /**
   * Sube un archivo CSV / TXT al backend reportando progreso de upload.
   *
   * <p>Usar con {@code observe: 'events'} permite al componente pintar
   * una barra de progreso. La respuesta final llega en el evento
   * {@code HttpEventType.Response}.
   */
  upload(file: File): Observable<HttpEvent<CargaMasivaResultResponse>> {
    const form = new FormData();
    form.append('file', file);

    return this.http.post<CargaMasivaResultResponse>(
      `${this.baseUrl}/upload`,
      form,
      {
        reportProgress: true,
        observe: 'events',
      },
    );
  }
}
