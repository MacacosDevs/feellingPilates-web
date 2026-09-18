import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { assignment, pageOf, salon, turno, user } from '../fixtures/regression';
import type { TurnoInstructorResponse } from '../../src/api/types';
const api = 'https://api.test.invalid/api';
const permissions = ['calendario.gestionar', 'calendario.editar', 'calendario.cancelar', 'salon.administrar'];
function gate() { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; }
function populated() {
  return [turno({ id: 'first', diaSemana: 4, horaInicio: '08:00:00', horaFin: '09:00:00' }), turno({ id: 'a', diaSemana: 4 }), turno({ id: 'b', diaSemana: 4, horaInicio: '10:00:00', horaFin: '12:00:00' }), turno({ id: 'adjacent', diaSemana: 4, horaInicio: '12:00:00', horaFin: '13:00:00' }), turno({ id: 'last', diaSemana: 4, horaInicio: '17:00:00', horaFin: '18:00:00' })];
}
async function isolated(context: BrowserContext, page: Page, baseURL: string, options: { rows?: TurnoInstructorResponse[]; readOnly?: boolean; hold?: ReturnType<typeof gate>; initialFailure?: boolean; postConflict?: boolean } = {}) {
  const unknown: string[] = [], errors: string[] = [], consoleErrors: string[] = [];
  const ledger: { method: string; url: string; status: number; body?: unknown }[] = [];
  const assets = new Set<string>();
  let rows = options.rows ?? populated(), salonReads = 0, posts = 0, week = { desde: '2026-12-27', hasta: '2027-01-02' };
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.clock.setFixedTime(new Date(2026, 11, 31, 12));
  await context.addInitScript(() => localStorage.setItem('feelingpilates.token', 'synthetic-m08-browser'));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (method === 'GET' && url.origin === baseURL && url.pathname === '/salones/s1/horarios' && url.search === '' && request.resourceType() === 'document') {
      const response = await route.fetch();
      const html = (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '');
      for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        const asset = new URL(match[1], baseURL);
        if (asset.origin === baseURL && (asset.pathname === '/favicon.svg' || /^\/assets\/[^/]+\.(js|css)$/.test(asset.pathname)) && asset.search === '') assets.add(asset.href);
      }
      await route.fulfill({ response, body: html }); return;
    }
    if (method === 'GET' && assets.has(url.href) && ['script', 'stylesheet', 'image'].includes(request.resourceType())) { await route.continue(); return; }
    if (method === 'GET' && url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' && request.resourceType() === 'stylesheet') { await route.fulfill({ contentType: 'text/css', body: '' }); return; }
    const q = Object.fromEntries(url.searchParams);
    const exact = (path: string, params: Record<string, string> = {}) => url.origin === 'https://api.test.invalid' && url.pathname === `/api${path}` && JSON.stringify(q) === JSON.stringify(params);
    const reply = async (body: unknown, status = 200, writeBody?: unknown) => { ledger.push({ method, url: url.href, status, ...(writeBody === undefined ? {} : { body: writeBody }) }); await route.fulfill({ status, json: body }); };
    if (request.headers().authorization === 'Bearer synthetic-m08-browser') {
      if (method === 'GET') {
        if (exact('/usuarios/me')) { await reply(user({ permisos: options.readOnly ? [] : permissions })); return; }
        if (exact('/permisos')) { await reply([{ codigo: 'synthetic', descripcion: 'Prueba', categoria: 'TEST' }]); return; }
        if (exact('/salones/s1')) { salonReads++; if (options.hold) await options.hold.promise; await reply(options.initialFailure && salonReads === 1 ? { message: 'Detalle sintético no disponible' } : salon(), options.initialFailure && salonReads === 1 ? 503 : 200); return; }
        if (exact('/admin/usuarios', { page: '0', size: '100', sort: 'creadoEn,desc', rol: 'INSTRUCTOR' })) { await reply(pageOf([user({ id: 'i1', nombre: 'Inés Prueba', rolesAsignados: [{ rol: 'INSTRUCTOR', salonIds: ['s1'] }] })])); return; }
        if (exact('/admin/usuarios/i1/especialidades')) { await reply([{ tipoActividadId: 'a1', nombre: 'Pilates', duracionMinutos: 60 }]); return; }
        if (exact('/turnos-instructor', { salonId: 's1' })) { await reply(rows); return; }
        if (exact('/turnos-instructor/puntuales', { salonId: 's1', page: '0', size: '10' })) { await reply(pageOf([])); return; }
        if (exact('/salones/s1/excepciones-horario', week)) { await reply([]); return; }
        if (exact('/salones/s1/horarios/historial')) { await reply([]); return; }
      }
      if (method === 'PATCH' && exact('/turnos-instructor/t1')) {
        const body = request.postDataJSON();
        rows = rows.map(t => t.id === 't1' ? { ...t, ...body } : t);
        await reply(rows.find(t => t.id === 't1'), 200, body); return;
      }
      if (method === 'POST' && exact('/salones/s1/horarios/versiones')) {
        const body = request.postDataJSON();
        posts++;
        await reply(options.postConflict && posts === 1 ? { message: 'Conflicto sintético' } : { diaSemana: body.diaSemana, horaApertura: body.horaApertura, horaCierre: body.horaCierre, vigenteDesde: body.efectivoDesde, vigenteHasta: null }, options.postConflict && posts === 1 ? 409 : 200, body); return;
      }
    }
    unknown.push(`${method} ${url.href}`); await route.abort('blockedbyclient');
  });
  return { ledger, setWeek: (value: typeof week) => { week = value; }, verify: () => {
    expect(unknown, 'Unknown requests aborted, including caught failures').toEqual([]);
    expect(errors, 'Unfiltered pageerror ledger').toEqual([]);
    const failures = ledger.filter(r => r.status >= 400);
    expect(failures).toEqual([
      ...(options.initialFailure ? [{ method: 'GET', url: `${api}/salones/s1`, status: 503 }] : []),
      ...(options.postConflict ? [{ method: 'POST', url: `${api}/salones/s1/horarios/versiones`, status: 409, body: { diaSemana: 0, efectivoDesde: '2026-12-31', horaApertura: '08:00', horaCierre: '18:00' } }] : []),
    ]);
    expect(consoleErrors, 'Only exact resource errors corresponding to synthetic failed responses').toEqual(failures.map(r => `Failed to load resource: the server responded with a status of ${r.status} (${r.status === 409 ? 'Conflict' : 'Service Unavailable'})`));
  } };
}
async function ready(page: Page) { await page.goto('/salones/s1/horarios'); await expect(page.getByText('Jue 31/12', { exact: true })).toBeVisible(); }
async function bounds(page: Page, time: string) {
  // Mouse-only blocks have no role/name. Anchor to visible time and computed
  // absolute box; this observes real Chromium placement without Emotion classes.
  return page.getByText(time, { exact: true }).evaluate(node => {
    let block = node.parentElement;
    while (block && !(getComputedStyle(block).position === 'absolute' && ['grab', 'default'].includes(getComputedStyle(block).cursor))) block = block.parentElement;
    if (!block) throw new Error('Missing visible absolute block');
    const r = block.getBoundingClientRect(), grid = block.parentElement!.parentElement!.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right, gridY: grid.y, gridBottom: grid.bottom, gridHeight: grid.height };
  });
}
for (const width of [375, 768, 1440]) {
  test(`bloques poblados: columnas, adyacencia, límites y alcance visible a ${width}`, async ({ context, page, baseURL }, info) => {
    await page.setViewportSize({ width, height: 1100 });
    const app = await isolated(context, page, baseURL!);
    try {
      await ready(page);
      const first = await bounds(page, '08:00–09:00'), a = await bounds(page, '09:00–11:00'), b = await bounds(page, '10:00–12:00'), adjacent = await bounds(page, '12:00–13:00'), last = await bounds(page, '17:00–18:00');
      expect(a.right).toBeLessThanOrEqual(b.x + 1);
      expect(a.y).toBeLessThan(b.y); expect(a.bottom).toBeGreaterThan(b.y);
      expect(Math.abs(b.bottom - adjacent.y)).toBeLessThanOrEqual(5);
      expect(Math.abs(first.y - first.gridY)).toBeLessThanOrEqual(5);
      expect(Math.abs(last.bottom - last.gridBottom)).toBeLessThanOrEqual(5);
      if (width === 375) await page.setViewportSize({ width, height: 720 });
      await page.getByText('17:00–18:00', { exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByText('17:00–18:00', { exact: true })).toBeInViewport();
      const verticalScroll = await page.getByText('17:00–18:00', { exact: true }).evaluate(node => {
        let container = node.parentElement;
        while (container && !(['auto', 'scroll'].includes(getComputedStyle(container).overflowY) && container.scrollHeight > container.clientHeight)) container = container.parentElement;
        return { documentTop: document.scrollingElement!.scrollTop, localTop: container?.scrollTop ?? 0, localHeight: container?.clientHeight ?? 0, contentHeight: container?.scrollHeight ?? 0 };
      });
      expect(verticalScroll.documentTop).toBe(0);
      if (width === 375) expect(verticalScroll.localTop).toBeGreaterThan(0);
      await page.getByText('08:00–09:00', { exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByText('08:00–09:00', { exact: true })).toBeInViewport();
      const scroll = await page.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, containers: Array.from(document.querySelectorAll('*')).filter(el => el.scrollWidth > el.clientWidth + 1 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowX)).map(el => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth })) }));
      const lastHeader = await page.getByText('Sáb 2/1', { exact: true }).evaluate(node => {
        const text = node.getBoundingClientRect();
        let clip = node.parentElement;
        while (clip && getComputedStyle(clip).overflowX !== 'hidden') clip = clip.parentElement;
        const r = clip?.getBoundingClientRect();
        return { x: text.x, right: text.right, width: text.width, clippingRight: r?.right ?? null };
      });
      await info.attach(`bounds-${width}`, { body: JSON.stringify({ first, a, b, adjacent, last, scroll, verticalScroll, lastHeader }), contentType: 'application/json' });
      if (width === 375) await info.attach('narrow-current-grid', { body: await page.screenshot(), contentType: 'image/png' });
      // Narrow overflow is measured as evidence, not locked as correct behavior.
      if (width === 1440) {
        await page.setViewportSize({ width: 768, height: 1100 });
        await expect(page.getByText('Jue 31/12', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Horario habitual' }).click();
        const dialog = page.getByRole('dialog', { name: 'Horarios de Sede Prueba' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).focus();
        await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeFocused();
        await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
      }
    } finally { app.verify(); }
  });
}
test('carga diferida, vacío consultable y GET inicial 503 recuperable mediante reload', async ({ context, page, baseURL }) => {
  await page.setViewportSize({ width: 375, height: 1100 });
  const hold = gate();
  const app = await isolated(context, page, baseURL!, { hold, rows: [], readOnly: true, initialFailure: true });
  try {
    await page.goto('/salones/s1/horarios');
    await expect(page.getByRole('progressbar')).toBeVisible();
    hold.resolve();
    await expect(page.getByRole('alert')).toBeVisible();
    // Missing retry/accurate initial-error wording is a NOT_LOCKED gap; do not
    // assert the inherited fallback text as the canonical product contract.
    await page.reload(); await expect(page.getByText('Jue 31/12', { exact: true })).toBeVisible();
    await expect(page.getByText('Solo puedes consultar este calendario.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Horario habitual' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar actividades e instructores' })).toHaveCount(0);
  } finally { hold.resolve(); app.verify(); }
});
test('diálogo semanal retiene campos tras POST 409, reintenta y cruza semana de año por control actual', async ({ context, page, baseURL }) => {
  await page.setViewportSize({ width: 768, height: 1100 });
  const app = await isolated(context, page, baseURL!, { rows: [], postConflict: true });
  try {
    await ready(page); await page.getByRole('button', { name: 'Horario habitual' }).click();
    await page.getByRole('button', { name: 'Cambiar horario' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Domingo — Cambiar horario' });
    await expect(dialog.getByLabel('Aplicar a partir de')).toHaveValue('2026-12-31');
    await dialog.getByRole('button', { name: 'Guardar horario' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Conflicto sintético');
    await expect(dialog.getByLabel('Abre')).toHaveValue('08:00');
    await dialog.getByLabel('Aplicar a partir de').fill('2027-01-03');
    await dialog.getByRole('button', { name: 'Guardar horario' }).click();
    await expect(page.getByRole('dialog', { name: 'Horarios de Sede Prueba' })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    app.setWeek({ desde: '2027-01-03', hasta: '2027-01-09' });
    // The existing week arrows lack names. The visible week text anchors its
    // immediate row; the second direct button is its current next-week control.
    const next = page.getByText(/^Semana del/).locator('..').locator(':scope > button').nth(1);
    await next.click();
    await expect(page.getByText('Dom 3/1', { exact: true })).toBeVisible();
    expect(app.ledger.filter(r => r.method === 'POST').map(r => r.body)).toEqual([{ diaSemana: 0, efectivoDesde: '2026-12-31', horaApertura: '08:00', horaCierre: '18:00' }, { diaSemana: 0, efectivoDesde: '2027-01-03', horaApertura: '08:00', horaCierre: '18:00' }]);
  } finally { app.verify(); }
});
test('mouse recurrente más allá del borde superior limita al inicio global actual sin duplicar PATCH', async ({ context, page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const app = await isolated(context, page, baseURL!, { rows: [turno({ diaSemana: 4 })] });
  try {
    await ready(page);
    const b = await bounds(page, '09:00–11:00');
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.gridY - 100, { steps: 8 }); await page.mouse.up();
    await expect(page.getByText('08:00–10:00', { exact: true })).toBeVisible();
    await page.mouse.up();
    expect(app.ledger.filter(r => r.method === 'PATCH')).toEqual([{ method: 'PATCH', url: `${api}/turnos-instructor/t1`, status: 200, body: { diaSemana: 4, horaInicio: '08:00', horaFin: '10:00', asignaciones: [assignment] } }]);
  } finally { app.verify(); }
});

test('permiso consultable con bloques poblados conserva información sin ofrecer escrituras', async ({ context, page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const app = await isolated(context, page, baseURL!, { readOnly: true });
  try {
    await ready(page);
    await expect(page.getByText('09:00–11:00', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar actividades e instructores' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancelar un día puntual' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Eliminar bloque completo' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Horario habitual' })).toHaveCount(0);
    await page.getByText('Jue 31/12', { exact: true }).click();
    await expect(page.getByText('Horario de este día', { exact: true })).toHaveCount(0);
    expect(app.ledger.filter(r => r.method !== 'GET')).toEqual([]);
  } finally { app.verify(); }
});
