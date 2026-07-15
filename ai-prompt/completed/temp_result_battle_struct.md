# BATTLE_SLOT_DATA Struct — Complete Investigation Results

## Base: `0x1D27B10` | Stride: `0xD0` (208 bytes) | 11 slots

```
Slot 0–2:  Party members (Squall, etc.)
Slot 3–7:  Enemies (up to 5 active, scene allows up to 8 positions)
Slot 8–10: GF slots (summoned GFs absorbing damage)
```

---

## 1. Complete Struct Definition (IDA-Verified)

```c
typedef struct FF8BattleSlotData_s {  // sizeof == 0xD0 (208)

    /* === Pointers (monster-only, NULL for party) === */
    /* 0x00 */ ff8_battle_monster_info **monster_info_section;  // → .dat info section
    /* 0x04 */ DWORD **monster_ai_section;                      // → .dat section 8 AI bytecode

    /* === Status Flags (authoritative + mirror) === */
    /* 0x08 */ Status2Flags status_2;        // DWORD — Haste/Slow/Protect/Shell/Reflect/etc. (see §3)
    /* 0x0C */ DWORD       status_2_copy;    // Presentation mirror — written by BattleStatus_UpdateSlotStatusCopy

    /* === ATB System === */
    /* 0x10 */ DWORD max_atb;   // = 4000 * (SG_BATTLE_SPEED_SETTING + 1)
    /* 0x14 */ DWORD cur_atb;   // Incremented each frame by ATB formula; when >= max_atb → ready

    /* === HP === */
    /* 0x18 */ DWORD current_hp;  // Clamped [0, max_hp] by Battle_ApplyDamageOrHeal
    /* 0x1C */ DWORD max_hp;

    /* === Hit Payload (attack properties of this slot's basic attack) === */
    /* 0x20 */ DWORD hit_status_2;   // status_2 flags inflicted by this slot's physical attack

    /* === AI / Runtime Workspace === */
    /* 0x24 */ BYTE set_zero[32];    // Zeroed during init. Used by AI VM for local vars / runtime scratch.

    /* === Elemental Defense === */
    /* 0x44 */ __int16 elem_def[8];  // 8 signed WORDs: per-element defense multiplier
                                     // Party: from GetCharacter_ElemDef; Monster: 10 * ElemRes[i]
                                     // Elements: Fire, Ice, Thunder, Earth, Poison, Wind, Water, Holy

    /* === Status Timers === */
    /* 0x54 */ FF8BattleTimer_e timer[16];  // 32 bytes; per-status countdowns (Doom, Gradual Petrify, timed buffs)
                                            // Filled with sentinel 0xFBA9 on death/init

    /* === Spatial Position === */
    /* 0x74 */ WORD coordinate_x;
    /* 0x76 */ WORD coordinate_y;
    /* 0x78 */ WORD coordinate_z;
    /* 0x7A */ BYTE align3[2];      // Padding

    /* === Slot Flags === */
    /* 0x7C */ FF8BattleFlagData_e     flag_data;           // 2 bytes — visibility/state flags (see §4)
    /* 0x7E */ FF8BattleImmunityFlagData_e immunity_flag_data; // 2 bytes — gravity immunity, etc.
              // Note: accessed as DWORD at +0x7C (flag_data + immunity_flag_data combined)

    /* === Status 1 + Copy === */
    /* 0x80 */ Status1Flag_e status_1;       // WORD — Death/Poison/Petrify/etc. (see §3)
    /* 0x82 */ WORD          status_1_copy;  // Presentation mirror

    /* === GF Shield / Target === */
    /* 0x84 */ WORD target_info_mask;   // GF shield HP remaining; absorbs damage when GF is summoned

    /* === Hit Status 1 === */
    /* 0x86 */ WORD hit_status_1;  // status_1 flags inflicted by this slot's physical attack

    /* === Last Attacker Tracking (AI VM reads these) === */
    /* 0x88 */ BYTE last_attacker_slot_id;        // Slot index (0-10) of last attacker
    /* 0x89 */ BYTE last_attacker_attack_type;    // Physical=0 / Magical=1 classification
    /* 0x8A */ BYTE number_turn;                  // AI turn counter, incremented per AI dispatch
    /* 0x8B */ BYTE last_attacker_command_type;   // Magic/Item/GF/Physical command category
    /* 0x8C */ BYTE last_attacker_attack_element; // Element of last attack received
    /* 0x8D */ BYTE last_attacker_is;             // com_file_id of the attacker
    /* 0x8E */ BYTE bool_related_to_damage_deal;  // 1 if damage dealt, 0 if healed/miss
    /* 0x8F */ BYTE last_attacker_action_or_gf_used; // Specific spell/GF/ability ID used

    /* === Mental (Status) Resistances === */
    /* 0x90 */ FF8BattleMentalStatus mental_res;  // 0x28 bytes. Treated as 40x u8 in code (see §5).

    /* === Combat State === */
    /* 0xB8 */ BYTE magic_to_blow_away;    // AI: selected spell for Draw/Confuse-magic
    /* 0xB9 */ BYTE saved_hp_flag;         // Renamed in IDA (was padding). Meaning TBD.
    /* 0xBA */ BYTE attack_enabler;        // Attack enable flags from junction data
    /* 0xBB */ BYTE com_file_id;           // Character ID (0=Squall..7=Edea, 0xFF=empty slot)

    /* === Stats === */
    /* 0xBC */ BYTE level;
    /* 0xBD */ BYTE str;
    /* 0xBE */ BYTE vit;
    /* 0xBF */ BYTE mag;
    /* 0xC0 */ BYTE spr;
    /* 0xC1 */ BYTE spd;   // ** AUTHORITATIVE SPD ** — read by BattleATB_TickAndReady
    /* 0xC2 */ BYTE luck;
    /* 0xC3 */ BYTE eva;
    /* 0xC4 */ BYTE hit_percent;
    /* 0xC5 */ BYTE hit_element;          // Element type of this slot's attack
    /* 0xC6 */ BYTE hit_element_percent;  // Element percentage (default 100)

    /* === Reaction / Tracking === */
    /* 0xC7 */ BYTE target_reaction_type;  // 0=none, 2=was hit (alive), 3=was killed
    /* 0xC8 */ BYTE attack_sequence_id;    // Renamed in IDA (was unknown1). Observed used with ATTACKER_SLOT_ID_0 in Battle_ApplyDamageOrHeal.
    /* 0xC9 */ BYTE scripted_invuln_flag;  // Renamed in IDA (was unknown2). Checked alongside byte_1D28E00 in Battle_ApplyDamageOrHeal. Meaning TBD.

    /* === Crisis / Limit Break === */
    /* 0xCA */ BYTE crisis_level;  // 0-4, computed by BattleLimit_ComputeCrisisAndToggleAttackSlot
                                   // Formula: f(HP_ratio, status_effects, alive_allies, random)

    /* === Remaining === */
    /* 0xCB */ BYTE align5;              // Padding / unused
    /* 0xCC */ WORD damage_accumulator;  // Renamed in IDA (was unknown3). Observed incremented by damage in Battle_ApplyDamageOrHeal (ability-gated). Exact semantics TBD.
    /* 0xCE */ BYTE unknown4[2];         // Last 2 bytes — purpose TBD

} FF8BattleSlotData_s;  // Total: 0xD0 = 208 bytes
```

