import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { CalendarioHorariosInstructor } from '../../modulos/programacion/componentes/CalendarioHorariosInstructor';
import { apiClient } from '../../api/client';
import { SalonHorarios } from '../../modulos/programacion/paginas/SalonHorarios';
import { api, choose, deferred, regressionSession, renderRoute } from '../../components/test-support/regression';
import { server } from '../../../tests/mocks/server';
import { assignment, pageOf, salon, turno, user } from '../../../tests/fixtures/regression';
import type { SalonHorarioExcepcionResponse } from '../../api/types';
type CalendarProps = ComponentProps<typeof CalendarioHorariosInstructor>;
const harness = vi.hoisted(() => ({ current: null as CalendarProps | null }));
// This child only exposes parent callback transport/state ownership. Real child
// interactions live in its colocated suite and production Chromium geometry spec.
vi.mock('../../modulos/programacion/componentes/CalendarioHorariosInstructor', () => ({ CalendarioHorariosInstructor: (p: CalendarProps) => {
        harness.current = p;
        return <section aria-label="Calendario de prueba"><p>{p.instructoresSalon.map(i => i.nombre).join(', ')}</p><p>{[...p.turnosRecurrentes, ...p.turnosPuntuales].map(t => `${t.id} ${t.horaInicio}`).join(', ')}</p><p>{p.excepciones.map(e => `${e.id} ${e.fecha}`).join(', ')}</p></section>;
    } }));
