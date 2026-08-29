import { Box } from '@mui/material';
import { publicColors } from '../theme/publicTheme';

// Manchas de luz difuminadas al estilo del hero de cuboconecta.com, adaptadas
// a la paleta cálida de la app móvil (terracota/oro/salvia en vez de morado/cian).
export function GlowBlobs() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        '@keyframes flotar1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -30px) scale(1.08)' },
        },
        '@keyframes flotar2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-25px, 20px) scale(1.05)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& > *': { animation: 'none !important' },
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '-8%',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${publicColors.accentSoft} 0%, rgba(169,105,79,0) 70%)`,
          filter: 'blur(10px)',
          animation: 'flotar1 16s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '-10%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${publicColors.goldSoft} 0%, rgba(182,148,77,0) 70%)`,
          filter: 'blur(10px)',
          animation: 'flotar2 20s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          left: '20%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${publicColors.spotsAvailableSoft} 0%, rgba(122,143,111,0) 70%)`,
          filter: 'blur(10px)',
          animation: 'flotar1 22s ease-in-out infinite reverse',
        }}
      />
    </Box>
  );
}
