import { Component, ViewEncapsulation, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsCaseStatusesTabComponent } from './tabs/settings-case-statuses-tab.component';
import { SettingsFileStructureTabComponent } from './tabs/settings-file-structure-tab.component';
import { SettingsPoliciesTabComponent } from './tabs/settings-policies-tab.component';
import { SettingsAssignmentRulesTabComponent } from './tabs/settings-assignment-rules-tab.component';
import { SettingsSecurityTabComponent } from './tabs/settings-security-tab.component';
import { UsersComponent } from './modules/users/users.component';

export type SettingsTab =
  | 'policies'
  | 'case-statuses'
  | 'file-structure'
  | 'users'
  | 'assignment-rules'
  | 'security';

interface SettingsTabConfig {
  id: SettingsTab;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    SettingsPoliciesTabComponent,
    SettingsCaseStatusesTabComponent,
    SettingsFileStructureTabComponent,
    SettingsAssignmentRulesTabComponent,
    UsersComponent,
    SettingsSecurityTabComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent {
  activeTab = signal<SettingsTab>('policies');
  readonly tabs: SettingsTabConfig[] = [
    { id: 'policies', label: 'Políticas & Score', icon: '⚡' },
    { id: 'case-statuses', label: 'Estados de Caso', icon: '🏷️' },
    { id: 'file-structure', label: 'Estructura de Archivo', icon: '📄' },
    { id: 'assignment-rules', label: 'Reglas de Asignación', icon: '⚖️' },
    { id: 'users', label: 'Gestión de Usuarios', icon: '👥' },
    { id: 'security', label: 'Seguridad', icon: '🛡️' },
  ];
}
