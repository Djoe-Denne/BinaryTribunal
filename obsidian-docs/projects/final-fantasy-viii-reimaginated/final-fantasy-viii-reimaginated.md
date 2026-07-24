---
title: >-
  Final Fantasy VIII Reimaginated
category: project
tags: [ff8, battle-system, reverse-engineering, project]
aliases: [FF8 Reimaginated, FF8 battle remaster, battle-iso]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/README.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/manifests
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g00-g04-2026-07-18.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/director-gateway-validation-2026-07-21.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/p0-6-offline-validation-2026-07-22.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/p0-7-offline-validation-2026-07-23.md
  - projects/re-ff8/skills/implementing-iso-battle-migration.md
summary: >-
  In-process x86 battle migration with live strict G03, Init/Exit ABI and a
  historical G05 one-tick probe; P0.7 G05 scenario closure is live-validated
  on its final hash, while G06 and P1 remain locked.
provenance:
  extracted: 0.88
  inferred: 0.09
  ambiguous: 0.03
created: 2026-07-18T17:48:00+02:00
updated: 2026-07-23T12:10:00+02:00
---

# Final Fantasy VIII Reimaginated

Final Fantasy VIII Reimaginated is the implementation project for the full in-process x86 battle migration designed in [[projects/re-ff8/skills/implementing-iso-battle-migration]]. It targets the supported 2000 PC executable, keeps FF8 as the host process, and progressively replaces battle-owned responsibilities behind explicit fidelity profiles.

