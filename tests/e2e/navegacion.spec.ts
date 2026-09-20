import { expect, test } from '@playwright/test';
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { activities, pageOf, user } from '../fixtures/regression';

const artifacts = '/tmp/feelingpilates-web-ux-m03/source-correction1';
const token = 'm03-synthetic-only';
const observations: unknown[] = [];

async function syntheticShell(context: BrowserContext, page: Page, baseURL: string, nombre = user().nombre) {
  const profile = user({ nombre, roles: ['SUPER_ADMIN'], permisos: ['actividades.leer', 'actividades.gestionar', 'venta.registrar.vista', 'venta.gestion.vista', 'venta.servicios.vista'] });
  const rows = Array.from({ length: 35 }, (_, index) => user({ id: `m03-${index}`, nombre: `Cliente ${index} Nombre sintético extenso para comprobar columnas locales`, correo: `cliente${index}.sintetico.largo@example.invalid`, roles: ['CLIENTE'], estatus: 'activo' }));
  const assets = new Set(['/favicon.svg', '/icons.svg']);
  const unexpected: string[] = [], errors: string[] = [], calls: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (url.origin === baseURL && method === 'GET' && !url.search) {
      if (request.resourceType() === 'document' && ['/', '/login', '/usuarios', '/actividades'].includes(url.pathname)) {
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
    if (method === 'GET' && url.origin === 'https://api.test.invalid' && request.headers().authorization === `Bearer ${token}`) {
      const path = url.pathname;
      let json: unknown;
      if (path === '/api/admin/usuarios') {
        const query = Object.fromEntries(url.searchParams);
        const valid = Object.keys(query).every(key => ['page', 'size', 'sort', 'rol', 'busqueda'].includes(key)) && /^\d+$/.test(query.page ?? '') && query.size === '10' && /^nombre,(asc|desc)$/.test(query.sort ?? '') && (!query.rol || ['SUPER_ADMIN', 'ADMIN', 'PERSONAL', 'INSTRUCTOR', 'CLIENTE', 'OTRO'].includes(query.rol));
        if (valid) {
          const selected = rows.filter(row => (!query.rol || row.roles.includes(query.rol)) && (!query.busqueda || row.nombre.toLowerCase().includes(query.busqueda.toLowerCase())));
          const number = Number(query.page);
          json = pageOf(selected.slice(number * 10, (number + 1) * 10), { number, size: 10, totalElements: selected.length, totalPages: Math.ceil(selected.length / 10) });
        }
      } else if (!url.search) {
        if (path === '/api/usuarios/me') json = profile;
        else if (path === '/api/permisos') json = profile.permisos.map(codigo => ({ codigo, descripcion: codigo, categoria: 'TEST' }));
        else if (path === '/api/admin/usuarios/conteo-roles') json = ['SUPER_ADMIN', 'ADMIN', 'PERSONAL', 'INSTRUCTOR', 'CLIENTE', 'OTRO'].map(rol => ({ rol, total: rol === 'CLIENTE' ? rows.length : 0 }));
        else if (path === '/api/tipos-actividad') json = activities;
        else if (path === '/api/tipos-recurso') json = [{ id: 'r1', nombre: 'Reformer', descripcion: null, activo: true }];
        else if (['/api/salones', ...activities.map(activity => `/api/tipos-actividad/${activity.id}/recursos`)].includes(path)) json = [];
      }
      if (json !== undefined) { calls.push(url.pathname + url.search); await route.fulfill({ json }); return; }
    }
    unexpected.push(`${method} ${url.href}`); await route.abort('blockedbyclient');
  });
  await context.addInitScript(value => localStorage.setItem('feelingpilates.token', value), token);
  return {
    calls,
    clean: async (name: string) => {
      await mkdir(artifacts, { recursive: true });
      await writeFile(`${artifacts}/${name}-observations.json`, JSON.stringify({ observations, calls, unexpected, errors }, null, 2));
      expect.soft(unexpected, 'Toda solicitud no prevista se abortó y falla la prueba').toEqual([]);
      expect.soft(errors, 'Errores de consola/página').toEqual([]);
    },
  };
}

