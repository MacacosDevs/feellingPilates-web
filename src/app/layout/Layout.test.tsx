import { useEffect } from 'react';
import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { user } from '../../../tests/fixtures/regression';
import { useAuthStore } from '../../auth/authStore';
import { renderWithTheme } from '../../components/test-support/renderWithTheme';
import { Layout } from './Layout';

const originalAuth = useAuthStore.getState();
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
let mediaOwned = false;
beforeEach(() => {
  useAuthStore.getState().logout();
  useAuthStore.setState({ cargando: false });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Zustand merge copies the owned spy into newer state objects; restore that state too.
  useAuthStore.setState({ logout: originalAuth.logout });
  originalAuth.logout();
  useAuthStore.setState({ cargando: originalAuth.cargando });
  expect(useAuthStore.getState().logout).toBe(originalAuth.logout);
  expect(vi.isMockFunction(useAuthStore.getState().logout)).toBe(false);
  if (mediaOwned) {
    if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    else Reflect.deleteProperty(window, 'matchMedia');
    mediaOwned = false;
  }
});

function Destination({ onLocation }: { onLocation?: (path: string) => void }) {
  const { pathname } = useLocation();
  useEffect(() => { onLocation?.(pathname); }, [pathname, onLocation]);
  return <output aria-label="Destino actual">{pathname}</output>;
}

// Real shell composition; destinations are sentinels, never financial/feature pages.
function renderShell(path = '/centinela', onLocation?: (path: string) => void) {
  return renderWithTheme(<MemoryRouter initialEntries={[path]}>
    <Routes><Route element={<Layout />}>
      <Route path="*" element={<Destination onLocation={onLocation} />} />
    </Route></Routes>
  </MemoryRouter>);
}
function signIn(roles: string[], permisos: string[] = []) {
  useAuthStore.setState({ usuario: user({ roles, permisos }) });
}
function destination() { return screen.getByLabelText('Destino actual').textContent; }
async function expandShell() {
  await userEvent.setup().click(screen.getByRole('button', { name: 'Abrir navegación' }));
}
function primary(name: string) {
  return within(screen.getByRole('navigation')).getByRole('button', { name });
}
function disclosure(name: string) {
  const action = primary(name);
  // Locate the other group action by behavior/role, without asserting its old nested markup.
  const controls = within(action.parentElement!).getAllByRole('button');
  return controls.find(control => control !== action)!;
}
function visibleEntries() {
  const nav = within(screen.getByRole('navigation'));
  return [...nav.queryAllByRole('link'), ...nav.queryAllByRole('button')]
    .filter(control => control.textContent?.trim())
    .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
    .map(control => [control.textContent!.trim(), control.getAttribute('href')]);
}
const reservationLinks = [
  ['Agregar', '/reservas/agregar'], ['Lista de espera', '/reservas/lista-espera'],
  ['Cancelaciones', '/reservas/cancelaciones'], ['Configuraciones', '/reservas/configuraciones'],
];
const sales = [
  { permission: 'venta.registrar.vista', label: 'Nueva venta', path: '/ventas/nueva' },
  { permission: 'venta.gestion.vista', label: 'Gestión de ventas', path: '/ventas/gestion' },
  { permission: 'venta.servicios.vista', label: 'Servicios', path: '/ventas/servicios' },
];

test('usuario null retira cabecera, comandos, navegación y logout', () => {
  renderShell();
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(destination()).toBe('/centinela');
});

test.each(['CLIENTE', 'INSTRUCTOR', 'OTRO'])('%s sin permisos conserva solo perfil y su comando', async role => {
  signIn([role]); renderShell(); await expandShell();
  expect(visibleEntries()).toEqual([['Mi perfil', '/']]);
  await userEvent.setup().click(screen.getByRole('combobox'));
  expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['Mi perfil']);
});

