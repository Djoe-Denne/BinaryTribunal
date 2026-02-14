## Evidence
- `Draw_ComputeStealCount` (`0x48FD20`) computes draw quantity using attacker level, target level, attacker magic stat, `K_MAGIC[magic_id].drawResist`, and randomness; clamps result to 0..9.
- `getText` (`0x48D554`) contains the Draw flow for command type `COMMAND_DRAW`, branching on `p_param_is_0_for_ai`:
  - `== 9`: Draw→Cast path, uses `Draw_ComputeStealCount` to validate the cast.
  - `== 10`: Draw→Stock path, computes count and loops stock increments.
- `sub_486A10` (no rename yet) is used in the Draw→Stock loop and enforces a stock cap of 100 per magic slot; returns nonzero on failure/full.

## Behavior Summary
Draw in battle uses `Draw_ComputeStealCount` to derive the number of units drawn (0..9).  
The Draw→Stock branch repeatedly calls a stock mutation routine that adds one unit at a time and clamps stock to 100.

## Dataflow
- Inputs:
  - `Draw_ComputeStealCount(attacker_slot_id, target_slot_id, magic_id)`
  - `K_MAGIC[magic_id].drawResist`
  - `BATTLE_SLOT_DATA[attacker].level`, `BATTLE_SLOT_DATA[target].level`, `BATTLE_SLOT_DATA[attacker].mag`
  - Monster draw list and quantity from `monster_info_section->LowLvlDraw`
- Outputs:
  - Draw quantity (`0..9`)
  - Stock mutation via `sub_486A10(attacker_slot_id, magic_id, 0)`; stock count clamped to 100.

## Open Questions
- Is `sub_486A10` the sole stock mutation path (menu use, junction changes), or are there other stock adjusters?
- Draw→Stock in field likely reuses `sub_486A10`; need confirmation via caller traces.
