import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { StoreService } from '../../core/services/store.service';
import { ClientService } from '../../core/services/client.service';
import { ObligationService } from '../../core/services/obligation.service';
import { AuthService } from '../../core/services/auth.service';
import { DOCUMENT_TYPES, DocumentType, ClientResponse } from '../../core/models/client.model';
import { ObligationResponse } from '../../core/models/obligation.model';

@Component({
  selector: 'app-case-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './case-management.component.html',
  styleUrl: './case-management.component.css'
})
export class CaseManagementComponent implements OnInit {
  store = inject(StoreService);
  private readonly clients     = inject(ClientService);
  private readonly obligations = inject(ObligationService);
  private readonly auth        = inject(AuthService);

  // ── Estado del detalle ────────────────────────────────────────────────
  selectedCaseId  = signal<string | null>(null);
  noteText        = signal('');
  filterStatus    = signal('');
  showReassign    = signal(false);
  reassignTarget  = '';

  casesTableOpen  = signal(true);
  detailOpen      = signal(true);

  // ── Loader por documento/ID (búsqueda puntual) ────────────────────────
  readonly documentTypes = DOCUMENT_TYPES;

  loaderOpen    = signal(false);
  loaderMode    = signal<'document' | 'id'>('document');
  loaderDocType = signal<DocumentType>('CC');
  loaderDocNum  = signal('');
  loaderId      = signal<number | null>(null);
  loaderLoading = signal(false);
  loaderError   = signal('');
  loaderInfo    = signal('');

  // ── Paginación del listado desde backend ──────────────────────────────
  readonly pageSize    = 10;
  readonly currentPage = signal(0);         // 0-based
  readonly totalPages  = signal(0);
  readonly totalElements = signal(0);
  readonly pageLoading = signal(false);
  readonly pageError   = signal('');

  /** Rango legible para el pie de página: "11 – 20 de 45". */
  readonly pageRange = computed(() => {
    const total = this.totalElements();
    if (total === 0) return '0 – 0 de 0';
    const start = this.currentPage() * this.pageSize + 1;
    const end   = Math.min(start + this.pageSize - 1, total);
    return `${start} – ${end} de ${total}`;
  });

