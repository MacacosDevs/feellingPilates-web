import { create } from 'zustand';
import { CanceledError } from 'axios';
import { getToken, setToken as persistToken } from '../api/client';
import { login as loginRequest, completarInvitacion as invitacionRequest } from '../api/auth';
import { obtenerMiPerfil } from '../api/usuarios';
import { usePermisoCatalogoStore } from './permisoCatalogoStore';
import type { CompletarInvitacionRequest, LoginRequest, TokenResponse, UsuarioResponse } from '../api/types';

interface AuthState {
  usuario: UsuarioResponse | null;
  cargando: boolean;
  generacion: number;
  capturarSesion: () => { generation: number; token: string | null };
  login: (request: LoginRequest) => Promise<void>;
  completarInvitacion: (request: CompletarInvitacionRequest) => Promise<void>;
  expirar: (identity: { generation: number; status: 401 }) => void;
  logout: () => void;
  refrescarPerfil: () => Promise<void>;
  inicializar: () => Promise<void>;
}

let intentoAuth = 0;
let lecturaPerfil = 0;
let inicializacion = 0;
let generacionActual = 0;
let controladorPerfil: AbortController | undefined;
const cancelada = () => new CanceledError('Sesión o solicitud reemplazada.');

export const useAuthStore = create<AuthState>((set, get) => {
  const reemplazar = (token: string | null) => {
    const generacion = ++generacionActual;
    // Identity advances before clearing credentials or notifying dependent work.
    const intento = ++intentoAuth;
    lecturaPerfil++;
    inicializacion++;
    persistToken(token);
    const anterior = controladorPerfil;
    controladorPerfil = undefined;
    anterior?.abort();
    usePermisoCatalogoStore.getState().invalidar(generacion);
    if (generacion === generacionActual) set({ generacion, usuario: null, cargando: false });
    return { generacion, intento };
  };

  async function autenticar(request: () => Promise<TokenResponse>): Promise<void> {
    let { generacion, intento } = reemplazar(getToken());
    const vigente = () => generacion === generacionActual && intento === intentoAuth;
    try {
      if (!vigente()) throw cancelada();
      const { token } = await request();
      if (!vigente()) throw cancelada();
      ({ generacion, intento } = reemplazar(token));
      if (!vigente()) throw cancelada();
      await get().refrescarPerfil();
      if (!vigente()) throw cancelada();
    } catch (error) {
      if (!vigente()) throw cancelada();
      throw error;
    }
  }

  return {
    usuario: null,
    cargando: true,
    generacion: 0,
    capturarSesion: () => ({ generation: generacionActual, token: getToken() }),

    logout: () => { reemplazar(null); },
    expirar: ({ generation }) => {
      if (generation === generacionActual) reemplazar(null);
    },

    inicializar: async () => {
      const generacion = generacionActual;
      const propia = ++inicializacion;
      set({ cargando: true });
      try {
        await get().refrescarPerfil();
      } finally {
        if (generacion === generacionActual && propia === inicializacion) set({ cargando: false });
      }
    },

    refrescarPerfil: async () => {
      const generacion = generacionActual;
      const propia = ++lecturaPerfil;
      const vigente = () => generacion === generacionActual && propia === lecturaPerfil;
      if (!getToken()) {
        set({ usuario: null });
        return;
      }
      controladorPerfil?.abort();
      const controller = new AbortController();
      controladorPerfil = controller;
      try {
        const perfil = await obtenerMiPerfil(controller.signal);
        if (!vigente()) throw cancelada();
        set({ usuario: perfil });
        if (!vigente()) throw cancelada();
      } catch (error) {
        if (!vigente()) throw cancelada();
        throw error;
      } finally {
        if (vigente()) controladorPerfil = undefined;
      }
    },

    login: (request) => autenticar(() => loginRequest(request)),
    completarInvitacion: (request) => autenticar(() => invitacionRequest(request)),
  };
});
