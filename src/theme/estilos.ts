import { getContrastRatio, lighten } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

/** Foco compartido; no cambia medidas ni la interacción del control. */
export function focoVisible(theme: Theme) {
  return { outline: `2px solid ${theme.palette.secondary.main}`, outlineOffset: '2px' };
}

export const superficieContorneada = { border: '1px solid', borderColor: 'divider' } as const;

/** Los fondos de categoría conservan su identidad; solo elegimos su tinta. */
export function tintaSobreFondo(fondo: string, theme: Theme, veloBlanco = 0) {
  const superficie = veloBlanco ? lighten(fondo, veloBlanco) : fondo;
  return getContrastRatio('#ffffff', superficie) >= 4.5 ? '#ffffff' : theme.palette.text.primary;
}
