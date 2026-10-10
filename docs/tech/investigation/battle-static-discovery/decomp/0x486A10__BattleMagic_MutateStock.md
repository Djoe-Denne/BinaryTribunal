# 0x486A10 — BattleMagic_MutateStock

- Cible de publication parent : `0x486A10__BattleMagic_MutateStock.md`.
- Catalogue exact : `domain::BattleMagic_MutateStock` ; contexte métier post-gel, non preuve numérique autonome, aucun rename.
- Instr (live) : 116 ; plage `[0x486A10,0x486B34)`, 292 octets ; 22 blocs, 27 arcs, six RET, deux CALL, selon les preuves gelées et le contrôle natif parent.
- Palier : LIKELY NUMERIC hérité de A == V ; mode 1+V, C corrigé puis nouvelle revue indépendante acceptée. Propagation mécanique seulement, aucun nouveau vote ni promotion.
- Type IDA : non lu ; modèle cdecl à trois DWORD, cleanup appelant 12 octets, EAX complet 0/1/255. Sauvegardes EBX, EBP, ESI, EDI ; pas d'allocation locale, EBP scratch et non ancre de frame.
- Notes parent : pas indexé 464 = 0x1D0 ; 32 entrées de pas 5 ; ID et count sont des octets, clé comparée DWORD. Pas de borne d'index. Aucun rôle bibliothèque ou métier attribué au callee opaque.

## C réconcilié

Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays. Dans ce gel, les fichiers effectifs sont `P4_pack/neutral/asm.txt` et `P4_pack/neutral/bytes.json` ; les noms conventionnels de cette phrase ne désignent pas des fichiers supplémentaires consultés. Les vérifications natives antérieures sont rapportées par `parent_native_gate_final.json`, pas réexécutées ici.

### Provenance de l'acceptation et copie exacte

Le bloc C unique ci-dessous est la copie **octet pour octet** des 14 761 octets de `P4_C_re_review_1/c_reviewed_final.c`, SHA-256 `c553def5d9814560123b862d577cb368daf899f1581ebdd59429a576b4566432`. La revue fraîche `c_review.md` et `findings.json` l'acceptent comme projection numérique conditionnelle uniquement ; `parent_postfreeze_context.json` désigne ce même payload accepté. Son en-tête « pas final accepté » est **historique et gelé**, conservé verbatim : il ne remplace pas cette provenance d'acceptation postérieure. Aucun C régénéré, réécrit, renommé ou nettoyé.

Corrections de prose hors payload : la formule ABI intermédiaire omet le facteur 4 ; la formule correcte héritée est `((8*i-i)*4+i)*16 = 464*i` modulo 2^32, pas 232 ni 128. Le quatrième cleanup n'est pas absent : CALL `493EE7`, XOR `493EEC`, puis `add esp,0Ch` à `493EEE`, différé d'une instruction et non groupé. Les deux CALL internes à `4954B0` sont suivis chacun d'un cleanup 4.

