import { expect, test } from '@playwright/test';
import type { LoginRequest, TokenResponse, UsuarioResponse } from '../../src/api/types';

test('the protected app redirects to login and loads a synthetic profile after login', async ({ context, page, request: localRequest, baseURL }) => {
  const readinessToken = process.env.WEB_UX_TEST_READY;
  expect(readinessToken).toBeTruthy();
  const ready = await localRequest.get(`/__test_ready/${readinessToken}`);
  expect(ready.status()).toBe(200);
  expect(await ready.text()).toBe(`web-ux test child ready ${readinessToken}`);
  const unexpectedRequests: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const apiRequests: string[] = [];
  const credentials: LoginRequest = { correo: 'persona@example.invalid', contrasena: 'synthetic-only' };
  const token: TokenResponse = { token: 'synthetic-token', tipo: 'Bearer' };
  const profile: UsuarioResponse = {
    id: 'synthetic-user', correo: credentials.correo, nombre: 'Persona de prueba',
    telefono: null, fotoUrl: null, descripcion: null, proveedorAuth: 'LOCAL',
    estatus: 'ACTIVO', roles: ['CLIENTE'], rolesAsignados: [],
    creadoEn: '2026-01-02T00:00:00Z', permisos: [],
  };
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });

  // Register before navigation. Every API request is synthetic; unknown origins
  // and endpoints are recorded and aborted, and must fail the final assertion.
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === baseURL && request.method() === 'GET') {
      if (request.resourceType() === 'document' && ['/', '/login'].includes(url.pathname)) {
        const response = await route.fetch();
        const html = (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '');
        await route.fulfill({ response, body: html });
        return;
      }
      const staticType = ['script', 'stylesheet', 'image', 'font'].includes(request.resourceType());
      const staticPath = url.pathname.startsWith('/assets/') || url.pathname === '/favicon.svg';
      if (staticType && staticPath) {
        await route.continue();
        return;
      }
    }
    if (url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      return;
    }
    if (url.href === 'https://api.test.invalid/api/auth/login' && request.method() === 'POST') {
      apiRequests.push('login');
      expect(request.postDataJSON()).toEqual(credentials);
      await route.fulfill({ json: token });
      return;
    }
    if (url.href === 'https://api.test.invalid/api/usuarios/me' && request.method() === 'GET') {
      apiRequests.push('profile');
      expect(request.headers().authorization).toBe(`Bearer ${token.token}`);
      await route.fulfill({ json: profile });
      return;
    }
    unexpectedRequests.push(`${request.method()} ${request.url()}`);
    await route.abort('blockedbyclient');
  });

  try {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    await page.getByRole('textbox', { name: 'Correo', exact: true }).fill(credentials.correo);
    await page.getByLabel(/^Contraseña/).fill(credentials.contrasena);
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue(profile.nombre);
    await expect(page).toHaveURL('/');
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await expect(page).toHaveURL('/login');
    expect(apiRequests).toEqual(['login', 'profile']);
  } finally {
    expect.soft(unexpectedRequests, 'Unexpected browser requests were blocked').toEqual([]);
    expect.soft(pageErrors, 'Browser page errors').toEqual([]);
    expect.soft(consoleErrors, 'Browser console errors').toEqual([]);
  }
});
