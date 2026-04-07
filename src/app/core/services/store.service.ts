import { Injectable, signal, computed } from '@angular/core';
import {
  Associate, Case, Policy, Campaign,
  CaseStatus, AssignmentRule, CaseNote
} from '../models';

@Injectable({ providedIn: 'root' })
export class StoreService {

  // ── State Signals ──────────────────────────────────────────────────
  readonly associates = signal<Associate[]>([]);
  readonly cases      = signal<Case[]>([]);
  readonly policies   = signal<Policy[]>([]);
  readonly campaigns  = signal<Campaign[]>([]);
  readonly caseStatuses   = signal<CaseStatus[]>([]);
  readonly assignmentRules = signal<AssignmentRule[]>([]);

  // ── Computed ───────────────────────────────────────────────────────
  readonly totalBalance = computed(() =>
    this.associates().reduce((sum, a) => sum + a.balance, 0)
  );

  readonly activeCasesCount = computed(() =>
    this.cases().filter(c => c.status !== 'ST-006').length
  );

  readonly agentLoad = computed(() => {
    const agents = ['Agente 01', 'Agente 02', 'Agente 03', 'Agente 04'];
    const total = this.cases().length;
    return agents.map(agent => ({
      name: agent,
      count: this.cases().filter(c => c.assignedTo === agent).length,
      percentage: total > 0
        ? (this.cases().filter(c => c.assignedTo === agent).length / total) * 100
        : 0
    }));
  });

  constructor() {
    this.seedData();
  }

  // ── Seed / Mock Data ───────────────────────────────────────────────
  private seedData(): void {
    const rules: AssignmentRule[] = [
      { id: 'R-001', name: 'Mora Crítica > 10M', minAmount: 10_000_000, riskLevels: ['Crítico'], isActive: true, priority: 1 },
      { id: 'R-002', name: 'Intentos Fallidos > 3', maxFailedAttempts: 3, isActive: true, priority: 2 },
    ];

    const statuses: CaseStatus[] = [
      { id: 'ST-001', name: 'Nuevo',               color: '#3b82f6', description: 'Caso recién ingresado',       isInitial: true },
      { id: 'ST-002', name: 'En Gestión',           color: '#10b981', description: 'En proceso de cobro' },
      { id: 'ST-003', name: 'Promesa Pago',         color: '#10989B', description: 'Acuerdo formalizado' },
      { id: 'ST-004', name: 'Ilocalizado',          color: '#f59e0b', description: 'Sin contacto exitoso' },
      { id: 'ST-005', name: 'Prejurídico',          color: '#ef4444', description: 'Escalado a legal' },
      { id: 'ST-006', name: 'Cerrado',              color: '#64748b', description: 'Gestión finalizada',          isFinal: true },
    ];

    const associates: Associate[] = [
      { id: '1', name: 'Juan Pérez',    document: '10203040', email: 'juan@example.com',   phone: '3001234567', segment: 'Preventiva',     score: 850, propensity: 'Alta',  risk: 'Bajo',    balance: 1_500_000, daysOverdue: -5 },
      { id: '2', name: 'Maria García',  document: '50607080', email: 'maria@example.com',  phone: '3109876543', segment: 'Administrativa', score: 420, propensity: 'Media', risk: 'Alto',    balance: 4_250_000, daysOverdue: 15 },
      { id: '3', name: 'Carlos Ruiz',   document: '90102030', email: 'carlos@example.com', phone: '3201112233', segment: 'Temprana',       score: 680, propensity: 'Alta',  risk: 'Medio',   balance: 6_800_000, daysOverdue: 45 },
      { id: '4', name: 'Ana López',     document: '40506070', email: 'ana@example.com',    phone: '3154445566', segment: 'Prejurídica',    score: 150, propensity: 'Baja',  risk: 'Crítico', balance: 12_500_000, daysOverdue: 95 },
      { id: '5', name: 'Pedro Vargas',  document: '20304050', email: 'pedro@example.com',  phone: '3107778899', segment: 'Temprana',       score: 540, propensity: 'Media', risk: 'Alto',    balance: 3_200_000, daysOverdue: 38 },
      { id: '6', name: 'Lucía Méndez',  document: '60708090', email: 'lucia@example.com',  phone: '3165554433', segment: 'Administrativa', score: 720, propensity: 'Alta',  risk: 'Bajo',    balance: 2_100_000, daysOverdue: 8 },
    ];

    const cases: Case[] = associates.map(a => ({
      id: `CS-${a.id}`,
      associateId: a.id,
      status: a.daysOverdue > 90 ? 'ST-005' : a.daysOverdue > 0 ? 'ST-002' : 'ST-001',
      priority: a.risk === 'Crítico' ? 'Crítica' : a.risk === 'Alto' ? 'Alta' : a.risk === 'Medio' ? 'Media' : 'Baja',
      notes: [],
      agreements: []
    }));

    const policies: Policy[] = [
      { id: 'SEG-001', name: 'Preventiva',     criteria: 'Mora < 0 días',      intensity: 'Baja',    color: '#10b981' },
      { id: 'SEG-002', name: 'Administrativa', criteria: 'Mora 1-30 días',     intensity: 'Media',   color: '#3b82f6' },
      { id: 'SEG-003', name: 'Temprana',       criteria: 'Mora 31-60 días',    intensity: 'Alta',    color: '#f59e0b' },
      { id: 'SEG-004', name: 'Prejurídica',    criteria: 'Mora > 90 días',     intensity: 'Crítica', color: '#ef4444' },
    ];

    const campaigns: Campaign[] = [
      { id: 'C-001', name: 'Recordatorio Preventivo Q1', segment: 'Preventiva',     progress: 85, status: 'En curso',   channel: 'WhatsApp' },
      { id: 'C-002', name: 'Recuperación Administrativa', segment: 'Administrativa', progress: 42, status: 'En curso',   channel: 'SMS' },
      { id: 'C-003', name: 'Campaña Temprana Abril',      segment: 'Temprana',       progress: 100, status: 'Completada', channel: 'Email' },
    ];

    this.assignmentRules.set(rules);
    this.caseStatuses.set(statuses);
    this.associates.set(associates);
    this.cases.set(cases);
    this.policies.set(policies);
    this.campaigns.set(campaigns);
  }

