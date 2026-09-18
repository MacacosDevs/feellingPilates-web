import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTimeOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditCalendarIcon from '@mui/icons-material/EditCalendarOutlined';
import EventBusyIcon from '@mui/icons-material/EventBusyOutlined';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenterOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import LockClockIcon from '@mui/icons-material/LockClockOutlined';
import RestoreIcon from '@mui/icons-material/RestoreOutlined';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TuneIcon from '@mui/icons-material/TuneOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunnyOutlined';
import type {
  ActividadResumen,
  AsignacionInstructorRequest,
  HorarioOperacionResponse,
  InstructorAsignacionResponse,
  InstructorResumen,
  SalonHorarioExcepcionResponse,
  TurnoInstructorResponse,
} from '../../../api/types';

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const SLOT_MINUTOS = 30;
const PX_POR_HORA = 64;
const PX_POR_MINUTO = PX_POR_HORA / 60;
/** Bloques con menos altura que esto muestran un botón "más acciones" en vez de la fila de íconos, que no cabe. */
const ALTURA_MINIMA_ACCIONES_EN_LINEA = 66;

function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Recorta "HH:mm:ss" (formato que devuelve el backend) a "HH:mm" para mostrar. */
function corta(hora: string): string {
  return hora.slice(0, 5);
}

function redondear(minutos: number): number {
  return Math.round(minutos / SLOT_MINUTOS) * SLOT_MINUTOS;
}

function aHora(minutos: number): string {
  const m = redondear(minutos);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
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

/** Próxima fecha (aaaa-mm-dd) en que cae ese día de la semana, desde hoy inclusive. */
function proximaFecha(diaSemana: number): string {
  const hoy = new Date();
  const delta = (diaSemana - hoy.getDay() + 7) % 7;
  const fecha = new Date(hoy);
  fecha.setDate(hoy.getDate() + delta);
  return aIso(fecha);
}

function nombresDe(items: { nombre: string }[]): string {
  return items.map((i) => i.nombre).join(', ');
}

/**
 * Nombres de instructores para mostrar en el bloque, agregando "(HH:mm–HH:mm)" a quien no cubre
 * el bloque completo sino solo un lapso propio.
 */
function nombresConRango(instructores: { id: string; nombre: string }[], asignaciones: InstructorAsignacionResponse[]): string {
  return instructores
    .map((i) => {
      const asignacion = asignaciones.find((a) => a.instructorId === i.id);
      return asignacion?.horaInicio && asignacion?.horaFin
        ? `${i.nombre} (${corta(asignacion.horaInicio)}–${corta(asignacion.horaFin)})`
        : i.nombre;
    })
    .join(', ');
}

/** Día de la semana (0=domingo) de una fecha "aaaa-mm-dd", sin líos de huso horario. */
function diaSemanaDe(fechaIso: string): number {
  const [y, m, d] = fechaIso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** "Vie 7 ago" a partir de una fecha "aaaa-mm-dd". */
function formatoFechaCorta(fechaIso: string): string {
  const [, m, d] = fechaIso.split('-').map(Number);
  return `${DIAS_CORTO[diaSemanaDe(fechaIso)]} ${d} ${MESES_CORTO[m - 1]}`;
}

/** Asigna una "columna" a cada bloque para que los que se traslapan en horario se vean lado a lado. */
function asignarColumnas(items: { id: string; inicio: number; fin: number }[]): { columnas: Map<string, number>; total: number } {
  const ordenados = [...items].sort((a, b) => a.inicio - b.inicio);
  const finPorColumna: number[] = [];
  const columnas = new Map<string, number>();
  for (const item of ordenados) {
    let asignada = finPorColumna.findIndex((fin) => fin <= item.inicio);
    if (asignada === -1) {
      asignada = finPorColumna.length;
      finPorColumna.push(item.fin);
    } else {
      finPorColumna[asignada] = item.fin;
    }
    columnas.set(item.id, asignada);
  }
  return { columnas, total: finPorColumna.length || 1 };
}

interface EstadoCreacion {
  dia: number;
  inicio: number;
  fin: number;
}

interface PendienteCreacion {
  dia: number;
  horaInicio: string;
  horaFin: string;
  anchor: { top: number; left: number };
}

interface EstadoAjuste {
  turnoId: string;
  dia: number;
  inicio: number;
  fin: number;
}

interface EstadoAjusteExcepcion {
  excepcionId: string;
  dia: number;
  fecha: string;
  inicio: number;
  fin: number;
}

interface BloqueActivo {
  id: string;
  inicio: number;
  fin: number;
}

/** True si [aInicio,aFin) y [bInicio,bFin) se traslapan (comparación de minutos, fin exclusivo). */
function seSolapan(aInicio: number, aFin: number, bInicio: number, bFin: number): boolean {
  return aInicio < bFin && bInicio < aFin;
}

/** True si [inicio,fin) se traslapa con alguno de `bloques`, ignorando el de id `excluirId`. */
function haySolape(inicio: number, fin: number, bloques: BloqueActivo[], excluirId?: string): boolean {
  return bloques.some((b) => b.id !== excluirId && seSolapan(inicio, fin, b.inicio, b.fin));
}

interface MenuEditarBloque {
  anchor: HTMLElement;
  turno: TurnoInstructorResponse;
  fecha: string;
  excepcionExistente?: TurnoInstructorResponse;
}

interface MenuExcepcion {
  anchor: HTMLElement;
  diaSemana: number;
  fecha: string;
  excepcion: SalonHorarioExcepcionResponse | null;
}

interface Props {
  horarios: HorarioOperacionResponse[];
  turnosRecurrentes: TurnoInstructorResponse[];
  turnosPuntuales: TurnoInstructorResponse[];
  instructoresSalon: InstructorResumen[];
  actividadesSalon: ActividadResumen[];
  mapaEspecialidades: Record<string, string[]>;
  inicioSemana: Date;
  excepciones: SalonHorarioExcepcionResponse[];
  puedeGestionar: boolean;
  puedeCancelar: boolean;
  puedeEditar: boolean;
  puedeAdministrarSalon: boolean;
  onCrear: (
    tipo: 'RECURRENTE' | 'EXCEPCION',
    diaSemana: number,
    fecha: string | null,
    horaInicio: string,
    horaFin: string,
    asignaciones: AsignacionInstructorRequest[],
  ) => void;
  onMover: (
    turnoId: string,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
    asignaciones: AsignacionInstructorRequest[],
    silencioso?: boolean,
  ) => Promise<string | null>;
  onCancelarFecha: (fecha: string, instructorIds: string[]) => void;
  onEliminar: (turnoId: string) => void;
  onGuardarExcepcion: (fecha: string, cerrado: boolean, horaApertura: string | null, horaCierre: string | null) => void;
  onEliminarExcepcion: (excepcionId: string) => void;
  onAjustarFecha: (
    fecha: string,
    segmentos: { horaInicio: string; horaFin: string; asignaciones: AsignacionInstructorRequest[] }[],
    idsAReemplazar?: string[],
    silencioso?: boolean,
  ) => Promise<string | null>;
}

/**
 * Cuánto cubre un instructor dentro de un bloque: sus actividades, y si da todo el horario del
 * bloque ("tiempo completo": horaInicio/horaFin en null) o solo un lapso propio dentro de él.
 */
interface AsignacionInstructor {
  actividades: string[];
  horaInicio: string | null;
  horaFin: string | null;
}

/** instructorId -> qué actividades y qué lapso cubre en este bloque. */
type Asignaciones = Record<string, AsignacionInstructor>;

function asignacionesARequest(asignaciones: Asignaciones): AsignacionInstructorRequest[] {
  return Object.entries(asignaciones).map(([instructorId, a]) => ({
    instructorId,
    tipoActividadIds: a.actividades,
    horaInicio: a.horaInicio,
    horaFin: a.horaFin,
  }));
}

/**
 * Válido si hay al menos un instructor, todos tienen al menos una actividad asignada, y quien
 * eligió un rango propio (no tiempo completo) lo tiene completo y con fin después del inicio.
 */
function asignacionesValidas(asignaciones: Asignaciones): boolean {
  const entradas = Object.values(asignaciones);
  return (
    entradas.length > 0 &&
    entradas.every(
      (a) =>
        a.actividades.length > 0 &&
        ((a.horaInicio === null && a.horaFin === null) ||
          (!!a.horaInicio && !!a.horaFin && a.horaFin > a.horaInicio)),
    )
  );
}

/** True si [inicio,fin] cabe completo dentro de al menos una de las ventanas dadas. */
function cabeEnAlgunaVentana(inicio: string, fin: string, ventanas: { inicio: string; fin: string }[]): boolean {
  return ventanas.some((v) => aMinutos(inicio) >= aMinutos(v.inicio) && aMinutos(fin) <= aMinutos(v.fin));
}

/** Ningún rango propio (no "tiempo completo") se sale de los límites del bloque. */
function asignacionesDentroDeRango(asignaciones: Asignaciones, ventanas: { inicio: string; fin: string }[]): boolean {
  return Object.values(asignaciones).every(
    (a) => a.horaInicio === null || (!!a.horaFin && cabeEnAlgunaVentana(a.horaInicio, a.horaFin, ventanas)),
  );
}

/** Construye el estado inicial del selector a partir de un turno existente (editar/ajustar). */
function asignacionesDeTurno(turno: TurnoInstructorResponse): Asignaciones {
  const resultado: Asignaciones = {};
  turno.instructores.forEach((i) => {
    resultado[i.id] = { actividades: [], horaInicio: null, horaFin: null };
  });
  turno.asignaciones.forEach((a) => {
    resultado[a.instructorId] = {
      actividades: a.actividades.map((act) => act.id),
      // El backend manda "HH:mm:ss"; se recorta a "HH:mm" para que coincida con lo que usan los
      // inputs de hora en toda la UI (si no, el input nativo muestra un segmento de segundos).
      horaInicio: a.horaInicio ? corta(a.horaInicio) : null,
      horaFin: a.horaFin ? corta(a.horaFin) : null,
    };
  });
  return resultado;
}

/** Una fila: un instructor asignado, qué actividades da, y si cubre todo el bloque o solo un lapso. */
function FilaInstructorAsignacion({
  instructor,
  actividadesDisponibles,
  asignacion,
  ventanas,
  onCambiar,
  onQuitar,
}: {
  instructor: InstructorResumen;
  actividadesDisponibles: ActividadResumen[];
  asignacion: AsignacionInstructor;
  /** Rango del bloque en el que debe caber el lapso propio del instructor, si eligió uno. */
  ventanas: { inicio: string; fin: string }[];
  onCambiar: (v: AsignacionInstructor) => void;
  onQuitar: () => void;
}) {
  const rangoBloque = { inicio: ventanas[0]?.inicio ?? '00:00', fin: ventanas[ventanas.length - 1]?.fin ?? '23:59' };
  const esCompleto = asignacion.horaInicio === null;
  const finAntesDeInicio =
    !esCompleto &&
    !!asignacion.horaInicio &&
    !!asignacion.horaFin &&
    aMinutos(asignacion.horaFin) <= aMinutos(asignacion.horaInicio);
  const fueraDeRango =
    !esCompleto &&
    !finAntesDeInicio &&
    !!asignacion.horaInicio &&
    !!asignacion.horaFin &&
    !cabeEnAlgunaVentana(asignacion.horaInicio, asignacion.horaFin, ventanas);
  const rangoInvalido = !esCompleto && (!asignacion.horaInicio || !asignacion.horaFin || finAntesDeInicio || fueraDeRango);
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'flex-start',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.75,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'primary.light' },
      }}
    >
      <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'secondary.main', mt: 0.25 }}>
        {instructor.nombre.charAt(0).toUpperCase()}
      </Avatar>
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {instructor.nombre}
        </Typography>
        <TextField
          select
          fullWidth
          size="small"
          label="Actividades"
          value={asignacion.actividades}
          onChange={(e) => onCambiar({ ...asignacion, actividades: e.target.value as unknown as string[] })}
          error={asignacion.actividades.length === 0}
          helperText={asignacion.actividades.length === 0 ? 'Selecciona al menos una actividad.' : ' '}
          slotProps={{
            select: {
              multiple: true,
              renderValue: (v) =>
                (v as string[]).length === 0
                  ? 'Sin actividad específica'
                  : actividadesDisponibles
                      .filter((a) => (v as string[]).includes(a.id))
                      .map((a) => a.nombre)
                      .join(', '),
            },
          }}
        >
          {actividadesDisponibles.length === 0 && (
            <MenuItem disabled>Sin actividades registradas como especialidad.</MenuItem>
          )}
          {actividadesDisponibles.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              <Checkbox size="small" checked={asignacion.actividades.includes(a.id)} sx={{ p: 0.5, mr: 1 }} />
              <ListItemText primary={a.nombre} />
            </MenuItem>
          ))}
        </TextField>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={esCompleto ? 'completo' : 'rango'}
          onChange={(_, v) => {
            if (!v) return;
            onCambiar(
              v === 'completo'
                ? { ...asignacion, horaInicio: null, horaFin: null }
                : { ...asignacion, horaInicio: ventanas[0].inicio, horaFin: ventanas[0].fin },
            );
          }}
        >
          <ToggleButton value="completo" sx={{ flex: 1, textTransform: 'none' }}>
            Todo el horario
          </ToggleButton>
          <ToggleButton value="rango" sx={{ flex: 1, textTransform: 'none' }}>
            Solo un lapso
          </ToggleButton>
        </ToggleButtonGroup>
        {!esCompleto && (
          <Stack direction="row" spacing={1}>
            <TextField
              type="time"
              size="small"
              label="Desde"
              value={asignacion.horaInicio ?? ''}
              onChange={(e) => onCambiar({ ...asignacion, horaInicio: e.target.value.slice(0, 5) })}
              error={rangoInvalido}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1, minWidth: 0 }}
            />
            <TextField
              type="time"
              size="small"
              label="Hasta"
              value={asignacion.horaFin ?? ''}
              onChange={(e) => onCambiar({ ...asignacion, horaFin: e.target.value.slice(0, 5) })}
              error={rangoInvalido}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1, minWidth: 0 }}
            />
          </Stack>
        )}
        {!esCompleto && (
          <Typography variant="caption" color={rangoInvalido ? 'error' : 'text.secondary'}>
            {fueraDeRango
              ? `Debe estar dentro de ${rangoBloque.inicio}–${rangoBloque.fin}, el horario de este bloque.`
              : finAntesDeInicio
                ? 'La hora "Hasta" debe ser posterior a la hora "Desde".'
                : `Cubre de ${asignacion.horaInicio} a ${asignacion.horaFin}.`}
          </Typography>
        )}
      </Stack>
      <IconButton size="small" onClick={onQuitar} sx={{ mt: 0.5 }}>
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

