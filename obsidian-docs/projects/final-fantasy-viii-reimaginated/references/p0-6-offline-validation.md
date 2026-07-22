---
title: >-
  P0.6 Implementation And Live Validation — 2026-07-22
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [P0.6 one-tick probe, P0.6 validation]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/p0-6-offline-validation-2026-07-22.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/init-exit-abi-capture-2026-07-22.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g03-strict-validation-2026-07-22.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g05-one-tick-validation-2026-07-22.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/runtime-x86/src/runtime.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tools/capture_runtime_evidence.py
  - projects/re-ff8/skills/implementing-iso-battle-migration.md
summary: >-
  P0.6 validates live strict G03, Init/Exit ABI and a versioned no-write G05
  one-tick probe, while retaining a FullISO-aligned fail-stop policy and
  leaving G06 plus all FF8 battle writes disabled.
provenance:
  extracted: 0.91
  inferred: 0.06
  ambiguous: 0.03
created: 2026-07-22T13:35:00+02:00
updated: 2026-07-22T15:20:00+02:00
---

# P0.6 Implementation And Live Validation — 2026-07-22

> [!success] P0.6 live proof passed
> The Win32 contract/build/CTest suite, strict G03 cycles/fault, Init/Exit ABI
> capture and one G05 no-write tick passed. This does not unlock P1 or G06.

## Implemented boundary

- A `G03` controlled fault may be requested only from Open World or menu. It
  records `Faulted`, removes hooks quiescently, restores the patched bytes, and
  leaves the DLL loaded but inert.
- A `G05 one-tick v1` request is available only with explicit version/flag,
  active `03/03/01/04` state, the Director gateway, no HUD ownership, and an
  empty P0 write policy.
- A successful probe suppresses exactly one native Director call, executes the
  pointer-free active-tick shell once, verifies its observed-memory hash, then
  returns to native Director on the following invocation.
- A fault after the probe commits is fail-stop, not a native Director
  fallback. This models the final ownership rule: a DLL that owns Init through
  Exit does not hand a partially owned battle back to FF8.
- `FF8Iso_EvidenceSnapshot` exposes register/stack canaries, Director action,
  memory-hash comparison, write violations, call-audit summary and runtime
  state for read-only external capture.

## Implementation and offline result

- Reimaginated: **14/14** `debug-x86` CTest tests passed.
- FFScriptLoader baseline: **151/151** Win32 CTest tests passed before the
  Reimaginated changes.
- The tested debug DLL hash is
  `dfcca35880ec833de04a21a1b60991b44015fca36e518ab4c7b584981d0c7508`.

The complete command/result record is
`evidence/p0-6-offline-validation-2026-07-22.md` in the implementation
repository.

## Live results

1. **G04 Init/Exit ABI:** IDA captured entry and caller-return registers,
   stack, argument and near-return cleanup with no DLL injected. Both
   contracts are now ledger facts but remain unused by P0.6.
2. **G03 strict:** three Open World → battle → Open World cycles observed
   Director/Switch seams safely; a subsequent field-only controlled fault
   reached `Faulted`, removed hooks and restored the frame preimage exactly.
3. **G05 live:** the corrected versioned probe suppressed one Director call,
   ran exactly one deterministic 13-step no-status active tick, produced an
   equal FF8-memory hash, returned to native Director on the next invocation,
   and shut down with byte-exact restoration.

G06, all FF8 battle writes, `Battle_ActiveTickEntry`, command ownership,
damage, AI, queues, targeting and presentation remain outside P0.6.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-5-offline-validation]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
- [[projects/re-ff8/skills/implementing-iso-battle-migration]]
