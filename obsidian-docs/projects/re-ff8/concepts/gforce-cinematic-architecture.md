---
title: G-Force Cinematic Architecture
category: concepts
tags: [ff8, gforce, battle-system, concept]
aliases: [GF cinematic dispatch, summon architecture]
sources:
  - docs/tech/gforce/README.md
  - docs/tech/gforce/gf_shared_infra.md
  - docs/tech/reference/magic_effect_table.md
  - docs/tech/reference/kernel_tables.md
  - obsidian-docs/_staging/investigations/gf_charge_absorption.md
  - obsidian-docs/_staging/investigations/gf_chain_completion_and_support_assertions.md
  - obsidian-docs/_staging/investigations/2026-06-09_prompt20_bulk_kernel_gf_id_confirmation.md
  - IDB: Magic_GetIDLoad 0x50AF20
  - IDB: BattleActionSequence_Tick_GF_Cinematic 0x50B2A0
  - IDB: MagicList_TextureLoad 0xC81DB8
summary: GF summons route from command bytes through stable kernel GF indexing, parallel logic/loader tables, file loading into the shared magic arena, cinematic ticks, support-status payloads, and summon-charge teardown.
provenance:
  extracted: 0.86
  inferred: 0.09
  ambiguous: 0.05
created: 2026-06-02T16:37:00+02:00
updated: 2026-07-12T13:45:00+02:00
---

# G-Force Cinematic Architecture

GF invocation still crosses the normal battle command path, kernel metadata, presentation action sequences, and GF-specific callback chains. The staging batch mostly tightened three details: the kernel indexing contract, support or status GF semantics, and where summon-charge HP absorption actually happens.

## Invocation Path

1. Player confirms a GF command; `BattlePendingAction_Write` writes `command_id = 0x03` and a kernel GF ID in `command_arg`.
2. The action enters the exec queue through [[projects/re-ff8/concepts/command-action-pipeline]].
3. `BattleActionSequence_DispatchTick` routes GF command types to `Tick_GF_Cinematic`.
4. The sequence calls `Magic_GetIDLoad` (`BattleGF_LoadCallbackByMagicID`, `0x50AF20`) which **loads the GF's data files** via `MagicList_TextureLoad[effect_id-1]` *and* returns the entry callback from `MagicList_Logic[effect_id-1]`.
5. Active GF callback logic and optional boost work run through the cinematic state machine.
6. Cleanup can later feed back into ordinary [[projects/re-ff8/concepts/damage-status-pipeline]] or summon-exit behavior.

See [[projects/re-ff8/references/gf-asset-loading-and-authoring]] for the full file/loader/handler contract and a from-scratch authoring checklist.

## ID Layers

- `command_id = 0x03` means the player selected the GF command.
- junctionable `command_arg` values remain the contiguous range `0x40..0x4F`.
- the resolver uses `gf_index = command_arg - 0x40`.
- `K_GF_JUNCTIONABLE.magicID` provides the 1-based `effect_id`.
- `MagicList_Logic[effect_id - 1]` (`0xC81774`) provides the cinematic logic/entry callback.
- `MagicList_TextureLoad[effect_id - 1]` (`0xC81DB8`) is the **parallel** table holding the `*_FL` file loader for the same effect.

The table base, stride, and indexing rule are structurally firm. The English Steam `kernel.bin` has now also been extracted offline and hash-bound; see [[projects/re-ff8/references/kernel-bin-authenticated-tables]]. This authenticates the 16-row section without requiring a live memory dump.

## Asset Loading And Data Files

