# C A — g17 / 0x00506690

Task: `task_mv44si5y_00bq_fbrytp`. Author: `pool-213`, OpenAI GPT-6 Astra,
assigned variant `high`. Independent C production, not reconciliation, semantic
approval, integration, or a test result.

## Frozen inputs and scope

Only the supplied g17 factual compaction and this target's readable projection
were used for this production. No peer production, previous target C, target
ledger, results index, IDB, or other session was consulted.

Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g17/`.

- `0x506690.readable/manifest.json:2–7`: original packet
  `0x506690.json`, SHA-256
  `a06164a315f2bbd28ca6608c24aeacb164898dd4b1565e7cb495a84e9acbe6e6`;
  compaction SHA-256
  `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.
- `0x506690.readable/metadata.json:4–10`: 32-bit FF8_EN.exe, executable
  SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`,
  export time `2026-10-11T16:38:25.140966+00:00`.
- Complete target ASM: `asm-001.txt` through `asm-006.txt`, 25 lines each,
  and `asm-007.txt:1–4`: 154 instructions.
- Complete chunk bytes: `bytes-001.txt:1–15`, 451 bytes, half-open interval
  `[0x00506690, 0x00506853)`. Manifest file hash:
  `8deeb2f3a336360159718b858f229fa27fd63aebc4f984b7debd58c66ad09e93`.
- CFG: `metadata.json:11–220`, all 28 blocks.
- `common-compaction.md:12,17–21,27,34,38` supplies factual context and expressly
  identifies missing helper bodies. Native names and semicolon comments are
  historical annotations, not evidence for the C below.

Hashes above are **cited from the manifest**, not independently recomputed.

## Representation and ABI boundary

The function below is a complete conventional caller-cleanup C reconstruction
of the target, including the raw outgoing EAX value. `u32` return types on the
opaque bindings mean **capture the complete physical EAX**, not “this helper
has a proven unsigned-C return contract.” In particular, this file does not
assert a useful source-level return value for 0x506690.

Only the 14 byte-proven direct call targets are external functions. Their
parameters describe the DWORD stack slots explicitly prepared at these call
sites, in callee argument order; no callee implementation or library operation
is invented. The callback at 0x506860 is passed as an address, not called here.
Linking these address-named bindings is integration work, not implemented here.

The C assumes the usual 32-bit caller-cleanup ABI: EBX/ESI/EDI/EBP preserved by
the opaque calls; no hidden register inputs or access to older pending argument
slots. The target itself saves EBX/ESI/EDI and uses plain RET. The supplied
packet establishes stack observations, not all callee prototypes. See the
exact pending-argument accounting and explicit limitations below.

Addresses are 32-bit integers, not host-sized structure pointers. Loads are
little-endian, unaligned-safe byte compositions with ordered volatile accesses;
there is no strict-aliasing or unaligned typed-load assumption. These local
helpers are C notation, not new FF8 callees. This representation assumes valid
ordinary mapped RAM and no concurrent observer requiring atomic WORD/DWORD
accesses or exact fault granularity; it is not an MMIO/exception-level emulator.

## Complete C

```c
#include <stdint.h>
#include <limits.h>

typedef uint8_t  u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef uint64_t u64;
typedef uint32_t a32;

_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(u16) == 2 && sizeof(u32) == 4,
               "16/32-bit widths required");
_Static_assert(sizeof(void *) == 4,
               "native-address bindings require a 32-bit target");

#if defined(_MSC_VER)
# define FF8_CDECL __cdecl
#elif defined(__i386__) && (defined(__GNUC__) || defined(__clang__))
# define FF8_CDECL __attribute__((cdecl))
#else
# define FF8_CDECL
#endif

/* Opaque native bindings: raw EAX results; arguments are observed DWORD slots. */
extern u32 FF8_CDECL sub_00493D80(a32 a0);
extern u32 FF8_CDECL sub_0050E510(u32 a0);
extern u32 FF8_CDECL sub_00506B50(a32 a0, u32 a1, u32 a2);
extern u32 FF8_CDECL sub_00508360(a32 a0, a32 a1);
extern u32 FF8_CDECL sub_00570F20(a32 a0, a32 a1);
extern u32 FF8_CDECL sub_0050C090(a32 a0, u32 a1);
extern u32 FF8_CDECL sub_005017A0(u32 a0, u32 a1, a32 a2);
extern u32 FF8_CDECL sub_00506620(a32 a0, u32 a1);
extern u32 FF8_CDECL sub_00509C80(a32 a0);
extern u32 FF8_CDECL sub_005712C0(u32 a0, u32 a1, u32 a2, u32 a3);
extern u32 FF8_CDECL sub_00571050(a32 a0, u32 a1);
extern u32 FF8_CDECL sub_005065B0(a32 a0);
extern u32 FF8_CDECL sub_005068B0(a32 a0);
extern u32 FF8_CDECL sub_0050A070(a32 a0, u32 a1, u32 a2);

