# Random Encounter System

Complete technical documentation for FF8's field and world map encounter triggers.

## Field Random Encounter System

### Function: `Field_Encounter_RollAndSelectScene` (0x47CA90)

Called every frame from the field state machine (`Field_MainStateMachineTick`, 0x4789A0). The function is a single tick of the encounter system: it increments a fractional meter, detects "steps", accumulates danger, and compares against a shuffled threshold table to trigger encounters.

### Guard Conditions

Before any danger processing, the function checks multiple gates:

1. `globalFieldNextModuleID != 1 && != 7` — not already transitioning
2. `Field_IsCutsceneActive()` returns 0 — no active cutscene/event
3. `VAR_MAP_ADDRESS->unused8[3] == 0` — field allows encounters
4. `FIELD_STATE_MODE` not 2, 3, or 4 — field state not in menu/transition
5. `FIELD_ENC_DISABLED != 1` — encounters not temporarily disabled
6. `RARE_ITEM_ABILITY_IN_IT & 0x08 == 0` — **Enc-None** ability not active

### Step 1: Danger Increment

```c
uint8_t* rate_ptr = *(uint8_t**)FIELD_ENC_RATE_PTR;  // field-specific encounter rate
if (RARE_ITEM_ABILITY_IN_IT & 0x04)                   // Enc-Half active
    FIELD_ENC_METER += (*rate_ptr) >> 1;               // halved increment
else
    FIELD_ENC_METER += *rate_ptr;                      // full increment
```

- `FIELD_ENC_RATE_PTR` (0x1CF3D48) is a pointer to the current field's encounter rate byte, initialized in `Field_FRAME` during field loading from field map data.
- `FIELD_ENC_METER` (0x1CDC740) is the **encounter meter** — a fractional accumulator.
- The per-field encounter rate varies by map (e.g., dungeons have higher rates than towns).

### Step 2: Step Detection

```c
if (FIELD_ENC_METER > 0x100) {                       // overflow threshold = 256
    FIELD_ENC_METER = (uint8_t)FIELD_ENC_METER;      // keep fractional part (modulo 256)
    // ... step processing below
}
```

A "step" occurs when the meter exceeds 256. The meter wraps, keeping the fractional remainder. For a field with encounter rate = 5, one step occurs roughly every 256/5 ≈ 51 frames (~0.85 seconds at 60fps). With Enc-Half, the rate is halved so steps take twice as long.

### Step 3: Danger Rating Accumulation

```c
FIELD_DANGER_RATING += *(int16_t*)(region_data_base + 612 * region_index + 510) / 1348;
```

- `FIELD_DANGER_RATING` (0x1CDC74A) is the **danger rating** — accumulates per step.
- The increment is derived from field region data (at offset +510 within a 612-byte region struct). The `/1348` divisor normalizes it.

### Step 4: Danger Check vs. Threshold Table

```c
FIELD_STEP_COUNTER++;                                // step counter (wraps at 256)
if (FIELD_STEP_COUNTER == 0)                         // every 256 steps
    FIELD_CYCLE_BONUS += 13;                         // cycle bonus

uint8_t threshold = FIELD_CYCLE_BONUS + DANGER_LIMIT_TABLE[FIELD_STEP_COUNTER];

if (threshold < FIELD_DANGER_RATING) {               // encounter triggers!
    globalFieldNextModuleID = 3;                     // switch to battle module
    // ... formation selection below
}
```

- `FIELD_STEP_COUNTER` (0x1CD2FB8) — **step counter**, increments per step, wraps 0→255→0.
- `FIELD_CYCLE_BONUS` (0x1CDC748) — **cycle bonus**, increases by 13 every 256 steps. This makes early encounters harder to trigger but guarantees encounters eventually.
- `DANGER_LIMIT_TABLE` at `0xB80A18` — the 256-entry shuffled threshold table.

The danger check compares the pseudo-random threshold (`table[step] + cycle_bonus`) against the accumulated danger rating. As the danger rating grows with each step, it will eventually exceed any threshold, guaranteeing an encounter.

### Step 5: Formation Selection

When an encounter triggers, a formation is selected from the field's 4-entry formation table:

```c
uint8_t roll = DANGER_LIMIT_TABLE[(TOTAL_ENCOUNTER + 1) & 0xFF];   // pseudo-random
uint16_t* formations = *(uint16_t**)FIELD_FORMATION_TABLE_PTR;      // 4 formation IDs

if (roll < 0x80 && formations[0] != FIELD_LAST_FORMATION_ID)        // 50%
    scene_id = formations[0];
else if (roll < 0xC0 && formations[1] != FIELD_LAST_FORMATION_ID)   // 25%
    scene_id = formations[1];
else if (roll < 0xF0 && formations[2] != FIELD_LAST_FORMATION_ID)   // 18.75%
    scene_id = formations[2];
else                                                                 // 6.25%
    scene_id = formations[3];

FIELD_LAST_FORMATION_ID = scene_id;  // store for anti-repeat
```

**Probabilities**: 50% / 25% / 18.75% / 6.25% based on the roll value from the danger table indexed by `TOTAL_ENCOUNTER + 1`. This is deterministic given the encounter count, not truly random.

**Anti-repeat**: If the selected formation matches `FIELD_LAST_FORMATION_ID` (last encounter), the selection falls through to the next formation. This prevents the same encounter twice in a row.

**Output**:
- `MenuState_opcode_menu_id` ← selected scene ID
- `globalFieldNextModuleID = 3` (request battle transition)
- `TOTAL_ENCOUNTER++`
- `FIELD_DANGER_RATING = 0` (reset danger rating)

### Danger Limit Table

Located at `DANGER_LIMIT_TABLE` (`0xB80A18`, field) and duplicated at `Encounter_RandomRollArray` (`0xC75D20`, world map). 256 entries, each a uint8. The table is a fixed permutation of values 0–255:

```
  7, 182, 240,  31,  85,  91,  55, 227, 174,  79, 178,  94, 153, 246, 119, 203,
 96, 143,  67,  62, 167,  76,  45, 136, 199, 104, 215, 209, 194, 242, 193, 221,
170, 147,  22, 247,  38,   4,  54, 161,  70,  78,  86, 190, 108, 110, 128, 213,
181, 142, 164, 158, 231, 202, 206,  33, 255,  15, 212, 140, 230, 211, 152,  71,
244,  13,  21, 237, 196, 228,  53, 120, 186, 218,  39,  97, 171, 185, 195, 125,
133, 252, 149, 107,  48, 173, 134,   0, 141, 205, 126, 159, 229, 239, 219,  89,
235,   5,  20, 201,  36,  44, 160,  60,  68, 105,  64, 113, 100,  58, 116, 124,
132,  19, 148, 156, 150, 172, 180, 188,   3, 222,  84, 220, 197, 216,  12, 183,
 37,  11,   1,  28,  35,  43,  51,  59, 151,  27,  98,  47, 176, 224, 115, 204,
  2,  74, 254, 155, 163, 109,  25,  56, 117, 189, 102, 135,  63, 175, 243, 251,
131,  10,  18,  26,  34,  83, 144, 207, 122, 139,  82,  90,  73, 106, 114,  40,
 88, 138, 191,  14,   6, 162, 253, 250,  65, 101, 210,  77, 226,  92,  29,  69,
 30,   9,  17, 179,  95,  41, 121,  57,  46,  42,  81, 217,  93, 166, 234,  49,
129, 137,  16, 103, 245, 169,  66, 130, 112, 157, 146,  87, 225,  61, 241, 249,
238,   8, 145,  24,  32, 177, 165, 187, 198,  72,  80, 154, 214, 127, 123, 233,
118, 223,  50, 111,  52, 168, 208, 184,  99, 200, 192, 236,  75, 232,  23, 248
```

### Enc-None and Enc-Half

Both are bits in `RARE_ITEM_ABILITY_IN_IT` (0x1CFF6D8):

| Bit | Value | Ability | Effect |
|-----|-------|---------|--------|
| 2 | 0x04 | Enc-Half | Danger increment halved (`*rate >> 1`) |
| 3 | 0x08 | Enc-None | Function returns immediately (no encounters) |
| 0 | 0x01 | Initiative | Shifts preemptive/back-attack RNG (see below) |

---

## Field Scripted Battles

### Function: `SCRIPT_BATTLE` (0x523294)

Field scripts can force battles via the `BATTLE` opcode. This pops a scene ID and battle flags from the script stack:

```c
ENCOUTER_BATTLE_FLAG = script_pop();  // flags byte
MenuState_opcode_menu_id = script_pop();  // scene ID
globalFieldNextModuleID = 3;  // trigger battle
```

The `ENCOUTER_BATTLE_FLAG` controls forced preemptive/back-attack and other battle properties (see below).

---

## World Map Random Encounter System

### Function: `WM_Encounter_RollAndSelectScene` (0x541C80)

Called from `FFWorldDirector` (0x53F4B0) during the world map frame tick. The mechanism mirrors the field system but with terrain-dependent encounter rates.

### Guard Conditions

1. `RARE_ITEM_ABILITY_IN_IT & 0x08 == 0` — Enc-None not active
2. Vehicle check: `world_currentVehicle < 0x0A || world_currentVehicle == 128` — on foot, chocobo, or car
   - Vehicle IDs >= 10 (except 128) suppress encounters (Garden, Ragnarok, etc.)
3. `isStateOfMovement != 0` — party must be moving

### Terrain Detection

```c
uint8_t region = wm_GetRegionNumber(WORLD_MAP_COORD_X, WORLD_MAP_COORD_Y);
uint8_t terrain = *(Worldmap_weirdregister0_LocationDRAW + 13);
```

- Terrain types 27 and 28 (roads?) suppress encounters entirely.
- Region + terrain are matched against entries in `addressToWmsetS1` (wmset encounter data).

### Danger Increment

```c
uint8_t enc_half = (RARE_ITEM_ABILITY_IN_IT >> 2) & 1;  // 1 if Enc-Half, 0 otherwise
WM_ENC_METER += 16 >> (2 * enc_half);  // 16 normally, 4 with Enc-Half
```

