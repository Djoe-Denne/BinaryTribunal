# Kernel Tables

Metadata tables used by `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) to populate per-hit globals.

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

## K_MAGIC, K_ITEM, K_BATTLE_COMMAND_ABILITY, K_ENEMY_ATTACK

These follow similar patterns with status fields at different offsets. See `reference/battle_action_resolve.c` for the exact field reads per `COMMAND_TYPE_ID` switch case.