---

## 2. Field Classification Table

| Offset | Size | Name | R/W | Primary Accessor | Party | Enemy | GF |
|--------|------|------|-----|------------------|-------|-------|----|
| +0x00 | 4 | monster_info_section | R | setMonsterInfoFromDatInfoSection | - | Y | - |
| +0x04 | 4 | monster_ai_section | R | EnemyAI_VM_ExecuteScript | - | Y | - |
| +0x08 | 4 | status_2 | R/W | BattleStatus_ApplyAndSyncSlot, init | Y | Y | Y |
| +0x0C | 4 | status_2_copy | W | BattleStatus_UpdateSlotStatusCopy | Y | Y | Y |
| +0x10 | 4 | max_atb | R/W | Battle_InitATB_MaxAndReset | Y | Y | - |
| +0x14 | 4 | cur_atb | R/W | BattleATB_TickAndReady | Y | Y | - |
| +0x18 | 4 | current_hp | R/W | Battle_ApplyDamageOrHeal | Y | Y | Y |
| +0x1C | 4 | max_hp | R | setMonsterInfoFromDatInfoSection, setBattleSlotData | Y | Y | Y |
| +0x20 | 4 | hit_status_2 | W | setBattleSlotData | Y | - | - |
| +0x24 | 32 | set_zero | W | Init (memset 0); AI VM runtime | Y | Y | - |
| +0x44 | 16 | elem_def[8] | W | setBattleSlotData, setMonsterInfoFromDatInfoSection | Y | Y | - |
| +0x54 | 32 | timer[16] | R/W | Status_TickAndExpire, BattleSlot_ClearAllSlots | Y | Y | - |
| +0x74 | 6 | coordinates | W | Battle_InitEnemySlotPositionFromScene | Y | Y | - |
| +0x7C | 4 | flag_data+immunity | R/W | Init, BattleStatus_ApplyAndSyncSlot | Y | Y | Y |
| +0x80 | 2 | status_1 | R/W | BattleStatus_ApplyAndSyncSlot, init | Y | Y | Y |
| +0x82 | 2 | status_1_copy | W | BattleStatus_UpdateSlotStatusCopy | Y | Y | Y |
| +0x84 | 2 | target_info_mask | R/W | Battle_ApplyDamageOrHeal (GF shield) | Y | - | - |
| +0x86 | 2 | hit_status_1 | W | setBattleSlotData | Y | - | - |
| +0x88 | 8 | last_attacker_* | R/W | Battle_ApplyDamageOrHeal, AI VM | Y | Y | - |
| +0x90 | 40 | mental_res | W/R | setBattleSlotData, setMonsterInfo, damage | Y | Y | - |
| +0xB8 | 1 | magic_to_blow_away | R/W | AI VM (Draw/Confuse) | - | Y | - |
| +0xBB | 1 | com_file_id | R/W | Init, Battle_FindSlotByCharFileId | Y | Y | - |
| +0xBC | 1 | level | R/W | Init, Damage formulas | Y | Y | - |
| +0xBD-C4 | 8 | str/vit/mag/spr/spd/luck/eva/hit% | R/W | setBattleSlotData, scaling, damage | Y | Y | - |
| +0xC5 | 1 | hit_element | W | setBattleSlotData | Y | - | - |
| +0xC6 | 1 | hit_element_percent | W | setBattleSlotData, setMonsterInfo (=100) | Y | Y | - |
| +0xC7 | 1 | target_reaction_type | W | Battle_ApplyDamageOrHeal | Y | Y | - |
| +0xCA | 1 | crisis_level | R/W | BattleLimit_ComputeCrisis | Y | - | - |

