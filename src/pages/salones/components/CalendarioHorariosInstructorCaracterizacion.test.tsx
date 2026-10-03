import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { CalendarioHorariosInstructor } from '../../../modulos/programacion/componentes/CalendarioHorariosInstructor';
import { renderWithTheme } from '../../../components/test-support/renderWithTheme';
import { salon, turno } from '../../../../tests/fixtures/regression';
type Props = ComponentProps<typeof CalendarioHorariosInstructor>;
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 11, 31, 23, 45)); });
afterEach(() => vi.useRealTimers());
function props(): Props {
  return { horarios: salon().horarios, turnosRecurrentes: [turno({ diaSemana: 4, asignaciones: [{ instructorId: 'i1', instructorNombre: 'Inés Prueba', actividades: [{ id: 'a1', nombre: 'Pilates' }], horaInicio: '09:30:00', horaFin: '10:15:00' }] })], turnosPuntuales: [], inicioSemana: new Date(2026, 11, 27), excepciones: [], instructoresSalon: [{ id: 'i1', nombre: 'Inés Prueba' }], actividadesSalon: [{ id: 'a1', nombre: 'Pilates' }], mapaEspecialidades: { i1: ['a1'] }, puedeGestionar: false, puedeEditar: false, puedeCancelar: false, puedeAdministrarSalon: true, onCrear: vi.fn(), onMover: vi.fn(), onAjustarFecha: vi.fn(), onEliminar: vi.fn(), onCancelarFecha: vi.fn(), onGuardarExcepcion: vi.fn(), onEliminarExcepcion: vi.fn() };
}
it('muestra HH:mm y rango parcial del instructor; el encabezado al cruzar año mantiene fecha local', () => {
  renderWithTheme(<CalendarioHorariosInstructor {...props()} />);
  expect(screen.getByText('09:00–11:00')).toBeTruthy();
  expect(screen.getByText('Inés Prueba (09:30–10:15)')).toBeTruthy();
  expect(screen.queryByText(/09:30:00/)).toBeNull();
  expect(screen.getByText('Jue 31/12')).toBeTruthy();
  expect(screen.getByText('Vie 1/1')).toBeTruthy();
  fireEvent.click(screen.getByText('Vie 1/1'));
  expect(screen.getByText('Vie · 2027-01-01')).toBeTruthy();
});
it('cambio de semana por props selecciona el año correcto en operación puntual', () => {
  const p = props();
  const view = renderWithTheme(<CalendarioHorariosInstructor {...p} />);
  view.rerender(<CalendarioHorariosInstructor {...p} inicioSemana={new Date(2027, 0, 3)} />);
  expect(screen.getByText('Dom 3/1')).toBeTruthy();
  fireEvent.click(screen.getByText('Dom 3/1'));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  expect(p.onGuardarExcepcion).toHaveBeenCalledExactlyOnceWith('2027-01-03', false, '08:00', '18:00');
});

it('expone encabezados, creación y bloques con nombres y activación de teclado', () => {
  const p = props();
  p.puedeGestionar = true;
  p.puedeEditar = true;
  let view = renderWithTheme(<CalendarioHorariosInstructor {...p} />);

  const cabecera = screen.getByRole('button', { name: 'Editar horario de Jue 31/12' });
  cabecera.focus();
  fireEvent.keyDown(cabecera, { key: 'Enter' });
  expect(screen.getByText('Horario de este día')).toBeTruthy();
  view.unmount();

  view = renderWithTheme(<CalendarioHorariosInstructor {...p} />);
  const bloque = screen.getByRole('button', { name: /^Horario recurrente Jue 31\/12, 09:00–11:00/ });
  bloque.focus();
  fireEvent.keyDown(bloque, { key: 'Enter' });
  expect(screen.getByRole('dialog', { name: /Instructores y actividades/ })).toBeTruthy();
  view.unmount();

  view = renderWithTheme(<CalendarioHorariosInstructor {...p} />);
  const zona = screen.getByRole('button', { name: 'Crear horario en Dom 27/12, de 08:00 a 18:00' });
  zona.focus();
  fireEvent.keyDown(zona, { key: 'Enter' });
  expect(screen.getByRole('heading', { name: 'Nuevo horario' })).toBeTruthy();
  expect(screen.getByText(/08:00–08:30/)).toBeTruthy();
  expect(view.container.querySelectorAll('[tabindex="0"]')).not.toHaveLength(0);
});

