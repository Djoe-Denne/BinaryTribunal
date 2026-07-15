## Task: Clarify Limit Break Implementations

### Setup For You

- Use an active battle with at least one party member in low HP / crisis state so Limit Breaks are available.
- Keep enemies alive with high HP to observe full multi-hit or multi-step Limit behavior.
- Prepare one save per character-specific Limit Break if possible, especially for Zell, Selphie, Irvine, Quistis, and Rinoa.
- Capture authentic menu selection first before trying any injected command path.

### Context

The command menu can expose Limit Breaks through crisis logic, and the damage pipeline already references Renzokuken fan-out. The per-character Limit Break implementations remain a separate unresolved system: Squall, Selphie, Zell, Irvine, Quistis, and Rinoa Angel Wing.

### Known Anchors

- `BattleLimit_ComputeCrisisAndToggleAttackSlot` at `0x4941F0`; writes `crisis_level` at slot offset `+0xCA`.
- Renzokuken finisher hit handling around `0x48F350`.
- Kernel sections referenced by prior notes:
  - Renzokuken / finishers: kernel section 23.
  - Selphie Slot: kernel section 24.
  - Zell Duel: kernel sections 17 and 25.
  - Irvine Shot: kernel section 22.
  - Quistis Blue Magic: kernel section 18.
  - Rinoa Angel Wing: MagicList effect ID `96`, Berserk-like status path.

### Investigation Steps

1. Start at command-menu Limit Break availability and trace the selected command into pending/action globals.
2. For each character, identify the dispatcher, kernel table reads, UI interaction, and action resolver entry.
3. Document how `crisis_level` affects availability, choice pools, damage, hit count, or special odds.
4. Separate common Limit Break infrastructure from character-specific implementations.
5. Confirm whether Limit Break commands use ordinary pending action entries or special transient globals.
6. For Angel Wing, trace auto-cast selection, stock restrictions, power multiplier, and status cleanup.

### Runtime Evidence Plan

- Break on `0x4941F0`, command confirmation, pending write, and known Limit-specific anchors.
- Capture `crisis_level`, command bytes, action globals, selected move/spell, target mask, hit count, and final damage/status events.
- Run one evidence case per character-specific Limit Break.

### Expected Output

1. Limit Break dispatcher graph.
2. Per-character implementation table with kernel sections and function addresses.
3. Crisis-level effects table.
4. Pending/action record examples for each Limit Break.
5. Recommended split into docs pages if the result is too large for one page.