async function reach(page: Page, target: Locator, reverse = false) {
  for (let index = 0; index < 140; index++) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press(reverse ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`No alcanzable mediante teclado: ${await target.getAttribute('aria-label') ?? await target.textContent()}`);
}
async function activate(page: Page, target: Locator, key = 'Enter') {
  await reach(page, target); await page.keyboard.press(key);
}
async function openShell(page: Page) {
  await activate(page, page.getByRole('button', { name: 'Abrir navegación', exact: true }));
  await expect.poll(async () => (await page.getByRole('navigation', { name: 'Navegación principal', exact: true }).boundingBox())?.x).toBe(0);
}
async function intersection(target: Locator, owner?: Locator) {
  const box = await target.boundingBox(); expect(box).not.toBeNull();
  const boundary = owner ? await owner.boundingBox() : await target.page().evaluate(() => ({ x: 0, y: 0, width: innerWidth, height: innerHeight }));
  expect(boundary).not.toBeNull();
  expect(box!.x + box!.width).toBeGreaterThan(boundary!.x);
  expect(box!.x).toBeLessThan(boundary!.x + boundary!.width);
  expect(box!.y + box!.height).toBeGreaterThan(boundary!.y);
  expect(box!.y).toBeLessThan(boundary!.y + boundary!.height);
}
async function geometry(page: Page, width: number, desktopOpen: boolean) {
  const navWidth = width < 600 ? 0 : desktopOpen ? 240 : 72;
  await expect.poll(async () => page.locator('main').evaluate(element => element.getBoundingClientRect().width)).toBe(width - navWidth);
  const state = await page.evaluate(() => {
    const bounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom, width: rect.width, client: element.clientWidth, scroll: element.scrollWidth };
    };
    const toolbar = document.querySelector('.MuiToolbar-root')!;
    const controls = [...toolbar.querySelectorAll('button,input')].filter(element => element.getBoundingClientRect().width && getComputedStyle(element).visibility !== 'hidden').map(bounds);
    return { width: innerWidth, document: bounds(document.documentElement), main: bounds(document.querySelector('main')!), toolbar: bounds(toolbar), controls, navCount: document.querySelectorAll('nav#navegacion-principal').length, bodyOverflow: getComputedStyle(document.body).overflow };
  });
  observations.push({ scene: 'geometry', state });
  for (const region of [state.document, state.main, state.toolbar]) expect(region.scroll - region.client).toBeLessThanOrEqual(1);
  for (const control of state.controls) {
    expect(control.x).toBeGreaterThanOrEqual(state.main.x - 1);
    expect(control.right).toBeLessThanOrEqual(width + 1);
    expect(control.width).toBeGreaterThan(0);
  }
  expect(state.width).toBe(width);
  expect(state.navCount).toBeLessThanOrEqual(1);
}
async function snap(page: Page, name: string) {
  await mkdir(artifacts, { recursive: true });
  await page.screenshot({ path: `${artifacts}/${name}.png`, fullPage: true });
}
async function focusRing(page: Page, target: Locator, name: string) {
  await reach(page, target);
  const state = await target.evaluate(element => {
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    const rgb = (color: string) => (color.match(/[\d.]+/g) ?? []).map(Number);
    const ancestors: Element[] = [];
    for (let node = element.parentElement; node; node = node.parentElement) ancestors.push(node);
    let background = [255, 255, 255];
    for (const node of [...ancestors].reverse()) {
      const color = rgb(getComputedStyle(node).backgroundColor), alpha = color[3] ?? 1;
      background = background.map((channel, index) => (color[index] ?? 0) * alpha + channel * (1 - alpha));
    }
    const luminance = (color: number[]) => color.slice(0, 3).map(channel => {
      const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const a = luminance(rgb(style.outlineColor)), b = luminance(background);
    const extent = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
    const clips = ancestors.filter(node => {
      const s = getComputedStyle(node); return [s.overflowX, s.overflowY].some(value => ['auto', 'scroll', 'hidden', 'clip'].includes(value));
    }).map(node => {
      const box = node.getBoundingClientRect();
      return { left: rect.left - extent >= box.left - 1, right: rect.right + extent <= box.right + 1, top: rect.top - extent >= box.top - 1, bottom: rect.bottom + extent <= box.bottom + 1 };
    });
    return { focusVisible: element.matches(':focus-visible'), width: Number.parseFloat(style.outlineWidth), offset: Number.parseFloat(style.outlineOffset), color: style.outlineColor, contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), clips };
  });
  observations.push({ scene: 'native-keyboard-focus-ring', name, state });
  expect(state.focusVisible).toBe(true); expect(state.width).toBeGreaterThanOrEqual(2); expect(state.contrast).toBeGreaterThanOrEqual(3);
  expect(state.clips.every(clip => clip.left && clip.right && clip.top && clip.bottom)).toBe(true);
  await snap(page, `focus-${name}`);
}
async function closeMobile(page: Page) {
  await page.keyboard.press('Escape');
  const exiting = await page.locator('#navegacion-principal').evaluate(element => ({ inert: element.hasAttribute('inert'), hidden: element.getAttribute('aria-hidden') }));
  expect(exiting).toEqual({ inert: true, hidden: 'true' });
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !document.activeElement?.closest('#navegacion-principal'))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('dialog', { name: 'Navegación principal', exact: true })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Navegación principal', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir navegación', exact: true })).toBeFocused();
}