test.each(['PERSONAL', 'ADMIN', 'SUPER_ADMIN'])('%s preserva orden, destinos y comandos de su rol', async role => {
  signIn([role], ['actividades.leer']); renderShell(); await expandShell();
  const superAdmin = role === 'SUPER_ADMIN';
  expect(visibleEntries()).toEqual([
    ['Mi perfil', '/'], ['Usuarios', superAdmin ? null : '/usuarios'],
    ...(role !== 'PERSONAL' ? [['Salones', '/salones']] : []),
    ['Actividades', '/actividades'], ['Reservas', null],
  ]);
  const actor = userEvent.setup();
  if (superAdmin) {
    await actor.click(disclosure('Usuarios'));
    expect(visibleEntries().slice(1, 4)).toEqual([
      ['Usuarios', null], ['Gestionar usuarios', '/usuarios'], ['Roles y permisos', '/roles'],
    ]);
    expect(destination()).toBe('/centinela');
  }
  await actor.click(primary('Reservas'));
  expect(destination()).toBe('/reservas/agregar');
  expect(visibleEntries().slice(-4)).toEqual(reservationLinks);
  await actor.click(screen.getByRole('combobox'));
  expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
    'Mi perfil', 'Usuarios', ...(superAdmin ? ['Roles y permisos'] : []),
  ]);
});

test.each(['CLIENTE', 'SUPER_ADMIN'])('Actividades depende del permiso literal incluso para %s', async role => {
  signIn([role]); renderShell(); await expandShell();
  expect(screen.queryByRole('link', { name: 'Actividades' })).toBeNull();
  act(() => signIn([role], ['actividades.leer']));
  expect(screen.getByRole('link', { name: 'Actividades' }).getAttribute('href')).toBe('/actividades');
  act(() => signIn([role]));
  expect(screen.queryByRole('link', { name: 'Actividades' })).toBeNull();
});

test.each(Array.from({ length: 8 }, (_, mask) => mask))('Ventas PERSONAL subset %s conserva hijos y primer destino permitido', async mask => {
  const allowed = sales.filter((_, index) => mask & (1 << index));
  signIn(['PERSONAL'], allowed.map(item => item.permission)); renderShell(); await expandShell();
  if (!allowed.length) {
    expect(screen.queryByRole('button', { name: 'Ventas' })).toBeNull();
    return;
  }
  await userEvent.setup().click(primary('Ventas'));
  expect(destination()).toBe(allowed[0].path);
  expect(visibleEntries().slice(-allowed.length)).toEqual(allowed.map(item => [item.label, item.path]));
  await userEvent.setup().click(primary('Ventas'));
  expect(destination()).toBe(allowed[0].path);
  expect(screen.getByRole('link', { name: allowed[0].label }).getAttribute('aria-current')).toBe('page');
});

test('permisos de Ventas no conceden grupo a CLIENTE', async () => {
  signIn(['CLIENTE'], sales.map(item => item.permission)); renderShell(); await expandShell();
  expect(visibleEntries()).toEqual([['Mi perfil', '/']]);
});

test.each(['ADMIN', 'SUPER_ADMIN'])('Ventas %s con todos los permisos mantiene orden completo y navegación primaria', async role => {
  signIn([role], sales.map(item => item.permission)); renderShell(); await expandShell();
  await userEvent.setup().click(primary('Ventas'));
  expect(destination()).toBe('/ventas/nueva');
  expect(visibleEntries().slice(-4)).toEqual([
    ['Ventas', null], ...sales.map(item => [item.label, item.path]),
  ]);
});

test.each([
  ['Usuarios', '/usuarios', 'Gestionar usuarios'],
  ['Reservas', '/reservas/agregar', 'Agregar'],
  ['Ventas', '/ventas/gestion', 'Gestión de ventas'],
])('%s separa navegación primaria de disclosure y conserva override al seleccionar destino actual', async (group, path, child) => {
  signIn(['SUPER_ADMIN'], ['venta.gestion.vista']); renderShell(); await expandShell();
  const actor = userEvent.setup();
  await actor.click(disclosure(group));
  expect(screen.getByRole('link', { name: child })).toBeTruthy();
  expect(destination()).toBe('/centinela');
  await actor.click(disclosure(group));
  await waitFor(() => expect(screen.queryByRole('link', { name: child })).toBeNull());
  expect(destination()).toBe('/centinela');
  await actor.click(primary(group));
  expect(destination()).toBe(path);
  expect(screen.getByRole('link', { name: child })).toBeTruthy();
  await actor.click(disclosure(group));
  await waitFor(() => expect(screen.queryByRole('link', { name: child })).toBeNull());
  expect(destination()).toBe(path);
  await actor.click(primary(group));
  expect(destination()).toBe(path);
  expect(screen.getByRole('link', { name: child })).toBeTruthy();
});

