# Final Fantasy VIII — Status Application Pipeline

## Scope

This report reconstructs the domain-side status application flow in FF8 battle, from the moment a hit's status payload is resolved to the final authoritative write on a battle slot.

It combines:

- Existing `RE/tech/domain_battle_status_access.md` (read/write access map)
- Existing `RE/tech/domain_action_resolution_pipeline.md` (stage 5 — ApplyEffects)
- Existing `RE/tech/battle_action_resolve.c` / `.h` (decompiled resolver)
- Existing `RE/tech/battle_state_reconstruction.md` (slot layout, global bases)
- Runtime evidence from GF test runs (Doomtrain status set, Siren Silence, Cerberus Double/Triple)

Rendering and UI presentation are intentionally excluded.

## Key Conclusion: Two-Layer Status Write Model

### Finding

Status application is split into a **gating layer** (can this status land?) and an **execution layer** (write the bits, handle side effects, sync the mirror). These are separate functions with separate callers, not a single monolithic write.

### Evidence

- `BattleStatus_CanApplyHitStatus` (`0x492AC0`) is a pure predicate — it returns 0 (blocked) or nonzero (allowed) without modifying state.
- `BattleStatus_ApplyHitStatus` (`0x4914E0`) is the write path — it resolves the hit-status masks onto the target's authoritative `status_1`/`status_2`.
- Both are called from within the action resolution pipeline, but gating runs first and can short-circuit the write entirely.

### Confidence

**High** for the gating/apply separation.
**Medium** for exhaustive coverage of every caller into the apply path (some edge-case callers may exist outside the main resolve chain).

## Pipeline Overview

```
Hit resolved (damage computed, target selected)
       │
       ▼
┌──────────────────────────────────────────────┐
│  1. Status Payload Population                │
│     BattleAction_ResolveAndApplyDamage       │
│     (0x48FE20)                               │
│     Reads kernel table → HIT_STATUS_1/2      │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  2. Application Gating                       │
│     BattleStatus_CanApplyHitStatus           │
│     (0x492AC0)                               │
│     Target dead/petrify/invuln? → BLOCK      │
└──────────────────┬───────────────────────────┘
                   │ (if allowed)
                   ▼
┌──────────────────────────────────────────────┐
│  3. Hit-Status Resolution                    │
│     BattleStatus_ApplyHitStatus              │
│     (0x4914E0)                               │
│     Resolves HIT masks against target state  │
│         │                                    │
│         ├──► checkDoubleStatusApply (0x4918C8)
│         │    Decides apply vs. skip           │
│         │         │                          │
│         │         ▼                          │
│         ├──► RelatedToStatus1And2 (0x48F160) │
│         │    Bitwise clear/set on status_1/2 │
│         │    Triggers per-bit side effects    │
│         │                                    │
│         └──► (NoDrain variant: 0x492090)     │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  4. Commit and Sync                          │
│     BattleStatus_ApplyAndSyncSlot            │
│     (0x493840)                               │
│     Writes final status_1/status_2           │
│     Syncs UI mirror copies                   │
│     Handles death/eject side effects         │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  5. Post-Action Status Result                │
│     BattleAction_ResolveAndApplyStatusResult │
│     (0x493D80)                               │
│     HP-threshold status bits (50%/25%)       │
│     Final sync via ApplyAndSyncSlot          │
└──────────────────────────────────────────────┘
```

## Stage-by-Stage Reconstruction

### 1. Status Payload Population

**Function**: `BattleAction_ResolveAndApplyDamage` (`0x48FE20`)

Before any status logic runs, the resolver populates the hit-context status globals from the appropriate kernel table based on `COMMAND_TYPE_ID`:

| `COMMAND_TYPE_ID` | Source Table | Status Fields Read |
|---|---|---|
| 2 (Magic), 6 (Draw), 16 (Slot), 247 | `K_MAGIC[action_id]` | `.statuses0` → `HIT_STATUS_1`, `.statuses1` → `HIT_STATUS_2` |
| 4 (Item), 13 | `K_ITEM[action_id]` | `.status0` → `HIT_STATUS_1`, `.status1` → `HIT_STATUS_2` |
| 7, 23-27, 29-34, 38 (Command abilities) | `K_BATTLE_COMMAND_ABILITY[action_id]` | `.status1` → `HIT_STATUS_1`, `.status2` → `HIT_STATUS_2` |
| 8 (Enemy attack), 236 | `K_ENEMY_ATTACK[action_id]` | `.status0` → `HIT_STATUS_1`, `.status1` → `HIT_STATUS_2` |
| 254 (GF) | `K_GF_JUNCTIONABLE[action_id - 64]` | `.statuses0` → `HIT_STATUS_1`, `.statuses1` → `HIT_STATUS_2` |
| default (Physical / Attack) | `BATTLE_SLOT_DATA[attacker]` | `.hit_status_1` → `HIT_STATUS_1`, `.hit_status_2` → `HIT_STATUS_2` |

