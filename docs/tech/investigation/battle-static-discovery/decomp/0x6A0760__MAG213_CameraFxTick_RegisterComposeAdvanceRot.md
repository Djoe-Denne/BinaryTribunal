# MAG213_CameraFxTick_RegisterComposeAdvanceRot @ 0x6A0760

- Instr (live): 110 (365 o, 0x6A0760-0x6A08CC)
- Palier: 2+1
- Verdict: LIKELY - tache BdLinkTask camera du FX MAG213 (30 frames) : scratch 0x58, base camera par defaut + rotations Euler sur a1+0x20, scaling ((22-frame)<<12)/12+0x1000 fusionne lea (0x6A07AE), compose avec dword_1D97778 (Mat_ComposeTwoThenCopy8 0x6A07F5), publie le node (task[0]=unk_117D6C8 0x6A0815) en tete de OT g_BattleOTBase+0x44 via sub_572200 (0x6A0828-36, dword_2510194), integre les deltas s16 avec rebond a l apex (a1[13]+=20 0x6A0840, relecture +0x12 0x6A0859, jl/jle signes 0x6A0867-C, -20-delta 0x6A0872-7D, neg +0x28/2A/2C) ; retour AL = 2 tant que frame++ < 0x1E (setl 0x6A08BF), 0 sinon
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A0760\nTYPE ; proposition: MAG213_CameraFxTick_RegisterComposeAdvanceRot
- Notes parent: checks 5.6 OK : lea +1000h (0x6A07AE), push dword_1D97778 + Mat_ComposeTwoThenCopy8 (0x6A07EC-F5), store unk_117D6C8 (0x6A0815), add edx,44h + write-back dword_2510194 (0x6A0828-36), add word +14h (0x6A0840), read +0x18 / add +0x10 (0x6A0849-51), relecture +0x12 (0x6A0859), jl/jle signes (0x6A0867-C), 0FFFFFFECh-sub-store (0x6A0872-7D), neg dx (0x6A0885), xor/setl (0x6A08B9-BF), caller data xref sub_69EF60 @0x69F71C

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A0760 (EA 0x6A0760, taille 365, 110 instr live)
 * CELLULE C-R — réconciliation c_a.c / c_b.c. Ground truth = asm.asm live.
 * ----------------------------------------------------------------------------
 * Instr (live)   : 110
 * Palier         : E3a
 * Prototype IDA  : int __cdecl sub_6A0760(_WORD *)  — retour EAX plein
 *                  (xor/setl/dec/and → 0 ou 2, code retour stepper).
 * Sauvegardes    : ebx, esi, edi. Pas de ebp : sub esp,30h @6a0760 +
 *                  3 pushes → frame esp-relatif `[esp+40h..]` (40h = 0x30+12).
 * Tâche          : tâche per-frame MAG213 (famille mag FX battle), enregistrée
 *                  par le stepper sub_69EF60, xref data @0x69F71C (unique).
 *
 * Cleanup cdecl DIFFÉRÉ (prouvé par arithmétique de pile, asm live) :
 *   · add esp,0Ch @6a0785  = 3 dwords : arg bs_modulo(1) + 2 args CameraBasis_*
 *   · add esp,08h @6a07cb  = 2 dwords : args Mat3S16_ScaleByVec12
 *   · add esp,28h @6a0861  = 10 dwords différés :
 *       Mat_ComposeTwoThenCopy8 (3 : 6a07ea/6a07eb/6a07ec)
 *       Field_readCaPre         (1 : 6a07fe)
 *       preCamReadVariables_Space (1 : 6a0808)
 *       sub_572200              (4 : 6a0827/6a082b/6a082d/6a082e)
 *       BattleScratch_Unwind    (1 : 6a0834)
 *   · add esp,30h @6a08c9  = épilogue (locaux + pops ebx/esi/edi 6a08c3..6a08c8)
 * ============================================================================ */

