# Test Plan: `loop_catalog.md`

## Why

Validate module loop identities and transition correctness between major game modes.

## What to test

- Dispatch from `main::FFModuleHandler_main_loop` into module-specific loops
- Entry conditions for field/world/battle/menu/cardgame loops
- Classification behavior for `unknown_main_loop_sub_4A2690`

## How

1. Transition across modules (field -> battle -> menu -> world when possible).
2. Break on each listed main loop function.
3. Record caller context and selector values.
4. For unknown loop, capture state variables and downstream calls.

## What to observe

- Only one module loop is active per frame in dispatcher context.
- Transitions occur with expected mode IDs and handoff variables.
- Unknown loop shows stable role clues from callers and side effects.

## What to break on

- `main::FFModuleHandler_main_loop` (`0x4706B0`)
- `main::FFFieldModule_field_main_loop` (`0x46FEE0`)
- `main::FFWorldModule_worldmap_main_loop` (`0x53F0F0`)
- `main::FFBattleDirector_battleLoop` (`0x47CCB0`)
- `main::battle_cardgame_main_loop` (`0x47CF60`)
- `main::menu_or_tuto_main_loop_1` (`0x4A22C0`)
- `main::unknown_main_loop_sub_4A2690` (`0x4A2690`)

## What to do in game

- Walk in field, trigger battle, exit battle, open/close menu.
- If available, enter card game and world map to hit additional loops.

## In-game startup context

- Use a save with easy access to field, menu, and encounter area.
- Keep breakpoint set list persistent across transitions.
- Log mode/global selector values on each loop entry.
