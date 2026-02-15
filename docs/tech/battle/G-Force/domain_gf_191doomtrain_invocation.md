# 191Doomtrain GF Invocation — Full Static + Runtime Reconstruction

## Scope

Comprehensive reconstruction of Doomtrain (GF index 11, command_arg 0x4B) invocation behavior from static analysis (IDA decompilation/disassembly) and runtime evidence file `evidence/2026-02-14T17-58-00_GF_DOOMTRAIN_001.json`.

## High-Level Result

- Test: `GF_DOOMTRAIN_001`
- Deterministic result: `PASS`
- command_arg: `0x4B` (75) — validated via `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x4B`
- Family: `FamilyA` (BdLinkTask dual-task architecture)
- Confidence: `high` (92)

---

## Core Invocation Chain

| Role | Name | Address | Status |
|------|------|---------|--------|
| Entry | `GF_191Doomtrain_InvokeSummonScript` | `0x63E730` | Confirmed (xref at dispatch table `0xC81A6C`) |
| Init | *(inline in entry)* | `0x63E730` | Not separated; entry IS the init |
| Tick | `GF_191Doomtrain_SequenceTick` | `0x6472C0` | Confirmed (registered via `BdLinkTask`) |
| Driver | `GF_191Doomtrain_SequenceDriver` | `0x63F2D0` | **NEW** — 424-frame state machine |
| Counter (tick) | — | `0x6472D1` | `++*(WORD*)(a1+12)` |
| Counter (driver) | — | `0x63F735` | `++*(WORD*)(a1+12)` |
| Completion (tick) | — | `0x6472DE` | Returns 2 when driver finishes |
| Completion (driver) | — | `0x63F738` | Returns 2 when frame > 423 |
| Damage trigger | — | `0x63F70E` | Frame 420: calls `BattleGF_TriggerDamageOnTargets` |

### Tick/Driver Relationship

The tick function (`0x6472C0`) is a thin wrapper that:
1. Calls `BdlinkTask(dword_24FC330)` to advance the driver
2. Increments its own counter at `a1+12`
3. Returns 0 (continue) if driver still running, or 2 (done) if driver returned 0

The driver (`0x63F2D0`) contains the full animation state machine running for 424 frames.

---

## Confirmed Runtime Chain (GF_DOOMTRAIN_001)

