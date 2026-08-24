import { useEffect, useMemo, useState } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { actualizarPermisosRol, actualizarRol, crearRol, listarPermisos, listarRoles } from '../../api/roles';
import type { ApiErrorBody, PermisoResponse, RolResponse } from '../../api/types';

function extraerMensajeError(err: unknown, mensajePorDefecto: string): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.message ?? mensajePorDefecto;
  }
  return mensajePorDefecto;
}

interface DialogRol {
  modo: 'crear' | 'editar';
  rolId: string | null;
  nombre: string;
  descripcion: string;
}

interface Feedback {
  severidad: 'success' | 'error';
  texto: string;
}

const ICONO_POR_CATEGORIA: Record<string, SvgIconComponent> = {
  USUARIOS: PeopleOutlineIcon,
  ROLES: AdminPanelSettingsOutlinedIcon,
  RESERVAS: EventAvailableOutlinedIcon,
  PAGOS: PaymentsOutlinedIcon,
  CLASES: SelfImprovementOutlinedIcon,
};

const ETIQUETA_POR_CATEGORIA: Record<string, string> = {
  USUARIOS: 'Usuarios',
  ROLES: 'Roles',
  RESERVAS: 'Reservas',
  PAGOS: 'Pagos',
  CLASES: 'Clases',
};

// Los permisos de Ventas siguen la convencion venta.<modulo>.<accion>; se
// agrupan visualmente por modulo dentro de la categoria PAGOS.
const SUBGRUPOS_PAGOS: { prefijo: string; etiqueta: string }[] = [
  { prefijo: 'venta.registrar.', etiqueta: 'Nueva venta' },
  { prefijo: 'venta.gestion.', etiqueta: 'Gestión de ventas' },
  { prefijo: 'venta.servicios.', etiqueta: 'Servicios' },
];

function subgrupoDe(codigo: string): string | null {
  return SUBGRUPOS_PAGOS.find((s) => codigo.startsWith(s.prefijo))?.etiqueta ?? null;
}

