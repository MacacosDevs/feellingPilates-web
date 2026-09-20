export const PIXELES_POR_HORA = 64;
export const PIXELES_POR_MINUTO = PIXELES_POR_HORA / 60;
export const ANCHO_EJE_HORARIO = 56;
export const ALTURA_MINIMA_BLOQUE = 28;
export const ALTURA_MINIMA_VISTA_PREVIA = 4;
/** Bloques con menos altura que esto muestran un botón "más acciones" en vez de la fila de íconos, que no cabe. */
export const ALTURA_MINIMA_ACCIONES_EN_LINEA = 66;

export interface GeometriaColumnasCalendario {
  anchoPorcentaje: number;
  izquierdaPorcentaje: number;
  anchoCss: string;
  izquierdaCss: string;
}

export function calcularAlturaTotalCalendario(minimo: number, maximo: number): number {
  return (maximo - minimo) * PIXELES_POR_MINUTO;
}

export function calcularPosicionVerticalCalendario(valor: number, minimo: number): number {
  return (valor - minimo) * PIXELES_POR_MINUTO;
}

export function calcularPosicionMarcaHoraria(valor: number, minimo: number): number {
  return calcularPosicionVerticalCalendario(valor, minimo) - 7;
}

export function calcularAlturaRangoCalendario(inicio: number, fin: number): number {
  return (fin - inicio) * PIXELES_POR_MINUTO;
}

export function calcularAlturaBloqueCalendario(inicio: number, fin: number): number {
  return Math.max(ALTURA_MINIMA_BLOQUE, calcularAlturaRangoCalendario(inicio, fin));
}

export function calcularAlturaVistaPreviaCalendario(inicio: number, fin: number): number {
  return Math.max(ALTURA_MINIMA_VISTA_PREVIA, Math.abs(fin - inicio) * PIXELES_POR_MINUTO);
}

export function calcularGeometriaColumnasCalendario(
  columna: number,
  total: number,
  enAjuste: boolean,
): GeometriaColumnasCalendario {
  const anchoPorcentaje = enAjuste ? 100 : 100 / total;
  const izquierdaPorcentaje = enAjuste ? 0 : (columna * 100) / total;
  return {
    anchoPorcentaje,
    izquierdaPorcentaje,
    anchoCss: `calc(${anchoPorcentaje}% - 6px)`,
    izquierdaCss: `calc(${izquierdaPorcentaje}% + 3px)`,
  };
}
