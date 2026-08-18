# Kernel Tables

Metadata tables used by `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) to populate per-hit globals.

Authenticated offline source (2026-08-18): the English Steam `main.fs` entry `kernel.bin`, 37,992 bytes, SHA-256 `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`. Its section header proves Magic `3420 = 57 * 60` bytes and battle Item `792 = 33 * 24` bytes. The unrelated loose file `D:\Modding\ff8\kernel.bin` has a different hash and is not used as authority. Full extraction record: [[projects/re-ff8/references/kernel-bin-authenticated-tables]].

## K_GF_JUNCTIONABLE

Base: `0x1CF4DC0` (confirmed from Cerberus analysis). Stride: 132 bytes (0x84). 16 entries (indices 0-15).

Index computation: `gf_index = command_arg - 64` (e.g., Ifrit 0x42 → index 2, Cerberus 0x49 → index 9).

### Struct Fields

| Offset | Size | Field | Populated Global |
|--------|------|-------|-----------------|
| 6 | 1 | `attackType` | Dispatch key for `Damage_ComputeRawDeltaFromAttackType` |
| 7 | 1 | `gfPower` | Damage formula input (0 = support GF) |
| 10 | 1 | `attackFlags` | `ATTACK_FLAG` |
| 11 | 1 | `unknown2` | `HIT_TYPE_TARGET_ANIMATION_TO_PLAY` |
| 13 | 1 | `element` | `HIT_ELEMENT` |
| 14 | 2 | `statuses0` | `HIT_STATUS_1` |
| 16 | 4 | `statuses1` | `HIT_STATUS_2` |
| 27 | 1 | `statusAttackEnabler` | `HIT_ATTACK_ENABLER` (0xFF = guaranteed) |
| 130 | 1 | `powerMod` | GF power modifier |
| 131 | 1 | `levelMod` | GF level modifier |

### Known Entry: Cerberus (Index 9, at 0x1CF5264)

| Field | Value | Meaning |
|-------|-------|---------|
| `attackType` | 11 (0x0B) | Magical GF type |
| `gfPower` | 0 | No damage (support GF) |
| `element` | 0x00 | Non-elemental |
| `statuses0` | 0x0000 | No status_1 |
| `statuses1` | 0x00060000 | Double (bit 17) + Triple (bit 18) |
| `statusAttackEnabler` | 0xFE (254) | Near-guaranteed |

## K_MAGIC

Base: `0x1CF4064`. Stride: 60 bytes (`0x3C`). **57 entries**, now proved both by the authenticated `kernel.bin` section length and by `K_GF_JUNCTIONABLE` (`0x1CF4DC0`) − `K_MAGIC` = `0xD5C`. Typed in IDA 2026-08-18 as `FF8KernelMagicData[57]`. Contents are runtime-loaded BSS in the IDB, so shipped values come from the authenticated archive rather than `get_bytes` on the IDB.

Resolver (`BattleAction_ResolveAndApplyDamage` `0x48FE20`) for `COMMAND_TYPE_ID` in `{2, 6, 16, 247}`:

| Offset | Size | Field | Populated global |
|--------|------|-------|------------------|
| 6 | 1 | `animationTriggered` | `HIT_TYPE_TARGET_ANIMATION_TO_PLAY` (second switch; Magic/Slot/247) |
| 7 | 1 | `attackType` | `Damage_ComputeRawDeltaFromAttackType` |
| 8 | 1 | `spellPower` | formula power |
| 0xB | 1 | `attackFlags` | `ATTACK_FLAG` |
| 0xE | 1 | `element` | `HIT_ELEMENT` |
| 0x10 | 4 | `statuses1` | `HIT_STATUS_2` |
| 0x14 | 2 | `statuses0` | `HIT_STATUS_1` |
| 0x16 | 1 | `statusAttackEnabler` | `HIT_ATTACK_ENABLER` |

`HIT_ATTACK_HITPERCENT` is **not** taken from `K_MAGIC`. Draw uses `drawResist` at `+0xC` in `Draw_ComputeStealCount` (`0x48FD20`). See [[projects/re-ff8/references/g11-g20-static-readiness-ledger]].

## K_ITEM, K_BATTLE_COMMAND_ABILITY, K_ENEMY_ATTACK

`K_ITEM` (`0x1CF7778`) is `FF8KernelBattleItem` stride `0x18`, 33 battle rows until `K_NON_BATTLE_ITEM` (`0x1CF7A90`). Resolver cmd `{4,13}` loads `HIT_ATTACK_HITPERCENT` from `attackParam` (unlike Magic). `ITEM_TENT` bound is immediate `0x21` in `BS_ParseItems`. Field names `unknown2`/`attackFlags` are swapped versus Magic at resolve (SQ-G12-002).

`K_BATTLE_COMMAND_ABILITY` and `K_ENEMY_ATTACK` follow similar patterns. See `reference/battle_action_resolve.c` and the G19 inventory in the static ledger.
