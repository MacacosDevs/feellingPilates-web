# FeelingPilates — WEB UX PRODUCT DELIVERY RUNBOOK

# 1. PURPOSE

Autoridad versionada exclusiva de FeelingPilates — Web UX Product Delivery. Profesionalizar el frontend incrementalmente, preservando comportamiento, contratos de negocio/API y autoridad de otras lanes. Un coordinador nuevo debe leer este Runbook y WEB-UX-STATE.md antes de actuar. El estado y la evidencia estructurada de Orca permiten continuar sin relevo manual de micro-reportes.

La autorización humana vigente prevalece sobre este documento; este documento no puede otorgarse nuevas facultades ni revivir un mecanismo anterior de Autopilot.

La mecánica normativa de ejecución optimizada está en [WEB-UX-EXECUTION-POLICY.md](WEB-UX-EXECUTION-POLICY.md), versión R1, SHA256 `4d01806495ae4cce3494715d1278741f33f82ae857946980af0115f4d669237c`. Se activa como default obligatorio solo tras fresh process audit PASS (P0=0/P1=0) y optimization gate PASS registrados en STATE; solo autorización humana explícita puede anularlo. El Runbook, sus Human Gates y límites de autoridad prevalecen ante cualquier ambigüedad.

# 2. REPOSITORY AUTHORITY

Repositorio único: /Users/jesusaldaircruzortiz/Desktop/Feelingpilates/web-ux.
Branch: ux/profesionalizacion-web-r1.
No operar el worktree baseline /Users/jesusaldaircruzortiz/Desktop/Feelingpilates/web.

Modelo baseline: foundation checkpoint c443b66abfc7bb9f69e36469769a9dbaa953e45b → shell checkpoint registrado en STATE → checkpoints locales aceptados. Antes de escribir verificar branch, HEAD, index, inventario y hashes del candidato. Un delta intencional solo es aceptado con manifiesto exacto y gate PASS; HEAD solo no identifica un candidato sin commit. No descartar trabajo ni resolver drift por reset/clean.

Commits locales únicamente bajo la política de sección 8. Publicación remota automática no autorizada.

# 3. CORE PRINCIPLES

- Cambios incrementales y allowlist exacta antes de escribir.
- Un escritor coherente por fase de escritura; ningún escritor concurrente sobre el mismo candidato.
- Auditor independiente nuevo después de una escritura significativa; cada corrección exige re-auditor independiente nuevo.
- Pruebas antes de refactors riesgosos; ninguna migración big-bang.
- Preservar negocio, API, permisos, autenticación y autoridad Payments/F2E.
- Español para ownership, componentes y conceptos de aplicación/dominio cuando sea razonable; convenciones framework/API se mantienen cuando aclaran.
- Ninguna abstracción arbitraria, carpeta vacía o dependencia por popularidad.
- Defectos UX conocidos no se corrigen ni se convierten en contratos canónicos en una fase structural.

# 4. STANDARD PHASE LIFECYCLE

RECON → PLAN → FREEZE ALLOWLIST → WRITE → TARGETED VALIDATION → FULL VALIDATION → FRESH INDEPENDENT AUDIT → DECISION GATE.

PASS → CHECKPOINT cuando lo permita la fase/milestone → actualizar STATE → siguiente fase autorizada.

FAIL técnicamente corregible → CORRECTION dentro de allowlist o sub-allowlist explícita → validación → re-auditor nuevo → nuevo gate. FAIL sin autoridad o presupuesto disponible → HUMAN_GATE_REQUIRED. Un timeout/heartbeat no es un resultado; supervisar hasta settlement explícito y liberar cada worker aceptado.

Usar Orca Run/Task/Dispatch/Gate y worker_done único con resultado explícito. No reemplazar evidencia por títulos de terminal ni crear gate para contestar una pregunta interna de worker.

# 5. TECHNICAL CORRECTION BUDGET

Máximo de ciclos automáticos por fase: 2.
FAIL → corrección → fresh re-audit cuenta como un ciclo; registrar el incremento antes de corregir. No reiniciar el contador abriendo otro Run o renombrando la fase. Después de dos ciclos todavía FAIL → HUMAN_GATE por CORRECTION_BUDGET_EXHAUSTED.

Límite humano más estrecho del bootstrap R1: la auditoría de autoridad del Runbook permite una corrección técnica y re-auditoría. El máximo general sigue siendo 2, pero el límite efectivo de esta fase es 1.

# 6. AUTO-CONTINUE CONDITIONS

Continuar automáticamente solamente si todas son ciertas: dentro del milestone autorizado; sin decisión de producto; sin cambio de contrato API/negocio; sin dependencia nueva fuera de autoridad; sin cambio Payments/F2E; sin decisión sensible de seguridad/privacidad; hallazgos técnicos deterministas; corrección dentro de allowlist o sub-allowlist derivada explícita; presupuesto disponible; tests/build/lint/typecheck disponibles; política de checkpoint permite continuar.

No detenerse porque termine una fase técnica normal; persistir el progreso y avanzar a la siguiente fase autorizada. No pedir al usuario trasladar reportes internos.

# 7. HUMAN_GATE CONDITIONS

Ante cualquiera de los siguientes, detener nuevas escrituras de producto inmediatamente y establecer STATUS: HUMAN_GATE_REQUIRED:

PRODUCT_DECISION_REQUIRED
BUSINESS_RULE_CHANGE_REQUIRED
API_CONTRACT_CHANGE_REQUIRED
CROSS_LANE_DEPENDENCY_REQUIRED
NEW_DEPENDENCY_REQUIRED
SECURITY_PRIVACY_DECISION_REQUIRED
DATA_MIGRATION_REQUIRED
REMOTE_PUBLICATION_REQUIRED
SCOPE_EXPANSION_REQUIRED
UNRESOLVED_P0
UNRESOLVED_P1_REQUIRING_AUTHORITY
CORRECTION_BUDGET_EXHAUSTED
AMBIGUOUS_AUTHORITY
BASELINE_DRIFT
REMOTE_DIVERGENCE
UNEXPECTED_REPOSITORY_MUTATION

Reportar HUMAN_GATE_REASON, evidencia, opciones y decisión recomendada; no decidir por el usuario. MILESTONE_COMPLETE también termina en HUMAN_GATE_REQUIRED, semántica HUMAN_GATE_MILESTONE_COMPLETE. No corregir ni borrar mutaciones inesperadas. No hacer fetch para inventar una validación remota: REMOTE_DIVERGENCE requiere evidencia detectada, no una suposición.

Un registro documental veraz de bloqueo no autoriza commit de producto fallido. Solo puede materializarse por checkpoint de proceso aislado y auditado, con gate PASS y validación disponible; si ello no es posible, preservar STATE sin commit y declarar el límite.

# 8. LOCAL CHECKPOINT POLICY

Commits locales permitidos solo con gate de fase PASS, fresh audit PASS, candidato exacto aceptado, tests/build/type/lint PASS, staging explícito, ningún path ajeno y checkpoint dentro del milestone actual.

Staging solo por paths explícitos del manifiesto; prohibidos git add ., git add -A y git add --all. Verificar path-set y SHA de contenido del index contra el manifiesto antes del commit y snapshot/parent después. No amend, squash ni push. No combinar candidatos independientes. No añadir artefactos generados ignorados.

STATE se incluye en checkpoint aceptado de fase o checkpoint inmediato de proceso cuando corresponde. LAST_ACCEPTED_CHECKPOINT identifica el último checkpoint de producto ya existente al escribir STATE; nunca inventar el SHA del commit que contiene el propio archivo. El checkpoint de proceso que contiene STATE se descubre con git log -1 --format=%H -- auditoria/product-delivery/web-ux/WEB-UX-STATE.md.

# 9. REMOTE POLICY

Nunca ejecutar automáticamente push, force-push, merge, rebase, publicar PR ni eliminar branch. No crear upstream o publicación remota. Solo una futura autorización HUMANA explícita de un milestone puede concederlo. En este milestone NO_PUSH permanece absoluto.

# 10. TEST POLICY

Safety net aceptada obligatoria: 189 Vitest + 15 Playwright Chromium = 204; cero fallos y skips. El baseline crece monótonamente; sustitución/remoción requiere justificación explícita y auditada. Mantener SESSION-01..10, QUERY-01..08 y ZOD-01..07.

Prohibidos skip, only, blanket suppression, aceptar snapshots automáticamente y llamadas reales a pagos/backend/Google en pruebas sintéticas. MSW falla requests inesperados; fixtures sintéticos; red del navegador interceptada/bloqueada. No ocultar console/errors ni arreglar producción para facilitar una prueba.

