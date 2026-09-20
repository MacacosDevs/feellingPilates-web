import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { actualizarPermisosRol, listarPermisos, listarRoles } from '../servicios/roles';
import { Roles } from './Roles';
import { renderWithTheme } from '../../../components/test-support/renderWithTheme';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const api = 'https://api.test.invalid/api';
afterEach(() => server.resetHandlers());

describe('contratos vigentes de roles', () => {
  it('preserva las respuestas de roles y permisos', async () => {
    const role = { id: 'r1', nombre: 'Recepción', descripcion: null, permisos: ['usuarios.ver'], editable: true };
    const permission = { codigo: 'usuarios.ver', descripcion: 'Ver usuarios', categoria: 'USUARIOS' };
    server.use(
      http.get(`${api}/admin/roles`, () => HttpResponse.json([role])),
      http.get(`${api}/admin/roles/permisos`, () => HttpResponse.json([permission])),
    );

    await expect(listarRoles()).resolves.toEqual([role]);
    await expect(listarPermisos()).resolves.toEqual([permission]);
  });

  it('envía permisos como arreglo en el payload vigente', async () => {
    let body: unknown;
    server.use(http.put(`${api}/admin/roles/r1/permisos`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ id: 'r1', nombre: 'Recepción', descripcion: null, permisos: ['usuarios.ver'], editable: true });
    }));

    await actualizarPermisosRol('r1', ['usuarios.ver']);
    expect(body).toEqual({ permisos: ['usuarios.ver'] });
  });
});

