# Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup @ 0x5BD460

- Instr (live): 56
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1940
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2010
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=274
- A==B: non
- Push IDB historique: oui ; correction documentaire bornée validée le 2026-10-09, re-review Sol et §5.6 parent verts. Append correction/save true/readback exact ; aucune équivalence native inconditionnelle.
- SetType historique: int __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup(_DWORD *, int, int, int) ; aucun nouveau SetType.
- Notes parent: clone rel32 de 0x595AA0. ESI=[edi+44h] curseur paquet (pas GF Exists). Tag [esi]=0x07000000, [esi+4] |= 0x24000000. SetsomeDword(esi+8,+10h,+18h). 3 stores WORD 66 à +14h/+0Ch/+1Ch depuis [arg_8/arg_4/arg_C+6]. OT = [edi+3Ch]+(SAR [edi+50h], CL=[edi+40h])*4. add esi,20h. add esp,24h. EAX=OtNode24. Pas de jcc/ja/jg. Occupancy 1+2 / 0xD0 / 0x1D0 absents.

## C réconcilié

```c
/* H-A8-C-review: conditional x86-32 reconstruction, NOT a promoted patch.
 * Entry: cdecl(obj, v0, v1, v2); return: allocator EAX bits, unchanged.
 * Requires MSVC x86, arithmetic signed >>, two's-complement int32_t,
 * flat 32-bit addresses and valid ordinary little-endian memory accesses.
 * Volatile accesses enforce source sequencing; they do not claim MMIO,
 * concurrency, fault, flags, or instruction-atomicity equivalence.
 * _AddressOfReturnAddress is an intrinsic, not a seventh native callee.
 * This captures/reloads the actual incoming v0 slot (entry ESP + 8).
 * Compiler-private frame and pending outgoing-argument/saved-register slots
 * must not be alias targets. Exact native ESP/stack-layout equivalence needs
 * an ASM wrapper or machine-state model; ordinary C calls are not that proof.
 */
#include <stdint.h>
#include <intrin.h>
#if !defined(_MSC_VER) || !defined(_M_IX86)
#error This reconstruction requires the MSVC x86 native-stack intrinsic.
#endif
#pragma intrinsic(_AddressOfReturnAddress)

typedef char sol_address_width_is_32[(sizeof(void *) == 4) ? 1 : -1];
typedef char sol_int_width_is_32[(sizeof(int) == 4) ? 1 : -1];
typedef struct OtNode24 OtNode24;

int *__cdecl GteState_Set3Pairs_1CA8A10(int *, int *, int *);
int __cdecl camRelated_0(void);
int __cdecl SetsomeDword(uint32_t *, uint32_t *, uint32_t *);
unsigned int __cdecl Gte_AVSZ3(void);
uint32_t *__cdecl GteState_GetToPtr_1CA8A2C(uint32_t *);
OtNode24 *__cdecl OtNode24_PoolAllocLink(OtNode24 **, unsigned int *);

#define SOL_R32(a) (*(volatile uint32_t *)(uintptr_t)(uint32_t)(a))
#define SOL_R16(a) (*(volatile uint16_t *)(uintptr_t)(uint32_t)(a))
#define SOL_W32(a, v) (SOL_R32(a) = (uint32_t)(v))
#define SOL_W16(a, v) (SOL_R16(a) = (uint16_t)(v))

uint32_t __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup(
    uint32_t *arg_0, int arg_4, int arg_8, int arg_C)
{
    uint32_t v0_initial = (uint32_t)arg_4;                 /* 5BD460 */
    uint32_t v2 = (uint32_t)arg_C;                        /* 5BD465 */
    uint32_t v1 = (uint32_t)arg_8;                        /* 5BD46A */
    uint32_t obj = (uint32_t)(uintptr_t)arg_0;            /* 5BD470 */
    volatile uint32_t *native_v0_slot = (volatile uint32_t *)
        ((unsigned char *)_AddressOfReturnAddress() + 8);
    uint32_t pkt = SOL_R32(obj + 0x44u);                  /* 5BD476 */
    uint32_t c0, c1, c2, v0_after_helpers, shift, ot_base, slot;
    uint16_t w1, w0, w2;
    int32_t otz, shifted;
    OtNode24 *node;

    GteState_Set3Pairs_1CA8A10((int *)(uintptr_t)v0_initial,
        (int *)(uintptr_t)v1, (int *)(uintptr_t)v2);
    camRelated_0();

    c0 = SOL_R32(obj + 0x30u);                            /* 5BD484 */
    c1 = SOL_R32(obj + 0x34u);                            /* 5BD487 */
    c2 = SOL_R32(obj + 0x38u);                            /* 5BD48A */
    c0 |= 0x24000000u;
    SOL_W32(pkt + 4u, c0);
    SOL_W32(pkt + 0x0Cu, c1);
    SOL_W32(pkt + 0x14u, c2);
    SOL_W32(pkt, 0x07000000u);
    SetsomeDword((uint32_t *)(uintptr_t)(pkt + 8u),
        (uint32_t *)(uintptr_t)(pkt + 0x10u),
        (uint32_t *)(uintptr_t)(pkt + 0x18u));
    Gte_AVSZ3();

    v0_after_helpers = *native_v0_slot;                   /* 5BD4B8 */
    w1 = SOL_R16(v1 + 6u);                               /* 5BD4BC */
    SOL_W16(pkt + 0x14u, w1);                            /* 5BD4C0 */
    w0 = SOL_R16(v0_after_helpers + 6u);                  /* 5BD4C4 */
    w2 = SOL_R16(v2 + 6u);                               /* 5BD4C8 */
    SOL_W16(pkt + 0x0Cu, w0);                            /* 5BD4CF */
    SOL_W16(pkt + 0x1Cu, w2);                            /* 5BD4D4 */

    GteState_GetToPtr_1CA8A2C((uint32_t *)(uintptr_t)(obj + 0x50u));
    otz = (int32_t)SOL_R32(obj + 0x50u);                  /* 5BD4DD */
    shift = SOL_R32(obj + 0x40u);                        /* 5BD4DF */
    ot_base = SOL_R32(obj + 0x3Cu);                      /* 5BD4E2 */
    shifted = otz >> (shift & 31u);                      /* SAR, signed */
    slot = ot_base + (uint32_t)shifted * 4u;              /* LEA, u32 wrap */
    node = OtNode24_PoolAllocLink((OtNode24 **)(uintptr_t)slot,
        (unsigned int *)(uintptr_t)pkt);
    /* Native cleanup: 3+3+1+2 DWORDs, ADD ESP,24h. C ABI handles its calls;
     * no assertion that their intermediate outgoing stack layout matches.
     */
    pkt += 0x20u;                                       /* ADD ESI,20h */
    SOL_W32(obj + 0x44u, pkt);                           /* DWORD cursor */
    return (uint32_t)(uintptr_t)node;                    /* allocator EAX */
}
```

