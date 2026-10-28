# C R — g17 / 0x00506690

## Result and admission

**RECONCILED, conditional on the explicit native ABI/memory boundary below.**
The complete C covers the supplied chunk and all 28 CFG blocks. No unresolved
A/B control-flow or value-flow conflict remains within that boundary. Exact
opaque-callee ABI, source return type and executable integration remain
**UNCERTAIN**. This deposit is not promotion or the lead's final native §5.6 gate.

- Mission: `ff8-decomp-semantics-20261011-r01`.
- Task: `task_mv44sib0_00bu_gjr7xw`; R: `pool-228`, fresh session
  `ses_ecf06b36dffeMgC8tcmpH9YUTI`.
- Parent admission attestation: persisted and observed
  `openai/gpt-6-astra / xhigh`, override 0, PASS. No worker API readback claimed.
- A: `pool-213`, `ses_ecf0f28c4ffefcGSgSV8OqMDDF`, manifest model
  `openai/gpt-6-astra / max`. A's introductory `high` is historical, not the
  admission authority.
- B: `pool-214`, `ses_ecf0ef4b6ffeylUDkiCf8ikcJF`, manifest model
  `openai/gpt-6-astra / xhigh`.
- Both author sessions independently inherit only the factual explorer
  `ses_ed41fc6c0ffeWZh5hkKIUXKy89`, exclusive boundary
  `msg_12be1cd49001BowbZIVfuXq4cy`. These **fork** fields are retained, not recast
  as fresh authors. Parent explicitly attests mission-authorized independence,
  no lead/peer-production inheritance, and receipt of both deposits before R.

### Frozen evidence

All paths in citations below are relative to the authorized projection:
`inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g17/0x506690/C/`.
Only this projection, common instructions and the parent's admission message
were used; no direct A/B output, ledger, index or prior-verdict source was
consulted. The incidental historical-status remark in `common-compaction.md:37`
is excluded from the reasoning and is not run01 evidence.

| Item | SHA-256 |
|---|---|
| R `manifest.json` (parent attestation) | `db0841dadb54fcd2ad1f321de108591e103afe94edd46c6cc067e580dcf38661` |
| Frozen `c_a.md` | `25e0535f61e6e6d88c696a53458c9574458bf016d731c79cce9567176f5756bf` |
| Frozen `c_b.md` | `36f87065374c6500de251f791bdb209c05c9aa555f0a168460df1b2b95b33988` |
| Original packet `0x506690.json` | `a06164a315f2bbd28ca6608c24aeacb164898dd4b1565e7cb495a84e9acbe6e6` |
| `common-compaction.md` | `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c` |
| `native-manifest.json` | `f4e352725018a99049fd60ab8275f969a756c2b640ddc43058a729d0579c4c68` |
| `native-bytes-001.txt` | `8deeb2f3a336360159718b858f229fa27fd63aebc4f984b7debd58c66ad09e93` |
| `native-metadata.json` | `04af2f3cea0fbf37a3576fc9b3b159052ba275b1bc34312e7bbf67490b630e75` |
| FF8_EN.exe input | `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` |

The parent attests size/hash validation of all 14 projected files. Hash strings,
authors and native projection mappings agree between the admission message and
the two manifests; **no independent worker file-hash computation is claimed**.
Native export: 32-bit, `2026-10-11T16:38:25.140966+00:00`.
`native-asm-001.txt` through `native-asm-007.txt` supply 154 instructions;
`native-bytes-001.txt:1–15` supplies all 451 bytes of
`[0x00506690,0x00506853)`. The readable projection is the manifest-declared
verbatim evidence; the duplicate long packet body was not needed.

## A/B divergence decisions

Agreement is not treated as evidence. Both candidates were compared to the
complete ASM, chunk bytes and CFG. Historical helper names/comments are labels,
not proof of helper purposes or prototypes.

