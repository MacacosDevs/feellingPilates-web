import { isAxiosError, isCancel } from 'axios';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import { api, deferred, ignoreReadAbort, outcome, server, sessionTests, seedSession, user } from '../../tests/support/session';
import { apiClient, getToken, setToken } from '../api/client';
import { useAuthStore } from './authStore';

sessionTests();
const credentials = { correo: 'ana@example.invalid', contrasena: 'sintetica' };
const auth = () => useAuthStore.getState();

// These race proofs deliberately omit AbortSignal at the narrow API seam;
// the real Axios/MSW response still reaches the authoritative commit guard.
test('logout invalida perfil pendiente y su éxito tardío no restaura permisos', async () => {
  const spies = ignoreReadAbort();
  seedSession('A');
  const entered = deferred<void>();
  const release = deferred<void>();
  server.use(http.get(`${api}/usuarios/me`, async () => {
    entered.resolve(); await release.promise;
    return HttpResponse.json(user({ permisos: ['administrar'] }));
  }));
  const pending = outcome(auth().inicializar());
  await entered.promise;
  const signal = spies.profile.mock.calls[0]?.[0];
  auth().logout();
  expect(signal?.aborted).toBe(true);
  expect(auth()).toMatchObject({ usuario: null, cargando: false });
  release.resolve();
  expect(isCancel((await pending).error)).toBe(true);
  expect(getToken()).toBeNull();
  expect(auth().usuario).toBeNull();
});

test.each(['B', 'A'])('A no sobrescribe el perfil B con token %s', async tokenB => {
  ignoreReadAbort();
  seedSession('A');
  const entered = deferred<void>();
  const release = deferred<void>();
  let count = 0;
  const b = user({ id: 'B', nombre: 'Beatriz', permisos: ['leer'] });
  server.use(http.post(`${api}/auth/login`, () => HttpResponse.json({ token: tokenB, tipo: 'Bearer' })), http.get(`${api}/usuarios/me`, async () => {
    if (++count === 1) {
      entered.resolve(); await release.promise;
      return HttpResponse.json(user({ id: 'A', permisos: ['administrar'] }));
    }
    return HttpResponse.json(b);
  }));
  const old = outcome(auth().refrescarPerfil());
  await entered.promise;
  await auth().login(credentials);
  release.resolve();
  expect(isCancel((await old).error)).toBe(true);
  expect(auth().usuario).toEqual(b);
  expect(getToken()).toBe(tokenB);
});

test.each(['login', 'invitacion'] as const)('%s pendiente no adopta después de logout o sesión B', async kind => {
  for (const replacement of ['logout', 'B']) {
    auth().logout();
    const entered = deferred<void>();
    const release = deferred<void>();
    let profileCalls = 0;
    const path = kind === 'login' ? '/auth/login' : '/auth/invitaciones/completar';
    const b = user({ id: 'B', permisos: ['leer'] });
    server.use(
      http.post(`${api}${path}`, async ({ request }) => {
        if ((await request.json() as { correo?: string }).correo === 'B@example.invalid') return HttpResponse.json({ token: 'B', tipo: 'Bearer' });
        entered.resolve(); await release.promise;
        return HttpResponse.json({ token: 'A', tipo: 'Bearer' });
      }),
      http.get(`${api}/usuarios/me`, () => { profileCalls++; return HttpResponse.json(b); }),
      ...(kind === 'invitacion' ? [http.post(`${api}/auth/login`, () => HttpResponse.json({ token: 'B', tipo: 'Bearer' }))] : []),
    );
    const pending = outcome(kind === 'login' ? auth().login(credentials) : auth().completarInvitacion({ token: 'invitacion', contrasena: 'sintetica' }));
    await entered.promise;
    auth().logout();
    if (replacement === 'B') await auth().login({ ...credentials, correo: 'B@example.invalid' });
    release.resolve();
    expect(isCancel((await pending).error)).toBe(true);
    expect(profileCalls).toBe(replacement === 'B' ? 1 : 0);
    expect(getToken()).toBe(replacement === 'B' ? 'B' : null);
    expect(auth().usuario).toEqual(replacement === 'B' ? b : null);
  }
});

test.each(['B', 'A'])('el intento de login más reciente gana, token B %s, aunque A termine después', async tokenB => {
  const entered = deferred<void>();
  const release = deferred<void>();
  server.use(
    http.post(`${api}/auth/login`, async ({ request }) => {
      const body = await request.json() as typeof credentials;
      if (body.correo === 'A@example.invalid') {
        entered.resolve(); await release.promise;
        return HttpResponse.json({ token: 'A', tipo: 'Bearer' });
      }
      return HttpResponse.json({ token: tokenB, tipo: 'Bearer' });
    }),
    http.get(`${api}/usuarios/me`, ({ request }) => {
      expect(request.headers.get('authorization')).toBe(`Bearer ${tokenB}`);
      return HttpResponse.json(user({ id: 'B' }));
    }),
  );
  const old = outcome(auth().login({ ...credentials, correo: 'A@example.invalid' }));
  await entered.promise;
  await auth().login(credentials);
  const generationB = auth().generacion;
  release.resolve();
  expect(isCancel((await old).error)).toBe(true);
  expect(auth().generacion).toBe(generationB);
  expect(getToken()).toBe(tokenB);
  expect(auth().usuario?.id).toBe('B');
});

