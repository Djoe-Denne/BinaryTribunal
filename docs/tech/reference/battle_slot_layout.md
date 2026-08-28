# Battle Slot Layout

## `BATTLE_SLOT_DATA`

- Base address: `0x1D27B10`
- Stride: `0xD0` (208 bytes)
- Count: 11 slots (`0..10`)

### Slot assignment (confirmed)

- 0-2: party
- 3-7: enemies (up to 5 active)
- 8-10: GF-related slots (used during summoning / absorption mechanics)

## `FF8BattleSlotData_s` (size `0xD0`)

This is the central per-slot struct used by most battle subsystems (ATB, status, damage, AI VM, command menu, targeting).

Full layout is documented in `docs/tech/systems/battle_slot_data.md`. This page is a compact offset reference.

### High-signal offsets (confirmed)

| Offset | Size | Field | Notes / Primary writers |
|--------|------|-------|--------------------------|
| `+0x00` | 4 | `monster_info_section` | Enemy-only `**` to `.dat` section 6 (`0x50724C`, reader `0x48BBD0`) |
| `+0x04` | 4 | `monster_ai_section` | Enemy-only pointer (AI VM) |
| `+0x08` | 4 | `status_2` | Authoritative status_2 (`0x493840`) |
| `+0x0C` | 4 | `status_2_copy` | Mirror (`0x47E2D0`) |
| `+0x10` | 4 | `max_atb` | Init `0x484490` |
| `+0x14` | 4 | `cur_atb` | Tick `0x4842B0` |
| `+0x18` | 4 | `current_hp` | R/W `0x494410` |
| `+0x1C` | 4 | `max_hp` | Init (`0x48B310`, `0x48BBD0`) |
| `+0x44` | 16 | `elem_def[8]` | `__int16[8]` (party from junction, enemy = 10*ElemRes) |
| `+0x54` | 32 | `timer[16]` | Status timers; filled with sentinel on clear/death |
| `+0x7C` | 2 | `flag_data` | Often accessed as DWORD with `+0x7E` |
| `+0x7E` | 2 | `immunity_flag_data` | Gravity immunity etc. (`0x48BBD0`) |
| `+0x80` | 2 | `status_1` | Authoritative status_1 (`0x493840`) |
| `+0x82` | 2 | `status_1_copy` | Mirror (`0x47E2D0`) |
| `+0x84` | 2 | `target_info_mask` | GF shield HP tracking (see damage pipeline) |
| `+0x86` | 2 | `hit_status_1` | Party init (`0x48B310`) |
| `+0x90` | 0x28 | `mental_res` | Byte-addressed in code (see `battle_slot_data.md`) |
| `+0xBB` | 1 | `com_file_id` | `0xFF` = empty slot |
| `+0xBC` | 1 | `level` | |
| `+0xC1` | 1 | `spd` | **Authoritative SPD** used by ATB |
| `+0xCA` | 1 | `crisis_level` | Written by `0x4941F0` (party) |

## Slot Address Computation

```
slot_address = 0x1D27B10 + slot_id * 0xD0
```

Example: slot 3 = `0x1D27B10 + 3*0xD0` = `0x1D27D80`.

## `flag_data` Notes

`flag_data` is heavily used, but only some bit meanings are safely confirmed without a dedicated xref sweep. Prefer to treat it as an opaque bitfield unless you have the exact writer/reader in hand.

Confirmed init values:

- Party init (`0x48B5F0`): `*(_DWORD *)&slot.flag_data = 0x8801`
- Enemy init (`0x48BBD0`): `*(_DWORD *)&slot.flag_data = 0x0011`

## Related Docs

- `docs/tech/systems/battle_slot_data.md` (full struct layout + writers/readers)
- `docs/tech/reference/status_bits.md` (confirmed status_1/status_2 bits)
- `docs/tech/systems/atb_system.md` (ATB formula + gates)
