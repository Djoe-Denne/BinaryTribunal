# 277Carbuncle GF Invocation Reconstruction

## Scope

Full pipeline reconstruction of the Carbuncle summon from command injection through Reflect status application. Combines static IDA MCP analysis, decompilation, call graph tracing, and cross-reference investigation.

## High-Level Result

- Entry: `GF_277Carbuncle_InvokeSummonScript` (`0x680c50`)
- Init: `GF_277Carbuncle_InitSummonContext` (`0x680c80`)
- Tick: `GF_277Carbuncle_SequenceTick` (`0x680df0`)
- Driver tick: `GF_277Carbuncle_SequenceTaskDriver` (`0x681630`)
- Family: `FamilyA`
- Confidence: `high` (95)

## Critical Discovery: Carbuncle Uses Generic Tick Path

Carbuncle (kernel ID `0x46` = 70) is **explicitly excluded** from `BattleActionSequence_Tick_GF_Cinematic` (`0x50B2A0`) in the presentation dispatch. In `BattleActionSequence_DispatchTick` (`0x50A790`), the switch on `COMMAND_TYPE_ID == 0xFE` contains:

```c
case 0xFE:  // GF
  v2 = action_id;  // offset +4 in shared context
  if ( v2 != 70 && v2 != 15 ) {  // 70 = Carbuncle, 15 = unknown
    v1 = BattleActionSequence_Tick_GF_Cinematic;  // normal GFs
  } else {
    v1 = BattleActionSequence_Tick_Generic;  // Carbuncle special case
  }
```

This means `bp_gf_cinematic` at `0x50B2A0` will **never fire** for Carbuncle. The GF callback is instead invoked from `BattleActionSequence_Tick_Generic` (`0x50A9A0`), case 4/5, via the same `g_GfActiveCallbackPtr()` mechanism.

## Complete Pipeline: Command Injection to Reflect Application

### Stage 1: Command Queue

| Function | Address | Role |
|---|---|---|
| `BattlePendingAction_Write` | `0x484D20` | Writes command to pending buffer |
| `BattlePendingAction_TransferToExecQueue` | `0x4847F0` | Transfers pending entry to execution queue |
| `BattleArbitration_SelectNextAction` | `0x485460` | Selects action from queue for execution |

### Stage 2: Presentation Dispatch (BdLinkTask layer)

| Function | Address | Role |
|---|---|---|
| `BattleTaskQueue_Dispatch` | `0x5023D0` | High-level task queue dispatcher |
| `BattleActionSequence_DispatchTick` | `0x50A790` | Selects tick handler based on `COMMAND_TYPE_ID` |
| `BattleActionSequence_Tick_Generic` | `0x50A9A0` | Generic presentation tick (used for Carbuncle) |
| `Magic_GetIDLoad` | `0x50AF20` | Loads GF callback pointer from action ID |

The dispatch tick routes `COMMAND_TYPE_ID == 0xFE` to `Tick_Generic` for Carbuncle (action_id 70), bypassing `Tick_GF_Cinematic`. Case 1 of `Tick_Generic` calls `Magic_GetIDLoad` to load the callback, case 4/5 calls it.

### Stage 3: Carbuncle-Specific Cinematic

| Function | Address | Role |
|---|---|---|
| `GF_277Carbuncle_InvokeSummonScript` | `0x680C50` | Entry point (called via `g_GfActiveCallbackPtr`) |
| `GF_277Carbuncle_InitSummonContext` | `0x680C80` | Initializes context, schedules tick via `BdLinkTask` |
| `BdLinkTask` | `0x508360` | Core task scheduler (links tick into task list) |
| `GF_277Carbuncle_SequenceTick` | `0x680DF0` | Per-frame cinematic sequence driver |
| `GF_277Carbuncle_SequenceTaskDriver` | `0x681630` | Frame-timeline effects, camera, helpers |

Helpers called during cinematic:

- `GF_277Carbuncle_LoadSummonTexture` -- texture asset loading
- `GF_277Carbuncle_SpawnOverlayController` -- overlay setup
- `GF_277Carbuncle_ClearReflectFlags` -- reflect flag management
- `GF_277Carbuncle_RenderBackdropProjection` -- backdrop rendering
- `GF_277Carbuncle_EmitAuraArc` -- aura visual effect
- `GF_277Carbuncle_CalcOffsetPoint` -- position calculation
- `GF_277Carbuncle_TargetAuraTaskTick` -- per-target aura tick
- `GF_277Carbuncle_ApplyCameraKick` -- camera shake
- `GF_277Carbuncle_SubmitAuraPrimitive` -- GPU primitive submission
- `GF_277Carbuncle_SetAuraIntensity` -- intensity control
- `GF_277Carbuncle_FloatingSparkTaskTick` -- spark particle tick
- `GF_277Carbuncle_ShimmerTaskTick` -- shimmer effect tick

### Stage 4: Action Resolution (Game Logic layer)

| Function | Address | Role |
|---|---|---|
| `main::FFBattleDirector_battleLoop` | `0x47CCB0` | Main battle loop |
| `BattleAction_ResolveSpecialActionAndUpdateDamage` | `0x485160` | Special action resolver (calls resolve + update) |
| `BattleAction_ResolveTargetsAndApply` | `0x48EA90` | Target fan-out: expands mask, loops per-hit |
| `BattleAction_ResolveAndApplyDamage` | `0x48FE20` | Core resolver: loads kernel table, populates HIT globals |
| `Damage_ComputeRawDeltaFromAttackType` | `0x4922B0` | Damage computation dispatch by attack type |
| `ComputeMagicAndGFDamage` | `0x491AD0` | Magic/GF damage formula |
| `Battle_ApplyDamageOrHeal` | `0x494410` | Authoritative HP write + KO/status side effects |
| `Battle_UpdateDamage` | `0x48EF80` | Post-hit bookkeeping and result queuing |

