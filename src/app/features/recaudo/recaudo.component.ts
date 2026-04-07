import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-recaudo',
  imports: [CommonModule],
  templateUrl: './recaudo.component.html',
  styleUrl: './recaudo.component.css'
})
export class RecaudoComponent {
  store = inject(StoreService);

  confirmedPayments = signal<Set<string>>(new Set());

  readonly monthlyData = [
    { month: 'Ene', collected: 285, target: 320 },
    { month: 'Feb', collected: 340, target: 320 },
    { month: 'Mar', collected: 298, target: 350 },
    { month: 'Abr', collected: 412, target: 380 },
    { month: 'May', collected: 368, target: 380 },
    { month: 'Jun', collected: 445, target: 400 },
  ];

  readonly kpis = [
    { label: 'Recaudo Mes',      value: '$445M', change: '+12.4%', positive: true },
    { label: 'Meta Cumplida',    value: '111%',  change: '+11pts', positive: true },
    { label: 'Acuerdos Activos', value: '284',   change: '-8',     positive: false },
    { label: 'Tasa de Mora',     value: '3.2%',  change: '-0.4%',  positive: true },
  ];

  readonly paymentQueue = [
    { id: 'AC-102', name: 'Ricardo Gómez',   amount: 1_500_000, installments: 3, dueDate: 'Mañana',     urgent: true },
    { id: 'AC-087', name: 'Sofía Vargas',    amount: 2_200_000, installments: 2, dueDate: 'En 3 días',  urgent: false },
    { id: 'AC-099', name: 'Jorge Ríos',      amount: 850_000,   installments: 1, dueDate: 'En 5 días',  urgent: false },
    { id: 'AC-115', name: 'Carmen Suárez',   amount: 3_750_000, installments: 6, dueDate: 'En 7 días',  urgent: false },
  ];

  confirm(id: string): void {
    this.confirmedPayments.update(s => new Set([...s, id]));
  }

  isConfirmed(id: string): boolean {
    return this.confirmedPayments().has(id);
  }

  maxCollected(): number {
    return Math.max(...this.monthlyData.map(d => Math.max(d.collected, d.target)));
  }
}
