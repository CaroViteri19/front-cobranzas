import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_PATHS } from '../config/api.config';
import {
  ConfirmPaymentRequest,
  CreatePaymentRequest,
  GenerateLinkRequest,
  GenerateLinkResponse,
  GetPaymentByIdRequest,
  GetPaymentByReferenceRequest,
  ListPaymentsByObligationRequest,
  PaymentResponse,
  RejectPaymentRequest,
} from '../models/payment.model';

/**
 * Cliente HTTP tipado para `/api/v1/payments` (PaymentController.java).
 * Todos los endpoints son POST con body JSON.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_PATHS.payments;

  /** Registra manualmente un pago (POST /). */
  create(request: CreatePaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.baseUrl, request);
  }

  /** Solicita a la pasarela un link de pago (POST /generate-link). */
  generateLink(request: GenerateLinkRequest): Observable<GenerateLinkResponse> {
    return this.http.post<GenerateLinkResponse>(`${this.baseUrl}/generate-link`, request);
  }

  /** Obtiene un pago por ID (POST /search/id). */
  getById(paymentId: number): Observable<PaymentResponse> {
    const body: GetPaymentByIdRequest = { paymentId };
    return this.http.post<PaymentResponse>(`${this.baseUrl}/search/id`, body);
  }

  /** Obtiene un pago por referencia externa (POST /search/reference). */
  getByReference(externalReference: string): Observable<PaymentResponse> {
    const body: GetPaymentByReferenceRequest = { externalReference };
    return this.http.post<PaymentResponse>(`${this.baseUrl}/search/reference`, body);
  }

  /** Lista los pagos de una obligación (POST /search/obligation). */
  listByObligation(obligationId: number): Observable<PaymentResponse[]> {
    const body: ListPaymentsByObligationRequest = { obligationId };
    return this.http.post<PaymentResponse[]>(`${this.baseUrl}/search/obligation`, body);
  }

  /** Confirma un pago pendiente (POST /confirm). El backend espera `reference`. */
  confirm(reference: string): Observable<PaymentResponse> {
    const body: ConfirmPaymentRequest = { reference };
    return this.http.post<PaymentResponse>(`${this.baseUrl}/confirm`, body);
  }

  /** Rechaza un pago pendiente (POST /reject). */
  reject(paymentId: number): Observable<PaymentResponse> {
    const body: RejectPaymentRequest = { paymentId };
    return this.http.post<PaymentResponse>(`${this.baseUrl}/reject`, body);
  }
}
