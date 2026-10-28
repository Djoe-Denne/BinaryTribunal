# 0x463FC0 — independent semantic B

## Scope and evidence

Read only the authorized g05 common compaction and the complete readable projection: manifest, metadata, asm-001 through asm-006, bytes-001. No other author, C, classifier, review, or target historical conclusion was consulted. No compilation, execution, differential test, hash computation, or native re-export performed.

Projection manifest: `inputs/ff8-decomp-semantics-20261011-r01/g05/0x463FC0.readable/manifest.json:3–7`: authoritative original packet SHA256 `d50c7dd68e7420c7cf455a100d15735f8e6a6d5fd522533cbbb6283994602291`, common-compaction SHA256 `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`, 126 assembly lines. Coverage: entire contiguous byte interval [0x463FC0,0x464156), all 21 exported CFG blocks (`metadata.json:11–164`), both returns. No undecoded byte items appear in this function's projection. Labels/comments are not evidence.

In citations below, R = `inputs/ff8-decomp-semantics-20261011-r01/g05/0x463FC0.readable/`; K = `inputs/ff8-decomp-semantics-20261011-r01/g05/common-compaction.md`.

## Role, confidence, proposed name

**Proposed name: `Gfx_InitTexturePageFormatAndEnsurePixels` — LIKELY.**

Mechanically **CERTAIN**: initialize a 0xF0-byte record reached through the second argument's +0x54 pointer; choose two format configurations according to mode; populate dimensions and a row-byte count; obtain a nonzero second-argument +0x58 value if absent; publish that value at format+0xD8; return a full 32-bit status.

Business interpretation **LIKELY**: the record describes a texture-page pixel format/storage layout, with mode 2 using two bytes per pixel and other modes using one-byte indexed storage. Independent grounds for the name are (a) the mode-dependent 16/8 values, RGB555 masks and computed row size in the native body, and (b) the validated caller record context summarized in K:18, including its +0x54 format allocation, +0x58 current pixels, dimensions/mode, plus the native caller xref at 0x4650B7 in 0x464F70. Neither the current name label nor the helper names establish this interpretation.

**UNCERTAIN**: exact public format structure/member names, meanings of globals 0x1CCFD80/84, and full contracts of callees 0x4188E2/0x467160. In particular, “ensure pixels” denotes nonzero pointer/value acquisition and publication, not a proven fresh heap allocation or initialized pixel contents. No source conflict detected for this target; the separate 0x465720 export discrepancy in K:10 does not affect this function's contiguous bytes.

## Inputs, ABI, return

Five stack DWORD arguments, in logical cdecl order:

1. `context`: accessed at +0x444 on the non-mode-2 branch only.
2. `slot`: +0x54 is read once on entry to obtain the format pointer; +0x58 is tested later, may be written, and is read again on success.
3. `mode`: 32-bit value; one **signed** `mode >= 2` test governs a flag, whereas the format split tests equality to 2 and the indexed subcase tests equality to 1.
4. `width_word`: copied as a DWORD to format+0x3C.
5. `height_word`: copied as a DWORD to format+0x40.

Width/height interpretation is supported by K:18's validated caller context and the native row-size/product calculation. Signedness/domain of these two public inputs is not independently proved. No positivity or supported-mode check is present.

The entry bytes `8b442408` load the second argument before register pushes. Plain RET at 0x464145/0x464155 leaves argument cleanup to the caller. EBX/EBP/ESI/EDI are saved/restored. Each six-word call to 0x4188E2 has a 0x18-byte caller cleanup; the one-word call to 0x467160 has a four-byte cleanup. No x87 instructions or floating-point environment effects occur in this body; unknown callees must not be assumed pure.

Return **EAX32**, not AL or AX:

- `0x00000000` on the success exit, produced by `xor eax,eax`.
- `0xFFFFFFFF` on the acquisition-failure exit, produced by `or eax,0FFFFFFFFh` (conventionally signed -1).

Success includes reuse of any already-nonzero slot+0x58. Failure is not rollback: format initialization and any callee side effects have already occurred, and slot+0x58 was explicitly written zero. No null-argument validation is present.

## Mechanical effects and configuration

Let F be the entry-loaded slot+0x54 value and L = F+0x3C. This notation is descriptive, not a nonalias or immutable-memory promise.

1. Global 0x1CCFD80 is read **before** zeroing F. `rep stosd`, ECX=0x3C, EAX=0, clears 60 DWORDs (240 bytes) under the normal x86 ABI DF=0 precondition. No CLD is issued. Global 0x1CCFD84 is read **after** this clear. Subsequently mode is loaded. The sampled globals are not reloaded for the flag tests.
2. F+0x08 is 1 if the sampled global84 is zero, or if global84 is nonzero and signed mode<2 and sampled global80 is zero; otherwise 0. F+0x0C=0; F+0x14=4; F+0x18=8.
3. F+0x1C is 1 iff sampled global84 is nonzero and either mode==2 or sampled global80 is nonzero; otherwise 0. The mode-2 branch later overwrites F+0x1C with 0.
4. F+0x20=8, +0x24=8, +0x28=32, +0xE8=0, +0xEC=0; L+0=width_word, L+4=height_word. All explicit structure stores here are DWORD stores.
5. If mode==2: F+4=0, F+0x38=16, F+0x1C=0. Call 0x4188E2 with logical arguments `(16, 0x7C00, 0x3E0, 0x1F, 0, L)`; these arise from right-to-left pushes. After the call, reload L+0, shift it left by one and store L+8 (F+0x44). Thus the observed row-byte count is twice the **post-call** L+0, modulo 2^32. No context+0x444 load on this branch.
6. Otherwise: F+4=1, F+0xBC=0, F+0x38=8. Call 0x4188E2 with `(8, 0x7C00, 0x3E0, 0x1F, 0x8000, L)`. Reload mode from its argument slot **after** the call; reload L+0 and store it at L+8. Then L+0x10=1, L+0x14=8, L+0x18=1. For the reloaded mode==1: F+0x30=16, F+0x34=256, L+0x20=256, L+0x1C=0x2000. Otherwise: F+0x30=128, F+0x34=16, L+0x20=16, L+0x1C=0x1000. Finally reload context argument, read context+0x444, and store it at L+0x24 (F+0x60).
7. Reload slot argument; test slot+0x58. If zero, multiply the **current** L+8 by the **current** L+4 using two-operand IMUL and pass the low 32-bit result to 0x467160. The product wraps modulo 2^32; overflow is not checked. Store its EAX result to slot+0x58 before testing it for zero. On nonzero/reuse success, reload slot+0x58 and store it to F+0xD8; return zero. On zero failure, return 0xFFFFFFFF without the final F+0xD8 store.

