import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './authStore';

interface RutaConRolProps {
  rolesPermitidos: string[];
}

export function RutaConRol({ rolesPermitidos }: RutaConRolProps) {
  const usuario = useAuthStore((state) => state.usuario);

  if (!usuario || !usuario.roles.some((rol) => rolesPermitidos.includes(rol))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
