COMMON_COMPACTION g30 / run01 / discovery-only / 2026-10-11.
Owned: 0x50F900,0x50FDF0,0x5106E0; claimed task_mv424nwy_000v_wl9kqw. No edits/IDB/Git/ledger/live/delegation or producer-artifact inheritance. Labels are lookup aids, never purpose evidence. Reusable for independent forks; no reconstruction/verdict.

SOURCE MAP (aliases resolve to absolute paths; references include file-line and instruction EA):
M=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json
N1=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x50F900.json
N2=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x50FDF0.json
N3=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x5106E0.json
A=C:/Users/djden/source/repos/retro-eng/re-ff8/tools/_tmp_semantic_triple/0x5099d0/native-2026-10-10/N5099D0_pack/neutral/asm.txt
B=C:/Users/djden/source/repos/retro-eng/re-ff8/tools/_tmp_semantic_triple/0x510680/asm.asm
C=C:/Users/djden/source/repos/retro-eng/re-ff8/tools/_tmp_semantic_triple/0x45c870/asm.asm
D=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/render_animation.md
E=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/investigation/battle-static-discovery/decomp/0x509B30__BattleGeom_SetCurrentBoneMatrix.md
F=C:/Users/djden/source/repos/retro-eng/re-ff8/tools/battle-model-probe/parse_c0m.py
G=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/investigation/battle-static-discovery/decomp/0x5099D0__RenderGeometry.md
H=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/investigation/battle-static-discovery/closure-audit.md
Q=C:/Users/djden/source/repos/retro-eng/re-ff8/obsidian-docs/projects/re-ff8/references/battle-render-pipeline-entrypoints.md
Read C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md:11,16-21,41 and AGENT.md. GrepAI first/common root retro-eng located F/rendering docs. QMD CLI searches ParseVertices/ParsePolygons in ff8-wiki located Q:94-96 and format/catalog references; prose used as leads, not native proof. Exact sibling rewrite helper/global search had no matches, not proof no equivalent implementation exists.

IDENTITY / NATIVE PROVENANCE
M:231-237 owns g30; M:598-613,625-631 inventories:
N1 297 instructions/33 blocks, [50F900,50FD3E), SHA256 5682a10eabc8838c39e3ee92b22f86f8e62c9abfa0290882f19bde6c944999ef.
N2 634/72, [50FDF0,51067C), SHA256 4e66001ce60c975ed8dccd727ffa4c52a5fc5712a61c965df597b5da226a4eb5.
N3 743/144, [5106E0,511082), SHA256 8348832713482d58ab168586214c47a76b509cd94f1ec7b033bbdff012f7311c.
All hashes independently recomputed and match. N*:5-9: 32-bit FF8_EN.exe, input SHA256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570, export 2026-10-11T16:38:25.140966+00:00. ASM is one JSON line :18; instruction EA disambiguates. Raw instruction bytes :15 checked for argument/global addresses.
N1:263-271 sole exported code xref 509A9D/function5099D0, no calls. N2:563-577 sole xref509B02/function5099D0. N3:1107-1121 sole xrefA4A00C/functionA49EE0, NOT5099D0. N2/N3 exact code targets45C870,45D7A0,45D7C0,45F270,510680; no indirect CALL in their ASM. Xrefs are snapshot facts, not runtime completeness.

SURROUNDING CALLER / ABI
A:50-74 /509A62..509AAA: loads context+4 DWORD into output cursor home; consumes signed WORD count/index from source; CALL509B30 @509A8D, then pushes two local-cell addresses and context @509A9A/9B/9C; CALL50F900 @509A9D. ADD ESP,16 @509AA6 includes deferred 4-byte arg of509B30 plus 12 for50F900, NOT four args to50F900. Its EAX is overwritten by reloaded source home @509AA2.
A:75-106 /509AAC..509B0E: align source ADD3/AND AL,FCh; four sequential WORD reads stored context+8/+A/+C/+E @509ABF/ACD/ADB/AE9; four-byte skip without read; store context+0 DWORD @509AF9. Four pushes to50FDF0 @509B02: context, OT base, shift, current packet; cleanup16 @509B0B and returned EAX saved to packet home @509B0E. A:44,48-49: SHL EDX,CL against context+20 mask, hardware count masking; no count<=32 contract.
N1:18 /50F909 bytes8B4508,50F930 8B550C,50F936 8B4510 prove EBP+8/+C/+10 inputs. Dereferences latter two pointer cells; writes them back @50FB83/85 or50FD33/35. Zero WORD count @50F952 branches directly to restores @50FD37 without stores; later MOVSX WORD/JLE count handling differs. Plain RET, EBP frame, ESP aligned8, EBX/ESI/EDI preserved; source return type unproved.
N2/N3:18 stack inputs, plain RET, EBX/EBP/ESI/EDI restored, allocations28h/34h. N3 initial context bytes8B4C2438 after SUB ESP,34h; fourth arg bytes8B442450 @5106F9 after three pushes. Both return reloaded DWORD[1D99C18] @51066F/511075. Observed ABI does not certify original business types.

