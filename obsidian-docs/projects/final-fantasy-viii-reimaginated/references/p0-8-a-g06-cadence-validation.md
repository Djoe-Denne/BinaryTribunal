---
title: >-
  P0.8-A G06 Read-Only BattleUI Cadence Validation — 2026-07-24
category: references
tags: [ff8, battle-system, testing, reference, atb]
aliases: [P0.8-A G06 cadence, G06 BattleUI cadence validation]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-a-g06-watch-runtime.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-a-g06-pause-watch-runtime.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-b-g06-watch-runtime.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-b-g06-pause-one-frame-runtime.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/abi/src/address_map.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/runtime-x86/src/runtime.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/runtime-x86/src/state_synchronizer.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/runtime-x86/src/write_guard.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/offline/test_g06.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-pilot-validation-2026-07-24.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-matrix-validation-2026-07-24.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/9bf843ec-4ce7-4dce-b4bc-3feaa1309baa/9bf843ec-4ce7-4dce-b4bc-3feaa1309baa.jsonl
summary: >-
  P0.8-A establishes the four-pulse BattleUI/ATB cadence and pause baseline
  later extended by the bounded P0.8-C pilot and P0.8-D semantic matrix.
provenance:
  extracted: 0.93
  inferred: 0.05
  ambiguous: 0.02
created: 2026-07-24T19:45:00+02:00
updated: 2026-07-24T23:20:43+02:00
---

# P0.8-A G06 Read-Only BattleUI Cadence Validation — 2026-07-24

> [!success] Read-only cadence closure
> The G06 observer records native state before and after each
> `BattleUI_HudInputAndATBTick` call. It holds no FF8 write range and retains
> native BattleUI ownership throughout.

## Hash-bound evidence

The active unpaused capture is bound to DLL
`07625f010028451a6ed183e8e9db2b0dabb720d570192f3349eeb9f929f68137`
(protocol v2, retained as the discovery capture). Across eight frames it
records exactly four HUD calls per `FFBattleModule` frame. The first
partially-observed frame changes ATB on one call; every complete following
frame changes it on all four calls, with a total delta of `184` per frame.

The protocol-v3 pause-gate capture is bound to DLL
`51b7ba085920bb6308b7ba2a4e2abd8b2a300e0f9b5bb31fc61cc7d7d8b08759`.
Its eight frames each contain four HUD calls, `IS_BATTLE_PAUSED=1`, zero
ATB-changing calls, zero pending-action-changing calls, and identical before /
after hashes for both observed blocks.

Both envelopes are runtime `PASS`, with an empty write allowlist, zero write
violations, and zero forbidden calls. They are observations only; neither
capture asserts G06 ownership or exports a DLL state change to FF8.

## Corrected cadence model

- One `FFBattleModule` frame contains four native HUD/ATB pulses: three before
  the Director and one after it.
- An unpaused pulse is an ATB/GF/escape progression unit. It is not valid to
  compress the four pulses into one ATB tick per module frame.
- `IS_BATTLE_PAUSED` freezes the observed ATB and pending blocks despite all
  four HUD calls still executing.
- The ordinary command menu becoming visible for a ready actor was observed
  without this pause latch; visible UI is not sufficient evidence of a pause.

## Ownership contract derived for the next pilot

The next G06 pilot must suppress exactly the four native HUD calls in its
bounded replacement frame and advance the canonical `BattleSession` once per
HUD pulse. `InputFrame.logical_frame` now names this monotonic pulse, not a
render/module frame; duplicate pulse IDs remain rejected.

The proposed, inactive **ATB-only candidate** has exactly eleven 4-byte ranges:
`BATTLE_SLOT_DATA[0..10].cur_atb` (`+0x14`, stride `0xD0`) at
`NativePresentationCompatibility`. It expressly excludes pending actions,
input state, ready flags, GF timers, RNG, status, UI mirror and all other
battle fields. Offline tests assert both the exact accepted fields and
rejection of adjacent or oversized ranges.

## Historical gates and continuation

At this checkpoint, static recovery added the sparse party GF charge timers
(`F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER`, RVA `0x018FF014`, three 16-bit values at
stride `0x1D0`) to the read-only bridge. The native path also exposed action,
UI-mirror and ready-command effects, proving that the original 11-range
`cur_atb` candidate could not authorize broad BattleUI ownership.

P0.8-C subsequently validated a narrower four-pulse ATB-only pilot with guarded
`cur_atb` and UI-mirror writes. P0.8-D then closed the read-only ready,
action-freeze, pause, GF-charge and escape semantic matrix. These increments
do not retroactively make P0.8-A an ownership proof: normalized input, pending
actions and complete BattleUI switching remain outside the claimed boundary.

## Same-candidate revalidation

The bridge extension candidate
`99b18ba4b8ac3fe8e9f15d50791eeaa89ceb3fac36c0479e8d2b4e7fca08c70d`
passed `18/18` offline tests and reproduced the eight-frame active capture:
four HUD calls per frame, with four ATB-changing calls in every complete
unpaused frame. A one-frame pause-gate watch was armed before Alexandre's
summoning animation and captured autonomously: four HUD calls, zero ATB and
pending changes, `IS_BATTLE_PAUSED=1`, and equal before/after hashes.

Both runtime envelopes pass with zero writes and forbidden calls; Open-World
shutdown restored the frame-hook preimage exactly. The evidence collector was
corrected to retain the empirically observed ATB-changing call count rather
than assert the disproven “at most one” assumption.

## Related

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-7-offline-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-c-g06-atb-pilot-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