const role = { id: 'r1', nombre: 'Recepción', descripcion: null, permisos: ['usuarios.ver'], editable: true };
const locked = { ...role, id: 'r2', nombre: 'SUPER_ADMIN', editable: false };
const suppliedCode = 'usuarios.codigo.suministrado';
function loadRoles() {
  server.use(http.get(`${api}/admin/roles`, () => HttpResponse.json([role, locked])),
    http.get(`${api}/admin/roles/permisos`, () => HttpResponse.json([
      { codigo: 'usuarios.ver', descripcion: 'Ver usuarios', categoria: 'USUARIOS' },
      { codigo: suppliedCode, descripcion: 'Permiso suministrado', categoria: 'USUARIOS' },
    ])));
}
// Baseline lacks accessible switch names: select its row by the supplied semantic code.
function permissionSwitch(code: string) {
  const row = screen.getByText(code, { exact: true }).parentElement!.parentElement!;
  return within(row).getByRole('switch') as HTMLInputElement;
}
describe('Semántica de la interfaz de roles', () => {
  it('quita y agrega el código exacto, mantiene selección tras rechazo y bloquea guardar pendiente', async () => {
    loadRoles(); const bodies: unknown[] = []; let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    server.use(http.put(`${api}/admin/roles/r1/permisos`, async ({ request }) => {
      bodies.push(await request.json()); await pending;
      return HttpResponse.json({ message: 'No se guardó la selección' }, { status: 400 });
    }));
    const ui = userEvent.setup(); renderWithTheme(<Roles />); await screen.findByRole('tab', { name: 'Recepción' });
    expect(permissionSwitch('usuarios.ver').checked).toBe(true);
    expect(permissionSwitch(suppliedCode).checked).toBe(false);
    await ui.click(permissionSwitch('usuarios.ver')); await ui.click(permissionSwitch(suppliedCode));
    await ui.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(bodies).toEqual([{ permisos: [suppliedCode] }]));
    expect((screen.getByRole('button', { name: 'Guardando...' }) as HTMLButtonElement).disabled).toBe(true);
    release(); await screen.findByText('No se guardó la selección');
    expect(permissionSwitch('usuarios.ver').checked).toBe(false); expect(permissionSwitch(suppliedCode).checked).toBe(true);
    expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(false);
    expect(bodies).toHaveLength(1);
    server.use(http.put(`${api}/admin/roles/r1/permisos`, async ({ request }) => {
      bodies.push(await request.json()); return HttpResponse.json({ ...role, permisos: [suppliedCode] });
    }));
    await ui.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(bodies).toEqual([{ permisos: [suppliedCode] }, { permisos: [suppliedCode] }]));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(true));
  });
  it('el rol bloqueado no permite cambiar permisos ni editar y el editable sí permite editar', async () => {
    loadRoles(); const ui = userEvent.setup(); renderWithTheme(<Roles />); await screen.findByRole('tab', { name: 'Recepción' });
    expect(permissionSwitch('usuarios.ver').disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Editar nombre y descripción del rol' })).toBeTruthy();
    await ui.click(screen.getByRole('tab', { name: 'SUPER_ADMIN' }));
    expect(permissionSwitch('usuarios.ver').disabled).toBe(true); expect(permissionSwitch(suppliedCode).disabled).toBe(true);
    await ui.click(screen.getByText('usuarios.ver', { exact: true })); expect(permissionSwitch('usuarios.ver').checked).toBe(true);
    expect(screen.queryByRole('button', { name: 'Editar nombre y descripción del rol' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull();
  });
  it('crea y edita mediante Guardar, normaliza campos y selecciona las respuestas del servidor', async () => {
    loadRoles(); const calls: unknown[] = [];
    server.use(http.post(`${api}/admin/roles`, async ({ request }) => { calls.push({ method: 'POST', body: await request.json() }); return HttpResponse.json({ ...role, id: 'r3', nombre: 'Creado servidor', permisos: [suppliedCode] }); }),
      http.put(`${api}/admin/roles/r3`, async ({ request }) => { calls.push({ method: 'PUT', body: await request.json() }); return HttpResponse.json({ ...role, id: 'r3', nombre: 'Editado servidor', descripcion: null, permisos: [suppliedCode] }); }));
    const ui = userEvent.setup(); renderWithTheme(<Roles />); await screen.findByRole('tab', { name: 'Recepción' });
    await ui.click(screen.getByRole('button', { name: 'Nuevo rol' }));
    await ui.type(screen.getByLabelText('Nombre'), '  Nuevo  '); await ui.type(screen.getByLabelText('Descripción'), '  ');
    await ui.click(screen.getByRole('button', { name: 'Guardar' }));
    const created = await screen.findByRole('tab', { name: 'Creado servidor' }); expect(created.getAttribute('aria-selected')).toBe('true');
    expect(permissionSwitch(suppliedCode).checked).toBe(true);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await ui.click(screen.getByRole('button', { name: 'Editar nombre y descripción del rol' }));
    await ui.clear(screen.getByLabelText('Nombre')); await ui.type(screen.getByLabelText('Nombre'), '  Editado  ');
    await ui.type(screen.getByLabelText('Descripción'), '  '); await ui.click(screen.getByRole('button', { name: 'Guardar' }));
    const edited = await screen.findByRole('tab', { name: 'Editado servidor' }); expect(edited.getAttribute('aria-selected')).toBe('true');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(calls).toEqual([{ method: 'POST', body: { nombre: 'Nuevo', descripcion: null } }, { method: 'PUT', body: { nombre: 'Editado', descripcion: null } }]);
  });
});

describe('Estados de lectura y nombre accesible de roles', () => {
  it('expone fallo GET sin vacío y recupera con reintento explícito', async () => {
    let reads = 0;
    server.use(http.get(`${api}/admin/roles`, () => {
      reads++; return reads === 1 ? HttpResponse.json({ message: 'No disponible' }, { status: 503 }) : HttpResponse.json([]);
    }), http.get(`${api}/admin/roles/permisos`, () => HttpResponse.json([])));
    const ui = userEvent.setup(); renderWithTheme(<Roles />);
    await screen.findByText('No se pudieron cargar los roles y permisos.');
    expect(screen.queryByText('Aún no hay roles configurados.')).toBeNull(); expect(reads).toBe(1);
    await ui.click(screen.getByRole('button', { name: 'Reintentar' })); await screen.findByText('Aún no hay roles configurados.');
    expect(reads).toBe(2);
    await ui.click(screen.getByRole('button', { name: 'Crear primer rol' }));
    expect(screen.getByRole('dialog', { name: 'Nuevo rol' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(true);
    await ui.keyboard('{Escape}'); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
