---
title: Authenticated kernel.bin Magic and Item Tables
category: references
tags: [ff8, battle-system, reverse-engineering, kernel, evidence, reference]
aliases: [Authenticated K_MAGIC, Authenticated K_ITEM, G11 kernel matrix]
sources:
  - C:/Program Files (x86)/Steam/steamapps/common/FINAL FANTASY VIII/Data/lang-en/main.fs
  - C:/Program Files (x86)/Steam/steamapps/common/FINAL FANTASY VIII/Data/lang-en/main.fi
  - C:/Program Files (x86)/Steam/steamapps/common/FINAL FANTASY VIII/Data/lang-en/main.fl
  - D:/Modding/ff8/FF8GameData/fs/fsmanager.py
  - D:/Modding/ff8/FF8GameData/Resources/json/kernel_bin_data.json
summary: Hash-bound offline extraction of the shipped English Steam kernel Magic and battle Item sections used to close the G11 row count and spell-family matrix.
provenance:
  extracted: 0.97
  inferred: 0.02
  ambiguous: 0.01
created: 2026-08-18T14:00:13+02:00
updated: 2026-08-18T14:00:13+02:00
---

# Authenticated kernel.bin Magic and Item Tables

This is offline resource evidence, not a live promotion. The archive belongs to the installed English Steam build used with the supported EXE. Extraction used the existing FF8 FS/LZS reader and did not launch or modify the game.

## Source binding

| Resource | SHA-256 |
| --- | --- |
| `main.fs` | `0857360bc13c7c537fb5028a516c6aacf17735f6ec87b1543df42b580fe137df` |
| `main.fi` | `92a8644ab5fe0d9123d8f464525bcb247fd2d29f3c33bffbafabc1a60994b494` |
| `main.fl` | `05420e834db0dfaf1935e3c63d304c9e691aa3e745328cb1a20978cdb5464518` |
| extracted `kernel.bin` | `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6` |

The archive index reports entry 12 as `c:\ff8\data\eng\kernel.bin`, unpacked size 37,992. The extracted bytes match that size. A loose `D:\Modding\ff8\kernel.bin` also has size 37,992 but SHA-256 `f7db5cf62e7f45c7fae6acfa2ebea568ef3f5eb602996eae706947d05a0fc352`; it is therefore not used as evidence.

## Section closure

The kernel header contains little-endian section offsets. Data section 2 starts at `0x021C`, ends at `0x0F78`, and is exactly `0x0D5C = 3420 = 57 * 60` bytes. Battle Item section 8 starts at `0x3930`, ends at `0x3C48`, and is exactly `0x0318 = 792 = 33 * 24` bytes.

Consequences:

- `K_MAGIC` cardinality 57 and stride `0x3C` are authenticated; SQ-G11-002 is closed.
- `K_ITEM` cardinality 33 and stride `0x18` are authenticated.
- readers must still reject malformed IDs (`magic_id >= 57`, `item_id >= 33`) because the native resolver itself does not clamp them.

## Magic attack-type matrix

| attackType | Shipped Magic rows |
| ---: | --- |
| 0 | Nothing |
| 2 | Fire/Fira/Firaga; Blizzard family; Thunder family; Water, Aero, Bio; Holy, Flare, Meteor, Quake, Tornado, Ultima, Apocalypse; Regen; Protect/Shell/Reflect/Aura/Double/Triple/Haste/Slow/Stop/Blind/Confuse/Sleep/Silence/Break/Death/Drain/Pain/Berserk/Float/Zombie/Meltdown; Wall, Rapture, Catastrophe, The End |
| 3 | Cure, Cura, Curaga, Esuna, Dispel |
| 5 | Life |
| 6 | Full-life |
| 8 | Demi, Percent |
| 12 | Scan |
| 32 | Full-cure |

No shipped Magic row uses attack type 21. The dispatcher branch which calls `computeCurativeMagic(..., 8)` is nevertheless real and reachable by other metadata families; it simply is not a G11 Magic row.

Representative byte-bound fixtures:

| ID | Spell | attackType | power | defaultTarget | attackFlags | drawResist | hits | element | status enabler |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | Fire | 2 | 18 | `0x54` | `0x31` | 0 | 1 | `0x01` | 0 |
| 13 | Demi | 8 | 4 | `0x54` | `0x31` | 36 | 1 | 0 | 0 |
| 16 | Meteor | 2 | 20 | `0x46` | `0x21` | 42 | 10 | 0 | 0 |
| 21 | Cure | 3 | 18 | `0x14` | `0x71` | 0 | 1 | 0 | 0 |
| 24 | Life | 5 | 0 | `0x15` | `0xF1` | 20 | 1 | 0 | `0xFE` |
| 25 | Full-life | 6 | 0 | `0x15` | `0xF1` | 38 | 1 | 0 | `0xFE` |
| 33 | Double | 2 | 0 | `0x14` | `0x31` | 16 | 1 | 0 | `0xFE` |
| 34 | Triple | 2 | 0 | `0x14` | `0x31` | 36 | 1 | 0 | `0xFE` |
| 50 | Scan | 12 | 0 | `0x54` | `0x31` | 1 | 1 | 0 | 0 |
| 51 | Full-cure | 32 | 16 | `0x08` | `0x23` | 1 | 1 | 0 | `0xFF` |

## Battle Item attack-type matrix

| attackType | Shipped battle Item rows |
| ---: | --- |
| 0 | Nothing |
| 2 | Hero/Holy War families and Shell/Protect/Aura/Death/Holy/Flare/Meteor/Ultima Stones |
| 4 | Potion/Potion+/Hi-Potion/Hi-Potion+/Mega-Potion; Antidote, Soft, Eye Drops, Echo Screen, Holy Water, Remedy, Remedy+ |
| 5 | Phoenix Down, Mega Phoenix |
| 14 | Gysahl Greens, Phoenix Pinion, Friendship |
| 32 | X-Potion, Elixir, Megalixir |

The authenticated target-info bytes also disprove the former G12 consume theory as a general rule: Potion is `0x14`, Mega-Potion `0x04`, Phoenix Down `0x15`, and damaging stones use `0x44`/`0x46`/`0x54`. The `0x4000` tested before FindByCondition is actor `status_2` Confuse, not one of these one-byte kernel target fields or a target mask.

## Implementation boundary

This evidence is enough to build a bounds-checked semantic reader and deterministic single-cast G11 fixtures. It does not prove battle-init stock import, Dual/Triple consumption, normal player Item removal, or any live ownership/cadence claim. See [[projects/re-ff8/references/g11-g20-static-open-questions]] and [[projects/re-ff8/references/g11-g20-static-readiness-ledger]].
