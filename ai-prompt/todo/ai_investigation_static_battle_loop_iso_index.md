# FF8 Static Battle-Loop ISO Investigation Pack

## Purpose

Static-first investigations (IDA decompile / xrefs, **no live debugger required**) aimed at closing the gaps that block a faithful (ISO) reimplementation of the battle loop. Companion to the readiness scorecard `obsidian-docs/projects/re-ff8/references/battle-loop-iso-readiness.md`.

These prompts are written to also **record what has already been discovered** in each area, so each file is both a tracker and a next-step plan. The "live" pack (`ai_investigation_live_battle_loop_followups_index.md`) remains for the runtime-only residuals.

## Setup For You

- IDA MCP is attached to the IDB (server `user-ida-pro-mcp`): use `decompile`, `xrefs_to`, `xrefs_to_field`, `callees`, `callgraph`, `list_globals`, `read_struct`, `get_global_value`, `disasm`, `find_regex`.
- Prefer pure static recovery. Only request a live run when a value cannot be derived statically.
- When a function meaning is proven, propose IDA renames / `set_comments` / `set_type`.

## Prompt List (priority order)

Status as of 2026-06-15 (✅ = closed, moved to `ai-prompt/completed/`; ◐ = partial, stays here; ☐ = open):

1. ✅ `completed/ai_investigation_static_damage_hit_crit_formulas.md` — exact damage/heal/hit/crit arithmetic (A1–A2). **Closed → `references/battle-formulas.md`.**
2. ✅ `completed/ai_investigation_static_status_hit_probability.md` — `DoesMentalStatusHit` exact probability (A3). **Closed.**
3. ✅ `completed/ai_investigation_static_forced_action_group0_and_counters.md` — group-0 injection + counter/Cover/return-damage paths (B1). **Closed.**
4. ✅ `completed/ai_investigation_static_action_sequencing_and_cadence.md` — cross-frame action pacing + frame cadence (B2/B3). **Closed → `battle-lifecycle.md` (commit-at-selection, `BYTE1` latch, ~15 fps pump).**
5. ✅ `completed/ai_investigation_static_atb_internals.md` — ATB tick internals & readiness (A4). **Closed.**
6. ✅ `completed/ai_investigation_static_rng_lane_discipline.md` — per-callsite RNG lane discipline + seed algo (B4). **Closed.**
7. ✅ `completed/ai_investigation_static_init_formulas.md` — junction stats + enemy scaling + ATB init (A6). **Closed → `references/battle-formulas.md` (*Initial state derivation*).**
8. ✅ `completed/ai_investigation_static_enemy_ai_opcode_exact.md` — exact semantics for all 61 AI opcodes (A5). **Closed → `references/enemy-ai-opcodes.md`.**

**Foundational static pack:** complete — A1–A6 and B1–B4 are closed. This no
longer means that every later implementation milestone is statically ready.
G10 is live-promoted and G11–G20 still need their unit-level readers, writers,
transactions, ownership and confidence mapped before implementation.

## Long autonomous milestone campaign

- `g11-g20-autonomous-static-investigation-marathon-new-chat.md` — static-only
  multi-hour campaign. Required depth: G11–G14 plus the G15 crosswalk;
  extensible reconnaissance: G16–G20. It persists a readiness ledger and an
  uncertainty register into Obsidian, recompiles `ff8-wiki` periodically, and
  explicitly supports retroactive correction when later xrefs invalidate an
  earlier interpretation.

The historical live pack remains for the residuals that the marathon labels
`live-required`; it is not part of the autonomous run.

## Classement par complexité d'investigation (restants — live uniquement)

1 = simple/mécanique, 5 = très difficile. Tous les statiques sont clos ; les live exigent une session + scénarios déclenchés par l'utilisateur.

| Complexité | Fiche | Type | Pourquoi |
| --- | --- | --- | --- |
| **4/5** Élevée | `ai_investigation_live_camera_control_word_decode.md` | live | mot 100+ écrivains, décodage bit + routing |
| **3/5** Moy.-élevée | `ai_investigation_live_exit_path_state_reset_matrix.md` | live | 5 sorties à reproduire + carry-over |
| **3/5** Moy.-élevée | `ai_investigation_live_runtime_callback_mix_matrix.md` | live | classification domaine vs présentation |
| **3/5** Moy.-élevée | `ai_investigation_live_angel_wing_timeline.md` | live | scénario multi-tours |
| **2/5** Moyenne | `ai_investigation_live_pending_exec_authentic_bytes.md` | live | mécanique, captures entamées |
| **2/5** Moyenne | `ai_investigation_live_gf_payload_dump.md` | live | dump observationnel, non ISO-bloquant |

## Shared Expected Output

Each investigation should produce:

1. Exact pseudocode / bit tables sufficient to reimplement the subsystem ISO.
2. Confirmed / inferred / ambiguous labels per conclusion.
3. Proposed IDA renames/signatures for newly proven functions.
4. A short "merge-ready deltas" section for the relevant wiki/docs pages.
