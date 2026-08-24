import { apiClient } from './client';
import type {
  ActualizarPerfilRequest,
  AltaPersonalResponse,
  CrearClienteRequest,
  CrearPersonalRequest,
  EspecialidadResponse,
  Pagina,
  RolConteoResponse,
  UsuarioResponse,
} from './types';

export interface ListarUsuariosOpciones {
  page?: number;
  size?: number;
  sort?: string;
  rol?: string;
  busqueda?: string;
}

export function listarUsuarios(opciones: ListarUsuariosOpciones = {}) {
  const { page = 0, size = 20, sort = 'creadoEn,desc', rol, busqueda } = opciones;
  return apiClient
    .get<Pagina<UsuarioResponse>>('/admin/usuarios', {
      params: { page, size, sort, rol: rol || undefined, busqueda: busqueda || undefined },
    })
    .then((res) => res.data);
}

export function conteoUsuariosPorRol() {
  return apiClient.get<RolConteoResponse[]>('/admin/usuarios/conteo-roles').then((res) => res.data);
}

export function crearCliente(request: CrearClienteRequest) {
  return apiClient.post<UsuarioResponse>('/admin/usuarios/clientes', request).then((res) => res.data);
}

export function crearPersonal(request: CrearPersonalRequest) {
  return apiClient.post<AltaPersonalResponse>('/admin/usuarios/personal', request).then((res) => res.data);
}

export function actualizarUsuario(id: string, request: ActualizarPerfilRequest) {
  return apiClient.put<UsuarioResponse>(`/admin/usuarios/${id}`, request).then((res) => res.data);
}

export function actualizarSedesUsuario(id: string, rol: string, salonIds: string[]) {
  return apiClient
    .put<UsuarioResponse>(`/admin/usuarios/${id}/roles/${rol}/sedes`, { salonIds })
    .then((res) => res.data);
}

export function listarEspecialidadesUsuario(id: string) {
  return apiClient.get<EspecialidadResponse[]>(`/admin/usuarios/${id}/especialidades`).then((res) => res.data);
}

export function actualizarEspecialidadesUsuario(id: string, tipoActividadIds: string[]) {
  return apiClient
    .put<EspecialidadResponse[]>(`/admin/usuarios/${id}/especialidades`, { tipoActividadIds })
    .then((res) => res.data);
}

export function suspenderUsuario(id: string) {
  return apiClient.patch<UsuarioResponse>(`/admin/usuarios/${id}/suspender`).then((res) => res.data);
}

export function reactivarUsuario(id: string) {
  return apiClient.patch<UsuarioResponse>(`/admin/usuarios/${id}/reactivar`).then((res) => res.data);
}
