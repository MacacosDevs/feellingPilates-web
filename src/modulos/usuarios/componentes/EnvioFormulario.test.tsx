import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../../tests/mocks/server';
import { renderWithTheme } from '../../../components/test-support/renderWithTheme';
import { DialogoCrearCliente } from './DialogoCrearCliente';
import { user } from '../../../../tests/fixtures/regression';

const api = 'https://api.test.invalid/api';

function input(label: string) {
  return screen.getByRole('textbox', { name: new RegExp(`^${label}`) }) as HTMLInputElement;
}

it('cliente conserva Enter nativo, payload exacto y callback mientras el envío está pendiente', async () => {
  const bodies: unknown[] = [];
  const response = user({ nombre: 'Cliente servidor', roles: ['CLIENTE'] });
  let release!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => { release = resolve; });
  server.use(http.post(`${api}/admin/usuarios/clientes`, async ({ request }) => {
    bodies.push(await request.json());
    return pending;
  }));

  const created = vi.fn();
  const close = vi.fn();
  const ui = userEvent.setup();
  renderWithTheme(<DialogoCrearCliente abierto onCerrar={close} onCreado={created} />);
  await ui.type(input('Nombre'), 'Ana');
  await ui.type(input('Correo'), 'ana@example.invalid');
  await ui.type(input('Teléfono'), '4421234567');

  await ui.click(input('Teléfono'));
  await ui.keyboard('{Enter}');
  await waitFor(() => expect(bodies).toEqual([{ correo: 'ana@example.invalid', nombre: 'Ana', telefono: '4421234567' }]));
  expect((screen.getByRole('button', { name: 'Creando...' }) as HTMLButtonElement).disabled).toBe(true);

  await ui.keyboard('{Enter}');
  expect(bodies).toHaveLength(1);
  expect(created).not.toHaveBeenCalled();
  expect(close).not.toHaveBeenCalled();

  release(HttpResponse.json(response));
  await waitFor(() => expect(created).toHaveBeenCalledExactlyOnceWith(response));
  expect(close).toHaveBeenCalledTimes(1);
});
