import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface DialogoContrasenaTemporalProps {
  datos: { correo: string; contrasenaTemporal: string } | null;
  onCerrar: () => void;
}

export function DialogoContrasenaTemporal({ datos, onCerrar }: DialogoContrasenaTemporalProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!datos) return;
    await navigator.clipboard.writeText(datos.contrasenaTemporal);
    setCopiado(true);
  }

  return (
    <Dialog open={datos !== null} onClose={onCerrar} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Usuario creado</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="warning">
          Comparte esta contraseña temporal con {datos?.correo} por un medio seguro. No podrás verla de nuevo.
        </Alert>
        <Box
          sx={{
            fontFamily: 'monospace',
            fontSize: 20,
            fontWeight: 700,
            textAlign: 'center',
            backgroundColor: '#fafafa',
            border: '1px solid #e8e8ea',
            borderRadius: 2,
            py: 2,
          }}
        >
          {datos?.contrasenaTemporal}
        </Box>
        {copiado && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Copiado al portapapeles
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={copiar}>Copiar</Button>
        <Button variant="contained" onClick={onCerrar}>
          Listo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
