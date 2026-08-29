import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { DocumentoLegal, Nota, Placeholder, Seccion } from './DocumentoLegal';

const seccionesTerminos = [
  { numero: '01', titulo: 'Aceptación de los términos' },
  { numero: '02', titulo: 'Elegibilidad y cuenta' },
  { numero: '03', titulo: 'Descripción del servicio y naturaleza física' },
  { numero: '04', titulo: 'Reservas, cancelaciones y asistencia' },
  { numero: '05', titulo: 'Paquetes, pagos y reembolsos' },
  { numero: '06', titulo: 'Declaración de salud y asunción de riesgo' },
  { numero: '07', titulo: 'Normas en las instalaciones' },
  { numero: '08', titulo: 'Propiedad intelectual' },
  { numero: '09', titulo: 'Suspensión de cuenta' },
  { numero: '10', titulo: 'Jurisdicción y ley aplicable' },
];

export function TerminosCondiciones() {
  return (
    <DocumentoLegal
      titulo="Términos y condiciones"
      actualizadoEl="Agosto 2026 (borrador)"
      borrador
      secciones={seccionesTerminos}
    >
      <Typography variant="body1" color="text.secondary">
        Feeling Pilates — Términos y Condiciones de uso del servicio y la aplicación. Los datos que se recaban a
        través de la plataforma son del estudio Feeling Pilates, quien presta el servicio de clases y responde
        ante los alumnos.
      </Typography>

      <Seccion numero="01" titulo="Aceptación de los términos">
        <Typography variant="body1" color="text.secondary">
          Al registrar una cuenta o utilizar la aplicación Feeling Pilates, usted acepta estos Términos y
          Condiciones regulados por <Placeholder>NOMBRE DE LA EMPRESA / RAZÓN SOCIAL DEL ESTUDIO</Placeholder>.
          Si no está de acuerdo con alguna cláusula, deberá abstenerse de usar la plataforma y asistir a los
          servicios.
        </Typography>
      </Seccion>

      <Seccion numero="02" titulo="Elegibilidad y cuenta">
        <Typography variant="body1" color="text.secondary">
          Debe ser mayor de <Placeholder>18 AÑOS — confirmar</Placeholder> o contar con la autorización y
          supervisión de su tutor legal.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Usted es responsable de la veracidad de la información ingresada y de resguardar la confidencialidad
          de su contraseña.
        </Typography>
      </Seccion>

      <Seccion numero="03" titulo="Descripción del servicio y naturaleza física de las compras">
        <Typography variant="body1" color="text.secondary">
          Feeling Pilates es una plataforma tecnológica que permite a los alumnos consultar horarios, reservar
          cupos y adquirir paquetes de clases para servicios presenciales de entrenamiento físico (Pilates, Bacu
          Fit y modalidades combinadas) impartidos exclusivamente en nuestras instalaciones físicas. Los pagos
          procesados no corresponden a contenidos ni productos digitales descargables, sino a la reserva y
          acceso a instalaciones y clases presenciales.
        </Typography>
      </Seccion>

      <Seccion numero="04" titulo="Reservas, cancelaciones y asistencia">
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Reservas:</strong> cada reserva garantiza un lugar individual en la clase elegida y
                  descuenta un crédito de su paquete vigente.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Cancelaciones por el usuario:</strong> puede cancelar su reserva sin penalización hasta{' '}
                  <Placeholder>X HORAS antes del inicio programado de la clase</Placeholder>. La clase será
                  reintegrada automáticamente al saldo de su paquete.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Inasistencia (No-show):</strong> si no asiste o no cancela dentro del margen permitido,
                  la clase se considerará consumida y se descontará de su paquete.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Validación de asistencia (Check-in con QR):</strong> el acceso al salón se confirma
                  escaneando el código QR en recepción. Se otorga una tolerancia de{' '}
                  <Placeholder>X MINUTOS</Placeholder> posteriores a la hora de inicio de la clase.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Disponibilidad y lista de espera:</strong> la app no cuenta con lista de espera
                  automática; los lugares liberados por cancelación quedan disponibles en tiempo real para
                  cualquier alumno en la app.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Modificaciones por parte del estudio:</strong> el estudio se reserva el derecho de
                  ajustar horarios o sustituir instructores por causas operativas justificadas. Si una clase es
                  suspendida en su totalidad por indisponibilidad de instructor o causas de fuerza mayor, el
                  crédito será restituido íntegramente a su paquete.
                </>
              }
            />
          </ListItem>
        </List>
      </Seccion>

      <Seccion numero="05" titulo="Paquetes, pagos y reembolsos">
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Precios:</strong> expresados en moneda nacional (MXN) e incluyen los impuestos
                  aplicables.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Pasarela de pago:</strong> los cobros se realizan de forma segura mediante Stripe.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Vigencia y caducidad:</strong> todo paquete tiene una fecha límite de vencimiento
                  informada al momento de la compra. Las clases no utilizadas dentro del periodo de vigencia
                  expiran automáticamente y no son acumulables ni transferibles.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Reembolsos:</strong> los paquetes adquiridos no son reembolsables una vez iniciada su
                  vigencia o utilizado algún crédito, salvo evaluación manual por parte de la administración del
                  estudio ante causas extraordinarias comprobables.
                </>
              }
            />
          </ListItem>
        </List>
      </Seccion>

      <Seccion numero="06" titulo="Declaración de salud y asunción de riesgo">
        <Typography variant="body1" color="text.secondary">
          El pilates y las actividades de acondicionamiento físico conllevan esfuerzo corporal. Al reservar una
          clase, usted declara y acepta que:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Se encuentra en condiciones físicas aptas para la actividad o cuenta con aval médico." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Informará al instructor antes de iniciar cualquier sesión sobre lesiones preexistentes, embarazo o condiciones médicas relevantes." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Participa voluntariamente asumiendo los riesgos inherentes al ejercicio físico, deslindando al estudio y a sus instructores de responsabilidad por lesiones derivadas de la práctica habitual o por omitir instrucciones de seguridad." />
          </ListItem>
        </List>
        <Nota>
          Cláusula sensible — requiere revisión legal. Esta sección limita la responsabilidad del estudio ante
          lesiones ocurridas durante las clases; se recomienda que un abogado la revise antes de publicarla, ya
          que su validez y alcance exacto dependen de la legislación aplicable en el estado.
        </Nota>
      </Seccion>

      <Seccion numero="07" titulo="Normas en las instalaciones y pertenencias personales">
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Llegar puntual a la sesión y seguir las indicaciones del instructor sobre el uso adecuado de los equipos y reformers." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Mantener un trato respetuoso hacia el personal y demás asistentes." />
          </ListItem>
        </List>
        <Nota>
          Objetos personales: el estudio no se hace responsable por el extravío, robo o daño de artículos
          personales, dinero o dispositivos dentro de las instalaciones físicas.
        </Nota>
      </Seccion>

      <Seccion numero="08" titulo="Propiedad intelectual">
        <Typography variant="body1" color="text.secondary">
          Los logotipos, marcas, diseños, software e interfaces de Feeling Pilates son propiedad de{' '}
          <Placeholder>NOMBRE DE LA EMPRESA / RAZÓN SOCIAL DEL ESTUDIO</Placeholder>. Queda prohibida su
          reproducción o distribución sin autorización previa por escrito.
        </Typography>
      </Seccion>

      <Seccion numero="09" titulo="Suspensión de cuenta">
        <Typography variant="body1" color="text.secondary">
          El estudio se reserva el derecho de suspender o cancelar cuentas que incurran en fraudes de pago,
          conductas inapropiadas en el estudio o faltas reiteradas a estas condiciones.
        </Typography>
      </Seccion>

      <Seccion numero="10" titulo="Jurisdicción y ley aplicable">
        <Typography variant="body1" color="text.secondary">
          Estos términos se rigen por las leyes vigentes de los Estados Unidos Mexicanos. Para la resolución de
          controversias, las partes se someten a los tribunales competentes de la ciudad de{' '}
          <Placeholder>CIUDAD Y ESTADO, ej. Santiago de Querétaro, Querétaro</Placeholder>.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Dudas o aclaraciones: <Placeholder>CORREO DE CONTACTO/SOPORTE</Placeholder>
        </Typography>
      </Seccion>
    </DocumentoLegal>
  );
}
