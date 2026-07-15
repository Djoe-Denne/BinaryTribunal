---
title: ATB And Command Menu
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [ATB system, command menu]
sources:
  - docs/tech/systems/atb_system.md
  - docs/tech/systems/command_menu.md
  - docs/tech/systems/battle_init.md
  - docs/product/battle.md
  - obsidian-docs/_staging/investigations/atb_auto_command_masks.md
  - obsidian-docs/_staging/investigations/status_bits_and_interactions.md
  - obsidian-docs/_staging/investigations/limit_breaks.md
  - obsidian-docs/_staging/investigations/escape_mechanics.md
  - IDA static decompile 2026-06-14 (BattleATB_TickAndReady 0x4842B0, BattleUI_HudInputAndATBTick 0x4A84E0)
summary: ATB advances from speed and timed status, then splits into menu-ready or control-driven auto-command paths owned by the HUD task layer.
provenance:
  extracted: 0.87
  inferred: 0.09
  ambiguous: 0.04
created: 2026-06-02T16:37:00+02:00
updated: 2026-06-14T12:30:00+02:00
---

# ATB And Command Menu

ATB is ticked from the HUD task layer rather than from an isolated "domain-only" loop block. The same path decides whether a slot becomes menu-ready or enters a control-state auto-command branch.

## Tick Cadence & Iteration (2026-06-14)

`BattleATB_TickAndReady` (`0x4842B0`) is called once per HUD frame from `BattleUI_HudInputAndATBTick` (`0x4A84E0`) **only when `!pre_isBattle_DirectorReady()`** — and `pre_isBattle_DirectorReady` (`0x47D8E0`) simply returns `IS_BATTLE_PAUSED`. So **ATB advances exactly one tick per unpaused frame; it freezes while the battle is paused** (menu-open pause, cinematic/action resolution). This is the cross-actor pacing mechanism: while one actor's action sequence runs (the director is "ready"/busy and the battle is paused), nobody's ATB moves.

Inside the tick (after a further gate `AI_BATTLE_ACTIVE_FLAG && sub_4A9450() && !dword_1D27B00`), two passes run:

1. **GF summon-charge timers** decrement first — per slot, unless `flag_data & 0x400`, by `2` (normal) / `3` (Haste) / `1` (Slow), clamped at 0 (the charge pool used by the absorb logic).
2. **Per-slot ATB**, iterated in **ascending slot order `0 → N`** (`cur_atb` pointer walks the slot stride to the `dword_1D280D4` end pointer), applying the increment + readiness routing below; party slots also mirror `cur_atb`/`max_atb` into `BATTLE_ATB_UI_MIRROR`.

Finally, when `CAN_BATTLE_BE_PAUSED`, the same tick polls escape via `BattleEscape_PollInputAndRollChance` — so the flee roll shares the ATB cadence (see [[projects/re-ff8/concepts/escape-mechanics]]). The HUD callback also carries the escape-hold latch, incrementing `BATTLE_ESCAPE_HOLD_FRAMES` only while the director is not ready.

## ATB Tick

Per processed slot:

```c
base = 10
base = 15 if status_2 & 0x2  // Haste
base = 5  if status_2 & 0x4  // Slow
cur_atb += base * K_MISC.atb_speed_multiplier * (spd + 30) / 100
```

The authoritative `spd` byte lives at `BATTLE_SLOT_DATA[slot] + 0xC1`.

## Eligibility Gates

ATB processing requires:

- an active slot,
- no Death or Petrify,
- no `Sleep | Stop`,
- no existing ready flag in `flag_data & 0x0C`.

## Exact Readiness Split

When `cur_atb >= max_atb`, FF8 clamps ATB to max and then takes one of two routes:

- `status_1 & 0x0020` (`Berserk`) or `status_2 & 0x02004000` (`Confuse | Angel Wing`) -> `Battle_ProcessAutoCommand(slot)` and `flag_data |= 0x04`
- otherwise -> `BattleUI_EnqueueCommand(slot, 17, 128, 0)` and `flag_data |= 0x08`

So the exact auto-command status split is no longer vague:

- `0x04` in `flag_data` means auto-ready
- `0x08` in `flag_data` means menu-ready
- `0x02004000` is specifically `Confuse | Angel Wing`

`BattleStatus_ApplyAndSyncSlot` also clears stale ready bits when Berserk or `Confuse | Angel Wing` toggles on a non-executing slot, preventing an old ready/menu state from surviving a control-status change.

## Initialization Overrides

Exact formulas (decompiled 2026-06-14):

- `Battle_InitATB_MaxAndReset` (`0x484490`): `max_atb = 4000 * (SG_BATTLE_SPEED_SETTING + 1)`, `cur_atb = 0`.
- `Battle_InitATB_RandomFromSpeed` (`0x4844D0`): `cur_atb = max_atb / 100 * (spd/4 + (rand & 0x7F) + 1 - 35)`, clamped to `[0, max_atb]` — i.e. `max_atb * (spd/4 + rand[0..127] - 34) / 100`. One battle-RNG draw per slot.
- `Battle_SetATBForPreemptiveGroup` (`0x48B160`), by `mode`:
  - `0` — **party full**: each party slot `cur_atb = max_atb` unless `status_1 & 5` (Death|Petrify → 0).
  - `1` — **party zero**: each party slot `cur_atb = 0` *unless* it has the Initiative-type ability bit (`CHARA_ABILITIES & CHARA_ABILITY_AUTO_POTION` in the IDB naming).^[inferred]
  - `2` — **enemies full**: each enemy slot `cur_atb = max_atb` unless `status_1 & 5`.
  - `3` — **enemies zero**: all enemy slots `cur_atb = 0`.
- Composition: preemptive = party `0` + enemies `3`; back attack = enemies `2` + party `1`; Initiative grants party full.

## Command Menu Role

The command menu rebuilds available commands, handles [[projects/re-ff8/concepts/limit-break-architecture]] crisis availability, opens subcommands, and sends confirmed target actions into [[projects/re-ff8/concepts/command-action-pipeline]].

The important split is:

- ordinary player action choice becomes menu-ready and later queues a pending action,
- Berserk, Confuse, and Angel Wing become auto-ready and synthesize the action later from control-state logic.

Angel Wing is special because it shares the ATB auto-ready gate with Confuse, but later rewrites the turn into random stocked enemy-target Magic or fallback Attack instead of using the ordinary confusion retarget rules.

## Escape Input

Escape lives beside the HUD and ATB path, not inside the normal command queue. The battle UI maintains a held-input latch and hold-frame counter that feed the flee roll system documented in [[projects/re-ff8/concepts/escape-mechanics]].

## Related

- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/limit-break-architecture]]
- [[projects/re-ff8/concepts/escape-mechanics]]
