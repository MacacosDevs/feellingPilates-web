import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { isAxiosError } from 'axios';
import { crearCliente } from '../../api/usuariosAdmin';
import type { ApiErrorBody, UsuarioResponse } from '../../api/types';

interface DialogoCrearClienteProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: (usuario: UsuarioResponse) => void;
}

export function DialogoCrearCliente({ abierto, onCerrar, onCreado }: DialogoCrearClienteProps) {
  const [correo, setCorreo] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function limpiarYCerrar() {
    setCorreo('');
    setNombre('');
    setTelefono('');
    setError(null);
    onCerrar();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const usuario = await crearCliente({ correo, nombre, telefono: telefono || undefined });
      onCreado(usuario);
      limpiarYCerrar();
    } catch (err) {
      if (isAxiosError<ApiErrorBody>(err)) {
        setError(err.response?.data?.message ?? 'No se pudo dar de alta al cliente.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <Dialog open={abierto} onClose={limpiarYCerrar} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Nuevo cliente</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            fullWidth
            helperText="Se le enviará un correo para que asigne su contraseña"
          />
          <TextField
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={limpiarYCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={cargando}>
            {cargando ? 'Creando...' : 'Crear cliente'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
