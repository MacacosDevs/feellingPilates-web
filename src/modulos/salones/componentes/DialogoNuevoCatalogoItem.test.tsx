import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { deferred, renderRoute } from '../../../components/test-support/regression';
import { DialogoNuevoCatalogoItem } from './DialogoNuevoCatalogoItem';

describe('Creación de catálogo: datos y feedback', () => {
  it('preserva datos tras fallo y muestra pendiente sin duplicar el POST', async () => {
    const hold = deferred<unknown>();
    const crear = vi.fn().mockRejectedValueOnce(new Error('fallo')).mockImplementationOnce(() => hold.promise);
    const creado = vi.fn(), cerrar = vi.fn();
    renderRoute(<DialogoNuevoCatalogoItem abierto titulo="Nueva actividad" onCerrar={cerrar} onCrear={crear} onCreado={creado} />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), '  Nueva  ');
    await user.type(screen.getByRole('textbox', { name: 'Descripción (opcional)' }), '  Descripción  ');
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    await screen.findByRole('alert');
    expect((screen.getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('  Nueva  ');
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    await screen.findByText('Guardando catálogo…');
    await user.keyboard('{Escape}');
    expect(cerrar).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Guardando...' }) as HTMLButtonElement).disabled).toBe(true);
    expect(crear.mock.calls).toEqual([['Nueva', 'Descripción'], ['Nueva', 'Descripción']]);
    hold.resolve({});
    await waitFor(() => expect(creado).toHaveBeenCalledOnce());
    expect(cerrar).toHaveBeenCalledOnce();
  });
});
