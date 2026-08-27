---
title: >-
  Placing runtime laboratories
category: skills
tags: [ff8, battle-system, testing, skill]
aliases: [runtime placement skill, ff8iso_runtime placement]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/.agents/skills/placing-runtime-laboratories/SKILL.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-FinalFantasy-VIII-Reimaginated/agent-transcripts/d089cb0d-2243-4fc0-933b-acaa19ff54bd/d089cb0d-2243-4fc0-933b-acaa19ff54bd.jsonl
  - projects/re-ff8/skills/implementing-iso-battle-migration.md
summary: >-
  Where kernel, cadence, seams, labs, codecs, and NCOMP live inside
  ff8iso_runtime. Extract Runtime methods, not services.
provenance:
  extracted: 0.92
  inferred: 0.07
  ambiguous: 0.01
created: 2026-08-27T21:30:00+02:00
updated: 2026-08-27T21:30:00+02:00
---

# Placing runtime laboratories

Repo skill:
`.agents/skills/placing-runtime-laboratories/SKILL.md`. Read
`.agents/skills/implementing-iso-layer-boundary/SKILL.md` first if the
unit touches core, application, or abi. This page does not restate the
layer law. It says where the piece lives **inside** `ff8iso_runtime`.

`class Runtime` stays the process singleton. Extract **methods**, not
services. Do not rename the layer `ff8iso_infrastructure`. Cluster map:
[[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]].

## Gate checklist

1. Domain rules stay in `core/`. Session orchestration stays in `application/`.
2. Codec / `import_*` / `fill_*_witness` live in the gate TU (G15 pattern).
3. `Runtime::run_gXX_suite` may live in that same TU. Kernel `run_suite`
   only dispatches
   (`if (is_g15) return run_g15_ai_control_suite(request);`).
4. Keep one `class Runtime`. New TUs define `Runtime::` methods; they do
   not invent injected services.
5. NCOMP symbols stay in `TemporaryG06/G07/G09NcompAdapter`. Header must
   say `Removal target: U14.x`. `BattlePendingAction_Write` stays a
   seam. Do not invent a G08/G13/G14/G17 adapter.
6. G16 and G17 share `g16_pending_preimage_` and one
   `restore_g16_pending_preimage`. Shutdown in the kernel calls each
   cluster's `restore_*`.
7. Run `python .\tools\validate_contracts.py` after the edit.

## Where things live

- Kernel: `runtime-x86/src/runtime.cpp`
- Cadence hooks: `runtime-x86/src/runtime_cadence_hooks.cpp`
- G06 / G07: `runtime-x86/src/runtime_g06.cpp`, `runtime_g07.cpp`
- Command seams: `runtime-x86/src/runtime_command_seams.cpp`
- G08–G13 labs: `runtime-x86/src/runtime_g08.cpp` … `runtime_g13.cpp`
- G14 suite: `runtime-x86/src/runtime_g14.cpp`
- G15–G17: `g15_ai_control.cpp`, `g16_ai_actions.cpp`, `g17_reactions.cpp`
- Sealed presentation owner: `sealed_native_presentation_adapter.cpp`
- Shared host: `state_synchronizer`, `write_guard`, `host_memory`, `call_audit`
- Shared helpers / hook externs: `runtime-x86/src/runtime_internal.hpp`

Until a TU exists, the method stays in `runtime.cpp` under the matching
cluster banner. Create the TU when extracting that cluster; add it to
`ff8iso_runtime` in `CMakeLists.txt`.

## Stop

If the change needs a second `Runtime`, a service hierarchy, or a new
NCOMP adapter for a pending/QueueOrStore/enqueue seam, stop. If a suite
body is about to land in `SealedNativePresentationAdapter` or in
`BattleSession`, stop and put it in the gate TU. If G17 needs its own
pending preimage, stop and reuse G16's.

## Related

- [[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]]
- [[projects/re-ff8/skills/implementing-iso-battle-migration]]
- [[projects/final-fantasy-viii-reimaginated/references/g14-g17-red-team-2026-08-27]]
