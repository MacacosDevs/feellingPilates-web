import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { activities, pageOf, user } from '../fixtures/regression';

const api = 'https://api.test.invalid/api';
const token = 'm06-feedback-synthetic';
const clientPayload = { correo: 'cliente@example.invalid', nombre: 'Cliente sintético', telefono: '4421234567' };
const activityPayload = { nombre: 'Actividad sintética', descripcion: null, duracionMinutos: 60, participantesPorReserva: 1, etiquetas: [] };

function deferred() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}

async function synthetic(page: Page, baseURL: string) {
  let usuariosFallan = true, salonesFallan = true;
  const client = deferred(), activity = deferred();
  const assets = new Set(['/favicon.svg', '/icons.svg']);
  const unknown: string[] = [], pageErrors: string[] = [];
  const consoleErrors: { text: string; url: string }[] = [];
  const failures: { url: string; status: number }[] = [];
  const responses: { url: string; status: number }[] = [];
  const requests: { method: string; path: string; query: string; body?: unknown }[] = [];
  let clientReceipts = 0, activityReceipts = 0;
  const createdActivity = { ...activities[0], ...activityPayload, id: 'a3', activo: true };
  const profile = user({ roles: ['SUPER_ADMIN'], permisos: ['usuarios.ver', 'roles.ver', 'actividades.leer', 'actividades.gestionar'] });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
  page.on('response', response => { if (response.status() === 503) responses.push({ url: response.url(), status: response.status() }); });
  await page.context().addInitScript(value => localStorage.setItem('feelingpilates.token', value), token);
  await page.context().route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (url.origin === new URL(baseURL).origin && method === 'GET' && !url.search) {
      if (request.resourceType() === 'document' && ['/usuarios', '/salones', '/actividades'].includes(url.pathname)) {
        const response = await route.fetch();
        const html = (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '');
        for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) assets.add(match[1]);
        await route.fulfill({ response, body: html }); return;
      }
      if (assets.has(url.pathname) && ['script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) {
        await route.continue(); return;
      }
    }
    if (method === 'GET' && url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' }); return;
    }
    if (url.origin === new URL(api).origin && url.pathname.startsWith('/api/') && request.headers().authorization === `Bearer ${token}`) {
      const path = url.pathname.slice('/api'.length);
      const usersQuery = url.search === '?page=0&size=10&sort=nombre,desc';
      const reads = ['/usuarios/me', '/permisos', '/admin/usuarios/conteo-roles', '/salones', '/tipos-actividad', '/tipos-recurso', '/tipos-actividad/a1/recursos', '/tipos-actividad/a2/recursos', '/tipos-actividad/a3/recursos'];
      const allowedRead = method === 'GET' && ((path === '/admin/usuarios' && usersQuery) || (reads.includes(path) && !url.search));
      const allowedWrite = method === 'POST' && !url.search && ['/admin/usuarios/clientes', '/tipos-actividad'].includes(path);
      if (allowedRead || allowedWrite) {
        requests.push({ method, path, query: url.search, ...(allowedWrite ? { body: request.postDataJSON() } : {}) });
        if (allowedWrite) {
          if (path === '/admin/usuarios/clientes') {
            await client.promise;
            clientReceipts++;
            await route.fulfill({ json: user({ ...clientPayload, id: 'cliente-nuevo', roles: ['CLIENTE'] }) }); return;
          }
          await activity.promise;
          activityReceipts++;
          await route.fulfill({ json: createdActivity }); return;
        }
        if ((path === '/admin/usuarios' && usuariosFallan) || (path === '/salones' && salonesFallan)) {
          failures.push({ url: url.href, status: 503 });
          await route.fulfill({ status: 503, json: { message: 'Lectura sintética no disponible' } }); return;
        }
        const json = path === '/usuarios/me' ? profile
          : path === '/permisos' ? profile.permisos.map(codigo => ({ codigo, descripcion: codigo, categoria: 'SYNTHETIC' }))
          : path === '/admin/usuarios' ? pageOf([user()])
          : path === '/admin/usuarios/conteo-roles' ? [{ rol: 'CLIENTE', total: 1 }]
          : path === '/salones' ? [{ id: 's1', nombre: 'Sede Prueba', direccion: '1 Avenida Pilates', estadoId: 1, estadoNombre: 'Querétaro', municipioId: 10, municipioNombre: 'Centro', creadoEn: '2026-01-02T12:00:00Z' }]
          : path === '/tipos-actividad' ? [...activities, ...(activityReceipts ? [createdActivity] : [])]
          : path === '/tipos-recurso' ? [{ id: 'r1', nombre: 'Reformer', descripcion: null, activo: true }] : [];
        await route.fulfill({ json }); return;
      }
    }
    unknown.push(`${method} ${url.href} authorization=${request.headers().authorization ?? 'NONE'}`);
    await route.abort('blockedbyclient');
  });
  return {
    requests, unknown, pageErrors, consoleErrors, failures, responses, client, activity,
    receipts: () => ({ client: clientReceipts, activity: activityReceipts }),
    recoverUsuarios: () => { usuariosFallan = false; }, recoverSalones: () => { salonesFallan = false; },
  };
}

