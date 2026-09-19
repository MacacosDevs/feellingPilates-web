import type { KeyboardEvent, MouseEvent } from 'react';
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
  readonly presentacionEstrecha: boolean;
  readonly nombreAccesible: string;
  readonly izquierda: string;
  readonly ancho: string;
  readonly arriba: number;
  readonly altura: number;
  readonly hora: string;
  readonly minimoInicio: number;
  readonly maximoInicio: number;
  readonly minimoFin: number;
  readonly maximoFin: number;
  readonly instructores: string;
  readonly mostrarInstructores: boolean;
  readonly actividades: string;
  readonly mostrarActividades: boolean;
  readonly menuAbierto: boolean;
  readonly menuAnchor: HTMLElement | null;
  readonly onMover: (evento: MouseEvent<HTMLElement>) => void;
  readonly onActivar: (evento: KeyboardEvent<HTMLElement>) => void;
  readonly onMoverTeclado: (minutos: number) => void;
  readonly onAjustarInicioTeclado: (minutos: number) => void;
  readonly onAjustarFinTeclado: (minutos: number) => void;
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
  presentacionEstrecha,
  nombreAccesible,
  izquierda,
  ancho,
  arriba,
  altura,
  hora,
  minimoInicio,
  maximoInicio,
  minimoFin,
  maximoFin,
  instructores,
  mostrarInstructores,
  actividades,
  mostrarActividades,
  menuAbierto,
  menuAnchor,
  onMover,
  onActivar,
  onMoverTeclado,
  onAjustarInicioTeclado,
  onAjustarFinTeclado,
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
  const manejarTeclaBloque = (evento: KeyboardEvent<HTMLElement>) => {
    if (evento.currentTarget !== evento.target) return;
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      onActivar(evento);
    } else if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
      evento.preventDefault();
      onMoverTeclado(evento.key === 'ArrowUp' ? -30 : 30);
    }
  };
  const manejarTeclaBorde = (evento: KeyboardEvent<HTMLElement>, callback: (minutos: number) => void) => {
    if (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown') return;
    evento.preventDefault();
    evento.stopPropagation();
    callback(evento.key === 'ArrowUp' ? -30 : 30);
  };
  const [horaInicio, horaFin] = hora.split('–');
  const minutosAccesibles = (valor: string) => {
    const [horas, minutos] = valor.split(':').map(Number);
    return horas * 60 + minutos;
  };

  return (
    <Box
      onMouseDown={onMover}
      role="group"
      aria-label={nombreAccesible}
      data-presentacion-estrecha={presentacionEstrecha ? 'true' : 'false'}
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
        '@media (max-width: 480px)': presentacionEstrecha
          ? {
              px: 0.25,
              py: 0.25,
              '& .detalle-bloque': {
                position: 'absolute', width: 1, height: 1, p: 0, m: -1, overflow: 'hidden',
                clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
              },
              '& .accion-compacta': { right: '50%', transform: 'translateX(50%)' },
            }
          : undefined,
      }}
    >
      {puedeArrastrar && (
        <Box
          className="accion-principal-bloque"
          role="button"
          tabIndex={0}
          aria-label={nombreAccesible}
          onKeyDown={manejarTeclaBloque}
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'none',
            '&:focus-visible': { boxShadow: 'inset 0 0 0 3px', boxShadowColor: 'primary.main' },
          }}
        />
      )}
      {puedeArrastrar && (
        <Box
          onMouseDown={onAjustarInicio}
          onKeyDown={(evento) => manejarTeclaBorde(evento, onAjustarInicioTeclado)}
          role="separator"
          tabIndex={0}
          aria-orientation="horizontal"
          aria-valuemin={minimoInicio}
          aria-valuemax={maximoInicio}
          aria-valuenow={minutosAccesibles(horaInicio)}
          aria-valuetext={`Inicio actual ${horaInicio}; Flecha arriba o abajo ajusta 30 minutos`}
          aria-label={`Ajustar inicio de ${nombreAccesible}`}
          sx={{ position: 'absolute', zIndex: 4, top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}
        />
      )}
      {puedeArrastrar && (
        <Box
          onMouseDown={onAjustarFin}
          onKeyDown={(evento) => manejarTeclaBorde(evento, onAjustarFinTeclado)}
          role="separator"
          tabIndex={0}
          aria-orientation="horizontal"
          aria-valuemin={minimoFin}
          aria-valuemax={maximoFin}
          aria-valuenow={minutosAccesibles(horaFin)}
          aria-valuetext={`Fin actual ${horaFin}; Flecha arriba o abajo ajusta 30 minutos`}
          aria-label={`Ajustar fin de ${nombreAccesible}`}
          sx={{ position: 'absolute', zIndex: 4, bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}
        />
      )}
      <Stack className="detalle-bloque" direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <WbSunnyIcon sx={{ fontSize: 12, color: 'warning.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
          {hora}
        </Typography>
      </Stack>
      {mostrarInstructores && (
        <Typography className="detalle-bloque" variant="caption" noWrap sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
          {instructores}
        </Typography>
      )}
      {mostrarActividades && (
        <Chip
          className="detalle-bloque"
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
      {mostrarAcciones && (mostrarMenuCompacto || presentacionEstrecha) && (
          <IconButton
            className="accion-compacta"
            size="small"
            aria-label={`Acciones de ${nombreAccesible}`}
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
              ...(!mostrarMenuCompacto && presentacionEstrecha
                ? { display: 'none', '@media (max-width: 480px)': { display: 'inline-flex' } }
                : {}),
            }}
          >
            <SettingsOutlinedIcon fontSize="inherit" />
          </IconButton>
        )}
      {mostrarAcciones && !mostrarMenuCompacto && (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              alignSelf: 'flex-end',
              ...(presentacionEstrecha ? { '@media (max-width: 480px)': { display: 'none' } } : {}),
            }}
          >
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
        )}
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
