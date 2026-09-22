---
title: Lazaret Apparatus P3 Implementation
category: project
tags: [concept, project, testing]
aliases: [Lazaret P3, capability boundary]
sources: [C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T12-16-05-01a0aedd-ca62-7860-8003-1c9386790ec2.jsonl, C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T15-14-19-01a0b4a7-5249-7462-9e05-24d226263354.jsonl, C:/Users/djden/.codex/sessions/2026/09/19/rollout-2026-09-19T13-35-19-01a0b973-092a-7422-bd45-e32234d683ce.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f33-7f50-a146-e3247bf26200.jsonl]
summary: >-
  Distilled Lazaret P3 mechanics: grants snapshot, KV namespaces, secrets,
  mTLS enrollment, kv_purge event fan-out, invoke prefix — tranche by tranche.
provenance:
  extracted: 0.79
  inferred: 0.15
  ambiguous: 0.06
created: 2026-09-22T00:00:00+02:00
updated: 2026-09-22T00:00:00+02:00
---

# Lazaret Apparatus P3 Implementation

Distilled mechanics of the Lazaret bounded context (Apparatus P3, ADR-0007),
as built across the 2026-09-17 → 2026-09-20 sessions of
[[projects/AIForAll/AIForAll]]. Canon and dates:
[[projects/AIForAll/references/apparatus-adr-chronicle-2026-09]]. The
"untrusted plugin inside a host process, capability-gated I/O" problem is the
same family as the injector hardening in
[[projects/ffscriptloader/skills/hardening-x86-dll-injection]], and the
core/application layer law parallels
[[projects/re-ff8/skills/implementing-iso-battle-migration]]. ^[extracted]

## Service Shape

Distinct bounded context from Manifesto: HTTP prefix `/lazaret`, port 8084,
own database (`lazaret_dev`). Manifesto remains owner of binding and consent;
Lazaret enforces the capability boundary for untrusted plugins (ADR-0003). ^[extracted]

## Grants And Identity

- **Grants** = live intersection with Manifesto, consumed as
  `BindingGrantSnapshot` — not a replica. Snapshot GET is protected by a
  **platform service JWT** (dedicated `iss`/`aud`, bearer in Lazaret config),
  not OpenFGA and not user IAM JWTs (user JWT → 403). Decision taken during
  the 2026-09-17 fix plan. ^[extracted]
- **Workload identity** (T3, hybrid): anonymous enroll, then consult + forced
  CSR. Enrollment is **first-wins**: a second CSR for the same binding →
  409 `BindingAlreadyEnrolled`, and the CA refuses to sign when the binding is
  already enrolled (no orphan certificates). T10 persisted enrollment in
  Postgres (`apparatus_enrollments`, same DB as KV) with revoke on
  `component_removed`; `InMemoryEnrollmentRegistry` kept for tests only. ^[extracted]
- **Secrets** are opaque references `secret:{path}#{field}`; the plaintext
  never enters the plugin KV namespace. ^[extracted]

## KV And Lifecycle (T6/T8)

`AsyncKvStore::purge` returns `Result` (Postgres/Redis adapters nack on
failure) while the P0 port `KvStore::kv_purge` stays `()`. On the Manifesto
`component_removed` event, a Lazaret consumer (rustycog, `supports_event_type`
= `component_removed` only) purges only that binding's KV namespace via the
dedicated SQS queue `lazaret-kv-events`; failure → SQS nack (fail-closed).
Fan-out configuration is TOML-only — no gateway code under Manifesto sources.
`/ready` reflects consumer state (`Disabled` when queue off). ^[extracted]

## Invoke And Routing (T7/T9)

Invoke lives on the Lazaret side, not as a Manifesto method (ADR-0006 G). T7
tests hit the internal router; T9 proves the public path: `Application::prefixed_router()`
serves `POST /lazaret/invoke` → 200 while `POST /invoke` → 404;
`INVOKE_PATH` stays `"/invoke"`; `router()` remains unprefixed for the
monolith `.nest`. Public projects are denied invoke/KV/secrets (403, APP-05
V1 behavior, tested). ^[extracted]

## Consent And Hardening (fix wave 2026-09-17/18)

- Consent stamping writes **all** consent rows at a bumped `grant_revision`;
  mismatched revision → 409; a session pinned to revision 0 is frozen out.
- `declared_capabilities` is a persisted column; invoke is **fail-closed**
  against it (empty/missing declared → deny), the `principal` query param was
  removed, 404 → 403 where authz distinguishes.
- CAS on the Postgres KV backend made atomic (version 0/0 semantics tested);
  revoke is fail-closed — a failed `revoke_binding` suppresses the KV purge. ^[extracted]

## mTLS, OpenBao, Mesh (T11–T14b)

mTLS client-auth landed opt-in first in the rustycog sibling
(`RustlsConfig::from_pem_file` + `bind_rustls`, `tls_client_ca_path`), then
Lazaret `/session` enforced it (401 via real wiring). OpenBao provides Transit
signing (T12) and the platform mesh (T14b) terminates HTTPS between
Hive/IAM/Telegraph with a persisted Lazaret CA. ^[extracted]

## Test Layout

Integration tests follow `Lazaret/tests/apparatus_p3_t<N>_<topic>.rs`
(T3 identity, T4 grants, T5 consent, T6 KV, T7 invoke, T8 kv_purge routing,
T9 invoke prefix, T10 enroll, T12 OpenBao) with Docker testcontainers;
`boot()` requires a Postgres testcontainer, so HTTP suites are skipped when
Docker is down. Manifesto-side IT ran 240 passed / 0 failed (39 binaries,
`-j 1 --test-threads=1` to avoid LLVM OOM). ^[extracted]
