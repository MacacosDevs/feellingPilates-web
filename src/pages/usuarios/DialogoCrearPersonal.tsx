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
  MenuItem,
  TextField,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { crearPersonal } from '../../api/usuariosAdmin';
import { listarSalones } from '../../api/salones';
import { SelectorMultipleBusqueda } from '../../components/SelectorMultipleBusqueda';
import type { ApiErrorBody, RolPersonal, SalonResponse } from '../../api/types';

interface DialogoCrearPersonalProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: (correo: string, contrasenaTemporal: string) => void;
}

const OPCIONES_ROL: { value: RolPersonal; label: string }[] = [
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'ADMIN', label: 'Admin' },
];

function requiereSede(rol: RolPersonal) {
  return rol === 'PERSONAL' || rol === 'INSTRUCTOR';
}

export function DialogoCrearPersonal({ abierto, onCerrar, onCreado }: DialogoCrearPersonalProps) {
  const [correo, setCorreo] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<RolPersonal>('PERSONAL');
  const [salones, setSalones] = useState<SalonResponse[]>([]);
  const [salonIds, setSalonIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (abierto) {
      listarSalones()
        .then(setSalones)
        .catch(() => setSalones([]));
    }
  }, [abierto]);

  function limpiarYCerrar() {
    setCorreo('');
    setNombre('');
    setTelefono('');
    setRol('PERSONAL');
    setSalonIds([]);
    setError(null);
    onCerrar();
  }

  function handleCambiarRol(nuevoRol: RolPersonal) {
    setRol(nuevoRol);
    if (!requiereSede(nuevoRol)) {
      setSalonIds([]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (requiereSede(rol) && salonIds.length === 0) {
      setError('Selecciona al menos una sede para este rol.');
      return;
    }
    setCargando(true);
    try {
      const { contrasenaTemporal } = await crearPersonal({
        correo,
        nombre,
        telefono: telefono || undefined,
        rol,
        salonIds: salonIds.length > 0 ? salonIds : undefined,
      });
      onCreado(correo, contrasenaTemporal);
      limpiarYCerrar();
    } catch (err) {
      if (isAxiosError<ApiErrorBody>(err)) {
        setError(err.response?.data?.message ?? 'No se pudo dar de alta al usuario.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <Dialog open={abierto} onClose={limpiarYCerrar} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Nuevo personal</DialogTitle>
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
          <TextField
            label="Correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Rol"
            value={rol}
            onChange={(e) => handleCambiarRol(e.target.value as RolPersonal)}
            fullWidth
          >
            {OPCIONES_ROL.map((opcion) => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </TextField>

          {requiereSede(rol) && (
            <Box>
              <SelectorMultipleBusqueda
                label="Sedes"
                opciones={salones.map((salon) => ({ id: salon.id, etiqueta: salon.nombre, descripcion: salon.municipioNombre }))}
                valor={salonIds}
                onChange={setSalonIds}
                required
                error={salonIds.length === 0}
              />
              <FormHelperText>Selecciona una o varias.</FormHelperText>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={limpiarYCerrar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={cargando}>
            {cargando ? 'Creando...' : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
