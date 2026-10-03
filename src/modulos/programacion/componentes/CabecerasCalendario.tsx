import type { KeyboardEvent, MouseEvent } from 'react';
import { Box, Chip, Tooltip, Typography, alpha } from '@mui/material';
import EditCalendarIcon from '@mui/icons-material/EditCalendarOutlined';
import LockClockIcon from '@mui/icons-material/LockClockOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunnyOutlined';

interface CabeceraCalendarioPresentacionBase {
  readonly id: number;
  readonly diaCorto: string;
  readonly diaMes: number;
  readonly mes: number;
  readonly esHoy: boolean;
  readonly tieneExcepcion: boolean;
  readonly estaCerrado: boolean;
  readonly puedeSeleccionar: boolean;
  readonly onSeleccionar: (evento: MouseEvent<HTMLElement>) => void;
}

export type CabeceraCalendarioPresentacion = CabeceraCalendarioPresentacionBase &
  (
    | { readonly tipoHorario: 'cerrado'; readonly etiquetaHorario: string }
    | { readonly tipoHorario: 'excepcion'; readonly etiquetaHorario: string }
    | {
        readonly tipoHorario: 'habitual';
        readonly horaAperturaHabitual: string;
        readonly horaCierreHabitual: string;
      }
  );

interface Props {
  readonly cabeceras: readonly CabeceraCalendarioPresentacion[];
}

export function CabecerasCalendario({ cabeceras }: Props) {
  const activarConTeclado = (evento: KeyboardEvent<HTMLElement>, cabecera: CabeceraCalendarioPresentacion) => {
    if (!cabecera.puedeSeleccionar || (evento.key !== 'Enter' && evento.key !== ' ')) return;
    evento.preventDefault();
    cabecera.onSeleccionar(evento as unknown as MouseEvent<HTMLElement>);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ width: 56, flexShrink: 0 }} />
      {cabeceras.map((cabecera) => (
        <Box
          key={cabecera.id}
          onClick={cabecera.onSeleccionar}
          onKeyDown={(evento) => activarConTeclado(evento, cabecera)}
          role={cabecera.puedeSeleccionar ? 'button' : undefined}
          tabIndex={cabecera.puedeSeleccionar ? 0 : undefined}
          aria-label={cabecera.puedeSeleccionar ? `Editar horario de ${cabecera.diaCorto} ${cabecera.diaMes}/${cabecera.mes}` : undefined}
          className="dia-header"
          sx={{
            flex: 1,
            position: 'relative',
            textAlign: 'center',
            py: 1.25,
            mx: 0.5,
            my: 0.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: cabecera.estaCerrado
              ? (t) => alpha(t.palette.error.main, 0.25)
              : cabecera.tieneExcepcion
                ? (t) => alpha(t.palette.warning.main, 0.3)
                : 'transparent',
            bgcolor: cabecera.estaCerrado
              ? (t) => alpha(t.palette.error.main, 0.06)
              : cabecera.tieneExcepcion
                ? (t) => alpha(t.palette.warning.main, 0.08)
                : cabecera.esHoy
                  ? (t) => alpha(t.palette.secondary.main, 0.08)
                  : 'transparent',
            cursor: cabecera.puedeSeleccionar ? 'pointer' : 'default',
            transition: 'background-color .15s ease, border-color .15s ease, box-shadow .15s ease',
            '&:hover': cabecera.puedeSeleccionar
              ? {
                  bgcolor: cabecera.estaCerrado
                    ? (t) => alpha(t.palette.error.main, 0.12)
                    : cabecera.tieneExcepcion
                      ? (t) => alpha(t.palette.warning.main, 0.14)
                      : (t) => alpha(t.palette.secondary.main, 0.1),
                  boxShadow: '0 1px 4px rgba(15,15,16,0.1)',
                  '& .icono-editar': { opacity: 1 },
                }
              : undefined,
            '&:focus-visible': cabecera.puedeSeleccionar
              ? { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 }
              : undefined,
          }}
        >
          {cabecera.puedeSeleccionar && (
            <Tooltip title="Editar horario de este día">
              <EditCalendarIcon
                className="icono-editar"
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  fontSize: 15,
                  color: 'text.disabled',
                  opacity: 0.55,
                  transition: 'opacity .15s ease',
                }}
              />
            </Tooltip>
          )}
          <Typography variant="subtitle2" sx={{ color: cabecera.esHoy ? 'secondary.main' : 'text.primary' }}>
            {cabecera.diaCorto} {cabecera.diaMes}/{cabecera.mes}
          </Typography>
          {cabecera.tipoHorario === 'cerrado' ? (
            <Chip
              size="small"
              icon={<LockClockIcon sx={{ fontSize: 14 }} />}
              label={cabecera.etiquetaHorario}
              color="error"
              variant="outlined"
              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
            />
          ) : cabecera.tipoHorario === 'excepcion' ? (
            <Chip
              size="small"
              icon={<WbSunnyIcon sx={{ fontSize: 14 }} />}
              label={cabecera.etiquetaHorario}
              color="warning"
              variant="outlined"
              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              {cabecera.horaAperturaHabitual}–{cabecera.horaCierreHabitual}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
