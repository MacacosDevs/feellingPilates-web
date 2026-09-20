# FeelingPilates Web UX Execution Policy — R1

**Activation status:** read `EXECUTION_POLICY` in WEB-UX-STATE.md; this immutable policy is conditional until the real audit and gate both pass.
**Scope:** future Web UX process execution only; no functional authorization.

## Authority and activation

This policy activates only after BOTH a fresh process audit is PASS with P0=0 and P1=0, and an optimization decision gate is PASS. Until then it is `PENDING`. Once active, its defaults are mandatory for future Web UX work and may be overridden only by explicit human process authorization; it never authorizes product work. The Runbook lifecycle, business/API authority, Human Gates, Payments and F2E boundaries remain superior; ambiguity fails closed. Git and application mechanics are untouched.

## Normative model routes

Routes are verified at execution time through Orca's installed model discovery (`codex debug models` via the agent-model-probe specification), not a static availability list. Re-verify every future launch. Runtime capability: `orchestration.worker-launch-preferences.v1`, runtime `1.4.205`.

| Route | Normative use |
|---|---|
| `codex:gpt-5.6-luna:medium` | Default: reconnaissance; mechanical interpretation after tools/manifests/evidence/STATE docs/deterministic tests; explicit straightforward UI/CSS/responsive work; Vitest/Playwright; corrections; gate preparation. |
| `codex:gpt-5.6-sol:medium` | Justified architecture, nontrivial React, Query-cache races, moderate cross-component debugging beyond Luna. |
| `codex:gpt-5.6-sol:high` | Fresh milestone/process semantic audit; P0/P1 adjudication; ambiguous accessibility, security, privacy, authority, or major architecture. Not default. |

Observed Luna efforts `low`, `high`, `xhigh`, and `max` are available-only, not normative. Every worker result records actual model and effort and compares requested/effective launch receipts. Unsupported routes yield `MODEL_ROUTE_UNAVAILABLE`; For a routine task whose Luna-medium route is unavailable, explicitly escalate to verified Sol-medium, recording `MODEL_ROUTE_UNAVAILABLE`, justification, and the effective receipt. Architecture needing Sol-medium may escalate to verified Sol-high only for the high-risk criteria above; otherwise stop. If the mandatory fresh semantic Sol-high audit route is unavailable, stop; no lower-effort substitution is authorized. With no verified permitted route, stop at `HUMAN_GATE/AMBIGUOUS_AUTHORITY`; never silently fall back.

## Context, authority, and evidence

Use `STATE_FIRST` progressive disclosure: L0 STATE; L1 relevant Runbook/policy sections; L2 target files, exact diff, and relevant references; L3 raw/browser/screens only when needed; L4 history only by explicit escalation. Never copy the full Runbook into worker prompts; summarize scope without weakening its authority. Before writes verify Git, Run, gate, and baseline.

Use `TOOL_FIRST/DELTA_FIRST`: git, npm, Vitest, Playwright, ESLint, TypeScript, build, `jq`, and scripts supply paths, counts, exit codes, manifests, hashes, and status. Flow is `TOOLS → STRUCTURED SUMMARY → LLM reasoning`; raw logs are not the default fact-discovery interface.

Keep `RAW_EVIDENCE` and `SUMMARY_EVIDENCE` separately. Put deterministic compact summaries first; auditors selectively inspect raw evidence. Preserve required raw evidence separately and never delete it for context savings. Never non-exactly compress code, commands, selectors, errors, finding IDs, hashes, gate results, or authority. Evidence references require locator plus hash. Outside-repository raw evidence must be durably referenced in Orca; `/tmp` alone is not portable resume authority. Long reports are reserved for `HUMAN_GATE`, `MILESTONE_COMPLETE`, `REMOTE_PUBLICATION_REQUIRED`, or an explicit human request.

## Worker contract and lifecycle

Every worker result is structured JSON with these required fields (additional lifecycle provenance fields are permitted): `status`, `role`, `taskId`, `model`, `effort`, `scope`, `filesRead`, `filesChanged`, `validation`, `findings`, `severity`, `scopeExpansionRequired`, `humanGateRequired`, `evidenceRefs`, `nextTransition`. Use actual Task/Dispatch provenance, send `worker_done` exactly once, and release a settled worker before acknowledging it. Keep internal narrative compact.

Lifecycle remains `RECON → PLAN → FREEZE ALLOWLIST → WRITE → TARGETED VALIDATION → FULL VALIDATION → FRESH INDEPENDENT AUDIT → DECISION GATE → CHECKPOINT/STATE`. `NEXT_PHASE` in STATE is never authority.