Under the ordinary disjoint/ABI-respecting interpretation these are 16-bit direct and 8-bit indexed configurations, with indexed mode 1 associated with 256 entries and other non-2 modes with 16 entries. The meanings of F+0x30 and L+0x1C constants are not proved; they must not be renamed to hardware fields merely because their values look familiar. The calls' complete writes and resource ownership cannot be recovered from these call sites alone.

## Width, stride, and alias constraints

- Record clear count is **0x3C DWORDs = 0xF0 bytes**, not a record-table stride. The validated caller's slot span/stride is 0x64 bytes (K:18), distinct from F's allocation size.
- L+8 is row-byte-count evidence, not a proof of external row alignment. Mode 2 applies SHL by 1; other modes copy the post-helper width unchanged. Allocation-request product is row-byte-count times current height, low32 only. Zero, negative, or overflowing dimensions receive no guard.
- All native accesses in this function are DWORD-wide. No AL/AX partial-register writes are used to form return values or arguments. Equality comparisons do not imply signedness; only JGE at 0x463FF1 proves the signed flag decision. IMUL's low32 product is bit-identical to an unsigned low32 product, so it does not alone prove dimension types.
- F is cached from the entry slot+0x54; slot and context argument slots are later reloaded. The helper may change L fields; the body intentionally reads them afterward. Do not snapshot the original width/height and substitute them for those reads, or collapse both mode reads into one without a justified nonalias premise.
- There is no native nonalias/size/capacity check. Existing slot+0x58 is accepted regardless of the newly configured size. If F aliases slot, context, globals, or stack arguments, the zeroing and later writes can alter subsequent reads. Callee writes must be preserved in order. A clean mathematical input-to-field table is valid only with corresponding disjointness assumptions.
- The body requires usable pointers and the usual DF=0 string-operation ABI; it does not establish these conditions itself. Invalid pointers may fault before returning status. The status covers the observed zero result of 0x467160, not all possible failures.

## Eight evidence anchors

1. **Clear and record identity:** 0x463FC0–0x463FDC; R+asm-001.txt:1–12, R+bytes-001.txt:1–2. Entry slot+0x54, zeroed 60 DWORDs, global80/global84 read order.
2. **Signed flag versus equality:** 0x463FEA–0x464038; R+asm-001.txt:17–25 and R+asm-002.txt:1–15. JGE is signed; +0x1C uses mode==2, not mode>=2.
3. **Dimension/common-layout writes:** 0x46403B–0x464064; R+asm-002.txt:16–25 and R+asm-003.txt:1. Width/height words go to L+0/+4 before format split.
4. **Direct-format branch:** 0x464066–0x464092; R+asm-003.txt:2–17. Six-word helper call with 16/RGB555/no alpha mask, row count doubled after helper, +0x1C reset.
5. **Indexed branch and secondary mode read:** 0x464097–0x46411B; R+asm-003.txt:18–25, R+asm-004.txt:1–25, R+asm-005.txt:1. Eight-bit configuration, 0x8000 mask, post-call mode reload, 256/16 split, context+0x444 publication.
6. **Storage acquisition and wrap:** 0x46411E–0x46413C; R+asm-005.txt:2–12. Existing pointer test; current pitch/current height low32 product; one-word call; result stored before failure test.
7. **Full-width returns/publication:** 0x46413E–0x464155; R+asm-005.txt:13–25 and R+asm-006.txt:1, corroborated R+bytes-001.txt:12–13. Failure EAX=-1, success F+0xD8 followed by EAX=0, no RET immediate.
8. **Independent surrounding ownership/layout evidence:** R+metadata.json:166–177 establishes caller 0x4650B7 in 0x464F70 and the two direct targets; K:18 summarizes that caller's validated +0x54 0xF0 format allocation / +0x58 pixel storage / width-height-mode record. This is caller evidence, not endorsement of an inherited target name.

## Open questions for the lead / reconciliation

1. Obtain an authorized frozen contract/native body for 0x4188E2 to establish exactly which fields of L it writes and which mask/bpp meanings are certain. No validated standalone callee contract is supplied (K:26).
2. Establish the exact 0x467160 acquisition, size interpretation, ownership/lifetime and failure contract; a nonzero value may be reused/mapped/pool-backed rather than fresh allocation.
3. Independently identify globals 0x1CCFD80/84 and the structure members currently represented only by offsets. Do not equate the two globals with known renderer switches on label evidence.
4. Does the enclosing contract guarantee modes in {0,1,2}, positive dimensions, capacity adequacy of existing storage, disjoint records and immutable argument slots? Native code permits wider values, signed-negative mode flag behavior and aliased reads/writes.
5. Confirm the usual DF=0 and callee-preserved-register ABI in any final executable reconstruction. This report does not certify a C translation or promote the target in the IDB.
