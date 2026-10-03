# Programación: caracterización M08 y propuesta finita

Este documento describe el WEB ACTUAL en HEAD `b0399edc001f733bd61e616560d87591955913c1`. M08 autoriza únicamente las nuevas pruebas y este plan bajo la congelación `msg_44a38238f350`; no autoriza ninguna implementación de los slices siguientes. STATE/RUNBOOK pertenecen al coordinador. Todos los 137 archivos de entrada se protegen byte a byte salvo esos dos documentos de proceso: 135 archivos protegidos, incluidos producción, pruebas anteriores, fixtures, mocks, configuración, dependencias y harness. No se requieren cambios de producción para ejecutar la nueva caracterización.

La evidencia permitida es código y transporte del frontend, con respuestas sintéticas. No hay un contrato F2E/backend vigente y exacto en esta evidencia: su compatibilidad con estas interpretaciones es **UNVERIFIED**. No se ha demostrado un conflicto real y no se afirma compatibilidad. Fechas efectivas, TurnoInstructor, especialidades, solapes efectivos, confirmación, reservas, snapshots, dark launch y cutover siguen bajo autoridad F2E. Una contradicción real requiere evidencia exacta y Human Gate `CROSS_LANE_DEPENDENCY_REQUIRED`; no resolverla desde Web.

## CURRENT_STRUCTURE_MAP

| Responsabilidad actual | Path exacto | Consumidores de producción |
| --- | --- | --- |
| Página y coordinación de lecturas/escrituras | `src/pages/salones/SalonHorarios.tsx` | `src/App.tsx:10`, ruta `/salones/:id/horarios` en línea40 |
| Calendario, controles, selección, geometría y diálogos | `src/pages/salones/components/CalendarioHorariosInstructor.tsx` | `src/pages/salones/SalonHorarios.tsx:50,476` |
| Versionado/cierre del horario de operación | `src/pages/salones/components/EditarHorarioSemanalDialog.tsx` | `src/pages/salones/SalonHorarios.tsx:51,605` |
| Fecha local exportada `aIso`, `hoyIso` | `src/pages/salones/fechas.ts` | página y diálogo semanal; calendario mantiene su propia función privada |
| Traducción frontend de errores existentes | `src/pages/salones/erroresHorario.ts` | diálogo semanal |
| Transporte de turnos | `src/api/calendario.ts` | página; no otro consumidor de producción identificado |
| Transporte de salón/excepciones/versiones | `src/api/salones.ts` | página, diálogo semanal, `src/modulos/salones/hooks/useGestionSalones.ts`, `src/modulos/salones/componentes/DialogoSalon.tsx`, `src/modulos/usuarios/componentes/DialogoCrearPersonal.tsx`, `src/modulos/usuarios/componentes/DialogoEditarUsuario.tsx` |
| DTO compartidos | `src/api/types.ts` | calendario, página, diálogo, errores y APIs; también auth, Query y módulos Actividades/Usuarios/Roles/Salones/Ventas |
| Usuarios/especialidades | `src/api/usuariosAdmin.ts` | página y consumidores de Usuarios; compartido |
| Sesión/permiso/theme/shell | `src/api/client.ts`, `src/auth/usePermisos.ts`, `src/auth/authStore.ts`, `src/auth/permisoCatalogoStore.ts`, `src/theme/theme.ts`, `src/app/layout/Layout.tsx`, `src/app/layout/Cabecera.tsx`, `src/app/layout/NavegacionLateral.tsx` | infraestructura compartida; lectura únicamente |

Grafo de pruebas estable: `src/pages/salones/SalonHorarios.test.tsx` importa página y el tipo del calendario y sustituye el hijo para probar coordinación; `src/pages/salones/components/CalendarioHorariosInstructor.test.tsx` ejercita el calendario real; `src/pages/salones/fechas.test.ts` prueba fecha local; `tests/e2e/salon-horarios.spec.ts` ejecuta trece casos reales de crear/mover/recortar/solape/adyacencia/fecha puntual. Los seis paths nuevos de M08 son este documento, `src/api/calendario.caracterizacion.test.ts`, `src/pages/salones/SalonHorariosCaracterizacion.test.tsx`, `src/pages/salones/components/CalendarioHorariosInstructorCaracterizacion.test.tsx`, `src/pages/salones/components/EditarHorarioSemanalDialogCaracterizacion.test.tsx` y `tests/e2e/programacion.spec.ts`. Ningún archivo anterior se modifica en M08.

