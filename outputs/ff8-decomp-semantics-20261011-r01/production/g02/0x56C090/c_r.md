# 0x56C090 — C R, reconciled against the frozen native instructions

## Verdict and provenance

**RECONCILED_WITH_LIMITS.** All 116 instructions, all three CFG blocks and the single 396-byte chunk `[0x56C090,0x56C21C)` are accounted for below. B is not a faithful replacement; A's instruction-semantic approach is retained with a simpler direct-address backend and corrected qualifications. This is a complete machine-state C reconstruction, not a validated portable three-argument replacement or final §5.6 acceptance.

Only the assigned `reconciliation/g02/0x56C090/C/` projection and common instructions were consulted. Manifest provenance identifies distinct native author sessions:

| Author | Native session | Model readback | Frozen candidate SHA-256 |
|---|---|---|---|
| A | `ses_ed3e1859bffeR37dI1DsMJKGG3` | `openai/gpt-6.1-sol`, high | `39859077829adef4f73cc960350112f1447362223d9321e818b22f70b9eafa07` |
| B | `ses_ed3e180d8ffe38JkJAeYreJ1La` | `opencode-go/gpt-6-luna`, medium | `0dbea466c825a7d2082d29edb56d138ca9a231b8f53f7a5f5a8b54e19ae1cbe5` |

