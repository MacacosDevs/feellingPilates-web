import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { server } from '../../../../tests/mocks/server';
import { renderWithTheme } from '../../../components/test-support/renderWithTheme';
import { Usuarios } from './Usuarios';
import { useAuthStore } from '../../../auth/authStore';
import { user, pageOf } from '../../../../tests/fixtures/regression';
const api = 'https://api.test.invalid/api';
afterEach(() => useAuthStore.setState({ usuario: null, cargando: false }));
function loadUsers() {
  const queries: Record<string, string>[] = [];
  server.use(http.get(`${api}/admin/usuarios`, ({ request }) => { const query = Object.fromEntries(new URL(request.url).searchParams); queries.push(query); return HttpResponse.json(pageOf([user({ roles: ['CLIENTE'], estatus: 'activo' })], { totalElements: 60, totalPages: 6, number: Number(query.page), size: Number(query.size) })); }),
    http.get(`${api}/admin/usuarios/conteo-roles`, () => HttpResponse.json([{ rol: 'CLIENTE', total: 60 }, { rol: 'ADMIN', total: 2 }, { rol: 'PERSONAL', total: 1 }])));
  return queries;
}
describe('Permisos y consulta de usuarios', () => {
  it.each(['PERSONAL', 'ADMIN', 'SUPER_ADMIN'])('%s muestra sólo las acciones y altas actuales de su rol', async rol => {
    loadUsers(); useAuthStore.setState({ usuario: user({ roles: [rol] }), cargando: false });
    const ui = userEvent.setup(); renderWithTheme(<MemoryRouter><Usuarios /></MemoryRouter>); await screen.findByText('Ana Prueba');
    expect(screen.getByLabelText('Suspender acceso')).toBeTruthy();
    expect(Boolean(screen.queryByRole('button', { name: 'Editar usuario' }))).toBe(rol !== 'PERSONAL');
    await ui.click(screen.getByRole('button', { name: 'Nuevo usuario' }));
    expect(screen.getByRole('menuitem', { name: 'Nuevo cliente' })).toBeTruthy();
    expect(Boolean(screen.queryByRole('menuitem', { name: 'Nuevo personal' }))).toBe(rol !== 'PERSONAL');
  });
  it('conserva parámetros GET de página, tamaño, filtro, orden y búsqueda recortada', async () => {
    const queries = loadUsers(); useAuthStore.setState({ usuario: user({ roles: ['ADMIN'] }), cargando: false });
    const ui = userEvent.setup(); renderWithTheme(<MemoryRouter><Usuarios /></MemoryRouter>); await screen.findByText('Ana Prueba');
    expect(queries[0]).toEqual({ page: '0', size: '10', sort: 'nombre,desc' });
    await ui.click(screen.getByRole('button', { name: 'Go to next page' }));
    await waitFor(() => expect(queries.at(-1)).toEqual({ page: '1', size: '10', sort: 'nombre,desc' }));
    await ui.click(screen.getByRole('combobox')); await ui.click(screen.getByRole('option', { name: '25' }));
    await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '25', sort: 'nombre,desc' }));
    await ui.click(screen.getByRole('button', { name: 'Usuario' }));
    await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '25', sort: 'nombre,asc' }));
    await ui.click(screen.getByRole('button', { name: 'Teléfono' }));
    await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '25', sort: 'telefono,asc' }));
    await ui.click(screen.getByText('Admin', { exact: true }));
    await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '25', sort: 'telefono,asc', rol: 'ADMIN' }));
    await ui.type(screen.getByPlaceholderText('Buscar por nombre o correo'), '  Ana  ');
    await waitFor(() => expect(queries.at(-1)).toEqual({ page: '0', size: '25', sort: 'telefono,asc', rol: 'ADMIN', busqueda: 'Ana' }));
  });
});

describe('Lecturas y feedback veraz de usuarios', () => {
  it('distingue error GET de vacío y recupera sólo por Reintentar', async () => {
    let reads = 0;
    server.use(http.get(`${api}/admin/usuarios`, () => {
      reads++;
      return reads === 1 ? HttpResponse.json({ message: 'No disponible' }, { status: 503 }) : HttpResponse.json(pageOf([]));
    }), http.get(`${api}/admin/usuarios/conteo-roles`, () => HttpResponse.json([])));
    useAuthStore.setState({ usuario: user({ roles: ['ADMIN'] }), cargando: false });
    const ui = userEvent.setup(); renderWithTheme(<MemoryRouter><Usuarios /></MemoryRouter>);
    await screen.findByText('No se pudieron cargar los usuarios.');
    expect(screen.queryByText('No hay usuarios que coincidan con este filtro')).toBeNull();
    expect(reads).toBe(1);
    await ui.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText('No hay usuarios que coincidan con este filtro'); expect(reads).toBe(2);
    expect(screen.getByRole('textbox', { name: 'Buscar por nombre o correo' })).toBeTruthy();
  });
  it('preserva éxito PATCH si falla el GET posterior y nunca repite la escritura', async () => {
    let reads = 0, writes = 0;
    server.use(http.get(`${api}/admin/usuarios`, () => {
      reads++; return reads === 2 ? HttpResponse.json({ message: 'No disponible' }, { status: 503 }) : HttpResponse.json(pageOf([user({ roles: ['CLIENTE'], estatus: 'activo' })]));
    }), http.get(`${api}/admin/usuarios/conteo-roles`, () => HttpResponse.json([])),
    http.patch(`${api}/admin/usuarios/${user().id}/suspender`, () => { writes++; return HttpResponse.json(user({ estatus: 'suspendido' })); }));
    useAuthStore.setState({ usuario: user({ roles: ['ADMIN'] }), cargando: false });
    const ui = userEvent.setup(); renderWithTheme(<MemoryRouter><Usuarios /></MemoryRouter>);
    await screen.findByText('Ana Prueba'); await ui.click(screen.getByRole('button', { name: 'Suspender acceso' }));
    await screen.findByText('Estatus actualizado. No se pudo actualizar la lista; reintenta la carga.');
    expect(screen.queryByText('No se pudo actualizar el estatus.')).toBeNull(); expect(writes).toBe(1);
    await ui.click(screen.getByRole('button', { name: 'Reintentar' })); await screen.findByText('Ana Prueba');
    expect(writes).toBe(1); expect(reads).toBe(3);
  });
});