### Página: 618 líneas, 16 estados, 5 efectos

Estados completos: `salon`, `instructores`, `mapaEspecialidades`, `turnos`, `inicioSemana`, `excepciones`, `cargando`, `cargandoTurnos`, `error`, `feedback`, `editandoHorarioSemanal`, `paginaPuntuales`, `numeroPaginaPuntuales`, `filtroTipoPuntual`, `filtroDiaPuntual`, `cargandoPuntuales` (líneas144–161).

Derivados: `finSemana` (inicio+6), `instructoresSalon` (id/nombre), `actividadesSalon`, separación `recurrentes`/`puntuales`, orden por fecha y clasificación de la lista puntual en cancelación/mismo horario/tiempo extra/especial. La clasificación compara strings y minutos del recurrente del mismo día: es una etiqueta cliente actual, no regla backend. Helpers privados `domingoDeLaSemana`, `sumarDias`, `diaDeLaSemana`, `diaSemanaIndice`, `aMinutos`, `clasificarExcepcion` quedan privados y no se importan para pruebas.

Efectos: líneas175–201 carga detalle+usuarios, filtra `rolesAsignados` INSTRUCTOR con el id de sede y luego especialidades; 203–215 carga turnos por sede; 217–223 carga excepciones del rango semanal; 225–227 resetea página puntual al cambiar filtros; 229–240 dispara `cargarPuntuales` por sede/página/filtros. No hay cancelación ni guardia por generación en estos efectos. `cargarPuntuales` controla su indicador y convierte rechazo en `null`.

Handlers/API de callbacks: `handleCrear` añade respuesta local y refresca puntuales cuando corresponde; `handleMover` devuelve `string|null`, actualiza con respuesta y admite `silencioso`; `handleAjustarFecha` ejecuta DELETE secuenciales y luego POST secuenciales, sólo publica nuevos turnos locales tras terminar; `handleCancelarFecha` crea cancelación; `handleEliminar` elimina y refresca lista; `handleGuardarExcepcion`/`handleEliminarExcepcion` conservan propiedad local de excepciones; `mensajeDeError`/`manejarError` centralizan feedback de página. No se infiere rollback ni atomicidad backend de la secuencia DELETE→POST.

Render: carga inicial, fallback sin salón, título, alerta dismissible, ausencia de instructores, semana anterior/siguiente, botón Horario habitual, carga de turnos, calendario, filtros Tipo/Día, listado puntual/paginación y Snackbar. Diálogo semanal recibe `onAplicado` que GET detalle y setSalon, `onExito` que setFeedback y `onClose` que baja su open. Layout/scroll y MUI pertenecen a los límites actuales del shell y de la feature, no a un rediseño autorizado.

### Calendario: 2224 líneas, 25 estados de archivo, 0 efectos

Son **24 estados del componente principal + 1 del hijo** `AsignacionesInstructores` (`busqueda`, línea486). El calendario principal tiene `creando`, `ajuste`, `ajusteSolapa`, `ajusteExcepcion`, `ajusteExcepcionSolapa`, `avisoSolape`, `menuCancelar`, `menuAccionesBloque`, `fechaCancelar`, `confirmEliminar`, `menuEditarBloque`, `asignacionesEditarRecurrente`, `asignacionesEditarFecha`, `ambitoEditar`, `errorEditarBloque`, `guardandoEditarBloque`, `pendienteCreacion`, `tipoNuevo`, `fechaNuevo`, `asignacionesNuevas`, `menuExcepcion`, `cerradoExcepcion`, `horaAperturaExcepcion`, `horaCierreExcepcion` (líneas593–629).

Refs: `gridRef` y `columnasRef`. Derivados: permisos combinados; `dias` ordenados; mínimo de apertura/máximo de cierre global, altura y marcas horarias; asignaciones del ámbito activo; ventanas/rango válido; solape del ajuste/creación; rangos de recurrentes fusionados visualmente con excepciones y excepciones independientes; columnas calculadas por rangos. El calendario no hace HTTP: recibe DTOs y callbacks de página.

Clusters semánticos independientes, conservando sus acoplamientos actuales:

- Formato/fecha/minutos: `aMinutos`, `corta`, `redondear`, `aHora`, `sumarDias`, `aIso`, `proximaFecha`, `diaSemanaDe`, `formatoFechaCorta`, `nombresDe`, `nombresConRango` (64–136).
- Geometría: `asignarColumnas` (139), `seSolapan` (191), `haySolape` (196), `yAminutos` (654), `xAdia` (662), `bloquesActivosDia` (678). Slots30min y 64px/hora; intervalos adyacentes no se solapan en el preflight cliente. La disposición visual y el preflight no certifican reglas F2E.
- Asignaciones: tipos privados, `asignacionesARequest`, `asignacionesValidas`, `cabeEnAlgunaVentana`, `asignacionesDentroDeRango`, `asignacionesDeTurno` (268–323); `FilaInstructorAsignacion` y `AsignacionesInstructores` ofrecen especialidades, actividades, instructor y rango parcial/completo. `null/null` representa el bloque completo en el DTO web. Validación y dominio permanecen junto al controlador hasta autoridad explícita.
- Creación mouse: `iniciarCreacion`, `haySolapeCreacion`, `confirmarCreacion` (690–750), selección inversa, snap, mínimo y diálogo Nuevo horario. No hay drag táctil/teclado demostrado.
- Ajuste recurrente: `iniciarAjuste` (752–813), movimiento horizontal/vertical y dos grips, clamp global y preflight; emite onMover.
- Ajuste puntual: `iniciarAjusteExcepcion` (821–880), cambia horas manteniendo fecha; emite onAjustarFecha con reemplazo.
- Edición: `abrirMenuEditarBloque`/`confirmarEditarBloque` (900–948), ámbitos independientes, guardando, error resuelto conservando formulario y cierre sólo tras callback exitoso.
- Cancelación/eliminación: `abrirMenuCancelar`/`confirmarCancelacion` (882–898), confirmación de borrar y menú de acciones de bloques pequeños.
- Operación de fecha: `abrirMenuExcepcion`, `confirmarExcepcion`, `quitarExcepcion` (950–978), abierto especial/cerrado/quitar excepción.
- Presentación: encabezados y hoy, franjas fuera de apertura, grilla/marcas, bloques recurrentes, overlays y puntuales independientes, instructores con rango, actividades, acciones inline versus menú en bloques bajos, alerta de preflight y leyenda (980–2224).

Tres flujos registran directamente pares de listeners globales mousemove/mouseup: creación719–720, ajuste811–812, ajuste puntual878–879. Cada flujo los retira en mouseup; no hay efecto de limpieza al desmontar. No se describe esto como seguro frente a unmount.

Contrato de props: `horarios`, `turnosRecurrentes`, `turnosPuntuales`, `instructoresSalon`, `actividadesSalon`, `mapaEspecialidades`, `inicioSemana`, `excepciones`; cuatro booleanos de permisos; `onCrear`, `onMover`, `onAjustarFecha`, `onEliminar`, `onCancelarFecha`, `onGuardarExcepcion`, `onEliminarExcepcion`. `onMover`/`onAjustarFecha` devuelven Promise<string|null>; la UI distingue error resuelto y éxito. Los otros callbacks de escritura pertenecen a la página, con feedback de página. No convertirlos todos en una abstracción uniforme.

### Diálogo semanal: 405 líneas, 9 estados, 1 efecto

Estados completos82–90: `vista`, `historial`, `cargandoHistorial`, `diaExpandido`, `horaApertura`, `horaCierre`, `efectivoDesde`, `error`, `guardando`. `Vista` discrimina lista/versionar/cerrar. Derivados: hoy local, historial por día, primera futura de la lista recibida, horario vigente desde `salon.horarios`, filas con gaps y estado visual de versiones. No ordenar ni reinterpretar respuestas durante ownership.

Efecto103–108: al open/id cambia a lista, limpia expandido/error y llama `cargarHistorial`. Helpers privados `sumarUnDia`, `formatearFechaLegible`, `estadoDeVersion`, `construirFilasConGaps`; handlers `cargarHistorial`, `historialDelDia`, `proximaVersionFutura`, `horarioVigenteDelDia`, `abrirVersionar`, `abrirCerrar`, `volverALista`, `despuesDeExito`, `mensajeSegunFecha`, `formularioInvalido`, `guardarVersionar`, `guardarCerrar`, `renderHistorialDia`. Los nombres de dominio actuales no se cambian en un move.

