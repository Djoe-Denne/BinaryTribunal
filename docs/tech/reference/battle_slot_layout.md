# Battle Slot Layout

## `FF8BattleSlotData_s` (size 0xD0 / 208 bytes)

Base address: `BATTLE_SLOT_DATA` at `0x1D27B10`. Eleven slots total (indices 0-10), stride 0xD0.

Slot assignment: 0-2 = party members, 3-10 = enemy slots (not all active in every battle).

| Offset | Size | Field | Semantics |
|--------|------|-------|-----------|
| `+0x08` | 4 | `status_2` | Status2 flags (see `reference/status_bits.md`) |
| `+0x10` | 4 | `max_atb` | ATB gauge maximum |
| `+0x14` | 4 | `cur_atb` | ATB gauge current value |
| `+0x18` | 4 | `current_hp` | Current hit points |
| `+0x1C` | 4 | `max_hp` | Maximum hit points |
| `+0x7C` | 4 | `flag_data` | `FF8BattleFlagData_e` — readiness, eligibility, slot-type bits |
| `+0x80` | 2 | `status_1` | Status1 flags (see `reference/status_bits.md`) |
| `+0x84` | 2 | `target_info_mask` | Targeting metadata |
| `+0xC1` | 1 | `spd` | Speed stat (drives ATB accumulation) |
| `+0xCA` | 1 | `crisis_level` | Limit Break crisis level (0-4) |

## Slot Address Computation

```
slot_address = 0x1D27B10 + slot_id * 0xD0
```

For example: slot 3 (first enemy) = `0x1D27B10 + 3 * 0xD0` = `0x1D27E20`.

## `flag_data` Bits (Observed)

| Bit | Mask | Meaning |
|-----|------|---------|
| 0 | `0x01` | Slot is active/processable |
| 2 | `0x04` | Ready (auto-command path) |
| 3 | `0x08` | Ready (normal menu path) |
| 4 | `0x10` | Alternate ready bit (high byte) |

## BattleContext Abstraction

There is no single heap `BattleContext*` root object. Battle state is a **global-backed state cluster** in the `0x1D27xxx-0x1D28xxx` region. See `investigation/battle_state_reconstruction.md` for the full conceptual aggregate model.
