# Magic Effect Table (`MagicList_Logic`)

Master dispatch table for all battle visual effects in FF8.

## Architecture

`MagicList_Logic` at `0xC81774` is a **400-entry array of function pointers** (`int(__cdecl*)(int)[400]`). Each entry is the "logic" callback for a battle effect — magic spells, GF summon cinematics, enemy attacks, item animations, and boss cinematics all share this single table.

A companion array `MagicList_TextureLoad` at `0xC81DB8` stores matching `void(*)()` texture-loading callbacks (one per effect).

### Lookup Mechanism

`BattleGF_LoadCallbackByMagicID` at `0x50AF20` performs the lookup:

```c
int __cdecl BattleGF_LoadCallbackByMagicID(int magicID, int (__cdecl **a2)(int))
{
    int idx = magicID - 1;                    // 1-based → 0-based
    if (idx < 0 || idx >= 400) { error; idx = 0; }
    if (!MagicList_Logic[idx]) { error; idx = 0; }
    if (MagicList_TextureLoad[idx])
        MagicList_TextureLoad[idx]();         // null loader is valid
    *a2 = MagicList_Logic[idx];              // write entry fn to caller
}
```

The resolver does not invoke the Logic callback. It writes that pointer through
the out-parameter after resetting the shared arena. Invalid IDs and null Logic
entries both fall back to slot 0.

The `magicID` parameter is an **effect_id** (1-based), NOT a kernel GF ID or cmd_arg. The caller `BattleActionSequence_Tick_GF_Cinematic` (0x50B2A0) reads it from the action context:

```c
BattleGF_LoadCallbackByMagicID(
    *(uint16_t*)(g_GfSequenceContextSharedB + 6),  // effect_id
    &g_GfActiveCallbackPtr);
```

### Dispatch Flow

The full path from GF selection to cinematic playback:

1. Player selects GF summon (cmd_arg 0x40-0x4F identifies the GF in kernel data)
2. Battle system builds action context, writing the **effect_id** to context offset +6
3. `BattleActionSequence_DispatchTick` routes to `Tick_GF_Cinematic` from the
   sequence-type byte `payload[1]` (`0x26`, `0xF4`, `0xFE`)
4. State 1 calls `BattleGF_LoadCallbackByMagicID(effect_id, &g_GfActiveCallbackPtr)`
5. Function indexes `MagicList_Logic[effect_id - 1]` and writes the GF entry callback
6. State 3 invokes `g_GfActiveCallbackPtr(ctx)` to start the GF cinematic

