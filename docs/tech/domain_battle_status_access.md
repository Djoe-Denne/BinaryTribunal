Status Access Map (Battle Slots)
================================

Scope: reads/writes reachable from `main::FFBattleDirector_battleLoop` (0x47CCB0).
This is an architectural map of **where** `FF8BattleSlotData_s.status_1` (0x80) and
`FF8BattleSlotData_s.status_2` (0x08) are accessed. No bit meaning is inferred here.

Key fields
----------
- `BATTLE_SLOT_DATA[slot].status_2` @ 0x08
- `BATTLE_SLOT_DATA[slot].status_1` @ 0x80

Read map (who tests status_1/status_2)
-------------------------------------

ATB gating / readiness
- `domain::BattleATB_TickAndReady` (0x4842B0)
  - Behavior: gates ATB increment and ready transition based on status flags
    adjacent to `cur_atb` (struct layout aligns to status fields).
  - Evidence: `if ( (*(_BYTE *)(p_cur_atb - 3) & 9) == 0 && (v10 & 4) == 0 )`

Action arbitration / turn selection
- `domain::BattleArbitration_SelectNextAction` (0x485460)
  - Behavior: skips queued actions when slot is disabled.
  - Evidence: `if ( (BATTLE_SLOT_DATA[v6].status_1 & 4) == 0 && (BATTLE_SLOT_DATA[v6].status_2 & 9) == 0 )`

Alive/targetability checks
- `howManyCharaNotDeadOrPetrify` (0x4860A0)
  - Behavior: finds first party slot not dead/petrify.
  - Evidence: `(*(_BYTE *)pointer_status_1 & STATUS1_DEATH_PETRIFY) != 0`
- `howManyMonsterNotDeadOrPetrify` (0x4860D0)
  - Behavior: finds first monster slot not dead/petrify.
  - Evidence: `while ( (*(_BYTE *)monster_status & 5) != 0 )`

Targeting / AI predicates
- `checkTargetHasStatus` (sub_48A900 @ 0x48ABD1)
  - Behavior: AI/target checks on status_1/status_2 bitmasks and HP thresholds.
  - Evidence: `((unsigned __int16)BATTLE_SLOT_DATA[p_encounter_slot].status_1 & (1 << p_status_ai))`
  - Evidence: `((1 << (p_status_ai - 16)) & BATTLE_SLOT_DATA[p_encounter_slot].status_2)`
- `domain::BattleTarget_SelectByStatusOrStat` (0x486E70)
  - Behavior: builds a target mask by testing status_1/status_2 (and stat filters) across slots.
  - Evidence: `if (status < 16) test status_1 bit; else test status_2 bit`
- `domain::BattleTarget_IsEligibleByStatus` (0x4877B0)
  - Behavior: eligibility gate using status_1/status_2 masks.
  - Evidence: `if ((status_1 & 5) != 0 || (status_2 & 0x4009) != 0) return 0`
- `domain::BattleTarget_IsEligibleByStatusMask` (0x48EDA0)
  - Behavior: eligibility gate using combined status_1/status_2 masks.
  - Evidence: `(status_1 & 0x25) == 0 && (status_2 & unk_2004009) == 0`

Damage/curative modifiers
- `Battle_ApplyDamageOrHeal` (0x494410)
  - Behavior: reads status_1/status_2 for stop/KO/eject handling and special reactions.
  - Evidence: `if ( (BYTE1(target_status_2) & STATUS2_STOP) != 0 )`
  - Evidence: `else if ( (BATTLE_SLOT_DATA[p_target_slot_id].status_1 & 4) != 0 )`
- `computeCurativeMagic` (0x4932A3)
  - Behavior: reads status_2 for reflect/shell and status_1 for zombie/death gating.
  - Evidence: `SLOBYTE(BATTLE_SLOT_DATA[p_target_slot_id].status_2) >= 0`
  - Evidence: `if ( (BATTLE_SLOT_DATA[p_target_slot_id].status_2 & STATUS2_SHELL) != 0 )`
  - Evidence: `if ( (v10 & 4) != 0 ) v9 = 0;`
