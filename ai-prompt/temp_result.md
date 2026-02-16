# Battle Init Investigation - Complete Results

## State Machine Structure (FFBattleDirector_battleLoop @ 0x47CCB0)

### mode_StateGlobal values

| Value | Phase |
|---|---|
| 3 | Battle (init + active tick + cleanup) |
| 4 | Load overlay (btitle.ovl) |
| 5 | Level-up / XP/AP screen |
| 8 | Card game |
| 100 | Exit battle, return to field/world map |
| default | Load overlay or card game depending on FFBattleDirector_related |

### mode_StateGlobal == 3: mode3_substep values

| substep | Description |
|---|---|
| 0 | Set countdowns to 0, transition to substep 1 |
| 1 | Match COMBAT_SCENE_ID against battle_mode_related list, transition to substep 2 |
| 2 | Call Battle_LoadOverlayModule (0x47E410), transition to substep 3 |
| 3 | **"Open Stage"** — main init + battle phases (see subsub_step below) |

### mode3_substep==3: mode3_subsub_step values

| subsub_step | Description |
|---|---|
| 0 | **Heavy init block**: scene load, party/items parse, enemy visibility → sets to 1 |
| 1 | Falls through to mode_3_subsubsubstep switch (battle phases) |
| 2 | Battle_EndCleanupAndTransition (0x4868C0): save HP/status, count victory/escape/loss, set mode_StateGlobal → resets to 0 |

### mode3_subsub_step==0: Init Block (in execution order)

| # | Address | Function | Role |
|---|---|---|---|
| 1 | (inline) | init_battle_file_callback_2 | Register file loading callback for stage |
| 2 | (inline) | input_structure_vibrate_init | Controller vibration init |
| 3 | 0x482D10 | Battle_InitTimerState | Init timer/countdown state |
| 4 | (inline) | byte_1D280C3 = 1 | Mark battle frame processing active |
| 5 | (inline) | mode_3_subsubsubstep = 0 | Reset substep counter |
| 6 | (inline) | BATTLE_TRANSITION_COUNTDOWN = -1 | No transition pending |
| 7 | (inline) | BATTLE_RESULT_CODE = 0 | No battle result yet |
| 8 | (inline) | rand() → Battle_SeedRNG (0x48F050) | Seed battle RNG |
| 9 | (inline) | BS_CameraRelated_battle_reset | Camera position reset |
| 10 | (inline) | CURRENT_ENCOUNTER_ID = COMBAT_SCENE_ID | Copy scene ID |
| 11 | 0x48D0E0 | ReadSceneOutForEncounter | Load 128-byte scene.out at offset scene_id << 7 via Archive_IO_LoadFile |
| 12 | (inline) | Battle flag merge | Merge CURRENT_ENCOUNTER_DATA_SCENE_OUT.battle_flags into ENCOUTER_BATTLE_FLAG |
| 13 | (inline) | resetXPAndItem | Clear XP/Gil/Item reward accumulators |
| 14 | 0x48C740 ×3 | Battle_InitActionQueueGroup(1), (2), (0) | Init action queue for party melee, party ranged, enemies |
| 15 | (inline) | BattleSlot_SetEnemyVisibility | Set which of 8 enemy slots are active |
| 16 | 0x48C620 | BattleSlot_ClearAllSlots | Clear ALL 11 battle slots (set dead, hp=0, status=0) |
| 17 | 0x48B7E0 | ParseBattleParty | **Master party init** (see detail below) |
| 18 | (inline) | BS_ParseItems | Parse inventory items for battle |
| 19 | 0x48D1F0 | Battle_ResetAttackHitCount | Reset hit counter |
| 20 | (inline) | SomeListManipulation(1002,...) | Set battle scenario from scene data |
| 21 | (inline) | Various SomeListManipulation | UI/presentation init |
| 22 | (inline) | linkedToMonsterVisibility | Monster visibility setup |
| 23 | (inline) | mode3_subsub_step = 1 | **Transition to phase 1** |

### mode_3_subsubsubstep phases (within subsub_step==1)

