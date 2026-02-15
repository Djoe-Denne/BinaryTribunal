# GF Catalog

Master table of all known GF summon chains. Replaces individual per-GF documents.

## Junctionable GFs

| GF | cmd_arg | effect_id | Entry | Init | Tick | Counter | Completion | Family | Confidence | Runtime |
|----|---------|-----------|-------|------|------|---------|------------|--------|------------|---------|
| Quezacotl | 0x40 | 116 | `0x6C3550` | `0x6C3640` | `0x6C3760` (driver) / `0x6C6660` (frame) | `0x6C3932` / `0x6C51F2` / `0x6C671D` | `0x6C3931` / `0x6C51F0` / `0x6C675D` | FamilyA | **96** (static) | Pending |
| Shiva | 0x41 | 185 | `0x5C0D50` | (inline in entry) | `0x5C7F50` | `0x5C7F8B` | Unknown | FamilyA | **92** (static) | Pending |
| Ifrit | 0x42 | 201 | `0xB25780` | `0xB257E0` | `0xB25DF0` | `0xB25DFA` | `0xB26004` | FamilyB | **100** | **PASS** (GF_IFRIT_001) |
| Siren | 0x43 | 95 | `0x739DA0` | `0x8DC540` (shared) | `0x739F40` | Unknown | Unknown | SharedInit | **95** (static) | Pending |
| Brothers | 0x44 | 205 | `0xAF4520` | (inline in entry) | `0xAF4B90` | `0xAF4B9A` | `0xAF4DA1` | Atypical | **75** | Tier-3 partial |
| Diablos | 0x45 | 325 | `0x654210` | Unknown | `0x654350` (driver) | `0x65459D` | `0x654595` | Unknown | **90** | **PASS** (GF_DIABLOS_001) |
| Carbuncle | 0x46 | 278 | `0x680C50` | `0x680C80` | `0x680DF0` | `0x6811C8` | `0x6811BE` | FamilyA | **95** (static) | Pending |
| Leviathan | 0x47 | 6 | `0xB58080` | (inline in entry) | `0xB586F0` | `0xB586FA` | `0xB58901` | Atypical | **75** | Tier-3 partial |
| Pandemona | 0x48 | 291 | `0x6ED250` | `0x6ED260` | `0x6ED350` | `0x6ED755` | `0x6ED749` | FamilyA | **95** | **PASS** (GF_PANDEMONA_001) |
| Cerberus | 0x49 | 203 | `0xB0C1A0` | (inline in entry) | `0xB0C820` | `0xB0C82A` | `0xB0CA31` | FamilyB | **High** | **PASS** (GF_CERBERUS_001) |
| Alexander | 0x4A | 204 | `0xAFFCA0` | (inline in entry) | `0xB00310` | `0xB0031A` | `0xB00521` | Atypical | **72** | Tier-3 partial |
| Doomtrain | 0x4B | 191 | `0x63E730` | (inline in entry) | `0x6472C0` | `0x6472D1` | Unknown | FamilyA | **80** | Tier-3 partial |
| Bahamut | 0x4C | 202 | `0xB189A0` | (inline in entry) | `0xB19010` | `0xB1901A` | `0xB19221` | Atypical | **72** | Tier-3 partial |
| Cactuar | 0x4D | 199 | `0x5A8750` | (inline in entry) | `0x5AA3A0` | `0x5AA3B1` | Unknown | Atypical | **75** | Tier-3 partial |
| Tonberry | 0x4E | 90 | `0x762360` | `0x8DC540` (shared) | `0x7624D0` | `0x7625F9` | `0x762611` | SharedInit | **95** | **PASS** (GF_TONBERRY_002) |
| Eden | 0x4F | 206 | `0xAE2DD0` | (inline in entry) | `0xAE3470` | `0xAE347A` | `0xAE3681` | Atypical | **70** | Tier-3 partial |

> **effect_id** is the index into `MagicList_Logic` (1-based). See [magic_effect_table.md](../reference/magic_effect_table.md) for the full dispatch architecture. Diablos has a thunk wrapper at `0x6541E0` in the table that forwards to the real entry at `0x654210`.

## Special / Non-Junctionable GFs

