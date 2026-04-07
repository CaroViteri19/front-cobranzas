import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { Campaign } from '../../core/models';

@Component({
  selector: 'app-orchestration',
  imports: [CommonModule, FormsModule],
  templateUrl: './orchestration.component.html',
  styleUrl: './orchestration.component.css'
})
export class OrchestrationComponent {
  store = inject(StoreService);
  showNewCampaign = signal(false);

  newName    = '';
  newSegment = 'Preventiva';
  newChannel: Campaign['channel'] = 'WhatsApp';

  readonly channelIcons: Record<string, string> = {
    'WhatsApp': '💬',
    'SMS':      '📱',
    'Email':    '✉️',
    'Voz':      '📞',
  };

  readonly statusColors: Record<string, string> = {
    'En curso':   'badge-success',
    'Completada': 'badge-info',
    'Pausada':    'badge-warning',
  };

  createCampaign(): void {
    if (!this.newName.trim()) return;
    this.store.addCampaign({
      id: `C-${Date.now()}`,
      name: this.newName,
      segment: this.newSegment,
      progress: 0,
      status: 'En curso',
      channel: this.newChannel,
    });
    this.newName = '';
    this.showNewCampaign.set(false);
  }
}