test('nuevo intento aísla permisos previos y el perfil A aunque abort sea ignorado', async () => {
  ignoreReadAbort();
  seedSession('A');
  useAuthStore.setState({ usuario: user({ permisos: ['administrar'] }) });
  const profileEntered = deferred<void>();
  const profileRelease = deferred<void>();
  const loginEntered = deferred<void>();
  const loginRelease = deferred<void>();
  server.use(
    http.get(`${api}/usuarios/me`, async () => {
      profileEntered.resolve(); await profileRelease.promise;
      return HttpResponse.json(user({ permisos: ['administrar'] }));
    }),
    http.post(`${api}/auth/login`, async () => {
      loginEntered.resolve(); await loginRelease.promise;
      return HttpResponse.json({ message: 'Credenciales incorrectas' }, { status: 401 });
    }),
  );
  const old = outcome(auth().refrescarPerfil());
  await profileEntered.promise;
  const login = outcome(auth().login(credentials));
  await loginEntered.promise;
  expect(auth().usuario).toBeNull();
  expect(auth().cargando).toBe(false);
  profileRelease.resolve();
  expect(isCancel((await old).error)).toBe(true);
  expect(auth().usuario).toBeNull();
  loginRelease.resolve();
  expect(isAxiosError((await login).error)).toBe(true);
  expect(getToken()).toBe('A');
});

test.each([200, 500])('la lectura de perfil más reciente gana frente al resultado anterior %s', async status => {
  ignoreReadAbort();
  seedSession('A');
  const entered = deferred<void>();
  const release = deferred<void>();
  let calls = 0;
  server.use(http.get(`${api}/usuarios/me`, async () => {
    if (++calls === 1) {
      entered.resolve(); await release.promise;
      return HttpResponse.json(status === 200 ? user({ nombre: 'Antiguo' }) : { message: 'Antiguo' }, { status });
    }
    return HttpResponse.json(user({ nombre: 'Más reciente', permisos: ['leer'] }));
  }));
  const old = outcome(auth().refrescarPerfil());
  await entered.promise;
  await auth().refrescarPerfil();
  release.resolve();
  expect(isCancel((await old).error)).toBe(true);
  expect(auth().usuario?.nombre).toBe('Más reciente');
});

test('finally de inicializar A no libera la carga inicial B', async () => {
  ignoreReadAbort();
  seedSession('A');
  const enteredA = deferred<void>(); const enteredB = deferred<void>();
  const releaseA = deferred<void>(); const releaseB = deferred<void>();
  let calls = 0;
  server.use(http.get(`${api}/usuarios/me`, async () => {
    const a = ++calls === 1;
    (a ? enteredA : enteredB).resolve();
    await (a ? releaseA : releaseB).promise;
    return HttpResponse.json(user({ id: a ? 'A' : 'B' }));
  }));
  const old = outcome(auth().inicializar());
  await enteredA.promise;
  seedSession('B');
  const current = auth().inicializar();
  await enteredB.promise;
  releaseA.resolve();
  expect(isCancel((await old).error)).toBe(true);
  expect(auth().cargando).toBe(true);
  releaseB.resolve(); await current;
  expect(auth()).toMatchObject({ cargando: false, usuario: { id: 'B' } });
});

test('suscriptores observan una identidad y Bearer coherentes durante adopción y logout', async () => {
  seedSession('A');
  const seen: { stateGeneration: number; generation: number; token: string | null }[] = [];
  server.use(
    http.post(`${api}/auth/login`, () => HttpResponse.json({ token: 'B', tipo: 'Bearer' })),
    http.get(`${api}/usuarios/me`, () => HttpResponse.json(user({ id: 'B' }))),
  );
  const unsubscribe = useAuthStore.subscribe(state => seen.push({ stateGeneration: state.generacion, ...state.capturarSesion() }));
  await auth().login(credentials);
  auth().logout();
  unsubscribe();
  for (const snapshot of seen) expect(snapshot.stateGeneration).toBe(snapshot.generation);
  expect(seen.map(snapshot => snapshot.token)).toEqual(['A', 'B', 'B', null]);
});

