# 0x45E9D0 — independent semantic B

## Boundary, provenance, coverage

- Role: semantic B only, task `task_mv44nnji_005r_g9bg9v`; no C, other author's output, classifier, review or verdict consulted.
- Authority: native packet projected by `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E9D0.readable/manifest.json:2-7`, original SHA-256 `20a01d8e22132e51bd91786c830d7529b9608a3d0cdabc88a1981ffcda06cf5e`. Common compaction hash `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`.
- Read all 109 verbatim instructions: `asm-001..004.txt:1-25` and `asm-005.txt:1-9`; all bytes `bytes-001.txt:1-17`, contiguous `[0x45E9D0,0x45EBE9)` (537 bytes); manifest all 45 lines; metadata all 1588 lines; common compaction all 24 lines. Paths abbreviated below are under the same readable directory.
- All 22 CFG blocks covered, starts: `45E9D0,45EA9E,45EAB4,45EABC,45EAD2,45EAD8,45EAE0,45EAFE,45EB05,45EB23,45EB28,45EB30,45EB4E,45EB56,45EB74,45EB7A,45EB82,45EB99,45EBA7,45EBBE,45EBCB,45EBDF` (`metadata.json:11-173`). Final instruction is RET at 45EBE8. No missing native chunk or instruction identified; no independent hash recomputation, compilation or test performed.

## Role, confidence, proposed name

**Proposed name: `GlobalS16Triple_ScaleQ12_ClampAndPushRGB`. Confidence: LIKELY overall.**

**CERTAIN mechanical role:** a global-state leaf computes three floating-point scaled products of a common signed-16 multiplier and three signed-16 components; extracts three integer bit patterns via an x87 biased-double store; overwrites three dword accumulators; writes signed-16-range saturated values to three dword component slots; advances a three-dword packed-byte FIFO, inserts independently unsigned-byte-range saturated components plus an auxiliary byte; clears/rebuilds status bits.

**LIKELY interpretation:** Q12 triple scaling feeding a packed RGB/color FIFO in software GTE-like state. The common compaction supplies the prior factual value `flt_B695F8=1/4096`; operands independently establish shared multiplier, three components, clamp ranges and three adjacent output bytes. No native global type/register declaration or caller body establishes exact hardware instruction identity. RGB and Q12 in the proposed name retain this qualification. A maximally literal alternative is `GlobalS16Triple_Scale_ClampAndPushPackedBytes`.

Two independent name grounds are (1) four MOVSX word loads and three shared-factor x87 products, and (2) FIFO copies plus three separate 0..255 checks/byte stores. The signed-component clamp family is a third independent ground. Prior names and comments are not name evidence. Do not name this by a specific GTE opcode, lighting equation, material operation, or depth-cue behavior on this packet alone.

## Input/output contract (normal completion)

No explicit stack arguments or incoming general-purpose register values are consumed. All effective inputs are fixed-address globals and the x87 environment. Plain RET performs no argument cleanup; this is compatible with a no-argument cdecl-style leaf, but caller source-language prototype is not proved.

| Address | Access and interpretation |
|---|---|
| `1CA8A30` | Low WORD read as signed 16-bit common multiplier; upper WORD ignored; not written. |
| `1CA8A34/38/3C` | Low WORDs read as signed 16-bit components at 4-byte spacing; later **whole DWORDs** overwritten with signed-saturated values. |
| `1CA8A64/68` | Initial DWORD FIFO values copied to `1CA8A60/64` respectively, before changing `1CA8A68`. |
| `1CA8A2B` | BYTE copied to `1CA8A6B`, i.e. output packed dword's byte +3. |
| `B695F8` | m32 real operand of FMUL; nominal 1/4096 from common-compaction.md:7, not a supplied data-byte dump. |
| `B693D8` | m64 real operand of each FADD; nominal biased-double constant from label, not independently dumped data bytes. |
| `1CA8A74/78/7C` | Whole DWORDs receive the three extracted, **unclamped** integer bit patterns at 4-byte spacing. Their prior contents are not read. |
| `1CA92F8` | Whole DWORD cleared then status masks assigned/ORed. Prior value not retained. |
| `1CA8A68/69/6A` | BYTE stores of independently saturated components; these overlap the FIFO DWORD, not separate dword fields. |