---

## 3. Status Bit Layouts

### status_1 (WORD at +0x80)

| Bit | Hex | Status | Init Source |
|-----|-----|--------|-------------|
| 0 | 0x0001 | Death | BattleSlot_ClearAllSlots, ApplyDamage |
| 1 | 0x0002 | Poison | BattleStatus_ApplyAndSyncSlot |
| 2 | 0x0004 | Petrify | BattleStatus_ApplyAndSyncSlot |
| 3 | 0x0008 | Darkness/Blind | BattleStatus_ApplyAndSyncSlot |
| 4 | 0x0010 | Silence | BattleStatus_ApplyAndSyncSlot |
| 5 | 0x0020 | Berserk | BattleStatus_ApplyAndSyncSlot |
| 6 | 0x0040 | Zombie | setMonsterInfoFromDatInfoSection (innate) |
| 7 | 0x0080 | ??? | |
| 8 | 0x0100 | HP < 25% | Battle_ApplyDamageOrHeal (auto-computed) |
| 9 | 0x0200 | HP < 50% | Battle_ApplyDamageOrHeal (auto-computed) |

### status_2 (DWORD at +0x08)

| Bit | Hex | Status | ATB Effect | Init Source |
|-----|-----|--------|------------|-------------|
| 0 | 0x00000001 | Sleep | ATB blocked | |
| 1 | 0x00000002 | Haste | ATB rate x1.5 (15/10) | Auto-Haste ability (bit 0x8000) |
| 2 | 0x00000004 | Slow | ATB rate x0.5 (5/10) | |
| 3 | 0x00000008 | Stop | ATB blocked | |
| 4 | 0x00000010 | Regen | | |
| 5 | 0x00000020 | Protect | | Auto-Protect ability (bit 0x4000) |
| 6 | 0x00000040 | Shell | | Auto-Shell ability (bit 0x2000) |
| 7 | 0x00000080 | Reflect | | Auto-Reflect ability (bit 0x1000) |
| 14 | 0x00004000 | Confuse-like | Target ineligible | BattleTarget_IsEligibleByStatus checks `status_2 & 0x4000` |
| 16 | 0x00010000 | Eject/Vanish | | Card, Devour |
| 30 | 0x40000000 | HAS_MAGIC | | setBattleSlotData (party has stocked magic) |
| 31 | 0x80000000 | GF_SUMMONED | | GF summon active |

