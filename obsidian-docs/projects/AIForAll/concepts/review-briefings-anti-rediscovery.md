---
title: Review Briefings (Anti-Rediscovery)
category: project
tags: [skill, concept, testing]
aliases: [review-briefings, briefing protocol]
sources: [C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T15-14-19-01a0b4a7-5245-75e3-bea6-a3db2e5a9e7c.jsonl, C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T15-14-19-01a0b4a7-5242-7661-b842-ddf9155e0724.jsonl, C:/Users/djden/.codex/sessions/2026/09/19/rollout-2026-09-19T13-35-19-01a0b973-092a-7422-bd45-e32234d683ce.jsonl, C:/Users/djden/.codex/sessions/2026/09/19/rollout-2026-09-19T13-35-19-01a0b973-092e-7b72-bbad-5732a8235063.jsonl]
summary: >-
  AIForAll protocol: reviewers persist reasoning as gitignored briefings;
  implementers read briefings instead of re-deriving findings from chat.
provenance:
  extracted: 0.85
  inferred: 0.12
  ambiguous: 0.03
created: 2026-09-22T00:00:00+02:00
updated: 2026-09-22T00:00:00+02:00
---

# Review Briefings (Anti-Rediscovery)

A workflow introduced in AIForAll on 2026-09-17 after implementer agents kept
re-deriving review findings from raw chat transcripts. Distilled from the
2026-09-18/19 sessions of [[projects/AIForAll/AIForAll]]. It is a reusable
multi-agent review pattern, comparable in intent to the evidence-first
workflow [[projects/re-ff8/skills/evidence-to-domain-doc]] and to the
read-only-reviewers / parent-arbitration split of
[[projects/re-ff8/skills/static-reverse-triplet-protocol]]. Red-team style
adversarial passes (e.g.
[[projects/final-fantasy-viii-reimaginated/references/g14-g17-red-team-2026-08-27]])
play the same "independent reviewers, consolidated verdict" role. ^[extracted]

## The Contract

- Location: `.cursor/review-briefings/` — findings files + `INDEX.md` are
  **gitignored**; only `README.md` (the contract) and `TEMPLATE.md` are
  tracked.
- Naming: `YYYYMMDDTHHMMZ-<reviewer>-<scope-slug>-<shortsha>.md` with reviewer
  ∈ {correctness, tests, rust-perf, security}.
- **Every** reviewer writes a briefing after every review — even PASS or
  BLOCK. Read-only reviewers return `BRIEFING_PATH` + `BRIEFING_MARKDOWN`;
  the orchestrator persists the file for them.
- Implementers read the briefings **before** exploring the code; chat history
  is explicitly not the handoff medium. ^[extracted]

## Verdict Vocabulary

Observed verdicts: `PASS`, `GO_WITH_COMMENTS`, `NO-GO` (full consolidated
review), with findings graded BLOCK / HIGH / MEDIUM / LOW / NIT plus stable
IDs (A-1, T-1, S-1, RP-1, C-1…). The orchestrator consolidates reviewer output
into a single findings table: real findings kept, duplicates merged (with a
"Reviewers" column), rest dismissed to *Non-issues* or *Trous / non-revu* —
the consolidated table is the orchestrator's synthesis, not a raw dump. ^[extracted]

## Observed Outcomes

- 2026-09-17 full uncommitted review of Lazaret/Apparatus: verdict NO-GO
  (contract and trust-boundary defects: multi-consent break on
  `grant_revision` bump, GET snapshot IDOR, `declared` forced to
  `Capability::all()`, non-atomic CAS, `/session` without cert layer) → plan
  of fixes in three lots, closed by resuming from the working tree after an
  orchestrator abort. ^[extracted]
- 2026-09-18 T10 review: correctness PASS; tests/perf/security
  GO_WITH_COMMENTS; fixes T-1 (fail-closed revoke without KV purge), T-2
  (grant_revision bump → 409 frozen session), T-3 (same-fingerprint put
  no-op), S-1 (`binding_enrolled` → Result, store error = 500, no CA
  signature). ^[extracted]
- 2026-09-19 changeset review (`46fed9be`): all verdicts PASS or
  GO_WITH_COMMENTS with only INFO/MEDIUM findings; the fix narrowed a test's
  transient-failure needle instead of touching production code. ^[extracted]

## Caveats Learned

- Briefing files can exist before agents reference them; the rollout included
  a verification step ("briefings exist, agents don't point to them yet") —
  adoption needed an explicit wiring pass. ^[extracted]
- Aborted orchestrator runs (77-minute `User aborted request`) leave todos and
  plans stale; the recovery rule is to inventory `git status`/diffs, not trust
  plans. The same rule applies to parallel work landing mid-lot. ^[extracted]
