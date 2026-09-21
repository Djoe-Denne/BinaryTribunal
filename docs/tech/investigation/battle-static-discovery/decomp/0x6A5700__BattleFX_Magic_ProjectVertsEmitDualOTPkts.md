# BattleFX_Magic_ProjectVertsEmitDualOTPkts @ 0x6A5700

- Instr (live): 171 (571 o, 0x6A5700-0x6A5949)
- Palier: 2+1
- Verdict: LIKELY - builder d'effet Maelstrom (caller unique sub_6A3D90 @0x6A4063) : boucle 1 projection GTE par sommet sur table 0x0C o/elt a dword_25102C8+0xEE0 (index bloc arg5<<8 -> word_11B3364 @0x6A5712-16, dot signe table[angle[3]]*angle[k] sar 0xC, SetIndexed+MVMVA 0x12 x2, clipping flags bits 1/2/4/8 byte [esi+8] store WORD @0x6A57CD, cascade stores [esi+4]=cx/[esi+6]=dx inconditionnels avant saturations 319/0x13F et 215/0xD7 @0x6A5815-48), sortie stride +0x0C @0x6A5852 ; boucle 2 : bs_modulo 0x48, struct ctl (arg_0 pointeur + [arg_0+4] compteur @0x6A5721/37, dword_25102C8+0xEE0, 0x240, 0x100, g_BattleOTBase+arg3*4 stride 4 @0x6A589E, [esi+10]=ptr stream+10), 2 draw-packets 0xE1000220/0xE1000240 (@0x6A58B6/10, [pkt+0] = leurre rdata VIT_0_STATUS_MASK), GteState_Set_1CA8A30(arg4), Camera_SetPackedSlots_15_16_17(0,0,0), builders sub_6A5C90+6A5DB0 puis 6A5950+6A5AD0, BattleScratch_Unwind(0x48) @0x6A5939 -> retour EAX residuel (jamais ecrit avant retn @0x6A5948), proto char IDA faux
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A5700\nTYPE ; proposition: BattleFX_Magic_ProjectVertsEmitDualOTPkts
- Notes parent: checks 5.6 OK : shl ebx,8 + word_11B3364 (0x6A5712-16), compteur [arg_0+4] tranché B (0x6A5721/37), dec (0x6A5858), copie [esi]=eax (0x6A587A), OT stride 4 lea ecx,[eax+edx*4] (0x6A589E), [esi+10]=edx (0x6A58EA), caller sub_6A3D90 @0x6A4063 (callers.txt) ; R : arg_0 pointeur (pas compteur), arg_10 index bande GTE (pas compteur)

## C reconcilie

