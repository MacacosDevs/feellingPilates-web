import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import type { TurnoInstructorRequest, ActualizarTurnoRequest, AsignacionInstructorRequest } from '../../src/api/types';
import { activities, assignment, pageOf, salon, turno, user } from '../fixtures/regression';
type Write = {
    method: string;
    path: string;
    body: unknown;
};
function responseAssignments(rows: AsignacionInstructorRequest[]) {
    return rows.map(a => ({ instructorId: a.instructorId, instructorNombre: 'Inés Prueba', horaInicio: a.horaInicio, horaFin: a.horaFin, actividades: activities.filter(t => a.tipoActividadIds.includes(t.id)).map(({ id, nombre }) => ({ id, nombre })) }));
}
async function isolated(context: BrowserContext, page: Page, baseURL: string) {
    const unknown: string[] = [], errors: string[] = [], consoleErrors: string[] = [], writes: Write[] = [];
    const permissions = ['calendario.gestionar', 'calendario.editar', 'calendario.cancelar', 'salon.administrar'];
    let data = [turno({ horaInicio: '09:00', horaFin: '11:00' }), turno({ id: 'blocker', horaInicio: '13:00', horaFin: '14:00' }), turno({ id: 'punctual', tipo: 'EXCEPCION', diaSemana: null, fecha: '2026-09-17', horaInicio: '12:00', horaFin: '14:00' })];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error')
        consoleErrors.push(m.text()); });
    await page.clock.setFixedTime(new Date('2026-09-16T12:00:00Z'));
    await context.addInitScript(() => localStorage.setItem('feelingpilates.token', 'synthetic-calendar-token'));
    await context.route('**/*', async (route) => {
        const request = route.request(), url = new URL(request.url()), method = request.method();
        if (url.origin === baseURL && method === 'GET') {
            if (request.resourceType() === 'document' && url.pathname === '/salones/s1/horarios') {
                const response = await route.fetch();
                await route.fulfill({ response, body: (await response.text()).replace(/<link\s+rel="preconnect"[^>]*>/g, '') });
                return;
            }
            if (['script', 'stylesheet', 'font', 'image'].includes(request.resourceType()) && (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.svg')) {
                await route.continue();
                return;
            }
        }
        if (method === 'GET' && url.href === 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap') {
            await route.fulfill({ contentType: 'text/css', body: '' });
            return;
        }
        if (url.origin === 'https://api.test.invalid' && url.pathname.startsWith('/api/')) {
            const path = url.pathname.slice(4), query = Object.fromEntries(url.searchParams);
            if (method === 'GET') {
                let response: unknown;
                if (path === '/usuarios/me' && url.search === '')
                    response = user({ permisos: permissions });
                else if (path === '/permisos' && url.search === '')
                    response = [{ codigo: 'synthetic', descripcion: 'Prueba', categoria: 'TEST' }];
                else if (path === '/salones/s1' && url.search === '')
                    response = salon();
                else if (path === '/admin/usuarios') {
                    expect(query).toEqual({ page: '0', size: '100', sort: 'creadoEn,desc', rol: 'INSTRUCTOR' });
                    response = pageOf([user({ id: 'i1', nombre: 'Inés Prueba', roles: ['INSTRUCTOR'], rolesAsignados: [{ rol: 'INSTRUCTOR', salonIds: ['s1'] }] })]);
                }
                else if (path === '/admin/usuarios/i1/especialidades' && url.search === '')
                    response = [{ tipoActividadId: 'a1', nombre: 'Pilates', duracionMinutos: 60 }];
                else if (path === '/turnos-instructor') {
                    expect(query).toEqual({ salonId: 's1' });
                    response = data;
                }
                else if (path === '/turnos-instructor/puntuales') {
                    expect(query).toEqual({ salonId: 's1', page: '0', size: '10' });
                    response = pageOf(data.filter(t => t.tipo !== 'RECURRENTE'));
                }
                else if (path === '/salones/s1/excepciones-horario') {
                    expect(query).toEqual({ desde: '2026-09-13', hasta: '2026-09-19' });
                    response = [];
                }
                if (response !== undefined) {
                    await route.fulfill({ json: response });
                    return;
                }
            }
            if (method === 'PATCH' && path === '/turnos-instructor/t1' && url.search === '') {
                const body = request.postDataJSON() as ActualizarTurnoRequest;
                writes.push({ method, path, body });
                data = data.map(t => t.id === 't1' ? { ...t, ...body, asignaciones: responseAssignments(body.asignaciones) } : t);
                await route.fulfill({ json: data.find(t => t.id === 't1') });
                return;
            }
            if (method === 'DELETE' && path === '/turnos-instructor/punctual' && url.search === '') {
                writes.push({ method, path, body: request.postData() });
                data = data.filter(t => t.id !== 'punctual');
                await route.fulfill({ status: 204 });
                return;
            }
            if (method === 'POST' && path === '/turnos-instructor' && url.search === '') {
                const body = request.postDataJSON() as TurnoInstructorRequest;
                writes.push({ method, path, body });
                const saved = turno({ id: 'created', ...body, asignaciones: responseAssignments(body.asignaciones) });
                data.push(saved);
                await route.fulfill({ json: saved });
                return;
            }
        }
        unknown.push(`${method} ${url.href}`);
        await route.abort('blockedbyclient');
    });
    return { writes, verify: () => { expect.soft(unknown, 'Unknown browser network blocked, including caught failures').toEqual([]); expect.soft(errors, 'pageerror ledger').toEqual([]); expect.soft(consoleErrors, 'console.error ledger').toEqual([]); } };
}
async function ready(page: Page) { await page.setViewportSize({ width: 1440, height: 1100 }); await page.goto('/salones/s1/horarios'); await expect(page.getByText('Mié 16/9', { exact: true })).toBeVisible(); await expect(page.getByText('09:00–11:00', { exact: true })).toBeVisible(); }
async function geometry(page: Page, text: string) {
    // Blocks/grips are mouse-only and have no role/name. Start from their visible
    // time text, then the nearest computed absolute/grab box, never Emotion classes.
    return page.getByText(text, { exact: true }).evaluate(node => {
        let block = node.parentElement!;
        while (block && !(getComputedStyle(block).position === 'absolute' && getComputedStyle(block).cursor === 'grab'))
            block = block.parentElement!;
        if (!block)
            throw new Error('Visible time has no draggable block');
        const rect = block.getBoundingClientRect(), grid = block.parentElement!.parentElement!.getBoundingClientRect();
        const grips = Array.from(block.children).filter(el => getComputedStyle(el).cursor === 'ns-resize').map(el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, height: rect.height, gridY: grid.y, pixelsPerMinute: grid.height / 600, grips };
    });
}
async function drag(page: Page, from: {
    x: number;
    y: number;
}, to: {
    x: number;
    y: number;
}) { await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(to.x, to.y, { steps: 8 }); await page.mouse.up(); }
for (const row of [{ name: 'hacia adelante', from: 67, to: 142, start: '09:00', end: '10:30' }, { name: 'inverso', from: 142, to: 67, start: '09:00', end: '10:30' }]) {
    test(`creación real ${row.name} ajusta a media hora y suelta una sola vez`, async ({ context, page, baseURL }) => {
        const isolatedApp = await isolated(context, page, baseURL!);
        try {
            await ready(page);
            const g = await geometry(page, '09:00–11:00');
            const header = await page.locator('.dia-header').filter({ hasText: 'Lun 14/9' }).boundingBox();
            expect(header).toBeTruthy();
            const x = header!.x + header!.width / 2;
            await drag(page, { x, y: g.gridY + row.from * g.pixelsPerMinute }, { x, y: g.gridY + row.to * g.pixelsPerMinute });
            await expect(page.getByText('Nuevo horario', { exact: true })).toBeVisible();
            await expect(page.getByText(`Lun · ${row.start}–${row.end}`, { exact: true })).toBeVisible();
            await page.getByRole('combobox', { name: 'Agregar instructor' }).fill('Inés');
            await page.getByRole('option', { name: 'Inés Prueba' }).click();
            await page.getByRole('combobox', { name: 'Actividades', exact: true }).click();
            await page.getByRole('option', { name: 'Pilates' }).click();
            await page.keyboard.press('Escape');
            await page.getByRole('button', { name: 'Crear horario', exact: true }).click();
            await expect.poll(() => isolatedApp.writes.length).toBe(1);
            expect(isolatedApp.writes[0]).toEqual({ method: 'POST', path: '/turnos-instructor', body: { salonId: 's1', tipo: 'RECURRENTE', diaSemana: 1, fecha: null, horaInicio: row.start, horaFin: row.end, asignaciones: [assignment] } });
            await expect(page.getByText('Nuevo horario', { exact: true })).toHaveCount(0);
            await page.mouse.up();
            await expect(page.getByText('Nuevo horario', { exact: true })).toHaveCount(0);
            expect(isolatedApp.writes).toHaveLength(1);
        }
        finally {
            isolatedApp.verify();
        }
    });
}
test('creación menor a media hora no abre ni escribe', async ({ context, page, baseURL }) => {
    const app = await isolated(context, page, baseURL!);
    try {
        await ready(page);
        const g = await geometry(page, '09:00–11:00');
        const h = (await page.locator('.dia-header').filter({ hasText: 'Lun 14/9' }).boundingBox())!;
        await drag(page, { x: h.x + h.width / 2, y: g.gridY + 61 * g.pixelsPerMinute }, { x: h.x + h.width / 2, y: g.gridY + 72 * g.pixelsPerMinute });
        await expect(page.getByText('Nuevo horario', { exact: true })).toHaveCount(0);
        expect(app.writes).toEqual([]);
    }
    finally {
        app.verify();
    }
});
for (const row of [
    { name: 'mueve vertical y admite adyacencia', mode: 'move', delta: 120, day: 3, start: '11:00', end: '13:00', overlap: false },
    { name: 'mueve horizontal y vertical', mode: 'move', delta: 60, day: 4, start: '10:00', end: '12:00', overlap: false },
    { name: 'recorta borde superior', mode: 'top', delta: 30, day: 3, start: '09:30', end: '11:00', overlap: false },
    { name: 'amplía borde inferior hasta adyacencia', mode: 'bottom', delta: 120, day: 3, start: '09:00', end: '13:00', overlap: false },
    { name: 'impide movimiento solapado', mode: 'move', delta: 150, day: 3, start: '11:30', end: '13:30', overlap: true },
    { name: 'impide resize solapado', mode: 'bottom', delta: 150, day: 3, start: '09:00', end: '13:30', overlap: true },
    { name: 'mantiene mínimo al recortar borde superior', mode: 'top', delta: 115, day: 3, start: '10:30', end: '11:00', overlap: false },
]) {
    test(`recurrente ${row.name} mediante mouse y geometría real`, async ({ context, page, baseURL }) => {
        const app = await isolated(context, page, baseURL!);
        try {
            await ready(page);
            const g = await geometry(page, '09:00–11:00');
            expect(g.grips).toHaveLength(2);
            const from = row.mode === 'move' ? g : row.mode === 'top' ? g.grips[0] : g.grips[1];
            let x = from.x;
            if (row.day === 4) {
                const h = (await page.locator('.dia-header').filter({ hasText: 'Jue 17/9' }).boundingBox())!;
                x = h.x + h.width / 2;
            }
            await drag(page, from, { x, y: from.y + row.delta * g.pixelsPerMinute });
            if (row.overlap) {
                await expect(page.getByRole('alert').filter({ hasText: 'Ese horario ya está ocupado.' })).toBeVisible();
                expect(app.writes).toEqual([]);
                await expect(page.getByText('09:00–11:00', { exact: true })).toBeVisible();
            }
            else {
                await expect.poll(() => app.writes.length).toBe(1);
                expect(app.writes[0]).toEqual({ method: 'PATCH', path: '/turnos-instructor/t1', body: { diaSemana: row.day, horaInicio: row.start, horaFin: row.end, asignaciones: [assignment] } });
                await expect(page.getByText(`${row.start}–${row.end}`, { exact: true })).toBeVisible();
                await page.mouse.up();
                await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
                expect(app.writes).toHaveLength(1);
            }
        }
        finally {
            app.verify();
        }
    });
}
for (const row of [{ name: 'mueve con intento horizontal, fecha fija', mode: 'move', delta: 30, start: '12:30', end: '14:30' }, { name: 'recorta superior', mode: 'top', delta: 30, start: '12:30', end: '14:00' }, { name: 'amplía inferior', mode: 'bottom', delta: 30, start: '12:00', end: '14:30' }]) {
    test(`puntual ${row.name} elimina y crea sin PATCH`, async ({ context, page, baseURL }) => {
        const app = await isolated(context, page, baseURL!);
        try {
            await ready(page);
            const g = await geometry(page, '12:00–14:00');
            expect(g.grips).toHaveLength(2);
            const from = row.mode === 'move' ? g : row.mode === 'top' ? g.grips[0] : g.grips[1];
            const h = (await page.locator('.dia-header').filter({ hasText: 'Vie 18/9' }).boundingBox())!;
            await drag(page, from, { x: row.mode === 'move' ? h.x + h.width / 2 : from.x, y: from.y + row.delta * g.pixelsPerMinute });
            await expect.poll(() => app.writes.length).toBe(2);
            expect(app.writes).toEqual([{ method: 'DELETE', path: '/turnos-instructor/punctual', body: null }, { method: 'POST', path: '/turnos-instructor', body: { salonId: 's1', tipo: 'EXCEPCION', diaSemana: null, fecha: '2026-09-17', horaInicio: row.start, horaFin: row.end, asignaciones: [assignment] } }]);
            await expect(page.getByText(`${row.start}–${row.end}`, { exact: true })).toBeVisible();
            await page.mouse.up();
            await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
            expect(app.writes).toHaveLength(2);
        }
        finally {
            app.verify();
        }
    });
}