| Phase | Functions | Description |
|---|---|---|
| **0** | Battle_RunFileLoadingCallbacks(), BdLink_GF_battle_input_and_texture_upload() | Async stage file loading. **Callback_TransitionToStep1** (0x47DD80) sets step=1 on completion. |
| **1** | setAllMonsterInfoFromDatSection, Battle_InitPreemptiveBackAttackStatus, Battle_SetEnemyZCoordinates, Battle_LoadMonsterModelToVRAM loop, Battle_InitSlotPositionsAndSyncStatus, Battle_DisplayPreemptiveMessage | **Monster init + preemptive + positioning** → code sets to 2 |
| **2** | Battle_RunFileLoadingCallbacks(), BdLink_GF_battle_input_and_texture_upload() | Async enemy texture upload. **Callback_TransitionToStep3** (0x47DD70) sets step=3 on completion. |
| **3** | CAN_BATTLE_BE_PAUSED=1, Battle_BuildTargetVisibilityMasks, memset_a_variable_20_bytes, Battle_EnqueueInitialPartyActions, AI_BATTLE_ACTIVE_FLAG=1, Odin check, Gilgamesh check, Battle_InitDeadTimer | **Pre-battle checks** → code sets to 4 |
| **4** | Active battle tick (every frame) | Per-frame battle logic |

### State Transition Callbacks
| Address | Name | Sets step to | Trigger |
|---|---|---|---|
| 0x47DD80 | Battle_Callback_TransitionToStep1 | 1 | Stage geometry async loading complete |
| 0x47DD70 | Battle_Callback_TransitionToStep3 | 3 | Enemy texture async loading complete |

---

## ParseBattleParty (0x48B7E0) — Master Party Init

### Call chain per party slot (i = 0..2):

1. **Collect known magic** from all 3 party junction data → SG_KNOWN_MAGIC bitmask
2. **RARE_ITEM_ABILITY_IN_IT = 0**
3. For each slot:
   a. **ParseBattleCharacter(charId, i)** @ 0x495530
      - Copies SG_ARRAY_CHARA_DATA → F_CHAR_DATA
      - Fields: ModelID, CurrentHP, Experience, AltModel, WeaponID
      - Calculates level from XP
      - Junction abilities → JFlag bitmask (auto-statuses)
      - Accumulates RARE_ITEM_ABILITY_IN_IT (Rare Item, etc.)
      - GF junction list (up to 16 GFs)
      - Battle commands + Battle Seal check
      - 9 base stat percentages (offset F_CHAR_DATA+455..463)

   b. **Battle_CalculateJunctionStats(charId, i)** @ 0x495960
      - Copies 32 junctioned magic entries into F_CHAR_DATA
      - Level from XP
      - **For each stat** (final = basePct * GetCharacterStat(level, charId, statIdx) / 100):
        - max_hp = basePct[0] × GetCharacterHP(level, charId) / 100, cap 9999
        - str = basePct[1] × GetCharacterStat(level, charId, 1) / 100, cap 255
        - vit = basePct[2] × GetCharacterStat(level, charId, 2) / 100
        - mag = basePct[3] × GetCharacterStat(level, charId, 3) / 100
        - spr = basePct[4] × GetCharacterStat(level, charId, 4) / 100
        - spd = basePct[5] × GetCharacterStat(level, charId, 5) / 100
        - luck = basePct[6] × GetCharacterStat(level, charId, 8) / 100
        - hit = basePct[7] × GetCharacterHit(charId) / 100
        - eva = basePct[8] × GetCharacterEva(charId, spd) / 100
      - Also calculates: elem_def[0..7], hit_status_1/2, mental_res[0..12]

   c. **Battle_InitPartySlotStatusFromChar(i)** @ 0x48B5F0
      - Reads F_CHAR_DATA abilities dword (offset +400):
        - bit 0x1000 → status_2 |= 0x80 (Auto-Haste)
        - bit 0x4000 → status_2 |= 0x20 (Auto-Protect)
        - bit 0x2000 → status_2 |= 0x40 (Auto-Shell)
        - bit 0x8000 → status_2 |= 0x02 (Auto-Reflect)
        - bit 0x10000 → ATB starts at MAX (Initiative ability)
      - Calls Battle_InitATB_MaxAndReset then Battle_InitATB_RandomFromSpeed

   d. **setBattleSlotData(i)** @ 0x48B310
      - Copies computed stats: current_hp, max_hp, level, str, vit, mag, spr, spd, luck, hit_percent, eva
      - Copies elem_def[8], mental_res (default 100, overwritten from char data)
      - hit_status_1, hit_status_2, hit_element, hit_element_percent
      - Sets STATUS2_HAS_MAGIC if character has any stocked magic
      - Ability 0x8000 → boosts Confuse/Berserk mental_res to 200
      - Ability 0x80000 → boosts ALL mental_res to 200 (0xC8)
      - computeStatusHP50Or25Percent for crisis level

