import { create } from 'zustand';
import { getToken, setToken as persistToken } from '../api/client';
import { login as loginRequest } from '../api/auth';
import { obtenerMiPerfil } from '../api/usuarios';
import type { LoginRequest, UsuarioResponse } from '../api/types';

interface AuthState {
  usuario: UsuarioResponse | null;
  cargando: boolean;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
  refrescarPerfil: () => Promise<void>;
  inicializar: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  cargando: true,

  inicializar: async () => {
    try {
      await get().refrescarPerfil();
    } finally {
      set({ cargando: false });
    }
  },

  refrescarPerfil: async () => {
    if (!getToken()) {
      set({ usuario: null });
      return;
    }
    const perfil = await obtenerMiPerfil();
    set({ usuario: perfil });
  },

  login: async (request) => {
    const { token } = await loginRequest(request);
    persistToken(token);
    await get().refrescarPerfil();
  },

  logout: () => {
    persistToken(null);
    set({ usuario: null });
  },
}));
