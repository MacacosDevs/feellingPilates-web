import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as usuariosAdmin from '../../../api/usuariosAdmin';
import { VentaNueva } from './VentaNueva';
import { api, choose, deferred, regressionSession, renderRoute } from '../../../components/test-support/regression';
import { server } from '../../../../tests/mocks/server';
import { pageOf, publicService, sale, user } from '../../../../tests/fixtures/regression';
import { useAuthStore } from '../../../auth/authStore';
const permissions = ['venta.registrar.vista', 'venta.registrar.crear'];
regressionSession(permissions);
let searches: Record<string, string>[];
beforeEach(() => {
    searches = [];
    server.use(http.get(`${api}/publico/paquetes`, () => HttpResponse.json([publicService(), publicService({ id: 'pB', nombre: 'Clase Yoga', precioCentavos: 2500 })])), http.get(`${api}/ventas/sedes`, () => HttpResponse.json([{ id: 's1', nombre: 'Sede Prueba' }])), http.get(`${api}/admin/usuarios`, ({ request }) => { searches.push(Object.fromEntries(new URL(request.url).searchParams)); return HttpResponse.json(pageOf([user({ roles: ['CLIENTE'] })])); }));
});
async function mount() { renderRoute(<VentaNueva />); await screen.findByText(/Sede:/); await screen.findByText(/^Pack Prueba/); }
function summary() { return screen.getByText('Resumen de venta').parentElement!; }
async function selectCustomer() { await userEvent.type(screen.getByRole('combobox', { name: 'Cliente' }), 'Ana'); await userEvent.click(await screen.findByRole('option', { name: 'Ana Prueba · ana@example.invalid' })); }
async function cart() { await selectCustomer(); await userEvent.click(screen.getByText(/^Pack Prueba/)); }
async function confirm() { await userEvent.click(screen.getByRole('button', { name: 'Cobrar' })); return screen.getByRole('dialog', { name: 'Confirmar venta' }); }
describe('VentaNueva: búsqueda, caja y comprobante', () => {
    it.each([[], ['venta.registrar.vista']].map(granted => [granted]))('separa permiso de vista y creación %j', async (granted) => {
        useAuthStore.setState({ usuario: user({ permisos: granted }) });
        renderRoute(<VentaNueva />);
        if (!granted.length) {
            expect(screen.getByRole('alert').textContent).toContain('venta.registrar.vista');
            expect(screen.queryByRole('combobox', { name: 'Cliente' })).toBeNull();
        }
        else {
            await screen.findByText(/^Pack Prueba/);
            await cart();
            expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(true);
        }
    });
    it.each([0, 1, 2])('prerrequisito de %s sedes y cliente seleccionado, carrito positivo', async (count) => {
        server.use(http.get(`${api}/ventas/sedes`, () => HttpResponse.json(Array.from({ length: count }, (_, i) => ({ id: `s${i + 1}`, nombre: `Sede ${i + 1}` })))));
        renderRoute(<VentaNueva />);
        await screen.findByText(/^Pack Prueba/);
        expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(true);
        await cart();
        if (count === 0) {
            expect(screen.getByText(/No tienes ninguna sede asignada/)).toBeTruthy();
            expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(true);
        }
        if (count === 1)
            expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(false);
        if (count === 2) {
            expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(true);
            await choose('Sede', 'Sede 2');
            expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(false);
        }
        fireEvent.change(within(summary()).getByRole('textbox'), { target: { value: '0' } });
        expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(true);
    });
    it('búsqueda mínima y debounce 300ms cancelan entradas previas; DTO de búsqueda exacto', async () => {
        await mount();
        const input = screen.getByRole('combobox', { name: 'Cliente' });
        await userEvent.click(input);
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        try {
            fireEvent.change(input, { target: { value: ' A ' } });
            await act(async () => { await vi.advanceTimersByTimeAsync(350); });
            expect(searches).toEqual([]);
            fireEvent.change(input, { target: { value: 'An' } });
            await act(async () => { await vi.advanceTimersByTimeAsync(200); });
            fireEvent.change(input, { target: { value: 'Ana' } });
            await act(async () => { await vi.advanceTimersByTimeAsync(299); });
            expect(searches).toEqual([]);
            await act(async () => { await vi.advanceTimersByTimeAsync(1); });
        }
        finally {
            vi.useRealTimers();
        }
        await waitFor(() => expect(searches).toEqual([{ page: '0', size: '10', sort: 'creadoEn,desc', rol: 'CLIENTE', busqueda: 'Ana' }]));
        expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(true);
    });
    it('ignora respuesta anterior cuando búsqueda nueva ya resolvió', async () => {
        const old = deferred<Response>();
        let oldStarted = false, newStarted = false;
        const lookup = vi.spyOn(usuariosAdmin, 'listarUsuarios');
        server.use(http.get(`${api}/admin/usuarios`, ({ request }) => { const query = new URL(request.url).searchParams.get('busqueda'); if (query === 'An') {
            oldStarted = true;
            return old.promise;
        } newStarted = true; return HttpResponse.json(pageOf([user()])); }));
        await mount();
        const input = screen.getByRole('combobox', { name: 'Cliente' });
        await userEvent.type(input, 'An');
        await waitFor(() => expect(oldStarted).toBe(true));
        await userEvent.type(input, 'a');
        await waitFor(() => expect(newStarted).toBe(true));
        await screen.findByRole('option', { name: 'Ana Prueba · ana@example.invalid' });
        await act(async () => { old.resolve(HttpResponse.json(pageOf([user({ id: 'old', nombre: 'Ana Antigua' })]))); await lookup.mock.results[0].value; });
        await waitFor(() => expect(screen.queryByRole('option', { name: /Ana Antigua/ })).toBeNull());
        expect(screen.getByRole('option', { name: 'Ana Prueba · ana@example.invalid' })).toBeTruthy();
    });
    it('proyecta centavos y cantidades, cancela sin escribir, POST confirmado único y recibo autoritativo limpia estado', async () => {
        const hold = deferred<Response>();
        const bodies: unknown[] = [];
        server.use(http.post(`${api}/ventas/carrito`, async ({ request }) => { bodies.push(await request.json()); return hold.promise; }));
        await mount();
        await cart();
        await userEvent.click(screen.getByText(/^Clase Yoga/));
        const amounts = within(summary()).getAllByRole('textbox');
        fireEvent.change(amounts[0], { target: { value: '02' } });
        fireEvent.change(amounts[1], { target: { value: '' } });
        expect((amounts[0] as HTMLInputElement).value).toBe('2');
        expect((amounts[1] as HTMLInputElement).value).toBe('0');
        const money = (n: number) => `${(n / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} MXN`;
        expect(within(summary()).getAllByText(money(24690))).toHaveLength(2);
        await choose('Método de pago', 'Transferencia');
        let dialog = await confirm();
        expect(bodies).toEqual([]);
        expect(within(dialog).queryByText('Clase Yoga')).toBeNull();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        dialog = await confirm();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar venta' }));
        await waitFor(() => expect(bodies).toHaveLength(1));
        expect(bodies[0]).toEqual({ clienteId: 'c1', salonId: 's1', metodoPago: 'transferencia', items: [{ paqueteId: 'pA', cantidad: 2 }] });
        expect((within(dialog).getByRole('button', { name: 'Cobrando…' }) as HTMLButtonElement).disabled).toBe(true);
        expect((within(dialog).getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('dialog', { name: 'Confirmar venta' })).toBeTruthy();
        await userEvent.keyboard('{Enter}');
        expect(bodies).toHaveLength(1);
        hold.resolve(HttpResponse.json({ grupoCompraId: 'abcdefg-123', totalCentavos: 23000, items: [sale({ montoCentavos: 11000, salonNombre: 'Sede servidor' }), sale({ id: 'v2', montoCentavos: 12000, salonNombre: 'Sede servidor' })] }));
        const receipt = await screen.findByRole('dialog', { name: /Venta registrada/ });
        expect(within(receipt).getAllByText(money(23000))[0]).toBeTruthy();
        expect(within(receipt).getByText('Sede servidor')).toBeTruthy();
        expect(within(receipt).getByText('FABCDEFG')).toBeTruthy();
        expect(within(receipt).getByText('Pack Prueba')).toBeTruthy();
        await userEvent.click(within(receipt).getByRole('button', { name: 'Cerrar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect((screen.getByRole('combobox', { name: 'Cliente' }) as HTMLInputElement).value).toBe('');
        expect(within(summary()).queryByRole('textbox')).toBeNull();
        expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(true);
    });
    it('error de cobro retiene cliente y carrito, permite reintento explícito', async () => {
        let posts = 0;
        server.use(http.post(`${api}/ventas/carrito`, () => { posts++; return HttpResponse.json({ message: 'Caja no disponible' }, { status: 409 }); }));
        await mount();
        await cart();
        let dialog = await confirm();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar venta' }));
        await screen.findByText('Caja no disponible');
        expect(screen.queryByRole('dialog', { name: /Venta registrada/ })).toBeNull();
        expect((within(dialog).getByRole('button', { name: 'Confirmar venta' }) as HTMLButtonElement).disabled).toBe(false);
        expect(posts).toBe(1);
        await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect((screen.getByRole('combobox', { name: 'Cliente' }) as HTMLInputElement).value).toContain('Ana Prueba');
        expect((within(summary()).getByRole('textbox') as HTMLInputElement).value).toBe('1');
        dialog = await confirm();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar venta' }));
        await waitFor(() => expect(posts).toBe(2));
    });
    it.each([false, true])('diálogo real de cliente, falla=%s conserva entrada o selecciona respuesta con DTO exacto', async (failure) => {
        const bodies: unknown[] = [];
        server.use(http.post(`${api}/admin/usuarios/clientes`, async ({ request }) => { bodies.push(await request.json()); return failure ? HttpResponse.json({ message: 'Correo en uso' }, { status: 409 }) : HttpResponse.json(user({ id: 'new', nombre: 'Cliente Nuevo', correo: 'nuevo@example.invalid', roles: ['CLIENTE'] })); }));
        await mount();
        await userEvent.click(screen.getByRole('button', { name: '+ Cliente nuevo' }));
        const dialog = screen.getByRole('dialog', { name: 'Nuevo cliente' });
        await userEvent.type(within(dialog).getByRole('textbox', { name: /^Nombre/ }), 'Cliente Nuevo');
        await userEvent.type(within(dialog).getByRole('textbox', { name: /^Correo/ }), 'nuevo@example.invalid');
        if (!failure)
            await userEvent.type(within(dialog).getByRole('textbox', { name: 'Teléfono' }), '4421234567');
        await userEvent.click(within(dialog).getByRole('button', { name: 'Crear cliente' }));
        await waitFor(() => expect(bodies).toEqual([{ nombre: 'Cliente Nuevo', correo: 'nuevo@example.invalid', ...(!failure ? { telefono: '4421234567' } : {}) }]));
        if (failure) {
            await screen.findByText('Correo en uso');
            expect((within(dialog).getByRole('textbox', { name: /^Correo/ }) as HTMLInputElement).value).toBe('nuevo@example.invalid');
        }
        else {
            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
            expect((screen.getByRole('combobox', { name: 'Cliente' }) as HTMLInputElement).value).toBe('Cliente Nuevo · nuevo@example.invalid');
            expect(within(summary()).getByText('Cliente Nuevo')).toBeTruthy();
        }
    });
    it('varias sedes envían el id seleccionado y limpiar cliente bloquea cobro', async () => {
        const bodies: unknown[] = [];
        server.use(http.get(`${api}/ventas/sedes`, () => HttpResponse.json([{ id: 's1', nombre: 'Sede Uno' }, { id: 's2', nombre: 'Sede Dos' }])), http.post(`${api}/ventas/carrito`, async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ message: 'Falla sintética' }, { status: 409 }); }));
        renderRoute(<VentaNueva />);
        await screen.findByText(/^Pack Prueba/);
        await cart();
        await choose('Sede', 'Sede Dos');
        const dialog = await confirm();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar venta' }));
        await screen.findByText('Falla sintética');
        expect(bodies).toEqual([{ clienteId: 'c1', salonId: 's2', metodoPago: 'efectivo', items: [{ paqueteId: 'pA', cantidad: 1 }] }]);
        await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await userEvent.clear(screen.getByRole('combobox', { name: 'Cliente' }));
        expect((screen.getByRole('button', { name: 'Cobrar' }) as HTMLButtonElement).disabled).toBe(true);
    });
});
