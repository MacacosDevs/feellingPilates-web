import { expect, test } from '@playwright/test';
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { user } from '../fixtures/regression';
import type { UsuarioResponse } from '../../src/api/types';

const artifactDir = '/tmp/feelingpilates-web-ux-m02/implementation';
const token = 'synthetic-token';
const roleCodes = ['SUPER_ADMIN', 'ADMIN', 'PERSONAL', 'INSTRUCTOR', 'CLIENTE', 'OTRO'];
const labels = ['Super admin', 'Admin', 'Recepción', 'Instructor', 'Cliente', 'Otro'];
const credentials = { correo: 'ana@example.invalid', contrasena: 'synthetic-only' };

// Independiente de MUI y sin redondear ni los canales compuestos ni la luminancia.
function parse(color: string): number[] {
  return color.startsWith('#') ? [1, 3, 5].map(i => Number.parseInt(color.slice(i, i + 2), 16)) : (color.match(/[\d.]+/g) ?? []).map(Number);
}
function mix(a: number[], b: number[], opacity = 1): number[] {
  const alpha = (a[3] ?? 1) * opacity;
  return a.slice(0, 3).map((v, i) => v * alpha + b[i] * (1 - alpha));
}
function luminance(rgb: number[]): number {
  return rgb.map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a: number[], b: number[]): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