Validación completa: npm ls --all; npm run lint; npm run test:typecheck; npm run test:run -- --maxWorkers=1; npm run test:e2e; npm run build; git diff --check. Outputs generados deben estar ignorados y no alterar archivos aceptados. Registrar warnings preexistentes sin corregirlos oportunísticamente.

# 11. DEPENDENCY POLICY

Aprobadas: React, MUI, Emotion, React Router, Zustand, Axios, Vitest, Testing Library, MSW, Playwright, TanStack Query y Zod.

Query + Zod: patrón aceptado solo para uso incremental feature-by-feature; no obligatorio globalmente. No retirar Axios/Zustand ni migrar todas las lecturas/schemas. Query mantiene retry=false, refetchOnWindowFocus=false, refetchOnReconnect=false, claves sin token y cache aislado por sesión. Zod valida shape de transporte sin autoridad de negocio.

Dependencia nueva → HUMAN_GATE salvo preautorización explícita del milestone actual. Milestone01 no permite añadir/actualizar dependencias, tampoco Axios.

# 12. ARCHITECTURE TARGET

Target aprobado incremental, sin mover globalmente src/:

```text
src/
  app/
  modulos/
  compartido/
  theme/
```

Feature-by-feature; no carpetas vacías. Mantener compartidos existentes donde están hasta autorizar su propio slice. APIs/DTOs usados por otras features no se reclaman completos para un módulo. app/layout es owner de Cabecera, Layout y NavegacionLateral; componentes genuinamente compartidos no pertenecen al shell. Evitar dumping grounds y wrappers sin responsabilidad.

# 13. NAMING

Español aplicación/dominio: Cabecera, NavegacionLateral, GestionVentas, RegistrarVenta y Actividades; los ejemplos no autorizan renombrar esas otras features. Mantener Layout, hooks, theme, tests, mocks, HTTP y APIs React/MUI cuando sean convenciones más claras. JSON fields y protocolo backend nunca se traducen.

No combinar innecesariamente move + rename + behavior change + API change. Separar move y rename si reduce claridad de auditoría. No renombrar props/state/callbacks solo por traducirlos dentro de un move.

# 14. CROSS-LANE POLICY

Payments posee pagos, settlement, refund, derechos y financial idempotency.
F2E posee autoridad backend de Programación, effective dates, excepciones y scheduling consistency.

Web UX no inventa ni redefine sus semánticas. Recursos/capacidad se preservan exactamente; pruebas solo caracterizan transporte frontend vigente. Cookies HttpOnly/refresh/CSRF o cambios de protocolo auth son CROSS_LANE_DEPENDENCY, sin implementación autónoma.

# 15. VALIDATION LEVELS

LOW-RISK structural: targeted + full regression.
MEDIUM: targeted + full regression + fresh audit.
HIGH: targeted + full regression + browser validation + fresh adversarial audit.
Toda escritura significativa requiere auditor nuevo, incluso structural LOW-RISK. Financiero/scheduling debe respetar boundaries y jamás autoriza nuevos contratos.

No afirmar cobertura porcentual ni mejora de performance sin medir. Para equivalencia structural, comparación de bytes/grafo y contratos además de pruebas.

# 16. MILESTONE MODEL

Un milestone agrupa fases técnicas preautorizadas. Autorización histórica WEB_UX_MILESTONE_01: bootstrap y prueba de ownership incremental de UNA feature no financiera/no scheduling: ACTIVIDADES.

Secuencia autorizada:
1. Reseal/materializar shell C.1+C.2 exacto.
2. Crear/auditar/versionar Runbook y STATE.
3. ACTIVIDADES_RECON: mapear páginas, componentes, API, DTOs, estado, permisos, tests e imports cruzados.
4. ACTIVIDADES_REGRESSION: gap check; si falta seguridad, escribir tests primero, validar, fresh audit y gate.
5. ACTIVIDADES_OWNERSHIP: owner src/modulos/actividades/; subfolders paginas/componentes/hooks/servicios/contratos solo si existen responsabilidades reales.
6. ACTIVIDADES_EXTRACTION_NAMING: naming seguro y controller/presentation protegidos por tests; separar fases si move+rename aumenta ambigüedad.
7. ACTIVIDADES_ACCEPTANCE: validación completa, auditor nuevo, gate y un checkpoint local de Actividades; STATE actualizado con este o inmediatamente siguiente proceso checkpoint.
8. Terminar HUMAN_GATE_MILESTONE_COMPLETE.

Puede mover componentes/hooks/servicios/contratos propios, actualizar imports y crear tests/support. Puede usar Query/Zod ya aprobado solo si hay evidencia clara para boundary GET existente sin migración global. No redesign visual, cambio de reglas/recursos/capacidad/payloads, dependencias nuevas, Payments/F2E ni migración oportunista de otras features.

Al completar milestone01: CURRENT_MILESTONE=WEB_UX_MILESTONE_01; STATUS=HUMAN_GATE_REQUIRED; HUMAN_GATE_REASON=MILESTONE_COMPLETE; NEXT_PHASE=AWAIT_HUMAN_AUTHORIZATION_FOR_MILESTONE_02. STOP. Usuarios, Roles, Salones, Ventas y Programación NO autorizadas automáticamente.

Autorización humana vigente explícita del 2026-09-16: WEB_UX_MILESTONE_02, UX-01 DESIGN SYSTEM FOUNDATION. Autoriza una base visual MUI9 incremental: tipografía, tokens/contraste, jerarquía semántica de títulos y estados visuales/foco en theme, Login, Usuarios, Roles, Actividades y DataTable compartida, con allowlist congelada y pruebas de regresión adicionales; no repetir bootstrap ni cambiar contratos de negocio/API/payload/rutas/permisos/session/Query/Zod/Payments/F2E. Riesgo HIGH: validación completa y navegador a 375/768/1440 px, auditor independiente nuevo y gate antes del checkpoint; sin dependencias nuevas o actualizadas, rediseño de features/shell responsive, migración global o publicación remota. Al completar: CURRENT_MILESTONE=WEB_UX_MILESTONE_02; STATUS=HUMAN_GATE_REQUIRED; HUMAN_GATE_REASON=MILESTONE_COMPLETE; NEXT_PHASE=AWAIT_HUMAN_AUTHORIZATION_FOR_MILESTONE_03. STOP hasta autorización humana explícita de milestone03.

Autorización humana vigente explícita del 2026-09-16: WEB_UX_MILESTONE_03, UX-02 RESPONSIVE SHELL & ACCESSIBLE NAVIGATION, desde checkpoint15fb36d47bd793c1ec560b900f66f615fa96d565. Autoriza únicamente shell app/layout Cabecera/Layout/NavegacionLateral y referencias estrictamente necesarias: navegación móvil MUI temporal bajo sm600 y rail existente en tablet/desktop, teclado/disclosures/foco/ARIA/resize/contención responsive; tests primero donde falte seguridad, HIGH validación completa y Chromium375/768/1440, fresh auditor/gate antes de commit local. Preservar IA/destinos/rutas/guards/permisos/autenticación/session/API/Query/Zod/theme M02/negocio/Payments/F2E. Sin dependencias, rediseño de features, migración global/publicación. Problemas que exigen behavior/UI de feature fuera del contrato shell → HUMAN_GATE/SCOPE_EXPANSION_REQUIRED. Max2correcciones por fase. Al completar: CURRENT_MILESTONE=WEB_UX_MILESTONE_03; STATUS=HUMAN_GATE_REQUIRED; HUMAN_GATE_REASON=MILESTONE_COMPLETE; NEXT_PHASE=AWAIT_HUMAN_AUTHORIZATION_FOR_MILESTONE_04. STOP: coordinador no elige/inicia M04.

Autorización humana vigente del 2026-09-17: WEB_UX_MILESTONE_04, UX-03 USUARIOS & ROLES OWNERSHIP AND UX STABILIZATION, desde checkpoint595177dd770cb88d4b62f9aaa21261f760e3b86a. Execution Policy R1 ACTIVE es obligatoria. Autoriza ownership incremental en modulos/usuarios y modulos/roles, tests antes de riesgo, naming español seguro, separación protegida de presentación/orquestación, responsive/listas/formularios/dialogs/foco/labels y feedback veraz de carga/vacío/error recuperable. Usuarios incluye375x400 y manejo de rechazo401 SOLO feature-owned consumiendo sesión existente. Roles preserva exactamente IDs/evaluación de permisos, membresía/editable, guards y decisiones backend; cualquier ambigüedad semántica exige HUMAN_GATE. APIs/payloads/rutas/auth/sesión/global401/Query-Zod/themeM02/shellM03/negocio/Payments/F2E permanecen. Sin nuevas dependencias, backend, redesign de otras features, migración global/publicación. Allowlist exacta antes de writer, FAST durante cambios; GATE completo y Chromium375/768/1440 para ambas features (loading/populated/empty/error/form/teclado/foco/permission rendering), fresh auditor Sol-high por seguridad y gate antes de checkpoint local explícito. Baseline mínimo264Vitest+25Chromium=289PASS0FAIL0SKIP; max2correcciones por fase. Al aceptar M04: STATUS=HUMAN_GATE_REQUIRED, HUMAN_GATE_REASON=MILESTONE_COMPLETE, NEXT_PHASE=AWAIT_HUMAN_AUTHORIZATION_FOR_MILESTONE_05. STOP; M05 no autorizado. Esta nueva concesión no revive propuestas anteriores superseded.

