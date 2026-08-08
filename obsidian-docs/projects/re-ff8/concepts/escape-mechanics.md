---
title: Escape Mechanics
category: concepts
tags: [ff8, battle-system, reverse-engineering, concept]
aliases: [battle flee system]
sources:
  - obsidian-docs/_staging/investigations/escape_mechanics.md
  - docs/tech/systems/battle_init.md
  - docs/product/battle.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-matrix-validation-2026-07-24.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-p0-9-ownership-live-validation-2026-07-31.md
summary: Escape shares ATB/RNG cadence; P0.9 types held, blocked, roll and deferred requests, refusing unknown normal-encounter probabilities.
provenance:
  extracted: 0.82
  inferred: 0.11
  ambiguous: 0.07
created: 2026-06-09T19:00:00+02:00
updated: 2026-07-31T15:30:00+02:00
---

# Escape Mechanics

Escape is not a queued battle command. The battle UI exposes it as a held-input state plus a hold-duration counter, and the active loop periodically rolls flee success against the shared battle RNG stream.

## Input And State

- `BATTLE_ESCAPE_INPUT_ACTIVE` becomes `1` while the run input combination is held.
- `BATTLE_ESCAPE_HOLD_FRAMES` increments once per frame while that state remains active.
- `BATTLE_ESCAPE_STATE` behaves like a small state machine:
  - `0` = idle,
  - `1` = escape success armed,
  - `2` = escape transition already in progress.

The exact physical button combination behind the input latch still needs live confirmation.^[ambiguous]

### Escape does not freeze ATB

The promoted P0.8-D capture observed
`BATTLE_ESCAPE_INPUT_ACTIVE != 0`, `BATTLE_ATB_PROGRESSION_ACTIVE != 0`, no
pause and no action-execution lock in the same native pulse. Its 11-slot ATB
hash changed from `0x518644DB` to `0x177589DC`. Party gauges were already full,
but the single enemy had just acted, so the changing all-slot hash confirms
that hidden enemy ATB continued to refill while escape was held.

An earlier diagnostic capture combined escape input with
`BATTLE_ACTION_EXECUTION_ACTIVE != 0`; all slot hashes stayed equal. The freeze
was caused by action execution, not escape. See
[[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]].

## Cannot-Escape Sources

The authoritative no-escape gate is `ENCOUTER_BATTLE_FLAG & 0x01`. It can come from:

- field or world script setup before battle,
- encounter battle flags merged during init,
- monster AI opcode `0x17`, which can toggle the same bit after battle start.

This means a battle can become escapable or non-escapable after the initial handoff from [[projects/re-ff8/concepts/encounter-to-battle-handoff]].

## Roll Cadence And RNG

- Escape rolls only once every `60` held frames.
- Success uses `isRandomProbaNumDen255(...)`, which consumes the same battle RNG state documented in [[projects/re-ff8/concepts/battle-state-model]].
- Opening state and enemy metadata pick the exact numerator (confirmed static, denominator always `255`):

| Condition (`BACK_PREEMTIVE_INFO` / enemy state) | Numerator /255 |
| --- | --- |
| `BACK_PREEMTIVE_INFO` 1 or 2 | 16 |
| `BACK_PREEMTIVE_INFO` 3 or 4 | 255 (guaranteed) |
| default, no escapable enemies present | 255 |
| default, enemy with flag `0x10` at `+254` | 16 |
| default, no enemy with flag `8` at `+254` | 64 |
| default, enemy with flag `8` present | 128 |

The roll only fires when at least one party slot is status-eligible. This closes the earlier open item about which enemy metadata bits select the normal-battle thresholds; the residual is only the physical-record meaning of the `+254` enemy bits.

### P0.9 typed request and fail-closed classifier

The replacement core emits a typed `EscapeRequest`: blocked encounters produce
`Blocked`; verified thresholds produce `Roll(numerator)`; and an unavailable
probability classifier produces a deferred event without consuming RNG.

The current canonical image exposes `BACK_PREEMPTIVE_INFO`, so values `1..4`
are directly classifiable. It does not yet carry the normal-encounter enemy
metadata needed for the default `16/64/128/255` split above. P0.9 therefore
defers when that byte is `0` rather than inventing a numerator. A 60-pulse live
ownership run observed one such deferred request and preserved the RNG cursor.
This is implementation safety, not a correction to the native probability
table.

