import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-case-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './case-management.component.html',
  styleUrl: './case-management.component.css'
})
export class CaseManagementComponent {
  store = inject(StoreService);

  selectedCaseId = signal<string | null>(null);
  noteText       = signal('');
  filterStatus   = signal('');

  readonly filteredCases = computed(() => {
    const filter = this.filterStatus();
    return filter
      ? this.store.cases().filter(c => c.status === filter)
      : this.store.cases();
  });

  readonly selectedCase = computed(() =>
    this.store.cases().find(c => c.id === this.selectedCaseId()) ?? null
  );

  selectCase(id: string): void {
    this.selectedCaseId.set(this.selectedCaseId() === id ? null : id);
    this.noteText.set('');
  }

  addNote(): void {
    const id = this.selectedCaseId();
    const text = this.noteText().trim();
    if (id && text) {
      this.store.addNoteToCase(id, text);
      this.noteText.set('');
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  readonly priorityBadge: Record<string, string> = {
    'Baja':    'badge-success',
    'Media':   'badge-info',
    'Alta':    'badge-warning',
    'Crítica': 'badge-danger',
  };

  readonly summaryStats = [
    { label: 'Casos Pendientes',     value: '450', color: '#3b82f6' },
    { label: 'Promesas de Pago',     value: '125', color: '#10b981' },
    { label: 'Acuerdos Incumplidos', value: '12',  color: '#ef4444' },
    { label: 'En Gestión',           value: '84',  color: '#10989B' },
  ];

  readonly activityLog = [
    { user: 'Asesor 01',  action: 'Registró promesa de pago',      target: 'Lucía Méndez',      time: 'Hace 5m' },
    { user: 'Sistema IA', action: 'Desbordó caso por alto riesgo',  target: 'Fernando Soto',     time: 'Hace 12m' },
    { user: 'Asesor 03',  action: 'Adjuntó evidencia de contacto',  target: 'Roberto Jaramillo', time: 'Hace 25m' },
    { user: 'Sistema IA', action: 'Cerró caso por recaudo exitoso', target: 'Elena Rivas',       time: 'Hace 1h' },
  ];
}