The `status_attack_enabler` / `HIT_ATTACK_ENABLER` global controls the probability that the status lands (0xFF = always, lower values = chance-based).

**Globals populated at this stage**:

- `HIT_STATUS_1` (u16) — status_1 mask to attempt
- `HIT_STATUS_2` (u32) — status_2 mask to attempt
- `HIT_ATTACK_ENABLER` (u8) — status application probability

**Confidence**: High — confirmed from decompiled `battle_action_resolve.c` switch cases.

### 2. Application Gating

**Function**: `domain::BattleStatus_CanApplyHitStatus` (`0x492AC0`)

Pure predicate. Returns 0 (blocked) if the target cannot receive any status.

**Blocking conditions** (from decompile evidence):

```c
if ((status_1 & 0x04) != 0)     return 0;  // Petrify — fully blocked
if ((status_2 & 0x180800) != 0)  return 0;  // Invulnerability flags (exact bits TBD)
```

**Interpretation**:

- Petrify (`status_1` bit 2) blocks all status application — a petrified target cannot receive new statuses.
- `status_2 & 0x180800` captures invulnerability states. Likely includes: Invincible (Hero/Holy War item effect) and possibly specific boss immunity flags. Exact bit mapping is a remaining gap.

**Note**: This gate applies to *all* hit-status application, including beneficial statuses. An invulnerable target receiving a support spell will still be gated here. Whether beneficial statuses bypass this gate via a separate caller path is unconfirmed.

**Confidence**: High for the gate's existence and its blocking masks. Medium for exhaustive bit interpretation of `0x180800`.

### 3. Hit-Status Resolution

**Primary function**: `domain::BattleStatus_ApplyHitStatus` (`0x4914E0`)

This is the core resolution function. After gating passes, it resolves the `HIT_STATUS_1`/`HIT_STATUS_2` masks against the target's current status and applies changes.

**Sub-functions called**:

#### 3a. `checkDoubleStatusApply` (`0x4918C8`)

Determines whether a status should actually be applied (handles mutual exclusion, double-apply prevention, and opposite-status cancellation).

Evidence from access map:
```
calls RelatedToStatus1And2(p_target_slot_id, p_hit_status_1, p_hit_status_2);
```

This is where opposing statuses cancel each other (e.g., Haste vs Slow, Protect application removing Shell or vice versa in edge cases), and where already-present statuses are skipped or refreshed.

**Confidence**: Medium — the function is confirmed to exist and delegate to `RelatedToStatus1And2`, but the exact double-apply and mutual-exclusion rules need deeper decompilation.

#### 3b. `RelatedToStatus1And2` (`0x48F160`)

The bitwise writer. Performs the actual mask operations on the slot's status fields.

Evidence:
```c
BATTLE_SLOT_DATA[p_target_slot_id].status_1 &= ~p_status_1_mask_to_set;
BATTLE_SLOT_DATA[target_slot_index].status_2 &= ~p_status_2_mask_to_set;
```

**Important**: The evidence shows `&= ~mask` (clear operations). This suggests `RelatedToStatus1And2` is specifically a **status removal** helper — it clears opposing or incompatible statuses before the new status is set. The actual set (`|= mask`) likely happens in the calling function or in `ApplyAndSyncSlot`.

Calls per-bit side-effect helpers:
- `sub_483340` (`0x483340`)
- `sub_483370` (`0x483370`)

These handle consequences of specific status transitions (e.g., clearing ATB on Stop application, resetting animation state on Sleep removal). Not yet fully decompiled.

**Confidence**: High for the clearing behavior. Medium for the per-bit side-effect semantics.

#### 3c. Drain-Free Variant: `domain::BattleStatus_ApplyHitStatus_NoDrain` (`0x492090`)

Same resolution logic as `0x4914E0` but skips HP drain side effects. Used when the engine needs to apply statuses from a non-drain action context (e.g., status-only spells, item effects).

