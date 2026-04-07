import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-analytics',
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent {
  store = inject(StoreService);

  readonly recoveryTrend = [
    { month: 'Ene', recovery: 65, goal: 70 },
    { month: 'Feb', recovery: 72, goal: 70 },
    { month: 'Mar', recovery: 78, goal: 75 },
    { month: 'Abr', recovery: 85, goal: 80 },
    { month: 'May', recovery: 82, goal: 82 },
    { month: 'Jun', recovery: 88, goal: 85 },
  ];

  readonly maxVal = Math.max(...this.recoveryTrend.map(d => Math.max(d.recovery, d.goal)));

  readonly riskColors: Record<string, string> = {
    'Bajo':    '#10989B',
    'Medio':   '#055177',
    'Alto':    '#0A3B4E',
    'Crítico': '#ef4444',
  };

  readonly riskData = computed(() => {
    const associates = this.store.associates();
    const counts: Record<string, number> = {};
    associates.forEach(a => { counts[a.risk] = (counts[a.risk] || 0) + 1; });
    return ['Bajo', 'Medio', 'Alto', 'Crítico'].map(key => ({
      name: key,
      value: counts[key] || 0,
      color: this.riskColors[key],
      pct: associates.length > 0 ? ((counts[key] || 0) / associates.length * 100).toFixed(1) : '0'
    }));
  });

  barHeight(val: number): number {
    return (val / this.maxVal) * 100;
  }
}
