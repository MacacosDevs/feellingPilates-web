import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { user, pageOf, salon } from '../fixtures/regression';

const networkEvidence = new WeakMap<Page, object>();
test.afterEach(async ({ page }, testInfo) => {
  const evidence = networkEvidence.get(page);
  if (evidence) await testInfo.attach('captura-completa-red-errores', { body: JSON.stringify(evidence), contentType: 'application/json' });
  if (testInfo.status !== testInfo.expectedStatus) await testInfo.attach('fallo-pagina-completa', { body: await page.screenshot({ fullPage: true, animations: 'disabled' }), contentType: 'image/png' });
});
interface CandidateOptions {
  profileRole?: 'PERSONAL' | 'SUPER_ADMIN';
  state?: 'populated' | 'empty' | 'error' | '401';
  deferred?: Promise<void>;
  longCode?: boolean;
}
async function synthetic(context: BrowserContext, page: Page, baseURL: string, options: CandidateOptions = {}) {
  const token = 'm04-private-synthetic';
  const profile = user({ roles: [options.profileRole ?? 'SUPER_ADMIN'], permisos: ['usuarios.ver', 'roles.ver', 'roles.gestionar'] });
  const role = { id: 'r1', nombre: 'Recepción', descripcion: null, permisos: ['usuarios.ver'], editable: true };
  const locked = { ...role, id: 'r2', nombre: 'SUPER_ADMIN', editable: false };
  const assets = new Set(['/favicon.svg', '/icons.svg']);
  let state = options.state ?? 'populated';
  let patched = false;
  const expectedConsoleerrors: string[] = [];
  const consoleLocations: { text: string; url: string }[] = [];
  const unexpected: string[] = [], pageerrors: string[] = [], consoleerrors: string[] = [], calls: string[] = [];
  page.on('pageerror', error => pageerrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') { consoleerrors.push(message.text()); consoleLocations.push({ text: message.text(), url: message.location().url }); } });
  await context.addInitScript(value => localStorage.setItem('feelingpilates.token', value), token);
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (url.origin === baseURL && method === 'GET' && !url.search) {
      if (request.resourceType() === 'document' && ['/roles', '/usuarios'].includes(url.pathname)) {
        const response = await route.fetch(); const html = (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '');
        for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) assets.add(match[1]);
        await route.fulfill({ response, body: html }); return;
      }
      if (assets.has(url.pathname) && ['script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) {
        const response = await route.fetch(); await route.fulfill({ response }); return;
      }
    }
    if (method === 'GET' && url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' }); return;
    }
    if (url.origin === 'https://api.test.invalid' && method === 'PATCH' && url.pathname === `/api/admin/usuarios/${user().id}/suspender` && !url.search && request.headers().authorization === `Bearer ${token}`) {
      calls.push('PATCH ' + url.pathname); patched = true;
      await route.fulfill({ json: user({ estatus: 'suspendido' }) }); return;
    }
    if (url.origin === 'https://api.test.invalid' && method === 'GET' && request.headers().authorization === `Bearer ${token}`) {
      let json: unknown; const path = url.pathname;
      if (path === '/api/admin/usuarios') {
        const query = Object.fromEntries(url.searchParams);
        if (JSON.stringify(query) === JSON.stringify({ page: '0', size: '10', sort: 'nombre,desc' })) {
          calls.push(path + url.search);
          await options.deferred;
          if (state === 'error' || state === '401' || patched) { expectedConsoleerrors.push(`Failed to load resource: the server responded with a status of ${state === '401' ? '401 (Unauthorized)' : '503 (Service Unavailable)'}`); await route.fulfill({ status: state === '401' ? 401 : 503, json: { message: 'Lectura no disponible' } }); return; }
          json = pageOf(state === 'empty' ? [] : [user({ roles: ['CLIENTE'], estatus: 'activo' })]);
        }
      } else if (!url.search) {
        if (path === '/api/usuarios/me') json = profile;
        else if (path === '/api/permisos') json = profile.permisos.map(codigo => ({ codigo, descripcion: codigo, categoria: 'TEST' }));
        else if (path === '/api/admin/roles') {
          calls.push(path); await options.deferred;
          if (state === 'error') { expectedConsoleerrors.push('Failed to load resource: the server responded with a status of 503 (Service Unavailable)'); await route.fulfill({ status: 503, json: { message: 'Lectura no disponible' } }); return; }
          json = state === 'empty' ? [] : [role, locked];
        }
        else if (path === '/api/admin/roles/permisos') json = [
          { codigo: 'usuarios.ver', descripcion: 'Ver usuarios', categoria: 'USUARIOS' },
          ...(options.longCode ? [{ codigo: 'usuarios.permiso.suministrado.con.codigo.extenso.que.debe.permanecer.completo', descripcion: 'Descripción completa del permiso suministrado para administrar usuarios sin recortar información', categoria: 'USUARIOS' }, { codigo: 'roles.ver', descripcion: 'Ver roles', categoria: 'ROLES' }] : []),
        ];
        else if (path === '/api/admin/usuarios/conteo-roles') json = [{ rol: 'CLIENTE', total: 1 }];
        else if (path === '/api/salones') json = [salon()];
      }
      if (json !== undefined) { calls.push(path + url.search); await route.fulfill({ json }); return; }
    }
    unexpected.push(`${method} ${url.href}`); await route.abort('blockedbyclient');
  });
  const evidence = { calls, unexpected, pageerrors, consoleerrors, expectedConsoleerrors, consoleLocations, recover: () => { state = 'populated'; patched = false; } };
  networkEvidence.set(page, evidence);
  return evidence;
}
for (const width of [375, 768, 1440]) {
  test(`Roles ${width}px conserva información, bloqueo y formulario de rol`, async ({ context, page, baseURL }, testInfo) => {
    const evidence = await synthetic(context, page, baseURL!);
    try {
      await page.setViewportSize({ width, height: 720 }); await page.goto('/roles');
      await expect(page.getByRole('heading', { name: 'Roles y permisos', exact: true })).toBeVisible();
      await expect(page.getByText('Elige un rol, luego una categoría, y activa o desactiva lo que puede hacer.')).toBeVisible();
      await expect(page.getByText('usuarios.ver', { exact: true })).toBeVisible();
      await testInfo.attach('roles-informacion', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
      const toggle = page.getByRole('switch'); await expect(toggle).toBeChecked(); await expect(toggle).toBeEnabled();
      await toggle.uncheck(); await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
      await page.getByRole('tab', { name: 'SUPER_ADMIN' }).click(); await expect(toggle).toBeDisabled();
      await expect(page.getByText(/siempre tiene todos los permisos/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Editar nombre y descripción del rol' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Nuevo rol' }).click(); const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel('Nombre', { exact: true })).toBeFocused();
      await dialog.getByLabel('Nombre', { exact: true }).fill('Rol sintético');
      await dialog.getByLabel('Descripción', { exact: true }).fill('Descripción sintética');
      await expect(dialog.getByRole('button', { name: 'Guardar', exact: true })).toBeEnabled();
      await testInfo.attach('rol-formulario', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
      await dialog.getByRole('button', { name: 'Cancelar' }).click(); await expect(dialog).toHaveCount(0);
      await page.getByRole('tab', { name: 'Recepción' }).click(); await page.getByRole('button', { name: 'Editar nombre y descripción del rol' }).click();
      await expect(dialog.getByLabel('Nombre', { exact: true })).toHaveValue('Recepción'); await dialog.getByRole('button', { name: 'Cancelar' }).click(); await expect(dialog).toHaveCount(0);
      expect(evidence.calls).toContain('/api/admin/roles'); expect(evidence.calls).toContain('/api/admin/roles/permisos');
    } finally {
      await testInfo.attach('red-y-errores', { body: JSON.stringify(evidence), contentType: 'application/json' });
      expect(evidence.unexpected).toEqual([]); expect(evidence.pageerrors).toEqual([]); expect(evidence.consoleerrors).toEqual([]);
    }
  });
  test(`Usuarios ${width}px conserva información, menú y límites de formularios`, async ({ context, page, baseURL }, testInfo) => {
    const evidence = await synthetic(context, page, baseURL!);
    try {
      await page.setViewportSize({ width, height: 720 }); await page.goto('/usuarios');
      await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
      await expect(page.getByRole('row', { name: /Ana Prueba/ })).toBeVisible();
      await expect(page.getByText('ana@example.invalid', { exact: true })).toBeVisible();
      await expect(page.getByPlaceholder('Buscar por nombre o correo')).toBeVisible();
      await testInfo.attach('usuarios-informacion', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
      await expect(page.getByRole('button', { name: 'Editar usuario' })).toHaveCount(1);
      await expect(page.getByLabel('Suspender acceso')).toHaveCount(1);
      await page.getByRole('button', { name: 'Nuevo usuario' }).click(); await expect(page.getByRole('menuitem', { name: 'Nuevo personal' })).toBeVisible();
      await page.getByRole('menuitem', { name: 'Nuevo cliente' }).click(); let dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'Nuevo cliente' })).toBeVisible();
      await expect(dialog.getByRole('textbox', { name: /^Nombre/ })).toBeFocused();
      await firstLabelFits(page);
      await dialog.getByRole('textbox', { name: /^Nombre/ }).fill('Ana sintética'); await dialog.getByRole('textbox', { name: /^Correo/ }).fill('ana@example.invalid');
      await expect(dialog.getByText('Se le enviará un correo para que asigne su contraseña')).toBeVisible();
      await testInfo.attach('cliente-formulario', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
      await expect(dialog.getByRole('button', { name: 'Crear cliente' })).toBeEnabled(); await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
      await page.getByRole('button', { name: 'Nuevo usuario' }).click(); await page.getByRole('menuitem', { name: 'Nuevo personal' }).click(); dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'Nuevo personal' })).toBeVisible();
      await firstLabelFits(page);
      await expect(dialog.getByRole('combobox', { name: 'Rol' })).toHaveText('Personal');
      await expect(dialog.getByRole('combobox', { name: /^Sedes/ })).toHaveAttribute('required', '');
      await dialog.getByRole('button', { name: 'Cancelar' }).click(); await expect(dialog).toHaveCount(0);
      await page.getByRole('button', { name: 'Editar usuario' }).click();
      await expect(dialog.getByRole('heading', { name: 'Editar usuario' })).toBeVisible(); await expect(dialog.getByRole('textbox', { name: /^Nombre/ })).toHaveValue('Ana Prueba');
      await expect(dialog.getByRole('combobox', { name: /^Salón/ })).toHaveCount(0);
      await firstLabelFits(page);
      await dialog.getByRole('button', { name: 'Cancelar' }).click(); await expect(dialog).toHaveCount(0);
      expect(evidence.calls).toContain('/api/admin/usuarios?page=0&size=10&sort=nombre,desc');
    } finally {
      await testInfo.attach('red-y-errores', { body: JSON.stringify(evidence), contentType: 'application/json' });
      expect(evidence.unexpected).toEqual([]); expect(evidence.pageerrors).toEqual([]); expect(evidence.consoleerrors).toEqual([]);
    }
  });
}