The mapping from kernel GF ID (cmd_arg) to effect_id is read from kernel data at runtime. See [effect_id Source](#effect_id-source-resolved) below.

## GF Entries in MagicList_Logic

### Junctionable GFs

All 16 junctionable GFs confirmed present. Effect_ids are non-contiguous.

| cmd_arg | GF | effect_id | Index | Table Ptr | Entry Fn | Type |
|---------|----|-----------|-------|-----------|----------|------|
| 0x40 | Quezacotl | 116 | 115 | `0x6C3550` | `0x6C3640` | wrapper disp+0xE6 |
| 0x41 | Shiva | 185 | 184 | `0x5C0D50` | `0x5C0D50` | direct |
| 0x42 | Ifrit | 201 | 200 | `0xB25780` | `0xB25780` | direct |
| 0x43 | Siren | 95 | 94 | `0x739DA0` | `0x739DA0` | direct |
| 0x44 | Brothers | 205 | 204 | `0xAF4520` | `0xAF4520` | direct |
| 0x45 | Diablos | 325 | 324 | `0x6541E0` | `0x654210` | wrapper disp+0x26 |
| 0x46 | Carbuncle | 278 | 277 | `0x680C50` | `0x680C80` | wrapper disp+0x26 |
| 0x47 | Leviathan | 6 | 5 | `0xB58080` | `0xB58080` | direct |
| 0x48 | Pandemona | 291 | 290 | `0x6ED250` | `0x6ED260` | wrapper disp+0x06 |
| 0x49 | Cerberus | 203 | 202 | `0xB0C1A0` | `0xB0C1A0` | direct |
| 0x4A | Alexander | 204 | 203 | `0xAFFCA0` | `0xAFFCA0` | direct |
| 0x4B | Doomtrain | 191 | 190 | `0x63E730` | `0x63E730` | direct |
| 0x4C | Bahamut | 202 | 201 | `0xB189A0` | `0xB189A0` | direct |
| 0x4D | Cactuar | 199 | 198 | `0x5A8750` | `0x5A8750` | direct |
| 0x4E | Tonberry | 90 | 89 | `0x762360` | `0x762360` | direct |
| 0x4F | Eden | 206 | 205 | `0xAE2DD0` | `0xAE2DD0` | direct |

**Wrappers 14 octets (pas des thunks IDA, `FUNC_THUNK=0`)** : Diablos `0x6541E0` → init `0x654210` (`entry+0x30`, disp+0x26) est byte-identique à Carbuncle `0x680C50` → `0x680C80` ; Quezacotl `0x6C3550` → `0x6C3640` (disp+0xE6, sandwich) ; Pandemona `0x6ED250` → `0x6ED260` (`entry+0x10`, disp+0x06). Les 111 wrappers partagent le gabarit `mov/push/call rel32/add/ret` mais résolvent 111 inits distincts : hash ≠ équivalence. La texture Diablos charge `mag324.tim`.

### Special / Non-Junctionable GFs

| effect_id | GF/Effect | Table Ptr | Entry Fn | Notes |
|-----------|-----------|-----------|----------|-------|
| 69 | Griever Summon | `0x6FE040` | `0x6FE050` (wrapper disp+0x06) | Boss cinematic; calls BdLinkTask, BS_Memset |
| 140 | Phoenix (Rebirth Flame) | `0x6A6300` | `0x6A6430` (wrapper disp+0x126 sandwich) | Auto-trigger on party wipe + Phoenix Pinion |
| 187 | Odin | `0x6472E0` | `0x6472E0` | Auto-trigger (battle start RNG) |
| 97 | ChocoFire | `0x729A60` | — | Chocobo/Boko variant |
| 98 | ChocoFlare | `0x721860` | — | Chocobo/Boko variant |
| 99 | ChocoMeteor | `0x717D30` | — | Chocobo/Boko variant |
| 100 | ChocoBocle | `0x70D390` | — | Chocobo/Boko variant; uses SharedInit pattern |

### Gilgamesh Variants

Gilgamesh has 4 attack variants, all present in `MagicList_Logic`. They are dispatched via `BattleActionSequence_Tick_Special` (`0x50B830`) with command type `0xF5`.

| Variant | RELATED_ODIN_SUMMONED | effect_id | Index | Table Ptr | Entry Fn |
|---------|----------------------|-----------|-------|-----------|----------|
| Zantetsuken (Gilgamesh) | 7 | 329 | 328 | `0x58DB10` | `0x58DB10` |
| Masamune | 8 | 330 | 329 | `0x58DCF0` | `0x58DCF0` |
| Excalibur | 9 | 328 | 327 | `0x58D930` | `0x58D930` |
| Excalipoor | 10 | 327 | 326 | `0x58D760` | `0x58D760` |

## Key Globals

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0xC81774` | `MagicList_Logic` | `int(*)(int)[400]` | Effect logic callbacks (the dispatch table) |
| `0xC81DB8` | `MagicList_TextureLoad` | `void(*)(void)[400]` | Effect texture-loading callbacks |
| `0x1D99A50` | `g_GfSequenceContextSharedB` | `dword` (ptr) | Pointer to active action context struct |

### Action Context Struct Layout (pointed to by `g_GfSequenceContextSharedB`)

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| +0 | 1 | attacker_slot | Attacker slot index |
| +1 | 1 | sequence_type | Presentation-sequence routing byte (`0xFE`, `0x26`, `0xF4`, etc.); do not infer the domain command ID from this field alone |
| +2 | 1 | anim_state | Animation state byte |
| +4 | 2 | cmd_arg | Ability / GF kernel ID (u16) |
| +6 | 2 | effect_id | Effect ID indexing into MagicList_Logic (u16, 1-based) |
| +8 | 4 | event_records | First array of 24-byte result/presentation records |
| +12 | 4 | secondary_context | Action-family context |
| +16 | 1 | event_count | Number of records in the first group; also selects the two physical routes |
| +17 | 1 | group_count_minus_1 | Additional groups use a 20-byte descriptor stride |

## effect_id Source (Resolved)

### Junctionable GFs: `K_GF_JUNCTIONABLE.magicID`

The effect_id for junctionable GFs (cmd_arg 0x40–0x4F) is read from **kernel.bin section 14** at runtime.

- **Global**: `K_GF_JUNCTIONABLE` at `0x1CF4DC0` — 16 entries × 132 bytes each
- **Field**: `magicID` at struct offset **+0x04** (uint16)
- **Confirmed**: 16/16 entries match expected effect_ids

The lookup happens in `getText` (0x48D2F8), GF command processing case (case 3):

```c
int gf_index = cmd_arg - 0x40;            // 0-15
int byte_off = gf_index * 132;            // asm: ((idx << 5) + idx) << 2
uint16_t effect_id = K_GF_JUNCTIONABLE.magicID[byte_off];  // struct +0x04
```

This `effect_id` is written to the action context at offset +6, which `BattleGF_LoadCallbackByMagicID` later reads.

### Non-Junctionable GFs: `K_NONJ_GF_ATTACK_NAME_OFFSET.magicID`

For special actions (Odin, Gilgamesh, Angelo, Phoenix, Chocobo), the effect_id comes from a different kernel table.

- **Global**: `K_NONJ_GF_ATTACK_NAME_OFFSET` at `0x1CF7D28` — 15+ entries × 20 bytes each
- **Field**: `magicID` at struct offset **+0x02** (uint16)
- **Indexed by**: `RELATED_ODIN_SUMMONED` (0–14), the action variant number

The lookup happens in `getText` case 245/240 (command types 0xF5/0xF0):

```c
int variant = cmd_arg;                    // RELATED_ODIN_SUMMONED value
int byte_off = variant * 20;              // asm: (variant + variant*4) << 2
uint16_t effect_id = K_NONJ_GF_ATTACK_NAME_OFFSET.magicID[byte_off];  // struct +0x02
```

Full table of `K_NONJ_GF_ATTACK_NAME_OFFSET` entries:

| Index | Variant | magicID (effect_id) | Name |
|-------|---------|---------------------|------|
| 0 | Zantetsuken | 187 | Odin |
| 1 | Rebirth Flame | 140 | Phoenix |
| 2 | ChocoFire | 97 | Chocobo variant |
| 3 | ChocoFlare | 98 | Chocobo variant |
| 4 | ChocoMeteor | 99 | Chocobo variant |
| 5 | ChocoBocle | 100 | Chocobo variant |
| 6 | Angel Wing | 96 | Rinoa Limit Break |
| 7 | Zantetsuken (Gilgamesh) | 329 | Gilgamesh variant |
| 8 | Masamune | 330 | Gilgamesh variant |
| 9 | Excalibur | 328 | Gilgamesh variant |
| 10 | Excalipoor | 327 | Gilgamesh variant |
| 11 | Angelo Rush | 91 | Angelo attack (enemy) |
| 12 | Angelo Recover | 93 | Angelo heal (ally) |
| 13 | Angelo Reverse | 94 | Angelo revive (ally) |
| 14 | Angelo Search | 92 | Angelo item find (self) |

## Odin / Gilgamesh Auto-Trigger Mechanism

### Overview

Odin and Gilgamesh are special GFs that trigger automatically during battle based on RNG checks. They use **command type 0xF5**, which routes through `BattleActionSequence_Tick_Special` (0x50B830) instead of the normal GF cinematic path. The cinematic is still loaded via `BattleGF_LoadCallbackByMagicID` using the effect_id from `K_NONJ_GF_ATTACK_NAME_OFFSET`.

### Flag: `SG_ODIN_ANGEL_GILGA_FLAG` (0x1CFE97A)

| Bit | Value | Meaning | Set by |
|-----|-------|---------|--------|
| 1 | 0x02 | Has Odin | `SETODIN` script opcode (0x56DAE0) |
| 2 | 0x04 | Phoenix enabled | `getText` when Phoenix Pinion (item 0x1F) used in battle |
| 3 | 0x08 | Has Gilgamesh | MonsterAI opcode 54 (Seifer kills Odin; also clears bit 1) |
| 4 | 0x10 | Unknown (suppresses Angelo) | Script opcode (0x56DAC0) |
| 5 | 0x20 | Witch | `SETWITCH` script opcode (0x56DAA0) |

### Odin Trigger (Battle Init Only)

**Function**: `ZANTETSUKEN_sub_482DF0` (0x482E00), called during `mode_3_subsubsubstep == 3`.

1. Check `SG_ODIN_ANGEL_GILGA_FLAG & 0x02` (has Odin) — if not set, skip
2. Scan all enemies: if ANY has death immunity (Reflect stat ≥ 200), skip
3. RNG: `isRandomProbaNumDen255(32, 255)` → **32/255 ≈ 12.5%**
4. Set `RELATED_ODIN_SUMMONED = 0` (Zantetsuken variant → effect_id 187)
5. Queue action via `ODIN_sub_484710(target_slot, 7, 0)` into exec queue

Odin only triggers once at battle start. There is no per-frame re-roll for Odin.

### Gilgamesh Trigger (Battle Init + Per-Frame)

**Init function**: `related_odin_summ_probability` (0x4831F0), called during `mode_3_subsubsubstep == 3` (after Odin check).

1. Check `SG_ODIN_ANGEL_GILGA_FLAG & 0x08` (has Gilgamesh)
2. RNG: `isRandomProbaNumDen255(8, 255)` → **8/255 ≈ 3.1%**
3. Random variant: `GetRandomInt() % 4` → values 7–10 (Zantetsuken/Masamune/Excalibur/Excalipoor)
4. Set `GILGAMESH_ONESHOT_FLAG = 1` (blocks per-frame trigger)

**Per-frame function**: `domain::AngeloOdin_SpecialActionTick` (0x482F80), called during `mode_3_subsubsubstep == 4` every frame.

1. Cooldown: if `SG_AUTO_COOLDOWN_TIMER > 0`, decrement and return
2. Check `SG_ODIN_ANGEL_GILGA_FLAG & 0x08` AND `!GILGAMESH_ONESHOT_FLAG`
3. RNG: `isRandomProbaNumDen255(12, 255)` → **12/255 ≈ 4.7% per tick**
4. Random variant: same 7–10 selection
5. Set `GILGAMESH_ONESHOT_FLAG = 1` (one trigger per battle)

### Odin → Gilgamesh Story Transition

MonsterAI opcode 54 (triggered by the Seifer disc-3 battle script):
```c
SG_ODIN_ANGEL_GILGA_FLAG &= 0xFD;  // clear bit 1 (remove Odin)
SG_ODIN_ANGEL_GILGA_FLAG |= 0x08;  // set bit 3 (add Gilgamesh)
```

### Action Queue → Cinematic Path

1. Action queued with action type 7 via `ODIN_sub_484710` (0x484720) into exec queue
2. `pre_MonsterAI` (0x487640) case 7 picks it up, calls `Battle_QueueDirectAction(slot, 0xF5, variant, target)`
3. `getText` (0x48D2F8) case 245 reads `K_NONJ_GF_ATTACK_NAME_OFFSET.magicID[variant*20]` → effect_id
4. Action context built with `command_type=0xF5`, `cmd_arg=variant`, `effect_id=magicID`
5. `BattleActionSequence_DispatchTick` sees 0xF5 → `BattleActionSequence_Tick_Special`
6. `Tick_Special` state 1 calls `BattleGF_LoadCallbackByMagicID(effect_id, &GF_CALLBACK_PTR)`
7. `MagicList_Logic[effect_id - 1]` loads the cinematic entry function

## Phoenix Auto-Trigger Mechanism

### Overview

Phoenix (effect_id 140) auto-triggers on **party wipe** — when all 3 party members are dead or petrified. It does NOT have a spontaneous per-frame trigger like Gilgamesh. It only fires as a last-resort interception of the game-over sequence.

### Flag: Bit 2 (0x04) of `SG_ODIN_ANGEL_GILGA_FLAG`

Set permanently when a **Phoenix Pinion** (item ID `0x1F`) is used in battle. In `getText` (0x48D200), item processing checks `bx == 0x1F` and sets the flag:

```c
if (item_id == 0x1F)
    SG_ODIN_ANGEL_GILGA_FLAG |= 0x04;  // at 0x48D2F8
```

Once set, the flag persists in save data. Phoenix can auto-trigger in all subsequent battles.

### Party-Wipe Detection: `BattleFrame_PartyWipeCheck` (0x486450)

Called every frame from the battle loop (`mode_3_subsubsubstep == 4`). Flow:

1. If `BATTLE_GAMEOVER_FLAG != 0`, return (game-over already initiated)
2. If `BYTE1(ATTACKER_SLOT_ID_0) == 1`, return (action in progress)
3. Scan party slots 0–2 for any alive + non-dead + non-petrified member
4. If found → return (party not wiped)
5. **All party dead**: call `Phoenix_BattleFrame_TriggerCheck` (0x483270)
6. If Phoenix triggers → return (Phoenix will handle it)
7. If Phoenix fails → **initiate game-over**: display "Annihilated", set `BATTLE_GAMEOVER_FLAG = 1`

### Trigger: `Phoenix_BattleFrame_TriggerCheck` (0x483270)

1. `howManyMonsterNotDeadOrPetrify() == 255` → if no enemies alive, return 0 (battle won)
2. Scan party for any member that exists and is NOT petrified (dead is OK — Phoenix can revive)
3. Check `SG_ODIN_ANGEL_GILGA_FLAG & 0x04` (Phoenix flag)
4. Check `COMBAT_SCENE_ID != 317` (blocked in specific boss battle)
5. RNG: `isRandomProbaNumDen255(64, 255)` → **64/255 ≈ 25.1%**
6. Set `RELATED_ODIN_SUMMONED = 1` → effect_id 140
7. Queue via `SpecialGF_QueueActionToExecQueue(target_slot, 7, 0)`

### Cinematic Path

Same as Odin: action type 7 → `pre_MonsterAI` case 7 → `getText(slot, 0xF5, 1, target)` → `K_NONJ_GF_ATTACK_NAME_OFFSET[1].magicID = 140` → `Tick_Special` → `BattleGF_LoadCallbackByMagicID(140)` → `MagicList_Logic[139]` = `0x6A6300`.

### Revive Mechanism

The revive (clear KO status + restore HP) is resolved through the standard damage/status pipeline. `getText` processes the K_NONJ_GF_ATTACK parameters for Phoenix, which include status-clear flags and curative properties. The actual HP write occurs via `Battle_ApplyDamageOrHeal` (0x494410) during action resolution.

## Angelo Variant System

### Overview

Angelo is Rinoa's autonomous combat companion with 4 variants: Rush (attack), Recover (heal), Reverse (revive), and Search (item find). Angelo triggers through **three independent paths** — a per-frame auto-trigger, a turn-based counter, and a damage counter.

### Prerequisites

- **Rinoa in party**: `Battle_FindSlotByCharFileId(4)` scans for `com_file_id == 4`
- **Bit 4 (0x10) of `SG_ODIN_ANGEL_GILGA_FLAG` NOT set**: bit 4 suppresses all Angelo triggers

### Ability Flags: `SG_ANGELO_COMPLETED` (0x1CFE772)

| Bit | Value | Ability | Learned from |
|-----|-------|---------|-------------|
| 0 | 0x01 | Angelo Rush | Default / Pet Pals Vol.1 |
| 1 | 0x02 | Angelo Recover | Pet Pals Vol.2 |
| 2 | 0x04 | Angelo Reverse | Pet Pals Vol.4 |
| 3 | 0x08 | Angelo Search | Pet Pals Vol.5/6 |
| 5 | 0x20 | (higher ability) | Set via script case 23 |
| 6 | 0x40 | (higher ability) | Set via script case 24 |
| 7 | 0x80 | (higher ability) | Set via script case 25 |

### Path 1: Per-Frame Auto-Trigger (`AngeloOdin_SpecialActionTick`, 0x482F80)

Runs every frame during the main battle tick. After the Gilgamesh check, if Rinoa is in the party, a priority cascade selects the Angelo variant:

1. **Angelo Recover** (bit 1, `SG_ANGELO_COMPLETED & 2`): Scans for ally (not Rinoa) with HP-critical status. RNG: **8/255 ≈ 3.1%**. Target: ally selected by `BattleTarget_SelectByStatusOrStat`. Sets `RELATED_ODIN_SUMMONED = 12`.
2. **Angelo Reverse** (bit 2, `SG_ANGELO_COMPLETED & 4`): Checks if Rinoa is dead (`status_1 & 1`). RNG: **8/255 ≈ 3.1%**. Target: Rinoa. Sets `RELATED_ODIN_SUMMONED = 13`.
3. **Angelo Reverse (offensive)** (bit 2): If a non-Rinoa dead ally exists. RNG: **2/255 ≈ 0.78%**. Target: enemy. Sets `RELATED_ODIN_SUMMONED = 13`.
4. **Angelo Search** (bit 3, `SG_ANGELO_COMPLETED & 8`): Rinoa alive + no debuffs (`status_1 & 5 == 0`, `status_2 & 0x4009 == 0`). RNG: **8/255 ≈ 3.1%**. Target: Rinoa. Sets `RELATED_ODIN_SUMMONED = 14`.

Queued via `SpecialGF_QueueActionToExecQueue(slot, 8, 0)` with action type **8**.
Cooldown: `SG_AUTO_COOLDOWN_TIMER = K_MISC.dead_timer` after each check cycle.

### Path 2: Turn Counter (`Angelo_TurnCounter_TriggerCheck`, 0x482E80)

Called from `pre_MonsterAI` when a party slot takes a turn. If the acting slot is Rinoa:

1. **Angelo Recover** (bit 1): Ally has `HIBYTE(status_1) & 1` (HP critical). RNG: **16/255 ≈ 6.3%**. Target: ally. Command type `0xF0`.
2. **Angelo Rush** (bit 0): No condition on allies. RNG: **16/255 ≈ 6.3%**. Target: enemy via `Battle_SlotIndexToBitmask`. Command type `0xF0`.

Calls `Battle_QueueDirectAction(slot, 0xF0, variant, target)` directly (bypasses exec queue).

### Path 3: Damage Counter (`Angelo_DamageCounter_ReverseCheck`, 0x482F10)

Called from `Battle_ApplyDamageOrHeal` (0x494410) when damage is applied to a slot. Triggers Angelo Reverse as a defensive reaction:

- Attacker must be enemy (slot >= 3)
- Target must be Rinoa (`com_file_id == 4`)
- `SG_ANGELO_COMPLETED & 4` (Angelo Reverse learned)
- `COMBAT_SCENE_ID != 317` (not specific boss)
- RNG: **32/255 ≈ 12.5%**

Returns boolean; caller handles the action context setup.

### Cinematic Path

Angelo uses **command type 0xF0** (240) which shares the getText case 240/245 code path:

1. Action type 8 → `pre_MonsterAI` case 8 → `getText(slot, 0xF0, variant, target)`
2. getText reads `K_NONJ_GF_ATTACK_NAME_OFFSET[variant].magicID` → effect_id
3. `BattleActionSequence_DispatchTick` sees 0xF0 → `Tick_Special`
4. `Tick_Special` → `BattleGF_LoadCallbackByMagicID(effect_id)` → cinematic

| Variant Index | effect_id | Angelo Ability |
|---------------|-----------|----------------|
| 11 | 91 | Angelo Rush |
| 12 | 93 | Angelo Recover |
| 13 | 94 | Angelo Reverse |
| 14 | 92 | Angelo Search |

## Wave3 Static Arbitration (2026-09-10, PE+IDB)

Recensement confirmé : 343 Logic non nuls + 57 nuls (slots 223–224, 345–399), 343 TextureLoad non nuls sur le même masque, 686 cibles distinctes, 0 alias, 0 `FUNC_THUNK`, 0 départ invalide. Groupes byte-identiques 94 (disp+0x26) + 14 (disp+0x06) côté Logic, 17 `ret` côté TextureLoad ; relocation-aware : seul le groupe des 17 `ret`. Aucune des 686 entries ne contient de `call`/`jmp` indirect.

### 5 routes Logic (343, mutuellement exclusives)

| Route | n | Signature d’entry |
|---|---:|---|
| SharedInit | 82 | `BdLinkTask_CreateAndInitContext @ 0x8DC540`, 82 ticks uniques |
| FamilyB | 58 | `xorEAX_6` + `BdLinkTask_Register` + `BS_Memset(...,16,1)`, taille `0x5D` (Cerberus `0x62`) |
| Wrapper → init | 111 | 14 octets `mov/push/call rel32/add/ret`, disp `0x26` (94) / `0x06` (14) / sandwich 230-294-198 (115, 139, 273) |
| BdLink inline | 84 | `BdLinkTask_Register` sans xor ni SharedInit (Fire, Shiva, Cactuar dual-task, Doomtrain, Odin, Gilgamesh…) |
| Shot Irvine | 8 | 40 octets, slots 187,191–197, BdLink dans l’enfant `sub_5BE370` |

SharedInit n’est pas une famille GF (Cure, Double, items, Angelo, slot 345…). FamilyB n’est pas « GF jonctionnable » (7 GF + Meteor, Elvoret Death 18, Hell’s Judgement 75, Ultimecia death 77, Adel 211, Terra Break 219, 228–270, 331…). Les 58 FamilyB sont distinctes, en bijection avec les 58 paires `magN_b.00/.01`.

### Taxonomie TextureLoad (343)

1 appel → 265 (dont Phoenix étendu, voir ci-dessous), 2 appels → 58 (FamilyB), 0 appel `0x571B80` → 18 (17 `ret` + Cactuar alt), 3 appels → 1 (Tonberry slot 89 : `mag089_0/1/2.tim`), 5 appels → 1 (Devour slot 61 : `mag061_0us/1/2/3.tim` + `mag061.tim`). Total 265+58+17+1+1+1 = 343 ; les 268 loaders TIM = 265+Tonberry+Devour+Cactuar. Un FL `ret` n’implique pas l’absence de textures (packs `mag000-049`, `mag096-099`, `mag140-158-159-258-331-332`, `mag326-329`, `mag013-073-344`, `mag333`… chargés par un autre slot).

Exceptions : Cactuar slot 198 via `Magic_LoadTexture_IO_GetsFile_DefaultArgs @ 0x5718E0` (push 0,0,0) ; Phoenix slot 139 : 1×IO + 2×`TextureOFF` + 2×`Magic_ArenaSize_1MiB @ 0x571B60` (=`0x100000`) + store `MAG_140_PHOENIX_FL_Callback @ 0x6A6360` vers `dword_1DCD6E8` ; slot 225 charge `mag296.tim`, pas `mag225`.

### Identité par fichier, pas par préfixe `MAG_NNN`

`MAG_NNN` Logic est souvent désaligné ; foi au slot 0-based, à l’effect_id 1-based, à la VA et au littéral `mag*` du loader :

* Angelo 91–94 (slots 90–93) : Rush `mag090` / Search `mag091` / Recover `mag092` / Reverse `mag093` — les 4 noms Logic actuels sont faux (commentaires IDB posés, renommages différés cause collisions en cascade avec slots 8, 13, 84, 85).
* Gilgamesh 327 (slot 326) : `MAG_327_GILGAMESH_EXCALIPOOR` ; 328–330 = `MAG_328_GILGAMESH_EXCALIBUR` / `MAG_329_GILGAMESH_ZANTETSUKEN` / `MAG_330_GILGAMESH_MASAMUNE` (Vague B), pack `mag326-329.tim`, 2 workers partagés `sub_596B70`/`sub_592300`. **Id 330 = Masamune**, distinct de MAG_331_* (slot 330 FamilyB).
* Angel Wing = id 96 (slot 95, `mag095.tim`), Moogle = id 84 (slot 83, `mag083.tim`) — les 2 noms Tex `_FL` croisés corrigés. Angelo Logic 91–94 **reportés** (collisions slots 8/13/84/85, wave kernel-data).
* Pandemona = id 291 (slot 290, wrapper G14 `0x6ED250`, FL `ret`) → `GF_291Pandemona_InvokeSummonScript` + init `GF_291Pandemona_InitSummonContext @ 0x6ED260` (Vague B, ex-`GF_200*`).
* Diablos = id 325 (slot 324, wrapper G93 standard) → `GF_325Diablos_InvokeSummonScript` + init `GF_325Diablos_InitSummonContext @ 0x654210` (Vague B, ex-nom auto-brouillé).
* Shot Irvine décalé d’un cran Logic vs Tex ; Mighty Guard 73/78 via packs `mag072-077` / `mag013-073-344` ; Griever Death id 8 et Angelo Search id 9 à réconcilier de même.
* Alexander tick `0xB00310` vs Meteor tick `0xA8FF00` : même taille `0x215`, SHA distincts (`be9bc791…` vs `0af51636…`) — le commentaire « byte-for-byte » est faux. Table `dword_187281C` = Alexander seulement (`0xB06E00`) ; Meteor appelle `sub_A95CD0`.

### Vague B (2026-09-10) — FamilyB tables + noms L1

Quatre tables MAG_331 **sans recouvrement fonctionnel** (identité d’octets `stream[0x81]==object-IP[0]` réelle mais index pratiqués disjoints) :

| Table | VA | Index | Largeur | Sites |
|---|---|---|---|---|
| OBJ0 | `0x1852708` | `[obj+0x18]` | 13 utiles (NULL 2/12) | 23 |
| PARTICULE | `0x1852894` | low-byte | ~96 (queue partagée 215=96+119) | 2 (`0x8E3BB7/0x8E3BDC`) |
| STREAM16 | `0x1852A98` | `s16&0x1FF` | ~236 / 328-alloc / 512-arch | 4 (passes ±) |
| DRAW | `0x18528F4` | `[obj+0x1C]` | séparée | draw pass |

Convention **`MAG_<effect_id>`** : les symboles PH9 `MAG_330_*` (SequenceTick/Magic00Init/Magic01Init/BindDispatch) sont **mal indexés** (slot 330 = id 331). Id 330 = Gilgamesh Masamune. Stubs stream 33/43/49 (`Op33_SeqPtrBind`/`Op43_PlaySE`/`Op49_SubmitTIM`, alias Op162/172/178 — **≠** STREAM16 idx 178 = `Op178_SetSeqCtxA2 @ 0x8E55E0`). `Op6_QueueChunk @ 0x8E54A0` sans re-bornage : lecture `[0,127]` (`&0x7F` @ `0x8E5552`) ; `&0x3F` @ `0x8E5593` = preload file-id. A2 mutable. Bind Alexander créé `0xB07830`. Ticks créés : Eden `0xAE3470`, MAG_262 `0x950060`, MAG_299 `0x66FD70`.

Bootstrap : premier IP **positif**. `0x27973B8` = pointeur slot, mot = `[ptr+0x4A]`, 58 writers. Chunk lecture `[0,127]`, A2 mutable (`Op178_SetSeqCtxA2`) ; défaut A2=0. `mag.00+0x0C` clos via `sub_B657E0` ; `+8` ouvert. `.01+0x74` layout-dépendant. 17 FL `ret` : 15 TIM EXE, 2 zéro TIM (68, 343). Reports : Angelo/Moogle, `0x1852750`, producteur IP négatif, walker corpus.
