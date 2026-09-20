# Battle_MagicFx212_RenderSkelRotXScaledFrame @ 0x6A12B0

- Instr (live): 285 (939 o, 0x6A12B0-0x6A165A)
- Palier: 2+1
- Verdict: LIKELY - rendu d'effet magique battle (2 callers code : stepper MAG_212 0x6A0DC0 @0x6A1069 et ticker 0x6A1660 @0x6A1D3F) : dims ceil (idiome and/sar @0x6A130F-56), matrice rotX Q12 (Mat3S16_MakeRotX 0x6A13A6) * MulQ12 (0x6A13B8) * ScaleByVec12 (0x6A1456) avec numerateur imm32 0x01000000 (VIT_0_STATUS_MASK leurre IDA @0x6A1420/43D), divisions trunc cdq+sub+sar ; rendu squelette optionnel (BattleSkeleton_BuildHierarchicalFK 0x6A153B sous byte_1D989BD&1, scratch 0x2C) ; packets GPU DrawEnv (Gpu_PackDrawEnvPacket 0x6A1485, env pingpong 0x1D969C8+(pp^1)*92) + ClipRect (0x6A15FD) + DrawOffsetE5 (0x6A163B) lies par 4 noeuds OtNode24_PoolAllocLink dans g_BattleOTBase+0x44, bump dword_2510258 en octets ; retour EAX = dernier node OT (0x6A164B)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A12B0\nTYPE ; proposition: Battle_MagicFx212_RenderSkelRotXScaledFrame
- Notes parent: checks 5.6 OK : Mat3S16_MakeRotX/MulQ12/ScaleByVec12 (0x6A13A6/B8/456), VIT leurre imm32 (0x6A1420/43D), Gpu_PackDrawEnvPacket (0x6A1485), FK squelette (0x6A153B), ClipRect (0x6A15FD), DrawOffsetE5 (0x6A163B), dernier PoolAllocLink + add esp,78h (0x6A164B-57), callers code x2 (0x6A1069 stepper / 0x6A1D3F ticker) ; INCIDENT : C-R lance en retard, push IDB deja fait au premier run (SKIP idempotent assume), livrable assemble au second run apres livraison C-R

## C reconcilie

