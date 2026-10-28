# 0x463FC0 — independent semantic A

## Scope and provenance

Only the authorized g05 common compaction and the complete readable native projection were used for this production. No classifier, peer production, target historical verdict/C, index, IDB, live process, or external source was consulted. Discovery history is context, not a semantic verdict.

Input base `I = inputs/ff8-decomp-semantics-20261011-r01/g05/`; readable base `R = I/0x463FC0.readable/` (expand these prefixes in citations below).

- `R/manifest.json:3–7`: authoritative original packet `I/0x463FC0.json`, SHA256 `d50c7dd68e7420c7cf455a100d15735f8e6a6d5fd522533cbbb6283994602291`; compaction SHA256 `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`; projection declared complete/verbatim, 126 assembly lines.
- Read every line of `asm-001.txt` through `asm-006.txt`, all 13 byte-slice lines, and all metadata. Coverage: entire `[0x463FC0,0x464156)`, 21 CFG blocks, both returns, both calls to 0x4188E2, allocation call to 0x467160. `R/metadata.json:11–164,174–178`.
- Byte slices agree with the relevant loads, shifts, calls and full-EAX return sequences. No target-local ASM/byte conflict observed. This is inspection, not an independent re-disassembly, compilation, test, differential comparison or parent §5.6 validation.

## Role, confidence and proposed name

**Proposed name: `Gfx_InitTextureSlotFormatAndEnsurePixels`. Overall confidence: LIKELY.**

**CERTAIN mechanical core:** zero and populate a 0xF0-byte record reached through the second argument's +0x54 field; configure two format branches using numerical bit masks and dimensions; reuse or obtain a backing pointer through second argument +0x58; publish that pointer in record +0xD8; return full-width 0 on success or -1 on allocation failure.

**LIKELY business interpretation:** initialize a texture-slot pixel-format/storage descriptor, choosing 16-bit direct storage for mode 2 and 8-bit indexed storage otherwise, with 256-entry indexed parameters for mode 1 and 16-entry parameters for every other non-2 mode. The name is supported independently by (1) descriptor/dimension/bit-mask construction and (2) backing-pointer allocation/publication. The validated caller/record context adds a separate corroboration, not an old-name proof. This is more than merely describing a format: it conditionally acquires storage.

**UNCERTAIN:** precise semantic names for most flags/fields, meaning of globals 0x1CCFD80/84, exact contracts/hidden effects of 0x4188E2 and 0x467160, whether the latter is an allocator or lookup/pool acquisition. No CONFLICT in the target projection; absence of a validated callee contract limits business certainty. Labels and ASM comments were not used as proofs.

## Inputs and ABI

Five accessed 32-bit cdecl stack words, in logical argument order:

| Slot | Mechanical access | Proposed interpretation |
|---|---|---|
| arg_0 | pointer; on the non-2 branch reads DWORD +0x444 | enclosing context / shared indexed resource (LIKELY) |
| arg_4 | pointer; reads DWORD +0x54 and reads/writes DWORD +0x58 | texture slot (LIKELY, validated surrounding layout) |
| arg_8 | DWORD; initial signed compare with 2, equality branches with 2/1; reloaded after non-2 helper call | mode; not a proven enum limited to 0–2 |
| arg_C | DWORD stored to descriptor +0x3C | width (LIKELY) |
| arg_10 | DWORD stored to descriptor +0x40 | height (LIKELY) |

No ECX-this dependency is visible. EBX/EBP/ESI/EDI are saved/restored; caller cleans the five input words (`RET`, not `RET imm`). Call to 0x4188E2 passes six words, right-to-left pushes, logical order `(16 or 8, 0x7C00, 0x3E0, 0x1F, 0 or 0x8000, descriptor+0x3C)`; caller cleans 0x18. Call to 0x467160 passes one DWORD and caller cleans four bytes. Callee names/prototypes beyond these call-site mechanics are unproved here.

