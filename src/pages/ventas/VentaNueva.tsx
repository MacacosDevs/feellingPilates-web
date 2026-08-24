import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link as MuiLink,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { listarUsuarios } from '../../api/usuariosAdmin';
import { listarPaquetesPublicos, listarSedesVenta, registrarVentaCarrito } from '../../api/pagos';
import { DialogoCrearCliente } from '../usuarios/DialogoCrearCliente';
import { usePermisos } from '../../auth/usePermisos';
import { VentaBreadcrumbs } from './VentaBreadcrumbs';
import type { ApiErrorBody, PaqueteResponse, SedeVentaResponse, UsuarioResponse, VentaResponse } from '../../api/types';

function formatearMoneda(centavos: number): string {
  return `${(centavos / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} MXN`;
}

function fechaCaducidad(vigenciaDias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + vigenciaDias);
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatearFechaVenta(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Solo digitos, sin ceros a la izquierda (evita "01", "02"); vacio se trata como 0. */
function sanearCantidad(texto: string): number {
  const soloDigitos = texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return soloDigitos === '' ? 0 : Number(soloDigitos);
}

function extraerMensajeError(err: unknown, mensajePorDefecto: string): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.message ?? mensajePorDefecto;
  }
  return mensajePorDefecto;
}

const METODO_PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

interface VentaConfirmada {
  clienteNombre: string;
  folio: string;
  sedeNombre: string;
  fechaIso: string;
  metodoPago: string;
  totalCentavos: number;
  lineas: { nombre: string; cantidad: number; montoCentavos: number }[];
}

/** Junta las filas de Compra (una por unidad) devueltas por el backend en una linea por paquete. */
function agruparLineasVenta(items: VentaResponse[]): VentaConfirmada['lineas'] {
  const porPaquete = new Map<string, { nombre: string; cantidad: number; montoCentavos: number }>();
  for (const item of items) {
    const existente = porPaquete.get(item.paqueteNombre);
    if (existente) {
      existente.cantidad += 1;
      existente.montoCentavos += item.montoCentavos;
    } else {
      porPaquete.set(item.paqueteNombre, { nombre: item.paqueteNombre, cantidad: 1, montoCentavos: item.montoCentavos });
    }
  }
  return [...porPaquete.values()];
}

