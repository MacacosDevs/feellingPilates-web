import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { completarInvitacion, obtenerInvitacion } from '../api/auth';
import { setToken } from '../api/client';
import { useAuthStore } from '../auth/authStore';
import type { ApiErrorBody } from '../api/types';

export function InvitacionAceptar() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const refrescarPerfil = useAuthStore((state) => state.refrescarPerfil);

  const [nombre, setNombre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargandoInfo, setCargandoInfo] = useState(true);

  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token) return;
    obtenerInvitacion(token)
      .then((info) => setNombre(info.nombre))
      .catch(() => setError('Este enlace de invitación no es válido o ya expiró.'))
      .finally(() => setCargandoInfo(false));
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);

    if (contrasena !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      const { token: jwt } = await completarInvitacion({ token, contrasena });
      setToken(jwt);
      await refrescarPerfil();
      navigate('/');
    } catch (err) {
      if (isAxiosError<ApiErrorBody>(err)) {
        setError(err.response?.data?.message ?? 'No se pudo completar el registro.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setEnviando(false);
    }
  }

  if (cargandoInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        px: 3,
      }}
    >
      <Box sx={{ maxWidth: 420, width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Bienvenido{nombre ? `, ${nombre}` : ''}
        </Typography>
        {nombre ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Asigna tu contraseña para activar tu cuenta.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Contraseña"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                fullWidth
                helperText="Mínimo 8 caracteres"
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" size="large" disabled={enviando}>
                {enviando ? 'Guardando...' : 'Activar cuenta'}
              </Button>
            </Box>
          </>
        ) : (
          <Alert severity="error">{error}</Alert>
        )}
      </Box>
    </Box>
  );
}
