---
title: Targeting System Static Investigation
summary: Static IDA analysis confirms the FF8 battle targeting helper graph, target-mask control bits, eligibility predicates, and special caller fan-out, while live breakpoint validation remains blocked by the absence of an attached debugger.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_targeting_system.md
  - docs/tech/reference/pending_action.md
  - docs/tech/reference/battle_action_resolve.h
  - docs/tech/systems/damage_pipeline.md
  - obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md
  - obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md
  - obsidian-docs/projects/re-ff8/concepts/gforce-cinematic-architecture.md
  - obsidian-docs/projects/re-ff8/concepts/enemy-ai-vm.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.78
  inferred: 0.14
  ambiguous: 0.08
---

# Targeting System Static Investigation

> [!warning] Runtime blocker
> No live debugger was attached to the current IDA session (`debugger_on = false`), so the planned breakpoint captures at `0x484D20`, `0x4847F0`, `0x48EA93`, `0x4850FA`, and `0x48F350` could not be replayed in this session. This note records only static conclusions that are strong enough to merge, plus explicit runtime gaps that still need confirmation.

This staging note closes most of the structural targeting question for [[projects/re-ff8/concepts/command-action-pipeline]], [[projects/re-ff8/concepts/damage-status-pipeline]], and [[projects/re-ff8/references/battle-slot-and-command-layouts]]. The remaining gap is not the helper graph anymore; it is the lack of live traces for exact exec-queue bytes, random-target replay samples, and the unresolved enemy-side slot-7 discrepancy.^[ambiguous]

## Confirmed High-Level Shape

- `target_mask` is still the authoritative selector carried from pending actions into resolution. `BattlePendingAction_Write` either writes the caller-supplied mask directly or recomputes one from kernel `targetInfo` for special command families.
- `BattleAction_ResolveTargetAndHitCount` at `0x48E830` is the central fan-out stage. It:
  - splits the mask into low slot bits and high control bits,
  - optionally rerolls a random target by camp,
  - resolves one or more per-hit masks,
  - applies Cover-style redirection for the relevant monster-attack case,
  - calls `BattleAction_ResolveAndApplyDamage`,
  - then calls `Battle_UpdateDamage`.
- GF boost and Renzokuken finisher do not reinvent targeting; they bypass the generic per-hit builder only after target lists have already been materialized.
- `BATTLE_SLOT_DATA[slot].target_info_mask` at `+0x84` is **not** a core targeting selector. Its current xrefs land in `EnemyAI_VM_ExecuteScript`, `BattleAction_GetText`, `BattleAction_ResolveAndApplyStatusResult`, and `Battle_ApplyDamageOrHeal`, but not in the `BattleTarget_*` helper family nor in `BattleAction_ResolveTargetAndHitCount`.

## Target Mask Encoding

The low byte behaves like a slot mask, while the upper three bits select control paths inside `BattleAction_ResolveTargetAndHitCount`.

| Value | Confirmed behavior | Static basis |
| --- | --- | --- |
| low bits `0x00FF` | Slot bits enumerated into per-hit target slot IDs before damage application | `BattleAction_ResolveTargetAndHitCount` scans the resolved mask bit-by-bit and collects slot IDs |
| `0x2000` | Random-target control bit: rerolls a live party or enemy slot before eligibility filtering | `BattleTarget_ComputeMaskFromDefaultTarget` maps `targetInfo bit1 -> 0x2000`; `BattleAction_ResolveTargetAndHitCount` branches to `BattleTarget_GetRandomPartyMask` or `BattleTarget_GetRandomMonsterMask` when this bit is set |
| `0x4000` | Alternate eligibility path used by revive/dead-target style resolution^[inferred] | `BattleTarget_ComputeMaskFromDefaultTarget` maps `targetInfo bit0 -> 0x4000`; `0x4000 | 0x8007` is used by the Phoenix-like all-party special path; the alternate helper admits party slots without the normal alive check |
| `0x8000` | Group-mask path selector: keep a side/aoe mask and intersect it with eligibility instead of preserving a caller-selected single slot | All-side helpers return `0x8007`, `0x80F8`, or `0x80FF`; Duel and Renzokuken helpers keep the caller-supplied single-target mask whenever the computed result lacks `0x8000` |
| `0x8007` | All party targets | `BattleTarget_GetAllPartyMask()` returns `0x8007` |
| `0x80F8` | All enemy-side targets | `BattleTarget_GetAllEnemyMask()` returns `0x80F8` |
| `0x80FF` | Everyone / both sides | `BattleTarget_GetEveryoneMask()` returns `0x80FF` |

