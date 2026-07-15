---
title: Timed Status Expiry Static Investigation
summary: Static IDA analysis confirms the `timer[16]` status-timer map, initialization formula, decrement rules, and expiry branches for Doom, Gradual Petrify, Regen, and timed buffs, while exact live frame cadence and downstream Doom execution remain blocked by the absence of an attached debugger.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_timed_status_expiry.md
  - docs/tech/reference/address_catalog.md
  - docs/tech/reference/battle_slot_layout.md
  - docs/tech/systems/battle_loop.md
  - docs/tech/systems/battle_slot_data.md
  - obsidian-docs/projects/re-ff8/concepts/battle-state-model.md
  - obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - ff8re/status_effects.py
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.83
  inferred: 0.10
  ambiguous: 0.07
---

# Timed Status Expiry Static Investigation

> [!warning] Runtime blocker
> No live debugger was attached to the current IDA session (`ida_dbg.is_debugger_on() == False`, `process_state == 0`). This note therefore records only static conclusions that are strong enough to merge. Exact live decrement cadence in rendered frames, actual runtime `K_MISC.*_timer` byte values, and the downstream execution path of Doom special action `5` remain blocked in this session.

This staging note tightens the open timer story around [[projects/re-ff8/concepts/damage-status-pipeline]], [[projects/re-ff8/concepts/battle-state-model]], and [[projects/re-ff8/references/battle-slot-and-command-layouts]]. The key static closure is that the timed-status subsystem is not a generic 16-entry timer bag: it is a 14-entry `status_2` timer bank with one-to-one mapping to `K_MISC.<status>_timer` fields, seeded only when `DoesMentalStatusHit` applies a `status_2` bit.

## Confirmed Timer Map

`domain::StatusTimer_InitForBitFromKernelMisc` at `0x4832F0`, `domain::StatusTimer_DisableForBit` at `0x483340`, `domain::StatusTimer_IsDisabledForBit` at `0x483370`, and `domain::Status_TickAndExpire` at `0x483470` all clamp to `index < 14`. That makes the first fourteen `timer[]` entries the confirmed timed-status bank:

| `timer[]` index | `status_2` bit | `FF8KernelMisc` field | Status meaning |
| --- | --- | --- | --- |
| 0 | `0x00000001` | `sleep_timer` | Sleep |
| 1 | `0x00000002` | `haste_timer` | Haste |
| 2 | `0x00000004` | `slow_timer` | Slow |
| 3 | `0x00000008` | `stop_timer` | Stop |
| 4 | `0x00000010` | `regen_timer` | Regen |
| 5 | `0x00000020` | `protect_timer` | Protect |
| 6 | `0x00000040` | `shell_timer` | Shell |
| 7 | `0x00000080` | `reflect_timer` | Reflect |
| 8 | `0x00000100` | `aura_timer` | Aura |
| 9 | `0x00000200` | `curse_timer` | Curse |
| 10 | `0x00000400` | `doom_timer` | Doom |
| 11 | `0x00000800` | `invincible_timer` | Invincible |
| 12 | `0x00001000` | `petrifying_timer` | Gradual Petrify |
| 13 | `0x00002000` | `float_timer` | Float |

`timer[14]` and `timer[15]` exist in the slot layout but are outside the confirmed timed-status helpers, so they should not be merged into the status map without a separate xref sweep.^[ambiguous]

## Timer Storage And Sentinel Semantics

- Slot storage is still `BATTLE_SLOT_DATA[slot].timer[16]` at `slot + 0x54`.
- The timed-status routines treat each entry as a signed 16-bit counter.
- Disabled or absent timers use the sentinel `-1111` / `0xFBA9`.
- `BattleSlot_ClearAllSlots` and `BattleSlot_ManageDeathState` both fill the timer region with the sentinel pattern, so newly cleared or dead slots start with no active timed statuses.

The sentinel does more than mean "not counting down". `RelatedToStatus1And2` checks `StatusTimer_IsDisabledForBit` before clearing a `status_2` bit through the generic status-clear helper. When the corresponding timer slot is already disabled, the helper strips that bit from the clear mask instead of removing it. In practice, disabled timer slots act as persistence guards for direct-write statuses.

