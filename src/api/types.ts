export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface ActualizarPerfilRequest {
  nombre: string;
  telefono?: string;
  fotoUrl?: string;
  descripcion?: string;
}

export interface TokenResponse {
  token: string;
  tipo: string;
}

export interface RolAsignadoResponse {
  rol: string;
  salonIds: string[];
}

export interface UsuarioResponse {
  id: string;
  correo: string;
  nombre: string;
  telefono: string | null;
  fotoUrl: string | null;
  descripcion: string | null;
  proveedorAuth: string;
  estatus: string;
  roles: string[];
  rolesAsignados: RolAsignadoResponse[];
  creadoEn: string;
  permisos: string[];
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  codigo?: string | null;
  [key: string]: unknown;
}

export type RolPersonal = 'PERSONAL' | 'INSTRUCTOR' | 'ADMIN';

export interface SalonResponse {
  id: string;
  nombre: string;
  direccion: string | null;
  estadoId: number;
  estadoNombre: string;
  municipioId: number;
  municipioNombre: string;
  creadoEn: string;
}

export interface CrearClienteRequest {
  correo: string;
  nombre: string;
  telefono?: string;
  salonIds?: string[];
}

export interface CrearPersonalRequest {
  correo: string;
  nombre: string;
  telefono?: string;
  rol: RolPersonal;
  salonIds?: string[];
}

export interface AltaPersonalResponse {
  usuario: UsuarioResponse;
  contrasenaTemporal: string;
}

export interface InvitacionInfoResponse {
  correo: string;
  nombre: string;
}

export interface CompletarInvitacionRequest {
  token: string;
  contrasena: string;
}

export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface RolConteoResponse {
  rol: string;
  total: number;
}

export interface PermisoResponse {
  codigo: string;
  descripcion: string | null;
  categoria: string;
}

export interface RolResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  permisos: string[];
  editable: boolean;
}

export interface ActualizarPermisosRolRequest {
  permisos: string[];
}

export interface CrearRolRequest {
  nombre: string;
  descripcion: string | null;
}

export interface ActualizarRolRequest {
  nombre: string;
  descripcion: string | null;
}

export interface EstadoResponse {
  id: number;
  nombre: string;
}

export interface MunicipioResponse {
  id: number;
  estadoId: number;
  nombre: string;
}

export interface TipoActividadResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  duracionMinutos: number;
  participantesPorReserva: number;
  etiquetas: string[];
}

export interface EspecialidadResponse {
  tipoActividadId: string;
  nombre: string;
  duracionMinutos: number;
}

export type TipoTurno = 'RECURRENTE' | 'EXCEPCION' | 'CANCELACION';

/**
 * Un instructor del bloque, que actividades especificas da (puede quedar vacio: sin definir), y
 * que lapso cubre dentro del turno: horaInicio/horaFin null = cubre el bloque completo.
 */
export interface AsignacionInstructorRequest {
  instructorId: string;
  tipoActividadIds: string[];
  horaInicio: string | null;
  horaFin: string | null;
}

export interface TurnoInstructorRequest {
  asignaciones: AsignacionInstructorRequest[];
  salonId: string;
  tipo: TipoTurno;
  diaSemana: number | null;
  fecha: string | null;
  horaInicio: string;
  horaFin: string;
}

export interface InstructorResumen {
  id: string;
  nombre: string;
}

export interface ActividadResumen {
  id: string;
  nombre: string;
}

/** Que actividades especificas da un instructor en un bloque y que lapso cubre (null = completo). */
export interface InstructorAsignacionResponse {
  instructorId: string;
  instructorNombre: string;
  actividades: ActividadResumen[];
  horaInicio: string | null;
  horaFin: string | null;
}

export interface TurnoInstructorResponse {
  id: string;
  instructores: InstructorResumen[];
  salonId: string;
  salonNombre: string;
  tipo: TipoTurno;
  diaSemana: number | null;
  fecha: string | null;
  horaInicio: string;
  horaFin: string;
  actividades: ActividadResumen[];
  asignaciones: InstructorAsignacionResponse[];
}

export interface ActualizarTurnoRequest {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  asignaciones: AsignacionInstructorRequest[];
}

export interface TipoRecursoResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CatalogoItemRequest {
  nombre: string;
  descripcion: string | null;
  duracionMinutos?: number | null;
  participantesPorReserva?: number | null;
  etiquetas?: string[];
}

export interface RecursoItem {
  tipoRecursoId: string;
  cantidad: number;
}

export interface RecursoItemResponse {
  tipoRecursoId: string;
  nombre: string;
  cantidad: number;
}

