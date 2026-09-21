# MagFX_SubmitFaceList_GteClipTextured_OT @ 0x6A4710

- Instr (live): 380 (1168 o, 0x6A4710-0x6A4B9F)
- Palier: 2+1
- Verdict: LIKELY - emetteur de faces du pipeline mag FX battle (3 callers sœurs gabarit 0x130) : boucle records stride 0x14 via curseur [a1+34h] compteur en tête (re-store @0x6A4B87) ; par record : Set3Pairs indices u16 pool [a1+4] @0x6A4785, camRelated_0, setSomeDword3(a1+44h) + test 0x60000 skip (0x6A47D2-E1), Gte_NCLIP @0x6A47E7 (jge, override bit 0x10 = draw both sides), AVSZ3, clipping bornes 0xA00/0x6C0 nibble rejet bits 1/2/4 (pkt+04/10/18) + 0x10/0x20/0x40 (pkt+0A/12/1A) ; paquet GPU dword 0x07000000 @0x6A4792 + OR 0x2000000 (bit0 a1+1C) / AND 0xFDFFFFFF (bit2) ; avancé pkt +0x28 si u16[a1+20h]|u16[a1+22h]==0 sinon +0x40 (0x6A498D-B63) ; 4 allocs OtNode24_PoolAllocLink @0x6A497A/AC9/AD0/B65 (ordre +20h, +28h, +00h relié 2e fois, +40h ou +00h si couleurs nulles) au bucket a2+4*(z sar cl) avec z=[a1+40h]+=[a1+18h] clamp >=0 (jns @0x6A48FC) ; packing CBA x2 (0x6A4A84-B7/6A4B16-53) : (b&F8 | FFFE2000) shl5 shl5 shl2 | (~w-1), sources edi+26h/24h/2Ah/28h et 2Eh/2Ch/32h/30h ; addition RVB a1+20h/22h, soustraction a1+30h/32h si >0xFF (cmp/jle signe) ; retour EAX = pkt avance (eax=ebp @0x6A4B8C)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A4710\nTYPE ; proposition: MagFX_SubmitFaceList_GteClipTextured_OT
- Notes parent: checks 5.6 OK : re-store curseur (0x6A4729/0x6A4B87), Set3Pairs (0x6A4785), jnz skip 0x60000 (0x6A47E1), NCLIP (0x6A47E7), mov ax,[ebx] clipping (0x6A482C), jns clamp z (0x6A48FC), lea bucket [eax+edx*4] (0x6A4928), 4x PoolAllocLink (0x6A497A/AC9/AD0/B65), jz avancé +0x28 (0x6A498D-B63), eax=ebp (0x6A4B8C), 3 callers sœurs gabarit 0x130 (callers.txt) ; C-R : bit1 clipping pkt+04 (c_a pkt+08 corrige), VIT leurre imm32 @0x6A496D

## C reconcilie

