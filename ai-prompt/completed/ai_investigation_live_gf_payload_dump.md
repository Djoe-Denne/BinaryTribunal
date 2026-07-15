> **Complexité d'investigation : 2/5 (Moyenne) — live.** Bien cadré et répétitif : déclencher quelques GF (Doomtrain + 2), dumper les payloads avant/après et les deltas HP/statut. Surtout du dump observationnel ; faible incertitude. Pas ISO-bloquant pour la boucle de combat (parité de payload GF de support).

## Task: Dump Unresolved GF Runtime Payloads (Including Doomtrain Debuff Mask)

### Setup For You

- Enter battle with selectable GF actions and debugger attached at active tick.
- Use `ff8re`/`binaryTribunal` injection to trigger chosen GF commands reproducibly.
- Ask the user to confirm summon actions only when menu-driven setup is required.
- Keep target HP high enough to survive repeated summon payload captures.

### Context

GF chain topology is mostly mapped, but several runtime payload fields remain unread or only inferred, notably full debuff masks for support/status-oriented GFs.

### Known Anchors

- GF callback pointer region and cinematic dispatch path.
- GF resolve/store path near `domain::BattleGF_ResolveAndStoreTargetDamage`.
- Shared action globals (`CURRENT_CMD_ID`, command arg, target mask) at resolve boundaries.
- Slot status/HP deltas in `BATTLE_SLOT_DATA` before/after GF application.

### Investigation Steps

1. Select unresolved GF set (minimum: Doomtrain + two other partially unresolved entries).
2. For each GF, capture action globals at dispatch and resolve entry.
3. Dump relevant payload buffers/structs before and after GF apply.
4. Record exact status/HP/flag deltas on all affected slots.
5. Map command arg -> payload -> observable effect for each sampled GF.

### Runtime Evidence Plan

- Per-GF trace packet: dispatch snapshot, resolve snapshot, post-apply snapshot.
- Include raw bytes and interpreted fields where possible.
- Repeat each GF at least twice to validate payload stability.

### Expected Output

1. Runtime payload dump set for unresolved GFs.
2. Confirmed Doomtrain full debuff mask (or narrowed alternatives with evidence).
3. Command-arg to payload semantics table.
4. Proposed IDA names for newly clarified GF handlers.
5. Merge-ready GF catalog/cinematic doc updates.

---

## RESULTS — CLOSED (2026-06-15)

Status: **CLOSED**. Live runtime payload dumps captured for three GFs (Alexander,
Cerberus, Doomtrain), each run twice / staged. All values captured against a live
debugger at the action-resolution boundary `BattleAction_ResolveAndApplyDamage`
(`0x48FE20`).

### Test harness used

- `ff8re/tests/tier3_inject/GF_ALEXANDER_001.yaml` (cmd_arg `0x4A`)
- `ff8re/tests/tier3_inject/GF_CERBERUS_001.yaml`  (cmd_arg `0x49`)
- `ff8re/tests/tier3_inject/GF_DOOMTRAIN_001.yaml` (cmd_arg `0x4B`)

Injection bytes follow `mask(2) attacker(1) cmd_id(1) cmd_arg(1) .. active(1)` with
`cmd_id=0x03`, `target_mask=0x8008`. Evidence JSON written under `evidence/`:
`2026-06-15T16-20-14_GF_ALEXANDER_001.json`,
`2026-06-15T16-24-56_GF_CERBERUS_001.json`,
`2026-06-15T16-26-28_GF_ALEXANDER_001.json` (with action globals),
plus the Doomtrain run.

### Confirmed payload table (action globals at resolve)

At `0x48FE20` the resolver populates these globals from the kernel table selected by
`COMMAND_TYPE_ID`. For GFs `COMMAND_TYPE_ID = 0xFE (254)` and
`CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID = cmd_arg` (the kernel index is `cmd_arg - 0x40`,
e.g. Alexander `0x4A → GF #10`).

