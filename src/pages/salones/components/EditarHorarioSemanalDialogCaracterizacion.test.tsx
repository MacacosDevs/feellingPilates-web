import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EditarHorarioSemanalDialog } from '../../../modulos/programacion/componentes/EditarHorarioSemanalDialog';
import { renderWithTheme } from '../../../components/test-support/renderWithTheme';
import { api, deferred } from '../../../components/test-support/regression';
import { salon } from '../../../../tests/fixtures/regression';
import { server } from '../../../../tests/mocks/server';
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 11, 31, 23, 45));
  server.use(http.get(`${api}/salones/s1/horarios/historial`, () => HttpResponse.json([])));
});
afterEach(() => vi.useRealTimers());
function mount(onAplicado = vi.fn().mockResolvedValue(undefined)) {
  const callbacks = { onAplicado, onClose: vi.fn(), onExito: vi.fn() };
  renderWithTheme(<EditarHorarioSemanalDialog salon={salon({ horarios: [{ id: 'sun', diaSemana: 0, horaApertura: '08:30:00', horaCierre: '17:30:00' }] })} open {...callbacks} />);
  return callbacks;
}
it('versiona domingo con fecha local de otro año; retiene campos tras 409 y espera POST antes de sincronizar', async () => {
  const hold = deferred<Response>();
  const bodies: unknown[] = [];
  server.use(http.post(`${api}/salones/s1/horarios/versiones`, async ({ request }) => {
    bodies.push(await request.json());
    return bodies.length === 1 ? HttpResponse.json({ message: 'Conflicto sintético' }, { status: 409 }) : hold.promise;
  }));
  const c = mount();
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar horario' }));
  expect((screen.getByLabelText('Abre') as HTMLInputElement).value).toBe('08:30');
  fireEvent.change(screen.getByLabelText('Abre'), { target: { value: '09:15' } });
  fireEvent.change(screen.getByLabelText('Aplicar a partir de'), { target: { value: '2027-01-03' } });
  await userEvent.click(screen.getByRole('button', { name: 'Guardar horario' }));
  await screen.findByText('Conflicto sintético');
  expect((screen.getByLabelText('Abre') as HTMLInputElement).value).toBe('09:15');
  expect((screen.getByLabelText('Aplicar a partir de') as HTMLInputElement).value).toBe('2027-01-03');
  expect(c.onAplicado).not.toHaveBeenCalled();
  expect(c.onExito).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Guardar horario' }));
  await waitFor(() => expect(bodies).toHaveLength(2));
  expect((screen.getByRole('button', { name: 'Guardando...' }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('button', { name: 'Atrás' }) as HTMLButtonElement).disabled).toBe(true);
  expect(c.onAplicado).not.toHaveBeenCalled();
  hold.resolve(HttpResponse.json({ diaSemana: 0, horaApertura: '09:15:00', horaCierre: '17:30:00', vigenteDesde: '2027-01-03', vigenteHasta: null }));
  await screen.findByRole('dialog', { name: 'Horarios de Sede Prueba' });
  expect(bodies).toEqual(Array(2).fill({ diaSemana: 0, efectivoDesde: '2027-01-03', horaApertura: '09:15', horaCierre: '17:30' }));
  expect(c.onAplicado).toHaveBeenCalledTimes(1);
  expect(c.onExito).toHaveBeenCalledWith(expect.stringContaining('Cambio programado'));
});
it('cierre manda solamente día y efectivoDesde; éxito escrito se distingue de fallo de refresh', async () => {
  let body: unknown;
  let historyReads = 0;
  server.use(http.get(`${api}/salones/s1/horarios/historial`, () => { historyReads++; return HttpResponse.json([]); }), http.post(`${api}/salones/s1/horarios/cierres`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ diaSemana: 0, horaApertura: '08:30:00', horaCierre: '17:30:00', vigenteDesde: null, vigenteHasta: '2026-12-31' }); }));
  const c = mount(vi.fn().mockRejectedValue(new Error('synthetic refresh')));
  await waitFor(() => expect(historyReads).toBe(1));
  await userEvent.click(screen.getByRole('button', { name: 'Dejar de operar' }));
  fireEvent.change(screen.getByLabelText('Aplicar a partir de'), { target: { value: '2027-01-01' } });
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Dejar de operar' }));
  await waitFor(() => expect(c.onExito).toHaveBeenCalledTimes(1));
  expect(body).toEqual({ diaSemana: 0, efectivoDesde: '2027-01-01' });
  expect(historyReads).toBe(2);
  expect(c.onExito).toHaveBeenCalledWith('El cambio se guardó correctamente, pero no se pudo actualizar toda la información. Actualiza la pantalla para ver el estado más reciente.');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(c.onClose).not.toHaveBeenCalled();
});
it('refresh de historial fallido después de POST exitoso no convierte el guardado en error', async () => {
  let reads = 0;
  server.use(http.get(`${api}/salones/s1/horarios/historial`, () => ++reads === 1 ? HttpResponse.json([]) : HttpResponse.json({ message: 'Historial no disponible' }, { status: 503 })), http.post(`${api}/salones/s1/horarios/versiones`, () => HttpResponse.json({ diaSemana: 0, horaApertura: '08:30', horaCierre: '17:30', vigenteDesde: '2026-12-31', vigenteHasta: null })));
  const c = mount();
  await waitFor(() => expect(reads).toBe(1));
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar horario' }));
  await userEvent.click(screen.getByRole('button', { name: 'Guardar horario' }));
  await waitFor(() => expect(c.onExito).toHaveBeenCalledWith(expect.stringContaining('se guardó correctamente')));
  expect(c.onAplicado).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('alert')).toBeNull();
});
