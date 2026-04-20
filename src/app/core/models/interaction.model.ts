/**
 * Modelos TypeScript alineados 1:1 con los DTOs del backend
 * (coovitelCobranza.cobranzas.interaction.application.dto.*).
 *
 * Todos los endpoints del InteractionController son POST con body JSON.
 */

/** Canales soportados (Interaction.Channel). */
export const INTERACTION_CHANNELS = ['SMS', 'WHATSAPP', 'EMAIL', 'VOICE'] as const;
export type InteractionChannel = typeof INTERACTION_CHANNELS[number];

/** Resultado de una interacción (Interaction.ResultStatus). */
export const INTERACTION_RESULTS = [
  'PENDING',
  'DELIVERED',
  'READ',
  'ANSWERED',
  'FAILED',
  'NO_CONTACT',
] as const;
export type InteractionResult = typeof INTERACTION_RESULTS[number];

/** Respuesta estándar de una interacción (InteractionResponse.java). */
export interface InteractionResponse {
  id: number;
  caseId: number;
  channel: InteractionChannel;
  template: string;
  result: InteractionResult;
  /** ISO-8601 LocalDateTime. */
  createdAt: string;
}

/** Creación de interacción (CreateInteractionRequest.java). */
export interface CreateInteractionRequest {
  caseId: number;
  channel: InteractionChannel;
  template: string;
}

/** Búsqueda por ID (GetInteractionByIdRequest.java). */
export interface GetInteractionByIdRequest {
  interactionId: number;
}

/** Listado por caso (ListInteractionsByCaseRequest.java). */
export interface ListInteractionsByCaseRequest {
  caseId: number;
}

/**
 * Actualización de resultado (UpdateInteractionResultRequest.java).
 * Es el DTO que recibe el controller, no el interno de service.
 */
export interface UpdateInteractionResultRequest {
  interactionId: number;
  result: InteractionResult;
}
