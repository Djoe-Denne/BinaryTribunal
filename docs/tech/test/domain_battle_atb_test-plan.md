# Test Plan: `domain_battle_atb.md`

## Why

Validate ATB increment, readiness transition, and status/flag gating behavior.

## What to test

- Increment formula dependence on `spd`, `max_atb`, `cur_atb`, status bits
- Readiness transition branches (auto-command vs UI enqueue)
- Eligibility gates (`flag_data`, `status_1`, `status_2`)
- UI mirror writes to `unk_1CFF180` for party slots

## How

1. Break every frame in `domain::BattleATB_TickAndReady`.
2. Track one party slot and one enemy slot over multiple ticks.
3. Change status conditions in-game (haste/slow/stop-like effects).
4. Compare ATB slope and readiness branch outcomes.

## What to observe

- ATB slope changes with speed and status-dependent base increment.
- Slots clamp to `max_atb` before ready transition.
- Ready branch calls either auto path or UI enqueue path as gated.
- UI mirror values track party slot ATB values.

## What to break on

- `domain::BattleATB_TickAndReady` (`0x4842B0`)
- `sub_483EB0` (`0x483EB0`)
- `presentation::BattleUI_EnqueueCommand` (`0x4AD620`)

## What to do in game

- Run baseline turns with no explicit status effects.
- Apply speed-affecting statuses and compare ATB growth.
- Force one case that auto-queues and one that opens command UI.

## In-game startup context

- Save before a low-risk encounter with enough fight duration.
- Bring at least one speed/status spell.
- Watch per-slot: `cur_atb`, `max_atb`, `spd`, `flag_data`, `status_1`, `status_2`.
