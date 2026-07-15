# FF8 Live Battle Loop Follow-up Prompt Pack

## Setup For You

- Assume IDA is attached to a live FF8 process already paused in active combat.
- Keep one save before encounter and one save/state in stable active tick (`mode_StateGlobal == 3`, `mode3_substep == 3`, `mode3_subsub_step == 1`, `mode_3_subsubsubstep == 4`).
- Prefer reproducible automation through `ff8re` and `binaryTribunal` before manual debugger stepping.
- When an in-game action is required (menu confirm, target selection, held input, timing), explicitly ask the user to perform it and resume capture with pre-armed breakpoints/watchpoints.
- For pending-action injection, use `idc.patch_dbg_byte` and always verify readback.

## Purpose

These prompts are new live-runtime follow-ups focused on remaining battle-loop uncertainty after static reconstruction. They target closure-grade evidence for unresolved semantics and transient-state behavior.

## Prompt List

Status as of 2026-06-14 (✅ = closed, in `ai-prompt/completed/`; ☐ = still open here). Open items are graded by **investigation complexity** (1 = simple/mechanical, 5 = very hard) — all live items also carry the inherent cost of a debugger session + user-triggered scenarios.

**Still open (in this folder):**

| Complexité | Fiche | Sujet |
| --- | --- | --- |
| 4/5 Élevée | `ai_investigation_live_camera_control_word_decode.md` | décodage bit-à-bit du mot caméra + routing 4 familles |
| 3/5 Moy.-élevée | `ai_investigation_live_exit_path_state_reset_matrix.md` | matrice de reset transitoire × 5 sorties (reproduction lourde) |
| 3/5 Moy.-élevée | `ai_investigation_live_runtime_callback_mix_matrix.md` | mix de callbacks par contexte + criticité |
| 3/5 Moy.-élevée | `ai_investigation_live_angel_wing_timeline.md` | timeline set/sustain/clear Angel Wing |
| 2/5 Moyenne | `ai_investigation_live_pending_exec_authentic_bytes.md` | octets pending/exec authentiques par famille (captures déjà entamées) |
| 2/5 Moyenne | `ai_investigation_live_gf_payload_dump.md` | dump payload GF (Doomtrain) — non ISO-bloquant |

**Closed → `completed/`:** `exec_queue_group_semantics`, `escape_commit_and_mode5_semantics`, `targeting_slot7_and_mask_bits`, `status_180800_writer_proof`, `doom_special_action_followthrough`, `elemental_hp_outcome_matrix`, `ai_relay_70_71`, `rng_mixed_rand_callsite`.

## Shared Expected Result

Each investigation should produce:

1. Runtime evidence snapshots with exact addresses and values.
2. Confirmed/inferred/ambiguous labels for each conclusion.
3. Proposed IDA renames/signatures where new function meaning is proven.
4. A short “merge-ready deltas” section for docs/wiki updates.
