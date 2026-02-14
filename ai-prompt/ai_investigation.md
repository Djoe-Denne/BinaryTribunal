GF Runtime Evidence Capture — AI Agent Prompts
Preamble: Shared Context for All Prompts
Every prompt below assumes the agent has:

A live IDA Pro session with the FF8 process paused in battle
MCP server access at http://127.0.0.1:13337/mcp
The ff8re framework with actions.py (sync_to_battle_tick, write_pending_action, snapshot_slot, read_action_globals, set_enemy_hp_all_10000)
Write access via idc.patch_dbg_byte (NOT ida_dbg.write_dbg_memory — the latter silently fails on the active flag byte)

Critical Lessons (from Ifrit chronicle — apply to ALL runs)

Use idc.patch_dbg_byte for all pending buffer writes. ida_dbg.write_dbg_memory silently fails on offset +7 (active flag).
Progressive breakpoint deletion — delete each BP after it serves its purpose. Per-frame BPs (ATB tick, pending transfer) cause frame-traps if left active.
Assert on memory state, not BP timing — a callback pointer value is deterministic proof. A BP "hit" depends on the runner catching it at the right moment.
Read memory AFTER the function executes, not at entry — reading at function entry catches pre-execution state. Read one level deeper for post-execution state.
Sync before injection — always sync to a battle tick boundary before writing to the pending action buffer.
Verify writes by reading back — after injecting, read the pending buffer back and log the readback in evidence.

Shared Addresses
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
Kernel GF ID Table (command_arg values)
Derived from K_GF_JUNCTIONABLE[command_arg - 64] indexing. Ifrit (0x42) and Diablos (0x45) are confirmed. Others follow the standard FF8 kernel GF order:
Quezacotl  = 0x40 (64)     Diablos    = 0x45 (69) ✅
Shiva      = 0x41 (65)     Carbuncle  = 0x46 (70)
Ifrit      = 0x42 (66) ✅  Leviathan  = 0x47 (71)
Siren      = 0x43 (67)     Pandemona  = 0x48 (72)
Brothers   = 0x44 (68)     Cerberus   = 0x49 (73)
Alexander  = 0x4A (74)     Cactuar    = 0x4D (77)
Doomtrain  = 0x4B (75)     Tonberry   = 0x4E (78)
Bahamut    = 0x4C (76)     Eden       = 0x4F (79)
Injection Template (all junctionable GFs)
Raw bytes at 0x1D28D44: 08 80 00 03 XX 00 00 01
                         ^^^^       ^^          ^^
                    target_mask  cmd_arg     active

Where XX = the command_arg from the table above.
Standard Evidence Stages
Every junctionable GF prompt follows this 4-stage evidence model:
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

---

GF_SIREN_002 — Resolve Siren tick + shared init dispatch

OBJECTIVE:
Resolve Siren's unknown tick function and complete the invocation chain.
Siren currently has a runtime PASS but only at the pipeline level — the
entry is still named MAG_095_SIREN_SUMMON_SILENT_VOICE, the init points
to a shared sub_8DC540, and the tick was previously unknown.

CURRENT KNOWLEDGE (STATIC + RUNTIME):
- Entry: MAG_095_SIREN_SUMMON_SILENT_VOICE at 0x739DA0
- Init: BdLinkTask_CreateAndInitContext at 0x8DC540 (SHARED with Tonberry — shared BdLink task constructor)
- Tick: sub_739F40 at 0x739F40 (passed as arg2 into BdLinkTask_CreateAndInitContext)
- Counter increment: 0x73A0A5 (primary), also 0x73A0A1
- Completion: 0x73A0BD (return 2), completion helper call at 0x73A0B5
- command_arg: 0x43 (67) — validated via runtime action globals in GF_SIREN_001
- Runtime: PASS (transfer + cinematic + resolve/apply damage)
- Effect: Silence infliction + HP reduction

INJECTION BYTES:
08 80 00 03 43 00 00 01

PHASE 1 — THE BdLinkTask_CreateAndInitContext QUESTION (STATIC):
1. Decompile BdLinkTask_CreateAndInitContext at 0x8DC540.
   Look for:
   a) Tick selection via parameters: arg2 is the tick function pointer.
   b) Calls BdLinkTask(dst_ctx, tick_fn) and returns task/context pointer.
2. Decompile Siren entry at 0x739DA0:
   - Confirms call: BdLinkTask_CreateAndInitContext(dword_257FA80, (int)sub_739F40, 100, 0).
3. Decompile Siren tick at 0x739F40:
   - Counter inc sites: 0x73A0A1 / 0x73A0A5
   - Completion return 2 site: 0x73A0BD

PHASE 2 — SYNC AND INJECT (RUNTIME):
4. Set enemy HP to 10000 on all live slots.
5. Sync to battle tick at 0x4842B0.
6. Arm breakpoints:
   - bp_pending_transfer at 0x4847F0
   - bp_gf_cinematic at 0x50B2A0
   - bp_siren_entry at 0x739DA0
   - bp_shared_init at 0x8DC540
   - bp_siren_tick at 0x739F40
   - bp_siren_counter_inc at 0x73A0A5
   - bp_siren_completion_ret2 at 0x73A0BD
7. Inject pending entry 0 (verify readback):
   - 08 80 00 03 43 00 00 01 at 0x1D28D44

PHASE 3 — DISPATCH / TICK PROOF:
8. On first probe hit, read GF_CALLBACK_PTR at 0x21DFEC4. Must == 0x739DA0.
9. Capture stacktrace + registers at first probe and at counter increment.

PHASE 4 — STATUS VERIFICATION:
10. Arm bp_status_apply at 0x4914E0 and bp_resolve_damage at 0x48FE20.
11. Continue until resolve fires; read action globals:
    - COMMAND_TYPE_ID == 0xFE
    - HIT_STATUS_1 contains Silence bit (0x10)
12. Snapshot enemy slots after and verify HP decrease + Silence status applied.

OUTPUT:
- Evidence JSON: `evidence/<timestamp>_GF_SIREN_002.json`
- Update: `docs/tech/battle/G-Force/domain_gf_095siren_invocation.md`
- Note: `docs/tech/battle/G-Force/note_shared_init_sub_8dc540.md`
- Propose IDA renames:
  - MAG_095_SIREN_SUMMON_SILENT_VOICE -> GF_095Siren_InvokeSummonScript
  - sub_739F40 -> GF_095Siren_SequenceTick