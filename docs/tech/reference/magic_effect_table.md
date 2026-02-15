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
    MagicList_TextureLoad[idx]();             // load textures
    *a2 = MagicList_Logic[idx];              // write entry fn to caller
}
```

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
3. `BattleActionSequence_DispatchTick` routes to `Tick_GF_Cinematic` (command types 0x26, 0xF4, 0xFE)
4. State 1 calls `BattleGF_LoadCallbackByMagicID(effect_id, &g_GfActiveCallbackPtr)`
5. Function indexes `MagicList_Logic[effect_id - 1]` and writes the GF entry callback
6. State 3 invokes `g_GfActiveCallbackPtr(ctx)` to start the GF cinematic

The mapping from kernel GF ID (cmd_arg) to effect_id is read from kernel data at runtime. See [effect_id Source](#effect_id-source-resolved) below.

## GF Entries in MagicList_Logic

### Junctionable GFs

All 16 junctionable GFs confirmed present. Effect_ids are non-contiguous.

| cmd_arg | GF | effect_id | Index | Table Ptr | Entry Fn | Type |
|---------|----|-----------|-------|-----------|----------|------|
| 0x40 | Quezacotl | 116 | 115 | `0x6C3550` | `0x6C3550` | direct |
| 0x41 | Shiva | 185 | 184 | `0x5C0D50` | `0x5C0D50` | direct |
| 0x42 | Ifrit | 201 | 200 | `0xB25780` | `0xB25780` | direct |
| 0x43 | Siren | 95 | 94 | `0x739DA0` | `0x739DA0` | direct |
| 0x44 | Brothers | 205 | 204 | `0xAF4520` | `0xAF4520` | direct |
| 0x45 | Diablos | 325 | 324 | `0x6541E0` | `0x654210` | thunk |
| 0x46 | Carbuncle | 278 | 277 | `0x680C50` | `0x680C50` | direct |
| 0x47 | Leviathan | 6 | 5 | `0xB58080` | `0xB58080` | direct |
| 0x48 | Pandemona | 291 | 290 | `0x6ED250` | `0x6ED250` | direct |
| 0x49 | Cerberus | 203 | 202 | `0xB0C1A0` | `0xB0C1A0` | direct |
| 0x4A | Alexander | 204 | 203 | `0xAFFCA0` | `0xAFFCA0` | direct |
| 0x4B | Doomtrain | 191 | 190 | `0x63E730` | `0x63E730` | direct |
| 0x4C | Bahamut | 202 | 201 | `0xB189A0` | `0xB189A0` | direct |
| 0x4D | Cactuar | 199 | 198 | `0x5A8750` | `0x5A8750` | direct |
| 0x4E | Tonberry | 90 | 89 | `0x762360` | `0x762360` | direct |
| 0x4F | Eden | 206 | 205 | `0xAE2DD0` | `0xAE2DD0` | direct |

**Diablos thunk**: The table entry at index 324 is a 5-instruction wrapper at `0x6541E0` that forwards to the real entry at `0x654210`. The texture loader at the same index loads `mag324.tim`.

### Special / Non-Junctionable GFs

| effect_id | GF/Effect | Table Ptr | Entry Fn | Notes |
|-----------|-----------|-----------|----------|-------|
| 69 | Griever Summon | `0x6FE040` | `0x6FE050` (thunk) | Boss cinematic; calls BdLinkTask, BS_Memset |
| 140 | Phoenix (Rebirth Flame) | `0x6A6300` | `0x6A6430` (thunk) | Auto-trigger on party wipe + Phoenix Pinion |
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
| +1 | 1 | command_type | Command type (0xFE = GF summon, 0x26 = magic, 0xF4 = GF special, etc.) |
| +2 | 1 | anim_state | Animation state byte |
| +4 | 2 | cmd_arg | Ability / GF kernel ID (u16) |
| +6 | 2 | effect_id | Effect ID indexing into MagicList_Logic (u16, 1-based) |
| +12 | 4 | damage_ctx_ptr | Damage context pointer |
| +16 | 1 | flags | Additional flags byte |

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
| 11 | Angelo Recover | 91 | Angelo variant |
| 12 | Angelo Reverse | 93 | Angelo variant |
| 13 | Angelo Search | 94 | Angelo variant |
| 14 | Angelo Strike | 92 | Angelo variant |

## Odin / Gilgamesh Auto-Trigger Mechanism

### Overview

Odin and Gilgamesh are special GFs that trigger automatically during battle based on RNG checks. They use **command type 0xF5**, which routes through `BattleActionSequence_Tick_Special` (0x50B830) instead of the normal GF cinematic path. The cinematic is still loaded via `BattleGF_LoadCallbackByMagicID` using the effect_id from `K_NONJ_GF_ATTACK_NAME_OFFSET`.

### Flag: `SG_ODIN_ANGEL_GILGA_FLAG` (0x1CFE97A)

| Bit | Value | Meaning | Set by |
|-----|-------|---------|--------|
| 1 | 0x02 | Has Odin | `SETODIN` script opcode (0x56DAE0) |
| 2 | 0x04 | Phoenix enabled | `getText` on command processing |
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
4. Set `byte_1D28E1D = 1` (blocks per-frame trigger)

**Per-frame function**: `domain::AngeloOdin_SpecialActionTick` (0x482F80), called during `mode_3_subsubsubstep == 4` every frame.

1. Cooldown: if `word_1D28DE4 > 0`, decrement and return
2. Check `SG_ODIN_ANGEL_GILGA_FLAG & 0x08` AND `!byte_1D28E1D`
3. RNG: `isRandomProbaNumDen255(12, 255)` → **12/255 ≈ 4.7% per tick**
4. Random variant: same 7–10 selection
5. Set `byte_1D28E1D = 1` (one trigger per battle)

### Odin → Gilgamesh Story Transition

MonsterAI opcode 54 (triggered by the Seifer disc-3 battle script):
```c
SG_ODIN_ANGEL_GILGA_FLAG &= 0xFD;  // clear bit 1 (remove Odin)
SG_ODIN_ANGEL_GILGA_FLAG |= 0x08;  // set bit 3 (add Gilgamesh)
```

### Action Queue → Cinematic Path

1. Action queued with action type 7 via `ODIN_sub_484710` (0x484720) into exec queue
2. `pre_MonsterAI` (0x487640) case 7 picks it up, calls `sub_483400(slot, 0xF5, variant, target)`
3. `getText` (0x48D2F8) case 245 reads `K_NONJ_GF_ATTACK_NAME_OFFSET.magicID[variant*20]` → effect_id
4. Action context built with `command_type=0xF5`, `cmd_arg=variant`, `effect_id=magicID`
5. `BattleActionSequence_DispatchTick` sees 0xF5 → `BattleActionSequence_Tick_Special`
6. `Tick_Special` state 1 calls `BattleGF_LoadCallbackByMagicID(effect_id, &GF_CALLBACK_PTR)`
7. `MagicList_Logic[effect_id - 1]` loads the cinematic entry function