| GF        | cmd_arg | COMMAND_TYPE_ID | action_id (raw) | HIT_STATUS_1 | HIT_STATUS_2 | Observable effect |
|-----------|---------|-----------------|-----------------|--------------|--------------|-------------------|
| Alexander | 0x4A    | 0xFE            | 0x4A (74)       | 0x0000       | 0x00000000   | Holy damage ~3600–4000, **no status** |
| Cerberus  | 0x49    | 0xFE            | 0x49 (73)       | 0x0000       | 0x00060000   | **Double + Triple** on all allies (slots 0–2), no damage |
| Doomtrain | 0x4B    | 0xFE            | 0x4B (75)       | 0x003A       | 0x0100540D   | Berserk, Darkness, Doom, Petrify, Poison, Silence, Sleep, Slow, Stop, Vit 0 on enemies |

Damage variance proves a per-target random spread (Alexander: slot3 −3846/−4011,
slot4 −3774/−3594 across two runs). Cerberus applies `HIT_STATUS_2=0x00060000`
(Double+Triple) confirmed both by the action global and by slot status deltas on all
three allies. Doomtrain's raw masks `HIT_STATUS_1=0x003A` / `HIT_STATUS_2=0x0100540D`
decode to the 10-status debuff set above (slot-diff decode).

### Per-slot action record

Each enemy slot stores the last action it received. After an Alexander hit the slot's
record contains `... FE 80 01 00 4A ...` = `COMMAND_TYPE_ID=0xFE`, mask bytes,
`cmd_arg=0x4A`. This is the runtime echo of the dispatched GF descriptor.

### Callback pointer

`GF_CALLBACK_PTR` (`0x21DFEC4`) holds the idle battle callback (~`0x61C0E0`/`0xB0xxxx`
between runs) and is swapped to the active GF tick routine (Alexander `~0xAFFxxx`)
while the cinematic plays, then restored. `cameraRelated`/sequence-context pointers
`0x1D96AAC`, `0x1D99A50` are non-null during the GF sequence.

### Framework fix (important, reusable)

`binaryTribunal/mcp_client.py::resolve_global_addr` used
`ida_name.get_name_ea_simple`, which **does not exist** in the IDA 9 / Python 3.13
runtime, so every named-global read (`read_action_globals`, `read_phase_flags`,
`read_elemental_globals`) silently failed with "Resolved global address ... was 0x0".
Switched to `idc.get_name_ea_simple`. This is what unblocked the `HIT_STATUS_*`
capture above; it now works for all named-scalar reads.

Also dropped the broken `read_stack_args` step from the custom dump YAML: the MCP
`dbg_regs_named` tool rejects a list of register names ("expected str, got list").

### Key methodology note (enemy interference during the invocation delay)

The summon is **not instantaneous** — there is an invocation/charge delay before the
cinematic dispatches (observed ~30 s of unpaused logic between arbitration and
`GF_CINEMATIC_TICK 0x50B2A0`). During that window the enemy can take a turn and hit
the generic `APPLY_DAMAGE 0x494410` path. A capture must therefore wait **only on
GF-specific anchors** (`GF_CINEMATIC_TICK`, the per-GF `*_entry`/`*_tick`/`*_counter_inc`)
for the first hop, never on the generic resolve/apply, otherwise an enemy attack
satisfies the wait and contaminates the capture. The proven `GF_*_001.yaml` tests
already follow this pattern; once the GF cinematic is in progress the action latch
blocks other actors, so the subsequent `RESOLVE_AND_APPLY`/`APPLY_DAMAGE` belong to
the GF.

### Remaining minor gap

`CURRENT_SLOT_ID_TURN` is the only action global still **not named** in the current
IDB (resolves to BADADDR → non-fatal error string in the dump). All other action
globals (`ATTACKER_SLOT_ID 0x1D27AD8`, `COMMAND_TYPE_ID 0x1D27AD9`,
`CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID 0x1D27AF4`, `HIT_STATUS_1 0x1D2A23E`,
`HIT_STATUS_2 0x1D2A234`) are named and read correctly.
