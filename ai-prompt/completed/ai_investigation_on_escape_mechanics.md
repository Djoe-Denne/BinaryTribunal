## Task: Clarify Escape Mechanics

### Setup For You

- Use a normal random encounter first, then repeat with a known cannot-escape or boss-like encounter if available.
- Start inside active battle, before pressing the flee input, with IDA ready to catch input and mode-state writes.
- Keep a save immediately before the encounter so the same flee attempt can be repeated.
- Do not inject commands for the first pass; observe authentic input and battle-loop transitions.

### Context

The battle lifecycle mentions battle end and reward transitions, but escape/flee is still unmapped: flee input, cannot-escape state, RNG, success/fail handling, animation, and transition out of the active battle tick.

### Known Anchors

- `FFBattleDirector_battleLoop` at `0x47CCB0`.
- Active tick state: `mode_StateGlobal == 3`, `mode3_subsub_step == 3`, `mode_3_subsubsubstep == 4`.
- `ENCOUTER_BATTLE_FLAG` at `0x1CFF6E2`; bit `0x01` is associated with cannot-escape setup.
- Battle-end and reward transition are handled after active tick exits.
- Command/input polling enters through `BattleUI_InputPollAndMenuState` at `0x4A8772`.

### Investigation Steps

1. Locate input checks for flee/escape command state during the battle UI frame.
2. Find where cannot-escape state is derived from encounter flags or battle type.
3. Identify the function that rolls escape success/failure and whether it depends on party/enemy stats.
4. Trace success path from active tick to battle-exit state.
5. Trace failure path: message, delay, ATB consequences, and any enemy-turn interaction.
6. Distinguish normal escape, scripted no-escape battles, boss battles, and special event exits.

### Runtime Evidence Plan

- Break on battle UI input polling and state-machine writes during repeated flee attempts.
- Watch `ENCOUTER_BATTLE_FLAG`, mode globals, reward/exit state variables, and any RNG calls.
- Test at least one normal random encounter and one cannot-escape encounter.

### Expected Output

1. Escape state machine from input to success/failure.
2. Cannot-escape source and flag table.
3. RNG formula or branch logic for success.
4. Battle-loop transition map for successful escape.
5. Proposed IDA names and documentation targets.
