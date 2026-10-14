import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { DocumentoLegal, Nota, Placeholder, Seccion } from './DocumentoLegal';

const seccionesPrivacidad = [
  { numero: '01', titulo: 'Identidad y domicilio del responsable' },
  { numero: '02', titulo: 'Datos personales que recopilamos' },
  { numero: '03', titulo: 'Permisos en el dispositivo y sitio web' },
  { numero: '04', titulo: 'Finalidades del tratamiento de datos' },
  { numero: '05', titulo: 'Menores de edad' },
  { numero: '06', titulo: 'Proveedores y transferencia de datos' },
  { numero: '07', titulo: 'Derechos ARCO y revocación del consentimiento' },
  { numero: '08', titulo: 'Conservación de datos y eliminación de cuenta' },
  { numero: '09', titulo: 'Seguridad de la información' },
  { numero: '10', titulo: 'Actualizaciones al aviso de privacidad' },
  { numero: '11', titulo: 'Contacto' },
];

export function AvisoPrivacidad() {
  return (
    <DocumentoLegal
      titulo="Aviso de privacidad"
      actualizadoEl="Octubre 2026 (borrador)"
      borrador
      secciones={seccionesPrivacidad}
    >
      <Typography variant="body1" color="text.secondary">
        Aviso de Privacidad de Feeling Good (Aquatic &amp; Fitness Center), Feeling Pilates y Feeling
        Match (Padel Center), conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
        Particulares (LFPDPPP). Quien recolecta los datos de los usuarios y responde legalmente ante ellos es el
        operador de estos centros, no el equipo de desarrollo de la aplicación.
      </Typography>

      <Seccion numero="01" titulo="Identidad y domicilio del responsable">
        <Typography variant="body1" color="text.secondary">
          <Placeholder>NOMBRE DE LA EMPRESA / RAZÓN SOCIAL</Placeholder>, operador de Feeling Good, Feeling
          Pilates y Feeling Match en Cadereyta de Montes, Querétaro, con domicilio ubicado en{' '}
          <Placeholder>DIRECCIÓN COMPLETA</Placeholder>, es el responsable del tratamiento y protección de sus
          datos personales. Para cualquier asunto relacionado con su privacidad, puede contactarnos a través del
          correo: <Placeholder>CORREO DE PRIVACIDAD</Placeholder>.
        </Typography>
      </Seccion>

      <Seccion numero="02" titulo="Datos personales que recopilamos">
        <Typography variant="body1" color="text.secondary">
          Para brindarle el servicio de gestión y reserva de clases, canchas y paquetes, recabamos los siguientes
          datos personales:
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
                  seguridad unidireccionales (nunca visible en texto plano) o, en su caso, el nombre, correo,
                  fotografía e identificador que nos comparte Google si decide iniciar sesión con su cuenta de
                  Google.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Historial de uso y transacciones:</strong> registro de paquetes y membresías
                  adquiridos, historial de reservas de clases y canchas de pádel, y registros de asistencia
                  física (check-in vía QR).
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
        <Typography variant="body1" color="text.secondary">
          <strong>Instructores:</strong> además de los datos anteriores, de las personas instructoras tratamos
          la información de su perfil profesional (fotografía, descripción y los enlaces a redes sociales que
          decidan agregar, como Instagram, Facebook o TikTok), que se muestra a los alumnos dentro de la
          aplicación. Cada instructor decide qué redes publica y puede retirarlas en cualquier momento.
        </Typography>
        <Nota>
          Actualmente la aplicación no solicita fecha de nacimiento ni datos sensibles sobre el estado de salud
          o condición física. Si en el futuro se solicitaran (por ejemplo, lesiones o padecimientos relevantes
          para la práctica), se pedirá su consentimiento expreso y por escrito antes de recabarlos.
        </Nota>
      </Seccion>

      <Seccion numero="03" titulo="Permisos en el dispositivo y sitio web">
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
          No se accede a la cámara en segundo plano ni a otros archivos sin su autorización.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          <strong>Ubicación:</strong> no accedemos a la ubicación de su dispositivo. Los mapas de la aplicación
          (Google Maps) solo muestran la ubicación de nuestras instalaciones.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          <strong>Notificaciones:</strong> actualmente la aplicación no envía notificaciones push. Si en el
          futuro se habilitan, se le pedirá su autorización y podrá desactivarlas desde la configuración de su
          teléfono.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          <strong>Sitio web:</strong> utilizamos el almacenamiento local de su navegador únicamente para
          mantener su sesión iniciada. No usamos cookies de publicidad ni herramientas de analítica o rastreo.
        </Typography>
      </Seccion>

      <Seccion numero="04" titulo="Finalidades del tratamiento de datos">
        <Typography variant="body1" color="text.secondary">
          <strong>Finalidades primarias</strong>, necesarias para prestarle el servicio:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Gestionar su registro, cuenta y reservas de clases (Pilates, fitness y actividades acuáticas) y de canchas de pádel." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Administrar paquetes y membresías, y procesar sus pagos a través de la pasarela Stripe." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Validar su asistencia en los salones mediante código QR y controlar la disponibilidad de lugares." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Enviarle por correo electrónico confirmaciones, recordatorios y avisos sobre el estado de sus reservas o cambios operativos del servicio." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Mostrar a los alumnos el perfil profesional de los instructores." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Atender sus solicitudes y brindarle soporte técnico y atención a dudas o aclaraciones." />
          </ListItem>
        </List>
        <Typography variant="body1" color="text.secondary">
          <strong>Finalidades secundarias</strong>, que no son necesarias para el servicio pero nos ayudan a
          brindarle una mejor atención:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Enviarle promociones, novedades y eventos de Feeling Good, Feeling Pilates y Feeling Match." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Invitarle a responder encuestas de satisfacción sobre nuestros servicios." />
          </ListItem>
        </List>
        <Typography variant="body1" color="text.secondary">
          El envío de publicidad o promociones se realizará únicamente conforme a las autorizaciones que nos
          otorgue y respetando los mecanismos de oposición aplicables. Si no desea que sus datos se usen para
          las finalidades secundarias, puede indicarlo en cualquier momento escribiendo a{' '}
          <Placeholder>CORREO DE PRIVACIDAD</Placeholder>. Su negativa no afectará los servicios que contrató.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No comercializamos ni vendemos sus datos personales.
        </Typography>
      </Seccion>

      <Seccion numero="05" titulo="Menores de edad">
        <Typography variant="body1" color="text.secondary">
          Nuestros servicios están dirigidos a personas mayores de edad. Si un menor de edad utiliza la
          aplicación, el tratamiento de sus datos deberá contar con el consentimiento y supervisión previa de
          su padre, madre o tutor legal.
        </Typography>
      </Seccion>

      <Seccion numero="06" titulo="Proveedores y transferencia de datos">
        <Typography variant="body1" color="text.secondary">
          Para operar el servicio nos apoyamos en los siguientes proveedores, que tratan la información
          únicamente para prestar su servicio y bajo obligaciones de confidencialidad y protección de datos:
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
                  <strong>Google (Google Sign-In y Google Maps):</strong> para el inicio de sesión con su cuenta
                  de Google, si así lo decide, y para mostrar la ubicación de nuestras instalaciones.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <strong>Hospedaje y correo electrónico:</strong>{' '}
                  <Placeholder>PROVEEDOR DE SERVIDORES Y DE ENVÍO DE CORREOS — confirmar</Placeholder>, donde se
                  almacena la aplicación y desde donde se envían los avisos del servicio.
                </>
              }
            />
          </ListItem>
        </List>
        <Typography variant="body1" color="text.secondary">
          Cualquier transferencia de datos que por ley requiera su consentimiento se realizará conforme a la
          normativa aplicable. No comercializamos datos personales.
        </Typography>
      </Seccion>

      <Seccion numero="07" titulo="Derechos ARCO y revocación del consentimiento">
        <Typography variant="body1" color="text.secondary">
          Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (derechos ARCO) al tratamiento de sus
          datos, así como a revocar el consentimiento que nos haya otorgado. Para ejercerlos, envíe una
          solicitud a <Placeholder>CORREO DE PRIVACIDAD</Placeholder> que contenga:
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
          <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
            <ListItemText primary="Medio de contacto para recibir la respuesta a su solicitud." />
          </ListItem>
        </List>
        <Typography variant="body1" color="text.secondary">
          Daremos respuesta en un plazo máximo de 20 días hábiles, haciéndose efectiva dentro de los 15 días
          hábiles posteriores si resulta procedente, conforme a la LFPDPPP.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Si considera que su solicitud no fue atendida correctamente, puede acudir ante{' '}
          <Placeholder>AUTORIDAD COMPETENTE EN PROTECCIÓN DE DATOS — confirmar tras la reforma de 2025</Placeholder>.
        </Typography>
      </Seccion>

      <Seccion numero="08" titulo="Conservación de datos y eliminación de cuenta">
        <Typography variant="body1" color="text.secondary">
          Conservamos sus datos mientras su cuenta esté activa y durante el tiempo necesario para prestar los
          servicios y cumplir con las obligaciones legales aplicables; después se bloquean y se eliminan según
          corresponda.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Puede solicitar la baja de su cuenta en cualquier momento, sin necesidad de tener la app instalada,
          mediante nuestro formulario en línea en{' '}
          <Placeholder>URL DEL FORMULARIO/PÁGINA WEB DE ELIMINACIÓN DE DATOS</Placeholder> o escribiendo a{' '}
          <Placeholder>CORREO DE PRIVACIDAD</Placeholder> desde el correo asociado a su cuenta.
        </Typography>
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
          Aplicamos medidas de seguridad administrativas, técnicas y físicas para proteger su información contra
          accesos no autorizados, pérdida, alteración o uso indebido, entre ellas: cifrado de la información en
          tránsito mediante HTTPS/TLS, contraseñas con hash criptográfico y control de acceso restringido por
          roles.
        </Typography>
      </Seccion>

      <Seccion numero="10" titulo="Actualizaciones al aviso de privacidad">
        <Typography variant="body1" color="text.secondary">
          Cualquier modificación a este aviso se publicará en esta misma página web, dentro de la aplicación y/o
          en los canales oficiales de Feeling Good, Feeling Pilates y Feeling Match.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fecha de entrada en vigor: <Placeholder>CONFIRMAR FECHA</Placeholder>.
        </Typography>
      </Seccion>

      <Seccion numero="11" titulo="Contacto">
        <Typography variant="body1" color="text.secondary">
          Feeling Good | Feeling Pilates | Feeling Match
          <br />
          Cadereyta de Montes, Querétaro, México
          <br />
          Domicilio: <Placeholder>DIRECCIÓN COMPLETA</Placeholder>
          <br />
          Correo de privacidad: <Placeholder>CORREO DE PRIVACIDAD</Placeholder>
        </Typography>
      </Seccion>
    </DocumentoLegal>
  );
}