4. **Battle_FinalizePartySetup()** @ 0x495EC0

---

## Character Stat Formula (GetCharacterStat @ 0x496440)

### For STR/VIT/MAG/SPR (stat 1-4):
```
stat = CapTo255(
    weaponBonus
    + (growthC + level * growthA / 10 + level / growthB - level² / growthD) / 4
    + baseStat
    + junctionMultiplier * spellCount / 100
)
```

### For SPD/LUCK (stat 5, 8):
```
stat = CapTo255(
    weaponBonus
    + growthC + level * growthA + level / growthB - level / growthD
    + baseStat
    + junctionMultiplier * spellCount / 100
)
```

Where:
- `growthA/B/C/D` = character-specific growth curve params from K_CHARACTER table (36-byte entries)
- `baseStat` = SG_ARRAY_CHARA_DATA[charId].STR/VIT/etc
- `junctionMultiplier` = K_MAGIC[spellId].statJunctionValue
- `spellCount` = number stocked from SG_ARRAY_CHARA_DATA.Magic[spellIdx] high byte
- `weaponBonus` = K_WEAPON[weaponId].strBonus (STR only; also handles Laguna/Kiros/Ward special weapons)

### GetCharacterHP (0x496310):
```
HP = MaxHP_save + growthC_HP + level * growthA_HP + spellCount * K_MAGIC[spell].hpJunctionValue - 10 * level² / growthD_HP
```

---

## setAllMonsterInfoFromDatSection (0x48BA10) — Master Enemy Init

For each of 8 potential enemy slots (scene data positions 0-7):
1. Check `ENEMIES_VISIBILITY[i]` — skip if invisible
2. **setMonsterInfoFromDatInfoSection(slot, level_code, com_id)** @ 0x48BBD0
3. Determine level complexity: low (< med_level_start), med, high (≥ high_level_start)
4. Recalculate HP (redundant, same formula)
5. **BattleSlot_ApplyMonsterStatScaling(slot)** @ 0x48C1C0
6. Set visibility/targetable/loaded flags from CURRENT_ENCOUNTER_DATA_SCENE_OUT
7. Clear draw spell IDs for dead enemies
8. **Battle_InitDrawSpellAvailability()** @ 0x48C7A0 — check SG_KNOWN_MAGIC for draw availability

### Monster HP Formula (setMonsterInfoFromDatInfoSection):
```
HP = level × (hp[0] + 100 × hp[2]) + 10 × (hp[1] + 100 × hp[3]) + level² × hp[0] / 20
```
Where hp[0..3] are the 4 HP curve parameters from monster .dat info section.

### Monster Stat Formula (BattleSlot_ApplyMonsterStatScaling @ 0x48C1C0):

For HP/VIT: `stat = CapTo255((c + lvl×a/10 + lvl/b - lvl²/d) / 4) × modifier% / 10`
For STR/MAG/SPR/SPD: `stat = CapTo255(c + lvl×a + lvl/b - lvl/d) × modifier% / 10`

Stat params at monster info offsets: +28(HP), +32(STR), +36(VIT), +40(MAG), +44(SPR), +48(SPD)

### Monster Level Determination:

| level_code | Algorithm | Address |
|---|---|---|
| 0-100 | Literal level | (inline) |
| 101-200 | GetPartyAverageLevelWithOffset(code) | 0x48C140 |
| 201-250 | GetPartyAverageLevelWithRandomness + (code - 200) | (inline) |
| 251 | GetPartyAverageLevelCapped65PlusRandom | 0x48C020 |
| 252 | random(1..100) | (inline) |
| 253 | GetPartyAverageLevelConstrainedTeam | 0x48C0A0 |
| 254 | GetPartyAverageLevelExact | 0x48B2E0 |
| 255 | GetPartyAverageLevelWithRandomness (avg ± 20%) | 0x48BFA0 |

