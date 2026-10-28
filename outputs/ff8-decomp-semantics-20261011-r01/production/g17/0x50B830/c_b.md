# C B — 0x0050B830 — g17 / run01

## Identity and evidence boundary

- Author: `pool-218`, session `ses_ecf089544ffeDrM6FBNsKdyBz8`, task `task_mv44siqj_00by_s3mha6`; independent B, 2+1. No other production/review read.
- Effective model admission: `openai/gpt-6-astra`, `xhigh`, as attested by the lead's INPUT-ADMISSION-HARDENING-v1 message, not independently queried here.
- Input prefix: `inputs/ff8-decomp-semantics-20261011-r01/g17/`.
- `0x50B830.readable/manifest.json`: original packet SHA256 `e89c8ab63b9fd82b3051f599dea4bcd4e2d1bc49457d7a0afe239ac230aafbbf`; compaction SHA256 `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`. Manifest SHA256 attested by lead: `ee68ab702a3c81b773646633c43449c19551c802e947faf107877e9368d0cf82`.
- Entire `asm-001.txt` through `asm-008.txt`, `bytes-001.txt`, `bytes-002.txt`, and `metadata.json` read. One code chunk `[0x50B830,0x50BADF)`, 687 bytes, 195 instructions, 41 CFG blocks.
- Supplement: `0x50B830.supplemental-v1/{manifest.json,table.json,provenance.json,dispatch.txt}`, all read. Supplement manifest SHA256 attested by lead: `ddf0c47e293841fdd067f43f05b0f582c733984a96d5a3317883a75f157a8e3a`. Table bytes SHA256 recorded there: `14b7475cdc947e2ee79510baa8893f19d545b0b148b36f94cb77f9a785482ed5`.
- Original EXE SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`. Original export timestamp `2026-10-11T16:38:25.140966+00:00`; supplement static capture timestamp `2026-10-12T17:03:18.889793+00:00`.
- Hashes and IDB/PE equality are supplied attestations, **not hashes recalculated or IDB comparisons performed by this author**. Names and historical comments are not evidence of purpose.

The initially missing jump table was requested, not inferred. The supplement supplies these eight little-endian DWORDs at `0x50BAE0`:

| Selector byte | Destination |
|---:|---:|
| 0 | 0x50B85A |
| 1 | 0x50B87E |
| 2 | 0x50B934 |
| 3 | 0x50B9B9 |
| 4 | 0x50B9C9 |
| 5 | 0x50B9EE |
| 6 | 0x50BA2B |
| 7 | 0x50BA60 |

## Observed interface and representation

Observed native entry shape is `uint32_t __cdecl sub_0050B830(uint32_t node_va)`: one DWORD at entry `[ESP+4]`, plain `RET`, EAX explicitly 0 or 2 on every exit. The entry saves EBP, ESI, EDI and uses EBP as the original node pointer. There is no local stack allocation. The native function **overwrites its incoming argument slot** with `[node+0x10]` at `0x50B841`; it reloads that slot at `0x50BAC6`. It does not reread `node+0x10` at the end.

Accordingly the precise C body below takes an explicit pointer to that native argument slot. This makes the otherwise easily lost slot write/reload visible. A conventional one-argument C entry is also provided. The ordinary C wrapper is not a proven binary replacement: C does not guarantee that the address of its parameter is the original caller's physical argument slot. Exact ABI integration must bind `body_0050B830` to that slot or verify the compiled wrapper. No claim about that compiler property is made here.

Addresses, pointer payloads, argument words, and EAX observations use `uint32_t`. Calls below name only numerical native targets; the function-pointer casts express observed stack-word arities and EAX transport, **not authenticated source prototypes or purpose**. Direct callees and the indirect callback remain original native code, not invented implementations.

## Complete C

The code is for a little-endian 32-bit x86 native address space. The byte-based memory helpers avoid C alignment/aliasing violations while implementing little-endian BYTE/WORD/DWORD values. They do not model atomicity, volatile device-memory transaction sizes, access-fault timing, or concurrent modification during a multi-byte access. These are integration limits, not extra native guards. No library call is substituted for any instruction.

```c
#include <stdint.h>
#include <limits.h>

#if CHAR_BIT != 8 || UINTPTR_MAX != UINT32_MAX
#error This reconstruction requires an 8-bit-byte, 32-bit-pointer target.
#endif

#if defined(_MSC_VER) && defined(_M_IX86)
#define CDECL __cdecl
#elif defined(__i386__)
#define CDECL __attribute__((cdecl))
#else
#error Bind the original x86 caller-cleanup ABI explicitly.
#endif