/** Instructores asignados a este bloque, qué actividades da cada uno, y si cubre todo o un lapso. */
function AsignacionesInstructores({
  actividadesSalon,
  instructoresSalon,
  mapaEspecialidades,
  asignaciones,
  onAsignacionesChange,
  ventanas,
}: {
  actividadesSalon: ActividadResumen[];
  instructoresSalon: InstructorResumen[];
  mapaEspecialidades: Record<string, string[]>;
  asignaciones: Asignaciones;
  onAsignacionesChange: (v: Asignaciones) => void;
  ventanas: { inicio: string; fin: string }[];
}) {
  const [busqueda, setBusqueda] = useState('');
  const instructoresAsignados = instructoresSalon.filter((i) => i.id in asignaciones);
  const instructoresDisponibles = instructoresSalon.filter((i) => !(i.id in asignaciones));
  const instructoresAsignadosFiltrados = instructoresAsignados.filter((i) =>
    i.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  function agregarInstructor(instructorId: string) {
    if (!instructorId) return;
    onAsignacionesChange({ ...asignaciones, [instructorId]: { actividades: [], horaInicio: null, horaFin: null } });
  }

  function quitarInstructor(instructorId: string) {
    const copia = { ...asignaciones };
    delete copia[instructorId];
    onAsignacionesChange(copia);
  }

  function cambiar(instructorId: string, v: AsignacionInstructor) {
    onAsignacionesChange({ ...asignaciones, [instructorId]: v });
  }

  return (
    <Stack spacing={1.5}>
      {instructoresAsignados.length > 4 && (
        <TextField
          size="small"
          placeholder="Buscar instructor asignado…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
        {instructoresAsignados.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Aún no hay instructores asignados.
          </Typography>
        )}
        {instructoresAsignados.length > 0 && instructoresAsignadosFiltrados.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Ningún instructor asignado coincide con "{busqueda}".
          </Typography>
        )}
        {instructoresAsignadosFiltrados.map((i) => (
          <FilaInstructorAsignacion
            key={i.id}
            instructor={i}
            actividadesDisponibles={actividadesSalon.filter((a) => (mapaEspecialidades[i.id] ?? []).includes(a.id))}
            asignacion={asignaciones[i.id] ?? { actividades: [], horaInicio: null, horaFin: null }}
            ventanas={ventanas}
            onCambiar={(v) => cambiar(i.id, v)}
            onQuitar={() => quitarInstructor(i.id)}
          />
        ))}
      </Stack>
      <Autocomplete
        size="small"
        options={instructoresDisponibles}
        getOptionLabel={(i) => i.nombre}
        value={null}
        onChange={(_, i) => i && agregarInstructor(i.id)}
        disabled={instructoresDisponibles.length === 0}
        noOptionsText="Sin coincidencias."
        renderInput={(params) => (
          <TextField
            {...params}
            label="Agregar instructor"
            placeholder={instructoresDisponibles.length === 0 ? 'No hay más instructores del salón.' : 'Buscar…'}
          />
        )}
      />
    </Stack>
  );
}

export function CalendarioHorariosInstructor({
  horarios,
  turnosRecurrentes,
  turnosPuntuales,
  instructoresSalon,
  actividadesSalon,
  mapaEspecialidades,
  inicioSemana,
  excepciones,
  puedeGestionar,
  puedeCancelar,
  puedeEditar,
  puedeAdministrarSalon,
  onCrear,
  onMover,
  onCancelarFecha,
  onEliminar,
  onGuardarExcepcion,
  onEliminarExcepcion,
  onAjustarFecha,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const columnasRef = useRef<Record<number, HTMLDivElement | null>>({});
  const [creando, setCreando] = useState<EstadoCreacion | null>(null);
  const [ajuste, setAjuste] = useState<EstadoAjuste | null>(null);
  const [ajusteSolapa, setAjusteSolapa] = useState(false);
  const [ajusteExcepcion, setAjusteExcepcion] = useState<EstadoAjusteExcepcion | null>(null);
  const [ajusteExcepcionSolapa, setAjusteExcepcionSolapa] = useState(false);
  const [avisoSolape, setAvisoSolape] = useState(false);
  const [menuCancelar, setMenuCancelar] = useState<{ anchor: HTMLElement; turno: TurnoInstructorResponse; instructorIds: string[] } | null>(null);
  const [menuAccionesBloque, setMenuAccionesBloque] = useState<{ anchor: HTMLElement; id: string } | null>(null);
  const [fechaCancelar, setFechaCancelar] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState<{
    ids: string[];
    dia: string;
    horaInicio: string;
    horaFin: string;
    instructores: string[];
    actividades: string[];
  } | null>(null);
  const [menuEditarBloque, setMenuEditarBloque] = useState<MenuEditarBloque | null>(null);
  // Independientes: "recurrente" son los instructores de todas las semanas, "fecha" son los de
  // solo ese día puntual. Cambiar de pestaña no debe mezclar ni copiar uno en el otro.
  const [asignacionesEditarRecurrente, setAsignacionesEditarRecurrente] = useState<Asignaciones>({});
  const [asignacionesEditarFecha, setAsignacionesEditarFecha] = useState<Asignaciones>({});
  const [ambitoEditar, setAmbitoEditar] = useState<'fecha' | 'recurrente'>('fecha');
  const [errorEditarBloque, setErrorEditarBloque] = useState<string | null>(null);
  const [guardandoEditarBloque, setGuardandoEditarBloque] = useState(false);
  const asignacionesEditar = ambitoEditar === 'recurrente' ? asignacionesEditarRecurrente : asignacionesEditarFecha;
  const setAsignacionesEditar = ambitoEditar === 'recurrente' ? setAsignacionesEditarRecurrente : setAsignacionesEditarFecha;

  const [pendienteCreacion, setPendienteCreacion] = useState<PendienteCreacion | null>(null);
  const [tipoNuevo, setTipoNuevo] = useState<'RECURRENTE' | 'EXCEPCION'>('RECURRENTE');
  const [fechaNuevo, setFechaNuevo] = useState('');
  const [asignacionesNuevas, setAsignacionesNuevas] = useState<Asignaciones>({});

  const [menuExcepcion, setMenuExcepcion] = useState<MenuExcepcion | null>(null);
  const [cerradoExcepcion, setCerradoExcepcion] = useState(false);
  const [horaAperturaExcepcion, setHoraAperturaExcepcion] = useState('08:00');
  const [horaCierreExcepcion, setHoraCierreExcepcion] = useState('20:00');

  const puedeMoverOrecortar = puedeGestionar || puedeEditar;
  const puedeCancelarDia = puedeGestionar || puedeCancelar;

  const dias = useMemo(
    () => [...horarios].sort((a, b) => a.diaSemana - b.diaSemana),
    [horarios],
  );

  const { minApertura, maxCierre } = useMemo(() => {
    if (dias.length === 0) return { minApertura: 8 * 60, maxCierre: 20 * 60 };
    return {
      minApertura: Math.min(...dias.map((d) => aMinutos(d.horaApertura))),
      maxCierre: Math.max(...dias.map((d) => aMinutos(d.horaCierre))),
    };
  }, [dias]);

  const alturaTotal = (maxCierre - minApertura) * PX_POR_MINUTO;
  const marcasHora = useMemo(() => {
    const marcas: number[] = [];
    for (let m = Math.ceil(minApertura / 60) * 60; m <= maxCierre; m += 60) marcas.push(m);
    return marcas;
  }, [minApertura, maxCierre]);

  function yAminutos(clientY: number): number {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return minApertura;
    const minutos = minApertura + (clientY - rect.top) / PX_POR_MINUTO;
    return Math.min(maxCierre, Math.max(minApertura, minutos));
  }

  /** Sobre qué columna (día) cae esta posición horizontal; conserva el día actual si no cae en ninguna. */
  function xAdia(clientX: number, diaActual: number): number {
    for (const [dia, el] of Object.entries(columnasRef.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return Number(dia);
    }
    return diaActual;
  }

  /**
   * Bloques que ocupan el salón ese día de la semana / fecha: los turnos RECURRENTE de ese día
   * (siempre aplican, salvo que se estén arrastrando ellos mismos) más, si se da una fecha, las
   * EXCEPCION de esa fecha exacta — replica la regla de traslape del backend (RECURRENTE vs
   * RECURRENTE del mismo día; EXCEPCION vs EXCEPCION de la misma fecha y contra RECURRENTE del
   * mismo día de la semana).
   */
  function bloquesActivosDia(diaSemana: number, fecha: string | null): BloqueActivo[] {
    const recurrentes = turnosRecurrentes
      .filter((t) => t.diaSemana === diaSemana)
      .map((t) => ({ id: t.id, inicio: aMinutos(t.horaInicio), fin: aMinutos(t.horaFin) }));
    const excepcionesFecha = fecha
      ? turnosPuntuales
          .filter((t) => t.tipo === 'EXCEPCION' && t.fecha === fecha)
          .map((t) => ({ id: t.id, inicio: aMinutos(t.horaInicio), fin: aMinutos(t.horaFin) }))
      : [];
    return [...recurrentes, ...excepcionesFecha];
  }

  function iniciarCreacion(dia: HorarioOperacionResponse, e: React.MouseEvent<HTMLDivElement>) {
    if (!puedeGestionar) return;
    e.preventDefault();
    const inicio = redondear(yAminutos(e.clientY));
    const estado: EstadoCreacion = { dia: dia.diaSemana, inicio, fin: inicio };
    setCreando({ ...estado });

    const mover = (ev: MouseEvent) => {
      estado.fin = redondear(yAminutos(ev.clientY));
      setCreando({ ...estado });
    };
    const soltar = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
      setCreando(null);
      const inicioFinal = Math.min(estado.inicio, estado.fin);
      const finFinal = Math.max(estado.inicio, estado.fin);
      if (finFinal - inicioFinal >= SLOT_MINUTOS) {
        setTipoNuevo('RECURRENTE');
        setFechaNuevo(proximaFecha(estado.dia));
        setAsignacionesNuevas({});
        setPendienteCreacion({
          dia: estado.dia,
          horaInicio: aHora(inicioFinal),
          horaFin: aHora(finFinal),
          anchor: { top: ev.clientY, left: ev.clientX },
        });
      }
    };
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
  }

  /** True si el rango propuesto en `pendienteCreacion` se traslapa con algún bloque existente. */
  function haySolapeCreacion(): boolean {
    if (!pendienteCreacion) return false;
    const inicio = aMinutos(pendienteCreacion.horaInicio);
    const fin = aMinutos(pendienteCreacion.horaFin);
    if (tipoNuevo === 'EXCEPCION') {
      if (!fechaNuevo) return false;
      return haySolape(inicio, fin, bloquesActivosDia(diaSemanaDe(fechaNuevo), fechaNuevo));
    }
    return haySolape(inicio, fin, bloquesActivosDia(pendienteCreacion.dia, aIso(sumarDias(inicioSemana, pendienteCreacion.dia))));
  }

  function confirmarCreacion() {
    if (!pendienteCreacion || !asignacionesValidas(asignacionesNuevas)) return;
    if (haySolapeCreacion()) {
      setAvisoSolape(true);
      return;
    }
    onCrear(
      tipoNuevo,
      pendienteCreacion.dia,
      tipoNuevo === 'EXCEPCION' ? fechaNuevo : null,
      pendienteCreacion.horaInicio,
      pendienteCreacion.horaFin,
      asignacionesARequest(asignacionesNuevas),
    );
    setPendienteCreacion(null);
  }

  function iniciarAjuste(turno: TurnoInstructorResponse, modo: 'mover' | 'inicio' | 'fin', e: React.MouseEvent) {
    if (!puedeMoverOrecortar) return;
    e.preventDefault();
    e.stopPropagation();
    const inicioOriginal = aMinutos(turno.horaInicio);
    const finOriginal = aMinutos(turno.horaFin);
    const diaOriginal = turno.diaSemana ?? 0;
    const clientYInicial = e.clientY;
    const estado: EstadoAjuste = { turnoId: turno.id, dia: diaOriginal, inicio: inicioOriginal, fin: finOriginal };
    setAjuste({ ...estado });

    const mover = (ev: MouseEvent) => {
      const delta = redondear((ev.clientY - clientYInicial) / PX_POR_MINUTO);
      if (modo === 'mover') {
        const duracion = finOriginal - inicioOriginal;
        const inicio = Math.min(Math.max(inicioOriginal + delta, minApertura), maxCierre - duracion);
        estado.inicio = inicio;
        estado.fin = inicio + duracion;
        estado.dia = xAdia(ev.clientX, estado.dia);
      } else if (modo === 'inicio') {
        estado.inicio = Math.min(Math.max(inicioOriginal + delta, minApertura), finOriginal - SLOT_MINUTOS);
      } else {
        estado.fin = Math.max(Math.min(finOriginal + delta, maxCierre), inicioOriginal + SLOT_MINUTOS);
      }
      setAjuste({ ...estado });
      setAjusteSolapa(
        haySolape(
          estado.inicio,
          estado.fin,
          bloquesActivosDia(estado.dia, aIso(sumarDias(inicioSemana, estado.dia))),
          estado.turnoId,
        ),
      );
    };
    const soltar = () => {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
      setAjuste(null);
      const solapa = haySolape(
        estado.inicio,
        estado.fin,
        bloquesActivosDia(estado.dia, aIso(sumarDias(inicioSemana, estado.dia))),
        estado.turnoId,
      );
      setAjusteSolapa(false);
      if (solapa) {
        setAvisoSolape(true);
        return;
      }
      if (estado.inicio !== inicioOriginal || estado.fin !== finOriginal || estado.dia !== diaOriginal) {
        onMover(
          estado.turnoId,
          estado.dia,
          aHora(estado.inicio),
          aHora(estado.fin),
          asignacionesARequest(asignacionesDeTurno(turno)),
        );
      }
    };
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
  }

  /**
   * Igual que `iniciarAjuste` pero para bloques EXCEPCION: solo puede moverse verticalmente
   * (cambiar hora) dentro de la misma columna/fecha, nunca cambiar de día — una excepción está
   * atada a una fecha puntual. Al soltar, guarda con `onAjustarFecha` (el único que el backend
   * acepta para turnos no RECURRENTE), reemplazando la excepción original.
   */
  function iniciarAjusteExcepcion(
    excepcion: TurnoInstructorResponse,
    fecha: string,
    diaSemana: number,
    modo: 'mover' | 'inicio' | 'fin',
    e: React.MouseEvent,
  ) {
    if (!puedeMoverOrecortar) return;
    e.preventDefault();
    e.stopPropagation();
    const inicioOriginal = aMinutos(excepcion.horaInicio);
    const finOriginal = aMinutos(excepcion.horaFin);
    const clientYInicial = e.clientY;
    const estado: EstadoAjusteExcepcion = { excepcionId: excepcion.id, dia: diaSemana, fecha, inicio: inicioOriginal, fin: finOriginal };
    setAjusteExcepcion({ ...estado });

    const mover = (ev: MouseEvent) => {
      const delta = redondear((ev.clientY - clientYInicial) / PX_POR_MINUTO);
      if (modo === 'mover') {
        const duracion = finOriginal - inicioOriginal;
        const inicio = Math.min(Math.max(inicioOriginal + delta, minApertura), maxCierre - duracion);
        estado.inicio = inicio;
        estado.fin = inicio + duracion;
      } else if (modo === 'inicio') {
        estado.inicio = Math.min(Math.max(inicioOriginal + delta, minApertura), finOriginal - SLOT_MINUTOS);
      } else {
        estado.fin = Math.max(Math.min(finOriginal + delta, maxCierre), inicioOriginal + SLOT_MINUTOS);
      }
      setAjusteExcepcion({ ...estado });
      setAjusteExcepcionSolapa(
        haySolape(estado.inicio, estado.fin, bloquesActivosDia(estado.dia, estado.fecha), estado.excepcionId),
      );
    };
    const soltar = () => {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
      setAjusteExcepcion(null);
      const solapa = haySolape(estado.inicio, estado.fin, bloquesActivosDia(estado.dia, estado.fecha), estado.excepcionId);
      setAjusteExcepcionSolapa(false);
      if (solapa) {
        setAvisoSolape(true);
        return;
      }
      if (estado.inicio !== inicioOriginal || estado.fin !== finOriginal) {
        onAjustarFecha(
          estado.fecha,
          [
            {
              horaInicio: aHora(estado.inicio),
              horaFin: aHora(estado.fin),
              asignaciones: asignacionesARequest(asignacionesDeTurno(excepcion)),
            },
          ],
          [estado.excepcionId],
        );
      }
    };
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
  }

  function abrirMenuCancelar(
    e: React.MouseEvent<HTMLElement>,
    turno: TurnoInstructorResponse,
    instructoresOverride?: InstructorResumen[],
  ) {
    e.stopPropagation();
    setFechaCancelar(proximaFecha(turno.diaSemana ?? 0));
    const instructorIds = (instructoresOverride ?? turno.instructores).map((i) => i.id);
    setMenuCancelar({ anchor: e.currentTarget, turno, instructorIds });
  }

  function confirmarCancelacion() {
    if (fechaCancelar && menuCancelar) {
      onCancelarFecha(fechaCancelar, menuCancelar.instructorIds);
    }
    setMenuCancelar(null);
  }

  function abrirMenuEditarBloque(
    e: React.MouseEvent<HTMLElement>,
    turno: TurnoInstructorResponse,
    fecha: string,
    excepcionExistente?: TurnoInstructorResponse,
  ) {
    e.stopPropagation();
    setAsignacionesEditarRecurrente(asignacionesDeTurno(turno));
    setAsignacionesEditarFecha(excepcionExistente ? asignacionesDeTurno(excepcionExistente) : {});
    setAmbitoEditar('fecha');
    setErrorEditarBloque(null);
    setMenuEditarBloque({ anchor: e.currentTarget, turno, fecha, excepcionExistente });
  }

  async function confirmarEditarBloque() {
    if (!menuEditarBloque) return;
    const { turno, fecha, excepcionExistente } = menuEditarBloque;
    const rango = { inicio: corta(turno.horaInicio), fin: corta(turno.horaFin) };
    setErrorEditarBloque(null);
    if (ambitoEditar === 'recurrente') {
      if (!asignacionesValidas(asignacionesEditarRecurrente) || !asignacionesDentroDeRango(asignacionesEditarRecurrente, [rango])) return;
      setGuardandoEditarBloque(true);
      const error = await onMover(turno.id, turno.diaSemana ?? 0, turno.horaInicio, turno.horaFin, asignacionesARequest(asignacionesEditarRecurrente), true);
      setGuardandoEditarBloque(false);
      if (error) {
        setErrorEditarBloque(error);
        return;
      }
    } else if (Object.keys(asignacionesEditarFecha).length === 0) {
      // Se quitó a todos: si había una excepción para este día, se elimina y vuelve al horario
      // habitual; si no había ninguna, no hay nada que guardar.
      if (excepcionExistente) onEliminar(excepcionExistente.id);
    } else {
      if (!asignacionesValidas(asignacionesEditarFecha) || !asignacionesDentroDeRango(asignacionesEditarFecha, [rango])) return;
      setGuardandoEditarBloque(true);
      const error = await onAjustarFecha(
        fecha,
        [{ horaInicio: rango.inicio, horaFin: rango.fin, asignaciones: asignacionesARequest(asignacionesEditarFecha) }],
        excepcionExistente ? [excepcionExistente.id] : [],
        true,
      );
      setGuardandoEditarBloque(false);
      if (error) {
        setErrorEditarBloque(error);
        return;
      }
    }
    setMenuEditarBloque(null);
  }

  function abrirMenuExcepcion(e: React.MouseEvent<HTMLElement>, dia: HorarioOperacionResponse) {
    if (!puedeAdministrarSalon) return;
    e.stopPropagation();
    const fecha = aIso(sumarDias(inicioSemana, dia.diaSemana));
    const excepcion = excepciones.find((ex) => ex.fecha === fecha) ?? null;
    setCerradoExcepcion(excepcion?.cerrado ?? false);
    setHoraAperturaExcepcion(excepcion?.horaApertura ? corta(excepcion.horaApertura) : corta(dia.horaApertura));
    setHoraCierreExcepcion(excepcion?.horaCierre ? corta(excepcion.horaCierre) : corta(dia.horaCierre));
    setMenuExcepcion({ anchor: e.currentTarget, diaSemana: dia.diaSemana, fecha, excepcion });
  }

  function confirmarExcepcion() {
    if (!menuExcepcion) return;
    onGuardarExcepcion(
      menuExcepcion.fecha,
      cerradoExcepcion,
      cerradoExcepcion ? null : horaAperturaExcepcion,
      cerradoExcepcion ? null : horaCierreExcepcion,
    );
    setMenuExcepcion(null);
  }

  function quitarExcepcion() {
    if (menuExcepcion?.excepcion) onEliminarExcepcion(menuExcepcion.excepcion.id);
    setMenuExcepcion(null);
  }

  if (dias.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Este salón no tiene días de atención configurados; no se pueden asignar bloques.
      </Typography>
    );
  }

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ width: 56, flexShrink: 0 }} />
        {dias.map((dia) => {
          const fechaColumna = sumarDias(inicioSemana, dia.diaSemana);
          const excepcion = excepciones.find((ex) => ex.fecha === aIso(fechaColumna)) ?? null;
          const hoy = aIso(fechaColumna) === aIso(new Date());
          return (
            <Box
              key={dia.diaSemana}
              onClick={(e) => abrirMenuExcepcion(e, dia)}
              className="dia-header"
              sx={{
                flex: 1,
                position: 'relative',
                textAlign: 'center',
                py: 1.25,
                mx: 0.5,
                my: 0.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: excepcion?.cerrado
                  ? (t) => alpha(t.palette.error.main, 0.25)
                  : excepcion
                    ? (t) => alpha(t.palette.warning.main, 0.3)
                    : 'transparent',
                bgcolor: excepcion?.cerrado
                  ? (t) => alpha(t.palette.error.main, 0.06)
                  : excepcion
                    ? (t) => alpha(t.palette.warning.main, 0.08)
                    : hoy
                      ? (t) => alpha(t.palette.secondary.main, 0.08)
                      : 'transparent',
                cursor: puedeAdministrarSalon ? 'pointer' : 'default',
                transition: 'background-color .15s ease, border-color .15s ease, box-shadow .15s ease',
                '&:hover': puedeAdministrarSalon
                  ? {
                      bgcolor: excepcion?.cerrado
                        ? (t) => alpha(t.palette.error.main, 0.12)
                        : excepcion
                          ? (t) => alpha(t.palette.warning.main, 0.14)
                          : (t) => alpha(t.palette.secondary.main, 0.1),
                      boxShadow: '0 1px 4px rgba(15,15,16,0.1)',
                      '& .icono-editar': { opacity: 1 },
                    }
                  : undefined,
              }}
            >
              {puedeAdministrarSalon && (
                <Tooltip title="Editar horario de este día">
                  <EditCalendarIcon
                    className="icono-editar"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      fontSize: 15,
                      color: 'text.disabled',
                      opacity: 0.55,
                      transition: 'opacity .15s ease',
                    }}
                  />
                </Tooltip>
              )}
              <Typography variant="subtitle2" sx={{ color: hoy ? 'secondary.main' : 'text.primary' }}>
                {DIAS_CORTO[dia.diaSemana]} {fechaColumna.getDate()}/{fechaColumna.getMonth() + 1}
              </Typography>
              {excepcion?.cerrado ? (
                <Chip
                  size="small"
                  icon={<LockClockIcon sx={{ fontSize: 14 }} />}
                  label="Cerrado"
                  color="error"
                  variant="outlined"
                  sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                />
              ) : excepcion ? (
                <Chip
                  size="small"
                  icon={<WbSunnyIcon sx={{ fontSize: 14 }} />}
                  label={`${corta(excepcion.horaApertura!)}–${corta(excepcion.horaCierre!)}`}
                  color="warning"
                  variant="outlined"
                  sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {corta(dia.horaApertura)}–{corta(dia.horaCierre)}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fbfbfc' }}>
        <Box sx={{ width: 56, flexShrink: 0, position: 'relative', height: alturaTotal }}>
          {marcasHora.map((m) => (
            <Typography
              key={m}
              variant="caption"
              color="text.secondary"
              sx={{ position: 'absolute', top: (m - minApertura) * PX_POR_MINUTO - 7, right: 8 }}
            >
              {aHora(m)}
            </Typography>
          ))}
        </Box>

        <Box ref={gridRef} sx={{ position: 'relative', display: 'flex', flex: 1, height: alturaTotal }}>
          {marcasHora.map((m) => (
            <Box
              key={m}
              sx={{
                position: 'absolute',
                top: (m - minApertura) * PX_POR_MINUTO,
                left: 0,
                right: 0,
                borderTop: '1px dashed',
                borderColor: 'divider',
              }}
            />
          ))}

          {dias.map((dia, i) => {
            const fechaColumna = sumarDias(inicioSemana, dia.diaSemana);
            const esFechaPasada = aIso(fechaColumna) < aIso(new Date());
            const excepcion = excepciones.find((ex) => ex.fecha === aIso(fechaColumna)) ?? null;
            const cerradoPorExcepcion = excepcion?.cerrado ?? false;
            const abiertoInicio = cerradoPorExcepcion
              ? minApertura
              : aMinutos(excepcion?.horaApertura ?? dia.horaApertura);
            const abiertoFin = cerradoPorExcepcion ? minApertura : aMinutos(excepcion?.horaCierre ?? dia.horaCierre);
            const turnosDelDia = turnosRecurrentes.filter(
              (t) => (ajuste?.turnoId === t.id ? ajuste.dia : t.diaSemana) === dia.diaSemana,
            );
            const excepcionesFecha = turnosPuntuales.filter(
              (t) => t.tipo === 'EXCEPCION' && t.fecha === aIso(fechaColumna),
            );
            const excepcionesUsadas = new Set<string>();

            // Rango final de cada turno recurrente (considerando fusión con su excepción de esa
            // fecha, si aplica) — se usa para acomodar bloques que se traslapan lado a lado.
            const rangosRecurrentes = turnosDelDia.map((turno) => {
              const enAjuste = ajuste?.turnoId === turno.id;
              const inicio = enAjuste ? ajuste.inicio : aMinutos(turno.horaInicio);
              const fin = enAjuste ? ajuste.fin : aMinutos(turno.horaFin);
              const excepcionTurno = !enAjuste
                ? excepcionesFecha.find((ex) => aMinutos(ex.horaInicio) < fin && aMinutos(ex.horaFin) > inicio)
                : undefined;
              if (!excepcionTurno) return { id: turno.id, inicio, fin, enAjuste };
              return {
                id: turno.id,
                inicio: Math.min(inicio, aMinutos(excepcionTurno.horaInicio)),
                fin: Math.max(fin, aMinutos(excepcionTurno.horaFin)),
                enAjuste,
              };
            });
            const rangosExcepcionesSolas = excepcionesFecha
              .filter((ex) => !turnosDelDia.some((t) => {
                const inicio = aMinutos(t.horaInicio);
                const fin = aMinutos(t.horaFin);
                return aMinutos(ex.horaInicio) < fin && aMinutos(ex.horaFin) > inicio;
              }))
              .map((ex) => ({ id: ex.id, inicio: aMinutos(ex.horaInicio), fin: aMinutos(ex.horaFin) }));
            const { columnas, total } = asignarColumnas([
              ...rangosRecurrentes.filter((r) => !r.enAjuste),
              ...rangosExcepcionesSolas,
            ]);

            return (
              <Box
                key={dia.diaSemana}
                ref={(el: HTMLDivElement | null) => {
                  columnasRef.current[dia.diaSemana] = el;
                }}
                sx={{
                  flex: 1,
                  position: 'relative',
                  borderLeft: i === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                }}
              >
                {/* Franja fuera del horario de este día: no interactiva. */}
                {abiertoInicio > minApertura && (
                  <Box
                    sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: (abiertoInicio - minApertura) * PX_POR_MINUTO, bgcolor: 'action.hover' }}
                  />
                )}
                {abiertoFin < maxCierre && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: (abiertoFin - minApertura) * PX_POR_MINUTO,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: 'action.hover',
                    }}
                  />
                )}

                {cerradoPorExcepcion && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                      bgcolor: (t) => alpha(t.palette.error.main, 0.04),
                      backgroundImage:
                        'repeating-linear-gradient(-45deg, rgba(0,0,0,0.025), rgba(0,0,0,0.025) 6px, transparent 6px, transparent 14px)',
                    }}
                  >
                    <LockClockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      Cerrado
                    </Typography>
                  </Box>
                )}

                {/* Zona activa: aquí se puede arrastrar para crear un bloque nuevo. */}
                {!cerradoPorExcepcion && (
                  <Box
                    onMouseDown={(e) => iniciarCreacion(dia, e)}
                    sx={{
                      position: 'absolute',
                      top: (abiertoInicio - minApertura) * PX_POR_MINUTO,
                      left: 0,
                      right: 0,
                      height: (abiertoFin - abiertoInicio) * PX_POR_MINUTO,
                      cursor: puedeGestionar ? 'copy' : 'default',
                      '&:hover': puedeGestionar ? { bgcolor: 'action.selected' } : undefined,
                    }}
                  />
                )}

                {creando && creando.dia === dia.diaSemana && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 4,
                      right: 4,
                      top: (Math.min(creando.inicio, creando.fin) - minApertura) * PX_POR_MINUTO,
                      height: Math.max(4, Math.abs(creando.fin - creando.inicio) * PX_POR_MINUTO),
                      bgcolor: (t) => alpha(t.palette.secondary.main, 0.35),
                      border: '1.5px dashed',
                      borderColor: 'secondary.main',
                      borderRadius: 1.5,
                    }}
                  />
                )}

                {turnosDelDia.map((turno) => {
                  const enAjuste = ajuste?.turnoId === turno.id;
                  const inicio = enAjuste ? ajuste.inicio : aMinutos(turno.horaInicio);
                  const fin = enAjuste ? ajuste.fin : aMinutos(turno.horaFin);
                  const alturaTurnoBloque = Math.max(28, (fin - inicio) * PX_POR_MINUTO);
                  const columna = columnas.get(turno.id) ?? 0;
                  const anchoPct = enAjuste ? 100 : 100 / total;
                  const izqPct = enAjuste ? 0 : (columna * 100) / total;

                  // Excepción que reemplaza/redimensiona este bloque solo para esta fecha (horario
                  // especial puntual): se pinta como una sola figura, con su propio rango e
                  // instructores, en vez del bloque recurrente.
                  const excepcionTurno = !enAjuste
                    ? excepcionesFecha.find((ex) => {
                        const exInicio = aMinutos(ex.horaInicio);
                        const exFin = aMinutos(ex.horaFin);
                        return exInicio < fin && exFin > inicio;
                      })
                    : undefined;
                  if (excepcionTurno) excepcionesUsadas.add(excepcionTurno.id);

                  if (excepcionTurno) {
                    const enAjusteExcepcion = ajusteExcepcion?.excepcionId === excepcionTurno.id;
                    const uInicio = enAjusteExcepcion ? ajusteExcepcion.inicio : aMinutos(excepcionTurno.horaInicio);
                    const uFin = enAjusteExcepcion ? ajusteExcepcion.fin : aMinutos(excepcionTurno.horaFin);
                    const alturaExcepcionOverlay = Math.max(28, (uFin - uInicio) * PX_POR_MINUTO);
                    const solapaExcepcion = enAjusteExcepcion && ajusteExcepcionSolapa;
                    const actividadesMostradas = excepcionTurno.actividades;
                    const instructoresMostrados = excepcionTurno.instructores;
                    const asignacionesMostradas = excepcionTurno.asignaciones;
                    const puedeArrastrarExcepcion = puedeMoverOrecortar && !esFechaPasada;

                    return (
                      <Box
                        key={turno.id}
                        onMouseDown={(e) =>
                          puedeArrastrarExcepcion &&
                          iniciarAjusteExcepcion(excepcionTurno, aIso(fechaColumna), dia.diaSemana, 'mover', e)
                        }
                        sx={{
                          position: 'absolute',
                          left: `calc(${izqPct}% + 3px)`,
                          width: `calc(${anchoPct}% - 6px)`,
                          top: (uInicio - minApertura) * PX_POR_MINUTO,
                          height: Math.max(28, (uFin - uInicio) * PX_POR_MINUTO),
                          borderRadius: 1.5,
                          boxShadow: solapaExcepcion
                            ? (t) => `0 0 0 1.5px ${t.palette.error.main}, 0 1px 3px rgba(15,15,16,0.08)`
                            : '0 1px 3px rgba(15,15,16,0.08)',
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: (t) => alpha(t.palette[solapaExcepcion ? 'error' : 'warning'].main, 0.5),
                          bgcolor: (t) => alpha(t.palette[solapaExcepcion ? 'error' : 'warning'].main, 0.12),
                          borderLeft: '3px solid',
                          cursor: puedeArrastrarExcepcion ? 'grab' : 'default',
                          display: 'flex',
                          flexDirection: 'column',
                          zIndex: enAjusteExcepcion ? 2 : 1,
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        {puedeArrastrarExcepcion && (
                          <Box
                            onMouseDown={(e) => iniciarAjusteExcepcion(excepcionTurno, aIso(fechaColumna), dia.diaSemana, 'inicio', e)}
                            sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
                          />
                        )}
                        {puedeArrastrarExcepcion && (
                          <Box
                            onMouseDown={(e) => iniciarAjusteExcepcion(excepcionTurno, aIso(fechaColumna), dia.diaSemana, 'fin', e)}
                            sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
                          />
                        )}
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <WbSunnyIcon sx={{ fontSize: 12, color: 'warning.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                            {aHora(uInicio)}–{aHora(uFin)}
                          </Typography>
                        </Stack>
                        {instructoresMostrados.length > 0 && (
                          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                            {nombresConRango(instructoresMostrados, asignacionesMostradas)}
                          </Typography>
                        )}
                        {actividadesMostradas.length > 0 && (
                          <Chip
                            size="small"
                            icon={<FitnessCenterIcon sx={{ fontSize: 12 }} />}
                            label={nombresDe(actividadesMostradas)}
                            sx={{
                              mt: 0.4,
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              alignSelf: 'flex-start',
                              maxWidth: '100%',
                              bgcolor: 'background.paper',
                              border: '1px solid',
                              borderColor: (t) => alpha(t.palette.warning.main, 0.4),
                              '& .MuiChip-icon': { color: 'warning.main', ml: '4px' },
                            }}
                          />
                        )}
                        <Box sx={{ flexGrow: 1 }} />
                        {puedeMoverOrecortar && (
                          alturaExcepcionOverlay < ALTURA_MINIMA_ACCIONES_EN_LINEA ? (
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => setMenuAccionesBloque({ anchor: e.currentTarget, id: excepcionTurno.id })}
                              sx={{
                                position: 'absolute',
                                bottom: 2,
                                right: 2,
                                color: 'text.secondary',
                                p: 0.25,
                                bgcolor: 'background.paper',
                                boxShadow: '0 1px 2px rgba(15,15,16,0.2)',
                                '&:hover': { bgcolor: 'background.paper' },
                              }}
                            >
                              <SettingsOutlinedIcon fontSize="inherit" />
                            </IconButton>
                          ) : (
                          <Stack direction="row" spacing={0.5} sx={{ alignSelf: 'flex-end' }}>
                            {!esFechaPasada && (
                              <Tooltip title="Quitar horario especial (vuelve al horario normal)">
                                <IconButton
                                  size="small"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={() => onEliminar(excepcionTurno.id)}
                                  sx={{ color: 'error.main', p: 0.25 }}
                                >
                                  <RestoreIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Editar actividades e instructores">
                              <IconButton
                                size="small"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => abrirMenuEditarBloque(e, turno, aIso(fechaColumna), excepcionTurno)}
                                sx={{ color: 'text.secondary', p: 0.25 }}
                              >
                                <TuneIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            {puedeCancelarDia && !esFechaPasada && (
                              <Tooltip title="Cancelar un día puntual">
                                <IconButton
                                  size="small"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => abrirMenuCancelar(e, turno, instructoresMostrados)}
                                  sx={{ color: 'text.secondary', p: 0.25 }}
                                >
                                  <EventBusyIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {puedeGestionar && (
                              <Tooltip title="Eliminar bloque completo">
                                <IconButton
                                  size="small"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={() =>
                                    setConfirmEliminar({
                                      ids: [turno.id, excepcionTurno.id],
                                      dia: DIAS_LARGO[dia.diaSemana],
                                      horaInicio: aHora(uInicio),
                                      horaFin: aHora(uFin),
                                      instructores: instructoresMostrados.map((i) => i.nombre),
                                      actividades: actividadesMostradas.map((a) => a.nombre),
                                    })
                                  }
                                  sx={{ color: 'error.main', p: 0.25 }}
                                >
                                  <DeleteOutlineIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                          )
                        )}
                        <Menu
                          open={menuAccionesBloque?.id === excepcionTurno.id}
                          anchorEl={menuAccionesBloque?.anchor ?? null}
                          onClose={() => setMenuAccionesBloque(null)}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          {!esFechaPasada && (
                            <MenuItem
                              onClick={() => {
                                setMenuAccionesBloque(null);
                                onEliminar(excepcionTurno.id);
                              }}
                            >
                              <ListItemIcon>
                                <RestoreIcon fontSize="small" sx={{ color: 'error.main' }} />
                              </ListItemIcon>
                              <ListItemText>Quitar horario especial (vuelve al horario normal)</ListItemText>
                            </MenuItem>
                          )}
                          <MenuItem
                            onClick={(e) => {
                              setMenuAccionesBloque(null);
                              abrirMenuEditarBloque(e, turno, aIso(fechaColumna), excepcionTurno);
                            }}
                          >
                            <ListItemIcon>
                              <TuneIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Editar actividades e instructores</ListItemText>
                          </MenuItem>
                          {puedeCancelarDia && !esFechaPasada && (
                            <MenuItem
                              onClick={(e) => {
                                setMenuAccionesBloque(null);
                                abrirMenuCancelar(e, turno, instructoresMostrados);
                              }}
                            >
                              <ListItemIcon>
                                <EventBusyIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText>Cancelar un día puntual</ListItemText>
                            </MenuItem>
                          )}
                          {puedeGestionar && (
                            <MenuItem
                              onClick={() => {
                                setMenuAccionesBloque(null);
                                setConfirmEliminar({
                                  ids: [turno.id, excepcionTurno.id],
                                  dia: DIAS_LARGO[dia.diaSemana],
                                  horaInicio: aHora(uInicio),
                                  horaFin: aHora(uFin),
                                  instructores: instructoresMostrados.map((i) => i.nombre),
                                  actividades: actividadesMostradas.map((a) => a.nombre),
                                });
                              }}
                            >
                              <ListItemIcon>
                                <DeleteOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
                              </ListItemIcon>
                              <ListItemText>Eliminar bloque completo</ListItemText>
                            </MenuItem>
                          )}
                        </Menu>
                      </Box>
                    );
                  }

                  return (
                    <Tooltip
                      key={turno.id}
                      title={cerradoPorExcepcion ? `No aplica: salón cerrado el ${aIso(fechaColumna)}` : ''}
                      disableHoverListener={!cerradoPorExcepcion}
                    >
                      <Box
                        onMouseDown={(e) => !cerradoPorExcepcion && puedeMoverOrecortar && iniciarAjuste(turno, 'mover', e)}
                        sx={{
                          position: 'absolute',
                          left: `calc(${izqPct}% + 3px)`,
                          width: `calc(${anchoPct}% - 6px)`,
                          top: (inicio - minApertura) * PX_POR_MINUTO,
                          height: Math.max(28, (fin - inicio) * PX_POR_MINUTO),
                          bgcolor: (t) =>
                            alpha(t.palette[enAjuste && ajusteSolapa ? 'error' : 'secondary'].main, 0.12),
                          borderLeft: '3px solid',
                          borderColor: enAjuste && ajusteSolapa ? 'error.main' : 'secondary.main',
                          color: 'text.primary',
                          opacity: cerradoPorExcepcion ? 0.4 : 1,
                          borderRadius: 1.5,
                          boxShadow:
                            enAjuste && ajusteSolapa
                              ? (t) => `0 0 0 1.5px ${t.palette.error.main}, 0 1px 3px rgba(15,15,16,0.08)`
                              : '0 1px 3px rgba(15,15,16,0.08)',
                          transition: 'box-shadow .15s ease, background-color .15s ease',
                          cursor: cerradoPorExcepcion ? 'not-allowed' : puedeMoverOrecortar ? 'grab' : 'default',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          px: 1,
                          py: 0.5,
                          zIndex: enAjuste ? 2 : 1,
                          '&:hover': !cerradoPorExcepcion
                            ? { bgcolor: (t) => alpha(t.palette.secondary.main, 0.18), boxShadow: '0 2px 6px rgba(15,15,16,0.14)' }
                            : undefined,
                        }}
                      >
                      {puedeMoverOrecortar && (
                        <Box
                          onMouseDown={(e) => iniciarAjuste(turno, 'inicio', e)}
                          sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
                        />
                      )}
                      <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.3, color: 'secondary.dark' }}>
                        {aHora(inicio)}–{aHora(fin)}
                      </Typography>
                      {turno.instructores.length > 0 && (
                        <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
                          <GroupIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                            {nombresConRango(turno.instructores, turno.asignaciones)}
                          </Typography>
                        </Stack>
                      )}
                      {turno.actividades.length > 0 && (
                        <Chip
                          size="small"
                          icon={<FitnessCenterIcon sx={{ fontSize: 12 }} />}
                          label={nombresDe(turno.actividades)}
                          sx={{
                            mt: 0.4,
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            alignSelf: 'flex-start',
                            maxWidth: '100%',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: (t) => alpha(t.palette.secondary.main, 0.35),
                            '& .MuiChip-icon': { color: 'secondary.main', ml: '4px' },
                          }}
                        />
                      )}
                      <Box sx={{ flexGrow: 1 }} />
                      {alturaTurnoBloque < ALTURA_MINIMA_ACCIONES_EN_LINEA ? (
                        (puedeMoverOrecortar || (puedeCancelarDia && !esFechaPasada) || puedeGestionar) && (
                          <IconButton
                            size="small"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuAccionesBloque({ anchor: e.currentTarget, id: turno.id });
                            }}
                            sx={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              color: 'text.secondary',
                              p: 0.25,
                              bgcolor: 'background.paper',
                              boxShadow: '0 1px 2px rgba(15,15,16,0.2)',
                              '&:hover': { bgcolor: 'background.paper' },
                            }}
                          >
                            <SettingsOutlinedIcon fontSize="inherit" />
                          </IconButton>
                        )
                      ) : (
                      <Stack direction="row" spacing={0.5} sx={{ alignSelf: 'flex-end' }}>
                        {puedeMoverOrecortar && (
                          <Tooltip title="Editar actividades e instructores">
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => abrirMenuEditarBloque(e, turno, aIso(fechaColumna))}
                              sx={{ color: 'text.secondary', p: 0.25 }}
                            >
                              <TuneIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {puedeCancelarDia && !esFechaPasada && (
                          <Tooltip title="Cancelar un día puntual">
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => abrirMenuCancelar(e, turno)}
                              sx={{ color: 'text.secondary', p: 0.25 }}
                            >
                              <EventBusyIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {puedeGestionar && (
                          <Tooltip title="Eliminar bloque completo">
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmEliminar({
                                  ids: [turno.id],
                                  dia: DIAS_LARGO[dia.diaSemana],
                                  horaInicio: aHora(inicio),
                                  horaFin: aHora(fin),
                                  instructores: turno.instructores.map((i) => i.nombre),
                                  actividades: turno.actividades.map((a) => a.nombre),
                                });
                              }}
                              sx={{ color: 'error.main', p: 0.25 }}
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                      )}
                      <Menu
                        open={menuAccionesBloque?.id === turno.id}
                        anchorEl={menuAccionesBloque?.anchor ?? null}
                        onClose={() => setMenuAccionesBloque(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        {puedeMoverOrecortar && (
                          <MenuItem
                            onClick={(e) => {
                              setMenuAccionesBloque(null);
                              abrirMenuEditarBloque(e, turno, aIso(fechaColumna));
                            }}
                          >
                            <ListItemIcon>
                              <TuneIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Editar actividades e instructores</ListItemText>
                          </MenuItem>
                        )}
                        {puedeCancelarDia && !esFechaPasada && (
                          <MenuItem
                            onClick={(e) => {
                              setMenuAccionesBloque(null);
                              abrirMenuCancelar(e, turno);
                            }}
                          >
                            <ListItemIcon>
                              <EventBusyIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Cancelar un día puntual</ListItemText>
                          </MenuItem>
                        )}
                        {puedeGestionar && (
                          <MenuItem
                            onClick={() => {
                              setMenuAccionesBloque(null);
                              setConfirmEliminar({
                                ids: [turno.id],
                                dia: DIAS_LARGO[dia.diaSemana],
                                horaInicio: aHora(inicio),
                                horaFin: aHora(fin),
                                instructores: turno.instructores.map((i) => i.nombre),
                                actividades: turno.actividades.map((a) => a.nombre),
                              });
                            }}
                          >
                            <ListItemIcon>
                              <DeleteOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
                            </ListItemIcon>
                            <ListItemText>Eliminar bloque completo</ListItemText>
                          </MenuItem>
                        )}
                      </Menu>
                      {puedeMoverOrecortar && (
                        <Box
                          onMouseDown={(e) => iniciarAjuste(turno, 'fin', e)}
                          sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
                        />
                      )}
                      </Box>
                    </Tooltip>
                  );
                })}

                {/* Excepciones de esta fecha sin bloque recurrente que las origine: bloque independiente. */}
                {excepcionesFecha
                  .filter((ex) => !excepcionesUsadas.has(ex.id))
                  .map((ex) => {
                    const enAjusteExcepcion = ajusteExcepcion?.excepcionId === ex.id;
                    const inicio = enAjusteExcepcion ? ajusteExcepcion.inicio : aMinutos(ex.horaInicio);
                    const fin = enAjusteExcepcion ? ajusteExcepcion.fin : aMinutos(ex.horaFin);
                    const alturaExcepcionSola = Math.max(28, (fin - inicio) * PX_POR_MINUTO);
                    const solapaExcepcion = enAjusteExcepcion && ajusteExcepcionSolapa;
                    const columna = columnas.get(ex.id) ?? 0;
                    const anchoPct = 100 / total;
                    const izqPct = (columna * 100) / total;
                    const puedeArrastrarExcepcion = puedeMoverOrecortar && !esFechaPasada;

                    // A esta altura, toda excepción que se solapa con un turno recurrente ya se
                    // pintó junto a ese turno más arriba (y quedó en excepcionesUsadas). Lo que
                    // llega aquí es siempre un horario especial independiente, sin turno
                    // recurrente detrás.
                    return (
                      <Box
                        key={ex.id}
                        onMouseDown={(e) =>
                          puedeArrastrarExcepcion && iniciarAjusteExcepcion(ex, ex.fecha ?? aIso(fechaColumna), dia.diaSemana, 'mover', e)
                        }
                        sx={{
                          position: 'absolute',
                          left: `calc(${izqPct}% + 3px)`,
                          width: `calc(${anchoPct}% - 6px)`,
                          top: (inicio - minApertura) * PX_POR_MINUTO,
                          height: Math.max(28, (fin - inicio) * PX_POR_MINUTO),
                          bgcolor: (t) => alpha(t.palette[solapaExcepcion ? 'error' : 'warning'].main, 0.16),
                          borderLeft: '3px solid',
                          borderColor: solapaExcepcion ? 'error.main' : 'warning.main',
                          borderRadius: 1.5,
                          boxShadow: solapaExcepcion
                            ? (t) => `0 0 0 1.5px ${t.palette.error.main}, 0 1px 3px rgba(15,15,16,0.08)`
                            : '0 1px 3px rgba(15,15,16,0.08)',
                          cursor: puedeArrastrarExcepcion ? 'grab' : 'default',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          zIndex: enAjusteExcepcion ? 2 : 1,
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        {puedeArrastrarExcepcion && (
                          <Box
                            onMouseDown={(e) => iniciarAjusteExcepcion(ex, ex.fecha ?? aIso(fechaColumna), dia.diaSemana, 'inicio', e)}
                            sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
                          />
                        )}
                        {puedeArrastrarExcepcion && (
                          <Box
                            onMouseDown={(e) => iniciarAjusteExcepcion(ex, ex.fecha ?? aIso(fechaColumna), dia.diaSemana, 'fin', e)}
                            sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
                          />
                        )}
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <WbSunnyIcon sx={{ fontSize: 12, color: 'warning.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                            {aHora(inicio)}–{aHora(fin)}
                          </Typography>
                        </Stack>
                        {ex.instructores.length > 0 && (
                          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                            {nombresConRango(ex.instructores, ex.asignaciones)}
                          </Typography>
                        )}
                        {ex.actividades.length > 0 && (
                          <Chip
                            size="small"
                            icon={<FitnessCenterIcon sx={{ fontSize: 12 }} />}
                            label={nombresDe(ex.actividades)}
                            sx={{ mt: 0.4, height: 18, fontSize: '0.65rem', fontWeight: 600, alignSelf: 'flex-start', maxWidth: '100%', bgcolor: 'background.paper' }}
                          />
                        )}
                        <Box sx={{ flexGrow: 1 }} />
                        {puedeMoverOrecortar && (
                          alturaExcepcionSola < ALTURA_MINIMA_ACCIONES_EN_LINEA ? (
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => setMenuAccionesBloque({ anchor: e.currentTarget, id: ex.id })}
                              sx={{
                                position: 'absolute',
                                bottom: 2,
                                right: 2,
                                color: 'text.secondary',
                                p: 0.25,
                                bgcolor: 'background.paper',
                                boxShadow: '0 1px 2px rgba(15,15,16,0.2)',
                                '&:hover': { bgcolor: 'background.paper' },
                              }}
                            >
                              <SettingsOutlinedIcon fontSize="inherit" />
                            </IconButton>
                          ) : (
                          <Stack direction="row" spacing={0.5} sx={{ alignSelf: 'flex-end' }}>
                            <Tooltip title="Editar actividades e instructores">
                              <IconButton
                                size="small"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => abrirMenuEditarBloque(e, ex, ex.fecha ?? aIso(fechaColumna), ex)}
                                sx={{ color: 'text.secondary', p: 0.25 }}
                              >
                                <TuneIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar este horario puntual">
                              <IconButton
                                size="small"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => onEliminar(ex.id)}
                                sx={{ color: 'error.main', p: 0.25 }}
                              >
                                <DeleteOutlineIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          )
                        )}
                        <Menu
                          open={menuAccionesBloque?.id === ex.id}
                          anchorEl={menuAccionesBloque?.anchor ?? null}
                          onClose={() => setMenuAccionesBloque(null)}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          <MenuItem
                            onClick={(e) => {
                              setMenuAccionesBloque(null);
                              abrirMenuEditarBloque(e, ex, ex.fecha ?? aIso(fechaColumna), ex);
                            }}
                          >
                            <ListItemIcon>
                              <TuneIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Editar actividades e instructores</ListItemText>
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setMenuAccionesBloque(null);
                              onEliminar(ex.id);
                            }}
                          >
                            <ListItemIcon>
                              <DeleteOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
                            </ListItemIcon>
                            <ListItemText>Eliminar este horario puntual</ListItemText>
                          </MenuItem>
                        </Menu>
                      </Box>
                    );
                  })}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Popover
        open={menuCancelar !== null}
        anchorEl={menuCancelar?.anchor ?? null}
        onClose={() => setMenuCancelar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 240 }}>
          <Typography variant="subtitle2">Cancelar este día</Typography>
          <Typography variant="caption" color="text.secondary">
            Ningún instructor cubrirá este horario ese día, aunque sea recurrente.
          </Typography>
          <TextField
            type="date"
            size="small"
            label="Fecha"
            value={fechaCancelar}
            onChange={(e) => setFechaCancelar(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button variant="contained" size="small" onClick={confirmarCancelacion} disabled={!fechaCancelar}>
            Confirmar cancelación
          </Button>
        </Stack>
      </Popover>

      <Dialog
        open={confirmEliminar !== null}
        onClose={() => setConfirmEliminar(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: (t) => alpha(t.palette.error.main, 0.12), color: 'error.main', width: 40, height: 40 }}>
                <DeleteOutlineIcon />
              </Avatar>
              <Stack spacing={0.25}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  ¿Eliminar este horario?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Se borrará por completo, para todas las semanas.
                </Typography>
              </Stack>
            </Stack>

            {confirmEliminar && (
              <Stack
                spacing={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {confirmEliminar.dia}, {confirmEliminar.horaInicio}–{confirmEliminar.horaFin}
                  </Typography>
                </Stack>
                {confirmEliminar.instructores.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                    <GroupIcon sx={{ fontSize: 16, color: 'text.secondary', mt: '2px' }} />
                    <Typography variant="body2" color="text.secondary">
                      {confirmEliminar.instructores.join(', ')}
                    </Typography>
                  </Stack>
                )}
                {confirmEliminar.actividades.length > 0 && (
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                    {confirmEliminar.actividades.map((nombre) => (
                      <Chip key={nombre} size="small" icon={<FitnessCenterIcon sx={{ fontSize: 12 }} />} label={nombre} sx={{ height: 20, fontSize: '0.7rem' }} />
                    ))}
                  </Stack>
                )}
              </Stack>
            )}

            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                p: 1.25,
                borderRadius: 2,
                bgcolor: (t) => alpha(t.palette.error.main, 0.06),
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 18, color: 'error.main' }} />
              <Typography variant="caption" sx={{ color: 'error.dark', fontWeight: 600 }}>
                Esta acción no se puede deshacer.
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
          <Button onClick={() => setConfirmEliminar(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            disableElevation
            onClick={() => {
              confirmEliminar?.ids.forEach((id) => onEliminar(id));
              setConfirmEliminar(null);
            }}
          >
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={menuExcepcion !== null}
        anchorEl={menuExcepcion?.anchor ?? null}
        onClose={() => setMenuExcepcion(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { borderRadius: 2.5, boxShadow: '0 8px 28px rgba(15,15,16,0.16)' } } }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 280 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <EditCalendarIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                Horario de este día
              </Typography>
              {menuExcepcion && (
                <Typography variant="caption" color="text.secondary">
                  {DIAS_CORTO[menuExcepcion.diaSemana]} · {menuExcepcion.fecha}
                </Typography>
              )}
            </Box>
          </Stack>
          <ToggleButtonGroup
            value={cerradoExcepcion ? 'CERRADO' : 'ESPECIAL'}
            exclusive
            size="small"
            fullWidth
            onChange={(_, v) => v && setCerradoExcepcion(v === 'CERRADO')}
          >
            <ToggleButton value="ESPECIAL" sx={{ gap: 0.5, textTransform: 'none' }}>
              <WbSunnyIcon sx={{ fontSize: 16 }} />
              Especial
            </ToggleButton>
            <ToggleButton value="CERRADO" sx={{ gap: 0.5, textTransform: 'none' }}>
              <LockClockIcon sx={{ fontSize: 16 }} />
              Cerrado
            </ToggleButton>
          </ToggleButtonGroup>
          {!cerradoExcepcion && (
            <Stack direction="row" spacing={1}>
              <TextField
                type="time"
                size="small"
                label="Abre"
                value={horaAperturaExcepcion}
                onChange={(e) => setHoraAperturaExcepcion(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="time"
                size="small"
                label="Cierra"
                value={horaCierreExcepcion}
                onChange={(e) => setHoraCierreExcepcion(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          )}
          <Typography variant="caption" color="text.secondary">
            {cerradoExcepcion
              ? 'Ningún instructor tendrá horario ese día, aunque tengan uno recurrente.'
              : 'Solo aplica a esta fecha; el resto de semanas conserva el horario habitual.'}
          </Typography>
          <Stack direction="row" spacing={1}>
            {menuExcepcion?.excepcion && (
              <Button size="small" onClick={quitarExcepcion} sx={{ flex: 1 }}>
                Quitar excepción
              </Button>
            )}
            <Button variant="contained" size="small" onClick={confirmarExcepcion} sx={{ flex: 1 }}>
              Guardar
            </Button>
          </Stack>
        </Stack>
      </Popover>

      <Dialog open={menuEditarBloque !== null} onClose={() => setMenuEditarBloque(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Instructores y actividades
          </Typography>
          {menuEditarBloque && (
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {menuEditarBloque.turno.tipo === 'RECURRENTE'
                  ? DIAS_LARGO[menuEditarBloque.turno.diaSemana ?? 0]
                  : formatoFechaCorta(menuEditarBloque.fecha)}{' '}
                · {corta(menuEditarBloque.turno.horaInicio)} a {corta(menuEditarBloque.turno.horaFin)}
              </Typography>
            </Stack>
          )}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {menuEditarBloque && menuEditarBloque.turno.tipo === 'RECURRENTE' && (
            <ToggleButtonGroup exclusive size="small" value={ambitoEditar} onChange={(_, v) => v && setAmbitoEditar(v)} fullWidth sx={{ mb: 2 }}>
              <ToggleButton value="fecha">Solo {formatoFechaCorta(menuEditarBloque.fecha)}</ToggleButton>
              <ToggleButton value="recurrente">Repetitivo (todas las semanas)</ToggleButton>
            </ToggleButtonGroup>
          )}
          {errorEditarBloque && (
            <Alert severity="error" variant="outlined" sx={{ mb: 2 }} onClose={() => setErrorEditarBloque(null)}>
              {errorEditarBloque}
            </Alert>
          )}
          <AsignacionesInstructores
            actividadesSalon={actividadesSalon}
            instructoresSalon={instructoresSalon}
            mapaEspecialidades={mapaEspecialidades}
            asignaciones={asignacionesEditar}
            onAsignacionesChange={setAsignacionesEditar}
            ventanas={[
              menuEditarBloque
                ? { inicio: corta(menuEditarBloque.turno.horaInicio), fin: corta(menuEditarBloque.turno.horaFin) }
                : { inicio: '00:00', fin: '23:59' },
            ]}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setMenuEditarBloque(null)} disabled={guardandoEditarBloque}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={confirmarEditarBloque}
            disabled={
              guardandoEditarBloque ||
              (ambitoEditar === 'fecha'
                ? Object.keys(asignacionesEditarFecha).length > 0 &&
                  (!asignacionesValidas(asignacionesEditarFecha) ||
                    !menuEditarBloque ||
                    !asignacionesDentroDeRango(asignacionesEditarFecha, [
                      { inicio: corta(menuEditarBloque.turno.horaInicio), fin: corta(menuEditarBloque.turno.horaFin) },
                    ]))
                : !asignacionesValidas(asignacionesEditarRecurrente) ||
                  !menuEditarBloque ||
                  !asignacionesDentroDeRango(asignacionesEditarRecurrente, [
                    { inicio: corta(menuEditarBloque.turno.horaInicio), fin: corta(menuEditarBloque.turno.horaFin) },
                  ]))
            }
          >
            {guardandoEditarBloque ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={pendienteCreacion !== null}
        onClose={() => setPendienteCreacion(null)}
        anchorReference="anchorPosition"
        anchorPosition={pendienteCreacion?.anchor}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 420 }}>
          <Typography variant="subtitle2">Nuevo horario</Typography>
          {pendienteCreacion && (
            <Typography variant="caption" color="text.secondary">
              {DIAS_CORTO[pendienteCreacion.dia]} · {pendienteCreacion.horaInicio}–{pendienteCreacion.horaFin}
            </Typography>
          )}
          <ToggleButtonGroup value={tipoNuevo} exclusive size="small" onChange={(_, v) => v && setTipoNuevo(v)}>
            <ToggleButton value="RECURRENTE" sx={{ flex: 1 }}>
              Se repite
            </ToggleButton>
            <ToggleButton value="EXCEPCION" sx={{ flex: 1 }}>
              Solo esta fecha
            </ToggleButton>
          </ToggleButtonGroup>
          {tipoNuevo === 'EXCEPCION' && (
            <TextField
              type="date"
              size="small"
              label="Fecha"
              value={fechaNuevo}
              onChange={(e) => setFechaNuevo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
          <AsignacionesInstructores
            actividadesSalon={actividadesSalon}
            instructoresSalon={instructoresSalon}
            mapaEspecialidades={mapaEspecialidades}
            asignaciones={asignacionesNuevas}
            onAsignacionesChange={setAsignacionesNuevas}
            ventanas={[
              pendienteCreacion ? { inicio: pendienteCreacion.horaInicio, fin: pendienteCreacion.horaFin } : { inicio: '00:00', fin: '23:59' },
            ]}
          />
          {pendienteCreacion && haySolapeCreacion() && (
            <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
              Ese horario se cruza con otro bloque de este salón ese día.
            </Alert>
          )}
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => setPendienteCreacion(null)} sx={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={confirmarCreacion}
              disabled={
                (tipoNuevo === 'EXCEPCION' && !fechaNuevo) || !asignacionesValidas(asignacionesNuevas) || haySolapeCreacion()
              }
              sx={{ flex: 1 }}
            >
              Crear horario
            </Button>
          </Stack>
        </Stack>
      </Popover>

      <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          {puedeGestionar
            ? 'Arrastra sobre un día para crear un horario. Arrastra un horario para moverlo (incluso a otro día), o sus bordes para recortarlo.'
            : puedeMoverOrecortar
              ? 'Puedes mover los horarios existentes a otro día u horario, recortarlos, o editar instructores/actividades.'
              : puedeCancelarDia
                ? 'Puedes cancelar un día puntual de un horario existente.'
                : 'Solo puedes consultar este calendario.'}
        </Typography>
      </Box>

      <Snackbar
        open={avisoSolape}
        autoHideDuration={7000}
        onClose={() => setAvisoSolape(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setAvisoSolape(false)} sx={{ width: '100%' }}>
          Ese horario ya está ocupado.
        </Alert>
      </Snackbar>
    </Paper>
  );
}
