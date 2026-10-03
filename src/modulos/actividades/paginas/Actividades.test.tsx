import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Actividades } from './Actividades';
import { api, choose, deferred, regressionSession, renderRoute } from '../../../components/test-support/regression';
import { useAuthStore } from '../../../auth/authStore';
import type { ActividadRecursoResponse, TipoActividadResponse, TipoRecursoResponse } from '../../../api/types';
import { activities, user } from '../../../../tests/fixtures/regression';
import { server } from '../../../../tests/mocks/server';

const grants = ['actividades.leer', 'actividades.gestionar'];
regressionSession(grants);
const catalog: TipoRecursoResponse[] = ['Reformer', 'Aro', 'Banda'].map((nombre, i) => ({ id: `r${i + 1}`, nombre, descripcion: null, activo: true }));
let data: TipoActividadResponse[];
let resources: Record<string, ActividadRecursoResponse[]>;
let reads: string[];
const holds = new Set<ReturnType<typeof deferred<Response>>>();
function heldResponse() { const hold = deferred<Response>(); holds.add(hold); return hold; }
beforeEach(() => {
  data = activities.map(a => ({ ...a, etiquetas: [...a.etiquetas] }));
  resources = { a1: [{ tipoRecursoId: 'r1', nombreRecurso: 'Reformer', cantidad: 2 }] };
  reads = [];
  server.use(
    http.get(`${api}/tipos-actividad`, () => { reads.push('actividades'); return HttpResponse.json(data); }),
    http.get(`${api}/tipos-recurso`, () => { reads.push('tipos'); return HttpResponse.json(catalog); }),
    http.get(`${api}/tipos-actividad/:id/recursos`, ({ params }) => {
      const id = String(params.id);
      // Only synthetic IDs in this test's catalog are legitimate reads.
      expect(data.some(a => a.id === id)).toBe(true);
      reads.push(`recursos:${id}`);
      return HttpResponse.json(resources[id] ?? []);
    }),
  );
});
afterEach(async () => {
  // Always release deferred responses, including when an assertion fails.
  for (const hold of holds) hold.resolve(HttpResponse.json({}));
  holds.clear();
  await Promise.resolve();
});
async function mount() {
  renderRoute(<Actividades />);
  await screen.findByRole('row', { name: new RegExp(data.slice().sort((a, b) => a.nombre.localeCompare(b.nombre))[0].nombre) });
  await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
}
function rowAction(nombre: string, description: string) {
  const row = screen.getByRole('row', { name: new RegExp(nombre) });
  // Tooltip exposes these existing icon controls by description or name,
  // depending on MUI's rendered tooltip state; scope to the activity row.
  return within(row).queryByRole('button', { description }) ?? within(row).getByRole('button', { name: description });
}
async function newForm() {
  await userEvent.click(screen.getByRole('button', { name: 'Nueva actividad' }));
  return screen.getByRole('dialog', { name: 'Nueva actividad' });
}
async function replace(element: HTMLElement, value: string) {
  await userEvent.clear(element);
  if (value) await userEvent.type(element, value);
}
function value(dialog: HTMLElement, role: 'textbox' | 'spinbutton', name: string) {
  return (within(dialog).getByRole(role, { name }) as HTMLInputElement).value;
}
async function resourceForm() {
  const before = reads.filter(r => r === 'recursos:a1').length;
  await userEvent.click(rowAction('Pilates', 'Configurar recursos'));
  const dialog = screen.getByRole('dialog', { name: 'Recursos de «Pilates»' });
  await waitFor(() => expect(reads.filter(r => r === 'recursos:a1')).toHaveLength(before + 1));
  if ((resources.a1 ?? []).length) await within(dialog).findByRole('spinbutton', { name: 'Cantidad' });
  return dialog;
}
function removeResource(dialog: HTMLElement, index: number) {
  // The remove icon has no name. Find its smallest semantic row using the
  // labelled quantity and resource controls; no CSS classes or icon internals.
  let anchor = within(dialog).getAllByRole('spinbutton', { name: 'Cantidad' })[index].parentElement;
  while (anchor && anchor !== dialog) {
    const scoped = within(anchor);
    if (scoped.queryAllByRole('combobox', { name: 'Recurso' }).length === 1 && scoped.queryAllByRole('button').length === 1) return scoped.getByRole('button');
    anchor = anchor.parentElement;
  }
  throw new Error('No se encontró la fila semántica del recurso');
}
const defaultPayload = { nombre: 'Nueva', descripcion: null, duracionMinutos: 60, participantesPorReserva: 1, etiquetas: [] };
async function assertRefresh(message: string) {
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await screen.findByText(message);
  await waitFor(() => expect(reads.filter(r => r === 'actividades')).toHaveLength(2));
  await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
}

