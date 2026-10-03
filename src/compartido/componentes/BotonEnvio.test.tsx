import { afterEach, expect, it, vi } from 'vitest';
import type { FormEvent } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme/theme';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../components/test-support/renderWithTheme';
import { BotonEnvio } from './BotonEnvio';

afterEach(cleanup);

it('bloquea clicks pendientes y recupera texto, busy y acción al terminar', async () => {
  const click = vi.fn();
  const ui = userEvent.setup();
  const view = renderWithTheme(<BotonEnvio type="button" enviando textoEnviando="Guardando…" onClick={click}>Guardar</BotonEnvio>);
  const button = screen.getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement;
  expect(button.type).toBe('button');
  expect(button.disabled).toBe(true);
  expect(button.getAttribute('aria-busy')).toBe('true');
  await expect(ui.click(button)).rejects.toThrow(/pointer-events: none/);
  button.click();
  expect(click).not.toHaveBeenCalled();
  view.rerender(<ThemeProvider theme={theme}><BotonEnvio type="button" enviando={false} textoEnviando="Guardando…" onClick={click}>Guardar</BotonEnvio></ThemeProvider>);
  const ready = screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement;
  expect(ready).toBe(button);
  expect(ready.disabled).toBe(false);
  expect(ready.hasAttribute('aria-busy')).toBe(false);
  await ui.click(ready);
  expect(click).toHaveBeenCalledOnce();
});

it('respeta disabled del caller sin envío pendiente', async () => {
  const click = vi.fn();
  const ui = userEvent.setup();
  renderWithTheme(<BotonEnvio type="button" disabled enviando={false} textoEnviando="Guardando…" onClick={click}>Guardar</BotonEnvio>);
  const button = screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  expect(button.hasAttribute('aria-busy')).toBe(false);
  await expect(ui.click(button)).rejects.toThrow(/pointer-events: none/);
  button.click();
  expect(click).not.toHaveBeenCalled();
});

it('submit activa onSubmit nativo y button ejecuta solo la acción manual', async () => {
  const submit = vi.fn((event: FormEvent) => event.preventDefault());
  const manual = vi.fn();
  const ui = userEvent.setup();
  renderWithTheme(
    <form onSubmit={submit}>
      <input aria-label="Nombre" required defaultValue="Ana" />
      <BotonEnvio type="submit" enviando={false} textoEnviando="Enviando…">Guardar</BotonEnvio>
      <BotonEnvio type="button" enviando={false} textoEnviando="Enviando…" onClick={manual}>Manual</BotonEnvio>
    </form>,
  );
  const submitButton = screen.getByRole('button', { name: 'Guardar' });
  const manualButton = screen.getByRole('button', { name: 'Manual' });
  expect(submitButton.getAttribute('type')).toBe('submit');
  expect(manualButton.getAttribute('type')).toBe('button');
  await ui.click(manualButton);
  expect(submit).not.toHaveBeenCalled();
  expect(manual).toHaveBeenCalledOnce();
  await ui.click(submitButton);
  expect(submit).toHaveBeenCalledOnce();
  expect(manual).toHaveBeenCalledOnce();
});
