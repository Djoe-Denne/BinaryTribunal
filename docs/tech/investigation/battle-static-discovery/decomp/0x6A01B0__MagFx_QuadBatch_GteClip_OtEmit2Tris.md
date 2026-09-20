# MagFx_QuadBatch_GteClip_OtEmit2Tris @ 0x6A01B0

- Instr (live): 419 (1292 o, 0x6A01B0-0x6A06BB)
- Palier: 2+1
- Verdict: LIKELY - passe 2 generique mag FX (3 wrappers clones 0x46 o) : boucle sur les records stride 0x24 du curseur ctx+0x24, GTE SetPackedSlots/SetTriplet + slots camera 15/16/17 si pkt[2]!=0 sinon copie directe, clip 8 bits signe (X 0xA00 bits 1-8, Y 0x6C0 bits 0x10-0x80), rejet si nibble X (0x0F) OU Y (0xF0) entier, blend couleurs (add word pkt+0x0C, sub byte pkt+0x1C), emet quad 0x0C000000 @out + 2 triangles 0x02000000 lies par 3x OtNode24_PoolAllocLink au bucket a2+4*((int)depth sar a3), skip si pkt[13]&0x60000 (flag GTE relu post setSomeDword3) ; sortie 0x4C/quad emis, retour EAX = esi curseur
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A01B0\nTYPE ; proposition: MagFx_QuadBatch_GteClip_OtEmit2Tris
- Notes parent: checks 5.6 OK : tag 0C000000h (0x6A0247), setSomeDword3 + test 60000h (0x6A026E-79), and 0Fh/0F0h + jz skip (0x6A039D-B2), sar edx,cl (0x6A04B9), lea ebp,[eax+edx*4] (0x6A04C7), unk_2000000 x2 (0x6A0564/0x6A0616), strides esi +0x34/+0xC/+0xC (0x6A0503-5E3), curseur +24h (0x6A0686-A3), eax=esi (0x6A06A7/B3), callers 3 wrappers clones (callers.txt)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A01B0 (EA 0x6A01B0) — réconciliation c_a ⊕ c_b
 * Pipeline triple 2+1, campagne mag FX battle, rôle C-R.
 * ============================================================================
 * GROUND TRUTH = live ASM (asm.asm, 419 instr, 1292 o @ 0x6A01B0) + pas d'idb.
 * hexrays.c = vérificateur SEULEMENT (divergences en fin de fichier et dans
 * reconcile_notes.md). Aucune moyenne c_a/c_b : chaque point tranché contre
 * l'ASM, adresses citées.
 *
 * Type IDA    : unsigned int *__cdecl(int, int, char, unsigned int *)
 * Taille      : 0x50C (1292 o)
 * Sauvegardes : sub esp,28h puis push ebp, esi, edi (6a01b0..6a01b5) ;
 *               ebx poussé après l'early-exit (6a01df).
 * Cleanup cdecl (callee ne dépile pas ses args) — vérifié dans asm.asm :
 *   add esp,10h @6a0276 (GteState_Set3Pairs 3 ptrs = 12 + setSomeDword3 1 arg = 4),
 *   add esp,10h @6a02b3 (SetsomeDword 12 + setSomeDword5 4),
 *   add esp,4   @6a0362 (setSomeDword),
 *   add esp,4   @6a03c4 (GteState_GetToPtr_1CA8A2C),
 *   add esp,30h @6a0426 (SetPackedSlots 12 + SetTriplet 12 + Set_1CA8A30 4 +
 *                        GetTriplet 12 + StorePtr 4 + GetToPtr 4 → 0x30 = 48),
 *   add esp,10h @6a05fb (2 × OtNode24_PoolAllocLink = 16),
 *   add esp,8   @6a068a (3e OtNode24_PoolAllocLink),
 *   add esp,28h @6a06ac / @6a06b8 (épilogue, frame).
 *
 * STRIDES PROUVÉS (ASM) :
 *   - record d'entrée (curseur pkt[9] = [edi+24h]) : 0x24 octets (9 dwords).
 *     Curseur porté par var_8 (pile) : init 6a01ce, restauration ebp @6a0686,
 *     avance add ebp,24h @6a0691, re-store var_8 @6a0695, store final
 *     pkt[9] @6a06a3 (et @6a06b0 sur l'early-exit, redondant).
 *     NB : le `add ebp,18h` @6a03e9 (chemin GTE) est un ARTÉFACT de calcul
 *     d'argument (ebp recréé pour push) — ebp est écrasé @6a0451 (blend) puis
 *     restauré depuis var_8 @6a0686. Il ne participe PAS au stride record.
 *   - quad sortant (esi) : 0x4C octets = +0x34 @6a0503, +0x0C @6a0557,
 *     +0x0C @6a05e3. Les 8 pointeurs locaux avancent aussi de 0x4C net
 *     (l'ASM entrelace +0x34/+0x40/+0xC entre 6a04ca et 6a0624 ; somme = 0x4C,
 *     aucune réutilisation entre l'avance et la prochaine itération → hoist OK).
 *     Sortie stride 0x4C/record ÉMIS ; les records skipés (flags 0x60000 ou
 *     nibble clip plein) n'avancent NI esi NI les 8 pointeurs (saut direct
 *     6a068D depuis 6a027e / 6a03a3 / 6a03b2).
 * ========================================================================== */

#include <stdint.h>

/* ---- Externes — callees uniquement, signatures déduites des pushes ASM ---- */

/* 6a023d : 3 ptrs, écrit 6 dwords 1CA8A10..1CA8A24. Args (rec+4, rec+6, rec+8)
 * poussés dans cet ordre inverse (u16 à rec+8 pushé en premier @6a022e). */
extern void GteState_Set3Pairs_1CA8A10(const void *p0, const void *p1, const void *p2);
extern void camRelated_0(void);                                /* 6a0242, 0 arg  */
extern void setSomeDword3(void *dst);                          /* 6a026e, 1 arg  */
extern void SetsomeDword(void *a, void *b, void *c);           /* 6a029b, 3 args */
extern void setSomeDword5(const void *src);                    /* 6a02ae, 1 arg  */
extern void cameraRelated_usedByFields(void);                  /* 6a02b6, 0 arg  */
extern void setSomeDword(void *dst);                           /* 6a035d, 1 arg  */
/* 6a0365 : sum low16 1CA8A50/54/58/5C * word_1CA92F4 >>12 -> 1CA8A2C et
 * 1CA8A70 ; clear 1CA92F8. Scale != AVSZ3. */
extern void Gte_AVSZ4(void);
extern void GteState_GetToPtr_1CA8A2C(void *dst);              /* *dst = dword_1CA8A2C */
extern void Camera_SetPackedSlots_15_16_17(uint8_t b4, uint8_t b5, uint8_t b6);
/* 6a03ee : store triplet 1CA8A60 + side-store [arg2] -> 1CA8A28. */
extern void GteState_SetTriplet_1CA8A60(const void *t0, const void *t1, const void *t2);
extern void GteState_Set_1CA8A30(uint32_t v);                  /* dword_1CA8A30 = v */
extern void sub_45F4C0(void);                                  /* 6a03fc, 0 arg */
extern void GteState_GetTriplet_1CA8A60(void *t0, void *t1, void *t2);
extern void GteState_StorePtr_1CA8A28(const void *p);          /* SETTER dword_1CA8A28 = p */
extern void sub_45F270(void);                                  /* 6a041b, 0 arg */
extern void GteState_GetToPtr_1CA8A68(void *dst);              /* *dst = dword_1CA8A68 */
/* 6a05bc/6a05c7/6a0681 : alloc OT node 0x18 ; base 0x1C48828 ; cursor
 * 0x1CA8828 ; cap 0x60000 ; insert OT. __cdecl (cleanup par add esp callsite). */
extern void OtNode24_PoolAllocLink(void **p_ot, void *prim);

/* Globaux touchés (uniquement via les GteState_* / Gte_AVSZ4 ci-dessus) :
 * dword_1CA8A28 (StorePtr), dword_1CA8A2C (GetToPtr = sortie AVSZ4),
 * dword_1CA8A30 (Set), dword_1CA8A68 (GetToPtr), word_1CA92F4 (dans AVSZ4). */

/*
 * uint32_t *__cdecl sub_6A01B0(uint32_t *pkt, int a2, char a3, uint32_t *a4)
 *   pkt (edi) : contexte passe 2 (layout +0x04..+0x34, voir notes)
 *   a2  (arg_4)  : base du tableau OT (têtes)
 *   a3  (arg_8)  : shift count profondeur (char ; sar, HW masque &0x1F)
 *   a4  (arg_C)  : base curseur de sortie
 * RETOUR : eax = esi final = curseur sortie avancé de 0x4C par quad ÉMIS
 * (pas a4) — 6a06a7 mov eax,esi / 6a06b3 mov eax,esi. Early-exit => a4.
 */
uint32_t *__cdecl sub_6A01B0(uint32_t *pkt, int a2, char a3, uint32_t *a4)
{
    uint8_t  *pb   = (uint8_t *)pkt;   /* edi */
    uint32_t *out  = a4;               /* esi — curseur sortie (retour) */
    uint32_t *rec;                     /* ebp — record courant (stride 0x24) */
    uint32_t  vtab;                    /* pkt[8] = [edi+20h] : base sommets */
    int32_t   cnt;                     /* var_4 */
    uint32_t *recCur;                  /* var_8 : portage du curseur record */
    uint32_t *q1, *q2, *q4, *q5, *q7, *q8, *q10, *q11; /* 8 ptrs dans a4 */

    /* ---- 6a01be..6a01d6 : lecture curseur + early-exit (jle SIGNED) ---- */
    rec    = (uint32_t *)pkt[9];       /* 6a01be mov eax,[edi+24h] */
    cnt    = (int32_t)*rec;            /* 6a01c1 mov ecx,[eax] */
    rec    = rec + 1;                  /* 6a01c3 lea ebp,[eax+4] */
    vtab   = pkt[8];                   /* 6a01c6 mov eax,[edi+20h] */
    pkt[9] = (uint32_t)rec;            /* 6a01c9 mov [edi+24h],ebp */
    recCur = rec;                      /* 6a01ce mov [esp+34h+var_8],ebp */
    if (cnt <= 0)                      /* 6a01d6 jle loc_6A06B0 */
    {
        pkt[9] = (uint32_t)rec;        /* 6a06b0 — re-store redondant (ebp intact) */
        return out;                    /* 6a06b3 mov eax,esi (= a4) */
    }

    /* ---- 6a01dc..6a0215 : 8 pointeurs sur a4 (avanceront de 0x4C/quad) ---- */
    q10 = a4 + 10;                     /* var_18 = esi+28h */
    q7  = a4 + 7;                      /* var_1C = esi+1Ch */
    q4  = a4 + 4;                      /* var_20 = esi+10h */
    q11 = a4 + 11;                     /* var_24 = esi+2Ch */
    q8  = a4 + 8;                      /* var_28 = esi+20h */
    q5  = a4 + 5;                      /* var_10 = esi+14h */
    q1  = a4 + 1;                      /* var_C  = esi+04h (ebx) */
    q2  = a4 + 2;                      /* var_14 = esi+08h */

    for (;;)                           /* loc_6A021F (retour boucle 6a021b) */
    {
        uint32_t  clip;                /* home slot arg0 'pkt', réutilisé */
        uint32_t *p_ot;                /* ebp — tête OT */
        uint32_t *quadBase;            /* home slot 'pkt' @6a04c3 (save esi) */
        uint32_t  s0C, s18, s24, s30;  /* sommes blend (ecx/edx/ebp/ebx) */
        uint32_t  w;                   /* ax = [edi+0Ch] zext */
        uint8_t   subB;                /* [edi+1Ch] */
        uint32_t *sp1, *sp2;           /* eax — headers sub-packets */
        uint32_t  color;

        clip = 0;                      /* 6a0293 mov [esp+..+pkt],0 (slot) */

        /* ---- B3 6a021f..6a0242 : GTE sommets (u16 zext via mov cx) ---- */
        GteState_Set3Pairs_1CA8A10(    /* 6a023d ; pushes 6a022e/6a0238/6a023c */
            (const void *)(vtab + 4u * (uint32_t)*(uint16_t *)((uint8_t *)rec + 4)),
            (const void *)(vtab + 4u * (uint32_t)*(uint16_t *)((uint8_t *)rec + 6)),
            (const void *)(vtab + 4u * (uint32_t)*(uint16_t *)((uint8_t *)rec + 8)));
        camRelated_0();                /* 6a0242 */

        /* ---- 6a0247..6a0267 : copie record -> quad courant (esi) ---- */
        out[0]  = 0x0C000000u;         /* 6a0247 mov dword ptr [esi],0C000000h */
        q1[0]   = rec[0];              /* 6a024d/6a0250 [ebp+0] -> [ebx]=[esi+4] */
        out[3]  = rec[3];              /* 6a0252/6a0255 [ebp+0Ch] -> [esi+0Ch] */
        out[6]  = rec[4];              /* 6a0258/6a025b [ebp+10h] -> [esi+18h] */
        out[9]  = rec[5];              /* 6a025e/6a0261 [ebp+14h] -> [esi+24h] */
        out[12] = rec[5] >> 16;        /* 6a0264 shr eax,10h LOGIQUE -> [esi+30h] */

        /* ---- B4 6a026a..6a0282 : flags pkt[13] ; skip si 0x60000 ---- */
        setSomeDword3(&pkt[13]);       /* 6a026e lea eax,[edi+34h] ; 6a0276 add esp,10h */
        if ((pkt[13] & 0x60000u) != 0) /* 6a0273 re-lit [edi+34h] APRES l'appel ;
                                        * 6a0279 test ; 6a027e jnz loc_6A068D */
            goto next_record;          /* skip : aucun curseur sortie avancé */

        /* ---- B5 6a0284..6a02b6 : fill a4 + input AVSZ ---- */
        SetsomeDword(q2, q5, q8);      /* 6a029b ; pushes 6a0290/91/92 :
                                        * args (var_14, var_10, var_28)
                                        * = (a4+0x08, a4+0x14, a4+0x20) */
        setSomeDword5(                 /* 6a02ae ; u16 à rec+0x0A (6a02a6) */
            (const void *)(vtab + 4u * (uint32_t)*(uint16_t *)((uint8_t *)rec + 0x0A)));
        cameraRelated_usedByFields();  /* 6a02b6 */

        /* ---- B6 6a02bb..6a0354 : bits de clip.
         * Polarié ASM : test ax,ax ; jl -> set ; cmp ax,SEUIL ; jle -> pass.
         * Donc bit posé ssi (int16)v < 0 || (int16)v > SEUIL — équivalent
         * (uint16)v > SEUIL (les deux formes C sont valides). ---- */
        { int32_t v = (int16_t)*(uint16_t *)q2;                    /* 6a02bb mot [a4+0x08] */
          if (v < 0 || v > 0x0A00) clip |= 1u;  }                  /* 6a02c7 cmp 0A00h */
        { int32_t v = (int16_t)*(uint16_t *)q5;                    /* 6a02d5 mot [a4+0x14] */
          if (v < 0 || v > 0x0A00) clip |= 2u;  }                  /* 6a02e1 */
        { int32_t v = (int16_t)*(uint16_t *)q8;                    /* 6a02f1 mot [a4+0x20] */
          if (v < 0 || v > 0x0A00) clip |= 4u;  }                  /* 6a02fd */
        { int32_t v = (int16_t)*(uint16_t *)((uint8_t *)out + 0x0A); /* 6a030d mot [esi+0Ah] */
          if (v < 0 || v > 0x06C0) clip |= 0x10u; }                /* 6a0316 cmp 6C0h */
        { int32_t v = (int16_t)*(uint16_t *)((uint8_t *)out + 0x16); /* 6a0326 mot [esi+16h] */
          if (v < 0 || v > 0x06C0) clip |= 0x20u; }                /* 6a032f */
        { int32_t v = (int16_t)*(uint16_t *)((uint8_t *)out + 0x22); /* 6a033f mot [esi+22h] */
          if (v < 0 || v > 0x06C0) clip |= 0x40u; }                /* 6a0348 */

        /* ---- 6a0358..6a036a : input AVSZ4 puis 2 derniers bits ---- */
        setSomeDword(q11);             /* 6a035d — cible liée à Gte_AVSZ4 = a4+0x2C */
        Gte_AVSZ4();                   /* 6a0365 -> dword_1CA8A2C (et 1CA8A70) */
        { int32_t v = (int16_t)*(uint16_t *)q11;                   /* 6a036e mot [a4+0x2C] */
          clip = (v < 0 || v > 0x0A00) ? (clip | 8u) : clip; }     /* 6a037c or ecx,8 */
        { int32_t v = (int16_t)*(uint16_t *)((uint8_t *)out + 0x2E); /* 6a0389 mot [esi+2Eh] */
          if (v < 0 || v > 0x06C0) clip |= 0x80u; }                /* 6a0398 or cl,80h */

        /* ---- 6a039b..6a03b2 : rejet si un nibble ENTIER est posé ---- */
        if ((clip & 0x0Fu) == 0x0Fu)   /* 6a039d and edx,0Fh ; 6a03a3 jz 6A068D */
            goto next_record;
        if ((clip & 0xF0u) == 0xF0u)   /* 6a03a9 and ecx,0F0h ; 6a03b2 jz 6A068D */
            goto next_record;

        /* ---- B8 6a03b8..6a0444 : profondeur + transform GTE ou copie ---- */
        GteState_GetToPtr_1CA8A2C(&pkt[12]);  /* 6a03bc : pkt[12] = dword_1CA8A2C
                                               * (résultat AVSZ4) ; add esp,4 @6a03c4 */

        if (pkt[2] != 0)               /* 6a03c7 test eax,eax ; 6a03c9 jz 6A042B */
        {
            /* --- chemin GTE 6a03cb..6a0429 --- */
            Camera_SetPackedSlots_15_16_17(pb[4], pb[5], pb[6]);
            /* 6a03cf..6a03dd : mov al,[edi+6]/cl,[edi+5]/dl,[edi+4] ; pushes
             * edx,ecx,eax -> args (pkt+4, pkt+5, pkt+6). Slots 15/16/17. */
            GteState_SetTriplet_1CA8A60(          /* 6a03ee ; pushes 6a03e8/6a03ec/6a03ed */
                (const void *)((uint8_t *)rec + 0x18),   /* ebp après add ebp,18h @6a03e9 */
                (const void *)((uint8_t *)rec + 0x1C),   /* lea ecx,[ebp+1Ch] @6a03e5 */
                (const void *)((uint8_t *)rec + 0x20));  /* lea eax,[ebp+20h] @6a03e2 */
            /* NB 6a03e9 add ebp,18h : ARTÉFACT (ebp recréé pour le 1er push) ;
             * ebp est écrasé au blend (6a0451) puis restauré de var_8 (6a0686).
             * Le stride record reste 0x24. */
            GteState_Set_1CA8A30(pkt[2]);          /* 6a03f7 dword_1CA8A30 = [edi+8] */
            sub_45F4C0();                          /* 6a03fc */
            GteState_GetTriplet_1CA8A60(q4, q7, q10);
            /* 6a0410 ; pushes 6a040d/6a040e/6a040f -> args (var_20, var_1C, var_18)
             * = (a4+0x10, a4+0x1C, a4+0x28) */
            GteState_StorePtr_1CA8A28(q1);         /* 6a0416 SETTER dword_1CA8A28 = a4+4 */
            sub_45F270();                          /* 6a041b */
            GteState_GetToPtr_1CA8A68(q1);         /* 6a0421 *(&a4[1]) = dword_1CA8A68 */
            /* (cleanup add esp,30h @6a0426 couvre les 6 calls du chemin GTE) */
        }
        else
        {
            /* --- copie directe 6a042b..6a0444 : rec+0x18/0x1C/0x20 -> a4+0x10/0x1C/0x28 --- */
            q4[0]  = rec[6];           /* 6a042f/6a0432 [ebp+18h] -> [var_20] */
            q7[0]  = rec[7];           /* 6a0438/6a043b [ebp+1Ch] -> [var_1C] */
            q10[0] = rec[8];           /* 6a0441/6a0444 [ebp+20h] -> [var_18] */
        }

        /* ---- B9 6a0446..6a04b3 : blend couleurs.
         * w = word [edi+0Ch] ZERO-extend (6a044d mov ax). 4 sommes 32 bits :
         * octet de out + w. OR des 4 ; 6a0476 cmp eax,0FFh ; 6a047b jle
         * (SIGNED — sommes >= 0 donc == comparaison unsigned).
         * Overflow : SOUSTRACTION de l'octet [edi+1Ch] (6a047d sub cl / 6a0486
         * sub dl / 6a0492 sub al / 6a049a sub bl) — PAS de dec/not, PAS de
         * saturation ici (le dec/not n'existe que dans la trame 0xF8, B11/B13) ;
         * wrap mod 256 implicite via store 8 bits. Store de out+0x30 COMMUN
         * après branche @6a04b3 (bl). ---- */
        w    = (uint32_t)*(uint16_t *)(pb + 0x0C);       /* 6a044d */
        s24  = w + (uint32_t)((uint8_t *)out)[0x24];     /* 6a044a/6a0468 ebp */
        s30  = w + (uint32_t)((uint8_t *)out)[0x30];     /* 6a0455/6a0462 ebx */
        s0C  = w + (uint32_t)((uint8_t *)out)[0x0C];     /* 6a045a/6a0464 ecx */
        s18  = w + (uint32_t)((uint8_t *)out)[0x18];     /* 6a045f/6a0466 edx */
        clip = s24;                    /* 6a046e mov [esp+..+pkt],ebp (slot réutilisé) */
        if ((int32_t)(s30 | s24 | s18 | s0C) <= 0xFF)    /* 6a046a..6a047b jle */
        {
            ((uint8_t *)out)[0x0C] = (uint8_t)s0C;       /* 6a049e */
            ((uint8_t *)out)[0x18] = (uint8_t)s18;       /* 6a04a5 */
            ((uint8_t *)out)[0x24] = (uint8_t)s24;       /* 6a04a8 (cl <- slot) */
        }
        else
        {
            subB = pb[0x1C];                             /* [edi+1Ch] */
            s0C -= subB; ((uint8_t *)out)[0x0C] = (uint8_t)s0C;  /* 6a047d/6a0480 */
            s18 -= subB; ((uint8_t *)out)[0x18] = (uint8_t)s18;  /* 6a0486/6a048c */
            s24 -= subB; ((uint8_t *)out)[0x24] = (uint8_t)s24;  /* 6a0492/6a0494 */
            s30 -= subB;                                 /* 6a049a sub bl,al */
        }
        ((uint8_t *)out)[0x30] = (uint8_t)s30;           /* 6a04b3 — store commun */

        /* ---- B10 6a04ab..6a04c7 : tête OT (sar ARITHMÉTIQUE) ---- */
        /* 6a04ab mov ecx,arg_8 (a3) ; 6a04af mov eax,arg_4 (a2) ;
         * 6a04b6 mov edx,[edi+30h] ; 6a04b9 sar edx,cl ; 6a04c7 lea ebp,[eax+edx*4].
         * Pas de masque explicite sur le count (HW x86 masque &0x1F). */
        p_ot = (uint32_t *)(a2 + 4 * ((int32_t)pkt[12] >> (int32_t)a3));

        /* ---- 6a04c3..6a0624 : avances de curseurs.
         * 6a04c3 : save esi (base quad) dans le home slot 'pkt'.
         * L'ASM entrelace +0x34 / +0x40 / +0xC entre 6a04ca et 6a0624 ;
         * somme nette = +0x4C pour les 8 pointeurs ET esi. Aucune
         * réutilisation intermédiaire -> hoist sûr (prouvé ASM). ---- */
        quadBase = out;                                  /* 6a04c3 */
        q1 += 13; q2 += 13; q4 += 13; q5 += 13;          /* +0x34 chacun */
        q7 += 13; q8 += 13; q10 += 13; q11 += 13;
        out += 13;                                       /* 6a0503 esi += 34h */

        /* ---- B11 6a0552..6a05cb : sub-packet 1 (tri 1) + 2 liens OT ---- */
        sp1 = out;                     /* 6a0552 mov eax,esi (esi = quadBase+0x34) */
        out += 3;                      /* 6a0557 add esi,0Ch */
        sp1[0] = 0x02000000u;          /* 6a0564 mov dword ptr [eax],unk_2000000 */

        if ((uint8_t *)(pb + 0x10) != NULL)  /* 6a0554 lea ecx,[edi+10h] ; 6a055a
                                              * test ; jz 6A05AE — guard MORTEL
                                              * (adresse lea, toujours non-nulle).
                                              * Artefact Hex-Rays: pkt == (uint*)-16. */
        {
            /* Trame 0xF8 : accumulateur en SHL (LOGIQUE) 5/5/2 ; composantes
             * mots via dec/not 32 bits (= -(w)) puis &0xF8 (haut, sans shift)
             * ou sar 3 (ARITHMÉTIQUE, valeur négative) + &0x1F (bas).
             * mov cx : zext implicite (16 bits hauts déjà nuls à ces points). */
            uint32_t t, e;
            t = ((uint32_t)pb[0x12] & 0xF8u) | 0xFFFE2000u;   /* 6a056c dl=[edi+12h] ; 6a0571 and 0F8h ; 6a057d or FFFE2000h */
            t = (t << 5) | ((uint32_t)pb[0x10] & 0xF8u);      /* 6a0583 shl 5 ; 6a056f/6a0577 ; or @6a0586 */
            e = (uint32_t)*(uint16_t *)(pb + 0x16);           /* 6a0588 mov cx,[edi+16h] */
            t = (t << 5) | ((~(e - 1u)) & 0xF8u);             /* 6a058c shl 5 ; 6a058f dec ; 6a0590 not ; 6a0592 and ; 6a0598 or */
            e = (uint32_t)*(uint16_t *)(pb + 0x14);           /* 6a059a mov cx,[edi+14h] */
            t = (t << 2) | ((((int32_t)~(e - 1u)) >> 3) & 0x1Fu); /* 6a059e shl 2 ; 6a05a4 sar 3 ; 6a05a7 and 1Fh ; 6a05aa or */
            color = t;
        }
        else
        {
            color = 0;                                        /* 6a05ae xor ecx,ecx */
        }
        sp1[1] = color;                /* 6a05b2 mov [eax+4],ecx */
        sp1[2] = 0;                    /* 6a05b5 mov dword ptr [eax+8],0 */
        /* 6a05b0 push eax (= sp1) ; 6a05b1 push ebp (= p_ot) */
        OtNode24_PoolAllocLink(p_ot, sp1);                /* 6a05bc — lien 1 : tri 1 */
        /* 6a05c1 mov edx,[esp+40h+pkt] = quadBase (save @6a04c3) */
        OtNode24_PoolAllocLink(p_ot, quadBase);           /* 6a05c7 — lien 2 : quad hdr */

        /* ---- B12 6a05cc..6a0626 : avances restantes + sub-packet 2 ---- */
        q1 += 3; q2 += 3; q4 += 3; q5 += 3;              /* +0x0C chacun — */
        q7 += 3; q8 += 3; q10 += 3; q11 += 3;            /* total/itér = 0x4C */
        sp2 = out;                     /* 6a05d7 mov eax,esi (esi = quadBase+0x40) */
        out += 3;                      /* 6a05e3 add esi,0Ch */
        sp2[0] = 0x02000000u;          /* 6a0616 mov dword ptr [eax],unk_2000000 */

        /* ---- B13 6a0631..6a067a : mot couleur sub-packet 2 (idem B11) ---- */
        if ((uint8_t *)(pb + 0x18) != NULL)  /* 6a0626 lea ecx,[edi+18h] ; 6a0629
                                              * test ; jz 6A0673 — guard MORTEL
                                              * (artefact Hex-Rays: pkt == -24). */
        {
            uint32_t t, e;
            t = ((uint32_t)pb[0x1A] & 0xF8u) | 0xFFFE2000u;   /* 6a0631 dl=[edi+1Ah] ; 6a0642 ; 6a0648 shl 5 */
            t = (t << 5) | ((uint32_t)pb[0x18] & 0xF8u);      /* 6a0634/6a063c ; or @6a064b */
            e = (uint32_t)*(uint16_t *)(pb + 0x1E);           /* 6a064d mov cx,[edi+1Eh] */
            t = (t << 5) | ((~(e - 1u)) & 0xF8u);             /* 6a0651 shl 5 ; 6a0654 dec ; 6a0655 not ; 6a0657 and ; 6a065d or */
            e = (uint32_t)*(uint16_t *)(pb + 0x1C);           /* 6a065f mov cx,[edi+1Ch] */
            t = (t << 2) | ((((int32_t)~(e - 1u)) >> 3) & 0x1Fu); /* 6a0663 shl 2 ; 6a0669 sar 3 ; 6a066c and 1Fh ; 6a066f or */
            color = t;
        }
        else
        {
            color = 0;                                        /* 6a0673 xor ecx,ecx */
        }
        sp2[1] = color;                /* 6a0677 mov [eax+4],ecx */
        sp2[2] = 0;                    /* 6a067a mov dword ptr [eax+8],0 */
        /* 6a0675 push eax (= sp2) ; 6a0676 push ebp (= p_ot) */
        OtNode24_PoolAllocLink(p_ot, sp2);                /* 6a0681 — lien 3 : tri 2 */

next_record:
        /* ---- B14 6a0686..6a069d : queue de boucle ---- */
        rec = recCur;                  /* 6a0686 mov ebp,[esp+40h+var_8] (restaure ;
                                        * esp décalé de 8 par les pushes du 3e call) */
        rec += 9;                      /* 6a0691 add ebp,24h — stride record 0x24 */
        if (--cnt == 0)                /* 6a0694 dec eax ; 6a069d jnz loc_6A021B */
            break;
        recCur = rec;                  /* 6a0695 mov [esp+38h+var_8],ebp */
    }

    pkt[9] = (uint32_t)rec;            /* 6a06a3 mov [edi+24h],ebp */
    return out;                        /* 6a06a7 mov eax,esi — a4 + 0x4C*n émis */
}

/* ============================================================================
 * DIVERGENCES vs HEX-RAYS (hexrays.c = vérificateur ONLY) :
 *  1. 6a055a / 6a0629 : Hex-Rays rend `pkt == (unsigned int *)-16` / `-24`
 *     — artefact de `lea ecx,[edi+10h/18h]; test ecx,ecx` (adresse toujours
 *     non nulle). Guards MORTELS dans l'ASM live ; reproduits ici en lea/test.
 *  2. 6a05a4 / 6a0669 : Hex-Rays rend la 2e composante basse en `>> 3` sur un
 *     opérande UNSIGNED (sémantique shr). L'ASM est `sar ecx,3` (ARITHMÉTIQUE,
 *     valeur négative). ÉQUIVALENT après `& 0x1F` (les bits 0..4 après >>3 sont
 *     identiques pour sar/shr), mais le C réconcilié reproduit sar (l'ASM gagne).
 *  3. 6a03e9 `add ebp,18h` : invisible chez Hex-Rays (il garde le curseur
 *     record v8 dans un registre séparé). L'ASM réutilise ebp comme scratch
 *     (blend 6a0451) et le restaure de var_8 @6a0686 — sémantique identique,
 *     mais c'est la PREUVE que le stride record reste 0x24 (pas 0x3C).
 *  4. 6a047b : Hex-Rays `<= 255` signé ✓ conforme (jle) ; sommes >= 0 donc
 *     équivalent unsigned. Pas de divergence, confirmation.
 *  5. 6a0264 : Hex-Rays `HIWORD(v11)` ✓ conforme au `shr eax,10h` LOGIQUE.
 *  6. Blend : Hex-Rays store out+0x30 commun après branche ✓ conforme (6a04b3).
 *  7. 6a0273 : Hex-Rays relit pkt[13] APRÈS setSomeDword3 ✓ conforme — la
 *     valeur testée 0x60000 est post-appel.
 *
 * UNCERTAIN (à trancher par A/V/R, pas déductible de l'ASM seul) :
 *  - 0x6A0242 camRelated_0 : effet de bord exact (0 arg, entre Set3Pairs et
 *    la copie record->quad).
 *  - 0x6A029B SetsomeDword(a4+0x08, a4+0x14, a4+0x20) : quels mots exactement
 *    écrits (SXY projetés ?) — les bits de clip 1/2/4 lisent ces mots après.
 *  - 0x6A02AE setSomeDword5 / 0x6A02B6 cameraRelated_usedByFields : rôle
 *    (input AVSZ / normal ?).
 *  - 0x6A035D setSomeDword(a4+0x2C) : champ exact rempli avant Gte_AVSZ4
 *    (bit de clip 8 lit le mot [a4+0x2C] après l'appel).
 *  - 0x6A03FC sub_45F4C0 / 0x6A041B sub_45F270 : étapes GTE (RotMul/Proj ?)
 *    sans arg — rôle non prouvé ici.
 *  - a3 (shift) : garantie que les callers passent 0..31 (HW masque &0x1F
 *    de toute façon) — à confirmer côté callers.
 * ========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A01B0 @ 0x6A01B0 (réconciliation R)

- Rôle (1 phrase) : Passe 2 du pipeline mag FX battle (corps générique des 3 wrappers clones 0x46) — consomme le flux de records de 0x24 octets produit par la passe 1 via le curseur persistant `pkt+0x24`, projette chaque quad de 4 sommets indexés par la GTE/caméra (ou copie directe la translation si `pkt+0x08==0`), applique modulation de couleur et clip-flags signés, puis émet par record un quad de 0x4C octets (header 0x0C000000 + 2 sub-packets 0x02000000 = 2 triangles) lié à l'ordering table à la profondeur `AVSZ4 >> arg2`, en retournant le curseur de sortie avancé.
- Verdict : **LIKELY consolidé** (A et B concordent sur le noyau GTE + OT z-triée + curseur persistant ; C-R a tranché les 10 points litigieux contre l'ASM ; aucune convergence wiki possible — wiki.md du pack vide, échec QMD).
- Confiance : LIKELY
- Nom catalogue : `sub_6A01B0` = neutre, trop générique (non mensonger). Le prototype IDA `unsigned int *__cdecl(int, int, char, unsigned int *)` est correct en arité/largeur de retour, mais arg0 est un pointeur de struct de contexte (pas `int`) et arg1 la base d'une ordering table (pas `int`).
- Nom proposé (markdown seul, PAS de rename) : **`MagFx_QuadBatch_GteClip_OtEmit2Tris`** — synthèse de `MagFx_RecordBatch_GteQuadClip_OtSubmit` (A, relance) et `GteBatch_EmitF3Triplet_FromRecordStream` (B) : le suffixe « Emit2Tris » est la seule correction factuelle par rapport aux deux (voir Divergence 4) ; le préfixe « MagFx » est justifié par les faits d'ancorage orchestrateur (3 wrappers clones 0x46 = famille mag FX, dont `0x69FD00 Mag213_BuildCtx_CursorInit_TwoPass`) et l'architecture TwoPass (consommation des records 0x40 de la passe 1 `0x69FD50`, fermée LIKELY).

## In / Out / Effets

Prototype réel (cdecl, empilement droite→gauche) :
`u32* MagFx_QuadBatch_GteClip_OtEmit2Tris(PKT* pkt, void* otBase, int depthShift, u32* outCursor)`

**In** :
- arg0 `pkt` (struct contexte rendu, edi @0x6A01B6) :
  - `+0x04/+0x05/+0x06` : 3 octets caméra → `Camera_SetPackedSlots_15_16_17` (pushes 0x6A03D7/0x6A03DB/0x6A03DC, ordre +4/+5/+6, arg<<4, slots 15/16/17)
  - `+0x08` : drapeau mode — si ≠0 : re-projection GTE complète (`GteState_SetTriplet_1CA8A60(rec+0x18/0x1C/0x20)`, `GteState_Set_1CA8A30`, `sub_45F4C0`, `GteState_GetTriplet_1CA8A60` → out+0x10/0x1C/0x28, `GteState_StorePtr_1CA8A28(out+4)`, `sub_45F270`, `GteState_GetToPtr_1CA8A68(out+4)`) ; si 0 : copie directe `[ebp+0x18/0x1C/0x20]` → out+0x10/0x1C/0x28 (0x6A042B–0x6A0444)
  - `+0x0C` : word (zext u16 @0x6A044D) additionné aux 4 dwords de modulation du quad ; `+0x1C` : octet soustrait de chaque canal si OR des sommes > 0xFF (`jle` signé @0x6A047B — sommes ≥ 0 donc équivalent unsigned ; overflow → wrap mod 256 par store 8 bits, PAS de saturation, PAS de dec/not dans le blend)
  - `+0x10..0x1F` : trames couleur 0xF8 des 2 sub-packets (guards `lea ecx,[edi+10h/18h]; test ecx,ecx; jz` @0x6A055A/0x6A0629 — mortelles, adresse lea toujours non nulle, reproduites telles quelles) ; seeds tri 1 : byte `+0x10` (ECX, and 0xF8), word `+0x12` (EDX, and 0xF8, or 0xFFFE2000, shl 5, shl 5, shl 2), mot `+0x14` (`dec;not` = `~(w-1)`, and 0xF8) et `+0x16` (`dec;not`, sar 3, and 0x1F) ; tri 2 symétrique depuis `+0x18/+0x1A/+0x1E/+0x1C` (0x6A0631–0x6A066C)
  - `+0x20` : base table de pointeurs sommets (`[[pkt+0x20]]` = count d'entrée, `jle` signé @0x6A01D6) ; indices = words `record+0x04/0x06/0x08/0x0A` ×4 (@0x6A0221–0x6A0242, 0x6A02A6)
  - `+0x24` : curseur flux records persistant (lu @0x6A01BE, count = `[[pkt+0x24]]` @0x6A01C1, avance +4 immédiat @0x6A01C9, stride boucle 0x24 @0x6A0691, store final 0x6A06A3 / early-exit 0x6A06B0)
  - `+0x30` : récepteur AVSZ4 (`GteState_GetToPtr_1CA8A2C(&pkt[12])` @0x6A03BC, appelé après `Gte_AVSZ4` @0x6A0365) ; `+0x34` : miroir état GTE relu APRÈS `setSomeDword3(&pkt[13])` @0x6A026E, test `test eax,60000h; jnz loc_6A068D` @0x6A0279/0x6A027E = skip du record si bits 0x60000 posés (émission sautée, boucle continue, curseur records déjà avancé)
- arg1 `otBase` (@0x6A04AF) ; arg2 `depthShift` (@0x6A04AB, compteur `sar`) ; arg3 `outCursor` (esi initial @0x6A01BA, base du premier quad + 8 pointeurs locaux).

**Out** : retour `eax` = curseur sortie final (esi) — +0x4C par quad ÉMIS (`add esi,34h` @0x6A0503 + `add esi,0Ch` @0x6A0557 + `add esi,0Ch` @0x6A05E3), inchangé (retour = arg3) pour les records skipés et l'early-exit @0x6A06B3 ; `pkt+0x24` avancé de 4 + 0x24×count dans tous les chemins.

**Effets** : état GTE BSS écrit (1CA8A10..1CA8A24 via Set3Pairs @0x6A023D, dword_1CA8A28 via StorePtr SETTER @0x6A0416, dword_1CA8A2C via AVSZ4/GetToPtr @0x6A0365/0x6A03BC, dword_1CA8A30 @0x6A03F7, 1CA8A60/68 @0x6A03EE/0x6A0410/0x6A0421) ; slots caméra 15/16/17 (chemin GTE uniquement) ; ≤3 nœuds OtNode24 (0x18 o, pool base 0x1C48828, cursor 0x1CA8828, cap 0x60000) par record émis, ordre des liens OT : **tri 1 (quadBase+0x34) @0x6A05BC → header quad 0x0C000000 @0x6A05C7 → tri 2 (quadBase+0x40) @0x6A0681** ; octets de modulation out+0x0C/0x18/0x24/0x30 modifiés (stores 0x6A0480/0x6A048C/0x6A0494/0x6A04B3 — store commun +0x30 @0x6A04B3 après branche) ; `p_ot = otBase + 4*((int)pkt[12] sar arg2)` (@0x6A04B6–0x6A04C7, sar ARITHMÉTIQUE, cohérent Z signé).

## Divergences A/B tranchées (chacune avec EA + opcode)

1. **Nature des primitives émises : quad + 2 triangles (A) vs « 3 primitives FT3 par record » (B)** → **tranché : quad header + 2 sub-packets triangle**. Le header quad reçoit `0x0C000000` @0x6A0247 (`mov dword ptr [esi],0C000000h`) ; les deux sub-packets reçoivent `0x02000000` @0x6A0564 et 0x6A0616. B a sous-compté le header : il y a 2 stores `0x02000000`, pas 3, plus un header distinct ; et le tag 0x0C000000 n'est pas « opcode GPU non identifié » (question ouverte B #1) mais le marqueur du corps quad, l'ensemble formant une structure quad à 2 triangles. La relance A (« quad ») est la bonne lecture.
2. **Stride sortie : 0x4C/quad émis (C-R) vs 0x40 annoncé** → **tranché : 0x4C** (`0x6A0503 add esi,34h` + `0x6A0557 add esi,0Ch` + `0x6A05E3 add esi,0Ch`), et les 8 pointeurs locaux avancent aussi de 0x4C net. Le « record 0x40 » de la passe 1 est un format différent (entrée passe 2 = records 0x24 @0x6A0691) — consommation de champs différents, pas contradiction. A correct sur 0x4C implicite, B correct sur le détail des 3 additions, C-R a consolidé.
3. **Blend couleurs : « soustraction byte pkt+0x1C, wrap mod 256 » (A) vs « clamp approximatif » (B) + 3e canal inversé dec/not (B)** → **tranché : soustraction 8 bits avec wrap implicite, PAS de saturation ; le dec/not n'existe PAS dans le blend** — séquence exacte @0x6A047D–0x6A049C (`sub cl,[edi+1Ch]`/`sub dl,al`/`sub al,cl`/`sub bl,al`, stores 8 bits). Le motif `dec;not;sar 3;and 1Fh` (@0x6A058F–0x6A05A7 et 0x6A0654–0x6A066C) appartient exclusivement à la trame couleur 0xF8 (canal bas = `(-(w)) >> 3 & 0x1F`, opérande négative → sar ARITHMÉTIQUE @0x6A05A4/0x6A0669, équivalent shr après and 0x1F) ; B a mélangé les deux blocs. La question ouverte B #2 (alpha négatif) se reformule : inversion du canal bas de la trame 0xF8, signification consommateur non prouvée.
4. **Sémantique du test `0x60000` : « FLAG GTE » (A) vs « cap pool OT » (B)** → **tranché : miroir d'état GTE (A), pas le cap du pool**. La valeur testée @0x6A0279 est `[edi+34h]` **relue après** `setSomeDword3(&pkt[13])` @0x6A026E/0x6A0273 — c'est le champ miroir FLAG du contexte (cf. `GteState_GetToPtr_1CA8A2C` sur pkt+0x30 @0x6A03BC, même famille de champs GTE dans pkt). La coïncidence numérique avec le cap pool 0x60000 (callees.txt) est un leurre : le champ testé n'est pas le cursor 0x1CA8828. Effet identique dans les deux lectures (skip du record), mais la source est le FLAG GTE (division overflow / checksum GTE).
5. **Nom : `MagFx_RecordBatch_GteQuadClip_OtSubmit` (A) vs `GteBatch_EmitF3Triplet_FromRecordStream` (B)** → **tranché : synthèse `MagFx_QuadBatch_GteClip_OtEmit2Tris`**. B refuse « MagFx » au motif que rien dans le pack seul ne le prouve — faux : les 3 wrappers callers clones 0x46 (0x69FD3A/sub_69FD00 — `Mag213_BuildCtx_CursorInit_TwoPass` prouvé par l'orchestrateur, 0x6CF0FA/sub_6CF0C0, 0x6EB6DA/sub_6EB6A0) + l'architecture TwoPass (consommation des records de la passe 1 0x69FD50) sont des preuves d'ancorage valides selon le protocole. B a raison sur la structure « émission vers OT depuis un flux de records » mais tort sur « F3Triplet » (voir Divergence 1 : 2 triangles par quad, pas 3 prims FT3). « Quad » (A) gagne ; « Emit2Tris » précise la structure émise.
6. **`pkt+0x10/+0x18` : « ptrs vers champs packés » (A) vs « dwords couleur prim 1 / prims 2-3 » (B)** → **tranché : ce sont des ADRESSES DE BASE lues par les guards, pas des pointeurs stockés** — les seeds de la trame 0xF8 lisent directement les bytes/words de `pkt+0x10..0x1F` (@0x6A056C `mov dl,[edi+12h]`, @0x6A056F `mov cl,[ecx]` avec ecx=lea edi+10h @0x6A0554 ; idem bloc 2 @0x6A0626–0x6A0634). Les guards `test ecx,ecx` @0x6A055A/0x6A0629 sont mortelles (lea) — aucune branche réelle. Les deux descriptions étaient partiellement fausses ; C-R a tranché avec les adresses exactes des seeds.
7. **Polarité clip : A « bits 1/2/4/8 X et 0x10/0x20/0x40/0x80 Y, cull si nibble entier » vs B « bits 1/2/4 X seulement, rejet par nibble »** → **tranché : A complet, B incomplet**. Les 8 tests sont présents : bits 1/2/4 sur `[out+0x08/0x14/0x20]` seuil 0xA00 (@0x6A02BB–0x6A0309), bit 8 sur `[out+0x2C]` seuil 0xA00 (@0x6A036E–0x6A0383), bits 0x10/0x20/0x40 sur `[esi+0x0A/0x16/0x22]` seuil 0x6C0 (@0x6A030D–0x6A0354), bit 0x80 sur `[esi+0x2E]` seuil 0x6C0 (@0x6A0389–0x6A0398). Cull = nibble X ENTIER (`and edx,0Fh; cmp dl,0Fh; jz` @0x6A039D–0x6A03A3) OU nibble Y ENTIER (`and ecx,0F0h; cmp cl,0F0h; jz` @0x6A03A9–0x6A03B2). Tous les tests `jl`/`jle` SIGNED (jamais `jb`), motif `test ax,ax; jl` + `cmp ax,SEUIL; jle` = bit posé ssi hors `[0,SEUIL]` en int16. B a cité les bits 1/2/4 mais omis bit 8/0x80 dans sa liste ; A a cité les 8.
8. **`[[pkt+0x20]]` : count (A+B) vs « `[+20h]` = count » (B seul)** → **convergence sans divergence réelle** : `0x6A01C6 mov eax,[edi+20h]` (base table, sauvegardé arg_C @0x6A01D2) puis `0x6A01C1 mov ecx,[eax]` = `[[pkt+0x20]]` = count d'entrée, test `jle` signé @0x6A01D6. Les indices ×4 indexent la table pointeurs (@0x6A0225 `lea edx,[eax+ecx*4]`). A et B concordent ; formulation B ambiguë mais même lecture.

## Preuves (ASM cité)

1. **Curseur records persistant + count + early-exit** — 0x6A01BE `mov eax,[edi+24h]` ; 0x6A01C1 `mov ecx,[eax]` (count) ; 0x6A01C3 `lea ebp,[eax+4]` ; 0x6A01C9 `mov [edi+24h],ebp` ; 0x6A01D6 `jle loc_6A06B0` (sortie signée count≤0, re-store curseur 0x6A06B0, retour = arg3 0x6A06B3) ; stride boucle 0x6A0691 `add ebp,24h` ; store final 0x6A06A3 `mov [edi+24h],ebp` — passe 2 stateful qui consomme le flux de la passe 1.
2. **Indices sommets → GTE** — 0x6A0221–0x6A0242 : words `record+0x04/0x06/0x08` puis 0x6A02A6 `[ebp+0Ah]`, ×4 dans `[pkt+0x20]` (`lea edx,[eax+ecx*4]` @0x6A0225/0x6A022F/0x6A0239/0x6A02AA) → pushes droite→gauche → `GteState_Set3Pairs_1CA8A10` @0x6A023D (6 dwords 1CA8A10..1CA8A24) + `camRelated_0` @0x6A0242 : transform caméra du quad.
3. **Header quad + 2 sub-packets + liens OT** — 0x6A0247 `mov dword ptr [esi],0C000000h` (header) ; 0x6A0564 et 0x6A0616 `mov dword ptr [eax],offset unk_2000000` (2 sub-packets tri) ; 3× `OtNode24_PoolAllocLink` @0x6A05BC (sub-packet 1 = quadBase+0x34, lié 1er), @0x6A05C7 (header quad, lié 2e — base sauvée @0x6A04C3 `mov [esp+38h+pkt],esi` avant `esi += 34h`), @0x6A0681 (sub-packet 2 = quadBase+0x40, lié 3e).
4. **Profondeur OT = AVSZ4 sar arg2 ×4** — 0x6A0365 `Gte_AVSZ4` (somme low16 1CA8A50/54/58/5C × word_1CA92F4 >>12 → dword_1CA8A2C) ; 0x6A03BC `GteState_GetToPtr_1CA8A2C(&pkt[12])` → `[pkt+0x30]` ; 0x6A04B6 `mov edx,[edi+30h]` ; **0x6A04B9 `sar edx,cl` (ARITHMÉTIQUE)** ; 0x6A04C7 `lea ebp,[eax+edx*4]` (eax=arg_4 @0x6A04AF) → `p_ot = otBase + 4*((int)pkt[12] >> arg2)`.
5. **Clip signé + cull par nibble** — 0x6A02C2–0x6A02C7 `test ax,ax; jl` / `cmp ax,0A00h; jle` (motif SIGNED, ×4 sur 0xA00, ×4 sur 0x6C0) ; cull 0x6A039D `and edx,0Fh; cmp dl,0Fh; jz loc_6A068D` (nibble X entier) et 0x6A03A9 `and ecx,0F0h; cmp cl,0F0h; jz` (nibble Y entier) — skip du record sans avancer esi (saut direct à la queue de boucle 0x6A068D, curseur records déjà avancé).
6. **Skip FLAG GTE 0x60000 relu post-appel** — 0x6A026E `call setSomeDword3` (arg = `lea eax,[edi+34h]` @0x6A026A) ; 0x6A0273 `mov eax,[edi+34h]` (relit APRÈS l'appel) ; 0x6A0279 `test eax,60000h` ; 0x6A027E `jnz loc_6A068D` — miroir FLAG GTE du contexte, pas le cap pool (le cursor pool 0x1CA8828 n'est jamais lu ici).
7. **Blend mod 256, store commun +0x30** — 0x6A0446–0x6A0476 : 4 sommes = byte de out+0x24/0x30/0x0C/0x18 + word `[edi+0Ch]` (zext @0x6A044D), OR des 4, `cmp eax,0FFh` ; 0x6A047B `jle` (SIGNED) ; overflow 0x6A047D–0x6A049C : `sub` de byte `[edi+1Ch]` ×4, stores 8 bits (wrap) ; store commun `[esi+30h]` @0x6A04B3 après branche. Aucun dec/not dans ce bloc.
8. **Retour et cdecl** — 0x6A06A7 `mov eax,esi` (sortie normale, esi = curseur sortie +0x4C×quads émis) / 0x6A06B3 `mov eax,esi` (early-exit, = arg3) ; 0x6A06AF `retn` nu, nettoyage pile par caller (`add esp,28h` @0x6A06AC) — retour pointeur 32 bits.

## Checks §5.6

- **Callees cités ⊂ callees.txt** : `GteState_Set3Pairs_1CA8A10` (6a023d ✓), `camRelated_0` (6a0242 ✓), `setSomeDword3` (6a026e ✓), `SetsomeDword` (6a029b ✓), `setSomeDword5` (6a02ae ✓), `cameraRelated_usedByFields` (6a02b6 ✓), `setSomeDword` (6a035d ✓), `Gte_AVSZ4` (6a0365 ✓), `GteState_GetToPtr_1CA8A2C` (6a03bc ✓), `Camera_SetPackedSlots_15_16_17` (6a03dd ✓), `GteState_SetTriplet_1CA8A60` (6a03ee ✓), `GteState_Set_1CA8A30` (6a03f7 ✓), `sub_45F4C0` (6a03fc ✓), `GteState_GetTriplet_1CA8A60` (6a0410 ✓), `GteState_StorePtr_1CA8A28` (6a0416 ✓), `sub_45F270` (6a041b ✓), `GteState_GetToPtr_1CA8A68` (6a0421 ✓), `OtNode24_PoolAllocLink` (6a05bc/6a05c7/6a0681 ✓). **Tous présents, aucun inventé.**
- **Callers ⊂ callers.txt** : 0x69FD3A (`sub_69FD00`, size 0x46 ✓ — `Mag213_BuildCtx_CursorInit_TwoPass`, ancre orchestrateur), 0x6CF0FA (`sub_6CF0C0`, 0x46 ✓), 0x6EB6DA (`sub_6EB6A0`, 0x46 ✓) — 3 wrappers clones, xrefs code only.
- **Strides en nombres** : record 0x24 (`0x6A0691 add ebp,24h`) ; avance curseur initiale +4 (`0x6A01C3 lea ebp,[eax+4]`) ; sortie 0x4C/quad émis (`0x6A0503 add esi,34h` + `0x6A0557 add esi,0Ch` + `0x6A05E3 add esi,0Ch`) ; table sommets ×4 (`0x6A0225 lea edx,[eax+ecx*4]`) ; OT ×4 (`0x6A04C7 lea ebp,[eax+edx*4]`) ; nœud OT 0x18 (callees.txt). Aucun stride *232/*0x1D0 en jeu.
- **Polarités signées** : count `jle` @0x6A01D6 ✓ ; clip `jl`/`jle` signés ×8 @0x6A02C5–0x6A0396 ✓ ; blend `cmp eax,0FFh; jle` @0x6A047B (SIGNED, sommes ≥ 0) ✓ ; bucket Z `sar edx,cl` @0x6A04B9 (ARITHMÉTIQUE, Z signé) vs `shr eax,10h` @0x6A0264 (LOGIQUE, extraction HIWORD) ✓ ; `sar ecx,3` @0x6A05A4/0x6A0669 (opérande négative, équivalent shr après `and 1Fh`) ✓ ; `shl` logiques accumulateur trame 0xF8 @0x6A0583/0x6A058C/0x6A059E ✓. Aucun `ja`/`jb` en jeu.
- **Largeur retour** : `eax = esi` pointeur 32 bits (`0x6A06A7`/`0x6A06B3 mov eax,esi`), `retn` nu = cdecl ✓ — compatible prototype IDA `unsigned int *`.
- **Nom ≥2 preuves ASM indépendantes adressées** : (1) trame GTE+caméra complète 0x6A0221–0x6A0444 (Set3Pairs, Camera slots 15/16/17, triplet 1CA8A60, AVSZ4 0x6A0365) = cœur transform/projection ; (2) émission quad + 2 sub-packets + 3 liens OT z-triés 0x6A0247/0x6A0564/0x6A0616/0x6A04C7 = cœur batch submit ; (3) ancre famille mag FX : 3 wrappers callers clones 0x46 dont `sub_69FD00 Mag213_BuildCtx_CursorInit_TwoPass` (passe 2 consommant les records de la passe 1 0x69FD50). Le suffixe « Quad/2Tris » est adressé par (2), le préfixe « MagFx » par (3).

## Questions ouvertes (non bloquantes)

1. Effets de bord exacts des callees opaques : `camRelated_0` @0x6A0242, `SetsomeDword(out+0x08, out+0x14, out+0x20)` @0x6A029B (mots lus par les bits de clip 1/2/4 juste après — SXY projetés ?), `setSomeDword5`/`cameraRelated_usedByFields` @0x6A02AE/0x6A02B6, `setSomeDword(out+0x2C)` @0x6A035D (rempli avant `Gte_AVSZ4`, lu par le bit de clip 8).
2. Rôle de `sub_45F4C0` / `sub_45F270` @0x6A03FC/0x6A041B (étapes GTE sans arg — RotMul/projection ?) — non déductible de ce pack.
3. Signification du canal bas inversé de la trame 0xF8 (`~(w-1)`, sar 3, and 0x1F) côté consommateur OT — alpha négatif ou codage palette.
4. Bornes clip 0xA00 (2560) / 0x6C0 (1728) : espace écran battle suréchantillonné ?
5. Garantie callers arg2 ∈ 0..31 (HW masque x86 &0x1F de toute façon) — à confirmer en lisant un des 3 wrappers (hors périmètre de ce pack).
6. `dword_2510194` (ancre orchestrateur) : absente de globals.txt de ce pack — non vérifiable ici.

## IDBCOMMENT

Passe 2 du pipeline mag FX : consomme le flux de records 0x24 via le curseur pkt+24, projette chaque quad de 4 sommets indexes (table pkt+20) par la GTE et la camera (slots 15/16/17), ou copie la translation si pkt+08 est nul. Cull signe hors bornes 0xA00/0x6C0 si un nibble de flags X ou Y est entier, ou skip si le miroir FLAG GTE pkt+34 porte 0x60000 relu apres setSomeDword3. Sinon emet un quad 0x4C octets (header 0C000000 + 2 sub-packets 02000000 = 2 triangles, canaux modules par pkt+0C et retranches pkt+1C en wrap 8 bits) et lie tri1, header, tri2 a l'OT a la profondeur AVSZ4 sar arg2. Retourne le curseur de sortie avance en eax. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A01B0 (EA 0x6A01B0)

Rôle : C-R (réconciliateur C). Entrées : `c_a.c`, `c_b.c` (voix aveugles croisées),
`asm.asm` (GROUND TRUTH, 419 instr / 1292 o), `hexrays.c` (vérificateur SEULEMENT),
`meta.json`, `callees.txt`, `callers.txt`, `globals.txt`. Livrable : `c_reconciled.c`.
Aucune moyenne A/B : chaque point tranché contre l'ASM, adresse citée.

Convention : A = c_a, B = c_b, H = Hex-Rays. Adresses = ASM live (asm.asm).

---

## 1. Strides (boucle records / sortie)

- **Record d'entrée : stride 0x24** (9 dwords). Curseur porté par `var_8` (pile) :
  init `6a01ce` (`mov [esp+34h+var_8], ebp`), restauration dans ebp `6a0686`,
  avance `6a0691 add ebp,24h`, re-store `6a0695`, store final `pkt[9]` `6a06a3`
  (early-exit : re-store `6a06b0`).
  **Piège levé** : `6a03e9 add ebp,18h` (chemin GTE) est un artéfact de calcul
  d'argument (ebp régénéré pour le 1er push de `GteState_SetTriplet_1CA8A60`) ;
  ebp est écrasé au blend `6a0451` puis restauré depuis `var_8` `6a0686`. Le
  stride ne devient JAMAIS 0x3C. A et B corrects tous deux (stride 0x24).
- **Sortie : stride 0x4C par quad ÉMIS** (pas 0x40) — tranché, A et B concordants :
  `6a0503 add esi,34h` + `6a0557 add esi,0Ch` + `6a05e3 add esi,0Ch` = 0x4C.
  Les 8 pointeurs locaux avancent aussi de 0x4C net : l'ASM entrelace
  +0x34/+0x40/+0xC entre `6a04ca` et `6a0624` (ex. var_14 = +0x34 puis +0xC à
  `6a04d7`, var_28 = +0x34 puis +0xC à `6a0501`, var_C = +0x34 `6a0505` puis
  +0xC `6a054e`, etc.) ; somme = 0x4C, aucune réutilisation intermédiaire → hoist
  sûr dans le C. **Les records skipés n'avancent ni esi ni les 8 pointeurs**
  (saut direct `6a068D` depuis `6a027e` / `6a03a3` / `6a03b2`).

## 2. Tag quad 0x0C000000 vs 0x09000000

- **Tranché : 0x0C000000**, store à `6a0247` `mov dword ptr [esi], 0C000000h`
  (esi = base quad courante). Aucun 0x09000000 dans la fonction.
- Sub-packets : `0x02000000` aux stores `6a0564` et `6a0616`
  (`mov dword ptr [eax], offset unk_2000000`).

## 3. Clip signé 0xA00/0x6C0 — polarités

- Motif ASM (les 8 tests) : `test ax,ax; jl <set>` puis `cmp ax,SEUIL; jle <pass>`
  → bit posé ssi `(int16)v < 0 || (int16)v > SEUIL`, équivalent `(uint16)v > SEUIL`.
  Bits : 1/2/4 sur mots `[a4+0x08]/[a4+0x14]/[a4+0x20]` seuil 0x0A00
  (`6a02bb/6a02d5/6a02f1`, cmp `6a02c7/6a02e1/6a02fd`) ; 0x10/0x20/0x40 sur mots
  `[esi+0x0A]/[esi+0x16]/[esi+0x22]` seuil 0x6C0 (`6a030d/6a0326/6a033f`,
  cmp `6a0316/6a032f/6a0348`) ; bit 8 sur `[a4+0x2C]` 0x0A00 (`6a036e..6a0383`,
  via `ecx |= 8` avec saut intermédiaire) ; bit 0x80 sur `[esi+0x2E]` 0x6C0
  (`6a0389..6a0398`).
- **Rejet : un NIBBLE ENTIER posé** → skip du record entier :
  `6a039d and edx,0Fh; cmp dl,0Fh; jz 6A068D` (bits X 1|2|4|8 tous posés) et
  `6a03a9 and ecx,0F0h; cmp cl,0F0h; jz 6A068D` (bits Y 0x10|0x20|0x40|0x80 tous
  posés). Pas de rejet par axe individuel.
- A (forme u16) et B (forme int16) équivalents ; C réconcilié = forme int16
  explicite avec commentaires polarité.

## 4. Skip si pkt[13] & 0x60000

- **Tranché** : test à `6a0279` (`test eax,60000h`), saut `6a027e jnz loc_6A068D`.
  Détail important : `pkt[13]` est **relu après** `setSomeDword3(&pkt[13])`
  (`6a026e` call, `6a0273 mov eax,[edi+34h]`) — la valeur testée est post-appel.
  A et B concordants.

## 5. Profondeur / p_ot

- Ordre exact : `6a03bc GteState_GetToPtr_1CA8A2C(&pkt[12])` (écrit pkt[12] =
  dword_1CA8A2C, sortie de Gte_AVSZ4 `6a0365`), PUIS au moment du lien :
  `6a04ab mov ecx,arg_8` (a3), `6a04af mov eax,arg_4` (a2),
  `6a04b6 mov edx,[edi+30h]` (pkt[12]), **`6a04b9 sar edx,cl` (ARITHMÉTIQUE)**,
  `6a04c7 lea ebp,[eax+edx*4]` → `p_ot = a2 + 4*((int)pkt[12] >> (int)a3)`.
- **Pas de masque explicite** sur le count de shift (HW x86 masque &0x1F) ;
  a3 est un `char` (arg_8). A et B concordants ; H concordant (`>> a3`).

## 6. Chemin GTE vs copie directe

- Condition : `6a03c7 test eax,eax` sur `[edi+8]` = pkt[2] ; `6a03c9 jz loc_6A042B`.
- **GTE (pkt[2]≠0)**, `6a03cb..6a0429` : `Camera_SetPackedSlots_15_16_17(pb[4], pb[5], pb[6])`
  (pushes `6a03d7/6a03db/6a03dd` → ordre edx,ecx,eax = +4,+5,+6) ;
  `GteState_SetTriplet_1CA8A60(rec+0x18, rec+0x1C, rec+0x20)` (pushes
  `6a03e8/6a03ec/6a03ed` ; le `6a03e9 add ebp,18h` fabrique le 1er arg) ;
  `GteState_Set_1CA8A30(pkt[2])` `6a03f7` ; `sub_45F4C0()` `6a03fc` ;
  `GteState_GetTriplet_1CA8A60(a4+0x10, a4+0x1C, a4+0x28)` (pushes
  `6a040d/6a040e/6a040f` → var_20, var_1C, var_18) ;
  `GteState_StorePtr_1CA8A28(a4+4)` `6a0416` (SETTER, dword_1CA8A28 = a4+4) ;
  `sub_45F270()` `6a041b` ; `GteState_GetToPtr_1CA8A68(a4+4)` `6a0421`.
- **Direct (pkt[2]==0)**, `6a042b..6a0444` : `[ebp+18h]→[a4+0x10]`,
  `[ebp+1Ch]→[a4+0x1C]`, `[ebp+20h]→[a4+0x28]` (rec+0x18..0x20 rec[6]/[7]/[8]).
- A et B concordants (B documente mieux ; C réconcilié suit B + adresses).

## 7. Blend couleurs

- **Séquence exacte** (`6a0446..6a04b3`) : `w = (u16)[edi+0Ch]` zext (`6a044d mov ax`) ;
  4 sommes 32 bits = octet de out + w : `+0x24` (ebp, `6a044a/6a0468`),
  `+0x30` (ebx, `6a0455/6a0462`), `+0x0C` (ecx, `6a045a/6a0464`),
  `+0x18` (edx, `6a045f/6a0466`). OR des 4 (`6a046a..6a0474`) ;
  `6a0476 cmp eax,0FFh` ; **`6a047b jle` (SIGNED)** — sommes ≥ 0 donc == unsigned.
- Overflow (`6a047d..6a049c`) : **soustraction** de l'octet `[edi+1Ch]` :
  `6a047d sub cl,[edi+1Ch]` (→ store `[esi+0Ch]` `6a0480`), `6a0486 sub dl,al`
  (→ `[esi+18h]` `6a048c`), `6a0492 sub al,cl` (→ `[esi+24h]` `6a0494`,
  l'opérande lu depuis le home slot où ebp-somme fut sauvé `6a046e`),
  `6a049a sub bl,al` (→ `[esi+30h]` store commun `6a04b3`).
  **PAS de dec/not, PAS de saturation** dans le blend — wrap mod 256 implicite
  via store 8 bits. (Le dec/not n'existe que dans la trame 0xF8, point 10.)
- Pas d'overflow (`6a049e..6a04a8`) : stores directs des 3 octets ; store
  `+0x30` COMMUN après branche `6a04b3`.
- A et B concordants (B restitue le store commun `+0x30` plus fidèlement).
- `// UNCERTAIN 0x6A0451` (A) : word `[edi+0Ch]` = word à l'offset 0x0C de pkt
  = `*(u16*)(pb+0x0C)` (Hex-Rays `*((_WORD*)pkt+6)` ✓). Tranché par H concordant.

## 8. Trois liens OtNode24_PoolAllocLink

- Ordre et pointeurs exacts :
  1. `6a05b0 push eax` (= sub-packet 1, quadBase+0x34) ; `6a05b1 push ebp` (= p_ot) ;
     call `6a05bc` → `PoolAllocLink(p_ot, sp1)` — **tri 1 lié 1er**.
  2. `6a05c1 mov edx,[esp+40h+pkt]` = quadBase (sauvé `6a04c3 mov [esp+38h+pkt],esi`
     AVANT `esi += 34h`) ; call `6a05c7` → `PoolAllocLink(p_ot, quadBase)` —
     **header quad 0x0C000000 lié 2e**.
  3. `6a0675 push eax` (= sub-packet 2, quadBase+0x40, `6a05d7 mov eax,esi` après
     le 2e +0xC) ; call `6a0681` → `PoolAllocLink(p_ot, sp2)` — **tri 2 lié 3e**.
- Cleanup : `add esp,10h` `6a05fb` (2 premiers liens, 16 o) ; `add esp,8` `6a068a`
  (3e). A et B concordants.

## 9. Retour

- **Tranché : eax = esi final** (curseur sortie avancé de 0x4C par quad ÉMIS,
  pas a4) : `6a06a7 mov eax,esi` (sortie normale) / `6a06b3 mov eax,esi`
  (early-exit count≤0 → retour = a4). A et B concordants.

## 10. Trame couleur 0xF8

- **shl (LOGIQUE) sur l'accumulateur** : `6a0583 shl edx,5`, `6a058c shl edx,5`,
  `6a059e shl edx,2` (et idem `6a0648/6a0651/6a0663` pour le tri 2). Pas de sar
  sur l'accumulateur.
- Composantes mots : **`dec` puis `not` 32 bits** (`6a058f/6a0590`,
  `6a05a1/6a05a2` ; `6a0654/6a0655`, `6a0666/6a0667`) = `~(w-1)` = `-(w)` ;
  composante haute : `and 0F8h` sans shift (`6a0592/6a0657`) ; composante basse :
  **`sar 3` ARITHMÉTIQUE** (`6a05a4/6a0669` — l'opérande est négatif) puis
  `and 1Fh` (`6a05a7/6a066c`). Le `sar` vs `shr` est **indifférent après le
  `and 0x1F`** (bits 0..4 identiques), mais le C réconcilié reproduit sar
  (`(int32_t)~(e-1u) >> 3`) — l'ASM gagne. H rend ce bloc en unsigned (`>>3`)
  : divergence de forme seulement, documentée.
- `mov cx,[edi+16h]` etc. : zext implicite (les 16 bits hauts d'ecx sont déjà
  nuls à ces points — ecx = octet &0xF8 juste avant). Reproduit par lecture u16.
- Seeds : tri 1 `6a056c dl=[edi+12h]`, `6a056f cl=[edi+10h]`, `6a057d/6a0577
  and 0F8h`, `6a057d? or 0FFFE2000h @6a057d... or @6a057d/6a0586` — précisément :
  `6a0571 and edx,0F8h` (dl), `6a0577 and ecx,0F8h` (cl), `6a057d or edx,0FFFE2000h`,
  `6a0583 shl edx,5`, `6a0586 or edx,ecx`. Tri 2 : `6a0631 dl=[edi+1Ah]`,
  `6a0634 cl=[edi+18h]`, `6a0636/6a063c and 0F8h`, `6a0642 or 0FFFE2000h`,
  `6a0648 shl 5`, `6a064b or`.
- Guards `lea ecx,[edi+10h/18h]; test ecx,ecx; jz` (`6a055a`/`6a0629`) :
  **mortelles** (adresse lea, toujours non nulle) ; reproduites telles quelles.

---

## Divergences vs Hex-Rays (récapitulatif)

1. `6a055a`/`6a0629` : H rend `pkt == (unsigned int*)-16` / `-24` — artefact des
   lea/test mortels. Corrigé dans le C réconcilié (guards reproduites, mortelles).
2. `6a05a4`/`6a0669` : H rend la composante basse en shift logique sur unsigned ;
   l'ASM est `sar` (arithmétique). Équivalent après `& 0x1F` ; C réconcilié = sar.
3. `6a03e9 add ebp,18h` : invisible chez H (curseur record dans un registre
   séparé) ; l'ASM réutilise ebp comme scratch (blend `6a0451`) + restauration
   `var_8` `6a0686` — preuve que le stride record reste 0x24.
4. `6a0273` : H relit pkt[13] APRÈS `setSomeDword3` ✓ conforme (bit 0x60000
   testé post-appel).
5. `6a0264` shr logique `HIWORD` ✓ conforme ; `6a047b jle` signé ✓ conforme ;
   store commun out+0x30 `6a04b3` ✓ conforme.
6. H garde le curseur record/esi dans des variables propres ; l'ASM réutilise
   agressivement ebp (record → p_ot `6a04c7` → somme blend `6a0451` → restauré
   `6a0686`) et le home slot arg0 (flag clip → base quad `6a04c3`). Sémantique
   identique, reproduction fidèle documentée dans le C réconcilié.

## UNCERTAIN restants (à trancher par A/V/R — non déductible de l'ASM seul)

- `0x6A0242` `camRelated_0` : effet de bord exact (0 arg, entre Set3Pairs et la
  copie record→quad).
- `0x6A029B` `SetsomeDword(a4+0x08, a4+0x14, a4+0x20)` : quels mots écrits
  (SXY projetés ?) — les bits de clip 1/2/4 lisent ces mots juste après.
- `0x6A02AE` `setSomeDword5` / `0x6A02B6` `cameraRelated_usedByFields` : rôle
  (input AVSZ / normal ?).
- `0x6A035D` `setSomeDword(a4+0x2C)` : champ rempli avant `Gte_AVSZ4` (le bit de
  clip 8 lit `[a4+0x2C]` après l'appel).
- `0x6A03FC` `sub_45F4C0` / `0x6A041B` `sub_45F270` : étapes GTE sans arg
  (RotMul / projection ?) — rôle non prouvé ici.
- `a3` : garantie callers passent 0..31 (HW masque &0x1F de toute façon) —
  à confirmer côté `0x69FD3A` / `0x6CF0FA` / `0x6EB6DA` (3 wrappers clones
  0x46 octets, cf. callers.txt).
