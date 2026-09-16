import { StrictMode } from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, test, vi } from 'vitest';
import { api, deferred, ignoreReadAbort, outcome, seedSession, server, sessionTests, user } from '../../tests/support/session';
import { useAuthStore } from '../auth/authStore';
import { usePermisos } from '../auth/usePermisos';
import { RutaProtegida } from '../auth/RutaProtegida';
import { RutaPublica } from '../auth/RutaPublica';
import { RutaConRol } from '../auth/RutaConRol';
import { apiClient, getToken } from '../api/client';
import * as usuarios from '../api/usuarios';
import * as authApi from '../api/auth';
import { Header } from '../components/Header';
import { renderWithTheme } from '../components/test-support/renderWithTheme';
import { InvitacionAceptar } from './InvitacionAceptar';
import { Login } from './Login';
import { Perfil } from './Perfil';

sessionTests();
const credentials = { correo: 'ana@example.invalid', contrasena: 'prueba-segura' };

function renderSession(path = '/login') {
  return renderWithTheme(<MemoryRouter initialEntries={[path]}>
    <Header sidebarAbierto onToggleSidebar={() => undefined} />
    <Routes>
      <Route element={<RutaPublica />}><Route path="/login" element={<Login />} /></Route>
      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Perfil />} />
        <Route element={<RutaConRol rolesPermitidos={['ADMIN']} />}><Route path="/administracion" element={<h1>Administración privada</h1>} /></Route>
      </Route>
      <Route path="/invitacion/:token" element={<InvitacionAceptar />} />
    </Routes>
  </MemoryRouter>);
}

async function enterLogin() {
  const actor = userEvent.setup();
  await actor.type(screen.getByRole('textbox', { name: 'Correo' }), credentials.correo);
  await actor.type(screen.getByLabelText(/^Contraseña/), credentials.contrasena);
  await actor.click(screen.getByRole('button', { name: 'Ingresar' }));
  return actor;
}

async function enterInvitation() {
  const actor = userEvent.setup();
  await actor.type(screen.getByLabelText(/^Contraseña/), credentials.contrasena);
  await actor.type(screen.getByLabelText(/^Confirmar contraseña/), credentials.contrasena);
  await actor.click(screen.getByRole('button', { name: 'Activar cuenta' }));
}

