---
title: GF Runtime Test Matrix
category: skills
tags: [ff8, gforce, testing, skill]
aliases: [GF YAML tests, tier3 inject matrix]
sources: [ff8re/tests/tier1_layout/SLOT_001.yaml, ff8re/tests/suites/GF_OFFENSIVE.suite.yaml, ff8re/tests/tier3_inject/GF_IFRIT_001.yaml, ff8re/tests/tier3_inject/GF_SHIVA_001.yaml, ff8re/tests/tier3_inject/GF_QUEZACOTL_001.yaml, ff8re/tests/tier3_inject/GF_SIREN_001.yaml, ff8re/tests/tier3_inject/GF_SIREN_002.yaml, ff8re/tests/tier3_inject/GF_BROTHERS_001.yaml, ff8re/tests/tier3_inject/GF_DIABLOS_001.yaml, ff8re/tests/tier3_inject/GF_CARBUNCLE_001.yaml, ff8re/tests/tier3_inject/GF_LEVIATHAN_001.yaml, ff8re/tests/tier3_inject/GF_PANDEMONA_001.yaml, ff8re/tests/tier3_inject/GF_CERBERUS_001.yaml, ff8re/tests/tier3_inject/GF_ALEXANDER_001.yaml, ff8re/tests/tier3_inject/GF_DOOMTRAIN_001.yaml, ff8re/tests/tier3_inject/GF_BAHAMUT_001.yaml, ff8re/tests/tier3_inject/GF_CACTUAR_001.yaml, ff8re/tests/tier3_inject/GF_TONBERRY_001.yaml, ff8re/tests/tier3_inject/GF_TONBERRY_002.yaml, ff8re/tests/tier3_inject/GF_TONBERRY_003.yaml, ff8re/tests/tier3_inject/GF_EDEN_001.yaml, ff8re/tests/tier3_inject/GF_ODIN_001.yaml, ff8re/tests/tier3_inject/GF_GRIEVER_001.yaml]
summary: Skill page for using the YAML test matrix that drives slot-layout and Tier 3 GF injection hypotheses.
provenance:
  extracted: 0.84
  inferred: 0.1
  ambiguous: 0.06
created: 2026-06-02T16:50:00+02:00
updated: 2026-06-15T16:35:00+02:00
---

# GF Runtime Test Matrix

This is a skills/tooling page: it documents how the YAML tests are organized and how they are meant to be used, not a domain claim page for FF8 mechanics.

The `ff8re/tests` tree turns [[projects/re-ff8/concepts/gforce-catalog-and-families]] and [[projects/re-ff8/skills/gf-hypothesis-authoring]] into executable hypotheses.

## Test Tiers

- `tier1_layout/SLOT_001.yaml` is a read-only memory-layout test. It validates slot HP plausibility, stride assumptions, and pending-buffer readability without breakpoints or writes.
- `tier3_inject/*.yaml` actively writes the pending action buffer, observes GF cinematic/sequence behavior, and checks damage or status outcomes.
- `tests/suites/GF_OFFENSIVE.suite.yaml` runs an ordered set of offensive GF hypotheses with `before_each` hooks that reseed enemy HP and wait for combat state to settle.

## Common Tier 3 Pattern

- Sync to `BattleATB_TickAndReady` at `0x4842B0`.
- Snapshot the 24-byte pending buffer for cleanup.
- Snapshot relevant party or enemy slots.
- Set breakpoints for pending transfer, GF cinematic dispatch, GF-specific entry/tick/counter/completion, and damage pipeline functions.
- Inject bytes of the form `08 80 00 03 XX 00 00 01`.
- Assert pending transfer, GF/progression evidence, damage/status path, and final HP/status changes.
- Restore the pending buffer during cleanup.

## Notable Tests

- `GF_IFRIT_001` is the canonical confirmed injection test: `command_arg = 0x42`, target mask `0x8008`, and full summon sequence.
- `GF_CERBERUS_001` validates a support GF by checking party status additions such as Double and Triple rather than enemy HP damage.
- `GF_DIABLOS_001` validates gravity-style HP reduction with `command_arg = 0x45`.
- `GF_PANDEMONA_001` validates wind-style enemy damage with `command_arg = 0x48`.
- `GF_SIREN_001` and `GF_SIREN_002` focus on enemy status infliction and status payload capture.
- `GF_DOOMTRAIN_001` checks broad negative status additions.
- `GF_TONBERRY_003` refines earlier Tonberry evidence by waiting for resolve first, then apply, so action globals capture the GF context deterministically.

## Command Arg Coverage

The YAML matrix covers the junctionable GF kernel range `0x40..0x4F` plus special probes for Odin and Griever. Some values are confirmed by runtime evidence, while others are derived from the standard `0x40 + GF index` pattern and are still marked as hypotheses in their source files.

## Suite Behavior

`GF_OFFENSIVE.suite.yaml` runs Quezacotl, Shiva, Ifrit, Leviathan, Brothers, Alexander, Bahamut, Tonberry, Eden, Cactuar, Carbuncle, and Pandemona with a `before_each` reseed of enemy HP and a cooldown wait that resumes execution.

## Named-Global Resolver Fix (2026-06-15)

`binaryTribunal/mcp_client.py::resolve_global_addr` resolved global names through `ida_name.get_name_ea_simple`, which **does not exist** in the IDA 9 / Python 3.13 MCP runtime. The embedded `py_eval` raised `AttributeError`, returned an empty `result`, and every named-scalar read fell through to the "Resolved global address ... was 0x0" error. As a result `read_action_globals`, `read_phase_flags`, and `read_elemental_globals` silently returned error strings even though the symbols existed in the IDB.

Fix: resolve via `idc.get_name_ea_simple`. After this, action globals capture correctly (e.g. `COMMAND_TYPE_ID`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID`, `HIT_STATUS_1`, `HIT_STATUS_2`). Confirmed live by re-running the Alexander, Cerberus, and Doomtrain injection tests — see the payload dump in [[projects/re-ff8/concepts/gforce-catalog-and-families]].

Related caveat: the `read_stack_args` action calls the MCP `dbg_regs_named` tool, which rejects a list of register names ("expected str, got list"). Prefer `read_registers` / `read_action_globals` until that action is fixed.

## Capturing a GF Payload Without Enemy Contamination

The summon is not instantaneous: there is an invocation/charge delay (~30 s of unpaused logic) between arbitration and `GF_CINEMATIC_TICK 0x50B2A0`. During that delay the enemy can take a turn and trip the generic `APPLY_DAMAGE 0x494410`. A clean capture therefore waits **only on GF-specific anchors** for the first hop (`GF_CINEMATIC_TICK`, per-GF `*_entry`/`*_tick`/`*_counter_inc`) and never on the generic resolve/apply path until the GF cinematic is already in progress. The `GF_*_001.yaml` tests follow this pattern; ad-hoc YAMLs that armed `APPLY_DAMAGE` in the first wait were contaminated by enemy attacks.

## Open Questions

- Several Tier 3 YAML files explicitly mark command args or chain details as hypothesized; these should become confirmed only after evidence JSON proves the path. ^[ambiguous]
- Some tests assert on HP decrease, while support/status GFs need status-oriented assertions to avoid false failures. ^[inferred]

## Related

- [[projects/re-ff8/concepts/ff8re-hypothesis-runner]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
