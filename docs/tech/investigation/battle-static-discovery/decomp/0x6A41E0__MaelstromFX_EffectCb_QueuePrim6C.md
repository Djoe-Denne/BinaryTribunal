# MaelstromFX_EffectCb_QueuePrim6C @ 0x6A41E0

- Instr (live): 295 (1010 o, 0x6A41E0-0x6A45D2)
- Palier: 2+1
- Verdict: LIKELY - callback registered de la sous-task Maelstrom (xref data 0x6A3DCE dans sub_6A3D90, appelle [arg_4] @0x701D96) : garde (s16)[+1C]|[dword +18]==0 et (s16)[+24]>=0x1000 signé (jl @0x6A41FB, dword[+20]!=0) ; scratch 0x6C (bs_modulo @0x6A420D/Unwind @0x6A45C2) ; lien anim *a1+tbl[sx16(P+2)] stride 4 @base+8 ; point d'ancrage arbre w28==w2A / w26==0 / w26==0x1000 (facteur w2A movsx) / sub_701390 5 args (5e=[r+10h] dword OUT tampon 25102C8+0xCE8 rechargé @0x6A42AC) ; 3 modes GTE (0x1000 dual-GTE + 0x200 movsx signé / défaut word-add 16-bit wrap @0x6A43E5-EC), caméra dword_1D9778C/90/94 ; skip identité 0x10001000+0x1000 ; matrice Q12 via sub_7015B0 (test 0x40000 @0x6A42B5) ou sub_701310, MulQ12_IntoArg0 (test ah,1) vs ScaleByVec12 ; mot GPU 0x2030 @0x6A4510 / 0x20F0 @0x6A4525 ; mode '9' court-circuite sub_701DD0 (jmp @0x6A4581 vers sub_6A45E0 @0x6A457C), '1' @0x6A4583-9B tombe dans l'insertion commune ; insertion sub_701DD0 (esi, g_BattleOTBase+0x44 @0x6A4575, 2, dword_2517A24) @0x6A45B3, tête persistée dword_2517A24 @0x6A45BB ; retour EAX = clobber BattleScratch_Unwind (dispatcher ignore eax, sondage @0x701D9A), proto char IDA trompeur
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A41E0\nTYPE ; proposition: MaelstromFX_EffectCb_QueuePrim6C
- Notes parent: checks 5.6 OK : and 7Fh step (0x6A4595-98), movsx [ebx+0Ch] (0x6A4532), mots GPU 2030h/20F0h (0x6A4510/25), add edx,44h (0x6A4575), mode '9' jmp short (0x6A4581) + call sub_6A45E0 (0x6A457C), call sub_701DD0 (0x6A45B3), write-back dword_2517A24 (0x6A45BB), Unwind + retn (0x6A45C2-D1), reload edx,[ebx+10h] (0x6A42AC), caller data xref sub_6A3D90 @0x6a3dce ; R sondage live : dispatcher 0x701D96/0x701D9A ignore eax ; C-R : 9 s16 diag (Hex-Rays 3 dwords rejeté)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A41E0 @ 0x6A41E0 (callback FX battle, magie/Maelstrom)
 * ----------------------------------------------------------------------------
 * Rôle C-R (réconciliateur) — triple 2+1. Voix A = c_a.c, voix B = c_b.c.
 * GROUND TRUTH = live ASM (asm.asm, 295 instr / 1010 octets, 0x6A41E0..0x6A45D1).
 * hexrays.c = vérificateur SEULEMENT. Aucune moyenne : chaque point tranché
 * cite l'adresse ASM (voir reconcile_notes.md pour les verdicts A vs B).
 *
 * Métadonnées :
 *   Instr (live) : 295 (0x6A41E0..0x6A45D1, 1010 o) — traité d'un bloc (<600).
 *   Palier       : triple 2+1 (campagne mag FX battle).
 *   Type IDA     : 'char __cdecl(_DWORD *, int, int)' — proto TROMPEUR sur la
 *                  largeur de retour (voir note RETOUR en fin de fichier).
 *   Sauvegardes  : callee-saved edi (push @0x6A41E3) + ebx/ebp/esi (push
 *                  @0x6A4208-0x6A420A) ; cadre esp+48h. Non-volatile : edi,
 *                  ebx, ebp, esi ; eax/ecx/edx libres.
 *   Corrections add esp : 0x6A4222 (+4, bs_modulo), 0x6A42AF (+14h,
 *                  sub_701390 = 5 args), 0x6A42EB (+8, 7015B0/701310),
 *                  0x6A4384 (+20h, cumul 8 pushes voie 0x1000), 0x6A43D6
 *                  (+0Ch, voie 0x200), 0x6A4431 (+14h, voie défaut),
 *                  0x6A44CB/+8 et 0x6A44F7/+8 (Mat3*), 0x6A4517 (+8),
 *                  0x6A45B8 (+10h, sub_6A45E0/sub_701DD0 = 4 args),
 *                  0x6A45C7 (+4, BattleScratch_Unwind).
 *
 * Convention : cdecl, args poussés droite -> gauche, callee-dépilés.
 * Aucune library call inventée : seuls les callees de callees.txt apparaissent.
 * ========================================================================== */

/* ---- Externes (noms IDA live ; arité prouvée par les `add esp` de l'ASM) -- */
extern unsigned int bs_modulo(int nbytes);            /* 0x5082B0 — alloc scratch ; +4 @0x6A4222 */
extern void sub_701390(unsigned int entry, short a, short b, short c,
                       unsigned int ptrOut);          /* 5 args, +14h @0x6A42AF */
extern void sub_7015B0(void *src, unsigned int *dstMat); /* 2 args, +8 (voie 0x40000) */
extern void sub_701310(void *src, unsigned int *dstMat); /* 2 args, +8 (défaut) */
extern void Field_readCa(unsigned int *mtxSrc);       /* 1 arg */
extern void setSomeDword5(void *src);                 /* 1 arg */
extern void Thunk_460860_486012(void);                /* thunk MVMVA 0x12 via sub_460860(0x28e) */
extern void GteState_Get_1CA8A74(unsigned int *dstXYZ); /* copie 3 dwords 1CA8A74/78/7C */
extern void sub_56C270(unsigned int *mtxSrc, unsigned int *mat); /* 2 args */
extern void Mat3S16_MulQ12_IntoArg0(unsigned int *mat, short *m9); /* 2 args, +8 ; résultat dans arg0 */
extern void Mat3S16_ScaleByVec12(unsigned int *mat, int *vec3);    /* 2 args, +8 ; 9 s16 * vec s32 >>12 */
extern void Field_readCaPre(unsigned int *mat);       /* 1 arg */
extern void preCamReadVariables_Space(unsigned int *mat); /* 1 arg */
extern unsigned int sub_6A45E0(void *elem, unsigned int ot, int two,
                               unsigned int list);    /* 4 args (mode '9') */
extern unsigned int sub_701DD0(void *elem, unsigned int ot, int two,
                               unsigned int list);    /* 4 args, +10h (défaut + mode '1') */
extern void BattleScratch_Unwind(int nbytes);         /* 1 arg, +4 ; inverse de bs_modulo */

/* ---- Globales (globals.txt) ---------------------------------------------- */
extern unsigned int dword_1D97778;   /* container matrice GTE A (camera) */
extern unsigned int dword_1D9778C;   /* translation caméra X @0x6A443E */
extern unsigned int dword_1D97790;   /* translation caméra Y @0x6A4434 */
extern unsigned int dword_1D97794;   /* translation caméra Z @0x6A4451 */
extern unsigned int dword_2517A24;   /* tête de liste draw (écrite @0x6A45BB) */
extern unsigned int dword_2517A80[8];/* container matrice GTE B (2e bank) */
extern unsigned int g_BattleOTBase;  /* base OT battle ; utilisée à +0x44 octets */

/* ---- Mapping pile (esp relatif, refs ASM) ---------------------------------
 *   var_48 : -48h, 6 o  = 3 s16 offsets (off0/off1/off2 depuis blob+08/0A/0C)
 *   var_40 : -40h..-2Fh = 18 o : m9[9] (9 s16) OU 3 s32 via (int*)&m9[0/2/4]
 *   var_20 : -20h..-0Dh = 20 o : mat (5 dwords, rempli par 7015B0/701310)
 *   var_C  : -0Ch..-5h  = gte[3] dwords (var_C/var_8/var_4)
 * -------------------------------------------------------------------------- */

#define SCRATCH_SIZE 0x6C          /* 0x6A420B push 6Ch / 0x6A45C0 push 6Ch */

