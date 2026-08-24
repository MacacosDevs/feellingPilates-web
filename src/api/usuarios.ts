import { apiClient } from './client';
import type { ActualizarPerfilRequest, UsuarioResponse } from './types';

export function obtenerMiPerfil() {
  return apiClient.get<UsuarioResponse>('/usuarios/me').then((res) => res.data);
}

export function actualizarMiPerfil(request: ActualizarPerfilRequest) {
  return apiClient.put<UsuarioResponse>('/usuarios/me', request).then((res) => res.data);
}
