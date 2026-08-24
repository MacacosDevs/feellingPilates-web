import { create } from 'zustand';
import { listarCatalogoPermisos } from '../api/permisos';

interface PermisoCatalogoState {
  descripciones: Record<string, string>;
  cargando: boolean;
  cargar: () => Promise<void>;
}

export const usePermisoCatalogoStore = create<PermisoCatalogoState>((set, get) => ({
  descripciones: {},
  cargando: false,

  cargar: async () => {
    if (get().cargando || Object.keys(get().descripciones).length > 0) return;
    set({ cargando: true });
    try {
      const permisos = await listarCatalogoPermisos();
      set({
        descripciones: Object.fromEntries(permisos.map((p) => [p.codigo, p.descripcion ?? p.codigo])),
      });
    } finally {
      set({ cargando: false });
    }
  },
}));