All four component inputs are loaded before any component-slot overwrite. Numerical layout is 4-byte spacing for signed-word-in-dword slots and raw products, 4-byte FIFO steps, and 1-byte spacing for packed output. There is no indexed loop or matrix stride.

### Ordered effects

1. Capture old FIFO dwords; store old `64` to `60`, old `68` to `64`.
2. Load first two signed inputs, load auxiliary byte and store it to `6B`, load next component, form shared scale; clear `92F8` at 45EA20.
3. Form first and second biased-double extracted products and store raw results to `74` and `78`. Load final component at 45EA64. Form third product; discard shared scale; store raw result to `7C`.
4. Independently test first/second/third raw results as **signed 32-bit** against -32768 and +32767, storing -32768, +32767 or unchanged raw result to dwords `34/38/3C`. No unsigned-word interpretation or low-word-only store.
5. Independently test the original raw results as **unsigned 32-bit** against 255. On excess, `~(SAR(raw,31))` produces `0x00000000` for negative signed values and `0xFFFFFFFF` for nonnegative values; only its low byte is stored. Otherwise the existing low byte is stored. Thus normal interpretation is clamp to [0,255]. This uses raw results, not the signed-saturated component dwords; there is **no extra shift by 4** before byte extraction.
6. Store bytes in first/second/third order to `68/69/6A`. Restore EBX, release eight local bytes, RET.

Status masks (normal completion): first signed clamp `0x81000000` assigned; second signed clamp OR `0x80800000`; third signed clamp OR **`0x00400000` only**. Byte clamp masks OR `0x00200000`, `0x00100000`, `0x00080000` respectively. Third signed or any byte clamp does not itself introduce bit 31. Reset and OR sequence must not be replaced with an invented aggregate-error rule.

## Exact x87 qualifications

The byte projection resolves ambiguous stack operand types: `DB 44 24 00` is FILD m32 integer; `D8 0D ...` is FMUL m32 real; `DC 05 ...` is FADD m64 real; `DD 5C 24 00` is FSTP m64 real. The eight-byte local is reused for dword integer loading and qword double storing. The following dword MOV reads only the stored double's low 32 bits; ADD/LEA +`0x80000000` wraps modulo 2^32. There is no FIST/FISTP integer conversion.

For each component, the mechanical computation is: retain x87 common factor `FILD(s16[30]) * m32[B695F8]`; multiply FILD(component) by this retained factor; add m64[B693D8]; store binary64 under the existing x87 environment; take its low dword plus `0x80000000` modulo 2^32. The same factor remains live across the three component calculations and is popped by `FSTP ST(0)` at 45EA94.

If the nominal data values are 1/4096 and `2^52+2^31 = 4503601774854144`, and x87 precision/rounding is suitable (e.g. conventional extended or 53-bit precision, nearest-even), the extracted signed result implements rounding of the scaled product. It is **not** proved identical to a truncating C cast or signed arithmetic shift. Reduced x87 precision or another rounding mode can alter the biased-add extraction, including negative halfway behavior. Exact values of the constants and incoming control word are outside the supplied target data evidence; do not assume unconditional round-to-nearest-even.

No control-word load/save, FPU initialization or exception clearing occurs. Normal stack depth change is zero (four FILD pushes, three memory FSTP pops, one register FSTP pop); maximum additional live values are two. Caller FPU stack capacity and exception handling are not established. Arithmetic/store condition codes and sticky status may change; caller x87 environment is not restored. Unmasked exceptions may interrupt after earlier FIFO/tag/global writes; there is no transaction or rollback.

## ABI and AL/AX/EAX

