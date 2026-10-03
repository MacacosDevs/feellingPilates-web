import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { VentaGestion } from './VentaGestion';
import { VentaNueva } from './VentaNueva';
import { VentaServicios } from './VentaServicios';
import { api, deferred, regressionSession, renderRoute } from '../../../components/test-support/regression';
import { server } from '../../../../tests/mocks/server';
import { activities, pageOf, publicService, sale, service, user } from '../../../../tests/fixtures/regression';

regressionSession(['venta.gestion.vista', 'venta.gestion.ver.todos', 'venta.gestion.gestionar',
  'venta.registrar.vista', 'venta.registrar.crear', 'venta.servicios.vista',
  'venta.servicios.gestionar.ver', 'venta.servicios.gestionar.editar', 'venta.servicios.gestionar.deshabilitar']);
beforeEach(() => server.use(
  http.get(`${api}/ventas/sedes`, () => HttpResponse.json([{ id: 's1', nombre: 'Sede Prueba' }])),
  http.get(`${api}/ventas/buscar`, () => HttpResponse.json(pageOf([sale()]))),
  http.get(`${api}/publico/paquetes`, () => HttpResponse.json([publicService()])),
  http.get(`${api}/ventas/servicios`, () => HttpResponse.json([service()])),
  http.get(`${api}/tipos-actividad`, () => HttpResponse.json(activities)),
));

