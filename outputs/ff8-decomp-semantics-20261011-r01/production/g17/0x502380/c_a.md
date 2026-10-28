# 0x502380 — C A indépendant, g17 / run01

Tâche `task_mv44sepw_00b2_ifuqeu`, rôle C A, session `pool-198`, modèle demandé `openai/gpt-6-astra`, variante `high`. Candidat pour réconciliation 2+1 ; aucune promotion ni validation finale. Le complément factuel `supplemental-v1` résout le blocage initial de table manquante. Aucun C antérieur, autre volet, livrable pair ou ledger cible consulté.

## 1. Entrées et provenance

Racine des entrées : `inputs/ff8-decomp-semantics-20261011-r01/g17/`.

- `0x502380.readable/manifest.json:1–75` : projection déclarée complète et verbatim ; original `0x502380.json`, SHA-256 **`1955590faeb8479a4a74ef892a9aff80681522f6abb4285ebd55f725551fff09`**.
- `0x502380.readable/asm-001.txt` à `asm-010.txt` : les **243 instructions** lues ; `bytes-001.txt:1–20` et `bytes-002.txt:1–2` : tout le chunk **[0x502380,0x502628), 680 octets**. `metadata.json:11–257` contient les 36 blocs CFG ; `:259–277` contient l'appel entrant `0x500D29` depuis `0x500CC0` et les dix destinations directes.
- `common-compaction.md:12–26,38`, SHA-256 cité par le manifeste : **`f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`**. Noms et commentaires historiques non utilisés comme preuve métier ou prototype.
- `0x502380.supplemental-v1/manifest.json`, version 1, SHA-256 communiqué par le lead : **`0c2eb97f4f4383e93d478b3faf532024b03cea2fea4aaff0315424b8997cc861`**.
- `0x502380.supplemental-v1/table.json:1–101` : **[0x502628,0x502670), 72 octets, 18 DWORD little-endian**. SHA-256 des **octets de table** : **`c0e337fcad03168079cbd7575dc3582d1631773094eaba3ff071cbf08e327bf0`**. SHA-256 du **fichier JSON**, distinct : `61ca1118a8789ad29c5a57af70859f5c391a8b65266385da5415a1bb27d35a9c`.
- `0x502380.supplemental-v1/provenance.json:2–28` : capture parent statique du 2026-10-12 ; égalité corps original/IDB/PE et table IDB/PE déclarée vérifiée. SHA-256 du corps : `fb2f2332c69db87347f0347ac2543c81b37ce378c0ad7ac5736249894147608e`. PE SHA-256 : **`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`**. Le fichier `dispatch.txt:1–10` redonne les octets du dispatcher.

Ces hashes sont cités depuis les manifestes/provenance et le message du lead, non recalculés localement. Aucun accès IDB ou PE effectué par cet auteur.

## 2. Contrat du C

Le C ci-dessous reconstruit les valeurs et effets du corps entier, sans attribuer de métier aux champs. Il vise **GNU C11/Clang, x86 i386 little-endian**, avec adresses natives sur 32 bits. Les accès `packed, may_alias` permettent les accès non alignés sans hypothèse de structure C typée ; les accès volatils conservent notamment les relectures après appels. Les additions/multiplications d'adresses restent en `uint32_t`, modulo 2^32. Les helpers internes ne représentent **aucun** callee natif supplémentaire et n'utilisent aucune bibliothèque d'exécution.

Les dix déclarations `fn_<EA>` sont des **interfaces opaques d'appels observés**, à lier aux EA indiquées par le lead, pas des corps de callee inventés. Chaque argument désigne un DWORD de pile brut, dans l'ordre logique C. Le retour `uint32_t` représente le registre EAX ; pour les appels castés `(void)`, sa valeur n'est pas utilisée et aucun sens de retour n'est affirmé. Les callbacks sont transmis comme adresses brutes, jamais appelés directement ici.