export function VentaNueva() {
  const { tiene, mensajeSinPermiso } = usePermisos();
  const puedeVerVista = tiene('venta.registrar.vista');
  const puedeRegistrar = tiene('venta.registrar.crear');

  const [busqueda, setBusqueda] = useState('');
  const [opciones, setOpciones] = useState<UsuarioResponse[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<UsuarioResponse | null>(null);
  const [dialogoNuevoCliente, setDialogoNuevoCliente] = useState(false);

  const [paquetes, setPaquetes] = useState<PaqueteResponse[]>([]);
  const [cargandoPaquetes, setCargandoPaquetes] = useState(true);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  const [sedes, setSedes] = useState<SedeVentaResponse[]>([]);
  const [sedeId, setSedeId] = useState<string>('');
  const [cargandoSedes, setCargandoSedes] = useState(true);

  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [confirmando, setConfirmando] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ventaConfirmada, setVentaConfirmada] = useState<VentaConfirmada | null>(null);

  useEffect(() => {
    listarPaquetesPublicos()
      .then(setPaquetes)
      .finally(() => setCargandoPaquetes(false));
    listarSedesVenta()
      .then((res) => {
        setSedes(res);
        if (res.length === 1) setSedeId(res[0].id);
      })
      .finally(() => setCargandoSedes(false));
  }, []);

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setOpciones([]);
      return;
    }
    let cancelado = false;
    setBuscando(true);
    const timeout = setTimeout(() => {
      listarUsuarios({ rol: 'CLIENTE', busqueda, size: 10 })
        .then((pagina) => {
          if (!cancelado) setOpciones(pagina.content);
        })
        .finally(() => {
          if (!cancelado) setBuscando(false);
        });
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [busqueda]);

  const carrito = useMemo(
    () =>
      [...seleccionados]
        .map((id) => {
          const paquete = paquetes.find((p) => p.id === id);
          return paquete ? { paquete, cantidad: cantidades[id] ?? 1 } : null;
        })
        .filter((x): x is { paquete: PaqueteResponse; cantidad: number } => !!x),
    [seleccionados, cantidades, paquetes],
  );
  const itemsValidos = carrito.filter((item) => item.cantidad > 0);
  const total = itemsValidos.reduce((suma, { paquete, cantidad }) => suma + paquete.precioCentavos * cantidad, 0);
  const puedeCobrar = puedeRegistrar && !!cliente && itemsValidos.length > 0 && !!sedeId && !cobrando;
  const faltantes = [
    !sedeId && 'una sede',
    !cliente && 'un cliente',
    itemsValidos.length === 0 && 'al menos un paquete o clase',
  ].filter((x): x is string => !!x);

  const elegirCantidad = (id: string, cantidad: number) => {
    setCantidades((prev) => ({ ...prev, [id]: Math.max(0, cantidad) }));
  };

  const alternarEnCarrito = (id: string) => {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) {
        siguiente.delete(id);
      } else {
        siguiente.add(id);
        setCantidades((prevCantidades) => ({ ...prevCantidades, [id]: prevCantidades[id] || 1 }));
      }
      return siguiente;
    });
  };

  const cobrar = async () => {
    if (!cliente || itemsValidos.length === 0 || !sedeId) return;
    setCobrando(true);
    setError(null);
    try {
      const venta = await registrarVentaCarrito({
        clienteId: cliente.id,
        salonId: sedeId,
        metodoPago,
        items: itemsValidos.map(({ paquete, cantidad }) => ({ paqueteId: paquete.id, cantidad })),
      });
      const primerItem = venta.items[0];
      setVentaConfirmada({
        clienteNombre: cliente.nombre,
        folio: `F${venta.grupoCompraId.slice(0, 7).toUpperCase()}`,
        sedeNombre: primerItem?.salonNombre ?? sedes.find((s) => s.id === sedeId)?.nombre ?? '—',
        fechaIso: primerItem?.creadoEn ?? new Date().toISOString(),
        metodoPago,
        totalCentavos: venta.totalCentavos,
        lineas: agruparLineasVenta(venta.items),
      });
      setCliente(null);
      setBusqueda('');
      setSeleccionados(new Set());
      setCantidades({});
      setConfirmando(false);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar la venta'));
    } finally {
      setCobrando(false);
    }
  };

  if (!puedeVerVista) {
    return (
      <Box sx={{ maxWidth: 980 }}>
        <VentaBreadcrumbs actual="Nueva venta" />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Nueva venta
        </Typography>
        <Alert severity="warning">{mensajeSinPermiso('venta.registrar.vista')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 980 }}>
      <VentaBreadcrumbs actual="Nueva venta" />
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Nueva venta
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Stack spacing={2.5} sx={{ flexGrow: 1, width: '100%' }}>
          {cargandoSedes ? null : sedes.length > 1 ? (
            <TextField select label="Sede" size="small" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
              {sedes.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nombre}
                </MenuItem>
              ))}
            </TextField>
          ) : sedes.length === 1 ? (
            <Typography variant="body2" color="text.secondary">
              Sede: <strong>{sedes[0].nombre}</strong>
            </Typography>
          ) : (
            <Alert severity="warning">No tienes ninguna sede asignada; no puedes registrar ventas.</Alert>
          )}

          <Stack direction="row" spacing={1}>
            <Autocomplete
              sx={{ flexGrow: 1 }}
              size="small"
              options={opciones}
              value={cliente}
              onChange={(_e, valor) => setCliente(valor)}
              inputValue={busqueda}
              onInputChange={(_e, valor) => setBusqueda(valor)}
              getOptionLabel={(u) => `${u.nombre} · ${u.correo}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              loading={buscando}
              noOptionsText={busqueda.trim().length < 2 ? 'Escribe al menos 2 letras' : 'Sin resultados'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Nombre o correo"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {buscando && <CircularProgress size={16} />}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <Button variant="text" size="small" onClick={() => setDialogoNuevoCliente(true)} sx={{ whiteSpace: 'nowrap' }}>
              + Cliente nuevo
            </Button>
          </Stack>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Paquetes y clases
            </Typography>
            {cargandoPaquetes ? (
              <CircularProgress size={20} />
            ) : paquetes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aún no hay nada dado de alta.{' '}
                <MuiLink component={RouterLink} to="/ventas/servicios">
                  Crear el primero
                </MuiLink>
              </Typography>
            ) : (
              <Stack sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {paquetes.map((p, i) => (
                  <Stack
                    key={p.id}
                    direction="row"
                    onClick={() => alternarEnCarrito(p.id)}
                    sx={{
                      alignItems: 'center',
                      px: 1,
                      py: 0.75,
                      cursor: 'pointer',
                      borderTop: i > 0 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Checkbox checked={seleccionados.has(p.id)} size="small" sx={{ p: 0.5, mr: 1 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">
                        {p.nombre}
                        {p.actividades.length > 0 && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {p.actividades.map((a) => `${a.cantidadClases}x ${a.nombreActividad}`).join(' + ')}
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatearMoneda(p.precioCentavos)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>

        <Box
          sx={{
            width: { xs: '100%', md: 340 },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 2.5,
            position: { md: 'sticky' },
            top: { md: 16 },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Resumen de venta
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Cliente
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {cliente ? cliente.nombre : '—'}
          </Typography>

          <Divider sx={{ mb: 1.5 }} />

          {carrito.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Agrega al menos un paquete o clase.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 60px auto',
                columnGap: 1,
                rowGap: 0.5,
                alignItems: 'center',
                mb: 1.5,
              }}
            >
              {carrito.map(({ paquete, cantidad }) => (
                <Box key={paquete.id} sx={{ display: 'contents' }}>
                  <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: 'break-word' }}>
                    {paquete.nombre}
                  </Typography>
                  <TextField
                    type="text"
                    size="small"
                    value={cantidad}
                    onChange={(e) => elegirCantidad(paquete.id, sanearCantidad(e.target.value))}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', style: { textAlign: 'center' } } }}
                    sx={{ width: 60 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 76, textAlign: 'right' }}>
                    {formatearMoneda(paquete.precioCentavos * cantidad)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1 / -1', mb: 0.75 }}>
                    Vence el {fechaCaducidad(paquete.vigenciaDias)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ mb: 1.5 }} />

          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatearMoneda(total)}</Typography>
          </Stack>

          <TextField
            select
            label="Método de pago"
            size="small"
            fullWidth
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as 'efectivo' | 'transferencia')}
            sx={{ mb: 2 }}
          >
            <MenuItem value="efectivo">Efectivo</MenuItem>
            <MenuItem value="transferencia">Transferencia</MenuItem>
          </TextField>

          <Button variant="contained" fullWidth disabled={!puedeCobrar} onClick={() => setConfirmando(true)}>
            Cobrar
          </Button>
          {!puedeRegistrar && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              {mensajeSinPermiso('venta.registrar.crear')}
            </Typography>
          )}
          {puedeRegistrar && !puedeCobrar && !cobrando && faltantes.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Falta elegir {faltantes.join(', ')}.
            </Typography>
          )}
        </Box>
      </Stack>

      <DialogoCrearCliente
        abierto={dialogoNuevoCliente}
        onCerrar={() => setDialogoNuevoCliente(false)}
        onCreado={(usuario) => {
          setCliente(usuario);
          setBusqueda(`${usuario.nombre} · ${usuario.correo}`);
          setDialogoNuevoCliente(false);
        }}
      />

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Dialog open={confirmando} onClose={() => !cobrando && setConfirmando(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar venta</DialogTitle>
        <DialogContent dividers>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                Cliente
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {cliente?.nombre}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                Sucursal
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {sedes.find((s) => s.id === sedeId)?.nombre ?? '—'}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            Fecha de venta
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {formatearFechaVenta(new Date().toISOString())}
          </Typography>

          <Divider sx={{ mb: 1.5 }} />

          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            Artículos
          </Typography>
          <Stack spacing={1} sx={{ mb: 1.5, mt: 0.5 }}>
            {itemsValidos.map(({ paquete, cantidad }) => (
              <Stack key={paquete.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2">{paquete.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cantidad} × {formatearMoneda(paquete.precioCentavos)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatearMoneda(paquete.precioCentavos * cantidad)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Divider sx={{ mb: 1.5 }} />

          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatearMoneda(total)}</Typography>
          </Stack>

          <Chip
            size="small"
            variant="outlined"
            color={metodoPago === 'efectivo' ? 'success' : 'info'}
            label={METODO_PAGO_LABEL[metodoPago] ?? metodoPago}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmando(false)} disabled={cobrando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={cobrar}
            disabled={cobrando}
            startIcon={cobrando ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {cobrando ? 'Cobrando…' : 'Confirmar venta'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!ventaConfirmada} onClose={() => setVentaConfirmada(null)} maxWidth="xs" fullWidth>
        {ventaConfirmada && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" />
              Venta registrada
              <IconButton
                onClick={() => setVentaConfirmada(null)}
                sx={{ ml: 'auto' }}
                size="small"
                aria-label="Cerrar"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.25 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    Cliente
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ventaConfirmada.clienteNombre}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    Folio
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {ventaConfirmada.folio}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    Sucursal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ventaConfirmada.sedeNombre}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    Fecha de venta
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatearFechaVenta(ventaConfirmada.fechaIso)}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />

              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {ventaConfirmada.lineas.map((linea) => (
                  <Stack key={linea.nombre} direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      {linea.nombre}
                      {linea.cantidad > 1 && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          ×{linea.cantidad}
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatearMoneda(linea.montoCentavos)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />

              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatearMoneda(ventaConfirmada.totalCentavos)}</Typography>
              </Stack>

              <Chip
                size="small"
                variant="outlined"
                color={ventaConfirmada.metodoPago === 'efectivo' ? 'success' : 'info'}
                label={METODO_PAGO_LABEL[ventaConfirmada.metodoPago] ?? ventaConfirmada.metodoPago}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setVentaConfirmada(null)} variant="contained" fullWidth>
                Listo
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