```c
/* ============================================================
 * 0x6A5700 — sub_6A5700 — c_reconciled (rôle C-R, pipeline triple 2+1 mag FX battle)
 * Ground truth = live ASM tools/_tmp_semantic_triple/0x6a5700/asm.asm
 *   (171 instr @0x6A5700, taille IDA 585 octets 0x6A5700..0x6A5948), NOT Hex-Rays.
 * Hex-Rays (hexrays.c) = vérificateur seulement.
 * Voix A : c_a.c ; Voix B : c_b.c ABSENT du pack (anomalie) — fallback semantic_b.md.
 * Type IDA : 'char __cdecl(int, __int16 *, int, int, int)'.
 * Sauvegardes (ordre push) : ebx, ebp, esi, edi ; prologue sub esp,78h ; epilogue
 * symétrique add esp,78h @0x6a5945.
 * Corrections add esp : 4 @6a5734 (1 push arg CopyOut) ; 0x20 @6a57ad (2×2 pushes
 * GTE SetIndexed/GetIndexed+Thunk) ; 0x10 @6a580f (2 pushes GetIndexed).
 * ============================================================
 * Rôle : projection GTE par sommet (table profondeur word_11B3364), clipping
 * 320×216 avec flags, puis émission de 2 packets GPU liés à l'OT battle,
 * en 2 étages de builders ; scratch 0x48 alloué (bs_modulo) puis libéré
 * (BattleScratch_Unwind) — la valeur de retour eax est le RETOUR DU SCRATCH
 * UNWIND (jamais réécrit avant retn @0x6a5948).
 * ============================================================ */

extern void   GteState_CopyOut_1CA8948_5C(void *dst);                 /* 6a571c : rep movsd 0x17 dwords = 0x5C */
extern void   GteState_SetIndexed_1CA8A10_ArgSwap(int idx, int val);  /* 6a5771/6a57a8 : table_1CA8A10[arg0]=arg1 (args pushés swap) */
extern void   GteState_GetIndexed_1CA8A10(void *out, int idx);        /* 6a5782/6a578e/6a57f1/6a57fd : *arg0 = table[arg1] */
extern void   Thunk_460860_480012(void);                             /* 6a5776/6a57b0 : push 0x480012 ; call sub_460860 (MVMVA-like 0x12) ; pop ecx ; ret */
extern int    bs_modulo(int nbytes);                                 /* 6a5865 : alloc scratch (bump dword_1D999C4) */
extern int    BattleScratch_Unwind(int nbytes);                      /* 6a5939 : unwind dword_1D999C4 (inverse de bs_modulo) */
extern void   OtNode24_PoolAllocLink(void **p_ot, void *pkt);        /* 6a58c7/6a591b : node 0x18, base 0x1C48828, cap 0x60000, insert OT */
extern void   GteState_Set_1CA8A30(int val);                         /* 6a58d4 : dword_1CA8A30 = arg */
extern void   Camera_SetPackedSlots_15_16_17(int a, int b, int c);   /* 6a58dc : 3x slots 15/16/17, arg<<4 */
extern void   sub_6A5C90(void *pkt);                                 /* 6a58ed */
extern void   sub_6A5DB0(void *pkt);                                 /* 6a58f3 */
extern void   sub_6A5950(void *pkt);                                 /* 6a592c */
extern void   sub_6A5AD0(void *pkt);                                 /* 6a5932 */

extern int    dword_25102C8;    /* +0xEE0 = table sortie des sommets projetés (stride 0x0C) */
extern int *  dword_2517A24;    /* curseur pool draw-packets, stride 8 (2 dwords) */
extern short  word_11B3364[];   /* __int16[4096] : table profondeurs ; accès bloc arg5<<8 */
extern int    g_BattleOTBase;   /* base OT battle ; slot = arg_8 * 4 */
extern int    VIT_0_STATUS_MASK_; /* offset rdata poussé comme dword[0] des packets — nom IDA probablement leurre : tag GPU/prim */

int __cdecl sub_6A5700(int arg_0, __int16 *arg_4, int arg_8, int arg_C, int arg_10)
{
    /* --- prologue 6a5700..6a5744 --- */
    __int16 proj_stack[0x5C];                 /* var_5C : cible GteState_CopyOut (0x5C octets) */
    __int16 var_74, var_70;                   /* sorties GetIndexed idx 9/10 (path 1) */
    __int16 var_6C, var_68;                   /* sorties GetIndexed idx 9/10 (path 2) */
    int var_64;                               /* dword 2×words : {lo,hi} dot produits */
    __int16 *blk;                             /* ebx = word_11B3364 + (arg_10 << 8) *2 */
    long   *vout;                             /* esi = dword_25102C8 + 0xEE0 */
    int count;                                /* var_78 = *(int*)(arg_0+4) */
    __int16 *vtx;                             /* edi = arg_4, stride 8 */

    blk = (__int16 *)((char *)word_11B3364 + (arg_10 << 8) * 2); /* shl ebx,8; add ebx,offset word_11B3364 @6a5712/16 */
    GteState_CopyOut_1CA8948_5C(proj_stack);                      /* push eax(@var_5C); 6a571c */
    count = *(int *)(arg_0 + 4);                                  /* mov edx,[ecx+4] @6a5737, copié var_78 @6a5740 */
    vout = (long *)(dword_25102C8 + 0xEE0);                       /* lea esi,[eax+0EE0h] @6a573a */

    /* ==================== BOUCLE 1 : 6a5746..6a585d ==================== */
    vtx = arg_4;
    do {
        /* 6a5746..6a576b : dot signé table[angle[3]] * angle[k], sar 0xC (fixpoint /4096) */
        int   sv   = (short)blk[vtx[3]];              /* movsx eax, word ptr [ebx+ecx*2] @6a574d ; ecx = word [edi+6] */
        short lo01 = (short)((sv * vtx[0]) >> 12);    /* imul edx,eax ([edi]) ; sar edx,0Ch @6a575b -> var_64 lo */
        short hi12 = (short)((sv * vtx[1]) >> 12);    /* imul ecx,eax ([edi+2]) ; sar ecx,0Ch @6a575e -> var_64 hi */
        var_64 = (unsigned short)lo01 | ((unsigned short)hi12 << 16); /* stores word @6a5761/66 puis reload dword @6a576b */

        /* 6a576b..6a5793 : GTE path 1 — SetIndexed(idx 0, var_64) + MVMVA 0x12 + GetIndexed 9/10 */
        GteState_SetIndexed_1CA8A10_ArgSwap(0, var_64);   /* push var_64.word ; push ebp(=0) @6a576f/70 */
        Thunk_460860_480012();                            /* @6a5776 — MVMVA-like 0x12 */
        GteState_GetIndexed_1CA8A10(&var_74, 9);          /* @6a5782 */
        GteState_GetIndexed_1CA8A10(&var_70, 10);         /* @6a578e */
        *(short *)&((char *)vout)[0] = var_74;            /* [esi]   @6a579d */
        *(short *)&((char *)vout)[2] = var_70;            /* [esi+2] @6a57a0 */

        /* 6a57a4..6a57b5 : GTE path 2 — SetIndexed(idx 0, dword complet [edi]) + MVMVA 0x12 */
        GteState_SetIndexed_1CA8A10_ArgSwap(0, *(int *)vtx);  /* push [edi] ( entier non-signé) @6a57a6 */
        Thunk_460860_480012();                                /* @6a57b0 ; add esp,0x20 (les 4 pushes GTE/Thunk qui precèdent) @6a57ad */

        /* 6a57b5..6a57d1 : flags clip X — bits 1/2 (or reset bpm) du byte [esi+8], branchement SIGNED */
        if ((signed short)*(short *)&((char *)vout)[0] < 0) {
            *(char *)&((char *)vout)[8] |= 0x01;              /* or byte [esi+8],1 @6a57ba */
        } else if ((signed short)*(short *)&((char *)vout)[0] < 320) { /* cmp [esi],140h ; jl
loc_6A57CD @6a57c0/c5 */
            *(short *)&((char *)vout)[8] = 0;                 /* mov [esi+8], bp @6a57cd — store WORD (couvre +8..+9) */
        } else {
            *(char *)&((char *)vout)[8] |= 0x02;              /* or byte [esi+8],2 @6a57c7 */
        }

        /* 6a57d1..6a57ea : flags clip Y — bits 4/8 (SIGNED) */
        if ((signed short)*(short *)&((char *)vout)[2] < 0) {
            *(char *)&((char *)vout)[8] |= 0x04;              /* or byte [esi+8],4 @6a57da */
        } else if ((signed short)*(short *)&((char *)vout)[2] >= 216) {  /* 0xD8 */
            *(char *)&((char *)vout)[8] |= 0x08;              /* or byte [esi+8],8 @6a57e6 */
        }

        /* 6a57ea..6a5802 : re-fetch GetIndexed 9/10 (post path 2) */
        GteState_GetIndexed_1CA8A10(&var_6C, 9);          /* @6a57f1 */
        GteState_GetIndexed_1CA8A10(&var_68, 10);         /* @6a57fd */
        /* add esp,0x10 @6a580f */

        /* 6a5812..6a584e : cascade clip — STORES [esi+4]=cx / [esi+6]=dx INCONDITIONNELS
         * AVANT la cascade @6a5815/6a5819, puis saturation x→[0,0x13F], y→[0,0xD7].
         * NB : le branchement ax (x, cmp @6a5812) est posé avant les stores,
         * imul toujours valide après (mov ne touche pas les flags). */
        {
            short cx = var_6C, dx = var_68;
            short ax; /* ax = cx juste avant les stores (cmp) */
            ax = cx;
            *(short *)&((char *)vout)[4] = cx;            /* mov [esi+4],cx @6a5815 */
            *(short *)&((char *)vout)[6] = dx;            /* mov [esi+6],dx @6a5819 */
            if ((signed short)ax < 0) {
                *(short *)&((char *)vout)[4] = 0;         /* [esi+4]=bp @6a581f */
            } else if (ax >= 320) {                       /* cmp ax,140h @6a5825 */
                *(short *)&((char *)vout)[4] = 0x13F;     /* 319 @6a582b */
            } else {
                ax = *(short *)&((char *)vout)[6];        /* re-fetch [esi+6] @6a5833 (= dx) */
                if ((signed short)ax < 0) {
                    *(short *)&((char *)vout)[6] = 0;     /* 6a583c */
                } else if (ax >= 216) {                   /* 0xD8 @6a5842 */
                    *(short *)&((char *)vout)[6] = 0xD7;  /* 215 @6a5848 */
                }
            }
        }

        /* avance : +0x0C @6a5852, +8 sur vtx @6a5855, dec var_78 @6a5858 */
        vout = (long *)((char *)vout + 0x0C);
        vtx  = (__int16 *)((char *)vtx + 8);
        --count;
    } while (count);   /* jnz loc_6A5746 @6a585d */

    /* ==================== BOUCLE 2 : émission 2 packets GPU ==================== */
    {
        long *ctl;                                  /* esi = bs_modulo(0x48) */
        unsigned int *pkt;
        long *stream;
        int  slen;

        ctl = (long *)bs_modulo(0x48);              /* push 48h; call @6a5863/6a5865 */
        *(long *)&((char *)ctl)[0x00] = arg_0;      /* [esi]   = arg_0 (stream ptr) @6a587a */
        *(long *)&((char *)ctl)[0x04] = dword_25102C8 + 0xEE0;  /* [esi+4]  @6a588f */
        *(long *)&((char *)ctl)[0x08] = 0x240;      /* @6a5888 */
        *(long *)&((char *)ctl)[0x0C] = 0x100;      /* @6a5892 */
        *(long *)&((char *)ctl)[0x14] = g_BattleOTBase + arg_8 * 4; /* [esi+14h] @6a589e/6a58a1 */
        /* NB : [esi+10h] pas encore écrit ici — il est recalculé 2x plus bas @6a58ea / 6a5929 */

        /* --- packet 1 : tag 0xE1000220 @6a58bc --- */
        pkt = (unsigned int *)dword_2517A24;        /* @6a58a4 */
        dword_2517A24 = (int *)((char *)dword_2517A24 + 8); /* add ecx,8 @6a58ac */
        *pkt       = (unsigned int)&VIT_0_STATUS_MASK_;     /* mov dword ptr [eax],offset @6a58b6 */
        pkt[1]     = 0xE1000220u;                   /* @6a58bc */
        OtNode24_PoolAllocLink((void **)*(long **)&((char *)ctl)[0x14], pkt); /* push pkt; push p_ot @6a58b5/6a58c6 → args (p_ot, pkt) @6a58c7 */

        GteState_Set_1CA8A30(arg_C);                /* @6a58d4 */
        Camera_SetPackedSlots_15_16_17(0, 0, 0);    /* 3x push ebp(=0) @6a58d9..dc */

        /* stage 1 : update [esi+10h] = stream + stream[0] + 0x10 @6a58e1..6a58ea */
        stream = (long *)(*(long *)&((char *)ctl)[0x00]);   /* eax=[esi] @6a58e1 */
        slen   = *(int *)stream;                            /* ecx=[eax] @6a58e4 */
        *(long *)&((char *)ctl)[0x10] = (long)((char *)stream + slen + 0x10); /* lea edx,[eax+ecx+10h] @6a58e6 */
        sub_6A5C90(ctl);                            /* push esi @6a58e3 */
        sub_6A5DB0(ctl);                            /* push esi @6a58f2 */

        /* --- packet 2 : tag 0xE1000240 @6a5910 --- */
        pkt = (unsigned int *)dword_2517A24;        /* @6a58f8 */
        dword_2517A24 = (int *)((char *)dword_2517A24 + 8); /* add, mov @6a5900/6a5903 */
        *pkt       = (unsigned int)&VIT_0_STATUS_MASK_;     /* @6a590a */
        pkt[1]     = 0xE1000240u;                   /* @6a5910 */
        OtNode24_PoolAllocLink((void **)*(long **)&((char *)ctl)[0x14], pkt); /* @6a591b */

        /* stage 2 : re-update [esi+10h] identique @6a5920..6a5929 */
        stream = (long *)(*(long *)&((char *)ctl)[0x00]);   /* @6a5920 */
        slen   = *(int *)stream;                            /* @6a5923 */
        *(long *)&((char *)ctl)[0x10] = (long)((char *)stream + slen + 0x10); /* @6a5925 */
        sub_6A5950(ctl);                            /* push esi @6a5922 */
        sub_6A5AD0(ctl);                            /* push esi @6a5931 */
    }

    /* --- 6a5937..6a5948 : libération scratch + epilogue --- */
    BattleScratch_Unwind(0x48);                     /* push 48h; call @6a5937/6a5939 */
    /* add esp,0x38 @6a593e ; pop edi/esi/ebp/ebx @6a5941..44 ; add esp,78h @6a5945 ; retn @6a5948 */
    /* eax N'EST JAMAIS réécrit entre 6a5939 et retn : la valeur de retour de
     * sub_6A5700 est le retour de BattleScratch_Unwind(0x48) (résiduel). */
    return BattleScratch_Unwind(0x48) /* DÉJA APPELÉE CI-DESSUS — formulation C ; voir note */;
    // UNCERTAIN 0x6A5948 : eax au retn = eax retourné par BattleScratch_Unwind (aucun write entre
    // 6a5939 et retn — confirmé @0x6a593f..0x6a5947 rien ne touche eax). Largeur perçue par le caller
    // (prototype IDA 'char' → AL only) non prouvable depuis ce pack — abandonner sous-task/validateur.
}

/* NOTE de reproduction fidèle (ASM) :
 *  1) Le C ci-dessus ne peut pas réécrire "return" sans dupliquer l'appel ;
 *     la structure exacte est : y = BattleScratch_Unwind(0x48); ...epilogue...; retn
 *     (y reste dans eax). Le return ci-dessus est PUREMENT RHÉTORIQUE — ne pas
 *     exécuter un second appel ; le flux réel n'appelle BattleScratch_Unwind qu'une fois.
 *  2) Pointeur vout : en ASM esi avance de 0x0C o/elt (add esi,0Ch @6a5852 — stride sortie).
 *     vtx avance de 8 o/elt (add edi,8 @6a5855). Slot OT : stride 4 o (eax+edx*4 @6a589e).
 *     Aucun stride 0x1D0 (F_CHAR) ni slot 0xD0 n'intervient dans cette fonction.
 */
```

