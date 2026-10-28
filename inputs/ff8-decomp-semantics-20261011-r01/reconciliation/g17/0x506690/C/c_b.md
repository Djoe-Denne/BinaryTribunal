# C B — 0x00506690

Independent producer: `pool-214`; task `task_mv44si5z_00br_5dw85o`.
This is a byte/ASM-derived C reconstruction, not a semantic-name proposal or an integration approval. No other production was consulted.

## Frozen input

- Packet: `inputs/ff8-decomp-semantics-20261011-r01/g17/0x506690.json`.
- Packet SHA-256, **as recorded in** `0x506690.readable/manifest.json:4`: `a06164a315f2bbd28ca6608c24aeacb164898dd4b1565e7cb495a84e9acbe6e6`.
- Common-compaction SHA-256, **as recorded in** that manifest: `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.
- Native input SHA-256, quoted from packet metadata: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; 32-bit; export `2026-10-11T16:38:25.140966+00:00`.
- Read all seven `0x506690.readable/asm-*.txt` parts (154 instructions), all of `bytes-001.txt`, and all 28 CFG entries in `metadata.json:11–220`. One chunk: `[0x00506690,0x00506853)`, 451 bytes. No jump table or detached chunk is needed by this target.
- Hashes above are provenance citations, not newly computed file-hash checks. Historical names and instruction comments were not used to establish helper purposes.

## Representation and ABI boundary

The C below is a **32-bit MSVC/x86 native-address reconstruction**. Its argument is the DWORD at entry `[ESP+4]`, represented as a 32-bit address. Original entry saves EBX, ESI, EDI and uses plain `RET`. The C result is the **raw final EAX bit pattern**, not a claim that the original source declared a value return. In particular, early exits do not return a Boolean, and a secondary-index sentinel exit preserves the preceding helper's upper 24 EAX bits.

`N1`–`N4` are local notation for calls to the actual absolute code addresses present in the chunk. They are not additional game helpers. Their function-pointer types describe DWORD stack slots, caller cleanup, and capture of full EAX. They do **not** authenticate the original callees' source prototypes, signedness, or business-level returns. Callee bodies are intentionally not invented. The C assumes the ordinary x86 caller-cleanup ABI: EBX/ESI/EDI are preserved, ECX/EDX and flags are not hidden inputs, and callees do not inspect arguments below their documented slot span. The frozen target proves the pushes and cleanup, but not those opaque-callee properties. See the exact native stack audit below before integration.

Packed volatile 16-/32-bit overlays express native-width, possibly unaligned ordinary-memory accesses on the stated compiler/architecture. This is not portable ISO-C pointer code, an MMIO/concurrent-memory model, or a fault-equivalence claim. No bounds checks, allocation checks, or semantic structure layouts have been added. Numeric pointer arithmetic and all 32-bit additions/subtractions wrap modulo 2^32. The signed multiply and arithmetic shift are expressed without signed overflow or implementation-defined negative shifts.

## Complete C

```c
#include <stdint.h>
#include <limits.h>

#if !defined(_MSC_VER) || !defined(_M_IX86)
# error This reconstruction requires the MSVC 32-bit x86 ABI.
#endif

typedef char re_byte_is_8[(CHAR_BIT == 8) ? 1 : -1];
typedef char re_pointer_is_32[(sizeof(void *) == 4) ? 1 : -1];
typedef char re_u32_is_4[(sizeof(uint32_t) == 4) ? 1 : -1];

#pragma pack(push, 1)
struct re_u16_at { uint16_t value; };
struct re_u32_at { uint32_t value; };
#pragma pack(pop)

static __inline uint8_t rd8(uint32_t a)
{
    return *(volatile uint8_t *)(uintptr_t)a;
}

static __inline uint16_t rd16(uint32_t a)
{
    return ((volatile struct re_u16_at *)(uintptr_t)a)->value;
}

static __inline uint32_t rd32(uint32_t a)
{
    return ((volatile struct re_u32_at *)(uintptr_t)a)->value;
}

