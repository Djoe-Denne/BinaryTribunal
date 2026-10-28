# 0x460860 — independent C A

## Provenance and scope

Role: C A, function **0x460860 only**. Input root packet:
`inputs/ff8-decomp-semantics-20261011-r01/g04/0x460860.json`.

- Original packet SHA-256, verbatim from `0x460860.readable/manifest.json:4`:
  `9384e033a8c2529b83d45416bffb9fc86fec628fa40990f5f60610486739861a`.
- Native executable SHA-256, `metadata.json:8`:
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Compaction SHA-256, manifest line 5:
  `1ffd99c0ab16a51b4b5c26f906c3ff61d657fd111e6c8720353e656c88add668`.
- Read all eight ASM slices, both byte slices and the complete metadata projection;
  manifest declares complete, verbatim projection of the root packet. Hashes are
  supplied provenance, not hashes independently recomputed by this author.
- Coverage: one 654-byte chunk `[0x460860,0x460AEE)`, 177 instructions,
  all 22 CFG blocks and all three returns. No native calls.
- Used the supplied factual compaction, not its historical references as new
  evidence. The inherited checkpoint ends before the historical-C exposure
  described at compaction line 57; no historical target C or peer output was
  read in this author turn.

## Exactness contract

This is a complete **32-bit Microsoft C / MS-style inline-assembly** translation,
not portable ISO C and not a drop-in claim for another compiler. Integer control,
address selection, optional additions and saturation are C. The floating-point
dataflow is an explicit x87 island, retaining individual operations, load/store
interleaving, the writable argument home and the binary64 spill. Replacing that
island by `double`, a cast, `round`, `lrint`, or a reassociated dot product would
not establish equivalence for the unknown incoming x87 control word.

The inline instructions are implementation primitives, **not invented callees**.
There are no external helper prototypes or library calls. The absolute addresses
refer to the original mapped image and state. Neither pointer relocation nor an
abstract separate-array layout is silently assumed. The compiler must support
32-bit x86 inline assembly, little-endian IEEE binary64 storage, 16/32-bit memory
operands and the usual `__cdecl` ABI. These properties have not been build-tested.

The parameter's address is explicitly referenced by inline assembly; its volatile
home is overwritten with each sign-extended integer used by FILD, including the
final matrix coefficient from base+12. No input validation is added. Locals and
compiler prologue need not have the original physical frame offsets, but the
caller-owned parameter word must remain the home referenced by `command`.

