import { useMemo, useState } from 'react';
import type { KeyboardEvent, Ref, SyntheticEvent } from 'react';
import {
  AppBar,
  Autocomplete,
  Box,
  IconButton,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/authStore';

interface ComandoBusqueda {
  etiqueta: string;
  ruta: string;
  palabrasClave: string[];
}

interface HeaderProps {
  sidebarAbierto: boolean;
  onToggleSidebar: () => void;
  triggerRef?: Ref<HTMLButtonElement>;
  navegacionId?: string;
}

export function Cabecera({ sidebarAbierto, onToggleSidebar, triggerRef, navegacionId }: HeaderProps) {
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');

  const esSuperAdmin = usuario?.roles.includes('SUPER_ADMIN') ?? false;
  const esAdminOPersonal = esSuperAdmin || (usuario?.roles.some((rol) => rol === 'ADMIN' || rol === 'PERSONAL') ?? false);

  const comandos = useMemo<ComandoBusqueda[]>(() => {
    const lista: ComandoBusqueda[] = [
      { etiqueta: 'Mi perfil', ruta: '/', palabrasClave: ['perfil', 'mi perfil', 'cuenta', 'mi cuenta'] },
    ];
    if (esAdminOPersonal) {
      lista.push({
        etiqueta: 'Usuarios',
        ruta: '/usuarios',
        palabrasClave: ['usuarios', 'usuario', 'clientes', 'cliente', 'personal', 'recepcion', 'recepcionista', 'instructor'],
      });
    }
    if (esSuperAdmin) {
      lista.push({
        etiqueta: 'Roles y permisos',
        ruta: '/roles',
        palabrasClave: ['roles', 'rol', 'permisos', 'permiso'],
      });
    }
    return lista;
  }, [esAdminOPersonal, esSuperAdmin]);

  function irAComando(comando: ComandoBusqueda | null) {
    if (!comando) return;
    navigate(comando.ruta);
    setBusqueda('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter') return;
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return;
    const coincidencia = comandos.find(
      (c) => c.etiqueta.toLowerCase().includes(texto) || c.palabrasClave.some((palabra) => palabra.includes(texto)),
    );
    if (coincidencia) irAComando(coincidencia);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!usuario) return null;

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0, minWidth: 0 }}
    >
      <Toolbar sx={{ gap: 2, minWidth: 0 }}>
        <IconButton ref={triggerRef} onClick={onToggleSidebar} edge="start" aria-label={sidebarAbierto ? 'Cerrar navegación' : 'Abrir navegación'} aria-expanded={sidebarAbierto} aria-controls={navegacionId} sx={{ flexShrink: 0 }}>
          <MenuIcon />
        </IconButton>

        <Autocomplete
          size="small"
          options={comandos}
          getOptionLabel={(opcion) => opcion.etiqueta}
          inputValue={busqueda}
          onInputChange={(_: SyntheticEvent, valor: string) => setBusqueda(valor)}
          onChange={(_: SyntheticEvent, valor: ComandoBusqueda | null) => irAComando(valor)}
          filterOptions={(opciones, estado) => {
            const texto = estado.inputValue.trim().toLowerCase();
            if (!texto) return opciones;
            return opciones.filter(
              (o) => o.etiqueta.toLowerCase().includes(texto) || o.palabrasClave.some((palabra) => palabra.includes(texto)),
            );
          }}
          sx={{ width: { xs: 200, sm: 320 }, minWidth: 160, flexShrink: 1 }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Buscar secciones (usuarios, permisos...)"
              onKeyDown={handleKeyDown}
              slotProps={{
                ...params.slotProps,
                htmlInput: { ...params.slotProps.htmlInput, 'aria-label': 'Buscar secciones' },
                input: {
                  ...params.slotProps.input,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Box sx={{ flexGrow: 1, minWidth: 0 }} />

        <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, flexShrink: 1 }}>
          Bienvenido, {usuario.nombre}
        </Typography>

        <Tooltip title="Cerrar sesión">
          <IconButton size="small" onClick={handleLogout} aria-label="Cerrar sesión" sx={{ flexShrink: 0 }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