export function Roles() {
  const [roles, setRoles] = useState<RolResponse[]>([]);
  const [permisos, setPermisos] = useState<PermisoResponse[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, Set<string>>>({});
  const [rolActivoId, setRolActivoId] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [dialogoRol, setDialogoRol] = useState<DialogRol | null>(null);
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [errorDialogoRol, setErrorDialogoRol] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarRoles(), listarPermisos()]).then(([rolesData, permisosData]) => {
      setRoles(rolesData);
      setPermisos(permisosData);
      setSeleccion(Object.fromEntries(rolesData.map((r) => [r.id, new Set(r.permisos)])));
      setRolActivoId(rolesData[0]?.id ?? null);
      setCargando(false);
    });
  }, []);

  const categorias = useMemo(() => {
    const grupos = new Map<string, PermisoResponse[]>();
    for (const permiso of permisos) {
      const lista = grupos.get(permiso.categoria) ?? [];
      lista.push(permiso);
      grupos.set(permiso.categoria, lista);
    }
    return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permisos]);

  useEffect(() => {
    if (categoriaActiva === null && categorias.length > 0) {
      setCategoriaActiva(categorias[0][0]);
    }
  }, [categorias, categoriaActiva]);

  const rolActivo = roles.find((r) => r.id === rolActivoId) ?? null;
  const permisosCategoria = categorias.find(([categoria]) => categoria === categoriaActiva)?.[1] ?? [];
  const seleccionRol = rolActivo ? seleccion[rolActivo.id] ?? new Set<string>() : new Set<string>();

  const gruposPermisosCategoria = useMemo(() => {
    const porSubgrupo = new Map<string | null, PermisoResponse[]>();
    for (const p of permisosCategoria) {
      const clave = subgrupoDe(p.codigo);
      const lista = porSubgrupo.get(clave) ?? [];
      lista.push(p);
      porSubgrupo.set(clave, lista);
    }
    const orden: (string | null)[] = [null, ...SUBGRUPOS_PAGOS.map((s) => s.etiqueta)];
    return orden
      .filter((clave) => porSubgrupo.has(clave))
      .map((clave) => [clave, porSubgrupo.get(clave)!] as const);
  }, [permisosCategoria]);

  const huboCambios = useMemo(() => {
    if (!rolActivo) return false;
    const original = new Set(rolActivo.permisos);
    const actual = seleccion[rolActivo.id] ?? new Set();
    if (original.size !== actual.size) return true;
    return [...original].some((codigo) => !actual.has(codigo));
  }, [rolActivo, seleccion]);

  function toggle(codigo: string) {
    if (!rolActivo || !rolActivo.editable) return;
    setSeleccion((prev) => {
      const actual = new Set(prev[rolActivo.id]);
      if (actual.has(codigo)) {
        actual.delete(codigo);
      } else {
        actual.add(codigo);
      }
      return { ...prev, [rolActivo.id]: actual };
    });
  }

  async function guardar() {
    if (!rolActivo) return;
    setGuardando(true);
    try {
      const actualizado = await actualizarPermisosRol(rolActivo.id, Array.from(seleccion[rolActivo.id] ?? []));
      setRoles((prev) => prev.map((r) => (r.id === rolActivo.id ? actualizado : r)));
      setFeedback({ severidad: 'success', texto: `Permisos de ${rolActivo.nombre} actualizados` });
    } catch (err) {
      setFeedback({ severidad: 'error', texto: extraerMensajeError(err, 'No se pudieron guardar los permisos.') });
    } finally {
      setGuardando(false);
    }
  }

  async function guardarRol() {
    if (!dialogoRol || !dialogoRol.nombre.trim()) return;
    setGuardandoRol(true);
    setErrorDialogoRol(null);
    try {
      const descripcion = dialogoRol.descripcion.trim() || null;
      if (dialogoRol.modo === 'crear') {
        const nuevo = await crearRol({ nombre: dialogoRol.nombre.trim(), descripcion });
        setRoles((prev) => [...prev, nuevo]);
        setSeleccion((prev) => ({ ...prev, [nuevo.id]: new Set(nuevo.permisos) }));
        setRolActivoId(nuevo.id);
        setFeedback({ severidad: 'success', texto: `Rol ${nuevo.nombre} creado` });
      } else if (dialogoRol.rolId) {
        const actualizado = await actualizarRol(dialogoRol.rolId, { nombre: dialogoRol.nombre.trim(), descripcion });
        setRoles((prev) => prev.map((r) => (r.id === actualizado.id ? actualizado : r)));
        setFeedback({ severidad: 'success', texto: `Rol ${actualizado.nombre} actualizado` });
      }
      setDialogoRol(null);
    } catch (err) {
      setErrorDialogoRol(extraerMensajeError(err, 'No se pudo guardar el rol.'));
    } finally {
      setGuardandoRol(false);
    }
  }

  if (cargando || !rolActivo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 880, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Typography variant="h4" gutterBottom>
        Roles y permisos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Elige un rol, luego una categoría, y activa o desactiva lo que puede hacer.
      </Typography>

      <Stack direction="row" sx={{ alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', mb: 3, flexShrink: 0 }}>
        <Tabs
          value={rolActivo.id}
          onChange={(_, nuevoId) => setRolActivoId(nuevoId)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flexGrow: 1, minWidth: 0 }}
        >
          {roles.map((rol) => (
            <Tab key={rol.id} value={rol.id} label={rol.nombre} />
          ))}
        </Tabs>

        {rolActivo.editable && (
          <Tooltip title="Editar nombre y descripción del rol">
            <IconButton
              size="small"
              sx={{ mx: 1 }}
              onClick={() => {
                setErrorDialogoRol(null);
                setDialogoRol({
                  modo: 'editar',
                  rolId: rolActivo.id,
                  nombre: rolActivo.nombre,
                  descripcion: rolActivo.descripcion ?? '',
                });
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Button
          size="small"
          startIcon={<AddIcon />}
          sx={{ whiteSpace: 'nowrap' }}
          onClick={() => {
            setErrorDialogoRol(null);
            setDialogoRol({ modo: 'crear', rolId: null, nombre: '', descripcion: '' });
          }}
        >
          Nuevo rol
        </Button>
      </Stack>

      {!rolActivo.editable && (
        <Alert severity="info" sx={{ mb: 2, flexShrink: 0 }}>
          {rolActivo.nombre} siempre tiene todos los permisos, incluidos los que se agreguen a futuro. No es
          editable.
        </Alert>
      )}

      <Stack
        direction="row"
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          flex: '1 1 auto',
          minHeight: 380,
        }}
      >
        <Stack
          sx={{
            width: 220,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            py: 1,
            overflowY: 'auto',
          }}
        >
          {categorias.map(([categoria, permisosDeCategoria]) => {
            const Icono = ICONO_POR_CATEGORIA[categoria] ?? CategoryOutlinedIcon;
            const activos = permisosDeCategoria.filter((p) => seleccionRol.has(p.codigo)).length;
            const seleccionada = categoria === categoriaActiva;

            return (
              <Box
                key={categoria}
                component="button"
                onClick={() => setCategoriaActiva(categoria)}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 2,
                  py: 1.25,
                  bgcolor: seleccionada ? 'background.paper' : 'transparent',
                  borderLeft: '3px solid',
                  borderColor: seleccionada ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                <Icono fontSize="small" color={seleccionada ? 'primary' : 'action'} />
                <Typography variant="body2" sx={{ fontWeight: seleccionada ? 600 : 400, flexGrow: 1 }}>
                  {ETIQUETA_POR_CATEGORIA[categoria] ?? categoria}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activos}/{permisosDeCategoria.length}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
          {gruposPermisosCategoria.map(([subgrupo, permisosDelGrupo], indiceGrupo) => (
            <Box key={subgrupo ?? '__general__'}>
              {subgrupo && (
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    px: 2.5,
                    pt: indiceGrupo > 0 ? 2 : 1.25,
                    pb: 0.5,
                    borderTop: indiceGrupo > 0 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  {subgrupo}
                </Typography>
              )}
              {permisosDelGrupo.map((permiso, i) => (
                <Box
                  key={permiso.codigo}
                  sx={{
                    px: 2.5,
                    py: 1.25,
                    borderTop: !subgrupo && i > 0 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', maxWidth: 560 }}>
                    <Box>
                      <Typography variant="body2">{permiso.descripcion || permiso.codigo}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {permiso.codigo}
                      </Typography>
                    </Box>
                    <Switch
                      checked={seleccionRol.has(permiso.codigo)}
                      disabled={!rolActivo.editable}
                      onChange={() => toggle(permiso.codigo)}
                    />
                  </Stack>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Stack>

      {rolActivo.editable && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, flexShrink: 0 }}>
          <Button variant="contained" disabled={!huboCambios || guardando} onClick={guardar}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Box>
      )}

      <Snackbar open={feedback !== null} autoHideDuration={5000} onClose={() => setFeedback(null)}>
        {feedback ? (
          <Alert severity={feedback.severidad} onClose={() => setFeedback(null)} variant="filled" sx={{ width: '100%' }}>
            {feedback.texto}
          </Alert>
        ) : undefined}
      </Snackbar>

      <Dialog open={dialogoRol !== null} onClose={() => setDialogoRol(null)} fullWidth maxWidth="xs">
        <DialogTitle>{dialogoRol?.modo === 'crear' ? 'Nuevo rol' : 'Editar rol'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorDialogoRol && <Alert severity="error">{errorDialogoRol}</Alert>}
            <TextField
              label="Nombre"
              value={dialogoRol?.nombre ?? ''}
              onChange={(e) => setDialogoRol((prev) => (prev ? { ...prev, nombre: e.target.value } : prev))}
              autoFocus
              fullWidth
            />
            <TextField
              label="Descripción"
              value={dialogoRol?.descripcion ?? ''}
              onChange={(e) => setDialogoRol((prev) => (prev ? { ...prev, descripcion: e.target.value } : prev))}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoRol(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!dialogoRol?.nombre.trim() || guardandoRol}
            onClick={guardarRol}
          >
            {guardandoRol ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