typedef uint8_t  u8;
typedef uint16_t u16;
typedef uint32_t u32;

/* Only these pointer casts bind host C to the native flat address space. */
static u8 m8(u32 a)
{
    return *(volatile u8 *)(uintptr_t)a;
}

static void s8(u32 a, u8 v)
{
    *(volatile u8 *)(uintptr_t)a = v;
}

static u16 m16(u32 a)
{
    u32 b0 = m8(a);
    u32 b1 = m8(a + 1u);
    return (u16)(b0 | (b1 << 8));
}

static u32 m32(u32 a)
{
    u32 b0 = m8(a);
    u32 b1 = m8(a + 1u);
    u32 b2 = m8(a + 2u);
    u32 b3 = m8(a + 3u);
    return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
}

static void s16(u32 a, u16 v)
{
    s8(a,      (u8)v);
    s8(a + 1u, (u8)(v >> 8));
}

static void s32(u32 a, u32 v)
{
    s8(a,      (u8)v);
    s8(a + 1u, (u8)(v >> 8));
    s8(a + 2u, (u8)(v >> 16));
    s8(a + 3u, (u8)(v >> 24));
}

static void inc8(u32 a)
{
    u8 old = m8(a);
    s8(a, (u8)((u32)old + 1u));
}

static u32 shl32(u32 v, u32 count)
{
    return v << (count & 31u);
}

static u8 shl8(u8 v, u32 count)
{
    return (u8)((u32)v << (count & 31u));
}

/* Signed x86 JL without implementation-defined u32-to-signed conversion. */
static int signed_less32(u32 a, u32 b)
{
    return (a ^ UINT32_C(0x80000000)) <
           (b ^ UINT32_C(0x80000000));
}

typedef u32 (CDECL *native0)(void);
typedef u32 (CDECL *native1)(u32);
typedef u32 (CDECL *native2)(u32, u32);
typedef u32 (CDECL *native3)(u32, u32, u32);

/* Transport original calls only; no additional callee is presumed. */
#define N0(ea)       (((native0)(uintptr_t)(ea))())
#define N1(ea,a)     (((native1)(uintptr_t)(ea))((u32)(a)))
#define N2(ea,a,b)   (((native2)(uintptr_t)(ea))((u32)(a),(u32)(b)))
#define N3(ea,a,b,c) (((native3)(uintptr_t)(ea))((u32)(a),(u32)(b),(u32)(c)))

/*
 * arg0_slot must denote the DWORD at native entry ESP+4 for exact slot effects.
 * Standard caller-cleanup, nonvolatile-register-preserving callee ABI assumed.
 */
