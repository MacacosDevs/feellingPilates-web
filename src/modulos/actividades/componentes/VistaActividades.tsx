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
import { DataTable } from '../../../components/DataTable';
import type { ControlActividades } from '../hooks/useControlActividades';

export function VistaActividades({ control }: { control: ControlActividades }) {
  const {
    puedeLeer,
    mensajeSinPermiso,
    puedeGestionar,
    setDialogoNuevo,
    formularioVacio,
    columnas,
    tabla,
    cargando,
    recursosPorActividad,
    formularioDesde,
    abrirRecursos,
    desactivar,
    dialogoNuevo,
    errorNuevo,
    guardarNuevaActividad,
    guardandoNuevo,
    separarEtiquetas,
    actividadRecursos,
    setActividadRecursos,
    errorRecursos,
    filasRecurso,
    tiposRecurso,
    actualizarFilaRecurso,
    quitarFilaRecurso,
    agregarFilaRecurso,
    nuevoTipoRecurso,
    setNuevoTipoRecurso,
    crearNuevoTipoRecurso,
    guardarRecursos,
    guardandoRecursos,
    feedback,
    setFeedback,
  } = control;

  if (!puedeLeer) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
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
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
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
            <TableRow hover>
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
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
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
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
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