  /** Lista de números de página visibles (máx 5 botones alrededor del actual). */
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i);

    const start = Math.max(0, Math.min(current - 2, total - 5));
    return Array.from({ length: 5 }, (_, i) => start + i);
  });

  /**
   * Rol actual tomado del AuthService (al backend le llegan en mayúsculas
   * ej. "ADMINISTRADOR"). Mapeamos a la etiqueta usada por la UI demo.
   */
  readonly currentRole = computed<'Administrador' | 'Supervisor' | 'Agente' | 'Auditor'>(() => {
    const r = this.auth.currentRole();
    switch (r) {
      case 'ADMINISTRADOR': return 'Administrador';
      case 'SUPERVISOR':    return 'Supervisor';
      case 'AGENTE':        return 'Agente';
      case 'AUDITOR':       return 'Auditor';
      default:              return 'Administrador';
    }
  });

  readonly canReassign = computed(() =>
    this.currentRole() === 'Administrador' || this.currentRole() === 'Supervisor'
  );

  /** IDs de los casos que pertenecen a la página cargada actualmente. */
  readonly currentPageCaseIds = signal<Set<string>>(new Set());

  readonly filteredCases = computed(() => {
    const filter    = this.filterStatus();
    const pageIds   = this.currentPageCaseIds();
    const inPage    = (id: string) => pageIds.size === 0 || pageIds.has(id);
    const all       = this.store.cases().filter(c => inPage(c.id));
    return filter ? all.filter(c => c.status === filter) : all;
  });

  readonly selectedCase = computed(() =>
    this.store.cases().find(c => c.id === this.selectedCaseId()) ?? null
  );

  /** Casos visibles en la página actual (antes de aplicar filtro de estado). */
  private readonly casesInPage = computed(() => {
    const ids = this.currentPageCaseIds();
    return ids.size === 0
      ? this.store.cases()
      : this.store.cases().filter(c => ids.has(c.id));
  });

  readonly pendingCount  = computed(() => this.casesInPage().filter(c => c.status === 'ST-001').length);
  readonly promisaCount  = computed(() => this.casesInPage().filter(c => c.status === 'ST-004').length);
  readonly gestionCount  = computed(() => this.casesInPage().filter(c => c.status === 'ST-002').length);
  readonly desbordeCount = computed(() => this.casesInPage().filter(c => c.desbordeIA).length);

  // ── Carga inicial / paginación ────────────────────────────────────────
  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    if (page < 0) return;
    this.pageLoading.set(true);
    this.pageError.set('');

    this.clients.list(page, this.pageSize).subscribe({
      next: (resp) => {
        this.totalElements.set(resp.totalElements);
        this.totalPages.set(resp.totalPages);
        this.currentPage.set(resp.page);

        if (resp.content.length === 0) {
          this.pageLoading.set(false);
          return;
        }

        // Por cada cliente de la página, intenta traer sus obligaciones en paralelo.
        const withObls$ = resp.content.map(client =>
          this.obligations.listByClient(client.id).pipe(
            catchError(() => of([] as ObligationResponse[])),
            map(obls => ({ client, obls })),
          )
        );

        forkJoin(withObls$).subscribe({
          next: (rows) => {
            const ids = new Set<string>();
            for (const { client, obls } of rows) {
              const { caseItem } = this.store.upsertAssociateFromBackend(client, obls);
              ids.add(caseItem.id);
            }
            this.currentPageCaseIds.set(ids);
            this.pageLoading.set(false);
          },
          error: () => {
            // Si falla forkJoin, al menos inserta los clientes sin obligaciones.
            const ids = new Set<string>();
            for (const client of resp.content) {
              const { caseItem } = this.store.upsertAssociateFromBackend(client, []);
              ids.add(caseItem.id);
            }
            this.currentPageCaseIds.set(ids);
            this.pageLoading.set(false);
          },
        });
      },
      error: (err) => {
        this.pageLoading.set(false);
        this.pageError.set(this.errorMessage(err));
      },
    });
  }

  goToPage(page: number): void {
    if (page === this.currentPage() || page < 0 || page >= this.totalPages()) return;
    this.loadPage(page);
  }

  prevPage(): void { this.goToPage(this.currentPage() - 1); }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }

  // ── Selección / notas / reasignación ─────────────────────────────────
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

  // ── Loader: carga cliente + obligaciones desde el backend ────────────

  toggleLoaderMode(mode: 'document' | 'id'): void {
    this.loaderMode.set(mode);
    this.loaderError.set('');
    this.loaderInfo.set('');
  }

  cargarDesdeBackend(): void {
    this.loaderError.set('');
    this.loaderInfo.set('');

    const mode = this.loaderMode();
    if (mode === 'id') {
      const id = this.loaderId();
      if (id == null || id <= 0) {
        this.loaderError.set('Ingresa un ID de cliente válido.');
        return;
      }
      this.loaderLoading.set(true);
      this.clients.getById(id).subscribe({
        next: (client) => this.fetchObligationsAndCommit(client.id, client),
        error: (err) => this.handleLoaderError(err),
      });
    } else {
      const doc = this.loaderDocNum().trim();
      if (!doc) {
        this.loaderError.set('Ingresa el número de documento.');
        return;
      }
      this.loaderLoading.set(true);
      this.clients.getByDocument(this.loaderDocType(), doc).subscribe({
        next: (client) => this.fetchObligationsAndCommit(client.id, client),
        error: (err) => this.handleLoaderError(err),
      });
    }
  }

  /** Segundo paso: lee las obligaciones del cliente y hace upsert en la store. */
  private fetchObligationsAndCommit(clientId: number, client: ClientResponse): void {
    this.obligations.listByClient(clientId).subscribe({
      next: (obls) => this.commitLoadedClient(client, obls, obls.length),
      error: (err) => {
        // Si falla el listado, al menos ingresa el cliente sin obligaciones.
        this.commitLoadedClient(client, [], 0, this.errorMessage(err));
      },
    });
  }

  private commitLoadedClient(
    client: ClientResponse,
    obls: ObligationResponse[],
    oblCount: number,
    errSuffix?: string,
  ): void {
    const { associate, caseItem } = this.store.upsertAssociateFromBackend(client, obls);
    this.loaderLoading.set(false);

    const msg = errSuffix
      ? `Cargado "${associate.name}" sin obligaciones (${errSuffix}).`
      : `Cargado "${associate.name}" con ${oblCount} obligación(es). Saldo: $${associate.balance.toLocaleString('es-CO')}.`;
    this.loaderInfo.set(msg);

    // Que aparezca también en la tabla aunque no sea parte de la página paginada.
    this.currentPageCaseIds.update(set => {
      const next = new Set(set);
      next.add(caseItem.id);
      return next;
    });

    this.selectedCaseId.set(caseItem.id);
  }

  private handleLoaderError(err: unknown): void {
    this.loaderLoading.set(false);
    this.loaderError.set(this.errorMessage(err));
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0)   return 'Sin conexión con el backend (puerto 8080).';
      if (err.status === 404) return 'Cliente no encontrado.';
      if (err.status === 401 || err.status === 403) return 'No tienes permisos para consultar clientes.';
      const msg =
        (err.error && typeof err.error === 'object' && (err.error.message || err.error.error)) ||
        err.message;
      return msg || `Error ${err.status}`;
    }
    return 'Error inesperado.';
  }

  // ── UI helpers ────────────────────────────────────────────────────────
  readonly priorityBadge: Record<string, string> = {
    'Baja':    'badge-success',
    'Media':   'badge-info',
    'Alta':    'badge-warning',
    'Crítica': 'badge-danger',
  };

  /** Actividad reciente del módulo M5 (vacío hasta que haya backend/registro real). */
  readonly activityLog: { user: string; action: string; target: string; time: string }[] = [];
}