char __cdecl sub_6A41E0(unsigned int *a1, int a2, int a3)
{
    unsigned char *P = (unsigned char *)a2;  /* blob état instance FX (edi) */
    unsigned char *C = (unsigned char *)a3;  /* contexte sous-task (ebx)    */
    unsigned int  scratch;                   /* esi — 0x6C o via bs_modulo  */
    unsigned int  entry, entryBase;
    unsigned int  flags;                     /* ebp (rechargé @0x6A42DC)    */
    short off0, off1, off2;                  /* var_48/46/44 */
    short w28, w2A, w26, stepv, idx;
    unsigned char tblByte;
    unsigned int mat_storage[5];  unsigned int *mat  = mat_storage;   /* var_20 */
    short         m9_storage[9];   short         *m9   = m9_storage;    /* var_40 */
    unsigned int  gte_storage[3]; unsigned int  *gte  = gte_storage;    /* var_C  */
    short         offv_storage[3]; short         *offv = offv_storage;   /* var_48 */

    /* ==================== bloc 1 : 0x6A41E0..0x6A4207 — gardes ==================== */
    /* 0x6A41E8 movsx eax, word [edi+1Ch] ; 0x6A41EC or eax, [edi+18h] ; jz exit */
    if ((*(short *)(P + 0x1C) | *(int *)(P + 0x18)) == 0)
        return 0;                              /* -> 0x6A45CD ; eax = 0 à la sortie */

    /* 0x6A41F5 cmp word [edi+24h], 1000h ; jl continue (SIGNED — s16 vs 0x1000) ;
     * sinon 0x6A4200 test dword [edi+20h] ; jz exit */
    if ((*(short *)(P + 0x24) >= 0x1000) && (*(int *)(P + 0x20) == 0))
        return 0;                              /* -> 0x6A45CD ; eax = 0 */

    /* ==================== bloc 2 : 0x6A4208..0x6A422B — scratch + entrée ========= */
    /* push ebx/ebp/esi ; push 6Ch ; call bs_modulo @0x6A420D ; add esp,4 @0x6A4222 */
    scratch = bs_modulo(SCRATCH_SIZE);         /* alloc scratch 0x6C o (108) */

    idx       = *(short *)(P + 0x02);          /* 0x6A4218 movsx word [edi+2] */
    entryBase = *a1;                           /* 0x6A421C mov eax, [ecx]     */
    /* 0x6A4225 mov ecx, [eax+edx*4+8] — table d'offsets dword, stride 4, header 8
     * 0x6A4229 add eax, ecx — base + offset indexé */
    entry = entryBase + *(unsigned int *)(entryBase + idx * 4 + 8);
    *(unsigned int *)scratch = entry;          /* 0x6A422B [scratch+00] = ptr entrée */

    /* ============ bloc 3 : 0x6A422D..0x6A42B5 — [scratch+04] point d'ancrage =====
     * Trois variantes, ordre exact des tests :
     *   1) 0x6A4235 cmp w28,w2A (égalité 16-bit) ;
     *   2) 0x6A425D test w26 ; 3) 0x6A426F cmp w26,1000h ; sinon sous-appel. */
    w28 = *(short *)(P + 0x28);                /* 0x6A422D (word, cx) */
    w2A = *(short *)(P + 0x2A);                /* 0x6A4231 (word, dx) */
    if (w28 == w2A) {                          /* 0x6A4235 jnz -> 0x6A4259 */
        if (w28 != 0)                          /* 0x6A423A test cx,cx ; jnz -> formule */
            goto formula_w28;                  /* 0x6A4247 — formule strided, facteur w28 */
        *(unsigned int *)(scratch + 4) = entry + 0x0C;   /* 0x6A423F add eax,0Ch */
        goto flags_rot;                        /* 0x6A4245 jmp */
    }
    w26 = *(short *)(P + 0x26);                /* 0x6A4259 mov bp (word) */
    if (w26 == 0) {                            /* 0x6A425D test bp,bp ; jnz -> 0x6A426F */
        if (w28 != 0)                          /* 0x6A4262 test cx,cx ; jnz -> formule */
            goto formula_w28;                  /* 0x6A4247 */
        *(unsigned int *)(scratch + 4) = entry + 0x0C;   /* 0x6A4267 */
        goto flags_rot;                        /* 0x6A426D */
    }
    if (w26 == 0x1000) {                       /* 0x6A426F cmp bp,1000h ; jnz -> sous-appel */
        if (w2A != 0) {                        /* 0x6A4276 test dx,dx ; jnz -> formule */
            /* 0x6A4283..4293 — formule strided, facteur w2A (movsx SIGNED) */
            *(unsigned int *)(scratch + 4) =
                entry + *(int *)(entry + 4) * (int)w2A * 8 + 0x0C;  /* lea [eax+ecx*8+0Ch] */
            goto flags_rot;                    /* 0x6A4293 */
        }
        *(unsigned int *)(scratch + 4) = entry + 0x0C;   /* 0x6A427B */
        goto flags_rot;                        /* 0x6A4281 */
    }
    /* 0x6A4295..0x6A42B2 — chemin sous-appel ; pushes droite->gauche :
     * [ebx+10h] (0x6A4295/98), movsx w26 (0x6A4299), movsx w2A (0x6A429D),
     * movsx w28 (0x6A42A0), entry (eax). call sub_701390 @0x6A42A7 ; +14h. */
    sub_701390(entry, w28, w2A, w26, *(unsigned int *)(C + 0x10));
    /* 0x6A42AC mov edx, [ebx+10h] — RELECTURE dword après l'appel :
     * la callee écrit un pointeur dans [C+10h] (ou le laisse tel quel). */
    *(unsigned int *)(scratch + 4) = *(unsigned int *)(C + 0x10);   /* 0x6A42B2 */
    // UNCERTAIN 0x6A42A7 — type réel du 5e arg ([C+10h]) : dword chargé/rechargé
    // prouvé (0x6A4295, 0x6A42AC), réécriture par la callee probable mais non
    // prouvée depuis ce seul ASM ; "pointeur sur quoi" non tranché.

formula_w28:   /* == 0x6A4247 : formule strided, facteur w28 */
    /* 0x6A424A mov ecx,[eax+4] (dword) ; 0x6A424D movsx edx,cx (SIGNED) ;
     * 0x6A424D imul ecx,edx (32-bit SIGNED) ; 0x6A4250 lea eax,[eax+ecx*8+0Ch] */
    *(unsigned int *)(scratch + 4) =
        entry + *(int *)(entry + 4) * (int)w28 * 8 + 0x0C;

flags_rot:     /* == 0x6A42B5 */
    /* ======== bloc 4 : 0x6A42B5..0x6A42DB — copie matrice locale (var_20) ========
     * POLARITÉ 0x40000 : test dword [edi+4],40000h @0x6A42B5 (NON signé, pas de jl
     * ici — le jl signé est @0x6A41FB sur word[+24h] vs 0x1000).
     * bit SET   -> sub_7015B0 ([edi+10h], &var_20) @0x6A42C7 ;
     * bit CLEAR -> sub_701310 ([edi+10h], &var_20) @0x6A42D7. 2 args, +8. */
    if (*(unsigned int *)(P + 4) & 0x40000)
        sub_7015B0(P + 0x10, mat);             /* 0x6A42C7 */
    else
        sub_701310(P + 0x10, mat);             /* 0x6A42D7 */

    /* ====== bloc 5 : 0x6A42DC..0x6A4433 — offset xyz + GTE + camera (3 modes) ==== */
    flags = *(unsigned int *)(P + 4);          /* 0x6A42DC mov ebp,[edi+4] */
    off0 = *(short *)(P + 0x08);               /* 0x6A42DF (word, ax) */
    off1 = *(short *)(P + 0x0A);               /* 0x6A42E3 (word, cx) */
    off2 = *(short *)(P + 0x0C);               /* 0x6A42E7 (word, dx) */
    offv[0] = off0; offv[1] = off1; offv[2] = off2;  /* 0x6A42EE..0x6A42FE */

    if (flags & 0x1000) {                      /* 0x6A42F3 test ebp,1000h — DUAL-GTE */
        Field_readCa(&dword_1D97778);          /* 0x6A430E (push offset) */
        setSomeDword5(C);                      /* 0x6A4314 (push ebx) */
        Thunk_460860_486012();                 /* 0x6A4319 — MVMVA 0x12 */
        GteState_Get_1CA8A74(gte);             /* 0x6A4323 -> &var_C */
        Field_readCa(dword_2517A80);           /* 0x6A432D (push offset dword_2517A80) */
        setSomeDword5(offv);                   /* 0x6A4337 -> &var_48 */
        Thunk_460860_486012();                 /* 0x6A433C */
        GteState_Get_1CA8A74((unsigned int *)m9);  /* 0x6A4346 -> &var_40 */
        /* 0x6A434B..0x6A4374 : adds DWORD — var_C += var_40 ; var_8 += var_3C ;
         * var_4 += var_38 (m9 réinterprété en 3 s32 via (int*)&m9[0/2/4]) */
        gte[0] += *(int *)&m9[0];
        gte[1] += *(int *)&m9[2];
        gte[2] += *(int *)&m9[4];
        sub_56C270(dword_2517A80, mat);        /* 0x6A437F — (dword_2517A80, &var_20) ;
                                                * add esp,20h @0x6A4384 = cumul des 8 pushes */
        goto cam_add;                          /* 0x6A4387 jmp */
    }
    else if (flags & 0x200) {                  /* 0x6A438C test ebp,200h — offsets SIGNED */
        Field_readCa(&dword_1D97778);          /* 0x6A4399 */
        setSomeDword5(C);                      /* 0x6A439F */
        Thunk_460860_486012();                 /* 0x6A43A4 */
        GteState_Get_1CA8A74(gte);             /* 0x6A43AE -> &var_C */
        /* 0x6A43B3..0x6A43DF : movsx s16 puis adds 32 bits :
         * var_8 += var_46 (0x6A43C5) ; var_C += var_48 (0x6A43C7) ;
         * var_4 += var_44 (0x6A43D9). add esp,0Ch @0x6A43D6. */
        gte[0] += off0;                        /* 0x6A43C7 */
        gte[1] += off1;                        /* 0x6A43C5 */
        gte[2] += off2;                        /* 0x6A43D9 */
        goto cam_add;                          /* 0x6A43E3 jmp */
    }
    else {                                     /* 0x6A43E5 — DÉFAUT : WORD-ADD (wrap 16-bit) */
        /* add ax,[ebx] / add cx,[ebx+2] / add dx,[ebx+4] — adds 16 BITS,
         * PAS des adds 32 bits (wrap u16 sur off0/1/2). */
        off0 = (short)(off0 + *(unsigned short *)(C + 0));   /* 0x6A43E5 */
        off1 = (short)(off1 + *(unsigned short *)(C + 2));   /* 0x6A43E8 */
        off2 = (short)(off2 + *(unsigned short *)(C + 4));   /* 0x6A43EC */
        offv[0] = off0; offv[1] = off1; offv[2] = off2;      /* 0x6A43F5..0x6A43FF */
        Field_readCa(&dword_1D97778);          /* 0x6A4404 */
        setSomeDword5(offv);                   /* 0x6A440E -> &var_48 */
        Thunk_460860_486012();                 /* 0x6A4413 */
        GteState_Get_1CA8A74(gte);             /* 0x6A441D -> &var_C */
        sub_56C270(&dword_1D97778, mat);       /* 0x6A442C — add esp,14h @0x6A4431 */
    }

cam_add:       /* == 0x6A4434 : translation caméra globale (tous chemins) */
    /* 0x6A4434 ecx=dword_1D97790 -> var_8 ; 0x6A443E eax=dword_1D9778C -> var_C ;
     * 0x6A4451 edx=dword_1D97794 -> var_4 (adds DWORD). */
    gte[1] += dword_1D97790;                   /* 0x6A4434/0x6A4447 */
    gte[0] += dword_1D9778C;                   /* 0x6A443E/0x6A4457 */
    gte[2] += dword_1D97794;                   /* 0x6A4451/0x6A445C */

    /* ====== bloc 6 : 0x6A4459..0x6A44FB — rotation/échelle Q12 (skip identité) === */
    /* 0x6A445E cmp dword [edi+18h], 10001000h ; 0x6A446D cmp word [edi+1Ch], 1000h :
     * skip si (w18==0x1000 && w1A==0x1000) && w1C==0x1000 -> 0x6A44FA. */
    if (!(*(int *)(P + 0x18) == 0x10001000 && *(short *)(P + 0x1C) == 0x1000)) {
        if (*(int *)(P + 4) & 0x100) {         /* 0x6A447C test ah,1 — POLARITÉ 0x0100 :
                                                * SET -> Mat3S16_MulQ12_IntoArg0 ;
                                                * CLEAR -> Mat3S16_ScaleByVec12 */
            /* 0x6A4481..0x6A44C6 : m9 = matrice diagonale 9 s16 —
             * m9[0]=w[+18h] (var_40 @0x6A448D), m9[4]=w[+1Ah] (var_38 @0x6A4492),
             * m9[8]=w[+1Ch] (var_30 @0x6A44A3) ; tous les autres mots = 0
             * (bp=0 : 0x6A44A8/AD/B2/B7/BC/C1). PAS 3 dwords packés. */
            m9[0] = *(short *)(P + 0x18);
            m9[1] = 0; m9[2] = 0; m9[3] = 0;
            m9[4] = *(short *)(P + 0x1A);
            m9[5] = 0; m9[6] = 0; m9[7] = 0;
            m9[8] = *(short *)(P + 0x1C);
            Mat3S16_MulQ12_IntoArg0(mat, m9);  /* 0x6A44C6 — résultat dans arg0 (mat) ; +8 */
            goto scale_after;                  /* 0x6A44CE jmp 0x6A44FC */
        } else {
            /* 0x6A44D0..0x6A44F2 : movsx s16 -> 3 s32 (var_40/3C/38) —
             * vecteur d'échelle SIGNÉ (movsx, pas mov). */
            *(int *)&m9[0] = *(short *)(P + 0x18);   /* 0x6A44D0 movsx */
            *(int *)&m9[2] = *(short *)(P + 0x1A);   /* 0x6A44D4 movsx */
            *(int *)&m9[4] = *(short *)(P + 0x1C);   /* 0x6A44D8 movsx */
            Mat3S16_ScaleByVec12(mat, (int *)m9);    /* 0x6A44F2 — 9 s16 * vec s32 >>12 ; +8 */
        }
    }
    /* 0x6A449F / 0x6A44FA : xor ebp,ebp — ebp = 0 sur les DEUX chemins. */
scale_after:
    /* ebp = 0 ici (les deux branches convergent avec ebp = 0). */

    /* ====== bloc 7 : 0x6A44FC..0x6A4555 — projection + remplissage prim 0x6C ====== */
    Field_readCaPre(mat);                      /* 0x6A4501 (push &var_20) */
    preCamReadVariables_Space(mat);            /* 0x6A450B ; add esp,8 @0x6A4517 */

    *(unsigned int *)(scratch + 0x1C) = 0x2030;          /* 0x6A4510 — ANCRE : mot GPU initial (dword write) */

    stepv = *(short *)(P + 0x24);              /* 0x6A451A movsx */
    *(unsigned int *)(scratch + 0x0C) = stepv; /* 0x6A4520 (dword write) */
    if (stepv != 0) {                          /* 0x6A4523 cmp eax, ebp(0) */
        *(unsigned int *)(scratch + 0x1C) = 0x20F0;      /* 0x6A4525 — mot GPU alternatif (dword write) */
        *(unsigned int *)(scratch + 0x08) = *(unsigned int *)(P + 0x20);  /* 0x6A452C (dword) */
    }

    /* 0x6A4532 movsx ecx, word [ebx+0Ch] ; 0x6A4536 mov [esi+18h], ecx (dword,
     * extension signée du word blob+0x0C) — côté producteur (0x6A3DBA) hors pack. */
    *(unsigned int *)(scratch + 0x18) = *(short *)(C + 0x0C);

    /* 0x6A4539 mov ecx, 100h ; mots d'init (writes WORD) : */
    *(unsigned short *)(scratch + 0x20) = 0;   /* 0x6A4542 */
    *(unsigned short *)(scratch + 0x22) = 0;   /* 0x6A453E (bp=0) */
    *(unsigned short *)(scratch + 0x24) = 0;   /* 0x6A454A */
    *(unsigned short *)(scratch + 0x26) = 0;   /* 0x6A4546 */
    *(unsigned short *)(scratch + 0x28) = 0x100;   /* 0x6A4552 */
    *(unsigned short *)(scratch + 0x2A) = 0x100;   /* 0x6A454E */

    /* 0x6A4556 movsx edx, word [edi+2] ; 0x6A455A mov eax,[ebx+8] ;
     * 0x6A455D mov al, [eax+edx] — byte de table mode, indexé par le même idx. */
    tblByte = *(unsigned char *)(*(unsigned int *)(C + 8) + (int)idx);

    /* ====== bloc 8 : 0x6A4556..0x6A45B7 — mode '1'/'9' + insertion OT ============= */
    if (tblByte == 0x31 /* '1' */) {           /* 0x6A4560 jz -> 0x6A4583 */
        /* Branche '1' : init UV/teinte PUIS TOMBE dans l'insertion commune
         * (pas de goto séparé — 0x6A4595..0x6A459B enchaîne sur 0x6A459F). */
        *(unsigned short *)(scratch + 0x2C) = 0;       /* 0x6A4583 (bp=0) */
        *(unsigned short *)(scratch + 0x2E) = 0;       /* 0x6A4587 */
        *(unsigned short *)(scratch + 0x32) = 0x80;    /* 0x6A458B — ANCRE alpha 128 */
        *(unsigned short *)(scratch + 0x30) = 0x100;   /* 0x6A4591 (cx=100h) */
        /* 0x6A4595 mov al, [ebx+0Eh] ; 0x6A4598 and eax, 7Fh — step masqué 0x7F ;
         * 0x6A459B mov [esi+22h], ax (word write, écrase l'init 0 de +22h). */
        *(unsigned short *)(scratch + 0x22) =
            (unsigned short)(*(unsigned char *)(C + 0x0E) & 0x7F);
    }

    if (tblByte == 0x39 /* '9' */) {           /* 0x6A4564 (depuis 0x6A4560 non pris) */
        /* Pushes droite->gauche @0x6A4568..0x6A457B :
         * dword_2517A24 (0x6A4574), 2 (0x6A4578), g_BattleOTBase+0x44
         * (mov edx,g_BattleOTBase ; add edx,44h @0x6A456E/75), esi (0x6A457B).
         * call sub_6A45E0 @0x6A457C ; jmp 0x6A45B8 (add esp,10h). */
        dword_2517A24 = sub_6A45E0((void *)scratch, g_BattleOTBase + 0x44, 2,
                                   dword_2517A24);
        goto unwind;
    }

    /* ---- insertion OT commune (0x6A459F..0x6A45BB) ---- */
    /* Pushes droite->gauche @0x6A459F..0x6A45B2 : dword_2517A24 (0x6A45AB),
     * 2 (0x6A45AF), g_BattleOTBase+0x44 (add edx,44h @0x6A45AC), esi (0x6A45B2).
     * call sub_701DD0 @0x6A45B3 ; add esp,10h @0x6A45B8 ;
     * 0x6A45BB mov dword_2517A24, eax. */
    dword_2517A24 = sub_701DD0((void *)scratch, g_BattleOTBase + 0x44, 2,
                               dword_2517A24);

unwind:

    /* ====== bloc 9 : 0x6A45B8..0x6A45D1 — chaînage + unwind + sortie ============== */
    /* dword_2517A24 = eax (retour de sub_6A45E0 si '9', sinon de sub_701DD0)
     * — fait dans les affectations ci-dessus (0x6A45BB). */
    /* 0x6A45C0 push 6Ch ; 0x6A45C2 call BattleScratch_Unwind ; add esp,4 @0x6A45C7.
     * IMPORTANT : BattleScratch_Unwind ÉCRASE eax AVANT le retn @0x6A45D1 —
     * le retour effectif de la fonction sur le chemin succès est celui de
     * BattleScratch_Unwind (non contractualisé), PAS la tête de liste. */
    BattleScratch_Unwind(SCRATCH_SIZE);
    /* 0x6A45CA pop esi ; 0x6A45CB pop ebp ; 0x6A45CC pop ebx ; 0x6A45CD pop edi ;
     * 0x6A45CE add esp,48h ; 0x6A45D1 retn. */
    return 0; /* VALEUR NON CONTRACTUELLE — eax = résidu de BattleScratch_Unwind.
               * Seuls les early-exits (0x6A41EF / 0x6A4202) retournent eax = 0
               * (prouvé : jz pris => eax == 0 dans les deux gardes). */
}

