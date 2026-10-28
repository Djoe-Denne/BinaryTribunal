# 0x50BF90 — independent C A

## Authority and representation

Only the supplied `inputs/ff8-decomp-semantics-20261011-r01/g27/{common-compaction.md,0x50BF90.json}` were used as target evidence. Native JSON: lines 11–18 contain the sole chunk `[0x50BF90,0x50C090)`, 256 bytes, 81 instructions; lines 19–130 contain 15 CFG blocks. EXE SHA256 cited by JSON: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`. Chunk SHA256 cited by common compaction: `87e46f3c9d4a4887e644b74372ba88c60db247c499b5e2f347a81e654aa14921` (not independently recomputed here). Labels/comments are not type or purpose evidence.

The C below is a complete register/memory-level translation, not an invented source prototype. A flat guest-memory image is necessary to retain arbitrary overlap of payload, records, globals, argument home, scratch bytes and saved registers. A conventional structure-based function would silently discard observable stack writes and the DWORD reload from a scratch location initialized only by a BYTE store.

Implementation contract: GNU-compatible C11, little-endian host, 8-bit bytes, 32-bit unsigned int, packed/may_alias support, and a host able to map a 4-GiB guest byte image. `m` denotes that image; host `r` is disjoint from it. All native memory operations must be valid and must not straddle the guest address-space end. This is an ordinary-memory, nonfaulting, single-threaded execution model, not an MMIO/exception/concurrent-x86 emulator. Individual WORD/DWORD accesses use packed volatile scalar fields (not widened stores or bytewise substitution); host code generation needs separate validation. Address formation wraps modulo 2^32. No guest callee or library call is introduced; helpers below merely define register and memory operations.

## Complete C

```c
#include <stdint.h>
#include <limits.h>

#if CHAR_BIT != 8 || UINT_MAX != 0xffffffffU
#error Requires 8-bit bytes and 32-bit unsigned int
#endif
#if !defined(__BYTE_ORDER__) || __BYTE_ORDER__ != __ORDER_LITTLE_ENDIAN__
#error Requires a little-endian GNU-compatible implementation
#endif

typedef struct __attribute__((packed, may_alias)) { uint16_t v; } U16;
typedef struct __attribute__((packed, may_alias)) { uint32_t v; } U32;
typedef struct {
    uint32_t eax, ebx, ecx, edx, esi, edi, ebp, esp, eip, eflags;
} X86State;

static inline uint8_t r8(volatile uint8_t *m, uint32_t a)
{ return m[a]; }
static inline uint16_t r16(volatile uint8_t *m, uint32_t a)
{ return ((volatile U16 *)(m + a))->v; }
static inline uint32_t r32(volatile uint8_t *m, uint32_t a)
{ return ((volatile U32 *)(m + a))->v; }
static inline void w8(volatile uint8_t *m, uint32_t a, uint8_t v)
{ m[a] = v; }
static inline void w16(volatile uint8_t *m, uint32_t a, uint16_t v)
{ ((volatile U16 *)(m + a))->v = v; }
static inline void w32(volatile uint8_t *m, uint32_t a, uint32_t v)
{ ((volatile U32 *)(m + a))->v = v; }
static inline uint32_t low8(uint32_t x, uint8_t v)
{ return (x & 0xffffff00U) | (uint32_t)v; }
static inline uint32_t low16(uint32_t x, uint16_t v)
{ return (x & 0xffff0000U) | (uint32_t)v; }
static inline int sle32(uint32_t a, uint32_t b)
{ return (a ^ 0x80000000U) <= (b ^ 0x80000000U); }

/* Only the final ADD changes flags that remain observable on return.
 * Other EFLAGS bits are unaffected by every instruction in this chunk. */
static inline uint32_t add8_flags(uint32_t f, uint32_t before,
                                  uint32_t after)
{
    uint32_t p = after & 255U;
    p ^= p >> 4;
    p ^= p >> 2;
    p ^= p >> 1;
    return (f & ~0x8d5U)
         | (uint32_t)(after < before)
         | ((1U ^ (p & 1U)) << 2)
         | ((before ^ 8U ^ after) & 0x10U)
         | ((uint32_t)(after == 0U) << 6)
         | ((after >> 24) & 0x80U)
         | (((~(before ^ 8U) & (before ^ after)) >> 20) & 0x800U);
}