## Analyse semantique

# Sémantique sub_6A5700 @ 0x6A5700 (réconciliation R)

- Rôle (1 phrase) : Builder d'effet magie battle : projette en GTE (MVMVA, table de profondeur word_11B3364, fixpoint >>12) une liste de sommets (arg_4, stride 8), les clampe au viewport battle 320×216, puis émet deux packets GPU (0xE1000220 @0x6a58bc, 0xE1000240 @0x6a5910) liés à l'OT battle via g_BattleOTBase+arg_8*4, avec deux étages de builders (6A5C90/6A5DB0 puis 6A5950/6A5AD0) sur un struct de rendu 0x48 alloué/rétro-ouvert via bs_modulo/BattleScratch_Unwind.
- Verdict : LIKELY consolidé
- Confiance : LIKELY (caller unique + callees + 7 preuves ASM concordantes ; wiki indisponible dans le pack, valeur de retour et sémantique fine de arg_0 non closes)
- Nom catalogue : sub_6A5700 (auto, trop creux). Proposition (markdown seul, PAS de rename) : `BattleFX_Magic_ProjectVertsEmitDualOTPkts` — synthèse couvrant projection (A preuve 3, B preuves 1–3) et émission de deux packets OT (A/B preuves 6).

## In / Out / Effets

