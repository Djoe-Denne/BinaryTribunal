# 0x701220 — independent C A

## Frozen input / boundary

- Original packet SHA-256 (manifest): `5a2d2dd11b9e5f5d5e3ec79fd236f5bbc03a85ec1d9b7065538ef166905b9141`.
- Common compaction SHA-256 (manifest): `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`.
- EXE SHA-256 (metadata): `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, PE32 export `2026-10-11T16:38:25.140966+00:00`.
- Read all 25 lines of `asm-001.txt`, all 4 lines of `asm-002.txt`, all 3 byte slices, the manifest and all 259 metadata lines. One contiguous chunk `[0x701220,0x70126C)`, 76 bytes, 29 instructions, one CFG block. Source paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g02/`.
- Hashes above are supplied provenance, not hashes recomputed in this session. Native operands/opcodes prevail over names/comments and the common compaction.

## Complete C

This translation targets GNU-compatible **32-bit x86 C**. Packed, may-alias access types explicitly permit unaligned accesses and cross-type destination aliasing; volatile stores preserve the native store order and widths. These are local access adapters, not additional native callees. This is not a portable replacement for the ABI, nor an assertion that the original destination was volatile/MMIO.

```c
#include <stdint.h>

typedef struct __attribute__((packed, may_alias)) {
    uint32_t value;
} ff8_u32_access;

typedef struct __attribute__((packed, may_alias)) {
    uint16_t value;
} ff8_u16_access;

/* Actual existing native callees, not newly invented implementations.
 * The linker/integrator must bind these symbols to 0x0056D130 and
 * 0x0056D100 respectively. Each consumes one cdecl int32 stack argument
 * and returns the complete EAX bit pattern. Bodies are outside this gel.
 */
extern uint32_t __attribute__((cdecl)) sub_0056D130(int32_t angle);
extern uint32_t __attribute__((cdecl)) sub_0056D100(int32_t angle);

/* arg0 occupies a four-byte stack slot; only its low WORD is read.
 * arg1 is the four-byte destination pointer slot. Return models residual
 * full EAX, not a proven source-level return type or pointer return.
 */
uint32_t __attribute__((cdecl)) sub_00701220(uint32_t angle_slot,
                                          void *destination)
{
    unsigned char *const p = (unsigned char *)destination;
    const uint32_t angle_low = angle_slot & UINT32_C(0xFFFF);
    /* Exact MOVSX word -> dword, without implementation-defined
     * unsigned-to-signed narrowing. Range is [-32768, 32767].
     */
    const int32_t angle = (int32_t)(angle_low ^ UINT32_C(0x8000))
                        - INT32_C(32768);
    uint32_t sine_eax;
    uint32_t cosine_eax;
    uint32_t neg_sine_edx;

    ((volatile ff8_u32_access *)(p + 0x00))->value = UINT32_C(0);
    ((volatile ff8_u32_access *)(p + 0x04))->value = UINT32_C(0);
    ((volatile ff8_u32_access *)(p + 0x08))->value = UINT32_C(0);
    ((volatile ff8_u32_access *)(p + 0x0C))->value = UINT32_C(0);
    ((volatile ff8_u32_access *)(p + 0x10))->value = UINT32_C(0);

    sine_eax   = sub_0056D130(angle);
    cosine_eax = sub_0056D100(angle);
    neg_sine_edx = UINT32_C(0) - sine_eax; /* NEG EDX, modulo 2^32 */

    ((volatile ff8_u16_access *)(p + 0x00))->value = UINT16_C(0x1000);
    ((volatile ff8_u16_access *)(p + 0x08))->value = (uint16_t)cosine_eax;
    ((volatile ff8_u16_access *)(p + 0x0E))->value = (uint16_t)neg_sine_edx;
    ((volatile ff8_u16_access *)(p + 0x0A))->value = (uint16_t)sine_eax;
    ((volatile ff8_u16_access *)(p + 0x10))->value = (uint16_t)cosine_eax;

    return cosine_eax;
}
```

No trigonometric library substitution, range clamp, null guard, angle normalization, destination-size guard, or speculative callee implementation is included. Callee-produced values are retained as full 32-bit patterns until the native WORD stores. `0 - sine_eax` is unsigned wrap even if EAX is `0x80000000`; narrowing to WORD is modulo 65536. AX/BX/DX are used only as low-half sources; those stores do not truncate the retained EAX return. No AL-only operation, branch or shift exists here.

## ABI, stack, memory and instruction coverage

At native entry ESP=S: return address at S, angle slot at S+4, destination slot at S+8. After EBX/ESI pushes, `[esp+0x10]` loads destination; after EDI push, `MOVSX [esp+0x10]` reads the angle WORD. Native explicitly preserves EBX/ESI/EDI. Their C locals map the saved angle, destination and sine without requiring a particular compiler register allocation. EBP is untouched by the native body. ABI lowering of this C must preserve nonvolatile registers, caller cleanup and full EAX return.

The angle is pushed before the first call; the same sign-extended angle is pushed again before the second, while the first argument remains on the stack. `ADD ESP,8` removes both argument slots; then EDI/ESI/EBX are restored and plain `RET` leaves this function's two argument slots for its caller. Both actual calls have one argument, so no multiargument push-order ambiguity exists. The C preserves call order/argument values, not the literal delayed stack cleanup or stale below-ESP bytes; equivalence assumes ordinary cdecl callees, not callees inspecting unrelated caller stack slots. No local native frame is allocated beyond saves/arguments.

