import type { ReactNode } from 'react';
import { Box, Chip, Container, Typography } from '@mui/material';
import clienteGood from '../../assets/propuesta-logos/cliente-good.png';
import clienteMatch from '../../assets/propuesta-logos/cliente-match.png';
import isotipoGood from '../../assets/propuesta-logos/nueva/isotipo-good.svg?raw';
import isotipoFitness from '../../assets/propuesta-logos/nueva/isotipo-fitness.svg?raw';
import isotipoMatch from '../../assets/propuesta-logos/nueva/isotipo-match.svg?raw';
import iconoGood from '../../assets/propuesta-logos/nueva/icono-good.svg?raw';
import iconoFitness from '../../assets/propuesta-logos/nueva/icono-fitness.svg?raw';
import iconoMatch from '../../assets/propuesta-logos/nueva/icono-match.svg?raw';
import iconoTrio from '../../assets/propuesta-logos/nueva/icono-feeling-trio.svg?raw';
import apiladoGood from '../../assets/propuesta-logos/nueva/apilado-good.svg?raw';
import apiladoMatch from '../../assets/propuesta-logos/nueva/apilado-match.svg?raw';
import aIcono from '../../assets/propuesta-logos/anterior/a-icono.svg';
import aLogo from '../../assets/propuesta-logos/anterior/a-logo.svg';
import bIcono from '../../assets/propuesta-logos/anterior/b-icono.svg';
import bLogo from '../../assets/propuesta-logos/anterior/b-logo.svg';
import isoPilates from '../../assets/propuesta-logos/anterior/isotipo-pilates.svg';
import isoGood from '../../assets/propuesta-logos/anterior/isotipo-good.svg';
import isoMatch from '../../assets/propuesta-logos/anterior/isotipo-match.svg';
import appPilates from '../../assets/propuesta-logos/anterior/icono-app-pilates.svg';
import appGood from '../../assets/propuesta-logos/anterior/icono-app-good.svg';
import appMatch from '../../assets/propuesta-logos/anterior/icono-app-match.svg';
import apilPilates from '../../assets/propuesta-logos/anterior/apilado-pilates.svg';
import apilGood from '../../assets/propuesta-logos/anterior/apilado-good.svg';
import apilMatch from '../../assets/propuesta-logos/anterior/apilado-match.svg';
import isoMono from '../../assets/propuesta-logos/anterior/isotipo-mono.svg';
import isoBlanco from '../../assets/propuesta-logos/anterior/isotipo-blanco.svg';

// Página interna para revisar la propuesta de logos con el cliente.
// Solo se llega escribiendo la ruta: no aparece en menús ni se indexa.

const MONTSERRAT = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500&display=swap';

const nuevas = [
  { titulo: 'Feeling Good · natación', isotipo: isotipoGood, icono: iconoGood },
  { titulo: 'Feeling Good · fitness', isotipo: isotipoFitness, icono: iconoFitness },
  { titulo: 'Feeling Match · pádel', isotipo: isotipoMatch, icono: iconoMatch },
];

// SVG propios del repositorio (contenido estático), se insertan en línea para que tomen Montserrat
function Svg({ markup, size, icono }: { markup: string; size: number | string; icono?: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        maxWidth: '100%',
        aspectRatio: icono || typeof size === 'number' ? '1' : undefined,
        borderRadius: icono ? '22%' : 0,
        overflow: 'hidden',
        boxShadow: icono ? '0 3px 10px rgba(0,0,0,.13)' : 'none',
        '& svg': { display: 'block', width: '100%', height: '100%' },
      }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

function Img({ src, alt, height = 200, icono }: { src: string; alt: string; height?: number; icono?: boolean }) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{ width: '100%', maxWidth: icono ? 120 : 300, height: icono ? 120 : height, objectFit: 'contain' }}
    />
  );
}

function Tarjeta({ pie, oscura, children }: { pie: string; oscura?: boolean; children: ReactNode }) {
  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        p: 2.5,
        minHeight: 200,
        borderRadius: 3.5,
        bgcolor: oscura ? '#1d1d24' : '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      {children}
      <Typography component="figcaption" variant="caption" sx={{ color: '#888', textAlign: 'center' }}>
        {pie}
      </Typography>
    </Box>
  );
}

function Fila({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
      {children}
    </Box>
  );
}

function Titulo({ children, nota }: { children: ReactNode; nota?: ReactNode }) {
  return (
    <Box sx={{ mt: 5, mb: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e1b4b' }}>
        {children}
      </Typography>
      {nota && (
        <Typography variant="body2" sx={{ color: '#666', mt: 0.75, maxWidth: 780 }}>
          {nota}
        </Typography>
      )}
    </Box>
  );
}

function Parte({ etiqueta, gris, children }: { etiqueta: string; gris?: boolean; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mt: 7, pt: 1, borderTop: '2px solid #ddd' }}>
      <Chip
        label={etiqueta}
        size="small"
        sx={{
          mt: 1.5,
          bgcolor: gris ? '#999' : '#2E3192',
          color: '#fff',
          fontWeight: 600,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}
      />
      {children}
    </Box>
  );
}

function Chicos({ markup }: { markup: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'center' }}>
      <Svg markup={markup} size={64} icono />
      <Svg markup={markup} size={40} icono />
    </Box>
  );
}