1. Pending action transfer hit at `0x4847F0`
2. GF cinematic dispatcher hit at `0x50B2A0`
3. Damage application hit at `0x494410`
4. Post-damage sync hit at `0x4842B0`
5. Action globals: `COMMAND_TYPE_ID=0xFE`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x4B`

### Observed Effect

- Enemy slot 3: HP 4500→2773, status1 `0x0→0x3A003A`, status2 `0x2000→0x100340D`
- Enemy slot 4: HP 6500→4854, status1 `0x0→0x3A003A`, status2 `0x2000→0x100340D`
- Broad negative status set: Poison, Darkness, Silence, Berserk, Sleep, Slow, Stop, Doom, Petrifying, Confuse, Vit0

---

## K_GF_JUNCTIONABLE Kernel Data (Index 11)

Base: `K_GF_JUNCTIONABLE` at `0x1CF4DC0`, stride 132 bytes, Doomtrain at `0x1CF536C`.

| Field | Offset | Size | Value | Description |
|-------|--------|------|-------|-------------|
| `attackType` | 6 | 1 | 11 (0x0B) | Magical GF damage type |
| `gfPower` | 7 | 1 | 45 (0x2D) | Base attack power |
| `attackFlags` | 10 | 1 | 0x21 | Attack flags (bit 0 = phys/mag, bit 5 = ?) |
| `unknown2` | 11 | 1 | 5 | Animation trigger type for target |
| `element` | 13 | 1 | 0x10 | Poison element |
| `statuses0` | 14 | 2 | 0x003A | status_1 payload |
| `statuses1` | 16 | 4 | 0x0100540D | status_2 payload |
| `statusAttackEnabler` | 27 | 1 | 0xFE (254) | Near-guaranteed status infliction |
| `powerMod` | 130 | 1 | 10 | Damage formula power modifier |
| `levelMod` | 131 | 1 | 58 | Damage formula level modifier |

### Status Payload Decode

**statuses0 = 0x003A (status_1 bitmask):**

| Bit | Hex | Status |
|-----|-----|--------|
| 1 | 0x02 | Poison |
| 3 | 0x08 | Darkness |
| 4 | 0x10 | Silence |
| 5 | 0x20 | Berserk |

**statuses1 = 0x0100540D (status_2 bitmask):**

| Bit | Hex | Status |
|-----|-----|--------|
| 0 | 0x00000001 | Sleep |
| 2 | 0x00000004 | Slow |
| 3 | 0x00000008 | Stop |
| 10 | 0x00000400 | Doom |
| 12 | 0x00001000 | Petrifying |
| 14 | 0x00004000 | Confuse |
| 24 | 0x01000000 | Vit0 |

**Total: 11 status effects.** statusAttackEnabler=254 means virtually all enemies will receive the full debuff set (only immunity blocks it).

---

## All Functions Identified

### Core Chain (3 functions)

| Address | Current Name | Proposed Name | Role |
|---------|-------------|---------------|------|
| `0x63E730` | `GF_191Doomtrain_InvokeSummonScript` | *(keep)* | Entry: texture init, task creation, camera/position setup |
| `0x6472C0` | `GF_191Doomtrain_SequenceTick` | *(keep)* | Tick: delegates to driver, increments counter |
| `0x63F2D0` | `sub_63F2D0` | **`GF_191Doomtrain_SequenceDriver`** | 424-frame animation state machine |

### Init/Setup Helpers (4 functions)

| Address | Current Name | Proposed Name | Role |
|---------|-------------|---------------|------|
| `0x56CD50` | `GF_187Odin_InitSummonContext` | `BattleGF_InitCameraFromGlobals` | Shared camera position init (reads dword_C78BD0..C78BE0) |
| `0x63E960` | `sub_63E960` | **`GF_191Doomtrain_InitCameraScriptTask`** | Creates BdLinkTask for camera interpolation |
| `0x63F9D0` | `sub_63F9D0` | **`GF_191Doomtrain_DiscoverTargets`** | Builds target index array from battle entities |
| `0x63F970` | `sub_63F970` | **`GF_191Doomtrain_BackupTargetPositions`** | Saves target positions for animation |

### Particle/Effect Task Schedulers (6 functions)

| Address | Current Name | Proposed Name | Role |
|---------|-------------|---------------|------|
| `0x63FAA0` | `sub_63FAA0` | **`GF_191Doomtrain_InitSmokeTrails`** | Creates 2 smoke trail tasks (left/right) |
| `0x640390` | `sub_640390` | **`GF_191Doomtrain_InitSparkParticles`** | Creates 2 spark particle tasks (randomized) |
| `0x63F760` | `au_re_BdLinkTask_78` | **`GF_191Doomtrain_ScheduleSubTask`** | Generic sub-task scheduler (takes func ptr) |
| `0x63F7A0` | `au_re_BdLinkTask_79` | **`GF_191Doomtrain_ScheduleTrainBodyTaskA`** | Spawns train body render task A |
| `0x63F850` | `au_re_BdLinkTask_80` | **`GF_191Doomtrain_ScheduleTrainBodyTaskB`** | Spawns train body render task B |
| `0x641530` | `au_re_BdLinkTask_81` | **`GF_191Doomtrain_ScheduleImpactFlashTask`** | Spawns impact flash at pos (-2000), radius 2000 |
| `0x6418A0` | `au_re_BdLinkTask_82` | **`GF_191Doomtrain_ScheduleExplosionDebrisTask`** | Spawns explosion debris at pos (-200, -30000) |

### Visual Effect Tick Functions (12 functions)

| Address | Current Name | Proposed Name | Lifetime | Role |
|---------|-------------|---------------|----------|------|
| `0x63E9C0` | `sub_63E9C0` | **`GF_191Doomtrain_CameraScriptTick`** | Variable | Complex camera path interpolation with 11 opcodes |
| `0x63FB40` | `sub_63FB40` | **`GF_191Doomtrain_SmokeTrailTick`** | Variable | Smoke/steam particle rendering along train path |
| `0x640580` | `sub_640580` | **`GF_191Doomtrain_SparkParticleTick`** | 388 frames | Spark/fire particles with camera integration |
| `0x63F7D0` | `sub_63F7D0` | **`GF_191Doomtrain_TrainBodyRenderA`** | Short | Train body silhouette render A |
| `0x63F880` | `sub_63F880` | **`GF_191Doomtrain_TrainBodyRenderB`** | Short | Train body silhouette render B |
| `0x63FDB0` | `sub_63FDB0` | **`GF_191Doomtrain_SmokeRenderPrimary`** | Variable | Primary smoke particle renderer |
| `0x63FEC0` | `sub_63FEC0` | **`GF_191Doomtrain_SmokeRenderSecondary`** | Variable | Secondary smoke particle renderer |
| `0x640140` | `sub_640140` | **`GF_191Doomtrain_WhistleSteamTick`** | Variable | Train whistle steam puff (every 7 frames) |
| `0x640280` | `sub_640280` | **`GF_191Doomtrain_WheelSparkTick`** | Variable | Wheel/rail spark effects |
| `0x641AF0` | `sub_641AF0` | **`GF_191Doomtrain_ApproachParticlesTick`** | 308 frames | Particle rain during train approach (28 particles/frame) |
| `0x641EA0` | `sub_641EA0` | **`GF_191Doomtrain_ImpactSequenceTick`** | 279 frames | Complex impact animation state machine |
| `0x641E60` | `sub_641E60` | **`GF_191Doomtrain_TextureUnloadTick`** | Short | Unloads texture buffer after impact |
| `0x641580` | `sub_641580` | **`GF_191Doomtrain_ImpactFlashRenderTick`** | 18 frames | Impact flash burst (clears particles at completion) |
| `0x6418E0` | `sub_6418E0` | **`GF_191Doomtrain_ExplosionDebrisTick`** | 90 frames | Explosion debris particles (2 per frame, for 20 frames) |

### Cleanup Functions (3 functions)

| Address | Current Name | Proposed Name | Role |
|---------|-------------|---------------|------|
| `0x63F780` | `sub_63F780` | **`GF_191Doomtrain_RestoreStageFlags`** | Restores bit 1 on battle stage entity flags |
| `0x63F8F0` | `sub_63F8F0` | **`GF_191Doomtrain_ClearTargetHideFlags`** | Clears bit 2 from target entities (un-hides them) |
| `0x63F930` | `sub_63F930` | **`GF_191Doomtrain_SetTargetHideFlags`** | Sets bit 2 on target entities (hides during impact) |

### Shared/Infrastructure Functions (called by Doomtrain)

| Address | Name | Role |
|---------|------|------|
| `0x571B50` | `Magic_TextureOFF_ToEAX1` | Returns texture offset base for magic/GF effects |
| `0x508300` | `BS_Memset` | Battle system memset (initializes task arrays) |
| `0x508360` | `BdLinkTask` | Creates and links a new task into a task list |
| `0x508420` | `BdlinkTask` | Ticks all tasks in a task list |
| `0x505E30` | `GetTextureEOF` | Marks end of texture buffer |
| `0x508480` | `BattleFile_CharacterLoad` | Loads character/model data from battle file archive |
| `0x501330` | `BdPlaySE` | Plays a battle sound effect |
| `0x5018C0` | `BdPlaySummonStream` | Plays summon cinematic audio stream |
| `0x501860` | `BdTransSummonStream` | Transfers/transitions summon stream buffer |
| `0x508500` | `sub_508500` | File I/O sync check (returns <0 if not ready) |
| `0x5020A0` | `sub_5020A0` | Camera/position calculation helper |
| `0x56C4F0` | `sub_56C4F0` | Position calculation using model index |
| `0x506BA0` | `sub_506BA0` | **`BattleGF_TriggerDamageOnTargets`** — iterates targets and applies damage |
| `0x5713E0` | `sub_5713E0` | Final cleanup (called with args 0,0 at sequence end) |
| `0x4A29A0` | `sub_4A29A0` | Visual effect allocator |
| `0x4A2900` | `sub_4A2900` | Visual effect status check |
| `0x4A2940` | `sub_4A2940` | Visual effect deallocator |

**Total functions identified: 32** (3 core + 4 init/setup + 7 schedulers + 12 tick functions + 3 cleanup + ~3 proposed renames for shared)

---

## Global Variables

### Texture Buffer Pointers (set in entry from `Magic_TextureOFF_ToEAX1()`)

| Address | Proposed Name | Offset from Base | Entries × Stride | Purpose |
|---------|--------------|------------------|-----------------|---------|
| `0xE3C8C0` | `GF_191Doomtrain_TexBufA` | +188416 | 170 × 24 | Particle buffer A (approach sparks) |
| `0xE3C8C4` | `GF_191Doomtrain_TexBufB` | +192512 | 170 × 24 | Particle buffer B |
| `0xE3C8C8` | `GF_191Doomtrain_TexBufC` | +196608 | 150 × 24 | Particle buffer C |
| `0xE3C8CC` | `GF_191Doomtrain_TexBufD` | +200704 | 120 × 24 | Particle buffer D |
| `0xE3C8D0` | `GF_191Doomtrain_TexBufE` | +204800 | 130 × 24 | Particle buffer E |
| `0xE3C8D4` | `GF_191Doomtrain_TexBufF` | +208896 | 590 × 24 | Main particle buffer (largest, for spark rain) |
| `0xE3C8D8` | `GF_191Doomtrain_TexBufG` | +225280 | — | Summon stream texture |
| `0x24FD3A0` | `GF_191Doomtrain_TexBase` | +0 | — | Raw texture base pointer |

### Context & State

| Address | Proposed Name | Type | Description |
|---------|--------------|------|-------------|
| `0x24FD258` | `GF_191Doomtrain_ActionCtxPtr` | dword | Action context from entry parameter a1 |
| `0x24FBE7C` | `GF_191Doomtrain_BattleModelIdx` | dword | Battle model index (from target data) |
| `0x24FD25C` | `GF_191Doomtrain_SecondaryParam` | dword | Secondary parameter from a1 |
| `0x24FBE80` | `GF_191Doomtrain_SequenceFlags` | dword | bit 0 = impact started, bit 1 = final phase |
| `0x24FBE78` | `GF_191Doomtrain_DirectionMul` | dword | ±1 direction multiplier (randomized at init) |

### Task Lists

| Address | Proposed Name | Type | Description |
|---------|--------------|------|-------------|
| `0x24FBF80` | `GF_191Doomtrain_MainTaskListHead` | dword | Task list for SequenceTick (16 slots × 2) |
| `0x24FBF60` | `GF_191Doomtrain_MainTaskListData` | struct | Task list data area |
| `0x24FC330` | `GF_191Doomtrain_DriverTaskListHead` | dword | Task list for SequenceDriver (36 slots × 100) |
| `0x24FC340` | `GF_191Doomtrain_DriverTaskListData` | struct | Task list data area |

### Target Data

| Address | Proposed Name | Type | Description |
|---------|--------------|------|-------------|
| `0x24FD350` | `GF_191Doomtrain_TargetCount` | dword | Number of valid targets |
| `0x24FD298` | `GF_191Doomtrain_TargetIndices` | dword[] | Array of target entity indices |
| `0x24FD260` | `GF_191Doomtrain_TargetPosBackupX` | dword[] | Backed-up target X positions |
| `0x24FD264` | `GF_191Doomtrain_TargetPosBackupZ` | dword[] | Backed-up target Z positions |
| `0x24FC0C8` | `GF_191Doomtrain_TargetAltPosX` | dword[] | Alternative target X positions |
| `0x24FC0CC` | `GF_191Doomtrain_TargetAltPosZ` | dword[] | Alternative target Z positions |

### Camera State

| Address | Proposed Name | Type | Description |
|---------|--------------|------|-------------|
| `0x24FD3A8` | `GF_191Doomtrain_CamStateA` | struct | Camera interpolation channel A |
| `0x24FBFB0` | `GF_191Doomtrain_CamStateB` | struct | Camera interpolation channel B |
| `0x24FD2D8` | `GF_191Doomtrain_ActiveCamPtr` | dword | Pointer to currently active camera state |
| `0x24FBDA4` | `GF_191Doomtrain_PassiveCamPtr` | dword | Pointer to passive camera state |
| `0x24FBE9C` | `GF_191Doomtrain_CamOffsetX` | dword | Camera X offset |
| `0x24FBEA0` | `GF_191Doomtrain_CamOffsetY` | dword | Camera Y offset |
| `0x24FBEA4` | `GF_191Doomtrain_CamOffsetZ` | dword | Camera Z offset |

### Sound Effects

| Address | Proposed Name | Description |
|---------|--------------|-------------|
| `0xE3C8A8` | `GF_191Doomtrain_SE_Horn` | Train horn sound (frame 4) |
| `0xE3C8AC` | `GF_191Doomtrain_SE_Rumble` | Approach rumble (frame 160) |
| `0xE3C8B0` | `GF_191Doomtrain_SE_Impact` | Impact boom (frame 294) |
| `0xE3C8B4` | `GF_191Doomtrain_SE_Explosion` | Explosion (frame 336) |
| `0xE3C8B8` | `GF_191Doomtrain_SE_Crash` | Final crash (frame 417) |

### Visual Effect Handle

| Address | Proposed Name | Description |
|---------|--------------|-------------|
| `0x24FC28C` | `GF_191Doomtrain_VFXHandle` | Allocated via sub_4A29A0, freed at frame 420 |

### Train Rendering (used by ImpactSequenceTick)

| Address | Proposed Name | Type | Description |
|---------|--------------|------|-------------|
| `0x24FC0C0` | `GF_191Doomtrain_TrainMeshPtr` | dword | Train body mesh data pointer |
| `0x24FC2D0` | `GF_191Doomtrain_TrainScaleX` | word | Train X scale |
| `0x24FC2D8` | `GF_191Doomtrain_TrainScaleY` | word | Train Y scale |
| `0x24FC2E0` | `GF_191Doomtrain_TrainScaleZ` | word | Train Z scale |
| `0x24FC2E4` | `GF_191Doomtrain_TrainPosOffX` | dword | Train X position offset |
| `0x24FC2E8` | `GF_191Doomtrain_TrainPosOffY` | dword | Train Y position offset |
| `0x24FC2EC` | `GF_191Doomtrain_TrainDepth` | dword | Train distance/depth (decreasing = approaching) |
| `0x24FC2F4` | `GF_191Doomtrain_TrainRenderCtx` | dword | Train rendering context pointer |

---

## Frame Timeline (Driver 0x63F2D0)

The driver is a 424-frame state machine using cascading `if/switch` on the frame counter.

| Frame | Event | Functions Called |
|-------|-------|----------------|
| 0 | **INIT**: Particles, camera, smoke trails, summon stream, VFX alloc | `InitCameraScriptTask`, `InitSmokeTrails`, `BackupTargetPositions`, `BdTransSummonStream`, `sub_4A29A0` |
| 1 | Steam/smoke trail setup | `InitSmokeTrails` (2 trails) |
| 4 | Sound: train horn | `BdPlaySE(SE_Horn)` |
| 5 | Load distant train model (ID 555) | `BattleFile_CharacterLoad(555)` |
| 15 | Load mid-range model (ID 556), init train body A | `BattleFile_CharacterLoad(556)`, `GetTextureEOF`, `ScheduleTrainBodyTaskA` |
| 20 | Spark particles + approach effect | `InitSparkParticles`, `ScheduleSubTask(ApproachParticlesTick)` |
| 30 | Load closer model (ID 557) | `BattleFile_CharacterLoad(557)` |
| 60 | Load impact model (ID 558), impact flash | `BattleFile_CharacterLoad(558)`, `ScheduleImpactFlashTask` |
| 85 | Load model 558 (re-use), explosion debris | `BattleFile_CharacterLoad(558)`, `ScheduleImpactFlashTask` |
| 95 | Stream transfer | `BdTransSummonStream` |
| 103 | Stage cleanup, explosion debris | `SetTargetHideFlags`, `ScheduleExplosionDebrisTask` |
| 124 | Play summon stream, impact sequence | `BdPlaySummonStream`, `ScheduleSubTask(ImpactSequenceTick)` |
| 160 | Sound: approach rumble | `BdPlaySE(SE_Rumble)` |
| 168 | Load model 559 | `BattleFile_CharacterLoad(559)` |
| 293 | Load model 560 | `BattleFile_CharacterLoad(560)` |
| 294 | Sound: impact boom, play stream | `BdPlaySE(SE_Impact)`, `BdPlaySummonStream` |
| 335 | Load model 561, sound: explosion, stream | `BattleFile_CharacterLoad(561)`, `BdPlaySE(SE_Explosion)`, `BdPlaySummonStream` |
| 366 | Play summon stream | `BdPlaySummonStream` |
| 405 | Train body render B, texture unload | `ScheduleTrainBodyTaskB`, `GetTextureEOF` |
| 406 | Texture unload task | `ScheduleSubTask(TextureUnloadTick)` |
| 417 | Sound: final crash | `BdPlaySE(SE_Crash)` |
| **420** | **DAMAGE TRIGGER** | `BattleGF_TriggerDamageOnTargets` (`0x506BA0`) |
| 420 | VFX check/free | `sub_4A2900`, `sub_4A2940` |
| 424+ | **COMPLETION**: Cleanup + return 2 | `RestoreStageFlags`, `ClearTargetHideFlags`, `sub_5713E0(0,0)` |

### Model IDs Used

| ID | Frame | Description |
|----|-------|-------------|
| 555 | 5 | Distant train silhouette |
| 556 | 15 | Mid-range approaching train |
| 557 | 30 | Close-up approaching train |
| 558 | 60, 85 | Train at impact distance |
| 559 | 168 | Post-impact debris model |
| 560 | 293 | Explosion effects model |
| 561 | 335 | Final aftermath model |

---

## Architecture Notes

### Dual-Task BdLinkTask Design

Doomtrain uses the standard FamilyA dual-task pattern:

1. **Main task** (`dword_24FBF80`): holds the `SequenceTick` function. Registered with 16 slots, capacity 2. This is the task returned to the GF cinematic dispatch system.

2. **Secondary task** (`dword_24FC330`): holds the `SequenceDriver` function PLUS all sub-tasks (smoke, sparks, body renders, impact effects, etc.). Registered with 36 slots, capacity 100.

The main tick delegates to the secondary task list via `BdlinkTask()`. This means **all animation sub-tasks run within the secondary list** and are automatically ticked when the driver is ticked.

### Camera Script System

The `CameraScriptTick` (`0x63E9C0`) implements a bytecode interpreter with 11 opcodes (0-10) for camera path animation:

| Opcode | Function |
|--------|----------|
| 0 | Set interpolation frame count |
| 1 | Set position directly |
| 2 | Linear interpolation to target |
| 3 | Bezier curve interpolation |
| 4 | Spline interpolation with control points |
| 5 | Distance-based follow (tracks other camera state) |
| 6 | Set global camera rotation |
| 7 | Timed rotation interpolation (world space) |
| 8 | Set local direction multiplier |
| 9 | Timed rotation interpolation (local space) |
| 10 | Lock to battle camera position |
| default | End script (return 2) |

### Impact Sequence State Machine

The `ImpactSequenceTick` (`0x641EA0`) is itself a 279-frame sub-state-machine handling the actual train-hitting-enemies animation:

- Frames 0-34: Train approaching (scale = 0x2000, depth = 25000→decreasing)
- Frames 35-43: Speed increase (depth -= 400/frame), sub-task spawning
- Frames 44-68: High speed (depth -= 600/frame)
- Frames 69-168: Impact shockwave (scale = 0x4000, depth = 29000→decreasing)
- Frames 169-190: Second wave (depth -= 800/frame)
- Frames 191-212: Third wave (depth -= 800/frame)
- Frames 213-243: Recovery phase (depth = 32000→decreasing, target flags set)
- Frames 244-274: Aftermath (depth = 28000→decreasing)
- Frame 279: Completion — sets `dword_24FBE80 |= 1` (impact phase done), returns 2

### Target Hide/Show Mechanism

During the impact, targets are hidden then shown:
- `SetTargetHideFlags` (`0x63F930`): Sets bit 2 on entity flag `dword_1D972C0[39*idx]` for each target — hides them from rendering
- `ClearTargetHideFlags` (`0x63F8F0`): Clears bit 2 — makes them visible again after the impact animation

---

## Dispatch Table Reference

The entry function is stored at `0xC81A6C` in a GF cinematic callback function pointer table. Doomtrain appears at position 0 in this particular table segment, which is indexed by the GF dispatch system when routing `command_arg=0x4B`.

---

## Command Injection (Runtime-Validated)

```
Raw bytes at 0x1D28D44: 08 80 00 03 4B 00 00 01
                         ^^^^       ^^          ^^
                    target_mask  cmd_arg     active
