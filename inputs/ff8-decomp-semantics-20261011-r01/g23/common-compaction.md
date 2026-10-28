COMMON_COMPACTION g23 / run01. Task task_mv424nws_000p_0o9fn3 claimed/completed. Read-only: no edits/IDB/Git/ledger/live/delegation. GrepAI first without workspace; QMD CLI for knowledge; Context Mode for processing; common root retro-eng. No sibling producer content consumed.

SOURCE INVENTORY (IDs below resolve to these absolute path:line sources):
K: C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md:14-21,39-41. AGENT.md also read.
G: C:/Users/djden/source/repos/retro-eng/re-ff8/docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json:182-187.
N1: C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x50A690.json:4-18,26-43.
N2: C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x50A6C0.json:4-18,26-37.
N3: C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x50E510.json:4-18 (identity/raw bytes/ASM),19-1019(CFG),1020-1051(xrefs),1052-1217(targets/count).
N4: C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x504BB0.json:18.
N5: C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x506690.json:18.
N6: C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x50BF90.json:18.
N7: C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/ff8-decomp-semantics-20261011-r01/native/0x50A670.json:18.
E: C:/Program Files (x86)/Steam/steamapps/common/FINAL FANTASY VIII/FF8_EN.exe (static file bytes).
D1: C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/render_stages.md:3-5,15-32,39-75.
D2: C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/systems/render_action_sequences.md:104-119.
D3: C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/investigation/battle-static-discovery/semantic-certainty.md:414-415,440.
D4: C:/Users/djden/source/repos/retro-eng/re-ff8/docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md:231-232.
W1: C:/Users/djden/source/repos/retro-eng/re-ff8/obsidian-docs/projects/re-ff8/concepts/battle-action-sequencing.md:24-39 (qmd get #33591e).
R1: C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/g09-attack-slice-offline-validation-2026-08-14.md:72-83.

IDENTITY:
N1/N2/N3:4-9 identify 32-bit input, IDB D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64, exported2026-10-11T16:38:25.140966+00:00. Input SHA256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570. Independent read-only E hash EXACTLY matches; E size22,124,216, PE machine0x14C/imagebase0x400000.
Packet SHA256: N1=6454ea00a9a491fb2b36e4936a77fd0d93e1fc47100cfd70e2b1e2f4ad55e5e3; N2=3cc7424a0ccbf79e66b0d943aa43a2fea7c7475c2bc8b9a145d023578c546ca8; N3=ac4d3766e12f8727d8a7d0bd71951c6fadc56fe3300fccc42bf8fa1c99adb871.
Labels/inline old commentary are not purpose evidence.

NATIVE TARGET FACTS:
•50A690: [50A690,50A6B6),0x26 bytes/11 instructions/one CFG block. Raw A1 operand identifies DWORD global1D99A60 (label result_event). @50A695 copies original load into ECX; @50A697 adds0x18 to EAX; @50A69A pushes original ECX; @50A69B writes incremented word to global BEFORE @50A6A0 CALL506690. @50A6A5 RELOADS global after call; @50A6AA addsESP,4; @50A6AD reads one byte from reloaded address toCL; @50A6AF writes byte1D99A48; @50A6B5 RET. No local frame/argument/bounds/null test. EAX at RET is reloaded global word (register fact, not C return type). Preserve call/write/reload ordering; no assumption callee preserves global. [N1:15,18]
•50A6C0: [50A6C0,50A6CD),0x0D bytes/5 instructions/one CFG block. DWORD load1D99A60; PUSH EAX@50A6C5; CALL506690@50A6C6; POP ECX@50A6CB; RET@50A6CC. No direct cursor increment/store or byte1D99A48 store locally. POP has an ECX effect, not just abstract cleanup. EAX not overwritten after call; declared return type unknown. Both wrappers plainRET and locally clean their one pushed callee word. [N2:15,18]
•50E510: [50E510,50EE1B),0x90B bytes/821 instructions/166 CFG blocks. @50E510 reads DWORD1D98990 (label BattleStageNumber); @50E516 zeroesEAX; @50E518 masksECX,0xFF; @50E51E compares0xA2; unsignedJA@50E524 ->50EE1A plainRET; JMP@50E52A uses absolute table50EE1C, scale4. Higher24 global bits do not affect selector; out-of-range path makes no target call or stack argument read, leaves zeroEAX. [N3:15,18]
•163 case stubs at50E531+14*i(i0..162): load[ESP+4] into rotatingEAX/ECX/EDX, push same32-bit word, one directCALL, addESP,4, RET. No second argument or ECX object argument established. NoEAX overwrite after target call. Arg pointerness/signedness and return type not established by forwarding. Raw decoding verified ALL163 E8 calls followed by83 C4 04 C3; 163 distinct rel32 targets exactly equal exported code_targets. Counts MOV164; XOR/AND/CMP/JA/JMP1 each; PUSH/CALL/ADD/RET163 each. [N3:15,18,1052-1217]

SUPPLEMENTAL RAW TABLE VALIDATION:
Packet chunk excludes table; independently read E only AFTER full hash match. PE .text RVA/raw0x1000,size0x768000. VA50EE1C -> file offset10EE1C. ALL163 little-endian DWORDs /652 bytes satisfy entry[i]=50E531+14*i; first50E531,last50EE0D. E file range[0x10EE1C,0x10F0A8) SHA256=61ba449f67a8dab7b273a85d004bcdd3edcbdfaae340d3229b5c2d2c73b89cb5. Indirect destinations completely covered for selector0..162 in this same-hash static input. No evidence artifact written: parent may freeze these bytes separately.
Rel32 spots: case0 CALL50E536->51AFF0;37->518A80;44->518370;45->5181C0;46->517FF0;91 CALL50EA30->515870;92 CALL50EA3E->515620;137 CALL50ECB4->50DF10;142->512500;147->511DB0;162 CALL50EE12->511090. Do not replace direct wrapper targets with historical worker addresses.

XREFS / SURROUNDINGS:
N1: caller504E29 in504BB0 and56FCA0 in56F9C0. N2:504E43 in504BB0. N3:50566F in504BB0;5066BC in506690;506D44/506D5F in506CF0;506DFD in506DE0. Exported type17/code refs, not exhaustive runtime-call proof.
N4@504BE7..504BF9 masks opcode8bits/subtracts0x80/bounds0x3F/switches. Native case178/0xB2 site504E29 calls50A690; case183/0xB7 site504E43 calls50A6C0. @505668..505676 zeroesEAX, loads one byte through word[ESI], pushes zero-extended value, calls50E510@50566F. N4 native instruction_count1088; do not inherit historical1021.
N6@50BFA8/50BFAD reads DWORDdescriptor+8 and stores1D99A60; @50C07A..50C07F reads descriptor+8 then byte0 and stores1D99A48 on guarded path. N7@50A677 loads byte descriptor+0x10 into zeroedECX; @50A67A loads DWORDdescriptor+8; pushes count then pointer, calls506BA0. These corroborate two descriptor offsets, not whole wiki layout.
N4@505149..505156 zero-extends1D99A48 and computes1D972C0+156*byte. N5@50669A..5066A4 separately uses incoming record byte0 for same address. @506692 loads incoming stack word asESI pointer; @506699 pushes it; @5066AB calls493D80. @5066B0 loads actor byte+4, compares0x8C@5066B6; only equal branch pushes literal3 and calls50E510@5066BC.
N5 record accesses: u8+0@50669A;u8+1@506789; byte tests+2@506749,+3@5067AB;u16+4@5066D7;u32+8@5066F0/506736/50677E; second region u8+0xC@506804,u8+0xD@506836,u16+0x10@506822,u32+0x14@506816. Compatible with two12-byte regions within observed24-byte stride; purposes not assigned. Tail popsEDI/ESI/EBX, plainRET506852.

HISTORICAL / NOT NEWLY CERTIFIED:
D1 records September parent spot-checks, wrapper/worker split, mode2 registration/init family,156 common0xA7 wrappers and exceptions; only dispatch bytes/table freshly checked here, not all wrapper internals/CFG equivalence. D2:104-114 explicitly says one-vote/flagged size findings, bodiesPC-25; :116-119 opcode mapping independently corroborated above. D3 lists wrappers SKIP_NODECOMP and50E510 SKIP_CHUNK(>600), not reconciledC completion. W1:28-39 proposes payload/event meanings; descriptor+8/+0x10 and access widths corroborated, broader domain/status/popup meanings NOT revalidated. R1 is historical rewrite ownership/timing warning, not target ABI proof. D4 old name BS_GetCameraOffsetMain is historical only.

UNCERTAINTIES / FORK GUARDS:
No target C/prototype/business verdict. Do not invent length/null validity from0x18 add, callee global preservation, source signedness or return type. Keep50A690 post-call reload and50A6C0 POP register effect. Table is checked against exact input but supplemental to frozen packet; archive separately if gate requires. Full contexts506CF0/506DE0/56F9C0 unavailable in owned export corpus. Full stage-wrapper internals/event-purpose labels remain uncertified here. A factual peer request to discover-g17 was sent, unanswered at report preparation; every result above independently sourced.
