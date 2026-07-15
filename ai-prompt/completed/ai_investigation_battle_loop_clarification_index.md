# FF8 Battle Loop Clarification Prompt Pack

## Setup For You

- Keep one save just before a reproducible battle and one save/state inside a stable active battle.
- For active-loop investigations, pause after battle initialization when `mode_StateGlobal == 3`, `mode3_subsub_step == 3`, and `mode_3_subsubsubstep == 4`.
- For lifecycle investigations, start before the transition being studied: before encounter handoff, before first active tick, or before victory/escape cleanup.
- Keep IDA attached to the FF8 process with the IDA MCP server available, and prefer progressive breakpoints that are deleted immediately after use.
- When a prompt asks for pending-action injection, use `idc.patch_dbg_byte` byte-by-byte and verify the pending buffer readback.

This file indexes focused investigation prompts for the remaining unclear areas in the battle loop. Each prompt is meant to guide a new discovery pass from a known anchor to a concrete documentation update.

## General Concepts Not Yet Covered By Dedicated Pages

- `ai_investigation_on_targeting_system.md` — target mask decoding, fan-out, Double/Triple, random target selection.
- `ai_investigation_on_elemental_resolution.md` — `HIT_ELEMENT` vs `elem_def[8]` multiplier logic.
- `ai_investigation_on_escape_mechanics.md` — flee input, RNG, cannot-escape state, and battle exit.
- `ai_investigation_on_gf_charge_absorption.md` — damage redirection to GF slots during summon charge.
- `ai_investigation_on_limit_breaks.md` — character-specific Limit Break implementations.
- `ai_investigation_on_timed_status_expiry.md` — status timers, expiry, Doom, Gradual Petrify, timed buffs.
- `ai_investigation_on_battle_camera.md` — battle camera state, spell/GF camera transitions, and presentation hooks.
- `ai_investigation_on_hidden_mechanics_and_rare_edges.md` — hidden affection variables and rare combat edge cases.

## Covered Systems With Remaining Gaps

- `ai_investigation_on_battle_cleanup_and_reset.md` — transient global cleanup and battle reset writes.
- `ai_investigation_on_battle_hook_boundary.md` — domain-critical work after the proposed replacement hook point.
- `ai_investigation_on_exec_queue_layout.md` — execution queue dimensions, packing, and arbitration records.
- `ai_investigation_on_battle_rng_storage.md` — battle RNG state origin, seed, callers, and storage.
- `ai_investigation_on_command_id_draw_item_confirmation.md` — runtime confirmation for Draw `0x04` and Item `0x05`.
- `ai_investigation_on_damage_formula_and_attack_flags.md` — damage formula internals and `ATTACK_FLAG` effects.
- `ai_investigation_on_status_bits_and_interactions.md` — unnamed status bits, exclusions, hit probability, side effects.
- `ai_investigation_on_atb_auto_command_masks.md` — exact identity of auto-command readiness masks.
- `ai_investigation_on_enemy_ai_opcode_semantics.md` — richer semantic names for structurally known AI opcodes.
- `ai_investigation_on_gf_chain_completion_and_support_assertions.md` — partial GF chains and support/status GF validation.
- `ai_investigation_on_draw_stock_mutation_paths.md` — all battle/menu/junction magic stock mutation paths.
- `ai_investigation_on_encounter_terrain_semantics.md` — terrain type 27/28 road-like encounter suppressors.

## Shared Expected Result

Each investigation should produce:

1. Function addresses and proposed IDA names for newly identified routines.
2. Read/write tables for relevant globals, struct offsets, and kernel fields.
3. Runtime evidence strategy using breakpoints, memory watches, or `ff8re` hypotheses.
4. Confidence labels: confirmed, inferred, ambiguous.
5. Documentation update targets under `docs/tech/` and, if relevant, Obsidian wiki pages.
