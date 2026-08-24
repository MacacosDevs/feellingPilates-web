import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Avatar, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useAuthStore } from '../auth/authStore';
import { actualizarMiPerfil } from '../api/usuarios';
import type { ApiErrorBody } from '../api/types';
import { isAxiosError } from 'axios';

export function Perfil() {
  const usuario = useAuthStore((state) => state.usuario);
  const refrescarPerfil = useAuthStore((state) => state.refrescarPerfil);
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [descripcion, setDescripcion] = useState(usuario?.descripcion ?? '');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(false);

  if (!usuario) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await actualizarMiPerfil({ nombre, telefono, descripcion });
      await refrescarPerfil();
      setGuardado(true);
    } catch (err) {
      if (isAxiosError<ApiErrorBody>(err)) {
        setError(err.response?.data?.message ?? 'No se pudo actualizar el perfil.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar src={usuario.fotoUrl ?? undefined} sx={{ width: 64, height: 64 }}>
          {usuario.nombre.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5">{usuario.nombre}</Typography>
          <Typography variant="body2" color="text.secondary">
            {usuario.correo}
          </Typography>
        </Box>
      </Box>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          fullWidth
        />
        <TextField
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        <Button type="submit" variant="contained" size="large" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </Box>
      <Snackbar
        open={guardado}
        autoHideDuration={3000}
        onClose={() => setGuardado(false)}
        message="Perfil actualizado"
      />
    </Box>
  );
}
