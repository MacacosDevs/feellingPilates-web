import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { SalonHorarios } from '../../modulos/programacion/paginas/SalonHorarios';
import { api, deferred, regressionSession, renderRoute } from '../../components/test-support/regression';
import { server } from '../../../tests/mocks/server';
import { pageOf, salon, user } from '../../../tests/fixtures/regression';
regressionSession(['salon.administrar']);
beforeEach(() => {
  server.use(http.get(`${api}/salones/s1`, () => HttpResponse.json(salon())), http.get(`${api}/admin/usuarios`, () => HttpResponse.json(pageOf([user({ id: 'i1', nombre: 'Inés Prueba', rolesAsignados: [{ rol: 'INSTRUCTOR', salonIds: ['s1'] }] })]))), http.get(`${api}/admin/usuarios/i1/especialidades`, () => HttpResponse.json([])), http.get(`${api}/turnos-instructor`, () => HttpResponse.json([])), http.get(`${api}/turnos-instructor/puntuales`, () => HttpResponse.json(pageOf([]))), http.get(`${api}/salones/s1/excepciones-horario`, () => HttpResponse.json([])), http.get(`${api}/salones/s1/horarios/historial`, () => HttpResponse.json([])));
});
function mount() { return renderRoute(<Routes><Route path="/salones/:id/horarios" element={<SalonHorarios />} /></Routes>, '/salones/s1/horarios'); }
it('mantiene carga inicial mientras detalle está pendiente y reintenta explícitamente el mismo contexto', async () => {
  const hold = deferred<Response>();
  let detailReads = 0;
  let userReads = 0;
  server.use(
    http.get(`${api}/salones/s1`, () => ++detailReads === 1 ? hold.promise : HttpResponse.json(salon())),
    http.get(`${api}/admin/usuarios`, () => { userReads++; return HttpResponse.json(pageOf([user({ id: 'i1', nombre: 'Inés Prueba', rolesAsignados: [{ rol: 'INSTRUCTOR', salonIds: ['s1'] }] })])); }),
  );
  mount();
  await waitFor(() => expect(detailReads).toBe(1));
  expect(screen.getByRole('progressbar')).toBeTruthy();
  expect(screen.queryByText('Horarios del salón')).toBeNull();
  hold.resolve(HttpResponse.json({ message: 'Detalle sintético no disponible' }, { status: 503 }));
  const error = (await screen.findByText('No se pudo cargar la información del salón.')).closest('[role="alert"]') as HTMLElement;
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(detailReads).toBe(1);
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('Horarios del salón');
  expect(error.isConnected).toBe(false);
  expect(detailReads).toBe(2);
  expect(userReads).toBe(2);
  expect(screen.getByText('Solo puedes consultar este calendario.')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});
it('integra horario semanal real, refresh de detalle y feedback sin conceder permisos de turnos', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 11, 31, 23, 45));
  let body: unknown;
  let reads = 0;
  const changed = salon({ horarios: [{ id: 'sun', diaSemana: 0, horaApertura: '10:00:00', horaCierre: '16:00:00' }] });
  server.use(http.get(`${api}/salones/s1`, () => HttpResponse.json(++reads === 1 ? salon() : changed)), http.post(`${api}/salones/s1/horarios/versiones`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ diaSemana: 0, horaApertura: '08:00', horaCierre: '18:00', vigenteDesde: '2026-12-31', vigenteHasta: null }); }));
  mount();
  await userEvent.click(await screen.findByRole('button', { name: 'Horario habitual' }));
  await screen.findByRole('dialog', { name: 'Horarios de Sede Prueba' });
  await userEvent.click(screen.getAllByRole('button', { name: 'Cambiar horario' })[0]);
  await userEvent.click(screen.getByRole('button', { name: 'Guardar horario' }));
  await screen.findByText('Horario actualizado.');
  expect(body).toEqual({ diaSemana: 0, efectivoDesde: '2026-12-31', horaApertura: '08:00', horaCierre: '18:00' });
  expect(reads).toBe(2);
  expect(screen.getByText('10:00 – 16:00')).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: /^Cerrar$/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.queryByRole('button', { name: 'Eliminar bloque completo' })).toBeNull();
});

it('nombra los controles de semana para navegación por teclado', async () => {
  mount();
  await screen.findByText('Horarios del salón');
  expect(screen.getByRole('button', { name: 'Semana anterior' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Semana siguiente' })).toBeTruthy();
});
