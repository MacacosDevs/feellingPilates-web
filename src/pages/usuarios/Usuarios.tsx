import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SearchIcon from '@mui/icons-material/Search';
import { DataTable, type ColumnaTabla } from '../../components/DataTable';
import { useAuthStore } from '../../auth/authStore';
import { conteoUsuariosPorRol, listarUsuarios, reactivarUsuario, suspenderUsuario } from '../../api/usuariosAdmin';
import type { Pagina, RolConteoResponse, UsuarioResponse } from '../../api/types';
import { DialogoCrearCliente } from './DialogoCrearCliente';
import { DialogoCrearPersonal } from './DialogoCrearPersonal';
import { DialogoContrasenaTemporal } from './DialogoContrasenaTemporal';
import { DialogoEditarUsuario } from './DialogoEditarUsuario';

const ESTATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  activo: 'success',
  suspendido: 'warning',
  eliminado: 'error',
};

const ESTATUS_LABEL: Record<string, string> = {
  activo: 'Activo',
  suspendido: 'Suspendido',
  eliminado: 'Eliminado',
};

const ROL_INFO: Record<string, { etiqueta: string; color: string }> = {
  SUPER_ADMIN: { etiqueta: 'Super admin', color: '#7c3aed' },
  ADMIN: { etiqueta: 'Admin', color: '#2563eb' },
  PERSONAL: { etiqueta: 'Recepción', color: '#0d9488' },
  INSTRUCTOR: { etiqueta: 'Instructor', color: '#d97706' },
  CLIENTE: { etiqueta: 'Cliente', color: '#64748b' },
};

function rolInfo(rol: string) {
  if (ROL_INFO[rol]) return ROL_INFO[rol];
  const etiqueta = rol
    .toLowerCase()
    .split('_')
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
  return { etiqueta, color: '#64748b' };
}

type ColumnaUsuario = 'usuario' | 'telefono' | 'estatus' | 'creadoEn';

const SORT_PROP_USUARIO: Record<ColumnaUsuario, string> = {
  usuario: 'nombre',
  telefono: 'telefono',
  estatus: 'estatus',
  creadoEn: 'creadoEn',
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });
}

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

