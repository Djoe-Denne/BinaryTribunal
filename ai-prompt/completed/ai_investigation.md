# GF Runtime Evidence Capture — AI Agent Prompts

## Preamble: Shared Context for All Prompts

Every prompt below assumes the agent has:

- A live IDA Pro session with the FF8 process paused in battle
- MCP server access at `http://127.0.0.1:13337/mcp`
- The `ff8re` framework with `actions.py` (sync_to_battle_tick, write_pending_action, snapshot_slot, read_action_globals, set_enemy_hp_all_10000)
- Write access via `idc.patch_dbg_byte` (NOT `ida_dbg.write_dbg_memory` — the latter silently fails on the active flag byte)

### Critical Lessons (from Ifrit chronicle — apply to ALL runs)

1. **Use `idc.patch_dbg_byte`** for all pending buffer writes. `ida_dbg.write_dbg_memory` silently fails on offset +7 (active flag).
2. **Progressive breakpoint deletion** — delete each BP after it serves its purpose. Per-frame BPs (ATB tick, pending transfer) cause frame-traps if left active.
3. **Assert on memory state, not BP timing** — a callback pointer value is deterministic proof. A BP "hit" depends on the runner catching it at the right moment.
4. **Read memory AFTER the function executes, not at entry** — reading at function entry catches pre-execution state. Read one level deeper for post-execution state.
5. **Sync before injection** — always sync to a battle tick boundary before writing to the pending action buffer.
6. **Verify writes by reading back** — after injecting, read the pending buffer back and log the readback in evidence.

### Shared Addresses

```
PENDING_ACTION_BUFFER     = 0x1D28D44   # 3 entries, stride 0x08
BATTLE_SLOT_DATA          = 0x1D27B10   # 11 slots, stride 0xD0
GF_CALLBACK_PTR           = 0x21DFEC4   # active GF cinematic callback
FUNC_ATB_TICK             = 0x4842B0    # BattleATB_TickAndReady
FUNC_PENDING_TRANSFER     = 0x4847F0    # BattlePendingAction_TransferToExecQueue
FUNC_GF_CINEMATIC         = 0x50B2A0    # BattleActionSequence_Tick_GF_Cinematic
FUNC_RESOLVE_DAMAGE       = 0x48FE20    # BattleAction_ResolveAndApplyDamage
FUNC_APPLY_DAMAGE         = 0x494410    # Battle_ApplyDamageOrHeal
FUNC_STATUS_APPLY         = 0x4914E0    # BattleStatus_ApplyHitStatus
FUNC_PENDING_WRITE        = 0x484D20    # BattlePendingAction_Write

# Action globals (read at FUNC_RESOLVE_DAMAGE)
ADDR_COMMAND_TYPE_ID      = <resolve from IDA>
ADDR_CURRENT_CMD_ID       = <resolve from IDA>
ADDR_ATTACKER_SLOT_ID     = <resolve from IDA>
```

### Kernel GF ID Table (command_arg values)

Derived from `K_GF_JUNCTIONABLE[command_arg - 64]` indexing. Ifrit (0x42) and Diablos (0x45) are confirmed. Others follow the standard FF8 kernel GF order:

```
Quezacotl  = 0x40 (64)     Diablos    = 0x45 (69) ✅
Shiva      = 0x41 (65)     Carbuncle  = 0x46 (70)
Ifrit      = 0x42 (66) ✅  Leviathan  = 0x47 (71)
Siren      = 0x43 (67)     Pandemona  = 0x48 (72)
Brothers   = 0x44 (68)     Cerberus   = 0x49 (73)
Alexander  = 0x4A (74)     Cactuar    = 0x4D (77)
Doomtrain  = 0x4B (75)     Tonberry   = 0x4E (78)
Bahamut    = 0x4C (76)     Eden       = 0x4F (79)
```

### Injection Template (all junctionable GFs)

```
Raw bytes at 0x1D28D44: 08 80 00 03 XX 00 00 01
                         ^^^^       ^^          ^^
                    target_mask  cmd_arg     active

Where XX = the command_arg from the table above.
```

### Standard Evidence Stages

Every junctionable GF prompt follows this 4-stage evidence model:

```
Stage 1 — Injection consumed:
  - sync_atb BP hit (confirms game is ticking)
  - bp_pending_transfer BP hit (confirms command entered exec queue)

Stage 2 — Cinematic dispatch routed:
  - GF_CALLBACK_PTR (0x21DFEC4) == expected entry address

Stage 3 — GF sequence running:
  - bp_<gf>_tick BP hit (confirms per-frame tick executing)
  - bp_<gf>_counter_inc BP hit (confirms sequence progressing)

Stage 4 — GF internal state initialized:
  - GF-specific context pointer != 0
  - GF-specific task list head != 0
```

---

## Battle Loop Clarification Prompts

The broader battle-loop clarification backlog now lives in `ai_investigation_battle_loop_clarification_index.md`. Use that index when the next discovery pass is about targeting, elemental resolution, escape, GF charge absorption, Limit Breaks, status timers, camera, cleanup/reset, hook boundaries, exec queue layout, RNG, Draw/Item confirmation, status bit semantics, ATB auto-command masks, AI opcode semantics, GF assertion gaps, Draw stock mutation, terrain semantics, or rare hidden mechanics.

---

## Prompt 01 — Quezacotl (0x40)

> **Priority: HIGH** — worst coverage of any junctionable GF (1/10).

