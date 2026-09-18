import type { ReactNode } from 'react';
import { Stack, TextField, Typography } from '@mui/material';

interface FormularioHorarioSemanalBaseProps {
  readonly tipo: 'versionar' | 'cerrar';
  readonly efectivoDesde: string;
  readonly hoy: string;
  readonly onEfectivoDesdeChange: (value: string) => void;
  readonly leyenda: ReactNode;
}

interface FormularioHorarioSemanalVersionarProps extends FormularioHorarioSemanalBaseProps {
  readonly tipo: 'versionar';
  readonly horaApertura: string;
  readonly horaCierre: string;
  readonly onHoraAperturaChange: (value: string) => void;
  readonly onHoraCierreChange: (value: string) => void;
}

interface FormularioHorarioSemanalCerrarProps extends FormularioHorarioSemanalBaseProps {
  readonly tipo: 'cerrar';
}

export type FormularioHorarioSemanalProps = FormularioHorarioSemanalVersionarProps | FormularioHorarioSemanalCerrarProps;

export function FormularioHorarioSemanal(props: FormularioHorarioSemanalProps) {
  const { tipo, efectivoDesde, hoy, onEfectivoDesdeChange, leyenda } = props;
  return (
    <>
      {tipo === 'versionar' && (
        <>
          <Stack direction="row" spacing={2}>
            <TextField
              type="time"
              size="small"
              label="Abre"
              value={props.horaApertura}
              onChange={(e) => props.onHoraAperturaChange(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              type="time"
              size="small"
              label="Cierra"
              value={props.horaCierre}
              onChange={(e) => props.onHoraCierreChange(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
          <TextField
            type="date"
            size="small"
            label="Aplicar a partir de"
            value={efectivoDesde}
            onChange={(e) => onEfectivoDesdeChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: hoy } }}
            fullWidth
          />
          <Typography variant="caption" color="text.secondary">
            {leyenda}
          </Typography>
        </>
      )}

      {tipo === 'cerrar' && (
        <>
          <TextField
            type="date"
            size="small"
            label="Aplicar a partir de"
            value={efectivoDesde}
            onChange={(e) => onEfectivoDesdeChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: hoy } }}
            fullWidth
          />
          <Typography variant="caption" color="text.secondary">
            {leyenda}
          </Typography>
        </>
      )}
    </>
  );
}
