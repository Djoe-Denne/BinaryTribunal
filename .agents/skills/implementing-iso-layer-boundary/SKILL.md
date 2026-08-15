---
name: implementing-iso-layer-boundary
description: >-
  Enforces the FF8 ISO battle layer law (core domain, application session,
  abi pods, runtime codecs/NCOMP). Use when implementing G10+ gates, moving
  import_legacy or serializers, touching BattleSession snapshots, adding
  find_symbol/NCOMP, TemporaryGxxNcompAdapter, or validate_contracts layer
  guards, or when core/application would include ff8iso/abi.
---

# Implementing ISO layer boundary

Read this before any G10+ unit, any snapshot/codec change, or any native
call. The G09 pattern is now the law for every delivered gate.

Implementation repo: `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

## Layer law

```text
ff8iso_core → ff8iso_application → ff8iso_runtime → ff8_battle_iso
ff8iso_abi  → ff8iso_runtime
```

| Layer | Owns | Forbidden |
| --- | --- | --- |
| **core** | Canonical rules/state (`BattleState`, `CommandSpineState`, AttackSlice) | `#include "ff8iso/abi/`, `abi::`, `find_symbol`, RVA, NCOMP, native pods, `import_legacy` |
| **application** | `BattleSession` orchestration; may include `ff8iso/launch_contract.h` via `ff8iso_contracts` | `LegacyBattleImage`, codecs, host I/O, `find_symbol`, `ff8iso_abi` |
| **abi** | POD / address-map | `#include` of `core/` |
| **runtime** | Codecs + `TemporaryGxxNcompAdapter` | Domain rules that belong in core |

`ff8iso_core` must not link `ff8iso_abi`. Do not rename runtime to
`ff8iso_infrastructure`.

## Gate checklist

1. Domain types and rules go in `core/` with no ABI headers.
2. Session APIs accept `core::BattleState` / semantic reports already decoded.
3. Runtime calls `import_legacy` / `decode_command_spine` / serialize, then
   passes canonical state into the session.
4. Every NCOMP symbol lives in `ff8iso::runtime::temporary_ncomp::TemporaryGxxNcompAdapter`.
   Header must say `Removal target: U14.x`. Do not grow an adapter with domain
   work. Do not invent a G08 adapter; `BattlePendingAction_Write` stays a seam.
5. `find_symbol("…")` for an adapter-owned name appears only in that adapter
   `.cpp` (`BattleUI_RenderHud` → G06, file-callbacks/BdLink → G07,
   relay/popup/unlock → G09).
6. Run `python .\tools\validate_contracts.py` after the edit.

## Where things live

- RVA / `find_symbol` / `write_rva`: runtime adapter or synchronizer
- POD (`PendingActionEntry`, `ExecQueueCell`, `LegacyBattleImage`): `abi/`
- Codecs: `runtime-x86/src/legacy_state_codec.cpp`,
  `runtime-x86/src/command_spine_codec.cpp`
- Semantic event (`DamageEventRecord`, status payload): `core/`
- Native 24-byte damage record: `TemporaryG09NcompAdapter` only

## Stop

If the unit needs `#include "ff8iso/abi/` above runtime, stop and decode in
runtime instead. If a temporary adapter is the only place a new opcode fits,
add a new adapter or wait for U14.x; do not dump it into `runtime.cpp` or
`BattleSession`.
