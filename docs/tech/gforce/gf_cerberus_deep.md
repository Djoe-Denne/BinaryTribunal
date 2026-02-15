# 203Cerberus GF Invocation — Full Static + Runtime Reconstruction

## Scope

Comprehensive reconstruction of Cerberus (GF index 9, command_arg 0x49) invocation behavior from static analysis (IDA decompilation/disassembly) and runtime evidence file `evidence/2026-02-14T17-59-19_GF_CERBERUS_001.json`.

## High-Level Result

- Test: `GF_CERBERUS_001`
- Deterministic result: `PASS`
- command_arg: `0x49` (73) — validated via `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x49`
- Family: `FamilyB` (single-task, script-driven animation)
- Confidence: `high` (upgraded from medium/82 after full static analysis)

---

## Core Invocation Chain

| Role | Name | Address | Status |
|------|------|---------|--------|
| Entry | `GF_203Cerberus_InvokeSummonScript` | `0xB0C1A0` | Confirmed (xref at dispatch table `0xC81A9C`) |
| Init | *(inline in entry)* | `0xB0C1A0` | Not separated; entry IS the init |
| Tick | `GF_203Cerberus_SequenceTick` | `0xB0C820` | Confirmed (registered via `BdLinkTask`) |
| Counter (tick) | — | `0xB0C82A` | `++*(WORD*)(g_GfCinematic_SequenceCtxPtr + 50)` |
| Completion (tick) | — | `0xB0CA31` | Returns 2 when bit 15 of statePtr+10 is cleared |
| Scene Advance | `GF_203Cerberus_AdvanceSceneOrComplete` | `0xB181D0` | Clears bit 15 when all scenes exhausted |

### Key Difference from Doomtrain (FamilyA)

Cerberus is a **FamilyB** GF: the tick IS the driver. There is no secondary task list or dedicated driver function. The tick directly contains the animation logic, delegating to a script-based animation system rather than a frame counter state machine.

Additionally, Cerberus is a **support GF**: it deals 0 damage and applies Double + Triple to all party members.

---

## Confirmed Runtime Chain (GF_CERBERUS_001)

