# 0x56C090 — independent semantic B

## Boundary and coverage

Only the authorized g02 input projection and common instructions were read in this production. No author, classifier, review or target C was consulted. The inherited reader history is factual discovery, not an author history.

Input manifest: original packet SHA-256 `e68f56607e807248d56cc62139e98f0783ff8f47fb67210c5983f809fc4ed1ad`; common compaction SHA-256 `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. These are manifest declarations, not independently recomputed hashes.

Complete coverage: asm-001:1–25, asm-002:1–25, asm-003:1–25, asm-004:1–25, asm-005:1–16 = all 116 instructions; bytes-001:1–13 = the complete 396-byte chunk `[0x56C090,0x56C21C)`; metadata.json:1–1747 including every xref and all three CFG blocks. Manifest:1–45 and common-compaction:1–24 read without truncation. Native packet remains authority; readable slices resolve the inherited long-line truncation.

## Role, name and confidence

Proposed name: **Mat3S16_MultiplyQ12_Copy20_ReturnDst**.

**CERTAIN**: signed-word operands, three row-sized input groups, nine three-term dot products, temporary staging, five DWORD output stores, destination pointer in full EAX. **LIKELY**: interpreting these two 18-byte inputs as row-major Q12 3×3 matrices and the operation as matrix composition. This interpretation is supported by the operand topology and independently by the three-iteration/five-store organization, not the old name or comments. The Q12 scale value is supplied by the frozen common context, not by a literal data-byte dump in these slices. **UNCERTAIN**: exact numeric behavior without the runtime x87 environment/global constant bytes, and the two copied trailing stack bytes. No mechanical source conflict found; no game-specific purpose is established.

## Mechanical contract

32-bit stack-argument leaf, cdecl-compatible: `[ebp+8]` = A (arg_0), `[ebp+12]` = B (arg_4), `[ebp+16]` = destination (arg_8). Caller cleanup follows from plain `retn`; callers' pushes are not present, so no caller-side ordering is claimed as observed. A and B must each expose 18 readable bytes; destination must expose **20 writable bytes**, not merely 18. There are no null, range, saturation or alignment guards. The function aligns its own stack to eight bytes and restores it using EBP; saves/restores EBP and ESI. EBX/EDI are untouched; EAX/ECX/EDX and arithmetic flags are scratch.

All nine B WORDs are sign-extended and captured before the loop. B's first column remains in x87 registers; its other six coefficients are stored/reloaded as binary32 locals. A is read as three consecutive signed-word triples, at offsets `(0,2,4)`, `(6,8,10)`, `(12,14,16)`. ECX advances six bytes per iteration; EDX starts at three and decrements once per iteration. `jnz` observes DEC's ZF, not an x87 comparison; there are no signed/unsigned range branches.

Writing B's signed words as row-major `b[k][j]`, each output row uses the conceptual expression

`(a[i][0]*scale)*b[0][j] + (a[i][1]*scale)*b[1][j] + (a[i][2]*scale)*b[2][j]`.

Scale is `flt_B695F8`, documented in common-compaction:9 as 1/4096. Products are combined first term plus second, then third. This is an interpretation of the x87 instruction sequence, **not** permission to substitute integer multiply/SAR, reassociated expressions, FMA, truncating casts or a generic matrix library. Under the row-major convention the algebra is A×B, not B×A.

Each sum is added to the binary64 memory constant at 0xB693D8 and stored as a binary64 value into scratch (`DC 05` / `DD 5C 24 08` in bytes). The function copies the **low WORD of that stored floating-point representation** through SI into the local result; it does not execute FISTP, an integer shift, an integer correction by 0x80000000 or a saturation check. With the documented bias and conventional round-to-nearest environment this implements the familiar biased-double integer extraction modulo 16 bits. That conditional explanation is not an unconditional rounding guarantee.

The nine local WORD stores start four bytes before the address initially put in EAX: EAX begins at current ESP+0x2C, is incremented by six, then stores use -0xA/-8/-6. Thus the result starts at current ESP+0x28 and covers offsets 0–17. The last two bytes at local-result offsets 18–19 receive no store. The tail then writes local DWORDs at destination offsets 0,4,8,12,16, in that order. The fifth DWORD contains the ninth result WORD and **two preexisting stack bytes**. They are not zero, copied input padding, preserved destination bytes or defined metadata. This stack-byte disclosure/indeterminacy is observable and must not be silently repaired.

All input reads complete before the first destination store. Consequently destination may ordinarily overlap either input, including exact in-place use, without corrupting subsequent input reads. The temporary is not a user buffer; no promise is made for pathological pointers into this active stack frame or concurrently modified inputs. A/B mutual overlap is harmless under ordinary stable-memory assumptions.

Full EAX is loaded with arg_8 at 0x56C1EC and is not subsequently modified: return is the destination pointer, not AL/AX, a result coefficient, count, status or x87 value. SI's partial-register writes only transport 16 bits; ESI is restored before return. No global memory is written; two numeric globals are read repeatedly. x87 status/exception effects and stack operations are additional machine effects.

## x87 environment and numeric limits

No FLDCW, FINIT, environment save/restore or exception clearing occurs. Runtime precision control, rounding control, exception masks and existing stack state therefore matter. The normal execution reaches eight occupied x87 stack registers: safe conventional entry requires an empty stack; a nonempty incoming stack can overflow. Three retained B coefficients are popped in the epilogue; the three per-row scaled A values are popped in each iteration. On normal empty-stack entry, exit is empty with no floating return.

The binary32 coefficient spills are exact for signed-16-bit integers, but arithmetic and the final binary64 rounding still follow the native x87 environment. Sticky exception/status changes are not preserved away. Inputs are finite signed integers if the supplied scale/bias retain their documented values; alternate global values or exceptional environments invalidate simplified Q12 rounding claims. Pointer increments and DEC are 32-bit machine operations; no integer product overflow semantics should be invented for x87 products.

## Seven independent instruction/xref proofs

Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g02/0x56C090.readable/`.

