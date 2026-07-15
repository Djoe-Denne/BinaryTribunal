---
title: Status Bits And Interactions Static Investigation
summary: Static IDA analysis resolves the core status-bit decoder, the Angel Wing/Confuse/Berserk auto-command split, the per-status hit formula, and several exclusion masks, while live timer/write validation remains blocked because no debugger was attached.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_status_bits_and_interactions.md
  - docs/product/battle.md
  - docs/tech/reference/status_bits.md
  - docs/tech/systems/status_pipeline.md
  - docs/tech/systems/battle_slot_data.md
  - docs/tech/systems/atb_system.md
  - docs/tech/systems/command_menu.md
  - docs/tech/systems/enemy_ai_vm.md
  - obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.78
  inferred: 0.14
  ambiguous: 0.08
---

# Status Bits And Interactions Static Investigation

> [!warning] Runtime blocker
> The current IDA session had no live debugger attached (`debugger_on = false`, `process_state = 0`), so this note cannot claim timer initialization, resisted-vs-landed memory deltas, or slot-reset side effects from live traces. It records only static conclusions strong enough to merge plus the exact gaps that still need runtime confirmation.

This note is meant to tighten [[projects/re-ff8/concepts/damage-status-pipeline]], [[projects/re-ff8/concepts/atb-and-command-menu]], and [[projects/re-ff8/references/battle-slot-and-command-layouts]] without editing those shared pages directly.

## Highest-Confidence Decoder

`checkTargetHasStatus` at `0x48A900` is the cleanest static anchor for the status-bit layout:

- when `status_ai < 0x10`, the AI VM checks `status_1 & (1 << status_ai)`;
- when `status_ai >= 0x10`, it checks `status_2 & (1 << (status_ai - 0x10))`.

That makes the AI status-code table in [[projects/re-ff8/concepts/enemy-ai-vm]] a reliable decoder for every status code whose name is already known.

## Confirmed Bit Table

### `status_1` (`+0x80`, `u16`)

| Mask | Status | Static basis |
| --- | --- | --- |
| `0x0001` | Death / KO | AI code `0x00`; also set by KO handling in `Battle_ApplyDamageOrHeal` |
| `0x0002` | Poison | AI code `0x01` |
| `0x0004` | Petrify | AI code `0x02`; also used by targetability and status-apply gates |
| `0x0008` | Blind / Darkness | AI code `0x03` |
| `0x0010` | Silence | AI code `0x04` |
| `0x0020` | Berserk | AI code `0x05`; also drives `Battle_ProcessAutoCommand` |
| `0x0040` | Zombie | AI code `0x06`; also set from monster innate flags |

### `status_2` (`+0x08`, `u32`)

| Mask | Status | Static basis |
| --- | --- | --- |
| `0x00000001` | Sleep | AI code `0x10`; ATB and eligibility gates |
| `0x00000002` | Haste | AI code `0x11`; ATB base becomes `15` |
| `0x00000004` | Slow | AI code `0x12`; ATB base becomes `5` |
| `0x00000008` | Stop | AI code `0x13`; ATB and eligibility gates |
| `0x00000020` | Protect | AI code `0x15`; auto-status init and monster innate init |
| `0x00000040` | Shell | AI code `0x16`; auto-status init and monster innate init |
| `0x00000080` | Reflect | AI code `0x17`; auto-status init and monster innate init |
| `0x00000100` | Aura | AI code `0x18` |
| `0x00000200` | Crisis/limit suppressor, likely Curse | `BattleLimit_ComputeCrisisAndToggleAttackSlot` hard-zeroes crisis when this bit is set, and the generic status reconciler pairs it with Aura via `0x300`.^[inferred] |
| `0x00000400` | Regen | `DoesMentalStatusHit` clears this bit before applying Zombie, matching the expected Zombie-vs-Regen exclusion.^[inferred] |
| `0x00000800` | Invulnerability-family bit | Part of `0x180800`; blocks generic status application, but human-readable label still open.^[ambiguous] |
| `0x00002000` | Float | AI code `0x1D`; monster `FLY` init sets the second-byte bit `0x20` |
| `0x00004000` | Confuse | AI code `0x1E`; targetability and auto-command logic both treat it as a control status |
| `0x00010000` | Eject | `BattleStatus_ApplyAndSyncSlot` consumes it as a reset trigger, then clears the stored bit |
| `0x00020000` | Double | AI code `0x21`; Cerberus applies it as part of `0x00060000` |
| `0x00040000` | Triple | AI code `0x22`; Cerberus applies it as part of `0x00060000` |
| `0x00080000` | Invulnerability-family bit | Part of `0x180800`; label still open.^[ambiguous] |
| `0x00100000` | Invulnerability-family bit | Part of `0x180800`; label still open.^[ambiguous] |
| `0x02000000` | Angel Wing | Auto-command path selects random stocked enemy-target magic; outgoing magic damage is multiplied by `5` while set |
| `0x40000000` | HAS_MAGIC | Party slot init / stock handling |
| `0x80000000` | GF Summoning | Summon-handling branches in `BattleStatus_ApplyAndSyncSlot` |

