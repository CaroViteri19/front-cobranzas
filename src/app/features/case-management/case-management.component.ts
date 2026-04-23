import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { StoreService } from '../../core/services/store.service';
import { ClientService } from '../../core/services/client.service';
import { ObligationService } from '../../core/services/obligation.service';
import { CaseService } from '../../core/services/case.service';
import { OrchestrationService } from '../../core/services/orchestration.service';
import { AuthService } from '../../core/services/auth.service';
import { DOCUMENT_TYPES, DocumentType, ClientResponse } from '../../core/models/client.model';
import { ObligationResponse } from '../../core/models/obligation.model';
import {
  CASE_PRIORITIES,
  CasePriority,
  CaseResponse,
  CaseStatus as BackendCaseStatus,
  CreateCaseRequest,
  TransitionCaseStatusRequest,
} from '../../core/models/case.model';
import { SendPaymentLinkResponse } from '../../core/models/orchestration.model';
import { ROLES } from '../../core/auth/roles';

@Component({
  selector: 'app-case-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './case-management.component.html',
  styleUrl: './case-management.component.css'
})
export class CaseManagementComponent implements OnInit {
  store = inject(StoreService);
  private readonly clients       = inject(ClientService);
  private readonly obligations   = inject(ObligationService);
  private readonly caseService   = inject(CaseService);
  private readonly orchestration = inject(OrchestrationService);
  private readonly auth          = inject(AuthService);

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
   * Rol actual tomado del AuthService (el backend los emite en MAYÚSCULAS
   * dentro del JWT; ADMINISTRATOR viene en inglés, los demás en español).
   * Mapeamos a la etiqueta usada por la UI demo.
   */
  readonly currentRole = computed<'Administrador' | 'Supervisor' | 'Agente' | 'Auditor'>(() => {
    const r = this.auth.currentRole();
    switch (r) {
      case 'ADMINISTRATOR': return 'Administrador';
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

  // ── Integración directa con /api/v1/cases ────────────────────────────
  /** Casos pendientes reales traídos del backend (CaseController#listPending). */
  readonly backendCases = signal<CaseResponse[]>([]);
  readonly backendCasesLoading = signal(false);
  readonly backendCasesError   = signal('');

  /** Canal de feedback del envío de link de pago (último intento). */
  readonly paymentLinkSending = signal(false);
  readonly paymentLinkResult  = signal<SendPaymentLinkResponse | null>(null);
  readonly paymentLinkError   = signal('');

  /** Feedback del último cambio de estado / cierre. */
  readonly caseActionLoading = signal(false);
  readonly caseActionError   = signal('');
  readonly caseActionInfo    = signal('');

  // ── Creación de casos reales (POST /api/v1/cases) ────────────────────
  /**
   * Obligaciones descubiertas (por loader o paginación) disponibles para
   * elegir en el formulario de creación. Dedupe por id.
   */
  readonly loadedObligations = signal<ObligationResponse[]>([]);
  readonly createObligationId = signal<number | null>(null);
  readonly createPriority     = signal<CasePriority>('MEDIUM');
  readonly caseCreateLoading  = signal(false);
  readonly casePriorities     = CASE_PRIORITIES;

  // ── Carga inicial / paginación ────────────────────────────────────────
  ngOnInit(): void {
    this.loadPage(0);
    this.loadBackendCases();
  }

  /** Recarga los casos pendientes desde el backend. */
  loadBackendCases(): void {
    this.backendCasesLoading.set(true);
    this.backendCasesError.set('');
    this.caseService.listPending().subscribe({
      next: (cases) => {
        this.backendCases.set(cases);
        this.backendCasesLoading.set(false);
      },
      error: (err) => {
        this.backendCasesLoading.set(false);
        this.backendCasesError.set(this.errorMessage(err));
      },
    });
  }

  /**
   * Dispara una transición de estado en el backend. Al completarse se
   * recargan los casos pendientes para reflejar el nuevo estado.
   */
  transitionBackendCase(caseId: number, targetStatus: BackendCaseStatus, reason: string): void {
    this.caseActionLoading.set(true);
    this.caseActionError.set('');
    this.caseActionInfo.set('');

    const request: TransitionCaseStatusRequest = {
      caseId,
      targetStatus,
      reason,
      performedBy: this.auth.username() ?? 'ui',
      performedByRole: this.auth.currentRole() ?? ROLES.ADMINISTRADOR,
      source: 'UI',
      correlationId: `ui-${Date.now()}`,
    };

    this.caseService.transitionStatus(request).subscribe({
      next: (updated) => {
        this.caseActionLoading.set(false);
        this.caseActionInfo.set(`Caso ${updated.id} → ${updated.status}`);
        this.loadBackendCases();
      },
      error: (err) => {
        this.caseActionLoading.set(false);
        this.caseActionError.set(this.errorMessage(err));
      },
    });
  }

  /** Cierra un caso del backend y refresca la lista. */
  closeBackendCase(caseId: number): void {
    this.caseActionLoading.set(true);
    this.caseActionError.set('');
    this.caseActionInfo.set('');

    this.caseService.close(caseId).subscribe({
      next: (updated) => {
        this.caseActionLoading.set(false);
        this.caseActionInfo.set(`Caso ${updated.id} cerrado.`);
        this.loadBackendCases();
      },
      error: (err) => {
        this.caseActionLoading.set(false);
        this.caseActionError.set(this.errorMessage(err));
      },
    });
  }

  /**
   * Crea un caso real en el backend a partir de la obligación seleccionada.
   * Al responder, refresca la lista de pendientes para que aparezca arriba.
   */
  createBackendCase(): void {
    const oblId = this.createObligationId();
    if (oblId == null || oblId <= 0) {
      this.caseActionError.set('Debes indicar el ID de la obligación.');
      this.caseActionInfo.set('');
      return;
    }

    this.caseCreateLoading.set(true);
    this.caseActionLoading.set(true);
    this.caseActionError.set('');
    this.caseActionInfo.set('');

    const request: CreateCaseRequest = {
      obligationId: oblId,
      priority: this.createPriority(),
    };

    this.caseService.create(request).subscribe({
      next: (created) => {
        this.caseCreateLoading.set(false);
        this.caseActionLoading.set(false);
        this.caseActionInfo.set(
          `Caso #${created.id} creado para obligación ${created.obligationId} (prioridad ${created.priority}).`
        );
        this.createObligationId.set(null);
        this.loadBackendCases();
      },
      error: (err) => {
        this.caseCreateLoading.set(false);
        this.caseActionLoading.set(false);
        this.caseActionError.set(this.errorMessage(err));
      },
    });
  }

  /** Inserta/actualiza obligaciones en `loadedObligations` deduplicando por id. */
  private mergeLoadedObligations(obls: ObligationResponse[]): void {
    if (!obls?.length) return;
    this.loadedObligations.update((existing) => {
      const byId = new Map<number, ObligationResponse>();
      for (const o of existing) byId.set(o.id, o);
      for (const o of obls)     byId.set(o.id, o);
      return Array.from(byId.values()).sort((a, b) => a.id - b.id);
    });
  }

  /**
   * Genera el link de pago para el caso y lo envía por los canales consentidos
   * del cliente. El backend devuelve el resumen multicanal.
   */
  sendPaymentLinkForBackendCase(caseId: number): void {
    this.paymentLinkSending.set(true);
    this.paymentLinkError.set('');
    this.paymentLinkResult.set(null);

    this.orchestration.sendPaymentLink(caseId).subscribe({
      next: (resp) => {
        this.paymentLinkSending.set(false);
        this.paymentLinkResult.set(resp);
      },
      error: (err) => {
        this.paymentLinkSending.set(false);
        this.paymentLinkError.set(this.errorMessage(err));
      },
    });
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
        // Si una falla marcamos el flag y seguimos (no queremos perder toda la página
        // por un 403/500 aislado), pero dejamos constancia al usuario.
        let oblFailures = 0;
        let lastOblError = '';
        const withObls$ = resp.content.map(client =>
          this.obligations.listByClient(client.id).pipe(
            catchError((err) => {
              oblFailures++;
              lastOblError = this.errorMessage(err);
              return of([] as ObligationResponse[]);
            }),
            map(obls => ({ client, obls })),
          )
        );

        forkJoin(withObls$).subscribe({
          next: (rows) => {
            const ids = new Set<string>();
            const allObls: ObligationResponse[] = [];
            for (const { client, obls } of rows) {
              const { caseItem } = this.store.upsertAssociateFromBackend(client, obls);
              ids.add(caseItem.id);
              allObls.push(...obls);
            }
            this.currentPageCaseIds.set(ids);
            this.mergeLoadedObligations(allObls);
            this.pageLoading.set(false);
            if (oblFailures > 0) {
              this.pageError.set(
                `No se pudieron cargar las obligaciones de ${oblFailures} cliente(s). ${lastOblError}`
              );
            }
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
      next: (obls) => {
        this.mergeLoadedObligations(obls);
        this.commitLoadedClient(client, obls, obls.length);
      },
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
