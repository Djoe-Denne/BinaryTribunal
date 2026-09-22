---
title: P4-Core Operator Tranches
category: project
tags: [concept, project, testing]
aliases: [apparatus-operator, P4-core T2-T12, Factory isolation]
sources: [C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-19-01a0c47f-1cd0-7692-8725-bbaef7bd21d5.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-19-01a0c47f-1ce0-7d83-9ea5-c2ab9bcb3be9.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f33-7f50-a146-e3247bf26200.jsonl]
summary: >-
  P4-core apparatus-operator TDD tranches T2–T6: isolated crate, digest
  identity, ORAS/Cosign/OpenBao Transit admission, orchestrator abort lessons.
provenance:
  extracted: 0.81
  inferred: 0.13
  ambiguous: 0.06
created: 2026-09-22T00:00:00+02:00
updated: 2026-09-22T00:00:00+02:00
---

# P4-Core Operator Tranches

P4 = Factory and production runtime (ADR-0008 Accepted / Réalité
Unimplemented): K8s isolation **outside** Manifesto. Implementation runs as
TDD tranches T2→T12 in the crate `apparatus-operator`, per
`docs/apparatus-p4-core-implementation-prompt.md`. Distilled from the
2026-09-20/21 sessions of [[projects/AIForAll/AIForAll]]; canon and dates in
[[projects/AIForAll/references/apparatus-adr-chronicle-2026-09]]. The
gated-tranche TDD style is the direct analogue of
[[projects/re-ff8/references/battle-iso-migration-milestones]], and the
"untrusted builder/binary must not hold signing keys" isolation goal matches
the loader isolation of [[projects/ffscriptloader/ffscriptloader]]. ^[extracted]

## Frozen Architecture (from ADR-0008)

- K8s engine in P4, outside Manifesto; K8s-as-P3 remains forbidden (zero k8s
  tokens in `Manifesto/*/src`).
- Registry: OCI registry + Cosign signatures + OpenBao Transit keys — **only
  the signer pushes**; ACL lives on the registry, not on the cluster.
- Admission: Adm-A worker is the sole source of the `VALID` verdict; no HTTP
  IAM, no sixth hexagon side.
- Workers (build / conformance / signer / controller) are OS-distinct
  processes; operator crate has **no HTTP server and no kube dependency** at
  T2–T6; Git → digest → package → admission are independent steps; catalog
  identity = release digest, never a floating ref. ^[extracted]

## Tranches Delivered (2026-09-20/21, uncommitted)

- **T1** — absence guard: 15 tests in Manifesto proving Factory/admission/
  signer/`trusted_skip` do not exist yet (the anti-target suite).
- **T2–T5** — scaffold, `digest_manifest` contracts, build worker,
  conformance: 28 tests green. Delivered by two orchestrator runs that then
  aborted; recovered by working-tree inventory.
- **T6 (sign+registry IT)** — TDD RED (missing `admit` module) → GREEN:
  `apparatus-admit` pushes a **non-CRI ORAS envelope** and signs it (Cosign +
  OpenBao Transit GET); build cannot push (zot 401/403, signer-only
  credentials); catalog identity = Releasable digest (ADR-0002).
  Files: `src/admit.rs`, `tests/apparatus_p4_t6_sign_registry.rs`,
  fixtures `zot/` + `openbao-transit/` on a shared Docker network. ^[extracted]

## Pinned Images And Their Gotchas

| Component | Pin | Note |
|---|---|---|
| zot (OCI registry) | `ghcr.io/project-zot/zot:v2.1.8` | htpasswd bcrypt (`httpd:2.4-alpine` helper), push signer-only |
| OpenBao | `openbao/openbao:2.6.2` | Transit engine mount, not KV |
| ORAS | `ghcr.io/oras-project/oras:v1.2.2` | envelope push, tag required (`:tag`, not bare digest ref) |
| Cosign | `gcr.io/projectsigstore/cosign:v2.4.3` | **ghcr.io/sigstore/cosign refused (403)**; needs `--tlog-upload=false`, `--insecure-ignore-tlog`, `--allow-http-registry` against local zot |

Kind/oras/cosign binaries are not on PATH in this environment — IT uses
container images via Docker testcontainers (0.23.x: user-defined network,
`get_host_port_ipv4`). ^[extracted]

## Process Lessons

- The prompt enforces a human gate: no ADR-0008, no T2+ until the six APP-01
  questions are decided (each reconciled by two independent architecte agents
  before ratification). ^[extracted]
- Orchestration at this scale is fragile: two orchestrator runs on the same
  lot aborted mid-T6 (`unavailable` after "T4 GREEN"), and a **parallel**
  session simultaneously implemented parts of idp-connect-contract and
  IAMRusty. The rule that held: stop, inventory `git status` + transcripts,
  classify what landed, then resume from the working tree — never from the
  stale plan. ^[extracted]
