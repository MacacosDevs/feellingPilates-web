import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
  Switch,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { isAxiosError } from 'axios';
import { DataTable, type ColumnaTabla } from '../../components/DataTable';
import { useTablaLocal } from '../../hooks/useTablaLocal';
import { usePermisos } from '../../auth/usePermisos';
import { listarTiposActividad } from '../../api/catalogos';
import { VentaBreadcrumbs } from './VentaBreadcrumbs';
import {
  actualizarPaquete,
  crearPaquete,
  deshabilitarPaquete,
  habilitarPaquete,
  listarPaquetesGestion,
} from '../../api/pagos';
import type { ApiErrorBody, PaqueteGestionResponse, TipoActividadResponse } from '../../api/types';

function formatearMoneda(centavos: number): string {
  return (centavos / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });
}

function extraerMensajeError(err: unknown, mensajePorDefecto: string): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.message ?? mensajePorDefecto;
  }
  return mensajePorDefecto;
}

type TipoServicio = 'clase' | 'paquete' | 'mixto';

function tipoDe(p: PaqueteGestionResponse): TipoServicio {
  if (p.actividades.length >= 2) return 'mixto';
  if ((p.actividades[0]?.cantidadClases ?? 1) === 1) return 'clase';
  return 'paquete';
}

const TIPO_INFO: Record<TipoServicio, { etiqueta: string; color: string }> = {
  clase: { etiqueta: 'Clases', color: '#0891b2' },
  paquete: { etiqueta: 'Paquetes', color: '#334155' },
  mixto: { etiqueta: 'Mixtos', color: '#7c3aed' },
};

type ColumnaPaquete = 'nombre' | 'tipo' | 'precio' | 'vigencia' | 'actividades' | 'estado' | 'creadoEn' | 'acciones';

const COLUMNAS_PAQUETES_INICIO: ColumnaTabla<ColumnaPaquete>[] = [
  { id: 'nombre', label: 'Nombre', ordenable: true },
  { id: 'tipo', label: 'Tipo' },
  { id: 'precio', label: 'Precio', ordenable: true },
  { id: 'vigencia', label: 'Vigencia', ordenable: true },
  { id: 'actividades', label: 'Actividades' },
];

const COLUMNA_ESTADO: ColumnaTabla<ColumnaPaquete> = { id: 'estado', label: 'Estado', ordenable: true };
const COLUMNA_FECHA: ColumnaTabla<ColumnaPaquete> = { id: 'creadoEn', label: 'Fecha', ordenable: true };
const COLUMNA_ACCIONES: ColumnaTabla<ColumnaPaquete> = { id: 'acciones', label: 'Acciones', align: 'right' };

const COMPARADORES_PAQUETES: Record<ColumnaPaquete, (a: PaqueteGestionResponse, b: PaqueteGestionResponse) => number> = {
  nombre: (a, b) => a.nombre.localeCompare(b.nombre),
  tipo: (a, b) => tipoDe(a).localeCompare(tipoDe(b)),
  precio: (a, b) => a.precioCentavos - b.precioCentavos,
  vigencia: (a, b) => a.vigenciaDias - b.vigenciaDias,
  actividades: () => 0,
  estado: (a, b) => Number(a.activo) - Number(b.activo),
  creadoEn: (a, b) => a.creadoEn.localeCompare(b.creadoEn),
  acciones: () => 0,
};

interface FilaActividad {
  tipoActividadId: string;
  cantidadClases: string;
}

interface FormularioPaquete {
  id: string | null;
  modo: 'paquete' | 'clase';
  nombre: string;
  descripcion: string;
  precio: string;
  vigenciaDias: string;
  unitarioTexto: string;
  destacado: boolean;
  activo: boolean;
  orden: string;
  actividades: FilaActividad[];
}

function formularioVacio(modo: 'paquete' | 'clase'): FormularioPaquete {
  return {
    id: null,
    modo,
    nombre: '',
    descripcion: '',
    precio: '',
    vigenciaDias: modo === 'clase' ? '7' : '30',
    unitarioTexto: '',
    destacado: false,
    activo: true,
    orden: '0',
    actividades: [{ tipoActividadId: '', cantidadClases: '1' }],
  };
}

