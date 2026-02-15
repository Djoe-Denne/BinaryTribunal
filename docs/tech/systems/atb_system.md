# ATB System

## Key Function

`domain::BattleATB_TickAndReady` (`0x4842B0`) — called from `BattleUI_InputPollAndMenuState` (`0x4A8772`) each frame.

## ATB Increment

Per-slot, per-frame:

```
base = 10  (default)
base = 15  if status_2 & 0x2  (Haste)
base = 5   if status_2 & 0x4  (Slow)

cur_atb += base * K_MISC.atb_speed_multiplier * (spd + 30) / 100
```

Where `spd` is `BATTLE_SLOT_DATA[slot].spd` at offset `+0xC1`.

## Eligibility Gates

A slot is processed only when:
- `flag_data & 0x01` is set (slot is active)
- `status_1 & 0x01` is clear (not dead)
- `status_1 & 0x04` is clear (not petrified)
- `status_2 & 0x09` is clear (not sleeping or stopped)
- `flag_data & 0x0C` is clear (not already in ready state)

## Readiness Transition

When `cur_atb >= max_atb`:

- `cur_atb` clamped to `max_atb`
- If `status_1 & 0x20` (Berserk) OR `status_2 & 0x2004000`:
  - Auto-command path: `Battle_ProcessAutoCommand(slot)` — creates a command automatically
  - `flag_data |= 0x04` (auto-ready)
- Else:
  - Normal menu path: `BattleUI_EnqueueCommand(slot, 17, 128, 0)` (`0x4AD620`)
  - `flag_data |= 0x08` (menu-ready)

## UI Mirror

For party slots 0-2, writes `cur_atb`/`max_atb` to `BATTLE_ATB_UI_MIRROR` (`0x1CFF180`) to drive the ATB gauge display.