test.each([
  ['/usuarios', 'Gestionar usuarios'], ['/roles', 'Roles y permisos'],
  ['/reservas/lista-espera', 'Lista de espera'], ['/ventas/servicios', 'Servicios'],
])('ruta %s expande grupo y marca destino exacto sin marcar perfil', async (path, label) => {
  signIn(['SUPER_ADMIN'], ['venta.servicios.vista']); renderShell(path); await expandShell();
  expect(screen.getByRole('link', { name: label }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('link', { name: 'Mi perfil' }).getAttribute('aria-current')).toBeNull();
});

test('perfil utiliza coincidencia end y enlace real a raíz', async () => {
  signIn(['CLIENTE']); renderShell('/'); await expandShell();
  const profile = screen.getByRole('link', { name: 'Mi perfil' });
  expect(profile.getAttribute('href')).toBe('/');
  expect(profile.getAttribute('aria-current')).toBe('page');
});

test('Gestionar usuarios conserva end al mostrar el grupo fuera de su destino exacto', async () => {
  signIn(['SUPER_ADMIN']); renderShell('/usuarios/detalle'); await expandShell();
  await userEvent.setup().click(disclosure('Usuarios'));
  expect(screen.getByRole('link', { name: 'Gestionar usuarios' }).getAttribute('aria-current')).toBeNull();
  expect(screen.getByRole('link', { name: 'Roles y permisos' }).getAttribute('href')).toBe('/roles');
  expect(screen.getByRole('link', { name: 'Mi perfil' }).getAttribute('aria-current')).toBeNull();
});

test.each([
  ['  MI CUENTA  ', '/'], ['  RECEPCIONISTA  ', '/usuarios'], ['  PERMISO  ', '/roles'],
])('Enter alias %s conserva normalización y limpia búsqueda', async (alias, path) => {
  signIn(['SUPER_ADMIN']); renderShell();
  const actor = userEvent.setup(); const input = screen.getByRole('combobox');
  await actor.type(input, alias);
  await actor.keyboard('{Enter}');
  expect(destination()).toBe(path);
  expect((input as HTMLInputElement).value).toBe('');
});

test('seleccionar comando navega y borrar selección null no navega', async () => {
  signIn(['SUPER_ADMIN']); renderShell();
  const actor = userEvent.setup(); const input = screen.getByRole('combobox');
  await actor.click(input);
  await actor.click(screen.getByRole('option', { name: 'Usuarios' }));
  expect(destination()).toBe('/usuarios');
  await actor.click(screen.getByRole('button', { name: 'Clear' }));
  expect(destination()).toBe('/usuarios');
  expect((input as HTMLInputElement).value).toBe('');
});

test('Enter vacío y sin coincidencia conserva destino y borrador sin comandos extra', async () => {
  signIn(['CLIENTE']); renderShell();
  const actor = userEvent.setup(); const input = screen.getByRole('combobox');
  await actor.click(input); await actor.keyboard('{Enter}');
  expect(destination()).toBe('/centinela');
  await actor.type(input, 'usuarios'); await actor.keyboard('{Enter}');
  expect(destination()).toBe('/centinela');
  expect((input as HTMLInputElement).value).toBe('usuarios');
  expect(screen.queryByRole('option')).toBeNull();
});

test('logout ejecuta store una vez antes de navegar a login y retira shell', async () => {
  signIn(['SUPER_ADMIN']);
  const events: string[] = []; const realLogout = useAuthStore.getState().logout;
  const logout = vi.spyOn(useAuthStore.getState(), 'logout').mockImplementation(() => {
    events.push('logout'); realLogout();
  });
  renderShell('/centinela', path => { events.push(path); });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(logout).toHaveBeenCalledTimes(1);
  expect(events).toEqual(['/centinela', 'logout', '/login']);
  expect(destination()).toBe('/login');
  expect(useAuthStore.getState().usuario).toBeNull();
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
});

test('reemplazar SUPER_ADMIN por CLIENTE retira comandos, grupos y permisos sin alterar ubicación', async () => {
  signIn(['SUPER_ADMIN'], ['actividades.leer', ...sales.map(item => item.permission)]);
  renderShell('/roles'); await expandShell();
  expect(screen.getByRole('link', { name: 'Roles y permisos' })).toBeTruthy();
  act(() => signIn(['CLIENTE']));
  expect(visibleEntries()).toEqual([['Mi perfil', '/']]);
  expect(destination()).toBe('/roles');
  await userEvent.setup().click(screen.getByRole('combobox'));
  expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['Mi perfil']);
  act(() => useAuthStore.setState({ usuario: null }));
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
});