| GF | effect_id | Entry | Tick | Counter | Mechanism | Status |
|----|-----------|-------|------|---------|-----------|--------|
| Odin | 187 | `0x6472E0` | `0x64DD50` | `0x64DD61` | Auto-trigger (init only, 12.5% RNG) | FamilyA, **crashes on injection** |
| Griever | 69 | `0x6FE040` | Unknown | Unknown | Boss-only, non-summonable | Entry corrected (was `0x62B3F0`) |
| Gilgamesh (Zantetsuken) | 329 | `0x58DB10` | Unknown | Unknown | Auto-trigger; replaces Odin disc 3+ | Via `Tick_Special`, cmd 0xF5 |
| Gilgamesh (Masamune) | 330 | `0x58DCF0` | Unknown | Unknown | Gilgamesh variant 2 | Via `Tick_Special`, cmd 0xF5 |
| Gilgamesh (Excalibur) | 328 | `0x58D930` | Unknown | Unknown | Gilgamesh variant 3 | Via `Tick_Special`, cmd 0xF5 |
| Gilgamesh (Excalipoor) | 327 | `0x58D760` | Unknown | Unknown | Gilgamesh variant 4 (joke) | Via `Tick_Special`, cmd 0xF5 |
| Phoenix | 140 | `0x6A6430` | Unknown | Unknown | Party-wipe auto-trigger (bit 2, 25.1% RNG) | See Phoenix details below |
| Angelo Rush | 91 | via MagicList | Unknown | Unknown | Auto/counter (3 trigger paths) | See Angelo details below |
| Angelo Recover | 93 | via MagicList | Unknown | Unknown | Auto/counter heal | See Angelo details below |
| Angelo Reverse | 94 | via MagicList | Unknown | Unknown | Auto/counter revive | See Angelo details below |
| Angelo Search | 92 | via MagicList | Unknown | Unknown | Auto item find | See Angelo details below |
| ChocoFire | 97 | `0x729A60` | Unknown | Unknown | Chocobo/Boko variant | Entry mapped via table |
| ChocoFlare | 98 | `0x721860` | Unknown | Unknown | Chocobo/Boko variant | Entry mapped via table |
| ChocoMeteor | 99 | `0x717D30` | Unknown | Unknown | Chocobo/Boko variant | Entry mapped via table |
| ChocoBocle | 100 | `0x70D390` | Unknown | Unknown | Chocobo/Boko variant; SharedInit pattern | Entry mapped via table |

> **Griever correction**: The previously listed entry `0x62B3F0` was a mid-function address inside `sub_62B1C0` (a rendering utility). The actual Griever summon cinematic entry is `MAG_069_GRIEVER_SUMMON` at `0x6FE040` (thunk to `0x6FE050`), confirmed by callees: `BdLinkTask`, `BS_Memset`, `Battle_PlayCameraAnimation`.
>
> **Gilgamesh** now confirmed present in `MagicList_Logic` with 4 variants (effect_ids 327–330). Dispatched via `BattleActionSequence_Tick_Special` (`0x50B830`) with command type `0xF5`. The variant is selected randomly when triggered.

## Odin / Gilgamesh Auto-Trigger Details

### SG_ODIN_ANGEL_GILGA_FLAG (0x1CFE97A)

| Bit | Value | Meaning | Set by |
|-----|-------|---------|--------|
| 1 | 0x02 | Has Odin | `SETODIN` script opcode |
| 3 | 0x08 | Has Gilgamesh | MonsterAI opcode 54 (clears bit 1 simultaneously) |

### Odin (bit 1: 0x02)

- **When**: Battle init only (`mode_3_subsubsubstep == 3`)
- **Function**: `ZANTETSUKEN_sub_482DF0` (0x482E00)
- **Gate**: All enemies must lack death immunity (Reflect stat < 200)
- **RNG**: 32/255 ≈ 12.5% per battle
- **Result**: `RELATED_ODIN_SUMMONED = 0` → effect_id 187 → `0x6472E0`

### Gilgamesh (bit 3: 0x08)

- **When**: Battle init (3.1%) OR per-frame tick (4.7% per tick, once per battle)
- **Init function**: `related_odin_summ_probability` (0x4831F0)
- **Tick function**: `domain::AngeloOdin_SpecialActionTick` (0x482F80)
- **Variant selection**: `GetRandomInt() % 4` → values 7–10 (Zantetsuken/Masamune/Excalibur/Excalipoor)
- **One-shot**: `byte_1D28E1D` flag prevents re-trigger within same battle

### Story Transition (MonsterAI opcode 54)

