import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { Login } from './pages/Login';
import { Inicio } from './pages/publico/Inicio';
import { Contacto } from './pages/publico/Contacto';
import { TerminosCondiciones } from './pages/publico/TerminosCondiciones';
import { AvisoPrivacidad } from './pages/publico/AvisoPrivacidad';
import { Raiz } from './pages/Raiz';
import { InvitacionAceptar } from './pages/InvitacionAceptar';
import { Usuarios } from './pages/usuarios/Usuarios';
import { Roles } from './pages/roles/Roles';
import { Salones } from './pages/salones/Salones';
import { Actividades } from './pages/actividades/Actividades';
import { SalonHorarios } from './pages/salones/SalonHorarios';
import { ReservasAgregar } from './pages/reservas/ReservasAgregar';
import { ReservasListaEspera } from './pages/reservas/ReservasListaEspera';
import { ReservasCancelaciones } from './pages/reservas/ReservasCancelaciones';
import { ReservasConfiguraciones } from './pages/reservas/ReservasConfiguraciones';
import { VentaNueva } from './pages/ventas/VentaNueva';
import { VentaGestion } from './pages/ventas/VentaGestion';
import { VentaServicios } from './pages/ventas/VentaServicios';
import { RutaProtegida } from './auth/RutaProtegida';
import { RutaPublica } from './auth/RutaPublica';
import { RutaConRol } from './auth/RutaConRol';

function App() {
  return (
    <Routes>
      <Route path="/invitacion/:token" element={<InvitacionAceptar />} />
      <Route element={<PublicLayout />}>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/terminos-y-condiciones" element={<TerminosCondiciones />} />
        <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
      </Route>
      <Route element={<Layout />}>
        <Route path="/" element={<Raiz />} />
        <Route element={<RutaPublica />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<RutaProtegida />}>
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
