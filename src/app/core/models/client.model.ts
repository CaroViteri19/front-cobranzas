/**
 * Modelos TypeScript alineados 1:1 con los DTOs del backend
 * (coovitelCobranza.cobranzas.cliente.application.dto.*).
 *
 * Los nombres de los campos respetan el contrato JSON expuesto por Spring
 * para evitar mapeos intermedios.
 */

/** Respuesta al leer un cliente (ClientResponse.java). */
export interface ClientResponse {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  fullName: string;
  telefono: string;
  email: string;
  aceptaWhatsApp: boolean;
  aceptaSms: boolean;
  aceptaEmail: boolean;
  /** ISO-8601 (LocalDateTime serializado por Jackson). */
  updatedAt: string;
}

/** Petición para crear un cliente (CreateClientRequest.java). */
export interface CreateClientRequest {
  tipoDocumento: string;
  numeroDocumento: string;
  fullName: string;
  telefono: string;
  email: string;
}

/** Búsqueda por ID (GetClientByIdRequest.java). */
export interface GetClientByIdRequest {
  clientId: number;
}

/** Búsqueda por documento (GetClientByDocumentRequest.java). */
export interface GetClientByDocumentRequest {
  documentType: string;
  documentNumber: string;
}

/** Actualización de contacto (UpdateClientContactRequest.java). */
export interface UpdateClientContactRequest {
  clientId: number;
  phone: string;
  email: string;
}

/** Actualización de consentimientos (UpdateClientConsentsRequest.java). */
export interface UpdateClientConsentsRequest {
  clientId: number;
  acceptsWhatsApp: boolean;
  acceptsSms: boolean;
  acceptsEmail: boolean;
}

/** Valores soportados de tipo de documento según el backend. */
export const DOCUMENT_TYPES = ['CC', 'CE', 'TI', 'NIT', 'PAS'] as const;
export type DocumentType = typeof DOCUMENT_TYPES[number];

/** Petición de listado paginado (ListClientsRequest.java). */
export interface ListClientsRequest {
  page: number;
  size: number;
}

/** Respuesta genérica paginada (PageResponse.java). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