## Timer Initialization

The only confirmed timer-seeding xref is:

- `DoesMentalStatusHit` (`0x48FB33`) for successful `status_2` applications
  - writes `BATTLE_SLOT_DATA[target].status_2 |= mask`
  - then calls `domain::StatusTimer_InitForBitFromKernelMisc(target, mask)`

The initializer computes:

```text
timer[index] = 4 * (SG_BATTLE_SPEED_SETTING + 1) * K_MISC.<status>_timer
```

That formula is confirmed statically. The exact live byte values of `K_MISC.<status>_timer` were not verified in a running process during this session, so exact wall-clock durations remain open.^[ambiguous]

## What Starts Timed vs Permanent

The important structural result is that **timer-capable** does not mean **always timed**.

- `Battle_InitPartySlotStatusFromChar` writes Auto-Reflect, Auto-Protect, Auto-Shell, and Auto-Haste directly into `status_2` and never calls the timer initializer.
- `setMonsterInfoFromDatInfoSection` writes innate monster Float/FLY, Auto-Reflect, Auto-Protect, and Auto-Shell directly into `status_2` and never calls the timer initializer.
- Because `StatusTimer_InitForBitFromKernelMisc` has only one confirmed xref and it sits inside `DoesMentalStatusHit`, only statuses that land through the hit-status path are confirmed to receive active countdown values.

So the safe merge-worthy conclusion is:

- spell or status-hit application of Sleep/Haste/Slow/Stop/Regen/Protect/Shell/Reflect/Aura/Curse/Doom/Invincible/Gradual Petrify/Float seeds a timer,
- direct battle-init status writes do not,
- auto and innate statuses therefore begin as non-expiring statuses unless another later path explicitly seeds a timer for that same bit.

## Decrement Logic

`domain::Status_TickAndExpire` walks the slot array from `BATTLE_SLOT_DATA[0]` to `END_MONSTER_DATA_IN_BATTLE`, so the subsystem is slot-wide, not party-only.

Per visited slot:

1. Skip the slot entirely when `status_1 & (Death | Petrify)` is non-zero.
2. Scan the first 14 timer entries until a non-sentinel counter is found.
3. Compute decrement step:
   - normal: `2`
   - if Haste active: `3`
   - if Slow active: `1`
   - Slow overrides Haste when both bits are set.
4. Apply Sleep/Stop freezes:
   - Sleep lets only `timer[0]` keep moving.
   - Stop lets only `timer[3]` keep moving.
   - If both Sleep and Stop are set, the shared branch preserves only `timer[3]`; Sleep's own timer does not continue in that combined case.
5. If the counter is still positive, subtract the computed step.
6. If the counter reaches `<= 0`, mark the timer disabled and run the status-specific expiry branch.

## Cadence And Loop Placement

The call site is statically anchored at `main::FFBattleDirector_battleLoop + 0x341` (`0x47D7F1`), inside the active battle loop and after:

1. battle-end checks,
2. pending-to-exec transfer,
3. arbitration,
4. action resolve/update.

It is **not** called from `BattleATB_TickAndReady`, and it is **not** presentation-task-driven. The static call-site also shows several gate checks immediately before the call (`BATTLE_RESULT_CODE == 0`, `dword_1D27B00 == 0`, `byte TARGET_SLOT_ID+1 == 0`, plus one additional named flag), so this session can safely place it in the main active-loop path but cannot yet convert that into exact "every rendered frame" timing without live breakpoint samples.^[ambiguous]

## Expiry Branches

### Generic Timed Buff / Debuff Expiry

For the normal path, the routine:

1. writes the timer slot back to the sentinel,
2. clears the expired `status_2` bit from the authoritative slot field,
3. recomputes crisis level from current HP,
4. updates `status_1_copy` / `status_2_copy`,
5. runs the party or non-party post-clear helper,
6. enqueues a deferred status-copy update.

This generic path covers at least:

- Sleep
- Haste
- Slow
- Stop
- Aura
- Curse
- Invincible
- Float

These statuses clear silently in the timer routine; no dedicated expiry text was found in this branch for them.

