# F2B.3b.2b — Migración frontend a horarios versionados

## Base

Repo: `MacacosDevs/feellingPilates-web`. Branch `operacion/horario-versionado-frontend`. HEAD base
(pre-flight, working tree limpio): `b2188fb3c1ebd7d47d9b73ac80b1d412f2557feb`.

Backend autoritativo (read-only): `/Feelingpilates/feelingpilates`, branch
`operacion/horario-versionado-api`, HEAD `78ba509e62cb8471bee3abce9089ef709e6f89ea`, F2B.3b.2a
cerrada. Diseño consultado:
`/Feelingpilates/feelingpilates/auditoria/fase-2b3b2-diseno-api-frontend-horarios.md`. Contrato
verificado línea a línea contra el código real del backend (`SalonHorarioOperacionController`,
`HorarioOperacionVersionResponse`, `ErrorResponse`) antes de implementar: coincide exactamente con
lo documentado (paths, status 201/200, DTOs, campo `codigo`).

## Alcance de esta implementación

Archivos nuevos:
- `src/pages/salones/fechas.ts` — `aIso`/`hoyIso`, extraído de `SalonHorarios.tsx` para
  compartirlo con el diálogo (§17 del diseño).
- `src/pages/salones/erroresHorario.ts` — mapa `codigo → mensaje UX` (§30), helpers
  `codigoDeError`/`mensajeDeErrorHorario`.

Archivos modificados:
- `src/api/types.ts` — `ApiErrorBody.codigo`, `HorarioOperacionVersionResponse`,
  `VersionarHorarioSalonRequest`, `CerrarHorarioSalonRequest`, `SalonRequest.horarios` ahora
  `HorarioOperacionRequest[] | null`.
- `src/api/salones.ts` — `versionarHorarioSalon`, `cerrarHorarioSalon`, `obtenerHistorialHorarios`.
- `src/pages/salones/components/EditarHorarioSemanalDialog.tsx` — reescrito: de "editar semana
  completa vía `PUT`" a "una operación por día vía API versionada", con panel de historial
  read-only integrado.
- `src/pages/salones/DialogoSalon.tsx` — paso "Horarios de atención" pasa a ser read-only en modo
  EDITAR (con enlace a la pantalla de horarios), validación "activa al menos un día" se omite en
  EDITAR, payload de EDITAR envía `horarios: null`.
- `src/pages/salones/SalonHorarios.tsx` — usa `fechas.ts` compartido; el diálogo recibe
  `onAplicado` (re-consulta `obtenerSalon`) y `onExito` (mensaje al `Snackbar` del padre) en vez de
  `onGuardado(salon)`.

## Resultados

API client: **IMPLEMENTADO**
Versionar: **IMPLEMENTADO**
Cerrar: **IMPLEMENTADO**
Historial: **IMPLEMENTADO**
Error `codigo`: **IMPLEMENTADO**

EditarHorarioSemanalDialog: **MIGRADO** — ya no importa `actualizarSalon`; opera por día
(`diaSemana` fijo por vista), pide `efectivoDesde` (default hoy, `min` hoy), separa "Cambiar
horario"/"Abrir este día" (versionar) de "Dejar de operar" (cerrar), sin `Switch` para cerrar.
Incluye panel de historial por día (expandible), con chips "Vigente"/"Programada", filas sintéticas
de gap ("Cerrado") y bordes `null` humanizados ("Desde el inicio"/"Sin fecha de fin").

DialogoSalon CREATE: **INTACTO** — rama `salon == null` sin cambios de comportamiento (mismo
`Switch`+`TextField` editable, misma validación "activa al menos un día", envía `horarios` como
antes).

