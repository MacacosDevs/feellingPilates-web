import { useRef } from 'react';
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
  Paper,
  TablePagination,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataTable, type ColumnaTabla } from '../../../components/DataTable';
import { useTablaLocal } from '../../../hooks/useTablaLocal';
import { useGestionSalones } from '../hooks/useGestionSalones';
import type { SalonResponse } from '../../../api/types';
import { DialogoSalon } from '../componentes/DialogoSalon';

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

const COMPARADORES_SALONES: Partial<Record<ColumnaSalon, (a: SalonResponse, b: SalonResponse) => number>> = {
  nombre: (a, b) => a.nombre.localeCompare(b.nombre),
  ubicacion: (a, b) => `${a.estadoNombre} ${a.municipioNombre}`.localeCompare(`${b.estadoNombre} ${b.municipioNombre}`),
  direccion: (a, b) => (a.direccion ?? '').localeCompare(b.direccion ?? ''),
  creadoEn: (a, b) => a.creadoEn.localeCompare(b.creadoEn),
};

export function Salones() {
  const navigate = useNavigate();
  const accionOrigen = useRef<HTMLButtonElement | null>(null);
  const gestion = useGestionSalones();
  const { salones, cargando, cargado, errorLista, errorDetalle, editandoId, dialogoAbierto,
    salonEditando, guardado, recargar, abrirEdicion, abrirCreacion, handleGuardado } = gestion;
  const theme = useTheme();
  const movil = useMediaQuery(theme.breakpoints.down('sm'));

  const tabla = useTablaLocal<SalonResponse, ColumnaSalon>(salones, COMPARADORES_SALONES, 'nombre');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3 }}>
        <Box>
          <Typography component="h1" variant={movil ? 'h5' : 'h4'}>Salones</Typography>
          <Typography variant="body2" color="text.secondary">
            Sedes de Feeling Pilates: ubicación, horarios, espacios y equipo.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={event => { accionOrigen.current = event.currentTarget; abrirCreacion(); }}>
          Nuevo salón
        </Button>
      </Stack>

      {errorLista && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => void recargar()} disabled={cargando}>Reintentar</Button>}>{errorLista}{cargado && ' Se conserva la última lista cargada.'}</Alert>}
      {errorDetalle && <Alert severity="error" sx={{ mb: 2 }}>{errorDetalle}</Alert>}
      {cargando && <Typography role="status" sx={{ mb: 2 }}>{cargado ? 'Actualizando salones…' : 'Cargando salones…'}</Typography>}
      {editandoId && <Typography role="status" sx={{ mb: 2 }}>Cargando salón para editar…</Typography>}
      <Box sx={{ flex: 1, minHeight: 0 }} aria-busy={cargando}>
      {movil ? (
        <Stack spacing={2}>
          {cargado && <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} aria-label="Ordenar salones">
            {COLUMNAS_SALONES.filter(c => c.ordenable).map(c => <Button key={c.id} size="small" onClick={() => tabla.onOrdenar(c.id)} aria-label={`Ordenar por ${c.label}`} aria-pressed={tabla.orderBy === c.id}>{c.label}{tabla.orderBy === c.id ? (tabla.order === 'asc' ? ' ↑' : ' ↓') : ''}</Button>)}
          </Stack>}
          {tabla.filas.map(salon => <Paper component="article" variant="outlined" key={salon.id} sx={{ p: 2, overflowWrap: 'anywhere' }} aria-label={salon.nombre}>
            <Typography component="h2" variant="h6">{salon.nombre}</Typography>
            <Typography variant="body2">Ubicación: {salon.municipioNombre}, {salon.estadoNombre}</Typography>
            <Typography variant="body2">Dirección: {salon.direccion ?? '—'}</Typography>
            <Typography variant="body2" color="text.secondary">Fecha: {formatearFecha(salon.creadoEn)}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Button size="small" startIcon={<CalendarMonthOutlinedIcon />} aria-label={`Gestionar horarios de ${salon.nombre}`} onClick={() => navigate(`/salones/${salon.id}/horarios`)}>Horarios</Button>
              <Button size="small" startIcon={<EditOutlinedIcon />} aria-label={`Editar ${salon.nombre}`} disabled={editandoId !== null} onClick={event => { accionOrigen.current = event.currentTarget; void abrirEdicion(salon.id); }}>Editar</Button>
            </Stack>
          </Paper>)}
          {cargado && !cargando && !errorLista && tabla.total === 0 && <Typography>Aún no hay salones registrados.</Typography>}
          {cargado && <TablePagination component="div" count={tabla.total} page={tabla.page} rowsPerPage={tabla.rowsPerPage} onPageChange={(_, p) => tabla.onPageChange(p)} onRowsPerPageChange={e => tabla.onRowsPerPageChange(Number(e.target.value))} rowsPerPageOptions={[10, 25, 50]} labelRowsPerPage="Filas por página" labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} sx={{ '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', px: 0 }, '& .MuiTablePagination-spacer': { display: 'none' }, '& .MuiTablePagination-selectLabel': { mr: 1 }, '& .MuiTablePagination-actions': { ml: 'auto' } }} />}
        </Stack>
      ) : (cargado || cargando) && <DataTable
        columnas={COLUMNAS_SALONES}
        filas={tabla.filas}
        obtenerClave={(salon) => salon.id}
        cargando={cargando && !cargado}
        ordenPor={tabla.orderBy}
        orden={tabla.order}
        onOrdenar={tabla.onOrdenar}
        iconoVacio={<RoomOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
        textoVacio={errorLista || cargando ? 'La lista aún no está disponible.' : 'Aún no hay salones registrados.'}
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
                <IconButton size="small" aria-label={`Gestionar horarios de ${salon.nombre}`} onClick={() => navigate(`/salones/${salon.id}/horarios`)}>
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" aria-label={`Editar ${salon.nombre}`} disabled={editandoId !== null} onClick={event => { accionOrigen.current = event.currentTarget; void abrirEdicion(salon.id); }}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        )}
      />}
      </Box>

      <DialogoSalon
        abierto={dialogoAbierto}
        salon={salonEditando}
        onCerrar={gestion.cerrarDialogo}
        onCerrado={() => { if (accionOrigen.current?.isConnected) accionOrigen.current.focus(); }}
        onGuardado={handleGuardado}
      />

      <Snackbar open={guardado !== null} autoHideDuration={5000} onClose={gestion.cerrarFeedback}>
        {guardado ? <Alert severity="success" onClose={gestion.cerrarFeedback} variant="filled" sx={{ width: '100%' }}>{guardado}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