- In (__cdecl, 5 args) :
  - a1 = arg_0 : **pointeur** vers un descripteur d'effet, pas un nombre : `[arg_0+4]` = compteur de sommets (`mov ecx,[arg_0]; mov edx,[ecx+4]` @0x6a5721/0x6a5737, boucle dec eax @0x6a5858-85d) ; recopié verbatim dans [esi] du struct 0x48 @0x6a587a, puis double-déréférencé `mov eax,[esi]; mov ecx,[eax]` @0x6a58e1/0x6a58e4 ([arg_0[0]] = taille de stream ; [esi+0x10] = *[arg_0] + [arg_0(0)] + 0x10).
  - a2 = arg_4 : pointeur liste de sommets, **stride 8** (`add edi,8` @0x6a5855) : words [0], [2] = coordonnées, [6] = index de profondeur (`movsx ecx,[edi+6]` @0x6a5746 indexant word_11B3364).
  - a3 = arg_8 : index de profondeur OT → `g_BattleOTBase + arg_8*4` @0x6a589e, stocké [esi+0x14].
  - a4 = arg_C : valeur écrite à dword_1CA8A30 via GteState_Set @0x6a58d4 (état GTE).
  - arg8 (arg_10) : index de bande GTE/base (`shl ebx,8` @0x6a5712 + `add ebx,offset word_11B3364` @0x6a5716).