`despuesDeExito`144–152 espera `Promise.allSettled([onAplicado(), cargarHistorial()])`: vuelve a lista y comunica guardado correcto con aviso de información no sincronizada si una lectura falla. El éxito del POST no se convierte en fracaso de escritura por un refresh fallido. POST409 conserva valores y evita callbacks de éxito; ciertos códigos existentes refrescan historial antes de mostrar mensaje. El efecto de apertura no captura rechazo inicial de historial: gap separado.

Vista lista: siete días, horario/cerrado, historial desplegable, futura, botones cambiar/dejar de operar/abrir. Formulario versionar: Abre/Cierra y Aplicar a partir de. Formulario cerrar: fecha únicamente. Atrás y guardar se deshabilitan al guardar. Close/Escape y foco usan MUI Dialog; no asumir todo un contrato de teclado accesible para el calendario.

## Transporte y DTO actuales, sin autoridad backend inferida

Todos los paths siguientes se resuelven respecto de `apiClient`. Axios consume Bearer/session existentes; las pruebas usan `https://api.test.invalid/api` y tokens sintéticos. Headers JSON de POST/PATCH y Bearer se caracterizan directamente; no se cambia política de autenticación ni interceptores.

| Método/path | Query o request actual | Resultado consumido |
| --- | --- | --- |
| GET `/turnos-instructor` | `salonId`; con lector por instructor también `usuarioId` | TurnoInstructorResponse[] |
| GET `/turnos-instructor/puntuales` | salonId, usuarioId opcional, page(default0), size(default10), tipo EXCEPCION/CANCELACION opcional, diaSemana opcional; vacíos omitidos, domingo0 conservado | Pagina<TurnoInstructorResponse> |
| POST `/turnos-instructor` | salonId, tipo, diaSemana, fecha, horaInicio, horaFin, asignaciones | TurnoInstructorResponse |
| PATCH `/turnos-instructor/{id}` | diaSemana, horaInicio, horaFin, asignaciones | TurnoInstructorResponse |
| DELETE `/turnos-instructor/{id}` | sin body | respuesta Axios; página elimina local tras éxito |
| GET `/salones/{id}` | sin query | SalonDetalleResponse |
| GET `/admin/usuarios` | page0,size100,sort=creadoEn,desc,rol=INSTRUCTOR | Pagina<UsuarioResponse> |
| GET `/admin/usuarios/{id}/especialidades` | sin query | filas con tipoActividadId,nombre,duracionMinutos |
| GET `/salones/{id}/excepciones-horario` | desde/hasta de la semana local, ambos strings YYYY-MM-DD | SalonHorarioExcepcionResponse[] |
| PUT `/salones/{id}/excepciones-horario` | fecha,cerrado,horaApertura,horaCierre | SalonHorarioExcepcionResponse |
| DELETE `/salones/{id}/excepciones-horario/{excepcionId}` | sin body | respuesta Axios |
| GET `/salones/{id}/horarios/historial` | diaSemana opcional en API; diálogo llama sin filtro | HorarioOperacionVersionResponse[] |
| POST `/salones/{id}/horarios/versiones` | diaSemana,efectivoDesde,horaApertura,horaCierre | HorarioOperacionVersionResponse |
| POST `/salones/{id}/horarios/cierres` | diaSemana,efectivoDesde; no horas ni cerrado | HorarioOperacionVersionResponse |

Campos exactos de turnos en `src/api/types.ts:162–217`: AsignacionInstructorRequest `{ instructorId,tipoActividadIds,horaInicio,horaFin }`; TurnoInstructorRequest `{ asignaciones,salonId,tipo,diaSemana,fecha,horaInicio,horaFin }`; ActualizarTurnoRequest `{ diaSemana,horaInicio,horaFin,asignaciones }`; TurnoInstructorResponse `{ id,instructores,salonId,salonNombre,tipo,diaSemana,fecha,horaInicio,horaFin,actividades,asignaciones }`; InstructorResumen `{ id,nombre }`; ActividadResumen `{ id,nombre }`; InstructorAsignacionResponse `{ instructorId,instructorNombre,actividades,horaInicio,horaFin }`. TipoTurno actual: RECURRENTE/EXCEPCION/CANCELACION. Para recurrente, página envía día y fecha null; para puntual, día null y fecha; cancelación actual envía 00:00–23:59 y asignaciones sin actividades con rangos null.

