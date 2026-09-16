import { useState } from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Cabecera } from './Cabecera';
import { NavegacionLateral } from './NavegacionLateral';

export function Layout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      <NavegacionLateral abierto={sidebarAbierto} />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh' }}>
        <Cabecera sidebarAbierto={sidebarAbierto} onToggleSidebar={() => setSidebarAbierto((v) => !v)} />
        <Box sx={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto', py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Container maxWidth="xl" disableGutters sx={{ height: '100%' }}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
