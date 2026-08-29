import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { WhatsappIcon } from '../../components/icons/SocialIcons';
import { GlowBlobs } from '../../components/GlowBlobs';
import { Reveal } from '../../components/Reveal';
import { publicColors } from '../../theme/publicTheme';

const canales = [
  {
    Icono: WhatsappIcon,
    etiqueta: 'WhatsApp Directo',
    valor: '+52 (442) 000-0000',
    descripcion: 'Respuestas rápidas para dudas sobre disponibilidad y paquetes.',
    href: 'https://wa.me/5214420000000?text=Hola%2C%20quisiera%20informaci%C3%B3n%20sobre%20las%20clases%20de%20Feeling%20Pilates',
    accionTexto: 'Chatear por WhatsApp',
    color: '#25D366',
  },
  {
    Icono: EmailOutlinedIcon,
    etiqueta: 'Correo Electrónico',
    valor: 'contacto@feellingpilates.com',
    descripcion: 'Para información general, cotizaciones de empresas y soporte de cuenta.',
    href: 'mailto:contacto@feellingpilates.com',
    accionTexto: 'Enviar correo',
    color: publicColors.accent,
  },
  {
    Icono: RoomOutlinedIcon,
    etiqueta: 'Ubicación del Estudio',
    valor: 'Santiago de Querétaro, Qro.',
    descripcion: 'Instalaciones boutique equipadas con Reformers de alta gama y zona de descanso.',
    href: undefined,
    accionTexto: undefined,
    color: publicColors.gold,
  },
  {
    Icono: PhoneOutlinedIcon,
    etiqueta: 'Atención Telefónica',
    valor: 'Llamadas en horario de estudio',
    descripcion: 'Comunícate con recepción durante los horarios de clases presenciales.',
    href: undefined,
    accionTexto: undefined,
    color: publicColors.spotsAvailable,
  },
];

const horarios = [
  { dias: 'Lunes a Jueves', horas: '6:00 AM – 9:00 PM' },
  { dias: 'Viernes', horas: '6:00 AM – 8:00 PM' },
  { dias: 'Sábados', horas: '7:00 AM – 2:00 PM' },
  { dias: 'Domingos', horas: 'Talleres & Clases Especiales' },
];

