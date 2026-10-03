import { useEffect, useRef, useState } from 'react';
import { Box, Container, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Cabecera } from './Cabecera';
import { NavegacionLateral } from './NavegacionLateral';
import { useAuthStore } from '../../auth/authStore';

const navegacionId = 'navegacion-principal';

export function Layout() {
  const theme = useTheme();
  const esMovil = useMediaQuery(theme.breakpoints.down('sm'));
  const usuario = useAuthStore((state) => state.usuario);
  const generacion = useAuthStore((state) => state.generacion);
  const [desktopAbierto, setDesktopAbierto] = useState(false);
  const [movilAbierto, setMovilAbierto] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focoEnNavegacion = useRef(false);
  const modoAnterior = useRef(esMovil);
  const sesionAnterior = useRef({ id: usuario?.id, generacion });
  const cambioModo = modoAnterior.current !== esMovil;
  const cambioSesion = sesionAnterior.current.id !== usuario?.id || sesionAnterior.current.generacion !== generacion;
  // Capture ownership before an exiting Drawer removes its focused node or restores focus.
  const devolverFoco = cambioModo && focoEnNavegacion.current;
  const abiertoMovilActual = movilAbierto && !cambioModo && !cambioSesion;
  const sidebarAbierto = esMovil ? abiertoMovilActual : desktopAbierto;

  useEffect(() => {
    if (cambioModo || cambioSesion) {
      modoAnterior.current = esMovil;
      sesionAnterior.current = { id: usuario?.id, generacion };
      setMovilAbierto(false);
      // Child Modal/TrapFocus cleanup has completed before this handoff.
      if (devolverFoco && usuario) triggerRef.current?.focus();
    }
  }, [cambioModo, cambioSesion, devolverFoco, esMovil, generacion, usuario]);

  return (
    <Box
      onFocusCapture={(event) => {
        focoEnNavegacion.current = (event.target as Element).closest('nav')?.id === navegacionId;
      }}
      onBlurCapture={(event) => {
        const destino = event.relatedTarget;
        focoEnNavegacion.current = destino instanceof Element && destino.closest('nav')?.id === navegacionId;
      }}
      sx={{ display: 'flex', width: '100%', height: '100dvh', minWidth: 0, minHeight: 0 }}
    >
      {usuario && <Drawer
        variant={esMovil ? 'temporary' : 'permanent'}
        open={esMovil ? abiertoMovilActual : true}
        onClose={() => setMovilAbierto(false)}
        sx={{ width: esMovil ? 0 : sidebarAbierto ? 240 : 72, flexShrink: 0 }}
        slotProps={{ paper: {
          'aria-label': esMovil ? 'Navegación principal' : undefined,
          sx: { width: esMovil || sidebarAbierto ? 240 : 72, height: '100dvh', borderRight: 0 },
        } }}
      >
        <NavegacionLateral
          abierto={esMovil || sidebarAbierto}
          id={navegacionId}
          oculto={esMovil && !abiertoMovilActual}
          onDestino={() => { if (esMovil) setMovilAbierto(false); }}
          overrides={overrides}
          onOverridesChange={setOverrides}
        />
      </Drawer>}
      <Box component="main" sx={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <Cabecera
          sidebarAbierto={sidebarAbierto}
          triggerRef={triggerRef}
          navegacionId={!esMovil || abiertoMovilActual ? navegacionId : undefined}
          onToggleSidebar={() => esMovil ? setMovilAbierto((v) => !v) : setDesktopAbierto((v) => !v)}
        />
        <Box sx={{ flex: '1 1 0%', minWidth: 0, minHeight: 0, overflow: 'auto', py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Container maxWidth="xl" disableGutters sx={{ height: '100%', minWidth: 0 }}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
