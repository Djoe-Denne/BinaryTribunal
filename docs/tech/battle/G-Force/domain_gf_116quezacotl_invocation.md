# 116Quezacotl GF Invocation Reconstruction

## Scope

Maximum static reconstruction of Quezacotl summon invocation chain and progression semantics from live debugger stop on `GF_116Quezacotl_InvokeSummonScript` and IDA MCP closure analysis.

## High-Level Result

- Entry: `GF_116Quezacotl_InvokeSummonScript` (`0x6c3550`)
- Init: `GF_116Quezacotl_InitSummonContext` (`0x6c3640`)
- Tick: `GF_116Quezacotl_SequenceTaskDriver` (`0x6c3760`)
- Extended tick chain:
  - `GF_116Quezacotl_ChargeTimelineTask` (`0x6c3940`)
  - `GF_116Quezacotl_FrameTick` (`0x6c6660`)
- Family: `FamilyA`
- Confidence: `high` (96)

## Confirmed Static Chain

1. `GF_116Quezacotl_InvokeSummonScript` forwards to `GF_116Quezacotl_InitSummonContext`.
2. `GF_116Quezacotl_InitSummonContext` seeds Quezacotl runtime state and schedules `GF_116Quezacotl_SequenceTaskDriver`.
3. `GF_116Quezacotl_SequenceTaskDriver` schedules `GF_116Quezacotl_ChargeTimelineTask`.
4. `GF_116Quezacotl_ChargeTimelineTask` drives the long cinematic timeline and spawns helper tasks including `GF_116Quezacotl_FrameTick`.
5. `GF_116Quezacotl_FrameTick` advances short-lived particle/camera micro-motion tasks and returns completion to its parent queue.

## Counter and Completion

- Main sequence increment site: `0x6c3932`
- Main sequence completion site: `0x6c3931` (`and eax, 2`)
- Charge timeline increment site: `0x6c51f2`
- Charge timeline completion site: `0x6c51f0` (`return 2` at frame >= `355`)
- FrameTick local increment site: `0x6c671d`
- FrameTick local completion site: `0x6c675d` (`return 2` after local threshold)

## Command Injection (Hypothesized)

Quezacotl invocation should be accepted by the battle pipeline with:

- `command_id = 0x03` (GF)
- `command_arg = 0x40` (Quezacotl kernel GF ID, still hypothesized)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

## IDA Rename Coverage

Renamed closure includes:

- Core: `GF_116Quezacotl_InvokeSummonScript`, `GF_116Quezacotl_InitSummonContext`, `GF_116Quezacotl_SequenceTaskDriver`, `GF_116Quezacotl_ChargeTimelineTask`, `GF_116Quezacotl_FrameTick`
- Key globals in `0x25216d8`-`0x25217ac` range normalized to `GF_116Quezacotl_*`
- Progression/completion comments added at scheduling and return sites across init/task-driver/charge/frame-tick

## Notes

- This knowledge ball is now complete for static chain and naming coverage.
- Runtime evidence generation remains intentionally deferred to deterministic execution (`GF_QUEZACOTL_001`).