RECORDS/GLOBALS: DIRECT NATIVE FACTS
N2:18 /50FE06/0F loads context+0 DWORD source/context+4 DWORD indexed base; WORD counters+8/+A/+C/+E @50FE37,510056,5102CC,510477. N3 initial same DWORD fields @510711/717 and four WORD counters. Context+1C/+28 DWORD loads; +24 sign-extended WORD for conditional tests but reread DWORD for helper input (N2 51038D/A8,51055E/57F; N3 510BF6/C0A,510E61/75). Preserve mixed widths, not guessed struct types.
N1:18 /50F90F..91B: signed WORD context+14/+16/+18/+1A scaled SHL3/LEA*8. Count WORD @50F945; entry signed WORD reads offsets0/2/4 @50FA19/23/32 and50FBAD/B7/C6; source advances6 @50FA4F/50FBD5. Two DWORD output writes, stride8 @50FB62/68/6B and50FD12/18/1B. N2/N3 index base+index*8; first index maskFFF; high nibble SHR12/SUB8 in N2. Do NOT infer all later indices mask12 bits from tool F.
Both write/reload DWORD globals1D99C18 and1D99C1C (N2 @50FDFD/50FE26 bytesA3189CD901/A31C9CD901; N3 @510708/72E). No reentrancy/thread-safety/alias-exclusion contract.
N2 four source advances10h/14h/14h/18h @51002A/2B7/462/65C; emitted destination advances20h/28h/20h/28h @510019/2A2/44A/64B. N3 source @5108FC/B48/D93/511062, destination @5108EB/B37/D7E/51104D. Tags07000000/09000000 and codes24000000/2C000000 are different fields.
N2 tests OR-combined second DWORDs with60000h and AND-combined with3F00000h (50FE9F/AF). N3 reads byte+6, OR/tests6 (5107A2..7B9), separately signed-halfword comparisons and bits1/2/4/8. Do not transplant N2 guards. N3 upper second-coordinate comparisons @510C62/C66 (and later) use SAME var_8 upper bound as first-coordinate tests; initial bounds read context+14/+16/+18 @5106EA/EE/FD, not presumed+1A height.

FLOAT / GLOBAL NUMERICAL DEPENDENCIES
N1:15/18 bytes: FILD DWORD1CA9290/94/98 @50F958/97D/99A; DWORD1CA92E4 @50F95E then AND FFFF/SHR1; MOVSX WORD1CA92DE/E2 @50F972/98F. FLD m32 bank1CA9234/38/3C,1CA9240/44/48,1CA924C/50/54. FMUL m32 B693E4/B693E0; FADD m64 B693D8 @50FAB2 (DC05D893B600). Labels8,1/8,large rounding constant are NOT freshly verified data values: packet has no global data bytes/control-word contract.
E:52-55,68-70 documents parent-gated writer chain509B30→56BAE0/56BB30, eight DWORD bank writes1CA927C..9298 and nine signed-WORD→float conversions to1CA9234..9254; 'bone' explicitly UNCERTAIN. Surrounding gate evidence, not g30 business meaning.

CALLEES VALIDATED AGAINST SAVED ASM
B:2-36 /510680..6D1: three stack DWORD args; low/high halves sign-extended SHL/SAR; IMUL32×2 then SUB @5106BD/C0/C3; MOV EAX,0/SETS AL @5106C6/CE; RET. SETS observes SF of wrapped native subtraction, NOT unrestricted signed-area math; CW/CCW unproved. Both targets push3/cleanup12. N2 calls50FED4,51011B,361,527; N3 calls5107CD,9C9,BD6,E41.
C:2-38 /45C870: unsigned cursor-base>=60000h @45C877/7D/83 early returns without writes; six stack args. Args3..6→node+4/+8/+C/+10; arg2 packet ptr→+0; old-head metadata+14 WORD0/+16 BYTE high head; patch packet low24 XOR/AND FFFFFF/XOR; update head/cursor+18h. EAX return cursor not node @45C8CF/D5. Targets push6/cleanup24 and reload packet global. Node18h is NOT packet20h/28h.
N2:18 /5103A0..3D3,510571..5AD; N3 /510C00..C2B,510E6B..E9B: two two-arg calls45D7C0 with indices6/8, zero-additional-stack-arg call45F270, two-arg call45D7A0 with index16h/destination local; combined cleanup24. Comments identify indexed GTE table, but helper bodies not freshly retrieved: historical purpose comments only;45F270 opaque (H:327 'DPCS non vérifié').

CODE/HISTORICAL CAUTIONS AND OPEN QUESTIONS
F:117-141 implements mesh offsets, WORD batch id/count, signed6-byte triples, whole-block-list alignment, four WORD face counts+skipped DWORD; F:143-188 consumes16/20/20/24-byte records. Corroborates extents, NOT native specification: unsigned counts, masks ALL indices, axis/UV/viewer remapping and GLB assumptions (F:31-38,57-59).
D:118-137 supports6-byte source/8-byte output and packet sizes but leaves PC-07 field layout/PC-08 shading unresolved. G:3-7,31-42 limits caller C to conditional numeric projection, not original prototypes/runtime. Q:94-96 calls A49EE0 MAG_234 FamilyB; only numeric xref freshly proven. Historical HANDOFF_gfx-pipeline-decomp.md:220 gives5108A0 for GF function; authoritative g30 address5106E0 supersedes that lead.
Uncertainties: named structures/ownership/buffer bounds; helper effects and aliases; source return types; x87 precision/control/exceptions and constant data; GF family purpose and shared upper-bound rationale; runtime reachability; equivalence to tooling coordinates/UVs. No target verdict/promotion.
