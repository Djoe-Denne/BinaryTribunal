# MAG_212_Effect_Tick_Stepper @ 0x6A0DC0

- Instr (live): 304 (1132 o, 0x6A0DC0-0x6A122B)
- Palier: 2+1
- Verdict: CERTAIN - stepper BdLinkTask de l'effet 212 (caller unique MAG_212_EffectEntry 0x6A0D50) : double buffer base-relatif +0xAAE0/0x1AAE0/0x2AAE0 togglé par ctx+0x0F ; stage init (3x BS_Memset 2510228/2510218/2510208, enregistrement du ticker MAG_212_Timeline_Tick sub_6A1660 sur dword_2510228 @0x6A0E77-81, FillDwords 0x331, bbox records stride 0x18 + LUT 0x1D972C0 entree 156 o avec centres /2 signes, copies payload-handle 0x30-3C, IndexLut_FillFF_AssignKeys 5 args (hdl+0x150,3,0xE,0x12,0x16), sub_5022C0, anim id 1, preload base+0x1BD0) ; puis 3x BdLinkTask_Pump (#1=esi gate, #2 jete, #3=ebx) ; stages 1->copie camera B8B800..C + inc, 2->AND word 0xFFFB sur 3 globaux + retour 2 ; sinon inc word[ctx+0x0C] ou retour 0 (AL)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A0DC0\nTYPE ; proposition: MAG_212_Effect_Tick_Stepper
- Notes parent: checks 5.6 OK : add eax,1AAE0h/2AAE0h (0x6A0DDC/F8), Register ticker (0x6A0E77-81), xor ebx,ebx (0x6A0FD0), pushes IndexLut 16h/3 + call (0x6A1073-10F7), push eax (0x6A110A), add esp,40h (0x6A1124), pumps dword_2510228 (0x6A1142-5D), inc word [edi+0Ch] (0x6A121F), caller data xref sub_6A0D50 @0x6A0D9B ; D1 C-R : 4 stores = 0 via xor ebx,ebx (c_b maxZ corrige)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A0DC0 (0x6A0DC0, .text, 1132 o, 304 instr live)
 * ============================================================================
 * Réconciliation c_a / c_b contre le live ASM (asm.asm). ASM = ground truth,
 * Hex-Rays (hexrays.c) = vérificateur seul.
 *
 * Métadonnées :
 *   Instr (live) : 304 / taille 1132 o. Palier : triple 2+1 (campagne mag FX
 *   battle). Type IDA : None ; prototype reconstruit __cdecl, 1 arg, ret EAX
 *   (0 = en cours, 2 = terminé) — l'appelant lit AL.
 *   Sauvegardes : sub esp,38h @0x6A0DC0 ; push ebx/esi/edi @0x6A0DC3-C5 ;
 *   push ebp @0x6A0E93 (chemin init uniquement), pop ebp @0x6A113A, add
 *   esp,4 @0x6A1137 + rechargement edi depuis arg_0 @0x6A1133 — équilibré
 *   sur tous les chemins de retour.
 *   Rôle (contexte cellules voisines) : stepper BdLinkTask de l'effet mag 212,
 *   enregistré par 0x6A0D50 (ctx unk_2510238) ; @0x6A0E77 enregistre le ticker
 *   sub_6A1660 sur dword_2510228, pompé chaque frame @0x6A1142+.
 *
 * Corrections majeures vs les voix (preuves adresées dans reconcile_notes.md) :
 *   - hdl+0x142, payload+0x0E, hdl+0x14A, word_251026A = 0 (bx remis à zéro
 *     @0x6A0FD0 AVANT ces stores) — c_b disait max2 sur les 4 : FAUX.
 *   - c_a avait OMIS le store hdl+0x142 @0x6A0FD9 : rétabli (= 0).
 *   - IndexLut_FillFF_AssignKeys : 5 args (pas 2 comme Hex-Rays).
 * ==========================================================================*/

#include <stdint.h>

/* ----------------------- Externes (globals.txt) -------------------------- */
extern unsigned int   dword_25101FC;   /* racine LUT scène ; +4 -> meta      */
extern unsigned int   dword_2510200;   /* payload présentation (acteur)      */
extern unsigned int   dword_2510270;   /* copié dans rec+0x0C                */
extern unsigned int   dword_2510274;   /* copié dans rec+0x10                */
extern uint8_t       *dword_2510278;   /* base buffers bataille              */

extern uint8_t      **dword_2510258;   /* double buffer A (bascule)          */
extern uint8_t      **dword_251025C;   /* double buffer B (bascule)          */
extern unsigned int   dword_2510260;   /* miroir [pres+0x1C] (dword)         */
extern unsigned int   dword_2510264;   /* miroir [pres+0x20] (dword)         */
extern uint16_t       word_2510268;    /* miroir hdl+0x130                   */
extern uint16_t       word_251026A;    /* écrit 0 (bx @0x6A10DB)             */
extern uint16_t       word_251026C;    /* bas de dword_251026C : hdl+0x134   */

/* Têtes de listes BdLinkTask */
extern uint8_t        dword_2510228[]; /* liste principale (ticker 6A1660)   */
extern uint8_t        dword_2510218[]; /* liste #2 (retour pump jeté)        */
extern uint8_t        dword_2510208[]; /* liste #3                           */

/* Convergence min/max + table sub_5022C0 */
extern unsigned int   dword_118BA18;
extern unsigned int   dword_118BA1C;
extern uint8_t        unk_118BA10[];
extern unsigned int  *dword_1181078;

/* Stade 2 : AND word 0xFFFB (clear bit 0x0004) @0x6A11B3-C2 */
extern uint16_t       g_BattlePresentationActors[];
extern uint16_t       dword_1D9735C;   /* accès WORD pur                     */
extern uint16_t       dword_1D973F8;   /* Hex-Rays le voit comme dword ; ASM */

/* Stade 1 : copie caméra @0x6A11D4-0x6A120E */
extern uint16_t       word_1D977A0;
extern uint16_t       word_1D8E038;
extern unsigned int   dword_B8B800;
extern unsigned int   dword_B8B804;
extern unsigned int   dword_B8B808;
extern unsigned int   dword_B8B80C;
extern unsigned int   Battle_Camera_world_XZ_s16;
extern unsigned int   Battle_Camera_world_Y;
extern unsigned int   Battle_Camera_LookAt_XZ_s16;
extern unsigned int   Battle_Camera_LookAt_Y;

/* ----------------------------- Callees ----------------------------------- */
extern void  BS_Memset(void *dst, const void *src, unsigned int size, int a4);
/* UNCERTAIN 0x6A0E34 : sémantique des args 3/4 (size? cap 0x40?) — forme
 * d'appelle certaine (pushes droite->gauche), sens des args non prouvé ici. */
extern void  sub_6A1280(void);
extern void *BdLinkTask_Register(void *list_head, void *callback);
extern unsigned int BdLinkTask_Pump(void *list_head);
extern void  FillDwords(void *dst, unsigned int val, unsigned int count_dwords);
extern void  Actor_MidpointBonesF0F1(const void *entry, int16_t out_mid[3]);
extern void  Vec3_MinMax_Stride8(const void *src, int16_t out[6]);
/* UNCERTAIN 0x6A103D : taille exacte du buffer out — seuls out[0..3] sont
 * prouvés utilisés ici (copie out[3] @0x6A1059-64) ; le frame laisse la place
 * pour 6 mots (var_28..var_1E) et Hex-Rays déclare v24[6] : taille réelle du
 * write callee non prouvée. */
extern void  sub_6A12B0(int16_t *bbox140, const int16_t in[6]);
/* UNCERTAIN 0x6A12B0 : effet de bord sur hdl+0x140.. non prouvé (fusion
 * minmax ?) — forme d'appel certaine : (hdl+0x140, &mmA). */
extern void  IndexLut_FillFF_AssignKeys(void *dst, unsigned int a2,
                                        unsigned int a3, unsigned int a4,
                                        unsigned int a5); /* 5 args ! */