# 17. STATE UPDATE RULE

Después de cada gate actualizar WEB-UX-STATE.md con CURRENT_MILESTONE, CURRENT_PHASE, LAST_RUN_ID, LAST_GATE_ID, LAST_ACCEPTED_CHECKPOINT, STATUS, CORRECTION_CYCLES_USED, NEXT_PHASE, HUMAN_GATE_REASON, KNOWN_WARNINGS y CROSS_LANE_BLOCKERS; commit junto al checkpoint de fase o checkpoint de proceso cuando corresponda.

Transiciones deterministas: BOOTSTRAPPING → READY tras bootstrap PASS; READY → IN_PROGRESS al iniciar fase con allowlist; PASS → READY con NEXT_PHASE autorizada; FAIL corregible → CORRECTION_REQUIRED incrementando contador antes de corregir; FAIL sin autoridad/presupuesto → HUMAN_GATE_REQUIRED; milestone final PASS → HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE. El contador se reinicia solo al iniciar otra fase real, nunca para reintentar la misma.

Reanudación: leer ambos archivos y última autorización humana; verificar branch/HEAD/status/index contra checkpoint o manifiesto aceptado registrado; consultar Orca LAST_RUN_ID/LAST_GATE_ID y CURRENT_CANDIDATE_MANIFEST si hay delta; exigir exactitud antes de editar. Si un Run activo previo mantiene escritor, observar settlement/liveness, no lanzar duplicado. Si STATUS HUMAN_GATE_REQUIRED, no avanzar hasta nueva autorización humana. NEXT_PHASE no otorga autoridad por sí mismo. Registrar Task/Dispatch/allowlist/audit/manifiesto detallados en Orca, no duplicar una jerarquía de process files.

# 18. M04 SCOPE / PROVENANCE REPAIR — CONCESIÓN HUMANA POSTERIOR

La concesión HUMAN AUTHORIZATION — M04 SCOPE / PROVENANCE REPAIR autoriza únicamente reparar prospectivamente autoridad del provisional msg_0da81bf32264 (21 paths), manteniendo M04-SCOPE-01 y M04-AUTH-02 históricos. HISTORICAL_PREWRITE_EVIDENCE permanece UNAVAILABLE; reconstrucción fresca reproducible baseline595177dd770cb88d4b62f9aaa21261f760e3b86a vs candidato no prueba prewrite histórico. Sin reset destructivo, nuevas dependencias, cambios de auth/permisos/session/API/Payments/F2E.

Reparación: congelar exacto manifiesto actual → adjudicar path/hash actual de roles.contract.test.ts → caracterización equivalente baseline/candidato en contexto aislado → repaired allowlist exacta finita (default21, excepciones test/support indispensables documentadas y auditadas) → NEW fresh Sol-high repair audit P0=0/P1=0 → repair gate PASS/FAIL. Si PASS, establece M04_SCOPE_AUTHORITY_REPAIRED, M04_CHARACTERIZATION_AUTHORITY_REPAIRED y PRESERVED_CANDIDATE_AUTHORIZED_TO_RESUME, nunca M04_ACCEPTED. Si ambigüedad, STOP HUMAN_GATE sin inventar autoridad con budget técnico.

Solo después de repair gate PASS auto-continuar M04 bajo allowlist reparada y §16 original: FAST, fullGATE y Chromium375/768/1440, NEW acceptance auditor distinto del repair auditor, P0=0/P1=0, gate final antes de checkpoint local explícito. Max2 ciclos técnicos por fase; fresh re-auditor cada corrección. Sin M05/publicación. Final PASS → STATE HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_MILESTONE_05. Política R1 y sus condiciones fail-closed permanecen intactas.

## Human authorization — WEB_UX_MILESTONE_05

Accepted entry checkpoint: e5d8def77b0a15295ba477ef5b2f9c9a13662736. Objective UX-04 — Salones & Resource Configuration UX. The human authorizes finite Salones-owned CRUD/configuration ownership, tested presentation/controller extractions, responsive/forms/accessibility and truthful loading/error/empty/save feedback. Freeze exact paths and protected characterization before risky writes. No new dependencies, backend/API/payload changes, authorization/session changes, capacity/inventory/equipment-consumption rules, Programación editor/calendar or scheduling semantics, Payments/F2E, unrelated migration or remote publication. Apply mandatory R1 routing/evidence/FAST/GATE policies and maximum two correction cycles. Validate synthetic Salones list and create/edit/resource configuration at 375/768/1440 and difficult dialog heights, keyboard/focus/errors/feedback. Final new Sol-high independent audit and Gate PASS precede explicit local checkpoint. Close STATE at HUMAN_GATE_REQUIRED / MILESTONE_COMPLETE / AWAIT_HUMAN_AUTHORIZATION_FOR_MILESTONE_06; M06 remains NOT_AUTHORIZED.

## Human authorization — WEB_UX_MILESTONE_06

UX-05 shared async feedback/form UX foundation from checkpoint e2967315218da6e42632f698367c5476fc97b4f7. Require repeated semantics/interaction/stable ownership and reduced ambiguity before small shared presentation-only primitives under src/compartido; bounded adoption in Actividades/Usuarios/Roles/Salones. Differing lifecycles remain feature-owned. No generic framework, server/request/session/permissions/business authority, global migration, dependencies, Ventas/Programación/Payments/F2E changes or remote publication. Frozen finite paths, pre-extraction characterization, direct primitive/consumer tests, browser375/768/1440, fullGATE359prior mandatory, NEW semantic Sol-high abstraction audit (overgeneralization P1), actual DecisionGate before exact local checkpoint. MAX2 correction cycles per phase. On completion HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_MILESTONE_07; M07 NOT_AUTHORIZED.

## Human authorization — WEB_UX_MILESTONE_07

UX-06 Ventas ownership/non-financial UX stabilization from accepted480b09cc9d4afe0b0c5c13e89b70a38a3c939dc2. Characterization precedes risky refactors; exact finite source/import/test/process paths frozen in Orca. Preserve ALL financial calculations/prices/quantities/paymentmethods/statuses/Stripe/refund/rights/settlement/idempotency/completion/API/payload/permissions/auth/session and Payments/F2E authority. No dependencies/backend/global migration/Payments/F2E/publication. Shared ErrorRecuperable/BotonEnvio only exact equivalent presentation; financial differences must remain visible. Financial ambiguity → HUMAN_GATE/FINANCIAL_AUTHORITY_CHANGE_REQUIRED; conflict with Payments → CROSS_LANE_DEPENDENCY_REQUIRED, never choose financial rules from Web. Synthetic browser375/768/1440, full accepted303Vitest+65Chromium regression; mandatory NEW final Sol-high financial-adjacent audit P0/P1zero and GatePASS before explicit local checkpoint. PolicyR1 MAX2corrections per phase. Close HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_MILESTONE_08; M08 NOT_AUTHORIZED.

## Human authorization — WEB_UX_MILESTONE_08

UX-07 Programación recon/characterization/safety net and finite future refactorboundarydesign from accepted b0399edc001f733bd61e616560d87591955913c1. ONLY test/support and required processdocumentation writes under exactfiniteallowlist; ALL production byteprotected, no rename/move/refactor/testabilitychange. A strictlynecessary productiontestabilitychange requiresHUMAN_GATE/SCOPE_EXPANSION_REQUIRED. Protect currentobservableWebgeometry/drag/date/permissions/requestpayloads, not inventF2Esemantics; knownerror-asempty/staleresponse/listener/accessibilitygaps are NOT_LOCKED. F2E remainsauthorityeffective dates/TurnoInstructor/overlaps/specialties/confirmation/reservations/snapshots/darklaunch/cutover. Actual conflictingauthority or expectation requiringbackenddecision => HUMAN_GATE/CROSS_LANE_DEPENDENCY_REQUIRED. No dependencies/backend/Payments/F2E/business/API/session/auth changes/publication. R1 FAST thenfullGATE preserving318+68; NEW Sol-high safety-net audit P0/P1zero andactualGatePASS precedeexactlocaltest/processcheckpoint. Futurefinite slices documentedonly, notauthorized. Close HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_PROGRAMACION_IMPLEMENTATION_SLICE; do not startnextslice.

