import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './app/layout/Layout';
import { Login } from './pages/Login';
import { Perfil } from './pages/Perfil';
import { InvitacionAceptar } from './pages/InvitacionAceptar';
import { Usuarios } from './modulos/usuarios/paginas/Usuarios';
import { Roles } from './modulos/roles/paginas/Roles';
import { Salones } from './modulos/salones/paginas/Salones';
import { Actividades } from './modulos/actividades/paginas/Actividades';
import { SalonHorarios } from './pages/salones/SalonHorarios';
import { ReservasAgregar } from './pages/reservas/ReservasAgregar';
import { ReservasListaEspera } from './pages/reservas/ReservasListaEspera';
import { ReservasCancelaciones } from './pages/reservas/ReservasCancelaciones';
import { ReservasConfiguraciones } from './pages/reservas/ReservasConfiguraciones';
import { VentaNueva } from './modulos/ventas/paginas/VentaNueva';
import { VentaGestion } from './modulos/ventas/paginas/VentaGestion';
import { VentaServicios } from './modulos/ventas/paginas/VentaServicios';
import { RutaProtegida } from './auth/RutaProtegida';
import { RutaPublica } from './auth/RutaPublica';
import { RutaConRol } from './auth/RutaConRol';

function App() {
  return (
    <Routes>
      <Route path="/invitacion/:token" element={<InvitacionAceptar />} />
      <Route element={<Layout />}>
        <Route element={<RutaPublica />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<RutaProtegida />}>
          <Route path="/" element={<Perfil />} />
          <Route element={<RutaConRol rolesPermitidos={['SUPER_ADMIN', 'ADMIN', 'PERSONAL']} />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
          <Route element={<RutaConRol rolesPermitidos={['SUPER_ADMIN']} />}>
            <Route path="/roles" element={<Roles />} />
          </Route>
          <Route element={<RutaConRol rolesPermitidos={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/salones" element={<Salones />} />
            <Route path="/salones/:id/horarios" element={<SalonHorarios />} />
          </Route>
          <Route element={<RutaConRol rolesPermitidos={['SUPER_ADMIN', 'ADMIN', 'PERSONAL']} />}>
            <Route path="/actividades" element={<Actividades />} />
          </Route>
          <Route element={<RutaConRol rolesPermitidos={['SUPER_ADMIN', 'ADMIN', 'PERSONAL']} />}>
            <Route path="/reservas/agregar" element={<ReservasAgregar />} />
            <Route path="/reservas/lista-espera" element={<ReservasListaEspera />} />
            <Route path="/reservas/cancelaciones" element={<ReservasCancelaciones />} />
            <Route path="/reservas/configuraciones" element={<ReservasConfiguraciones />} />
          </Route>
          <Route element={<RutaConRol rolesPermitidos={['SUPER_ADMIN', 'ADMIN', 'PERSONAL']} />}>
            <Route path="/ventas/nueva" element={<VentaNueva />} />
            <Route path="/ventas/gestion" element={<VentaGestion />} />
          </Route>
          <Route element={<RutaConRol rolesPermitidos={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/ventas/servicios" element={<VentaServicios />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