See
[[projects/final-fantasy-viii-reimaginated/references/p0-9-g06-ownership-validation]].

## Success Finalization

`BattleTick_CheckEscapeSuccess` (`0x4862A0`) does not immediately trust `BATTLE_ESCAPE_STATE == 1`. It requires `BATTLE_RESULT_CODE == 0`, no blocking queued action, and ≥1 status-eligible party slot, then:

1. fires **relay `0x70`** (the camera/presentation barrier — see [[projects/re-ff8/concepts/enemy-ai-vm]]) and `BattleState_SetPhaseFlag(10)`,
2. displays the "escaped" misc-text and waits,
3. fires **relay `0x74`** (`sub_502F90`): the escape exit presentation — plays the run SFX `BdPlaySy(21,…)` and resets all actor presentation states ("run off-screen"), and sets `battle_to_update_flags_dword_1D96A9C |= 0x80`,
4. sets `BATTLE_RESULT_CODE = 2`,
5. calls `BattleEnd_DistributeXpAp()`,
6. sets `BATTLE_END_TYPE = 2`,
7. registers the `Battle_EndSetTransitionTimer` callback.

Relay `0x74` is the exact dispatcher edge after relay `116` that was previously open: it is `BattleTaskQueue_Dispatch` case `'t'` → `sub_502F90`.

## Transition And Cleanup

Escape uses a dedicated `40`-frame transition countdown, then `BattleEscape_BeginTransition` (`0x47DF60`) sets `BATTLE_ESCAPE_STATE = 2`, disables pause (`CAN_BATTLE_BE_PAUSED = 0`) and active battle AI (`AI_BATTLE_ACTIVE_FLAG = 0`), clears party GF-summoning (`status_2 & 0x80000000`), and enqueues UI cleanup.

The next tick enters `Battle_EndCleanupAndTransition` (`0x4868C0`). It first runs **result-independent** work: persists party HP/status back to save-side structures (clearing `status_1 & 0x20`) and **merges the `EQUAL_ITEM` buffer into the save inventory** — so mid-battle item gains are kept even on escape. It then switches on `BATTLE_RESULT_CODE`:

| `BATTLE_RESULT_CODE` | Meaning | Counter | `mode_StateGlobal` |
| --- | --- | --- | --- |
| 1, 3 | game-over family | `++SG_UNUSED_IN_FIELD_1` | `100` |
| 2 | **escape** | `++SG_BATTLE_ESCAPED` | `5` |
| 4 | **victory** | `++SG_BATTLE_VICTORY_COUNT` | `5`, or `100` if `battle_flags & NO_EXP_SCREEN` |
| 5 | special | — | `100` |

### Mode-5 Is Shared With Victory

`mode_StateGlobal = 5` is **not escape-specific**. It is the common standard post-battle transition mode used by both escape (result 2) and ordinary victory (result 4 without `NO_EXP_SCREEN`). Escape and victory diverge only in:

- the persisted counter (`SG_BATTLE_ESCAPED` vs `SG_BATTLE_VICTORY_COUNT`),
- victory's optional divert to mode `100` when `NO_EXP_SCREEN` is set,
- reward accrual keyed off the result code (escape yields no spoils).

The shared cleanup (HP/status persist + item-buffer merge) is byte-for-byte identical between escape and victory. Mode `100` is the direct field-return/no-results path used by the game-over family, the special result, and `NO_EXP_SCREEN` victories.

## Related

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-9-g06-ownership-validation]]

## Runtime-Pending

- Confirm the real run-input button combination.
- Verify whether the blocked "cannot escape" message is rate-limited or repeated every frame while the input is held. (Static note: `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING` is re-cleared every frame at the top of the poll, so the "can't escape" pending bit is re-set each held frame.)^[ambiguous]
- Confirm whether escape-mode `BattleEnd_DistributeXpAp()` actually commits or only packages reward data for the later mode-5 consumer.^[ambiguous]
- ~~Confirm the exact dispatcher edge into the escape-transition helper that follows relay `116`.~~ **Closed 2026-06-13 (static):** relay `0x74`/`116` → `BattleTaskQueue_Dispatch` case `'t'` → `sub_502F90` (run SFX + actor exit animation).
- Counter-delta / back-to-back residual-flag table — the logic is static, but exact persisted deltas across a real escape→re-encounter still want a paired live run.^[ambiguous]
