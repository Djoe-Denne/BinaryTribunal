# C A — 0x00509C80 — g17 / run01

Auteur indépendant : `pool-206`, tâche `task_mv44sfzg_00be_wuo36j`.
Modèle demandé à l'admission : `openai/gpt-6-astra`, `high` ; aucun readback de session effectué par cet auteur.

## Entrée et portée

- Gel : `inputs/ff8-decomp-semantics-20261011-r01/g17/0x509C80.json`.
- SHA-256 du paquet, cité du manifeste : `2b5b3b9a757e4613d03a108e0bbbeccbba9a8ab8575582609814aa12d8792b32`.
- Compaction commune : `inputs/ff8-decomp-semantics-20261011-r01/g17/common-compaction.md`, SHA-256 déclaré `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.
- SHA-256 EXE déclaré : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` ; export natif du `2026-10-11T16:38:25.140966+00:00`, x86 32 bits.
- Projection lue intégralement : `0x509C80.readable/{manifest.json,metadata.json,asm-001.txt,asm-002.txt,bytes-001.txt}`. Les hashes sont cités, pas recalculés.
- Un chunk `[0x00509C80,0x00509CC3)` : **67 octets, 30 instructions, 6 blocs**. Aucun autre chunk annoncé. Les noms et commentaires historiques ne servent pas à typer les résultats des helpers.

## Choix d'interface C : ne pas inventer un retour natif

L'entrée native prend un seul DWORD sur la pile, à `[ESP_entrée+4]`, utilisé comme pointeur. Les deux sorties sont des `RET` simples. Le chemin `byte_04 >= 0x10` ne définit **jamais EAX**. Les autres chemins laissent EAX provenir du premier ou du second appel.

Il serait donc injustifié de fabriquer un retour zéro, un booléen, ou un retour C non initialisé. Le C complet ci-dessous est un **modèle à EAX explicite** : `eax_at_entry` représente le registre entrant, **pas un deuxième argument natif** ; sa valeur retournée représente les bits EAX sortants, **pas un type de retour métier authentifié**. Ce modèle n'est pas un remplacement binaire directement substituable à l'EA. L'éventuel prototype natif `void __cdecl f(void *)` reste une hypothèse à valider chez les appelants, non une conclusion de cet auteur.

Les deux `extern` désignent exclusivement les adresses d'appels vérifiées. Leur `uint32_t` représente une capture de **tout EAX** après l'appel, même si le helper n'a pas de retour C significatif. Leurs corps, types source et effets mémoire restent opaques. Aucun helper supplémentaire ni appel de bibliothèque n'est introduit.

## C complet