Required ordinary execution assumptions: valid readable/writable pointers and enough descriptor storage; standard forward string direction (DF=0). There is no local `CLD`: `REP STOSD` direction is inherited. No null, size, alignment, dimension-range or overflow guards are implemented. Under DF=0 the clear is exactly 60 DWORDs, stride four, spanning +0 through +0xEC. Descriptor +0x3C is a nested record offset, not an iteration stride.

## Effects and complete branch contract

Let `D` be the pointer loaded once from initial `arg_4+0x54`, `N=D+0x3C`. All mentioned field operations are DWORD-wide, including the descriptor bit-depth fields; there are no byte/WORD field accesses in this function.

1. Load global 0x1CCFD80 before clearing D. Clear D using `REP STOSD`. Load global 0x1CCFD84 after the clear. This ordering matters if memory aliases.
2. Read mode after clearing. Set `D+8` to 1 when global84 is zero, or when global84 is nonzero, signed mode<2 and the earlier global80 value is zero; otherwise set it to 0. Set `D+0x1C` to 1 when global84 is nonzero and either mode==2 or global80 is nonzero; otherwise 0. These two predicates are not simply complementary for arbitrary mode values.
3. Set `D+0x0C=0`, `+0x14=4`, `+0x18=8`, `+0x20=8`, `+0x24=8`, `+0x28=32`, `+0xE8=0`, `+0xEC=0`. Write arg_C/arg_10 into N+0/N+4.
4. **Mode==2:** write `D+4=0`, `D+0x38=16`, and override `D+0x1C=0`; invoke 0x4188E2 with masks 0x7C00/0x3E0/0x1F and zero fifth word. After the call reload N+0, shift left one and store N+8 (`D+0x44`). Jump directly to backing-pointer handling. No explicit context+0x444 read occurs on this path.
5. **Mode!=2:** write `D+4=1`, `D+0xBC=0`, `D+0x38=8`; invoke 0x4188E2 with masks 0x7C00/0x3E0/0x1F and fifth word 0x8000. Reload mode from its stack slot and reload N+0 after the call; store N+8=N+0, N+0x10=1, N+0x14=8, N+0x18=1. Reloaded mode==1 selects `D+0x30=16`, `D+0x34=256`, `N+0x20=256`, `N+0x1C=0x2000`; all other reloaded values select `D+0x30=128`, `D+0x34=16`, `N+0x20=16`, `N+0x1C=0x1000`. Reload arg_0; copy its DWORD +0x444 to N+0x24 (`D+0x60`).
6. Reload arg_4 from the caller stack into EBX (not its +0x54). If its +0x58 is nonzero, skip acquisition. Otherwise read N+8 and N+4, multiply low 32 bits, call 0x467160 with that product, and store the returned EAX to reloaded arg_4+0x58 **even if zero**.
7. Zero acquisition result returns EAX=0xFFFFFFFF without undoing descriptor writes. Nonzero existing/acquired pointer is reloaded from arg_4+0x58, stored to original D+0xD8, then returns EAX=0.

The complete explicit write order above does not define the opaque helpers' intervening writes. Reusing +0x58 does not validate its capacity against changed dimensions/format. Allocation failure is not transactional: descriptor initialization remains visible. D+0xD8 starts zero from the clear under nonaliasing/DF=0, but hidden helper/alias effects prevent promising that it necessarily remains zero on every failed execution.

## Widths, arithmetic, return and alias cautions

- `JGE` at 0x463FF1 is **signed**; other mode selections use equality only. Negative modes are not rejected. Mode>2 enters the same explicit format branch as other non-2 values, but affects the earlier flag predicate differently.
- `SHL ecx,1` at 0x46408D gives low-32-bit `2*post-helper N[0]`. `IMUL edx,[N+4]` at 0x46412A gives low 32 bits; OF/CF are ignored. No checked size arithmetic; no assertion of positive/safe dimensions. Signed versus unsigned multiplication has the same stored low bits here, not the same mathematical range guarantees.
- The return is **EAX32**, not just AL/AX: success `XOR EAX,EAX`; failure `OR EAX,0xFFFFFFFF`. Signed interpretation gives 0/-1; unsigned gives 0/4294967295. It is not a returned storage pointer or Boolean 1-success. Corresponding AL/AX are consequences (0/FF, 0/FFFF), not narrower return evidence.
- Non-2 explicit pitch is the post-helper width value; mode-2 explicit pitch is twice that value. The final size product uses post-helper N+4 (not necessarily the original height). A 16-entry format still has explicit eight-bit storage/pitch; it must not be called a packed four-bit backing store from palette count alone.
- All address/add/shift/product behavior is x86 32-bit wrapping. No x87/SIMD instruction occurs in this target; no local floating-point environment dependency is established. Opaque calls may have additional effects.
- No `restrict`, purity or stable-argument assumption is justified. Mode and arg_4 are reloaded after calls; D remains the initially captured pointer. Globals sampled before/after clearing may differ under aliasing. The clear can affect argument-backed objects; external calls can mutate memory. Name-level contracts above describe ordinary nonpathological record usage, not invented nonalias guarantees.

