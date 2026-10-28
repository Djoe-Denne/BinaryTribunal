COMMON_COMPACTION g08 — EAs 0x47DDA0, 0x484720, 0x47DE70, 0x47E120, 0x482BD0, 0x487DF0. All facts from frozen native export (IDB "FF8_EN.exe - 9.3.i64", input sha256 064d466b...9570, 32-bit, exported_utc 2026-10-11T16:38:25Z, algorithm v1). Native labels NOT treated as evidence of purpose.

== GROUP STRUCTURE (docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json) ==
- g08 membership lines 66-75. Graph entries: 0x47DDA0@3826, 0x47DE70@3836, 0x47E120@3848, 0x482BD0@3884, 0x484720@3907, 0x487DF0@4168.
- 0x47DDA0: out=[0x484720,0x4860A0,0x4860D0,0x48B8B0,0x48D1F0], callers=[].
- 0x47DE70: out=[0x484180,0x484720,0x4860A0,0x4860D0,0x48B8B0,0x48D1F0,0x494A60], callers=[].
- 0x47E120: out=[0x484720,0x4860A0,0x4860D0,0x48B8B0,0x48D1F0,0x494A60], callers=[].
  → The three 0x47DExx/0x47E1xx are sibling functions sharing 5 callees; none has a direct caller in the graph.
- 0x484720: out=[0x482BD0]; callers=[0x47D8A0,0x47DDA0,0x47DE70,0x47E120,0x482E00,0x482F80,0x4831C0,0x4831F0,0x483270,0x483470,0x4847B0,0x487670] (12 call sites).
- 0x482BD0: out=[] (leaf); callers=[0x484720,0x4847F0].
- 0x487DF0: out=41 targets incl 0x47D930,0x47E080,0x47E200,0x47E3F0,0x47E450,0x47E970,0x482C90,0x483790,0x483860,0x485F00,0x485FF0,0x4860A0,0x4860D0,0x486E70,0x48A640..0x48A830,0x48C1C0,0x48D200,0x48E830,0x48F020,0x493B60,0x495210,0x495280,0x4952F0,0x495330,0x4AD170; sole caller 0x4877F0.
- Cross-links: 0x47DDA0/0x47DE70/0x47E120 → 0x484720 → 0x482BD0 (chain inside g08). 0x487DF0 shares callees 0x4860A0/0x4860D0 with the three siblings, and 0x485F00/0x485FF0 with g07/g10.

== METADATA (native-groups.json functions[]) ==
0x47DDA0: 63 instr, 3975 asm_chars, 20 blocks, sha256 2a26095b...717c7bf (line 859). 0x47DE70: 75/4445/22, sha f95f8196... (868). 0x47E120: 68/4097/20, sha 6132e811... (877). 0x482BD0: 32/1529/10, sha e90de76e... (904). 0x484720: 34/2101/4, sha 8435d85d... (931). 0x487DF0: 2447/140198/489, sha bcc948b7... (1120) — matches CONTRACT.md:34 user instruction (dedicated GLM 5.3 Flash max, 2+1).
Packets: .tmp/ff8-decomp-semantics-20261011-r01/native/<EA>.json (all 6 exist, dir verified).

== 0x47DDA0 DEEP FACTS (packet 0x47DDA0.json, chunk 0x47dda0-0x47de67, hex line 15, asm line 18) ==
Instruction-level (validated against disassembly text):
- 0x47DDA0: loads byte from global annotated BATTLE_RESULT_CODE; 0x47DDAB: mov dword_1D27B00,ebx (ebx=0 → global zeroed); 0x47DDB1 jnz 0x47DE5A (early exit if nonzero).
- 0x47DDB7: cmp byte ptr [ATTACKER_SLOT_ID_0+1],1 → jz 0x47DDDC skips both count calls; else 0x47DDC0 call EnemyAI_CountAlivePartyMembers, 0x47DDC5 cmp eax,0FFh, 0x47DDCA jz exit; 0x47DDD0 call EnemyAI_CountAliveMonsters, 0x47DDD5 cmp eax,0FFh, 0x47DDDA jz exit.
- 0x47DDDC: mov al, byte ptr [ATTACKER_SLOT_ID_0]; 0x47DDE5 jbe exit (0 → exit).
- Scan loop 0x47DDE8-0x47DE07: eax starts at offset BATTLE_SLOT_DATA.target_reaction_type; stride 0xD0 (0x47DDFC add eax,0D0h); loop bound offset byte_1D28187 (0x47DE02); per iter reads dl=[eax+1] and [eax] (0x47DDF1/0x47DDF8); iteration counter ecx. On match falls to 0x47DE0B block; loop-back edge 0x47DE48→0x47DDE8 (cfg lines 143-156). Exit block 0x47DE5A-0x47DE67 (pop edi/ebx; retn).
- code_targets: 0x484720, 0x4860A0, 0x4860D0, 0x48B8B0, 0x48D1F0 (call sites inside 0x47DE0B-0x47DE48 region per CFG).
- xrefs_to: exactly ONE, from 0x47E0B3, type=1 (data), iscode=false, function 0x47E080 (packet lines 170-177) → address-taken reference, no direct caller; 0x47E080 is itself a callee of 0x487DF0 (graph line 4171).
HISTORICAL UNVALIDATED (IDA annotation embedded in exported asm text, first line of "assembly"): "G17: post-action callback. Walks slots by attack_sequence_id, enqueues Battle_EnqueueSpecialAction(slot, target_reaction_type, group 0). If type==2 and Death(status_1&1), skip enqueue. Then clear attack_sequence_id and target_reaction_type." Plus inline comments on 0x47DDD0 call ("find-first monster slot 3-6 (END 0x1D28140), status_1&5==0, else 0xFF; no occupancy gate; EAX = leftover index (pas un compteur ; catalogue 3-7 faux)"). Report as legacy IDB prose only.

