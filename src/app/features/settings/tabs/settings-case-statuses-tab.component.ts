import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaseStatus } from '../../../core/models';
import { StoreService } from '../../../core/services/store.service';

@Component({
  selector: 'app-settings-case-statuses-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-case-statuses-tab.component.html',
})
export class SettingsCaseStatusesTabComponent {
  private readonly store = inject(StoreService);

  transitionTableOpen = signal(true);
  showNewStatus = signal(false);
  deleteStatusError = signal<string | null>(null);
  newStatus = { name: '', description: '', color: '#10989B' };

  readonly caseStatuses = this.store.caseStatuses;

  statusHasCases(id: string): boolean {
    return (this.store.caseCountPerStatus()[id] ?? 0) > 0;
  }

  statusCasesCount(id: string): number {
    return this.store.caseCountPerStatus()[id] ?? 0;
  }

  statusNames(ids: string[] | undefined): string {
    if (!ids || ids.length === 0) return '—';
    return ids
      .map((id) => this.store.caseStatuses().find((s) => s.id === id)?.name ?? id)
      .join(', ');
  }

  addStatus(): void {
    if (!this.newStatus.name.trim()) return;

    const status: CaseStatus = {
      id: `ST-${Date.now()}`,
      name: this.newStatus.name,
      description: this.newStatus.description,
      color: this.newStatus.color,
      predecessors: [],
      successors: [],
    };

    this.store.addCaseStatus(status);
    this.newStatus = { name: '', description: '', color: '#10989B' };
    this.showNewStatus.set(false);
  }

  deleteStatus(id: string): void {
    this.deleteStatusError.set(null);

    if (this.statusHasCases(id)) {
      const count = this.statusCasesCount(id);
      this.deleteStatusError.set(
        `No se puede eliminar: el estado tiene ${count} caso(s) activo(s) o historico(s) registrado(s).`,
      );
      setTimeout(() => this.deleteStatusError.set(null), 5000);
      return;
    }

    this.store.deleteCaseStatus(id);
  }
}

