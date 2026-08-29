import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import type { ApiErrorBody } from '../api/types';
import { isAxiosError } from 'axios';
import logoMark from '../assets/images/logo-mark.png';
import { publicColors } from '../theme/publicTheme';

export function Login() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
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
        setError('Ocurrió un error inesperado al iniciar sesión.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, sm: 6 },
        position: 'relative',
      }}
    >
      {/* Manchas sutiles de luz de fondo */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: { xs: 280, sm: 420 },
          height: { xs: 280, sm: 420 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${publicColors.accentSoft} 0%, rgba(169,105,79,0) 70%)`,
          filter: 'blur(30px)',
          top: '10%',
          left: '15%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: { xs: 260, sm: 380 },
          height: { xs: 260, sm: 380 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${publicColors.goldSoft} 0%, rgba(182,148,77,0) 70%)`,
          filter: 'blur(30px)',
          bottom: '15%',
          right: '15%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Tarjeta Principal de Login */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 440,
          p: { xs: 3.5, sm: 5 },
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 20px 50px -20px rgba(43, 36, 32, 0.15)',
        }}
      >
        {/* Cabecera / Marca estilo Luma */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component={NavLink}
            to="/inicio"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'rgba(196, 104, 73, 0.08)',
              p: 1.25,
              mb: 2,
              border: '1px solid',
              borderColor: publicColors.border,
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <Box component="img" src={logoMark} alt="Feeling Pilates" sx={{ height: 34, width: 'auto' }} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mb: 0.5 }}>
            <Typography sx={{ color: publicColors.sage, fontSize: '1rem', fontWeight: 800 }}>✦</Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                fontSize: { xs: '1.65rem', sm: '1.85rem' },
                color: 'text.primary',
              }}
            >
              Feeling Pilates
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', maxWidth: 320, mx: 'auto' }}>
            Bienestar y movimiento que ilumina tu día a día. Ingresa para acceder a tu portal.
          </Typography>
        </Box>

        {/* Formulario */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{
                borderRadius: 2.5,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            label="Correo electrónico"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            placeholder="tu@correo.com"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Contraseña"
            type={mostrarContrasena ? 'text' : 'password'}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            placeholder="••••••••"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setMostrarContrasena((v) => !v)}
                      edge="end"
                      size="small"
                      aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarContrasena ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={cargando}
            endIcon={cargando ? <CircularProgress size={18} color="inherit" /> : <LoginOutlinedIcon />}
            sx={{
              py: 1.35,
              mt: 1,
              fontSize: '0.95rem',
              fontWeight: 600,
              bgcolor: publicColors.accent,
              '&:hover': {
                bgcolor: publicColors.accentDark,
              },
            }}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pt: 2,
              mt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Button
              component={NavLink}
              to="/inicio"
              size="small"
              startIcon={<ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{
                color: 'text.secondary',
                fontSize: '0.85rem',
                '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
              }}
            >
              Volver a la página principal
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
