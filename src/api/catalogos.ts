import { apiClient } from './client';
import type {
  ActividadRecursoRequest,
  ActividadRecursoResponse,
  CatalogoItemRequest,
  EstadoResponse,
  MunicipioResponse,
  TipoActividadResponse,
  TipoRecursoResponse,
} from './types';

export function listarEstados() {
  return apiClient.get<EstadoResponse[]>('/ubicaciones/estados').then((res) => res.data);
}

export function listarMunicipios(estadoId: number) {
  return apiClient.get<MunicipioResponse[]>(`/ubicaciones/estados/${estadoId}/municipios`).then((res) => res.data);
}

export function listarTiposActividad(buscar?: string) {
  return apiClient
    .get<TipoActividadResponse[]>('/tipos-actividad', { params: buscar ? { buscar } : undefined })
    .then((res) => res.data);
}

export function crearTipoActividad(request: CatalogoItemRequest) {
  return apiClient.post<TipoActividadResponse>('/tipos-actividad', request).then((res) => res.data);
}

export function actualizarTipoActividad(id: string, request: CatalogoItemRequest) {
  return apiClient.put<TipoActividadResponse>(`/tipos-actividad/${id}`, request).then((res) => res.data);
}

export function desactivarTipoActividad(id: string) {
  return apiClient.patch<TipoActividadResponse>(`/tipos-actividad/${id}/desactivar`).then((res) => res.data);
}

export function listarTiposRecurso() {
  return apiClient.get<TipoRecursoResponse[]>('/tipos-recurso').then((res) => res.data);
}

export function crearTipoRecurso(request: CatalogoItemRequest) {
  return apiClient.post<TipoRecursoResponse>('/tipos-recurso', request).then((res) => res.data);
}

export function listarRecursosDeActividad(tipoActividadId: string) {
  return apiClient
    .get<ActividadRecursoResponse[]>(`/tipos-actividad/${tipoActividadId}/recursos`)
    .then((res) => res.data);
}

export function guardarRecursosDeActividad(tipoActividadId: string, items: ActividadRecursoRequest[]) {
  return apiClient
    .put<ActividadRecursoResponse[]>(`/tipos-actividad/${tipoActividadId}/recursos`, items)
    .then((res) => res.data);
}