function formularioDesde(p: PaqueteGestionResponse): FormularioPaquete {
  return {
    id: p.id,
    modo: 'paquete',
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    precio: (p.precioCentavos / 100).toString(),
    vigenciaDias: p.vigenciaDias.toString(),
    unitarioTexto: p.unitarioTexto ?? '',
    destacado: p.destacado,
    activo: p.activo,
    orden: p.orden.toString(),
    actividades: p.actividades.map((a) => ({
      tipoActividadId: a.tipoActividadId,
      cantidadClases: a.cantidadClases.toString(),
    })),
  };
}

export function VentaServicios() {
  const { tiene, mensajeSinPermiso } = usePermisos();
  const puedeVerVista = tiene('venta.servicios.vista');
  const puedeVerEstado = tiene('venta.servicios.gestionar.ver');
  const puedeCrear = tiene('venta.servicios.gestionar.crear');
  const puedeEditar = tiene('venta.servicios.gestionar.editar');
  const puedeDeshabilitar = tiene('venta.servicios.gestionar.deshabilitar');
  const puedeVerAcciones = puedeEditar || puedeDeshabilitar;
  const puedeVerContenido = puedeVerEstado;

  const [paquetes, setPaquetes] = useState<PaqueteGestionResponse[]>([]);
  const [actividades, setActividades] = useState<TipoActividadResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogo, setDialogo] = useState<FormularioPaquete | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoServicio | null>(null);

  const cargar = () => {
    setCargando(true);
    Promise.all([listarPaquetesGestion(), listarTiposActividad()])
      .then(([p, a]) => {
        setPaquetes(p);
        setActividades(a);
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const actualizarFila = (index: number, cambios: Partial<FilaActividad>) => {
    if (!dialogo) return;
    const filas = dialogo.actividades.map((f, i) => (i === index ? { ...f, ...cambios } : f));
    const nombreAuto =
      dialogo.modo === 'clase' && !dialogo.nombre.trim() && cambios.tipoActividadId
        ? `Clase de ${actividades.find((a) => a.id === cambios.tipoActividadId)?.nombre ?? ''}`.trim()
        : dialogo.nombre;
    setDialogo({ ...dialogo, actividades: filas, nombre: nombreAuto });
  };

  const agregarFila = () => {
    if (!dialogo) return;
    setDialogo({ ...dialogo, actividades: [...dialogo.actividades, { tipoActividadId: '', cantidadClases: '1' }] });
  };

  const quitarFila = (index: number) => {
    if (!dialogo) return;
    setDialogo({ ...dialogo, actividades: dialogo.actividades.filter((_, i) => i !== index) });
  };

  const guardar = () => {
    if (!dialogo) return;
    const precioCentavos = Math.round(parseFloat(dialogo.precio || '0') * 100);
    const vigenciaDias = parseInt(dialogo.vigenciaDias, 10);
    const orden = parseInt(dialogo.orden || '0', 10);
    const actividadesValidas = dialogo.actividades.filter((f) => f.tipoActividadId);

    if (!dialogo.nombre.trim()) {
      setErrorDialogo('El nombre es obligatorio');
      return;
    }
    if (!precioCentavos || precioCentavos <= 0) {
      setErrorDialogo('El precio debe ser mayor a 0');
      return;
    }
    if (!vigenciaDias || vigenciaDias <= 0) {
      setErrorDialogo('La vigencia debe ser mayor a 0 días');
      return;
    }
    if (actividadesValidas.length === 0) {
      setErrorDialogo('Agrega al menos una actividad');
      return;
    }

    const payload = {
      nombre: dialogo.nombre.trim(),
      descripcion: dialogo.descripcion.trim() || null,
      precioCentavos,
      vigenciaDias,
      unitarioTexto: dialogo.unitarioTexto.trim() || null,
      destacado: dialogo.destacado,
      orden: orden || 0,
      actividades: actividadesValidas.map((f) => ({
        tipoActividadId: f.tipoActividadId,
        cantidadClases: parseInt(f.cantidadClases, 10) || 1,
      })),
    };

    setGuardando(true);
    setErrorDialogo(null);
    const operacion = dialogo.id
      ? actualizarPaquete(dialogo.id, { ...payload, activo: dialogo.activo })
      : crearPaquete(payload);

    operacion
      .then(() => {
        setDialogo(null);
        setFeedback(dialogo.id ? 'Guardado' : dialogo.modo === 'clase' ? 'Clase creada' : 'Paquete creado');
        cargar();
      })
      .catch((err) => setErrorDialogo(extraerMensajeError(err, 'No se pudo guardar el paquete')))
      .finally(() => setGuardando(false));
  };

  const alternarActivo = (p: PaqueteGestionResponse) => {
    const accion = p.activo ? deshabilitarPaquete(p.id) : habilitarPaquete(p.id);
    accion.then(() => {
      setFeedback(p.activo ? 'Paquete deshabilitado' : 'Paquete habilitado');
      cargar();
    });
  };

  const segmentos = useMemo(() => {
    const conteos: Record<TipoServicio, number> = { clase: 0, paquete: 0, mixto: 0 };
    for (const p of paquetes) conteos[tipoDe(p)] += 1;
    return [
      { tipo: null, etiqueta: 'Todos', color: '#334155', total: paquetes.length },
      ...(Object.keys(TIPO_INFO) as TipoServicio[]).map((tipo) => ({
        tipo,
        etiqueta: TIPO_INFO[tipo].etiqueta,
        color: TIPO_INFO[tipo].color,
        total: conteos[tipo],
      })),
    ];
  }, [paquetes]);

  const paquetesFiltrados = useMemo(
    () => (tipoSeleccionado ? paquetes.filter((p) => tipoDe(p) === tipoSeleccionado) : paquetes),
    [paquetes, tipoSeleccionado],
  );

  const tabla = useTablaLocal<PaqueteGestionResponse, ColumnaPaquete>(
    paquetesFiltrados,
    COMPARADORES_PAQUETES,
    'nombre',
  );

  if (!puedeVerVista || !puedeVerContenido) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <VentaBreadcrumbs actual="Servicios" />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Servicios
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="warning">
            {!puedeVerVista ? mensajeSinPermiso('venta.servicios.vista') : 'No tienes permiso: Visualizar los servicios.'}
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <VentaBreadcrumbs actual="Servicios" />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Servicios
          </Typography>
          <Typography color="text.secondary">
            Paquetes de varias clases o clases sueltas que se venden en caja.
          </Typography>
        </Box>
        {puedeCrear && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setDialogo(formularioVacio('clase'))}>
              Clase suelta
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogo(formularioVacio('paquete'))}>
              Nuevo paquete
            </Button>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
        {segmentos.map((segmento) => {
          const seleccionado = tipoSeleccionado === segmento.tipo;
          return (
            <Chip
              key={segmento.etiqueta}
              onClick={() => setTipoSeleccionado(segmento.tipo)}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>{segmento.etiqueta}</span>
                  <Box
                    component="span"
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      px: 0.75,
                      borderRadius: 10,
                      bgcolor: seleccionado ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {segmento.total}
                  </Box>
                </Box>
              }
              sx={{
                px: 1,
                py: 2.5,
                fontWeight: 600,
                bgcolor: seleccionado ? segmento.color : 'transparent',
                color: seleccionado ? '#fff' : 'text.primary',
                border: '1px solid',
                borderColor: seleccionado ? segmento.color : 'divider',
                '&:hover': { bgcolor: seleccionado ? segmento.color : 'action.hover' },
              }}
            />
          );
        })}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
      <DataTable
        columnas={[
          ...COLUMNAS_PAQUETES_INICIO,
          ...(puedeVerEstado ? [COLUMNA_ESTADO] : []),
          COLUMNA_FECHA,
          ...(puedeVerAcciones ? [COLUMNA_ACCIONES] : []),
        ]}
        filas={tabla.filas}
        obtenerClave={(p) => p.id}
        cargando={cargando}
        ordenPor={tabla.orderBy}
        orden={tabla.order}
        onOrdenar={tabla.onOrdenar}
        iconoVacio={<Inventory2OutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
        textoVacio="No hay registros en esta categoría."
        paginacion={{
          total: tabla.total,
          page: tabla.page,
          rowsPerPage: tabla.rowsPerPage,
          onPageChange: tabla.onPageChange,
          onRowsPerPageChange: tabla.onRowsPerPageChange,
        }}
        renderFila={(p) => (
          <TableRow hover sx={{ opacity: p.activo ? 1 : 0.5 }}>
            <TableCell>{p.nombre}</TableCell>
            <TableCell>
              <Chip
                size="small"
                label={TIPO_INFO[tipoDe(p)].etiqueta.replace(/s$/, '')}
                sx={{ bgcolor: TIPO_INFO[tipoDe(p)].color, color: '#fff' }}
              />
            </TableCell>
            <TableCell>{formatearMoneda(p.precioCentavos)}</TableCell>
            <TableCell>{p.vigenciaDias} días</TableCell>
            <TableCell>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {p.actividades.map((a) => (
                  <Chip key={a.tipoActividadId} size="small" label={`${a.cantidadClases}x ${a.nombreActividad}`} />
                ))}
              </Stack>
            </TableCell>
            {puedeVerEstado && (
              <TableCell>
                <Chip size="small" color={p.activo ? 'success' : 'default'} label={p.activo ? 'Activo' : 'Inactivo'} />
              </TableCell>
            )}
            <TableCell sx={{ color: 'text.secondary' }}>{formatearFecha(p.creadoEn)}</TableCell>
            {puedeVerAcciones && (
              <TableCell align="right">
                {puedeEditar && (
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => setDialogo(formularioDesde(p))}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {puedeDeshabilitar && (
                  <Tooltip title={p.activo ? 'Deshabilitar' : 'Habilitar'}>
                    <IconButton size="small" onClick={() => alternarActivo(p)}>
                      {p.activo ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            )}
          </TableRow>
        )}
      />
      </Box>

      <Dialog open={!!dialogo} onClose={() => setDialogo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogo?.id ? 'Editar paquete' : dialogo?.modo === 'clase' ? 'Nueva clase suelta' : 'Nuevo paquete'}
        </DialogTitle>
        <DialogContent>
          {dialogo && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {errorDialogo && <Alert severity="error">{errorDialogo}</Alert>}
              <TextField
                label="Nombre"
                value={dialogo.nombre}
                onChange={(e) => setDialogo({ ...dialogo, nombre: e.target.value })}
                fullWidth
              />
              <TextField
                label="Descripción"
                value={dialogo.descripcion}
                onChange={(e) => setDialogo({ ...dialogo, descripcion: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Precio (MXN)"
                  type="number"
                  value={dialogo.precio}
                  onChange={(e) => setDialogo({ ...dialogo, precio: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Vigencia (días)"
                  type="number"
                  value={dialogo.vigenciaDias}
                  onChange={(e) => setDialogo({ ...dialogo, vigenciaDias: e.target.value })}
                  fullWidth
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Texto unitario (opcional)"
                  placeholder="ej. $180 c/u"
                  value={dialogo.unitarioTexto}
                  onChange={(e) => setDialogo({ ...dialogo, unitarioTexto: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Orden"
                  type="number"
                  value={dialogo.orden}
                  onChange={(e) => setDialogo({ ...dialogo, orden: e.target.value })}
                  fullWidth
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dialogo.destacado}
                      onChange={(e) => setDialogo({ ...dialogo, destacado: e.target.checked })}
                    />
                  }
                  label="Destacado"
                />
                {dialogo.id && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dialogo.activo}
                        onChange={(e) => setDialogo({ ...dialogo, activo: e.target.checked })}
                      />
                    }
                    label="Activo"
                  />
                )}
              </Stack>

              {dialogo.modo === 'clase' && !dialogo.id ? (
                <TextField
                  select
                  label="Actividad"
                  value={dialogo.actividades[0].tipoActividadId}
                  onChange={(e) => actualizarFila(0, { tipoActividadId: e.target.value })}
                  fullWidth
                >
                  {actividades.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Actividades incluidas
                  </Typography>
                  <Stack spacing={1}>
                    {dialogo.actividades.map((fila, index) => (
                      <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <TextField
                          select
                          label="Actividad"
                          value={fila.tipoActividadId}
                          onChange={(e) => actualizarFila(index, { tipoActividadId: e.target.value })}
                          sx={{ flexGrow: 1 }}
                        >
                          {actividades.map((a) => (
                            <MenuItem key={a.id} value={a.id}>
                              {a.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Clases"
                          type="number"
                          value={fila.cantidadClases}
                          onChange={(e) => actualizarFila(index, { cantidadClases: e.target.value })}
                          sx={{ width: 100 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => quitarFila(index)}
                          disabled={dialogo.actividades.length === 1}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                  <Button size="small" startIcon={<AddIcon />} onClick={agregarFila} sx={{ mt: 1 }}>
                    Agregar actividad
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(null)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
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