static __inline void wr8(uint32_t a, uint8_t v)
{
    *(volatile uint8_t *)(uintptr_t)a = v;
}

static __inline void wr32(uint32_t a, uint32_t v)
{
    ((volatile struct re_u32_at *)(uintptr_t)a)->value = v;
}

static __inline uint32_t with_al(uint32_t eax, uint8_t al)
{
    return (eax & UINT32_C(0xffffff00)) | (uint32_t)al;
}

static __inline uint32_t with_ax(uint32_t eax, uint16_t ax)
{
    return (eax & UINT32_C(0xffff0000)) | (uint32_t)ax;
}

/* Signed interpretation in a wider type; no out-of-range uint32->int32 cast. */
static __inline int64_t sx32(uint32_t x)
{
    return (x & UINT32_C(0x80000000))
        ? (int64_t)x - INT64_C(4294967296)
        : (int64_t)x;
}

/* High DWORD of the signed EDX:EAX product of two 32-bit bit patterns. */
static __inline uint32_t imul_hi32(uint32_t a, uint32_t b)
{
    int64_t product = sx32(a) * sx32(b); /* fits signed 64 bits */
    return (uint32_t)((uint64_t)product >> 32);
}

static __inline uint32_t sar7(uint32_t x)
{
    return (x >> 7) |
        ((x & UINT32_C(0x80000000)) ? UINT32_C(0xfe000000) : 0u);
}

/* Binary interfaces: each return captures full EAX, including residual bits. */
typedef uint32_t (__cdecl *raw1)(uint32_t);
typedef uint32_t (__cdecl *raw2)(uint32_t, uint32_t);
typedef uint32_t (__cdecl *raw3)(uint32_t, uint32_t, uint32_t);
typedef uint32_t (__cdecl *raw4)(uint32_t, uint32_t, uint32_t, uint32_t);

#define N1(ea, a) \
    (((raw1)(uintptr_t)(uint32_t)(ea))((uint32_t)(a)))
#define N2(ea, a, b) \
    (((raw2)(uintptr_t)(uint32_t)(ea))((uint32_t)(a), (uint32_t)(b)))
#define N3(ea, a, b, c) \
    (((raw3)(uintptr_t)(uint32_t)(ea)) \
        ((uint32_t)(a), (uint32_t)(b), (uint32_t)(c)))
#define N4(ea, a, b, c, d) \
    (((raw4)(uintptr_t)(uint32_t)(ea)) \
        ((uint32_t)(a), (uint32_t)(b), (uint32_t)(c), (uint32_t)(d)))

