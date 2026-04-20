/**
 * Modelos TypeScript alineados 1:1 con los DTOs del backend
 * (coovitelCobranza.cobranzas.orchestration.application.dto.*).
 *
 * OJO: El contrato actual de OrchestrationController usa nombres de campo en
 * castellano (`casoGestionId`, `canal`, `destino`, `plantilla`, `estado`).
 * Se respetan tal cual para no introducir mapeos intermedios.
 */

import type { InteractionChannel } from './interaction.model';
import type { PaymentMethod } from './payment.model';

/** Estados de una ejecución de orquestación (OrchestrationExecution.Status). */
export const ORCHESTRATION_STATUSES = ['ENVIADO', 'FALLIDO', 'PENDIENTE'] as const;
export type OrchestrationStatus = string;

/** Respuesta estándar de una ejecución (OrchestrationExecutionResponse.java). */
export interface OrchestrationExecutionResponse {
  id: number;
  casoGestionId: number;
  canal: string;
  destino: string;
  plantilla: string;
  estado: OrchestrationStatus;
  /** ISO-8601 LocalDateTime. */
  createdAt: string;
}

/** Envío manual de una orquestación (SendOrchestrationRequest.java). */
export interface SendOrchestrationRequest {
  casoGestionId: number;
  canal: InteractionChannel;
  destino: string;
  plantilla: string;
}

/** Búsqueda por ID (GetOrchestrationByIdRequest.java). */
export interface GetOrchestrationByIdRequest {
  executionId: number;
}

/** Listado por caso (ListOrchestrationByCaseRequest.java). */
export interface ListOrchestrationByCaseRequest {
  caseId: number;
}

/**
 * Petición de envío del link de pago para un caso (SendPaymentLinkRequest.java).
 * Todos los campos son opcionales; si se omiten el backend usa defaults.
 */
export interface SendPaymentLinkRequest {
  /** Monto a cobrar; si es null se usa el saldo total de la obligación. */
  amount?: number | string | null;
  /** Método propuesto al generar el link; default PSE. */
  method?: PaymentMethod | null;
  /** Canales específicos; si es null/vacío se usan los consentidos por el cliente. */
  channels?: InteractionChannel[] | null;
}

/** Resultado por canal (ChannelDispatchResult.java). */
export interface ChannelDispatchResult {
  channel: InteractionChannel;
  destination: string | null;
  interactionId: number | null;
  delivered: boolean;
  reason: string | null;
}

/** Resumen del envío multicanal (SendPaymentLinkResponse.java). */
export interface SendPaymentLinkResponse {
  caseId: number;
  obligationId: number;
  paymentId: number;
  paymentUrl: string;
  channelsAttempted: number;
  channelsDelivered: number;
  dispatches: ChannelDispatchResult[];
}