For Carbuncle (`COMMAND_TYPE_ID = 0xFE`), the resolver reads status payload from `K_GF_JUNCTIONABLE[0x46 - 0x40]` (index 6), populating `HIT_STATUS_2` with the Reflect bit.

### Stage 5: Status Application Pipeline

| Function | Address | Role |
|---|---|---|
| `BattleStatus_CanApplyHitStatus` | `0x492AC0` | Gating predicate (blocks if petrified/invulnerable) |
| `BattleStatus_ApplyHitStatus` | `0x4914E0` | Primary hit-status resolution |
| `BattleStatus_ResolveStatusHitChance` | `0x48F9F0` | Probability check (enabler vs resistance + RNG) |
| `StatusBitfield_ComputeDelta` | `0x491800` | Computes which status bits changed |
| `BattleStatus_ResolveDoubleApplyAndExclusion` | `0x491820` | Mutual exclusion (Haste/Slow etc.) |
| `BattleStatus_ClearOpposingStatusBits` | `0x48F140` | Bitwise clear of incompatible statuses |
| `StatusTimer_StartFromKernelTable` | `0x4832F0` | Initializes timed-status duration from kernel misc |
| `StatusTimer_MarkDisabledForBit` | `0x483340` | Marks a status timer slot as disabled (-1111) |
| `StatusTimer_IsDisabledForBit` | `0x483370` | Checks if a status timer is disabled |
| `BattleStatus_ApplyAndSyncSlot` | `0x493840` | Authoritative `status_1`/`status_2` commit + mirror sync |
| `BattleStatus_UpdateSlotStatusCopy` | `0x47E2D0` | Immediate UI mirror sync |
| `BattleAction_ResolveAndApplyStatusResult` | `0x493D80` | Post-action HP-threshold status bits |

For Reflect specifically: `HIT_STATUS_2` contains bit 7 (`0x80` = Reflect). If `HIT_ATTACK_ENABLER == 0xFF` (always), the hit-chance check is skipped and Reflect is applied unconditionally to each party slot via `status_2 |= mask`.

## Counter and Completion

- Main sequence increment site: `0x6811c8`
- Main sequence completion site: `0x6811be` (`return 2`)
- Driver increment site: `0x681fb0`
- Driver completion site: `0x681fc4` (`return 2` when frame >= `283`)

## Command Injection

- `command_id = 0x03` (GF)
- `command_arg = 0x46` (Carbuncle kernel GF ID, hypothesized)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

## IDA Rename Coverage

Renamed closure includes:

- Core: `GF_277Carbuncle_InvokeSummonScript`, `GF_277Carbuncle_LoadSummonTexture`, `GF_277Carbuncle_InitSummonContext`, `GF_277Carbuncle_SequenceTick`, `GF_277Carbuncle_SequenceTaskDriver`
- Helpers: `GF_277Carbuncle_SpawnOverlayController`, `GF_277Carbuncle_ClearReflectFlags`, `GF_277Carbuncle_RenderBackdropProjection`, `GF_277Carbuncle_EmitAuraArc`, `GF_277Carbuncle_CalcOffsetPoint`, `GF_277Carbuncle_TargetAuraTaskTick`, `GF_277Carbuncle_ApplyCameraKick`, `GF_277Carbuncle_SubmitAuraPrimitive`, `GF_277Carbuncle_SetAuraIntensity`, `GF_277Carbuncle_FloatingSparkTaskTick`, `GF_277Carbuncle_ShimmerTaskTick`
- Globals in `0x2508110`-`0x25081f8` range renamed to `GF_277Carbuncle_*`
- Pipeline renames applied in this pass: `StatusTimer_MarkDisabledForBit`, `StatusTimer_StartFromKernelTable`, `StatusBitfield_ComputeDelta`, `BattleAction_ResolveTargetsAndApply`, `BattleStatus_ResolveStatusHitChance`, `BattleStatus_ClearOpposingStatusBits`, `BattleStatus_ResolveDoubleApplyAndExclusion`

## Architecture Note: Dual-Layer Execution

The presentation layer (cinematic animation) and game logic layer (damage/status resolution) run **in parallel** via the `BdLinkTask` system:

- **Presentation layer**: `BattleTaskQueue_Dispatch` -> `BattleActionSequence_DispatchTick` -> tick handler -> GF callback -> cinematic sub-tasks
- **Game logic layer**: `FFBattleDirector_battleLoop` -> `ResolveSpecialActionAndUpdateDamage` -> `ResolveAndApplyDamage` -> status application pipeline

Both layers communicate via shared globals (`g_GfSequenceContextSharedB`, `g_GfActiveCallbackPtr`, `GF_CALLBACK_PTR`). The cinematic completion (tick returns 2) signals the presentation is done; the game logic processes the actual damage/status independently through the battle loop.

## Notes

- Companion hypothesis test: `ff8re/tests/tier3_inject/GF_CARBUNCLE_001.yaml`.
- The test was updated (2026-02-15) to add Phase 2 observe on `RESOLVE_AND_APPLY`/`APPLY_DAMAGE_OR_HEAL` to wait for the full cinematic before snapshotting ally status.
- Carbuncle's use of `Tick_Generic` instead of `Tick_GF_Cinematic` is a confirmed special case in the dispatch table. GF ID 15 shares this routing.
