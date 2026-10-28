# 0x56C090 — independent C A

## Authority and scope

Input packet SHA-256: `e68f56607e807248d56cc62139e98f0783ff8f47fb67210c5983f809fc4ed1ad` (readable/manifest.json:4). Common compaction SHA-256: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34` (manifest:5). EXE SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` (metadata:8).

Read all five verbatim ASM slices (25+25+25+25+16 = 116 instructions), all 13 byte-slice lines, and metadata lines 1–1747. One contiguous chunk `[0x56C090,0x56C21C)`, 396 bytes. No target C, classifier, sibling output, index, or additional discovery consulted in this author role.

## Complete C, instruction-semantic form

This deliberately retains x87 instructions rather than replacing the magic-double sequence with an integer cast, rounding library, or an integer right shift. It also retains the native stack-memory source of the last two output bytes. A conventional C `uint16_t result[10]` with an uninitialized tenth element would introduce C undefined behavior instead of representing the actual machine-memory read.

The following is a complete **machine-state C implementation**, not a claim of a drop-in, three-argument portable C ABI. It consumes the original cdecl argument frame and models original stack/register accesses explicitly. `memory` is the supplied, live, little-endian x86 address space indexed by a 32-bit guest address; its initial stack bytes are inputs, not synthesized zeros. The inline x87 backend is for MSVC 32-bit x86, with the caller's x87 state already active. No floating C expression, external helper, or library call is introduced. Local integer access helpers are implementation notation, not proposed native callees.

Contract: ordinary valid mapped memory, no asynchronous observers, no execution resumed after a memory fault or unmasked x87 exception. Access sizes/order, modulo-2^32 integer addresses, native x87 operand widths and operation order, output/stack aliasing, and final integer register state are retained. Host x87 exception instruction/data pointers are necessarily those of this implementation, not the original EAs; instruction-pointer-exact exception replay is not claimed. The source address space must contain the actual constants at `0xB695F8` and `0xB693D8`; their bytes are not included in the frozen chunk.

