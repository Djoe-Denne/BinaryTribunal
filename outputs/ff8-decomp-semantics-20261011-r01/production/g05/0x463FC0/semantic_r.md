# 0x463FC0 — final reconciled semantic contract (R)

## Scope, provenance and coverage

R: `sem-r-463fc0`, task `task_mv44rk71_0070_3hn3uz`; semantic volet only. All input citations below are relative to `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g05/0x463FC0/semantic/`.

The parent deposited two independent native author sessions in `manifest.json`: A `ses_ed3d00728ffewqd9qWPydYIdwF`, B `ses_ed3d003ccffed2uqWdv6mAWDLn`; both `openai/gpt-6.1-sol`, variant `high`. A SHA256 `6f44663166323359c2eaaadc28a8727e21c3cbf3a1ba4a896a54cfe5f6191563`; B SHA256 `a79530b0c8bba6a548eb264a4fb61724f75fc70a9189f94f3cd2e18f797fbb7c`. Both authors and hashes are present; session identifiers differ. Independence is parent-frozen provenance, not something R can independently audit through session inspection.

Native packet SHA256 `d50c7dd68e7420c7cf455a100d15735f8e6a6d5fd522533cbbb6283994602291`; common compaction SHA256 `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`. These match the declarations in both candidates and `native-manifest.json`. Slice hashes/lengths declared in the reconciliation manifest agree with the native projection manifest (the parent renamed the slice files with `native-` prefixes). No declaration inconsistency found. Raw-file hashes were not recomputed with the permitted tools; parent must verify input integrity and compute the output hash.

Read A/B, complete common compaction, original packet, every line of `native-asm-001.txt` through `native-asm-006.txt`, all 13 lines of `native-bytes-001.txt`, complete `native-metadata.json`, and projection provenance. The read tool abbreviated original JSON assembly line 18; that abbreviated text was NOT used for coverage or inference. Its complete verbatim split projection supplies all 126 instructions. Original chunk hex line 15 and CFG/xrefs were readable in full. Byte-slice coverage is 406 bytes (`0x196`), `[0x463FC0,0x464156)`, one chunk, all 21 CFG blocks and two returns. Export: 2026-10-11T16:38:25.140966+00:00, 32-bit input SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

No other volet/output, historical target verdict, index, IDA, live process, shell, API, git or registry was accessed. This is a final semantic deliverable, not the separate reconciled-C deliverable or native §5.6 acceptance.

## Final role and name

**Proposed name: `Gfx_InitTextureSlotFormatAndEnsurePixels`. Overall business confidence: LIKELY.**

**CERTAIN, subject to ordinary valid-pointer/cdecl execution:** configure the record initially reached through argument 2's +0x54 pointer; choose mode-dependent 16/8 numeric format settings and row-size arithmetic; retain or acquire a nonzero value at the later-reloaded argument 2's +0x58; publish it into the original record +0xD8; return full EAX zero or `0xFFFFFFFF`.

**LIKELY interpretation:** initialize a texture-slot pixel-format/storage descriptor, mode 2 selecting two-byte direct storage and other modes one-byte indexed storage. Indexed mode 1 has 256-entry parameters, other non-2 modes 16-entry parameters. The 16-entry branch is NOT demonstrably packed four-bit pixel storage: native row size is still width, not width/2.

Two independent native grounds support the role: (1) dimension, 16/8 settings, RGB555-shaped masks and row-size construction; (2) conditional acquisition using row-size times height followed by backing-value publication. The authorized compaction's parent-validated caller layout (+0x54 record allocation, +0x58 current pixels, slot span 0x64) independently corroborates the slot interpretation. An xref alone does not prove those business names, nor do labels/comments.

**UNCERTAIN:** exact public structure/enum/member names, meanings of globals `0x1CCFD80/84`, meanings of the 0x1000/0x2000 and 16/128 parameters, precise helper writes, acquisition ownership/lifetime and whether acquisition is fresh allocation, lookup or pool reuse. No unresolved native conflict was found for this target. CERTAIN mechanical statements do not elevate these business details.

## ABI and input/output contract

Five accessed 32-bit cdecl argument words:

