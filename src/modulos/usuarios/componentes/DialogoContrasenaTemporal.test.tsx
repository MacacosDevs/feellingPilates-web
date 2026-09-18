import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { renderWithTheme } from '../../../components/test-support/renderWithTheme';
import { DialogoContrasenaTemporal } from './DialogoContrasenaTemporal';

test('copies a synthetic temporary password and lets the user close the dialog', async () => {
  const user = userEvent.setup();
  const onCerrar = vi.fn();
  renderWithTheme(
    <DialogoContrasenaTemporal
      datos={{ correo: 'persona@example.invalid', contrasenaTemporal: 'synthetic-only' }}
      onCerrar={onCerrar}
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Copiar' }));
  expect(await navigator.clipboard.readText()).toBe('synthetic-only');
  expect(await screen.findByText('Copiado al portapapeles')).toBeDefined();
  await user.click(screen.getByRole('button', { name: 'Listo' }));
  expect(onCerrar).toHaveBeenCalledOnce();
});