### Innate Monster Statuses (from flag_byte_1):

| Flag Bit | Effect |
|---|---|
| ZOMBIE | status_1 |= 0x40 (Zombie), Death resistance = 255 |
| FLY | status_2 |= Float (BYTE1 bit 0x20) |
| AUTO_REFLECT | status_2 |= STATUS2_REFLECT |
| bit 7 (AUTO_PROTECT) | status_2 |= STATUS2_PROTECT |
| AUTO_SHELL | status_2 |= STATUS2_SHELL |

---

## ATB Initialization

### Battle_InitATB_MaxAndReset (0x484490):
```
MAX_ATB = 4000 × (SG_BATTLE_SPEED_SETTING + 1)
CUR_ATB = 0
```

### Battle_InitATB_RandomFromSpeed (0x4844D0):
```
CUR_ATB = MAX_ATB / 100 × (SPD / 4 + random(0..127) + 1 - 35)
CUR_ATB = clamp(CUR_ATB, 0, MAX_ATB)
```

### Initiative Ability (bit 0x10000):
- Overrides: CUR_ATB = MAX_ATB (starts with full gauge)

### Preemptive/Back-Attack ATB Override:
- **Preemptive (BACK_PREEMTIVE_INFO = 3 or 4)**: Party ATB = full, Enemy ATB = 0
- **Back attack (BACK_PREEMTIVE_INFO = 1 or 2)**: Party ATB = 0 (unless Initiative), Enemy ATB = full
- **Normal (0)**: Standard random ATB from speed

---

## Preemptive/Back-Attack System (Battle_InitPreemptiveBackAttackStatus @ 0x48AFD0)

### Determination flow:
1. If `ENCOUTER_BATTLE_FLAG < 0` → Normal (0)
2. If `BATTLE_FORCE_PREEMPTIVE` flag → result = 1 (preemptive)
3. If `BATTLE_FORCE_BACK_ATTACK` flag → result = 2 (back attack)
4. Otherwise, RNG-based:
   - Check enemy immunity: if all alive enemies are dead OR have flag_byte_2 bit 1 → +20 bonus
   - Base modifier from sub_48B260 (checks flag_byte_2 preemptive immunity)
   - Random roll = Battle_GetRandomInt() + modifier
   - If party has RARE_ITEM_ABILITY bit 0 → roll -= 20
   - If any enemy has flag_byte_2 bit 4 (always_back_attack) → preemptive
   - Result mapping via Battle_MapPreemptiveResultToType:
     - roll < 20 → preemptive (50% chance: type 3 or 4)
     - 20 ≤ roll < 236 → normal (0)
     - roll ≥ 236 → back attack (50% chance: type 1 or 2)

### BACK_PREEMTIVE_INFO values:
| Value | Meaning | ATB Effect | Visual |
|---|---|---|---|
| 0 | Normal | Standard random | Normal positions |
| 1 | Back attack (type A) | Enemy full, party 0 | Normal orientation |
| 2 | Back attack (type B) | Enemy full, party 0 + back status | Party turned around |
| 3 | Preemptive (type A) | Party full, enemy 0 | Normal orientation |
| 4 | Preemptive (type B) | Party full, enemy 0 + flank status | Enemy turned around |

### Display messages (Battle_DisplayPreemptiveMessage @ 0x48AEF0):
| BACK_PREEMTIVE_INFO | BattleText_GetMiscText() | Probable Text |
|---|---|---|
| 1 | 46 | "Preemptive strike!" |
| 2 | 45 | "Back attack!" |
| 3 | 44 | (side attack?) |
| 4 | 47 | (side attack?) |

---

## Pre-Battle Checks (subsubsubstep==3)

