---
title: >-
  Runtime laboratories
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [ff8iso_runtime clusters, runtime TU map]
sources:
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-FinalFantasy-VIII-Reimaginated/agent-transcripts/d089cb0d-2243-4fc0-933b-acaa19ff54bd/d089cb0d-2243-4fc0-933b-acaa19ff54bd.jsonl
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/.agents/skills/placing-runtime-laboratories/SKILL.md
  - projects/re-ff8/skills/implementing-iso-battle-migration.md
summary: >-
  Six-cluster map of ff8iso_runtime: kernel, cadence, seams, commit labs,
  G14, P1 AI/GF/commands/limits/battle-data. Unique Runtime; NCOMP only
  G06/G07/G09.
provenance:
  extracted: 0.88
  inferred: 0.10
  ambiguous: 0.02
created: 2026-08-27T21:30:00+02:00
updated: 2026-08-28T19:00:00+02:00
---

# Runtime laboratories

`ff8iso_runtime` is the unique host translator for
[[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]].
The 2026-08-27 split moved suite bodies out of a single ~8500-line
`runtime.cpp` into cluster TUs. `class Runtime` stays one process
singleton. Extract **methods**, not services. Do not rename the layer
`ff8iso_infrastructure`.

Layer law stays
[[projects/re-ff8/skills/implementing-iso-battle-migration]]:
`ff8iso_core` → `ff8iso_application` → `ff8iso_runtime` →
`ff8_battle_iso`, and `ff8iso_abi` → `ff8iso_runtime`. This page only
says where pieces live **inside** runtime. Placement procedure is
[[projects/final-fantasy-viii-reimaginated/skills/placing-runtime-laboratories]].

## Six clusters

```text
kernel          → runtime.cpp
cadence         → runtime_cadence_hooks.cpp, runtime_g06.cpp, runtime_g07.cpp
command seams   → runtime_command_seams.cpp
commit labs     → runtime_g08.cpp … runtime_g13.cpp
presentation    → runtime_g14.cpp + SealedNativePresentationAdapter
P1 AI/reactions/GF → g15_ai_control.cpp … g21_battle_data.cpp
```

| Cluster | Owns | Forbidden |
| --- | --- | --- |
| **kernel** | bootstrap/query/shutdown, `install_observation_seams`, thin `run_suite` dispatch, evidence ring, `write_guard`, `call_audit`, restore orchestration | Gate suite bodies, capture logic, domain rules |
| **cadence** | Frame/HUD/ATB/Director/Switch hooks, G05 scenarios, G06 pulse, G07 director tick + host mirror | Pending-write captures, G14–G17 suite bodies |
| **command seams** | `PendingAction_Write`, `QueueOrStore`, `EnqueueSpecialAction` trampolines + `capture_*` | HP/stock commit, a G08 NCOMP adapter |
| **commit labs** | `Runtime::run_g08`…`run_g13` arm + witness | Native cadence replacement |
| **presentation** | G14 suite glue (`sample_g14`, `reset_g14`) | Growing the sealed adapter with suite logic |
| **P1 labs** | G15–G21 import, measured witness fill, `run_gXX_suite`, G17 intercept | A second pending writer; stamped `armed`/`native_*` |

G10–G12 thin-wrap `run_g09_attack_suite`. Shared helpers and hook
externs live in `runtime-x86/src/runtime_internal.hpp`. Do not grow a
second anonymous copy in a new TU. ^[inferred]

G18–G21 share `g18_through_g21_suite_active()` and
`sealed_or_foreign_suite_active()`. File-save offsets live in
`runtime-x86/include/ff8iso/runtime/save_layout.hpp`, not in
`core/battle_data.hpp`.

## Shared restore

G16 and G17 share `g16_pending_preimage_` and one
`restore_g16_pending_preimage`. Kernel shutdown calls each cluster's
`restore_*`. Suite `restore_ok` on G16/G17 means the preimage is armed, not that
native consume was rolled back in-suite. G18–G21 measure `restore_ok` from
host hash / write count. Do not add an in-suite pending
restore after emit-then-native-consume. See
[[projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation]]
and
[[projects/final-fantasy-viii-reimaginated/references/p1-g17-reactions-validation]].

## NCOMP

NCOMP symbols stay in `TemporaryG06NcompAdapter`,
`TemporaryG07NcompAdapter`, and `TemporaryG09NcompAdapter`. Headers must
say `Removal target: U14.x`. `BattlePendingAction_Write` stays a seam.
Do not invent a G08/G13/G14/G17 adapter. `find_symbol` for those names
stays in adapters, not kernel `runtime.cpp`.

`SealedNativePresentationAdapter` must not include
`battle_session.hpp`. Suite logic stays in the gate TU.

## Verification

After a runtime edit: `python .\tools\validate_contracts.py`. The
2026-08-27 split passed contracts plus CTest G00 and G05–G17. Historical
live hashes stay: G14 `363d91cf…`, G15 `fcc8365e…`, G16 `92419780…`,
G17 `6326950a…`. No Session P recapture is required after a TU move.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/placing-runtime-laboratories]]
- [[projects/final-fantasy-viii-reimaginated/references/g14-g17-red-team-2026-08-27]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/re-ff8/concepts/enemy-ai-vm]]