### Notes on Slot Range

- The helper constants reserve party bits `0..2` and enemy-side bits `3..7`.
- `BattleTarget_GetRandomMonsterMask()` currently decompiles to `((Battle_GetRandomInt() & 3) + 3)`, i.e. slots `3..6`, even though the all-enemy constant is `0x80F8` and therefore reserves bit `7` too. This mismatch needs a live trace or better typing before the slot-7 story is called final.^[ambiguous]
- If no living monster is found, `BattleTarget_GetRandomMonsterMask()` falls back to `0x0008` statically; this is likely a sentinel-first-enemy fallback and should not be over-documented without runtime confirmation.^[ambiguous]

## Helper Graph

### Default Target Info -> Target Mask

- `BattleTarget_ComputeMaskFromDefaultTarget` (`0x483860`) maps kernel `targetInfo` low control bits to the high mask bits:
  - `bit0 -> 0x4000`
  - `bit1 -> 0x2000`
- `BattleTarget_GetMaskFromInfoField` (`0x483880`) maps the side/shape bits:
  - single/random target -> `BattleTarget_GetRandomPartyMask()` or `BattleTarget_GetRandomMonsterMask()`
  - everyone -> `BattleTarget_GetEveryoneMask()`
  - all enemies -> `BattleTarget_GetAllEnemyMask()`
  - all party -> `BattleTarget_GetAllPartyMask()`

This means the kernel `targetInfo` byte is split structurally:

- low control bits feed the high mask flags,
- side/shape bits feed the low slot/group mask.

### AI Target Construction

- `BattleTarget_FindByCondition` (`0x483940`) is the main enemy-AI targeting builder for status/stat/gender/HP/element queries.
- `EnemyAI_GetTargetMaskFromMask` (`0x4838C0`) reuses the same target-info translation logic for AI-selected magic.
- `BattleAction_ResolveConfusionTarget` (`0x483E00`) also emits the same encoded mask format for confusion-driven auto-targeting.

The important merge-worthy conclusion is that **player commands, AI-generated commands, Duel/Renzokuken helpers, and GF helpers all converge on the same encoded `target_mask` contract**.

## Eligibility Predicates

There are at least two distinct eligibility layers.

### Issuability / coarse targetability

`BattleTarget_IsEligibleByStatus` (`0x4877B0`) rejects a slot when:

- `status_1 & 0x0005` is non-zero (`Death | Petrify`),
- or `status_2 & 0x00004009` is non-zero,
- or `flag_data bit14` is set.

This is the clearest static evidence that the target system depends on `status_1`, `status_2`, and `flag_data`, not on `target_info_mask`.

### Per-hit fan-out eligibility

`BattleTarget_IsEligibleByStatusMask` (`0x48EDA0`) uses a stricter mask gate:

- reject when `status_1 & 0x0025` is non-zero,
- reject when `status_2 & 0x02004009` is non-zero.

The extra `0x02000000` contribution inside `0x02004009` is still unnamed in the current IDB, so the final human-readable label for that bit remains open.^[ambiguous]

### Cover / redirection

`computeTargetChoosen1` (`0x48EB90`) adds a Cover-style redirect only for the narrow case:

- first resolved hit only,
- attacker is a monster,
- not on the `0x8000` group-mask branch,
- enemy attack flags do not opt out via `attackFlags & 3`.

When the target is a covered party member and the cover candidate passes the stricter status-mask gate, the resolved single-target mask is rewritten to the covering slot.

## Fan-Out Behavior

`BattleAction_ResolveTargetAndHitCount` is the decisive fan-out function:

1. Split `target_mask` into:
   - low slot bits (`mask & 0x1FFF`),
   - high control bits (`(mask >> 13) & 7`).
2. If `0x2000` is present, reroll a live mask on party or enemy side.
3. Use:
   - `computeTargetChoosen()` for `0x8000` group masks,
   - `computeTargetChoosen0()` for single-target / retarget-on-failure masks.
