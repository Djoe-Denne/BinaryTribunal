COMMON_COMPACTION g19 — EA 0x505BC0 (sub_505BC0), group g19 (native-groups.json:155-159). Claimed task_mv424nwo_000l_7mgsql.

== PRIMARY EVIDENCE (frozen) ==
.tmp/ff8-decomp-semantics-20261011-r01/native/0x505BC0.json — sha256 d41fd7e1ce633cfa43a0062dff38b5a3ed45d7a18a7f9d80b71f2e9a7692b22e; IDB FF8_EN.exe - 9.3.i64; input sha256 064d466b...9570; exported 2026-10-11T16:38:25Z. 26 instructions, 5 blocks, chunk 0x505BC0–0x505BFF (0x40 bytes), 938 asm chars. Label "sub_505BC0" = label-only, not evidence of purpose.

== INSTRUCTION-LEVEL FACTS (packet line 18, addresses inline) ==
- 0x505BC0 mov eax,[esp+arg_0]; 0x505BC4/05 push ebx/esi (callee-saved, no frame pointer, no locals).
- 0x505BC6 cmp byte ptr [eax+4],8Fh; 0x505BCA jz loc_505BFC → early return when byte at [arg0+4]==0x8F; in that path EAX still holds arg0 (pointer) at retn.
- 0x505BCC mov ebx,[esp+8+arg_4] (2nd arg, byte-used); 0x505BD0 mov esi,[eax+74h] → dword pointer field at arg0+0x74.
- 0x505BD3-D5 push ebx; push eax; call sub_505850 (site 0x505BD5); 0x505BDA add esp,8 → caller-cleanup (cdecl-style) 2-arg call.
- 0x505BDD test eax,eax; 0x505BDF jnz loc_505BE8.
- Callee-returned-0 path: 0x505BE1 or byte ptr [esi+2Ch],40h (sets bit 0x40 of byte state+0x2C); pop/pop/retn with EAX=0.
- Callee-nonzero path 0x505BE8: xor eax,eax; 0x505BEA mov [esi],bl (state+0 = arg4 low byte); 0x505BEC mov [esi+3],al (0); 0x505BEF mov [esi+2Eh],ax (word 0); 0x505BF3 mov word ptr [esi+2Ch],1; 0x505BF9 mov [esi+2Ah],al (0); retn EAX=0.
- No setcc, no jumptable, no other memory ops. All exits preserve ebx/esi.

== STRUCT-FIELD FACTS (derived solely from stores above) ==
State object esi=[arg0+0x74]: byte +0x00 (written=arg4&0xFF), byte +0x03 (0), byte +0x2A (0), +0x2C written as WORD 1 in success path OR byte|=0x40 in failure path, word +0x2E (0). Arg0 object: byte +0x4 (==0x8F gate), dword pointer +0x74.

== CALLER CONTEXT (frozen packet 0x505C00.json = BattlePresentation_StartActorAnimation, g17) ==
- Call site 0x505C61-68: push ebx(animId); push esi(actor); call sub_505BC0; add esp,8 — reached only when [actor+0x8C]==0 (0x505C19-24).
- Caller gates: animId==0 abort (0x505C05-08); if byte[actor+8]&0x18 then requires animId bit 0x1000 (test bh,10h @0x505C14); and bh,0EFh @0x505C1F clears that bit before call.
- Complementary bit usage: same caller @0x505C44-4C walks actor+0x8C chain (gate test byte[esi],2) and does and word[([esi+74h])+2Ch],0FFBF — clears the same bit 0x40 that sub_505BC0 sets on its failure path (both sides from frozen packets; semantic meaning NOT claimed).
- Alternate caller path when [actor+0x8C]!=0: au_re_BdLinkTask_0(sub_505C70) @0x505C2B→0x506C10; node+0xC=actor; node+0x15=bl.
- 0x505C00 callers (native-groups.json:2452-2476): 0x502380, 0x5027D0, 0x502F90, 0x503040, 0x504290, 0x504BB0, 0x505CB0, 0x505CE0, 0x5065B0, 0x506620, 0x50A9A0, 0x50B2A0, 0x50B830, 0x50BB00, 0x50BD00, 0x511EF0, 0x5773F0, 0x5797A0, 0x57B920, 0x57E2F0, 0x57E300, 0x580690, 0x5806A0, 0x582D60, … (list truncated in source). Mission-set members among them: 0x502380/0x506690/0x50A9A0/0x504BB0/0x50B2A0/0x50B830/0x50BB00 (g17/g18/g24).
- Ledger direct-call sites into 0x505C00: 0x50443C (from 0x504290), 0x505CC6 (from 0x505CB0) — battle-graph-ledger.json:31225-31230, 31261-31266.