| Position | Native use | Interpretation |
|---|---|---|
| 1 / arg_0 | later load of pointer; DWORD at +0x444 only on non-2 branch | context/shared indexed resource, LIKELY |
| 2 / arg_4 | initial pointer +0x54; later reloaded pointer +0x58 read/write | texture slot, LIKELY |
| 3 / arg_8 | signed comparison with 2 for one flag; equality with 2 for format; post-helper reload and equality with 1 | unrestricted mode word; no proven enum domain |
| 4 / arg_C | DWORD copied to original record +0x3C | width, LIKELY; public signedness unproved |
| 5 / arg_10 | DWORD copied to original record +0x40 | height, LIKELY; public signedness unproved |

No ECX-this requirement appears. EBX/EBP/ESI/EDI are saved/restored; plain RET leaves caller arguments in place. Six-word direct call sites at `0x464083` and `0x4640BA` target `0x4188E2`, with caller cleanup 0x18. Logical pushed arguments are `(16,0x7C00,0x3E0,0x1F,0,N)` and `(8,0x7C00,0x3E0,0x1F,0x8000,N)`. `0x46412F` targets `0x467160`, one pushed DWORD, caller cleanup four bytes. These are call-site shapes, NOT independently recovered public prototypes or pure-helper contracts.

Success is EAX32 `0x00000000`; controlled acquisition failure is EAX32 `0xFFFFFFFF` (signed -1). No AL/AX-only return, returned backing pointer, 1-success Boolean, or blanket invalid-input error contract. Pixel contents are not initialized by any explicit target instruction; only the descriptor is cleared. Failure preserves prior descriptor/callee effects and writes the zero acquisition result into +0x58.

## Ordered mechanical contract, covering every CFG path

Let `D` be the initially loaded argument-2 +0x54 value and `N=D+0x3C`. These cached addresses are not reloaded from +0x54 later. All explicit target memory accesses/stores are DWORD-wide; address arithmetic is x86 32-bit. The following order is part of the contract, not a purity/nonalias assumption.

1. Load argument 2, then its +0x54 into D. Read global80 before the clear. `REP STOSD` writes 60 zero DWORDs starting at D. With normal DF=0 this clears `[D,D+0xF0)` at stride four. There is no CLD; with DF=1 the stores instead address `D-4*i`, i=0..59. Then read global84 and construct N. Read mode once on either global84 branch, before writing D+8.
2. Initial D+8 = 1 iff sampled global84 is zero OR (sampled global84 nonzero AND signed mode<2 AND sampled global80 zero); otherwise 0. Write D+0x0C=0, D+0x14=4, D+0x18=8, in that order. Initial D+0x1C = 1 iff sampled global84 nonzero AND (sampled mode==2 OR sampled global80 nonzero); otherwise 0. The predicates are not complements over all mode words.
3. Load width into EDX, THEN height into EAX, BEFORE the following stores. Compare cached mode with 2; subsequent MOV stores preserve those comparison flags. Store D+0x20=8, +0x24=8, +0x28=32, +0xE8=0, +0xEC=0, then N+0=the captured width, N+4=the captured height. Both source dimension loads precede either dimension store; neither should be replaced with a later argument reload.
4. **Cached mode==2:** push the six arguments for 0x4188E2 in native right-to-left order; write D+4=0, D+0x38=16, D+0x1C=0 before that call. After return, read N+0, clean the argument stack, shift the loaded DWORD left by one, store N+8. Jump directly to step 6. There is no explicit context+0x444 read or indexed-parameter setup on this branch.
5. **Cached mode!=2:** push the alternative six arguments; write D+4=1, D+0xBC=0, D+0x38=8 before the helper. After return, reload mode from its caller argument slot BEFORE reading N+0. Clean the six words, compare reloaded mode with 1, and write N+8=the captured post-helper N+0, N+0x10=1, N+0x14=8, N+0x18=1. If reloaded mode==1, store D+0x30=16, D+0x34=256, N+0x20=256, N+0x1C=0x2000. Otherwise store D+0x30=128, D+0x34=16, N+0x20=16, N+0x1C=0x1000. Reload argument 1, read its +0x444, store that DWORD to N+0x24 (=D+0x60).
6. Reload argument 2 into EBX; compare its current +0x58 with zero. If nonzero, branch to success without size validation or acquisition. If zero, read current N+8, multiply by current N+4 via two-operand IMUL (low32 result), push that word and call 0x467160. Clean four bytes. **Compare returned EAX with zero at 0x464137, then store EAX to EBX+0x58 at 0x464139, then JNZ at 0x46413C uses the saved comparison flags.** The comparison is not a reload/test of the stored field. A zero result selects failure even if aliases would make a later memory read different.
7. **Failure:** restore EDI/ESI/EBP, force EAX to all ones with OR, restore EBX, RET at 0x464145. No final D+0xD8 publication and no rollback. **Success, whether reuse or acquisition:** load EBX+0x58 into EAX, restore EDI, store captured EAX to original D+0xD8, restore ESI/EBP, XOR EAX to zero, restore EBX, RET at 0x464155. Publication precedes success return. No +0x54 reload or capacity comparison occurs.

