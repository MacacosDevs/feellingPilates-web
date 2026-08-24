import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Popover,
  Snackbar,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { DataTable, type ColumnaTabla } from '../../components/DataTable';
import { listarVentasFiltrado, listarSedesVenta, reembolsarVenta } from '../../api/pagos';
import type { ApiErrorBody, SedeVentaResponse, VentaResponse } from '../../api/types';
import { isAxiosError } from 'axios';
import { usePermisos } from '../../auth/usePermisos';
import { VentaBreadcrumbs } from './VentaBreadcrumbs';

function formatearMoneda(centavos: number): string {
  return `${(centavos / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} MXN`;
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

function folioCorto(grupoCompraId: string | null): string {
  if (!grupoCompraId) return '—';
  return `F${grupoCompraId.slice(0, 7).toUpperCase()}`;
}

interface VentaGrupo {
  clave: string;
  grupoCompraId: string | null;
  items: VentaResponse[];
}

/** Junta en un mismo grupo las lineas de compra que comparten grupoCompraId (un mismo checkout de caja). */
function agruparVentas(ventas: VentaResponse[]): VentaGrupo[] {
  const grupos: VentaGrupo[] = [];
  const indicePorClave = new Map<string, number>();
  for (const v of ventas) {
    const clave = v.grupoCompraId ?? v.id;
    const indiceExistente = indicePorClave.get(clave);
    if (indiceExistente !== undefined) {
      grupos[indiceExistente].items.push(v);
    } else {
      indicePorClave.set(clave, grupos.length);
      grupos.push({ clave, grupoCompraId: v.grupoCompraId, items: [v] });
    }
  }
  return grupos;
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

const METODO_COLOR: Record<string, 'success' | 'info'> = {
  efectivo: 'success',
  transferencia: 'info',
};

const ESTADO_LABEL: Record<string, string> = {
  pagada: 'Cobrada',
  cancelada: 'Cancelada',
  reembolsada: 'Reembolsada',
  pendiente: 'Pendiente',
  fallida: 'Fallida',
};

const ESTADO_COLOR: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  pagada: 'success',
  cancelada: 'default',
  reembolsada: 'error',
  pendiente: 'warning',
  fallida: 'error',
};

function extraerMensajeError(err: unknown, mensajePorDefecto: string): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.message ?? mensajePorDefecto;
  }
  return mensajePorDefecto;
}

type ColumnaOrdenable = 'clienteNombre' | 'paqueteNombre' | 'montoCentavos' | 'metodoPago' | 'salonNombre' | 'registradaPorNombre' | 'creadoEn';
type Columna = ColumnaOrdenable | 'folio' | 'estado' | 'acciones';

const SORT_PROP: Record<ColumnaOrdenable, string> = {
  clienteNombre: 'usuario.nombre',
  paqueteNombre: 'paquete.nombre',
  montoCentavos: 'montoCentavos',
  metodoPago: 'metodoPago',
  salonNombre: 'salon.nombre',
  registradaPorNombre: 'registradaPor.nombre',
  creadoEn: 'creadoEn',
};

const COLUMNAS: ColumnaTabla<Columna>[] = [
  { id: 'clienteNombre', label: 'Cliente', ordenable: true },
  { id: 'paqueteNombre', label: 'Paquete', ordenable: true },
  { id: 'montoCentavos', label: 'Monto', ordenable: true, align: 'right' },
  { id: 'metodoPago', label: 'Método', ordenable: true },
  { id: 'salonNombre', label: 'Sede', ordenable: true },
  { id: 'registradaPorNombre', label: 'Cobrada por', ordenable: true },
  { id: 'creadoEn', label: 'Fecha', ordenable: true },
  { id: 'folio', label: 'Folio', ordenable: false },
  { id: 'estado', label: 'Estado', ordenable: false },
  { id: 'acciones', label: '', ordenable: false, align: 'right' },
];

