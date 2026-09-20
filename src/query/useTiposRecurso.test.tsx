import { QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as catalogos from '../api/catalogos';
import { useAuthStore } from '../auth/authStore';
import { crearRuntimeQuery } from './queryClient';
import { claveTiposRecurso, opcionesTiposRecurso, useTiposRecurso } from './useTiposRecurso';
import { ErrorContratoTiposRecurso } from '../api/tiposRecurso.schema';
import { api, deferred, outcome, seedSession, server, sessionTests, user } from '../../tests/support/session';

sessionTests();
beforeEach(() => useAuthStore.setState({ usuario: user(), cargando: false }));
const runtimes: ReturnType<typeof crearRuntimeQuery>[] = [];
const holds: ReturnType<typeof deferred<Response>>[] = [];
const cleanups: (() => void)[] = [];
function heldResponse() { const hold = deferred<Response>(); holds.push(hold); return hold; }
function heldVoid() { const hold = deferred<void>(); cleanups.push(() => hold.resolve()); return hold; }
const dato = (id: string) => [{ id, nombre: id, descripcion: null, activo: false }];
function mount(abierto = true) {
  const runtime = crearRuntimeQuery();
  runtimes.push(runtime);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={runtime.client}>{children}</QueryClientProvider>;
  return { runtime, wrapper, hook: renderHook(({ open }) => useTiposRecurso(open), { wrapper, initialProps: { open: abierto } }) };
}
afterEach(() => {
  cleanup();
  for (const runtime of runtimes.splice(0)) runtime.dispose();
  for (const hold of holds.splice(0)) hold.resolve(HttpResponse.json([]));
  for (const dispose of cleanups.splice(0)) dispose();
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
});

describe('Tipos de recurso: Query real y políticas explícitas', () => {
  it('QUERY02 dos consumidores simultáneos compatibles comparten un GET', async () => {
    const hold = heldResponse();
    let requests = 0;
    server.use(http.get(`${api}/tipos-recurso`, () => { requests++; return hold.promise; }));
    const { hook, wrapper } = mount();
    const second = renderHook(() => useTiposRecurso(true), { wrapper });
    await waitFor(() => expect(requests).toBe(1));
    hold.resolve(HttpResponse.json(dato('compartido')));
    await waitFor(() => expect(hook.result.current.data).toEqual(dato('compartido')));
    await waitFor(() => expect(second.result.current.data).toEqual(dato('compartido')));
    expect(requests).toBe(1);
  });
  it('QUERY03/04 foco y reconexión no recargan; offline permite GET explícito', async () => {
    let requests = 0;
    server.use(http.get(`${api}/tipos-recurso`, () => HttpResponse.json(dato(String(++requests)))));
    onlineManager.setOnline(false);
    const { hook, runtime } = mount();
    await waitFor(() => expect(hook.result.current.data).toEqual(dato('1')));
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      onlineManager.setOnline(true);
    });
    expect(requests).toBe(1);
    expect(runtime.client.isFetching()).toBe(0);
    onlineManager.setOnline(false);
    await act(async () => { await hook.result.current.refrescar(); });
    expect(requests).toBe(2);
    await waitFor(() => expect(hook.result.current.data).toEqual(dato('2')));
  });
  it('QUERY05 falla una sola vez sin reintento automático y conserva clasificación interna', async () => {
    let requests = 0;
    server.use(http.get(`${api}/tipos-recurso`, () => { requests++; return HttpResponse.json({}, { status: 503 }); }));
    const { hook, runtime } = mount();
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(hook.result.current.error).toHaveProperty('response.status', 503);
    expect(requests).toBe(1);
    expect(runtime.client.isFetching()).toBe(0);
    expect(hook.result.current.failureCount).toBe(1);
  });
  it('un contrato inválido queda como ErrorContratoTiposRecurso', async () => {
    server.use(http.get(`${api}/tipos-recurso`, () => HttpResponse.json([{}])));
    const { hook } = mount();
    await waitFor(() => expect(hook.result.current.error).toBeInstanceOf(ErrorContratoTiposRecurso));
  });
  it.each([false, true])('QUERY08 resultado A tardío (error=%s) no reaparece después de B aunque se ignore abort', async (fallo) => {
    seedSession('A');
    useAuthStore.setState({ usuario: user(), cargando: false });
    const original = catalogos.listarTiposRecurso;
    vi.spyOn(catalogos, 'listarTiposRecurso').mockImplementation(() => original());
    const hold = heldResponse();
    const drained = heldVoid();
    let aRequests = 0, bRequests = 0;
    const requestDone = ({ request }: { request: Request }) => { if (request.headers.get('authorization') === 'Bearer A') drained.resolve(); };
    server.events.on('response:mocked', requestDone);
    cleanups.push(() => server.events.removeListener('response:mocked', requestDone));
    server.use(http.get(`${api}/tipos-recurso`, ({ request }) => {
      if (request.headers.get('authorization') === 'Bearer A') { aRequests++; return hold.promise; }
      bRequests++;
      return HttpResponse.json(dato('B'));
    }));
    const { hook, runtime } = mount();
    const aGeneration = useAuthStore.getState().capturarSesion().generation;
    await waitFor(() => expect(aRequests).toBe(1));
    act(() => { seedSession('B'); useAuthStore.setState({ usuario: user(), cargando: false }); });
    await waitFor(() => expect(hook.result.current.data).toEqual(dato('B')));
    hold.resolve(fallo ? HttpResponse.json({ privado: 'A' }, { status: 500 }) : HttpResponse.json(dato('A')));
    await drained.promise;
    await act(async () => {});
    expect(hook.result.current.data).toEqual(dato('B'));
    expect(hook.result.current.error).toBeNull();
    expect(runtime.client.getQueryData(claveTiposRecurso(aGeneration))).toBeUndefined();
    expect(bRequests).toBe(1);
    server.events.removeListener('response:mocked', requestDone);
  });
  it('un callback obsoleto no invalida ni despacha con credenciales nuevas', async () => {
    server.use(http.get(`${api}/tipos-recurso`, () => HttpResponse.json(dato('actual'))));
    const { hook, runtime } = mount();
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    const old = hook.result.current.refrescar;
    act(() => useAuthStore.getState().logout());
    expect(hook.result.current.data).toBeUndefined();
    const invalidate = vi.spyOn(runtime.client, 'invalidateQueries');
    const get = vi.spyOn(catalogos, 'listarTiposRecurso');
    await expect(old()).rejects.toHaveProperty('code', 'ERR_CANCELED');
    expect(invalidate).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });
  it('guardas independientes de cancelación rechazan datos y errores tardíos', async () => {
    const original = catalogos.listarTiposRecurso;
    vi.spyOn(catalogos, 'listarTiposRecurso').mockImplementation(() => original());
    for (const fallo of [false, true]) {
      const hold = heldResponse();
      const started = heldVoid();
      server.use(http.get(`${api}/tipos-recurso`, () => { started.resolve(); return hold.promise; }));
      const generation = useAuthStore.getState().capturarSesion().generation;
      const options = opcionesTiposRecurso(generation);
      const runtime = crearRuntimeQuery();
      runtimes.push(runtime);
      const fn = options.queryFn;
      if (typeof fn !== 'function') throw new Error('Falta función de consulta');
      const result = outcome(Promise.resolve(fn({ signal: new AbortController().signal, queryKey: options.queryKey, client: runtime.client, meta: undefined })));
      await started.promise;
      useAuthStore.getState().logout();
      hold.resolve(fallo ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json(dato('tarde')));
      expect((await result).error).toHaveProperty('code', 'ERR_CANCELED');
    }
  });
  it('la señal abortada rechaza respuesta tardía aun con generación vigente y transporte ignorando abort', async () => {
    const original = catalogos.listarTiposRecurso;
    vi.spyOn(catalogos, 'listarTiposRecurso').mockImplementation(() => original());
    const hold = heldResponse();
    const started = heldVoid();
    server.use(http.get(`${api}/tipos-recurso`, () => { started.resolve(); return hold.promise; }));
    const { runtime } = mount(false);
    const options = opcionesTiposRecurso(useAuthStore.getState().capturarSesion().generation);
    const fn = options.queryFn;
    if (typeof fn !== 'function') throw new Error('Falta función de consulta');
    const controller = new AbortController();
    const result = outcome(Promise.resolve(fn({ signal: controller.signal, queryKey: options.queryKey, client: runtime.client, meta: undefined })));
    await started.promise;
    controller.abort();
    hold.resolve(HttpResponse.json(dato('tarde')));
    expect((await result).error).toHaveProperty('code', 'ERR_CANCELED');
  });
  it('opciones capturadas obsoletas rechazan antes de despachar GET', async () => {
    const { runtime } = mount(false);
    const options = opcionesTiposRecurso(useAuthStore.getState().capturarSesion().generation);
    const fn = options.queryFn;
    if (typeof fn !== 'function') throw new Error('Falta función de consulta');
    act(() => useAuthStore.getState().logout());
    const get = vi.spyOn(catalogos, 'listarTiposRecurso');
    await expect(fn({ signal: new AbortController().signal, queryKey: options.queryKey, client: runtime.client, meta: undefined })).rejects.toHaveProperty('code', 'ERR_CANCELED');
    expect(get).not.toHaveBeenCalled();
  });
  it('cambio de sesión durante cancelación de refresco impide invalidación y GET posteriores', async () => {
    server.use(http.get(`${api}/tipos-recurso`, () => HttpResponse.json(dato('actual'))));
    const { hook, runtime } = mount();
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    const hold = heldVoid();
    vi.spyOn(runtime.client, 'cancelQueries').mockReturnValue(hold.promise);
    const invalidate = vi.spyOn(runtime.client, 'invalidateQueries');
    const get = vi.spyOn(catalogos, 'listarTiposRecurso');
    const result = outcome(hook.result.current.refrescar());
    act(() => useAuthStore.getState().logout());
    hold.resolve();
    expect((await result).error).toHaveProperty('code', 'ERR_CANCELED');
    expect(invalidate).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });
  it('QUERY07 observador montado no despacha anónimo tras logout y B listo obtiene sus datos', async () => {
    seedSession('A');
    useAuthStore.setState({ usuario: user(), cargando: false });
    const headers: (string | null)[] = [];
    server.use(http.get(`${api}/tipos-recurso`, ({ request }) => {
      headers.push(request.headers.get('authorization'));
      return HttpResponse.json(dato(headers.at(-1) === 'Bearer A' ? 'A' : 'B'));
    }));
    const { hook } = mount();
    await waitFor(() => expect(hook.result.current.data).toEqual(dato('A')));
    await act(async () => useAuthStore.getState().logout());
    expect(hook.result.current.data).toBeUndefined();
    expect(headers).toEqual(['Bearer A']);
    act(() => { seedSession('B'); useAuthStore.setState({ usuario: user(), cargando: false }); });
    await waitFor(() => expect(hook.result.current.data).toEqual(dato('B')));
    expect(headers).toEqual(['Bearer A', 'Bearer B']);
  });
});
