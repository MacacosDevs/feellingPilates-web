import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { configureSessionBoundary, setToken } from '../../src/api/client';
import { useAuthStore } from '../../src/auth/authStore';
import * as usuarios from '../../src/api/usuarios';
import * as permisos from '../../src/api/permisos';

const { login, completarInvitacion, refrescarPerfil } = useAuthStore.getState();

export const api = 'https://api.test.invalid/api';
export { user } from '../fixtures/regression';
export { server } from '../mocks/server';

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

export function sessionTests() {
  beforeEach(() => {
    useAuthStore.getState().logout();
    configureSessionBoundary({
      capture: () => useAuthStore.getState().capturarSesion(),
      unauthorized: (identity) => useAuthStore.getState().expirar(identity),
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ login, completarInvitacion, refrescarPerfil });
    useAuthStore.getState().logout();
    configureSessionBoundary(undefined);
  });
}

/** Narrow spies ignore only abort, delegating protocol and responses to real Axios/MSW.
 * These prove generation/request guards independently of transport cancellation. */
export function ignoreReadAbort() {
  const profile = usuarios.obtenerMiPerfil;
  const catalog = permisos.listarCatalogoPermisos;
  return {
    profile: vi.spyOn(usuarios, 'obtenerMiPerfil').mockImplementation(() => profile()),
    catalog: vi.spyOn(permisos, 'listarCatalogoPermisos').mockImplementation(() => catalog()),
  };
}

/** Attach immediately: deliberately held obsolete requests must be drained. */
export function outcome<T>(promise: Promise<T>) {
  return promise.then(value => ({ value, error: undefined }), error => ({ value: undefined, error }));
}

/** Existing persistence/snapshot seeding, with real logout invalidation first. */
export function seedSession(token: string) {
  useAuthStore.getState().logout();
  setToken(token);
}