```
OBJECTIVE:
Run a full runtime evidence capture for GF Quezacotl injection. Quezacotl
has the worst coverage of any junctionable GF: entry is known but tick,
init, counter, and completion are all unresolved. This run must both prove
the injection works AND discover the missing chain elements.

CURRENT KNOWLEDGE:
- Entry: GF_Quezacotl_InvokeSummonScript at 0x6c3550
- Init: same as entry (not separated)
- Tick: UNKNOWN — this is the primary discovery target
- Counter: UNKNOWN
- Completion: UNKNOWN
- command_arg: 0x40 (64) — UNCONFIRMED, derived from kernel GF order
- Family: Atypical
- Confidence: low (45)

INJECTION BYTES:
08 80 00 03 40 00 00 01

PRE-INJECTION SETUP:
1. Set enemy HP to 10000 on all live enemy slots (ensures targets survive for observation).
2. Snapshot all enemy slots (HP before).
3. Snapshot all party slots (HP before).

PHASE 1 — SYNC AND INJECT:
1. Sync to battle tick at 0x4842B0 (BattleATB_TickAndReady).
2. Arm breakpoints:
   - bp_pending_transfer at 0x4847F0
   - bp_gf_cinematic at 0x50B2A0
   - bp_quezacotl_entry at 0x6c3550
3. Inject pending action: write bytes 08 80 00 03 40 00 00 01 to 0x1D28D44
   using idc.patch_dbg_byte for each byte.
4. Read back pending buffer and log for verification.
5. Continue execution with wait_until [bp_pending_transfer] (timeout 10s).
6. On hit: log EIP, confirm pending transfer. Delete bp_pending_transfer.
7. Continue execution with wait_until [bp_gf_cinematic, bp_quezacotl_entry]
   (timeout 15s).

PHASE 2 — DISCOVER THE CHAIN:
After bp_gf_cinematic or bp_quezacotl_entry hits:

8. Read GF_CALLBACK_PTR at 0x21DFEC4. This MUST equal 0x6c3550 if
   Quezacotl is dispatched. If different, log the actual value — it may
   reveal the real Quezacotl entry (or prove command_arg 0x40 is wrong).
9. Delete bp_gf_cinematic.

CRITICAL DISCOVERY STEP — Find the tick function:
10. Decompile 0x6c3550 (GF_Quezacotl_InvokeSummonScript).
    Look for:
    a) A call to an init/context-setup function (pattern: allocates or
       writes to a global pointer, typically the first callee).
    b) A call that schedules a BdLinkTask (pattern: passes a function
       pointer as argument — this function pointer IS the tick function).
    c) Any function pointer stored to a global (pattern: mov [global], offset func).
    Record every callee address found.

11. For each callee found in step 10, set a breakpoint on it.
12. Continue execution with wait_until [all callee BPs] (timeout 15s).
    The one that fires repeatedly on subsequent frames is the tick.
13. Once tick is identified, look inside it for:
    a) Counter increment: `inc word ptr [reg + offset]` pattern
    b) Completion: a code path that returns 2 (mov eax, 2)
    Record these addresses.

PHASE 3 — DAMAGE/STATUS OBSERVATION:
14. Arm bp_resolve_damage at 0x48FE20 and bp_apply_damage at 0x494410.
15. Continue execution until damage pipeline fires (timeout 30s).
16. When bp_resolve_damage hits: read action globals
    (COMMAND_TYPE_ID, CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID, ATTACKER_SLOT_ID).
    Verify COMMAND_TYPE_ID == 0xFE (254 = GF).
17. Continue to bp_apply_damage. Read target slot HP after.

PHASE 4 — POST-DAMAGE:
18. Delete all remaining breakpoints.
19. Sync to battle tick.
20. Snapshot all enemy slots (HP after).
21. Snapshot all party slots (HP after).

ASSERTIONS:
- bp_pending_transfer was hit
- GF_CALLBACK_PTR == 0x6c3550 (or document actual value)
- bp_quezacotl_entry was hit
- COMMAND_TYPE_ID == 0xFE at resolve
- CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID == 0x40 at resolve
- At least one enemy slot HP decreased
- Tick function address identified (DISCOVERY)
- Counter increment address identified (DISCOVERY)

OUTPUT:
Save evidence JSON to: evidence/<timestamp>_GF_QUEZACOTL_001.json
Update domain_gf_116quezacotl_invocation.md with discovered tick/counter/completion addresses.

FAILURE HANDLING:
- If command_arg 0x40 triggers wrong GF or crash: document what happened.
  The kernel GF order assumption may be wrong for Quezacotl.
- If GF_CALLBACK_PTR != 0x6c3550: log actual value, decompile it,
  that's the real Quezacotl entry.
- If game crashes: record last EIP, last stack trace, and which phase
  crashed. Quezacotl may have resource dependencies not met in current
  battle state.
```

---

## Prompt 02 — Shiva (0x41)

> **Priority: HIGH** — good static chain but zero runtime evidence (3/10).

```
OBJECTIVE:
Run the first runtime evidence capture for GF Shiva. Static analysis
identified the full chain but nothing has been runtime-validated.

CURRENT KNOWLEDGE:
- Entry: GF_185Shiva_InvokeSummonScript at 0x5c0d50
- Init: same as entry (not separated)
- Tick: au_re_BdlinkTask_5 at 0x5c7f50 (needs rename confirmation)
- Counter: 0x5c7f8b
- Completion: UNKNOWN
- command_arg: 0x41 (65) — UNCONFIRMED
- Family: FamilyA
- No helpers identified, no globals renamed

INJECTION BYTES:
08 80 00 03 41 00 00 01

PRE-INJECTION SETUP:
1. Set enemy HP to 10000 on all live enemy slots.
2. Snapshot all enemy slots and party slots (HP before).

PHASE 1 — SYNC AND INJECT:
1. Sync to battle tick at 0x4842B0.
2. Arm breakpoints:
   - bp_pending_transfer at 0x4847F0
   - bp_gf_cinematic at 0x50B2A0
   - bp_shiva_entry at 0x5c0d50
   - bp_shiva_tick at 0x5c7f50
   - bp_shiva_counter at 0x5c7f8b
3. Inject: 08 80 00 03 41 00 00 01 to 0x1D28D44 via idc.patch_dbg_byte.
4. Read back and verify.

PHASE 2 — PROGRESSIVE OBSERVATION:
5. Continue with wait_until [bp_pending_transfer] (timeout 10s).
6. On hit: log, delete bp_pending_transfer.
7. Continue with wait_until [bp_gf_cinematic, bp_shiva_entry] (timeout 15s).
8. On hit: read GF_CALLBACK_PTR at 0x21DFEC4. Must equal 0x5c0d50.
9. Delete bp_gf_cinematic.
10. Continue with wait_until [bp_shiva_tick, bp_shiva_counter] (timeout 15s).
11. On tick hit: read GF_CALLBACK_PTR again (should still be Shiva's entry).
    Delete bp_shiva_entry.
12. Continue with wait_until [bp_shiva_counter] (timeout 15s).
13. On counter hit: read EIP, get stacktrace. This confirms the tick is running
    and the counter is incrementing.

PHASE 3 — DEEPEN STATIC KNOWLEDGE:
While paused at counter increment:
14. Decompile 0x5c0d50 (entry). Identify:
    a) Init callee (context setup function)
    b) Any global pointers written (sequenceCtxPtr, taskListHead, etc.)
    c) Frame limit / constants set
15. For each global pointer found, read its current value. Log as evidence.
16. Decompile 0x5c7f50 (tick). Identify:
    a) Completion return path (return 2 pattern)
    b) State word read pattern (for completion flag extraction)
    Record completion address.

PHASE 4 — DAMAGE OBSERVATION:
17. Delete bp_shiva_tick, bp_shiva_counter.
18. Arm bp_resolve_damage at 0x48FE20, bp_apply_damage at 0x494410.
19. Continue until damage (timeout 30s).
20. Read action globals at resolve. Verify COMMAND_TYPE_ID == 0xFE.
21. Snapshot enemy slots after damage.

ASSERTIONS:
- bp_pending_transfer hit
- GF_CALLBACK_PTR == 0x5c0d50
- bp_shiva_entry hit
- bp_shiva_tick hit (confirms au_re_BdlinkTask_5 IS the Shiva tick)
- bp_shiva_counter hit
- COMMAND_TYPE_ID == 0xFE
- Enemy HP decreased
- Completion address identified (DISCOVERY)
- Init function separated from entry (DISCOVERY)
- Global pointers identified and named (DISCOVERY)

OUTPUT:
Save evidence JSON to: evidence/<timestamp>_GF_SHIVA_001.json
Update domain_gf_185shiva_invocation.md with:
  - Confirmed runtime chain
  - Init function address (if separated)
  - Completion address
  - Global pointer addresses and proposed names
  - Rename au_re_BdlinkTask_5 → GF_185Shiva_SequenceTick
```