function liveViewport(initialWidth: number) {
  let width = initialWidth;
  const queries: { query: MediaQueryList; listeners: Set<(event: MediaQueryListEvent) => void> }[] = [];
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: (media: string) => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const query = {
      media, get matches() { return width <= Number(media.match(/max-width:\s*([\d.]+)/)?.[1] ?? 0); },
      onchange: null, addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
      addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
      dispatchEvent: () => true,
    } as MediaQueryList;
    queries.push({ query, listeners }); return query;
  } });
  mediaOwned = true;
  return (nextWidth: number) => act(() => {
    const previous = queries.map(({ query }) => query.matches); width = nextWidth;
    queries.forEach(({ query, listeners }, index) => {
      if (query.matches !== previous[index]) listeners.forEach(listener => listener({ matches: query.matches, media: query.media } as MediaQueryListEvent));
    });
  });
}

test('599/600 separa estado móvil cerrado y preferencia desktop sin duplicar navegación', async () => {
  const resize = liveViewport(1440); signIn(['ADMIN']); renderShell();
  const actor = userEvent.setup(); await expandShell();
  expect(screen.getByRole('button', { name: 'Cerrar navegación' }).getAttribute('aria-expanded')).toBe('true');
  resize(599);
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.getByRole('button', { name: 'Abrir navegación' }).getAttribute('aria-controls')).toBeNull();
  await actor.click(screen.getByRole('button', { name: 'Abrir navegación' }));
  expect(screen.getByRole('dialog', { name: 'Navegación principal' }).getAttribute('aria-modal')).toBe('true');
  resize(600);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Cerrar navegación' }).getAttribute('aria-expanded')).toBe('true');
  await actor.click(screen.getByRole('button', { name: 'Cerrar navegación' }));
  resize(599); resize(600);
  expect(screen.getByRole('button', { name: 'Abrir navegación' }).getAttribute('aria-expanded')).toBe('false');
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
});

test('móvil cierra Escape y destino actual; disclosure mantiene modal y ubicación', async () => {
  liveViewport(375); signIn(['SUPER_ADMIN']); renderShell('/usuarios');
  const actor = userEvent.setup(); await expandShell();
  const dialog = screen.getByRole('dialog', { name: 'Navegación principal' });
  await actor.click(screen.getByRole('button', { name: 'Ocultar opciones de Usuarios' }));
  expect(screen.getByRole('dialog')).toBe(dialog);
  expect(destination()).toBe('/usuarios');
  await actor.click(primary('Usuarios'));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(destination()).toBe('/usuarios');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir navegación' }));
  await expandShell(); await actor.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir navegación' }));
});