**Corrected auto-status mapping (from Battle_InitPartySlotStatusFromChar):**
| Ability Bit | Status | status_2 Value |
|-------------|--------|----------------|
| 0x1000 | Auto-Reflect | 0x80 |
| 0x2000 | Auto-Shell | 0x40 |
| 0x4000 | Auto-Protect | 0x20 |
| 0x8000 | Auto-Haste | 0x02 |
| 0x10000 | Initiative | ATB starts full |

> **Note:** The original plan had 0x1000=Auto-Haste and 0x8000=Auto-Reflect SWAPPED. The decompiled code proves the correct mapping above.

### flag_data (DWORD at +0x7C, combining flag_data + immunity_flag_data)

This field is heavily used, but only a subset of bit meanings are proven by the decompiled evidence collected in this discussion.

**Confirmed writes/bit ops (observed):**
- Party init (`Battle_InitPartySlotStatusFromChar`): `*(_DWORD *)&slot.flag_data = 0x8801`
- Monster init (`setMonsterInfoFromDatInfoSection`): `*(_DWORD *)&slot.flag_data = 0x0011`
- Monster HP hidden flag: `BYTE1(flag_data) |= 0x20`
- Monster LvUp/Down immunity: `BYTE1(flag_data) |= 0x80`
- Monster gravity immunity: `flag_data |= 0x10000`
- Status pipeline toggles `BYTE1(flag_data)` bit `0x04` depending on Sleep/Stop gating (see `BattleStatus_ApplyAndSyncSlot`)

Other bits are checked in the ATB tick loop and AI VM, but their semantics need a dedicated xref sweep before we name them.

---

## 4. SPD Offset Resolution

**RESOLVED: +0xC1 is the authoritative SPD in BATTLE_SLOT_DATA.**

The original plan mentioned `+0x28` from `setBattleSlotData` — this was the offset within `F_CHAR_DATA` (the intermediate character data buffer), **not** the battle slot struct. The SPD flow is:

1. `F_CHAR_DATA[232*slot + 447]` holds computed SPD (from junction stats)
2. `setBattleSlotData` copies it to `BATTLE_SLOT_DATA[slot].spd` at **+0xC1**
3. `BattleATB_TickAndReady` reads SPD from **+0xC1** for ATB formula

ATB increment formula (confirmed from disassembly at 0x4842B0):
```
increment = base_rate * K_MISC.atb_speed_multiplier * (spd + 30) / 100

base_rate = 10 (normal) | 15 (Haste) | 5 (Slow)
```

---

## 5. Mental Resistance Layout (FF8BattleMentalStatus at +0x90, 0x28 bytes)

Although IDA currently models this as 20 WORD fields (`FF8BattleMentalStatus`), the **code treats this region as 40 bytes**:
- `setMonsterInfoFromDatInfoSection` writes `*((_BYTE *)&slot.mental_res.Death + j)` for `j=0..39`
- `setBattleSlotData` writes individual bytes via `LOBYTE(...)` / `HIBYTE(...)`