static inline u8 rd8(a32 a)
{
    return *(volatile const u8 *)(uintptr_t)a;
}

static inline u16 rd16le(a32 a)
{
    u32 b0 = rd8(a);
    u32 b1 = rd8(a + UINT32_C(1));
    return (u16)(b0 | (b1 << 8));
}

static inline u32 rd32le(a32 a)
{
    u32 b0 = rd8(a);
    u32 b1 = rd8(a + UINT32_C(1));
    u32 b2 = rd8(a + UINT32_C(2));
    u32 b3 = rd8(a + UINT32_C(3));
    return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
}

static inline void wr8(a32 a, u8 v)
{
    *(volatile u8 *)(uintptr_t)a = v;
}

static inline void wr32le(a32 a, u32 v)
{
    wr8(a,                  (u8)v);
    wr8(a + UINT32_C(1),     (u8)(v >> 8));
    wr8(a + UINT32_C(2),     (u8)(v >> 16));
    wr8(a + UINT32_C(3),     (u8)(v >> 24));
}

/* Partial-register writes, preserving exactly the other EAX bits. */
static inline u32 put_al(u32 old_eax, u8 al)
{
    return (old_eax & UINT32_C(0xFFFFFF00)) | (u32)al;
}

static inline u32 put_ax(u32 old_eax, u16 ax)
{
    return (old_eax & UINT32_C(0xFFFF0000)) | (u32)ax;
}

/* Signed interpretation without implementation-defined u32 -> int32 casts. */
static inline int64_t sx32(u32 bits)
{
    return (int64_t)bits -
           ((bits & UINT32_C(0x80000000)) ? INT64_C(4294967296) : 0);
}

/* Exact SAR r32,7, expressed using only unsigned C shifts. */
static inline u32 sar7(u32 bits)
{
    return (bits >> 7) |
           ((bits & UINT32_C(0x80000000)) ? UINT32_C(0xFE000000) : 0);
}

/*
 * Raw-EAX reconstruction of 0x00506690.
 * event_addr is the DWORD originally at [entry_esp + 4].
 */
