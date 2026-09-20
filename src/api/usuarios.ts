import { apiClient } from './client';
import type { ActualizarPerfilRequest, UsuarioResponse } from './types';

export function obtenerMiPerfil(signal?: AbortSignal) {
  return apiClient.get<UsuarioResponse>('/usuarios/me', { signal }).then((res) => res.data);
}

export function actualizarMiPerfil(request: ActualizarPerfilRequest) {
  return apiClient.put<UsuarioResponse>('/usuarios/me', request).then((res) => res.data);
}
