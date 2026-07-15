# FFVIII Battle State Reconstruction Report

## Scope and Method

This report reconstructs the high-level battle state model for Final Fantasy VIII from:

- Existing reverse-engineering notes under `tech/` and `product/`
- Static decompilation/disassembly of core battle-domain functions
- Live memory reads during a paused, active battle
- IDA symbol/comment/type refinement for key battle functions and globals

Rendering internals are intentionally excluded.

## Key Conclusion: Root Battle State Is Global-Backed (Not One Heap Object)

### Finding

There is no single, contiguous heap `BattleContext*` root object identified in the analyzed paths.  
Battle state is primarily represented as a **global-backed state cluster** in the `0x1D27xxx-0x1D28xxx` region, with cooperating arrays/flags/buffers.

### Evidence

- `BATTLE_SLOT_DATA` is a global array base at `0x1D27B10` (live inspected), typed as `FF8BattleSlotData_s[11]`
- Pending-action and exec-queue buffers are globals:
  - `BATTLE_PENDING_ACTION_BUFFER` at `0x1D28D44` (entries are 8-byte `battle_pending_action_entry`)
  - `BATTLE_EXEC_QUEUE_BYTES` at `0x1D288E8`
  - `BATTLE_EXEC_QUEUE_TARGET_MASKS` at `0x1D288EE`
- Encounter context (`CURRENT_ENCOUNTER_DATA_SCENE_OUT`) is global at `0x1D287DC`, typed `FF8SceneOut`
- Main loop (`main::FFBattleDirector_battleLoop`, `0x47CCB0`) orchestrates battle via global phase flags and global data regions, not via one passed context pointer

### Confidence

**High** for "global-backed distributed context".  
**Medium** for "no heap-owned substructures exist anywhere" (some pointer fields/subsystems may still be heap-backed).

## Reconstructed High-Level `BattleContext` Abstraction

Use this as Unreal-facing mirror model (conceptual aggregate over globals):

```cpp
struct BattleContext {
  // Core actors
  FF8BattleSlotData slots[11];         // global BATTLE_SLOT_DATA @ 0x1D27B10, stride 0xD0 (208)

  // Encounter snapshot / scene metadata
  FF8SceneOut sceneOut;                // global CURRENT_ENCOUNTER_DATA_SCENE_OUT @ 0x1D287DC, size 0x80 (128)

  // Command pipeline
  battle_pending_action_entry pending[3]; // BATTLE_PENDING_ACTION_BUFFER @ 0x1D28D44
  uint8_t execQueueBytes[...];            // BATTLE_EXEC_QUEUE_BYTES @ 0x1D288E8
  uint16_t execQueueTargetMasks[...];     // BATTLE_EXEC_QUEUE_TARGET_MASKS @ 0x1D288EE

  // Phase/state machine flags (global)
  uint8_t mode_StateGlobal;
  uint8_t mode3_substep;
  uint8_t mode3_subsub_step;
  uint8_t mode_3_subsubsubstep;
  uint8_t mode_3_subsubsubcondition;

  // Action-resolution transient globals (hit context)
  uint8_t ATTACKER_SLOT_ID;
  uint8_t COMMAND_TYPE_ID;
  uint8_t CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID;
  // ... HIT_* / DAMAGE_* / status-apply temporaries
};
```

## Offset and Semantic Field Mapping

## Actor Array (`FF8BattleSlotData_s`, size 0xD0 / 208)

Validated from decomp + live memory:

- `+0x08`: `status_2`
- `+0x10`: `max_atb`
- `+0x14`: `cur_atb`
- `+0x18`: `current_hp`
- `+0x1C`: `max_hp`
- `+0x7C`: `flag_data`
- `+0x80`: `status_1`
- `+0x84`: `target_info_mask`
- `+0xC1`: `spd`
- `+0xCA`: `crisis_level`

ATB logic confirms slot stride `0xD0` in `domain::BattleATB_TickAndReady` (`0x4842B0`).

## Pending Action Entry (`battle_pending_action_entry`, size 0x8)

`domain::BattlePendingAction_Write` (`0x484D20`) writes:

- `+0x0` (`u16`): `target_mask`
- `+0x2` (`u8`): `attacker_slot`
- `+0x3` (`u8`): `command_id`
- `+0x4` (`u8`): `command_arg`
- `+0x5..6`: padding (unused, always 0)
- `+0x7` (`u8`): `active`

### Confirmed command_id Values

| command_id | Command | Evidence |
|------------|---------|----------|
| 0x01 | Attack | BP capture: player Attack confirm, a3=1 |
| 0x02 | Magic | Injection test: cmd_id=0x02 + cmd_arg=0x02 cast "Fira" |
| 0x03 | GF | BP capture: player GF Ifrit confirm, a3=3 |

### Confirmed command_arg Values (GF — kernel IDs, NOT sequential)

| command_arg | GF | Evidence |
|-------------|-----|----------|
| 0x42 (66) | Ifrit | BP capture at `BattlePendingAction_Write` during Ifrit summon |

### Runtime Samples