1. Pending action transfer hit at `0x4847F0`
2. GF cinematic dispatcher hit at `0x50B2A0`
3. Damage application hit at `0x494410` (during pre-computation, 0 damage + status)
4. Post-damage sync hit at `0x4842B0`
5. Action globals: `COMMAND_TYPE_ID=0xFE`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x49`

### Observed Effect

- Slot 0: `status2 0x40000002 -> 0x40060002` (added Double, Triple)
- Slot 1: `status2 0x40000002 -> 0x40060002` (added Double, Triple)
- Slot 2: `status2 0x40000002 -> 0x40060002` (added Double, Triple)

---

## K_GF_JUNCTIONABLE Kernel Data (Index 9)

Base: `K_GF_JUNCTIONABLE` at `0x1CF4DC0`, stride 132 bytes, Cerberus at `0x1CF5264`.

| Field | Offset | Size | Value | Description |
|-------|--------|------|-------|-------------|
| `attackType` | 6 | 1 | 11 (0x0B) | Magical GF type (same category as damage GFs) |
| `gfPower` | 7 | 1 | **0** | No damage — support GF |
| `attackFlags` | 10 | 1 | 0x21 | Attack flags (bit 0 = phys/mag, bit 5 = ?) |
| `unknown2` | 11 | 1 | 0x00 | Animation trigger type |
| `element` | 13 | 1 | **0x00** | No element |
| `statuses0` | 14 | 2 | **0x0000** | No status_1 effects |
| `statuses1` | 16 | 4 | **0x00060000** | status_2 payload (Double + Triple) |
| `statusAttackEnabler` | 27 | 1 | 0xFE (254) | Near-guaranteed status application |
| `powerMod` | 130 | 1 | **0** | No damage modifier |
| `levelMod` | 131 | 1 | **0** | No damage modifier |

### Status Payload Decode

**statuses0 = 0x0000 (status_1 bitmask):** No negative statuses.

**statuses1 = 0x00060000 (status_2 bitmask):**

| Bit | Hex | Status |
|-----|-----|--------|
| 17 | 0x00020000 | **Double** |
| 18 | 0x00040000 | **Triple** |

**Total: 2 positive status effects.** statusAttackEnabler=254 means the buffs are applied to all party targets unconditionally (only immunity blocks it).

### Support GF Damage Formula

Since `gfPower = 0`, `powerMod = 0`, `levelMod = 0`, and `element = 0`, the damage formula evaluates to **0 damage** for every target. The GF's entire purpose is status application.

---

## All Functions Identified

### Core Chain (2 functions, already named)

| Address | Name | Size | Role |
|---------|------|------|------|
| `0xB0C1A0` | `GF_203Cerberus_InvokeSummonScript` | 0x62 | Entry: context init, task creation, registers tick |
| `0xB0C820` | `GF_203Cerberus_SequenceTick` | 0x215 | Tick: resolves ctx, runs animation scripts, dispatches renders |

### Init/Setup Helpers (7 functions)

| Address | Name | Size | Role |
|---------|------|------|------|
| `0x45B5D0` | `GF_203Cerberus_InitSummonContext` | 0xD | Sets bit 0 of `dword_1CA8850` (summon context flag) |
| `0xB0C210` | `GF_203Cerberus_InitSequenceParams` | 0x39 | Stores action context ptr (a1), calls clear + init + sync |
| `0xB0C250` | `GF_203Cerberus_ClearAnimCounter` | 0xD | Clears sequence state word (ctx+0) to 0 |
| `0xB0C300` | `GF_203Cerberus_InitFullContext` | 0x2DF | Full context init: camera, models, positions, anim tables |
| `0xB17F80` | `GF_203Cerberus_InitAnimState` | 0x12 | Sets sequence state to 1, calls model data init |
| `0xB17FA0` | `GF_203Cerberus_InitModelData` | 0x228 | Loads model geometry from entity tables, builds slot array |
| `0xB18950` | `GF_203Cerberus_SetFrameLimit` | 0x11 | Sets animation frame limit: ctx+160 = 612 |

### Animation Script System (3 functions)

| Address | Name | Size | Role |
|---------|------|------|------|
| `0xB183A0` | `GF_203Cerberus_AnimScriptBackward` | 0x190 | Processes anim script commands with negative offsets (backward pass) |
| `0xB187C0` | `GF_203Cerberus_AnimScriptForward` | 0x183 | Processes anim script commands with positive offsets (forward pass) |
| `0xB181D0` | `GF_203Cerberus_AdvanceSceneOrComplete` | 0xBD | Anim script opcode: advance scene or trigger completion |

### Model/Render System (4 functions)

| Address | Name | Size | Role |
|---------|------|------|------|
| `0xB0CB40` | `GF_203Cerberus_ModelTransformTick` | 0x1CC | Per-frame bone/position updates for all model slots |
| `0xB135D0` | `GF_203Cerberus_ModelRenderDispatch` | 0xFE | Iterates render slot table, dispatches via render vtable |
| `0xB182D0` | `GF_203Cerberus_LoadModelSlotConfig` | 0xCF | Loads model slot configuration from action context |
| `0xB0CB20` | `GF_203Cerberus_ClearRenderBuffer` | 0x11 | Clears 32-byte render buffer at `unk_2798BF8` |

### Utility Functions (3 functions)

| Address | Name | Size | Role |
|---------|------|------|------|
| `0xB0C260` | `GF_203Cerberus_ResolveSharedCtx` | 0x8A | Resolves shared GF pointers from Cerberus data tables |
| `0xB0C2F0` | `GF_203Cerberus_AllocFrameMemory` | 0x10 | Allocates frame memory (calls `sub_5082D0(384)`) |
| `0xB0CA40` | `GF_203Cerberus_DebugCameraControl` | 0xDD | Debug camera: D-pad input modifies camera position/rotation |

### Resource Loader (1 function, already named)

| Address | Name | Size | Role |
|---------|------|------|------|
| `0xB0C170` | `MAG_203_CERBERUS_SUMMON_COUNTER_ROCKETS_FL` | 0x22 | Loads magic resources `MAG202B00` and `MAG202B01` |

### Shared/Infrastructure Functions (called by Cerberus)

| Address | Name | Role |
|---------|------|------|
| `0x508300` | `BS_Memset` | Battle system memset (initializes task arrays) |
| `0x508360` | `BdLinkTask` | Creates and links a new task into a task list |
| `0x56CD50` | `BattleGF_InitCameraFromGlobals` | Shared camera position init |
| `0x56CD00` | `Call_Bs_parseCamera2` | Camera parsing/update |
| `0x45D530` | `BS_Debug_UnknownFloatOperations` | Debug float operations |
| `0x5082D0` | `sub_5082D0` | Frame memory allocation (reduces memory pool counter) |
| `0xB65150` | `xorEAX_6` | No-op stub (returns 0) |

**Total functions identified: 20** (2 core + 7 init/setup + 3 animation script + 4 model/render + 3 utility + 1 resource loader)

---

## Global Variables

### Task List

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x2796DA8` | `GF_203Cerberus_TaskListHead` | dword | Task list head for BdLinkTask |
| `0x2796DB8` | *(task list data)* | struct | Task list data area (16 slots) |

