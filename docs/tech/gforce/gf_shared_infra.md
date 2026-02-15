# GF Shared Infrastructure

## GF_CALLBACK_PTR (0x21DFEC4)

Global function pointer to the currently active GF cinematic callback. Set by `BattleGF_LoadCallbackByMagicID` (`0x50AF20`) during `Tick_GF_Cinematic` state 1. Reading this value while paused during a GF cinematic identifies which GF is running.

IDA name: `GF_CALLBACK_PTR`

## BdLinkTask_CreateAndInitContext (0x8DC540)

Shared task constructor used by multiple GFs. Signature:

```c
int __cdecl BdLinkTask_CreateAndInitContext(_DWORD *dst_ctx, int tick_fn, int ctx_size, int parent_ctx)
```

Behavior:
- Calls `BdLinkTask(dst_ctx, tick_fn)` to register the tick function
- Clears the context tail (`memset(result + 0x0C, 0, ...)`)
- If `parent_ctx != 0`: copies control fields, increments nesting counter at `parent_ctx + 0x28`
- If `parent_ctx == 0`: initializes self-links (root task)

The tick is argument 2 — this is how entry functions specify their per-frame tick.

## Shared GF Cinematic Globals (g_GfCinematic_* prefix)

These globals are shared across ALL GFs. Only one GF cinematic runs at a time. Each GF's tick starts by resolving these from its own configuration tables (e.g., Cerberus resolves from `0x1873170-0x1873180`).

| Address | IDA Name | Description |
|---------|----------|-------------|
| `0x27973EC` | `g_GfCinematic_SequenceCtxPtr` | Active GF sequence context |
| `0x27973B8` | `g_GfCinematic_RuntimeSlotPtr` | Active GF runtime slot |
| `0x27973BC` | `g_GfCinematic_RenderCtxPtr` | Active GF render context |
| `0x27973C0` | `g_GfCinematic_SequenceStatePtr` | Active GF state pointer |
| `0x2797624` | `g_GfCinematic_OffsetStack` | Active GF stack frame |

> **Rename history**: These were originally named `gfIfrit_*` (from the first Ifrit analysis). Renamed to `g_GfCinematic_*` on 2026-02-15 to reflect that they are shared across all GFs, not Ifrit-specific.

## BdLinkTask (0x508360)

Low-level task creation: creates and links a new task node into a task list. Used by entry/init functions to schedule tick functions.

## BS_Memset (0x508300)

Battle system memset for initializing task arrays. Typical usage: `BS_Memset(head, data, slot_count, capacity)`.

## BattleGF_InitCameraFromGlobals (0x56CD50)

Shared camera position initialization used by multiple GF init functions.
