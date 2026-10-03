import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, choose, deferred, regressionSession, renderRoute } from '../../../components/test-support/regression';
import { activities, salon } from '../../../../tests/fixtures/regression';
import { server } from '../../../../tests/mocks/server';
import { DialogoSalon } from './DialogoSalon';
import * as salonesApi from '../../../api/salones';
import { Salones } from '../paginas/Salones';

regressionSession([]);
const holds: ReturnType<typeof deferred<Response>>[] = [];
function holdRead() { const hold = deferred<Response>(); holds.push(hold); return hold; }
afterEach(() => { for (const h of holds.splice(0)) h.resolve(HttpResponse.json([])); });
beforeEach(() => server.use(
  http.get(`${api}/ubicaciones/estados`, () => HttpResponse.json([{ id: 1, nombre: 'Querétaro' }, { id: 2, nombre: 'Jalisco' }])),
  http.get(`${api}/ubicaciones/estados/1/municipios`, () => HttpResponse.json([{ id: 10, estadoId: 1, nombre: 'Centro' }])),
  http.get(`${api}/ubicaciones/estados/2/municipios`, () => HttpResponse.json([{ id: 20, estadoId: 2, nombre: 'Zapopan' }])),
  http.get(`${api}/tipos-actividad`, () => HttpResponse.json(activities)),
  http.get(`${api}/tipos-recurso`, () => HttpResponse.json([{ id: 'r1', nombre: 'Reformer', descripcion: null, activo: true }])),
));
const fila = { id: 's1', nombre: 'Sede Prueba', direccion: 'Calle Prueba', estadoId: 1, estadoNombre: 'Querétaro', municipioId: 10, municipioNombre: 'Centro', creadoEn: '2026-01-02T12:00:00Z' };
function dialog() { return renderRoute(<DialogoSalon abierto salon={salon()} onCerrar={vi.fn()} onGuardado={vi.fn()} />); }
async function siguiente() { await userEvent.click(screen.getByRole('button', { name: 'Siguiente' })); }

