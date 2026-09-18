import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DialogoSalon } from './DialogoSalon';
import { api, choose, deferred, regressionSession, renderRoute } from '../../../components/test-support/regression';
import { server } from '../../../../tests/mocks/server';
import { activities, salon } from '../../../../tests/fixtures/regression';
import type { SalonRequest } from '../../../api/types';
regressionSession([]);
beforeEach(() => server.use(http.get(`${api}/ubicaciones/estados`, () => HttpResponse.json([{ id: 1, nombre: 'Querétaro' }, { id: 2, nombre: 'Jalisco' }])), http.get(`${api}/ubicaciones/estados/1/municipios`, () => HttpResponse.json([{ id: 10, estadoId: 1, nombre: 'Centro' }])), http.get(`${api}/ubicaciones/estados/2/municipios`, () => HttpResponse.json([{ id: 20, estadoId: 2, nombre: 'Zapopan' }])), http.get(`${api}/tipos-actividad`, () => HttpResponse.json(activities)), http.get(`${api}/tipos-recurso`, () => HttpResponse.json([{ id: 'r1', nombre: 'Reformer', descripcion: null, activo: true }, { id: 'r2', nombre: 'Tapete', descripcion: null, activo: true }]))));
function mount(existing: ReturnType<typeof salon> | null = null) { const close = vi.fn(), saved = vi.fn(); const element = (abierto: boolean) => <DialogoSalon abierto={abierto} salon={existing} onCerrar={close} onGuardado={saved}/>; const view = renderRoute(element(true)); return { close, saved, view, element }; }
async function general() { for (const [label, value] of [['Nombre del salón', 'Sede Nueva'], ['Teléfono de atención', '4420000000'], ['Calle', 'Calle Prueba'], ['Colonia', 'Centro'], ['Código postal', '76000']])
    await userEvent.type(screen.getByRole('textbox', { name: new RegExp(`^${label}`) }), value); await choose(/^Estado/, 'Querétaro'); await choose(/^Municipio/, 'Centro'); }
