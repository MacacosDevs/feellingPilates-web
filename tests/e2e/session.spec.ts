import { expect, test } from '@playwright/test';
import type { UsuarioResponse } from '../../src/api/types';

test('un 401 de la vista protegida elimina sesión, permisos y Header y vuelve a login', async ({ context, page, request: localRequest, baseURL }) => {
  const readinessToken = process.env.WEB_UX_TEST_READY;
  expect(readinessToken).toBeTruthy();
  const ready = await localRequest.get(`/__test_ready/${readinessToken}`);
  expect(ready.status()).toBe(200);
  expect(await ready.text()).toBe(`web-ux test child ready ${readinessToken}`);
  const unexpectedRequests: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: { message: string; url: string }[] = [];
  const apiRequests: string[] = [];
  const endpoint = 'https://api.test.invalid/api/usuarios/me';
  const token = 'sesion-chromium-sintetica';
  const profile: UsuarioResponse = {
    id: 'synthetic-user', correo: 'persona@example.invalid', nombre: 'Persona de prueba',
    telefono: null, fotoUrl: null, descripcion: null, proveedorAuth: 'LOCAL',
    estatus: 'ACTIVO', roles: ['ADMIN'], rolesAsignados: [],
    creadoEn: '2026-01-02T00:00:00Z', permisos: ['actividades.leer'],
  };
  page.on('pageerror', error => pageErrors.push(error.message));
  // Keep every error: explicitly assert the browser's expected HTTP401 resource
  // diagnostic below, rather than filtering/suppressing application errors.
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push({ message: message.text(), url: message.location().url });
  });
  await context.addInitScript(value => localStorage.setItem('feelingpilates.token', value), token);
  // Same strict origin/resource allowlist as the accepted existing browser specs.
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
      if (staticType && staticPath) { await route.continue(); return; }
    }
    if (url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' }); return;
    }
    if (url.href === endpoint && request.method() === 'GET') {
      apiRequests.push('GET perfil');
      expect(request.headers().authorization).toBe(`Bearer ${token}`);
      await route.fulfill({ json: profile }); return;
    }
    if (url.href === endpoint && request.method() === 'PUT') {
      apiRequests.push('PUT perfil');
      expect(request.headers().authorization).toBe(`Bearer ${token}`);
      expect(request.postDataJSON()).toEqual({ nombre: profile.nombre, telefono: '', descripcion: '' });
      await route.fulfill({ status: 401, json: { message: 'Sesión expirada sintética' } }); return;
    }
    unexpectedRequests.push(`${request.method()} ${request.url()}`);
    await route.abort('blockedbyclient');
  });
  try {
    await page.goto('/');
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue(profile.nombre);
    await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Actividades', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Iniciar sesión', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('feelingpilates.token'))).toBeNull();
    await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Actividades', exact: true })).toHaveCount(0);
    expect(apiRequests).toEqual(['GET perfil', 'PUT perfil']);
    expect(consoleErrors).toEqual([{
      message: expect.stringMatching(/^Failed to load resource: the server responded with a status of 401 \(Unauthorized\)$/),
      url: endpoint,
    }]);
  } finally {
    expect.soft(unexpectedRequests, 'Unexpected browser requests were blocked').toEqual([]);
    expect.soft(pageErrors, 'Browser page errors').toEqual([]);
  }
});
