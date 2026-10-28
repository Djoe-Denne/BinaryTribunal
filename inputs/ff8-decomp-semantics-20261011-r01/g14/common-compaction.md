COMMON_COMPACTION g14. Read-only factual discovery; no target C, purpose verdict, edits, IDB/Git/ledger/live/delegation. Task task_mv424nwf_000g_z26eqm claimed/completed. Contract read, GrepAI common-root discovery first, QMD CLI knowledge search/retrieval. Native labels/comments are not purpose evidence.

ABSOLUTE SOURCE ALIASES (alias:line below expands to these paths):
P4=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x4954B0.json
P9=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x495960.json
PD=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x495D80.json
GROUP=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json
PE=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-pe-verification.json
ABI=C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/address-map/ff8_en_064d466b5fe2ba90/abi-ledger.yaml
LAYOUT=C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/abi/include/ff8iso/abi/layout.hpp
Q22=C:/Users/djden/source/repos/retro-eng/re-ff8/obsidian-docs/projects/re-ff8/references/g22-init-static-layouts-2026-08-30.md
INIT=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/battle_init.md
SEAL=C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/g22-battle-init-offline-validation-2026-09-01.md

FREEZE / CRITICAL LIMITATION:
P*:4-9: 32-bit FF8_EN.exe SHA256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570, export2026-10-11T16:38:25.140966+00:00. Packet SHA256 independently computed, matching GROUP:1012-1036:
P4=0d3ae552496212fc6656e5c02fe6db6830acc5b6b35ab41b58a693811db60ac6;44insns,7blocks,[4954B0,49552F).
P9=f3689a0e914a803ad59128fa4ea76bb4de7f1057a6b37e4bb6dc728c38324d2b;333insns,50blocks,[495960,495D73).
PD=862f2ad69328e5f7b6edf55f2758945567bbedec39d64efd8db945c141c4ad7b;101insns,18blocks,[495D80,495EB3).
PE:432-434/460-462 says P4/PD equals PE/freeze. CRITICAL PE:437-455 says495960 does NOT equal PE:7 bytes differing495A29..495A2F, live_idb_changed_since_freeze=false. Frozen chunkSHA cbcd827c14b62562b02d32ebf5be96ae641ad24dd3174feecfd828f54f186f15 vs PE chunkSHA6ba7b6f4a3febcb536a5c2e458ca184e18f368c7a62408662df9c196863bae02. P9:18 lists495A29 'db 0E8h', next instruction495A30; frozen chunk has E8 72 A3 81 5B 90 90 in span. Do NOT treat333 listed instructions as complete authenticated original-PE decoding, infer missing behavior or silently repair from prose. Requires supervisor source/coverage disposition.

OBSERVED ABI (all instruction-address citations from P*:18):
4954B0 saves EBP/ESI/EDI, reads entry-stack argument ESP+4 at4954B3, plainRET49552E. Call47EEB0 at4954F4 pushes zero-extended byteID then argument, cleans8 at4954F9. Return contract unvalidated: EAX altered through final byte load495520, no explicit result reset.
495960 saves EBX/EBP/ESI/EDI; reads entry second argument ESP+8 intoEDX495961, firstESP+4 intoEDI495968. PlainRET exits. First-derived persistent record=0x1CFE0E8+152*EDI (49596C..97B); second-derived local record=0x1CFF000+464*EDX (495972..988, raw immediate01CFF000). EDI==FF exits49598E..994; no ordinary index bounds check shown. Callee interfaces below are push observations, not recovered declarations. No justified stable return contract.
495D80 reserves12bytes, savesEBX/EBP/ESI/EDI, reads entryESP+4 intoEBX495D84, restores stack/plainRET495EAF..EB2. Persistent record=0x1CFDCA8+68*index; local=0x1CFF618+12*index (495D88..DA3, raw immediate01CFF618). No index bounds. Call4960C0 at495DBC pushes index then dword persistent+0C, resultAL ->local+8. Call496120 at495E49 pushes index then zero-extended local+8, resultAX sign-extended at495E4E. Both clean8.

