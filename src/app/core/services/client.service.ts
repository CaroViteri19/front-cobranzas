import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_PATHS } from '../config/api.config';
import {
  ClientResponse,
  CreateClientRequest,
  GetClientByDocumentRequest,
  GetClientByIdRequest,
  ListClientsRequest,
  PageResponse,
  UpdateClientConsentsRequest,
  UpdateClientContactRequest,
} from '../models/client.model';

/**
 * Cliente HTTP tipado para el recurso `/api/v1/clients` del backend.
 *
 * <p>Los endpoints siguen el estilo RPC sobre POST que usa el controller
 * (ClientController.java): todos reciben un JSON body con la consulta,
 * incluidos los "search".
 */
@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_PATHS.clients;

  /** Crea un nuevo cliente. Requiere rol ADMINISTRADOR o SUPERVISOR. */
  create(request: CreateClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.baseUrl, request);
  }

  /** Lista clientes paginados (por defecto 10 por página). */
  list(page: number = 0, size: number = 10): Observable<PageResponse<ClientResponse>> {
    const body: ListClientsRequest = { page, size };
    return this.http.post<PageResponse<ClientResponse>>(`${this.baseUrl}/list`, body);
  }

  /** Busca un cliente por su ID interno. */
  getById(clientId: number): Observable<ClientResponse> {
    const body: GetClientByIdRequest = { clientId };
    return this.http.post<ClientResponse>(`${this.baseUrl}/search/id`, body);
  }

  /** Busca un cliente por tipo y número de documento. */
  getByDocument(documentType: string, documentNumber: string): Observable<ClientResponse> {
    const body: GetClientByDocumentRequest = { documentType, documentNumber };
    return this.http.post<ClientResponse>(`${this.baseUrl}/search/document`, body);
  }

  /** Actualiza el teléfono y correo electrónico del cliente. */
  updateContact(clientId: number, phone: string, email: string): Observable<ClientResponse> {
    const body: UpdateClientContactRequest = { clientId, phone, email };
    return this.http.post<ClientResponse>(`${this.baseUrl}/update/contact`, body);
  }

  /** Actualiza los consentimientos de comunicación (WhatsApp / SMS / Email). */
  updateConsents(
    clientId: number,
    acceptsWhatsApp: boolean,
    acceptsSms: boolean,
    acceptsEmail: boolean,
  ): Observable<ClientResponse> {
    const body: UpdateClientConsentsRequest = {
      clientId,
      acceptsWhatsApp,
      acceptsSms,
      acceptsEmail,
    };
    return this.http.post<ClientResponse>(`${this.baseUrl}/update/consents`, body);
  }
}
