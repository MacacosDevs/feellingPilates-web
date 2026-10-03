import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import type { ActividadRecursoRequest, TipoActividadResponse, UsuarioResponse } from '../../src/api/types';
import { activities, user } from '../fixtures/regression';

const api = 'https://api.test.invalid/api';
// Synthetic JWT-like opaque value: the current client accepts stored tokens
// and obtains identity/grants from /usuarios/me, without frontend JWT parsing.
const token = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJzeW50aGV0aWMifQ.synthetic';

async function syntheticApp(context: BrowserContext, page: Page, baseURL: string, initialProfile: UsuarioResponse) {
  let profile = initialProfile;
  let data = activities.map(a => ({ ...a, etiquetas: [...a.etiquetas] }));
  let saved: ActividadRecursoRequest[] = [];
  const unexpected: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const calls: { method: string; path: string; body?: unknown }[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await context.addInitScript(value => localStorage.setItem('feelingpilates.token', value), token);
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.origin === baseURL && method === 'GET') {
      if (request.resourceType() === 'document' && ['/', '/actividades'].includes(url.pathname)) {
        const response = await route.fetch();
        const html = (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '');
        await route.fulfill({ response, body: html }); return;
      }
      if (['script', 'stylesheet', 'image', 'font'].includes(request.resourceType()) && (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.svg')) {
        await route.continue(); return;
      }
    }
    if (method === 'GET' && url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' }); return;
    }
    const path = url.href.startsWith(`${api}/`) ? url.href.slice(api.length) : '';
    const allowedRead = method === 'GET' && ['/usuarios/me', '/permisos', '/tipos-actividad', '/tipos-recurso', ...data.map(a => `/tipos-actividad/${a.id}/recursos`)].includes(path);
    const allowedWrite = (method === 'POST' && path === '/tipos-actividad') || (method === 'PUT' && path === '/tipos-actividad/a3/recursos');
    if (allowedRead || allowedWrite) {
      expect(request.headers().authorization).toBe(`Bearer ${token}`);
      calls.push({ method, path, ...(allowedWrite ? { body: request.postDataJSON() } : {}) });
      if (path === '/usuarios/me') { await route.fulfill({ json: profile }); return; }
      if (path === '/permisos') {
        await route.fulfill({ json: ['leer', 'gestionar'].map(p => ({ codigo: `actividades.${p}`, descripcion: `Actividades: ${p}`, categoria: 'TEST' })) }); return;
      }
      if (method === 'POST') {
        const created: TipoActividadResponse = { id: 'a3', ...request.postDataJSON(), activo: true };
        data = [...data, created]; await route.fulfill({ json: created }); return;
      }
      if (method === 'PUT') { saved = request.postDataJSON(); await route.fulfill({ json: saved }); return; }
      if (path === '/tipos-actividad') { await route.fulfill({ json: data }); return; }
      if (path === '/tipos-recurso') { await route.fulfill({ json: [{ id: 'r1', nombre: 'Reformer', descripcion: null, activo: true }] }); return; }
      await route.fulfill({ json: path === '/tipos-actividad/a3/recursos' ? saved.map(r => ({ ...r, nombreRecurso: 'Reformer' })) : [] }); return;
    }
    unexpected.push(`${method} ${url.href}`); await route.abort('blockedbyclient');
  });
  return {
    calls,
    setProfile: (next: UsuarioResponse) => { profile = next; },
    assertClean: () => {
      expect.soft(unexpected, 'Solicitudes inesperadas bloqueadas').toEqual([]);
      expect.soft(pageErrors, 'Errores de página').toEqual([]);
      expect.soft(consoleErrors, 'Errores de consola').toEqual([]);
    },
  };
}

