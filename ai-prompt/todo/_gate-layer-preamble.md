# Gate layer preamble (include in every G10+ new-chat prompt)

Copy this block at the top of `g10-*-new-chat.md` and later gate chats.

## Mandatory layer law

Implement the unit as **semantic domain** (`core/`) → **session**
(`application/BattleSession`) → **runtime codec / TemporaryGxxNcompAdapter**.

- `core/` and `application/` must not `#include "ff8iso/abi/`, mention
  `abi::`, call `find_symbol`, or pack native pods.
- `BattleSession` accepts `core::BattleState` / semantic reports. Runtime
  decodes `LegacyBattleImage` first (`import_legacy`, `decode_command_spine`).
- Every NCOMP opcode or native helper call goes in
  `ff8iso::runtime::temporary_ncomp::TemporaryGxxNcompAdapter` with
  `Removal target: U14.x`. Do not grow an existing temporary adapter with
  domain work. Do not invent a G08 adapter.
- `ff8iso_core` does not link `ff8iso_abi`. `ff8iso_runtime` already is the
  infrastructure layer.
- After edits: `python .\tools\validate_contracts.py`, then
  `cmake --preset debug-x86` and `ctest --preset debug-x86`.
- Stop if the unit only compiles by putting ABI in core/session.

Read `.agents/skills/implementing-iso-layer-boundary/SKILL.md` before coding.
