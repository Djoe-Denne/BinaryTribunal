# Mag213_BdLinkTask_FxStepper @ 0x69EF60

- Instr (live): 837 (3019 o, 0x69EF60-0x69FB2A)
- Palier: 2+1
- Verdict: LIKELY - stepper BdLinkTask de l'effet MAG213 (machine a etats op 0..0x4B, word task+0x0C) : rattache l'os 0x1D du caster, interpole les poses Q12 entre cibles, applique les resultats de combat a l'impact (BattleAction_ApplyResultAndSpawnPresentation), calcule la distance (sqrt dword) pour le sprite OT (sub_69FD00, groupe 2), seme 6 familles de taches BdLinkTask (6A0AF0/6A0C80/6A0A50/6A0760/6A0BE0x2/6A08D0) et sons ; retour EAX=2 si op>=0x4B (jl signe 16 bits), sinon op++ et 0 ; a1@edi fantome (jamais lu)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_69EF60\nTYPE ; proposition: Mag213_BdLinkTask_FxStepper
- Notes parent: checks 5.6 OK : push/pop edi (0x69EFAA/0x69FAA8), jl gate (0x69F4E9), jnz jamais pris (0x69F4FD), sub edx,23h+jnb (0x69F589-8F), movsx ebx,[ebp+0Ch] (0x69F628), cmp ebx,1Eh (0x69F703), var_98 100h/400h (0x69F89E/0x69F9F8), cmp ax,4Bh+jl (0x69FB07-B), mov eax,2 (0x69FB0E), add word [ebp+2Ah],64h (0x69FB02), elevation 3 branches (0x69F20A/22D/239), caller data xref sub_69EB70 @0x69ECA1

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_69EF60 (0x69EF60..0x69FB2A, 837 instr / 3019 o)
 * Voix C-R (réconciliateur). Ground truth = live ASM (asm.asm) + ida_dump_bytes,
 * PAS Hex-Rays (hexrays.c = vérificateur seulement, 3 divergences documentées
 * dans reconcile_notes.md).
 * Type IDA 'int __usercall@<eax>(int@<edi>, int)' = ARTEFACT : edi n'est jamais
 * lu avant 0x69EFD4 (push edi 0x69EFAA / pop 0x69FAA8 ; premier write 0x69EFCC
 * lea edi,[ecx+1B18h]). Tranché : cdecl, UN arg stack (voir notes).
 * Retour EAX : 0 (continuer) ou 2 (tâche terminée, op >= 0x4B signé 16 bits).
 *
 * Convention : `task` = pointeur de tâche BdLinkTask (ebp dans l'ASM). Champs :
 *   +0x0C word  opcode/step (w0C)        +0x0E word  limite cible (w0E)
 *   +0x10 dword[8] table pointeurs acteurs (indexée par w20/w22)
 *   +0x1C byte[8] index événement par acteur
 *   +0x20 word idxA (w20)   +0x22 word idxB (w22)   +0x24 word poids Q12 (w24)
 *   +0x26 word incrément poids (w26)  +0x28 word angle (w28)  +0x2A word w2A
 *   +0x2C word w2C (résultat sub_69EE80 / spread)   +0x30 dword distance
 *   +0x34/36/38 s16 pos xyz    +0x3C/3E/40 s16 pos sauvée
 *   +0x44 struct 8 dwords (mat3 Q12 18h + translation dwords [5][6][7] @14/18/1C)
 *   +0x64 buffer rendu 0x4A0 octets
 * Deltas persistants (stack) : var_A0 = dx, var_94 = dz (PAS dy — ASM 0x69F1AA),
 * dy vit dans edi jusqu'au bloc T où il est écrasé par -50.
 * ========================================================================== */

extern int  dword_2510170;   /* pointeur acteur de référence ([+0x0E] lu)      */
extern int  dword_2510178;   /* base : +0x1B18 records GTE (stride 8), +0x24B8 */
extern int  dword_251017C;   /* [[+4]+8] + 24*byte => event                    */
extern int  dword_2510194;   /* curseur alloc OT (va-et-vient)                 */
extern int  dword_2510198;   /* liste tâches plumes (sub_6A0760)               */
extern int  dword_25101A8;   /* liste tâches (sub_6A08D0)                      */
extern int  dword_25101B8;   /* liste tâches particules                        */
extern int  dword_25101E8;   /* preCam base = &dword_25101E8 - 0x14            */
extern int  dword_1D97778;   /* matrice view (arg0 Compose)                    */
extern int  dword_1181028;   /* handle SE                                      */
extern int  g_BattleOTBase;  /* +0x44 => OT cible                              */

extern void BattleGeom_ResolveBoneIndexAndPose(int actor, int bone, int scale, void *out);
extern void BdPlaySE3D(void *se, int a2, short *pos);
extern int  bs_modulo(int nbytes);                       /* stdcall (5Ch auto) */
extern void Mat3S16_MakeRotZ_NegSin_Q12(short angle, short *m);
extern void Mat3S16_MakeRotY_Q12(short angle, short *m);
extern void Field_readCaPre(void *m);                    /* cdecl */
extern void preCamReadVariables_Space(void *m);          /* cdecl */
extern void setSomeDword5(int *vec3);
extern void Thunk_460860_480012(void);
extern void GteState_GetWord3_1CA8A34(void *out3words);
extern int  Fixed_Sin4096_Q12(int a);
extern int  Fixed_Cos4096_Q12(int a);
extern void BattleAction_ApplyResultAndSpawnPresentation(void *event);
extern short sub_69EE80(void *actor);                    /* retour = AX */
extern int  sqrt(int v);          /* 1 dword push / ret EAX — PAS le CRT double */
extern void sub_50CBA0(int *delta, short *mat);          /* cdecl */
extern void Mat3S16_MulQ12_IntoArg0(short *m, const short *n); /* cdecl */
extern void Mat_ComposeTwoThenCopy8(int *view, void *m, void *out8); /* cdecl */
extern int  sub_69FD00(void *spr, int *ot, int a3, int prev);
extern void BattleScratch_Unwind(int nbytes);            /* cdecl (arg 0x5C)  */
extern void sub_7016B0(const void *src, void *dst, int size);
extern void CameraBasis_CopyDefaultAndApplyEulerS16(short *euler3w, int *out);
extern void sub_701970(void *buf, void *cb, void *ctx3dwords, int a4);
extern int  rand(void);
extern void *BdLinkTask_Register(int *list_head, void *callback);
extern void FillDwords(void *dst, int val, unsigned n);
extern void sub_6A06C0(int *actor, int seed, int *out);
extern void BdPlaySE(void *se, int a2, unsigned a3);
extern void sub_69FB30(short *, short *, int);   /* callbacks tâches, ailleurs */
extern void sub_6A0AF0(void), sub_6A0C80(void), sub_6A0A50(void);
extern void sub_6A0760(void), sub_6A0BE0(void), sub_6A08D0(void);

extern char unk_117ADE0[];  /* table vertex marche, stride 8 (dest bloc B / src bloc T) */
extern char unk_117ADD8[];  /* def sprite                                              */
extern char unk_117EA88[];  /* source init 0x4A0 (op==0)                               */
extern char unk_117DD7C[];  /* source init 0x140 (op >= 0x1D, INCONDITIONNEL)          */
extern char unk_118102C[];  /* ctx rendu feuille A                                     */
extern char unk_1181054[];  /* ctx rendu feuille B                                     */

#define W(o)   (*(short          *)(t + (o)))
#define UW(o)  (*(unsigned short *)(t + (o)))
#define DW(o)  (*(int            *)(t + (o)))
#define B(o)   (*(unsigned char  *)(t + (o)))

/* ---- Helper commun blocs U/V (0x69F854..69F941 et 0x69F9AE..69FA9B) -------
 * 2 tâches sub_6A0BE0 sur dword_25101B8. SEULE diff ASM entre les 2 sites :
 * le 3e mot du vecteur GTE initial : 0x100 @0x69F89E (bloc U) vs 0x400
 * @0x69F9F8 (bloc V). L'ordre des movsx diffère (0x69F8EB vs 0x69FA45),
 * sémantique identique — vérifié instruction par instruction.
 * Lissage : w18=(w10-w18)>>4, w1A=(w12-w1A)>>4, w1C=(w14-w1C)>>4 (mots signés).
 * ------------------------------------------------------------------------- */
static void SpawnPair_6A0BE0(char *t, short w2_z)
{
    int angle = rand();                       /* 0x69F841 / 0x69F99B */
    int count = 2;                            /* var_90 = 2          */
    do {
        char *tk = (char *)BdLinkTask_Register(&dword_25101B8, sub_6A0BE0);
        if (tk == 0) continue;                /* jz 0x69F938 / 0x69FA92 */
        short *vf = (short *)(tk + 0x18);     /* edi : pos courante       */
        short *vg = (short *)(tk + 0x10);     /* ebx : pos retour         */
        short vec[3];
        int   vx, vy;
        FillDwords(tk + 0x0C, 0, 5);          /* 0x69F878 / 0x69F9D2 */
        vx = Fixed_Cos4096_Q12(angle) >> 2;   /* sar 2 (arithmétique) */
        vy = Fixed_Sin4096_Q12(angle) >> 2;
        vec[0] = (short)vx; vec[1] = (short)vy; vec[2] = w2_z; /* 0x100 / 0x400 */
        setSomeDword5(vec);                   /* 0x69F8A5 / 0x69F9FF */
        Thunk_460860_480012();
        GteState_GetWord3_1CA8A34(vf);        /* -> tk+0x18 */
        vec[0] = (short)(vec[0] >> 3);        /* sar word @0x69F8B8/0x69FA12 */
        vec[1] = (short)(vec[1] >> 3);
        vec[2] = 0;                           /* var_98 = 0 @0x69F8C8/0x69FA22 */
        setSomeDword5(vec);
        Thunk_460860_480012();
        GteState_GetWord3_1CA8A34(vg);        /* -> tk+0x10 */
        *(short *)(tk + 0x16) = (short)((rand() & 0x7FF) + 0x800); /* 0x69F8E6/0x69FA40 */
        vf[0] = (short)(((int)vg[0] - (int)vf[0]) >> 4);   /* lissage 1/16 */
        vf[1] = (short)(((int)vg[1] - (int)vf[1]) >> 4);
        vf[2] = (short)(((int)vg[2] - (int)vf[2]) >> 4);
        angle += 0x800;                       /* 0x69F929..36 / 0x69FA83..90 */
    } while (--count != 0);
}

int sub_69EF60(int task /* arg_0 unique, cdecl */)
{
    char *t   = (char *)task;                 /* ebp */
    int   op25;                               /* var_9C : (short)op - 0x19  */
    int   dx, dy, dz;                         /* var_A0 / edi / var_94 */
    int   dist;                               /* var_60 (avant réemploi mat)   */
    char *scratch;                            /* ebx : bs_modulo(0x5C)         */
    int   md_buf[8];                          /* var_50 : stockage partagé
                                                 blocs B (mat Rz) / J (copie
                                                 task+0x44) / T (lecture cam)  */

    /* ==== BLOC A 0x69EF60-0x69EF9C : pose os 0x1D + SE si op==8 ============ */
    BattleGeom_ResolveBoneIndexAndPose(dword_2510170, 0x1D, 0x400, t + 0x34);
    if (W(0x0C) == 8)
        BdPlaySE3D(&dword_1181028, 0, (short *)(t + 0x34));

    /* ==== BLOC C 0x69EF9F-0x69EFAF : gate opcode [0x19,0x4A] NON SIGNÉ ===== */
    op25 = (int)W(0x0C) - 0x19;               /* movsx puis sub ; var_9C */
    if ((unsigned)op25 >= 0x32)               /* jnb 0x69EFAB -> L_69F36D */
        goto L_69F36D;

    /* ==== BLOC B 0x69EFB5-0x69F081 : halo vertex, 308 itérations =========== */
    scratch = (char *)bs_modulo(0x5C);        /* 0x69EFB7 (stdcall, esp auto) */
    {
        int   vtx  = dword_2510178 + 0x1B18;  /* edi : record GTE in, +8/it   */
        short *dst = (short *)unk_117ADE0;    /* esi : table dest, +8/it      */
        short *m   = (short *)md_buf;         /* var_50                       */
        int   counter = 0x134;                /* 308 @0x69EFFD                */

        Mat3S16_MakeRotZ_NegSin_Q12(W(0x28), m);   /* push m puis push w28 -> (w28,&m) */
        Field_readCaPre(m);
        preCamReadVariables_Space((int *)((char *)&dword_25101E8 - 0x14));
        do {                                  /* L_69F007 */
            int   rec6, a, h;
            setSomeDword5((int *)vtx);        /* record -> GTE in */
            Thunk_460860_480012();
            GteState_GetWord3_1CA8A34(dst);   /* GTE out -> table (3 mots) */
            rec6 = *(short *)(vtx + 6);       /* [edi+6] : SOURCE = record, PAS dst (tranché vs c_b) */
            a    = (short)(rec6 + W(0x2A));   /* var_90 */
            h    = Fixed_Sin4096_Q12(rec6 >> 1) >> 3;
                     /* ^ sar 1 sur l'ARGUMENT avant l'appel (0x69F02B-31),
                        puis sar 3 du résultat (0x69F042) — tranché vs c_a */
            *dst       = (short)(*dst + ((Fixed_Cos4096_Q12(a) * h) >> 12));
            ((short *)dst)[1] = (short)(((short *)dst)[1]
                              - ((Fixed_Sin4096_Q12(a) * h) >> 12));  /* SUB */
            dst = (short *)((char *)dst + 8);
            vtx += 8;                         /* var_94 suit (réemployé + loin) */
        } while (--counter != 0);             /* var_A0 */
    }

    /* ==== BLOC E 0x69F083-0x69F0B7 : poses os 0xF1 pour idxA/idxB ========== */
    /* ==== BLOC F 0x69F0B7-0x69F10E : interpolation Q12 des poses =========== */
    {
        int p_out[2], b_out[2];               /* 3 mots + 1 chaque */
        int idxA = (int)W(0x20), idxB = (int)W(0x22), tt = (int)W(0x24);
        int fx, fy, fz;
        BattleGeom_ResolveBoneIndexAndPose(*(int *)(t + 0x10 + 4 * idxA), 0xF1, 0, p_out);
        BattleGeom_ResolveBoneIndexAndPose(*(int *)(t + 0x10 + 4 * idxB), 0xF1, 0, b_out);
        fx = (*(short *)p_out)   + ((tt * ((*(short *)b_out)      - (*(short *)p_out)))   >> 12);
        fy = (((short *)p_out)[1]) + ((tt * (((short *)b_out)[1] - (((short *)p_out)[1]))) >> 12);
        fz = (*(short *)((char *)p_out + 4))
             + ((tt * ((*(short *)((char *)b_out + 4)) - (*(short *)((char *)p_out + 4)))) >> 12);
        /* var_8C = (short)fz @0x69F109 ; l'add du dword plein puis movsx si
         * plus loin rend le mot bas seul significatif (équivalence mots). */

    /* ==== BLOC F' 0x69F106-0x69F126 : gates résultat ======================= */
        if ((unsigned)op25 >= 5) {            /* jb @0x69F10E : NON SIGNÉ */
            short nw = (short)(W(0x26) + W(0x24));  /* add word @0x69F114 */
            W(0x24) = nw;                     /* store AVANT le test @0x69F11D */
            if ((short)nw >= 0x1000) {        /* jl @0x69F121 : SIGNÉ */
                /* ==== BLOC G 0x69F123-0x69F167 : résultat + présentation ==== */
                unsigned char ev = B(0x1C + idxA);   /* byte task+0x1C+w20 */
                BattleAction_ApplyResultAndSpawnPresentation(
                    (void *)(*(int *)(*(int *)(dword_251017C + 4) + 8) + 24 * ev));
                if (W(0x20) != W(0x22))
                    W(0x2C) = (short)sub_69EE80(*(int *)(t + 0x10 + 4 * (int)W(0x22)));
                W(0x24) = (short)(W(0x24) + 0xF000);  /* word add = -0x1000 */
                {
                    short lim = W(0x0E), nx = W(0x22);
                    W(0x20) = nx;             /* idxA <- idxB d'abord @0x69F175 */
                    nx++;
                    W(0x22) = (short)((nx < lim) ? nx : (short)(lim - 1));
                                              /* jl signé @0x69F181 ; sinon w0E-1 */
                }
                fz = (short)fz;               /* reprise var_8C @0x69F188 */
            }
        }

    /* ==== BLOC H 0x69F18D-0x69F1C9 : distance euclidienne ================== */
        {
            int ddx = fx - (int)W(0x34);      /* esi -> var_A0 */
            int ddy = fy - (int)W(0x36);      /* edi (registre)           */
            dz    = fz - (int)W(0x38);        /* eax -> var_94 = DZ (tranché) */
            dx    = ddx;
            dy    = ddy;
            dist  = sqrt(ddx * ddx + ddy * ddy + dz * dz); /* 1 dword push */
            DW(0x30) = dist;                  /* @0x69F1C9 */
            /* var_60 = (short)dist @0x69F1CC — deviendra m22 de var_70 */

    /* ==== BLOC I 0x69F1CE-0x69F244 : wobble sinusoïdal ===================== */
            {
                short dm = (short)dist;
                int   s;
                if ((unsigned)op25 < 8) {     /* jnb @0x69F1DE */
                    s = Fixed_Sin4096_Q12((op25 & 0x3FFFFF) << 7);
                    dm = (short)(((int)dm * s) >> 12);   /* var_60 */
                    *(int *)(scratch + 8) = 0x1000 - s;  /* [ebx+8] dword */
                    *(int *)(scratch + 4) = 0;
                } else if ((unsigned)op25 <= 0x2A) { /* jbe @0x69F215 */
                    *(int *)(scratch + 8) = 0;       /* SEULEMENT +8 ; +4 touché */
                } else {                             /* op25 > 0x2A (tranché vs c_a) */
                    s = Fixed_Sin4096_Q12(((op25 << 7) - 0x1481) & 0x1FFFFF80);
                    *(int *)(scratch + 8) = s;
                    *(int *)(scratch + 4) = 0;
                }
                dist = dm;                    /* m22 de la matrice var_70 */
            }
        }
    }

    /* ==== BLOC J 0x69F242-0x69F2B2 : delta + matrice + mul ================= */
    {
        int   m8[8];                          /* var_20 (sortie Compose) */
        int  *md = md_buf;                    /* var_50 : copie task+0x44 */
        short rot[9];                         /* var_70 : mat3 Q12, 9 mots TOUS écrits */
        int   delta[3];                       /* var_30 */
        int   i;
        delta[0] = -dx;                       /* neg esi @0x69F242 */
        delta[1] = -dy;                       /* neg edi @0x69F287 */
        delta[2] =  dz;                       /* var_28 = var_94 @0x69F291 */
        rot[0] = 0x1000; rot[1] = 0; rot[2] = 0;   /* var_70/70+2/6C @69F255/76/71 */
        rot[3] = 0; rot[4] = 0x1000; rot[5] = 0;   /* var_6A/68/66 @69F26C/50/67 */
        rot[6] = 0; rot[7] = 0; rot[8] = (short)dist; /* var_64/62/60 */
        /* ^ m02 = var_6C <- 0 @0x69F271 : l'UNCERTAIN "m02 reliquat" de c_b
         * est RESOLU — les 9 mots sont explicitement initialisés. */
        sub_50CBA0(delta, (short *)(t + 0x44));   /* push task+44 puis push delta */
        /* UNCERTAIN 0x69F298 sub_50CBA0 écrit-elle dans task+0x44 ? La copie
         * rep movsd (md <- task+0x44) vient APRÈS l'appel (0x69F2B0). */
        for (i = 0; i < 8; i++) md[i] = DW(0x44 + 4 * i);           /* rep movsd ecx=8 */
        Mat3S16_MulQ12_IntoArg0(md, rot);     /* push &var_70 puis push &var_50 */

    /* ==== BLOC K 0x69F2B7-0x69F309 : compose + 2e lecture caméra =========== */
        ((short *)md)[10] = W(0x34);          /* var_3C : translation md[5] */
        ((short *)md)[12] = W(0x36);          /* var_38 : md[6] */
        ((short *)md)[14] = W(0x38);          /* var_34 : md[7] */
        Mat_ComposeTwoThenCopy8(&dword_1D97778, md, m8);
        Field_readCaPre(m8);
        preCamReadVariables_Space(m8);

    /* ==== BLOC L 0x69F309-0x69F36A : init sprite + insertion OT ============ */
        *(short *)(scratch + 0x12) = 0;       /* 0x69F318 */
        *(short *)(scratch + 0x10) = 0;       /* 0x69F314 */
        *(short *)(scratch + 0x1A) = 0;       /* 0x69F31C */
        *(short *)(scratch + 0x18) = 0;       /* 0x69F320 */
        *(short *)(scratch + 0x16) = 0x100;   /* 0x69F324 */
        *(short *)(scratch + 0x14) = 0x100;   /* 0x69F32B */
        *(short *)(scratch + 0x1E) = 0x100;   /* 0x69F338 */
        *(short *)(scratch + 0x1C) = 0x80;    /* 0x69F332 */
        *(short *)(scratch + 0x0C) = (short)((op25 & 7) << 4);  /* shl 4 */
        *(int *)scratch = (int)unk_117ADD8;   /* @0x69F340 */
        dword_2510194 = sub_69FD00(scratch, (int *)(g_BattleOTBase + 0x44),
                                   2, dword_2510194);       /* 0x69F359 */
        BattleScratch_Unwind(0x5C);           /* push 5Ch @0x69F35E (tranché vs c_a) */
        /* add esp,38h @0x69F36A : solde 16(sub_69FD00)+4(Unwind)+36(Compose/
         * readCaPre/preCam/MulQ12/50CBA0 args cdecl) = 0x38 ; bs_modulo stdcall */
    }

    /* ==== BLOC M 0x69F36D-0x69F394 : op [0x00,0x17] NON SIGNÉ ============== */
L_69F36D:
    if ((unsigned)(int)W(0x0C) < 0x18) {      /* cmp eax,18h / jnb @0x69F374 */
        if (W(0x0C) == 0)
            sub_7016B0(unk_117EA88, t + 0x64, 0x4A0);       /* @0x69F38C */

        /* ==== BLOC N 0x69F394-0x69F449 : euler cam + compose + sub_701970 == */
        {
            short euler[3];                   /* var_88 */
            int   m8[8], m8x[8];              /* var_70 puis var_20 */
            int   ctx[3];                     /* {&m8x, unk_118102C, base+0x24B8} */
            int   angle;
            euler[1] = (short)(*(short *)((char *)dword_2510170 + 0x0E) + 0x800);
                      /* ^ déréférence le POINTEUR dword_2510170 ([edx+0Eh]
                         @0x69F39A) — c_b écrit '&dword_2510170' à tort */
            euler[0] = (short)0xFF80;         /* -128 @0x69F3B1 */
            euler[2] = 0;                     /* @0x69F3B8 */
            CameraBasis_CopyDefaultAndApplyEulerS16(euler, m8);
            m8[5] = (int)(short)W(0x34); m8[6] = (int)(short)W(0x36);
            m8[7] = (int)(short)W(0x38);
            Mat_ComposeTwoThenCopy8(&dword_1D97778, m8, m8x);   /* out var_20 */
            ctx[0] = (int)m8x;                /* @0x69F403 */
            ctx[1] = (int)unk_118102C;        /* @0x69F418 */
            ctx[2] = dword_2510178 + 0x24B8;  /* @0x69F420 */
            sub_701970(t + 0x64, sub_69FB30, ctx, 0);   /* 4 args poussés @69F407-17 */
            rand();                           /* 0x69F429 — résultat ignoré */
            angle = rand();                   /* 0x69F42E -> edi */

            /* ==== BLOC O/P 0x69F435-0x69F4DB : 2 particules sub_6A0AF0 ===== */
            Field_readCaPre(m8);              /* 0x69F43A */
            preCamReadVariables_Space(m8);    /* 0x69F444 */
            {
                int count = 2;                /* ebx */
                do {
                    char *tk = (char *)BdLinkTask_Register(&dword_25101B8, sub_6A0AF0);
                    if (tk == 0) continue;    /* jz 0x69F467 */
                    short vec[3];
                    FillDwords(tk + 0x0C, 0, 5);
                    vec[0] = (short)(Fixed_Cos4096_Q12(angle) >> 2);
                    vec[1] = (short)(Fixed_Sin4096_Q12(angle) >> 2);
                    vec[2] = (short)((rand() & 0x3FF) + 0x400);   /* var_84 */
                    setSomeDword5(vec);
                    Thunk_460860_480012();
                    GteState_GetWord3_1CA8A34(tk + 0x10);
                    *(short *)(tk + 0x16) = (short)((rand() & 0x3FF) + 0x800);
                    angle += 0x800;           /* edi @0x69F4D0 */
                } while (--count != 0);
            }
        }
    }

    /* ==== BLOC Q 0x69F4E1-0x69F582 : op >= 0x1D (jl SIGNÉ @0x69F4E9) ======= */
    if ((short)W(0x0C) >= 0x1D) {
        int m8[8], i;
        for (i = 0; i < 8; i++) m8[i] = DW(0x44 + 4 * i);   /* rep movsd @0x69F4FB */
        /* DIVERGENCE Hex-Rays TRANCHÉE : PAS de garde `op == 0x1D`. Le jnz
         * @0x69F4FD suit rep movsd (ecx=8 -> ecx=0, ZF=1) : JAMAIS pris.
         * Les 2 instructions ci-dessous s'exécutent pour TOUT op >= 0x1D. */
        DW(0x3C) = DW(0x34);                  /* @0x69F50E (x,y + mot 0x3A) */
        DW(0x40) = DW(0x38);                  /* @0x69F516 (z + mot 0x3A+2) */
        sub_7016B0(unk_117DD7C, t + 0x64, 0x140);           /* @0x69F519 */
        {
            int ctx[3];
            m8[5] = (int)(short)W(0x3C); m8[6] = (int)(short)W(0x3E);
            m8[7] = (int)(short)W(0x40);
            Mat_ComposeTwoThenCopy8(&dword_1D97778, m8, m8);  /* IN-PLACE (edx=eax=&var_70) */
            ctx[0] = (int)m8;                 /* var_88 @0x69F55B */
            ctx[1] = (int)unk_1181054;        /* @0x69F571 */
            ctx[2] = dword_2510178 + 0x24B8;  /* @0x69F565 */
            sub_701970(t + 0x64, sub_69FB30, ctx, 0);
        }
    }

    /* ==== BLOC S 0x69F585-0x69F627 : op [0x23,0x40] NON SIGNÉ ============== */
    if ((unsigned)((int)W(0x0C) - 0x23) < 0x1E) {           /* jnb @0x69F58F */
        int seed = (int)(((long long)rand() * (short)W(0x2C)) >> 16);
                                              /* imul edi,eax ; sar edi,10h @69F5A5 */
        int count = 2;
        do {
            char *tk = (char *)BdLinkTask_Register(&dword_25101B8, sub_6A0C80);
            if (tk == 0) continue;            /* jz 0x69F5C1 */
            FillDwords(tk + 0x0C, 0, 5);
            sub_6A06C0(*(int *)(t + 0x10 + 4 * (int)W(0x20)), seed,
                       (int *)(tk + 0x10));   /* @0x69F5DE */
            *(short *)(tk + 0x16) = (short)((rand() & 0x7FF) + 0xC00);
            *(short *)(tk + 0x1A) = 0;        /* @0x69F604 */
            *(short *)(tk + 0x18) = (short)((dx << 7) / DW(0x30));  /* var_A0 = dx */
            *(short *)(tk + 0x1C) = (short)((dz << 7) / DW(0x30));  /* var_94 = dz */
            seed += (int)W(0x2C) >> 1;        /* sar 1 @0x69F621 */
        } while (--count != 0);
    }

    /* ==== BLOC T 0x69F628-0x69F7E7 : op [0x1E,0x45] NON SIGNÉ ============== */
    if ((unsigned)((int)W(0x0C) - 0x1E) < 0x28) {           /* jnb @0x69F632 */
        char *cur  = unk_117ADE0;             /* var_9C : cette fois ENTRÉE GTE */
        int   it   = 0x134;                   /* 308 */
        int   ped  = -50;                     /* edi = 0xFFFFFFCE @0x69F65F */
        Field_readCaPre(md_buf);              /* @0x69F645 (var_50) */
        preCamReadVariables_Space(md_buf);    /* @0x69F64F */
        do {                                  /* L_69F664 */
            short p_out[4];                   /* 3 mots GTE + 1 mot résiduel pile */
            setSomeDword5((int *)cur);        /* table -> GTE in (rôle inverse du bloc B) */
            Thunk_460860_480012();
            GteState_GetWord3_1CA8A34(p_out);
            if (*(short *)((char *)p_out + 2) >= 0) {   /* jl @0x69F686 : mot 2 SIGNÉ */
                if (rand() < 0x800) {         /* jge @0x69F696 : SIGNÉ */
                    char *tk = (char *)BdLinkTask_Register(&dword_25101B8, sub_6A0A50);
                    if (tk != 0) {
                        FillDwords(tk + 0x0C, 0, 5);
                        *(int *)(tk + 0x10) = *(int *)p_out;        /* x,y */
                        *(int *)(tk + 0x14) = *(int *)((char *)p_out + 4);
                            /* ^ z + 1 MOT RÉSIDUEL de pile (GteState n'écrit
                             * que 3 mots) — copie telle quelle.
                             * UNCERTAIN 0x69F6C7 significativité du 4e mot
                             * pour les callbacks 6A0Axx. */
                        *(short *)(tk + 0x16) = (short)((rand() & 0x7FF) + 0x800);
                        *(short *)(tk + 0x18) = (short)((dx << 7) / DW(0x30));
                        *(short *)(tk + 0x1A) = (short)ped;    /* -50 @0x69F6EC */
                        *(short *)(tk + 0x1C) = (short)((dz << 7) / DW(0x30));
                    }
                }
                if ((unsigned)((int)W(0x0C) - 0x1E) < 0x1E    /* ebx @0x69F703 */
                    && rand() < 0x800) {                       /* jge @0x69F716 */
                    char *tk = (char *)BdLinkTask_Register(&dword_2510198, sub_6A0760);
                    if (tk != 0) {
                        int w = rand() & 0x7F;                 /* @0x69F778 */
                        FillDwords(tk + 0x0C, 0, 9);
                        *(int *)(tk + 0x10) = *(int *)p_out;
                        *(int *)(tk + 0x14) = *(int *)((char *)p_out + 4);
                        *(short *)(tk + 0x16) = (short)((rand() & 0x7FF) + 0x800);
                        *(short *)(tk + 0x18) = (short)((dx << 6) / DW(0x30)); /* shl 6 */
                        *(short *)(tk + 0x1A) = (short)(0xFFFFFF80 - w); /* -128-rand */
                        *(short *)(tk + 0x1C) = (short)((dz << 6) / DW(0x30));
                        *(short *)(tk + 0x28) = (short)((rand() & 0x3FF) - 0x200);
                        *(short *)(tk + 0x2A) = (short)((rand() & 0x3FF) - 0x200);
                        *(short *)(tk + 0x2C) = (short)((rand() & 0x3FF) - 0x200);
                    }
                }
            }
            cur += 8;                         /* stride 8 @0x69F7DB */
        } while (--it != 0);                  /* var_90 @0x69F7E7 */
    }

    /* ==== BLOC U 0x69F7ED-0x69F947 : op [0x14,0x18] NON SIGNÉ ============== */
    if ((unsigned)((int)W(0x0C) - 0x14) < 5) {              /* jnb @0x69F7F7 */
        short rot[9];                         /* var_70 (18h premiers octets) */
        int   tr[3];                          /* var_5C/58/54 : dwords movsx,
                                                 écrits AVANT readCaPre @69F81E-2B */
        int   angle;
        Mat3S16_MakeRotY_Q12(*(short *)((char *)dword_2510170 + 0x0E), rot);
        tr[0] = (int)(short)W(0x34); tr[1] = (int)(short)W(0x36);
        tr[2] = (int)(short)W(0x38);
        Field_readCaPre(rot);                 /* passe &var_70 (struct 20h+tr) */
        preCamReadVariables_Space(rot);       /* add esp,10h @0x69F83E */
        angle = rand();                       /* edi @0x69F846 */
        SpawnPair_6A0BE0(t, 0x100);           /* var_98 = 0x100 @0x69F89E */
    }

    /* ==== BLOC V 0x69F947-0x69FA9B : op [0x19,0x40] NON SIGNÉ ============== */
    /* Clone EXACT du bloc U (même callback sub_6A0BE0, même liste 25101B8,
     * 2 itérations, même lissage). SEULE diff ASM : var_98 = 0x400 @0x69F9F8
     * (au lieu de 0x100) + ordre interne de 2 movsx (0x69FA45/0x69FA5A),
     * sémantique identique — vérifié 0x69F8E6-0x69F936 vs 0x69FA40-0x69FA90. */
    if ((unsigned)((int)W(0x0C) - 0x19) < 0x28) {           /* jnb @0x69F951 */
        short rot[9];
        int   tr[3];
        int   angle;
        Mat3S16_MakeRotY_Q12(*(short *)((char *)dword_2510170 + 0x0E), rot);
        tr[0] = (int)(short)W(0x34); tr[1] = (int)(short)W(0x36);
        tr[2] = (int)(short)W(0x38);
        Field_readCaPre(rot);
        preCamReadVariables_Space(rot);
        angle = rand();                       /* @0x69F9A0 */
        SpawnPair_6A0BE0(t, 0x400);           /* var_98 = 0x400 @0x69F9F8 */
    }

    /* ==== BLOC W 0x69FAA1-0x69FADB : op [0x19,0x29] MULTIPLES DE 4 ========= */
    /* pop edi @0x69FAA8 / pop ebx @0x69FAAC (edi param fantôme confirmé mort) */
    op25 = (int)W(0x0C) - 0x19;               /* @0x69FAA1/0x69FAA5 */
    if ((unsigned)op25 < 0x11 && (op25 & 3) == 0) {
        /* ^ jnb @0x69FAAD + test al,3 / jnz @0x69FAAF-0x69FAB1.
         * SEULS les op25 % 4 == 0 passent (l'en-tête "pas multiple de 4" de
         * c_a est faux). op ∈ {0x19, 0x1D, 0x21, 0x25, 0x29}. */
        char *tk = (char *)BdLinkTask_Register(&dword_25101A8, sub_6A08D0);
        if (tk != 0) {
            FillDwords(tk + 0x0C, 0, 2);
            *(int *)(tk + 0x10) = (int)t;     /* [esi+10h] = ebp @0x69FADB */
        }
    }

    /* ==== BLOC X 0x69FADE-0x69FB2A : SE, incréments, retour ================ */
    if (W(0x0C) == 1)
        BdPlaySE(&dword_1181028, 0, 0x80);    /* @0x69FAF1 */
    {
        short op = W(0x0C);
        W(0x28) = (short)(UW(0x28) - 100);    /* add word,0FF9Ch @0x69FAFD */
        W(0x2A) = (short)(UW(0x2A) + 100);    /* add word,64h    @0x69FB02 */
        if ((short)op >= 0x4B)                /* cmp ax,4Bh / jl @0x69FB07-0B SIGNÉ 16 bits */
            return 2;                         /* mov eax,2 @0x69FB0E */
        /* inc eax 32 bits @0x69FB1B : si ax == 0xFFFF le report 32 bits fait
         * repartir op à 0 (cas dégénéré op=0xFFFF uniquement). */
        W(0x0C) = (short)(op + 1);            /* mov [ebp+0Ch],ax @0x69FB1D */
        return 0;                             /* xor eax,eax @0x69FB21 */
    }
}
```

## Analyse semantique

# Sémantique sub_69EF60 @ 0x69EF60 (réconciliation R)

- Rôle (1 phrase) : Tick (callback de tâche liée BdLinkTask) de la tâche enfant d'effet MAG213 enregistrée par sub_69EB70 — stepper 76 pas sur le word `[task+0Ch]` (0..0x4B) qui rattache l'os 0x1D du caster, interpole en Q12 le projectile entre cibles successives, applique les résultats de combat à l'impact, anime un maillage orbital de 308 sommets + sprite billboard dans l'OT, et sème particules/SFX/liaisons dans 3 listes de tâches.
- Verdict : LIKELY consolidé
- Confiance : LIKELY
  - Callers + callees + opcodes alignés (toutes les preuves ci-dessous vérifiées contre asm.asm live) ; convention BdLinkTask corroborée par le wiki via QMD côté R (`BdLinkTask_Register(list_head, callback)` 0x508360, Pump 0x508420 invoque `node+8` — battle-static-call-graph.md). CERTAIN inatteignable : l'identité « MAG213 » ne repose que sur le contexte orchestrateur (aucune entrée wiki MAG213) et les tables `unk_117EA88`/`unk_117DD7C`/`unk_117ADE0` ne sont pas auditées ; protagoniste du champ +0x0E non écrit dans ce corps.
- Nom catalogue : aucun (IDA `sub_69EF60` brut, `__usercall@<eax>(int@<edi>, int)` fausse — EDI fantôme). Proposition (markdown seul) : **`Mag213_BdLinkTask_FxStepper`**
  - ≥2 preuves ASM indépendantes : (1) xref data unique @0x69ECA1 depuis sub_69EB70 — la fonction est prise par adresse comme callback, jamais callée ; (2) machine à états auto-portante sur word `[ebp+0Ch]` avec contrat de retour EAX 0/2 (`cmp ax,4Bh; jl` signé @0x69FB0B → `mov eax,2` @0x69FB0E sinon `inc` + store word @0x69FB1D + `xor eax,eax` @0x69FB21) — exactement le contrat tick invoqué par le Pump sur `node+8` (wiki) ; (3) 7 sites `BdLinkTask_Register` internes (@0x69F45B…0x69FABD) → génération d'effets enfants (« Fx »). « Tick » de A et « Stepper » de B désignent le même comportement ; « BdLinkTask » est ancré ASM (callee nommé) + convention wiki, « Mag213 » vient du caller.

- In / Out / Effets :
  - In : `arg_0` (stack) = pointeur de nœud de tâche (`ebp` @0x69EF6C). Signature Hex-Rays à 2 args fausse : EDI pushé @0x69EFAA, écrasé @0x69EFCC (`lea edi,[ecx+1B18h]`), jamais lu → **a1@edi fantôme**. Second arg (EDI) mort, confirmé par les deux voix.
  - Champs tâche : **+0x0C** op u16 (0..0x4B, dispatch + auto-incrément @0x69FB1D) ; **+0x0E** borne nb de cibles (lecture unique @0x69F171 `mov cx,[ebp+0Eh]`, sert de borne au wrap de +0x22 ; jamais écrite ici) ; **+0x10+i×4** dwords acteurs cibles (`[ebp+edx*4+10h]` @0x69F156) ; **+0x1C+i** octet id d'event (indexe table 24 o de dword_251017C, 0x69F12D–0x69F13D) ; **+0x20/+0x22** ids source/cible courante (swap @0x69F175, wrap à w0E−1 @0x69F183-0x69F184) ; **+0x24/+0x26** poids Q12 et incrément (`add word [ebp+24h],0F000h` @0x69F16B = wrap u16 après dépassement 0x1000) ; **+0x28/+0x2A** angles persistants (−0x64 @0x69FAFD / +0x64 @0x69FB02 par step) ; **+0x2C** amplitude (retour sub_69EE80 → ax @0x69F163, réutilisée comme spread `imul edi,eax; sar edi,10h` @0x69F5A5-0x69F5A8) ; **+0x30** distance sqrt (push dword unique @0x69F1C3, `mov [ebp+30h],eax` @0x69F1C9) ; **+0x34..+0x38** pose os 0x1D (scale 0x400 @0x69EF7D), **+0x3C..+0x40** copie (`rep movsd` ecx=8 @0x69F4FB, chaque tick op≥0x1D) ; **+0x44** direction (sub_50CBA0 @0x69F298) ; **+0x64** buffer rendu 0x4A0 (init op 0 depuis unk_117EA88 via sub_7016B0 @0x69F38C) ; 0x140 depuis unk_117DD7C @0x69F519 à chaque tick op≥0x1D.
  - Out : **EAX 32 bits = 0** (en cours, op word incrémenté @0x69FB1D) ou **2** (op short ≥ 0x4B, `jl` signé @0x69FB0B) — les deux écrits en pleine largeur (`mov eax,2` @0x69FB0E / `xor eax,eax` @0x69FB21), valeur logique 0/2 famille MAG.
  - Effets : `BattleGeom_ResolveBoneIndexAndPose` à chaque tick (@0x69EF80) + os 0xF1 pour les ancrages cibles (@0x69F098/0x69F0B2) ; **`BattleAction_ApplyResultAndSpawnPresentation` @0x69F141** (résultats combat par cible à l'impact) sweetened par sub_69EE80 @0x69F15b ; **7× `BdLinkTask_Register`** (@0x69F45B/0x69F5B5/0x69F6A2/0x69F726/0x69F85E/0x69F9B8/0x69FABD — callbacks sub_6A0AF0/6A0C80/6A0A50/6A0760/6A0BE0×2/6A08D0 sur dword_25101B8/2510198/25101A8) ; insertion sprite OT `g_BattleOTBase+0x44` groupe 2 via sub_69FD00 (@0x69F359, tête chaînée dword_2510194) ; scratch symétrique bs_modulo(0x5C) @0x69EFB7 / `BattleScratch_Unwind(0x5C)` @0x69F35E-0x69F365 ; SFX BdPlaySE3D si op==8 (@0x69EF88/0x69EF97), BdPlaySE si op==1 (@0x69FADE/0x69FAF1) ; GTE MVMVA via Thunk_460860_480012 sur 308 records stride 8 à dword_2510178+0x1B18 (@0x69EFCC, var_A0=134h @0x69EFFD) ; angles entretenus +0x28/−0x64, +0x2A/+0x64.
  - Dispatch (ordre ASM, cf. c_reconciled/reconcile_notes #16) : fenêtre maîtresse [0x19,0x4A] (0x69EFA3-0x69EFAF `sub 19h; cmp 32h; jnb`) → blocs B..L (halo, lerp, résultat, sprite) ; [0x00,0x17] (0x69F374 `cmp 18h; jnb` + init 0x4A0 si op==0 @0x69F38C) ; [0x14,0x18] (0x69F7F7 `cmp 5; jnb`) paire 6A0BE0 échelle 0x100 ; [0x23,0x40] (0x69F589-0x69F58F `sub 23h; cmp 1Eh; jnb`) 2 particules sub_6A0C80+sub_6A06C0 ; [0x1E,0x45] (0x69F628-0x69F632 `sub 1Eh; cmp 28h; jnb`) balayage 308 sommets : 6A0A50 (si y≥0 signé @0x69F686 et rand<0x800 @0x69F696) et 6A0760 (si op ∈ [0x1E,0x3B], @0x69F703) ; [0x19,0x40] (0x69F951 `cmp 28h; jnb`) paire 6A0BE0 échelle 0x400 ; {0x19,0x1D,0x21,0x25,0x29} (0x69FAAB-0x69FAB1 `(op25)%4==0`) tâche écho 6A08D0 avec `node+0x10 = ebp` @0x69FAD5.

- Divergences A/B (tranchées une par une, preuve ASM adresée) :
  1. **Nom** — A `MAG213_EffectChildTask_Tick` vs B `Mag213_BdLinkTask_FxStepper` : **synthèse → B**, « BdLinkTask » ancré par les 7 sites Register + caller data xref @0x69ECA1 et la convention wiki (Pump invoque node+8) ; « Tick »≈« Stepper » mêmes contenus.
  2. **Plage bloc S** — A « 0x23–0x50 » vs B « [0x23,0x40] » : **tranché B** — @0x69F589-0x69F58F `sub edx,23h; cmp edx,1Eh; jnb` ⇒ 0x23+0x1E−1 = **0x40** ; le « 0x50 » de A est arithmétiquement incompatible avec son propre `cmp 1Eh`.
  3. **Gate sub_6A0760** — A « état < 0x30 » vs B « op < 0x3B » : **tranché ASM** — @0x69F628-0x69F62C `ebx = op − 0x1E`, @0x69F703 `cmp ebx,1Eh; jnb (→ 0x69F7D3)` ⇒ spawn si (op−0x1E) < 0x1E, soit **op ∈ [0x1E, 0x3B]** ; B juste en substance mais off-by-one (0x3B inclus), A faux (0x30 ≠ 0x1E+0x1E).
  4. **Init phase 2 (unk_117DD7C 0x140 + copie +0x34→+0x3C)** — A « op == 0x1D exactement » vs B « si step 0x1D » : **les deux faux ; tranché ASM** (conforme reconcile_notes #5) — gate de bloc `cmp 1Dh; jl` @0x69F4E9 ⇒ bloc Q exécuté pour **tout op ≥ 0x1D à chaque tick** ; le `jnz` @0x69F4FD n'est jamais pris (ZF=1 garanti après `rep movsd` ecx=0).
  5. **Bloc V absent de A** — la deux­ième paire sub_6A0BE0 ([0x19,0x40], Register @0x69F9B8, échelle **0x400** @0x69F9F8) figure chez B seul : **tranché B** (aussi reconcile_notes #17 : diff U/V = var_98 0x100 @0x69F89E vs 0x400 @0x69F9F8, le reste identique).
  6. **Bloc W plage** — A « 0x19–0x29 ∧ ≡0 mod 4 » vs B « {0x19,0x1D,0x21,0x25,0x29} » : converge ; précision ASM @0x69FAAB-0x69FAB1 `test al,3; jnz` saute si (op−0x19)%4 ≠ 0 ⇒ B plus exact.
  7. **Largeur retour** — A « EAX 32 bits, pas AL only » vs B « EAX 32 bits, portés par AL » : **convergent** — EAX écrit en entier (0x69FB0E/0x69FB21), test de fin 16 bits `cmp ax,4Bh; jl` **signé** @0x69FB07-0x69FB0B.
  8. **+0x0E** — A « nb de cibles pour le wrap » vs B « clamp de +0x22 » : **tranché partiellement ASM** — unique lecture @0x69F171 `mov cx,[ebp+0Eh]` comme borne du wrap de +0x22 (0x69F17A-0x69F184 : `cmp ax,cx; jl` signé, sinon `dec ecx; mov [ebp+22h],cx`) ; aucune écriture de +0x0E dans ce corps ⇒ rôle exact à confirmer côté caller (question ouverte), l'hypothèse B non prouvée dans ce pack.
  9. **Élévation vague [ebx+8]** — A « [ebx+8] = sin(...) pour états 25–32 et 33+ » : **reformulé contre l'ASM** — 3 branches : op25<8 (0x69F1D6/0x69F1DE) → `[ebx+8] = 1000h − sin((x&0x3FFFFF)<<7)` @0x69F201-0x69F20D (pas sin brut) ; 8 ≤ op25 ≤ 0x2A → `[ebx+8]=0` @0x69F239 (via `jbe` @0x69F215) ; op25>0x2A → `[ebx+8]=sin((x<<7 −0x1481)&0x1FFFFF80)` @0x69F217-0x69F22D — identique à la tranchée c_reconciled #4.
  10. **a1@edi** — convergence des deux voix (EDI mort) : confirmé (push @0x69EFAA / écrasement @0x69EFCC, aucune lecture avant).

- Preuves (ASM cité) :
  1. 0x69EF60-0x69EF85 : `BattleGeom_ResolveBoneIndexAndPose(dword_2510170, 0x1D, 0x400, ebp+34h)` à CHAQUE tick + os 0xF1 pour ancrages cibles @0x69F098/0x69F0B2 → ticker d'effet ancré au caster, pas constructeur one-shot.
  2. 0x69FAF9-0x69FB21 : `mov ax,[ebp+0Ch]; cmp ax,4Bh; jl` (signé 16 bits) → `mov eax,2; retn` si fini, sinon `inc eax; mov [ebp+0Ch],ax; xor eax,eax` → machine à états 0..0x4B, retour EAX 0/2.
  3. 0x69F110-0x69F141 : `[ebp+24h] += [ebp+26h]`, `cmp cx,1000h; jl` @0x69F118-0x69F121 (signé, poids stocké avant test) ; à saturation : event = `dword_251017C→[+4]→[+8 + idx×24]` poussé à `BattleAction_ApplyResultAndSpawnPresentation` @0x69F141, puis `add word [ebp+24h],0F000h` @0x69F16B et swap +0x20/+0x22 @0x69F175 → impact cible par cible, multi-cibles.
  4. 0x69EFFD `mov var_A0,134h` (308) + boucle stride 8 sur unk_117ADE0 avec GTE MVMVA (Thunk_460860_480012 @0x69F011) et fusion angle `[edi+6] + [ebp+2Ah]` @0x69F020-0x69F027 → maillage orbital de 308 records × 8 octets, angles entretenus à +0x28/+0x2A.
  5. 0x69F359 `sub_69FD00(ebx, g_BattleOTBase+0x44, 2, dword_2510194)` + 0x69F34C texel `(idx&7)<<4` + 0x69F35E-0x69F365 `BattleScratch_Unwind(0x5C)` équilibrant `bs_modulo(0x5C)` @0x69EFB7 → sprite billboard dans la draw-list OT groupe 2, épilogue scratch symétrique.
  6. 0x69F45B/0x69F5B5/0x69F6A2/0x69F726/0x69F85E/0x69F9B8/0x69FABD : 7 × `BdLinkTask_Register(callback, list_head)` vers sub_6A0AF0/6A0C80/6A0A50/6A0760/6A0BE0(×2)/6A08D0, avec `FillDwords(node+0xC, 0, 5|9|2)` et `[esi+10h] = ebp` @0x69FAD5 (chaînage parent) → gerbe de sous-tâches FX.
  7. 0x69F141 contexte : `BattleAction_ApplyResultAndSpawnPresentation` cité ; 0x69F163 `mov [ebp+2Ch],ax` (retour sub_69EE80) réutilisé comme spread @0x69F5A5-0x69F5A8 (`imul edi,eax; sar edi,10h`).
  8. 0x69F703 `cmp ebx,1Eh; jnb` (unsigned sur ebx = op−0x1E @0x69F62C) vs 0x69FB07-0x69FB0B `cmp ax,4Bh; jl` (signé) : polarités correctement mixées unsigned pour les fenêtres d'opcode et signé pour les compteurs de fin — conforme §8.

- Checks §5.6 :
  - Callees cités (BattleGeom_ResolveBoneIndexAndPose, BdPlaySE3D, bs_modulo, Mat3S16_MakeRotZ_NegSin_Q12, Field_readCaPre, preCamReadVariables_Space, setSomeDword5, Thunk_460860_480012, GteState_GetWord3_1CA8A34, Fixed_Sin4096_Q12/Fixed_Cos4096_Q12, BattleAction_ApplyResultAndSpawnPresentation, sub_69EE80, sqrt, sub_50CBA0, Mat3S16_MulQ12_IntoArg0, Mat_ComposeTwoThenCopy8, sub_69FD00, BattleScratch_Unwind, sub_7016B0, CameraBasis_CopyDefaultAndApplyEulerS16, sub_701970, _rand, BdLinkTask_Register, FillDwords, sub_6A06C0, BdPlaySE, Mat3S16_MakeRotY_Q12) : **tous présents dans callees.txt** ✓ ; callbacks 69FB30/6A0AF0/6A0C80/6A0A50/6A0760/6A0BE0/6A08D0 passés par adresse (hors CALLS, correct).
  - Caller : unique xref data `sub_69EB70 @0x69ECA1` — présent, cohérent (enregistrement de tâches). ✓
  - Strides en nombres : table acteurs `+10h + idx×4` (@0x69F156 dword), events ×24 (`lea eax,[eax+eax*2]` + `×8` @0x69F12F-0x69F13D), maillage 0x134h × stride 8 (@0x69EFFD, `add esi,8` des branches), FillDwords 5/9/2 dwords à node+0xC. ✓
  - Polarités : `jnb`/`jb`/`jbe` unsigned pour fenêtres d'opcode (@0x69EFAF cmp 32h, 0x69F374, 0x69F58F, 0x69F632, 0x69F703, 0x69F7F7, 0x69F951, 0x69FAAC) ; `jl`/`jge` signés pour compteurs/coordonnées (0x69FB0B vs 0x4B, 0x69F121 vs 0x1000, 0x69F181 wrap cible, 0x69F686 y projeté, 0x69F696 rand vs 0x800). ✓
  - Largeur retour : EAX 32 bits écrit avant chaque retn. ✓
  - Nom ≥2 preuves ASM indépendantes (xref data + contrat d'état 0/2) + convention wiki. ✓
  - Aucun nom catalogue mensonger (fonction anonyme) ; pas de leurre 0x01000000 ; signature IDA `__usercall@<edi>` corrigée (EDI fantôme) et `sqrt` relu en proto 1 dword (0x69F1C3-0x69F1C9).

- Questions ouvertes (non bloquantes) :
  - Lecture wiki côté pack avait échoué (wiki.md vide) : le corroborage QMD n'a porté que sur la convention BdLinkTask — « MAG213 » reste hérité du contexte orchestrateur sub_69EB70, non documenté dans le wiki indexé.
  - rôles exacts +0x28/+0x2A (angle orbital vs offset) et +0x2C (amplitude acteur vs spread) : les deux usages coexistent dans l'ASM, nommage indicatif (hérité UNCERTAIN c_reconciled).
  - sub_50CBA0(delta, task+0x44) : écrit-elle dans task+0x44 (arg2) ? non tranché par lecture seule.
  - 4e mot résiduel de pile GTE lu à 0x69F0B7/0x69F6C7 (au-delà des 3 mots écrits) : significativité pour les callbacks 6A0A50/6A0760.
  - Contenu des tables unk_117EA88/117DD7C/117ADE0 non audité (aveugle) ; « max 3 cibles » (layout +0x10/+0x1C) à confirmer par sub_69EB70 ; source d'écriture de +0x0E, +0x20/+0x22/+0x24/+0x26 hors pack ; dword_1181028 (id son exact) non résolu.

IDBCOMMENT: Tick de la tache enfant liee (BdLinkTask) enregistree par le stepper maitre MAG213 sub_69EB70, machine a etats sur le word [task+0Ch] de 0 a 4Bh, retour EAX 0 en cours ou 2 a la fin. A chaque tick il rattache l'os 1Dh du caster, interpole le projectile en Q12 entre cibles successives via les poses d'os F1h, applique les resultats de combat par BattleAction_ApplyResultAndSpawnPresentation a saturation du poids task+24h puis enchaine les cibles. Il anime un maillage orbital de 308 sommets (unk_117ADE0, angles task+28h et task+2A), pose un sprite billboard dans l'OT battle via sub_69FD00, seme des particules dans les listes 25101B8/2510198/25101A8 via BdLinkTask_Register et joue des SFX aux etapes 1 et 8. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_69EF60 (0x69EF60, 837 instr / 3019 o)

Voix C-R. Ground truth = live ASM (`asm.asm`). Hex-Rays (`hexrays.c`) = vérificateur
seulement. Livrable : `c_reconciled.c` (structure par blocs conservée, blocs
répétitifs U/V factorisés via `SpawnPair_6A0BE0` avec la diff paramétrée).

## Divergences tranchées (position A vs B, preuve ASM adresée)

1. **Proto / paramètre `a1@<edi` (Hex-Rays) — fantôme.**
   A (Hex-Rays, suivi partiellement par c_b) : `int __usercall f(int a1@<edi>, int a2)`.
   B (c_a) : cdecl à un arg.
   **Tranché B.** edi est pushé @0x69EFAA et popé @0x69FAA8, jamais lu avant ;
   premier write = `lea edi,[ecx+1B18h]` @0x69EFCC (écrasement, pas lecture).
   Le `HIDWORD(v75) = a1` @hexrays.c:98 est un artefact de réutilisation de pile
   par Hex-Rays. `a2` (arg_0 stack, lu @0x69EF6C `mov ebp,[esp+0A4h+arg_0]`) est
   le seul paramètre réel : `sub_69EF60(int task)`.

2. **Source du mot angle du bloc B — record GTE vs table destination.**
   A (c_b) : lit `src[3]` (table `unk_117ADE0`, destination de GteState).
   B (c_a) : lit `cx = w[edi+6]` sans dire d'où vient edi.
   **Tranché ASM** : `mov cx,[edi+6]` @0x69F01C, et edi = `dword_2510178+0x1B18+i*8`
   (@0x69EFCC) = record **d'entrée** GTE, pas la table de sortie. Source = record.

3. **`sar 1` du bloc B — argument vs résultat.**
   A (c_a) : `edi = Fixed_Sin4096_Q12(cx) >> 1 >> 3` (sar 1 APRÈS l'appel).
   B (c_b) : `h = ((int)src[3] >> 1)` puis `Fixed_Sin4096_Q12(h) >> 3`.
   **Tranché B.** ASM : `movsx eax,cx; sar eax,1; push eax; call Fixed_Sin4096_Q12`
   @0x69F02B-0x69F031 → le `sar 1` est sur l'argument AVANT l'appel ; le `sar 3`
   @0x69F042 est sur le retour.

4. **Branche wobble intermédiaire du bloc I (8 ≤ op25 ≤ 0x2A).**
   A (c_a) : cette branche écrit `sin` dans [ebx+8] et 0 dans [ebx+4] ; la branche
   >0x2A écrit 0.
   B (c_b) : branche intermédiaire = `[ebx+8] = 0` ; branche >0x2A = sin + `[ebx+4]=0`.
   **Tranché B.** ASM : `jbe short 0x69F239` @0x69F215 saute vers `mov dword
   [ebx+8],0` @0x69F239 ; la branche sin (`0x69F217`-`0x69F230`, avec
   `[ebx+4]=0` @0x69F230) est le cas op25 **>** 0x2A. c_a a permuté les corps.

5. **Garde `op == 0x1D` sur la copie pos + sub_7016B0(0x140) du bloc Q.**
   A (Hex-Rays) : `if (v33 == 29)` autour de `DW(0x3C)=DW(0x34); DW(0x40)=DW(0x38);
   sub_7016B0(unk_117DD7C, ..., 0x140)`.
   B (c_b) : exécution **inconditionnelle** pour tout op ≥ 0x1D.
   **Tranché B.** ASM : `rep movsd` (ecx=8 → ecx=0, ZF=1) @0x69F4FB puis
   `jnz short 0x69F521` @0x69F4FD — le jnz n'est **jamais** pris (ZF=1 garanti
   après rep movsd). Hex-Rays a réinterprété le jnz comme un test d'égalité.

6. **Test `p_out & 0x80000000LL` (Hex-Rays) = signe du 2e mot GTE.**
   A (Hex-Rays) : test 64 bits `(p_out & 0x80000000LL) == 0`.
   B (c_b) : `cmp word [p_out+2],0 / jl` — signe du mot 2 (IR2).
   **Tranché B (équivalence sémantique, écriture mot).** ASM @0x69F680-0x69F686 :
   `cmp [esp+...+p_out+2],0; jl 0x69F7D3`. Même polarité que Hex-Rays mais la
   représentation fidèle est le mot signé.

7. **`sqrt` : CRT double vs int un-dword.**
   A (Hex-Rays) : arg double 64 bits (`v75`, HIDWORD = a1).
   B (c_b) : `int sqrt(int)` — 1 dword poussé, retour EAX.
   **Tranché B.** ASM : un seul `push edx` @0x69F1C3, `add esp,4` @0x69F1D3,
   retour lu dans EAX @0x69F1C9 (`mov [ebp+30h],eax`). Ce n'est pas le prototype
   CRT ; nom `sqrt` conservé car c'est le symbole d'appel, proto corrigé.

8. **var_94 = dz, PAS dy.**
   A (en-tête c_a) : « var_94 = dx dword ».
   B (c_b) : `v82` = dz, `v76` = dx.
   **Tranché B.** ASM : var_94 ← `fz − w[ebp+38h]` (z) @0x69F1AA ; var_A0 ←
   `fx − w[ebp+34h]` (x) @0x69F1BD. dy vit dans edi (registre) jusqu'au bloc T
   où edi est réaffecté à −50 @0x69F65F.

9. **Ordre idxA/idxB dans le bloc G.**
   A (c_a) : `W(0x20) = ax` puis `++ax` puis store.
   **Tranché (séquence ASM exacte)** : @0x69F167-0x69F184 : `W(0x22)` lu →
   `W(0x20) = W(0x22)` @0x69F175 → `inc` @0x69F179 → `cmp ax,cx; jl` @0x69F17D-81
   (signé) → sinon `dec ecx; W(0x22) = cx` (wrap à w0E−1). Poids :
   `add word [ebp+24h],0F000h` @0x69F16B (word add = −0x1000 Q12).

10. **`dword_2510170` déréférencé, pas adressé.**
    A (c_b, blocs N/U/V) : `*(short *)&dword_2510170` (lit le pointeur comme mot).
    **Tranché ASM** : `mov edx,dword_2510170; mov ax,[edx+0Eh]` @0x69F394-0x69F39F
    (bloc N) et `mov ecx,dword_2510170; mov dx,[ecx+0Eh]` @0x69F7FD/0x69F808 et
    @0x69F957/0x69F962 (blocs U/V) — c'est `*(short*)(dword_2510170 + 0x0E)`.

11. **m02 de var_70 (bloc J) : reliquat de pile ? — NON, initialisé.**
    A (c_b, UNCERTAIN) : « mot w[2] jamais initialisé ».
    **Résolu** : `mov word [esp+...var_70+2],ax` @0x69F276 avec ax=0 — la totalité
    des 9 mots de var_70 est explicitement écrite (@0x69F250-0x69F276). L'UNCERTAIN
    c_b est levé.

12. **`BattleScratch_Unwind` : arg ou pas ?**
    A (c_a) : `BattleScratch_Unwind()` sans arg.
    B (c_b) : `BattleScratch_Unwind(0x5C)`.
    **Tranché B.** ASM : `push 5Ch` @0x69F35E juste avant `call` @0x69F365 ;
    le `add esp,38h` @0x69F36A solde les args cdecl restants
    (16 de sub_69FD00 + 4 de Unwind + 0x24 des appels Compose/readCaPre/preCam/
    MulQ12/50CBA0). bs_modulo, lui, est stdcall (push 5Ch @0x69EFB5, pas de add).

13. **sub_701970 : 4 args + ctx 3 dwords sur la pile.**
    A (c_a) : modèle 6 args inline.
    **Tranché ASM** : 4 pushes @0x69F407-0x69F417 (0, &p_out/var_20, sub_69FB30,
    task+0x64) + struct ctx 3 dwords construite à part (@0x69F403/0x69F418/0x69F420
    = {&m8x, unk_118102C, dword_2510178+0x24B8}). Même schéma @0x69F55B-0x69F57D
    avec unk_1181054.

14. **Bloc W : multiples de 4, pas l'inverse.**
    A (en-tête c_a) : « plage 0x19..0x29 pas multiple de 4 ».
    **Tranché ASM** : `test al,3; jnz short 0x69FADE` @0x69FAAF-0x69FAB1 → on
    SAUTE si (op25 % 4) != 0. Seuls op25 ∈ {0,4,8,0xC,0x10} (op ∈ {0x19,0x1D,
    0x21,0x25,0x29}) enregistrent sub_6A08D0 sur dword_25101A8.

15. **Retour 2 : polarité signée 16 bits.**
    A : ambigu (« op ≥ 0x4B »).
    **Tranché ASM** : `mov ax,[ebp+0Ch]` @0x69FAF9 puis `cmp ax,4Bh; jl` @0x69FB07-0x69FB0B
    → **jl signé 16 bits** : retour 2 si (short)op ≥ 0x4B, sinon
    `inc eax` (32 bits, @0x69FB1B — report possible si op=0xFFFF, cas dégénéré)
    → store word @0x69FB1D et `xor eax,eax` (retour 0).

16. **Plages de dispatch — ordre et polarité réels (question 1 du brief).**
    Ordre d'exécution ASM (pas l'ordre source) :
    1. `0x69EFAF` : (op−0x19) ≥ 0x32 **unsigned** (`jnb`) → saute au bloc M.
       Fenêtre maîtresse [0x19,0x4A].
    2. Blocs B..L (halo, poses, résultat, sprite OT) pour [0x19,0x4A].
    3. `0x69F374` : op ≥ 0x18 **unsigned** (`jnb`) → bloc M pour [0x00,0x17]
       (avec sub_7016B0 0x4A0 si op==0 @0x69F37A).
    4. `0x69F4E9` : op < 0x1D **signé** (`jl`) → bloc Q pour op ≥ 0x1D.
    5. `0x69F58F` : (op−0x23) ≥ 0x1E **unsigned** → bloc S pour [0x23,0x40].
    6. `0x69F632` : (op−0x1E) ≥ 0x28 **unsigned** → bloc T pour [0x1E,0x45].
    7. `0x69F7F7` : (op−0x14) ≥ 5 **unsigned** → bloc U pour [0x14,0x18].
    8. `0x69F951` : (op−0x19) ≥ 0x28 **unsigned** → bloc V pour [0x19,0x40].
    9. `0x69FAAD` : (op−0x19) ≥ 0x11 **unsigned** + `test al,3` → bloc W pour
       op25∈[0x00,0x10] multiple de 4.
    Le wobble « 0x19-0x29 » du brief = bloc W (multiples de 4 uniquement).

17. **Boucles clones sub_6A0BE0 (question 3).** Diff exacte = var_98 du 1er
    vecteur GTE : **0x100** @0x69F89E (bloc U) vs **0x400** @0x69F9F8 (bloc V).
    Tout le reste est identique (lissages `>>4` mots signés, `w16=(rand&7FF)+0x800`,
    angle += 0x800) ; l'ordre interne de 2 movsx diffère (@0x69F8EB vs @0x69FA45),
    sémantique identique. Factorisé dans `SpawnPair_6A0BE0(t, w2_z)`.

18. **Ordre des BdLinkTask_Register (question 7).** 7 sites, dans l'ordre ASM :
    1. 0x69F45B : `sub_6A0AF0` sur **dword_25101B8** (bloc N, ×2 itérations, ebx=2)
    2. 0x69F5B5 : `sub_6A0C80` sur **dword_25101B8** (bloc S, ×2, seed = rand*w2C>>16)
    3. 0x69F6A2 : `sub_6A0A50` sur **dword_25101B8** (bloc T, gate rand<0x800)
    4. 0x69F726 : `sub_6A0760` sur **dword_2510198** (bloc T, gate ebx<0x1E + rand<0x800)
    5. 0x69F85E : `sub_6A0BE0` sur **dword_25101B8** (bloc U, ×2, w2=0x100)
    6. 0x69F9B8 : `sub_6A0BE0` sur **dword_25101B8** (bloc V, ×2, w2=0x400)
    7. 0x69FABD : `sub_6A08D0` sur **dword_25101A8** (bloc W, FillDwords 2, +0x10=task)
    Ordre des subs hors Register (appelés directs) : sub_69FD00 @0x69F359,
    sub_6A06C0 @0x69F5DE, sub_69EE80 @0x69F15B, sub_50CBA0 @0x69F298,
    sub_701970 @0x69F424/0x69F57D, sub_7016B0 @0x69F38C/0x69F519, sub_69FB30
    (callback passé, jamais appelé ici). Tous les callbacks listés dans le brief
    (701970/7016B0/6A0C80/6A0A50/6A0760/6A0BE0/6A08D0 + 6A0AF0) sont couverts.

19. **Épilogue w28/w2A (question 6).** `add word [ebp+28h],0FF9Ch` @0x69FAFD
    (**−100**, wrap word 16 bits) puis `add word [ebp+2Ah],64h` @0x69FB02 (**+100**).
    Les deux sont des adds word AVANT le test de retour — exécutés dans tous les
    cas, y compris quand on retourne 2.

20. **Gates rand/p_out.y du bloc T (question 4).**
    `cmp [esp+...+p_out+2],0 / jl 0x69F7D3` @0x69F680-86 → passe si **mot 2 ≥ 0**
    (signé) ; `cmp eax,800h / jge` @0x69F691-96 (et @0x69F70C-16) → passe si
    **rand() < 0x800** (comparaison signée 32 bits, rand() ∈ [0,RAND_MAX] donc
    équivalent unsigned ici). Le 2e gate est en plus conditionné à
    `(unsigned)(op−0x1E) < 0x1E` via ebx @0x69F703.

21. **Poids / interpolation Q12 (question 5).** fx/fy/fz = `A + ((B−A)*w24)>>12`
    (imul + `sar 0Ch` @0x69F0D4/0x69F0E5/0x69F101) — arithmétique signée.
    Gates : `cmp ecx,5 / jb` @0x69F106-0x69F10E → **jb unsigned** sur op25 ;
    `cmp cx,1000h / jl` @0x69F118-0x69F121 → **jl signé** sur le poids cumulé
    (w26+w24, stocké @0x69F11D AVANT le test).

## UNCERTAIN restants

- **UNCERTAIN 0x69F298** : `sub_50CBA0(delta, task+0x44)` — écrit-elle dans
  task+0x44 (arg2) ? La copie rep movsd vers var_50 vient APRÈS l'appel
  (@0x69F2B0) ; si sub_50CBA0 modifie task+0x44, la copie la capture.
- **UNCERTAIN 0x69F6C7** : le dword copié de p_out+4 vers task-callback+0x14
  contient IR3 + un 4e mot résiduel de pile (GteState n'écrit que 3 mots) ;
  significativité du 4e mot pour les callbacks sub_6A0A50/sub_6A0760.
- **UNCERTAIN 0x69EF60** : sémantique exacte des champs w28/w2A (angle/offset ?)
  et w2C (résultat sub_69EE80 réutilisé comme « spread » au bloc S) — les deux
  rôles coexistent dans l'ASM, le nommage reste indicatif.
- **UNCERTAIN 0x69F0B7** : le 4e mot des structs p_out/var_88 (au-delà des 3
  mots GTE) est lu via `dword [esp+...+p_out+2]` @0x69F0D9 (mots 2-3) — le mot 3
  (résiduel) entre dans le calcul de fy ; même question de résidu de pile.

## Divergences vs Hex-Rays (résumé)

1. `__usercall a1@<edi>` fantôme → cdecl 1 arg (edi push/pop sans lecture).
2. `if (v33 == 29)` fictif : le `jnz` @0x69F4FD après `rep movsd` n'est jamais
   pris → copie pos + sub_7016B0(0x140) inconditionnels pour op ≥ 0x1D.
3. `sqrt` modélisé avec arg double 64 bits + HIDWORD=a1 : l'ASM ne pousse qu'un
   dword et le retour est EAX (proto int).
4. `(p_out & 0x80000000LL) == 0` : représentation 64 bits d'un test word signé
   (`cmp word [p_out+2],0 / jl`).
5. v6 (sar 1) appliqué APRÈS Fixed_Sin4096_Q12 chez Hex-Rays aussi
   (`Fixed_Sin4096_Q12(v5 >> 1)`) — cohérent avec l'ASM, c'était c_a qui divergeait.
6. Prototype `sub_701970(buf, cb, &p_out, 0)` chez Hex-Rays masque la struct
   ctx 3 dwords ; la forme ASM (4 pushes + ctx) est retenue.
