## Task: Map the Complete Battle Initialization Sequence

### Context

FF8's battle loop (`FFBattleDirector_battleLoop` at 0x47CCB0) uses a state
machine driven by `mode_StateGlobal`, `mode3_subsub_step`, and
`mode_3_subsubsubstep`. The active per-frame battle tick only runs when:
  mode_StateGlobal == 3 && mode3_subsub_step == 3 && mode_3_subsubsubstep == 4

Before reaching this state, the battle module runs through initialization
substeps (subsubsubstep 0→3 and possibly earlier sub_step values). This init
sequence loads scene data, initializes party and enemy slots, applies junction
stats, sets up preemptive/back-attack, runs enemy AI init scripts, and
transitions to the active tick.

We have fragments documented but not the complete sequential flow.

### What We Already Know (Fragments)

| Function | Address | What It Does | When |
|----------|---------|--------------|------|
| `ReadSceneOutFileForSpecificEncounter` | Unknown exact | Reads scene.out at `scene_id << 7` into `CURRENT_ENCOUNTER_DATA_SCENE_OUT` | Early init |
| `setMonsterInfoFromDatInfoSection` | `0x48BBD0` | Loads enemy .dat data: stats, AI, abilities, draw/mug tables, innate statuses | After scene load |
| `Battle_InitPartySlotStatusFromChar` | `0x48B5F0` | Inits party slot statuses: Auto-Haste, Auto-Protect, Auto-Shell from abilities | After slot setup |
| `Battle_InitPreemptiveBackAttackStatus` | `0x48AFD0` | Resolves preemptive/back-attack from flags + RNG | After slots ready |
| `BattleGF_InitCameraFromGlobals` | `0x56CD50` | Camera position init | Presentation init |
| Odin check | `0x482E00` | `Odin_BattleInit_ZantetsukenCheck` — 12.5% auto-trigger | After enemy init, before first tick |
| Gilgamesh check | `0x4831F0` | `Gilgamesh_BattleInit_TriggerCheck` — 3.1% auto-trigger | Same timing as Odin |

### Steps

#### Step 1: Map the State Machine Transitions

Starting from `FFBattleDirector_battleLoop` (0x47CCB0), trace the complete
state machine for `mode_StateGlobal == 3`:

```
mode3_subsub_step: 0 → 1 → 2 → 3
For each subsub_step:
  mode_3_subsubsubstep: 0 → 1 → 2 → 3 → 4
```

For each (subsub_step, subsubsubstep) pair, document:
- What function(s) are called
- What they do
- What global state they modify
- The transition condition to the next step

The active battle tick is at (3, 4). Everything before that is init.

**Approach**: Set breakpoints on known init functions (0x48BBD0, 0x48B5F0,
0x48AFD0, 0x482E00) and trigger a battle. Record the values of
mode3_subsub_step and mode_3_subsubsubstep at each breakpoint hit.
This gives the ordering.

Alternatively, decompile the switch/case structure in `FFBattleDirector_battleLoop`
for each subsub_step value.

#### Step 2: Document Scene Data Loading

Trace `ReadSceneOutFileForSpecificEncounter`:
1. Where is it called from? (Which substep?)
2. How does it read from the battle archive? (Direct file I/O or memory-mapped?)
3. What is the exact layout of `CURRENT_ENCOUNTER_DATA_SCENE_OUT`?
   We know it's 128 bytes from scene.out documentation:
   - Enemy IDs (up to 8)
   - Enemy positions (x, y, z per slot)
   - Battle flags
   - What else?
4. How are the enemy .dat files loaded? (Triggered by enemy IDs in scene data?)

#### Step 3: Document Party Slot Initialization

The party side of init must:
1. Copy character data from save/game state into `BATTLE_SLOT_DATA[0..2]`
2. Apply junction stat boosts (magic junctioned to STR, MAG, etc.)
3. Set command sets (the 4 battle commands per character)
4. Apply support abilities (Auto-Haste, Auto-Protect, Auto-Shell, etc.)
5. Initialize ATB gauges (0 normally, or modified for preemptive)
6. Set initial HP/status from save state

For each step, find:
- The function address
- What it reads from (save data structure, junction data)
- What it writes to (BATTLE_SLOT_DATA offsets)

