import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Rating,
  Typography,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { GlowBlobs } from '../../components/GlowBlobs';
import { Reveal } from '../../components/Reveal';
import { StoreBadges } from '../../components/StoreBadges';
import { publicColors } from '../../theme/publicTheme';

// Realistic boutique assets matching Luma design
import imgYoga from '../../assets/images/yoga-wellness.jpg';
import imgSpa from '../../assets/images/spa-massage.jpg';
import imgReformer from '../../assets/images/pilates-reformer.jpg';
import imgWelcome from '../../assets/images/welcome-art.jpg';

import iconLeaf from '../../assets/images/icon-leaf.jpg';
import iconLotus from '../../assets/images/icon-lotus.jpg';
import iconDumbbell from '../../assets/images/icon-dumbbell.jpg';
import iconApple from '../../assets/images/icon-apple.jpg';

const accesosRapidos = [
  { id: 'reformer', label: 'Reformer', image: iconDumbbell, desc: 'Fuerza y control profundo' },
  { id: 'mat', label: 'Bienestar & Mat', image: iconLeaf, desc: 'Movilidad y conexión' },
  { id: 'relax', label: 'Relajación', image: iconLotus, desc: 'Calma y desconexión' },
  { id: 'nutricion', label: 'Nutrición', image: iconApple, desc: 'Hábitos y balance' },
];

const disciplinas = [
  {
    titulo: 'Pilates Reformer',
    subtitulo: 'Alineación & Fuerza Profunda',
    descripcion:
      'Trabajo dinámico en reformers que desafía el core, alarga tus músculos y mejora la alineación postural con resortes de resistencia progresiva.',
    tag: 'Fuerza & Control',
    image: imgYoga,
    puntos: ['Fortalecimiento del core', 'Descompresión de columna', 'Tonificación muscular sin impacto'],
  },
  {
    titulo: 'Masaje Relajante & Spa',
    subtitulo: 'Libera Tensiones & Renueva',
    descripcion:
      'Técnicas especializadas que alivian la tensión muscular acumulada, mejoran la circulación y promueven una profunda sensación de bienestar.',
    tag: 'Calma & Renovación',
    image: imgSpa,
    puntos: ['Alivio de sobrecarga muscular', 'Aceites esenciales naturales', 'Música y ambiente cálido'],
  },
  {
    titulo: 'Studio Reformer & Mat',
    subtitulo: 'Postura, Flexibilidad & Ritmo',
    descripcion:
      'Sesiones integrales diseñadas para mejorar la movilidad articular, coordinación y respiración en un ambiente boutique acogedor.',
    tag: 'Alineación & Postura',
    image: imgReformer,
    puntos: ['Máquinas Reformer de última gama', 'Grupos reducidos (máx. 6-8)', 'Atención guiada 1 a 1'],
  },
];

const beneficiosPills = [
  { emoji: '🍃', texto: 'Reduce el estrés' },
  { emoji: '🧘', texto: 'Mejora la postura' },
  { emoji: '〰️', texto: 'Aumenta la flexibilidad' },
  { emoji: '🤍', texto: 'Bienestar integral' },
  { emoji: '🌿', texto: 'Grupos reducidos (máx. 6-8)' },
  { emoji: '✨', texto: 'Reformers de alta gama' },
  { emoji: '💧', texto: 'Aceites esenciales' },
  { emoji: '🎵', texto: 'Ambiente cálido & música' },
];

const pasosExperiencia = [
  {
    numero: '01',
    titulo: 'Explora y Elige',
    descripcion: 'Consulta los horarios matutinos y vespertinos disponibles en tiempo real desde la plataforma.',
    Icono: AccessTimeOutlinedIcon,
  },
  {
    numero: '02',
    titulo: 'Elige tu Paquete',
    descripcion: 'Adquiere tus créditos de clases de forma transparente y sin membresías forzosas.',
    Icono: VerifiedOutlinedIcon,
  },
  {
    numero: '03',
    titulo: 'Aparta tu Reformer',
    descripcion: 'Reserva tu cupo individual en un solo toque y recibe confirmación al instante.',
    Icono: SelfImprovementOutlinedIcon,
  },
  {
    numero: '04',
    titulo: 'Check-in y Disfruta',
    descripcion: 'Escanea el código QR en recepción al llegar y conéctate con tu práctica guiada.',
    Icono: QrCodeScannerOutlinedIcon,
  },
];

