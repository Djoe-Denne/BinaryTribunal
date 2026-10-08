# 0x407914 — Gfx_AllocRenderStateShadow

- **Instr (live)** : 108 ; 393 octets (`0x189`) ; un chunk ; neuf blocs CFG.
- **Palier** : C documenté, réconciliation Sol de C-A/C-B ; aucune promotion ni conclusion A/V/R.
- **Date** : 2026-10-08 ; pack uniquement, destination git réservée au parent.
- **Notes parent** : latch = SHL commun puis incrément ; pas de thunk identifié à cette entrée ; stride 4 des deux tables ; stores DWORD, aucun WORD dans ce corps ; masque `0x0385FF7D` ; sept positions sautées ; seule garde NULL = allocation externe ; aucun cleanup d'objets/rollback ; contexte supplémentaire réellement poussé aux appels finaux.

## C réconcilié

**Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays**.

Plage `[0x407914,0x407A9D)`, taille `0x189`. Type IDA : `int __cdecl(int)`. Sauvegarde explicite EBP seulement, frame `0x12C`, argument à EBP+8, sortie `MOV EAX,[EBP-4]; MOV ESP,EBP; POP EBP; RET C3`. Représentation des bits de l'argument et du retour en `uint32_t`, sans leur prêter une sémantique signée. Cleanups corrigés/confirmés : allocation 16 octets, initialiseurs 4 chacun, appels sans argument à `Render_sub_4070E2` sans cleanup, `sub_41E1AF` 20 chacun, `sub_4074F7` **12 chacun et trois slots**, pas deux.

Source canonique complète : `c_reconciled_sol.c`. Les déclarations ci-dessous sont des vues caller-site x86 cdecl, pas des types définitifs des callees. Elles nécessitent une réconciliation ABI avant intégration à d'autres définitions. Les EAX opaques restent DWORD ; seul leur usage local comme adresse est traduit par conversion explicite. Le retour ignoré de `sub_406F95` est noté void sans certifier son ABI de retour.

```c
#include <stdint.h>

#if UINTPTR_MAX != UINT32_MAX
#error "Requires native 32-bit pointers and x86 cdecl."
#endif
#if defined(_MSC_VER)
#define FF8_CDECL __cdecl
#elif defined(__GNUC__) && defined(__i386__)
#define FF8_CDECL __attribute__((cdecl))
#else
#error "Requires an x86 cdecl compiler."
#endif

/* Existing names; custom wrapper, NOT libc calloc. */
extern uint32_t FF8_CDECL assert_calloc(uint32_t count, uint32_t size,
                                       const char *source, uint32_t line);
extern void FF8_CDECL sub_406F95(void *descriptor);
extern uint32_t FF8_CDECL Render_sub_4070E2(void);
extern uint32_t FF8_CDECL sub_41E1AF(uint32_t arg1, uint32_t object,
                                   uint32_t arg3, void *descriptor,
                                   uint32_t passed_ctx);
extern uint32_t FF8_CDECL sub_4074F7(uint32_t selector, void *descriptor,
                                   uint32_t passed_ctx);

uint32_t FF8_CDECL Gfx_AllocRenderStateShadow(uint32_t arg_0)
{
    const uint32_t mask = UINT32_C(0x0385FF7D); /* 0x40791D */
    uint32_t descriptor_a[0x84 / 4]; /* EBP-0xA0, opaque/uninitialized */
    uint32_t descriptor_b[0x84 / 4]; /* EBP-0x128, NOT one byte */
    uint32_t allocation, object_a, object_b, result_a, result_b, bit;
    uint8_t *shadow;
    void *descriptor_b_ptr;
    int32_t i;

    /* 0x407935: (count,size,path,line), cleanup 0x10.
     * Original PUSH immediate at 0x407929, not a replacement string. */
    allocation = assert_calloc(1u, 0x154u,
        (const char *)(uintptr_t)UINT32_C(0x00B6FBC0), 0x251u);
    if (allocation == 0) /* 0x407944: sole NULL guard */
        goto loc_407A96;

    shadow = (uint8_t *)(uintptr_t)allocation;
    sub_406F95(descriptor_a); /* 0x407951; cleanup 4 */
    result_a = 0;
    result_b = 0;
    bit = 1u;

    for (i = 0; i < 26; ++i) { /* 0x407984 JGE signed */
        if ((bit & mask) != 0) { /* 0x407992 skip to common SHL */
            object_a = Render_sub_4070E2(); /* 0x407998, no args */
            object_b = Render_sub_4070E2(); /* 0x4079A3, before writes */
            /* No guards; DWORD writes, differing +8 polarity. */
            *(uint32_t *)((uint8_t *)(uintptr_t)object_a + 0x08) = bit;
            *(uint32_t *)((uint8_t *)(uintptr_t)object_a + 0x0C) = bit;
            *(uint32_t *)((uint8_t *)(uintptr_t)object_b + 0x08) = 0;
            *(uint32_t *)((uint8_t *)(uintptr_t)object_b + 0x0C) = bit;

            /* 0x4079EC/0x407A0A: five slots, cleanup 0x14 each.
             * Both calls before either table store; same descriptor A. */
            result_a = sub_41E1AF(0u, object_a, 0u, descriptor_a, arg_0);
            result_b = sub_41E1AF(0u, object_b, 0u, descriptor_a, arg_0);
            *(uint32_t *)(shadow + 0x7C + (uint32_t)i * 4u) = result_a;
            *(uint32_t *)(shadow + 0xE4 + (uint32_t)i * 4u) = result_b;
        }
        bit <<= 1; /* 0x407A35, unsigned; selected AND skipped iterations */
    }

    descriptor_b_ptr = descriptor_b; /* 0x407A3F */
    sub_406F95(descriptor_b_ptr); /* 0x407A52; cleanup 4 */
    /* Three arguments each, cleanup 0x0C; consumption of ctx unresolved. */
    result_a = sub_4074F7(0u, descriptor_b_ptr, arg_0);
    *(uint32_t *)(shadow + 0x14C) = result_a; /* before second call */
    result_b = sub_4074F7(1u, descriptor_b_ptr, arg_0);
    *(uint32_t *)(shadow + 0x150) = result_b;

loc_407A96:
    return allocation; /* full EAX of original allocation, including NULL */
}
```

