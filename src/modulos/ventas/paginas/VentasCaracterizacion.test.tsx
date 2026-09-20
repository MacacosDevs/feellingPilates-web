import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { VentaGestion } from './VentaGestion';
import { VentaNueva } from './VentaNueva';
import { VentaServicios } from './VentaServicios';
import { api, regressionSession, renderRoute } from '../../../components/test-support/regression';
import { server } from '../../../../tests/mocks/server';
import { activities, pageOf, publicService, sale, service } from '../../../../tests/fixtures/regression';

regressionSession(['venta.gestion.vista', 'venta.gestion.ver.todos', 'venta.gestion.gestionar',
  'venta.registrar.vista', 'venta.registrar.crear', 'venta.servicios.vista',
  'venta.servicios.gestionar.ver', 'venta.servicios.gestionar.crear', 'venta.servicios.gestionar.editar']);

describe('Ventas: contratos de presentación previos al cambio', () => {
  it.each([
    ['pagada', 'Cobrada', 'success'], ['cancelada', 'Cancelada', 'default'],
    ['reembolsada', 'Reembolsada', 'error'], ['pendiente', 'Pendiente', 'warning'],
    ['fallida', 'Fallida', 'error'],
  ])('estado %s conserva etiqueta %s, color y elegibilidad', async (estado, etiqueta, color) => {
    server.use(http.get(`${api}/ventas/sedes`, () => HttpResponse.json([])),
      http.get(`${api}/ventas/buscar`, () => HttpResponse.json(pageOf([sale({ estado })]))));
    renderRoute(<VentaGestion />);
    const row = await screen.findByRole('row', { name: /Ana Prueba/ });
    expect(within(row).getByText(etiqueta).closest('.MuiChip-root')!.classList.contains(`MuiChip-color${color[0].toUpperCase()}${color.slice(1)}`)).toBe(true);
    expect(within(row).getByText('$123.45 MXN')).toBeTruthy();
    expect(within(row).getByText('FABCDEFG')).toBeTruthy();
    await userEvent.click(within(row).getByRole('button', { name: 'Acciones' }));
    expect(screen.getByRole('menuitem', { name: 'Marcar como reembolsada' }).getAttribute('aria-disabled')).toBe(estado === 'pagada' ? null : 'true');
  });

  it('motivo en blanco no habilita ni envía una mutación', async () => {
    const writes: unknown[] = [];
    server.use(http.get(`${api}/ventas/sedes`, () => HttpResponse.json([])),
      http.get(`${api}/ventas/buscar`, () => HttpResponse.json(pageOf([sale()]))),
      http.patch(`${api}/ventas/v1/reembolsar`, async ({ request }) => { writes.push(await request.json()); return HttpResponse.json(sale()); }));
    renderRoute(<VentaGestion />);
    await userEvent.click(within(await screen.findByRole('row', { name: /Ana Prueba/ })).getByRole('button', { name: 'Acciones' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Marcar como reembolsada' }));
    const dialog = screen.getByRole('dialog', { name: 'Marcar como reembolsada' });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Motivo' }), { target: { value: '   ' } });
    const confirm = within(dialog).getByRole('button', { name: 'Confirmar' });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    (confirm as HTMLButtonElement).click();
    expect(writes).toEqual([]);
  });

  it('precio y vigencia inválidos conservan formulario sin POST ni PUT', async () => {
    const writes: string[] = [];
    server.use(http.get(`${api}/ventas/servicios`, () => HttpResponse.json([service()])),
      http.get(`${api}/tipos-actividad`, () => HttpResponse.json(activities)),
      http.post(`${api}/ventas/servicios`, () => { writes.push('POST'); return HttpResponse.json(service()); }),
      http.put(`${api}/ventas/servicios/pA`, () => { writes.push('PUT'); return HttpResponse.json(service()); }));
    renderRoute(<VentaServicios />);
    const row = await screen.findByRole('row', { name: /Pack Prueba/ });
    expect(within(row).getByText('$123.45')).toBeTruthy();
    expect(within(row).queryByText('$123.45 MXN')).toBeNull();
    await userEvent.click(within(row).getByRole('button', { name: 'Editar' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar paquete' });
    const price = within(dialog).getByRole('spinbutton', { name: 'Precio (MXN)' });
    fireEvent.change(price, { target: { value: '-1' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(within(dialog).getByRole('alert').textContent).toBe('El precio debe ser mayor a 0');
    expect((price as HTMLInputElement).value).toBe('-1');
    fireEvent.change(price, { target: { value: '123.45' } });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'Vigencia (días)' }), { target: { value: '0' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(within(dialog).getByRole('alert').textContent).toBe('La vigencia debe ser mayor a 0 días');
    expect(writes).toEqual([]);
  });

  it('catálogo conserva centavos y falta de cliente bloquea cobro sin POST', async () => {
    const writes: unknown[] = [];
    server.use(http.get(`${api}/publico/paquetes`, () => HttpResponse.json([publicService()])),
      http.get(`${api}/ventas/sedes`, () => HttpResponse.json([{ id: 's1', nombre: 'Sede Prueba' }])),
      http.post(`${api}/ventas/carrito`, async ({ request }) => { writes.push(await request.json()); return HttpResponse.json({}); }));
    renderRoute(<VentaNueva />);
    await userEvent.click(await screen.findByText(/^Pack Prueba/));
    const summary = screen.getByText('Resumen de venta').parentElement!;
    expect(within(summary).getAllByText('$123.45 MXN')).toHaveLength(2);
    const charge = screen.getByRole('button', { name: 'Cobrar' });
    expect((charge as HTMLButtonElement).disabled).toBe(true);
    (charge as HTMLButtonElement).click();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(writes).toEqual([]);
  });
});