1. **Signed 3×3 coefficient topology / name proof:** asm-001:5–25 and asm-002:1–18, 0x56C099–0x56C12B: nine MOVSX WORD loads span B offsets 0 through 0x10 with columns `(0,6,12)`, `(2,8,14)`, `(4,10,16)`; FILD and six binary32 spills preserve their signs.
2. **Three rows and Q12-dot operation / independent name proof:** asm-002:19–25 plus asm-003:1–18, 0x56C12F–0x56C181: three signed components, six-byte advance, counter DEC and three-term multiply/add chain with the global scale. This demonstrates multiplication, not a simple matrix copy.
3. **All nine output coefficients:** asm-003:19–25 and asm-004:1–23, 0x56C185–0x56C1E6: the other two dot chains and WORD stores at -0xA/-8/-6, followed by DEC-controlled backedge, produce exactly three WORDs per row for three rows.
4. **Bit extraction, not saturation/cast:** asm-003:17–18,23–24 and asm-004:4–5,10–11,16–20; bytes-001:8–11: floating bias ADD and binary64 FSTP followed by 16-bit scratch loads. No clipping branch or integer conversion opcode intervenes.
5. **20-byte transfer / tail caveat:** asm-004:24–25 and asm-005:1–13, 0x56C1EC–0x56C215: five DWORD reads/stores, including destination+0x10. Compare with proof 3's only 18 initialized bytes.
6. **ABI/full-width return:** asm-001:1–6, asm-002:6, asm-004:24, asm-005:2,14–16: stack alignment, EBP-based argument reads, ESI restoration, arg_8 retained in EAX, original stack restoration and plain RET.
7. **Reusable leaf helper, not established business role:** metadata.json:33–74 records callers 0x5033E0, 0x508C90, 0x56C220/270/2F0/360 and 0x5A9C10; metadata:1745 has no code targets and the complete ASM contains no calls. Many further xrefs, including null function ownership entries, were covered but provide no additional caller semantics without caller ASM.

## Open questions / limits

- Parent should verify native data bytes for scale 0xB695F8 and bias 0xB693D8, plus actual x87 control word and empty-stack calling invariant, before claiming exact round-to-nearest Q12 outputs.
- Are the copied final two stack bytes intentionally ignored by every caller? Present inputs cannot establish a structure field or ABI padding policy for them.
- Row-major matrix composition is strongly supported mechanically; coordinate convention, game role and why callers use this helper remain unproven without separately frozen caller context.
- Ordinary input/output alias safety is proven by delayed output stores; no general validity guarantee for arbitrary stack aliases, faults or concurrency is implied.

No compilation, tests, runtime observation, hash recomputation, promotion, IDB/Git/ledger action or §5.6 final validation was performed. This is semantic B only.
