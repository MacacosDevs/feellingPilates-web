import { apiClient } from './client';
import type {
  ActualizarPaqueteRequest,
  CrearPaqueteRequest,
  Pagina,
  PaqueteGestionResponse,
  PaqueteResponse,
  RegistrarVentaCarritoRequest,
  RegistrarVentaRequest,
  SedeVentaResponse,
  VentaCarritoResponse,
  VentaResponse,
} from './types';

export function listarPaquetesPublicos() {
  return apiClient.get<PaqueteResponse[]>('/publico/paquetes').then((res) => res.data);
}

export function listarPaquetesGestion() {
  return apiClient.get<PaqueteGestionResponse[]>('/ventas/servicios').then((res) => res.data);
}

export function crearPaquete(request: CrearPaqueteRequest) {
  return apiClient.post<PaqueteGestionResponse>('/ventas/servicios', request).then((res) => res.data);
}

export function actualizarPaquete(id: string, request: ActualizarPaqueteRequest) {
  return apiClient.put<PaqueteGestionResponse>(`/ventas/servicios/${id}`, request).then((res) => res.data);
}

export function deshabilitarPaquete(id: string) {
  return apiClient.patch<PaqueteGestionResponse>(`/ventas/servicios/${id}/deshabilitar`).then((res) => res.data);
}

export function habilitarPaquete(id: string) {
  return apiClient.patch<PaqueteGestionResponse>(`/ventas/servicios/${id}/habilitar`).then((res) => res.data);
}

export function listarSedesVenta() {
  return apiClient.get<SedeVentaResponse[]>('/ventas/sedes').then((res) => res.data);
}

export function registrarVenta(request: RegistrarVentaRequest) {
  return apiClient.post<VentaResponse>('/ventas', request).then((res) => res.data);
}

export function registrarVentaCarrito(request: RegistrarVentaCarritoRequest) {
  return apiClient.post<VentaCarritoResponse>('/ventas/carrito', request).then((res) => res.data);
}

export function reembolsarVenta(id: string, motivo: string) {
  return apiClient.patch<VentaResponse>(`/ventas/${id}/reembolsar`, { motivo }).then((res) => res.data);
}

export function listarVentas() {
  return apiClient.get<VentaResponse[]>('/ventas').then((res) => res.data);
}

export interface VentasOpciones {
  page?: number;
  size?: number;
  sort?: string;
  metodoPago?: string;
  salonId?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
  busqueda?: string;
}

export function listarVentasFiltrado(opciones: VentasOpciones = {}) {
  const { page = 0, size = 10, sort = 'creadoEn,desc', metodoPago, salonId, estado, desde, hasta, busqueda } = opciones;
  return apiClient
    .get<Pagina<VentaResponse>>('/ventas/buscar', {
      params: {
        page,
        size,
        sort,
        metodoPago: metodoPago || undefined,
        salonId: salonId || undefined,
        estado: estado || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        busqueda: busqueda || undefined,
      },
    })
    .then((res) => res.data);
}
