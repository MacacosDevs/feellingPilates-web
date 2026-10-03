import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError, isCancel } from 'axios';
import { obtenerInvitacion } from '../api/auth';
import { useAuthStore } from '../auth/authStore';
import type { ApiErrorBody } from '../api/types';

export function InvitacionAceptar() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const completarInvitacion = useAuthStore((state) => state.completarInvitacion);
  const mounted = useRef(false);
  const operation = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const [nombre, setNombre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargandoInfo, setCargandoInfo] = useState(true);

  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;
    operation.current++;
    setEnviando(false);
    setNombre(null);
    setError(null);
    setCargandoInfo(true);
    if (!token) {
      setCargandoInfo(false);
      return;
    }
    void obtenerInvitacion(token)
      .then((info) => { if (vigente) setNombre(info.nombre); })
      .catch(() => { if (vigente) setError('Este enlace de invitación no es válido o ya expiró.'); })
      .finally(() => { if (vigente) setCargandoInfo(false); });
    return () => { vigente = false; };
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);

    if (contrasena !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const propia = ++operation.current;
    const vigente = () => mounted.current && propia === operation.current;
    let cancelada = false;
    setEnviando(true);
    try {
      await completarInvitacion({ token, contrasena });
      if (vigente()) navigate('/');
    } catch (err) {
      if (isCancel(err)) {
        cancelada = true;
        if (vigente()) setEnviando(false);
        return;
      }
      if (!vigente()) return;
      if (isAxiosError<ApiErrorBody>(err)) {
        setError(err.response?.data?.message ?? 'No se pudo completar el registro.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      if (vigente() && !cancelada) setEnviando(false);
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