uint32_t __cdecl re_00506690(uint32_t event)
{
    const uint32_t base = UINT32_C(0x01d972c0);
    const uint32_t global_flags = UINT32_C(0x01d96a9c);
    uint32_t eax, ebx, ecx, edx, actor;

    /* 506690..5066A4: ESI=event; XOR EAX,EAX; MOV AL,[ESI].
       Capture this actor address BEFORE the first opaque call. */
    eax = (uint32_t)rd8(event);
    ecx = (eax + eax * 4u) << 3;
    ecx -= eax;
    actor = base + ecx * 4u;

    eax = N1(0x00493d80u, event);                /* 5066AB */
    eax = with_al(eax, rd8(actor + 4u));       /* 5066B0 */
    if ((eax & 0xffu) == 0x8cu) {
        eax = N1(0x0050e510u, 3u);            /* 5066BC */
    }

    /* 5066C4..5066D1: a single WORD load, then two AL tests. */
    eax = with_ax(eax, rd16(actor));
    if ((eax & 2u) == 0u)
        return eax;
    if ((eax & 0x10u) != 0u)
        return eax;

    eax = with_ax(eax, rd16(event + 4u));      /* 5066D7 */
    if ((eax & 4u) != 0u &&
        (rd8(actor + 8u) & 0x1au) == 0u &&
        (rd16(rd32(actor + 0x74u) + 0x2cu) & 0x140u) == 0u) {
        /* 5066F0..5066FD: AND EAX,FFFF; AND AL,FB. */
        ecx = rd32(event + 8u);
        eax &= 0xffffu;
        eax &= UINT32_C(0xfffffffb);
        eax = N3(0x00506b50u, actor, eax, ecx);

        /* 506702..506727: keep the actual signed multiply/shift sequence.
           The product's low DWORD is dead before MOV EAX,EDX at 506720. */
        ecx = actor;
        eax = UINT32_C(0xd20d20d3);
        ecx -= base;
        edx = imul_hi32(eax, ecx);
        edx += ecx;
        edx = sar7(edx);
        eax = edx;
        ebx = edx;
        eax >>= 31;
        ebx += eax;

        /* Native pushes callback first, list address second. No NULL gate. */
        eax = N2(0x00508360u, 0x01d986a8u, 0x00506860u); /* 506729 */
        wr8(eax + 0x0cu, (uint8_t)ebx);        /* 506731 */
    } else {
        /* 506736..506746: same three slots but mask 0x04 is not cleared. */
        ecx = rd32(event + 8u);
        eax &= 0xffffu;
        eax = N3(0x00506b50u, actor, eax, ecx); /* 506741 */
    }

    /* 506749: this BYTE is fetched after either 506B50 call. */
    if ((rd8(event + 2u) & 0x40u) != 0u) {
        eax = N2(0x00570f20u, actor, 0x00b8b858u); /* 506755 */
        eax = N2(0x0050c090u, actor, 7u);          /* 50675D */
        ebx = actor + 0x1cu;
        eax = N3(0x005017a0u, 0x0du, 8u, ebx);   /* 50676A */
        eax = N3(0x005017a0u, 0x0eu, 0x10u, ebx); /* 506774 */
        /* This arm skips the 506620/509C80 calls immediately below. */
    } else {
        if ((rd32(event + 8u) & 0x00010000u) == 0u) {
            edx = (uint32_t)rd8(event + 1u);       /* XOR EDX; MOV DL */
            eax = N2(0x00506620u, actor, edx);     /* 50678E */
        }
        eax = N1(0x00509c80u, actor);             /* 506797 */
    }

    /* 50679F..5067C6: two distinct DWORD accesses on the clear arm:
       TEST first, then the later read-modify-write AND. */
    if ((rd32(global_flags) & 0x10000000u) != 0u) {
        wr32(global_flags, rd32(global_flags) & UINT32_C(0xefffffff));
    } else if ((rd8(event + 3u) & 2u) != 0u) {
        eax = N4(0x005712c0u, 0u, 1u, 0u, 0xffu); /* 5067BC */
    }

    /* 5067D0..5067F5: AND EAX,30 discards every other EAX bit. */
    eax = with_al(eax, rd8(event + 2u));
    eax &= 0x30u;
    if (eax == 0x10u) {
        eax = N2(0x00571050u, actor, 0x27u);  /* 5067ED -> 5067F0 */
    } else if (eax == 0x20u) {
        eax = N2(0x00571050u, actor, 0x28u);  /* 5067E9 -> 5067F0 */
    } else if (eax == 0x30u) {
        eax = N2(0x00571050u, actor, 0x26u);  /* 5067E5 -> 5067F0 */
    }

    eax = N1(0x005065b0u, event);             /* 5067F9 */
    eax = N1(0x005068b0u, event);             /* 5067FF */
    eax = with_al(eax, rd8(event + 0x0cu));   /* 506804: after both calls */
    ebx = event + 0x0cu;                     /* 506807 */
    if ((eax & 0xffu) == 0xffu)              /* 50680D..50680F */
        return eax; /* high 24 bits from 5068B0; AL was replaced with FF */

    /* 506811..50682F: AND EAX,FF makes the later MOV AX a full,
       zero-extended WORD argument; upper 16 bits are proven zero here. */
    eax &= 0xffu;
    edx = rd32(event + 0x14u);
    ecx = (eax + eax * 4u) << 3;
    ecx -= eax;
    eax = with_ax(eax, rd16(event + 0x10u));
    actor = base + ecx * 4u;
    eax = N3(0x0050a070u, actor, eax, edx);

    ecx = (uint32_t)rd8(event + 0x0du);       /* 506834..506836 */
    eax = N2(0x00506620u, actor, ecx);        /* 50683B */
    eax = N1(0x00509c80u, actor);            /* 506841 */
    eax = N1(0x005068b0u, ebx);              /* 506847: event+0C */
    return eax; /* 50684F..506852: POP EDI,ESI,EBX; RET; no EAX rewrite */
}