## HUMAN AUTHORIZATION — WEB_UX_MILESTONE_09

UX-08 Programación ownership-only from accepted b4e5659ce1b4de93aa099050929972285404f390 and immutable M08 PlanDoc. Freeze exact source/target/import/test paths plusRootSTATE/RUNBOOK beforewrite; fresh47ProgramaciónVitest+20Chromium baseline guard and allentryhashes exact. Move onlySalonHorarios, CalendarioHorariosInstructor, EditarHorarioSemanalDialog into modulos/programacion with same names/exports/nonmodulepathbytes; required imports and five test import/mock specifiers only. Filesystem moves keep indexempty; no gitmv/staging beforeactualGate. AllknownM08gaps remainNOT_LOCKED; F2EcompatibilityUNVERIFIED, no semanticadjudication. No cleanup/formatting/refactor/extraction/behavior/JSX/styles/state/effects/API/session/permissions/Query/dependencies/backend/crosslane/remote change. FAST per ownershipunit, finalfullGATE403mandatory, NEW Sol-high independentaudit P0/P1zero and actualDecisionGate beforeoneexplicitlocalcheckpoint. MAX2prospectivelypersistedcorrections perphase. Receipt-only auditedRootSTATEclosure, no futureownSHA. FutureM10leaf-formpresentation mayonlybe recommended fromM08Plan/currentownership; notauthorized. Complete=> HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_NEXT_PROGRAMACION_SLICE.

M09 cierre aceptado: run_91478368718c, Gate gate_93c2dee7f33f PASS, Task gate-only task_ce1bb589749d; fresh auditor task_55bc83ee8b84/ctx_7e1b2ce34a96 PASS P0=0 P1=0 P2=4, manifiesto durable msg_ceb0d475229f. Tres moves ownership-only, dieciocho specifiers de imports/mock y todos los demás bytes intactos;403tests verdes,0fail/skip/flaky. Corrección1/2 persiste; log inicial sobrescrito UNAVAILABLE y recuperaciónRAW UNREPORTED explícitos, no éxito histórico fabricado. Closure Root receipt-only auditada prospectivamente; staging exacto y un único checkpoint local con identidad durable, sin push. M08Plan/policy/APIs/helpers/dependencias/session/permissions/theme/shell y132archivos protegidos intactos. Estado HUMAN_GATE/MILESTONE_COMPLETE; siguiente split de formulario semanal es sólo recomendación M08/M10 y requiere nueva concesión humana. Ninguna corrección responsive/geométrica/async/a11y/backend/F2E ni siguiente milestone autorizado.

## M10 human authorization — weekly form presentation only

UX-09 from accepted625e5dcd343611c71e1621dfbad620a3a1e18f9a. Freeze msg_ee7d0b70c5c8: existing EditarHorarioSemanalDialog.tsx, new FormularioHorarioSemanal.tsx under modulos/programacion/componentes, plus RootSTATE/RUNBOOK only. Alltests/APIs/types/helpers/theme/shell/session/Query/dependencies and other production files read-only. Prewrite existing dialog/page characterization and private synthetic browser375/768/1440 prove controls/validation/focus/Escape/save. Extract fields/legends with explicit readonly Spanish values/callbacks; dialog retains temporal/state/history/preflight/DTO/write/save/callback/dialog decisions, validation and allSettled. No markup/style/behavior/request/permission/session/F2E change, no known-gap correction. R1 FAST thenfullGATE preserving328+75, NEW Sol-high independent auditor and actualM10Gate precede oneexplicitlocalcheckpoint. MAX2 prospectively recorded corrections; no push. Receipt-only Rootclosure after actualaudit/gate may record real IDs/results/metrics/status/acceptedmanifest; cannot change source/tests or invent own future SHA. Close HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_NEXT_PROGRAMACION_SLICE; further extraction recommendation only, never authorization.

M10 cierre aceptado: run_366be9321c42, actualGate gate_a7b5235cb004 PASS/Task task_8cbe96164d37; independentSol-high task_acd7794085ee/ctx_1ab9795e73b7 PASS P0=0 P1=0 P2=1, uniqueDone msg_428b81e92b82 and release. Two-document receiptclosure approved prospectively; dialog/orchestration and readonlyleaf preserveallbehavior,140protected,403testsPASS0fail/skip/flaky, weekly375/768/1440 beforeafteridentical. Budget2/2 records two corrected runtime-launch issues; no source correction. M10-PROCESS-01 originalresultcontractdefect remainsnonblockingP2 with independent recoveredscope/source/launch/testfacts; no retrospectivecomplianceclaim. Oneexplicitfourpathlocalcheckpoint, no ownfutureSHA and no push. CloseHUMAN_GATE/MILESTONE_COMPLETE; M11header-only proposal fromimmutableM08Plan remainsNOT_AUTHORIZED, allknown-gaps NOT_LOCKED/F2EUNVERIFIED.

## M11 human authorization — calendar header presentation only

UX-10 from accepted64e05f03accac23464d0eb03ffc7d9f33c262d31. Freeze msg_1438165b1125: existing CalendarioHorariosInstructor.tsx, new CabecerasCalendario.tsx under modulos/programacion/componentes, plus RootSTATE/RUNBOOK only; all tests and other entry files read-only. Prewrite existing22 calendar Vitest,20 scheduling Chromium and four private numeric geometry workflows prove current header/grid/block values at375/768/1440 and transition1440→768. Extract only the existing header row with explicit readonly presentation values and callbacks. Calendar retains date/exception computation, state, geometry, block placement, drag/resize, requests, permissions/session and F2E-adjacent decisions. Preserve exact wrappers, order, classes, dimensions, styles, labels, columns and callbacks; no API/temporal/geometry/responsive/a11y/listener/stale/error behavior correction and all known gaps remain NOT_LOCKED. Risk HIGH; Sol-medium single writer, FAST then fullGATE preserving328+75, private numeric before/after equivalence, NEW Sol-high auditor P0/P1zero and actualGate before one explicit local checkpoint. MAX2 M11 correction cycles, no dependencies/backend/Payments/F2E/publication. Receipt-only Root closure may update STATE/RUNBOOK after audit/gate without source/test changes. Close HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_NEXT_PROGRAMACION_SLICE; next recommendation only and never authorization.

M11-GEOM-01 correction1/2: first extraction changed stable 375px intrinsic header width by1/64px per cell because segmented JSX date text became one string; 768/1440/grid/block/transition measurements otherwise matched. Restore original text-node segmentation using explicit parent-computed presentation primitives inside the same two-file allowlist, then require exact private numeric before/after identity. No tolerance may hide this deterministic delta; no test/style/business/F2E change is authorized.

M11 correction1 result and full GATE: segmented date/habitual-hour nodes plus discriminated presentation variant restore lazy branch evaluation and exact numeric equality for all four private browser measurements. Fresh npm-ls/lint/typecheck/build/diff-check exit0;328Vitest+75Chromium=403PASS0FAIL0SKIP0FLAKY. Exact four-path candidate, empty index, all141 protected entry files/tests/packages unchanged; pre-receipt snapshot fingerprint ed40f294d764c8ea0cd327f34383bb9bcf8e67237c23114e30df464590e49cad. Final self-containing receipt identity is durable in Orca, not recursively claimed here. M11-PROCESS-01 records correction worker_done payload omitted Calendar from filesModified although its complete15-field durable report names both changed paths; final auditor adjudicates severity. No acceptance before NEW Sol-high audit and actualGate.

M11 cierre aceptado: run_c93bdbdddab4; actualGate gate_b17ae1df054d PASS/gate-only task_add9925b9bf2 completed. Fresh independentSol-high task_fc3e4a44df72/ctx_5b3f4d1c29f0 PASS P0=0 P1=0 P2=1, uniqueDone msg_9d87d552e469 and release. Auditor approved prospectively this Root receipt-only closure under exact source/test preservation. M11-GEOM-01 correction1/2 restored exact375/768/1440/transition geometry and lazy segmented labels; full403 tests and all GATE commands PASS, all141 protected/test/package bytes exact. M11-PROCESS-01 remains nonblocking P2: correction worker_done omitted Calendar from its short files list but complete durable report/manifest/transcript names both paths; no retrospective compliance claim. One explicit four-path local checkpoint, no push. Close HUMAN_GATE/MILESTONE_COMPLETE. A future time-axis presentation extraction may only be recommended as one bounded next slice; it is NOT_AUTHORIZED, all known gaps remain deferred and F2E remains UNVERIFIED.

