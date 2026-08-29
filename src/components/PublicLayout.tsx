import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { publicTheme } from '../theme/publicTheme';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export function PublicLayout() {
  return (
    <ThemeProvider theme={() => publicTheme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          bgcolor: 'background.default',
          color: 'text.primary',
          scrollBehavior: 'smooth',
        }}
      >
        <PublicHeader />
        <Box component="main" sx={{ flex: '1 1 auto' }}>
          <Outlet />
        </Box>
        <PublicFooter />
      </Box>
    </ThemeProvider>
  );
}