Respuestas compartidas adicionales: Pagina<T> `{ content,totalElements,totalPages,number,size }`; UsuarioResponse `{ id,correo,nombre,telefono,fotoUrl,descripcion,proveedorAuth,estatus,roles,rolesAsignados,creadoEn,permisos }`, rolesAsignados `{ rol,salonIds }`; SalonDetalleResponse `{ id,nombre,estadoId,estadoNombre,municipioId,municipioNombre,telefono,calle,numeroExterior,numeroInterior,colonia,codigoPostal,referencias,direccionCompleta,latitud,longitud,activo,tiposActividad,horarios,recursos }`. Programación consume nombre/horarios/tiposActividad; no modifica recursos/dirección. ApiErrorBody admite message/error/codigo opcionales y otras claves unknown. Estos tipos permanecen compartidos, no se extraen durante ownership.

Tipos de operación en256–289: HorarioOperacionRequest `{ diaSemana,horaApertura,horaCierre }`; Response añade id. HorarioOperacionVersionResponse `{ diaSemana,horaApertura,horaCierre,vigenteDesde,vigenteHasta }`, fechas pueden ser null. VersionarHorarioSalonRequest `{ diaSemana,efectivoDesde,horaApertura,horaCierre }`; CerrarHorarioSalonRequest `{ diaSemana,efectivoDesde }`. Excepción de salón `{ id,fecha,cerrado,horaApertura,horaCierre }`; request elimina id. Ninguna prueba nueva añade códigos de negocio ni exige reglas efectivas del servidor.

Permisos enlazados por página139–142: `calendario.gestionar`, `calendario.cancelar`, `calendario.editar`, `salon.administrar`, vía `usePermisos().tiene`. En calendario631–632, gestionar||editar permite mover/recortar/editar; gestionar||cancelar permite cancelar día; gestionar permite crear/eliminar bloque; administrar permite excepciones de operación. Página sólo ofrece Horario habitual a administrar. Esto es rendering web y preflight: no garantía de autorización backend. Guards, catálogo, sesión y evaluación de identificadores quedan intactos.

Fecha local: domingo=0 e inicio de semana domingo a medianoche local. Sumar días usa setDate y conserva rollover de mes/año. YYYY-MM-DD se construye con getFullYear/getMonth/getDate y se parsea con `new Date(y,m-1,d)`, evitando parse UTC del string. HH:mm:ss recibido se corta a HH:mm para etiquetas; minutos ignoran segundos en geometría. Fecha futura/pasada y horarios se comparan en cliente según strings actuales. No inferir timezone de sede, inclusividad backend, vigencia efectiva ni obligación de migrar a UTC.

Límites de ownership: `src/api/salones.ts` y `src/api/types.ts` deben permanecer compartidos y estables por consumidores cruzados. `src/api/calendario.ts` es actualmente exclusivo de Programación pero no hay necesidad de moverlo en M09. `fechas.ts`/`erroresHorario.ts` son locales con dos/un consumidor productivo: mantener sus paths/exportaciones estables en M09; decidir su movimiento después, con slice explícito y sus consumidores exactos, sin deduplicar el helper privado del calendario oportunistamente. Query/Zod, APIs, cliente, auth, shell y theme se excluyen de toda allowlist propuesta abajo.

## Seguridad de pruebas y gaps no canonizados

La cobertura previa se conserva: dos suites originales de página/calendario, fechas y trece casos mouse Chromium. M08 añade tres tests API (filtros/defaults/domingo0 y headers/body), dos de calendario (etiquetas/rango parcial/rollover por props), dos de página real (carga inicial/error recuperable por remount e integración semanal), tres de diálogo semanal (409/reintento/pendiente, cierre+refresh fallido, POST exitoso+historial503). Chromium nuevo mide poblado a375/768/1440, solapes lado a lado, adyacencia, primer/último borde, reachability/scroll, resize1440→768, foco/Escape semanal, carga diferida/vacío/read-only/GET503+reload, POST409+reintento/semana de año, consulta de bloques poblados sin controles de escritura y clamp mouse sobre borde superior global. Este último añade un borde no cubierto por los trece anteriores; no repite sus casos de adyacencia/solape.

