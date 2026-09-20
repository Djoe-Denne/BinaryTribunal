# Battle_MagicFX_Type1_SpawnTimedTask @ 0x6A3510

- Instr (live): 84 (373 o, 0x6A3510-0x6A362C)
- Palier: 2+1
- Verdict: LIKELY - hook type '1' de l'emetteur 0x6A2B80 (ferme LIKELY) : cap 0x20 taches (cmp dword [arg_0+4],20h jge @0x6A3515-19, retour arg_0), enregistre sub_6A3630 via BdLinkTask_Register(&dword_2510218) @0x6A351F-29 (echec -> retour 0 @0x6A3535), thunk sub_56CB50 5 args cdecl (base+row[w+28h]*8, base+row[w+2Ah]*8, 0x1000-w26, movsx w26, task+0xC) @0x6A3559-81 soldes add esp,14h @0x6A358C, init task (+0x0E/+14h/+16h = 0, +0x0C = delta 2510278+148h, +0x10 = delta +14Ch en lecture seule, +0x12 = 90+-rand&3F selon w+2, +0x19 = 1Eh, +0x20 = rand<<12>>15 +800h, +0x1C-1F = 4 rand) ; retour EAX = dernier rand() 32 bits (AL seul stocke a +1Fh)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A3510\nTYPE ; proposition: Battle_MagicFX_Type1_SpawnTimedTask
- Notes parent: checks 5.6 OK : cap cmp dword/jge (0x6A3515-19), Register sub_6A3630 (0x6A351F-29), jz echec (0x6A3535), pushes thunk (0x6A3559-81) + add esp,14h (0x6A358C), globals +148h/+14Ch LECTURE SEULE (0x6A358F/A8), rand -> mov al,+1Fh -> retn (0x6A3623-2C, eax non altere), caller unique 0x6A2B80 @0x6a2ee6 ; C-R : c_b rattrapage convergent, globals PAS decrementees en memoire

## C reconcilie

