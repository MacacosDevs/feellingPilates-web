import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import { isAxiosError } from 'axios';
import { DataTable, type ColumnaTabla } from '../../components/DataTable';
import { useTablaLocal } from '../../hooks/useTablaLocal';
import { usePermisos } from '../../auth/usePermisos';
import {
  actualizarTipoActividad,
  crearTipoActividad,
  crearTipoRecurso,
  desactivarTipoActividad,
  guardarRecursosDeActividad,
  listarRecursosDeActividad,
  listarTiposActividad,
  listarTiposRecurso,
} from '../../api/catalogos';
import type { ActividadRecursoRequest, ApiErrorBody, TipoActividadResponse, TipoRecursoResponse } from '../../api/types';

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

export function Actividades() {
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

  const tabla = useTablaLocal(actividades, COMPARADORES, 'nombre');

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

  if (!puedeLeer) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Actividades
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="warning">{mensajeSinPermiso('actividades.leer')}</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Actividades
          </Typography>
          <Typography color="text.secondary">
            Catálogo de actividades y los recursos/equipamiento que requiere cada una.
          </Typography>
        </Box>
        {puedeGestionar && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogoNuevo(formularioVacio())}>
            Nueva actividad
          </Button>
        )}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataTable
          columnas={columnas}
          filas={tabla.filas}
          obtenerClave={(a) => a.id}
          cargando={cargando}
          ordenPor={tabla.orderBy}
          orden={tabla.order}
          onOrdenar={tabla.onOrdenar}
          iconoVacio={<FitnessCenterOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
          textoVacio="No hay actividades registradas."
          paginacion={{
            total: tabla.total,
            page: tabla.page,
            rowsPerPage: tabla.rowsPerPage,
            onPageChange: tabla.onPageChange,
            onRowsPerPageChange: tabla.onRowsPerPageChange,
          }}
          renderFila={(a) => (
            <TableRow hover sx={{ opacity: a.activo ? 1 : 0.5 }}>
              <TableCell>
                <Stack spacing={0.25}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <span>{a.nombre}</span>
                    {a.participantesPorReserva >= 2 && (
                      <Chip size="small" variant="outlined" label={`Pareja (${a.participantesPorReserva})`} />
                    )}
                  </Stack>
                  {a.etiquetas.length > 0 && (
                    <Tooltip title={a.etiquetas.join(', ')}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {a.etiquetas.join(' · ')}
                      </Typography>
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
              <TableCell>{a.duracionMinutos} min</TableCell>
              <TableCell>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {(recursosPorActividad[a.id] ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Sin recursos requeridos
                    </Typography>
                  ) : (
                    recursosPorActividad[a.id].map((etiqueta) => <Chip key={etiqueta} size="small" label={etiqueta} />)
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Chip size="small" color={a.activo ? 'success' : 'default'} label={a.activo ? 'Activa' : 'Inactiva'} />
              </TableCell>
              {puedeGestionar && (
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => setDialogoNuevo(formularioDesde(a))}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Configurar recursos">
                    <IconButton size="small" onClick={() => abrirRecursos(a)}>
                      <SettingsOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {a.activo && (
                    <Tooltip title="Desactivar">
                      <IconButton size="small" onClick={() => desactivar(a)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              )}
            </TableRow>
          )}
        />
      </Box>

      <Dialog open={!!dialogoNuevo} onClose={() => setDialogoNuevo(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{dialogoNuevo?.id ? 'Editar actividad' : 'Nueva actividad'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {errorNuevo && <Alert severity="error">{errorNuevo}</Alert>}
          {dialogoNuevo && (
            <>
              <TextField
                label="Nombre"
                value={dialogoNuevo.nombre}
                onChange={(e) => setDialogoNuevo({ ...dialogoNuevo, nombre: e.target.value })}
                fullWidth
                autoFocus
              />
              <TextField
                label="Descripción (opcional)"
                value={dialogoNuevo.descripcion}
                onChange={(e) => setDialogoNuevo({ ...dialogoNuevo, descripcion: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Duración (minutos)"
                type="number"
                value={dialogoNuevo.duracionMinutos}
                onChange={(e) => setDialogoNuevo({ ...dialogoNuevo, duracionMinutos: e.target.value })}
                fullWidth
              />
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={dialogoNuevo.esPareja}
                      onChange={(e) => setDialogoNuevo({ ...dialogoNuevo, esPareja: e.target.checked })}
                    />
                  }
                  label="Es una actividad en pareja"
                />
                <Typography variant="caption" color="text.secondary">
                  Solo informativo, para que el instructor sepa que esta actividad se realiza en pareja.
                </Typography>
              </Stack>
              <TextField
                label="Etiquetas de búsqueda (opcional)"
                placeholder="Reformer, parejas"
                helperText="Sepáralas por comas."
                value={dialogoNuevo.etiquetasTexto}
                onChange={(e) => setDialogoNuevo({ ...dialogoNuevo, etiquetasTexto: e.target.value })}
                fullWidth
              />
              {separarEtiquetas(dialogoNuevo.etiquetasTexto).length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {separarEtiquetas(dialogoNuevo.etiquetasTexto).map((etiqueta) => (
                    <Chip key={etiqueta} size="small" label={etiqueta} />
                  ))}
                </Stack>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogoNuevo(null)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarNuevaActividad} disabled={guardandoNuevo}>
            {guardandoNuevo ? 'Guardando…' : dialogoNuevo?.id ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!actividadRecursos} onClose={() => setActividadRecursos(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Recursos de «{actividadRecursos?.nombre}»</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {errorRecursos && <Alert severity="error">{errorRecursos}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Qué recursos/equipamiento necesita esta actividad. Una actividad puede no requerir ninguno.
          </Typography>
          <Stack spacing={1}>
            {filasRecurso.map((fila, index) => (
              <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <TextField
                  select
                  label="Recurso"
                  value={fila.tipoRecursoId}
                  onChange={(e) => actualizarFilaRecurso(index, { tipoRecursoId: e.target.value })}
                  sx={{ flexGrow: 1 }}
                >
                  {tiposRecurso
                    .filter((t) => t.id === fila.tipoRecursoId || !filasRecurso.some((f) => f.tipoRecursoId === t.id))
                    .map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.nombre}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  label="Cantidad"
                  type="number"
                  value={fila.cantidad}
                  onChange={(e) => actualizarFilaRecurso(index, { cantidad: e.target.value })}
                  sx={{ width: 120 }}
                />
                <IconButton size="small" onClick={() => quitarFilaRecurso(index)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={agregarFilaRecurso}
            disabled={filasRecurso.length >= tiposRecurso.length}
          >
            Agregar recurso
          </Button>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <TextField
              label="Nuevo tipo de recurso"
              size="small"
              value={nuevoTipoRecurso}
              onChange={(e) => setNuevoTipoRecurso(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <Button size="small" onClick={crearNuevoTipoRecurso} disabled={!nuevoTipoRecurso.trim()}>
              Crear
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActividadRecursos(null)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarRecursos} disabled={guardandoRecursos}>
            {guardandoRecursos ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!feedback} autoHideDuration={4000} onClose={() => setFeedback(null)}>
        <Alert severity="success" onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      </Snackbar>
    </Box>
  );
}
