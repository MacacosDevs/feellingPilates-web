import { apiClient } from './client';
import type { ActualizarTurnoRequest, Pagina, TipoTurno, TurnoInstructorRequest, TurnoInstructorResponse } from './types';

export function listarTurnosPorSalon(salonId: string) {
  return apiClient.get<TurnoInstructorResponse[]>('/turnos-instructor', { params: { salonId } }).then((res) => res.data);
}

export function listarTurnosPorInstructor(salonId: string, usuarioId: string) {
  return apiClient
    .get<TurnoInstructorResponse[]>('/turnos-instructor', { params: { salonId, usuarioId } })
    .then((res) => res.data);
}

export function crearTurno(request: TurnoInstructorRequest) {
  return apiClient.post<TurnoInstructorResponse>('/turnos-instructor', request).then((res) => res.data);
}

export function eliminarTurno(id: string) {
  return apiClient.delete(`/turnos-instructor/${id}`);
}

export function actualizarTurno(id: string, request: ActualizarTurnoRequest) {
  return apiClient.patch<TurnoInstructorResponse>(`/turnos-instructor/${id}`, request).then((res) => res.data);
}

export interface ListarTurnosPuntualesOpciones {
  page?: number;
  size?: number;
  tipo?: Extract<TipoTurno, 'EXCEPCION' | 'CANCELACION'> | '';
  diaSemana?: number | '';
}

export function listarTurnosPuntuales(salonId: string, usuarioId: string | undefined, opciones: ListarTurnosPuntualesOpciones = {}) {
  const { page = 0, size = 10, tipo, diaSemana } = opciones;
  return apiClient
    .get<Pagina<TurnoInstructorResponse>>('/turnos-instructor/puntuales', {
      params: {
        salonId,
        usuarioId: usuarioId || undefined,
        page,
        size,
        tipo: tipo || undefined,
        diaSemana: diaSemana === '' || diaSemana === undefined ? undefined : diaSemana,
      },
    })
    .then((res) => res.data);
}