| Issue | A | B | R decision and native reason |
|---|---|---|---|
| Memory access representation | Composes WORD/DWORD from volatile BYTE reads; splits DWORD store into four BYTE writes (`c_a.md:104–136`). | Packed volatile WORD/DWORD accesses on MSVC x86 (`c_b.md:37–65`). | Select B's native-width notation. `66 8B 07` at 5066C4 is one WORD load; `8B 4E 08` at 5066F0 is one DWORD load; `81 25 9C 6A D9 01 FF FF FF EF` at 5067C6 is a DWORD memory AND, not four BYTE stores. A is equal only under its ordinary-RAM/no-observer/no-fault assumptions; it is not width-faithful outside them. R still makes no MMIO/concurrency/fault-equivalence claim. |
| Native call binding | Fourteen address-named external declarations. | Absolute-address function-pointer calls with one to four DWORD slots. | Keep B's explicit numeric call bindings. All 19 E8 destinations independently resolve to the 14 listed addresses; source-symbol linkage is not evidence. Neither representation authenticates the callees' original C types. |
| Signed multiply low half | Assigns both product halves (`c_a.md:216–221`). | Retains only high half (`c_b.md:153–159`). | B's dead-result omission is valid: `IMUL ECX` at 506714 writes EDX:EAX, then `MOV EAX,EDX` at 506720 overwrites the low half before use. Flags from IMUL are not consumed. Keep signed high-half, wrapping ADD and explicit SAR. |
| Clear input bit 2 | `put_al(eax, AL & FB)`. | `eax &= FFFFFFFB`. | Equivalent here: preceding `AND EAX,FFFF` at 5066F3 proves upper 16 bits zero; both clear only bit 2. R uses B's mask. No input-memory write is introduced. |
| Three-way selector syntax | `switch`. | `if/else if`. | Equivalent. Bytes at 5067D3–5067EF prove mask 30 and mapping 10→27, 20→28, 30→26; zero skips the call. R uses B's comparisons. |
| Raw EAX, gates, reloads, call order, stack accounting | Same substantive account. | Same substantive account. | Retain only after the independent checks below. No semantic vote or averaging is used. |

### Common-error search and convergences established from instructions

1. **First call is unconditional, first actor is captured beforehand.**
   `native-asm-001.txt:3–12` / 506692–5066AB: `[entry_ESP+4]` is the input;
   `XOR EAX,EAX; MOV AL,[ESI]` zero-extends its first BYTE. Arithmetic gives
   `01D972C0 + 0x9C*byte`. 493D80 runs before actor BYTE +4 and WORD +0 are
   read. Neither author hoists those reads or moves the call inside the gates.
   There is no first-index FF sentinel check or array bound check.
2. **Partial registers affect returns.** `66 8B 07` at 5066C4 replaces AX,
   not EAX. The exits at 5066C9/5066D1 preserve helper-derived high 16 bits.
   `8A 46 0C` at 506804 replaces AL after 5068B0; sentinel FF preserves its
   high 24 bits. A Boolean/zero/void-return substitution is not justified.
3. **Short-circuit pointer access and WORD argument.** 5066D7–5066EE reads
   WORD event+4, then conditionally BYTE actor+8, then DWORD actor+74 and
   WORD pointed+2C. The last dereference is suppressed by either earlier failed
   test. Both 506B50 paths explicitly mask EAX with FFFF; only 5066FD's
   path clears bit 2. Neither path writes that WORD back to the event.
4. **Native signed arithmetic, with a bounded reachable input range.**
   `B8 D3 20 0D D2`, `F7 E9`, `03 D1`, `C1 FA 07`, `C1 E8 1F` at
   506704–506724 prove the exact multiply-high/add/SAR/sign-correction sequence.
   R checked all 256 possible captured BYTE indices: the result equals that
   original index when EDI is ABI-preserved. It is not a later reload of event[0].
   `88 58 0C` at 506731 stores BL, not EBX, to returned EAX+0C with no null check.
5. **Mutually exclusive call paths.** Event BYTE+2 bit 40 selects the four-call
   path at 50674F–506779 and skips 506620/509C80. Otherwise DWORD event+8 bit
   10000 suppresses only 506620; 509C80 still executes. Evidence:
   `native-asm-003.txt:13–25`, `native-asm-004.txt:1–17`.
6. **Global and selector reloads.** 50679F tests DWORD 01D96A9C bit 10000000.
   Its set arm clears the bit using a new memory RMW and excludes even the
   event+3 test/call. The clear arm conditionally calls 5712C0(0,1,0,FF).
   BYTE event+2 is subsequently reloaded at 5067D0. Both authors preserve
   these exclusions/reloads, rather than reuse earlier event/global values.