  // ── Associates ─────────────────────────────────────────────────────
  addAssociate(a: Associate): void {
    this.associates.update(list => [...list, a]);
  }

  // ── Cases ──────────────────────────────────────────────────────────
  updateCase(id: string, updates: Partial<Case>): void {
    this.cases.update(list => list.map(c => c.id === id ? { ...c, ...updates } : c));
  }

  addNoteToCase(caseId: string, text: string, author = 'Camilo Cantor'): void {
    const note: CaseNote = { date: new Date().toISOString(), text, author };
    this.cases.update(list =>
      list.map(c => c.id === caseId ? { ...c, notes: [note, ...c.notes] } : c)
    );
  }

  // ── Campaigns ──────────────────────────────────────────────────────
  addCampaign(c: Campaign): void {
    this.campaigns.update(list => [...list, c]);
  }

  updateCampaignProgress(id: string, progress: number): void {
    this.campaigns.update(list =>
      list.map(c => c.id === id ? { ...c, progress } : c)
    );
  }

  // ── Case Statuses ──────────────────────────────────────────────────
  addCaseStatus(s: CaseStatus): void {
    this.caseStatuses.update(list => [...list, s]);
  }

  updateCaseStatus(id: string, updates: Partial<CaseStatus>): void {
    this.caseStatuses.update(list => list.map(s => s.id === id ? { ...s, ...updates } : s));
  }

  deleteCaseStatus(id: string): void {
    this.caseStatuses.update(list => list.filter(s => s.id !== id));
  }

  // ── Assignment Rules ───────────────────────────────────────────────
  addAssignmentRule(r: AssignmentRule): void {
    this.assignmentRules.update(list => [...list, r]);
  }

  updateAssignmentRule(id: string, updates: Partial<AssignmentRule>): void {
    this.assignmentRules.update(list =>
      list.map(r => r.id === id ? { ...r, ...updates } : r)
    );
  }

  deleteAssignmentRule(id: string): void {
    this.assignmentRules.update(list => list.filter(r => r.id !== id));
  }

  // ── Rebalance ──────────────────────────────────────────────────────
  rebalanceCases(): void {
    const agents = ['Agente 01', 'Agente 02', 'Agente 03', 'Agente 04'];
    let agentIndex = 0;
    this.cases.update(list =>
      list.map(c => {
        const associate = this.associates().find(a => a.id === c.associateId);
        if (!associate || c.assignedTo) return c;

        const shouldAssign = this.assignmentRules().some(rule => {
          if (!rule.isActive) return false;
          if (rule.minAmount && associate.balance < rule.minAmount) return false;
          if (rule.riskLevels && !rule.riskLevels.includes(associate.risk)) return false;
          return true;
        });

        if (shouldAssign) {
          return { ...c, assignedTo: agents[agentIndex++ % agents.length], status: 'ST-002' };
        }
        return c;
      })
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────
  getStatusInfo(statusId: string): CaseStatus {
    return this.caseStatuses().find(s => s.id === statusId)
      ?? { id: statusId, name: statusId, color: '#64748b', description: '' };
  }

  getAssociate(id: string): Associate | undefined {
    return this.associates().find(a => a.id === id);
  }
}
