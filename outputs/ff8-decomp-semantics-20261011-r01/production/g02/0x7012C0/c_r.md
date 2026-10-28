# 0x7012C0 — C reconciliation R

## Scope, provenance and verdict

Only the assigned `reconciliation/g02/0x7012C0/C/` projection was used (plus required agent/protocol instructions). Both authors are present and have distinct frozen sessions:

| Candidate | Session | Effective model recorded by parent | Candidate SHA-256 |
|---|---|---|---|
| A | `ses_ed3e15dfdffem7hq5EIS78Z8Za` | `openai/gpt-6.1-sol`, high | `64b61fe28e674317a8f78c2b89b14ddb3b3bf1338bb384bc97987e8b5ebc4f3d` |
| B | `ses_ed3e15910ffegeOyB6eRP3hvjk` | `opencode-go/gpt-6-luna`, medium | `5f7d9750328db70feab8ce70a1542c8a43b1474a1c540c4cdacf924cc425effc` |

Original packet SHA-256: `1266b0df632a32ee19635b92615cab7a74f81d7e9bd28c0c70afcb3fd08f3ba8`. Common-compaction SHA-256: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. Native EXE SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; PE32 export `2026-10-11T16:38:25.140966+00:00`.

Read completely: manifest, A, B, common-compaction, original native packet, native-manifest, native-metadata (all 205 lines), both ASM slices (25 + 4 lines), and the three byte-slice lines. Recorded hashes are consistent across the manifests/candidates; no missing author or contradictory hash was found. These are manifest citations, **not freshly computed file hashes**: the available tools provide no file-hashing primitive; parent must perform byte-level hash verification, including this output. Independence is the parent's recorded provenance, not something R can independently authenticate.

**Verdict:** complete native-effect C reconciliation for ordinary memory under the explicit PE32 reconstruction contract below. All 29 instructions, 76 bytes and the single CFG block `[0x7012C0,0x70130C)` are accounted for. No unresolved target-instruction conflict. Trig numerical semantics, intended return API and vector/handedness convention remain **UNCERTAIN**. This is not final native §5.6 acceptance or promotion.

## Re-derived native behavior

Let entry ESP be S. After two saves, `[ESP+0x10]` at 0x7012C2 is `[S+8]`, the destination pointer. After the third save, the **WORD** `[ESP+0x10]` at 0x7012CB is `[S+4]`, the first argument. `0F BF` sign-extends that WORD into EDI. Higher bits of its four-byte cdecl stack slot are ignored.

Five DWORD stores clear destination offsets 0, 4, 8, 12, 16, in that order. The first angle push is between the first and second stores; all five stores nevertheless precede the first call. The rel32 call encodings resolve independently of their labels:

- 0x7012DF: next IP 0x7012E4 + signed `0xFFE6BE4C` = **0x56D130**.
- 0x7012E7: next IP 0x7012EC + signed `0xFFE6BE14` = **0x56D100**.

Both receive the same sign-extended 32-bit angle. The first EAX result is retained in EBX across the second call. Both pushed arguments are removed together by `ADD ESP,8`. The first result is copied into EDX and negated at full 32-bit width. Stores then consume AX, DX, BX, AX, and the immediate WORD 0x1000, respectively at offsets **0, 6, 2, 8, 16**. No store changes EAX; it remains the entire second-call result through plain RET.

## Complete reconciled C

This is reconstruction C for **MSVC C, 32-bit little-endian x86**, using its unaligned integer-access and aliasing behavior, not portable ISO C. Volatile accesses preserve destination store widths/order, without `restrict`. Compilation and actual instruction selection still require the lead's validation. The only external calls below are bindings to the two real native addresses; do not replace them with host math or change the floating-point environment.