```c
/* ============================================================================
 * sub_6A4710 — c_reconciled (pipeline triple 2+1, campagne mag FX battle)
 * ============================================================================
 * Ground truth = live ASM (asm.asm @ 0x6A4710, 380 instr, 1168 o = 0x490),
 * PAS Hex-Rays (hexrays.c utilisé uniquement comme vérificateur).
 *
 * Plage      : 0x6A4710 .. 0x6A4B9F inclus
 * Type IDA   : int __cdecl(int, int, char, int)
 * Prototype  : unsigned int *__cdecl sub_6A4710(int a1, int a2, char a3,
 *                                               unsigned int *pkt);
 *              cdecl : args poussés droite -> gauche (arg_0..arg_8, pkt).
 *
 * Sauvegardes : sub esp,18h (locaux var_4..var_18) ; push ebp ; push esi ;
 *              push edi ; push ebx (TARDIF, 0x6A473F, après le jle early-exit
 *              0x6A4736) → le chemin 0x6A4B94 fait 3 pops, pas de pop ebx.
 * Retour      : eax = ebp = curseur paquets GPU avancé (full 32 bits,
 *              0x6A4B8C / 0x6A4B98 / 0x6A4B97). CONFIRMÉ (point 9).
 *
 * Rôles arguments (preuve = lectures [esp+base+arg_N]) :
 *   a1    : contexte FX battle (edi) — offsets cités inline
 *   a2    : base des buckets OT battle (arg_4) — slot = a2 + 4*(z >> a3)
 *   a3    : char, shift du sar du z (arg_8, 0x6A4910 `sar edx, cl`)
 *   pkt   : curseur paquets GPU de sortie (ebp, retourné)
 *
 * add esp (corrections cdecl, toutes adressées) :
 *   0x6A478A +0Ch  0x6A47D9 +04h  0x6A47FF +04h  0x6A4824 +0Ch
 *   0x6A48CB +04h  0x6A48F0 +0Ch  0x6A4983 +08h  0x6A4B01 +10h
 *   0x6A4B6E +08h  0x6A4B90/-9C +18h.
 *   camRelated_0 / Gte_NCLIP / Gte_AVSZ3 / sub_45F270 : 0 arg, aucun add esp.
 *
 * ============================================================================ */

#include <stddef.h>

/* ---- Externes : uniquement les callees vus dans asm.asm / callees.txt ---- */

/* E3a: 3 ptrs write 6 dwords 1CA8A10..1CA8A24. */
void GteState_Set3Pairs_1CA8A10(void *p0, void *p1, void *p2);
void camRelated_0(void);                       /* 0 arg @0x6A478D */
void setSomeDword3(void *p);                   /* arg = a1+0x44 @0x6A47CE */
void Gte_NCLIP(void);            /* -> dword_1CA8A70 ; clear 1CA92F8 */
void GteState_GetToPtr_1CA8A70(void **out);    /* *out = valeur dword_1CA8A70 */
void SetsomeDword(void *a, void *b, void *c);
void Gte_AVSZ3(void);            /* sum 3 * word_1CA92F0 >>12 ; clear 1CA92F8 */
void GteState_GetToPtr_1CA8A2C(void **out);    /* *out = valeur dword_1CA8A2C */
void GteState_StorePtr_1CA8A28(void *p);       /* dword_1CA8A28 = p (SETTER) */
void GteState_Set_1CA8A30(unsigned int v);     /* dword_1CA8A30 = v */
void sub_45F270(void);                         /* 0 arg @0x6A48E5 */
void GteState_GetToPtr_1CA8A68(void **out);    /* *out = valeur dword_1CA8A68 */
/* alloc OT node 0x18 ; base 0x1C48828 ; cursor 0x1CA8828 ; cap 0x60000 ;
 * insert OT. Ordre params cdecl : (void *p_ot, void *pkt). */
void OtNode24_PoolAllocLink(void *p_ot, void *pkt);

/* Constantes immédiates de l'ASM */
#define CONST_0x07000000   0x07000000u    /* *pkt initial (0x6A4792) */
#define CONST_UNK_2000000  0x2000000u     /* OR @0x6A47A6 / 0x6A4A5E / 0x6A4B0E */
#define CONST_MASK_E1000220 0xE1000220u   /* node #1 [1] (0x6A4973) */
/* 0x6A496D : l'ASM stocke l'ADRESSE du symbole IDA `VIT_0_STATUS_MASK?`
 * comme valeur du dword node[0] — leurre de nom ; valeur/section hors pack. */
extern char VIT_0_STATUS_MASK_[];

unsigned int *__cdecl sub_6A4710(int a1, int a2, char a3, unsigned int *pkt)
{
    char *ctx = (char *)a1;

    /* --- File de records (0x6A471E-0x6A472E) ---
     * [a1+0x34] = curseur (ptr). *curseur = count (testé jle SIGNÉ 0x6A4736).
     * Records à curseur+4, stride 0x14 = 5 dwords (0x6A4B75 add esi,14h). */
    unsigned int *hdr  = *(unsigned int **)(ctx + 0x34);
    int           count = *(int *)hdr;
    unsigned int *rec  = hdr + 1;               /* esi = ecx+4 (0x6A4723) */
    unsigned int *pool = *(unsigned int **)(ctx + 0x04); /* 6A4726, rechargé
                                                     chaque it. 0x6A4763 */

    /* Le curseur est STORÉ EN TÊTE, avant le early-exit (0x6A4729) ;
     * réinitialisé/avancé final à 0x6A4B87. */
    *(unsigned int **)(ctx + 0x34) = rec;

    if (count <= 0) {                           /* 0x6A4736 jle (signé) */
        *(unsigned int **)(ctx + 0x34) = rec;   /* 0x6A4B94 (store redondant) */
        return pkt;                             /* eax = ebp */
    }

    /* --- Curseurs parallèles à pkt (init 0x6A473C-0x6A475D) --- */
    unsigned int *c18 = pkt + 6;   /* pkt+0x18 (arg_0 home, 0x6A4740) */
    unsigned int *c10 = pkt + 4;   /* pkt+0x10 (var_14,   0x6A4747) */
    unsigned int *c04 = pkt + 1;   /* pkt+0x04 (var_18,   0x6A4751) */
    unsigned int *c08 = pkt + 2;   /* pkt+0x08 (var_10,   0x6A4755) */
    int counter = count;           /* var_4 = eax (0x6A4759) */

    for (;;) {                                              /* tête 0x6A4767 */
        unsigned short *u = (unsigned short *)rec;

        /* 0x6A4767-0x6A478A : 3 indices u16 de rec ([esi+4/6/8]) x4 dans
         * le pool de sommets [a1+4] ; pushs inverse → Set3Pairs
         * GAUCHE→DROITE = pool[u[2]], pool[u[3]], pool[u[4]]. */
        GteState_Set3Pairs_1CA8A10(&pool[u[2]], &pool[u[3]], &pool[u[4]]);
        camRelated_0();                          /* 0x6A478D, 0 arg */
        // UNCERTAIN 0x6A478D effets de bord exacts de camRelated_0.

        /* 0x6A4792-0x6A47B7 : entête paquet principal */
        pkt[0] = CONST_0x07000000;               /* 0x6A4792 */
        pkt[1] = rec[0];                         /* 0x6A4799 (via var_18=c04) */
        if (*(unsigned char *)(ctx + 0x1C) & 1)  /* 0x6A47A0 test al,1 */
            pkt[1] = rec[0] | CONST_UNK_2000000; /* 0x6A47A6 OR (bit0) */
        if (*(unsigned char *)(ctx + 0x1C) & 4)  /* 0x6A47AD test byte,4 */
            pkt[1] &= 0xFDFFFFFFu;               /* 0x6A47B3 AND (bit2) */

        /* 0x6A47B9-0x6A47CF */
        pkt[3] = rec[3];                         /* [esi+0Ch] 0x6A47BF */
        pkt[5] = rec[4];                         /* [esi+10h] 0x6A47C5 */
        pkt[7] = rec[2] >> 16;                   /* [esi+8] shr 10h 0x6A47CB */

        /* 0x6A47D2-0x6A47E1 : setSomeDword3(a1+0x44) puis test 0x60000 */
        setSomeDword3(ctx + 0x44);
        if (*(unsigned int *)(ctx + 0x44) & 0x60000u)
            goto skip_record;                    /* 0x6A47E1 jnz 0x6A4B71 */
        // UNCERTAIN 0x6A47D2 ce que setSomeDword3 écrit exactement dans
        //            [a1+0x44] (bits 17/18 testés masque 0x60000).

        /* 0x6A47E7-0x6A480A : NCLIP (cross product -> dword_1CA8A70) */
        Gte_NCLIP();
        GteState_GetToPtr_1CA8A70((void **)(ctx + 0x38)); /* *out = valeur 1CA8A70 */
        if (*(int *)(ctx + 0x38) < 0             /* 0x6A4804 jge SIGNÉ */
            && !(*(unsigned char *)(ctx + 0x1C) & 0x10))
            goto skip_record;                    /* 0x6A480A -> 0x6A4B71 */
        /* bit 0x10 de [a1+0x1C] = "draw both sides" : override du backface. */

        /* 0x6A4810-0x6A4824 : pushs c18,c10,c08 → SetsomeDword(c08,c10,c18) */
        SetsomeDword(c08, c10, c18);
        // UNCERTAIN 0x6A481F rôle des 3 curseurs passés à SetsomeDword.

        /* 0x6A4827-0x6A48BF : AVSZ3 + chaîne de clipping (nibble rejet) */
        Gte_AVSZ3();
        {
            unsigned int clip = 0;               /* var_C = 0 @0x6A47EF */
            /* MOTIF (jl signé PUIS cmp ax,0A00h / jle) sur mot 16 bits :
             * ≡ (u16)mot > 0xA00. Sources Exactes selon l'ASM :
             * bit1 ← var_18 = c04 (pkt+0x04)  @0x6A482C (ebx rechargé de
             *       var_18 à 0x6A475F, préservé par call convention) ;
             * bit2 ← var_14 = c10 (pkt+0x10)  @0x6A4845 ;
             * bit4 ← arg_0  = c18 (pkt+0x18)  @0x6A485A. */
            if (*(unsigned short *)c04 > 0xA00u) clip = 1;       /* 0x6A482C */
            if (*(unsigned short *)c10 > 0xA00u) clip |= 2;     /* 0x6A4845 */
            if (*(unsigned short *)c18 > 0xA00u) clip |= 4;     /* 0x6A485A */
            /* bornes Y : 0x6C0 sur u16 de pkt+0x0A / 0x12 / 0x1A */
            if (*(unsigned short *)((char *)pkt + 0x0A) > 0x6C0u) clip |= 0x10; /* 0x6A486F */
            if (*(unsigned short *)((char *)pkt + 0x12) > 0x6C0u) clip |= 0x20; /* 0x6A488E */
            if (*(unsigned short *)((char *)pkt + 0x1A) > 0x6C0u) clip |= 0x40; /* 0x6A48A0 */
            if ((clip &   7) ==   7) goto skip_record;          /* 0x6A48AD */
            if ((clip & 0x70) == 0x70) goto skip_record;        /* 0x6A48B9 */
        }

        /* 0x6A48BF-0x6A48F0 : GTE state + variante si flag bit6 (0x40) */
        GteState_GetToPtr_1CA8A2C((void **)(ctx + 0x40)); /* [a1+0x40] = VALEUR
                                                     dword_1CA8A2C (accu Z) */
        if (*(unsigned char *)(ctx + 0x1C) & 0x40) {   /* 0x6A48CE */
            GteState_StorePtr_1CA8A28(c04);            /* 0x6A48D7 SETTER */
            GteState_Set_1CA8A30(*(unsigned int *)(ctx + 0x0C)); /* 0x6A48E0 */
            sub_45F270();                              /* 0x6A48E5, 0 arg */
            GteState_GetToPtr_1CA8A68((void **)c04);   /* *c04 = val 1CA8A68 */
            // UNCERTAIN 0x6A48E5 rôle de sub_45F270 (MVMVA-like ?).
        }

        /* 0x6A48F3-0x6A4904 : Z accu = [a1+0x40] += [a1+0x18], clamp ≥ 0 */
        {
            int z = *(int *)(ctx + 0x40);        /* eax = [esi], esi=a1+0x40 */
            z += *(int *)(ctx + 0x18);           /* 0x6A48F8 add signé */
            *(int *)(ctx + 0x40) = z;            /* 0x6A48FA */
            if (z < 0) {                         /* 0x6A48FC jns skipping */
                *(int *)(ctx + 0x40) = 0;        /* 0x6A48FE */
                z = 0;
            }

            /* 0x6A4904-0x6A4928 : slot OT = a2 + 4*(z >> a3) — sar edx,cl
             * mais z ≥ 0 après clamp → sar == shr. */
            unsigned int *p_ot = a2 + (z >> (a3 & 0x1F));
            unsigned int *pktOld = pkt;          /* esi = ebp @0x6A490E */
            unsigned int *np1;                   /* eax = ebp AVANCÉ */
            unsigned int *np2;
            unsigned int *last;

            /* --- avance curseurs +0x28 (10 dwords) : 0x6A4916-0x6A495E --- */
            c08 += 10; c10 += 10; c18 += 10; c04 += 10;
            pkt   = pktOld + 10;                 /* ebp +=0x20 @0x6A4916, +8 @0x6A4966 */
            np1   = pktOld + 8;                  /* ancien pkt+0x20 @0x6A495C */

            /* 0x6A496D-0x6A497A : entête node #1 + alloc #1 */
            np1[0] = (unsigned int)VIT_0_STATUS_MASK_;  /* 0x6A496D offset IDA */
            np1[1] = CONST_MASK_E1000220;        /* 0x6A4973 0xE1000220 */
            OtNode24_PoolAllocLink(p_ot, np1);   /* 0x6A497A */
            // UNCERTAIN 0x6A496D valeur exacte stockée dans np1[0] (offset
            //            nommé VIT_0_STATUS_MASK?, probablement tag OT).

            /* 0x6A497F-0x6A4996 : w1 = u16[a1+0x20], w2 = u16[a1+0x22] ;
             * cond. paquet : (w1 | w2) == 0 → PAQUEt court +0x28 */
            {
                unsigned short w1 = *(unsigned short *)(ctx + 0x20);
                unsigned short w2 = *(unsigned short *)(ctx + 0x22);
                /* 0x6A4986 cx=ax ; 0x6A4989 or cx,[edi+22h] ; 0x6A498D jz */
                if ((w1 | w2) == 0)
                    goto final_alloc;            /* 0x6A4B63 alloc#4 = pktOld */

                if (w1 != 0) {                   /* 0x6A4996 jz 0x6A49E5 */
                    /* Addition couleur 1 : octets pktOld+0x0C / +0x14 / +0x1C
                     * (regs dl/eax/ecx sur bytes), + w1 (zero-extended).
                     * Si (r|g|b) > 0xFF  (cmp ebx,0FFh / jle SIGNÉ 0x6A49C1) :
                     * SOUSTRACTION [edi+0x30] sur les 3, sinon somme clippée
                     * par la troncature byte. Polarité exacte ASM. */
                    unsigned int r = *(unsigned char *)((char *)pktOld + 0x0C); /* 0x6A49A1 */
                    unsigned int g = *(unsigned char *)((char *)pktOld + 0x14); /* 0x6A49A6 */
                    unsigned int b = *(unsigned char *)((char *)pktOld + 0x1C); /* 0x6A499C */
                    unsigned char s1 = *(unsigned char *)(ctx + 0x30); /* 0x6A49C3 */
                    r += w1; g += w1; b += w1;   /* 0x6A49AF/0x6A49B1/0x6A49B3 */
                    if ((int)(r | g | b) > 0xFF) {
                        *(unsigned char *)((char *)pktOld + 0x0C) = (unsigned char)(r - s1); /* 0x6A49C3-C6 */
                        *(unsigned char *)((char *)pktOld + 0x14) = (unsigned char)(g - s1); /* 0x6A49C9-CE */
                        b -= s1;                 /* 0x6A49D4 */
                    } else {
                        *(unsigned char *)((char *)pktOld + 0x0C) = (unsigned char)r; /* 0x6A49D8 */
                        *(unsigned char *)((char *)pktOld + 0x14) = (unsigned char)g; /* 0x6A49DB */
                    }
                    *(unsigned char *)((char *)pktOld + 0x1C) = (unsigned char)b; /* 0x6A49E2 */
                }

                if (w2 != 0) {                   /* 0x6A49E5-0x6A49EC jz 0x6A4A3B */
                    /* Addition couleur 2 : octets pktOld+0x0D / +0x15 / +0x1D,
                     * w2 = u16[a1+0x22], pas = [edi+0x32]. Idem polarité. */
                    unsigned int r = *(unsigned char *)((char *)pktOld + 0x0D); /* 0x6A49F7 */
                    unsigned int g = *(unsigned char *)((char *)pktOld + 0x15); /* 0x6A49FC */
                    unsigned int b = *(unsigned char *)((char *)pktOld + 0x1D); /* 0x6A49F2 */
                    unsigned char s2 = *(unsigned char *)(ctx + 0x32); /* 0x6A4A1F/0x6A4A27 */
                    r += w2; g += w2; b += w2;   /* 0x6A4A05/07/09 */
                    if ((int)(r | g | b) > 0xFF) {
                        *(unsigned char *)((char *)pktOld + 0x0D) = (unsigned char)(r - s2); /* 0x6A4A19 */
                        *(unsigned char *)((char *)pktOld + 0x15) = (unsigned char)(g - s2); /* 0x6A4A22 */
                        b -= s2;                 /* 0x6A4A2A */
                    } else {
                        *(unsigned char *)((char *)pktOld + 0x0D) = (unsigned char)r; /* 0x6A4A2E */
                        *(unsigned char *)((char *)pktOld + 0x15) = (unsigned char)g; /* 0x6A4A31 */
                    }
                    *(unsigned char *)((char *)pktOld + 0x1D) = (unsigned char)b; /* 0x6A4A38 */
                }

                /* --- avance curseurs +0x0C (0x6A4A3B-0x6A4A68) --- */
                c08 += 3; c10 += 3; c18 += 3; c04 += 3;
                pkt  += 3;                       /* ebp = ancien+0x34 @0x6A4A52 */
                np2   = pktOld + 10;             /* ancien pkt+0x28 (eax @0x6A4A46) */

                /* --- Packing CBA #1 (0x6A4A79-0x6A4AB7, si bits a1+0x1C non
                 *     pris en compte ici : branches via lea [edi+24h] qui est
                 *     TOUJOURS non-nul, cf Hex-Rays artefact a1==-36) --- */
                {
                    unsigned int v;
                    v  = ((*(unsigned char *)(ctx + 0x26) & 0xF8)      /* 0x6A4A79 */
                          | 0xFFFE2000u) << 5;                         /* 0x6A4A8A/0x6A4A90 */
                    v |= (*(unsigned char *)(ctx + 0x24)) & 0xF8;      /* 0x6A4A84 */
                    v <<= 5;                                           /* 0x6A4A99 shl 5 */
                    v |= (~(unsigned int)(*(unsigned short *)(ctx + 0x2A) - 1)) & 0xF8; /* 0x6A4A9C */
                    v <<= 2;                                           /* 0x6A4AAB shl 2 */
                    v |= (((int)~(unsigned int)(*(unsigned short *)(ctx + 0x28) - 1)) >> 3) & 0x1F; /* 0x6A4AAE sar,3 0x6A4AB4 */
                    np2[0] = CONST_UNK_2000000;      /* [eax]   @0x6A4A5E */
                    np2[1] = v;                      /* [eax+4] @0x6A4ABF */
                    np2[2] = 0;                      /* [eax+8] @0x6A4AC2 */
                }
                OtNode24_PoolAllocLink(p_ot, np2);               /* alloc #2 @0x6A4AC9 */
                OtNode24_PoolAllocLink(p_ot, pktOld);            /* alloc #3 @0x6A4AD0 :
                        le paquet poly PRINCIPAL esi=pktOld relié une 2e fois */

                /* --- avance curseurs +0x0C (2e passe 0x6A4AF4-0x6A4AFC) --- */
                c08 += 3; c10 += 3; c18 += 3; c04 += 3;
                pkt  += 3;                       /* ebp = ancien+0x40 @0x6A4AF8 */

                /* --- Packing CBA #2 (0x6A4B16-0x6A4B53) ; test @0x6A4B08
                 *     sur lea [edi+2Ch] = adresse !=NULL → TOUJOURS exécuté
                 *     (Hex-Rays artefact a1==-44). Sources edi+2Eh/2Ch/32h/30h */
                {
                    unsigned int v;
                    v  = ((*(unsigned char *)(ctx + 0x2E) & 0xF8)      /* 0x6A4B16 */
                          | 0xFFFE2000u) << 5;                         /* 0x6A4B25/0x6A4B30 */
                    v |= (*(unsigned char *)(ctx + 0x2C)) & 0xF8;      /* 0x6A4B1B/0x6A4B25 */
                    v <<= 5;                                           /* 0x6A4B39 shl 5 */
                    v |= (~(unsigned int)(*(unsigned short *)(ctx + 0x32) - 1)) & 0xF8;
                    v <<= 2;                                           /* 0x6A4B47 shl 2 */
                    v |= (((int)~(unsigned int)(*(unsigned short *)(ctx + 0x30) - 1)) >> 3) & 0x1F; /* 0x6A4B4D sar,3 */
                    pkt[0] = CONST_UNK_2000000;      /* [esi]   @0x6A4B0E */
                    pkt[1] = v;                      /* [esi+4] @0x6A4B59 */
                    pkt[2] = 0;                      /* [esi+8] @0x6A4B5C */
                }
                last = pkt;                      /* esi = ancien+0x40 @0x6A4AE2 */
            }
        final_alloc:
            /* alloc #4 @0x6A4B65 : cible = pktOld (si w1|w2==0, esi jamais
             * déplacé — esi=pktOld @0x6A490E) OU le node #4 = (ancien+0x40)
             * si au moins un des deux mots addition RVB est non nul. */
            OtNode24_PoolAllocLink(p_ot, last);
        }

skip_record:
        /* 0x6A4B71-0x6A4B81 : record suivant, stride 0x14 (5 dwords) */
        rec += 5;                                /* esi += 14h @0x6A4B75 */
        if (--counter == 0)                      /* dec/jnz @0x6A4B78 */
            break;                               /* 0x6A4B87 */
    }

    /* 0x6A4B87-0x6A4B93 : store curseur final, retour eax = ebp avancé */
    *(unsigned int **)(ctx + 0x34) = rec;
    return pkt;
}
/* ============================================================================
 * Notes structurantes (faits ASM adressés, pas de verdict sémantique) :
 * - Pkt avance VARIABLE : +0x28 (10 dwords) si u16[a1+0x20]|u16[a1+0x22]==0
 *   (0x6A4986-0x6A498D), +0x40 (16 dwords) sinon. Point d'exclusion
 *   condition exacte @0x6A498D jz → alloc #4 sur pktOld et avancée = 0x28.
 * - 4 OtNode24_PoolAllocLink par itération max (ordre @0x6A497A / 0x6A4AC9 /
 *   0x6A4AD0 / 0x6A4B65) : np1 = ancien+0x20 (0x6A4966), np2 = ancien+0x28
 *   (0x6A4A46), pktOld (2e lien), dernier = ancien+0x40 OU ancien+0x00.
 * - Clamp du Z @0x6A48FC (jns) garantit z ≥ 0 → sar == shr pour le slot OT.
 *   Avec cl = a3 shift (arg_8), slot = a2 + 4*(z >> a3) @0x6A4928.
 * - Le store curseur @0x6A4729 est fait AVANT le test early-exit, et une
 *   fois après la boucle @0x6A4B87 (path complet) — même valeur.
 * - Divergence Hex-Rays : test/discussion sur adresses lea @0x6A4A71/0x6A4B08
 *   rendu `if (a1==-36)/(a1==-44)` → toujours non-null, PAS des conditions.
 * - Le bit 0x40 de [a1+0x1C] (0x6A48CE) sert à re-transformer (StorePtr/
 *   Set/sub_45F270), pas un masque de statut disjoncté de la doc.
 * - Le bit 0x10 = "draw both sides" (backface override @0x6A480A).
 * ============================================================================ */
```

