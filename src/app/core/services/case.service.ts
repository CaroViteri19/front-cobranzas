import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_PATHS } from '../config/api.config';
import {
  AssignAdvisorByCaseRequest,
  CaseResponse,
  CloseCaseRequest,
  CreateCaseRequest,
  GetCaseByIdRequest,
  ScheduleActionByCaseRequest,
  TransitionCaseStatusRequest,
} from '../models/case.model';

/**
 * Cliente HTTP tipado para `/api/v1/cases` (CaseController.java).
 *
 * Firma de métodos estilo "un argumento = un request DTO" para no
 * propagar listas interminables de strings por el call-site.
 */
@Injectable({ providedIn: 'root' })
export class CaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_PATHS.cases;

  /** Crea un nuevo caso (POST /). */
  create(request: CreateCaseRequest): Observable<CaseResponse> {
    return this.http.post<CaseResponse>(this.baseUrl, request);
  }

  /** Obtiene un caso por ID (POST /search/id). */
  getById(caseId: number): Observable<CaseResponse> {
    const body: GetCaseByIdRequest = { caseId };
    return this.http.post<CaseResponse>(`${this.baseUrl}/search/id`, body);
  }

  /** Lista los casos pendientes de gestión (GET /pending). */
  listPending(): Observable<CaseResponse[]> {
    return this.http.get<CaseResponse[]>(`${this.baseUrl}/pending`);
  }

  /** Asigna un asesor a un caso (POST /assign-advisor). */
  assignAdvisor(request: AssignAdvisorByCaseRequest): Observable<CaseResponse> {
    return this.http.post<CaseResponse>(`${this.baseUrl}/assign-advisor`, request);
  }

  /** Programa la próxima acción (POST /schedule-action). */
  scheduleAction(request: ScheduleActionByCaseRequest): Observable<CaseResponse> {
    return this.http.post<CaseResponse>(`${this.baseUrl}/schedule-action`, request);
  }

  /** Transición de estado del caso (POST /transition-status). */
  transitionStatus(request: TransitionCaseStatusRequest): Observable<CaseResponse> {
    return this.http.post<CaseResponse>(`${this.baseUrl}/transition-status`, request);
  }

  /** Cierra un caso (POST /close). */
  close(caseId: number): Observable<CaseResponse> {
    const body: CloseCaseRequest = { caseId };
    return this.http.post<CaseResponse>(`${this.baseUrl}/close`, body);
  }
}
