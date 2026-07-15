---
title: Battle State Model
category: concepts
tags: [ff8, runtime-memory, battle-system, concept]
aliases: [BattleContext, global-backed battle state]
sources:
  - docs/tech/investigation/battle_state_reconstruction.md
  - docs/tech/reference/battle_slot_layout.md
  - docs/tech/systems/battle_slot_data.md
  - docs/tech/reference/pending_action.md
  - ai-prompt/ai_investigation_on_battle_struct.md
  - ai-prompt/temp_result_battle_struct.md
  - ff8re/battle_state.py
  - obsidian-docs/_staging/investigations/exec_queue_layout_2026-06-09.md
  - obsidian-docs/_staging/investigations/battle_rng_storage.md
  - obsidian-docs/_staging/investigations/timed_status_expiry_2026-06-09.md
  - obsidian-docs/_staging/investigations/gf_charge_absorption.md
  - obsidian-docs/_staging/investigations/live_static_closure_2026-06-13.md
  - IDA static decompile 2026-06-14 (Battle RNG seed/draw + CRT rand 0x55CBD2)
summary: FF8 battle state is a global-backed cluster of slot arrays, slot-local pending triplets, grouped exec cells, timer banks, RNG globals, and transient action fields.
provenance:
  extracted: 0.90
  inferred: 0.07
  ambiguous: 0.03
created: 2026-06-02T16:37:00+02:00
updated: 2026-07-12T13:45:00+02:00
---

# Battle State Model

The analyzed battle paths do not expose one contiguous heap-owned `BattleContext*`. The practical model remains a global-backed state cluster, but several once-fuzzy subsystems are now better pinned down: slot-local pending storage, grouped exec cells, timed status counters, concrete battle RNG state, and the summon-charge absorb pool.

## Core Runtime Objects

- `BATTLE_SLOT_DATA` at `0x1D27B10` is `FF8BattleSlotData_s[11]`, stride `0xD0`.
- Slots are still partitioned as party `0..2`, enemies `3..7`, and GF-related reserved slots `8..10`.
- `CURRENT_ENCOUNTER_DATA_SCENE_OUT` at `0x1D287DC` holds the active 128-byte `scene.out` snapshot.
- Pending storage begins at `0x1D28D44`, but the active loop now clearly consumes three 24-byte slot-local triplets rather than only three total entries.
- Exec storage begins at `0x1D288E8`, but the first visible bytes are only aliases into a larger `3 groups x 11 cells x 24 bytes` structure.
- Phase flags such as `mode_StateGlobal`, `mode3_substep`, `mode3_subsub_step`, and `mode_3_subsubsubstep` still decide init, active tick, and cleanup.

## High-Signal Slot Fields

- `+0x08 status_2`, `+0x0C status_2_copy`, `+0x80 status_1`, and `+0x82 status_1_copy` feed status gates and UI mirrors.
- `+0x10 max_atb`, `+0x14 cur_atb`, and `+0xC1 spd` feed [[projects/re-ff8/concepts/atb-and-command-menu]].
- `+0x18 current_hp` and `+0x1C max_hp` are written by [[projects/re-ff8/concepts/damage-status-pipeline]].
- `+0x44 elem_def[8]` and `+0x90 mental_res[...]` carry resistance data.
- `+0x54 timer[16]` hosts the timed-status bank documented in [[projects/re-ff8/concepts/timed-status-expiry]].
- `+0x84 target_info_mask` is currently best understood as auxiliary action or summon state, not as the authoritative target selector.

During active GF charge absorption, current evidence says `target_info_mask` also mirrors the live absorb pool seeded from persistent GF HP state. Direct redirection into slots `8..10` remains unconfirmed.^[ambiguous]

## Queue And RNG Subsystems

Two non-slot subsystems are now much less abstract:

- pending and exec action storage, described in [[projects/re-ff8/concepts/command-action-pipeline]],
- the battle RNG state:
  - `RANDOM_NUMBER_LIST` at `0xB697F8` — static 256-byte table (does not need capture)
  - `BATTLE_RNG_LANE_INDEXES[8]` at `0x1D2A228` — eight one-byte lane cursors
  - `BATTLE_RNG_ACTIVE_LANE` at `0x1D2A230` — active lane (`& 7`)

