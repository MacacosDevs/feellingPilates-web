import { apiClient } from './client';
import type { CompletarInvitacionRequest, InvitacionInfoResponse, LoginRequest, TokenResponse } from './types';

export function login(request: LoginRequest) {
  return apiClient.post<TokenResponse>('/auth/login', request).then((res) => res.data);
}

export function obtenerInvitacion(token: string) {
  return apiClient.get<InvitacionInfoResponse>(`/auth/invitaciones/${token}`).then((res) => res.data);
}

export function completarInvitacion(request: CompletarInvitacionRequest) {
  return apiClient.post<TokenResponse>('/auth/invitaciones/completar', request).then((res) => res.data);
}