- `BattleAction_ResolveAndApplyDamage` (0x48FE20)
  - Behavior: reads status for command-specific rules (e.g., doom/shot/combines).
  - Evidence: `if ( (BATTLE_SLOT_DATA[p_target_slot_id].status_1 & 0x40) == 0 )`
  - Evidence: `if ( (BATTLE_SLOT_DATA[attacker_slot_id].status_1 & 0x20) == 0 )`
- `domain::BattleStatus_MaskWithSlotStatus2` (0x506B50)
  - Behavior: masks input flags with slot status_2 before forwarding to helper.
  - Evidence: `a3 ^ (loc_880000 & (a3 ^ status_2))`

Special action gating (Angelo/Odin)
- `sub_482F80` (0x482F80)
  - Behavior: uses status_1/status_2 to decide eligible targets for special actions.
  - Evidence: `(BATTLE_SLOT_DATA[v1].status_1 & 5) == 0`
  - Evidence: `(BATTLE_SLOT_DATA[v1].status_2 & 0x4009) == 0`

Status-application gating
- `domain::BattleStatus_CanApplyHitStatus` (0x492AC0)
  - Behavior: blocks status application based on target status_1/status_2 masks.
  - Evidence: `(status_1 & 4) != 0 || (status_2 & 0x180800) != 0`
- `domain::BattleStatus_QueueActionIfStatusFlagged_TODO` (0x493110)
  - Behavior: gates queued action handling based on status_2 low byte/sign bit.
  - Evidence: `SLOBYTE(BATTLE_SLOT_DATA[a2].status_2) >= 0`

Battle end / reward cleanup
- `sub_494D40` (0x494D40)
  - Behavior: zeroes XP/AP when status_1 indicates dead/petrify.
  - Evidence: `if ( (*(_BYTE *)v9 & 5) != 0 ) { *v8 = 0; ... }`

Write map (who sets/clears status_1/status_2)
---------------------------------------------

Battle init / load
- `setMonsterInfoFromDatInfoSection` (0x48BBD0)
  - Behavior: initializes monster slot statuses and sets auto status flags.
  - Evidence: `BATTLE_SLOT_DATA[p_monster_slot_id].status_1 = STATUS1_NONE;`
  - Evidence: `BATTLE_SLOT_DATA[p_monster_slot_id].status_2 = STATUS2_NONE;`
  - Evidence: `BATTLE_SLOT_DATA[p_monster_slot_id].status_2 |= STATUS2_PROTECT;`
- `setBattleSlotData` (0x48B310)
  - Behavior: initializes party slot status_2 HAS_MAGIC flag.
  - Evidence: `BATTLE_SLOT_DATA[param_slot_id].status_2 = status_2;`
- `domain::Battle_InitPreemptiveBackAttackStatus` (0x48AFD0)
  - Behavior: applies preemptive/back-attack flags into status_2 at battle start.
  - Evidence: `*status_2 |= RELATED_TO_STATUS_8_38_ + 2`
- `domain::Battle_InitPartySlotStatusFromChar` (0x48B5F0)
  - Behavior: initializes party slot status_2 from character auto-status flags.
  - Evidence: `BATTLE_SLOT_DATA.status_2 = 0x80 / |= 0x20 / |= 0x40`

Status apply / clear entrypoints
- `checkDoubleStatusApply` (sub_491820 @ 0x4918C8)
  - Behavior: checks whether to apply status, then calls status helper.
  - Evidence: `RelatedToStatus1And2(p_target_slot_id, p_hit_status_1, p_hit_status_2);`
- `RelatedToStatus1And2` (0x48F160)
  - Behavior: clears status_1/status_2 bits using masks (and triggers sub-helpers).
  - Evidence: `BATTLE_SLOT_DATA[p_target_slot_id].status_1 &= ~p_status_1_mask_to_set;`
  - Evidence: `BATTLE_SLOT_DATA[target_slot_index].status_2 &= ~p_status_2_mask_to_set;`
- `domain::BattleStatus_ApplyHitStatus` (0x4914E0)
  - Behavior: resolves hit-status application; updates status_2 masks.
  - Evidence: `status_2 = BATTLE_SLOT_DATA[target].status_2; ... BATTLE_SLOT_DATA[target].status_2 = ...`
