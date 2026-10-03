/** Formatea a "aaaa-mm-dd" usando la fecha local (no UTC): toISOString() corre la fecha al día
 * siguiente en horas de la tarde/noche para husos horarios detrás de UTC. */
export function aIso(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hoyIso(): string {
  return aIso(new Date());
}