test('inicialización anónima, perfil provisional y errores no401 mantienen la política existente', async () => {
  await auth().inicializar();
  expect(auth()).toMatchObject({ usuario: null, cargando: false });
  server.use(
    http.post(`${api}/auth/login`, () => HttpResponse.json({ token: 'provisional', tipo: 'Bearer' })),
    http.get(`${api}/usuarios/me`, () => HttpResponse.json({ message: 'Temporal' }, { status: 500 })),
  );
  const error = (await outcome(auth().login(credentials))).error;
  expect(error.response.data.message).toBe('Temporal');
  expect(getToken()).toBe('provisional');
  expect(auth().usuario).toBeNull();
  server.use(http.get(`${api}/usuarios/me`, () => HttpResponse.json(user({ permisos: ['leer'] }))));
  await auth().refrescarPerfil();
  expect(auth().usuario?.permisos).toEqual(['leer']);
  const current = auth().usuario;
  server.use(http.get(`${api}/usuarios/me`, () => HttpResponse.json({}, { status: 403 })));
  await outcome(auth().refrescarPerfil());
  expect(auth().usuario).toBe(current);
  expect(getToken()).toBe('provisional');
  auth().logout();
  setToken('persistido');
  server.use(http.get(`${api}/usuarios/me`, ({ request }) => {
    expect(request.headers.get('authorization')).toBe('Bearer persistido');
    return HttpResponse.json(user());
  }));
  await auth().inicializar();
  expect(auth()).toMatchObject({ cargando: false, usuario: { nombre: 'Ana Prueba' } });
});

test('cancelación efectiva de GET obsoleto no necesita esperar su respuesta para logout', async () => {
  seedSession('A');
  const entered = deferred<void>(); const release = deferred<void>(); const finished = deferred<void>();
  server.use(http.get(`${api}/usuarios/me`, async () => {
    entered.resolve(); await release.promise; finished.resolve();
    return HttpResponse.json(user());
  }));
  const pending = outcome(auth().refrescarPerfil());
  await entered.promise;
  auth().logout();
  expect(isCancel((await pending).error)).toBe(true);
  expect(auth().usuario).toBeNull();
  release.resolve(); await finished.promise;
});

test('401 actual de bootstrap liquida carga y elimina la sesión', async () => {
  seedSession('A');
  server.use(http.get(`${api}/usuarios/me`, () => HttpResponse.json({}, { status: 401 })));
  expect(isCancel((await outcome(auth().inicializar())).error)).toBe(true);
  expect(auth()).toMatchObject({ usuario: null, cargando: false });
  expect(getToken()).toBeNull();
  // Transport errors remain original for direct API callers.
  server.use(http.get(`${api}/directo`, () => HttpResponse.json({}, { status: 401 })));
  expect(isAxiosError((await outcome(apiClient.get('/directo'))).error)).toBe(true);
});

test('perfil anterior no publica permisos mientras la lectura más reciente sigue pendiente', async () => {
  ignoreReadAbort(); seedSession('A');
  const enteredA = deferred<void>(); const enteredB = deferred<void>();
  const releaseA = deferred<void>(); const releaseB = deferred<void>();
  let calls = 0;
  server.use(http.get(`${api}/usuarios/me`, async () => {
    const a = ++calls === 1;
    (a ? enteredA : enteredB).resolve(); await (a ? releaseA : releaseB).promise;
    return HttpResponse.json(user({ nombre: a ? 'Anterior' : 'Actual', permisos: a ? ['administrar'] : ['leer'] }));
  }));
  const old = outcome(auth().refrescarPerfil()); await enteredA.promise;
  const current = auth().refrescarPerfil(); await enteredB.promise;
  releaseA.resolve();
  expect(isCancel((await old).error)).toBe(true);
  expect(auth().usuario).toBeNull();
  releaseB.resolve(); await current;
  expect(auth().usuario?.permisos).toEqual(['leer']);
});

test.each([403, 500])('bootstrap %s expone error Axios al caller, retiene token y liquida su carga', async status => {
  seedSession('persistido');
  server.use(http.get(`${api}/usuarios/me`, () => HttpResponse.json({ message: 'Fallo temporal' }, { status })));
  const error = (await outcome(auth().inicializar())).error;
  expect(isAxiosError(error)).toBe(true);
  expect(error.response.data.message).toBe('Fallo temporal');
  expect(error.config.url).toBe('/usuarios/me');
  expect(auth()).toMatchObject({ usuario: null, cargando: false });
  expect(getToken()).toBe('persistido');
});

test('invalidation síncrona por un subscriber durante adopción no presta B al login obsoleto', async () => {
  let profileCalls = 0;
  server.use(
    http.post(`${api}/auth/login`, () => HttpResponse.json({ token: 'B', tipo: 'Bearer' })),
    http.get(`${api}/usuarios/me`, () => { profileCalls++; return HttpResponse.json(user()); }),
  );
  const unsubscribe = useAuthStore.subscribe(state => {
    if (state.capturarSesion().token === 'B') state.logout();
  });
  const result = await outcome(auth().login(credentials));
  unsubscribe();
  expect(isCancel(result.error)).toBe(true);
  expect(profileCalls).toBe(0);
  expect(getToken()).toBeNull();
  expect(auth()).toMatchObject({ usuario: null, cargando: false });
});
