# MagFX_HelixRise_TaskStep @ 0x6A08D0

- Instr (live): 113 (382 o, 0x6A08D0-0x6A0A4D)
- Palier: 2+1
- Verdict: LIKELY - tache wobble helicoidale mag FX : angle base+w wrap 16 bits (add bp/movsx 0x6A08EF-900), rayon oscillant sin(w/2)>>3, rotation cos/sin Q12 avec neg AVANT sar 0xC (0x6A092C-E), montee dword[obj+0x30]*w>>0xC (0x6A0936-F), matrice m[0]=m[4]=w+0x400 m[8]=0x1000 m[9]=0 (0x6A0993-AC), compose avec la camera (sub_56C270 obj+0x44, 0x6A09A4) et publie une prim 0x58 en tete de OT g_BattleOTBase+0x44 via sub_572200 (0x6A0A0F-1F, dword_2510194) ; phase += 0x80, retour EAX {0,2} via cmp si,0x1000 signe + setl (0x6A0A3A-46)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A08D0\nTYPE ; proposition: MagFX_HelixRise_TaskStep
- Notes parent: checks 5.6 OK : add bp+movsx (0x6A08EF-900), sar 1 (0x6A08F5), sar 3 (0x6A08FD), neg+sar 0xC (0x6A092C-E), rot[2] dword[obj+30h] (0x6A0936), add ax,400h + stores var_18/var_20 (0x6A0993-9D), var_10=1000h (0x6A09A5), var_12=0 (0x6A09AC), sub ecx,14h preCam (0x6A0961), push ebp obj+44h (0x6A09A4), 4 args prim (0x6A0A0F-16), add esp,4Ch (0x6A0A1C), write-back dword_2510194 (0x6A0A1F), add esp,4 (0x6A0A35), cmp si,1000h + setl (0x6A0A3A-3F), caller data xref sub_69EF60 @0x69FAB3

## C reconcilie

