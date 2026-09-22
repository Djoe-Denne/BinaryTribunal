---
title: Apparatus ADR Chronicle 2026-09
category: project
tags: [concept, project, testing]
aliases: [ADR chronology AIForAll, ADR timeline]
sources: [C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T15-14-19-01a0b4a7-5249-7462-9e05-24d226263354.jsonl, C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T15-14-19-01a0b4a7-5320-7943-81f0-1bd1824aa675.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-19-01a0c47f-1cde-7d43-95d5-b790777b5a8b.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f33-7f50-a146-e3247bf26200.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f40-7f23-a527-a5943b68e7c3.jsonl]
summary: >-
  Distilled ADR timeline 0001–0602 for AIForAll: P0–P3 phases, A-DEC flip,
  ADR-0008 ratification, wave-3 IAM IdP, P4 operator tranches.
provenance:
  extracted: 0.80
  inferred: 0.14
  ambiguous: 0.06
created: 2026-09-22T00:00:00+02:00
updated: 2026-09-22T00:00:00+02:00
---

# Apparatus ADR Chronicle 2026-09

Reference chronology distilled from Codex sessions of 2026-09-17 → 2026-09-21.
Dates are those stated in-session. Parent project:
[[projects/AIForAll/AIForAll]].

## Timeline

| Date | ADR | Event |
|---|---|---|
| 2026-09-13 | **ADR-0007** | Accepted — P3 capability boundary = bounded context **Lazaret**, distinct from Manifesto. Réalité Partial (T1–T7). |
| ≤ 2026-09-16 | ADR-0006 | P2 in-process reconciliation — the only Apparatus phase **Implemented** before the flip. |
| 2026-09-17 | — | P3-close packet: `kv_purge` (T6, already green) wired to `component_removed` via SQS fan-out `lazaret-kv-events` (T8). Purge → `Result`, failure = SQS nack (fail-closed). |
| 2026-09-17 | — | T9: public path invoke `POST /lazaret/invoke` → 200; `/invoke` on prefixed router → 404. T10: enrollment persisted in Postgres (`apparatus_enrollments`) + revoke on `component_removed`, first-wins (second CSR → 409, no orphan cert). |
| 2026-09-18 | — | T11a: mTLS client-auth opt-in in rustycog sibling (`RustlsConfig::from_pem_file` + `bind_rustls`); T11b: Lazaret `/session` mTLS; T12 OpenBao; T14b platform mesh HTTPS (Hive/IAM/Telegraph). Manifesto CI: 240 IT passed. |
| 2026-09-19 | — | Review of changeset `46fed9be`; SQS test `is_transient` hardening (narrow "timeout" needle, 3 negatives). Commit `9e85edd` (T10 enroll) breaks 8 Manifesto CI tests → fixed via `gh run view --log-failed` diagnosis. |
| 2026-09-20 | **A-DEC** | User ratifies: `Implemented` allowed without closing APP-05, without lifting G/E, without K8s, without a second protocol — those stay hors-jalon. 0007 and 0004 flip to **Implemented**; APP-05 options A/B recorded in ADR-0004 § Non décidé. Closeout doc `docs/adr/0007-closeout.md`. |
| 2026-09-20 | **ADR-0008** | Phase 0: APP-01 decided — K8s for P4 isolation, outside Manifesto (K8s-as-P3 remains forbidden). Six APP-01 questions each reconciled by **two independent architecte agents**; priorities sécu > maintenabilité > extensibilité. User ratifies ("Je valide tout"); ADR-0008 Accepted / Réalité Unimplemented. Frozen: Cosign + OpenBao Transit + OCI registry signer-only push; Adm-A worker sole source of `VALID`; operator + Jobs, no Factory HTTP; envelope ≠ CRI image; 4 ServiceAccounts. |
| 2026-09-20 | T1 | `Manifesto/tests/apparatus_p4_t1_absence.rs` — 15 tests proving Factory/admission/signer absence before implementation. |
| 2026-09-20 | **0407–0410** | IAM wave-3 ADRs Proposed: vendor-neutral authn contract (`idp-connect-contract` crate), IdP Connect services over HTTP+HMAC, callback trust, migration plan. Numbering on the services band (04xx), not the Apparatus band (00xx). |
| 2026-09-20→21 | P4-core | Two orchestrators delivered T2–T5 green then aborted mid-T6 (a third parallel task touched idp-connect-contract/IAMRusty). Recovery by working-tree inventory. |
| 2026-09-21 | T6 | TDD: RED (missing `admit` module) → GREEN. ORAS non-CRI envelope push + Cosign sign via OpenBao Transit GET; catalog identity = Releasable digest (ADR-0002), never `latest`. Pins: zot v2.1.8, OpenBao 2.6.2, ORAS v1.2.2, Cosign `gcr.io/projectsigstore/cosign:v2.4.3` (ghcr 403). T2–T5: 28 tests stay green. |
| 2026-09-21 | **0600/0602** | Cloud-portable ADR-0600 and portable observability ADR-0602 Proposed/Unimplemented: business crates speak `tracing` + OTLP only; backends (LGTM/Tempo, Datadog, Elastic) are collector/Alloy exporters, never in-crate SDKs. ^[extracted] |

## Structural Facts That Survived The Sessions

- **Status vocabulary**: `Accepted` = target agreed; `Réalité` = what the code
  does; `Implemented` requires an explicit human convention decision for
  out-of-jalon holes. ^[extracted]
- **Anti-targets are part of the spec**: implement the Accepted target means
  also delivering what the ADR forbids being delivered (no trusted-skip
  gateway, no Manifesto invoke, no K8s in P3). ^[extracted]
- **Control vs execution vs isolation**: Manifesto = control plane, Lazaret =
  data/I-O plane, APP-01/K8s = isolation plane (ADR-0003 untrusted plugin). ^[extracted]
- **Numbering bands**: 00xx Apparatus, 04xx IAM/services, 06xx platform —
  new work must not collide (0407 chosen over 0009). ^[extracted]

This mirrors the gated, test-per-unit style of
[[projects/re-ff8/references/battle-iso-migration-milestones]] (32 gated
groups, small testable units) and the layer-law discipline of
[[projects/re-ff8/skills/implementing-iso-battle-migration]]. ^[inferred]

## Open After This Chronicle

- APP-05 undecided (options A: permanent private / B: limited public lamina).
- ADR 0407–0410 Accepted but IdP Connect S2–S6 unimplemented (S1 crate
  `idp-connect-contract` + HMAC exists; part of S2 landed via the parallel
  task that also touched IAMRusty).
- ADR-0602 observability Proposed/Unimplemented.
- P4-core T7–T12 not started; compose leftover (IAM/Telegraph service-local)
  is a separate lot, not a "T15". ^[extracted]