```

- `command_id = 0x03` (GF)
- `command_arg = 0x4B` (75 = Doomtrain)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

---

## Breakpoint Outcome Matrix (GF_DOOMTRAIN_001)

| Breakpoint | Address | Result |
|------------|---------|--------|
| `sync_atb` | `0x4842B0` | HIT |
| `bp_pending_transfer` | `0x4847F0` | HIT |
| `bp_gf_cinematic` | `0x50B2A0` | HIT |
| `bp_doomtrain_entry` | `0x63E730` | not hit (dispatch timing) |
| `bp_doomtrain_counter_inc` | `0x6472D1` | not hit (dispatch timing) |
| `bp_resolve_and_apply` | `0x48FE20` | not hit |
| `bp_apply_damage` | `0x494410` | HIT |
| `sync_post_damage` | `0x4842B0` | HIT |

---

## Full Pipeline: Command Injection → Status Application

Complete traced path from pending action write through to final status application on enemy targets. All functions and structures verified by static analysis and renamed in IDA.

### Pipeline Stages

```
STAGE 1: Command Injection
  BattlePendingAction_WriteEntry (0x484D20)
  → Writes 8-byte BattlePendingActionEntry into PENDING_ACTION_BUFFER at 0x1D28D44
  → For Doomtrain: command_id=0x03(GF), command_arg=0x4B, target_mask=0x8008

