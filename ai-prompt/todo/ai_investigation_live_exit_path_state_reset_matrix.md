> **Complexité d'investigation : 3/5 (Moyenne-élevée) — live.** Matrice d'état transitoire × 5 familles de sortie + contrôle de carry-over sur 2 combats consécutifs. La chaîne de cleanup est déjà mappée statiquement ; la difficulté est surtout la **reproduction** des 5 sorties (party wipe / timer expiry / scripted end pas triviaux à déclencher) et le watch multi-frame.

## Task: Build Live Exit-Path Transient State Reset Matrix

### Setup For You

- Prepare reproducible battles for five exits: victory, escape, party wipe, timer expiry, scripted end.
- Keep debugger attached and pause at first result latch, then at cleanup entry, then at field/world return.
- Use `binaryTribunal` watch sets for pending/exec/menu/action globals and critical slot ranges.
- Ask the user to trigger specific exit conditions when scripted setup is not injectable.

### Context

The cleanup chain is statically mapped, but closure requires live proof of final zero/nonzero states for transient battle buffers per exit family.

### Known Anchors

- `main::FFBattleDirector_battleLoop` at `0x47CCB0`.
- `domain::Battle_EndCleanupAndTransition` at `0x4868C0`.
- Queue clear helpers near `0x485EC0`.
- Result/phase globals: `BATTLE_RESULT_CODE`, phase flags, pending/exec/menu state.

### Investigation Steps

1. For each exit family, snapshot transient state at active tick just before result latch.
2. Capture writes at latch, transition start, cleanup body, and post-cleanup return.
3. Produce per-exit final-state rows for pending buffer, exec queue, menu pending bytes, action globals, and key slot transient bytes.
4. Mark shared reset writes vs exit-specific writes.
5. Verify whether any stale transient state survives into the next encounter.

### Runtime Evidence Plan

- Use write-watch bundles and timed snapshots keyed by phase transitions.
- Run two consecutive battles after each tested exit type to detect carry-over.
- Keep one canonical trace per exit family with address/value timeline.

### Expected Output

1. Exit-path reset matrix (address/value/state) with five exit families.
2. Confirmed list of fields that must be reset for replacement safety.
3. Identified exit-specific behavior (if any).
4. Confidence labels by field.
5. Merge-ready update for lifecycle and state-model docs.
