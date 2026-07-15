> **Complexité d'investigation : 2/5 (Moyenne) — live.** Bien cadré et largement mécanique : breakpoints sur `0x484D20`/`0x4847F0`, un confirm par famille (7), dump d'octets → table de vérité. Des captures existent déjà (`evidence/..._PENDING_EXEC_AUTHENTIC_BYTES_*`). Surtout de l'exécution répétable, peu d'incertitude.

## Task: Capture Authentic Pending/Exec Bytes By Command Family

### Setup For You

- Start from active battle with debugger attached and game paused.
- Use `ff8re`/`binaryTribunal` to arm breakpoints and dump memory around pending/exec structures.
- Ask the user to perform one command confirm at a time (Attack, Magic, Item, Draw Cast, Draw Stock, GF, Limit initial confirm).
- After each manual confirm, resume only until the next transfer/write breakpoint, then pause immediately.

### Context

Static mapping is strong, but several command-family byte claims are still based on reconstruction rather than authentic menu-produced runtime bytes. This prompt closes that gap with raw captures.

### Known Anchors

- `domain::BattlePendingAction_Write` at `0x484D20`.
- `domain::BattlePendingAction_TransferToExecQueue` at `0x4847F0`.
- Pending buffer base: `0x1D28D44` (stride `0x08`, 3 entries).
- Exec queue bytes/target masks around `BATTLE_EXEC_QUEUE_BYTES` and `BATTLE_EXEC_QUEUE_TARGET_MASKS`.
- `domain::BattleAction_GetText` command-family decode path.

### Investigation Steps

1. For each command family, arm breakpoints at `0x484D20` and `0x4847F0`.
2. Ask the user to perform exactly one menu-confirm action.
3. On `0x484D20`, dump pending entry bytes (`+0..+7`) and relevant globals (`COMMAND_TYPE_ID`, `CURRENT_CMD_ID`, `ATTACKER_SLOT_ID`).
4. On `0x4847F0`, dump resulting exec bytes and target-mask cells.
5. Repeat for Attack, Magic, Item, Draw Cast, Draw Stock, GF, and one Limit initial confirm.
6. Build a truth table of command ID, arg bytes, aux bytes, and target-mask encoding per family.

### Runtime Evidence Plan

- Prefer `binaryTribunal` scripted capture blocks for deterministic dumps.
- Use `ff8re` helpers to snapshot slot/action globals before and after each confirm.
- Require byte-level readback artifacts (hex + address + timestamp/frame index).

### Expected Output

1. Authenticated pending-byte and exec-byte table by command family.
2. Correction list for any mismatched static assumptions.
3. Verified Draw Cast vs Draw Stock aux-byte semantics.
4. Confidence labels (`confirmed`, `inferred`, `ambiguous`) per field.
5. Merge-ready updates for command-pipeline reference docs.
