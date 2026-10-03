import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme/theme';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../../auth/authStore';
import { usePermisoCatalogoStore } from '../../auth/permisoCatalogoStore';
import { server } from '../../../tests/mocks/server';
import { user } from '../../../tests/fixtures/regression';
import { renderWithTheme } from './renderWithTheme';
import { QueryClientProvider } from '@tanstack/react-query';
import { crearRuntimeQuery } from '../../query/queryClient';
const runtimesQuery = new Set<ReturnType<typeof crearRuntimeQuery>>();
afterEach(() => {
    cleanup();
    for (const runtime of runtimesQuery) runtime.dispose();
    runtimesQuery.clear();
});
export const api = 'https://api.test.invalid/api';
export function regressionSession(permissions: string[]) {
    beforeEach(() => {
        useAuthStore.setState({ usuario: user({ permisos: permissions }), cargando: false });
        usePermisoCatalogoStore.setState({ descripciones: {}, cargando: false });
        server.use(http.get(`${api}/permisos`, () => HttpResponse.json([{ codigo: 'synthetic', descripcion: 'Prueba', categoria: 'TEST' }])));
    });
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        useAuthStore.setState({ usuario: null, cargando: true });
        usePermisoCatalogoStore.setState({ descripciones: {}, cargando: false });
    });
}
export function renderRoute(element: ReactElement, path = '/') {
    const runtime = crearRuntimeQuery();
    runtimesQuery.add(runtime);
    const wrap = (node: ReactElement) => <QueryClientProvider client={runtime.client}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></QueryClientProvider>;
    const result = renderWithTheme(wrap(element));
    return { ...result, rerender: (node: ReactElement) => result.rerender(<ThemeProvider theme={theme}>{wrap(node)}</ThemeProvider>) };
}
export async function choose(label: string | RegExp, option: string | RegExp, index = 0) {
    const actor = userEvent.setup();
    await actor.click((await screen.findAllByRole('combobox', { name: label }))[index]);
    await actor.click(await screen.findByRole('option', { name: option }));
}
export function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => { resolve = r; });
    return { promise, resolve };
}
