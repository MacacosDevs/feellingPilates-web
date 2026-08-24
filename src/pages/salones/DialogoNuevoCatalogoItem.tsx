import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../../api/types';

interface DialogoNuevoCatalogoItemProps {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  onCrear: (nombre: string, descripcion: string | null) => Promise<unknown>;
  onCreado: () => void;
}

export function DialogoNuevoCatalogoItem({ abierto, titulo, onCerrar, onCrear, onCreado }: DialogoNuevoCatalogoItemProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function limpiarYCerrar() {
    setNombre('');
    setDescripcion('');
    setError(null);
    onCerrar();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await onCrear(nombre.trim(), descripcion.trim() || null);
      onCreado();
      limpiarYCerrar();
    } catch (err) {
      setError(isAxiosError<ApiErrorBody>(err) ? err.response?.data?.message ?? 'No se pudo crear.' : 'Ocurrió un error inesperado.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={abierto} onClose={limpiarYCerrar} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{titulo}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required fullWidth autoFocus />
          <TextField
            label="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={limpiarYCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={!nombre.trim() || guardando}>
            {guardando ? 'Guardando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