```c
/* =============================================================================
 * c_reconciled.c — sub_6A12B0 (VA 0x6A12B0, 285 instr live, 939 o, .text)
 * Cellule C-R — réconciliation c_a × c_b contre l'ASM live (asm.asm = ground truth).
 * Prototype IDA : int __cdecl sub_6A12B0(__int16 *a1, __int16 *a2)
 * Retour live : EAX = pointeur du dernier OtNode24 alloué (retour de
 *   OtNode24_PoolAllocLink @0x6A164B). Hex-Rays le type OtNode24* — équivalent 32 bit.
 * Sauvegardes registres live : push ebx, ebp, esi, edi (6a12ba..6a12cf),
 *   poppés en épilogue 6a1653..6a1656 ; cadre sub esp,78h @6a12b0 /
 *   add esp,78h @6a1657.
 *
 * Points tranchés contre l'ASM (voir reconcile_notes.md pour les preuves adresées) :
 *   T1. Demi-divisions cdq;sub eax,edx;sar 1 = TRUNC (C `/2`), pas floor
 *       (@0x6A13C9-D0, 0x6A13F0-3, 0x6A14AD-B3, 0x6A14BB-BE).
 *   T2. Diviseurs unitaires @0x6A130F-56 : transcription LITTÉRALE
 *       q = x/d (trunc) ; if (q % d != 0) ++q — test sur le QUOTIENT,
 *       pas sur le reste de la division. L'étiquette « ceil » de c_a est un
 *       faux ami ; on garde la forme littérale de c_b/Hex-Rays.
 *   T3. Numérateur du vecteur d'échelle = imm32 0x01000000
 *       (mov eax,imm32 @0x6A1420 / 0x6A143D, symbole IDA « VIT_0_STATUS_MASK? »
 *       = leurre ; corroboration E5 @0x6A163B « or 01000000 »).
 *   T4. Bumps curseur dword_2510258 en OCTETS : 0x40 / 0x18 / 0x0C / 0x0C
 *       (@0x6A1462, 0x6A1589, 0x6A15EF, 0x6A162C).
 *
 * Familles : mag FX battle — callers sub_6A0DC0 (stepper MAG_212, xref
 * 0x6a1069) et sub_6A1660 (xref 0x6a1d3f).
 * ============================================================================= */

/* ---- callees (protos conformes aux pushes cdecl droite→gauche de l'ASM) ---- */
extern void FillWordPairStride2C_1D989B8(int arg0, int arg1);
/* 4 records [0x1D989B8,0x1D98A68) stride 0x2C : [p-0x26]=w(arg0), [p]=d(arg1) */
extern void sub_701270(int arg0, void *dst);              /* 0x701270 */
extern void sub_56C600(void *mat, int *vec, int *out);    /* ici in-place : out == vec */
extern void Mat3S16_MakeRotX_Q12(int angle_q12, void *m); /* m00=0x1000, m11=m22=cos, m12=sin, m21=-sin */
extern void Mat3S16_MulQ12_IntoArg0(void *dst, void *src);
extern void Mat3S16_ScaleByVec12(void *mat9, const int *vec3); /* 9 s16 * vec s32 >>12 in-place */
extern void Gpu_PackDrawEnvPacket(void *pkt, void *env);
extern int  OtNode24_PoolAllocLink(int *p_ot, void *pkt);      /* retour = noeud OT */
extern int  OtNode24_PoolAllocLink_Code1(int *p_ot, void *pkt);/* word[node+0x14]=1, sans copie RGB */
extern void Thunk_45E4D0(int *out_a, int *out_b);
extern void Call_Bs_ParseCamera(int arg0, int arg1);
extern void Field_readCaPre(void *mat);
extern void preCamReadVariables_Space(void *mat);
extern int  bs_modulo(int nbytes);                        /* bump dword_1D999C4 */
extern void BattleSkeleton_BuildHierarchicalFK(int root);
extern void WalkStride30_MatComposeInPlace(int root, void *mat);
extern int  RenderGeometry(void *geo, void *ctx, int *ot_base, int ot_shift, void *pkt);
extern void BattleScratch_Unwind(int nbytes);

/* ---- globals (globals.txt) -------------------------------------------------- */
extern int           dword_2510258;    /* curseur arena packets GPU (bumps en octets, T4) */
extern int           dword_251025C;
extern unsigned int  dword_1D989C0[];  /* arg0 RenderGeometry */
extern int           dword_1D989E4;
extern int           dword_1D98B3C;
extern unsigned char byte_1D989BD;     /* gate rendu squelette (test al,1 @0x6A14E2) */
extern unsigned char g_BattleFramePingPongIndex;
extern unsigned int  g_BattleOTBase;   /* + 0x44 = p_OT (add eax,44h @0x6A1490/55C/609/647) */
extern short         word_1D8E038;
extern unsigned short word_1D989BE;
extern unsigned char  unk_1D989D0[];   /* racine squelette, entries stride 0x30 depuis +0x20 */

/* Numérateur imm32 chargé par `mov eax, imm32` @0x6A1420 et @0x6A143D.
 * IDA l'affiche « offset VIT_0_STATUS_MASK? » — leurre nommé, valeur = 0x01000000
 * (T3 ; corroboration : Gpu_PackOtTag1_DrawOffsetE5 @0x6A163B « or 01000000 »). */
#define SCALE_NUMERATOR_IMM32 0x01000000

/* =============================================================================
 * C réconcilié
 * ============================================================================= */
int __cdecl sub_6A12B0(__int16 *a1, __int16 *a2)
{
    int zero = 0;                        /* ebx, zéro du début à la fin (xor ebx,ebx @0x6A12CA) */

    /* ---- B1 (0x6A12B3..0x6A12F4) : lecture dims + FillWordPairStride2C ---- */
    int v2  = -(__int16)a2[0];           /* ebp    : neg @0x6A12C4, -word[a2+0x00] */
    int w6  = (__int16)a2[3];            /* var_74 : movsx @0x6A12C0, word[a2+0x06] */
    int v18 = -(__int16)a2[2];           /* var_70 : neg @0x6A12D8, -word[a2+0x04] */
    int v19 = (__int16)a2[5];            /* var_6C : movsx @0x6A12D4, word[a2+0x0A] */
    int v20 = w6 + v2;                   /* var_68 : lea esi,[ecx+ebp] @0x6A12CC */
    int v21 = v19 + v18;                 /* var_64 : lea edi,[eax+ecx] @0x6A12DC */
    /* UNCERTAIN 0x6A12BD sémantique des champs a2 +0x00/+0x04/+0x06/+0x0A
     * (offsets certains, rôle rect/viewport hypothétique — pour A/V/R). */

    unsigned short v25 = 0x100;          /* var_56 : 256 @0x6A12FC */
    unsigned short v27 = 0x100;          /* var_52 : 256 @0x6A1301 */
    unsigned short v24 = 0x2C0;          /* var_58 : 704 @0x6A1308 */
    unsigned short v26 = 0x80;           /* var_54 : 128 @0x6A1313 */

    FillWordPairStride2C_1D989B8(0, 0);  /* push ebx,ebx @0x6A12DA-DB ; add esp,8 @0x6A12F9 */

    /* ---- B2 (0x6A130F..0x6A1356) : diviseurs unitaires (T2, forme littérale) ----
     * 0x6A130F-29 : cdq; and edx,7Fh; add; sar 7  = x/128 (trunc, idiome MSVC 2^n signé)
     * 0x6A132E-41 : and 8000007Fh; jns; dec; or FFFFFF80h; inc; jz; inc = q%128 (trunc); si !=0 ++q */
    int v6 = v20 / 128;                  /* esi */
    if (v6 % 128 != 0) ++v6;
    int v7 = v21 / 256;                  /* edi, masque 0xFF / sar 8 @0x6A1321-30 */
    if (v7 % 256 != 0) ++v7;
    /* UNCERTAIN 0x6A130F intention source (test sur quotient, pas sur reste) :
     * la transcription est exacte, la sémantique voulue (ceil ? round-up ?) non
     * prouvée ici — pour A/V/R. v6/v7 servent de DIVISEURS plus bas. */

    /* ---- B3 (0x6A1357..0x6A1397) : vecteur {x,0,y} + matrice de base ---- */
    int v30[2];                          /* var_2C/var_28 */
    int v31;                             /* var_24 — contigu à v30 (vec 3 dwords) */
    v30[1] = 0;                          /* var_28 = ebx @0x6A135E */
    v30[0] = -((__int16)a1[0] / v6);     /* movsx [ecx] @0x6A1362; cdq; idiv esi @0x6A1366; neg @0x6A1368 */
    v31    = (__int16)a1[2] / v7;        /* movsx [ecx+4] @0x6A136E; cdq; idiv edi @0x6A1373; store var_24 @0x6A137F */
    /* TRUNC (T1) : idiv = division C arrondie vers zéro. */

    int v29[5];                          /* var_40 : buffer 20 o de sub_701270 */
    sub_701270(0x800, v29);              /* push &var_40 @0x6A1379, push 800h @0x6A137A ; arg0=0x800 arg1=&var_40 */
    sub_56C600(v29, v30, v30);           /* pushes 6A1390/95/96 : arg0=&var_40, arg1=arg2=&var_30 (in-place) */

    /* ---- B4 (0x6A139C..0x6A1456) : rotX(-1024 Q12) → Mul → translation → scale ---- */
    int v32[8];                          /* var_20 : 5 dwords mat + 3 dwords translation */
    Mat3S16_MakeRotX_Q12(-1024, v32);    /* push &var_20 @0x6A13A0, push FFFFFFC00h @0x6A13A1 */
    Mat3S16_MulQ12_IntoArg0(v32, v29);   /* pushes 6A13B6/B7 : arg0=&var_20 (dst), arg1=&var_40 */

    /* Translation (T1 : cdq;sub;sar 1 = trunc/2, puis idiv = trunc) */
    v32[5] = v30[0] + (((v2 - w6) / 2) / v6);   /* var_C  @0x6A13BD-D5 : ebp-w6; cdq;sub;sar 1; idiv esi; add var_2C */
    v32[6] = v31 - (((v18 - v19) / 2) / v7);    /* var_8  @0x6A13E3-406 : var_70-var_6C; /2 trunc; idiv edi; sub ecx,eax */
    v32[7] = (int)word_1D8E038;                 /* var_4  @0x6A13F8 : movsx word_1D8E038 */

    /* Vecteur d'échelle v28 (var_50/4C/48) — T3/T4.
     * shl eax,0Ch = décalage LOGIQUE (0x6A1418 / 0x6A1435) ; idiv v26/v27
     * (movsx var_54 @0x6A1413, movsx var_52 @0x6A1428) ; puis mov eax,imm32;
     * cdq; idiv ecx (@0x6A1420-26 / 0x6A143D-43). */
    int v28[3];
    v28[1] = 0;                                          /* var_4C = ebx @0x6A13CC */
    v28[0] = SCALE_NUMERATOR_IMM32 / ((int)(v20 << 12) / (int)v26);   /* var_50 @0x6A142D */
    v28[2] = SCALE_NUMERATOR_IMM32 / ((int)(v21 << 12) / (int)v27);   /* var_48 @0x6A144A */
    Mat3S16_ScaleByVec12(v32, v28);      /* push &var_50 @0x6A1449, push &var_20 @0x6A1455 */

    /* ---- B5 (0x6A145B..0x6A1499) : packet DrawEnv 0x40 o + noeud OT ---- */
    int pkt0 = dword_2510258;            /* esi @0x6A145B */
    dword_2510258 = pkt0 + 0x40;         /* add eax,40h @0x6A1462 (OCTETS, T4) */
    {
        int idx = (unsigned char)g_BattleFramePingPongIndex ^ 1;   /* @0x6A146C-71 */
        /* 0x6A1474-7C : ecx=idx*3; shl 3 (=*24); sub eax (=*23) ; edx=1D969C8+ecx*4 */
        void *env = (void *)(0x1D969C8 + 92 * idx);
        Gpu_PackDrawEnvPacket((void *)pkt0, env);   /* push env @0x6A1483, push pkt @0x6A1484 */
    }
    OtNode24_PoolAllocLink((int *)(g_BattleOTBase + 0x44), (void *)pkt0);
        /* add eax,44h @0x6A1490 ; push pkt @0x6A148F, push p_ot @0x6A1493 ; EAX ignoré */

    /* ---- B6 (0x6A1499..0x6A14E4) : ctx caméra + ParseCamera + readCaPre ---- */
    int v22, v23;                        /* var_60 / var_5C */
    Thunk_45E4D0(&v23, &v22);            /* push &var_60 @0x6A14A1, push &var_5C @0x6A14A2 : arg0=&var_5C, arg1=&var_60 */

    /* 0x6A14A8-B3 : movsx var_52; cdq;sub;sar 1 = 256/2 trunc = 128 (T1)
     * 0x6A14B6-BE : movsx var_54; cdq;sub;sar 1 = 128/2 trunc = 64 */
    Call_Bs_ParseCamera(64, 128);        /* push 64 @0x6A14B5, push 128 @0x6A14C0 */
    Field_readCaPre(v32);                /* push &var_20 @0x6A14CA */
    preCamReadVariables_Space(v32);      /* push &var_20 @0x6A14D4 ; add esp,10h @0x6A14DF */

    /* ---- B7 (0x6A14DA..0x6A1579) : rendu squelette conditionnel ---- */
    if ((byte_1D989BD & 1) != 0)         /* mov al,byte_1D989BD @0x6A14DA; test al,1 @0x6A14E2; jz 0x6A157C */
    {
        int ctx = bs_modulo(0x2C);       /* push 2Ch @0x6A14EA ; call @0x6A14EC ; esi */
        *(unsigned short *)(ctx + 0x14) = 0;         /* bx  @0x6A14F8 */
        *(unsigned short *)(ctx + 0x16) = 0;         /* bx  @0x6A14FC */
        *(unsigned short *)(ctx + 0x18) = 0x140;     /* 320 @0x6A1500 */
        *(unsigned short *)(ctx + 0x1A) = 0x0D8;     /* 216 @0x6A1506 */
        *(unsigned short *)(ctx + 0x24) = word_1D989BE;  /* mov dx,word_1D989BE @0x6A150C ; store @0x6A1513 */
        *(int           *)(ctx + 0x1C) = dword_1D989E4;  /* @0x6A1517-1C */
        *(int           *)(ctx + 0x04) = dword_1D98B3C;  /* @0x6A151F-25 */
        *(int           *)(ctx + 0x20) = -1;             /* FFFFFFFFh @0x6A1528 */
        *(int           *)(ctx + 0x28) = zero;           /* ebx @0x6A152F */
        *(int           *)(ctx + 0x10) = dword_251025C;  /* @0x6A1532-38 */
        /* NB : push offset unk_1D989D0 @0x6A14F3 traverse les stores ci-dessus
         * et sert d'argument au call @0x6A153B (stack discipline cdecl). */
        BattleSkeleton_BuildHierarchicalFK((int)unk_1D989D0);
        WalkStride30_MatComposeInPlace((int)unk_1D989D0, v32);
            /* push &var_20 @0x6A1544, push unk_1D989D0 @0x6A1545 : arg0=root, arg1=mat */
        dword_2510258 = RenderGeometry(dword_1D989C0, (void *)ctx,
                                       (int *)(g_BattleOTBase + 0x44), 0x10,
                                       (void *)dword_2510258);
            /* pushes 6A155B(packet)/5F(10h)/61(ot_base)/62(ctx)/63(geo) ; ret→dword_2510258 @0x6A156F */
        BattleScratch_Unwind(0x2C);      /* push 2Ch @0x6A156D ; add esp,28h @0x6A1579 */
    }

    /* ---- B8 (0x6A157C..0x6A15E8) : primitive 0x05 (24 o) + noeud Code1 ---- */
    {
        unsigned char *p = (unsigned char *)dword_2510258;   /* eax @0x6A157C */
        dword_2510258 += 0x18;           /* add ecx,18h @0x6A1589 (OCTETS, T4) */
        /* mots d'abord (@0x6A1597-6A15B6), puis bytes +4/+5/+6 (@0x6A15B7-BF),
         * puis dword +0 (@0x6A15C0) et byte +7 (@0x6A15C6) — ordre exact : */
        *(unsigned short *)(p + 0x08) = 0;   /* bx */
        *(unsigned short *)(p + 0x0A) = 0;   /* bx */
        *(unsigned short *)(p + 0x0C) = 0x80;    /* dx = 128 */
        *(unsigned short *)(p + 0x0E) = 0;   /* bx */
        *(unsigned short *)(p + 0x10) = 0;   /* bx */
        *(unsigned short *)(p + 0x12) = 0x100;   /* cx = 256 */
        *(unsigned short *)(p + 0x14) = 0x80;    /* dx */
        *(unsigned short *)(p + 0x16) = 0x100;   /* cx */
        *(unsigned char  *)(p + 0x04) = 0;   /* bl */
        *(unsigned char  *)(p + 0x05) = 0;   /* bl */
        *(unsigned char  *)(p + 0x06) = 0;   /* bl */
        *(unsigned int   *)(p + 0x00) = 0x05000000;   /* dword @0x6A15C0 */
        *(unsigned char  *)(p + 0x07) = 0x28;         /* 40 @0x6A15C6 */
        OtNode24_PoolAllocLink_Code1((int *)(g_BattleOTBase + 0x44), p);
            /* push p @0x6A15CA, push p_ot @0x6A15D3 */
    }
    Call_Bs_ParseCamera(v23, v22);       /* push var_60 @0x6A15E1, push var_5C @0x6A15E2 : arg0=var_5C, arg1=var_60 */

    /* ---- B9 (0x6A15E8..0x6A1612) : ClipRect 0x0C o + noeud OT ---- */
    {
        int pkt2 = dword_2510258;        /* esi @0x6A15E8 */
        dword_2510258 = pkt2 + 0x0C;     /* add eax,0Ch @0x6A15EF (OCTETS, T4) */
        /* rect 4 mots : &var_58 = {0x2C0, 0x100, 0x80, 0x100} */
        Gpu_PackClipRectPacket((void *)pkt2, &v24);   /* push &var_58 @0x6A15FB, push pkt @0x6A15FC */
        OtNode24_PoolAllocLink((int *)(g_BattleOTBase + 0x44), (void *)pkt2);
            /* push pkt @0x6A1608, push p_ot @0x6A160C ; EAX ignoré */
    }

    /* ---- B10 (0x6A1612..0x6A165A) : DrawOffset E5 0x0C o + noeud OT = retour ---- */
    {
        unsigned short xy[2];            /* var_76/var_72 */
        int pkt3 = dword_2510258;        /* esi @0x6A1621 */
        dword_2510258 = pkt3 + 0x0C;     /* add eax,0Ch @0x6A162C (OCTETS, T4) */
        xy[1] = v25;                     /* var_56 (0x100) → var_76 @0x6A161C, AVANT le bump */
        xy[0] = v24;                     /* var_58 (0x2C0) → @0x6A1631, après les pushes */
        Gpu_PackOtTag1_DrawOffsetE5((void *)pkt3, xy);   /* push xy @0x6A162F, push pkt @0x6A1630 */
        /* add esp,30h @0x6A1650 ; pop edi,esi,ebp,ebx ; add esp,78h @0x6A1657 */
        return OtNode24_PoolAllocLink((int *)(g_BattleOTBase + 0x44), (void *)pkt3);
            /* push pkt @0x6A1646, push p_ot @0x6A164A ; EAX = noeud = retour fonction @0x6A164B */
    }
}

/* =============================================================================
 * Lots add esp vérifiés (aucun callee ne nettoie partiellement)
 *   0x6A12F9  add esp,8    → FillWordPairStride2C_1D989B8 (2 args)
 *   0x6A14B0  add esp,44h  → sub_701270(8) + sub_56C600(12) + MakeRotX(8) +
 *                             Mul(8) + Scale(8) + DrawEnv(8) + PoolAlloc(8) +
 *                             Thunk(8) = 68 = 0x44 (ParseCamera suivant exclu)
 *   0x6A14DF  add esp,10h  → Call_Bs_ParseCamera(8) + Field_readCaPre(4) +
 *                             preCamReadVariables_Space(4)
 *   0x6A1579  add esp,28h  → bs_modulo(4) + BuildHierarchicalFK(4, push
 *                             0x6A14F3) + WalkStride30(8) + RenderGeometry(0x14)
 *                             + Unwind(4) = 40 = 0x28
 *   0x6A1650  add esp,30h  → Code1(8) + ParseCamera(8) + ClipRect(8) +
 *                             PoolAlloc(8) + E5(8) + PoolAlloc(8) = 48 = 0x30
 *   0x6A1657  add esp,78h  → cadre
 * ============================================================================= */
/* UNCERTAIN 0x6A12EF effet de bord exact de FillWordPairStride2C_1D989B8(0,0)
 *   (mécanique 4 records stride 0x2C prouvée par lot E3a, rôle non caractérisé).
 * UNCERTAIN 0x6A137A signification de l'argument 0x800 de sub_701270.
 * UNCERTAIN 0x6A1420 imm32 0x01000000 : valeur fournie par le brief + corroborée
 *   par le motif E5 @0x6A163B ; pas de relecture ida_dump_bytes possible dans
 *   cette cellule (accès IDA interdit).
 * UNCERTAIN 0x6A164B type retour exact (int vs OtNode24*) — largeur 32 bit prouvée.
 * UNCERTAIN 0x6A12BD rôles des champs de a1/a2 (mots lus : a1[0], a1[2] ;
 *   a2[0], a2[2], a2[3], a2[5]). */
```

