import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';

import { CargaMasivaService } from '../../core/services/carga-masiva.service';
import {
  CARGA_MASIVA_COLUMNS,
  CargaMasivaResultResponse,
  RowErrorDTO,
} from '../../core/models/carga-masiva.model';

// ── Tipos locales ───────────────────────────────────────────────────────────

/** Una entrada del historial local (solo memoria, se pierde al refrescar). */
interface BatchRecord {
  name: string;
  records: number;
  errors: number;
  date: string;
  status: 'Exitoso' | 'Parcial' | 'Error';
}

// ── Componente ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-integration',
  imports: [CommonModule],
  templateUrl: './integration.component.html',
  styleUrl: './integration.component.css',
})
export class IntegrationComponent {
  private readonly cargaMasiva = inject(CargaMasivaService);

  /** Nombres de columnas esperados en el CSV / TXT (AsociadoRowDTO.COLUMN_NAMES). */
  readonly columnasEsperadas = CARGA_MASIVA_COLUMNS;

  // ── Estado de la carga actual ───────────────────────────────────────────
  uploading = signal(false);
  progress = signal(0);
  archivoNombre = signal('');
  resultado = signal<CargaMasivaResultResponse | null>(null);
  errorGeneral = signal('');
  mostrarErrores = signal(false);

  // ── Historial en memoria ────────────────────────────────────────────────
  batches = signal<BatchRecord[]>([]);

  // ── Endpoints reales expuestos por el backend ───────────────────────────
  readonly endpoints = [
    { path: '/api/v1/carga-masiva/upload', method: 'POST', status: 201, time: 'Activo' },
    { path: '/api/v1/clients', method: 'POST', status: 201, time: 'Activo' },
    { path: '/api/v1/clients/search/id', method: 'POST', status: 200, time: 'Activo' },
    { path: '/api/v1/obligations/search/id', method: 'POST', status: 200, time: 'Activo' },
    { path: '/api/v1/obligations/search/client', method: 'POST', status: 200, time: 'Activo' },
  ];

  // ── Derivados para el template ──────────────────────────────────────────
  readonly porcentajeExito = computed(() => {
    const r = this.resultado();
    if (!r || r.totalRows === 0) return 0;
    return Math.round((r.totalInserted / r.totalRows) * 100);
  });

  // ── Handlers de archivo ─────────────────────────────────────────────────

  abrirSelector(input: HTMLInputElement): void {
    input.click();
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const archivo = input.files[0];
    this.cargarArchivo(archivo);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const archivo = event.dataTransfer?.files?.[0];
    if (archivo) this.cargarArchivo(archivo);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  toggleErrores(): void {
    this.mostrarErrores.update((v) => !v);
  }

  /** Etiqueta legible para la severidad (template). */
  severityLabel(err: RowErrorDTO): string {
    return err.severity === 'WARNING' ? 'Aviso' : 'Error';
  }

  // ── Proceso principal ───────────────────────────────────────────────────

  private cargarArchivo(archivo: File): void {
    const extension = archivo.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'txt') {
      this.errorGeneral.set('Solo se aceptan archivos .csv o .txt');
      return;
    }

    this.uploading.set(true);
    this.progress.set(0);
    this.resultado.set(null);
    this.errorGeneral.set('');
    this.mostrarErrores.set(false);
    this.archivoNombre.set(archivo.name);

    this.cargaMasiva.upload(archivo).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const pct = Math.round((100 * event.loaded) / event.total);
          // Reservar 90-100 para el procesamiento del servidor.
          this.progress.set(Math.min(pct, 90));
        } else if (event.type === HttpEventType.Response) {
          this.progress.set(100);
          const res = event.body as CargaMasivaResultResponse;
          this.resultado.set(res);
          this.uploading.set(false);
          this.agregarAlHistorial(archivo.name, res);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.progress.set(0);
        this.handleError(err, archivo.name);
      },
    });
  }

  // ── Historial y manejo de error ─────────────────────────────────────────

  private agregarAlHistorial(nombre: string, res: CargaMasivaResultResponse): void {
    const status: BatchRecord['status'] =
      res.totalErrors === 0 ? 'Exitoso' : res.totalInserted === 0 ? 'Error' : 'Parcial';

    const nueva: BatchRecord = {
      name: nombre,
      records: res.totalRows,
      errors: res.totalErrors,
      date: new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status,
    };
    this.batches.update((prev) => [nueva, ...prev]);
  }

  /**
   * El backend puede responder con:
   *  - 422 UnprocessableEntity + body {@link CargaMasivaResultResponse} con errores (ExceptionHandler).
   *  - 400 BadRequest con {@code {message|error}} para validaciones básicas.
   *  - 401/403 por falta de token o rol insuficiente.
   *  - Error de red (status 0).
   */
  private handleError(err: unknown, fileName: string): void {
    if (err instanceof HttpErrorResponse) {
      // Caso 1: el backend envió un CargaMasivaResultResponse con errores de fila.
      const body = err.error as Partial<CargaMasivaResultResponse> | undefined;
      if (body && Array.isArray((body as CargaMasivaResultResponse).errors)) {
        const resp = body as CargaMasivaResultResponse;
        this.resultado.set(resp);
        this.agregarAlHistorial(fileName, resp);
        return;
      }

      // Caso 2: mensaje plano del backend.
      const msg =
        (err.error && typeof err.error === 'object' && (err.error.message || err.error.error)) ||
        err.message;

      if (err.status === 0) {
        this.errorGeneral.set(
          'No se puede conectar con el servidor. ¿Está el backend corriendo en el puerto 8080?',
        );
        return;
      }
      if (err.status === 401) {
        this.errorGeneral.set('Tu sesión expiró. Inicia sesión nuevamente.');
        return;
      }
      if (err.status === 403) {
        this.errorGeneral.set(
          'No tienes permisos para cargar archivos (se requiere ADMINISTRADOR o SUPERVISOR).',
        );
        return;
      }
      this.errorGeneral.set(msg || `Error ${err.status} al procesar el archivo.`);
      return;
    }

    this.errorGeneral.set('Error inesperado al conectar con el servidor.');
  }
}