```c
#include <stdint.h>

#define U32_AT(a) (*(volatile uint32_t *)(uintptr_t)(a))
/* Order 32-bit two's-complement encodings without an out-of-range signed cast. */
#define S32_LT(a, b) (((a) ^ UINT32_C(0x80000000)) < \
                      ((b) ^ UINT32_C(0x80000000)))
#define S32_GT(a, b) (((a) ^ UINT32_C(0x80000000)) > \
                      ((b) ^ UINT32_C(0x80000000)))

uint32_t __cdecl ea_00460860(volatile uint32_t command)
{
    /* Unsigned shifts followed by &3 equal the native SAR/&3 for every input. */
    uint32_t input_word = command;
    uint32_t add_selector = (input_word >> 13) & 3u;
    uint32_t vector_selector = (input_word >> 15) & 3u;
    uint32_t matrix_base = UINT32_C(0x01CA927C)
                         + (((input_word >> 17) & 3u) << 5);
    uint32_t add_base = UINT32_C(0x01CA9290) + (add_selector << 5);
    uint32_t x, y, z, a, b, c, status;
    /* Only accessed by the assembly as qword store / low-dword read. */
    union { double binary64; uint32_t word[2]; } spill;

    __asm {
        mov eax, matrix_base
        mov edx, vector_selector
        mov edi, input_word
        cmp edx, 3
        jne vector_bank

        /* 46089A..4608C7: signed low words, DWORD stride. */
        movsx edx, word ptr ds:[01CA8A34h]
        mov dword ptr command, edx
        movsx edx, word ptr ds:[01CA8A38h]
        fild dword ptr command
        mov dword ptr command, edx
        movsx edx, word ptr ds:[01CA8A3Ch]
        fild dword ptr command
        mov dword ptr command, edx
        fild dword ptr command
        jmp vector_loaded

    vector_bank:
        /* 4608C9..4608F5: slot stride 8, components at +0,+2,+4. */
        movsx ebx, word ptr [edx*8+01CA8A10h]
        mov dword ptr command, ebx
        movsx ebx, word ptr [edx*8+01CA8A12h]
        fild dword ptr command
        movsx edx, word ptr [edx*8+01CA8A14h]
        mov dword ptr command, ebx
        fild dword ptr command
        mov dword ptr command, edx
        fild dword ptr command

    vector_loaded:
        /* ST0=v2, ST1=v1, ST2=v0. 4608F9..460915. */
        test edi, 80000h
        jz unscaled_ready
        fxch st(2)
        fmul qword ptr ds:[00B69600h]
        fxch st(2)
        fxch st(1)
        fmul qword ptr ds:[00B69600h]
        fxch st(1)
        fmul qword ptr ds:[00B69600h]

    unscaled_ready:
        /* 46091B..46095E: row 0; keep native coefficient prefetch order. */
        movsx edx, word ptr [eax+4]
        mov dword ptr command, edx
        fild dword ptr command
        movsx edx, word ptr [eax+2]
        fmul st, st(1)
        mov dword ptr command, edx
        fild dword ptr command
        movsx edx, word ptr [eax]
        fmul st, st(3)
        mov dword ptr command, edx
        movsx edi, word ptr [eax+0Ah]
        faddp st(1), st
        fild dword ptr command
        mov dword ptr command, edi
        movsx edi, word ptr [eax+8]
        fmul st, st(4)
        movsx ebx, word ptr [eax+10h]
        faddp st(1), st
        fadd qword ptr ds:[00B693D8h]
        fstp qword ptr spill

        /* 460962..4609A6: row 1; raw row-0 store remains interleaved. */
        fild dword ptr command
        mov dword ptr command, edi
        mov edx, dword ptr spill
        movsx edi, word ptr [eax+6]
        fmul st, st(1)
        fild dword ptr command
        mov dword ptr command, edi
        add edx, 80000000h
        mov dword ptr ds:[01CA8A74h], edx
        fmul st, st(3)
        faddp st(1), st
        fild dword ptr command
        mov dword ptr command, ebx
        movsx ebx, word ptr [eax+0Eh]
        fmul st, st(4)
        movsx eax, word ptr [eax+0Ch]
        faddp st(1), st
        fadd qword ptr ds:[00B693D8h]
        fstp qword ptr spill

        /* 4609AA..4609F4: row 2; all native raw-result stores included. */
        fild dword ptr command
        mov dword ptr command, ebx
        mov edi, dword ptr spill
        add edi, 80000000h
        fmul st, st(1)
        fild dword ptr command
        mov dword ptr command, eax
        mov dword ptr ds:[01CA8A78h], edi
        fmul st, st(3)
        faddp st(1), st
        fild dword ptr command
        fmul st, st(4)
        faddp st(1), st
        fadd qword ptr ds:[00B693D8h]
        fstp qword ptr spill
        mov eax, dword ptr spill
        fstp st(0)
        fstp st(0)
        add eax, 80000000h
        /* Original CMP ECX,3 at 4609EF is the later C branch. */
        fstp st(0)
        mov dword ptr ds:[01CA8A7Ch], eax

        /* Bridge register values to C, without reloading the global results. */
        mov x, edx
        mov y, edi
        mov z, eax
    }

    /* 4609F9..460A15. No bank read for selector 3. All additions wrap32. */
    if (add_selector != 3u) {
        a = U32_AT(add_base);
        b = U32_AT(add_base + 4u);
        x += a;
        c = U32_AT(add_base + 8u);
        y += b;
        z += c;
        U32_AT(0x01CA8A74u) = x;
        U32_AT(0x01CA8A78u) = y;
        U32_AT(0x01CA8A7Cu) = z;
    }

    /* 460A1A..460A5A: first signed saturation; status precedes its output. */
    U32_AT(0x01CA92F8u) = 0u;
    if (S32_LT(x, UINT32_C(0xFFFF8000))) {
        U32_AT(0x01CA92F8u) = UINT32_C(0x81000000);
        U32_AT(0x01CA8A34u) = UINT32_C(0xFFFF8000);
    } else if (S32_GT(x, UINT32_C(0x00007FFF))) {
        U32_AT(0x01CA92F8u) = UINT32_C(0x81000000);
        U32_AT(0x01CA8A34u) = UINT32_C(0x00007FFF);
    } else {
        U32_AT(0x01CA8A34u) = x;
    }

    /* 460A60..460A9C: status read, output write, then status write. */
    if (S32_LT(y, UINT32_C(0xFFFF8000))) {
        status = U32_AT(0x01CA92F8u);
        U32_AT(0x01CA8A38u) = UINT32_C(0xFFFF8000);
        status |= UINT32_C(0x80800000);
        U32_AT(0x01CA92F8u) = status;
    } else if (S32_GT(y, UINT32_C(0x00007FFF))) {
        status = U32_AT(0x01CA92F8u);
        U32_AT(0x01CA8A38u) = UINT32_C(0x00007FFF);
        status |= UINT32_C(0x80800000);
        U32_AT(0x01CA92F8u) = status;
    } else {
        U32_AT(0x01CA8A38u) = y;
    }

    /* 460AA2..460AED: asymmetric write order and EAX carrier retained. */
    if (S32_LT(z, UINT32_C(0xFFFF8000))) {
        status = U32_AT(0x01CA92F8u);
        U32_AT(0x01CA8A3Cu) = UINT32_C(0xFFFF8000);
        status |= UINT32_C(0x00400000);
        U32_AT(0x01CA92F8u) = status;
        return status;                     /* native RET 460AC1 */
    }
    if (S32_GT(z, UINT32_C(0x00007FFF))) {
        status = U32_AT(0x01CA92F8u);
        status |= UINT32_C(0x00400000);
        U32_AT(0x01CA92F8u) = status;
        U32_AT(0x01CA8A3Cu) = UINT32_C(0x00007FFF);
        return status;                     /* native RET 460AE1 */
    }
    U32_AT(0x01CA8A3Cu) = z;
    return z;                              /* native RET 460AED */
}

#undef S32_GT
#undef S32_LT
#undef U32_AT
```

