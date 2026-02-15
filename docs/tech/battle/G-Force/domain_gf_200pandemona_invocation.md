# 200Pandemona GF Invocation Reconstruction

## Scope

Static reconstruction of Pandemona summon invocation chain and progression semantics from live debug stop at `GF_CALLBACK_PTR` (`0x21DFEC4` -> `0x6ed250`) plus IDA MCP closure analysis.

## High-Level Result

- Entry: `GF_200Pandemona_InvokeSummonScript` (`0x6ed250`)
- Init: `GF_200Pandemona_InitSummonContext` (`0x6ed260`)
- Tick: `GF_200Pandemona_SequenceTick` (`0x6ed350`)
- Driver tick: `GF_200Pandemona_SequenceTaskDriver` (`0x6ed900`)
- Family: `FamilyA`
- Confidence: `high` (95)

## Function Inventory (Pandemona-Specific)

Core chain (GF-specific):

- `GF_200Pandemona_InvokeSummonScript` (`0x6ed250`) — summon entrypoint installed into `GF_CALLBACK_PTR`.
- `GF_200Pandemona_InitSummonContext` (`0x6ed260`) — seeds summon context and schedules the BdLink tick.
- `GF_200Pandemona_SequenceTick` (`0x6ed350`) — per-frame sequence tick (FamilyA / BdLink-based).
- `GF_200Pandemona_SequenceTaskDriver` (`0x6ed900`) — secondary per-frame driver for cinematic/effect timeline.

Helpers (IDA rename coverage exists; addresses not captured in this repo yet):

- `GF_200Pandemona_UpdateTargetCameraSpan`
- `GF_200Pandemona_ClearRenderBatchFlagsA`
- `GF_200Pandemona_ClearRenderBatchFlagsB`

## Confirmed Static Chain

1. `GF_200Pandemona_InvokeSummonScript` dispatches into `GF_200Pandemona_InitSummonContext`.
2. `GF_200Pandemona_InitSummonContext` schedules `GF_200Pandemona_SequenceTick` through `BdLinkTask`.
3. `GF_200Pandemona_SequenceTick` allocates effect task pools and schedules `GF_200Pandemona_SequenceTaskDriver`.
4. `GF_200Pandemona_SequenceTaskDriver` runs the cinematic/effect timeline and returns sequence completion.

## Counter and Completion

- Main sequence increment site: `0x6ed755`
- Main sequence completion site: `0x6ed749` (`return 2`)
- Driver increment site: `0x6f0622`
- Driver completion site: `0x6f06c6` (`mov eax, 2`)

## Internal Progression Sites (Counter/Completion)

These sites are used for deterministic runtime proof that the Pandemona sequence is running (counter increment), and where it signals completion to the BdLink dispatcher (return value 2).

- `GF_200Pandemona_SequenceTick` counter increment: `0x6ed755`
- `GF_200Pandemona_SequenceTick` completion: `0x6ed749` (`return 2`)
- `GF_200Pandemona_SequenceTaskDriver` counter increment: `0x6f0622`
- `GF_200Pandemona_SequenceTaskDriver` completion: `0x6f06c6` (`mov eax, 2`)

## Command Injection (Confirmed)

Pandemona invocation should be accepted by the battle pipeline with:

- `command_id = 0x03` (GF)
- `command_arg = 0x48` (Pandemona kernel GF ID, confirmed by `GF_PANDEMONA_001` action globals at `BattleAction_ResolveAndApplyDamage`)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

## Command Pipeline Struct: `battle_pending_action_entry` (Engine-Side)

The injected command is encoded as an 8-byte pending-action entry in the global pending action buffer (`BATTLE_PENDING_ACTION_BUFFER` at `0x1D28D44`).

Confirmed layout (see `ff8re/battle_state.py` and `docs/tech/battle_state_reconstruction.md`):

```
struct battle_pending_action_entry {
  +0x0  u16 target_mask
  +0x2  u8  attacker_slot
  +0x3  u8  command_id
  +0x4  u8  command_arg
  +0x5  u8  padding (0)
  +0x6  u8  padding (0)
  +0x7  u8  active
};
```