void native_0050BF90(volatile uint8_t *m, X86State *r)
{
    uint32_t eax = r->eax, ebx = r->ebx, ecx = r->ecx, edx = r->edx;
    uint32_t esi = r->esi, edi = r->edi, ebp = r->ebp, esp = r->esp;
    uint32_t eflags = r->eflags, eip, t;
    int zero;

    /* Block 50BF90: arg_0 is entry [ESP+4]. */
    esp -= 8U;                                      /* 50BF90 */
    esp -= 4U; w32(m, esp, ebp);                    /* 50BF93 */
    esp -= 4U; w32(m, esp, esi);                    /* 50BF94 */
    esi = r32(m, esp + 0x14U);                      /* 50BF95 */
    ebp = 0U;                                      /* 50BF99 */
    w32(m, 0x01d99a50U, esi);                       /* 50BF9B */
    w16(m, 0x01d99a5cU, (uint16_t)ebp);             /* 50BFA1 */
    eax = r32(m, esi + 8U);                         /* 50BFA8 */
    ecx = low8(ecx, r8(m, esi));                     /* 50BFAB */
    w32(m, 0x01d99a60U, eax);                       /* 50BFAD */
    eax = ecx;                                     /* 50BFB2 */
    eax &= 255U;                                   /* 50BFB4 */
    w8(m, esp + 12U, (uint8_t)ecx);                 /* 50BFB9 */
    w16(m, 0x01d99a90U, (uint16_t)ebp);             /* 50BFBD */
    w8(m, 0x01d99a6dU, 0);                         /* 50BFC4 */
    edx = eax + eax * 4U;                           /* 50BFCB */
    edx <<= 3;                                     /* 50BFCE */
    edx -= eax;                                    /* 50BFD1 */
    eax = 0x01d972c0U + edx * 4U;                   /* 50BFD3 */
    edx = r32(m, esi + 12U);                        /* 50BFDA */
    w32(m, 0x01d99a40U, eax);                       /* 50BFDD */
    eax = 0U;                                      /* 50BFE2 */
    eax = low8(eax, r8(m, esi + 0x11U));             /* 50BFE4 */
    w32(m, 0x01d99a74U, edx);                       /* 50BFE7 */
    eax += 1U;                                     /* 50BFED */
    if (sle32(eax, ebp)) goto L50C06E;              /* 50BFEE/F0 */

    /* Block 50BFF2. Saves are guest memory, not hidden host locals. */
    esp -= 4U; w32(m, esp, ebx);                    /* 50BFF2 */
    esp -= 4U; w32(m, esp, edi);                    /* 50BFF3 */
    ebx = esi + 0x10U;                             /* 50BFF4 */
    w32(m, esp + 0x1cU, eax);                      /* 50BFF7 */

L50BFFB:
    eax = 0U;                                      /* 50BFFB */
    eax = low8(eax, r8(m, ebx));                    /* 50BFFD */
    if (sle32(eax, 0U)) goto L50C057;               /* 50BFFF/C001 */
    /* Block 50C003. */
    edx = r32(m, ebx - 8U);                         /* 50C003 */
    edi = eax;                                     /* 50C006 */

L50C008:
    ecx = low8(ecx, r8(m, edx));                    /* 50C008 */
    eax = 1U;                                      /* 50C00A */
    eax <<= (ecx & 31U);                            /* 50C00F */
    ebp = low16(ebp, (uint16_t)(ebp | eax));        /* 50C011 */
    eax = low8(eax, r8(m, edx + 3U));               /* 50C014 */
    if (((uint8_t)eax & 8U) == 0U) goto L50C03B;    /* 50C017/19 */
    /* Block 50C01B. SHR affects AL only, not whole EAX. */
    ecx = 1U;                                      /* 50C01B */
    eax = low8(eax, (uint8_t)((uint8_t)eax >> 6));   /* 50C020 */
    w32(m, esp + 0x10U, ecx);                      /* 50C023 */
    w8(m, 0x01d99a84U, (uint8_t)eax);               /* 50C027 */
    ecx = low8(ecx, (uint8_t)eax);                  /* 50C02C */
    eax = r32(m, esp + 0x10U);                      /* 50C02E */
    eax <<= (ecx & 31U);                            /* 50C032 */
    t = r16(m, 0x01d99a90U);                        /* 50C034 read */
    w16(m, 0x01d99a90U, (uint16_t)(t | eax));        /* 50C034 write */

L50C03B:
    ecx = low8(ecx, r8(m, edx + 2U));               /* 50C03B */
    ecx = low8(ecx, (uint8_t)((uint8_t)ecx & 0x30U)); /* 50C03E */
    if ((uint8_t)ecx != 0x30U) goto L50C04D;        /* 50C041/44 */
    /* Block 50C046. */
    t = r8(m, 0x01d99a6dU);                         /* 50C046 read */
    w8(m, 0x01d99a6dU, (uint8_t)(t | 2U));          /* 50C046 write */

L50C04D:
    edx += 0x18U;                                  /* 50C04D */
    edi -= 1U;                                     /* 50C050 */
    if (edi != 0U) goto L50C008;                    /* 50C051 */
    /* Block 50C053: deliberately NOT zero extension of saved byte. */
    ecx = r32(m, esp + 0x14U);                      /* 50C053 */

L50C057:
    eax = r32(m, esp + 0x1cU);                      /* 50C057 */
    ebx += 0x14U;                                  /* 50C05B */
    eax -= 1U;                                     /* 50C05E */
    w32(m, esp + 0x1cU, eax);                      /* 50C05F */
    if (eax != 0U) goto L50BFFB;                    /* 50C063 */
    /* Block 50C065: preserve ordering of POP, global write, POP. */
    edi = r32(m, esp); esp += 4U;                   /* 50C065 */
    w16(m, 0x01d99a5cU, (uint16_t)ebp);             /* 50C066 */
    ebx = r32(m, esp); esp += 4U;                   /* 50C06D */

L50C06E:
    eax = low8(eax, r8(m, esi + 0x10U));             /* 50C06E */
    zero = ((uint8_t)eax == 0U);                    /* 50C071 */
    w8(m, 0x01d99a5aU, (uint8_t)eax);               /* 50C073 */
    if (zero) goto L50C084;                         /* 50C078 */
    /* Block 50C07A: re-read payload pointer after the preceding write. */
    edx = r32(m, esi + 8U);                         /* 50C07A */
    eax = low8(eax, r8(m, edx));                    /* 50C07D */
    w8(m, 0x01d99a48U, (uint8_t)eax);               /* 50C07F */

L50C084:
    esi = r32(m, esp); esp += 4U;                   /* 50C084 */
    w8(m, 0x01d99a56U, (uint8_t)ecx);               /* 50C085 */
    ebp = r32(m, esp); esp += 4U;                   /* 50C08B */
    t = esp; esp += 8U;                            /* 50C08C */
    eflags = add8_flags(eflags, t, esp);
    eip = r32(m, esp); esp += 4U;                   /* 50C08F: RET */

    r->eax = eax; r->ebx = ebx; r->ecx = ecx; r->edx = edx;
    r->esi = esi; r->edi = edi; r->ebp = ebp; r->esp = esp;
    r->eip = eip; r->eflags = eflags;
}
```

## ABI, coverage, and non-repaired details

- All 15 supplied CFG blocks and all 81 instructions are represented, including the signed `JLE` at 50BFF0 despite its initially impossible condition: zero-extended byte plus one is 1..256, EBP is zero. `TEST/JLE` at 50C001 is also signed, not a guessed byte-sign test.
- Let S be entry ESP. Argument at S+4 is read at 50BF95, then overwritten by the counter at 50BFF7/50C05F. Scratch S-4 receives one byte at 50BFB9 but is read as DWORD at 50C053. S-8 receives DWORD 1 at 50C023. Saved registers occupy S-12, S-16, S-20, S-24. No scratch initialization beyond native writes is invented.
- C3 returns using guest [S], leaving ESP=S+4; it does not pop the argument. Common compaction lines 18–20 corroborate caller push at 50A798, call at 50A799, caller cleanup by four at 50A7A5. There is one argument, so right-to-left order introduces no multi-argument ambiguity. The caller replaces EAX at 50A79E. The host function's void return is NOT a claim that native EAX is undefined: the exact register result is in r->eax.
- If the loop terminates normally, EAX is zero at 50C05E before tail AL replacement. Return EAX therefore equals the final AL, 0..255. No boolean conversion is justified. The tail can return zero even after taking its nonzero-count path. ECX upper bytes can include untouched stack contents; they must not be fabricated as zero. EBX/EDI/ESI/EBP reload their actual saved slots, so overlapping writes can affect restored values.
- Outer stride is 0x14; inner stride is 0x18; base arithmetic stride is 0x9C. Shift 50C00F masks the count by 31 and only AX contributes to BP. Counts 16..31 do not contribute a low-word bit, and values 32..255 wrap the hardware shift count; no slot bound is imposed. AL>>6 at 50C020 yields 0..3 without discarding EAX's other bytes until the later DWORD reload.
- No unconditional reset of byte 0x1D99A84 or byte 0x1D99A48 occurs. Target 0x1D99A90 is WORD, 0x1D99A6D is BYTE, despite DWORD-shaped labels. Tail accesses are fresh reads, not cached globals. Every memory operand is sequenced in native order, including the global/stack alias-sensitive readback at 50C02E.

## Unknowns and validation boundary

No semantic verdict, guessed structure types, capacity bound, ownership rule, or safety check is supplied. Arbitrary aliasing is modeled rather than excluded. Address mapping, nonfaulting accessible memory, segmented-address equivalence and absence of asynchronous mutation are explicit execution-domain assumptions. No claim of complete fault/interleaving semantics, code-page self-modification handling, or a directly linkable native ABI replacement is made. The source packet provides one incoming xref and no callees; surrounding writer/type conclusions remain unproved.

Performed: manual comparison of supplied hex/ASM, stack displacements and block paths; source construction only. Not performed: compilation, automated byte-hash verification, differential execution, unit tests, live execution, review, integration or promotion. Lead/reviewer should compile the chosen GNU dialect and compare full GPR/RAM/stack results, especially aliasing around scratch/global addresses, zero/nonzero record groups, shift counts 15/16/31/32/255, tail re-reads, and preserved bytes surrounding WORD stores. These are validation requests, not PASS claims.