TABLES / STRUCTURES:
P4:18 4954BC..D0 forms local+86, counter20h at4954B7; stride5 at49550A, decrement/loop49551F/529. IDs cursor-4 (initial+82); qty not accessed. Kernel stride3Ch at4954DE/50D/51C. Raw sources=0x1CF406F+60*id (4954E1,test80),0x1CF406E+60*id (495510),0x1CF406D+60*id (495520); row offsets+B,+A,+9 using independent base below. Writes local+86,+85,+84. Pure byte/bit facts: +4cache zero; table80 may set1; nonzero47EEB0 result OR4; two other table bytes copied. Meaning of47EEB0/cache fields unvalidated by name.
ABI:1076-1106 marks F_CHAR_DATA RVA018FF000,3records stride1D0, HPu16+172; F_CHARACTER_MAGIC_DATA RVA018FF082,32entriesx5,id+0 qty+1 cache+2..4. Add image base400000 to RVA to match nativeVAs. ABI:1019-1030 K_MAGIC RVA018F4064,57rowsx3C, authenticated-kernel/static evidence; replacement restriction reject>=57. P4 has NO such native upper check: do not inject replacement guard into recovered native.
Q22:98-117 (QMD CLI #f611a2): SG_ARRAY_CHARA_DATA VA1CFE0E8,CharacterData[8],stride152; +0CurrentHP i16,+2storedMaxHP i16,+4XP i32,+8ModelID,+9WeaponID,+10 32(id,qty) pairs,+50four commands,+54four abilityIDs,+58junctionedGF bitmap,+5Cjunction spellIDs,+94exists,+96mentalstatus. Q22:119-121 says JFlag at F_CHAR+190; do NOT conflate with P9's native tested dword+188. Q22:141 stored currentHP may exceed storedmax;145 decoder does not apply junctions.
ABI:1440-1464 and LAYOUT:165-176/207-209: persistentGF RVA018FDCA8,16x68; name[12],XPuint32+0C,existsbyte+11,HPu16+12,complete_abilities[16] begins+14,APs[24],KO+3E,learning/forgotten bytes. PD bitmap reads persistent+1C,+20 are within complete_abilities; native scans these TWO dwords, not entire16bytes.
IMPORTANT ADDRESS CONFLICT: ABI:1504-1520 SG_GF_CURRENT_HP_ RVA018FF318 (VA1CFF318),stride12,attributes writer495D80. PD495DA3 raw VA=1CFF618, NOT1CFF318. PersistentGF base agrees; localGF base conflicts. Historical ABI prose must not override frozen raw immediate; no live correction done.

OTHER DIRECT FACTS / RISKS:
P9:18 49599A..9C5 copies32pairs persistent+10 stride2 ->local+82 stride5;4959C8 callsP4. Calls496240/4961D0 at4959D2/9E2 with persistentXP+4 and first argument; storesEAX local+17C,AL+1B8. Call496310 at4959F4 with zero-extended local+1B8 and first argument. Multiplierbyte+1C7; signedIMUL high constant51EB851F,SAR5,SHR31/add correction; signed uppercmp270F (495A06..A22), then disputed span. After hole, persistent+0/local+172 stores ONLY in comparison branch495A30..A3F; do not convert to unconditional store based on formula prose.
Repeated496440 selectors1,2,3,4,5,8; multiplierbytes local+1C8,1C9,1CA,1CB,1CC,1CF; byteoutputs+1BB,1BC,1BD,1BE,1BF,1C0.4967C0 result multiplier+1CE/output+1C2;4968A0 receives local+1BF as additional pushed input,multiplier+1CD/output+1C1. Signed uppercapsFF; no lower clamp evidenced. Preserve signed highmultiply/byte truncation.
495C62/495C6E resultbytes ->local+1C4/+1C5.495C7C..C99 loop8 calls496930,AX->local+194+2*i.495C9C/CA8/CB5 calls4969E0/496960/496AC0 ->EAX+18C,AX+1B4,AX+1B6.495CC4..CDB loop13 calls496AF0 ->AL+1A4+i.495CDD tests dword+188&60000. Both tailarms scan4 stride4 records at+1E for leadingbyte2; OR10 orAND EF at+21+4*i. Historical 'Auto-Reflect' not a validated verdict. Duplicate scans/sentinel code require proof before simplification.
PD:18 495DB0/DB4/DB8 initializeslocal+B/+9/+A=0/0/100. Persistent+0C ->local+4 at495DC4..DCD. Two loops32 consume bitmap viaSHR EDX,1 (495DE1..E40); tablecursor+=8/bit,outerbase+=100h. Signed accepted pointer range >=1CF81C6 and <1CF820E (rawcompares495DF5/DFC). Selected byte[-1] ORlocal+B; byte[0]==0 addsbyte[1] tolocal+9; byte[0]==1 addsbyte[1] tolocal+A. Operations are byte-width.495E56..E75 zero-extendedlocal+A multiplier,signed highmultiply /100 sequence,signed uppercap9999.495E87 DX->local+2; sign-extendedDX compared against zero-extended persistentHP,conditionally writespersistent+12 at495E8F; always persistentword->local+0 at495E93..E97.495E9A..EA7 SAR16-bitDX by2,signedAX/DXcompare,mayOR80 local+B. Signed/narrow overflow important.

NATIVE XREF INVENTORY (no purpose inferred):
P4:71-93 incoming486AB8/486B22 from486A10;4959C8 from495960; target47EEB0.
P9:388-429 incoming48B883 from48B7E0,48B97B from48B8B0,495F14 from495EF0,49721B from4971F0. code_targets4954B0,4961D0,496240,496310,496440,4967C0,4968A0,496930,496960,4969E0,496AC0,496AF0,496B50,496BD0. Last2 are NOT displayed CALLs in inspected assembly: code_targets is xref inventory, not proven direct-call list.
PD:155-178 incoming493E24 from493D80,495ECF from495EC0,495F2F from495EF0;targets4960C0,496120.

HISTORICAL CONTEXT / NOT PROMOTION:
INIT:137-171 describes party parse/junction formulas;187-201 describes setBattleSlotData/16GF setup. Navigation/historical prose only; stat-index names and formula prose must not override native. SEAL:5-7 offlinecandidate only;34-47 expressly leaves8junction-derivedparty stats and16five-byteGF records atF_CHAR+122 outside G22 writeallowlist. Existing rewrite/G22 tests therefore do NOT establish complete/live target implementation. Independent forks need this factual inventory AND full packets,495960source discrepancy,GF-local-address uncertainty; no inferred target verdict inherited.
