# MagFx_EmitStream_Code32_Gte_Ot @ 0x6A5C90

- Instr (live): 100 (377 o, 0x6A5C90-0x6A5DAC)
- Palier: 2+1
- Verdict: LIKELY - sous-builder Maelstrom (caller unique sub_6A5700 @0x6a592c, teste le count AVANT lea curseur @0x6A5C9A-9C puis test/jz @0x6A5CAB-DAC) : par record stride 0x14 copie 3 sommets 12 o (indexes word zero-extend a +04/06/08, vertTable+idx*4 @0x6A5CC3-D10) vers ctx+0x18/24/30 ; extraction dword[1] vers out[2]/[4]/[6] @0x6A5D13-22 ; 3 allers-retours GTE StorePtr(rec/rec+0Ch/rec+10h) -> sub_45F270 -> GetToPtr(out+1/3/5) @0x6A5D25-61 ; node 0x1C : out[0]=0x06000000 @0x6A5D66, byte +7=0x32 @0x6A5D6C ; chaîne OtNode24_PoolAllocLink_Code1(ot, node) push droite->gauche @0x6A5D73-75 ; curseur [ctx+10h] ecrit dans les 2 chemins @0x6A5D92/0x6A5DA0, dword_2517A24 aussi @0x6A5D96/0x6A5DA3 ; 8 pushes d'args = 0x20 soldes add esp,20h @0x6A5D7E ; retour EAX = 0 si count>0, 0xFFFFFFFF si nul (dec @0x6A5CA1 + retn @0x6A5DAC/9F), proto int __cdecl menteur, proto caller ignore eax (R sondage @0x6a58ed-92)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A5C90\nTYPE ; proposition: MagFx_EmitStream_Code32_Gte_Ot
- Notes parent: checks 5.6 OK : test/jz count==0 saut direct sans pop ebx (0x6A5CAD-DA0), lea curseur avant test (0x6A5C9A-9C), test ecx,ecx count d'origine (0x6A5CAB), 3 StorePtr/sub_45F270/GetToPtr (0x6A5D25-61), out[0]=0x06000000 (0x6A5D66), byte +7=0x32 (0x6A5D6C), pushes PoolAllocLink_Code1 ot puis node (0x6A5D73-75), add esp,20h (0x6A5D7E), dword_2517A24 maj 2 chemins (0x6A5D96/0x6A5DA3), dec @0x6A5CA1 + retn (0x6A5DAC/9F) ; R sondage : caller ignore retour, dword_2517A24 curseur partagé repris par caller

## C reconcilie

