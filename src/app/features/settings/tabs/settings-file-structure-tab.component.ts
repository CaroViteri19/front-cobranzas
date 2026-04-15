import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FileField {
  col: string;
  type: string;
  req: boolean;
  desc: string;
}

@Component({
  selector: 'app-settings-file-structure-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-file-structure-tab.component.html',
})
export class SettingsFileStructureTabComponent {
  readonly fileFields: FileField[] = [
    { col: 'TIPO_ID', type: 'VARCHAR(2)', req: true, desc: 'Tipo de documento (CC, NIT, CE, PA)' },
    { col: 'NUM_DOCUMENTO', type: 'VARCHAR(20)', req: true, desc: 'Numero de identificacion del asociado' },
    { col: 'NOMBRE_COMPLETO', type: 'VARCHAR(120)', req: true, desc: 'Nombre y apellidos completos' },
    { col: 'NUM_OBLIGACION', type: 'VARCHAR(30)', req: true, desc: 'Identificador unico de la deuda' },
    { col: 'SALDO_TOTAL', type: 'DECIMAL(18,2)', req: true, desc: 'Monto total exigible en COP' },
    { col: 'DIAS_MORA', type: 'INTEGER', req: true, desc: 'Dias de vencimiento de la obligacion' },
    { col: 'FECHA_VENC', type: 'DATE', req: true, desc: 'Fecha de vencimiento (YYYYMMDD)' },
    { col: 'TELEFONO_1', type: 'VARCHAR(15)', req: true, desc: 'Numero celular principal' },
    { col: 'EMAIL', type: 'VARCHAR(80)', req: false, desc: 'Correo electronico del asociado' },
    { col: 'TELEFONO_2', type: 'VARCHAR(15)', req: false, desc: 'Numero alternativo de contacto' },
    { col: 'CIUDAD', type: 'VARCHAR(60)', req: false, desc: 'Ciudad de residencia' },
    { col: 'CANAL_PREFERIDO', type: 'VARCHAR(20)', req: false, desc: 'WhatsApp | SMS | Email | Voz' },
    { col: 'SEGMENTO', type: 'VARCHAR(30)', req: false, desc: 'Segmento de cartera asignado' },
    { col: 'PRODUCTO', type: 'VARCHAR(50)', req: false, desc: 'Tipo de obligacion financiera' },
    { col: 'CODIGO_AGENTE', type: 'VARCHAR(10)', req: false, desc: 'ID del agente asignado (si aplica)' },
  ];

  readonly requiredCount = this.fileFields.filter((f) => f.req).length;
  readonly optionalCount = this.fileFields.filter((f) => !f.req).length;
}

