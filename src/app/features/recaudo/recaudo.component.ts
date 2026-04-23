import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { StoreService } from '../../core/services/store.service';
import { PaymentService } from '../../core/services/payment.service';
import {
  GenerateLinkResponse,
  PAYMENT_METHODS,
  PaymentMethod,
  PaymentResponse,
} from '../../core/models/payment.model';

/**
 * Pantalla de recaudo.
 *
 * Combina un dashboard de KPIs (mock) con una sección real integrada contra
 * {@code /api/v1/payments}: listar pagos de una obligación, generar link,
 * confirmar/rechazar, buscar por referencia externa.
 */
@Component({
  selector: 'app-recaudo',
  imports: [CommonModule, FormsModule],
  templateUrl: './recaudo.component.html',
  styleUrl: './recaudo.component.css'
})
export class RecaudoComponent {
  store = inject(StoreService);
  private readonly payments = inject(PaymentService);

  /** IDs de pagos que el usuario ha confirmado en esta sesión (para la cola mock). */
  confirmedPayments = signal<Set<string>>(new Set());

  // ── Dashboard mock (kpis / gráfico) ───────────────────────────────────
  readonly monthlyData = [
    { month: 'Ene', collected: 285, target: 320 },
    { month: 'Feb', collected: 340, target: 320 },
    { month: 'Mar', collected: 298, target: 350 },
    { month: 'Abr', collected: 412, target: 380 },
    { month: 'May', collected: 368, target: 380 },
    { month: 'Jun', collected: 445, target: 400 },
  ];

  readonly kpis = [
    { label: 'Recaudo Mes',      value: '$445M', change: '+12.4%', positive: true },
    { label: 'Meta Cumplida',    value: '111%',  change: '+11pts', positive: true },
    { label: 'Acuerdos Activos', value: '284',   change: '-8',     positive: false },
    { label: 'Tasa de Mora',     value: '3.2%',  change: '-0.4%',  positive: true },
  ];

  readonly paymentQueue = [
    { id: 'AC-102', name: 'Ricardo Gómez',   amount: 1_500_000, installments: 3, dueDate: 'Mañana',     urgent: true },
    { id: 'AC-087', name: 'Sofía Vargas',    amount: 2_200_000, installments: 2, dueDate: 'En 3 días',  urgent: false },
    { id: 'AC-099', name: 'Jorge Ríos',      amount: 850_000,   installments: 1, dueDate: 'En 5 días',  urgent: false },
    { id: 'AC-115', name: 'Carmen Suárez',   amount: 3_750_000, installments: 6, dueDate: 'En 7 días',  urgent: false },
  ];

  confirm(id: string): void {
    this.confirmedPayments.update(s => new Set([...s, id]));
  }

  isConfirmed(id: string): boolean {
    return this.confirmedPayments().has(id);
  }

  maxCollected(): number {
    return Math.max(...this.monthlyData.map(d => Math.max(d.collected, d.target)));
  }

  // ── Integración real con /api/v1/payments ─────────────────────────────
  readonly paymentMethods = PAYMENT_METHODS;

  /** Filtro "listar pagos por obligación". */
  readonly obligationQuery = signal<number | null>(null);
  /** Filtro "buscar pago por referencia". */
  readonly referenceQuery  = signal('');

  /** Parámetros para generar un link de pago. */
  readonly linkObligationId = signal<number | null>(null);
  readonly linkMethod       = signal<PaymentMethod>('PSE');

  readonly paymentsList  = signal<PaymentResponse[]>([]);
  readonly lastGenerated = signal<GenerateLinkResponse | null>(null);

  readonly listLoading   = signal(false);
  readonly listError     = signal('');
  readonly linkLoading   = signal(false);
  readonly linkError     = signal('');
  readonly actionLoading = signal(false);
  readonly actionError   = signal('');
  readonly actionInfo    = signal('');

  readonly totalListedAmount = computed(() =>
    this.paymentsList().reduce((acc, p) => acc + Number(p.amount ?? 0), 0)
  );

  /** Lista los pagos de la obligación indicada. */
  loadPaymentsByObligation(): void {
    const id = this.obligationQuery();
    if (id == null || id <= 0) {
      this.listError.set('Ingresa un ID de obligación válido.');
      return;
    }
    this.listLoading.set(true);
    this.listError.set('');
    this.payments.listByObligation(id).subscribe({
      next: (list) => {
        this.paymentsList.set(list);
        this.listLoading.set(false);
      },
      error: (err) => {
        this.listLoading.set(false);
        this.listError.set(this.errorMessage(err));
      },
    });
  }

  /** Busca un pago por su referencia externa. */
  findByReference(): void {
    const ref = this.referenceQuery().trim();
    if (!ref) {
      this.listError.set('Ingresa una referencia externa.');
      return;
    }
    this.listLoading.set(true);
    this.listError.set('');
    this.payments.getByReference(ref).subscribe({
      next: (payment) => {
        this.paymentsList.set([payment]);
        this.listLoading.set(false);
      },
      error: (err) => {
        this.listLoading.set(false);
        this.listError.set(this.errorMessage(err));
      },
    });
  }

  /** Genera un link de pago para la obligación seleccionada. */
  generateLink(): void {
    const id = this.linkObligationId();
    if (id == null || id <= 0) {
      this.linkError.set('Ingresa un ID de obligación válido.');
      return;
    }
    this.linkLoading.set(true);
    this.linkError.set('');
    this.lastGenerated.set(null);
    this.payments.generateLink({ obligationId: id, method: this.linkMethod() }).subscribe({
      next: (resp) => {
        this.lastGenerated.set(resp);
        this.linkLoading.set(false);
      },
      error: (err) => {
        this.linkLoading.set(false);
        this.linkError.set(this.errorMessage(err));
      },
    });
  }

  /** Confirma un pago por su referencia externa. */
  confirmByReference(reference: string): void {
    if (!reference) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.actionInfo.set('');
    this.payments.confirm(reference).subscribe({
      next: (updated) => {
        this.actionInfo.set(`Pago ${updated.id} confirmado.`);
        this.actionLoading.set(false);
        this.replacePaymentInList(updated);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(this.errorMessage(err));
      },
    });
  }

  /** Rechaza un pago pendiente por su ID. */
  rejectPayment(paymentId: number): void {
    this.actionLoading.set(true);
    this.actionError.set('');
    this.actionInfo.set('');
    this.payments.reject(paymentId).subscribe({
      next: (updated) => {
        this.actionInfo.set(`Pago ${updated.id} rechazado.`);
        this.actionLoading.set(false);
        this.replacePaymentInList(updated);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(this.errorMessage(err));
      },
    });
  }

  private replacePaymentInList(updated: PaymentResponse): void {
    this.paymentsList.update(list =>
      list.map(p => p.id === updated.id ? updated : p)
    );
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
