---
title: Model-Assisted Decompile Bench
category: skills
tags: [ff8, reverse-engineering, testing, skill]
aliases: [glm-decompile bench, decompiler model eval, Nova vs GLM]
sources:
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/0416e1b9-080c-4de1-91fb-0572a868289b/0416e1b9-080c-4de1-91fb-0572a868289b.jsonl
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/6f5bbb6a-dffb-45ea-8cf8-5aec5fc9d546/6f5bbb6a-dffb-45ea-8cf8-5aec5fc9d546.jsonl
  - .agents/skills/glm-decompile/SKILL.md
summary: >-
  Measured decompiler-model bench (Nova out, GLM/Grok/GPT ranked), golden
  eval target, effort rules, glm-decompile MCP usage, and IDA diff-push.
provenance:
  extracted: 0.82
  inferred: 0.16
  ambiguous: 0.02
created: 2026-09-11T21:45:00+02:00
updated: 2026-09-11T21:45:00+02:00
---

# Model-Assisted Decompile Bench

Measured results from the 2026-09-11 decompiler-model evaluations against
Hex-Rays plus wiki ground truth. Use model output as a **tracing layer, never
as documentation**: every line needs re-verification before it touches the
IDB or the wiki.

## Golden Eval Target

`domain::EnemyAI_VM_ExecuteScript` (`0x487DF0`, ~8.9 KB, 61-opcode dispatch
at `0x487EDC`) is the reference-oracle target: mechanics known at 100%,
gameplay labels at ~98% (residual: `0x29`/`0x2E` exact skill names, IF
subjects `0x10`/`0x11`/`0x14` per-script usage). Score mechanics, not nicknames.
Gold table: [[projects/re-ff8/references/enemy-ai-opcodes]].

## Input Format Wins

- **Winner: Intel mnemonics + symbolic IDA labels** (`def_48A689`,
  `loc_48A8AB`). Raw hex / AT&T is dangerous: Nova on AT&T input hallucinated
  an unrelated Linux-kernel `sockaddr`/`AF_INET` dispatch.
- Context to attach, in order: exact ASM, IDA prototype, stack frame,
  callees with `add esp` arity proof, xrefs, globals, wiki semantics.
  Keep Hex-Rays as the verification reference, not as input.

## Small Test: `TargetHasStatus` (0x48A830, 85 Instructions)

All five candidates were semantically correct; gaps are micro-fidelity:

1. Grok 4.6 xhigh — 3 min 45 (`do/while` + `(int)` casts, most faithful).
2. GPT-5.4 Medium — ~2–3 min (kept `.com_file_id`, Hex-Rays-shaped tail).
3. Grok 4.6 high — 3 min 34 (≈ xhigh minus casts: dominated, same price).
4. GLM `high` — 37.7 s measured (correct, queue rendered as XOR).
5. Muse Spark — interactive, stable over 2 runs (Hex-Rays-shaped queue).

## Large Test: `ExecuteScript` Chunk1 (653 Lines / 15 KB)

Fidelity collapses with scale except for one candidate:

1. **Grok 4.6 xhigh** (~10 min) — 19/19 complete, true `0xD0` stride, 6/6
   hard callee orders, honest out-of-chunk gotos, shared tails as goto-labels.
2. **GPT-5.4 Medium** (~2–3 min) — good first draft but **silent amputation**
   (17/19, handlers dropped without mention): the most dangerous failure seen.
3. **Composer fast** (< 1 min) — correct skeleton, wrong stride/args/returns.
4. **GLM `low`** (55 s) — inverted berserk loop, quotient-for-remainder,
   dead spawn scan, stale stores; does not compile.
5. **GLM `high`** — technical forfeit (5 min 28, 32k reasoning tokens, 0
   emitted). Muse Spark v2 forfeited on infrastructure quota.

Honesty test: without jump-table contents, all four invented confident
`case 1..19` numbers for scattered real opcodes — **0/4 honest**. No output
is ISO-usable as-is.