## Analyse semantique

# Sémantique sub_6A12B0 @ 0x6A12B0 (réconciliation R)

- **Rôle (1 phrase)** : construit une transformée écran→battle (matrice rotX Q12 -0x400 × échelle inverse des dims d'une boîte arg_4, offsets normalisés depuis arg_0), rend le squelette battle conditionnel, puis pousse 4 groupes de packets GPU (DrawEnv, primitive 0x05/0x18 octets, ClipRect E3/E4, DrawOffset E5) dans l'OT battle `g_BattleOTBase+0x44` en bumpant le curseur `dword_2510258`.
- **Verdict : LIKELY consolidé** — l'ASM, Hex-Rays, c_a, c_b et le caller MAG_212 convergent sur tout le flux, mais `wiki.md` est vide (échec qmd) : l'alignement wiki exigé pour CERTAIN n'est pas prouvable.
- **Confiance : LIKELY**

## Nom proposé (markdown seul, PAS de rename) — `Battle_MagicFx212_RenderSkelRotXScaledFrame`

Synthèse A (`MagFx_RenderSkelRotX_ScaledFrame`) ∪ B (`Battle_MagicFx212_RenderTransformedSkeleton`). ≥2 preuves ASM indépendantes adressées :
1. **Portée battle + branchement magic FX** : callee depuis le stepper MAG_212 `sub_6A0DC0` (xref 0x6a1069, callers.txt), plus un second caller `sub_6A1660` (0x6a1d3f) ; insertion GPU dans `g_BattleOTBase+0x44` (0x6a1490 `add eax,44h` répété 4×) — pas un rendu field/world.
2. **Squelette + rotX** : 0x6a13a6 `Mat3S16_MakeRotX_Q12` (angle 0xFFFFFC00), 0x6a153b `BattleSkeleton_BuildHierarchicalFK`, 0x6a154a `WalkStride30_MatComposeInPlace`, 0x6a1568 `RenderGeometry` — le rendu de squelette transformé est réel mais **conditionnel** (byte_1D989BD & 1), d'où ni "RenderSkel*" seul (A) ni "RenderTransformedSkeleton" seul (B).
3. **Échelle inverse** : 0x6a1420/0x6a1442 imm32 `b8 00 00 00 01` = 0x01000000 ÷ ((dim<<0xC)/div) = Q12 de div/dim (leurre IDA "VIT_0_STATUS_MASK?").

Alternatives refusées : `BattleSkeleton_SystemRender` (trop générique, ignore la voie packets) ; `MagFx_RenderSkelRotX_ScaledFrame` (oubli de la chaîne DrawEnv/ClipRect/E5 qui est la moitié de la fonction) ; `Battle_MagicFx212_RenderTransformedSkeleton` (sous-décrit les packets, la moitié la plus longue).

## In / Out / Effets

**In**
- `arg_0` (__int16*, relu 0x6a1357) : mots signés `[+0]` et `[+4]` (`movsx`, 0x6a1362/0x6a136e) divisés par les diviseurs `esi`/`edi` → offsets normalisés (négation du premier, 0x6a1368).
- `arg_4` (__int16*, relu 0x6a12b3) : boîte/rect {`w+0`, `-w+2`, `w+3`→var_74 @+6, `w+5`→var_19 @+0xA} ; dims `esi = w[+6]-w[+0]` (0x6a12cc), `edi = w[+0xA]-w[+4]` (0x6a12dc), arrondies ceil signées ×0x80 / ×0x100 (0x6a130f–0x6a1356) puis réutilisées comme diviseurs.
- Globals lues : `byte_1D989BD` (&1), `word_1D8E038`, `word_1D989BE`, `dword_1D989C0`, `dword_1D989E4`, `dword_1D98B3C`, `dword_251025C`, `g_BattleFramePingPongIndex`, `g_BattleOTBase`.

**Out / Effets**
- **Retour EAX 32 bits** = pointeur du nœud OT retourné par le dernier `OtNode24_PoolAllocLink` (0x6a164b → 0x6a165a retn direct). Convention callee nettoyée (`add esp,78h; retn` — stdcall-like, PAS cdecl ; les args restent poussés par le caller, ce que l'épilogue confirme).
- Bumps `dword_2510258` **en octets** : 0x40 (0x6a1462, DrawEnv), 0x18 (0x6a1589, packet 0x05), 0xC (0x6a15ef, ClipRect), 0xC (0x6a162c, E5) ;+ réécriture par le retour de `RenderGeometry` (0x6a156f) dans la branche squelette.
- DrawEnv sélectionné par pingpong : `0x1D969C8 + (idx^1)*92` (0x6a146c–0x6a147c : `lea ecx,[eax*2+eax]`; `shl 3`; `sub ecx,eax` = ×23 ; `lea edx,[ecx*4]` = ×92), packet 0x40, `Gpu_PackDrawEnvPacket` 0x6a1485.
- Packets chartés : primitive dword 0x05000000 + byte 0x28, 0x18 octets, nœud `_Code1` (0x6a15c0/0x6a15d4) ; ClipRect rect {0x2C0,0x100,0x80,0x100} (&var_58, 0x6a15fd) ; DrawOffset E5 xy {0x2C0,0x100} via var_76/xy (0x6a1631, 0x6a163b).
- 4 nœuds OT liés à `g_BattleOTBase+0x44` (0x6a1494, 0x6a15d4 `_Code1`, 0x6a160d, 0x6a164b).
- Branche squelette (byte_1D989BD & 1, 0x6a14e2–0x6a14e4) : scratch 0x2C `bs_modulo` (0x6a14ec), ctx rempli ([+0x18]=0x140, [+0x1A]=0xD8, [+0x20]=-1, dword_1D989E4/1D98B3C/251025C/word_1D989BE), FK + composition + `RenderGeometry(ot_shift=0x10)`, `BattleScratch_Unwind(0x2C)` (0x6a1574).
- Caméra : `Thunk_45E4D0` → `Call_Bs_ParseCamera(64,128)` (0x6a14c1, 0x6a15e3) + `Field_readCaPre` + `preCamReadVariables_Space` (0x6a14cb/0x6a14d5).
- Matrice : `sub_701270(0x800)` + `sub_56C600` (0x6a1383/0x6a1397) → rotX(-0x400) + `Mat3S16_MulQ12_IntoArg0` (0x6a13a6/0x6a13b8) + translation {var_C, var_8, word_1D8E038} (0x6a13d0–0x6a1414) + `Mat3S16_ScaleByVec12` vec {0x01000000/((esi<<0xC)/0x80), 0, 0x01000000/((edi<<0xC)/0x100)} (0x6a1418–0x6a1456).
- `FillWordPairStride2C_1D989B8(0,0)` (0x6a12ef) : 4 records stride 0x2C @0x1D989B8 zeroisés.

## Divergences A/B tranchées (une par une, preuve ASM adresée)

1. **Retour EAX** — A : « int = dword_2510258 post-update » ; B : « pointeur du dernier nœud OT ». **Tranché : B.** La dernière écriture d'EAX avant `retn` (0x6a165a) est le retour de `OtNode24_PoolAllocLink` à 0x6a164b ; aucun `mov eax, dword_2510258` n'existe après (dword_2510258 est re-bumpé à 0x6a162c–0x6a1636 mais EAX est écrasé par le call suivant).
2. **Numérateur d'échelle** — A : `0x01000000` (implicitement, "leurre") ; B : imm inconnu (c_b UNCERTAIN, c_a dit 0xFFFFF, brief orchestrator dit 0xFFFFF). **Tranché : 0x01000000 (1<<24)** — lecture live `6a1420: b8 00 00 00 01` et `6a143e` idem. c_a/brief en 0xFFFFF sont faux : l'opcode `mov eax, imm32` puis `cdq` signe un numérateur positif 1<<24, qui donne scale_Q12 = (1<<12)·div/dim — arithmétique Q12 exacte (le 0xFFFFF donnerait un facteur 16× trop petit, incohérent avec ScaleByVec12 `>>12`).
3. **Arrondi des divisions** — brief « floor cdq+sub+sar » ; c_b : trunc. **Tranché : trunc (vers zéro)** — `cdq; sub eax,edx; sar 1` (0x6a13c9–0x6a13d0) : x=-5 → (-5+1)>>1 = -2 = trunc(-2.5), pas floor (-3). Les deux idiomes coexistent : idiv purs = trunc (C `/`), les blocs and/sar 0x6a130f–0x6a1356 = **ceil** signé des dims (cas à part, correct).
4. **Nature arg_0/arg_4** — A : struct ≥8 octets pour arg_0 ; B : coordonnées normalisées. **Non tranchable au-delà de l'ASM** : offsets prouvés = `w[+0]`, `w[+4]` (arg_0) et `w[+0]`, `w[+2]`, `w[+6]`, `w[+0xA]` (arg_4) ; rôle sémantique (rect écran vs UV) reste UNCERTAIN — demandé en question ouverte, pas bloquant.
5. **bibliothèque « scratch stack »** — A revendique une alloc scratch `bs_modulo 0x2C` + unwind ; B identique. **Convergence** mais libellé A « memory temporary » imprécis : bs_modulo bump dword_1D999C4 (arena), Unwind l'inverse (0x6a1574) — appliqué intégralement.
6. **Nom** — cf. synthèse ci-dessus ; rejet du A « MagFx_ » pur (préfixe battle manifesté par le caller MAG_212 ×2) et du B « Transform » seul (les packets GPU sont 40 % de la fonction).
7. **Add-esp/arg nettoyage** — A dit « cdecl, caller nettoie » ; l'épilogue 0x6a1657 `add esp,78h` avant `retn` (sans `retn 8`) montre que callee **ne nettoie pas les args** (ils sont au-dessus de esp restauré) → systématique callee-frame pure ; les deux voix concordaient implicitement — précisé pour l'archive.

## Preuves (7, ASM cité)

1. 0x6a1420/0x6a143e — `mov eax, imm32` ≥ bytes `b8 00 00 00 01` (lu live) : numérateur d'échelle **0x01000000**, leurre IDA « VIT_0_STATUS_MASK? » établi.
2. 0x6a13a6 — `push 0FFFFFC00h; call Mat3S16_MakeRotX_Q12` : rotX Q12 = -0x400.
3. 0x6a1418–0x6a1456 — `shl 0Ch; idiv ecx (0x80/0x100 movsx); …; call Mat3S16_ScaleByVec12` (0x6a1456) : échelle = Q12 de div/dim sur esi/edi (dims 0x6a12cc/0x6a12dc).
4. 0x6a146c–0x6a1485 — pingpong : `mov al, g_BattleFramePingPongIndex; xor eax,1; lea ecx,[eax*2+eax]; shl 3; sub; lea edx,[1D969C8h+ecx*4]; call Gpu_PackDrawEnvPacket` : env = 0x1D969C8 + (idx^1)·92, packet 0x40.
5. 0x6a1490/0x6a15d0/0x6a1609/0x6a1647 — `add eax,44h` sur `g_BattleOTBase` → 4× `OtNode24_PoolAllocLink[_Code1]`.
6. 0x6a14e2–0x6a14e4 — `test al,1; jz` sur `byte_1D989BD` : branche squelette conditionnelle ; RenderGeometry 0x6a1568 (ot_shift 0x10, args 0x6a155b–0x6a1563).
7. 0x6a1462/0x6a1589/0x6a15ef/0x6a162c — bumps `dword_2510258` 0x40/0x18/0xC/0xC en octets ; retour 0x6a164b→0x6a165a = EAX dernier nœud OT.

## Checks §5.6

- ✅ Callees cités présents dans callees.txt : tous (FillWordPairStride2C_1D989B8, sub_701270, sub_56C600, Mat3S16_MakeRotX_Q12, Mat3S16_MulQ12_IntoArg0, Mat3S16_ScaleByVec12, Gpu_PackDrawEnvPacket, OtNode24_PoolAllocLink ×3 + _Code1, Thunk_45E4D0, Call_Bs_ParseCamera ×2, Field_readCaPre, preCamReadVariables_Space, bs_modulo, BattleSkeleton_BuildHierarchicalFK, WalkStride30_MatComposeInPlace, RenderGeometry, BattleScratch_Unwind, Gpu_PackClipRectPacket, Gpu_PackOtTag1_DrawOffsetE5).
- ✅ Callers présents : sub_6A0DC0 (0x6a1069, MAG_212 stepper, CERTAIN anchor) + sub_6A1660 (0x6a1d3f).
- ✅ Strides en nombres : env slot ×92 (0x1D969C8 base, 2 slots), scratch 0x2C, nœud OT 0x18, paquets 0x40/0x18/0xC/0xC, table FillWordPair stride 0x2C, arrondis ×0x80/×0x100, utiles ot_shift=0x10.
- ✅ Polarités : aucun ja/jb/jg/jl ; `jz` signé, `jns`/`dec;or;inc` = partie fractionnaire signée du ceil ; `test al,1` positif ; tout `movsx`/`cdq`/`idiv` signé.
- ✅ Largeur retour : EAX 32 bits (pointeur nœud OT), compatible int/pointeur.
- ✅ Nom ≥2 preuves indépendantes adressées : caller MAG_212 ×2 + insertion OT battle +0x44 (repère 1) ; FK/rotX/RenderGeometry (repère 2).
- ✅ Pas de library call inventé ; VIT leurre tranché par lecture imm32 (0x01000000) —ni 0xFFFFF (c_a/brief), ni pointeur (Hex-Rays).

## Questions ouvertes (non bloquantes)

- Signification exacte des mots arg_0 {+0,+4} et arg_4 {+0,+2,+6,+0xA} : rect écran (théorie dominante diviseurs dims) non prouvée sans contexte des 2 callers.
- Rôle de `sub_701270(0x800)` (matrice de base ?) — boîte noire cohérente, non caractérisée.
- Valeurs ctx squelette 0x140/0xD8 (320×216 ?) et rect {0x2C0,0x100,0x80,0x100} : constantes battle par défaut à confirmer.
- Wiki vide (échec qmd) : la convergence wiki pour CERTAIN reste à obtenir d'une future passe.
- Les fichiers `reconcile_notes.md` / `c_reconciled.c` mentionnés au brief sont absents du pack (30 s) : cette réconciliation est faite depuis asm.asm + hexrays/c_a/c_b + lecture IDA live.

## IDBCOMMENT

Rendu d effet magique battle (branche MAG_212) : construit une matrice rotX Q12 (-0x400) mise a l echelle Q12 inverse des dims de la boete arg_4 (arrondies ceil a 0x80/0x100), offsets normalises depuis arg_0, numérateur scale 0x01000000 (leurre IDA VIT_0_STATUS_MASK). Si byte_1D989BD bit 0 est pose, rend le squelette battle via RenderGeometry dans l'OT g_BattleOTBase+0x44 (shift 0x10). Enchaine 4 packets GPU 0x40/0x18/0xC/0xC (DrawEnv pingpong 0x1D969C8+(idx^1)*92, primitive 0x05, clip rect E3/E4, draw offset E5) avec curseur dword_2510258. Retourne le dernier noeud OT alloue (EAX 32 bits). [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A12B0 (0x6A12B0, 285 instr live / 939 o)

Réconciliation c_a × c_b contre `asm.asm` (ground truth). `hexrays.c` = vérificateur seulement.
Callers : sub_6A0DC0 (xref 0x6a1069), sub_6A1660 (xref 0x6a1d3f). Prototype IDA :
`int __cdecl(__int16 *, __int16 *)` — retour EAX = dernier noeud OT (0x6A164B).

## Divergences tranchées

### D1 — Demi-divisions : trunc, pas floor (c_a faux)
- **c_a** : `asm_half_floor` commenté « round floor », et note divergence Hex n°2 « live = cdq;sub;sar 1 (round floor) ».
- **c_b** : « cdq;sub;sar 1 = trunc (= C `/`) ».
- **Tranché : c_b (trunc)**. Preuve : `cdq; sub eax, edx; sar eax, 1` @**0x6A13C9-D0** (x=-5 → (-5+1)>>1 = -2 = trunc(-2.5) ; floor donnerait -3). Même idiome @**0x6A13F0-F3** (v18-v19)/2, @**0x6A14AD-B3** (256/2), @**0x6A14BB-BE** (128/2). Hex-Rays `x/2` concorde donc exactement — la « divergence n°2 » de c_a n'en est pas une.

### D2 — Diviseurs unitaires : transcription littérale, pas « ceil » (c_a faux ami)
- **c_a** : helper `asm_ceil_div` (q = floor-biaisé ; reste ; ++q) présenté comme ceil.
- **c_b** : `q = x/128; if (q % 128 != 0) ++q;` littéral, avec note « le test porte sur le QUOTIENT ».
- **Tranché : c_b (forme littérale)**. Preuve @**0x6A130F-41** : `cdq; and edx,7Fh; add; sar 7` = division signée 2^n trunc (idiome MSVC) ; puis `and eax,8000007Fh; jns; dec; or 0FFFFFF80h; inc; jz; inc esi` = `q % 128` (sémantique C) et ++ si ≠ 0. Le test porte sur esi (quotient) après `mov eax, esi` @0x6A132E — pas sur le dividende. Version /256 : @**0x6A1321-58** (and 0FFh / sar 8 / 800000FFh). Les deux voix calculent numériquement la même chose (c_a ajoute le biais en C), mais l'étiquette « ceil » de c_a est une interprétation non prouvée → forme littérale conservée.

### D3 — Numérateur du vecteur d'échelle : imm32 0x01000000 (c_a faux, c_b sous-déterminé)
- **c_a** : numérateur `0xFFFFF` (« 0xFFFFF imm32 »).
- **c_b** : `VIT_0_STATUS_MASK_IMM` laissé UNCERTAIN (valeur non vérifiable sans ida_dump_bytes).
- **Tranché : 0x01000000**. Preuves : brief cellule (mov eax,imm32 @**0x6A1420** et @**0x6A143D**, `VIT_0_STATUS_MASK` = leurre de nommage IDA) ; corroboration interne au lot : `Gpu_PackOtTag1_DrawOffsetE5` @**0x6A163B** annoté « or 01000000 … VIT leurre IDA » — même famille de symbole leurre. Le listing asm.asm affiche `mov eax, offset VIT_0_STATUS_MASK?` (le « ? » signale le symbole incertain d'IDA). Stores : var_50 @0x6A142D (x), var_4C = ebx @0x6A13CC (0), var_48 @0x6A144A (y). Dénominateurs : `(v20 << 0xC) / v26` (shl logique @0x6A1418, idiv movsx var_54 @0x6A1413-1C) et `(v21 << 0xC) / v27` (@0x6A1435-43).

### D4 — Bumps du curseur dword_2510258 : en OCTETS (les deux voix ok, Hex trompeur)
- **c_a/c_b** : 0x40 / 0x18 / 0x0C / 0x0C octets. **Hex-Rays** : `+= 16 / 6 / 3` (dwords).
- **Tranché : octets**. Preuves : `add eax,40h` @**0x6A1462**, `add ecx,18h` @**0x6A1589**, `add eax,0Ch` @**0x6A15EF**, `add eax,0Ch` @**0x6A162C** — additions sur le dword entier du curseur, pas d'arithmétique pointeur typed. Même valeur numérique que Hex (16/6/3 dwords), sémantique d'unité différente.

### D5 — Ordre (v11+4..6) : WORD puis BYTE puis dword+0 puis byte+7 (concordance)
- c_a = c_b = Hex = ASM : 8 words @+8..+16 (0x6A1597-B6), bytes +4/+5/+6 @0x6A15B7-BF, dword [p]=0x05000000 @0x6A15C0, byte +7=0x28 @0x6A15C6. Aucune divergence — point 7 du brief validé tel quel.

### D6 — Ordre xy (DrawOffset E5) : xy[1] avant bump (concordance, Hex trompeur sur l'ordre)
- Live : `var_56 → var_76` (xy[1]) @**0x6A161C** avant le bump curseur @0x6A162C ; `xy[0] = var_58 (0x2C0)` @0x6A1631 après les pushes 0x6A162F-30. c_a/c_b corrects. Hex écrit xy[1] après l'appel ClipRect (ligne 118) — divergence d'ordre sans effet observable.

### D7 — Chaîne matricielle (concordance totale, points 2/3 du brief validés)
- sub_701270(**0x800**, &var_40) — push &var_40 @0x6A1379, push 800h @0x6A137A (arg0=0x800).
- sub_56C600(&var_40, &var_30, &var_30) — pushes @0x6A1390/95/96, in-place sur le vecteur.
- Mat3S16_MakeRotX_Q12(**-0x400**, &var_20) — push &var_20 @0x6A13A0, push FFFFFFC00h @0x6A13A1.
- Mat3S16_MulQ12_IntoArg0(&var_20, &var_40) — pushes @0x6A13B6/B7, dst=arg0.
- Mat3S16_ScaleByVec12(&var_20, &var_50) — pushes @0x6A1449/55.
- Translation : v32[5] = v30[0] + ((v2−w6)/2)/v6 (@0x6A13BD-D5) ; v32[6] = v31 − ((v18−v19)/2)/v7 (@0x6A13E3-406) ; v32[7] = movsx word_1D8E038 (@0x6A13F8).

### D8 — Rendu squelette conditionnel (concordance, point 4 validé)
- Gate : `mov al,byte_1D989BD; test al,1; jz 0x6A157C` @**0x6A14DA-14E4**.
- bs_modulo(0x2C) @0x6A14EC ; stores 16/32 bits conformes aux deux voix ; push offset unk_1D989D0 @0x6A14F3 traverse les stores et alimente BattleSkeleton_BuildHierarchicalFK @0x6A153B (stack discipline) ; WalkStride30_MatComposeInPlace(unk_1D989D0, &var_20) @0x6A154A ; RenderGeometry(dword_1D989C0, ctx, ot_base+0x44, 0x10, packet) — pushes @0x6A155B-63, retour → dword_2510258 @0x6A156F ; BattleScratch_Unwind(0x2C) @0x6A1574.

### D9 — Packets GPU (point 5 validé, ordre des 4 PoolAllocLink)
1. DrawEnv : pkt0 = curseur, bump 0x40, env = `0x1D969C8 + ((pingpong^1))*92` (idx*3 shl 3 sub @0x6A1474-7C), `Gpu_PackDrawEnvPacket(pkt0, env)` @0x6A1485, **PoolAllocLink** #1 @0x6A1494 (EAX ignoré).
2. Primitive 0x05 : bump 0x18, **PoolAllocLink_Code1** @0x6A15D4.
3. ClipRect : pkt2 = curseur, bump 0x0C, `Gpu_PackClipRectPacket(pkt2, &var_58)` @0x6A15FD (rect {0x2C0,0x100,0x80,0x100}), **PoolAllocLink** #3 @0x6A160D.
4. DrawOffset E5 : pkt3, bump 0x0C, `Gpu_PackOtTag1_DrawOffsetE5(pkt3, xy={0x2C0,0x100})` @0x6A163B, **PoolAllocLink** #4 @0x6A164B → **retour fonction** (EAX).
- Tous sur `g_BattleOTBase + 0x44` (`add eax,44h` @0x6A1490/55C/609/647). Hex `g_BattleOTBase + 17` = arithmétique pointeur équivalente (17×4=0x44).

### D10 — Épilogue et retour (point 6 validé)
- `add esp,30h` @**0x6A1650** (6 calls × 8 o), pop edi/esi/ebp/ebx @0x6A1653-56, `add esp,78h` @**0x6A1657**, retn. Retour EAX = dernier node @**0x6A164B**. Lots add esp 0x8/0x44/0x10/0x28 bouclés exactement (voir préambule c_reconciled.c).

### D11 — Call_Bs_ParseCamera ×2 (concordance)
- #1 @0x6A14C1 : args (64, 128) — v26/2, v27/2 en trunc (D1).
- #2 @0x6A15E3 : args (var_5C, var_60) — sorties de Thunk_45E4D0(&var_5C, &var_60) @0x6A14A3, repassées par valeur.

## Divergences vs Hex-Rays (récapitulatif)
1. `&VIT_0_STATUS_MASK_ / …` : Hex prend l'imm32 pour une adresse ; réel = numérateur imm32 0x01000000 (D3).
2. `dword_2510258 += 16/6/3` : unités dwords ; réel = octets 0x40/0x18/0x0C/0x0C (D4).
3. xy[1] stocké après l'appel ClipRect ; réel @0x6A161C avant le bump (D6, ordre seul).
4. `v32[6]` calculé après `v32[7]` ; live : var_4 @0x6A13FF avant var_8 @0x6A140C (ordre seul).
5. `(v7 < 0)` fixup explicite lignes 52-54 : transcription fidèle de l'idiome `and 800000FFh; dec;or;inc` @0x6A1344-56 — concorde, pas une divergence.
6. Hex `v6 % 128` / fixup v7 : concorde avec l'ASM (D2).

## UNCERTAIN restants
- **0x6A12EF** : effet de bord exact de `FillWordPairStride2C_1D989B8(0,0)` (mécanique E3a prouvée, rôle non caractérisé — A/V/R).
- **0x6A130F** : intention source de l'idiome quotient (transcription exacte ; « ceil » non prouvé).
- **0x6A137A** : signification de l'argument 0x800 de sub_701270.
- **0x6A1420/43D** : imm32 0x01000000 fourni par le brief + corroboré par le motif E5 @0x6A163B ; relecture `ida_dump_bytes` impossible dans cette cellule (accès IDA interdit).
- **0x6A12BD** : rôles des champs a1/a2 (mots lus a1[0], a1[2] ; a2[0], a2[2], a2[3], a2[5] — offsets certains, sémantique rect/viewport hypothétique).
- **0x6A164B** : type de retour exact (int vs OtNode24*) — largeur 32 bit prouvée.
