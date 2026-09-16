import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import { server } from '../../tests/mocks/server';
import { login } from './auth';
import type { LoginRequest, TokenResponse } from './types';

test('login sends the current request DTO and returns the token response DTO', async () => {
  const request: LoginRequest = { correo: 'persona@example.invalid', contrasena: 'synthetic-only' };
  const response: TokenResponse = { token: 'synthetic-token', tipo: 'Bearer' };
  let received: unknown;
  server.use(http.post('https://api.test.invalid/api/auth/login', async ({ request: intercepted }) => {
    received = await intercepted.json();
    return HttpResponse.json(response);
  }));

  expect(await login(request)).toEqual(response);
  expect(received).toEqual(request);
});