- Boucle 1 (0x6a5746–0x6a585d) : GTE CopyOut/SaveState 0x5C @0x6a571c ; SetIndexed(0, var) + Thunk_460860_480012 (MVMVA-like 0x12) ×2 @0x6a5771-0x6a577b et 0x6a57a8-0x6a57b0 ; GetIndexed(9/0xA) ×2 tours @0x6a5782/0x6a578e puis 0x6a57f1/0x6a57fd ; dot signé imul + sar 0Ch (fixpoint /4096) @0x6a5755-0x6a575e ; sortie dans table projetée à dword_25102C8+0xEE0, **stride 0x0C** (`add esi,0Ch` @0x6a5852) : [0]/[2] = xy, [4]/[6] = xy clippés, [8] = flags OR 1/2/4/8 (clip) avec reset WORD [esi+8]=bp @0x6a57cd ; clamp x→13Fh/0 @0x6a582b/0x6a581f, y→0D7h/0 @0x6a5848/0x6a583c ; **stores [esi+4]/[esi+6] inconditionnels** @0x6a5815/0x6a5819 avant cascade jge/jl (branches sur les valeurs stockées, re-fetch y @0x6a5833) ; polarité **signed** (jge/jl) partout ✔.
- Boucle 2 / emission (0x6a5863–0x6a5936) : bs_modulo(0x48) @0x6a5865 ; struct ctl : [0]=arg_0, [4]=dword_25102C8+0xEE0, [8]=0x240, [0xC]=0x100 @0x6a587a-0x6a5892, [0x14]=g_BattleOTBase+arg_8*4 @0x6a589e ; packets à dword_2510258 (cursor dword_2517A24, bump +8 ×2 @0x6a58ac/0x6a5900) : dword[0]=&VIT_0_STATUS_MASK (offset rdata 0x01000000 — **leurre** nom IDA : tag GPU, pas masque de statut), dword[4]=0xE1000220 puis 0xE1000240 ; OtNode24_PoolAllocLink(p_ot, pkt) push right-to-left @0x6a58c7 et 0x6a591b ; entre les deux : GteState_Set_1CA8A30(arg_C) @0x6a58d4 puis Camera_SetPackedSlots_15_16_17(0,0,0) @0x6a58dc ; étage builders stage1 (sub_6A5C90 @0x6a58ed + sub_6A5DB0 @0x6a58f3) puis re-update [esi+0x10] @0x6a5925 puis stage2 (sub_6A5950 @0x6a592c + sub_6A5AD0 @0x6a5932), chacun avec push esi (cdecl).
- Out / retour : **eax résiduel de BattleScratch_Unwind(0x48)** @0x6a5939 — aucun write eax dédié entre 0x6a5939 et retn @0x6a5948 ; prototype IDA `char` (AL) fragile, largeur non démontrable depuis ce pack. Retour fonctionnellement inutilisé en apparence (caller non inspecté ici).