The cinematic plays **data**, not hard-coded animation. Each GF owns two files under `\FF8\Data\Magic\`:

- `mag<effect_id-1>_b.00` — model/geometry+texture container (multi-section header: `u32 count` + `count+1` offsets),
- `mag<effect_id-1>_b.01` — animation/scene stream the tick interprets.

(Note the file number is the **0-based** index: Alexander `effect_id 204` → `mag203_b.*`; Cerberus `203` → `mag202_b.*`.)

`Magic_GetIDLoad` resets the shared **1 MB magic arena** (`g_MagicFileArena` `0x20DFAB8`) then runs `MagicList_TextureLoad[idx]()`. Each `*_FL` calls `IO_GetFile_MAGIC` (`0x571B80`) → `davAoyLoadMagicDataPlusBuffer` (`0x571900`): try `Archive_GetFile` (VFS) first, fall back to `fopen(...,"rb")`, read into the arena, and stash the pointer. Only one effect's files are resident at a time. Full breakdown + authoring checklist: [[projects/re-ff8/references/gf-asset-loading-and-authoring]].

## Shared Infrastructure

- `g_GfActiveCallbackPtr` (`GF_CALLBACK_PTR`, `0x21DFEC4`) stores the active cinematic entry callback pointer.
- `BdLinkTask` (`0x508360`) / `BdLinkTask_CreateAndInitContext` register the per-frame GF tick; the dispatch polls it via `au_re_BdlinkTask_0`.
- shared `g_GfCinematic_*` globals (originally `gfIfrit_*`, but shared by every GF) hold the active sequence (`0x27973EC`), runtime slot (`0x27973B8`), render (`0x27973BC`), and scene/anim state (`0x27973C0`) context for the one active GF cinematic.
- the **entry contract** is: seed the shared `Magic_b_00/01` scratch from the loaded files → init the sequence context → `BdLinkTask(ctx, tick)` → return ctx. The **tick** returns `0` to keep going and `2` when done (driven by `g_GfCinematic_SequenceStatePtr+10` bit 15).

Several GF families now also link more cleanly into [[projects/re-ff8/concepts/battle-camera-architecture]] through dedicated stage-camera variants and effect-owned exit cameras. The cinematic itself raises the camera scripted-takeover bit `0x8000` (`dword_1D97704`) at state 1.

## Damage, Support, And Status GFs

- damage GFs have `gfPower > 0` and can deal HP damage plus negative statuses,
- support or status GFs can still traverse the same resolve path even when `gfPower == 0`,
- validation for support GFs should be anchored on durable status deltas, not enemy HP loss.

The broader hidden-compatibility thread is also better grounded now: magic and GF-family action metadata can carry 16-byte compatibility delta tables, and successful party execution applies those deltas back into the acting character's saved GF compatibility values. That behavior is still part of ordinary action resolution rather than a separate summon-only subsystem.

High-signal examples:

- Cerberus applies `Double` and `Triple` through the confirmed `0x00060000` payload,
- Carbuncle is a party-side `Reflect` support GF,
- Siren is best treated as a status-oriented enemy debuff path rather than a generic "negative status" bucket.

## Summon Charge Absorption

The static staging pass moved the likely absorption point later in the pipeline than older summaries implied. **Confirmed by decompile of `Battle_ApplyDamageOrHeal` (`0x494410`) on 2026-06-14:**

- damage is still computed normally first,
- the commit checks summon-charge state on the party slot (`< 3`): mid-summon (`status_2` high bit), an active `F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER`, a nonzero `target_info_mask`, and a non-"normal" hit,
- when those hold, damage is subtracted from **`target_info_mask`** (the live absorb pool) instead of `current_hp`,
- when the pool reaches 0, the summoned GF's `NumberOfKOs` increments (GF KO tracking).

**`target_info_mask` *is* the absorb pool.** Battle slots `8..10` are **not** used as the live absorb sink — confirmed, no longer open. See [[projects/re-ff8/references/battle-formulas]] (HP-commit) and [[projects/re-ff8/concepts/damage-status-pipeline]].

## Special GFs

- Odin, Gilgamesh, Phoenix, Angelo, Chocobo or Boko, and Griever still use non-junctionable or special action paths.
- Odin auto-triggers only at battle init when enemy immunity permits.
- Gilgamesh can trigger at battle init or once per battle during active frames.
- Phoenix triggers only on party wipe when the Phoenix flag is set and the battle is eligible.

## Progressive Renderer Migration

The renderer track preserves this native entry/tick/task contract first and identifies each invocation as an `EffectInstance`. P8 then promotes effects by explicit `effect_id`; unknown or partially decoded GF families remain on `LegacyFF8RenderPass` without changing damage/status resolution.

- Semantic effect model: [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
- Legacy replay: [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
- Family migration gates: [[projects/re-ff8/references/wicked-ff8-migration-phases]]

## Related

- [[projects/re-ff8/concepts/gforce-catalog-and-families]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/concepts/draw-magic-and-render-bridge]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
- [[projects/re-ff8/references/g11-g20-static-readiness-ledger]] — G18 gameplay-domain recognition (charge/Boost/absorb remain live-required)
