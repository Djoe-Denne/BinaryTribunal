# Agent Prompt: Creating a GF Injection Hypothesis from Domain Documentation

## Purpose

You are an AI agent assisting with reverse engineering Final Fantasy VIII's
battle system. This prompt explains the complete methodology for transforming
a GF (Guardian Force) domain documentation file into a Tier 3 injection
hypothesis YAML file that can be executed by the `ff8re` test runner.

The test validates the **full GF lifecycle**: injection → cinematic dispatch →
GF animation → damage resolution → HP application on the target enemy.

The runner executes 5 phases: **setup -> act -> observe -> assert -> cleanup**.
Each phase is declared in YAML. The runner communicates with IDA Pro's debugger
via an MCP server to set breakpoints, read/write memory, and control execution.

---

## Inputs You Need

### 1. GF Domain Documentation

Location: `tech/battle/G-Force/domain_gf_<name>_invocation.md`

This file provides the statically-analyzed invocation chain for a specific GF.
Extract these fields:

| Field | Description | Example (Shiva) |
|---|---|---|
| Entry address | `GF_<Name>_InvokeSummonScript` function address | `0x5c0d50` |
| Init address | Usually same as Entry for most GFs | `0x5c0d50` |
| Tick address | Per-frame sequence driver function | `0x5c7f50` |
| Counter increment | Address inside tick that increments a frame counter | `0x5c7f8b` |
| Completion address | Return path when sequence finishes (may be null) | `null` |
| Family | `FamilyA`, `FamilyB`, or `Atypical` | `FamilyA` |
| Numeric conversions | Extra addresses listed at the bottom — potential context pointers | `0x1D96AAC`, `0x1D99A50` |

### 2. GF Batch Inventory

Location: `tech/battle/G-Force/domain_gf_batch_inventory.json`

Machine-readable JSON with all discovered GFs. Cross-reference the domain doc
values against this inventory to confirm addresses and confidence scores.

### 3. GF Kernel ID (command_arg)

This is the most critical and error-prone value. It is the byte written to
offset +4 of the pending action buffer entry to tell the battle engine which
GF to summon.

**CONFIRMED values** are listed in `ff8re/battle_state.py`:

```python
GF_SHIVA    = 0x41   # 65 decimal, confirmed via runtime evidence
GF_IFRIT    = 0x42   # 66 decimal, confirmed via BP capture
```

**How to derive a new kernel GF ID:**

The pattern is `0x40 + sequential_GF_index` where the standard FF8 GF order is:

| Index | GF | Kernel ID | Status |
|---|---|---|---|
| 0 | Quezacotl | 0x40 | hypothesized |
| 1 | Shiva | 0x41 | **CONFIRMED** (runtime: `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x41`) |
| 2 | Ifrit | 0x42 | **CONFIRMED** (BP capture at `BattlePendingAction_Write`) |
| 3 | Siren | 0x43 | hypothesized |
| 4 | Brothers | 0x44 | hypothesized |
| 5 | Diablos | 0x45 | hypothesized |
| 6 | Carbuncle | 0x46 | hypothesized |
| 7 | Leviathan | 0x47 | hypothesized |
| 8 | Pandemona | 0x48 | hypothesized |
| 9 | Cerberus | 0x49 | hypothesized |
| 10 | Alexander | 0x4A | hypothesized |
| 11 | Doomtrain | 0x4B | hypothesized |
| 12 | Bahamut | 0x4C | hypothesized |
| 13 | Cactuar | 0x4D | hypothesized |
| 14 | Tonberry | 0x4E | hypothesized |
| 15 | Eden | 0x4F | hypothesized |

This pattern is corroborated by the Doomtrain wiki MagicID table which
establishes the GF sequential ordering, and now **confirmed for two GFs**
(Ifrit via BP capture, Shiva via runtime action globals).

**WARNING**: Guessing kernel IDs caused crashes during Ifrit testing
(see `tech/battle/G-Force/CHRONICLE_GF_IFRIT_001.md`, Chapters 3-4).
If the hypothesized value fails, use the breakpoint capture method:

1. Set a breakpoint on `BattlePendingAction_Write` (`0x484D20`)
2. Have the user manually trigger the GF summon in-game
3. Read the raw 8 bytes being written to the pending buffer
4. Extract `command_arg` from offset +4

### 4. Shared Infrastructure Addresses

These are the same for ALL GFs (confirmed):

```yaml
# Battle tick synchronization
ATB_TICK: 0x4842B0              # BattleATB_TickAndReady

# Pending action buffer
PENDING_BASE: 0x1D28D44         # Pending action buffer start
PENDING_STRIDE: 0x08            # 8 bytes per entry

# GF cinematic dispatch
GF_CINEMATIC_TICK: 0x50B2A0     # BattleActionSequence_Tick_GF_Cinematic
GF_CALLBACK_PTR: 0x21DFEC4      # Active GF callback pointer (PERSISTENT global — see note below)

# Pipeline functions
PENDING_WRITE: 0x484D20         # BattlePendingAction_Write
PENDING_TRANSFER: 0x4847F0      # BattlePendingAction_TransferToExecQueue
ARBITRATION_SELECT: 0x485460    # BattleArbitration_SelectNextAction
RESOLVE_SPECIAL: 0x485160       # BattleAction_ResolveSpecialActionAndUpdateDamage

# Damage pipeline (shared — fire after ANY GF cinematic completes)
RESOLVE_AND_APPLY: 0x48FE20     # BattleAction_ResolveAndApplyDamage
COMPUTE_DAMAGE: 0x4922B0        # Damage_ComputeRawDeltaFromAttackType
APPLY_DAMAGE_OR_HEAL: 0x494410  # Battle_ApplyDamageOrHeal
UPDATE_DAMAGE: 0x48EF80         # Battle_UpdateDamage

# Command injection values
GF_COMMAND_ID: 0x03             # GF command type
GF_TARGET_MASK: 0x8008          # GF targeting flags
```

### 5. Enemy Slot Identification

**CRITICAL**: The target enemy slot is NOT fixed. It depends on the encounter.

The standard FF8 battle slot layout is:
- **Slots 0–2**: Party characters
- **Slots 3–6**: Enemy slots (varies per encounter)
- **Slots 7–10**: Reserved / extra

Use `scan_slots.py` before running any hypothesis to identify which slots
have live enemies (HP > 0). The test snapshots **multiple enemy slots**
(3, 4, 5) for robustness, with the primary assertion on the slot most
likely to contain a live enemy.

**Lesson learned**: The Shiva test initially failed because it asserted on
slot 4 (HP=0, dead), while the only live enemy was in slot 3. GF damage
was correctly applied to slot 3, but the test was observing the wrong slot.

---

## Damage Pipeline: What Happens After the Cinematic

After the GF cinematic animation completes, the battle engine routes through
the **shared damage resolution pipeline** (same for all GFs):

```
GF cinematic completes (tick returns completion flag)
  → BattleAction_ResolveAndApplyDamage (0x48FE20)
    → Damage_ComputeRawDeltaFromAttackType (0x4922B0)
      → ComputeMagicAndGFDamage (for GF: COMMAND_TYPE_ID = 0xFE)
    → Battle_ApplyDamageOrHeal (0x494410)
      → Writes new HP to BATTLE_SLOT_DATA[target].current_hp
  → Battle_UpdateDamage (0x48EF80)
    → Queues hit results for presentation
```

**Key observation confirmed at runtime**: When the damage pipeline processes
a GF action, `read_action_globals` captures:
- `COMMAND_TYPE_ID = 0xFE` (254 decimal) — the GF damage type
- `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID` = the kernel GF ID (e.g., `0x41` for Shiva, `0x42` for Ifrit)
- `ATTACKER_SLOT_ID` = the party slot that summoned the GF