async function next() { await userEvent.click(screen.getByRole('button', { name: 'Siguiente' })); }
const expected: SalonRequest = { nombre: 'Sede Nueva', estadoId: 1, municipioId: 10, telefono: '4420000000', calle: 'Calle Prueba', numeroExterior: null, numeroInterior: null, colonia: 'Centro', codigoPostal: '76000', referencias: null, direccionCompleta: null, latitud: null, longitud: null, tipoActividadIds: ['a1'], horarios: [{ diaSemana: 0, horaApertura: '09:30', horaCierre: '17:30' }], recursos: [{ tipoRecursoId: 'r1', cantidad: 3 }] };
describe('DialogoSalon: asistente real y DTO', () => {
    it('crea sólo al guardar en último paso, conserva datos tras POST fallido y reintenta payload exacto', async () => {
        const bodies: unknown[] = [];
        const hold = deferred<Response>();
        server.use(http.post(`${api}/salones`, async ({ request }) => { bodies.push(await request.json()); return bodies.length === 1 ? HttpResponse.json({ message: 'Nombre no disponible' }, { status: 409 }) : hold.promise; }));
        const { saved } = mount();
        await general();
        // Enter cannot prematurely POST. Explicit form submission at an earlier
        // wizard step advances through the guard in handleSubmit (code authoritative).
        fireEvent.keyDown(screen.getByRole('textbox', { name: /^Calle/ }), { key: 'Enter' });
        expect(bodies).toEqual([]);
        fireEvent.submit(screen.getByRole('textbox', { name: /Nombre del salón/ }).closest('form')!);
        await choose('Actividades', 'Pilates');
        await userEvent.keyboard('{Escape}');
        await next();
        await userEvent.click(screen.getByRole('switch', { name: 'Domingo' }));
        fireEvent.change(screen.getByLabelText('Abre'), { target: { value: '09:30' } });
        fireEvent.change(screen.getByLabelText('Cierra'), { target: { value: '17:30' } });
        await next();
        expect(bodies).toEqual([]);
        await userEvent.click(screen.getByRole('button', { name: 'Agregar equipamiento' }));
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Cantidad' }), { target: { value: '3' } });
        await userEvent.click(screen.getByRole('button', { name: 'Guardar salón' }));
        expect(await screen.findByText('Nombre no disponible')).toBeTruthy();
        expect(saved).not.toHaveBeenCalled();
        expect((screen.getByRole('spinbutton', { name: 'Cantidad' }) as HTMLInputElement).value).toBe('3');
        await userEvent.click(screen.getByRole('button', { name: 'Guardar salón' }));
        await waitFor(() => expect(bodies).toHaveLength(2));
        expect((screen.getByRole('button', { name: 'Guardando...' }) as HTMLButtonElement).disabled).toBe(true);
        expect(bodies).toEqual([expected, expected]);
        const returned = salon({ nombre: 'Respuesta servidor' });
        hold.resolve(HttpResponse.json(returned));
        await waitFor(() => expect(saved).toHaveBeenCalledExactlyOnceWith(returned));
    });
    it.each([false, true])('edita horarios lectura, cerrado todos=%s y PUT horarios:null; fallo conserva campos', async (closed) => {
        const existing = salon({ horarios: closed ? [] : salon().horarios });
        const bodies: unknown[] = [];
        server.use(http.put(`${api}/salones/s1`, async ({ request }) => { bodies.push(await request.json()); return bodies.length === 1 ? HttpResponse.json({ message: 'Editar falló' }, { status: 409 }) : HttpResponse.json(existing); }));
        const { saved } = mount(existing);
        await waitFor(() => expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain('Centro'));
        expect((screen.getByRole('textbox', { name: /Nombre del salón/ }) as HTMLInputElement).value).toBe('Sede Prueba');
        await next();
        await next();
        expect(screen.queryByRole('switch')).toBeNull();
        if (closed)
            expect(screen.getAllByText('Cerrado')).toHaveLength(7);
        await next();
        await userEvent.click(screen.getByRole('button', { name: 'Guardar salón' }));
        await screen.findByText('Editar falló');
        expect(saved).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Guardar salón' }));
        await waitFor(() => expect(saved).toHaveBeenCalledOnce());
        const { id: _id, estadoNombre: _estadoNombre, municipioNombre: _municipioNombre, activo: _activo, tiposActividad, horarios: _horarios, recursos: _recursos, ...fields } = existing;
        expect(bodies).toEqual([1, 2].map(() => ({ ...fields, tipoActividadIds: tiposActividad.map(a => a.id), horarios: null, recursos: [] })));
    });
    it('habilita municipio tras respuesta diferida y limpia selección cuando cambia estado', async () => {
        const hold = deferred<Response>();
        let launched = false;
        server.use(http.get(`${api}/ubicaciones/estados/1/municipios`, () => { launched = true; return hold.promise; }));
        mount();
        expect(screen.getByRole('combobox', { name: /^Municipio/ }).getAttribute('aria-disabled')).toBe('true');
        await choose(/^Estado/, 'Querétaro');
        await waitFor(() => expect(launched).toBe(true));
        expect(screen.getByRole('combobox', { name: /^Municipio/ }).getAttribute('aria-disabled')).toBe('true');
        hold.resolve(HttpResponse.json([{ id: 10, estadoId: 1, nombre: 'Centro' }]));
        await choose(/^Municipio/, 'Centro');
        await choose(/^Estado/, 'Jalisco');
        await waitFor(() => expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent?.trim()).not.toBe('Centro'));
        await choose(/^Municipio/, 'Zapopan');
        expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain('Zapopan');
    });
    it('equipamiento añade categorías únicas, cuenta y elimina fila; cerrar/reabrir restablece asistente', async () => {
        const { view, element, close } = mount();
        await general();
        await next();
        await choose('Actividades', 'Pilates');
        await userEvent.keyboard('{Escape}');
        await next();
        await userEvent.click(screen.getByRole('switch', { name: 'Lunes' }));
        await next();
        await userEvent.click(screen.getByRole('button', { name: 'Agregar equipamiento' }));
        await userEvent.click(screen.getByRole('button', { name: 'Agregar equipamiento' }));
        expect(screen.getAllByRole('combobox', { name: 'Tipo de equipamiento' }).map(e => e.textContent)).toEqual(['Reformer', 'Tapete']);
        expect((screen.getByRole('button', { name: 'Agregar equipamiento' }) as HTMLButtonElement).disabled).toBe(true);
        // Delete icon has no accessible name. Scope to the resource row anchored by
        // its labelled select, rather than using an Emotion class or global index.
        const row = screen.getAllByRole('combobox', { name: 'Tipo de equipamiento' })[0].closest('.MuiFormControl-root')!.parentElement!;
        await userEvent.click(within(row).getByRole('button'));
        expect(screen.getAllByRole('combobox', { name: 'Tipo de equipamiento' })).toHaveLength(1);
        await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(close).toHaveBeenCalledOnce();
        view.rerender(element(false));
        view.rerender(element(true));
        await waitFor(() => expect((screen.getByRole('textbox', { name: /Nombre del salón/ }) as HTMLInputElement).value).toBe(''));
        expect(screen.queryByRole('button', { name: 'Guardar salón' })).toBeNull();
    });
});
