import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_PATHS } from '../config/api.config';
import {
  CreateInteractionRequest,
  GetInteractionByIdRequest,
  InteractionResponse,
  ListInteractionsByCaseRequest,
  UpdateInteractionResultRequest,
} from '../models/interaction.model';

/**
 * Cliente HTTP tipado para `/api/v1/interactions` (InteractionController.java).
 * Todos los endpoints son POST con body JSON.
 */
@Injectable({ providedIn: 'root' })
export class InteractionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_PATHS.interactions;

  /** Crea una nueva interacción (POST /). */
  create(request: CreateInteractionRequest): Observable<InteractionResponse> {
    return this.http.post<InteractionResponse>(this.baseUrl, request);
  }

  /** Obtiene una interacción por ID (POST /search/id). */
  getById(interactionId: number): Observable<InteractionResponse> {
    const body: GetInteractionByIdRequest = { interactionId };
    return this.http.post<InteractionResponse>(`${this.baseUrl}/search/id`, body);
  }

  /** Lista las interacciones de un caso (POST /search/case). */
  listByCase(caseId: number): Observable<InteractionResponse[]> {
    const body: ListInteractionsByCaseRequest = { caseId };
    return this.http.post<InteractionResponse[]>(`${this.baseUrl}/search/case`, body);
  }

  /** Actualiza el resultado de una interacción (POST /update-result). */
  updateResult(request: UpdateInteractionResultRequest): Observable<InteractionResponse> {
    return this.http.post<InteractionResponse>(`${this.baseUrl}/update-result`, request);
  }
}
