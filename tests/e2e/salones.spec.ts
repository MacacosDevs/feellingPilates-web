import { expect, test } from '@playwright/test';
import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { activities, salon, user } from '../fixtures/regression';
import type { SalonRequest, UsuarioResponse } from '../../src/api/types';

const api = 'https://api.test.invalid/api';
const token = 'synthetic-salones-token';
function gate() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve; }); return { promise, release }; }
const listItem = (i: number) => ({ id: `s${i}`, nombre: i === 1 ? 'Sede Prueba' : `Z Salón ${String(i).padStart(2, '0')}`, direccion: `${i} Avenida Pilates`, estadoId: 1, estadoNombre: 'Querétaro', municipioId: 10, municipioNombre: 'Centro', creadoEn: '2026-01-02T12:00:00Z' });

async function syntheticApp(context: BrowserContext, page: Page, baseURL: string, profile: UsuarioResponse = user()) {
  const unexpected: string[] = [], pageErrors: string[] = [];
  const consoleErrors: { text: string; url: string }[] = [];
  const failures: { url: string; status: number }[] = [];
  const calls: { method: string; path: string; body?: unknown }[] = [];
  const holds: ReturnType<typeof gate>[] = [];
  let listMode: 'populated' | 'empty' | 'error' = 'populated';
  let listGate: ReturnType<typeof gate> | null = null, detailGate: ReturnType<typeof gate> | null = null, saveGate: ReturnType<typeof gate> | null = null;
  let failDetail = false, failSave = false, failRefresh = false, failCatalogWrite = false;
  const failedCatalogs = new Set<string>();
  let detail = salon();
  const resources = [{ id: 'r1', nombre: 'Reformer', descripcion: null, activo: true }, { id: 'r2', nombre: 'Tapete', descripcion: null, activo: true }];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
  await context.addInitScript(value => localStorage.setItem('feelingpilates.token', value), token);
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (url.origin === baseURL && method === 'GET') {
      if (request.resourceType() === 'document' && ['/', '/salones'].includes(url.pathname)) {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '') }); return;
      }
      if (['script', 'stylesheet', 'image', 'font'].includes(request.resourceType()) && (/^\/assets\/[a-zA-Z0-9_.-]+$/.test(url.pathname) || url.pathname === '/favicon.svg')) {
        await route.fulfill({ response: await route.fetch() }); return;
      }
    }
    if (method === 'GET' && url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' }); return;
    }
    const path = url.origin === new URL(api).origin && url.pathname.startsWith('/api/') ? url.pathname.slice(4) : '';
    const reads = ['/usuarios/me', '/permisos', '/salones', '/salones/s1', '/ubicaciones/estados', '/ubicaciones/estados/1/municipios', '/tipos-actividad', '/tipos-recurso'];
    const allowed = !url.search && ((method === 'GET' && reads.includes(path)) || (method === 'POST' && ['/salones', '/tipos-actividad', '/tipos-recurso'].includes(path)) || (method === 'PUT' && path === '/salones/s1'));
    if (!allowed) { unexpected.push(`${method} ${url.href}`); await route.abort('blockedbyclient'); return; }
    expect(request.headers().authorization).toBe(`Bearer ${token}`);
    const body = method !== 'GET' ? request.postDataJSON() as SalonRequest : undefined;
    calls.push({ method, path, ...(body ? { body } : {}) });
    async function fail(status = 503) { failures.push({ url: url.href, status }); await route.fulfill({ status, json: { message: status === 409 ? 'Nombre no disponible' : 'Fallo sintético de lectura' } }); }
    if (method === 'GET') {
      if (path === '/usuarios/me') { await route.fulfill({ json: profile }); return; }
      if (path === '/permisos') { await route.fulfill({ json: [] }); return; }
      if (path === '/salones') {
        if (listGate) { const hold = listGate; listGate = null; await hold.promise; }
        if (listMode === 'error' || failRefresh) { await fail(); return; }
        await route.fulfill({ json: listMode === 'empty' ? [] : Array.from({ length: 12 }, (_, i) => listItem(i + 1)) }); return;
      }
      if (path === '/salones/s1') {
        if (detailGate) { const hold = detailGate; detailGate = null; await hold.promise; }
        if (failDetail) { await fail(); return; }
        await route.fulfill({ json: detail }); return;
      }
      if (failedCatalogs.has(path)) { await fail(); return; }
      const json = path === '/ubicaciones/estados' ? [{ id: 1, nombre: 'Querétaro' }] : path === '/ubicaciones/estados/1/municipios' ? [{ id: 10, estadoId: 1, nombre: 'Centro' }] : path === '/tipos-actividad' ? activities : resources;
      await route.fulfill({ json }); return;
    }
    if (path === '/salones' || path === '/salones/s1') {
      if (saveGate) { const hold = saveGate; saveGate = null; await hold.promise; }
      if (failSave) { await fail(409); return; }
      detail = salon({ ...body, horarios: body!.horarios === null ? detail.horarios : body!.horarios.map((h, i) => ({ ...h, id: `new-h${i}` })), tiposActividad: activities.filter(a => body!.tipoActividadIds.includes(a.id)), recursos: body!.recursos.map(r => ({ ...r, nombre: resources.find(t => t.id === r.tipoRecursoId)!.nombre })) });
      await route.fulfill({ json: detail }); return;
    }
    if (saveGate) { const hold = saveGate; saveGate = null; await hold.promise; }
    if (failCatalogWrite) { await fail(409); return; }
    await route.fulfill({ json: { id: 'nuevo', ...request.postDataJSON(), activo: true } });
  });
  function hold(kind: 'list' | 'detail' | 'save') { const h = gate(); holds.push(h); if (kind === 'list') listGate = h; else if (kind === 'detail') detailGate = h; else saveGate = h; return h.release; }
  return {
    calls, failures, consoleErrors,
    hold, list: (mode: typeof listMode) => { listMode = mode; }, detailFailure: (value: boolean) => { failDetail = value; }, saveFailure: (value: boolean) => { failSave = value; }, refreshFailure: (value: boolean) => { failRefresh = value; }, closed: () => { detail = salon({ horarios: [] }); },
    catalogWriteFailure: (value: boolean) => { failCatalogWrite = value; },
    catalogFailure: (path: string, value: boolean) => { if (value) failedCatalogs.add(path); else failedCatalogs.delete(path); },
    assertClean: () => {
      for (const h of holds) h.release();
      expect.soft(unexpected, 'Solicitudes desconocidas abortadas').toEqual([]);
      expect.soft(pageErrors, 'Errores JavaScript').toEqual([]);
      const unrecognized = consoleErrors.filter(error => !failures.some(f => f.url === error.url && error.text === `Failed to load resource: the server responded with a status of ${f.status} (${f.status === 503 ? 'Service Unavailable' : 'Conflict'})`));
      expect.soft(unrecognized, 'Consola: sólo errores HTTP sintéticos previstos').toEqual([]);
    },
  };
}

