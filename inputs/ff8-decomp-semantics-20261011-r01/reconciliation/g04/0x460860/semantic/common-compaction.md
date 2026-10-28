COMMON_COMPACTION — g04/run01

Source inventory / authority:
R = C:/Users/djden/source/repos/retro-eng/re-ff8/ (absolute path prefix below).
P = C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x460860.json.
Owned EA is exclusively 0x460860: R/docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json:35–37; contract :16–21 defines factual discovery and independent production forks. Task task_mv424nw8_0008_natqik claimed/completed.
P:4–10 native provenance: 32-bit FF8_EN.exe; IDB D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64; exported 2026-10-11T16:38:25.140966+00:00. Input SHA256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570. Packet SHA256 independently computed 9384e033a8c2529b83d45416bffb9fc86fec628fa40990f5f60610486739861a.
E = C:/Program Files (x86)/Steam/steamapps/common/FINAL FANTASY VIII/FF8_EN.exe. Read-only offline file verification found 22,124,216 bytes and exactly the input SHA256 above. Image base 0x400000. Entire frozen 654-byte chunk exactly matches E bytes at file offsets [0x60860,0x60AEE). Thus constants/caller byte checks below refer to the identical native input, not another version or runtime memory.
P:18 is the complete ASM string (instruction-address citations below all refer to this line). P:19–177 CFG: 22 blocks; P:178–233 inbound xrefs; P:234 code_targets=[]; P:235 177 instructions. Chunk [0x460860,0x460AEE), one chunk, no outgoing calls in the frozen packet. Name Gte_MVMVA at P:3 is label-only, not independent semantic evidence.

ABI / native control facts:
0x460860 SUB ESP,8; 0x460863/864/865 PUSH EBX/ESI/EDI. 0x460866 reads the single DWORD stack input at entry ESP+4. EBX/ESI/EDI restored on each of the three return paths (RET 0x460AC1,0x460AE1,0x460AED); local 8 bytes released, plain C3 RET rather than callee argument cleanup. No EBP use. ECX/EDX/EAX and x87 state are touched.
IMPORTANT: input home slot is writable scratch, not preserved. Repeated MOV [esp+14h+arg_0] and FILD use it; final such MOV is 0x4609C2, from the sign-extended WORD loaded at selected base+0x0C by 0x46099A. Nine callers below remove this overwritten DWORD with POP ECX, not ADD ESP,4.
At 0x460AA2/AC2 comparisons are signed against -32768 and 32767. Native EAX at return is path-dependent: in-range third-result path retains that DWORD and stores it at 0x460AE4; third-result out-of-range paths load [0x1CA92F8], OR 0x00400000, store it and return that word (0x460AA6–AC1 / 0x460AC6–AE1). This is an observation of registers, not a chosen high-level return contract.

Instruction-derived storage layout / data references (no named GTE-register identity assumed):
Input bit slices: SAR/AND at 0x46086E–879 extracts bits13–14 and17–18; 0x46087E/887 extracts bits15–16. Selected base addresses from immediate native bytes: matrix-bank base 0x1CA927C (label xyz1) plus bits17–18*0x20 at 0x460881/88A; other bank base 0x1CA9290 (label world_CameraWorldSpaceX) plus bits13–14*0x20 at 0x460884/88F.
Nine signed WORD reads from selected first base at offsets 0,2,4,6,8,0xA,0xC,0xE,0x10 (0x46091B–99A); bank stride0x20, read span18 bytes, NOT proof of a full struct typedef. Possible bank bases: 0x1CA927C,0x1CA929C,0x1CA92BC,0x1CA92DC.
Second bank DWORD reads at offsets0,4,8 occur only if bits13–14 !=3 (CMP 0x4609EF, JZ0x4609F9; loads0x4609FB/9FD/A02; ADD0x460A00/A05/A07). Therefore actual loaded bases are 0x1CA9290,0x1CA92B0,0x1CA92D0; selector3 computes 0x1CA92F0 but bypasses those loads.
Input triple: selector bits15–16==3 reads signed low WORDs at 0x1CA8A34/38/3C (0x46089A/A5/B4), stride4; otherwise signed WORDs at 0x1CA8A10+selector*8, +2, +4 (0x4608C9/D5/E1). Vector slots read spans [1CA8A10,1CA8A16), [1CA8A18,1CA8A1E), [1CA8A20,1CA8A26).
TEST input,0x80000 at 0x4608F9 gates three x87 FMULs using float64 address0xB69600 at 0x460903/90D/915. No assumption that other PSX command bits are implemented.
Three computed DWORDs are stored to 0x1CA8A74,78,7C (0x460982,9C6,9F4); optional additions re-store the same addresses (0x460A09/A0F/A15). Later full DWORD stores overwrite 0x1CA8A34,38,3C, not just low WORDs.
Status DWORD0x1CA92F8 is cleared at0x460A1F. First signed-bound failure MOVs0x81000000 (0x460A32/A48); second failure ORs0x80800000 (0x460A70/A8E); third ORs0x00400000 (0x460AB1/ACC). Bound values are full DWORD FFFF8000 and00007FFF. Existing semantic interpretations of those bits are NOT promoted.