## M12 human authorization — time-axis presentation only

UX-11 from accepted 488c8dd529bef163ab6a3b86b54d860126d573b8. Frozen scope: existing `CalendarioHorariosInstructor.tsx`, new Programación-owned `EjeHorarioCalendario.tsx`, and Root STATE/RUNBOOK only; tests and other entry files read-only unless a separately audited indispensable characterization gap appears. Extract only the current 56px axis markup from explicit readonly parent-computed labels/positions/dimensions. Calendar retains min/max, time range and vertical-scale calculations, grid origin, block/overlap geometry, drag/resize, requests, permissions/session and F2E-adjacent semantics. Exact numeric before/after equivalence is mandatory at 375/768/1440 and empty transition 1440→768; no known clipping/resize/stale/error/listener/a11y gap may be corrected. Risk MEDIUM-HIGH; Sol-medium writer, FAST then full GATE preserving 328+75, NEW Sol-high audit P0/P1 zero and actual Gate before explicit checkpoint. Max two correction cycles; no dependencies/backend/Payments/F2E/publication or next-slice authority. On PASS close HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_NEXT_PROGRAMACION_SLICE.

M12 implementation/full GATE: task_04a5cf7fce2f/ctx_42fe68df63da effective Sol-medium extracted only the parent-computed 56px axis presentation; private 375/768/1440 and empty transition before/after JSON are exactly identical. Fresh npm-ls/lint/typecheck/build/diff-check PASS and 328Vitest+75Chromium=403PASS0FAIL0SKIP0FLAKY; all142 protected entry files/packages exact. M12-PROCESS-01 records that the writer report self-reported generic model/unspecified effort although its immutable launch receipt proves gpt-5.6-sol/medium; preserve both and let the NEW auditor classify it. No product correction cycle consumed. No acceptance before fresh Sol-high audit and actual gate.

M12 cierre aceptado: run_3d021349d7ea; actual Gate gate_27be8664ee57 PASS/gate-only task_7f7f2ec3f2e7 completed. Fresh independent Sol-high task_b39c6399610a/ctx_b1b0a047fe14 PASS P0=0 P1=0 P2=1, worker_done msg_63e8de7be1e3 and release. Auditor approved prospectively this Root receipt-only closure under fixed production/test/package hashes. Exact 56px axis, grid origin, eleven label positions, header/grid/block rectangles and empty 1440→768 transition are identical before/after; full403 GATE and all142 protected files PASS. M12-PROCESS-01 remains nonblocking P2 because the original writer report metadata conflicts with the immutable Sol-medium launch receipt; both are preserved without retrospective correction. One explicit four-path local checkpoint, no push. Close HUMAN_GATE/MILESTONE_COMPLETE; the bounded recurrent-block presentation extraction is recommendation-only, all known gaps remain deferred and F2E remains UNVERIFIED.


## M13 authority — Programación schedule-block presentation extraction

Human authorization UX-12 starts from checkpoint `1484848625a147b8897347f6e2d5eb0c22752d31`. Exact finite scope is frozen in Orca message `msg_67f02f80a4dd`: `CalendarioHorariosInstructor.tsx`, new `BloqueHorarioCalendario.tsx`, and Root-owned STATE/RUNBOOK closure only. The child may render already-computed geometry, labels, visual state and explicit handlers. The parent retains all geometry/overlap/adjacency/collision, drag/resize/pointer interpretation, menu state, requests/mutations/payloads, permissions/session and F2E-adjacent authority. Existing recurrent-block DOM, styles, content, event sequence, request behavior and numeric geometry at 375/768/1440 plus 1440→768 must remain exact. Exceptions and all known M08–M12 behavior gaps stay deferred; F2E compatibility remains UNVERIFIED. Risk HIGH: fresh characterization precedes one Sol-medium writer, then FAST, complete R1 GATE, independent Sol-high audit and actual decision Gate before an explicit local checkpoint. No later Programación slice, dependency, backend/cross-lane change or remote publication is authorized.

M13 cierre aceptado: run_7810820876d7; actual Gate gate_abf1586c41cd PASS/gate-only task_476b57efee63 completed. Fresh independent Sol-high task_08b4b6658a53/ctx_7dd71f469045 PASS P0=0 P1=0 P2=1, worker_done msg_263b501d6b9c and release. M13-PROCESS-01 was nonblocking stale preaudit STATE receipt metadata and is resolved prospectively in the Root receipt-only closure without product correction. The normal recurrent block presentation moved to BloqueHorarioCalendario; Calendar retains all geometry, overlap, drag/resize/pointer, menu/mutation/request/payload, permission/session and F2E-adjacent authority. Normalized geometry/content/DOM fingerprint is exactly identical at375/768/1440 and1440→768; full403 tests and complete GATE PASS; all143 protected entry paths/packages exact. One explicit four-path local checkpoint follows, no push. Close HUMAN_GATE/MILESTONE_COMPLETE. A future pure visual-geometry calculation extraction is recommendation-only and NOT_AUTHORIZED; known gaps remain deferred and F2E compatibility UNVERIFIED.

## M14 authority — Programación pure visual geometry extraction

Human authorization UX-13 starts from checkpoint `f34367e73c9e525a806b5357690c5b03892f9653`. Frozen scope `msg_bdaab2a08632` permits only existing `CalendarioHorariosInstructor.tsx`, new Programación-owned `geometria/geometriaVisualCalendario.ts`, its direct pure-function test, and Root-owned STATE/RUNBOOK closure. Eligible formulas accept explicit numeric/boolean inputs and return the existing deterministic visual pixel/percentage/CSS values. The module must have no React, hooks, DOM/browser globals, Date/time interpretation, API/state mutation, pointer lifecycle, overlap assignment/collision, permissions/session, business or F2E authority. Calendar retains temporal semantics, viewport/listener ownership, interactions, requests/mutations/payloads and all F2E-adjacent decisions. Preserve exact fractional arithmetic, 56px axis, grid/block geometry, interaction results and request behavior at375/768/1440 and1440→768. All known clipping/resize/stale/error/listener/a11y gaps remain deferred; F2E compatibility remains UNVERIFIED. Risk HIGH: complete403+ final GATE, exact private numeric equivalence, NEW Sol-high audit P0/P1zero and actual Decision Gate precede one explicit local checkpoint. Maximum two corrections; no dependency/backend/Payments/F2E/publication or later-slice authority.

M14 implementation/full GATE: one Sol-medium writer changed only Calendar plus the new pure geometry module/direct test. Pure functions preserve the existing 64/60 arithmetic, 56px axis, vertical positions/heights, 28/4/66px visual minima and exact column CSS strings from parent-decided column/adjustment inputs. Calendar retains all temporal parsing/minmax, overlap/column assignment/collision, React/viewport/listener/pointer/drag/resize lifecycle, requests/payloads, permissions/session and F2E-adjacent authority. Fresh full npm-ls/lint/typecheck/build/diff checks and332Vitest+75Chromium=407PASS0FAIL0SKIP0FLAKY; private numeric geometry fingerprint is exactly unchanged at375/768/1440 and1440→768, package bytes and144 protected entry paths exact. No acceptance before NEW Sol-high audit and actual Decision Gate.

M14 cierre aceptado: run `run_cc480656e9be`; actual Gate `gate_c15e343cb577` PASS/gate-only `task_1e7c0f4c0480` completed. Fresh independent Sol-high `task_c28606e113d0`/`ctx_15b7e5c35f03` PASS P0=0 P1=0 P2=0, worker_done `msg_508b66eae74d` and release. Auditor approved prospectively this Root receipt-only closure under immutable product/test/package hashes. The pure module has zero imports and only deterministic typed scalar geometry; Calendar retains temporal, overlap/column assignment, state/listener/pointer/drag/resize, request/payload, permission/session and F2E-adjacent authority. Exact normalized geometry equality and full407 GATE PASS; one explicit five-path local checkpoint follows, no push. Close HUMAN_GATE/MILESTONE_COMPLETE. A future punctual-exception block presentation extraction is recommendation-only and NOT_AUTHORIZED; all known gaps remain deferred and F2E compatibility remains UNVERIFIED.

## Human authorization — WEB_UX_MILESTONE_15

UX-14 starts from exact accepted checkpoint `e833c463ea79520b57df85878b23b8245cba2c16`. Its only productive objective is to extract the duplicated presentation of the two punctual-exception rendering branches from `CalendarioHorariosInstructor` into the Programación-owned `BloqueHorarioEspecialCalendario`. Fresh recon must first confirm a common stable presentation shell and preserve every branch-specific visual/action variant.

