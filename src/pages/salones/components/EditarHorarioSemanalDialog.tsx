import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import { cerrarHorarioSalon, obtenerHistorialHorarios, versionarHorarioSalon } from '../../../api/salones';
import type { HorarioOperacionVersionResponse, SalonDetalleResponse } from '../../../api/types';
import { aIso, hoyIso } from '../fechas';
import { CODIGOS_REQUIEREN_REFRESCO_HISTORIAL, codigoDeError, mensajeDeErrorHorario } from '../erroresHorario';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type Vista = { tipo: 'lista' } | { tipo: 'versionar'; dia: number } | { tipo: 'cerrar'; dia: number };

interface Props {
  salon: SalonDetalleResponse;
  open: boolean;
  onClose: () => void;
  onAplicado: () => Promise<void>;
  onExito: (mensaje: string) => void;
}

function sumarUnDia(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  return aIso(new Date(y, m - 1, d + 1));
}

function formatearFechaLegible(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

type EstadoVersion = 'vigente' | 'programada' | 'pasada';

function estadoDeVersion(v: HorarioOperacionVersionResponse, hoy: string): EstadoVersion {
  if (v.vigenteDesde !== null && v.vigenteDesde > hoy) return 'programada';
  if (v.vigenteHasta !== null && v.vigenteHasta < hoy) return 'pasada';
  return 'vigente';
}

type FilaHistorial = { tipo: 'version'; version: HorarioOperacionVersionResponse } | { tipo: 'gap' };

function construirFilasConGaps(versiones: HorarioOperacionVersionResponse[]): FilaHistorial[] {
  const filas: FilaHistorial[] = [];
  versiones.forEach((v, i) => {
    filas.push({ tipo: 'version', version: v });
    if (v.vigenteHasta !== null) {
      const siguiente = versiones[i + 1];
      const inicioEsperado = sumarUnDia(v.vigenteHasta);
      if (!siguiente || siguiente.vigenteDesde !== inicioEsperado) {
        filas.push({ tipo: 'gap' });
      }
    }
  });
  return filas;
}

export function EditarHorarioSemanalDialog({ salon, open, onClose, onAplicado, onExito }: Props) {
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const [historial, setHistorial] = useState<HorarioOperacionVersionResponse[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [diaExpandido, setDiaExpandido] = useState<number | null>(null);
  const [horaApertura, setHoraApertura] = useState('08:00');
  const [horaCierre, setHoraCierre] = useState('20:00');
  const [efectivoDesde, setEfectivoDesde] = useState(hoyIso());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const hoy = hoyIso();

  function cargarHistorial() {
    setCargandoHistorial(true);
    return obtenerHistorialHorarios(salon.id)
      .then(setHistorial)
      .finally(() => setCargandoHistorial(false));
  }

  useEffect(() => {
    if (!open) return;
    setVista({ tipo: 'lista' });
    setDiaExpandido(null);
    setError(null);
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, salon.id]);

  function historialDelDia(dia: number): HorarioOperacionVersionResponse[] {
    return historial.filter((v) => v.diaSemana === dia);
  }

  function proximaVersionFutura(dia: number): HorarioOperacionVersionResponse | null {
    const futuras = historialDelDia(dia).filter((v) => v.vigenteDesde !== null && v.vigenteDesde > hoy);
    return futuras.length > 0 ? futuras[0] : null;
  }

  function horarioVigenteDelDia(dia: number): { horaApertura: string; horaCierre: string } | null {
    const h = salon.horarios.find((x) => x.diaSemana === dia);
    return h ? { horaApertura: h.horaApertura.slice(0, 5), horaCierre: h.horaCierre.slice(0, 5) } : null;
  }

  function abrirVersionar(dia: number) {
    const vigente = horarioVigenteDelDia(dia);
    setHoraApertura(vigente?.horaApertura ?? '08:00');
    setHoraCierre(vigente?.horaCierre ?? '20:00');
    setEfectivoDesde(hoy);
    setError(null);
    setVista({ tipo: 'versionar', dia });
  }

  function abrirCerrar(dia: number) {
    setEfectivoDesde(hoy);
    setError(null);
    setVista({ tipo: 'cerrar', dia });
  }

  function volverALista() {
    setError(null);
    setVista({ tipo: 'lista' });
  }

  async function despuesDeExito(mensajeExito: string) {
    await onAplicado();
    await cargarHistorial();
    setVista({ tipo: 'lista' });
    onExito(mensajeExito);
  }

  function mensajeSegunFecha(): string {
    return efectivoDesde === hoy ? 'Horario actualizado.' : `Cambio programado para el ${formatearFechaLegible(efectivoDesde)}.`;
  }

  async function guardarVersionar(dia: number) {
    setError(null);
    if (horaCierre <= horaApertura) {
      setError('El horario de cierre debe ser posterior al de apertura.');
      return;
    }
    if (!efectivoDesde) {
      setError('Selecciona la fecha a partir de la cual aplica el cambio.');
      return;
    }
    setGuardando(true);
    try {
      await versionarHorarioSalon(salon.id, { diaSemana: dia, efectivoDesde, horaApertura, horaCierre });
      await despuesDeExito(mensajeSegunFecha());
    } catch (err) {
      const codigo = codigoDeError(err);
      if (codigo && CODIGOS_REQUIEREN_REFRESCO_HISTORIAL.has(codigo)) {
        await cargarHistorial();
      }
      setError(mensajeDeErrorHorario(err, 'No se pudo guardar el horario.'));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCerrar(dia: number) {
    setError(null);
    if (!efectivoDesde) {
      setError('Selecciona la fecha a partir de la cual el día deja de operar.');
      return;
    }
    setGuardando(true);
    try {
      await cerrarHorarioSalon(salon.id, { diaSemana: dia, efectivoDesde });
      await despuesDeExito(mensajeSegunFecha());
    } catch (err) {
      const codigo = codigoDeError(err);
      if (codigo && CODIGOS_REQUIEREN_REFRESCO_HISTORIAL.has(codigo)) {
        await cargarHistorial();
      }
      setError(mensajeDeErrorHorario(err, 'No se pudo cerrar el día.'));
    } finally {
      setGuardando(false);
    }
  }

  function renderHistorialDia(dia: number) {
    const filas = construirFilasConGaps(historialDelDia(dia));
    if (filas.length === 0) {
      return (
        <Typography variant="caption" color="text.secondary">
          Sin historial registrado para este día.
        </Typography>
      );
    }
    return (
      <Stack spacing={0.75} sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
        {filas.map((fila, i) =>
          fila.tipo === 'gap' ? (
            <Typography key={`gap-${i}`} variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Cerrado
            </Typography>
          ) : (
            <Stack key={`v-${i}`} direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2">
                {fila.version.horaApertura.slice(0, 5)} – {fila.version.horaCierre.slice(0, 5)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fila.version.vigenteDesde === null ? 'Desde el inicio' : formatearFechaLegible(fila.version.vigenteDesde)}
                {' — '}
                {fila.version.vigenteHasta === null ? 'Sin fecha de fin' : formatearFechaLegible(fila.version.vigenteHasta)}
              </Typography>
              {estadoDeVersion(fila.version, hoy) === 'vigente' && <Chip size="small" color="success" label="Vigente" />}
              {estadoDeVersion(fila.version, hoy) === 'programada' && <Chip size="small" color="info" label="Programada" />}
            </Stack>
          ),
        )}
      </Stack>
    );
  }

  const dialogTitulo =
    vista.tipo === 'lista' ? `Horarios de ${salon.nombre}` : `${DIAS[vista.dia]} — ${vista.tipo === 'versionar' ? 'Cambiar horario' : 'Dejar de operar'}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScheduleIcon color="secondary" fontSize="small" />
        {dialogTitulo}
        <IconButton onClick={onClose} size="small" sx={{ ml: 'auto' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {vista.tipo === 'lista' && (
            <>
              <Typography variant="caption" color="text.secondary">
                Horario vigente hoy de cada día. Consulta el historial para ver cambios programados o pasados.
              </Typography>
              {DIAS.map((dia, i) => {
                const vigente = horarioVigenteDelDia(i);
                const futura = proximaVersionFutura(i);
                const expandido = diaExpandido === i;
                return (
                  <Box key={dia} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ width: 100, fontWeight: 600 }}>
                        {dia}
                      </Typography>
                      <Typography variant="body2" color={vigente ? 'text.primary' : 'text.secondary'} sx={{ flexGrow: 1 }}>
                        {vigente ? `${vigente.horaApertura} – ${vigente.horaCierre}` : 'Cerrado'}
                      </Typography>
                      <Button size="small" onClick={() => setDiaExpandido(expandido ? null : i)} endIcon={expandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
                        Historial
                      </Button>
                    </Stack>
                    {futura && (
                      <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                        Cambio programado para el {formatearFechaLegible(futura.vigenteDesde as string)}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {vigente ? (
                        <>
                          <Button size="small" variant="outlined" onClick={() => abrirVersionar(i)}>
                            Cambiar horario
                          </Button>
                          <Button size="small" color="error" variant="outlined" onClick={() => abrirCerrar(i)}>
                            Dejar de operar
                          </Button>
                        </>
                      ) : (
                        <Button size="small" variant="outlined" onClick={() => abrirVersionar(i)}>
                          Abrir este día
                        </Button>
                      )}
                    </Stack>
                    <Collapse in={expandido}>
                      <Box sx={{ mt: 1.5 }}>{cargandoHistorial ? <Typography variant="caption">Cargando…</Typography> : renderHistorialDia(i)}</Box>
                    </Collapse>
                  </Box>
                );
              })}
            </>
          )}

          {vista.tipo === 'versionar' && (
            <Stack spacing={1.5}>
              {proximaVersionFutura(vista.dia) && (
                <Alert severity="warning">
                  Este día ya tiene un cambio programado para el {formatearFechaLegible(proximaVersionFutura(vista.dia)!.vigenteDesde as string)}. Sólo se
                  puede programar a partir de la última versión.
                </Alert>
              )}
              <Stack direction="row" spacing={2}>
                <TextField
                  type="time"
                  size="small"
                  label="Abre"
                  value={horaApertura}
                  onChange={(e) => setHoraApertura(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <TextField
                  type="time"
                  size="small"
                  label="Cierra"
                  value={horaCierre}
                  onChange={(e) => setHoraCierre(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              </Stack>
              <TextField
                type="date"
                size="small"
                label="Aplicar a partir de"
                value={efectivoDesde}
                onChange={(e) => setEfectivoDesde(e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: hoy } }}
                fullWidth
              />
              <Typography variant="caption" color="text.secondary">
                El cambio se aplicará a partir de esa fecha. Consulta el historial para ver la vigencia de los horarios.
              </Typography>
            </Stack>
          )}

          {vista.tipo === 'cerrar' && (
            <Stack spacing={1.5}>
              <TextField
                type="date"
                size="small"
                label="Aplicar a partir de"
                value={efectivoDesde}
                onChange={(e) => setEfectivoDesde(e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: hoy } }}
                fullWidth
              />
              <Typography variant="caption" color="text.secondary">
                El salón dejará de abrir los {DIAS[vista.dia]} a partir del {efectivoDesde ? formatearFechaLegible(efectivoDesde) : '—'}. Las fechas
                anteriores se conservan en el historial.
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {vista.tipo === 'lista' ? (
          <Button onClick={onClose}>Cerrar</Button>
        ) : (
          <>
            <Button onClick={volverALista} disabled={guardando}>
              Atrás
            </Button>
            <Button
              variant="contained"
              color={vista.tipo === 'cerrar' ? 'error' : 'primary'}
              onClick={() => (vista.tipo === 'versionar' ? guardarVersionar(vista.dia) : guardarCerrar(vista.dia))}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : vista.tipo === 'cerrar' ? 'Dejar de operar' : 'Guardar horario'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
