import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reporting',
  imports: [CommonModule],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css'
})
export class ReportingComponent {
  activeTab = signal<'operative' | 'compliance' | 'performance'>('operative');

  readonly reports = [
    { id: '1', title: 'Informe Ejecutivo de Cartera',  date: '01 Abr 2024', type: 'PDF',   size: '2.4 MB' },
    { id: '2', title: 'Reporte de Cumplimiento Ley 2300', date: '31 Mar 2024', type: 'PDF', size: '1.1 MB' },
    { id: '3', title: 'Efectividad de Agentes Q1',     date: '30 Mar 2024', type: 'XLSX',  size: '890 KB' },
    { id: '4', title: 'Análisis de Mora por Segmento', date: '28 Mar 2024', type: 'PDF',   size: '1.8 MB' },
    { id: '5', title: 'Dashboard Mensual - Marzo',     date: '28 Mar 2024', type: 'PDF',   size: '3.2 MB' },
  ];

  readonly agentPerf = [
    { agent: 'Agente 01', cases: 85, recovered: 68, rate: 80, avg: 4.2 },
    { agent: 'Agente 02', cases: 72, recovered: 54, rate: 75, avg: 5.1 },
    { agent: 'Agente 03', cases: 91, recovered: 78, rate: 86, avg: 3.8 },
    { agent: 'Agente 04', cases: 63, recovered: 44, rate: 70, avg: 6.3 },
  ];

  readonly complianceMetrics = [
    { label: 'Contactos dentro de horario',     value: 99.8,  status: 'ok' },
    { label: 'Sin comunicaciones restringidas',  value: 100.0, status: 'ok' },
    { label: 'Auditoría de interacciones',       value: 100.0, status: 'ok' },
    { label: 'SAGRILAFT actualizado',            value: 97.5,  status: 'warning' },
  ];
}
