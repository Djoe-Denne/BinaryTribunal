---
title: Draw And Item Command ID Static Confirmation
summary: Static IDA analysis corrects the current ambiguity: Item uses pending/exec command_id `0x04`, Draw uses pending/exec command_id `0x06`, and both paths preserve their command IDs into the exec queue before `BattleAction_GetText` and resolve. Live breakpoint capture at `0x484D20` remains blocked because no debugger is attached to the current IDA session.
tags:
  - ff8
  - battle-system
  - runtime-memory
  - reverse-engineering
  - reference
sources:
  - ai-prompt/todo/ai_investigation_on_command_id_draw_item_confirmation.md
  - docs/tech/reference/command_id_table.md
  - docs/tech/reference/pending_action.md
  - docs/tech/systems/command_pipeline.md
  - docs/tech/systems/command_menu.md
  - docs/tech/systems/draw_system.md
  - obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.86
  inferred: 0.10
  ambiguous: 0.04
---

# Draw And Item Command ID Static Confirmation

> [!warning] Runtime blocker
> The current IDA session has no live debugger attached (`debugger_on = false`, `process_state = 0`), so the planned breakpoint capture at `[[projects/re-ff8/references/battle-address-catalog|0x484D20]]` could not be executed in this session. This note records strong static conclusions and exact merge guidance, but it does **not** claim live-authentic pending bytes were captured.

This staging note resolves the main static ambiguity left in [[projects/re-ff8/concepts/command-action-pipeline]] and [[projects/re-ff8/references/battle-slot-and-command-layouts]]: the normal Item command is `0x04`, not `0x05`, and Draw is `0x06`, not `0x04`. The prior `Draw=0x04 / Item=0x05` guess appears to have conflated menu order with actual command-family IDs and to have missed that `BattleAction_GetText` already distinguishes `case 4` and `case 6` as separate command families.^[inferred]

## Confirmed Static Conclusions

- `Item` uses `command_id = 0x04` on the player menu -> pending -> exec path.
- `Draw` uses `command_id = 0x06` on the player menu -> pending -> exec path.
- `BattlePendingAction_TransferToExecQueue` copies `pending.command_id` straight into exec byte `+1`; there is no transfer-stage rewrite for Draw or Item.
- `BattleAction_GetText` statically dispatches:
  - `case 4, 13` to `K_ITEM[...]` / `getTextBattleItem(...)`,
  - `case 6` to the Draw spell-list path with Draw Cast / Draw Stock branching.
- Therefore the current wiki ambiguity (`Draw 0x04`, `Item 0x05`) should be corrected to `Item 0x04`, `Draw 0x06` once the parent decides whether static-only proof is sufficient to merge.

## Proof Chain

### 1. Pending -> exec preserves `command_id`

`domain::BattlePendingAction_TransferToExecQueue` (`0x4847F0`) performs the decisive copy:

- exec byte `+0` = `attacker_slot`
- exec byte `+1` = `pending.command_id`
- exec word `+4` = `pending.command_arg`
- exec bytes `+2/+3` = `pending.aux_5 / pending.aux_6`

So any Draw or Item identity change would have to happen **before** the pending entry is written, or **later** inside `BattleAction_GetText`; it does not happen in the transfer routine.

### 2. `BattleAction_GetText` numeric switch values

Static Hex-Rays switch extraction on `domain::BattleAction_GetText` (`0x48D554`) shows:

- `case 4, 13` -> `K_ITEM[...]`, `getTextBattleItem(...)`
- `case 6` -> Draw source lookup in `BMI_MONSTER*_DRAW_SPELL_ID*`, then:
  - `p_param_is_0_for_ai == 9` -> Draw Cast
  - `p_param_is_0_for_ai == 10` -> Draw Stock

This is the strongest static discriminator in the current session. Numeric `4` is the normal item family. Numeric `6` is the draw family. Numeric `5` is a separate case in `BattleAction_GetText`, not the base item command.^[ambiguous]

## Item Entry Path

The normal Item menu path is:

1. `domain::BattleCommandMenu_OpenSelectedCommand` (`0x4BC770`)
2. case `4` -> `sub_4C8220(...)`
3. `presentation::BattleSubmenu_OpenByCommandClass(3, ...)`
4. class `3` uses the default item provider:
   - display callback `getTextBattleItem`
   - text lookup `sub_47EA90(...)`
5. `presentation::BattleSubmenu_StateMachine` (`0x4FDD90`) case `14`
6. case `14` stages the pending menu entry through `domain::BattleMenuPendingCmd_Append`
7. `domain::BattleCommandMenu_FlushPendingActions` forwards the staged tuple into `domain::BattlePendingAction_Write`

