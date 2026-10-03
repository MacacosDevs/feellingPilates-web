import { isCancel } from 'axios';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import { api, deferred, ignoreReadAbort, outcome, server, sessionTests, seedSession } from '../../tests/support/session';
import { useAuthStore } from './authStore';
import { usePermisoCatalogoStore } from './permisoCatalogoStore';

sessionTests();
const catalog = () => usePermisoCatalogoStore.getState();

test('deduplica catálogo de la misma sesión y conserva descripción o código', async () => {
  const entered = deferred<void>(); const release = deferred<void>();
  let calls = 0;
  server.use(http.get(`${api}/permisos`, async () => {
    calls++; entered.resolve(); await release.promise;
    return HttpResponse.json([{ codigo: 'leer', descripcion: 'Leer agenda', categoria: 'TEST' }, { codigo: 'editar', descripcion: null, categoria: 'TEST' }]);
  }));
  const one = catalog().cargar(); const two = catalog().cargar();
  expect(one).toBe(two);
  await entered.promise;
  expect(catalog().cargando).toBe(true);
  release.resolve(); await one;
  expect(catalog()).toMatchObject({ cargando: false, descripciones: { leer: 'Leer agenda', editar: 'editar' } });
  await catalog().cargar();
  expect(calls).toBe(1);
});

test.each([200, 500])('catálogo A %s no sobrescribe ni libera la carga B aunque abort sea ignorado', async status => {
  const spies = ignoreReadAbort();
  seedSession('A');
  const enteredA = deferred<void>(); const releaseA = deferred<void>();
  const enteredB = deferred<void>(); const releaseB = deferred<void>();
  let calls = 0;
  server.use(http.get(`${api}/permisos`, async ({ request }) => {
    const a = ++calls === 1;
    expect(request.headers.get('authorization')).toBe(a ? 'Bearer A' : 'Bearer B');
    (a ? enteredA : enteredB).resolve(); await (a ? releaseA : releaseB).promise;
    return HttpResponse.json(a && status === 500 ? { message: 'Antiguo' } : [{ codigo: 'leer', descripcion: a ? 'Descripción A' : 'Descripción B', categoria: 'TEST' }], { status: a ? status : 200 });
  }));
  const old = outcome(catalog().cargar());
  await enteredA.promise;
  const signal = spies.catalog.mock.calls[0]?.[0];
  seedSession('B');
  expect(signal?.aborted).toBe(true);
  expect(catalog().descripciones).toEqual({});
  const current = catalog().cargar();
  await enteredB.promise;
  releaseA.resolve();
  expect(isCancel((await old).error)).toBe(true);
  expect(catalog()).toMatchObject({ cargando: true, descripciones: {} });
  expect(catalog().cargar()).toBe(current);
  releaseB.resolve(); await current;
  expect(catalog()).toMatchObject({ cargando: false, descripciones: { leer: 'Descripción B' } });
});

test('logout invalida catálogo pendiente y una generación obsoleta no dispara red', async () => {
  ignoreReadAbort();
  const generation = useAuthStore.getState().generacion;
  const entered = deferred<void>(); const release = deferred<void>();
  server.use(http.get(`${api}/permisos`, async () => {
    entered.resolve(); await release.promise;
    return HttpResponse.json([{ codigo: 'leer', descripcion: 'Antigua', categoria: 'TEST' }]);
  }));
  const pending = outcome(catalog().cargar());
  await entered.promise;
  useAuthStore.getState().logout();
  expect(isCancel((await outcome(catalog().cargar(generation))).error)).toBe(true);
  release.resolve();
  expect(isCancel((await pending).error)).toBe(true);
  expect(catalog()).toMatchObject({ descripciones: {}, cargando: false });
});
