import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DialogoSalon } from './DialogoSalon';
import { api, deferred, regressionSession, renderRoute } from '../../../components/test-support/regression';
import { activities, salon } from '../../../../tests/fixtures/regression';
import { server } from '../../../../tests/mocks/server';
import { useAuthStore } from '../../../auth/authStore';
import * as catalogos from '../../../api/catalogos';

regressionSession([]);
const recurso = (id: string, nombre = id) => ({ id, nombre, descripcion: null, activo: false });
const holds: ReturnType<typeof deferred<Response>>[] = [];
const cleanups: (() => void)[] = [];
function heldResponse() { const hold = deferred<Response>(); holds.push(hold); return hold; }
function heldVoid() { const hold = deferred<void>(); cleanups.push(() => hold.resolve()); return hold; }
afterEach(() => {
  for (const hold of holds.splice(0)) hold.resolve(HttpResponse.json([]));
  for (const dispose of cleanups.splice(0)) dispose();
});
beforeEach(() => server.use(
  http.get(`${api}/ubicaciones/estados`, () => HttpResponse.json([{ id: 1, nombre: 'Querétaro' }])),
  http.get(`${api}/ubicaciones/estados/1/municipios`, () => HttpResponse.json([{ id: 10, estadoId: 1, nombre: 'Centro' }])),
  http.get(`${api}/tipos-actividad`, () => HttpResponse.json(activities)),
));
function mount() {
  const existing = salon();
  const element = (abierto: boolean) => <DialogoSalon abierto={abierto} salon={existing} onCerrar={vi.fn()} onGuardado={vi.fn()} />;
  const view = renderRoute(element(true));
  return { view, element };
}
async function equipamiento() {
  await waitFor(() => expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain('Centro'));
  for (let i = 0; i < 3; i++) await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
}
async function crear() {
  await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }));
  const dialog = screen.getByRole('dialog', { name: 'Nueva categoría de equipamiento' });
  await userEvent.type(within(dialog).getByRole('textbox', { name: /^Nombre$/ }), 'Equipo nuevo');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Crear' }));
}

describe('DialogoSalon consume el piloto real sin cambiar el asistente', () => {
  it('QUERY01 muestra opciones válidas; refresco manual y reapertura hacen GET fresco', async () => {
    let requests = 0;
    server.use(http.get(`${api}/tipos-recurso`, () => HttpResponse.json([recurso('r', `Equipo ${++requests}`)])));
    const { view, element } = mount();
    await equipamiento();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar equipamiento' }));
    expect(screen.getByRole('combobox', { name: 'Tipo de equipamiento' }).textContent).toBe('Equipo 1');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar nuevas categorías del catálogo' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Tipo de equipamiento' }).textContent).toBe('Equipo 2'));
    view.rerender(element(false));
    view.rerender(element(true));
    await waitFor(() => expect(requests).toBe(3));
  });
  it('POST exitoso sustituye GET inicial pendiente por GET fresco y conserva payload de creación', async () => {
    const initial = heldResponse();
    const bodies: unknown[] = [];
    let requests = 0;
    server.use(
      http.get(`${api}/tipos-recurso`, () => ++requests === 1 ? initial.promise : HttpResponse.json([recurso('nuevo', 'Equipo nuevo')])),
      http.post(`${api}/tipos-recurso`, async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json(recurso('nuevo', 'Equipo nuevo')); }),
    );
    mount();
    try {
      await waitFor(() => expect(requests).toBe(1));
      await equipamiento();
      await crear();
      await waitFor(() => expect(requests).toBe(2));
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva categoría de equipamiento' })).toBeNull());
      expect(bodies).toEqual([{ nombre: 'Equipo nuevo', descripcion: null }]);
      await userEvent.click(screen.getByRole('button', { name: 'Agregar equipamiento' }));
      expect(screen.getByRole('combobox', { name: 'Tipo de equipamiento' }).textContent).toBe('Equipo nuevo');
    } finally { initial.resolve(HttpResponse.json([recurso('viejo')])); }
  });
  it('GET fallido después de POST exitoso no impide cerrar la creación', async () => {
    let requests = 0, posts = 0;
    const failed = deferred<unknown>();
    cleanups.push(() => failed.resolve(undefined));
    const original = catalogos.listarTiposRecurso;
    vi.spyOn(catalogos, 'listarTiposRecurso').mockImplementation((signal) => {
      const read = original(signal);
      void read.then(() => {}, (error: unknown) => failed.resolve(error));
      return read;
    });
    server.use(
      http.get(`${api}/tipos-recurso`, () => {
        requests++;
        if (requests === 1) return HttpResponse.json([recurso('r')]);
        return HttpResponse.json({}, { status: 503 });
      }),
      http.post(`${api}/tipos-recurso`, () => { posts++; return HttpResponse.json(recurso('nuevo')); }),
    );
    mount();
    await equipamiento();
    await crear();
    const readError = await failed.promise;
    expect(readError).toHaveProperty('response.status', 503);
    await act(async () => {});
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva categoría de equipamiento' })).toBeNull());
    expect(posts).toBe(1);
    expect(requests).toBe(2);
  });
  it('callback de creación en misma sesión refresca aunque el salón se cierre', async () => {
    const post = heldResponse();
    const started = heldVoid();
    let requests = 0;
    server.use(
      http.get(`${api}/tipos-recurso`, () => { requests++; return HttpResponse.json([recurso('r')]); }),
      http.post(`${api}/tipos-recurso`, () => { started.resolve(); return post.promise; }),
    );
    const { view, element } = mount();
    await equipamiento();
    await crear();
    await started.promise;
    view.rerender(element(false));
    post.resolve(HttpResponse.json(recurso('nuevo')));
    await waitFor(() => expect(requests).toBe(2));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva categoría de equipamiento' })).toBeNull());
  });
  it('callback de POST anterior a logout no lanza refresco bajo sesión reemplazada', async () => {
    const post = heldResponse();
    const started = heldVoid();
    let requests = 0;
    server.use(
      http.get(`${api}/tipos-recurso`, () => { requests++; return HttpResponse.json([recurso('r')]); }),
      http.post(`${api}/tipos-recurso`, () => { started.resolve(); return post.promise; }),
    );
    mount();
    await equipamiento();
    await crear();
    await started.promise;
    act(() => useAuthStore.getState().logout());
    post.resolve(HttpResponse.json(recurso('nuevo')));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva categoría de equipamiento' })).toBeNull());
    expect(requests).toBe(1);
  });
});
