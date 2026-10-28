# 0x464DB0 — independent semantic B

## Boundary and coverage

Only the assigned frozen g05 compaction and target readable projection were consumed for this analysis. No peer production, classifier, review, target historical interpretation or C was consulted. Covered all 147 ASM lines, all bytes in `[0x464DB0,0x464F6F)`, and all ten exported CFG blocks, including both early exits and both creation paths. The manifest identifies authoritative original packet SHA256 `9c59075630146d8ae274a6bcb36ffc91b884316984555a9375ec86eba9ab5c9d` and compaction SHA256 `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`; these are supplied hashes, not independently recomputed here.

Citation prefix **I** = `inputs/ff8-decomp-semantics-20261011-r01/g05/`. Assembly citations below refer to `I/0x464DB0.readable/`; neighbouring validated facts are used only as recorded in `I/common-compaction.md`. Names/comments and supplied types are not evidence.

## Role, proposed name and confidence

**Proposed name: `Gfx_EnsureTextureSlotAlphaDrawLists`. Confidence: LIKELY.** Mechanically, this is a lazy pair-builder for fields `slot+0x44` and `slot+0x48`, guarded solely by the first field. One configuration stages alpha-only pixels using CLUT/direct-source conversion; the other derives the pair from an existing object at `slot+0x24`. The word **Ensure** describes the first-field guard, not a guarantee that both lists exist on return.

Independent naming evidence: (1) the guarded entry and two five-word creations of numeric list types 6 and 14, publishing at +44/+48 on both paths; (2) the separate source/CLUT address construction and eight-word call to the previously validated alpha-only converter, together with validated slot geometry in the common context. This is not inferred from the old label. **CERTAIN** for the direct access/control/return mechanics below; **LIKELY** for texture/alpha draw-list interpretation. **UNCERTAIN** for the precise backend/configuration meaning of globals and the policy assigned to list types 6/14. No observed target byte/ASM conflict in the supplied projection; the compaction's decoding conflict concerns another EA and is not transferred to this one.

## Inputs and ABI

- 32-bit near-return, caller-cleaned stack interface: three DWORD argument positions `slot`, packed page key, and record pointer. Entry reads arg0; only the nonzero-global branch reads arg1 and arg2. Arg0 must permit a DWORD read at +44 even for the no-work path; no null guard exists.
- Slot accesses are DWORDs at +4, +8, +0C, +10, +14, +24, +44, +48, +5C, +60. Frozen validated context describes a 0x64-byte slot, coordinates at +4/+8, width/height at +0C/+10 and mode at +14 (`I/common-compaction.md:18,20,23`). No slot array traversal or target-local stride exists.
- Arg2 contributes exactly one **WORD** at +448, zero-extended by `xor eax,eax; mov ax,[...]`. It is not a signed short and does not read a full DWORD. No caller-supplied type is needed to establish this width.
- Global DWORDs read: 1CCFD88 (branch selector), 1CA8A00 (filter selector on the zero branch), 1CB602C (staging base on the nonzero branch). A zero-argument call to 40A04A supplies an opaque buffer pointer; +A50 is read separately for each creation's owner argument, not cached once.
- EBX/ESI/EDI are saved/restored on all paths. EBP is saved/restored only on the nonzero-global working path, where it is used. No target-local x87 instructions or floating-point operations occur. Callee floating-point environment and callback effects are not reconstructed.

## Mechanical contracts and effects

1. If slot+44 is nonzero, return immediately without calling the buffer accessor or doing other work. EAX retains that exact DWORD.
2. Otherwise call 40A04A and branch on global 1CCFD88.
3. **Nonzero selector:** set slot+60 to zero, derive page X=(arg1&15)<<6 and page Y=((SAR32(arg1,4)&1)<<8), then read slot+5C. If zero, call 467160 with one DWORD 0xF0, store its EAX at slot+5C, and return if it is zero. The allocation-like interpretation is tentative: no validated full contract for 467160 was supplied.
4. Initialize the local 0x84-byte descriptor through 40702F with `(0, desc)`, then call 464160 with `(slot)`. The latter's effects are unknown; critically, slot+60 was cleared **before** this call and is read **after** it. It must not be assumed still zero, nor assumed valid without a recovered helper contract.
5. Read the record WORD and current slot/helper-derived fields, then call 4677D0 with eight DWORDs in logical order `(source, 0x800, slot[+60], aux[+44], slot[+0C], slot[+10], slot[+14], clut)` where aux is the post-helper slot+5C pointer. Descriptor+28 receives aux before that call. These values are captured in native load/push order; mutable or overlapping data cannot be treated as pure immutable input.
6. Create `(1,6,desc,0,buffer[+A50])` through 416D82 and store EAX at slot+44. Then set descriptor+2C to 1; call 417FA6 with the first creation result, store its EAX at descriptor+30; reread buffer+A50; create `(1,14,desc,0,owner)` and store EAX at slot+48. Descriptor+28 had held aux during the first creation. The +2C/+30 explicit changes occur only **after** that first creation on this path.
7. **Zero selector:** initialize the descriptor using filter 2 if global 1CA8A00 is nonzero, else 0. Set descriptor+2C=1 and descriptor+30 to the result of 417FA6(slot[+24]) **before** either creation. Create types 6 then 14 with the same five-word pattern, publishing at +44 then +48 and rereading owner between calls. This branch does not itself clear +60, allocate +5C, read the record WORD, or call the converter.

