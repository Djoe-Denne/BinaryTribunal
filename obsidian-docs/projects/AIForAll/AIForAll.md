---
title: AIForAll
category: project
tags: [project, testing]
aliases: [AIForAll platform, IAMRusty]
sources: [C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T12-16-05-01a0aedd-ca5e-7fa1-890f-dab2bd813244.jsonl, C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T12-16-05-01a0aedd-ca62-7860-8003-1c9386790ec2.jsonl, C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T15-14-19-01a0b4a7-5249-7462-9e05-24d226263354.jsonl, C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T15-14-19-01a0b4a7-5323-7e82-864e-51435766cc08.jsonl, C:/Users/djden/.codex/sessions/2026/09/19/rollout-2026-09-19T13-35-19-01a0b973-092e-7b72-bbad-5732a8235063.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-19-01a0c47f-1ce0-7d83-9ea5-c2ab9bcb3be9.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f33-7f50-a146-e3247bf26200.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f43-7b50-bda2-1276f1c5ec3b.jsonl]
summary: >-
  Rust multi-service platform (Manifesto, Lazaret, IAM, Hive, Telegraph).
  Apparatus P3 Implemented, P4-core T2–T6 in flight, ADR-governed.
provenance:
  extracted: 0.82
  inferred: 0.14
  ambiguous: 0.04
created: 2026-09-22T00:00:00+02:00
updated: 2026-09-22T00:00:00+02:00
---

# AIForAll

AIForAll is a Rust multi-service platform distilled from Codex chat history
(2026-09-17 → 2026-09-21). It is a sibling project to the FF8 reverse
engineering work in this vault and shares the same orchestrated multi-agent
working style as [[projects/re-ff8/skills/static-reverse-triplet-protocol]].

## Services And Crates

- **Manifesto** — project-service MVP; owns bindings, consent, grant
  snapshots, components, and the SQS event outbox. Hexagonal Rust.
- **Lazaret** — the Apparatus P3 bounded context: plugin capability
  boundary (grants, KV namespaces, secrets `secret:{path}#{field}`,
  workload identity, mTLS enrollment). Separate service: prefix `/lazaret`,
  port 8084, own DB. Manifesto stays owner of binding/consent. ^[extracted]
- **IAMRusty (IAM)** — platform IdP; OAuth2 providers GitHub/GitLab currently
  in-process adapters, slated for extraction to vendor-neutral IdP Connect
  services (ADR 0407–0410).
- **Hive, Telegraph** — standalone services; all five standalones joined by
  the HTTPS platform mesh (T14b) and share rustycog HTTP conventions.
- **rustycog** — sibling repo (git submodule) providing the HTTP/TLS server
  framework; mTLS client-auth was added there opt-in (T11a) before Lazaret
  pinned it.
- **apparatus-operator** — P4-core crate: build / conformance / sign / admit
  workers as OS-distinct processes, no HTTP server, no kube tokens. ^[extracted]

## Apparatus Phases (September 2026 State)

- **P2 (ADR-0006)** — in-process reconciliation controller: **Implemented**.
- **P3 (ADR-0007, Lazaret)** — T1–T14b delivered (identity, grants, consent,
  KV, invoke, kv_purge, mTLS, OpenBao, HTTPS mesh). Flipped to
  **Implemented** on 2026-09-20 after the A-DEC decision — see
  [[projects/AIForAll/concepts/adr-status-discipline]].
- **P4 (ADR-0008)** — K8s isolation outside Manifesto; Accepted /
  Unimplemented; core tranches T2–T6 partially delivered (T6 sign+registry
  green; T7+ not started). See
  [[projects/AIForAll/references/apparatus-adr-chronicle-2026-09]]. ^[extracted]

## Working Method

All tasks flow through an **orchestrator** agent with specialized reviewers
(correctness, tests, rust-perf, security), an `architecte` for ADRs, and
hard-implementers for single tranches. Reviewers persist their reasoning as
gitignored briefings so implementers never re-derive findings — see
[[projects/AIForAll/concepts/review-briefings-anti-rediscovery]]. The
orchestrator arbitrates and consolidates findings; parallel implementers must
be inventoried from the working tree, not from plans, because aborted
orchestrator runs leave partial work on disk. ^[extracted]

Model routing (2026-09-17): heavy tasks on Grok 4.6 xhigh
(`cursor-grok-4.6-xhigh`), reading-only tasks on Composer
(`composer-2.5-fast`); "high" tier does not exist in that session — xhigh is
the fallback. This is the same measured-model-selection spirit as
[[projects/re-ff8/skills/model-assisted-decompile-bench]]. ^[extracted]

Tooling: GrepAI (semantic search), Serena (symbolic + project memories),
context-mode sandbox, QMD over the project's own Obsidian vault
(`obsidian/AI FOR ALL`) which is ingested chat+commit on a delta basis. ^[extracted]

## Vault Sync Method (their wiki, reusable)

AIForAll syncs its own Obsidian wiki plus a QMD collection (`aiforall-wiki`)
from Cursor transcripts and commits. Distilled rules from the 2026-09-17/18/21
ingest sessions: ^[extracted]

- Resolve the vault from the **project `.env`**, never the global
  `~/.obsidian-wiki/config` (which pointed at a different project); read
  paths only, never quote secret values.
- Compute the delta from `.manifest.json` (`last_commit_synced` → HEAD
  commits + transcripts by mtime); append-mode, topic-distilled; skip sources
  whose hash is unchanged.
- Update hubs: index pages, decision indexes, daily journal, `log.md`,
  manifest stats.
- Include subagent transcripts (435 of 537 files were subagents on the
  2026-09-21 run: 489 ingested, 48 up-to-date, commits `9e85edd` → `a27ea5b`
  distilled: HTTPS mesh, Lazaret CA, OpenBao T12, rustycog dual-bind, SQS
  retries).
- Alias triage: dictation created phantom names ("Paravretius" for
  **Apparatus**) — verify absence in the wiki, state the canon, add an alias
  entity page, never invent a new concept.
- CI triage feeds the same sync: `gh run view <id> --log-failed` diagnosis
  (8 Manifesto tests broken by commit `9e85edd`; SQS setup panic) delegated
  to the orchestrator, outcome logged in the wiki.

## Open Items

- APP-05 (public-project Apparatus surface) deliberately undecided; two
  options recorded in ADR-0004 § Non décidé. ^[extracted]
- P4-core T7–T12 unimplemented; IdP Connect S2–S6 unimplemented; ADR 0602
  observability Proposed/Unimplemented.
- Orchestrator aborts mid-lot are a recurring failure mode; recovery is
  always "inventory the working tree, ignore stale plans". ^[inferred]
