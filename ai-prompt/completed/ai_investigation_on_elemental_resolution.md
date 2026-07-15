## Task: Clarify Elemental Resolution

### Setup For You

- Use an active battle with enemies whose elemental weaknesses or resistances are easy to identify.
- Keep enemy HP high enough that repeated elemental tests do not end the battle early.
- Prepare at least one neutral, weak, resisted, null, and absorb scenario if available.
- Snapshot attacker stats, target `elem_def[8]`, `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, and HP before each test.

### Context

The damage pipeline exposes `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, and per-slot `elem_def[8]`, but the exact multiplier logic for weakness, resist, null, and absorb is not yet isolated. This investigation should explain how attack element metadata interacts with target elemental defense.

### Known Anchors

- `Damage_ComputeRawDeltaFromAttackType` at `0x4922B0`.
- `FF8BattleSlotData_s.elem_def[8]` at slot offset `+0x44`, stored as `int16_t[8]`.
- Kernel metadata fields: magic `element`, item `element`, command ability `Element`, enemy attack `attackElement`, GF `element`.
- Globals in `battle_action_resolve.h`: `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, `ATTACK_FLAG`, `DAMAGE_DEAL`.

### Investigation Steps

1. Find the code that loads kernel element metadata into `HIT_ELEMENT` and `HIT_ELEMENT_PERCENT`.
2. Trace where `target.elem_def[8]` is read during raw damage computation.
3. Determine the exact encoding for neutral, weakness, resistance, null, and absorb.
4. Confirm how multi-element attacks are represented, if they exist.
5. Check whether element handling differs across Magic, Item, GF, enemy attacks, and command abilities.
6. Identify whether absorb reverses damage into healing before or after other damage modifiers.

### Runtime Evidence Plan

- Use controlled attacks against targets with known elemental defenses.
- Watch reads from `target + 0x44` through `target + 0x52`.
- Capture `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, raw delta, final `DAMAGE_DEAL`, and HP side effect.

### Expected Output

1. Element defense encoding table.
2. Exact multiplier formula or branch table.
3. Function/address list for element metadata load and element application.
4. Test cases proving weakness, resistance, null, and absorb.
5. Doc update target: `docs/tech/systems/damage_pipeline.md` and `docs/tech/reference/battle_action_resolve.h`.
