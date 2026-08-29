import { Box, Tooltip } from '@mui/material';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsappIcon } from './icons/SocialIcons';

const redes = [
  { etiqueta: 'Instagram', Icono: InstagramIcon },
  { etiqueta: 'Facebook', Icono: FacebookIcon },
  { etiqueta: 'TikTok', Icono: TikTokIcon },
  { etiqueta: 'WhatsApp', Icono: WhatsappIcon },
];

interface SocialLinksProps {
  size?: number;
}

// Solo los íconos por ahora: todavía no hay URLs reales de las redes del
// estudio, así que no son clicables. Cuando se tengan, envolver cada Box en
// <Link href={...} target="_blank" rel="noopener"> y quitar el Tooltip.
export function SocialLinks({ size = 34 }: SocialLinksProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {redes.map((red) => (
        <Tooltip key={red.etiqueta} title={`${red.etiqueta} (próximamente)`}>
          <Box
            sx={{
              width: size,
              height: size,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              color: 'text.secondary',
              cursor: 'default',
            }}
          >
            <red.Icono size={size * 0.5} />
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}
