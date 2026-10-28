# C B indépendant — 0x00495D80

## Périmètre et provenance

- Tâche : `task_mv44seg7_00ax_4z2amv`, session `resume-canary-495d80-b`.
- Entrée : `inputs/ff8-decomp-semantics-20261011-r01/g14/0x495D80.json`.
  SHA-256 cité du manifeste, validé par le parent :
  `862f2ad69328e5f7b6edf55f2758945567bbedec39d64efd8db945c141c4ad7b`.
- Compaction commune : `common-compaction.md`, SHA-256 cité
  `1972f7b1c746b0faf2526a5bbd825130cf653de28074b5ba617852d5661d6c0c`.
- Binaire indiqué par le gel : FF8_EN.exe, x86 32 bits, SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` ;
  export `2026-10-11T16:38:25.140966+00:00`.
- Lecture intégrale de `0x495D80.readable/{manifest.json,metadata.json,asm-001.txt,
  asm-002.txt,asm-003.txt,asm-004.txt,asm-005.txt,bytes-001.txt}`.
  La ligne ASM du JSON est tronquée par l'outil de lecture ; les cinq projections
  verbatim fournissent ses **101 instructions complètes**. Un chunk unique :
  `[0x00495D80,0x00495EB3)`, **307 octets**, **18 blocs CFG**.
- Approbation du préflight puis GO d'écriture reçus du lead. Aucun résultat A,
  sémantique, R, ancien C cible, ledger ou index de résultats consulté.
  Le checkpoint de découverte hérité a été conservé, sans recherche alternative.
- Ce dépôt n'est ni une promotion ni une validation parent. Les hashes sont
  rapportés depuis le manifeste ; je n'ai pas exécuté de calcul de hash local.

## Contrat du C et ABI

Le C ci-dessous est une transcription à adresses virtuelles natives, pour une
cible C11 **x86 32 bits little-endian** où ces adresses sont effectivement mappées.
Ce n'est pas un programme exécutable autonome : les deux callees natifs observés
restent externes. Aucun comportement interne ne leur est inventé.

`sub_00495D80` prend le motif de 32 bits situé à l'entrée à `[ESP+4]`. `RET` est
sans immédiat : la fonction ne dépile pas cet argument. EBX, EBP, ESI et EDI sont
sauvés/restaurés ; elle réserve 12 octets locaux. L'interface `__cdecl` exprime
cette disposition. L'intention signé/non signé de l'identifiant n'est pas établie :
`uint32_t` conserve ses bits et les calculs d'adresse modulo 2^32, sans inventer
une borne 0..15 ni un traitement de sentinelle.

Les declarations externes sont des **interfaces de transcription des deux slots
stack observés**, pas des prototypes source validés :

| CALL | `[ESP+4]` chez le callee | `[ESP+8]` chez le callee | Résultat utilisé |
|---|---|---|---|
| `00495DBC -> 004960C0` | dword lu initialement à `P+0x0C` | identifiant brut | AL |
| `00495E49 -> 00496120` | octet `Q+8`, étendu par zéro | identifiant brut | AX, étendu avec signe |

Chaque caller nettoie 8 octets après son CALL. Les corps des callees ne sont pas
dans le gel : l'absence d'autres paramètres implicites de registre, la convention
ordinaire de préservation des registres non volatils et leur prototype source
restent à confirmer par le parent. Déclarer leur retour `uint32_t` ne prétend pas
que leurs 32 bits sont un résultat sémantique : seuls AL/AX sont consommés ici.

La valeur renvoyée par ce C est le **motif EAX observé à RET**, non un type de
retour métier prétendument retrouvé. `MOV EAX,P` à `00495E7A` est suivi seulement
de `MOV AX,[EAX+0x12]` pour modifier EAX :

`EAX_ret = (P & 0xFFFF0000) | word_relu_a_P_plus_0x12`.

Il serait incorrect de remplacer cela silencieusement par un retour zéro-étendu
de la word, ou par un résultat de callee. Les callers gelés ne sont pas fournis
en ASM ici ; ils ne prouvent pas que ce résidu EAX est un retour utilisé.

## C complet

Les fonctions `ff8_*` définies dans ce bloc sont seulement des notations locales
pour accès mémoire et opérations entières ; ce ne sont pas des callees ajoutés
au graphe natif. Les seules fonctions externes correspondent aux deux CALL.
Les accès volatils conservent les lectures, écritures et relectures explicites.
Le contrat de mémoire suppose des objets accessibles aux largeurs indiquées,
sans recouvrement avec la pile active, sans accès concurrent/MMIO et sans faute.
Les accès 16/32 bits calculés ici sont naturellement alignés. La représentation
des données à adresses fixes et leur effective type relèvent de l'environnement
de liaison natif, pas d'une garantie d'ISO C sur une machine quelconque.

```c
#include <stdint.h>
#include <limits.h>