### Magic Resource Pointers

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x2796DDC` | `GF_203Cerberus_MagicResPtr0` | dword | Resource MAG202B00 (loaded by resource loader) |
| `0x2796DD8` | `GF_203Cerberus_MagicResPtr1` | dword | Resource MAG202B01 (loaded by resource loader) |

### Model/Animation State

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x27973E8` | `GF_203Cerberus_CurrentModelPtr` | dword | Pointer to current model data (256-byte stride per model) |
| `0x279744C` | `GF_203Cerberus_ModelCtxPtr` | dword | Model context pointer (holds entity configs, anim state) |
| `0x2797454` | `GF_203Cerberus_AnimSlotTable` | byte[128] | Animation slot table (0xFF = end sentinel) |
| `0x2797554` | `GF_203Cerberus_RenderSlotTable` | byte[128] | Render slot table (0xFF = end sentinel) |
| `0x2797450` | `GF_203Cerberus_AnimScriptPtr` | dword | Current animation script instruction pointer |

### Camera State

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x2797968` | `GF_203Cerberus_CamInitPos` | dword | Camera initial position (from BattleGF_InitCameraFromGlobals) |
| `0x279797C` | `GF_203Cerberus_CamPosX` | dword | Camera X position |
| `0x2797980` | `GF_203Cerberus_CamPosY` | dword | Camera Y position |
| `0x2797984` | `GF_203Cerberus_CamPosZ` | dword | Camera Z position |
| `0x2797770` | `GF_203Cerberus_CamRotX` | dword | Camera X rotation |
| `0x2797774` | `GF_203Cerberus_CamRotY` | dword | Camera Y rotation (init: 512) |
| `0x2797778` | `GF_203Cerberus_CamDist` | dword | Camera distance (init: 0x4000) |

### Scene Control

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x2798218` | `GF_203Cerberus_SceneEndFlag` | byte | Scene end flag (-1 = ended) |
| `0x2798219` | `GF_203Cerberus_SceneResetFlag` | byte | Scene reset flag (0 = clear) |

### Shared GF Infrastructure (g_GfCinematic_* — shared across all GFs)

| Address | IDA Name | Type | Description |
|---------|----------|------|-------------|
| `0x27973EC` | `g_GfCinematic_SequenceCtxPtr` | dword | Active GF sequence context (resolved per-tick) |
| `0x27973B8` | `g_GfCinematic_RuntimeSlotPtr` | dword | Active GF runtime slot (resolved per-tick) |
| `0x27973BC` | `g_GfCinematic_RenderCtxPtr` | dword | Active GF render context (resolved per-tick) |
| `0x27973C0` | `g_GfCinematic_SequenceStatePtr` | dword | Active GF state pointer (resolved per-tick) |
| `0x2797624` | `g_GfCinematic_OffsetStack` | dword | Active GF stack frame (resolved per-tick) |