async function styles(locator: Locator) {
  return locator.evaluate(el => {
    const s = getComputedStyle(el);
    return { color: s.color, background: s.backgroundColor, border: s.borderColor, borderWidth: s.borderWidth,
      outlineColor: s.outlineColor, outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineOffset: s.outlineOffset,
      font: s.font, fontFamily: s.fontFamily, opacity: s.opacity, classes: String(el.className),
      focusVisible: el.matches(':focus-visible'), disabled: el.matches(':disabled'), tag: el.tagName };
  });
}
async function composed(locator: Locator) {
  const layers = await locator.evaluate(el => {
    const list: { background: string; opacity: number }[] = [];
    for (let node: Element | null = el; node; node = node.parentElement) {
      const s = getComputedStyle(node); list.push({ background: s.backgroundColor, opacity: Number(s.opacity) });
    }
    return list;
  });
  const state = await styles(locator);
  // Paint descendants then composite each ancestor opacity as a group. This
  // catches inherited row opacity as well as translucent chip/badge backgrounds.
  let background = [255, 255, 255];
  for (const layer of [...layers].reverse()) background = mix(parse(layer.background), background);
  let foreground = mix(parse(state.color), background);
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].opacity === 1) continue;
    let behind = [255, 255, 255];
    for (const layer of layers.slice(i + 1).reverse()) behind = mix(parse(layer.background), behind);
    foreground = mix([...foreground, 1], behind, layers[i].opacity);
    background = mix([...background, 1], behind, layers[i].opacity);
  }
  return { ...state, layers, composedBackground: background, composedForeground: foreground, ratio: contrast(foreground, background) };
}
async function geometry(page: Page) {
  return page.evaluate(() => {
    const g = (el: Element | null | undefined) => {
      if (!el) return null;
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return { x: r.x, y: r.y, w: r.width, h: r.height, client: el.clientWidth, scroll: el.scrollWidth, overflowX: s.overflowX, overflowY: s.overflowY };
    };
    const table = document.querySelector('table');
    return { document: g(document.documentElement), nav: g(document.querySelector('nav')), main: g(document.querySelector('main')),
      toolbar: g(document.querySelector('.MuiToolbar-root')), content: g(document.querySelector('main')?.children[1]),
      table: g(table), tableScroll: g(table?.parentElement), tableContainer: g(document.querySelector('.MuiTableContainer-root')),
      pagination: g(document.querySelector('.MuiTablePagination-root')), paginationToolbar: g(document.querySelector('.MuiTablePagination-toolbar')) };
  });
}
async function keyboardFocus(page: Page, target: Locator) {
  // Use actual keyboard navigation: neither focus() nor injected state classes.
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate(el => el === document.activeElement)) return;
  }
  throw new Error('El control no se alcanzó por Tab');
}
async function syntheticApp(context: BrowserContext, page: Page, baseURL: string) {
  let profile = user({ roles: ['SUPER_ADMIN'], estatus: 'activo', permisos: ['actividades.leer', 'actividades.gestionar'] });
  let releaseLogin: (() => void) | undefined;
  let releaseCreate: (() => void) | undefined;
  const unexpected: string[] = [], pageErrors: string[] = [], consoleErrors: string[] = [];
  const calls: { method: string; path: string; query: string; body?: unknown }[] = [];
  const localAssets = new Set(['/favicon.svg']);
  const permissions = [
    { codigo: 'usuarios.leer', descripcion: 'Consultar usuarios', categoria: 'USUARIOS' },
    { codigo: 'roles.leer', descripcion: 'Consultar roles', categoria: 'ROLES' },
  ];
  const activities = [
    { id: 'a1', nombre: 'Pilates', descripcion: null, activo: true, duracionMinutos: 60, participantesPorReserva: 1, etiquetas: [] },
    { id: 'a2', nombre: 'Yoga', descripcion: null, activo: false, duracionMinutos: 60, participantesPorReserva: 1, etiquetas: [] },
  ];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (url.origin === baseURL && method === 'GET' && !url.search) {
      if (request.resourceType() === 'document' && ['/', '/login', '/usuarios', '/roles', '/actividades'].includes(url.pathname)) {
        const response = await route.fetch();
        const html = (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '');
        for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) localAssets.add(match[1]);
        await route.fulfill({ response, body: html }); return;
      }
      if (localAssets.has(url.pathname) && ['script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) {
        await route.continue(); return;
      }
    }
    if (method === 'GET' && url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' }); return;
    }
    if (url.origin === 'https://api.test.invalid' && url.pathname.startsWith('/api/')) {
      const path = url.pathname.slice(4);
      if (method === 'POST' && path === '/auth/login' && !url.search) {
        expect(request.postDataJSON()).toEqual(credentials);
        calls.push({ method, path, query: '', body: request.postDataJSON() });
        await new Promise<void>(resolve => { releaseLogin = resolve; });
        await route.fulfill({ json: { token, tipo: 'Bearer' } }); return;
      }
      const plainReads = ['/usuarios/me', '/permisos', '/admin/usuarios/conteo-roles', '/admin/roles', '/admin/roles/permisos', '/tipos-actividad', '/tipos-recurso', '/tipos-actividad/a1/recursos', '/tipos-actividad/a2/recursos', '/tipos-actividad/a3/recursos', '/salones'];
      const read = method === 'GET' && ((plainReads.includes(path) && !url.search) || path === '/admin/usuarios');
      const create = method === 'POST' && path === '/tipos-actividad' && !url.search;
      if (read || create) {
        expect(request.headers().authorization).toBe(`Bearer ${token}`);
        calls.push({ method, path, query: url.search, ...(create ? { body: request.postDataJSON() } : {}) });
        if (create) {
          expect(request.postDataJSON()).toEqual({ nombre: 'Fundación sintética', descripcion: null, duracionMinutos: 60, participantesPorReserva: 1, etiquetas: [] });
          await new Promise<void>(resolve => { releaseCreate = resolve; });
          const created = { id: 'a3', ...request.postDataJSON(), activo: true };
          activities.push(created); await route.fulfill({ json: created }); return;
        }
        let json: unknown;
        if (path === '/usuarios/me') json = profile;
        else if (path === '/permisos') json = profile.permisos.map(codigo => ({ codigo, descripcion: codigo, categoria: 'TEST' }));
        else if (path === '/admin/usuarios/conteo-roles') json = roleCodes.map((rol, i) => ({ rol, total: 10 - i }));
        else if (path === '/admin/usuarios') {
          const query = Object.fromEntries(url.searchParams);
          expect(Object.keys(query).every(k => ['page', 'size', 'sort', 'rol', 'busqueda'].includes(k))).toBe(true);
          expect(query.page).toBe('0'); expect(query.size).toBe('10'); expect(query.sort).toMatch(/^nombre,(asc|desc)$/);
          if (query.rol) expect(roleCodes).toContain(query.rol);
          if (query.busqueda) expect(query.busqueda).toBe('Prueba');
          const selected = query.rol ? [query.rol] : query.busqueda ? [] : roleCodes;
          json = { content: selected.map((rol, i) => ({ ...profile, id: `row-${rol}`, nombre: `${labels[roleCodes.indexOf(rol)]} Prueba`, roles: [rol],
            estatus: i === 1 ? 'suspendido' : i === 2 ? 'eliminado' : 'activo',
            rolesAsignados: rol === 'PERSONAL' ? [{ rol: 'PERSONAL', salonIds: [], salonNombres: [] }] : [] })),
            totalElements: selected.length, totalPages: 1, number: 0, size: 10 };
        }
        else if (path === '/admin/roles') json = [
          { id: 'super', nombre: 'Super admin', descripcion: null, permisos: permissions.map(p => p.codigo), editable: false },
          { id: 'admin', nombre: 'Admin', descripcion: null, permisos: ['usuarios.leer'], editable: true },
        ];
        else if (path === '/admin/roles/permisos') json = permissions;
        else if (path === '/tipos-actividad') json = activities;
        else if (path === '/tipos-recurso') json = [{ id: 'r1', nombre: 'Reformer', descripcion: null, activo: true }];
        else json = [];
        await route.fulfill({ json }); return;
      }
    }
    unexpected.push(`${method} ${url.href}`); await route.abort('blockedbyclient');
  });
  return { calls, unexpected, pageErrors, consoleErrors,
    finishLogin: () => { expect(releaseLogin).toBeTruthy(); releaseLogin!(); },
    finishCreate: () => { expect(releaseCreate).toBeTruthy(); releaseCreate!(); },
    setProfile: (next: UsuarioResponse) => { profile = next; },
    clean: () => { expect.soft(unexpected, 'Requests inesperados').toEqual([]); expect.soft(pageErrors, 'Errores de página').toEqual([]); expect.soft(consoleErrors, 'Errores de consola').toEqual([]); },
  };
}

