---
title: ADR Status Discipline
category: project
tags: [concept, project]
aliases: [Accepted vs Implemented, Realite labels]
sources: [C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f33-7f50-a146-e3247bf26200.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f40-7f23-a527-a5943b68e7c3.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-19-01a0c47f-1cde-7d43-95d5-b790777b5a8b.jsonl]
summary: >-
  AIForAll ADR governance: Accepted=target, Réalité=code truth, A-DEC human
  gate, anti-targets, open-question parking instead of premature ADRs.
provenance:
  extracted: 0.78
  inferred: 0.18
  ambiguous: 0.04
created: 2026-09-22T00:00:00+02:00
updated: 2026-09-22T00:00:00+02:00
---

# ADR Status Discipline

A decision-governance concept distilled from the AIForAll sessions of
2026-09-19 → 2026-09-21, where an entire day was spent reconciling ADR labels
with reality before closing ADR-0007
([[projects/AIForAll/references/apparatus-adr-chronicle-2026-09]]). The
claim-vs-evidence distinction mirrors re-ff8's promotion ladder, e.g.
[[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]]. ^[extracted]

## The Two Labels

- **Accepted** — "we agree on the target". A human decision, cheap to flip.
- **Réalité: Implemented** — "the code does it". Requires evidence, and in
  AIForAll also requires an explicit human convention statement when listed
  holes remain. Flipping `Implemented` without that statement "violates 0007"
  even when every mechanism is tested. ^[extracted]

A closeout audit (2026-09-20) found the mismatch direction was always
**under-marking**, never over-marking: no ADR claimed Implemented falsely;
ADR-0004 was stale in the other direction (still Partial with notes claiming
OpenBao absent and `kv_purge` unwired, while T8/T11b/T12/T14b existed). ^[extracted]

## A-DEC — The Human Gate

The recurring blocker was not code but a sentence: may `Réalité: Implemented`
be written while four holes (APP-05, 0006 G/E, K8s, second protocol) remain?
The ratified answer (2026-09-20): yes, those items are requalified
**hors-jalon** (out of jalon scope), not blockers. Options for genuinely
undecided questions are parked in the § "Non décidé" of the ADR that owns the
ticket (APP-05 options A/B live in ADR-0004), and APP-xx items only become
ADRs when actually decided. ^[extracted]

## Anti-Targets

"Implement the Accepted target" includes delivering what the ADRs **forbid**:
no `trusted_skip_gateway` path, no `invoke` on Manifesto, no K8s tokens in
Manifesto sources, no second protocol. Tests encode these as absence/forbidden
checks — the P4 T1 suite is 15 tests proving things do **not** exist yet. ^[extracted]

## Three-Plane Separation

Why 0006 has "no K8s and no invoke": it is not a trimmed feature set but a
deliberate plane split — **control** (Manifesto: binding, digest, consent,
lease), **data/I-O** (Lazaret: may the plugin call, read KV/secrets/network),
**isolation** (where the untrusted binary runs — deferred to APP-01/P4). ^[extracted]

## Relation To re-ff8

This mirrors the evidence discipline of the FF8 project: claims stay
`Partial` until promoted with proof, and live promotion is a separate,
explicit act — see [[projects/re-ff8/references/battle-loop-iso-readiness]]
and [[projects/re-ff8/skills/ff8-live-validation-operations]]. ^[inferred]
