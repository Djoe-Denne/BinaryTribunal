## Evidence
- `FFBattleDirector_battleLoop` (0x47CCB0) handles battle initialization in `mode_StateGlobal == 3`, advancing through `mode3_subsub_step` and `mode_3_subsubsubstep`.
- During `mode3_subsub_step == 3`, the engine:
  - loads `COMBAT_SCENE_ID` into `CURRENT_ENCOUNTER_ID`,
  - parses scene/out data,
  - initializes party/enemy data (`ParseBattleParty`, `setAllMonsterInfoFromDatSection`, `addMonsterToRam2`, etc.),
  - and completes battle setup before entering the per-frame tick.
- In `mode_3_subsubsubstep == 4` (still under `mode3_subsub_step == 3`), the loop begins the recurring battle tick and calls into:
  - `j_battle_run_battle_file_callback_2_sub_482590()`
  - `BdLink_GF_battle_input_and_texture_upload()`
  - plus per-frame domain logic (`pre_pre_pre_monsterAI`, `BattleAction_ResolveSpecialActionAndUpdateDamage`, etc.).

## Recommended Hook Point (battle ready, before native presentation)
**Hook at the first entry into** `mode_3_subsubsubstep == 4` **within** `FFBattleDirector_battleLoop` (0x47CCB0), **before the call to** `j_battle_run_battle_file_callback_2_sub_482590()` / `BdLink_GF_battle_input_and_texture_upload()`.

Rationale:
- By the time `mode_3_subsubsubstep` reaches 4, the scene data, actors, and battle state are initialized.
- The subsequent calls begin the battle tick and presentation-related work (callbacks + GF/input/texture upload).
- Detouring here allows the SDK to take over the render/UI loop while keeping the domain state intact.

## Hook Conditions (guards)
- `mode_StateGlobal == 3`
- `mode3_subsub_step == 3`
- `mode_3_subsubsubstep == 4`
- Optional: first-frame guard (only detour on the first frame after the transition to step 4).

## Open Questions / TODO
- TODO: Confirm whether `j_battle_run_battle_file_callback_2_sub_482590()` performs any strictly domain-critical updates that must still run even when presentation is replaced.
- TODO: Verify whether `BdLink_GF_battle_input_and_texture_upload()` is purely presentation or if it updates any shared input state needed by the domain.
