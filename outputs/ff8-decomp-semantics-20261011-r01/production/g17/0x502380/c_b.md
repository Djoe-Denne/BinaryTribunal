# 0x502380 — candidat C B indépendant

Mission `ff8-decomp-semantics-20261011-r01`, groupe g17 ; tâche `task_mv44sepx_00b3_ikk28x`. Auteur `pool-199`, volet C B uniquement. Modèle effectif annoncé vérifié par le parent : `openai/gpt-6-astra`, `xhigh` ; les anciennes chaînes du ticket ne sont pas utilisées comme overrides.

## Sources et statut

Chemins ci-dessous relatifs à `inputs/ff8-decomp-semantics-20261011-r01/g17/` :

- Projection `0x502380.readable/manifest.json`, `metadata.json`, **tous** `asm-001.txt` à `asm-010.txt`, **tous** `bytes-001.txt` et `bytes-002.txt` lus. Paquet source SHA256 cité : `1955590faeb8479a4a74ef892a9aff80681522f6abb4285ebd55f725551fff09`.
- `common-compaction.md`, SHA256 cité : `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.
- Supplément commun **v1** : `0x502380.supplemental-v1/{manifest.json,table.json,provenance.json,dispatch.txt}`, tous lus. SHA256 du manifeste communiqué par le parent : `0c2eb97f4f4383e93d478b3faf532024b03cea2fea4aaff0315424b8997cc861`. SHA256 des **72 octets de table** : `c0e337fcad03168079cbd7575dc3582d1631773094eaba3ff071cbf08e327bf0`. SHA256 du **fichier table.json**, distinct : `61ca1118a8789ad29c5a57af70859f5c391a8b65266385da5415a1bb27d35a9c`.
- Exécutable identifié : SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, x86 32 bits. Le supplément rapporte une capture statique le `2026-10-12T16:38:11.584995+00:00`, une égalité corps gelé/IDB/PE et table IDB/PE. Ce sont des attestations du parent dans `provenance.json`, **pas des vérifications IDB/PE exécutées par cet auteur**.

Le corps est fourni intégralement ci-dessous. Couverture statique : 243 instructions, un chunk `[0x502380,0x502628)` de 680 octets, 36 blocs CFG ; table séparée `[0x502628,0x502670)` de 72 octets. SHA256 des 680 octets cité de `provenance.json:15` : `fb2f2332c69db87347f0347ac2543c81b37ce378c0ad7ac5736249894147608e`. La correspondance de dispatch est maintenant étayée par les octets du supplément, non par les commentaires IDA. Les ABI exactes des callees restent des contrats externes à confirmer. Ce candidat n'est ni compilé, ni exécuté, ni promu.

## Contrat de représentation C

- `u32` représente indifféremment un registre, une adresse virtuelle 32 bits ou un slot d'argument brut ; aucun pointeur d'objet hôte 64 bits n'est substitué à une adresse x86. Les calculs d'adresse sont modulo `2^32`.
- C volontairement **ciblé x86 Win32 little-endian**, mémoire adressable native, accès WORD/DWORD éventuellement non alignés, compilation sans optimisations fondées sur le strict aliasing des vues de mémoire brute. Les helpers d'accès sont des notations locales d'instructions mémoire, **pas de nouveaux callees du binaire**. Les accès `volatile` conservent les lectures/écritures explicites et évitent de réutiliser une lecture à travers un helper natif.
- Le contrat n'est pas une émulation des fautes, de la concurrence, des interruptions ou des accès à la pile au-delà des arguments. Aucune vérification de validité, borne d'index ou allocation réussie n'est ajoutée.
- Les dix déclarations externes correspondent exactement aux dix cibles directes E8 du gel. Les noms par EA servent d'identifiants de liaison ; ils ne prouvent aucune finalité métier. `u32` en retour expose le contenu EAX lorsqu'il est consommé, sans affirmer un résultat métier pour les appels dont EAX est ignoré. Tous les arguments sont les DWORD poussés, y compris un WORD signé étendu ou un EAX partiellement remplacé.
- `FF8_CDECL` exprime le nettoyage par l'appelant observé. Il suppose que les callees respectent les non-volatiles EBX/ESI/EDI et ne prennent pas d'arguments cachés en registres ou au-delà des slots documentés. Leurs corps complets ne sont pas fournis ; ce point reste une limite, pas un ABI authentifié par les labels.

## C complet

```c
#include <stdint.h>
#include <limits.h>

