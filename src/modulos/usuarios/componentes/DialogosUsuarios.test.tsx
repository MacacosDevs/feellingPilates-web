import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../../tests/mocks/server';
import { renderWithTheme } from '../../../components/test-support/renderWithTheme';
import { DialogoCrearCliente } from './DialogoCrearCliente';
import { DialogoCrearPersonal } from './DialogoCrearPersonal';
import { DialogoEditarUsuario } from './DialogoEditarUsuario';
import { user, salon, activities } from '../../../../tests/fixtures/regression';
const api = 'https://api.test.invalid/api';
const input = (label: string) => screen.getByRole('textbox', { name: new RegExp(`^${label}`) }) as HTMLInputElement;
describe('Contratos de diálogos de usuarios mediante formulario', () => {
  it('cliente rechazado mantiene datos sin callback ni reintento automático y éxito explícito cierra', async () => {
    const bodies: unknown[] = []; const response = user({ nombre: 'Nombre servidor', roles: ['CLIENTE'] });
    server.use(http.post(`${api}/admin/usuarios/clientes`, async ({ request }) => { bodies.push(await request.json()); return bodies.length === 1 ? HttpResponse.json({ message: 'Alta rechazada' }, { status: 400 }) : HttpResponse.json(response); }));
    const ui = userEvent.setup(), created = vi.fn(), close = vi.fn();
    renderWithTheme(<DialogoCrearCliente abierto onCerrar={close} onCreado={created} />);
    await ui.type(input('Nombre'), 'Ana'); await ui.type(input('Correo'), 'ana@example.invalid'); await ui.type(input('Teléfono'), '4421234567');
    await ui.click(screen.getByRole('button', { name: 'Crear cliente' })); await screen.findByText('Alta rechazada');
    expect(input('Nombre').value).toBe('Ana'); expect(input('Correo').value).toBe('ana@example.invalid'); expect(input('Teléfono').value).toBe('4421234567');
    expect(created).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
    await new Promise(resolve => setTimeout(resolve, 100)); expect(bodies).toHaveLength(1);
    await ui.click(screen.getByRole('button', { name: 'Crear cliente' }));
    await waitFor(() => expect(created).toHaveBeenCalledExactlyOnceWith(response)); expect(close).toHaveBeenCalledTimes(1);
    expect(bodies).toEqual(Array(2).fill({ correo: 'ana@example.invalid', nombre: 'Ana', telefono: '4421234567' }));
    expect(input('Nombre').value).toBe('');
  });
  it('cliente sin teléfono omite el campo opcional y entrega la respuesta del servidor', async () => {
    let body: unknown; const response = user({ roles: ['CLIENTE'] });
    server.use(http.post(`${api}/admin/usuarios/clientes`, async ({ request }) => { body = await request.json(); return HttpResponse.json(response); }));
    const ui = userEvent.setup(), created = vi.fn(), close = vi.fn(); renderWithTheme(<DialogoCrearCliente abierto onCerrar={close} onCreado={created} />);
    await ui.type(input('Nombre'), 'Ana'); await ui.type(input('Correo'), 'ana@example.invalid');
    await ui.click(screen.getByRole('button', { name: 'Crear cliente' }));
    await waitFor(() => expect(created).toHaveBeenCalledExactlyOnceWith(response)); expect(close).toHaveBeenCalledTimes(1);
    expect(body).toEqual({ correo: 'ana@example.invalid', nombre: 'Ana' });
  });
  it.each(['PERSONAL', 'INSTRUCTOR', 'ADMIN'] as const)('alta %s conserva valor de rol, requisito de sedes, payload y contraseña temporal', async rol => {
    const bodies: unknown[] = []; server.use(http.get(`${api}/salones`, () => HttpResponse.json([salon()])),
      http.post(`${api}/admin/usuarios/personal`, async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ usuario: user(), contrasenaTemporal: 'clave-sintetica' }); }));
    const ui = userEvent.setup(), created = vi.fn(), close = vi.fn(); renderWithTheme(<DialogoCrearPersonal abierto onCerrar={close} onCreado={created} />);
    await ui.type(input('Nombre'), 'Pablo'); await ui.type(input('Correo'), 'pablo@example.invalid');
    expect(screen.getByRole('combobox', { name: 'Rol' }).textContent).toBe('Personal');
    if (rol === 'ADMIN') { await ui.click(screen.getByRole('combobox', { name: /^Sedes/ })); await ui.click(await screen.findByRole('option', { name: /Sede Prueba/ })); await ui.keyboard('{Escape}'); }
    if (rol === 'INSTRUCTOR') await ui.type(input('Teléfono'), '4427654321');
    if (rol !== 'PERSONAL') { await ui.click(screen.getByRole('combobox', { name: 'Rol' })); await ui.click(screen.getByRole('option', { name: rol === 'ADMIN' ? 'Admin' : 'Instructor' })); }
    if (rol !== 'ADMIN') {
      const sede = screen.getByRole('combobox', { name: /^Sedes/ }); expect((sede as HTMLInputElement).required).toBe(true);
      await ui.click(screen.getByRole('button', { name: 'Crear usuario' })); expect(bodies).toEqual([]); expect(created).not.toHaveBeenCalled();
      await ui.click(sede); await ui.click(await screen.findByRole('option', { name: /Sede Prueba/ })); await ui.keyboard('{Escape}');
    } else expect(screen.queryByRole('combobox', { name: /^Sedes/ })).toBeNull();
    await ui.click(screen.getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() => expect(created).toHaveBeenCalledExactlyOnceWith('pablo@example.invalid', 'clave-sintetica')); expect(close).toHaveBeenCalledTimes(1);
    expect(bodies).toEqual([{ correo: 'pablo@example.invalid', nombre: 'Pablo', rol, ...(rol === 'INSTRUCTOR' ? { telefono: '4427654321' } : {}), ...(rol === 'ADMIN' ? {} : { salonIds: ['s1'] }) }]);
  });
  it('edita perfil, sedes por rol y actividades en orden con cuerpos exactos y callback de última respuesta', async () => {
    const instructor = user({ id: 'u1', nombre: 'Ana', telefono: '111', fotoUrl: 'foto-sintetica', descripcion: 'Perfil', roles: ['PERSONAL', 'INSTRUCTOR'], rolesAsignados: [{ rol: 'PERSONAL', salonIds: ['s1'] }, { rol: 'INSTRUCTOR', salonIds: ['s1'] }] });
    const calls: unknown[] = []; const finalResponse = user({ ...instructor, nombre: 'Respuesta final servidor' });
    server.use(http.get(`${api}/salones`, () => HttpResponse.json([salon(), salon({ id: 's2', nombre: 'Sede Norte' })])),
      http.get(`${api}/tipos-actividad`, () => HttpResponse.json(activities)),
      http.get(`${api}/admin/usuarios/u1/especialidades`, () => HttpResponse.json([{ tipoActividadId: 'a1', nombre: 'Pilates', duracionMinutos: 60 }])),
      http.put(`${api}/admin/usuarios/u1`, async ({ request }) => { calls.push({ path: '/admin/usuarios/u1', body: await request.json() }); return HttpResponse.json(user({ ...instructor, nombre: 'Perfil servidor' })); }),
      http.put(`${api}/admin/usuarios/u1/roles/:rol/sedes`, async ({ request, params }) => { calls.push({ path: `/admin/usuarios/u1/roles/${params.rol}/sedes`, body: await request.json() }); return HttpResponse.json(params.rol === 'INSTRUCTOR' ? finalResponse : user({ ...instructor, nombre: 'Sedes personal servidor' })); }),
      http.put(`${api}/admin/usuarios/u1/especialidades`, async ({ request }) => { calls.push({ path: '/admin/usuarios/u1/especialidades', body: await request.json() }); return HttpResponse.json([]); }));
    const ui = userEvent.setup(), updated = vi.fn(), close = vi.fn(); renderWithTheme(<DialogoEditarUsuario usuario={instructor} onCerrar={close} onActualizado={updated} />);
    await screen.findByDisplayValue('Ana'); await ui.clear(input('Nombre')); await ui.type(input('Nombre'), 'Ana editada');
    await ui.clear(input('Teléfono')); await ui.type(input('Teléfono'), '222');
    await ui.click(screen.getByRole('combobox', { name: /^Salón — Instructor/ })); await ui.click(await screen.findByRole('option', { name: /Sede Norte/ })); await ui.keyboard('{Escape}');
    await ui.click(screen.getByRole('combobox', { name: 'Actividades que puede impartir' })); await ui.click(await screen.findByRole('option', { name: 'Yoga' })); await ui.keyboard('{Escape}');
    await ui.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(updated).toHaveBeenCalledExactlyOnceWith(finalResponse)); expect(close).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      { path: '/admin/usuarios/u1', body: { nombre: 'Ana editada', telefono: '222', fotoUrl: 'foto-sintetica', descripcion: 'Perfil' } },
      { path: '/admin/usuarios/u1/roles/PERSONAL/sedes', body: { salonIds: ['s1'] } },
      { path: '/admin/usuarios/u1/roles/INSTRUCTOR/sedes', body: { salonIds: ['s1', 's2'] } },
      { path: '/admin/usuarios/u1/especialidades', body: { tipoActividadIds: ['a1', 'a2'] } },
    ]);
  });
});
