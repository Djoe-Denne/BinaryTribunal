# Test Plan: `battle_main_loop.md`

## Why

Confirm where the per-frame battle tick starts and how input/pending/exec/resolve connect.

## What to test

- Tick guard conditions: `mode_StateGlobal == 3`, `mode3_subsub_step == 3`, `mode_3_subsubsubstep == 4`
- Input-to-pending flow from UI confirm to `BattlePendingAction_Write`
- Pending-to-exec transfer and selection logic
- Resolve call path into damage apply

## How

1. Enter battle and step frame-by-frame at mode transitions.
2. Confirm command and break on pending write.
3. Continue through transfer, arbitration, and resolver entry.
4. Capture memory before/after each handoff.

## What to observe

- First command write occurs on target confirm, not command highlight.
- Pending record fields map correctly into exec queue lanes.
- Resolver receives expected attacker/command context.

## What to break on

- `main::FFBattleDirector_battleLoop` (`0x47CCB0`)
- `isBattle_HUDdisplay` (`0x4A8772`)
- `domain::BattlePendingAction_Write` (`0x484D20`)
- `domain::BattlePendingAction_TransferToExecQueue` (`0x4847F0`)
- `domain::BattleArbitration_SelectNextAction` (`0x485460`)
- `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`)

## What to do in game

- Let ATB fill, open command menu, select Attack, confirm target.
- Repeat with one auto-command scenario if available.
- Run one enemy turn naturally to compare queue behavior.

## In-game startup context

- Save right before random encounter trigger.
- Use a party with different speed values.
- Prepare watches for pending buffer, exec arrays, and mode/substep globals.
