import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RuleItem {
  rule: string;
  value: string;
  type: string;
}

interface AssignmentRule {
  id: string;
  name: string;
  minAmount: number;
  maxFailedAttempts: number;
  riskLevels: string[];
  priority: number;
  isActive: boolean;
}

@Component({
  selector: 'app-settings-rules-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-rules-tab.component.html',
})
export class SettingsRulesTabComponent {
  showAddRule = signal(false);
  showAddAssignment = signal(false);

  rules = signal<RuleItem[]>([
    { rule: 'Ventana de Contacto L-V', value: '07:00 - 19:00', type: 'Horario' },
    { rule: 'Ventana de Contacto Sabados', value: '08:00 - 15:00', type: 'Horario' },
    { rule: 'Frecuencia Maxima Semanal', value: '2 contactos / canal', type: 'Frecuencia' },
  ]);

  assignmentRules = signal<AssignmentRule[]>([
    {
      id: 'R-001',
      name: 'Casos de Alto Monto',
      minAmount: 1000000,
      maxFailedAttempts: 2,
      riskLevels: ['Alto', 'Critico'],
      priority: 1,
      isActive: true,
    },
    {
      id: 'R-002',
      name: 'Desborde por Intentos',
      minAmount: 0,
      maxFailedAttempts: 3,
      riskLevels: ['Medio', 'Alto'],
      priority: 2,
      isActive: true,
    },
  ]);

  newRule = { rule: '', value: '', type: 'General' };
  newAssignment = {
    name: '',
    minAmount: 0,
    maxFailedAttempts: 0,
    riskLevels: [] as string[],
    priority: 1,
    isActive: true,
  };

  readonly riskOptions = ['Bajo', 'Medio', 'Alto', 'Critico'];

  addRule(): void {
    if (!this.newRule.rule || !this.newRule.value) return;
    this.rules.update((list) => [...list, { ...this.newRule }]);
    this.newRule = { rule: '', value: '', type: 'General' };
    this.showAddRule.set(false);
  }

  removeRule(index: number): void {
    this.rules.update((list) => list.filter((_, i) => i !== index));
  }

  addAssignmentRule(): void {
    if (!this.newAssignment.name) return;
    const id = `R-${Date.now()}`;
    this.assignmentRules.update((list) => [...list, { id, ...this.newAssignment }]);
    this.newAssignment = {
      name: '',
      minAmount: 0,
      maxFailedAttempts: 0,
      riskLevels: [],
      priority: 1,
      isActive: true,
    };
    this.showAddAssignment.set(false);
  }

  removeAssignmentRule(id: string): void {
    this.assignmentRules.update((list) => list.filter((rule) => rule.id !== id));
  }

  toggleRiskSelection(risk: string, checked: boolean): void {
    if (checked) {
      this.newAssignment.riskLevels = [...this.newAssignment.riskLevels, risk];
      return;
    }
    this.newAssignment.riskLevels = this.newAssignment.riskLevels.filter((r) => r !== risk);
  }
}

