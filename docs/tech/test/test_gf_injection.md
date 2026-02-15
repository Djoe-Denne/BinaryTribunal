# Test: GF Injection Protocol

## Validates
`gforce/gf_catalog.md` — Injection and observation for all junctionable GFs.

## Shared Protocol

For each GF:
1. Sync to ATB tick (`0x4842B0`)
2. Write 8 bytes to `0x1D28D44`: `08 80 00 03 XX 00 00 01` (XX = command_arg)
3. Arm breakpoints: `bp_pending_transfer` (`0x4847F0`), `bp_gf_cinematic` (`0x50B2A0`), GF-specific entry/tick/counter
4. Continue execution
5. Assert: pending transfer hit, `GF_CALLBACK_PTR` == expected entry, tick/counter hit, damage/status applied

## Per-GF Test Matrix

| GF | cmd_arg | Injection Bytes | Entry BP | Tick BP | Expected Effect |
|----|---------|-----------------|----------|---------|-----------------|
| Quezacotl | 0x40 | `08 80 00 03 40 00 00 01` | `0x6C3550` | `0x6C3760` | Thunder damage |
| Shiva | 0x41 | `08 80 00 03 41 00 00 01` | `0x5C0D50` | `0x5C7F50` | Ice damage |
| Ifrit | 0x42 | `08 80 00 03 42 00 00 01` | `0xB25780` | `0xB25DF0` | Fire damage |
| Siren | 0x43 | `08 80 00 03 43 00 00 01` | `0x739DA0` | `0x739F40` | Silence status |
| Brothers | 0x44 | `08 80 00 03 44 00 00 01` | `0xAF4520` | `0xAF4B90` | Earth damage |
| Diablos | 0x45 | `08 80 00 03 45 00 00 01` | `0x654210` | `0x654350` | Gravity damage |
| Carbuncle | 0x46 | `08 80 00 03 46 00 00 01` | `0x680C50` | `0x680DF0` | Reflect on party |
| Leviathan | 0x47 | `08 80 00 03 47 00 00 01` | `0xB58080` | `0xB586F0` | Water damage |
| Pandemona | 0x48 | `08 80 00 03 48 00 00 01` | `0x6ED250` | `0x6ED350` | Wind damage |
| Cerberus | 0x49 | `08 80 00 03 49 00 00 01` | `0xB0C1A0` | `0xB0C820` | Double+Triple |
| Alexander | 0x4A | `08 80 00 03 4A 00 00 01` | `0xAFFCA0` | `0xB00310` | Holy damage |
| Doomtrain | 0x4B | `08 80 00 03 4B 00 00 01` | `0x63E730` | `0x6472C0` | Multi-status |
| Bahamut | 0x4C | `08 80 00 03 4C 00 00 01` | `0xB189A0` | `0xB19010` | Non-elemental |
| Cactuar | 0x4D | `08 80 00 03 4D 00 00 01` | `0x5A8750` | `0x5AA3A0` | Fixed damage |
| Tonberry | 0x4E | `08 80 00 03 4E 00 00 01` | `0x762360` | `0x7624D0` | Chef's Knife |
| Eden | 0x4F | `08 80 00 03 4F 00 00 01` | `0xAE2DD0` | `0xAE3470` | Non-elemental (long cinematic!) |

## Important Notes

- Use `idc.patch_dbg_byte` (NOT `ida_dbg.write_dbg_memory`) for the active flag
- Progressive BP deletion: delete each BP after it serves its purpose to avoid frame-traps
- Assert on memory state, not BP timing
- Eden has an extremely long cinematic — increase all timeouts to 120s
- For support GFs (Cerberus, Carbuncle): check party `status_2` delta instead of enemy HP