async function choose(form: Locator, name: string, option: string) {
  await form.getByRole('combobox', { name: new RegExp(`^${name}`) }).click();
  await form.page().getByRole('option', { name: option, exact: true }).click();
}
async function next(form: Locator) { await form.getByRole('button', { name: 'Siguiente', exact: true }).click(); }
async function fillGeneral(form: Locator) {
  for (const [name, value] of [['Nombre del salón', 'Sede Nueva'], ['Teléfono de atención', '4420000000'], ['Calle', 'Calle Prueba'], ['Colonia', 'Centro'], ['Código postal', '76000']]) await form.getByRole('textbox', { name: new RegExp(`^${name}`) }).fill(value);
  await choose(form, 'Estado', 'Querétaro'); await choose(form, 'Municipio', 'Centro');
}
async function equipmentFromEdit(page: Page) {
  await page.getByRole('button', { name: 'Editar Sede Prueba', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Editar salón', exact: true });
  await expect(form.getByRole('combobox', { name: /^Municipio/ })).toContainText('Centro');
  await next(form); await next(form); await next(form); return form;
}
async function geometry(form: Locator) {
  const errors = await form.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const failures: string[] = [];
    for (const label of element.querySelectorAll('label')) {
      const r = label.getBoundingClientRect();
      if (r.width && (r.left < bounds.left || r.right > bounds.right + 1 || label.scrollWidth > label.clientWidth + 1)) failures.push(label.textContent ?? 'sin etiqueta');
    }
    if (element.scrollWidth > element.clientWidth + 1) failures.push('Desborde horizontal del diálogo');
    return failures;
  });
  expect(errors, 'Etiquetas completas dentro del diálogo').toEqual([]);
  const action = form.getByRole('button', { name: /^(Siguiente|Guardar salón)$/ });
  await expect(action).toBeInViewport();
}
async function capture(page: Page, info: TestInfo, suffix: string) {
  const name = `salones-${info.testId.replace(/[^a-zA-Z0-9]/g, '').slice(-24)}-${suffix}`;
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: 'disabled' });
  await writeFile(info.outputPath(`${name}.json`), JSON.stringify({ title: info.title, browser: page.context().browser()?.version(), viewport: page.viewportSize(), userAgent: await page.evaluate(() => navigator.userAgent), devicePixelRatio: await page.evaluate(() => devicePixelRatio), screenshot: info.outputPath(`${name}.png`) }, null, 2));
}

