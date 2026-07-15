## Task: Clarify GF Charge Absorption

### Setup For You

- Start in an active battle where a party member can summon a GF without immediately ending the fight.
- Use enemies that can hit the summoner during the GF charge window, or prepare a controlled enemy action.
- Snapshot party slots and GF slots `8..10` before summon, during charge, and after damage lands.
- Keep the summoner alive and avoid killing all enemies before the GF charge behavior is observed.

### Context

During GF summoning, damage can be redirected from the summoner to a GF slot, and the GF can be KO'd before the summon resolves. The slot layout reserves slots `8..10` for GF-related battle state, but the exact redirection and KO behavior still needs confirmation.

### Known Anchors

- `BATTLE_SLOT_DATA` base `0x1D27B10`, stride `0xD0`.
- Slots `8..10`: GF-related slots used during summoning / absorption mechanics.
- `status_2` bit `0x80000000`: GF Summoning.
- `Battle_ApplyDamageOrHeal` at `0x494410`.
- `BattleStatus_ApplyAndSyncSlot` at `0x493840`.
- `BattleGF_LoadCallbackByMagicID` at `0x50AF20`.
- GF command pending bytes use command `0x03` and kernel GF ID as `command_arg`.

### Investigation Steps

1. Find where slots `8..10` are populated for a summoning character.
2. Identify the link between party slot and GF slot.
3. Trace `Battle_ApplyDamageOrHeal` when the target party slot has GF Summoning status.
4. Confirm whether damage is redirected before mitigation, after mitigation, or only at HP apply time.
5. Determine how GF KO cancels or alters the pending summon.
6. Record how GF HP is initialized and whether it persists across battles or comes from save data.

### Runtime Evidence Plan

- Start a GF summon, pause before resolution, and snapshot party slot plus GF slots `8..10`.
- Break on `0x494410`, `0x493840`, and `0x50AF20`.
- Force enemy attacks into the summoner during charge and compare HP deltas on party and GF slots.

### Expected Output

1. GF slot population table with offsets used.
2. Party-to-GF slot link mechanism.
3. Damage redirection flow with function addresses.
4. GF KO behavior and state cleanup.
5. Suggested tests for `ff8re` Tier 3 injection.