This confirms the damage pipeline is processing OUR injected GF command.

---

## FamilyA (BDLink) vs Atypical: Tick BP Behavior

**IMPORTANT**: FamilyA GFs (Shiva, Quezacotl, Siren, Brothers, etc.) use
the BDLink task system. Their tick function (`au_re_BdlinkTask_N`) is a
shared dispatcher entered via indirect call.

**Consequence**: The breakpoint on the tick function entry (e.g., `0x5c7f50`
for Shiva) may **NOT fire** because the BDLink dispatcher enters via an
indirect jump that bypasses the function prologue.

**Workaround**: Do NOT assert `breakpoint_was_hit` on `bp_<name>_tick` for
FamilyA GFs. Instead, rely on `bp_<name>_counter_inc` (which is INSIDE
the tick function) as the definitive proof that the tick is executing.

| Family | Tick BP fires? | Assert on tick? | Assert on counter_inc? |
|---|---|---|---|
| **FamilyA** (BDLink) | Unreliable | NO | YES |
| **FamilyB** | Unknown (not yet tested) | Tentative | YES |
| **Atypical** (Ifrit) | YES | YES | YES |

---

## GF_CALLBACK_PTR Is Persistent — Do NOT Assert on It

**CRITICAL LESSON** (discovered via Shiva test, February 2026):

The global at `0x21DFEC4` (`GF_CALLBACK_PTR`) is a **persistent** value that
retains whatever was written there by the **last** GF cinematic dispatch. It is
**not** cleared between GF invocations.

### What happened

