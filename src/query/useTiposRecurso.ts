import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { CanceledError } from 'axios';
import { useCallback } from 'react';
import { listarTiposRecurso } from '../api/catalogos';
import { useAuthStore } from '../auth/authStore';
import { politicaQuery } from './queryClient';

export const claveTiposRecurso = (generacion: number) => ['catalogos', 'tipos-recurso', generacion] as const;

function exigirSesionVigente(generacion: number, signal?: AbortSignal) {
  if (signal?.aborted || useAuthStore.getState().capturarSesion().generation !== generacion) {
    throw new CanceledError('Sesión o solicitud reemplazada.');
  }
}

export function opcionesTiposRecurso(generacion: number) {
  return queryOptions({
    ...politicaQuery,
    queryKey: claveTiposRecurso(generacion),
    queryFn: async ({ signal }) => {
      exigirSesionVigente(generacion, signal);
      try {
        const data = await listarTiposRecurso(signal);
        exigirSesionVigente(generacion, signal);
        return data;
      } catch (error) {
        exigirSesionVigente(generacion, signal);
        throw error;
      }
    },
  });
}

export function useTiposRecurso(abierto: boolean) {
  useAuthStore((state) => state.generacion);
  const usuario = useAuthStore((state) => state.usuario);
  const cargando = useAuthStore((state) => state.cargando);
  const generacion = useAuthStore.getState().capturarSesion().generation;
  const client = useQueryClient();
  const query = useQuery({ ...opcionesTiposRecurso(generacion), enabled: abierto && usuario !== null && !cargando });
  const refrescar = useCallback(async () => {
    exigirSesionVigente(generacion);
    const filtros = { queryKey: claveTiposRecurso(generacion), exact: true };
    await client.cancelQueries(filtros);
    exigirSesionVigente(generacion);
    await client.invalidateQueries({ ...filtros, refetchType: 'none' });
    exigirSesionVigente(generacion);
    try {
      const data = await client.fetchQuery(opcionesTiposRecurso(generacion));
      exigirSesionVigente(generacion);
      return data;
    } catch (error) {
      exigirSesionVigente(generacion);
      throw error;
    }
  }, [client, generacion]);
  return { ...query, refrescar };
}