Hypothèse d'interface explicite : convention i386 caller-cleanup avec EBX/ESI/EDI/EBP préservés, et pas d'entrée cachée dans les registres/flags, ni d'inspection des arguments résiduels hors arité observée. Le gel du corps prouve les pushes et les nettoyages, pas à lui seul l'absence de telles dépendances chez chaque callee. La pile physique différée est décrite en §5 ; ce C n'impose pas au compilateur son agencement exact. La table de dispatch est celle du gel, sans hypothèse de modification dynamique. Aucune atomicité inter-thread, équivalence de faults ou instrumentation live n'est revendiquée.

## 3. C complet

```c
#include <stdint.h>
#include <limits.h>

#if !defined(__GNUC__) || !defined(__i386__)
# error "This reconstruction requires GNU-compatible C on 32-bit x86."
#endif
#if __BYTE_ORDER__ != __ORDER_LITTLE_ENDIAN__
# error "The frozen image is little-endian."
#endif

typedef uint8_t  u8;
typedef uint16_t u16;
typedef uint32_t u32;

_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(u16) == 2, "16-bit words required");
_Static_assert(sizeof(u32) == 4, "32-bit dwords required");
_Static_assert(sizeof(uintptr_t) == 4, "32-bit address space required");

#define RE_CDECL  __attribute__((cdecl))
#define RE_INLINE static inline __attribute__((always_inline))

struct __attribute__((packed, may_alias)) re_mem16 { u16 v; };
struct __attribute__((packed, may_alias)) re_mem32 { u32 v; };

RE_INLINE u8 r8(u32 a)
{
    return *(const volatile u8 *)(uintptr_t)a;
}

RE_INLINE u16 r16(u32 a)
{
    return ((const volatile struct re_mem16 *)(uintptr_t)a)->v;
}

RE_INLINE u32 r32(u32 a)
{
    return ((const volatile struct re_mem32 *)(uintptr_t)a)->v;
}

RE_INLINE void w8(u32 a, u8 v)
{
    *(volatile u8 *)(uintptr_t)a = v;
}

RE_INLINE void w16(u32 a, u16 v)
{
    ((volatile struct re_mem16 *)(uintptr_t)a)->v = v;
}

RE_INLINE void w32(u32 a, u32 v)
{
    ((volatile struct re_mem32 *)(uintptr_t)a)->v = v;
}

/* MOVSX word -> DWORD, returned as its two's-complement bit pattern. */
RE_INLINE u32 sx16_bits(u16 v)
{
    return ((u32)v ^ UINT32_C(0x8000)) - UINT32_C(0x8000);
}

/* LEA 5*i; SHL 3; SUB i; scale 4, all modulo 2^32. */
RE_INLINE u32 record_address(u32 index_bits)
{
    return UINT32_C(0x01D972C0) + index_bits * UINT32_C(0x9C);
}

/* Signed CMP/JL without an implementation-defined unsigned->signed cast. */
RE_INLINE int signed_lt32(u32 a, u32 b)
{
    return (a ^ UINT32_C(0x80000000)) <
           (b ^ UINT32_C(0x80000000));
}

/* Link these opaque interfaces to the numeric native EA, not to guessed APIs. */
extern u32 RE_CDECL fn_00500DD0(u32 arg0);
extern u32 RE_CDECL fn_005027D0(u32 arg0);
extern u32 RE_CDECL fn_00503190(u32 arg0, u32 arg1, u32 arg2);
extern u32 RE_CDECL fn_00505C00(u32 arg0, u32 arg1);
extern u32 RE_CDECL fn_005085D0(u32 arg0);
extern u32 RE_CDECL fn_00509BA0(u32 arg0, u32 arg1);
extern u32 RE_CDECL fn_00509C80(u32 arg0);
extern u32 RE_CDECL fn_00509CD0(u32 arg0, u32 arg1);
extern u32 RE_CDECL fn_0050A070(u32 arg0, u32 arg1, u32 arg2);
extern u32 RE_CDECL fn_0050A790(u32 arg0);

u32 RE_CDECL fn_00502380(u32 ctx)
{
    /* 502387..502394: load CX, sign-extend, subtract 0x66, unsigned JA. */
    const u16 selector = r16(ctx + UINT32_C(2));
    const u32 slot = sx16_bits(selector) - UINT32_C(0x66);

    if (slot > UINT32_C(0x11))
        return UINT32_C(0x0F);              /* 50261F..502627 */

    /* All positions decoded from supplemental-v1's raw 72-byte table. */
    switch (slot) {
    case 0: {                              /* 0x66 -> 5023A1 */
        const u32 node = fn_00500DD0(UINT32_C(0x00502670));
        w32(node + UINT32_C(0x10), ctx);
        w8(node + UINT32_C(0x0D), 0);
        return UINT32_C(8);
    }

    case 1:                                /* 0x67 -> 5023BE */
        (void)fn_005027D0(ctx);
        return UINT32_C(0x0F);

    case 2:                                /* 0x68 -> 5023D0 */
        return fn_0050A790(ctx);            /* EAX forwarded unchanged */

    case 3: {                              /* 0x69 -> 5023DD */
        const u32 index_bits = sx16_bits(r16(ctx + UINT32_C(8)));
        const u32 record = record_address(index_bits);
        const u16 word0 = r16(record);
        u32 node;

        if (((u32)word0 & UINT32_C(2)) == 0)
            return UINT32_C(0x0F);

        /* OR AL,0x10 followed by MOV [ECX],AX: only bit 4 is set. */
        w16(record, (u16)((u32)word0 | UINT32_C(0x10)));
        node = fn_00500DD0(UINT32_C(0x00502ED0));
        w32(node + UINT32_C(0x10), ctx);
        w8(node + UINT32_C(0x0D), 0);
        return UINT32_C(8);
    }

    case 4: {                              /* 0x6A -> 502422 */
        u32 index_bits = sx16_bits(r16(ctx + UINT32_C(8)));
        u32 record = record_address(index_bits);
        (void)fn_00509CD0(record, UINT32_C(0));

        /* 50243D: reload the input WORD after the first call. */
        index_bits = sx16_bits(r16(ctx + UINT32_C(8)));
        record = record_address(index_bits);
        (void)fn_00505C00(record, UINT32_C(3));
        return UINT32_C(0x0F);
    }

    case 5:                                /* 0x6B -> 50261F */
        return UINT32_C(0x0F);

    case 6: {                              /* 0x6C -> 5024CF */
        u32 field = UINT32_C(0x01D972C8);
        u32 i = 0;
        do {
            /* TEST BYTE [ESI-8],BL, with BL=2. */
            if (((u32)r8(field - UINT32_C(8)) & UINT32_C(2)) != 0) {
                (void)fn_00503190(i, UINT32_C(0x18), UINT32_C(1));
            } else {
                const u32 old = r32(field);
                /* Raw bytes 81 0E 00 00 00 01, not an IDA mask name. */
                w32(field, old | UINT32_C(0x01000000));
            }
            field += UINT32_C(0x9C);
            i += UINT32_C(1);
        } while (signed_lt32(field, UINT32_C(0x01D9749C)));
        return UINT32_C(0x0F);
    }

    case 7: {                              /* 0x6D -> 50250A */
        u32 field = UINT32_C(0x01D972C8);
        u32 i = 0;
        do {
            if (((u32)r8(field - UINT32_C(8)) & UINT32_C(2)) != 0) {
                (void)fn_00503190(i, UINT32_C(0x18), UINT32_C(0));
            } else {
                const u32 old = r32(field);
                w32(field, old & UINT32_C(0xFEFFFFFF));
            }
            field += UINT32_C(0x9C);
            i += UINT32_C(1);
        } while (signed_lt32(field, UINT32_C(0x01D9749C)));
        return UINT32_C(0x0F);
    }

    case 8: {                              /* 0x6E -> 502464 */
        const u32 index_bits = sx16_bits(r16(ctx + UINT32_C(8)));
        (void)fn_00503190(index_bits, UINT32_C(0x17), UINT32_C(1));
        return UINT32_C(0x0F);
    }

    case 9: {                              /* 0x6F -> 502498 */
        const u32 index_bits = sx16_bits(r16(ctx + UINT32_C(8)));
        const u32 arg1_bits = sx16_bits(r16(ctx + UINT32_C(0x0A)));
        const u32 record = record_address(index_bits);
        (void)fn_00505C00(record, arg1_bits);  /* full sign-extended DWORD */
        return UINT32_C(0x0F);
    }

    case 10:                               /* 0x70 -> 5024C2 */
        return fn_005085D0(ctx);            /* EAX forwarded unchanged */

    case 11:                               /* 0x71 -> 502562 */
    case 13: {                             /* 0x73 -> 502569 */
        const u32 callback = (slot == UINT32_C(11))
                           ? UINT32_C(0x00502F30)
                           : UINT32_C(0x00503040);
        const u32 node = fn_00500DD0(callback); /* common 50256E */
        w32(node + UINT32_C(0x10), ctx);
        /* Deliberately NO write to node+0x0D on these two paths. */
        return UINT32_C(8);
    }

    case 12: {                             /* 0x72 -> 50247E */
        const u32 index_bits = sx16_bits(r16(ctx + UINT32_C(8)));
        (void)fn_00503190(index_bits, UINT32_C(0x17), UINT32_C(0));
        return UINT32_C(0x0F);
    }

    case 14: {                             /* 0x74 -> 502545 */
        const u32 node = fn_00500DD0(UINT32_C(0x00502F90));
        w32(node + UINT32_C(0x10), ctx);
        w8(node + UINT32_C(0x0D), 0);
        return UINT32_C(8);
    }

    case 15: {                             /* 0x75 -> 502582 */
        const u32 index_bits = sx16_bits(r16(ctx + UINT32_C(8)));
        const u32 source = r32(ctx + UINT32_C(4));
        const u32 arg2_bits = r32(source + UINT32_C(0x0C));
        const u16 low_ax = r16(source + UINT32_C(0x82));
        /* 502594 writes AX, not EAX: retain high 16 bits of MOVSX index. */
        const u32 arg1_bits = (index_bits & UINT32_C(0xFFFF0000)) |
                              (u32)low_ax;
        const u32 record = record_address(index_bits);
        (void)fn_0050A070(record, arg1_bits, arg2_bits);
        (void)fn_00509C80(record);
        return UINT32_C(0x0F);
    }

    case 16:                               /* 0x76 -> 5025BC */
    case 17: {                             /* 0x77 -> 5025BC */
        const u32 index_bits = sx16_bits(r16(ctx + UINT32_C(8)));
        const u32 record = record_address(index_bits);
        /* 5025CC: snapshot BEFORE 509BA0; do not reread after that call. */
        const u32 old = r32(record + UINT32_C(8));
        const u32 count = (u32)r8(ctx + UINT32_C(0x0A)) & UINT32_C(31);
        const u32 bit = UINT32_C(1) << count; /* x86 SHL r32,CL */
        u32 mask;
        u32 merged;
        u8 set_byte;

        /* CX still contains the originally loaded selector at 5025C8. */
        if (selector == UINT16_C(0x76))
            mask = fn_00509BA0(bit, UINT32_C(0));
        else
            mask = fn_00509BA0(UINT32_C(0), bit);

        merged = old & ~mask;
        /* 502606: this BYTE is intentionally loaded AFTER 509BA0. */
        set_byte = r8(ctx + UINT32_C(0x0B));
        if (set_byte != 0)
            merged |= mask;

        (void)fn_00509CD0(record, merged);
        (void)fn_00509C80(record);
        return UINT32_C(0x0F);
    }

    default:
        /* Unreachable after the guard; all 18 table positions are above. */
        return UINT32_C(0x0F);
    }
}
```