```c
/*
 * sub_486A10 — C corrigé ciblé F01–F06, pas final accepté.
 * Ground truth = ASM numérique gelé (neutral/asm.txt) + neutral/bytes.json,
 * PAS Hex-Rays, noms/commentaires/prototypes IDA ou sémantique métier.
 * Plage : [0x486A10,0x486B34), 292 octets, 116 instructions,
 *         22 blocs, 27 arêtes, 6 retn, 2 sites d'appel opaque.
 * SHA256 des octets de la cible :
 * de7ca143ac4ec3024ff1bb357745a9ac4e6f9f6a927f5edc245795f6e53c5904
 * Type IDA : non lu. Prototype de modèle déduit des trois DWORD d'entrée,
 * des six retn sans immédiat et des quatre cleanups appelants de 12 octets :
 * 0x4859FE, 0x485B06, 0x48D57E, 0x493EE7.
 * Au quatrième site : 493EE7 call, 493EEC xor edx,edx, puis
 * 493EEE add esp,0Ch ; cleanup différé d'une instruction, PAS groupé.
 * Preuve numérique incluse (493EDD..493EF1, 20 octets, fin exclusive) :
 * 6A01 8A0D128ED201 51 57 E8242BFFFF 33D2 83C40C
 * SHA256 : 87eb077a3155009608a6bdcc814c86d5598fcc89e46308341f42379d3a51b2d6
 * Les résumés ABI/graph gelés ne sont pas modifiés ; leur quatrième cleanup
 * non résolu est corrigé ici. Sauvegardes : EBX, EBP, ESI, EDI ; EAX=0/1/255.
 * Callee sub_4954B0 : opaque, corps hors périmètre.
 *
 * F01/F04 — CONTRAT CONDITIONNEL AUTOPORTANT DU MODÈLE C32/x86
 * Ce C est une reconstruction statique, PAS une équivalence runtime validée,
 * ni une promesse ISO universelle ou couvrant tous les DWORD/alias possibles.
 * Préconditions (non vérifiées par l'ASM, qui ne borne PAS le slot) :
 * - char a 8 bits ; unsigned int/u32 et int/s32 ont exactement 32 bits,
 *   int utilise la représentation complément à deux ; pointeurs 32 bits.
 *   Les conversions int<->u32 conservent les 32 bits sur le backend retenu,
 *   y compris u32->int hors plage positive (choix d'implémentation requis).
 * - Mapping entier->adresse plat C32 : (u8 *)(u32)a désigne exactement le
 *   byte à l'adresse numérique a. Tous les calculs u32 sont modulo 2^32.
 *   Chaque lecture/store exécuté dispose d'une mémoire ordinaire valide,
 *   non MMIO ; ceci n'est pas une preuve de validité d'un pointeur ISO.
 * - Pas de mutation concurrente/asynchrone, signal, exception ou réentrance
 *   observable avant les appels, ni d'intervention extérieure pendant cette
 *   exécution. Les mutations synchrones du callee opaque restent permises.
 * - Toutes les adresses ID/count accessibles sont séparées de la pile
 *   numérique et de tout code/autre objet de contrôle. Avec S=ESP d'entrée,
 *   cela inclut [S,S+16) (retour et trois arguments), [S-16,S) (quatre
 *   sauvegardes), [S-20,S-16) (argument sortant), [S-24,S-20) (retour du call),
 *   et toute pile utilisée par le callee. La séparation est une précondition,
 *   PAS une propriété prouvée par les valeurs du slot ou par le code ASM.
 * - L'appel opaque retourne normalement, respecte la pile cdecl (un DWORD,
 *   nettoyage appelant), préserve EBX/EBP/ESI/EDI et ne corrompt pas le frame
 *   de retour de l'appelant. Ses effets sur la mémoire ordinaire ne sont PAS
 *   limités à la table ; son EAX est ignoré. Aucune pureté, liste exhaustive
 *   d'effets ou terminaison de son corps n'est inférée.
 * Projection conditionnelle : trace des accès mémoire ordinaire du source,
 * appels/argument DWORD et EAX complet aux sorties normales. Hors projection :
 * EFLAGS de sortie, trace exacte push/pop et lectures des arguments en pile,
 * disposition de pile de compilation, fautes mémoire et alias pile/contrôle.
 * Les prototypes C sont NOTATION DE MODÈLE pour une convention cdecl x86,
 * pas des types source prouvés ; leur ABI machine compilée n'est pas testée.
 * Aucun backend machine/pile explicite n'est introduit ici. La stabilité des
 * arguments de pile permet leur représentation par valeurs C sous ce contrat.
 *
 * Limite numérique explicite : S=0x0012FF00, slot=0x07B86B9E,
 * clé=0x100000F1, mode=0 ; base+464*slot+5*2 = 0x0012FEEC = S-20 (mod 2^32).
 * Si les ID 0/1 sont nonzero et ID/count 2 valent 0, le premier scan échoue,
 * puis l'entrée 2 est choisie. ASM push EDX écrit 9E 6B B8 07, ID-store F1,
 * count-load 6B puis count-store 6C : argument réel du call=0x07B86CF1.
 * Ce C sans push anticipé donnerait count=1 et argument=0x07B86B9E.
 * Ce contre-exemple statique est EXCLU par la séparation ; il interdit une
 * revendication tous-alias. Capturer slot/commenter push ne modélise pas push.
 */

typedef unsigned char  u8;
typedef unsigned int   u32;
typedef signed char    s8;
typedef int            s32;

/*
 * Table byte par slot, base 0x001CFF082 (lecture/écriture byte uniquement).
 * Décalage d'entrée : base + slot*0x1D0 + n*5 ; ID @+0, count @+1.
 * 32 entrées par slot ; les octets [2..4] ne sont pas touchés par cette cible.
 * Arithmétique u32 AVANT cast ; mapping C32 et validité exigés ci-dessus.
 */
#define BYTE_AT(a) (*(u8 *)(u32)(a))
#define TBL_BASE   0x001CFF082u

/*
 * Callee opaque : un DWORD en pile ; add esp,4 à 486ABD et 486B27.
 * int arg est un conteneur des 32 bits, pas un type source métier prouvé.
 * int retour est un conteneur conventionnel NON UTILISÉ ; EAX est écrasé
 * ensuite aux deux sites. Prototype de modèle cdecl, ABI machine non testée.
 */
extern int sub_4954B0(int arg);

/*
 * Prototype modèle : trois DWORD de pile, cleanup appelant 12 octets.
 * arg0=[S+4] : slot, multiplié par 464 modulo 2^32, transmis intact au callee.
 * arg1=[S+8] : clé DWORD comparée aux ID bytes zéro-étendus ; LSB stocké.
 * arg2=[S+12] : 0 => ADD, nonzero => REMOVE.
 * Retours : 0 ; 1 (ADD plein ou count signé8 dans 100..127) ;
 * 255 (REMOVE absent, count initial 0, ou décrément à 0).
 */
int sub_486A10(int arg0, int arg1, int arg2)
{
    u32 slot;        /* edx : bits DWORD de arg0 */
    u32 esi;         /* offset slot = slot * 0x1D0 (mod 2^32) */
    u32 needle;      /* clé DWORD ; reload ADD à 486A4E */
    u32 idx;         /* compteur de scan 0..32 */
    u32 cur;         /* ID byte zéro-étendu */
    u32 p;           /* adresse numérique de scan */
    u32 e;           /* adresse numérique count */
    u32 off;         /* esi + idx*5, sans base */
    u32 a_id;        /* base + off, mod 2^32 */
    u32 a_cnt;       /* base + off + 1, mod 2^32 */
    u8  cnt;         /* octet de travail, wrap mod 256 */
    int found;
    int found_empty;

    /* Prologue : 486A10 lit [S+8] AVANT les quatre pushes de sauvegarde
     * EBX 486A14, EBP 486A15, ESI 486A16, EDI 486A19.
     * TEST ECX à 486A17 fournit les flags du JNZ 486A1A.
     * Pushes/pops élidés seulement sous la séparation du contrat ; aucun
     * agencement de pile compilée n'est revendiqué par ce modèle source. */
    if (arg1 == 0) {                 /* 486A17 test / 486A1A jnz loc_486A23 */
        return 0;                    /* loc_486A1C..486A22, EAX complet=0 */
    }

    if (arg2 != 0) {                 /* 486A27 test / 486A29 jnz loc_486AC7 */
        goto remove_path;
    }

    /* ================= ADD : 486A2F..486AC6 ================= */
    slot = (u32)arg0;                /* 486A2F mov edx,[esp+14h] */
    idx  = 0;                        /* 486A33 xor eax,eax */

    /* F02 : 486A35 LEA, 486A3C SUB, 486A3E LEA, 486A41 SHL :
     * esi = (slot + 4u * (slot * 8u - slot)) * 16u
     *     = slot * 464u (0x1D0), modulo 2^32.
     * Count immédiat 4 ; pour ce shift 32 bits, le masquage x86 du count
     * à 5 bits conserve 4 (il s'applique aussi au count immédiat). */
    esi  = slot * 8u;                /* 486A35 */
    esi -= slot;                     /* 486A3C */
    esi  = slot + esi * 4u;          /* 486A3E */
    esi <<= 4;                       /* 486A41 */

    p = TBL_BASE + esi;              /* 486A44 lea ebp / 486A4A mov edi,ebp */
    needle = (u32)arg1;              /* préchargé 486A10 ; première itération saute le reload */
    found = 0;
    for (;;) {
        cur = (u32)BYTE_AT(p);       /* 486A52 xor ebx / 486A54 mov bl,[edi] */
        if (cur == needle) {         /* 486A56 cmp DWORD / 486A58 jz loc_486A7F */
            found = 1;
            break;
        }
        idx++;                       /* 486A5A */
        p += 5u;                     /* 486A5B : stride entrée 5 */
        if ((s32)idx >= 32)          /* 486A5E cmp 20h / 486A61 JL signé ; idx 0..32 */
            break;
        needle = (u32)arg1;          /* loc_486A4E reload [S+8], stable sous contrat */
    }

    if (found) {
        e  = esi + idx * 4u;         /* 486A7F */
        e  = 0x001CFF083u + idx + e; /* 486A82 : adresse count */
        cnt = BYTE_AT(e);            /* 486A89 */
        if ((u32)cnt >= 100u && (u32)cnt < 128u) { /* F04 : CMP AL,64h / JGE signé8,
                                                    exactement 100..127, sans cast s8 */
            return 1;                /* loc_486A75..486A7E, aucun store */
        }
        cnt = (u8)(cnt + 1u);        /* 486A8F INC AL, wrap 255->0 */
        /* 486A91 pop edi ; 486A92 pop esi : élidés seulement sous la
         * précondition de séparation ; l'ASM lit réellement ces sauvegardes
         * AVANT le store. Ce C ne modélise pas les lectures de pile. */
        BYTE_AT(e) = cnt;            /* 486A93 store APRÈS les deux premiers pops ASM */
        return 0;                    /* 486A95..486A99, EAX complet=0 */
    }

    /* loc_486A63 : clé absente => scan des ID=0. */
    idx = 0;                         /* 486A63 */
    p = TBL_BASE + esi;              /* 486A65 redémarre à la base */
    found_empty = 0;
    for (;;) {
        if (BYTE_AT(p) == 0) {       /* 486A67 cmp byte / 486A6A jz loc_486A9A */
            found_empty = 1;
            break;
        }
        idx++;                       /* 486A6C */
        p += 5u;                     /* 486A6D */
        if ((s32)idx >= 32)          /* 486A70 / 486A73 JL signé, idx 0..32 */
            break;
    }
    if (!found_empty) {
        return 1;                    /* loc_486A75..486A7E : plein */
    }

    /* loc_486A9A : création ; ID-store -> count-load -> count-store -> call. */
    off = esi + idx * 4u;            /* 486A9A */
    /* ASM exact : 486A9D push edx à [S-20,S-16), AVANT les stores.
     * Push non modélisé par ce C ; ni slot ni ce commentaire ne le matérialisent.
     * Son élision exige la séparation, y compris de l'argument sortant. */
    off = idx + off;                 /* 486A9E : esi + idx*5, sans base */
    a_id  = TBL_BASE + off;          /* adresse ID, mod 2^32 */
    /* 486AA0 lit le LSB de arg1 à [esp+1Ch]=[S+8] après push. */
    BYTE_AT(a_id) = (u8)arg1;        /* 486AA4 */
    a_cnt = 0x001CFF083u + off;      /* adresse count, mod 2^32 */
    cnt = (u8)(BYTE_AT(a_cnt) + 1u); /* 486AAA load / 486AB0 INC : count EXISTANT, wrap */
    BYTE_AT(a_cnt) = cnt;            /* 486AB2 */
    (void)sub_4954B0((int)slot);     /* 486AB8 : argument DWORD en pile ; 486ABD cleanup 4.
                                       Retour opaque ignoré, EAX écrasé à 486AC0. */
    return 0;                        /* 486AC0..486AC6, EAX complet=0 */

    /* ================= REMOVE : 486AC7..486B33 ================= */
remove_path:
    slot = (u32)arg0;                /* 486AC7 */
    idx  = 0;                        /* 486ACB */
    esi  = slot * 8u;                /* 486ACD */
    esi -= slot;                     /* 486AD4 */
    esi  = slot + esi * 4u;          /* 486AD6 */
    esi <<= 4;                       /* 486AD9 : immédiat 4 & 31 = 4, stride 464 mod 2^32 */

    p = TBL_BASE + esi;              /* 486ADC */
    needle = (u32)arg1;              /* ECX de 486A10 : PAS de reload dans cette boucle */
    found = 0;
    for (;;) {
        cur = (u32)BYTE_AT(p);       /* 486AE2 xor ebx / 486AE4 mov bl,[edi] */
        if (cur == needle) {         /* 486AE6 cmp DWORD / 486AE8 jz loc_486AFD */
            found = 1;
            break;
        }
        idx++;                       /* 486AEA */
        p += 5u;                     /* 486AEB */
        if ((s32)idx >= 32)          /* 486AEE / 486AF1 JL signé, idx 0..32 */
            break;
    }
    if (!found) {
        return 255;                  /* loc_486AF3..486AFC, aucun store */
    }

    off = esi + idx * 4u;            /* 486AFD */
    off = idx + off;                 /* 486B00 : esi + idx*5 */
    a_cnt = 0x001CFF083u + off;      /* adresse count */
    cnt = BYTE_AT(a_cnt);            /* 486B02 */
    if (cnt == 0) {                  /* 486B08 TEST / 486B0A JZ loc_486B2A */
        return 255;                  /* loc_486B2A..486B33, ID NON effacé, aucun call */
    }
    cnt = (u8)(cnt - 1u);            /* 486B0C DEC CL, wrap mod 256 */
    BYTE_AT(a_cnt) = cnt;            /* 486B0E MOV ne modifie PAS ZF */
    if (cnt != 0) {                  /* 486B14 JNZ lit ZF issu de DEC, pas l'adresse/EAX */
        return 0;                    /* queue loc_486A1C..486A22, EAX complet=0 */
    }

    /* F06 : Le décrément atteint 0 : effacer le byte ID, appeler
     * sub_4954B0 opaque, retourner 255. */
    /* ASM exact : 486B1A push edx à [S-20,S-16), PUIS store 486B1B,
     * PUIS call 486B22. Push non modélisé par ce C, élidé sous séparation.
     * L'appel vient après le store ID=0 ; aucun rôle du corps n'est inféré. */
    BYTE_AT(TBL_BASE + off) = 0;     /* 486B1B */
    (void)sub_4954B0((int)slot);     /* 486B22 : argument DWORD en pile ; 486B27 cleanup 4.
                                       Retour opaque ignoré, EAX écrasé à 486B2D. */
    return 255;                      /* loc_486B2A..486B33, EAX complet=255 */
}

/*
 * Notes conditionnelles F01/F04/F05 :
 * - 486A91/486A92 lisent réellement les sauvegardes EDI/ESI AVANT 486A93.
 *   Ces pops sont élidés seulement sous la précondition de séparation ;
 *   aucune équivalence trace pile ou alias universel n'est revendiquée.
 * - ID byte zéro-étendu == arg1 DWORD : bits au-dessus de 0xFF => aucun match,
 *   mais création possible avec le LSB, y compris ID=0 pour une clé nonzero.
 * - CMP AL,64h/JGE signé8 bloque exactement 100..127 ; 128..255 sont négatifs
 *   en signé8 et passent à INC. La garde C n'utilise aucun cast u8->s8.
 * - INC/DEC byte : conversions vers u8 modulo 256, 255->0 à l'incrément.
 *   Les casts idx->s32 ne portent que sur 0..32, donc sont représentables.
 * - Calculs sur u32 : a_cnt = base + off + 1u = a_id + 1u modulo 2^32.
 *   Le calcul indépendant reflète l'opérande ASM, sans différence de wrap.
 *   Le cast vers pointeur exige le mapping C32 ; cette égalité n'autorise
 *   pas une arithmétique de pointeur ISO hors objet.
 * - EFLAGS de sortie hors projection ; six sites ASM fixent EAX complet :
 *   486A22=0, 486A7E=1, 486A99=0, 486AC6=0, 486AFC=255, 486B33=255.
 */
```