7. **Second portion is not a recursive repeat of the first.** After both calls
   at 5067F9/5067FF, BYTE event+0C is reloaded and FF tested. Continuing
   `AND EAX,FF` at 506811 makes the later `MOV AX,[ESI+10]` a zero-extended
   WORD argument in full EAX. DWORD +14 is read before WORD +10, BYTE +0D is
   read after 50A070, and the final call uses event+0C. There is no repeated
   actor gate, initial 493D80 call or 506B50 wrapper in this part.
8. **Shared ABI limitation, not established correctness.** Both candidates
   model only newly pushed argument slots as the callees' arguments. Native
   cleanup is often grouped, so earlier slots remain physically accessible.
   Both disclose this, but agreement cannot prove those slots, caller-scratch
   registers or flags are unused. R keeps this boundary **UNCERTAIN** rather
   than asserting an exact executable replacement. Incoming xrefs, e.g.
   506BB4, 50A6A0 and 50A6C6 (`native-metadata.json:221–239`), do not include
   post-call instructions establishing a source return type.

## Complete reconciled C

This is MSVC **32-bit x86 native-address C**, not portable host C or a standalone
program. Packed volatile overlays express the observed access widths in ordinary
little-endian mapped RAM; there is no promise of exact instruction lowering,
memory-RMW indivisibility, fault behavior or inter-thread observation. All
address arithmetic is unsigned 32-bit modulo arithmetic; packed overlay and
integer-to-function-pointer behavior are platform-specific.

`N1`–`N4` are notation for the actual numeric callees, not invented game helpers.
Their types state the observed new DWORD slots and request raw EAX transport;
they do **not** prove source prototypes or meaningful helper returns. The model
assumes ordinary caller cleanup and preserved EBX/ESI/EDI/EBP; no hidden
register/flag/older-slot inputs or access to the caller's stack frame. The lead
must validate those assumptions or supply a native bridge before integration.
The returned DWORD represents physical outgoing EAX, not a semantic return type.

