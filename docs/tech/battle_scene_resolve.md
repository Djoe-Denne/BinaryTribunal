## Evidence
- `FFBattleDirector_battleLoop` reads `COMBAT_SCENE_ID`, calls `ReadSceneOutFileForSpecificEncounter(COMBAT_SCENE_ID, &CURRENT_ENCOUNTER_DATA_SCENE_OUT)`, then uses fields from `CURRENT_ENCOUNTER_DATA_SCENE_OUT` to seed battle setup.
- `ReadSceneOutFileForSpecificEncounter` loads a scene entry from battle archive using `Archive_IO_LoadFile` with offset `p_combat_scene << 7` and size `ENCOUNTER_DATA_SIZE`.
- `SceneOut_InitEnemySlot` consumes `CURRENT_ENCOUNTER_DATA_SCENE_OUT` fields (enemy levels, enemy AI/com values, visibility/targetable/loaded flags) to initialize battle slots and enemy HP.

## Behavior Summary
This is the scene.out resolver chain:
1. `COMBAT_SCENE_ID` is chosen during encounter selection.
2. `FFBattleDirector_battleLoop` resolves that scene ID into runtime data:
   - `ReadSceneOutFileForSpecificEncounter(COMBAT_SCENE_ID, &CURRENT_ENCOUNTER_DATA_SCENE_OUT)`
3. Setup functions then initialize enemy slots using `CURRENT_ENCOUNTER_DATA_SCENE_OUT`:
   - Levels, AI/com values, visibility/targetable/loaded flags.

## Dataflow
- `COMBAT_SCENE_ID` → `ReadSceneOutFileForSpecificEncounter` → `CURRENT_ENCOUNTER_DATA_SCENE_OUT`
- `CURRENT_ENCOUNTER_DATA_SCENE_OUT` fields used during setup:
  - `enemy_levels[]`
  - `enemy_com_value[]`
  - `visible_enemies`, `targetable_enemies`, `loaded_enemies` (bitfields)
  - `battle_flags`, `battle_scenario`
- `battle_flags` are merged into `ENCOUTER_BATTLE_FLAG` during battle init:
  - If `battle_flags & 0xE0` set, `ENCOUTER_BATTLE_FLAG` is masked and OR'ed.
  - Else `ENCOUTER_BATTLE_FLAG |= battle_flags & 0xEF`.

## Open Questions
- Exact size/format of `CURRENT_ENCOUNTER_DATA_SCENE_OUT` (`ENCOUNTER_DATA_SIZE`).
- Meaning of `battle_flags` bitfields (e.g., surprise/back/scripted, no‑EXP).
- Where `battle_scenario` is interpreted downstream.
