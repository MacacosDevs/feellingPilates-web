import { Box, Typography } from '@mui/material';

export function ReservasListaEspera() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Lista de espera
      </Typography>
      <Typography color="text.secondary">Próximamente.</Typography>
    </Box>
  );
}
