/**
 * Modelos TypeScript alineados 1:1 con los DTOs del backend
 * (coovitelCobranza.cobranzas.casemanagement.application.dto.*).
 *
 * Todos los endpoints del CaseController son POST con body JSON (estilo RPC),
 * excepto `GET /api/v1/cases/pending`.
 */

/** Estados de un caso (Case.Status). */
export const CASE_STATUSES = [
  'NEW',
  'IN_MANAGEMENT',
  'UNREACHABLE',
  'PAYMENT_PROMISE',
  'PRE_LEGAL',
  'JUDICIAL_COLLECTION',
  'CLOSED',
] as const;
export type CaseStatus = typeof CASE_STATUSES[number];

/** Prioridades de un caso (Case.Priority). */
export const CASE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type CasePriority = typeof CASE_PRIORITIES[number];

/**
 * Respuesta estándar de un caso (CaseResponse.java).
 *
 * `priority` y `status` llegan como String crudo desde el backend pero
 * corresponden a los enums `Case.Priority` y `Case.Status`.
 */
export interface CaseResponse {
  id: number;
  obligationId: number;
  priority: CasePriority;
  status: CaseStatus;
  assignedAdvisor: string | null;
  /** ISO-8601 LocalDateTime. */
  nextActionAt: string | null;
  /** ISO-8601 LocalDateTime. */
  updatedAt: string;
}

/** Creación de caso (CreateCaseRequest.java). */
export interface CreateCaseRequest {
  obligationId: number;
  priority: CasePriority;
}

/** Búsqueda por ID (GetCaseByIdRequest.java). */
export interface GetCaseByIdRequest {
  caseId: number;
}

/** Asignar asesor (AssignAdvisorByCaseRequest.java). */
export interface AssignAdvisorByCaseRequest {
  caseId: number;
  advisor: string;
  performedBy: string;
  performedByRole: string;
  assignmentSource: string;
  correlationId: string;
}

/** Transición de estado (TransitionCaseStatusRequest.java). */
export interface TransitionCaseStatusRequest {
  caseId: number;
  targetStatus: CaseStatus;
  reason: string;
  performedBy: string;
  performedByRole: string;
  source: string;
  correlationId: string;
}

/** Programar próxima acción (ScheduleActionByCaseRequest.java). */
export interface ScheduleActionByCaseRequest {
  caseId: number;
  /** ISO-8601 LocalDateTime. */
  actionAt: string;
}

/** Cierre de caso (CloseCaseRequest.java). */
export interface CloseCaseRequest {
  caseId: number;
}