test('ADMIN con sesión y permisos crea actividad en pareja y guarda recursos desde la ruta real', async ({ context, page, request, baseURL }) => {
  const readiness = process.env.WEB_UX_TEST_READY;
  expect(readiness).toBeTruthy();
  const ready = await request.get(`/__test_ready/${readiness}`);
  expect(ready.status()).toBe(200); expect(await ready.text()).toBe(`web-ux test child ready ${readiness}`);
  const app = await syntheticApp(context, page, baseURL!, user({ permisos: ['actividades.leer', 'actividades.gestionar'] }));
  try {
    await page.goto('/actividades');
    await expect(page.getByRole('heading', { name: 'Actividades', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
    await expect(page.getByRole('row', { name: /Pilates/ })).toBeVisible();
    await page.getByRole('button', { name: 'Nueva actividad', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Nueva actividad', exact: true });
    await expect(form.getByRole('spinbutton', { name: 'Duración (minutos)' })).toHaveValue('60');
    await form.getByRole('textbox', { name: 'Nombre', exact: true }).fill('  Pareja sintética  ');
    await form.getByRole('checkbox', { name: 'Es una actividad en pareja' }).check();
    await form.getByRole('textbox', { name: 'Etiquetas de búsqueda (opcional)' }).fill(' pareja, pareja, Suave ');
    await form.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(form).toHaveCount(0);
    const row = page.getByRole('row', { name: /Pareja sintética/ });
    await expect(row).toContainText('Pareja (2)');
    // Existing Tooltip supplies the row icon's accessible name in Chromium.
    await row.getByRole('button', { name: 'Configurar recursos', exact: true }).click();
    const resources = page.getByRole('dialog', { name: 'Recursos de «Pareja sintética»' });
    await expect(resources.getByRole('combobox', { name: 'Recurso' })).toHaveCount(0);
    await resources.getByRole('button', { name: 'Agregar recurso' }).click();
    await expect(resources.getByRole('combobox', { name: 'Recurso' })).toHaveText('Reformer');
    await resources.getByRole('spinbutton', { name: 'Cantidad' }).fill('3');
    await resources.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(resources).toHaveCount(0); await expect(row).toContainText('3× Reformer');
    expect(app.calls.filter(c => c.method === 'POST')).toEqual([{ method: 'POST', path: '/tipos-actividad', body: { nombre: 'Pareja sintética', descripcion: null, duracionMinutos: 60, participantesPorReserva: 2, etiquetas: ['pareja', 'Suave'] } }]);
    expect(app.calls.filter(c => c.method === 'PUT')).toEqual([{ method: 'PUT', path: '/tipos-actividad/a3/recursos', body: [{ tipoRecursoId: 'r1', cantidad: 3 }] }]);
    expect(app.calls.some(c => c.path === '/usuarios/me')).toBe(true);
    expect(app.calls.some(c => c.path === '/permisos')).toBe(true);
  } finally { app.assertClean(); }
});

test('PERSONAL sólo lectura y sin lectura respeta permisos; CLIENTE con grants es redirigido por rol', async ({ context, page, baseURL }) => {
  const app = await syntheticApp(context, page, baseURL!, user({ roles: ['PERSONAL'], permisos: ['actividades.leer'] }));
  try {
    await page.goto('/actividades'); await expect(page.getByRole('row', { name: /Pilates/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nueva actividad', exact: true })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Acciones' })).toHaveCount(0);
    await expect(page.getByRole('row', { name: /Pilates/ }).getByRole('button')).toHaveCount(0);
    const activityReads = () => app.calls.filter(c => c.path.startsWith('/tipos-')).length;
    const before = activityReads();
    app.setProfile(user({ roles: ['PERSONAL'], permisos: ['actividades.gestionar'] }));
    await page.reload(); await expect(page.getByRole('alert')).toContainText('No tienes permiso');
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Nueva actividad', exact: true })).toHaveCount(0);
    expect(activityReads()).toBe(before);
    app.setProfile(user({ roles: ['CLIENTE'], permisos: ['actividades.leer', 'actividades.gestionar'] }));
    await page.reload(); await expect(page).toHaveURL('/');
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue('Ana Prueba');
    await expect(page.getByRole('heading', { name: 'Actividades', exact: true })).toHaveCount(0);
    expect(activityReads()).toBe(before);
    expect(app.calls.filter(c => c.method !== 'GET')).toEqual([]);
  } finally { app.assertClean(); }
});