4. Pass each resolved mask through `computeTargetChoosen1()` for per-hit finalization and possible Cover redirection.
5. Expand each final mask to slot IDs and call:
   - `BattleAction_ResolveAndApplyDamage`
   - `Battle_UpdateDamage`

### Double / Triple

Double and Triple are not separate targeting systems; they are extra passes through the same fan-out core.

- `EnemyAI_PrepareTurnAction` decides how many magic launches are queued (`1`, `2`, or `3`) based on the attacker's Double/Triple state and queued spell slots.
- `BattleAction_ResolveTargetAndHitCount` aborts later passes when the attacker no longer satisfies the required state:
  - second cast requires Double or Triple,
  - third cast requires Triple,
  - `status_1 & 0x35` or `status_2 & STATUS2_CONFUSION_SLEEP_STOP` also aborts later iterations.

`sub_48EB40` recomputes a per-slot hit-count mirror after the per-hit masks are built, so later layers can see how many resolved hits are aimed at each slot.

## Caller Matrix

| Caller family | Mask origin | Resolution path | Notes |
| --- | --- | --- | --- |
| Player Attack / Magic / Item / Draw | UI-confirmed mask written by `BattlePendingAction_Write`; some specials recompute from kernel `targetInfo` | pending -> exec -> active-turn prep -> `BattleAction_ResolveTargetAndHitCount` | Normal menu path still reduces to the shared encoded mask |
| Enemy AI | `BattleTarget_FindByCondition`, `EnemyAI_GetTargetMaskFromMask`, or `BattleAction_ResolveConfusionTarget` | `EnemyAI_PrepareTurnAction` -> `BattleAction_ResolveTargetAndHitCount` | Same encoded mask contract as player actions |
| GF standard / boosted | Pending GF mask plus GF kernel target info; boosted path iterates precomputed target list | `BattleGF_ResolveAndStoreTargetDamage` / `BattleAction_ResolveAndApplyDamage` | Support GFs still flow through the same damage/status machinery described in [[projects/re-ff8/concepts/gforce-cinematic-architecture]] |
| Duel | `sub_48F220` computes a kernel-based override mask, but preserves the caller's single-target mask when the result has no `0x8000` | direct special path -> `BattleAction_ResolveTargetAndHitCount` | Confirms that `0x8000` is the “use computed group mask” discriminator |
| Renzokuken finisher | `relatedToRenzokukenFinisher` applies the same override rule as Duel | callback from `EnemyAI_PrepareTurnAction` -> `BattleAction_ResolveRenzokukenFinisherHits` | Finisher damage iterates a stored target list rather than rebuilding masks per hit |

## Non-Targeting Field Clarification

The long-standing slot field `BATTLE_SLOT_DATA[slot].target_info_mask` at `+0x84` should not be merged into the targeting write-up as if it were the live target selector.

Static xrefs currently place it in:

- `EnemyAI_VM_ExecuteScript`
- `BattleAction_GetText`
- `BattleAction_ResolveAndApplyStatusResult`
- `Battle_ApplyDamageOrHeal`

That matches the earlier battle-struct suspicion that the field is GF-shield / auxiliary action state rather than the command targeting mask itself.^[inferred]

## Merge Guidance

If this staging note is accepted, the highest-value merges are:

1. Add a dedicated target-mask flag table (`0x2000`, `0x4000`, `0x8000`, `0x8007`, `0x80F8`, `0x80FF`) to [[projects/re-ff8/references/battle-slot-and-command-layouts]].
2. Extend [[projects/re-ff8/concepts/command-action-pipeline]] with the sentence that player, AI, Duel, GF, and limit helpers all converge on one encoded `target_mask` contract.
3. Extend [[projects/re-ff8/concepts/damage-status-pipeline]] with the more precise `BattleAction_ResolveTargetAndHitCount` behavior: random reroll, eligibility intersection, Cover redirect, then per-hit apply/update.
4. Add a short correction to any page that still treats slot `+0x84 target_info_mask` as if it were the active targeting selector.

## Remaining Blockers

- No debugger attached to IDA in this session, so the planned runtime capture matrix could not be executed.
- The exact raw exec-queue bytes at `0x4847F0` still need a live breakpoint capture, even though the surrounding docs already establish the pending-to-exec copy at a conceptual level.
- Enemy-side slot `7` participation remains inconsistent between the all-enemy constant (`0x80F8`) and the current random-monster helper decompilation.^[ambiguous]
