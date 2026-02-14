# Test Plan: `battle_entry_hook.md`

## Why

Validate the recommended hook point at first entry to active battle tick, before native presentation calls.

## What to test

- Hook condition correctness:
  - `mode_StateGlobal == 3`
  - `mode3_subsub_step == 3`
  - `mode_3_subsubsubstep == 4`
- Hook timing relative to `j_battle_run_battle_file_callback_2_sub_482590` and `BdLink_GF_battle_input_and_texture_upload`
- Domain state integrity when detour is enabled

## How

1. Add temporary logging at hook predicate and detour point.
2. Trigger battle start and capture first 10 battle frames.
3. Compare baseline run vs hooked run.
4. Validate essential domain updates continue.

## What to observe

- Hook fires exactly once on first transition into step 4 (or as designed).
- Hook occurs before presentation branch starts.
- Combat state (actors, ATB, pending/exec queues) remains valid.

## What to break on

- `main::FFBattleDirector_battleLoop` (`0x47CCB0`)
- `j_battle_run_battle_file_callback_2_sub_482590`
- `BdLink_GF_battle_input_and_texture_upload` (`0x500900`)

## What to do in game

- Enter a normal encounter and let intro complete.
- Issue one command immediately after control is available.
- Continue for several turns to ensure no delayed regressions.

## In-game startup context

- Save before battle trigger for reproducibility.
- Enable first-frame guard diagnostics in hook implementation.
- Watch mode/substep globals and one actor slot ATB/HP/state fields.