The parent retains exception matching and identity, date/effective temporal meaning, overlap/column and geometry decisions, pointer/drag/resize state and interpretation, permissions, callbacks, mutations, requests/payloads, session and all F2E-adjacent authority. The child may receive only pre-resolved labels, visual variant, geometry, action availability and explicit handlers. It may contain no generic exception object interpretation, API/effects, business/date calculations, request construction or generic calendar framework.

Freeze a finite path allowlist; characterize both branches independently before the write; preserve exact geometry, labels, actions, callback/request behavior at 375/768/1440 and 1440→768; then require the full R1 GATE against the 332 Vitest + 75 Chromium = 407 baseline, a new Sol-high independent audit with P0=P1=0, and an actual Decision Gate before one explicit local checkpoint. Maximum two technical correction cycles. Known clipping, resize-remeasurement, stale-response, error-as-empty, listener, accessibility and F2E-compatibility gaps remain deferred. No dependency/backend/Payments/F2E/publication or later-slice authority is granted.

M15 implementation/full GATE: one Sol-medium writer changed only Calendar plus new `BloqueHorarioEspecialCalendario`. The parent pre-resolves branch identity, labels, geometry, action availability and handler bindings; the readonly child preserves the SUPERPUESTO and INDEPENDIENTE presentation variants without domain/API/F2E authority. Four prewrite geometry scenes plus two interaction ledgers equal the six-case postwrite ledger exactly, including blocked-overlay zero requests and standalone DELETE→POST payload. Fresh npm-ls/lint/typecheck/build/diff checks and 332 Vitest + 75 Chromium = 407 PASS, 0 FAIL, 0 SKIP; package bytes and 146 protected entry paths exact.

M15 cierre aceptado: run `run_3854059a7512`; fresh independent Sol-high `task_f0165e6093ed` / `ctx_89c656e1f46b` PASS P0=0 P1=0 P2=0, worker_done `msg_2db5b3d4ac21` and release. Actual gate-only `task_588540c6a362` / Gate `gate_0443d065d19f` PASS. Auditor approved the prospective Root-only receipt closure under immutable product/test/package hashes. One explicit four-path local checkpoint follows; no push. Close HUMAN_GATE/MILESTONE_COMPLETE. A future listener-unmount cleanup slice is recommendation-only and NOT_AUTHORIZED; all known gaps and F2E compatibility remain deferred/unverified.

## Human authorization — WEB_UX_MILESTONE_16

UX-15 starts from exact accepted checkpoint `8955d01789a12d1319aec430cccbc4747d35a49b`. Its sole productive objective is lifecycle hardening for exactly three existing Calendar window mouse-listener flows: empty-day creation, recurrent move/resize and punctual-exception move/resize. Each flow must remove the exact mousemove/mouseup identities after normal termination, active component unmount and supersession; cleanup must be idempotent and repeated cycles must not accumulate listeners or invoke stale callbacks.

Freeze a finite scope centered on `CalendarioHorariosInstructor.tsx`, its indispensable existing component lifecycle test and Root STATE/RUNBOOK. Reproduce the gap test-first before production change. Preserve all pointer/mouse sequence, drag/resize geometry, collision behavior, callback order, request counts/methods/payloads, permissions/session and F2E-adjacent authority. No pointer migration, interaction redesign, geometry/responsive/stale/error/accessibility correction, dependency/backend/Payments/F2E/publication or later-slice authority.

Risk HIGH interaction lifecycle: use Sol-medium implementation after Luna recon, targeted RED→GREEN evidence, complete 332+75 baseline GATE augmented by accepted lifecycle tests, one new Sol-high audit with P0=P1=0 and an actual Decision Gate before one explicit local checkpoint. Maximum two technical correction cycles. All other known gaps remain deferred and F2E compatibility remains UNVERIFIED.

M16 cierre aceptado: run `run_09f066b63527`; first Sol-high audit found one bounded P1 test-proof gap and one nonblocking P2 stale-snapshot note. Correction cycle 1/2 changed only the frozen existing Calendar test and directly proved stale-wrapper suppression after unmount/supersession for all three flows plus cleanup idempotence; Calendar production bytes remained fixed. New independent Sol-high re-audit `task_4a850c578445` / `ctx_ed042bc3c58a` PASS P0=0 P1=0 P2=2, worker_done `msg_1de6a9f40805` and release. Actual gate-only `task_0ab270012608` / Gate `gate_1536a1efee5c` PASS. Fresh post-correction dependency/lint/TypeScript/build/diff checks and 337 Vitest + 75 Chromium = 412 PASS, 0 FAIL/SKIP; all 146 protected paths/packages exact. M16-PROCESS-01 is prospectively superseded without retrospective rewrite; M16-PROCESS-02 preserves the correction report's wrong self-labelled route beside the authoritative Sol-medium launch receipt. One explicit four-path local checkpoint follows, no push. Close HUMAN_GATE/MILESTONE_COMPLETE. A stale-read/error-truthfulness slice is recommendation-only and NOT_AUTHORIZED; all other known gaps and F2E compatibility remain deferred/unverified.

## Human authorization — WEB_UX_MILESTONE_17

UX-16 starts from exact accepted checkpoint `e76b750ae025666c82ad337efc76603994ad27d6`. Its only productive objectives are feature-local Programación stale READ-response protection and truthful recoverable READ-error presentation distinct from legitimate empty success. Fresh recon must inventory and classify every relevant read flow; only confirmed stale-risk/error-as-empty flows enter a finite allowlist. Latest relevant generation owns state commitment; stale success/failure cannot replace newer success/error/context, while manual retry remains explicit and parameter-preserving.

Preserve global session generation, 401/auth/logout semantics, existing client/AbortController behavior, APIs/headers/parsing, all POST/PUT/PATCH/DELETE and post-write business behavior, permissions, geometry/interactions and M16 listener lifecycle. No global Query/cache/session redesign, dependency, automatic retry, backend/Payments/F2E change, responsive clipping, resize remeasurement, general accessibility work or later-slice authority. Use deterministic RED characterization for real races and error/empty distinction, Sol-medium implementation, FAST validation and synthetic Chromium at375/768/1440, then complete R1 GATE preserving337+75, NEW Sol-high audit P0/P1zero and actual Decision Gate before one explicit local checkpoint. Maximum two corrections. On PASS close HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE/AWAIT_HUMAN_AUTHORIZATION_FOR_NEXT_PROGRAMACION_SLICE; no push.

M17 preacceptance receipt: exact freeze `msg_14a0ecf4460e` permits only STATE/RUNBOOK, two Programación production owners and four direct test/browser paths. Sol-medium implementation is complete and released; feature-local generations guard initial information, recurrent turns, weekly exceptions, punctual pages and weekly history, while recoverable errors and explicit retries remain context-specific. Complete fresh GATE passed341 Vitest +77 Chromium =418 with zero failures/skips/flaky plus npm integrity, lint, TypeScript, build and diff-check. All142 protected entry paths, package manifests, global client/session authority, writes, Calendar geometry/interactions and M16 listener code are unchanged. Acceptance still requires a new independent Sol-high audit and actual M17 Decision Gate; this receipt does not authorize a checkpoint or later slice.

M17 correction authority: fresh audit `task_6db68ffed3b7` / `ctx_ccce0e9cb3e4` found blocking `M17-READ-01`: a conflict mutation followed by a failed history READ can escape before the original mutation error is committed, and the recoverable history error/retry is hidden while the dialog remains in its edit/close view. Correction cycle1/2 may change only the already-frozen weekly dialog production path and characterization test to preserve the mutation error, expose the failed READ truthfully with manual retry and prove no unhandled rejection for both conflict branches. The post-success `Promise.allSettled` distinction and every API/mutation/payload/session/geometry/listener/F2E contract remain fixed. Require targeted validation, refreshed full GATE and a new Sol-high audit; `M17-PROCESS-01` remains preserved as nonblocking P2.

M17 correction1 result: the two authorized dialog/test paths now prove versionar and cerrar conflict plus failed history refresh without an unhandled rejection. The dialog preserves the original mutation error, presents the feature-owned recoverable READ error in the active view and retries the current salon only on explicit action; `cargarHistorial` still rejects for the successful-write `Promise.allSettled` synchronization contract. Refreshed complete GATE passed343 Vitest +77 Chromium =420, zero failures/skips/flaky, plus npm integrity, lint, TypeScript, build and diff-check. Scope, protected paths and packages remain exact. A new independent Sol-high audit and actual Decision Gate are still required before checkpoint or acceptance.