```c
#include <stdint.h>

typedef struct X86_56C090 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eflags, eip;
} X86_56C090;

/* MSVC/x86 unaligned, little-endian, width-specific memory operations.
   No restrict: inputs, output, constants and native stack may alias. */
static __forceinline uint32_t r32(volatile uint8_t *m, uint32_t a)
{ return *(volatile uint32_t *)(m + a); }
static __forceinline uint16_t r16(volatile uint8_t *m, uint32_t a)
{ return *(volatile uint16_t *)(m + a); }
static __forceinline void w32(volatile uint8_t *m, uint32_t a, uint32_t v)
{ *(volatile uint32_t *)(m + a) = v; }
static __forceinline void w16(volatile uint8_t *m, uint32_t a, uint16_t v)
{ *(volatile uint16_t *)(m + a) = v; }
static __forceinline uint32_t sx16(uint16_t v)
{ return (uint32_t)v | ((v & UINT16_C(0x8000)) ? UINT32_C(0xFFFF0000) : 0u); }

/* These expand inline; the real host x87 stack/status/control are used.
   Do not build for x64, enable FP rewriting, or insert floating C code.
   Each X87M address is evaluated once before the x87 memory instruction. */
#define X87M(op, width, addr) do {                              \
    volatile uint8_t *x87_address = memory + (uint32_t)(addr);  \
    __asm mov eax, x87_address                                 \
    __asm op width ptr [eax]                                   \
} while (0)
#define X87R(...) __asm { __VA_ARGS__ }

void execute_56C090(X86_56C090 *cpu, volatile uint8_t *memory)
{
    uint32_t eax = cpu->eax, ecx = cpu->ecx, edx = cpu->edx;
    uint32_t esp = cpu->esp, ebp = cpu->ebp, esi = cpu->esi;
    uint32_t last_add_carry = 0;

    /* 56C090–56C12B: native frame, matrix preload and loop setup. */
    esp -= 4u; w32(memory, esp, ebp);                /* push ebp */
    ebp = esp;
    esp &= UINT32_C(0xFFFFFFF8);
    esp -= UINT32_C(0x44);
    eax = r32(memory, ebp + 12u);                  /* arg_4 */
    esp -= 4u; w32(memory, esp, esi);              /* push esi */
    ecx = sx16(r16(memory, eax + 12u));
    edx = sx16(r16(memory, eax + 6u));
    w32(memory, esp + 8u, ecx);
    X87M(fild, dword, esp + 8u);
    ecx = sx16(r16(memory, eax));
    w32(memory, esp + 8u, edx);
    X87M(fild, dword, esp + 8u);
    edx = sx16(r16(memory, eax + 14u));
    w32(memory, esp + 8u, ecx);
    X87M(fild, dword, esp + 8u);
    ecx = sx16(r16(memory, eax + 8u));
    w32(memory, esp + 8u, edx);
    X87M(fild, dword, esp + 8u);
    edx = sx16(r16(memory, eax + 2u));
    X87M(fstp, dword, esp + 24u);                  /* var_30 */
    w32(memory, esp + 8u, ecx);
    X87M(fild, dword, esp + 8u);
    ecx = sx16(r16(memory, eax + 16u));
    X87M(fstp, dword, esp + 20u);                  /* var_34 */
    w32(memory, esp + 8u, edx);
    X87M(fild, dword, esp + 8u);
    edx = sx16(r16(memory, eax + 10u));
    X87M(fstp, dword, esp + 16u);                  /* var_38 */
    w32(memory, esp + 8u, ecx);
    ecx = r32(memory, ebp + 8u);                   /* arg_0 */
    X87M(fild, dword, esp + 8u);
    eax = sx16(r16(memory, eax + 4u));
    X87M(fstp, dword, esp + 36u);                  /* var_24 */
    w32(memory, esp + 8u, edx);
    ecx += 4u;
    X87M(fild, dword, esp + 8u);
    w32(memory, esp + 8u, eax);
    eax = esp + 44u;                              /* &var_1C */
    edx = 3u;
    X87M(fstp, dword, esp + 32u);                  /* var_28 */
    X87M(fild, dword, esp + 8u);
    X87M(fstp, dword, esp + 28u);                  /* var_2C */

    /* 56C12F–56C1E6: three iterations, not a signed bound test. */
    do {
        esi = sx16(r16(memory, ecx - 4u));
        w32(memory, esp + 8u, esi);
        eax += 6u;
        X87M(fild, dword, esp + 8u);
        esi = sx16(r16(memory, ecx - 2u));
        X87M(fmul, dword, UINT32_C(0xB695F8));
        w32(memory, esp + 8u, esi);
        X87M(fild, dword, esp + 8u);
        esi = sx16(r16(memory, ecx));
        X87M(fmul, dword, UINT32_C(0xB695F8));
        w32(memory, esp + 8u, esi);
        last_add_carry = (ecx > UINT32_C(0xFFFFFFF9));
        ecx += 6u;
        X87M(fild, dword, esp + 8u);
        --edx;                                   /* DEC sets JNZ's ZF */
        X87M(fmul, dword, UINT32_C(0xB695F8));
        X87R(fld st(3));
        X87R(fmul st, st(3));
        X87R(fld st(5));
        X87R(fmul st, st(3));
        X87R(faddp st(1), st);
        X87R(fld st(6));
        X87R(fmul st, st(2));
        X87R(faddp st(1), st);
        X87M(fadd, qword, UINT32_C(0xB693D8));
        X87M(fstp, qword, esp + 8u);              /* DD 5C 24 08 */
        X87M(fld, dword, esp + 16u);
        X87R(fmul st, st(3));
        X87M(fld, dword, esp + 20u);
        X87R(fmul st, st(3));
        esi = (esi & UINT32_C(0xFFFF0000)) | r16(memory, esp + 8u);
        w16(memory, eax - 10u, (uint16_t)esi);     /* SI, not ESI */
        X87R(faddp st(1), st);
        X87M(fld, dword, esp + 24u);
        X87R(fmul st, st(2));
        X87R(faddp st(1), st);
        X87M(fadd, qword, UINT32_C(0xB693D8));
        X87M(fstp, qword, esp + 8u);
        X87M(fld, dword, esp + 28u);
        X87R(fmul st, st(3));
        X87M(fld, dword, esp + 32u);
        X87R(fmul st, st(3));
        esi = (esi & UINT32_C(0xFFFF0000)) | r16(memory, esp + 8u);
        w16(memory, eax - 8u, (uint16_t)esi);
        X87R(faddp st(1), st);
        X87M(fld, dword, esp + 36u);
        X87R(fmul st, st(2));
        X87R(faddp st(1), st);
        X87M(fadd, qword, UINT32_C(0xB693D8));
        X87M(fstp, qword, esp + 8u);
        esi = (esi & UINT32_C(0xFFFF0000)) | r16(memory, esp + 8u);
        X87R(fstp st);
        w16(memory, eax - 6u, (uint16_t)esi);
        X87R(fstp st);
        X87R(fstp st);
    } while (edx != 0u);

    /* 56C1EC–56C21B: exact interleaved copy/pop order. */
    eax = r32(memory, ebp + 16u);                 /* arg_8 */
    edx = r32(memory, esp + 40u);                 /* var_20 */
    ecx = r32(memory, esp + 44u);                 /* var_1C */
    esi = r32(memory, esp); esp += 4u;
    w32(memory, eax, edx);
    edx = r32(memory, esp + 44u);                 /* var_18 after pop */
    X87R(fstp st);
    w32(memory, eax + 4u, ecx);
    ecx = r32(memory, esp + 48u);                 /* var_14 after pop */
    w32(memory, eax + 8u, edx);
    edx = r32(memory, esp + 52u);                 /* var_10 after pop */
    X87R(fstp st);
    X87R(fstp st);
    w32(memory, eax + 12u, ecx);
    w32(memory, eax + 16u, edx);
    esp = ebp;
    ebp = r32(memory, esp); esp += 4u;
    cpu->eip = r32(memory, esp); esp += 4u;        /* RET, no arg cleanup */
    cpu->eax = eax; cpu->ecx = ecx; cpu->edx = edx;
    cpu->esp = esp; cpu->ebp = ebp; cpu->esi = esi;
    /* Final DEC was 1 -> 0: OF=SF=AF=0, ZF=PF=1;
       CF survives DEC from the final ADD ECX,6. Other bits unchanged.
       The modeled epilogue's C arithmetic does not alter guest flags. */
    cpu->eflags = (cpu->eflags & ~UINT32_C(0x8D5))
                | UINT32_C(0x44) | last_add_carry;
    /* EBX and EDI are untouched. */
}

#undef X87M
#undef X87R
```

