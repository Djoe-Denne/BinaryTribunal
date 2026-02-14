## Scope
ATB (time gauge) accumulation and readiness transition in battle.

## Key Function
- `domain::BattleATB_TickAndReady` (0x4842B0)
  - Called from `isBattle_HUDdisplay` (0x4A8772) each frame.
  - Iterates battle slots, increments ATB, clamps to max, and triggers ready state.

## Evidence (static)
Decompile of `domain::BattleATB_TickAndReady` shows:
- Per-slot loop over `BATTLE_SLOT_DATA` (stride 0xD0).
- Uses `BATTLE_SLOT_DATA.cur_atb`, `BATTLE_SLOT_DATA.max_atb`, `BATTLE_SLOT_DATA.spd`.
- Reads flag/status fields at offsets that map to `status_2`, `status_1`, and `flag_data`.
- Writes to `unk_1CFF180` for slots 0..2 (likely UI mirror of cur/max ATB).

## Storage (per-actor)
`FF8BattleSlotData_s` (size 0xD0) contains:
- `max_atb` @ 0x10 (DWORD)
- `cur_atb` @ 0x14 (DWORD)
- `flag_data` @ 0x7C (FF8BattleFlagData_e)
- `status_2` @ 0x08 (Status2Flags)
- `status_1` @ 0x80 (Status1Flag_e)
- `spd` @ 0xC1 (BYTE)

## ATB Increment (observed)
For each active slot, when eligible:
- Base increment is chosen from status_2 bits:
  - default = 10
  - if `(status_2 & 0x2)` then base = 15
  - if `(status_2 & 0x4)` then base = 5
- Final increment:
  - `cur_atb += base * K_MISC.atb_speed_multiplier * (spd + 30) / 100`
  - `spd` corresponds to `BATTLE_SLOT_DATA.spd` (offset 0xC1).

Notes:
- `status_2` bit meanings not confirmed yet; only the observed bit tests are listed.
- `K_MISC.atb_speed_multiplier` is a global scalar in the ATB formula.

## Readiness Transition (observed)
When `cur_atb >= max_atb`:
- `cur_atb` is clamped to `max_atb`.
- If eligibility checks pass (status/flag masks), the slot is transitioned to ready:
  - If `(status_1 & 0x20) != 0` **or** `(status_2 & 0x2004000) != 0`:
    - `sub_483EB0(slot)` is invoked (auto-creates a command).
    - `flag_data` is updated to include ready bit `0x4`.
  - Else:
    - If `(flag_data & 0x10) != 0`, set an alternate ready bit in `flag_data` high byte.
    - Otherwise call `presentation::BattleUI_EnqueueCommand(slot, 17, 128, 0)`.
    - `flag_data` is updated to include ready bit `0x8`.

Eligibility gates observed in code (exact meanings TBD):
- `flag_data & 1` must be set to process the slot.
- `status_1` bits `0x1` and `0x4` must be clear.
- `status_2 & 0x9` must be clear.
- `flag_data & 0x0C` must be clear before ready transition.

## UI Mirror (party slots)
While iterating slots 0..2, the function writes:
- `unk_1CFF180[slot].cur_atb = BATTLE_SLOT_DATA[slot].cur_atb`
- `unk_1CFF180[slot].max_atb = BATTLE_SLOT_DATA[slot].max_atb`
This likely backs the party ATB UI gauges.

## Open Verification Steps (live)
- Break on `domain::BattleATB_TickAndReady` and watch `BATTLE_SLOT_DATA[slot].cur_atb`.
- Modify `BATTLE_SLOT_DATA[slot].spd` in memory; confirm slope change in ATB increment.
- Identify exact `status_2`/`status_1` bit names (Haste/Slow/Stop/etc.) by toggling known statuses.