const permissions = ['calendario.gestionar', 'calendario.cancelar', 'calendario.editar', 'salon.administrar'];
regressionSession(permissions);
let reads: string[];
beforeEach(() => {
    reads = [];
    harness.current = null;
    const instructors = [user({ id: 'i1', nombre: 'Inés Prueba', rolesAsignados: [{ rol: 'INSTRUCTOR', salonIds: ['s1'] }] }), user({ id: 'i2', nombre: 'Luz Prueba', rolesAsignados: [{ rol: 'INSTRUCTOR', salonIds: ['s1'] }] }), user({ id: 'other', roles: ['INSTRUCTOR'], rolesAsignados: [{ rol: 'INSTRUCTOR', salonIds: ['s2'] }] }), user({ id: 'wrong-role', rolesAsignados: [{ rol: 'PERSONAL', salonIds: ['s1'] }] })];
    server.use(http.get(`${api}/salones/s1`, () => { reads.push('salon'); return HttpResponse.json(salon()); }), http.get(`${api}/admin/usuarios`, ({ request }) => { reads.push('usuarios'); expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({ page: '0', size: '100', sort: 'creadoEn,desc', rol: 'INSTRUCTOR' }); return HttpResponse.json(pageOf(instructors)); }), http.get(`${api}/admin/usuarios/i1/especialidades`, () => HttpResponse.json([{ tipoActividadId: 'a1', nombre: 'Pilates', duracionMinutos: 60 }])), http.get(`${api}/admin/usuarios/i2/especialidades`, () => HttpResponse.json([])), http.get(`${api}/turnos-instructor`, ({ request }) => { reads.push('turnos'); expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({ salonId: 's1' }); return HttpResponse.json([turno()]); }), http.get(`${api}/salones/s1/excepciones-horario`, ({ request }) => { reads.push(`semana:${new URL(request.url).search}`); return HttpResponse.json([]); }), http.get(`${api}/turnos-instructor/puntuales`, ({ request }) => { reads.push(`puntuales:${new URL(request.url).search}`); return HttpResponse.json(pageOf([])); }));
});
async function mount() { renderRoute(<Routes><Route path="/salones/:id/horarios" element={<SalonHorarios />}/></Routes>, '/salones/s1/horarios'); await screen.findByRole('region', { name: 'Calendario de prueba' }); return harness.current!; }
const segment = { horaInicio: '12:00', horaFin: '13:00', asignaciones: [assignment] };
function CambiarSalon() {
    const navigate = useNavigate();
    return <><button onClick={() => navigate('/salones/s2/horarios')}>Cambiar salón</button><Routes><Route path="/salones/:id/horarios" element={<SalonHorarios />}/></Routes></>;
}
describe('SalonHorarios: transporte y coordinación', () => {
    it('lanza lecturas independientes, presenta la especialidad fallida y recupera el mismo contexto', async () => {
        const hold = deferred<Response>();
        let specialtyStarted = false;
        let lecturasI1 = 0;
        let fallosI2 = 0;
        server.use(http.get(`${api}/admin/usuarios/i1/especialidades`, () => { specialtyStarted = true; return ++lecturasI1 === 1 ? hold.promise : HttpResponse.json([{ tipoActividadId: 'a1', nombre: 'Pilates', duracionMinutos: 60 }]); }), http.get(`${api}/admin/usuarios/i2/especialidades`, () => ++fallosI2 === 1 ? HttpResponse.json({ message: 'Especialidad no disponible' }, { status: 503 }) : HttpResponse.json([])));
        renderRoute(<Routes><Route path="/salones/:id/horarios" element={<SalonHorarios />}/></Routes>, '/salones/s1/horarios');
        await waitFor(() => { expect(specialtyStarted).toBe(true); expect(reads).toContain('turnos'); expect(reads.some(r => r.startsWith('semana:'))).toBe(true); expect(reads.some(r => r.startsWith('puntuales:'))).toBe(true); });
        hold.resolve(HttpResponse.json([{ tipoActividadId: 'a1', nombre: 'Pilates', duracionMinutos: 60 }]));
        const error = (await screen.findByText('No se pudo cargar la información del salón.')).closest('[role="alert"]') as HTMLElement;
        await userEvent.click(within(error).getByRole('button', { name: 'Reintentar' }));
        await screen.findByRole('region', { name: 'Calendario de prueba' });
        expect(screen.getByText('Inés Prueba, Luz Prueba')).toBeTruthy();
        expect(harness.current!.mapaEspecialidades.i1).toEqual(['a1']);
        expect(harness.current!.mapaEspecialidades.i2).toEqual([]);
        expect(fallosI2).toBe(2);
        expect(harness.current).toMatchObject({ puedeGestionar: true, puedeCancelar: true, puedeEditar: true, puedeAdministrarSalon: true });
    });
    it.each(['RECURRENTE', 'EXCEPCION'] as const)('crea %s con DTO exacto y respuesta local del servidor', async (tipo) => {
        let body: unknown;
        const saved = turno({ id: 'created', tipo, diaSemana: tipo === 'RECURRENTE' ? 0 : null, fecha: tipo === 'RECURRENTE' ? null : '2026-09-20', horaInicio: '12:15:00' });
        server.use(http.post(`${api}/turnos-instructor`, async ({ request }) => { body = await request.json(); return HttpResponse.json(saved); }));
        const p = await mount();
        const count = reads.filter(r => r.startsWith('puntuales:')).length;
        await act(async () => { await p.onCrear(tipo, 0, '2026-09-20', '12:00', '13:00', [assignment]); });
        expect(body).toEqual({ salonId: 's1', tipo, diaSemana: tipo === 'RECURRENTE' ? 0 : null, fecha: tipo === 'RECURRENTE' ? null : '2026-09-20', horaInicio: '12:00', horaFin: '13:00', asignaciones: [assignment] });
        expect(screen.getByText(/created 12:15:00/)).toBeTruthy();
        await waitFor(() => expect(reads.filter(r => r.startsWith('puntuales:')).length).toBe(count + (tipo === 'RECURRENTE' ? 0 : 1)));
    });
    it('cancelación envia día completo e ids; borrado correcto actualiza estado y refresca puntuales', async () => {
        let body: unknown;
        const deleted: string[] = [];
        server.use(http.post(`${api}/turnos-instructor`, async ({ request }) => { body = await request.json(); return HttpResponse.json(turno({ id: 'cancel', tipo: 'CANCELACION', diaSemana: null, fecha: '2026-09-20' })); }), http.delete(`${api}/turnos-instructor/t1`, () => { deleted.push('t1'); return new HttpResponse(null, { status: 204 }); }));
        const p = await mount();
        await act(async () => { await p.onCancelarFecha('2026-09-20', ['i1', 'i2']); });
        expect(body).toEqual({ salonId: 's1', tipo: 'CANCELACION', diaSemana: null, fecha: '2026-09-20', horaInicio: '00:00', horaFin: '23:59', asignaciones: ['i1', 'i2'].map(instructorId => ({ instructorId, tipoActividadIds: [], horaInicio: null, horaFin: null })) });
        await act(async () => { await harness.current!.onEliminar('t1'); });
        expect(deleted).toEqual(['t1']);
        expect(harness.current!.turnosRecurrentes).toEqual([]);
        await waitFor(() => expect(reads.filter(r => r.startsWith('puntuales:')).length).toBe(3));
    });
    it('PATCH usa respuesta autoritativa; error resuelto conserva estado y vuelve string', async () => {
        let body: unknown;
        let attempts = 0;
        server.use(http.patch(`${api}/turnos-instructor/t1`, async ({ request }) => { body = await request.json(); return ++attempts === 1 ? HttpResponse.json({ message: 'No se pudo mover' }, { status: 409 }) : HttpResponse.json(turno({ horaInicio: '12:15:00' })); }));
        const p = await mount();
        let result: string | null = '';
        await act(async () => { result = await p.onMover('t1', 0, '12:00', '13:00', [assignment], true); });
        expect(result).toBe('No se pudo mover');
        expect(harness.current!.turnosRecurrentes[0].horaInicio).toBe('09:00:00');
        expect(screen.queryByText('Horario actualizado.')).toBeNull();
        await act(async () => { result = await p.onMover('t1', 0, '12:00', '13:00', [assignment]); });
        expect(result).toBeNull();
        expect(body).toEqual({ diaSemana: 0, horaInicio: '12:00', horaFin: '13:00', asignaciones: [assignment] });
        expect(screen.getByText(/t1 12:15:00/)).toBeTruthy();
    });
    it.each([false, true])('PUT excepción de operación cerrado=%s y DELETE mantienen propiedad local', async (cerrado) => {
        let body: unknown;
        const saved: SalonHorarioExcepcionResponse = { id: 'op', fecha: '2026-09-20', cerrado, horaApertura: cerrado ? null : '10:00', horaCierre: cerrado ? null : '17:00' };
        server.use(http.put(`${api}/salones/s1/excepciones-horario`, async ({ request }) => { body = await request.json(); return HttpResponse.json(saved); }), http.delete(`${api}/salones/s1/excepciones-horario/op`, () => new HttpResponse(null, { status: 204 })));
        const p = await mount();
        await act(async () => { await p.onGuardarExcepcion(saved.fecha, cerrado, saved.horaApertura, saved.horaCierre); });
        expect(body).toEqual({ fecha: saved.fecha, cerrado, horaApertura: saved.horaApertura, horaCierre: saved.horaCierre });
        expect(screen.getByText('op 2026-09-20')).toBeTruthy();
        await act(async () => { await harness.current!.onEliminarExcepcion('op'); });
        expect(harness.current!.excepciones).toEqual([]);
    });
    it('reemplaza DELETE→POST esperando cada respuesta antes de continuar', async () => {
        const events: string[] = [];
        const posts: unknown[] = [];
        const gates = [deferred<Response>(), deferred<Response>(), deferred<Response>(), deferred<Response>()];
        const responses = [
            new HttpResponse(null, { status: 204 }),
            new HttpResponse(null, { status: 204 }),
            HttpResponse.json(turno({ id: 'new1', tipo: 'EXCEPCION', diaSemana: null, fecha: '2026-09-20' })),
            HttpResponse.json(turno({ id: 'new2', tipo: 'EXCEPCION', diaSemana: null, fecha: '2026-09-20' })),
        ];
        server.use(
            http.delete(`${api}/turnos-instructor/old1`, () => {
                events.push('start DELETE old1');
                return gates[0].promise;
            }),
            http.delete(`${api}/turnos-instructor/old2`, () => {
                events.push('start DELETE old2');
                return gates[1].promise;
            }),
            http.post(`${api}/turnos-instructor`, async ({ request }) => {
                posts.push(await request.json());
                events.push(`start POST ${posts.length === 1 ? 'A' : 'B'}`);
                return gates[posts.length + 1].promise;
            }),
        );
        const p = await mount();
        // Completion means Axios received the response, not merely that the
        // MSW handler started or its deferred response was released.
        const interceptor = apiClient.interceptors.response.use(response => {
            if (response.config.method === 'delete' && response.config.url === '/turnos-instructor/old1') {
                events.push('complete DELETE old1');
            } else if (response.config.method === 'delete' && response.config.url === '/turnos-instructor/old2') {
                events.push('complete DELETE old2');
            } else if (response.config.method === 'post' && response.config.url === '/turnos-instructor') {
                events.push(`complete POST ${response.data.id === 'new1' ? 'A' : 'B'}`);
            }
            return response;
        });
        let mutation: Promise<string | null> | undefined;
        try {
            act(() => {
                mutation = p.onAjustarFecha('2026-09-20', [segment, { ...segment, horaInicio: '13:00', horaFin: '14:00' }], ['old1', 'old2'], true);
            });
            await waitFor(() => expect(events).toEqual(['start DELETE old1']));
            gates[0].resolve(responses[0]);
            await waitFor(() => expect(events).toEqual([
                'start DELETE old1', 'complete DELETE old1', 'start DELETE old2',
            ]));
            gates[1].resolve(responses[1]);
            await waitFor(() => expect(events).toEqual([
                'start DELETE old1', 'complete DELETE old1', 'start DELETE old2', 'complete DELETE old2', 'start POST A',
            ]));
            gates[2].resolve(responses[2]);
            await waitFor(() => expect(events).toEqual([
                'start DELETE old1', 'complete DELETE old1', 'start DELETE old2', 'complete DELETE old2',
                'start POST A', 'complete POST A', 'start POST B',
            ]));
            let result: string | null | undefined;
            await act(async () => {
                gates[3].resolve(responses[3]);
                result = await mutation;
            });
            expect(result).toBeNull();
            expect(events).toEqual([
                'start DELETE old1', 'complete DELETE old1', 'start DELETE old2', 'complete DELETE old2',
                'start POST A', 'complete POST A', 'start POST B', 'complete POST B',
            ]);
            expect(posts).toEqual([segment, { ...segment, horaInicio: '13:00', horaFin: '14:00' }].map(s => ({ ...s, salonId: 's1', tipo: 'EXCEPCION', diaSemana: null, fecha: '2026-09-20' })));
            expect(harness.current!.turnosPuntuales.map(t => t.id)).toEqual(['new1', 'new2']);
            // No rollback, intermediate local state or partial server-state policy is asserted.
        } finally {
            try {
                // Release every owned request even if an assertion fails; retain
                // the original transport outcome rather than swallowing errors.
                await act(async () => {
                    gates.forEach((gate, i) => gate.resolve(responses[i]));
                    await mutation;
                });
            } finally {
                apiClient.interceptors.response.eject(interceptor);
            }
        }
    });
    it.each([['DELETE', 1], ['DELETE', 2], ['POST', 1], ['POST', 2]] as const)('falla %s número %s: detiene operaciones siguientes y retorna error', async (method, ordinal) => {
        const operations: string[] = [];
        let deletes = 0;
        let posts = 0;
        const response = (kind: string, n: number) => kind === method && n === ordinal ? HttpResponse.json({ message: `Falla ${kind} ${n}` }, { status: 409 }) : null;
        server.use(http.delete(`${api}/turnos-instructor/:id`, ({ params }) => { operations.push(`DELETE ${params.id}`); return response('DELETE', ++deletes) ?? new HttpResponse(null, { status: 204 }); }), http.post(`${api}/turnos-instructor`, () => { operations.push('POST'); return response('POST', ++posts) ?? HttpResponse.json(turno({ id: `new${posts}`, tipo: 'EXCEPCION' })); }));
        const p = await mount();
        let result: string | null = null;
        await act(async () => { result = await p.onAjustarFecha('2026-09-20', [segment, segment], ['old1', 'old2'], true); });
        expect(result).toBe(`Falla ${method} ${ordinal}`);
        expect(operations).toEqual(['DELETE old1', 'DELETE old2', 'POST', 'POST'].slice(0, method === 'DELETE' ? ordinal : 2 + ordinal));
        expect(screen.queryByText('Horario guardado solo para esa fecha.')).toBeNull();
        // Deliberately no rollback/partial-server-state claim: backend authority is outside this lane.
    });
    it('consulta semana local y filtros puntuales domingo cero, página y restablecimiento', async () => {
        const queries: Record<string, string>[] = [];
        server.use(http.get(`${api}/turnos-instructor/puntuales`, ({ request }) => { const q = Object.fromEntries(new URL(request.url).searchParams); queries.push(q); return HttpResponse.json(pageOf([turno({ id: 'e1', tipo: 'EXCEPCION', fecha: '2026-09-20' })], { totalElements: 21, totalPages: 3, number: Number(q.page) })); }));
        await mount();
        expect(queries[0]).toEqual({ salonId: 's1', page: '0', size: '10' });
        const start = harness.current!.inicioSemana;
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        expect(reads).toContain(`semana:?desde=${iso(start)}&hasta=${iso(end)}`);
        await userEvent.click(screen.getByRole('button', { name: /next page/i }));
        await waitFor(() => expect(queries.at(-1)!.page).toBe('1'));
        await choose('Día', 'Domingo');
        await waitFor(() => expect(queries.at(-1)).toEqual({ salonId: 's1', page: '0', size: '10', diaSemana: '0' }));
        await choose('Tipo', 'Cancelación');
        await waitFor(() => expect(queries.at(-1)).toEqual({ salonId: 's1', page: '0', size: '10', diaSemana: '0', tipo: 'CANCELACION' }));
        expect(screen.getByText(/Domingo, 2026-09-20/)).toBeTruthy();
    });
    it('crear/borrar/operación fallidos conservan el estado previo sin feedback de éxito', async () => {
        server.use(http.post(`${api}/turnos-instructor`, () => HttpResponse.json({ message: 'Crear falló' }, { status: 409 })), http.delete(`${api}/turnos-instructor/t1`, () => HttpResponse.json({ message: 'Borrar falló' }, { status: 409 })), http.put(`${api}/salones/s1/excepciones-horario`, () => HttpResponse.json({ message: 'Operación falló' }, { status: 409 })));
        const p = await mount();
        await act(async () => { await p.onCrear('RECURRENTE', 0, null, '12:00', '13:00', [assignment]); });
        expect(screen.getByText('Crear falló')).toBeTruthy();
        await act(async () => { await p.onEliminar('t1'); });
        expect(screen.getByText('Borrar falló')).toBeTruthy();
        expect(harness.current!.turnosRecurrentes).toHaveLength(1);
        await act(async () => { await p.onGuardarExcepcion('2026-09-20', true, null, null); });
        expect(screen.getByText('Operación falló')).toBeTruthy();
        expect(harness.current!.excepciones).toEqual([]);
    });
    it('navega semanas desde domingo local de noche sin desfase UTC', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 8, 13, 23, 45));
        await mount();
        expect(reads).toContain('semana:?desde=2026-09-13&hasta=2026-09-19');
        // Week arrows have no names; scope the two buttons to their visible week label.
        const week = screen.getByText(/^Semana del/).parentElement!;
        await userEvent.click(within(week).getAllByRole('button')[1]);
        await waitFor(() => expect(reads).toContain('semana:?desde=2026-09-20&hasta=2026-09-26'));
        await userEvent.click(within(week).getAllByRole('button')[0]);
        await waitFor(() => expect(reads.filter(r => r === 'semana:?desde=2026-09-13&hasta=2026-09-19')).toHaveLength(2));
    });
    it('DELETE de excepción operativa fallido retiene respuesta previa', async () => {
        const op: SalonHorarioExcepcionResponse = { id: 'op1', fecha: '2026-09-16', cerrado: true, horaApertura: null, horaCierre: null };
        server.use(http.get(`${api}/salones/s1/excepciones-horario`, () => HttpResponse.json([op])), http.delete(`${api}/salones/s1/excepciones-horario/op1`, () => HttpResponse.json({ message: 'No se puede eliminar' }, { status: 409 })));
        const p = await mount();
        await waitFor(() => expect(harness.current!.excepciones).toEqual([op]));
        await act(async () => { await p.onEliminarExcepcion('op1'); });
        expect(harness.current!.excepciones).toEqual([op]);
        expect(screen.getByText('No se puede eliminar')).toBeTruthy();
    });
    it('descarta una semana anterior que termina después de la semana vigente', async () => {
        const antigua = deferred<Response>();
        let consultas = 0;
        server.use(http.get(`${api}/salones/s1/excepciones-horario`, () => {
            consultas++;
            return consultas === 1
                ? antigua.promise
                : HttpResponse.json([{ id: 'semana-vigente', fecha: '2026-09-20', cerrado: true, horaApertura: null, horaCierre: null }]);
        }));
        await mount();
        const week = screen.getByText(/^Semana del/).parentElement!;
        await userEvent.click(within(week).getAllByRole('button')[1]);
        await waitFor(() => expect(harness.current!.excepciones.map((e) => e.id)).toEqual(['semana-vigente']));
        antigua.resolve(HttpResponse.json([{ id: 'semana-antigua', fecha: '2026-09-13', cerrado: true, horaApertura: null, horaCierre: null }]));
        await waitFor(() => expect(consultas).toBe(2));
        expect(harness.current!.excepciones.map((e) => e.id)).toEqual(['semana-vigente']);
    });
    it('una falla anterior no reemplaza el éxito del salón vigente', async () => {
        const turnosAnteriores = deferred<Response>();
        server.use(
            http.get(`${api}/salones/:salonId`, ({ params }) => HttpResponse.json(salon({ id: String(params.salonId), nombre: params.salonId === 's2' ? 'Sede Vigente' : 'Sede Prueba' }))),
            http.get(`${api}/admin/usuarios`, () => HttpResponse.json(pageOf([user({ id: 'i1', nombre: 'Inés Prueba', rolesAsignados: [{ rol: 'INSTRUCTOR', salonIds: ['s1', 's2'] }] })]))),
            http.get(`${api}/turnos-instructor`, ({ request }) => new URL(request.url).searchParams.get('salonId') === 's1'
                ? turnosAnteriores.promise
                : HttpResponse.json([turno({ id: 'turno-vigente', salonId: 's2' })])),
            http.get(`${api}/salones/s2/excepciones-horario`, () => HttpResponse.json([])),
            http.get(`${api}/turnos-instructor/puntuales`, ({ request }) => HttpResponse.json(pageOf([], { number: Number(new URL(request.url).searchParams.get('page')) }))),
        );
        renderRoute(<CambiarSalon />, '/salones/s1/horarios');
        await screen.findByText('Horarios del salón');
        await userEvent.click(screen.getByRole('button', { name: 'Cambiar salón' }));
        await waitFor(() => expect(harness.current!.turnosRecurrentes.map((t) => t.id)).toEqual(['turno-vigente']));
        turnosAnteriores.resolve(HttpResponse.json({ message: 'Turnos anteriores no disponibles' }, { status: 503 }));
        await waitFor(() => expect(screen.getByText(/Sede Vigente/)).toBeTruthy());
        expect(screen.queryByText('No se pudieron cargar los horarios recurrentes.')).toBeNull();
        expect(harness.current!.turnosRecurrentes.map((t) => t.id)).toEqual(['turno-vigente']);
    });
    it('mantiene el error del filtro vigente ante éxito tardío y reintenta una sola vez con los mismos parámetros', async () => {
        const anterior = deferred<Response>();
        const consultas: Record<string, string>[] = [];
        let cancelaciones = 0;
        server.use(http.get(`${api}/turnos-instructor/puntuales`, ({ request }) => {
            const q = Object.fromEntries(new URL(request.url).searchParams);
            consultas.push(q);
            if (q.tipo === 'EXCEPCION') return anterior.promise;
            if (q.tipo === 'CANCELACION') {
                cancelaciones++;
                return cancelaciones === 1
                    ? HttpResponse.json({ message: 'Cancelaciones no disponibles' }, { status: 503 })
                    : HttpResponse.json(pageOf([]));
            }
            return HttpResponse.json(pageOf([turno({ id: 'inicial', tipo: 'EXCEPCION', fecha: '2026-09-20' })]));
        }));
        await mount();
        await choose('Tipo', 'Horario especial');
        await waitFor(() => expect(consultas.some((q) => q.tipo === 'EXCEPCION')).toBe(true));
        await choose('Tipo', 'Cancelación');
        const error = (await screen.findByText('No se pudieron cargar las excepciones y cancelaciones.')).closest('[role="alert"]') as HTMLElement;
        expect(cancelaciones).toBe(1);
        anterior.resolve(HttpResponse.json(pageOf([turno({ id: 'respuesta-antigua', tipo: 'EXCEPCION', fecha: '2026-09-21' })])));
        await waitFor(() => expect(screen.queryByText(/respuesta-antigua/)).toBeNull());
        expect(screen.getByText('No se pudieron cargar las excepciones y cancelaciones.')).toBeTruthy();
        await userEvent.click(within(error).getByRole('button', { name: 'Reintentar' }));
        await screen.findByText('Sin excepciones ni cancelaciones registradas.');
        expect(cancelaciones).toBe(2);
        expect(consultas.filter((q) => q.tipo === 'CANCELACION')).toEqual(Array(2).fill({
            salonId: 's1', page: '0', size: '10', tipo: 'CANCELACION',
        }));
    });
});