```c
#include <stdint.h>

/* Link these declarations to the existing native entry points. */
extern uint32_t __cdecl sub_0056D130(int32_t angle);
extern uint32_t __cdecl sub_0056D100(int32_t angle);

/*
 * PE32 cdecl: first argument occupies a four-byte stack slot, but only
 * its signed low WORD is read. Second argument is the 32-bit pointer.
 * The return type preserves observed EAX, not a proven source-level API.
 */
uint32_t __cdecl sub_007012C0(int16_t angle_word, void *destination)
{
    volatile uint8_t *const out = (volatile uint8_t *)destination;
    const int32_t angle = (int32_t)angle_word;  /* MOVSX r32, WORD */

    *(volatile uint32_t *)(out + 0x00) = UINT32_C(0);
    *(volatile uint32_t *)(out + 0x04) = UINT32_C(0);
    *(volatile uint32_t *)(out + 0x08) = UINT32_C(0);
    *(volatile uint32_t *)(out + 0x0c) = UINT32_C(0);
    *(volatile uint32_t *)(out + 0x10) = UINT32_C(0);

    const uint32_t first_eax = sub_0056D130(angle);
    const uint32_t second_eax = sub_0056D100(angle);
    const uint32_t neg_first_edx = UINT32_C(0) - first_eax;

    *(volatile uint16_t *)(out + 0x00) = (uint16_t)second_eax;   /* AX */
    *(volatile uint16_t *)(out + 0x06) = (uint16_t)neg_first_edx;/* DX */
    *(volatile uint16_t *)(out + 0x02) = (uint16_t)first_eax;    /* BX */
    *(volatile uint16_t *)(out + 0x08) = (uint16_t)second_eax;   /* AX */
    *(volatile uint16_t *)(out + 0x10) = UINT16_C(0x1000);

    return second_eax;
}
```

`int16_t` at this **fixed-parameter cdecl** boundary describes the consumed WORD; it does not shrink the native stack slot to two bytes. Integration must match this ABI, not a packed stack convention. For raw incoming slot bits, the angle means signed(low16(slot)); for example 0x8000 gives -32768, 0xFFFF gives -1. High slot bits have no effect. The signature should not be used to assert an original source declaration.

The two helper returns and wrapper return use `uint32_t` solely as register-bit containers. Their signedness/range are unproved. Unsigned subtraction models every 32-bit NEG input, including 0x80000000, without signed-overflow UB. The WORD casts preserve modulo-65536 patterns, not saturation or range validation. There is no AL access, no narrowing of EAX itself, and no shift instruction in this target.

### Memory, alias and environment contract

- Destination must provide **20 writable bytes**, possibly unaligned. There is no null/alignment/range guard. The native function does not allocate or copy another matrix.
- DWORD/WORD access order above is part of the result, not merely the final array. Do not replace the clear with nine WORD stores, `memset`, reordered coefficient stores, or a single aggregate assignment.
- Both input values are captured before output writes. The destination may alias ordinary memory visible to the callees; no purity assumption is made. All clear stores occur before either call, and all coefficient stores after both. The calls receive only an angle, but may observe/mutate destination through other aliases. Unwritten output words and bytes 18–19 are guaranteed zero **by the clear**, not necessarily at return if a callee modifies them.
- As with ordinary ABI-level C, output must not overlap active return addresses, saved registers, argument-push storage or other live stack-control storage. Such overlap makes native PUSH/POP order observable and is not reproduced by C locals. Invalid-address faults, MMIO transactions, segment/address-boundary wrap, concurrent races, flags and transient machine-stack identity are outside this reconstruction's equivalence claim. No native guard enforcing these preconditions is invented.
- EBX/ESI/EDI preservation and stack balancing are represented by the cdecl ABI, not extra calls. Callee-saved behavior of the actual helpers is required; their bodies are not provided for verification.
- No x87 instruction/control-word change occurs in the wrapper. Keep the original helpers and incoming x87 environment, including their own rounding/precision/status/exception effects. No default environment, save/restore, trig implementation or numeric rounding rule is inferred from comments. Integer-only wrapper compilation must be checked by the lead.

## Convergences, divergences and common-error checks

