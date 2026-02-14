# Test Plan: `battle_scene_resolve.md`

## Why

Confirm `COMBAT_SCENE_ID` resolution into `CURRENT_ENCOUNTER_DATA_SCENE_OUT` and enemy slot initialization.

## What to test

- Scene load call and archive offset computation (`scene_id << 7`)
- Population of `CURRENT_ENCOUNTER_DATA_SCENE_OUT`
- Enemy slot seeding from `enemy_levels`, `enemy_com_value`, and enemy masks
- `battle_flags` merge behavior into `ENCOUTER_BATTLE_FLAG`

## How

1. Trigger battles with different scene IDs.
2. Break on scene read and enemy slot init functions.
3. Compare loaded data against initialized runtime slot fields.
4. Verify flag merge branch behavior.

## What to observe

- Loaded scene struct changes with scene ID.
- Enemy slots reflect scene-provided levels/com values and masks.
- Encounter flags are merged according to documented branch logic.

## What to break on

- `main::FFBattleDirector_battleLoop` (`0x47CCB0`)
- `ReadSceneOutFileForSpecificEncounter`
- `Archive_IO_LoadFile`
- `SceneOut_InitEnemySlot`

## What to do in game

- Trigger two different encounter formations and compare setup.
- Include one battle with known special flags if available.

## In-game startup context

- Use saves near two deterministic encounter sources.
- Watch `COMBAT_SCENE_ID`, `CURRENT_ENCOUNTER_DATA_SCENE_OUT`, `ENCOUTER_BATTLE_FLAG`, and monster slot init fields.
