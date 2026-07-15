## Task: Clarify Timed Status Expiry

### Setup For You

- Use an active battle where you can apply one timed status at a time and safely wait for it to expire.
- Keep the target alive, not petrified or dead, unless the test is specifically about Doom or Gradual Petrify.
- Snapshot `timer[16]`, `status_1`, `status_2`, and their mirror copies immediately before and after status application.
- Let the game run normally between observations so frame/tick cadence can be measured.

### Context

The slot layout has a `timer[16]` region at offset `+0x54`, and status docs identify several status bits, but the per-frame timer tick and expiry side effects remain partially open. This investigation should explain Doom, Gradual Petrify, timed buffs, and any status that decays.

### Known Anchors

- `FF8BattleSlotData_s.timer[16]` at slot offset `+0x54`.
- `status_1` at `+0x80`; `status_2` at `+0x08`.
- `BattleStatus_ApplyAndSyncSlot` at `0x493840`.
- `BattleStatus_UpdateSlotStatusCopy` at `0x47E2D0`.
- Prior notes identify `sub_483470` as a likely timed-status routine.
- Active tick enters through `FFBattleDirector_battleLoop` and `BattleUI_InputPollAndMenuState`.

### Investigation Steps

1. Decompile and rename the timer tick routine, starting from `sub_483470`.
2. Map each `timer[N]` index to a status or battle countdown.
3. Identify timer initialization when a timed status is applied.
4. Trace expiry side effects: bit clear, bit set, HP effect, message/event output, UI sync.
5. Confirm update cadence: every frame, ATB tick, battle second, or animation tick.
6. Compare party, enemy, and GF slots.

### Runtime Evidence Plan

- Apply Doom, Gradual Petrify, Haste/Slow/Protect/Shell if timed, and any known short-duration status.
- Watch writes to `slot + 0x54..0x73`, `status_1`, `status_2`, and mirror copies.
- Capture frame counts and mode state around each decrement or expiry.

### Expected Output

1. Timer index map.
2. Status expiry state machine.
3. Function and global write table.
4. Evidence cases for Doom, Gradual Petrify, and timed buffs.
5. Updates for `docs/tech/reference/status_bits.md` and `docs/tech/systems/status_pipeline.md`.