## Analyse semantique

# Sémantique sub_6A4710 @ 0x6A4710 (réconciliation R)

- Rôle (1 phrase) : émetteur de faces (triangles) du pipeline mag FX battle : pour chaque entrée du flux de records pointé par le curseur [a1+0x34] (count en tête, records stride 0x14), transforme 3 sommets via l'état GTE (Set3Pairs), calcule back-face (NCLIP) et profondeur (AVSZ3), cull par bornes écran 0xA00/0x6C0, construit un paquet GPU 0x20 octets + 1 tag 8 octets + 2 paquets texturés 0x0C, module les couleurs, alloue 3–4 nœuds OT dans le bucket a2+4*(z>>a3), et retourne le curseur paquets avancé.

- Verdict : LIKELY consolidé.
  - A était seule voix de recon c/asm : **semantic_b.md et c_b.c sont ABSENTS du pack** — réconciliation exercée A-seule contre l'ASM ground truth (jamais de moyenne), aligné avec reconcile_notes.md.
  - Alignement fort : callees GTE/OT tous présents et documentés (OtNode24_PoolLink 0x45C7A0-base pool 0x1C48828/cap 0x60000 ; Gte_NCLIP 0x45EE10 ; Gte_AVSZ3 « verified »), 3 callers sœurs gabarit 0x130.
  - MAIS : wiki.md muet (échec qmd, 64 octets d'erreur), aucune-validation externe des encodages paquets (0x07000000 / 0xE1000220 / 0x2000000), UNCERTAIN résiduels sur 0x6A496D, 0x6A48E5, 0x6A478D, 0x6A47D2 → pas CERTAIN.

- Confiance : LIKELY (opcodes et contrôle-flux 100 % tranchés contre l'ASM ; valeur externe des tags GPU non confirmable hors IDB).

- Nom catalogue : aucun (sub_6A4710). Proposition markdown seul :
  **`MagFx_Battle_SubmitFaces_GteClip_Textured_OT`** (synthèse du « MagFX_SubmitFace_GteClip_Textured_OT » de A et du gabarit « MagFx_Battle_ » de B, B étant absent — tranche libre ; A nomme déjà le contenu exact).
  ≥2 preuves ASM indépendantes adressées :
  1. Chaîne GTE de transform/backface/profondeur : `call GteState_Set3Pairs_1CA8A10` @0x6A4785 → `call Gte_NCLIP` @0x6A47E7 → `call Gte_AVSZ3` @0x6A4827.
  2. 4 appels `call OtNode24_PoolAllocLink` par face @0x6A497A, 0x6A4AC9, 0x6A4AD0 (push esi=log pktOld @0x6A4ACE, 2e lien du même paquet), 0x6A4B65 → insértions OT.
  3. Paquets texturés CLUT/texpage : packing `(b&0xF8)|0xFFFE2000 shl5 …` @0x6A4A79–0x6A4AB7 et @0x6A4B16–0x6A4B53.

## In / Out / Effets

- In (cdecl, 4 arg poussés droite→gauche) :
  - a1 (edi, arg_0) : contexte FX. Champs : +0x04 pool d'indices sommets (×4), +0x0C v. GteState_Set_1CA8A30, +0x18 pas Z signé, +0x1C flags (bit0 OR 0x2000000, bit2 AND 0xFDFFFFFF, bit4 draw-both-sides NCLIP, bit6 matrice locale), +0x20/+0x22 add couleurs u16 (2 blocs ×3 octets), +0x24/+0x2C descripteurs texture (mot/pas clamp à +0x26/0x28/0x2A/0x2E/0x30/0x32), +0x34 curseur flux records, +0x38 recep NCLIP, +0x40/0x44 slots GTE/OT-val.
  - a2 (arg_4) : base des buckets OT (ebx = a2 + 4*(z>>a3) @0x6A4928 `lea ebx,[eax+edx*4]`).
  - a3 (arg_8, char) : shift du `sar edx, cl` @0x6A4910 (z ≥ 0 après clamp → sar ≡ shr).
  - pkt (ebp, arg ctype 4e) : curseur d'écriture paquets GPU.
- Out : RET EAX = ebp = curseur paquets avancé (largeur 32 bits, @0x6A4B8C et 0x6A4B98 early-exit).
- Effets :
  - [a1+0x34] avancé de count*0x14 + 4 (store @0x6A4729 en tête, re-store @0x6A4B87 / 0x6A4B94 ; `add esi, 14h` @0x6A4B75).
  - État GTE : 1CA8A10..1CA8A24 (Set3Pairs), 1CA8A70 (NCLIP), 1CA92F0/1CA92F8 (AVSZ3), 1CA8A28/1CA8A30 + sub_45F270 si bit6, getters 1CA8A2C/1CA8A68.
  - Paquets écrits par face : 0x20 octets à pkt (0x6A4792–0x6A47CF), tag 8 octets ([0]=adr VIT_0_STATUS_MASK? @0x6A496D, [4]=0xE1000220 @0x6A4973), 2 paquets 0x0C ([0]=0x2000000 @0x6A4A5E/0x6A4B0E, [+4]=packing, [+8]=0).
  - 3–4 nœuds OT (pool 0x1C48828) alloués et liés au bucket ; couleurs [esi+0x0C/0x14/0x1C] et +0x0D/0x15/0x1D modulées par u16[a1+0x20]/u16[a1+0x22], clamp par soustraction [a1+0x30]/[a1+0x32] si somme > 0xFF (@0x6A49A9–0x6A4A38 / 0x6A49E5–0x6A4A2C).

## Divergences tranchées (A seule ; B absent — tranchées contre l'ASM)

Aucune divergence A/B possible (semantic_b.md absent du pack). À la place, **A-vs-ASM/Hex-Rays** tranchées, chacune vérifiée ligne à ligne contre asm.asm :

1. **Bit1 du masque de clip : pkt+0x08 (c_a v1/Hex-Rays v40) vs pkt+0x04.**
   Tranché : **pkt+0x04**. Preuve : `mov ebx, [esp+var_18]` @0x6A475F puis `mov ax,[ebx]` @0x6A482C ; var_18 init = `lea ebx,[ebp+4]` @0x6A474B — c'est pkt+0x04, pas pkt+0x08 (var_10=ebp+8 est passé à SetsomeDword @0x6A4818, jamais relu pour le clip). c_a corrigé dans c_reconciled.c.
2. **Ordre des pushs GTE Set3Pairs.** Tranché : pushs pool[u4], pool[u3], pool[u2] (edx=u[esi+8] push @0x6A4776, edx=u[esi+6] push @0x6A4780, ecx=u[esi+4] push @0x6A4784) → ordre d'appel GAUCHE→DROITE = pool[u[2]], pool[u[3]], pool[u[4]] (cdecl). 
3. **NCLIP polarité.** Tranché : `jge` SIGNÉ @0x6A4804 (SF=OF) sur [a1+0x38] ; face conservée si valeur ≥ 0, culled si < 0 SAUF bit 0x10 de [a1+0x1C] (`test byte ptr [edi+1Ch], 10h` @0x6A4806 / `jz` @0x6A480A) = draw-both-sides. Autres over-seen : rejet aussi si [a1+0x44] & 0x60000 (`jnz` @0x6A47E1, AVANT NCLIP).
4. **Bornes clip.** Tranché : X-borne 0xA00 sur les 3 X u16 via fusion `jl test` + `cmp/jle` ≡ `(u16)x > 0xA00` (@0x6A482C–0x6A486A, bits 1/2/4) ; Y 0x6C0 sur pkt+0x0A/0x12/0x1A (@0x6A486F/0x6A488E/0x6A48A0, bits 0x10/0x20/0x40) ; rejet `(mask&7)==7` @0x6A48AD et `(mask&0x70)==0x70` @0x6A48B9 (`jz loc_6A4B71` les deux).
5. **Paquets 0x0C test adresse.** Tranché : `test ecx, ecx` / `test eax, eax` sur `lea` d'adresse (@0x6A4A71 / @0x6A4B08) = TOUJOURS non-nulle (lea d'adresse effective non-zero) → Hex-Rays rendait `if (a1==-36)` artefact ; les 2 paquets conditionnels (sur w1/w2 nuls) s'émettent SI [a1+0x24] / [a1+0x2C] secteur présent.
6. **sar ecx, 3** @0x6A4AB1 / 0x6A4B4D : opération ARITHMÉTIQUE (sar), Tranché contre le modelling Hex-Rays `>> 3` sur unsigned (équivalent sur bits 0–4, noté).
7. **Addition RVB / soustraction de clamp.** Tranché : addition de u16[a1+0x20] (bloc 1 : @0x6A49A9–0x6A49B3, w1) à 3 octets, test `(r|g|b) > 0xFF` via `cmp ebx, 0FFh` + `jle` SIGNÉ @0x6A49C1 ; alors SOUSTRACTION [edi+0x30] (et +0x32 bloc 2 @0x6A4A19) sur les 3 canaux ; 3e octet toujours écrit @0x6A49E2 / @0x6A4A38.
8. **Profondeur.** Tranché : [a1+0x40] += [a1+0x18] signé @0x6A48F8, clamp `mov dword ptr [esi],0` si négatif @0x6A48FE ; slot = `a2 + 4*(z >> a3)` @0x6A4928 `lea ebx,[eax+edx*4]`.
9. **Retour.** Tranché : eax = ebp (curseur paquets avancé) aux 2 sorties : @0x6A4B8C et @0x6A4B98 (ebp avance +0x28 si u16[a1+0x20]|u16[a1+0x22]==0 @0x6A4986–0x6A49860 (`jz loc_6A4B63` ici = branchement #4), sinon +0x40 cumulés via +0x20/+8/+0x0C/0x0C).

## Preuves ASM citées

1. 0x6A471E–0x6A4736 : `mov ecx,[edi+34h]` / `mov eax,[ecx]` / `jle loc_6A4B94` → count = dword tête du flux ; records à ecx+4 (@0x6A4723 `lea esi,[ecx+4]`), stride 0x14 @0x6A4B75 `add esi,14h`, décrément var_4 @0x6A4B78 + `jnz loc_6A475F` @0x6A4B81.
2. 0x6A4767–0x6A4785 : 3 indices u16 [esi+4/6/8] ×4 dans [a1+4] (@0x6A4726 `mov ecx,[edi+4]`), Set3Pairs → transforme 3 sommets par face.
3. 0x6A47E7 / 0x6A4827 : Gte_NCLIP puis Gte_AVSZ3 ; NCLIP signé `jge` @0x6A4804 avec override bit 0x10 @0x6A4806.
4. 0x6A482C–0x6A48B9 : chaîne de clip 0xA00/0x6C0 avec les bornes/rejets précédents.
5. 0x6A48F3–0x6A4928 : Z accu [a1+0x40]+=[a1+0x18] clamp ≥0, `sar edx,cl` (a3), `lea ebx,[eax+edx*4]` (a2) — bucket OT.
6. 0x6A496D–0x6A497A / 0x6A4ABF–0x6A4B65 : paquet tag 8 octets + 4 `call OtNode24_PoolAllocLink` (pool 0x1C48828).
7. 0x6A4A79–0x6A4AB7 / 0x6A4B16–0x6A4B53 : packing CLUT/texpage identique ×2 (et `dec/not/and 0F8h`, `shl 5`, `shl 2`, `sar 3 & 0x1F`).
8. Callers : 0x6570be (sub_657030, 0x130), 0x65c7de (sub_65C750, 0x130), 0x6a466e (sub_6A45E0, 0x130) — exactement les 3 xrefs du pack.

## Checks §5.6

- Callees cités ↔ callees.txt : Set3Pairs (6a4785), camRelated_0 (6a478d), setSomeDword3 (6a47d2), Gte_NCLIP (6a47e7), GetToPtr_1CA8A70 (6a47f8), SetsomeDword (6a481f), Gte_AVSZ3 (6a4827), GetToPtr_1CA8A2C (6a48c3), StorePtr_1CA8A28 (6a48d7), Set_1CA8A30 (6a48e0), sub_45F270 (6a48e5), GetToPtr_1CA8A68 (6a48eb), OtNode24_PoolAllocLink ×4 (6a497a/6a4ac9/6a4ad0/6a4b65) — tous présents, AUCUN library call inventé.
- Callers cités ↔ callers.txt : sub_657030 / sub_65C750 / sub_6A45E0 (3 xrefs, `more:false`). OK.
- Strides en nombres : records 0x14 (0x6A4B75) ; avance paquets par face cumulée +0x28/+0x40 (itérations 0x6A4916 +0x20 +0x6A4966 +8 / +0x6A4A52 +0xC / 0x6A4AF8 +0xC) ; offsets couleurs +0x0C/0x14/0x1C. Pas de stride Hex-Rays bizarre.
- Polarités : tous les sauts sur valeurs SIGNÉES sont `jge/jle/jl/jnz` comme l'ASM (0x6A4804 jge, 0x6A49C1 jle, 0x6A4873 jl, 0x6A4736 jle, 0x6A47E1 jnz, 0x6A47A2 jz, 0x6A48AD/B9 jz) ; shifts non signés notés shl/shr là où l'ASM est logique, sar là où arithmétique (0x6A4910/0x6A4AB1/0x6A4B1D). Le *leurre* VIT_0_STATUS_MASK? @0x6A496D est traité comme constante/tag OT (stocke l'ADRESSE du symbole, cf. leurre 0x6A1420 précédent), PAS comme un statut VIT.
- Largeur retour : RNE avec eax pleine largeur 32 bits = pointeur paquets (0x6A4B8C/0x6A4B98).
- Nom : `MagFx_Battle_SubmitFaces_GteClip_Textured_OT` ≥2 preuves ASM indépendantes adressées (ci-dessus).

## Questions ouvertes (non bloquantes)

- Valeur exacte sous le leurre IDA `VIT_0_STATUS_MASK?` @0x6A496D (valeur stockée = adresse du symbole IDA dans node[0] du paquet tag 8 octets — encodage OT FF8 non confirmable hors IDB).
- Rôle précis de sub_45F270 (@0x6A48E5, 0 arg, MVMVA-like), camRelated_0 (@0x6A478D), setSomeDword3(a1+0x44) (@0x6A47D2 ; masque 0x60000 teste bits 17/18), SetsomeDword (3 curseurs pkt+0x04/0x10/0x18).
- Sémantique des 2 descripteurs texture [a1+0x24] / [a1+0x2C] (prims nulles dans le* paquet si secteur absent = solo) — face avant/arrière ou 2 sous-primitives.
- Confirmable seulement si B (réconcilié) est réellement exécuté dans une future passe : le pack actuel ne le contient pas.

## IDBCOMMENT

Soumission des faces mag FX battle : transforme 3 sommets via GTE (Set3Pairs @6a4785), NCLIP backface @6a47e7 jge avec override bit 10h draw-both-sides, AVSZ3 @6a4827. Rejet si 3 sommets hors bornes ecran (0xA00 X, Y limite 0x6C0, masque bits 1/2/4+10/20/40 == 7/0x70). Paquet GPU 0x20 octets (0x07000000) + tag 8 octets + 2 paquets textures 0x0C CLUT/texpage, couleurs modulees par [a1+20h/22h] clamp via [a1+30h/32h] si >0xFF, 3-4 noeuds OT pool 0x1C48828 au bucket a2+4*(z sar a3), retour eax = curseur paquets avance. [semantic-triple 2026-09-21]

## Notes C-R

# reconcile_notes.md — sub_6A4710 @ 0x6A4710

Pipeline triple 2+1. **Un seul recon aveugle présent** : `c_a.c`. `c_b.c` est
ABSENT du pack (fichier non trouvé) → réconciliation = voix A seule contre
l'ASM ground truth (jamais de moyenne). `hexrays.c` = vérificateur.

Chaque point à trancher a été relu contre `asm.asm` (380 instr, 0x6A4710–0x6A4B9F).

## Divergences tranchées contre l'ASM

1. **Boucle records stride 0x14** — c_a OK. Tranché : `[a1+0x34]` = ptr
   (0x6A471E), `*ptr` = count testé `jle` SIGNE (0x6A4736), records à `ptr+4`
   (0x6A4723), stride 0x14 (0x6A4B75). Store curseur EN TÊTE (0x6A4729)
   avant early-exit, re-store final (0x6A4B87 / 0x6A4B94).

2. **GTE ordre** — c_a OK. Tranché : Set3Pairs (0x6A4785) avec indices u16 du
   record via pool `[a1+4]` (u[esi+4/6/8], x4) ; pushs → params
   GAUCHE→DROITE pool[u[2]],pool[u[3]],pool[u[4]] ; `camRelated_0` 0 arg
   (0x6A478D) ; `setSomeDword3(a1+0x44)` + test masque 0x60000
   (`jnz` 0x6A47E1 skip) ; `Gte_NCLIP` (0x6A47E7) ; `jge` SIGNE sur
   `[a1+0x38]` avec override bit 0x10 (0x6A480A) = draw both sides ;
   AVSZ3 (0x6A4827) APRÈS NCLIP.

3. **Clipping bornes / nibble rejet** — c_a **divergent** au détail :
   c_a lisaient bit1 depuis `c08` (pkt+0x08). L'ASM lit le 1er mot via
   `ebx` = `var_18` = **pkt+0x04** (0x6A482C ; ebx rechargé de var_18 à
   0x6A475F, callee-saved). Tranché : bit1 ← pkt+0x04 (c04), bit2 ← pkt+0x10
   (c10, 0x6A4845), bit4 ← pkt+0x18 (c18, 0x6A485A). Bornes 0xA00 / u16
   unsigned (union jl signé + cmp/jle ≡ u16 > 0xA00), Y 0x6C0 sur
   pkt+0x0A/0x12/0x1A (0x6A486F/88E/8A0). Reject `(mask & 7)==7` (0x6A48AD)
   et `(mask & 0x70)==0x70` (0x6A48B9). Hex-Rays était en désaccord
   indirect (bit1 ⟵ pkt+8 via v40) — **l'ASM gagne**.

4. **Paquet GPU / avancée variable** — c_a OK. Tranché :
   `pkt[0]=0x07000000` (0x6A4792) ; `pkt[1]=*rec` ; OR `0x2000000` si bit0
   de `[a1+0x1C]` (0x6A47A0-A6) ; AND `0xFDFFFFFF` si bit2 (0x6A47AD-B3) ;
   `pkt[3/5/7] = rec[3]/rec[4]/rec[2]>>16 (shr logique 0x6A47CB)` ;
   avancée +0x28 si `u16[a1+0x20]|u16[a1+0x22]==0` (0x6A4986-0x6A498D)
   sinon +0x40 — condition EXACTE confirmée (alloc #4 sur pktOld, esi déjà
   pktOld, avancée finale = ancien+0x28 ; eax retour cohérent).

5. **4 allocs OtNode24_PoolAllocLink** — c_a OK. Tranché : ordre
   0x6A497A (ancien+0x20), 0x6A4AC9 (ancien+0x28, np2), 0x6A4AD0
   (**pktOld relié une DEUXIÈME fois** — push esi/push ebx @0x6A4ACE-CF), puis
   0x6A4B65 : accès final = pktOld si w1|w2==0, sinon ancien+0x40 (node #3).
   6a "relié deux fois" dans le paquet : confirmé — c'est paquet poly
   principal alloué après le node np2, MAIS pktOld a déjà été alloué à
   0x6A497A (le 1er lien est np1, PAS pktOld). Correction ok.

6. **Profondeur** — c_a OK. Tranché : `[a1+0x40] += [a1+0x18]` signé
   (0x6A48F8), clamp 0 si <0 (jns @0x6A48FC / 0x6A48FE) ; slot = `a2 +
   4*(z sar a3)` (0x6A4910/0x6A4928 lea [eax+edx*4]).

7. **Packing CBA ×2** — c_a OK. Tranché : pattern exact
   `(b&0xF8)|0xFFFE2000` shl5, `or (a&0xF8)` shl5, `(~w-1)&0xF8`, shl2,
   `(int)~(w2-1) sar 3 & 0x1F` — bloc 1 : sources `[edi+26h]/[edi+24h]/
   u16[edi+2Ah]/u16[edi+28h]` (0x6A4A79-A84-A95-A95-AAE-AAB) ; bloc 2 :
   `[edi+2Eh]/[edi+2Ch]/[edi+32h]/[edi+30h]` (0x6A4B16-A35-44-4D).
   Le `>>3` final est `sar` (0x6A4AB1/0x6A4B4D) ; bits 0-4 ≡ shr (signe
   porté sur bits hauts) mais opération arithmétique notée.

8. **Addition RVB polarité** — c_a OK. Tranché : addition des 3 octets
   (pktOld+0x0C/0x14/0x1C) avec w1 = u16[a1+0x20] (bloc 1 : +0x0D/0x15/0x1D,
   w2 = u16[a1+0x22], 0x6A49F7-FC) ; si `(r|g|b) > 0xFF` (cmp `jle` signé
   0x6A49C1) ALORS soustraction `[edi+0x30]` (bloc 2 : `[edi+0x32]`)
   sur les 3 canaux, sinon somme tronquée byte. Octet 3
   (pktOld+0x1C/0x1D) toujours écrit à 0x6A49E2 / 0x6A4A38.

9. **Retour** — c_a OK. Tranché : `eax = ebp` (= pkt avancé) CONFIRMÉ aux
   3 sorties : 0x6A4B8C, 0x6A4B98 (early exit avec ebp inchangé), et
   ebp suit +0x28/+0x40 par itération (0x6A4916/0x6A4966/0x6A4A52/0x6A4AF8).

## Correction interne apportée à c_a

- **Chaîne de clipping** : `c08` → `c04` pour le bit1 (voir divergence n°3
  ci-dessus). Les registres/locaux du listing l'attestent (0x6A482C lit
  `[ebx]` où `ebx = var_18 = pkt+0x04`).
- Commentaires GetToPtr corrigés : `[a1+0x38]`/`[a1+0x40]` reçoivent la
  **VALEUR** des globals GTE (dword_1CA8A70 / dword_1CA8A2C), pas leurs
  adresses — c'est ce qui rend cohérent l'usage de `[a1+0x40]` comme
  accumulateur Z en 0x6A48F3.

## UNCERTAIN restants

- UNCERTAIN 0x6A496D : valeur exacte stockée dans np1[0] (offset IDA
  `VIT_0_STATUS_MASK?` — leurre de nom, probablement tag OT 8 octets).
- UNCERTAIN 0x6A48E5 : rôle exact de `sub_45F270` (0 arg, MVMVA-like ?).
- UNCERTAIN 0x6A478D : effets de bord exacts de `camRelated_0` (0 arg).
- UNCERTAIN 0x6A47D2 : contenu écrit par `setSomeDword3(a1+0x44)` ; le masque
  0x60000 teste les bits 17/18 de `[a1+0x44]`.
- UNCERTAIN 0x6A481F : rôles précis des 3 curseurs pkt+0x08/0x10/0x18 passés
  à `SetsomeDword`.
- Sémantique des tags `0x07000000` / `0xE1000220` / `0x2000000` (renderer
  FF8) non confirmable hors IDA/wiki.

## Divergences vs Hex-Rays

- **0x6A4A71 / 0x6A4B08** : `test ecx,ecx` porte sur l'ADRESSE lea
  `[edi+24h]` / `[edi+2Ch]` → **toujours non nulle**. Hex-Rays a rendu
  `if (a1 == -36)` / `if (a1 == -44)` (artefact). Tranché : les deux blocs
  de packing RVB s'exécutent TOUJOURS quand w1|w2 != 0.
- **Chaîne de clipping bit1** : Hex-Rays lit pkt+8 (v40) pour bit1 ; ASM lit
  pkt+0x04 (via ebx) → ASM gagne (c_a corrigé).
- Chaîne de clipping bornes : Hex-Rays rend les tests en unsigned pur
  ([WORD] > 0xA00u) — conforme à la FUSION jl signé + cmp 0xA00 ; note que
  le mot-signé négatif tombe aussi dans le rejet (u16 large > 0xA00).
- `sar ecx,3` @0x6A4AB1/0x6A4B4D : Hex-Rays modèle `>> 3` sur unsigned
  (bits 0-4 identiques) ; l'opération réelle est arithmétique (sar).
- Hex-Rays lit `[a1+32]` comme DWORD pour le branchement w1!=0 (0x6A4996) ;
  l'ASM teste `u16[a1+0x20]` (0x6A4980-0x6A4996) après OR `u16[a1+0x22]`
  (0x6A4989) — même sémantique sur struct alignée, mais la lecture à la
  source est **u16 x 2** ensuite `or` (0x6A4989).
- Hex-Rays cibles/paquets vz 0x24/0x2C nommage : (a1+24h)=0x24 →
  `[edi+0x24]` OK ; 0x2C conforme (a1+2Ch) OK.
- Comportement du skip si couleurs nulles : Hex-Rays gère `if (*(DWORD*)(a1+32))`
  + w1/w2 sub-tests ; ASM systématisé idem, Hex-Rays et ASM alignés ici.

## Anomalies pack

- `c_b.c` ABSENT (fichier non trouvé). Seule voix disponible : c_a.
- `wiki.md` minimal (64 octets), `globals.txt`/`callers.txt`/`callees.txt`
  présents mais non explorés en profondeur en dehors de la vérification des
  signatures (contrainte "aucun accès IDA").
- Aucun git, aucun rename, aucun accès IDA : chargé de concilié uniquement.
