import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { crearSalon, actualizarSalon } from '../../api/salones';
import {
  crearTipoActividad,
  crearTipoRecurso,
  listarEstados,
  listarMunicipios,
  listarTiposActividad,
  listarTiposRecurso,
} from '../../api/catalogos';
import { SelectorMultipleBusqueda } from '../../components/SelectorMultipleBusqueda';
import { AutocompletadoDireccion, type DireccionSeleccionada } from './AutocompletadoDireccion';
import { DialogoNuevoCatalogoItem } from './DialogoNuevoCatalogoItem';
import { MapaInteractivo } from './MapaInteractivo';
import { tieneGoogleMapsConfigurado } from '../../lib/googleMaps';
import type {
  ApiErrorBody,
  EstadoResponse,
  HorarioOperacionRequest,
  RecursoItem,
  MunicipioResponse,
  SalonDetalleResponse,
  TipoActividadResponse,
  TipoRecursoResponse,
} from '../../api/types';

interface DialogoSalonProps {
  abierto: boolean;
  salon: SalonDetalleResponse | null;
  onCerrar: () => void;
  onGuardado: (salon: SalonDetalleResponse) => void;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const CENTRO_QUERETARO = { lat: 20.5888, lng: -100.3899 };

const PASOS = ['Información y ubicación', 'Actividades', 'Horarios de atención', 'Equipamiento'];

function extraerMensajeError(err: unknown, mensajePorDefecto: string): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.message ?? mensajePorDefecto;
  }
  return mensajePorDefecto;
}

