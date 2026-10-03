import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function VentaBreadcrumbs({ actual }: { actual: string }) {
  return (
    <Breadcrumbs sx={{ mb: 2 }}>
      <MuiLink component={RouterLink} to="/" underline="hover" color="text.secondary">
        Inicio
      </MuiLink>
      <Typography color="text.secondary">Ventas</Typography>
      <Typography color="text.primary">{actual}</Typography>
    </Breadcrumbs>
  );
}