describe('Actividades: regresión del catálogo y gestión', () => {
  it.each([[[]], [['actividades.gestionar']], [['actividades.leer']], [grants]])('permisos independientes %j protegen lecturas y controles', async (permissions) => {
    useAuthStore.setState({ usuario: user({ permisos: permissions }) });
    renderRoute(<Actividades />);
    if (!permissions.includes('actividades.leer')) {
      expect(screen.getByRole('alert').textContent).toContain('No tienes permiso');
      expect(screen.queryByRole('table')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Nueva actividad' })).toBeNull();
      await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('actividades.leer'));
      expect(reads).toEqual([]);
      return;
    }
    const row = await screen.findByRole('row', { name: /Pilates/ });
    const manage = permissions.includes('actividades.gestionar');
    expect(!!screen.queryByRole('button', { name: 'Nueva actividad' })).toBe(manage);
    expect(!!screen.queryByRole('columnheader', { name: 'Acciones' })).toBe(manage);
    expect(within(row).queryAllByRole('button')).toHaveLength(manage ? 3 : 0);
    expect(reads.slice().sort()).toEqual(['actividades', 'tipos', 'recursos:a1', 'recursos:a2'].sort());
  });

  it('crear conserva duración 60 y envía exactamente cinco campos con descripción null', async () => {
    const bodies: unknown[] = [];
    server.use(http.post(`${api}/tipos-actividad`, async ({ request }) => {
      bodies.push(await request.json()); data = [...data, { ...activities[0], id: 'a3', nombre: 'Nueva' }]; return HttpResponse.json(data[2]);
    }));
    await mount(); const dialog = await newForm();
    expect(value(dialog, 'spinbutton', 'Duración (minutos)')).toBe('60');
    expect((within(dialog).getByRole('checkbox', { name: 'Es una actividad en pareja' }) as HTMLInputElement).checked).toBe(false);
    await replace(within(dialog).getByRole('textbox', { name: 'Nombre' }), '  Nueva  ');
    await replace(within(dialog).getByRole('textbox', { name: 'Descripción (opcional)' }), '  ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear' }));
    await assertRefresh('Actividad creada');
    expect(bodies).toEqual([defaultPayload]);
    expect(await screen.findByRole('row', { name: /Nueva/ })).toBeTruthy();
    expect(reads.filter(r => r === 'tipos')).toHaveLength(2);
    expect(reads.filter(r => r === 'recursos:a3')).toHaveLength(1);
  });

  it('crear recorta descripción y etiquetas, deduplica conservando orden y mayúsculas y mapea pareja a 2', async () => {
    const bodies: unknown[] = [];
    server.use(http.post(`${api}/tipos-actividad`, async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json(activities[0]); }));
    await mount(); const dialog = await newForm();
    await replace(within(dialog).getByRole('textbox', { name: 'Nombre' }), '  Reformer  ');
    await replace(within(dialog).getByRole('textbox', { name: 'Descripción (opcional)' }), '  Sesión en pareja  ');
    await replace(within(dialog).getByRole('spinbutton', { name: 'Duración (minutos)' }), '45');
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Es una actividad en pareja' }));
    await replace(within(dialog).getByRole('textbox', { name: 'Etiquetas de búsqueda (opcional)' }), ' Reformer, parejas, Reformer, , reformer, movilidad ');
    expect(within(dialog).getAllByText('Reformer', { exact: true })).toHaveLength(1);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear' }));
    await assertRefresh('Actividad creada');
    expect(bodies).toEqual([{ nombre: 'Reformer', descripcion: 'Sesión en pareja', duracionMinutos: 45, participantesPorReserva: 2, etiquetas: ['Reformer', 'parejas', 'reformer', 'movilidad'] }]);
  });

  it('nombre vacío valida localmente sin enviar actividad', async () => {
    let writes = 0;
    server.use(http.post(`${api}/tipos-actividad`, () => { writes++; return HttpResponse.json(activities[0]); }));
    await mount(); const dialog = await newForm();
    await replace(within(dialog).getByRole('textbox', { name: 'Nombre' }), '   ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear' }));
    expect(within(dialog).getByRole('alert').textContent).toBe('El nombre es obligatorio');
    expect(writes).toBe(0); expect(reads.filter(r => r === 'actividades')).toHaveLength(1);
  });

  it('editar hidrata descripción nullable, pareja y etiquetas y actualiza el ID correcto con números positivos', async () => {
    data[0] = { ...data[0], duracionMinutos: 35, participantesPorReserva: 2, etiquetas: ['Pareja', 'Suave'] };
    const bodies: unknown[] = [];
    server.use(http.put(`${api}/tipos-actividad/a1`, async ({ request }) => { bodies.push(await request.json()); data[0] = { ...data[0], nombre: 'Pilates actualizado', duracionMinutos: 75 }; return HttpResponse.json(data[0]); }));
    await mount(); await userEvent.click(rowAction('Pilates', 'Editar'));
    const dialog = screen.getByRole('dialog', { name: 'Editar actividad' });
    expect(value(dialog, 'textbox', 'Descripción (opcional)')).toBe('');
    expect(value(dialog, 'spinbutton', 'Duración (minutos)')).toBe('35');
    expect(value(dialog, 'textbox', 'Etiquetas de búsqueda (opcional)')).toBe('Pareja, Suave');
    expect((within(dialog).getByRole('checkbox', { name: 'Es una actividad en pareja' }) as HTMLInputElement).checked).toBe(true);
    await replace(within(dialog).getByRole('textbox', { name: 'Nombre' }), ' Pilates actualizado ');
    await replace(within(dialog).getByRole('spinbutton', { name: 'Duración (minutos)' }), '75');
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Es una actividad en pareja' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await assertRefresh('Actividad actualizada');
    expect(bodies).toEqual([{ nombre: 'Pilates actualizado', descripcion: null, duracionMinutos: 75, participantesPorReserva: 1, etiquetas: ['Pareja', 'Suave'] }]);
    expect(screen.getByRole('row', { name: /Pilates actualizado/ }).textContent).toContain('75 min');
  });

  it.each(['POST', 'PUT'] as const)('%s pendiente deshabilita envío, conserva todo el borrador tras error Axios y permite reintentar', async method => {
    const hold = heldResponse(); const bodies: unknown[] = [];
    const handler = async ({ request }: { request: Request }) => {
      bodies.push(await request.json());
      if (bodies.length === 1) return hold.promise;
      data[0] = { ...data[0], nombre: 'Borrador guardado' }; return HttpResponse.json(data[0]);
    };
    server.use(method === 'POST' ? http.post(`${api}/tipos-actividad`, handler) : http.put(`${api}/tipos-actividad/a1`, handler));
    await mount();
    if (method === 'PUT') await userEvent.click(rowAction('Pilates', 'Editar'));
    const dialog = method === 'POST' ? await newForm() : screen.getByRole('dialog', { name: 'Editar actividad' });
    await replace(within(dialog).getByRole('textbox', { name: 'Nombre' }), '  Borrador guardado  ');
    await replace(within(dialog).getByRole('textbox', { name: 'Descripción (opcional)' }), 'Descripción pendiente');
    await replace(within(dialog).getByRole('spinbutton', { name: 'Duración (minutos)' }), '40');
    await replace(within(dialog).getByRole('textbox', { name: 'Etiquetas de búsqueda (opcional)' }), 'Suave, Pareja');
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Es una actividad en pareja' }));
    const submit = method === 'POST' ? 'Crear' : 'Guardar';
    await userEvent.click(within(dialog).getByRole('button', { name: submit }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect((within(dialog).getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement).disabled).toBe(true);
    hold.resolve(HttpResponse.json({ message: 'Nombre no disponible' }, { status: 409 }));
    await within(dialog).findByText('Nombre no disponible');
    await waitFor(() => expect((within(dialog).getByRole('button', { name: submit }) as HTMLButtonElement).disabled).toBe(false));
    expect(value(dialog, 'textbox', 'Nombre')).toBe('  Borrador guardado  ');
    expect(value(dialog, 'textbox', 'Descripción (opcional)')).toBe('Descripción pendiente');
    expect(value(dialog, 'spinbutton', 'Duración (minutos)')).toBe('40');
    expect(value(dialog, 'textbox', 'Etiquetas de búsqueda (opcional)')).toBe('Suave, Pareja');
    expect((within(dialog).getByRole('checkbox', { name: 'Es una actividad en pareja' }) as HTMLInputElement).checked).toBe(true);
    expect(reads.filter(r => r === 'actividades')).toHaveLength(1);
    expect(screen.queryByText('Actividad creada')).toBeNull(); expect(screen.queryByText('Actividad actualizada')).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: submit }));
    await assertRefresh(method === 'POST' ? 'Actividad creada' : 'Actividad actualizada');
    const payload = { nombre: 'Borrador guardado', descripcion: 'Descripción pendiente', duracionMinutos: 40, participantesPorReserva: 2, etiquetas: ['Suave', 'Pareja'] };
    expect(bodies).toEqual([payload, payload]);
    expect(screen.getByRole('row', { name: /Borrador guardado/ })).toBeTruthy();
  });

  it('error de edición sin mensaje usa fallback y mantiene el formulario', async () => {
    server.use(http.put(`${api}/tipos-actividad/a1`, () => HttpResponse.json({}, { status: 500 })));
    await mount(); await userEvent.click(rowAction('Pilates', 'Editar'));
    const dialog = screen.getByRole('dialog', { name: 'Editar actividad' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await within(dialog).findByText('No se pudo guardar la actividad');
    expect(value(dialog, 'textbox', 'Nombre')).toBe('Pilates');
    expect(reads.filter(r => r === 'actividades')).toHaveLength(1);
  });

  it('recursos hidratan cantidades, agregan el primero no usado y filtran opciones conservando la actual', async () => {
    await mount(); expect(screen.getByRole('row', { name: /Pilates/ }).textContent).toContain('2× Reformer');
    const dialog = await resourceForm();
    expect(value(dialog, 'spinbutton', 'Cantidad')).toBe('2');
    expect(within(dialog).getByRole('combobox', { name: 'Recurso' }).textContent).toBe('Reformer');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Agregar recurso' }));
    expect(within(dialog).getAllByRole('combobox', { name: 'Recurso' }).map(e => e.textContent)).toEqual(['Reformer', 'Aro']);
    expect((within(dialog).getAllByRole('spinbutton', { name: 'Cantidad' })[1] as HTMLInputElement).value).toBe('1');
    await userEvent.click(within(dialog).getAllByRole('combobox', { name: 'Recurso' })[0]);
    expect(screen.getAllByRole('option').map(e => e.textContent)).toEqual(['Reformer', 'Banda']);
    await userEvent.click(screen.getByRole('option', { name: 'Banda' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Agregar recurso' }));
    expect(within(dialog).getAllByRole('combobox', { name: 'Recurso' }).map(e => e.textContent)).toEqual(['Banda', 'Aro', 'Reformer']);
    expect((within(dialog).getByRole('button', { name: 'Agregar recurso' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('eliminar conserva orden y cantidades y guardar envía arreglo crudo de enteros positivos', async () => {
    const bodies: unknown[] = [];
    server.use(http.put(`${api}/tipos-actividad/a1/recursos`, async ({ request }) => {
      bodies.push(await request.json()); resources.a1 = [{ tipoRecursoId: 'r1', nombreRecurso: 'Reformer', cantidad: 4 }, { tipoRecursoId: 'r3', nombreRecurso: 'Banda', cantidad: 3 }]; return HttpResponse.json(resources.a1);
    }));
    await mount(); const dialog = await resourceForm();
    await replace(within(dialog).getByRole('spinbutton', { name: 'Cantidad' }), '4');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Agregar recurso' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Agregar recurso' }));
    await replace(within(dialog).getAllByRole('spinbutton', { name: 'Cantidad' })[2], '3');
    await userEvent.click(removeResource(dialog, 1));
    expect(within(dialog).getAllByRole('combobox', { name: 'Recurso' }).map(e => e.textContent)).toEqual(['Reformer', 'Banda']);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await assertRefresh('Recursos actualizados');
    expect(bodies).toEqual([[{ tipoRecursoId: 'r1', cantidad: 4 }, { tipoRecursoId: 'r3', cantidad: 3 }]]);
    expect(screen.getByRole('row', { name: /Pilates/ }).textContent).toContain('4× Reformer');
    expect(screen.getByRole('row', { name: /Pilates/ }).textContent).toContain('3× Banda');
  });

  it('reemplazo vacío válido envía [] y refresca sin recursos requeridos', async () => {
    const bodies: unknown[] = [];
    server.use(http.put(`${api}/tipos-actividad/a1/recursos`, async ({ request }) => { bodies.push(await request.json()); resources.a1 = []; return HttpResponse.json([]); }));
    await mount(); const dialog = await resourceForm();
    await userEvent.click(removeResource(dialog, 0));
    expect(within(dialog).queryByRole('combobox', { name: 'Recurso' })).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await assertRefresh('Recursos actualizados'); expect(bodies).toEqual([[]]);
    expect(within(screen.getByRole('row', { name: /Pilates/ })).getByText('Sin recursos requeridos')).toBeTruthy();
  });

  it.each([true, false])('guardar recursos pendiente conserva filas tras error con mensaje=%s y permite reintento exacto', async withMessage => {
    const hold = heldResponse(); const bodies: unknown[] = [];
    server.use(http.put(`${api}/tipos-actividad/a1/recursos`, async ({ request }) => {
      bodies.push(await request.json()); if (bodies.length === 1) return hold.promise;
      resources.a1 = [{ tipoRecursoId: 'r1', nombreRecurso: 'Reformer', cantidad: 5 }, { tipoRecursoId: 'r2', nombreRecurso: 'Aro', cantidad: 1 }]; return HttpResponse.json(resources.a1);
    }));
    await mount(); const dialog = await resourceForm();
    await replace(within(dialog).getByRole('spinbutton', { name: 'Cantidad' }), '5');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Agregar recurso' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect((within(dialog).getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement).disabled).toBe(true);
    hold.resolve(HttpResponse.json(withMessage ? { message: 'No disponible' } : {}, { status: 409 }));
    await within(dialog).findByText(withMessage ? 'No disponible' : 'No se pudieron guardar los recursos');
    await waitFor(() => expect((within(dialog).getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(false));
    expect(within(dialog).getAllByRole('combobox', { name: 'Recurso' }).map(e => e.textContent)).toEqual(['Reformer', 'Aro']);
    expect(within(dialog).getAllByRole('spinbutton', { name: 'Cantidad' }).map(e => (e as HTMLInputElement).value)).toEqual(['5', '1']);
    expect(reads.filter(r => r === 'actividades')).toHaveLength(1); expect(screen.queryByText('Recursos actualizados')).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await assertRefresh('Recursos actualizados');
    const payload = [{ tipoRecursoId: 'r1', cantidad: 5 }, { tipoRecursoId: 'r2', cantidad: 1 }]; expect(bodies).toEqual([payload, payload]);
    expect(screen.getByRole('row', { name: /Pilates/ }).textContent).toContain('5× Reformer');
  });

  it('crear tipo de recurso recorta nombre, utiliza ID retornado y cantidad 1 en el guardado posterior', async () => {
    const created = { id: 'r-nuevo', nombre: 'Cadillac', descripcion: null, activo: true };
    const creates: unknown[] = []; const saves: unknown[] = [];
    server.use(
      http.post(`${api}/tipos-recurso`, async ({ request }) => { creates.push(await request.json()); return HttpResponse.json(created); }),
      http.put(`${api}/tipos-actividad/a1/recursos`, async ({ request }) => { saves.push(await request.json()); resources.a1 = [...resources.a1, { tipoRecursoId: created.id, nombreRecurso: created.nombre, cantidad: 1 }]; return HttpResponse.json(resources.a1); }),
    );
    await mount(); const dialog = await resourceForm();
    const input = within(dialog).getByRole('textbox', { name: 'Nuevo tipo de recurso' });
    await replace(input, '  '); expect((within(dialog).getByRole('button', { name: 'Crear' }) as HTMLButtonElement).disabled).toBe(true);
    await replace(input, '  Cadillac  '); await userEvent.click(within(dialog).getByRole('button', { name: 'Crear' }));
    await waitFor(() => expect(within(dialog).getAllByRole('combobox', { name: 'Recurso' }).map(e => e.textContent)).toEqual(['Reformer', 'Cadillac']));
    expect((input as HTMLInputElement).value).toBe('');
    expect((within(dialog).getAllByRole('spinbutton', { name: 'Cantidad' })[1] as HTMLInputElement).value).toBe('1');
    expect(reads.filter(r => r === 'actividades')).toHaveLength(1);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' })); await assertRefresh('Recursos actualizados');
    expect(creates).toEqual([{ nombre: 'Cadillac', descripcion: null }]);
    expect(saves).toEqual([[{ tipoRecursoId: 'r1', cantidad: 2 }, { tipoRecursoId: created.id, cantidad: 1 }]]);
    expect(screen.getByRole('row', { name: /Pilates/ }).textContent).toContain('1× Cadillac');
  });

  it('desactivar usa PATCH sin cuerpo y refresca; inactiva conserva editar y configurar', async () => {
    const bodies: string[] = [];
    server.use(http.patch(`${api}/tipos-actividad/a1/desactivar`, async ({ request }) => { bodies.push(await request.text()); data[0] = { ...data[0], activo: false }; return HttpResponse.json(data[0]); }));
    await mount(); await userEvent.click(rowAction('Pilates', 'Desactivar'));
    await assertRefresh('Actividad desactivada'); expect(bodies).toEqual(['']);
    const row = screen.getByRole('row', { name: /Pilates/ }); expect(within(row).getByText('Inactiva')).toBeTruthy();
    expect(within(row).getAllByRole('button')).toHaveLength(2);
    expect(rowAction('Pilates', 'Editar')).toBeTruthy(); expect(rowAction('Pilates', 'Configurar recursos')).toBeTruthy();
  });

  it('ordena nombre, duración numérica y estado, pagina y cambia tamaño localmente sin lecturas adicionales', async () => {
    data = Array.from({ length: 12 }, (_, i) => ({ ...activities[0], id: `local${i}`, nombre: `Actividad ${String(i).padStart(2, '0')}`, duracionMinutos: i === 0 ? 100 : i, activo: i !== 0 }));
    data.reverse(); await mount(); const initialReads = [...reads];
    expect(screen.getAllByRole('row')).toHaveLength(11); expect(screen.getAllByRole('row')[1].textContent).toContain('Actividad 00');
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('11-12 de 12')).toBeTruthy(); expect(screen.getByRole('row', { name: /Actividad 10/ })).toBeTruthy();
    await choose('Filas por página', '25'); expect(screen.getByText('1-12 de 12')).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(13);
    const sort = (name: string) => within(screen.getByRole('columnheader', { name: new RegExp(`^${name}`) })).getByRole('button');
    await userEvent.click(sort('Nombre')); expect(screen.getAllByRole('row')[1].textContent).toContain('Actividad 11');
    await userEvent.click(sort('Nombre')); expect(screen.getAllByRole('row')[1].textContent).toContain('Actividad 00');
    await userEvent.click(sort('Duración')); expect(screen.getAllByRole('row')[1].textContent).toContain('Actividad 01');
    await userEvent.click(sort('Duración')); expect(screen.getAllByRole('row')[1].textContent).toContain('Actividad 00');
    await userEvent.click(sort('Estado')); expect(screen.getAllByRole('row')[1].textContent).toContain('Inactiva');
    await userEvent.click(sort('Estado')); expect(screen.getAllByRole('row')[1].textContent).toContain('Activa');
    expect(within(screen.getByRole('columnheader', { name: 'Recursos requeridos' })).queryByRole('button')).toBeNull();
    expect(reads).toEqual(initialReads);
  });

  it('mutación exitosa refresca catálogos y recursos, reinicia página y conserva tamaño y orden', async () => {
    data = Array.from({ length: 28 }, (_, i) => ({ ...activities[0], id: `refresh${i}`, nombre: `Actividad ${String(i).padStart(2, '0')}`, duracionMinutos: i + 1 }));
    server.use(http.post(`${api}/tipos-actividad`, () => {
      data = data.map(a => a.id === 'refresh27' ? { ...a, nombre: 'Actualizada por servidor', duracionMinutos: 300 } : a);
      resources.refresh27 = [{ tipoRecursoId: 'r2', nombreRecurso: 'Aro', cantidad: 7 }]; return HttpResponse.json(activities[0]);
    }));
    await mount(); await choose('Filas por página', '25');
    const sort = within(screen.getByRole('columnheader', { name: /^Duración/ })).getByRole('button');
    await userEvent.click(sort); await userEvent.click(sort);
    await userEvent.click(screen.getByRole('button', { name: /next page/i })); expect(screen.getByText('26-28 de 28')).toBeTruthy();
    const dialog = await newForm(); await replace(within(dialog).getByRole('textbox', { name: 'Nombre' }), 'Nueva');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear' })); await assertRefresh('Actividad creada');
    expect(screen.getByText('1-25 de 28')).toBeTruthy(); expect(screen.getByRole('combobox', { name: 'Filas por página' }).textContent).toBe('25');
    expect(screen.getAllByRole('row')[1].textContent).toContain('Actualizada por servidor');
    expect(screen.getAllByRole('row')[1].textContent).toContain('300 min'); expect(screen.getAllByRole('row')[1].textContent).toContain('7× Aro');
    expect(reads.filter(r => r === 'tipos')).toHaveLength(2);
    for (const a of data) expect(reads.filter(r => r === `recursos:${a.id}`)).toHaveLength(2);
  });
});
