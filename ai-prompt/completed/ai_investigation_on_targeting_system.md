## Task: Clarify the Complete Battle Targeting System

### Setup For You

- Start from a stable active battle, after initialization and before any injected command is consumed.
- Keep at least one party member and two or more enemies alive so single-target, all-target, and random-target behavior can be distinguished.
- Prepare examples for Attack, Magic, GF, and if possible Double/Triple or an all-target spell.
- Pause at or sync to `BattleATB_TickAndReady` (`0x4842B0`) before arming targeting and pending-action breakpoints.

### Context

The command and damage pipelines already show that actions carry a `target_mask`, then fan out through resolver code before damage/status application. The remaining gap is the complete target-selection layer: mask decoding, eligible target filtering, multi-target iteration, Double/Triple handling, and random target choice.

### Known Anchors

- Pending action record: `target_mask` u16 at `BATTLE_PENDING_ACTION_BUFFER + 0x0`.
- Slot field: `BATTLE_SLOT_DATA[slot].target_info_mask` at offset `+0x84`.
- `BattlePendingAction_Write` at `0x484D20`.
- `BattlePendingAction_TransferToExecQueue` at `0x4847F0`.
- `BattleAction_ResolveTargetAndHitCount` / multi-target fan-out around `0x48EA93`.
- Boosted GF target iteration around `0x4850FA`.
- Renzokuken finisher target iteration around `0x48F350`.
- Target eligibility reads `status_1`, `status_2`, `flag_data`, and visibility/targetability state.

### Investigation Steps

1. Trace the lifetime of `target_mask` from command creation to final per-target damage/status calls.
2. Decode each target-mask bit or special value, including party, enemy, self, all, random, and dead-target cases.
3. Identify where target eligibility is applied and record which statuses/flags remove a slot from the candidate set.
4. Separate command targeting defaults from runtime target expansion.
5. Confirm how Double/Triple iterates targets and how random targeting chooses a slot.
6. Compare player commands, enemy AI commands, GF commands, and Limit Break callers.

### Runtime Evidence Plan

- Break on `0x484D20`, `0x4847F0`, `0x48EA93`, `0x4850FA`, and `0x48F350`.
- Capture pending bytes, exec queue bytes, target slot IDs, and final `Battle_ApplyDamageOrHeal` calls.
- Run one single-target spell, one all-target spell, Double/Triple, a random-target command, and one GF summon.

### Expected Output

1. Target-mask reference table with bit meanings and special-case encodings.
2. Target eligibility predicate table by status/flag.
3. Caller matrix: Attack, Magic, Draw, Item, GF, Limit Break, enemy AI.
4. Function graph from target write to per-target resolution.
5. Recommended doc updates for `docs/tech/systems/command_pipeline.md`, `damage_pipeline.md`, and target-related references.