/* Externes — noms issus de asm.asm / callees.txt uniquement (aucun inventé) */
extern int  bs_modulo(int nbytes);                              /* 0x5082B0 bump scratch */
extern void CameraBasis_CopyDefaultAndApplyEulerS16(short *src, int *dst); /* copie base défaut 0xC78BD0..0xC78BE0 + 3 rotations s16 (0x56D090/0x56D020/0x56CFB0) */
extern void Mat3S16_ScaleByVec12(short *m, int *v);             /* 9 colonnes s16 * vec s32 >>12, in-place */
extern void Mat_ComposeTwoThenCopy8(int *a, int *b, int *dst);  /* 0x56C090 + 0x56C600(edi+0x14) + rep movsd 8 dwords */
extern void Field_readCaPre(int *st);
extern void preCamReadVariables_Space(int *st);
extern int  sub_572200(int task, int otEntry, int unk2, int prevHead); /* insertion liste OT, retour = nouvelle tête */
extern void BattleScratch_Unwind(int nbytes);                   /* inverse de bs_modulo, bump dword_1D999C4 */

/* Globales (globals.txt) */
extern int dword_1D97778[];   /* bloc view caméra, arg1 Mat_ComposeTwoThenCopy8 */
extern int g_BattleOTBase;    /* base OT battle ; entrée utilisée = +0x44 (asm: add edx,44h) */
extern int dword_2510194;     /* tête de liste OT ; lue, passée à sub_572200, réécrite par EAX */
extern int unk_117D6C8;       /* stocké nu dans task[0] @6a0815 */

