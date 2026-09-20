# Ot_EmitQuadList_Gated @ 0x69E420

- Instr (live): 156 (444 o, 0x69E420-0x69E5DB)
- Palier: 2+1 (voix A + voix B, reconciliation C-R contre l'ASM live)
- Verdict: LIKELY - emetteur gate de liste de quads OT : cull = ET des 4 flags (0x69E4E2-0x69E4F4), packet 0x28 o (tag dword 9000000h 0x69E58B, octet 2Eh 0x69E591), chainage OtNode24_PoolAllocLink_Code1 (0x69E599), curseur +4 inconditionnel (0x69E42C), retour EAX = curseur avance (0x69E5BE), FFFFFFFF si count nul (0x69E431)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_69E420\nTYPE ; proposition: Ot_EmitQuadList_Gated
- Notes parent: checks 5.6 OK : add ecx,4 (0x69E42C), dec/inc eax (0x69E431/0x69E448), cull jnz (0x69E4F4), push edi/edx + add esp,8 (0x69E52A/0x69E598/0x69E59E), dword 9000000h (0x69E58B), sub_808080 const + byte 2Eh (0x69E581/0x69E591), stride 28h (0x69E5A1), boucle jnz (0x69E5B8), retour eax,ecx (0x69E5BE), caller sub_69E020 @0x69E27A unique

## C reconcilie

```c
/* c_reconciled.c — sub_69E420, EA 0x69E420 (pipeline triple 2+1, voix C-R)
 * Ground truth = live ASM (asm.asm, 0x69E420-0x69E5DB, 444 octets, 156 instructions) + ida_dump_bytes, PAS Hex-Rays.
 * Type IDA : unsigned __int16 *__cdecl sub_69E420(int)
 * Sauvegardes (ordre pile) : push ecx (slot scratch, cf. ci-dessous), esi, edi — puis ebx, ebp
 *   poussés APRÈS le test count==0 (0x69E447/0x69E449), donc non restaurés sur le chemin vide
 *   (cohérent : ils ne sont pas encore poussés). push ecx @0x69E420 sert de slot local :
 *   recyclé en [esp+arg_0] = pointeur enregistrement courant (0x69E43D).
 * Callee unique : OtNode24_PoolAllocLink_Code1 — 2 args cdecl (add esp,8 @0x69E59E).
 * Global unique : dword_2510114 — tête/curseur d'écriture du buffer de nodes OT, avancé de
 *   0x28 par node ÉMIS uniquement, sauvegardé à la sortie (0x69E5C4 / 0x69E5D2).
 *
 * Divergences A/B tranchées contre l'ASM : voir reconcile_notes.md.
 */

typedef unsigned int   u32;
typedef unsigned short u16;
typedef unsigned char  u8;

/* esi = arg0 (pointeur de contexte). Offsets tous déduits de l'ASM. */
struct ctx_69E420 {                 /* base esi */
    u32        f00;                 /* +0x00 : jamais lu ici */
    u32       *vtx_tab;             /* +0x04 : base table ; lecture entrée = base + idx*4 OCTETS (lea [eax+edx*4]) */
    u32        f08;                 /* +0x08 : entre dans le word de flags du node (somme >> 6 & 0xF) */
    u32        f0C;                 /* +0x0C : bits de mode (0x200 -> bit 11 ; bit 4 -> bit 4) */
    u32       *cur;                 /* +0x10 : curseur flux : dword compteur puis N enregistrements de 0x18 */
    void      *ot_pool;             /* +0x14 : arg1 passé à OtNode24_PoolAllocLink_Code1 */
    u32        entA[3];             /* +0x18..0x23 : staging vertex A (12 octets : d0, d1, d2) */
    u32        entB[3];             /* +0x24..0x2F : staging vertex B */
    u32        entC[3];             /* +0x30..0x3B : staging vertex C */
    u32        entD[3];             /* +0x3C..0x47 : staging vertex D */
};
/* Enregistrement du flux, stride 0x18 (add ecx,18h @0x69E5AC) :
 *   +0x00..+0x03 jamais lus ici ;
 *   4 words 16 bits zero-extend (xor edx,edx / mov dx) à +0x04,+0x06,+0x08,+0x0A
 *   = 4 indices ; entrée table = vtx_tab + idx*4 octets, 12 octets copiés — lectures
 *   CHEVAUCHANTES possibles si les indices se suivent (l'indice désigne un dword du flux
 *   plat, pas une entrée de 12 o alignée). Fidèle à l'ASM.
 * Dans chaque staging ent[3] : ent[0] copié brut dans le node ; ent[1] : octet0 = valeur "x"
 *   (stockée x - (x & 0xC0), calculée depuis entA SEULEMENT et réutilisée pour B/C/D),
 *   octet2 copié brut, word bas repris dans le word de flags (entA uniquement) ;
 *   ent[2] : octet0 entre dans le test de cull. */

/* Node OT, stride 0x28 (add edi,28h @0x69E5A1), buffer global ancré par dword_2510114. */
struct ot_node {
    u32 hdr;                        /* +0x00 = 0x09000000 (0x69E58B) */
    u32 fn;                         /* +0x04 = &sub_808080 stocké tel quel, pas d'appel ici (0x69E581) */
    u8  pad7;                       /* +0x07 = 0x2E (0x69E591) */
    u32 vA;                         /* +0x08  = entA[0] */
    u8  ab0, ab1;                   /* +0x0C/+0x0D : octets posés séparément (0x69E53A/0x69E540) */
    u32 vB;                         /* +0x10  = entB[0] */
    u8  bb0, bb1;                   /* +0x14/+0x15 */
    u16 flags;                      /* +0x16  = word de mode calculé (0x69E52B) */
    u32 vC;                         /* +0x18  = entC[0] */
    u8  cb0, cb1;                   /* +0x1C/+0x1D */
    u32 vD;                         /* +0x20  = entD[0] */
    u8  db0, db1;                   /* +0x24/+0x25 */
};

/* ============================ Externes (noms IDA réels) ============================ */

extern u32 *dword_2510114;                          /* tête du buffer de nodes OT (globals.txt) */
extern void OtNode24_PoolAllocLink_Code1(void *pool,
                                         void *node);
                                                    /* callees.txt : E3b, même pool OT cap 0x60000/+18
                                                     * que OtNode24_PoolAllocLink ; word[+14]=1 ;
                                                     * pas de copie RGB */
extern void sub_808080(void);   /* adresse stockée telle quelle dans node+0x04 (0x69E581), pas d'appel ici */

/* ============================ Fonction ============================ */
/* unsigned __int16 *__cdecl sub_69E420(struct ctx_69E420 *st);
 * Retour eax :
 *   - chemin count==0 : 0xFFFFFFFF (eax = count-1 de 0x69E431, jamais réécrit) ;
 *   - chemin normal   : nouveau curseur flux (eax = ecx @0x69E5BE, dernier enregistrement+0x18).
 * NB chemin vide : le curseur est QUAND MÊME avancé de 4 ([esi+10h] écrit @0x69E432 puis
 * réécrit à l'identique @0x69E5CF) — asymétrie ASM, pas une invention. */

unsigned __int16 *__cdecl sub_69E420(struct ctx_69E420 *st)
{
    u32 *cur;                       /* ecx : valeur de [st+0x10] */
    u32  count;                     /* edx à l'entrée : dword lu au curseur */
    u32  counter;                   /* slot var_4 (push ecx initial) : eax = count-1 puis inc -> count */
    u32 *pRec;                      /* pointeur enregistrement courant ; en ASM, recyclage du slot arg_0
                                     * (0x69E43D mov [esp+0Ch+arg_0],ecx ; rechargé @0x69E456) */
    u32 *node;                      /* edi : node OT courant (= dword_2510114 au départ) */

    /* --- 0x69E420-0x69E441 : pop compteur au curseur, avance curseur de 4 --- */
    cur   = st->cur;                /* 0x69E427 mov ecx,[esi+10h] */
    count = *cur;                   /* 0x69E42A mov eax,[ecx] */
    cur   = st->cur + 1;            /* 0x69E42C add ecx,4 */
    st->cur = cur;                  /* 0x69E432 mov [esi+10h],ecx — écrit AVANT le test */
    node  = dword_2510114;          /* 0x69E435 mov edi,dword_2510114 */
    if (count == 0) {               /* 0x69E43B test edx,edx ; 0x69E441 jz loc_69E5CF */
        st->cur = cur;              /* 0x69E5CF (réécriture à l'identique) */
        dword_2510114 = node;       /* 0x69E5D2 */
        return (unsigned __int16 *)0xFFFFFFFF;  /* eax = count-1 (0x69E431 dec eax) */
    }

    counter = count;                /* 0x69E448 inc eax (count-1+1) ; 0x69E450 mov var_4,eax */
    pRec    = cur;                  /* 0x69E43D : slot arg_0 recyclé = pointeur enregistrement */
    /* 0x69E447 push ebx ; 0x69E449 push ebp ; ebp = esi+0x18 ; ebx = esi+0x24 (0x69E44A/0x69E44D) */

    /* --- Boucle principale : exactement count itérations, un enregistrement de 0x18 par tour ---
     * corps : loc_69E45A ; rebouclage : loc_69E456 (recharge ecx depuis le slot arg_0). */
    for (;;) {
        u16 i0, i1, i2, i3;
        u32 *ent;

        /* --- 0x69E45A-0x69E4E1 : fetch des 4 vertex.
         * Bloc répété 4× (jamais tu) : pour k = 0..3, idx_k = word zero-extend lu à
         * pRec+0x04+2k (mov dx/cx après xor) ; ent = vtx_tab + idx_k*4 octets
         * (lea [eax+edx*4], stride 4 développé) ; copie 12 octets vers le staging
         * esi+0x18 (A), esi+0x24 (B), esi+0x30 (C), esi+0x3C (D).
         * Adresses : A = 0x69E45A-0x69E47B, B = 0x69E47C-0x69E49D,
         *            C = 0x69E49E-0x69E4C0, D = 0x69E4C1-0x69E4E1.
         * Lectures 12 octets chevauchantes possibles si idx consécutifs — fidèle à l'ASM. */
        i0 = *(u16 *)((u8 *)pRec + 0x04);
        i1 = *(u16 *)((u8 *)pRec + 0x06);
        i2 = *(u16 *)((u8 *)pRec + 0x08);
        i3 = *(u16 *)((u8 *)pRec + 0x0A);

        ent = (u32 *)((u8 *)st->vtx_tab + (u32)i0 * 4);
        st->entA[0] = ent[0]; st->entA[1] = ent[1]; st->entA[2] = ent[2];   /* 0x69E468-0x69E479 */

        ent = (u32 *)((u8 *)st->vtx_tab + (u32)i1 * 4);
        st->entB[0] = ent[0]; st->entB[1] = ent[1]; st->entB[2] = ent[2];   /* 0x69E48A-0x69E49B */

        ent = (u32 *)((u8 *)st->vtx_tab + (u32)i2 * 4);
        st->entC[0] = ent[0]; st->entC[1] = ent[1]; st->entC[2] = ent[2];   /* 0x69E4AF-0x69E4BE */

        ent = (u32 *)((u8 *)st->vtx_tab + (u32)i3 * 4);
        st->entD[0] = ent[0]; st->entD[1] = ent[1]; st->entD[2] = ent[2];   /* 0x69E4D2-0x69E4DF */

        /* --- 0x69E4E2-0x69E4F4 : test de cull — polarité ASM directe :
         * dl=[esi+44h](D.b8); al=[esi+2Ch](B.b8); cl=[esi+20h](A.b8);
         * and dl,al ; al=[esi+38h](C.b8) ; and dl,cl ; test al,dl ; jnz 0x69E5A4.
         * -> si (bC & (bD & bB & bA)) != 0 : quad SAUTÉ (pas de node ce tour,
         *    edi N'EST PAS avancé — le jnz saute 0x69E5A1). */
        {
            u8 bA = ((u8 *)st->entA)[0x08];     /* esi+0x20 */
            u8 bB = ((u8 *)st->entB)[0x08];     /* esi+0x2C */
            u8 bC = ((u8 *)st->entC)[0x08];     /* esi+0x38 */
            u8 bD = ((u8 *)st->entD)[0x08];     /* esi+0x44 */
            if ((bC & (bD & bB & bA)) != 0)
                goto l_69E5A4;                  /* 0x69E4F4 jnz loc_69E5A4 */
        }

        /* --- 0x69E4FA-0x69E56C : émission d'un node OT --- */

        /* Word de flags (dl) à node+0x16 (0x69E52B mov [edi+16h],dx) :
         *   bits 0-3  : ((f08 + word_bas(entA[1])) >> 6) & 0xF   (sar 6 @0x69E514, and 0Fh @0x69E51A)
         *   bit  8    : 1 constant ((0x40 | (f0C & 0x200)) << 2 ; or 40h @0x69E517, shl 2 @0x69E51D)
         *   bit  11   : (f0C & 0x200) << 2
         *   bits 4    : (f0C >> 4) & 0x10  (sar 4 @0x69E520 — sar ARITHMÉTIQUE, mask écrase le signe)
         * PIÈGE x86 : 0x69E4FA `mov cx,[esi+1Ch]` est un mov 16 bits — il ne remet PAS le
         * word haut de ecx à zéro (à ce moment ecx = entC[2] entier, chargé @0x69E4DC).
         * Le haut de ecx pollue donc le add 32 bits @0x69E504, mais SANS effet sur les bits
         * 6..9 extraits (les retenues se propagent vers le haut uniquement). La voix B
         * affirmait une extension zéro : faux (voir reconcile_notes.md, D1). */
        {
            u32 lo = *(u16 *)&st->entA[1];      /* word bas de entA[1] (esi+0x1C) */
            u32 w;
            w  = ((st->f08 + lo) >> 6) & 0xF;
            w |= ((st->f0C & 0x200) | 0x40) << 2;
            w |= (st->f0C >> 4) & 0x10;

            /* maskC0 = octet0 de entA[1] & 0xC0 — calculé UNE fois (0x69E52F mov dl /
             * 0x69E532 movsx eax,word / 0x69E536 and al,0C0h ; le movsx ne change pas
             * l'octet bas) et RÉUTILISÉ pour B, C, D. Chaque "x" est stocké (x - maskC0)
             * = x & 0x3F : les 2 bits hauts (0x80|0x40) sont retirés. */
            {
                u8 maskC0 = ((u8 *)st->entA)[0x04] & 0xC0;
                struct ot_node *n = (struct ot_node *)node;

                /* Ordre d'écriture EXACT de l'ASM (repris de c_b, le plus fidèle) :
                 * flags @0x16, puis paires d'octets 0x0C..0x25, puis dwords, puis en-tête. */
                n->flags = (u16)w;                                  /* 0x69E52B */

                ((u8 *)n)[0x0C] = ((u8 *)st->entA)[0x04] - maskC0;  /* 0x69E52F-0x69E53A */
                ((u8 *)n)[0x0D] = ((u8 *)st->entA)[0x06];           /* 0x69E53D-0x69E540 */
                ((u8 *)n)[0x14] = ((u8 *)st->entB)[0x04] - maskC0;  /* 0x69E543-0x69E548 */
                ((u8 *)n)[0x15] = ((u8 *)st->entB)[0x06];           /* 0x69E54B-0x69E54E */
                ((u8 *)n)[0x1C] = ((u8 *)st->entC)[0x04] - maskC0;  /* 0x69E551-0x69E556 */
                ((u8 *)n)[0x1D] = ((u8 *)st->entC)[0x06];           /* 0x69E559-0x69E55C */
                ((u8 *)n)[0x24] = ((u8 *)st->entD)[0x04] - maskC0;  /* 0x69E55F-0x69E564 */
                ((u8 *)n)[0x25] = ((u8 *)st->entD)[0x06];           /* 0x69E567-0x69E56A */

                n->vA = st->entA[0];            /* 0x69E56D-0x69E570 : mov ecx,[ebp+0] -> [edi+8] */
                n->vB = st->entB[0];            /* 0x69E573-0x69E575 : mov edx,[ebx]   -> [edi+10h] */
                n->vC = st->entC[0];            /* 0x69E578-0x69E57B : [esi+30h]       -> [edi+18h] */
                n->fn = (u32)&sub_808080;       /* 0x69E581 : offset sub_808080 stocké à +0x04 */
                n->vD = st->entD[0];            /* 0x69E57E+0x69E588 : [esi+3Ch]       -> [edi+20h] */
                n->hdr = 0x09000000;            /* 0x69E58B */
                n->pad7 = 0x2E;                 /* 0x69E591 : '.' */

                /* 0x69E52A push edi (arg2 = node, poussé en premier) ;
                 * 0x69E595 mov edx,[esi+14h] ; 0x69E598 push edx (arg1 = pool) ;
                 * 0x69E599 call ; 0x69E59E add esp,8. cdecl : arg1 poussé en dernier. */
                OtNode24_PoolAllocLink_Code1(st->ot_pool, n);
            }
        }

        node = (u32 *)((u8 *)node + 0x28);      /* 0x69E5A1 add edi,28h — chemin d'émission SEULEMENT */

l_69E5A4:
        /* --- 0x69E5A4-0x69E5B8 : avancement commun (émission ou skip) --- */
        pRec = (u32 *)((u8 *)pRec + 0x18);      /* 0x69E5AC add ecx,18h (stride 0x18 développé) */
        counter--;                              /* 0x69E5AF dec eax */
        if (counter != 0)                       /* 0x69E5B8 jnz loc_69E456 */
            continue;                           /* 0x69E456 : recharge ecx = pRec du slot arg_0 */
        break;
    }

    /* --- 0x69E5BE-0x69E5CE : épilogue boucle --- */
    st->cur = pRec;                 /* 0x69E5C1 mov [esi+10h],eax — eax = ecx = pRec (0x69E5BE) */
    dword_2510114 = node;           /* 0x69E5C4 */
    return (unsigned __int16 *)pRec;/* 0x69E5BE mov eax,ecx : retour = nouveau curseur flux */
}

/* ============================ UNCERTAIN ============================ */
// UNCERTAIN 0x69E465 sémantique des entrées de la table [st+4] : l'indice désigne un dword
//   d'un flux plat (lectures 12 octets chevauchantes si idx consécutifs) OU le layout réel
//   garantit des indices non chevauchants — l'ASM prouve l'indexation en dwords (stride 4),
//   pas l'intention. Question : la table est-elle un vertex buffer (12 o/vertex, idx = dword
//   d'un vertex) ou autre chose ?
// UNCERTAIN 0x69E536 signification des bits 0xC0 masqués (stockés x & 0x3F) : la voix B
//   suggère un flag canal alpha/transparence consommé ici — non prouvable par ce fragment
//   d'ASM (le consommateur serait le handler sub_808080).
// UNCERTAIN 0x69E52B sémantique des champs du word de flags node+0x16 (bits 0-3 = somme>>6,
//   bit 4, bit 8 toujours posé, bit 11) : layout prouvé, signification fonctionnelle inconnue ici.
// UNCERTAIN 0x69E581 rôle de sub_808080 : son adresse est stockée dans node+0x04 (handler ?),
//   aucun appel dans cette fonction ; rôle non prouvable localement.
// UNCERTAIN 0x69E599 contrat exact de OtNode24_PoolAllocLink_Code1 (lié en liste ? retour ?) :
//   seuls le nom IDA, le commentaire E3b (pool cap 0x60000/+18, word[+14]=1, pas de copie RGB)
//   et add esp,8 (2 args) sont prouvés ici.
```

## Reconciliation semantique (R)

# Sémantique sub_69E420 @ 0x69E420 (réconciliation R)

- Rôle (1 phrase) : Émetteur de quads gated dans la draw-list OT — itère une liste source
  (u32 count en tête puis records de 0x18 o pointés par `[ctx+0x10]`), démultiplie 4 indices
  u16 en 4 records-sommet de 0xC o copiés depuis la table `[ctx+4]` vers ctx+0x18/+0x24/+0x30/+0x3C,
  saute le quad si le ET des 4 octets flag (rec+8) est non nul, sinon construit un packet
  primitive de 0x28 o dans le buffer global `dword_2510114` (curseur edi), le lie à l'OT via
  `OtNode24_PoolAllocLink_Code1(*(ctx+0x14), packet)`, et avance les deux curseurs.
- Verdict : **LIKELY consolidé** (A et B convergeaient déjà sur le mécanisme ; tranchages
  instruction-level ci-dessous). Confiance : LIKELY — caller connu comme site seul, wiki
  indisponible (qmd failed), sous_808080 et contrat exact du callee non élucidés.
- Nom catalogue : absent de tout catalogue (IDB `sub_69E420`). Prototype IDA
  `unsigned __int16 *__cdecl(int)` douteux (B a raison) : le retour est un pointeur curseur
  u32 (0x69E5BE `mov eax,ecx`) ou la sentinelle `0xFFFFFFFF` (chemin count==0, 0x69E431
  `dec eax` jamais réécrit avant 0x69E5CF-0x69E5DB). Proposition markdown seul :
  **`Ot_EmitQuadList_Gated`** (le « Gt4 » de A sur-interprète le code 0x2E ; voir D12).

## In / Out / Effets de bord (cdecl, arg unique arg_0 = ctx, lu en esi @0x69E422)

- In :
  - `ctx+0x00` : (non lu).
  - `ctx+0x04` : base de table de records-sommet de 0xC o (`{dword0 XY?; u8@4, u8@6, u8 flag@8}`) ;
    adressage `lea eax,[eax+edx*4]` @0x69E465 — **stride 4 octets par indice**, 12 octets lus
    par indice (dwords à +0/+4/+8) → lectures chevauchantes possibles si indices consécutifs
    diffèrent de 1 (flux plat de dwords, intention UNCERTAIN).
  - `ctx+0x08`, `ctx+0x0C` : scalaires signés (sar @0x69E514/@0x69E520) entrant dans le word
    de flags du packet.
  - `ctx+0x10` : curseur source (u32*) : `[ecx]` = count d'éléments (u32), puis records de
    **0x18 octets** avec 4 indices u16 aux offsets +4/+6/+8/+A (zéro-extension par
    `xor edx,edx; mov dx` @0x69E45D/0x69E47F/0x69E4A1/0x69E4B9 — UNSIGNED, pas movsx).
    elem+0 (u32) et +0xC..+0x17 jamais lus ici.
  - `ctx+0x14` : arg1 du callee (pool/OT, poussé en dernier @0x69E598 → cdecl arg1).
- Out : retour EAX = curseur source final (pointeur u32) ; sentinelle `0xFFFFFFFF` si count==0.
- Effets de bord :
  - `[ctx+0x10]` avancé de 4 (count header) @0x69E432 **même si count==0** (réécrit identique
    @0x69E5CF), puis de 0x18 par élément consommé (@0x69E5AC, réécrit @0x69E5C1).
  - `dword_2510114` (curseur packet global) réécrit à la sortie (0x69E5C4 / 0x69E5D2) = edi.
  - ctx+0x18/+0x24/+0x30/+0x3C : 12 octets chacun écrasés par les records résolus.
  - Packet 0x28 o écrit à edi (curseur avancé de **0x28** @0x69E5A1, chemin émission SEULEMENT ;
    le jnz de cull @0x69E4F4 saute directement en 0x69E5A4 sans avancer edi).
  - Layout packet (ordre réel d'écriture) : +0x16 word flags @0x69E52B ; paires d'octets
    +0x0C/+0x0D, +0x14/+0x15, +0x1C/+0x1D, +0x24/+0x25 @0x69E52F-0x69E56A (X corrigé :
    `byte - ([esi+0x1C] & 0xC0)` avec le MÊME masque al pour les 4 sommets @0x69E536, soustractions
    @0x69E538/0x69E546/0x69E554/0x69E562 ; Y copié tel quel) ; dwords +8/+0x10/+0x18/+0x20 =
    dword0 des 4 records @0x69E56D-0x69E588 ; +0x04 = 0x00808080 @0x69E581 (constante data —
    le libellé IDA `offset sub_808080` est un piège, pas un pointeur de fonction vivant ici :
    son octet +7 est écrasé par 0x2E @0x69E591 → mot final 0x2E808080 = mode 0x2E + RGB
    0x80/0x80/0x80) ; +0x00 = 0x09000000 @0x69E58B (tag 9 mots = 36 o + 4 o tag = 0x28, cohérent) ;
    +0x07 = 0x2E @0x69E591.
  - Word flags +0x16 = `(([ctx+0xC] & 0x200 | 0x40) << 2)` (= 0x800 | 0x100) | `(([ctx+8] +
    u16 rec1[+4]) sar 6) & 0xF` | `(([ctx+0xC] sar 4) & 0x10)` — attention D1 : le add
    `add edx,ecx` @0x69E504 est 32 bits avec le word haut de ecx pollué par rec4[+8]
    (`mov ecx,[ecx+8]` @0x69E4DC, `mov cx` @0x69E4FA ne re-zéro pas) ; sans effet après
    `sar 6; and 0xF` (pollution ≥ bit 10), mais la description « extension zéro » de B est fausse.
  - Cull : `dl = [esi+0x44] & [esi+0x2C] & [esi+0x20]`, puis `test al,dl` avec `al=[esi+0x38]`
    (0x69E4E2-0x69E4F2), `jnz loc_69E5A4` → **packet émis seulement si ET des 4 flags == 0**
    (flag SET dans les 4 sommets = quad masqué).
  - Boucle : counter = count (0x69E431 `dec` + 0x69E448 `inc`), `dec/jnz` @0x69E5AF/0x69E5B8 →
    exactement `count` itérations.
  - Call : `push edi` @0x69E52A (arg2 = packet), `push [esi+0x14]` @0x69E598 (arg1 = pool),
    `call OtNode24_PoolAllocLink_Code1` @0x69E599, `add esp,8` @0x69E59E → 2 args cdecl.
  - Halves packet +0x0E/+0x1E/+0x26/+0x2E non écrites ici (résidu buffer).

## Divergences A/B tranchées (chacune contre l'ASM)

1. **D1 — word haut de ecx au add des flags** : A = pollué (rec4[+8] via 0x69E4DC), B = zéro-étendu.
   **Tranché A.** Preuve : 0x69E4DC `mov ecx,[ecx+8]` charge 32 bits ; 0x69E4FA `mov cx,[esi+1Ch]`
   ne touche que le word bas ; 0x69E504 `add edx,ecx` est 32 bits. Sans effet sur le résultat
   masqué (bits 6..9), mais la reconstruction B est fausse au niveau instruction.
2. **D2 — retour chemin count==0** : A = 0xFFFFFFFF, B = idem. **Tranché A (confirmé B).**
   Preuve : 0x69E431 `dec eax` (count-1 = -1 si count==0), eax jamais réécrit sur le chemin
   0x69E5CF-0x69E5DB avant `retn` @0x69E5DB.
3. **D3 — avance curseur si count==0** : avancé de 4 quand même. **Tranché (A=B).** Preuve :
   0x69E42C `add ecx,4` ; 0x69E432 `mov [esi+10h],ecx` AVANT le `jz` @0x69E441.
4. **D4 — nombre d'itérations** : exactement `count`. **Tranché (A=B).** Preuve : 0x69E431/0x69E448
   (counter=count), 0x69E5AF `dec eax` + 0x69E5B8 `jnz loc_69E456`.
5. **D5 — avance de edi** : +0x28 sur le chemin émission SEULEMENT (le cull saute l'avance).
   **Tranché (A=B).** Preuve : 0x69E5A1 `add edi,28h` placé AVANT 0x69E5A4 (cible du `jnz` @0x69E4F4).
6. **D6 — polarité du cull** : skip si ET des 4 flags != 0 ; émission si ET == 0.
   **Tranché (A=B).** Preuve : 0x69E4E2-0x69E4F4 (`and dl,al`, `and dl,cl`, `test al,dl`,
   `jnz loc_69E5A4` = continuation sans émission).
7. **D7 — ordre d'écriture du packet** : B explicite, A approximatif. **Tranché B.** Preuve :
   séquence 0x69E52B (flags) → 0x69E52F-0x69E56A (octets) → 0x69E56D-0x69E588 (dwords) →
   0x69E581 (+0x04) → 0x69E58B (tag +0x00) → 0x69E591 (+0x07 = 0x2E).
8. **D8 — ordre des push du call** : push edi @0x69E52A (arg2), push [esi+14h] @0x69E598 (arg1),
   `add esp,8` → cdecl 2 args. **Tranché (A=B).** Aucune écriture de edi/[esi+14h] entre
   0x69E52A et 0x69E599 → valeurs stables au call.
9. **D9 — sémantique du masque 0xC0** : mécanisme A (soustraction du MÊME maskC0 calculé depuis
   rec1 uniquement) confirmé par 0x69E532-0x69E536 (`movsx eax,word ptr [esi+1Ch]`, `and al,0C0h`)
   + 0x69E538/0x69E546/0x69E554/0x69E562 ; l'interprétation B (flag alpha/transparence) non
   prouvable → laissé UNCERTAIN.
10. **D10 — layout de la table [ctx+4]** : B (flux plat de dwords, stride 4 o, lectures 12 o
    chevauchantes) tranché au niveau mécanisme : 0x69E465 `lea eax,[eax+edx*4]`. Intention
    (vertex buffer vs flux plat) → UNCERTAIN.
11. **D11 — strides** : 0x18 (0x69E5AC), 0x28 (0x69E5A1), ×4 (0x69E465), +4 header (0x69E42C).
    **Tranché (A=B, valeurs hex développées).**
12. **D12 — nature du mot +0x04/+0x07** : A lit « constante 0x00808080 + code GPU 0x2E (quad
    gouraud texturé) », B lit « callback sub_808080 ». **Tranché : fait = les deux décrivent le
    même écrit** — `mov dword ptr [edi+4], offset sub_808080` @0x69E581 stocke la constante
    0x00808080 puis 0x69E591 `mov byte ptr [edi+7], 2Eh` écrase l'octet haut → mot final
    0x2E808080 ; en tant qu'adresse, 0x2E808080 serait invalide (hors image) → ce n'est PAS un
    callback actif. La qualification GPU précise de 0x2E (le code n'appartient pas aux codes
    polygones PSX standards 0x2C/0x3C) n'est pas prouvable ici → nom neutre « mode 0x2E »,
    interprétation A « gouraud texturé » dégradée en hypothèse.

## Preuves (ASM cité)

1. 0x69E58B `mov dword ptr [edi], 9000000h` + 0x69E591 `mov byte ptr [edi+7], 2Eh` : packet
   tagged 9 mots (0x28 o) avec mode 0x2E — construction de primitive de rendu.
2. 0x69E599 `call OtNode24_PoolAllocLink_Code1` + 0x69E59E `add esp,8` : lien à l'OT/pool
   (callee wiki CERTAIN, cap 0x60000).
3. 0x69E4E2-0x69E4F4 : ET des 4 octets flag ([esi+0x44/0x2C/0x20/0x38]), `test; jnz` → cull
   par flag commun.
4. 0x69E5AC `add ecx,18h` / 0x69E5A1 `add edi,28h` : strides source 0x18 o / packet 0x28 o.
5. 0x69E465 `lea eax,[eax+edx*4]` (×4 occurrences 0x69E465/0x69E485/0x69E4A7/0x69E4CC) :
   indices u16 ×4 octets dans la table [ctx+4], 12 o lus par indice.
6. 0x69E536/0x69E538/0x69E546/0x69E554/0x69E562 : correction X uniforme
   `byte − ([esi+0x1C] & 0xC0)` sur les 4 sommets.
7. 0x69E431 `dec eax` + chemin 0x69E5CF-0x69E5DB : retour sentinelle 0xFFFFFFFF si count==0,
   curseur quand même avancé de 4 (0x69E42C/0x69E432).

## Checks §5.6 auto-vérifiés

- Callee cité : `OtNode24_PoolAllocLink_Code1` @0x69E599 — présent dans callees.txt ✓.
- Caller cité : `sub_69E020` @0x69E27A (xref code, fn 0x69E020 size 0x271) — présent dans
  callers.txt ✓ (DATA : aucun xref data).
- Strides développés : 0x18 / 0x28 / ×4 / +4 header — tous en nombres ✓.
- Polarités : indices u16 zéro-étendus (`xor`+`mov dx`, unsigned) vs `sar` signé délibéré sur
  ctx+8/ctx+0xC ; `jnz` @0x69E4F4 = skip émission, `jnz` @0x69E5B8 = boucle — cohérent ✓.
- Largeur du retour : EAX (pointeur curseur u32, ou 0xFFFFFFFF sentinelle) — compatible avec
  l'usage « curseur suivant ou -1 » ; le prototype IDA `unsigned __int16*` est trop étroit
  (cosmétique, pas de rename) ✓.
- Nom ≥2 preuves indépendantes : (a) 0x69E58B/0x69E591 packet 0x09000000/0x2E ; (b) 0x69E599
  lien OT via pool wiki CERTAIN ; (c) 0x69E4E2-0x69E4F4 gating ET-des-4 ✓.

## Questions ouvertes (non bloquantes)

- Sémantique de la table [ctx+4] : flux plat de dwords vs vertex buffer (mécanisme prouvé,
  intention non) — contrat du caller sub_69E020 à établir.
- Signification des bits 0xC0 soustraits des X (flag alpha/transparence ? bank VRAM ?).
- Rôle fonctionnel du mot 0x2E808080 à +0x04 (mode GPU 0x2E exact) et du tag 0x09000000.
- Sémantique de ctx+8 / ctx+0xC (texpage ? semi-transparence ?) et de ctx+0x14 (pool/OT).
- Qui pré-initialise les halves non écrites du packet (+0x0E/+0x1E/+0x26) et pourquoi elem+0 /
  +0xC..+0x17 des records source ne sont pas lus (structure partagée ?).
- Outillage : wiki.md et grepai.txt vides/échecs (qmd WinError 2) — recoupement wiki refait
  via les annotations callee ; pas d'INCIDENT-IDA (aucun appel IDA requis, ASM auto-suffisant).

## IDBCOMMENT

Emet des quads gates dans la draw-list OT : lit un count puis des records de 24 octets via
le curseur [esi+10h], resout 4 indices u16 dans la table [esi+4] (12 octets par indice),
saute le quad si le ET des 4 flags d'octet +8 est non nul, sinon ecrit un packet de 40 octets
(tag 09000000, mot 2E808080, 4 sommets) dans dword_2510114 et le lie via
OtNode24_PoolAllocLink_Code1([esi+14h], packet). Retourne le curseur source avance (FFFFFFFF
si count nul). [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_69E420 (EA 0x69E420), voix C-R

Ground truth : asm.asm (live, 0x69E420-0x69E5DB, 444 octets, **156 instructions**).
hexrays.c : vérificateur SEULEMENT. Voix A = c_a.c, voix B = c_b.c.

## Divergences A/B tranchées

### D1 — Extension du word bas de entA[1] avant le add du flags (bits hauts de ecx)
- **Position A** : ecx contient des déchets dans le word haut au moment du add (0x69E4FA `mov cx` ne re-zéro pas) — sans effet sur les bits 6..9 extraits.
- **Position B** : « mov cx → bits hauts à zéro (extension zéro), donc addition 32 bits sûre ».
- **Tranché : A.** Preuve ASM : 0x69E4DC-0x69E4BE charge ecx = entC[2] ENTIER (`mov ecx,[ecx+8]` @0x69E4BE) ; @0x69E4FA `mov cx,[esi+1Ch]` est un mov 16 bits qui ne touche que le word bas — le word haut reste = word haut de entC[2]. Le add 32 bits @0x69E504 `add edx,ecx` est donc pollué par ce haut de word. Hex-Rays le reflète implicitement (`LOWORD(v14)` lu puis additionné à 32 bits, cf. hexrays.c:57-62). Sans effet sur le résultat masqué (bits 6..9 : les retenues montent, ne redescendent pas), mais la reconstruction B est fausse au niveau instruction.

### D2 — Retour du chemin count==0
- **Position A** : retour 0xFFFFFFFF (eax = count-1 de 0x69E431 jamais réécrit).
- **Position B** : identique (return (u16*)-1).
- **Tranché : A (confirmation B).** Preuve ASM : 0x69E431 `dec eax` (eax = count-1 = -1 si count==0) ; le chemin 0x69E5CF-0x69E5DB ne réécrit jamais eax. Retour = 0xFFFFFFFF.

### D3 — Avance du curseur sur le chemin count==0
- **Position A** : curseur avancé de 4 quand même (écrit @0x69E432, réécrit à l'identique @0x69E5CF).
- **Position B** : identique.
- **Tranché : A (confirmation B).** Preuve ASM : 0x69E42C `add ecx,4` ; 0x69E432 `mov [esi+10h],ecx` exécuté AVANT le jz ; 0x69E5CF `mov [esi+10h],ecx` réécrit la même valeur. Asymétrie ASM réelle.

### D4 — Nombre d'itérations de la boucle
- **Position A** : exactement `count` itérations (counter = count, décrémenté à chaque tour).
- **Position B** : identique (cnt itérations).
- **Tranché : A (confirmation B).** Preuve ASM : 0x69E431 `dec eax` puis 0x69E448 `inc eax` → var_4 = count ; 0x69E5AF `dec eax` + 0x69E5B8 `jnz loc_69E456`. Hex-Rays déroule la même chose (v19 = result+1 = count).

### D5 — Point d'avance de edi (curseur OT)
- **Position A** : `add edi,28h` @0x69E5A1 sur le chemin d'émission SEULEMENT ; sur le chemin skip (jnz @0x69E4F4) edi n'est pas avancé.
- **Position B** : identique (ot += 0x28 seulement après l'émission, `goto next_quad` saute l'avance).
- **Tranché : A (confirmation B).** Preuve ASM : 0x69E5A4 (cible du jnz) exécute directement l'avancement pRec/counter ; 0x69E5A1 `add edi,28h` est AVANT 0x69E5A4 dans le flux d'émission. Hex-Rays d'accord (v7 += 10 dans le if).

### D6 — Polarité du cull
- **Position A** : skip si (bC & (bD & bB & bA)) != 0 ; jnz = saute l'émission.
- **Position B** : identique (quad sauté si ET != 0).
- **Tranché : A (confirmation B).** Preuve ASM : 0x69E4E2-0x69E4F4 : dl=[esi+44h], al=[esi+2Ch], cl=[esi+20h], `and dl,al`, al=[esi+38h], `and dl,cl`, `test al,dl`, `jnz loc_69E5A4` (loc_69E5A4 = continuation SANS émission). Le quad est ÉMIS quand le ET vaut 0.

### D7 — Ordre d'écriture des champs du node
- **Position A** : ordre approximatif (hdr, fn, pad7 d'abord dans le texte, mais avec push décrits séparément).
- **Position B** : ordre exact de l'ASM explicité : +0x16 flags, paires d'octets 0x0C..0x25, puis dwords +8/+0x10/+0x18, +0x04 handler, +0x20, +0x00 tag, +0x07.
- **Tranché : B.** Preuve ASM : 0x69E52B (flags) → 0x69E52F-0x69E56A (paires d'octets) → 0x69E56D-0x69E57B (dwords vA/vB/vC) → 0x69E581 (handler +0x04) → 0x69E588 (vD +0x20) → 0x69E58B (tag +0x00) → 0x69E591 (0x2E à +0x07). L'ordre réel suit B ; le C réconcilié reprend l'ordre B.

### D8 — push des args du call (ordre et valeurs)
- **Position A** : push edi (0x69E52A) = arg2 (node), push [esi+14h] (0x69E598) = arg1 (pool) — « valeurs identiques à l'instant du call ».
- **Position B** : identique (edi d'abord, [a1+0x14] ensuite, add esp,8 → 2 args).
- **Tranché : A (confirmation B).** Preuve ASM : 0x69E52A `push edi` ; 0x69E595 `mov edx,[esi+14h]` ; 0x69E598 `push edx` ; 0x69E599 call ; 0x69E59E `add esp,8`. cdecl : dernier push = arg1 = pool. Aucune écriture de edi ou [esi+14h] entre 0x69E52A et 0x69E599 → valeurs stables.

### D9 — Sémantique du mask 0xC0 (stockage x - maskC0)
- **Position A** : « si le bit7 est porté par 0x80|0x40, le signe est retiré (l'octet devient x & 0x3F) ».
- **Position B** : « les 2 bits hauts du byte = flag canal alpha/transparence consommé ici (polarité ASM directe) ».
- **Tranché : mécanisme A (soustraction maskC0 calculée depuis entA uniquement), interprétation B en **UNCERTAIN**.** Preuve ASM : 0x69E532 `movsx eax,word ptr [esi+1Ch]` + 0x69E536 `and al,0C0h` → maskC0 = (octet0 de entA[1]) & 0xC0 ; 0x69E538/0x69E546/0x69E554/0x69E562 `sub dl,al` pour A/B/C/D avec le MÊME al. Le résultat = x & 0x3F est un fait arithmétique (soustraction de l'octet par ses 2 bits hauts). La QUALIFICATION du flag (alpha/transparence) n'est pas prouvable par ce fragment → resté en `// UNCERTAIN 0x69E536` dans c_reconciled.c.

### D10 — Layout de la table [st+4] (indice = dword du flux plat vs entrée de 12 o)
- **Position A** : décrit la table comme « entrée i = base + i*4 octets » avec mention du chevauchement possible ; ne tranche pas l'intention.
- **Position B** : explicite : « lectures 12 octets CHEVAUCHANTES : l'indice désigne un dword dans un flux plat, pas une entrée de 12 o ».
- **Tranché : B (mécanisme), intention en **UNCERTAIN**.** Preuve ASM : 0x69E465 `lea eax,[eax+edx*4]` — stride 4 OCTETS entre indices, 12 octets lus par indice ([ent],[ent+4],[ent+8]). Si deux indices consécutifs diffèrent de 1, les lectures se chevauchent : mécanisme prouvé ; l'intention (vertex buffer vs flux plat) ne l'est pas → `// UNCERTAIN 0x69E465` dans c_reconciled.c.

### D11 — Strides en clair
- **Position A** : strides développés (0x18, 0x28, *4).
- **Position B** : idem, avec `q += 6` (dwords) pour 0x18 octets.
- **Tranché : A.** Preuve ASM : 0x69E5AC `add ecx,18h` ; 0x69E5A1 `add edi,28h` ; 0x69E465 `lea [eax+edx*4]`. Le C réconcilié garde les valeurs hex développées (0x18, 0x28, *4) partout.

## UNCERTAIN restants

- `// UNCERTAIN 0x69E465` — sémantique de la table [st+4] (flux plat de dwords vs vertex buffer) : mécanisme prouvé, intention non.
- `// UNCERTAIN 0x69E536` — signification des bits 0xC0 masqués (flag alpha/transparence ?) : hypothèse de la voix B non prouvable ici.
- `// UNCERTAIN 0x69E52B` — sémantique fonctionnelle des champs du word de flags node+0x16 (layout prouvé, rôle inconnu).
- `// UNCERTAIN 0x69E581` — rôle de sub_808080 (adresse stockée à node+0x04, jamais appelée ici).
- `// UNCERTAIN 0x69E599` — contrat exact de OtNode24_PoolAllocLink_Code1 (liage en liste ? retour ?) : seul le commentaire E3b + add esp,8 sont prouvés.

## Divergences vs Hex-Rays

Hex-Rays (hexrays.c) est globalement d'accord avec l'ASM. Points vérifiés :

1. **Compteur/retour** (hexrays.c:27, 35, 83-88) : result = v3-1, v19 = result+1 = count, boucle déroulée — conforme à D4. Retour = v17 (nouveau curseur) ou result (-1 si count==0) : conforme à D2.
2. **Ordre des écritures du node** (hexrays.c:60-79) : flags → paires d'octets → dwords → handler → vD → tag → 0x2E. Conforme à D7/B.
3. **mov cx 16 bits** (hexrays.c:57-62) : `LOWORD(v14) = *(_WORD *)(a1 + 28)` puis addition 32 bits `(v14 + *(_DWORD *)(a1 + 8)) >> 6` — Hex-Rays garde la pollution du word haut implicite (v14 non remis à zéro en haut), conforme à D1. Note : dans Hex-Rays la valeur v14 avant `LOWORD(v14)=...` est entC[2] (v14 = v13[2], hexrays.c:53) — même constat que la voix A.
4. **Cull** (hexrays.c:55) : `if ((bC & (bD & bB & bA)) == 0) { émission }` — inversion logique équivalente au jnz de l'ASM, conforme à D6.
5. **Pas de divergence bloquante détectée.** Hex-Rays n'invente aucun call, n'inverse aucune polarité, ne tronque aucun stride. Le seul point de vigilance reste le mot « extension zéro » de la voix B (D1), qui n'apparaît PAS dans Hex-Rays.