test('login normal conserva campos al fallar y luego carga perfil y logout', async () => {
  let fail = true;
  server.use(
    http.post(`${api}/auth/login`, async ({ request }) => {
      expect(await request.json()).toEqual(credentials);
      return fail ? HttpResponse.json({ message: 'Correo o contraseña incorrectos.' }, { status: 401 }) : HttpResponse.json({ token: 'sesion-normal', tipo: 'Bearer' });
    }),
    http.get(`${api}/usuarios/me`, () => HttpResponse.json(user())),
  );
  renderSession();
  const actor = await enterLogin();
  expect((await screen.findByRole('alert')).textContent).toContain('Correo o contraseña incorrectos.');
  expect((screen.getByRole('textbox', { name: 'Correo' }) as HTMLInputElement).value).toBe(credentials.correo);
  expect((screen.getByLabelText(/^Contraseña/) as HTMLInputElement).value).toBe(credentials.contrasena);
  fail = false;
  await actor.click(screen.getByRole('button', { name: 'Ingresar' }));
  expect((await screen.findByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('Ana Prueba');
  expect(getToken()).toBe('sesion-normal');
  await actor.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  expect(getToken()).toBeNull();
});

test.each([200, 500])('login tardío %s después de logout no navega ni muestra error obsoleto', async status => {
  const entered = deferred<void>(); const release = deferred<void>();
  const original = useAuthStore.getState().login;
  let completion!: ReturnType<typeof outcome<void>>;
  vi.spyOn(useAuthStore.getState(), 'login').mockImplementation(request => {
    const result = original(request); completion = outcome(result); return result;
  });
  server.use(http.post(`${api}/auth/login`, async () => {
    entered.resolve(); await release.promise;
    return HttpResponse.json(status === 200 ? { token: 'obsoleto', tipo: 'Bearer' } : { message: 'Error obsoleto' }, { status });
  }));
  renderSession(); await enterLogin(); await entered.promise;
  act(() => useAuthStore.getState().logout());
  await act(async () => { release.resolve(); await completion; });
  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(getToken()).toBeNull();
  expect((screen.getByRole('button', { name: 'Ingresar' }) as HTMLButtonElement).disabled).toBe(false);
});

test('401 actual invalida ruta protegida, Header y permisos con componentes originales', async () => {
  seedSession('A');
  useAuthStore.setState({ usuario: user({ permisos: ['administrar'] }) });
  server.use(http.get(`${api}/rechazada`, () => HttpResponse.json({ message: 'Expirada' }, { status: 401 })));
  renderSession('/administracion');
  expect(screen.getByRole('heading', { name: 'Administración privada' })).toBeTruthy();
  await act(async () => { await outcome(apiClient.get('/rechazada')); });
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Administración privada' })).toBeNull();
  expect(useAuthStore.getState().usuario).toBeNull();
  expect(getToken()).toBeNull();
});

test('reemplazar ADMIN por CLIENTE retira ruta y comandos sin cambiar reglas de rol', async () => {
  seedSession('A'); useAuthStore.setState({ usuario: user() });
  renderSession('/administracion');
  await act(async () => {
    useAuthStore.getState().logout();
    seedSession('B'); useAuthStore.setState({ usuario: user({ id: 'B', nombre: 'Beatriz', roles: ['CLIENTE'], permisos: [] }) });
  });
  expect((await screen.findByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('Beatriz');
  const actor = userEvent.setup();
  await actor.click(screen.getByRole('combobox'));
  expect(await screen.findByRole('option', { name: 'Mi perfil' })).toBeTruthy();
  expect(screen.queryByRole('option', { name: 'Usuarios' })).toBeNull();
});

test('invitación normal usa acción del store y DTO original antes del perfil', async () => {
  server.use(
    http.get(`${api}/auth/invitaciones/entrada`, () => HttpResponse.json({ nombre: 'Ana', correo: credentials.correo })),
    http.post(`${api}/auth/invitaciones/completar`, async ({ request }) => {
      expect(await request.json()).toEqual({ token: 'entrada', contrasena: credentials.contrasena });
      return HttpResponse.json({ token: 'invitacion-normal', tipo: 'Bearer' });
    }),
    http.get(`${api}/usuarios/me`, ({ request }) => {
      expect(request.headers.get('authorization')).toBe('Bearer invitacion-normal');
      return HttpResponse.json(user());
    }),
  );
  renderSession('/invitacion/entrada');
  await screen.findByRole('heading', { name: 'Bienvenido, Ana' });
  await enterInvitation();
  expect((await screen.findByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('Ana Prueba');
});

test('invitación pendiente no persiste ni navega después de logout', async () => {
  const entered = deferred<void>(); const release = deferred<void>();
  const original = useAuthStore.getState().completarInvitacion;
  let completion!: ReturnType<typeof outcome<void>>;
  vi.spyOn(useAuthStore.getState(), 'completarInvitacion').mockImplementation(request => {
    const promise = original(request); completion = outcome(promise); return promise;
  });
  server.use(
    http.get(`${api}/auth/invitaciones/entrada`, () => HttpResponse.json({ nombre: 'Ana', correo: credentials.correo })),
    http.post(`${api}/auth/invitaciones/completar`, async () => {
      entered.resolve(); await release.promise;
      return HttpResponse.json({ token: 'obsoleto', tipo: 'Bearer' });
    }),
  );
  renderSession('/invitacion/entrada'); await screen.findByRole('heading', { name: 'Bienvenido, Ana' });
  await enterInvitation(); await entered.promise;
  act(() => useAuthStore.getState().logout());
  await act(async () => { release.resolve(); await completion; });
  expect(screen.getByRole('heading', { name: 'Bienvenido, Ana' })).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Activar cuenta' }) as HTMLButtonElement).disabled).toBe(false);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(getToken()).toBeNull();
});

function InvitationNavigation() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate('/invitacion/B')}>Abrir invitación B</button>
    <Routes><Route path="/invitacion/:token" element={<InvitacionAceptar />} /></Routes></>;
}

test('info de invitación anterior no reemplaza B montada con cleanup de StrictMode', async () => {
  const entered = deferred<void>(); const release = deferred<void>();
  const original = authApi.obtenerInvitacion;
  const completions: ReturnType<typeof outcome<unknown>>[] = [];
  vi.spyOn(authApi, 'obtenerInvitacion').mockImplementation(token => {
    const promise = original(token);
    if (token === 'A') completions.push(outcome(promise));
    return promise;
  });
  server.use(
    http.get(`${api}/auth/invitaciones/A`, async () => {
      entered.resolve(); await release.promise;
      return HttpResponse.json({ nombre: 'Antigua', correo: credentials.correo });
    }),
    http.get(`${api}/auth/invitaciones/B`, () => HttpResponse.json({ nombre: 'Beatriz', correo: credentials.correo })),
  );
  const render = renderWithTheme(<StrictMode><MemoryRouter initialEntries={['/invitacion/A']}><InvitationNavigation /></MemoryRouter></StrictMode>);
  await entered.promise;
  await userEvent.setup().click(screen.getByRole('button', { name: 'Abrir invitación B' }));
  expect(await screen.findByRole('heading', { name: 'Bienvenido, Beatriz' })).toBeTruthy();
  await act(async () => { release.resolve(); await Promise.all(completions); });
  expect(screen.getByRole('heading', { name: 'Bienvenido, Beatriz' })).toBeTruthy();
  expect(completions.length).toBeGreaterThanOrEqual(1);
  render.unmount();
  expect(screen.queryByRole('heading', { name: 'Bienvenido, Antigua' })).toBeNull();
});

test.each([200, 500])('PUT tardío %s de A no refresca B ni aplica toast/error/finally o borrador', async status => {
  seedSession('mismo-token'); useAuthStore.setState({ usuario: user({ nombre: 'Ana' }) });
  const entered = deferred<void>(); const release = deferred<void>();
  const original = usuarios.actualizarMiPerfil;
  let completion!: ReturnType<typeof outcome<unknown>>;
  vi.spyOn(usuarios, 'actualizarMiPerfil').mockImplementation(request => {
    const promise = original(request); completion = outcome(promise); return promise;
  });
  const refresh = vi.spyOn(useAuthStore.getState(), 'refrescarPerfil');
  server.use(http.post(`${api}/auth/login`, () => HttpResponse.json({ token: 'mismo-token', tipo: 'Bearer' })),
    http.get(`${api}/usuarios/me`, () => HttpResponse.json(user({ id: 'B', nombre: 'Beatriz' }))),
    http.put(`${api}/usuarios/me`, async ({ request }) => {
    expect(await request.json()).toEqual({ nombre: 'Borrador A', telefono: '', descripcion: '' });
    expect(request.headers.get('authorization')).toBe('Bearer mismo-token');
    entered.resolve(); await release.promise;
    return HttpResponse.json(status === 200 ? user() : { message: 'Error A' }, { status });
  }));
  renderWithTheme(<Perfil />);
  const actor = userEvent.setup();
  await actor.clear(screen.getByRole('textbox', { name: 'Nombre' }));
  await actor.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Borrador A');
  await actor.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await entered.promise;
  await act(async () => { await useAuthStore.getState().login(credentials); });
  expect(refresh).toHaveBeenCalledTimes(1);
  refresh.mockClear();
  expect((screen.getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('Beatriz');
  await actor.type(screen.getByRole('textbox', { name: 'Nombre' }), ' nueva');
  await act(async () => { release.resolve(); await completion; });
  expect(refresh).not.toHaveBeenCalled();
  expect(screen.queryByText('Perfil actualizado')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  expect((screen.getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('Beatriz nueva');
  expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(false);
});

test('guardado normal refresca perfil sin borrar borrador por lectura de la misma sesión', async () => {
  seedSession('A'); useAuthStore.setState({ usuario: user() });
  server.use(
    http.put(`${api}/usuarios/me`, () => HttpResponse.json(user())),
    http.get(`${api}/usuarios/me`, () => HttpResponse.json(user({ nombre: 'Respuesta servidor' }))),
  );
  renderWithTheme(<Perfil />);
  const actor = userEvent.setup();
  await actor.clear(screen.getByRole('textbox', { name: 'Nombre' }));
  await actor.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Mi borrador');
  await actor.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByText('Perfil actualizado')).toBeTruthy();
  expect((screen.getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('Mi borrador');
});

test('logout durante refresh posterior al PUT descarta perfil y éxito aunque abort sea ignorado', async () => {
  ignoreReadAbort();
  seedSession('A'); useAuthStore.setState({ usuario: user() });
  const entered = deferred<void>(); const release = deferred<void>();
  const original = useAuthStore.getState().refrescarPerfil;
  let completion!: ReturnType<typeof outcome<void>>;
  vi.spyOn(useAuthStore.getState(), 'refrescarPerfil').mockImplementation(() => {
    const promise = original(); completion = outcome(promise); return promise;
  });
  server.use(
    http.put(`${api}/usuarios/me`, () => HttpResponse.json(user())),
    http.get(`${api}/usuarios/me`, async () => {
      entered.resolve(); await release.promise; return HttpResponse.json(user());
    }),
  );
  renderWithTheme(<Perfil />);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await entered.promise;
  act(() => useAuthStore.getState().logout());
  await act(async () => { release.resolve(); await completion; });
  expect(useAuthStore.getState().usuario).toBeNull();
  expect(screen.queryByText('Perfil actualizado')).toBeNull();
});

function GrantProbe() {
  const { tiene } = usePermisos();
  return <p>{tiene('administrar') ? 'Permiso administrativo' : 'Sin permiso administrativo'}</p>;
}

test('401 del catálogo es terminal y no inicia una cascada de cargas anónimas', async () => {
  seedSession('A'); useAuthStore.setState({ usuario: user({ permisos: ['administrar'] }) });
  let calls = 0;
  server.use(http.get(`${api}/permisos`, () => { calls++; return HttpResponse.json({}, { status: 401 }); }));
  renderWithTheme(<GrantProbe />);
  await waitFor(() => expect(useAuthStore.getState().usuario).toBeNull());
  expect(screen.getByText('Sin permiso administrativo')).toBeTruthy();
  expect(calls).toBe(1);
  expect(getToken()).toBeNull();
});