- `WM_ENC_METER` (0x2040A5C) is the world map encounter meter.
- Fixed increment of **16** per frame while moving (vs. field's variable rate).
- With Enc-Half: increment is **4** (quarter of normal, since `16 >> 2 = 4`).

### Step and Danger Check

When `WM_ENC_METER > 256`:

```c
WM_ENC_METER = 0;  // reset meter
LOCOMOTION_METHOD += isStateOfMovement >> 3;  // movement accumulator

// Step counter + cycle bonus (same mechanism as field)
WM_STEP_AND_BONUS.byte0++;            // step counter
if (WM_STEP_AND_BONUS.byte0 == 0)
    WM_CYCLE_BONUS += 13;             // cycle bonus

uint8_t threshold = Encounter_RandomRollArray[step_counter] - WM_CYCLE_BONUS;
uint8_t encounter_rate = terrain_encounter_rate + LOCOMOTION_METHOD;

if (threshold < encounter_rate) {
    // Encounter triggered!
}
```

- Uses `Encounter_RandomRollArray` (0xC75D20) — same 256-entry table as field's `DANGER_LIMIT_TABLE`.
- Encounter rate comes from wmset terrain data (`wmsetS3` or lookup by region/terrain).

### Formation Selection

World map formations come from wmset encounter tables:

```c
// Select formation from 8-entry table per terrain
*output_scene_id = wmset_formation_table[terrain * 8 + formation_index];
```

- 8 formations per terrain, with probability weights from wmset data.
- Anti-repeat: if `WM_LAST_FORMATION_ID == selected`, re-roll up to 2 times.
- `WM_LAST_FORMATION_ID` stores the last world map encounter formation ID.

### World Map Encounter Transition

When `WM_Encounter_RollAndSelectScene` returns 1:

```c
WM_PENDING_MODULE_ID = 3;                 // battle module
WM_PENDING_SCENE_LO = scene_id;
WM_PENDING_SCENE_HI = scene_id_hi;
ENCOUTER_BATTLE_FLAG = 0;                  // random (no forced flags)
TOWN_BATTLE_SCENE = 1;                     // transition initiated
```

### Special World Map Encounters

After `WM_Encounter_RollAndSelectScene`, the `FFWorldDirector` also checks:

- `World_JumboCactuarEncounter` — special encounter for Jumbo Cactuar
- `World_SetPendingBattleScene` — forced encounters from specific map events
- Scripted encounters from location events via DLL callback

---

## Battle Init Handoff (Part C)

### Module Transition Sequence

**Field → Battle**:
1. `Field_Encounter_RollAndSelectScene` writes `MenuState_opcode_menu_id` (scene ID) + `globalFieldNextModuleID = 3`
2. `main::FFFieldModule_field_main_loop` detects `globalFieldNextModuleID == 3`, returns to module handler
3. `main::FFModuleHandler_main_loop` reads `MenuState_opcode_menu_id` → writes `COMBAT_SCENE_ID`

**World Map → Battle**:
1. `WM_Encounter_RollAndSelectScene` returns scene ID via output parameter
2. `FFWorldDirector` writes `WM_PENDING_MODULE_ID = 3` + scene data
3. `FFModuleHandler_main_loop` reads `WM_PENDING_SCENE_HI` → writes `COMBAT_SCENE_ID`

**Both paths converge**: `FFModuleHandler_main_loop` launches the battle module, which reads `COMBAT_SCENE_ID` to load `ReadSceneOutFileForSpecificEncounter(COMBAT_SCENE_ID, &CURRENT_ENCOUNTER_DATA_SCENE_OUT)`.

### Preemptive / Back Attack Resolution

**Function**: `Battle_InitPreemptiveBackAttackStatus` (0x48AFD0)

Called during battle initialization after scene data is loaded.

#### Forced Modes (from `ENCOUTER_BATTLE_FLAG`, 0x1CFF6E2)

| Bit | Value | Effect |
|-----|-------|--------|
| 7 | 0x80 | Suppress preemptive/back-attack (always normal) |
| 5 | 0x20 | Force preemptive |
| 6 | 0x40 | Force back attack |
| 2 | 0x04 | Enable battle countdown timer |
| 1 | 0x02 | Suppress battle music (clear = play music) |
| 0 | 0x01 | Set RELATED_CANT_ESCAPE (can't run) |

`ENCOUTER_BATTLE_FLAG` is set by `SCRIPT_BATTLE` for scripted encounters, or **0** for random encounters. The flag is merged with `CURRENT_ENCOUNTER_DATA_SCENE_OUT.battle_flags` during init.

#### Random RNG Mode (for random encounters)

When no flags force the outcome:

```c
// 1. Base value: check if all enemies have death immunity
int base = all_enemies_immune ? 20 : 0;

// 2. Party modifier from Battle_CheckPartyAbilityForPreemptive(2, -20)
int party_mod = any_party_member_has_back_attack_flag ? -20 : 0;

// 3. RNG roll
int random_int = GetRandomInt() + base + party_mod;  // 0-255 + modifiers

// 4. Initiative ability adjustment
if (RARE_ITEM_ABILITY_IN_IT & 0x01)  // Initiative
    random_int -= 20;

// 5. Determine outcome
if (random_int < 20)
    outcome = PREEMPTIVE;    // ~7.8% base chance
else if (random_int >= 236)
    outcome = BACK_ATTACK;   // ~7.8% base chance
else
    outcome = NORMAL;        // ~84.3% base chance

// 6. Initiative blocks back attacks
if ((RARE_ITEM_ABILITY_IN_IT & 0x01) && outcome == BACK_ATTACK)
    outcome = NORMAL;
```

**Result stored in**: `BACK_PREEMTIVE_INFO` (0x1D28E08)

| Value | Outcome | Party Position | Enemy Status |
|-------|---------|---------------|--------------|
| 0 | Normal | Normal positions | — |
| 1 | Preemptive | Forward positions | — |
| 2 | Back Attack | Normal | Party gets back-attack status |
| 3 | Pincer | — | — |
| 4 | Side Attack | — | Enemy gets back-attack status |

---

## Key Global Variables

### Field Encounter

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x1CDC740` | `FIELD_ENC_METER` | uint16 | Encounter meter (fractional accumulator, overflows at 256) |
| `0x1CDC74A` | `FIELD_DANGER_RATING` | uint16 | Danger rating (accumulated per step, compared vs threshold) |
| `0x1CD2FB8` | `FIELD_STEP_COUNTER` | uint8 | Step counter (0-255, wraps) |
| `0x1CDC748` | `FIELD_CYCLE_BONUS` | uint8 | Cycle bonus (+13 every 256 steps) |
| `0xB80A18` | `DANGER_LIMIT_TABLE` | uint8[256] | Danger Limit Table (field copy) |
| `0x1CF3D48` | `FIELD_ENC_RATE_PTR` | ptr→uint8 | Field-specific encounter rate (from field map data) |
| `0x1CF3D78` | `FIELD_FORMATION_TABLE_PTR` | ptr→uint16[4] | Field formation table (4 scene IDs) |
| `0x1CDC6E0` | `FIELD_LAST_FORMATION_ID` | uint16 | Last encounter formation ID (anti-repeat) |
| `0x1CDBFEC` | `TOTAL_ENCOUNTER` | uint8 | Total encounter count (indexes table for formation selection) |
| `0x1CE4762` | `MenuState_opcode_menu_id` | uint16 | Selected scene ID (field → battle handoff) |
| `0x1CFF6D8` | `RARE_ITEM_ABILITY_IN_IT` | uint8 | Ability flags (bit 0=Initiative, 2=Enc-Half, 3=Enc-None) |
| `0x1CD2EF8` | `FIELD_ENC_TRIGGERED` | uint8 | Set to 1 on encounter trigger |
| `0x1CDC74C` | `FIELD_ENC_DISABLED` | uint8 | Encounter disable flag (1 = encounters off) |
| `0x1CE4868` | `FIELD_STATE_MODE` | uint16 | Field state (2/3/4 = menu/transition, blocks encounters) |

### World Map Encounter

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x2040A5C` | `WM_ENC_METER` | uint16 | World map encounter meter |
| `0x2040A5E` | `LOCOMOTION_METHOD` | uint8 | Movement accumulator (adds to encounter rate) |
| `0x2040A60` | `WM_STEP_AND_BONUS` | multi | Byte 0: step counter, byte 1: cycle bonus counter |
| `0x2040A5F` | `WM_CYCLE_BONUS` | uint8 | World map cycle bonus |
| `0xC75D20` | `Encounter_RandomRollArray` | uint8[256] | Danger Limit Table (world map copy, same data as field) |
| `0x20409E0` | `world_currentVehicle` | uint8 | Current vehicle ID (< 10 or 128 allows encounters) |
| `0x20400A0` | `WM_LAST_FORMATION_ID` | uint16 | Last world map encounter ID (anti-repeat) |

### Battle Init / Transition

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x1CFF6E0` | `COMBAT_SCENE_ID` | uint16 | Active battle scene ID |
| `0x1CFF6E2` | `ENCOUTER_BATTLE_FLAG` | uint8 | Battle flags (preemptive/back-attack/escape/music) |
| `0x1CE4760` | `globalFieldNextModuleID` | uint8 | Module transition request (3 = battle) |
| `0x2036B4C` | `WM_PENDING_MODULE_ID` | uint8 | World map module transition (3 = battle) |
| `0x2036B4E` | `WM_PENDING_SCENE_LO` | uint8 | World map scene ID (low byte) |
| `0x2036B4F` | `WM_PENDING_SCENE_HI` | uint8 | World map scene ID (high byte) |
| `0x1D28E08` | `BACK_PREEMTIVE_INFO` | uint8 | Battle start type (0=normal, 1=preemptive, 2=back attack) |

## Function Address Summary

| Address | Name | Role |
|---------|------|------|
| `0x47CA90` | `Field_Encounter_RollAndSelectScene` | Field encounter tick: increment, check, select, trigger |
| `0x541C80` | `WM_Encounter_RollAndSelectScene` | World map encounter tick |
| `0x54A7F0` | `World_Encounter_CheckAndTrigger` | World map encounter orchestrator |
| `0x523294` | `SCRIPT_BATTLE` | Field script: forced battle opcode |
| `0x48AFD0` | `Battle_InitPreemptiveBackAttackStatus` | Preemptive/back-attack RNG resolution |
| `0x48B260` | `Battle_CheckPartyAbilityForPreemptive` | Party ability check for preemptive modifier |
| `0x52B3A0` | `Field_IsCutsceneActive` | Returns 1 if cutscene/event blocks encounters |
| `0x53F4B0` | `FFWorldDirector` | World map state machine (calls WM_Encounter) |
| `0x4706B0` | `FFModuleHandler_main_loop` | Module dispatcher (COMBAT_SCENE_ID handoff) |
