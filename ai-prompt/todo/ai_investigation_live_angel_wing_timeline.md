> **Complexité d'investigation : 3/5 (Moyenne-élevée) — live.** Timeline set/sustain/clear sur plusieurs tours. Ancres déjà connues ; difficulté = setup Rinoa/Angel Wing + observer ≥2 actions auto pendant l'état actif et capturer l'écrivain + frame exacts du clear. Scénario à plusieurs tours, donc capture longue.

## Task: Capture Full Angel Wing State Timeline (Set, Sustain, Clear)

### Setup For You

- Enter battle with Rinoa/Angel Wing-capable setup and enough turns to observe multiple transitions.
- Keep debugger attached at active tick and ATB/menu readiness boundaries.
- Use `ff8re`/`binaryTribunal` snapshots for `status_2`, `flag_data`, pending bytes, and command globals per frame phase.
- Ask the user to perform exact menu confirms needed to activate/deactivate Angel Wing scenarios.

### Context

Static evidence ties Angel Wing to auto-command and damage behavior, but exact first-write timing and clear-event semantics remain unresolved.

### Known Anchors

- Auto-command processing around `Battle_ProcessAutoCommand`.
- Status write paths through `DoesMentalStatusHit` and status-apply helpers.
- Action prep path `domain::EnemyAI_PrepareTurnAction` at `0x485610`.
- ATB/menu readiness path `BattleATB_TickAndReady` at `0x4842B0`.

### Investigation Steps

1. Capture the first frame where Angel Wing bit is set (`status_2 |= 0x02000000` expected family).
2. Log accompanying writes to ready flags, pending bytes, and command globals.
3. Observe at least two subsequent auto-generated actions while state remains active.
4. Trigger clear/exit condition and capture exact writer + frame timing.
5. Verify interaction with target eligibility and incoming-status immunity while active.

### Runtime Evidence Plan

- Multi-snapshot timeline: pre-activation, set frame, steady-state turns, clear frame.
- Break on candidate writers plus read-only frame sampling at ATB tick.
- Correlate action generation with status/flag transitions.

### Expected Output

1. Angel Wing lifecycle timeline with concrete writer PCs.
2. Set/clear trigger conditions proven in runtime evidence.
3. Command rewrite behavior while active.
4. Remaining uncertainty list (if any) with narrowed scope.
5. Merge-ready ATB/status/damage doc deltas.