extern void  sub_5022C0(void *a1, void *a2, void *a3);
extern void  BattlePresentation_StartActorAnimation(void *actor, unsigned int animId);
extern void  BattleFile_InitState_1DCD6EC(void *a1);
extern void  au_re_BattleFile_preLoad(void);
extern unsigned int au_re_BattleFile_preLoad_0(unsigned int a1);
extern int   sub_6A1660(void *task_ctx); /* ticker (callback BdLinkTask) */

/* ------------------------- Structs à offsets prouvés --------------------- */
typedef struct {                       /* ctx = arg_0 (état du stepper)       */
    uint8_t  pad00[0x0C];
    uint16_t counter;                  /* +0x0C : cmp WORD ==1 puis inc WORD  */
    uint8_t  state;                    /* +0x0E : BYTE 0 -> 1 -> 2            */
    uint8_t  bufToggle;                /* +0x0F : toggle double buffer        */
} StepCtx;

typedef struct {                       /* handle retourné par Register        */
    uint8_t  hdr[0x0C];                /* +0x00 en-tête BdLinkTask            */
    /* +0x0C..+0xCCF : zone zéroée par FillDwords(hdl+0xC, 0, 0x331)
     * @0x6A0E93-9F (0x331*4 = 0xCC4 o) — overlay, pas de zone séparée.      */
    uint32_t f30;                      /* +0x30 <- [pres+0x1C]                */
    uint32_t f34;                      /* +0x34 <- [pres+0x20]                */
    uint32_t f38;                      /* +0x38 <- [pres+0x0C]                */
    uint32_t f3C;                      /* +0x3C <- [pres+0x10]                */
    uint8_t  entries[];                /* +0x40 : n recs stride 0x18          */
    /* +0x130 (minX+maxX)/2 ; +0x132 (minY+maxY)/2 ; +0x134 maxZ (bx)        */
    /* +0x140 = +0x130 ; +0x142 = 0 ; +0x144 [pres+0x20]-0x1428 ;            */
    /* +0x148 = +0x130 ; +0x14A = 0 ; +0x14C var_6+0x10CC ; +0x150 LUT       */
} Task;

/* UNCERTAIN : layout de l'entrée LUT 156 o (0x9C) @0x1D972C0 — seuls +0x1C et
 * +0x20 sont lus comme dwords @0x6A0F1D/0x6A0F23 ; nature de l'octet de
 * sélection tbl[j*0x18] (index cible ? modèle ?) non prouvée.               */

