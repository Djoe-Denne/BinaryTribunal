# Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup2 @ 0x5EF910

- Instr (live): 56
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=943
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1478
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2118
- A==B: non
- Push IDB historique: oui ; correction documentaire bornée validée le 2026-10-09 par re-review Sol indépendante puis §5.6 parent. Append correction/save true/readback exact ; aucune équivalence native inconditionnelle.
- SetType historique: int __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup2(_DWORD *, int, int, int) ; aucun nouveau SetType.
- Notes parent: clone rel32 de 0x595AA0. ESI=[edi+44h] curseur paquet (pas GF Exists). Tag [esi]=0x07000000, [esi+4] |= 0x24000000. SetsomeDword(esi+8,+10h,+18h). 3 stores WORD 66 à +14h/+0Ch/+1Ch depuis [arg_8/arg_4/arg_C+6]. OT = [edi+3Ch]+(SAR [edi+50h], CL=[edi+40h])*4. add esi,20h. add esp,24h. EAX=OtNode24. Pas de jcc/ja/jg. Occupancy 1+2 / 0xD0 / 0x1D0 absents.

## C réconcilié

```c
/* H-A10-C-review, 0x5EF910 only. Conditional reconstruction, NOT promotion.
 * Target: little-endian x86 cdecl, 32-bit words and pointers; int32_t right
 * shift is arithmetic, uint32_t -> int32_t preserves the x86 bit pattern.
 * Memory primitives below perform one ordered native-width access, including
 * overlapping storage, without C effective-type/alignment assumptions.
 * The six callee declarations describe the native ABI, not proven ISO types.
 * native_entry_arg4_reload32() MUST read the original entry-ESP+8 slot at
 * the invocation point (0x5EF968), not a cached formal parameter or &arg_4
 * in an arbitrary compiled C frame. Its implementation is not supplied.
 * Other aliases with native pending arguments, saved registers and return
 * addresses require a native-stack adapter or an explicit exclusion. Normal
 * compiled C calls do NOT reproduce the original deferred stack cleanup.
 * No helper internals, flags, concurrency, faults or runtime violation proved.
 * This is a targeted proposal with an explicit native-slot obligation, not a
 * ready-to-link replacement or a complete unrestricted stack-alias emulator.
 */
#include <stdint.h>

_Static_assert(sizeof(void *) == 4, "native x86 pointer width required");
_Static_assert(sizeof(int) == 4, "native x86 int width required");
_Static_assert(((int32_t)-1 >> 1) == -1, "arithmetic signed SAR required");

extern uint32_t native_read32(uint32_t address);
extern uint16_t native_read16(uint32_t address);
extern void native_write32(uint32_t address, uint32_t value);
extern void native_write16(uint32_t address, uint16_t value);
extern uint32_t native_entry_arg4_reload32(void);

extern uint32_t __cdecl GteState_Set3Pairs_1CA8A10(int *, int *, int *);
extern uint32_t __cdecl camRelated_0(void);
extern uint32_t __cdecl SetsomeDword(uint32_t *, uint32_t *, uint32_t *);
extern uint32_t __cdecl Gte_AVSZ3(void);
extern uint32_t __cdecl GteState_GetToPtr_1CA8A2C(uint32_t *);
/* Raw EAX32, rather than an unverified OtNode24 object/pointer contract. */
extern uint32_t __cdecl OtNode24_PoolAllocLink(uint32_t *, uint32_t *);

uint32_t __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup2(
    uint32_t arg_0, uint32_t arg_4, uint32_t arg_8, uint32_t arg_C)
{
    const uint32_t obj = arg_0;
    const uint32_t v0_initial = arg_4;
    const uint32_t v1_saved = arg_8; /* native EBP, not a later entry-slot read */
    const uint32_t v2_saved = arg_C; /* native EBX, not a later entry-slot read */
    const uint32_t pkt = native_read32(obj + 0x44u);
    uint32_t d0, d1, d2, v0_reloaded, ot_field, shift, ot_base, ot_slot;
    uint16_t w1, w0, w2;
    int32_t otz;
    uint32_t eax32;

    GteState_Set3Pairs_1CA8A10((int *)v0_initial, (int *)v1_saved,
                             (int *)v2_saved);
    camRelated_0();

    /* 0x5EF934..0x5EF94C: ALL three loads precede the first store. */
    d0 = native_read32(obj + 0x30u);
    d1 = native_read32(obj + 0x34u);
    d2 = native_read32(obj + 0x38u);
    native_write32(pkt + 4u, d0 | 0x24000000u);
    native_write32(pkt + 0x0Cu, d1);
    native_write32(pkt + 0x14u, d2);
    native_write32(pkt, 0x07000000u);
    SetsomeDword((uint32_t *)(pkt + 8u), (uint32_t *)(pkt + 0x10u),
                 (uint32_t *)(pkt + 0x18u));
    Gte_AVSZ3();

    /* NOT "capture all three WORDs before all stores": first store is early. */
    v0_reloaded = native_entry_arg4_reload32(); /* 0x5EF968, entry-ESP+8 */
    w1 = native_read16(v1_saved + 6u);
    native_write16(pkt + 0x14u, w1);
    w0 = native_read16(v0_reloaded + 6u);
    w2 = native_read16(v2_saved + 6u); /* capture BEFORE pkt+0x0C store */
    ot_field = obj + 0x50u;           /* LEA: address, not loaded OTZ */
    native_write16(pkt + 0x0Cu, w0);
    /* Native PUSH ot_field precedes this store: see stack contract above. */
    native_write16(pkt + 0x1Cu, w2);

    GteState_GetToPtr_1CA8A2C((uint32_t *)ot_field); /* ignore helper EAX */
    otz = (int32_t)native_read32(ot_field);
    shift = native_read32(obj + 0x40u);
    ot_base = native_read32(obj + 0x3Cu); /* loaded base VALUE, not obj+3C */
    otz >>= (shift & 31u); /* 0x5EF996 D3 FA: signed arithmetic SAR */
    ot_slot = ot_base + (uint32_t)otz * 4u; /* LEA wraps mod 2^32 */
    eax32 = OtNode24_PoolAllocLink((uint32_t *)ot_slot, (uint32_t *)pkt);

    /* Native add esp,24h retires 3+3+1+2=9 words at this point. */
    native_write32(obj + 0x44u, pkt + 0x20u); /* DWORD, wrap mod 2^32 */
    return eax32; /* no instruction after allocator changes EAX */
}
```

