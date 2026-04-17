import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnDefinition } from '../../models/settings.models';

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left text-body">
        <thead class="text-sm text-body bg-neutral-secondary-medium border-b border-t border-default-medium">
          <tr>
            <th scope="col" class="px-6 py-3 font-medium" *ngFor="let col of columns">
              {{ col.label }}
            </th>
            @if (showActions) {
              <th scope="col" class="px-6 py-3 font-medium text-right">Acciones</th>
            }
          </tr>
        </thead>
        <tbody>
          @if (data.length === 0) {
            <tr class="bg-neutral-primary-soft border-b border-default">
              <td [attr.colspan]="columns.length + (showActions ? 1 : 0)" class="px-6 py-8 text-center text-body">
                <p class="text-sm">No hay registros disponibles</p>
              </td>
            </tr>
          }
          @for (row of data; track row.id || $index) {
            <tr class="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium transition-colors group">
              @for (col of columns; track col.key) {
                <td class="px-6 py-4">
                  @if (col.type === 'badge') {
                    <span class="badge" [ngClass]="getBadgeClass(row[col.key])">
                      {{ formatCell(row[col.key], col) }}
                    </span>
                  } @else {
                    {{ formatCell(row[col.key], col) }}
                  }
                </td>
              }
              @if (showActions) {
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      class="text-xs text-fg-brand hover:underline font-medium"
                      (click)="editClick.emit(row)"
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      class="text-xs text-fg-danger hover:underline font-medium"
                      (click)="deleteClick.emit(row)"
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (loading) {
      <div class="flex items-center justify-center py-8">
        <div class="text-sm text-body">Cargando...</div>
      </div>
    }
  `,
})
export class GenericTableComponent<T extends { id?: string | number }> {
  @Input() columns: ColumnDefinition<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() showActions = true;

  @Output() editClick = new EventEmitter<T>();
  @Output() deleteClick = new EventEmitter<T>();

  formatCell(value: any, column: ColumnDefinition<T>): string {
    if (column.format) {
      return column.format(value);
    }

    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString('es-CO');
    }

    if (value === null || value === undefined) {
      return '—';
    }

    return String(value);
  }

  getBadgeClass(status: any): string {
    const statusStr = String(status).toLowerCase();
    if (statusStr === 'active' || statusStr === 'activo') return 'badge-success';
    if (statusStr === 'inactive' || statusStr === 'inactivo') return 'badge-warning';
    if (statusStr === 'blocked' || statusStr === 'bloqueado') return 'badge-danger';
    return 'badge-default';
  }
}