const CAMPO_SX = { minWidth: 168 };

export function VentaGestion() {
  const { tiene, mensajeSinPermiso } = usePermisos();
  const puedeVerVista = tiene('venta.gestion.vista');
  const puedeGestionar = tiene('venta.gestion.gestionar');
  const puedeVerTodos = tiene('venta.gestion.ver.todos');
  const puedeVerPropio = tiene('venta.gestion.ver.propio');
  const puedeVerContenido = puedeVerPropio || puedeVerTodos;

  const [ventas, setVentas] = useState<VentaResponse[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [sedes, setSedes] = useState<SedeVentaResponse[]>([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<Columna>('creadoEn');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const [metodoPago, setMetodoPago] = useState('');
  const [salonId, setSalonId] = useState('');
  const [estado, setEstado] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [anchorFecha, setAnchorFecha] = useState<HTMLElement | null>(null);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const [menu, setMenu] = useState<{ anchorEl: HTMLElement; venta: VentaResponse } | null>(null);
  const [accion, setAccion] = useState<VentaResponse | null>(null);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  useEffect(() => {
    listarSedesVenta().then(setSedes);
  }, []);

  const grupos = useMemo(() => agruparVentas(ventas), [ventas]);

  function alternarExpandido(clave: string) {
    setExpandidos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(clave)) siguiente.delete(clave);
      else siguiente.add(clave);
      return siguiente;
    });
  }

  const sortProp = useMemo(() => SORT_PROP[orderBy as ColumnaOrdenable] ?? 'creadoEn', [orderBy]);
  const hayFiltrosActivos = Boolean(busqueda || metodoPago || salonId || estado || desde || hasta);

  const etiquetaRangoFecha = useMemo(() => {
    const corta = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    if (desde && hasta) return `${corta(desde)} – ${corta(hasta)}`;
    if (desde) return `Desde ${corta(desde)}`;
    if (hasta) return `Hasta ${corta(hasta)}`;
    return 'Fecha';
  }, [desde, hasta]);

  const cargarHistorial = useCallback(() => {
    if (!puedeVerContenido) {
      setCargando(false);
      return Promise.resolve();
    }
    setCargando(true);
    return listarVentasFiltrado({
      page,
      size: rowsPerPage,
      sort: `${sortProp},${order}`,
      metodoPago: metodoPago || undefined,
      salonId: salonId || undefined,
      estado: estado || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      busqueda: busqueda || undefined,
    })
      .then((pagina) => {
        setVentas(pagina.content);
        setTotalElementos(pagina.totalElements);
      })
      .finally(() => setCargando(false));
  }, [page, rowsPerPage, sortProp, order, metodoPago, salonId, estado, desde, hasta, busqueda, puedeVerContenido]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  function confirmarAccion() {
    if (!accion || !motivo.trim()) return;
    setProcesando(true);
    reembolsarVenta(accion.id, motivo.trim())
      .then(() => {
        setAccion(null);
        setMotivo('');
        return cargarHistorial();
      })
      .catch((err) => {
        setErrorAccion(extraerMensajeError(err, 'No se pudo reembolsar la venta'));
      })
      .finally(() => setProcesando(false));
  }

  function alCambiarOrden(columna: Columna) {
    if (orderBy === columna) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(columna);
      setOrder('asc');
    }
    setPage(0);
  }

  function conFiltro<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor);
      setPage(0);
    };
  }

  function limpiarFiltros() {
    setBusqueda('');
    setMetodoPago('');
    setSalonId('');
    setEstado('');
    setDesde('');
    setHasta('');
    setPage(0);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <VentaBreadcrumbs actual="Gestión de ventas" />
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Gestión de ventas
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Ventas cobradas en efectivo o transferencia.
      </Typography>

      {!puedeVerVista || !puedeVerContenido ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="warning">
            {!puedeVerVista
              ? mensajeSinPermiso('venta.gestion.vista')
              : mensajeSinPermiso(['venta.gestion.ver.todos', 'venta.gestion.ver.propio'])}
          </Alert>
        </Box>
      ) : (
        <>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
          flexWrap: 'wrap',
          rowGap: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          px: 1.5,
          py: 1.25,
          mb: 2.5,
        }}
      >
        <TextField
          placeholder="Buscar cliente o cobrador"
          size="small"
          value={busqueda}
          onChange={(e) => conFiltro(setBusqueda)(e.target.value)}
          sx={{ minWidth: 220, flexGrow: 1, maxWidth: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField select label="Método" size="small" value={metodoPago} onChange={(e) => conFiltro(setMetodoPago)(e.target.value)} sx={CAMPO_SX}>
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="efectivo">Efectivo</MenuItem>
          <MenuItem value="transferencia">Transferencia</MenuItem>
        </TextField>
        <TextField select label="Sede" size="small" value={salonId} onChange={(e) => conFiltro(setSalonId)(e.target.value)} sx={CAMPO_SX}>
          <MenuItem value="">Todas</MenuItem>
          {sedes.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.nombre}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Estado" size="small" value={estado} onChange={(e) => conFiltro(setEstado)(e.target.value)} sx={CAMPO_SX}>
          <MenuItem value="">Todos</MenuItem>
          {Object.entries(ESTADO_LABEL).map(([codigo, etiqueta]) => (
            <MenuItem key={codigo} value={codigo}>
              {etiqueta}
            </MenuItem>
          ))}
        </TextField>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CalendarTodayOutlinedIcon fontSize="small" />}
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => setAnchorFecha(e.currentTarget)}
          sx={{ color: desde || hasta ? 'text.primary' : 'text.secondary', borderColor: 'divider', minWidth: 150, justifyContent: 'space-between' }}
        >
          {etiquetaRangoFecha}
        </Button>
        <Popover
          open={!!anchorFecha}
          anchorEl={anchorFecha}
          onClose={() => setAnchorFecha(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Stack spacing={1.5} sx={{ p: 2 }}>
            <TextField
              label="Desde"
              type="date"
              size="small"
              value={desde}
              onChange={(e) => conFiltro(setDesde)(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Hasta"
              type="date"
              size="small"
              value={hasta}
              onChange={(e) => conFiltro(setHasta)(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {(desde || hasta) && (
              <Button
                size="small"
                onClick={() => {
                  conFiltro(setDesde)('');
                  conFiltro(setHasta)('');
                }}
              >
                Limpiar fechas
              </Button>
            )}
          </Stack>
        </Popover>
        {hayFiltrosActivos && (
          <Tooltip title="Limpiar filtros">
            <IconButton size="small" onClick={limpiarFiltros} sx={{ color: 'text.secondary' }}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
      <DataTable
        columnas={COLUMNAS}
        filas={grupos}
        obtenerClave={(g) => g.clave}
        cargando={cargando}
        ordenPor={orderBy}
        orden={order}
        onOrdenar={alCambiarOrden}
        iconoVacio={<ReceiptLongOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
        textoVacio={hayFiltrosActivos ? 'No hay ventas para los filtros seleccionados.' : 'Aún no hay ventas registradas.'}
        paginacion={{
          total: totalElementos,
          page,
          rowsPerPage,
          onPageChange: setPage,
          onRowsPerPageChange: (size) => {
            setRowsPerPage(size);
            setPage(0);
          },
        }}
        renderFila={(g) => {
          const primero = g.items[0];
          const montoTotal = g.items.reduce((suma, item) => suma + item.montoCentavos, 0);
          const esGrupo = g.items.length > 1;
          const abierto = expandidos.has(g.clave);
          const estadoComun = g.items.every((item) => item.estado === primero.estado) ? primero.estado : null;
          return (
            <>
              <TableRow
                hover
                onClick={esGrupo ? () => alternarExpandido(g.clave) : undefined}
                sx={esGrupo ? { cursor: 'pointer' } : undefined}
              >
                <TableCell>{primero.clienteNombre}</TableCell>
                <TableCell>
                  {esGrupo ? (
                    <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
                      <IconButton size="small" sx={{ p: 0 }} tabIndex={-1}>
                        {abierto ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                      <Typography variant="body2">{g.items.length} artículos</Typography>
                    </Stack>
                  ) : (
                    primero.paqueteNombre
                  )}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatearMoneda(montoTotal)}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={METODO_COLOR[primero.metodoPago]}
                    variant="outlined"
                    label={METODO_LABEL[primero.metodoPago] ?? primero.metodoPago}
                  />
                </TableCell>
                <TableCell>{primero.salonNombre ?? '—'}</TableCell>
                <TableCell>{primero.registradaPorNombre ?? '—'}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{formatearFecha(primero.creadoEn)}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{folioCorto(g.grupoCompraId)}</TableCell>
                <TableCell>
                  {estadoComun ? (
                    <Tooltip title={primero.motivoEstado ?? ''} disableHoverListener={!primero.motivoEstado}>
                      <Chip size="small" color={ESTADO_COLOR[estadoComun]} label={ESTADO_LABEL[estadoComun] ?? estadoComun} />
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Mixto
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  {!esGrupo && puedeGestionar && (
                    <IconButton
                      size="small"
                      onClick={(e) => setMenu({ anchorEl: e.currentTarget, venta: primero })}
                      aria-label="Acciones"
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
              {esGrupo &&
                abierto &&
                g.items.map((item) => (
                  <TableRow key={item.id} sx={{ bgcolor: 'action.hover' }}>
                    <TableCell />
                    <TableCell sx={{ pl: 5 }}>{item.paqueteNombre}</TableCell>
                    <TableCell align="right">{formatearMoneda(item.montoCentavos)}</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell>
                      <Tooltip title={item.motivoEstado ?? ''} disableHoverListener={!item.motivoEstado}>
                        <Chip size="small" color={ESTADO_COLOR[item.estado]} label={ESTADO_LABEL[item.estado] ?? item.estado} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      {puedeGestionar && (
                        <IconButton size="small" onClick={(e) => setMenu({ anchorEl: e.currentTarget, venta: item })} aria-label="Acciones">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </>
          );
        }}
      />
      </Box>

      <Menu anchorEl={menu?.anchorEl} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem
          disabled={menu?.venta.estado !== 'pagada'}
          onClick={() => {
            if (menu) setAccion(menu.venta);
            setMenu(null);
          }}
        >
          <CurrencyExchangeIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
          Marcar como reembolsada
        </MenuItem>
      </Menu>

      <Dialog
        open={!!accion}
        onClose={() => {
          if (procesando) return;
          setAccion(null);
          setMotivo('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CurrencyExchangeIcon color="error" />
          Marcar como reembolsada
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">Esta venta cambiará su estado a "Reembolsada".</Typography>
          {accion && (
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 1, mb: 2 }}>
              {accion.clienteNombre} · {accion.paqueteNombre} · {formatearMoneda(accion.montoCentavos)}
            </Typography>
          )}
          <TextField
            label="Motivo"
            placeholder="Explica por qué se reembolsa esta venta"
            fullWidth
            multiline
            minRows={2}
            size="small"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAccion(null);
              setMotivo('');
            }}
            disabled={procesando}
          >
            Cerrar
          </Button>
          <Button variant="contained" color="error" onClick={confirmarAccion} disabled={procesando || !motivo.trim()}>
            {procesando ? 'Procesando…' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!errorAccion} autoHideDuration={6000} onClose={() => setErrorAccion(null)}>
        <Alert severity="error" onClose={() => setErrorAccion(null)}>
          {errorAccion}
        </Alert>
      </Snackbar>
        </>
      )}
    </Box>
  );
}