| # | Address | Function | Details |
|---|---|---|---|
| 1 | (inline) | CAN_BATTLE_BE_PAUSED = 1 | Enable pause menu |
| 2 | 0x485FF0 | Battle_BuildTargetVisibilityMasks | Build word_1CFF570/572 bitmasks for party/enemy targeting |
| 3 | (inline) | memset_a_variable_20_bytes | Clear pending action buffer |
| 4 | 0x4846E0 | Battle_ClearActionQueueEntry | Clear action queue |
| 5 | (inline) | AI_BATTLE_ACTIVE_FLAG = 1 | Enable AI processing |
| 6 | 0x482E00 | Odin_BattleInit_ZantetsukenCheck | 32/255 (≈12.5%) if Odin obtained (SG_ODIN_ANGEL_GILGA_FLAG bit 1) AND all alive enemies have death resistance < 200 |
| 7 | 0x4831F0 | Gilgamesh_BattleInit_TriggerCheck | 8/255 (≈3.1%) if Gilgamesh flag set. Random selects attack variant (0-3: Zantetsuken, Masamune, Excalibar, Excalipoor) |
| 8 | 0x482F70 | Battle_InitDeadTimer | word_1D28DE4 = K_MISC.dead_timer |

---

## Active Battle Tick (subsubsubstep==4) — Per-Frame Checks

| # | Address | Function | Role |
|---|---|---|---|
| 1 | 0x4AB450 | copy_griever_name | Copy Griever name string |
| 2 | 0x4863F0 | BattleTick_CheckScriptedBattleEnd | AI-script triggered battle end (unk_1D28E2D) |
| 3 | 0x486450 | BattleTick_CheckPartyWipe | All party dead → Phoenix check (0x483270) → Game Over if fail |
| 4 | 0x486390 | BattleTick_CheckTimerExpiry | Timer battles (flag 0x04), except scene 317. BATTLE_RESULT_CODE = 3 |
| 5 | 0x486500 | BattleTick_CheckAllEnemiesDead | All enemies dead → BattleEnd_DistributeXpAp → Victory |
| 6 | 0x4862A0 | BattleTick_CheckEscapeSuccess | UNKNOWN==1 + eligible party → "Escaped" → XP dist |
| 7 | (loop) | BattlePendingAction_TransferToExecQueue | Transfer queued actions to execution |
| 8 | (inline) | BattleArbitration_SelectNextAction | Select next action to execute |
| 9 | (inline) | BattleAction_ResolveSpecialActionAndUpdateDamage | Execute and resolve damage |
| 10 | (inline) | Status_TickAndExpire | Process status timers |
| 11 | (inline) | AngeloOdin_SpecialActionTick | Angelo/Odin periodic auto-triggers |
| 12 | 0x482D50 | Battle_ProcessActionCallbackChain | Process callback chain |
| 13 | 0x482DC0 | Battle_ProcessDeferredCallbacks | Process deferred callbacks |

### Phoenix Auto-Revive (Battle_PhoenixAutoReviveCheck @ 0x483270):
- Triggered when BattleTick_CheckPartyWipe detects all party dead
- Requires: SG_ODIN_ANGEL_GILGA_FLAG bit 2 (Angel Wing / Phoenix GF ability)
- Probability: 64/255 ≈ 25.1%
- Does NOT trigger in scene 317 (specific boss fight)

---

## Battle End Detection (BATTLE_RESULT_CODE @ 0x1CFF6E7)

| Value | Meaning | Set By | Transition |
|---|---|---|---|
| 0 | Battle ongoing | — | — |
| 1 | Party wipe (Game Over) | BattleTick_CheckPartyWipe (0x486450) | mode_StateGlobal → 100 |
| 2 | Escape success | BattleTick_CheckEscapeSuccess (0x4862A0) | mode_StateGlobal → 5 (XP) |
| 3 | Timer expired | BattleTick_CheckTimerExpiry (0x486390) | mode_StateGlobal → 100 |
| 4 | All enemies dead (Victory) | BattleTick_CheckAllEnemiesDead (0x486500) | mode_StateGlobal → 5 (XP) or 100 (no XP if NO_EXP_SCREEN flag) |

### Battle End Transition (Battle_EndCleanupAndTransition @ 0x4868C0):
1. Save party HP and status back to save game data
2. Clear STATUS2 bit 0x20 from party (remove battle-only flags)
3. Return stolen/obtained items to inventory
4. Increment counters:
   - Victory (result 4): SG_BATTLE_VICTORY_COUNT++
   - Escape (result 2): SG_BATTLE_ESCAPED++
   - Wipe/Timer (result 1, 3): SG_UNUSED_IN_FIELD_1++
5. Set mode_StateGlobal (5=level-up screen, 100=exit to field)
6. Stop all SFX
7. Reset battle animation state

