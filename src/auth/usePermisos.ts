import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { usePermisoCatalogoStore } from './permisoCatalogoStore';

const SIN_PERMISOS: readonly string[] = Object.freeze([]);

export function usePermisos() {
  const usuario = useAuthStore((state) => state.usuario);
  const generacion = useAuthStore((state) => state.generacion);
  const permisos = useAuthStore((state) => state.usuario?.permisos ?? SIN_PERMISOS);
  const descripciones = usePermisoCatalogoStore((state) => state.descripciones);
  const cargarCatalogo = usePermisoCatalogoStore((state) => state.cargar);

  useEffect(() => {
    // Description failures belong to this optional hook request, never grants.
    if (!usuario) return;
    void cargarCatalogo(generacion).catch(() => undefined);
  }, [cargarCatalogo, generacion, usuario]);

  const tiene = (codigo: string) => permisos.includes(codigo);

  /**
   * Mensaje "No tienes permiso: <descripción del permiso>" para mostrar en vez de
   * contenido/acciones bloqueadas, sin hardcodear el texto en cada pantalla. Si se
   * pasan varios códigos (p. ej. una vista que se desbloquea con cualquiera de dos
   * permisos), usa la descripción del primero.
   */
  const mensajeSinPermiso = (codigo: string | string[]) => {
    const primerCodigo = Array.isArray(codigo) ? codigo[0] : codigo;
    return `No tienes permiso: ${descripciones[primerCodigo] ?? primerCodigo}.`;
  };

  return {
    permisos,
    tiene,
    mensajeSinPermiso,
  };
}