Repository: [Djoe-Denne/FinalFantasy_VIII_Reimaginated](https://github.com/Djoe-Denne/FinalFantasy_VIII_Reimaginated). The P0.5 baseline was commit `89a2928` (`init`); generated build and live-evidence artifacts remain intentionally untracked.

## Current checkpoint

> [!success] G04/P0 foundation reached with declared constraints
> G00–G04 offline suites and the cumulative live P0 run pass. The game remains authoritative: no Attack, ATB, AI, damage, status, presentation, initialization, or exit behavior is claimed as replaced.

Completed foundations include:

- reproducible MSVC Win32 CMake presets and PE32/I386 output verification;
- executable MD5/SHA-256 identity checks and hash-bound address maps;
- a stable exported C/POD launch ABI;
- inert `DllMain`, explicit bootstrap/suite/shutdown exports, and structured evidence events;
- transactional MinHook seams with quiescent rollback;
- canonical pointer-free `core::BattleState` plus `abi::LegacyBattleImage`;
- guarded host reads/writes, pointer validation, write allowlists, and call auditing;
- manifest, closure, strategy, ownership, fallback, and evidence policies;
- representative CLIFT and BLIFT fixtures;
- offline and injected G00–G04 suites.

> [!note] P0.5 live seam validation
> A fresh-process G03 pass-through scenario validated the active-only Director gateway and Switch observer with register/stack canaries and exact rollback. The remaining repeated-cycle and controlled-fault evidence keeps strict G03 open. G05 deterministic primitives and G06 scripted input/ATB/GF/escape remain offline-only: their ownership modes are still rejected rather than falling back to native battle logic.

> [!success] P0.6 live proof
> The DLL now has a live-validated versioned G05 no-write one-tick probe,
> field-only G03 controlled fault, Init/Exit ABI records, stack/register
> evidence export, and fail-stop policy after probe ownership. Strict G03,
> G04 ABI debt and the limited G05 proof moved forward; P1 and G06 remain
> locked. See
> [[projects/final-fantasy-viii-reimaginated/references/p0-6-offline-validation]].

> [!success] P0.7 G05 strict live closure
> The v2 scenario protocol, pointer-free fixture overlays, multi-tick
> handback, post-engagement fault and runtime-derived verdict collector pass
> on final hash `8dfefeb99b2427b59b90cc594233d8ff1b325c34600057ffd335e2b6c3379178`.
> The positive matrix and negative fault are captured; G06/P1 remain locked. See
> [[projects/final-fantasy-viii-reimaginated/references/p0-7-offline-validation]]
> and [[projects/final-fantasy-viii-reimaginated/skills/p0-7-live-validation-playbook]].

P1 AttackSlice remains locked until G05–G09 pass with their required in-process evidence.

## Operational snapshot — read this first

The project currently has three distinct levels. They must not be conflated:

1. **Live pass-through harness — validated.** The frame hook can observe a
   battle, the module-switch hook can observe callback installation, and the
   Director gateway can preserve its register image, call native FF8 logic,
   then return. These hooks are observation doors, not gameplay replacements.
2. **Deterministic battle model — offline validated.** The DLL owns C++ models
   for RNG, phases, latches, `InputFrame`, ATB, GF charge, escape polling and
   ready events. Tests feed synthetic state into those models; FF8 does not
   use their outputs yet.
3. **Gameplay ownership — deliberately disabled.** BattleUI still polls input
   and advances native ATB. The Director owns native battle logic except for
   the historical live one-tick probe and the sealed P0.7 laboratory
   scenarios. G06 still returns `BAD_REQUEST`; no FF8 battle write is enabled.

The practical mental model is: the project can currently **look through the
windows of the train safely**, and has a simulator of the next systems to
replace, but it has not yet taken the controls.

## How live tests work

The injected DLL is loaded only from Open World or a menu, with IDA detached.
`FFScriptLoader` loads the DLL and invokes a C export using a small POD
request file:

- a 128-byte bootstrap request selects the seams;
- a 64-byte suite request selects a group such as G03 or G04;
- `capture_live_canaries.py` reads memory only, checking the current mode,
  post-init guard and hook bytes before and after the run.

The normal sequence is: verify native bytes on Open World → bootstrap
pass-through seams → enter a normal battle → wait for `03/03/01/04` → run the
requested suite → return to Open World → explicit shutdown → verify that the
original hook preimage is back byte-for-byte.

IDA is used separately for narrow ABI questions. For Director, breakpoints
before (`0x47D113`) and after (`0x47D118`) its direct call captured registers
and stack on a fresh process. IDA was detached again before injection.

## Architecture

The project separates:

- `contracts/` — stable launch/status/evidence C ABI;
- `abi/` — packed legacy mirrors, address maps, and compatibility images;
- `core/` — deterministic host-independent battle state and future rules;
- `application/` — battle session and use-case orchestration;
- `runtime-x86/` — process memory, state synchronization, detours, lifecycle, and evidence;
- `integration/ffscriptloader/` — typed adapter over [[projects/ffscriptloader/ffscriptloader]];
- `lift/` — strategy manifests and contained lifted representatives;
- `tests/` and `evidence/` — offline contracts, in-process suites, and promotion artifacts.

Only `runtime-x86/` may touch raw FF8 process memory. The canonical state never owns host pointers, and C++ STL/virtual types do not cross the game/DLL boundary.

## Operational playbook

[[projects/final-fantasy-viii-reimaginated/skills/p0-6-live-validation-playbook]]
captures the historical P0.6 workflow. P0.7 scenario selection, trace/RNG
witnesses, handback and controlled-fault collection are specified in
[[projects/final-fantasy-viii-reimaginated/skills/p0-7-live-validation-playbook]].

## Validated live boundary

The default P0 bootstrap installs only a pass-through `FFBattleModule` frame seam. UI/Switch and the active-only Director gateway are opt-in development seams. The Director gateway preserves and forwards its ambient register context, then invokes the native trampoline. The versioned G05 probe is the sole live-validated no-write, one-call test exception; it does not expand the P0 ownership claim.

Injection is performed outside battle, without an attached debugger. Once a battle reaches the proven active guard `03/03/01/04`, the suite imports and round-trips a snapshot, verifies zero write-guard violations, and shuts down from a safe state. The 16-byte target preimage is then restored exactly.

See [[projects/final-fantasy-viii-reimaginated/references/p0-harness-validation]].

## Open blockers and debt

- `Battle_ActiveTickEntry` remains `blocked-evidence`; the proved Director seam is active-only pass-through and is not an interior-entry exemption.
- Complete live Init/Exit register and stack capture plus the P1 wrapper set required by strict G04.
- Maintain the G03/G05 regression artifacts when the DLL code changes; the
  recorded strict G03 and G05 candidates have distinct hashes.
- Prove the temporary BattleUI ownership window and ATB/escape cadence before enabling G06 host writes.
- Arbitrate the Draw `command_id` discrepancy (`0x06` in the current map versus `0x04` in old fixtures) before generating an enum.
- Consolidate the current payload/injector/canary sequence into the roadmap’s manifest/suite-aware one-command runner.

These are fail-closed boundaries. None is hidden behind native fallback within a claimed replacement profile.

## Related

- [[projects/re-ff8/re-ff8]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]]
- [[projects/ffscriptloader/skills/hardening-x86-dll-injection]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-5-offline-validation]]

