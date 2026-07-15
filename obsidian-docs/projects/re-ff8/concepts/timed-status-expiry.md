---
title: Timed Status Expiry
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [status timer system, timed statuses]
sources:
  - obsidian-docs/_staging/investigations/timed_status_expiry_2026-06-09.md
  - docs/tech/systems/battle_slot_data.md
  - docs/tech/systems/battle_loop.md
summary: The first 14 `timer[]` entries form a timed `status_2` bank seeded by hit-status application and consumed by a dedicated expiry tick.
provenance:
  extracted: 0.82
  inferred: 0.10
  ambiguous: 0.08
created: 2026-06-09T19:00:00+02:00
updated: 2026-06-13T18:00:00+02:00
---

# Timed Status Expiry

The timer subsystem is not a generic bag of arbitrary counters. Current static evidence maps the first fourteen `BATTLE_SLOT_DATA[slot].timer[]` entries to timed `status_2` bits, with a shared seed formula, a shared countdown loop, and a few special expiry branches.

## Timer Map

The confirmed timed bank is:

| `timer[]` | Status |
| --- | --- |
| `0` | Sleep |
| `1` | Haste |
| `2` | Slow |
| `3` | Stop |
| `4` | Regen |
| `5` | Protect |
| `6` | Shell |
| `7` | Reflect |
| `8` | Aura |
| `9` | Curse-like crisis suppressor ^[inferred] |
| `10` | Doom |
| `11` | Invincible-family timer |
| `12` | Gradual Petrify |
| `13` | Float |

`timer[14]` and `timer[15]` exist in the slot layout but are still outside the confirmed timed-status helper family.^[ambiguous]

## Storage And Seeding

- Slot storage is `BATTLE_SLOT_DATA[slot].timer[16]` at `+0x54`.
- Disabled timers use the sentinel `-1111`.
- The only confirmed seeding path is successful `status_2` application through `DoesMentalStatusHit`.
- The seed formula is:

```text
timer[index] = 4 * (SG_BATTLE_SPEED_SETTING + 1) * K_MISC.<status>_timer
```

This leads to the most important merge-safe rule: timer-capable status bits only become timed when they land through the hit-status path. Direct auto or innate status writes do not automatically seed countdown values.

## Tick Logic

The active-loop timer tick:

1. skips dead or petrified slots,
2. scans the first 14 timer entries,
3. subtracts `2` normally, `3` under Haste, or `1` under Slow,
4. freezes most timers under Sleep or Stop,
5. disables the timer once it reaches `<= 0`,
6. runs the status-specific expiry branch.

The subsystem is slot-wide rather than party-only, so the structure applies to enemies and GF-related slots too, even though the live GF-side cases remain unverified.^[ambiguous]

## Special Expiry Cases

- Regen triggers periodic special-action work while the timer is still running: timer index `4` (`status_2 & 0x10`) calls `Battle_EnqueueSpecialAction(slot, 6, 0)` on its cadence, i.e. **special action 6 = the Regen periodic tick**.
- Protect, Shell, and Reflect use dedicated text branches at timeout, then fall back to normal bit clear and sync.
- Doom queues a dedicated special action instead of inlining the terminal effect in the timer routine itself (see [Doom Enqueue Chain](#doom-enqueue-chain)).
- Gradual Petrify explicitly promotes `Petrifying -> Petrify` before the normal mirror-sync path.

## Doom Enqueue Chain

Doom is timer index `10` (`status_2 & 0x400`). At expiry, `Status_TickAndExpire` (`0x483470`) takes the `v5 & 0x400` branch (callsite `0x4836E7`):

1. `Battle_EnqueueSpecialAction(slot, 5, 0)` — enqueues **special action type 5** as a node in the **group-0 forced exec queue** (`stru_1D28864`): node `+0` = slot, `+1` = `0xFF`, `+4` (word) = `5`.
2. `status_2 &= ~0x400` — clears the Doom bit. Unlike the generic expiry branch, Doom prints no text and does not recompute crisis/death inline; it purely fires the death action.

The node then resolves through the standard forced-action path:

```text
Battle_EnqueueSpecialAction (0x484720)
  -> BattleArbitration_SelectNextAction (0x485460)   // group-0 is exempt from the attacker-incapacitation skip
    -> EnemyAI_PrepareTurnAction (0x485610) / BattleAction_GetText
    -> BattleExecQueue_ConsumeCurrentSlot (0x4845A0)
    -> BattleAction_ResolveSpecialActionAndUpdateDamage (0x485160)
       -> BattleAction_ResolveAndApplyDamage -> Battle_UpdateDamage
          -> Battle_ApplyDamageOrHeal (0x494410)
```

Because the Doom node lives in group 0, a doomed unit that is asleep or stopped still resolves the death action (group 0 bypasses the Petrify/Sleep/Stop skip applied to groups 1 and 2).

## Related

- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]

## Runtime-Pending

- Confirm exact live timer durations from real `K_MISC` values rather than static formula shape alone.
- Doom special action `5` enqueue→resolve chain is now static (see [Doom Enqueue Chain](#doom-enqueue-chain)); the only residual is the **byte-level terminal command** produced by `BattleAction_GetText` for type 5 — whether it sets the Death status bit directly or applies lethal HP through `Battle_ApplyDamageOrHeal`. Needs one live Doom-expiry trace.^[ambiguous]
- Confirm live cadence in rendered frames rather than only call-site placement inside the active loop.^[ambiguous]