Native packet SHA-256 `e68f56607e807248d56cc62139e98f0783ff8f47fb67210c5983f809fc4ed1ad`; compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`; native metadata `3cf37773b05226afd544cc1da2e11021964ce45bf4c0b4f463ca976d2f0d6633`; byte slice `0c0d36618e8a316644115151ea42eb654c278ab9c3967b59d39f70b6b6973a3c`. Native-manifest declarations match reconciliation-manifest declarations for the packet, compaction and every projected slice. No author is missing and no declared-hash inconsistency was found. **These are supplied hashes, not independently recomputed hashes**; no byte-file hashing primitive is exposed here. Parent owns recomputation/output hashing.

Read both complete candidates, all five complete ASM slices (25/25/25/25/16 instructions), all 13 byte-slice lines, native metadata lines 1–1747, and original packet lines 1–1755 in bounded reads. The original packet's long assembly string at line 18 is display-truncated by `read`; its entire instruction content was consumed via the supplied five verbatim slices instead. Original chunk hex at line 15 is fully displayed and agrees with the byte slice. Context Mode is not exposed in this worker's allowed catalog; no index/API/shell substitute was used.

## Convergences, divergences and common-error search

Agreement is not the deciding evidence. The following decisions come from operands, bytes and dataflow:

| Issue | A / B | Native decision |
|---|---|---|
| Signed inputs, stride, count | Both: nine signed matrix words, three signed triples, stride six | Retain: `MOVSX r32,m16`, count `EDX=3`, `ADD ECX,6; DEC EDX; JNZ` (56C09D–56C165, 56C1E6). No signed loop-bound test. |
| Matrix/vector operand order | Same ordinary mathematical expressions; B changes matrix preload order | Actual matrix read order is byte offsets `C,6,0,E,8,2,10,A,4`, interleaved with scratch stores/FILD/spills. Preserve that order, not B's `0,6,C,2,8,E,4,A,10`. It matters for stack/input overlap and faults. |
| Scale and conversion constants | A reads native addresses; B hardcodes 1/4096 and a numeric magic constant | Retain three DWORD reads of `0xB695F8` per iteration and three QWORD reads of `0xB693D8`. Bytes `D8 0D F8 95 B6 00`, `DC 05 D8 93 B6 00` prove widths/addresses, not values. Constant values remain conditional secondary context. |
| Floating arithmetic/environment | A keeps opcodes; B substitutes C double/volatile-double expressions | Retain actual x87 instruction order, active precision/rounding/masks, FSTP32 coefficient spills, FSTP64 conversions and register pops. B's extra binary64 stores/C evaluation and lack of exact status/tag behavior are not equivalent. Its exact-product assertion does not cover reduced x87 precision or arbitrary live constant values. |
| Result conversion | Both extract the low word rather than saturate | Correct: `DD 5C 24 08` is QWORD FSTP; `66 8B 74 24 08` loads SI. No FISTP, truncating integer cast, rounding library, shift or saturation. |
| Last two bytes | Both identify an untouched local word; B reads an uninitialized C union member | Retain actual initialized **machine memory** as input. B's uninitialized object read is not a model of the original stack bytes and introduces C-language indeterminacy/undefined-behavior risks. Never initialize this word as a repair. |
| Copy ordering/alias | A retains interleaved loads/stores/pops; B uses a five-iteration copy | Preserve 56C1EF–56C215: first two source dwords are loaded before the first output store; later loads are interleaved with earlier stores. B changes observable results under local-output overlap. No `restrict`, bulk memcpy or hidden snapshot. |
| ABI/register widths | A models native frame, SI updates, return and flags; B only returns `out` | Retain 32-bit modular addresses, low-16 SI replacement, plain RET without argument cleanup, EAX=third argument, and memory-derived ESI/EBP restoration. AX/AL are not separate result registers. |

**Common-error corrections:** “destination+18/+19 are entry stack residue” is only true when preceding output writes do not overlap their source bytes. For example, output beginning at `S+0x3A` overwrites those bytes with its first DWORD store before the final source DWORD is loaded. Both candidates' prose overgeneralizes this point; the exact ordered C below does not. Likewise, “all nine matrix words preloaded” does not license an atomic input snapshot when matrix storage overlaps the scratch/spill frame. Neither candidate nor this R proves the actual constant contents from instruction bytes. Label/comment agreement cannot make Q12 or a battle-specific role CERTAIN.

## Complete reconciled C — instruction-semantic implementation

The native conceptual ABI is `void * __cdecl sub_56C090(const void *triples, const void *matrix, void *destination)`. Entry ESP addresses a return address followed by those three arguments. The C below executes that **original guest frame**, including RET, instead of allocating a new, indeterminate C result array. Memory addresses are actual 32-bit addresses in a Win32 harness; native stack memory and constant data must already be mapped. Guest registers/frame and harness execution stack/state must be separate. The host x87 state at entry is the guest x87 state.

Implementation target: MSVC Win32/x86, inline expansion of the integer helpers, no instrumentation and no floating C expressions or compiler-added x87 instructions. This is deliberately implementation-specific, not ISO-C alias/alignment portability. Integer memory helpers perform exactly one volatile WORD/DWORD transaction; MSVC/x86 permits the native unaligned accesses. The x87 memory macro evaluates its address once, then emits the given width-specific instruction. Helpers/macros are reconstruction notation, **not calls present in the target**. Their emitted code must be checked by the lead before executable use.

```c
#include <stdint.h>

typedef struct X86State56C090 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eflags, eip;
} X86State56C090;

static __forceinline uint32_t read32(uint32_t address)
{ return *(volatile uint32_t *)(uintptr_t)address; }
static __forceinline uint16_t read16(uint32_t address)
{ return *(volatile uint16_t *)(uintptr_t)address; }
static __forceinline void write32(uint32_t address, uint32_t value)
{ *(volatile uint32_t *)(uintptr_t)address = value; }
static __forceinline void write16(uint32_t address, uint16_t value)
{ *(volatile uint16_t *)(uintptr_t)address = value; }
static __forceinline uint32_t sign_extend16(uint16_t value)
{
    return (uint32_t)value |
           ((value & UINT16_C(0x8000)) ? UINT32_C(0xFFFF0000) : 0u);
}