That RNG state sits near battle globals but outside the old `0x1D27xxx-0x1D28xxx` shorthand cluster, so earlier summaries that treated battle randomness as an unnamed internal field were too weak.

**RNG model (confirmed 2026-06-13, seed-source corrected 2026-06-14):** `Battle_GetRandomInt` (`0x48F020`) returns `RANDOM_NUMBER_LIST[BATTLE_RNG_LANE_INDEXES[active_lane]++]` — the active lane's one-byte cursor post-increments and wraps mod 256. All 71 in-battle randomness callsites (damage, crit, hit, targeting, mug/steal/draw, ATB init, enemy AI, GF specials, escape) draw from this single table+cursor path. The cursor type is one byte, so the table is exactly 256 entries.

`Battle_SeedRNG` (`0x48F050`) is called **exactly once per battle** by `FFBattleDirector_battleLoop` (`0x47D510`). It fills all eight lane cursors from the seed byte, walks lane 0 eight times to diffuse it, then picks `BATTLE_RNG_ACTIVE_LANE = RANDOM_NUMBER_LIST[lane0++] & 7`.

**Lane discipline:** `BATTLE_RNG_ACTIVE_LANE` (`0x1D2A230`) is written *only* by `Battle_SeedRNG` and read *only* by `Battle_GetRandomInt` — there is **no mid-battle lane switching**. After seeding, every draw advances one fixed lane, so a battle's randomness is effectively a single 256-entry ring with a seed-derived start offset.

**Seed source — correction:** the seed byte comes from `Battle_SeedRNG(rand())` where `rand` is the **statically-linked MSVC CRT LCG** at `0x55CBD2` (`holdrand = holdrand*214013 + 2531011; return (holdrand>>16) & 0x7FFF`, constants `0x343FD`/`0x269EC3`). The earlier "no CRT `rand()` in the binary" note was wrong (it is statically linked, hence not an *import*, and the constants are present). Consequently: **in-battle** replay needs only the 9 RNG-state bytes at `0x1D2A228..0x1D2A230`; **cross-run** reproduction of a given encounter also requires the CRT `holdrand` (thread state at `_getptd()+20`) at battle entry. See [[_staging/investigations/live_static_closure_2026-06-13]].

## Runner Mirror

`ff8re/battle_state.py` still provides a pragmatic live-debugger mirror of this state: slot address helpers, HP or status or ATB readers, pending-action helpers, phase-flag reads, and action-global reads. The newer queue and RNG findings make that mirror conceptually closer to the actual engine split between slot storage, queue storage, and battle-global auxiliaries.

## Conceptual Mirror

An external engine mirror can still aggregate these globals into a conceptual `BattleContext` containing:

- slots,
- scene metadata,
- action queues,
- timer banks,
- battle RNG state,
- phase flags,
- transient action fields.

That remains an abstraction over globals, not evidence for one original heap object.^[inferred]

The renderer bridge uses a narrower pointer-free projection of this context and separates raw capture, legacy draw packets, and semantic Wicked objects. See [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]].

## Open Questions

- ~~The meaning of queue group `1` versus `2` is still only partially named.~~ **Closed 2026-06-13**: group 2 = direct actions (Attack/Magic/Item/Draw/default), group 1 = cinematic/special families (GF, Selphie Slot, command-ability cluster), group 0 = engine-injected forced actions. See [[projects/re-ff8/concepts/command-action-pipeline]].
- Slot bytes `+0xB8/+0xB9` are confirmed transient IDs flushed during cleanup, but their exact domain meaning is still open.^[ambiguous]
- ~~One damage helper still mixes CRT `_rand()` with battle-local RNG~~ / ~~no CRT `rand()` exists in the binary~~ **Corrected 2026-06-14**: per-draw randomness is entirely battle-local lane RNG, but the CRT LCG `rand` (`0x55CBD2`) *does* exist and supplies the once-per-battle seed byte via `FFBattleDirector_battleLoop`. In-battle replay needs the 9 RNG-state bytes; cross-run needs CRT `holdrand` at battle entry.
- The live synchronization story between summon absorb state, `target_info_mask`, and per-GF HP persistence still needs runtime proof.^[ambiguous]

## Related

- [[projects/re-ff8/concepts/ff8re-hypothesis-runner]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/timed-status-expiry]]
- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
