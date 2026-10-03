import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { activities, pageOf, publicService, sale, service, user } from '../fixtures/regression';

const api = 'https://api.test.invalid/api';
const token = 'm07-ventas-synthetic';
function deferred() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}
async function synthetic(page: Page, baseURL: string) {
  const catalog = deferred(), checkout = deferred(), refund = deferred(), save = deferred();
  const assets = new Set(['/favicon.svg', '/icons.svg']);
  const unknown: string[] = [], pageErrors: string[] = [];
  const consoleErrors: { text: string; url: string }[] = [];
  const failures: { url: string; status: number }[] = [], responses: { url: string; status: number }[] = [];
  const requests: { method: string; path: string; query: string; body?: unknown }[] = [];
  let catalogs = 0, checkouts = 0, histories = 0, refunds = 0, saves = 0, services = 0;
  let refunded = false, saved = false;
  const permissions = ['venta.registrar.vista', 'venta.registrar.crear', 'venta.gestion.vista', 'venta.gestion.ver.todos', 'venta.gestion.gestionar',
    'venta.servicios.vista', ...['ver', 'crear', 'editar', 'deshabilitar'].map(p => `venta.servicios.gestionar.${p}`)];
  const profile = user({ roles: ['ADMIN'], permisos: permissions });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
  page.on('response', response => { if (response.status() >= 400) responses.push({ url: response.url(), status: response.status() }); });
  await page.context().addInitScript(value => localStorage.setItem('feelingpilates.token', value), token);
  await page.context().route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (url.origin === new URL(baseURL).origin && method === 'GET' && !url.search) {
      if (request.resourceType() === 'document' && ['/ventas/nueva', '/ventas/gestion', '/ventas/servicios'].includes(url.pathname)) {
        const response = await route.fetch();
        const html = (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '');
        for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) assets.add(match[1]);
        await route.fulfill({ response, body: html }); return;
      }
      if (assets.has(url.pathname) && ['script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) { await route.continue(); return; }
    }
    if (method === 'GET' && url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' }); return;
    }
    if (url.origin === new URL(api).origin && request.headers().authorization === `Bearer ${token}`) {
      const path = url.pathname.slice('/api'.length);
      const fixed = ['/usuarios/me', '/permisos', '/publico/paquetes', '/ventas/sedes', '/ventas/servicios', '/tipos-actividad'];
      const search = path === '/admin/usuarios' && url.searchParams.size === 5 && url.searchParams.get('page') === '0' && url.searchParams.get('size') === '10'
        && url.searchParams.get('sort') === 'creadoEn,desc' && url.searchParams.get('rol') === 'CLIENTE'
        && ['Ana', 'Ana Prueba · ana@example.invalid'].includes(url.searchParams.get('busqueda') ?? '');
      const history = path === '/ventas/buscar' && url.search === '?page=0&size=10&sort=creadoEn,desc';
      const read = method === 'GET' && ((fixed.includes(path) && !url.search) || search || history);
      const write = !url.search && ((method === 'POST' && path === '/ventas/carrito') || (method === 'PATCH' && path === '/ventas/v1/reembolsar') || (method === 'PUT' && path === '/ventas/servicios/pA'));
      if (read || write) {
        requests.push({ method, path, query: url.search, ...(write ? { body: request.postDataJSON() } : {}) });
        const fail = async (status: number, message: string) => { failures.push({ url: url.href, status }); await route.fulfill({ status, json: { message } }); };
        if (path === '/publico/paquetes') {
          catalogs++; if (catalogs === 1) { await catalog.promise; await fail(503, 'Catálogo sintético no disponible'); return; }
          await route.fulfill({ json: [publicService(), publicService({ id: 'pB', nombre: 'Clase Yoga', precioCentavos: 2500 })] }); return;
        }
        if (method === 'POST') {
          checkouts++; if (checkouts === 1) { await fail(409, 'Caja sintética no disponible'); return; }
          await checkout.promise;
          await route.fulfill({ json: { grupoCompraId: 'abcdefg-123', totalCentavos: 23000, items: [sale({ montoCentavos: 11000, salonNombre: 'Sede servidor' }), sale({ id: 'v2', montoCentavos: 12000, salonNombre: 'Sede servidor' })] } }); return;
        }
        if (method === 'PATCH') { refunds++; await refund.promise; refunded = true; await route.fulfill({ json: sale({ estado: 'reembolsada' }) }); return; }
        if (method === 'PUT') { saves++; await save.promise; saved = true; await route.fulfill({ json: service({ nombre: 'Pack guardado' }) }); return; }
        if (path === '/ventas/buscar') {
          histories++; if (histories === 2) { await fail(503, 'Historial sintético no disponible'); return; }
          await route.fulfill({ json: pageOf([sale({ estado: refunded ? 'reembolsada' : 'pagada', montoCentavos: 11000 }), sale({ id: 'v2', paqueteNombre: 'Yoga Visible', montoCentavos: 12000 })]) }); return;
        }
        if (path === '/ventas/servicios') {
          services++; if (services === 1) { await fail(503, 'Servicios sintéticos no disponibles'); return; }
          await route.fulfill({ json: [service({ nombre: saved ? 'Pack guardado' : 'Pack Prueba' })] }); return;
        }
        await route.fulfill({ json: path === '/usuarios/me' ? profile : path === '/permisos' ? permissions.map(codigo => ({ codigo, descripcion: codigo, categoria: 'SYNTHETIC' }))
          : path === '/ventas/sedes' ? [{ id: 's1', nombre: 'Sede Prueba' }] : path === '/tipos-actividad' ? activities : pageOf([user({ roles: ['CLIENTE'] })]) }); return;
      }
    }
    unknown.push(`${method} ${url.href} authorization=${request.headers().authorization ?? 'NONE'}`);
    await route.abort('blockedbyclient');
  });
  return { requests, unknown, pageErrors, consoleErrors, failures, responses, catalog, checkout, refund, save,
    counts: () => ({ catalogs, checkouts, histories, refunds, saves, services }) };
}

