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
