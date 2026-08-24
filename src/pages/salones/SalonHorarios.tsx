import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import {
  alpha,
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import {
  actualizarTurno,
  crearTurno,
  eliminarTurno,
  listarTurnosPorSalon,
  listarTurnosPuntuales,
} from '../../api/calendario';
import { listarEspecialidadesUsuario, listarUsuarios } from '../../api/usuariosAdmin';
import { eliminarExcepcionSalon, guardarExcepcionSalon, listarExcepcionesSalon, obtenerSalon } from '../../api/salones';
import { usePermisos } from '../../auth/usePermisos';
import type {
  ApiErrorBody,
  AsignacionInstructorRequest,
  InstructorResumen,
  Pagina,
  SalonDetalleResponse,
  SalonHorarioExcepcionResponse,
  TipoTurno,
  TurnoInstructorResponse,
  UsuarioResponse,
} from '../../api/types';
import { CalendarioHorariosInstructor } from './components/CalendarioHorariosInstructor';
import { EditarHorarioSemanalDialog } from './components/EditarHorarioSemanalDialog';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TAMANO_PAGINA_PUNTUALES = 10;

/** Domingo (inicio de semana, consistente con diaSemana 0=domingo) de la semana que contiene `fecha`. */
function domingoDeLaSemana(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** Formatea a "aaaa-mm-dd" usando la fecha local (no UTC): toISOString() corre la fecha al día
 * siguiente en horas de la tarde/noche para husos horarios detrás de UTC. */
function aIso(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

/** Día de la semana (a partir de "aaaa-mm-dd", sin desfase de zona horaria) de una fecha puntual. */
function diaDeLaSemana(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  return DIAS[new Date(anio, mes - 1, dia).getDay()];
}

function diaSemanaIndice(fechaIso: string): number {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  return new Date(anio, mes - 1, dia).getDay();
}

function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

type TipoExcepcionDetalle = 'cancelacion' | 'mismoHorario' | 'extra' | 'especial';

/**
 * Clasifica una excepción puntual comparándola contra el horario recurrente del mismo día de la
 * semana, para distinguir en la lista: mismo horario habitual (solo cambió el instructor ese
 * día), tiempo extra (agregado antes/después del horario habitual) u horario especial (rango
 * distinto al habitual ese día).
 */
function clasificarExcepcion(t: TurnoInstructorResponse, recurrentes: TurnoInstructorResponse[]): TipoExcepcionDetalle {
  if (t.tipo === 'CANCELACION') return 'cancelacion';
  const diaSemana = diaSemanaIndice(t.fecha ?? '');
  const inicio = aMinutos(t.horaInicio);
  const fin = aMinutos(t.horaFin);
  const turnosDia = recurrentes.filter((r) => r.diaSemana === diaSemana);
  if (turnosDia.some((r) => r.horaInicio === t.horaInicio && r.horaFin === t.horaFin)) return 'mismoHorario';
  if (turnosDia.some((r) => aMinutos(r.horaFin) === inicio || aMinutos(r.horaInicio) === fin)) return 'extra';
  return 'especial';
}

const ETIQUETA_TIPO_EXCEPCION: Record<TipoExcepcionDetalle, string> = {
  cancelacion: 'Día cancelado',
  mismoHorario: 'Cambio de instructor',
  extra: 'Tiempo extra',
  especial: 'Horario especial',
};

const DESCRIPCION_TIPO_EXCEPCION: Record<TipoExcepcionDetalle, string> = {
  cancelacion: 'No hay clases este día',
  mismoHorario: 'Se asigna especialmente en este día para este horario habitual',
  extra: 'Horas agregadas antes o después del horario habitual',
  especial: 'Horario distinto al habitual solo para este día',
};

const COLOR_TIPO_EXCEPCION: Record<TipoExcepcionDetalle, 'error' | 'success' | 'info' | 'warning'> = {
  cancelacion: 'error',
  mismoHorario: 'success',
  extra: 'info',
  especial: 'warning',
};

const ICONO_TIPO_EXCEPCION: Record<TipoExcepcionDetalle, typeof EventBusyIcon> = {
  cancelacion: EventBusyIcon,
  mismoHorario: PersonSearchIcon,
  extra: AccessTimeIcon,
  especial: WbSunnyIcon,
};

export function SalonHorarios() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tiene } = usePermisos();

  const puedeGestionar = tiene('calendario.gestionar');
  const puedeCancelar = tiene('calendario.cancelar');
  const puedeEditar = tiene('calendario.editar');
  const puedeAdministrarSalon = tiene('salon.administrar');

  const [salon, setSalon] = useState<SalonDetalleResponse | null>(null);
  const [instructores, setInstructores] = useState<UsuarioResponse[]>([]);
  const [mapaEspecialidades, setMapaEspecialidades] = useState<Record<string, string[]>>({});
  const [turnos, setTurnos] = useState<TurnoInstructorResponse[]>([]);
  const [inicioSemana, setInicioSemana] = useState(() => domingoDeLaSemana(new Date()));
  const [excepciones, setExcepciones] = useState<SalonHorarioExcepcionResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editandoHorarioSemanal, setEditandoHorarioSemanal] = useState(false);

  const [paginaPuntuales, setPaginaPuntuales] = useState<Pagina<TurnoInstructorResponse> | null>(null);
  const [numeroPaginaPuntuales, setNumeroPaginaPuntuales] = useState(0);
  const [filtroTipoPuntual, setFiltroTipoPuntual] = useState<'' | 'EXCEPCION' | 'CANCELACION'>('');
  const [filtroDiaPuntual, setFiltroDiaPuntual] = useState<number | ''>('');
  const [cargandoPuntuales, setCargandoPuntuales] = useState(false);

  const finSemana = useMemo(() => sumarDias(inicioSemana, 6), [inicioSemana]);

  const instructoresSalon: InstructorResumen[] = useMemo(
    () => instructores.map((u) => ({ id: u.id, nombre: u.nombre })),
    [instructores],
  );
  const actividadesSalon = salon?.tiposActividad.map((a) => ({ id: a.id, nombre: a.nombre })) ?? [];

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    Promise.all([obtenerSalon(id), listarUsuarios({ rol: 'INSTRUCTOR', size: 100 })])
      .then(([detalleSalon, pagina]) => {
        setSalon(detalleSalon);
        const delSalon = pagina.content.filter((u) =>
          u.rolesAsignados.some((ra) => ra.rol === 'INSTRUCTOR' && ra.salonIds.includes(id)),
        );
        setInstructores(delSalon);
        return Promise.all(delSalon.map((u) => listarEspecialidadesUsuario(u.id).catch(() => [])));
      })
      .then((listas) => {
        setInstructores((actual) => {
          const mapa: Record<string, string[]> = {};
          actual.forEach((u, i) => {
            mapa[u.id] = (listas[i] ?? []).map((e) => e.tipoActividadId);
          });
          setMapaEspecialidades(mapa);
          return actual;
        });
      })
      .catch(() => setError('No se pudo cargar la información del salón.'))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    if (!id) {
      setTurnos([]);
      return;
    }
    setCargandoTurnos(true);
    listarTurnosPorSalon(id)
      .then(setTurnos)
      .catch(() => setTurnos([]))
      .finally(() => setCargandoTurnos(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    listarExcepcionesSalon(id, aIso(inicioSemana), aIso(finSemana))
      .then(setExcepciones)
      .catch(() => setExcepciones([]));
  }, [id, inicioSemana, finSemana]);

  useEffect(() => {
    setNumeroPaginaPuntuales(0);
  }, [filtroTipoPuntual, filtroDiaPuntual]);

  useEffect(() => {
    if (!id) {
      setPaginaPuntuales(null);
      return;
    }
    cargarPuntuales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, numeroPaginaPuntuales, filtroTipoPuntual, filtroDiaPuntual]);

  function cargarPuntuales() {
    if (!id) return;
    setCargandoPuntuales(true);
    listarTurnosPuntuales(id, undefined, {
      page: numeroPaginaPuntuales,
      size: TAMANO_PAGINA_PUNTUALES,
      tipo: filtroTipoPuntual,
      diaSemana: filtroDiaPuntual,
    })
      .then(setPaginaPuntuales)
      .catch(() => setPaginaPuntuales(null))
      .finally(() => setCargandoPuntuales(false));
  }

  async function handleGuardarExcepcion(fecha: string, cerrado: boolean, horaApertura: string | null, horaCierre: string | null) {
    if (!id) return;
    setError(null);
    try {
      const guardada = await guardarExcepcionSalon(id, { fecha, cerrado, horaApertura, horaCierre });
      setExcepciones((actual) => [...actual.filter((e) => e.fecha !== fecha), guardada]);
      setFeedback(cerrado ? 'Día marcado como cerrado.' : 'Horario especial guardado.');
    } catch (err) {
      manejarError(err, 'No se pudo guardar la excepción de horario.');
    }
  }

  async function handleEliminarExcepcion(excepcionId: string) {
    if (!id) return;
    setError(null);
    try {
      await eliminarExcepcionSalon(id, excepcionId);
      setExcepciones((actual) => actual.filter((e) => e.id !== excepcionId));
      setFeedback('Excepción eliminada; el día vuelve al horario normal.');
    } catch (err) {
      manejarError(err, 'No se pudo eliminar la excepción.');
    }
  }

  function mensajeDeError(err: unknown, mensajePorDefecto: string): string {
    return isAxiosError<ApiErrorBody>(err) ? err.response?.data?.message ?? mensajePorDefecto : 'Ocurrió un error inesperado.';
  }

  function manejarError(err: unknown, mensajePorDefecto: string) {
    setError(mensajeDeError(err, mensajePorDefecto));
  }

  async function handleCrear(
    tipo: TipoTurno,
    diaSemana: number,
    fecha: string | null,
    horaInicio: string,
    horaFin: string,
    asignaciones: AsignacionInstructorRequest[],
  ) {
    if (!id) return;
    setError(null);
    try {
      const nuevo = await crearTurno({
        asignaciones,
        salonId: id,
        tipo,
        diaSemana: tipo === 'RECURRENTE' ? diaSemana : null,
        fecha: tipo === 'RECURRENTE' ? null : fecha,
        horaInicio,
        horaFin,
      });
      setTurnos((actual) => [...actual, nuevo]);
      if (tipo !== 'RECURRENTE') cargarPuntuales();
      setFeedback('Horario agregado.');
    } catch (err) {
      manejarError(err, 'No se pudo agregar el horario.');
    }
  }

  /**
   * silencioso=true evita el aviso de error en la parte superior de la página: lo usan los
   * diálogos/popovers que ya muestran el error dentro de sí mismos (para no duplicarlo).
   */
  async function handleMover(
    turnoId: string,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
    asignaciones: AsignacionInstructorRequest[],
    silencioso = false,
  ): Promise<string | null> {
    if (!silencioso) setError(null);
    try {
      const actualizado = await actualizarTurno(turnoId, { diaSemana, horaInicio, horaFin, asignaciones });
      setTurnos((actual) => actual.map((t) => (t.id === turnoId ? actualizado : t)));
      setFeedback('Horario actualizado.');
      return null;
    } catch (err) {
      const mensaje = mensajeDeError(err, 'No se pudo actualizar el horario.');
      if (!silencioso) setError(mensaje);
      return mensaje;
    }
  }

  /**
   * Cambia el horario solo para una fecha puntual, sin tocar el bloque recurrente. Puede venir
   * como varios tramos (ej. horario normal + tiempo extra con otros instructores), cada uno se
   * guarda como su propia excepción.
   */
  async function handleAjustarFecha(
    fecha: string,
    segmentos: { horaInicio: string; horaFin: string; asignaciones: AsignacionInstructorRequest[] }[],
    idsAReemplazar: string[] = [],
    silencioso = false,
  ): Promise<string | null> {
    if (!id) return null;
    if (!silencioso) setError(null);
    try {
      // Si ya existían excepciones para esta fecha (horario normal y/o tiempo extra), se
      // eliminan primero: si no, el backend las ve como turnos aparte y rechaza los nuevos por
      // solaparse con los que se están reemplazando.
      for (const idViejo of idsAReemplazar) {
        await eliminarTurno(idViejo);
      }
      const nuevos: TurnoInstructorResponse[] = [];
      for (const segmento of segmentos) {
        nuevos.push(
          await crearTurno({
            asignaciones: segmento.asignaciones,
            salonId: id,
            tipo: 'EXCEPCION',
            diaSemana: null,
            fecha,
            horaInicio: segmento.horaInicio,
            horaFin: segmento.horaFin,
          }),
        );
      }
      setTurnos((actual) => [...actual.filter((t) => !idsAReemplazar.includes(t.id)), ...nuevos]);
      cargarPuntuales();
      setFeedback('Horario guardado solo para esa fecha.');
      return null;
    } catch (err) {
      const mensaje = mensajeDeError(err, 'No se pudo guardar el horario de esa fecha.');
      if (!silencioso) setError(mensaje);
      return mensaje;
    }
  }

  async function handleCancelarFecha(fecha: string, instructorIds: string[]) {
    if (!id) return;
    setError(null);
    try {
      const nuevo = await crearTurno({
        asignaciones: instructorIds.map((instructorId) => ({ instructorId, tipoActividadIds: [], horaInicio: null, horaFin: null })),
        salonId: id,
        tipo: 'CANCELACION',
        diaSemana: null,
        fecha,
        horaInicio: '00:00',
        horaFin: '23:59',
      });
      setTurnos((actual) => [...actual, nuevo]);
      cargarPuntuales();
      setFeedback('Día cancelado.');
    } catch (err) {
      manejarError(err, 'No se pudo cancelar ese día.');
    }
  }

  async function handleEliminar(turnoId: string) {
    setError(null);
    try {
      await eliminarTurno(turnoId);
      setTurnos((actual) => actual.filter((t) => t.id !== turnoId));
      cargarPuntuales();
      setFeedback('Horario eliminado.');
    } catch (err) {
      manejarError(err, 'No se pudo eliminar el horario.');
    }
  }

  const recurrentes = turnos.filter((t) => t.tipo === 'RECURRENTE');
  const puntuales = turnos
    .filter((t) => t.tipo !== 'RECURRENTE')
    .sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''));

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!salon) {
    return <Alert severity="error">No se encontró el salón.</Alert>;
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/salones')} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h4">Horarios del salón</Typography>
          <Typography variant="body2" color="text.secondary">
            {salon.nombre} — horarios con sus instructores y actividades.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {instructores.length === 0 ? (
        <Alert severity="info">
          Este salón no tiene instructores asignados todavía. Ve a Usuarios y asigna esta sede a un instructor primero.
        </Alert>
      ) : (
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton size="small" onClick={() => setInicioSemana((s) => sumarDias(s, -7))}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 200, textAlign: 'center' }}>
              Semana del {inicioSemana.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al{' '}
              {finSemana.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </Typography>
            <IconButton size="small" onClick={() => setInicioSemana((s) => sumarDias(s, 7))}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            {puedeAdministrarSalon && (
              <Button
                size="small"
                startIcon={<ScheduleIcon fontSize="small" />}
                onClick={() => setEditandoHorarioSemanal(true)}
              >
                Horario habitual
              </Button>
            )}
          </Stack>

          {cargandoTurnos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <CalendarioHorariosInstructor
              horarios={salon.horarios}
              turnosRecurrentes={recurrentes}
              turnosPuntuales={puntuales}
              instructoresSalon={instructoresSalon}
              actividadesSalon={actividadesSalon}
              mapaEspecialidades={mapaEspecialidades}
              inicioSemana={inicioSemana}
              excepciones={excepciones}
              puedeGestionar={puedeGestionar}
              puedeCancelar={puedeCancelar}
              puedeEditar={puedeEditar}
              puedeAdministrarSalon={puedeAdministrarSalon}
              onCrear={handleCrear}
              onMover={handleMover}
              onCancelarFecha={handleCancelarFecha}
              onEliminar={handleEliminar}
              onGuardarExcepcion={handleGuardarExcepcion}
              onEliminarExcepcion={handleEliminarExcepcion}
              onAjustarFecha={handleAjustarFecha}
            />
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Excepciones y cancelaciones puntuales
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
              <TextField
                select
                size="small"
                label="Tipo"
                value={filtroTipoPuntual}
                onChange={(e) => setFiltroTipoPuntual(e.target.value as typeof filtroTipoPuntual)}
                sx={{ width: 170 }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="EXCEPCION">Horario especial</MenuItem>
                <MenuItem value="CANCELACION">Cancelación</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Día"
                value={filtroDiaPuntual}
                onChange={(e) => setFiltroDiaPuntual(e.target.value === '' ? '' : Number(e.target.value))}
                sx={{ width: 160 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {DIAS.map((dia, i) => (
                  <MenuItem key={dia} value={i}>
                    {dia}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {cargandoPuntuales ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : !paginaPuntuales || paginaPuntuales.content.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sin excepciones ni cancelaciones registradas.
              </Typography>
            ) : (
              <>
                <Stack spacing={1}>
                  {paginaPuntuales.content.map((t) => {
                    const tipoDetalle = clasificarExcepcion(t, recurrentes);
                    const color = COLOR_TIPO_EXCEPCION[tipoDetalle];
                    const Icono = ICONO_TIPO_EXCEPCION[tipoDetalle];
                    return (
                      <Paper key={t.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          variant="rounded"
                          sx={{ bgcolor: (th) => alpha(th.palette[color].main, 0.12), color: `${color}.main`, width: 36, height: 36 }}
                        >
                          <Icono fontSize="small" />
                        </Avatar>
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: `${color}.main` }}>
                              {ETIQUETA_TIPO_EXCEPCION[tipoDetalle]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {diaDeLaSemana(t.fecha ?? '')}, {t.fecha}
                              {t.tipo !== 'CANCELACION' && ` · ${t.horaInicio} – ${t.horaFin}`}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {DESCRIPCION_TIPO_EXCEPCION[tipoDetalle]}
                            {t.instructores.length > 0 && ` · ${t.instructores.map((i) => i.nombre).join(', ')}`}
                          </Typography>
                        </Stack>
                        <Box sx={{ flexGrow: 1 }} />
                        {puedeGestionar && (
                          <IconButton size="small" onClick={() => handleEliminar(t.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
                <TablePagination
                  component="div"
                  count={paginaPuntuales.totalElements}
                  page={numeroPaginaPuntuales}
                  onPageChange={(_, pagina) => setNumeroPaginaPuntuales(pagina)}
                  rowsPerPage={TAMANO_PAGINA_PUNTUALES}
                  rowsPerPageOptions={[TAMANO_PAGINA_PUNTUALES]}
                  labelRowsPerPage=""
                />
              </>
            )}
          </Box>
        </Stack>
      )}

      <Snackbar open={feedback !== null} autoHideDuration={4000} onClose={() => setFeedback(null)}>
        {feedback ? (
          <Alert severity="success" onClose={() => setFeedback(null)} variant="filled" sx={{ width: '100%' }}>
            {feedback}
          </Alert>
        ) : undefined}
      </Snackbar>

      {salon && (
        <EditarHorarioSemanalDialog
          salon={salon}
          open={editandoHorarioSemanal}
          onClose={() => setEditandoHorarioSemanal(false)}
          onGuardado={(actualizado) => {
            setSalon(actualizado);
            setFeedback('Horario habitual actualizado.');
          }}
        />
      )}
    </Box>
  );
}
