import { AxiosError, isAxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { expect, test, vi } from 'vitest';
import { api, deferred, outcome, server, sessionTests, seedSession, user } from '../../tests/support/session';
import { useAuthStore } from '../auth/authStore';
import { completarInvitacion, login, obtenerInvitacion } from './auth';
import { apiClient, configureSessionBoundary, getToken } from './client';

sessionTests();

function seed(token = 'sesion-A') {
  seedSession(token);
  useAuthStore.setState({ usuario: user({ permisos: ['editar'] }) });
}

test('captura el Bearer exacto al invocar Axios antes de reemplazar la sesión', async () => {
  seed();
  const entered = deferred<string | null>();
  server.use(http.get(`${api}/captura`, ({ request }) => {
    entered.resolve(request.headers.get('authorization'));
    expect(request.headers.get('session')).toBeNull();
    return HttpResponse.json({ ok: true });
  }));
  const response = apiClient.get('/captura');
  seedSession('sesion-B');
  expect(await entered.promise).toBe('Bearer sesion-A');
  await response;
  expect(getToken()).toBe('sesion-B');
});

test('sin token no inventa Authorization ni expira otra identidad por 401', async () => {
  const entered = deferred<void>();
  const release = deferred<void>();
  server.use(http.get(`${api}/anonimo`, async ({ request }) => {
    expect(request.headers.get('authorization')).toBeNull();
    entered.resolve();
    await release.promise;
    return HttpResponse.json({ message: 'Anónimo' }, { status: 401 });
  }));
  const pending = outcome(apiClient.get('/anonimo'));
  await entered.promise;
  seed('sesion-B');
  release.resolve();
  expect(isAxiosError((await pending).error)).toBe(true);
  expect(getToken()).toBe('sesion-B');
});

test.each(['token-distinto', 'sesion-A'])('un 401 antiguo no expira B, incluso con token %s', async tokenB => {
  seed();
  const entered = deferred<void>();
  const release = deferred<void>();
  const b = user({ id: 'B', permisos: ['leer'] });
  server.use(http.post(`${api}/auth/login`, () => HttpResponse.json({ token: tokenB, tipo: 'Bearer' })),
    http.get(`${api}/usuarios/me`, () => HttpResponse.json(b)), http.get(`${api}/antiguo`, async () => {
    entered.resolve(); await release.promise;
    return HttpResponse.json({ message: 'Caducó A' }, { status: 401 });
  }));
  const pending = outcome(apiClient.get('/antiguo'));
  await entered.promise;
  await useAuthStore.getState().login({ correo: 'B@example.invalid', contrasena: 'sintetica' });
  release.resolve();
  const error = (await pending).error;
  expect(isAxiosError(error)).toBe(true);
  expect(error.response.data.message).toBe('Caducó A');
  expect(error.config.url).toBe('/antiguo');
  expect(getToken()).toBe(tokenB);
  expect(useAuthStore.getState().usuario).toEqual(b);
});

test('dos 401 concurrentes avanzan una vez y limpian token, usuario y permisos', async () => {
  seed();
  const generation = useAuthStore.getState().generacion;
  const entered = deferred<void>();
  const release = deferred<void>();
  let requests = 0;
  const remove = vi.spyOn(Storage.prototype, 'removeItem');
  server.use(http.get(`${api}/caducada`, async () => {
    if (++requests === 2) entered.resolve();
    await release.promise;
    return HttpResponse.json({ message: 'Caducó' }, { status: 401 });
  }));
  const one = outcome(apiClient.get('/caducada'));
  const two = outcome(apiClient.get('/caducada'));
  await entered.promise;
  release.resolve();
  await Promise.all([one, two]);
  expect(useAuthStore.getState()).toMatchObject({ generacion: generation + 1, usuario: null, cargando: false });
  expect(getToken()).toBeNull();
  expect(remove.mock.calls.filter(([key]) => key === 'feelingpilates.token')).toHaveLength(1);
});

test('credenciales e invitaciones usan metadatos locales y conservan DTO, Bearer y sesión ante 401', async () => {
  seed('sesion-B');
  const generation = useAuthStore.getState().generacion;
  const credentials = { correo: 'ana@example.invalid', contrasena: 'prueba-segura' };
  const invitation = { token: 'invitacion', contrasena: 'prueba-segura' };
  const received: unknown[] = [];
  server.use(
    http.post(`${api}/auth/login`, async ({ request }) => {
      received.push(await request.json());
      expect(request.headers.get('authorization')).toBe('Bearer sesion-B');
      expect([...request.headers.keys()].some(key => key.includes('session'))).toBe(false);
      return HttpResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }),
    http.get(`${api}/auth/invitaciones/invitacion`, () => HttpResponse.json({ message: 'Invitación inválida' }, { status: 401 })),
    http.post(`${api}/auth/invitaciones/completar`, async ({ request }) => {
      received.push(await request.json());
      return HttpResponse.json({ message: 'Invitación inválida' }, { status: 401 });
    }),
  );
  const results = await Promise.all([login(credentials), obtenerInvitacion('invitacion'), completarInvitacion(invitation)].map(promise => outcome<unknown>(promise)));
  for (const result of results) expect(isAxiosError(result.error)).toBe(true);
  expect(received).toEqual([credentials, invitation]);
  expect(getToken()).toBe('sesion-B');
  expect(useAuthStore.getState().generacion).toBe(generation);
});

test.each([403, 500])('HTTP %s conserva la sesión y el error Axios', async status => {
  seed();
  const generation = useAuthStore.getState().generacion;
  server.use(http.get(`${api}/error`, () => HttpResponse.json({ message: 'Mensaje original' }, { status })));
  const error = (await outcome(apiClient.get('/error'))).error;
  expect(isAxiosError(error)).toBe(true);
  expect(error.response.data.message).toBe('Mensaje original');
  expect(useAuthStore.getState().generacion).toBe(generation);
  expect(getToken()).toBe('sesion-A');
});

test('un error de red conserva la sesión', async () => {
  seed();
  server.use(http.get(`${api}/red`, () => HttpResponse.error()));
  const error = (await outcome(apiClient.get('/red'))).error;
  expect(isAxiosError(error)).toBe(true);
  expect(error.response).toBeUndefined();
  expect(getToken()).toBe('sesion-A');
});

test.each(['post', 'put', 'delete'] as const)('no reintenta una escritura %s fallida', async method => {
  seed();
  let calls = 0;
  server.use(http[method](`${api}/escritura`, () => {
    calls++; return HttpResponse.json({ message: 'Escritura rechazada' }, { status: 401 });
  }));
  const error = (await outcome(apiClient.request({ method, url: '/escritura', data: { nombre: 'Original' } }))).error;
  expect(error.config.method).toBe(method);
  expect(calls).toBe(1);
  expect(getToken()).toBeNull();
});

test('la señal sólo expone identidad/estado y rechaza el mismo error aunque el callback falle', async () => {
  seed();
  const signal = vi.fn((_identity: { generation: number; status: 401 }) => { throw new Error('Fallo del consumidor'); });
  configureSessionBoundary({ capture: () => ({ generation: 123, token: getToken() }), unauthorized: signal });
  let original!: AxiosError;
  const pending = apiClient.get('/adaptador', { adapter: async config => {
    original = new AxiosError('Original', 'ERR_BAD_REQUEST', config, undefined, {
      status: 401, statusText: 'Unauthorized', data: { message: 'Original' }, headers: {}, config,
    });
    throw original;
  } });
  expect((await outcome(pending)).error).toBe(original);
  expect(signal).toHaveBeenCalledExactlyOnceWith({ generation: 123, status: 401 });
  expect(Object.isFrozen(signal.mock.calls[0]?.[0])).toBe(true);
});

test('sin metadatos del request no expira la sesión y reemplazar la composición no duplica callbacks', async () => {
  seed();
  const first = vi.fn();
  const second = vi.fn();
  const capture = () => ({ generation: useAuthStore.getState().generacion, token: getToken() });
  configureSessionBoundary({ capture, unauthorized: first });
  configureSessionBoundary({ capture, unauthorized: second });
  const missing = new AxiosError('Sin identidad', undefined, undefined, undefined, {
    status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: {} as never,
  });
  expect((await outcome(apiClient.get('/sin-identidad', { adapter: async () => { throw missing; } }))).error).toBe(missing);
  expect(second).not.toHaveBeenCalled();
  server.use(http.get(`${api}/una`, () => HttpResponse.json({}, { status: 401 })));
  await outcome(apiClient.get('/una'));
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
  expect(getToken()).toBe('sesion-A');
});
