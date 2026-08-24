import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { usePermisoCatalogoStore } from './permisoCatalogoStore';

export function usePermisos() {
  const permisos = useAuthStore((state) => state.usuario?.permisos ?? []);
  const descripciones = usePermisoCatalogoStore((state) => state.descripciones);
  const cargarCatalogo = usePermisoCatalogoStore((state) => state.cargar);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

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