Los bloques/grips carecen de nombres/roles: el browser usa tiempo visible y ancestro de posición absolute/cursor computed, como justificación concreta para geometría real. No clases Emotion, ids internos, fake boxes jsdom, imports privados, extracción de TS ni cambio de exports. Controles de semana sin nombre se localizan mediante la fila de texto visible y sus botones directos; se documenta esta deuda, no una interfaz accesible nueva. Browser usa context.route global, aborta URLs desconocidas y verifica ledger vacío; permite sólo documento localhost exacto y assets exactos descubiertos en su HTML, CSS de fuente exacta stub y endpoints/métodos/query/Bearer sintéticos enumerados. Las únicas respuestas fallidas esperadas son GET detalle503 y POST versiones409 con URL/body/status exactos. Pageerrors se conservan sin filtro. Esto describe el harness nuevo; no es garantía de toda actividad externa del proyecto.

Inventario **KNOWN_BEHAVIOR_GAP_NOT_LOCKED**:

| Gap | Evidencia permitida | Disposición |
| --- | --- | --- |
| Lectura fallida como vacío | página210–213 turnos→[],219–222 excepciones→[],251–253 puntuales→null; especialidades184→[] | no fijar estas salidas como UX deseada; futuro feedback requiere autorización |
| Respuestas viejas de semana/sede/filtros pueden sobrescribir nuevas | efectos175–240 y cargarPuntuales242–255 publican setters sin generación/cancelación; `onAplicado`608–610 GET sin guardia de sede | riesgo demostrado por fuente, no test que premie stale overwrite; controlador guardado en slice independiente |
| Historial inicial puede rechazar sin manejo | semanal94–108 `.then().finally()` y efecto descarta promise sin catch | no ocultar pageerror/unhandled; no fixture de rechazo inicial en suite verde que canonice defecto |
| Listeners durante unmount | calendario719–720,811–812,878–879; retirada sólo en mouseup, efectos0 | no declarar cleanup completo; corrección futura separada |
| Drag por teclado/touch no soportado demostrado | flujos mouse y grips sin semántica de control | no inventar keyboard/touch drag; opciones mouse sólo en viewport suficiente |
| Labels/nombres/foco | flechas de página sin nombre; encabezados onClick y acciones/grips parciales sin rol; teclado validado sólo MUI dialog | no declarar accesibilidad completa |
| Responsive estrecho/overflow/legibilidad de bloques | grilla flexible, texto/acciones y ancho de header; bounds/scroll reales375/768/1440 en RAW: a375 bloques de19px, documento375px y contenedor375→377px (2px), scroll vertical local con documentoTop0; captura375×720 muestra tiempos/instructores truncados y última columna recortada; alcance de cajas de tiempo de jueves no certifica legibilidad ni acceso a toda la semana. Encabezado sábado a375: x358.3125,right395.03125 frente a clippingRight359; su acceso/legibilidad completos no se garantizan. Bounds se conservan sin canonizar el recorte | conservar métricas como evidencia, no afirmar ausencia de overflow ni convertirlo en requisito correcto |
| Contraste local | colores locales/overlays del calendario, sin medición completa de contraste en M08 | UNVERIFIED; no WCAG claim ni rediseño |

La recuperación por remount/reload prueba una ruta disponible; no declara resuelto el feedback inicial ni un retry inline inexistente. Las reglas de solape/ventana/rangos de asignación son preflight del CLIENTE ACTUAL, no garantía de negocio/backend.

## Secuencia propuesta: cada slice exige nueva autorización humana

Antes de cualquier slice: concesión específica, inventario/diff y exact finite freeze nuevos; verificación de HEAD/index y baseline aceptado; recon Luna-medium por defecto; worker Sol-medium sólo con justificación React/arquitectura; auditor final NUEVO Sol-high por scheduling/autoridad, cero P0/P1 y DecisionGate real. Max2 correcciones por fase, contador persistido antes de corregir. No stage/commit/publicación sin autoridad posterior. El plan no ejecuta movimientos.

### M09 — ownership solamente

Motivo: separar Programación del CRUD/configuración de Salones sin tocar payload, algoritmos ni UI. Riesgo MEDIUM estructural y HIGH interacción heredada. Se trasladan solamente los tres archivos principales, mismos nombres/exportaciones/cuerpos; imports relativos estrictamente necesarios y wiring de pruebas. Sin helper extraction, renaming, nuevo controller, cambios de reglas o ajustes de presentación en el mismo move.

