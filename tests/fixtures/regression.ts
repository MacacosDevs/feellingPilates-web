import type { PaqueteGestionResponse, PaqueteResponse, Pagina, SalonDetalleResponse, TipoActividadResponse, TurnoInstructorResponse, UsuarioResponse, VentaResponse } from '../../src/api/types';
export const activities: TipoActividadResponse[] = ['Pilates', 'Yoga'].map((nombre, i) => ({ id: `a${i + 1}`, nombre, descripcion: null, activo: true, duracionMinutos: 60, participantesPorReserva: 1, etiquetas: [] }));
export function user(overrides: Partial<UsuarioResponse> = {}): UsuarioResponse {
    return { id: 'c1', nombre: 'Ana Prueba', correo: 'ana@example.invalid', telefono: null, fotoUrl: null, descripcion: null, proveedorAuth: 'LOCAL', estatus: 'ACTIVO', roles: ['ADMIN'], rolesAsignados: [], creadoEn: '2026-01-02T12:00:00Z', permisos: [], ...overrides };
}
export function pageOf<T>(content: T[], overrides: Partial<Pagina<T>> = {}): Pagina<T> { return { content, totalElements: content.length, totalPages: 1, number: 0, size: 10, ...overrides }; }
export function salon(overrides: Partial<SalonDetalleResponse> = {}): SalonDetalleResponse {
    return { id: 's1', nombre: 'Sede Prueba', estadoId: 1, estadoNombre: 'Querétaro', municipioId: 10, municipioNombre: 'Centro', telefono: '4421234567', calle: 'Prueba', numeroExterior: '12', numeroInterior: null, colonia: 'Centro', codigoPostal: '76000', referencias: null, direccionCompleta: null, latitud: null, longitud: null, activo: true, tiposActividad: activities, horarios: [0, 1, 2, 3, 4, 5, 6].map(diaSemana => ({ id: `h${diaSemana}`, diaSemana, horaApertura: '08:00', horaCierre: '18:00' })), recursos: [], ...overrides };
}
export const assignment = { instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: null, horaFin: null };
export function turno(overrides: Partial<TurnoInstructorResponse> = {}): TurnoInstructorResponse {
    return { id: 't1', salonId: 's1', salonNombre: 'Sede Prueba', tipo: 'RECURRENTE', diaSemana: 3, fecha: null, horaInicio: '09:00:00', horaFin: '11:00:00', instructores: [{ id: 'i1', nombre: 'Inés Prueba' }], actividades: [{ id: 'a1', nombre: 'Pilates' }], asignaciones: [{ instructorId: 'i1', instructorNombre: 'Inés Prueba', actividades: [{ id: 'a1', nombre: 'Pilates' }], horaInicio: null, horaFin: null }], ...overrides };
}
export function service(overrides: Partial<PaqueteGestionResponse> = {}): PaqueteGestionResponse {
    return { id: 'pA', nombre: 'Pack Prueba', descripcion: null, precioCentavos: 12345, vigenciaDias: 30, unitarioTexto: null, destacado: false, activo: true, orden: 0, actividades: [{ tipoActividadId: 'a1', nombreActividad: 'Pilates', cantidadClases: 2 }], creadoEn: '2026-01-02T12:00:00Z', ...overrides };
}
export function publicService(overrides: Partial<PaqueteResponse> = {}): PaqueteResponse {
    const { activo: _activo, orden: _orden, creadoEn: _creadoEn, ...fields } = service();
    return { ...fields, categoria: null, ...overrides };
}
export function sale(overrides: Partial<VentaResponse> = {}): VentaResponse {
    return { id: 'v1', clienteNombre: 'Ana Prueba', paqueteNombre: 'Pack Prueba', montoCentavos: 12345, metodoPago: 'efectivo', estado: 'pagada', creadoEn: '2026-01-02T12:00:00Z', fechaExpiracion: null, registradaPorNombre: 'Caja Prueba', salonNombre: 'Sede Prueba', grupoCompraId: 'abcdefg-123', numeroItem: 1, motivoEstado: null, ...overrides };
}