**Note:** The `g_GfCinematic_*` globals are shared across all GFs. Only one GF cinematic runs at a time. `GF_203Cerberus_ResolveSharedCtx` resolves these pointers from Cerberus's configuration tables at `0x1873170`-`0x1873180` on every tick.

### Dispatch Tables (read-only data)

| Address | Name | Description |
|---------|------|-------------|
| `0x1873198` | `funcs_B15007` | Model transform function vtable |
| `0x1873384` | `dword_1873384` | Model render function vtable |
| `0x1873528` | `funcs_B1845C` | Animation script opcode handler vtable |

---

## Architecture Notes

### FamilyB Single-Task Design

Cerberus uses the FamilyB single-task pattern:

1. **Single task** (`GF_203Cerberus_TaskListHead` at `0x2796DA8`): holds the `SequenceTick` function. Registered with `BS_Memset(head, data, 16, 1)` — 16 slots, capacity 1.

2. **No secondary task list**: Unlike FamilyA (Doomtrain), there is no driver delegation. The tick function IS the driver.

3. **Context resolution**: Every tick starts with `GF_203Cerberus_ResolveSharedCtx()` which calls `bs_modulo(384)` to get the task's context block, then resolves the shared global pointers from Cerberus's fixed configuration data.

### Script-Based Animation System

Instead of a frame counter state machine (FamilyA), Cerberus uses a **script-based animation system**:

1. **AnimSlotTable** (`0x2797454`): 128-byte table of model slot indices. 0xFF = sentinel (end of list).
2. **RenderSlotTable** (`0x2797554`): 128-byte table of model slots to render. 0xFF = sentinel.
3. **Animation scripts**: Binary script data loaded from model resources. Each model slot has animation data containing position velocities, bone transforms, and script commands.
4. **Three-pass tick loop**:
   - `AnimScriptBackward`: Processes script commands with negative offsets (reverse timing)
   - `ModelTransformTick`: Applies bone/position deltas to all active model slots
   - `AnimScriptForward`: Processes script commands with positive offsets (forward timing)
5. **Model rendering**: `ModelRenderDispatch` iterates the RenderSlotTable and dispatches each model's render function via the vtable at `dword_1873384`.

### Scene System

Cerberus's cinematic is divided into multiple **scenes** (sub-animations):

- `ctx+208`: Current scene index
- `ctx+209`: Maximum scene count (loaded from action context)
- `AdvanceSceneOrComplete` (animation script opcode): If `scene_index < max_scenes`, increments the index and reinitializes model data for the next scene. Otherwise, clears bit 15 of `statePtr+8`, which causes the tick's completion check to return 2 (done).

### Completion Mechanism

```
Tick return value = ((unsigned int)~*(WORD*)(statePtr + 10) >> 14) & 2
```

- Initially, `statePtr+8 = 0x80000000`, so `statePtr+10 = 0x8000` (bit 15 set) → return 0 (continue)
- When all scenes exhausted, `AdvanceSceneOrComplete` sets `statePtr+8 = 0` (bit 15 cleared) → return 2 (done)

---

## Full Pipeline: Command Injection → Status Application

Complete traced path from pending action write through to final status application on party targets. Cerberus is unique in that damage/status is applied during **pre-computation** (boost minigame), NOT during the cinematic.

### Pipeline Stages