export function Usuarios() {
  const usuario = useAuthStore((state) => state.usuario);
  const esAdmin = usuario?.roles.some((rol) => rol === 'ADMIN' || rol === 'SUPER_ADMIN') ?? false;
  const puedeActivar = usuario?.roles.some((rol) => rol === 'ADMIN' || rol === 'PERSONAL' || rol === 'SUPER_ADMIN') ?? false;

  const [pagina, setPagina] = useState<Pagina<UsuarioResponse> | null>(null);
  const [numeroPagina, setNumeroPagina] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [cargando, setCargando] = useState(true);
  const [dialogoCliente, setDialogoCliente] = useState(false);
  const [dialogoPersonal, setDialogoPersonal] = useState(false);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [contrasenaTemporal, setContrasenaTemporal] = useState<{ correo: string; contrasenaTemporal: string } | null>(
    null,
  );
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioResponse | null>(null);
  const [menuAltaAnchor, setMenuAltaAnchor] = useState<HTMLElement | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [conteos, setConteos] = useState<RolConteoResponse[]>([]);
  const [orderBy, setOrderBy] = useState<ColumnaUsuario>('usuario');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const timeout = setTimeout(() => setBusquedaDebounced(busqueda.trim()), 350);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  const sortProp = SORT_PROP_USUARIO[orderBy];

  const cargar = useCallback(
    async (page: number, rol: string | null, texto: string, sort: string, direccion: 'asc' | 'desc', size: number) => {
      setCargando(true);
      try {
        const resultado = await listarUsuarios({
          page,
          size,
          rol: rol ?? undefined,
          busqueda: texto || undefined,
          sort: `${sort},${direccion}`,
        });
        setPagina(resultado);
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  const cargarConteos = useCallback(async () => {
    try {
      setConteos(await conteoUsuariosPorRol());
    } catch {
      // el resumen de roles es informativo; si falla no bloquea la tabla
    }
  }, []);

  useEffect(() => {
    cargar(numeroPagina, rolSeleccionado, busquedaDebounced, sortProp, order, tamanoPagina);
  }, [cargar, numeroPagina, rolSeleccionado, busquedaDebounced, sortProp, order, tamanoPagina]);

  useEffect(() => {
    cargarConteos();
  }, [cargarConteos]);

  useEffect(() => {
    setNumeroPagina(0);
  }, [rolSeleccionado, busquedaDebounced]);

  const totalUsuarios = useMemo(() => conteos.reduce((acc, c) => acc + Number(c.total), 0), [conteos]);

  const columnasUsuarios: ColumnaTabla[] = useMemo(() => {
    const base: ColumnaTabla[] = [
      { id: 'usuario', label: 'Usuario', ordenable: true },
      { id: 'roles', label: 'Roles' },
      { id: 'telefono', label: 'Teléfono', ordenable: true },
      { id: 'estatus', label: 'Estatus', ordenable: true },
      { id: 'creadoEn', label: 'Fecha', ordenable: true },
    ];
    if (esAdmin || puedeActivar) base.push({ id: 'acciones', label: 'Acciones', align: 'right' });
    return base;
  }, [esAdmin, puedeActivar]);

  function alCambiarOrden(columna: string) {
    const col = columna as ColumnaUsuario;
    if (orderBy === col) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(col);
      setOrder('asc');
    }
    setNumeroPagina(0);
  }

  async function handleCambiarEstatus(u: UsuarioResponse) {
    setAccionando(u.id);
    try {
      if (u.estatus === 'activo') {
        await suspenderUsuario(u.id);
      } else {
        await reactivarUsuario(u.id);
      }
      await cargar(numeroPagina, rolSeleccionado, busquedaDebounced, sortProp, order, tamanoPagina);
      cargarConteos();
    } finally {
      setAccionando(null);
    }
  }

  function seleccionarRol(rol: string | null) {
    setRolSeleccionado((actual) => (actual === rol ? null : rol));
  }

  const segmentos: Array<{ rol: string | null; etiqueta: string; color: string; total: number }> = [
    { rol: null, etiqueta: 'Todos', color: '#334155', total: totalUsuarios },
    ...conteos
      .slice()
      .sort((a, b) => Number(b.total) - Number(a.total))
      .map((c) => ({
        rol: c.rol,
        etiqueta: rolInfo(c.rol).etiqueta,
        color: rolInfo(c.rol).color,
        total: Number(c.total),
      })),
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/" underline="hover" color="text.secondary">
          Inicio
        </MuiLink>
        <Typography color="text.primary">Usuarios</Typography>
      </Breadcrumbs>

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', rowGap: 1 }}>
        {segmentos.map((segmento) => {
          const seleccionado = rolSeleccionado === segmento.rol;
          return (
            <Chip
              key={segmento.etiqueta}
              onClick={() => seleccionarRol(segmento.rol)}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>{segmento.etiqueta}</span>
                  <Box
                    component="span"
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      px: 0.75,
                      borderRadius: 10,
                      bgcolor: seleccionado ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {segmento.total}
                  </Box>
                </Box>
              }
              sx={{
                px: 1,
                py: 2.5,
                fontWeight: 600,
                bgcolor: seleccionado ? segmento.color : 'transparent',
                color: seleccionado ? '#fff' : 'text.primary',
                border: '1px solid',
                borderColor: seleccionado ? segmento.color : 'divider',
                '&:hover': { bgcolor: seleccionado ? segmento.color : 'action.hover' },
              }}
            />
          );
        })}
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo"
          size="small"
          sx={{ width: { xs: '100%', sm: 340 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setMenuAltaAnchor(e.currentTarget)}
          >
            Nuevo usuario
          </Button>
          <Menu anchorEl={menuAltaAnchor} open={menuAltaAnchor !== null} onClose={() => setMenuAltaAnchor(null)}>
            <MenuItem
              onClick={() => {
                setDialogoCliente(true);
                setMenuAltaAnchor(null);
              }}
            >
              Nuevo cliente
            </MenuItem>
            {esAdmin && (
              <MenuItem
                onClick={() => {
                  setDialogoPersonal(true);
                  setMenuAltaAnchor(null);
                }}
              >
                Nuevo personal
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
      <DataTable
        columnas={columnasUsuarios}
        filas={pagina?.content ?? []}
        obtenerClave={(u) => u.id}
        cargando={cargando}
        ordenPor={orderBy}
        orden={order}
        onOrdenar={alCambiarOrden}
        iconoVacio={<PersonSearchIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
        textoVacio="No hay usuarios que coincidan con este filtro"
        paginacion={{
          total: pagina?.totalElements ?? 0,
          page: numeroPagina,
          rowsPerPage: tamanoPagina,
          onPageChange: setNumeroPagina,
          onRowsPerPageChange: (size) => {
            setTamanoPagina(size);
            setNumeroPagina(0);
          },
        }}
        renderFila={(u) => (
          <TableRow hover>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: rolInfo(u.roles[0] ?? '').color, width: 36, height: 36, fontSize: 14 }}>
                  {iniciales(u.nombre)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {u.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {u.correo}
                  </Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {u.roles.map((rol) => (
                  <Chip
                    key={rol}
                    label={rolInfo(rol).etiqueta}
                    size="small"
                    sx={{
                      bgcolor: `${rolInfo(rol).color}1a`,
                      color: rolInfo(rol).color,
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </TableCell>
            <TableCell>
              <Typography variant="body2" color={u.telefono ? 'text.primary' : 'text.disabled'}>
                {u.telefono || 'Sin teléfono'}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={ESTATUS_LABEL[u.estatus] ?? u.estatus}
                size="small"
                color={ESTATUS_COLOR[u.estatus] ?? 'default'}
                variant={u.estatus === 'activo' ? 'filled' : 'outlined'}
              />
            </TableCell>
            <TableCell sx={{ color: 'text.secondary' }}>{formatearFecha(u.creadoEn)}</TableCell>
            {(esAdmin || puedeActivar) && (
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                  {esAdmin && (
                    <Tooltip title="Editar usuario">
                      <IconButton size="small" onClick={() => setUsuarioEditando(u)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {puedeActivar && u.estatus !== 'eliminado' && (
                    <Tooltip title={u.estatus === 'activo' ? 'Suspender acceso' : 'Reactivar acceso'}>
                      <span>
                        <IconButton
                          size="small"
                          color={u.estatus === 'activo' ? 'error' : 'success'}
                          disabled={accionando === u.id}
                          onClick={() => handleCambiarEstatus(u)}
                        >
                          {u.estatus === 'activo' ? (
                            <BlockIcon fontSize="small" />
                          ) : (
                            <CheckCircleOutlineIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
            )}
          </TableRow>
        )}
      />
      </Box>

      <DialogoCrearCliente
        abierto={dialogoCliente}
        onCerrar={() => setDialogoCliente(false)}
        onCreado={(usuario) => {
          setMensaje(`Invitación enviada a ${usuario.correo}`);
          cargar(numeroPagina, rolSeleccionado, busquedaDebounced, sortProp, order, tamanoPagina);
          cargarConteos();
        }}
      />
      <DialogoCrearPersonal
        abierto={dialogoPersonal}
        onCerrar={() => setDialogoPersonal(false)}
        onCreado={(correo, contrasenaTemporal) => {
          setContrasenaTemporal({ correo, contrasenaTemporal });
          cargar(numeroPagina, rolSeleccionado, busquedaDebounced, sortProp, order, tamanoPagina);
          cargarConteos();
        }}
      />
      <DialogoContrasenaTemporal datos={contrasenaTemporal} onCerrar={() => setContrasenaTemporal(null)} />
      <DialogoEditarUsuario
        usuario={usuarioEditando}
        onCerrar={() => setUsuarioEditando(null)}
        onActualizado={() => {
          setMensaje('Usuario actualizado');
          cargar(numeroPagina, rolSeleccionado, busquedaDebounced, sortProp, order, tamanoPagina);
        }}
      />

      <Snackbar open={mensaje !== null} autoHideDuration={4000} onClose={() => setMensaje(null)} message={mensaje} />
    </Box>
  );
}
