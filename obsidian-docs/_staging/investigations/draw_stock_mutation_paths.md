---
title: Draw Stock Mutation Paths
summary: Static IDA mapping of battle, field/menu, drawpoint, and junction magic-stock mutation paths, showing that the battle stock helper is only a battle-local writer and that persistent mutations go through separate save/menu writers.
tags:
  - ff8
  - battle-system
  - runtime-memory
  - reverse-engineering
  - reference
sources:
  - ai-prompt/todo/ai_investigation_on_draw_stock_mutation_paths.md
  - docs/tech/systems/draw_system.md
  - obsidian-docs/projects/re-ff8/concepts/draw-magic-and-render-bridge.md
  - obsidian-docs/projects/re-ff8/concepts/battle-state-model.md
  - obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
---

# Draw Stock Mutation Paths

> [!warning] Runtime blocker
> The current IDA session has no live debugger attached (`debugger_on = false`, `process_state = 0`), so the planned breakpoint capture for Draw Stock, Draw Cast, normal Magic consumption, and menu/junction actions could not be executed in this session. This note records strong static conclusions and IDB updates, but it does **not** claim live-authentic breakpoint evidence.

This investigation resolves the main open question left in [[projects/re-ff8/concepts/draw-magic-and-render-bridge]]: `Battle_MutateMagicStock` is **not** the global authority for magic stock. Its renamed form, `domain::BattleMagic_MutateStock` at `0x486A10`, only mutates the **battle-local working copy** inside `F_CHAR_DATA`. Persistent stock mutation outside battle uses separate writers over `SG_ARRAY_CHARA_DATA[].Magic`, and battle persistence crosses an explicit battle->save sync bridge.

## Confirmed Conclusions

- `domain::BattleMagic_MutateStock` (`0x486A10`) is a battle-local stock writer over `F_CHAR_DATA`, not the shared authoritative writer for menu/junction/save stock.
- Draw->Stock for normal magic (`magic_id < 0x40`) adds directly through `domain::BattleMagic_MutateStock(..., remove_flag = 0)` inside `domain::BattleAction_GetText`.
- Successful in-battle player Magic consumption removes stock through `domain::BattleMagic_MutateStock(..., remove_flag = 1)` inside `domain::EnemyAI_PrepareTurnAction`, after the action is accepted and resolved.
- Enemy AI has a second battle-only removal path: `domain::EnemyAI_VM_ExecuteScript` arms `byte_1D28E11/12/13` for magic blow-away behavior, and `domain::BattleAction_ResolveAndApplyStatusResult` then loops `domain::BattleMagic_MutateStock(..., remove_flag = 1)` for the selected spell and quantity.
- Out-of-battle durable stock mutation uses `SG_ARRAY_CHARA_DATA[].Magic`, not `F_CHAR_DATA`.
- Field/script add flows use `Field_AddOneMagicToCharacterStock` (`0x47EE00`), including `SCRIPT_ADDMAGIC` and `SCRIPT_DRAWPOINT`.
- Out-of-battle menu magic use decrements stock directly inside the large main menu state machine at `0x4F02F0`, then prunes zero slots and rebuilds derived junction state.
- Junction/edit flows have both helper-based writers (`MenuMagic_AddStockAndRefresh`, `MenuMagic_RemoveStockAndRefresh`) and direct slot rewrites in the large junction state machine plus `Junction_SwapMagicEntriesBetweenCharacters`.
- Therefore `domain::BattleMagic_MutateStock` is only battle-local; the authoritative persistent writers are the `SG_ARRAY_CHARA_DATA[].Magic` mutation helpers and direct junction state-machine writes.

## Storage Model And Sync Boundary

### Battle Working Copy

- `F_CHAR_DATA` base: `0x1CFF000`.
- `F_CHARACTER_MAGIC_DATA` base: `0x1CFF082`.
- Effective battle magic entry shape:
  - `id` at entry `+0`
  - `amount` at entry `+1`
  - stride `5` bytes per stocked spell
  - `32` entries per battle character working copy
- `domain::BattleMagic_MutateStock` searches these `32` entries, clamps add to `100`, clears the `id` when a removal reaches zero, and calls `domain::Battle_BuildMagicJunctionList` only when the slot topology changes (new spell inserted or last copy removed).

### Save/Menu Authority

- `SG_ARRAY_CHARA_DATA` base: `0x1CFE0E8`.
- `SG_ARRAY_CHARA_DATA[].Magic[32]` is the persistent out-of-battle stock table.
- Each save/menu entry is the compact `id`/`amount` pair used by field scripts, menu use, refine-like flows, and junction exchange.
- `SG_KNOWN_MAGIC` base: `0x1CFE95C` is updated after battle commit and used to rebuild Draw visibility/availability state.

### Battle -> Save Commit