test('shell real 375/768/1440 contiene controles y conserva scroll local de tablas', async ({ context, page, request, baseURL }) => {
  test.setTimeout(120_000); observations.length = 0;
  const app = await syntheticShell(context, page, baseURL!);
  try {
    const readiness = process.env.WEB_UX_TEST_READY; expect(readiness).toBeTruthy();
    const ready = await request.get(`/__test_ready/${readiness}`);
    expect(ready.status()).toBe(200); expect(await ready.text()).toBe(`web-ux test child ready ${readiness}`);
    for (const path of ['/actividades', '/usuarios']) for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 720 }); await page.goto(path);
      await expect(page.getByRole('heading', { name: path === '/usuarios' ? 'Usuarios' : 'Actividades', exact: true })).toBeVisible();
      await expect(page.getByRole('row', { name: path === '/usuarios' ? /Cliente 0 Nombre/ : /Pilates/ })).toBeVisible();
      await geometry(page, width, false); await snap(page, `${path.slice(1)}-${width}-closed`);
      await openShell(page);
      const nav = page.getByRole('navigation', { name: 'Navegación principal', exact: true });
      await expect.poll(async () => (await nav.boundingBox())!.width).toBe(240);
      await geometry(page, width, true); await snap(page, `${path.slice(1)}-${width}-open`);
      if (width < 600) await closeMobile(page);
      else await activate(page, page.getByRole('button', { name: 'Cerrar navegación', exact: true }));
      await geometry(page, width, false);
      if (path === '/usuarios') {
        const scroll = page.locator('table').locator('..');
        const region = await scroll.boundingBox(); expect(region).not.toBeNull();
        await page.mouse.move(region!.x + region!.width / 2, region!.y + region!.height / 2);
        await page.mouse.wheel(5000, 5000);
        await expect.poll(() => scroll.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
        const edit = page.getByRole('button', { name: 'Editar usuario', exact: true }).last();
        await reach(page, edit); await intersection(edit, scroll); await intersection(edit);
        const actions = page.getByRole('columnheader', { name: 'Acciones', exact: true });
        await intersection(actions, scroll);
        const pagination = page.locator('.MuiTablePagination-root');
        const next = pagination.getByRole('button', { name: 'Go to next page' });
        await reach(page, next); await intersection(next, pagination); await intersection(next);
        observations.push({ scene: 'local-table-reach', width, state: await scroll.evaluate(element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight, left: element.scrollLeft, top: element.scrollTop })) });
        await geometry(page, width, false);
      }
    }
    expect(app.calls).toContain('/api/usuarios/me');
  } finally { await app.clean('geometry'); }
});

