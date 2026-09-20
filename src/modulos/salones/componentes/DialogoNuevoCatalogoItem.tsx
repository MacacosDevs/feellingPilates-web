import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../../../api/types';

interface DialogoNuevoCatalogoItemProps {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  onCrear: (nombre: string, descripcion: string | null) => Promise<unknown>;
  onCreado: () => void;
}

export function DialogoNuevoCatalogoItem({ abierto, titulo, onCerrar, onCrear, onCreado }: DialogoNuevoCatalogoItemProps) {
  const tituloId = useId();
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
    if (guardando) return;
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
    <Dialog open={abierto} onClose={() => { if (!guardando) limpiarYCerrar(); }} aria-labelledby={tituloId} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { m: { xs: 1, sm: 4 }, width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' }, maxHeight: 'calc(100dvh - 16px)' } } }}>
      <Box component="form" onSubmit={handleSubmit} aria-busy={guardando} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <DialogTitle id={tituloId} sx={{ fontWeight: 700 }}>{titulo}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important', minHeight: 0 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required fullWidth autoFocus disabled={guardando} />
          <TextField
            label="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            fullWidth
            disabled={guardando}
            multiline
            minRows={2}
          />
        </DialogContent>
{guardando && <Box role="status" sx={{ px: 3 }}>Guardando catálogo…</Box>}
        <DialogActions sx={{ px: 3, pb: 2, flexShrink: 0 }}>
          <Button disabled={guardando} onClick={limpiarYCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={!nombre.trim() || guardando}>
            {guardando ? 'Guardando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