This covers the global84 branch; signed mode/global80 flag subbranches; second flag subbranches; direct versus indexed branch; both indexed subcases; reuse/acquisition; and both returns (all 21 exported CFG blocks). A semantic contract does not assign effects to opaque callees beyond their observed call-site use.

## Widths, aliasing, arithmetic and environment

- JGE at 0x463FF1 is signed. Format and indexed selections are equality tests, not signed bounds. Negative and >2 modes are not rejected; initial flag behavior need not match the format branch classification. The mode-2 branch overwrites its earlier D+0x1C flag with zero.
- SHL by literal one computes low32 doubled post-helper N+0; there is no variable-shift masking issue here. IMUL computes low32 current row-size times current height, without overflow handling. The low product alone cannot prove signed dimension types. Zero/negative/wrapped sizes have no guards. Only a zero acquisition result has the controlled error exit.
- No byte/WORD fields, AL/AX argument formation or partial-register return construction occurs. AL/AX values on return are consequences of the full EAX result.
- Clear size 0xF0 is descriptor extent under DF=0, not slot-table stride. Authorized caller context reports slot span 0x64; N+8 is row-size evidence, not external alignment or allocation-capacity proof.
- Global80 is sampled before clearing, global84 afterward. Mode is sampled after clearing, then reloaded only on the non-2 path after the helper. Dimensions are loaded together before subsequent stores; current N fields are reread after calls. Context and slot argument pointers are also later reloaded. No `restrict`, immutable-argument or snapshot-original-width/height substitution is justified.
- Aliases to globals, argument slots, slot fields or descriptor fields can change later reads. Callees can mutate memory. Failure does not universally imply D+0xD8 remains zero: clear direction, aliasing and opaque writes matter. The successful acquired/reused field is reread before publication. Native stack-alias corruption may invalidate saved-register/return-address assumptions; this contract is not a portable-C safety claim for arbitrary hostile overlaps.
- No x87/SIMD instruction or local FP-control/status manipulation appears. Do not invent floating-point rounding dependencies for this body, nor promise that unknown callees preserve the entire x87 environment. REP STOSD depends on inherited DF; valid storage and ordinary callee-preserved-register/cdecl behavior are execution preconditions, not checks added by the target.

## A/B reconciliation and common-error audit