## Avenant correction 2026-10-09 — DRAFT

État supersédant le statut DRAFT ci-dessous : **correction documentaire validée**. La re-review Sol distincte `ses_ede007e0dffeA2vFeQMDGCh003` accepte le C effectivement embarqué (56/56 instructions, six callees, cinq xrefs, chunk/CFG complet, EMBED exact). Parent a relu de nouveau les 56 instructions natives et tout le C final ; hashes source/C inchangés. Trois captures DWORD, ordre exact des WORD, relecture entrée ESP+8, SAR count&31, adresse wrap32, stride paquet 32, quatre arguments obj premier/+16 chez callers, neuf mots groupés/+36 dans cible et EAX32 allocateur contrôlés. Pas de jcc/stride acteur à inventer ; tag 0x24 et chaîne AVSZ3/link sont deux preuves du nom/famille. Ancienne classe CERTAIN-diff conservée, pas nouveau vote sémantique. Les deux paragraphes DRAFT suivants sont conservés comme historique de propagation ; leur attente de review/gate est levée, **pas les limites de backend/pile/aliases**. Append `[semantic-correction 2026-10-09 A10]` multiligne, save true et relecture exacte ; aucune modification de type/nom/octets.

ASM natif relu : `0x5EF996 SAR EDX,CL` masque matériellement le compte r32 à cinq bits. Le rejet historique de `&0x1F` dans `glm_reconcile_notes.md` était une fausse alerte de réconciliation C ; le masque est une normalisation fidèle, même sans AND explicite. Le corps final le rétablit ; le calcul d'adresse est effectué en unsigned 32 bits plutôt que `otz*4` signé susceptible de déborder. Anciennes conclusions/provenances conservées ; correction hors métriques pilote et pas nouvelle analyse blind. Signed right-shift C supposé arithmétique, int/adresses 32 bits et domaine mémoire valide restent conditions du modèle ; pas équivalence ISO universelle ni occurrence runtime démontrée. Review Sol indépendante et §5.6 parent requis avant promotion.

Complément 2026-10-09 (provenance) : relecture indépendante Sol, verdict CORRIGE ; premier fence remplacé par la reconstruction `tools/_tmp_semantic_triple/0x5ef910/pilot-repair-2026-10-09/c_corrected_sol.c` (copie exacte, SHA256 `88bb07d71e8510938155cdfe8ad7f6d2183b995896b2534441a42c776d0dbb64`). Trois défauts conditionnels corrigés : (1) captures DWORD — les trois lectures `[obj+30h/34h/38h]` précèdent le premier store (0x5EF934..0x5EF94C) ; (2) captures WORD — `w2=[arg_C+6]` est capturé avant le store `pkt+0x0C`, et non « les trois WORD avant tous les stores » ; (3) reload arg4 natif — `[arg_4+6]` est relu au point 0x5EF968 depuis le slot entrée ESP+8 d'origine (`native_entry_arg4_reload32`, implémentation non fournie), pas un paramètre formel mis en cache. Masque SAR32 et adresse uint32 : cf. ci-dessus, adresse OT wrap mod 2^32. Contrat mémoire : accès natifs ordonnés de largeur machine, chevauchement inclus, sans hypothèse d'effective-type/alignement C. Adapter de pile natif (pending args, registres sauvés, adresses de retour) non fourni ; aliases sur l'autre pile exclus — un appel C compilé ne reproduit pas le cleanup différé `add esp,24h`. Aucun claim d'équivalence native/ISO, pas de promotion ; re-review Sol et §5.6 parent restent pending.
