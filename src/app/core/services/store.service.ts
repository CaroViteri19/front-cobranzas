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
    this.cases().filter(c => c.status !== 'ST-006' && c.status !== 'ST-007').length
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

  /** Count of cases per status — used for deletion guard in Settings */
  // Partial<Record<...>> permite que los índices no existentes sean 'number | undefined',
  // lo que justifica el '?? 0' en el template y evita el warning NG8102.
  readonly caseCountPerStatus = computed((): Partial<Record<string, number>> => {
    const counts: Partial<Record<string, number>> = {};
    this.cases().forEach(c => {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    });
    return counts;
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

    // ── 7-State Finite Machine (Ley 2300 compliant) ────────────────
    const statuses: CaseStatus[] = [
      {
        id: 'ST-001', name: 'Nuevo', color: '#3b82f6',
        description: 'Caso recién ingresado desde CORE o carga batch',
        isInitial: true,
        predecessors: [],
        successors: ['ST-002', 'ST-003']
      },
      {
        id: 'ST-002', name: 'En Gestión', color: '#10b981',
        description: 'En proceso activo de cobro por agente asignado',
        predecessors: ['ST-001', 'ST-003', 'ST-004'],
        successors: ['ST-004', 'ST-003', 'ST-005']
      },
      {
        id: 'ST-003', name: 'Ilocalizado', color: '#f59e0b',
        description: 'Sin contacto exitoso con el asociado',
        predecessors: ['ST-001', 'ST-002'],
        successors: ['ST-002', 'ST-005']
      },
      {
        id: 'ST-004', name: 'Promesa Pago', color: '#10989B',
        description: 'Acuerdo de pago formalizado con el asociado',
        predecessors: ['ST-002'],
        successors: ['ST-006', 'ST-002']
      },
      {
        id: 'ST-005', name: 'Prejurídico', color: '#f97316',
        description: 'Escalado a proceso legal preventivo',
        predecessors: ['ST-002', 'ST-003'],
        successors: ['ST-006', 'ST-007']
      },
      {
        id: 'ST-006', name: 'Cerrado', color: '#64748b',
        description: 'Gestión finalizada — ciclo de cobranza completo',
        isFinal: true,
        predecessors: ['ST-004', 'ST-005'],
        successors: []
      },
      {
        id: 'ST-007', name: 'Cobro Judicial', color: '#ef4444',
        description: 'Proceso judicial activo — demanda interpuesta',
        isFinal: true,
        predecessors: ['ST-005'],
        successors: []
      },
    ];

    const associates: Associate[] = [
      { id: '1', name: 'Juan Pérez',    document: '10203040', email: 'juan@example.com',   phone: '3001234567', segment: 'Preventiva',     score: 850, propensity: 'Alta',  risk: 'Bajo',    balance: 1_500_000, daysOverdue: -5 },
      { id: '2', name: 'Maria García',  document: '50607080', email: 'maria@example.com',  phone: '3109876543', segment: 'Administrativa', score: 420, propensity: 'Media', risk: 'Alto',    balance: 4_250_000, daysOverdue: 15 },
      { id: '3', name: 'Carlos Ruiz',   document: '90102030', email: 'carlos@example.com', phone: '3201112233', segment: 'Temprana',       score: 680, propensity: 'Alta',  risk: 'Medio',   balance: 6_800_000, daysOverdue: 45 },
      { id: '4', name: 'Ana López',     document: '40506070', email: 'ana@example.com',    phone: '3154445566', segment: 'Prejurídica',    score: 150, propensity: 'Baja',  risk: 'Crítico', balance: 12_500_000, daysOverdue: 95 },
      { id: '5', name: 'Pedro Vargas',  document: '20304050', email: 'pedro@example.com',  phone: '3107778899', segment: 'Temprana',       score: 540, propensity: 'Media', risk: 'Alto',    balance: 3_200_000, daysOverdue: 38 },
      { id: '6', name: 'Lucía Méndez',  document: '60708090', email: 'lucia@example.com',  phone: '3165554433', segment: 'Administrativa', score: 720, propensity: 'Alta',  risk: 'Bajo',    balance: 2_100_000, daysOverdue: 8 },
    ];

    const cases: Case[] = [
      {
        id: 'CS-1', associateId: '1',
        status: 'ST-001', priority: 'Baja',
        assignedTo: undefined, assignmentSource: undefined, desbordeIA: false,
        notes: [], agreements: []
      },
      {
        id: 'CS-2', associateId: '2',
        status: 'ST-002', priority: 'Alta',
        assignedTo: 'Agente 02', assignmentSource: 'Manual', desbordeIA: false,
        notes: [], agreements: []
      },
      {
        id: 'CS-3', associateId: '3',
        status: 'ST-002', priority: 'Media',
        assignedTo: 'Agente 01', assignmentSource: 'IA', desbordeIA: false,
        notes: [], agreements: []
      },
      {
        id: 'CS-4', associateId: '4',
        status: 'ST-005', priority: 'Crítica',
        assignedTo: 'Agente 03', assignmentSource: 'IA', desbordeIA: true,
        notes: [], agreements: []
      },
      {
        id: 'CS-5', associateId: '5',
        status: 'ST-003', priority: 'Alta',
        assignedTo: 'Agente 01', assignmentSource: 'IA', desbordeIA: true,
        notes: [], agreements: []
      },
      {
        id: 'CS-6', associateId: '6',
        status: 'ST-004', priority: 'Baja',
        assignedTo: 'Agente 02', assignmentSource: 'Manual', desbordeIA: false,
        notes: [], agreements: []
      },
    ];

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

  // ── Rebalance (Load Balancer) ──────────────────────────────────────
  readonly availableAgents = ['Agente 01', 'Agente 02', 'Agente 03', 'Agente 04'];

  rebalanceCases(): void {
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
          return {
            ...c,
            assignedTo: this.availableAgents[agentIndex++ % this.availableAgents.length],
            assignmentSource: 'IA' as const,
            desbordeIA: true,
            status: 'ST-002'
          };
        }
        return c;
      })
    );
  }

  /** Manual reassignment by Supervisor or Administrador */
  reassignCase(caseId: string, agentName: string, source: 'IA' | 'Manual' = 'Manual'): void {
    this.cases.update(list =>
      list.map(c => c.id === caseId
        ? { ...c, assignedTo: agentName, assignmentSource: source, desbordeIA: source === 'IA' }
        : c
      )
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
