import { apiClient } from './client';
import type { ActualizarRolRequest, CrearRolRequest, PermisoResponse, RolResponse } from './types';

export function listarRoles() {
  return apiClient.get<RolResponse[]>('/admin/roles').then((res) => res.data);
}

export function listarPermisos() {
  return apiClient.get<PermisoResponse[]>('/admin/roles/permisos').then((res) => res.data);
}

export function actualizarPermisosRol(rolId: string, permisos: string[]) {
  return apiClient.put<RolResponse>(`/admin/roles/${rolId}/permisos`, { permisos }).then((res) => res.data);
}

export function crearRol(request: CrearRolRequest) {
  return apiClient.post<RolResponse>('/admin/roles', request).then((res) => res.data);
}

export function actualizarRol(rolId: string, request: ActualizarRolRequest) {
  return apiClient.put<RolResponse>(`/admin/roles/${rolId}`, request).then((res) => res.data);
}
