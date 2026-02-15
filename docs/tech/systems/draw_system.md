# Draw System

## Draw Quantity

`Draw_ComputeStealCount` (`0x48FD20`) computes draw quantity (0-9) using:
- Attacker level, target level, attacker magic stat
- `K_MAGIC[magic_id].drawResist`
- Randomness

## Draw Paths

`getText` (`0x48D554`) branches on `p_param_is_0_for_ai`:
- `== 9`: Draw→Cast — validates via `Draw_ComputeStealCount`, then casts the spell
- `== 10`: Draw→Stock — computes count and loops stock increments

## Stock Mutation

`sub_486A10` (`0x486A10`) adds one unit at a time to the magic stock for a given slot. Enforces a cap of 100 per magic slot; returns nonzero on failure/full.

## Open Questions

- Is `sub_486A10` the sole stock mutation path across battle/menu/junction contexts?
- Draw→Stock in field likely reuses the same routine — needs confirmation.