## 4. Normalisation, table et couverture des blocs

`dispatch.txt:5–10` : `MOV CX,[ESI+2]` puis `MOVSX EAX,CX`; `83 C0 9A` ajoute **-102**, non +154 ; `CMP EAX,0x11; JA` compare **sans signe**. En bits DWORD, `slot = sext16(selector) - 0x66 (mod 2^32)`. Les seules valeurs du WORD qui passent sont **0x0066..0x0077**. Un WORD négatif signé et les valeurs 0x0000..0x0065 donnent un grand unsigned après soustraction ; les valeurs positives au-delà de 0x77 sont également rejetées. Le défaut retourne `0xF`, sans accéder à la table. Aucun support 0x64/0x65 n'est ajouté depuis le commentaire historique.

Décodage indépendant des DWORD little-endian de `table.json:8` ; il ne repose pas sur les commentaires `case` d'IDA :

| Index | WORD | Slot EA | Destination | Plage(s) de corps couvertes, fin exclue | EAX de sortie |
|---:|---:|---:|---:|---|---|
| 0 | 0x66 | 0x502628 | 0x5023A1 | [5023A1,5023BE) | 8 |
| 1 | 0x67 | 0x50262C | 0x5023BE | [5023BE,5023D0) | 0xF |
| 2 | 0x68 | 0x502630 | 0x5023D0 | [5023D0,5023DD) | EAX de 50A790 |
| 3 | 0x69 | 0x502634 | 0x5023DD | [5023DD,502422), défaut si AL&2==0 | 8 ou 0xF |
| 4 | 0x6A | 0x502638 | 0x502422 | [502422,502464) | 0xF |
| 5 | 0x6B | 0x50263C | 0x50261F | [50261F,502628) | 0xF |
| 6 | 0x6C | 0x502640 | 0x5024CF | [5024CF,50250A) | 0xF |
| 7 | 0x6D | 0x502644 | 0x50250A | [50250A,502545) | 0xF |
| 8 | 0x6E | 0x502648 | 0x502464 | [502464,50247E) | 0xF |
| 9 | 0x6F | 0x50264C | 0x502498 | [502498,5024C2) | 0xF |
| 10 | 0x70 | 0x502650 | 0x5024C2 | [5024C2,5024CF) | EAX de 5085D0 |
| 11 | 0x71 | 0x502654 | 0x502562 | [502562,502569), [50256E,502582) | 8 |
| 12 | 0x72 | 0x502658 | 0x50247E | [50247E,502498) | 0xF |
| 13 | 0x73 | 0x50265C | 0x502569 | [502569,502582) | 8 |
| 14 | 0x74 | 0x502660 | 0x502545 | [502545,502562) | 8 |
| 15 | 0x75 | 0x502664 | 0x502582 | [502582,5025BC) | 0xF |
| 16 | 0x76 | 0x502668 | 0x5025BC | [5025BC,5025EB), [5025F8,502628) | 0xF |
| 17 | 0x77 | 0x50266C | 0x5025BC | [5025BC,5025DC), [5025EB,502628) | 0xF |
| hors garde | autre | aucun | 0x50261F | entrée [502380,50239A), défaut [50261F,502628) | 0xF |

