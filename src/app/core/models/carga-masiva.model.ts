/**
 * Contratos TypeScript alineados con los DTOs del backend
 * (coovitelCobranza.cobranzas.cargamasiva.application.dto.*).
 */

/**
 * Detalle de error por fila/campo devuelto por el backend (RowErrorDTO.java).
 *
 * <ul>
 *   <li><b>rowNumber</b>: número de fila (1-based). {@code -1} => error global.</li>
 *   <li><b>field</b>: nombre del campo con error o {@code null} para errores de fila.</li>
 *   <li><b>severity</b>: "ERROR" | "WARNING".</li>
 * </ul>
 */
export interface RowErrorDTO {
  rowNumber: number;
  field: string | null;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

/** Respuesta unificada de la carga masiva (CargaMasivaResultResponse.java). */
export interface CargaMasivaResultResponse {
  success: boolean;
  totalRows: number;
  totalInserted: number;
  totalErrors: number;
  fileName: string;
  /** ISO-8601 LocalDateTime. */
  processedAt: string;
  errors: RowErrorDTO[];
}

/** Columnas esperadas en el CSV/TXT (alineadas con AsociadoRowDTO.COLUMN_NAMES). */
export const CARGA_MASIVA_COLUMNS: readonly string[] = [
  'TIPO_ID',
  'NUM_DOCUMENTO',
  'NOMBRE_COMPLETO',
  'NUM_OBLIGACION',
  'SALDO_TOTAL',
  'DIAS_MORA',
  'FECHA_VENC',
  'TELEFONO_1',
  'EMAIL',
  'TELEFONO_2',
  'CIUDAD',
  'CANAL_PREFERIDO',
  'SEGMENTO',
  'PRODUCTO',
  'CODIGO_AGENTE',
] as const;