const testimonios = [
  {
    nombre: 'Valeria Mendoza',
    clase: 'Pilates Reformer',
    texto:
      'Desde que empecé en Feeling Pilates mis dolores lumbares desaparecieron. Los instructores están atentos a cada detalle y el ambiente es sumamente cálido.',
    estrellas: 5,
  },
  {
    nombre: 'Sofía Álvarez',
    clase: 'Studio Reformer',
    texto:
      'Las clases son retadoras pero reconfortantes. La app hace facilísimo apartar mi horario y saber cuántas clases me quedan. ¡100% recomendado!',
    estrellas: 5,
  },
  {
    nombre: 'Camila Rivas',
    clase: 'Masaje Relajante & Mat',
    texto:
      'El estudio es hermoso, súper limpio y la atención es de primera. Es mi hora favorita del día para desconectarme y entrenar mi cuerpo.',
    estrellas: 5,
  },
];

const faqs = [
  {
    pregunta: '¿Necesito experiencia previa para tomar clases de Pilates Reformer?',
    respuesta:
      'No es necesario. Nuestras clases cuentan con grupos reducidos y nuestros instructores adaptan la resistencia de los resortes y las posturas para personas principiantes, intermedias y avanzadas.',
  },
  {
    pregunta: '¿Qué debo llevar para mi primera sesión?',
    respuesta:
      'Te recomendamos vestir ropa deportiva cómoda y flexible. Por seguridad e higiene en los reformers, se sugiere el uso de calcetas antiderrapantes. En el estudio contamos con agua y espacio para tus pertenencias.',
  },
  {
    pregunta: '¿Cómo funciona la política de cancelación de clases?',
    respuesta:
      'Puedes cancelar tu reserva sin penalización con la anticipación mínima establecida por el estudio antes del inicio de la clase. El crédito se reintegrará automáticamente a tu saldo de paquete para que puedas usarlo en otra fecha.',
  },
  {
    pregunta: '¿Puedo entrenar si tengo alguna lesión previa o estoy embarazada?',
    respuesta:
      'Sí, siempre y cuando cuentes con el aval de tu médico. Es indispensable que informes al instructor antes de comenzar la sesión para que realice las modificaciones y apoyos pertinentes a cada ejercicio.',
  },
  {
    pregunta: '¿Dónde puedo ver los precios y comprar paquetes de clases?',
    respuesta:
      'Los precios y paquetes vigentes están disponibles en la sección de Paquetes dentro de la aplicación o portal de alumnos. Manejamos opciones individuales, paquetes de sesiones y pases mensuales con pagos seguros.',
  },
];