```
STAGE 1: Command Injection
  BattlePendingAction_WriteEntry (0x484D20)
  → Writes 8-byte BattlePendingActionEntry into PENDING_ACTION_BUFFER at 0x1D28D44
  → For Cerberus: command_id=0x03(GF), command_arg=0x49, target_mask=0x8008

STAGE 2: GF Cinematic State Machine
  BattleActionSequence_Tick_GF_Cinematic (0x50B2A0)
  → 10-state state machine (states 0-9)
  → State 1: sub_50AFC0 → sets GF_CINEMATIC_SPECIAL_MODE = 0
  → State 1: BattleGF_LoadCallbackByMagicID (0x50AF20) → loads GF entry callback
  → State 3: Calls GF_CALLBACK_PTR = GF_203Cerberus_InvokeSummonScript
  → State 3: If command_type == 0xFE: BattleGF_InitBoostMinigame (0x56DCE0)

STAGE 2b: GF Boost Minigame
  BattleGF_InitBoostMinigame (0x56DCE0)
  → Registers BattleGF_BoostMinigameTick (0x56DD70) as task
  BattleGF_BoostMinigameTick (0x56DD70)
  → 6-state minigame: cases 0-4 = button press timing, case 5 = complete
  → On completion: calls BattleGF_ResolveAndStoreTargetDamage(boost_value)

STAGE 3: Pre-Compute Target Damage/Status (during boost completion)
  BattleGF_ResolveAndStoreTargetDamage (0x4850A0)
  → Sets GF_BOOST, COMMAND_TYPE_ID=0xFE, CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x49
  → Loops over target list at GF_PRECOMPUTE_TARGET_DATA (0x1D280D4):
    PER TARGET (party member):
    ├── BattleAction_ResolveAndApplyDamage (0x48FE20)
    │   ├── SWITCH 1 (case 254 / GF):
    │   │   └── Read K_GF_JUNCTIONABLE[cmd_arg-64]:
    │   │       HIT_ELEMENT = .element (0x00 = no element)
    │   │       HIT_ATTACK_ENABLER = .statusAttackEnabler (0xFE = 254)
    │   │       HIT_STATUS_1 = .statuses0 (0x0000 = none)
    │   │       HIT_STATUS_2 = .statuses1 (0x00060000 = Double+Triple)
    │   │       GF_SUMMON_MAG_BONUS = byte_1CFF321[12*cmd_arg]
    │   ├── SWITCH 2 (case 254 / GF):
    │   │   └── Read K_GF_JUNCTIONABLE[cmd_arg-64]:
    │   │       GF_POWER_MOD = .powerMod (0)
    │   │       GF_LEVEL_MOD = .levelMod (0)
    │   │       ATTACK_FLAG = .attackFlags (0x21)
    │   │       gfPower = .gfPower (0)
    │   │   └── Damage_ComputeRawDeltaFromAttackType (0x4922B0)
    │   │       └── case ATTACK_TYPE_GF (11):
    │   │           └── ComputeMagicAndGFDamage (0x491AD0) type=2
    │   │               → With gfPower=0: damage = 0
    │   │               → domain::BattleStatus_ApplyHitStatus (0x4914E0)
    │   │                   → Applies HIT_STATUS_2 = 0x00060000 (Double+Triple)
    │   │                   → statusAttackEnabler=254 → near-guaranteed success
    │   ├── Battle_ApplyDamageOrHeal (0x494410)
    │   │   → Applies 0 damage + Double+Triple status to party member
    │   └── (no drain for support GF)
    └── Battle_UpdateDamage (0x48EF80)
        └── Stores 24-byte BattleDamageResultRecord into
            BATTLE_DAMAGE_RESULT_BUFFER (0x1D28344) + 24*hit_index

STAGE 4: Cerberus Cinematic Execution (script-driven, variable frame count)
  GF_203Cerberus_InvokeSummonScript (0xB0C1A0) → Entry
  GF_203Cerberus_SequenceTick (0xB0C820) → Tick = Driver (FamilyB)
  → Per-tick: ResolveSharedCtx → copy positions → run anim scripts → render
  → Completion: when all scenes exhausted → returns 2

STAGE 5: Cinematic Cleanup (NO damage trigger for Cerberus)
  BattleActionSequence_Tick_GF_Cinematic state 9:
  → GF_CINEMATIC_SPECIAL_MODE == 0 (set in sub_50AFC0)
  → Condition (SPECIAL_MODE == 3) is FALSE → BattleGF_CinematicTriggerDamageFromCtx NOT called
  → Status was already applied during Stage 3 pre-computation
  → Cleanup: clear update flags, set result flag, return 2

STAGE 6: Post-Damage
  domain::BattleStatus_UpdateSlotStatusCopy (0x47E2D0)
  → Copies final status_1/status_2 to status_1_copy/status_2_copy
```