```c
#include <stdint.h>
#include <limits.h>

#if !defined(_MSC_VER) || !defined(_M_IX86)
# error This reconstruction requires the MSVC 32-bit x86 ABI.
#endif

typedef char re_char8[(CHAR_BIT == 8) ? 1 : -1];
typedef char re_ptr32[(sizeof(void *) == 4) ? 1 : -1];
typedef char re_word16[(sizeof(uint16_t) == 2) ? 1 : -1];
typedef char re_dword32[(sizeof(uint32_t) == 4) ? 1 : -1];

#pragma pack(push, 1)
struct re_word_at  { uint16_t value; };
struct re_dword_at { uint32_t value; };
#pragma pack(pop)

static __inline uint8_t rd8(uint32_t address)
{
    return *(volatile const uint8_t *)(uintptr_t)address;
}

static __inline uint16_t rd16(uint32_t address)
{
    return ((volatile const struct re_word_at *)(uintptr_t)address)->value;
}

static __inline uint32_t rd32(uint32_t address)
{
    return ((volatile const struct re_dword_at *)(uintptr_t)address)->value;
}

static __inline void wr8(uint32_t address, uint8_t value)
{
    *(volatile uint8_t *)(uintptr_t)address = value;
}

static __inline void wr32(uint32_t address, uint32_t value)
{
    ((volatile struct re_dword_at *)(uintptr_t)address)->value = value;
}

static __inline uint32_t put_al(uint32_t eax, uint8_t al)
{
    return (eax & UINT32_C(0xffffff00)) | (uint32_t)al;
}

static __inline uint32_t put_ax(uint32_t eax, uint16_t ax)
{
    return (eax & UINT32_C(0xffff0000)) | (uint32_t)ax;
}

static __inline int64_t sx32(uint32_t bits)
{
    return (int64_t)bits - ((bits & UINT32_C(0x80000000))
        ? INT64_C(4294967296) : INT64_C(0));
}

static __inline uint32_t imul_hi32(uint32_t a, uint32_t b)
{
    int64_t product = sx32(a) * sx32(b); /* Fits int64_t for any two s32. */
    return (uint32_t)((uint64_t)product >> 32);
}

static __inline uint32_t sar7(uint32_t bits)
{
    return (bits >> 7) | ((bits & UINT32_C(0x80000000))
        ? UINT32_C(0xfe000000) : UINT32_C(0));
}

/* Observed DWORD slots; raw EAX capture, not authenticated source prototypes. */
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

uint32_t __cdecl re_00506690(uint32_t event_addr)
{
    const uint32_t base = UINT32_C(0x01d972c0);
    const uint32_t flags = UINT32_C(0x01d96a9c);
    uint32_t eax, ebx, ecx, edx, actor;

    /* 506690..5066AB: ESI is the argument; capture actor before the call. */
    eax = (uint32_t)rd8(event_addr);
    ecx = (eax + eax * 4u) << 3;
    ecx -= eax;
    actor = base + ecx * 4u;
    eax = N1(0x00493d80u, event_addr);

    /* 5066B0..5066D1: each read stays after the preceding opaque call. */
    eax = put_al(eax, rd8(actor + 4u));
    if ((eax & 0xffu) == 0x8cu)
        eax = N1(0x0050e510u, 3u);
    eax = put_ax(eax, rd16(actor));
    if ((eax & 2u) == 0u)
        return eax;
    if ((eax & 0x10u) != 0u)
        return eax;

    /* 5066D7..5066EE: ordered, short-circuit memory accesses. */
    eax = put_ax(eax, rd16(event_addr + 4u));
    if ((eax & 4u) != 0u &&
        (rd8(actor + 8u) & 0x1au) == 0u &&
        (rd16(rd32(actor + 0x74u) + 0x2cu) & 0x140u) == 0u) {
        /* 5066F0..5066FD: only the passed WORD-derived value loses bit 2. */
        ecx = rd32(event_addr + 8u);
        eax &= 0xffffu;
        eax &= UINT32_C(0xfffffffb);
        eax = N3(0x00506b50u, actor, eax, ecx);

        /* 506702..506727: exact signed high-half and wrapping arithmetic. */
        ecx = actor;
        eax = UINT32_C(0xd20d20d3);
        ecx -= base;
        edx = imul_hi32(eax, ecx); /* Product low half overwritten at 506720. */
        edx += ecx;
        edx = sar7(edx);
        eax = edx;
        ebx = edx;
        eax >>= 31;
        ebx += eax;

        /* 506729..506734: list then callback in callee argument order. */
        eax = N2(0x00508360u, 0x01d986a8u, 0x00506860u);
        wr8(eax + 0x0cu, (uint8_t)ebx); /* No null-result check exists. */
    } else {
        /* 506736..506746: same WORD value, without clearing bit 2. */
        ecx = rd32(event_addr + 8u);
        eax &= 0xffffu;
        eax = N3(0x00506b50u, actor, eax, ecx);
    }

    /* 506749..50679C: reload event byte after either preceding call path. */
    if ((rd8(event_addr + 2u) & 0x40u) != 0u) {
        eax = N2(0x00570f20u, actor, 0x00b8b858u);
        eax = N2(0x0050c090u, actor, 7u);
        ebx = actor + 0x1cu;
        eax = N3(0x005017a0u, 0x0du, 8u, ebx);
        eax = N3(0x005017a0u, 0x0eu, 0x10u, ebx);
    } else {
        if ((rd32(event_addr + 8u) & 0x00010000u) == 0u) {
            edx = (uint32_t)rd8(event_addr + 1u);
            eax = N2(0x00506620u, actor, edx);
        }
        eax = N1(0x00509c80u, actor);
    }

    /* 50679F..5067C6: separate TEST read and later memory-AND read/write. */
    if ((rd32(flags) & 0x10000000u) != 0u) {
        wr32(flags, rd32(flags) & UINT32_C(0xefffffff));
    } else if ((rd8(event_addr + 3u) & 2u) != 0u) {
        eax = N4(0x005712c0u, 0u, 1u, 0u, 0xffu);
    }

    /* 5067D0..5067F5: reload, mask full EAX, then select exact immediates. */
    eax = put_al(eax, rd8(event_addr + 2u));
    eax &= 0x30u;
    if (eax == 0x10u)
        eax = N2(0x00571050u, actor, 0x27u);
    else if (eax == 0x20u)
        eax = N2(0x00571050u, actor, 0x28u);
    else if (eax == 0x30u)
        eax = N2(0x00571050u, actor, 0x26u);

    /* 5067F8..50680F: both calls precede the second-index BYTE load. */
    eax = N1(0x005065b0u, event_addr);
    eax = N1(0x005068b0u, event_addr);
    eax = put_al(eax, rd8(event_addr + 0x0cu));
    ebx = event_addr + 0x0cu;
    if ((eax & 0xffu) == 0xffu)
        return eax; /* Keep preceding helper's upper 24 bits. */

    /* 506811..50682F: high 16 bits are zero before the subsequent MOV AX. */
    eax &= 0xffu;
    edx = rd32(event_addr + 0x14u);
    ecx = (eax + eax * 4u) << 3;
    ecx -= eax;
    eax = put_ax(eax, rd16(event_addr + 0x10u));
    actor = base + ecx * 4u;
    eax = N3(0x0050a070u, actor, eax, edx);

    /* 506834..506847: BYTE reload after 50A070, no repeated actor gates. */
    ecx = (uint32_t)rd8(event_addr + 0x0du);
    eax = N2(0x00506620u, actor, ecx);
    eax = N1(0x00509c80u, actor);
    eax = N1(0x005068b0u, ebx);
    return eax; /* 50684C..506852: cleanup/POP/RET do not change EAX. */
}

#undef N1
#undef N2
#undef N3
#undef N4
```