```c
// ============================================================================
// sub_6A08D0 — C réconcilié (triple 2+1, campagne mag FX battle, cellule C-R)
// EA        : 0x6A08D0 — taille 382 octets (0x6A08D0..0x6A0A4D), 113 instr.
// Type IDA  : sub_6A08D0, pas de prototype (meta.json).
// ----------------------------------------------------------------------------
// PRÉAMBULE : Ground truth = live ASM (asm.asm @0x6A08D0, 113 instr) + 
// ida_dump_bytes, PAS Hex-Rays (hexrays.c = vérificateur seulement).
// Taille 382 octets, plage 0x6A08D0..0x6A0A4D.
// Signature reconstruite : int __cdecl sub_6A08D0(void *task)
//   - cdecl : args poussés droite->gauche, nettoyage par le caller.
//   - Retour : EAX 32 bits, valeurs {0, 2} (continuer / fin, stepper MAG213).
// Sauvegardes de registres : ebx (0x6A08D3), ebp (0x6A08D4), esi (0x6A08D5),
// edi (0x6A08DA). Cadre : sub esp,0x38 (0x6A08D0), rendu add esp,38h (0x6A0A4A).
// Corrections add esp : add esp,4Ch @0x6A0A1C (19 pushes cdecl cumulés) ;
// add esp,4 @0x6A0A35 (arg de BattleScratch_Unwind, pushé à part @0x6A0A24) ;
// add esp,38h @0x6A0A4A (cadre). Le thunk Thunk_460860_480012 est net 0
// (push 0x480012 + call sub_460860 + pop ecx + ret : il solde son propre arg).
// ----------------------------------------------------------------------------
// Rôle (indicatif, du pack) : tâche "wobble" BdLinkTask enregistrée par le
// stepper MAG213 0x69EF60 (dword_25101A8) ; unique xref data @0x69fab3.
// Appelée si (op-0x19)%4==0. Retour stepper : 0 (continuer) / 2 (fin).
// task+0x0E : word phase wobble, += 0x80 par frame ; task+0x10 : ptr entité.
// ============================================================================
// Externes : uniquement des callees présents dans asm.asm / callees.txt.

extern void *bs_modulo(unsigned int nbytes);        // 0x5082B0 : alloc scratch battle, bump dword_1D999C4
extern int   Fixed_Sin4096_Q12(int angle);          // fild; *pi/2048 (flt_B6B980); fsin; *4096.0; magic-double
extern int   Fixed_Cos4096_Q12(int angle);          // idem fcos (D9FF)
extern void  Field_readCaPre(void *arg);            // retour ignoré aux 2 appels
extern void  preCamReadVariables_Space(void *base); // base = &buf - 0x14 (struct englobante)
extern void  setSomeDword5(void *arg);              // arg = &var_38 (3 mots de rotation)
extern void  Thunk_460860_480012(void);             // push 0x480012; call sub_460860; pop ecx; ret
extern void  GteState_Get_1CA8A74(void *dest);      // copie 3 dwords 0x1CA8A74/78/7C
extern void  sub_56C270(void *arg1, void *arg2);    // arg1 = obj+0x44, arg2 = &m
extern void  Mat_ComposeTwoThenCopy8(void *a, void *b, void *c); // 0x56C090 + 0x56C600 + rep movsd 8 dwords
extern int   sub_572200(void *prim, void *otEntry, int kind, int prev); // chaînage prim OT
extern void  BattleScratch_Unwind(unsigned int nbytes); // inverse de bs_modulo (dword_1D999C4)

// Globales (globals.txt) :
extern unsigned int dword_1D97778;   // 0x1D97778 : arg1 de Mat_ComposeTwoThenCopy8
extern unsigned int dword_2510194;   // 0x2510194 : tête/queue liste prims, lue puis réécrite
extern unsigned int g_BattleOTBase;  // OT battle ; entrée utilisée = base + 0x44 (add ecx,44h @0x6A0A10)

// unk_117D360 : étiquette globale dont l'ADRESSE est stockée dans blk+0 (0x6A09FE).
extern int unk_117D360;

int __cdecl sub_6A08D0(void *a1)
{
    unsigned char *task;    // esi  = a1 (0x6A08D6 mov esi,[esp+44h+arg_0])
    unsigned char *obj;     // edi  = *(task+0x10) (0x6A08DD mov edi,[esi+10h])
    unsigned char *blk;     // ebx  = bs_modulo(0x58) (0x6A08E9 mov ebx,eax)
    short          w;       // ax   = word [task+0x0E] — phase (0x6A08EB)
    short          base_w;  // bp   = word [obj+0x2A] (0x6A08E5 mov bp,[edi+2Ah])
    int            ang;     // ebp  = sext16(base_w + w) — somme 16 bits AVEC wrap (0x6A08EF add bp,ax ; 0x6A0900 movsx ebp,bp)
    int            s8;      // ecx/v24 — (short)(Fixed_Sin4096_Q12(sext(w) >> 1) >> 3)
                            //   stocké dans le SLOT arg_0 entrant (0x6A0907 mov [esp+54h+arg_0],ecx)
                            //   : réutilisation de pile après copie de a1 dans esi, PAS un 2e paramètre.
    short rot[3];           // var_38/var_36/var_34 — 3 mots passés à setSomeDword5
    int   cam[3];           // var_30/var_2C/var_28 — 3 ints ; base passée à preCamReadVariables_Space
                            //   = &var_30 - 0x14 (0x6A0955 lea ecx,[var_30] ; 0x6A0961 sub ecx,14h)
                            //   -> cam occupe +0x14/+0x18/+0x1C de la struct englobante (0x20 octets)
    short m[9];             // var_20..var_10 — 9 mots ; matrice diag(w+0x400, w+0x400, 0x1000)
    int   gte[3];           // var_C/var_8/var_4 — copie GTE 0x1CA8A74/78/7C (0x6A0981 lea eax,[var_C])
    short w2;               // si = word [task+0x0E] re-relu après += 0x80 (0x6A0A31 mov si,[esi+0Eh])

    task = (unsigned char *)a1;
    obj  = *(unsigned char **)(task + 0x10);            // 0x6A08DD

    blk = (unsigned char *)bs_modulo(0x58);             // 0x6A08DB push 58h ; 0x6A08E0 call (cdecl : l'arg RESTE sur la pile, compté dans les 19)

    // --- angle : base(entité) + phase(tâche), add 16 bits avec wrap --------
    // 0x6A08E5 mov bp,[edi+2Ah] ; 0x6A08EB mov ax,[esi+0Eh] ; 0x6A08EF add bp,ax
    // PAS 0x80 ici : le +0x80 par frame est à 0x6A0A2B, APRÈS le rendu OT.
    base_w = *(short *)(obj + 0x2A);
    w      = *(short *)(task + 0x0E);
    // 0x6A0900 movsx ebp,bp : la somme 16 bits (wrap volontaire) est sign-extendée
    // pour le trig. Modélisation du wrap :
    ang = (short)((unsigned short)base_w + (unsigned short)w);

    // --- trig Q12 -----------------------------------------------------------
    // 0x6A08F2 movsx eax,ax ; 0x6A08F5 sar eax,1 (ARITHMÉTIQUE) — arg = sext(w) >> 1
    // 0x6A08F8 call Fixed_Sin4096_Q12 ; 0x6A08FD sar eax,3 ; 0x6A0903 movsx ecx,ax
    s8 = (short)(Fixed_Sin4096_Q12(((int)w) >> 1) >> 3);   // sin>>3, puis sext 16 bits

    // rot[0] : 0x6A0906 push ebp(ang) ; 0x6A090B call Cos ; 0x6A0910 imul eax,s8 ;
    //          0x6A0915 sar eax,0Ch ; 0x6A0919 mov [var_38],ax (store WORD)
    rot[0] = (short)((s8 * Fixed_Cos4096_Q12(ang)) >> 12);
    // rot[1] : 0x6A091E call Sin(ang) ; 0x6A0923 imul eax,s8 ; 0x6A092C NEG ;
    //          0x6A092E sar eax,0Ch — négation AVANT le shift arithmétique ;
    //          0x6A0931 mov [var_36],ax
    //          (0x6A0928 movsx edx,word [esi+0Eh] charge w pour rot[2], entre les deux)
    rot[1] = (short)((-(s8 * Fixed_Sin4096_Q12(ang))) >> 12);
    // rot[2] : 0x6A0936 mov eax,[edi+30h] (DWORD) ; 0x6A0939 imul eax,edx (w sext) ;
    //          0x6A093F sar eax,0Ch ; 0x6A0943 mov [var_34],ax
    //          -> le multiplicateur est la PHASE brute w, pas la somme ang.
    rot[2] = (short)((*(int *)(obj + 0x30) * (int)w) >> 12);

    // --- lecture caméra / pré-caméra (round 1) -------------------------------
    // 0x6A093C lea ebp,[edi+44h] ; 0x6A0942 push ebp ; 0x6A0948 call — retour ignoré.
    // ebp reste = obj+0x44 jusqu'au push de sub_56C270 (0x6A09A4).
    Field_readCaPre(obj + 0x44);

    // 0x6A094D movsx ecx,word [edi+34h] ; 0x6A0951 mov [var_30],ecx
    // 0x6A0959 movsx edx,word [edi+36h] ; 0x6A095D mov [var_2C],edx
    // 0x6A0964 movsx eax,word [edi+38h] ; 0x6A0969 mov [var_28],eax
    cam[0] = (int)*(short *)(obj + 0x34);
    cam[1] = (int)*(short *)(obj + 0x36);
    cam[2] = (int)*(short *)(obj + 0x38);
    // 0x6A0955 lea ecx,[var_30] ; 0x6A0961 sub ecx,14h ; 0x6A0968 push ecx ; 0x6A096D call
    // -> la struct passée commence 0x14 octets AVANT var_30 ; cam = +0x14..+0x1F.
    preCamReadVariables_Space((char *)cam - 0x14);

    setSomeDword5(rot);                                 // 0x6A0972 lea edx,[var_38] ; 0x6A0976/0x6A0977
    Thunk_460860_480012();                              // 0x6A097C — GTE MVMVA-like 0x12, net pile 0

    // 0x6A0981 lea eax,[esp+64h+var_C] ; 0x6A0985 push eax ; 0x6A0986 call
    // -> dest = local var_C (3 dwords), PAS le bloc scratch blk.
    GteState_Get_1CA8A74(gte);                          // copie locale ensuite jamais relue dans ce frame

    // --- matrice 9 mots : diag(w+0x400, w+0x400, 0x1000) ---------------------
    // 0x6A098B mov ax,[esi+0Eh] (re-lecture de la phase) ; 0x6A0993 add ax,400h
    // (add 16 bits, wrap) ; stores WORD :
    //   0x6A0998 [var_18] = ax   -> m[4]   (même valeur, store AVANT var_20 dans l'ordre ASM)
    //   0x6A099D [var_20] = ax   -> m[0]
    //   0x6A09C5 [var_1E] = 0    -> m[1]
    //   0x6A09C0 [var_1C] = 0    -> m[2]
    //   0x6A09BB [var_1A] = 0    -> m[3]
    //   0x6A09B6 [var_16] = 0    -> m[5]
    //   0x6A09B1 [var_14] = 0    -> m[6]
    //   0x6A09AC [var_12] = 0    -> m[7]
    //   0x6A09A5 [var_10] = 1000h -> m[8]  (largeur WORD déduite : cf. UNCERTAIN)
    w2 = *(short *)(task + 0x0E);
    m[0] = (short)(w2 + 0x400);
    m[4] = m[0];
    m[1] = 0; m[2] = 0; m[3] = 0;
    m[5] = 0; m[6] = 0; m[7] = 0;
    m[8] = 0x1000;

    // 0x6A0997 push ecx (&m, arg2) ; 0x6A09A4 push ebp (obj+0x44, arg1) ;
    // 0x6A09CA call — c'est obj+0x44 qui va à sub_56C270, PAS &cam-0x14
    // (celui-ci ne va qu'à preCamReadVariables_Space, cf. 0x6A0961).
    sub_56C270(obj + 0x44, m);

    // 0x6A09CF lea edx,[var_20] ; 0x6A09D3 lea eax,[var_20] (même adresse) ;
    // 0x6A09D7 push edx (arg3) ; 0x6A09D8 push eax (arg2) ; 0x6A09D9 push offset dword_1D97778 (arg1)
    Mat_ComposeTwoThenCopy8(&dword_1D97778, m, m);

    // --- round 2 : relecture sur la matrice composée --------------------------
    Field_readCaPre(m);                                 // 0x6A09E3 lea ecx,[var_20] ; 0x6A09E7/0x6A09E8
    preCamReadVariables_Space(m);                       // 0x6A09ED lea edx,[var_20] ; 0x6A09F1/0x6A09F2

    // --- prim : init + chaînage OT --------------------------------------------
    *(int *)(blk + 0x1C) = 0x30;                        // 0x6A09F7 mov dword [ebx+1Ch],30h
    *(int *)blk = (int)&unk_117D360;                    // 0x6A09FE mov dword [ebx], offset unk_117D360
                                                        //   (l'ADRESSE est stockée, pas le contenu)

    // 0x6A0A04 mov eax,dword_2510194 ; 0x6A0A09 mov ecx,g_BattleOTBase ;
    // 0x6A0A0F push eax (arg4) ; 0x6A0A10 add ecx,44h ; 0x6A0A13 push 2 (arg3) ;
    // 0x6A0A15 push ecx (arg2) ; 0x6A0A16 push ebx (arg1) ; 0x6A0A17 call ;
    // 0x6A0A1F mov dword_2510194,eax (write-back)
    dword_2510194 = sub_572200(blk,
                               (char *)g_BattleOTBase + 0x44,   // add ecx,44h (Hex-Rays "+17" = ×4 ptr arith)
                               2,
                               dword_2510194);

    // --- cleanup cumulé : 19 pushes = 0x4C, soldés en UNE fois @0x6A0A1C ------
    // Liste complète en ordre ASM :
    //  0x6A08DB push 58h (bs_modulo)      0x6A08F7 push eax (Sin#1)
    //  0x6A0906 push ebp (Cos)            0x6A0918 push ebp (Sin#2)
    //  0x6A0942 push ebp (readCaPre r1)   0x6A0968 push ecx (preCam r1)
    //  0x6A0976 push edx (setSomeDword5)  0x6A0985 push eax (GteState)
    //  0x6A0997 push ecx (&m → sub_56C270 arg2)
    //  0x6A09A4 push ebp (obj+44h → sub_56C270 arg1)
    //  0x6A09D7 push edx (&m arg3)        0x6A09D8 push eax (&m arg2)
    //  0x6A09D9 push offset 1D97778 (arg1)
    //  0x6A09E7 push ecx (&m readCaPre r2) 0x6A09F1 push edx (&m preCam r2)
    //  0x6A0A0F push eax (dword_2510194)  0x6A0A13 push 2
    //  0x6A0A15 push ecx (OT+44h)         0x6A0A16 push ebx (blk)
    // = 19 pushes × 4 = 0x4C. add esp,4Ch @0x6A0A1C.
    // Hors solde : add esp,4 @0x6A0A35 (arg de BattleScratch_Unwind) ;
    // add esp,38h @0x6A0A4A (cadre) ; thunk 0x480012 net 0.

    BattleScratch_Unwind(0x58);                         // 0x6A0A24 push 58h ; 0x6A0A26 call ; 0x6A0A35 add esp,4 (cleanup SÉPARÉ)

    // --- avance de phase + retour stepper -------------------------------------
    // 0x6A0A2B add word ptr [esi+0Eh],80h — add 16 bits, wrap.
    *(short *)(task + 0x0E) += 0x80;
    // 0x6A0A31 mov si,[esi+0Eh] — re-lecture 16 bits dans si
    w2 = *(short *)(task + 0x0E);

    // 0x6A0A38 xor eax,eax ; 0x6A0A3A cmp si,1000h ; 0x6A0A3F setl al (SIGNÉ 16 bits) ;
    // 0x6A0A43 dec eax ; 0x6A0A46 and eax,2
    //   si <  0x1000 : setl -> eax=1, dec -> 0, and 2 -> 0
    //   si >= 0x1000 : setl -> eax=0, dec -> -1, and 2 -> 2
    return ((short)w2 < 0x1000) ? 0 : 2;
}

// ============================================================================
// UNCERTAIN 0x6A08E0 : sémantique complète de la paire bs_modulo(0x58) /
//   BattleScratch_Unwind(0x58) — alloc/libère scratch battle (bump
//   dword_1D999C4) confirmée par les commentaires pack, contenu du bloc
//   0x58 octets non prouvé depuis cet ASM seul.
// UNCERTAIN 0x6A09F7 : rôle de blk+0x1C = 0x30 et de l'ancre unk_117D360
//   (vtable / descripteur de primitive OT ?) — non prouvable ici.
// UNCERTAIN 0x6A09A5 : le listing n'affiche pas de size specifier pour
//   `mov [esp+70h+var_10],1000h` ; largeur WORD déduite de Hex-Rays (v22
//   __int16) et de la continuité 9xword var_20..var_10, non vérifiable
//   dans le listing seul.
// UNCERTAIN 0x6A0948 : effets de bord de Field_readCaPre /
//   preCamReadVariables_Space (retours ignorés aux 2 rounds) — l'état
//   global qu'ils alimentent n'est pas visible depuis cet ASM.
// UNCERTAIN 0x6A0986 : la copie GTE dans gte[3] (var_C..var_4) n'est jamais
//   relue dans ce frame — destination finale inconnue (consumée par un
//   callee via état global ? morte ?). Le `rep movsd 8 dwords` de
//   Mat_ComposeTwoThenCopy8 vers son arg pourrait recouvrir var_20..var_4,
//   mais ça se joue dans la sémantique du callee, non prouvable ici.
// UNCERTAIN 0x6A0A3F : la phase part-elle toujours de < 0x1000 et croît-elle
//   par pas de 0x80 sans wrap négatif (0x1000/0x80 = 32 frames) ? Si elle
//   wrappait en négatif, le setl signé rendrait 0 là où une lecture
//   unsigned rendrait 2 — comportement dépendant de l'initialiseur.
// UNCERTAIN 0x6A0A17 : signification de l'arg kind=2 et de l'entrée OT
//   g_BattleOTBase+0x44 dans sub_572200 (type de prim / sous-liste OT ?).
// ============================================================================
```