Practical interpretation:
- `mental_res_bytes[40]` where values are 0..255
- 100 = neutral baseline (both party and monster init default to 100)
- 200 (0xC8) is used as “high resistance / immunity-like” in junction ability overrides

**Monster StatusRes mapping** (exact switch table from `0x48BBD0`):
- j=0..6  → StatusRes[j]
- j=8     → StatusRes[7]
- j=9     → StatusRes[8]
- j=10    → StatusRes[9]
- j=11    → StatusRes[0xA]
- j=12    → StatusRes[0xB]
- j=15    → StatusRes[0xC]
- j=18    → StatusRes[0xD]
- j=20    → StatusRes[0xE]
- j=21    → StatusRes[0xF]
- j=22    → StatusRes[0x10]
- j=23    → StatusRes[0x11]
- j=24    → StatusRes[0x12]
- all other j default to 100

**Party init:** `memset(&mental_res, 100, sizeof(mental_res))` then selective byte overrides from junction data.

**Ability overrides** (from setBattleSlotData):
- Ability 0x8000 → Confuse + Berserk resistance = 200 (0xC8)
- Ability 0x80000 → ALL resistances = 200 (full immunity to all status)

---

## 6. Party vs Monster Layout Differences

| Feature | Party (slots 0-2) | Enemy (slots 3-7) | GF (slots 8-10) |
|---------|-------------------|---------------------|------------------|
| monster_info_section | NULL | Pointer to .dat info | NULL |
| monster_ai_section | NULL | Pointer to AI bytecode | NULL |
| flag_data init | 0x8801 | 0x11 | TBD |
| com_file_id | 0-7 (Squall..Edea) | Monster com_id | -1 / GF id |
| hit_status_1/2 | From junction data | Not set (0) | Not set |
| hit_element | From junction/weapon | Not set | Not set |
| elem_def source | GetCharacter_ElemDef | 10 * ElemRes[i] | TBD |
| mental_res source | Memset 100 + junction overrides | Monster StatusRes mapping | TBD |
| Stats source | Battle_CalculateJunctionStats | BattleSlot_ApplyMonsterStatScaling | GF stats |
| crisis_level | Computed (0-4) | Not used | Not used |
| target_info_mask | GF shield HP | 0 | 0 |

---

## 7. ATB System Details

### Initialization (0x484490 + 0x4844D0)
```
max_atb = 4000 * (SG_BATTLE_SPEED_SETTING + 1)
cur_atb = max_atb / 100 * (spd / 4 + random(0..127) + 1 - 35)
cur_atb = clamp(cur_atb, 0, max_atb)
```

### Per-Frame Tick (0x4842B0)
```
if status_2 & 0x09 (Sleep|Stop): skip ATB
if status_1 & 0x05 (Death|Petrify): skip ATB

base = 10 (normal)
if status_2 & 0x02 (Haste): base = 15
if status_2 & 0x04 (Slow): base = 5  (overrides Haste)

increment = base * K_MISC.atb_speed_multiplier * (spd + 30) / 100
cur_atb += increment
if cur_atb >= max_atb: ATB ready → enqueue command
```

### Preemptive/Back-Attack Override
- **Preemptive:** Party ATB = max, Enemy ATB = 0
- **Back attack:** Party ATB = 0 (unless Initiative), Enemy ATB = max
- **Initiative ability (bit 0x10000):** cur_atb = max_atb regardless

---

## 8. Crisis Level Formula (0x4941F0)

```
crisis_level = (10 * (status_bonus + 4 * (5 * dead_allies + 40))
              - 10 * crisisHPMult * current_hp / max_hp)
              / (random(0..255) + 160)
              - 4

crisis_level = clamp(crisis_level, 0, 4)
```

Where:
- `status_bonus` = sum of K_MISC.limit_effects for each active status
- `dead_allies` = count of dead party members with status_1 & 0x01
- `crisisHPMult` = K_CHARACTER[com_file_id].crisisLevelHPMultiplier

Crisis level 0 = no Limit Break. Crisis 1-4 = Limit available (higher = better abilities).

---

## 9. Functions Catalog — All Confirmed Addresses