Les 19 positions sélectionnées sont `{0,2,3,4,5,6,8,9,10,11,12,13,14,15,16,18,23,24,25}`. Les positions `{1,7,17,19,20,21,22}` ne sont pas écrites explicitement par ce corps ; leur valeur initiale dépend du wrapper réel. Tables 26×DWORD à `+0x7C` et `+0xE4`, derniers offsets `+0xE0/+0x148`, résultats finaux `+0x14C/+0x150`. Les deux descripteurs ont un stockage `0x84` corroboré par spacing et ancre de l'initialiseur ; aucun layout/contenu inventé.

## Preuves, couverture et comparaison

Huit ancres détaillées dans `reconcile_notes_sol.md` : `0x407935`, `0x407984`, `0x407998`, `0x4079C6`, `0x4079EC`, `0x407A35`, `0x407A67`, `0x407A96`. Elles couvrent ordre des paramètres/cleanups, signedness, polarité/pointers, masque/latch et retour. Aucun désaccord signé entre A/B ; Hex-Rays emploie un bit signé multiplié par deux, numériquement équivalent sur ce parcours borné, mais SHL est rendu unsigned.

Relecture live : 108/108 instructions, neuf blocs, 393/393 octets, un chunk, page terminée ; empreintes conformes à `coverage.json`. SHA256 octets IDB : `8fe6eacd75fe712d2673fd00769cd6512a6bd2932ed2dfff48aab66cdf027645`. Aucun ASM tronqué ni découpage >600 instructions. Un caller direct dans le contexte fourni : `sub_408E90`, site `0x408EAB`, résultat à ctx+0xA84 ; cinq callees uniques et neuf sites dans le corps.

Hex-Rays lu **après reconstruction**, puis revalidé live : arguments fantômes `v4/v5` aux deux appels `Render_sub_4070E2`, contexte omis des deux `sub_4074F7`. Corrections imposées par pushes et `add esp`, pas par interprétation des noms. Son buffer B est bien 132 octets, stride 4 et retour d'allocation concordants. L'annotation de frame d'un octet pour `var_128` n'est pas l'étendue du buffer.

## Risques et absences

C non compilé/non exécuté ; pas de PE ni mémoire de processus vérifiés. Les pointeurs absolus sont propres à cette image. Invalidité/NULL des objets conserve l'absence de garde native, avec UB potentielle en C ; alignement/stockage valide requis. Ni propriété des objets, ni statut signé des EAX, ni consommation du troisième argument final ne sont établis. Pas de libcall, garde contexte, free, rollback, enum de rendu ou zéro synthétique. L'anomalie `TRUNCATED` du callgraph MCP antérieur reste documentée, sans incidence sur la couverture complète de ce corps. Aucun verdict sémantique.