async function contrastRatio(locator: import('@playwright/test').Locator) {
  return locator.evaluate(node => {
    const parse = (value: string) => {
      const values = value.match(/[\d.]+/g)!.map(Number);
      return { rgb: values.slice(0, 3), alpha: values[3] ?? 1 };
    };
    const luminance = (rgb: number[]) => {
      const values = rgb.map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
    };
    const style = getComputedStyle(node);
    const foreground = luminance(parse(style.color).rgb);
    const ancestry: Element[] = [];
    for (let current: Element | null = node; current; current = current.parentElement) ancestry.unshift(current);
    const composite = ancestry.reduce((base, element) => {
      const layer = parse(getComputedStyle(element).backgroundColor);
      return layer.rgb.map((channel, index) => channel * layer.alpha + base[index] * (1 - layer.alpha));
    }, [255, 255, 255]);
    const background = luminance(composite);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
}

for (const width of [375, 768, 1440]) {
  test(`Ventas ${width}px: caja, comprobante, historial y servicios sintéticos`, async ({ page, baseURL }, testInfo) => {
    const evidence = await synthetic(page, baseURL!);
    const checks: { name: string; value: unknown }[] = [];
    async function contained(name: string) {
      const metrics = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
      checks.push({ name, value: metrics }); expect(metrics.document).toBeLessThanOrEqual(metrics.viewport);
    }
    async function choose(label: string, option: string) {
      await page.getByRole('combobox', { name: label, exact: true }).click();
      await page.getByRole('option', { name: option, exact: true }).click();
      await expect(page.getByRole('listbox')).toHaveCount(0);
      await expect(page.locator('.MuiMenu-root')).toHaveCount(0);
    }
    try {
      await page.setViewportSize({ width, height: 720 });
      await page.goto('/ventas/nueva');
      await expect(page.getByRole('heading', { level: 1, name: 'Nueva venta' })).toBeVisible();
      await expect(page.getByRole('progressbar', { name: 'Cargando paquetes y clases' })).toBeVisible();
      await expect.poll(() => evidence.counts().catalogs).toBe(1);
      evidence.catalog.release();
      await expect(page.getByRole('alert')).toContainText('Catálogo sintético no disponible');
      await expect(page.getByText(/Aún no hay nada dado de alta/)).toHaveCount(0);
      const retry = page.getByRole('button', { name: 'Reintentar', exact: true });
      await retry.focus(); await expect(retry).toBeFocused(); await page.keyboard.press('Enter');
      const pack = page.getByRole('checkbox', { name: 'Seleccionar Pack Prueba', exact: true });
      await expect(pack).toBeVisible(); expect(evidence.counts().catalogs).toBe(2);
      await pack.focus(); await expect(pack).toBeFocused(); await page.keyboard.press('Space'); await expect(pack).toBeChecked();
      const quantity = page.getByRole('textbox', { name: 'Cantidad de Pack Prueba', exact: true });
      await quantity.fill('02'); await expect(quantity).toHaveValue('2');
      await page.getByRole('checkbox', { name: 'Seleccionar Clase Yoga' }).check();
      await page.getByRole('textbox', { name: 'Cantidad de Clase Yoga' }).fill('0');
      await expect(page.getByRole('button', { name: 'Cobrar', exact: true })).toBeDisabled();
      await page.getByRole('combobox', { name: 'Cliente', exact: true }).fill('Ana');
      await page.getByRole('option', { name: 'Ana Prueba · ana@example.invalid', exact: true }).click();
      await choose('Método de pago', 'Transferencia');
      await contained('Nueva venta seleccionada');
      await page.screenshot({ path: testInfo.outputPath(`nueva-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Cobrar', exact: true }).click();
      let confirmation = page.getByRole('dialog', { name: 'Confirmar venta', exact: true });
      const paymentChip = confirmation.getByText('Transferencia', { exact: true }).locator('..');
      expect(await contrastRatio(paymentChip)).toBeGreaterThanOrEqual(4.5);
      await expect(confirmation).toContainText('$246.90 MXN');
      await expect(confirmation.getByText('Clase Yoga', { exact: true })).toHaveCount(0);
      await confirmation.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(confirmation).toHaveCount(0); await expect(quantity).toHaveValue('2');
      await page.getByRole('button', { name: 'Cobrar', exact: true }).click();
      confirmation = page.getByRole('dialog', { name: 'Confirmar venta', exact: true });
      await confirmation.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Caja sintética no disponible');
      expect(evidence.counts().checkouts).toBe(1);
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
      await expect.poll(() => evidence.counts().checkouts).toBe(2);
      await expect(confirmation.getByRole('button', { name: 'Cobrando…', exact: true })).toBeDisabled();
      await expect(confirmation.getByRole('button', { name: 'Cancelar', exact: true })).toBeDisabled();
      await page.keyboard.press('Escape'); await expect(confirmation).toBeVisible();
      const carts = evidence.requests.filter(r => r.method === 'POST');
      expect(carts.map(r => r.body)).toEqual([0, 1].map(() => ({ clienteId: 'c1', salonId: 's1', metodoPago: 'transferencia', items: [{ paqueteId: 'pA', cantidad: 2 }] })));
      evidence.checkout.release();
      const receipt = page.getByRole('dialog', { name: 'Venta registrada Cerrar', exact: true });
      await expect(receipt).toBeVisible(); await expect(receipt).toContainText('$230.00 MXN');
      await expect(confirmation).toHaveCount(0);
      await expect(receipt.locator('..')).toHaveCSS('opacity', '1');
      await expect(receipt.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
      await expect(receipt).toContainText('Sede servidor'); await expect(receipt).toContainText('FABCDEFG');
      await expect(receipt).toContainText('×2');
      await page.screenshot({ path: testInfo.outputPath(`comprobante-${width}.png`), fullPage: true });
      await receipt.getByRole('button', { name: 'Listo' }).focus(); await expect(receipt.getByRole('button', { name: 'Listo' })).toBeFocused();
      await page.keyboard.press('Escape'); await expect(receipt).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Cobrar', exact: true })).toBeDisabled();
      await expect(quantity).toHaveCount(0);

      await page.goto('/ventas/gestion');
      const expand = page.getByRole('button', { name: 'Expandir compra FABCDEFG', exact: true });
      await expect(expand).toBeVisible(); await expand.focus(); await expect(expand).toBeFocused(); await page.keyboard.press('Enter');
      await expect(page.getByRole('button', { name: 'Contraer compra FABCDEFG' })).toHaveAttribute('aria-expanded', 'true');
      const row = page.getByRole('row').filter({ has: page.getByText('Pack Prueba', { exact: true }) });
      await row.getByRole('button', { name: 'Acciones' }).click();
      await page.getByRole('menuitem', { name: 'Marcar como reembolsada' }).click();
      const dialog = page.getByRole('dialog', { name: 'Marcar como reembolsada', exact: true });
      const reason = dialog.getByRole('textbox', { name: 'Motivo', exact: true });
      await expect(reason).toBeFocused(); await reason.fill('   ');
      await expect(dialog.getByRole('button', { name: 'Confirmar', exact: true })).toBeDisabled();
      await reason.fill('  motivo sintético  '); await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
      await expect.poll(() => evidence.counts().refunds).toBe(1);
      await expect(dialog.getByRole('button', { name: 'Procesando…' })).toBeDisabled();
      await page.keyboard.press('Escape'); await expect(dialog).toBeVisible();
      expect(evidence.requests.filter(r => r.method === 'PATCH').map(r => r.body)).toEqual([{ motivo: 'motivo sintético' }]);
      evidence.refund.release();
      await expect(page.getByRole('alert')).toContainText('Historial sintético no disponible');
      await expect(dialog).toHaveCount(0); expect(evidence.counts().refunds).toBe(1);
      await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
      await expect(page.getByRole('row', { name: /2 artículos/ })).toContainText('Mixto');
      expect(evidence.counts().refunds).toBe(1); expect(evidence.counts().histories).toBe(3);
      await contained('Gestión con tabla');
      await page.screenshot({ path: testInfo.outputPath(`gestion-${width}.png`), fullPage: true });
      checks.push({ name: 'tabla local', value: await page.locator('table').evaluate(table => ({ tableWidth: table.scrollWidth, parentWidth: table.parentElement!.clientWidth, overflow: getComputedStyle(table.parentElement!).overflowX })) });

      await page.goto('/ventas/servicios');
      await expect(page.getByRole('alert')).toContainText('Servicios sintéticos no disponibles');
      await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
      await expect(page.getByRole('row', { name: /Pack Prueba/ })).toBeVisible();
      const mixtos = page.getByRole('button', { name: /Mixtos/ });
      await mixtos.click();
      const count = mixtos.getByText('0', { exact: true });
      await expect(count).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(count).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.6)');
      expect(await contrastRatio(count)).toBeGreaterThanOrEqual(4.5);
      await page.getByRole('button', { name: /Todos/ }).click();
      await contained('Servicios con tabla');
      await page.getByRole('button', { name: 'Nuevo paquete', exact: true }).click();
      const create = page.getByRole('dialog', { name: 'Nuevo paquete', exact: true });
      await expect(create.locator('..')).toHaveCSS('opacity', '1');
      if (width === 375) await page.setViewportSize({ width, height: 400 });
      const nameField = create.getByRole('textbox', { name: 'Nombre', exact: true });
      await nameField.focus(); await expect(nameField).toBeFocused();
      const label = await nameField.evaluate(input => {
        const field = input.closest('.MuiFormControl-root')!;
        const labelRect = field.querySelector('label')!.getBoundingClientRect();
        const content = field.closest('.MuiDialogContent-root')!.getBoundingClientRect();
        return { labelTop: labelRect.top, contentTop: content.top, labelBottom: labelRect.bottom, contentBottom: content.bottom };
      });
      expect(label.labelTop).toBeGreaterThanOrEqual(label.contentTop);
      expect(label.labelBottom).toBeLessThanOrEqual(label.contentBottom);
      checks.push({ name: 'Nombre sin recorte en diálogo', value: { width, height: width === 375 ? 400 : 720, ...label } });
      await page.screenshot({ path: testInfo.outputPath(`dialogo-servicio-${width}.png`), fullPage: true });
      if (width === 375) await page.setViewportSize({ width, height: 720 });
      await create.getByRole('button', { name: 'Guardar', exact: true }).click();
      await expect(create.getByRole('alert')).toHaveText('El nombre es obligatorio');
      expect(evidence.counts().saves).toBe(0);
      await create.getByRole('button', { name: 'Cancelar', exact: true }).click(); await expect(create).toHaveCount(0);
      await page.getByRole('button', { name: 'Editar', exact: true }).click();
      const edit = page.getByRole('dialog', { name: 'Editar paquete', exact: true });
      await expect(edit.getByRole('spinbutton', { name: 'Precio (MXN)' })).toHaveValue('123.45');
      await edit.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Pack guardado');
      await edit.getByRole('button', { name: 'Guardar', exact: true }).focus(); await page.keyboard.press('Enter');
      await expect(edit.getByRole('button', { name: 'Guardando…', exact: true })).toHaveAttribute('aria-busy', 'true');
      await expect.poll(() => evidence.counts().saves).toBe(1);
      const { id: _id, creadoEn: _date, actividades: lines, ...fields } = service();
      expect(evidence.requests.filter(r => r.method === 'PUT').map(r => r.body)).toEqual([{ ...fields, nombre: 'Pack guardado', actividades: lines.map(({ tipoActividadId, cantidadClases }) => ({ tipoActividadId, cantidadClases })) }]);
      evidence.save.release(); await expect(edit).toHaveCount(0);
      await expect(page.getByRole('row', { name: /Pack guardado/ })).toBeVisible();
      await contained('Servicios guardados');
      await page.screenshot({ path: testInfo.outputPath(`ventas-${width}.png`), fullPage: true });
      checks.push({ name: 'viewport y teclado', value: { width, height: 720, checkbox: true, group: true, reasonAutoFocus: true, pendingEscapeLocked: true, receiptEscape: true, manualSaveEnter: true } });
    } finally {
      evidence.catalog.release(); evidence.checkout.release(); evidence.refund.release(); evidence.save.release();
      await testInfo.attach('ventas-red-viewport-checks', { body: JSON.stringify({ requests: evidence.requests, unknown: evidence.unknown, pageErrors: evidence.pageErrors, consoleErrors: evidence.consoleErrors, failures: evidence.failures, responses: evidence.responses, counts: evidence.counts(), checks }), contentType: 'application/json' });
      expect.soft(evidence.unknown).toEqual([]); expect.soft(evidence.pageErrors).toEqual([]);
      expect.soft(evidence.responses).toEqual(evidence.failures);
      expect.soft(evidence.consoleErrors).toEqual(evidence.failures.map(f => ({ url: f.url, text: `Failed to load resource: the server responded with a status of ${f.status} (${f.status === 503 ? 'Service Unavailable' : 'Conflict'})` })));
    }
  });
}
