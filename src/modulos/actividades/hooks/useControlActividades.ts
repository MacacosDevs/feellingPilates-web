import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import type { ColumnaTabla } from '../../../components/DataTable';
import { useTablaLocal } from '../../../hooks/useTablaLocal';
import { usePermisos } from '../../../auth/usePermisos';
import {
  actualizarTipoActividad,
  crearTipoActividad,
  crearTipoRecurso,
  desactivarTipoActividad,
  guardarRecursosDeActividad,
  listarRecursosDeActividad,
  listarTiposActividad,
  listarTiposRecurso,
} from '../../../api/catalogos';
import type { ActividadRecursoRequest, ApiErrorBody, TipoActividadResponse, TipoRecursoResponse } from '../../../api/types';

function extraerMensajeError(err: unknown, mensajePorDefecto: string): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.message ?? mensajePorDefecto;
  }
  return mensajePorDefecto;
}

type Columna = 'nombre' | 'duracion' | 'recursos' | 'estado' | 'acciones';

const COMPARADORES: Record<Columna, (a: TipoActividadResponse, b: TipoActividadResponse) => number> = {
  nombre: (a, b) => a.nombre.localeCompare(b.nombre),
  duracion: (a, b) => a.duracionMinutos - b.duracionMinutos,
  recursos: () => 0,
  estado: (a, b) => Number(a.activo) - Number(b.activo),
  acciones: () => 0,
};

interface FormularioActividad {
  id: string | null;
  nombre: string;
  descripcion: string;
  duracionMinutos: string;
  esPareja: boolean;
  etiquetasTexto: string;
}

function separarEtiquetas(texto: string): string[] {
  return [...new Set(texto.split(',').map((e) => e.trim()).filter((e) => e.length > 0))];
}

function formularioVacio(): FormularioActividad {
  return { id: null, nombre: '', descripcion: '', duracionMinutos: '60', esPareja: false, etiquetasTexto: '' };
}

function formularioDesde(a: TipoActividadResponse): FormularioActividad {
  return {
    id: a.id,
    nombre: a.nombre,
    descripcion: a.descripcion ?? '',
    duracionMinutos: a.duracionMinutos.toString(),
    esPareja: a.participantesPorReserva >= 2,
    etiquetasTexto: a.etiquetas.join(', '),
  };
}

interface FilaRecurso {
  tipoRecursoId: string;
  cantidad: string;
}

