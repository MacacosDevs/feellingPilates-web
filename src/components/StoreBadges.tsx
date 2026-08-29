import { Box, Tooltip, Typography } from '@mui/material';
import AppleIcon from '@mui/icons-material/Apple';
import AndroidIcon from '@mui/icons-material/Android';

const tiendas = [
  { Icono: AppleIcon, linea1: 'Descárgala en', linea2: 'App Store' },
  { Icono: AndroidIcon, linea1: 'Disponible en', linea2: 'Google Play' },
];

// Badges propios (no el artwork oficial de Apple/Google) mientras la app no
// está publicada. Cuando haya enlaces reales, envolver cada Box en <Link>.
export function StoreBadges() {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {tiendas.map((tienda) => (
        <Tooltip key={tienda.linea2} title="Próximamente">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2.25,
              py: 1.25,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              color: 'text.disabled',
              cursor: 'not-allowed',
              userSelect: 'none',
            }}
          >
            <tienda.Icono fontSize="medium" />
            <Box>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.2 }}>
                {tienda.linea1}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.secondary' }}>
                {tienda.linea2}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}