Le dispatch [50239A,5023A1) est remplacé par ce switch statiquement résolu. Couverture des **36 débuts de blocs** du CFG, y compris sous-blocs des boucles et branches communes :

`502380, 50239A, 5023A1, 5023BE, 5023D0, 5023DD, 502400, 502422, 502464, 50247E, 502498, 5024C2, 5024CF, 5024D8, 5024DD, 5024EC, 5024F2, 502501, 50250A, 502513, 502518, 502527, 50252D, 50253C, 502545, 502562, 502569, 50256E, 502582, 5025BC, 5025DC, 5025EB, 5025F8, 50260D, 50260F, 50261F`.

Un seul chunk exécutable exporté ; les 72 octets du supplément sont des **données de dispatch**, pas un deuxième chunk de code. Aucun trou de code restant dans [502380,502628).

## 5. Preuves de largeurs, ordre et ABI

### Adresses, champs et registres partiels

- `5023DD–5023F3`, `502422–502430`, `502582–50259D`, `5025BC–5025D3` : indices **WORD signés**, calcul `base 0x01D972C0 + 0x9C*index`. Aucun clamp ou test de validité d'index. Le C évite toute arithmétique de pointeur C hors tableau en calculant d'abord l'adresse DWORD.
- `5023E9/502400/502407` : chargement **AX**, test **AL&2**, **OR AL,0x10**, store **AX**. Le haut d'EAX issu de l'index n'est pas stocké ; le WORD est préservé sauf bit 4. À l'inverse, `502594–50259C` fait `MOV AX,[source+82]; PUSH EAX` : l'argument 1 de `50A070` vaut **`(sext16(index)&0xFFFF0000) | WORD[source+0x82]`**. Pour index négatif son haut vaut 0xFFFF ; une simple zéro-extension aurait changé les octets poussés.
- `50249C/5024A3` : le WORD à `ctx+0xA` est **sign-étendu** et poussé entier à `505C00`, non réduit à un BYTE.
- `5024D8/502513` : tests BYTE `record+0` avec BL=2 ; les OR/AND alternatifs sont **DWORD** `record+8`. `5024EC` encode `81 0E 00 00 00 01`, soit **0x01000000**. `502527` encode le masque complémentaire **0xFEFFFFFF**. Les comparaisons `JL` sont signées. Partant de `0x01D972C8`, les trois adresses de champ visitées sont `0x01D972C8`, `0x01D97364`, `0x01D97400`; l'extrémité `0x01D9749C` est exclue.
- `5025DC–5025F8` : charge **CL** depuis `ctx+0xA`, décale un **DWORD 1** ; count effectif `CL&31`. Les deux ordres d'arguments sont `(bit,0)` pour le WORD selector 0x76 et `(0,bit)` pour 0x77. Le test CX à `5025C8` utilise le selector chargé une seule fois à l'entrée, pas une relecture après modification de CL.
- `5025CC` snapshotte le DWORD `record+8` **avant** `509BA0`. `502606` lit le BYTE `ctx+0xB` **après** cet appel ; zéro/non-zéro uniquement. Résultat préparé : ancien DWORD AND NOT EAX, puis OR EAX si BYTE non nul. Aucun nouveau chargement de `record+8` n'est ajouté.
- `50243D` relit `ctx+8` après `509CD0`, donc le second calcul d'adresse n'utilise pas un index pré-call caché. `502586/50258C/502594` lisent successivement le pointeur `ctx+4`, DWORD `source+0xC`, WORD `source+0x82`, avant les deux appels.
- `5023AE–5023B1`, `502412–502415`, `502552–502555` : store DWORD `node+0x10`, puis BYTE zéro `node+0xD`. **Pas** de store à `+0xD` dans le chemin commun `50256E–502581`. Aucun test nul du résultat de `500DD0` dans le natif : le C n'en invente pas.

