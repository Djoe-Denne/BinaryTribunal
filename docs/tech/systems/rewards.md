# Rewards System (XP / AP / Items / Cards)

R0 2026-09-12: end-of-battle reward sequence proven at the disassembly
(triplet R0.3, parent spot-checks). Domain = XP math + cleanup + timer;
data packing = Mode 5; presentation = reward menu.

## XP Distribution (Domain)

`Battle_ResetXPAndItemRewards` (`0x48D020`) zeroes all XP/Gil/Item/Card
accumulators at battle start.

`BattleEnd_DistributeXpAp` (`0x494D40`) distributes XP/AP at battle end.
Xrefs **only** `0x486370` (escape) and `0x486566` (victory) — XP is computed
during the end-checks, **not** inside Mode 5 or the reward menu. Formula
(see `battle_init.md`, confidence Medium-High): total XP clamp [1,60000],
per-member split, GF XP/AP from `BCI_GF_AP_EARNED`.

## End Timer

End-checks register `Battle_EndSetTransitionTimer` (`0x47DFC0`) via
`BattleEvent_SetTargetableCallback` (not called from cleanup). Switch on
`BATTLE_END_TYPE` (`0x1D28E01`), table `0x47E018`: types 0,3 → 60 frames,
type 1 → 30, type 2 → 40. Stored to `BATTLE_TRANSITION_COUNTDOWN`
(`0x1D27B0C`), decremented each active tick (`0x47D828`). At 0, the
director moves to cleanup (`mode3_subsub_step = 2`).

## Mode 5 Packing (Data)

`Battle_EndCleanupAndTransition` (`0x4868C0`) sets `mode_StateGlobal` to 5
or 100 (see `battle_cleanup_and_reset.md`). Mode 5, director case
`0x47CDA6`: `call Battle_Mode5_PackRewards` (`0x4A6680`, `0x626`,
476 insns, unique xref), then — **outside** its body —
`mode_Battle_AnimationState = 4` @ `0x47CDAB` and `mode_StateGlobal = 100`
@ `0x47CDB4`.

`Battle_Mode5_PackRewards` packs display buffers only (no `0x494D40` call):
24 item entries (`ITEM_RELATED`), 8 card entries (`BATTLE_CARD_DROP`,
`| 0x100`, `0xFF` terminated), XP for 3 slots, GF AP for 16. Internal
widget/text layout not unrolled instruction by instruction (open, below).

## Reward Menu (Presentation)

`FFBattleModule` @ `0x47D150`: if `exit_battle` and `AnimationState == 4`,
installs `BattleRewardMenu_MainLoop` (`0x4A2690`, 127 insns) as the next
module loop; else `FFModuleHandler_main_loop`. The menu renders frames
until `sub_4A3D10` returns nonzero, then switches to `FFModuleHandler`,
calls `Gfx_DestroyTexturePageSlots` and clears `AnimationState`.

`POST_BATTLE_GF_ID_QUEUE` (`0x1CFF6E4`, 3 entries, `0xFF` = empty):
`FFModuleHandler` @ `0x470BA9` opens up to 3 post-combat GF menus
(`menu_id = gf_id + 5` @ `0x470BFE`).

## Open Questions

- Internal packing layout of `Battle_Mode5_PackRewards` (buffers, misc texts).
- Accumulator layouts for Gil/items/cards/AP (`BCI_GF_AP_EARNED`).
- `Battle_Mode5_PackRewards` callers beyond `0x47CDA6`: none found (unique xref).