```c
#include <limits.h>
#include <stddef.h>
#include <stdint.h>

#if defined(_MSC_VER) && defined(_M_IX86)
# define FF8_CDECL __cdecl
#elif defined(__i386__) && (defined(__GNUC__) || defined(__clang__))
# define FF8_CDECL __attribute__((cdecl))
#else
# error "This model requires a 32-bit x86 C implementation."
#endif

_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(uint8_t) == 1, "u8 width");
_Static_assert(sizeof(uint32_t) == 4, "u32 width");
_Static_assert(sizeof(int) == 4, "x86 integer promotions");
_Static_assert(sizeof(void *) == 4, "32-bit native pointers");
_Static_assert(sizeof(uintptr_t) == 4, "32-bit address conversion");

/* Partial storage views, NOT recovered original structure definitions.
 * Packing permits the unaligned accesses supported by native x86.
 * In particular, this 0x78-byte prefix is NOT an assertion of record stride.
 */
#pragma pack(push, 1)
typedef struct {
    uint8_t  opaque_00_03[4];
    uint8_t  byte_04;
    uint8_t  opaque_05_73[0x6F];
    uint32_t p32_74;
} View_00509C80_arg;

typedef struct {
    uint8_t byte_00;
    uint8_t opaque_01_02[2];
    uint8_t byte_03;
} View_00509C80_pointed;
#pragma pack(pop)

_Static_assert(offsetof(View_00509C80_arg, byte_04) == 0x04,
               "argument byte offset");
_Static_assert(offsetof(View_00509C80_arg, p32_74) == 0x74,
               "argument pointer offset");
_Static_assert(sizeof(View_00509C80_arg) == 0x78, "partial prefix size");
_Static_assert(offsetof(View_00509C80_pointed, byte_00) == 0x00,
               "pointed first byte offset");
_Static_assert(offsetof(View_00509C80_pointed, byte_03) == 0x03,
               "pointed destination byte offset");

/* Native address bindings. These signatures describe the observed stack
 * arguments plus full machine EAX-out, not authenticated source prototypes.
 * Implementations are external to this target and must not be fabricated.
 */
extern uint32_t FF8_CDECL sub_00509C10(void *arg0);
extern uint32_t FF8_CDECL sub_00505CB0(void *arg0, uint32_t arg1_bits);

/* Model interface only: the native function has ONE stack argument.
 * eax_at_entry is the incoming EAX observation supplied by a caller/harness.
 * The result is the outgoing EAX observation, not a claimed semantic result.
 */
uint32_t FF8_CDECL C_model_00509C80(void *arg0, uint32_t eax_at_entry)
{
    volatile View_00509C80_arg *const arg =
        (volatile View_00509C80_arg *)arg0;
    uint32_t eax = eax_at_entry;

    /* 00509C85..00509C89: BYTE CMP + JNB, therefore unsigned. */
    if ((uint32_t)arg->byte_04 >= UINT32_C(0x10))
        return eax;

    /* 00509C8B..00509C8C: PUSH arg0; CALL 00509C10. */
    eax = sub_00509C10(arg0);

    /* 00509C91: this DWORD load is AFTER the helper, which may mutate it. */
    const uint32_t p32 = arg->p32_74;
    volatile View_00509C80_pointed *const p =
        (volatile View_00509C80_pointed *)(uintptr_t)p32;

    /* 00509C97..00509C9C: test the stored BYTE, not all of EDX. */
    if (p->byte_03 != 0) {
        /* 00509C9E/00509CA1: XOR EDX,EDX; MOV DL,[ECX].
         * The intervening POP ESI restores the saved native register.
         */
        uint32_t edx = (uint32_t)p->byte_00;

        /* 00509CA3: SUB EDX,EAX; modulo 2^32, without signed UB. */
        edx = (uint32_t)(edx - eax);

        /* 00509CA5: NEG EDX sets CF iff its INPUT is nonzero.
         * This is NOT the borrow from the preceding SUB.
         */
        const uint32_t neg_cf =
            (edx != UINT32_C(0)) ? UINT32_C(1) : UINT32_C(0);
        edx = (uint32_t)(UINT32_C(0) - edx);

        /* 00509CA7: SBB DL,DL changes ONLY the low byte of EDX. */
        const uint8_t new_dl = (uint8_t)(UINT32_C(0) - neg_cf);
        edx = (edx & UINT32_C(0xFFFFFF00)) | (uint32_t)new_dl;

        /* 00509CA9..00509CAB: full DWORD AND, then BYTE store. */
        edx &= eax;
        p->byte_03 = (uint8_t)edx;
        return eax;                    /* 00509CAE; EAX unchanged */
    }

    /* 00509CAF..00509CB5: zero-extended BYTE vs the FULL helper EAX. */
    if ((uint32_t)p->byte_00 != eax) {
        /* 00509CB7..00509CBE: PUSH EAX; PUSH arg0; CALL; ADD ESP,8. */
        eax = sub_00505CB0(arg0, eax);
    }

    return eax;                        /* 00509CC1..00509CC2 */
}
```

`volatile` impose les accès explicites du modèle ; ce n'est pas une affirmation de qualification `volatile` dans le programme d'origine. Les vues supposent l'espace d'adressage plat little-endian x86 de la cible et des objets mémoire ordinaires valides. Aucune garde null/bounds, normalisation de valeur, cache pré-appel de `p32_74` ou réduction prématurée de EAX à un octet n'a été ajoutée. Ce C ne modélise pas les faults, les signaux/interleavings, EFLAGS sortants ou l'aliasing hostile avec les slots de retour/sauvegarde de la pile native.

## Preuves et couverture

Références abrégées : `R = inputs/ff8-decomp-semantics-20261011-r01/g17/0x509C80.readable/` ; `P = inputs/ff8-decomp-semantics-20261011-r01/g17/0x509C80.json`.

| Bloc natif demi-ouvert | Instructions | Raccord C / preuve |
|---|---:|---|
| `[509C80,509C8B)` | 4 | Chargement de l'argument et garde unsigned ; `R/asm-001.txt:1–4`, octets `80 7E 04 10 73 36`. |
| `[509C8B,509C9E)` | 7 | Premier appel puis relecture DWORD `arg+74`, lecture/test BYTE `p+3` ; `R/asm-001.txt:5–11`. |
| `[509C9E,509CAF)` | 9 | Zéro-extension, SUB/NEG/SBB partiel/AND, store BYTE, retour ; `R/asm-001.txt:12–20`. |
| `[509CAF,509CB7)` | 4 | Zéro-extension et égalité DWORD, pas égalité AL ; `R/asm-001.txt:21–24`. |
| `[509CB7,509CC1)` | 4 | Deux arguments, appel `505CB0`, nettoyage de 8 octets ; `R/asm-001.txt:25`, `R/asm-002.txt:1–3`. |
| `[509CC1,509CC3)` | 2 | Restauration ESI et RET ; `R/asm-002.txt:4–5`. |

