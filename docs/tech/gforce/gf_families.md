# GF Structural Families

## FamilyA — Multi-Task Chain

Entry → Init → SequenceTick → SequenceTaskDriver (secondary tick)

The tick allocates an effect task pool and schedules a secondary driver. The driver runs the cinematic timeline and returns completion.

**Exemplars**: Pandemona, Doomtrain, Shiva, Odin

**Pattern**:
- Entry calls init callee (separate function)
- Init seeds context and schedules tick via `BdLinkTask`
- Tick has a counter increment site and a completion return
- Tick also schedules a driver tick for the extended timeline
- Driver has its own counter/completion sites

## FamilyB — Single-Task, Script-Driven

Entry → SequenceTick (tick IS the driver)

No secondary task list. The tick directly contains animation logic, using a script-based animation system rather than a frame counter.

**Exemplars**: Cerberus, Brothers, Leviathan, Alexander, Bahamut, Eden

**Pattern**:
- Entry initializes context and registers a single tick
- Tick runs animation scripts with three passes per frame: backward, transform, forward
- Scene system divides cinematic into sub-animations; `AdvanceSceneOrComplete` opcode controls progression
- Completion: tick returns `2` when all scenes exhausted

## SharedInit (Atypical) — Shared Task Constructor

Entry → `BdLinkTask_CreateAndInitContext` (`0x8DC540`) → SequenceTick (passed as function pointer)

**Exemplars**: Siren, Tonberry

**Pattern**:
- Entry is a mostly-static setup function (memsets, context pointers)
- Calls `BdLinkTask_CreateAndInitContext(ctx_ptr, tick_fn, ctx_size, parent_ctx)` where `tick_fn` is the GF-specific per-frame tick
- Tick drives a BDLink subtask list and returns `2` on completion

**Key insight**: If you have the entry function, you can recover the tick by inspecting the second argument to `BdLinkTask_CreateAndInitContext`.

## Atypical — Unclassified

GFs where the chain is partially resolved or doesn't clearly fit FamilyA/B. Usually means deeper decompilation is needed to classify.

## Completion Mechanism (Common)

All families use the same completion return:

```c
return ((unsigned int)~*(WORD*)(statePtr + 10) >> 14) & 2;
```

- Initially: bit 15 set → returns 0 (continue)
- When scenes exhausted or completion triggered → bit 15 cleared → returns 2 (done)
