import { Box, Container, Divider, Grid, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import logoMark from '../assets/images/logo-mark.png';
import { SocialLinks } from './SocialLinks';

const enlacesNavegacion = [
  { to: '/inicio', etiqueta: 'Inicio' },
  { to: '/contacto', etiqueta: 'Contacto y Horarios' },
  { to: '/login', etiqueta: 'Acceso a Alumnos / Iniciar Sesión' },
];

const enlacesLegal = [
  { to: '/terminos-y-condiciones', etiqueta: 'Términos y condiciones' },
  { to: '/aviso-de-privacidad', etiqueta: 'Aviso de privacidad' },
];

const disciplinas = [
  'Pilates Reformer',
  'Bacu Fit & Cardio Sculpt',
  'Pilates Mat & Flow',
  'Clases Personalizadas',
];

export function PublicFooter() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(247, 242, 236, 0.65)',
        pt: { xs: 7, md: 9 },
        pb: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 5, md: 6 }}>
          {/* Columna Marca y Filosofía */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(169, 105, 79, 0.08)',
                  p: 0.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box component="img" src={logoMark} alt="Feeling Pilates" sx={{ height: 22, width: 'auto' }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Feeling Pilates
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 340, lineHeight: 1.65 }}>
              Estudio boutique de Pilates Reformer, Bacu Fit y bienestar integral. Muévete con intención, fortalece cuerpo y mente en un entorno pensado para ti.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlaceOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Santiago de Querétaro, Qro., México
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  contacto@feellingpilates.com
                </Typography>
              </Box>
            </Box>

            <SocialLinks size={34} />
          </Grid>

          {/* Columna Disciplinas */}
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '0.04em', mb: 2.5, color: 'text.primary' }}>
              Disciplinas & Clases
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {disciplinas.map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  color="text.secondary"
                  sx={{ transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Columna Navegación */}
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '0.04em', mb: 2.5, color: 'text.primary' }}>
              Navegación
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {enlacesNavegacion.map((enlace) => (
                <Typography
                  key={enlace.to}
                  component={NavLink}
                  to={enlace.to}
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': { color: 'primary.main', transform: 'translateX(3px)' },
                    display: 'inline-block',
                  }}
                >
                  {enlace.etiqueta}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Columna Legal */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '0.04em', mb: 2.5, color: 'text.primary' }}>
              Legal & Privacidad
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {enlacesLegal.map((enlace) => (
                <Typography
                  key={enlace.to}
                  component={NavLink}
                  to={enlace.to}
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': { color: 'primary.main', transform: 'translateX(3px)' },
                    display: 'inline-block',
                  }}
                >
                  {enlace.etiqueta}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'primary.main', mb: 0.5 }}>
                ¿Dudas sobre tus clases?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Estamos disponibles para ayudarte con reservas y paquetes.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 5 }} />

        {/* Barra inferior */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Feeling Pilates. Todos los derechos reservados.
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
          >
            Creado para tu bienestar <FavoriteBorderIcon sx={{ fontSize: 14, color: 'primary.main' }} />
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
