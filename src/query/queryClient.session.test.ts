import { afterEach, describe, expect, it, vi } from 'vitest';
import { crearRuntimeQuery, politicaQuery } from './queryClient';
import { claveTiposRecurso } from './useTiposRecurso';
import { useAuthStore } from '../auth/authStore';
import { setToken } from '../api/client';
import { deferred, outcome, sessionTests } from '../../tests/support/session';

sessionTests();
const runtimes: ReturnType<typeof crearRuntimeQuery>[] = [];
const cleanups: (() => void)[] = [];
const runtime = () => { const value = crearRuntimeQuery(); runtimes.push(value); return value; };
afterEach(() => {
  for (const value of runtimes.splice(0)) value.dispose();
  for (const dispose of cleanups.splice(0)) dispose();
});

describe('Runtime Query ligado a generación autoritativa', () => {
  it('QUERY06 claves contienen únicamente recurso y generación numérica', () => {
    setToken('TOKEN_PRIVADO');
    const key = claveTiposRecurso(useAuthStore.getState().capturarSesion().generation);
    expect(key).toEqual(['catalogos', 'tipos-recurso', expect.any(Number)]);
    expect(JSON.stringify(key)).not.toContain('TOKEN_PRIVADO');
    expect(runtime().client.getDefaultOptions().queries).toEqual(politicaQuery);
  });
  it('QUERY07 logout y expiración borran caché sin esperar cancelación', async () => {
    const { client } = runtime();
    const hold = deferred<void>();
    cleanups.push(() => hold.resolve());
    const cancel = vi.spyOn(client, 'cancelQueries').mockReturnValue(hold.promise);
    const a = useAuthStore.getState().capturarSesion().generation;
    client.setQueryData(claveTiposRecurso(a), [{ id: 'A' }]);
    useAuthStore.getState().logout();
    expect(cancel).toHaveBeenCalledOnce();
    expect(client.getQueryCache().getAll()).toEqual([]);
    const b = useAuthStore.getState().capturarSesion().generation;
    client.setQueryData(claveTiposRecurso(b), [{ id: 'B' }]);
    useAuthStore.getState().expirar({ generation: b, status: 401 });
    expect(client.getQueryCache().getAll()).toEqual([]);
    hold.resolve();
    await hold.promise;
  });
  it('la cancelación aborta antes de limpiar y una transición reentrante conserva el nuevo dueño', async () => {
    const { client } = runtime();
    const hold = deferred<string>();
    const entered = deferred<void>();
    cleanups.push(() => { hold.resolve('limpieza'); entered.resolve(); });
    const read = outcome(client.fetchQuery({ queryKey: ['anterior'], queryFn: ({ signal }) => {
      signal.addEventListener('abort', () => {
        expect(client.getQueryCache().find({ queryKey: ['anterior'] })).toBeDefined();
        useAuthStore.getState().logout();
        const actual = useAuthStore.getState().capturarSesion().generation;
        client.setQueryData(claveTiposRecurso(actual), 'nuevo dueño');
      }, { once: true });
      entered.resolve();
      return hold.promise;
    } }));
    await entered.promise;
    useAuthStore.getState().logout();
    const actual = useAuthStore.getState().capturarSesion().generation;
    expect(client.getQueryData(claveTiposRecurso(actual))).toBe('nuevo dueño');
    hold.resolve('tarde');
    await read;
  });
  it('dispose retira suscripción, cancela lecturas y vacía el cliente propio', () => {
    const value = runtime();
    value.client.setQueryData(['propia'], 'dato');
    value.dispose();
    expect(value.client.getQueryCache().getAll()).toEqual([]);
    const cancel = vi.spyOn(value.client, 'cancelQueries');
    useAuthStore.getState().logout();
    expect(cancel).not.toHaveBeenCalled();
  });
});