- `domain::BattleStatus_ApplyHitStatus_NoDrain` (0x492090)
  - Behavior: resolves hit-status application without drain side effects; updates status_2 masks.
  - Evidence: `status_2 = BATTLE_SLOT_DATA[target].status_2; ... BATTLE_SLOT_DATA[target].status_2 = ...`

KO/HP-threshold status updates
- `Battle_ApplyDamageOrHeal` (0x494410)
  - Behavior: updates KO and HP% status bits after HP changes.
  - Evidence: `BATTLE_SLOT_DATA[p_target_slot_id].status_1 &= 0xFCFFu;`
  - Evidence: `*(_BYTE *)pointer_status_0 |= 1u;`
- `domain::BattleAction_ResolveAndApplyStatusResult` (0x493D80)
  - Behavior: applies HP/status outcomes for action result and syncs status to slot.
  - Evidence: `computeStatusHP50Or25Percent(..., &BATTLE_SLOT_DATA[slot].status_1);`
  - Evidence: `domain::BattleStatus_ApplyAndSyncSlot(slot, status_1, status_2);`

Command-side status writes
- `BattleAction_ResolveAndApplyDamage` (0x48FE20)
  - Behavior: sets/forces status bits in some command branches.
  - Evidence: `BATTLE_SLOT_DATA[p_target_slot_id].status_2 |= STATUS2_EJECT;`
  - Evidence: `LOBYTE(BATTLE_SLOT_DATA[p_target_slot_id].status_1) |= 1u;`
- `domain::BattleStatus_ApplyAndSyncSlot` (0x493840)
  - Behavior: writes status_1/status_2, syncs copies, and handles death/eject side effects.
  - Evidence: `BATTLE_SLOT_DATA[slot].status_2 = ...;`
  - Evidence: `word_1D28E30[slot] = BATTLE_SLOT_DATA[slot].status_1_copy;`

Status tick / expiration
- `sub_483470` (0x483470)
  - Behavior: handles timed status expiration and sets status_1 bits on expiry.
  - Evidence: `*status_0_7 |= 4u;`
  - Evidence: `*(status_0_7 - 30) &= ~v5;` (clears a status mask tied to this timer)

Summon/slot cleanup
- `domain::BattleStatus_HandleSummonExit_TODO` (0x48E620)
  - Behavior: clears high-bit flag in status_2 and updates flags during summon exit.
  - Evidence: `status_2 = status_2 & 0x7FFFFFFF`
- `domain::BattleStatus_HandleEject_ResetSlot` (0x486C70)
  - Behavior: clears status_1 bit 0x20 during EJECT reset flow.
  - Evidence: `status_1 &= ~0x20`

Shared helpers (status utility)
------------------------------
- `RelatedToStatus1And2` (0x48F160)
  - Clears status_1/status_2 with provided masks; calls `sub_483340`/`sub_483370`
    for per-bit side effects.
- `computeStatusHP50Or25Percent` (0x494360)
  - Writes HP-threshold bits into `status_1` (called from `Battle_ApplyDamageOrHeal`
    and `setBattleSlotData`).

Notes
-----
- Some ATB gating checks in `domain::BattleATB_TickAndReady` reference status fields
  via `cur_atb`-relative offsets. The struct layout matches `status_1/status_2`, but
  the decompiler shows them as raw pointer arithmetic; treat as status reads.
- Status mirror (UI/overlay): `status_1_copy/status_2_copy` are updated via
  `domain::BattleStatus_UpdateSlotStatusCopy` (0x47E2D0) and queued variants
  `domain::BattleStatus_EnqueueStatusCopyUpdate` (0x47E250) and
  `domain::BattleStatus_EnqueueStatusCopyUpdateEx` (0x47E330). These READ
  authoritative status_1/status_2 and WRITE the copy fields with monster-flag
  adjustments.
- `domain::BattleMonster_GetAttackEntryFromInfo` (0x482950) was in the list but does
  not access status_1/status_2 (reads monster_info_section only).
