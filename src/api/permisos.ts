import { apiClient } from './client';
import type { PermisoResponse } from './types';

export function listarCatalogoPermisos(signal?: AbortSignal) {
  return apiClient.get<PermisoResponse[]>('/permisos', { signal }).then((res) => res.data);
}
