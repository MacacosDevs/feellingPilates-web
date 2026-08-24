import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataTable, type ColumnaTabla } from '../../components/DataTable';
import { useTablaLocal } from '../../hooks/useTablaLocal';
import { listarSalones, obtenerSalon } from '../../api/salones';
import type { SalonDetalleResponse, SalonResponse } from '../../api/types';
import { DialogoSalon } from './DialogoSalon';

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });
}

type ColumnaSalon = 'nombre' | 'ubicacion' | 'direccion' | 'creadoEn' | 'acciones';

const COLUMNAS_SALONES: ColumnaTabla<ColumnaSalon>[] = [
  { id: 'nombre', label: 'Nombre', ordenable: true },
  { id: 'ubicacion', label: 'Ubicación', ordenable: true },
  { id: 'direccion', label: 'Dirección', ordenable: true },
  { id: 'creadoEn', label: 'Fecha', ordenable: true },
  { id: 'acciones', label: 'Acciones', align: 'right' },
];

const COMPARADORES_SALONES: Record<ColumnaSalon, (a: SalonResponse, b: SalonResponse) => number> = {
  nombre: (a, b) => a.nombre.localeCompare(b.nombre),
  ubicacion: (a, b) => `${a.estadoNombre} ${a.municipioNombre}`.localeCompare(`${b.estadoNombre} ${b.municipioNombre}`),
  direccion: (a, b) => (a.direccion ?? '').localeCompare(b.direccion ?? ''),
  creadoEn: (a, b) => a.creadoEn.localeCompare(b.creadoEn),
};

interface Feedback {
  severidad: 'success' | 'error';
  texto: string;
}

export function Salones() {
  const navigate = useNavigate();
  const [salones, setSalones] = useState<SalonResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [salonEditando, setSalonEditando] = useState<SalonDetalleResponse | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function recargar() {
    setCargando(true);
    listarSalones()
      .then(setSalones)
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    recargar();
  }, []);

  async function abrirEdicion(id: string) {
    const detalle = await obtenerSalon(id);
    setSalonEditando(detalle);
    setDialogoAbierto(true);
  }

  function abrirCreacion() {
    setSalonEditando(null);
    setDialogoAbierto(true);
  }

  function handleGuardado(salon: SalonDetalleResponse) {
    setDialogoAbierto(false);
    setFeedback({ severidad: 'success', texto: `Salón ${salon.nombre} guardado` });
    recargar();
  }

  const tabla = useTablaLocal(salones, COMPARADORES_SALONES, 'nombre');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Salones</Typography>
          <Typography variant="body2" color="text.secondary">
            Sedes de Feeling Pilates: ubicación, horarios, espacios y equipo.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCreacion}>
          Nuevo salón
        </Button>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
      <DataTable
        columnas={COLUMNAS_SALONES}
        filas={tabla.filas}
        obtenerClave={(salon) => salon.id}
        cargando={cargando}
        ordenPor={tabla.orderBy}
        orden={tabla.order}
        onOrdenar={tabla.onOrdenar}
        iconoVacio={<RoomOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
        textoVacio="Aún no hay salones registrados."
        paginacion={{
          total: tabla.total,
          page: tabla.page,
          rowsPerPage: tabla.rowsPerPage,
          onPageChange: tabla.onPageChange,
          onRowsPerPageChange: tabla.onRowsPerPageChange,
        }}
        renderFila={(salon) => (
          <TableRow hover>
            <TableCell>{salon.nombre}</TableCell>
            <TableCell>
              <Chip size="small" label={`${salon.municipioNombre}, ${salon.estadoNombre}`} />
            </TableCell>
            <TableCell>{salon.direccion ?? '—'}</TableCell>
            <TableCell sx={{ color: 'text.secondary' }}>{formatearFecha(salon.creadoEn)}</TableCell>
            <TableCell align="right">
              <Tooltip title="Gestionar horarios de instructores">
                <IconButton size="small" onClick={() => navigate(`/salones/${salon.id}/horarios`)}>
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => abrirEdicion(salon.id)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        )}
      />
      </Box>

      <DialogoSalon
        abierto={dialogoAbierto}
        salon={salonEditando}
        onCerrar={() => setDialogoAbierto(false)}
        onGuardado={handleGuardado}
      />

      <Snackbar open={feedback !== null} autoHideDuration={5000} onClose={() => setFeedback(null)}>
        {feedback ? (
          <Alert severity={feedback.severidad} onClose={() => setFeedback(null)} variant="filled" sx={{ width: '100%' }}>
            {feedback.texto}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
