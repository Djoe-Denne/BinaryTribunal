---
title: Battle Slot And Command Layouts
category: references
tags: [ff8, runtime-memory, battle-system, reference]
aliases: [slot layout, pending action layout, command IDs, status bits]
sources:
  - docs/tech/reference/battle_slot_layout.md
  - docs/tech/reference/pending_action.md
  - docs/tech/reference/status_bits.md
  - docs/tech/reference/command_id_table.md
  - docs/tech/reference/kernel_tables.md
  - docs/tech/reference/battle_action_resolve.h
  - obsidian-docs/_staging/investigations/targeting_system_2026-06-09.md
  - obsidian-docs/_staging/investigations/exec_queue_layout_2026-06-09.md
  - obsidian-docs/_staging/investigations/command_id_draw_item_confirmation.md
  - obsidian-docs/_staging/investigations/status_bits_and_interactions.md
  - obsidian-docs/_staging/investigations/atb_auto_command_masks.md
  - obsidian-docs/_staging/investigations/timed_status_expiry_2026-06-09.md
  - obsidian-docs/_staging/investigations/2026-06-09_prompt20_bulk_kernel_gf_id_confirmation.md
  - obsidian-docs/_staging/investigations/gf_charge_absorption.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/blocked/draw-command-id.md
summary: Compact layout and ID reference for slots, timers, target masks, pending triplets, exec queue cells, status bits, command IDs, and GF kernel metadata.
provenance:
  extracted: 0.88
  inferred: 0.07
  ambiguous: 0.05
created: 2026-06-02T16:37:00+02:00
updated: 2026-08-08T16:40:00+02:00
---

# Battle Slot And Command Layouts

This page is the compact reference for runtime layouts that feed [[projects/re-ff8/concepts/battle-state-model]], [[projects/re-ff8/concepts/command-action-pipeline]], and [[projects/re-ff8/concepts/damage-status-pipeline]].

## Battle Slot Layout

- Base: `BATTLE_SLOT_DATA` at `0x1D27B10`.
- Stride: `0xD0` / 208 bytes.
- Count: 11 slots.
- Assignment: 0-2 party, 3-7 enemies, 8-10 GF-related reserved slots.

High-signal fields:

- `+0x08 status_2`, `+0x0C status_2_copy`
- `+0x10 max_atb`, `+0x14 cur_atb`
- `+0x18 current_hp`, `+0x1C max_hp`
- `+0x44 elem_def[8]`
- `+0x54 timer[16]`
- `+0x7C flag_data`, `+0x7E immunity_flag_data`
- `+0x80 status_1`, `+0x82 status_1_copy`
- `+0x84 target_info_mask`
- `+0x90 mental_res[...]`
- `+0xB8/+0xB9` transient per-slot IDs flushed during cleanup, exact semantic labels still open ^[ambiguous]
- `+0xBC level`, `+0xC1 spd`, `+0xCA crisis_level`

`target_info_mask` should no longer be read as the live command target selector. Current evidence places it in auxiliary action state and active GF charge absorption; the authoritative command target is the encoded `target_mask` carried through pending and exec storage.

## Timer Bank

The first fourteen timer entries form the currently mapped timed-status bank:

| `timer[]` | Status |
| --- | --- |
| `0` | Sleep |
| `1` | Haste |
| `2` | Slow |
| `3` | Stop |
| `4` | Regen |
| `5` | Protect |
| `6` | Shell |
| `7` | Reflect |
| `8` | Aura |
| `9` | Curse-like crisis suppressor ^[inferred] |
| `10` | Doom |
| `11` | Invincible-family timer |
| `12` | Gradual Petrify |
| `13` | Float |

Disabled timers use the sentinel `-1111`. `timer[14]` and `timer[15]` still have no confirmed status-subsystem mapping.^[ambiguous]

## Pending Action Storage

The active tick does not consume just three global 8-byte pending records. It walks three slot-local pending blocks:

- `0x1D28D44`
- `0x1D28D5C`
- `0x1D28D74`

Each block is `24` bytes and contains three dense-prefix 8-byte entries:

```c
typedef struct FF8BattlePendingActionEntry {
    unsigned __int16 target_mask;
    unsigned __int8 attacker_slot;
    unsigned __int8 command_id;
    unsigned __int8 command_arg;
    unsigned __int8 aux_5;
    unsigned __int8 aux_6;
    unsigned __int8 active;
} FF8BattlePendingActionEntry;
```