#if defined(_MSC_VER) && defined(_M_IX86)
# define FF8_CDECL __cdecl
#elif defined(__i386__) && (defined(__GNUC__) || defined(__clang__))
# define FF8_CDECL __attribute__((__cdecl__))
#else
# error "This fixed-VA transcription requires a 32-bit x86 C target."
#endif

_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(int) == 4, "32-bit int required");
_Static_assert(sizeof(uintptr_t) == 4, "32-bit virtual addresses required");

/* Raw observed stack arguments and EAX bits; source prototypes unconfirmed. */
extern uint32_t FF8_CDECL sub_004960C0(uint32_t arg0, uint32_t arg1);
extern uint32_t FF8_CDECL sub_00496120(uint32_t arg0, uint32_t arg1);

static uint8_t ff8_r8(uint32_t va)
{
    return *(volatile uint8_t *)(uintptr_t)va;
}

static uint16_t ff8_r16(uint32_t va)
{
    return *(volatile uint16_t *)(uintptr_t)va;
}

static uint32_t ff8_r32(uint32_t va)
{
    return *(volatile uint32_t *)(uintptr_t)va;
}

static void ff8_w8(uint32_t va, uint8_t value)
{
    *(volatile uint8_t *)(uintptr_t)va = value;
}

static void ff8_w16(uint32_t va, uint16_t value)
{
    *(volatile uint16_t *)(uintptr_t)va = value;
}

static void ff8_w32(uint32_t va, uint32_t value)
{
    *(volatile uint32_t *)(uintptr_t)va = value;
}

/* Exact sign interpretations, without out-of-range unsigned-to-signed casts. */
static int32_t ff8_s16(uint32_t bits)
{
    return (int32_t)(bits & UINT32_C(0x7FFF))
         - (int32_t)(bits & UINT32_C(0x8000));
}

static int64_t ff8_s32(uint32_t bits)
{
    return (int64_t)(bits & UINT32_C(0x7FFFFFFF))
         - (int64_t)(bits & UINT32_C(0x80000000));
}

/* Fixed counts used by the native instructions; no C negative right shift. */
static uint32_t ff8_sar32_5(uint32_t bits)
{
    return (bits >> 5)
         | ((bits & UINT32_C(0x80000000)) != 0
            ? UINT32_C(0xF8000000) : UINT32_C(0));
}

static uint16_t ff8_sar16_2(uint16_t bits)
{
    return (uint16_t)(((uint32_t)bits >> 2)
         | (((uint32_t)bits & UINT32_C(0x8000)) != 0
            ? UINT32_C(0xC000) : UINT32_C(0)));
}