it('mueve y recorta por teclado en pasos existentes de 30 minutos con el mismo callback', () => {
  const p = props();
  p.puedeGestionar = true;
  const view = renderWithTheme(<CalendarioHorariosInstructor {...p} />);
  const bloque = screen.getByRole('button', { name: /^Horario recurrente Jue 31\/12/ });

  fireEvent.keyDown(bloque, { key: 'ArrowDown' });
  expect(p.onMover).toHaveBeenLastCalledWith('t1', 4, '09:30', '11:30', [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: '09:30', horaFin: '10:15' }]);

  const grupo = screen.getByRole('group', { name: /^Horario recurrente Jue 31\/12/ });
  expect(grupo.getAttribute('tabindex')).toBeNull();
  const inicio = screen.getByRole('separator', { name: /Ajustar inicio de Horario recurrente Jue 31\/12/ });
  const fin = screen.getByRole('separator', { name: /Ajustar fin de Horario recurrente Jue 31\/12/ });
  expect(inicio.closest('[role="button"]')).toBeNull();
  expect(inicio.getAttribute('aria-valuemin')).toBe('480');
  expect(inicio.getAttribute('aria-valuemax')).toBe('630');
  expect(inicio.getAttribute('aria-valuenow')).toBe('540');
  expect(inicio.getAttribute('aria-valuetext')).toBe('Inicio actual 09:00; Flecha arriba o abajo ajusta 30 minutos');
  expect(fin.getAttribute('aria-valuemin')).toBe('570');
  expect(fin.getAttribute('aria-valuemax')).toBe('1080');
  expect(fin.getAttribute('aria-valuenow')).toBe('660');
  expect(fin.getAttribute('aria-valuetext')).toBe('Fin actual 11:00; Flecha arriba o abajo ajusta 30 minutos');
  fireEvent.keyDown(inicio, { key: 'ArrowDown' });
  expect(p.onMover).toHaveBeenLastCalledWith('t1', 4, '09:30', '11:00', [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: '09:30', horaFin: '10:15' }]);

  expect(view.container.querySelector('[data-presentacion-estrecha="false"]')).toBeTruthy();
});

it('compone el horario especial como grupo con acción y separadores independientes', () => {
  const p = props();
  p.puedeGestionar = true;
  p.turnosPuntuales = [turno({ id: 'e1', tipo: 'EXCEPCION', diaSemana: null, fecha: '2026-12-31' })];
  renderWithTheme(<CalendarioHorariosInstructor {...p} />);

  const grupo = screen.getByRole('group', { name: /^Horario especial Jue 31\/12, 09:00–11:00/ });
  const accion = screen.getByRole('button', { name: /^Horario especial Jue 31\/12, 09:00–11:00/ });
  const inicio = screen.getByRole('separator', { name: /^Ajustar inicio de Horario especial Jue 31\/12/ });
  const fin = screen.getByRole('separator', { name: /^Ajustar fin de Horario especial Jue 31\/12/ });
  expect(grupo.getAttribute('tabindex')).toBeNull();
  expect(grupo.contains(accion)).toBe(true);
  expect(inicio.closest('[role="button"]')).toBeNull();
  expect(inicio.getAttribute('aria-valuemin')).toBe('480');
  expect(inicio.getAttribute('aria-valuemax')).toBe('630');
  expect(inicio.getAttribute('aria-valuenow')).toBe('540');
  expect(inicio.getAttribute('aria-valuetext')).toBe('Inicio actual 09:00; Flecha arriba o abajo ajusta 30 minutos');
  expect(fin.getAttribute('aria-valuemin')).toBe('570');
  expect(fin.getAttribute('aria-valuemax')).toBe('1080');
  expect(fin.getAttribute('aria-valuenow')).toBe('660');
  expect(fin.getAttribute('aria-valuetext')).toBe('Fin actual 11:00; Flecha arriba o abajo ajusta 30 minutos');

  fireEvent.keyDown(accion, { key: ' ' });
  expect(screen.getByRole('dialog', { name: /Instructores y actividades/ })).toBeTruthy();
});
