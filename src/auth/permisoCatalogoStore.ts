import { create } from 'zustand';
import { CanceledError } from 'axios';
import { listarCatalogoPermisos } from '../api/permisos';

interface PermisoCatalogoState {
  descripciones: Record<string, string>;
  cargando: boolean;
  generacion: number;
  invalidar: (generacion: number) => void;
  cargar: (generacion?: number) => Promise<void>;
}

let solicitud = 0;
let pendiente: Promise<void> | undefined;
let controller: AbortController | undefined;

export const usePermisoCatalogoStore = create<PermisoCatalogoState>((set, get) => ({
  descripciones: {},
  cargando: false,
  generacion: 0,

  invalidar: (generacion) => {
    solicitud++;
    const anterior = controller;
    controller = undefined;
    pendiente = undefined;
    set({ generacion, descripciones: {}, cargando: false });
    anterior?.abort();
  },

  cargar: (generacion = get().generacion) => {
    if (generacion !== get().generacion) return Promise.reject(new CanceledError('Sesión reemplazada.'));
    if (get().cargando && pendiente) return pendiente;
    if (Object.keys(get().descripciones).length > 0) return Promise.resolve();
    const propia = ++solicitud;
    controller?.abort();
    const propiaController = new AbortController();
    controller = propiaController;
    const vigente = () => generacion === get().generacion && propia === solicitud;
    pendiente = (async () => {
      try {
        const permisos = await listarCatalogoPermisos(propiaController.signal);
        if (!vigente()) throw new CanceledError('Sesión reemplazada.');
        set({
          descripciones: Object.fromEntries(permisos.map((p) => [p.codigo, p.descripcion ?? p.codigo])),
        });
      } catch (error) {
        if (!vigente()) throw new CanceledError('Sesión reemplazada.');
        throw error;
      } finally {
        if (vigente()) {
          pendiente = undefined;
          controller = undefined;
          set({ cargando: false });
        }
      }
    })();
    set({ cargando: true });
    return pendiente;
  },
}));
