import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  Typography,
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Reveal } from '../../components/Reveal';
import { publicColors } from '../../theme/publicTheme';

interface SeccionIndice {
  numero: string;
  titulo: string;
}

interface DocumentoLegalProps {
  titulo: string;
  actualizadoEl: string;
  borrador?: boolean;
  secciones?: SeccionIndice[];
  children: ReactNode;
}

export function DocumentoLegal({
  titulo,
  actualizadoEl,
  borrador,
  secciones = [],
  children,
}: DocumentoLegalProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ bgcolor: 'background.default', py: { xs: 5, sm: 7, md: 9 } }}>
      <Container maxWidth="lg">
        {/* Cabecera del Documento */}
        <Reveal>
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <Chip
              icon={<GavelOutlinedIcon sx={{ fontSize: '14px !important', color: 'primary.main' }} />}
              label="Documento Legal y Normativo"
              size="small"
              sx={{
                bgcolor: publicColors.accentSoft,
                color: 'primary.main',
                fontWeight: 700,
                mb: 2,
                px: 1,
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 32, sm: 42, md: 48 },
                lineHeight: 1.15,
                mb: 2,
                color: 'text.primary',
              }}
            >
              {titulo}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                color: 'text.secondary',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Última actualización: <strong>{actualizadoEl}</strong>
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' }, color: 'divider' }}>
                •
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Feeling Pilates Estudio & App
              </Typography>
            </Box>
          </Box>
        </Reveal>

        {borrador && (
          <Reveal delayMs={80}>
            <Alert
              severity="warning"
              sx={{
                mb: 4,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'warning.light',
                bgcolor: 'rgba(237, 108, 2, 0.06)',
                '& .MuiAlert-icon': { color: 'warning.main' },
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Documento en fase de borrador
              </Typography>
              <Typography variant="body2">
                Este texto es un borrador sujeto a confirmación legal y administrativa. Los campos señalados como{' '}
                <Placeholder>etiqueta resaltada</Placeholder> corresponden a datos que deben definirse antes de la versión final.
              </Typography>
            </Alert>
          </Reveal>
        )}

        <Grid container spacing={{ xs: 4, md: 5 }}>
          {/* Sidebar con Índice Rápido (Desktop) */}
          {secciones.length > 0 && (
            <Grid size={{ xs: 12, md: 3.5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  position: 'sticky',
                  top: 96,
                  p: 3,
                  borderRadius: 3.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 4px 20px -10px rgba(43, 36, 32, 0.05)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary', letterSpacing: '0.02em' }}>
                  Índice de Cláusulas
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    maxHeight: 'calc(100vh - 280px)',
                    overflowY: 'auto',
                    pr: 1,
                  }}
                >
                  {secciones.map((sec) => (
                    <Link
                      key={sec.numero}
                      href={`#seccion-${sec.numero}`}
                      underline="none"
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1,
                        fontSize: '0.84rem',
                        color: 'text.secondary',
                        py: 0.5,
                        px: 1,
                        borderRadius: 1.5,
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          bgcolor: publicColors.accentSoft,
                          color: 'primary.main',
                          fontWeight: 600,
                        },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'primary.main',
                          minWidth: 20,
                        }}
                      >
                        {sec.numero}
                      </Box>
                      <Box component="span" sx={{ lineHeight: 1.35 }}>
                        {sec.titulo}
                      </Box>
                    </Link>
                  ))}
                </Box>

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    ¿Tienes dudas legales?
                  </Typography>
                  <Button
                    component="a"
                    href="mailto:contacto@feellingpilates.com"
                    size="small"
                    variant="outlined"
                    startIcon={<EmailOutlinedIcon fontSize="small" />}
                    sx={{ fontSize: '0.8rem', py: 0.6 }}
                  >
                    contacto@feellingpilates.com
                  </Button>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Contenido Principal */}
          <Grid size={{ xs: 12, md: secciones.length > 0 ? 8.5 : 12 }}>
            <Box
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 8px 30px -15px rgba(43, 36, 32, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {children}

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  pt: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Feeling Pilates • Todos los derechos reservados.
                </Typography>

                <Button
                  onClick={scrollToTop}
                  size="small"
                  variant="text"
                  endIcon={<ArrowUpwardIcon fontSize="small" />}
                  sx={{ color: 'primary.main' }}
                >
                  Volver al inicio
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

interface SeccionProps {
  numero: string;
  titulo: string;
  children: ReactNode;
}

export function Seccion({ numero, titulo, children }: SeccionProps) {
  return (
    <Box
      id={`seccion-${numero}`}
      sx={{
        scrollMarginTop: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.75,
        pt: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: publicColors.accentSoft,
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.82rem',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {numero}
        </Box>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.15rem', sm: '1.25rem' }, color: 'text.primary' }}>
          {titulo}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.75,
          pl: { xs: 0, sm: 5.5 },
          '& p': { lineHeight: 1.7 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px dashed',
        borderColor: 'warning.main',
        bgcolor: 'rgba(237, 108, 2, 0.09)',
        color: 'warning.dark',
        borderRadius: 1.5,
        px: 1,
        py: 0.1,
        mx: 0.25,
        fontSize: '0.85em',
        fontWeight: 700,
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </Box>
  );
}

export function Nota({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        bgcolor: 'rgba(182, 148, 77, 0.08)',
        border: '1px solid',
        borderColor: 'rgba(182, 148, 77, 0.3)',
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
      }}
    >
      <InfoOutlinedIcon sx={{ color: 'secondary.main', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
      <Box sx={{ '& p': { m: 0 }, fontSize: '0.9rem', color: 'text.primary', lineHeight: 1.6 }}>
        {children}
      </Box>
    </Box>
  );
}

