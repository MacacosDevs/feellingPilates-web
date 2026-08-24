import { useState, type ReactNode } from 'react';
import {
  Box,
  Collapse,
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
import { useAuthStore } from '../auth/authStore';

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

export function Sidebar({ abierto }: SidebarProps) {
  const usuario = useAuthStore((state) => state.usuario);
  const location = useLocation();
  const navigate = useNavigate();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

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
      sx={{
        width: abierto ? 240 : 72,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: abierto ? 2.5 : 2, py: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          {abierto ? 'Feeling Pilates' : 'FP'}
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1, px: 1, py: 0 }}>
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
                sx={{ ...navLinkStyles, justifyContent: abierto ? 'flex-start' : 'center', px: abierto ? 1.5 : 1 }}
              >
                <ListItemIcon sx={{ minWidth: abierto ? 32 : 'auto', justifyContent: 'center' }}>
                  {item.icono}
                </ListItemIcon>
                {abierto && (
                  <ListItemText
                    primary={item.etiqueta}
                    primaryTypographyProps={{ fontSize: 14, noWrap: true }}
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

          const encabezado = (
            <ListItemButton
              key={clave}
              onClick={() => {
                setOverrides((prev) => ({ ...prev, [clave]: true }));
                if (objetivo && location.pathname !== objetivo) {
                  navigate(objetivo);
                }
              }}
              sx={{
                ...navLinkStyles,
                justifyContent: abierto ? 'flex-start' : 'center',
                px: abierto ? 1.5 : 1,
                ...(activo
                  ? { backgroundColor: 'action.selected', color: 'text.primary', fontWeight: 600 }
                  : {}),
              }}
            >
              <ListItemIcon sx={{ minWidth: abierto ? 32 : 'auto', justifyContent: 'center' }}>
                {item.icono}
              </ListItemIcon>
              {abierto && (
                <>
                  <ListItemText primary={item.etiqueta} primaryTypographyProps={{ fontSize: 14, noWrap: true }} />
                  <Box
                    component="span"
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverrides((prev) => ({ ...prev, [clave]: !abiertoGrupo }));
                    }}
                    sx={{ display: 'flex', alignItems: 'center', p: 0.25, borderRadius: 1 }}
                  >
                    {abiertoGrupo ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  </Box>
                </>
              )}
            </ListItemButton>
          );

          return (
            <Box key={clave}>
              {abierto ? (
                encabezado
              ) : (
                <Tooltip title={item.etiqueta} placement="right">
                  {encabezado}
                </Tooltip>
              )}
              {abierto && (
                <Collapse in={abiertoGrupo} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 1.5 }}>
                    {item.to && (
                      <ListItemButton component={NavLink} to={item.to} end sx={{ ...subNavLinkStyles, px: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Gestionar usuarios"
                          primaryTypographyProps={{ fontSize: 13, noWrap: true }}
                        />
                      </ListItemButton>
                    )}
                    {item.hijos?.map((hijo) => (
                      <ListItemButton
                        key={hijo.to}
                        component={NavLink}
                        to={hijo.to}
                        end={hijo.end}
                        sx={{ ...subNavLinkStyles, px: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, '& svg': { fontSize: 18 } }}>{hijo.icono}</ListItemIcon>
                        <ListItemText
                          primary={hijo.etiqueta}
                          primaryTypographyProps={{ fontSize: 13, noWrap: true }}
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
