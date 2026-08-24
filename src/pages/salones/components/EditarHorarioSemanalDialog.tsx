import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import { isAxiosError } from 'axios';
import { actualizarSalon } from '../../../api/salones';
import type { ApiErrorBody, HorarioOperacionRequest, SalonDetalleResponse } from '../../../api/types';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface Props {
  salon: SalonDetalleResponse;
  open: boolean;
  onClose: () => void;
  onGuardado: (salon: SalonDetalleResponse) => void;
}

export function EditarHorarioSemanalDialog({ salon, open, onClose, onGuardado }: Props) {
  const [horarios, setHorarios] = useState<(HorarioOperacionRequest | null)[]>(DIAS.map(() => null));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const nuevos: (HorarioOperacionRequest | null)[] = DIAS.map(() => null);
    salon.horarios.forEach((h) => {
      nuevos[h.diaSemana] = { diaSemana: h.diaSemana, horaApertura: h.horaApertura.slice(0, 5), horaCierre: h.horaCierre.slice(0, 5) };
    });
    setHorarios(nuevos);
    setError(null);
  }, [open, salon]);

  function toggleDia(dia: number, activo: boolean) {
    setHorarios((prev) =>
      prev.map((h, i) => (i === dia ? (activo ? { diaSemana: dia, horaApertura: '08:00', horaCierre: '20:00' } : null) : h)),
    );
  }

  function actualizarHora(dia: number, campo: 'horaApertura' | 'horaCierre', valor: string) {
    setHorarios((prev) => prev.map((h, i) => (i === dia && h ? { ...h, [campo]: valor } : h)));
  }

  async function guardar() {
    setError(null);
    const nuevosHorarios = horarios.filter((h): h is HorarioOperacionRequest => h !== null);
    for (const h of nuevosHorarios) {
      if (h.horaCierre <= h.horaApertura) {
        setError(`El horario de ${DIAS[h.diaSemana]} debe cerrar después de abrir.`);
        return;
      }
    }

    setGuardando(true);
    try {
      const actualizado = await actualizarSalon(salon.id, {
        nombre: salon.nombre,
        estadoId: salon.estadoId,
        municipioId: salon.municipioId,
        telefono: salon.telefono,
        calle: salon.calle,
        numeroExterior: salon.numeroExterior,
        numeroInterior: salon.numeroInterior,
        colonia: salon.colonia,
        codigoPostal: salon.codigoPostal,
        referencias: salon.referencias,
        direccionCompleta: salon.direccionCompleta,
        latitud: salon.latitud,
        longitud: salon.longitud,
        tipoActividadIds: salon.tiposActividad.map((t) => t.id),
        horarios: nuevosHorarios,
        recursos: salon.recursos.map((m) => ({ tipoRecursoId: m.tipoRecursoId, cantidad: m.cantidad })),
      });
      onGuardado(actualizado);
      onClose();
    } catch (err) {
      setError(isAxiosError<ApiErrorBody>(err) ? err.response?.data?.message ?? 'No se pudo guardar el horario.' : 'Ocurrió un error inesperado.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScheduleIcon color="secondary" fontSize="small" />
        Horarios de {salon.nombre}
        <IconButton onClick={onClose} size="small" sx={{ ml: 'auto' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Horario base que se repite cada semana. Los días cerrados o con horario especial en una fecha
            puntual no se modifican con este cambio.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {DIAS.map((dia, i) => {
            const horario = horarios[i];
            return (
              <Stack key={dia} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <FormControlLabel
                  sx={{ width: 140 }}
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
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      type="time"
                      size="small"
                      label="Cierra"
                      value={horario.horaCierre}
                      onChange={(e) => actualizarHora(i, 'horaCierre', e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Cerrado
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar horario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