export function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    interes: 'clase_muestra',
    mensaje: '',
  });

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({ ...prev, interes: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    // Simulación de envío de formulario de contacto
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        interes: 'clase_muestra',
        mensaje: '',
      });
    }, 900);
  };

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <GlowBlobs />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          pt: { xs: 6, sm: 8, md: 10 },
          pb: { xs: 8, md: 12 },
        }}
      >
        {/* Cabecera */}
        <Reveal>
          <Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: { xs: 6, md: 8 } }}>
            <Chip
              label="Estamos aquí para ti"
              size="small"
              sx={{
                bgcolor: publicColors.accentSoft,
                color: 'primary.main',
                fontWeight: 700,
                mb: 2,
                px: 1,
              }}
            />
            <Typography variant="h1" sx={{ fontSize: { xs: 34, sm: 44, md: 50 }, mb: 2 }}>
              Ponte en contacto con Feeling Pilates
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: 16, sm: 17.5 }, lineHeight: 1.7 }}>
              ¿Quieres agendar tu clase muestra, resolver dudas sobre paquetes o conocer nuestras instalaciones?
              Escríbenos y con gusto te atenderemos.
            </Typography>
          </Box>
        </Reveal>

        <Grid container spacing={{ xs: 5, md: 6 }}>
          {/* Columna Izquierda: Canales de contacto y Horarios */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Reveal delayMs={100}>
                <Typography variant="h4" sx={{ fontSize: '1.4rem', mb: 2 }}>
                  Canales de atención directa
                </Typography>
              </Reveal>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {canales.map((canal, indice) => (
                  <Reveal key={canal.etiqueta} delayMs={indice * 80}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        boxShadow: '0 4px 20px -10px rgba(43, 36, 32, 0.06)',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 28px -15px rgba(169, 105, 79, 0.2)',
                          borderColor: publicColors.accentSoft,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                        <Box
                          sx={{
                            width: 46,
                            height: 46,
                            flexShrink: 0,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${canal.color}15`,
                            color: canal.color,
                          }}
                        >
                          <canal.Icono sx={{ fontSize: 22 }} />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {canal.etiqueta}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25, mb: 0.5 }}>
                            {canal.valor}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: canal.href ? 1.5 : 0 }}>
                            {canal.descripcion}
                          </Typography>

                          {canal.href && (
                            <Button
                              component="a"
                              href={canal.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="outlined"
                              size="small"
                              sx={{
                                mt: 1,
                                fontSize: '0.8rem',
                                py: 0.6,
                                px: 2,
                                borderColor: publicColors.borderStrong,
                              }}
                            >
                              {canal.accionTexto}
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Reveal>
                ))}
              </Box>

              {/* Card de Horarios */}
              <Reveal delayMs={350}>
                <Box
                  sx={{
                    p: 3.5,
                    borderRadius: 3.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(247, 242, 236, 0.7)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                    <AccessTimeOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Horarios de Estudio y Recepción
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {horarios.map((item) => (
                      <Box
                        key={item.dias}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 0.5,
                          borderBottom: '1px dashed',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {item.dias}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.horas}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Reveal>
            </Box>
          </Grid>

          {/* Columna Derecha: Formulario de Contacto Interactivo */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Reveal delayMs={150}>
              <Box
                sx={{
                  p: { xs: 3.5, sm: 4.5 },
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 16px 40px -15px rgba(43, 36, 32, 0.1)',
                }}
              >
                <Typography variant="h4" sx={{ fontSize: '1.4rem', mb: 1 }}>
                  Envíanos un mensaje
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
                  Completa tus datos y nos pondremos en contacto contigo a la brevedad.
                </Typography>

                {enviado ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: publicColors.spotsAvailableSoft,
                        color: publicColors.spotsAvailable,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2.5,
                      }}
                    >
                      <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 36 }} />
                    </Box>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      ¡Mensaje enviado con éxito!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mx: 'auto', mb: 3 }}>
                      Gracias por escribirnos. Nuestro equipo de recepción te responderá muy pronto.
                    </Typography>
                    <Button variant="outlined" onClick={() => setEnviado(false)} size="small">
                      Enviar otro mensaje
                    </Button>
                  </Box>
                ) : (
                  <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                      label="Nombre completo"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      fullWidth
                      placeholder="Ej. Ana García"
                    />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Correo electrónico"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          fullWidth
                          placeholder="ana@ejemplo.com"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Teléfono / WhatsApp"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          fullWidth
                          placeholder="(442) 000-0000"
                        />
                      </Grid>
                    </Grid>

                    <FormControl fullWidth>
                      <InputLabel id="interes-label">¿Qué te interesa consultar?</InputLabel>
                      <Select
                        labelId="interes-label"
                        id="interes"
                        value={formData.interes}
                        label="¿Qué te interesa consultar?"
                        onChange={handleSelectChange}
                      >
                        <MenuItem value="clase_muestra">Reservar clase muestra</MenuItem>
                        <MenuItem value="paquetes">Información de paquetes y precios</MenuItem>
                        <MenuItem value="horarios">Consultar horarios disponibles</MenuItem>
                        <MenuItem value="privadas">Clases privadas o eventos</MenuItem>
                        <MenuItem value="otro">Otra consulta</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Mensaje o comentarios"
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      required
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Escribe tus dudas, objetivos o preferencias de horario..."
                    />

                    <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ bgcolor: 'rgba(182, 148, 77, 0.08)', color: 'text.secondary' }}>
                      Tus datos son tratados de manera confidencial conforme a nuestro Aviso de Privacidad.
                    </Alert>

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={enviando}
                      endIcon={enviando ? <CircularProgress size={18} color="inherit" /> : <SendOutlinedIcon />}
                      sx={{ py: 1.4, mt: 1, fontSize: '0.95rem' }}
                    >
                      {enviando ? 'Enviando...' : 'Enviar mensaje'}
                    </Button>
                  </Box>
                )}
              </Box>
            </Reveal>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