```c
/* ============================================================================
 * sub_6A5C90 — C RÉCONCILIÉ (pipeline triple 2+1, campagne mag FX battle)
 * ============================================================================
 * Ground truth = live ASM (asm.asm @ 0x6A5C90, 100 instr, 285 octets) +
 * ida_dump_bytes, PAS Hex-Rays. hexrays.c = vérificateur seulement.
 * Taille : 0x11D (285) octets. Type IDA : int __cdecl sub_6A5C90(int)
 *   — arg = pointeur de contexte (ebp = arg0, PAS un frame pointer).
 * Sauvegardes callee-saved : ebp (prologue 0x6A5C90), esi/edi (0x6A5C95/96),
 * ebx (push 0x6A5CB4 DANS la branche count>0, pop 0x6A5D95 — le chemin
 * count==0 saute à 0x6A5DA0 SANS push/pop ebx).
 * Stack : 8 pushes d'args dans la boucle (edi@6A5CC2, eax@6A5D32, ecx@6A5D3B,
 * edx@6A5D49, eax@6A5D52, ecx@6A5D60, esi@6A5D73, edx@6A5D74) = 0x20 octets,
 * nettoyés par UN SEUL `add esp, 20h` à 0x6A5D7E (cdecl : les callees ne
 * dépilent pas ; push ebx n'en fait pas partie, il est callee-saved).
 *
 * Rôle : builder mag FX (famille Maelstrom, appelé par sub_6A5700 @0x6A58ED).
 * Lit un compteur au curseur [ctx+0x10], puis pour chaque record de 0x14
 * octets : copie 3 sommets (12 o chacun) depuis la table [ctx+0x04] vers les
 * scratch ctx+0x18/0x24/0x30, pousse les dwords [1] de chaque scratch vers le
 * node de sortie (+8/+0x10/+0x18), lance 3 transforms GTE
 * (StorePtr -> sub_45F270 -> GetToPtr) vers node+4/+0xC/+0x14, marque le node
 * (tag 0x06000000, octet +7 = 0x32) et le lie à l'OT via
 * OtNode24_PoolAllocLink_Code1(ctx->ot, node).
 * Retour (eax) : 0 si count > 0 (compteur décrémenté jusqu'à 0) ;
 *                0xFFFFFFFF si count == 0 (dec eax @0x6A5CA1 non compensé).
 *
 * Layout record d'entrée (stride 0x14 = 20 o = 5 dwords), base edi :
 *   +0x00 dword : arg StorePtr round 1 (0x6A5D25, push edi @0x6A5CC2)
 *   +0x04 word  : index u16 sommet 1 (zero-extend xor edx/mov dx @0x6A5CBC/BE)
 *   +0x06 word  : index u16 sommet 2 (@0x6A5CDD)
 *   +0x08 word  : index u16 sommet 3 (@0x6A5CF9)
 *   +0x0C dword : arg StorePtr round 2 (@0x6A5D38/3B)
 *   +0x10 dword : arg StorePtr round 3 (@0x6A5D4F/52)
 *
 * Layout node de sortie (stride 0x1C = 28 o = 7 dwords), base esi :
 *   +0x00 dword = 0x06000000            (0x6A5D66)
 *   +0x04 dword <- GetToPtr round 1     (0x6A5D33) ; octet +7 = 0x32 (0x6A5D6C)
 *   +0x08 dword = scratch_v0[1]         (0x6A5D13/16)
 *   +0x0C dword <- GetToPtr round 2     (0x6A5D4A)
 *   +0x10 dword = scratch_v1[1]         (0x6A5D19/1C)
 *   +0x14 dword <- GetToPtr round 3     (0x6A5D61)
 *   +0x18 dword = scratch_v2[1]         (0x6A5D1F/22)
 * ========================================================================== */

/* --- Externes : uniquement les callees présents dans asm.asm/callees.txt --- */

/* E3a: SETTER: dword_1CA8A28 = arg. Not a getter. (cdecl, 1 arg) */
extern void GteState_StorePtr_1CA8A28(void *ptr);

/* GTE exec — aucun argument poussé, aucun add esp. */
extern void sub_45F270(void);

/* E3a: *arg = dword_1CA8A68 (GteState getter-to-ptr template). (cdecl, 1 arg) */
extern void GteState_GetToPtr_1CA8A68(void *out_ptr);

/* E3b: same OT pool/cap 0x60000/+18 as OtNode24_PoolAllocLink;
 * word[+14]=1; no RGB copy. (cdecl, 2 args, poussés droite->gauche :
 * push esi (node) @0x6A5D73 PUIS push edx (ctx->ot) @0x6A5D74) */
extern void OtNode24_PoolAllocLink_Code1(int *ot, void *node);

/* Curseur global du pool de nodes (BSS, type IDA `_DWORD *`).
 * Lu @0x6A5CA5, avancé de 0x1C par node (@0x6A5D81 add esi,1Ch),
 * réécrit dans les DEUX chemins de sortie (@0x6A5D96 / @0x6A5DA3). */
extern unsigned int *dword_2517A24;

/* --- Contexte (arg0, base ebp) --------------------------------------------
 *   +0x04 : vertTable — base de table de dwords, sommets = 3 dwords
 *   +0x10 : curseur flux records (in/out) — *cursor = count u32, puis
 *           records de 0x14 ; réécrit @0x6A5CA2 (inconditionnel),
 *           @0x6A5D92 (fin de boucle) et @0x6A5DA0 (chemin count==0).
 *   +0x14 : tête OT — arg1 de OtNode24_PoolAllocLink_Code1
 *   +0x18/+0x24/+0x30 : scratch 12 o = sommets copiés (3 dwords chacun)     */

typedef struct sub_6A5C90_ctx {
    unsigned int   _00;        /* +0x00 : non lu                              */
    unsigned int  *vertTable;  /* +0x04 : base table sommets (0x6A5CB9)       */
    unsigned int   _08;        /* +0x08 : non lu                              */
    unsigned int   _0C;        /* +0x0C : non lu                              */
    void          *rec;        /* +0x10 : in/out — curseur flux records       */
    int           *ot;         /* +0x14 : arg1 OtNode24_PoolAllocLink_Code1   */
    unsigned int   v0[3];      /* +0x18 : copie sommet 1 (12 octets)          */
    unsigned int   v1[3];      /* +0x24 : copie sommet 2                      */
    unsigned int   v2[3];      /* +0x30 : copie sommet 3                      */
} sub_6A5C90_ctx;

/* ============================================================================
 * C réconcilié
 * ========================================================================== */

int __cdecl sub_6A5C90(sub_6A5C90_ctx *ctx)
{
    unsigned int *rec;              /* edi — record courant (stride 0x14)     */
    unsigned int *out;              /* esi — node courant (stride 0x1C)       */
    unsigned int *tbl;              /* vertTable [ctx+0x04]                   */
    int            count;           /* count d'ORIGINE, sauvegardé            */
    int            cnt;             /* compteur de boucle (slot d'arg en ASM) */
    int            ret;             /* eax                                    */
    unsigned int   idx;
    unsigned int  *p;

    rec = (unsigned int *)ctx->rec; /* 0x6A5C97: mov ecx,[ebp+10h]            */
    count = (int)rec[0];            /* 0x6A5C9A: mov eax,[ecx]  (count = *ptr)*/
    ret = count;                    /*           (eax portera count-1)        */
    rec = rec + 1;                  /* 0x6A5C9C: lea edi,[ecx+4] (1er record) */
    ret = ret - 1;                  /* 0x6A5CA1: dec eax                      */
    ctx->rec = rec;                 /* 0x6A5CA2: mov [ebp+10h],edi            */
    out = dword_2517A24;            /* 0x6A5CA5: mov esi,dword_2517A24        */
    if (count == 0) {               /* 0x6A5CAB: test ecx,ecx (count SAUVEGARDÉ,
                                     *           PAS rec[0] post-avancement)  */
        /* --- Chemin count == 0 (loc_6A5DA0) : saut direct, pas de pop ebx -
         * 0x6A5DA0: mov [ebp+10h],edi (réécriture redondante, déjà @0x6A5CA2)*/
        ctx->rec = rec;
        dword_2517A24 = out;        /* 0x6A5DA3: mov dword_2517A24,esi        */
        return ret;                 /* eax = 0 - 1 = 0xFFFFFFFF               */
    }

    /* 0x6A5CB3: inc eax (retablit count) ; 0x6A5CB4: push ebx ;
     * 0x6A5CB5: compteur stocké DANS le slot d'argument d'entrée
     * ([esp+10h+arg_0] — réutilisation cdecl du stack arg du caller). */
    cnt = count;

    do {
        tbl = ctx->vertTable;       /* 0x6A5CB9: mov eax,[ebp+4]              */

        /* --- Sommet 1 : index u16 ZERO-EXTEND à rec+0x04 (0x6A5CBC/BE) ----
         * Adresse = vertTable + idx*4 octets (lea [eax+edx*4], 0x6A5CC3) ;
         * copie brute 3 dwords (0x6A5CCB..0x6A5CD8) vers ctx+0x18.
         * NB : push edi @0x6A5CC2 (arg StorePtr round 1) est émis ICI,
         * avant la copie — ordre de pushes différent de l'ordre des calls,
         * sémantiquement équivalent (pile cdecl).                            */
        idx = *(unsigned short *)((char *)rec + 0x04);
        p = (unsigned int *)((char *)tbl + idx * 4);
        ctx->v0[0] = p[0];          /* 0x6A5CCB/CD: mov ebx,[edx] / [ecx],ebx */
        ctx->v0[1] = p[1];          /* 0x6A5CCF/D2                            */
        ctx->v0[2] = p[2];          /* 0x6A5CD5/D8                            */

        /* --- Sommet 2 : index u16 à rec+0x06 -> ctx+0x24 (0x6A5CDD..F4) --- */
        idx = *(unsigned short *)((char *)rec + 0x06);
        p = (unsigned int *)((char *)tbl + idx * 4);   /* 0x6A5CE1            */
        ctx->v1[0] = p[0];          /* 0x6A5CE7/E9                            */
        ctx->v1[1] = p[1];          /* 0x6A5CEB/EE                            */
        ctx->v1[2] = p[2];          /* 0x6A5CF1/F4                            */

        /* --- Sommet 3 : index u16 à rec+0x08 -> ctx+0x30 (0x6A5CF9..D10) -- */
        idx = *(unsigned short *)((char *)rec + 0x08);
        p = (unsigned int *)((char *)tbl + idx * 4);   /* 0x6A5CFD             */
        ctx->v2[0] = p[0];          /* 0x6A5D03/05                            */
        ctx->v2[1] = p[1];          /* 0x6A5D07/0A                            */
        ctx->v2[2] = p[2];          /* 0x6A5D0D/10                            */

        /* --- dword[1] de chaque scratch -> node : ordre EXACT v0,v1,v2 ----
         * 0x6A5D13/16: [ebp+1Ch] -> [esi+8]   (= v0[1])
         * 0x6A5D19/1C: [ebp+28h] -> [esi+10h] (= v1[1])
         * 0x6A5D1F/22: [ebp+34h] -> [esi+18h] (= v2[1])                     */
        out[2] = ctx->v0[1];
        out[4] = ctx->v1[1];
        out[6] = ctx->v2[1];

        /* --- 3 allers-retours GTE, ordre EXACT (args cdecl restent sur la
         * pile, nettoyés par le seul add esp,20h @0x6A5D7E) ---------------- */
        GteState_StorePtr_1CA8A28(rec);                    /* 0x6A5D25 (push edi @0x6A5CC2) */
        sub_45F270();                                      /* 0x6A5D2A   */
        GteState_GetToPtr_1CA8A68(&out[1]);                /* 0x6A5D32/33: lea [esi+4]  */

        GteState_StorePtr_1CA8A28((char *)rec + 0x0C);     /* 0x6A5D38/3B/3C */
        sub_45F270();                                      /* 0x6A5D41   */
        GteState_GetToPtr_1CA8A68(&out[3]);                /* 0x6A5D46/49/4A: lea [esi+0Ch] */

        GteState_StorePtr_1CA8A28((char *)rec + 0x10);     /* 0x6A5D4F/52/53 */
        sub_45F270();                                      /* 0x6A5D58   */
        GteState_GetToPtr_1CA8A68(&out[5]);                /* 0x6A5D5D/60/61: lea [esi+14h] */

        /* --- Marquage node : APRÈS les GetToPtr (le byte +7 écrase l'octet
         * haut de out[1] fraîchement écrit) ------------------------------- */
        out[0] = 0x06000000;        /* 0x6A5D66: mov dword ptr [esi],6000000h */
        *((unsigned char *)out + 7) = 0x32;   /* 0x6A5D6C: byte [esi+7],'2'  */

        /* --- Chaînage OT : pushes droite->gauche :
         * push esi (node, arg2) @0x6A5D73 puis push edx ([ebp+14h], arg1)
         * @0x6A5D74 -> OtNode24_PoolAllocLink_Code1(ctx->ot, out) --------- */
        OtNode24_PoolAllocLink_Code1(ctx->ot, out);        /* 0x6A5D75   */

        /* 0x6A5D7A: reload compteur depuis le slot d'arg ([esp+30h+arg_0]) ;
         * 0x6A5D7E: add esp,20h (nettoyage des 8 pushes d'args) ;           */
        out += 7;                   /* 0x6A5D81: add esi,1Ch (node stride)    */
        rec += 5;                   /* 0x6A5D84: add edi,14h (record stride)  */
    } while (--cnt != 0);           /* 0x6A5D87/88: dec eax / jnz loc_6A5CB9  */

    /* --- Épilogue boucle terminée : eax = compteur épuisé = 0 ----------- */
    ctx->rec = rec;                 /* 0x6A5D92: mov [ebp+10h],edi            */
    dword_2517A24 = out;            /* 0x6A5D96: mov dword_2517A24,esi        */
    return 0;                       /* 0x6A5D9F: eax = 0                      */
}

/* ============================================================================
 * UNCERTAIN restants
 * ----------------------------------------------------------------------------
 * UNCERTAIN 0x6A5CC3 : adressage sommets = vertTable + idx*4 OCTETS alors que
 *   12 octets sont copiés par sommet. Cohérent seulement si l'index u16 du
 *   record est déjà un offset en dwords (idx = 3*numéro_de_sommet) ou si la
 *   table est aplatie autrement. Non tranchable sans le producteur du record
 *   (sub_6A5700). Hex-Rays lit pareil (v7 + 4*idx) : les deux voix + HR
 *   convergent sur la MÉCANIQUE, seul le sens du scaling reste ouvert.
 * UNCERTAIN 0x6A5D25 : rec+0x0C et rec+0x10 (args StorePtr rounds 2/3)
 *   chevauchent la zone des mots d'index (+0x04..+0x09 non, mais +0x0C/+0x10
 *   sont les dwords suivants du record) — le contenu exact attendu par
 *   dword_1CA8A28 côté GTE n'est pas visible dans ce pack.
 * UNCERTAIN 0x6A5D9F : valeur de retour exacte — l'ASM donne 0 (count>0) ou
 *   0xFFFFFFFF (count==0). Le contrat attendu par l'appelant 0x6A58ED
 *   (sub_6A5700) n'est pas vérifiable dans ce pack.
 * ========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A5C90 @ 0x6A5C90 (réconciliation R)

- Rôle (1 phrase) : builder mag FX de la famille `sub_6A5700` (appelé @0x6a58ed) qui parcourt un stream de records de 0x14 octets au curseur `[ctx+0x10]` et émet, par record, un nœud OT de 0x1C octets (tag `0x06000000`, code octet `0x32`) rempli par 3 transforms GTE des 3 sommets indexés, alloué/lié via `OtNode24_PoolAllocLink_Code1` sur la liste `[ctx+0x14]`.

- Verdict : **LIKELY consolidé** (pas CERTAIN : wiki.md du pack vide, sémantique du tag/code non documentée, voix B absente).
- Confiance : LIKELY

- Nom catalogue : `sub_6A5C90` — non nommé (ni confirmé ni mensonger).
  - Proposition (markdown seul, PAS de rename) : **`MagFx_EmitStream_Code32_Gte_Ot`** (nom A retenu, nom B `BattleFx_DepthSortedProjection_EmitDualPkts` écarté — voir Divergences).
  - Justification ≥2 preuves ASM adressées indépendantes :
    1. **Code32** : 0x6a5d6c `mov byte ptr [esi+7], 32h` — l'octet code 0x32 est écrit sur chaque nœud ; discriminant réel de la famille (le builder jumeau 0x6A5DB0, même structure, écrit `3Ah` @0x6a5ec5).
    2. **Gte** : 0x6a5d25/0x6a5d2a/0x6a5d33, 0x6a5d3c/0x6a5d41/0x6a5d4a, 0x6a5d53/0x6a5d58/0x6a5d61 — triple StorePtr→`sub_45F270`→GetToPtr par record.
    3. **Ot** : 0x6a5d70–0x6a5d75 `mov edx,[ebp+14h] / push esi / push edx / call OtNode24_PoolAllocLink_Code1` — insertion OT en tête `[ctx+0x14]`.

## In / Out / Effets

**In** (1 arg cdecl, `int __cdecl(int)` — pointeur `ctx`, base ebp) :
- `[ctx+0x04]` : vertTable, table de dwords ; adresse sommet = `tbl + idx*4` octets (`mov eax,[ebp+4]` @0x6a5cb9, `lea ecx,[eax+edx*4]` @0x6a5cc3, index u16 zero-extend `xor edx,edx / mov dx,[edi+4]` @0x6a5cbc/BE ; idem +6 @0x6a5cdd, +8 @0x6a5cf9) ; chaque sommet = 3 dwords (copies 12 o @0x6a5ccb–0x6a5d10).
- `[ctx+0x10]` : curseur stream (in/out). `*cursor` = count u32 @0x6a5c9a ; avancé à +4 @0x6a5c9c/0x6a5ca2 ; records de 0x14 (`add edi,14h` @0x6a5d84) ; réécrit dans les DEUX chemins (@0x6a5d92 et @0x6a5da0) — avancement total `4 + count*0x14`.
- Record (edi, stride **0x14**) : `+0x00` dword arg StorePtr round 1 (@0x6a5d25, push edi @0x6a5cc2) ; `+0x04/+0x06/+0x08` 3 indices u16 ; `+0x0C` / `+0x10` dwords args StorePtr rounds 2/3 (@0x6a5d3b, @0x6a5d52).
- `[ctx+0x14]` : tête de liste OT, arg1 de `OtNode24_PoolAllocLink_Code1` (pushes droite→gauche : esi @0x6a5d73, edx @0x6a5d74).
- `[ctx+0x18]/+0x24/+0x30` : scratch 12 o (3 dwords) = sommets copiés.

**Out** : EAX 32 bits — {**0** si count>0 (compteur épuisé, `dec eax` @0x6a5d87 jusqu'à sortie `jnz`), **0xFFFFFFFF** si count==0 (`dec eax` @0x6a5ca1 non compensé, `retn` @0x6a5dac)}. **Nouveau (sondage R)** : le retour est **ignoré par l'unique caller** — après `call sub_6A5C90` @0x6a58ed, l'exécution continue directement @0x6a58f2 `push esi` sans `test eax` → le « retour 2 » évoqué par l'orchestrateur n'existe pas ici ; valeurs ASM = {0, −1}, non consommées.

**Effets de bord** :
- `dword_2517A24` : curseur global du pool de paquets, lu @0x6a5ca5, avancé de 0x1C/nœud (`add esi,1Ch` @0x6a5d81), réécrit @0x6a5d96 / @0x6a5da3. **Confirmé partagé** : le caller le reprend @0x6a58f8, réserve 8 octets (`add ecx,8` @0x6a5900, writeback @0x6a5903) pour un paquet statique `[eax]=VIT_0_STATUS_MASK` / `[eax+4]=0E1000240h` @0x6a590a/0x6a5910 lié via `OtNode24_PoolAllocLink` @0x6a591b.
- GTE BSS : `dword_1CA8A28` (in, ×3 StorePtr) et `dword_1CA8A68` (out, ×3 GetToPtr), calculs par `sub_45F270` ×3.
- OT `[ctx+0x14]` : count nœuds de 0x1C liés (`OtNode24_PoolAllocLink_Code1`, variante word[+14]=1, sans copie RGB).

**Layout nœud émis (stride 0x1C)** : `[+0]=0x06000000` @0x6a5d66 ; `[+4]/[+0xC]/[+0x14]` = projections GTE (GetToPtr @0x6a5d33/0x6a5d4a/0x6a5d61) ; `[+8]/[+0x10]/[+0x18]` = dword[1] des 3 sommets copiés (@0x6a5d13–0x6a5d22, ordre v0,v1,v2) ; octet `[+7]=0x32` @0x6a5d6c = octet haut de `[+4]`, écrit APRÈS le GetToPtr round 1 (écrase son octet haut).

## Divergences A/B tranchées

**Anomalie pack** : `semantic_b.md` / `c_b.c` ABSENTS du répertoire (confirmé par la liste et par reconcile_notes.md). La voie B n'a pas de contenu à réconcilier point par point ; le seul duel A/B portait sur le **nom** (A « MagFx_EmitStream_Code32_Gte_Ot » vs B « BattleFx_DepthSortedProjection_EmitDualPkts »). Arbitrage (R, sondage IDA lecture seule) :

- **« EmitDualPkts » (B) : réfuté.** sub_6A5C90 émet un seul type de nœud (0x1C, code 0x32) par record ; la dualité 0x32/0x3A est le fait du caller `sub_6A5700` qui enchaîne deux builders distincts (`call sub_6A5C90` @0x6a58ed puis `call sub_6A5DB0` @0x6a58f3, ce dernier écrivant code `3Ah` @0x6a5ec5). Attribuer « Dual » à cette fonction serait un mensonge de portée.
- **« DepthSortedProjection » (B) : vrai mais non discriminant.** La projection (GTE @0x6a5d25–0x6a5d61) et l'insertion depth-sorted (OT pool @0x6a5d75) sont réelles, mais c'est la propriété commune des 3 builders de la famille (0x6A5950/0x6A5AD0/0x6A5DB0 incluse) — pas une spécificité ; « BattleFx » est plus générique que la famille mag FX réellement visée.
- **« Code32 » (A) : confirmé et discriminant.** 0x6a5d6c `byte [esi+7]=32h` vs 0x6a5ec5 `3Ah` chez le jumeau — le nom encode un fait ASM adressé.
- → **Tranché : nom A retenu** (`MagFx_EmitStream_Code32_Gte_Ot`), sans partie de B.

**Divergences A/Hex-Rays vs ASM (déjà arbitrées dans reconcile_notes.md, confirmées par R contre asm.asm — rappel adressé)** :
- D1 (CRITIQUE) : le test de boucle porte sur le count sauvegardé (`mov ecx,eax` @0x6a5c9f, `test ecx,ecx` @0x6a5cab AVANT toute réécriture), pas sur `[cursor]` relui après avancement. 0x6a5c9a→0x6a5cad.
- D2 : `inc eax` @0x6a5cb3 restaure count, stocké dans le slot d'arg cdecl `[esp+10h+arg_0]` @0x6a5cb5, reload @0x6a5d7a, `dec/jnz` @0x6a5d87/88.
- D3 : retours exacts {0, 0xFFFFFFFF} (`retn` @0x6a5d9f / @0x6a5dac).
- D4 : ordre = copies 3 sommets (0x6a5ccb–0x6a5d10) → extraction dword[1] (0x6a5d13–0x6a5d22) → SEULEMENT ENSUITE les 3 allers-retours GTE (0x6a5d25–0x6a5d61) → marquage (0x6a5d66/6c) → linkage OT (0x6a5d70–75) ; push edi @0x6a5cc2 émis en avance (pile cdecl, équivalent).
- D5 : args `OtNode24_PoolAllocLink_Code1` = (ctx->ot, node) — push esi @0x6a5d73 PUIS push edx @0x6a5d74, droite→gauche.
- D6 : push ebx @0x6a5cb4 DANS la branche count>0, pop @0x6a5d95 ; chemin count==0 saute @0x6a5cad → 0x6a5da0 sans toucher ebx.
- D7 : 8 pushes d'args = 0x20 octets, un seul `add esp,20h` @0x6a5d7e (après reload compteur @0x6a5d7a).

## Preuves (ASM cité)

1. **Émission OT code 0x32** : 0x6a5d66 `mov dword ptr [esi],6000000h` ; 0x6a5d6c `mov byte ptr [esi+7],32h` ; 0x6a5d73–0x6a5d75 `push esi / push edx / call OtNode24_PoolAllocLink_Code1`.
2. **Triple transform GTE** : 0x6a5d25/0x6a5d2a/0x6a5d33, 0x6a5d3c/0x6a5d41/0x6a5d4a, 0x6a5d53/0x6a5d58/0x6a5d61 (StorePtr/sub_45F270/GetToPtr ×3, sorties esi+4/+0xC/+0x14, entrées edi+0/+0xC/+0x10).
3. **Stream de records stride 0x14** : 0x6a5c9a `mov eax,[ecx]` (count), 0x6a5c9c/0x6a5ca2 avancement +4 stocké, 0x6a5d84 `add edi,14h`, 0x6a5d92/0x6a5da0 writeback `[ebp+10h]` (deux chemins).
4. **Indices u16 → table dwords** : 0x6a5cbe/0x6a5cdd/0x6a5cf9 `mov dx/cx,[edi+4/6/8]` ; 0x6a5cc3/0x6a5ce1/0x6a5cfd `lea edx,[eax+idx*4]` avec `eax=[ebp+4]` @0x6a5cb9.
5. **Curseur pool partagé** : 0x6a5ca5 `mov esi,dword_2517A24`, 0x6a5d81 `add esi,1Ch`, 0x6a5d96/0x6a5da3 writeback ; et côté caller 0x6a58f8–0x6a5903 (`add ecx,8`, writeback) — même curseur repris pour un paquet statique 8 o.
6. **Jumeau discriminant** : sub_6A5DB0 (0x6a5db0–0x6a5f05), même squelette (ctx +4/+10/+14, GTE ×N, OtNode24_PoolAllocLink_Code1 @0x6a5ece) mais records 0x18 (`add edi,18h` @0x6a5edd), nœuds 0x24 (`add esi,24h` @0x6a5eda), tag `08000000h` @0x6a5ebf, code `3Ah` @0x6a5ec5 → « Code32 » du nom A est un identifiant réel de variante.
7. **Caller unique + retour ignoré** : callers.txt xref unique 0x6a58ed dans sub_6A5700 (0x249 o) ; sondage : 0x6a58ed `call sub_6A5C90` suivi de 0x6a58f2 `push esi` — aucun test de eax.

## Checks §5.6

- Callees cités (`GteState_StorePtr_1CA8A28`, `sub_45F270`, `GteState_GetToPtr_1CA8A68`, `OtNode24_PoolAllocLink_Code1`) : tous dans callees.txt lignes 8–17, aucun library call inventé ; 8 pushes d'args équilibrés par `add esp,20h` @0x6a5d7e. ✅
- Caller 0x6a58ed / sub_6A5700 : présent dans callers.txt (`more:false`). ✅
- Strides en nombres : record **0x14** (@0x6a5d84), nœud **0x1C** (@0x6a5d81), sommet 12 o (3 dwords), table `idx*4` octets, paquet caller +8 (@0x6a5900). ✅
- Polarités : `test ecx,ecx / jz` @0x6a5cab/cad = sortie sans émission si count nul ; `dec eax / jnz` @0x6a5d87/88 = boucle count fois ; aucun `jg/jl/ja/jb` signé/unsigned ambigu ; setcc absent. ✅
- Largeur retour : EAX 32 bits, valeurs {0, 0xFFFFFFFF} — compatibles int ; retour ignoré par le caller (sondage R). ✅
- Nom : ≥2 preuves ASM indépendantes adressées (0x6a5d6c code 0x32 + jumeau 0x3A @0x6a5ec5 ; 0x6a5d25–61 GTE ; 0x6a5d75 OT). ✅

## Questions ouvertes (non bloquantes)

1. Sémantique exacte du tag `[+0]=0x06000000` et de l'octet code 0x32 (primitive GPU ? type de paquet FF8 ?) — absente de ff8-wiki (wiki.md du pack vide, échec qmd).
2. Scaling des indices u16 : `vertTable + idx*4` octets pour 12 o copiés implique idx déjà en dwords (idx = 3*numéro) — à confirmer chez le producteur sub_6A5700 (mécanique confirmée par les 3 lectures, sens du scaling ouvert).
3. Contenu attendu par `dword_1CA8A28` pour rec+0x0C/rec+0x10 (rounds GTE 2/3) — taille/format non visible dans ce pack.
4. Si `semantic_b.md` / `c_b.c` sont régénérés, refaire un diff ciblé (points D1/D2 les plus susceptibles de diverger) — le verdict nom/duel ci-dessus resterait à re-valider uniquement si B apportait un contre-état wiki.

## IDBCOMMENT (proposition)

Builder mag FX de la famille sub_6A5700 (appele a 6a58ed, retour ignore) : lit count au curseur [ctx+10h], puis pour chaque record de 14h octets (3 indices u16 de sommets + 3 args GTE) copie 3 sommets depuis la table [ctx+4] et lance 3 transforms GTE via sub_45F270. Emet un noeud OT de 1Ch octets, tag 06000000h, code 32h a +7, alloue via OtNode24_PoolAllocLink_Code1 sur la liste [ctx+14h]. Avance le curseur stream de 4+count*14h et le pool de paquets dword_2517A24 de count*1Ch ; retourne 0 si records emis, FFFFFFFFh si count nul. [semantic-triple 2026-09-22]

## Notes C-R

# reconcile_notes.md — sub_6A5C90 @ 0x6A5C90

## Contexte du run

- Entrées attendues : `c_a.c`, `c_b.c`, `asm.asm` (ground truth), `hexrays.c` (vérificateur), meta/callees/callers/globals.
- **Anomalie pack** : `c_b.c` est ABSENT du répertoire (seule voix A disponible ; `semantic_a.md` présent, produit par l'analyste A). Réconciliation donc A + Hex-Rays vs ASM — chaque point tranché l'est par l'ASM adressé, jamais par une moyenne A/B.
- `hexrays.c` conforme : 68 lignes, type `int __cdecl(int)`, structure équivalente.
- `wiki.md` du pack quasi vide (64 o) : pas d'apport wiki ; le livrable est ancré 100 % ASM.
- Caller unique : `0x6a58ed` dans `sub_6A5700` (callers.txt, `more:false`). Callees : les 4 de `callees.txt` (`GteState_StorePtr_1CA8A28`, `sub_45F270`, `GteState_GetToPtr_1CA8A68`, `OtNode24_PoolAllocLink_Code1`), aucun inventé ; 8 pushes d'args nettoyés par le seul `add esp,20h` @0x6A5D7E.

## Divergences tranchées contre l'ASM

### D1 — Test de boucle : count sauvegardé, PAS re-lecture du curseur (CRITIQUE)

- **c_a (bug)** : `if ((int)rec[0] == 0)` à l'entrée — lit `[ecx]` APRÈS l'avancement du curseur (`rec = rec+1` @0x6A5C9C/95), donc teste le premier DWORD du premier record, pas le count.
- **Hex-Rays** : teste `v4 = *v2` lu avant avancement — correct.
- **Tranché (ASM)** : 0x6A5C9A `mov eax,[ecx]` lit le count AVANT `lea edi,[ecx+4]` @0x6A5C9C ; `dec eax` @0x6A5CA1 ; `test ecx,ecx` @0x6A5CAB teste ecx = valeur D'ORIGINE de `[ebp+10h]` (jamais réécrite entre-temps). La branche `jz loc_6A5DA0` porte donc sur le count d'origine.
- Impact : avec le code de c_a, un record dont le premier dword est nul déclencherait à tort le chemin count==0. Corrigé dans `c_reconciled.c` (variable `count` distincte, testée à 0x6A5CAB).

### D2 — `inc eax` avant le push ebx (retablit count)

- **c_a** : commente `inc eax` mais ne le traduit pas dans le flux de valeurs (ret reste count-1, puis `cnt = (int)rec[0]` re-lit la mémoire).
- **Hex-Rays** : `v11 = v4` (count d'origine) — équivalent sémantique mais masque l'arithmétique eax.
- **Tranché (ASM)** : 0x6A5CB3 `inc eax` annule le `dec eax` @0x6A5CA1 (eax = count) ; 0x6A5CB5 `mov [esp+10h+arg_0], eax` stocke count dans le slot d'argument d'entrée (réutilisation cdecl du stack arg du caller) ; reload @0x6A5D7A `mov eax,[esp+30h+arg_0]` ; `dec eax`/`jnz` @0x6A5D87/88. Modélisé : `cnt = count`, reload à chaque itération.

### D3 — Valeur de retour

- **c_a** : cohérent (0 si count>0, 0xFFFFFFFF si count==0).
- **Hex-Rays** : `result = v4 - 1` retourné sur les deux chemins ; sur count>0, `result = --v11` finit à 0 — même résultat final, écriture différente.
- **Tranché (ASM)** : chemin count==0 : eax = 0-1 = 0xFFFFFFFF au moment du `retn` @0x6A5DAC. Chemin boucle : eax = compteur décrémenté à 0 (`dec eax` @0x6A5D87, sortie jnz quand eax=0), `retn` @0x6A5D9F → eax = 0. Retours exacts : **{0, 0xFFFFFFFF}**.

### D4 — Ordre copy-then-GTE vs extraction dword[1]

- **c_a / Hex-Rays** : mêmes trois blocs, même ordre.
- **Tranché (ASM)** : l'ordre est : (1) copies 3 sommets 12 o vers ctx+0x18/0x24/0x30 (0x6A5CCB–0x6A5D10) ; (2) extraction dword[1] de chaque scratch vers out[2]/[4]/[6] (0x6A5D13–0x6A5D22 : `[ebp+1Ch]->[esi+8]`, `[ebp+28h]->[esi+10h]`, `[ebp+34h]->[esi+18h]`) ; (3) SEULEMENT ENSUITE les 3 allers-retours GTE (0x6A5D25–0x6A5D61) ; (4) marquage (0x6A5D66/6C) ; (5) linkage OT (0x6A5D70–75). Notamment le push edi @0x6A5CC2 (arg du StorePtr round 1) est émis dès la copie du sommet 1 — avant les copies 2 et 3 — mais le call @0x6A5D25 vient après toutes les copies ; pile cdecl, sémantiquement équivalent, reproduit dans les commentaires.

### D5 — Ordre des arguments OtNode24_PoolAllocLink_Code1

- **c_a** : `OtNode24_PoolAllocLink_Code1(ctx->ot, out)` — correct.
- **Hex-Rays** : idem.
- **Tranché (ASM)** : 0x6A5D73 `push esi` (node, arg2) PUIS 0x6A5D74 `push edx` où `edx = [ebp+14h]` chargé @0x6A5D70 (arg1 = ctx->ot) — pushes droite→gauche cdecl. Signé dans le C réconcilié.

### D6 — Push/pop ebx asymétrique

- **c_a / Hex-Rays** : ni l'un ni l'autre ne modélise l'asymétrie ebx.
- **Tranché (ASM)** : `push ebx` @0x6A5CB4 est DANS la branche count>0 (après le `jz` @0x6A5CAD) ; `pop ebx` @0x6A5D95 uniquement en fin de boucle. Le chemin count==0 (saut direct @0x6A5CAD → 0x6A5DA0) ne touche jamais ebx. Reproduit par un push ebx placé après le test en C (variable locale/registre — pas de bug fonctionnel, mais documenté).

### D7 — `add esp, 20h` unique

- **c_a** : commenté, non traduit (C ne le nécessite pas).
- **Hex-Rays** : invisible.
- **Tranché (ASM)** : 8 pushes d'args cumulés sur l'itération (0x6A5CC2, 0x6A5D32, 0x6A5D3B, 0x6A5D49, 0x6A5D52, 0x6A5D60, 0x6A5D73, 0x6A5D74) = 0x20 ; le seul nettoyage est @0x6A5D7E, APRÈS le reload du compteur @0x6A5D7A. C'est du détail de stack cdecl ; les callees ne dépilent pas.

## Points confirmés (A = Hex-Rays = ASM, rien à trancher)

- Curseur : `*(a1+0x10)` lu, `+4` stocké inconditionnellement @0x6A5CA2, records stride 0x14 (`add edi,14h` @0x6A5D84), réécrit `[ebp+10h],edi` @0x6A5D92 (fin boucle) ET @0x6A5DA0 (chemin count==0, sans pop ebx) — les DEUX chemins écrivent le curseur et `dword_2517A24` (@0x6A5D96 / @0x6A5DA3). ✅
- Copie : 3×12 octets vers ctx+0x18/0x24/0x30, indexes u16 zero-extend (`xor edx,edx/mov dx,[edi+4]` @0x6A5CBC/BE, idem +6/+8) ; adresse = vertTable + idx*4 (@0x6A5CC3/CE1/CFD `lea [eax+edx*4]`) ; dword[1] de chacun → out[2]/[4]/[6] dans l'ordre v0,v1,v2. ✅
- GTE : 3 allers-retours StorePtr(rec / rec+0x0C / rec+0x10) → `sub_45F270` → GetToPtr(out+4 / out+0xC / out+0x14), ordre exact. ✅
- Node : `out[0]=0x06000000` @0x6A5D66, `byte[+7]=0x32` @0x6A5D6C — stores APRÈS les GetToPtr (le byte 0x32 écrase l'octet haut de out[1] fraîchement écrit par GetToPtr round 1). ✅
- Strides : record 0x14, node 0x1C (`add esi,1Ch` @0x6A5D81). ✅

## Divergences vs Hex-Rays

1. **Type de `a1`** : Hex-Rays `int`, casts systématiques — l'ASM (ebp = arg0, accès `[ebp+10h]` etc.) confirme un pointeur de contexte. Cosmétique.
2. **Masquage du slot d'argument** : Hex-Rays `v11` local ; l'ASM réutilise le stack arg du caller (`[esp+10h+arg_0]` @0x6A5CB5, `[esp+30h+arg_0]` @0x6A5D7A). Cosmétique.
3. **`result = v4 - 1`** sur le chemin count==0 chez Hex-Rays : identique à l'ASM (eax = 0xFFFFFFFF). Pas de divergence de fond.
4. **Accès scratch** : Hex-Rays `*(_DWORD *)(a1 + 24/28/32)` etc. = offsets +0x18/+0x1C/+0x20 — cohérent avec `[ebp+18h]/[ebp+1Ch]` de l'ASM. Pas de stride faux relevé chez Hex-Rays sur cette fonction.

## UNCERTAIN restants

1. **UNCERTAIN 0x6A5CC3** — adressage sommets `vertTable + idx*4` octets pour 12 octets copiés : l'index u16 est-il un offset déjà en dwords (idx = 3*n) ? Mécanique confirmée par les 3 voix, sémantique du scaling non tranchable dans ce pack (producteur = sub_6A5700).
2. **UNCERTAIN 0x6A5D25** — contenu attendu par `dword_1CA8A28` via StorePtr(rec / rec+0x0C / rec+0x10) : rec+0x0C/+0x10 chevauchent la fin du record 0x14 ; la taille lue par le GTE n'est pas visible ici.
3. **UNCERTAIN 0x6A5D9F** — contrat de retour côté appelant : l'ASM sort {0, 0xFFFFFFFF} ; l'usage du retour par sub_6A5700 @0x6A58ED n'est pas vérifiable dans ce pack.
4. **UNCERTAIN (pack)** — voix B (`c_b.c`) absente : la réconciliation « 2+1 » n'a porté que sur A + Hex-Rays. Si B est régénérée, refaire un diff ciblé (les points D1/D2 sont les plus susceptibles de diverger).