### Init Phase
| Address | Name | Writes To Struct |
|---------|------|------------------|
| 0x48C620 | BattleSlot_ClearAllSlots | status_1, flag_data, com_file_id, timers |
| 0x48B5F0 | Battle_InitPartySlotStatusFromChar | com_file_id, status_1, status_2 (auto), flag_data, ATB, mental_res |
| 0x48B310 | setBattleSlotData | HP, level, all stats, elem_def, mental_res, hit_status, crisis |
| 0x48BBD0 | setMonsterInfoFromDatInfoSection | HP, level, flag_data, com_file_id, elem_def, mental_res, status_1/2 (innate) |
| 0x48C1C0 | BattleSlot_ApplyMonsterStatScaling | str, vit, mag, spr, spd, eva |
| 0x484490 | Battle_InitATB_MaxAndReset | max_atb, cur_atb |
| 0x4844D0 | Battle_InitATB_RandomFromSpeed | cur_atb (from spd) |
| 0x495530 | ParseBattleCharacter | F_CHAR_DATA (intermediate, not direct slot write) |
| 0x495960 | Battle_CalculateJunctionStats | F_CHAR_DATA (intermediate) |

### Runtime — Status
| Address | Name | Reads/Writes |
|---------|------|--------------|
| 0x493840 | BattleStatus_ApplyAndSyncSlot | status_1, status_2, flag_data, cur_atb → authoritative write |
| 0x47E2D0 | BattleStatus_UpdateSlotStatusCopy | status_1→status_1_copy, status_2→status_2_copy |

### Runtime — ATB
| Address | Name | Reads/Writes |
|---------|------|--------------|
| 0x4842B0 | BattleATB_TickAndReady | R: spd(+0xC1), status_2(+0x08), status_1(+0x80), flag_data(+0x7C). W: cur_atb(+0x14) |

### Runtime — Damage
| Address | Name | Reads/Writes |
|---------|------|--------------|
| 0x494410 | Battle_ApplyDamageOrHeal | R/W: current_hp, status_1, target_info_mask. W: last_attacker_*, target_reaction_type, attack_sequence_id |
| 0x4922B0 | Damage_ComputeRawDeltaFromAttackType | R: str, mag, vit, spr, level, com_file_id, status_1, status_2 |

### Runtime — AI
| Address | Name | Reads/Writes |
|---------|------|--------------|
| 0x487DF0 | EnemyAI_VM_ExecuteScript | R/W: many fields (status, HP, ATB, level, last_attacker_*, number_turn, flag_data, magic_to_blow_away, elem_def) |
| 0x4877F0 | EnemyAI_DispatchSection | R: status gates, number_turn |

### Runtime — Targeting
| Address | Name | Reads/Writes |
|---------|------|--------------|
| 0x4877B0 | BattleTarget_IsEligibleByStatus | R: status_1 & 5 (Death\|Petrify), status_2 & 0x4009, flag_data bit14 |
| 0x483940 | BattleTarget_FindByCondition | R: various by condition |

### Runtime — Command / Limit
| Address | Name | Reads/Writes |
|---------|------|--------------|
| 0x4BB910 | BattleCommandMenu_InitCommandSetAndLimitState | Calls crisis computation, populates command list |
| 0x4941F0 | BattleLimit_ComputeCrisisAndToggleAttackSlot | W: crisis_level(+0xCA), toggles Limit command |

### Death / Cleanup
| Address | Name | Reads/Writes |
|---------|------|--------------|
| 0x48C5C0 | BattleSlot_ManageDeathState | W: com_file_id=-1, flag_data=0, status_1\|=DEATH, zero crisis/timers |

---

## 10. IDA Database Changes Applied

