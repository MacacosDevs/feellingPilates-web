import { apiClient } from './client';
import type { PermisoResponse } from './types';

export function listarCatalogoPermisos() {
  return apiClient.get<PermisoResponse[]>('/permisos').then((res) => res.data);
}