| Question | A / B | ASM-based decision |
|---|---|---|
| Business name | A says TextureSlot; B says TexturePage | Choose TextureSlot to identify the argument record, supported by the authorized caller's 0x64 slot layout. Target body proves neither hardware-page identity nor unique public vocabulary; business name stays LIKELY. |
| Core role, modes, return and allocation path | Broad agreement | Independently rechecked clear, flags, masks, dimensions, calls, product and both exits against all native slices/CFG. Agreement is not the evidence. |
| Allocation versus acquisition | A sometimes uses allocation shorthand; B explicitly warns against fresh-heap semantics | Use acquisition/ensure-nonzero. Only the call argument, returned-word use and null branch are proven; labels do not establish allocator implementation. |
| Result store/test ordering | B effects step 7 says store before testing zero; both use “store before failure test” summaries | CMP precedes MOV, then JNZ; MOV preserves flags. Distinguish comparison from branch. Final contract fixes this and tests returned EAX, not a post-store field reload. |
| Full memory-access order | Both accurately emphasize post-helper/argument reloads but group common stores and dimension copies | Add explicit pre-store width THEN height captures and exact post-helper mode-before-width read. Important for aliased arguments/records; no conflict with ordinary disjoint-field results. |
| Indexed interpretation and exact palette/flags | Both LIKELY/UNCERTAIN | Keep one-byte row-size/16-or-256 numeric parameters; do not invent packed four-bit storage, exact hardware flag names or helper-owned field meanings. |
| Failed D+0xD8 | A explicitly warns against guaranteeing zero; B states no final publication | Both are compatible: no final explicit store is CERTAIN; final field zero is only an ordinary disjoint/DF=0 inference, not universal. |

No substantive remaining A/B mechanical conflict after the corrections above. Both authors' cdecl/full-EAX/DF/signed-mode/low32-product cautions survive native rederivation. Both leave helper internals and global/field semantics unresolved; shared agreement does not resolve those uncertainties.

## Eight exact evidence anchors

1. **Initialization and sampling:** `0x463FC0–0x463FDC`, `native-asm-001.txt:1–12`; `native-bytes-001.txt:1–2`. Entry stack load, slot+0x54, global80, `B9 3C 00 00 00` and `F3 AB`, then global84: descriptor mutation rather than read-only description.
2. **Flag signedness:** `0x463FEA–0x464038`, `native-asm-001.txt:17–25`, `native-asm-002.txt:1–15`; `native-bytes-001.txt:2–4`. Signed `7D 04` JGE differs from separate `mode==2` equality test.
3. **Dimension captures/common stores:** `0x46403B–0x464064`, `native-asm-002.txt:16–25`, `native-asm-003.txt:1`; `native-bytes-001.txt:4–6`. Two source loads precede layout/dimension stores; cached equality flags control the format split.
4. **Direct format/row size:** `0x464066–0x464092`, `native-asm-003.txt:2–17`; `native-bytes-001.txt:6–7`. Six-word 16/masks call and post-call `D1 E1` SHL support two-byte pixel-layout interpretation. E8 relative target resolves to 0x4188E2.
5. **Indexed subcases:** `0x464097–0x46411B`, `native-asm-003.txt:18–25`, `native-asm-004.txt:1–25`, `native-asm-005.txt:1`; `native-bytes-001.txt:7–12`. Eight setting, post-call mode reload, one-byte row count, 256/16 parameters and context+0x444 copy.
6. **Acquire and exact zero comparison:** `0x46411E–0x46413C`, `native-asm-005.txt:2–12`; `native-bytes-001.txt:12`. `0F AF 57 04` low32 IMUL; E8 resolves to 0x467160; `3B C5 89 43 58 75 08` proves compare/store/branch ordering.
7. **Publication/full-width statuses:** `0x46413E–0x464155`, `native-asm-005.txt:13–25`, `native-asm-006.txt:1`; `native-bytes-001.txt:13`. `83 C8 FF` makes EAX=-1; success DWORD +0xD8 publication then `33 C0`; both RET opcodes are C3.
8. **Caller/layout corroboration:** `native-metadata.json:166–178` freezes code xref 0x4650B7 in 0x464F70, and both direct targets. `common-compaction.md:17–18` supplies authorized parent-validated caller record size/fields. This context supports the slot business interpretation; its labels and neighbouring function names are not independent opcode proof.

## Remaining limits and parent gates

No local native-byte/CFG disagreement observed. No executable reconstruction, compilation, test, new callee capture, native re-export, IDB mutation or §5.6 promotion was performed. Parent owns hash verification, final native §5.6 and any promotion.

Before stronger business/ownership guarantees: obtain frozen native contracts for 0x4188E2 and 0x467160; identify globals/opaque flags; establish caller mode/dimension/capacity and alias/DF preconditions. These captures are not needed to deliver the bounded mechanical contract above, but their absence remains explicitly UNCERTAIN, not a fabricated CERTAIN verdict.
