# Draw System

## Menu Flow (R0)

`BattleDrawMenu_Open` (`0x4ADD10`, unique caller case 3 of `OpenSelectedCommand`) stores slot/cmd/aux/flags, registers widget slot 2 (update `0x4ADDB0`, draw `sub_4AF4F0`) and calls the state machine. `BattleDrawMenu_StateMachine` (`0x4ADDB0`, 1408 insns, 44 cases on `0x1D768D0`) queues via `PendingCmd_QueueOrStore` (`0x4AF05F`, never `BattlePendingAction_Write`) — full 44-case walk open (R0 gap #1).

`BattleDraw_RefreshKnownMagicFlags` (`0x48CA70`): if slot `flag_data & 1`, checks the monster's 4 Draw spells (id `< 0x40`, known via `sub_47EEB0`) and sets/clears bit 4 of the qty flag.

## Draw Quantity

`Draw_ComputeStealCount` (`0x48FD20`, R0) computes draw quantity (0-9): `rand = (rand8 & 0x1F) + 1`; `qty = ((atk.lvl − tgt.lvl + 10) >> 1 − K_MAGIC.drawResist + rand + atk.mag) / 5 − tier`, clamp 0–9; tier from the 4-entry LowLvlDraw table (1 if id absent). Uses attacker level, target level, attacker magic stat, `K_MAGIC[magic_id].drawResist`, randomness.

## Draw Paths

`getText` (`0x48D554`) branches on `p_param_is_0_for_ai`:
- `== 9`: Draw→Cast — validates via `Draw_ComputeStealCount`, then casts the spell
- `== 10`: Draw→Stock — computes count and loops stock increments

## Stock Mutation

`Battle_MutateMagicStock` (`0x486A10`, 32 entries stride 5): add path (`arg_8==0`, cap 100 @ `0x486A8B`, returns 1 when full) vs remove path (`arg_8!=0`, decrements, clears id at 0 + rebuilds junction list). R0: catalogue name `BattleMagic_DeductFromStock` is a misnomer — add proven.

## Open Questions

- Full 44-case walk of `BattleDrawMenu_StateMachine` (`0x4ADDB0`).
- Is `Battle_MutateMagicStock` the sole stock mutation path across battle/menu/junction contexts?