export function PropuestaLogos() {
  return (
    <Box sx={{ bgcolor: '#f4f4f6', minHeight: '100vh', color: '#1e1b4b', py: { xs: 3, md: 5 } }}>
      <title>Propuesta de logos · Feeling</title>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="stylesheet" href={MONTSERRAT} precedence="default" />

      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Feeling · propuesta de logo
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mt: 1, maxWidth: 780 }}>
          Basada en los logos que nos compartió el cliente: mismos nombres, mismos colores y pictogramas claros
          para cada disciplina (natación, fitness y pádel).
        </Typography>

        <Parte etiqueta="Referencia">
          <Titulo>Logos del cliente (originales)</Titulo>
          <Fila>
            <Tarjeta pie="Feeling Good · Aquatic & Fitness Center">
              <Img src={clienteGood} alt="Logo Feeling Good" height={150} />
            </Tarjeta>
            <Tarjeta pie="Feeling Match · Padel Center">
              <Img src={clienteMatch} alt="Logo Feeling Match" height={150} />
            </Tarjeta>
          </Fila>
        </Parte>

        <Parte etiqueta="Propuesta nueva">
          <Titulo nota="El símbolo sacado de cada logo y limpiado: el nadador entre olas, la pesa y la raqueta con su pelota. Sirven para el favicon, las redes y los lugares donde no cabe el nombre.">
            Isotipos
          </Titulo>
          <Fila>
            {nuevas.map((n) => (
              <Tarjeta key={n.titulo} pie={n.titulo}>
                <Svg markup={n.isotipo} size={150} />
              </Tarjeta>
            ))}
          </Fila>

          <Titulo nota="Uno por marca, o el general con las tres disciplinas para una sola app.">Ícono de app</Titulo>
          <Fila>
            {nuevas.map((n) => (
              <Tarjeta key={n.titulo} pie={n.titulo}>
                <Svg markup={n.icono} size={170} icono />
                <Chicos markup={n.icono} />
              </Tarjeta>
            ))}
          </Fila>
          <Typography variant="subtitle1" sx={{ mt: 3.5, mb: 1.25, color: '#555', fontWeight: 500 }}>
            Ícono general · las tres disciplinas
          </Typography>
          <Fila>
            <Tarjeta pie="Natación · Fitness · Pádel">
              <Svg markup={iconoTrio} size={170} icono />
              <Chicos markup={iconoTrio} />
            </Tarjeta>
          </Fila>

          <Titulo nota="El pictograma arriba y el nombre exactamente como lo tiene el cliente, para pantallas cuadradas como el splash de la app.">
            Versión apilada con el nombre original
          </Titulo>
          <Fila>
            <Tarjeta pie="Feeling Good · Aquatic & Fitness Center">
              <Svg markup={apiladoGood} size="320px" />
            </Tarjeta>
            <Tarjeta pie="Feeling Match · Padel Center">
              <Svg markup={apiladoMatch} size="320px" />
            </Tarjeta>
          </Fila>
        </Parte>

        <Parte etiqueta="Propuestas anteriores" gris>
          <Titulo nota="Descartada como logo principal porque cambiaba el nombre a “feeling”.">
            Logo nuevo · Opción A · Monograma “f”
          </Titulo>
          <Fila>
            <Tarjeta pie="a-icono.svg"><Img src={aIcono} alt="" icono /></Tarjeta>
            <Tarjeta pie="a-logo.svg"><Img src={aLogo} alt="" /></Tarjeta>
          </Fila>

          <Titulo nota="Descartada como logo principal porque cambiaba el nombre a “feeling”.">
            Logo nuevo · Opción B · Trío
          </Titulo>
          <Fila>
            <Tarjeta pie="b-icono.svg"><Img src={bIcono} alt="" icono /></Tarjeta>
            <Tarjeta pie="b-logo.svg"><Img src={bLogo} alt="" /></Tarjeta>
          </Fila>

          <Titulo>Isotipo por marca</Titulo>
          <Fila>
            <Tarjeta pie="isotipo-pilates.svg"><Img src={isoPilates} alt="" /></Tarjeta>
            <Tarjeta pie="isotipo-good.svg"><Img src={isoGood} alt="" /></Tarjeta>
            <Tarjeta pie="isotipo-match.svg"><Img src={isoMatch} alt="" /></Tarjeta>
          </Fila>

          <Titulo>Ícono de app</Titulo>
          <Fila>
            <Tarjeta pie="icono-app-pilates.svg"><Img src={appPilates} alt="" icono /></Tarjeta>
            <Tarjeta pie="icono-app-good.svg"><Img src={appGood} alt="" icono /></Tarjeta>
            <Tarjeta pie="icono-app-match.svg"><Img src={appMatch} alt="" icono /></Tarjeta>
          </Fila>

          <Titulo>Versión apilada</Titulo>
          <Fila>
            <Tarjeta pie="apilado-pilates.svg"><Img src={apilPilates} alt="" /></Tarjeta>
            <Tarjeta pie="apilado-good.svg"><Img src={apilGood} alt="" /></Tarjeta>
            <Tarjeta pie="apilado-match.svg"><Img src={apilMatch} alt="" /></Tarjeta>
          </Fila>

          <Titulo>Monocromático</Titulo>
          <Fila>
            <Tarjeta pie="isotipo-mono.svg"><Img src={isoMono} alt="" /></Tarjeta>
            <Tarjeta pie="isotipo-blanco.svg" oscura><Img src={isoBlanco} alt="" /></Tarjeta>
          </Fila>
        </Parte>
      </Container>
    </Box>
  );
}