**Confidence**: High for existence and purpose. Medium for exact caller coverage.

### 4. Commit and Sync

**Function**: `domain::BattleStatus_ApplyAndSyncSlot` (`0x493840`)

The authoritative write function. After resolution determines the final status values, this function:

1. **Writes** the final `status_1` and `status_2` to `BATTLE_SLOT_DATA[slot]`.
2. **Syncs** the UI mirror copies via `domain::BattleStatus_UpdateSlotStatusCopy` (`0x47E2D0`).
3. **Handles death/eject side effects** — if the new status includes KO or Eject, triggers appropriate slot cleanup.

Evidence:
```c
BATTLE_SLOT_DATA[slot].status_2 = ...;
word_1D28E30[slot] = BATTLE_SLOT_DATA[slot].status_1_copy;
```

**Mirror sync chain**:
- `domain::BattleStatus_UpdateSlotStatusCopy` (`0x47E2D0`) — immediate sync
- `domain::BattleStatus_EnqueueStatusCopyUpdate` (`0x47E250`) — deferred/queued sync
- `domain::BattleStatus_EnqueueStatusCopyUpdateEx` (`0x47E330`) — extended deferred sync

These read the authoritative `status_1`/`status_2` and write to the copy fields with monster-flag adjustments. The UI/HUD reads from the copy fields, not the authoritative fields.

**Confidence**: High.

### 5. Post-Action Status Result

**Function**: `domain::BattleAction_ResolveAndApplyStatusResult` (`0x493D80`)

Called after the full action (damage + status) has been applied. Handles:

1. **HP-threshold status bits** — calls `computeStatusHP50Or25Percent` (`0x494360`) to set/clear HP-dependent status flags in `status_1` (e.g., critical HP indicator).
2. **Final sync** — calls `BattleStatus_ApplyAndSyncSlot` to commit any threshold-driven changes.

Evidence:
```c
computeStatusHP50Or25Percent(..., &BATTLE_SLOT_DATA[slot].status_1);
domain::BattleStatus_ApplyAndSyncSlot(slot, status_1, status_2);
```

This ensures that after damage reduces HP below 50% or 25%, the appropriate status bits are set (these drive the yellow/red HP display and Limit Break availability via `crisis_level`).

**Confidence**: High.

## Status Write Paths Outside the Hit Pipeline

Not all status changes go through the hit-status pipeline. The access map documents several additional write paths:

### Battle Initialization

| Function | Address | What it does |
|---|---|---|
| `setMonsterInfoFromDatInfoSection` | `0x48BBD0` | Initializes monster slot statuses from encounter data. Sets auto-status flags (innate Protect, etc.) |
| `setBattleSlotData` | `0x48B310` | Initializes party slot `status_2` (HAS_MAGIC flag, etc.) |
| `domain::Battle_InitPreemptiveBackAttackStatus` | `0x48AFD0` | Applies preemptive/back-attack modifiers into `status_2` at battle start |
| `domain::Battle_InitPartySlotStatusFromChar` | `0x48B5F0` | Initializes party `status_2` from character auto-status abilities (Auto-Haste, Auto-Protect, etc.) |

### HP-Triggered Status Changes

| Function | Address | What it does |
|---|---|---|
| `Battle_ApplyDamageOrHeal` | `0x494410` | Sets KO bit in `status_1` when HP reaches 0. Clears HP-threshold bits. Handles Stop/Eject status during damage application |
| `computeStatusHP50Or25Percent` | `0x494360` | Sets/clears HP-threshold bits in `status_1` based on current/max HP ratio |

### Timed Status Expiration

| Function | Address | What it does |
|---|---|---|
| `sub_483470` | `0x483470` | Handles timed status expiration. Clears expired status mask, may set Petrify (`status_1 \|= 4`) on Gradual Petrify expiry |

### Command-Side Direct Writes

| Function | Address | What it does |
|---|---|---|
| `BattleAction_ResolveAndApplyDamage` | `0x48FE20` | Direct `status_2 \|= STATUS2_EJECT` and `status_1 \|= 1` (Death) in specific command branches (Eject, instant-death commands) |

### Summon/Slot Cleanup

| Function | Address | What it does |
|---|---|---|
| `domain::BattleStatus_HandleSummonExit_TODO` | `0x48E620` | Clears high bit in `status_2` (`& 0x7FFFFFFF`) during GF summon exit |
| `domain::BattleStatus_HandleEject_ResetSlot` | `0x486C70` | Clears `status_1` bit `0x20` during Eject reset flow |