```c
/* c_reconciled.c — sub_6A3510 réconcilié (voix A × B × Hex-Rays, tranché contre l'ASM live).
 * Ground truth = live ASM (asm.asm, 84 instr, 0x6A3510..0x6A362C) + ida_dump_bytes, PAS Hex-Rays.
 * EA 0x6A3510 — taille 285 (0x11D). Type IDA : int __cdecl sub_6A3510(int, __int16 *, int)
 * Sauvegardes de registres : esi (push 6a3514 / pop 6a362b) ;
 *   ebx/ebp/edi push 6a353f-6a3541 / pop 6a35ca-6a35cc (branche principale uniquement).
 * Pas de frame ebp : args via [esp+n] recalés. cdecl prouvé : add esp,8 (6a3530),
 *   add esp,14h (6a358c), retn nu (6a362c) — caller cleanup.
 */

/* externes — cibles prouvées par asm.asm / callees.txt. Aucun library call inventé
 * (rand = _rand, seul symbole CRT présent dans l'ASM : 7 sites d'appel). */
extern int           dword_2510218;   /* 0x2510218 : list_head BdLinkTask (globals.txt) */
extern int           dword_2510278;   /* 0x2510278 : singleton battle — WORDs +0x148/+0x14C LUS SEULEMENT */
extern unsigned char unk_11AC200;     /* 0x11AC200 : table d'octets, rangée stride 0x20 (shl eax,5 @6a3561) */
extern int           sub_6A3630;      /* 0x6A3630 : callback enregistré (push offset @6a351f) */
extern int  __cdecl BdLinkTask_Register(void *list_head, void *callback); /* 2 args : add esp,8 @6a3530 */
extern int  __cdecl Thunk_56CB50(int a1, int a2, int a3, int a4, int a5); /* thunk E3b -> sub_56CB50 ; 5 args : add esp,14h @6a358c */
extern int  __cdecl rand(void);       /* _rand CRT */

int __cdecl sub_6A3510(int arg_0, short *arg_4, int arg_8)
{
    int            handle;  /* esi : descripteur tâche BdLink renvoyé par BdLinkTask_Register */
    short         *out;     /* edi : arg_4, struct émetteur (mots +0x02, +0x26, +0x28, +0x2A) */
    unsigned char *st;      /* ebx : esi+0x0C, zone d'état FX (champs 0x0C..0x21) */
    int            ebp;     /* [arg_8+4] : base slots, stride 8 */
    unsigned char *row;     /* rangée unk_11AC200 + 0x20*(short)word[out+2] */
    int            w26;     /* (short)word[out+0x26] — movsx WORD signé COMPLET */
    int            idx28, idx2A;
    int            a1, a2;  /* handles slots base+byte*8 */
    short          cx;
    unsigned int   rnd;
    int            zero;

    handle = arg_0;                                     /* 6a3510 mov eax,[esp+arg_0] — eax=arg_0, jamais réécrit avant l'early-exit */

    /* Garde cap : 6a3515 cmp DWORD ptr [eax+4], 20h ; 6a3519 jge — DWORD, SIGNED (jge = SF=OF).
     * NB : la consigne disait "(s8)" — l'ASM est formel : dword 32 bits signé. */
    if (*(int *)(handle + 4) >= 0x20)
        return handle;                                  /* 6a362b/6a362c : eax = arg_0 (inchangé) */

    /* 6a351f push offset sub_6A3630 (arg2) ; 6a3524 push offset dword_2510218 (arg1)
     * 6a3529 call BdLinkTask_Register ; 6a3530 add esp,8 (cdecl, 2 args) */
    handle = BdLinkTask_Register(&dword_2510218, &sub_6A3630);
    if (handle == 0)                                    /* 6a3533 test esi,esi ; 6a3535 jz */
        return 0;                                       /* eax = 0 (valeur de retour de Register) */

    /* --- branche principale 6a353b..6a3628 (push ebx/ebp/edi 6a353f-6a3541) --- */
    out = arg_4;                                        /* 6a3542 mov edi,[esp+10h+arg_4] */
    ebp = *(int *)(arg_8 + 4);                          /* 6a3546 mov ebp,[edx+4] */
    st  = (unsigned char *)handle + 0x0C;               /* 6a3549 lea ebx,[esi+0Ch] */

    w26   = out[0x13];                                  /* 6a3551 movsx ecx, word ptr [edi+26h] — WORD signé COMPLET, pas byte */
    /* 6a354c mov edx,1000h ; 6a355b sub edx,ecx -> 0x1000 - w26 */

    idx2A = out[0x15];                                  /* 6a355d movsx ecx, word ptr [edi+2Ah] — index signé 32 bits, PAS de masque &0xFF */
    /* 6a3555 movsx eax, word ptr [edi+2] ; 6a3561 shl eax,5 (LOGIQUE) ; 6a3564 add eax, offset unk_11AC200 */
    row   = &unk_11AC200 + (((int)out[1]) << 5);        /* rangée stride 0x20 indexée par (short)word[out+2] */
    idx2A = row[idx2A];                                 /* 6a356a xor edx,edx ; 6a356c mov dl,[ecx+eax] — octet ZÉRO-ÉTENDU */
    a2    = ebp + idx2A * 8;                            /* 6a356f lea ecx,[ebp+edx*8] */

    idx28 = out[0x14];                                  /* 6a3573 movsx edx, word ptr [edi+28h] */
    idx28 = row[idx28];                                 /* 6a3578 xor ecx,ecx ; 6a357a mov cl,[edx+eax] — octet zéro-étendu */
    a1    = ebp + idx28 * 8;                            /* 6a357d lea edx,[ebp+ecx*8] */

    /* Ordre de push réel (dernier push = arg1, cdecl droite->gauche) :
     *   6a3559 push ebx           -> arg5 = esi+0x0C
     *   6a355a push ecx (w26)     -> arg4 = movsx WORD [edi+26h]
     *   6a3569 push edx           -> arg3 = 0x1000 - w26
     *   6a3577 push ecx           -> arg2 = ebp + row[w[out+2A]]*8
     *   6a3581 push edx           -> arg1 = ebp + row[w[out+28]]*8
     * 6a3582 call Thunk_56CB50 ; 6a358c add esp,14h (5 args) */
    Thunk_56CB50(a1, a2, 0x1000 - w26, w26, (int)st);

    /* --- init champs esi+0x0C..0x20 ; ordre EXACT des stores --- */
    cx   = *(short *)(dword_2510278 + 0x148);           /* 6a358f mov cx,[eax+148h] — Lecture SEULE, pas d'écriture au global */
    zero = 0;                                           /* 6a3596 xor eax,eax */
    cx  -= *(short *)st;                                /* 6a3598 sub cx,[ebx] — lit l'ANCIEN [esi+0x0C] (alloué par Register, non initialisé ici) */
    *(short *)((unsigned char *)handle + 0x0E) = (short)zero; /* 6a359b mov [esi+0Eh],ax */
    *(short *)st = cx;                                  /* 6a359f mov [ebx],cx — +0x0C = [global+0x148] - ancien */

    cx = *(short *)(dword_2510278 + 0x14C);             /* 6a35a2 mov edx,dword_2510278 ; 6a35a8 mov cx,[edx+14Ch] */
    *(int *)((unsigned char *)handle + 0x18) = zero;    /* 6a35af mov [esi+18h],eax — dword 0x18..0x1B = 0 */
    cx -= *(short *)((unsigned char *)handle + 0x10);   /* 6a35b2 sub cx,[esi+10h] — lit l'ANCIEN +0x10 */
    *(unsigned char *)((unsigned char *)handle + 0x19) = 0x1E; /* 6a35b6 — ANCRE : écrase le byte 1 du dword 0x18 */
    *(short *)((unsigned char *)handle + 0x14) = (short)zero; /* 6a35ba */
    *(short *)((unsigned char *)handle + 0x16) = (short)zero; /* 6a35be */
    *(short *)((unsigned char *)handle + 0x10) = cx;    /* 6a35c2 — +0x10 = [global+0x14C] - ancien */
    /* NB final : dword @+0x18 = 0x0A1E0000 (0x1B=0x0A sera écrit plus bas, 6a35f3). */

    /* 6a35c6 cmp word ptr [edi+2], ax (ax==0) ; pops edi/ebp/ebx 6a35ca-cc ; 6a35cd jnz — polarité selon word[out+2] */
    if (out[1] != 0)
    {
        rnd  = (unsigned)rand();                        /* 6a35e4 call _rand */
        rnd &= 0x3F;                                    /* 6a35e9 and eax,3Fh */
        rnd += 0x5A;                                    /* 6a35ec add eax,5Ah */
        *(short *)((unsigned char *)handle + 0x12) = (short)rnd; /* 6a35ef — +0x12 = 0x5A + (rand&0x3F) */
    }
    else
    {
        rnd  = (unsigned)rand();                        /* 6a35cf call _rand */
        rnd &= 0x3F;                                    /* 6a35d4 and eax,3Fh */
        rnd  = 0xFFFFFFA6u - rnd;                       /* 6a35d7 mov edx,0FFFFFFA6h ; 6a35dc sub — montage signé -90 - (rand&0x3F) */
        *(short *)((unsigned char *)handle + 0x12) = (short)rnd; /* 6a35de — store WORD bas signé */
    }

    *(unsigned char *)((unsigned char *)handle + 0x1B) = 0x0A; /* 6a35f3 — byte 3 du dword 0x18 */

    rnd = (unsigned)rand();                             /* 6a35f7 call _rand */
    rnd <<= 12;                                         /* 6a35fc shl 12 — LOGIQUE */
    rnd = (unsigned)((int)rnd >> 15);                   /* 6a35ff sar 15 — ARITHMÉTIQUE : pattern (rand<<12)>>15 signé */
    rnd += 0x800;                                       /* 6a3602 add eax,800h */
    *(short *)((unsigned char *)handle + 0x20) = (short)rnd; /* 6a3607 */

    /* 4 rand() successifs, stores BYTE (low AL) à +0x1C..+0x1F */
    *(unsigned char *)(handle + 0x1C) = (unsigned char)rand(); /* 6a360b call / 6a3610 mov [esi+1Ch],al */
    *(unsigned char *)(handle + 0x1D) = (unsigned char)rand(); /* 6a3613 call / 6a3618 mov [esi+1Dh],al */
    *(unsigned char *)(handle + 0x1E) = (unsigned char)rand(); /* 6a361b call / 6a3620 mov [esi+1Eh],al */
    rnd = (unsigned)rand();                                    /* 6a3623 call */
    *(unsigned char *)(handle + 0x1F) = (unsigned char)rnd;    /* 6a3628 mov [esi+1Fh],al */

    /* 6a362b pop esi ; 6a362c retn — eax = valeur 32-bit COMPLÈTE du dernier rand()
     * (6a3623 call _rand puis 6a3628 ne store que AL ; eax intact au retn).
     * Chemins alternatifs : arg_0 (garde cap), 0 (échec Register). */
    return (int)rnd;
}

// UNCERTAIN 6a362c — la valeur de retour du chemin principal (dernier rand(), 32 bits) est-elle
//   consommée par l'appelant sub_6A2B80 @0x6a2ee6 ? disasm caller absent du pack.
// UNCERTAIN 6a356c/6a357a — plage réelle des mots [out+0x28]/[out+0x2A] : s'ils peuvent être
//   négatifs, l'index movsx signé lit AVANT la rangée ; non prouvable depuis cette fonction seule.
// UNCERTAIN 6a3598/6a35b2 — l'état initial de [esi+0x0C]/[esi+0x10] vient de l'allocation
//   BdLinkTask_Register ; son contenu (0 ? résidu ?) n'est pas observable dans ce pack.
// UNCERTAIN champs +0x12/+0x20/+0x1C..1F — sémantique (angle, phase, octets couleur ?) :
//   sub_6A3630 absent du pack, aucun consommateur observable.
```