---

## Prompt 03 — Siren (0x43)

> **Priority: HIGH** — tick function completely unresolved (2/10).

```
OBJECTIVE:
Resolve Siren's unknown tick function and complete the invocation chain.
Siren currently has a runtime PASS but only at the pipeline level — the
entry is still named MAG_095_SIREN_SUMMON_SILENT_VOICE, the init points
to a shared sub_8DC540, and the tick is unknown.

CURRENT KNOWLEDGE:
- Entry: MAG_095_SIREN_SUMMON_SILENT_VOICE at 0x739da0
- Init: sub_8DC540 at 0x8dc540 (SHARED with Tonberry — generic init?)
- Tick: UNKNOWN — primary discovery target
- Counter: UNKNOWN
- Completion: UNKNOWN
- command_arg: 0x43 (67) — UNCONFIRMED
- Runtime: PASS (pending transfer + cinematic + resolve/apply damage)
- Effect: Silence infliction + HP reduction

INJECTION BYTES:
08 80 00 03 43 00 00 01

PHASE 1 — THE SUB_8DC540 QUESTION:
Before injection, investigate the shared init:
1. Decompile sub_8DC540 at 0x8dc540.
   This function is the init for BOTH Siren and Tonberry.
   Look for:
   a) Does it take parameters that select the GF? (e.g., a GF ID, a
      function pointer table index)
   b) Does it schedule a tick via BdLinkTask? If so, what function
      pointer does it pass? That's the tick.
   c) Does it reference a dispatch table of function pointers? If so,
      dump the table — it may contain tick functions for multiple GFs.
   d) Does it read from GF_CALLBACK_PTR or a related global to determine
      which GF is active?
2. Log the full decompilation output. This one function may unlock both
   Siren and Tonberry.

PHASE 2 — SYNC AND INJECT:
3. Set enemy HP to 10000 on all live slots.
4. Sync to battle tick at 0x4842B0.
5. Arm breakpoints:
   - bp_pending_transfer at 0x4847F0
   - bp_gf_cinematic at 0x50B2A0
   - bp_siren_entry at 0x739da0
   - bp_shared_init at 0x8dc540
6. Inject: 08 80 00 03 43 00 00 01 to 0x1D28D44.
7. Read back and verify.
8. Continue with wait_until [bp_pending_transfer] (timeout 10s).
9. On hit: delete bp_pending_transfer.
10. Continue with wait_until [bp_gf_cinematic, bp_siren_entry, bp_shared_init]
    (timeout 15s).

PHASE 3 — TRACE THE TICK:
11. When bp_siren_entry or bp_shared_init hits:
    a) Read GF_CALLBACK_PTR at 0x21DFEC4. Must == 0x739da0.
    b) Get stacktrace to confirm call chain.
    c) If stopped at 0x8dc540: read registers, especially arguments
       that might contain GF-specific parameters.
12. If step 1 identified candidate tick functions from the decompilation:
    Arm breakpoints on all candidates.
13. Delete bp_gf_cinematic, bp_siren_entry, bp_shared_init.
14. Continue execution. Watch which candidate tick BP fires repeatedly.
    That's Siren's tick. (timeout 20s, max 5 continue/check cycles)
15. Once identified: look inside the tick for counter increment and
    completion patterns.

PHASE 4 — STATUS VERIFICATION:
16. Arm bp_status_apply at 0x4914E0 and bp_resolve_damage at 0x48FE20.
17. Continue until resolve fires.
18. Read action globals. Verify COMMAND_TYPE_ID == 0xFE.
19. Read HIT_STATUS_1 and HIT_STATUS_2 globals — these should contain
    the Silence bit.
20. Snapshot enemy slots after — verify HP decrease and Silence status
    applied (status_1 bit 4 set on target).

ASSERTIONS:
- GF_CALLBACK_PTR == 0x739da0
- bp_siren_entry hit
- COMMAND_TYPE_ID == 0xFE
- Target enemy gained Silence status (status_1 & 0x10)
- Tick function IDENTIFIED (DISCOVERY)
- Counter increment address IDENTIFIED (DISCOVERY)
- sub_8DC540 behavior DOCUMENTED (DISCOVERY — benefits Tonberry too)

OUTPUT:
Save evidence JSON to: evidence/<timestamp>_GF_SIREN_002.json
Update domain_gf_095siren_invocation.md with tick, counter, completion.
Create note documenting sub_8DC540 dispatch mechanism for Tonberry reuse.
Propose IDA renames: MAG_095_SIREN_SUMMON_SILENT_VOICE → GF_095Siren_InvokeSummonScript.
```

---

## Prompt 04 — Tonberry (0x4E)

> **Priority: HIGH** — tick unresolved, shares init with Siren (2/10).