## Known Status Bit Assignments

### `status_1` (u16 at slot offset `+0x80`)

| Bit | Mask | Status | Evidence Source |
|---|---|---|---|
| 0 | `0x01` | Death/KO | `Battle_ApplyDamageOrHeal`: `status_1 \|= 1` on HP=0 |
| 2 | `0x04` | Petrify | `CanApplyHitStatus`: blocks all application. `howMany*NotDeadOrPetrify`: `& 5` |
| 4 | `0x10` | Silence | Siren runtime evidence: Silence infliction confirmed |
| 5 | `0x20` | Berserk | `BattleAction_ResolveAndApplyDamage`: `status_1 & 0x20` attacker check |
| 6 | `0x40` | Zombie | `BattleAction_ResolveAndApplyDamage`: `status_1 & 0x40` target check |

**Note**: Bits 0 and 2 are tested together as `status_1 & 5` (Death OR Petrify) in eligibility predicates.

### `status_2` (u32 at slot offset `+0x08`)

| Bit(s) | Mask | Status | Evidence Source |
|---|---|---|---|
| 0 | `0x01` | Sleep | ATB gating: `status_2 & 9` blocks readiness |
| 3 | `0x08` | Stop | `Battle_ApplyDamageOrHeal`: `BYTE1(status_2) & STATUS2_STOP` |
| 14 | `0x4000` | Eject | `BattleAction_ResolveAndApplyDamage`: direct `status_2 \|= STATUS2_EJECT` |
| 17 | `0x20000` | Double | Cerberus evidence: `status_2` changed `0x40000002 → 0x40060002` |
| 18 | `0x40000` | Triple | Cerberus evidence: same transition |
| 31 | `0x80000000` | GF Summoning | `HandleSummonExit_TODO`: `status_2 & 0x7FFFFFFF` |

**Invulnerability mask**: `0x180800` blocks all status application via `CanApplyHitStatus`. Exact per-bit identities TBD.

**ATB rejection mask**: `status_2 & 0x4009` (bits 0, 3, 14 = Sleep, Stop, Eject) — used by `BattleTarget_IsEligibleByStatus`.

## Runtime Evidence from GF Test Runs

### Doomtrain (`GF_DOOMTRAIN_001`)

- Effect: broad negative status set + HP reduction on all live enemies.
- Confirms: GF invocation flows through the standard damage pipeline (`bp_resolve_and_apply` hit at `0x48FE20`, `bp_apply_damage` hit at `0x494410`).
- Status payload comes from `K_GF_JUNCTIONABLE[action_id - 64].statuses0/statuses1`.
- `COMMAND_TYPE_ID = 0xFE` (254 = GF) confirmed at damage breakpoint.

### Siren (`GF_SIREN_001`)

- Effect: Silence infliction + HP reduction on live target.
- Confirms: status application goes through the hit-status pipeline (Silence is a `HIT_STATUS_1` bit).

### Cerberus (`GF_CERBERUS_001`)

- Effect: party receives Double + Triple statuses.
- Observed: party slot `status_2` changed from `0x40000002` to `0x40060002`.
- Delta: bits 17 and 18 set (`0x60000` = Double + Triple).
- Confirms: beneficial statuses on allies also route through the same status application chain.

## Confidence Matrix

| Aspect | Confidence |
|---|---|
| Status payload population from kernel tables | **High** |
| Gating function existence and blocking masks | **High** |
| ApplyHitStatus as primary hit-status writer | **High** |
| RelatedToStatus1And2 as bitwise clear helper | **High** |
| ApplyAndSyncSlot as commit + mirror sync | **High** |
| Mutual exclusion / double-apply rules in checkDoubleStatusApply | **Medium** |
| Per-bit side-effect semantics in sub_483340/sub_483370 | **Low-Medium** |
| Exhaustive status_2 invulnerability bit interpretation (0x180800) | **Medium** |
| Beneficial status bypass of gating (if any) | **Low** |

## Remaining Gaps

