# Encounter Trigger

## Three Entry Paths

### Field Random Encounters
`Field_Encounter_RollAndSelectScene` ticks an encounter meter (`word_1CDC740`). When the threshold is met, selects a scene ID from the field encounter table and sets `MenuState_opcode_menu_id`. Requests battle via `globalFieldNextModuleID=3`.

### Field Scripted Battles
`SCRIPT_BATTLE` pops a scene ID from the script's encounter list, sets `ENCOUTER_BATTLE_FLAG`, and requests battle transition.

### World Map Encounters
`FFWorldDirector` / `World_Encounter_CheckAndTrigger` evaluate position/vehicle/region flags. On encounter, writes `wanted_game_mode_byte_2036B4C` (mode), `wanted_game_mode_dword_2036B4E` (scene ID), `wanted_game_mode_2036B4F` (aux).

## Module Handoff

`FFModuleHandler_main_loop` (`0x4706B0`) reads the pending scene ID into `COMBAT_SCENE_ID` and launches the battle transition module.

## Scene Resolution

`FFBattleDirector_battleLoop` calls `ReadSceneOutFileForSpecificEncounter(COMBAT_SCENE_ID, &CURRENT_ENCOUNTER_DATA_SCENE_OUT)` which loads from the battle archive at offset `scene_id << 7`. Setup functions then initialize enemy slots from `CURRENT_ENCOUNTER_DATA_SCENE_OUT` (levels, AI/com values, visibility/targetable flags).

## ENCOUTER_BATTLE_FLAG

| Bit | Effect |
|-----|--------|
| `& 4` | Enables battle countdown |
| `& 2` (clear) | Plays battle music (suppressed if set) |
| `& 1` | Sets RELATED_CANT_ESCAPE |

Merged with `CURRENT_ENCOUNTER_DATA_SCENE_OUT.battle_flags` during init.
