import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ModalConfig {
  title: string;
  submitLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

@Component({
  selector: 'app-modal-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 hidden overflow-y-auto overflow-x-hidden"
      [class.!flex]="isOpen()"
      [class.!items-center]="isOpen()"
      [class.!justify-center]="isOpen()"
      (click)="handleBackdropClick($event)"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 transition-opacity"
        [class.opacity-0]="!isOpen()"
        [class.opacity-100]="isOpen()"
      ></div>

      <!-- Modal -->
      <div
        class="relative p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal content -->
        <div class="relative bg-neutral-primary-soft border border-default rounded-base shadow-sm p-4 md:p-6">
          <!-- Modal header -->
          <div class="flex items-center justify-between border-b border-default pb-4 md:pb-5">
            <h3 class="text-lg font-medium text-heading">{{ config.title }}</h3>
            <button
              type="button"
              class="text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center"
              (click)="close()"
            >
              <svg
                class="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18 17.94 6M18 18 6.06 6"
                />
              </svg>
              <span class="sr-only">Cerrar modal</span>
            </button>
          </div>

          <!-- Modal body -->
          <div class="py-4 md:py-6">
            <ng-content></ng-content>
          </div>

          <!-- Modal footer -->
          <div class="flex items-center space-x-4 border-t border-default pt-4 md:pt-6">
            <button
              type="button"
              (click)="handleSubmit()"
              [disabled]="submitting()"
              [class.opacity-50]="submitting()"
              [class.cursor-not-allowed]="submitting()"
              class="inline-flex items-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none disabled:hover:bg-brand transition-colors"
            >
              @if (submitting()) {
                <span class="spinner-sm"></span>
              }
              {{ config.submitLabel || 'Guardar' }}
            </button>
            <button
              type="button"
              (click)="close()"
              [disabled]="submitting()"
              class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ config.cancelLabel || 'Cancelar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModalEditorComponent implements AfterViewInit {
  @Input() isOpen = signal(false);
  @Input() config: ModalConfig = { title: 'Modal' };
  @Input() submitting = signal(false);

  @Output() onSubmit = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  ngAfterViewInit() {
    // Prevenir scroll cuando modal está abierto
    if (this.isOpen()) {
      document.body.style.overflow = 'hidden';
    }
  }

  open() {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen.set(false);
    document.body.style.overflow = 'auto';
    this.onClose.emit();
  }

  handleSubmit() {
    if (!this.submitting()) {
      this.onSubmit.emit();
    }
  }

  handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}