### Support GF Pipeline Summary

The key architectural difference for support GFs like Cerberus:

1. **Damage/status applied during pre-computation** (Stage 3): Unlike damage GFs which may defer visual effects, all HP changes and status modifications happen immediately during `BattleGF_ResolveAndStoreTargetDamage`.

2. **No cinematic damage trigger** (Stage 5): `GF_CINEMATIC_SPECIAL_MODE = 0` means the shared cinematic state machine's state 9 does NOT call `BattleGF_CinematicTriggerDamageFromCtx`. The pre-computed results in `BATTLE_DAMAGE_RESULT_BUFFER` are not re-applied.

3. **Zero damage**: With `gfPower=0`, `powerMod=0`, `levelMod=0`, the damage formula evaluates to 0. The GF's only effect is status application.

4. **Party targeting**: `target_mask = 0x8008` targets party members (slots 0-2) rather than enemies.

---

## Command Injection (Runtime-Validated)

```
Raw bytes at 0x1D28D44: 08 80 00 03 49 00 00 01
                         ^^^^       ^^          ^^
                    target_mask  cmd_arg     active
```

- `command_id = 0x03` (GF)
- `command_arg = 0x49` (73 = Cerberus)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

---

## Dispatch Table Reference

The entry function is stored at `0xC81A9C` in the GF cinematic callback function pointer table. Cerberus appears at offset 0x30 from Doomtrain's position (`0xC81A6C`), consistent with 12 GF entries apart (4 bytes each).

---

## Breakpoint Outcome Matrix (GF_CERBERUS_001)

| Breakpoint | Address | Result |
|------------|---------|--------|
| `sync_atb` | `0x4842B0` | HIT |
| `bp_pending_transfer` | `0x4847F0` | HIT |
| `bp_gf_cinematic` | `0x50B2A0` | HIT |
| `bp_cerberus_entry` | `0xB0C1A0` | not hit (dispatch timing) |
| `bp_cerberus_counter_inc` | `0xB0C82A` | not hit (dispatch timing) |
| `bp_resolve_and_apply` | `0x48FE20` | not hit (timing during boost) |
| `bp_apply_damage` | `0x494410` | HIT |
| `sync_post_damage` | `0x4842B0` | HIT |

---

## IDA Rename Summary (2026-02-15)

**Cerberus-specific functions renamed: 16**
- 2 core chain (entry + tick, already named) + 7 init/setup + 3 animation script + 4 model/render

**Cerberus-specific globals renamed: 17**
- Task list, magic resources, model/animation state, camera state, scene control

**Pipeline comments added: 14**
- Entry, tick, counter, completion, init, model data, scene advance, animation scripts, model transform, model render, context resolver, GF_CINEMATIC_SPECIAL_MODE path (2 locations)

**Newly renamed functions (this session): 16**

| Address | Old Name | New Name |
|---------|---------|----------|
| `0xB0C210` | `sub_B0C210` | `GF_203Cerberus_InitSequenceParams` |
| `0xB0C250` | `sub_B0C250` | `GF_203Cerberus_ClearAnimCounter` |
| `0xB0C260` | `au_re_bs_modulo_51` | `GF_203Cerberus_ResolveSharedCtx` |
| `0xB0C2F0` | `sub_B0C2F0` | `GF_203Cerberus_AllocFrameMemory` |
| `0xB0C300` | `sub_B0C300` | `GF_203Cerberus_InitFullContext` |
| `0xB0CA40` | `sub_B0CA40` | `GF_203Cerberus_DebugCameraControl` |
| `0xB0CB20` | `sub_B0CB20` | `GF_203Cerberus_ClearRenderBuffer` |
| `0xB0CB40` | `sub_B0CB40` | `GF_203Cerberus_ModelTransformTick` |
| `0xB135D0` | `sub_B135D0` | `GF_203Cerberus_ModelRenderDispatch` |
| `0xB17F80` | `sub_B17F80` | `GF_203Cerberus_InitAnimState` |
| `0xB17FA0` | `sub_B17FA0` | `GF_203Cerberus_InitModelData` |
| `0xB181D0` | `sub_B181D0` | `GF_203Cerberus_AdvanceSceneOrComplete` |
| `0xB182D0` | `sub_B182D0` | `GF_203Cerberus_LoadModelSlotConfig` |
| `0xB183A0` | `sub_B183A0` | `GF_203Cerberus_AnimScriptBackward` |
| `0xB187C0` | `sub_B187C0` | `GF_203Cerberus_AnimScriptForward` |
| `0xB18950` | `sub_B18950` | `GF_203Cerberus_SetFrameLimit` |