Allowlist candidata EXACTA de producción/imports (origen eliminado + destino, sin barrels/bridges):

1. `src/pages/salones/SalonHorarios.tsx`
2. `src/modulos/programacion/paginas/SalonHorarios.tsx`
3. `src/pages/salones/components/CalendarioHorariosInstructor.tsx`
4. `src/modulos/programacion/componentes/CalendarioHorariosInstructor.tsx`
5. `src/pages/salones/components/EditarHorarioSemanalDialog.tsx`
6. `src/modulos/programacion/componentes/EditarHorarioSemanalDialog.tsx`
7. `src/App.tsx` — sólo import de la página; ruta/guards idénticos.

Allowlist candidata EXACTA de wiring de tests (sólo imports/mock specifier, no cambiar assertions/fixtures): `src/pages/salones/SalonHorarios.test.tsx`, `src/pages/salones/components/CalendarioHorariosInstructor.test.tsx`, `src/pages/salones/SalonHorariosCaracterizacion.test.tsx`, `src/pages/salones/components/CalendarioHorariosInstructorCaracterizacion.test.tsx`, `src/pages/salones/components/EditarHorarioSemanalDialogCaracterizacion.test.tsx`. Tests API/browser no requieren wiring porque consumen API/ruta estable; permanecen byteprotegidos. Total12 candidate paths de código/pruebas. STATE/RUNBOOK se añaden explícitamente sólo por Root en el futuro freeze.

Dependencias: importaciones del calendario a api/types; página a api/calendario/salones/usuariosAdmin/auth/usePermisos y `src/pages/salones/fechas.ts`; diálogo a api/salones/types y los dos utils originales. Ajustar sus rutas relativas, no mover dependencias. Consumidores productivos exactos: App y la página trasladada. Cross-lane: ninguna implementación de backend requerida; si aparece contradicción contractual exacta, detener por Human Gate. API/types/fechas/erroresHorario/Query/auth/shell/theme/packages/fixtures/harness son compartidos o read-only explícitos.

Protección: cuerpos tras normalizar imports equivalentes, mismos callbacks y orden await, payload exacto, permisos, fecha local, separaciones fecha/recurrente, placements/drag/feedback. FAST: tests originales+nuevos de página/calendario/semanal, API/fechas, typecheck/lint y ambos specs Chromium scheduling. FULL: full Vitest, full Chromium incluyendo todos los trece antiguos y375/768/1440, lint/typecheck/build/npm ls/diff-check, import graph y byte-manifest de exclusiones. Auditor Sol-high nuevo verifica move+imports y frontera F2E. Rollback: revertir exclusivamente el delta del slice a snapshot previo verificado, con disposición explícita; no reset de otras lanes. Ruta recomendada: Luna-medium para move mecánico tras freeze; Sol-medium si hay ambigüedad real de imports/tipos, documentada antes de escalar.

### M10 — formulario presentacional del diálogo semanal

Dependencia: M09 aceptado; autorización humana nueva para este split, no para errores async. Candidato EXACTO: `src/modulos/programacion/componentes/EditarHorarioSemanalDialog.tsx`, nuevo `src/modulos/programacion/componentes/FormularioHorarioSemanal.tsx`, `src/pages/salones/components/EditarHorarioSemanalDialogCaracterizacion.test.tsx` y `src/pages/salones/SalonHorariosCaracterizacion.test.tsx` sólo si cambia wiring explícito. Cuatro paths finitos máximos; Rootdocs aparte en freeze. Ningún consumidor externo nuevo.

Mover sólo JSX de campos Abre/Cierra/Aplicar a partir de y leyendas de versionar/cerrar a un leaf con valores y eventos explícitos. `vista`, historial, fechas/derivados, preflight, códigos, DTOs, guardando y callbacks permanecen en diálogo; tampoco añadir BotonEnvio/ErrorRecuperable automáticamente. No cambiar copy, labels, tipo input/min, disabled, foco/Escape, loading/error, allSettled ni onExito. Riesgo MEDIUM por prop wiring/foco. Compartidos read-only: APIs/types/fechas/erroresHorario y toda infraestructura; cross-lane sin cambios, ambigüedad contractual → Human Gate.