typedef uint8_t  u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef u32 a32;

_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(u16) == 2 && sizeof(u32) == 4,
               "native operand widths required");
_Static_assert(sizeof(uintptr_t) == 4, "32-bit native address model required");

#if defined(_MSC_VER) && defined(_M_IX86)
# define FF8_CDECL __cdecl
#elif defined(__GNUC__) && defined(__i386__)
# define FF8_CDECL __attribute__((cdecl))
#else
# error Build this native-address reconstruction for x86-32.
#endif

/* Local memory notation, not calls to additional binary functions.
 * Requires the raw-memory/unaligned/aliasing contract described above. */
static inline u8 r8(a32 p)
{
    return *(volatile u8 *)(uintptr_t)p;
}

static inline u16 r16(a32 p)
{
    return *(volatile u16 *)(uintptr_t)p;
}

static inline u32 r32(a32 p)
{
    return *(volatile u32 *)(uintptr_t)p;
}

static inline void w8(a32 p, u8 v)
{
    *(volatile u8 *)(uintptr_t)p = v;
}

static inline void w16(a32 p, u16 v)
{
    *(volatile u16 *)(uintptr_t)p = v;
}

static inline void w32(a32 p, u32 v)
{
    *(volatile u32 *)(uintptr_t)p = v;
}

/* MOVSX r32, r/m16, expressed as a 32-bit register bit pattern.
 * No implementation-defined conversion to a signed narrow type. */
static inline u32 sx16_bits(u16 v)
{
    u32 x = (u32)v;
    return x | ((0u - (x >> 15)) & UINT32_C(0xFFFF0000));
}

/* LEA 5*i; SHL 3; SUB i; LEA base+4*t, all modulo 2^32. */
static inline a32 record_address(u32 signed_index_bits)
{
    return UINT32_C(0x01D972C0) + signed_index_bits * UINT32_C(0x9C);
}

/* Link these symbols to the indicated native EAs or ABI-correct wrappers.
 * No stubs, inferred library routines, or invented native callees. */
extern u32 FF8_CDECL fn_500DD0(u32 callback_ea);
extern u32 FF8_CDECL fn_5027D0(u32 arg0);
extern u32 FF8_CDECL fn_503190(u32 arg0, u32 arg1, u32 arg2);
extern u32 FF8_CDECL fn_505C00(u32 arg0, u32 arg1);
extern u32 FF8_CDECL fn_5085D0(u32 arg0);
extern u32 FF8_CDECL fn_509BA0(u32 arg0, u32 arg1);
extern u32 FF8_CDECL fn_509C80(u32 arg0);
extern u32 FF8_CDECL fn_509CD0(u32 arg0, u32 arg1);
extern u32 FF8_CDECL fn_50A070(u32 arg0, u32 arg1, u32 arg2);
extern u32 FF8_CDECL fn_50A790(u32 arg0);