export interface ActividadRecursoRequest {
  tipoRecursoId: string;
  cantidad: number;
}

export interface ActividadRecursoResponse {
  tipoRecursoId: string;
  nombreRecurso: string;
  cantidad: number;
}

export interface HorarioOperacionRequest {
  diaSemana: number;
  horaApertura: string;
  horaCierre: string;
}

export interface HorarioOperacionResponse {
  id: string;
  diaSemana: number;
  horaApertura: string;
  horaCierre: string;
}

export interface HorarioOperacionVersionResponse {
  diaSemana: number;
  horaApertura: string;
  horaCierre: string;
  vigenteDesde: string | null;
  vigenteHasta: string | null;
}

export interface VersionarHorarioSalonRequest {
  diaSemana: number;
  efectivoDesde: string;
  horaApertura: string;
  horaCierre: string;
}

export interface CerrarHorarioSalonRequest {
  diaSemana: number;
  efectivoDesde: string;
}

export interface SalonRequest {
  nombre: string;
  estadoId: number;
  municipioId: number;
  telefono: string | null;
  calle: string | null;
  numeroExterior: string | null;
  numeroInterior: string | null;
  colonia: string | null;
  codigoPostal: string | null;
  referencias: string | null;
  direccionCompleta: string | null;
  latitud: number | null;
  longitud: number | null;
  tipoActividadIds: string[];
  horarios: HorarioOperacionRequest[] | null;
  recursos: RecursoItem[];
}

export interface SalonHorarioExcepcionResponse {
  id: string;
  fecha: string;
  cerrado: boolean;
  horaApertura: string | null;
  horaCierre: string | null;
}

export interface GuardarExcepcionSalonRequest {
  fecha: string;
  cerrado: boolean;
  horaApertura: string | null;
  horaCierre: string | null;
}

export interface SalonDetalleResponse {
  id: string;
  nombre: string;
  estadoId: number;
  estadoNombre: string;
  municipioId: number;
  municipioNombre: string;
  telefono: string | null;
  calle: string | null;
  numeroExterior: string | null;
  numeroInterior: string | null;
  colonia: string | null;
  codigoPostal: string | null;
  referencias: string | null;
  direccionCompleta: string | null;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
  tiposActividad: TipoActividadResponse[];
  horarios: HorarioOperacionResponse[];
  recursos: RecursoItemResponse[];
}

export interface PaqueteResponse {
  id: string;
  categoria: string | null;
  nombre: string;
  descripcion: string | null;
  precioCentavos: number;
  vigenciaDias: number;
  unitarioTexto: string | null;
  destacado: boolean;
  actividades: ActividadPaqueteResponse[];
}

export interface ActividadPaqueteRequest {
  tipoActividadId: string;
  cantidadClases: number;
}

export interface ActividadPaqueteResponse {
  tipoActividadId: string;
  nombreActividad: string;
  cantidadClases: number;
}

export interface PaqueteGestionResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioCentavos: number;
  vigenciaDias: number;
  unitarioTexto: string | null;
  destacado: boolean;
  activo: boolean;
  orden: number;
  actividades: ActividadPaqueteResponse[];
  creadoEn: string;
}

export interface CrearPaqueteRequest {
  nombre: string;
  descripcion: string | null;
  precioCentavos: number;
  vigenciaDias: number;
  unitarioTexto: string | null;
  destacado: boolean;
  orden: number;
  actividades: ActividadPaqueteRequest[];
}

export interface ActualizarPaqueteRequest extends CrearPaqueteRequest {
  activo: boolean;
}

export interface SedeVentaResponse {
  id: string;
  nombre: string;
}

export interface RegistrarVentaRequest {
  clienteId: string;
  paqueteId: string;
  salonId: string;
  metodoPago: 'efectivo' | 'transferencia';
}

export interface VentaResponse {
  id: string;
  clienteNombre: string;
  paqueteNombre: string;
  montoCentavos: number;
  metodoPago: string;
  estado: string;
  creadoEn: string;
  fechaExpiracion: string | null;
  registradaPorNombre: string | null;
  salonNombre: string | null;
  grupoCompraId: string | null;
  numeroItem: number | null;
  motivoEstado: string | null;
}

export interface ItemCarritoRequest {
  paqueteId: string;
  cantidad: number;
}

export interface RegistrarVentaCarritoRequest {
  clienteId: string;
  salonId: string;
  metodoPago: 'efectivo' | 'transferencia';
  items: ItemCarritoRequest[];
}

export interface VentaCarritoResponse {
  grupoCompraId: string;
  items: VentaResponse[];
  totalCentavos: number;
}
