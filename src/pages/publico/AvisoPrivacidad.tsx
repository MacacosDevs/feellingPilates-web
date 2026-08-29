import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { DocumentoLegal, Nota, Placeholder, Seccion } from './DocumentoLegal';

const seccionesPrivacidad = [
  { numero: '01', titulo: 'Identidad y domicilio del responsable' },
  { numero: '02', titulo: 'Datos personales que recopilamos' },
  { numero: '03', titulo: 'Permisos en el dispositivo' },
  { numero: '04', titulo: 'Finalidad del tratamiento de datos' },
  { numero: '05', titulo: 'Menores de edad' },
  { numero: '06', titulo: 'Transferencia de datos a terceros' },
  { numero: '07', titulo: 'Derechos ARCO y revocación del consentimiento' },
  { numero: '08', titulo: 'Eliminación de cuenta y retención de datos' },
  { numero: '09', titulo: 'Seguridad de la información' },
  { numero: '10', titulo: 'Actualizaciones al aviso de privacidad' },
];

export function AvisoPrivacidad() {
  return (
    <DocumentoLegal
      titulo="Aviso de privacidad"
      actualizadoEl="Agosto 2026 (borrador)"
      borrador
      secciones={seccionesPrivacidad}
    >
      <Typography variant="body1" color="text.secondary">
        Feeling Pilates — Aviso de Privacidad conforme a la Ley Federal de Protección de Datos Personales en
        Posesión de los Particulares (LFPDPPP). Quien recolecta los datos de los alumnos y responde legalmente
        ante ellos es el estudio Feeling Pilates, no el equipo de desarrollo de la aplicación.
      </Typography>

      <Seccion numero="01" titulo="Identidad y domicilio del responsable">
        <Typography variant="body1" color="text.secondary">
          <Placeholder>NOMBRE DE LA EMPRESA / RAZÓN SOCIAL DEL ESTUDIO</Placeholder>, con domicilio ubicado en{' '}
          <Placeholder>DIRECCIÓN COMPLETA DEL ESTUDIO</Placeholder>, es el responsable del tratamiento y
          protección de sus datos personales. Para cualquier asunto relacionado con su privacidad, puede
          contactarnos a través del correo: <Placeholder>CORREO DE CONTACTO/SOPORTE</Placeholder>.
        </Typography>
      </Seccion>

      <Seccion numero="02" titulo="Datos personales que recopilamos">
        <Typography variant="body1" color="text.secondary">
          Para brindarle el servicio de gestión y reserva de clases, recabamos los siguientes datos personales:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Datos de identificación y contacto:</strong> nombre completo, correo electrónico y
                  número de teléfono (opcional).
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Fotografía de perfil (opcional):</strong> imagen capturada o subida por el usuario,
                  almacenada en nuestros servidores y base de datos para su identificación dentro de la
                  plataforma.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Credenciales y autenticación:</strong> contraseña cifrada mediante algoritmos de
                  seguridad unidireccionales (nunca visible en texto plano) o, en su caso, identificadores
                  provistos por Google Sign-In.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Historial de uso y transacciones:</strong> registro de paquetes adquiridos, historial
                  de reservas realizadas y registros de asistencia física (check-in vía QR).
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Datos de pago:</strong> los pagos se procesan directamente mediante Stripe. No
                  almacenamos números de tarjetas de crédito ni débito; únicamente conservamos el identificador
                  de la transacción (token/ID de pago) para fines de control y validación de compras.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Datos técnicos y de conexión:</strong> dirección IP, registros de acceso (logs) e
                  identificadores de dispositivo recopilados automáticamente con fines de seguridad del sistema.
                </>
              }
            />
          </ListItem>
        </List>
        <Nota>
          Actualmente la aplicación no solicita fecha de nacimiento ni datos sensibles sobre el estado de salud
          o condición física.
        </Nota>
      </Seccion>

      <Seccion numero="03" titulo="Permisos en el dispositivo">
        <Typography variant="body1" color="text.secondary">
          <strong>Cámara:</strong> solicitamos acceso a la cámara de su dispositivo exclusivamente para:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Escanear el código QR en el salón para validar su asistencia (check-in)." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Tomar la fotografía de perfil en caso de que decida configurarla." />
          </ListItem>
        </List>
        <Typography variant="body1" color="text.secondary">
          <strong>Notificaciones push:</strong> con su autorización, le enviamos avisos sobre el estado de sus
          reservas, recordatorios de clase y cambios operativos directamente a su dispositivo. Puede desactivar
          este permiso en cualquier momento desde la configuración de su teléfono, sin que esto afecte el resto
          del servicio.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No se accede a la cámara en segundo plano ni a otros archivos sin su autorización.
        </Typography>
      </Seccion>

      <Seccion numero="04" titulo="Finalidad del tratamiento de datos">
        <Typography variant="body1" color="text.secondary">
          Sus datos personales serán utilizados para las siguientes finalidades necesarias:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Gestionar su registro, cuenta y reservas de clases en las distintas modalidades presenciales." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Procesar pagos de paquetes a través de la pasarela Stripe." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Validar su asistencia en los salones mediante código QR." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Enviarle confirmaciones, recordatorios y avisos sobre el estado de sus reservas o cambios operativos del servicio, mediante notificaciones push dentro de la aplicación y/o por correo electrónico." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Brindar soporte técnico y atención a dudas o aclaraciones." />
          </ListItem>
        </List>
        <Typography variant="body1" color="text.secondary">
          Puede gestionar sus preferencias de notificaciones push y de correo desde la configuración de su
          cuenta dentro de la app.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No comercializamos ni transferimos sus datos a terceros para fines publicitarios.
        </Typography>
      </Seccion>

      <Seccion numero="05" titulo="Menores de edad">
        <Typography variant="body1" color="text.secondary">
          Nuestros servicios están dirigidos a personas mayores de edad. Si un menor de edad utiliza la
          aplicación, el tratamiento de sus datos deberá contar con el consentimiento y supervisión previa de
          su padre, madre o tutor legal.
        </Typography>
      </Seccion>

      <Seccion numero="06" titulo="Transferencia de datos a terceros">
        <Typography variant="body1" color="text.secondary">
          Compartimos información únicamente con los siguientes terceros, indispensables para la operación del
          servicio:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Stripe:</strong> para procesar pagos electrónicos de forma segura.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Google (Google Sign-In):</strong> para el servicio de autenticación si decide iniciar
                  sesión con su cuenta de Google.
                </>
              }
            />
          </ListItem>
        </List>
      </Seccion>

      <Seccion numero="07" titulo="Derechos ARCO y revocación del consentimiento">
        <Typography variant="body1" color="text.secondary">
          Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (derechos ARCO) al tratamiento de sus
          datos. Para ejercerlos, envíe una solicitud a <Placeholder>CORREO DE CONTACTO/SOPORTE</Placeholder>{' '}
          que contenga:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Nombre completo y documento oficial de identificación." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Descripción clara de los datos y el derecho que desea ejercer." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Correo electrónico asociado a su cuenta." />
          </ListItem>
        </List>
        <Typography variant="body1" color="text.secondary">
          Daremos respuesta en un plazo máximo de 20 días hábiles, haciéndose efectiva dentro de los 15 días
          hábiles posteriores si resulta procedente, conforme a la LFPDPPP.
        </Typography>
      </Seccion>

      <Seccion numero="08" titulo="Eliminación de cuenta y retención de datos">
        <Typography variant="body1" color="text.secondary">
          Puede solicitar la baja de su cuenta en cualquier momento a través de cualquiera de estos medios:
        </Typography>
        <List sx={{ listStyleType: 'decimal', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Dentro de la app:</strong> ingresando a{' '}
                  <Placeholder>RUTA EN LA APP, ej. Perfil &gt; Configuración &gt; Eliminar cuenta</Placeholder>.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Desde la web</strong> (sin necesidad de tener la app instalada): enviando una
                  solicitud directa mediante nuestro formulario en línea en{' '}
                  <Placeholder>URL DE TU FORMULARIO/PÁGINA WEB DE ELIMINACIÓN DE DATOS</Placeholder> o
                  escribiendo a <Placeholder>CORREO DE CONTACTO/SOPORTE</Placeholder>.
                </>
              }
            />
          </ListItem>
        </List>
        <Nota>
          Cómo eliminamos sus datos (borrado lógico): al confirmar su solicitud, su cuenta se desactiva de
          inmediato; su perfil, fotografía e historial dejan de ser visibles y accesibles dentro de la
          aplicación, y no podrá volver a iniciar sesión con ella. Sus datos no se destruyen de forma
          instantánea: se conservan de manera restringida e inaccesible en nuestros sistemas únicamente por
          motivos de seguridad, auditoría y cumplimiento legal, hasta su eliminación física definitiva.
        </Nota>
        <Typography variant="body1" color="text.secondary">
          <strong>Excepción fiscal:</strong> los registros de facturación y transacciones de pago se conservan
          por el tiempo legal mínimo exigido por la legislación fiscal mexicana (Código Fiscal de la
          Federación), para efectos de auditoría contable y tributaria.
        </Typography>
      </Seccion>

      <Seccion numero="09" titulo="Seguridad de la información">
        <Typography variant="body1" color="text.secondary">
          Aplicamos medidas de seguridad técnicas y organizativas para proteger su información: cifrado de
          extremo a extremo en transferencias (HTTPS/TLS), contraseñas con hash criptográfico y control de
          acceso restringido por roles.
        </Typography>
      </Seccion>

      <Seccion numero="10" titulo="Actualizaciones">
        <Typography variant="body1" color="text.secondary">
          Cualquier modificación a este aviso se publicará en esta misma página web y/o dentro de la
          aplicación.
        </Typography>
      </Seccion>
    </DocumentoLegal>
  );
}
