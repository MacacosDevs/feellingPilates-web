import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  TextField,
} from '@mui/material';
import { isAxiosError } from 'axios';
import {
  actualizarEspecialidadesUsuario,
  actualizarSedesUsuario,
  actualizarUsuario,
  listarEspecialidadesUsuario,
} from '../../api/usuariosAdmin';
import { listarSalones } from '../../api/salones';
import { listarTiposActividad } from '../../api/catalogos';
import { SelectorMultipleBusqueda } from '../../components/SelectorMultipleBusqueda';
import type { ApiErrorBody, SalonResponse, TipoActividadResponse, UsuarioResponse } from '../../api/types';

interface DialogoEditarUsuarioProps {
  usuario: UsuarioResponse | null;
  onCerrar: () => void;
  onActualizado: (usuario: UsuarioResponse) => void;
}

// El cliente puede ir a cualquier sede: nunca se le asigna una, ni al editar.
const ROLES_CON_SEDE = ['PERSONAL', 'INSTRUCTOR'];
const ROLES_QUE_REQUIEREN_SEDE = ['PERSONAL', 'INSTRUCTOR'];

const ROL_ETIQUETA: Record<string, string> = {
  PERSONAL: 'Recepción',
  INSTRUCTOR: 'Instructor',
};

export function DialogoEditarUsuario({ usuario, onCerrar, onActualizado }: DialogoEditarUsuarioProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [salones, setSalones] = useState<SalonResponse[]>([]);
  const [sedesPorRol, setSedesPorRol] = useState<Record<string, string[]>>({});
  const [tiposActividad, setTiposActividad] = useState<TipoActividadResponse[]>([]);
  const [especialidadIds, setEspecialidadIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const rolesEditables = usuario?.rolesAsignados.filter((ra) => ROLES_CON_SEDE.includes(ra.rol)) ?? [];
  const esInstructor = usuario?.roles.includes('INSTRUCTOR') ?? false;

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setTelefono(usuario.telefono ?? '');
      setError(null);
      setSedesPorRol(
        Object.fromEntries(
          usuario.rolesAsignados.filter((ra) => ROLES_CON_SEDE.includes(ra.rol)).map((ra) => [ra.rol, ra.salonIds]),
        ),
      );
      listarSalones()
        .then(setSalones)
        .catch(() => setSalones([]));

      if (usuario.roles.includes('INSTRUCTOR')) {
        listarTiposActividad()
          .then(setTiposActividad)
          .catch(() => setTiposActividad([]));
        listarEspecialidadesUsuario(usuario.id)
          .then((especialidades) => setEspecialidadIds(especialidades.map((e) => e.tipoActividadId)))
          .catch(() => setEspecialidadIds([]));
      } else {
        setEspecialidadIds([]);
      }
    }
  }, [usuario]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!usuario) return;
    setError(null);

    for (const rol of ROLES_QUE_REQUIEREN_SEDE) {
      if (rol in sedesPorRol && (sedesPorRol[rol]?.length ?? 0) === 0) {
        setError('Selecciona al menos una sede para el rol correspondiente.');
        return;
      }
    }

    setCargando(true);
    try {
      let actualizado = await actualizarUsuario(usuario.id, {
        nombre,
        telefono: telefono || undefined,
        fotoUrl: usuario.fotoUrl ?? undefined,
        descripcion: usuario.descripcion ?? undefined,
      });
      for (const [rol, salonIds] of Object.entries(sedesPorRol)) {
        actualizado = await actualizarSedesUsuario(usuario.id, rol, salonIds);
      }
      if (esInstructor) {
        await actualizarEspecialidadesUsuario(usuario.id, especialidadIds);
      }
      onActualizado(actualizado);
      onCerrar();
    } catch (err) {
      if (isAxiosError<ApiErrorBody>(err)) {
        setError(err.response?.data?.message ?? 'No se pudo actualizar el usuario.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <Dialog open={usuario !== null} onClose={onCerrar} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar usuario</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} fullWidth />

          {rolesEditables.map((ra) => {
            const seleccion = sedesPorRol[ra.rol] ?? [];
            const requerido = ROLES_QUE_REQUIEREN_SEDE.includes(ra.rol);
            return (
              <Box key={ra.rol}>
                <SelectorMultipleBusqueda
                  label={`Salón — ${ROL_ETIQUETA[ra.rol] ?? ra.rol}`}
                  opciones={salones.map((salon) => ({ id: salon.id, etiqueta: salon.nombre, descripcion: salon.municipioNombre }))}
                  valor={seleccion}
                  onChange={(ids) => setSedesPorRol((actual) => ({ ...actual, [ra.rol]: ids }))}
                  required={requerido}
                  error={requerido && seleccion.length === 0}
                />
                <FormHelperText>
                  {requerido ? 'Selecciona al menos una sede.' : 'Selecciona algún salón para este usuario.'}
                </FormHelperText>
              </Box>
            );
          })}

          {esInstructor && (
            <Box>
              <SelectorMultipleBusqueda
                label="Actividades que puede impartir"
                opciones={tiposActividad.map((t) => ({ id: t.id, etiqueta: t.nombre, descripcion: t.descripcion }))}
                valor={especialidadIds}
                onChange={setEspecialidadIds}
              />
              <FormHelperText>Solo se le podrán asignar reservas de estas actividades.</FormHelperText>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