static u32 body_0050B830(volatile u32 *arg0_slot)
{
    const u32 node = *arg0_slot;          /* 50B831: EBP retains original node */
    u32 eax_word = m32(node + 0x10u);     /* 50B837: before marker write */
    u32 p, i, bits, descriptor, callback, final_ptr;
    u16 w;
    u8 b, selector;

    s8(0x01D99A56u, 0xFFu);              /* 50B83A */
    *arg0_slot = eax_word;                /* 50B841: observable argument overwrite */
    selector = m8(node + 0x0Du);          /* XOR EAX,EAX; MOV AL,[EBP+D] */

    switch ((u32)selector) {              /* unsigned bound + supplied table */
    case 0: goto L_50B85A;
    case 1: goto L_50B87E;
    case 2: goto L_50B934;
    case 3: goto L_50B9B9;
    case 4: goto L_50B9C9;
    case 5: goto L_50B9EE;
    case 6: goto L_50BA2B;
    case 7: goto L_50BA60;
    default: goto L_50B92E;
    }

L_50B85A:
    /* PUSH 40; PUSH 1A; CALL 508580; caller ADD ESP,8. */
    if (N2(0x00508580u, 0x1Au, 0x40u) != 0u)
        goto L_50B92E;
    if (N0(0x00501190u) != 0u)           /* 50B86E */
        goto L_50B92E;
    inc8(node + 0x0Du);                  /* 50B87B */
    /* Literal fallthrough, NOT a redispatch using the changed byte. */

L_50B87E:
    descriptor = m32(0x01D99A50u);
    w = m16(descriptor + 4u);            /* MOV AX; unsigned JB/JBE on AX */
    if (w < 7u || w > 10u)
        (void)N0(0x0050A750u);          /* 50B894 */

    eax_word = m32(0x01D96A9Cu);         /* 50B899: read before 50B89E */
    b = m8(0x01D97705u);
    s8(0x01D97705u, (u8)(b | 0x80u));
    s32(0x01D96A9Cu, eax_word | 0x10u); /* OR AL,10 preserves upper EAX */
    (void)N0(0x0050AFC0u);              /* 50B8AC */
    s8(0x01D99A6Cu, 0u);                /* BYTE only; upper 24 bits retained */

    i = 0u;
    p = 0x01D972C0u;
    do {
        if ((m8(p) & 2u) != 0u) {       /* 50B8BF */
            (void)N2(0x0050C090u, p, 0x0Bu);
            b = m8(0x01D99A6Cu);        /* reload AFTER helper */
            s8(0x01D99A6Cu, (u8)(b | shl8(1u, i)));
        }
        p += 0x9Cu;
        i += 1u;
    } while (signed_less32(p, 0x01D97494u));

    (void)N3(0x00501740u, 0x18u, 0u, 0x80u); /* 50B8F9 */
    (void)N3(0x00501740u, 0x19u, 0u, 0x80u); /* 50B907 */
    descriptor = m32(0x01D99A50u);       /* reload after both calls */
    eax_word = (u32)m16(descriptor + 6u); /* XOR EAX; MOV AX: zero extension */
    (void)N2(0x0050AF20u, eax_word, 0x021DFEC4u);
    inc8(node + 0x0Du);                  /* 50B923/929/92B */
    goto L_50B92E;

L_50B934:
    /* Raw absolute operand A1 C8 99 D9 01: 0x01D999C8. */
    if ((m32(0x01D999C8u) & 0x80000000u) != 0u)
        goto L_50B92E;                   /* TEST EAX,EAX; JL */

    bits = m32(0x01D99A6Cu) & 0xFFu;    /* DWORD load, then mask */
    i = 0u;
    p = 0x01D972C0u;
    do {
        if ((bits & shl32(1u, i)) != 0u && (m8(p) & 4u) == 0u)
            goto L_50B92E;
        p += 0x9Cu;
        i += 1u;
    } while (signed_less32(p, 0x01D97494u));

    (void)N0(0x0046B440u);              /* 50B96D */
    if ((m8(0x01D99A6Cu) & 4u) != 0u) {
        w = m16(0x01D973F8u);
        s16(0x01D973F8u, (u16)(w & 0xFFFDu));
        s8(0x01D97459u, 0u);
    }
    callback = m32(0x021DFEC4u);         /* 50B98B */
    s32(0x021DFEC8u, callback);          /* copy before invocation */
    s8(0x01D96DC4u, 1u);
    eax_word = N1(callback, 0x01D99A78u); /* 50B9A1: no null guard */
    s32(0x01D96AACu, eax_word);          /* full callback EAX */
    inc8(node + 0x0Du);                  /* after callback + result store */
    return 0u;                          /* 50B9B3..50B9B8 */

L_50B9B9:
    if (N0(0x0050AE80u) != 0u)
        goto L_50B92E;
    inc8(node + 0x0Du);

L_50B9C9:
    if ((m8(0x01D99A6Cu) & 4u) != 0u) {
        eax_word = m32(0x01D973FCu) & 0xFFu;
        (void)N3(0x00507080u, eax_word, 2u, 0u); /* 50B9E3 */
    }
    inc8(node + 0x0Du);

L_50B9EE:
    if (N0(0x00507070u) != 0u)
        goto L_50B92E;
    if ((m8(0x01D99A6Cu) & 4u) != 0u) {
        (void)N1(0x0050B810u, 0x01D973F8u); /* 50BA09 */
        eax_word = m32(0x01D973FCu);     /* AFTER helper, no cached ID */
        eax_word = (eax_word & 0xFFu) | 0x1000u;
        (void)N3(0x00507080u, eax_word, 2u, 0u); /* 50BA20 */
    }
    inc8(node + 0x0Du);

L_50BA2B:
    if (N0(0x00507070u) != 0u)
        goto L_50B92E;
    if ((m8(0x01D99A6Cu) & 2u) != 0u) {
        eax_word = (m32(0x01D97360u) & 0xFFu) | 0x1000u;
        (void)N3(0x00507080u, eax_word, 1u, 0u); /* 50BA55 */
    }
    inc8(node + 0x0Du);

L_50BA60:
    if (N0(0x00507070u) != 0u)
        goto L_50B92E;

    i = 0u;
    p = 0x01D972C0u;
    do {
        b = m8(0x01D99A6Cu);            /* 50BA74: reload on EVERY iteration */
        if (((u8)shl32(1u, i) & b) != 0u) {
            s8(p, (u8)(m8(p) | 2u));
            eax_word = N1(0x00509C10u, p); /* 50BA8A */
            eax_word |= 0x1000u;        /* OR AH,10h; KEEP all other EAX bits */
            (void)N2(0x00505C00u, p, eax_word);
            (void)N2(0x0050C090u, p, 0x0Cu);
        }
        p += 0x9Cu;
        i += 1u;
    } while (signed_less32(p, 0x01D97494u));

    (void)N0(0x0050AED0u);              /* 50BAB3 */
    eax_word = m32(0x01D96A9Cu);
    s32(0x01D96A9Cu, eax_word & 0xFFFFFFEFu); /* AND AL,EF */
    final_ptr = *arg0_slot;              /* 50BAC6: reload overwritten slot */
    s32(0x01D99A64u, 0u);
    s8(final_ptr + 1u, 0xFFu);           /* no invented null/bounds check */
    return 2u;

L_50B92E:
    return 0u;
}

