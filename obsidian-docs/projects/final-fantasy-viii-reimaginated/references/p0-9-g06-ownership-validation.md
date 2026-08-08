---
title: >-
  P0.9 G06 Scripted Ownership Validation — 2026-07-31
category: references
tags: [ff8, battle-system, testing, atb, reference]
aliases: [P0.9 G06 ownership, G06 scripted ownership v3]
relationships:
  - target: "[[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]"
    type: extends
  - target: "[[projects/re-ff8/concepts/atb-and-command-menu]]"
    type: related_to
  - target: "[[projects/re-ff8/concepts/escape-mechanics]]"
    type: related_to
  - target: "[[projects/re-ff8/skills/ff8-live-validation-operations]]"
    type: uses
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-p0-9-ownership-offline-validation-2026-07-31.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-p0-9-ownership-live-validation-2026-07-31.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-9-g06-ncomp-v2-live.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-9-g06-closure-v3-final-live.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G06.suite.toml
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/31099739-e2b1-4e40-985b-92382bede2e7/31099739-e2b1-4e40-985b-92382bede2e7.jsonl
summary: >-
  P0.9 v3 closes G06 with exclusive BattleUI ownership, stable native NCOMP
  rendering, exact GF/ready/escape fixtures, and byte-exact rollback.
provenance:
  extracted: 0.97
  inferred: 0.02
  ambiguous: 0.01
base_confidence: 0.54
lifecycle: evergreen
lifecycle_changed: "2026-07-31"
tier: supporting
created: 2026-07-31T15:30:00+02:00
updated: 2026-08-08T16:40:00+02:00
---

# P0.9 G06 Scripted Ownership Validation — 2026-07-31

> [!success] G06 closed on the P0.9 v3 candidate
> The final fresh-process closure matrix completed 240 pulses over 60 frames,
> with 240 ATB ticks, exact GF `6→4`, typed auto/menu readiness `1/1`, blocked
> escape for 60 frames, one known poll, RNG cursor `4→5`, native NCOMP rendering,
> no forbidden call or fallback, and byte-exact hook restoration.

## Candidate and protocol

- FF8 executable SHA-256:
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- final DLL SHA-256:
  `20624485e9444db0063949501c5be8e9dd71f5cd868e9cba0a06e049a7648cf4`;
- evidence schema `8`;
- protocol `g06-scripted-ownership-v2`;
- profile `P0.9`, disabled by default and armed only by a versioned suite request.

The offline gate passed contract validation, debug Win32 compilation, CTest
`18/18`, edited-file linting, diff whitespace checks, injector validation, and
`IMAGE_FILE_MACHINE_I386` verification.

## Ownership boundary

The runtime queues remote activation and only arms it after a fresh
`FFBattleModule` import at a complete frame boundary. A tested cadence state
machine enforces exactly four `BattleUI_HudInputAndATBTick` pulses per module
frame. Each owned pulse:

1. re-imports live unowned gates/status and native Director RNG;
2. rejects drift in ATB, ready bits, GF timers, escape state, progression, or
   G07 pending records;
3. normalizes timestamped held/pressed/released input;
4. co-ticks ATB, GF and escape when the native progression predicate admits it;
5. emits typed auto-ready/menu-ready and escape events;
6. exports only the G06 write allowlist.

`BattleATB_TickAndReady` and the native HUD domain trampoline remain
suppressed. Any attempt increments an explicit witness and fail-stops; there
is no silent handback.

## NCOMP visual failure and repair

The protocol-v1 machine witness initially passed while the HUD and ATB gauges
were absent for the entire 60-frame ownership window. This disproved the idea
that the disappearance was only an injection transition.

IDA showed that suppressing `BattleUI_HudInputAndATBTick` also skipped its sole
call at `0x4A8830` to the no-argument renderer at `0x4A8870`. Its captured
preimage is:

`83ec14a190d4d6015333db55668b5806`

Protocol v2 retains only this proven `BattleUI_RenderHud` call as a sealed
native compatibility unit. It does not restore native input, ATB, pending,
ready, GF, or escape logic. The final rerun measured exactly one native render
call per module frame (`60/60`), and the user confirmed that HUD and gauges
remained visually stable throughout the multi-second window.

## Final neutral witness

The fresh-process envelope
`p0-9-g06-ncomp-v2-live.json` records:

- `240/240` logical HUD pulses over `60` frames;
- `240` admitted ATB ticks;
- `60` native NCOMP presentation calls;
- one typed menu-ready event and zero native menu invocation;
- slot hash `0x4CF4A27E -> 0x19AB0301`;
- pending hash `0x6AEFDE65 -> 0x6AEFDE65`;
- zero native ATB hook attempts, fallback calls, forbidden calls, and
  write-guard violations;
- shutdown state `Detached`;
- `FFBattleModule` preimage restored byte-for-byte while FF8 remained alive.

The visual rerun reproduced the same machine counts with slot hash
`0xE6D26293 -> 0x8E3A88E4`.

## Other findings

- Activation during `BATTLE_ACTION_EXECUTION_ACTIVE != 0` accepts deterministic
  input pulses but correctly freezes ATB/GF. Synchronizing promotion probes to
  action-idle plus native progression avoids misclassifying that gate as an
  ownership failure.
- A 60-pulse `escape-held` run on the preceding candidate observed
  `BACK_PREEMPTIVE_INFO == 0` and emitted one deferred request without consuming
  RNG. P0.9 deliberately refuses to invent the missing normal-encounter enemy
  classifier.
- G07 remains excluded: pending records are neither written nor synthesized,
  and their before/after hash must remain identical.

## Closure decision

G06 is closed for DLL SHA-256
`66c17d81b406e653444d85b52441ae2d24839805de43339eec3349dded6c5289`.
The final envelope is `PASS`; all five assertions pass, including ownership
outcome and exact cleanup. G07 remains outside this batch: command queues,
pending transfer, action resolution, and native menu replacement are not owned.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/concepts/escape-mechanics]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
