// ============================================
// BankVision - Modelos de Dominio
// ============================================

export interface User {
  name: string;
  email: string;
  role: string;
}

export interface Associate {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  segment: string;
  score: number;
  propensity: 'Alta' | 'Media' | 'Baja';
  risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  balance: number;
  daysOverdue: number;
  lastAction?: string;
}

export interface CaseNote {
  date: string;
  text: string;
  author: string;
}

export interface Agreement {
  date: string;
  amount: number;
  installments: number;
}

export interface Case {
  id: string;
  associateId: string;
  status: string;
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  assignedTo?: string;
  assignmentSource?: 'IA' | 'Manual';   // who/what triggered the assignment
  desbordeIA?: boolean;                  // flagged by M4 AI overflow
  notes: CaseNote[];
  agreements: Agreement[];
}

export interface CaseStatus {
  id: string;
  name: string;
  color: string;
  description: string;
  isInitial?: boolean;
  isFinal?: boolean;
  predecessors?: string[];   // IDs of valid predecessor statuses
  successors?: string[];     // IDs of valid successor statuses
}

export interface Policy {
  id: string;
  name: string;
  criteria: string;
  intensity: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  color: string;
}

export interface Campaign {
  id: string;
  name: string;
  segment: string;
  progress: number;
  status: 'En curso' | 'Completada' | 'Pausada';
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'Voz';
}

export interface AssignmentRule {
  id: string;
  name: string;
  minAmount?: number;
  riskLevels?: string[];
  maxFailedAttempts?: number;
  priority: number;
  isActive: boolean;
}