## Arithmetic, ABI and alias audit

- Incoming `command` is one DWORD at entry ESP+4. Native SUB ESP,8 plus three
  saved registers places its home at current ESP+0x18; the qword temporary is
  at current ESP+0x0C. Native EBX/ESI/EDI are restored; EBP is untouched. Plain
  RET leaves argument cleanup to the caller. The C compiler owns its own saved
  registers and frame; **a compiled listing must confirm home-slot writes**.
  The native nine wrappers use PUSH immediate, CALL, POP ECX, RET; the POP thus
  receives the final sign extension of matrix[6], not the original command.
- C's `uint32_t` return intentionally specifies the observed **whole EAX bits**,
  not a claimed original source prototype. Return is the third raw/additive
  result when in range, otherwise the updated status word. It is neither always
  the third saturated result nor always status. No AL/AX-only return exists in
  these bytes. The WORD loads sign-extend into full 32-bit registers. All global
  outputs, including the clamped components, are full DWORD stores.
- No signed C overflow or negative C shift is used. Address strides are numeric
  32, 8 and 4 as in the bytes. Addition to each raw result is modulo 2^32; signed
  comparisons operate on the resulting 32-bit encoding, not on a wider sum.
- Matrix indices 0..8 occupy consecutive signed 16-bit words. Load order is
  indices **2,1,0,5,4,8,3,7,6**; the inline sequence retains that order and the
  first two raw-result stores interleaved with later floating-point work.
- Selected vectors are read before any result globals are overwritten, including
  selector 3's feedback from the low WORDs of the three clamp-result DWORDs.
  No `restrict`, bulk load, reconstructed struct, or invented disjoint global
  allocation is used. The optional bank's reads occur after all raw stores.
- x87 vector stack is `[v2,v1,v0]` after loading. When bit19 is set, multiplication
  by the memory binary64 `2^-12` occurs in **v0,v1,v2 order**. Each row is formed
  as `(m2*v2 + m1*v1) + m0*v0` with distinct FMUL/FADDP operations. There is no
  fused operation, reordering, arithmetic shift of the result or integer cast.
- For each row the actual conversion is x87 FADD of the binary64 value
  **2^52 + 2^31**, followed by binary64 FSTP, extraction of that storage's low
  DWORD, then ADD 0x80000000 modulo 2^32. This is a bit-extraction algorithm;
  this reconstruction makes no universal claim that it equals round-to-nearest
  signed conversion for all sums/control words. Native constants, compaction
  lines 25–28: B693D8=`0000008000003043`, B69600=`000000000000303f`.