M17 fresh re-audit `task_cb74592e19d2` / `ctx_73c13a174a27` actual Sol-high PASS P0=0 P1=0 P2=1 and released. It independently verified the exact eight-path candidate, all142 protected paths, both corrected conflict-refresh flows, 420-test complete GATE evidence, unchanged APIs/session/writes/geometry/M16 lifecycle/F2E boundary and no hidden automatic retry. `M17-PROCESS-01` remains a preserved nonblocking historical report-metadata discrepancy; no retrospective compliance claim. The actual Decision Gate remains mandatory before acceptance or checkpoint.

M17 cierre aceptado: Run `run_a419b2147630`; actual gate-only `task_a96c64763aab` / Gate `gate_dcb9867e754e` PASS. Fresh post-correction Sol-high auditor `task_cb74592e19d2` / `ctx_73c13a174a27` PASS P0=0 P1=0 P2=1 and released after verifying all22 criteria. Feature-local generations and truthful recoverable READ states cover five confirmed Programación contexts; mutation-conflict refresh failures preserve both the original mutation error and visible manual READ recovery without unhandled rejection or automatic retry. Fresh complete GATE is343 Vitest+77Chromium=420PASS0FAIL0SKIP0FLAKY plus npm/lint/TypeScript/build/diff checks; exact eight paths, 142 protected paths and packages PASS. APIs/session/writes/geometry/M16 listeners/F2E remain unchanged. `M17-PROCESS-01` remains a nonblocking historical metadata discrepancy beside the immutable Luna-medium receipt. One explicit eight-path local checkpoint follows, no push. Close HUMAN_GATE/MILESTONE_COMPLETE. Viewport-resize geometry remeasurement is recommendation-only and NOT_AUTHORIZED; responsive clipping, accessibility and F2E compatibility remain deferred/unverified.

## M18 authority — Programación viewport-resize geometry remeasurement

Human authorization UX-17 starts from accepted checkpoint `ba542d4e557a48ffe94b003d730b6742a4382774`. M18 may correct only a mechanically reproduced stale-layout measurement so resized-to-target geometry converges exactly to fresh-render geometry for identical synthetic data. Luna-medium recon must first map measurement ownership and prove at least1440→768 divergence; otherwise fail closed at `KNOWN_GAP_NOT_REPRODUCIBLE`. Freeze a finite scope centered on `CalendarioHorariosInstructor.tsx`, indispensable existing geometry/Chromium characterization and Root STATE/RUNBOOK. Preserve M14 formulas and visual constants absent contrary evidence, all request/mutation counts and payloads, M16 listener cleanup, M17 read-state guards, API/session/permissions/business/F2E authority and every other deferred gap. No dependency, layout/breakpoint redesign, clipping/accessibility expansion, backend/Payments/F2E/publication or later-slice authority. Risk HIGH: Sol-medium implementation after RED evidence, exact fresh-vs-transition geometry fingerprints and interaction-after-resize checks, complete R1 GATE preserving343+77, NEW Sol-high audit P0/P1zero and actual Decision Gate before explicit checkpoint. Maximum two corrections; no push.

M18 stopped before write: Luna-medium recon `task_0864e6819952` / `ctx_c265d2a0fa77` completed/released and no productive allowlist was frozen. Calendar has no viewport measurement state/listener/observer: browser flex layout supplies current width, pure M14 formulas remain fixed and interaction refs read current rectangles. Root independently completed the worker's incomplete private transition ledger without repository writes. Settled resized geometry is byte-for-byte normalized equal to fresh target geometry for1440→768,768→375 and375→1440; resize writes are PATCH=POST=DELETE=0. The explicit `KNOWN_GAP_NOT_REPRODUCIBLE` stop condition applies. No writer, product/test change, full acceptance GATE, Sol-high acceptance audit, Decision Gate or checkpoint. HUMAN_GATE recommends closing this historical item as already convergent and authorizing Web UX closure preflight, unless the human supplies a distinct exact reproduction or grants a different scope. No push or next milestone authority.

## M18 non-reproducible reconciliation and Closure Preflight authority

Human authorization dated 2026-09-19 closes the stopped M18 item prospectively only when mechanical reconciliation and one fresh Sol-high audit confirm that the accepted M17 product bytes are unchanged, the exact settled reproduction is internally consistent, current resize geometry converges without tolerance or resize mutation, history is preserved, and F2E remains UNVERIFIED. The honest closure is `CLOSED_WITHOUT_PRODUCT_CHANGE / CURRENT_BEHAVIOR_ALREADY_CONVERGENT`; the product checkpoint remains the M17 checkpoint and no fake M18 product commit may be created.

After that audit passes with P0=P1=0, continue automatically into `WEB_UX_CLOSURE_PREFLIGHT`. This phase authorizes read-only inventory, a fresh complete R1 GATE, synthetic/intercepted browser closure matrix, residual classification, one fresh Sol-high closure audit and minimum STATE/RUNBOOK process receipts only. It authorizes no functional refactor, product/test/package write, F2E/Payments decision, new dependency, push, PR, merge, rebase, tag, cutover or deployment. Closure may recommend technical closure, exactly one bounded final hardening milestone, or a Human Gate; it may not implement the recommendation. A stable audited decision may be materialized in one explicit process-only checkpoint containing only STATE/RUNBOOK, leaving the working tree and index clean.

M18 reconciliation accepted for continuation: fresh independent Sol-high `task_de3f598df9ae` / `ctx_17765af992cd` PASS with P0=0, P1=0, P2=0 and released. It verified exact M17 product HEAD, empty index, only STATE/RUNBOOK dirty, 148 protected paths byte-identical, exact settled convergence at1440→768,768→375,375→1440, zero resize mutations, preserved historical provenance and F2E still `UNVERIFIED`. M18 is therefore `CLOSED_WITHOUT_PRODUCT_CHANGE / CURRENT_BEHAVIOR_ALREADY_CONVERGENT`; the M17 product checkpoint remains unchanged. Closure Preflight is now active under the read-only/process-only authority above.

Closure Preflight pre-audit receipt: fresh complete R1 GATE PASS with npm integrity, lint without warnings, TypeScript, `343/343` Vitest, `77/77` Chromium, build and diff check; total `420 PASS / 0 FAIL / 0 SKIP / 0 required flaky`. The synthetic browser matrix covers auth, shell and every modernized feature at representative 375/768/1440 widths, with Programación lifecycle/race/geometry evidence and no real backend/Payments/Maps calls. Current evidence classifies Programación mouse-only/unnamed calendar interaction, its unusably narrow 19px block presentation at 375px and two known Ventas small-text contrast ratios below 4.5 as closure blockers suitable for one bounded presentation/accessibility hardening milestone. Calendar size and the measured >500kB chunk warning are nonblocking hardening; F2E compatibility and Payments remain deferred cross-lane; the historical Roles lint warning is closed; process/color warnings are informational. No product/test/package write occurred. A NEW Sol-high closure audit must independently adjudicate this classification before any process Decision Gate or checkpoint.

Closure Preflight final decision: fresh independent Sol-high `task_0fea653643cb` / `ctx_4fa1f363d5c5` completed/released with audit FAIL P0=0, P1=3, P2=7 because technical closure still has three independently confirmed blockers: Programación keyboard/semantic operability, Programación 375px 19px block usability and two known Ventas small-text contrast combinations below 4.5. The auditor accepted the reachable milestone chain, M18 no-product reconciliation, complete 420-test GATE, browser matrix, M16/M17 protections, repository/process integrity and F2E/Payments/publication boundaries. It corrected the future candidate set to include `SalonHorarios.tsx`, owner of unnamed week controls. Gate-only `task_5c38e6762d55` / `gate_d1fdc4bc97dd` resolved PASS for the process proposition `ONE_FINAL_HARDENING_MILESTONE_REQUIRED`; this does not accept closure or authorize implementation. Close at HUMAN_GATE/FINAL_HARDENING_REQUIRED, with one exact STATE/RUNBOOK process checkpoint, accepted product HEAD unchanged from M17 and no push.

## Final hardening and automatic closure re-audit authority

Human authorization UX-18 starts from process HEAD `a4b6400b8f1f915e5a9be3c87e28047005f8a9f8` and permits one finite final functional milestone for only the three closure P1 findings: Programación keyboard/semantic operability, usable 375px schedule-block presentation within exact existing geometry, and the two measured Ventas small-text contrast failures. Fresh Luna-medium recon must freeze exact owners/tests and prove any keyboard resize increment derives from existing authoritative granularity; otherwise fail closed for a business-rule decision. Sol-medium implementation must preserve all Programación temporal/geometry/overlap/drag/mouse-resize/request/payload, M16/M17, Ventas financial, API/session/permission, Payments and F2E semantics. Require targeted characterization, complete 420+ R1 GATE, one new Sol-high hardening audit P0=P1=0, actual hardening Gate and one exact local checkpoint. Then auto-continue to a distinct Sol-high final closure re-audit and separate technical-closure Gate. Technical closure never authorizes push, merge, publication, Payments/F2E acceptance or cutover.

