import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CargaMasivaService,
  UploadProgress,
  RowError,
} from '../../core/services/carga-masiva.service';

/** Columnas que se muestran en la tabla de errores. */
const MAX_ERRORS_VISIBLE = 100;

/** Historial de cargas (en producción vendría de un endpoint). */
interface BatchRecord {
  name:     string;
  records:  number;
  errors:   number;
  date:     string;
  status:   'Exitoso' | 'Parcial' | 'Error';
}

@Component({
  selector: 'app-integration',
  imports: [CommonModule],
  templateUrl: './integration.component.html',
  styleUrl:    './integration.component.css',
})
export class IntegrationComponent {

  // ── Dependencias ─────────────────────────────────────────────────────────
  private cargaService = inject(CargaMasivaService);

  // ── Estado del proceso de carga ──────────────────────────────────────────
  readonly uploadState  = signal<UploadProgress | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly dragOver     = signal(false);

  // ── Estado de la tabla de errores ────────────────────────────────────────
  readonly errorsExpanded  = signal(false);
  readonly errorFilter     = signal('');
  readonly errorPage       = signal(0);
  readonly errorsPerPage   = 20;

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly isUploading = computed(() =>
    this.uploadState()?.phase === 'uploading' ||
    this.uploadState()?.phase === 'processing'
  );

  readonly uploadPercent = computed(() => this.uploadState()?.percent ?? 0);

  readonly uploadResult = computed(() => this.uploadState()?.result ?? null);

  readonly allErrors = computed((): RowError[] => {
    const result = this.uploadResult();
    if (!result?.errors?.length) return [];
    return result.errors;
  });

  readonly filteredErrors = computed((): RowError[] => {
    const filter = this.errorFilter().toLowerCase();
    const errors = this.allErrors();
    if (!filter) return errors;
    return errors.filter(e =>
      (e.field?.toLowerCase().includes(filter)) ||
      e.message.toLowerCase().includes(filter) ||
      String(e.rowNumber).includes(filter)
    );
  });

  readonly paginatedErrors = computed((): RowError[] => {
    const start = this.errorPage() * this.errorsPerPage;
    return this.filteredErrors().slice(start, start + this.errorsPerPage);
  });

  readonly totalErrorPages = computed(() =>
    Math.ceil(this.filteredErrors().length / this.errorsPerPage)
  );

  readonly phaseLabel = computed(() => {
    switch (this.uploadState()?.phase) {
      case 'uploading':   return 'Subiendo archivo...';
      case 'processing':  return 'Servidor procesando CSV...';
      case 'done':        return '¡Carga completada!';
      case 'error':       return 'Carga rechazada';
      default:            return '';
    }
  });

  // ── Historial de cargas ───────────────────────────────────────────────────
  readonly batches = signal<BatchRecord[]>([
    { name: 'Lote_Marzo_Q1.csv',    records: 12500, errors: 0,  date: '15 Mar 2024', status: 'Exitoso' },
    { name: 'Novedades_Nomina.csv', records: 4200,  errors: 12, date: '14 Mar 2024', status: 'Parcial' },
    { name: 'Ajustes_Saldos.csv',   records: 850,   errors: 0,  date: '12 Mar 2024', status: 'Exitoso' },
  ]);

  // ── Handlers de archivo ───────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    this.setFile(file);
    input.value = ''; // Permite re-seleccionar el mismo archivo
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  private setFile(file: File | null): void {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.uploadState.set({
        phase: 'error',
        percent: 0,
        error: 'Solo se aceptan archivos .csv',
      });
      return;
    }
    this.selectedFile.set(file);
    this.uploadState.set(null);
    this.errorPage.set(0);
    this.errorFilter.set('');
  }

  // ── Ejecutar carga ────────────────────────────────────────────────────────

  startUpload(): void {
    const file = this.selectedFile();
    if (!file || this.isUploading()) return;

    this.uploadState.set({ phase: 'uploading', percent: 0 });
    this.errorPage.set(0);
    this.errorFilter.set('');

    this.cargaService.upload(file).subscribe({
      next: (progress) => {
        this.uploadState.set(progress);

        // Agregar al historial si fue exitoso
        if (progress.phase === 'done' && progress.result) {
          this.batches.update(list => [
            {
              name:    file.name,
              records: progress.result!.totalInserted,
              errors:  0,
              date:    new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
              status:  'Exitoso',
            },
            ...list,
          ]);
          this.selectedFile.set(null);
        }
      },
    });
  }

  resetUpload(): void {
    this.selectedFile.set(null);
    this.uploadState.set(null);
    this.errorPage.set(0);
    this.errorFilter.set('');
  }

  // ── Helpers para template ────────────────────────────────────────────────

  formatBytes(bytes: number): string {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1_048_576)   return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1_048_576).toFixed(1) + ' MB';
  }

  prevErrorPage(): void {
    if (this.errorPage() > 0) this.errorPage.update(p => p - 1);
  }

  nextErrorPage(): void {
    if (this.errorPage() < this.totalErrorPages() - 1)
      this.errorPage.update(p => p + 1);
  }

  errorRowClass(err: RowError): string {
    return err.severity === 'WARNING' ? 'err-row-warning' : 'err-row-error';
  }

  statusBadgeClass(status: string): string {
    return status === 'Exitoso' ? 'badge-success'
         : status === 'Error'   ? 'badge-danger'
         :                        'badge-info';
  }
}