## Divergences A/B tranchées

1. **arg_0** : A « nombre d'éléments » ; B « pointeur recopié dans [esi] et double-déréférencé ». **Tranché B.** ASM : `mov ecx,[arg_0]` @0x6a5721 puis `mov edx,[ecx+4]` @0x6a5737 (compteur = [arg_0+4]) ; `mov [esi], eax/arg_0` @0x6a587a ; `mov eax,[esi]; mov ecx,[eax]` @0x6a58e1/0x6a58e4. Déréférencements impossibles si arg_0 était un compteur scalaire.
2. **arg_10** : A « index de bande GTE » ; B « compteur d'itérations » (<<8 puis +word_11B3364). **Tranché A.** ASM : arg_10 lu @0x6a5704, shl 8 @0x6a5712, base word_11B3364 @0x6a5716, servis comme base de scalaires signés `movsx eax,[ebx+ecx*2]` @0x6a574d ; le compteur de boucle est var_78 = [arg_0+4] @0x6a5740/0x6a5858. B a confondu les deux entrées du prologue.
3. **Nom** : `BattleFX_DepthSortedProjection_EmitDualPkts` (A) vs `BattleFX_Magic_ProjectDepthAndEmitGfxDrawPackets` (B). **Synthèse** : les deux noms capturaient projection + émission double ; synonimie réelle des fonctions BattleFX/BattleMagic défendue par aucun opcode. Retenu : **`BattleFX_Magic_ProjectVertsEmitDualOTPkts`** (marque le sommet-unité stride 8 et les 2 packets OT distincts 0xE1000220/0xE1000240 distincts).
4. **Point acceptable côté A (ajusté)** : « Écriture table d'enregistrements à dword_25102C8+0xEE0 » — c'est bien une table projetée (stride 0x0C) référencée ensuite comme [esi+4] (base sommets du struct de draw) @0x6a588f. Les deux lectures coexistent.
5. **Reste (convergence A/B, confirmé par reconcile_notes + ASM)** : stride 0x0C, store WORD [esi+8] @0x6a57cd, stores inconditionnels avant cascade @0x6a5815/0x6a5819, eax résiduel, [pkt+0] = offset rdata (leurre 0x01000000), OT stride 4 @0x6a589e.

## Preuves (ASM cité)