**Key question**: Junction → stat calculation. When a character has 100×Ultima
junctioned to STR, how is the final STR value computed? The formula likely
involves the base stat + (spell_power × junction_multiplier). Find the function
that performs this calculation during init.

**Known struct**: BATTLE_SLOT_DATA is at a known base (per-slot, ~512 bytes each).
Key offsets we know:
- +0xC1: spd
- +0xCA: crisis_level
- status_1, status_2 at known offsets
- cur_hp, max_hp at known offsets

Map the COMPLETE struct layout during init by watching memory writes to
BATTLE_SLOT_DATA[0] from the start of init to the first tick.

#### Step 4: Document Enemy Slot Initialization

Trace `setMonsterInfoFromDatInfoSection` (0x48BBD0) in detail:
1. How does it index into the .dat file sections?
2. Which fields from .dat section 7 (stats) go where in the enemy battle slot?
3. How are innate statuses applied? (Some enemies start with Float, Reflect, etc.)
4. How is the enemy level set? (Scales with party average level)
5. How are enemy stats scaled by level?

**Enemy level scaling formula**: FF8 enemies scale to party level.
The Ultimania gives the game-design formula, but find the actual code:
- Where is the average party level computed?
- How is it clamped/modified?
- Which .dat fields define the level→stat curves?

#### Step 5: Document Pre-Battle Checks

Between slot init and the first tick, several checks run:
1. **Odin auto-trigger** (0x482E00) — already documented, confirm timing
2. **Gilgamesh auto-trigger** (0x4831F0) — already documented, confirm timing
3. **Preemptive/back-attack** (0x48AFD0) — already documented, confirm timing
4. **ATB initial values**:
   - Normal: all ATB start at 0
   - Preemptive: party ATB starts full, enemies start at 0
   - Back attack: enemies ATB starts full, party at 0?
   - Confirm the actual implementation
5. **Battle music start** — where is `ENCOUTER_BATTLE_FLAG & 0x02` checked to
   suppress or play music?
6. **Encounter transition animation** — screen wipe/fade to battle. Which
   substep handles this?

#### Step 6: Document Battle End Detection

The flip side of init: how does the battle loop detect that combat is over?

1. **All enemies dead**: Where is this checked? Every frame? After each
   damage application?
2. **Party wipe**: We know `BattleFrame_PartyWipeCheck` (0x486450) runs every
   frame and can trigger Phoenix. What happens when Phoenix fails?
3. **Escape success**: Where does the flee check run and how does it exit
   the battle loop?
4. **Boss defeat special**: Some bosses have scripted endings (AI death scripts).
   How do these interact with the normal "all enemies dead" check?

When battle end is detected:
- How does mode_3_subsubsubstep transition out of 4?
- What substeps handle reward calculation?
- What handles the victory fanfare / EXP/AP/Gil screen?
- How does the module switch back to field/world map?

### Known Global Variables

| Address | Name | Description |
|---------|------|-------------|
| `0x1CFF6E0` | `COMBAT_SCENE_ID` | Scene ID for the current battle |
| `0x1CFF6E2` | `ENCOUTER_BATTLE_FLAG` | Battle flags (preemptive etc.) |
| `0x1D28E08` | `BACK_PREEMTIVE_INFO` | Result of preemptive check (0-4) |
| `0x1D28D44` | `BATTLE_PENDING_ACTION_BUFFER` | Pending action write target |

### Expected Output

1. **Complete state machine map**:
   ```
   mode3_subsub_step=0, subsubsubstep=0: [function] — [description]
   mode3_subsub_step=0, subsubsubstep=1: [function] — [description]
   ...
   mode3_subsub_step=3, subsubsubstep=3: [function] — [description]
   mode3_subsub_step=3, subsubsubstep=4: ACTIVE BATTLE TICK
   ```

2. **Party slot init sequence**: Complete ordered list of functions that
   populate BATTLE_SLOT_DATA for party members, including junction stat calc

3. **Enemy slot init sequence**: Complete ordered list for enemy slots,
   including level scaling formula

4. **BATTLE_SLOT_DATA struct layout**: As complete as possible, mapping
   offsets to field names from init observations

5. **Battle end sequence**: Detection, reward calculation, module transition

6. **Function addresses** for all newly discovered functions with proposed
   IDA rename names