In the Seifer disc-3 boss battle, the AI script executes opcode 54, which clears bit 1 (Odin) and sets bit 3 (Gilgamesh). After this point, Odin can never trigger again and Gilgamesh takes over.

See [magic_effect_table.md](../reference/magic_effect_table.md#odin--gilgamesh-auto-trigger-mechanism) for the full technical breakdown.

## Phoenix Auto-Trigger Details

### SG_ODIN_ANGEL_GILGA_FLAG bit 2 (0x04): Phoenix enabled

Set permanently when Phoenix Pinion (item 0x1F) is used in battle. In `getText` at `0x48D2F8`:
```c
if (item_id == 0x1F)
    SG_ODIN_ANGEL_GILGA_FLAG |= 0x04;
```

### Party-Wipe Interception: `sub_486450` (0x486450)

Called every frame from battle loop. Scans all 3 party slots; if all dead/petrified, calls `Phoenix_BattleFrame_TriggerCheck`. If Phoenix fails, initiates game-over.

### Trigger Function: `Phoenix_BattleFrame_TriggerCheck` (0x483270)

- **Condition 1**: At least one enemy alive
- **Condition 2**: At least one party member exists and is not petrified
- **Condition 3**: `SG_ODIN_ANGEL_GILGA_FLAG & 0x04` (Phoenix flag set)
- **Condition 4**: `COMBAT_SCENE_ID != 317`
- **RNG**: `isRandomProbaNumDen255(64, 255)` → **64/255 ≈ 25.1%**
- **Result**: `RELATED_ODIN_SUMMONED = 1` → effect_id 140

Phoenix does NOT have a spontaneous per-frame trigger. It only fires on party wipe.

### Cinematic Path

Action type 7 → `pre_MonsterAI` case 7 → `getText(slot, 0xF5, 1, target)` → `K_NONJ_GF_ATTACK[1].magicID = 140` → `Tick_Special` → `BattleGF_LoadCallbackByMagicID(140)` → `MagicList_Logic[139]` = `0x6A6300` → entry fn `0x6A6430`.

Revive (clear KO + restore HP) resolved through standard damage/status pipeline in `Battle_ApplyDamageOrHeal`.

## Angelo Variant Details

### Prerequisites

- Rinoa must be in the party (`com_file_id == 4`)
- Bit 4 (0x10) of `SG_ODIN_ANGEL_GILGA_FLAG` must NOT be set (suppresses Angelo)

### Ability Flags: `SG_ANGELO_COMPLETED` (0x1CFE772)

| Bit | Value | Ability | Set via script case |
|-----|-------|---------|---------------------|
| 0 | 0x01 | Angelo Rush | Default |
| 1 | 0x02 | Angelo Recover | Case 20 |
| 2 | 0x04 | Angelo Reverse | Case 21 |
| 3 | 0x08 | Angelo Search | Case 22 |

### Three Trigger Paths

**Path 1 — Per-frame auto-trigger** (`AngeloOdin_SpecialActionTick`, 0x482F80):
Priority cascade: Recover (8/255) → Reverse (8/255) → Rush-like (2/255) → Search (8/255).
Queued via `SpecialGF_QueueActionToExecQueue(slot, 8, 0)`. Cooldown: `word_1D28DE4 = K_MISC.dead_timer`.

**Path 2 — Turn counter** (`sub_482E80`, 0x482E80, called from `pre_MonsterAI`):
When Rinoa takes a turn: Recover (16/255) or Rush (16/255). Calls `sub_483400` directly.

**Path 3 — Damage counter** (`sub_482F10`, 0x482F10, called from `Battle_ApplyDamageOrHeal`):
When enemy attacks Rinoa: Angelo Reverse (32/255 ≈ 12.5%).

### Cinematic Path

Action type 8 → `pre_MonsterAI` case 8 → `getText(slot, 0xF0, variant, target)` → `K_NONJ_GF_ATTACK[variant].magicID` → `Tick_Special` → `BattleGF_LoadCallbackByMagicID(effect_id)`.

### Variant Index Mapping

| Index | effect_id | Angelo Ability | Command type |
|-------|-----------|----------------|-------------|
| 11 | 91 | Angelo Rush | 0xF0 |
| 12 | 93 | Angelo Recover | 0xF0 |
| 13 | 94 | Angelo Reverse | 0xF0 |
| 14 | 92 | Angelo Search | 0xF0 |

See [magic_effect_table.md](../reference/magic_effect_table.md#angelo-variant-system) for the full technical breakdown.

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