The staging write in `presentation::BattleSubmenu_StateMachine` case `14` is the key static proof:

- `command_id = SBYTE1(dword_1D768F4)` -> initialized from the selected top-level command ID
- `command_arg = *selected_entry` -> item ID
- `target_mask = v94` -> the target mask just validated by `sub_4A9DF0()`

Because the later `BattleAction_GetText` switch treats numeric `4` as the item family, the staged top-level Item command here must be `0x04`.

## Draw Entry Path

The Draw menu path is separate and much more explicit:

1. `domain::BattleCommandMenu_OpenSelectedCommand` (`0x4BC770`)
2. case `3` -> `domain::BattleDrawMenu_Open`
3. `domain::BattleDrawMenu_StateMachine` (`0x4ADDB0`)
4. enemy-slot selection and draw-list refresh:
   - `domain::BattleDraw_RefreshKnownMagicFlags` (`0x48CA70`)
   - source lists from `BMI_MONSTER*_DRAW_SPELL_ID*`
5. Draw Cast / Stock submenu construction:
   - `domain::BattleDraw_BuildCastOrStockMenu` (`0x48CAE0`)
6. final queue write through `domain::PendingCmd_QueueOrStore`

The Draw queue call is the other decisive proof:

- `command_id = BYTE2(dword_1D768D8)` -> initialized from the selected top-level Draw command
- `command_arg = LOBYTE(dword_1D768DC)` -> selected draw spell or GF ID
- `aux_5 = BYTE1(dword_1D768DC)` -> Draw mode
  - `9` = Draw Cast
  - `10` = Draw Stock
- `aux_6 = HIBYTE(dword_1D768D8)` -> source monster slot
- `target_mask = HIWORD(dword_1D768DC)` -> enemy source mask for stock, or selected cast target mask for cast^[inferred]

`BattleAction_GetText` later handles `case 6` as Draw and branches exactly on `p_param_is_0_for_ai == 9` and `== 10`, which matches the queued Draw-mode byte above.

## Dispatch And Runtime Invariants

- `Item` and `Draw` do **not** share one command family plus a later decode; they are already distinct before resolve.
- `Item` reaches resolve as command family `4`, where `BattleAction_GetText` and `BattleAction_ResolveAndApplyDamage` both consume `K_ITEM[...]`.
- `Draw` reaches resolve as command family `6`, where:
  - `Draw Cast` loads `K_MAGIC[magic_id]` and later deals spell damage/status,
  - `Draw Stock` uses the same command family but no normal spell-damage path, and instead mutates stock / GF ownership state.
- The exec queue keeps the extra Draw bytes (`aux_5`, `aux_6`) alive; they are not dead padding on this path.
- The menu-staging helper `domain::BattleMenuPendingCmd_Append` stores more than the final pending triple (`command_id`, `command_arg`, `target_mask`), but `BattleCommandMenu_FlushPendingActions` only forwards those three fields into `BattlePendingAction_Write`.

## What This Changes In Existing Notes

The current shared wiki pages still say:

- `Draw = 0x04` ^[ambiguous]
- `Item = 0x05` ^[ambiguous]

This investigation strongly supports replacing that with:

- `Item = 0x04`
- `Draw = 0x06`

and then extending the surrounding note text with the two entry-path summaries above.

## Remaining Blocker

The missing live debugger means the following are still **not** captured in this session:

- an authentic `BattlePendingAction_Write` breakpoint for a real Draw confirm,
- an authentic `BattlePendingAction_Write` breakpoint for a real Item confirm,
- the exact raw pending bytes seen at `0x484D20` for:
  - Draw Cast,
  - Draw Stock,
  - Item use.

So this note is strong enough to correct the static command-family mapping, but it is **not** enough to mark the original runtime-capture task fully closed.

## Merge Guidance

If the parent wants a conservative merge:

1. Update the shared docs from `Draw 0x04 / Item 0x05` to `Item 0x04 / Draw 0x06`.
2. Add the Draw path details (`aux_5 = 9/10`, `aux_6 = source monster slot`) to the command-pipeline reference.
3. Keep the runtime-capture prompt open until a live breakpoint session records the exact menu-produced bytes at `0x484D20`.

If the parent wants to wait for live confirmation first, this note should still be kept as the static baseline explaining **why** the next breakpoint session should expect `Item=0x04` and `Draw=0x06`, not the older inferred values.
