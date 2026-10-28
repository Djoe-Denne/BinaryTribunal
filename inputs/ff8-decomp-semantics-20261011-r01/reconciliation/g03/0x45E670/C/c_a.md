# Independent C A — 0x45E670

## Scope and provenance

Owned function only; no prior target C, other author output, classifier output,
or additional discovery was consulted in this author session. The explicitly
supplied common compaction includes attributed historical assertions; those
assertions are not substituted for the instructions below.

- Original packet SHA-256 (manifest citation, not independently rehashed):
  `06476e1094d6963e3532e19496a495b87b348503b4e79216e537b193aa571774`.
- Common-compaction SHA-256 (manifest):
  `9959dc7995e01db21518f4c15252096543ca53ec042a342d705dce6badf71572`.
- Executable SHA-256 (metadata):
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Projection root: `inputs/ff8-decomp-semantics-20261011-r01/g03/`.
  Read `common-compaction.md`, `0x45E670.readable/manifest.json`, all four
  `asm-00N.txt` files, `bytes-001.txt`, and all of `metadata.json`.
- Coverage: 92/92 instructions, 15/15 CFG blocks, single complete chunk
  `[0x45E670,0x45E81A)`, 426 bytes. No omitted tail or external call.

## Implementation contract

This is complete **GNU C for i386 with one inline-x87 instruction island**,
not portable floating-point C. The island is deliberate: C `float`, `double`,
`long double`, casts, or a rounding library call cannot in general reproduce
the supplied operation sequence under the unknown x87 precision/rounding
control, exceptional operands, and status-word effects. No helper or library
callee is introduced. The original accesses actual absolute global addresses;
this version does likewise and reads the actual binary64 constant at 0xB693D8.

Build contract for the lead: GCC-compatible i386 compiler, GNU assembler AT&T
input syntax (not `-masm=intel`), original address space mapped, normal cdecl
entry. This code must not be compiled for x86-64. No claim of compilation is
made. The `.byte` register-only x87 operations deliberately fix their supplied
encodings, particularly `DE E9`, avoiding assembler FSUBP spelling ambiguity.

The C ABI exposes the native leftover EAX as `uint32_t`. It is **not** asserted
that the original source had a meaningful return value. ECX/EDX and arithmetic
flags remain caller-saved; their exact outgoing physical values, instruction
addresses on faults, and an identical compiler-generated stack frame are not
promised by C. The original's eight-byte scratch slot is represented by one
eight-byte local, with the same dword integer stores and qword real stores.
There are no stack arguments, argument pushes, AL/AX writes, indirect calls,
or callee-saved GPR changes in the native body.

