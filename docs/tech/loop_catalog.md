## Main Loops (Module / State Dispatch)
- `main::FFModuleHandler_main_loop` (0x4706B0)  
  Top-level module dispatcher. Chooses which module loop runs (field, world, battle, menu, etc.).

- `main::FFFieldModule_field_main_loop` (0x46FEE0)  
  Field module per-frame loop.

- `main::FFWorldModule_worldmap_main_loop` (0x53F0F0)  
  World map per-frame loop.

- `main::FFBattleDirector_battleLoop` (0x47CCB0)  
  Battle module state machine and per-frame battle tick (domain + presentation bridge).

- `main::battle_cardgame_main_loop` (0x47CF60)  
  Triple Triad module loop.

- `main::menu_or_tuto_main_loop_1` (0x4A22C0)  
  Menu / tutorial loop (exact mode selection TBD).

- `main::unknown_main_loop_sub_4A2690` (0x4A2690)  
  Unidentified module loop (needs classification).

- `main::FFIntroModule_credits_main_loop` (0x52DA20)  
  Intro/credits loop.

- `main::cdcheck_main_loop` (0x52DCF0)  
  CD check loop.

## TODO
- Classify `main::unknown_main_loop_sub_4A2690` by tracing its call tree and state usage.