## Avenant correction 2026-10-09 — DRAFT

État supersédant les attentes DRAFT ci-dessous : **correction documentaire validée**. Review C Sol CORRIGE, propagation, re-review2 ESCALADE embedding, fix bytes, re-review3 EMBED accepté/prose attribution à corriger, puis revalidation ciblée Sol ACCEPTE sur attribution rectifiée. Aucun B automatique pour mise en forme/prose. Parent relit les 56 instructions/un bloc/chunk et tout C final : six callees, cinq xrefs CODE/trois callers, quatre arguments `(obj,v0,v1,v2)`/+16 chez callers, neuf mots internes groupés/+36, trois captures DWORD avant stores, WORD w1/store puis w0,w2/store/store, home-slot entrée ESP+8 réellement relu, SAR signé count&31, LEA OT wrap32/base valeur, stride paquet32 et EAX32 allocateur non modifié contrôlés. Tag paquet0x24 + AVSZ3/link justifient le nom/famille ; clone-diff historique CERTAIN conservé sans nouveau vote. Raw fence exactement4550octets/source SHA `369c6f5b20da73c85e9ef25b93da67f96c0b51efabfb8fc4868348c6347ada72`. Append `[semantic-correction 2026-10-09 A8]`, save true/relecture exacte ; aucun SetType/rename/patch. Contrat MSVC32/intrinsic/shift signé/mémoire valide et exclusions aliases autrespiles/frame compilée restent **préconditions non prouvées**, pas backend ou équivalence native/ISO certifiés.

ASM natif relu : `0x5BD4E6 SAR EDX,CL` masque matériellement le compte r32 à cinq bits. Le rejet historique de `&0x1F` dans `glm_reconcile_notes.md` était une fausse alerte de réconciliation C ; le masque est une normalisation fidèle, même sans AND explicite. Le corps final le rétablit. Anciennes conclusions/provenances conservées ; correction hors métriques pilote et pas nouvelle analyse blind. Signed right-shift C supposé arithmétique, int/adresses 32 bits et domaine mémoire valide restent conditions du modèle ; pas équivalence ISO universelle ni occurrence runtime démontrée. Review Sol indépendante et §5.6 parent requis avant promotion.

Complément H-A8 (2026-10-09, provenance review Sol CORRIGÉ) : le corps C du fence « C réconcilié » ci-dessus est remplacé par la correction issue de la review Sol — copie exacte `tools/_tmp_semantic_triple/0x5bd460/pilot-repair-2026-10-09/c_corrected_sol.c`, SHA-256 `369c6f5b20da73c85e9ef25b93da67f96c0b51efabfb8fc4868348c6347ada72`. Elle corrige trois défauts conditionnels du C précédent (captures DWORD/WORD, rechargement natif du slot entrant arg_4/v0 via `_AddressOfReturnAddress()+8`) et rétablit le masque SAR 32 bits (`& 31`) sur trame d'adresses uint32 (wrap LEA explicite). Contrat et exclusions : reconstruction conditionnelle MSVC x86 uniquement (`_MSC_VER`/`_M_IX86`), frame privée du compilateur et slots sortants/registres sauvegardés exclus des cibles d'alias. Pas de claim d'équivalence native ni ISO, pas de promotion ; re-review et gate §5.6 parent restent pending.

Historique embed H-A8-EMBED-fix-2 (2026-10-09, DRAFT, attribution rectifiée par le parent) : review A8 a escaladé le fence initial — **90 CRLF plus un LF surnuméraire**, soit 4641 octets contre source4550. Après patch parent retirant ce LF, le fence contenait **88 CRLF**, soit 4638 octets : le patch avait aussi normalisé deux fins de ligne. C'est cet état intermédiaire, pas celui du payload review-2, qu'a reçu le worker ; **103 CRLF dans le document entier** est encore un domaine distinct. L'ancien claim « copie exacte » était donc faux en bytes. Le worker a ensuite converti le document entier en LF pur (UTF-8 sans BOM) et réasserté le fence raw octet-pour-octet identique à `tools/_tmp_semantic_triple/0x5bd460/pilot-repair-2026-10-09/c_corrected_sol.c` (SHA-256 `369c6f5b20da73c85e9ef25b93da67f96c0b51efabfb8fc4868348c6347ada72`, 4550 bytes). Re-review3 accepte cet embedding et le C conditionnel, mais exigeait cette rectification de prose. Aucun B automatique, aucun défaut comportemental nouveau établi ; validation de cette prose et gate §5.6 parent restent pending.