u32 FF8_CDECL sub_00506690(a32 event_addr)
{
    const a32 ACTORS = UINT32_C(0x01D972C0);
    const a32 FLAGS  = UINT32_C(0x01D96A9C);
    const a32 esi = event_addr;
    a32 edi;
    u32 eax, ebx, ecx, edx;

    /* 506690–5066AB: index is captured BEFORE the first opaque call. */
    eax = (u32)rd8(esi);             /* XOR EAX,EAX; MOV AL,[ESI] */
    ecx = eax + eax * UINT32_C(4);
    ecx <<= 3;
    ecx -= eax;
    edi = ACTORS + ecx * UINT32_C(4); /* ACTORS + 0x9C * initial byte */
    eax = sub_00493D80(esi);

    /* 5066B0–5066D7: these reads occur after the call, not before it. */
    eax = put_al(eax, rd8(edi + UINT32_C(4)));
    if ((u8)eax == UINT8_C(0x8C))
        eax = sub_0050E510(UINT32_C(3));

    eax = put_ax(eax, rd16le(edi));
    if ((eax & UINT32_C(2)) == 0)
        return eax;
    if ((eax & UINT32_C(0x10)) != 0)
        return eax;

    eax = put_ax(eax, rd16le(esi + UINT32_C(4)));

    /* 5066DB–5066EE: retain the native short-circuit/dereference order. */
    if ((eax & UINT32_C(4)) != 0 &&
        (rd8(edi + UINT32_C(8)) & UINT32_C(0x1A)) == 0 &&
        ((edx = rd32le(edi + UINT32_C(0x74))),
         (rd16le(edx + UINT32_C(0x2C)) & UINT32_C(0x140)) == 0)) {

        /* 5066F0–5066FD: clear bit 2 only on this path. */
        ecx = rd32le(esi + UINT32_C(8));
        eax &= UINT32_C(0xFFFF);
        eax = put_al(eax, (u8)((u8)eax & UINT8_C(0xFB)));
        eax = sub_00506B50(edi, eax, ecx);

        /*
         * 506702–506727: one-operand signed IMUL, then wrapping ADD,
         * SAR 7, and logical-sign-bit correction. Do not replace this
         * with a reread of event[0], nor with a guessed signed division.
         */
        ecx = edi;
        eax = UINT32_C(0xD20D20D3);
        ecx -= ACTORS;
        {
            int64_t product = sx32(eax) * sx32(ecx);
            u64 product_bits = (u64)product;
            eax = (u32)product_bits;
            edx = (u32)(product_bits >> 32);
        }
        edx += ecx;
        edx = sar7(edx);
        eax = edx;
        ebx = edx;
        eax >>= 31;
        ebx += eax;

        /* 506729–506734: no null-result guard exists in the original. */
        eax = sub_00508360(UINT32_C(0x01D986A8), UINT32_C(0x00506860));
        wr8(eax + UINT32_C(0x0C), (u8)ebx);
    } else {
        /* 506736–506746: same WORD, but bit 2 is not cleared. */
        ecx = rd32le(esi + UINT32_C(8));
        eax &= UINT32_C(0xFFFF);
        eax = sub_00506B50(edi, eax, ecx);
    }

    /* 506749–50679C: test the event again after the preceding helpers. */
    if ((rd8(esi + UINT32_C(2)) & UINT32_C(0x40)) != 0) {
        eax = sub_00570F20(edi, UINT32_C(0x00B8B858));
        eax = sub_0050C090(edi, UINT32_C(7));
        ebx = edi + UINT32_C(0x1C);
        eax = sub_005017A0(UINT32_C(0x0D), UINT32_C(8), ebx);
        eax = sub_005017A0(UINT32_C(0x0E), UINT32_C(0x10), ebx);
    } else {
        if ((rd32le(esi + UINT32_C(8)) & UINT32_C(0x10000)) == 0) {
            edx = (u32)rd8(esi + UINT32_C(1)); /* XOR EDX; MOV DL */
            eax = sub_00506620(edi, edx);
        }
        eax = sub_00509C80(edi);
    }

    /* 50679F–5067C6: the global mask really is 0x10000000. */
    if ((rd32le(FLAGS) & UINT32_C(0x10000000)) != 0) {
        /* Separate memory read for native AND [global],0xEFFFFFFF. */
        wr32le(FLAGS, rd32le(FLAGS) & UINT32_C(0xEFFFFFFF));
    } else if ((rd8(esi + UINT32_C(3)) & UINT32_C(2)) != 0) {
        eax = sub_005712C0(UINT32_C(0), UINT32_C(1),
                           UINT32_C(0), UINT32_C(0xFF));
    }

    /* 5067D0–5067F5: 0x10 -> 0x27; 0x20 -> 0x28; 0x30 -> 0x26. */
    eax = put_al(eax, rd8(esi + UINT32_C(2)));
    eax &= UINT32_C(0x30);
    switch (eax) {
    case UINT32_C(0x10):
        eax = sub_00571050(edi, UINT32_C(0x27));
        break;
    case UINT32_C(0x20):
        eax = sub_00571050(edi, UINT32_C(0x28));
        break;
    case UINT32_C(0x30):
        eax = sub_00571050(edi, UINT32_C(0x26));
        break;
    default:
        break;
    }

    /* 5067F8–50680F: second-byte index is read AFTER both helpers. */
    eax = sub_005065B0(esi);
    eax = sub_005068B0(esi);
    eax = put_al(eax, rd8(esi + UINT32_C(0x0C)));
    ebx = esi + UINT32_C(0x0C);
    if ((u8)eax == UINT8_C(0xFF))
        return eax; /* Preserve the previous helper's high 24 EAX bits. */

    /* 506811–50682F: AND EAX,FF makes the later MOV AX zero-extending. */
    eax &= UINT32_C(0xFF);
    edx = rd32le(esi + UINT32_C(0x14));
    ecx = eax + eax * UINT32_C(4);
    ecx <<= 3;
    ecx -= eax;
    eax = put_ax(eax, rd16le(esi + UINT32_C(0x10)));
    edi = ACTORS + ecx * UINT32_C(4);
    eax = sub_0050A070(edi, eax, edx);

    /* 506834–506847: there is no second actor flag gate here. */
    ecx = (u32)rd8(esi + UINT32_C(0x0D)); /* XOR ECX; MOV CL */
    eax = sub_00506620(edi, ecx);
    eax = sub_00509C80(edi);
    eax = sub_005068B0(ebx);

    /* 50684C–506852: caller cleanup; restore EDI/ESI/EBX; plain RET. */
    return eax;
}
```

## Native call and stack accounting

The numeric destinations below were recalculated from the raw `E8 rel32` bytes,
not from the labels. There are 19 call instructions and 14 distinct targets.
Arguments below are the explicit newly prepared DWORD slots, first argument
first. “Actor” means the retained EDI value, not a semantic struct declaration.

| CALL EA | Destination | Observed arguments |
|---|---|---|
| 5066AB | 493D80 | event |
| 5066BC | 50E510 | 3 |
| 5066FD / 506741 | 506B50 | actor, zero-extended event WORD +4 (bit 2 cleared only at 5066FD), event DWORD +8 |
| 506729 | 508360 | address 1D986A8, callback address 506860 |
| 506755 | 570F20 | actor, address B8B858 |
| 50675D | 50C090 | actor, 7 |
| 50676A / 506774 | 5017A0 | (0D,8,actor+1C) / (0E,10,actor+1C) |
| 50678E | 506620 | actor, zero-extended event BYTE +1 |
| 506797 | 509C80 | actor |
| 5067BC | 5712C0 | 0,1,0,FF |
| 5067F0 | 571050 | actor, 27/28/26 for masked event BYTE +2 values 10/20/30 |
| 5067F9 | 5065B0 | event |
| 5067FF | 5068B0 | event |
| 50682F | 50A070 | second actor, zero-extended event WORD +10, event DWORD +14 |
| 50683B | 506620 | second actor, zero-extended event BYTE +0D |
| 506841 | 509C80 | second actor |
| 506847 | 5068B0 | event+0C |

Let S be ESP at function entry, before saving registers. The argument is at
`[S+4]`; the persistent body stack level is P = S−12 after saving EBX/ESI/EDI.
There is no local-frame allocation. Each CALL also pushes its return address;
the following depths describe the argument area after the callee returns.

- `5066AB`, optional `5066BC`: one slot each; immediate `ADD ESP,4`.
- Special branch: three slots for `5066FD` remain pending. Two more slots are
  pushed for `506729`. `50672E ADD ESP,14h` removes all five. The older three
  slots are physically beyond the two new arguments at the second callee.
- Other branch: `506746 ADD ESP,0Ch` removes three slots.
- Bit-40 branch: calls `506755/50675D/50676A/506774` accumulate 2+2+3+3 slots;
  `506779 ADD ESP,28h` returns to P. They are not ten arguments to one helper.
- `50678E`: two slots, `ADD ESP,8`; `506797`: one, `ADD ESP,4`.
- `5067BC`: four slots, `ADD ESP,10h`; `5067F0`: two, `ADD ESP,8`.
- `5067F9/5067FF`: one slot each, both removed by `50680A ADD ESP,8`.
- `50682F/50683B/506841/506847`: 3+2+1+1 pending slots, removed by
  `50684C ADD ESP,1Ch`.
- Every exit reaches P, then pops EDI/ESI/EBX and executes RET. The caller's
  one explicit input slot is not callee-popped. Maximum pending argument area
  is 40 bytes, in addition to 12 bytes of register saves and CALL's return slot.

The C intentionally does not force a compiler to retain those older, nominally
dead argument slots. Exact stack layout to an inspecting/nonstandard helper
therefore remains an ABI validation requirement, not an asserted equivalence.

## Width, ordering, and uncertainty audit

1. **Pre-call actor selection and later reloads.** `506696–5066A4` uses a
   zero-extended BYTE index and DWORD arithmetic for `1D972C0 + 0x9C*index`.
   `5066AB` always executes, even when the subsequent actor gates return.
   Actor BYTE +4 is read after that call; actor WORD +0 after the optional
   `50E510(3)`. These values must not be hoisted or cached across helpers.
2. **AX is not EAX.** `5066C4` overwrites only AX; both early returns retain
   EAX[31:16] from the preceding helper. `5066D7` also writes only AX, but both
   paths mask EAX with FFFF before passing it. The special path additionally
   executes `AND AL,FB`, without changing the stored input WORD.
3. **Pointer-dependent gate.** `5066DF–5066EE` reads actor BYTE +8 mask 1A,
   then only if needed actor DWORD +74 and WORD `[that pointer+2C]` mask 140.
   No null check or fallback exists. The subsequent returned-node BYTE +0C
   write at `506731` likewise has no null guard.
4. **Exact signed multiply sequence.** Bytes at `506704` are
   `B8 D3 20 0D D2`; `506714` is `F7 E9` (one-operand signed IMUL ECX).
   Product fits int64_t for any signed 32-bit operands. EDX high-half extraction,
   wrapping `ADD EDX,ECX`, `SAR EDX,7`, `SHR EAX,31`, and wrapping
   `ADD EBX,EAX` are all retained. No C signed overflow, negative signed shift,
   or guessed division is used. The stored result is BL only. The saved actor
   pointer, not a possibly mutated event BYTE +0, is the source of this index.
5. **Global operation and exclusion.** `50679F` bytes encode mask 10000000;
   `5067C6` encodes EFFFFFFF. The clear branch excludes the four-argument call,
   regardless of event BYTE +3. The C performs a fresh global read for the
   read-modify-write, distinct from the preceding TEST.
6. **Post-helper byte checks.** `5067D0` reloads event BYTE +2 after the
   preceding calls. `506804` reloads event BYTE +0C after `5068B0(event)`.
   On the FF sentinel exit, only AL was replaced: high 24 EAX bits survive.
   On the continuing path, `506811 AND EAX,FF` clears all high bits; therefore
   `506822 MOV AX,[ESI+10h]` followed by PUSH EAX passes a zero-extended WORD,
   not a signed WORD and not a contaminated full-register value.
7. **Second portion.** The second actor is indexed independently by the new
   BYTE +0C, with no repeat of the primary actor gates. WORD +10 and DWORD +14
   are sampled before `50A070`; BYTE +0D is sampled after it. Final helper
   argument is the retained address `event+0C`, not the original event.
8. **Storage claims are bounded.** Event reads reach byte +17 hex, consistent
   with an accessible 0x18-byte record on the continuing path. No full C struct,
   array cardinality, index validity, helper purpose, HP/status effect, or
   callback body is inferred. Native accesses are kept even for invalid input;
   no bounds checks, null checks, or “repairs” were added.

Assumptions requiring lead/reviewer validation: opaque helper ABI/returns,
preservation of nonvolatile registers, absence of hidden register/extra-stack
arguments, aliasing effects implemented by the native bindings, valid memory,
and absence of asynchronous/MMIO/fault-width requirements. Final EFLAGS and
caller-volatile ECX/EDX are not exposed by this conventional C ABI model; EAX
is exposed explicitly because it differs observably across exits. These are
not silently promoted to proven interface contracts.

## Complete CFG coverage

All intervals below are half-open and correspond to `metadata.json:11–220`.

| Native blocks | C location |
|---|---|
| 506690–5066BA; 5066BA–5066C4 | initial index/call, optional call with 3 |
| 5066C4–5066CF; 5066CF–5066D7 | separate early actor-bit exits |
| 5066D7–5066DF; 5066DF–5066E5; 5066E5–5066F0 | ordered three-part gate |
| 5066F0–506736; 506736–506749 | two 506B50 paths; multiply/register/write path |
| 506749–50674F; 50674F–50677E | event bit 40 and four-call arm |
| 50677E–506787; 506787–506796; 506796–50679F | alternative optional 506620, then 509C80 |
| 50679F–5067AB; 5067AB–5067B1; 5067B1–5067C6; 5067C6–5067D0 | global/event exclusion and clear |
| 5067D0–5067DB; 5067DB–5067E0; 5067E0–5067E5 | masked selector comparisons |
| 5067E5–5067E9; 5067E9–5067ED; 5067ED–5067EF; 5067EF–5067F8 | exact selected immediates and common call |
| 5067F8–506811 | ordered helper pair, post-call sentinel read/exit |
| 506811–50684F | complete second-portion path, four calls |
| 50684F–506853 | shared stack restoration/RET, modeled by raw-EAX returns |

There are no uncovered chunks or indirect calls/jump tables in this target.
The 506860 callback address is external to the target chunk and remains opaque.

## Validation actually performed / not performed

Performed: read all 154 projected instructions, all 451 supplied chunk bytes,
and all 28 CFG blocks; static source-to-ASM control/data-flow audit; pure
in-session byte arithmetic confirming the chunk endpoint, all 19 E8 targets,
and selected immediate/partial-register/multiply encodings. No repository or
machine code was executed by that arithmetic check.

Not performed: compilation, linking, execution of this C or the native target,
unit/differential/live tests, callee-body ABI validation, independent SHA-256
recomputation, external review, or integration. Recommended separate validation
is branch-complete differential checking with helper stubs that deliberately
mutate event/actor/global memory and supply distinctive high EAX bits, plus
explicit callee/retained-stack ABI review. This is a request, **not PASS**.
