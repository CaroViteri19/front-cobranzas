export interface ColumnDefinition<T> {
  key: keyof T;
  label: string;
  type?: 'text' | 'email' | 'date' | 'badge' | 'action';
  sortable?: boolean;
  width?: string;
  format?: (value: any) => string;
}

export interface TableState {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface Policy {
  id: string;
  name: string;
  segment: string;
  intensity: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  description?: string;
}

export interface RiskLevel {
  id?: string;
  level: string;
  score: string;
  mora: string;
  color: string;
  action: string;
}

export interface CaseStatus {
  id: string;
  name: string;
  color: string;
  description: string;
  isInitial: boolean;
  isFinal: boolean;
}

export interface AssignmentRule {
  id: string;
  name: string;
  minAmount: number;
  riskLevels: string[];
  maxFailedAttempts: number;
  priority: number;
  isActive: boolean;
}