```
OBJECTIVE:
Resolve Tonberry's unknown tick function. If Prompt 03 (Siren) has
already run and documented sub_8DC540, USE those findings as a starting
point.

CURRENT KNOWLEDGE:
- Entry: MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE at 0x762360
- Init: sub_8DC540 at 0x8dc540 (SHARED with Siren)
- Tick: UNKNOWN
- Counter: UNKNOWN
- Completion: UNKNOWN
- command_arg: 0x4E (78) — UNCONFIRMED
- Runtime: PASS (pending transfer + shared damage path only)

INJECTION BYTES:
08 80 00 03 4E 00 00 01

STRATEGY:
If Siren's run already decompiled sub_8DC540 and found a dispatch
mechanism (e.g., function pointer table, GF ID parameter), use the same
mechanism to predict Tonberry's tick. If not, repeat the sub_8DC540
investigation.

PHASE 1 — CHECK PRIOR SIREN FINDINGS:
1. If sub_8DC540 decompilation is available from a previous run, review it.
   If it uses a dispatch table, look up Tonberry's index in that table.
   If it takes a GF ID parameter, predict what value Tonberry passes.

PHASE 2 — SYNC AND INJECT:
2. Set enemy HP to 10000 on all live slots.
3. Sync to battle tick.
4. Arm breakpoints:
   - bp_pending_transfer at 0x4847F0
   - bp_gf_cinematic at 0x50B2A0
   - bp_tonberry_entry at 0x762360
   - bp_shared_init at 0x8dc540
   - (any candidate tick BPs from Siren findings)
5. Inject: 08 80 00 03 4E 00 00 01 to 0x1D28D44.
6. Read back and verify.

PHASE 3 — PROGRESSIVE OBSERVATION:
7. Continue with wait_until [bp_pending_transfer] (timeout 10s). Delete on hit.
8. Continue with wait_until [bp_gf_cinematic, bp_tonberry_entry] (timeout 15s).
9. Read GF_CALLBACK_PTR at 0x21DFEC4. Must == 0x762360.
10. If stopped at shared_init: read arguments, compare with Siren's.
11. Decompile 0x762360 if not already done. Look for tick scheduling.
12. Arm candidate tick BPs. Continue and identify repeating BP.

PHASE 4 — DAMAGE OBSERVATION:
13. Standard damage pipeline verification (same as other prompts).
14. Snapshot enemy HP before/after.
15. Tonberry's Chef's Knife is a special attack — document the damage
    pattern (single target instant kill? fixed damage? level-based?).

ASSERTIONS:
- GF_CALLBACK_PTR == 0x762360
- bp_tonberry_entry hit
- COMMAND_TYPE_ID == 0xFE
- Tick function IDENTIFIED (DISCOVERY)
- Damage behavior documented

OUTPUT:
Save evidence JSON to: evidence/<timestamp>_GF_TONBERRY_001.json
Update domain_gf_090tonberry_invocation.md.
Propose rename: MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE → GF_090Tonberry_InvokeSummonScript.
```

---

## Prompt 05 — Pandemona (0x48)

> **Priority: MEDIUM** — excellent static chain, just needs runtime confirmation.

```
OBJECTIVE:
Runtime-validate the statically reconstructed Pandemona chain and confirm
the hypothesized command_arg 0x48.

CURRENT KNOWLEDGE:
- Entry: GF_200Pandemona_InvokeSummonScript at 0x6ed250
- Init: GF_200Pandemona_InitSummonContext at 0x6ed260
- Tick: GF_200Pandemona_SequenceTick at 0x6ed350
- Driver: GF_200Pandemona_SequenceTaskDriver at 0x6ed900
- Counter: 0x6ed755
- Completion: 0x6ed749
- command_arg: 0x48 (72) — hypothesized
- Family: FamilyA, confidence high (95)
- IDA renames: DONE (entry, init, tick, driver, 3 helpers, globals 0x2556258-0x25562f4)

INJECTION BYTES:
08 80 00 03 48 00 00 01

PHASE 1 — SYNC AND INJECT:
1. Set enemy HP to 10000.
2. Snapshot enemy + party slots.
3. Sync to battle tick.
4. Arm breakpoints:
   - bp_pending_transfer at 0x4847F0
   - bp_pandemona_entry at 0x6ed250
   - bp_pandemona_init at 0x6ed260
   - bp_pandemona_tick at 0x6ed350
   - bp_pandemona_counter at 0x6ed755
   - bp_pandemona_completion at 0x6ed749
5. Inject: 08 80 00 03 48 00 00 01 to 0x1D28D44.
6. Read back and verify.

PHASE 2 — PROGRESSIVE OBSERVATION (Ifrit-style):
7. Continue with wait_until [bp_pending_transfer] (timeout 10s). Delete on hit.
8. Continue with wait_until [bp_pandemona_entry, bp_pandemona_init] (timeout 15s).
9. Read GF_CALLBACK_PTR. Must == 0x6ed250.
10. Delete bp_pandemona_entry once confirmed.
11. Continue with wait_until [bp_pandemona_tick, bp_pandemona_counter] (timeout 15s).
12. On tick hit: read GF_CALLBACK_PTR again (still 0x6ed250). Delete entry/init BPs.
13. On counter hit: read EIP, stacktrace. Confirm tick → counter chain.

PHASE 3 — INTERNAL STATE:
14. While paused at counter:
    Read global pointers in range 0x2556258-0x25562f4.
    Log which are non-zero (confirms context initialized).
15. Delete tick/counter BPs.

PHASE 4 — DAMAGE:
16. Arm bp_resolve_damage at 0x48FE20.
17. Continue until resolve (timeout 30s).
18. Read action globals. Verify COMMAND_TYPE_ID == 0xFE, CMD_ID == 0x48.
19. Snapshot enemy slots after.

ASSERTIONS:
- GF_CALLBACK_PTR == 0x6ed250 ✓ (confirms entry)
- bp_pandemona_entry hit ✓
- bp_pandemona_init hit ✓ (confirms init separated from entry)
- bp_pandemona_tick hit ✓
- bp_pandemona_counter hit ✓
- COMMAND_TYPE_ID == 0xFE ✓
- CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID == 0x48 ✓ (confirms command_arg)
- Context globals in 0x2556258-0x25562f4 are non-zero ✓
- Enemy HP decreased ✓

OUTPUT:
Save evidence JSON to: evidence/<timestamp>_GF_PANDEMONA_001.json
Update domain_gf_200pandemona_invocation.md: change "hypothesized" to "confirmed".
Promote confidence to high (98) if all assertions pass.
```

