---
title: Live-Corroborated Static Closure (RNG, Exec-Queue Groups, Targeting Slot-7, Status 0x180800)
summary: A debugger-attached IDA session closes four battle-loop follow-up hypotheses by static decompilation plus read-only live corroboration, resolving the CRT-rand mixing question, exec-queue group 1/2 semantics, the random-monster slot-7 gap, and the 0x180800 invulnerability family.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/completed/ai_investigation_live_rng_mixed_rand_callsite.md
  - ai-prompt/completed/ai_investigation_live_exec_queue_group_semantics.md
  - ai-prompt/completed/ai_investigation_live_targeting_slot7_and_mask_bits.md
  - ai-prompt/completed/ai_investigation_live_status_180800_writer_proof.md
  - obsidian-docs/_staging/investigations/targeting_system_2026-06-09.md
  - docs/tech/investigation/battle_state_reconstruction.md
  - docs/tech/reference/status_bits.md
  - docs/tech/systems/command_pipeline.md
  - IDA static analysis + read-only live debugger corroboration via the IDA MCP on 2026-06-13
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
---

# Live-Corroborated Static Closure (2026-06-13)

> [!note] Session context
> Unlike the 2026-06-09 static batch, a debugger **was** attached to a live FF8 process (paused active battle, three party slots vs two enemies). All conclusions below are static decompilation confirmed by read-only live memory reads; no execution was resumed and no memory was written.

This note closes four of the live battle-loop follow-up prompts. It directly resolves ambiguities that the earlier no-debugger session left open in [[projects/re-ff8/concepts/targeting-system]] and [[projects/re-ff8/concepts/battle-state-model]].

## 1. Battle RNG Is Battle-Local Only — No CRT `rand()` Mixing

The open question (`battle_state_reconstruction.md` RNG section and the battle-state-model "one damage helper still mixes CRT `_rand()`" caveat) is **refuted**.

- `Battle_GetRandomInt` (`0x48F020`) returns `RANDOM_NUMBER_LIST[BATTLE_RNG_LANE_INDEXES[BATTLE_RNG_ACTIVE_LANE]++]` — eight one-byte lane cursors over a static table.
- `Battle_SeedRNG` (`0x48F050`) seeds the eight lanes from a one-byte seed and selects the active lane (`& 7`). It has **exactly one caller**: `FFBattleDirector_battleLoop` (seeded once per battle).
- `isRandomProbaNumDen255` (`0x48F0F0`) and the 71 callsites across 42 functions (damage, crit, hit, targeting, mug/steal/draw, ATB init, enemy AI, GF specials, escape) **all** consume `Battle_GetRandomInt`.
- **No MS CRT `rand()` exists in the binary**: no `rand`/`srand` import, and a full-binary byte scan finds neither LCG constant `0x343FD` (214013) nor `0x269EC3` (2531011).

Globals (live-confirmed):

| Global | Address | Live value | Role |
| --- | --- | --- | --- |
| `RANDOM_NUMBER_LIST` | `0xB697F8` | `63 06 F0 23 …` (static FF8 table) | 256-byte fixed RNG table |
| `BATTLE_RNG_LANE_INDEXES[8]` | `0x1D2A228` | `[202,235,41,245,144,165,104,61]` | per-lane cursors |
| `BATTLE_RNG_ACTIVE_LANE` | `0x1D2A230` | `3` | active lane (`& 7`) |

**Deterministic replay requirement:** serialize the 9 bytes at `0x1D2A228..0x1D2A230` (8 lane cursors + active lane). `RANDOM_NUMBER_LIST` is static and needs no capture. There is no hidden CRT-rand state.

## 2. Exec-Queue Group 1 vs 2 Semantics

Group meaning closed via `BattlePendingAction_TransferToExecQueue` (`0x4847F0`) routing and `BattleArbitration_SelectNextAction` (`0x485460`).

- The queue is **3 groups x 11 doubly-linked cells**; each group has a 44-byte link array and a head byte. Group bases: g0 `&stru_1D28864`/head `0x1D28C00`, g1 `&stru_1D28890`/head `0x1D28C01`, g2 `&stru_1D288BC`/head `0x1D28C02`. Empty head sentinel is `0xFF` (live-confirmed: all three heads `0xFF` in the idle paused battle).
- Transfer routes by **`COMMAND_TYPE_ID`**:
  - **Group 2** (default / direct actions): Attack, Magic (`0x02`), Item (`0x04`), Draw (`0x0D`), and the `default` case.
  - **Group 1** (cinematic / special families): GF (`0xFE`), Selphie Slot (`0x10`), and the command-ability cluster (`0x05`, `0x0B`, `0x0E`, `0x0F`, `0x11`–`0x16`).
  - **Group 0** is **never filled by transfer**; it is reserved for engine-injected forced actions (counters, scripted events, status-expiry specials).