### Battle_EndSetTransitionTimer (0x47DFC0):
- BATTLE_END_TYPE 0 (victory+music) or 3 (wipe): 60 frames
- BATTLE_END_TYPE 1 (victory no music): 30 frames
- BATTLE_END_TYPE 2 (escape): 40 frames

---

## Complete Function Catalog — All Identified & Renamed

### Init Phase (subsub_step==0)
| Address | Name | Signature |
|---|---|---|
| 0x47CCB0 | main::FFBattleDirector_battleLoop | void __thiscall (void*) |
| 0x48D0E0 | domain::ReadSceneOutForEncounter | int(u16 scene_id, int dest_buf) |
| 0x48C740 | domain::Battle_InitActionQueueGroup | _BYTE*(int group) |
| 0x48C620 | domain::BattleSlot_ClearAllSlots | int() |
| 0x48B7E0 | ParseBattleParty | int() |
| 0x48D1F0 | domain::Battle_ResetAttackHitCount | char() |
| 0x482D10 | domain::Battle_InitTimerState | void() |
| 0x48F050 | domain::Battle_SeedRNG | void(char seed) |
| 0x47E410 | domain::Battle_LoadOverlayModule | void(int, int) |

### Party Init
| Address | Name | Signature |
|---|---|---|
| 0x495530 | ParseBattleCharacter | int(int char_id, int slot_id) |
| 0x495960 | domain::Battle_CalculateJunctionStats | int(int char_id, int slot_id) |
| 0x48B5F0 | domain::Battle_InitPartySlotStatusFromChar | char(int slot_id) |
| 0x48B310 | setBattleSlotData | int(int slot_id) |
| 0x484490 | domain::Battle_InitATB_MaxAndReset | int(int slot_id) |
| 0x4844D0 | domain::Battle_InitATB_RandomFromSpeed | int(int slot_id) |
| 0x4954B0 | domain::Battle_BuildMagicJunctionList | void(int slot_id) |
| 0x495EC0 | domain::Battle_FinalizePartySetup | void() |
| 0x494360 | domain::Battle_ComputeCrisisLevelFromHP | void(int slot, int hp, int16* status) |
| 0x495930 | CapTo255 | int(int val) |

### Character Stat Functions
| Address | Name | Signature |
|---|---|---|
| 0x496310 | GetCharacterHP | int(int level, int char_id) |
| 0x496440 | GetCharacterStat | int(int level, int char_id, int stat_idx) |
| 0x4967C0 | GetCharacterHit | int(int char_id) |
| 0x4968A0 | GetCharacterEva | int(int char_id, u8 spd) |
| 0x496930 | domain::GetCharacter_HitElement | u8(int char_id) |
| 0x496960 | domain::GetCharacter_HitElementPercent | u8(int char_id) |
| 0x4969E0 | domain::GetCharacter_ElemDef | i16(int char_id, int elem_idx) |
| 0x496AF0 | domain::GetCharacter_HitStatus2 | u32(int char_id) |
| 0x496AC0 | domain::GetCharacter_HitStatus1 | i16(int char_id) |
| 0x496B50 | domain::GetCharacter_AttackFlags | i16(int char_id) |
| 0x496BD0 | domain::GetCharacter_MentalRes | u8(int char_id, int res_idx) |

### Monster Init
| Address | Name | Signature |
|---|---|---|
| 0x48BA10 | setAllMonsterInfoFromDatSection | int*() |
| 0x48BBD0 | setMonsterInfoFromDatInfoSection | int(uint slot, int level_code, u8 com_id) |
| 0x48C1C0 | domain::BattleSlot_ApplyMonsterStatScaling | uint(int slot_id) |
| 0x48C3F0 | domain::Monster_CalculateScaledStat | int(int level, u8* params, int stat_idx) |
| 0x48C7A0 | domain::Battle_InitDrawSpellAvailability | int*() |
| 0x47D9E0 | domain::Battle_InitEnemySlotPositionFromScene | WORD(int slot, int scene_pos) |
| 0x47DD30 | domain::Battle_LoadMonsterModelToVRAM | _WORD*(int slot_id) |
| 0x47DAC0 | domain::Battle_SetEnemyZCoordinates | char() |
| 0x47DBA0 | domain::Battle_InitSlotPositionsAndSyncStatus | i16() |
| 0x4846E0 | domain::Battle_ClearActionQueueEntry | int(int a1, int a2) |