function deferredRead() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}
async function cleanEvidence(evidence: Awaited<ReturnType<typeof synthetic>>) {
  expect(evidence.unexpected).toEqual([]);
  expect(evidence.pageerrors).toEqual([]);
  expect(evidence.consoleerrors).toEqual(evidence.expectedConsoleerrors);
  for (const entry of evidence.consoleLocations) expect(new URL(entry.url).origin).toBe('https://api.test.invalid');
}
async function noDocumentOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
async function firstLabelFits(page: Page) {
  const result = await page.getByRole('dialog').evaluate(dialog => {
    const content = dialog.querySelector('.MuiDialogContent-root')!;
    const label = content.querySelector('label')!;
    const c = content.getBoundingClientRect(), l = label.getBoundingClientRect();
    return l.top >= c.top && l.bottom <= c.bottom && l.left >= c.left && l.right <= c.right;
  });
  expect(result).toBe(true);
}
for (const width of [375, 768, 1440]) {
  for (const feature of ['Usuarios', 'Roles'] as const) {
    test(`${feature} ${width}px distingue carga diferida, vacío auténtico y error recuperable`, async ({ context, page, baseURL }) => {
      const pending = deferredRead();
      const evidence = await synthetic(context, page, baseURL!, { state: 'empty', deferred: pending.promise });
      await page.setViewportSize({ width, height: 720 });
      await page.goto(feature === 'Usuarios' ? '/usuarios' : '/roles');
      await expect(page.getByRole('progressbar')).toBeVisible();
      await expect(page.getByText(feature === 'Usuarios' ? 'No hay usuarios que coincidan con este filtro' : 'Aún no hay roles configurados.')).toHaveCount(0);
      pending.release();
      await expect(page.getByText(feature === 'Usuarios' ? 'No hay usuarios que coincidan con este filtro' : 'Aún no hay roles configurados.')).toBeVisible();
      await noDocumentOverflow(page);
      await cleanEvidence(evidence);
    });
    test(`${feature} ${width}px ofrece reintento GET explícito sin presentar vacío`, async ({ context, page, baseURL }) => {
      const evidence = await synthetic(context, page, baseURL!, { state: 'error' });
      await page.setViewportSize({ width, height: 720 });
      await page.goto(feature === 'Usuarios' ? '/usuarios' : '/roles');
      await expect(page.getByRole('alert')).toContainText(feature === 'Usuarios' ? 'No se pudieron cargar los usuarios.' : 'No se pudieron cargar los roles y permisos.');
      await expect(page.getByText(feature === 'Usuarios' ? 'No hay usuarios que coincidan con este filtro' : 'Aún no hay roles configurados.')).toHaveCount(0);
      const before = evidence.calls.length;
      evidence.recover();
      await page.getByRole('button', { name: 'Reintentar' }).click();
      await expect(feature === 'Usuarios' ? page.getByText('Ana Prueba', { exact: true }) : page.getByRole('tab', { name: 'Recepción' })).toBeVisible();
      expect(evidence.calls.length).toBeGreaterThan(before);
      await noDocumentOverflow(page);
      await cleanEvidence(evidence);
    });
  }
  test(`Roles ${width}px conserva códigos completos, categorías y teclado del diálogo nombrado`, async ({ context, page, baseURL }) => {
    const evidence = await synthetic(context, page, baseURL!, { longCode: true });
    await page.setViewportSize({ width, height: 720 }); await page.goto('/roles');
    const category = page.getByRole('button', { name: /Usuarios 1\/2/ });
    await category.click();
    await expect(category).toHaveAttribute('aria-pressed', 'true');
    const code = page.getByText('usuarios.permiso.suministrado.con.codigo.extenso.que.debe.permanecer.completo', { exact: true });
    await expect(code).toBeVisible();
    expect(await code.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(page.getByRole('switch', { name: /Descripción completa/ })).toBeEnabled();
    await page.getByRole('button', { name: /Roles 0\/1/ }).click();
    await expect(page.getByRole('button', { name: /Roles 0\/1/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('tab', { name: 'SUPER_ADMIN' }).click();
    await expect(page.getByRole('switch')).toBeDisabled();
    expect(await page.getByRole('switch').evaluate(input => (input as HTMLInputElement).disabled)).toBe(true);
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar nombre y descripción del rol' })).toHaveCount(0);
    const open = page.getByRole('button', { name: 'Nuevo rol' });
    await open.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Nuevo rol', exact: true });
    await expect(dialog).toBeVisible(); await expect(dialog.getByLabel('Nombre', { exact: true })).toBeFocused();
    await firstLabelFits(page);
    await expect(dialog.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
    await page.keyboard.press('Tab'); await expect(dialog.getByLabel('Descripción')).toBeFocused();
    await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await page.keyboard.press('Enter'); await expect(dialog).toHaveCount(0); await expect(open).toBeFocused();
    await page.keyboard.press('Enter'); await expect(dialog).toBeVisible(); await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0); await expect(open).toBeFocused();
    await noDocumentOverflow(page); await cleanEvidence(evidence);
  });
  test(`Usuarios ${width}px valida formularios y preserva foco y permisos de Personal`, async ({ context, page, baseURL }) => {
    const evidence = await synthetic(context, page, baseURL!, { profileRole: 'PERSONAL' });
    await page.setViewportSize({ width, height: 720 }); await page.goto('/usuarios');
    await expect(page.getByText('Ana Prueba', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Buscar por nombre o correo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar usuario' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Suspender acceso' })).toHaveCount(1);
    const open = page.getByRole('button', { name: 'Nuevo usuario' }); await open.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Nuevo personal' })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Nuevo cliente' }).focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('textbox', { name: /^Nombre/ })).toBeFocused();
    await firstLabelFits(page);
    await page.keyboard.press('Tab'); await expect(dialog.getByRole('textbox', { name: /^Correo/ })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(dialog.getByRole('textbox', { name: 'Teléfono' })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: 'Crear cliente' })).toBeFocused();
    await page.keyboard.press('Enter'); await expect(dialog).toBeVisible();
    expect(await dialog.getByRole('textbox', { name: /^Nombre/ }).evaluate(input => (input as HTMLInputElement).validity.valueMissing)).toBe(true);
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(open).toBeFocused();
    await noDocumentOverflow(page); await cleanEvidence(evidence);
  });
}
test('Usuarios 375x400 mantiene filas, desplazamiento local y paginación alcanzable', async ({ context, page, baseURL }, testInfo) => {
  const evidence = await synthetic(context, page, baseURL!);
  await page.setViewportSize({ width: 375, height: 400 }); await page.goto('/usuarios');
  await expect(page.getByText('Ana Prueba', { exact: true })).toBeVisible();
  const table = page.getByRole('table');
  expect(await table.evaluate(element => {
    const region = element.parentElement!;
    return region.clientHeight > 0 && region.scrollWidth > region.clientWidth;
  })).toBe(true);
  for (const name of ['Usuario', 'Roles', 'Teléfono', 'Estatus', 'Fecha', 'Acciones']) {
    const heading = page.getByRole('columnheader', { name });
    await heading.scrollIntoViewIfNeeded(); await expect(heading).toBeVisible();
  }
  await expect(page.getByText('ana@example.invalid', { exact: true })).toBeVisible();
  await expect(page.getByText('Sin teléfono', { exact: true })).toBeVisible();
  await table.evaluate(element => { element.parentElement!.scrollLeft = element.parentElement!.scrollWidth; });
  await page.getByRole('button', { name: 'Editar usuario' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Editar usuario' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to next page' }).scrollIntoViewIfNeeded();
  await expect(page.getByText('Filas por página')).toBeVisible();
  await noDocumentOverflow(page);
  await testInfo.attach('usuarios-375x400-candidato', { body: await page.screenshot({ fullPage: true, animations: 'disabled' }), contentType: 'image/png' });
  await cleanEvidence(evidence);
});
test('Usuarios comunica PATCH exitoso y posterior GET fallido sin reintentar la escritura', async ({ context, page, baseURL }) => {
  const evidence = await synthetic(context, page, baseURL!); await page.goto('/usuarios');
  await page.getByRole('button', { name: 'Suspender acceso' }).click();
  await expect(page.getByText('Estatus actualizado. No se pudo actualizar la lista; reintenta la carga.')).toBeVisible();
  await expect(page.getByText('No se pudo actualizar el estatus.')).toHaveCount(0);
  expect(evidence.calls.filter(call => call.startsWith('PATCH '))).toHaveLength(1);
  evidence.recover(); await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('Ana Prueba', { exact: true })).toBeVisible();
  expect(evidence.calls.filter(call => call.startsWith('PATCH '))).toHaveLength(1);
  await cleanEvidence(evidence);
});
test('Usuarios consume 401 retrasado y conserva invalidación de sesión y ruta de acceso', async ({ context, page, baseURL }) => {
  const pending = deferredRead(); const evidence = await synthetic(context, page, baseURL!, { state: '401', deferred: pending.promise });
  await page.goto('/usuarios'); await expect(page.getByRole('progressbar')).toBeVisible();
  pending.release(); await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => localStorage.getItem('feelingpilates.token'))).toBeNull();
  await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toHaveCount(0);
  await expect(page.getByText('No se pudieron cargar los usuarios.')).toHaveCount(0);
  await cleanEvidence(evidence);
});