## Portée et statut parent

- Trois fonctions appelantes, quatre sites : `4859FE` et `485B06` dans `485610`, `48D57E` dans `48D200`, `493EE7` dans `493D80` ; cdecl trois arguments, cleanup 12 à chaque site, dernier différé à `493EEE`.
- Deux sites opaques `486AB8` et `486B22` vers `4954B0`. Index original poussé avant les écritures de table ; l'argument effectivement observé intact exige la disjonction pile/table, non prouvée par le natif. Effets mémoire et terminaison internes inconnus, retour écrasé.
- Garde signée : refus 100..127 seulement ; 128..255 autorisés, incrément 255→0 sans effacement. Création : LSB de clé stocké, incrément du count déjà présent, pas count=1. Une clé >255 ne peut jamais matcher l'ID zéro-étendu.
- Retrait : absence ou count déjà zéro → EAX=255 sans effacement. Décrément à zéro : stockage du count, push index, clear ID, CALL, puis EAX=255. Six RET simples, EAX complet `{0,1,0,0,255,255}`, jamais contrat AL seul.
- Catalogue métier cohérent avec les deux hits QMD documentaires rapportés après gel, ni certifié ni déclaré faux. Proposition numérique héritée : `sub_486A10_Table32x5_ModifierPaireOctets_Pas464`, étayée par deux familles indépendantes : pas 464/scans 32×5 et effets incrément-décrément/création-effacement. Aucun rename.
- Pack/C primaires exposés aux labels/alias IDA : non strictement aveugles. C corrigé, revue fraîche et A/V numériques indépendants avec exceptions administratives déclarées ; aucune certification universelle d'aveuglement. Un échec technique Flash `uv_spawn` remplacé une seule fois par Sol high selon contexte parent ; corrections ordinaires ≠ fallbacks. Cette propagation Sol relève de l'override de capacité utilisateur, après échecs ZAI rate-limit rapportés par la consigne ; aucun nouveau fallback, modèle ou high-readback fabriqué.
- Contrat conditionnel : index non borné, calcul d'adresses modulo 2^32 ; RAM ordinaire valide, stabilité mémoire, pile privée/disjonction table-pile-contrôle, mapping C32 et ABI opaque normale requis mais non prouvés. Alias arbitraires, propriétés ISO/backend, compilation et équivalence native/runtime non établis.
- Gate natif parent : `PASS_BOUNDED`, déjà vérifié read-only. Push IDB, sauvegarde/readback et commit restent **en attente du parent** ; aucune clôture fabriquée.