### Appels effectivement encodés

Le calcul `EA+5+sext32(rel32)` à partir des octets E8 lus a donné les cibles suivantes (décodage arithmétique Code Mode dans cette session, pas exécution du programme) :

| Destination | Sites E8 | Arguments DWORD observés, ordre logique |
|---|---|---|
| 500DD0 | 5023A6, 50240A, 50254A, 50256E | adresse callback : 502670, 502ED0, 502F90, ou 502F30/503040 |
| 5027D0 | 5023BF | ctx |
| 50A790 | 5023D1 | ctx ; EAX transmis au caller |
| 509CD0 | 502438, 502611 | record, 0 / DWORD fusionné |
| 505C00 | 502453, 5024B1 | record recalculé, 3 / record, WORD sign-étendu |
| 503190 | 50246D, 502487, 5024E2, 50251D | index sign-étendu, 0x17, 1/0 ; ou index boucle, 0x18, 1/0 |
| 5085D0 | 5024C3 | ctx ; EAX transmis au caller |
| 50A070 | 5025A5 | record, EAX à AX remplacé, DWORD[source+0xC] |
| 509C80 | 5025AB, 502617 | record |
| 509BA0 | 5025F8 | bit,0 / 0,bit ; EAX utilisé comme masque DWORD |

### Pile