test('móvil teclado modal, disclosures, current/hrefs, Escape/backdrop/destino restauran foco', async ({ context, page, baseURL }) => {
  test.setTimeout(120_000); observations.length = 0;
  const app = await syntheticShell(context, page, baseURL!);
  try {
    await page.setViewportSize({ width: 375, height: 720 }); await page.goto('/actividades');
    await expect(page.getByRole('row', { name: /Pilates/ })).toBeVisible();
    const trigger = page.getByRole('button', { name: 'Abrir navegación', exact: true });
    await focusRing(page, trigger, 'header-mobile');
    await openShell(page);
    const dialog = page.getByRole('dialog', { name: 'Navegación principal', exact: true });
    const nav = page.getByRole('navigation', { name: 'Navegación principal', exact: true });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    expect(await page.locator('main').evaluate(element => !!element.closest('[aria-hidden="true"]'))).toBe(true);
    expect(await page.locator('main button[aria-expanded]').getAttribute('aria-expanded')).toBe('true');
    expect(await page.locator('main button[aria-expanded]').getAttribute('aria-controls')).toBe(await nav.getAttribute('id'));
    for (const group of ['Usuarios', 'Reservas', 'Ventas']) {
      const toggle = nav.getByRole('button', { name: `Mostrar opciones de ${group}`, exact: true });
      await expect(toggle).not.toHaveAttribute('aria-controls');
      await activate(page, toggle, group === 'Reservas' ? 'Space' : 'Enter');
      const expandedToggle = nav.getByRole('button', { name: `Ocultar opciones de ${group}`, exact: true });
      await expect(expandedToggle).toHaveAttribute('aria-expanded', 'true');
      const childrenId = await expandedToggle.getAttribute('aria-controls');
      expect(childrenId).not.toBeNull();
      await expect(page.locator(`[id="${childrenId}"]`)).toHaveCount(1);
      await expect(page).toHaveURL('/actividades');
    }
    expect(await nav.getByRole('link').evaluateAll(elements => elements.map(element => element.getAttribute('href')))).toEqual([
      '/', '/usuarios', '/roles', '/salones', '/actividades', '/reservas/agregar', '/reservas/lista-espera', '/reservas/cancelaciones', '/reservas/configuraciones', '/ventas/nueva', '/ventas/gestion', '/ventas/servicios',
    ]);
    await expect(nav.getByRole('link', { name: 'Actividades', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Mi perfil', exact: true })).not.toHaveAttribute('aria-current');
    const tabbableCount = await nav.locator('a,button').count();
    for (const key of ['Tab', 'Shift+Tab']) for (let index = 0; index < tabbableCount + 3; index++) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    const toggle = nav.getByRole('button', { name: 'Ocultar opciones de Usuarios', exact: true });
    await focusRing(page, toggle, 'disclosure-mobile');
    const id = (await toggle.getAttribute('aria-controls'))!;
    await page.keyboard.press('Space');
    await expect(nav.getByRole('button', { name: 'Mostrar opciones de Usuarios', exact: true })).not.toHaveAttribute('aria-controls');
    const exiting = await page.locator(`[id="${id}"]`).evaluate(element => ({ inert: element.hasAttribute('inert'), hidden: element.getAttribute('aria-hidden'), links: [...element.querySelectorAll('a')].map(link => link.tabIndex) }));
    expect(exiting).toEqual({ inert: true, hidden: 'true', links: [-1, -1] });
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('[inert]') === null)).toBe(true);
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Roles y permisos', exact: true })).toHaveCount(0);
    await activate(page, nav.getByRole('button', { name: 'Mostrar opciones de Usuarios', exact: true }));
    await expect.poll(() => page.locator(`[id="${id}"]`).evaluate(element => {
      const lastLink = [...element.querySelectorAll('a')].at(-1)!;
      return lastLink.getBoundingClientRect().bottom - element.closest('.MuiCollapse-root')!.getBoundingClientRect().bottom;
    })).toBeLessThanOrEqual(1);
    await focusRing(page, nav.getByRole('button', { name: 'Usuarios', exact: true }), 'group-mobile');
    await activate(page, nav.getByRole('button', { name: 'Usuarios', exact: true }));
    await expect(page).toHaveURL('/usuarios'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
    await openShell(page);
    await expect(nav.getByRole('button', { name: 'Usuarios', exact: true })).toHaveAttribute('aria-current', 'page');
    await activate(page, nav.getByRole('link', { name: 'Gestionar usuarios', exact: true }));
    await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
    await expect(page).toHaveURL('/usuarios');
    await openShell(page); await closeMobile(page);
    await openShell(page);
    const bounds = await dialog.boundingBox(); expect(bounds).not.toBeNull();
    await page.mouse.click(350, 350);
    await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
    await geometry(page, 375, false);
    await snap(page, 'mobile-keyboard-closed');
  } finally { await app.clean('keyboard'); }
});

test('misma página resize preserva rail/grupos y foco genuino sin modal obsoleto', async ({ context, page, baseURL }) => {
  test.setTimeout(120_000); observations.length = 0;
  const app = await syntheticShell(context, page, baseURL!);
  try {
    for (const preference of [false, true]) {
      await page.setViewportSize({ width: 1440, height: 720 }); await page.goto('/usuarios');
      await expect(page.getByRole('row', { name: /Cliente 0 Nombre/ })).toBeVisible();
      await focusRing(page, page.getByRole('link', { name: 'Mi perfil', exact: true }), 'rail-profile');
      if (preference) await openShell(page);
      if (preference) {
        await reach(page, page.getByRole('link', { name: 'Roles y permisos', exact: true }));
        const search = page.getByRole('combobox', { name: 'Buscar secciones', exact: true });
        await reach(page, search); await page.keyboard.press('Escape');
        const handle = await search.elementHandle();
        for (const width of [768, 375, 768, 1440]) {
          await page.setViewportSize({ width, height: 720 }); await geometry(page, width, preference);
          expect(await handle!.evaluate(element => element === document.activeElement)).toBe(true);
        }
        await reach(page, page.getByRole('link', { name: 'Mi perfil', exact: true }));
        await page.mouse.click(1100, 80); // Genuine blank content, not an injected focus operation.
        expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
        await page.setViewportSize({ width: 375, height: 720 }); await geometry(page, 375, preference);
        const bodyRetained = await page.evaluate(() => document.activeElement === document.body);
        observations.push({ scene: 'nav-blur-to-blank-before-resize', bodyRetained });
        expect(bodyRetained).toBe(true);
        await page.setViewportSize({ width: 1440, height: 720 }); await geometry(page, 1440, preference);
        await activate(page, page.getByRole('button', { name: 'Ocultar opciones de Usuarios', exact: true }));
      }
      const content = page.getByRole('textbox', { name: 'Buscar por nombre o correo', exact: true });
      await reach(page, content); const contentHandle = await content.elementHandle();
      for (const width of [768, 375, 768, 1440]) {
        await page.setViewportSize({ width, height: 720 }); await geometry(page, width, preference);
        expect(await contentHandle!.evaluate(element => element === document.activeElement)).toBe(true);
      }
      await reach(page, page.getByRole('link', { name: 'Mi perfil', exact: true }));
      for (const width of [768, 375, 768, 1440]) {
        await page.setViewportSize({ width, height: 720 }); await geometry(page, width, preference);
        if (width === 375) {
          await expect(page.getByRole('navigation', { name: 'Navegación principal', exact: true })).toHaveCount(0);
          await expect(page.getByRole('button', { name: 'Abrir navegación', exact: true })).toBeFocused();
        }
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      }
      if (preference) await expect(page.getByRole('button', { name: 'Mostrar opciones de Usuarios', exact: true })).toHaveAttribute('aria-expanded', 'false');
      await page.setViewportSize({ width: 375, height: 720 });
      await geometry(page, 375, preference);
      await openShell(page);
      if (preference) await activate(page, page.getByRole('button', { name: 'Mostrar opciones de Usuarios', exact: true }));
      await reach(page, page.getByRole('link', { name: 'Roles y permisos', exact: true }));
      await page.setViewportSize({ width: 768, height: 720 });
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('button', { name: preference ? 'Cerrar navegación' : 'Abrir navegación', exact: true })).toBeFocused();
      await geometry(page, 768, preference);
      if (preference) await expect(page.getByRole('button', { name: 'Ocultar opciones de Usuarios', exact: true })).toHaveAttribute('aria-expanded', 'true');
      for (const width of [599, 600, 599, 600, 375, 768, 1440]) {
        await page.setViewportSize({ width, height: 720 });
        await geometry(page, width, preference);
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
      for (const width of [599, 600, 599, 600]) await page.setViewportSize({ width, height: 720 });
      await geometry(page, 600, preference);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement !== document.body && !document.activeElement?.closest('[inert]'))).toBe(true);
      await snap(page, `resize-preference-${preference}`);
    }
  } finally { await app.clean('resize'); }
});