- **Attack** (paused battle): `attacker_slot=1`, `command_id=1`, `command_arg=0`, `target_mask=0x10`
- **GF Ifrit** (BP capture): `attacker_slot=0`, `command_id=3`, `command_arg=0x42`, `target_mask=0x8008`
  - Raw bytes: `08 80 00 03 42 00 00 01`

## Exec Queue Bridge

`domain::BattlePendingAction_TransferToExecQueue` (`0x4847F0`) copies pending entries into:

- `BATTLE_EXEC_QUEUE_BYTES` (`0x1D288E8`)
- `BATTLE_EXEC_QUEUE_TARGET_MASKS` (`0x1D288EE`)

Confirmed mapping:

- `pending.target_mask` -> exec `u16` target-mask array
- attacker/command bytes copied into exec byte lanes used by arbitration

## Phase Flags and Tick State

Live snapshot during active paused battle:

- `mode_StateGlobal = 3` (battle mode)
- `mode3_substep = 3`
- `mode3_subsub_step = 1`
- `mode_3_subsubsubstep = 4` (main active battle tick path)
- `mode_3_subsubsubcondition = 0xFF`

Interpretation: battle-loop is in active runtime subphase where pending->arb->resolve/status ticks are exercised.

## Targeting Metadata

Primary target metadata lives in `target_mask` through pending/exec pipeline:

- Written in pending entry by `domain::BattlePendingAction_Write`
- Propagated into exec queue by `domain::BattlePendingAction_TransferToExecQueue`
- Consumed by arbitration/execution selection

## RNG State

RNG usage is confirmed in battle domain (`rand()`, `GetRandomInt()` callsites in loop/action resolution).  
No definitive embedded RNG field within the reconstructed battle context cluster is yet proven.

Confidence: **Low-Medium** on "external/shared RNG state vs embedded battle-local RNG."

## Lifecycle Mapping (Allocation/Init/Reset/Cleanup)

## Allocation / Ownership

- No single `malloc/new`-style root context object was identified for battle state core.
- Core structures are globally allocated regions reused per battle.

## Initialization

Within `main::FFBattleDirector_battleLoop` (`0x47CCB0`) initialization phases:

- Encounter and party setup (`ReadSceneOutFileForSpecificEncounter`, `ParseBattleParty`, `setAllMonsterInfoFromDatSection`)
- Preemptive/back-attack and battle-state setup
- Transition into active tick subphase (`mode_3_subsubsubstep == 4`)

## Per-Frame Runtime

Active loop path includes:

- pending->exec transfer
- arbitration/select-next-action
- resolve/apply damage
- status tick/expire and special ticks

## Reset and Cleanup

- Reset-like behavior observed in status expiry and post-action globals reset paths
- Exit paths are governed by main loop states (`mode_StateGlobal` transitions to non-battle states)
- Full teardown for every peripheral global remains partially unresolved

Confidence: **Medium** overall lifecycle completeness.

## IDA Database Updates Applied

Renamed functions:

- `0x4847F0` -> `domain::BattlePendingAction_TransferToExecQueue`
- `0x484D20` -> `domain::BattlePendingAction_Write`
- `0x485160` -> `domain::BattleAction_ResolveSpecialActionAndUpdateDamage`
- `0x485460` -> `domain::BattleArbitration_SelectNextAction`

Renamed globals:

- `stru_1D28D44` -> `BATTLE_PENDING_ACTION_BUFFER`
- `byte_1D288E8` -> `BATTLE_EXEC_QUEUE_BYTES`
- `word_1D288EE` -> `BATTLE_EXEC_QUEUE_TARGET_MASKS`
- `unk_1CFF180` -> `BATTLE_ATB_UI_MIRROR`
- `BATTLE_ACTION_TAKING_PLACE?` -> `BATTLE_ACTION_TAKING_PLACE_`

Type updates:

- `BATTLE_SLOT_DATA` as `FF8BattleSlotData_s[11]`
- `CURRENT_ENCOUNTER_DATA_SCENE_OUT` as `FF8SceneOut`
- `BATTLE_PENDING_ACTION_BUFFER` as `battle_pending_action_entry[3]`

Comments were added at core loop/functions and global bases to preserve evidence context.

## Numeric Conversions (via `int_convert`)

- `0x27C` -> `636` (example encounter id observed)
- `0xD0` -> `208` (slot stride)
- `0x80` -> `128` (scene struct size)
- `0x1D27B10` -> `30571280` (slot array base)
- `0x1D28D44` -> `30575940` (pending buffer base)

## Confidence Matrix

- Actor slots layout and semantics: **High**
- ATB field mapping and tick behavior: **High**
- Pending/exec command pipeline structure: **High**
- Phase-flag interpretation: **High**
- Root ownership model (global-backed cluster): **High**
- Lifecycle completeness (all reset/cleanup details): **Medium**
- RNG embeddedness in battle context: **Low-Medium**

## Remaining Gaps

- Exact dimensions/packing for full exec-queue arrays
- Exhaustive reset/cleanup writes for all transient globals
- Definitive storage origin for RNG state used by battle-domain calls

These gaps do not block a practical Unreal mirror of battle state, but they matter for exact engine parity and deterministic replay.
