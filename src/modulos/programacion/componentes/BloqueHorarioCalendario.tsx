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
import GroupIcon from '@mui/icons-material/GroupOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TuneIcon from '@mui/icons-material/TuneOutlined';

interface Props {
  readonly tooltip: string;
  readonly cerrado: boolean;
  readonly enAjuste: boolean;
  readonly solapa: boolean;
  readonly puedeMoverOrecortar: boolean;
  readonly puedeCancelarDia: boolean;
  readonly puedeGestionar: boolean;
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
  readonly onCancelar: (evento: MouseEvent<HTMLElement>) => void;
  readonly onCancelarDesdeMenu: (evento: MouseEvent<HTMLElement>) => void;
  readonly onEliminar: (evento: MouseEvent<HTMLElement>) => void;
  readonly onEliminarDesdeMenu: () => void;
}

export function BloqueHorarioCalendario({
  tooltip,
  cerrado,
  enAjuste,
  solapa,
  puedeMoverOrecortar,
  puedeCancelarDia,
  puedeGestionar,
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
  onCancelar,
  onCancelarDesdeMenu,
  onEliminar,
  onEliminarDesdeMenu,
}: Props) {
  return (
    <Tooltip title={tooltip} disableHoverListener={!cerrado}>
      <Box
        onMouseDown={onMover}
        sx={{
          position: 'absolute',
          left: izquierda,
          width: ancho,
          top: arriba,
          height: altura,
          bgcolor: (t) => alpha(t.palette[enAjuste && solapa ? 'error' : 'secondary'].main, 0.12),
          borderLeft: '3px solid',
          borderColor: enAjuste && solapa ? 'error.main' : 'secondary.main',
          color: 'text.primary',
          opacity: cerrado ? 0.4 : 1,
          borderRadius: 1.5,
          boxShadow:
            enAjuste && solapa
              ? (t) => `0 0 0 1.5px ${t.palette.error.main}, 0 1px 3px rgba(15,15,16,0.08)`
              : '0 1px 3px rgba(15,15,16,0.08)',
          transition: 'box-shadow .15s ease, background-color .15s ease',
          cursor: cerrado ? 'not-allowed' : puedeMoverOrecortar ? 'grab' : 'default',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          px: 1,
          py: 0.5,
          zIndex: enAjuste ? 2 : 1,
          '&:hover': !cerrado
            ? { bgcolor: (t) => alpha(t.palette.secondary.main, 0.18), boxShadow: '0 2px 6px rgba(15,15,16,0.14)' }
            : undefined,
        }}
      >
        {puedeMoverOrecortar && (
          <Box
            onMouseDown={onAjustarInicio}
            sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
          />
        )}
        <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.3, color: 'secondary.dark' }}>
          {hora}
        </Typography>
        {mostrarInstructores && (
          <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
            <GroupIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
              {instructores}
            </Typography>
          </Stack>
        )}
        {mostrarActividades && (
          <Chip
            size="small"
            icon={<FitnessCenterIcon sx={{ fontSize: 12 }} />}
            label={actividades}
            sx={{
              mt: 0.4,
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 600,
              alignSelf: 'flex-start',
              maxWidth: '100%',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: (t) => alpha(t.palette.secondary.main, 0.35),
              '& .MuiChip-icon': { color: 'secondary.main', ml: '4px' },
            }}
          />
        )}
        <Box sx={{ flexGrow: 1 }} />
        {mostrarMenuCompacto ? (
          (puedeMoverOrecortar || puedeCancelarDia || puedeGestionar) && (
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
          )
        ) : (
          <Stack direction="row" spacing={0.5} sx={{ alignSelf: 'flex-end' }}>
            {puedeMoverOrecortar && (
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
            )}
            {puedeCancelarDia && (
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
            {puedeGestionar && (
              <Tooltip title="Eliminar bloque completo">
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
        )}
        <Menu
          open={menuAbierto}
          anchorEl={menuAnchor}
          onClose={onCerrarMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {puedeMoverOrecortar && (
            <MenuItem onClick={onEditarDesdeMenu}>
              <ListItemIcon>
                <TuneIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar actividades e instructores</ListItemText>
            </MenuItem>
          )}
          {puedeCancelarDia && (
            <MenuItem onClick={onCancelarDesdeMenu}>
              <ListItemIcon>
                <EventBusyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cancelar un día puntual</ListItemText>
            </MenuItem>
          )}
          {puedeGestionar && (
            <MenuItem onClick={onEliminarDesdeMenu}>
              <ListItemIcon>
                <DeleteOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText>Eliminar bloque completo</ListItemText>
            </MenuItem>
          )}
        </Menu>
        {puedeMoverOrecortar && (
          <Box
            onMouseDown={onAjustarFin}
            sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
          />
        )}
      </Box>
    </Tooltip>
  );
}