test('diálogos reales mantienen campo/trap en resize y Escape restaura su opener', async ({ context, page, baseURL }) => {
  test.setTimeout(120_000); observations.length = 0;
  const app = await syntheticShell(context, page, baseURL!);
  try {
    for (const path of ['/actividades', '/usuarios']) {
      await page.setViewportSize({ width: 1440, height: 720 }); await page.goto(path);
      await expect(page.getByRole('row', { name: path === '/usuarios' ? /Cliente 0 Nombre/ : /Pilates/ })).toBeVisible();
      await openShell(page);
      if (path === '/actividades') await activate(page, page.getByRole('button', { name: 'Mostrar opciones de Usuarios', exact: true }));
      await reach(page, page.getByRole('link', { name: 'Roles y permisos', exact: true }));
      const opener = path === '/actividades' ? page.getByRole('button', { name: 'Nueva actividad', exact: true }) : page.getByRole('button', { name: 'Editar usuario', exact: true }).first();
      const openerHandle = await opener.elementHandle();
      await activate(page, opener);
      const dialog = page.getByRole('dialog', { name: path === '/actividades' ? 'Nueva actividad' : 'Editar usuario', exact: true });
      const field = dialog.getByRole('textbox', { name: 'Nombre', exact: true });
      await expect(field).toBeFocused(); const fieldHandle = await field.elementHandle();
      await expect(page.locator('.MuiDialog-container')).toHaveCSS('opacity', '1');
      for (const width of [375, 768, 1440, 375]) {
        await page.setViewportSize({ width, height: 720 });
        expect(await fieldHandle!.evaluate(element => element === document.activeElement)).toBe(true);
        await expect(dialog).toBeVisible(); await expect(page.getByRole('dialog')).toHaveCount(1);
        await geometry(page, width, true);
        await intersection(field, dialog); await intersection(field);
        const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        await snap(page, `${path.slice(1)}-dialog-${width}`);
        observations.push({ scene: 'feature-dialog-focused-resize', path, width, focused: await fieldHandle!.evaluate(element => element === document.activeElement) });
      }
      for (const key of ['Tab', 'Shift+Tab']) for (let index = 0; index < 15; index++) {
        await page.keyboard.press(key); expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
      }
      const cancel = dialog.getByRole('button', { name: 'Cancelar', exact: true });
      await reach(page, cancel); await intersection(cancel, dialog); await intersection(cancel);
      await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
      expect(await openerHandle!.evaluate(element => element === document.activeElement)).toBe(true);
      await intersection(opener); await geometry(page, 375, true);
      await expect(page.getByRole('navigation', { name: 'Navegación principal', exact: true })).toHaveCount(0);
    }
  } finally { await app.clean('dialogs'); }
});