---

## Prompt 06 — Carbuncle (0x46)

> **Priority: MEDIUM** — same situation as Pandemona.

```
OBJECTIVE:
Runtime-validate Carbuncle's static chain. Carbuncle is a support GF —
it applies Reflect on the party, not damage on enemies. Adjust
observations accordingly.

CURRENT KNOWLEDGE:
- Entry: GF_277Carbuncle_InvokeSummonScript at 0x680c50
- Init: GF_277Carbuncle_InitSummonContext at 0x680c80
- Tick: GF_277Carbuncle_SequenceTick at 0x680df0
- Driver: GF_277Carbuncle_SequenceTaskDriver at 0x681630
- Counter: 0x6811c8
- Completion: 0x6811be (return 2 when frame >= 283)
- command_arg: 0x46 (70) — hypothesized
- Family: FamilyA, confidence high (95)
- IDA renames: DONE (entry, init, tick, driver, 11 helpers including
  ClearReflectFlags, TargetAuraTaskTick, etc.)

INJECTION BYTES:
08 80 00 03 46 00 00 01

SPECIAL CONSIDERATION — SUPPORT GF:
Carbuncle applies Reflect to the party. This means:
- NO enemy HP change expected
- Party slots' status_2 should gain the Reflect bit after completion
- The damage pipeline may still fire with a curative/support path

PHASE 1 — SYNC AND INJECT:
1. Snapshot party slots (status_1, status_2 before).
2. Sync to battle tick.
3. Arm breakpoints:
   - bp_pending_transfer at 0x4847F0
   - bp_carbuncle_entry at 0x680c50
   - bp_carbuncle_init at 0x680c80
   - bp_carbuncle_tick at 0x680df0
   - bp_carbuncle_counter at 0x6811c8
4. Inject: 08 80 00 03 46 00 00 01 to 0x1D28D44.
5. Read back and verify.

PHASE 2 — PROGRESSIVE OBSERVATION:
6. Same progressive BP flow as Pandemona prompt.
7. Read GF_CALLBACK_PTR. Must == 0x680c50.
8. Confirm entry → init → tick → counter chain fires.

PHASE 3 — REFLECT STATUS OBSERVATION:
9. After the GF sequence completes (counter or completion BP hit),
   arm bp_status_apply at 0x4914E0.
10. Continue until status application fires (timeout 30s).
11. Read HIT_STATUS_2 — should contain Reflect bit.
12. After status apply: snapshot party slots (status_2 after).
13. Compute delta: which bits changed? Document the Reflect bit value.

PHASE 4 — INTERNAL STATE:
14. Read global pointers in range 0x2508110-0x25081f8.
15. Verify non-zero.

ASSERTIONS:
- GF_CALLBACK_PTR == 0x680c50
- bp_carbuncle_entry, init, tick, counter all hit
- COMMAND_TYPE_ID == 0xFE
- CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID == 0x46
- Party status_2 changed (Reflect bit set)
- Context globals in 0x2508110-0x25081f8 non-zero

OUTPUT:
Save evidence JSON to: evidence/<timestamp>_GF_CARBUNCLE_001.json
Update domain_gf_277carbuncle_invocation.md.
Document the exact Reflect bit value in status_2 (fills a gap in
domain_status_application_pipeline.md too).
```

---

## Prompt 07 — Doomtrain (0x4B)

> **Priority: MEDIUM** — has runtime PASS but entry/counter probes missed.

```
OBJECTIVE:
Re-run Doomtrain with all probes armed. Previous GF_DOOMTRAIN_001 passed
at the pipeline level but missed entry and counter breakpoints. This run
aims for full 7/7 probe coverage, plus deeper chain investigation.

CURRENT KNOWLEDGE:
- Entry: GF_191Doomtrain_InvokeSummonScript at 0x63e730
- Tick: GF_191Doomtrain_SequenceTick at 0x6472c0
- Counter: 0x6472d1
- Completion: UNKNOWN
- command_arg: 0x4B (75) — UNCONFIRMED
- Previous evidence: pending transfer + cinematic + apply-damage confirmed.
  Status effect: broad negative status set + HP reduction.

INJECTION BYTES:
08 80 00 03 4B 00 00 01

PHASE 1 — SYNC AND INJECT:
1. Set enemy HP to 10000 (Doomtrain may kill weak enemies before
   all probes fire).
2. Snapshot all slots.
3. Sync to battle tick.
4. Arm ALL breakpoints:
   - bp_pending_transfer at 0x4847F0
   - bp_doomtrain_entry at 0x63e730
   - bp_doomtrain_tick at 0x6472c0
   - bp_doomtrain_counter at 0x6472d1
5. Inject: 08 80 00 03 4B 00 00 01.

PHASE 2 — PROGRESSIVE OBSERVATION:
6. Continue → wait bp_pending_transfer → delete.
7. Continue → wait [bp_doomtrain_entry] (timeout 15s).
8. On entry hit: read GF_CALLBACK_PTR. Must == 0x63e730.
   Decompile 0x63e730 to find init separation and helpers.
   Delete entry BP.
9. Continue → wait [bp_doomtrain_tick, bp_doomtrain_counter] (timeout 15s).
10. On tick hit: confirm, delete tick BP.
11. Continue → wait bp_doomtrain_counter (timeout 15s).
12. On counter hit: read EIP, stacktrace.
    Decompile tick (0x6472c0) to find completion site.

PHASE 3 — STATUS MASS-APPLICATION:
13. Arm bp_status_apply at 0x4914E0, bp_resolve at 0x48FE20.
14. Continue until resolve.
15. Read action globals + HIT_STATUS_1 + HIT_STATUS_2.
    Doomtrain applies many statuses at once — capture the full bitmasks.
16. Continue through status application. Log how many times bp_status_apply
    fires (once per target? once per status?).
17. Snapshot all enemy slots after. Compute status delta for each.

ASSERTIONS:
- bp_doomtrain_entry hit (was MISSED before — primary goal)
- bp_doomtrain_counter hit (was MISSED before)
- GF_CALLBACK_PTR == 0x63e730
- COMMAND_TYPE_ID == 0xFE
- Multiple enemy status bits changed
- Completion address IDENTIFIED (DISCOVERY)

OUTPUT:
Save evidence JSON to: evidence/<timestamp>_GF_DOOMTRAIN_002.json
Update domain_gf_191doomtrain_invocation.md with completion site and init.
Document Doomtrain's full HIT_STATUS_1/HIT_STATUS_2 bitmask.
```

