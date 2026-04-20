import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_PATHS } from '../config/api.config';
import {
  ApplyObligationPaymentRequest,
  GetObligationByIdRequest,
  GetObligationByNumberRequest,
  ListObligationsByClientRequest,
  ObligationResponse,
  RegisterDelinquencyRequest,
} from '../models/obligation.model';

/**
 * Cliente HTTP tipado para el recurso `/api/v1/obligations` del backend
 * (ObligationController.java). Todos los endpoints son POST con cuerpo JSON.
 */
@Injectable({ providedIn: 'root' })
export class ObligationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_PATHS.obligations;

  /** Lee una obligación por su ID interno. */
  getById(obligationId: number): Observable<ObligationResponse> {
    const body: GetObligationByIdRequest = { obligationId };
    return this.http.post<ObligationResponse>(`${this.baseUrl}/search/id`, body);
  }

  /** Lee una obligación por su número de obligación. */
  getByNumber(obligationNumber: string): Observable<ObligationResponse> {
    const body: GetObligationByNumberRequest = { obligationNumber };
    return this.http.post<ObligationResponse>(`${this.baseUrl}/search/number`, body);
  }

  /** Lista todas las obligaciones de un cliente. */
  listByClient(clientId: number): Observable<ObligationResponse[]> {
    const body: ListObligationsByClientRequest = { clientId };
    return this.http.post<ObligationResponse[]>(`${this.baseUrl}/search/client`, body);
  }

  /** Registra o actualiza la mora de una obligación. */
  registerDelinquency(
    obligationId: number,
    delinquencyDays: number,
    overdueBalance: number,
  ): Observable<ObligationResponse> {
    const body: RegisterDelinquencyRequest = {
      obligationId,
      delinquencyDays,
      overdueBalance,
    };
    return this.http.post<ObligationResponse>(`${this.baseUrl}/update/delinquency`, body);
  }

  /** Aplica un pago al saldo de la obligación. */
  applyPayment(obligationId: number, paymentAmount: number): Observable<ObligationResponse> {
    const body: ApplyObligationPaymentRequest = { obligationId, paymentAmount };
    return this.http.post<ObligationResponse>(`${this.baseUrl}/apply-payment`, body);
  }
}
