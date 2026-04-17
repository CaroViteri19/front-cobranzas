/**
 * Modelos TypeScript alineados 1:1 con los DTOs del backend
 * (coovitelCobranza.cobranzas.obligacion.application.dto.*).
 */

/** Estados posibles de una obligación (Obligation.Status). */
export type ObligationStatus = 'AL_DIA' | 'EN_MORA' | 'REESTRUCTURADA' | 'CANCELADA';

/** Respuesta estándar de una obligación (ObligationResponse.java). */
export interface ObligationResponse {
  id: number;
  customerId: number;
  obligationNumber: string;
  /** Valores monetarios serializados como string para no perder precisión BigDecimal. */
  totalBalance: number | string;
  overdueBalance: number | string;
  delinquencyDays: number;
  status: ObligationStatus;
  /** ISO-8601 LocalDate (yyyy-MM-dd). */
  dueDate: string;
  /** ISO-8601 LocalDateTime. */
  updatedAt: string;
}

/** Búsqueda por ID (GetObligationByIdRequest.java). */
export interface GetObligationByIdRequest {
  obligationId: number;
}

/** Búsqueda por número de obligación (GetObligationByNumberRequest.java). */
export interface GetObligationByNumberRequest {
  obligationNumber: string;
}

/** Listado de obligaciones por cliente (ListObligationsByClientRequest.java). */
export interface ListObligationsByClientRequest {
  clientId: number;
}

/** Registro/actualización de mora (RegisterDelinquencyRequest.java). */
export interface RegisterDelinquencyRequest {
  obligationId: number;
  delinquencyDays: number;
  overdueBalance: number;
}

/** Aplicación de pago (ApplyObligationPaymentRequest.java). */
export interface ApplyObligationPaymentRequest {
  obligationId: number;
  paymentAmount: number;
}
