# Gte_NCLIP @ 0x45EE10 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `f7c8a3fa14338bf8eebd44ebea749fac350348c02efb5c0b4709f5f447f7ff03`, 36 EA / 98 octets ; [sémantique](../semantic/0x45EE10__Gte_NCLIP.md).
- C exact SHA-256 `7317516b606d94f9fc6bf108d584c28b4778a95278554104cad165fcb0409cf9` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 4072 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
/* Targeted P1..P4 correction of c_existing_neutral.c; not a new generation.
 * Ground truth: authorized numeric ASM/bytes, 0x0045ee10..0x0045ee72,
 * 36 instructions / 98 bytes; no CALL, no jcc/jmp, one C3 retn.
 * MODEL contract: distinct ordinary RAM objects at the five stated addresses,
 * a separate private frame, synchronous execution and no interfering accesses.
 * Linkage/address binding and backend DWORD transactions are NOT proved here.
 * Volatile MODEL access order is a source trace projection, not an ISO/native
 * compiled-runtime proof. MODEL macros are expressions, not native helpers or
 * library calls. Arithmetic sext conditionals do not claim native branches.
 * Current x86 ABI assumption: __cdecl, zero arguments, full signed32 EAX return;
 * EBX/EBP/ESI/EDI preservation and private stack remain backend obligations.
 * Scratch registers/EFLAGS and private save/restore events are not projected.
 */
#include <limits.h>
#include <stdint.h>

_Static_assert(CHAR_BIT == 8, "MODEL requires eight-bit bytes");
_Static_assert(sizeof(uint32_t) == 4 && sizeof(int32_t) == 4,
               "MODEL requires exact-width 32-bit integers");
_Static_assert(sizeof(int64_t) == 8, "MODEL requires exact-width signed64");
_Static_assert(INT_MAX == INT32_MAX,
               "current ABI must not promote uint32_t halves to signed int");

extern volatile uint32_t mem_01ca8a40; /* MODEL object at 0x01ca8a40 */
extern volatile uint32_t mem_01ca8a44; /* MODEL object at 0x01ca8a44 */
extern volatile uint32_t mem_01ca8a48; /* MODEL object at 0x01ca8a48 */
extern volatile uint32_t mem_01ca8a70; /* MODEL object at 0x01ca8a70 */
extern volatile uint32_t mem_01ca92f8; /* MODEL object at 0x01ca92f8 */

#define MODEL_R32(object) (object)
#define MODEL_W32(object, value) ((object) = (value))

