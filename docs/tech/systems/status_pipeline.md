# Status Application Pipeline

## Key Architecture: Two-Layer Write Model

Status application is split into a **gating layer** (can this status land?) and an **execution layer** (write the bits, handle side effects, sync the mirror). These are separate functions with separate callers, not a monolithic write.

## Pipeline Flow

```
Hit resolved (damage computed) → Status Payload Population → Gating → Resolution → Commit → Post-Action
```

### 1. Status Payload Population

`BattleAction_ResolveAndApplyDamage` (`0x48FE20`) reads kernel tables based on `COMMAND_TYPE_ID` and populates:

- `HIT_STATUS_1` (u16) — status_1 mask to attempt
- `HIT_STATUS_2` (u32) — status_2 mask to attempt
- `HIT_ATTACK_ENABLER` (u8) — application probability (0xFF = always)

Source table per command type: see `reference/command_id_table.md`.

### 2. Application Gating

`BattleStatus_CanApplyHitStatus` (`0x492AC0`) — pure predicate, returns 0 (blocked) if:

- `status_1 & 0x04` (Petrify) — petrified targets cannot receive ANY status
- `status_2 & 0x180800` (Invulnerability flags)

This gate applies to ALL statuses including beneficial ones. Whether support spells bypass it via a separate path is unconfirmed.

### 3. Hit-Status Resolution

`BattleStatus_ApplyHitStatus` (`0x4914E0`) resolves `HIT_STATUS_1/2` against target state:

- Calls `checkDoubleStatusApply` (`0x4918C8`) — mutual exclusion, double-apply prevention, opposing-status cancellation
- Calls `RelatedToStatus1And2` (`0x48F160`) — bitwise clear/set on `status_1/status_2`, triggers per-bit side effects via `sub_483340`/`sub_483370`

Drain-free variant: `BattleStatus_ApplyHitStatus_NoDrain` (`0x492090`) — same logic, skips HP drain.

### 4. Commit and Sync

`BattleStatus_ApplyAndSyncSlot` (`0x493840`):
1. Writes final `status_1`/`status_2` to `BATTLE_SLOT_DATA[slot]`
2. Syncs UI mirror via `BattleStatus_UpdateSlotStatusCopy` (`0x47E2D0`)
3. Handles death/eject side effects

### 5. Post-Action

`BattleAction_ResolveAndApplyStatusResult` (`0x493D80`):
- Calls `computeStatusHP50Or25Percent` (`0x494360`) for HP-threshold status bits
- Final sync via `BattleStatus_ApplyAndSyncSlot`

## Status Writes Outside the Hit Pipeline

| Context | Function | What it does |
|---------|----------|--------------|
| Battle init | `setMonsterInfoFromDatInfoSection` (`0x48BBD0`) | Monster innate statuses |
| Battle init | `Battle_InitPartySlotStatusFromChar` (`0x48B5F0`) | Auto-Haste, Auto-Protect from abilities |
| HP trigger | `Battle_ApplyDamageOrHeal` (`0x494410`) | KO bit on HP=0 |
| Timer expiry | `sub_483470` | Timed status clear, Gradual Petrify → Petrify |
| Direct write | `BattleAction_ResolveAndApplyDamage` | Eject, instant-death in specific branches |
| GF cleanup | `BattleStatus_HandleSummonExit_TODO` (`0x48E620`) | Clears GF summoning bit |

## Remaining Gaps

- Mutual exclusion rules in `checkDoubleStatusApply` (Haste/Slow, Sleep/Berserk pairs)
- How `HIT_ATTACK_ENABLER` interacts with target SPR for status hit/miss probability
- Per-bit side-effect semantics in `sub_483340`/`sub_483370` (ATB reset on Stop, animation state, timer init)
- Whether beneficial statuses bypass `CanApplyHitStatus`
- Timed status duration initialization site

For complete status bit assignments, see `reference/status_bits.md`.