```c
#include <stdint.h>
#include <limits.h>

#if !defined(__GNUC__) || !defined(__i386__)
#error "Requires GNU-compatible i386 C and AT&T inline assembler"
#endif

_Static_assert(CHAR_BIT == 8, "byte width");
_Static_assert(sizeof(uint32_t) == 4, "dword width");
_Static_assert(sizeof(uint64_t) == 8, "qword scratch width");
_Static_assert(sizeof(uintptr_t) == 4, "native address width");

#define D32(va) (*(volatile uint32_t *)(uintptr_t)(va))
/* Unsigned ordering after sign-bit bias equals signed dword ordering. */
#define SIGN_ORDER(v) ((v) ^ UINT32_C(0x80000000))

uint32_t __attribute__((cdecl)) sub_45E670(void)
{
    uint64_t scratch;
    uint32_t eax, ecx, edx;

    /* 45E673..45E73A. scratch replaces [entry_esp-8].
       GPR outputs are early-clobber: they cannot address the scratch operand.
       Every global and scratch access stays in its original relative order.
       The compiler is told about both memory and the x87 stack effects. */
    __asm__ __volatile__(
        "movswl 0x01ca8a34, %%eax\n\t"  /* 45E673 */
        "movswl 0x01ca8a38, %%ecx\n\t"  /* 45E67A */
        "movswl 0x01ca8a3c, %%edx\n\t"  /* 45E681 */
        "shll $12, %%eax\n\t"          /* 45E688 */
        "movl %%eax, %[s]\n\t"        /* 45E68B */
        "movl $0, 0x01ca92f8\n\t"     /* 45E68F */
        "fildl %[s]\n\t"              /* 45E699: x */
        "shll $12, %%ecx\n\t"         /* 45E69D */
        "movl %%ecx, %[s]\n\t"        /* 45E6A0 */
        "fildl %[s]\n\t"              /* 45E6A4: y,x */
        "shll $12, %%edx\n\t"         /* 45E6A8 */
        "movl %%edx, %[s]\n\t"        /* 45E6AB */
        "fildl %[s]\n\t"              /* 45E6AF: z,y,x */
        "flds 0x01ca9244\n\t"         /* 45E6B3: b,z,y,x */
        ".byte 0xd8,0xc9\n\t"        /* 45E6B9: FMUL ST,ST(1) */
        "flds 0x01ca924c\n\t"         /* 45E6BB */
        ".byte 0xd8,0xcb\n\t"        /* 45E6C1: FMUL ST,ST(3) */
        ".byte 0xde,0xe9\n\t"        /* 45E6C3: ST(1)-ST; pop */
        "faddl 0x00b693d8\n\t"        /* 45E6C5 */
        "fstpl %[s]\n\t"              /* 45E6CB: binary64 spill */
        "flds 0x01ca924c\n\t"         /* 45E6CF */
        ".byte 0xd8,0xcb\n\t"        /* 45E6D5: times x */
        "flds 0x01ca923c\n\t"         /* 45E6D7 */
        ".byte 0xd8,0xca\n\t"        /* 45E6DD: times z */
        "movl %[s], %%eax\n\t"        /* 45E6DF: low dword only */
        "addl $0x80000000, %%eax\n\t" /* 45E6E3: modulo 2^32 */
        ".byte 0xde,0xe9\n\t"        /* 45E6E8 */
        "movl %%eax, 0x01ca8a74\n\t" /* 45E6EA */
        "faddl 0x00b693d8\n\t"        /* 45E6EF */
        "fstpl %[s]\n\t"              /* 45E6F5 */
        "movl %[s], %%ecx\n\t"        /* 45E6F9 */
        ".byte 0xdd,0xd8\n\t"        /* 45E6FD: discard z */
        "flds 0x01ca923c\n\t"         /* 45E6FF */
        ".byte 0xd8,0xc9\n\t"        /* 45E705: times y */
        "flds 0x01ca9244\n\t"         /* 45E707 */
        ".byte 0xd8,0xcb\n\t"        /* 45E70D: times x */
        "addl $0x80000000, %%ecx\n\t" /* 45E70F */
        "movl %%ecx, 0x01ca8a78\n\t" /* 45E715 */
        ".byte 0xde,0xe9\n\t"        /* 45E71B */
        "faddl 0x00b693d8\n\t"        /* 45E71D */
        "fstpl %[s]\n\t"              /* 45E723 */
        "movl %[s], %%edx\n\t"        /* 45E727 */
        ".byte 0xdd,0xd8\n\t"        /* 45E72B: discard y */
        "addl $0x80000000, %%edx\n\t" /* 45E72D */
        "cmpl $0xffff8000, %%eax\n\t" /* 45E733 */
        ".byte 0xdd,0xd8\n\t"        /* 45E738: discard x */
        "movl %%edx, 0x01ca8a7c\n\t" /* 45E73A */
        : "=&a" (eax), "=&c" (ecx), "=&d" (edx), [s] "=m" (scratch)
        :
        : "memory", "cc", "st", "st(1)", "st(2)", "st(3)", "st(4)"
    );

    /* 45E740..45E779: signed tests. Neither clamp modifies EAX. */
    if (SIGN_ORDER(eax) < UINT32_C(0x7fff8000)) {
        D32(0x01ca92f8) = UINT32_C(0x81000000);
        D32(0x01ca8a34) = UINT32_C(0xffff8000);
    } else if (SIGN_ORDER(eax) > UINT32_C(0x80007fff)) {
        D32(0x01ca92f8) = UINT32_C(0x81000000);
        D32(0x01ca8a34) = UINT32_C(0x00007fff);
    } else {
        D32(0x01ca8a34) = eax;
    }

    /* 45E77A..45E7C5: read FLAG before the IR store, then OR/store. */
    if (SIGN_ORDER(ecx) < UINT32_C(0x7fff8000)) {
        eax = D32(0x01ca92f8);
        D32(0x01ca8a38) = UINT32_C(0xffff8000);
        eax |= UINT32_C(0x80800000);
        D32(0x01ca92f8) = eax;
    } else if (SIGN_ORDER(ecx) > UINT32_C(0x80007fff)) {
        eax = D32(0x01ca92f8);
        D32(0x01ca8a38) = UINT32_C(0x00007fff);
        eax |= UINT32_C(0x80800000);
        D32(0x01ca92f8) = eax;
    } else {
        D32(0x01ca8a38) = ecx;
    }

    /* 45E7C6..45E81A: three distinct native returns, no summary-bit fix. */
    if (SIGN_ORDER(edx) < UINT32_C(0x7fff8000)) {
        eax = D32(0x01ca92f8);
        D32(0x01ca8a3c) = UINT32_C(0xffff8000);
        eax |= UINT32_C(0x00400000);
        D32(0x01ca92f8) = eax;
        return eax;                    /* 45E7E7/45E7EA */
    }
    if (SIGN_ORDER(edx) > UINT32_C(0x80007fff)) {
        eax = D32(0x01ca92f8);
        D32(0x01ca8a3c) = UINT32_C(0x00007fff);
        eax |= UINT32_C(0x00400000);
        D32(0x01ca92f8) = eax;
        return eax;                    /* 45E80C/45E80F */
    }
    D32(0x01ca8a3c) = edx;
    return eax;                        /* 45E816/45E819 */
}

#undef SIGN_ORDER
#undef D32
```