uint32_t FF8_CDECL sub_00495D80(uint32_t id_bits)
{
    /* 00495D80..00495DAC: original index, 17*index and 3*index, all mod 2^32. */
    const uint32_t index17 = (id_bits << 4) + id_bits;
    const uint32_t index3 = id_bits + id_bits * UINT32_C(2);
    const uint32_t xp_before_call =
        ff8_r32(UINT32_C(0x01CFDCB4) + index17 * UINT32_C(4));
    const uint32_t p = UINT32_C(0x01CFDCA8) + index17 * UINT32_C(4);
    const uint32_t q = UINT32_C(0x01CFF618) + index3 * UINT32_C(4);

    /* 00495DB0..00495DC1: these stores precede the first native call. */
    ff8_w8(q + UINT32_C(0x0B), UINT8_C(0));
    ff8_w8(q + UINT32_C(0x09), UINT8_C(0));
    ff8_w8(q + UINT32_C(0x0A), UINT8_C(100));
    {
        const uint32_t raw_eax = sub_004960C0(xp_before_call, id_bits);
        ff8_w8(q + UINT32_C(8), (uint8_t)raw_eax);  /* AL only */
    }

    /* 00495DC4..00495DD9: reread P+0x0C after CALL and the AL store. */
    {
        const uint32_t xp_after_call = ff8_r32(p + UINT32_C(0x0C));
        ff8_w32(q + UINT32_C(4), xp_after_call);
    }
    uint32_t bitmap_va = p + UINT32_C(0x1C);
    uint32_t table_base = UINT32_C(0x01CF812E);   /* immediate at 00495DD0 */
    uint32_t groups_left = UINT32_C(2);

    do {
        /* 00495DE1..00495DEA: snapshot each bitmap dword once. */
        uint32_t bits = ff8_r32(bitmap_va);
        uint32_t row = table_base;
        uint32_t bits_left = UINT32_C(32);
        table_base += UINT32_C(0x100);

        do {
            /* 00495DF0..00495E01: signed JL/JGE address comparisons. */
            if ((bits & UINT32_C(1)) != 0
                && ff8_s32(row) >= INT64_C(0x01CF81C6)
                && ff8_s32(row) <  INT64_C(0x01CF820E)) {
                /* 00495E03..00495E0B: flag read/store, THEN selector read. */
                const uint8_t flags = ff8_r8(row - UINT32_C(1));
                const uint8_t previous_flags = ff8_r8(q + UINT32_C(0x0B));
                ff8_w8(q + UINT32_C(0x0B), (uint8_t)(previous_flags | flags));
                const uint8_t selector = ff8_r8(row);

                if (selector == UINT8_C(0)) {
                    /* 00495E0F..00495E15: BL temporary; EBX then restored. */
                    const uint8_t increment = ff8_r8(row + UINT32_C(1));
                    const uint8_t old_value = ff8_r8(q + UINT32_C(9));
                    ff8_w8(q + UINT32_C(9), (uint8_t)(old_value + increment));
                    /* id_bits remains the original stack argument. */
                }
                if (selector == UINT8_C(1)) {
                    /* 00495E19..00495E21: byte addition, modulo 256. */
                    const uint8_t increment = ff8_r8(row + UINT32_C(1));
                    const uint8_t old_value = ff8_r8(q + UINT32_C(0x0A));
                    ff8_w8(q + UINT32_C(0x0A),
                           (uint8_t)(old_value + increment));
                }
            }
            /* 00495E24..00495E2A: unsigned SHR, stride 8, exactly 32 bits. */
            bits >>= 1;
            row += UINT32_C(8);
            --bits_left;
        } while (bits_left != 0);

        /* 00495E2C..00495E40: stack-saved pointer/count, two groups total. */
        bitmap_va += UINT32_C(4);
        --groups_left;
    } while (groups_left != 0);

    /* 00495E42..00495E59: argument is zero-extended byte; return is signed AX. */
    const uint32_t second_arg0 = (uint32_t)ff8_r8(q + UINT32_C(8));
    const uint32_t second_eax = sub_00496120(second_arg0, id_bits);
    const int32_t signed_ax = ff8_s16(second_eax);
    const uint32_t factor = (uint32_t)ff8_r8(q + UINT32_C(0x0A));
    const uint32_t product_bits =
        (uint32_t)((int64_t)signed_ax * (int64_t)factor);

    /* 00495E5C..00495E6B: exact signed IMUL high half, SAR 5, sign correction. */
    const int64_t wide_product =
        INT64_C(0x51EB851F) * ff8_s32(product_bits);
    const uint32_t edx_high = (uint32_t)((uint64_t)wide_product >> 32);
    uint32_t scaled_bits = ff8_sar32_5(edx_high);
    scaled_bits += scaled_bits >> 31;

    /* 00495E6D..00495E75: signed upper cap only; NO lower clamp. */
    if (ff8_s32(scaled_bits) > INT64_C(9999))
        scaled_bits = UINT32_C(9999);

    /* 00495E7A..00495E8F: signed narrowed DX versus zero-extended old word. */
    const uint16_t new_word = (uint16_t)scaled_bits;
    const int32_t signed_new_word = ff8_s16((uint32_t)new_word);
    const uint16_t old_p_word = ff8_r16(p + UINT32_C(0x12));
    ff8_w16(q + UINT32_C(2), new_word);
    if (signed_new_word < (int32_t)old_p_word)
        ff8_w16(p + UINT32_C(0x12), new_word);

    /* 00495E93..00495EA5: reread, MOV AX (not MOVZX EAX), then 16-bit SAR. */
    const uint16_t final_ax = ff8_r16(p + UINT32_C(0x12));
    ff8_w16(q, final_ax);
    const uint16_t reloaded_dx = ff8_r16(q + UINT32_C(2));
    const uint16_t threshold_dx = ff8_sar16_2(reloaded_dx);
    if (ff8_s16((uint32_t)final_ax) < ff8_s16((uint32_t)threshold_dx)) {
        /* 00495EA7: byte OR, no write at all on the other branch. */
        const uint8_t previous_flags = ff8_r8(q + UINT32_C(0x0B));
        ff8_w8(q + UINT32_C(0x0B), (uint8_t)(previous_flags | UINT8_C(0x80)));
    }

    /* 00495EAB..00495EB2: restore nonvolatiles, free locals, plain RET. */
    return (p & UINT32_C(0xFFFF0000)) | (uint32_t)final_ax;
}
```

## Largeurs, ordre des effets et preuves natives

Les références `A1`..`A5` désignent les cinq fichiers `asm-00N.txt` du gel ; `B`
désigne `bytes-001.txt`. Ce sont des références aux fichiers réellement lus,
pas à une base IDA interrogée pendant cette production.

| Point | Preuve et conséquence conservée |
|---|---|
| Adresses/strides | `00495D8B..00495DA3` (`A1:6-13`, `B:1-2`) : `(id<<4)+id`, puis scale 4 => stride 68 ; `id+2*id`, puis scale 4 => stride 12. `8D 34 8D 18 F6 CF 01` impose **0x01CFF618**, pas 0x01CFF318. Lecture initiale XP : déplacement `B4 DC CF 01`, donc `P+0x0C`. |
| Premier CALL | `00495DAA..00495DCD` (`A1:14-25`) : XP capturé avant trois stores, AL stocké au retour, XP relu après le CALL ; ne pas réutiliser la première lecture. `E8 FF 02 00 00` à DBC cible exactement `004960C0`. |
| Table/bitmap | `00495DD0..00495E40` (`A2:1-25`, `A3:1-11`, `B:3-6`) : immédiat `BD 2E 81 CF 01`, deux dwords `P+0x1C/P+0x20`, 32 tours chacun, base += 0x100, curseur += 8, SHR logique. Pas un scan des 16 octets entiers du champ historique. |
| Filtrage signé | `00495DF5..00495E01` (`A2:10-13`) : `JL` puis `JGE` ; `[0x01CF81C6,0x01CF820E)`. Pour ces constantes, seules les itérations 19..27 du scan concaténé numéroté 0..63 entrent ; ceci ne nomme pas des IDs métier. Le second dword est néanmoins lu et parcouru. Le C ne le supprime pas. |
| Octets | `00495E03..00495E21` (`A2:14-25`) : OR de `row[-1]` avant lecture du sélecteur ; sélecteur 0 => addition à `Q+9`, 1 => addition à `Q+0x0A`. Troncature modulo 256, sans saturation ni propagation vers l'octet voisin. Le remplacement temporaire de BL est suivi de la restauration EBX depuis l'argument stack. |
| Deuxième CALL | `00495E42..00495E56` (`A3:12-20`) : XOR EDX puis DL => argument 0..255, `E8 D2 02 00 00` cible `00496120`, puis `0F BF C8` => **MOVSX ECX,AX**. Le facteur est relu après ce CALL. |
| Multiplication/division | `00495E59..00495E6B` (`A3:21-25`, `A4:1-2`, `B:7-8`) : IMUL deux opérandes, IMUL signé une opérande par `0x51EB851F`, haut signé, SAR 5, ajout du signe logique. L'entrée signée AX multipliée par un octet zéro-étendu est dans `[-8355840,8355585]` : pas de débordement signé 32 bits à ce premier produit. Le C garde néanmoins le motif bas 32 bits et le vrai haut du produit suivant, sans division flottante ni shift C négatif. |
| Plafond et narrowing | `00495E6D..00495E8F` (`A4:3-13`) : plafond **signé** 9999 seulement ; puis DX tronqué à 16 bits et étendu avec signe pour comparaison à une word **zéro-étendue**. Une valeur négative n'est ni interdite ni réparée ; son narrowing peut changer le signe. Lecture de l'ancienne word avant écriture `Q+2`. |
| Tail/retour | `00495E93..00495EB2` (`A4:14-25`, `A5:1`, `B:9-10`) : relecture de la word à `P+0x12`, écriture à `Q+0`, relecture `Q+2`, **SAR DX,2** 16 bits, comparaison signée **AX/DX**. OR 0x80 seulement si strictement inférieur. `66 8B 40 12` modifie AX, pas tout EAX ; sa moitié haute vient du pointeur P. |

### Stack native

Soit `S` l'ESP d'entrée et `T = S-0x1C` après réservation de 12 octets et les
quatre PUSH non volatils. Hors arguments temporaires de CALL :

| Adresse | Contenu |
|---|---|
| `T+0x00 / +0x04 / +0x08 / +0x0C` | EDI / ESI / EBP / EBX sauvegardés |
| `T+0x10 = S-0x0C` | pointeur bitmap, initialement `P+0x1C`, avancé de 4 |
| `T+0x14 = S-0x08` | compteur externe, initialement 2 |
| `T+0x18 = S-0x04` | pointeur P sauvegardé à `00495DAC` |
| `T+0x1C = S` | adresse de retour |
| `T+0x20 = S+4` | argument dword original |

À `00495DAC`, les deux arguments du premier CALL sont déjà empilés :
`[ESP+0x20] = [T+0x18]`, et non un argument supplémentaire. Les deux nettoyages
`ADD ESP,8` reviennent à T. Les quatre POP puis `ADD ESP,0x0C` restaurent S ;
`RET` ne nettoie pas l'argument. Le C ne cherche pas à imposer les offsets de
pile du compilateur : il conserve la durée de vie et les valeurs de ces locaux.

### Couverture des 18 blocs / chunk unique

Bornes exclusives issues de `metadata.json:11-145` :

| Bloc natif | Transcription |
|---|---|
| `495D80..495DE1` | calculs d'adresse, sauvegarde P, initialisations, premier CALL, copie dword et initialisation des boucles |
| `495DE1..495DF0` | snapshot bitmap, curseur, compte 32, base suivante |
| `495DF0..495DF5` | test du bit bas |
| `495DF5..495DFC` | borne signée basse |
| `495DFC..495E03` | borne signée haute exclusive |
| `495E03..495E0F` | OR flags, lecture/test sélecteur |
| `495E0F..495E19` | addition byte `Q+9`, conservation de l'identifiant original |
| `495E19..495E1E` | test sélecteur 1 |
| `495E1E..495E24` | addition byte `Q+0x0A` |
| `495E24..495E2C` | décalage bitmap et boucle interne |
| `495E2C..495E42` | avance du pointeur bitmap et boucle externe |
| `495E42..495E75` | second CALL, AX signé, multiplication/scaling, test plafond |
| `495E75..495E7A` | plafond 9999 |
| `495E7A..495E8F` | récupération P, lecture word, écriture `Q+2`, comparaison mixte |
| `495E8F..495E93` | écriture conditionnelle `P+0x12` |
| `495E93..495EA7` | word finale, copie, seuil SAR16, comparaison signée |
| `495EA7..495EAB` | OR 0x80 conditionnel |
| `495EAB..495EB3` | épilogue, EAX résiduel complet |

Aucune sortie précoce, aucun autre chunk, aucun CALL indirect dans le gel. Les
101 instructions, y compris setup/cleanup stack et restaurations, sont couvertes
par cette correspondance ; cela ne signifie pas une équivalence binaire du C.

## Incertitudes et validations non exécutées

1. **Adresse contradictoire dans le contexte historique** : la compaction,
   lignes 31-32, rapporte `0x01CFF318` dans un ledger historique. Les octets de la
   cible imposent `0x01CFF618` ; le C emploie exclusivement cette dernière. Aucun
   renommage, correction de gel ni choix fondé sur une intuition métier.
2. **Callees et callers non fournis en ASM** : leurs prototypes source,
   préconditions et effets internes ne sont pas validés. Le C conserve les deux
   appels, tous les arguments stack observés, les relectures après appel et les
   largeurs réellement consommées. Un ABI à registres implicites nécessiterait
   une adaptation parent documentée ; ne pas présenter les externs comme scellés.
3. **Pas de preuve de type source du retour** : le C expose le EAX résiduel pour
   ne pas le perdre. ECX et EDX sont des registres volatils, pas des retours C
   supplémentaires. En fin de corps natif, ECX contient la word antérieure
   zéro-étendue lue à E83 ; EDX conserve les 16 bits hauts du résultat plafonné et
   les 16 bits bas issus du SAR DX,2. Le C ne promet ni ces registres volatils ni
   EFLAGS ni une pile scratch byte-identique. Le dernier ADD ESP modifie aussi
   les flags avant RET. Si un caller s'appuie sur ces éléments non ABI, validation
   native/adaptateur requis.
4. **Environnement mémoire** : adresses absolues et valeurs non bornées restent
   telles quelles. Aucune garantie d'accès valide pour un identifiant arbitraire,
   aucun garde ajouté. La transcription n'est pas une émulation des fautes,
   interruptions, alias avec la pile/code ou modification concurrente. Le layout
   historique donne des noms de champs, pas une autorisation de changer les bytes.
5. **Vérifications effectuées** : lecture complète des projections, confrontation
   manuelle des immédiats et instructions déterminantes aux octets, suivi manuel
   des branches, de la pile, des tailles et du EAX final. Pas de décodeur indépendant
   exécuté ; pas de revalidation locale des hashes.
6. **Non exécuté** : compilation, test unitaire, harness différentiel, exécution
   x86, review indépendante, IDB/readback et intégration. À demander au parent :
   liaison/ABI des deux callees ; comparaison mémoire/EAX contre le natif sur les
   branches sélecteur 0/1/autre, wrap des octets, bornes du filtre, AX négatif,
   plafond 9999, narrowing signé et seuil SAR16. Ce sont des besoins de validation,
   **pas des PASS**.
