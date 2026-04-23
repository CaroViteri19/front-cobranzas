import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { StoreService } from '../../core/services/store.service';
import { OrchestrationService } from '../../core/services/orchestration.service';
import { InteractionService } from '../../core/services/interaction.service';
import { Campaign } from '../../core/models';
import { INTERACTION_CHANNELS, InteractionChannel, InteractionResponse } from '../../core/models/interaction.model';
import {
  OrchestrationExecutionResponse,
  SendOrchestrationRequest,
  SendPaymentLinkRequest,
  SendPaymentLinkResponse,
} from '../../core/models/orchestration.model';
import { PAYMENT_METHODS, PaymentMethod } from '../../core/models/payment.model';

/**
 * Pantalla de orquestación multicanal.
 *
 * Mantiene la vista legacy de "campañas" mock (vía StoreService) y agrega un
 * panel real contra los endpoints de Spring:
 *   • POST /api/v1/orchestration/send             — envío manual puntual.
 *   • POST /api/v1/orchestration/search/case      — ejecuciones de un caso.
 *   • POST /api/v1/cases/{caseId}/send-payment-link — envío del link de pago.
 *   • POST /api/v1/interactions/search/case       — historial de interacciones.
 */
@Component({
  selector: 'app-orchestration',
  imports: [CommonModule, FormsModule],
  templateUrl: './orchestration.component.html',
  styleUrl: './orchestration.component.css'
})
export class OrchestrationComponent {
  store = inject(StoreService);
  private readonly orchestration = inject(OrchestrationService);
  private readonly interactions  = inject(InteractionService);

  // ── Campañas mock (dashboard) ────────────────────────────────────────
  showNewCampaign = signal(false);

  newName    = '';
  newSegment = 'Preventiva';
  newChannel: Campaign['channel'] = 'WhatsApp';

  readonly channelIcons: Record<string, string> = {
    'WhatsApp': '💬',
    'SMS':      '📱',
    'Email':    '✉️',
    'Voz':      '📞',
  };

  readonly statusColors: Record<string, string> = {
    'En curso':   'badge-success',
    'Completada': 'badge-info',
    'Pausada':    'badge-warning',
  };

  createCampaign(): void {
    if (!this.newName.trim()) return;
    this.store.addCampaign({
      id: `C-${Date.now()}`,
      name: this.newName,
      segment: this.newSegment,
      progress: 0,
      status: 'En curso',
      channel: this.newChannel,
    });
    this.newName = '';
    this.showNewCampaign.set(false);
  }

  // ── Integración real con /api/v1/orchestration ──────────────────────
  readonly channels = INTERACTION_CHANNELS;
  readonly paymentMethods = PAYMENT_METHODS;

  /** Envío manual. */
  readonly sendCaseId   = signal<number | null>(null);
  readonly sendChannel  = signal<InteractionChannel>('SMS');
  readonly sendDest     = signal('');
  readonly sendTemplate = signal('');
  readonly sendLoading  = signal(false);
  readonly sendError    = signal('');
  readonly lastSent     = signal<OrchestrationExecutionResponse | null>(null);

  /** Lookup de ejecuciones / interacciones por caso. */
  readonly lookupCaseId = signal<number | null>(null);
  readonly executions   = signal<OrchestrationExecutionResponse[]>([]);
  readonly interactionsList = signal<InteractionResponse[]>([]);
  readonly lookupLoading = signal(false);
  readonly lookupError   = signal('');

  /** Payment link (multicanal) para un caso. */
  readonly linkCaseId  = signal<number | null>(null);
  readonly linkMethod  = signal<PaymentMethod | null>(null);
  readonly linkAmount  = signal<number | null>(null);
  readonly linkChannels = signal<InteractionChannel[]>([]);
  readonly linkLoading = signal(false);
  readonly linkError   = signal('');
  readonly lastLinkResponse = signal<SendPaymentLinkResponse | null>(null);

  /** KPIs vivos calculados a partir del lookup actual. */
  readonly executionsDeliveredCount = computed(() =>
    this.executions().filter(e => e.estado === 'ENVIADO').length
  );
  readonly executionsFailedCount = computed(() =>
    this.executions().filter(e => e.estado === 'FALLIDO').length
  );

  // ── Acciones ─────────────────────────────────────────────────────────
  sendManual(): void {
    const caseId = this.sendCaseId();
    if (caseId == null || caseId <= 0) { this.sendError.set('Ingresa un ID de caso válido.'); return; }
    const destino   = this.sendDest().trim();
    const plantilla = this.sendTemplate().trim();
    if (!destino || !plantilla) {
      this.sendError.set('Destino y plantilla son obligatorios.');
      return;
    }

    const request: SendOrchestrationRequest = {
      casoGestionId: caseId,
      canal: this.sendChannel(),
      destino,
      plantilla,
    };

    this.sendLoading.set(true);
    this.sendError.set('');
    this.lastSent.set(null);
    this.orchestration.send(request).subscribe({
      next: (resp) => {
        this.lastSent.set(resp);
        this.sendLoading.set(false);
      },
      error: (err) => {
        this.sendLoading.set(false);
        this.sendError.set(this.errorMessage(err));
      },
    });
  }

  lookupByCase(): void {
    const caseId = this.lookupCaseId();
    if (caseId == null || caseId <= 0) { this.lookupError.set('Ingresa un ID de caso válido.'); return; }

    this.lookupLoading.set(true);
    this.lookupError.set('');
    this.executions.set([]);
    this.interactionsList.set([]);

    this.orchestration.listByCase(caseId).subscribe({
      next: (execs) => this.executions.set(execs),
      error: (err)  => this.lookupError.set(this.errorMessage(err)),
    });

    this.interactions.listByCase(caseId).subscribe({
      next: (list) => {
        this.interactionsList.set(list);
        this.lookupLoading.set(false);
      },
      error: (err) => {
        this.lookupLoading.set(false);
        this.lookupError.set(this.errorMessage(err));
      },
    });
  }

  toggleLinkChannel(channel: InteractionChannel): void {
    this.linkChannels.update(curr =>
      curr.includes(channel) ? curr.filter(c => c !== channel) : [...curr, channel]
    );
  }

  sendPaymentLink(): void {
    const caseId = this.linkCaseId();
    if (caseId == null || caseId <= 0) { this.linkError.set('Ingresa un ID de caso válido.'); return; }

    const request: SendPaymentLinkRequest = {
      amount:  this.linkAmount(),
      method:  this.linkMethod(),
      channels: this.linkChannels().length ? this.linkChannels() : null,
    };

    this.linkLoading.set(true);
    this.linkError.set('');
    this.lastLinkResponse.set(null);

    this.orchestration.sendPaymentLink(caseId, request).subscribe({
      next: (resp) => {
        this.lastLinkResponse.set(resp);
        this.linkLoading.set(false);
      },
      error: (err) => {
        this.linkLoading.set(false);
        this.linkError.set(this.errorMessage(err));
      },
    });
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0)   return 'Sin conexión con el backend (puerto 8080).';
      if (err.status === 404) return 'Recurso no encontrado.';
      if (err.status === 401 || err.status === 403) return 'No tienes permisos para esta operación.';
      const msg =
        (err.error && typeof err.error === 'object' && (err.error.message || err.error.error)) ||
        err.message;
      return msg || `Error ${err.status}`;
    }
    return 'Error inesperado.';
  }
}