- `domain::Battle_CommitPartyHPAndMagicToSave` (`0x48B8B0`) is the bridge back to persistent state.
- It:
  1. copies current party HP back into `SG_ARRAY_CHARA_DATA`,
  2. calls `domain::Battle_CopyMagicStocksToSave` (`0x486CD0`) to copy the active-party battle working copies back into `SG_ARRAY_CHARA_DATA[].Magic`,
  3. updates `SG_KNOWN_MAGIC`,
  4. refreshes Draw spell availability,
  5. recalculates junction-derived stats and battle slot data.
- `domain::Battle_CopyMagicStocksToSave` also clears any junction spell references that no longer exist in persistent stock.

## Confirmed Durable Mutation Paths

### Battle-Local Writers

| Context | Entry path | Writer | Target storage | Notes |
| --- | --- | --- | --- | --- |
| Draw->Stock (normal magic) | `domain::BattleAction_GetText` Draw case, `p_param_is_0_for_ai == 10`, `magic_id < 0x40` | `domain::BattleMagic_MutateStock(attacker_slot, magic_id, 0)` | `F_CHARACTER_MAGIC_DATA` | Loops once per drawn unit until the count is exhausted or the target stock/slot fills. |
| Magic cast consumption | `domain::EnemyAI_PrepareTurnAction` after successful `COMMAND_MAGIC` resolution | `domain::BattleMagic_MutateStock(attacker_slot, unk_1D28E2A, 1)` | `F_CHARACTER_MAGIC_DATA` | Removes one stock after a successful cast; double/triple paths delay the decrement until the terminal dispatch point. |
| Enemy AI magic blow-away | `domain::EnemyAI_VM_ExecuteScript` -> `domain::BattleAction_ResolveAndApplyStatusResult` | `domain::BattleMagic_MutateStock(attacker_slot, byte_1D28E12, 1)` | `F_CHARACTER_MAGIC_DATA` | Quantity is `1` for one opcode family and `domain::EnemyAI_SelectRandomMagicFromStock(...)` for another. |

### Battle Paths That Do Not Use The Stock Writer

- Draw->Cast (`p_param_is_0_for_ai == 9`) validates quantity with `domain::Draw_ComputeStealCount` but does **not** add stock; it proceeds into normal spell resolution.
- Drawing a GF (`magic_id >= 0x40`) does **not** write a magic-stock slot. It goes through GF ownership state and the `byte_1D28E18` / `sub_493650` / battle-commit path instead.

### Persistent Field/Menu Writers

| Context | Entry path | Writer | Target storage | Notes |
| --- | --- | --- | --- | --- |
| Scripted add magic | `SCRIPT_ADDMAGIC` | `Field_AddOneMagicToCharacterStock` | `SG_ARRAY_CHARA_DATA[].Magic` | Adds one unit per loop iteration; caps at `100`; creates a new slot when needed. |
| Draw point / field draw source | `SCRIPT_DRAWPOINT` and `World_Interaction_Draw_SubQuest` | `Field_CanAddOneMagicToCharacterStock` + `Field_AddOneMagicToCharacterStock` | `SG_ARRAY_CHARA_DATA[].Magic` | Uses a precheck before the per-unit add loop. |
| Out-of-battle Use Magic | `0x4F02F0` main menu state machine, case block around pseudocode lines `1244..1312` | direct `--SG_ARRAY_CHARA_DATA[].Magic[slot].amount` | `SG_ARRAY_CHARA_DATA[].Magic` | Applies the field effect first, then decrements by `1` only on success; clears `id` on zero and rebuilds derived state. |
| Menu conversion/add | `0x4D7410` conversion/refine state machine | `MenuMagic_AddStockAndRefresh` | `SG_ARRAY_CHARA_DATA[].Magic` | Helper-based add path; exact front-end label depends on menu mode.^[ambiguous] |
| Menu conversion/remove | `0x4D7410` conversion/refine state machine | `MenuMagic_RemoveStockAndRefresh` | `SG_ARRAY_CHARA_DATA[].Magic` | Helper-based remove path; zero clears junction refs automatically. Exact front-end label depends on menu mode.^[ambiguous] |

### Junction / Exchange Durable Writers

| Context | Entry path | Writer | Target storage | Notes |
| --- | --- | --- | --- | --- |
| Transfer all stock from one character to another | `Junction_TransferAllMagicFromSourceToTarget` (`0x4F5FA0`) | raw `MenuMagic_AddStockRaw` + `MenuMagic_RemoveStockRaw` | `SG_ARRAY_CHARA_DATA[].Magic` | Moves every stocked spell from source to target, respecting the `100` cap per destination slot, then rebuilds both characters. |
| Swap two selected entries between characters | `Junction_SwapMagicEntriesBetweenCharacters` (`0x4F6300`) | direct slot rewrites | `SG_ARRAY_CHARA_DATA[].Magic` | Swaps the two selected entries, coalesces same-id stacks, and rebuilds both characters' derived state. |
| Cross-character rebalance / merge | `0x4F02F0` junction state machine, blocks around pseudocode lines `2140..2175`, `2244..2278`, and `2401..2418` | direct amount rewrites, then `Junction_SwapMagicEntriesBetweenCharacters` or equivalent continuation | `SG_ARRAY_CHARA_DATA[].Magic` | Rebalances two selected stacks, merges duplicates up to `100`, and keeps the remainder in the opposite slot.^[ambiguous] |
| Direct slot clear | `0x4F02F0` blocks around pseudocode lines `3788..3792` and `3829..3833` | direct `id = 0`, `amount = 0` | `SG_ARRAY_CHARA_DATA[].Magic` | Durable slot clear followed by junction/derived-state rebuild. The exact UI action label is still ambiguous in this static pass.^[ambiguous] |

