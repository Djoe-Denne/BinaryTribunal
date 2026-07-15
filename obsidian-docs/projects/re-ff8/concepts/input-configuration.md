---
title: Input Configuration
category: concepts
tags: [ff8, runtime-memory, reverse-engineering, concept]
aliases: [keyboard config, button mapping, ff8input.cfg, controller config]
sources:
  - IDA static decompilation 2026-06-14 (Read_ff8input_cfg 0x498B50, Create_ff8input_cfg 0x498CB0, Input_ProcessInput 0x467D10, get_key_state 0x4685F0)
  - Live debugger read 2026-06-14 (keyboard binding table + savegame config block)
summary: FF8 PC reads its keyboard/joystick bindings from ff8input.cfg into per-function scancode tables, polls a 256-byte DirectInput keyboard buffer through get_key_state, and builds per-player button bitmasks each frame. A separate savegame block holds the PSX-button remap and gameplay config flags (including the Renzokuken auto-trigger and indicator options).
provenance:
  extracted: 0.9
  inferred: 0.07
  ambiguous: 0.03
created: 2026-06-14T10:20:00+02:00
updated: 2026-06-14T10:20:00+02:00
---

# Input Configuration

FF8 PC has two distinct configuration layers:

1. **The device-binding layer** (`ff8input.cfg`): which physical keyboard scancode / joystick button maps to each of the 14 logical game functions. This is what decides "which key fires the gunblade".
2. **The savegame gameplay-config layer** (`SG_CONFIG_*`): the PSX-button remap plus gameplay options (cursor memory, sound mode, the Renzokuken auto-trigger / indicator, etc.).

## ff8input.cfg — device bindings

The text file `ff8input.cfg` is read by `Read_ff8input_cfg` (`0x498B50`) and rewritten by `Create_ff8input_cfg` (`0x498CB0`). It has a `Keyboard` section then a `Joystick` section, each listing 14 numbered functions:

```text
Keyboard
1. "Select"   <scancode>
2. "Exit"     <scancode>
3. "Misc"     <scancode>
4. "Menu"     <scancode>
5. "Toggle"   <scancode>
6. "Trigger"  <scancode>   <-- Squall's gunblade / Renzokuken trigger
7. "RotLt"    <scancode>
8. "RotRt"    <scancode>
9. "Start"    <scancode>
10. "Select"  <scancode>
11. "Up"      <scancode>
12. "Down"    <scancode>
13. "Left"    <scancode>
14. "Right"   <scancode>
Joystick
... same 14 functions ...
```

`Read_ff8input_cfg` parses each line as `index. "name" value`, then stores the value into a per-function array using `index-1`:

- lines 1–14 → keyboard table `dword_1D2A2C8[0..13]` (`0x1D2A2C8`),
- lines 15–28 → joystick table `dword_1D2A290[0..13]` (`0x1D2A290`).

The stored keyboard value is a **DirectInput scancode (DIK code)**; the function returns success only when all 28 entries are read.

### Logical function index

| Index | Function | Keyboard slot | Notes |
| --- | --- | --- | --- |
| 0 | Select | `0x1D2A2C8` | OK / confirm |
| 1 | Exit | `0x1D2A2CC` | Cancel / back |
| 2 | Misc | `0x1D2A2D0` | |
| 3 | Menu | `0x1D2A2D4` | |
| 4 | Toggle | `0x1D2A2D8` | |
| 5 | **Trigger** | `0x1D2A2DC` | **Squall gunblade / Renzokuken hit trigger** |
| 6 | RotLt | `0x1D2A2E0` | camera rotate left |
| 7 | RotRt | `0x1D2A2E4` | camera rotate right |
| 8 | Start | `0x1D2A2E8` | |
| 9 | Select (2) | `0x1D2A2EC` | |
| 10–13 | Up / Down / Left / Right | `0x1D2A2F0..FC` | |

## Polling — DirectInput keyboard buffer

`Input_ProcessInput` (`0x467D10`) refreshes input each frame:

- `dword_1CD02D8` ← pointer to the **256-byte DirectInput keyboard state buffer** (one byte per scancode; high bit `0x80` = key down).
- `get_key_state(scancode)` (`0x4685F0`) is the generic read: `*(BYTE*)(dword_1CD02D8 + scancode) & 0x80`. It rejects scancodes `> 0xFF` and returns 0 if the buffer pointer is null.
- For each logical button it tests the bound scancode against the buffer and accumulates a per-player **button bitmask** at `dword_1CD01FC[28*player]`, with bit position = the logical function index (so **Trigger = bit 5 = `0x20`** in this raw mask).
- Edge/“just pressed” mask = `dword_1CD01F8[...] = current & ~(prev & current)`, with previous frame in `dword_1CD0204[...]`.

The raw per-player mask is later remapped into the PSX-style battle button bits consumed by the battle/menu code.

## Savegame config block (`SG_CONFIG_*`)

A separate savegame block holds the PSX-button remap and a config-flags word:

| Global | Address | Role |
| --- | --- | --- |
| `SG_CONFIG_FLAGS_SETTING` | `0x1CFE73C` | Packed gameplay-config flags (cursor memory, ATB mode, sound mode, etc.). Live: `0x20030`. |
| `SG_CONFIG_L2 … START` | `0x1CFE740..0x1CFE74B` | 12-byte PSX-button order map (`L2,R2,L1,R1,Triangle,Circle,Cross,Square,Select,?,?,Start`); default = sequential `1..12`. |

### Renzokuken-specific config flags

| Global | Address | Role |
| --- | --- | --- |
| `SG_RENZOKUKEN_AUTO` | `0x1CFE978` | **Bit 0 = auto-trigger** (game lands Renzokuken hits automatically). Higher bits of this word are reused as scratch option bits by the Config menu handler `sub_4CE080`. |
| `SG_RENZOKUKEN_INDICATOR` | `0x1CFE979` | Show/hide the on-screen trigger indicator (the timing prompt). |

See [[projects/re-ff8/concepts/renzokuken]] for how these flags gate the trigger window.

## Live-observed bindings (example)

Read live on 2026-06-14 from one running session. **These are user-specific and remappable** — the addresses are stable, the values are this player's keys:

| Function | Slot | Scancode | Key |
| --- | --- | --- | --- |
| Select | `0x1D2A2C8` | `0x20` | D |
| Exit | `0x1D2A2CC` | `0x2D` | X |
| Misc | `0x1D2A2D0` | `0x1E` | A |
| Menu | `0x1D2A2D4` | `0x11` | W |
| Toggle | `0x1D2A2D8` | `0x10` | Q |
| **Trigger** | `0x1D2A2DC` | `0x12` | **E** |
| RotLt | `0x1D2A2E0` | `0x2C` | Z |
| RotRt | `0x1D2A2E4` | `0x2E` | C |
| Start | `0x1D2A2E8` | `0x1F` | S |
| Select (2) | `0x1D2A2EC` | `0x21` | F |
| Up / Down / Left / Right | `0x1D2A2F0..FC` | `0xC8/0xD0/0xCB/0xCD` | arrows |

Config flags at the same moment: `SG_CONFIG_FLAGS_SETTING = 0x20030`, `SG_RENZOKUKEN_AUTO = 0` (manual), `SG_RENZOKUKEN_INDICATOR = 0` (hidden).

> [!tip] Reading "which key is the trigger" generically
> The gunblade trigger is always logical function index 5. Decode `read_u8(read_u32(0x1D2A2DC) DIK)` — i.e. read the dword at `0x1D2A2DC` and translate that DIK scancode to a key name.

## Related

- [[projects/re-ff8/concepts/renzokuken]]
- [[projects/re-ff8/concepts/limit-break-architecture]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]

## Runtime-Pending

- Full decode of the `SG_CONFIG_FLAGS_SETTING` bitfield (`0x20030`) into named options.^[ambiguous]
- The exact remap from the raw logical button mask (`dword_1CD01FC`) to the PSX-style battle button bits used by menu/battle code.^[inferred]