for (const width of [375, 768, 1440]) {
  test(`fundación visual en rutas y controles reales a ${width}px`, async ({ context, page, request, baseURL }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const readiness = process.env.WEB_UX_TEST_READY;
    expect(readiness).toBeTruthy();
    const ready = await request.get(`/__test_ready/${readiness}`);
    expect(ready.status()).toBe(200); expect(await ready.text()).toBe(`web-ux test child ready ${readiness}`);
    const app = await syntheticApp(context, page, baseURL!);
    const observations: { scene: string; state: unknown }[] = [];
    async function readable(scene: string, target: Locator) {
      const state = await composed(target); observations.push({ scene, state });
      expect(state.ratio, `${scene}: contraste sin redondear`).toBeGreaterThanOrEqual(4.5);
      return state;
    }
    async function focus(scene: string, target: Locator, inset = false) {
      await keyboardFocus(page, target);
      await expect(target).toBeFocused();
      const state = await styles(target); observations.push({ scene, state });
      expect(state.focusVisible).toBe(true); expect(state.outlineStyle).toBe('solid'); expect(state.outlineWidth).toBe('2px');
      const surrounding = await composed(inset ? target : target.locator('..'));
      expect(contrast(parse(state.outlineColor), surrounding.composedBackground)).toBeGreaterThanOrEqual(3);
    }
    async function capture(scene: string) {
      observations.push({ scene: `${scene}-geometry`, state: await geometry(page) });
      await page.screenshot({ animations: 'disabled', path: `${artifactDir}/after-${scene}-${width}.png` });
    }
    try {
      await mkdir(artifactDir, { recursive: true });
      await page.goto('/login');
      const title = page.getByRole('heading', { name: 'Iniciar sesión', level: 1 });
      await expect(title).toBeVisible(); await readable('login-title', title);
      const email = page.getByRole('textbox', { name: 'Correo', exact: true });
      const input = page.locator('.MuiOutlinedInput-root').first();
      await page.mouse.move(0, 0);
      const normalOutline = await styles(input.locator('fieldset'));
      observations.push({ scene: 'field-normal', state: normalOutline });
      expect(contrast(parse(normalOutline.border), parse((await styles(input)).background))).toBeGreaterThanOrEqual(3);
      await input.hover();
      const hoverOutline = await styles(input.locator('fieldset')); observations.push({ scene: 'field-hover', state: hoverOutline });
      expect(contrast(parse(hoverOutline.border), parse((await styles(input)).background))).toBeGreaterThanOrEqual(3);
      await focus('login-button-keyboard', page.getByRole('button', { name: 'Ingresar', exact: true }));
      await capture('login');
      await email.fill(credentials.correo); await page.getByLabel(/^Contraseña/).fill(credentials.contrasena);
      await email.focus();
      const focusedOutline = await styles(input.locator('fieldset')); observations.push({ scene: 'field-focused', state: focusedOutline });
      expect(focusedOutline.borderWidth).toBe('2px'); expect(contrast(parse(focusedOutline.border), parse((await styles(input)).background))).toBeGreaterThanOrEqual(3);
      await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
      const pendingLogin = page.getByRole('button', { name: 'Ingresando...', exact: true });
      await expect(pendingLogin).toBeDisabled(); observations.push({ scene: 'login-pending-exempt', state: await styles(pendingLogin) });
      await expect.poll(() => app.calls.filter(c => c.path === '/auth/login').length).toBe(1);
      app.finishLogin(); await expect(page).toHaveURL('/');
      await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue('Ana Prueba');
      await page.goto('/usuarios'); await expect(page.getByRole('heading', { name: 'Usuarios', level: 1 })).toBeVisible();
      const todos = page.getByRole('button', { name: /^Todos / });
      await readable('Todos-selected-label', todos.locator('.MuiChip-label span').first());
      await readable('Todos-selected-count', todos.locator('.MuiChip-label span').last());
      await focus('shell-menu-keyboard', page.getByRole('button', { name: 'Abrir navegación', exact: true }));
      await capture('usuarios');
      for (let i = 0; i < roleCodes.length; i++) {
        const chip = page.getByRole('button', { name: new RegExp(`^${labels[i]} ${10 - i}$`) });
        await readable(`${roleCodes[i]}-unselected-label`, chip.locator('.MuiChip-label span').first());
        await readable(`${roleCodes[i]}-unselected-count`, chip.locator('.MuiChip-label span').last());
        await chip.hover(); await page.waitForTimeout(320);
        await readable(`${roleCodes[i]}-hover-unselected`, chip.locator('.MuiChip-label span').first());
        await chip.click(); await page.waitForTimeout(320);
        await readable('Todos-unselected-label', todos.locator('.MuiChip-label span').first());
        await readable('Todos-unselected-count', todos.locator('.MuiChip-label span').last());
        await readable(`${roleCodes[i]}-selected-label`, chip.locator('.MuiChip-label span').first());
        await readable(`${roleCodes[i]}-selected-count`, chip.locator('.MuiChip-label span').last());
        await readable(`${roleCodes[i]}-selected-hover`, chip.locator('.MuiChip-label span').first());
        await focus(`${roleCodes[i]}-selected-keyboard`, chip);
        await expect.poll(() => app.calls.some(c => c.path === '/admin/usuarios' && new URLSearchParams(c.query).get('rol') === roleCodes[i])).toBe(true);
        await chip.click(); await page.waitForTimeout(320);
        await readable(`${roleCodes[i]}-deselected-label`, chip.locator('.MuiChip-label span').first());
      }
      await expect(page.locator('tbody tr')).toHaveCount(6);
      await page.mouse.move(0, 0); await page.waitForTimeout(320);
      for (const target of await page.locator('tbody .MuiChip-root, tbody .MuiAvatar-root').all()) await readable('table-role-avatar-status', target);
      for (const target of await page.getByText('Sin teléfono', { exact: true }).all()) await readable('phone-information', target);
      const row = page.locator('tbody tr').first(); await row.hover();
      for (const target of await row.locator('.MuiChip-root, .MuiAvatar-root, .MuiTypography-root').all()) await readable('table-hover-information', target);
      await focus('sort-keyboard', page.getByRole('button', { name: 'Usuario', exact: true }));
      await page.getByRole('button', { name: 'Usuario', exact: true }).click();
      await expect.poll(() => app.calls.some(c => c.query.includes('sort=nombre,asc'))).toBe(true);
      // Reach actual rightmost columns through the existing inner scroll owner.
      const scroll = page.locator('table').locator('..');
      observations.push({ scene: 'table-horizontal-reach', state: await scroll.evaluate(el => { el.scrollLeft = el.scrollWidth; return { scrollLeft: el.scrollLeft, max: el.scrollWidth - el.clientWidth }; }) });
      await expect(page.getByRole('columnheader', { name: 'Acciones' })).toBeVisible();
      await scroll.evaluate(el => { el.scrollLeft = 0; });
      const pagination = page.locator('.MuiTablePagination-root');
      observations.push({ scene: 'pagination-horizontal-reach', state: await pagination.evaluate(el => { el.scrollLeft = el.scrollWidth; return { scrollLeft: el.scrollLeft, max: el.scrollWidth - el.clientWidth }; }) });
      for (const button of await pagination.locator('button').all()) await expect(button).toBeDisabled();
      await pagination.evaluate(el => { el.scrollLeft = 0; });
      await page.getByRole('button', { name: 'Abrir navegación', exact: true }).click();
      await page.waitForFunction(() => Math.abs(document.querySelector('#navegacion-principal')!.getBoundingClientRect().width - 240) < 0.1);
      if (width === 375) await page.waitForFunction(() => Math.abs(document.querySelector('#navegacion-principal')!.getBoundingClientRect().x) < 0.1);
      await capture('shell-open');
      if (width === 375) {
        await expect(page.getByRole('dialog', { name: 'Navegación principal', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: 'Navegación principal', exact: true })).toHaveCount(0);
        await expect(page.getByRole('navigation', { name: 'Navegación principal', exact: true })).toHaveCount(0);
        const trigger = page.getByRole('button', { name: 'Abrir navegación', exact: true });
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await page.waitForFunction(() => Math.abs(document.querySelector('main')!.getBoundingClientRect().width - 375) < 0.1 && document.documentElement.clientWidth === 375 && document.documentElement.scrollWidth === 375);
      } else {
        await page.getByRole('button', { name: 'Cerrar navegación', exact: true }).click();
        await page.waitForFunction(() => Math.abs(document.querySelector('#navegacion-principal')!.getBoundingClientRect().width - 72) < 0.1);
      }
      // The existing required empty role assignment supplies real error states.
      const personal = page.getByRole('row', { name: /Recepción Prueba/ });
      await personal.getByRole('button', { name: 'Editar usuario', exact: true }).click();
      const edit = page.getByRole('dialog', { name: 'Editar usuario', exact: true });
      const errorInput = edit.getByRole('combobox', { name: /Salón — Recepción/ });
      await expect(errorInput).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('.MuiDialog-container')).toHaveCSS('opacity', '1');
      await readable('field-error-label', edit.locator('.MuiInputLabel-root.Mui-error'));
      await errorInput.focus();
      const errorRoot = edit.locator('.MuiOutlinedInput-root.Mui-error');
      const errorOutline = await styles(errorRoot.locator('fieldset')); observations.push({ scene: 'field-error-focused', state: errorOutline });
      expect(errorOutline.border).toBe('rgb(211, 47, 47)'); expect(errorOutline.borderWidth).toBe('2px');
      expect(contrast(parse(errorOutline.border), parse((await styles(errorRoot)).background))).toBeGreaterThanOrEqual(3);
      await capture('dialog-field-error'); await edit.getByRole('button', { name: 'Cancelar', exact: true }).click();
      const search = page.getByPlaceholder('Buscar por nombre o correo');
      const placeholder = await search.evaluate(el => {
        const style = getComputedStyle(el, '::placeholder');
        return { color: style.color, opacity: Number(style.opacity) };
      });
      const searchSurface = (await composed(search)).composedBackground;
      const placeholderRatio = contrast(mix(parse(placeholder.color), searchSurface, placeholder.opacity), searchSurface);
      observations.push({ scene: 'enabled-search-placeholder', state: { ...placeholder, ratio: placeholderRatio, composedBackground: searchSurface } });
      expect(placeholderRatio).toBeGreaterThanOrEqual(4.5);
      await search.fill(' Prueba ');
      await expect(page.getByText('No hay usuarios que coincidan con este filtro')).toBeVisible();
      await readable('shared-table-empty', page.getByText('No hay usuarios que coincidan con este filtro'));
      await search.fill(''); await expect(page.locator('tbody tr')).toHaveCount(6);
      await page.goto('/roles');
      await expect(page.getByRole('heading', { name: 'Roles y permisos', level: 1 })).toBeVisible();
      const category = page.getByRole('button', { name: /^Usuarios 1\/1$/ });
      await category.click();
      await focus('native-category-keyboard', category, true); await category.hover(); await readable('native-category-selected-hover', category);
      for (const text of await category.locator('.MuiTypography-root').all()) await readable('native-category-label-count', text);
      await expect(page.getByRole('switch')).toBeDisabled();
      await page.getByRole('tab', { name: 'Admin', exact: true }).click();
      await expect(page.getByRole('switch')).toBeEnabled(); await expect(page.getByRole('button', { name: 'Guardar cambios', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: /^Roles 0\/1$/ }).click();
      await readable('native-category-selected', page.getByRole('button', { name: /^Roles 0\/1$/ }));
      await capture('roles');
      await page.getByRole('button', { name: 'Nuevo rol', exact: true }).click();
      const roleDialog = page.getByRole('dialog', { name: 'Nuevo rol', exact: true });
      await expect(roleDialog.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
      observations.push({ scene: 'role-create-disabled-exempt', state: await styles(roleDialog.getByRole('button', { name: 'Guardar', exact: true })) });
      await page.keyboard.press('Escape'); await expect(roleDialog).toHaveCount(0);
      await page.goto('/actividades');
      await expect(page.getByRole('heading', { name: 'Actividades', level: 1 })).toBeVisible();
      const inactive = page.getByRole('row', { name: /Yoga/ });
      await readable('inactive-name', inactive.locator('td').first());
      await readable('inactive-resources', inactive.getByText('Sin recursos requeridos'));
      await readable('inactive-status', inactive.getByText('Inactiva', { exact: true }));
      await inactive.hover(); await readable('inactive-hover-name', inactive.locator('td').first());
      for (const button of await inactive.getByRole('button').all()) await expect(button).toBeEnabled();
      await capture('actividades');
      const newActivity = page.getByRole('button', { name: 'Nueva actividad', exact: true });
      await newActivity.click(); const dialog = page.getByRole('dialog', { name: 'Nueva actividad', exact: true });
      await expect(dialog.getByRole('textbox', { name: 'Nombre', exact: true })).toBeFocused();
      await expect(page.locator('.MuiDialog-container')).toHaveCSS('opacity', '1');
      await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
      await readable('dialog-local-error', dialog.getByRole('alert'));
      expect(app.calls.filter(c => c.path === '/tipos-actividad' && c.method === 'POST')).toEqual([]);
      await capture('dialog-error');
      await dialog.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Fundación sintética');
      await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
      const pending = dialog.getByRole('button', { name: 'Guardando…', exact: true });
      await expect(pending).toBeDisabled(); observations.push({ scene: 'activity-pending-exempt', state: await styles(pending) });
      await expect.poll(() => app.calls.filter(c => c.path === '/tipos-actividad' && c.method === 'POST').length).toBe(1);
      app.finishCreate(); await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('row', { name: /Fundación sintética/ })).toBeVisible();
      await expect(newActivity).toBeFocused();
      await page.getByRole('row', { name: /Pilates/ }).getByRole('button', { name: 'Configurar recursos', exact: true }).click();
      const resources = page.getByRole('dialog', { name: 'Recursos de «Pilates»' });
      await expect(resources.getByRole('button', { name: 'Crear', exact: true })).toBeDisabled();
      observations.push({ scene: 'resource-create-disabled-exempt', state: await styles(resources.getByRole('button', { name: 'Crear', exact: true })) });
      await capture('dialog-disabled'); await resources.getByRole('button', { name: 'Cancelar', exact: true }).click();
      app.setProfile(user({ roles: ['PERSONAL'], permisos: ['actividades.leer'] }));
      await page.reload(); await expect(page.getByRole('row', { name: /Pilates/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Acciones' })).toHaveCount(0); await expect(newActivity).toHaveCount(0);
      app.setProfile(user({ roles: ['PERSONAL'], permisos: [] }));
      await page.reload(); await expect(page.getByRole('heading', { name: 'Actividades', level: 1 })).toBeVisible();
      await expect(page.getByRole('table')).toHaveCount(0); await readable('no-read-warning-information', page.getByRole('alert'));
    } finally {
      app.clean();
      await writeFile(`${artifactDir}/routed-runtime-${width}.json`, JSON.stringify({ width, observations, calls: app.calls,
        unexpected: app.unexpected, pageErrors: app.pageErrors, consoleErrors: app.consoleErrors }, null, 2));
    }
  });
}