for (const width of [375, 768, 1440]) {
  test(`feedback compartido ${width}px conserva reintento, submit nativo y acción manual`, async ({ page, baseURL }, testInfo) => {
    const evidence = await synthetic(page, baseURL!);
    const count = (method: string, path: string) => evidence.requests.filter(r => r.method === method && r.path === path).length;
    try {
      await page.setViewportSize({ width, height: 720 });
      await page.goto('/usuarios');
      await expect(page.getByRole('alert')).toContainText('No se pudieron cargar los usuarios.');
      const retryUsers = page.getByRole('button', { name: 'Reintentar', exact: true });
      await expect(retryUsers).toBeVisible();
      await retryUsers.focus(); await expect(retryUsers).toBeFocused();
      expect(count('GET', '/admin/usuarios')).toBe(1);
      evidence.recoverUsuarios(); await page.keyboard.press('Enter');
      await expect(page.getByRole('row', { name: /Ana Prueba/ })).toContainText('ana@example.invalid');
      expect(count('GET', '/admin/usuarios')).toBe(2);

      await page.getByRole('button', { name: 'Nuevo usuario' }).click();
      await page.getByRole('menuitem', { name: 'Nuevo cliente' }).click();
      const clientDialog = page.getByRole('dialog');
      await expect(clientDialog.getByRole('textbox', { name: /^Nombre/ })).toBeFocused();
      await clientDialog.getByRole('textbox', { name: /^Nombre/ }).fill(clientPayload.nombre);
      await clientDialog.getByRole('textbox', { name: /^Correo/ }).fill(clientPayload.correo);
      const phone = clientDialog.getByRole('textbox', { name: 'Teléfono' });
      await phone.fill(clientPayload.telefono);
      await expect(clientDialog.getByRole('button', { name: 'Crear cliente' })).toHaveAttribute('type', 'submit');
      await phone.press('Enter');
      const clientPending = clientDialog.getByRole('button', { name: 'Creando...', exact: true });
      await expect(clientPending).toBeDisabled(); await expect(clientPending).toHaveAttribute('aria-busy', 'true');
      await expect.poll(() => count('POST', '/admin/usuarios/clientes')).toBe(1);
      expect(evidence.requests.filter(r => r.method === 'POST')).toEqual([{ method: 'POST', path: '/admin/usuarios/clientes', query: '', body: clientPayload }]);
      await phone.press('Enter');
      expect(count('POST', '/admin/usuarios/clientes')).toBe(1);
      expect(evidence.receipts().client).toBe(0);
      expect(count('GET', '/admin/usuarios')).toBe(2);
      await expect(clientDialog).toBeVisible();
      await expect(page.getByText(`Invitación enviada a ${clientPayload.correo}`, { exact: true })).toHaveCount(0);
      evidence.client.release();
      await expect(clientDialog).toHaveCount(0);
      await expect(page.getByText(`Invitación enviada a ${clientPayload.correo}`, { exact: true })).toBeVisible();
      expect(evidence.receipts().client).toBe(1);

      await page.goto('/salones');
      await expect(page.getByRole('alert')).toContainText('No se pudo actualizar la lista de salones.');
      const retrySalons = page.getByRole('button', { name: 'Reintentar', exact: true });
      await expect(retrySalons).toBeVisible();
      await expect(retrySalons).toHaveClass(/MuiButton-sizeMedium/);
      await retrySalons.focus(); await expect(retrySalons).toBeFocused();
      expect(count('GET', '/salones')).toBe(1);
      evidence.recoverSalones(); await page.keyboard.press('Enter');
      const recoveredSalon = width === 375 ? page.getByRole('article', { name: 'Sede Prueba', exact: true }) : page.getByRole('row', { name: /Sede Prueba/ });
      await expect(recoveredSalon).toContainText('Centro, Querétaro');
      await expect(recoveredSalon).toContainText('1 Avenida Pilates');
      expect(count('GET', '/salones')).toBe(2);

      await page.goto('/actividades');
      await expect(page.getByRole('row', { name: /Pilates/ })).toBeVisible();
      await page.getByRole('button', { name: 'Nueva actividad' }).click();
      const activityDialog = page.getByRole('dialog', { name: 'Nueva actividad', exact: true });
      await activityDialog.getByRole('textbox', { name: 'Nombre', exact: true }).fill(activityPayload.nombre);
      const manual = activityDialog.getByRole('button', { name: 'Crear', exact: true });
      await expect(manual).toHaveAttribute('type', 'button');
      await manual.focus(); await expect(manual).toBeFocused(); await page.keyboard.press('Enter');
      const activityPending = activityDialog.getByRole('button', { name: 'Guardando…', exact: true });
      await expect(activityPending).toBeDisabled(); await expect(activityPending).toHaveAttribute('aria-busy', 'true');
      await expect.poll(() => count('POST', '/tipos-actividad')).toBe(1);
      await page.keyboard.press('Enter');
      expect(count('POST', '/tipos-actividad')).toBe(1);
      expect(evidence.requests.filter(r => r.method === 'POST' && r.path === '/tipos-actividad')).toEqual([{ method: 'POST', path: '/tipos-actividad', query: '', body: activityPayload }]);
      expect(evidence.receipts().activity).toBe(0);
      await expect(activityDialog).toBeVisible();
      await expect(page.getByText('Actividad creada', { exact: true })).toHaveCount(0);
      evidence.activity.release();
      await expect(activityDialog).toHaveCount(0);
      await expect(page.getByText('Actividad creada', { exact: true })).toBeVisible();
      await expect(page.getByRole('row', { name: /Actividad sintética/ })).toBeVisible();
      expect(evidence.receipts().activity).toBe(1);
    } finally {
      evidence.client.release(); evidence.activity.release();
      await testInfo.attach('feedback-red-errores', { body: JSON.stringify({ ...evidence, receipts: evidence.receipts() }), contentType: 'application/json' });
      expect.soft(evidence.unknown, 'Todas las solicitudes fuera del allowlist fueron bloqueadas').toEqual([]);
      expect.soft(evidence.pageErrors).toEqual([]);
      expect.soft(evidence.responses).toEqual(evidence.failures);
      expect.soft(evidence.consoleErrors).toEqual(evidence.failures.map(failure => ({ url: failure.url, text: `Failed to load resource: the server responded with a status of ${failure.status} (Service Unavailable)` })));
    }
  });
}