- CFG complet : `P:19–60`, aussi `R/metadata.json:11–52`. Les trois lignes de `R/bytes-001.txt:1–3` couvrent sans intervalle le chunk annoncé à `P:12–16`.
- Appel `509C8C` : `E8 7F FF FF FF`, cible `509C91 - 0x81 = 509C10`.
- Appel `509CB9` : `E8 F2 BF FF FF`, cible `509CBE - 0x400E = 505CB0`.
- Aucun appel indirect, accès absolu à un global, shift, division, signe étendu, AL/AX écrit ou bibliothèque dans ce chunk. EAX doit néanmoins rester **32 bits** après les appels. DL est le seul sous-registre modifié par l'arithmétique locale.

### Séquence surprenante : conservation, pas correction intuitive

Soit `A` le DWORD EAX issu de `509C10`, et `B = zéro-extension(p[0])`. Sur le chemin où `p[3]` était non nul :

1. `D = (B - A) mod 2^32` ; `NEG` donne `(-D) mod 2^32`, avec `CF = (D != 0)`.
2. `SBB DL,DL` met uniquement DL à `0xFF` si CF, sinon à zéro ; les 24 bits supérieurs restent ceux du NEG.
3. Le DWORD est ANDé avec `A`, puis seul DL est écrit à `p[3]`.

Le store se réduit donc algébriquement à **`B == A ? 0 : (uint8_t)A`**, pas à un booléen et pas à `(uint8_t)B != (uint8_t)A`. Le code conserve cependant les étapes et les bits supérieurs intermédiaires. Le CF utile est celui de **NEG**. Aucun cas `0x80000000` n'introduit d'overflow C signé : tous les calculs sont unsigned.

### ABI et pile

- `56 8B 74 24 08` : `PUSH ESI`, puis argument lu à `[ESP+8]`, c'est-à-dire `[ESP_entrée+4]` ; aucun local natif alloué.
- ESI est sauvegardé et restauré sur chaque sortie. Sur le chemin store, le `POP ESI` est **avant** `MOV DL,[ECX]` (`509CA0`), pas à l'épilogue commun.
- Premier appel : un slot DWORD poussé, `ADD ESP,4` à `509C94`. Second appel : EAX poussé d'abord, pointeur ensuite ; slots `(arg0, EAX_32)` vus par le callee, `ADD ESP,8` à `509CBE`.
- En supposant les helpers compatibles avec ce caller-cleanup, tous les chemins retrouvent ESP d'entrée avant leur `RET`. Le retour retire uniquement l'adresse de retour, pas l'argument du présent appel. Cette observation supporte une liaison cdecl, sans prouver les prototypes source ni exclure un contrat de registres non documenté dans les helpers manquants.

| Chemin | EAX machine à la sortie |
|---|---|
| `arg[4] >= 0x10` | EAX d'entrée inchangé. |
| `arg[4] < 0x10`, `p[3] != 0` | EAX de `509C10`, indépendamment du BYTE stocké. |
| `arg[4] < 0x10`, `p[3] == 0`, `zext(p[0]) == EAX` | EAX de `509C10`. |
| `arg[4] < 0x10`, `p[3] == 0`, inégalité DWORD | EAX de `505CB0`, laissé tel quel. |

## Limites et validations à faire par le lead

- Les paquets natifs des helpers `509C10` et `505CB0` ne sont pas fournis ; `common-compaction.md:26,38` le signale. Aucune plage de retour, pureté, garantie de non-aliasing ou finalité métier n'est déduite de leurs labels. Les interfaces externes sont des frontières machine, pas des corps reconstruits.
- Les huit xrefs entrants (`P:62–110`) n'apportent pas ici l'ASM des consommateurs de EAX. Demande de validation au lead : vérifier leur usage de EAX et les ABI des deux helpers avant de choisir un prototype natif directement intégrable.
- Vérification effectuée : lecture complète du gel, confrontation manuelle des 30 instructions et des octets des deux CALL / des opérations de largeur sensible ; couverture manuelle des six blocs et bilan de pile. Ce n'est pas une validation finale §5.6.
- **Non exécutés** : compilation, link, tests, différentiel natif/émulateur, hash indépendant des fichiers, inspection IDB, live, review croisée ou intégration. Aucun PASS annoncé.
- Cas proposés pour une validation séparée : garde `0x0F/0x10/0xFF`, pointeur `+74` modifié par le premier helper, `p[3]` nul/non nul, `A == zext(p[0])`, même octet bas mais DWORD différent (`A=0x107`, `p[0]=7`), `A=0x100` avec inégalité, `A=0x80000000/0xFFFFFFFF`, et conservation des EAX d'entrée/de second appel selon la table ci-dessus. Ce sont des demandes de test, pas des résultats exécutés.

Aucune lecture de production voisine, de C antérieur, de ledger ou de résultat d'un autre volet. Seul ce livrable est écrit.