- Arbitration scans **groups 0 → 1 → 2** (ascending = deterministic priority). **Only groups 1 and 2** apply the attacker-incapacitation skip (`status_1 & 4` Petrify, `status_2 & 9` Sleep|Stop). **Group 0 is exempt** — its actions run even if the actor is incapacitated.
- `BattleExecQueue_AllocNode` (`0x482BD0`): free node = `prev_index==0 && next_index==0`; on saturation (>11 live cells in a group) it **falls back to node 0 and rewires it as head** (graceful overwrite). Saturation is not practically reachable in normal combat.

## 3. Targeting: Random-Monster Slot-7 Exclusion + Mask Bits

Resolves the slot-7 ambiguity flagged in `targeting_system_2026-06-09.md`.

- `BattleTarget_GetRandomMonsterMask` (`0x486E00`): `v1 = (Battle_GetRandomInt() & 3) + 3` → random enemy index in **{3,4,5,6} only**, rerolled while dead. **Slot 7 is excluded from random-monster selection.**
- `BattleTarget_GetRandomPartyMask` (`0x486DC0`): `Battle_GetRandomInt() % 3` → party slots **{0,1,2}**.
- This is not a contradiction with the all-enemy constant `0x80F8` (bits 3–7): **explicit/AoE masks include slot 7, random single-target reroll does not.** Two distinct mechanisms.
- `target_mask` decode in `BattleAction_ResolveTargetAndHitCount` (`0x48E830`): low 13 bits (`& 0x1FFF`) = slot mask; high 3 bits (`>>13 & 7`) = control: bit 13 (`0x2000`) random reroll (party if low ≤ 7, else monster), bit 14 (`0x4000`) selection-direction param, bit 15 (`0x8000`) `computeTargetChoosen` vs `computeTargetChoosen0`.
- **`0x02000000` is Angel Wing** (status_2 bit 25): part of the strict ineligibility mask `0x2004009` (Sleep | Stop | Confuse | Angel Wing) in `BattleTarget_IsEligibleByStatusMask` (`0x48EDA0`). An Angel-Wing unit is **untargetable** by the strict per-hit gate. The bit is written by `sub_49AE50`.
- **Cover** (`computeTargetChoosen1`, `0x48EB90`): redirect only for first resolved hit, enemy attacker, `COMMAND_TYPE_ID == COMMAND_MONSTER_ATTACK`, `0x8000` clear, `attackFlags & 3 == 0`; picks an eligible Cover ally; between two eligible covers it rolls `Battle_GetRandomInt() > 0x7F` (50/50).

## 4. Status 0x180800 Invulnerability Family

- `BattleStatus_CanApplyHitStatus` (`0x492AC0`) blocks status when `status_1 & 4` (Petrify) **or** `status_2 & 0x180800`, **unless** `HIT_STATUS_2 & 0x04000000` (bypass bit, cleared in `BattleStatus_ApplyHitStatus`).
- New, broader finding: `0x180800` is **also a damage gate**, tested in `ContainPhysicalDamageFormula`, `Damage_ComputeRawDeltaFromAttackType` (Attack, Percent-physical, Renzokuken-finisher cases), and `computeAttackPhysical`. So `0x180800` = **invulnerability blocking both damage and status**, not just status application as previously documented.
- A battle-domain immediate scan finds **no literal setter** for `0x800`, `0x80000`, `0x100000`, or the combined `0x180800` — they are applied via the generic mask-driven writer `DoesMentalStatusHit` (`0x48F9F0`), i.e. driven by kernel status-spell metadata (`HIT_STATUS_2`), not a hardcoded function.
- Per-bit narrowing:
  - `0x800` (bit 11): `DoesMentalStatusHit` refuses to apply it to slots `>= 3` → **party-only** status (consistent with Hero / Holy War party invincibility).^[inferred]
  - `0x80000` (bit 19): referenced as a read/gate in `setBattleSlotData` (init) and `ComputeMagicAndGFDamage` (damage gate).
  - `0x100000` (bit 20): **zero references** in the battle domain (read or write) → effectively inert, contributing only as part of the composite invulnerability test.

## Merge Guidance

1. `battle_state_reconstruction.md`: rewrite the RNG section — battle-local lane RNG only, no CRT `rand()`, replay = 9 RNG-state bytes.
2. `command_pipeline.md` / [[projects/re-ff8/concepts/command-action-pipeline]]: add the group-1 vs group-2 `COMMAND_TYPE_ID` routing and group-0 exemption.
3. [[projects/re-ff8/concepts/targeting-system]]: replace the slot-7 ambiguity with the confirmed `{3,4,5,6}` random range; keep `0x80F8` AoE distinction.
4. `status_bits.md`: name `0x02000000` = Angel Wing; refine `0x180800` as damage+status invulnerability with the `0x04000000` bypass; note `0x800` party-only and `0x100000` inert.

## Residual (Not Closed This Session)

- ~~elemental weak/resist/null/absorb HP matrix~~ **Closed 2026-06-13** via live debugger — see [[_staging/investigations/live_elemental_matrix_2026-06-13]].
- Escape / mode-5 reward comparison still needs live paired traces; its static core is understood but the runtime reward/commit matrix remains open.^[ambiguous]