/* Conventional C interface; physical slot placement requires ABI validation. */
u32 CDECL sub_0050B830(volatile u32 arg0)
{
    return body_0050B830(&arg0);
}
```

## Call and stack audit

Arguments in the following table are listed in callee order, leftmost at callee `[ESP+4]`. Native pushes occur right-to-left. Arity here counts the immediately supplied argument words, not preceding outstanding caller-stack words. Where EAX is unused, the C cast's return type is only a uniform register transport convention.

| Call instruction(s) | Native target | Supplied words in callee order | EAX use |
|---|---|---|---|
| 50B85E | 508580 | `0x1A, 0x40` | full-DWORD nonzero gate |
| 50B86E | 501190 | none | full-DWORD nonzero gate |
| 50B894 | 50A750 | none | discarded |
| 50B8AC | 50AFC0 | none | discarded |
| 50B8C7 | 50C090 | `record, 0x0B` | discarded |
| 50B8F9 / 50B907 | 501740 | `0x18/0x19, 0, 0x80` | discarded |
| 50B91E | 50AF20 | `zext16([descriptor+6]), 0x021DFEC4` | discarded |
| 50B96D | 46B440 | none | discarded |
| 50B9A1 | DWORD previously loaded from 021DFEC4 | `0x01D99A78` | full DWORD stored to 01D96AAC |
| 50B9B9 | 50AE80 | none | full-DWORD nonzero gate |
| 50B9E3 | 507080 | `DWORD[01D973FC]&0xFF, 2, 0` | discarded |
| 50B9EE / 50BA2B / 50BA60 | 507070 | none | full-DWORD nonzero gate |
| 50BA09 | 50B810 | `0x01D973F8` | discarded |
| 50BA20 | 507080 | `(DWORD[01D973FC]&0xFF)\|0x1000, 2, 0` | discarded |
| 50BA55 | 507080 | `(DWORD[01D97360]&0xFF)\|0x1000, 1, 0` | discarded |
| 50BA8A | 509C10 | `record` | full EAX retained then OR 0x1000 |
| 50BA94 | 505C00 | `record, previous_EAX\|0x1000` | discarded |
| 50BA9C | 50C090 | `record, 0x0C` | discarded |
| 50BAB3 | 50AED0 | none | discarded |

Relative E8 operands in the supplied chunk establish these numerical targets; `FF D0` establishes the indirect call. No callback target is statically invented.

- Entry ESP=`S`: saved EBP at `S-4`, ESI at `S-8`, EDI at `S-12`; incoming argument is at `S+4`. Thus `[ESP+0x10]` at `50B841` is exactly the incoming argument slot, not a local or an additional argument.
- `50B863` releases 8 bytes; `50B8D5` releases 8 per taken loop arm.
- `50B8F9` leaves 12 argument bytes outstanding; `50B907` adds 12; `50B91E` adds 8. `50B926 ADD ESP,0x20` releases all 32. No extra parameters to `50AF20` are inferred from that cleanup size.
- `50B9AB` releases the callback's 4 bytes; `50B9E8` releases 12.
- `50BA09` leaves its 4 bytes outstanding; `50BA20` adds 12; `50BA25` releases 16, not four arguments to `507080`.
- `50BA5A` releases 12. Each taken final loop arm accumulates 4+8+8 bytes across `50BA8A`, `50BA94`, `50BA9C`; `50BAA1` releases 20.
- All exits balance saves and return with plain `RET`. `50BAC6`, after popping EDI/ESI but before EBP, reads `[ESP+8] = [S+4]`.
- The C retains logical call order and arguments, but does not require its compiler to reproduce those deferred cleanups or dead stack residues. Source-level equivalence assumes callees consume their supplied words through the conventional ABI, preserve EBP/ESI/EDI/EBX, and do not rely on unspecified incoming volatile registers, flags, or caller stack introspection. Their bodies were not supplied to this author, so these remain ABI assumptions to validate separately.

## Coverage and exact-width checks

Every native block is represented; block starts below are hexadecimal, relative to image VA (no tail chunks omitted):

| C portion | Native CFG block starts |
|---|---|
| entry/switch | 50B830, 50B853 |
| L_50B85A gates/increment | 50B85A, 50B86E, 50B87B |
| L_50B87E range/setup | 50B87E, 50B88E, 50B894, 50B899 |
| first record loop | 50B8BF, 50B8C4, 50B8E1 |
| two calls/load/increment | 50B8F0 |
| zero-return epilogue | 50B92E |
| L_50B934 and second loop | 50B934, 50B93D, 50B950, 50B95B, 50B960 |
| second-arm postloop/callback/return | 50B96D, 50B97B, 50B98B |
| L_50B9B9 | 50B9B9, 50B9C6 |
| L_50B9C9 | 50B9C9, 50B9D2, 50B9EB |
| L_50B9EE | 50B9EE, 50B9FB, 50BA04, 50BA28 |
| L_50BA2B | 50BA2B, 50BA38, 50BA41, 50BA5D |
| L_50BA60/final loop | 50BA60, 50BA6D, 50BA74, 50BA86, 50BAA4 |
| final effects/return | 50BAB3 |

- `50B845..50B853`: zeroed EAX plus AL load means unsigned selector 0..255, bounded by unsigned `JA 7`; no signed-char dispatch.
- `50B884..50B892`: only AX is compared; unsigned inclusive interval `[7,10]`. The stale upper EAX does not participate in these branches. It is replaced by a DWORD load at `50B899` before any later use in this body.
- `50B919`: AX is loaded **after XOR EAX**, so the argument is zero-extended WORD. By contrast `50BA8F OR AH,10h` preserves every bit of the helper's full EAX except setting bit 12; truncating to BYTE or WORD would be wrong.
- `50BA15/50BA1C` and `50BA49/50BA51`: AND full register with 0xFF precedes OR AH/CH with 0x10; resulting argument is precisely low byte OR 0x1000.
- All node+0x0D increments wrap modulo 256 and reread the byte after the preceding helpers. Fallthroughs remain unconditional fallthroughs; they do not redispatch based on possibly helper-modified state.
- `50B8D8` is an **8-bit** SHL DL,CL; `50B955` and `50BA80` are DWORD shifts. Counts are x86-masked by 31; byte truncation occurs only where the native operand/result is a byte. Actual loop counts are 0,1,2.
- All three loops retain signed address comparisons (`JL`) against `0x01D97494`; start `0x01D972C0`, stride `0x9C`, visited addresses `0x01D972C0`, `0x01D9735C`, `0x01D973F8`. No unproven universal array size is declared.
- `50B934` is a DWORD sign-bit test at **0x01D999C8**, from raw bytes `A1 C8 99 D9 01`; the abbreviated address in common-compaction line 21 is not used.
- `01D99A6C` writes in setup/first loop are BYTE writes, despite the historical DWORD name. Its upper bytes are preserved. `50B93D` performs a DWORD read masked to 0xFF. The final loop reloads its low byte after any preceding helper effects on every iteration.
- WORD AND `0xFFFD` at `50B97B` preserves adjacent bytes; final flag AND AL,EF at `50BABE` preserves EAX's other 24 bits and clears only bit 4 before the DWORD store.
- All address and register-sized additions in C are unsigned 32-bit and wrap. There is no introduced signed overflow, division, or undefined shift count.

## Remaining limits and validation status

1. Full target code and all eight selector mappings are covered; no target branch is left as TODO. Supplement fixes the original table-evidence gap without altering the old freeze.
2. Helper purposes, source types, hidden-register contracts, external side effects, and current indirect callback identity are not established. The C uses only the observed call-site word interfaces. Invalid pointers, malformed state, and invalid callback values receive no speculative repair.
3. Physical incoming-slot placement, compiler lowering, original helper ABI compatibility, and multi-byte access atomicity are explicit integration limits above. No equivalence claim covers races, MMIO, exceptions, or arbitrary callee stack introspection.
4. Table contents are fixed to the authenticated supplement. Self-modification of the jump table is not modeled or evidenced by the frozen body.
5. Static author inspection of the supplied ASM/bytes/table and manual stack/width/block accounting only. **No compilation, execution, harness test, live test, independent review, hash recomputation, IDB read/write, or promotion performed.** Lead requests: compile/ABI disassembly check (especially incoming slot), differential tests for selector 0..7/default, helper-mutated state/global values and full-EAX animation argument, then independent reconciliation/native validation. These are requested checks, not PASS results.
