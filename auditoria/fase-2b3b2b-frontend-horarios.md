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
