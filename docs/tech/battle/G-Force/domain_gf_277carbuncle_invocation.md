# 277Carbuncle GF Invocation Reconstruction

## Scope

Static reconstruction of Carbuncle summon invocation chain and progression semantics from live debug stop at callback address `0x680c50` plus IDA MCP closure analysis.

## High-Level Result

- Entry: `GF_277Carbuncle_InvokeSummonScript` (`0x680c50`)
- Init: `GF_277Carbuncle_InitSummonContext` (`0x680c80`)
- Tick: `GF_277Carbuncle_SequenceTick` (`0x680df0`)
- Driver tick: `GF_277Carbuncle_SequenceTaskDriver` (`0x681630`)
- Family: `FamilyA`
- Confidence: `high` (95)

## Confirmed Static Chain

1. `GF_277Carbuncle_InvokeSummonScript` dispatches into `GF_277Carbuncle_InitSummonContext`.
2. `GF_277Carbuncle_InitSummonContext` schedules `GF_277Carbuncle_SequenceTick` through `BdLinkTask`.
3. `GF_277Carbuncle_SequenceTick` bootstraps cinematic sub-tasks and schedules `GF_277Carbuncle_SequenceTaskDriver`.
4. `GF_277Carbuncle_SequenceTaskDriver` drives frame-timeline effects, camera phases, and helper tasks.

## Counter and Completion

- Main sequence increment site: `0x6811c8`
- Main sequence completion site: `0x6811be` (`return 2`)
- Driver increment site: `0x681fb0`
- Driver completion site: `0x681fc4` (`return 2` when frame >= `283`)

## Command Injection (Hypothesized)

Carbuncle invocation should be accepted by the battle pipeline with:

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

## Notes

- This reconstruction is complete for static chain discovery + IDA naming pass.
- Runtime evidence generation is intentionally deferred to deterministic test execution.
- Companion hypothesis test: `ff8re/tests/tier3_inject/GF_CARBUNCLE_001.yaml`.