export function useControlActividades() {
  const { tiene, mensajeSinPermiso } = usePermisos();
  const puedeLeer = tiene('actividades.leer');
  const puedeGestionar = tiene('actividades.gestionar');

  const [actividades, setActividades] = useState<TipoActividadResponse[]>([]);
  const [recursosPorActividad, setRecursosPorActividad] = useState<Record<string, string[]>>({});
  const [tiposRecurso, setTiposRecurso] = useState<TipoRecursoResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [dialogoNuevo, setDialogoNuevo] = useState<FormularioActividad | null>(null);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  const [actividadRecursos, setActividadRecursos] = useState<TipoActividadResponse | null>(null);
  const [filasRecurso, setFilasRecurso] = useState<FilaRecurso[]>([]);
  const [nuevoTipoRecurso, setNuevoTipoRecurso] = useState('');
  const [errorRecursos, setErrorRecursos] = useState<string | null>(null);
  const [guardandoRecursos, setGuardandoRecursos] = useState(false);

  const cargar = () => {
    if (!puedeLeer) {
      setCargando(false);
      return;
    }
    setCargando(true);
    Promise.all([listarTiposActividad(), listarTiposRecurso()])
      .then(([acts, recs]) => {
        setActividades(acts);
        setTiposRecurso(recs);
        return Promise.all(acts.map((a) => listarRecursosDeActividad(a.id).then((r) => [a.id, r] as const)));
      })
      .then((pares) => {
        if (!pares) return;
        const mapa: Record<string, string[]> = {};
        for (const [id, recursos] of pares) {
          mapa[id] = recursos.map((r) => `${r.cantidad}× ${r.nombreRecurso}`);
        }
        setRecursosPorActividad(mapa);
      })
      .finally(() => setCargando(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(cargar, [puedeLeer]);

  const tabla = useTablaLocal<TipoActividadResponse, Columna>(actividades, COMPARADORES, 'nombre');

  const columnas: ColumnaTabla<Columna>[] = [
    { id: 'nombre', label: 'Nombre', ordenable: true },
    { id: 'duracion', label: 'Duración', ordenable: true },
    { id: 'recursos', label: 'Recursos requeridos' },
    { id: 'estado', label: 'Estado', ordenable: true },
    ...(puedeGestionar ? [{ id: 'acciones' as const, label: 'Acciones', align: 'right' as const }] : []),
  ];

  function guardarNuevaActividad() {
    if (!dialogoNuevo) return;
    if (!dialogoNuevo.nombre.trim()) {
      setErrorNuevo('El nombre es obligatorio');
      return;
    }
    const duracionMinutos = parseInt(dialogoNuevo.duracionMinutos, 10);
    const payload = {
      nombre: dialogoNuevo.nombre.trim(),
      descripcion: dialogoNuevo.descripcion.trim() || null,
      duracionMinutos: duracionMinutos > 0 ? duracionMinutos : null,
      participantesPorReserva: dialogoNuevo.esPareja ? 2 : 1,
      etiquetas: separarEtiquetas(dialogoNuevo.etiquetasTexto),
    };
    setGuardandoNuevo(true);
    setErrorNuevo(null);
    const operacion = dialogoNuevo.id ? actualizarTipoActividad(dialogoNuevo.id, payload) : crearTipoActividad(payload);
    operacion
      .then(() => {
        setDialogoNuevo(null);
        setFeedback(dialogoNuevo.id ? 'Actividad actualizada' : 'Actividad creada');
        cargar();
      })
      .catch((err) => setErrorNuevo(extraerMensajeError(err, 'No se pudo guardar la actividad')))
      .finally(() => setGuardandoNuevo(false));
  }

  function desactivar(a: TipoActividadResponse) {
    desactivarTipoActividad(a.id).then(() => {
      setFeedback('Actividad desactivada');
      cargar();
    });
  }

  function abrirRecursos(a: TipoActividadResponse) {
    setActividadRecursos(a);
    setErrorRecursos(null);
    listarRecursosDeActividad(a.id).then((recursos) => {
      setFilasRecurso(
        recursos.map((r) => ({
          tipoRecursoId: r.tipoRecursoId,
          cantidad: r.cantidad.toString(),
        })),
      );
    });
  }

  function agregarFilaRecurso() {
    const usados = new Set(filasRecurso.map((f) => f.tipoRecursoId));
    const disponible = tiposRecurso.find((t) => !usados.has(t.id));
    if (!disponible) return;
    setFilasRecurso([...filasRecurso, { tipoRecursoId: disponible.id, cantidad: '1' }]);
  }

  function actualizarFilaRecurso(index: number, cambios: Partial<FilaRecurso>) {
    setFilasRecurso(filasRecurso.map((f, i) => (i === index ? { ...f, ...cambios } : f)));
  }

  function quitarFilaRecurso(index: number) {
    setFilasRecurso(filasRecurso.filter((_, i) => i !== index));
  }

  function guardarRecursos() {
    if (!actividadRecursos) return;
    const duplicados = new Set(filasRecurso.map((f) => f.tipoRecursoId)).size !== filasRecurso.length;
    if (duplicados) {
      setErrorRecursos('No repitas el mismo tipo de recurso');
      return;
    }
    const payload: ActividadRecursoRequest[] = filasRecurso.map((f) => ({
      tipoRecursoId: f.tipoRecursoId,
      cantidad: parseInt(f.cantidad, 10) || 1,
    }));
    setGuardandoRecursos(true);
    setErrorRecursos(null);
    guardarRecursosDeActividad(actividadRecursos.id, payload)
      .then(() => {
        setActividadRecursos(null);
        setFeedback('Recursos actualizados');
        cargar();
      })
      .catch((err) => setErrorRecursos(extraerMensajeError(err, 'No se pudieron guardar los recursos')))
      .finally(() => setGuardandoRecursos(false));
  }

  function crearNuevoTipoRecurso() {
    if (!nuevoTipoRecurso.trim()) return;
    crearTipoRecurso({ nombre: nuevoTipoRecurso.trim(), descripcion: null }).then((creado) => {
      setTiposRecurso([...tiposRecurso, creado]);
      setNuevoTipoRecurso('');
      setFilasRecurso([...filasRecurso, { tipoRecursoId: creado.id, cantidad: '1' }]);
    });
  }

  return {
    puedeLeer,
    mensajeSinPermiso,
    puedeGestionar,
    setDialogoNuevo,
    formularioVacio,
    columnas,
    tabla,
    cargando,
    recursosPorActividad,
    formularioDesde,
    abrirRecursos,
    desactivar,
    dialogoNuevo,
    errorNuevo,
    guardarNuevaActividad,
    guardandoNuevo,
    separarEtiquetas,
    actividadRecursos,
    setActividadRecursos,
    errorRecursos,
    filasRecurso,
    tiposRecurso,
    actualizarFilaRecurso,
    quitarFilaRecurso,
    agregarFilaRecurso,
    nuevoTipoRecurso,
    setNuevoTipoRecurso,
    crearNuevoTipoRecurso,
    guardarRecursos,
    guardandoRecursos,
    feedback,
    setFeedback,
  };
}

export type ControlActividades = ReturnType<typeof useControlActividades>;
