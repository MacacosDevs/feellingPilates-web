import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../../api/types';

const MENSAJE_POR_CODIGO: Record<string, string> = {
  EFECTIVO_DESDE_EN_EL_PASADO: 'La fecha debe ser hoy o posterior.',
  HORA_CIERRE_DEBE_SER_POSTERIOR: 'La hora de cierre debe ser posterior a la de apertura.',
  DIA_SEMANA_INVALIDO: 'Día de la semana inválido.',
  YA_EXISTE_VERSION_EN_ESA_FECHA: 'Ya hay un cambio de horario que empieza ese día. Revisa el historial.',
  VERSIONADO_INTERMEDIO_NO_SOPORTADO:
    'Este día ya tiene un cambio programado. Sólo se puede programar a partir de la última versión.',
  NO_EXISTE_VERSION_VIGENTE_EN_ESA_FECHA: 'Ese día no está abierto en la fecha indicada.',
  CANCELACION_DE_VERSION_NO_SOPORTADA:
    'Ese cambio de horario empieza justo ese día; deshacerlo aún no está disponible. Elige otra fecha.',
  CIERRE_CON_VERSIONES_FUTURAS:
    'No se puede cerrar este día todavía. Hay un cambio de horario ya programado para más adelante. Revisa el historial del día y resuélvelo primero.',
  PROGRAMACION_INCOMPATIBLE_CON_HORARIO:
    'No se puede aplicar el cambio. Hay clases o bloques programados que quedarían fuera del nuevo horario. Ajusta primero esa programación en el calendario del salón.',
  CONFLICTO_VIGENCIA_HORARIO: 'Otro cambio se guardó al mismo tiempo. Vuelve a intentarlo.',
  HORARIOS_REQUIEREN_VERSIONADO: 'Los horarios se cambian desde la pantalla de horarios del salón.',
};

/** true si el codigo indica que el estado del servidor puede haber cambiado desde la última
 * lectura (conviene refrescar el historial para que el operador vea el estado real). */
export const CODIGOS_REQUIEREN_REFRESCO_HISTORIAL = new Set([
  'YA_EXISTE_VERSION_EN_ESA_FECHA',
  'CONFLICTO_VIGENCIA_HORARIO',
]);

export function codigoDeError(err: unknown): string | null {
  return isAxiosError<ApiErrorBody>(err) ? err.response?.data?.codigo ?? null : null;
}

export function mensajeDeErrorHorario(err: unknown, mensajePorDefecto: string): string {
  if (!isAxiosError<ApiErrorBody>(err)) return 'Ocurrió un error inesperado.';

  const status = err.response?.status;
  if (status === 403) return 'No tienes permiso para cambiar el horario de este salón.';
  if (status === 404) return 'El salón ya no existe.';

  const codigo = err.response?.data?.codigo;
  if (codigo && MENSAJE_POR_CODIGO[codigo]) return MENSAJE_POR_CODIGO[codigo];
  return err.response?.data?.message ?? mensajePorDefecto;
}