Pandemona injection bytes (entry 0), as used by the tier-3 hypothesis runner:

```
08 80 00 03 48 00 00 01
```

## Action-Resolution Globals (Engine-Side "Attributes")

At damage resolve time, identity is proven by the transient action-resolution globals read by `ff8re` (`read_action_globals`) during `BattleAction_ResolveAndApplyDamage` (`0x48FE20`):

- `COMMAND_TYPE_ID` — expected `0xFE` (254 decimal) for GF actions.
- `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID` — expected to match the injected GF kernel id (`0x48` for Pandemona).
- `ATTACKER_SLOT_ID` — party slot that issued the command (typically 0 for tests).
- `HIT_STATUS_1`, `HIT_STATUS_2` — status payload resolved from kernel tables at resolve time (GF uses `K_GF_JUNCTIONABLE`).

The resolver pseudocode in `docs/tech/battle_action_resolve.c` shows that for GFs, the status payload is populated from `K_GF_JUNCTIONABLE[action_id - 64]` into `HIT_STATUS_1/2`.

## Kernel Data: `KernelGFJunctionable` (Pandemona = `K_GF_JUNCTIONABLE[8]`)

When `COMMAND_TYPE_ID == 0xFE` (GF), the resolver computes:

- `action_id = CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID`
- `gf_index = action_id - 64`

So for Pandemona:

- `action_id = 0x48` (72 decimal)
- `gf_index = 0x48 - 0x40 = 8`
- Kernel row: `K_GF_JUNCTIONABLE[8]`

Struct fields (from `docs/tech/battle_action_resolve.h`):

- `attackType`
- `gfPower`
- `attackFlags`
- `unknown2` (resolver uses this as `HIT_TYPE_TARGET_ANIMATION_TO_PLAY` for GF)
- `element`
- `statusAttackEnabler`
- `statuses0` (feeds `HIT_STATUS_1`)
- `statuses1` (feeds `HIT_STATUS_2`)
- `levelMod`
- `powerMod`

Note: this document does not yet include the concrete values of `K_GF_JUNCTIONABLE[8]` (element/statuses/power). Those can be dumped once the table base and stride are extracted in IDA.

## Pandemona Global State (Known Address Range)

The Pandemona IDA rename pass covered a block of per-GF globals in:

- `0x2556258` .. `0x25562f4` renamed to `GF_200Pandemona_*`

The individual symbol names/roles for that range live in the IDA database; this repo currently records the range as a probe target for runtime "non-zero" context initialization checks.

## Deterministic Runtime Test Reference

Tier-3 injection hypothesis:

- `ff8re/tests/tier3_inject/GF_PANDEMONA_001.yaml`

What it attempts to prove deterministically:

- Injection consumed: `BattlePendingAction_TransferToExecQueue` hit (`0x4847F0`).
- Pandemona sequence running: Pandemona counter increment sites hit (`0x6ed755`, `0x6f0622`).
- Damage pipeline executed: `Battle_ApplyDamageOrHeal` hit (`0x494410`) after cinematic completes.
- Identity at resolve: `read_action_globals` captured at `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) should show `COMMAND_TYPE_ID=0xFE` and `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x48`.
- Outcome: at least one live enemy slot HP decreases (snapshots for slots 3/4/5).

## IDA Rename Coverage

Renamed closure includes:

- Core: `GF_200Pandemona_InvokeSummonScript`, `GF_200Pandemona_InitSummonContext`, `GF_200Pandemona_SequenceTick`, `GF_200Pandemona_SequenceTaskDriver`
- Helpers: `GF_200Pandemona_UpdateTargetCameraSpan`, `GF_200Pandemona_ClearRenderBatchFlagsA`, `GF_200Pandemona_ClearRenderBatchFlagsB`
- Globals in `0x2556258`-`0x25562f4` range renamed to `GF_200Pandemona_*`

## Notes

- This reconstruction is complete for static chain discovery + IDA naming pass.
- Runtime evidence generation is intentionally deferred to deterministic test execution.
- Companion hypothesis test: `ff8re/tests/tier3_inject/GF_PANDEMONA_001.yaml`.