test.afterEach(async ({ page }, info) => { if (info.status !== info.expectedStatus) await capture(page, info, 'fallo'); });

test('Listado: carga, error recuperable, vacío y todos los datos móviles con paginación local', async ({ context, page, baseURL }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const app = await syntheticApp(context, page, baseURL!); const release = app.hold('list');
  try {
    await page.goto('/salones'); await expect(page.getByText('Cargando salones…')).toBeVisible();
    await expect(page.getByText('Aún no hay salones registrados.')).toHaveCount(0);
    app.list('error'); release(); await expect(page.getByRole('alert')).toContainText('No se pudo actualizar');
    await expect(page.getByText('Aún no hay salones registrados.')).toHaveCount(0);
    app.list('empty'); await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect(page.getByText('Aún no hay salones registrados.')).toBeVisible();
    app.list('populated'); await page.reload();
    await expect(page.getByRole('heading', { name: 'Salones', exact: true })).toHaveJSProperty('tagName', 'H1');
    const card = page.getByRole('article', { name: 'Sede Prueba', exact: true });
    await expect(card).toContainText('Centro, Querétaro'); await expect(card).toContainText('1 Avenida Pilates'); await expect(card).toContainText('Fecha:');
    await page.getByRole('button', { name: 'Go to next page' }).click(); await expect(page.getByText('11-12 de 12')).toBeVisible();
    await expect(page.getByRole('article', { name: 'Z Salón 12' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, info, 'lista-375');
  } finally { app.assertClean(); }
});

test('Detalle: fallo recuperable y creación durante GET pendiente conserva intención', async ({ context, page, baseURL }) => {
  const app = await syntheticApp(context, page, baseURL!);
  try {
    app.detailFailure(true); await page.goto('/salones');
    await page.getByRole('button', { name: 'Editar Sede Prueba' }).click(); await expect(page.getByRole('alert')).toContainText('No se pudo abrir');
    await expect(page.getByRole('table')).toBeVisible();
    app.detailFailure(false); const release = app.hold('detail');
    await page.getByRole('button', { name: 'Editar Sede Prueba' }).click(); await expect(page.getByText('Cargando salón para editar…')).toBeVisible();
    await page.getByRole('button', { name: 'Nuevo salón', exact: true }).click(); release();
    const form = page.getByRole('dialog', { name: 'Nuevo salón', exact: true });
    await expect(form.getByRole('textbox', { name: /^Nombre del salón/ })).toHaveValue('');
    await form.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('button', { name: 'Nuevo salón', exact: true })).toBeFocused();
  } finally { app.assertClean(); }
});

for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }, { width: 375, height: 400 }]) {
  test(`Asistente y equipamiento: teclado, etiquetas, scroll y payload a ${viewport.width}x${viewport.height}`, async ({ context, page, baseURL }, info) => {
    await page.setViewportSize(viewport); const app = await syntheticApp(context, page, baseURL!);
    try {
      await page.goto('/salones'); await page.getByRole('button', { name: 'Nuevo salón', exact: true }).click();
      const form = page.getByRole('dialog', { name: 'Nuevo salón', exact: true });
      await expect(form.getByRole('textbox', { name: /^Nombre del salón/ })).toBeFocused();
      await geometry(form); await next(form);
      await expect(form.getByRole('alert').filter({ hasText: 'Ingresa el nombre' })).toBeFocused();
      await fillGeneral(form); await geometry(form); await capture(page, info, 'general');
      await form.getByRole('textbox', { name: /^Calle/ }).press('Enter'); expect(app.calls.filter(c => c.method === 'POST')).toEqual([]);
      await next(form); await expect(form.getByText('Paso 2 de 4: Actividades')).toBeFocused();
      await choose(form, 'Actividades', 'Pilates'); await page.keyboard.press('Escape'); await geometry(form); await next(form);
      await form.getByRole('switch', { name: 'Domingo' }).check(); await geometry(form); await next(form);
      await form.getByRole('button', { name: 'Agregar equipamiento' }).click(); await form.getByRole('button', { name: 'Agregar equipamiento' }).click();
      await expect(form.getByRole('combobox', { name: 'Tipo de equipamiento' })).toHaveCount(2);
      await expect(form.getByRole('spinbutton', { name: 'Cantidad' }).first()).toHaveValue('1');
      await form.getByRole('button', { name: 'Quitar equipamiento Tapete' }).click();
      await form.getByRole('spinbutton', { name: 'Cantidad' }).fill('3'); await geometry(form);
      await form.getByRole('button', { name: 'Guardar salón' }).focus(); await page.keyboard.press('Tab');
      expect(await form.evaluate(element => element.contains(document.activeElement))).toBe(true);
      if (viewport.height === 400) {
        const scroll = await form.evaluate(element => { const scroller = element.querySelector('fieldset')!.parentElement!; return { client: scroller.clientHeight, total: scroller.scrollHeight }; });
        expect(scroll.total).toBeGreaterThan(scroll.client);
      }
      await capture(page, info, 'equipo');
      const release = app.hold('save'); app.saveFailure(true);
      await form.getByRole('button', { name: 'Guardar salón' }).click(); await expect(form.getByText('Guardando salón…')).toBeVisible();
      await expect(form.getByRole('button', { name: 'Guardando...' })).toBeDisabled(); await expect(form.getByRole('spinbutton', { name: 'Cantidad' })).toBeDisabled();
      await page.keyboard.press('Escape'); await expect(form).toBeVisible(); release();
      await expect(form.getByRole('alert')).toContainText('Nombre no disponible'); await expect(form.getByRole('spinbutton', { name: 'Cantidad' })).toHaveValue('3');
      app.saveFailure(false); app.refreshFailure(true); await form.getByRole('button', { name: 'Guardar salón' }).click();
      await expect(form).toHaveCount(0); await expect(page.getByText('Salón Sede Nueva guardado')).toBeVisible(); await expect(page.getByText(/Se conserva la última lista cargada/)).toBeVisible();
      const writes = app.calls.filter(c => c.method === 'POST' && c.path === '/salones');
      const expected: SalonRequest = { nombre: 'Sede Nueva', estadoId: 1, municipioId: 10, telefono: '4420000000', calle: 'Calle Prueba', numeroExterior: null, numeroInterior: null, colonia: 'Centro', codigoPostal: '76000', referencias: null, direccionCompleta: null, latitud: null, longitud: null, tipoActividadIds: ['a1'], horarios: [{ diaSemana: 0, horaApertura: '08:00', horaCierre: '20:00' }], recursos: [{ tipoRecursoId: 'r1', cantidad: 3 }] };
      expect(writes.map(c => c.body)).toEqual([expected, expected]);
    } finally { app.assertClean(); }
  });
}

