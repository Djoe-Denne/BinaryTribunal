## Evidence
- `FFModuleHandler_main_loop` sets `COMBAT_SCENE_ID` and switches to the battle transition module when a battle is requested (field/script or world map).
- `Field_Encounter_RollAndSelectScene` increments the field encounter meter and selects a scene ID from the field encounter table, then sets `MenuState_opcode_menu_id` and `globalFieldNextModuleID=3`.
- `SCRIPT_BATTLE` (field script opcode) pops a scene ID from the script’s encounter list, sets `ENCOUTER_BATTLE_FLAG`, and requests battle transition.
- `FFWorldDirector` evaluates world-map encounter triggers and sets `wanted_game_mode_*` + `TOWN_BATTLE_SCENE` when an encounter is chosen.
- `World_SetPendingBattleScene` writes `wanted_game_mode_*` with a provided scene ID for world-map battle transitions.
- `World_Encounter_CheckAndTrigger` performs world encounter checks (vehicle/region/terrain), sets battle prep flags, and primes encounter state.

## Behavior Summary
This is the battle trigger pipeline (domain-level, not graphics):
- **Field random encounters**: `Field_Encounter_RollAndSelectScene` ticks the encounter meter and, when it passes a threshold, chooses an encounter scene from the field encounter table and requests battle.
- **Field scripted battles**: `SCRIPT_BATTLE` selects the next scripted encounter scene ID and requests battle.
- **World map encounters**: `FFWorldDirector` + `World_Encounter_CheckAndTrigger` evaluate world movement/region conditions and set a pending scene via `wanted_game_mode_*`.
- **Module handoff**: `FFModuleHandler_main_loop` reads the pending scene ID (field/script vs world) into `COMBAT_SCENE_ID`, then enters the battle transition module.

**Scene ID context**: A scene ID is a key into the scene/out formation data (enemy list + flags). The engine resolves `COMBAT_SCENE_ID` into runtime enemy structs during battle setup.

## Dataflow
- Field random:
  - `Field_Encounter_RollAndSelectScene` updates `word_1CDC740` (encounter meter).
  - When threshold is met, selects a scene ID from the field encounter table (`*dword_1CF3D78`) and sets `MenuState_opcode_menu_id`.
  - Requests battle via `globalFieldNextModuleID=3`.
  - `FFModuleHandler_main_loop` copies `MenuState_opcode_menu_id` → `COMBAT_SCENE_ID` and launches the battle transition.

- Field scripted:
  - `SCRIPT_BATTLE` pops a scene ID from the script list and writes `MenuState_opcode_menu_id`.
  - `ENCOUTER_BATTLE_FLAG` is set (purpose likely differentiating scripted vs random battle).
  - `FFModuleHandler_main_loop` copies `MenuState_opcode_menu_id` → `COMBAT_SCENE_ID`.

- World map:
  - `FFWorldDirector` / `World_Encounter_CheckAndTrigger` evaluate world position/vehicle/region flags.
  - When an encounter is chosen, it writes:
    - `wanted_game_mode_byte_2036B4C` (mode selector)
    - `wanted_game_mode_dword_2036B4E` (scene ID)
    - `wanted_game_mode_2036B4F` (target/aux)
  - `World_SetPendingBattleScene` is used for explicit world scene IDs.
  - `FFModuleHandler_main_loop` combines these into `COMBAT_SCENE_ID` and enters battle transition.

## Variable Behavior (evidence only)
### `ENCOUTER_BATTLE_FLAG`
- Set by `SCRIPT_BATTLE` (scripted encounters) and later merged with `CURRENT_ENCOUNTER_DATA_SCENE_OUT.battle_flags` during battle init.
- Read gates:
  - `sub_47D910`: if `ENCOUTER_BATTLE_FLAG & 4`, enables battle countdown.
  - `sub_47E3C0`: if `(ENCOUTER_BATTLE_FLAG & 2) == 0`, plays battle music (otherwise suppressed).
  - `sub_486130`: if `(ENCOUTER_BATTLE_FLAG & 1) != 0`, sets `RELATED_CANT_ESCAPE`.

### `wanted_game_mode_*`
- Written in world map encounter paths (`FFWorldDirector`, `World_Encounter_CheckAndTrigger`, `World_SetPendingBattleScene`).
- Read by `FFModuleHandler_main_loop` to compose `COMBAT_SCENE_ID` for world→battle transition.

## Open Questions
- Meaning of `wanted_game_mode_byte_2036B4C` values (1/3/5) beyond “world battle modes.”
- Exact role of `ENCOUTER_BATTLE_FLAG` in battle setup (flag bit meanings beyond countdown/music/can’t‑escape).
- Enc‑None / Enc‑Half: which variable/flag gates encounter meter or threshold in `Field_Encounter_RollAndSelectScene`.
- Where `COMBAT_SCENE_ID` is converted to the enemy formation list (likely via scene/out data such as `CURRENT_ENCOUNTER_DATA_SCENE_OUT`).