int __cdecl sub_6A0760(short *a1)
{
    int v15[2];   /* var_30/var_2C @E-0x30..E-0x2C : slots 1..2 devient s32 */
    int v16;      /* var_28 @E-0x28 : slot 1 du vec scale */
    int v17[8];   /* var_20..var_4 @E-0x20..E-0x04 : bloc caméra 8 dwords
                   * (var_C/var_8/var_4 de IDA = v17[5..7], mêmes adresses prouvées) */
    int *task;    /* edi : buffer bs_modulo 0x58 octets */

    task = bs_modulo(0x58);                              /* 6a0766 push 58h ; 6a0768 call ; arg différé @6a0785 */

    /* 6a0773 lea eax,&v17 ; 6a0777 lea ebx,[esi+20h] ; push &v17(arg2) ; push ebx(arg1)
     * ebx = &a1[16] (a1+0x20 octets) conservé jusqu'à 6a08a6 */
    CameraBasis_CopyDefaultAndApplyEulerS16(&a1[16], v17);           /* 6a077c ; add esp,0Ch @6a0785 */

    /* 6a0781 mov ax,[esi+0Ch] ; 6a0788 cmp ax,16h ; 6a078c jl — SIGNED */
    if ((short)a1[6] >= 22) {
        /* 6a0791 movsx edx,ax ; 6a0791 mov ecx,16h ; 6a079b sub ecx,edx ;
         * 6a079d shl ecx,0Ch (LOGICAL) ; 6a07a0 imul ecx (EDX:EAX = ecx*0x2AAAAAAB ;
         * 6a07a2 sar edx,1 ; 6a07aa shr eax,1Fh = correction signée du dividende /12 ;
         * 6a07ae lea eax,[edx+eax+1000h] — le +0x1000 FUSIONNÉ dans le lea.
         * => ((22 - (s16)a1[6]) << 12) / 12 + 0x1000, division signée tronquée.
         * Branche garantie a1[6] >= 22 => (22-frame) <= 0 => scale <= 0x1000. */
        v15[0] = v15[1] = v16 =
            ((22 - (int)(short)a1[6]) << 12) / 12 + 0x1000;   /* stores: var_30 @6a07c2, var_2C @6a07be, var_28 @6a07ba */
        Mat3S16_ScaleByVec12((short *)v17, v15);              /* 6a07c6 ; add esp,8 @6a07cb */
    }

    /* 6a07ce..6a07e2: movsx des champs a1[8..10] -> v17[5..7] (var_C/var_8/var_4) */
    v17[5] = (short)a1[8];                                        /* [esi+10h] store @6a07da */
    v17[6] = (short)a1[9];                                        /* [esi+12h] store @6a07de */
    v17[7] = (short)a1[10];                                       /* [esi+14h] store @6a07f1 */

    /* 6a07ea push &v17(arg3) ; 6a07eb push &v17(arg2) ; 6a07ec push offset dword_1D97778(arg1) */
    Mat_ComposeTwoThenCopy8(&dword_1D97778[0], v17, v17);         /* 6a07f5 */

    Field_readCaPre(v17);                                          /* 6a07fe push &v17 ; 6a07ff call */
    preCamReadVariables_Space(v17);                                /* 6a0808 push &v17 ; 6a0809 call */

    /* 6a080e..6a0815 : init du nœud scratch */
    task[7] = 0;                                                   /* mov dword [edi+1Ch],0 */
    task[0] = (int)&unk_117D6C8;                                   /* store nu @6a0815 — UNCERTAIN rôle (tag/vtable?) */

    /* 6a0821 mov ecx,dword_2510194 (arg4) ; 6a0827 push ecx ;
     * 6a0821 mov edx,g_BattleOTBase ; 6a0828 add edx,44h (OFFSET OCTET 0x44,
     * Hex-Rays imprime "+17" car type DWORD*) ; 6a082b push 2(arg3) ;
     * 6a082d push edx(arg2) ; 6a082e push edi(arg1) ; 6a082f call ;
     * 6a0836 dword_2510194 = eax */
    dword_2510194 = sub_572200((int)task, (int)((char *)&g_BattleOTBase /* UNCERTAIN 0x6a082f pointeur valeur vs objet */ + 0x44), 2, dword_2510194);

    BattleScratch_Unwind(0x58);                                    /* 6a0834 push 58h ; 6a083b call */

    /* --- intégration des deltas : tout WORD (16 bits), wraps natifs --- */
    a1[13] += 20;                                                  /* 6a0840 add word [esi+1Ah],14h */
    {
        short v13_ = a1[13];                                       /* 6a0845 mov ax,[esi+1Ah] (APRÈS +=20) */
        short v12_ = a1[12];                                       /* 6a0849 mov cx,[esi+18h] */
        a1[9]  += v13_;                                            /* 6a084d add [esi+12h],ax */
        a1[8]  += v12_;                                            /* 6a0851 add [esi+10h],cx */
        short dx14 = a1[14];                                       /* 6a0855 mov dx,[esi+1Ch] */
        /* DÉPENDANCE D'ORDRE : cx9 relu MÉMOIRE @6a0859, donc prend la valeur
         * a1[9] MISE À JOUR par 6a084d, pas l'ancienne. */
        short cx9 = a1[9];
        a1[10] += dx14;                                            /* 6a085d add [esi+14h],dx */

        /* --- rebond : tests SIGNÉS ; add esp,28h @6a0861 sur le chemin --- */
        if (cx9 >= 0 && v13_ > 0) {                                /* 6a0864 test cx,cx ; 6a0867 jl(skip si neg) ; 6a0869 test ax,ax ; 6a086c jle(skip si <=0) */
            short v20 = a1[20];                                    /* 6a086e mov dx,[esi+28h] */
            short v22 = a1[22];                                    /* 6a0881 mov cx,[esi+2Ch] */
            a1[13] = (short)(-20 - v13_);                          /* 6a0872 mov ecx,0FFFFFFECh ; 6a0877 sub ecx,eax ; 6a087d store s16 */
            a1[20] = -v20;                                         /* 6a0885 neg */
            a1[21] = -a1[21];                                      /* 6a0888 neg (6a0879 read @6a0879..6a0888) */
            a1[22] = -v22;                                         /* 6a088b neg ; stores 6a088e..6a0896 */
        }

        /* 6a089a..6a08ad : relecture MÉMOIRE après négation éventuelle */
        a1[16] += a1[20];                                          /* 6a08a6 add [ebx],dx — ebx = &a1[16] depuis 6a0777 */
        a1[17] += a1[21];                                          /* 6a08a9 add [esi+22h],ax */
        a1[18] += a1[22];                                          /* 6a08ad add [esi+24h],cx */
    }

    /* 6a08b1 inc word [esi+0Ch] ; 6a08b5 mov si,[esi+0Ch] (nouvelle valeur) ;
     * 6a08b9 xor eax,eax ; 6a08bb cmp si,1Eh ; 6a08bf setl al (SIGNED) ;
     * 6a08c2 dec eax ; 6a08c5 and eax,2 → EAX = 0 si <30, 2 sinon. */
    ++a1[6];
    return (short)a1[6] < 30 ? 0 : 2;
}                                                                  /* pops 6a08c3..6a08c8 ; add esp,30h @6a08c9 ; retn @6a08cc */