## Instruction and byte checks / interpretation

1. `asm-001.txt:2-14`, 0x45E673–0x45E6AF: `0F BF` loads signed **words**
   from dword-spaced inputs; `C1 /4 0C` shifts their sign-extended dwords.
   Values are in [-134217728,134213632] after shifting. No signed C shift or
   undefined overflow is used. All three reads precede all output writes.
2. `asm-001.txt:15-25` and `asm-002.txt:3-16`: x87 stack tracing gives
   `b*z-c*y`, `c*x-a*z`, `a*y-b*x`, where x/y/z are the shifted signed words
   and a/b/c are binary32 loads at 0x1CA923C/44/4C. This supports **Cross3**;
   float operand encodings `D9 05` support **Float**, independently of labels.
   Repeated global loads have not been hoisted or consolidated.
3. `bytes-001.txt:3-6`: `DC 05 D8 93 B6 00` reads a binary64 addend;
   `DD 5C 24 00` stores a binary64 result. It is not FIST/FISTP. Only the low
   stored dword is read, then 0x80000000 is added modulo 2^32. The constant's
   alleged value 2^52+2^31 comes from compaction line 40, not a constant-data
   slice in this packet. Reading the actual mapped constant avoids guessing it.
4. `asm-002.txt:8,19,22`: the three `DD D8` operations discard the saved
   z/y/x values. Maximum temporary x87 depth is five, net stack change zero.
   No control-word reset occurs; PC, RC, masks, sticky exceptions and x87
   stack behavior are left to the identical native operations. No fused
   multiply-subtract, extra real spill, float-to-int conversion, or rounding
   helper replaces them. C/compiler-added FP instructions must be absent.
5. `asm-002.txt:21-25`, `asm-003.txt:1-25`, `asm-004.txt:1-17`: signed
   inclusive range [-32768,32767], with **dword** stores of the limits,
   supports **SatS16** as a value-range description, not a store-width claim.
   Encodings `7D`/`7E` are signed JGE/JLE; JLE is ZF=1 OR SF!=OF.
   C uses those opcode semantics, not unsigned comparisons of raw results.
6. 0x45E742/75F assign FLAG=0x81000000; 0x45E791/7B4 OR 0x80800000;
   0x45E7DD/802 OR **0x00400000 only**. Third-only clipping must not acquire
   bit 31 by analogy with another component or hardware GTE documentation.
   Native EAX survives the first clamp; it becomes accumulated FLAG only on
   second/third clipping paths. The C returns that exact bit pattern.
7. `metadata.json:118-184,186`: 11 near-call xrefs from nine callers, no
   outgoing targets. There is no supplied caller-side ABI/return-use proof.
   The implementation consequently claims zero explicit arguments and cdecl
   compatibility, not proof that the original declared return type was uint32.

The literal cross-and-clamp behavior is high-confidence. Retaining the supplied
name `Gte_Cross3Float_SatS16` is reasonable only with **Gte** qualified as the
shared-register-file interpretation in the common compaction, not independent
proof of hardware instruction equivalence. No camera role is inferred from
the input labels.

## CFG coverage

| Native block start(s) | C correspondence |
|---|---|
| 45E670 | scratch + complete instruction island + first signed test |
| 45E742, 45E758, 45E75F, 45E775 | first low/high/no-clamp branches |
| 45E77A, 45E782, 45E79D, 45E7A5, 45E7C0 | second low/high/no-clamp branches |
| 45E7C6, 45E7CE, 45E7EB, 45E7F3, 45E810 | third tests and all three exits |

## Open limits and validations not executed

- Inline assembly is necessary for the provided exact-x87 requirement; a
  pure ISO C replacement remains unproven and is not supplied as equivalent.
- No frozen initial x87 CW/status/tags or input-domain bounds are provided.
  No assumption of round-to-nearest, finite inputs, masked exceptions, or
  numerical conversion validity is used to simplify the instruction island.
  Native stack-overflow/underflow and FP exceptions remain possible.
- x87 FIP/FDP debugging pointers, fault EIP/stack layout, exact outgoing
  caller-saved GPRs/flags and stack residue are not portable C ABI outputs;
  this is not a byte-identical relocation of the original function.
- Absolute-address memory accesses require the original mapped objects;
  this is not a host-address-independent harness or a concurrent-memory model.
- Requested lead validation: compile/disassemble the i386 island and check
  each x87 encoding and absence of compiler FP work; differential execution
  across PC/RC modes, finite/nonfinite operands, signed boundaries, third-only
  clipping and leftover-EAX paths. These are requests, **not PASS results**.
- Compilation, execution, independent hash recomputation, differential tests,
  integration, and IDB review were not executed. Output hash: parent to compute.