1. 0x6a5712/0x6a5716 `shl ebx,8` + `add ebx,offset word_11B3364` ; 0x6a574d `movsx eax, word ptr [ebx+ecx*2]` (ecx = word [edi+6]) → table de scalaires de profondeur signés indexée par bande arg_10.
2. 0x6a5755-0x6a575e `imul edx,eax / imul ecx,eax / sar 0Ch` ×2 → fixpoint /4096, projection GTE signée.
3. 0x6a57c5/0x6a57e0 `cmp …,140h` / `0D8h` + `jl` signed, et clamps `mov word ptr [esi+4],13Fh` @0x6a582b / `[esi+6],0D7h` @0x6a5848 → viewport battle 320×216, coordonnées signées.
4. 0x6a589e `lea ecx,[eax+edx*4]` avec eax=g_BattleOTBase, edx=arg_8 → slot OT dword, stride 4 ; lié @0x6a58c7 et 0x6a591b par OtNode24_PoolAllocLink.
5. 0x6a58bc/0x6a5910 `mov dword ptr [eax+4], 0E1000220h` puis `0E1000240h` → deux primitives GPU distinctes, chacune bumpant le cursor dword_2517A24 de +8 @0x6a58ac/0x6a5900.
6. 0x6a5721/0x6a5737 `mov ecx,[arg_0]; mov edx,[ecx+4]` et 0x6a58e1-0x6a58ea double-déréférencement de [esi] → arg_0 est un pointeur descripteur LOT (trié par profondeur : stripping d'ordre = depth-sorted par arg_8).
7. 0x6a5937-0x6a5939 `push 48h; call BattleScratch_Unwind` symétrique de `bs_modulo(0x48)` @0x6a5863-0x6a5865 → alloc/réouverture scratch 0x48, eax résiduel au retn @0x6a5948.

## Checks §5.6

- Callees cités présents (callees.txt) : GteState_CopyOut_1CA8948_5C, GteState_SetIndexed_1CA8A10_ArgSwap, Thunk_460860_480012, GteState_GetIndexed_1CA8A10, bs_modulo, GteState_Set_1CA8A30, Camera_SetPackedSlots_15_16_17, OtNode24_PoolAllocLink, sub_6A5C90/6A5DB0/6A5950/6A5AD0, BattleScratch_Unwind ✔
- Caller : 0x6a4063 dans sub_6A3D90 (unique, callers.txt) ✔
- Strides en nombres : 8 (sommet), 0x0C (table projetée), 4 (OT), 0x48 (scratch), 8 (bump cursor) ✔
- Polarités : jpge/jl **signés** (jge @0x6a57b8/0x6a57d8/0x6a581d/0x6a583a, jl @0x6a57c5/0x6a57e4/0x6a5829/0x6a5846) pour coordonnées signées ✔ ; sar (arithmétique) pas shr ✔
- Largeur retour : eax résiduel BattleScratch_Unwind, aucune écriture dédiée avant retn @0x6a5948 — LIKELY/UNCERTAIN conservé, prototype `char` non démontrable ici ✔
- Nom : ≥2 preuves ASM adressées indépendantes (projection 1–3, émission 4–5) ✔

## Questions ouvertes (non bloquantes)

1. Valeur de retour perçue par caller (AL vs EAX résiduel de BattleScratch_Unwind) — à trancher côté caller 0x6A4063.
2. Sémantique fine de arg_0 (id stream/descripteur d'effet ; [arg_0+0[0]] et [arg_0+4] encore à confirmer via les sous-builders 6A5C90/6A5DB0/6A5950/6A5AD0).
3. Sémantique de [pkt+0] = &VIT_0_STATUS_MASK (offset rdata 0x01000000) : tag GPU/typage deux packets, pas un masque de statut — nom IDA à ignorer.
4. Rôle exact arg_C / dword_1CA8A30 (état GTE persistence pour le second étage ?).

## IDBCOMMENT
Builder d'effet magie battle : arg_0 pointe un descripteur dont [arg_0+4] donne le nombre de sommets a projeter. Boucle en GTE : index de bande arg_10 shl 8 sur word_11B3364, MVMVA puis GetIndexed 9/10, clamp au viewport 320x216 dans une table stride 0x0C a dword_25102C8+0xEE0. alloue un struct 0x48 par bs_modulo, emet deux packets GPU 0xE1000220 et 0xE1000240 lies a l'OT via g_BattleOTBase+arg_8*4, et lance les etages sub_6A5C90/6A5DB0 puis 6A5950/6A5AD0 avant BattleScratch_Unwind(0x48). [semantic-triple 2026-09-21]

## Notes C-R

# reconcile_notes.md — 0x6A5700 (rôle C-R)

Pack : `tools/_tmp_semantic_triple/0x6a5700/`. Entrées lues, jamais modifiées.
**ANOMALIE PACK : `c_b.c` ABSENT** (répertoire : asm.asm, c_a.c, callees/callers/globals, hexrays.c, meta.json, semantic_a.md, semantic_b.md, wiki.md). Le croisement aveugle B est repris de `semantic_b.md` (analyse sémantique, pas C). Tranché d'après逊ASM seul pour tout point sans double voix C.

## Divergences tranchées contre l'ASM

1. **Stride sortie via `int *p_out` (c_a) → erroné.** c_a déclare `p_out` `int*` mais utilise `p_out+2`/`p_out+8` comme offsets COURT/octet (ellen pointer arithmetic *4) et avance `p_out += 12` = +48 o au lieu de **+0x0C**. Tranché : pointeur `vout` BYTE-layout, avance `+0x0C` (`add esi,0xC` @6a5852). Hex-Rays (v6 `_WORD*`, `v6 += 6`) concorde.
2. **Reset [esi+8] : `mov [esi+8], bp` (ASM @6a57cd) = store WORD (bp = reg16)**, pas byte. c_a écrit `*(char*)(p_out+8)=0` (1 o). Tranché : store WORD `[esi+8..9]` (le +9 est pad, stride elt 0xC). Hex-Rays `v6[4]=0` (WORD) concorde.
3. **Cascades stores SATURATION** : c_a met les stores [esi+4]/[esi+6] APRÈS les tests (`(...)*... = v6c ;` après le if/else) et les branchements fluctuent suspendus sur une "structure à plat". ASM la séquence exacte : `cmp ax,bp` @6a5812 → **stores inconditionnels** [esi+4]=cx @6a5815, [esi+6]=dx @6a5819 → jge @6a581d (flags du cmp AVANT les stores — mov n'touche pas les flags) → saturations x (0x13F @6a582b) puis y re-fetch [esi+6] @6a5833 (0/0xD7 @6a583c/48). Tranché : stores inconditionnels AVANT cascade, y-clamp branché sur store (pas sur v68 origine — réellement identique valeur mais read-after-write reproduit).
4. **Valeur de retour** : c_a B `return (int)0 ;` avec note "NON EXÉCUTABLE" ; Hex-Rays `return BattleScratch_Unwind(72)`. ASM : **aucun write de eax** entre 6a5939 et retn @6a5948 (dernier callee = BattleScratch_Unwind) → eax = retour de BattleScratch_Unwind(0x48). Tranché : eax résiduel du callee. Type IDA 'char' suspect (probable raccourci hexrays sur AL). UNCERTAIN conservé (AL vs eax perçu par caller non prouvablepack).
5. **Table [VIT_0...?] dword [pkt]** : c_a écrit literal `0` avec note ; Hex-Rays `&VIT_0_STATUS_MASK_`. ASM @6a58b6/6a590a `mov dword ptr [eax], offset VIT_0_STATUS_MASK?` — il s'agit d'un **offset rdata** (adresse immédiate), pas 0. Tranché : adresse symbolique `&VIT_0_STATUS_MASK_` (champ inconnu : tag/prim GPU — B dit "leurre, pas un masque de statut"). UNCERTAIN sur la sémantique du champ.
6. **[esi+0Ch] b UNKNOWN** : c_a l'omerton (str assign 0x100 présent, il écrit @170 `pkt_ctl+0xC`, OK — préso). Rien à trancher : `[esi+0Ch] = 0x100` @6a5892 présent dans les deux voix + ASM.
7. **Ordre avances fin d'itération** : c_a avance pour `[esi+4]` de fa decltype parfois croisées ; ordre ASM : mov eax,[var_78] @6a584e → add esi,0xC @6a5852 → add edi,8 @6a5855 → dec → jnz @6a585d. Reproduit tel quel.

## Points de tranchage imposés (confirmés vs ASM)

1. **Boucle 1 (6a5746–6a585d)** : index bloc `shl ebx,8` @6a5712 + `add ebx,offset word_11B3364` @6a5716 ; dot signé `movsx [ebx+ecx*2]` @6a574d (éc ecx = [edi+6]) × [edi]/[edi+2], `imul`/`sar 0xC` @6a5755–5e ; SetIndexed(0, …)+Thunk MVMVA 0x12 ×2 @6a5771/76, 6a57a8/b0 ; GetIndexed 9/10 ×2 @6a5782/8e et re-fetch @6a57f1/fd ; flags @6a57ba(e1)/c7(2)/da(4)/e6(8) — branches **signed** (jge/jl) partout ; saturation 0x13F/0xD7 @6a582b/6a5848. ✔ exact.
2. **Boucle 2** : `bs_modulo(0x48)` @6a5865 ; ctl : [0]=arg_0 @6a587a, [4]=dword_25102C8+0xEE0 @6a588f, [8]=0x240 @6a5888, [0xC]=0x100 @6a5892, [0x14]=g_BattleOTBase+arg_8*4 @6a589e/58a1 ; [10] écrasé 2× plus tard. Packets : [pkt]=&VIT_0_… + pkt[1]=0xE1000220 @6a58bc puis 0xE1000240 @6a5910, chaque fois bump dword_2517A24 +8 (@6a58ac, @6a5903) et `OtNode24_PoolAllocLink` (args push pkg 1, puis p_ot — ordre push right-to-left → args (p_ot, pkt)). Entre les 2 : `GteState_Set_1CA8A30(arg_C)` @6a58d4 PUIS `Camera_SetPackedSlots_15_16_17(0,0,0)` @6a58dc. Stage builders : 6A5C90+6A5DB0 @6a58ed/f3 puis re-update [esi+0x10] @6a5925 puis 6A5950+6A5AD0 @6a592c/32. ✔ ordre reproduit.
3. **Sous-builders** : ordre call = sub_6A5C90, sub_6A5DB0 (stage 1, après packet-1 et [esi+10]=stream+stream[0]+0x10 @6a58e6), puis sub_6A5950, sub_6A5AD0 (stage 2, après packet-2 et re-update identique). Args : 1 ar chaque (push esi @6a58e3/58f2/5922/5931), __cdecl ; aucun add esp (větše calls chainais en fin 6a593e add esp,0x38 pour tout). ✔.
4. **BattleScratch_Unwind(0x48)** @6a5939 : eax de retour au retn. Confirmé point 4 du cahier.
5. **Cascade clip** : stores inconditionnels @6a5815/19 AVANT passageaux tests. Confirmé point 5 du cahier.
6. **Retour** : eax jamais écrit avant retn @6a5948. Confirmé point 6 du cahier.

## UNCERTAIN restants

- `// UNCERTAIN 0x6A5948` : largeur du retour perçue par le caller (AL vs eax) — résiduel non atte aider depuis le pack (sans xrefs caller DS dispo ici le pack donne unique caller 0x6a4063 mais pas son C).
- `// UNCERTAIN 0x6A58B6/0x6A590A` : sémantique du champ dword[0] des packets (`&VIT_0_STATUS_MASK_`, offset rdata — nom IDA probablement leurre).
- Sémantique fine de `arg_0` (stream ptr ?) et étage builders sub_6A5xxx hors périmètre (pas d'ASM dans ce pack).

## Divergences vs Hex-Rays

- Aucune sur le flux (Hex-Rays = vérificateur, concorde bloc par bloc).
- c_a divergentes corrigées (voir ci-dessus points 1–3, 5) : erreurs de stride, store byte vs word, ordre stores/cascade, literal 0 vs offset symbolique, return 0 vs eax résiduel.
- Hex-Rays `&g_BattleOTBase[a3]` = byte* arithmetic ; ASM `lea ecx,[eax+edx*4]` : stride **4** exact (pointeur de dwords), corr overridden in C.
