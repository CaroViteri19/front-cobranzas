import { Injectable, signal, computed } from '@angular/core';
import {
  Associate, Case, Policy, Campaign,
  CaseStatus, AssignmentRule, CaseNote
} from '../models';
import { ClientResponse } from '../models/client.model';
import { ObligationResponse } from '../models/obligation.model';

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
  readonly caseCountPerStatus = computed(() => {
    const counts: Record<string, number> = {};
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

    // Asociados y casos: vacíos — se cargan desde backend (ClientController /list + ObligationController).
    const associates: Associate[] = [];
    const cases: Case[] = [];

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

  // ── Integración con backend ───────────────────────────────────────────
  /**
   * Prefijo usado para el id interno de un asociado "inyectado" desde el
   * backend. Así convivimos con los ids mock ("1", "2"...) sin colisionar.
   */
  private static readonly BACKEND_ASSOC_PREFIX = 'BE-';
  private static readonly BACKEND_CASE_PREFIX  = 'CS-BE-';

  /**
   * Inserta o actualiza un asociado a partir de un cliente del backend y
   * sus obligaciones. Si no existe un caso para él, crea uno automáticamente
   * en estado "Nuevo" y prioridad calculada por días de mora.
   *
   * @param client       Datos del cliente (ClientResponse del backend).
   * @param obligations  Obligaciones del cliente (puede ser [] si aún no cargadas).
   * @returns Par {asociado, caso} finalmente almacenados en la store.
   */
  upsertAssociateFromBackend(
    client: ClientResponse,
    obligations: ObligationResponse[] = [],
  ): { associate: Associate; caseItem: Case } {

    const associateId = `${StoreService.BACKEND_ASSOC_PREFIX}${client.id}`;

    // Agrega saldos y elige la obligación más vencida como "referencia".
    const totalBalance   = obligations.reduce((sum, o) => sum + Number(o.totalBalance), 0);
    const overdueBalance = obligations.reduce((sum, o) => sum + Number(o.overdueBalance), 0);
    const worstDelinquency = obligations.reduce(
      (max, o) => Math.max(max, o.delinquencyDays), 0,
    );

    // Heurísticas simples para los campos que el backend no expone todavía.
    const segment = this.segmentFromDays(worstDelinquency);
    const risk    = this.riskFromBalance(overdueBalance, worstDelinquency);
    const score   = this.scoreFromSignals(worstDelinquency, overdueBalance);

    const associate: Associate = {
      id: associateId,
      name:         client.fullName,
      document:     `${client.tipoDocumento} ${client.numeroDocumento}`,
      email:        client.email,
      phone:        client.telefono,
      segment,
      score,
      propensity:   score >= 700 ? 'Alta' : score >= 450 ? 'Media' : 'Baja',
      risk,
      balance:      totalBalance,
      daysOverdue:  worstDelinquency,
    };

    // Upsert en la lista de asociados.
    this.associates.update(list => {
      const idx = list.findIndex(a => a.id === associateId);
      return idx >= 0
        ? list.map((a, i) => i === idx ? associate : a)
        : [...list, associate];
    });

    // Crea el caso si aún no existe para este asociado.
    const caseId = `${StoreService.BACKEND_CASE_PREFIX}${client.id}`;
    const existing = this.cases().find(c => c.id === caseId);
    const caseItem: Case = existing ?? {
      id: caseId,
      associateId,
      status: worstDelinquency > 0 ? 'ST-002' : 'ST-001',
      priority: this.priorityFromDays(worstDelinquency),
      assignedTo: undefined,
      assignmentSource: undefined,
      desbordeIA: false,
      notes: [],
      agreements: [],
    };

    this.cases.update(list =>
      existing
        ? list.map(c => c.id === caseId ? { ...c, /* refrescamos nada del caso */ } : c)
        : [...list, caseItem]
    );

    return { associate, caseItem };
  }

  // ── Helpers de derivación ─────────────────────────────────────────────
  private segmentFromDays(days: number): string {
    if (days <= 0)  return 'Preventiva';
    if (days <= 30) return 'Administrativa';
    if (days <= 60) return 'Temprana';
    return 'Prejurídica';
  }

  private riskFromBalance(overdue: number, days: number): Associate['risk'] {
    if (days >= 90 || overdue >= 10_000_000) return 'Crítico';
    if (days >= 45 || overdue >=  5_000_000) return 'Alto';
    if (days >  0)                           return 'Medio';
    return 'Bajo';
  }

  private scoreFromSignals(days: number, overdue: number): number {
    // Score estimado (0-1000). Ajustable cuando el backend exponga un score real.
    let score = 900;
    score -= Math.min(days, 120) * 5;
    score -= Math.min(overdue / 100_000, 200);
    return Math.max(50, Math.round(score));
  }

  private priorityFromDays(days: number): Case['priority'] {
    if (days >= 90) return 'Crítica';
    if (days >= 45) return 'Alta';
    if (days >  0)  return 'Media';
    return 'Baja';
  }
}
