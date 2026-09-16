# FeelingPilates — WEB UX PRODUCT DELIVERY RUNBOOK

# 1. PURPOSE

Autoridad versionada exclusiva de FeelingPilates — Web UX Product Delivery. Profesionalizar el frontend incrementalmente, preservando comportamiento, contratos de negocio/API y autoridad de otras lanes. Un coordinador nuevo debe leer este Runbook y WEB-UX-STATE.md antes de actuar. El estado y la evidencia estructurada de Orca permiten continuar sin relevo manual de micro-reportes.

La autorización humana vigente prevalece sobre este documento; este documento no puede otorgarse nuevas facultades ni revivir un mecanismo anterior de Autopilot.

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

# 17. STATE UPDATE RULE

Después de cada gate actualizar WEB-UX-STATE.md con CURRENT_MILESTONE, CURRENT_PHASE, LAST_RUN_ID, LAST_GATE_ID, LAST_ACCEPTED_CHECKPOINT, STATUS, CORRECTION_CYCLES_USED, NEXT_PHASE, HUMAN_GATE_REASON, KNOWN_WARNINGS y CROSS_LANE_BLOCKERS; commit junto al checkpoint de fase o checkpoint de proceso cuando corresponda.

Transiciones deterministas: BOOTSTRAPPING → READY tras bootstrap PASS; READY → IN_PROGRESS al iniciar fase con allowlist; PASS → READY con NEXT_PHASE autorizada; FAIL corregible → CORRECTION_REQUIRED incrementando contador antes de corregir; FAIL sin autoridad/presupuesto → HUMAN_GATE_REQUIRED; milestone final PASS → HUMAN_GATE_REQUIRED/MILESTONE_COMPLETE. El contador se reinicia solo al iniciar otra fase real, nunca para reintentar la misma.

Reanudación: leer ambos archivos y última autorización humana; verificar branch/HEAD/status/index contra checkpoint o manifiesto aceptado registrado; consultar Orca LAST_RUN_ID/LAST_GATE_ID y CURRENT_CANDIDATE_MANIFEST si hay delta; exigir exactitud antes de editar. Si un Run activo previo mantiene escritor, observar settlement/liveness, no lanzar duplicado. Si STATUS HUMAN_GATE_REQUIRED, no avanzar hasta nueva autorización humana. NEXT_PHASE no otorga autoridad por sí mismo. Registrar Task/Dispatch/allowlist/audit/manifiesto detallados en Orca, no duplicar una jerarquía de process files.
