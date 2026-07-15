> **STATUS: CLOSED (static, 2026-06-13).** Commit logic fully determined statically; only live counter-delta polish remains.
> - Poll/roll `BattleEscape_PollInputAndRollChance` (`0x486130`): every 60 held frames `isRandomProbaNumDen255(num,255)`, num ∈ {16,64,128,255} from `BACK_PREEMTIVE_INFO`+enemy state; success → `BATTLE_ESCAPE_STATE=1`. Cannot-escape = `ENCOUTER_BATTLE_FLAG & 1`.
> - Finalize `BattleTick_CheckEscapeSuccess` (`0x4862A0`): fires relay `0x70` (camera barrier) + relay `0x74` (run SFX/exit anim, `sub_502F90`), sets `BATTLE_RESULT_CODE=2`, `BATTLE_END_TYPE=2`, arms `Battle_EndSetTransitionTimer`.
> - Cleanup `Battle_EndCleanupAndTransition` (`0x4868C0`): HP/status persist + `EQUAL_ITEM`→inventory merge run for ALL results; switch: 1/3→mode100, **2(escape)→+SG_BATTLE_ESCAPED, mode5**, **4(victory)→+SG_BATTLE_VICTORY_COUNT, mode5 (or 100 if NO_EXP_SCREEN)**, 5→mode100.
> - **Mode-5 verdict:** mode 5 is the post-battle transition mode SHARED by escape and victory; they differ only in counter + reward gating, not the mode value.
> - Evidence: `obsidian-docs/_staging/investigations/live_static_closure_followups_2026-06-13b.md`. Wiki: `concepts/escape-mechanics`.

## Task: Confirm Escape Commit Path And Mode-5 Semantics

### Setup For You

- Start in active battle with escape allowed, then run a second scenario with cannot-escape active.
- Keep game paused with debugger attached; use manual held-input steps when required.
- Use `ff8re`/`binaryTribunal` to capture state at escape poll, success latch, transition begin, and post-battle mode switch.
- Ask the user to hold/release escape input on explicit instruction.

### Context

Escape logic is structurally understood, but exact commit semantics after success (including mode-5 behavior and reward/UI side effects) remain runtime-pending.

### Known Anchors

- `domain::BattleEscape_PollInputAndRollChance` at `0x486130`.
- `domain::BattleTick_CheckEscapeSuccess` at `0x4862A0`.
- `domain::BattleEscape_BeginTransition` at `0x47DF60`.
- Transition scheduling path via `domain::BattleState_SetPhaseFlag` (`0x47E080`).
- Cleanup/commit path through `domain::Battle_EndCleanupAndTransition` (`0x4868C0`).

### Investigation Steps

1. Capture latch-to-success timeline: input latch, hold frames, RNG roll, success state.
2. Prove exact condition that gates transition begin from success state.
3. Trace escape result into `BATTLE_RESULT_CODE`, mode switch, and cleanup chain.
4. Verify whether mode `5` path differs from victory in rewards/display/commit logic.
5. Capture cannot-escape branch behavior and pending message side effects.
6. Compare final persisted counters/flags against victory baseline.

### Runtime Evidence Plan

- Use paired traces: escape-allowed success vs cannot-escape attempt.
- Snapshot result/mode globals and reward counters at each transition boundary.
- Include one back-to-back encounter after escape to detect residual flags.

### Expected Output

1. Escape commit timeline from held input to field/world return.
2. Verified mode-5 semantics relative to victory path.
3. Cannot-escape branch proof with state and message behavior.
4. Counter/flag persistence table.
5. Merge-ready lifecycle/escape docs deltas.
