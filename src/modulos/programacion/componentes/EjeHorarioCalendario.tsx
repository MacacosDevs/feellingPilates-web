import { Box, Typography } from '@mui/material';

export interface MarcaEjeHorarioPresentacion {
  readonly valor: number;
  readonly etiqueta: string;
  readonly posicionSuperior: number;
}

interface Props {
  readonly ancho: number;
  readonly altura: number;
  readonly marcas: readonly MarcaEjeHorarioPresentacion[];
}

export function EjeHorarioCalendario({ ancho, altura, marcas }: Props) {
  return (
    <Box sx={{ width: ancho, flexShrink: 0, position: 'relative', height: altura }}>
      {marcas.map((marca) => (
        <Typography
          key={marca.valor}
          variant="caption"
          color="text.secondary"
          sx={{ position: 'absolute', top: marca.posicionSuperior, right: 8 }}
        >
          {marca.etiqueta}
        </Typography>
      ))}
    </Box>
  );
}
