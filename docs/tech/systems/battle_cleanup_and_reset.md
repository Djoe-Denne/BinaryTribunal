# Battle Cleanup and Reset

R0 2026-09-12: end-of-battle cleanup proven at the disassembly
(triplet R0.3, parent spot-checks). `Battle_EndCleanupAndTransition` is
**domain only** (no gfx calls).

## End Detection

Five checks latch `BATTLE_RESULT_CODE` (`0x1CFF6E7`) during the active tick
and register `Battle_EndSetTransitionTimer` (`0x47DFC0`) as a callback:

| Check | VA | Result | `BATTLE_END_TYPE` |
|---|---|---|---|
| Scripted end | `0x4863F0` | — | — |
| Party wipe | `0x486450` | 1 | 3 |
| Timer expiry | `0x486390` | — | — |
| All enemies dead (victory) | `0x486500`/`0x48655F` | 4 | 0 or 1 (`ENCOUTER_BATTLE_FLAG & 2`) |
| Escape | `0x4862A0`/`0x486369` | 2 | 2 |

Victory and escape also call `BattleEnd_DistributeXpAp` (`0x494D40`) here.

## `Battle_EndCleanupAndTransition` (`0x4868C0`, 90 insns)

1. Loop 3 slots (stride `0xD0`): copy HP and `status_1` (after
   `and word [esi], 0xFFDF` = clear Berserk `0x20` @ `0x4868EA`) to the
   savegame; `BattleItem_RefundStashedItems`.
2. Merge Equal items into `SG_ITEM_ID_AND_QUANTITY`.
3. Switch `dec BATTLE_RESULT_CODE`, table `0x4869F4`:
   - 1, 3 → `inc SG_UNUSED_IN_FIELD_1`, `mode_StateGlobal = 100`;
   - 2 → `inc SG_BATTLE_ESCAPED`, `mode = 5`;
   - 4 → `inc SG_BATTLE_VICTORY_COUNT`, `scene.battle_flags & 0x10` →
     100 if set else 5 (`neg/sbb/and 0x5F/add 5`);
   - 5 → `mode = 100` (no counter).
4. Common tail: stop all SFX, `mode_Battle_AnimationState = 0`, vibrate init.

The director then runs mode 5 (`Battle_Mode5_PackRewards`, see
`rewards.md`) or mode 100 (`exit_battle = 1`, module switch).

## Exit System (Presentation)

`FFBattleExitSystem` (`0x47CEF0`): restores resolution/viewport and calls
`Gfx_DestroyTexturePageSlots` (96 TPage teardown). Runs as the battle
module *exit* during the switch to the reward menu or `FFModuleHandler`.

## Debug Path (Not Rewards)

Director mode 4 @ `0x47CCCA` loads `btitle.ovl` and jumps to
`Battle_HiddenDebug` (`0x47EEF0`). Never part of the reward flow.

## Open Questions

- Exhaustive reset list of battle transient bytes/latches.
- `Status_TickAndExpire` (`0x483470`) spec (durations, Gradual Petrify).
