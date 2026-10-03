import { describe, expect, it } from 'vitest';
import {
  ALTURA_MINIMA_ACCIONES_EN_LINEA,
  ANCHO_EJE_HORARIO,
  PIXELES_POR_HORA,
  PIXELES_POR_MINUTO,
  calcularAlturaBloqueCalendario,
  calcularAlturaRangoCalendario,
  calcularAlturaTotalCalendario,
  calcularAlturaVistaPreviaCalendario,
  calcularGeometriaColumnasCalendario,
  calcularPosicionMarcaHoraria,
  calcularPosicionVerticalCalendario,
} from './geometriaVisualCalendario';

describe('geometria visual del calendario', () => {
  it('conserva la escala fraccionaria de 64 px por hora', () => {
    expect(PIXELES_POR_HORA).toBe(64);
    expect(PIXELES_POR_MINUTO).toBe(64 / 60);
    expect(calcularAlturaRangoCalendario(0, 1)).toBe(64 / 60);
    expect(calcularAlturaRangoCalendario(0, 15)).toBe(16);
    expect(calcularAlturaRangoCalendario(0, 30)).toBe(32);
  });

  it('calcula la altura total y las posiciones verticales sin redondear', () => {
    expect(calcularAlturaTotalCalendario(8 * 60, 20 * 60)).toBe(768);
    expect(calcularPosicionVerticalCalendario(8 * 60 + 1, 8 * 60)).toBe(64 / 60);
    expect(calcularPosicionVerticalCalendario(9 * 60 + 15, 8 * 60)).toBe(80);
    expect(calcularPosicionMarcaHoraria(9 * 60, 8 * 60)).toBe(57);
  });

  it('mantiene los mínimos exactos de bloque y vista previa', () => {
    expect(calcularAlturaBloqueCalendario(60, 60)).toBe(28);
    expect(calcularAlturaBloqueCalendario(60, 75)).toBe(28);
    expect(calcularAlturaBloqueCalendario(60, 90)).toBe(32);
    expect(calcularAlturaVistaPreviaCalendario(60, 60)).toBe(4);
    expect(calcularAlturaVistaPreviaCalendario(90, 60)).toBe(32);
    expect(ALTURA_MINIMA_ACCIONES_EN_LINEA).toBe(66);
    expect(ANCHO_EJE_HORARIO).toBe(56);
  });

  it('convierte columnas ya determinadas a porcentajes y CSS exactos', () => {
    expect(calcularGeometriaColumnasCalendario(1, 3, false)).toEqual({
      anchoPorcentaje: 100 / 3,
      izquierdaPorcentaje: 100 / 3,
      anchoCss: 'calc(33.333333333333336% - 6px)',
      izquierdaCss: 'calc(33.333333333333336% + 3px)',
    });
    expect(calcularGeometriaColumnasCalendario(2, 4, false)).toEqual({
      anchoPorcentaje: 25,
      izquierdaPorcentaje: 50,
      anchoCss: 'calc(25% - 6px)',
      izquierdaCss: 'calc(50% + 3px)',
    });
    expect(calcularGeometriaColumnasCalendario(2, 4, true)).toEqual({
      anchoPorcentaje: 100,
      izquierdaPorcentaje: 0,
      anchoCss: 'calc(100% - 6px)',
      izquierdaCss: 'calc(0% + 3px)',
    });
  });
});