### Comments Added (16 functions)
| Address | Function |
|---------|----------|
| 0x48B310 | setBattleSlotData |
| 0x48B5F0 | Battle_InitPartySlotStatusFromChar |
| 0x48BBD0 | setMonsterInfoFromDatInfoSection |
| 0x48C1C0 | BattleSlot_ApplyMonsterStatScaling |
| 0x48C5C0 | BattleSlot_ManageDeathState |
| 0x48C620 | BattleSlot_ClearAllSlots |
| 0x493840 | BattleStatus_ApplyAndSyncSlot |
| 0x47E2D0 | BattleStatus_UpdateSlotStatusCopy |
| 0x4842B0 | BattleATB_TickAndReady |
| 0x484490 | Battle_InitATB_MaxAndReset |
| 0x4844D0 | Battle_InitATB_RandomFromSpeed |
| 0x494410 | Battle_ApplyDamageOrHeal |
| 0x4922B0 | Damage_ComputeRawDeltaFromAttackType |
| 0x4941F0 | BattleLimit_ComputeCrisisAndToggleAttackSlot |
| 0x495530 | ParseBattleCharacter |
| 0x4877B0 | BattleTarget_IsEligibleByStatus |

### Functions Renamed
| Address | Old Name | New Name |
|---------|----------|----------|
| 0x47E2D0 | sub_47E2D0 | BattleStatus_UpdateSlotStatusCopy |
| 0x48C5C0 | manageSlotIdDeath | BattleSlot_ManageDeathState |

### Struct Modifications
| Change | Details |
|--------|---------|
| elem_def area fixed | Was: elem_def_type(1) + align1(3) + elem_def_value(2) + align2(10). Now: `__int16 elem_def[8]` (16 bytes) |
| align4 → saved_hp_flag | Renamed +0xB9 from padding to functional name |
| value_is_2_when_targeted → target_reaction_type | Renamed +0xC7 |
| unknown1 → attack_sequence_id | Renamed +0xC8 |
| unknown2 → scripted_invuln_flag | Renamed +0xC9 |
| unknown3 → damage_accumulator | Renamed +0xCC |

### Status Bit Comments Added
| Address/Field | Comment Content |
|---------------|-----------------|
| status_2 member | 0x01=Sleep, 0x02=Haste, 0x04=Slow, 0x08=Stop, 0x10=Regen, 0x20=Protect, 0x40=Shell, 0x80=Reflect, 0x100=Aura, 0x10000=Eject, 0x40000000=HasMagic, 0x80000000=GFSummoned |
| status_1 member | 0x01=Death, 0x02=Poison, 0x04=Petrify, 0x08=Darkness, 0x10=Silence, 0x20=Berserk, 0x40=Zombie, 0x100=HP<25%, 0x200=HP<50% |

---

## 11. Remaining Unknowns

| Offset | Size | Current Name | Observations |
|--------|------|-------------|---------------|
| +0x24 | 32 | set_zero | Zeroed during init. AI VM may write local variables here. Need full AI VM opcode analysis. |
| +0x7A | 2 | align3 | Between coordinates and flag_data. Possibly rotation or unused. |
| +0xCB | 1 | align5 | Between crisis_level and damage_accumulator. Possibly unused. |
| +0xCE | 2 | unknown4 | Last 2 bytes of struct. Purpose TBD. |

---

## 12. GF Slot Fields (Slots 8-10) — Partial

GF slots reuse the same 0xD0 struct but with different field semantics:
- `current_hp` / `max_hp` = GF HP
- `status_2` bit 0x80000000 = GF summoned flag (set on summoner's slot, not GF slot)
- `target_info_mask` on the summoner's slot = GF shield HP (absorbs damage)
- GF slot is populated by `BattleGF_LoadCallbackByMagicID` (0x50AF20)
- GF element and immunities TBD — requires decompiling the GF load function

---

## 13. Key Corrections to Original Plan

1. **SPD offset:** Plan said `+0x28` from setBattleSlotData. This was the F_CHAR_DATA offset, not the battle slot. Actual: **+0xC1**.

2. **Auto-status mapping:** Plan had 0x1000=Auto-Haste and 0x8000=Auto-Reflect. Actual: **0x1000=Auto-Reflect (0x80), 0x8000=Auto-Haste (0x02)** — they were swapped.

3. **status_1 size:** Plan implied 4 bytes. Actual: **2 bytes (WORD)** at +0x80, with status_1_copy at +0x82.

4. **Struct offsets:** Plan's "confirmed offsets" (0x00=current_hp, 0x04=max_hp, 0x08=level, 0x24=str) were all from F_CHAR_DATA intermediate buffer, not the actual battle slot struct.