- Incoming x87 precision/rounding controls are not changed. Hardware retains
  native intermediate precision, each rounding point, binary64-store rounding,
  exception behavior and operand order. Maximum temporary stack use is five
  entries above the incoming stack; net stack use is zero on normal completion.
  The three source-vector entries are popped in the same order. No FPU reset,
  control-word alteration, exception masking or extra guard is invented.
- Equivalence is at function ABI, ordered data accesses and arithmetic level,
  not identity of code addresses, CPU flags, volatile scratch registers, debug
  frame contents, relocated FPU instruction-pointer fields or exact interrupt
  locations. Hardware instruction/data pointer reporting refers to the newly
  generated code/spill addresses. Exception-resume address identity cannot be
  promised by any relocated C implementation.

## Coverage map

| Native CFG starts | Reconstruction |
|---|---|
| 460860 | input capture, three selectors and two base addresses |
| 46089A, 4608C9 | both vector-load branches of x87 island |
| 4608F9, 460901 | bit19 branch and three memory FMULs |
| 46091B | complete three-row island through raw stores and vector pops |
| 4609FB | conditional three DWORD additions and re-stores |
| 460A1A, 460A32, 460A44, 460A48, 460A5A | clear status, first signed clamp |
| 460A60, 460A64, 460A7E, 460A82, 460A9C | second signed clamp/status OR |
| 460AA2, 460AA6, 460AC2, 460AC6, 460AE2 | third signed clamp, all three returns |

## Local semantic interpretation (not another volet's verdict)

**Proposed descriptive name:** `selected_matrix_vector_add_sat16`.
High confidence in the computational description; medium confidence in a
GTE-style command emulation identification. No stronger assertion of camera,
lighting or a complete hardware instruction is necessary or established.

Independent name evidence consists of (1) the target's repeated nine signed
coefficient / three-vector multiply-add sequence, and (2) its separate selector
decoder plus the nine byte-validated constant-command wrappers in the supplied
compaction. Neither depends on the `Gte_MVMVA` label. The `add_sat16` suffix is
additionally supported by the separate integer-add and signed-bound blocks.

Six evidence groups:

1. **46086E–46088F**, `asm-001.txt:8–19`: three two-bit fields and two banks with
   stride 0x20; not a single fixed matrix or a pointer argument.
2. **46089A–4608F5**, `asm-001.txt:22–25`, `asm-002.txt:1–15`: input triple from
   one of three packed slots, or from the previous clamp-result low WORDs.
3. **46091B–4609DE**, `asm-002.txt:25`, `asm-003.txt`, `asm-004.txt`,
   `asm-005.txt:1–3`: three row dot products with nine signed WORD coefficients;
   three identical bias/spill/low-word conversion sequences.
4. **4608F9–460915 and 4609FB–460A15**, `asm-002.txt:16–24`,
   `asm-005.txt:12–20`: bit19-controlled scaling and independently selected
   optional DWORD translation/addend triple.
5. **460A1F–460AED**, `asm-005.txt:22–25`, `asm-006.txt`–`asm-008.txt`:
   signed [-32768,32767] clamp, distinct status masks and full DWORD outputs.
6. **Call sites 4607D5/E5/F5, 460805/815/825/835/845/855**,
   `metadata.json:170–224`, compaction lines 30–41: nine immediate-command
   wrappers vary bank/vector selectors while all set bit19. The wrapper fact
   is independently byte-validated by discovery, not revalidated by this author.

## Unknowns and validation requests

- Original source return type and whether callers consume EAX are not proved.
  Returning observed EAX preserves more evidence than declaring `void`.
- Incoming x87 control word, stack occupancy and exception policy are external.
  No universal nearest-rounding assumption or default-CW claim is made.
- Business names for individual banks, global allocation types, the complete
  caller graph and runtime state are not established by this packet.
- Status 0x00400000 for third-component overflow does **not** acquire the high
  summary bit by analogy with other components. The surprising asymmetry stays.
- This is target-specific C with an exact x87 island, not a pure-C replacement.
  If a pure-C-only artifact is required, the lead must supply an explicit x87
  environment contract or separately authorize a verified x87 implementation.
- **Not executed:** compilation, syntax check, disassembly comparison, runtime
  tests, native differential, input/output hashing by this author. No PASS claim.
  Lead review should check MS inline-asm acceptance, parameter home persistence,
  nonvolatile-register preservation, emitted absence of FP reassociation/helpers,
  signed boundary cases, wraparound additions and each allowed x87 PC/RC mode.