/* ============================================================================
 * NOTE RETOUR (tranchée contre l'ASM @0x6A45BB..0x6A45D1)
 * ----------------------------------------------------------------------------
 * Le proto IDA 'char' sous-dimensionne la sortie : eax est bien un dword.
 * MAIS la voix B affirmait « Retour EAX 32 bits = tête de liste » : FAUX.
 * Séquence ASM : call sub_6A45E0/sub_701DD0 -> eax (tête de liste) ->
 * mov dword_2517A24, eax @0x6A45BB -> push 6Ch @0x6A45C0 ->
 * call BattleScratch_Unwind @0x6A45C2 (CLOBBER eax) -> retn @0x6A45D1.
 * Donc : la tête de liste est bien PERSISTÉE via dword_2517A24 (globale),
 * mais la valeur retournée par sub_6A41E0 sur le chemin succès = eax de
 * BattleScratch_Unwind (inconnu). Hex-Rays est d'accord (L192 :
 * "return BattleScratch_Unwind(108);"). Early-exits : eax = 0.
 *
 * UNCERTAIN RESTANTS (voir reconcile_notes.md) :
 *  U1 0x6A45D1 — eax de sortie (BattleScratch_Unwind) consommé par le
 *      dispatcher sub_701970/sub_6A3D90 ? Non prouvé depuis asm.asm.
 *  U2 0x6A42A7 — type du pointee [C+10h] (5e arg sub_701390) : dword prouvé,
 *      réécriture par la callee probable (relecture 0x6A42AC) mais non prouvée.
 *  U3 0x6A4510/0x6A4525 — sémantique des tags GPU 0x2030/0x20F0 (type de prim
 *      / format) : valeurs ancrées, signification non prouvée ici.
 *  U4 0x6A452C — [esi+08h] = dword [edi+20h] : pointeur ou compteur ? Non tranché.
 *  U5 Côté producteur (step<<5 @0x6A3DBA, word 0xFF80 @blob+0x0C, trou +06..07)
 *     : 0x6A3DBA est dans sub_6A3D90, HORS asm.asm de ce pack — non vérifiable
 *     ici. Côté consommateur prouvé : movsx word [ebx+0Ch] @0x6A4532 ;
 *     mov al,[ebx+0Eh] + and 7Fh @0x6A4595/98 ; aucun accès [ebx+6] (trou
 *     +06..07 confirmé côté lecture : refs ebx = +0/+2/+4 @0x6A43E5-EC,
 *     +8 @0x6A455A, +0Ch @0x6A4532, +0Eh @0x6A4595, +10h @0x6A4295/AC).
 * ========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A41E0 @ 0x6A41E0 (réconciliation R)

- Rôle (1 phrase) : callback par frame enregistré par la sous-task Maelstrom (sub_6A3D90 via le dispatcher sub_701970) qui transforme une instance d'effet magie (ancrage interpolé, rotation/échelle Q12, GTE + caméra) puis construit une primitive de 0x6C octets dans le scratch arena et la chaîne dans l'OT battle à g_BattleOTBase+0x44.
- Verdict : LIKELY consolidé (barre CERTAIN non atteinte : wiki.md vide — échec qmd ; tout le reste — callers, callees, producteur du blob, dispatcher, opcodes — est aligné et vérifié en lecture IDA live).
- Confiance : LIKELY (fort) — callers + callees + producteur + dispatcher + opcodes cités ; seul le recoupage wiki manque.
- Nom catalogue : sub_6A41E0 (anonyme) ; proto IDA `char __cdecl(_DWORD *, int, int)` trompeur sur la largeur de retour (eax 32 bits, valeur non contractualisée).

## Nom proposé (markdown seul, PAS de rename)

`MaelstromFX_EffectCb_QueuePrim6C`

≥2 preuves ASM indépendantes adressées :
1. **Cb (callback)** : xref data unique `0x6A3DCE push offset sub_6A41E0` dans sub_6A3D90, passé au dispatcher sub_701970 qui l'invoque en `0x701D96 call [esp+5Ch+arg_4]` (indirect call, une fois par pas, eax ignoré @0x701D9A) → c'est un callback d'effet de la famille Maelstrom (BattleMagic_M207), pas un rendu de nœud générique.
2. **QueuePrim** : `0x6A45B3 call sub_701DD0` (et `0x6A457C call sub_6A45E0` pour le mode '9') avec args `esi` (prim 0x6C), `g_BattleOTBase+0x44` (`0x6A45AC add edx,44h`), `2` (@0x6A45AF), `dword_2517A24` (@0x6A45AB) ; tête de liste persistée `0x6A45BB mov dword_2517A24, eax`.
3. (appui) Prim de 0x6C octets : `0x6A420B push 6Ch; call bs_modulo` ↔ `0x6A45C0 push 6Ch; call BattleScratch_Unwind`.

Le nom de A (« MagFx_EffectNodeRender_DrawToOT ») est rejeté : « EffectNodeRender » suggère un rendu de nœud d'arbre d'effet générique, alors que la registration est spécifique à la sous-task Maelstrom (xref data unique @0x6A3DCE dans BattleMagic_M207_Maelstrom_SubTaskTick) et que la sortie est un enqueue de primitive 0x6C dans l'OT, pas un draw direct. Le nom de B (« MaelstromFX_EffectCb_QueueParticlePrim ») est retenu dans l'esprit, affiné en « QueuePrim6C » pour ancrer la taille prouvée de la primitive (0x6C, `push 6Ch` @0x6A420B).

## In / Out / Effets

**In (cdecl, 3 args)**
- `arg_0` (a1, dword*) : arbre de données FX — `0x6A421C mov eax,[ecx]` = base ; table d'offsets dwords à `base+8`, **stride 4**, indexée par le word signé `[edi+2]` (`0x6A4225 mov ecx,[eax+edx*4+8]`) ; rangées d'ancrage : `base + dword[entry+4] * (s16 sel) * 8 + 0xC` (`0x6A424A mov ecx,[eax+4]` dword, `0x6A424D movsx` SIGNÉ, `0x6A4250 lea eax,[eax+ecx*8+0Ch]`).
- `arg_4` → edi : état d'instance FX — `+0x02` word idx (index table + char de mode) ; `+0x04` dword flags (0x40000, 0x1000, 0x200, 0x0100) ; `+0x08/+0x0A/+0x0C` offsets locaux 3×s16 ; `+0x10` matrice source (7015B0/701310) ; `+0x18..+0x1C` rot/scale Q12 (identité 0x1000) ; `+0x20` dword param ; `+0x24` word scalaire Q12 (garde ≥0x1000 signé, tag GPU) ; `+0x26/+0x28/+0x2A` sélecteurs d'ancrage.
- `arg_8` → ebx : blob 0x14 o produit par sub_6A3D90 (**producteur désormais ancré**, voir D2) — `+0x00/+0x04` dwords `[ebx+28h]/[ebx+2Ch]` (consommés en words position défaut @0x6A43E5-EC) ; `+0x08` ptr table de chars de mode `"00900901"` (@0x6A3DDF, consommé @0x6A455A-60) ; `+0x0C` word 0xFF80 (@0x6A3DD8, movsx @0x6A4532) ; `+0x0E` byte = bas de `step<<5` (@0x6A3DBA `shl eax,5`, masque `and 7Fh` @0x6A4598) ; `+0x10` ptr sortie interpolation = `dword_25102C8+0xCE8` (@0x6A3DC8, arg 5 de sub_701390 @0x6A4295, relecturé @0x6A42AC).

**Out**
- Retour EAX **32 bits** mais **non contractualisé** : chemin succès → eax = résidu de `BattleScratch_Unwind` (clobber @0x6A45C2 avant `retn` @0x6A45D1) ; early-exits (`0x6A41EF`, `0x6A4202`) → eax = 0. **Le dispatcher ignore eax** : après `0x701D96 call [arg_4]`, `0x701D9A mov eax,[esp+5Ch+var_40]` recharge le compteur — valeur de retour jamais lue.
- Effet de bord principal : prim 0x6C enchaînée dans l'OT (sub_701DD0 défaut/mode '1', sub_6A45E0 mode '9') ; `dword_2517A24` (tête de liste) mise à jour @0x6A45BB dans les DEUX cas (le `jmp 0x6A45B8` du mode '9' retombe sur `add esp,10h` puis `0x6A45BB`).

**Effets / phases (scratch 0x6C = esi)**
1. **Gardes** @0x6A41E8-02 : `(s16)[edi+1Ch] | dword[edi+18h] == 0` → no-op ; `(s16)[edi+24h] >= 0x1000` (**jl signé** @0x6A41FB, s16 vs 0x1000) ET `dword[edi+20h] == 0` → no-op.
2. **Alloc/lib scratch** : `push 6Ch; call bs_modulo` @0x6A420B-0D ↔ `push 6Ch; call BattleScratch_Unwind` @0x6A45C0-C2 (paire symétrique, inverse de bs_modulo 0x5082B0 d'après callees.txt).
3. **Ancrage** `[esi+0]` = base + table[idx] (stride 4, header 8) @0x6A421C-2B ; `[esi+4]` = point d'ancrage, 3 variantes dans l'ordre : w28==w2A (0x6A4235) → w26==0 (0x6A425D) → w26==0x1000 (0x6A426F) → sinon `sub_701390(entry, w28, w2A, w26, [ebx+10h])` @0x6A42A7 (5 args, `add esp,14h` @0x6A42AF), relecture `[ebx+10h]` @0x6A42AC. Formule commune : `entry + dword[entry+4] * (s16)sel * 8 + 0xC`.
4. **Matrice locale** : bit 0x40000 (`0x6A42B5 test dword[edi+4],40000h`, test binaire, PAS de jl) → SET `sub_7015B0` @0x6A42C7, CLEAR `sub_701310` @0x6A42D7.
5. **3 modes GTE/caméra** : 0x1000 (`0x6A42F3`) → double GTE + adds DWORD (0x6A434B-74) + `sub_56C270(dword_2517A80,…)` @0x6A437F ; 0x200 (`0x6A438C`) → GTE simple + movsx s16 SIGNÉ ajoutés 32-bit (0x6A43B3-D9) ; défaut (`0x6A43E5`) → **adds word 16-bit wrap** `add ax,[ebx]` / `add cx,[ebx+2]` / `add dx,[ebx+4]` (PAS 32-bit). Convergence @0x6A4434 : adds DWORD des dwords caméra `dword_1D97790/8C/94` @0x6A4434/3E/51.
6. **Rot/scale Q12** : skip identité si `dword[edi+18h]==0x10001000 && word[edi+1Ch]==0x1000` (@0x6A445E/6D) ; bit 0x0100 (`0x6A447C test ah,1`) → SET `Mat3S16_MulQ12_IntoArg0` @0x6A44C6 (m9 = 9 s16 diagonaux, zéros ailleurs, **mov** pas movsx pour les 3 mots diag — 0x6A4481-C1), CLEAR `Mat3S16_ScaleByVec12` @0x6A44F2 (movsx s16 → 3 s32, 0x6A44D0-D8).
7. **Projection + remplissage prim** : `Field_readCaPre` + `preCamReadVariables_Space` @0x6A4501-0B ; `[esi+1Ch]` = 0x2030 (@0x6A4510) ou **0x20F0** si word[edi+24h] ≠ 0 (@0x6A4525) + `[esi+8]` = dword[edi+20h] (@0x6A452C) ; `[esi+0Ch]` = movsx word[edi+24h] @0x6A4520 ; `[esi+18h]` = movsx word[ebx+0Ch] @0x6A4532-36 ; mots +20..+26 = 0, +28/+2A = 0x100 @0x6A453E-52.
8. **Modes '1'/'9'** (byte `[blob+8][idx]` @0x6A455D) : '1' (0x31) → +2C/+2E=0, +32=0x80, +30=0x100, +22 = byte[blob+0Eh]&0x7F (0x6A4583-9B) puis **tombe dans l'insertion commune** sub_701DD0 ; '9' (0x39) → `sub_6A45E0(esi, g_BattleOTBase+0x44, 2, dword_2517A24)` @0x6A457C puis **jmp 0x6A45B8 — court-circuite sub_701DD0** ; défaut → sub_701DD0 @0x6A45B3.
9. **Unwind** : `BattleScratch_Unwind(0x6C)` @0x6A45C2, pops, `retn` @0x6A45D1.

## Divergences A/B (tranchées une par une, avec EA + opcode)

1. **Retour EAX = tête de liste ? (B) vs « eax non signifié » (A)** — Tranché **ni A ni B tel quel** : eax est bien 32 bits (proto `char` trompeur — les deux avaient raison là-dessus), mais la tête de liste n'est PAS retournée : `0x6A45BB mov dword_2517A24, eax` persiste la tête dans la GLOBALE, puis `0x6A45C2 call BattleScratch_Unwind` **clobber eax** avant `0x6A45D1 retn`. B est corrigé ; A avait la bonne conclusion sans la bonne cause. Renfort : le dispatcher sub_701970 ignore eax après `0x701D96 call [arg_4]` (compteur rechargé @0x701D9A) — le retour n'est consommé par personne.
2. **Mode '9' → « common sub_701DD0 » (A) vs if/else court-circuit (B)** — Tranché **B** : `0x6A457C call sub_6A45E0` suivi de `0x6A4581 jmp short loc_6A45B8` qui saute par-dessus `0x6A45B3 call sub_701DD0`. A est faux sur ce point.
3. **Ordre de l'arbre d'interpolation** — Tranché **B** (A décrivait l'ordre sans l'arbre exact) : cmp w28/w2A @0x6A4235 → test w26 @0x6A425D → cmp w26,1000h @0x6A426F → sous-appel @0x6A4295, confirmé ligne à ligne dans asm.asm.
4. **Blob : champ +0x0E = step, +0x0C = 0xFF80, trou +06..07** — Tranché **résolu au-delà des deux voix** (sondage IDA lecture seule côté producteur sub_6A3D90) : `0x6A3DBA shl eax,5` (step<<5, word stocké dans le blob via `0x6A3DBD mov [var_6],ax`), `0x6A3DD8 mov [var_8],0FF80h` (word +0x0C), `0x6A3DDF mov [var_C],offset a00900901` (ptr table de chars +0x08), `0x6A3DC8 add ecx,0CE8h` (dword_25102C8+0xCE8 → ptr +0x10). Le « trou » +06..07 côté lecture est confirmé (aucun accès [ebx+6] dans asm.asm).
5. **5e arg de sub_701390 ([ebx+10h]) — « _WORD ** » (Hex-Rays) / in-out supposé (B)** — Tranché par sondage : sub_701390 (0x701390-0x70142B) est une **interpolation GTE par pas** (`GteState_Set_1CA8A30(0x1000-w26)`, `GteState_SetWord3_1CA8A34`, `sub_45E9D0`/`sub_45EBF0`, `GteState_GetWord3_1CA8A74` → écrit 3 words par pas, stride 8, `dword[entry+4]` itérations) ; `[ebx+10h]` = pointeur vers le tampon de sortie (`dword_25102C8+0xCE8`), la callee écrit **à travers** le pointeur sans réécrire la variable ; la « relecture » @0x6A42AC compense seulement le clobber eax du call. U2 levé.
6. **Polarités 0x40000/0x0100** — Tranché **A=B** (conforme) : `test` binaires (0x6A42B5, 0x6A447C), aucun jl ; le seul `jl` signé de la fonction est @0x6A41FB (s16 [edi+24h] vs 0x1000).
7. **Scratch 0x6C, 3 modes GTE, mot GPU 0x2030/0x20F0, OT+0x44** — A=B, conforme ASM (0x6A420B/C0, 0x6A42F3/8C/43E5, 0x6A4510/25, 0x6A45AC).

## Preuves (ASM cité, 8)

1. `0x6A3DCE push offset sub_6A41E0` (xref data unique, callers.txt) → `0x701D96 call [esp+5Ch+arg_4]` dans sub_701970 : registration en callback du dispatcher, eax ignoré @0x701D9A.
2. `0x6A41FB jl short loc_6A4208` après `0x6A41F5 cmp word ptr [edi+24h], 1000h` : garde signée s16 vs 0x1000 ; `0x6A41EC or eax,[edi+18h]` + `0x6A41EF jz` : garde (s16)[+1C]|[dword +18].
3. `0x6A4225 mov ecx,[eax+edx*4+8]` : table d'offsets stride 4 indexée par movsx word [edi+2] @0x6A4218 ; `0x6A4250 lea eax,[eax+ecx*8+0Ch]` : rangées de 8 o derrière header 0xC.
4. `0x6A43E5 add ax,[ebx]` / `0x6A43E8 add cx,[ebx+2]` / `0x6A43EC add dx,[ebx+4]` : voie défaut = adds 16-bit wrap ; `0x6A434B-74` adds DWORD voie 0x1000 ; `0x6A43C7/43C5/43D9` movsx+add 32-bit voie 0x200.
5. `0x6A4510 mov dword ptr [esi+1Ch], 2030h` / `0x6A4525 mov dword ptr [esi+1Ch], 20F0h` : tags GPU prim, alternés sur word[edi+24h] ≠ 0 (@0x6A451A movsx, @0x6A4523 cmp eax,ebp).
6. `0x6A455D mov al,[eax+edx]` + `0x6A4560 cmp al,31h` / `0x6A4564 cmp al,39h` : dispatch '1'/'9' ; `0x6A4581 jmp short loc_6A45B8` : le mode '9' court-circuite sub_701DD0.
7. `0x6A45AC add edx,44h` après `0x6A45A5 mov edx,g_BattleOTBase` : insertion OT à +0x44 octets ; `0x6A45BB mov dword_2517A24, eax` : tête de liste persistée (les deux chemins).
8. `0x6A45C0 push 6Ch` / `0x6A45C2 call BattleScratch_Unwind` / `0x6A45D1 retn` : eax de sortie = clobber de l'unwind, tête de liste JAMAIS retournée.

## Checks §5.6

- **Callees cités présents** dans callees.txt : bs_modulo (0x6A420D), sub_701390 (0x6A42A7), sub_7015B0 (0x6A42C7), sub_701310 (0x6A42D7), Field_readCa (0x6A430E…), setSomeDword5, Thunk_460860_486012, GteState_Get_1CA8A74, sub_56C270 (0x6A437F/0x6A442C), Mat3S16_MulQ12_IntoArg0 (0x6A44C6), Mat3S16_ScaleByVec12 (0x6A44F2), Field_readCaPre (0x6A4501), preCamReadVariables_Space (0x6A450B), sub_6A45E0 (0x6A457C), sub_701DD0 (0x6A45B3), BattleScratch_Unwind (0x6A45C2) — ✅ tous ; aucun library call inventé.
- **Caller présent** : sub_6A3D90 @0x6A3DCE (data, unique, `more:false`) — ✅.
- **Strides en nombres** : table offsets stride 4 (`edx*4+8` @0x6A4225) ; rangées `sel*8+0xC` (@0x6A4250) ; pas d'interpolation stride 8 dans sub_701390 (`add ebx/esi/edi,8` @0x70141A-1D) ; struct sortie 0x6C ; m9 = 9×s16. ✅
- **Polarités signées** : `jl` signé unique @0x6A41FB (s16 vs 0x1000) ; movsx signés @0x6A4286/0x6A429D/0x6A44D0-D8/0x6A43B3-D9 ; `test` binaires pour 0x40000/0x1000/0x200/0x0100 ; `and 7Fh` @0x6A4598. ✅
- **Largeur retour** : EAX 32 bits, valeur non contractualisée (clobber BattleScratch_Unwind @0x6A45C2 ; eax=0 aux early-exits ; ignoré par le dispatcher @0x701D9A) — proto `char` IDA trompeur. ✅
- **Nom ≥2 preuves ASM indépendantes** : callback dispatcher (0x6A3DCE + 0x701D96) et enqueue prim OT (0x6A45B3/0x6A45AC + 0x6A45BB), taille prim 0x6C (0x6A420B). ✅

## Questions ouvertes (non bloquantes)

1. Sémantique exacte des tags GPU 0x2030/0x20F0 (type de primitive / format vertex) — valeurs ancrées @0x6A4510/25, signification non prouvée.
2. Différence précise sub_6A45E0 vs sub_701DD0 (priorité OT différente ? format '9' spécifique ?) — à couvrir par l'analyse de 0x6A45E0.
3. Signification du dword [edi+20h] copié à [esi+8] si word[edi+24h]≠0 (@0x6A452C) : pointeur ou compteur — non tranché.
4. wiki.md vide (échec qmd) : recoupage wiki de la famille Maelstrom (BattleMagic_M207) et du bloc camera dword_1D97778..94 à refaire lors d'un passage V avec qmd opérationnel.
5. Chaînage en amont : `dword_25102C8+0xCE8` (tampon interpolation) et `[ebx+28h]/[ebx+2Ch]` (positions du blob) appartiennent au contrat de sub_6A3D90 — à couvrir par le pack de 0x6A3D90 lui-même.

## IDBCOMMENT

Callback par frame des effets de magie Maelstrom, enregistre par sub_6A3D90 via le dispatcher sub_701970. Alloue une prim de 0x6C octets dans le scratch (bs_modulo), resout le point d'ancrage (table stride 4 ou interpolation GTE sub_701390), applique rotation/echelle Q12 et les modes camera GTE (flags 0x1000/0x200/0x0100 de +04, dwords camera 1D97778..94), puis enchaine dans l'OT g_BattleOTBase+44h via sub_701DD0, ou sub_6A45E0 si le char de mode du blob vaut '9'. Tags GPU 0x2030/0x20F0 selon word[+24h] ; tete de liste persistee dans dword_2517A24. Retour EAX non contractualise (clobber par BattleScratch_Unwind, ignore par le dispatcher) ; le proto char IDA est trompeur. [semantic-triple 2026-09-21]

## Notes C-R

# reconcile_notes.md — sub_6A41E0 @ 0x6A41E0 (triple 2+1, rôle C-R)

Ground truth = `asm.asm` (295 instr, 1010 o, 0x6A41E0..0x6A45D1, par blocs).
Voix A = `c_a.c`, voix B = `c_b.c`. `hexrays.c` = vérificateur SEULEMENT.
Chaque tranchage cite l'adresse ASM. Pas de moyenne : l'ASM gagne toujours.

---

## Divergences tranchées contre l'ASM

### D1 — Scratch 0x6C : bs_modulo / BattleScratch_Unwind
- **A** : « alloc scratch 0x6C o » + « unalloc, inverse de bs_modulo ». ✅
- **B** : idem, appariement symétrique. ✅
- **Tranché (A=B)** : `push 6Ch; call bs_modulo` @0x6A420B-0x6A420D (+`add esp,4`
  @0x6A4222) alloue ; `push 6Ch; call BattleScratch_Unwind` @0x6A45C0-0x6A45C2
  (+`add esp,4` @0x6A45C7) libère. Commentaire callees.txt : « inverse of
  bs_modulo 0x5082B0 ; Cerberus Frame-memory-allocation claim is false ».
  Scratch 0x6C = 108 octets. Aucune divergence.

### D2 — Côté producteur du blob (step<<5 @0x6A3DBA, 0xFF80 @+0x0C, trou +06..07, step masqué 0x7F @0x6A4598)
- **A** : décrit blob edi (+02..+2A) mais sans les adresses producteur.
- **B** : contracte le blob ebx « 0x14 o » avec +0E byte masqué 0x7F.
- **Tranché** : 0x6A3DBA (step<<5, producteur) est dans `sub_6A3D90` — **HORS
  asm.asm de ce pack**, non vérifiable ici (aucun accès IDA autorisé). Côté
  **consommateur** prouvé par l'ASM :
  - `0x6A4595 mov al, [ebx+0Eh]` ; `0x6A4598 and eax, 7Fh` ; `0x6A459B mov
    [esi+22h], ax` — step masqué 0x7F, stocké word à scratch+22h. ✅
  - `0x6A4532 movsx ecx, word [ebx+0Ch]` ; `0x6A4536 mov [esi+18h], ecx`
    (dword, extension signée du word blob+0x0C). Le « 0xFF80 word @+0x0C »
    producteur n'est pas dans ce pack (même statut que 0x6A3DBA).
  - **Trou +06..07 confirmé côté lecture** : refs ebx/`C` dans asm.asm =
    +0x00/+0x02/+0x04 (0x6A43E5-EC), +0x08 (0x6A455A), +0x0C (0x6A4532),
    +0x0E (0x6A4595), +0x10 (0x6A4295, 0x6A42AC). **Aucun accès [ebx+6]**.
- **UNCERTAIN** : la séquence exacte producteur (+0x0E=step<<5 @0x6A3DBA,
  0xFF80 word @+0x0C) nécessite asm de 0x6A3D90 — à couvrir par un autre EA.

### D3 — Interpolation / point d'ancrage (scratch+04) — offsets et ordre
- **A** : trois variantes, ordre des tests décrit mais sans l'arbre exact.
- **B** : arbre complet (w28==w2A → w26==0 → w26==0x1000 → sous-appel).
- **Tranché (B, confirmé ligne à ligne)** — ordre exact :
  1. `0x6A4235 cmp cx,dx` (w28 vs w2A) ; égaux : `0x6A423A test cx,cx` →
     nul ⇒ `0x6A423F add eax,0Ch` ; non-nul ⇒ formule 0x6A4247 (facteur w28).
  2. Différents : `0x6A4259 mov bp,[edi+26h]` ; `0x6A425D test bp,bp` →
     w26 nul : `0x6A4262 test cx,cx` → non-nul ⇒ 0x6A4247 ; nul ⇒
     `0x6A4267 add eax,0Ch`.
  3. `0x6A426F cmp bp,1000h` ; w26==0x1000 : `0x6A4276 test dx,dx` →
     w2A nul ⇒ `0x6A427B add eax,0Ch` ; sinon formule 0x6A4283 (facteur
     w2A, `movsx` SIGNED @0x6A4286, `imul` @0x6A4289, `lea [eax+ecx*8+0Ch]`
     @0x6A428C).
  4. Sinon `0x6A4295..0x6A42B2` : `sub_701390(entry, w28, w2A, w26,
     [ebx+10h])` — 5 args (pushes droite→gauche : [ebx+10h] @0x6A4295-98,
     movsx w26 @0x6A4299, movsx w2A @0x6A429D, movsx w28 @0x6A42A0, entry
     @0x6A42A6), `add esp,14h` @0x6A42AF ; **relecture** dword [ebx+10h]
     @0x6A42AC → scratch+04 @0x6A42B2.
  - Formule commune : `[scratch+04] = entry + dword[entry+4] * (s16 sel) * 8
    + 0x0C` — `mov ecx,[eax+4]` (dword) + `movsx` + `imul` (SIGNED) +
    `lea [eax+ecx*8+0Ch]`.
  - A note « mov bp non étendu » : les tests `test bp,bp`/`cmp bp,1000h`
    sont bien 16-bit (zéro-étendus à ebp par mov) — équivalent ; B plus fidèle.
- **Divergence vs Hex-Rays** : hexrays.c L62/L78 formule « 8 * v7 * *(v5+4)
  + 12 » — facteurs réordonnés mais arithmétiquement identiques ; L69 type
  le 5e arg `_WORD **` (non prouvé, dword seul prouvé). c_a D3 affirmait un
  ordre de facteurs « faux » : en réalité commutatif — tranché : les deux
  formulations sont équivalentes, l'ASM prouve la largeur (dword × s16 signé).

### D4 — Transforms Q12 + GTE + camera (dword_1D97778..94) — 3 modes selon flags
- **A** et **B** : d'accord sur 0x1000/0x200/défaut.
- **Tranché (A=B, confirmé)** :
  - Mode **0x1000** (`0x6A42F3 test ebp,1000h`, jz → 0x6A438C) : double
    GTE — `Field_readCa(&dword_1D97778)` @0x6A430E, `setSomeDword5(ebx)`
    @0x6A4314, `Thunk_460860_486012()` @0x6A4319 (MVMVA 0x12),
    `GteState_Get_1CA8A74(&var_C)` @0x6A4323 ; puis
    `Field_readCa(dword_2517A80)` @0x6A432D, `setSomeDword5(&var_48)`
    @0x6A4337, thunk @0x6A433C, `GteState_Get_1CA8A74(&var_40)` @0x6A4346 ;
    **adds DWORD** var_C+=var_40, var_8+=var_3C, var_4+=var_38
    (0x6A434B-0x6A4374) ; `sub_56C270(dword_2517A80, &var_20)` @0x6A437F ;
    `add esp,20h` @0x6A4384 (cumul des 8 pushes).
  - Mode **0x200** (`0x6A438C test ebp,200h`, jz → 0x6A43E5) : GTE simple
    (0x6A4399/0x6A439F/0x6A43A4/0x6A43AE) puis **movsx SIGNED** des s16
    var_48/46/44 ajoutés en 32-bit : var_C += var_48 @0x6A43C7, var_8 +=
    var_46 @0x6A43C5, var_4 += var_44 @0x6A43D9 ; `add esp,0Ch` @0x6A43D6.
  - **Défaut** (0x6A43E5) : **adds 16 BITS** (wrap u16) — `add ax,[ebx]`
    @0x6A43E5, `add cx,[ebx+2]` @0x6A43E8, `add dx,[ebx+4]` @0x6A43EC
    (PAS des adds 32 bits) ; puis GTE (0x6A4404/0E/13/1D) ;
    `sub_56C270(&dword_1D97778, &var_20)` @0x6A442C ; `add esp,14h` @0x6A4431.
  - **Convergence** @0x6A4434 : adds DWORD des dwords caméra —
    var_8 += dword_1D97790 @0x6A4434/47, var_C += dword_1D9778C @0x6A443E/57,
    var_4 += dword_1D97794 @0x6A4451/5C.
- A (D7) et B sont d'accord : la voie défaut = word-add 16-bit wrap.
  Hex-Rays L122-126 correct aussi. Pas de divergence réelle.

### D5 — Prim 0x6C : mot GPU 0x2030/0x20F0, dispatch type, insertion sub_701DD0 / sub_6A45E0
- **A** : correct mais dit « sprite '9' … puis common sub_701DD0 » — FAUX :
  le mode '9' court-circuite sub_701DD0 (jmp direct à l'unwind).
- **B** : if/else correct. ✅
- **Tranché (B)** :
  - `0x6A4510 mov dword [esi+1Ch], 2030h` — initial (dword write).
  - `0x6A451A movsx eax, word [edi+24h]` ; `0x6A4520 mov [esi+0Ch], eax`
    (dword) ; `0x6A4523 cmp eax, ebp` (ebp=0) ; si ≠0 :
    `0x6A4525 mov dword [esi+1Ch], 20F0h` + `0x6A452C mov eax,[edi+20h]` ;
    `0x6A452F mov [esi+8], eax` (dword).
  - `0x6A4532 movsx ecx, word [ebx+0Ch]` → `[esi+18h]` (dword) @0x6A4536.
  - `0x6A4539 mov ecx, 100h` ; words : +20/+22/+24/+26 = 0 (bp=0)
    @0x6A453E-0x6A454A ; +28/+2A = 0x100 @0x6A4552/0x6A454E.
  - Dispatch : `0x6A455D mov al, [eax+edx]` (table [ebx+8] indexée idx) ;
    `0x6A4560 cmp al,31h` ('1') → 0x6A4583 : +2C/+2E = 0, +32 = 0x80,
    +30 = 0x100, +22 = byte[ebx+0Eh] & 0x7F (0x6A4583-0x6A459B) — puis
    **tombe dans l'insertion commune** (pas de jmp séparé).
    `0x6A4564 cmp al,39h` ('9') → `0x6A4568..0x6A457C call sub_6A45E0` puis
    **jmp 0x6A45B8** (court-circuite sub_701DD0).
    Défaut (ni '1' ni '9') ET '1' : `0x6A459F..0x6A45B3 call sub_701DD0`.
  - 4 args des deux (pushes droite→gauche) : `dword_2517A24` (0x6A4574 /
    0x6A45AB), `2` (0x6A4578 / 0x6A45AF), `g_BattleOTBase+0x44`
    (`mov edx,g_BattleOTBase; add edx,44h` @0x6A456E-75 / 0x6A45A5-AC),
    `esi` (0x6A457B / 0x6A45B2). `add esp,10h` @0x6A45B8 (4 args cdecl).
  - `0x6A45BB mov dword_2517A24, eax` — tête de liste persistée dans la
    globale (dans les DEUX cas, '9' jmp tombe sur 0x6A45B8 puis 0x6A45BB).
- **Divergence vs Hex-Rays** : L189 `g_BattleOTBase + 17` — hexrays type
  g_BattleOTBase en pointeur de dwords (17×4 = 0x44 octets) : **même
  adresse**, pas de divergence numérique réelle. c_a D5 affirmait une
  divergence numérique : **rejeté**, tranché : +0x44 octets (= 17 dwords).

### D6 — Polarité 0x40000 (signed jl ?) et 0x0100
- **A** : D-ligne dit « jl signé @0x6A41F9 sur s16 [edi+24h] vs 0x1000 » ✅,
  et 0x40000 = `test` (pas de comparaison signée). ✅
- **B** : idem. ✅
- **Tranché (A=B)** :
  - **0x40000** : `0x6A42B5 test dword [edi+4], 40000h` — test binaire NON
    signé, pas de jl. bit SET → `sub_7015B0` @0x6A42C7 ; bit CLEAR →
    `sub_701310` @0x6A42D7. (Le seul `jl` signé de la fonction est
    @0x6A41FB : `cmp word [edi+24h], 1000h` — s16 vs 0x1000.)
  - **0x0100** : `0x6A447C test ah, 1` (bit 8 du dword [edi+4]) — bit SET →
    `Mat3S16_MulQ12_IntoArg0` @0x6A44C6 ; bit CLEAR → `Mat3S16_ScaleByVec12`
    @0x6A44F2. Aucun `jl` sur ces bits.
- **Divergence vs Hex-Rays (tranchée)** — remplissage m9 voie 0x0100 :
  Hex-Rays L143-148 écrit `v26/v27/v28` en **3 dwords** + 3 s16 nuls, ce qui
  suggère un remplissage dword. L'ASM (0x6A4481-0x6A44C6) écrit **9 s16
  individuels** : w[+18h]→var_40 @0x6A448D, w[+1Ah]→var_38 @0x6A4492,
  w[+1Ch]→var_30 @0x6A44A3, tous les autres mots = 0 (bp=0 :
  0x6A44A8/AD/B2/B7/BC/C1). c_a D4 affirmait une « vec sémantique s16 signé »
  avec copie word — tranché : **copie word (mov), zéros ailleurs, diag
  3×3** ; le mov (non movsx) laisse les mots hauts des dwords var_40/3C/38
  à leur valeur antérieure (var_38+2 et var_3C+2 mis à 0 via bp).
  Voie 0x0100 CLEAR : `movsx` SIGNED @0x6A44D0/D4/D8 → 3 s32. Hex-Rays L153-155
  correct (`__int16` → int).

### D7 — Retour EAX 32 bits (proto char IDA trompeur)
- **A** : « eax non signifié, proto char non vérifiable — traiter void ».
- **B** : « Retour EAX 32 bits = tête de liste renvoyée par sub_701DD0 ».
- **Tranché (NI A NI B tel quel)** : eax est bien 32 bits (proto `char`
  trompeur ✅ les deux), MAIS la valeur de sortie n'est **pas** la tête de
  liste : `0x6A45BB mov dword_2517A24, eax` (tête de liste persistée dans la
  GLOBALE) puis `0x6A45C0 push 6Ch` / `0x6A45C2 call BattleScratch_Unwind`
  (**clobber eax**) / `0x6A45C7 add esp,4` / `0x6A45D1 retn`. Donc :
  - chemin succès : eax retour = résidu de `BattleScratch_Unwind`
    (non contractualisé) ;
  - early-exits (0x6A41EF, 0x6A4202 → 0x6A45CD) : eax = 0 (les deux gardes
    sortent sur jz avec eax == 0 — prouvé).
  Hex-Rays L192 confirme : `return BattleScratch_Unwind(108);`.
  B est **corrigé** sur ce point ; A partiellement (void est une approximation
  defensible côté consommateur, mais « eax non signifié » sans le clobber
  manquait la cause).

---

## UNCERTAIN restants

- **U1 (0x6A45D1)** : eax de sortie (résidu BattleScratch_Unwind) consommé
  par le dispatcher (sub_701970 / sub_6A3D90) ? Non prouvé depuis asm.asm
  seul (caller = xref data 0x6a3dce, pas d'appel direct visible).
- **U2 (0x6A42A7)** : type du pointee [C+10h] (5e arg sub_701390) : dword
  chargé @0x6A4295 et relecturé @0x6A42AC — réécriture par la callee
  *probable* mais non prouvée ici ; « pointeur sur quoi » non tranché.
- **U3 (0x6A4510/0x6A4525)** : sémantique des tags GPU 0x2030/0x20F0 (type
  de primitive / format vertex) — valeurs ancrées, signification non prouvée.
- **U4 (0x6A452C)** : `[esi+08h] = dword [edi+20h]` — pointeur ou compteur ?
  Non tranché (écrit seulement si word[+24h] ≠ 0).
- **U5 (producteur)** : step<<5 @0x6A3DBA et 0xFF80 word @blob+0x0C vivent
  dans sub_6A3D90 — hors asm.asm de ce pack, non vérifiables ici (trou
  +06..07 confirmé côté *lecture* uniquement, voir D2).

## Divergences vs Hex-Rays (récapitulatif)

| # | Point | Hex-Rays | ASM (verdict) |
|---|-------|----------|---------------|
| H1 | L62/L78 formule ancrage | `8 * sel * *(v5+4) + 12` | identique modulo commutativité ; largeurs prouvées : dword[entry+4] × s16 signé (movsx) × 8 + 0xC |
| H2 | L69 5e arg sub_701390 | `_WORD **` | dword [ebx+10h] chargé/relecturé ; type pointee non prouvé |
| H3 | L189 OT base | `g_BattleOTBase + 17` | +0x44 **octets** — même adresse (17×4) ; pas une vraie divergence |
| H4 | L143-148 voie 0x0100 | remplit 3 dwords + s16 | 9 s16 individuels, diag 3×3, zéros (bp=0) ; mov (pas movsx) pour les 3 mots diag |
| H5 | L192 retour | `return BattleScratch_Unwind(108)` | ✅ conforme — eax = clobber par BattleScratch_Unwind, tête de liste seulement dans dword_2517A24 |
| H6 | L37 garde | `*(DWORD*)(a2+24) | *(int16*)(a2+28)` | ✅ conforme (or dword | movsx s16) |
| H7 | L122-126 voie défaut | word adds | ✅ conforme (adds 16-bit wrap) |