## Composite Masks And Exclusions

These masks are now much less mysterious than the current short docs suggest:

- `status_1 & 0x25` = `Death | Petrify | Berserk`.
- `status_2 & 0x4001` = `Sleep | Confuse`.
  - `Damage_ComputeRawDeltaFromAttackType` calls `RelatedToStatus1And2(target, 0, 0x4001)` on physical-type paths, so direct physical damage clears the `Sleep | Confuse` pair and disables the matching timers.
- `status_2 & 0x4009` = `Sleep | Stop | Confuse`.
- `status_2 & 0x2004000` = `Confuse | Angel Wing`.
  - This is the exact auto-command mask tested by the ATB code.
- `status_2 & 0x2004009` = `Sleep | Stop | Confuse | Angel Wing`.
  - This is the stricter ineligibility mask used by `BattleTarget_IsEligibleByStatusMask`.
- `status_2 & 0xE` is a post-apply reconciliation group for `Haste | Slow | Stop`.
  - The generic status paths do not leave old bits accumulated inside this group; they collapse the result to the newly toggled member(s).
- `status_2 & 0x300` is another post-apply reconciliation group.
  - The strongest current read is `Aura | Curse-like suppressor`, because `0x100` is Aura and `0x200` hard-disables crisis/limit output.^[inferred]
- `status_2 & 0x180800` blocks generic status application and several physical-like damage paths.
  - The bit names are still open, but this behaves like an invulnerability / Hero / Holy War family rather than a normal mental status bucket.^[ambiguous]

## Important Correction To Existing Short Docs

The current lightweight status docs overstate the role of `checkDoubleStatusApply`.

- `checkDoubleStatusApply` is **not** the generic `BattleStatus_ApplyHitStatus` path.
- The normal apply flow is:
  1. `BattleStatus_ApplyHitStatus` or `_NoDrain`
  2. per-bit `DoesMentalStatusHit`
  3. post-pass reconciliation of special status groups (`0xE`, `0x300`)
- `checkDoubleStatusApply` is still real, but the static xrefs in this session only place it in the special Devour/Card-style branch inside `BattleAction_ResolveAndApplyDamage`.

That correction should eventually flow into [[projects/re-ff8/concepts/damage-status-pipeline]] and the short `docs/tech/systems/status_pipeline.md` summary.

## Per-Status Hit Formula

`DoesMentalStatusHit` is the authoritative static formula for ordinary status landing:

```text
if target already has the requested bit:
    fail

if HIT_ATTACK_ENABLER != 0xFF:
    if mental_res[index] >= 200:
        fail

    attack_stat  = attacker.str or attacker.mag
    defense_stat = target.vit or target.spr

    if target.status_2 & VIT_0_STATUS_MASK:
        defense_stat = 0

    chance = HIT_ATTACK_ENABLER
           + attack_stat / 4
           - defense_stat / 4
           - mental_res[index]

    if chance <= 0:
        fail

    if HIT_ATTACK_ENABLER < 250:
        if Battle_GetRandomInt() > floor(255 * chance / 100):
            fail

apply hard exclusions / opposing-status cleanup
set the bit
```

High-signal implications:

- `mental_res[index] >= 200` is a hard static immunity for the ordinary formula.
- `HIT_ATTACK_ENABLER == 0xFF` skips the random/resistance branch entirely, but it still respects existing-bit checks and special hard exclusions.
- `status_1` uses indices `0..6`; `status_2` uses indices `8..39`.
- `setMonsterInfoFromDatInfoSection` populates the monster resistance table as a sparse mapping over those byte indices, which matches the status-code decoder rather than a separate hidden layout.

## Hard Exclusions And Side Effects

### Direct hard exclusions inside `DoesMentalStatusHit`

- Death cannot land on a Zombie target unless the special `unk_1D28E29` bypass is set.
- Zombie application clears the `0x400` status first, which is why `0x400` is the strongest current Regen candidate.^[inferred]
- Angel Wing (`0x02000000`) blocks incoming `Silence`, `Berserk`, and `Confuse`.
- Float application is refused for enemy slots whose monster info already marks them as `FLY`.
- Zombie application is ignored for monsters with innate Zombie.

### Auto-command split

When a slot reaches full ATB, `BattleATB_TickAndReady` routes to `Battle_ProcessAutoCommand` if either:

- `status_1 & 0x20` (`Berserk`), or
- `status_2 & 0x2004000` (`Confuse | Angel Wing`).

`EnemyAI_PrepareTurnAction` then splits the cases:

- `Angel Wing`: `BattleLimitAngelWing_SelectAutoCast` picks a random stocked enemy-target spell; if none qualify, it falls back to normal Attack.
- `Berserk`: forced Attack path with random target selection.
  - If `Confuse` is also set, the branch flips to a random party target instead of a random monster target.
- `Confuse` without `Berserk`: uses the dedicated retarget path around `BattleTarget_FindByCondition` and `EnemyAI_OverrideTargetForBerserk`.

### Commit / sync side effects

`BattleStatus_ApplyAndSyncSlot` has several non-obvious side effects worth merging:

- Petrify or `Sleep | Stop` can clear ready-state flags and force the slot out of its current ready/menu state.
- Transitions of `Berserk` or `Confuse | Angel Wing` also clear ready-state flags for non-executing slots.
- `Eject` is consumed as a reset trigger:
  - authoritative `status_2` has the Eject bit cleared after detection,
  - ATB is zeroed,
  - visibility masks are rebuilt,
  - death/eject cleanup helpers run.
- `Death` clears ATB and the slot exec queue.
- GF summon state is cleared when the target loses the required summon context or receives a blocking state from the relevant branch.

`BattleStatus_UpdateSlotStatusCopy` then mirrors authoritative state into `status_1_copy` / `status_2_copy`, but strips innate monster Zombie and Float from the copies so presentation state only reflects transient battle-applied status.

## What Is Still Open

These points should **not** be merged as final truth yet:

- the exact labels and writers for the three `0x180800` bits (`0x00000800`, `0x00080000`, `0x00100000`); the invulnerability-family reading is plausible but not yet closed.^[ambiguous]
- direct writer proof for `0x00000200` as Curse and `0x00000400` as Regen; both readings are strong, but still rely on interaction evidence rather than a clean named setter.^[inferred]
- the exact meaning of the special `HIT_STATUS_2` bypass bit `0x04000000`, which suppresses the ordinary petrify/invulnerability gate in physical-like damage paths.^[ambiguous]
- timer initialization and expiry details at `slot + 0x54`, which require live traces to distinguish status-set, timer-disable, timer-clear, and presentation-only writes.

## Merge-Ready Deltas

If the parent wants to merge this note into the shared wiki, the highest-value edits are:

1. Extend [[projects/re-ff8/references/battle-slot-and-command-layouts]] with:
   - the AI-code decoder rule,
   - `Aura`, `Confuse`, `Float`, `Double`, `Triple`, `Angel Wing`,
   - decoded composite masks `0x4001`, `0x4009`, `0x2004000`, `0x2004009`.
2. Extend [[projects/re-ff8/concepts/damage-status-pipeline]] with:
   - the real `DoesMentalStatusHit` formula,
   - the `mental_res >= 200` hard immunity,
   - the correction that the main apply path is not `checkDoubleStatusApply`.
3. Extend [[projects/re-ff8/concepts/atb-and-command-menu]] with:
   - `Confuse | Angel Wing` as the decoded `status_2 & 0x2004000` auto-command mask,
   - the Angel Wing random-auto-cast branch.
