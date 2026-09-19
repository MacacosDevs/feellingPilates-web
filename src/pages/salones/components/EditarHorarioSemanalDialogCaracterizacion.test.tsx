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
it('rechaza historial de otro salón tras error vigente y reintenta exactamente una vez el salón actual', async () => {
  const antiguo = deferred<Response>();
  const reads: string[] = [];
  let actuales = 0;
  server.use(
    http.get(`${api}/salones/s1/horarios/historial`, () => { reads.push('s1'); return antiguo.promise; }),
    http.get(`${api}/salones/s2/horarios/historial`, () => {
      reads.push('s2');
      actuales++;
      return actuales === 1 ? HttpResponse.json({ message: 'Historial no disponible' }, { status: 503 }) : HttpResponse.json([]);
    }),
  );
  const callbacks = { onAplicado: vi.fn().mockResolvedValue(undefined), onClose: vi.fn(), onExito: vi.fn() };
  const view = renderWithTheme(<EditarHorarioSemanalDialog salon={salon()} open {...callbacks} />);
  await waitFor(() => expect(reads).toEqual(['s1']));
  view.rerender(<EditarHorarioSemanalDialog salon={salon({ id: 's2', nombre: 'Sede Vigente' })} open {...callbacks} />);
  const error = (await screen.findByText('No se pudo cargar el historial de horarios.')).closest('[role="alert"]') as HTMLElement;
  expect(reads).toEqual(['s1', 's2']);
  antiguo.resolve(HttpResponse.json([{ diaSemana: 0, horaApertura: '06:00', horaCierre: '07:00', vigenteDesde: '2026-01-01', vigenteHasta: null }]));
  await waitFor(() => expect(screen.getByText('No se pudo cargar el historial de horarios.')).toBeTruthy());
  await userEvent.click(within(error).getByRole('button', { name: 'Reintentar' }));
  await waitFor(() => expect(screen.queryByText('No se pudo cargar el historial de horarios.')).toBeNull());
  expect(reads).toEqual(['s1', 's2', 's2']);
  await userEvent.click(screen.getAllByRole('button', { name: 'Historial' })[0]);
  expect(screen.getAllByText('Sin historial registrado para este día.')).toHaveLength(7);
  expect(screen.queryByText('06:00 – 07:00')).toBeNull();
});
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
  expect(screen.getByText('No se pudo cargar el historial de horarios.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
});
it.each([
  {
    nombre: 'versionar',
    endpoint: `${api}/salones/s1/horarios/versiones`,
    abrir: 'Cambiar horario',
    guardar: 'Guardar horario',
    errorMutacion: 'Otro cambio se guardó al mismo tiempo. Vuelve a intentarlo.',
  },
  {
    nombre: 'cerrar',
    endpoint: `${api}/salones/s1/horarios/cierres`,
    abrir: 'Dejar de operar',
    guardar: 'Dejar de operar',
    errorMutacion: 'Otro cambio se guardó al mismo tiempo. Vuelve a intentarlo.',
  },
])('conserva error de $nombre si falla el refresh de conflicto y recupera historial con un reintento al salón actual', async ({ endpoint, abrir, guardar, errorMutacion }) => {
  const reads: string[] = [];
  let historyReads = 0;
  server.use(
    http.get(`${api}/salones/s1/horarios/historial`, ({ request }) => {
      reads.push(new URL(request.url).pathname);
      historyReads++;
      return historyReads === 2
        ? HttpResponse.json({ message: 'Historial no disponible' }, { status: 503 })
        : HttpResponse.json([]);
    }),
    http.post(endpoint, () => HttpResponse.json({ codigo: 'CONFLICTO_VIGENCIA_HORARIO', message: 'Conflicto sintético' }, { status: 409 })),
  );
  mount();
  await waitFor(() => expect(historyReads).toBe(1));
  await userEvent.click(screen.getByRole('button', { name: abrir }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: guardar }));

  expect(await screen.findByText(errorMutacion)).toBeTruthy();
  const errorHistorial = (await screen.findByText('No se pudo cargar el historial de horarios.')).closest('[role="alert"]') as HTMLElement;
  expect(historyReads).toBe(2);
  expect(reads).toEqual(Array(2).fill('/api/salones/s1/horarios/historial'));

  await userEvent.click(within(errorHistorial).getByRole('button', { name: 'Reintentar' }));
  await waitFor(() => expect(screen.queryByText('No se pudo cargar el historial de horarios.')).toBeNull());
  expect(historyReads).toBe(3);
  expect(reads).toEqual(Array(3).fill('/api/salones/s1/horarios/historial'));
  expect(screen.getByText(errorMutacion)).toBeTruthy();
});