## Native call/stack audit

All entries are **observed new DWORD slots**, nearest callee slot first, not
proof of maximum arity. Let S be entry ESP and P=S−12 after saved EBX/ESI/EDI.
Depths below are before CALL (the return address adds another four bytes).
Native grouped pending slots are documented, not forced by the C compiler.

| CALL | E8 destination | New slots, in callee order | ESP / cleanup |
|---|---|---|---|
| 5066AB | 493D80 | event | P−4 / +4 at 5066B3 |
| 5066BC | 50E510 | 3 | P−4 / +4 at 5066C1 |
| 5066FD | 506B50 | actor, zext WORD(event+4) with bit 2 cleared, DWORD(event+8) | P−12 / retained |
| 506729 | 508360 | 01D986A8, 00506860 | P−20 / +14h at 50672E |
| 506741 | 506B50 | actor, zext WORD(event+4), DWORD(event+8) | P−12 / +0Ch at 506746 |
| 506755 | 570F20 | actor, 00B8B858 | P−8 / retained |
| 50675D | 50C090 | actor, 7 | P−16 / retained |
| 50676A | 5017A0 | 0D, 8, actor+1C | P−28 / retained |
| 506774 | 5017A0 | 0E, 10, actor+1C | P−40 / +28h at 506779 |
| 50678E | 506620 | actor, zext BYTE(event+1) | P−8 / +8 at 506793 |
| 506797 | 509C80 | actor | P−4 / +4 at 50679C |
| 5067BC | 5712C0 | 0, 1, 0, FF | P−16 / +10h at 5067C1 |
| 5067F0 | 571050 | actor, selected 27/28/26 | P−8 / +8 at 5067F5 |
| 5067F9 | 5065B0 | event | P−4 / retained |
| 5067FF | 5068B0 | event | P−8 / +8 at 50680A |
| 50682F | 50A070 | second actor, zext WORD(event+10), DWORD(event+14) | P−12 / retained |
| 50683B | 506620 | second actor, zext BYTE(event+0D) | P−20 / retained |
| 506841 | 509C80 | second actor | P−24 / retained |
| 506847 | 5068B0 | event+0C | P−28 / +1Ch at 50684C |

No local-frame allocation. All native exits reach P, restore EDI/ESI/EBX and
execute plain `C3`, leaving the caller's input slot unpopped. Maximum
target-owned depth is S−52 before CALL, S−56 including its return address;
callee-internal depth is unknown. The callback literal 506860 is passed, not
called by this target. There are no indirect calls/jump tables in the chunk.

### Return and direct effects

- Early gate exit: `(H & 0xFFFF0000) | WORD(actor+0)`, where H is EAX after
  493D80 or the optional later 50E510. The WORD is fetched after that helper.