/* ==========================================================================*/
int __cdecl sub_6A0DC0(uint8_t *ctx)
{
    Task   *task;                      /* esi = retour BdLinkTask_Register    */
    Task   *rec;                       /* edi : curseur records, stride 0x18  */
    unsigned pump1, pump3;             /* esi / ebx : retours pump #1 et #3   */
    int16_t  mid[3];                   /* var_30/var_2E/var_2C                */
    int16_t  mmA[6];                   /* var_28..var_1E (out Vec3 #1)        */
    int16_t  mmB[6];                   /* var_1C..var_12 (out Vec3 #2)        */
    int16_t  minX, maxX, minY, maxY, minZ, maxZ, maxZcopy;
    int      n;

    /* =====================================================================
     * BLOC 1 — 0x6A0DC6-0x6A0E0F : bascule double buffer (CHAQUE appel).
     * Offsets exacts depuis dword_2510278 : +0xAAE0 / +0x1AAE0 / +0x2AAE0.
     * ===================================================================== */
    if (ctx[0x0F] != 0) {                                   /* 0x6A0DCD     */
        dword_2510258 = (uint8_t **)         ((uint8_t *)dword_2510278 + 0x0AAE0); /* 0x6A0DD6 */
        dword_251025C = (uint8_t **)((uint8_t *)dword_2510278 + 0x1AAE0); /* 0x6A0DDC */
        ctx[0x0F] = 0;                                       /* 0x6A0DEC     */
    } else {
        dword_2510258 = (uint8_t **)((uint8_t *)dword_2510278 + 0x1AAE0); /* 0x6A0DF2 */
        dword_251025C = (uint8_t **)((uint8_t *)dword_2510278 + 0x2AAE0); /* 0x6A0DF8 */
        ctx[0x0F] = 1;                                       /* 0x6A0E08     */
    }
    /* UNCERTAIN 0x6A0DC6 : consommateurs de dword_2510258/251025C hors de
     * cette fonction (double buffer à strides 0xAAE0 ?) — écriture seule ici. */

    if (*(uint16_t *)(ctx + 0x0C) != 1)                     /* 0x6A0E0C cmp */
        goto L_pump;                                        /* jnz 6A113B   */

    /* =====================================================================
     * BLOC 2 — 0x6A0E17-0x6A0E76 : init one-shot (ctx[0x0E] 0 -> 1).
     * ===================================================================== */
    if (ctx[0x0E] == 0) {                                   /* 0x6A0E1A     */
        ctx[0x0E] = 1;                                      /* 0x6A0E1E     */
        /* pushes droite->gauche : 1; 0xCD0; base; &dword_2510228           */
        BS_Memset(&dword_2510228, dword_2510278, 0xCD0, 1); /* 0x6A0E34     */
        /* pushes : 0x40; 0x24; base+0xCD0; &dword_2510218                  */
        BS_Memset(&dword_2510218, dword_2510278 + 0xCD0, 0x24, 0x40); /* 0x6A0E4F */
        /* pushes : 0x40; 0x18; base+0x15D0; &dword_2510208  (src = +0x15D0!) */
        BS_Memset(&dword_2510208, dword_2510278 + 0x15D0, 0x18, 0x40); /* 0x6A0E6A */
        /* add esp,30h @0x6A0E6F = 3 x 16 o cdecl                          */
        sub_6A1280();                                       /* 0x6A0E72     */
    }

    /* =====================================================================
     * BLOC 3a — 0x6A0E77-0x6A0E9F : enregistrement ticker + zéro workspace.
     * ===================================================================== */
    task = (Task *)BdLinkTask_Register(&dword_2510228, (void *)sub_6A1660); /* 0x6A0E81 */
    if (task == NULL)                                       /* 0x6A0E8D     */
        goto L_pump;                                        /* jz 6A113B    */

    /* FillDwords(hdl+0xC, 0, 0x331) : 0x331 dwords = 0xCC4 o
     * => couvre exactement +0x0C..+0xCCF (0xC+0xCC4 = 0xCD0 = taille memset). */
    FillDwords((uint8_t *)task + 0x0C, 0, 0x331);           /* 0x6A0E93-9F  */

    /* =====================================================================
     * BLOC 3b — 0x6A0EA4-0x6A0FAA : bounding box sur n records stride 0x18.
     * LUT base 0x1D972C0, entrée = 156 o (0x9C) par octet de sélection.
     * Min/max 16-bit SIGNÉS (jge/jle). n = octet [meta+0x10] ZÉRO-ÉTENDU
     * (xor eax,eax @0x6A0EAA puis mov al,[edx+10h] @0x6A0EC6) ; jle @0x6A0EDA
     * => boucle si n != 0.
     * ===================================================================== */
    {
        unsigned int meta = *(unsigned int *)(dword_25101FC + 4); /* 0x6A0EB4 */

        minX    = (int16_t)0x7FFF;        /* bp     @0x6A0EAF                */
        minY    = (int16_t)0x7FFF;        /* var_E  @0x6A0EC1                */
        minZ    = (int16_t)0x7FFF;        /* var_C  @0x6A0EBC                */
        maxZ    = (int16_t)0x8001;        /* bx     @0x6A0EB7 (0xFFFF8001)   */
        maxZcopy= (int16_t)0x8001;        /* var_6  @0x6A0EC9                */
        maxY    = (int16_t)0x8001;        /* var_8  @0x6A0ED0                */
        maxX    = (int16_t)0x8001;        /* var_A  @0x6A0ED5 (bx, PAS bp !) */

        n = *(uint8_t *)(meta + 0x10);    /* zéro-étendu @0x6A0EC6           */

        if (n != 0) {
            rec = (Task *)((uint8_t *)task + 0x40);           /* 0x6A0EE5   */

            do {
                uint8_t        sel;
                const uint8_t *tbl;    /* rechargé à CHAQUE itération        */

                /* 0x6A0EF8-0x6A0F0A : ecx = -0x40-task (@0x6A0EE0-88) et
                 * edi = task+0x40 s'annulent => sel = tbl[j*0x18].           */
                tbl = *(uint8_t const **)(*(unsigned int *)(dword_25101FC + 4) + 8);
                sel = tbl[(uint8_t *)rec - 0x40 - (uint8_t *)task];

                /* 0x6A0F0A-0x6A0F14 : sel*39*4 = sel*156 (lea/shl/sub).      */
                {
                    const uint8_t *entry = (const uint8_t *)0x1D972C0u
                                         + (unsigned)sel * 156u;

                    *(const uint8_t **)&rec->entries[0x00] = entry;  /* 0x6A0F1B */
                    *(uint32_t *)&rec->entries[0x04] = *(const uint32_t *)(entry + 0x1C); /* 0x6A0F1D */
                    *(uint32_t *)&rec->entries[0x08] = *(const uint32_t *)(entry + 0x20); /* 0x6A0F23 */
                    *(uint32_t *)&rec->entries[0x0C] = dword_2510270; /* 0x6A0F29 */
                    /* store AVANT le call @0x6A0F3F (ordre d'effets de bord)  */
                    *(uint32_t *)&rec->entries[0x10] = dword_2510274; /* 0x6A0F3F */

                    /* 0x6A0F39-0x6A0F42 : (entry_ptr, &mid)                  */
                    Actor_MidpointBonesF0F1(entry, mid);          /* 0x6A0F42 */
                }

                if (mid[0] < minX) minX = mid[0];               /* 0x6A0F4F bp   */
                if (mid[0] > maxX) maxX = mid[0];               /* 0x6A0F57 var_A */
                if (mid[1] < minY) minY = mid[1];               /* 0x6A0F63 var_E */
                if (mid[1] > maxY) maxY = mid[1];               /* 0x6A0F74 var_8 */
                if (mid[2] < minZ) minZ = mid[2];               /* 0x6A0F80 var_C */
                if (mid[2] > maxZ) maxZ = mid[2];               /* 0x6A0F90 bx   */

                rec = (Task *)((uint8_t *)rec + 0x18);          /* 0x6A0F9C     */
            } while (--n != 0);                                 /* 0x6A0F9F/A4  */

            maxZcopy = maxZ;        /* 0x6A0FAA var_6 = bx (APRÈS boucle ; si
                                     * n==0 le jle @0x6A0EDA saute direct à
                                     * 0x6A0FAF : var_6 garde 0x8001 — valeur
                                     * identique à bx dans les deux cas).     */
        }
    }

    /* =====================================================================
     * BLOC 4 — 0x6A0FAF-0x6A106D : centres (cdq/sub/sar = /2 signé vers 0)
     * + stores + copie minmax convergence.
     * ===================================================================== */
    {
        int centerX, centerY;
        int16_t zAdj, zMax;

        /* 0x6A0FAF-0x6A0FB7 : movsx(maxX)+movsx(minX)                      */
        centerX = ((int)maxX + (int)minX);                  /* puis /2      */

        *(int16_t *)((uint8_t *)task + 0x134) = maxZ;       /* 0x6A0FB9 bx  */
        /* NB : hdl+0x134 est écrit AVANT le xor ebx,ebx @0x6A0FD0          */

        *(int16_t *)((uint8_t *)task + 0x142) = 0;          /* 0x6A0FD9 bx=0
                                             * (xor ebx,ebx @0x6A0FD0 DÉJÀ passé).
                                             * c_b disait max2 : FAUX ; c_a avait
                                             * omis ce store : rétabli (=0).     */

        centerY = ((int)minY + (int)maxY);                  /* 0x6A0FC9-FD7 */

        centerX = centerX / 2;                              /* 0x6A0FC0-C3+FE3 */
        centerY = centerY / 2;                              /* 0x6A0FE0-FE5     */

        *(int16_t *)((uint8_t *)task + 0x130) = (int16_t)centerX; /* 0x6A0FE7 */
        *(int16_t *)((uint8_t *)task + 0x132) = (int16_t)centerY; /* 0x6A0FEE */
        rec = (Task *)((uint8_t *)task + 0x140);            /* 0x6A0FC3 edi   */
        *(int16_t *)rec = (int16_t)centerX;                 /* 0x6A0FF5       */

        zAdj = (int16_t)(*(int16_t *)((uint8_t *)dword_2510200 + 0x20)
                         - (int16_t)0x1428);                /* 0x6A0FFD-6A1005 */
        /* 0x6A1001 : charge EAX 32-bit de var_6 (bits hauts = déchets de pile,
         * EAX haut héritait du pointeur 2510200 chargé @0x6A0FF8) ; seul AX
         * est stocké @0x6A1024 — le +0x10CC 32-bit ne change pas AX au-delà
         * du wrap 16-bit.                                                    */
        zMax = (int16_t)(maxZcopy + (int16_t)0x10CC);       /* 0x6A1001-6A100A */

        *(int16_t *)((uint8_t *)task + 0x144) = zAdj;       /* 0x6A100F        */
        *(int16_t *)((uint8_t *)task + 0x148) = (int16_t)centerX; /* 0x6A1016  */
        *(int16_t *)((uint8_t *)task + 0x14A) = 0;          /* 0x6A101D bx=0   */
        *(int16_t *)((uint8_t *)task + 0x14C) = zMax;       /* 0x6A1024        */
        /* NB : Hex-Rays fusionne les stores WORD 0x148+0x14A en un DWORD
         * @v2+328 — résultat identique (haut = 0), largeur d'accès fausse.    */

        /* 0x6A102B-0x6A103D : push &mmA; push src => (src, &out)           */
        Vec3_MinMax_Stride8(unk_118BA10 + dword_118BA18, mmA); /* 0x6A103D    */
        Vec3_MinMax_Stride8(unk_118BA10 + dword_118BA1C, mmB); /* 0x6A1054    */

        mmA[3] = mmB[3];              /* 0x6A1059-64 : var_16 -> var_22      */
        sub_6A12B0((int16_t *)((uint8_t *)task + 0x140), mmA); /* 0x6A1069    */
    }

    /* =====================================================================
     * BLOC 5 — 0x6A106E-0x6A113A : config payload + anim + preload battlefile.
     * ===================================================================== */
    {
        uint8_t *pres = (uint8_t *)dword_2510200;           /* 0x6A106E     */

        /* Les 4 pushes IndexLut (16h/12h/0Eh/3) sont faits ICI
         * @0x6A1073-0x6A107C mais restent en pile jusqu'au call @0x6A10F7.  */
        *(uint32_t *)((uint8_t *)task + 0x30) = *(uint32_t *)(pres + 0x1C); /* 0x6A107E-80 */
        *(uint32_t *)((uint8_t *)task + 0x34) = *(uint32_t *)(pres + 0x20); /* 0x6A1083-86 */
        pres = (uint8_t *)dword_2510200;                    /* 0x6A1089     */
        *(uint32_t *)((uint8_t *)task + 0x38) = *(uint32_t *)(pres + 0x0C); /* 0x6A1091-93 */
        *(uint32_t *)((uint8_t *)task + 0x3C) = *(uint32_t *)(pres + 0x10); /* 0x6A1096-6A10A0 */

        /* write-backs WORD dans le payload                                 */
        *(int16_t *)(pres + 0x1C) = *(int16_t *)((uint8_t *)task + 0x130); /* 0x6A10A9 ax */
        *(int16_t *)(pres + 0x0E) = 0;      /* 0x6A10B3 bx = 0 (depuis 0x6A0FD0).
                                             * c_b disait max2 : FAUX.            */

        /* relectures DWORD après le store word (ordre ASM strict)          */
        pres = (uint8_t *)dword_2510200;                    /* 0x6A10B7     */
        dword_2510260 = *(uint32_t *)(pres + 0x1C);         /* 0x6A10BC-BF  */
        dword_2510264 = *(uint32_t *)(pres + 0x20);         /* 0x6A10C5-C8  */

        word_2510268 = *(int16_t *)((uint8_t *)task + 0x130); /* 0x6A10CE-D5 */
        word_251026A = 0;                   /* 0x6A10DB bx = 0 — c_b FAUX.     */

        /* 0x6A10E2-0x6A10F0 : cx = [esi+0x134] (maxZ) ; push hdl+0x150
         * (5e arg IndexLut) ; store WORD bas dword_251026C = maxZ          */
        word_251026C = *(int16_t *)((uint8_t *)task + 0x134); /* 0x6A10F0    */

        /* 5 args poussés droite->gauche (16h @0x6A1073, 12h @0x6A1078,
         * 0Eh @0x6A107A, 3 @0x6A107C, hdl+0x150 @0x6A10EF) — Hex-Rays
         * n'en montre que 2 : faux.                                          */
        IndexLut_FillFF_AssignKeys((uint8_t *)task + 0x150, 3, 0x0E, 0x12, 0x16);

        /* 0x6A1104-0x6A110B : push dword_1181078; push esi+0x10 (esi+=0x10
         * @0x6A1101); push pres => (pres, hdl+0x10, dword_1181078)          */
        sub_5022C0(dword_2510200, (uint8_t *)task + 0x10, dword_1181078);

        /* 0x6A1110-0x6A1119 : push 1; push actor => (actor, animId=1)      */
        BattlePresentation_StartActorAnimation(dword_2510200, 1);

        /* 0x6A111E-0x6A112E : add esp,40h @0x6A1124 soldent en bloc les 16
         * dwords cdecl poussés depuis 0x6A1035 (Vec3 x2, sub_6A12B0,
         * IndexLut, sub_5022C0, anim = 8+8+8+16+4+12+8 = 0x40).            */
        BattleFile_InitState_1DCD6EC(dword_2510278 + 0x1BD0); /* 0x6A112E    */

        /* 0x6A1133-0x6A113A : rechargement edi = arg_0 ; add esp,4 (push
         * BattleFile) ; pop ebp — ctx d'origine inchangé.                   */
    }

    /* =====================================================================
     * BLOC 6 — 0x6A113B-0x6A122B : pump + décision du stepper.
     * ===================================================================== */
L_pump:
    if (ctx[0x0E] == 0) {                                   /* 0x6A113E     */
        /* 0x6A1169-0x6A116D : esi = ebx = arg_0 (sentinelle non nulle =>
         * ne déclenche jamais la phase de fin via pump1/pump3).            */
        pump1 = pump3 = (unsigned)(uintptr_t)ctx;
        goto L_check;
    }
    /* 0x6A1142-0x6A1162 : 3 pumps ; retour pump #2 (dword_2510218) JETÉ.
     * add esp,0Ch @0x6A1162 (3 args cdecl).                               */
    pump1 = BdLinkTask_Pump(&dword_2510228);                /* esi @0x6A1151 */
    (void)BdLinkTask_Pump(&dword_2510218);                  /* 0x6A1153     */
    pump3 = BdLinkTask_Pump(&dword_2510208);                /* ebx @0x6A1165 */

L_check:                                                    /* 0x6A1171     */
    if (ctx[0x0E] == 0 || pump1 != 0) {                     /* 0x6A1171-7E  */
        ++*(uint16_t *)(ctx + 0x0C);                        /* 0x6A121F inc */
        return 0;                                           /* 0x6A1223     */
    }

    au_re_BattleFile_preLoad();                             /* 0x6A1184     */
    if (pump3 != 0)                                         /* 0x6A1189-8B  */
        return 0;                                           /* jnz 6A1223   */
    if (au_re_BattleFile_preLoad_0(1) == 0)                 /* 0x6A1191-9D  */
        return 0;                                           /* jz 6A1223    */

    /* 0x6A11A3-0x6A11AC : stage zéro-étendu ; dec/jz => 1 ; dec/jnz => !=2.
     * Seuls les stages 1 et 2 agissent ; tout autre => return 0.          */
    if (ctx[0x0E] == 1) {
        /* 0x6A11D4-0x6A1213 : snapshot caméra + passage au stage 2.        */
        word_1D8E038                = word_1D977A0;         /* 0x6A11D4-E6  */
        Battle_Camera_LookAt_XZ_s16 = dword_B8B808;         /* 0x6A11DA-F1  */
        Battle_Camera_LookAt_Y      = dword_B8B80C;         /* 0x6A11E0-FD  */
        Battle_Camera_world_XZ_s16  = dword_B8B800;         /* 0x6A11EC-208 */
        Battle_Camera_world_Y       = dword_B8B804;         /* 0x6A11F7-20E */
        ctx[0x0E] = (uint8_t)(ctx[0x0E] + 1);               /* 0x6A120E-13  */
        return 0;                                           /* 0x6A1216-1E  */
    }
    if (ctx[0x0E] != 2)                                     /* 0x6A11AB-AC  */
        return 0;                                           /* jnz 6A1223   */

    /* 0x6A11AE-0x6A11C2 : AND WORD 0xFFFB = clear bit 0x0004 (3 globaux).
     * dword_1D973F8 est un AND WORD pur @0x6A11C2 (Hex-Rays le modélise
     * comme dword : même effet, largeur d'accès différente).              */
    g_BattlePresentationActors[0] &= (uint16_t)0xFFFB;      /* 0x6A11B4     */
    dword_1D9735C                 &= (uint16_t)0xFFFB;      /* 0x6A11BB     */
    dword_1D973F8                 &= (uint16_t)0xFFFB;      /* 0x6A11C2     */
    return 2;                           /* 0x6A11CA-D3 — l'appelant lit AL    */
}