- EBX is saved at 45EADD and restored at 45EBA4 on every normal path; ESI/EDI/EBP are untouched. ESP returns to entry value before RET pops the return address. EAX/ECX/EDX and EFLAGS are volatile effects. No calls or pushed call arguments occur.
- The entry `MOV DL,[1CA8A2B]` is a partial-register write used for the tag store; EDX is fully overwritten by the first extracted product before numerical checks.
- `MOV [1CA8A69],AL` reads AL without changing EAX; similarly DL and CL output stores do not modify their registers. There is no MOVZX return, AL-only result or AX-only result definition.
- Exact residual EAX: if third raw result is unsigned <=255, EAX is the second raw result when unsigned <=255, otherwise its full-word sign-derived byte-clamp surrogate (0 or `0xFFFFFFFF`). If third raw result is unsigned >255, 45EBCB loads accumulated status into EAX and ORs `0x00080000`; EAX then equals final status. This full-width path dependence prevents treating EAX/AX/AL as a stable RGB, status, boolean or pointer return. Side-effect-only source prototype is plausible, but caller return use is unknown.

## Eight independent instruction/xref evidence points

1. **Shared signed triple scaling/name ground:** MOVSX at 45E9E9/45E9F0/45EA0F/45EA64; FMUL common factor at 45EA16 and component multiplies at 45EA2A/45EA4E/45EA78 (`asm-001.txt:6-25`, `asm-002.txt:5-10`).
2. **FIFO plus tag/name ground:** 45E9D3–45E9E3 capture/copy `64/68 -> 60/64`; 45E9FB/45EA09 copy byte `2B -> 6B` (`asm-001.txt:2-12`). This establishes global packed-history mutation independent of the math.
3. **Raw, nonaccumulating output:** low-double extraction, modular +`0x80000000` and full dword stores at 45EA36–45EA48, 45EA5A–45EA6F, 45EA84–45EA96; no reads of prior `74/78/7C` (`asm-001.txt:18-24`, `asm-002.txt:1-16`; `bytes-001.txt:4-7`).
4. **Signed saturation:** JGE/JLE surrounding `FFFF8000/7FFF` plus whole dword component stores, with masks `81000000/80800000/00400000` (`asm-002.txt:14-25`, `asm-003.txt:1-25`, `asm-004.txt:1-7`).
5. **Unsigned byte saturation/name ground:** JBE checks against `FF`, SAR31+NOT on excess, byte stores at 45EB9E/45EBC4/45EBDF (`asm-004.txt:8-25`, `asm-005.txt:1-7`). Native bytes `76` support unsigned JBE, not signed JLE (`bytes-001.txt:14-17`).
6. **Status/return split:** reset 45EA20, then third-byte excess path 45EBCB/45EBD3/45EBDA overwrites EAX with flags, versus bypass 45EBC9 to 45EBDF (`asm-001.txt:16`, `asm-005.txt:1-9`). This proves conditional return-register meaning.
7. **Floating conversion/ABI:** DD5C qword stores and DDD8 scale pop (`bytes-001.txt:4-7`); eight-byte local reservation/release and plain RET (`asm-001.txt:1`, `asm-005.txt:8-9`). No integer conversion opcode or control-word change.
8. **Reused global helper, not caller-local proof:** code call xrefs 56CB64 in function 56CB50, 56CBD4 in 56CBC0, 5D9570 in 5D9510, and multiple xrefs in 657DF0 (`metadata.json:174-204`); `code_targets:[]` at :1586 agrees with complete leaf ASM. Xrefs establish reuse only; absent caller bodies do not prove parameter conventions or returned-value use.

## Source reconciliation and open questions

- Native projected ASM/bytes agree on sign extension, signed JGE/JLE, unsigned JBE, qword real stores, widths and RET. Common compaction's target facts agree; its terms MAC/IR/RGB and nominal constant are prior context, not native data/register-type proof. No contradictory target behavior identified.
- What are the actual immutable data bytes at B695F8/B693D8 and the incoming x87 control word? This is needed for an unconditional numerical rounding contract. No request is necessary to finish this explicitly qualified semantic deliverable; seek a further lead-owned freeze before claiming bit-exact portable arithmetic.
- Do callers consume EAX, AL or AX? Target evidence supports path-dependent residuals, not a stable API return. Caller slices are needed to settle the source prototype.
- Are globals formally documented GTE registers and is the operation intended as a particular GTE instruction? Current operands support a functional description, not that hardware identity.
- Are calls serialized with other writers of this global state? This routine has no lock or reentrancy guard; concurrency safety is unproved.
- No promotion, §5.6 validation, IDB mutation, Git action, ledger/registry write, live action or delegation performed. Output hash is left to the parent.