test('nombre largo no superpone búsqueda y popup en 375/599/600/768/1440 con ambos rails', async ({ context, page, baseURL }) => {
  test.setTimeout(120_000); observations.length = 0;
  const app = await syntheticShell(context, page, baseURL!, 'María Fernanda de los Ángeles Hernández Rodríguez de la Cruz');
  try {
    for (const preference of [true, false]) for (const width of [600, 375, 599, 768, 1440]) {
      await page.setViewportSize({ width, height: 720 });
      await page.goto('/actividades');
      await expect(page.getByRole('heading', { name: 'Actividades', exact: true })).toBeVisible();
      if (width >= 600 && preference) await openShell(page);
      await geometry(page, width, preference);
      const search = page.getByRole('combobox', { name: 'Buscar secciones', exact: true });
      await reach(page, search);
      await page.keyboard.type('USUARIO');
      await expect(search).toHaveValue('USUARIO');
      await page.keyboard.press('Escape');
      const state = await search.evaluate(element => {
        const input = element as HTMLInputElement;
        const root = input.closest('.MuiAutocomplete-root')!;
        const popup = root.querySelector('.MuiAutocomplete-popupIndicator')!;
        const bounds = (node: Element) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width };
        };
        const field = bounds(input), indicator = bounds(popup);
        const hit = document.elementFromPoint((field.x + field.right) / 2, (field.top + field.bottom) / 2);
        const welcome = document.querySelector('header .MuiTypography-root')!;
        return {
          input: field, popup: indicator, autocomplete: bounds(root),
          overlapWidth: Math.max(0, Math.min(field.right, indicator.right) - Math.max(field.x, indicator.x)),
          overlapHeight: Math.max(0, Math.min(field.bottom, indicator.bottom) - Math.max(field.top, indicator.top)),
          inputCenterOwnedByInput: hit === input,
          inputCenterHitControl: hit?.closest('button,input')?.getAttribute('aria-label'),
          typedValue: input.value,
          welcome: { width: welcome.clientWidth, scroll: welcome.scrollWidth, overflow: getComputedStyle(welcome).textOverflow },
        };
      });
      observations.push({ scene: 'long-name-search-control-separation', width, preference, state });
      await snap(page, `boundary-search-${width}-preference-${preference}`);
      expect.soft(state.overlapWidth * state.overlapHeight, 'Input y popup tienen áreas distintas').toBe(0);
      expect.soft(state.inputCenterOwnedByInput, 'Centro real del input pertenece al input').toBe(true);
      expect.soft(state.input.width, 'Espacio útil de texto junto a los adornos').toBeGreaterThanOrEqual(64);
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('listbox')).toBeVisible();
      await page.keyboard.press('Escape');
      await reach(page, search); await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/usuarios');
      await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
      await geometry(page, width, preference);
      await reach(page, page.getByRole('button', { name: 'Cerrar sesión', exact: true }));
      await intersection(page.getByRole('button', { name: 'Cerrar sesión', exact: true }));
      const menu = page.getByRole('button', { name: width >= 600 && preference ? 'Cerrar navegación' : 'Abrir navegación', exact: true });
      await reach(page, menu, true); await intersection(menu);
    }
  } finally { await app.clean('boundary-search'); }
});
