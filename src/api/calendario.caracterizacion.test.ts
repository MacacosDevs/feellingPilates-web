import { afterEach, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setToken } from './client';
import { actualizarTurno, crearTurno, eliminarTurno, listarTurnosPorInstructor, listarTurnosPorSalon, listarTurnosPuntuales } from './calendario';
import { server } from '../../tests/mocks/server';
import { assignment, pageOf, turno } from '../../tests/fixtures/regression';
const api = 'https://api.test.invalid/api';
afterEach(() => setToken(null));
it('GET distingue salón e instructor y devuelve el shape recibido sin transformación', async () => {
  setToken('synthetic-m08');
  const queries: Record<string, string>[] = [];
  const rows = [turno({ horaInicio: '09:15:00' })];
  server.use(http.get(`${api}/turnos-instructor`, ({ request }) => {
    expect(request.headers.get('authorization')).toBe('Bearer synthetic-m08');
    queries.push(Object.fromEntries(new URL(request.url).searchParams));
    return HttpResponse.json(rows);
  }));
  expect(await listarTurnosPorSalon('s1')).toEqual(rows);
  expect(await listarTurnosPorInstructor('s1', 'i1')).toEqual(rows);
  expect(queries).toEqual([{ salonId: 's1' }, { salonId: 's1', usuarioId: 'i1' }]);
});
it('GET puntuales omite filtros vacíos, conserva domingo cero y respeta página/tamaño explícitos', async () => {
  const queries: Record<string, string>[] = [];
  const result = pageOf([turno({ tipo: 'EXCEPCION', fecha: '2027-01-03', diaSemana: null })]);
  server.use(http.get(`${api}/turnos-instructor/puntuales`, ({ request }) => {
    queries.push(Object.fromEntries(new URL(request.url).searchParams));
    return HttpResponse.json(result);
  }));
  expect(await listarTurnosPuntuales('s1', undefined)).toEqual(result);
  await listarTurnosPuntuales('s1', '', { tipo: '', diaSemana: '' });
  await listarTurnosPuntuales('s1', 'i1', { page: 2, size: 25, tipo: 'CANCELACION', diaSemana: 0 });
  expect(queries).toEqual([{ salonId: 's1', page: '0', size: '10' }, { salonId: 's1', page: '0', size: '10' }, { salonId: 's1', usuarioId: 'i1', page: '2', size: '25', tipo: 'CANCELACION', diaSemana: '0' }]);
});
it('POST/PATCH JSON y DELETE usan Bearer y el DTO actual sin campos adicionales', async () => {
  setToken('synthetic-m08');
  const creation = { salonId: 's1', tipo: 'RECURRENTE' as const, diaSemana: 0, fecha: null, horaInicio: '09:00', horaFin: '11:00', asignaciones: [assignment] };
  const update = { diaSemana: 0, horaInicio: '10:00', horaFin: '12:00', asignaciones: [{ ...assignment, horaInicio: '10:30', horaFin: '11:30' }] };
  const writes: unknown[] = [];
  const saved = turno({ horaInicio: '10:00:00' });
  server.use(...(['post', 'patch', 'delete'] as const).map(method => http[method](`${api}/turnos-instructor${method === 'post' ? '' : '/t1'}`, async ({ request }) => {
    expect(request.headers.get('authorization')).toBe('Bearer synthetic-m08');
    if (method !== 'delete') expect(request.headers.get('content-type')).toContain('application/json');
    writes.push({ method: request.method, body: method === 'delete' ? await request.text() : await request.json() });
    return method === 'delete' ? new HttpResponse(null, { status: 204 }) : HttpResponse.json(saved);
  })));
  expect(await crearTurno(creation)).toEqual(saved);
  expect(await actualizarTurno('t1', update)).toEqual(saved);
  expect((await eliminarTurno('t1')).status).toBe(204);
  expect(writes).toEqual([{ method: 'POST', body: creation }, { method: 'PATCH', body: update }, { method: 'DELETE', body: '' }]);
});