/* Guest integer registers have C names a/c/d/s/b/si, never ASM names. */
#define FPMEM(op, width, address) do {             \
    uint32_t fp_address = (uint32_t)(address);     \
    __asm { mov eax, fp_address }                 \
    __asm { op width ptr [eax] }                  \
} while (0)
#define FPREG(...) __asm { __VA_ARGS__ }

void execute_56C090(X86State56C090 *cpu)
{
    uint32_t a = cpu->eax, c = cpu->ecx, d = cpu->edx;
    uint32_t s = cpu->esp, b = cpu->ebp, si = cpu->esi;
    uint32_t carry_from_add = 0;

    /* Block 56C090..56C12F: all 43 instructions. */
    s -= 4u; write32(s, b);                 /* 56C090 PUSH EBP */
    b = s;
    s &= UINT32_C(0xFFFFFFF8);
    s -= UINT32_C(0x44);
    a = read32(b + 12u);                    /* second argument */
    s -= 4u; write32(s, si);
    c = sign_extend16(read16(a + 12u));
    d = sign_extend16(read16(a + 6u));
    write32(s + 8u, c);
    FPMEM(fild, dword, s + 8u);
    c = sign_extend16(read16(a));
    write32(s + 8u, d);
    FPMEM(fild, dword, s + 8u);
    d = sign_extend16(read16(a + 14u));
    write32(s + 8u, c);
    FPMEM(fild, dword, s + 8u);
    c = sign_extend16(read16(a + 8u));
    write32(s + 8u, d);
    FPMEM(fild, dword, s + 8u);
    d = sign_extend16(read16(a + 2u));
    FPMEM(fstp, dword, s + 24u);            /* 56C0D4: M[14] */
    write32(s + 8u, c);
    FPMEM(fild, dword, s + 8u);
    c = sign_extend16(read16(a + 16u));
    FPMEM(fstp, dword, s + 20u);            /* M[8] */
    write32(s + 8u, d);
    FPMEM(fild, dword, s + 8u);
    d = sign_extend16(read16(a + 10u));
    FPMEM(fstp, dword, s + 16u);            /* M[2] */
    write32(s + 8u, c);
    c = read32(b + 8u);                     /* first argument */
    FPMEM(fild, dword, s + 8u);
    a = sign_extend16(read16(a + 4u));
    FPMEM(fstp, dword, s + 36u);            /* M[16] */
    write32(s + 8u, d);
    c += 4u;
    FPMEM(fild, dword, s + 8u);
    write32(s + 8u, a);
    a = s + 44u;                           /* LEA, not a read */
    d = 3u;
    FPMEM(fstp, dword, s + 32u);            /* M[10] */
    FPMEM(fild, dword, s + 8u);
    FPMEM(fstp, dword, s + 28u);            /* 56C12B: M[4] */

    /* Block 56C12F..56C1EC: all 55 instructions, three passes. */
    do {
        si = sign_extend16(read16(c - 4u));
        write32(s + 8u, si);
        a += 6u;
        FPMEM(fild, dword, s + 8u);
        si = sign_extend16(read16(c - 2u));
        FPMEM(fmul, dword, UINT32_C(0xB695F8));
        write32(s + 8u, si);
        FPMEM(fild, dword, s + 8u);
        si = sign_extend16(read16(c));
        FPMEM(fmul, dword, UINT32_C(0xB695F8));
        write32(s + 8u, si);
        carry_from_add = (c > UINT32_C(0xFFFFFFF9));
        c += 6u;
        FPMEM(fild, dword, s + 8u);
        --d;                               /* 56C164: JNZ's ZF */
        FPMEM(fmul, dword, UINT32_C(0xB695F8));
        FPREG(fld st(3));
        FPREG(fmul st, st(3));
        FPREG(fld st(5));
        FPREG(fmul st, st(3));
        FPREG(faddp st(1), st);
        FPREG(fld st(6));
        FPREG(fmul st, st(2));
        FPREG(faddp st(1), st);
        FPMEM(fadd, qword, UINT32_C(0xB693D8));
        FPMEM(fstp, qword, s + 8u);         /* 56C181: binary64 */
        FPMEM(fld, dword, s + 16u);
        FPREG(fmul st, st(3));
        FPMEM(fld, dword, s + 20u);
        FPREG(fmul st, st(3));
        si = (si & UINT32_C(0xFFFF0000)) | read16(s + 8u);
        write16(a - 10u, (uint16_t)si);     /* 56C196 */
        FPREG(faddp st(1), st);
        FPMEM(fld, dword, s + 24u);
        FPREG(fmul st, st(2));
        FPREG(faddp st(1), st);
        FPMEM(fadd, qword, UINT32_C(0xB693D8));
        FPMEM(fstp, qword, s + 8u);
        FPMEM(fld, dword, s + 28u);
        FPREG(fmul st, st(3));
        FPMEM(fld, dword, s + 32u);
        FPREG(fmul st, st(3));
        si = (si & UINT32_C(0xFFFF0000)) | read16(s + 8u);
        write16(a - 8u, (uint16_t)si);      /* 56C1BF */
        FPREG(faddp st(1), st);
        FPMEM(fld, dword, s + 36u);
        FPREG(fmul st, st(2));
        FPREG(faddp st(1), st);
        FPMEM(fadd, qword, UINT32_C(0xB693D8));
        FPMEM(fstp, qword, s + 8u);
        si = (si & UINT32_C(0xFFFF0000)) | read16(s + 8u);
        FPREG(fstp st);                     /* 56C1DC */
        write16(a - 6u, (uint16_t)si);      /* 56C1DE */
        FPREG(fstp st);
        FPREG(fstp st);
    } while (d != 0u);                      /* 56C1E6 JNZ */

    /* Block 56C1EC..56C21C: all 18 instructions. */
    a = read32(b + 16u);                    /* third argument / EAX */
    d = read32(s + 40u);
    c = read32(s + 44u);
    si = read32(s); s += 4u;                /* POP ESI */
    write32(a, d);
    d = read32(s + 44u);                    /* original S+48 */
    FPREG(fstp st);
    write32(a + 4u, c);
    c = read32(s + 48u);                    /* original S+52 */
    write32(a + 8u, d);
    d = read32(s + 52u);                    /* original S+56 */
    FPREG(fstp st);
    FPREG(fstp st);
    write32(a + 12u, c);
    write32(a + 16u, d);
    s = b;
    b = read32(s); s += 4u;
    uint32_t return_address = read32(s); s += 4u; /* C3 RET */

    cpu->eax = a; cpu->ecx = c; cpu->edx = d;
    cpu->esp = s; cpu->ebp = b; cpu->esi = si;
    cpu->eip = return_address;
    /* Final DEC 1->0: OF/SF/AF=0, ZF/PF=1. CF is from ADD ECX,6.
       No later native instruction writes arithmetic EFLAGS. */
    cpu->eflags = (cpu->eflags & ~UINT32_C(0x8D5)) |
                  UINT32_C(0x44) | carry_from_add;
    /* EBX/EDI unchanged. Host EFLAGS are not guest EFLAGS. */
}
#undef FPMEM
#undef FPREG
```

This code preserves target access ordering, including pushes, frame-argument rereads, x87 memory operations and partial SI writes. It adds no target-level guards or callees. Integer additions/subtractions use `uint32_t`, hence x86 wrap; the only narrowing casts represent the native WORD store. There are no target shifts and no signed integer overflow. The source/matrix/destination may overlap one another or the **guest** frame; guest-to-harness-state alias is outside this implementation contract. All guest memory is real initialized machine storage, even when bytes have no initialized high-level C object meaning. There is no C read of an uninitialized local.

### x87 and exception limits

No FNINIT, FLDCW, FISTP or control-word reset is invented. All x87 opcodes use the incoming active host x87 environment; status/tags/stack are changed by those opcodes as in the native sequence. The peak added depth is eight: three retained coefficients, three scaled components and two expression temporaries. Each pass pops the three scaled components; the epilogue pops the three retained coefficients. Normal entry with an empty x87 stack returns with it empty, but does not restore the complete entry environment or necessarily clear status. Existing occupied/tagged slots can cause stack faults.

The C model is for ordinary flat-address mapped memory and completed execution, with no asynchronous modification/observation, no exception continuation or instruction-by-instruction debugger equivalence. It commits guest registers/arithmetic flags at completion, not after every potentially faulting instruction. Physical x87 instruction/data pointers refer to the rebuilt backend/addressing, not original instruction EAs. Binary-identical exception environments/precise fault replay are therefore **not claimed**. No compiler verification, execution, native differential check or stack/CW fixture was authorized/run. Backend buildability and emitted sequencing remain unvalidated, not CERTAIN.

## Derived contract and semantic evidence (target-local, not another volet's verdict)

**Role:** reusable signed-16-bit three-component transform helper, applied to three consecutive triples. Output is staged in native locals and copied to a 20-byte destination in five ordered DWORD transfers; it returns the third argument address. Proposed conservative name: `S16Mat3_TransformThreeTriples_Copy20`. Optional `Q12` qualifier remains **UNCERTAIN from primary bytes** until the scale data is captured/read back. No battle/model composition role or caller-specific convention is inferred from labels.

For ordinary input/frame disjointness, denote matrix signed words by their byte offsets `M[o]`. At loop entry the retained stack is `M[0], M[6], M[12]` from ST0 downward. The spilled coefficient groups are `M[2],M[8],M[14]` and `M[4],M[10],M[16]`. Each source triple `(x,y,z)` is loaded/scaled into `z*k,y*k,x*k` from ST0 downward, with **three distinct live reads** of `k` at `0xB695F8`. When the documented constant value holds, output expressions are:

1. `(M[0]*(x/4096) + M[6]*(y/4096)) + M[12]*(z/4096)`;
2. `(M[2]*(x/4096) + M[8]*(y/4096)) + M[14]*(z/4096)`;
3. `(M[4]*(x/4096) + M[10]*(y/4096)) + M[16]*(z/4096)`.

Each expression follows actual x87 precision/rounding, then adds the QWORD at `0xB693D8`, stores binary64 to scratch and extracts its low 16 bits. Those formulas describe non-aliasing mathematical dataflow, not portable integer cast/shift equivalence. The frozen annotations describe `k=1/4096` and the familiar `2^52+2^31` conversion constant, but no data bytes at either address are in this chunk.

Let `S` be ESP after alignment, allocation and PUSH ESI. Scratch is `S+8..S+15`; spills occupy DWORD slots `S+0x10,14,18,1C,20,24`. Initial result cursor is `S+0x2C`; ADD six followed by stores at cursor−A,−8,−6 puts the first triple at `S+0x28,2A,2C`. Three passes calculate bytes `S+0x28..S+0x39`; final copy reads DWORDs at `S+0x28,2C,30,34,38`, thus through `S+0x3B`. The two extra source bytes are untouched by pre-copy target writes, not a tenth coefficient. They remain preexisting stack bytes **unless preceding aliasing output stores overwrite them**.

Native effects: signed WORD input reads; stack save/scratch/spill/result writes; scale/magic data reads; nine WORD calculated local stores; five DWORD destination writes; x87 environment/status effects; EAX destination return. ESI/EBP restore from their actual saved-memory locations, which can be affected by arbitrary output/frame overlap; EBX/EDI untouched. ECX/EDX are volatile final copy values. Plain RET leaves caller responsible for argument cleanup. No full high-level object type, destination alignment requirement, saturation, padding policy, null check or failure return is established.

### Six exact proof anchors

1. **Signed 3×3 input shape/name proof:** 56C09D `MOVSX ECX,word [EAX+C]`, 56C0A1 `[EAX+6]`, 56C0AD `[EAX]` and subsequent MOVSXs through 56C103 cover offsets 0,2,4,6,8,A,C,E,10. Bytes `0F BF` independently establish signed extension, not the IDA label.
2. **Three triples/stride/name proof:** 56C11E `MOV EDX,3`; 56C12F/13E/150 read `[ECX-4]/[ECX-2]/[ECX]`; 56C15D `ADD ECX,6`, 56C164 `DEC EDX`, 56C1E6 `JNZ 56C12F`. This proves three triples independently of the matrix-load evidence.
3. **Scale and arithmetic order:** 56C142/153/165 `FMUL m32real [B695F8]`; 56C16B–179 duplicate/multiply coefficient stack entries and two ordered FADDPs. Subsequent memory-FLD groups through 56C1CB prove the other two dot products. No fixed-point integer multiply/shift sequence is present.
4. **Actual conversion/partial register width:** 56C17B `FADD m64real [B693D8]`; 56C181 bytes `DD 5C 24 08`; 56C191 bytes `66 8B 74 24 08`; 56C196 bytes `66 89 70 F6`. These prove binary64 storage, SI replacement and WORD output; corresponding sequences repeat at 56C1A4–1BF and 56C1CD–1DE.
5. **20-byte copy and returned third argument:** 56C1EC `MOV EAX,[EBP+10h]`; 56C1EF/1F3 preload two local DWORDs; 56C1F8/200/207/212/215 write offsets 0,4,8,C,10; 56C218–21B restores frame and executes `C3`. This proves Copy20, access ordering and caller-clean return, independently of result-loop shape.
6. **Reuse, not a domain claim:** frozen native xrefs include `0x50344D` in function `0x5033E0`, `0x508EC5` in `0x508C90`, and `0x56C233/283/304/374` in `0x56C220/270/2F0/360` (`native-metadata.json:35–68`). `code_targets=[]` at metadata:1745 and inspection of all 116 instructions establish no calls in this body. Caller operand/type/body context is absent; these records prove reuse only.

**Confidence:** high in instruction-derived signedness, offsets, loop/CFG, stack layout, widths, ordered-copy effects and return ABI. Primary-data confidence in constant values and Q12/magic numeric interpretation is **UNCERTAIN**. Domain/padding intention is **UNCERTAIN**. No unresolved instruction-level A/B conflict remains within the stated completed-execution model; compiled equivalence and exact exception replay are not accepted claims.

## Coverage and remaining lead gates

| CFG region | Instructions | Reconciled coverage |
|---|---:|---|
| `[56C090,56C12F)` | 43 | frame, every ordered signed matrix read/FILD/spill, first-arg load, cursor/count |
| `[56C12F,56C1EC)` | 55 | all source reads/scales, all stack-index/memory dot products, FADD64/FSTP64/SI/WORD stores, pops, DEC/JNZ |
| `[56C1EC,56C21C)` | 18 | third-arg load, five source/destination DWORD transfers in native order, ESI/x87/EBP cleanup, RET |

One chunk, no omitted blocks/chunks; no invented callee, guard, initialization or precision normalization. Operand widths were checked against the frozen bytes, particularly D9 DWORD spills versus DD QWORD scratch stores and the 66 SI/store prefixes. This is an offline reconciliation, not the lead's native §5.6 control.

For final integration the lead should verify the current native body/readback, recompute deposited/output hashes, compile/disassemble the selected backend, and test nonsymmetric matrix ordering, half-way rounding under multiple CW precision/rounding settings, preexisting stack tail bytes, input/output overlap and ordered-copy/frame aliasing. A bounded capture of 4 bytes at `B695F8` and 8 at `B693D8` would resolve the primary constant-value limitation; it is not required to preserve the live-memory opcodes in this reconstruction. No worker IDB/Git/registry/config/live action occurred.
