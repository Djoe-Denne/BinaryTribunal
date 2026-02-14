# Test Plan: `battle_encounter_trigger.md`

## Why

Validate field/world/script encounter trigger paths and scene ID handoff into battle module.

## What to test

- Field random encounter meter and scene selection path
- Scripted battle opcode (`SCRIPT_BATTLE`) path
- World encounter pending scene path (`wanted_game_mode_*`)
- Final module handoff into `COMBAT_SCENE_ID`

## How

1. Execute three cases: random field, scripted battle, world encounter.
2. Break at trigger selection functions and module dispatcher.
3. Record selected scene ID and transfer variables at each handoff.

## What to observe

- Each source path writes a scene ID into its expected intermediate variable.
- Dispatcher copies/combines into `COMBAT_SCENE_ID` before battle transition.
- `ENCOUTER_BATTLE_FLAG` differs as expected between scripted/random flows.

## What to break on

- `Field_Encounter_RollAndSelectScene`
- `SCRIPT_BATTLE`
- `FFWorldDirector`
- `World_Encounter_CheckAndTrigger`
- `World_SetPendingBattleScene`
- `main::FFModuleHandler_main_loop`

## What to do in game

- Walk to trigger random field encounter.
- Run one known scripted encounter.
- Trigger one world map encounter if current save allows.

## In-game startup context

- Prepare saves near field random and scripted trigger points.
- Keep a separate world map save for world path.
- Watch `MenuState_opcode_menu_id`, `wanted_game_mode_*`, `COMBAT_SCENE_ID`, `ENCOUTER_BATTLE_FLAG`.
