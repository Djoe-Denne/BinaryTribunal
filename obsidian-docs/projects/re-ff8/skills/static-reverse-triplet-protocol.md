---
title: Static Reverse Triplet Protocol
category: skills
tags: [ff8, reverse-engineering, testing, skill]
aliases: [triplet arbitration, parent arbitration, PARENT_CHECK resolver]
sources:
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/9d143d47-8044-417b-a60c-ff3bd8ab02b6/9d143d47-8044-417b-a60c-ff3bd8ab02b6.jsonl
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/8fe1607d-95ab-4404-8f0b-a043f4bc706e/8fe1607d-95ab-4404-8f0b-a043f4bc706e.jsonl
  - docs/tech/investigation/battle-static-discovery/HANDOFF_wave3-apply.md
  - docs/tech/investigation/battle-static-discovery/HANDOFF_rewrite-plan.md
summary: >-
  Multi-agent static RE method: Grok triplets read-only, parent arbitrates at
  disassembly, Spark Max resolver on conflict, single IDA batch, no QMD.
provenance:
  extracted: 0.85
  inferred: 0.13
  ambiguous: 0.02
created: 2026-09-11T21:45:00+02:00
updated: 2026-09-11T21:45:00+02:00
---

# Static Reverse Triplet Protocol

Working method used for the FF8 battle static-discovery campaigns (waves 1–3,
`wave3-apply`, PH9/PH10, VA→VD, lots E1/E2/E3a/E3b/E3c). It produces
arbitrated, byte-proven renames — not trusted agent prose.

## Core Loop

1. **One subject = 1 principal analysis + 2 independent counter-reviews**,
   same task, launched in parallel.
2. **Subagents are strictly read-only**: no IDB, no docs, no QMD mutations.
3. The **parent alone** compares reports, arbitrates **at the disassembly**
   (`disasm`, never Hex-Rays alone), then mutates: one consolidated IDA batch
   plus a single `idc.save_database(idc.get_idb_path())`.
4. On large disagreement, launch a **read-only resolver** (Muse Spark Max
   allowed) that reduces the conflict to **≤25 `PARENT_CHECK`** items.
5. **Never trust reports**: every divergence is settled in the PE/IDB before
   writing. `runtime-only` is forbidden as a cover for a static hole.
6. Never claim 100% while a statically resolvable unknown remains.

E3c precedent: resolver table **170 ACCEPT / 38 KEEP / 4 PARENT_CHECK** plus
8 principal errors refuted by the counter-reviews.

## Model Policy (as of 2026-09-11)

- Principal analyses: `cursor-grok-4.6-xhigh`.
- Counter-reviews: `cursor-grok-4.6-xhigh` **or** `muse-spark-1.3-max`.
- History: wave-3 ran Grok everywhere; on 2026-09-10 the user authorized a
  Spark model for reviews (the literal slug "muse spark max 1M" does not
  exist — resolved to `muse-spark-1.3-max`, ask if another model was meant),
  then restricted subagents to Grok-only on cost grounds with the Spark Max
  resolver as the single exception.
- Never poll subagents: launch them and wait for completion notifications.

## Tree And Tooling Rules

- Always answer in French; **no git commit** without an explicit request.
- The tree is routinely dirty (user work in progress): before any write,
  re-read `git status` plus the target file; never overwrite user work.
- Serena: active project `retro-eng` **or** `re-ff8`, both acceptable; never
  `activate_project` (shared pooled instance).
- **QMD belongs to the user** (since 2026-09-11): never run it, delegate it,
  or touch its index/cache. `.manifest.json` is UTF-8-SIG with silently
  duplicated keys — edit format-preserving only, then verify key uniqueness.
- IDA MCP namespace is `project-0-re-ff8-ida-pro-mcp`. IDB is the IDA 9.3
  path (`FF8_EN.exe - 9.3.i64`), not the old `FF8_EN.exe.i64` name.
- PowerShell: no `head`/`tail`, `py -3` (not `python -3`); inline Python is
  fragile — write throwaway scripts under `.tmp/` and delete them after use.
- Do not "fix" CRLF line endings on `magic_effect_table.md` / `battle_init.md`.

## Provenance Lessons

- Wave-3 closed arbitration at ~98% (18/18 reports confronted to PE/IDB) with
  only 3 read-only micro-verifications left (44 camera-stub starts byte scan,
  3 callback prologues, Gilgamesh shared-callback `push` scan).
- Static coverage estimates at that point: architecture 75–85%, visual-content
  families 30–40% (actors 40–55%, attacks 40–50%, magic 25–40%, GF 20–35%);
  realistic static targets were ~90% architecture and 60–75% families, since
  much choreography is archive-data-driven, not EXE-coded. ^[inferred]
- A parallel Codex agent (Astra, ChatGPT 6 X-high) shared the tree until
  2026-09-10, when the user lifted the concurrency constraint.
- The wiki temporarily led `docs/tech` on arbitrated-but-unapplied truths
  ("wiki leads docs, assumed"); `wave3-apply` closed that debt.

## IDA And MCP Pitfalls

- Hex-Rays lies (`0x507080` hides `sub ebx,0x1000`; `0x50633D` has constant
  `ecx=0x8000`; false rel32 clones on wrappers): always confirm at `disasm`.
- `lookup_funcs` sometimes echoes the address or fails without namespace
  (`main::FFBattleModule`, `domain::BattleAction_GetText`): query by VA.
- `xrefs_to` misses LEAs; `find_bytes` has false negatives.
- Rename batches can partially succeed: handle errors one by one, check
  collisions first (`lookup_funcs`).
- Ledger indegree = BFS `direct_call|tail` sites (≠ IDA `XrefsTo` ≠ unique
  callers). Clone shape = CFG/mnemonics, never raw bytes (relocation-aware
  hash). `0x48D200` stays `domain::BattleAction_GetText`.

## Related

- [[projects/re-ff8/re-ff8]]
- [[projects/re-ff8/references/battle-static-call-graph]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/re-ff8/skills/model-assisted-decompile-bench]]