## Analyse semantique

# Sémantique sub_6A08D0 @ 0x6A08D0 (réconciliation R)

- **Rôle (1 phrase)** : step de rendu d'un effet magique générique — calcule un décalage « wobble + montée » (sin/cos Q12 + dérive proportionnelle à la phase) depuis le compteur `[esi+0Eh]`, le convertit en espace caméra, compose la matrice rotation-phase avec la matrice caméra globale, chaîne une primitive 0x58 octets dans l'OT battle groupe +0x44, avance la phase de +0x80 et retourne 0 tant que `(short)phase < 0x1000`, 2 sinon (tâche terminée, 32 ticks/cycle).
- **Verdict** : LIKELY consolidé.
- **Confiance** : LIKELY — callers + callees + opcodes alignés sur les deux voix, mais wiki.md du pack vide (échec qmd générateur) : barème CERTAIN non atteint faute de convergence wiki.
- **Nom catalogue** : aucun (sub_6A08D0).
- **Nom proposé (markdown seul, pas de rename)** : `MagFX_WobbleRise_DrawStep`
  - Synthèse mécanisme-ancrée de `MagFX_WobbleRise_TaskTick` (B) et `MagFX_SpiralSweep_DrawStep` (A) : le mécanisme mesuré à l'ASM est un wobble hélicoïdal sin/cos (A) + une dérive montante (B), et le comportement visible est une insertion de primitive dans l'OT (draw step), pas un appel direct de tâche. « TaskTick » de B niveau titre est acceptable mais « DrawStep » décrit le côté observable. Aucune spécialisation MAG213 n'est prouvée dans le corps (aucune constante 213, aucun hash de spell) — corps possiblement partagé, donc nom générique imposé mag-FX.
  - Justification ≥2 preuves ASM indépendantes adressées :
    1. **Wobble helicoidal + rise** : 0x6A08EB–0x6A0943 — `bp=[edi+2Ah]+[esi+0Eh]` (0x6A08EF), `s8=(short)(Sin4096(w>>1)>>3)` (0x6A08F5–0x6A0903), `rot[0]=Cos(ang)·s8>>0Ch` (0x6A090B–0x6A0919), `rot[1]=−Sin(ang)·s8>>0Ch` (0x6A091E–0x6A0931, `neg` 0x6A092C AVANT `sar 0Ch` 0x6A092E), `rot[2]=[edi+30h](dword)·w>>0Ch` (0x6A0936–0x6A0943, edx = sext de `w` brute 0x6A0928, pas de la somme) → hélice + montée linéaire.
    2. **Draw step / insertion OT battle** : 0x6A09F7–0x6A0A1F — `dword [ebx+1Ch]=30h` (0x6A09F7), `dword [ebx]=unk_117D360` (0x6A09FE), pushes droite→gauche puis `dword_2510194 = sub_572200(ebx, g_BattleOTBase+0x44, 2, dword_2510194)` (0x6A0A04–0x6A0A1F) avec tête chaînée écrite en retour.
    3. (appui) **Contrat stepper** : `add word ptr [esi+0Eh],80h` (0x6A0A2B) ; `mov si,[esi+0Eh]` ; `cmp si,1000h` ; `setl al` (0x6A0A3A–0x6A0A3F, signé) ; `dec eax` ; `and eax,2` (0x6A0A43–0x6A0A46) → {0,2}.

