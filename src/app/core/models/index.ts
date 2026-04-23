// ============================================
// BankVision - Modelos de Dominio
// ============================================
//
// ⚠️ Los tipos declarados en este archivo son modelos LEGACY usados por
// StoreService y por pantallas que aún trabajan con mock data.
//
// Para consumir el backend real (Spring Boot) usa los modelos alineados 1:1
// con los DTOs REST:
//   • client.model.ts         → /api/v1/clients
//   • obligation.model.ts     → /api/v1/obligations
//   • case.model.ts           → /api/v1/cases
//   • payment.model.ts        → /api/v1/payments
//   • interaction.model.ts    → /api/v1/interactions
//   • orchestration.model.ts  → /api/v1/orchestration  +  /api/v1/cases/{id}/send-payment-link
//
// Se re-exportan explícitamente con alias para evitar colisión de nombres
// (p.ej. el mock local `CaseStatus` vs el enum de backend `BackendCaseStatus`).

// --- Re-exports de modelos backend-aligned ----------------------------------
export type {
  ClientResponse,
  CreateClientRequest,
  GetClientByIdRequest,
  GetClientByDocumentRequest,
  UpdateClientContactRequest,
  UpdateClientConsentsRequest,
  DocumentType,
  ListClientsRequest,
  PageResponse,
} from './client.model';
export { DOCUMENT_TYPES } from './client.model';

export type {
  ObligationResponse,
  ObligationStatus,
  GetObligationByIdRequest,
  GetObligationByNumberRequest,
  ListObligationsByClientRequest,
  RegisterDelinquencyRequest,
  ApplyObligationPaymentRequest,
} from './obligation.model';

export type {
  CaseResponse,
  CasePriority,
  CreateCaseRequest,
  GetCaseByIdRequest,
  AssignAdvisorByCaseRequest,
  TransitionCaseStatusRequest,
  ScheduleActionByCaseRequest,
  CloseCaseRequest,
} from './case.model';
// Alias para evitar colisión con el interface mock `CaseStatus` declarado abajo.
export type { CaseStatus as BackendCaseStatus } from './case.model';
export { CASE_STATUSES, CASE_PRIORITIES } from './case.model';

export type {
  PaymentResponse,
  PaymentMethod,
  PaymentStatus,
  CreatePaymentRequest,
  GetPaymentByIdRequest,
  GetPaymentByReferenceRequest,
  ListPaymentsByObligationRequest,
  ConfirmPaymentRequest,
  RejectPaymentRequest,
  GenerateLinkRequest,
  GenerateLinkResponse,
} from './payment.model';
export { PAYMENT_METHODS, PAYMENT_STATUSES } from './payment.model';

export type {
  InteractionResponse,
  InteractionChannel,
  InteractionResult,
  CreateInteractionRequest,
  GetInteractionByIdRequest,
  ListInteractionsByCaseRequest,
  UpdateInteractionResultRequest,
} from './interaction.model';
export { INTERACTION_CHANNELS, INTERACTION_RESULTS } from './interaction.model';

export type {
  OrchestrationExecutionResponse,
  OrchestrationStatus,
  SendOrchestrationRequest,
  GetOrchestrationByIdRequest,
  ListOrchestrationByCaseRequest,
  SendPaymentLinkRequest,
  SendPaymentLinkResponse,
  ChannelDispatchResult,
} from './orchestration.model';
export { ORCHESTRATION_STATUSES } from './orchestration.model';

// --- Modelos legacy (mock data usado por StoreService y pantallas viejas) ---

export interface User {
  name: string;
  email: string;
  role: string;
}

export interface Associate {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  segment: string;
  score: number;
  propensity: 'Alta' | 'Media' | 'Baja';
  risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  balance: number;
  daysOverdue: number;
  lastAction?: string;
}

export interface CaseNote {
  date: string;
  text: string;
  author: string;
}

export interface Agreement {
  date: string;
  amount: number;
  installments: number;
}

export interface Case {
  id: string;
  associateId: string;
  status: string;
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  assignedTo?: string;
  assignmentSource?: 'IA' | 'Manual';   // who/what triggered the assignment
  desbordeIA?: boolean;                  // flagged by M4 AI overflow
  notes: CaseNote[];
  agreements: Agreement[];
}

export interface CaseStatus {
  id: string;
  name: string;
  color: string;
  description: string;
  isInitial?: boolean;
  isFinal?: boolean;
  predecessors?: string[];   // IDs of valid predecessor statuses
  successors?: string[];     // IDs of valid successor statuses
}

export interface Policy {
  id: string;
  name: string;
  criteria: string;
  intensity: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  color: string;
}

export interface Campaign {
  id: string;
  name: string;
  segment: string;
  progress: number;
  status: 'En curso' | 'Completada' | 'Pausada';
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'Voz';
}

export interface AssignmentRule {
  id: string;
  name: string;
  minAmount?: number;
  riskLevels?: string[];
  maxFailedAttempts?: number;
  priority: number;
  isActive: boolean;
}
