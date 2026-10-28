COMMON_COMPACTION g07/run01 — FACTS ONLY
Claimed/completed task_mv424nwa_000a_k3yfi5. No edits/IDB/Git/ledger/live/delegation. GrepAI first across retro-eng and sibling rewrite; QMD CLI knowledge searches from retro-eng. Historical target C/semantic artifacts surfaced in search were NOT opened. Native names/comments are labels, not purpose evidence.

ABSOLUTE INVENTORY (aliases for citations)
N47=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x47CF60.json
N50=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x500900.json
NM=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x485FF0.json
NS=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x493840.json
NR=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x485EC0.json
NE=C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x4868C0.json
L=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/reference/battle_slot_layout.md
S=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/battle_slot_data.md
H=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/reference/battle_action_resolve.h
P=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/render_pipeline_scheduling_submit.md
HUD=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/render_hud.md
TIM=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/render_textures_tim.md
END=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/battle_cleanup_and_reset.md
CAT=C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/reference/address_catalog.md
ABI=C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/address-map/ff8_en_064d466b5fe2ba90/abi-ledger.yaml
DRAFT=C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/g12-item-offline-draft-2026-08-18.md
Read C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md:11,16-21 and native-groups.json:55-63 in same absolute directory.

FREEZE
N*:4-10:32-bit FF8_EN.exe SHA256064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570;IDB D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64;export2026-10-11T16:38:25.140966+00:00.
Counts/half-open chunks:N47 209[47CF60,47D285);N50 206[500900,5009A1)+[5005A0,50081F);NM37[485FF0,486074);NS190[493840,493AE3);NR23[485EC0,485EFB);NE90[4868C0,4869F4).
Assembly escaped JSON string on N47:18/N50:23/NM:18/NS:18/NR:18/NE:18; instruction VA supplies provenance within it. Raw hex N*:11 onward. Xrefs N47:323/N50:174/NM:134/NS:216/NR:56/NE:192. Selected E8 destinations below decoded directly from chunk bytes.

LAYOUT / DOCUMENTATION STATUS
L:5-13,23-43 gives slotbase1D27B10,strideD0,logical party0-2/enemy3-7/GF8-10. S:7-10/CAT:632 explicitly deny that IDB logical[11] proves uninterrupted8F0-byte BSS extent. Native loops here cover7 or3.
L:27-43/H:13-45 offsets:+08 DWORD status2,+0C DWORD copy,+14 DWORD ATB,+18 DWORD HP,+7C WORD flags/+7E WORD adjacent,+80 WORD status1,+82 WORD copy,+B8/+B9 bytes,+BB byte id. Native DWORD accesses at+7C span both words. H:5-6 types inferred pseudocode;S:152-163 trailing names including+B9 saved_hp_flag are hypotheses.
ABI:1076-1084 F_CHAR_DATA RVA018FF000=>VA1CFF000,three rows stride1D0,HP WORD+172. ABI:1108-1116 EQUAL VA1D28E78,32 rows*5,id+0/qty+1/other+2..4;ABI:1122-1129 SG_ITEM VA1CFE79C,198 pairs*2. Entries documented proven with receipt names; no new live test. NS/NE arithmetic independently corroborates strides. S:16 admits historical IDA/decompile/transcript semantics: don't promote labels.

N47 FACTS / NEIGHBORS
47CF60 subESP1C;pushEBX/ESI;47CF65 8B742428 loads original-stack+4 intoESI. Engine accesses+BA8/+B88.47D27F-284 restoresESI/EBX/local stack,plainRET; no proven Boolean return type.47CFF8 TEST EAX/47CFFA JZ47D243;separate47D0C5 call/RET path. Pause gate controls47D113->47CCB0.
Raw targets47D022->43FBE8,47D028->409B42,47D02E->409B08,47D034->409B25,47D03C->56BA40,47D271->55AD90,47D277->46BD10. Last label says sub_46BB10 but bytesE894EAFEFF give46BD10.
P:3-10 records prior same-SHA disasm/xref arbitration. P:61-65 driver thunk slots+A0/+9C/+A4;present41DF0C elsewhere. P:16-59 andHUD:19-30 distinguish pre-director zero HUD target from post-director DRAWENV1D969C8+92*index. P:21-27 corrects callee float order .001,0,.0005. N47:323 refs4709EC(in4706B0),5598DD(in559890) type1/iscode=false,not direct calls.

N50 FACTS / NEIGHBORS
Entry no argument load/prologue saves. Six E8 calls508420@50090B,917,923,93A,951,971. Cleanup0C@500932,conditional4@50093F,remaining8@500976. AL stores1D96A90@500928 and1D96A88@500956;conditional head1D96AAC NULL-tested and cleared only after zeroEAX@500942-946.50099C E9FFFBFFFF jumps5005A0: BOTH chunks required.PlainRET50081E.
BYTE1D96A9C masks4@5005A0,8@500668,80@5007A9. TIM:79-89 bit8 gate is caller-side,not inside505D20.Raw50065E->501B60/500663->501230 precede500671->505D20/5006DF->45D610.P:121-129 audio distinction and neighboring508420 callback[node+8]@508434,AL-bit2 test@50843A;indirect callback set not exported.
MOVSX cameraWORD reads5006E4/6F1/6F8/70E/71B/722;calls5006EC->56CD00,500709->56CCE0.Encoded strides:DRAWENV5C,base1D96980 stride14,OT1D8E058 stride8910.Mask80 selects packetspan24000 fromB6D094 or1C000 fromB6D070.Index maskedFF,no <=1 guard in freeze.
N50:174 direct callers47D63D/47D6C5/47D707/47D811 in47CCB0;47D905 in47D900 is type19 jump.P:89-107 director discontiguous tails and47D900 orphan,not fifth director call.

