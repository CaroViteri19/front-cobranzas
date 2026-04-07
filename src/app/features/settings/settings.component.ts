import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { AssignmentRule } from '../../core/models';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  store = inject(StoreService);

  activeSection = signal<'statuses' | 'rules' | 'system'>('rules');

  // New Rule Form
  newRuleName   = '';
  newRuleAmount = '';
  newRuleRisk   = '';
  showNewRule   = signal(false);

  addRule(): void {
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
    this.newRuleName   = '';
    this.newRuleAmount = '';
    this.newRuleRisk   = '';
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
  }
}
