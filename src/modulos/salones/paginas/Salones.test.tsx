import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { server } from '../../../../tests/mocks/server';
import { activities, salon } from '../../../../tests/fixtures/regression';
import { regressionSession, api, choose, renderRoute } from '../../../components/test-support/regression';
import { setToken } from '../../../api/client';
import { Salones } from './Salones';

regressionSession([]);

const listItem = (index: number) => ({
  id: `s${index}`,
  nombre: `Salón ${String(index).padStart(2, '0')}`,
  direccion: `${index} Avenida Pilates`,
  estadoId: 1,
  estadoNombre: 'Querétaro',
  municipioId: 10,
  municipioNombre: 'Centro',
  creadoEn: `2026-01-${String(Math.min(index, 28)).padStart(2, '0')}T12:00:00Z`,
});

function mount() {
  return renderRoute(
    <Routes>
      <Route path="/" element={<Salones />} />
      <Route path="/salones/:id/horarios" element={<div>Marcador de horarios</div>} />
    </Routes>,
  );
}

function dialogCatalogHandlers() {
  return [
    http.get(`${api}/ubicaciones/estados`, () => HttpResponse.json([{ id: 1, nombre: 'Querétaro' }])),
    http.get(`${api}/ubicaciones/estados/1/municipios`, () => HttpResponse.json([{ id: 10, estadoId: 1, nombre: 'Centro' }])),
    http.get(`${api}/tipos-actividad`, () => HttpResponse.json(activities)),
    http.get(`${api}/tipos-recurso`, () => HttpResponse.json([])),
  ];
}

afterEach(() => setToken(null));

describe('Salones: contratos vigentes de listado', () => {
  it('consulta GET /salones con Authorization, conserva orden local y pagina más de diez filas', async () => {
    const rows = Array.from({ length: 12 }, (_, index) => listItem(index + 1));
    const authorization: string[] = [];
    setToken('caracterizacion-token');
    server.use(http.get(`${api}/salones`, ({ request }) => {
      authorization.push(request.headers.get('authorization') ?? '');
      return HttpResponse.json([...rows].reverse());
    }));

    const user = userEvent.setup();
    mount();
    await screen.findByText('Salón 01');
    expect(authorization).toEqual(['Bearer caracterizacion-token']);
    expect(screen.getByText('Salón 01')).toBeTruthy();
    expect(screen.queryByText('Salón 12')).toBeNull();
    expect(screen.getByText('1-10 de 12')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Nombre' }));
    expect(screen.getAllByRole('row')[1].textContent).toContain('Salón 12');
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByText('Salón 02')).toBeTruthy();
    expect(screen.getByText('11-12 de 12')).toBeTruthy();
  });

  it('navega al destino exacto de horarios desde la fila', async () => {
    server.use(http.get(`${api}/salones`, () => HttpResponse.json([listItem(1)])));
    const user = userEvent.setup();
    mount();
    const row = (await screen.findByText('Salón 01')).closest('tr');
    expect(row).toBeTruthy();
    await user.click(within(row!).getAllByRole('button')[0]);
    expect(await screen.findByText('Marcador de horarios')).toBeTruthy();
  });
});

describe('Salones: interacción actual de creación y edición', () => {
  it('abre creación y conserva los campos generales actuales', async () => {
    server.use(http.get(`${api}/salones`, () => HttpResponse.json([])), ...dialogCatalogHandlers());
    const user = userEvent.setup();
    mount();
    await screen.findByText('Aún no hay salones registrados.');
    await user.click(screen.getByRole('button', { name: 'Nuevo salón' }));
    await user.type(screen.getByRole('textbox', { name: /^Nombre del salón/ }), 'Sede Nueva');
    await user.type(screen.getByRole('textbox', { name: /^Teléfono de atención/ }), '4420000000');
    await user.type(screen.getByRole('textbox', { name: /^Calle/ }), 'Calle Prueba');
    await choose(/^Estado/, 'Querétaro');
    await choose(/^Municipio/, 'Centro');
    expect((screen.getByRole('textbox', { name: /^Nombre del salón/ }) as HTMLInputElement).value).toBe('Sede Nueva');
    expect((screen.getByRole('textbox', { name: /^Teléfono de atención/ }) as HTMLInputElement).value).toBe('4420000000');
    expect((screen.getByRole('textbox', { name: /^Calle/ }) as HTMLInputElement).value).toBe('Calle Prueba');
  });

  it('consulta GET /salones/:id con Authorization y hidrata la edición real', async () => {
    const existing = salon();
    const detailAuthorization: string[] = [];
    setToken('edicion-token');
    server.use(
      http.get(`${api}/salones`, () => HttpResponse.json([{ id: existing.id, nombre: existing.nombre, direccion: existing.direccionCompleta, estadoId: existing.estadoId, estadoNombre: existing.estadoNombre, municipioId: existing.municipioId, municipioNombre: existing.municipioNombre, creadoEn: '2026-01-02T12:00:00Z' }])),
      http.get(`${api}/salones/${existing.id}`, ({ request }) => {
        detailAuthorization.push(request.headers.get('authorization') ?? '');
        return HttpResponse.json(existing);
      }),
      ...dialogCatalogHandlers(),
    );
    const user = userEvent.setup();
    mount();
    const row = (await screen.findByText(existing.nombre)).closest('tr');
    await user.click(within(row!).getAllByRole('button')[1]);
    await waitFor(() => expect((screen.getByRole('textbox', { name: /^Nombre del salón/ }) as HTMLInputElement).value).toBe(existing.nombre));
    expect(detailAuthorization).toEqual(['Bearer edicion-token']);
    expect(screen.getByRole('combobox', { name: /^Municipio/ }).textContent).toContain(existing.municipioNombre);
  });
});