Final-hardening recon/freeze: `task_0aed7709689f` / `ctx_ec3f0d3a144c`, actual Luna-medium, read-only complete/released. Exact existing 30-minute Calendar granularity makes keyboard resize authority-safe; isolated policy-comparable characterization passed `91/91` with `--maxWorkers=1`. Freeze exactly the 18 hashed product/test paths recorded in STATE plus Root-only STATE/RUNBOOK; protect geometry module, packages, shared/theme/API/auth and every other path. The single Sol-medium writer must add only the minimum observable keyboard/focus/name, geometry-preserving narrow presentation and local Ventas contrast corrections, with tests inside the frozen set.

Final-hardening implementation/full GATE: Sol-medium `task_5b4f4b5baf08` / `ctx_f931523981f7` completed/released after test-first changes to 15 frozen paths. Keyboard names/focus/actions reuse existing Programación flows and authoritative 30-minute bounds; narrow presentation preserves outer geometry; local Ventas colors measure 5.7418 and 7.3999. A fresh complete R1 GATE passed npm integrity, lint, TypeScript, build and diff-check with `349 Vitest + 78 Chromium = 427 PASS`, zero fail/skip/flaky. The stable 15-path product/test manifest hash is `08d8d84e4a6ba579213cc577a606e634258952593c5d2b4c82fa4c6759c1f73e`; with Root receipts the worktree has 17 dirty paths and an empty index. Require one new Sol-high hardening audit before the hardening Decision Gate or checkpoint.

Final-hardening audit 01 failed only `UX18-A11Y-ROLE-01` (P0=0/P1=1/P2=0): the two resize-grip variants announced incomplete button contracts inside focusable button-like block containers. Correction cycle 1/2, Sol-medium `task_4976b04b6593` / `ctx_5a92ef4b7fbe`, remained inside four frozen Programación block/test paths and replaced that model with named non-focusable block groups, independent primary action controls and truthful adjustable separators using the existing 30-minute Arrow-key contract. Targeted lint, TypeScript, 33 Vitest, 10 Chromium at all required widths, geometry/PATCH/mouse checks and diff-check PASS. Re-run the complete R1 GATE, then use a completely fresh Sol-high hardening auditor before any Gate or checkpoint.

Post-correction complete R1 GATE PASS: npm integrity, lint, TypeScript, `350/350` Vitest, `78/78` Chromium, build and diff-check all pass, totaling `428 PASS / 0 FAIL / 0 SKIP / 0 required flaky`. The re-frozen 15-path product/test manifest SHA-256 is `be5fc2c36119867bbb90e77b87825ee6f1a288cad7c4a57fac43d758289775bc`; every entry verifies, index empty. The known 996.59kB production chunk warning remains nonblocking. Dispatch a completely new Sol-high hardening re-auditor before any Gate or checkpoint.

Hardening re-audit 02, Sol-high `task_af5d52dca469` / `ctx_faac52341a8e`, failed only because adjustable separators advertised 0..1440 rather than the exact operative bounds; all other hardening criteria passed (P0=0/P1=1/P2=0). Consume final correction cycle 2/2 inside existing Programación component/test authority: expose the current min/max already enforced by opening/closing, opposite edge and `SLOT_MINUTOS`, assert recurrent/punctual start/end ranges, preserve every behavioral/geometry/request invariant, rerun complete R1 GATE and require a completely new Sol-high audit. Any remaining P0/P1 after this cycle stops at a Human Gate.

Final correction cycle 2/2 completed under Sol-medium `task_008c0ad4e920` / `ctx_b20db8755ef9`, changing only four frozen Programación component/test paths. All recurrent/punctual start/end separators now expose their exact parent-owned operative bounds and tests assert min/max/now/text. Targeted lint, TypeScript, 33 Vitest, 10 Chromium across required widths, geometry/request ledgers and diff-check PASS. Re-frozen 15-path manifest SHA-256 `06535c03b5645a54b8bb4331e8cd44b58303b9414c0856223ad627f223c2ab4b`; index empty. The correction budget is now exhausted; rerun complete R1 GATE and require a completely new Sol-high audit with P0=P1=0 before any Gate.

Post-correction-2 complete R1 GATE PASS with preserved runtime receipt: first serialized Vitest attempt had one unrelated inherited 5000ms `DialogoSalon` timeout, then the exact test passed in isolation without code change and the complete serialized rerun passed `350/350`. npm integrity, lint, TypeScript, `78/78` Chromium, build and diff-check pass; accepted total `428 PASS / 0 FAIL / 0 SKIP / 0 required flaky`. Treat the failed attempt as informational runtime evidence, not authorization to edit Salones or alter timeouts. Manifest `06535c03b5645a54b8bb4331e8cd44b58303b9414c0856223ad627f223c2ab4b`, every entry exact, index empty. Dispatch a completely new Sol-high hardening auditor; any P0/P1 now requires a Human Gate because the two correction cycles are consumed.

Final-hardening acceptance: completely new Sol-high `task_ac3ece5c957b` / `ctx_5b926a0268c5` PASS P0=0/P1=0/P2=0 and released after independently accepting all 20 criteria and rerunning the resolved Salones case, 33 focused Vitest and 13 Chromium scenarios. Gate-only `task_84dd9f7956da` / Gate `gate_4499e8a43915` resolved PASS. The three original closure P1s are closed within exact finite authority; final complete GATE is `350 Vitest + 78 Chromium = 428 PASS`, zero failure/skip/required flaky, plus npm/lint/TypeScript/build/diff PASS. Create one explicit 17-path local final-hardening checkpoint, no push, then auto-continue to a distinct final closure re-audit and separate technical-closure Gate.

## Technical closure receipt

Final-hardening checkpoint `10bda0101dd3b38d0ddeaa3bec1edaad1a708970` contains exactly the accepted 15 product/test paths plus STATE/RUNBOOK. A fresh post-checkpoint complete R1 GATE passed npm, lint, TypeScript, `350 Vitest + 78 Chromium = 428`, build and diff-check with zero failure/skip/required flaky. Distinct final closure auditor `task_d65f2f2eb670` / `ctx_19629c485f66` PASS P0=0/P1=0/P2=7 and released; no residual is `BLOCKING_FOR_WEB_UX_CLOSURE`. Gate-only `task_a7d5b2a5dbc3` / technical-closure Gate `gate_0419d5a79438` resolved PASS.

The Web UX technical lane completed at `HUMAN_GATE_REQUIRED / TECHNICAL_CLOSURE_READY`. F2E compatibility remains `UNVERIFIED / DEFERRED_CROSS_LANE`; Payments authority remains separate and unchanged. This receipt was materialized in process checkpoint `aacb0816f10dd100ad7debc60613cbe714f0ea51`.

## Controlled publication and post-publication closure receipt

Human authorization granted controlled publication following audited technical closure readiness. Controlled publication preflight passed all criteria with zero product changes:

- Accepted product checkpoint: `aacb0816f10dd100ad7debc60613cbe714f0ea51`
- Remote branch published: `origin/ux/profesionalizacion-web-r1` at `aacb0816f10dd100ad7debc60613cbe714f0ea51`
- Upstream configured: `origin/ux/profesionalizacion-web-r1` (in sync, 0 ahead / 0 behind)
- Pull Request created: PR #1 (`base: operacion/horario-versionado-frontend`, `head: ux/profesionalizacion-web-r1`, `headRefOid: aacb0816f10dd100ad7debc60613cbe714f0ea51`)
- PR status: `OPEN` / `MERGEABLE` (`CLEAN`)
- Remote checks/CI: None configured in repository; validation relies on audited local gates
- Merge: `NOT_PERFORMED`
- Deployment / cutover: `NOT_PERFORMED`
- Product files changed: `NO`
- F2E compatibility and Payments authority: `DEFERRED_CROSS_LANE / UNCHANGED`

Governance correction 1 records this completed publication receipt into process authority. The accepted PRODUCT checkpoint remains `aacb0816f10dd100ad7debc60613cbe714f0ea51`; any containing governance commit is strictly process-only. Web UX lane is closed at `HUMAN_GATE_REQUIRED / WEB_UX_CLOSURE_READY` and awaits final human merge authorization.