- **Mutual exclusion rules**: Which statuses cancel which? The `checkDoubleStatusApply` function at `0x4918C8` contains this logic but needs deeper decompilation. Known pairs from game design: Haste/Slow, Sleep/Berserk, Protect/Shell stacking rules.
- **Status probability resolution**: How `HIT_ATTACK_ENABLER` interacts with target `SPR` or resistance stats to determine hit/miss for status application. Likely inside `BattleStatus_ApplyHitStatus` but not yet traced.
- **Per-bit side-effect helpers**: `sub_483340` (`0x483340`) and `sub_483370` (`0x483370`) are called per status bit transition but their exact behavior is unresolved. Likely handle: ATB reset on Sleep/Stop, animation state changes, timer initialization for timed statuses.
- **Beneficial status path**: Whether support spells (Haste, Protect, Shell, Aura on allies) bypass `CanApplyHitStatus` or go through a separate caller chain. The Cerberus evidence proves that beneficial statuses do land on party members, but the exact code path was not breakpoint-traced at the gating level.
- **Timed status initialization**: When a timed status (Slow, Stop, Regen, Poison tick) is applied, where is the duration counter initialized? `sub_483470` handles expiration but the initialization site is unresolved.
- **`domain::BattleStatus_MaskWithSlotStatus2`** (`0x506B50`): Its role in masking input flags before forwarding to the apply chain needs deeper analysis. May be the mechanism for element/status defense junctions.

## Recommended Hypothesis Tests

### STATUS_APPLY_001 — Silence Injection

Inject a Magic command (Silence spell) targeting a monster slot. Verify:
- `HIT_STATUS_1` is populated with Silence bit at `BattleAction_ResolveAndApplyDamage`.
- `BattleStatus_CanApplyHitStatus` returns nonzero (target eligible).
- `BattleStatus_ApplyHitStatus` is hit.
- Target's `status_1` gains bit 4 after the pipeline completes.
- UI mirror is synced via `BattleStatus_ApplyAndSyncSlot`.

### STATUS_APPLY_002 — Petrify Blocks Application

Apply Petrify to a target slot via memory write (`status_1 |= 0x04`). Then inject a status-inflicting command. Verify:
- `BattleStatus_CanApplyHitStatus` returns 0 (blocked).
- `BattleStatus_ApplyHitStatus` is NOT hit.
- Target's `status_1`/`status_2` are unchanged.

### STATUS_APPLY_003 — Doomtrain Full Trace

Inject GF Doomtrain (`command_id=0x03`, `command_arg=TBD`). Set breakpoints across the entire pipeline. Capture:
- `HIT_STATUS_1`/`HIT_STATUS_2` values after kernel table load.
- Gating result per target.
- Final `status_1`/`status_2` delta per target.
- Verify multiple negative statuses applied in one pass.

### STATUS_APPLY_004 — Mutual Exclusion (Haste vs Slow)

Apply Haste to a party slot. Then inject Slow targeting the same slot. Verify:
- Haste bit is cleared before Slow bit is set (or vice versa).
- Trace through `checkDoubleStatusApply` to capture the exclusion logic.

## IDA Addresses Quick Reference

| Function | Address | Role |
|---|---|---|
| `BattleAction_ResolveAndApplyDamage` | `0x48FE20` | Status payload population |
| `domain::BattleStatus_CanApplyHitStatus` | `0x492AC0` | Application gate |
| `domain::BattleStatus_ApplyHitStatus` | `0x4914E0` | Primary hit-status resolution |
| `domain::BattleStatus_ApplyHitStatus_NoDrain` | `0x492090` | Drain-free variant |
| `checkDoubleStatusApply` | `0x4918C8` | Double-apply / mutual exclusion |
| `RelatedToStatus1And2` | `0x48F160` | Bitwise status_1/status_2 clear/set |
| `sub_483340` | `0x483340` | Per-bit side effect helper A |
| `sub_483370` | `0x483370` | Per-bit side effect helper B |
| `domain::BattleStatus_ApplyAndSyncSlot` | `0x493840` | Authoritative write + mirror sync |
| `domain::BattleAction_ResolveAndApplyStatusResult` | `0x493D80` | Post-action HP-threshold status |
| `computeStatusHP50Or25Percent` | `0x494360` | HP ratio → status_1 threshold bits |
| `domain::BattleStatus_UpdateSlotStatusCopy` | `0x47E2D0` | Mirror sync (immediate) |
| `domain::BattleStatus_EnqueueStatusCopyUpdate` | `0x47E250` | Mirror sync (deferred) |
| `domain::BattleStatus_EnqueueStatusCopyUpdateEx` | `0x47E330` | Mirror sync (extended) |
| `domain::BattleStatus_MaskWithSlotStatus2` | `0x506B50` | Defense junction masking (TBD) |
| `sub_483470` | `0x483470` | Timed status expiration |
