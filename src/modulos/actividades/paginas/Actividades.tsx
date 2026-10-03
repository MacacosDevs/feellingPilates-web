import { useControlActividades } from '../hooks/useControlActividades';
import { VistaActividades } from '../componentes/VistaActividades';

export function Actividades() {
  const control = useControlActividades();
  return <VistaActividades control={control} />;
}
