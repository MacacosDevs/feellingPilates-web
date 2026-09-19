import type { MouseEvent } from 'react';
import {
  Box,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EventBusyIcon from '@mui/icons-material/EventBusyOutlined';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenterOutlined';
import RestoreIcon from '@mui/icons-material/RestoreOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TuneIcon from '@mui/icons-material/TuneOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunnyOutlined';

interface Props {
  readonly variante: 'SUPERPUESTO' | 'INDEPENDIENTE';
  readonly enAjuste: boolean;
  readonly solapa: boolean;
  readonly puedeArrastrar: boolean;
  readonly mostrarAcciones: boolean;
  readonly mostrarMenuCompacto: boolean;
  readonly izquierda: string;
  readonly ancho: string;
  readonly arriba: number;
  readonly altura: number;
  readonly hora: string;
  readonly instructores: string;
  readonly mostrarInstructores: boolean;
  readonly actividades: string;
  readonly mostrarActividades: boolean;
  readonly menuAbierto: boolean;
  readonly menuAnchor: HTMLElement | null;
  readonly onMover: (evento: MouseEvent<HTMLElement>) => void;
  readonly onAjustarInicio: (evento: MouseEvent<HTMLElement>) => void;
  readonly onAjustarFin: (evento: MouseEvent<HTMLElement>) => void;
  readonly onAbrirMenu: (evento: MouseEvent<HTMLElement>) => void;
  readonly onCerrarMenu: () => void;
  readonly onEditar: (evento: MouseEvent<HTMLElement>) => void;
  readonly onEditarDesdeMenu: (evento: MouseEvent<HTMLElement>) => void;
  readonly onRestaurar?: () => void;
  readonly onRestaurarDesdeMenu?: () => void;
  readonly onCancelar?: (evento: MouseEvent<HTMLElement>) => void;
  readonly onCancelarDesdeMenu?: (evento: MouseEvent<HTMLElement>) => void;
  readonly onEliminar?: () => void;
  readonly onEliminarDesdeMenu?: () => void;
}

export function BloqueHorarioEspecialCalendario({
  variante,
  enAjuste,
  solapa,
  puedeArrastrar,
  mostrarAcciones,
  mostrarMenuCompacto,
  izquierda,
  ancho,
  arriba,
  altura,
  hora,
  instructores,
  mostrarInstructores,
  actividades,
  mostrarActividades,
  menuAbierto,
  menuAnchor,
  onMover,
  onAjustarInicio,
  onAjustarFin,
  onAbrirMenu,
  onCerrarMenu,
  onEditar,
  onEditarDesdeMenu,
  onRestaurar,
  onRestaurarDesdeMenu,
  onCancelar,
  onCancelarDesdeMenu,
  onEliminar,
  onEliminarDesdeMenu,
}: Props) {
  const superpuesto = variante === 'SUPERPUESTO';

  return (
    <Box
      onMouseDown={onMover}
      sx={{
        position: 'absolute',
        left: izquierda,
        width: ancho,
        top: arriba,
        height: altura,
        borderRadius: 1.5,
        boxShadow: solapa
          ? (t) => `0 0 0 1.5px ${t.palette.error.main}, 0 1px 3px rgba(15,15,16,0.08)`
          : '0 1px 3px rgba(15,15,16,0.08)',
        overflow: 'hidden',
        ...(superpuesto
          ? {
              border: '1px solid',
              borderColor: (t) => alpha(t.palette[solapa ? 'error' : 'warning'].main, 0.5),
              bgcolor: (t) => alpha(t.palette[solapa ? 'error' : 'warning'].main, 0.12),
              borderLeft: '3px solid',
            }
          : {
              bgcolor: (t) => alpha(t.palette[solapa ? 'error' : 'warning'].main, 0.16),
              borderLeft: '3px solid',
              borderColor: solapa ? 'error.main' : 'warning.main',
            }),
        cursor: puedeArrastrar ? 'grab' : 'default',
        display: 'flex',
        flexDirection: 'column',
        zIndex: enAjuste ? 2 : 1,
        px: 1,
        py: 0.5,
      }}
    >
      {puedeArrastrar && (
        <Box
          onMouseDown={onAjustarInicio}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
        />
      )}
      {puedeArrastrar && (
        <Box
          onMouseDown={onAjustarFin}
          sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
        />
      )}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <WbSunnyIcon sx={{ fontSize: 12, color: 'warning.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
          {hora}
        </Typography>
      </Stack>
      {mostrarInstructores && (
        <Typography variant="caption" noWrap sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
          {instructores}
        </Typography>
      )}
      {mostrarActividades && (
        <Chip
          size="small"
          icon={<FitnessCenterIcon sx={{ fontSize: 12 }} />}
          label={actividades}
          sx={
            superpuesto
              ? {
                  mt: 0.4,
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                  maxWidth: '100%',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: (t) => alpha(t.palette.warning.main, 0.4),
                  '& .MuiChip-icon': { color: 'warning.main', ml: '4px' },
                }
              : {
                  mt: 0.4,
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                  maxWidth: '100%',
                  bgcolor: 'background.paper',
                }
          }
        />
      )}
      <Box sx={{ flexGrow: 1 }} />
      {mostrarAcciones &&
        (mostrarMenuCompacto ? (
          <IconButton
            size="small"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onAbrirMenu}
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              color: 'text.secondary',
              p: 0.25,
              bgcolor: 'background.paper',
              boxShadow: '0 1px 2px rgba(15,15,16,0.2)',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <SettingsOutlinedIcon fontSize="inherit" />
          </IconButton>
        ) : (
          <Stack direction="row" spacing={0.5} sx={{ alignSelf: 'flex-end' }}>
            {onRestaurar && (
              <Tooltip title="Quitar horario especial (vuelve al horario normal)">
                <IconButton
                  size="small"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={onRestaurar}
                  sx={{ color: 'error.main', p: 0.25 }}
                >
                  <RestoreIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Editar actividades e instructores">
              <IconButton
                size="small"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onEditar}
                sx={{ color: 'text.secondary', p: 0.25 }}
              >
                <TuneIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            {onCancelar && (
              <Tooltip title="Cancelar un día puntual">
                <IconButton
                  size="small"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={onCancelar}
                  sx={{ color: 'text.secondary', p: 0.25 }}
                >
                  <EventBusyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
            {onEliminar && (
              <Tooltip title={superpuesto ? 'Eliminar bloque completo' : 'Eliminar este horario puntual'}>
                <IconButton
                  size="small"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={onEliminar}
                  sx={{ color: 'error.main', p: 0.25 }}
                >
                  <DeleteOutlineIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ))}
      <Menu
        open={menuAbierto}
        anchorEl={menuAnchor}
        onClose={onCerrarMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {onRestaurarDesdeMenu && (
          <MenuItem onClick={onRestaurarDesdeMenu}>
            <ListItemIcon>
              <RestoreIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Quitar horario especial (vuelve al horario normal)</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={onEditarDesdeMenu}>
          <ListItemIcon>
            <TuneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar actividades e instructores</ListItemText>
        </MenuItem>
        {onCancelarDesdeMenu && (
          <MenuItem onClick={onCancelarDesdeMenu}>
            <ListItemIcon>
              <EventBusyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cancelar un día puntual</ListItemText>
          </MenuItem>
        )}
        {onEliminarDesdeMenu && (
          <MenuItem onClick={onEliminarDesdeMenu}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>{superpuesto ? 'Eliminar bloque completo' : 'Eliminar este horario puntual'}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