/* ---------------------------------------------------------------------------
 * UNCERTAIN 0x6a0815 — rôle de unk_117D6C8 stocké nu dans task[0] (tag/vtable?).
 * UNCERTAIN 0x6a082f — protocole sub_572200 / dword_2510194 (tête de liste OT)
 *             et sens du 3e arg = 2.
 * UNCERTAIN 0x6a0760 — rôles des champs a1 (offsets PROUVÉS par l'ASM :
 *             0x0C compteur frames, 0x10/0x12/0x14 pos, 0x18/0x1A/0x1C deltas,
 *             0x20 rotations, 0x28/0x2A/0x2C deltas cible) ; sémantique inférée.
 * --------------------------------------------------------------------------- */
```

## Analyse semantique

# Sémantique sub_6A0760 @ 0x6A0760 (réconciliation R)

- **Rôle (1 phrase)** : tick par-frame 30 frames du callback MAG213 (inséré en data à 0x69F71C dans le stepper sub_69EF60) qui alloue un node OT de 0x58 octets, construit la base caméra par défaut (0xC78BD0) + rotations Euler du state, la fondue vers l'identité sur les dernières frames, compose et écrit le bloc view `dword_1D97778`, l'insère en tête de l'OT battle (g_BattleOTBase+0x44, catégorie 2, tête `dword_2510194`), puis avance/symétrise les déplacements et rotations du state et retourne 2 tant que le compteur post-inc `< 0x1E`, 0 sinon.
- **Verdict** : LIKELY consolidé.
- **Confiance** : LIKELY (callers + callees + ancrage orchestrator alignés, opcodes cités ; seul le préfixe "MAG213" repose sur le caller/contexte, l'ASM seul ne distingue pas 210/213/223 ; wiki.md du pack vide, wikis QMD seulement).
- **Nom catalogue** : absent (sub_6A0760). Synthèse A/B (markdown seul, pas de rename) :
  `MAG213_CameraFxTick_RegisterComposeAdvanceRot` — retient "Register" (B, insertion OT prouvée), "Compose" (A, écriture du bloc view), "AdvanceRot" (B, intégration/symétrisation des deltas). Si un nom plus court est demandé : confirmer `MAG213_CameraFxTick_RegisterAndAdvanceRot` (B) tel quel.

## In / Out / Effets

- **In** : cdecl, 1 arg : `arg_0` (esi) = pointeur state tâche (s16-friendly, `short*` fidèle). Champs ASM-prouvés :
  - `+0x0C` s16 compteur de frames (cmp 0x16 @6a0788 pour le fondu ; inc @6a08b1 ; cmp 0x1E post-inc @6a08bb pour le retour).
  - `+0x10/+0x12/+0x14` s16 : angles/position de rotation consommés 6a07ce..6a07da, intégrés 6a084d/6a0851/6a085d.
  - `+0x18/+0x1A/+0x1C` s16 : deltas de rotation — `+0x1A += 0x14` @6a0840 ; `+0x18` et `+0x1C` ajoutés à `+0x10`/`+0x14` @6a0849/6a0851/6a0855/6a085d. **+0x18 n'est PAS un seuil** (voir divergence D1).
  - `+0x20` (via `lea ebx,[esi+20h]` @6a0777 = &a1[16]) : base caméra s16 source, re-add à `6a08a6` (`add [ebx],dx`) → CameraBasis évolutive.
  - `+0x22/+0x24` s16 accumulé (`add` 6a08a9/6a08ad) ; `+0x28/+0x2A/+0x2C` s16 vec de mouvement (négations in-place 6a0885..6a0896).
- **Out** : eax = 0 ou 2, **32 bits** (`xor` 6a08b9, `setl al` 6a08bf SIGNED, `dec eax` 6a08c2, `and eax,2` 6a08c5) : 2 si (s16)frame post-inc < 0x1E, 0 sinon. Pas un widen-AL seul.
- **Effets** :
  1. Alloc scratch 0x58 (`push 58h` @6a0766 / `bs_modulo` @6a0768) symétrisé par `BattleScratch_Unwind` 0x58 @6a0834/6a083b (bump dword_1D999C4).
  2. `CameraBasis_CopyDefaultAndApplyEulerS16(&a1[+0x20], &scratch)` @6a077c — 8 dwords dans var_20.
  3. Fondu identité si `[esi+0Ch] >= 0x16` (`jl` @6a078c → skip) : facteur `((0x16 - frame) << 0Ch)/3 + 0x1000` (imul 0x2AAAAAAB @6a0796, `sar edx,1` @6a07a2, `shr eax,1Fh` @6a07aa, **+0x1000 fusionné dans `lea eax,[edx+eax+1000h]` @6a07ae**), vec3 uniforme var_28/var_2C/var_30 → `Mat3S16_ScaleByVec12` @6a07c6.
  4. Écrit le bloc view caméra : `Mat_ComposeTwoThenCopy8(&M,&M, dword_1D97778)` (push offset @6a07ec, call @6a07f5).
  5. `Field_readCaPre` @6a07ff / `preCamReadVariables_Space` @6a0809 sur le même &var_20 (état caméra pré-script).
  6. Node task : `[edi+0x1C]=0` @6a080e, `[edi+0]=offset unk_117D6C8` @6a0815 (rôle UNCERTAIN : vtable/tag), puis `sub_572200(edi, (char*)g_BattleOTBase+0x44, 2, dword_2510194)` pushes 6a0827..6a082e, call @6a082f ; nouvelle tête `dword_2510194 = eax` @6a0836.
  7. Avance deltas (6a0840..6a085d, avec **relecture mémoire de `+0x12` à 6a0859 après son add @6a084d**), rebond signé (D1/D2), intègre vélocité sur `+0x20/22/24` (6a089a..6a08ad), inc compteur @6a08b1.

## Divergences A/B tranchées

- **D1 — Bounce : seuil +0x18 vs condition signée sur +0x12/+0x1A (A vs B)** — Tranché **B**.
  - A (preuve 7 / In) décrit `+0x18` comme « seuil de renversement » (« quand [esi+0x12] >= seuil [esi+0x18] »).
  - ASM : `mov cx,[esi+18h]` @6a0849 est consommé uniquement par `add [esi+10h],cx` @6a0851 (delta ajouté à +0x10) ; ensuite `mov cx,[esi+12h]` @6a0859 **relit +0x12 après son add** @6a084d (ordering dep). Le rebond teste `test cx,cx ; jl @6a0867` (skip si (s16)+0x12 < 0) puis `test ax,ax ; jle @6a086c` (skip si (s16)[+0x1A] <= 0) → négation des 3 vélocités +0x28/2A/2C `neg dx/ax/cx` @6a0885..6a088b et `+0x1A = FFFFFFFECh - eax` = **-20 - delta** (`mov ecx,0FFFFFFECh` @6a0872, `sub ecx,eax` @6a0877, store s16 @6a087d). Aucun seuil +0x18 dans la logique de rebond. B correct; notes C-R §4 alignées.
- **D2 — Polarité/condition rebond (A dit « 0 <= +0x12 et 0 < ax »)** — Tranché **identique après D1** mais avec l'inversion : la branche de négation est prise quand `(s16)[+0x12] >= 0 && (s16)[+0x1A] > 0` (jl/jle **signés** @6a0867/6a086c). Formulation A « >= seuil » est remplacée par B.
- **D3 — Retour (A: `setl/dec/and` ; B: `(s16)frame < 30 ? 2 : 0`)** — Tranché **les deux (ACCORD)**, sémantiquement identiques ; retenu la forme lisible B avec l'ancre 6a08b9..6a08c8. Test sur la valeur **post-inc** (chargée @6a08b5 après `inc` @6a08b1) : 2 = en cours (< 30 frames), 0 = terminé.
- **D4 — +0x30: +0x1000 placé dans le lea vs add séparé** — Tranché **B (formulation)** : `lea eax,[edx+eax+1000h]` @6a07ae fusionne le +1000h ; stores eax ×3 @6a07ba/6a07be/6a07c2 avant `Mat3S16_ScaleByVec12` @6a07c6. Notes C-R §2 alignées.
- **D5 — task[0]=&unk_117D6C8 (A/B : vtable ou fptr draw)** — Tranché **store nu reproduit tel quel** (`mov dword ptr [edi], offset unk_117D6C8` @6a0815) ; rôle UNCERTAIN assumé, pas d'invention.
- **D6 — Insertion OT (A: « nouvelle tête dword_2510194 » ; B: idem + couche +0x44)** — Tranché **accord** : pushes dcc 6a0827 (dword_2510194) / 6a082b (2) / 6a082d (`add edx,44h` @6a0828 — Hex-Rays masque en `+17` dwords, l'offset littéral est **0x44 octets**) / 6a082e (edi), call @6a082f, store tête @6a0836. Ancrage orchestrator : insertion OT tête de liste, category word 2.
- **D7 — Nom** — Tranché **synthèse** (voir ci-dessus) : A mettait en avant la copie/fondu vers le bloc view (« Sweep » + writers `dword_1D97778`), B l'enregistrement du node + avance des rotations. Les trois effets sont prouvés ; nom synthétisé couvrant les trois.

## Preuves (ASM citées)

1. `6a0766/6a0768` `push 58h; call bs_modulo` + `6a0834/6a083b` `push 58h; call BattleScratch_Unwind` — alloc/quasi-unwind scratch symétrique, pas un CombatAlloc.
2. `6a0777` `lea ebx,[esi+20h]` → `6a077c` `call CameraBasis_CopyDefaultAndApplyEulerS16` (arg1 dernier push @6a077b = &a1[16]) — base caméra évolutive sur +0x20, ebx réutilisé `add [ebx],dx` @6a08a6.
3. `6a0788` `cmp ax,16h` / `jl @6a078c` (SIGNED) + séquence div par 12 (`sub ecx,edx` @6a079b sur 0x16-frame, `shl ecx,0Ch` @6a079d, imul 0x2AAAAAAB @6a07a0, `sar/shr` @6a07a2/6a07aa, `lea [edx+eax+1000h]` @6a07ae) — fondu 12.12-fixed vers l'identité sur frames >= 22.
4. `6a07ec` `push offset dword_1D97778` + `6a07f5` `call Mat_ComposeTwoThenCopy8` — écriture du bloc view caméra (ancrage orchestrator : bloc view).
5. `6a0815` `mov dword ptr [edi], offset unk_117D6C8` ; `6a0827..6a082f` `sub_572200(edi, g_BattleOTBase+0x44, 2, dword_2510194)` ; `6a0836` `mov dword_2510194, eax` — construction node + insertion OT tête de liste (couche 0x44, word 2).
6. `6a0840` `add word [esi+1Ah],14h` → adds chaîne 6a084d/6a0851/6a085d avec relecture `[esi+12h]` @6a0859 après son add @6a084d — intégration des deltas chaque frame.
7. `6a0864..6a0896` `test cx,cx ; jl @6a0867 ; test ax,ax ; jle @6a086c` puis 3 `neg` sur +0x28/2A/2C et `+0x1A = -20 - (+0x1A)` (6a0872/6a0877/6a087d) — symétrisation du mouvement (tout signé).
8. `6a08b1` `inc word [esi+0Ch]` ; `6a08b9..6a08c8` `xor eax,eax / cmp si,1Eh / setl al / dec / and 2` — retour 0/2 stepper, seuil 30 frames.

## Checks §5.6

- Callers cités : `0x69F71C` data xref dans `sub_69EF60` (callers.txt) ✓ — ancrage stepper MAG213.
- Callees cités : bs_modulo, CameraBasis_CopyDefaultAndApplyEulerS16, Mat3S16_ScaleByVec12, Mat_ComposeTwoThenCopy8, Field_readCaPre, preCamReadVariables_Space, sub_572200, BattleScratch_Unwind — tous dans callees.txt ✓.
- Strides en nombres : 0x58, 0x0C/0x10/0x12/0x14/0x18/0x1A/0x1C, +0x20 (= &a1[16]), +0x22/24, +0x28/2A/2C, 0x44, 0x16, 0x1E, 0x14, 0x1000, 0x2AAAAAAB — aucun stride fantôme ✓.
- Polarités signées : `jl` @6a078c, `jl` @6a0867, `jle` @6a086c, `setl` @6a08bf, movsx systématiques — aucune comparaison unsigned dans le corps ✓.
- Largeur retour : eax 32 bits (`and eax,2` @6a08c5), valeurs 0/2, test post-inc ✓.
- Nom : ≥2 preuves ASM indépendantes adressées (insertion OT 6a0827..6a0836 ; avance/symétrisation deltas 6a0840..6a08ad ; écriture view 6a07ec/6a07f5) ✓.

## Questions ouvertes (non bloquantes)

- Préfixe MAG213 : l'ASM ne distingue pas 210/213/223 ; vient du caller/contexte orchestrator seulement.
- Rôle exact de `unk_117D6C8` dans task[0] (vtable draw, tag, table d'état ?) et sémantique fine de `sub_572200` (protocole liste OT / arg 2 = catégorie 2 ?) — UNCERTAIN assumé.
- Rôle exact de `Field_readCaPre` / `preCamReadVariables_Space` sur &var_20 (état caméra pré-script : poussé vers ou lu ?).
- B indique que le scratch 0x58 ne couvre pas l'écriture +0x14 faite par Mat_ComposeTwoThenCopy8 (rep movsd) : cohérence supposée par pool frame-rémanent ; à valider hors blind.

## IDBCOMMENT

Tache BdLinkTask liee au stepper MAG213 sub_69EF60 via xref data 0x69F71C. Chaque frame alloue un node 0x58 octets, copie la base camera 0xC78BD0 avec rotations Euler du state, la fonde vers l'identite sur les 8 dernieres frames ((22-frame)<<12)/3+0x1000), la compose dans le bloc view dword_1D97778 puis insere le node en tete de l'OT battle g_BattleOTBase+0x44 via sub_572200. Avance ensuite les deltas (+0x1A += 20) et symetrise le mouvement si le cap +0x12 >= 0 et le delta +0x1A > 0. Retourne eax=2 tant que le compteur +0x0C post-inc reste sous 0x1E, 0 ensuite. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — CELLULE 0x6A0760 (sub_6A0760, 110 instr live)

Ground truth = `asm.asm` (live). `hexrays.c` = vérificateur. Entrées modifiées : aucune.

## Tranché (A vs B vs ASM)

1. **Cleanup cdecl groupés** — Tranché **A+B (accès)** : identiques.
   - `add esp,0Ch` @6a0785 = 3 dwords : push 58h bs_modulo @6a0766 + push &v17 @6a077a + push ebx(&a1+20h) @6a077b.
   - `add esp,28h` @6a0861 = 10 dwords différés, pushes exacts : Mat_ComposeTwoThenCopy8 (6a07ea eax=&v17, 6a07eb ecx=&v17, 6a07ec offset dword_1D97778), Field_readCaPre (6a07fe &v17), preCamReadVariables_Space (6a0808 &v17), sub_572200 (6a0827 ecx=dword_2510194, 6a082b 2, 6a082d edx=g_BattleOTBase+44h, 6a082e edi=task), BattleScratch_Unwind (6a0834 58h).
   - My minor: la formulation du C_R réécrit sub_572200 comme `((char*)&g_BattleOTBase)+0x44` (offset octet literal), pixel conforme à `add edx,44h` @6a0828. Aucun désaccord avec A/B sur les faits.
2. **Scaling** — Tranché **B** (formulation) : `lea eax,[edx+eax+1000h]` @6a07ae **fusionne** le +0x1000 (les stores eax @6a07ba/be/c2 utilisent ce résultat). Séquence exacte : `movsx edx,ax` @6a0791, `sub ecx,edx` (22-frame) @6a079b, `shl ecx,0Ch` **logique** @6a079d, `imul ecx` avec magic 0x2AAAAAAB @6a07a0, `sar edx,1` @6a07a2, `shr eax,1Fh` correction signée @6a07aa, division signée tronquée /12. A et B décrivent la même séquence ; aucun désaccord de fond.
3. **Ordre a1[9] vs a1[12]/a1[13]** — Tranché **A+B** : `add [esi+12h],ax` @6a084d modifie a1[9] **avant** `mov cx,[esi+12h]` @6a0859 — la relecture prend la valeur mise à jour (dépendance d'ordre respectée dans C_R : relecture mémoire, pas réutilisation du registre). Les adds a1[8]/a1[10] (6a0851/6a085d) sont indépendantes de ce read.
4. **Rebond** — Tranché **A+B** : `test cx,cx ; jl @6a0867` (skip si (s16)a1[9]_maj < 0) puis `test ax,ax ; jle @6a086c` (skip si (s16)a1[13] <= 0) → branche si `a1[9] >= 0 && a1[13] > 0` (SIGNED). `a1[13] = -20 - a1[13]` : `mov ecx,0FFFFFFECh` @6a0872 + `sub ecx,eax` @6a0877, store s16 @6a087d. Négations word `neg dx/ax/cx` @6a0885/6a0888/6a088b sur a1[20..22], stores @6a088e..6a0896. Relecture mémoire final 6a089a..6a08ad (a1[16] via [ebx], a1[17]/a1[18]).
5. **Retour** — Tranché **A+B** : `xor eax,eax` @6a08b9, `cmp si,1Eh` @6a08bb sur la valeur **post-inc** (chargée @6a08b5 après `inc word [esi+0Ch]` @6a08b1), `setl al` @6a08bf SIGNED, `dec eax` @6a08c2, `and eax,2` @6a08c5 → **0 si (s16)frame[6]++ < 30, 2 sinon**. Condition exacte confirmée : le compteur incrémenté est testé.
6. **task[0] = &unk_117D6C8** — Tranché **A+B** : store nu `mov dword ptr [edi], offset unk_117D6C8` @6a0815, reproduit tel quel. Rôle UNCERTAIN.
7. **Base caméra** — Tranché **A+B** : `CameraBasis_CopyDefaultAndApplyEulerS16` sur **a1+0x20 octets = &a1[16]** (`lea ebx,[esi+20h]` @6a0777, arg1 dernier push @6a077b), sortie 8 dwords dans var_20 @6a077c. ebx conservé jusqu'à `add [ebx],dx` @6a08a6.

## UNCERTAIN restants

- **0x6a0815** : rôle de unk_117D6C8 stocké dans task[0] (tag/vtable ? table d'état ?).
- **0x6a082f** : sémantique sub_572200 (insertion liste OT ?) et du 3e arg `2` ; protocole dword_2510194 (tête de liste) non prouvé localement.
- **0x6a0760** : rôles sémantiques des champs a1 (offsets prouvés, significations inférées).

## Divergences vs Hex-Rays (aucune sémantique)

- Hex-Rays `g_BattleOTBase + 17` masque l'offset littéral **0x44** (`add edx,44h` @6a0828) — scaling DWORD*.
- Hex-Rays `v15[2]` ne montre que 2 slots nommés ; l'ASM écrit **3** emplacements (var_30 @6a07c2, var_2C @6a07be, var_28 @6a07ba) — couverts dans C_R par v15[0]/v15[1]/v16.
- Hex-Rays type `_WORD *a1` ; tous les accès ASM sont s16 signés (movsx/jl/jle/setl) → `short*` plus fidèle.
- Hex-Rays rend `/12` directement ; l'ASM est la magie imul 0x2AAAAAAB + sar 1 + shr 1Fh — résultat signé tronqué identique.
- Hex-Rays fusionne les locaux var_C/var_8/var_4 dans v17[5..7] : mêmes adresses prouvées (E-0x0C/E-0x08/E-0x04).

## A vs B — divergences internes résolues

- Retour : A écrit `(setl…) - 1 & 2` bit-exact ; B écrit `(s16)a1[6] < 30 ? 0 : 2` — sémantiquement identiques, C_R prend la forme lisible (B) avec l'ancre de la séquence setl/dec/and.
- Aucune autre divergence A/B détectée (mêmes ordres, mêmes polarités, mêmes offsets).