test('Edición diferida: foco vuelve a Editar, siete días cerrados y PUT conserva horarios:null', async ({ context, page, baseURL }) => {
  const app = await syntheticApp(context, page, baseURL!); app.closed(); const release = app.hold('detail');
  try {
    await page.goto('/salones'); const edit = page.getByRole('button', { name: 'Editar Sede Prueba' });
    await edit.click(); await expect(page.getByText('Cargando salón para editar…')).toBeVisible(); release();
    const form = page.getByRole('dialog', { name: 'Editar salón' }); await expect(form.getByRole('combobox', { name: /^Municipio/ })).toContainText('Centro');
    await form.getByRole('button', { name: 'Cancelar' }).click(); await expect(edit).toBeFocused();
    const reopened = await equipmentFromEdit(page); await reopened.getByRole('button', { name: 'Guardar salón' }).click(); await expect(reopened).toHaveCount(0);
    const existing = salon({ horarios: [] });
    const { id: _id, estadoNombre: _estado, municipioNombre: _municipio, activo: _activo, tiposActividad, horarios: _horarios, recursos: _recursos, ...fields } = existing;
    expect(app.calls.filter(c => c.method === 'PUT').map(c => c.body)).toEqual([{ ...fields, tipoActividadIds: tiposActividad.map(a => a.id), horarios: null, recursos: [] }]);
  } finally { app.assertClean(); }
});

