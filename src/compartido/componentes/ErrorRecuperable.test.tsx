import { expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../components/test-support/renderWithTheme';
import { ErrorRecuperable } from './ErrorRecuperable';

it('muestra error fijo y permite solo reintento manual por click/teclado', async () => {
  const retry = vi.fn();
  const ui = userEvent.setup();
  renderWithTheme(<ErrorRecuperable onReintentar={retry}>No disponible</ErrorRecuperable>);
  expect(screen.getByRole('alert').textContent).toContain('No disponible');
  expect(screen.getByRole('alert').className).toContain('MuiAlert-colorError');
  const button = screen.getByRole('button', { name: 'Reintentar' });
  await ui.click(button);
  expect(retry).toHaveBeenCalledOnce();
  button.focus();
  await ui.keyboard('{Enter}');
  expect(retry).toHaveBeenCalledTimes(2);
});

it('no activa reintento cuando está deshabilitado', () => {
  const retry = vi.fn();
  renderWithTheme(<ErrorRecuperable onReintentar={retry} disabled>Fallo</ErrorRecuperable>);
  const button = screen.getByRole('button', { name: 'Reintentar' });
  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(button);
  expect(retry).not.toHaveBeenCalled();
});