Floating-point constants, directly checked against E:
VA0xB69600 -> file offset0x769600, bytes000000000000303f, IEEE float64 0.000244140625 = 2^-12.
VA0xB693D8 -> file offset0x7693D8, bytes0000008000003043, IEEE float644503601774854144 = 2^52+2^31. Historical prose saying 2^52+2^51 is contradicted by exact bytes and must not be reused.
Native conversion sequence is FADD [0xB693D8], FSTP qword local, MOV low DWORD, ADD0x80000000, repeated at0x460958/95E/96A/97C,0x4609A0/A6/B2/B6,0x4609D8/DE/E2/EA. It is NOT FISTP or a demonstrated ISO-C cast. This leaf does not establish x87 control-word rounding/precision; incoming FPU environment remains external. No runtime rounding claim.

Validated immediate caller neighbourhood:
P:178–233 lists exactly nine call-site xrefs, functions0x4607D0/E0/F0/800/810/820/830/840/850, sites function+5, type17 iscode=true. All nine wrappers independently byte-checked in E at file offset VA-0x400000: PUSH imm32; CALL0x460860; POP ECX; RET, 12 bytes. Table (wrapper/call-site : immediate; bits13–14,bits17–18,bits15–16):
4607D0/4607D5 : 4C6012; 3,2,0
4607E0/4607E5 : 4A2012; 1,1,0
4607F0/4607F5 : 4AA012; 1,1,1
460800/460805 : 4B2012; 1,1,2
460810/460815 : 4BE012; 3,1,3
460820/460825 : 49E012; 3,0,3
460830/460835 : 480012; 0,0,0
460840/460845 : 480012; 0,0,0
460850/460855 : 486012; 3,0,0
All nine immediates have bit19 set. 830/840 byte sequences differ only CALL relative displacement and implement the same pushed input and target. Native inbound-call inventory is not proof of no possible indirect calls elsewhere.

Other frozen native storage cross-references (assembly line18 of each absolute packet under R/.tmp/ff8-decomp-semantics-20261011-r01/native/):
0x45E610.json: 0x45E64B clears same status0x1CA92F8.
0x45E670.json: 0x45E673/67A/681 sign-extend WORDs at same0x1CA8A34/38/3C; other same-global operands also present (28 exact-label matching instructions).
0x45E9D0.json: 0x45E9F0/EA0F signed low-WORD reads34/38;0x45EA20 clears same status (32 matching instructions).
0x45EBF0.json: 0x45EC10/EC2F signed low-WORD reads34/38;0x45EC40 reads0x1CA8A74 (35 matching instructions).
0x50F900.json:0x50F958 FILD world_CameraWorldSpaceX;0x50F972 MOVSX word0x1CA92DE, within the fourth matrix bank above. These are operand-sharing facts, not proof of a direct call relationship or shared abstract type.

Knowledge/discovery provenance and limitations:
GrepAI first, no workspace parameter, common retro-eng corpus returned relevant target area and surrounding render/state material. QMD CLI status confirmed applicable ff8-wiki collection (188 docs, corpus795; updated4d ago), then qmd search Gte_MVMVA/GTE/matrix and qmd get with line numbers. Knowledge sources (absolute paths):
R/obsidian-docs/projects/re-ff8/references/battle-render-pipeline-entrypoints.md:6–19 sources/provenance; :86 historical E3a storage-address naming and 830/840 note; :117 contextual rendering pipeline, NOT independently validated here.
R/obsidian-docs/projects/re-ff8/references/battle-address-catalog.md:6–14 sources; :213–214 wrapper lookup; :235 target/adjacent labels.
R/obsidian-docs/projects/re-ff8/references/battle-model-tools-and-format.md:6–11 provenance; :94–96 broad CPU/render context, NOT a new factual promotion.
Primary historical lookup R/docs/tech/reference/address_catalog.md:548 points to0x45DFE0 state setter (future neighbourhood lead only, not byte-validated in this discovery); :555 wrapper4BE012 corroborated by E. R/docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md:687 and R/docs/tech/investigation/battle-static-discovery/closure-audit.md:298–301 historical neighbourhood notes; only caller byte facts above independently established.
No dedicated typed ABI/struct/global-data-xref export in P; direct data references above are instruction-derived. Global BSS runtime contents, complete upstream callers of wrappers, x87 environment, register business identities and live behaviour remain unknown. No IDB calls/changes, Git, ledger, filesystem edits, runtime/live actions or delegation.
History transparency: the first non-compact GrepAI result automatically exposed an existing historical target reconstruction excerpt at R/docs/tech/investigation/battle-static-discovery/decomp/0x460860__Gte_MVMVA.md:33–110. Exact grep also surfaced historical decomp notes (including contradictory constant prose). None is used as evidence for this compaction, but that tool-response exposure remains in explorer history; do not describe forks inheriting this history as unexposed to historical target C. Independent fresh projection of this factual compaction + full native packet is the clean alternative if historical-C blindness is required by your author contract.
