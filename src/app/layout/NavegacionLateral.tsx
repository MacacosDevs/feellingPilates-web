import { useLayoutEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/authStore';

const navLinkStyles = {
  borderRadius: 2,
  marginBottom: 0.25,
  minHeight: 38,
  color: 'text.secondary',
  '&.active': {
    backgroundColor: 'action.selected',
    color: 'text.primary',
    fontWeight: 600,
  },
};

const subNavLinkStyles = {
  ...navLinkStyles,
  minHeight: 34,
};

interface SidebarProps {
  abierto: boolean;
  id?: string;
  oculto?: boolean;
  onDestino?: () => void;
  overrides?: Record<string, boolean>;
  onOverridesChange?: Dispatch<SetStateAction<Record<string, boolean>>>;
}

interface Hijo {
  to: string;
  end?: boolean;
  icono: ReactNode;
  etiqueta: string;
}

interface Item {
  to?: string;
  end?: boolean;
  icono: ReactNode;
  etiqueta: string;
  hijos?: Hijo[];
}

export function NavegacionLateral({ abierto, id, oculto = false, onDestino, overrides: overridesExternos, onOverridesChange }: SidebarProps) {
  const usuario = useAuthStore((state) => state.usuario);
  const location = useLocation();
  const navigate = useNavigate();
  const [overridesLocales, setOverridesLocales] = useState<Record<string, boolean>>({});
  const overrides = overridesExternos ?? overridesLocales;
  const setOverrides = onOverridesChange ?? setOverridesLocales;
  const primarios = useRef<Record<string, HTMLButtonElement | null>>({});
  const focoHijo = useRef<{ clave: string; elemento: HTMLElement } | null>(null);

  useLayoutEffect(() => {
    const foco = focoHijo.current;
    if (!oculto && foco && (!foco.elemento.isConnected || foco.elemento.closest('[inert]'))) {
      primarios.current[foco.clave]?.focus();
      focoHijo.current = null;
    }
  });

  if (!usuario) {
    return null;
  }

  const esSuperAdmin = usuario.roles.includes('SUPER_ADMIN');
  const esAdmin = esSuperAdmin || usuario.roles.includes('ADMIN');
  const esAdminOPersonal = esAdmin || usuario.roles.some((rol) => rol === 'PERSONAL');
  const puedeVerActividades = usuario.permisos.includes('actividades.leer');
  const puedeVerNuevaVenta = usuario.permisos.includes('venta.registrar.vista');
  const puedeVerGestionVentas = usuario.permisos.includes('venta.gestion.vista');
  const puedeVerServiciosVentas = usuario.permisos.includes('venta.servicios.vista');

  const items: Item[] = [
    { to: '/', end: true, icono: <PersonOutlineIcon />, etiqueta: 'Mi perfil' },
    ...(esAdminOPersonal
      ? [
          {
            icono: <GroupOutlinedIcon />,
            etiqueta: 'Usuarios',
            to: '/usuarios',
            hijos: esSuperAdmin
              ? [{ to: '/roles', icono: <AdminPanelSettingsOutlinedIcon />, etiqueta: 'Roles y permisos' }]
              : undefined,
          },
        ]
      : []),
    ...(esAdmin ? [{ to: '/salones', icono: <RoomOutlinedIcon />, etiqueta: 'Salones' }] : []),
    ...(puedeVerActividades
      ? [{ to: '/actividades', icono: <FitnessCenterOutlinedIcon />, etiqueta: 'Actividades' }]
      : []),
    ...(esAdminOPersonal
      ? [
          {
            icono: <EventOutlinedIcon />,
            etiqueta: 'Reservas',
            hijos: [
              { to: '/reservas/agregar', icono: <AddCircleOutlineIcon />, etiqueta: 'Agregar' },
              { to: '/reservas/lista-espera', icono: <HourglassEmptyOutlinedIcon />, etiqueta: 'Lista de espera' },
              { to: '/reservas/cancelaciones', icono: <EventBusyOutlinedIcon />, etiqueta: 'Cancelaciones' },
              { to: '/reservas/configuraciones', icono: <SettingsOutlinedIcon />, etiqueta: 'Configuraciones' },
            ],
          },
        ]
      : []),
    ...(esAdminOPersonal && (puedeVerNuevaVenta || puedeVerGestionVentas || puedeVerServiciosVentas)
      ? [
          {
            icono: <PointOfSaleOutlinedIcon />,
            etiqueta: 'Ventas',
            hijos: [
              ...(puedeVerNuevaVenta
                ? [{ to: '/ventas/nueva', icono: <PointOfSaleOutlinedIcon />, etiqueta: 'Nueva venta' }]
                : []),
              ...(puedeVerGestionVentas
                ? [{ to: '/ventas/gestion', icono: <ReceiptLongOutlinedIcon />, etiqueta: 'Gestión de ventas' }]
                : []),
              ...(puedeVerServiciosVentas
                ? [{ to: '/ventas/servicios', icono: <Inventory2OutlinedIcon />, etiqueta: 'Servicios' }]
                : []),
            ],
          },
        ]
      : []),
  ];

  const tieneHijoActivo = (item: Item) =>
    item.hijos?.some((hijo) => location.pathname.startsWith(hijo.to)) ?? false;

  return (
    <Box
      component="nav"
      id={id}
      aria-label="Navegación principal"
      aria-hidden={oculto || undefined}
      inert={oculto}
      onFocusCapture={() => { focoHijo.current = null; }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focoHijo.current = null;
      }}
      sx={{
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        boxSizing: 'border-box',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <Box sx={{ px: abierto ? 2.5 : 2, py: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          {abierto ? 'Feeling Pilates' : 'FP'}
        </Typography>
      </Box>
      <List sx={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', px: 1, py: 0.5 }}>
        {items.map((item) => {
          const clave = item.to ?? item.etiqueta;
          const tieneHijos = !!item.hijos?.length;

          if (!tieneHijos) {
            const boton = (
              <ListItemButton
                key={clave}
                component={NavLink}
                to={item.to as string}
                end={item.end}
                aria-label={item.etiqueta}
                onClick={onDestino}
                sx={{ ...navLinkStyles, justifyContent: abierto ? 'flex-start' : 'center', px: abierto ? 1.5 : 1 }}
              >
                <ListItemIcon sx={{ minWidth: abierto ? 32 : 'auto', justifyContent: 'center' }}>
                  {item.icono}
                </ListItemIcon>
                {abierto && (
                  <ListItemText
                    primary={item.etiqueta}
                    slotProps={{ primary: { noWrap: true, sx: { fontSize: 14 } } }}
                  />
                )}
              </ListItemButton>
            );
            return abierto ? (
              boton
            ) : (
              <Tooltip key={clave} title={item.etiqueta} placement="right">
                {boton}
              </Tooltip>
            );
          }

          const activo = (item.to && location.pathname === item.to) || tieneHijoActivo(item);
          const abiertoGrupo = overrides[clave] ?? activo;
          const objetivo = item.to ?? item.hijos?.[0]?.to;
          const hijosId = `${id ?? 'navegacion'}-${encodeURIComponent(clave)}-hijos`;

          const encabezado = (
            <ListItemButton
              key={clave}
              component="button"
              type="button"
              ref={(elemento: HTMLButtonElement | null) => { primarios.current[clave] = elemento; }}
              aria-label={item.etiqueta}
              aria-current={location.pathname === objetivo ? 'page' : undefined}
              onClick={() => {
                setOverrides((prev) => ({ ...prev, [clave]: true }));
                if (objetivo && location.pathname !== objetivo) {
                  navigate(objetivo);
                }
                onDestino?.();
              }}
              sx={{
                ...navLinkStyles,
                justifyContent: abierto ? 'flex-start' : 'center',
                px: abierto ? 1.5 : 1,
                flex: 1,
                minWidth: 0,
                ...(activo
                  ? { backgroundColor: 'action.selected', color: 'text.primary', fontWeight: 600 }
                  : {}),
              }}
            >
              <ListItemIcon sx={{ minWidth: abierto ? 32 : 'auto', justifyContent: 'center' }}>
                {item.icono}
              </ListItemIcon>
              {abierto && (
                  <ListItemText
                    primary={item.etiqueta}
                    slotProps={{ primary: { noWrap: true, sx: { fontSize: 14 } } }}
                  />
              )}
            </ListItemButton>
          );

          return (
            <Box key={clave}>
              {abierto ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {encabezado}
                  <IconButton
                    size="small"
                    aria-label={`${abiertoGrupo ? 'Ocultar' : 'Mostrar'} opciones de ${item.etiqueta}`}
                    aria-expanded={!!abiertoGrupo}
                    aria-controls={abiertoGrupo ? hijosId : undefined}
                    onClick={() => setOverrides((prev) => ({ ...prev, [clave]: !abiertoGrupo }))}
                    sx={{ flexShrink: 0, mr: 0.5 }}
                  >
                    {abiertoGrupo ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Box>
              ) : (
                <Tooltip title={item.etiqueta} placement="right">
                  {encabezado}
                </Tooltip>
              )}
              {abierto && (
                <Collapse in={abiertoGrupo} timeout="auto" unmountOnExit>
                  <List
                    id={hijosId}
                    component="div"
                    disablePadding
                    aria-hidden={!abiertoGrupo || undefined}
                    inert={!abiertoGrupo}
                    onFocusCapture={(event) => { focoHijo.current = { clave, elemento: event.target as HTMLElement }; }}
                    sx={{ pl: 1.5 }}
                  >
                    {item.to && (
                      <ListItemButton component={NavLink} to={item.to} end onClick={onDestino} tabIndex={abiertoGrupo ? undefined : -1} sx={{ ...subNavLinkStyles, px: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Gestionar usuarios"
                          slotProps={{ primary: { noWrap: true, sx: { fontSize: 13 } } }}
                        />
                      </ListItemButton>
                    )}
                    {item.hijos?.map((hijo) => (
                      <ListItemButton
                        key={hijo.to}
                        component={NavLink}
                        to={hijo.to}
                        end={hijo.end}
                        onClick={onDestino}
                        tabIndex={abiertoGrupo ? undefined : -1}
                        sx={{ ...subNavLinkStyles, px: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, '& svg': { fontSize: 18 } }}>{hijo.icono}</ListItemIcon>
                        <ListItemText
                          primary={hijo.etiqueta}
                          slotProps={{ primary: { noWrap: true, sx: { fontSize: 13 } } }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );
}