== CALLEE 0x505850 ==
- Extent only: chunk 0x505850–0x505875 (37 bytes), segment .text, rva 0x105850, status non_investigated_static (battle-graph-ledger.json:294391-405; r0-scope.json:6303-6307). Body NEVER disassembled in any repo source found.
- Exactly ONE direct caller in ledger: 0x505BD5 from 0x505BC0 (battle-graph-ledger.json:31243-31248). Note: 0x504BB0.json line 783 contains string "0x505850" — role there (direct callee vs transitive) unverified.

== GRAPH / XREFS ==
- native-groups.json:2438-2445 — out=[0x505850], callers=[0x505C00, 0x505C70].
- Packet xrefs_to: 0x505c63 (fn 0x505C00), 0x505c88 (fn 0x505C70), both type 17 (code).
- Neighbors: sub_505CB0 0x505CB0–0x505CD3 non_investigated_static (ledger:294436-449); BattleTimQueue_FlushToVram 0x505D20–0x505DE0 named_not_semantically_audited (ledger:294451-464).

== VALIDATED DOC FACTS (multi-vote compaction) ==
- docs/tech/systems/render_action_sequences.md:111-114: "BattlePresentation_StartActorAnimation (0x505C00, 0x6E, via BdLink sub_505C70/sub_505BC0)" (1 vote, flagged); 0x504BB0 jumptable 0x504BF9→table 0x5056C8, 41 callees incl. 0x505C00.

== HISTORICAL / UNVALIDATED (separate, do not treat as canon) ==
- decomp/0x505C00__BattlePresentation_StartActorAnimation.md (GLM triple 2026-09-13, IDB-pushed): reconciled C for the CALLER only; names sub_505BC0 params (actor, animId) — param naming is hypothesis; sub_505C70 "address only". Mirrored in idb-sync-2026-10-07/{final_post_state:4167, post_state:4167, baseline:97558}.
- CAMPAIGN_POOL_2026-10-10.json:1240+ / 62759-62885: prior case N505BC0 chain (pack/C_B/C_R/A/V/gate), pack dir tools/_tmp_semantic_triple/0x505bc0/native-2026-10-10/N505BC0_pack.
- NO decomp/semantic doc exists for 0x505BC0 itself (glob decomp/0x505*.md → only 0x505C00/0x505D20/0x505E30/0x505F00).

== UNCERTAINTIES ==
1. Meaning of the [arg0+4]==0x8F guard — no validated source; "animation ID 143" unproven (0x8F in 0x504BB0's jumptable default is a different opcode space; do not conflate).
2. Bit 0x40 at state+0x2C: set-on-failure / clear-on-chain-walk proven at instruction level; semantics unknown.
3. Return convention: early-exit returns arg0 in EAX, other paths 0 — caller 0x505C00 discards EAX (observable fact), purpose unknown.
4. 0x505C70 has NO functions entry found in battle-graph-ledger (grep "va": "0x505C70" → 0 hits) — extent/provenance unknown.
5. sub_505850 body unknown; contract inference (what "0 vs nonzero" means) impossible from current evidence.
6. Word-store [esi+2Ch]=1 vs byte-or 0x40 at same offset across paths — layout overlap noted, field typing unresolved.

== SOURCE INVENTORY ==
Frozen: .tmp/ff8-decomp-semantics-20261011-r01/native/{0x505BC0,0x505C00,0x504BB0}.json; native-groups.json:155-159,526-533,2438-2476. Docs (validated): render_action_sequences.md:104-119. Graph: battle-graph-ledger.json:294391-464,31225-31266; r0-scope.json:6303-6312. Historical: decomp/0x505C00*.md; idb-sync-2026-10-07 snapshots; CAMPAIGN_POOL_2026-10-10.json. Lists: ff8-decomp-semantics-2026-10-11.md:127; .tmp/remaining-functions-inventory-2026-10-11.md:55.
No edits/IDB/Git/ledger/live/delegation performed. Read-only discovery complete; stopping after this report.