/* ==========================================================================
 * Récap corrections vs voix (preuves adresées dans reconcile_notes.md) :
 *  - hdl+0x142 = 0, payload+0x0E = 0, hdl+0x14A = 0, word_251026A = 0
 *    (bx=0 dès 0x6A0FD0) : c_b FAUX x4, c_a omission +0x142 rétablie.
 *  - n = octet zéro-étendu (c_b disait signé) : test/jle => boucle si !=0.
 *  - var_A initialisé depuis bx (0x8001) pas bp : c_a étiquetait var_A
 *    "minX" dans le bloc init (commentaire faux, usage correct ensuite).
 *  - vec out[6] (Hex-Rays v24[6]) : seuls out[0..3] prouvés utilisés.
 * ==========================================================================*/
```

## Analyse semantique

# Sémantique sub_6A0DC0 @ 0x6A0DC0 (réconciliation R)

- Rôle (1 phrase) : Stepper BdLinkTask par frame de l'effet de magie 212 (MAG_212) — à la phase d'init (compteur `[ctx+0x0C]==1`, sous-étage `[ctx+0x0E]==0`) il arme les 3 listes de tâches sur le buffer dword_2510278, enregistre le ticker 0x6A1660 (MAG_212_Timeline_Tick, cellule fermée CERTAIN), résout les records de groupe (table 0x1D972C0), calcule le bbox/centre des os 0xF0/0xF1 de l'acteur, lance l'animation de présentation et le preload battle-file ; chaque frame suivante il pompe les 3 listes et bascule le double buffer 2510258/251025C, puis finalise en 2 sous-étages (snapshot caméra → clear masques présentation) avant de retourner 2 pour détachement.
- Verdict : CERTAIN
- Confiance : CERTAIN
- Nom catalogue : aucun nom IDA (sub_6A0DC0 brut). Proposition markdown seule : **MAG_212_Effect_Tick_Stepper** (confirme A ; B `MAG_212_InitStageAndTaskPumpStepper` rejeté — trop étage-spécifique, décrit l'init et le pump mais pas la machine à états complète, et casse la famille de noms voisins MAG_212_EffectEntry_* / MAG_212_Timeline_Tick).

## Nom — preuves ASM indépendantes adresées

1. **Enregistré comme tâche par le caller MAG_212** : data xref unique @0x6A0D9B depuis sub_6A0D50 (= MAG_212_EffectEntry, cellule voisine fermée) — c'est le callback ticker de l'effet, pas un init one-shot.
2. **Comportement par frame** : `inc word ptr [edi+0Ch]` @0x6A121F (compteur de frames incrémenté à chaque passage non-finalisateur) + 3× `BdLinkTask_Pump` @0x6A1142–0x6A115D — cœur « tick » récurrent.
3. **Enregistre lui-même le ticker MAG_212_Timeline_Tick** @0x6A0E77–0x6A0E81 (`push offset sub_6A1660; push offset dword_2510228; call BdLinkTask_Register`) — cohérence de famille MAG_212.

## In / Out / Effets

**In** : arg_0 = ctx MAG_212 (alloué/enregistré par sub_6A0D50). Champs ctx :
- `[ctx+0x0C]` (word) : compteur de frames ; gate d'init `cmp word ptr [edi+0Ch], 1` @0x6A0E0C (init au 2e appel) ; incrémenté @0x6A121F (sauf chemins de finalisation retour 0/2) ; jamais réinitialisé ici.
- `[ctx+0x0E]` (byte) : sous-étage 0→1→2 : posé à 1 @0x6A0E1E (init), à 2 @0x6A1211 (après snapshot caméra) ; gate du pump `test al,al` @0x6A113E ; dispatch final `dec; jz / dec; jnz` @0x6A11A5–0x6A11AC.
- `[ctx+0x0F]` (byte) : bascule ping-pong complémentée à CHAQUE appel (@0x6A0DCA–0x6A0E08), avant le gate +0x0C.

**Lectures globales** : dword_25101FC (→ `[+4]+0x10` = count groupes zéro-étendu, `[+4]+8` = base events), dword_2510200 (acteur/pres courant), dword_2510270/74/78, unk_118BA10+dword_118BA18/1C, word_1D977A0, dword_B8B800..0C, table 0x1D972C0.

**Effets / Out** :
- Double buffer : dword_2510258/251025C = fenêtres **base-relatives** de dword_2510278 — `[ctx+0x0F]!=0` → {base+0xAAE0, base+0x1AAE0} ; ==0 → {base+0x1AAE0, base+0x2AAE0} (@0x6A0DD6–0x6A0E08 ; 3 banques de 0xAAE0, banque médiane +0x1AAE0 partagée).
- Init (une fois, +0x0E 0→1) : 3× BS_Memset — `(&dword_2510228, dword_2510278, 0xCD0, 1)` @0x6A0E34, `(&dword_2510218, base+0xCD0, 0x24, 0x40)` @0x6A0E4F, `(&dword_2510208, base+0x15D0, 0x18, 0x40)` @0x6A0E6A (soldées `add esp,30h` @0x6A0E6F) ; sub_6A1280 @0x6A0E72 ; BdLinkTask_Register(sub_6A1660, &dword_2510228) @0x6A0E81 (nul → sortie @0x6A113B) ; node esi zéroed 0x331 dwords à esi+0xC (FillDwords @0x6A0E9F).
- Résolution groupes (boucle @0x6A0EF8–0x6A0FA4) : entrées à node+0x40, **stride 0x18** (`add edi,18h` @0x6A0F9C) ; count = byte `[dword_25101FC[+4]+0x10]` **zéro-étendu** (`xor eax,eax` @0x6A0EAA, `mov al` @0x6A0EC6) ; clé = byte `[events + k*0x18]` (@0x6A0F07) → record `0x1D972C0 + clé*0x9C` (=clé×39×4 : `lea edx,[eax+eax*4]; shl edx,3; sub edx,eax` @0x6A0F0C–0x6A0F12, `lea eax,ds:1D972C0h[edx*4]` @0x6A0F14) ; copies [rec+0x00/1C/20] → entrée+0x00/04/08 + dword_2510270/74 → entrée+0xC/0x10 (@0x6A0F1B–0x6A0F3F).
- Bbox : `Actor_MidpointBonesF0F1(entry[0], &out)` @0x6A0F42 → min/max s16 **signés** (cmp/jge/jle sur movsx @0x6A0F4F–0x6A0F93 ; inits 0x7FFF / 0xFFFF8001 @0x6A0EAF–0x6A0ED5 ; var_A = maxX = bx) ; centres (min+max)/2 arrondi vers zéro (`cdq; sub eax,edx; sar 1` @0x6A0FC0–0x6A0FE5) → node+0x130/0x132, node+0x140 (et +0x148) ; maxZ → node+0x134 @0x6A0FB9 et word_251026C @0x6A10F0 (seuls stores AVANT `xor ebx,ebx` @0x6A0FD0).
- Zéros post-xor : node+0x142 = 0 @0x6A0FD9, node+0x14A = 0 @0x6A101D, [pres+0x0E] = 0 @0x6A10B3, word_251026A = 0 @0x6A10DB (div. D1) ; node+0x144 = [pres+0x20]−0x1428 @0x6A1005–0x6A100F ; node+0x14C = maxZ+0x10CC @0x6A100A–0x6A1024.
- Copies pres→node : [+0x1C]→+0x30, [+0x20]→+0x34, [+0x0C]→+0x38, [+0x10]→+0x3C (@0x6A107E–0x6A10A0) ; write-back word [pres+0x1C] = centre X @0x6A10A9 ; miroirs dword_2510260/64, word_2510268/6A/26C (@0x6A10BC–0x6A10F0).
- `Vec3_MinMax_Stride8` ×2 (unk_118BA10+dword_118BA18/1C) @0x6A103D/0x6A1054 puis `sub_6A12B0(node+0x140, &minmax)` @0x6A1069.
- `IndexLut_FillFF_AssignKeys(node+0x150, 3, 0x0E, 0x12, 0x16)` — **5 args** @0x6A1073–0x6A107C + 0x6A10EF, call @0x6A10F7 (div. D2) ; `sub_5022C0([dword_2510200], node+0x10, &dword_1181078)` — **3 args** @0x6A1104–0x6A110B ; `BattlePresentation_StartActorAnimation(dword_2510200, 1)` @0x6A1116–0x6A1119 ; `BattleFile_InitState_1DCD6EC(base+0x1BD0)` @0x6A1127–0x6A112E ; pile soldée `add esp,40h` @0x6A1124.
- Pump par frame (+0x0E != 0) : `BdLinkTask_Pump(&2510228)`→esi @0x6A1147, `(&2510218)` **retour jeté** @0x6A1153, `(&2510208)`→ebx @0x6A115D.
- Finalisation (stage != 0, pump1==0 @0x6A117C, preloads ok) : stage 1 → snapshot caméra (word_1D8E038←word_1D977A0 ; Battle_Camera_LookAt_XZ_s16/LookAt_Y/world_XZ_s16/world_Y ← dword_B8B808/0C/800/804) @0x6A11D4–0x6A120D, +0x0E→2, retour 0 ; stage 2 → `and word ptr` 0xFFFB (clear masque **0x4**, bit index 2) sur g_BattlePresentationActors @0x6A11B4, dword_1D9735C @0x6A11BB, dword_1D973F8 @0x6A11C2 (accès 16-bit pur), retour 2 @0x6A11CA–0x6A11D3.
- **Retour** : `xor eax,eax` (EAX=0) @0x6A1218/0x6A1225 ; `mov eax,2` @0x6A11CA — largeur utile **AL** (0 = continuer, 2 = détacher), conforme au contrat BdLinkTask_Pump (bit 2 d'unlink, catalogue QMD convergent A+B : Register 0x508360 / Pump 0x508420).

## Divergences A/B (tranchées une par une, contre l'ASM)

1. **Nom** — A `MAG_212_Effect_Tick_Stepper` (CERTAIN) vs B `MAG_212_InitStageAndTaskPumpStepper` (LIKELY). **Tranché A** : la fonction est un stepper par frame complet (init + pump + 2 étages finaux) ; le nom B ne couvre que 2 phases et sort de la famille MAG_212_*. Preuves : xref data @0x6A0D9B (enregistré comme tâche), pump ×3 @0x6A1142–0x6A115D, `inc word [edi+0Ch]` @0x6A121F.
2. **Double buffer base-relatif** — B (section Out) écrit « dword_2510258/251025C (double buffer, **pas** base+0xAAE0/0x1AAE0/0x2AAE0) », se contredisant avec sa propre preuve #1. **Tranché A** : `mov eax, dword_2510278` @0x6A0DCF puis `lea ecx,[eax+0AAE0h]` @0x6A0DD6 / `add eax,1AAE0h` @0x6A0DDC / `add eax,2AAE0h` @0x6A0DF8 — fenêtres base+0xAAE0/0x1AAE0/0x2AAE0 certaines.
3. **sub_5022C0 arg1** — A : « actor+0x1C » ; B : dword_2510200. **Tranché B** : `mov eax, dword_2510200` @0x6A10FC puis `push eax` @0x6A110A — arg1 = le pointeur acteur lui-même ; le `add eax,1Ch` @0x6A1075 concerne les copies [+0x1C]→node+0x30, pas cet appel. Prototype : `sub_5022C0([dword_2510200], node+0x10, &dword_1181078)` (pushes @0x6A1104–0x6A110A, call @0x6A110B).
4. **Args 3/0x0E/0x12/0x16** — B (preuve #8) les attache à sub_5022C0. **Tranché : ce sont les 4 derniers args d'IndexLut_FillFF_AssignKeys (5 args au total)** — pushes 16h @0x6A1073, 12h @0x6A1078, 0Eh @0x6A107A, 3 @0x6A107C, node+0x150 @0x6A10EF, call @0x6A10F7 ; sub_5022C0 n'a que 3 pushes dédiés @0x6A1104–0x6A110A ; ensemble soldé par `add esp,40h` @0x6A1124 (div. D2 confirmée).
5. **Compteur LUT signé vs zéro-étendu** — c_b (résiduel de B) : `(signed char)q[0x10]`. **Tranché : zéro-étendu** — `xor eax,eax` @0x6A0EAA puis `mov al,[edx+10h]` @0x6A0EC6 (mov **al**, pas movsx) ; `jle` @0x6A0EDA teste EAX 32-bit, un octet zéro-étendu ne peut être négatif (div. D4).
6. **Provenance des zéros** — A : `[pres+0x0E]=bx` sans préciser, et omission du store node+0x142 ; c_b : ces stores = maxZ. **Tranché : = 0** — `xor ebx,ebx` @0x6A0FD0 précède les stores node+0x142 @0x6A0FD9, node+0x14A @0x6A101D, [pres+0x0E] @0x6A10B3, word_251026A @0x6A10DB ; seuls node+0x134 @0x6A0FB9 et word_251026C @0x6A10F0 lisent maxZ avant le xor (div. D1).
7. **Largeur de retour** — B : « retour AX = 0 ou 2 » ; A : AL only. **Tranché : EAX chargé entier (`xor eax,eax` @0x6A1225 / `mov eax,2` @0x6A11CA), largeur sémantique AL (0/2)** — l'appelant BdLinkTask_Pump lit AL/bit 2 (div. D10).
8. **Sémantique arg4 BS_Memset** — A : « val 0x40 » ; B : « 0x40 = stride d'entrée, pas val ». **Non tranchable dans ce EA** : l'ASM ne prouve que les valeurs poussées (dst, src, count, 0x40) @0x6A0E27–0x6A0E6A ; interprétation size/capacité/valeur maintenue UNCERTAIN (div. D3).
9. **Notation du clear de masques** — A : « clear bit 0x4 » ; B : « clear bit 2 ». **Même fait** : `mov eax,0FFFBh` @0x6A11AE + `and word ptr` @0x6A11B4/BB/C2 — masque 0x4 effacé (bit index 2), écritures 16-bit pures.

## Preuves (ASM cité)

1. @0x6A0E77–0x6A0E81 : `push offset sub_6A1660; push offset dword_2510228; call BdLinkTask_Register` — enregistre MAG_212_Timeline_Tick (cellule 0x6A1660 CERTAIN) sur la liste 1.
2. @0x6A1142–0x6A1165 : 3× `BdLinkTask_Pump` (2510228→esi, 2510218 retour jeté, 2510208→ebx), gate `test esi,esi; jnz 6A121F` @0x6A117C.
3. @0x6A11CA–0x6A11D3 : `mov eax,2; retn` — seul retour non nul (AL=2), précédé du `and word ptr` 0xFFFB sur les 3 masques (@0x6A11AE–0x6A11C2) ; tous les autres chemins `xor eax,eax` @0x6A1218/0x6A1225.
4. @0x6A0DD6–0x6A0E08 : fenêtres base+0xAAE0/0x1AAE0 vs base+0x1AAE0/0x2AAE0 → dword_2510258/251025C, toggle `[edi+0Fh]` @0x6A0DEC/0x6A0E08.
5. @0x6A0F0C–0x6A0F14 : ×39 (`lea edx,[eax+eax*4]; shl edx,3; sub edx,eax`) puis `lea eax,ds:1D972C0h[edx*4]` = stride **0x9C (156 o)** ; entrées sortie **stride 0x18** (`add edi,18h` @0x6A0F9C) ; count byte zéro-étendu (`xor eax,eax` @0x6A0EAA, `mov al` @0x6A0EC6).
6. @0x6A0F4F–0x6A0FE5 : min/max s16 signés (cmp/jge/jle sur movsx), centres (min+max)/2 via `cdq; sub eax,edx; sar 1` (division signée arrondie vers zéro) → node+0x130/132/140 ; polarité signée correcte, aucun ja/jb.
7. @0x6A1073–0x6A112E : séquence d'init lourde — IndexLut_FillFF_AssignKeys **5 args** (pushes 16h/12h/0Eh/3/+0x150, call @0x6A10F7), sub_5022C0 **3 args** (call @0x6A110B), StartActorAnimation(actor, 1) @0x6A1119, BattleFile_InitState_1DCD6EC(base+0x1BD0) @0x6A112E, soldée `add esp,40h` @0x6A1124.
8. @0x6A11D4–0x6A1213 : snapshot caméra (word_1D977A0→word_1D8E038 ; dword_B8B808/0C/800/804→Battle_Camera_LookAt/world) puis `inc al` → `[edi+0Eh]=2` @0x6A1211, retour 0 — le retour 2 n'arrive qu'au passage suivant (stage 2).

## Checks §5.6

- **Callees** : tous cités présents dans callees.txt — BS_Memset ×3 (6a0e34/4f/6a), sub_6A1280 (6a0e72), BdLinkTask_Register (6a0e81), FillDwords (6a0e9f), Actor_MidpointBonesF0F1 (6a0f42), Vec3_MinMax_Stride8 ×2 (6a103d/6a1054), sub_6A12B0 (6a1069), IndexLut_FillFF_AssignKeys (6a10f7), sub_5022C0 (6a110b), BattlePresentation_StartActorAnimation (6a1119), BattleFile_InitState_1DCD6EC (6a112e), BdLinkTask_Pump ×3 (6a1147/53/5d), au_re_BattleFile_preLoad(×2) (6a1184/93). ✔
- **Caller** : data xref unique 0x6A0D9B depuis sub_6A0D50 (callers.txt, `more:false`), aligné avec l'ancrage MAG_212_EffectEntry (fermé). ✔
- **Strides en nombres** : events 0x18 (@0x6A0F9C), LUT 0x9C=156 (@0x6A0F14, calcul ×39×4 cité), banques 0xAAE0/0x1AAE0 (@0x6A0DD6–0x6A0DF8), FillDwords 0x331 dwords (@0x6A094–0x6A09F), fenêtre paire 0x1AAE0. ✔
- **Polarités** : min/max en comparaisons **signées** (jge/jle sur movsx s16 @0x6A0F4F–0x6A0F93) ; division signée /2 (cdq/sub/sar @0x6A0FC0–0x6A0FE5) ; aucun ja/jb ; étages +0x0E 0→1→2 monotones. ✔
- **Largeur retour** : AL 0/2 (xor eax,eax @0x6A1225 / mov eax,2 @0x6A11CA), compatible contrat BdLinkTask unlink bit 2. ✔
- **Nom ≥2 preuves ASM indépendantes** : xref data 0x6A0D9B (tâche MAG_212) + pump par frame @0x6A1142–0x6A115D / compteur @0x6A121F (+ enregistrement ticker @0x6A0E77–81). ✔
- Aucun library call inventé ; args cdecl droite→gauche vérifiés (BS_Memset ×3, IndexLut 5 args, sub_5022C0 3 args, StartActorAnimation (actor, animId)). ✔

## Questions ouvertes (non bloquantes)

- Sémantique exacte des args 3/4 de BS_Memset (0xCD0,1 / 0x24,0x40 / 0x18,0x40) : taille/capacité/valeur — non prouvable dans ce EA (div. D3/D8).
- Consommateurs de dword_2510258/251025C hors de cette fonction (fenêtres ping-pong, banque médiane +0x1AAE0 partagée) — probablement le ticker 0x6A1660 ; à confirmer dans la cellule ticker.
- Layout de l'entrée LUT 0x1D972C0 (156 o ; seuls +0x1C/+0x20 lus) et nature du byte de sélection `[events + k*0x18]` (index cible ? modèle ?) — cellule dédiée souhaitée.
- Rôle des constantes 0x1428 (@0x6A1005) et 0x10CC (@0x6A100A) écrites en node+0x144/0x14C : offsets z monde/écran non sourcés.
- Effets de bord de sub_6A1280, sub_6A12B0, sub_5022C0 — opaques dans le pack, ne portent pas le rôle principal.
- `[ctx+0x0E]` ne dépasse jamais 2 ici ; un éventuel état 3 écrit par le ticker reste à confirmer côté 0x6A1660.

## IDBCOMMENT

Stepper BdLinkTask de l'effet MAG_212, enregistre par 0x6A0D50. A l'init (ctx+0C==1) il arme les 3 listes 2510228/2510218/2510208 sur le buffer 2510278, enregistre le ticker 6A1660, resout les records de groupe (table 1D972C0, strides 0x18/0x9C), calcule le bbox des os F0/F1, lance l'anim acteur 1 et le preload battle file. Chaque frame il pompe les 3 listes et bascule le double buffer 2510258/251025C selon ctx+0F. Etage 1 gele la camera depuis B8B800-B8B80C, etage 2 efface le masque 0x4 des presentations puis retourne AL=2 pour detacher. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A0DC0 (0x6A0DC0, 304 instr, 1132 o)

Réconciliation c_a / c_b contre `asm.asm` (ground truth). `hexrays.c` = vérificateur seul.
Rappel structurel : bloc init 0x6A0E17-0x6A0E76 (3× BS_Memset + sub_6A1280) ;
enregistrement ticker sub_6A1660 @0x6A0E77-81 ; 3× BdLinkTask_Pump @0x6A1142-0x6A115D
(retour #2 jeté, #1=esi, #3=ebx) ; retours stepper 0 (en cours) / 2 (terminé, AL).

---

## Divergences tranchées

### D1 — Ordre de validité de `bx` : 4 stores = 0, pas maxZ (c_b FAUX ×4, c_a omission ×1)

- **c_a** : hdl+0x142 OMIS (pas de store émis) ; payload+0x0E=0 ; hdl+0x14A=0 ; word_251026A=0.
- **c_b** : f142 = max2, payload+0x0E = max2, f14A = max2, word_251026A = max2 — en affirmant 3× « Hex-Rays dit 0 : FAUX ».
- **Tranché : c_a (et Hex-Rays) ont raison.** `xor ebx,ebx` @**0x6A0FD0** arrive AVANT :
  - store `[esi+142h]` @**0x6A0FD9** → hdl+0x142 = **0** (c_a avait tort d'omettre : le store existe) ;
  - store `[edx+0Eh]` @**0x6A10B3** → payload+0x0E = **0** ;
  - store `[esi+14Ah]` @**0x6A101D** → hdl+0x14A = **0** ;
  - store `word_251026A` @**0x6A10DB** → **0**.
  Seul hdl+0x134 @**0x6A0FB9** (et word_251026C @0x6A10F0 via cx) lit maxZ AVANT le xor.
  Correction apportée : les 4 stores = 0 ; hdl+0x142 rétabli dans c_reconciled.c.

### D2 — IndexLut_FillFF_AssignKeys : 5 args, pas 2 (Hex-Rays FAUX)

- **Hex-Rays** : `IndexLut_FillFF_AssignKeys((_BYTE *)(v2 + 336), 3)` — 2 args.
- **c_a / c_b** : 5 args `(hdl+0x150, 3, 0x0E, 0x12, 0x16)`.
- **Tranché : 5 args.** Pushes : 16h @**0x6A1073**, 12h @**0x6A1078**, 0Eh @**0x6A107A**,
  3 @**0x6A107C**, hdl+0x150 @**0x6A10EF** ; call @**0x6A10F7**. Les 4 premiers pushes
  restent en pile ~130 instr jusqu'au call, soldés par `add esp,40h` @**0x6A1124**
  (16+12+8+4+20 = 0x40 o : Vec3×2, sub_6A12B0, IndexLut, sub_5022C0, anim).

### D3 — BS_Memset : 3 appels, args exacts (les deux voix d'accord, confirmé)

- **Tranché** (pushes droite→gauche) :
  - @**0x6A0E34** : `(&dword_2510228, dword_2510278, 0xCD0, 1)`
  - @**0x6A0E4F** : `(&dword_2510218, dword_2510278+0xCD0, 0x24, 0x40)`
  - @**0x6A0E6A** : `(&dword_2510208, dword_2510278+0x15D0, 0x18, 0x40)` — src = **+0x15D0** (pas +0x15D0 vs une hypothétique +0x1D0 : le byte 5Ch de l'instruction `add edx, 15D0h` @**0x6A0E5C** est explicite).
  Soldés par `add esp,30h` @**0x6A0E6F** (3×16 o).

### D4 — Compteur de boucle LUT : octet ZÉRO-étendu (c_b FAUX)

- **c_b** : `int count = (signed char)q[0x10]` — octet signé.
- **Tranché : zéro-étendu.** `xor eax,eax` @**0x6A0EAA** puis `mov al,[edx+10h]` @**0x6A0EC6**
  (mov **al**, pas movsx). Le `jle` @**0x6A0EDA** teste eax 32-bit (donc n>0 ou n=0 ;
  un octet zéro-étendu ne peut pas être négatif). Boucle si n != 0.

### D5 — Init var_A (maxX) depuis bx, PAS bp (c_a étiquetage faux)

- **c_a** : commentaires bloc init — `maxX = (int16_t)0x8001; /* -32767 @0x6A0EB7 (word 0x8001) */` puis `minX = (int16_t)0x7FFF; /* 0x6A0ED5 var_A */` : var_A est étiquetée « minX » alors qu'elle reçoit **bx** (=0x8001) @**0x6A0ED5**.
- **Tranché** : var_A = maxX (init 0x8001 depuis bx @**0x6A0ED5**, mis à jour par `mid[0] > var_A` @0x6A0F5C-0x6A0F5E). Usage final correct dans les deux voix ; l'étiquetage du bloc init de c_a était trompeur.

### D6 — Bounding-box records : stride 0x18, LUT 0x1D972C0 entrée 156 o, centre /2 signé (accord)

- Stride : `add edi,18h` @**0x6A0F9C** ; base = hdl+0x40 @**0x6A0EE5**.
- LUT : `lea edx,[eax+eax*4]` @0x6A0F0C → `shl edx,3` @0x6A0F0F → `sub edx,eax` @0x6A0F12 = sel×39 ; `lea eax,ds:1D972C0h[edx*4]` @**0x6A0F14** = 0x1D972C0 + sel×**156**.
- Centres : `cdq; sub eax,edx; sar 1` @**0x6A0FC0-C3** et **0x6A0FE0-FE5** = division signée /2 arrondie vers zéro. Stores : hdl+0x130/0x132 @0x6A0FE7/0x6A0FEE ; hdl+0x140 = centerX @**0x6A0FF5**.
- Copies rec+0x00 (ptr entry) / +0x04 ([entry+0x1C]) / +0x08 ([entry+0x20]) / +0x0C (dword_2510270) @**0x6A0F1B-0x6A0F2E** ; rec+0x10 = dword_2510274 @**0x6A0F3F** AVANT le call Actor_MidpointBonesF0F1 @**0x6A0F42**.

### D7 — Copies payload→handle + write-backs + miroirs (accord sur la forme, ordre précisé)

- Copies : hdl+0x30←[pres+0x1C] @**0x6A107E-80**, +0x34←[pres+0x20] @**0x6A1083-86**, +0x38←[pres+0x0C] @**0x6A1091-93**, +0x3C←[pres+0x10] @**0x6A1096-6A10A0**.
- Write-backs WORD : [pres+0x1C] = hdl+0x130 (ax) @**0x6A10A9** ; [pres+0x0E] = **0** (bx) @**0x6A10B3** (voir D1).
- Miroirs : dword_2510260=[pres+0x1C] @**0x6A10BC-BF**, dword_2510264=[pres+0x20] @**0x6A10C5-C8** (relecture DWORD après store word), word_2510268=hdl+0x130 @**0x6A10CE-D5**, word_251026A=0 @**0x6A10DB**, dword_251026C (WORD bas) = hdl+0x134 (maxZ) @**0x6A10F0**.

### D8 — 3× BdLinkTask_Pump : retours et gate (accord, confirmé)

- @**0x6A1147** (retour jeté? NON — #2 est jeté) : #1 @0x6A1147→esi @**0x6A1151**, #2 @**0x6A1153** (dword_2510218, retour **jeté**), #3 @**0x6A115D**→ebx @**0x6A1165**.
- Gate : `test esi,esi; jnz 6A121F` @**0x6A117C-7E** — phase de fin seulement si pump1==0.
  Puis `au_re_BattleFile_preLoad` @**0x6A1184** ; si ebx!=0 → return 0 @**0x6A1189-8B** ;
  `au_re_BattleFile_preLoad_0(1)` @**0x6A1193** (add esp,4 @0x6A1198), si ==0 → return 0 @**0x6A119D**.

### D9 — Stages ctx[0x0E] (accord, confirmé)

- Stage 1 @**0x6A11D4-0x6A1213** : word_1D8E038←word_1D977A0 @0x6A11D4-E6 ; Battle_Camera_LookAt_XZ_s16←dword_B8B808 @0x6A11DA-F1 ; LookAt_Y←dword_B8B80C @0x6A11E0-FD ; world_XZ_s16←dword_B8B800 @0x6A11EC-208 ; world_Y←dword_B8B804 @0x6A11F7-20E ; `inc al` → ctx[0x0E]=2 @**0x6A1211** ; return 0.
- Stage 2 @**0x6A11AE-0x6A11C2** : `mov eax,0FFFBh` @**0x6A11AE** ; `and word ptr g_BattlePresentationActors, ax` @**0x6A11B4** ; idem dword_1D973F8 @**0x6A11C2** ; return 2 @**0x6A11CA-D3**.
- Tout autre stage → return 0 @**0x6A11AB-AC** (dec;dec;jnz 6A1223).

### D10 — Retours stepper (accord, confirmé)

- `inc word ptr [edi+0Ch]` @**0x6A121F** puis return 0 @**0x6A1223** — EAX=0 plein, l'appelant lit AL.
- Terminé : EAX=2 @**0x6A11CA-D3**.

### D11 — Vec3_MinMax_Stride8 out : 6 mots (Hex-Rays v24[6]) vs 4 (c_a)

- **c_a** : `int16_t out[4]` ; **c_b/Hex-Rays** : 6 (v24[6] / short out[6]).
- **Tranché : 6 mots** pour la taille du frame (var_28..var_1E avant var_1C), mais seuls
  out[0..3] sont prouvés utilisés (copie out[3] @**0x6A1059-64**, puis tout mmA passe à
  sub_6A12B0 @**0x6A1069**). Taille réelle du write callee non prouvée → conservé [6],
  usage prouvé [0..3] documenté.

---

## Divergences vs Hex-Rays (déjà listées par c_a, confirmées adresee)

1. **IndexLut 2 args vs 5** — voir D2 (pushes 0x6A1073-0x6A107C + 0x6A10EF, add esp,40h @0x6A1124).
2. **xor ebx,ebx @0x6A0FD0 masqué** — Hex-Rays écrit 0 directement aux stores 0x142/332/payload+0x0E/14A ; l'ASM montre que bx=0 dès 0x6A0FD0 (même résultat, provenance non montrée). Conséquence inverse pour c_b qui croyait bx=maxZ : FAUX.
3. **dword_1D973F8 AND word pur** @0x6A11C2 — Hex-Rays : `LOWORD(dword_1D973F8) = dword_1D973F8 & 0xFFFB` (lecture dword + write dword bas) ; ASM : `and word ptr dword_1D973F8, ax` (accès 16-bit pur). Même effet, largeur différente.
4. **Ordre store rec[4] vs midpoint** — Hex-Rays : `v19=*v7` PUIS `v7[4]=dword_2510274` PUIS call ; ASM : store [edi+10h] @**0x6A0F3F** AVANT le call @**0x6A0F42**. Ordre d'effets de bord identique ici (pas d'aliasing prouvé), mais l'ordre ASM est l'original.
5. **Charge AX 16-bit @0x6A1001** — `mov eax,[var_6]` charge 32 bits (EAX haut = déchets de pile, héritage du pointeur 2510200 chargé @0x6A0FF8) ; seul AX est stocké @0x6A1024. Hex-Rays modélise via `LOWORD(v12) = v30 + 4300` — résultat identique sur la partie stockée.
6. **Fusion stores WORD 0x148+0x14A en dword @v2+328** (Hex-Rays `*(_DWORD *)(v2 + 328) = (unsigned __int16)(v11/2)`) — ASM : deux stores WORD séparés @**0x6A1016** et **0x6A101D**. Résultat identique (haut = bx = 0), largeur fausse.
7. **Chaîne stage 2 en double dans hexrays.c** — le dump Hex-Rays contient un bloc `Battle_Camera_world_Y = dword_B8B804; ++*(_BYTE *)(v1+14); return 0;` dupliqué/interverti (lignes 168-177 du dump) avant le test `== 2` : artefact de dump, l'ASM @0x6A11D4-0x6A11D3 ne montre qu'un seul chemin stage 1 puis stage 2. Ne pas s'y fier.

## Erreurs c_b corrigées (récapitulatif)

- D1 : f142 / payload+0x0E / f14A / word_251026A = max2 → **0** (4 stores).
- D4 : compteur LUT signé → **zéro-étendu**.
- Annotation word_251026A « miroir maxZ (Hex-Rays dit 0 — FAUX) » → ** Hex-Rays avait raison**.

## Erreurs c_a corrigées (récapitulatif)

- Omission du store hdl+0x142 @0x6A0FD9 → **rétabli (= 0)**.
- Étiquetage var_A « minX » dans le bloc init → **maxX** (init bx @0x6A0ED5).
- Prototype Vec3_MinMax_Stride8 `out[4]` → conservé `out[6]` (accord c_b/Hex-Rays), usage prouvé out[0..3].

---

## UNCERTAIN restants

1. **UNCERTAIN 0x6A0E34** : sémantique exacte des args 3/4 de BS_Memset (0xCD0,1 / 0x24,0x40 / 0x18,0x40) — forme d'appel certaine, sens (size/capacité ?) non prouvé dans ce EA.
2. **UNCERTAIN 0x6A0DC6** : consommateurs de dword_2510258/251025C hors de cette fonction (double buffer, strides 0xAAE0/0x1AAE0/0x2AAE0 écrits seuls ici).
3. **UNCERTAIN 0x6A0F0A** : layout de l'entrée LUT 156 o @0x1D972C0 (seuls +0x1C/+0x20 lus) ; nature de l'octet de sélection tbl[j*0x18] (index cible ? modèle ?).
4. **UNCERTAIN 0x6A12B0** : effet de bord sur hdl+0x140.. (fusion minmax ?) — forme d'appel certaine, contenu non prouvé.
5. **UNCERTAIN 0x6A103D** : taille réelle du buffer out de Vec3_MinMax_Stride8 (6 mots dans le frame ; seuls out[0..3] utilisés prouvés).
6. **UNCERTAIN 0x6A10F7** : taille exacte de la zone hdl+0x150 passée à IndexLut_FillFF_AssignKeys (le 5e arg 0x16=22 n'est pas une taille prouvée).

---

## Anomalies de pack

- `callers.txt` : non lu (non fourni dans la liste des entrées à lire par la consigne — absent du répertoire ? non requis pour la réconciliation).
- `hexrays.c` : corrompu aux lignes 167-177 (bloc stage 2 dupliqué + ligne 167 orpheline `:` ) — traité comme artefact, ASM prime.
- `callees.txt` : section CALLS/PROTOS vides, seules les lignes CALL/ADD-ESP sont remplies — suffisant.