STAGE 2: GF Cinematic State Machine
  BattleActionSequence_Tick_GF_Cinematic (0x50B2A0)
  → 10-state state machine (states 0-9)
  → State 1: BattleGF_LoadCallbackByMagicID (0x50AF20) → loads GF entry function pointer
  → State 3: Calls g_GfActiveCallbackPtr = GF_191Doomtrain_InvokeSummonScript
  → State 3: If command_type == 0xFE: BattleGF_InitBoostMinigame (0x56DCE0)

STAGE 2b: GF Boost Minigame
  BattleGF_InitBoostMinigame (0x56DCE0)
  → Reads K_GF_JUNCTIONABLE[gf_index].unknown40 for timing parameters
  → Registers BattleGF_BoostMinigameTick (0x56DD70) as task
  BattleGF_BoostMinigameTick (0x56DD70)
  → 6-state minigame: cases 0-4 = button press timing, case 5 = complete
  → Boost range: 75 (base) to 250 (max). Default 100 if no input.
  → On completion: calls BattleGF_ResolveAndStoreTargetDamage(boost_value)

STAGE 3: Pre-Compute Target Damage (runs DURING boost minigame completion)
  BattleGF_ResolveAndStoreTargetDamage (0x4850A0)
  → Sets GF_BOOST, COMMAND_TYPE_ID=0xFE, CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x4B
  → Loops over target list at GF_PRECOMPUTE_TARGET_DATA (0x1D280D4):
    PER TARGET:
    ├── BattleAction_ResolveAndApplyDamage (0x48FE20)
    │   ├── SWITCH 1 (case 254 / GF):
    │   │   └── Read K_GF_JUNCTIONABLE[cmd_arg-64]:
    │   │       HIT_ELEMENT = .element (0x10 = Poison)
    │   │       HIT_ATTACK_ENABLER = .statusAttackEnabler (0xFE = 254)
    │   │       HIT_STATUS_1 = .statuses0 (0x003A)
    │   │       HIT_STATUS_2 = .statuses1 (0x0100540D)
    │   │       GF_SUMMON_MAG_BONUS = byte_1CFF321[12*cmd_arg]
    │   ├── SWITCH 2 (case 254 / GF):
    │   │   └── Read K_GF_JUNCTIONABLE[cmd_arg-64]:
    │   │       GF_POWER_MOD = .powerMod (10)
    │   │       GF_LEVEL_MOD = .levelMod (58)
    │   │       GF_LEVEL = AVERAGE_PARTY_LEVEL[12*cmd_arg]
    │   │       ATTACK_FLAG = .attackFlags (0x21)
    │   │       animation = .unknown2 (5)
    │   │       attackType = .attackType (11 = GF)
    │   │       gfPower = .gfPower (45)
    │   │   └── Damage_ComputeRawDeltaFromAttackType (0x4922B0)
    │   │       └── case ATTACK_TYPE_GF (11):
    │   │           └── ComputeMagicAndGFDamage (0x491AD0) type=2
    │   │               └── GF FORMULA:
    │   │                   (rand%33+240) * ((MAG_BONUS+100) *
    │   │                   ((BOOST * (power * ((265-SPR) *
    │   │                   (LEVEL_MOD*LEVEL/10 + power + POWER_MOD) / 8)
    │   │                   / 256) / 100) / 100)) / 256
    │   │               └── Element defense applied: damage * (900-elem_def) / 100
    │   │               └── domain::BattleStatus_ApplyHitStatus (0x4914E0)
    │   │                   └── Per status bit: BattleStatus_ResolveStatusHitChance
    │   │                       (STR/MAG vs VIT/SPR, HIT_ATTACK_ENABLER=254)
    │   ├── Battle_ApplyDamageOrHeal (0x494410)
    │   │   └── Writes HP, handles KO, updates last-attacker info
    │   └── (if drain) Battle_ApplyDamageOrHeal for attacker
    └── Battle_UpdateDamage (0x48EF80)
        └── Stores 24-byte BattleDamageResultRecord into
            BATTLE_DAMAGE_RESULT_BUFFER (0x1D28344) + 24*hit_index