- Si S est ESP à l'entrée, l'argument unique est le DWORD `[S+4]`. Les pushes EBX/ESI placent ESP à S-8 ; `502382` lit `[ESP+0xC]`, donc bien `[S+4]`. EDI est ensuite sauvé. Pas d'allocation locale `SUB ESP` ; EBX/ESI/EDI restaurés sur chaque sortie, EBP non modifié par le corps ; `RET` sans immédiat.
- Les arguments sont poussés de droite à gauche. Les nettoyages explicites après les appels isolés valent 4, 8 ou 12 octets suivant l'arité observée.
- **Groupe 502438 + 502453** : 8 octets du premier appel restent en pile, 8 nouveaux octets pour le second ; `502458 ADD ESP,0x10` enlève les 16.
- **Groupe 5025A5 + 5025AB** : 12 puis 4 octets ; `5025B0 ADD ESP,0x10`.
- **Groupe 502611 + 502617** : 8 puis 4 octets ; `50261C ADD ESP,0x0C`. L'appel précédent à `509BA0` a déjà eu son `ADD ESP,8` à `5025FF`.
- Profondeur maximale dans ce corps hors internes des callees : 12 octets de registres sauvés + 16 d'arguments en attente + 4 de retour CALL = **32 octets sous S**. Les temporaires/épilogues que choisirait un compilateur pour le C ne sont pas une restitution physique de cette pile.

