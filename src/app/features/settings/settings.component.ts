import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { AssignmentRule, CaseStatus } from '../../core/models';
import { UserService, RoleOption } from '../../core/services/user.service';

export type SettingsTab =
  'policies' | 'case-statuses' | 'file-structure' | 'users' | 'assignment-rules' | 'security';

// ── Local interfaces ───────────────────────────────────────────────────────────
interface RiskLevel {
  level: string;
  score: string;
  mora: string;
  color: string;
  action: string;
}

interface PolicyItem {
  name: string;
  segment: string;
  intensity: string;
}

interface AiVariable {
  label: string;
  weight: number;
}

interface ContactRule {
  rule: string;
  value: string;
  type: string;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Activo' | 'Inactivo';
  lastLogin: string;
}

interface SecurityPolicy {
  label: string;
  value: string;
  description: string;
  editable: boolean;
  icon: string;
}

// Possible access levels per module per role
type PermLevel = 'full' | 'read' | 'none';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  store       = inject(StoreService);
  userService = inject(UserService);

  activeTab = signal<SettingsTab>('policies');
  saving    = signal(false);
  savedOk   = signal(false);

  // ── POLÍTICAS & SCORE ──────────────────────────────────────────────────────
  riskLevels = signal<RiskLevel[]>([
    { level: 'Bajo',    score: '700 – 1000', mora: '0 – 5 días',    color: '#10b981', action: 'Recordatorio suave' },
    { level: 'Medio',   score: '400 – 699',  mora: '6 – 30 días',   color: '#3b82f6', action: 'Llamada informativa' },
    { level: 'Alto',    score: '200 – 399',  mora: '31 – 90 días',  color: '#f59e0b', action: 'Negociación directa' },
    { level: 'Crítico', score: '0 – 199',    mora: '> 90 días',     color: '#ef4444', action: 'Cobro prejurídico' },
  ]);

  showNewRisk = signal(false);
  newRisk = { level: '', score: '', mora: '', color: '#64748b', action: '' };

  addRiskLevel(): void {
    if (!this.newRisk.level || !this.newRisk.score) return;
    this.riskLevels.update(list => [...list, { ...this.newRisk }]);
    this.newRisk = { level: '', score: '', mora: '', color: '#64748b', action: '' };
    this.showNewRisk.set(false);
  }

  removeRiskLevel(idx: number): void {
    this.riskLevels.update(list => list.filter((_, i) => i !== idx));
  }

  policies = signal<PolicyItem[]>([
    { name: 'Preventiva',     segment: 'Mora < 0 días',     intensity: 'Baja' },
    { name: 'Administrativa', segment: 'Mora 1 – 30 días',  intensity: 'Media' },
    { name: 'Temprana',       segment: 'Mora 31 – 60 días', intensity: 'Alta' },
    { name: 'Prejurídica',    segment: 'Mora > 90 días',    intensity: 'Crítica' },
  ]);

  showNewPolicy = signal(false);
  newPolicy = { name: '', segment: '', intensity: 'Baja' };

  addPolicy(): void {
    if (!this.newPolicy.name || !this.newPolicy.segment) return;
    this.policies.update(list => [...list, { ...this.newPolicy }]);
    this.newPolicy = { name: '', segment: '', intensity: 'Baja' };
    this.showNewPolicy.set(false);
  }

  removePolicy(idx: number): void {
    this.policies.update(list => list.filter((_, i) => i !== idx));
  }

  // AI Scoring
  aiVariables = signal<AiVariable[]>([
    { label: 'Historial de Pago',            weight: 40 },
    { label: 'Días de Mora Actual',          weight: 30 },
    { label: 'Frecuencia de Incumplimiento', weight: 20 },
    { label: 'Antigüedad del Asociado',      weight: 10 },
  ]);

  aiModel = signal('Predictivo Estándar');
  totalWeight = computed(() => this.aiVariables().reduce((s, v) => s + v.weight, 0));

  updateWeight(idx: number, weight: number): void {
    this.aiVariables.update(list => list.map((v, i) => i === idx ? { ...v, weight } : v));
  }

  resetAiDefaults(): void {
    this.aiVariables.set([
      { label: 'Historial de Pago',            weight: 40 },
      { label: 'Días de Mora Actual',          weight: 30 },
      { label: 'Frecuencia de Incumplimiento', weight: 20 },
      { label: 'Antigüedad del Asociado',      weight: 10 },
    ]);
    this.aiModel.set('Predictivo Estándar');
  }

  showNewAiVar = signal(false);
  newAiVar = { label: '', weight: 0 };

  addAiVariable(): void {
    if (!this.newAiVar.label) return;
    this.aiVariables.update(list => [...list, { ...this.newAiVar }]);
    this.newAiVar = { label: '', weight: 0 };
    this.showNewAiVar.set(false);
  }

  removeAiVariable(idx: number): void {
    this.aiVariables.update(list => list.filter((_, i) => i !== idx));
  }

  // Contact Rules
  contactRules = signal<ContactRule[]>([
    { rule: 'Ventana de Contacto L-V',      value: '07:00 – 19:00',       type: 'Horario' },
    { rule: 'Ventana de Contacto Sábados',  value: '08:00 – 15:00',       type: 'Horario' },
    { rule: 'Frecuencia Máxima Semanal',    value: '2 contactos / canal', type: 'Frecuencia' },
    { rule: 'Exclusión Domingos/Festivos',  value: 'Habilitado',          type: 'Exclusión' },
  ]);

  showNewContactRule = signal(false);
  newContactRule = { rule: '', value: '', type: 'General' };

  addContactRule(): void {
    if (!this.newContactRule.rule || !this.newContactRule.value) return;
    this.contactRules.update(list => [...list, { ...this.newContactRule }]);
    this.newContactRule = { rule: '', value: '', type: 'General' };
    this.showNewContactRule.set(false);
  }

  removeContactRule(idx: number): void {
    this.contactRules.update(list => list.filter((_, i) => i !== idx));
  }

  // ── CASE STATUSES (Transition Matrix) ─────────────────────────────────────
  showNewStatus = signal(false);
  newStatus = { name: '', description: '', color: '#10989B' };
  deleteStatusError = signal<string | null>(null);

  /** Returns true if any case (active or historical) references this status */
  statusHasCases(id: string): boolean {
    return (this.store.caseCountPerStatus()[id] ?? 0) > 0;
  }

  /** Resolves status IDs to display names */
  statusNames(ids: string[] | undefined): string {
    if (!ids || ids.length === 0) return '—';
    return ids
      .map(id => this.store.caseStatuses().find(s => s.id === id)?.name ?? id)
      .join(', ');
  }

  addStatus(): void {
    if (!this.newStatus.name) return;
    const s: CaseStatus = {
      id: `ST-${Date.now()}`,
      name: this.newStatus.name,
      description: this.newStatus.description,
      color: this.newStatus.color,
      predecessors: [],
      successors: [],
    };
    this.store.addCaseStatus(s);
    this.newStatus = { name: '', description: '', color: '#10989B' };
    this.showNewStatus.set(false);
  }

  deleteStatus(id: string): void {
    this.deleteStatusError.set(null);
    if (this.statusHasCases(id)) {
      const count = this.store.caseCountPerStatus()[id];
      this.deleteStatusError.set(
        `No se puede eliminar: el estado tiene ${count} caso(s) activo(s) o histórico(s) registrado(s).`
      );
      setTimeout(() => this.deleteStatusError.set(null), 5000);
      return;
    }
    this.store.deleteCaseStatus(id);
  }

  // ── FILE STRUCTURE ─────────────────────────────────────────────────────────
  readonly fileFields = [
    { col: 'TIPO_ID',         type: 'VARCHAR(2)',    req: true,  desc: 'Tipo de documento (CC, NIT, CE, PA)' },
    { col: 'NUM_DOCUMENTO',   type: 'VARCHAR(20)',   req: true,  desc: 'Número de identificación del asociado' },
    { col: 'NOMBRE_COMPLETO', type: 'VARCHAR(120)',  req: true,  desc: 'Nombre y apellidos completos' },
    { col: 'NUM_OBLIGACION',  type: 'VARCHAR(30)',   req: true,  desc: 'Identificador único de la deuda' },
    { col: 'SALDO_TOTAL',     type: 'DECIMAL(18,2)', req: true,  desc: 'Monto total exigible en COP' },
    { col: 'DIAS_MORA',       type: 'INTEGER',       req: true,  desc: 'Días de vencimiento de la obligación' },
    { col: 'FECHA_VENC',      type: 'DATE',          req: true,  desc: 'Fecha de vencimiento (YYYYMMDD)' },
    { col: 'TELEFONO_1',      type: 'VARCHAR(15)',   req: true,  desc: 'Número celular principal' },
    { col: 'EMAIL',           type: 'VARCHAR(80)',   req: false, desc: 'Correo electrónico del asociado' },
    { col: 'TELEFONO_2',      type: 'VARCHAR(15)',   req: false, desc: 'Número alternativo de contacto' },
    { col: 'CIUDAD',          type: 'VARCHAR(60)',   req: false, desc: 'Ciudad de residencia' },
    { col: 'CANAL_PREFERIDO', type: 'VARCHAR(20)',   req: false, desc: 'WhatsApp | SMS | Email | Voz' },
    { col: 'SEGMENTO',        type: 'VARCHAR(30)',   req: false, desc: 'Segmento de cartera asignado' },
    { col: 'PRODUCTO',        type: 'VARCHAR(50)',   req: false, desc: 'Tipo de obligación financiera' },
    { col: 'CODIGO_AGENTE',   type: 'VARCHAR(10)',   req: false, desc: 'ID del agente asignado (si aplica)' },
  ];

  readonly requiredCount = this.fileFields.filter(f => f.req).length;
  readonly optionalCount = this.fileFields.filter(f => !f.req).length;

  // ── ASSIGNMENT RULES ──────────────────────────────────────────────────────
  showNewRule = signal(false);
  newRuleName   = '';
  newRuleAmount = '';
  newRuleRisk   = '';

  addAssignmentRule(): void {
    if (!this.newRuleName.trim()) return;
    const rule: AssignmentRule = {
      id: `R-${Date.now()}`,
      name: this.newRuleName,
      priority: this.store.assignmentRules().length + 1,
      isActive: true,
    };
    if (this.newRuleAmount) rule.minAmount = Number(this.newRuleAmount);
    if (this.newRuleRisk)   rule.riskLevels = [this.newRuleRisk];
    this.store.addAssignmentRule(rule);
    this.newRuleName = ''; this.newRuleAmount = ''; this.newRuleRisk = '';
    this.showNewRule.set(false);
  }

  toggleRule(id: string, current: boolean): void {
    this.store.updateAssignmentRule(id, { isActive: !current });
  }

  deleteRule(id: string): void {
    this.store.deleteAssignmentRule(id);
  }

  rebalance(): void {
    this.store.rebalanceCases();
    this.flashSave();
  }

  // ── USERS ──────────────────────────────────────────────────────────────────
  /** 4 canonical roles per spec */
  readonly roleOptions = ['Administrador', 'Supervisor', 'Agente', 'Auditor'];

  users = signal<AppUser[]>([
    { id: 'U-001', name: 'Camilo Cantor',    email: 'admin@fintra.co',      role: 'Administrador', status: 'Activo',   lastLogin: '07 Abr 2026, 09:15' },
    { id: 'U-002', name: 'Laura Rodríguez',  email: 'laura@fintra.co',      role: 'Supervisor',    status: 'Activo',   lastLogin: '07 Abr 2026, 09:00' },
    { id: 'U-003', name: 'Agente 01',        email: 'agente01@fintra.co',   role: 'Agente',        status: 'Activo',   lastLogin: '07 Abr 2026, 08:55' },
    { id: 'U-004', name: 'Agente 02',        email: 'agente02@fintra.co',   role: 'Agente',        status: 'Activo',   lastLogin: '07 Abr 2026, 08:30' },
    { id: 'U-005', name: 'Agente 03',        email: 'agente03@fintra.co',   role: 'Agente',        status: 'Activo',   lastLogin: '06 Abr 2026, 17:45' },
    { id: 'U-006', name: 'Agente 04',        email: 'agente04@fintra.co',   role: 'Agente',        status: 'Inactivo', lastLogin: '01 Abr 2026, 10:00' },
    { id: 'U-007', name: 'Carlos Mejía',     email: 'carlos@fintra.co',     role: 'Auditor',       status: 'Activo',   lastLogin: '05 Abr 2026, 14:20' },
  ]);

  // ── Gestión de usuarios ────────────────────────────────────────────────────
  showNewUser    = signal(false);
  savingUser     = signal(false);
  userError      = signal('');
  availableRoles = signal<RoleOption[]>([]);

  newUser = {
    fullName:  '',
    username:  '',
    email:     '',
    password:  '',
    roleId:    0     // ID del rol seleccionado
  };

  ngOnInit(): void {
    // Cargar roles disponibles desde el backend al iniciar el componente
    this.userService.getRoles()
      .then(roles => this.availableRoles.set(roles))
      .catch(() => {
        // Si falla (ej: token expirado) se usan nombres como fallback visual
        this.availableRoles.set([
          { id: 0, name: 'ADMINISTRADOR', description: '' },
          { id: 0, name: 'SUPERVISOR',    description: '' },
          { id: 0, name: 'AGENTE',        description: '' },
          { id: 0, name: 'AUDITOR',       description: '' },
        ]);
      });
  }

  async addUser(): Promise<void> {
    this.userError.set('');

    if (!this.newUser.fullName || !this.newUser.username ||
        !this.newUser.email    || !this.newUser.password) {
      this.userError.set('Todos los campos son obligatorios.');
      return;
    }

    this.savingUser.set(true);
    try {
      // 1. Registrar el usuario (queda con rol USER por defecto)
      const created = await this.userService.register({
        fullName: this.newUser.fullName,
        username: this.newUser.username,
        email:    this.newUser.email,
        password: this.newUser.password,
      });

      // 2. Asignar el rol real si se seleccionó uno
      if (this.newUser.roleId) {
        await this.userService.assignRole(created.id, this.newUser.roleId);
      }

      // 3. Agregar a la lista local para reflejar el cambio en la UI
      const roleName = this.availableRoles().find(r => r.id === this.newUser.roleId)?.name ?? 'USER';
      this.users.update(list => [...list, {
        id:        String(created.id),
        name:      created.fullName,
        email:     created.email,
        role:      roleName,
        status:    'Activo',
        lastLogin: 'Nunca'
      }]);

      // 4. Limpiar formulario
      this.newUser = { fullName: '', username: '', email: '', password: '', roleId: 0 };
      this.showNewUser.set(false);
    } catch (err: any) {
      this.userError.set(err?.error?.message ?? 'Error al crear el usuario. Verifica los datos.');
    } finally {
      this.savingUser.set(false);
    }
  }

  toggleUserStatus(id: string): void {
    this.users.update(list => list.map(u =>
      u.id === id ? { ...u, status: u.status === 'Activo' ? 'Inactivo' : 'Activo' } : u
    ));
  }

  removeUser(id: string): void {
    this.users.update(list => list.filter(u => u.id !== id));
  }

  readonly activeUsersCount = computed(() =>
    this.users().filter(u => u.status === 'Activo').length
  );

  roleCount(role: string): number {
    return this.users().filter(u => u.role === role && u.status === 'Activo').length;
  }

  // ── PERMISSIONS MATRIX (9 modules × 4 roles) ──────────────────────────────
  readonly permModules = [
    { label: 'Dashboard',       icon: '📊' },
    { label: 'M1 Integración',  icon: '🔌' },
    { label: 'M2 Analítica',    icon: '📈' },
    { label: 'M3 Políticas',    icon: '⚡' },
    { label: 'M4 Orquestación', icon: '🎛️' },
    { label: 'M5 Gestión Casos',icon: '📋' },
    { label: 'M6 Recaudo',      icon: '💰' },
    { label: 'M7 Reportes',     icon: '📄' },
    { label: 'Configuración',   icon: '⚙️' },
  ];

  readonly permRoles = ['Administrador', 'Supervisor', 'Agente', 'Auditor'];

  /**
   * permMatrix[moduleIndex][roleIndex]: 'full' | 'read' | 'none'
   * Signal so the Admin can edit it live. Col 0 (Admin) is always locked to 'full'.
   */
  private readonly defaultPermMatrix: PermLevel[][] = [
    //          Admin    Supervisor  Agente   Auditor
    /* Dashboard       */ ['full', 'full', 'full', 'read'],
    /* M1 Integración  */ ['full', 'read', 'none', 'read'],
    /* M2 Analítica    */ ['full', 'full', 'none', 'read'],
    /* M3 Políticas    */ ['full', 'read', 'none', 'read'],
    /* M4 Orquestación */ ['full', 'full', 'none', 'read'],
    /* M5 Gestión Casos*/ ['full', 'full', 'full', 'read'],
    /* M6 Recaudo      */ ['full', 'full', 'full', 'read'],
    /* M7 Reportes     */ ['full', 'full', 'read', 'full'],
    /* Configuración   */ ['full', 'none', 'none', 'read'],
  ];

  permMatrix = signal<PermLevel[][]>(
    this.defaultPermMatrix.map(row => [...row])
  );

  /** Cycle a cell through full → read → none → full. Admin col (0) always stays 'full'. */
  cyclePerm(mi: number, ri: number): void {
    if (ri === 0) return;   // Admin is always full — cannot be changed
    const cycle: PermLevel[] = ['full', 'read', 'none'];
    this.permMatrix.update(matrix => {
      const next = matrix.map(row => [...row]);
      const current = next[mi][ri];
      const idx = cycle.indexOf(current);
      next[mi][ri] = cycle[(idx + 1) % cycle.length];
      return next;
    });
  }

  resetPermMatrix(): void {
    this.permMatrix.set(this.defaultPermMatrix.map(row => [...row]));
  }

  permLabel(p: PermLevel): string {
    return p === 'full' ? 'Acceso total' : p === 'read' ? 'Solo lectura' : 'Sin acceso';
  }

  permClass(p: PermLevel): string {
    return p === 'full' ? 'perm-full' : p === 'read' ? 'perm-read' : 'perm-none';
  }

  chipText(p: PermLevel): string {
    return p === 'full' ? 'Acceso' : p === 'read' ? 'Lectura' : '—';
  }

  // ── SECURITY POLICIES ──────────────────────────────────────────────────────
  securityPolicies = signal<SecurityPolicy[]>([
    { label: 'Longitud mínima de contraseña',      value: '12',         description: 'Caracteres mínimos requeridos por política interna',          editable: true,  icon: '🔑' },
    { label: 'Intentos antes de bloqueo',          value: '3',          description: 'Bloqueo automático de cuenta tras intentos fallidos',          editable: true,  icon: '🔒' },
    { label: 'Duración del bloqueo (min)',          value: '30',         description: 'Minutos de bloqueo antes de permitir nuevo intento',           editable: true,  icon: '⏱️' },
    { label: 'Vigencia de contraseña (días)',       value: '90',         description: 'Días hasta expiración obligatoria de la contraseña',           editable: true,  icon: '📅' },
    { label: 'Cierre de sesión inactiva (min)',     value: '20',         description: 'Cierre automático por inactividad del usuario',                editable: true,  icon: '💤' },
    { label: 'Log de Auditoría Inmutable',          value: 'Habilitado', description: 'Registro inalterable de todas las acciones — Ley 2300',       editable: false, icon: '📜' },
    { label: 'Restricciones horarias Ley 2300',    value: 'Habilitado', description: 'Control automático de ventanas de contacto permitidas',        editable: false, icon: '⚖️' },
    { label: 'Cifrado en reposo (AES-256)',         value: 'Habilitado', description: 'Cifrado obligatorio de datos sensibles almacenados',           editable: false, icon: '🛡️' },
  ]);

  updateSecurityValue(idx: number, value: string): void {
    this.securityPolicies.update(list =>
      list.map((p, i) => i === idx ? { ...p, value } : p)
    );
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.flashSave();
    }, 1200);
  }

  private flashSave(): void {
    this.savedOk.set(true);
    setTimeout(() => this.savedOk.set(false), 2500);
  }
}
