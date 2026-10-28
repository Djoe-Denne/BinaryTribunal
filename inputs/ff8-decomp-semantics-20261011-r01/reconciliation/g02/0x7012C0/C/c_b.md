# 0x7012C0 — independent C B

## C transcription

```c
#include <stdint.h>

/* These declarations reflect only the direct calls and argument/result use
 * visible at 0x7012C0. Their implementations are not part of this output. */
extern int32_t Fixed_Sin4096_Q12(int32_t angle);
extern int32_t Fixed_Cos4096_Q12(int32_t angle);

/* x86/GCC-compatible packed access is intentional: the native code performs
 * five 32-bit stores at offsets 0,4,8,0x0c,0x10, including two bytes beyond
 * the 9-word matrix, then 16-bit stores. Volatile preserves the source-store
 * sequence and the union overlays those exact byte offsets. */
typedef union __attribute__((packed)) RotZOutput20 {
    struct __attribute__((packed)) {
        volatile uint32_t dword[5];
    } clear;
    struct __attribute__((packed)) {
        volatile uint16_t word[10];
    } coeff;
} RotZOutput20;

int32_t Mat3S16_MakeRotZ_Q12(int16_t angle, void *out_ptr)
{
    RotZOutput20 *out = (RotZOutput20 *)out_ptr;
    int32_t angle32 = (int32_t)angle;
    int32_t sin32;
    int32_t cos32;
    uint32_t neg_sin32;

    /* mov [out+0,+4,+8,+0x0c,+0x10], EAX after XOR EAX,EAX. */
    out->clear.dword[0] = 0;
    out->clear.dword[1] = 0;
    out->clear.dword[2] = 0;
    out->clear.dword[3] = 0;
    out->clear.dword[4] = 0;

    /* Each native PUSH passes the sign-extended angle as one 32-bit cdecl
     * stack argument; caller removes both arguments with ADD ESP,8. */
    sin32 = Fixed_Sin4096_Q12(angle32);
    cos32 = Fixed_Cos4096_Q12(angle32);

    /* NEG EDX is 32-bit modulo-2^32; the native store consumes DX only. */
    neg_sin32 = 0u - (uint32_t)sin32;

    /* Native WORD stores: [0]=AX(cos), [6]=DX(-sin), [2]=BX(sin),
     * [8]=AX(cos), [0x10]=0x1000. Values are low 16-bit patterns. */
    out->coeff.word[0] = (uint16_t)cos32;
    out->coeff.word[3] = (uint16_t)neg_sin32;
    out->coeff.word[1] = (uint16_t)sin32;
    out->coeff.word[4] = (uint16_t)cos32;
    out->coeff.word[8] = UINT16_C(0x1000);

    /* The native RETN leaves EAX from the cosine helper unchanged. */
    return cos32;
}
```

## Contract, evidence, and limits

- ABI/stack: PE32 cdecl-like caller-clean behavior. The native function saves/restores EBX, ESI, EDI; reads the first stack argument as a signed 16-bit value, sign-extends to EDI, and reads arg_4 as the output pointer. It pushes that 32-bit EDI once for each call and performs `add esp,8`; plain `retn` leaves caller arguments for the caller. In the C signature, those parameters are `int16_t` and `void *`; callees are declared as taking the pushed `int32_t` and returning the EAX value consumed by the caller. Actual callee prototypes beyond these observations remain unverified.
- Output layout: 9 consecutive 16-bit coefficient slots through offset `0x10`; five preceding dword-zero stores also clear bytes `0x12..0x13` past the 18-byte matrix. The `0x1000` word is written at `+0x10`. Output uses packed fields for unaligned x86-compatible 32-/16-bit access. WORD stores preserve only the low 16 bits. `NEG EDX` is represented with unsigned modulo-2^32 arithmetic, so `INT32_MIN` wraps rather than invoking signed C overflow. No shifts or conditional branches occur.
- Role: constructs a Z-rotation-shaped 3×3 signed-16 coefficient block with a Q12 unity word, using two direct trig helper calls; returns the cosine helper's full EAX value. Confidence: high for observed instruction effects and medium-high for the descriptive name/role.
- Native-name proof 1: the native label is `Mat3S16_MakeRotZ_Q12` (`metadata.json:3`; frozen native JSON `0x7012C0.json:3`). This is a label, not independent proof of full higher-level intent.
- Name/shape proof 2: the exact stores put cosine at offsets 0 and 8, sine at 2, negated sine at 6, and `0x1000` at 0x10 (ASM input `asm-001.txt:21-25`; `asm-002.txt:1-4`). This supports the RotZ/Q12 shape without assuming a conventional sign/order different from the bytes.
- Additional native proofs: signed angle load and output pointer (`asm-001.txt:3,7`); zero initialization through `+0x10` before either call (`asm-001.txt:4,8-13`); direct sine/cosine calls and sine EAX saved in EBX (`asm-001.txt:14-17`); 32-bit negation and caller cleanup (`asm-001.txt:18-20`); complete epilogue and plain return (`asm-002.txt:1-4`). The projection is 29 verbatim assembly lines in two files; the complete native byte projection is `bytes-001.txt:1-3`.
- Uncertainties: names/implementations and exact numerical behavior of `Fixed_Sin4096_Q12` / `Fixed_Cos4096_Q12` are not reconstructed here; only direct call sites/code-target addresses are supplied (`metadata.json:200-203`). No claim is made about floating-point environment or callee side effects. The native label's “Q12” and “RotZ” are treated as naming evidence alongside the observed coefficient placement, not grounds to normalize its signs or ordering. Packed attribute is a compiler extension used to model the x86 memory widths/order, not portable ISO C.

## Input inventory and validation status

- Common factual context: `inputs/ff8-decomp-semantics-20261011-r01/g02/common-compaction.md:10-15`.
- Readable projection manifest: `inputs/ff8-decomp-semantics-20261011-r01/g02/0x7012C0.readable/manifest.json:1-29`. `original_sha256=1266b0df632a32ee19635b92615cab7a74f81d7e9bd28c0c70afcb3fd08f3ba8`; assembly projection is complete (29 lines), bytes projection complete, no correction/filter/truncation. Projection file hashes: asm-001 `bf22f6ad66c8333b7b4ef167d547e5c11c5f6331bcdb2753d50d6605465842d1`, asm-002 `7c65b45967416da9e0199c5e73d9eed13572202d62a53506084a1f5bec4c41f7`, bytes-001 `ec5d7cb1d8309d016d11b03fbd113a62d9c5b5e4e458bdc171e719b72f15a05c`, metadata `e123410f5015921ffb783bfe30f4f9fa74a51830783c8f3462c48cce437596a0`.
- Frozen executable hash is `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` (`metadata.json:4-9`).
- Coverage: all 29/29 assembly instructions covered, including five 32-bit clearing stores, two callees, five 16-bit coefficient stores, saved-register restoration, and return; complete byte slice reviewed. No compilation, disassembly comparison, runtime test, or external review was run.