---

## Prompt 08 — Cerberus (0x49)

```
OBJECTIVE:
Re-run Cerberus with full probe coverage. Previous run confirmed
Double + Triple application but missed entry/counter probes.

CURRENT KNOWLEDGE:
- Entry: 0xb0c1a0, Tick: 0xb0c820, Counter: 0xb0c82a, Completion: 0xb0ca31
- Previous evidence: party status_2 changed 0x40000002 → 0x40060002
- command_arg: 0x49 (73) — UNCONFIRMED

INJECTION BYTES:
08 80 00 03 49 00 00 01

Follow same structure as Doomtrain prompt (07), but:
- Cerberus is a SUPPORT GF — observe party slots, not enemy slots.
- Verify status_2 delta matches previous observation (bits 17+18 set).
- Document exact Double bit and Triple bit in status_2.
- Decompile entry to find init separation and helpers.
- Decompile tick to confirm completion at 0xb0ca31.

ASSERTIONS:
- All 4 probes hit (entry, tick, counter, completion)
- Party status_2 gains Double + Triple bits
- COMMAND_TYPE_ID == 0xFE, CMD_ID == 0x49

OUTPUT:
evidence/<timestamp>_GF_CERBERUS_002.json
```

---

## Prompt 09 — Brothers (0x44)

```
OBJECTIVE:
Deepen Brothers coverage. Has tick/counter/completion but no init separation,
no helpers, no globals, entry probe missed.

CURRENT KNOWLEDGE:
- Entry: 0xaf4520, Tick: 0xaf4b90, Counter: 0xaf4b9a, Completion: 0xaf4da1
- command_arg: 0x44 (68) — UNCONFIRMED

INJECTION BYTES:
08 80 00 03 44 00 00 01

Follow same structure as Pandemona prompt (05), with additions:
- Decompile entry (0xaf4520) to find init function and helpers.
- Decompile tick (0xaf4b90) to confirm completion at 0xaf4da1.
- Identify and read global pointers.
- Set enemy HP to 10000, observe damage.

ASSERTIONS:
- All probes hit
- Init function identified (DISCOVERY)
- Helper functions identified (DISCOVERY)
- GF_CALLBACK_PTR == 0xaf4520

OUTPUT:
evidence/<timestamp>_GF_BROTHERS_001.json
```

---

## Prompt 10 — Leviathan (0x47)

```
OBJECTIVE:
Deepen Leviathan coverage. Tick still named isLeviathanFrame (needs
proper rename). Entry probe was missed.

CURRENT KNOWLEDGE:
- Entry: 0xb58080, Tick: 0xb586f0 (isLeviathanFrame), Counter: 0xb586fa,
  Completion: 0xb58901
- command_arg: 0x47 (71) — UNCONFIRMED

INJECTION BYTES:
08 80 00 03 47 00 00 01

Follow same structure as Brothers prompt (09).
Additional: propose rename isLeviathanFrame → GF_006Leviathan_SequenceTick.

OUTPUT:
evidence/<timestamp>_GF_LEVIATHAN_002.json
```

---

## Prompt 11 — Alexander (0x4A)

```
OBJECTIVE:
Deepen Alexander. Entry/tick probes missed, only counter hit.

CURRENT KNOWLEDGE:
- Entry: 0xaffca0, Tick: 0xb00310, Counter: 0xb0031a, Completion: 0xb00521
- command_arg: 0x4A (74) — UNCONFIRMED

INJECTION BYTES:
08 80 00 03 4A 00 00 01

Follow same structure as Brothers prompt (09).

OUTPUT:
evidence/<timestamp>_GF_ALEXANDER_002.json
```

---

## Prompt 12 — Bahamut (0x4C)

```
OBJECTIVE:
Deepen Bahamut. Entry/tick missed, only counter hit.

CURRENT KNOWLEDGE:
- Entry: 0xb189a0, Tick: 0xb19010, Counter: 0xb1901a, Completion: 0xb19221
- command_arg: 0x4C (76) — UNCONFIRMED

INJECTION BYTES:
08 80 00 03 4C 00 00 01

Follow same structure as Brothers prompt (09).

OUTPUT:
evidence/<timestamp>_GF_BAHAMUT_002.json
```

---

## Prompt 13 — Eden (0x4F)

```
OBJECTIVE:
Deepen Eden. Entry/cinematic missed, tick/counter hit.
WARNING: Eden has an extremely long cinematic sequence. Increase all
timeouts to 120s.

CURRENT KNOWLEDGE:
- Entry: 0xae2dd0, Tick: 0xae3470, Counter: 0xae347a, Completion: 0xae3681
- command_arg: 0x4F (79) — UNCONFIRMED

INJECTION BYTES:
08 80 00 03 4F 00 00 01

Follow same structure as Brothers prompt (09), but:
- ALL timeouts increased to 120000ms (Eden's cinematic is ~60+ seconds).
- Be patient with wait_until cycles.

OUTPUT:
evidence/<timestamp>_GF_EDEN_002.json
```

---

## Prompt 14 — Cactuar (0x4D)

```
OBJECTIVE:
Deepen Cactuar. Entry probe missed. Tick/counter hit.

CURRENT KNOWLEDGE:
- Entry: 0x5a8750, Tick: 0x5aa3a0, Counter: 0x5aa3b1, Completion: UNKNOWN
- command_arg: 0x4D (77) — UNCONFIRMED

INJECTION BYTES:
08 80 00 03 4D 00 00 01

Follow same structure as Brothers prompt (09).
Additional: decompile tick to find completion site (currently missing).

OUTPUT:
evidence/<timestamp>_GF_CACTUAR_002.json
```

---

## Prompt 15 — Diablos (re-run for full probes)

