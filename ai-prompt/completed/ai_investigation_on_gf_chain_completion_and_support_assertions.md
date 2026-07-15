## Task: Complete GF Chains And Improve Support/Status GF Assertions

### Setup For You

- Use an active battle with enemies kept alive for damage GFs and party slots kept clean for support/status GFs.
- For each GF, snapshot pending buffer, party slots, enemy slots, GF slots, status bits, timers, and action globals before injection.
- Use `idc.patch_dbg_byte` for pending-action injection and verify the readback before continuing.
- For support GFs, plan assertions around durable status or party-state changes rather than enemy HP loss.

### Context

The GF catalog and runtime test matrix cover many summon entries, but some entries retain pending runtime status or partial chain classification. Support/status GFs need assertions based on status effects rather than enemy HP decreases.

### Known Anchors

- GF command pending bytes: `08 80 00 03 XX 00 00 01`, where `XX` is kernel GF ID / command arg.
- Confirmed example: Ifrit uses `command_arg = 0x42`.
- `BattleGF_LoadCallbackByMagicID` at `0x50AF20`.
- GF cinematic tick at `0x50B2A0`.
- Boost minigame init at `0x56DCE0`.
- `K_GF_JUNCTIONABLE[action_id - 64]` is used when resolver command type is `0xFE`.
- `GF_CERBERUS_001` validates support GF behavior through party statuses such as Double/Triple.

### Investigation Steps

1. For each GF with partial chain status, identify init, tick, counter, completion, damage/status, and presentation functions.
2. Confirm command args from authentic pending writes or successful Tier 3 injection.
3. Classify GF family only after chain evidence supports the structure.
4. For support/status GFs, identify the durable state effect: status bits, timers, party-wide flags, command modifiers, or UI changes.
5. Update assertions so support GFs do not falsely fail due to no enemy HP decrease.
6. Feed confirmed evidence back into GF catalog, test matrix, and generated domain docs.

### Runtime Evidence Plan

- Use `ff8re` Tier 3 injection hypotheses with breakpoints on GF entry/tick/completion and damage/status functions.
- Snapshot pending buffer, party/enemy/GF slots, status bits, timers, action globals, and final durable effects.
- Compare damage GF, support GF, gravity GF, and atypical GF cases.

### Expected Output

1. GF chain completion matrix.
2. Command arg confidence table.
3. Support/status assertion pattern library.
4. YAML changes needed for weak assertions.
5. Updated docs for GF catalog and runtime test matrix.