## Analyse semantique

# Sémantique sub_6A3510 @ 0x6A3510 (réconciliation R)

- Rôle (1 phrase) : Spawne une tâche différée de type BdLinkTask (callback `sub_6A3630` sur la liste `dword_2510218`) pour un sort mag FX type '1', l'initialise depuis la rangée `unk_11AC200` (stride 0x20) et le contexte `dword_2510278`, appelle `sub_56CB50` avec deux slots ×8 et une amplitude `0x1000 − w[+26]`, puis remplit tirages aléatoires et durées 0x1E/0x0A.

- Verdict : LIKELY consolidé (A/B/C-R/c_b tous LIKELY ; pas de convergence wiki)
- Confiance : LIKELY
  - Callers + callees + ASM alignés et opcodes cités, MAIS : wiki.md vide (échec QMD), `sub_6A3630` et `sub_56CB50` absents du pack (aucun consommateur des champs +0x12/+0x20/+0x1C..1F observable), sémantique runtime de l'effet non tranchable. CERTAIN hors de portée.

- Nom catalogue : absent (`sub_6A3510`, CMT vide). Proposition markdown seule (PAS de rename) :
  **`Battle_MagicFX_Type1_SpawnTimedTask`** (nom A retenu ; le « Emitter » de B est rejeté, voir Divergence 6)
  Justification ≥2 preuves ASM adressées indépendantes :
  1. `6a351f push offset sub_6A3630` / `6a3524 push offset dword_2510218` / `6a3529 call BdLinkTask_Register` / `6a3530 add esp,8` — spawn d'une tâche callback sur liste globale → « Spawn…Task ».
  2. Caller unique = hook émetteur mag type '1' `sub_6A2B80` @ `0x6a2ee6` (callers.txt, xref code unique) → « MagicFX_Type1 ».
  3. Appui « Timed » : `6a35b6 mov byte ptr [esi+19h], 1Eh` et `6a35f3 mov byte ptr [esi+1Bh], 0Ah` — deux durées codées en dur dans le nœud tâche.