## Dataflow / ABI / stack explanation

Original ABI: three stack arguments, `arg_0` at entry ESP+4, `arg_4` at +8, `arg_8` at +12. Conceptual declaration is `void * __cdecl sub_56C090(const void *vectors, const void *matrix, void *destination)`. A caller pushes destination, matrix, vectors, right-to-left and later removes 12 bytes. There are no calls inside this function. EAX returns the destination address; ECX and EDX contain the last copied dwords. ESI and EBP are saved/restored through memory, EBX/EDI unchanged. Arbitrary output overlap with the saved frame can change the restored EBP/return address; the machine-state implementation does not conceal that with a no-alias assumption.

Let `S` be native ESP after alignment, allocation and PUSH ESI. Scratch is `S+8..S+15`; six float matrix spills are at `S+0x10,14,18,1C,20,24`. Three other matrix coefficients stay on the x87 stack. The loop result starts at `S+0x28` (EAX initially `S+0x2C`, then +6, then stores at EAX−0xA/−8/−6). Three iterations fill exactly `S+0x28..S+0x39`; the copy reads `S+0x28..S+0x3B`. Bytes `S+0x3A` and `S+0x3B` were never initialized by this function. They are **entry stack residue copied to destination+18/+19**, not preserved destination bytes, padding zero, or a tenth calculated coefficient. Native stack writes remain effects even after frame teardown.

For ordinary disjoint input/output/frame storage, write `v=(x,y,z)` for each signed-16-bit vector and `M[o]` for a signed word at matrix byte offset `o`. With the documented scale value, the three expressions are, in this addition order:

1. `(M[0]*(x/4096) + M[6]*(y/4096)) + M[12]*(z/4096)`;
2. `(M[2]*(x/4096) + M[8]*(y/4096)) + M[14]*(z/4096)`;
3. `(M[4]*(x/4096) + M[10]*(y/4096)) + M[16]*(z/4096)`.

Each undergoes the actual x87 FADD with a qword at B693D8, then FSTP **binary64**, then a load of its lowest 16 bits. There is no FISTP, integer shift, integer product wrap, or saturation in this function. The low-word extraction implements the native result even when an ordinary signed cast would overflow. Pointer arithmetic and the three-count decrement are 32-bit modular; JNZ is zero/nonzero, not a signed relational branch. SI updates only low 16 ESI bits, and WORD stores never store ESI's high half. AL/AX are not used as a result here.