```
OBJECTIVE:
Re-run Diablos to hit the entry/counter probes that were missed in
GF_DIABLOS_001. Diablos has confirmed command_arg 0x45 and runtime PASS,
but entry (0x654210) and counter (0x65459d) were armed but not hit.

CURRENT KNOWLEDGE:
- Entry: GF_Diablo_SummonScript_Init at 0x654210
- Counter: 0x65459d
- command_arg: 0x45 (69) — CONFIRMED
- Previous: COMMAND_TYPE_ID=0xFE, CMD_ID=0x45, gravity damage confirmed

INJECTION BYTES:
08 80 00 03 45 00 00 01

SPECIAL NOTE:
The entry probe being missed suggests the function at 0x654210 may NOT
be the actual entry. The real entry may be the GF_CALLBACK_PTR value
observed during cinematic dispatch. Check GF_CALLBACK_PTR carefully.

PHASE 1:
1. Sync, inject, observe pending transfer.
2. On cinematic hit: read GF_CALLBACK_PTR immediately.
   If it != 0x654210, the REAL entry is the ptr value.
   Decompile the real entry to find the chain.

Follow same structure as Doomtrain prompt (07) otherwise.

OUTPUT:
evidence/<timestamp>_GF_DIABLOS_002.json
```

---

## Prompt 16 — Odin (SPECIAL — auto-trigger investigation)

> **Priority: HIGH** — crashes on injection. Different approach needed.

```
OBJECTIVE:
Investigate Odin's invocation mechanism WITHOUT injecting it through the
pending action buffer. Odin is a special GF that auto-triggers at battle
start with a random chance. Standard injection crashes the game.

CURRENT KNOWLEDGE:
- Entry: GF_187Odin_InvokeSummonScript at 0x6472e0
- Tick: au_re_BdlinkTask_36 at 0x64dd50
- Counter: 0x64dd61
- Previous injection: CRASHED — game enters bad state
- Family: FamilyA

STRATEGY — DO NOT INJECT. Investigate structurally.

PHASE 1 — FIND WHO CALLS ODIN:
1. Get all xrefs TO 0x6472e0 (GF_187Odin_InvokeSummonScript).
   List every caller. The standard GF cinematic dispatch is one — but
   there should be ANOTHER caller that's the auto-trigger path.
2. For each non-cinematic caller: decompile it. Look for:
   a) RNG call (random chance check)
   b) Battle-start condition (runs during init, not during gameplay loop)
   c) Party/GF availability check (is Odin junctioned?)
3. Document the auto-trigger chain.

PHASE 2 — FIND GILGAMESH CONNECTION:
4. Get all xrefs TO 0x6472e0 and nearby functions.
5. Search for string references: "odin", "gilgamesh", "zantetsuken",
   "excalibur", "excalipur" in the binary.
6. Odin is replaced by Gilgamesh after disc 3. There must be a
   conditional branch somewhere that checks disc/story progress.
   Find it.

PHASE 3 — UNDERSTAND THE CRASH:
7. The crash on standard injection likely happens because Odin's
   cinematic expects specific battle-start state that doesn't exist
   during mid-battle injection (e.g., a pre-allocated camera context,
   specific animation state, or the "instant kill all enemies" effect
   requiring valid target states).
8. Decompile 0x6472e0 thoroughly. Look for:
   a) What globals does it read at the start?
   b) Does it assume a specific battle phase?
   c) Does it dereference any pointer that might be NULL mid-battle?

PHASE 4 — PASSIVE OBSERVATION (if possible):
9. If you can identify the auto-trigger condition and it involves RNG,
   try to force it: find the RNG address and write a value that
   guarantees Odin triggers on the next battle.
10. Set BP on 0x6472e0, then let a new battle start naturally.
    Observe the entry from the auto-trigger path.

ASSERTIONS:
- Auto-trigger caller function IDENTIFIED
- Trigger condition DOCUMENTED (RNG + GF availability)
- Gilgamesh connection FOUND or ruled out
- Crash root cause IDENTIFIED

OUTPUT:
evidence/<timestamp>_GF_ODIN_STRUCTURAL_001.json
Update domain_gf_187odin_invocation.md with auto-trigger chain.
```

---

## Prompt 17 — Gilgamesh (SPECIAL — discovery from scratch)

```
OBJECTIVE:
Discover Gilgamesh's entry point and invocation mechanism from scratch.
Gilgamesh replaces Odin on disc 3+ and uses BattleActionSequence_Tick_Special.

CURRENT KNOWLEDGE:
- BattleActionSequence_Tick_Special at 0x50B830 documented as handling
  "e.g., Gilgamesh"
- No entry, init, tick, or other addresses known
- Gilgamesh is NOT in the junctionable GF table
- Cannot be injected via pending action buffer

STRATEGY — STRUCTURAL DISCOVERY:

PHASE 1 — DECOMPILE THE SPECIAL TICK:
1. Decompile BattleActionSequence_Tick_Special at 0x50B830.
2. Identify:
   a) How does it select which special sequence to run?
      (switch on a global? callback pointer? action type?)
   b) What callees does it have? List ALL.
   c) Does it reference the same GF_CALLBACK_PTR (0x21DFEC4) or
      a different dispatch pointer?
3. Get callees of 0x50B830.

PHASE 2 — FIND GILGAMESH FUNCTIONS:
4. Search for string references: "gilgamesh", "excalibur", "excalipur",
   "masamune", "zantetsuken" in the binary.
5. If callees from step 3 include recognizable names, investigate.
6. Look for functions near Odin's address range (0x6472e0 area) —
   Gilgamesh may be compiled nearby.

PHASE 3 — FIND THE ODIN→GILGAMESH SWITCH:
7. Decompile the Odin auto-trigger caller (from Prompt 16).
8. There must be a branch: if disc < 3, dispatch Odin; else dispatch
   Gilgamesh. Find this conditional.
9. Alternatively: find xrefs to Odin's entry and see if any caller
   also references another function conditionally.

PHASE 4 — TRACE THE SPECIAL DISPATCH:
10. Get xrefs TO 0x50B830 — who installs/calls the Special tick?
    This is the action sequence selector.
11. Decompile that selector. Its switch/dispatch logic covers ALL
    action sequence types (Generic, GF_Cinematic, Special, etc.).
    Gilgamesh's routing will be visible here.

ASSERTIONS:
- Gilgamesh entry function IDENTIFIED
- Dispatch mechanism through _Tick_Special DOCUMENTED
- Odin→Gilgamesh conditional FOUND
- Action sequence selector function DOCUMENTED

OUTPUT:
evidence/<timestamp>_GF_GILGAMESH_DISCOVERY_001.json
Create domain_gf_gilgamesh_invocation.md.
```

---

## Prompt 18 — Phoenix (SPECIAL — auto-revive discovery)