Validated external effects: 40702F initializes a 0x84-byte descriptor, with first argument a filter; 416D82 is a five-word cdecl constructor returning a 32-bit pointer/NULL on controlled paths and may perform allocation, callbacks and other external effects; 4677D0 writes alpha-only destination WORDs, uses mode-dependent source/CLUT interpretation and has residual EAX rather than a status (`I/common-compaction.md:13–15`). These frozen neighbouring facts do not establish cleanliness, bounds or success guarantees for this target. 417FA6 and 464160 lack recovered full contracts in the input.

## Arithmetic, widths, aliasing and return

Let B be the DWORD staging base read at 464E57; T the zero-extended record WORD; m the DWORD loaded from slot+14 at 464E47; x/y the DWORDs later loaded from slot+4/+8. All address additions/multiplications below have x86 32-bit wrap semantics:

- `clut = B + (T << 5)`. The `T&63` and `(T>>6)<<6` terms recombine all 16 bits, with no 0x7FFF mask here. Documentary geometry agrees with this offset (`I/common-compaction.md:23`).
- `source = B + 2 * (((y + (((SAR32(arg1,4)) & 1) << 8)) << 10) + ((arg1 & 15) << 6) + SAR32(x, (2-m)&31))`.
- Both SAR instructions are arithmetic signed shifts; the variable shift takes CL and is masked to five bits by x86. There is no guard that m belongs to 0/1/2 or that x/y/dimensions are nonnegative. Page extraction isolates bit4 even for negative arg1. CLUT decomposition instead uses logical SHR after zero-extension.
- Source row pitch argument is **0x800 bytes**, equivalent to 1024 WORDs. Y arithmetic uses `<<10` in WORD indices and the final address scaling is ×2; do not turn the documentary row typo into ×0x800 WORDs. Destination pitch is aux+44, not descriptor+44.
- All publication stores and descriptor field writes here are DWORD-wide. Output pixel WORD writes belong to 4677D0, whose frozen contract explicitly includes mode-dependent pitch/width and alias limitations; no independent nonalias, buffer-capacity or lifetime guarantee is present.
- **EAX32 return, not AL/AX status:** existing first pointer on the guarded early return; zero on the allocation-result-zero exit; result of the second 416D82 call on either completed working path. Epilogues preserve EAX. No conversion to boolean, no explicit success code and no inference from AL alone is justified. Whether callers semantically consume this residual return is unknown.
- There are no checks after either creation. In particular, first success followed by second failure leaves +44 nonzero and +48 zero, and the next call's guard skips repair. First failure does not prevent the second creation or the intervening 417FA6 call. Constructor/helper callbacks can mutate aliased objects, so these consequences assume only the indicated writes, not hidden callee purity.

## Eight independent native evidence anchors

1. **Lazy guard and ABI:** 464DB0–464DD9; `asm-001.txt:1–13`; bytes `bytes-001.txt:1–2`. DWORD +44 determines the early exit; buffer lookup precedes selector testing.
2. **Auxiliary state and failure exit:** 464DDF–464E1B; `asm-001.txt:14–25`, `asm-002.txt:1–6`; +60 zero, page-bit extraction, +5C fetch/store and zero-result exit.
3. **Initialization and partial-register read:** 464E21–464E5C; `asm-002.txt:7–25`; initializer/helper order, `xor eax; mov ax` establishes unsigned 16-bit CLUT input, logical decomposition then ×32.
4. **Eight-word converter call and signed geometry:** 464E5F–464E9C; `asm-003.txt:1–25`, `asm-004.txt:1`; +5C/+44 pitch, +60 destination, dimensions/mode, SAR variable count, 0x800 source pitch and ×2 pointer scale. Frozen validated converter ABI: `I/common-compaction.md:13`.
5. **Nonzero-path pair publication/order:** 464EA1–464EF7; `asm-004.txt:2–25`, `asm-005.txt:1–6`; types6/14, +44/+48 stores and post-first descriptor changes. Bytes show descriptor+2C/+30 from their stack-relative addresses (`bytes-001.txt:9–10`).
6. **Alternate filter and reuse path:** 464EF8–464F2E; `asm-005.txt:7–25`; global-dependent filter, slot+24 helper input and descriptor changes before creation.
7. **Second path's pair and EAX-preserving return:** 464F34–464F6E; `asm-005.txt:25`, `asm-006.txt:1–22`; owner reload, two construction calls, pointer publication and no status synthesis. Bytes `bytes-001.txt:12–14` confirm DWORD stores and C3 return.
8. **Independent caller context:** `metadata.json:84–106` identifies calls at 464CCC from 464BD0 and 465FAF from 465CE0, plus seven direct targets. The frozen validated surrounding records/slot geometry are summarized at `I/common-compaction.md:18–20`. Xrefs establish relationships, not a business verdict from caller filenames.

## Explicit unknowns and limits

- What precise backend condition does 1CCFD88 encode, and why does 1CA8A00 select filter2? No independent business meaning supplied.
- What exact state does 464160 populate, especially +60 and aux+44? Does it establish destination validity and capacities? No invented guard or prototype supplied here.
- What ownership, pooling, failure and side-effect contract does 467160(0xF0) have? The label is not proof of allocation semantics.
- What does 417FA6 return for zero or invalid input, and what does descriptor+30 mean beyond holding that result? Numeric accesses are certain; nested-object meaning is tentative.
- Why list types6/14 and descriptor+2C=1 are paired; whether these are specifically opacity/alpha passes rather than other draw policies remains uncertain.
- Inputs can alias global/buffer/slot/record state; callbacks and opaque helpers may mutate it. No synchronization, range, rollback, second-list repair, or purity contract is established.

No compilation, test, differential execution, live inspection, independent hash computation or §5.6 validation was performed. This is an independent semantic proposal for parent reconciliation, not promotion.