| Native instructions | Coverage |
|---|---|
| 701220, 701221, 701222, 701226, 701228, 70122A, 70122B | Saves, destination fetch, zero EAX, ECX destination copy, signed low-WORD angle fetch; C ABI/local variables and sign-extension expression. |
| 701230, 701232, 701233, 701236, 701239, 70123C | Five ordered DWORD clears at 0,4,8,12,16; first angle push prepares sine call. |
| 70123F, 701244, 701245, 701247 | Existing sine then cosine calls; same angle; sine full EAX retained in native EBX. |
| 70124C, 70124E, 701251 | Copy sine to EDX, release two pushed slots, wrapping 32-bit negation. |
| 701253, 701258, 70125C, 701260, 701264 | Ordered WORD writes of 0x1000, cosine AX, negated sine DX, sine BX, cosine AX. |
| 701268, 701269, 70126A, 70126B | Restore saved registers and cdecl return; EAX remains full cosine result. |

Byte checks: `0F BF 7C 24 10` confirms WORD sign extension; rel32 sine call displacement `FFE6BEEC` at 70123F targets 56D130, and cosine displacement `FFE6BEB4` at 701247 targets 56D100. `F7 DA` is DWORD NEG EDX. `66 C7 06 00 10` and the subsequent `66 89 ...` encodings confirm the five WORD writes, not DWORD writes. The final `5F 5E 5B C3` confirms restoration/return. Evidence: `0x701220.readable/bytes-001.txt:1-3` alongside both complete ASM slices.

The output requires **20 accessible writable bytes**, not merely 18. There are no output reads. Clearing all 20 bytes occurs before either callee and coefficient insertion occurs only after both. Bytes +18/+19 remain cleared unless a callee has independently changed them. No pre-existing output/argument data is read again through destination; angle and pointer are captured before clearing. No restrict/no-alias assertion is imposed. Packed access types retain native 4-byte/2-byte access widths rather than replacing them with bytewise or library stores. Fault timing, exotic overlap with this function's active stack, MMIO semantics, callee introspection of registers and instruction flags are outside this source-level ABI model; no such behavior is established by the gel.

## Contract interpretation and evidence

**Native-local role (high confidence):** initializes a 20-byte coefficient buffer using two scalar callee results, a fixed 0x1000 coefficient, and paired positive/negative WORD coefficients. Input is signed-16 angle in a four-byte argument slot plus destination pointer; observable output is ten ordered stores around two native calls and residual full cosine EAX. No explicit global access or x87 instruction occurs in this body. Callee global/x87 effects are not erased or replaced by the translation.

**Conditional descriptive name:** `Mat3S16_MakeRotX_Q12`; appropriate if the documented sine/cosine/Q12 contracts in the common compaction hold. Rotation interpretation is not derived merely from the existing label. Exact coefficient construction is certain locally; helper mathematical/environmental contracts are secondary evidence, not independently reverified here.

1. `asm-001.txt:3,7`, bytes slice 1: destination stack argument and `MOVSX` low WORD angle establish argument widths independently of the label.
2. `asm-001.txt:8-13`: five DWORD clears establish 20-byte initialization, including two bytes beyond nine WORD coefficients.
3. `asm-001.txt:14-17`, bytes slices 1-2, `metadata.json:254-257`: rel32 targets establish the two real callees and their order. The supplied compaction documents them as sine and cosine; their bodies are not supplied.
4. `asm-001.txt:18-25`: native negation and five WORD stores establish exact sign pattern and placement. **Name proof A:** under row-major nine-WORD indexing, coefficient (0,0)=0x1000 with (1,1)=(2,2)=cosine and (1,2)=sine, (2,1)=-sine isolates the first axis and supplies the X-axis rotation pattern (with this sign convention).
5. `common-compaction.md:10-11,13`: shared helper documentation plus neighboring rotation-helper context corroborates the interpretation. **Name proof B:** documented `Sin4096_Q12`/`Cos4096_Q12` scale together with native unity `0x1000` supports Q12 rather than an arbitrary unit scale. This is conditional context, not an opcode proof of helper internals.
6. `asm-002.txt:1-4` plus final AX stores: EAX is not overwritten after cosine; return therefore retains its full 32-bit pattern, not destination, sine or a 16-bit zero/sign extension.
7. `metadata.json:217-252`: incoming calls from 701310/430/4B0/530/5B0/630 corroborate use as a reusable helper; xrefs alone do not establish those callers' contracts.

## Unknowns, assumptions and validation limits

- The exact bodies of 56D130/56D100, their global effects, x87 control word/precision/rounding, exception behavior and magic-double implementation are absent from this target gel. Their ASM comments are hypotheses/context only. Exact calls are kept, so C does not assume mathematical `sin`, `cos`, truncation or a newly chosen rounding rule.
- Source prototype and semantic use of the residual EAX return are not proven; the raw `uint32_t` return above intentionally retains all bits. Sign convention must not be normalized to another rotation convention.
- No proof of destination alignment, source struct definition or a signedness declaration is present. Raw little-endian WORD representation is modeled without imposing a struct type or signed narrowing; compiler attributes are an explicit implementation requirement.
- Normal cdecl helper ABI is the source-level integration assumption supported by one pushed DWORD each and caller removal of eight bytes. Literal register/stack/flag equivalence would require a separately authorized native bridge or compiler/ASM review.
- No compilation, execution, unit tests, output-hash recomputation, IDA review or promotion was performed. Lead should bind the two existing callees and review emitted i386 ASM for store widths/order and cdecl behavior; test low-WORD sign extension, arbitrary full-width helper returns, unaligned/aliased ordinary output and the +18/+19 bytes if authorized. These are requests, not PASS claims.
