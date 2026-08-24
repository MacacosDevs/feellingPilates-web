import { apiClient } from './client';
import type {
  GuardarExcepcionSalonRequest,
  SalonDetalleResponse,
  SalonHorarioExcepcionResponse,
  SalonRequest,
  SalonResponse,
} from './types';

export function listarSalones() {
  return apiClient.get<SalonResponse[]>('/salones').then((res) => res.data);
}

export function obtenerSalon(id: string) {
  return apiClient.get<SalonDetalleResponse>(`/salones/${id}`).then((res) => res.data);
}

export function crearSalon(request: SalonRequest) {
  return apiClient.post<SalonDetalleResponse>('/salones', request).then((res) => res.data);
}

export function actualizarSalon(id: string, request: SalonRequest) {
  return apiClient.put<SalonDetalleResponse>(`/salones/${id}`, request).then((res) => res.data);
}

export function listarExcepcionesSalon(salonId: string, desde: string, hasta: string) {
  return apiClient
    .get<SalonHorarioExcepcionResponse[]>(`/salones/${salonId}/excepciones-horario`, { params: { desde, hasta } })
    .then((res) => res.data);
}

export function guardarExcepcionSalon(salonId: string, request: GuardarExcepcionSalonRequest) {
  return apiClient
    .put<SalonHorarioExcepcionResponse>(`/salones/${salonId}/excepciones-horario`, request)
    .then((res) => res.data);
}

export function eliminarExcepcionSalon(salonId: string, id: string) {
  return apiClient.delete(`/salones/${salonId}/excepciones-horario/${id}`);
}
