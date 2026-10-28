# 0x56C090 — independent C B

Input boundary: `inputs/ff8-decomp-semantics-20261011-r01/g02/0x56C090.readable/manifest.json` records the native packet SHA-256 `e68f56607e807248d56cc62139e98f0783ff8f47fb67210c5983f809fc4ed1ad`, compaction SHA-256 `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`, and 116 complete assembly lines. I read all five ASM slices, the complete byte slice, and `metadata.json`; no compiler/test/review was run.

```c
#include <stdint.h>

/*
 * The binary's magic-double conversion is modeled at its observable low-word
 * boundary. It uses the active x87 rounding mode, as does the original x87
 * addition/store sequence. Assumes the target's IEEE-754 binary64 layout and
 * little-endian x86 representation. The products/sums below are exactly
 * representable for signed-16-bit inputs and a 1/4096 scale.
 */
#define X87_MAGIC_WORD(dst_, value_)                                      \
    do {                                                                   \
        union { double d; uint64_t u; } cvt_;                              \
        volatile double magic_ = 4503601774854144.0; /* 2^52 + 2^31 */    \
        volatile double converted_ = magic_ + (value_);                    \
        cvt_.d = converted_;                                               \
        (dst_) = (uint16_t)cvt_.u;                                         \
    } while (0)

/*
 * cdecl stack arguments: vectors=[ebp+8], matrix=[ebp+0x0c], out=[ebp+0x10].
 * Vectors are three consecutive signed-16-bit triples (6-byte stride).
 * The nine signed-16-bit matrix words are consumed as three columns for each
 * of the three output components, with coefficients at +0/+6/+0x0c,
 * +2/+8/+0x0e, and +4/+0x0a/+0x10.
 */
void *Mat3S16_MulQ12_Copy5(const int16_t *vectors,
                           const int16_t *matrix,
                           void *out)
{
    /* Native aligns ESP down to 8, allocates 0x44 bytes, and saves ESI. */
    int16_t m[9];
    union {
        uint16_t words[10]; /* final word is native stack residue */
        uint32_t dwords[5];
    } local_result;

    /* Preserve the native pre-loop matrix loads (all nine words before loop). */
    m[0] = matrix[0];
    m[1] = matrix[3];
    m[2] = matrix[6];
    m[3] = matrix[1];
    m[4] = matrix[4];
    m[5] = matrix[7];
    m[6] = matrix[2];
    m[7] = matrix[5];
    m[8] = matrix[8];

    for (unsigned i = 0; i != 3; ++i) {
        int16_t vx = vectors[3u * i + 0u];
        int16_t vy = vectors[3u * i + 1u];
        int16_t vz = vectors[3u * i + 2u];
        double sx = (double)vx * (1.0 / 4096.0);
        double sy = (double)vy * (1.0 / 4096.0);
        double sz = (double)vz * (1.0 / 4096.0);
        volatile double sum;

        /* x87 order: first product, second product, FADDP, third, FADDP. */
        sum = (double)m[0] * sx;
        sum = sum + (double)m[1] * sy;
        sum = sum + (double)m[2] * sz;
        X87_MAGIC_WORD(local_result.words[3u * i + 0u], (double)sum);

        sum = (double)m[3] * sx;
        sum = sum + (double)m[4] * sy;
        sum = sum + (double)m[5] * sz;
        X87_MAGIC_WORD(local_result.words[3u * i + 1u], (double)sum);

        sum = (double)m[6] * sx;
        sum = sum + (double)m[7] * sy;
        sum = sum + (double)m[8] * sz;
        X87_MAGIC_WORD(local_result.words[3u * i + 2u], (double)sum);
    }

    /* Native copies five DWORDs (20 bytes), despite only storing 9 WORDs. */
    uint32_t *out_dwords = (uint32_t *)out; /* x86 permits unaligned DWORDs */
    for (unsigned i = 0; i != 5; ++i)
        out_dwords[i] = local_result.dwords[i];
#undef X87_MAGIC_WORD
    return out; /* EAX is loaded from arg_8 and preserved through RETN. */
}
```

## Evidence / contract notes

- **Arithmetic and accesses:** `asm-001.txt:7-25` and `asm-002.txt:1-18` sign-extend matrix words with `movsx`, load them using `fild`, and prepare `[ebp+arg_0]`; `asm-002.txt:19-25` and `asm-003.txt:1-18` sign-extend successive vector WORDs, advance vector pointer by `+6`, multiply by `flt_B695F8`, and perform the first ordered x87 dot-product sequence. `metadata.json:11-31` records the three CFG blocks, including loop backedge `0x56c12f` and exit `0x56c1ec`.
- **All 3x3 outputs and widths:** `asm-003.txt:19-25`, `asm-004.txt:1-18`, and `asm-004.txt:19-25` show x87 conversion followed by `mov si` / WORD stores, three component stores per iteration and the loop branch. The full decoded bytes for these instructions are present in `bytes-001.txt:7-12` (chunk addresses `0x0056C150` through `0x0056C210`). Results are narrowed to 16 bits; this C uses the low 16 bits of the magic-converted result, not saturation.
- **Return and copy:** `asm-004.txt:24-25`, `asm-005.txt:1-16`, and `bytes-001.txt:11-13` establish the third argument pointer load, five DWORD writes at offsets 0,4,8,0xC,0x10, EAX's retained output pointer, frame teardown, and `retn`. The loop stores nine WORDs (18 bytes); native copies 20 bytes. The final two bytes of `local_result` are deliberately not initialized here, corresponding to native stack residue; their exact value is not defined by these inputs and is not invented.
- **ABI/stack:** The entry `push ebp; mov ebp,esp; and esp,0xfffffff8; sub esp,0x44; ... push esi` is `asm-001.txt:1-6`; the epilogue restores ESI, resets ESP from EBP, pops EBP, and returns in `asm-005.txt:2-16`. Three x87 `fstp st` cleanups are visible in `asm-004.txt:19-22` and `asm-005.txt:5-11`. No calls appear in the complete assembly; no callee/library call is added.
- **Name confidence:** Low-to-moderate descriptive confidence only. (1) `metadata.json:2-3` gives `name_label_only: Mat3S16_MulQ12_Copy5` (explicitly a label, not proof). (2) `asm-001.txt:1` annotates three 3x3 signed-16-bit vector operations with factor 1/4096 and a five-DWORD destination copy; actual `fmul`, WORD stores, and five DWORD transfers are independently visible at `asm-003.txt:1-18`, `asm-004.txt:19-25`, and `asm-005.txt:1-13`. These support the descriptive components but not a higher-level caller contract.
- **Call-neighbour evidence:** `metadata.json:33-80` records xrefs from `0x5033e0`, `0x508c90`, `0x56c220/0x56c270/0x56c2f0/0x56c360`, and others; `metadata.json:1744-1746` says no exported direct call targets. `asm-001.txt:1` contains the comment “callee of Mat_ComposeTwoThenCopy8”, which remains an annotation, not native call-site proof.

## Uncertainties and fidelity limits

The mathematical description is a signed-16-bit 3×3 dot-product transform with the observed `1/4096` input scale, but the label/comment does not establish the caller's domain or a universal matrix convention. The two trailing copied bytes are native uninitialized stack contents. The C models the low-word result of the x87 magic-double conversion under the active rounding mode; exact x87 exception/status flags and the original 8-byte stack alignment/local residue are not represented by ordinary C. No overflow in signed C arithmetic is used: signed-16-bit operands are promoted to exactly representable `double`; narrowing is explicitly to `uint16_t`. No shifts are present in the covered body.
