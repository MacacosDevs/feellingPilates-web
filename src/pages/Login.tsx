import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import type { ApiErrorBody } from '../api/types';
import { isAxiosError } from 'axios';

export function Login() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login({ correo, contrasena });
      navigate('/');
    } catch (err) {
      if (isAxiosError<ApiErrorBody>(err)) {
        setError(err.response?.data?.message ?? 'Correo o contraseña incorrectos.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 420 }}>
      <Typography variant="h4" gutterBottom>
        Iniciar sesión
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Correo"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Contraseña"
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" size="large" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </Box>
    </Box>
  );
}
