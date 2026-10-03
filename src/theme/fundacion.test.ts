import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { Chip, ThemeProvider } from '@mui/material';
import { bordeControl, theme, tintaAdvertencia } from './theme';
import { tintaSobreFondo } from './estilos';

// Independiente de getContrastRatio de MUI: no redondea luminancia ni ratios.
function rgb(color: string) {
  if (!color.startsWith('#')) return (color.match(/[\d.]+/g) ?? []).map(Number).slice(0, 3);
  const hex = color.length === 4 ? `#${[...color.slice(1)].map(c => c + c).join('')}` : color;
  return [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16));
}
function luminancia(color: number[]) {
  return color.map(v => {
    const canal = v / 255;
    return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  }).reduce((suma, canal, i) => suma + canal * [0.2126, 0.7152, 0.0722][i], 0);
}
function contraste(tinta: string, fondo: number[]) {
  const a = luminancia(rgb(tinta)), b = luminancia(fondo);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function componer(frente: number[], fondo: number[], alfa: number) {
  return frente.map((canal, i) => canal * alfa + fondo[i] * (1 - alfa));
}
// Casos sintéticos del selector de tinta: fondos oscuros y claros, incluido
// el contador oscuro con velo blanco. Chromium prueba la paleta real del DOM.
const fondos = ['#334155', '#7c3aed', '#2563eb', '#0d9488', '#d97706', '#64748b'];

describe('contraste semántico de la fundación real', () => {
  it('mantiene legible la tinta principal y secundaria en papel, campos y encabezados', () => {
    for (const fondo of [theme.palette.background.paper, theme.palette.background.default, theme.palette.grey[50], theme.palette.grey[100]]) {
      for (const tinta of [theme.palette.text.primary, theme.palette.text.secondary]) {
        expect(contraste(tinta, rgb(fondo))).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('distingue límites de campos y foco violeta en sus superficies reales', () => {
    for (const fondo of [theme.palette.background.paper, theme.palette.grey[50], theme.palette.grey[100]]) {
      expect(contraste(bordeControl, rgb(fondo))).toBeGreaterThanOrEqual(3);
      expect(contraste(theme.palette.secondary.main, rgb(fondo))).toBeGreaterThanOrEqual(3);
    }
  });
  it('advierte con texto legible tanto en un estado relleno como contorneado', () => {
    expect(contraste(theme.palette.warning.contrastText, rgb(theme.palette.warning.main))).toBeGreaterThanOrEqual(4.5);
    for (const fondo of [theme.palette.background.paper, theme.palette.grey[50]]) {
      expect(contraste(tintaAdvertencia, rgb(fondo))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('renderiza ambos Chips de advertencia con tinta accesible desde el tema real', () => {
    render(createElement(ThemeProvider, { theme },
      createElement('div', { style: { backgroundColor: theme.palette.background.paper } },
        createElement(Chip, { color: 'warning', label: 'Advertencia rellena' }),
        createElement(Chip, { color: 'warning', variant: 'outlined', label: 'Advertencia contorneada' }),
      ),
    ));
    const relleno = getComputedStyle(screen.getByText('Advertencia rellena').parentElement!);
    const contorno = getComputedStyle(screen.getByText('Advertencia contorneada').parentElement!);
    expect(contraste(relleno.color, rgb(relleno.backgroundColor))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(contorno.color, rgb(theme.palette.background.paper))).toBeGreaterThanOrEqual(4.5);
  });
  it('preserva tinta de error y éxito legible, también para etiquetas de campo', () => {
    for (const color of [theme.palette.error, theme.palette.success]) {
      expect(contraste(color.contrastText, rgb(color.main))).toBeGreaterThanOrEqual(4.5);
      expect(contraste(color.main, rgb(theme.palette.grey[50]))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it.each(fondos)('lee categoría, avatar, contador y etiqueta tintada sobre %s', fondo => {
    const relleno = rgb(fondo);
    expect(contraste(tintaSobreFondo(fondo, theme), relleno)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(tintaSobreFondo(fondo, theme, 0.25), componer(rgb('#ffffff'), relleno, 0.25))).toBeGreaterThanOrEqual(4.5);
    for (const superficie of [rgb(theme.palette.background.paper), componer(rgb('#000000'), rgb(theme.palette.background.paper), theme.palette.action.hoverOpacity)]) {
      expect(contraste(theme.palette.text.primary, componer(relleno, superficie, 26 / 255))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