```
OBJECTIVE:
Discover Phoenix's entry point and trigger mechanism. Phoenix auto-triggers
when all party members are KO'd and a Phoenix Pinion is in inventory.

CURRENT KNOWLEDGE:
- Nothing. Zero addresses known.
- Phoenix is NOT in the junctionable GF table.
- Triggers on party wipe condition.

STRATEGY — FIND THE GAME-OVER BRANCH:

PHASE 1 — FIND THE PARTY-WIPE CHECK:
1. The function howManyCharaNotDeadOrPetrify at 0x4860A0 checks if any
   party members are alive. This is called during the battle loop.
2. Get xrefs FROM 0x4860A0 — who calls it?
3. For each caller: decompile. Look for a branch that says
   "if nobody alive AND phoenix pinion in inventory → trigger Phoenix
   instead of game over."

PHASE 2 — FIND PHOENIX BY STRING:
4. Search for string references: "phoenix", "pinion" in the binary.
5. Search for item ID references: the Phoenix Pinion has an item ID
   in the kernel. If you can identify it, search for that constant.

PHASE 3 — FIND PHOENIX BY CALLBACK REGISTRATION:
6. Get ALL xrefs TO GF_CALLBACK_PTR (0x21DFEC4).
   Every write-xref is a site that arms a GF cinematic.
   Phoenix must write its callback here before its cinematic plays.
7. List every distinct value written. Cross-reference against known
   GF entries. Any unknown value is a candidate for Phoenix (or
   other specials).

PHASE 4 — IF FOUND, DOCUMENT THE CHAIN:
8. Once Phoenix's entry is identified, decompile it.
9. Trace the standard pattern: entry → init → tick → counter.
10. Document the trigger condition fully.

ASSERTIONS:
- Phoenix entry function IDENTIFIED
- Trigger condition DOCUMENTED (party wipe + inventory check)
- Phoenix Pinion item ID IDENTIFIED
- Callback pointer value for Phoenix IDENTIFIED

OUTPUT:
Create domain_gf_phoenix_invocation.md.
```

---

## Prompt 19 — Chocobo/Boko (SPECIAL — PocketStation companion)

```
OBJECTIVE:
Discover Chocobo/Boko's entry point. Boko is summoned via the
GF Chocobo item obtained from ChocoWorld (PocketStation minigame).

CURRENT KNOWLEDGE:
- Nothing. Zero addresses known.
- Triggered by using a specific item in battle, NOT via GF command.
- Has multiple attack variants depending on Boko's level.

STRATEGY:

PHASE 1 — FIND BY ITEM USAGE PATH:
1. The item command type is command_id = 0x04. Boko summon items
   (Gysahl Greens or ChocoWorld items) go through the item path.
2. Search for string references: "chocobo", "boko", "choco",
   "gysahl" in the binary.
3. Look in the BattleAction_ResolveAndApplyDamage switch for
   command_id == 0x04 callees that dispatch special item effects.

PHASE 2 — FIND BY CALLBACK PTR:
4. Same as Phoenix Prompt 18, Phase 3: enumerate all values written
   to GF_CALLBACK_PTR. Unknown values are candidates.

PHASE 3 — FIND COMPANION DISPATCH:
5. MiniMog, Moomba, and Boko are all PocketStation companions.
   They likely share a dispatch mechanism.
6. If any one is found, its caller probably handles the others too.

ASSERTIONS:
- Boko entry function IDENTIFIED (or dispatch mechanism)
- Item-to-GF routing DOCUMENTED

OUTPUT:
Create domain_gf_chocobo_boko_invocation.md.
```

---

## Prompt 20 — Bulk Kernel GF ID Confirmation

> **Run this FIRST before any injection prompts to confirm all command_arg values.**

```
OBJECTIVE:
Dump the K_GF_JUNCTIONABLE kernel table to confirm all 16 command_arg
values in one shot, instead of discovering them one at a time via
breakpoint capture.

STRATEGY:
1. From battle_action_resolve.c, GF case (cmd == 254):
   int gf_index = action_id - 64;
   K_GF_JUNCTIONABLE[gf_index]

2. Find the base address of K_GF_JUNCTIONABLE in IDA:
   a) Go to BattleAction_ResolveAndApplyDamage at 0x48FE20.
   b) Find the case 254 branch.
   c) The array access computes: base + (action_id - 64) * sizeof(KernelGFJunctionable).
   d) Read the base address from the instruction operand.
   e) Read sizeof(KernelGFJunctionable) from the stride.

3. Once base and stride are known, read all 16 entries:
   for gf_index in range(16):
     addr = base + gf_index * stride
     read element, statusAttackEnabler, statuses0, statuses1, gfPower, etc.

4. Map gf_index to GF name using standard order:
   0=Quezacotl, 1=Shiva, 2=Ifrit, 3=Siren, 4=Brothers,
   5=Diablos, 6=Carbuncle, 7=Leviathan, 8=Pandemona,
   9=Cerberus, 10=Alexander, 11=Doomtrain, 12=Bahamut,
   13=Cactuar, 14=Tonberry, 15=Eden

5. For each entry, command_arg = 64 + gf_index (= 0x40 + gf_index).

6. Also extract the full KernelGFJunctionable struct per GF:
   - attackType, gfPower, attackFlags, element
   - statusAttackEnabler, statuses0, statuses1
   This gives us the status payload every GF carries (fills the
   HIT_STATUS_1/2 population in domain_status_application_pipeline.md).

OUTPUT:
Create kernel_gf_junctionable_table.md with the complete 16-entry dump.
Update battle_main_loop.md GF command_arg table with all 16 values.
Confirm or correct the hypothesized values for Pandemona (0x48) and
Carbuncle (0x46).
```

---

## Execution Order Recommendation

```
Phase 0 (setup):         Prompt 20 — Bulk kernel table dump
Phase 1 (critical gaps): Prompt 01 (Quezacotl), 03 (Siren), 04 (Tonberry)
Phase 2 (static→runtime): Prompt 05 (Pandemona), 06 (Carbuncle)
Phase 3 (re-runs):       Prompt 02 (Shiva), 07 (Doomtrain), 08 (Cerberus)
Phase 4 (batch lift):    Prompts 09-14 (Brothers→Cactuar)
Phase 5 (re-run):        Prompt 15 (Diablos)
Phase 6 (specials):      Prompts 16 (Odin), 17 (Gilgamesh), 18 (Phoenix)
Phase 7 (companions):    Prompt 19 (Chocobo/Boko)
```