| Topic | A / B | Native resolution |
|---|---|---|
| Input declaration | A exposes `uint32_t angle_slot` and masks/sign-extends; B uses `int16_t angle` | Both describe the same ordinary ABI value mapping. R uses B's signed-WORD interface to express the exact `0F BF` load width; retain A's explicit four-byte-slot/high-bit explanation. No unsigned angle or unsigned helper argument. |
| Return/helper signedness | A uses unsigned raw EAX; B signed `int32_t` | Instructions prove full 32-bit register preservation, not signedness. R retains raw unsigned containers. A signed API remains possible but is not proven. |
| Output access mechanism | A volatile casts with MSVC/no-strict-alias contract; B GCC packed union | Widths/offsets agree. R selects the explicit MSVC x86 reconstruction model; neither cast nor union is itself evidence of the native structure. No portable-C or universal alias-safety claim. |
| Helper names | A uses EA-bound opaque names; B uses trig labels | Bytes prove only 0x56D130 then 0x56D100. R keeps EA bindings; factual compaction supplies conditional sine/cosine interpretation. No invented trig calls. |
| Naming proof | B cites the native label as one proof | Reject label as a proof. Coefficient geometry and fixed-axis 0x1000 give two structural observations; trig/Q12 interpretation is explicitly conditional on supplied helper context. |
| Shared substantive agreement | Both preserve five DWORD clears, two calls, 32-bit NEG, five WORD stores and full EAX | Rechecked directly from all bytes/ASM, not voted. Explicitly checked extra bytes 18–19, unusual store order, signed angle, partial stores versus full return, and alias-visible calls. |

Neither candidate proves caller use of EAX or native helper numeric semantics. Their agreeing rotation name does not settle those unknowns. An unconditional final all-zero padding claim would also be too strong without a callee-alias contract; R keeps that condition explicit.

## Coverage and exact evidence anchors

All paths here refer to the assigned C projection. The following six anchor groups cover all 29 instructions:

1. **0x7012C0–0x7012CB**, `native-asm-001.txt:1–7`, first byte slice: EBX/ESI/EDI saves, pointer load, EAX zero, ECX copy and signed-WORD angle load. Encodings `8B 74 24 10` / `0F BF 7C 24 10` establish argument order and width independently of stack labels.
2. **0x7012D0–0x7012DC**, ASM lines 8–13: five four-byte zero stores and the intervening first argument push; `89 41 10` at DC proves bytes 16–19 are written, beyond an 18-byte coefficient array.
3. **0x7012DF–0x7012E7**, ASM lines 14–17 and rel32 bytes: exactly two direct calls in the stated order, second argument push and EBX save of first EAX. `native-metadata.json:200–203` corroborates the two addresses, not their numerical meaning.
4. **0x7012EC–0x7012F1**, ASM lines 18–20: full EBX-to-EDX copy, caller cleanup of eight bytes, and `F7 DA` 32-bit NEG. No signed range restriction, WORD NEG or added guard is justified.
5. **0x7012F3–0x701302**, ASM lines 21–25: `66`-prefixed stores at 0/6/2/8/16 prove both low-WORD selection and exact access order. **Structural role proof 1:** repeated diagonal second-call coefficients and opposite first-call off-diagonals confine the variable 2×2 block to the first two coordinates. **Structural role proof 2:** fixed third-axis diagonal 0x1000 with all other entries initially cleared identifies a fixed-axis/unit-scale form; supplied factual sine/cosine context supports, but does not independently prove, Q12 rotation semantics.
6. **0x701308–0x70130B**, `native-asm-002.txt:1–4`: three restores and `C3` plain RET; nothing overwrites the second-call EAX. Metadata lists xrefs from 0x701328/0x701448/0x7014D7/0x701556/0x7015F9/0x701679, but supplies no caller bodies, so these are not proofs of return consumption or vector convention.

The CFG is one block with no successors. The byte slices are 32 + 32 + 12 bytes, identical in content to the packet chunk, with contiguous coverage ending at 0x70130C. Calls are retained boundary operations, not hidden missing CFG branches.

## Descriptive contract and residual uncertainty

Without callee alias modifications, the coefficient words under an explicit row-major nine-WORD indexing convention are:

```text
[[low16(second), low16(first), 0],
 [low16(-first), low16(second), 0],
 [0,            0,             0x1000]]
```

Proposed descriptive name: **`Mat3S16_MakeRotZ_Q12`**, conditional on the supplied factual identification of the native helper addresses as sine/cosine. High confidence in the signed-WORD input, 20-byte write footprint, coefficient pattern and retained EAX. Rotation/Q12 interpretation has contextual support; exact angle scale, numerical range/rounding, orthogonality, handedness, row-versus-column usage and intended return API are **UNCERTAIN**. Do not infer an EAX-returning source declaration merely because the register survives, or reverse the off-diagonal signs to fit another convention.

No compilation, runtime comparison, callee-body audit, native §5.6 control, IDB/Git/registry/live mutation or promotion was performed. Parent owns hash recomputation, compiler/access-order/unaligned validation, EA bindings, final native checks and any integration.