#undef N1
#undef N2
#undef N3
#undef N4
```

## Native call and stack audit

`S` is ESP at target entry; `B=S-12` after the three saved registers. The following depths are **before CALL**, excluding the temporarily pushed return address. Argument lists are in callee order, nearest slot first. All 19 E8 displacement targets were independently calculated from the displayed bytes with unsigned address arithmetic; they match the packet's 14 unique `code_targets` (`metadata.json:1909–1924`). No library-call substitutions were made.

| CALL site | Target | DWORD argument slots | ESP before CALL / cleanup |
|---|---|---|---|
| 5066AB | 493D80 | event | B-4; +4 at 5066B3 |
| 5066BC | 50E510 | 3 | B-4; +4 at 5066C1 |
| 5066FD | 506B50 | actor, zero-extended event WORD+4 with bit 2 cleared, event DWORD+8 | B-12; retained |
| 506729 | 508360 | 1D986A8, 506860 | B-20; +20 at 50672E, including previous 3 slots |
| 506741 | 506B50 | actor, zero-extended event WORD+4 unchanged, event DWORD+8 | B-12; +12 at 506746 |
| 506755 | 570F20 | actor, B8B858 | B-8; retained |
| 50675D | 50C090 | actor, 7 | B-16; retained |
| 50676A | 5017A0 | 0D, 8, actor+1C | B-28; retained |
| 506774 | 5017A0 | 0E, 10, actor+1C | B-40; +40 at 506779 |
| 50678E | 506620 | actor, zero-extended event BYTE+1 | B-8; +8 at 506793 |
| 506797 | 509C80 | actor | B-4; +4 at 50679C |
| 5067BC | 5712C0 | 0, 1, 0, FF | B-16; +16 at 5067C1 |
| 5067F0 | 571050 | actor, selected 27/28/26 | B-8; +8 at 5067F5 |
| 5067F9 | 5065B0 | event | B-4; retained |
| 5067FF | 5068B0 | event | B-8; +8 at 50680A |
| 50682F | 50A070 | second actor, zero-extended event WORD+10, event DWORD+14 | B-12; retained |
| 50683B | 506620 | second actor, zero-extended event BYTE+0D | B-20; retained |
| 506841 | 509C80 | second actor | B-24; retained |
| 506847 | 5068B0 | event+0C | B-28; +28 at 50684C |

There are no allocated stack locals. All paths reach the epilogue at B; POP EDI/ESI/EBX returns ESP to S, and plain RET consumes only the return address. Maximum target-owned depth is 52 bytes below S before CALL, or 56 including that CALL's return address; callee-internal depth is unknown. The native grouped outgoing-slot retention is documented, **not reproduced as a guaranteed physical stack layout by compiling the C**. Exact native ESP values, unused caller-scratch register contents, and flags across opaque calls require an assembly bridge if a callee actually observes them.

## Coverage and instruction evidence

All 28 CFG starts are represented: `506690, 5066BA, 5066C4, 5066CF, 5066D7, 5066DF, 5066E5, 5066F0, 506736, 506749, 50674F, 50677E, 506787, 506796, 50679F, 5067AB, 5067B1, 5067C6, 5067D0, 5067DB, 5067E0, 5067E5, 5067E9, 5067ED, 5067EF, 5067F8, 506811, 50684F`.

- **Ordering and gating:** `asm-001.txt:4–25`, `506696–5066D7`: zero-extended BYTE index and `base+156*index` before 493D80; BYTE actor+4 and optional 50E510 after it; one WORD actor flags load gates the entire remaining function. Neither first call is inside those later gates.
- **Short-circuit reads and flag argument:** `asm-002.txt:1–14`, `asm-003.txt:6–12`: input WORD+4 bit 2, actor BYTE+8 mask 1A, then pointed WORD+2C mask 140; do not dereference actor+74 if earlier tests fail. Both call arms mask EAX to 16 bits; only the first clears AL bit 2.
- **Signed arithmetic and unchecked store:** `asm-002.txt:15–25`, `asm-003.txt:1–5`; bytes `F7 E9`, `03 D1`, `C1 FA 07`, `C1 E8 1F` establish signed one-operand multiply, wrapping ADD, SAR 7 and logical SHR 31. BYTE `[return_EAX+0C]=BL` is unconditional after 508360. There is no source-backed NULL guard.
- **Two mutually exclusive call paths:** `asm-003.txt:13–25`, `asm-004.txt:1–17`: BYTE event+2 bit 40 selects the four-call arm; otherwise DWORD event+8 bit 10000 suppresses only 506620, never the subsequent 509C80.
- **Global and selector widths:** `asm-004.txt:18–25`, `asm-005.txt:1–20`; absolute `1D96A9C` is DWORD, mask `10000000`, clear mask `EFFFFFFF`. Its set arm does not test event BYTE+3. The freshly reloaded event BYTE+2 selects `(10 -> 27), (20 -> 28), (30 -> 26)`; zero makes no 571050 call.
- **Second portion and partial registers:** `asm-005.txt:21–25`, `asm-006.txt:1–25`, `asm-007.txt`: reload event BYTE+0C after 5065B0 and 5068B0. A sentinel returns helper EAX with AL replaced by FF. Otherwise `AND EAX,FF` before `MOV AX,[ESI+10]` proves that the pushed second WORD is zero-extended, despite the partial-register instruction. The BYTE+0D is read only after 50A070 and zero-extended with XOR ECX/MOV CL. No repeated primary actor gates or primary 506B50 wrapper are inserted for the second portion.

## Uncertainties and validation boundary

1. Helpers are opaque; their purpose, true C prototypes, and side effects are not proven by their labels or historical comments. The explicit stack slots above and raw EAX transport are the local evidence. The native ABI preservation/no-hidden-input assumptions need lead validation against callee evidence before executable integration.
2. No bounded array, non-null node return, valid actor index, valid event storage, or non-aliasing relationship was proven. The reconstruction adds none. Pointers/fields are reloaded at the native sequence points; actor addresses remain captured where native EDI remains captured.
3. The memory overlays and absolute function-address calls are for a correctly mapped 32-bit process. They are not a standalone runnable host implementation. Function pointers, callbacks (`506860`) and data constants (`1D986A8`, `B8B858`) are not reimplemented or retyped as semantic structs.
4. C preserves the raw EAX exits but does not promise final EFLAGS or ECX/EDX as output, nor native stack addresses. No caller-level value-return contract was inferred from the incoming xref inventory.
5. Done: full target ASM/byte-fragment read, manual branch/width/stack mapping, and arithmetic verification of all 19 direct call destinations. Not done: independent file hashing, compilation, execution, differential tests, review/reconciliation, IDA access, integration, or §5.6 validation. These are lead-side validation needs, not PASS claims.
6. Administrative: the common guide was read. A direct read of the current mission CONTRACT was permission-denied; no alternate access was attempted. Its historical content is inherited factual context, not evidence of a fresh contract read. The guide's run01 correction treats task-text model mentions as historical; native admission-model readback remains the lead's responsibility.