## Eight evidence anchors

1. **Descriptor construction:** 0x463FC0–0x463FDA, `R/asm-001.txt:1–11`; `R/bytes-001.txt:1`. Second word +0x54 supplies destination, 60 DWORD clear. Independent evidence for initialization rather than a read-only query.
2. **Signed flags:** 0x463FDC–0x464038, `R/asm-001.txt:12–25`, `R/asm-002.txt:1–15`; explicit global predicates, signed JGE and separate equality comparison. Proves limits of a simple mode/flag paraphrase.
3. **Dimensions and format constants:** 0x46403B–0x46408F, `R/asm-002.txt:16–25`, `R/asm-003.txt:1–16`; writes two dimensions, 16-bit field and RGB555 numerical masks, then doubled row-width value. Supports pixel-format interpretation without trusting helper label.
4. **Indexed alternative:** 0x464097–0x46411B, `R/asm-003.txt:18–25`, `R/asm-004.txt:1–25`, `R/asm-005.txt:1`; eight-bit field, 16/256 cardinalities, width pitch and context pointer copy. Second independent format evidence; not proof of the helper internals.
5. **Backing acquisition:** 0x46411E–0x464139, `R/asm-005.txt:2–11`; conditional call with pitch*height and store to slot+0x58. Independent evidence for the `EnsurePixels` part of the proposed name, though exact acquisition mechanism remains unknown.
6. **Publication/full return:** 0x46413C–0x464155, `R/asm-005.txt:12–25`, `R/asm-006.txt:1`; bytes `R/bytes-001.txt:12–13`. Failure -1, success pointer copy D+0xD8 and zero EAX; two exits, no rollback.
7. **Native caller provenance:** `R/metadata.json:166–176` identifies code call at 0x4650B7 inside 0x464F70 and direct callees 0x4188E2/0x467160. Xref is mechanically corroborating, not a semantic name proof.
8. **Validated surrounding layout:** `I/common-compaction.md:17–18` reports prior parent-validated caller record: slot span0x64, format allocation +0x54 size0xF0, current pixels +0x58, w/h fields and shared context+0x444. Together with target writes this supports texture-slot interpretation; cited neighbour history was not independently revalidated here.

## Open questions / validation limits

1. What exactly does 0x4188E2 write in N, and can it mutate dimensions, argument slots, globals or other aliased objects? Six-word call shape is certain; full ABI/effect contract is not frozen here.
2. Is 0x467160 strictly allocation, reusable lookup, or both? What are size-zero/wrapped-size, failure, ownership, release and alias rules? No inferred malloc semantics.
3. What business meanings distinguish globals 0x1CCFD80/84 and D+8/+0x1C? Only their exact predicates are established.
4. Which mode values are admitted by callers, and what do the 0x1000/0x2000 fields represent? Palette cardinality/indexed interpretation is LIKELY, precise field/type names remain UNCERTAIN.
5. Is already-present slot+0x58 guaranteed large enough after descriptor reconfiguration? This target does not establish it.
6. Does the parent ABI enforce DF=0 and nonpathological record/argument/global aliasing? Without those conditions, stronger initialization guarantees would be unjustified.

No promotion, canonical §5.6 conclusion, test result, or verified output hash is claimed. Parent owns reconciliation and final validation.
