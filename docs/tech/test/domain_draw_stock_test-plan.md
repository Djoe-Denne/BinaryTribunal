# Test Plan: `domain_draw_stock.md`

## Why

Validate Draw count computation and Draw->Stock mutation behavior, including stock cap enforcement.

## What to test

- `Draw_ComputeStealCount` inputs and 0..9 clamp behavior
- Draw->Cast branch behavior vs Draw->Stock branch behavior
- Repeated stock increment loop and cap-at-100 logic via stock mutator
- Failure/full return behavior when stock cannot increase

## How

1. Use Draw on enemies with known magic stock tables.
2. Break in count compute and stock mutation functions.
3. Record computed count, loop iterations, and final stock value.
4. Repeat near stock cap (e.g., 99) to test saturation.

## What to observe

- Count respects attacker/target levels, magic stat, and resist terms.
- Draw->Stock increments one unit per loop iteration up to count or cap.
- Stock never exceeds 100 for a slot/magic pair.

## What to break on

- `Draw_ComputeStealCount` (`0x48FD20`)
- `getText` (`0x48D554`) at Draw command branches
- `sub_486A10` (stock mutation helper)

## What to do in game

- Perform Draw->Stock on same spell multiple times.
- Perform Draw->Cast once to compare branch behavior.
- Test at low stock and near-cap stock.

## In-game startup context

- Save in battle where enemy has draw-able magic.
- Prepare a character with Draw command equipped.
- Watch attacker magic stock table, computed draw count, and branch selector values.
