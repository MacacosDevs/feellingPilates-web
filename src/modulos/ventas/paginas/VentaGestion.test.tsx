import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { isAxiosError } from 'axios';
import { apiClient } from '../../../api/client';
import { VentaGestion } from './VentaGestion';
import { api, choose, deferred, regressionSession, renderRoute } from '../../../components/test-support/regression';
import { server } from '../../../../tests/mocks/server';
import { pageOf, sale, user } from '../../../../tests/fixtures/regression';
import { useAuthStore } from '../../../auth/authStore';
const permissions = ['venta.gestion.vista', 'venta.gestion.ver.todos', 'venta.gestion.gestionar'];
regressionSession(permissions);
let queries: Record<string, string>[];
beforeEach(() => {
    queries = [];
    server.use(http.get(`${api}/ventas/sedes`, () => HttpResponse.json([{ id: 's1', nombre: 'Sede Prueba' }])), http.get(`${api}/ventas/buscar`, ({ request }) => { const q = Object.fromEntries(new URL(request.url).searchParams); queries.push(q); return HttpResponse.json(pageOf([sale()], { totalElements: 31, totalPages: 4, number: Number(q.page), size: Number(q.size) })); }));
});
async function mount() { renderRoute(<VentaGestion />); await screen.findByRole('row', { name: /Ana Prueba/ }); }
async function action(row: HTMLElement) { await userEvent.click(within(row).getByRole('button', { name: 'Acciones' })); await userEvent.click(screen.getByRole('menuitem', { name: 'Marcar como reembolsada' })); return screen.getByRole('dialog', { name: 'Marcar como reembolsada' }); }
describe('VentaGestion: consulta remota y acción seleccionada', () => {
    it('usa info oscuro en el chip outlined de transferencia', async () => {
        server.use(http.get(`${api}/ventas/buscar`, () => HttpResponse.json(pageOf([sale({ metodoPago: 'transferencia' })]))));
        await mount();
        const chip = screen.getByText('Transferencia').closest('.MuiChip-root') as HTMLElement;
        expect(getComputedStyle(chip).color).toBe('rgb(1, 87, 155)');
    });
    it.each([[], ['venta.gestion.vista'], ['venta.gestion.vista', 'venta.gestion.ver.propio'], ['venta.gestion.vista', 'venta.gestion.ver.todos'], ['venta.gestion.ver.todos']].map(granted => [granted]))('alcance explícito %j', async (granted) => {
        useAuthStore.setState({ usuario: user({ permisos: granted }) });
        renderRoute(<VentaGestion />);
        const visible = granted.includes('venta.gestion.vista') && (granted.includes('venta.gestion.ver.propio') || granted.includes('venta.gestion.ver.todos'));
        if (visible) {
            await screen.findByRole('row', { name: /Ana Prueba/ });
            expect(screen.queryByRole('button', { name: 'Acciones' })).toBeNull();
        }
        else {
            expect(screen.getByRole('alert').textContent).toContain('No tienes permiso');
            expect(screen.queryByRole('table')).toBeNull();
        }
        if (!granted.includes('venta.gestion.ver.propio') && !granted.includes('venta.gestion.ver.todos'))
            expect(queries).toEqual([]);
    });
    it('filtros exactos, fechas locales sin transformación, paginación remota y resets', async () => {
        await mount();
        expect(queries[0]).toEqual({ page: '0', size: '10', sort: 'creadoEn,desc' });
        expect(screen.getByText('1-10 de 31')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: /next page/i }));
        await waitFor(() => expect(queries.at(-1)!.page).toBe('1'));
        fireEvent.change(screen.getByPlaceholderText('Buscar cliente o cobrador'), { target: { value: 'Ana' } });
        await choose('Método', 'Transferencia');
        await choose('Sede', 'Sede Prueba');
        await choose('Estado', 'Cobrada');
        await userEvent.click(screen.getAllByRole('button', { name: 'Fecha' })[0]);
        fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-01' } });
        fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-30' } });
        await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '10', sort: 'creadoEn,desc', busqueda: 'Ana', metodoPago: 'transferencia', salonId: 's1', estado: 'pagada', desde: '2026-09-01', hasta: '2026-09-30' }));
        await userEvent.click(screen.getByRole('button', { name: 'Limpiar fechas' }));
        await waitFor(() => expect(queries.at(-1)).not.toHaveProperty('desde'));
        await userEvent.click(screen.getByLabelText('Desde'));
        await userEvent.keyboard('{Escape}');
        await choose(/Rows per page|Filas por página/, '25');
        await waitFor(() => expect(queries.at(-1)!.size).toBe('25'));
        await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
        await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '25', sort: 'creadoEn,desc' }));
    });
    it.each([['Cliente', 'usuario.nombre'], ['Paquete', 'paquete.nombre'], ['Monto', 'montoCentavos'], ['Método', 'metodoPago'], ['Sede', 'salon.nombre'], ['Cobrada por', 'registradaPor.nombre'], ['Fecha', 'creadoEn']])('ordena columna %s por %s y reinicia página', async (label, prop) => {
        await mount();
        await userEvent.click(screen.getByRole('button', { name: /next page/i }));
        await waitFor(() => expect(queries.at(-1)!.page).toBe('1'));
        const sort = within(screen.getByRole('columnheader', { name: new RegExp(`^${label}`) })).getByRole('button');
        await userEvent.click(sort);
        await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '10', sort: `${prop},asc` }));
        await userEvent.click(sort);
        await waitFor(() => expect(queries.at(-1)!.sort).toBe(`${prop},desc`));
    });
    it('agrupa sólo página visible, suma centavos y acción hija mantiene expansión; PATCH único pending→GET nuevo', async () => {
        const data = [sale(), sale({ id: 'v2', paqueteNombre: 'Yoga Visible', montoCentavos: 2500, numeroItem: 2 }), sale({ id: 'solo', clienteNombre: 'Eva Prueba', grupoCompraId: null, paqueteNombre: 'Suelto', montoCentavos: 1000 })];
        let reads = 0;
        const bodies: unknown[] = [];
        const hold = deferred<Response>();
        server.use(http.get(`${api}/ventas/buscar`, () => { reads++; return HttpResponse.json(pageOf(reads === 1 ? data : data.map(v => v.id === 'v2' ? { ...v, estado: 'reembolsada' } : v), { totalElements: 19 })); }), http.patch(`${api}/ventas/v2/reembolsar`, async ({ request }) => { bodies.push(await request.json()); return hold.promise; }));
        await mount();
        const group = screen.getByRole('row', { name: /2 artículos/ });
        const money = (n: number) => `${(n / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} MXN`;
        expect(within(group).getByText(money(14845))).toBeTruthy();
        expect(screen.queryByText('Yoga Visible')).toBeNull();
        expect(screen.getByRole('row', { name: /Eva Prueba/ })).toBeTruthy();
        await userEvent.click(group);
        const child = screen.getByRole('row', { name: /Yoga Visible/ });
        const dialog = await action(child);
        expect(screen.getByText('Yoga Visible')).toBeTruthy();
        const reason = within(dialog).getByRole('textbox', { name: 'Motivo' });
        await userEvent.type(reason, '   ');
        expect((within(dialog).getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.change(reason, { target: { value: '  motivo de prueba  ' } });
        await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
        await waitFor(() => expect(bodies).toEqual([{ motivo: 'motivo de prueba' }]));
        expect(reads).toBe(1);
        expect((within(dialog).getByRole('button', { name: 'Procesando…' }) as HTMLButtonElement).disabled).toBe(true);
        expect((within(dialog).getByRole('button', { name: 'Cerrar' }) as HTMLButtonElement).disabled).toBe(true);
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeTruthy();
        await userEvent.keyboard('{Enter}');
        expect(bodies).toHaveLength(1);
        hold.resolve(HttpResponse.json({ ...data[1], estado: 'reembolsada' }));
        await waitFor(() => expect(reads).toBe(2));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(within(screen.getByRole('row', { name: /Yoga Visible/ })).getByText('Reembolsada')).toBeTruthy();
        expect(within(screen.getByRole('row', { name: /2 artículos/ })).getByText('Mixto')).toBeTruthy();
    });
    it('error PATCH retiene motivo editable sin GET ni escritura automática', async () => {
        let posts = 0;
        server.use(http.patch(`${api}/ventas/v1/reembolsar`, () => { posts++; return HttpResponse.json({ message: 'Acción no disponible' }, { status: 409 }); }));
        await mount();
        const dialog = await action(screen.getByRole('row', { name: /Ana Prueba/ }));
        await userEvent.type(within(dialog).getByRole('textbox', { name: 'Motivo' }), 'motivo original');
        await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
        await screen.findByText('Acción no disponible');
        expect(queries).toHaveLength(1);
        expect(posts).toBe(1);
        expect((within(dialog).getByRole('textbox', { name: 'Motivo' }) as HTMLTextAreaElement).value).toBe('motivo original');
        expect((within(dialog).getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement).disabled).toBe(false);
        fireEvent.change(within(dialog).getByRole('textbox', { name: 'Motivo' }), { target: { value: 'motivo corregido' } });
        expect((within(dialog).getByRole('textbox', { name: 'Motivo' }) as HTMLTextAreaElement).value).toBe('motivo corregido');
    });
    it('PATCH exitoso seguido de refresh fallido no repite escritura; feedback ambiguo queda fuera del contrato', async () => {
        let gets = 0, writes = 0;
        const events: string[] = [];
        const refreshFailed = deferred<void>();
        server.use(
            http.get(`${api}/ventas/buscar`, () => {
                gets++;
                if (gets === 1) return HttpResponse.json(pageOf([sale()]));
                events.push('start GET refresh');
                return HttpResponse.json({}, { status: 503 });
            }),
            http.patch(`${api}/ventas/v1/reembolsar`, () => {
                writes++;
                events.push('start PATCH');
                return HttpResponse.json(sale({ estado: 'reembolsada' }));
            }),
        );
        await mount();
        const interceptor = apiClient.interceptors.response.use(response => {
            if (response.config.method === 'patch' && response.config.url === '/ventas/v1/reembolsar') {
                events.push(`complete PATCH ${response.status}`);
            }
            return response;
        }, (error: unknown) => {
            if (isAxiosError(error) && error.config?.method === 'get' && error.config.url === '/ventas/buscar') {
                events.push(`failed GET refresh ${error.response?.status}`);
                refreshFailed.resolve();
            }
            // Observe transport only; propagate the original rejection unchanged
            // so production error handling and the strict MSW ledger remain active.
            return Promise.reject(error);
        });
        try {
            const dialog = await action(screen.getByRole('row', { name: /Ana Prueba/ }));
            await userEvent.type(within(dialog).getByRole('textbox', { name: 'Motivo' }), 'motivo');
            await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
            await act(async () => { await refreshFailed.promise; });
            expect(events).toEqual(['start PATCH', 'complete PATCH 200', 'start GET refresh', 'failed GET refresh 503']);
            expect(gets).toBe(2);
            expect(writes).toBe(1);
            // KNOWN_BEHAVIOR_GAP_NOT_LOCKED: no refresh text, error channel or
            // remaining-dialog expectation canonizes misleading financial feedback.
        } finally {
            apiClient.interceptors.response.eject(interceptor);
        }
    });
});
