import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/authStore';

export const politicaQuery = {
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  staleTime: 0,
  gcTime: 300_000,
  refetchOnMount: true,
  retryOnMount: true,
  refetchInterval: false,
  throwOnError: false,
  networkMode: 'always',
} as const;

export function crearRuntimeQuery() {
  const client = new QueryClient({ defaultOptions: { queries: politicaQuery } });
  let generation = useAuthStore.getState().capturarSesion().generation;
  const limpiar = (propia?: number) => {
    // cancelQueries initiates abort synchronously; clearing cannot await its promise.
    void client.cancelQueries();
    if (propia !== undefined && useAuthStore.getState().capturarSesion().generation !== propia) return;
    client.clear();
  };
  const unsubscribe = useAuthStore.subscribe(() => {
    const actual = useAuthStore.getState().capturarSesion().generation;
    if (actual === generation) return;
    generation = actual;
    limpiar(actual);
  });
  return {
    client,
    dispose: () => {
      unsubscribe();
      limpiar();
    },
  };
}