The x87 maximum added depth is eight: three retained coefficients + three scaled source components + two expression temporaries. Each iteration removes its three source components after its three expression stores; the epilogue removes the retained coefficients. With an initially empty x87 stack, it ends empty; incoming full/tagged slots can cause stack faults. CW precision/rounding, exception masks/status and the actual constant bytes are not established by this packet. No CW reset or FNINIT occurs; no claim of universally round-to-nearest equivalence is made. Exact operation sequencing is retained in the C backend, including FSTP32 matrix spills, FSTP64 scratch and the copy's interspersed x87 pops.

## Proofs, naming and confidence

Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g02/0x56C090.readable/`.

1. **Signed matrix / 3×3 evidence and name proof:** asm-001:7–25 and asm-002:1–18, EAs 56C09D–56C12B, load nine sign-extended WORDs at offsets 0,2,4,6,8,A,C,E,10. The indexing, not the label, supports `Mat3S16`.
2. **Three vectors / scale evidence and name proof:** asm-002:19–25 and asm-003:1–8, EAs 56C12F–56C165, read components at ECX−4,−2,0, advance ECX by 6, decrement the count initialized to three, and multiply each x87-loaded signed component by the dword at B695F8. Common-compaction:9 documents 1/4096 as secondary constant evidence; bytes-001:6–8 prove the operand address/width. This supports a Q12-scaled three-vector transform, conditionally on that constant value.
3. **Dot products and conversion:** asm-003:9–25 / asm-004:1–18, EAs 56C16B–56C1D7, have three pairs of FADDP followed by qword FADD/FSTP and low-WORD loads. Bytes-001:8–11 distinguish the `DD` qword store from the `D9` dword matrix spills. This rejects replacement by truncating C casts.
4. **Unusual destination extent:** asm-002:14,21, asm-003:24, asm-004:11,20 and asm-004:24–25 / asm-005:1–13 prove 18 computed bytes but five copied DWORDs. This is independent evidence for the `Copy5` suffix and the stack-residue uncertainty.
5. **ABI and absence of a callee:** asm-001:1–6, asm-002:6, asm-004:24, asm-005:14–16 and metadata:1745–1746 prove the stack frame, third argument return, plain RET and empty direct-code-target list; all 116 instructions have no CALL.
6. **Reusable helper, not a proven battle-specific operation:** metadata:35–68 has native calls from 5033E0, 508C90 and 56C220/270/2F0/360; metadata:251–320 shows repeated calls from 701310/430/4B0/530/5B0/630. Xrefs support reuse, but caller labels and high-level model composition are not proven by these xref records alone.

Proposed descriptive name: `Mat3S16_TransformThreeVectorsQ12_Copy5Dwords`. High confidence in offsets, signed inputs, loop/copy extent, alias-sensitive order and returned address; conditional confidence in the Q12 interpretation because the input projection supplies no constant data bytes. No battle role or mathematical multiplication convention is asserted solely from the prior label. Native behavior includes the unexplained two-byte stack read and it must not be repaired.

## Coverage and validation status

| Native region / CFG block | Covered instructions | C correspondence |
|---|---:|---|
| 56C090–56C12F | 43 | frame, all matrix loads/spills, vector pointer, scratch pointer, count |
| 56C12F–56C1EC | 55 | all component loads/scales, nine expression stores, x87 pops, DEC/JNZ |
| 56C1EC–56C21C | 18 | third argument load, all five DWORD copies, x87 cleanup, restore/RET |

All byte-slice lines and all 116 ASM lines were read without truncation. Manual byte/operand checks distinguish DWORD versus QWORD x87 operations and verify exact result/copy stack offsets; no independent disassembly or automated hash recomputation was executed. Manifest hashes are cited, not claimed revalidated.

Not executed: compilation, macro syntax/toolchain review, differential/native execution, x87 CW variation tests, stack-residue fixtures, exception tests or integration. These belong to the lead/separately authorized reviewer. Recommended validation requests: operand-order tests with nonsymmetric matrices; half-way rounding under multiple CW settings; destination alias fixtures; check destination+18/+19 against original stack bytes; inspect generated backend for exact x87 sequencing. Output hash left to the parent.