export function DialogoSalon({ abierto, salon, onCerrar, onGuardado }: DialogoSalonProps) {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [calle, setCalle] = useState('');
  const [numeroExterior, setNumeroExterior] = useState('');
  const [numeroInterior, setNumeroInterior] = useState('');
  const [colonia, setColonia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [referencias, setReferencias] = useState('');
  const [direccionCompleta, setDireccionCompleta] = useState<string | null>(null);
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [estadoId, setEstadoId] = useState<number | ''>('');
  const [municipioId, setMunicipioId] = useState<number | ''>('');
  const [estados, setEstados] = useState<EstadoResponse[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioResponse[]>([]);
  const [tiposActividadCatalogo, setTiposActividadCatalogo] = useState<TipoActividadResponse[]>([]);
  const [tiposRecursoCatalogo, setTiposRecursoCatalogo] = useState<TipoRecursoResponse[]>([]);
  const [tipoActividadIds, setTipoActividadIds] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<(HorarioOperacionRequest | null)[]>(DIAS.map(() => null));
  const [recursos, setRecursos] = useState<RecursoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [dialogoNuevaActividad, setDialogoNuevaActividad] = useState(false);
  const [dialogoNuevaRecurso, setDialogoNuevaRecurso] = useState(false);
  const [pasoActivo, setPasoActivo] = useState(0);
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState(false);
  const contenidoRef = useRef<HTMLDivElement>(null);

  function mostrarError(mensaje: string) {
    setError(mensaje);
    contenidoRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function refrescarTiposActividad() {
    return listarTiposActividad().then(setTiposActividadCatalogo);
  }

  function refrescarTiposRecurso() {
    return listarTiposRecurso().then(setTiposRecursoCatalogo);
  }

  useEffect(() => {
    if (!abierto) return;
    listarEstados().then(setEstados);
    listarTiposActividad().then(setTiposActividadCatalogo);
    listarTiposRecurso().then(setTiposRecursoCatalogo);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    if (salon) {
      setNombre(salon.nombre);
      setTelefono(salon.telefono ?? '');
      setCalle(salon.calle ?? '');
      setNumeroExterior(salon.numeroExterior ?? '');
      setNumeroInterior(salon.numeroInterior ?? '');
      setColonia(salon.colonia ?? '');
      setCodigoPostal(salon.codigoPostal ?? '');
      setReferencias(salon.referencias ?? '');
      setDireccionCompleta(salon.direccionCompleta);
      setLatitud(salon.latitud);
      setLongitud(salon.longitud);
      setEstadoId(salon.estadoId);
      setMunicipioId(salon.municipioId);
      setUbicacionConfirmada(salon.latitud !== null && salon.longitud !== null);
      setTipoActividadIds(salon.tiposActividad.map((t) => t.id));
      const nuevosHorarios: (HorarioOperacionRequest | null)[] = DIAS.map(() => null);
      salon.horarios.forEach((h) => {
        nuevosHorarios[h.diaSemana] = { diaSemana: h.diaSemana, horaApertura: h.horaApertura, horaCierre: h.horaCierre };
      });
      setHorarios(nuevosHorarios);
      setRecursos(salon.recursos.map((m) => ({ tipoRecursoId: m.tipoRecursoId, cantidad: m.cantidad })));
    } else {
      setNombre('');
      setTelefono('');
      setCalle('');
      setNumeroExterior('');
      setNumeroInterior('');
      setColonia('');
      setCodigoPostal('');
      setReferencias('');
      setDireccionCompleta(null);
      setLatitud(null);
      setLongitud(null);
      setEstadoId('');
      setMunicipioId('');
      setUbicacionConfirmada(false);
      setTipoActividadIds([]);
      setHorarios(DIAS.map(() => null));
      setRecursos([]);
    }
    setError(null);
    setPasoActivo(0);
  }, [abierto, salon]);

  useEffect(() => {
    if (estadoId === '') {
      setMunicipios([]);
      return;
    }
    listarMunicipios(estadoId).then(setMunicipios);
  }, [estadoId]);

  const manejarDireccionSeleccionada = useCallback(
    (direccion: DireccionSeleccionada) => {
      setCalle(direccion.calle);
      setNumeroExterior(direccion.numeroExterior);
      setNumeroInterior(direccion.numeroInterior);
      setColonia(direccion.colonia);
      setCodigoPostal(direccion.codigoPostal);
      setDireccionCompleta(direccion.direccionCompleta);
      setLatitud(direccion.latitud);
      setLongitud(direccion.longitud);
      setUbicacionConfirmada(false);

      const estadoEncontrado = estados.find((e) => e.nombre === direccion.estado);
      if (estadoEncontrado) {
        setEstadoId(estadoEncontrado.id);
        setMunicipioId('');
        listarMunicipios(estadoEncontrado.id).then((municipiosData) => {
          setMunicipios(municipiosData);
          const municipioEncontrado = municipiosData.find((m) => m.nombre === direccion.ciudad);
          if (municipioEncontrado) {
            setMunicipioId(municipioEncontrado.id);
          }
        });
      }
    },
    [estados],
  );

  function toggleDia(dia: number, activo: boolean) {
    setHorarios((prev) =>
      prev.map((h, i) => (i === dia ? (activo ? { diaSemana: dia, horaApertura: '08:00', horaCierre: '20:00' } : null) : h)),
    );
  }

  function actualizarHora(dia: number, campo: 'horaApertura' | 'horaCierre', valor: string) {
    setHorarios((prev) => prev.map((h, i) => (i === dia && h ? { ...h, [campo]: valor } : h)));
  }

  function agregarRecurso() {
    const disponible = tiposRecursoCatalogo.find((t) => !recursos.some((m) => m.tipoRecursoId === t.id));
    if (!disponible) return;
    setRecursos((prev) => [...prev, { tipoRecursoId: disponible.id, cantidad: 1 }]);
  }

  function actualizarRecurso(indice: number, cambios: Partial<RecursoItem>) {
    setRecursos((prev) => prev.map((m, i) => (i === indice ? { ...m, ...cambios } : m)));
  }

  function quitarRecurso(indice: number) {
    setRecursos((prev) => prev.filter((_, i) => i !== indice));
  }

  function errorDelPaso(paso: number): string | null {
    if (paso === 0) {
      if (!nombre.trim()) return 'Ingresa el nombre del salón.';
      if (!telefono.trim()) return 'Ingresa el teléfono de atención.';
      if (!calle.trim()) return 'Ingresa la calle.';
      if (!colonia.trim()) return 'Ingresa la colonia.';
      if (!codigoPostal.trim()) return 'Ingresa el código postal.';
      if (estadoId === '' || municipioId === '') return 'Selecciona estado y municipio.';
      if (tieneGoogleMapsConfigurado() && !ubicacionConfirmada) {
        return 'Confirma la ubicación en el mapa antes de continuar.';
      }
      return null;
    }
    if (paso === 1) {
      return tipoActividadIds.length === 0 ? 'Selecciona al menos una actividad.' : null;
    }
    if (paso === 2) {
      // Al editar, este paso es solo lectura (los horarios se administran desde la pantalla de
      // horarios del salón, §27.3.1): un salón cerrado los 7 días es un estado legítimo y no debe
      // bloquear guardar el resto de sus datos.
      if (salon) return null;
      return horarios.every((h) => h === null) ? 'Activa al menos un día de atención.' : null;
    }
    if (paso === 3) {
      const idsUnicos = new Set(recursos.map((m) => m.tipoRecursoId));
      return idsUnicos.size !== recursos.length ? 'No repitas la misma categoría de equipamiento; ajusta la cantidad en su lugar.' : null;
    }
    return null;
  }

  function irAlSiguientePaso() {
    const mensaje = errorDelPaso(pasoActivo);
    if (mensaje) {
      mostrarError(mensaje);
      return;
    }
    setError(null);
    setPasoActivo((paso) => paso + 1);
  }

  function irAlPasoAnterior() {
    setError(null);
    setPasoActivo((paso) => paso - 1);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (guardando) return;
    // Salvaguarda: pase lo que pase (Enter, un click perdido, etc.), este
    // formulario solo debe guardar de verdad si ya estamos en el ultimo paso.
    // Antes de eso, un envio del <form> se trata como "Siguiente".
    if (pasoActivo < PASOS.length - 1) {
      irAlSiguientePaso();
      return;
    }
    setError(null);
    for (let paso = 0; paso <= 3; paso++) {
      const mensaje = errorDelPaso(paso);
      if (mensaje) {
        setPasoActivo(paso);
        mostrarError(mensaje);
        return;
      }
    }
    if (estadoId === '' || municipioId === '') return;
    setGuardando(true);
    try {
      const request = {
        nombre,
        estadoId,
        municipioId,
        telefono: telefono || null,
        calle: calle || null,
        numeroExterior: numeroExterior || null,
        numeroInterior: numeroInterior || null,
        colonia: colonia || null,
        codigoPostal: codigoPostal || null,
        referencias: referencias || null,
        direccionCompleta,
        latitud,
        longitud,
        tipoActividadIds,
        // En modo EDITAR nunca se reenvía el snapshot de horarios cargado al abrir el diálogo: los
        // horarios se administran vía versionado (§27.3.2), y `horarios: null` es la vía existente
        // en el backend para "no toques HorarioOperacion" (validarHorariosSinCambios).
        horarios: salon ? null : horarios.filter((h): h is HorarioOperacionRequest => h !== null),
        recursos,
      };
      const resultado = salon ? await actualizarSalon(salon.id, request) : await crearSalon(request);
      onGuardado(resultado);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo guardar el salón.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
    <Dialog
      open={abierto}
      onClose={(_, razon) => {
        if (razon !== 'backdropClick') onCerrar();
      }}
      fullWidth
      maxWidth="md"
      disableEnforceFocus
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          // Evita el envio implicito del <form> al presionar Enter en cualquier
          // campo (ej. los de hora): solo se guarda con el boton "Guardar salon".
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{salon ? 'Editar salón' : 'Nuevo salón'}</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
        <Box ref={contenidoRef} sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, maxHeight: '70vh', overflowY: 'auto' }}>
          <Stepper activeStep={pasoActivo} alternativeLabel>
            {PASOS.map((etiqueta) => (
              <Step key={etiqueta}>
                <StepLabel>{etiqueta}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error">{error}</Alert>}

          {pasoActivo === 0 && (
          <>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Datos generales</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Nombre del salón" value={nombre} onChange={(e) => setNombre(e.target.value)} required fullWidth autoFocus />
              <TextField
                label="Teléfono de atención"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                fullWidth
                sx={{ maxWidth: 220 }}
              />
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="subtitle2">Ubicación</Typography>

            {tieneGoogleMapsConfigurado() ? (
              <AutocompletadoDireccion onSeleccionar={manejarDireccionSeleccionada} valorInicial={direccionCompleta ?? undefined} />
            ) : (
              <Alert severity="info">
                Configura VITE_GOOGLE_MAPS_API_KEY para buscar la dirección automáticamente. Mientras tanto, llena los
                campos manualmente.
              </Alert>
            )}

            <Stack direction="row" spacing={2}>
              <TextField label="Calle" value={calle} onChange={(e) => setCalle(e.target.value)} required fullWidth />
              <TextField
                label="Número ext."
                value={numeroExterior}
                onChange={(e) => setNumeroExterior(e.target.value)}
                sx={{ width: 140 }}
              />
              <TextField
                label="Número int."
                value={numeroInterior}
                onChange={(e) => setNumeroInterior(e.target.value)}
                sx={{ width: 140 }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField label="Colonia" value={colonia} onChange={(e) => setColonia(e.target.value)} required fullWidth />
              <TextField
                label="Código postal"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                required
                sx={{ width: 160 }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Estado"
                value={estadoId}
                onChange={(e) => {
                  setEstadoId(Number(e.target.value));
                  setMunicipioId('');
                }}
                required
                fullWidth
              >
                {estados.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.nombre}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Municipio"
                value={municipioId}
                onChange={(e) => setMunicipioId(Number(e.target.value))}
                required
                fullWidth
                disabled={municipios.length === 0}
              >
                {municipios.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Referencias (opcional)"
              placeholder="Ej. entre calle X y Y, frente al parque..."
              value={referencias}
              onChange={(e) => setReferencias(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />

            {tieneGoogleMapsConfigurado() && (
              <>
                <MapaInteractivo
                  latitud={latitud ?? CENTRO_QUERETARO.lat}
                  longitud={longitud ?? CENTRO_QUERETARO.lng}
                  zoom={latitud !== null ? 17 : 12}
                  onMover={(lat, lng) => {
                    setLatitud(lat);
                    setLongitud(lng);
                    setUbicacionConfirmada(false);
                  }}
                />
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Button
                    type="button"
                    variant={ubicacionConfirmada ? 'outlined' : 'contained'}
                    color={ubicacionConfirmada ? 'success' : 'primary'}
                    startIcon={ubicacionConfirmada ? <CheckCircleIcon /> : undefined}
                    disabled={latitud === null}
                    onClick={() => setUbicacionConfirmada(true)}
                  >
                    {ubicacionConfirmada ? 'Ubicación confirmada' : 'Confirmar ubicación'}
                  </Button>
                  {!ubicacionConfirmada && (
                    <Typography variant="caption" color="text.secondary">
                      Verifica que el marcador esté en el punto exacto antes de confirmar.
                    </Typography>
                  )}
                </Stack>
              </>
            )}
          </Stack>
          </>
          )}

          {pasoActivo === 1 && (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">Tipos de actividad que se ofrecen</Typography>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Buscar nuevas actividades del catálogo">
                  <IconButton type="button" size="small" onClick={refrescarTiposActividad}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button type="button" size="small" startIcon={<AddIcon />} onClick={() => setDialogoNuevaActividad(true)}>
                  Nueva actividad
                </Button>
              </Stack>
            </Stack>
            <SelectorMultipleBusqueda
              label="Actividades"
              opciones={tiposActividadCatalogo.map((tipo) => ({ id: tipo.id, etiqueta: tipo.nombre, descripcion: tipo.descripcion }))}
              valor={tipoActividadIds}
              onChange={setTipoActividadIds}
            />
          </Stack>
          )}

          {pasoActivo === 2 && (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Horario de atención</Typography>
            {salon ? (
              <>
                <Alert severity="info" icon={<ScheduleIcon fontSize="small" />}>
                  Los horarios se administran desde la pantalla de horarios del salón, con vigencia por
                  fecha. Aquí solo se muestra el horario vigente hoy.
                </Alert>
                {DIAS.map((dia, i) => {
                  const horario = horarios[i];
                  return (
                    <Stack key={dia} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ width: 160 }}>
                        {dia}
                      </Typography>
                      <Typography variant="body2" color={horario ? 'text.primary' : 'text.secondary'}>
                        {horario ? `${horario.horaApertura} – ${horario.horaCierre}` : 'Cerrado'}
                      </Typography>
                    </Stack>
                  );
                })}
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<ScheduleIcon fontSize="small" />}
                  sx={{ alignSelf: 'flex-start' }}
                  onClick={() => {
                    onCerrar();
                    navigate(`/salones/${salon.id}/horarios`);
                  }}
                >
                  Ir a horarios del salón
                </Button>
              </>
            ) : (
              DIAS.map((dia, i) => {
                const horario = horarios[i];
                return (
                  <Stack key={dia} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <FormControlLabel
                      sx={{ width: 160 }}
                      control={<Switch checked={horario !== null} onChange={(e) => toggleDia(i, e.target.checked)} size="small" />}
                      label={dia}
                    />
                    {horario ? (
                      <>
                        <TextField
                          type="time"
                          size="small"
                          label="Abre"
                          value={horario.horaApertura}
                          onChange={(e) => actualizarHora(i, 'horaApertura', e.target.value)}
                        />
                        <TextField
                          type="time"
                          size="small"
                          label="Cierra"
                          value={horario.horaCierre}
                          onChange={(e) => actualizarHora(i, 'horaCierre', e.target.value)}
                        />
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Cerrado
                      </Typography>
                    )}
                  </Stack>
                );
              })
            )}
          </Stack>
          )}

          {pasoActivo === 3 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2">Equipamiento del salón</Typography>
                <Typography variant="caption" color="text.secondary">
                  Opcional: cuánto equipamiento de cada categoría tiene este salón.
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Buscar nuevas categorías del catálogo">
                  <IconButton type="button" size="small" onClick={refrescarTiposRecurso}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button type="button" size="small" startIcon={<AddIcon />} onClick={() => setDialogoNuevaRecurso(true)}>
                  Nueva categoría
                </Button>
              </Stack>
            </Stack>

            {recursos.map((recurso, indice) => {
              const idsUsadosEnOtrasFilas = new Set(
                recursos.filter((_, i) => i !== indice).map((m) => m.tipoRecursoId),
              );
              const opcionesDisponibles = tiposRecursoCatalogo.filter(
                (tipo) => tipo.id === recurso.tipoRecursoId || !idsUsadosEnOtrasFilas.has(tipo.id),
              );
              return (
              <Stack key={indice} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <TextField
                  select
                  label="Tipo de equipamiento"
                  size="small"
                  value={recurso.tipoRecursoId}
                  onChange={(e) => actualizarRecurso(indice, { tipoRecursoId: e.target.value })}
                  fullWidth
                >
                  {opcionesDisponibles.map((tipo) => (
                    <MenuItem key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Cantidad"
                  type="number"
                  size="small"
                  value={recurso.cantidad}
                  onChange={(e) => actualizarRecurso(indice, { cantidad: Number(e.target.value) })}
                  sx={{ width: 120 }}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
                <IconButton type="button" size="small" onClick={() => quitarRecurso(indice)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
              );
            })}

            <Button
              type="button"
              size="small"
              startIcon={<AddIcon />}
              onClick={agregarRecurso}
              disabled={recursos.length >= tiposRecursoCatalogo.length}
              sx={{ alignSelf: 'flex-start' }}
            >
              Agregar equipamiento
            </Button>
          </Stack>
          )}
        </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" onClick={onCerrar}>Cancelar</Button>
          {pasoActivo > 0 && <Button type="button" onClick={irAlPasoAnterior}>Atrás</Button>}
          {pasoActivo < PASOS.length - 1 ? (
            <Button key="siguiente" type="button" variant="contained" onClick={irAlSiguientePaso}>
              Siguiente
            </Button>
          ) : (
            // La key distinta evita que React reutilice el mismo nodo del DOM:
            // si solo cambiara type a "submit" a mitad del clic en "Siguiente",
            // el navegador dispararia el submit del formulario y guardaria.
            <Button key="guardar" type="submit" variant="contained" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar salón'}
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>

    <DialogoNuevoCatalogoItem
      abierto={dialogoNuevaActividad}
      titulo="Nueva actividad"
      onCerrar={() => setDialogoNuevaActividad(false)}
      onCrear={(nombreNuevo, descripcionNueva) => crearTipoActividad({ nombre: nombreNuevo, descripcion: descripcionNueva })}
      onCreado={refrescarTiposActividad}
    />

    <DialogoNuevoCatalogoItem
      abierto={dialogoNuevaRecurso}
      titulo="Nueva categoría de equipamiento"
      onCerrar={() => setDialogoNuevaRecurso(false)}
      onCrear={(nombreNuevo, descripcionNueva) => crearTipoRecurso({ nombre: nombreNuevo, descripcion: descripcionNueva })}
      onCreado={refrescarTiposRecurso}
    />
    </>
  );
}
