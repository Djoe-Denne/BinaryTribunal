---
title: Escape Mechanics Investigation
summary: Static IDA reconstruction of battle escape input, cannot-escape sources, escape RNG, and the success-to-exit transition, with explicit live-runtime blockers called out.
tags: [ff8, battle-system, reverse-engineering, runtime-memory, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_escape_mechanics.md
  - docs/tech/systems/battle_init.md
  - docs/tech/systems/encounter_trigger.md
  - docs/tech/systems/enemy_ai_vm.md
  - docs/product/battle.md
provenance:
  extracted: 0.78
  inferred: 0.14
  ambiguous: 0.08
---

# Escape Mechanics Investigation

This staging note extends [[projects/re-ff8/concepts/battle-lifecycle]], [[projects/re-ff8/concepts/atb-and-command-menu]], [[projects/re-ff8/concepts/battle-state-model]], and [[projects/re-ff8/references/battle-address-catalog]] with the escape-specific path that is still missing from the distilled wiki.

## Confirmed Static Chain

### 1. Escape input latch in the battle UI

- `isBattle_HUDdisplay` (`0x4A84E0`) updates two globals before `domain::BattleATB_TickAndReady()` runs:
  - `BATTLE_ESCAPE_INPUT_ACTIVE` becomes `1` while `(*(_BYTE *)(input_ctx + 16) & 3) == 3`.
  - `BATTLE_ESCAPE_HOLD_FRAMES` increments once per frame while that condition holds, else resets to `0`.
- `BattleUI_GetEscapeInputActive()` is only a getter for `BATTLE_ESCAPE_INPUT_ACTIVE`.
- `BattleUI_GetEscapeHoldFrames()` is only a getter for `BATTLE_ESCAPE_HOLD_FRAMES`.

This means the battle UI exposes escape as a held-input state plus a hold-duration counter, not as a queued command entry.

The exact physical button mapping behind `(*(_BYTE *)(input_ctx + 16) & 3) == 3` was not validated live in this pass.^[ambiguous]

### 2. Poll / roll function

- `domain::BattleEscape_PollInputAndRollChance()` is the core escape poll routine reached from the ATB/UI frame path.
- It always clears `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING` first, then reads the current held-input latch from `BattleUI_GetEscapeInputActive()`.
- If input is not active:
  - `BATTLE_ESCAPE_STATE` resets to `0`, unless it is already `2`.
- If input is active:
  - `ENCOUTER_BATTLE_FLAG & 0x01` immediately sets `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING = 1`.
  - otherwise the function only rolls once every `60` held frames (`BATTLE_ESCAPE_HOLD_FRAMES % 60 == 0`).
  - on a successful roll it sets `BATTLE_ESCAPE_STATE = 1`.

The global `BATTLE_ESCAPE_STATE` behaves as a small escape state machine:

- `0` = idle / no pending escape result,
- `1` = escape success armed, waiting for end-check finalization,
- `2` = escape transition already in progress.

That state interpretation is backed by all current xrefs (`0x486130`, `0x4862A0`, `0x47CCB0`, `0x47DF64`).

### 2b. Presentation latch around the held-input state

During the active tick, `main::FFBattleDirector_battleLoop` compares:

- `BATTLE_ESCAPE_INPUT_LATCH`
- `BATTLE_ESCAPE_INPUT_LATCH_PREV`

When they differ and `BATTLE_ESCAPE_STATE != 2`, it dispatches:

- relay `108` when the latch becomes active,
- relay `109` when the latch becomes inactive.

Then it copies `BATTLE_ESCAPE_INPUT_LATCH` into `BATTLE_ESCAPE_INPUT_LATCH_PREV`.

This is the confirmed presentation-side hook for entering/leaving the run state. The exact on-screen effect looks like start/stop escape presentation or actor motion, but that visual meaning still needs live confirmation.^[inferred]

### 3. Cannot-escape sources

`ENCOUTER_BATTLE_FLAG` bit `0x01` is the authoritative static "cannot escape" gate checked by the escape poll path.

Confirmed writers / sources:

- `SCRIPT_BATTLEMODE` (`0x523235`) writes the popped script value directly into `ENCOUTER_BATTLE_FLAG`.
- `SCRIPT_BATTLE` (`0x523294`) also pops a flags value into `ENCOUTER_BATTLE_FLAG` before requesting battle transition.
- `main::FFBattleDirector_battleLoop` (`0x47CCB0`) merges `CURRENT_ENCOUNTER_DATA_SCENE_OUT.battle_flags` into `ENCOUTER_BATTLE_FLAG` during battle init.
- Monster AI opcode `0x17` / `SET_ESCAPE` directly toggles the same bit inside `domain::EnemyAI_VM_ExecuteScript`:
  - `0x48992F`: `or byte ptr ENCOUTER_BATTLE_FLAG, al`
  - `0x48993A`: `and word ptr ENCOUTER_BATTLE_FLAG, 0xFFFE`

So "cannot escape" can come from:

1. field/world script setup,
2. scene-out battle flags merged at init,
3. AI script mutation after battle start.

This is important because a battle can start escapable and later become non-escapable, or the reverse, through monster AI.

## Escape RNG

### Roll cadence

- Escape does **not** roll every frame.
- `domain::BattleEscape_PollInputAndRollChance()` only evaluates success every `60` held frames while the escape input remains active.

### Probability source

- Success uses `isRandomProbaNumDen255(numerator, 255)`.
- `isRandomProbaNumDen255` converts the numerator to a `0..255` threshold and compares it against `(unsigned __int8)domain::Battle_GetRandomInt()`.
- `domain::Battle_GetRandomInt()` indexes into `RANDOM_NUMBER_LIST` using `RELATED_TO_RANDOM_NUMBER_INDEX2` / `RELATED_TO_RANDOM_NUMBER_INDEX1`.

So the escape check consumes the same battle RNG stream used elsewhere in battle logic, not a standalone escape-specific RNG.

### Numerator selection

`domain::BattleEscape_PollInputAndRollChance()` chooses the numerator like this:

- `BACK_PREEMTIVE_INFO` `1` or `2` -> `16/255`
- `BACK_PREEMTIVE_INFO` `3` or `4` -> `255/255`
- normal battle start type -> scan live enemies:
  - if any active enemy has monster-info flag `0x10` at offset `+0xFE`, numerator = `16/255`
  - else if any active enemy has monster-info flag `0x08` at offset `+0xFE`, numerator = `128/255`
  - else numerator = `64/255`

Because `BACK_PREEMTIVE_INFO` is initialized by `Battle_InitPreemptiveBackAttackStatus`, this yields:

- back-attack openings -> escape is hard (`16/255`)
- favorable/preemptive openings -> escape is guaranteed (`255/255`)
- normal openings -> enemy metadata chooses among hard / medium / easier tables

The exact semantic names of monster-info flags `0x08` and `0x10` at offset `+0xFE` are still unresolved in current docs, so they should stay unnamed for now.^[ambiguous]

## Eligibility and success finalization

### Party eligibility

Escape finalization still requires at least one eligible party member.

`domain::BattleTarget_IsEligibleByStatus(slot)` rejects:

- `status_1 & 0x0005` (Death or Petrify),
- `status_2 & 0x4009` (Sleep, Stop, or the unresolved `0x4000` bit),
- `flag_data` bit 14 set (untargetable / hidden from target selection).

### Success check

`domain::BattleTick_CheckEscapeSuccess` (`0x4862A0`) does not immediately trust `BATTLE_ESCAPE_STATE == 1`.

It first scans internal per-slot state arrays and only continues once they are back at idle sentinels (`0xFF`, `0xFF`, `3`). The exact subsystem behind those sentinels was not fully named in this pass, but the effect is clear: escape waits until the battle loop sees a safe idle point before resolving.^[inferred]

When the check passes, it performs this sequence:

1. `BYTE2(TARGET_SLOT_ID) = 1`
2. `BattleEvent_ActivateTargetRelay(112, 0x80, 0)`
3. `BattleState_SetPhaseFlag(10)`
4. show `BattleText_GetMiscText(1)` with wait `8 * SG_BATTLE_MESSAGE_SPEED_SETTING + 8`
5. `BattleEvent_ActivateTargetRelay(116, 0x80, 0)`
6. `BATTLE_RESULT_CODE = 2`
7. `BattleEnd_DistributeXpAp()`
8. `BATTLE_END_TYPE = 2`
9. `BattleEvent_SetTargetableCallback(Battle_EndSetTransitionTimer)`

## Failure and blocked paths

### Failed probability roll

On a failed roll:

- `BATTLE_ESCAPE_STATE` stays `0`
- `BATTLE_RESULT_CODE` stays `0`
- no transition countdown is armed
- no battle-end callback is registered

The active tick then continues through:

- pending-action transfer,
- enemy counters,
- arbitration,
- action resolution,
- status expiry,
- deferred callbacks,
- file callbacks / input-texture upload.

No ATB reset, queue clear, or enemy-turn skip was found in the failure path functions traced here. Static evidence therefore says a failed escape attempt is mostly silent and battle continues normally.

### Blocked by cannot-escape

If `ENCOUTER_BATTLE_FLAG & 0x01` is set while the escape input is held:

- `domain::BattleEscape_PollInputAndRollChance()` sets `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING = 1`
- later in `main::FFBattleDirector_battleLoop`, the active tick enqueues misc text `4`

That is the confirmed static source of the "cannot escape" feedback path.

Whether the message is deduplicated, throttled, or re-enqueued every frame while the input remains held was not verified without live runtime observation.^[ambiguous]

## Transition out of battle

### Escape transition timer

`Battle_EndSetTransitionTimer` (`0x47DFC4`) sets:

- `40` frames for `BATTLE_END_TYPE = 2` (escape)
- `60` frames for wipe/timer style exits
- `30` or `60` for victory variants

So escape uses a shorter dedicated transition window than other common battle ends.

### Countdown -> cleanup -> module exit

Inside `main::FFBattleDirector_battleLoop`:

1. active tick decrements `BATTLE_TRANSITION_COUNTDOWN` each frame once armed
2. when the countdown reaches `0`, the outer `if (BATTLE_TRANSITION_COUNTDOWN)` branch no longer runs
3. the loop sets `mode3_subsub_step = 2`
4. next battle tick enters `domain::Battle_EndCleanupAndTransition`

`domain::Battle_EndCleanupAndTransition` then:

- saves party HP/status back to save data,
- clears battle-only status bit `0x20`,
- returns stored item deltas,
- increments `SG_BATTLE_ESCAPED`,
- sets `mode_StateGlobal = 5` for escape,
- stops all SFX,
- resets battle animation state.

After that, the outer battle loop's `case 5` runs the shared post-battle mode and then advances to `mode_StateGlobal = 100`.

### Escape-transition helper

`linkedToSummonGF` (`0x47DF64`) is still named conservatively in the current IDB, but now has a clarifying comment. Its body clearly does all of the following:

- clears `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING`
- sets `BATTLE_ESCAPE_STATE = 2`
- sets `BYTE1(TARGET_SLOT_ID) = 1`
- disables battle pause
- disables active battle AI
- clears `status_2 & ~0x80000000` (GF summoning) across party slots

This strongly suggests a dedicated "escape transition active" helper, even though the exact event-table linkage from relay `116` to this helper was not resolved in the current static pass.^[inferred]

## Reward path note

One subtle point is now confirmed statically:

- successful escape **does** call `BattleEnd_DistributeXpAp()` before cleanup.

What remains unresolved is whether the resulting XP/AP values are later surfaced or committed on the escape path exactly as on victory. The current pass did not continue through the full mode-5 reward consumer, so escape rewards should remain documented cautiously until verified live.^[ambiguous]

## IDA updates applied

These annotations were applied to the current IDB:

- `sub_486130` -> `domain::BattleEscape_PollInputAndRollChance`
- `sub_4A71B0` -> `BattleUI_GetEscapeInputActive`
- `getDword_1D6D638` -> `BattleUI_GetEscapeHoldFrames`
- `UNKNOWN` (`0x1D28DE8`) -> `BATTLE_ESCAPE_STATE`
- `byte_1D74E98` (`0x1D74E98`) -> `BATTLE_ESCAPE_INPUT_ACTIVE`
- `dword_1D6D638` (`0x1D6D638`) -> `BATTLE_ESCAPE_HOLD_FRAMES`
- `byte_1D28DED` (`0x1D28DED`) -> `BATTLE_ESCAPE_INPUT_LATCH`
- `byte_1D28DEE` (`0x1D28DEE`) -> `BATTLE_ESCAPE_INPUT_LATCH_PREV`
- `RELATED_CANT_ESCAPE` (`0x1D27B0D`) -> `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING`
- comments were added at `0x486130`, `0x4862A0`, `0x47DF64`, `0x489928`, `0x1D28DE8`, `0x1D27B0D`, `0x1D74E98`, and `0x1D6D638`
- simple types were applied to the escape-state globals and getter signatures

`linkedToSummonGF` deliberately was **not** renamed. Its body looks escape-specific, but the final dispatcher linkage is still not fully proven.^[inferred]

## Runtime blocker

Live validation is blocked in the current MCP session:

- the available `user-ida-pro-mcp` tool set exposes static IDB analysis only,
- no `dbg_*` debugger tools are currently exposed here,
- so I could not run repeated flee attempts, set live watchpoints, or confirm real-time writes on:
  - `ENCOUTER_BATTLE_FLAG`
  - `BATTLE_RESULT_CODE`
  - `BATTLE_END_TYPE`
  - `BATTLE_TRANSITION_COUNTDOWN`
  - battle RNG state indices

That leaves four exact live-only follow-ups:

1. confirm the physical button combination behind `(*(_BYTE *)(input_ctx + 16) & 3) == 3`
2. verify whether the blocked "cannot escape" message is rate-limited
3. verify whether escape actually commits/displays XP/AP
4. confirm the event-table route from relay `116` into the helper currently named `linkedToSummonGF`

## Related

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/re-ff8/references/research-prompt-backlog]]
