# 200Pandemona GF Invocation Reconstruction

## Scope

Static reconstruction of Pandemona summon invocation chain and progression semantics from live debug stop at `GF_CALLBACK_PTR` (`0x21DFEC4` -> `0x6ed250`) plus IDA MCP closure analysis.

## High-Level Result

- Entry: `GF_200Pandemona_InvokeSummonScript` (`0x6ed250`)
- Init: `GF_200Pandemona_InitSummonContext` (`0x6ed260`)
- Tick: `GF_200Pandemona_SequenceTick` (`0x6ed350`)
- Driver tick: `GF_200Pandemona_SequenceTaskDriver` (`0x6ed900`)
- Family: `FamilyA`
- Confidence: `high` (95)

## Confirmed Static Chain

1. `GF_200Pandemona_InvokeSummonScript` dispatches into `GF_200Pandemona_InitSummonContext`.
2. `GF_200Pandemona_InitSummonContext` schedules `GF_200Pandemona_SequenceTick` through `BdLinkTask`.
3. `GF_200Pandemona_SequenceTick` allocates effect task pools and schedules `GF_200Pandemona_SequenceTaskDriver`.
4. `GF_200Pandemona_SequenceTaskDriver` runs the cinematic/effect timeline and returns sequence completion.

## Counter and Completion

- Main sequence increment site: `0x6ed755`
- Main sequence completion site: `0x6ed749` (`return 2`)
- Driver increment site: `0x6f0622`
- Driver completion site: `0x6f06c6` (`mov eax, 2`)

## Command Injection (Hypothesized)

Pandemona invocation should be accepted by the battle pipeline with:

- `command_id = 0x03` (GF)
- `command_arg = 0x48` (Pandemona kernel GF ID, hypothesized)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

## IDA Rename Coverage

Renamed closure includes:

- Core: `GF_200Pandemona_InvokeSummonScript`, `GF_200Pandemona_InitSummonContext`, `GF_200Pandemona_SequenceTick`, `GF_200Pandemona_SequenceTaskDriver`
- Helpers: `GF_200Pandemona_UpdateTargetCameraSpan`, `GF_200Pandemona_ClearRenderBatchFlagsA`, `GF_200Pandemona_ClearRenderBatchFlagsB`
- Globals in `0x2556258`-`0x25562f4` range renamed to `GF_200Pandemona_*`

## Notes

- This reconstruction is complete for static chain discovery + IDA naming pass.
- Runtime evidence generation is intentionally deferred to deterministic test execution.
- Companion hypothesis test: `ff8re/tests/tier3_inject/GF_PANDEMONA_001.yaml`.
