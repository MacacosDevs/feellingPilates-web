import { useCallback, useEffect, useRef, useState } from 'react';
import { listarSalones, obtenerSalon } from '../../../api/salones';
import type { SalonDetalleResponse, SalonResponse } from '../../../api/types';

export function useGestionSalones() {
  const [salones, setSalones] = useState<SalonResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargado, setCargado] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [salonEditando, setSalonEditando] = useState<SalonDetalleResponse | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);
  const vigente = useRef(false);
  const lecturaLista = useRef(0);
  const lecturaDetalle = useRef(0);

  function invalidarLecturas() {
    lecturaLista.current++;
    lecturaDetalle.current++;
  }

  const recargar = useCallback(async () => {
    if (!vigente.current) return;
    const lectura = ++lecturaLista.current;
    setCargando(true);
    setErrorLista(null);
    try {
      const resultado = await listarSalones();
      if (!vigente.current || lectura !== lecturaLista.current) return;
      setSalones(resultado);
      setCargado(true);
    } catch {
      if (vigente.current && lectura === lecturaLista.current) {
        setErrorLista('No se pudo actualizar la lista de salones. Intenta de nuevo.');
      }
    } finally {
      if (vigente.current && lectura === lecturaLista.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    vigente.current = true;
    void recargar();
    return () => {
      vigente.current = false;
      invalidarLecturas();
    };
  }, [recargar]);

  async function abrirEdicion(id: string) {
    const lectura = ++lecturaDetalle.current;
    setEditandoId(id);
    setErrorDetalle(null);
    try {
      const detalle = await obtenerSalon(id);
      if (!vigente.current || lectura !== lecturaDetalle.current) return;
      setSalonEditando(detalle);
      setDialogoAbierto(true);
    } catch {
      if (vigente.current && lectura === lecturaDetalle.current) {
        setErrorDetalle('No se pudo abrir el salón para editar. Vuelve a intentar desde su botón Editar.');
      }
    } finally {
      if (vigente.current && lectura === lecturaDetalle.current) setEditandoId(null);
    }
  }

  function abrirCreacion() {
    lecturaDetalle.current++;
    setEditandoId(null);
    setErrorDetalle(null);
    setSalonEditando(null);
    setDialogoAbierto(true);
  }

  function handleGuardado(salon: SalonDetalleResponse) {
    if (!vigente.current) return;
    setDialogoAbierto(false);
    setGuardado(`Salón ${salon.nombre} guardado`);
    void recargar();
  }

  return { salones, cargando, cargado, errorLista, errorDetalle, editandoId, dialogoAbierto,
    salonEditando, guardado, recargar, abrirEdicion, abrirCreacion, handleGuardado,
    cerrarDialogo: () => setDialogoAbierto(false), cerrarFeedback: () => setGuardado(null) };
}