## Non-Durable Preview Helpers

These functions **do write** `SG_ARRAY_CHARA_DATA[].Magic`, but they restore the original state before returning, so they are not authoritative durable mutation paths:

- `0x4F6030`: temporarily clears/restores the current `JunctionHP` spell to preview the HP delta of unjunctioning it, then restores stock and junction state.
- `0x4F6140`: temporarily simulates moving the current `JunctionHP` spell to another character, recomputes HP, then restores the source stock before return.

They matter because they can look like writers in raw xref lists, but they should not be counted as final stock mutation paths.

## Invariants

- Persistent stock caps at `100` per magic slot in both battle-local and save/menu writers.
- Zero quantity implies `id = 0` in the persistent menu/save table after cleanup.
- When persistent stock reaches zero for a spell, junction references that still point at that spell are cleared during cleanup (`MenuMagic_PruneZeroStockAndJunctionRefs` or `domain::Battle_CopyMagicStocksToSave`).
- Battle-local increment/decrement does **not** rebuild the battle junctionable list on every count change. It rebuilds only when the spell-slot topology changes (new spell inserted or final copy removed).
- Out-of-battle durable writers usually refresh derived state through:
  - `MenuMagic_PruneZeroStockAndJunctionRefs`
  - `MenuMagic_RebuildPartyDerivedState`
- Battle persistence is deferred until `domain::Battle_CommitPartyHPAndMagicToSave`; battle-local stock changes do not directly mutate `SG_ARRAY_CHARA_DATA[].Magic` in place.

## Determination On Authority

`domain::BattleMagic_MutateStock` is **not** authoritative across battle, menu, and junction. The actual model is:

1. **Battle-local authority during combat**: `domain::BattleMagic_MutateStock` writes the working copy in `F_CHAR_DATA`.
2. **Commit bridge at battle end / battle-state teardown**: `domain::Battle_CommitPartyHPAndMagicToSave` -> `domain::Battle_CopyMagicStocksToSave`.
3. **Persistent authority outside battle**: field scripts, menu use, conversion/refine logic, and junction exchange mutate `SG_ARRAY_CHARA_DATA[].Magic` directly through their own helpers or direct slot rewrites.

So the correct answer to the original open question is: `Battle_MutateMagicStock` is only battle-local, not globally authoritative.

## IDA Updates Applied

Confirmed IDB improvements pushed in this session:

- Renamed:
  - `0x486A10` -> `domain::BattleMagic_MutateStock`
  - `0x486CD0` -> `domain::Battle_CopyMagicStocksToSave`
  - `0x48B8B0` -> `domain::Battle_CommitPartyHPAndMagicToSave`
  - `0x47ED90` -> `Field_CanAddOneMagicToCharacterStock`
  - `0x47EE00` -> `Field_AddOneMagicToCharacterStock`
  - `0x4C2C70` -> `MenuMagic_AddStockRaw`
  - `0x4C2D20` -> `MenuMagic_AddStockAndRefresh`
  - `0x4C2D50` -> `MenuMagic_RemoveStockRaw`
  - `0x4C2DD0` -> `MenuMagic_RemoveStockAndRefresh`
  - `0x4BE790` -> `MenuMagic_PruneZeroStockAndJunctionRefs`
  - `0x4BFCF0` -> `MenuMagic_RebuildPartyDerivedState`
  - `0x4F5FA0` -> `Junction_TransferAllMagicFromSourceToTarget`
  - `0x4F6300` -> `Junction_SwapMagicEntriesBetweenCharacters`
- Added explanatory comments to the functions above plus:
  - `0x4D7410`
  - `0x4F02F0`
  - `0x4F6030`
  - `0x4F6140`

## Merge Guidance

- This staging note is strong enough to update the shared wiki pages that currently imply `Battle_MutateMagicStock` is the sole stock writer.
- The safe merge position is:
  - promote the battle-local vs persistent-authority split,
  - document the save/menu helpers and junction direct writers,
  - keep runtime-capture work open until a live debugger session can record authentic breakpoints for Draw Stock, field Use Magic, and representative junction actions.
- In other words: the static mapping is ready for merge as a documented baseline, but full runtime closure remains blocked by the missing live debugger.

## Related

- [[projects/re-ff8/concepts/draw-magic-and-render-bridge]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