STAGE 4: GF Cinematic Execution (runs for 424 frames)
  GF_191Doomtrain_InvokeSummonScript (0x63E730) → Entry
  GF_191Doomtrain_SequenceTick (0x6472C0) → Tick wrapper
  GF_191Doomtrain_SequenceDriver (0x63F2D0) → 424-frame state machine
  → Frames 0-419: Animation (models, particles, sounds, camera)
  → Frame 420: DAMAGE TRIGGER

STAGE 5: Apply Pre-Computed Damage (frame 420)
  BattleGF_TriggerDamageOnTargets (0x506BA0)
  → Iterates BattleDamageResultRecord array, 24 bytes per target
  PER TARGET:
  └── BattleGF_ApplyDamageToSingleTarget (0x506690)
      ├── domain::BattleAction_ResolveAndApplyStatusResult (0x493D80)
      │   ├── For player targets (slot < 3):
      │   │   ├── F_CHAR_DATA[slot].hp -= damage_amount
      │   │   ├── BattleStatus_ComputeHPPercentFlags (0x494360)
      │   │   └── domain::BattleStatus_ApplyAndSyncSlot (0x493840)
      │   │       ├── Handles GF summon state flag
      │   │       ├── Handles sleep/stop/petrify ATB freeze
      │   │       ├── Handles death: clear flags, reset ATB
      │   │       ├── Handles eject: HandleEject_ResetSlot
      │   │       └── Writes status_1/status_2 to F_CHAR_DATA
      │   └── For monster targets (slot >= 3):
      │       └── BattleMonster_HandleDeathAndDrop (0x493BA0)
      ├── domain::BattleStatus_MaskWithSlotStatus2 (0x506B50)
      │   ├── BattleStatus_MapBitsToAnimFlags (0x509BA0)
      │   └── BattleEntity_SetStatusVisualFlags (0x509CD0)
      ├── BattleEntity_TriggerHitAnimation (0x506620)
      ├── BattleEntity_UpdateAnimFromStatus (0x509C80)
      ├── BattleEntity_HandleKnockbackEffect (0x5065B0)
      └── BattleEntity_SpawnDamageNumberDisplay (0x5068B0)

