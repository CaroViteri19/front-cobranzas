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

  selectedCaseId  = signal<string | null>(null);
  noteText        = signal('');
  filterStatus    = signal('');
  showReassign    = signal(false);
  reassignTarget  = '';

  /** Controla si la tabla de casos está expandida o colapsada */
  casesTableOpen  = signal(true);
  /** Controla si el panel de detalle está expandido en mobile */
  detailOpen      = signal(true);

  /**
   * Current user role determines UI capabilities:
   *   Administrador / Supervisor → can reassign cases
   *   Agente → read-only on assignment
   * In production this would come from AuthService; mocked here.
   */
  readonly currentRole = signal<'Administrador' | 'Supervisor' | 'Agente' | 'Auditor'>('Administrador');
  readonly canReassign = computed(() =>
    this.currentRole() === 'Administrador' || this.currentRole() === 'Supervisor'
  );

  readonly filteredCases = computed(() => {
    const filter = this.filterStatus();
    return filter
      ? this.store.cases().filter(c => c.status === filter)
      : this.store.cases();
  });

  readonly selectedCase = computed(() =>
    this.store.cases().find(c => c.id === this.selectedCaseId()) ?? null
  );

  /** Summary counters driven by signals */
  readonly pendingCount = computed(() =>
    this.store.cases().filter(c => c.status === 'ST-001').length
  );
  readonly promisaCount = computed(() =>
    this.store.cases().filter(c => c.status === 'ST-004').length
  );
  readonly gestionCount = computed(() =>
    this.store.cases().filter(c => c.status === 'ST-002').length
  );
  readonly desbordeCount = computed(() =>
    this.store.cases().filter(c => c.desbordeIA).length
  );

  selectCase(id: string): void {
    this.selectedCaseId.set(this.selectedCaseId() === id ? null : id);
    this.noteText.set('');
    this.showReassign.set(false);
  }

  addNote(): void {
    const id = this.selectedCaseId();
    const text = this.noteText().trim();
    if (id && text) {
      this.store.addNoteToCase(id, text);
      this.noteText.set('');
    }
  }

  confirmReassign(): void {
    const id = this.selectedCaseId();
    if (id && this.reassignTarget) {
      this.store.reassignCase(id, this.reassignTarget, 'Manual');
      this.showReassign.set(false);
      this.reassignTarget = '';
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

  readonly activityLog = [
    { user: 'Agente 01',  action: 'Registró promesa de pago',        target: 'Lucía Méndez',      time: 'Hace 5m' },
    { user: 'M4 IA',      action: 'Desborde automático — riesgo Crit', target: 'Ana López',        time: 'Hace 12m' },
    { user: 'Agente 03',  action: 'Adjuntó evidencia de contacto',    target: 'Roberto Jaramillo', time: 'Hace 25m' },
    { user: 'Supervisor', action: 'Reasignó caso manualmente',        target: 'Pedro Vargas',      time: 'Hace 40m' },
    { user: 'M4 IA',      action: 'Cerró caso por recaudo exitoso',   target: 'Elena Rivas',       time: 'Hace 1h' },
  ];
}