export function Inicio() {
  const [faqExpandido, setFaqExpandido] = useState<string | false>('panel0');

  const handleFaqChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setFaqExpandido(isExpanded ? panel : false);
  };

  return (
    <Box>
      {/* HERO SECTION */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <GlowBlobs />
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 1,
            pt: { xs: 6, sm: 8, md: 10 },
            pb: { xs: 8, md: 11 },
          }}
        >
          <Grid container spacing={{ xs: 6, md: 5 }} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6.5 }}>
              <Reveal>
                <Chip
                  icon={<AutoAwesomeOutlinedIcon sx={{ fontSize: '15px !important', color: 'secondary.main' }} />}
                  label="✦ Estudio Boutique de Pilates & Bienestar"
                  variant="outlined"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(122, 143, 111, 0.12)',
                    borderColor: 'rgba(122, 143, 111, 0.3)',
                    color: 'text.primary',
                    fontWeight: 600,
                    px: 1.25,
                    py: 1.8,
                    borderRadius: 999,
                    mb: 2.5,
                  }}
                />
              </Reveal>

              <Reveal delayMs={80}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: 38, sm: 50, md: 56 },
                    lineHeight: 1.1,
                    color: 'text.primary',
                  }}
                >
                  Muévete con intención,{' '}
                  <Box component="span" sx={{ fontStyle: 'italic', color: 'primary.main', display: 'inline' }}>
                    fortalece tu ser.
                  </Box>
                </Typography>
              </Reveal>

              <Reveal delayMs={160}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 3, maxWidth: 520, fontSize: { xs: 16, sm: 17.5 }, lineHeight: 1.7 }}
                >
                  En Feeling Pilates creamos una experiencia donde la precisión del movimiento, la respiración
                  consciente y la calidez de nuestra comunidad se unen para elevar tu salud física y mental.
                </Typography>
              </Reveal>

              <Reveal delayMs={240}>
                <Box sx={{ display: 'flex', gap: 2, mt: 4, flexWrap: 'wrap' }}>
                  <Button
                    component={NavLink}
                    to="/contacto"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardOutlinedIcon />}
                    sx={{ px: 3.5, py: 1.4, fontSize: '0.98rem' }}
                  >
                    Reserva tu clase muestra
                  </Button>
                  <Button
                    component={NavLink}
                    to="/login"
                    variant="outlined"
                    size="large"
                    sx={{ px: 3, py: 1.4, fontSize: '0.98rem' }}
                  >
                    Iniciar sesión
                  </Button>
                </Box>
              </Reveal>

              <Reveal delayMs={320}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: { xs: 2, sm: 3 },
                    mt: 5,
                    pt: 3,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {[
                    'Reformers de última generación',
                    'Grupos reducidos (máx. 6-8)',
                    'Instructores certificados',
                  ].map((destacado) => (
                    <Box key={destacado} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {destacado}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Reveal>
            </Grid>

            <Grid size={{ xs: 12, md: 5.5 }}>
              <Reveal delayMs={150} y={28}>
                <Box sx={{ position: 'relative', maxWidth: 440, mx: 'auto' }}>
                  {/* Marco decorativo orgánico */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: '-10px',
                      borderRadius: '32px',
                      background: `linear-gradient(135deg, ${publicColors.goldSoft}, ${publicColors.accentSoft})`,
                      transform: 'rotate(-2deg)',
                      zIndex: 0,
                    }}
                  />

                  {/* Tarjeta de imagen principal con arte orgánico */}
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      borderRadius: '26px',
                      overflow: 'hidden',
                      boxShadow: '0 24px 60px -20px rgba(43, 36, 32, 0.25)',
                      aspectRatio: '3 / 4',
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: publicColors.border,
                    }}
                  >
                    <Box
                      component="img"
                      src={imgWelcome}
                      alt="Bienestar y Pilates Boutique"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Badge flotante inferior */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 18,
                        left: 18,
                        right: 18,
                        p: 2,
                        borderRadius: '18px',
                        bgcolor: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 12px 30px -10px rgba(43, 36, 32, 0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          Atención 1 a 1 en grupo
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Reserva y check-in instantáneo con QR
                        </Typography>
                      </Box>
                      <Chip
                        label="Cupos Limitados"
                        size="small"
                        sx={{
                          bgcolor: publicColors.spotsAvailableSoft,
                          color: publicColors.spotsAvailable,
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          borderRadius: 999,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Reveal>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SECCIÓN: ACCESOS RÁPIDOS (ESTILO LUMA) */}
      <Box sx={{ py: 6, bgcolor: publicColors.surfaceMuted, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}>
                Accesos Rápidos
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: 24, sm: 30 }, mt: 0.5 }}>
                Categorías de Bienestar
              </Typography>
            </Box>
          </Reveal>

          <Grid container spacing={2.5} sx={{ justifyContent: 'center' }}>
            {accesosRapidos.map((cat, idx) => (
              <Grid key={cat.id} size={{ xs: 6, sm: 3 }}>
                <Reveal delayMs={idx * 70}>
                  <Box
                    component={NavLink}
                    to="/contacto"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2.5,
                      borderRadius: '20px',
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      textDecoration: 'none',
                      color: 'inherit',
                      boxShadow: '0 4px 20px -8px rgba(43, 36, 32, 0.06)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 14px 30px -10px rgba(196, 104, 73, 0.2)',
                        borderColor: publicColors.accentSoft,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 76,
                        height: 76,
                        borderRadius: '20px',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: publicColors.border,
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px -4px rgba(43, 36, 32, 0.08)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <Box
                        component="img"
                        src={cat.image}
                        alt={cat.label}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: 'center', color: 'text.primary' }}>
                      {cat.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mt: 0.2 }}>
                      {cat.desc}
                    </Typography>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SECCIÓN DISCIPLINAS DESTACADAS (ILUSTRADAS - SIN PRECIOS) */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: { xs: 6, md: 8 } }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}>
                Disciplinas Destacadas
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: 32, sm: 40, md: 44 }, mt: 0.5, mb: 2 }}>
                Diseñadas para tu cuerpo y tus metas
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Entrenamientos integrales que combinan fuerza, flexibilidad y resistencia sin impacto lesivo para tus articulaciones.
              </Typography>
            </Box>
          </Reveal>

          <Grid container spacing={4}>
            {disciplinas.map((disciplina, indice) => (
              <Grid key={disciplina.titulo} size={{ xs: 12, md: 4 }}>
                <Reveal delayMs={indice * 100}>
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '24px',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      overflow: 'hidden',
                      boxShadow: '0 8px 30px -15px rgba(43, 36, 32, 0.08)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: '0 20px 40px -18px rgba(196, 104, 73, 0.22)',
                        borderColor: publicColors.accentSoft,
                      },
                    }}
                  >
                    {/* Visual Illustration Area */}
                    <Box sx={{ height: 200, width: '100%', bgcolor: publicColors.surfaceMuted, overflow: 'hidden' }}>
                      <Box
                        component="img"
                        src={disciplina.image}
                        alt={disciplina.titulo}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>

                    {/* Content */}
                    <Box sx={{ p: { xs: 3, sm: 3.5 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Chip
                          label={disciplina.tag}
                          size="small"
                          sx={{
                            bgcolor: publicColors.accentSoft,
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            borderRadius: 999,
                          }}
                        />
                      </Box>

                      <Typography variant="h5" sx={{ fontSize: '1.35rem', mb: 0.5 }}>
                        {disciplina.titulo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, mb: 1.5, display: 'block' }}>
                        {disciplina.subtitulo}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, flexGrow: 1, lineHeight: 1.65 }}>
                        {disciplina.descripcion}
                      </Typography>

                      <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                        {disciplina.puntos.map((punto) => (
                          <Box key={punto} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              {punto}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      <Button
                        component={NavLink}
                        to="/contacto"
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForwardOutlinedIcon />}
                        sx={{ mt: 'auto', alignSelf: 'flex-start', borderRadius: 999 }}
                      >
                        Consultar horarios
                      </Button>
                    </Box>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SECCIÓN: BENEFICIOS EN PILLS & ATMÓSFERA BOUTIQUE */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'rgba(247, 242, 236, 0.65)', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: 5 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}>
                Tu Bienestar
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: 30, sm: 38 }, mt: 0.5, mb: 1.5 }}>
                Beneficios integrales en cada sesión
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Cuidamos cada detalle de postura, respiración y ambiente para que salgas renovada y llena de energía.
              </Typography>
            </Box>
          </Reveal>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, justifyContent: 'center', maxWidth: 840, mx: 'auto' }}>
            {beneficiosPills.map((item, i) => (
              <Reveal key={item.texto} delayMs={i * 40}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 2.2,
                    py: 1.2,
                    borderRadius: 999,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: publicColors.border,
                    boxShadow: '0 4px 15px -6px rgba(43, 36, 32, 0.06)',
                  }}
                >
                  <Typography sx={{ fontSize: '1.1rem' }}>{item.emoji}</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'text.primary' }}>
                    {item.texto}
                  </Typography>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Container>
      </Box>

      {/* SECCIÓN PASO A PASO */}
      <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden' }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto', mb: { xs: 6, md: 9 } }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}>
                Tu Experiencia
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: 32, sm: 40 }, mt: 0.5, mb: 2 }}>
                ¿Cómo empezar en Feeling Pilates?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Cuatro pasos sencillos para transformar tu rutina y conectar con tu mejor versión.
              </Typography>
            </Box>
          </Reveal>

          <Grid container spacing={3}>
            {pasosExperiencia.map((paso, index) => (
              <Grid key={paso.numero} size={{ xs: 12, sm: 6, md: 3 }}>
                <Reveal delayMs={index * 90}>
                  <Box
                    sx={{
                      p: 3.5,
                      height: '100%',
                      borderRadius: '20px',
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      position: 'relative',
                      transition: 'transform 0.25s ease',
                      '&:hover': { transform: 'translateY(-4px)' },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-block',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: 'primary.main',
                        bgcolor: publicColors.accentSoft,
                        px: 1.25,
                        py: 0.4,
                        borderRadius: 999,
                        mb: 2,
                      }}
                    >
                      Paso {paso.numero}
                    </Box>

                    <Typography variant="h6" sx={{ fontSize: '1.15rem', mb: 1 }}>
                      {paso.titulo}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {paso.descripcion}
                    </Typography>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SECCIÓN TESTIMONIOS */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: publicColors.surfaceMuted, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto', mb: { xs: 6, md: 8 } }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}>
                Comunidad Feeling
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: 32, sm: 40 }, mt: 0.5, mb: 1.5 }}>
                Lo que dicen nuestros alumnos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Experiencias reales de personas que han transformado su energía y postura con nosotros.
              </Typography>
            </Box>
          </Reveal>

          <Grid container spacing={3.5}>
            {testimonios.map((testimonio, i) => (
              <Grid key={testimonio.nombre} size={{ xs: 12, md: 4 }}>
                <Reveal delayMs={i * 100}>
                  <Box
                    sx={{
                      p: 4,
                      borderRadius: '24px',
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 10px 30px -15px rgba(43, 36, 32, 0.07)',
                    }}
                  >
                    <Box>
                      <Rating value={testimonio.estrellas} readOnly size="small" sx={{ color: 'secondary.main', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 3, lineHeight: 1.7 }}>
                        "{testimonio.texto}"
                      </Typography>
                    </Box>
                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {testimonio.nombre}
                      </Typography>
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                        {testimonio.clase}
                      </Typography>
                    </Box>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SECCIÓN PREGUNTAS FRECUENTES */}
      <Box sx={{ py: { xs: 8, md: 12 }, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md">
          <Reveal>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}>
                FAQ
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: 30, sm: 38 }, mt: 0.5, mb: 1.5 }}>
                Preguntas Frecuentes
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Todo lo que necesitas saber antes de tu primera clase en Feeling Pilates.
              </Typography>
            </Box>
          </Reveal>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {faqs.map((faq, index) => {
              const panelId = `panel${index}`;
              return (
                <Reveal key={faq.pregunta} delayMs={index * 60}>
                  <Accordion
                    expanded={faqExpandido === panelId}
                    onChange={handleFaqChange(panelId)}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                      aria-controls={`${panelId}-content`}
                      id={`${panelId}-header`}
                      sx={{ py: 1 }}
                    >
                      <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: 'text.primary' }}>
                        {faq.pregunta}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 2.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {faq.respuesta}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </Reveal>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* SECCIÓN DESCARGA DE APP MÓVIL */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: publicColors.surfaceMuted, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Reveal>
            <Chip
              label="✦ Lleva Feeling Pilates en tu bolsillo"
              size="small"
              sx={{ bgcolor: publicColors.accentSoft, color: 'primary.main', fontWeight: 700, mb: 2, borderRadius: 999 }}
            />
            <Typography variant="h2" sx={{ fontSize: { xs: 32, sm: 42 }, mb: 2 }}>
              Reserva tus clases desde la App Móvil
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540, mx: 'auto', mb: 3.5 }}>
              Consulta el calendario de clases en vivo, adquiere paquetes de créditos, gestiona cancelaciones y haz check-in con tu código QR al llegar.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <StoreBadges />
            </Box>
          </Reveal>
        </Container>
      </Box>

      {/* BANNER FINAL CTA */}
      <Box sx={{ position: 'relative', overflow: 'hidden', bgcolor: publicColors.surface, borderTop: '1px solid', borderColor: 'divider' }}>
        <GlowBlobs />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: { xs: 9, md: 12 }, textAlign: 'center' }}>
          <Reveal>
            <Chip
              label="Empieza Hoy"
              size="small"
              sx={{ bgcolor: publicColors.accentSoft, color: 'primary.main', fontWeight: 700, mb: 2, borderRadius: 999 }}
            />
            <Typography variant="h2" sx={{ fontSize: { xs: 34, sm: 44, md: 48 }, maxWidth: 650, mx: 'auto' }}>
              ¿Lista para reconectar con tu fuerza interior?
            </Typography>
          </Reveal>

          <Reveal delayMs={100}>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2.5, mb: 4.5, maxWidth: 520, mx: 'auto', fontSize: 17 }}>
              Escríbenos para consultar horarios disponibles, costos de paquetes y resolver cualquier inquietud.
            </Typography>
          </Reveal>

          <Reveal delayMs={180}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button component={NavLink} to="/contacto" variant="contained" size="large" sx={{ px: 4, py: 1.4, fontSize: '1rem' }}>
                Contactar al Estudio
              </Button>
              <Button component={NavLink} to="/login" variant="outlined" size="large" sx={{ px: 3.5, py: 1.4 }}>
                Portal de Alumnos
              </Button>
            </Box>
          </Reveal>
        </Container>
      </Box>
    </Box>
  );
}
