import { useEffect, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { NavLink } from 'react-router-dom';
import logoMark from '../assets/images/logo-mark.png';
import { publicColors } from '../theme/publicTheme';
import { SocialLinks } from './SocialLinks';

interface EnlaceNav {
  to: string;
  etiqueta: string;
  Icono: typeof HomeOutlinedIcon;
}

const enlaces: EnlaceNav[] = [
  { to: '/inicio', etiqueta: 'Inicio', Icono: HomeOutlinedIcon },
  { to: '/contacto', etiqueta: 'Contacto', Icono: EmailOutlinedIcon },
  { to: '/terminos-y-condiciones', etiqueta: 'Términos y condiciones', Icono: GavelOutlinedIcon },
  { to: '/aviso-de-privacidad', etiqueta: 'Aviso de privacidad', Icono: SecurityOutlinedIcon },
];

const navLinkStyles = {
  position: 'relative',
  color: 'text.secondary',
  fontWeight: 500,
  fontSize: '0.92rem',
  textDecoration: 'none',
  padding: '8px 14px',
  borderRadius: 999,
  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
  '&:hover': {
    color: 'text.primary',
    backgroundColor: 'rgba(169, 105, 79, 0.07)',
  },
  '&.active': {
    color: 'primary.main',
    fontWeight: 600,
    backgroundColor: publicColors.accentSoft,
  },
} as const;

export function PublicHeader() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conScroll, setConScroll] = useState(false);

  useEffect(() => {
    function onScroll() {
      setConScroll(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        top: 0,
        zIndex: 1100,
        bgcolor: conScroll ? 'rgba(251, 247, 243, 0.88)' : 'transparent',
        backdropFilter: conScroll ? 'blur(14px)' : 'none',
        borderBottom: '1px solid',
        borderColor: conScroll ? 'rgba(237, 230, 222, 0.9)' : 'transparent',
        boxShadow: conScroll ? '0 4px 20px -10px rgba(43, 36, 32, 0.08)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
        <Toolbar disableGutters sx={{ minHeight: { xs: 68, md: 76 }, gap: 2 }}>
          {/* Logo & Marca */}
          <Box
            component={NavLink}
            to="/inicio"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(169, 105, 79, 0.08)',
                p: 0.6,
                border: '1px solid',
                borderColor: publicColors.border,
              }}
            >
              <Box component="img" src={logoMark} alt="Feeling Pilates" sx={{ height: 26, width: 'auto' }} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                component="span"
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                }}
              >
                Feeling Pilates
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'primary.main',
                }}
              >
                Boutique Studio
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Enlaces Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {enlaces.map((enlace) => (
              <Box key={enlace.to} component={NavLink} to={enlace.to} sx={navLinkStyles}>
                {enlace.etiqueta}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5, ml: 1.5 }}>
            <Button
              component={NavLink}
              to="/login"
              variant="contained"
              size="medium"
              startIcon={<LoginOutlinedIcon fontSize="small" />}
              sx={{
                px: 2.75,
                py: 1,
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Iniciar sesión
            </Button>
          </Box>

          {/* Botón Menú Mobile */}
          <IconButton
            onClick={() => setMenuAbierto(true)}
            edge="end"
            aria-label="Abrir menú de navegación"
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              p: 1,
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Drawer Mobile Mejorado */}
      <Drawer
        anchor="right"
        open={menuAbierto}
        onClose={() => setMenuAbierto(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '85vw', sm: 340 },
              maxWidth: '100%',
              bgcolor: 'background.default',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            },
          },
        }}
      >
        <Box>
          {/* Cabecera del Drawer */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2.5, mb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box component="img" src={logoMark} alt="" sx={{ height: 28, width: 'auto' }} />
              <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: '1.1rem' }}>
                Feeling Pilates
              </Typography>
            </Box>
            <IconButton onClick={() => setMenuAbierto(false)} size="small" aria-label="Cerrar menú">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Lista de Enlaces con Íconos */}
          <List sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {enlaces.map((enlace) => (
              <ListItemButton
                key={enlace.to}
                component={NavLink}
                to={enlace.to}
                onClick={() => setMenuAbierto(false)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.25,
                  px: 2,
                  transition: 'all 0.2s ease',
                  '&.active': {
                    bgcolor: publicColors.accentSoft,
                    color: 'primary.main',
                    fontWeight: 700,
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'text.secondary' }}>
                  <enlace.Icono fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                      {enlace.etiqueta}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Footer del Drawer */}
        <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Button
            component={NavLink}
            to="/login"
            variant="contained"
            fullWidth
            onClick={() => setMenuAbierto(false)}
            startIcon={<LoginOutlinedIcon />}
            sx={{ py: 1.25 }}
          >
            Iniciar sesión en la app
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 14, color: 'secondary.main' }} /> Síguenos
            </Typography>
            <SocialLinks size={32} />
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