test('Edición: fallo de PUT preserva campos, pendiente bloquea cambios y éxito es distinto del refresco fallido', async ({ context, page, baseURL }) => {
  await page.setViewportSize({ width: 375, height: 400 }); const app = await syntheticApp(context, page, baseURL!);
  try {
    await page.goto('/salones'); await page.getByRole('button', { name: 'Editar Sede Prueba', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Editar salón', exact: true });
    await expect(form.getByRole('combobox', { name: /^Municipio/ })).toContainText('Centro');
    await form.getByRole('textbox', { name: /^Nombre del salón/ }).fill('Nombre editado');
    await next(form); await next(form); await next(form);
    app.saveFailure(true); const release = app.hold('save');
    await form.getByRole('button', { name: 'Guardar salón' }).click();
    await expect(form.getByText('Guardando salón…')).toBeVisible(); await expect(form.getByRole('button', { name: 'Atrás' })).toBeDisabled();
    await page.keyboard.press('Escape'); await expect(form).toBeVisible(); release();
    await expect(form.getByRole('alert')).toContainText('Nombre no disponible');
    await form.getByRole('button', { name: 'Atrás' }).click(); await form.getByRole('button', { name: 'Atrás' }).click(); await form.getByRole('button', { name: 'Atrás' }).click();
    await expect(form.getByRole('textbox', { name: /^Nombre del salón/ })).toHaveValue('Nombre editado');
    await next(form); await next(form); await next(form);
    app.saveFailure(false); app.refreshFailure(true); await form.getByRole('button', { name: 'Guardar salón' }).click();
    await expect(form).toHaveCount(0); await expect(page.getByText('Salón Nombre editado guardado')).toBeVisible(); await expect(page.getByText(/Se conserva la última lista cargada/)).toBeVisible();
    const { id: _id, estadoNombre: _estado, municipioNombre: _municipio, activo: _activo, tiposActividad, horarios: _horarios, recursos: _recursos, ...fields } = salon();
    const expected = { ...fields, nombre: 'Nombre editado', tipoActividadIds: tiposActividad.map(a => a.id), horarios: null, recursos: [] };
    expect(app.calls.filter(c => c.method === 'PUT').map(c => c.body)).toEqual([expected, expected]);
  } finally { app.assertClean(); }
});

test('Catálogos anidados: datos pendientes y fallo preservados, POST exitoso con GET fallido y foco regresa a Nueva categoría', async ({ context, page, baseURL }, info) => {
  await page.setViewportSize({ width: 375, height: 400 }); const app = await syntheticApp(context, page, baseURL!);
  try {
    await page.goto('/salones'); const form = await equipmentFromEdit(page); const trigger = form.getByRole('button', { name: 'Nueva categoría', exact: true });
    await trigger.click(); const nested = page.getByRole('dialog', { name: 'Nueva categoría de equipamiento', exact: true });
    await nested.getByRole('textbox', { name: 'Nombre', exact: true }).fill('  Equipo nuevo  ');
    await expect(nested.getByRole('button', { name: 'Crear', exact: true })).toBeInViewport(); await geometryNested(nested);
    await capture(page, info, 'catalogo-375x400');
    app.catalogWriteFailure(true); const release = app.hold('save');
    await nested.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(nested.getByText('Guardando catálogo…')).toBeVisible();
    await expect(nested.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
    await page.keyboard.press('Escape'); await expect(nested).toBeVisible(); release();
    await expect(nested.getByRole('alert')).toContainText('Nombre no disponible');
    await expect(nested.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue('  Equipo nuevo  ');
    app.catalogWriteFailure(false); app.catalogFailure('/tipos-recurso', true);
    await nested.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(nested).toHaveCount(0); await expect(trigger).toBeFocused();
    await expect(form.getByText('Categoría de equipamiento creada.')).toBeVisible(); await expect(form.getByText(/No se pudo actualizar el catálogo de equipamiento/)).toBeVisible();
    app.catalogFailure('/tipos-recurso', false); await form.getByRole('button', { name: 'Reintentar categorías' }).click();
    await expect(form.getByText(/No se pudo actualizar el catálogo de equipamiento/)).toHaveCount(0);
    await trigger.click(); await page.keyboard.press('Escape'); await expect(nested).toHaveCount(0); await expect(trigger).toBeFocused();
    expect(app.calls.filter(c => c.method === 'POST').map(c => c.body)).toEqual([{ nombre: 'Equipo nuevo', descripcion: null }, { nombre: 'Equipo nuevo', descripcion: null }]);
  } finally { app.assertClean(); }
});
async function geometryNested(form: Locator) { expect(await form.locator('label').evaluateAll(labels => labels.every(label => label.scrollWidth <= label.clientWidth + 1))).toBe(true); }

test('PERSONAL conserva el guard de ruta y no consulta ni modifica salones', async ({ context, page, baseURL }) => {
  const app = await syntheticApp(context, page, baseURL!, user({ roles: ['PERSONAL'] }));
  try { await page.goto('/salones'); await expect(page).toHaveURL('/'); await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue('Ana Prueba'); expect(app.calls.filter(c => c.path === '/salones' || c.method !== 'GET')).toEqual([]); }
  finally { app.assertClean(); }
});