describe('Salones: estados veraces de lectura', () => {
  it('distingue carga, fallo y vacío y reintenta sólo desde la acción explícita', async () => {
    const hold = holdRead(); let reads = 0;
    server.use(http.get(`${api}/salones`, () => ++reads === 1 ? hold.promise : HttpResponse.json([])));
    renderRoute(<Salones />);
    expect(screen.getByText('Cargando salones…')).toBeTruthy();
    expect(screen.queryByText('Aún no hay salones registrados.')).toBeNull();
    hold.resolve(HttpResponse.json({}, { status: 503 }));
    await screen.findByText(/No se pudo actualizar la lista/);
    expect(screen.queryByText('Aún no hay salones registrados.')).toBeNull();
    expect(reads).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText('Aún no hay salones registrados.');
    expect(reads).toBe(2);
  });
  it('un detalle fallido conserva la lista y permite abrir creación', async () => {
    server.use(http.get(`${api}/salones`, () => HttpResponse.json([fila])), http.get(`${api}/salones/s1`, () => HttpResponse.json({}, { status: 503 })));
    renderRoute(<Salones />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Sede Prueba' }));
    await screen.findByText(/No se pudo abrir el salón/);
    expect(screen.getByText('Sede Prueba')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo salón' }));
    expect(screen.getByRole('dialog', { name: 'Nuevo salón' })).toBeTruthy();
  });
  it('crear mientras el detalle está pendiente descarta esa respuesta obsoleta', async () => {
    const hold = holdRead(); let started = false;
    server.use(http.get(`${api}/salones`, () => HttpResponse.json([fila])), http.get(`${api}/salones/s1`, () => { started = true; return hold.promise; }));
    renderRoute(<Salones />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Sede Prueba' }));
    await waitFor(() => expect(started).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo salón' }));
    hold.resolve(HttpResponse.json(salon()));
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Nuevo salón' })).toBeTruthy());
    expect((screen.getByRole('textbox', { name: /^Nombre del salón/ }) as HTMLInputElement).value).toBe('');
  });
  it('guardar sigue siendo éxito si falla el refresco posterior y conserva la lista anterior', async () => {
    let reads = 0;
    server.use(http.get(`${api}/salones`, () => ++reads === 1 ? HttpResponse.json([fila]) : HttpResponse.json({}, { status: 503 })), http.get(`${api}/salones/s1`, () => HttpResponse.json(salon())), http.put(`${api}/salones/s1`, () => HttpResponse.json(salon())));
    renderRoute(<Salones />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Sede Prueba' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain('Centro'));
    await siguiente(); await siguiente(); await siguiente();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar salón' }));
    await screen.findByText('Salón Sede Prueba guardado');
    await screen.findByText(/Se conserva la última lista cargada/);
    expect(screen.getByText('Sede Prueba')).toBeTruthy();
    expect(reads).toBe(2);
  });
  it('un guardado que termina después de desmontar la página no lanza otro GET de lista', async () => {
    const hold = holdRead(); const finished = deferred<void>(); let reads = 0;
    const original = salonesApi.actualizarSalon;
    vi.spyOn(salonesApi, 'actualizarSalon').mockImplementation((id, request) => original(id, request).finally(() => finished.resolve()));
    server.use(http.get(`${api}/salones`, () => { reads++; return HttpResponse.json([fila]); }), http.get(`${api}/salones/s1`, () => HttpResponse.json(salon())), http.put(`${api}/salones/s1`, () => hold.promise));
    const view = renderRoute(<Salones />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Sede Prueba' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain('Centro'));
    await siguiente(); await siguiente(); await siguiente();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar salón' }));
    await screen.findByText('Guardando salón…');
    view.unmount();
    await act(async () => { hold.resolve(HttpResponse.json(salon())); await finished.promise; });
    expect(reads).toBe(1);
  });

});

describe('Asistente: foco y errores recuperables de catálogos', () => {
  it('nombra el diálogo, anuncia el paso y enfoca un error sin enviar', async () => {
    renderRoute(<DialogoSalon abierto salon={null} onCerrar={vi.fn()} onGuardado={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Nuevo salón' })).toBeTruthy();
    await siguiente();
    const alert = await screen.findByText('Ingresa el nombre del salón.');
    expect(document.activeElement).toBe(alert.closest('[role="alert"]'));
    expect(screen.getByText('Paso 1 de 4: Información y ubicación')).toBeTruthy();
  });
  it('un municipio obsoleto no sustituye las opciones del estado más reciente', async () => {
    const hold = holdRead(); let started = false;
    server.use(http.get(`${api}/ubicaciones/estados/1/municipios`, () => { started = true; return hold.promise; }));
    renderRoute(<DialogoSalon abierto salon={null} onCerrar={vi.fn()} onGuardado={vi.fn()} />);
    await choose(/^Estado/, 'Querétaro');
    await waitFor(() => expect(started).toBe(true));
    await choose(/^Estado/, 'Jalisco');
    await choose(/^Municipio/, 'Zapopan');
    hold.resolve(HttpResponse.json([{ id: 10, estadoId: 1, nombre: 'Centro' }]));
    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain('Zapopan'));
    await userEvent.click(screen.getByRole('combobox', { name: /^Municipio/ }));
    expect(screen.queryByRole('option', { name: 'Centro' })).toBeNull();
  });
  it('un catálogo de estados fallido tiene recuperación explícita y conserva el nombre escrito', async () => {
    let reads = 0;
    server.use(http.get(`${api}/ubicaciones/estados`, () => ++reads === 1 ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json([{ id: 1, nombre: 'Querétaro' }])));
    renderRoute(<DialogoSalon abierto salon={null} onCerrar={vi.fn()} onGuardado={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox', { name: /^Nombre del salón/ }), { target: { value: 'Sin perder datos' } });
    await screen.findByText(/No se pudo cargar el catálogo de estados/);
    expect(reads).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar estados' }));
    await choose(/^Estado/, 'Querétaro');
    expect((screen.getByRole('textbox', { name: /^Nombre del salón/ }) as HTMLInputElement).value).toBe('Sin perder datos');
  });
  it('un fallo de equipamiento es visible y el GET manual recupera las categorías', async () => {
    let reads = 0;
    server.use(http.get(`${api}/tipos-recurso`, () => ++reads === 1 ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json([{ id: 'r1', nombre: 'Reformer', descripcion: null, activo: true }])));
    dialog();
    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain('Centro'));
    await siguiente(); await siguiente(); await siguiente();
    await screen.findByText(/No se pudo actualizar el catálogo de equipamiento/);
    expect(reads).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar categorías' }));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Agregar equipamiento' }) as HTMLButtonElement).disabled).toBe(false));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar equipamiento' }));
    expect(screen.getByRole('button', { name: 'Quitar equipamiento Reformer' })).toBeTruthy();
    expect(reads).toBe(2);
  });
  it('POST de actividad exitoso cierra el catálogo aunque falle su GET posterior', async () => {
    let reads = 0, posts = 0;
    server.use(
      http.get(`${api}/tipos-actividad`, () => ++reads === 1 ? HttpResponse.json(activities) : HttpResponse.json({}, { status: 503 })),
      http.post(`${api}/tipos-actividad`, () => { posts++; return HttpResponse.json({ ...activities[0], id: 'nuevo' }); }),
    );
    dialog();
    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain('Centro'));
    await siguiente();
    await userEvent.click(screen.getByRole('button', { name: 'Nueva actividad' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Actividad nueva');
    await userEvent.click(screen.getByRole('button', { name: 'Crear' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva actividad' })).toBeNull());
    expect(screen.getByText('Actividad creada.')).toBeTruthy();
    await screen.findByText(/No se pudo cargar el catálogo de actividades/);
    expect(posts).toBe(1); expect(reads).toBe(2);
    expect(screen.getByText('Pilates')).toBeTruthy();
    expect(screen.getByText('Yoga')).toBeTruthy();
  });

});