So the active-frame pending footprint is `72` bytes total.

## Exec Queue Storage

The exec queue is a grouped linked structure, not just the bytes visible at the first alias:

- `3` queue groups
- `11` linked cells per group
- `24` bytes per cell
- `2` packed subrecords per cell
- `3` target masks per subrecord

`BATTLE_EXEC_QUEUE_BYTES` at `0x1D288E8` and `BATTLE_EXEC_QUEUE_TARGET_MASKS` at `0x1D288EE` are only aliases into the first cell of the first group.

Direct special or script records reuse the same storage with `command_id = 0xFF` and interpret the `command_arg` word as a special or script section ID instead of a normal menu command.

## Target Mask Control Flags

| Value | Meaning |
| --- | --- |
| low bits `0x00FF` | slot-selection bits |
| `0x2000` | random-target control |
| `0x4000` | revive or dead-target style alternate eligibility path ^[inferred] |
| `0x8000` | group-mask selector |
| `0x8007` | all party |
| `0x80F8` | all enemy |
| `0x80FF` | everyone |

See [[projects/re-ff8/concepts/targeting-system]] for the helper graph and Cover or reroll behavior.

## Status Bits

### `status_1`

| Mask | Status |
| --- | --- |
| `0x0001` | Death / KO |
| `0x0002` | Poison |
| `0x0004` | Petrify |
| `0x0008` | Blind / Darkness |
| `0x0010` | Silence |
| `0x0020` | Berserk |
| `0x0040` | Zombie |

### `status_2`

| Mask | Status |
| --- | --- |
| `0x00000001` | Sleep |
| `0x00000002` | Haste |
| `0x00000004` | Slow |
| `0x00000008` | Stop |
| `0x00000020` | Protect |
| `0x00000040` | Shell |
| `0x00000080` | Reflect |
| `0x00000100` | Aura |
| `0x00000200` | crisis suppressor, likely Curse ^[inferred] |
| `0x00000400` | Regen ^[inferred] |
| `0x00000800` | invulnerability-family bit ^[ambiguous] |
| `0x00002000` | Float |
| `0x00004000` | Confuse |
| `0x00010000` | Eject |
| `0x00020000` | Double |
| `0x00040000` | Triple |
| `0x00080000` | invulnerability-family bit ^[ambiguous] |
| `0x00100000` | invulnerability-family bit ^[ambiguous] |
| `0x02000000` | Angel Wing |
| `0x40000000` | HAS_MAGIC |
| `0x80000000` | GF Summoning |

Useful composite masks:

- `0x00004001` = `Sleep | Confuse`
- `0x00004009` = `Sleep | Stop | Confuse`
- `0x02004000` = `Confuse | Angel Wing`
- `0x02004009` = `Sleep | Stop | Confuse | Angel Wing`

## Command IDs

- `0x01` — Attack
- `0x02` — Magic
- `0x03` — GF
- `0x04` — Item
- `0x06` — Draw candidate; conflicts with an older `0x04` fixture and remains
  blocked until a live pending-write capture resolves the byte. ^[ambiguous]

Resolver-time `COMMAND_TYPE_ID` values differ from pending `command_id`; GF resolve uses `0xFE`. Initial [[projects/re-ff8/concepts/limit-break-architecture]] selections still enter the ordinary pending-action path before later follow-up families diverge.

## GF Command Args And Kernel GF Table

- `K_GF_JUNCTIONABLE` base: `0x1CF4DC0`
- stride: `0x84` / 132 bytes
- count: `16`
- indexing rule: `gf_index = command_arg - 0x40`

The junctionable range remains contiguous from `0x40` Quezacotl through `0x4F` Eden. High-signal fields are:

- `+0x04 magicID`
- `+0x06 attackType`
- `+0x07 gfPower`
- `+0x0A attackFlags`
- `+0x0D element`
- `+0x0E statuses0`
- `+0x10 statuses1`
- `+0x1B statusAttackEnabler`
- `+0x82 powerMod`
- `+0x83 levelMod`

The base address, stride, and indexing rule are now locked down. A fresh raw 16-row payload dump from this session is still blocked because the static IDB view did not expose concrete live bytes at the table base.^[ambiguous]

## Related

- [[projects/re-ff8/concepts/targeting-system]]
- [[projects/re-ff8/concepts/timed-status-expiry]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/skills/battle-re-verification]]