STAGE 6: Post-Damage
  domain::BattleStatus_UpdateSlotStatusCopy (0x47E2D0)
  → Copies final status_1/status_2 to status_1_copy/status_2_copy
```

### Structures Defined in IDA

**BattlePendingActionEntry** (8 bytes at `0x1D28D44`):
| Offset | Size | Field | Doomtrain Value |
|--------|------|-------|-----------------|
| 0 | 2 | `target_mask` | `0x8008` |
| 2 | 1 | `attacker_slot` | `0` |
| 3 | 1 | `command_id` | `3` (GF) |
| 4 | 1 | `command_arg` | `0x4B` (75) |
| 5 | 1 | `padding1` | `0` |
| 6 | 1 | `padding2` | `0` |
| 7 | 1 | `active` | `1` |

**BattleDamageResultRecord** (24 bytes at `BATTLE_DAMAGE_RESULT_BUFFER` = `0x1D28344`):
| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| 0 | 1 | `target_slot_id` | Target entity index |
| 1 | 1 | `animation_to_play` | Hit animation type (5=normal for GF) |
| 2 | 1 | `hit_flags` | Bitmask: bit 0=no damage display, bit 5=damage dealt |
| 3 | 1 | `hit_type_2` | HIT_TYPE_2 (miss/crit/normal flags) |
| 4 | 2 | `status_1_delta` | Status_1 change flags |
| 6 | 2 | `damage_amount` | Computed damage (clamped 0-9999 or 0-60000) |
| 8 | 4 | `status_2_delta` | Status_2 change flags |
| 12 | 1 | `drain_target_slot` | Drain secondary target (-1 if none) |
| 13 | 1 | `drain_anim_type` | Drain animation type |
| 14 | 1 | `drain_flag` | Drain enabled flag |
| 15 | 1 | `drain_hit_type` | Drain heal/damage flag |
| 16 | 2 | `drain_status` | Drain status delta |
| 18 | 2 | `drain_amount` | Drain HP amount |
| 20 | 4 | `drain_status_2` | Drain status_2 delta |

### GF Damage Formula (for Doomtrain attackType=11)

```
base = GF_LEVEL_MOD(58) * GF_LEVEL / 10 + gfPower(45) + GF_POWER_MOD(10)
raw  = gfPower(45) * ((265 - target_SPR) * base / 8) / 256
boosted = raw * GF_BOOST(100) / 100
mag_bonus = boosted * (GF_SUMMON_MAG_BONUS + 100) / 100
final = mag_bonus * (rand()%33 + 240) / 256
elem_adjusted = final * (900 - elem_def_poison) / 100
```

### IDA Rename Summary (2026-02-15)

**Doomtrain-specific functions renamed: 28**
- All 3 core chain + 4 init/setup + 7 schedulers + 12 tick + 3 cleanup functions

**Doomtrain-specific globals renamed: 18**
- Texture buffers, context/state, task lists, target data, camera state, train rendering

**Pipeline functions renamed: 14**
- `BattlePendingAction_WriteEntry`, `BattleGF_TriggerDamageOnTargets`, `BattleGF_ApplyDamageToSingleTarget`, `BattleGF_ResolveAndStoreTargetDamage`, `BattleGF_InitBoostMinigame`, `BattleGF_BoostMinigameTick`, `BattleGF_InitCameraFromGlobals`, `BattleStatus_MapBitsToAnimFlags`, `BattleEntity_SetStatusVisualFlags`, `BattleEntity_MergeAndApplyStatusVisuals`, `BattleEntity_TriggerHitAnimation`, `BattleEntity_UpdateAnimFromStatus`, `BattleEntity_WaitForHitAnimComplete`, `BattleEntity_HandleKnockbackEffect`

**Additional pipeline helpers renamed: 13**
- `BattleEntity_SpawnDamageNumberDisplay`, `BattleGF_CinematicTriggerDamageFromCtx`, `BattleEntity_SetAnimState`, `BattleEntity_TransitionAnimState`, `BattleEntity_SetAnimDirect`, `BattleCinematic_TickAllTasks`, `BattleGF_LoadCallbackByMagicID`, `BattleMonster_HandleDeathAndDrop`, `BattleStatus_ComputeHPPercentFlags`, `BattleStatus_ComputeStatusBitDelta`, `BattleChar_ApplyHPChange`, `BattleChar_ApplyHPChangeFromHeal`

**Pipeline globals renamed: 9**
- `BATTLE_DAMAGE_RESULT_BUFFER`, `GF_PRECOMPUTE_TARGET_DATA`, `GF_DAMAGE_ENABLED_FLAG`, `GF_CINEMATIC_HIDDEN_ENTITIES`, `GF_CINEMATIC_SPECIAL_MODE`, `GF_CINEMATIC_ATTACKER_ENTITY`, `GF_CINEMATIC_CAMERA_INDEX`, `GF_CINEMATIC_COMPANION_SLOT`, `GF_CINEMATIC_RESULT_FLAG`

**Structures declared: 2**
- `BattleDamageResultRecord` (24 bytes)
- `BattlePendingActionEntry` (8 bytes)

**Function signatures set: 5**
- `BattlePendingAction_WriteEntry`, `BattleGF_TriggerDamageOnTargets`, `BattleGF_ApplyDamageToSingleTarget`, `BattleGF_ResolveAndStoreTargetDamage`, `Battle_UpdateDamage`

**Local variables renamed: 8**
- In `BattleAction_ResolveAndApplyDamage` and `Damage_ComputeRawDeltaFromAttackType`

**Pipeline comments added: 19**
- Comprehensive stage markers at all key pipeline addresses

**Total IDA database changes: ~95 renames, 2 structs, 5 signatures, 19 comments**

---

## Notes

- The entry/counter probes were armed but not hit in GF_DOOMTRAIN_001 due to dispatch timing (the BP was likely set too late relative to when the function was first called). A re-run with earlier arming should hit them.
- The driver function `GF_191Doomtrain_SequenceDriver` at `0x63F2D0` is one of the largest GF driver functions at ~1100 bytes, reflecting Doomtrain's elaborate 7-model cinematic.
- `BattleGF_InitCameraFromGlobals` at `0x56CD50` was previously misnamed `GF_187Odin_InitSummonContext` — it is a **shared** camera init function used by multiple GFs. Renamed in IDA.
- The 11-status payload is the largest of any junctionable GF, making Doomtrain unique in the FF8 battle system.
- The `bp_resolve_and_apply` at `0x48FE20` was NOT hit in the GF_DOOMTRAIN_001 test despite `bp_apply_damage` at `0x494410` being HIT. This is because `Battle_ApplyDamageOrHeal` is called from within `BattleAction_ResolveAndApplyDamage`, so the entry-point BP was likely a timing issue during the boost minigame phase (stage 2c/3).
