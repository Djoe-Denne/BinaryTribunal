# Note: `BdLinkTask_CreateAndInitContext` (`0x8DC540`) Shared GF Task Constructor / Tick Dispatch

## Why this matters

Several GF summon scripts (at least Siren + Tonberry) share the same task-constructor helper:

- Siren entry: `GF_095Siren_InvokeSummonScript` (`0x739DA0`) -> `BdLinkTask_CreateAndInitContext` (`0x8DC540`)
- Tonberry entry: `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE` (`0x762360`) -> `BdLinkTask_CreateAndInitContext` (`0x8DC540`)

This shared helper is the missing link that explains why multiple GFs can appear
to have an "unknown tick" even when their entry looks like it only does memsets:
the tick is passed *as a function pointer argument*.

## What `BdLinkTask_CreateAndInitContext` does (static decompile summary)

Signature (Hex-Rays):

`int __cdecl BdLinkTask_CreateAndInitContext(_DWORD *dst_ctx, int tick_fn, int ctx_size, int parent_ctx)`

High-level behavior:

- Calls `BdLinkTask(dst_ctx, tick_fn)` and returns its result pointer.
- Clears the newly created context tail (`memset(result + 0x0C, 0, ...)`) based on `ctx_size`.
- If `parent_ctx != 0`, copies a small set of control fields from the parent into the new task:
  - Writes backlink pointers (`result+0x14`, `result+0x10`, etc.).
  - Copies several bytes around `+0x2A..+0x2F` (flags, indices).
  - Increments `*(uint8_t *)(parent_ctx + 0x28)` (a reference / nesting counter).
  - Uses bytes from `*(dst_table + 0x14 * idx)` and a secondary lookup to populate
    per-task selector bytes at `result+0x2C` and `result+0x2D`.
- If `parent_ctx == 0`, sets:
  - `*(result+0x18) = 0` (parent ptr)
  - `*(result+0x14) = 0` (next ptr)
  - `*(result+0x10) = result` (self link / list head)

## Key discovery: tick is arg2 to `BdLinkTask_CreateAndInitContext`

Entry callers select their per-frame tick by passing it as `tick_fn`.

Examples:

- Siren:
  - `BdLinkTask_CreateAndInitContext(dword_257FA80, (int)GF_095Siren_SequenceTick, 100, 0)`
  - Tick: `GF_095Siren_SequenceTick` (`0x739F40`)
- Tonberry:
  - `BdLinkTask_CreateAndInitContext(dword_259F088, (int)sub_7624D0, 100, 0)`
  - Tick: `sub_7624D0` (`0x7624D0`)

This is the reusable pattern for any other GF entry that:

1. Sets up a per-GF static context buffer (often 100 bytes).
2. Calls `BdLinkTask_CreateAndInitContext(<ctx>, <tick_fn>, <size>, <parent_ctx?>)`.

If you have the entry function, you can recover the tick by inspecting the
second argument to `BdLinkTask_CreateAndInitContext`.

## Implication for Tonberry reuse

Tonberry's "unknown tick" is not hidden behind a dispatch table; it is passed
directly as a function pointer:

- Tick: `sub_7624D0` (`0x7624D0`)
- Counter increments inside the tick are at:
  - `0x7625F5`: `inc word ptr [ctx+0x5C]`
  - `0x7625F9`: `inc word ptr [ctx+0x24]` (primary)
- Completion return is at:
  - `0x762611`: `mov eax, 2; retn`

This suggests a common "Atypical shared-init family" where:

- Entry is a mostly-static setup function.
- Tick drives a BDLink subtask list and returns `2` on completion.