== 0x482BD0 DEEP FACTS (packet 0x482BD0.json, chunk 0x482bd0-0x482c2e, hex line 15, asm line 18) ==
- Leaf, stdcall-ish (retn, args via esp). edx=[esp+4] base of 4-byte-stride node array; esi=[esp+0xC] capacity; esi2=[esp+0x10] head_index ptr (param names links/capacity/head_index are IDB annotations).
- Free-node scan 0x482BDF-0x482BF2: node free iff byte[0]==0 && byte[1]==0 (0x482BE1/0x482BE6); stride 4 (0x482BED); if none free, 0x482BF4 sets stack index byte to 0 → reuse index 0 (saturation path, 0x482C28 jmp back).
- Allocation/link 0x482BF9-0x482C26: idx=al (and 0FFh); cl=[head_index]; [base+idx*4]=cl; [base+idx*4+1]=0FFh; [base+idx*4+2]=0; if cl!=0FFh then [base+cl*4+1]=al (link old tail→new); [head_index]=al. Byte +3 never written (preserved).
- xrefs_to (packet lines 94-149): 9 call-near sites (type 17): 0x484739, 0x484769 (fn 0x484720); 0x484853, 0x4848EA, 0x48499B, 0x484A32, 0x484AC5, 0x484AEB, 0x484B09 (fn 0x4847F0). code_targets=[].
HISTORICAL UNVALIDATED (embedded asm annotation): "G07: first node with prev==0 && next==0; on saturation reuses index 0, appends as newest, clears reserved_2, preserves opaque reserved_3."

== NOT DEEP-READ (inventoried only; producers fork from frozen packets) ==
0x47DE70.json, 0x47E120.json, 0x484720.json, 0x487DF0.json — compaction interrupted after first two packets; graph/metadata above is complete for all 6. 0x484720 is the fan-in hub (12 callers) and sole caller of 0x482BD0; 0x487DF0 is the 2447-instr VM (CONTRACT.md:34 governs its routing).

== UNCERTAINTIES ==
1. All global/param names (BATTLE_RESULT_CODE, ATTACKER_SLOT_ID_0, BATTLE_SLOT_DATA.target_reaction_type, dword_1D27B00, byte_1D28187, EnemyAI_*) are IDB names from the frozen export — provenance only, not purpose evidence.
2. Embedded "G17"/"G07" header comments are historical unvalidated IDB prose, deliberately separated above.
3. Sibling functions 0x47DE70/0x47E120 presumed same data-xref pattern as 0x47DDA0 (address-taken) — NOT verified; their xrefs_to blocks unread.
4. stride 0xD0 slot record layout and bounds byte_1D28187 imply array end 0x1D28140 region (annotation) — slot count/stride consistent with (0x1D28187-0x1D280B7)/0xD0≈? unverified arithmetically.
5. QMD/GrepAI not consulted (frozen-packet-first per contract; no code-index hit needed).

== SOURCE INVENTORY ==
- docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md:5-40 (scope, routing, 0x487DF0 line 34).
- docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json:66-75 (g08), :859-937+1120-1127 (metadata+sha), :3826-3924, 4168-4215 (graph).
- .tmp/ff8-decomp-semantics-20261011-r01/native/0x47DDA0.json:15-18 (hex/asm), :170-184 (xrefs/targets); 0x482BD0.json:15-18, :94-150.
- No edits, no IDB/Git/ledger/live/delegation. Producers: fork from same frozen packets; do not trust labels/annotations.
