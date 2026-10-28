# Documentary recovery — 2026-10-10

**Original question recovered: no. Original answer recovered: no.** No evidence proves storage loss by compaction. Root `msg_1262905a7001MFl05DeOTAIr3v` is the current report, not the old offer. Readiness is root `msg_12631d3d5001A2rseesRG67QI2`; no target verification by this worker.

## Actual blockers, not a reconstructed historical question

Paths below are relative to `tools/_tmp_semantic_triple/`; each terminal review has a native receipt in the campaign queue. Full citations and receipt message IDs are in `recovery_report.json`.

- **0x50AED0 — missing neutral storage binding.** Four declarations must map to `0x01D97718` (WORD/+2 BYTE), `0x01D97704` (DWORD/WORD/endpoint), `0x01D9771E` (WORD), and `0x01D972C0` (seven WORD views, stride `0x9C`, traversal to offset `0x444`). Array extent/backing and C32 view contract are missing, **not the numeric addresses**. Reviewer explicitly requests a minimal static contract, not runtime. `0x50aed0/native-2026-10-10/N50AED0_reuse_review/c_review.md:18-22`.
- **0x50AF20 — missing pointer/link/ABI/domain proof.** Literal DWORD pointers `0x00B8BA44/0x00B8BA68`, stored address `0x00534150`, globals/helpers and tables require neutral bindings; helper/library signatures are not authenticated. Callback-array bases are **`0x00C81774` and `0x00C81DB8`, stride 4**, indexed `0..399`; actual allocated counts and initializer/mutator inventories remain unknown. Static entry-zero samples are `0x008D6A00` and `0x008D69E0`, **not observed runtime targets**. Reads at `0x50AF49/0x50AFA1` and `0x50AF88`; indirect call `0x50AF93`. `0x50af20/native-2026-10-10/N50AF20_reuse_review/c_review.md:17-28`; `N50AF20_pack/neutral/frame_abi.txt:11-24` and `graph.json:2030,2429`.
- **0x50AFC0 / 0x50B190 — machine-register ABI gap.** `0x50B20A -> 0x50AFC0` may carry entry ECX through saved state to PUSH EDX at `0x50B007 -> 0x50D300`. A `(void)` prototype does not express this. Scan: three positions `0x01D972C4/0x01D97360/0x01D973FC`, stride `0x9C`, exclusive limit `0x01D97498`. Raw two-DWORD call transport, byte capture order and post-call WORD load also need correction. These are static/model issues, not missing initialized tables. `0x50afc0/native-2026-10-10/N50AFC0_reuse_review/c_review.md:11-22`; `0x50b190/native-2026-10-10/N50B190_reuse_review/c_review.md:29-49`.
- **0x47CF60 — neutral bindings + x87 boundary.** Missing map for 16 globals/38 called targets/6 stored constants; WORD at `0x01CDBFE0` incorrectly modeled as DWORD. `FLD [0x01A78BE0] -> 0x55AD90` passes x87 ST(0), not `cdecl(double)`; FISTP64 produces EAX/EDX, only EAX goes to `0x46BD10`. `0x47cf60/native-2026-10-10/N47CF60_reuse_review/c_review.md:11-15`; `patch_spec.md:8-22`.
- **0x50A9A0 — reload/capture + partial-register transport.** Six static order/reload defects; `0x50AA71` changes AL but `0x50AA7C` pushes full EAX with prior-helper high24. BYTE `0x01D28DF7` is zero-extended into DWORD, not a proved `char` ABI. Jump table `0x50ADC0` already has eight checked DWORD targets, stride 4; the `0x50B284` table already has five. Neither is recovered as the original missing table. `0x50a9a0/native-2026-10-10/N50A9A0_reuse_review/c_review.md:20-48`.

Corroboration: supervisor compaction **`msg_1262e90de001MDM19sRur0YMhY:51,55-60,70,72`** records these binding/ECX blockers and unadmitted malformed binding v1. Journal `docs/tech/investigation/battle-static-discovery/CAMPAIGN_LOG_gfx-battleloop-2026-10-08.md:432-435` independently records ECX escalation.

## Static first; live necessity unconfirmed

Neutral SOURCE-name→numeric binding and conditional memory/ABI contracts can be resolved statically in principle. An attached running process does not supply missing link contracts, all-path alias guarantees, helper ABI or a compiled backend proof.

A **distinct current-target unknown** exists at DWORD slot **`0x021DFEC4`**, consumed at `0x50B229` and `0x50AC1F`. Population reference: `0x50AFAE` writes the first array's post-call reread through its output argument; callers `0x50AA94/0x50B1D4/0x50B3AC/0x50B91E` pass this slot (`N50AF20_pack/neutral/frame_abi.txt:22-24,42-47`). This is not proof it was the original question.

**One conditional follow-up, only if parent needs a current runtime target:** « L'observation recherchée concerne-t-elle le DWORD du slot `0x021DFEC4`, appelé à `0x50B229` ? » Four bytes identify only its current target, not ABI/effets, coherence or the ECX path. No read is requested or performed by this worker.

## Coverage and limits

Native schema + read-only CLI: root **29 user/193 assistant/2 compaction** messages; supervisor **6 user/1009 assistant/7 compaction** messages, bounded oldest-first cursor traversal. Top-level assistant texts and question/form tool patterns were filtered; both pending-form lists were empty. Prior supervisors, worker contexts, arbitrary tool results/reasoning and settled-form archives were not exhaustively examined. Sessions may append after this snapshot. No campaign-wide exhaustive recovery claim.

Latest root steering seen: **`msg_1263903e4001ZeX8LnAaehgPJP`**, finish current functions, parent push/save and handoff for a fresh session. Parent alone implements it. This worker touched no IDA/debugger/runtime/RAM, launch/attach/control, git/queue/config/power or subagent state; writes only the three assigned reports. Parent handoff is untouched.