FAST: tres tests semanales, dos de página real, typecheck/lint y browser semanal a768 más diálogo a375/1440 en regresión. FULL: misma matriz completa que M09 y auditor NUEVO Sol-high enfocado separación presentación/escritura y fallos de refresh. Ruta Sol-medium justificada por frontera React/callbacks; recon mecánico Luna-medium. Rollback sólo del split y imports a snapshot M09; no nuevos contratos ni helpers de dominio compartidos.

### M11 — encabezados presentacionales del calendario

Dependencias: M09 aceptado; M10 no es dependencia semántica (puede ordenarse después para evitar dos editores simultáneos); nueva concesión humana. Candidato EXACTO: `src/modulos/programacion/componentes/CalendarioHorariosInstructor.tsx`, nuevo `src/modulos/programacion/componentes/CabecerasCalendario.tsx`, `src/pages/salones/components/CalendarioHorariosInstructorCaracterizacion.test.tsx` sólo para wiring indispensable. Tres paths finitos máximos; Rootdocs aparte. Consumidor único del leaf: calendario.

Extraer solamente la fila de encabezados980–1080 con datos de presentación ya calculados y callback de operación por fecha. La fecha local, sort, min/max, refs, geometría/columnas, franjas, overlays, handlers mouse, tipos privados, asignaciones y preflight permanecen en calendario. No dividir el bloque recurrente/overlay en este slice ni mezclar un cambio de algorithms con presentación. Mantener dimensiones/márgenes/copy/tooltip y clase existente usada por el browser anterior. Riesgo HIGH geometría porque el ancho del header se relaciona con la columna mouse; no cambiar wrappers/tamaño/DOM que desplace esa relación sin explicit scope.

FAST: calendarios originales+nuevos, typecheck/lint y ambos specs Chromium, con bounding placements375/768/1440, resize y trece dragcases intactos. FULL: matriz completa, manifest/import graph, auditor NUEVO Sol-high sobre geometría/permisos/fechas. Ruta Sol-medium por acoplamiento React/DOM; Luna-medium sólo para inventario. APIs/types/utils/shell/theme/harness read-only; sin cross-lane implementación. Rollback exclusivo del leaf+import a snapshot previo; si exige modificar expectativas geométricas válidas o tocar producción excluida, STOP `SCOPE_EXPANSION_REQUIRED`.

### Corrección async/feedback posterior: fuera de M09/M10/M11

El controlador con guardias de generación/identidad para lecturas de sede/semana/filtros y feedback de readreject debe ser un slice separado con autorización humana expresa. Candidatos a evaluar, no freeze ni permiso: `src/modulos/programacion/paginas/SalonHorarios.tsx`, nuevo `src/modulos/programacion/hooks/useControlProgramacion.ts`, `src/modulos/programacion/componentes/EditarHorarioSemanalDialog.tsx`, `src/pages/salones/SalonHorariosCaracterizacion.test.tsx`, `src/pages/salones/components/EditarHorarioSemanalDialogCaracterizacion.test.tsx`, `tests/e2e/programacion.spec.ts`. No añadir Query/global sesión, no decidir reglas backend, no cambiar forma/orden de escritura para corregir una carrera de lectura.

Primero definir guardia por lectura e identidad, prueba adversarial de respuestas sostenidas A/B y rechazo visible recuperable, snapshot protegido y autoridad exacta; luego implementar. Listener unmount requeriría otro scope concreto del calendario; accesibilidad/contraste/responsive también requieren concesión distinta y evaluación de UI. Ninguno queda implícitamente autorizado por el plan. Esto evita una reescritura gigante y mantiene estados de dominio/preflight junto al controlador hasta que la frontera sea aprobada.

## Evidencia y estado de aceptación

Los receipts FAST y RAW de este worker viven en `/tmp/feelingpilates-web-ux-m08/summary/implementation.json`, con locators/SHA por comando y manifiesto de los135 protegidos. Ese informe debe referenciarse duraderamente desde Orca; `/tmp` por sí solo no es autoridad portable de resume. La primera validación conservada muestra10Vitest PASS y browser4PASS/2FAIL por una suposición incorrecta del reason phrase de los recursos sintéticos, además de TS2769 por `exact` no soportado en ByRoleOptions de RTL; no son defectos de producción. Toda corrección se solicita a Root antes de escribir y conserva RAW original. Los resultados finales se reportan en implementation.json; este documento no se autoaudita ni declara milestone PASS. FULL GATE, nueva auditoría independiente y aceptación pertenecen a Root después del settlement del worker.