- In / Out / Effets :
  - In :
    - `arg_0` : contexte émetteur ; garde `6a3515 cmp dword ptr [eax+4], 20h` / `6a3519 jge` (**DWORD signé**, pas s8) : cap 0x20 tâches actives.
    - `arg_4` (edi) : descripteur FX — mots signés +0x02 (index rangée), +0x26 (amplitude), +0x28/+0x2A (indices d'octets dans la rangée).
    - `arg_8` : contexte dont `[+4]` (ebp, `6a3546 mov ebp,[edx+4]`) est la base des slots, stride 8.
  - Out : retour EAX 32 bits = **dernier `rand()` complet** sur le chemin principal (`6a3623 call _rand` ; `6a3628 mov [esi+1Fh],al` ne touche que AL ; `6a362c retn`) ; `arg_0` si cap atteint (eax jamais réécrit avant 6a3519) ; `0` si `BdLinkTask_Register` échoue (`6a3535 jz`).
  - Effets :
    - Enregistrement callback sur `dword_2510218` ; nœud esi ; bail null `6a3533 test esi,esi` / `6a3535 jz`.
    - Rangée `unk_11AC200 + 0x20*(short)word[edi+2]` (`6a3555 movsx` / `6a3561 shl eax,5` logique / `6a3564 add offset`) ; deux octets lus ZÉRO-ÉTENDUS aux indices movsx word +0x2A (`6a356c mov dl,[ecx+eax]`) et +0x28 (`6a357a mov cl,[edx+eax]`).
    - `Thunk_56CB50` (→ `sub_56CB50`, 5 args cdecl, `6a358c add esp,14h`) : args1..5 = (ebp+row[w28]*8, ebp+row[w2A]*8, 0x1000−w26, w26, esi+0Ch) — pushs `6a3559/6a355a/6a3569/6a3577/6a3581`, droite→gauche.
    - Deltas dans la tâche, globals en LECTURE SEULE : task+0Ch = `[dword_2510278+0x148] − ancien task+0Ch` (`6a358f mov cx,[eax+148h]` read ; `6a3598 sub cx,[ebx]` ; `6a359f mov [ebx],cx`) ; task+10h = `[+0x14C] − ancien task+10h` (`6a35a8`/`6a35b2`/`6a35c2`). task+0Eh/+14h/+16h = 0 (`6a359b`, `6a35ba`, `6a35be`, eax=0 depuis `6a3596 xor eax,eax`) ; dword task+0x18 = 0 (`6a35af`) puis bytes +0x19=0x1E et +0x1B=0x0A (dword final 0x0A1E0000).
    - Polarité task+12h selon word[edi+2] (`6a35c6 cmp word ptr [edi+2], ax` / `6a35cd jnz`) : ==0 → `0xFFFFFFA6 − (rand&0x3F)` (négatif, `6a35d7/6a35dc`) ; !=0 → `0x5A + (rand&0x3F)` (`6a35ec`).
    - 7 appels `_rand` : 6a35cf, 6a35e4, 6a35f7 (`shl 12`/`sar 15` arithmétique + 0x800 → task+20h word, `6a35fc–6a3607`), 6a360b/6a3613/6a361b/6a3623 (octets task+1Ch..1Fh, stores AL).

- Divergences A/B (tranchées une par une, preuve ASM adressée) :
  1. **Retour** — A : « résidu du dernier rand, void effectif » ; B : « handle node 32 bits, 0=échec ». **Tranché : chemin principal = dernier rand() 32 bits complet** (`6a3623 call _rand` ; `6a3628 mov [esi+1Fh],al` ne modifie pas eax ; `6a362c retn`) ; cap → arg_0 ; échec Register → 0. B faux (le handle vit dans esi, pas eax au retn) ; A faux aussi (ce n'est ni un résidu 8 bits ni un void — 32 bits complets). Conforme fait d'ancorage.
  2. **Globals +0x148/+0x14C** — A : « décrémente deux compteurs globaux » ; B : « delta vs référence persistante ». **Tranché : LECTURE SEULE** — `6a358f mov cx,[eax+148h]` et `6a35a8 mov cx,[edx+14Ch]` sont des reads ; aucun `mov [eax+148h],…` dans la fonction ; delta = global − ancien champ tâche, stocké dans la tâche (`6a359f`, `6a35c2`). B plus proche ; A faux au sens mémoire (conforme ancrage C-R).
  3. **Destination des zéros/deltas** — A : « ancienne valeur → task+0Eh, anciennes → task+14h/+16h » ; **FAUX** : `6a359b mov [esi+0Eh],ax` avec eax=0 (`6a3596 xor eax,eax`) → task+0Eh=0 ; idem `6a35ba`/`6a35be` → +14h/+16h=0. Les deltas vont en task+0Ch (`6a359f`) et task+10h (`6a35c2`). B légèrement faux aussi (dit delta → node+0x0E ; c'est node+0x0C).
  4. **Args Thunk_56CB50** — A (Effets) liste « ebp + b[edi+26h]*8 » comme 5e élément : **FAUX**, w26 n'indexe jamais la rangée. Les deux indices de rangée sont w[+28] (`6a3573 movsx edx,word[edi+28h]` → `6a357a mov cl,[edx+eax]`) et w[+2A] (`6a355d` → `6a356c mov dl,[ecx+eax]`) ; w26 est passé brut en arg4 (`6a355a push ecx`) et entre dans 0x1000−w26 (`6a354c mov edx,1000h` / `6a355b sub edx,ecx`). Ordre exact : (ebp+row[w28]*8, ebp+row[w2A]*8, 0x1000−w26, w26, esi+0Ch). B correct mais moins précis.
  5. **Nombre d'appels rand** — B : « ×5 » ; **FAUX** : 7 sites (6a35cf, 6a35e4, 6a35f7, 6a360b, 6a3613, 6a361b, 6a3623, confirmés callees.txt). A dit « ×6 » dans le texte mais en liste 7 — tranché : 7.
  6. **Nom** — A `…_SpawnTimedTask` vs B `…_RegisterAndInitEmitter` : **tranché A**. L'objet initialisé est le NŒUD TÂCHE renvoyé par Register (tous les stores vont à esi+0x0C..0x20, `6a3549 lea ebx,[esi+0Ch]`), pas un émetteur → « Emitter » (B) trompeur. L'aspect « Register+Init » de B est couvert par « Spawn ».
  7. Mineur — A : « plage +0x20 ~0x800–0xFFF » non fondé : `(rand<<12) sar 15 + 0x800` (`6a35fc–6a3602`) couvre théoriquement ±0x10000 autour de 0x800 (sar arithmétique, signe dépend du bit 19 de rand). Inférence A rejetée, formule ASM seule conservée.

- Vérificateur c_b.c (rattrapage post C-R) : convergent sur tous les points tranchés (retour dernier rand 32 bits, globals RO, ordre args thunk, jge signé, shl logique/sar arithmétique, ordre des stores). Une incohérence interne signalée : c_b.c L69 écrase sa variable `handle` avec 0 (émulant `6a3596 xor eax,eax`) puis L102 fait `return handle;` — le code C retournerait 0, contredisant son propre commentaire (« eax = dernier rand() ») ; l'intention commentée est correcte, aucun impact sur la réconciliation. Aucune divergence sémantique nouvelle.

- Preuves (ASM cité) :
  1. `6a3515 cmp dword ptr [eax+4], 20h` / `6a3519 jge loc_6A362B` (SF=OF → signé) : cap 0x20, DWORD, early-exit eax=arg_0.
  2. `6a351f/6a3524/6a3529 push offset sub_6A3630 ; push offset dword_2510218 ; call BdLinkTask_Register` + `6a3530 add esp,8` + `6a3533 test esi,esi` / `6a3535 jz` : enregistrement cdecl 2 args, bail NULL.
  3. `6a3555 movsx eax, word ptr [edi+2]` / `6a3561 shl eax,5` / `6a3564 add eax, offset unk_11AC200` : rangée stride 0x20 indexée par mot signé.
  4. `6a356a xor edx,edx ; 6a356c mov dl,[ecx+eax]` et `6a3578 xor ecx,ecx ; 6a357a mov cl,[edx+eax]` : deux octets zéro-étendus aux indices movsx word +0x2A/+0x28, puis `6a356f/6a357d lea …,[ebp+…*8]` → slots ×8.
  5. Pushs `6a3559 ebx`(=esi+0Ch) `6a355a ecx`(w26) `6a3569 edx`(0x1000−w26) `6a3577`/`6a3581`(slots) + `6a3582 call Thunk_56CB50` + `6a358c add esp,14h` : 5 args cdecl droite→gauche.
  6. `6a358f mov cx,[eax+148h]` / `6a3598 sub cx,[ebx]` / `6a359f mov [ebx],cx` (miroir +0x14C à 6a35a8–6a35c2) : deltas calculés en registre, globals jamais écrits.
  7. `6a35c6 cmp word ptr [edi+2], ax` / `6a35cd jnz` + branches `6a35d7 mov edx,0FFFFFFA6h`/`6a35dc sub` vs `6a35ec add eax,5Ah` : polarité +0x12 selon word[out+2]==0.
  8. `6a3623 call _rand` / `6a3628 mov [esi+1Fh],al` / `6a362c retn` : eax = dernier rand() 32 bits au retour.

- Checks §5.6 :
  - Callees cités présents (callees.txt CALL/ADD-ESP) : BdLinkTask_Register (6a3529) ✓, Thunk_56CB50 (6a3582) ✓, _rand ×7 ✓ ; sub_6A3630 = offset poussé (6a351f), pas un call — aucune library call inventée.
  - Caller présent (callers.txt) : sub_6A2B80 @ 0x6a2ee6, xref unique ✓.
  - Strides en nombres : 0x20 (shl 5, 6a3561), ×8 (6a356f/6a357d), cap 0x20 (6a3515) ✓.
  - Polarités : jge signé (6a3519), jnz (6a35cd), shl logique (6a3561, 6a35fc) vs sar arithmétique (6a35ff) ✓.
  - Largeur retour : EAX 32 bits (dernier rand) ; seuls AL (6a3628) et word +0x20 sont stockés ✓.
  - Nom : ≥2 preuves adressées indépendantes (Register 6a351f–6a3529 ; hook type '1' 0x6a2ee6 ; appui durées 6a35b6/6a35f3) ✓.

- Questions ouvertes (non bloquantes) :
  - Le retour (dernier rand, 32 bits) est-il consommé par sub_6A2B80 @0x6a2ee6 ? disasm caller absent du pack.
  - État initial de task+0x0C/+0x10 à la lecture des `sub cx,…` (6a3598/6a35b2) : écrit par sub_56CB50 (arg5) ou résidu d'allocation ? Non observable ici.
  - Plage réelle des mots +0x28/+0x2A : s'ils sont négatifs, l'index movsx lit avant la rangée 0x11AC200.
  - Sémantique des champs +0x12/+0x20/+0x1C..1F (angle ? phase ? couleur ?) et rôle exact des deltas +0x148/+0x14C : sub_6A3630 et les consommateurs absents du pack.

- IDBCOMMENT: Enregistre une tache differée via BdLinkTask_Register (callback sub_6A3630 sur la liste dword_2510218) dans la limite de 32 instances actives, puis initialise son etat depuis la rangee unk_11AC200 stride 0x20 et le contexte dword_2510278. Appelle sub_56CB50 avec deux slots de 8 octets et une amplitude 0x1000 moins le mot +0x26, remplit des tirages aleatoires a polarite inversee si le mot +2 vaut zero et deux durees 0x1E/0x0A. Les mots globals +0x148/+0x14C sont lus seulement : les deltas global moins ancien champ sont stockes dans la tache, aucun decrement memoire. Retourne le dernier rand() 32 bits, arg_0 si cap atteint, 0 si l'enregistrement echoue. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A3510 @ 0x6A3510 (cellule C-R)

Ground truth = `asm.asm` live (84 instr, 0x6A3510..0x6A362C) + type IDA. Hex-Rays = vérificateur seulement.
Voix réconciliées : `c_a.c` (reconstruction C pleine) + `semantic_a.md` / `semantic_b.md` (analyses sémantiques).
**`c_b.c` ABSENT du pack** — la seconde voix C n'a pas été fournie ; la réconciliation A×B s'est faite
entre `c_a.c` et les deux sémantiques, toutes tranchées contre l'ASM.

## Anomalies du pack

- `c_b.c` manquant (pack livré avec c_a.c + semantic_a.md + semantic_b.md).
- `callees.txt` : sections CALLS et PROTOS vides — seules les lignes CALL/ADD-ESP sont exploitables.
- `wiki.md` vide (échec QMD au build du pack, noté par les deux voix) — aucune convergence wiki.
- `callers.txt` : un seul caller (sub_6A2B80 @ 0x6a2ee6, xref unique). Fan-in = 1, conforme au hook type '1'.

## Point 1 — Garde cap

- A (c_a.c L41-43) : `cmp dword [eax+4], 20h / jge`, **signé**, early-exit retourne arg_0.
- B (semantic_b.md #1) : "garde 32 instances max, no-op au-delà" — signé implicite.
- **Tranché : A.** Preuve ASM : `6a3510 mov eax,[esp+arg_0]` ; `6a3515 cmp dword ptr [eax+4], 20h` ;
  `6a3519 jge loc_6A362B` (Jump if Greater or Equal, SF=OF → comparaison **SIGNED**).
- ⚠ Divergence avec la consigne : la mission dit « (s8)[A+4] » (octet signé). L'ASM dit
  **`dword ptr`** : test 32 bits signé à [arg_0+4], pas un byte. L'opcode gagne.
- Retour early-exit : eax = arg_0 intact (jamais réécrit avant 6a3519) → `return arg_0`.

## Point 2 — BdLinkTask_Register + test handle

- A/B/Hex-Rays convergent : enregistrement callback, bail si NULL.
- **Tranché (unanime, confirmé ASM).** Preuves : `6a351f push offset sub_6A3630` (arg2),
  `6a3524 push offset dword_2510218` (arg1), `6a3529 call BdLinkTask_Register`,
  `6a3530 add esp,8` (cdecl 2 args), `6a3533 test esi,esi`, `6a3535 jz loc_6A362B`.
  Retour du bail : eax = 0 (valeur de retour de Register).
- Divergence B (semantic_b.md "Out") : « retour = handle node, largeur 32 bits » — faux pour le
  chemin principal : au `retn` (6a362c) eax contient le **dernier rand()** (cf. Point 6),
  pas le handle. Handle n'est conservé que dans esi/ebx. Tranché contre B.

## Point 3 — Appel sub_56CB50 (5 args cdecl)

- A (c_a.c L78-85) : ordre push (droite→gauche) arg5=`esi+0x0C`, arg4=`w26` (movsx WORD complet),
  arg3=`0x1000-w26`, arg2=`ebp + row[w[out+2A]]*8`, arg1=`ebp + row[w[out+28]]*8`.
- Hex-Rays (hexrays.c L20-25) : arg1/arg2 indexés par `a2[20]`/`a2[21]` = offsets 0x28/0x2A — même
  ordre, mais utilise `a2[19]` (=0x26) pour les args 3-4. Cohérent avec A.
- **Tranché : ordre ASM.** Preuves adresses :
  - `6a354c mov edx,1000h` ; `6a3551 movsx ecx, word ptr [edi+26h]` ; `6a355b sub edx,ecx` → arg3 = 0x1000−w26.
  - `6a3559 push ebx` (arg5 = esi+0x0C) ; `6a355a push ecx` (arg4 = w26 movsx **WORD 16-bit signé**,
    pas un byte) ; `6a3569 push edx` (arg3) ; `6a3577 push ecx` (arg2 = `6a356f lea ecx,[ebp+edx*8]`) ;
    `6a3581 push edx` (arg1 = `6a357d lea edx,[ebp+ecx*8]`) ; `6a3582 call Thunk_56CB50` ;
    `6a358c add esp,14h` → 5 args cdecl, cleanup caller.
  - base = `6a3546 mov ebp,[edx+4]` avec `6a353b mov edx,[esp+4+arg_8]` → ebp = [arg_8+4]. ✔
  - rangée : `6a3555 movsx eax, word ptr [edi+2]` ; `6a3561 shl eax,5` (stride 0x20, **shl logique**) ;
    `6a3564 add eax, offset unk_11AC200` → `unk_11AC200 + 0x20*(short)word[out+2]`. ✔
  - lectures octets ZÉRO-ÉTENDUS : `6a356a xor edx,edx ; 6a356c mov dl,[ecx+eax]` (index = movsx word
    [out+0x2A] de 6a355d) et `6a3578 xor ecx,ecx ; 6a357a mov cl,[edx+eax]` (index = movsx word
    [out+0x28] de 6a3573). ✔
- Divergence interne A (c_a.c L72-76) : A écrit `row + (w2A & 0xFF)` — masque `&0xFF` **inventé** ;
  l'ASM indexe avec le movsx 32-bit complet du mot signé (peut lire avant la rangée si négatif).
  Corrigé dans c_reconciled.c : `row[idx]` avec idx = movsx signé, lecture d'octet zéro-étendue.
  Noté UNCERTAIN sur la plage réelle des mots +0x28/+0x2A.
- Divergence mineure A : c_a.c lit deux fois `word[edi+0x28]` (L60 w28 puis L74 relecture) — artefact
  sans effet sémantique ; le reconcilé lit une seule fois.

## Point 4 — Init champs esi+0x0C..0x20 (séquence exacte)

Ordre des stores tranché contre l'ASM, ligne par ligne :

| Adresse | Store | Valeur |
|---|---|---|
| 6a359b | `[esi+0Eh], ax` | 0 (eax=0 depuis `6a3596 xor eax,eax`) |
| 6a359f | `[ebx], cx` | +0x0C = [dword_2510278+0x148] − ancien [esi+0x0C] (`6a358f mov cx,[eax+148h]` ; `6a3598 sub cx,[ebx]`) |
| 6a35af | `[esi+18h], eax` | dword 0x18..0x1B = 0 |
| 6a35b6 | `byte [esi+19h], 1Eh` | 0x1E — écrase le byte 1 du dword 0x18 (ANCRE) |
| 6a35ba | `[esi+14h], ax` | 0 |
| 6a35be | `[esi+16h], ax` | 0 |
| 6a35c2 | `[esi+10h], cx` | +0x10 = [dword_2510278+0x14C] − ancien [esi+0x10] (`6a35a8 mov cx,[edx+14Ch]` ; `6a35b2 sub cx,[esi+10h]`) |
| 6a35cf/6a35e4 | `[esi+12h], dx/ax` | branché (cf. ci-dessous) |
| 6a35f3 | `byte [esi+1Bh], 0Ah` | 0x0A — byte 3 du dword 0x18 (final : dword@0x18 = 0x0A1E0000) |
| 6a3607 | `[esi+20h], ax` | (rand<<12 >>sar 15) + 0x800 |
| 6a3610/18/20/28 | `al → [esi+1Ch..1Fh]` | 4 rand() successifs, stores BYTE |

- Branche +0x12 : `6a35c6 cmp word ptr [edi+2], ax` (ax=0), `6a35cd jnz short loc_6A35E4`.
  - `out[2] != 0` → `6a35e4 call _rand ; 6a35e9 and eax,3Fh ; 6a35ec add eax,5Ah ; 6a35ef mov [esi+12h],ax`
    → **+0x12 = 0x5A + (rand&0x3F)**.
  - `out[2] == 0` → `6a35cf call _rand ; 6a35d4 and eax,3Fh ; 6a35d7 mov edx,0FFFFFFA6h ;
    6a35dc sub edx,eax ; 6a35de mov [esi+12h],dx` → **+0x12 = −90 − (rand&0x3F)** (montage signé
    0xFFFFFFA6 − rand, store WORD bas).
  - **Tranché : conforme consigne.** La polarité est fonction du mot `[out+2]` (word 16 bits, cmp word),
    pas de l'index de rangée au-delà de sa valeur 0/non-0.
- Divergence A (c_a.c L96) : le commentaire « eax==0, dword 0x18..0x1B » est correct, mais A oublie de
  signaler que le store `[esi+18h]` arrive AVANT `sub cx,[esi+10h]` — l'ordre ASM (sub à 6a35b2
  **après** le dword store à 6a35af) est préservé dans le reconcilé.
- Divergence Hex-Rays : `*(_DWORD *)(v4 + 24) = 0;` (L30) placé après la lecture de v8 mais avant
  `v9 = v8 - *(_WORD *)(v4 + 16)` — sémantiquement identique (le sub lit +0x10, pas +0x18) ; ordre
  d'écriture seul. Aucune divergence de fond.
- ⚠ Décréments : consigne dit « Décréments dword_2510278+0x148/0x14C » — l'ASM ne fait **aucune
  écriture** au global : c'est un calcul de DELTA enregistré dans la tâche
  (nouveau +0x0C/+0x10 = global − ancien champ tâche). Les globals ne sont que LUS
  (`6a358f`, `6a35a8`). Tranché : lecture seule. (cf. Point 5)

## Point 5 — dword_2510278+0x148/0x14C

- A/B disent « décrémente deux compteurs globaux » (semantic_a.md) / « delta par rapport à une
  référence persistante » (semantic_b.md).
- **Tranché : LECTURE SEULE des globals.** Preuves : `6a358f mov cx,[eax+148h]` et
  `6a35a8 mov cx,[edx+14Ch]` sont des `mov` read ; aucun `mov [eax+148h], …` n'existe dans la
  fonction. Les résultats sont stockés dans la tâche (`6a359f`, `6a35c2`). La formulation
  « décrémente les compteurs » (consigne + semantic_a) est fausse au sens mémoire ; le sub
  effectue la soustraction dans les registres de la tâche uniquement.

## Point 6 — Retour

- **Tranché : eax = dernier rand() (32 bits complets) sur le chemin principal.**
  Preuve : `6a3623 call _rand` ; `6a3628 mov [esi+1Fh],al` (seul AL est store, eax intact) ;
  `6a362b pop esi` ; `6a362c retn`. Aucune autre instruction ne touche eax entre 6a3623 et 6a362c.
- Chemins alternatifs : arg_0 (garde cap, eax jamais réécrit), 0 (échec Register).
- Hex-Rays agrège ces 3 cas sous un seul `result` — fidèle pour les deux early-exits, mais masque
  que le chemin principal retourne le rand() brut.

## Divergences vs Hex-Rays (hexrays.c)

1. **Ordre/typage args Thunk_56CB50** — Hex-Rays L20-25 : arg1 indexé `a2[20]`, arg2 `a2[21]` ;
   ASM : arg1 = row[movsx word[out+0x28]], arg2 = row[movsx word[out+0x2A]]. Même correspondance
   0x28/0x2A → OK. **Mais** Hex-Rays écrit `8 * (unsigned __int8)v6[...]` : le `unsigned __int8`
   capture bien la lecture d'octet, MAIS l'index de rangée est un `char` signé implicitement via le
   typedef de v6 (`char *v6`) — l'ASM indexe avec un movsx WORD 32-bit signé (6a3573/6a355d).
   ASM gagne ; répercuté dans le reconcilé (index movsx, contenu zéro-étendu).
2. **arg4 = a2[19]** (Hex-Rays L23) = movsx WORD [edi+0x26] — conforme ASM (6a3551 movsx word).
   Aucune divergence (Hex-Rays correct ici).
3. **Retour** — Hex-Rays L45 `result = rand(); *(_BYTE *)(v4 + 31) = result;` : correct pour le
   chemin principal (eax = rand 32-bit), mais Hex-Rays ne distingue pas les 3 chemins de retour.
   Noté, non divergent au fond.
4. **Stores +0x14/+0x16** — Hex-Rays L33-34 les place après `*(_BYTE *)(v4+25)=30` (ordre d'écriture
   différent de l'ASM : 6a35af dword, 6a35b6 byte 0x19, 6a35ba word 0x14, 6a35be word 0x16, 6a35c2
   word 0x10). Sémantique identique (champs disjoints), ordre seul. Reconcilé = ordre ASM.
5. **Garde cap** — Hex-Rays L12 `if ( *(int *)(a1 + 4) < 32 )` : dword signé, conforme à l'ASM
   (jge). La consigne « (s8) » est rejetée.

## UNCERTAIN restants

- `6a362c` — le retour (dernier rand(), 32 bits) est-il consommé par l'appelant sub_6A2B80 @0x6a2ee6 ?
  disasm du caller absent du pack.
- `6a356c/6a357a` — plage réelle des mots `[out+0x28]`/`[out+0x2A]` : s'ils peuvent être négatifs,
  l'index movsx signé lit AVANT la rangée de 0x11AC200. Non prouvable depuis cette fonction seule.
- `6a3598/6a35b2` — l'état initial de `[esi+0x0C]`/`[esi+0x10]` (alloué par BdLinkTask_Register) :
  contenu non observable dans ce pack (protos callees.txt vides).
- Sémantique des champs +0x12/+0x20/+0x1C..1F (angle ? phase ? octets couleur ?) : sub_6A3630 absent
  du pack, aucun consommateur observable ici. Rôle A/V/R, pas C-R.