NM FACTS
485FF3 EAX4E0;subtractD0,signedCMPFFFFFF30/JG@486027-2C/486064-69 gives7 offsets4E0..0.BYTE slot+7C tests1/40;40 excludes.Threshold270=3*D0,signedJGE486016 first pass/JL486053 second.SHL ECX before optionalOR1.WORD outputs1CFF570@48602E/1CFF572@48606B.No calls;EBX preserved.
NM:134 code sites47D6D4,48769A,489D9E,48AE0D,48AE3D,493A23,493C07(null owner),493F64,494042,497270;data489DD4/489DFC/489F1E separate.

NS FACTS
Raw entry:original args+4 slot,+8 WORD/BYTE input,+C DWORD EBX;savesEBX/EBP/ESI/EDI,plainRET.SlotstrideD0,F_CHARstride1D0.LiteralDWORD tests80000000/14000/10000;inputBYTE35/4/1;BL9.FlagDWORD RMW modifiesCH04/FB or ANDFFFFFFF7/FFFFFFFB:must preserve adjacent+7E and access width.CopyWORD+82->1D28E30+2*slot@49399D/A4;copyDWORD+0C->1D28E38+4*slot@4939AC/B2.
Calls4938E7/493950->484600;49391D->485030;4939CD->486C70;4939F6->484640;493A17->48C5C0;493A23->485FF0;493A28->4A8460;493A2E->497110;493A84->485EC0;493AC8->493AF0.
493AA7 WORD argument load,AND ECX7F;493AB0 WORD F_CHAR+1B2 store;493A93 AND EBX030E7FFF,493AB7 DWORD F_CHAR+188 store.Document phrase 'authoritative slot commit' doesn't replace actual destinations.Caller sitesNS:216:47DB6C/47DC59/483613/493D01(null)/493FF3/4940B5.

NR FACTS
Entryarg+4;485EC8-CE LEA/LEA/SHL computesD0*arg;485ED1 points1D27BC8(+B8).Two BYTE indices0/1;AL zero-test;AND EAXFF@485EDE before pushes0/id,E8@485EE6->486B40;ADDesp8;BYTE clear485EEE.ESI/EDI preserved,no proven return type.Caller sitesNR:56:485835(in485610),486903(in4868C0),486CB7(in486C70),493A84(in493840).

NE FACTS
SavesEBX/EBP/ESI/EDI;ESI1D27B90(+80),EBP1CFF1B2;BYTE[ESI+3B] compareFF.4868E0/E3/EF computes save-record98 stride from partyBYTE;WORD HP[ESI-68],WORD save+0/+96 stores;AND WORD[ESI]FFDF4868EA.ESI+=D0,EBP+=1D0;signed boundstatusbase+270 gives3 iterations.Call486903->485EC0 thenWORD F_CHAR+1B2.
486927-97B zero-extendedidEDX,qtyBYTE MOVSX EBX;SG scans198*2,signedJL,existing-search then empty-search;writesDL/BL;EQUAL+=5 until1D28F18(base+32*5).No total-buffer clearing in frozen instructions.
48697F zero-extendsresultBYTE,DEC EAX,CMP4,unsignedJA default,JMP DWORD[4869F4+4*EAX].CFG case destinations present,but selector table OUTSIDE chunk ending4869F4.Result-to-case mapping NOT proved from frozen data.Common4869DC E85F4AFEFF->46B440;WORD animation-state0@4869E1;4869EA->4A92F0;plainRET.Sole direct callerNE:192:47D4AF(in47CCB0).

HISTORICAL / UNCERTAINTIES
CAT:36 labels485EC0 queue-clear;CAT:324 labels486B40 magic-deduction,conflicting with frozen bytes/arguments andABI:1108-1116.S/H+B9 names likewise unvalidated.DRAFT:83-117 neighboring486B40/menu prose is OFFLINE DRAFT,not new runtime validation.END:3-5,22-34 priorR0 arbitration;result-to-mode mapping needs missing4869F4 table for independent frozen proof.Native embedded LIVE/static comments not promoted.
QMD exact47CF60/500900 searches had no ff8-wiki hits(not infra failure);semantic-name queries found cleanup/status/lifecycle/readiness leads,not independent proof.No exhaustive globals/xrefs,callback set,fullengine struct,invented bounds,callee ABI/return meaning or new live behavior.Forks retain widths/signed branches/partial registers/BOTH500900 chunks;missing selector data can be requested from supervisor. No target C or semantic verdict supplied.
