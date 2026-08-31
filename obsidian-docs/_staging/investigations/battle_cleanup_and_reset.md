---
title: Battle Cleanup and Reset Investigation
summary: Static and live analysis of battle-end detection, delayed cleanup, reward handoff, and the nonzero transient buffers safely abandoned at module exit.
tags: [ff8, battle-system, reverse-engineering, runtime-memory, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_battle_cleanup_and_reset.md
  - docs/tech/systems/battle_init.md
  - docs/tech/reference/address_catalog.md
  - ai-prompt/completed/temp_result_battle_init.md
  - ai-prompt/completed/temp_result_battle_struct.md
  - obsidian-docs/_staging/investigations/escape_mechanics.md
  - IDA live victory cleanup trace 2026-07-12
provenance:
  extracted: 0.82
  inferred: 0.11
  ambiguous: 0.07
---

# Battle Cleanup and Reset Investigation

This staging note extends [[projects/re-ff8/concepts/battle-lifecycle]], [[projects/re-ff8/concepts/battle-state-model]], and [[projects/re-ff8/references/battle-address-catalog]] with a focused static pass over the teardown window from battle-end detection through `mode_StateGlobal == 100`.

## Confirmed Exit-Path Invariants

All five confirmed battle-end checks share the same outer pattern:

- guard on `BATTLE_RESULT_CODE == 0`,
- write `BYTE2(TARGET_SLOT_ID) = 1`,
- activate relay `112`,
- call `BattleState_SetPhaseFlag(10)`,
- write `BATTLE_RESULT_CODE`,
- write `BATTLE_END_TYPE`,
- register `Battle_EndSetTransitionTimer` as the targetable callback.

The path-specific writers are:

| Exit path | Writer | `BATTLE_RESULT_CODE` | `BATTLE_END_TYPE` | Extra confirmed work before countdown |
| --- | --- | --- | --- | --- |
| scripted battle end | `0x4863F0` `BattleTick_CheckScriptedBattleEnd` | `1` | `3` | none beyond common pattern |
| party wipe | `0x486450` `BattleTick_CheckPartyWipe` | `1` | `3` | displays misc text `0` |
| timer expiry | `0x486390` `BattleTick_CheckTimerExpiry` | `3` | `3` | none beyond common pattern |
| all enemies dead | `0x486500` `BattleTick_CheckAllEnemiesDead` | `4` | `0` or `1` | calls `BattleEnd_DistributeXpAp`, relay `115` or `109` |
| escape success | `0x4862A0` `BattleTick_CheckEscapeSuccess` | `2` | `2` | displays misc text `1`, relay `116`, calls `BattleEnd_DistributeXpAp` |

There is also a separate `0x4865C0` helper, reached from `isBattle_HUDdisplay`, that writes `BATTLE_RESULT_CODE = 5` and `BATTLE_TRANSITION_COUNTDOWN = 0`. Its exact gameplay scenario was not recovered in this pass, so it should stay treated as a special immediate-exit path rather than folded into the five standard end checks.^[ambiguous]

`Battle_EndSetTransitionTimer` (`0x47DFC4`) then writes `BATTLE_TRANSITION_COUNTDOWN` like this:

- end type `0` or `3` -> `60`,
- end type `1` -> `30`,
- end type `2` -> `40`.

It also writes `word_1D28C4C[...] = countdown - 15`, which looks like a presentation-side timer mirror rather than core battle-domain state.^[inferred]

When `BATTLE_TRANSITION_COUNTDOWN` reaches `0`, `main::FFBattleDirector_battleLoop` sets `mode3_subsub_step = 2`, and the next battle tick enters `domain::Battle_EndCleanupAndTransition`.

## Same-Frame Ordering After The Result Latch

One useful invariant from `main::FFBattleDirector_battleLoop` is the ordering inside the same active-tick frame that latches the battle result:

1. the end checks run first,
2. the pending-action transfer loop still runs once,
3. the `BYTE2(TARGET_SLOT_ID)` branch reinitializes all three action-queue groups,
4. `Status_TickAndExpire()` and `AngeloOdin_SpecialActionTick()` stop running because they are gated by `!BATTLE_RESULT_CODE`.

That means battle-end does **not** immediately short-circuit the rest of the frame. Instead, it flips the result/transition latches first, lets the frame finish under those new guards, and only enters the dedicated cleanup function on the next tick.

## Confirmed Cleanup Writes

### Generic battle-end cleanup (`0x4868C0`)

`domain::Battle_EndCleanupAndTransition` performs the following confirmed writes:

- loops party slots `0..2` only,
- reads a saved halfword from each party slot and writes it back into save-side character data,
- clears `status_1 &= ~0x20` on each populated party slot,
- writes the updated slot status back into save-side character data,
- calls `0x485EC0` once per populated party slot,
- merges the battle-local `EQUAL_ITEM_ID` / `EQUAL_ITEM_QUANTITY` buffer into `SG_ITEM_ID_AND_QUANTITY`,
- increments one outcome counter:
  - `SG_BATTLE_ESCAPED` for result `2`,
  - `SG_BATTLE_VICTORY_COUNT` for result `4`,
  - `SG_UNUSED_IN_FIELD_1` for result `1` or `3`,
- sets `mode_StateGlobal`:
  - escape -> `5`,
  - victory -> `5` unless `NO_EXP_SCREEN`, else `100`,
  - wipe/timer/result `5` -> `100`,
- calls `InitializeSound_CAL_sfx_stop_all2`,
- writes `mode_Battle_AnimationState = 0`.

This corrects an existing doc drift: the battle-end clear is on `status_1` bit `0x20`, not `status_2` bit `0x20`.

### Slot helper called by cleanup (`0x485EC0`)

The function currently named `domain::BattleExecQueue_ClearSlotQueue` does **not** clear an exec queue. Static decompilation shows:

- it starts at slot offset `+0xB8`,
- it iterates two bytes (`+0xB8` and `+0xB9`),
- for each nonzero byte it calls `domain::BattleEqualItemBuffer_AdjustCount(id, 0)`,
- it then zeroes the byte.

The function is called from:

- `domain::Battle_EndCleanupAndTransition`,
- `domain::BattleStatus_HandleEject_ResetSlot`,
- `domain::EnemyAI_PrepareTurnAction`,
- `domain::BattleStatus_ApplyAndSyncSlot`.

So the confirmed statement is:

> battle-end cleanup zeroes two per-slot transient bytes at `BATTLE_SLOT_DATA + 0xB8/+0xB9`, and feeds any nonzero ids into the battle-local `EQUAL_ITEM_*` buffer before final inventory commit.

The exact semantic names of both bytes remain unresolved, because the current slot reconstruction names `+0xB8` as `magic_to_blow_away` and `+0xB9` as `saved_hp_flag`, yet this cleanup helper clearly treats both bytes as pending ids.^[ambiguous]

### Equal-item helper (`0x486B40`)

The function previously named `domain::BattleMagic_DeductFromStockBySlot` is not direct stock deduction. Its real confirmed behavior is:

- `a2 == 0`: add one id into the battle-local `EQUAL_ITEM_ID` / `EQUAL_ITEM_QUANTITY` buffer,
- `a2 == 1`: remove one id from that same buffer.

`Battle_EndCleanupAndTransition` later commits that buffer into `SG_ITEM_ID_AND_QUANTITY`, so this helper sits on the battle-local reward/item-delta layer rather than on a direct live inventory write.

### Escape-specific transition helper (`0x47DF60`)

The helper formerly named `linkedToSummonGF`, now renamed `domain::BattleEscape_BeginTransition`, performs escape-specific cleanup writes:

- `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING = 0`,
- `BATTLE_ESCAPE_STATE = 2`,
- `BYTE1(TARGET_SLOT_ID) = 1`,
- `CAN_BATTLE_BE_PAUSED = 0`,
- `AI_BATTLE_ACTIVE_FLAG = 0`,
- clear `status_2 &= ~0x80000000` across party slots,
- enqueue UI command `18` once per party slot,
- enqueue UI command `65` once globally.

By behavior this is the "escape transition active" helper after relay `116`, even though the exact dispatcher edge into the function was not recovered statically in this pass.^[inferred]

## End-Only Writes Vs Next-Battle Init Writes

### Confirmed on the end path itself

- `BATTLE_RESULT_CODE` becomes nonzero.
- `BATTLE_END_TYPE` is selected.
- `BATTLE_TRANSITION_COUNTDOWN` is armed.
- `mode3_subsub_step` becomes `2` once the countdown reaches `0`.
- Party-slot `status_1` bit `0x20` is cleared and persisted back to save-side structures.
- Slot bytes `+0xB8/+0xB9` are zeroed through `0x485EC0`.
- The `EQUAL_ITEM_*` buffer is committed into save inventory.
- Outcome counters are incremented.
- `mode_StateGlobal` advances to `5` or `100`.
- `mode_Battle_AnimationState` resets to `0`.
- On escape specifically, the escape helper also clears `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING`, sets `BATTLE_ESCAPE_STATE = 2`, disables pause, disables AI, and clears the party GF-summon status bit.

### Confirmed at next battle init instead

These are reset in `main::FFBattleDirector_battleLoop` battle init, not in the generic end-cleanup function:

- `BATTLE_TRANSITION_COUNTDOWN = -1`,
- `BATTLE_RESULT_CODE = 0`,
- `mode_3_subsubsubstep = 0`,
- `mode_3_subsubsubcondition = -1`,
- battle RNG reseed,
- camera reset,
- reward accumulator reset,
- action-queue-group init,
- full `BattleSlot_ClearAllSlots()` over all `11` slots,
- `CAN_BATTLE_BE_PAUSED = 1` when entering active tick substep `3`,
- `AI_BATTLE_ACTIVE_FLAG = 1` when entering active tick substep `3`.

## Persisted State Into Rewards Or Field Return

Victory and escape both call `domain::BattleEnd_DistributeXpAp()` before cleanup and then route into `mode_StateGlobal == 5`.

`battle_mode5_RelatedToLvlIncrease_` (`0x4A6680`) is a reward-screen builder that consumes:

- `XP_EARNED`,
- `BCI_GF_AP_EARNED`,
- `ITEM_RELATED`,
- `BATTLE_CARD_DROP`.

That confirms the reward payload is expected to survive the transition out of active battle and into mode `5`.

Wipe/timer exits skip mode `5` and go directly to `100`.

After the mode-5 handler returns, `main::FFBattleDirector_battleLoop` writes:

- `mode_Battle_AnimationState = 4`,
- `mode_StateGlobal = 100`.

So the core static return chain is:

`end check -> countdown callback -> cleanup -> mode 5 reward packaging (victory/escape only) -> mode 100`.

## What I Did Not Confirm As Generic Cleanup

I did **not** find a confirmed generic end-cleanup write for these in the current static pass:

- `BATTLE_PENDING_ACTION_BUFFER`,
- `BATTLE_MENU_PENDING_CMD_COUNT`,
- `BATTLE_MENU_PENDING_CMD_BUFFER`,
- `BATTLE_EXEC_QUEUE_BYTES`,
- `BATTLE_EXEC_QUEUE_TARGET_MASKS`,
- `BATTLE_DEAD_TIMER`,
- `BATTLE_ESCAPE_INPUT_LATCH`,
- `BATTLE_ESCAPE_INPUT_LATCH_PREV`.

The active-loop ordering reduces stale-state risk for some of these:

- pending-action transfer still runs once after the result latch,
- the queue-group reinit branch runs in the same frame,
- status/dead-timer related ticks stop once `BATTLE_RESULT_CODE != 0`.

The 2026-07-12 live victory trace confirmed that generic cleanup does **not** blanket-zero them:

- pending remained `f8 80 00 fe 42 00 00 00 ...`,
- exec bytes remained `ff ff 00 00 02 00 ...`,
- action/target latch bytes remained nonzero,
- menu pending count was `0`.

Those values survived from cleanup entry into mode 5. This is not a stale-state bug: the battle module is being abandoned, and `FFBattleInitSystem` clears the state block before a later encounter. Other exit families remain unmeasured.^[ambiguous]

## Documentation Corrections Worth Merging Later

- `Battle_EndCleanupAndTransition` clears `status_1` bit `0x20`, not `status_2` bit `0x20`.
- `0x485EC0` is not exec-queue cleanup; it flushes and zeroes slot bytes `+0xB8/+0xB9`.
- `0x486B40` is not direct magic-stock deduction; it adjusts the battle-local `EQUAL_ITEM_*` buffer.

## IDA Updates Applied

The following IDA updates were applied in this pass:

- `linkedToSummonGF` (`0x47DF60`) -> `domain::BattleEscape_BeginTransition`
- `domain::BattleMagic_DeductFromStockBySlot` (`0x486B40`) -> `domain::BattleEqualItemBuffer_AdjustCount`
- `relatedToObjectAndEscapeVictory` (`0x4868C0`) -> `domain::Battle_EndCleanupAndTransition`
- `unknown_main_loop_sub_4A2690` -> `main::BattleRewardMenu_MainLoop`
- function comments added at:
  - `0x47DF60`
  - `0x47DF64`
  - `0x4868C0`
  - `0x485EC0`
  - `0x486B40`
  - `0x47D7A1`
- function signatures applied for:
  - `domain::BattleEscape_BeginTransition(void)`
  - `domain::BattleEqualItemBuffer_AdjustCount(int id, int remove_one)`

## Runtime Status

Victory is now live-confirmed:

`result 4 commit -> delayed subsub 2 cleanup -> mode 5 -> FFBattleExitSystem -> BattleRewardMenu_MainLoop`.

Remaining live-only breadth:

1. compare the final transient bytes for wipe, timer, scripted end, and escape,
2. verify the exact dispatcher route from relay `116` into `domain::BattleEscape_BeginTransition`,
3. determine whether `0x4876B0` / `0x4876D0` participate in the other common end-event chains, ^[ambiguous]
4. validate the exact semantics of slot bytes `+0xB8/+0xB9` across all cleanup paths.

## 2026-08-31 Capstone recut (G23 knowledge, no ISO core)

EXE Steam 2013 SHA-256 `064d466b…6589570`. Aucun `core/` G23. Voir
`ai-prompt/todo/g22-g23-extract-reports/vague-B0.md` … `vague-B3.md`.

| EA | Fait |
| --- | --- |
| `0x494D40` | XP cap `0xEA60` @ `0x1CFF574` ; ennemi `monster_info+0x102` ; GF AP `0x1CFF520` |
| `0x494AF0` | AP `+0x100` ; bounce 1 / cap 60000 ; table `0x1CFDCE4` |
| `0x486650` / `0x4867C0` | Mug + Rare `0x1CFF6D8` + rank `0x1D28E89` |
| `0x48FBA0` | Card command drop ; call `0x534840` ; `+0xF9/+0xFA` |
| `0x492220` | Devour bits `0x1CF8A5E` → `0x495F90` |
| `0x4868C0` | Cleanup : party `0x1CFE74C`, `CharacterData` `0x1CFE0E8` stride 152, EQUAL `0x1D28E78` |
| `0x48B8B0` | Writeback halfword HP ; OR `SG_KNOWN_MAGIC` `0x1CFE95C` |
| `0x486CD0` | Stocks `+0x10`, junction `+0x5C`, 32 paires |
| `0x4865C0` | **`BATTLE_RESULT_CODE = 5`** @ `0x1CFF6E7` (plus ambiguous) |
| `0x4A6680` / `0x4A2690` / `0x47CEF0` | Mode 5 / reward menu / exit = UI, pas formules |
| `0x483270` | Phoenix : flag bit 4, scène `0x13D` (317) |

`+0xB8/+0xB9` apparaissent comme writers **init** dans `0x48C500`, pas comme
pending-items de fin de combat. Byte-exact save / escape commit = live-only.

## Related

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/re-ff8/references/research-prompt-backlog]]