The Shiva test initially included a `value_equals` assertion checking that
`callback_ptr_during == 0x5c0d50` (Shiva's entry function). In the first run,
this passed — but only by coincidence: the pointer was already set to Shiva's
entry address **before** the injection even happened (`callback_ptr_before`
was already `6032720 = 0x5c0d50`), meaning a previous Shiva invocation had
left its pointer there.

When the test ran after the Ifrit test, the pointer contained Ifrit's leftover
value (`0x61B7E0`), and the assertion failed — even though the entire Shiva
invocation chain, damage pipeline, and HP reduction all succeeded.

### Rule

- **NEVER** use `value_equals` on `callback_ptr_during` to prove GF identity.
- The definitive proof that a specific GF was dispatched is
  `bp_<name>_counter_inc` being hit (Shiva's counter increment at `0x5c7f8b`
  can only fire if Shiva's tick function is running).
- Capture the callback pointer at **three** moments for observational analysis:

| Snapshot label | When captured | Purpose |
|---|---|---|
| `callback_ptr_before` | Setup, before injection | Baseline: what was there from prior state |
| `callback_ptr_at_cinematic_entry` | Start of Observe, right after `bp_gf_cinematic` fires | Value at the moment the cinematic dispatcher is entered |
| `callback_ptr_during` | After tick/counter_inc fires | Value while the GF sequence is actively running |

Comparing these three values across runs reveals the lifecycle of the global.
None of them are asserted — they exist purely for evidence analysis.

---

## Step-by-Step: Building the Hypothesis YAML

### Step 1: Create the File

Location: `ff8re/tests/tier3_inject/GF_<NAME>_001.yaml`

Use the naming convention `GF_<UPPERCASE_NAME>_001` where 001 is the
iteration number.

### Step 2: Write the Header Comments

Document:
- What the test does (inject + validate full lifecycle through damage)
- Whether `command_arg` is confirmed or hypothesized
- The derivation logic for hypothesized values
- Source evidence and confidence level
- The hypothesized raw pending entry bytes

### Step 3: Define Metadata

```yaml
id: "GF_<NAME>_001"
title: "Inject GF <Name> pending action and validate invocation chain"
domain: "gf_invocation"
confidence_target: "high"

references:
  - "tech/battle/G-Force/domain_gf_<prefix><name>_invocation.md"
  - "tech/battle/G-Force/domain_gf_batch_index.md"
  - "tech/battle/G-Force/domain_gf_batch_inventory.json"
  - "tech/domain_battle_command_menu.md"
```

### Step 4: Define Constants

Include ALL shared infrastructure addresses plus GF-specific addresses:

```yaml
constants:
  # Shared (same for all GFs)
  ATB_TICK: 0x4842B0
  PENDING_BASE: 0x1D28D44
  PENDING_STRIDE: 0x08
  GF_CINEMATIC_TICK: 0x50B2A0
  GF_CALLBACK_PTR: 0x21DFEC4
  PENDING_WRITE: 0x484D20
  PENDING_TRANSFER: 0x4847F0
  ARBITRATION_SELECT: 0x485460
  RESOLVE_SPECIAL: 0x485160

  # Damage pipeline (shared)
  RESOLVE_AND_APPLY: 0x48FE20
  COMPUTE_DAMAGE: 0x4922B0
  APPLY_DAMAGE_OR_HEAL: 0x494410
  UPDATE_DAMAGE: 0x48EF80

  # Command injection values
  GF_COMMAND_ID: 0x03
  GF_TARGET_MASK: 0x8008

  # GF-specific (from domain doc + batch inventory)
  <NAME>_ENTRY: <entry_address>
  <NAME>_TICK: <tick_address>
  <NAME>_COUNTER_INC: <counter_increment_address>
  <NAME>_GF_INDEX: <kernel_gf_id>

  # Exploratory pointers (from domain doc numeric conversions, if any)
  <NAME>_EXTRA_PTR_A: <address>   # unconfirmed role
  <NAME>_EXTRA_PTR_B: <address>   # unconfirmed role
```

### Step 5: Phase 1 — Setup

The setup phase is nearly identical for all GFs:

1. **sync_to_battle_tick** — Pause at `ATB_TICK` boundary
2. **snapshot_memory** — Backup 24 bytes at `PENDING_BASE`
3. **snapshot_slot** x3 — Capture target enemy slots 3, 4, and 5 (before)
   - Use `scan_slots.py` to verify which slot has the live enemy
   - Snapshot multiple slots for robustness across encounters
4. **snapshot_memory** — Read `GF_CALLBACK_PTR` as `callback_ptr_before` (observational baseline — this global is persistent; see "GF_CALLBACK_PTR Is Persistent" section)
5. **set_breakpoint** x6 — Arm breakpoints on:
   - `GF_CINEMATIC_TICK` (bp_gf_cinematic)
   - `<NAME>_ENTRY` (bp_<name>_entry)
   - `<NAME>_TICK` (bp_<name>_tick)
   - `<NAME>_COUNTER_INC` (bp_<name>_counter_inc)
   - `PENDING_TRANSFER` (bp_pending_transfer)
   - `ARBITRATION_SELECT` (bp_arbitration)

### Step 6: Phase 2 — Act

1. **write_pending_action** — Inject command into slot 0:
   - `target_mask: 0x8008`
   - `attacker_slot: 0`
   - `command_id: 0x03`
   - `command_arg: <kernel_gf_id>`
   - `active: 1`
2. **read_pending_action** — Read back to verify write
3. **continue_execution** — Wait for `bp_pending_transfer`
4. **check_breakpoint_hit** — Confirm pending transfer fired
5. **read_registers** — Capture register state at transfer
6. **delete_breakpoint** x2 — Remove `bp_pending_transfer` and `bp_arbitration`
   (per-frame BPs that would trap every frame)
7. **continue_execution** — Wait for any of:
   `bp_gf_cinematic`, `bp_<name>_entry`, `bp_<name>_tick`, `bp_<name>_counter_inc`

### Step 7: Phase 3 — Observe (Invocation)

1. **snapshot_memory** — Read `GF_CALLBACK_PTR` as `callback_ptr_at_cinematic_entry`
   (the game just stopped at `bp_gf_cinematic`; this captures the pointer BEFORE
   this frame's dispatch writes a new value — observational, not asserted)
2. **delete_breakpoint** x2 — Remove `bp_gf_cinematic` and `bp_<name>_entry`
   (served their routing purpose)
3. **continue_execution** — Wait for `bp_<name>_tick` or `bp_<name>_counter_inc`
4. **check_breakpoint_hit** — Check tick status (informational for FamilyA)
5. **snapshot_memory** — Read `GF_CALLBACK_PTR` as `callback_ptr_during`
   (observational — this global is persistent; see "GF_CALLBACK_PTR Is Persistent")
6. **snapshot_memory** — Read any exploratory pointers (informational only)
7. **delete_breakpoint** — Remove `bp_<name>_tick`
8. **continue_execution** — Wait for `bp_<name>_counter_inc`
9. **check_breakpoint_hit** — Confirm counter increment was reached
10. **read_registers** — Capture register state at counter increment
11. **read_stacktrace** — Capture call stack at counter increment

### Step 8: Phase 3 — Observe (Damage Pipeline)

After confirming the invocation chain, the test transitions to wait for the
full GF cinematic to complete and damage to be applied:

12. **delete_breakpoint** — Remove `bp_<name>_counter_inc` (already confirmed)
13. **set_breakpoint** x2 — Arm damage pipeline BPs:
    - `RESOLVE_AND_APPLY` (bp_resolve_and_apply)
    - `APPLY_DAMAGE_OR_HEAL` (bp_apply_damage)
14. **continue_execution** — Wait for damage pipeline with **90 second timeout**
    (the GF cinematic is a full FMV sequence that can take 10-60 seconds)
    - `wait_until: [bp_resolve_and_apply, bp_apply_damage]`
15. **read_action_globals** — Capture `COMMAND_TYPE_ID`, `ATTACKER_SLOT_ID`,
    and `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID` to confirm the damage
    pipeline is processing our GF command
16. **read_registers** — Capture register state at damage resolution
17. **delete_breakpoint** — Remove `bp_resolve_and_apply`
18. **continue_execution** — Wait for `bp_apply_damage` (actual HP write)
19. **check_breakpoint_hit** — Confirm damage application was reached
20. **read_registers** + **read_stacktrace** — Capture state at HP write
21. **delete_breakpoint** — Remove `bp_apply_damage`
22. **sync_to_battle_tick** — Re-sync so HP values are stable for reading
23. **snapshot_slot** x3 — Capture target enemy slots 3, 4, and 5 (after)

### Step 9: Phase 4 — Assert

Define deterministic pass/fail checks. The minimum set for any GF:

```yaml
assert:
  # Stage 1: Injection consumed
  - check: breakpoint_was_hit
    label: "sync_atb"

  - check: breakpoint_was_hit
    label: "bp_pending_transfer"

  # Stage 2: GF-specific sequence is running
  # This is the DEFINITIVE proof that our specific GF was dispatched.
  # DO NOT use value_equals on callback_ptr_during — that global is
  # persistent and non-deterministic (see "GF_CALLBACK_PTR Is Persistent").
  # For FamilyA (BDLink): do NOT assert bp_<name>_tick (unreliable)
  # For Atypical (Ifrit-like): assert bp_<name>_tick
  - check: breakpoint_was_hit
    label: "bp_<name>_counter_inc"

  # Stage 3: Damage pipeline executed after cinematic
  - check: breakpoint_was_hit
    label: "bp_apply_damage"

  # Stage 4: Target HP changed (damage applied)
  - check: value_changed
    before: "target_slot3_before"   # adjust slot based on encounter
    after: "target_slot3_after"
```

If the GF has confirmed context pointers (like Ifrit's `IFRIT_SEQ_CTX_PTR`
and `IFRIT_TASK_LIST_HEAD`), add between Stages 3 and 5:

```yaml
  # Stage 4: Internal state initialized
  - check: value_not_zero
    label: "<name>_seq_ctx_ptr"

  - check: value_not_zero
    label: "<name>_task_list_head"
```

Do NOT assert on unconfirmed exploratory pointers. They are captured for
manual analysis only.

### Step 10: Phase 5 — Cleanup

1. **restore_snapshot** — Write `pending_buffer_backup` back to `PENDING_BASE`
2. All breakpoints should already be deleted by the observe phase.
   The cleanup is a safety net only.

The deletion timeline must be tracked carefully:

| Phase | Deletes | Reason |
|---|---|---|
| Act (step 2e) | `bp_pending_transfer`, `bp_arbitration` | Per-frame BPs, already confirmed |
| Observe (step 3b) | `bp_gf_cinematic`, `bp_<name>_entry` | Routing BPs, already served purpose |
| Observe (step 3e) | `bp_<name>_tick` | Tick confirmed (or not for FamilyA) |
| Observe (step 3g) | `bp_<name>_counter_inc` | Counter confirmed, transition to damage |
| Observe (step 3j) | `bp_resolve_and_apply` | Resolve confirmed, continue to apply |
| Observe (step 3k) | `bp_apply_damage` | Apply confirmed, let HP write complete |
| Cleanup | (none if observe completed normally) | Safety net only |

### Step 11: Write the Verdict Prompt

The `verdict_prompt` is a template string passed to an LLM for evidence
analysis. It must include:

- The hypothesis being tested (GF name, command_arg, addresses)
- Whether `command_arg` is confirmed or hypothesized
- The GF's family (FamilyA/FamilyB/Atypical)
- The `{evidence_json}` placeholder (filled by runner)
- Diagnostic questions covering the **full lifecycle**:
  1. Was the injection consumed? (bp_pending_transfer)
  2. Is the GF-specific sequence running? (bp_<name>_counter_inc — definitive)
  3. How did `GF_CALLBACK_PTR` evolve? Compare the three observational
     snapshots (`callback_ptr_before`, `callback_ptr_at_cinematic_entry`,
     `callback_ptr_during`) — do NOT fail the hypothesis based on these;
     they are diagnostic context only
  4. Did the damage pipeline fire after the cinematic? (bp_apply_damage)
  5. What do the action_globals reveal? (COMMAND_TYPE_ID, attack ID)
  6. Did target HP change? (slot before vs after)
  7. If damage failed, where did it stall?

---

## Decision Tree: What to Do When Things Go Wrong

```
Test result = FAIL
├── bp_pending_transfer NOT hit
│   └── Injection write failed → check idc.patch_dbg_byte, verify game is in battle
│
├── bp_pending_transfer hit, but no GF chain BPs hit
│   └── Command was consumed but not dispatched as GF
│       ├── Check registers at transfer: does command_id = 0x03?
│       └── command_arg may be wrong → use BP capture method (manual summon)
│
├── callback_ptr_during != expected entry address
│   └── This is NORMAL — GF_CALLBACK_PTR is a persistent global
│       ├── Compare callback_ptr_before, _at_cinematic_entry, and _during
│       ├── The value may be a leftover from a prior GF invocation
│       ├── Do NOT treat this as a failure — use bp_<name>_counter_inc
│       │   as the definitive proof of GF dispatch
│       └── If counter_inc also didn't fire, THEN investigate dispatch
│
├── bp_<name>_tick NOT hit (FamilyA only — expected!)
│   └── BDLink dispatcher enters via indirect call, bypassing prologue
│       └── This is NORMAL for FamilyA GFs — rely on counter_inc instead
│
├── bp_<name>_counter_inc NOT hit
│   └── Tick ran but counter site is at a different offset
│       └── Step through tick function in IDA to find actual increment
│
├── Damage BPs NOT hit (bp_resolve_and_apply, bp_apply_damage)
│   └── GF cinematic completed but damage pipeline did not fire
│       ├── Timeout too short? GF cinematics can take 10-60 seconds
│       │   └── Increase timeout_ms to 90000 or higher
│       ├── GF was interrupted? (another action pre-empted)
│       │   └── Check if battle state changed during cinematic
│       └── Target was already dead? (all enemies killed by prior attack)
│           └── Use scan_slots.py to verify live enemies exist
│
├── action_globals_at_damage don't match expected GF
│   └── Damage pipeline processed a DIFFERENT action
│       ├── COMMAND_TYPE_ID should be 0xFE for GF damage
│       ├── CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID should match kernel ID
│       └── Another action may have been queued concurrently
│
└── value_changed FAIL on target slot
    └── The asserted slot has no live enemy (HP=0, status1=DEATH)
        ├── Run scan_slots.py to find which slot has the live enemy
        ├── Change the asserted slot to the correct one
        └── Snapshot multiple slots (3, 4, 5) for robustness
```

---

## Reference: Proven Examples

### GF Ifrit (Atypical family) — CONFIRMED

See `ff8re/tests/tier3_inject/GF_IFRIT_001.yaml`
- All assertions pass (invocation + damage + HP change)
- `command_arg = 0x42` (confirmed via BP capture)
- Tick BP (`bp_ifrit_tick`) fires reliably (Atypical family)
- Has confirmed context pointers: `IFRIT_SEQ_CTX_PTR`, `IFRIT_TASK_LIST_HEAD`
- See `tech/battle/G-Force/CHRONICLE_GF_IFRIT_001.md` for the complete
  evolution story

### GF Shiva (FamilyA / BDLink) — CONFIRMED

See `ff8re/tests/tier3_inject/GF_SHIVA_001.yaml`
- All assertions pass (invocation + damage + HP change)
- `command_arg = 0x41` (confirmed via runtime `action_globals_at_damage`)
- Tick BP (`bp_shiva_tick`) does NOT fire (BDLink indirect dispatch)
- Counter increment BP confirms tick is running
- Initial failure on slot 4 (dead) → fixed by scanning to find slot 3 (alive)
- Evidence: `evidence/2026-02-14T10-07-41_GF_SHIVA_001.json`

### Runtime Evidence: Damage Pipeline Globals

At the moment `BattleAction_ResolveAndApplyDamage` fires, `read_action_globals`
captures the transient resolution context:

| Global | Ifrit value | Shiva value | Meaning |
|---|---|---|---|
| `COMMAND_TYPE_ID` | `0xFE` | `0xFE` | GF damage type (case 254 in resolve) |
| `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID` | `0x42` | `0x41` | Kernel GF ID |
| `ATTACKER_SLOT_ID` | `0x00` | `0x00` | Party slot 0 (Squall) |
| `CURRENT_SLOT_ID_TURN` | `0x00` | `0x00` | Current turn slot |

This confirms both the `0x40 + index` kernel ID pattern and the shared
damage resolution path (`COMMAND_TYPE_ID = 0xFE`) for all GF actions.

---

## Checklist Before Running

- [ ] GF is junctioned to a party member in the current save
- [ ] Game is in an active battle (running or paused)
- [ ] IDA debugger is connected to the FF8 process
- [ ] **Run `scan_slots.py`** to verify which enemy slots are alive
- [ ] Primary assertion slot matches a live enemy (HP > 0)
- [ ] `command_arg` status documented (confirmed or hypothesized)
- [ ] All GF-specific addresses cross-referenced against batch inventory
- [ ] Exploratory pointer reads included for unknown context globals
- [ ] BP deletion timeline accounts for all breakpoints (invocation + damage)
- [ ] Damage pipeline timeout is at least 90 seconds (cinematic FMV)
- [ ] Multi-slot snapshots (3, 4, 5) for robustness
- [ ] For FamilyA GFs: do NOT assert `bp_<name>_tick` (BDLink issue)
- [ ] `GF_CALLBACK_PTR` snapshots are OBSERVATIONAL only — no `value_equals` assertion
- [ ] Three callback snapshots included: `_before`, `_at_cinematic_entry`, `_during`
- [ ] `verdict_prompt` covers full lifecycle (invocation + damage + HP)