test('disclosure nativo Space/Enter mantiene ruta, conecta hijos y desactiva hijos al salir', async () => {
  liveViewport(1440); signIn(['SUPER_ADMIN']); renderShell('/roles'); await expandShell();
  const actor = userEvent.setup();
  const toggle = screen.getByRole('button', { name: 'Ocultar opciones de Usuarios' });
  expect(toggle.tagName).toBe('BUTTON');
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  const children = document.getElementById(toggle.getAttribute('aria-controls')!);
  expect(children?.contains(screen.getByRole('link', { name: 'Roles y permisos' }))).toBe(true);
  await actor.click(toggle); // Pointer reaches the native button; Space/Enter below use its actual focus.
  expect(children?.hasAttribute('inert')).toBe(true);
  expect(children?.getAttribute('aria-hidden')).toBe('true');
  expect(children?.querySelector('a')?.tabIndex).toBe(-1);
  expect(toggle.getAttribute('aria-controls')).toBeNull();
  await waitFor(() => expect(document.getElementById(children!.id)).toBeNull());
  await actor.keyboard(' ');
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(document.getElementById(toggle.getAttribute('aria-controls')!)).not.toBeNull();
  expect(destination()).toBe('/roles');
  await actor.keyboard('{Enter}');
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(toggle.getAttribute('aria-controls')).toBeNull();
  expect(destination()).toBe('/roles');
  await waitFor(() => expect(document.getElementById(children!.id)).toBeNull());
});

test('resize devuelve foco de navegación que desaparece y conserva foco de búsqueda', async () => {
  const resize = liveViewport(1440); signIn(['ADMIN']); renderShell(); await expandShell();
  const actor = userEvent.setup(); await actor.click(screen.getByRole('link', { name: 'Usuarios' }));
  resize(375);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir navegación' }));
  const search = screen.getByRole('combobox', { name: 'Buscar secciones' });
  await actor.click(search); await actor.keyboard('{Escape}');
  resize(768); resize(1440); resize(375);
  expect(document.activeElement).toBe(search);
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('rail colapsado devuelve hijo enfocado a su acción primaria sin mantener descendientes', async () => {
  liveViewport(1440); signIn(['SUPER_ADMIN']); renderShell('/roles'); await expandShell();
  const actor = userEvent.setup(); await actor.click(screen.getByRole('link', { name: 'Roles y permisos' }));
  // Header activation normally owns focus; imperative click exercises focused-child removal.
  act(() => screen.getByRole('button', { name: 'Cerrar navegación' }).click());
  expect(document.activeElement).toBe(primary('Usuarios'));
  expect(screen.queryByRole('link', { name: 'Roles y permisos' })).toBeNull();
  expect(screen.queryByRole('button', { name: /opciones de/ })).toBeNull();
});

test('invalidación y nueva sesión nunca reabren modal móvil obsoleto', async () => {
  liveViewport(375); signIn(['ADMIN']); renderShell(); await expandShell();
  expect(screen.getByRole('dialog')).toBeTruthy();
  act(() => useAuthStore.getState().logout());
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('navigation')).toBeNull();
  act(() => signIn(['ADMIN']));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('button', { name: 'Abrir navegación' }).getAttribute('aria-expanded')).toBe('false');
});

test('override de grupo y foco de búsqueda sobrevivien al cambio de modalidad tras enfocar hijo', async () => {
  const resize = liveViewport(1440); signIn(['SUPER_ADMIN']); renderShell('/roles'); await expandShell();
  const actor = userEvent.setup(); await actor.click(screen.getByRole('link', { name: 'Roles y permisos' }));
  const search = screen.getByRole('combobox'); await actor.click(search); await actor.keyboard('{Escape}');
  resize(375); resize(768);
  expect(document.activeElement).toBe(search);
  await actor.click(screen.getByRole('button', { name: 'Ocultar opciones de Usuarios' }));
  resize(375); await expandShell();
  expect(screen.getByRole('button', { name: 'Mostrar opciones de Usuarios' }).getAttribute('aria-expanded')).toBe('false');
  resize(768);
  expect(screen.getByRole('button', { name: 'Mostrar opciones de Usuarios' }).getAttribute('aria-expanded')).toBe('false');
});

test('blur genuino hacia contenido no enfocable impide robar foco al resize', async () => {
  const resize = liveViewport(1440); signIn(['ADMIN']); renderShell(); await expandShell();
  const actor = userEvent.setup(); await actor.click(screen.getByRole('link', { name: 'Usuarios' }));
  await actor.click(screen.getByLabelText('Destino actual'));
  expect(document.activeElement).toBe(document.body);
  resize(375);
  expect(document.activeElement).toBe(document.body);
  expect(screen.queryByRole('navigation')).toBeNull();
});
