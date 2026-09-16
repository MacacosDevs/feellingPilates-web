import { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import { api, deferred, server, sessionTests, seedSession, user } from '../../tests/support/session';
import { useAuthStore } from './authStore';
import { usePermisoCatalogoStore } from './permisoCatalogoStore';
import { usePermisos } from './usePermisos';

sessionTests();

test('sin usuario el fallback es estable, readonly y congelado en StrictMode', () => {
  const { result, rerender } = renderHook(() => usePermisos(), { wrapper: StrictMode });
  const empty = result.current.permisos;
  expect(Object.isFrozen(empty)).toBe(true);
  expect(empty).toEqual([]);
  rerender();
  expect(result.current.permisos).toBe(empty);
  expect(result.current.tiene('administrar')).toBe(false);
});

test('helpers sin token mantienen permisos y metadatos no conceden permisos', async () => {
  useAuthStore.setState({ usuario: user({ permisos: ['leer'] }) });
  const entered = deferred<void>(); const release = deferred<void>();
  let calls = 0;
  server.use(http.get(`${api}/permisos`, async () => {
    calls++; entered.resolve(); await release.promise;
    return HttpResponse.json([{ codigo: 'administrar', descripcion: 'Administrar todo', categoria: 'TEST' }]);
  }));
  const one = renderHook(() => usePermisos());
  const two = renderHook(() => usePermisos());
  await entered.promise;
  await act(async () => { release.resolve(); });
  await waitFor(() => expect(one.result.current.mensajeSinPermiso('administrar')).toBe('No tienes permiso: Administrar todo.'));
  expect(calls).toBe(1);
  expect(one.result.current.tiene('leer')).toBe(true);
  expect(two.result.current.tiene('administrar')).toBe(false);
  expect(one.result.current.mensajeSinPermiso(['desconocido', 'leer'])).toBe('No tienes permiso: desconocido.');
  act(() => useAuthStore.getState().logout());
  expect(one.result.current.permisos).toEqual([]);
  expect(one.result.current.tiene('leer')).toBe(false);
  expect(usePermisoCatalogoStore.getState().descripciones).toEqual({});
});

test.each([403, 500])('fallo opcional del catálogo %s se maneja con descripción por código y mantiene grants', async status => {
  seedSession('A');
  useAuthStore.setState({ usuario: user({ permisos: ['leer'] }) });
  const entered = deferred<void>(); const release = deferred<void>();
  server.use(http.get(`${api}/permisos`, async () => {
    entered.resolve(); await release.promise;
    return HttpResponse.json({ message: 'Catálogo no disponible' }, { status });
  }));
  const { result } = renderHook(() => usePermisos());
  await entered.promise;
  await act(async () => { release.resolve(); });
  await waitFor(() => expect(usePermisoCatalogoStore.getState().cargando).toBe(false));
  expect(result.current.tiene('leer')).toBe(true);
  expect(result.current.mensajeSinPermiso('editar')).toBe('No tienes permiso: editar.');
});

test('reemplazo por B aísla permisos y logout no repite catálogo anónimo', async () => {
  let calls = 0;
  server.use(http.get(`${api}/permisos`, () => { calls++; return HttpResponse.json([]); }));
  seedSession('mismo-token');
  useAuthStore.setState({ usuario: user({ permisos: ['administrar'] }) });
  const { result } = renderHook(() => usePermisos());
  await waitFor(() => expect(usePermisoCatalogoStore.getState().cargando).toBe(false));
  act(() => {
    seedSession('mismo-token');
    useAuthStore.setState({ usuario: user({ id: 'B', permisos: ['leer'] }) });
  });
  await waitFor(() => expect(usePermisoCatalogoStore.getState().cargando).toBe(false));
  expect(result.current.tiene('administrar')).toBe(false);
  expect(result.current.tiene('leer')).toBe(true);
  expect(calls).toBe(2);
  act(() => useAuthStore.getState().logout());
  expect(calls).toBe(2);
  expect(result.current.permisos).toEqual([]);
});