## 6. Limites et validations

**Effectué par l'auteur :** lecture de toute l'ASM projetée et des 680 octets, confrontation des champs/immédiats/appels pertinents aux octets, décodage arithmétique des 18 entrées du supplément et des 19 sites E8, dérivation de la garde et traçage des 36 blocs, arguments/pile/retours. Le décodage confirme les destinations sans emprunter un résultat pair. Le blocage initial de table est résolu ; l'absence de table signalée dans la compaction historique n'est plus une limite de ce candidat.

**Non exécuté :** compilation, liaison, tests unitaires/différentiels, exécution native/émulée, inspection IDB/PE par ce worker, vérification de Model.Ref par API, contrôle §5.6, review indépendante et intégration. Les égalités IDB/PE et hashes sont l'evidence parent citée, non une validation reconstituée de cet auteur.

**Incertitudes externes conservées :** prototypes complets et effets des callees, éventuelles dépendances ABI cachées/inspection de pile, validité des adresses/indices fournis et succès de `500DD0`, sémantique des champs/callbacks, mutation dynamique du code/de la table et effets concurrentiels. Aucun callee n'est remplacé par une fonction de bibliothèque, aucun champ n'est nommé selon le métier historique, et aucun échec natif potentiel n'est « réparé ».

**Demandes au lead/reviewer, pas des PASS :** compiler/relier le bloc dans le modèle i386 déclaré ; confronter les interfaces natives et l'absence de dépendances de pile cachées ; tester les 18 positions et la garde hors plage, les branches des trois itérations, les valeurs négatives WORD et le `MOV AX/PUSH EAX`, les counts 0/31/32/255, l'EAX inchangé des deux appels relayés, les relectures/snapshots autour d'appels qui mutent les données, et l'absence volontaire de remise à zéro `node+0xD` pour 0x71/0x73.