## GLM Effort Rule (Measured, Same Prompt, Same Chunk)

| Setting | Time | Reasoning | Outcome |
|---|---|---|---|
| `max` | 66.6 s | 6476 tokens | correct C on 85 lines |
| `high` | 37.7 s | 3311 tokens | correct C on 85 lines; forfeit on 653 |
| `low` | 55 s | 71 tokens | emits on 653 but logically wrong |

Rule: `high` under ~200 lines, `low` above. `medium` untested. First GLM
attempts also failed with `finish_reason: length` and empty content when the
token budget went entirely to reasoning — size `max_tokens` for thought +
emission (92% thought observed).

Cost-shaped roles: GLM-`high` as the volume workhorse, Spark as fast inline
second opinion, Grok xhigh as punctual oracle for twisted `setcc` tails and
ambiguous bounds. Nova is disqualified (wrong on trivial code, ~3 tok/s,
server crash on the large chunk). ^[inferred]

## GLM Without vs With IDA Tools (VM Bench)

Same 61-opcode VM, annotated listing, 24k reasoning / 40k total tokens:

| Run | Score | Notes |
|---|---|---|
| Flash, no tools | 8/10 | clean, IF polarity + LE right, `0x2B` missing |
| 5.3, no tools | 6/10 | complete table but inverted IF, false NOP theory |
| 5.3 + IDA MCP | 8/10 | ~28 min; jumptable dump fixed both disqualifiers |
| Flash + IDA MCP | 8.5/10 | ~12 min; best of four; mapped-selector IF insight |

Caveat: the annotated listing leaks the answer (`61-opcode`, handler
comments, wiki pointer) — this measured organization plus tool use, not cold
discovery. Serve the cheap model as draft, the expensive model gets the
listing plus hypothesis-tagged claims plus 4 mandatory checks (IF polarity,
word endianness, 61 `jpt_487EDC` pointers, `0x2B` presence); use 5.3 as
adversary only.

## glm-decompile MCP And Skill

- Server `tools/glm_decompile_mcp.py` (stdio, stdlib `urllib`, 3600 s
  timeout): `glm_health` + `glm_decompile_asm` with benchmark presets (auto:
  high+8000 under 200 lines, low+32000 above), pinned system prompt,
  ```c block extraction. Smoke test PASS (4 s, fenced C).
- The pinned prompt plus output contract fixed GLM's own earlier
  `CompareValues` failure into a correct unsigned 6-case switch — evidence
  for "output contract lives in the server". ^[inferred]
- Skill `.agents/skills/glm-decompile/SKILL.md` freezes the user
  requirements: **Flash first** (`glm53-flash`, `glm53` fallback), **high by
  default** with the measured line rule, **maximal context** (7-point
  checklist), a 9-point verification checklist where each item is an observed
  bug (invented cases, silent drops, +3 cursor, arg orders, `setcc`
  polarities, strides), IDA diff-push rules, and `finish_reason=length`
  handling.
- Suggested post-reload test: "decompile `EnemyAI_TargetHasStatus` with the
  glm-decompile skill" — the skill should self-load and run the protocol.

## IDA Diff-Push Rule

Grok xhigh's large-chunk output was the best of the panel yet still invented
case numbers over already-correct IDB comments — so: **diff first, push
verified additions only, comments only, never overwrite**, translating model
case numbers back to true opcodes. That pass pushed 10 comments (shared
`0x3B→0x1F` and `0x29→0x2E` tails, berserk fallback paths, `rand%3` retry
loop, relay `DI` stores, `hit*20` index) with 2 legitimate skips.

## Related

- [[projects/re-ff8/re-ff8]]
- [[projects/re-ff8/concepts/enemy-ai-vm]]
- [[projects/re-ff8/references/enemy-ai-opcodes]]
- [[projects/re-ff8/skills/static-reverse-triplet-protocol]]
