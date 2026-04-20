import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL, API_PATHS } from '../config/api.config';
import {
  GetOrchestrationByIdRequest,
  ListOrchestrationByCaseRequest,
  OrchestrationExecutionResponse,
  SendOrchestrationRequest,
  SendPaymentLinkRequest,
  SendPaymentLinkResponse,
} from '../models/orchestration.model';

/**
 * Cliente HTTP tipado para el módulo de orquestación.
 *
 * Consume `/api/v1/orchestration` (OrchestrationController.java) para el envío
 * manual / consulta de ejecuciones, y `/api/v1/cases/{caseId}/send-payment-link`
 * (CasePaymentLinkController.java) para el flujo multicanal de link de pago.
 */
@Injectable({ providedIn: 'root' })
export class OrchestrationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_PATHS.orchestration;
  private readonly casesBaseUrl = `${API_BASE_URL}/api/v1/cases`;

  /** Envío manual de una orquestación puntual (POST /send). */
  send(request: SendOrchestrationRequest): Observable<OrchestrationExecutionResponse> {
    return this.http.post<OrchestrationExecutionResponse>(`${this.baseUrl}/send`, request);
  }

  /** Obtiene una ejecución por ID (POST /search/id). */
  getById(executionId: number): Observable<OrchestrationExecutionResponse> {
    const body: GetOrchestrationByIdRequest = { executionId };
    return this.http.post<OrchestrationExecutionResponse>(`${this.baseUrl}/search/id`, body);
  }

  /** Lista las ejecuciones de un caso (POST /search/case). */
  listByCase(caseId: number): Observable<OrchestrationExecutionResponse[]> {
    const body: ListOrchestrationByCaseRequest = { caseId };
    return this.http.post<OrchestrationExecutionResponse[]>(`${this.baseUrl}/search/case`, body);
  }

  /**
   * Dispara la generación del link de pago para un caso y el envío multicanal
   * (POST /api/v1/cases/{caseId}/send-payment-link).
   *
   * Si `request` es null/undefined el backend usa todos los defaults
   * (amount=saldo, method=PSE, canales consentidos del cliente).
   */
  sendPaymentLink(
    caseId: number,
    request: SendPaymentLinkRequest | null = null,
  ): Observable<SendPaymentLinkResponse> {
    return this.http.post<SendPaymentLinkResponse>(
      `${this.casesBaseUrl}/${caseId}/send-payment-link`,
      request ?? {},
    );
  }
}