u32 FF8_CDECL fn_502380(a32 ctx)
{
    /* 502387 MOV CX,[ESI+2]; 50238B MOVSX EAX,CX;
     * 50238E ADD EAX,-0x66; 502394 unsigned JA. */
    const u16 opcode = r16(ctx + 2u);
    const u32 selector = sx16_bits(opcode) + UINT32_C(0xFFFFFF9A);

    if (selector > UINT32_C(0x11))
        return UINT32_C(0xF);                 /* 50261F */

    /* Positional cases below are decoded from the 18 LE DWORDs at 502628.
     * The original opcode is retained: CX is still used at 5025C8. */
    switch (selector) {
    case 0u: {                               /* 0x66 -> 5023A1 */
        a32 node = fn_500DD0(UINT32_C(0x00502670));
        w32(node + UINT32_C(0x10), ctx);      /* 5023AE */
        w8(node + UINT32_C(0x0D), 0u);        /* 5023B1: no NULL test */
        return 8u;
    }

    case 1u:                                 /* 0x67 -> 5023BE */
        (void)fn_5027D0(ctx);
        return UINT32_C(0xF);

    case 2u:                                 /* 0x68 -> 5023D0 */
        return fn_50A790(ctx);                /* full EAX forwarded */

    case 3u: {                               /* 0x69 -> 5023DD */
        u32 index = sx16_bits(r16(ctx + 8u));
        a32 record = record_address(index);
        u16 flags = r16(record);
        if ((flags & 2u) == 0u)              /* TEST AL,2; JZ 50261F */
            return UINT32_C(0xF);
        /* OR AL,10h then MOV [ECX],AX: original high byte retained. */
        w16(record, (u16)(flags | UINT16_C(0x0010)));
        a32 node = fn_500DD0(UINT32_C(0x00502ED0));
        w32(node + UINT32_C(0x10), ctx);
        w8(node + UINT32_C(0x0D), 0u);
        return 8u;
    }

    case 4u: {                               /* 0x6A -> 502422 */
        u32 index = sx16_bits(r16(ctx + 8u));
        a32 record = record_address(index);
        (void)fn_509CD0(record, 0u);
        /* 50243D is a NEW read after the callee, not the cached index. */
        index = sx16_bits(r16(ctx + 8u));
        record = record_address(index);
        (void)fn_505C00(record, 3u);
        return UINT32_C(0xF);
    }

    case 5u:                                 /* 0x6B -> 50261F */
        return UINT32_C(0xF);

    case 6u: {                               /* 0x6C -> 5024CF */
        a32 p = UINT32_C(0x01D972C8);
        /* Native EDI=0, ESI=base+8; ADD ESI,9Ch; INC EDI;
         * signed JL against 01D9749Ch: exactly three iterations. */
        for (u32 i = 0u; i != 3u; ++i, p += UINT32_C(0x9C)) {
            if ((r8(p - 8u) & 2u) != 0u)
                (void)fn_503190(i, UINT32_C(0x18), 1u);
            else
                w32(p, r32(p) | UINT32_C(0x01000000)); /* 5024EC */
        }
        return UINT32_C(0xF);
    }

    case 7u: {                               /* 0x6D -> 50250A */
        a32 p = UINT32_C(0x01D972C8);
        for (u32 i = 0u; i != 3u; ++i, p += UINT32_C(0x9C)) {
            if ((r8(p - 8u) & 2u) != 0u)
                (void)fn_503190(i, UINT32_C(0x18), 0u);
            else
                w32(p, r32(p) & UINT32_C(0xFEFFFFFF)); /* 502527 */
        }
        return UINT32_C(0xF);
    }

    case 8u: {                               /* 0x6E -> 502464 */
        u32 index = sx16_bits(r16(ctx + 8u));
        (void)fn_503190(index, UINT32_C(0x17), 1u);
        return UINT32_C(0xF);
    }

    case 9u: {                               /* 0x6F -> 502498 */
        u32 index = sx16_bits(r16(ctx + 8u));
        u32 arg1 = sx16_bits(r16(ctx + UINT32_C(0x0A)));
        a32 record = record_address(index);
        (void)fn_505C00(record, arg1);         /* do not truncate to BYTE */
        return UINT32_C(0xF);
    }

    case 10u:                                /* 0x70 -> 5024C2 */
        return fn_5085D0(ctx);                /* full EAX forwarded */

    case 11u: {                              /* 0x71 -> 502562 */
        a32 node = fn_500DD0(UINT32_C(0x00502F30)); /* shared 50256E */
        w32(node + UINT32_C(0x10), ctx);
        /* No store to node+0Dh on this arm. */
        return 8u;
    }

    case 12u: {                              /* 0x72 -> 50247E */
        u32 index = sx16_bits(r16(ctx + 8u));
        (void)fn_503190(index, UINT32_C(0x17), 0u);
        return UINT32_C(0xF);
    }

    case 13u: {                              /* 0x73 -> 502569 */
        a32 node = fn_500DD0(UINT32_C(0x00503040)); /* shared 50256E */
        w32(node + UINT32_C(0x10), ctx);
        /* No store to node+0Dh on this arm either. */
        return 8u;
    }

    case 14u: {                              /* 0x74 -> 502545 */
        a32 node = fn_500DD0(UINT32_C(0x00502F90));
        w32(node + UINT32_C(0x10), ctx);
        w8(node + UINT32_C(0x0D), 0u);
        return 8u;
    }

    case 15u: {                              /* 0x75 -> 502582 */
        u32 index = sx16_bits(r16(ctx + 8u));  /* EAX at 502582 */
        a32 object = r32(ctx + 4u);           /* new ESI, 502586 */
        u32 arg2 = r32(object + UINT32_C(0x0C));
        /* 502594 MOV AX,[ESI+82h] does NOT clear EAX[31:16].
         * The address computation used ECX, leaving EAX=index. */
        u32 arg1 = (index & UINT32_C(0xFFFF0000))
                 | (u32)r16(object + UINT32_C(0x82));
        a32 record = record_address(index);
        (void)fn_50A070(record, arg1, arg2);
        (void)fn_509C80(record);              /* saved EDI, no reindex */
        return UINT32_C(0xF);
    }

    case 16u:                                /* 0x76 -> 5025BC */
    case 17u: {                              /* 0x77 -> 5025BC */
        u32 index = sx16_bits(r16(ctx + 8u));
        a32 record = record_address(index);   /* saved EBX */
        u32 old_flags = r32(record + 8u);     /* saved EDI, BEFORE call */
        u32 count = (u32)r8(ctx + UINT32_C(0x0A)) & 31u;
        u32 bit = UINT32_C(1) << count;       /* x86 SHL r32,CL */
        u32 mask;
        if (opcode == UINT16_C(0x76))        /* original CX at 5025C8 */
            mask = fn_509BA0(bit, 0u);
        else
            mask = fn_509BA0(0u, bit);

        u32 new_flags = old_flags & ~mask;
        /* 502606 reads this BYTE AFTER fn_509BA0. */
        if (r8(ctx + UINT32_C(0x0B)) != 0u)
            new_flags |= mask;
        (void)fn_509CD0(record, new_flags);
        (void)fn_509C80(record);
        return UINT32_C(0xF);                /* falls through 50261F */
    }
    }

    /* Unreachable under the unsigned bound above and the frozen table. */
    return UINT32_C(0xF);
}
```

## Dispatch redérivé et couverture des blocs

`MOVSX EAX,CX` transforme le WORD en motif DWORD signé ; `ADD EAX,FFFFFF9Ah` soustrait `0x66` modulo `2^32`. Le test **unsigned** `JA 0x11` accepte exactement les WORD `0x0066..0x0077` : les WORD négatifs et les valeurs inférieures/supérieures sont rejetés. Les opcodes `0x64` et `0x65` ne sont pas dans la table, contrairement à la prose historique à l'entrée.

La colonne octets est redécoupée depuis `table.json:8` en DWORD little-endian. Le slot `j` est à `0x502628+4*j`. Les adresses CFG viennent de `metadata.json:11–257` ; aucune case ne repose sur un commentaire « case ».

| j | WORD | Octets LE | Destination | Blocs/ranges couverts par le C |
|---:|---:|---|---|---|
| 0 | 66 | a1 23 50 00 | 5023A1 | 5023A1–5023BE, retour 8 |
| 1 | 67 | be 23 50 00 | 5023BE | 5023BE–5023D0, retour F |
| 2 | 68 | d0 23 50 00 | 5023D0 | 5023D0–5023DD, retour EAX callee |
| 3 | 69 | dd 23 50 00 | 5023DD | 5023DD–502400, 502400–502422, sortie 50261F si bit absent |
| 4 | 6A | 22 24 50 00 | 502422 | 502422–502464 |
| 5 | 6B | 1f 26 50 00 | 50261F | épilogue commun 50261F–502628 |
| 6 | 6C | cf 24 50 00 | 5024CF | 5024CF, 5024D8, 5024DD, 5024EC, 5024F2, 502501 ; fin 50250A |
| 7 | 6D | 0a 25 50 00 | 50250A | 50250A, 502513, 502518, 502527, 50252D, 50253C ; fin 502545 |
| 8 | 6E | 64 24 50 00 | 502464 | 502464–50247E |
| 9 | 6F | 98 24 50 00 | 502498 | 502498–5024C2 |
| 10 | 70 | c2 24 50 00 | 5024C2 | 5024C2–5024CF, retour EAX callee |
| 11 | 71 | 62 25 50 00 | 502562 | 502562–502569 puis bloc partagé 50256E–502582 |
| 12 | 72 | 7e 24 50 00 | 50247E | 50247E–502498 |
| 13 | 73 | 69 25 50 00 | 502569 | 502569–50256E puis bloc partagé 50256E–502582 |
| 14 | 74 | 45 25 50 00 | 502545 | 502545–502562 |
| 15 | 75 | 82 25 50 00 | 502582 | 502582–5025BC |
| 16 | 76 | bc 25 50 00 | 5025BC | 5025BC–5025DC, branche 5025DC, jonction 5025F8, 50260D/50260F, 50261F |
| 17 | 77 | bc 25 50 00 | 5025BC | idem, branche 5025EB au lieu de 5025DC |
| hors garde | autres WORD | pas de lecture table | 50261F | défaut explicite |

Aux blocs de bras ci-dessus s'ajoutent entrée `502380–50239A` et dispatch `50239A–5023A1`. Les 36 blocs du CFG sont ainsi représentés, y compris les deux branches du BYTE `ctx+0B` et les deux alternatives des boucles. Aucune instruction de la table n'est traitée comme appartenant au chunk exécutable.

## ABI, pile, appels et registres

Entrée : argument unique à `[ESP_entrée+4]`. Après PUSH EBX/ESI, `502382` le lit à `[ESP+0Ch]`, puis PUSH EDI ; sauvegardes totales 12 octets. Tous les retours sont `C3` (RET simple) et restaurent EDI, ESI, EBX. Pas de local de pile réservé par SUB ESP. Le C exprime ce contrat non-volatile, pas un agencement machine garanti de sa propre compilation.

Ordre ci-dessous = slots d'arguments dans l'ordre C, à partir de `[ESP_callee+4]`. Les CALL eux-mêmes empilent leur adresse de retour. Les séquences de cleanup différé sont des faits du gel, même si le compilateur C est libre de nettoyer plus tôt les slots morts :

| Sites CALL | Cible réelle | Arguments observés | Nettoyage natif |
|---|---|---|---|
| 5023A6, 50240A, 50254A, 50256E | 500DD0 | adresse callback DWORD : respectivement 502670, 502ED0, 502F90, ou 502F30/503040 | ADD ESP,4 à chaque site |
| 5023BF | 5027D0 | ctx | ADD ESP,4 |
| 5023D1 | 50A790 | ctx | ADD ESP,4 ; EAX non réécrit |
| 502438 puis 502453 | 509CD0 puis 505C00 | (record,0), puis (record recalculé,3) | les premiers 8 octets restent empilés ; ADD ESP,10h après le second CALL |
| 50246D, 502487 | 503190 | (index signé étendu,17h,1/0) | ADD ESP,0Ch |
| 5024B1 | 505C00 | (record, WORD ctx+0A signé étendu) | ADD ESP,8 |
| 5024C3 | 5085D0 | ctx | ADD ESP,4 ; EAX non réécrit |
| 5024E2, 50251D | 503190 | (index boucle,18h,1/0) | ADD ESP,0Ch par branche appelante |
| 5025A5 puis 5025AB | 50A070 puis 509C80 | (record,EAX composite,DWORD object+0C), puis (record) | 12 octets conservés sous le second argument ; ADD ESP,10h |
| 5025F8 | 509BA0 | (bit,0) ou (0,bit) | ADD ESP,8 |
| 502611 puis 502617 | 509CD0 puis 509C80 | (record,new_flags), puis (record) | 8 octets conservés sous le second argument ; ADD ESP,0Ch |

Dix cibles natives distinctes, dix-neuf sites CALL directs. Aucun appel indirect exécuté par cette fonction : son indirect est un **JMP** de dispatch. Les adresses callback sont simplement passées à `500DD0`. Aucun appel bibliothèque n'est introduit.

### Points sensibles préservés

1. **Extension signée et adresse modulo 32 bits** : `MOVSX` aux `5023DD`, `502422`, `50243D`, `502464`, `50247E`, `502498/50249C`, `502582`, `5025BC`. Les LEA/SHL/SUB construisent `0x1D972C0 + 0x9C*index`, sans borne ni clamp. L'index négatif n'est pas remplacé par un unsigned WORD.
2. **AL/AX et EAX** : `5023E9` ne charge qu'AX, puis TEST/OR AL et écriture WORD ; seules les 16 bits bas sont observables avant le CALL suivant. En revanche `502594` (`66 8b 86 82 00 00 00`) remplace AX puis `50259C` pousse **EAX complet** : upper WORD du MOVSX de `ctx+8`, lower WORD de `object+82`. Ce n'est ni MOVZX, ni une extension signée de `object+82`.
3. **Masques immédiats** : `5024EC`, octets `81 0e 00 00 00 01`, signifie OR DWORD `0x01000000`, indépendamment du nom de masque affiché. `502527` utilise `0xFEFFFFFF`. Les deux branches appelantes testent un **BYTE** à `p-8`, tandis que la mutation de l'autre branche est **DWORD** à `p`.
4. **Boucles** : ESI commence à `0x1D972C8`, prend les valeurs de corps `0x1D972C8`, `0x1D97364`, `0x1D97400`, puis vaut `0x1D9749C`. Le JL signé cesse à l'égalité ; aucune de ces valeurs n'approche `INT32_MAX`. Trois itérations est une réduction exacte de cette boucle sous respect des non-volatiles par les callees, pas une hypothèse sur la taille globale du tableau.
5. **Shifts** : `5025E4` et `5025F3` sont SHL DWORD par CL. Le C masque le BYTE count par 31, utilise un `1` non signé 32 bits et admet donc counts 0/32/255 sans UB de décalage signé ou trop large. Les flags produits par SHL ne servent pas à un branchement avant le CALL suivant.
6. **Snapshot et relectures** : `ctx+8` est relu à `50243D` après `509CD0`. À l'inverse le DWORD record+8 chargé à `5025CC` est gardé en EDI à travers `509BA0`, puis combiné avec son EAX ; on ne recharge pas le DWORD. Le BYTE `ctx+0B` est lu seulement à `502606`, après ce CALL. `5025AB/502617` utilisent le record sauvegardé, pas un nouvel index.
7. **Initialisation sélective** : node+10 reçoit ctx dans tous les bras `500DD0`. node+0D est mis à zéro uniquement pour les callbacks `502670`, `502ED0`, `502F90`, pas `502F30` ni `503040`. Aucun test de nullité d'EAX après ces appels ; une vérification défensive changerait le binaire.
8. **Retours** : EAX=8 pour les cinq bras d'allocation ; EAX du callee transmis intégralement pour WORD 68/70 ; EAX=F pour tous les autres chemins, y compris défaut, WORD 6B et bit 2 absent au bras 69. Ni booléen ni BYTE de retour substitué.

Références de lecture : `asm-001.txt:5–20`, `asm-002.txt:11–25`, `asm-003.txt:6–23`, `asm-005.txt:22–25` + `asm-006.txt` + `asm-007.txt:1–13`, `asm-008.txt:10–25`, `asm-009.txt:5–25` + `asm-010.txt`. Les callbacks et cibles sont corroborés par les immédiats/PUSH et déplacements E8 des deux fichiers bytes, pas par leur nom sémantique.

## Limites et validations à demander au lead

- **Résolu** : manque initial des 72 octets de table. Le supplément v1 permet la totalité du mapping, sans placeholder de dispatch ni table supposée.
- **Non résolu ici** : prototypes exacts, préconditions et effets des callees ; exigences d'alignement/aliasing du contexte d'intégration ; objets valides, indices négatifs/hors tableau, aliasing avec la pile, lecture éventuelle de registres d'entrée par les callees. Les déclarations ci-dessus sont des vues conservatrices des slots observés, pas de nouveaux types métier validés. Le switch suppose la table/code gelés inchangés pendant l'exécution ; une modification runtime de destinations n'est pas simulée.
- Le C préserve les effets mémoire et valeurs d'arguments/résultats dans le contrat déclaré. Il ne promet pas les valeurs incidentes de ECX/EDX/EFLAGS au retour, ni les adresses de retour exactes, ni la matérialisation exacte des slots d'arguments morts sous un second appel. Un callee qui inspecterait ces détails demanderait un wrapper ABI/ASM ou une modélisation machine plus stricte.
- Les structures restent des offsets bruts ; aucun type packed de record ni bibliothèque, aucune finalité de fonction n'est déduit des labels/commentaires historiques. Pas de lecture de production voisine, de volet sémantique, de ledger cible, ni de sessions/services supplémentaires.
- **Exécuté** : lecture intégrale des projections autorisées et du supplément ; confrontation statique manuelle ASM/octets pour le dispatch, les largeurs/immédiats sensibles, la pile et les chemins. Aucun calcul local de SHA256 n'est revendiqué : hashes cités des manifests/attestations parent.
- **Non exécuté** : compilation, link, tests, review indépendante, comparaison dynamique, accès IDB/PE, §5.6, intégration. Demandes au rôle autorisé : compiler x86-32 avec le contrat mémoire ci-dessus, contrôler les wrappers/callees, comparer les traces d'accès/appels pour les 18 indices et le défaut, WORD négatifs, AX composite et counts 0/31/32/255. Vérifier particulièrement la mutation de ctx+8 par le premier appel du bras 6A et la mutation de record+8/ctx+0B par `509BA0`. Ce sont des **besoins de validation, pas des PASS**.