## Validation and browser discipline

During implementation/correction run FAST checks: affected tests, relevant lint/typecheck where appropriate, and affected Playwright routes/breakpoints. Run FULL GATE once per milestone before acceptance: full Vitest, full Playwright, lint, test:typecheck, build, `npm ls --all`, `git diff --check`, and required scope/browser/accessibility checks. FAST cannot replace FULL GATE; do not rerun full validation after every competent microchange. A new relevant change, failure, or unresolved concern invalidates affected evidence and requires proportionate fresh validation. The full gate describes the final candidate. The accepted baseline is monotonically growing from 289 (`264+25`): no skip, only, suppression, real backend/payment/Google calls. This bootstrap itself requires one full GATE; do not claim tests already ran.

Browser assertions are deterministic. Capture screenshots/traces on failure, critical visual change, or audit need; retain raw artifacts separately. Summaries include actual viewport, keyboard, focus, and ARIA results only. Never claim WCAG compliance.

## Fanout, audit, correction, and gates

Adaptive fanout is one competent worker/task implementer → deterministic validation → one NEW independent semantic auditor. Extra workers require evidence of ambiguous P0/P1, competing hypotheses, complex accessibility/security/privacy, architecture, or cross-lane issues; duplication is not confidence. Independence is mandatory: coordinator/writer never self-audits.

Correction is MAX2 per phase: `FAIL → correction → NEW fresh re-audit` counts one cycle. Persist the increment before correction; Run or phase-name changes never reset budget. After two unresolved cycles use `HUMAN_GATE/CORRECTION_BUDGET_EXHAUSTED`. Systematic debugging is reproduce → root cause → reference pattern → one falsifiable hypothesis → minimal change → verify → fresh audit when required. Runbook scope, gates, and budget remain superior.

## Metrics and provenance

Future milestone metrics are `wallClockMinutes`, `workersLaunched`, `lunaTasks`, `solMediumTasks`, `solHighTasks`, `targetedValidations`, `fullValidations`, `correctionCycles`, `freshAuditFindings`, `humanGates`, `internalReportBytes`, `summaryEvidenceBytes`, `rawEvidenceBytes`, and `CavemanEnabledRoles`. Unknown values are `UNREPORTED`; invent no tokens or performance improvement. M03 comparison is user-evidenced run `run_c5fa97dd04bf`: `1h43m48s`, 7 workers released, 2 total correction cycles in separate phases, `264 Vitest + 25 PW = 289 PASS, 0 FAIL, 0 SKIP`. Other baseline metrics are `UNREPORTED`; released count is not launch count.

## Optional tools and one-shot analysis

`Caveman` is `PILOT_ONLY/TOOLING_INSTALLATION_DEFERRED`: no exact authoritative source was established from installed skills/metadata/pinned repository references. Do not guess upstream or install mutable main; no default enabled. A safe future pilot requires source, immutable commit/hash, read source, mechanism, compatibility, local install, no auto-updates, and process-readonly measurement. Roles may be full mechanical docs, Lite coordinator-writer-corrector, or Normal/Lite semantic audit; never aggressive Ultra semantic compression. Protected exact fields remain exact. Uncertain fidelity means `PILOT_FAILED_OR_INCONCLUSIVE`, with no activation.

`agent-md-refactor` is `ONE_SHOT_ANALYSIS_COMPLETE` only: no installed active skill. Inspected pinned source `softaworks/agent-toolkit` commit `63bebde3a4255f88bf7e7ff20528ef4b72f881b1`, SHA256 `f20e68b59875ba43cd2680519cf5e77f6c55b51330b927394291f8f11478c21e`, [pinned public URL](https://github.com/softaworks/agent-toolkit/blob/63bebde3a4255f88bf7e7ff20528ef4b72f881b1/skills/agent-md-refactor/SKILL.md). Keep critical authority and historical provenance, focused new policy, and STATE index; do not apply arbitrary 50-line/deletion/hierarchy targets. No auto-updates or normal milestone activation. Source was Markdown instructions, inspected one-shot; no install scripts or package modifications executed. Only minimal semantics-equivalent reference changes plus this explicitly authorized policy are permitted; audit the exact diff.

## Exclusions and bootstrap stop

Session-handoff, reducing-entropy, game-changing-features, and naming-analyzer are deferred from the critical path. No new dependencies, remote publication, business/API/privacy/cross-lane authority is created; preserve fail-closed Runbook Human Gate triggers. After bootstrap succeeds, stop at `PROCESS_OPTIMIZATION_COMPLETE` and await explicit M04 scope; do not recover superseded Usuarios/Roles proposals.