**Newly renamed globals (this session): 17**

| Address | Old Name | New Name |
|---------|---------|----------|
| `0x2796DA8` | `dword_2796DA8` | `GF_203Cerberus_TaskListHead` |
| `0x2796DDC` | `dword_2796DDC` | `GF_203Cerberus_MagicResPtr0` |
| `0x2796DD8` | `dword_2796DD8` | `GF_203Cerberus_MagicResPtr1` |
| `0x279744C` | `dword_279744C` | `GF_203Cerberus_ModelCtxPtr` |
| `0x2797454` | `dword_2797454` | `GF_203Cerberus_AnimSlotTable` |
| `0x2797554` | `dword_2797554` | `GF_203Cerberus_RenderSlotTable` |
| `0x27973E8` | `dword_27973E8` | `GF_203Cerberus_CurrentModelPtr` |
| `0x2797450` | `dword_2797450` | `GF_203Cerberus_AnimScriptPtr` |
| `0x2797968` | `dword_2797968` | `GF_203Cerberus_CamInitPos` |
| `0x279797C` | `dword_279797C` | `GF_203Cerberus_CamPosX` |
| `0x2797980` | `dword_2797980` | `GF_203Cerberus_CamPosY` |
| `0x2797984` | `dword_2797984` | `GF_203Cerberus_CamPosZ` |
| `0x2797770` | `dword_2797770` | `GF_203Cerberus_CamRotX` |
| `0x2797774` | `dword_2797774` | `GF_203Cerberus_CamRotY` |
| `0x2797778` | `dword_2797778` | `GF_203Cerberus_CamDist` |
| `0x2798218` | `byte_2798218` | `GF_203Cerberus_SceneEndFlag` |
| `0x2798219` | `byte_2798219` | `GF_203Cerberus_SceneResetFlag` |

**Total IDA database changes: 16 function renames, 17 global renames, 14 comments**

---

## Notes

- The entry/counter probes were armed but not hit in GF_CERBERUS_001 due to dispatch timing (the BP was set too late relative to when the function was first called). The functions are confirmed correct by xref and static analysis.
- Cerberus is the first fully-analyzed **support GF** and **FamilyB GF** in this project, establishing the architectural pattern for other FamilyB GFs (Brothers, Leviathan, Alexander, etc.).
- The shared globals (formerly `gfIfrit_*`) have been renamed to `g_GfCinematic_*` to reflect their shared nature. Only one GF cinematic runs at a time, so the same globals are reused by all GFs.
- `GF_CINEMATIC_SPECIAL_MODE` is the key discriminator: value 0 (default, set in `sub_50AFC0`) means no cinematic damage trigger; value 3 means state 9 calls `BattleGF_CinematicTriggerDamageFromCtx`. Doomtrain (FamilyA) triggers damage from within its own driver, so SPECIAL_MODE is irrelevant for it. Cerberus (FamilyB, support) applies status during pre-computation, so SPECIAL_MODE 0 is correct.
- The animation script system is a significant architectural discovery: Cerberus (and likely all FamilyB GFs) use a script interpreter with three passes per tick (backward, transform, forward) rather than a frame counter state machine. The script opcodes dispatch through vtables at `funcs_B1845C` (animation) and `funcs_B15007` (transform).