int32_t __cdecl fn_0045ee10(void)
{
    uint32_t v00;
    uint32_t v01;
    uint32_t v02;
    uint32_t h03, h04, h05, h06, h07, h08;
    int32_t v03, v04, v05, v06, v07, v08;
    int64_t T0, T1, T2, sum64;

    /* 45ee10/15/1b: R32(A40), R32(A44), R32(A48), before either store. */
    v00 = MODEL_R32(mem_01ca8a40);
    v01 = MODEL_R32(mem_01ca8a44);
    v02 = MODEL_R32(mem_01ca8a48);

    /* 45ee27/32/38 and 35/42,45/4e,3b/4b: six unsigned halves. */
    h03 = v00 >> 16;
    h04 = v01 >> 16;
    h05 = v02 >> 16;
    h06 = v00 & UINT32_C(0xffff);
    h07 = v01 & UINT32_C(0xffff);
    h08 = v02 & UINT32_C(0xffff);

    /* Each h is [0,65535]: signed32 conversion is representable first.
     * Conditional subtraction implements sext16 without signed SHL/SAR,
     * out-of-range signed casts, or a supposed native helper CALL. */
    v03 = (int32_t)h03; /* y0 */
    v04 = (int32_t)h04; /* y1 */
    v05 = (int32_t)h05; /* y2 */
    v06 = (int32_t)h06; /* x0 */
    v07 = (int32_t)h07; /* x1 */
    v08 = (int32_t)h08; /* x2 */
    v03 -= h03 >= UINT32_C(32768) ? INT32_C(65536) : INT32_C(0);
    v04 -= h04 >= UINT32_C(32768) ? INT32_C(65536) : INT32_C(0);
    v05 -= h05 >= UINT32_C(32768) ? INT32_C(65536) : INT32_C(0);
    v06 -= h06 >= UINT32_C(32768) ? INT32_C(65536) : INT32_C(0);
    v07 -= h07 >= UINT32_C(32768) ? INT32_C(65536) : INT32_C(0);
    v08 -= h08 >= UINT32_C(32768) ? INT32_C(65536) : INT32_C(0);

    /* Widen BEFORE every difference/product: |diff| <= 65535,
     * |Ti| <= 2147450880, |T0+T1| <= 4294901760,
     * |sum64| <= 6442352640; all are safe in signed64.
     * Reduction modulo 2^32 commutes with IMUL/ADD low-bit arithmetic. */
    T1 = ((int64_t)v04 - (int64_t)v05) * (int64_t)v06; /* 45ee40/48 */
    T0 = ((int64_t)v03 - (int64_t)v04) * (int64_t)v08; /* 45ee3e/51 */
    sum64 = T0 + T1;                                 /* 45ee56 */
    T2 = ((int64_t)v05 - (int64_t)v03) * (int64_t)v07; /* 45ee54/58 */
    sum64 += T2;                                    /* 45ee5b */

    /* 45ee5e/66: W32(A70, sum mod 2^32), then W32(A92F8, 0). */
    MODEL_W32(mem_01ca8a70, (uint32_t)sum64);
    MODEL_W32(mem_01ca92f8, UINT32_C(0));
    /* 45ee58..71: full EAX = T2, NOT sum; conversion is representable. */
    return (int32_t)T2;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `dea9e71ecce25b7ccbaf072ec23f9c8ec92825de84da9b1742fe0e649f38e4f2` ; copie gelée `tools/_tmp_semantic_triple/0x45ee10/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# Gte_NCLIP @ 0x45EE10

- Instr (live): 36
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gte_NCLIP(void)
- Notes parent: Produit cyclique signé (Y0-Y1)*X2+(Y1-Y2)*X0+(Y2-Y0)*X1. Halves SAR/SHL+SAR 16 (pas AND 0xFFFF). Store DWORD 1CA8A70 seulement, FLAG 1CA92F8=0, pas 1CA8A2C. EAX leftover=(Y2-Y0)*X1 (pas le produit). Tag 07/code 24, TEST AL,2, occupancy 1+2, +44h absents. Leaf cdecl retn C3.

## C réconcilié

```c
/* Gte_NCLIP @ 0x45EE10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 36 instr, size 0x62, end exclusive 0x45EE72. cdecl, 0 args, retn C3, no EBP frame.
 * Leaf: no calls, no add esp. Saved EBX/EBP/ESI/EDI (EBP is scratch, not a frame).
 * Packed DWORD 1CA8A40/44/48: high16 = signed Y via SAR 16 (C1 Fx 10, NOT SHR C1 Ex),
 * low16 = signed X via SHL 16 then SAR 16 (NOT AND 0xFFFF / MOVZX).
 * Cyclic product (Y0-Y1)*X2 + (Y1-Y2)*X0 + (Y2-Y0)*X1 stored DWORD to 1CA8A70.
 * FLAG dword_1CA92F8 = 0. Does NOT write dword_1CA8A2C (AVSZ3/AVSZ4 do).
 * Leftover EAX = last two-operand IMUL 0F AF C7 = (Y2-Y0)*X1, NOT the product.
 * Wrapper sub_56CB00 reloads EAX from dword_1CA8A70 after CALL.
 * Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / +44h GF Exists: ABSENT. TEST AL,2 unlink: ABSENT.
 * OT tag 07 / GPU code 24 / obj+44h / obj+2Ch: ABSENT.
 * No jcc, no setcc, no jump table. No packed struct.
 */

extern unsigned int dword_1CA8A40;
extern unsigned int dword_1CA8A44;
extern unsigned int dword_1CA8A48;
extern unsigned int dword_1CA8A70;
extern unsigned int dword_1CA92F8;

int __cdecl Gte_NCLIP(void)
{
    int packed0;
    int packed1;
    int packed2;
    int y0;
    int y1;
    int y2;
    int x0;
    int x1;
    int x2;
    int prod;
    int leftover;

    packed0 = (int)dword_1CA8A40;
    packed1 = (int)dword_1CA8A44;
    packed2 = (int)dword_1CA8A48;

    y0 = packed0 >> 16;
    y1 = packed1 >> 16;
    y2 = packed2 >> 16;

    x0 = (packed0 << 16) >> 16;
    x1 = (packed1 << 16) >> 16;
    x2 = (packed2 << 16) >> 16;

    leftover = (y2 - y0) * x1;
    prod = (y0 - y1) * x2;
    prod += (y1 - y2) * x0;
    prod += leftover;

    dword_1CA8A70 = (unsigned int)prod;
    dword_1CA92F8 = 0;
    return leftover;
}
```
````
