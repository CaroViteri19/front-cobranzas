/**
 * Modelos TypeScript alineados 1:1 con los DTOs del backend
 * (coovitelCobranza.cobranzas.payment.application.dto.*).
 *
 * Todos los endpoints del PaymentController son POST con body JSON.
 */

/** Métodos de pago soportados (Payment.PaymentMethod). */
export const PAYMENT_METHODS = ['PSE', 'CARD', 'TRANSFER', 'OFFICE'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

/** Estados de un pago (Payment.PaymentStatus). */
export const PAYMENT_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

/**
 * Respuesta estándar de un pago (PaymentResponse.java).
 *
 * `amount` se tipa como `number | string` porque el backend lo serializa
 * desde BigDecimal; trátese como string cuando la precisión importe.
 */
export interface PaymentResponse {
  id: number;
  obligationId: number;
  amount: number | string;
  externalReference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  /** ISO-8601 LocalDateTime. */
  confirmedAt: string | null;
  /** ISO-8601 LocalDateTime. */
  createdAt: string;
}

/** Creación manual de un pago (CreatePaymentRequest.java). */
export interface CreatePaymentRequest {
  obligationId: number;
  amount: number | string;
  externalReference: string;
  method: PaymentMethod;
}

/** Búsqueda por ID (GetPaymentByIdRequest.java). */
export interface GetPaymentByIdRequest {
  paymentId: number;
}

/** Búsqueda por referencia externa (GetPaymentByReferenceRequest.java). */
export interface GetPaymentByReferenceRequest {
  externalReference: string;
}

/** Listado de pagos de una obligación (ListPaymentsByObligationRequest.java). */
export interface ListPaymentsByObligationRequest {
  obligationId: number;
}

/**
 * Confirmación de pago (ConfirmPaymentRequest.java).
 * Ojo: el backend espera `reference`, no `externalReference`.
 */
export interface ConfirmPaymentRequest {
  reference: string;
}

/** Rechazo de pago (RejectPaymentRequest.java). */
export interface RejectPaymentRequest {
  paymentId: number;
}

/** Generación de link de pago (GenerateLinkRequest.java). */
export interface GenerateLinkRequest {
  obligationId: number;
  method: PaymentMethod;
}

/** Respuesta al generar un link de pago (GenerateLinkResponse.java). */
export interface GenerateLinkResponse {
  paymentId: number;
  paymentUrl: string;
  sessionToken: string | null;
  /** ISO-8601 LocalDateTime. */
  expirationDate: string | null;
  gatewayReference: string | null;
}
