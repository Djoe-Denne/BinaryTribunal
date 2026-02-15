# GF Catalog

Master table of all known GF summon chains. Replaces individual per-GF documents.

## Junctionable GFs

| GF | cmd_arg | Entry | Init | Tick | Counter | Completion | Family | Confidence | Runtime |
|----|---------|-------|------|------|---------|------------|--------|------------|---------|
| Quezacotl | 0x40 | `0x6C3550` | `0x6C3640` | `0x6C3760` (driver) / `0x6C6660` (frame) | `0x6C3932` / `0x6C51F2` / `0x6C671D` | `0x6C3931` / `0x6C51F0` / `0x6C675D` | FamilyA | **96** (static) | Pending |
| Shiva | 0x41 | `0x5C0D50` | (inline in entry) | `0x5C7F50` | `0x5C7F8B` | Unknown | FamilyA | **92** (static) | Pending |
| Ifrit | 0x42 | `0xB25780` | `0xB257E0` | `0xB25DF0` | `0xB25DFA` | `0xB26004` | FamilyB | **100** | **PASS** (GF_IFRIT_001) |
| Siren | 0x43 | `0x739DA0` | `0x8DC540` (shared) | `0x739F40` | Unknown | Unknown | SharedInit | **95** (static) | Pending |
| Brothers | 0x44 | `0xAF4520` | (inline in entry) | `0xAF4B90` | `0xAF4B9A` | `0xAF4DA1` | Atypical | **75** | Tier-3 partial |
| Diablos | 0x45 | `0x654210` | Unknown | `0x654350` (driver) | `0x65459D` | `0x654595` | Unknown | **90** | **PASS** (GF_DIABLOS_001) |
| Carbuncle | 0x46 | `0x680C50` | `0x680C80` | `0x680DF0` | `0x6811C8` | `0x6811BE` | FamilyA | **95** (static) | Pending |
| Leviathan | 0x47 | `0xB58080` | (inline in entry) | `0xB586F0` | `0xB586FA` | `0xB58901` | Atypical | **75** | Tier-3 partial |
| Pandemona | 0x48 | `0x6ED250` | `0x6ED260` | `0x6ED350` | `0x6ED755` | `0x6ED749` | FamilyA | **95** | **PASS** (GF_PANDEMONA_001) |
| Cerberus | 0x49 | `0xB0C1A0` | (inline in entry) | `0xB0C820` | `0xB0C82A` | `0xB0CA31` | FamilyB | **High** | **PASS** (GF_CERBERUS_001) |
| Alexander | 0x4A | `0xAFFCA0` | (inline in entry) | `0xB00310` | `0xB0031A` | `0xB00521` | Atypical | **72** | Tier-3 partial |
| Doomtrain | 0x4B | `0x63E730` | (inline in entry) | `0x6472C0` | `0x6472D1` | Unknown | FamilyA | **80** | Tier-3 partial |
| Bahamut | 0x4C | `0xB189A0` | (inline in entry) | `0xB19010` | `0xB1901A` | `0xB19221` | Atypical | **72** | Tier-3 partial |
| Cactuar | 0x4D | `0x5A8750` | (inline in entry) | `0x5AA3A0` | `0x5AA3B1` | Unknown | Atypical | **75** | Tier-3 partial |
| Tonberry | 0x4E | `0x762360` | `0x8DC540` (shared) | `0x7624D0` | `0x7625F9` | `0x762611` | SharedInit | **95** | **PASS** (GF_TONBERRY_002) |
| Eden | 0x4F | `0xAE2DD0` | (inline in entry) | `0xAE3470` | `0xAE347A` | `0xAE3681` | Atypical | **70** | Tier-3 partial |

## Special / Non-Junctionable GFs

| GF | Entry | Tick | Counter | Mechanism | Status |
|----|-------|------|---------|-----------|--------|
| Odin | `0x6472E0` | `0x64DD50` | `0x64DD61` | Auto-trigger (battle start, RNG check) | FamilyA, **crashes on injection** |
| Griever | `0x62B3F0` | Unknown | Unknown | Boss-only, non-summonable | Unstable in tests |
| Gilgamesh | Unknown | Unknown | Unknown | Replaces Odin disc 3+, uses `Tick_Special` | **Unmapped** |
| Phoenix | Unknown | Unknown | Unknown | Auto on party wipe + Phoenix Pinion | **Unmapped** |
| Chocobo/Boko | Unknown | Unknown | Unknown | Item command (0x04), PocketStation companion | **Unmapped** |

## Runtime Evidence Summary

| GF | Test ID | Date | Key Confirmations |
|----|---------|------|-------------------|
| Ifrit | GF_IFRIT_001 | 2026-02-14 | 7/7 PASS; cmd_arg=0x42, callback ptr confirmed, tick+counter hit |
| Diablos | GF_DIABLOS_001 | 2026-02-14 | PASS; cmd_arg=0x45, gravity HP reduction, COMMAND_TYPE_ID=0xFE |
| Cerberus | GF_CERBERUS_001 | 2026-02-14 | PASS; cmd_arg=0x49, Double+Triple applied, 0 damage (support GF) |
| Doomtrain | GF_DOOMTRAIN_001 | 2026-02-14 | PASS; multi-status, damage pipeline confirmed |
| Siren | GF_SIREN_001/002 | 2026-02-14 | PASS; Silence infliction confirmed |
| Pandemona | GF_PANDEMONA_001 | 2026-02-15 | PASS; cmd_arg=0x48, pending transfer hit, enemy HP decreased |
| Tonberry | GF_TONBERRY_002 | 2026-02-15 | PASS; tick+counter+completion all confirmed |

## Per-GF Global Ranges (IDA Rename Coverage)

| GF | Global Address Range | Prefix |
|----|---------------------|--------|
| Ifrit | `0x2796E18 – 0x2796E4C` | `GF_100Ifrit_*` |
| *(shared)* | `0x27973B8 – 0x2797624` | `g_GfCinematic_*` |
| Quezacotl | `0x25216D8 – 0x25217AC` | `GF_116Quezacotl_*` |
| Pandemona | `0x2556258 – 0x25562F4` | `GF_200Pandemona_*` |
| Cerberus | `0x2796DA8 – 0x2798219` | `GF_203Cerberus_*` |

## Quezacotl Extended Chain (5-Level Task Architecture)

Quezacotl has the most complex task chain discovered so far:

1. `GF_116Quezacotl_InvokeSummonScript` (`0x6C3550`) — entry
2. `GF_116Quezacotl_InitSummonContext` (`0x6C3640`) — seeds state, schedules driver
3. `GF_116Quezacotl_SequenceTaskDriver` (`0x6C3760`) — schedules charge timeline
4. `GF_116Quezacotl_ChargeTimelineTask` (`0x6C3940`) — drives long cinematic, spawns frame ticks
5. `GF_116Quezacotl_FrameTick` (`0x6C6660`) — particle/camera micro-motion, returns completion

Three counter/completion sites across levels 3, 4, and 5.

## Siren/Tonberry Shared Init Discovery

Both use `BdLinkTask_CreateAndInitContext` (`0x8DC540`) — see `gforce/gf_shared_infra.md`.

The tick function is passed as argument 2:
- Siren: `GF_095Siren_SequenceTick` (`0x739F40`)
- Tonberry: `sub_7624D0` / `GF_090Tonberry_SequenceTick` (`0x7624D0`)

Tonberry counter: `0x7625F9` (`inc word ptr [ctx+0x24]`), completion: `0x762611` (`mov eax, 2; retn`).