### Monster Level Functions
| Address | Name |
|---|---|
| 0x48BFA0 | domain::GetPartyAverageLevelWithRandomness |
| 0x48B2E0 | domain::GetPartyAverageLevelExact |
| 0x48C0A0 | domain::GetPartyAverageLevelConstrainedTeam |
| 0x48C020 | domain::GetPartyAverageLevelCapped65PlusRandom |
| 0x48C140 | domain::GetPartyAverageLevelWithOffset |

### Preemptive/Back-Attack
| Address | Name |
|---|---|
| 0x48AFD0 | domain::Battle_InitPreemptiveBackAttackStatus |
| 0x48B160 | domain::Battle_SetATBForPreemptiveGroup |
| 0x48B220 | domain::Battle_CheckAnyEnemyAlwaysBackAttack |
| 0x48B260 | domain::Battle_CheckPreemptiveImmunity |
| 0x48B2A0 | domain::Battle_MapPreemptiveResultToType |
| 0x48AEF0 | domain::Battle_DisplayPreemptiveMessage |

### Pre-Battle Checks
| Address | Name |
|---|---|
| 0x482E00 | ZANTETSUKEN_sub_482DF0 (Odin Zantetsuken check) |
| 0x4831F0 | domain::Gilgamesh_BattleInit_TriggerCheck |
| 0x482F70 | domain::Battle_InitDeadTimer |
| 0x485FF0 | domain::Battle_BuildTargetVisibilityMasks |

### Active Tick
| Address | Name |
|---|---|
| 0x4863F0 | domain::BattleTick_CheckScriptedBattleEnd |
| 0x486450 | domain::BattleTick_CheckPartyWipe |
| 0x486390 | domain::BattleTick_CheckTimerExpiry |
| 0x486500 | domain::BattleTick_CheckAllEnemiesDead |
| 0x4862A0 | domain::BattleTick_CheckEscapeSuccess |
| 0x483270 | domain::Battle_PhoenixAutoReviveCheck |
| 0x482D50 | domain::Battle_ProcessActionCallbackChain |
| 0x482DC0 | domain::Battle_ProcessDeferredCallbacks |

### Battle End
| Address | Name |
|---|---|
| 0x4868C0 | domain::Battle_EndCleanupAndTransition |
| 0x47DFC0 | domain::Battle_EndSetTransitionTimer |
| 0x494D40 | domain::BattleEnd_DistributeXpAp |

---

## XP Distribution Formula (BattleEnd_DistributeXpAp @ 0x494D40)

Per enemy slot (if slot was damaged):
```
xp_per_enemy = (maxHP - currentHP) × (5 × baseXP × monsterLevel / partyAvgLevel - baseXP) / maxHP
```
- Clamped to [1, 60000]
- Total XP = sum across all enemy slots, capped at 60000
- Dead/petrified party members receive 0 XP
- GF XP = total XP / (number of junctioned GFs for that party member)
- GF AP = fixed AP per battle (from BCI_GF_AP_EARNED)
- If ENCOUTER_BATTLE_FLAG bit 3 set → XP reset to 0 (no-XP battle)

---

## Key Global Variables

| Address | Name | Type | Description |
|---|---|---|---|
| 0x1CFF6E0 | COMBAT_SCENE_ID | u16 | Scene ID for current battle |
| 0x1CFF6E2 | ENCOUTER_BATTLE_FLAG | u16 | Battle flags bitmask |
| 0x1CFF6E7 | BATTLE_RESULT_CODE | u8 | 0=ongoing, 1=wipe, 2=escape, 3=timer, 4=victory |
| 0x1D28E08 | BACK_PREEMTIVE_INFO | u8 | 0=normal, 1-2=back, 3-4=preemptive |
| 0x1D28DE4 | BATTLE_DEAD_TIMER | u16 | Dead timer countdown |
| 0x1D28E01 | BATTLE_END_TYPE | u8 | 0=victory+music, 1=victory silent, 2=escape, 3=wipe |
| 0x1D28E1D | GILGAMESH_TRIGGERED_FLAG | u8 | 0=no, 1=triggered |
| (renamed) | BATTLE_TRANSITION_COUNTDOWN | i8 | Frame countdown to battle end transition (-1 = none) |