## In / Out / Effets

**In** (cdecl, 1 arg) :
- `arg_0` (esi) = contexte tâche FX : `word [esi+0x0E]` = compteur de phase (+0x80/tick, borné 0x1000) ; `[esi+0x14/0x18/0x1C]` = translation lue par Mat_ComposeTwoThenCopy8 ; `[esi+0x10]` → edi = descripteur source/entité : `word [edi+0x2A]` angle de base, `dword [edi+0x30]` taux de montée Q12, `word [edi+0x34/0x36/0x38]` position, `[edi+0x44]` bloc camera-pre (ebp conservé jusqu'à sub_56C270).

**Out** :
- Retour `eax` ∈ {0, 2} 32 bits pleins (`xor eax,eax ; setl al ; dec eax ; and eax,2`, 0x6A0A38–0x6A0A46) : 0 = continuer (`(short)phase < 0x1000`, setl SIGNÉ), 2 = fini. Effective AL par construction, mais valeur pleine EAX ∈ {0,2}.
- Mutations : `dword_2510194` = nouvelle tête OT (0x6A0A1F) ; primitive scratch 0x58 insérée ( nhóm `[ebx]`, `[ebx+1Ch]`) ; bump `dword_1D999C4` via BattleScratch_Unwind ; `word [esi+0x0E] += 0x80` (wrap 16 bits).

**Effets** :
- Alloc/libère symétrique `bs_modulo(0x58)` @0x6A08E0 ↔ `BattleScratch_Unwind(0x58)` @0x6A0A26 (frame temporaire, solde `add esp,4` séparé 0x6A0A35).
- Offset 3 mots {wobble X, wobble −Y, rise Z} en var_38/36/34.
- `Field_readCaPre(obj+0x44)` (0x6A0948) puis `preCamReadVariables_Space(&var_30−0x14)` (0x6A096D) round 1 — conversion espace caméra depuis position obj+0x34/36/38.
- `Thunk_460860_480012` (0x6A097C, MVMVA-like 0x12) ; `GteState_Get_1CA8A74(&var_C..var_4)` @0x6A0986 (jamais relu dans ce frame).
- Matrice locale 9 mots : m[0]=m[4]=phase+0x400 (wrap 16 bits, add 0x6A0993 sur la phase re-relu 0x6A098B), m[8]=0x1000 @0x6A09A5 (var_10, pas var_12), le reste 0 ; `sub_56C270(obj+0x44, m)` @0x6A09A4–0x6A09CA.
- `Mat_ComposeTwoThenCopy8(dword_1D97778, &m, &m, [esi+14/18/1C])` @0x6A09CF–0x6A09DE — composition caméra globale + translation tâche.
- Round 2 : `Field_readCaPre(&m)` @0x6A09E8 + `preCamReadVariables_Space(&m)` @0x6A09F2.
- Cleanup : un seul `add esp,4Ch` @0x6A0A1C pour les 19 pushes cdecl cumulés (arg BattleScratch_Unwind soldé à part par `add esp,4` 0x6A0A35 ; cadre `add esp,38h` 0x6A0A4A ; thunk net 0).

## Divergences A/B tranchées (une par une, preuve ASM adressée)

1. **Nom — SpiralSweep_DrawStep (A) vs WobbleRise_TaskTick (B).** A et B décrivent le MÊME mécanisme sous deux angles (trajectoire vs contrat). Tranché : **synthèse `MagFX_WobbleRise_DrawStep`**, fondée sur les champs ASM réels (sin/cos Q12 + shift Q12 sur un dword rate @0x6A0936, pas une vraie spirale 3D paramétrique ; pas de preuve de spécialisation MAG213 dans le corps). Preuves : 0x6A091E–0x6A0943 (wobble+rise) et 0x6A09FE–0x6A0A1F (prim OT).
2. **`[ebx]` = unk_117D360 vs dword_1D97778 (B)** — Tranché **A** : 0x6A09FE `mov dword ptr [ebx], offset unk_117D360`, littéral explicite. B avait collé la mauvaise globale (confusion avec dword_1D97778 de Mat_ComposeTwoThenCopy8 @0x6A09D9).
3. **destination GteState_Get (B)** — Tranché **A** : 0x6A0981 `lea eax,[esp+64h+var_C]` ; la destination est le local var_C/var_8/var_4, JAMAIS relu dans ce frame. B avait écrit `&prim[0]` — aucun lien ASM vers ebx.
4. **Index matrice 0x1000 : var_10 = m[8] (A) vs var_12 = m[7] (B)** — Tranché **A** : 0x6A09A5 `mov [esp+70h+var_10], 1000h` ; continuité 9×word var_20..var_10 fixe la cartographie. B a confondu le var_12 mis à zéro à 0x6A09AC (`xor eax,eax` puis `mov [var_12],ax`).
5. **Mixte rot[] depuis w brute vs ang (base+phase)** — Tranché (les deux voix déjà conformes, confirmé ASM) : `rot[0]`/`rot[1]` utilisent `ebp = (word)([edi+2A] + [esi+0E])` wrappé (0x6A08E5/0x6A08EF/0x6A0900), `rot[2]` utilise edx = sext de `[esi+0E]` brute (0x6A0928→0x6A0939).
6. **Wrap 16 bits de la somme d'angle** — Tranché **B** : opérande 16 bits `add bp,ax` @0x6A08EF puis `movsx ebp,bp` @0x6A0900 (sext du résultat wrappé). La formulation int-C de A masqait le wrap.
7. **Largeur retour** — Tranché : setl construit AL puis le traitement `dec ; and 2` propage sur EAX entier ; la valeur effective est {0,2}. A disait « AL-only donc non » ; B disait « AL conforme ». Tranché sur la chaîne ASM 0x6A0A38–0x6A0A46 : c'est EAX ∈ {0,2} porté par AL (pré-`and`). Pas une vraie divergences sémantique.

## Preuves (ASM cité)

1. **0x6A08DB–0x6A08E0 + 0x6A0A24–0x6A0A26** : `push 58h; call bs_modulo` … `push 58h; call BattleScratch_Unwind` — va-et-vient scratch 0x58 octets.
2. **0x6A08E5–0x6A0943** : wobble/rise Q12 — `mov bp,[edi+2A]`+`add bp,ax` (wrap), `sar 1` (0x6A08F5), `sar 3` (0x6A08FD), imul signés, `neg` @0x6A092C AVANT `sar 0Ch` @0x6A092E, `mov eax,[edi+30h];imul eax,edx;sar 0Ch` @0x6A0936–0x6A093F.
3. **0x6A093C–0x6A096D** : `lea ebp,[edi+44h]` → `Field_readCaPre(obj+0x44)` @0x6A0948 ; `lea ecx,[var_30];sub ecx,14h` → `preCamReadVariables_Space(&var_30−0x14)` @0x6A096D.
4. **0x6A098B–0x6A09CA** : matrice locale — `add ax,400h` @0x6A0993 sur phase re-relu @0x6A098B, m[0]=m[4]=phase+0x400, m[8]=0x1000 @0x6A09A5, zéros @0x6A09AC–0x6A09C5, `sub_56C270(ebp=obj+0x44, &m)` @0x6A09CA.
5. **0x6A09CF–0x6A09DE** : `Mat_ComposeTwoThenCopy8(dword_1D97778, &m, &m, [esi+14/18/1C])` — composition caméra globale + translation tâche, rep movsd 8 dwords.
6. **0x6A09F7–0x6A0A1F** : `dword [ebx+1Ch]=30h`, `dword [ebx]=unk_117D360`, `dword_2510194 = sub_572200(ebx, g_BattleOTBase+0x44, 2, dword_2510194)` — insertion prim OT groupe +0x44, tête chaînée write-back.
7. **0x6A0A2B–0x6A0A46** : `add word ptr [esi+0Eh],80h` (wrap) ; `mov si,[esi+0Eh]` ; `cmp si,1000h` ; `setl al` (signé, SF≠OF) ; `dec eax` ; `and eax,2` — retour {0,2}, 32 ticks/cycle.
8. **Caller** : xref data 0x69FAB3 dans `sub_69EF60` (pointeur dans stepper MAG213, dword_2510194, wobble si (op−0x19)%4==0) — contrat stepper/tâche, pas appel direct.

## Checks §5.6

- **Callees cités ⊆ callees.txt** : oui — bs_modulo, Fixed_Sin4096_Q12 (×2), Fixed_Cos4096_Q12, Field_readCaPre (×2), preCamReadVariables_Space (×2), setSomeDword5, Thunk_460860_480012, GteState_Get_1CA8A74, sub_56C270, Mat_ComposeTwoThenCopy8, sub_572200, BattleScratch_Unwind. Aucun call inventé.
- **Caller ⊆ callers.txt** : oui — sub_69EF60 via xref data 0x69FAB3, `more: false`.
- **Strides en nombres** : 0x0E, 0x10, 0x14/0x18/0x1C (tâche) ; 0x2A, 0x30, 0x34/0x36/0x38, 0x44 (descripteur) ; 0x1C, 0x00 (prim 0x58) ; OT +0x44 — tous littéraux, pas de stride Hex-Rays faux.
- **Polarités signées** : `sar` (Q12) partout, `imul` signé, `neg` avant `sar 0Ch` sur la compo Y, `setl` = comparaison signée 16 bits (`cmp si,1000h`), aucun `ja/jb/jg/jl` indu (pas de comparaison non signée).
- **Largeur retour** : chaîne `xor/setl al/dec/and 2` → EAX ∈ {0,2}, AL porteur, valeur pleine EAX ; conforme contrat stepper.
- **Nom ≥2 preuves ASM indépendantes adressées** : oui (preuve 2 wobble/rise ; preuve 6 prim OT).
- **wiki.md vide** (échec qmd générateur) → divergence wiki NON évaluable dans le pack → plafonne à LIKELY (pas CERTAIN).

## Questions ouvertes (non bloquantes)

- Sémantique complète de `bs_modulo`/`BattleScratch_Unwind(0x58)` et du bloc 0x58 (layout de la primitive, rôle de `unk_117D360` : descripteur/vtable ?) — UNCERTAIN assumé.
- Rôle de `blk+0x1C = 0x30` (taille de bloc / code couleur / nombre d'éléments) et de l'arg kind=2 de `sub_572200` — non tranchable depuis l'ASM seul.
- Largeur réelle du store `mov [var_10],1000h` @0x6A09A5 — size specifier absente du listing ; WORD déduit de la continuité 9×word et de Hex-Rays (v22 __int16).
- Effets de bord non visibles de `Field_readCaPre`/`preCamReadVariables_Space` (retours ignorés aux 2 rounds) et destination finale de la copie GTE vers var_C..var_4 (jamais relue in-frame).
- Initialisation de la phase : un wrap négatif donnerait `setl` = 0 là où une lecture unsigned donnerait 2 — dépend du setter initial non visible ici.
- Corps possiblement partagé avec d'autres stepping MAG (absence de constante 213 dans le corps) — à confirmer par croisement sur d'autres entrées de table de `sub_69EF60`.

## IDBCOMMENT

Tache d'effet magique enregistree par le stepper 69EF60 : calcule un decalage wobble helicoidal (sin/cos Q12) plus une montee proportionnelle a la phase depuis le compteur esi+0E, convertit en espace camera et compose la matrice globale 1D97778. Alloue une primitive de 58 en scratch battle, la chaine dans l'OT g_BattleOTBase+44 via dword_2510194 et l'enregistre par sub_572200, puis libere le scratch. Matrice locale a echelle XY = phase+400 et m[8]=1000 (1.0 Q12) appliquee au bloc camera-pre edi+44. Retour AL : 0 tant que la phase (comparaison signee 16 bits) reste sous 1000h, 2 sinon, soit 32 pas de 80h par cycle. [semantic-triple 2026-09-20]

## Notes C-R

# Notes de réconciliation — sub_6A08D0 (cellule C-R, triple 2+1)
#
# Ground truth : asm.asm (113 instr, live ASM). A, B = c_a.c / c_b.c.
# Hex-Rays (hexrays.c) : vérificateur SEUL.

## Divergences tranchées contre l'ASM

1. **Somme d'angle — wrap 16 bits vs C non-wrappé (c_a ligne 43).**
   A : `ang_base = *(short *)(entity+0x2A) + ang;` (arithmétique int C, pas de wrap 16 bits).
   B : `ang = (short)((unsigned short)w + (unsigned short)base);` (wrap explicite).
   **Tranché : B.** Preuve : 0x6A08E5 `mov bp,[edi+2Ah]` + 0x6A08EB `mov ax,[esi+0Eh]` + 0x6A08EF `add bp,ax` (opérande 16 bits → wrap modulo 2^16) puis 0x6A0900 `movsx ebp,bp` (sext du résultat wrappé). La formulation de A masque le wrap ; un `base_w + w` C sur int ne wrappera jamais pareil pour des valeurs extrêmes.

2. **Trig — ordre et polarité exacts.**
   A et B d'accord sur la structure ; vérifié ligne à ligne :
   - Sin#1 arg : 0x6A08F2 `movsx eax,ax` (sext de w AVANT shift) ; 0x6A08F5 `sar eax,1` (ARITHMÉTIQUE) ; 0x6A08F8 call ; 0x6A08FD `sar eax,3` ; 0x6A0903 `movsx ecx,ax` (re-sext 16 bits du `sin>>3`) → `s8 = (short)(Fixed_Sin4096_Q12(w >> 1) >> 3)`. A et B conformes.
   - rot[0] : 0x6A0906 push ang ; 0x6A090B call Cos ; 0x6A0910 `imul eax,s8` (signé) ; 0x6A0915 `sar eax,0Ch` ; store WORD 0x6A0919. Conforme A et B.
   - rot[1] : 0x6A091E call Sin(ang) ; 0x6A0923 `imul eax,s8` ; 0x6A092C `neg eax` **avant** 0x6A092E `sar eax,0Ch` → `(-(s8*Sin)) >> 12`. Les deux voix conformes ; le point "neg AVANT sar" du mandat est respecté dans les deux, repris tel quel.
   - rot[2] : 0x6A0936 `mov eax,[edi+30h]` (DWORD) ; 0x6A0939 `imul eax,edx` où edx = `movsx word [esi+0Eh]` @0x6A0928 = **phase w brute**, pas la somme ang ; 0x6A093F `sar eax,0Ch`. Conforme A et B (les deux utilisent w, correct).

3. **Matrice 9 mots — stores exacts.**
   A : 9 mots `mtx[0..8]`, `mtx[8]=0x1000`, zéros aux 7 autres — correct sauf UNCERTAIN sur la largeur du store 0x1000.
   B : déclare `short m[8]` mais commente var_10=0x1000 comme 7e zéro (`m[7]=0x1000>>0` ligne 106 place 0x1000 en var_12 si on lit littéralement) — **bug d'indexation de B**.
   **Tranché : cartographie A** (var_20=m[0], var_1E=m[1], var_1C=m[2], var_1A=m[3], var_18=m[4], var_16=m[5], var_14=m[6], var_12=m[7], var_10=m[8]) :
   - 0x6A0998 `[var_18]=ax` → m[4] = w+0x400 ; 0x6A099D `[var_20]=ax` → m[0] = w+0x400 (même valeur, ordre ASM var_18 avant var_20).
   - 0x6A09C5/C0/BB → m[1]=m[2]=m[3]=0 ; 0x6A09B6/B1/AC → m[5]=m[6]=m[7]=0.
   - 0x6A09A5 `[var_10]=1000h` → m[8] = 0x1000 (et PAS var_12 = 0 comme le suggère littéralement B).
   - `add ax,400h` @0x6A0993 est un add 16 bits (wrap) sur la phase re-relu @0x6A098B.

4. **obj+0x44 vs base &cam-0x14 — quel pointeur va où.**
   Les deux voix avaient raison chacune de son côté mais le mandat demandait de trancher explicitement :
   - 0x6A093C `lea ebp,[edi+44h]` ; 0x6A0942 push ebp ; 0x6A0948 call → **Field_readCaPre(obj+0x44)** (round 1). ebp est conservé jusqu'à 0x6A09A4.
   - 0x6A0955 `lea ecx,[var_30]` ; 0x6A0961 `sub ecx,14h` ; 0x6A0968 push ecx ; 0x6A096D call → **preCamReadVariables_Space(&var_30 - 0x14)** ; var_30/2C/28 (word obj+0x34/36/38 movsx) occupent +0x14/+0x18/+0x1C de la struct englobante.
   - 0x6A0997 push &m (arg2) ; 0x6A09A4 push ebp=obj+0x44 (arg1) ; 0x6A09CA call → **sub_56C270(obj+0x44, m)**. C'est obj+0x44 (pointeur dans l'entité), pas &cam-0x14 (stack).
   Tranché conformément aux deux voix, désormais explicite et adresé.

5. **Prim OT — 4 args et write-back.**
   A et B concordent ; vérifié : 0x6A0A04 `mov eax,dword_2510194` ; 0x6A0A09 `mov ecx,g_BattleOTBase` ; pushes droite→gauche 0x6A0A0F (eax, arg4), 0x6A0A13 (2, arg3), 0x6A0A15 (ecx, arg2), 0x6A0A16 (ebx, arg1) ; 0x6A0A17 `call sub_572200` ; 0x6A0A1F `mov dword_2510194,eax` (write-back).
   → `dword_2510194 = sub_572200(blk, g_BattleOTBase+0x44, 2, dword_2510194)`. Le `+17` de Hex-Rays = arithmétique de pointeurs int* (17×4 = 0x44 octets), pas une divergence.
   **Correction de B au passage** : 0x6A09FE est `mov dword [ebx], offset unk_117D360` — B avait écrit `*prim = &dword_1D97778` (mauvaise globale ; l'ASM stocke l'adresse de **unk_117D360**). A était correct.

6. **Cleanup cumulé — 19 pushes, add esp,4Ch + add esp,4.**
   Compte fait depuis asm.asm : **19 pushes** × 4 = 0x4C, soldés en un seul `add esp,4Ch` @0x6A0A1C :
   0x6A08DB (58h, bs_modulo), 0x6A08F7 (Sin#1), 0x6A0906 (Cos), 0x6A0918 (Sin#2), 0x6A0942 (readCaPre r1), 0x6A0968 (preCam r1), 0x6A0976 (setSomeDword5), 0x6A0985 (GteState), 0x6A0997 (&m → sub_56C270 arg2), 0x6A09A4 (obj+44h → arg1), 0x6A09D7/0x6A09D8/0x6A09D9 (Mat_ComposeTwoThenCopy8), 0x6A09E7 (readCaPre r2), 0x6A09F1 (preCam r2), 0x6A0A0F (dword_2510194), 0x6A0A13 (2), 0x6A0A15 (OT+44h), 0x6A0A16 (blk).
   Hors solde : `add esp,4` @0x6A0A35 pour l'arg de BattleScratch_Unwind (pushé @0x6A0A24) ; `add esp,38h` @0x6A0A4A = cadre. Le thunk Thunk_460860_480012 est net 0 (push 0x480012 + pop ecx dans le thunk).
   Les 19 pushes listés par A concordent (vérifié un à un). B concordait aussi mais sans la liste.
   Point subtil confirmé : `mov [esp+54h+arg_0],ecx` @0x6A0907 écrit s8 dans le **slot arg_0 entrant** (réutilisation de pile après `mov esi,[esp+44h+arg_0]` @0x6A08D6) — local déguisé, pas un 2e paramètre (Hex-Rays v24 [ebp+4h] le confirme).

7. **Retour — cmp si,0x1000 ; setl → 0/2 (16 bits signé).**
   0x6A0A2B `add word ptr [esi+0Eh],80h` (wrap 16 bits) ; 0x6A0A31 `mov si,[esi+0Eh]` ; 0x6A0A38 `xor eax,eax` ; 0x6A0A3A `cmp si,1000h` ; 0x6A0A3F `setl al` (**signé**, SF≠OF) ; 0x6A0A43 `dec eax` ; 0x6A0A46 `and eax,2`.
   → `(short)w2 < 0x1000 ? 0 : 2`. Les deux voix concordaient ; repris tel quel avec la chaîne xor/setl/dec/and documentée (le `and eax,2` transforme 1→0 et 0−1→2).

## Corrections apportées à B (bugs trouvés)

- **0x6A0986** : B écrivait `GteState_Get_1CA8A74(&prim[0])` — l'ASM pousse `lea eax,[esp+64h+var_C]` (0x6A0981) : destination = **local var_C/var_8/var_4**, jamais relui dans ce frame. Corrigé en `gte[3]` local.
- **0x6A09FE** : B écrivait `*prim = &dword_1D97778` — l'ASM stocke `offset unk_117D360`. Corrigé.
- **0x6A09A5** : cartographie matrice de B plaçait 0x1000 en var_12 (`m[7]`) — tranché var_10 = m[8] = 0x1000, var_12 = 0 (voir point 3).

## Corrections apportées à A

- **0x6A08EF** : A modélisait `base + ang` sans wrap 16 bits — corrigé avec l'arithmétique `(unsigned short)` explicite (voir point 1).
- Mineur : A déclarait `mtx[9]` mais écrivait les indices 1..8 avec des commentaires var_1E..var_10 corrects ; repris tel quel, cartographie validée contre l'ASM.

## UNCERTAIN restants

- **UNCERTAIN 0x6A08E0** : sémantique complète bs_modulo(0x58)/BattleScratch_Unwind(0x58) — paire alloc/libère (bump dword_1D999C4) confirmée par commentaires pack ; contenu du bloc 0x58 octets non prouvé.
- **UNCERTAIN 0x6A09F7** : rôle de `blk+0x1C = 0x30` et de l'ancre `unk_117D360` (vtable/descripteur de prim OT ?).
- **UNCERTAIN 0x6A09A5** : largeur du store `mov [esp+70h+var_10],1000h` — le listing n'affiche pas de size specifier ; WORD déduit de Hex-Rays (v22 __int16) et de la continuité 9×word var_20..var_10, non vérifiable dans le listing seul.
- **UNCERTAIN 0x6A0948** : effets de bord Field_readCaPre / preCamReadVariables_Space (retours ignorés aux 2 rounds) ; état global alimenté non visible.
- **UNCERTAIN 0x6A0986** : la copie GTE dans gte[3] (var_C..var_4) n'est jamais relue dans ce frame — destination finale inconnue (consumée par callee via état global ? morte ?). Le `rep movsd 8 dwords` de Mat_ComposeTwoThenCopy8 vers son arg pourrait recouvrir var_20..var_4, mais ça se joue dans la sémantique du callee, non prouvable ici.
- **UNCERTAIN 0x6A0A3F** : initialisation de la phase (part-elle toujours de < 0x1000 ?) — si elle wrappait en négatif, setl signé rendrait 0 là où une lecture unsigned rendrait 2.
- **UNCERTAIN 0x6A0A17** : signification de l'arg kind=2 et de l'entrée OT g_BattleOTBase+0x44 dans sub_572200.

## Divergences vs Hex-Rays

1. **Retour (0x6A0A3A/0x6A0A3F)** : Hex-Rays `*(_WORD *)(a1+14) < 4096 ? 0 : 2` — lecture 16 bits ; l'ASM est `cmp si,1000h` + `setl` = comparaison **signée** 16 bits après chargement dans si. Identique tant que la phase reste ≥ 0 ; un wrap négatif donnerait 0 (ASM signé) vs 2 (si lue unsigned). Ground truth = setl signé.
2. **g_BattleOTBase + 17** : notation d'arithmétique de pointeurs (int* × 17 = +0x44 octets). L'ASM est `add ecx,44h` @0x6A0A10 — pas une divergence sémantique, écrit `+ 0x44` en C.
3. **v9[3] BYREF** : Hex-Rays passe `v9` (ebp-44h) à preCamReadVariables_Space sans modéliser le `sub ecx,14h` — la vraie base est `&var_30 - 0x14` ; v12/v13/v14 (obj+0x34/36/38) en sont les champs +0x14/+0x18/+0x1C. Hex-Rays perd la struct englobante.
4. **v24 [ebp+4h]** : Hex-Rays le déclare comme variable au-dessus du frame — c'est le slot arg_0 entrant réutilisé comme local (store @0x6A0907). Pas un 2e paramètre.
5. **Nettoyage pile** : Hex-Rays masque l'accumulation des 19 pushes cdecl ; l'ASM les solde en un `add esp,4Ch` @0x6A0A1C + `add esp,4` séparé @0x6A0A35 (BattleScratch_Unwind).
6. **Matrice** : Hex-Rays modélise v15 (var_20, int = 2 mots) + v16..v22 en __int16 — cohérent avec la cartographie 9 mots retenue ; pas de divergence, juste une présentation éclatée.