- Second-index sentinel: `(H & 0xFFFFFF00) | 0xFF`, H from 5068B0(event).
- Full continuing path: raw EAX from 5068B0(event+0C).
- Direct non-stack writes: conditional BYTE at 508360's returned address+0C,
  and conditional DWORD clear at 01D96A9C. Opaque callees may have other effects;
  no claim that these are the function's only transitive effects is made.
- No bounds/null/validity checks are invented. Indexing stride 0x9C does not
  establish an array cardinality; observed event offsets through +17h do not
  establish a full semantic struct. Aliasing through callees remains possible;
  the C retains native reload points and captured actor addresses.

## Coverage

Half-open intervals from `native-metadata.json:11–220`; all 28 blocks mapped.

| Native blocks | Reconciled C region |
|---|---|
| 506690–5066BA; 5066BA–5066C4 | Captured primary actor, unconditional call, optional 50E510(3) |
| 5066C4–5066CF; 5066CF–5066D7 | WORD load and two distinct early returns |
| 5066D7–5066DF; 5066DF–5066E5; 5066E5–5066F0 | Ordered short-circuit gate |
| 5066F0–506736; 506736–506749 | Masked/unmodified WORD paths, multiply, 508360 call and BYTE store |
| 506749–50674F; 50674F–50677E | Bit-40 test and four-call arm |
| 50677E–506787; 506787–506796; 506796–50679F | Alternative arm, optional 506620, mandatory 509C80 |
| 50679F–5067AB; 5067AB–5067B1; 5067B1–5067C6; 5067C6–5067D0 | Global test, event test/call or exclusive clear |
| 5067D0–5067DB; 5067DB–5067E0; 5067E0–5067E5 | Three selector comparisons |
| 5067E5–5067E9; 5067E9–5067ED; 5067ED–5067EF; 5067EF–5067F8 | Exact immediates and common 571050 call |
| 5067F8–506811 | Ordered helper pair, sentinel reload/exit |
| 506811–50684F | Full secondary path and four calls |
| 50684F–506853 | Shared epilogue, represented by raw-EAX returns |

## Verification performed and remaining limits

Performed: complete A/B reads; comparison with all 154 projected instructions
and all 451 chunk bytes; all 28 CFG blocks; manual widths, partial-register,
alias/reload and stack audit; selected incoming xrefs and complete code-target
list (`native-metadata.json:1909–1925`). Pure in-session arithmetic on a literal
transcription of the authorized bytes independently confirmed the endpoint,
all 19 E8 destinations (14 distinct), and all 19 direct branch destinations.
The 256-case inverse-stride arithmetic check had zero failures; products in
that check fit exact Number integers below 2^53. An initial BigInt-based check
was unsupported by the sandbox; the corrected bounded arithmetic check ran.
This is not execution of the C, EXE, or a helper.

**UNCERTAIN / lead follow-up:**

1. Actual callee ABI, arity beyond newly pushed slots, register/flag inputs,
   nonvolatile preservation, physical raw-EAX capture and source return types.
   Capture callee/caller bodies if an unconditional executable-equivalence or
   source-signature claim is required. Xref inventory and names cannot settle it.
2. Physical retained outgoing slots, native stack addresses, ECX/EDX and EFLAGS
   outputs are not promised by this conventional C. Use an assembly bridge if
   any opaque helper/caller observes them. Do not silently promote the boundary.
3. Mapped memory, asynchronous behavior, native access/fault granularity and
   the single-instruction memory AND are outside the C equivalence domain.
   Packed overlays improve width notation over A, not atomicity or fault proof.
4. No semantic purpose or HP/status/presentation classification is authenticated
   here; helpers, callback body, data constants and array sizes stay opaque.
5. Not performed: compilation/linking, machine-code readback, differential or
   live execution, independent file hashing, IDB/git/registry writes, integration
   or final §5.6. Parent native checks remain mandatory. Recommended parent
   tests cover each CFG branch with opaque-call stubs mutating event/actor/global
   storage and returning distinctive EAX high bits, then validate the real ABI.

No extra capture is necessary to deliver this bounded reconciliation. The
missing ABI evidence remains explicit, not an invented CERTAIN verdict.