describe('Ventas: errores de transporte y recuperación manual', () => {
  it('catálogo fallido no es vacío; un GET manual muestra pending y recupera', async () => {
    let reads = 0;
    const gate = deferred<Response>();
    server.use(http.get(`${api}/publico/paquetes`, () => ++reads === 1 ? HttpResponse.json({}, { status: 503 }) : gate.promise));
    renderRoute(<VentaNueva />);
    await screen.findByText('No se pudieron cargar los paquetes y clases.');
    expect(screen.queryByText(/Aún no hay nada dado de alta/)).toBeNull();
    expect(reads).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(reads).toBe(2));
    expect(screen.getByRole('progressbar', { name: 'Cargando paquetes y clases' })).toBeTruthy();
    await act(async () => gate.resolve(HttpResponse.json([publicService()])));
    await screen.findByText(/^Pack Prueba/);
    expect(screen.queryByText('No se pudieron cargar los paquetes y clases.')).toBeNull();
    expect(reads).toBe(2);
  });

  it('sede fallida no se presenta como falta de asignación y reintenta sólo sedes', async () => {
    let reads = 0, packages = 0;
    server.use(http.get(`${api}/ventas/sedes`, () => ++reads === 1 ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json([{ id: 's1', nombre: 'Sede Prueba' }])),
      http.get(`${api}/publico/paquetes`, () => { packages++; return HttpResponse.json([publicService()]); }));
    renderRoute(<VentaNueva />);
    await screen.findByText('No se pudieron cargar las sedes.');
    expect(screen.queryByText(/No tienes ninguna sede asignada/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText(/Sede:/);
    expect(reads).toBe(2); expect(packages).toBe(1);
  });

  it('búsqueda fallida conserva consulta, recupera mismo GET manual sin venta', async () => {
    let reads = 0;
    server.use(http.get(`${api}/admin/usuarios`, ({ request }) => {
      expect(new URL(request.url).searchParams.get('busqueda')).toBe('Ana');
      return ++reads === 1 ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json(pageOf([user()]));
    }));
    renderRoute(<VentaNueva />);
    await screen.findByText(/^Pack Prueba/);
    await userEvent.type(screen.getByRole('combobox', { name: 'Cliente' }), 'Ana');
    await screen.findByText('No se pudieron buscar los clientes.');
    expect(reads).toBe(1);
    expect((screen.getByRole('combobox', { name: 'Cliente' }) as HTMLInputElement).value).toBe('Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(reads).toBe(2));
    await userEvent.click(screen.getByRole('combobox', { name: 'Cliente' }));
    await screen.findByRole('option', { name: /Ana Prueba/ });
    expect(reads).toBe(2);
  });

  it('historial fallido no es vacío; reintento GET conserva parámetros', async () => {
    const queries: string[] = [];
    server.use(http.get(`${api}/ventas/buscar`, ({ request }) => {
      queries.push(new URL(request.url).search);
      return queries.length === 1 ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json(pageOf([sale()]));
    }));
    renderRoute(<VentaGestion />);
    await screen.findByText('No se pudo actualizar el historial de ventas.');
    expect(screen.queryByText('Aún no hay ventas registradas.')).toBeNull();
    expect(queries).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('row', { name: /Ana Prueba/ });
    expect(queries).toEqual([queries[0], queries[0]]);
  });

  it('PATCH confirmado y refresh fallido mantienen error de lectura y jamás repiten escritura', async () => {
    let reads = 0;
    const bodies: unknown[] = [];
    const gate = deferred<Response>();
    server.use(http.get(`${api}/ventas/buscar`, () => ++reads === 2 ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json(pageOf([sale({ estado: reads > 2 ? 'reembolsada' : 'pagada' })]))),
      http.patch(`${api}/ventas/v1/reembolsar`, async ({ request }) => { bodies.push(await request.json()); return gate.promise; }));
    renderRoute(<VentaGestion />);
    await userEvent.click(within(await screen.findByRole('row', { name: /Ana Prueba/ })).getByRole('button', { name: 'Acciones' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Marcar como reembolsada' }));
    const dialog = screen.getByRole('dialog', { name: 'Marcar como reembolsada' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Motivo' }), '  motivo  ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(bodies).toEqual([{ motivo: 'motivo' }]));
    expect((within(dialog).getByRole('button', { name: 'Procesando…' }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.keyboard('{Escape}'); expect(screen.getByRole('dialog')).toBeTruthy();
    expect(reads).toBe(1);
    await act(async () => gate.resolve(HttpResponse.json(sale({ estado: 'reembolsada' }))));
    await screen.findByText('No se pudo actualizar el historial de ventas.');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.queryByText('No se pudo reembolsar la venta')).toBeNull();
    expect(reads).toBe(2); expect(bodies).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Reembolsada')).toBeTruthy();
    expect(reads).toBe(3); expect(bodies).toHaveLength(1);
  });

  it('servicios: lectura fallida recuperable y toggle rechazado conserva estado sin retrywrite', async () => {
    let reads = 0, writes = 0;
    server.use(http.get(`${api}/ventas/servicios`, () => ++reads === 1 ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json([service()])),
      http.patch(`${api}/ventas/servicios/pA/deshabilitar`, () => { writes++; return HttpResponse.json({ message: 'Estado no disponible' }, { status: 409 }); }));
    renderRoute(<VentaServicios />);
    await screen.findByText('No se pudieron cargar los servicios.');
    expect(screen.queryByText('No hay registros en esta categoría.')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('row', { name: /Pack Prueba/ });
    await userEvent.click(screen.getByRole('button', { name: 'Deshabilitar' }));
    await screen.findByText('Estado no disponible');
    expect(within(screen.getByRole('row', { name: /Pack Prueba/ })).getByText('Activo')).toBeTruthy();
    expect(reads).toBe(2); expect(writes).toBe(1);
  });

  it('servicios guardado exitoso seguido de lectura fallida conserva éxito separado de error GET', async () => {
    let reads = 0; const bodies: unknown[] = [];
    server.use(http.get(`${api}/ventas/servicios`, () => ++reads === 2 ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json([service()])),
      http.put(`${api}/ventas/servicios/pA`, async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json(service()); }));
    renderRoute(<VentaServicios />);
    await userEvent.click(within(await screen.findByRole('row', { name: /Pack Prueba/ })).getByRole('button', { name: 'Editar' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar paquete' });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Nombre' }), { target: { value: '  Pack Prueba  ' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await screen.findByText('No se pudieron cargar los servicios.');
    expect(screen.getByText('Guardado')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('row', { name: /Pack Prueba/ });
    expect(reads).toBe(3); expect(bodies).toHaveLength(1);
  });
});