### Regen

`timer[4]` / `regen_timer` is special even before expiry:

- while the timer is still positive,
- and while decrement is non-zero,
- the routine queues `Battle_EnqueueSpecialAction(slot, 6, 0)` whenever the remaining counter hits a `60`-unit boundary in the scaled timer domain.

So Regen is not just a timeout bit; it has a periodic side-effect path during countdown. Its final timeout still falls back to the generic clear path.

### Protect, Shell, Reflect

The timeout routine has dedicated text branches for the three timed barrier buffs:

- `Protect` (`timer[5]`) uses the text branch keyed by mask `0x20`
- `Shell` (`timer[6]`) uses the text branch keyed by mask `0x40`
- `Reflect` (`timer[7]`) uses the text branch keyed by mask `0x80`

All three then continue through the standard bit-clear and mirror-sync path.

### Doom

`timer[10]` / `doom_timer` is explicitly special-cased:

1. disable the timer slot,
2. queue `Battle_EnqueueSpecialAction(slot, 5, 0)`,
3. clear the authoritative Doom bit from `status_2`,
4. skip the generic copy/sync block in `Status_TickAndExpire`.

That is strong evidence that Doom's terminal effect is intentionally deferred to a separate special-action path rather than being inlined as `status_1 |= Death` inside the timer routine itself. The exact downstream HP/status effect of special action `5` still needs either a live trace or a deeper special-action dispatch pass.^[ambiguous]

### Gradual Petrify

`timer[12]` / `petrifying_timer` is the cleanest fully confirmed terminal transition:

1. the routine sets `status_1 |= Petrify`,
2. calls `domain::BattleStatus_ExpirePetrifyingToPetrify`,
3. then continues through the normal crisis/copy/sync pipeline.

So Gradual Petrify does not merely clear its own `status_2` bit. It performs an explicit `Petrifying -> Petrify` promotion before the standard post-expiry sync work.

## Confirmed Cross-Status Rules Relevant To Timers

- Doom application is blocked on Zombie targets inside `DoesMentalStatusHit`.
- If Zombie lands on a target that already has Doom active, `DoesMentalStatusHit` clears the Doom bit and disables its timer before applying Zombie.
- `BattleStatus_UpdateSlotStatusCopy` strips innate monster Zombie and innate monster Float from the copy fields, so `status_*_copy` is not a perfect mirror of authoritative monster status when those innate flags are involved.

These interactions matter because raw before/after snapshots of `status_2_copy` can otherwise make Doom/Float behavior look inconsistent.

## Party, Enemy, And GF Slot Scope

- The timer scan is over the whole `BATTLE_SLOT_DATA` span, not only party slots.
- Party slots take the explicit `BattleStatus_ApplyAndSyncSlot` branch after generic expiry.
- Slots `>= 3` use a separate non-party helper after copy update.

Because the slot split is `slot < 3` versus `slot >= 3`, the static implementation would treat enemies and GF-side slots through the same non-party expiry branch if those slots carried timed statuses. No live GF-slot timed-status case was available in this session, so GF runtime behavior should still be treated as structurally plausible rather than empirically replayed.^[ambiguous]

## Merge Guidance

If this staging note is accepted, the high-value merges are:

1. Extend [[projects/re-ff8/references/battle-slot-and-command-layouts]] with the full `timer[0..13]` map from Sleep through Float.
2. Extend [[projects/re-ff8/concepts/damage-status-pipeline]] with the sentence that timed `status_2` bits are seeded only by the hit-status path, not by direct auto/innate writes.
3. Add a short note to [[projects/re-ff8/concepts/battle-state-model]] that the timer bank uses `-1111` as the disabled sentinel and that only the first 14 entries are currently mapped by the status subsystem.

## Remaining Blockers

- No live debugger was attached, so the planned watchpoints on `slot + 0x54..0x73`, `status_1`, `status_2`, and mirror copies could not be executed.
- The exact downstream meaning of Doom special action `5` was not followed through the special-action dispatcher in this pass.
- Exact live timer durations in battle seconds remain open until either a running process or an external kernel extraction confirms the real `K_MISC.*_timer` byte values.