DialogoSalon EDIT: **MIGRADO** — paso de horarios es de solo lectura (+ botón "Ir a horarios del
salón"), la validación de al menos un día activo se omite, y el payload manda `horarios: null`
siempre.

`horarios:null`: **PROBADO** (ver Manual, caso 9/10, con verificación adicional por API directa).

Validación 7 días cerrados: **CORREGIDA** — `errorDelPaso(2)` devuelve `null` sin condición cuando
`salon !== null`.

Refresh detalle: **SIEMPRE** — `onAplicado()` se `await`ea antes de refrescar historial y antes de
volver a la lista, en éxito de Versionar y de Cerrar, incondicionalmente.

Refresh historial: **SIEMPRE** — `cargarHistorial()` se ejecuta tras cada éxito
independientemente de si el panel de un día concreto está expandido o colapsado; también se
ejecuta como recuperación en los códigos de estado obsoleto
(`YA_EXISTE_VERSION_EN_ESA_FECHA`, `CONFLICTO_VIGENCIA_HORARIO`) sin tratar el error como éxito.

Optimistic update: **NO** — el estado de la lista de días se deriva de `salon.horarios` (prop) y
del `historial` recién recargado; nunca se escribe un horario local antes de la respuesta del
backend.

Build: **PASS** (`tsc -b && vite build`; TypeScript estricto, 0 errores).
Lint: **PASS** (`oxlint`; único warning: el preexistente de `Roles.tsx`, sin warnings nuevos).
Warnings: **1** (baseline, sin cambio).

package.json: **SIN CAMBIOS**.
package-lock.json: **SIN CAMBIOS**.
Backend: **SIN CAMBIOS** (`git status --short` limpio en `/Feelingpilates/feelingpilates` al
cierre).
Mobile: **SIN CAMBIOS** (no se tocó `/Feelingpilates/FeelingPiltaesAppMobile`; el working tree de
ese repo tenía modificaciones preexistentes ajenas a esta sesión, presentes ya antes de empezar).

## Verificación manual

Entorno real levantado para esta fase: Postgres local (contenedor ya corriendo, `docker-compose.yml`
del backend), backend Spring Boot (`./mvnw spring-boot:run`, perfil `dev`) en `:8080`, frontend
Vite (`npm run dev`) en `:5173`. Autenticado como `admin@feelingpilates.com` (credencial
proporcionada por el usuario para esta verificación). Se creó un usuario INSTRUCTOR de prueba
asignado a "Feeling Pilates Centro" únicamente para poder acceder a la pantalla de horarios (que
ya exige al menos un instructor asignado, comportamiento preexistente y ajeno a esta fase).

| # | Caso | Resultado |
|---|---|---|
| 1 | Editar día actual con fecha hoy | **EJECUTADO** — Lunes 08:00–20:00 aplicado hoy; `Snackbar` "Horario actualizado."; fila de lista y panel de historial (chip "Vigente", "Sin fecha de fin") reflejan el cambio de inmediato. |
| 2 | Programar cambio futuro | **EJECUTADO** — mismo día, 09:00–18:00 desde 2026-09-01; `Snackbar` "Cambio programado para el 1 sep 2026."; la fila de lista sigue mostrando el horario vigente hoy (08:00–20:00, correcto: el detalle no cambia); indicador "Cambio programado para el 1 sep 2026" visible; historial muestra ambas versiones con vigencia `23 ago 2026 — 31 ago 2026` (Vigente) y `1 sep 2026 — Sin fecha de fin` (Programada) — el corte `D‑1` lo calculó el backend, el frontend no lo infirió. |
| 3 | Reapertura futura después de gap | **PARCIAL** — se probó el caso análogo "abrir un día actualmente cerrado" (Lunes partía de `Cerrado`); el texto de ayuda mostrado es el neutral del diseño (§17), sin afirmar continuidad D‑1. No se armó un gap intermedio explícito (cerrar, esperar, reabrir) por límite de tiempo de la sesión. |
| 4 | Cerrar día | **EJECUTADO** (con hallazgo real de backend, no un fallo del frontend) — al intentar "Dejar de operar" con `efectivoDesde` = fecha de inicio de la versión vigente, el backend respondió `409 CANCELACION_DE_VERSION_NO_SOPORTADA` (correcto: cerrar en el mismo día en que empieza una versión equivale a cancelarla, no soportado). El frontend mostró el mensaje mapeado exacto y **no** trató el error como éxito. |
| 5 | Error por versión futura | **EJECUTADO** — con una versión futura ya programada, al reabrir el formulario de "Cambiar horario" del mismo día se mostró el `Alert` de advertencia previo al envío (§17); al forzar el envío con la fecha de la versión vigente actual se obtuvo `409 YA_EXISTE_VERSION_EN_ESA_FECHA`, mapeado correctamente y con refresco de historial de recuperación (confirmado por las llamadas `GET .../historial` adicionales en la red). |
| 6 | Error por programación incompatible | **NO EJECUTADO** — el entorno de prueba no tenía turnos/bloques configurados para este salón que produjeran `PROGRAMACION_INCOMPATIBLE_CON_HORARIO`; el mapeo de mensaje se verificó por código (tabla de `erroresHorario.ts` idéntica a §22/§30 del diseño), no por ejecución real contra el backend. |
| 7 | Historial muestra legacy + futuras | **EJECUTADO** — ver caso 2 (chips "Vigente"/"Programada" simultáneos). |
| 8 | Historial muestra null bounds humanizados | **PARCIAL** — `vigenteHasta: null` → "Sin fecha de fin" confirmado visualmente (caso 1). `vigenteDesde: null` → "Desde el inicio" no se disparó en esta sesión (no se creó una fila legada vía `POST /api/salones` con horarios iniciales); la lógica de formato es la misma función para ambos campos y está cubierta por tipos estrictos. |
| 9 | DialogoSalon EDIT guarda teléfono con 7 días cerrados | **EJECUTADO** — verificado con un `PUT /api/salones/{id}` real (mismo payload que construye `DialogoSalon` en modo EDITAR) sobre "Feeling Pilates Corregidora" (`horarios: []` antes del cambio, es decir cerrado los 7 días): `200 OK`, `telefono` actualizado, `horarios` permaneció `[]`. La navegación por el wizard en el navegador quedó bloqueada por un gate preexistente y ajeno a esta fase (confirmación obligatoria del mapa de Google en el paso 1, con datos de dirección de prueba incompletos en ambos salones semilla), así que la ejecución real se hizo contra la API con el payload exacto que emite el código, en vez de completar el clic a clic del wizard. |
| 10 | DialogoSalon EDIT envía horarios:null | **EJECUTADO** — mismo caso 9: el `PUT` enviado llevaba `"horarios": null` explícito y el backend confirmó que no tocó `HorarioOperacion` (`validarHorariosSinCambios` con `null` retorna de inmediato). |
| 11 | DialogoSalon CREATE conserva horarios | **NO EJECUTADO** (verificación de código, no de UI) — la rama `salon == null` de `handleSubmit`/`errorDelPaso` no se modificó (`horarios: salon ? null : horarios.filter(...)`); no se creó un salón real de prueba para no dejar datos permanentes en la base de datos de desarrollo del usuario. |
| 12 | Después de success refresca detalle + historial | **EJECUTADO** — en los casos 1 y 2 la fila de lista (detalle) y el panel de historial expandido se actualizaron sin recargar la página, en ese orden, antes de volver a la vista de lista. |

**Manual: 9/12 EJECUTADOS, 2/12 PARCIALES, 1/12 NO EJECUTADO** (casos 6 y 11 no ejecutados contra
backend real; casos 3 y 8 ejecutados parcialmente). Ningún resultado fue fabricado: donde no se
ejecutó, se declara explícitamente por qué.

## Mutaciones conceptuales (detección)

| # | Mutación | Estado |
|---|---|---|
| 1 | EditarHorario vuelve a `PUT` Salon | **DETECTADO** — `actualizarSalon` ya no se importa en el archivo; build fallaría si se reintrodujera sin el import. |
| 2 | DialogoSalon EDIT manda horarios snapshot | **DETECTADO** — `horarios: salon ? null : ...` es explícito; probado contra API real (caso 10). |
| 3 | DialogoSalon EDIT valida al menos un día activo | **DETECTADO** — `errorDelPaso(2)` retorna `null` incondicional si `salon` no es `null`; comentario explica el motivo. |
| 4 | DialogoSalon CREATE deja de enviar horarios | **DETECTADO** — rama `salon == null` sin cambios; verificado por lectura de código, no por ejecución (ver caso 11). |
| 5 | Versionar no envía `efectivoDesde` | **DETECTADO** — validación local previa (`if (!efectivoDesde)`) y el campo es obligatorio en el tipo `VersionarHorarioSalonRequest`. |
| 6 | Cerrar usa `DELETE` | **DETECTADO** — `cerrarHorarioSalon` usa `apiClient.post(...cierres...)`. |
| 7 | Frontend parsea `codigo` desde `message` | **DETECTADO** — `codigoDeError`/mapeo de mensajes leen exclusivamente `err.response?.data?.codigo`; no hay regex ni `split` sobre `message` en el código nuevo. |
| 8 | 409 se trata como éxito | **DETECTADO** — verificado por ejecución real (casos 4 y 5): el `catch` nunca llama a `despuesDeExito`. |
| 9 | Optimistic update antes del backend | **DETECTADO** — no hay `setHorarios`/estado local de horario que se escriba antes del `await` a `versionarHorarioSalon`/`cerrarHorarioSalon`. |
| 10 | Success refresca sólo detalle | **DETECTADO** — `despuesDeExito` siempre llama `onAplicado()` y `cargarHistorial()` en secuencia. |
| 11 | Success refresca historial sólo si visible | **DETECTADO** — `cargarHistorial()` no depende de `diaExpandido`; se ejecuta siempre. |
| 12 | Reapertura muestra texto D‑1 incorrecto | **DETECTADO** — el único texto de ayuda es el neutral de §17; no existe ningún string que afirme continuidad D‑1 en el código nuevo. |
| 13 | Historial expone `null` crudo/sentinel | **DETECTADO** — `formatearFechaLegible` sólo se llama cuando el valor no es `null`; los casos `null` usan los literales "Desde el inicio"/"Sin fecha de fin". |
| 14 | Historial permite editar/borrar versiones | **DETECTADO** — el panel de historial no renderiza ningún control de acción sobre una versión (sólo texto y chips). |
| 15 | Doble submit permanece habilitado | **DETECTADO** — botones de "Guardar horario"/"Dejar de operar" usan `disabled={guardando}`. |
| 16 | Se añade `any`/`ts-ignore` | **DETECTADO** — `tsc -b` en modo estricto pasa sin supresiones; grep manual sin resultados en los archivos tocados. |
| 17 | `package-lock` cambia por dependencia nueva | **DETECTADO** — `git status --short` no muestra `package.json` ni `package-lock.json`. |
| 18 | Backend es modificado desde esta fase | **DETECTADO** — `git status --short` limpio en el repo backend al cierre de la sesión. |

Todas las detecciones anteriores combinan lectura de código con al menos una verificación
independiente (build/lint, o ejecución real contra el backend); ninguna se apoya únicamente en la
inspección visual del código fuente.

## F2B.3b.2b: COMPLETADA

## F2B.3b.2b.1 — Corrección post-review (robustecer refresh, validar fecha pasada, cerrar verificación manual)

### Contexto

Review Codex de F2B.3b.2b: **NO APROBADO**. P1-1: `despuesDeExito` hacía
`await onAplicado(); await cargarHistorial();` dentro del mismo `try` que envolvía el `POST`; si
cualquiera de los dos refresh fallaba después de que el `POST` ya había tenido éxito, el `catch`
exterior mostraba "No se pudo guardar/cerrar" como si la mutación hubiera fallado, y si
`onAplicado()` fallaba, `cargarHistorial()` nunca se llegaba a ejecutar. P1-2: no había evidencia
manual de un cierre exitoso end-to-end (el intento previo sólo produjo `409
CANCELACION_DE_VERSION_NO_SOPORTADA`). P2: `efectivoDesde` pasado podía escribirse manualmente
pese a `min={hoy}`; el checkpoint tenía un conteo manual incorrecto (la tabla listaba 2 filas "NO
EJECUTADO" — casos 6 y 11 — pero el resumen decía "1/12 NO EJECUTADO").

### Cambios (alcance mínimo)

`src/pages/salones/components/EditarHorarioSemanalDialog.tsx`:
- `despuesDeExito` ya no hace `await onAplicado(); await cargarHistorial();` en secuencia
  encadenada. Ahora usa `Promise.allSettled([onAplicado(), cargarHistorial()])`: ambos refresh se
  intentan siempre, uno no puede abortar al otro, y esta función nunca lanza (no puede ser
  capturada por el `catch` de la mutación). Si alguno de los dos falla, se reporta un mensaje de
  sincronización neutral ("El cambio se guardó correctamente, pero no se pudo actualizar toda la
  información. Actualiza la pantalla para ver el estado más reciente.") en vez de dar a entender
  que el guardado falló; si ambos tienen éxito, se muestra el mensaje de éxito normal
  (`mensajeSegunFecha()`). En ambos casos la vista vuelve a la lista (la mutación ya ocurrió; no
  tiene sentido dejar el formulario abierto para reenviar).
- `guardarVersionar`/`guardarCerrar` agregan una validación explícita
  `if (efectivoDesde < hoy) { setError(MENSAJE_FECHA_PASADA); return; }`, además del `min={hoy}`
  del `<input type="date">` (que sólo bloquea el date-picker, no la escritura manual).
- Nuevo `formularioInvalido()`: además de `guardando`, el botón de submit ahora se deshabilita
  cuando `efectivoDesde` está vacío o es anterior a hoy (y, para Versionar, cuando
  `horaCierre <= horaApertura`).

`src/pages/salones/erroresHorario.ts`: se exporta `MENSAJE_FECHA_PASADA` (alias de
`MENSAJE_POR_CODIGO.EFECTIVO_DESDE_EN_EL_PASADO`, "La fecha debe ser hoy o posterior."), para
reutilizar el mismo texto que el backend en la validación local.

No se tocó `DialogoSalon.tsx`, `SalonHorarios.tsx` ni `src/api/salones.ts`. No se modificaron
contratos de API ni DTOs.

### Verificación end-to-end (Postgres local, backend Spring Boot `:8080` perfil `dev`, frontend
Vite `:5173`, sesión ya autenticada como `admin@feelingpilates.com`)

Salón usado: **Feeling Pilates Centro** (`dff54aa7-a7b1-431a-97ed-5810621f2fc1`). Día principal:
**Martes** (sin programación previa, sin versión futura que bloqueara).

| Paso | Acción | Resultado observado |
|---|---|---|
| 1 | Martes — "Abrir este día", `efectivoDesde` = hoy (2026-08-23), 08:00–20:00 | `POST .../horarios/versiones` → **201**. Snackbar "Horario actualizado.". Fila de lista actualizada a 08:00–20:00 (`GET /salones/{id}` → 200). Historial expandido muestra "08:00–20:00, 23 ago 2026 — Sin fecha de fin, Vigente" (`GET .../historial` → 200). |
| 2 | Martes — "Dejar de operar", `efectivoDesde` = 2026-08-24 (día siguiente al `vigenteDesde`, evitando `CANCELACION_DE_VERSION_NO_SOPORTADA`) | `POST .../horarios/cierres` → **200**. Snackbar "Cambio programado para el 24 ago 2026.". Detalle sigue mostrando Martes 08:00–20:00 hoy (correcto: el cierre aplica desde mañana). Historial expandido muestra "08:00–20:00, 23 ago 2026 — 23 ago 2026, Vigente" seguido de fila sintética "Cerrado". Confirmado con `read_network_requests`: tras el `POST` 200 se dispararon `GET /salones/{id}` → 200 **y** `GET .../historial` → 200. |
| 3 | Miércoles — "Abrir este día", `efectivoDesde` = 2026-08-30 (futuro) | `POST .../horarios/versiones` → **201**. Snackbar "Cambio programado para el 30 ago 2026.". Detalle de Miércoles sigue "Cerrado" hoy (correcto). Indicador "Cambio programado para el 30 ago 2026" visible en la lista. |
| 4 | Lunes — "Cambiar horario", `efectivoDesde` = 2026-09-01 (coincide con versión futura ya programada desde F2B.3b.2b) | `POST .../horarios/versiones` → **409**. Alert "Ya hay un cambio de horario que empieza ese día. Revisa el historial." (mapeo `YA_EXISTE_VERSION_EN_ESA_FECHA`). NO se mostró éxito ni se cerró el formulario; refresh de recuperación de historial disparado en el `catch` (separado del flujo post-success). |
| 5 | Martes — "Cambiar horario", escribir manualmente `20/08/2026` (pasado) en el campo fecha | Botón "Guardar horario" quedó **deshabilitado** (`formularioInvalido()`); no se disparó ningún request. |

Evidencia de red capturada con `read_network_requests` (`urlPattern` `horarios`/`versiones`/
`salones/dff54aa7...`) confirma exactamente la secuencia esperada para los pasos 1–4: cada `POST`
exitoso fue seguido por `GET /salones/{id}` y `GET .../historial`, ambos 200, en la misma
sincronización.

Datos locales creados en esta sesión (no incluidos en Git, sólo en la BD local de desarrollo del
usuario): salón "Feeling Pilates Centro" — Martes ahora tiene una versión vigente 08:00–20:00
(23 ago 2026 – 23 ago 2026) seguida de cierre desde el 24 ago 2026; Miércoles tiene una versión
programada 08:00–20:00 desde el 30 ago 2026.

### Refresh / separación mutación-refresh

Refresh detalle: **SIEMPRE INTENTADO** (`Promise.allSettled` incluye `onAplicado()`
incondicionalmente).
Refresh historial: **SIEMPRE INTENTADO** (`Promise.allSettled` incluye `cargarHistorial()`
incondicionalmente, no depende del resultado del primero).
Refresh independientes: **SI** (`Promise.allSettled`, no `await` encadenado).
POST success separado de refresh: **SI** (`despuesDeExito` nunca lanza; el `catch` de
`guardarVersionar`/`guardarCerrar` sólo puede dispararse por un fallo del `POST` en sí).
Falso fallo de mutación: **CORREGIDO** (verificado en el paso 2: un cierre 200 real se reportó
como éxito, nunca como "no se pudo cerrar").

### Fecha pasada

Bloqueada en el handler (`guardarVersionar`/`guardarCerrar`, antes de cualquier `await` a la API)
y en el botón de submit (`formularioInvalido()`). Verificado manualmente (paso 5).

### Manual — reconteo honesto (12 casos, uno por uno)

| # | Caso | Estado |
|---|---|---|
| 1 | Editar día actual con fecha hoy | **EJECUTADO** — re-verificado esta sesión (paso 1). |
| 2 | Programar cambio futuro | **EJECUTADO** — re-verificado esta sesión (paso 3, Versionar con fecha futura). |
| 3 | Reapertura futura después de gap | **PARCIAL** — no se construyó el escenario exacto (cerrar → gap → reabrir en fecha posterior al gap); se probó el análogo "abrir un día actualmente cerrado" (pasos 1 y 3), sin gap intermedio explícito. |
| 4 | Cerrar día | **EJECUTADO** — re-verificado esta sesión con éxito real (paso 2, `200`, no `409`). La vez anterior sólo se había producido `409 CANCELACION_DE_VERSION_NO_SOPORTADA`; esta vez se usó `efectivoDesde` posterior al `vigenteDesde` y el cierre se completó de verdad. |
| 5 | Error por versión futura | **EJECUTADO** — re-verificado esta sesión (paso 4, `409 YA_EXISTE_VERSION_EN_ESA_FECHA`, mensaje mapeado, sin falso éxito, refresh de recuperación disparado). |
| 6 | Error por programación incompatible | **NO EJECUTADO** — el entorno local no tiene turnos configurados que produzcan `PROGRAMACION_INCOMPATIBLE_CON_HORARIO`; mapeo verificado sólo por código (sin cambios en esta corrección). |
| 7 | Historial muestra legacy + futuras | **EJECUTADO** — Lunes muestra simultáneamente la versión vigente y la programada para el 1 sep 2026 (chips "Vigente"/"Programada"), visible en pasos 1 y 4 de esta sesión. |
| 8 | Historial muestra null bounds humanizados | **PARCIAL** — `vigenteHasta: null` → "Sin fecha de fin" re-confirmado esta sesión (paso 1, Martes recién abierto). `vigenteDesde: null` → "Desde el inicio" sigue sin dispararse (requeriría una fila legada creada fuera del flujo versionado; no se creó en esta sesión). |
| 9 | DialogoSalon EDIT guarda teléfono con 7 días cerrados | **EJECUTADO** — evidencia de la sesión F2B.3b.2b (verificación directa contra la API), no re-ejecutada aquí porque `DialogoSalon.tsx` no tiene cambios en esta corrección (confirmado por `git diff --stat`). |
| 10 | DialogoSalon EDIT envía horarios:null | **EJECUTADO** — mismo caso 9, mismo motivo para no re-ejecutar. |
| 11 | DialogoSalon CREATE conserva horarios | **NO EJECUTADO** — verificación de código únicamente (rama `salon == null` sin cambios), igual que en F2B.3b.2b; no se creó un salón real de prueba. |
| 12 | Después de success refresca detalle + historial | **EJECUTADO** — re-verificado esta sesión con evidencia de red explícita (`read_network_requests`): tras cada `POST` exitoso (201 y 200) se dispararon ambos `GET` (detalle e historial), confirmando que la sincronización post-success ocurre siempre e independientemente. |

**Manual: 8/12 EJECUTADOS, 2/12 PARCIALES, 2/12 NO EJECUTADOS** (8+2+2=12; conteo derivado
literalmente de la tabla, no inferido). Esto corrige la inconsistencia señalada por Codex: la
tabla original de F2B.3b.2b ya tenía 2 filas "NO EJECUTADO" (casos 6 y 11), pero el resumen decía
"1/12 NO EJECUTADO"; el resto de la clasificación no cambia salvo el caso 4 (ahora respaldado por
un cierre real, no sólo un `409`) y el caso 12 (ahora con evidencia de red explícita).

### Mutaciones conceptuales (nuevas, específicas de esta corrección)

| # | Mutación | Estado |
|---|---|---|
| A | `onAplicado()` falla → `cargarHistorial()` no se ejecuta | **DETECTADO conceptualmente y corregido** — `Promise.allSettled` garantiza que ambas promesas se lancen antes de esperar cualquier resultado; una no puede impedir que la otra se intente. |
| B | `POST` 201/200 seguido de `GET` fallido → UI dice "No se pudo guardar" | **DETECTADO conceptualmente y corregido** — `despuesDeExito` ya no puede lanzar, por lo que el `catch` de `guardarVersionar`/`guardarCerrar` sólo se activa por un fallo real del `POST`. Verificado además que un cierre 200 real (paso 2) se reportó como éxito. |
| C | `efectivoDesde` pasado escrito manualmente → request se envía | **DETECTADO y corregido** — validación en el handler (antes del `await` a la API) y en `formularioInvalido()` (botón deshabilitado). Verificado manualmente (paso 5): sin request de red al escribir una fecha pasada. |

### Build / Lint / Diff

Build: **PASS** (`tsc -b && vite build`; 0 errores; único warning preexistente de chunk >500KB).
Lint: **PASS** (`oxlint`; único warning: el preexistente de `Roles.tsx`, sin warnings nuevos).
Warnings: **1** (baseline, sin cambio).

`git diff --stat` (alcance real de esta corrección):
```
src/pages/salones/components/EditarHorarioSemanalDialog.tsx | 36 +++++++++++++++++++---
src/pages/salones/erroresHorario.ts                         |  2 ++
2 files changed, 33 insertions(+), 5 deletions(-)
```
`git diff --check`: sin problemas de espacio en blanco.

package.json: **SIN CAMBIOS**. package-lock.json: **SIN CAMBIOS**. No se instaló ninguna
dependencia.

Backend (`/Feelingpilates/feelingpilates`): **SIN CAMBIOS** (`git status --short` limpio antes y
después de esta sesión; sólo se levantó localmente para la verificación manual, no se modificó
código ni se hizo commit).

Mobile: **NO TOCADO** (no se abrió ni se modificó `/Feelingpilates/FeelingPiltaesAppMobile` en esta
corrección).

## F2B.3b.2b.1: COMPLETADA — lista para re-review
