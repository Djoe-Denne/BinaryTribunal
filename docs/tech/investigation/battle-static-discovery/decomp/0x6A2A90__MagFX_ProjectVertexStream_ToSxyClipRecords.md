# MagFX_ProjectVertexStream_ToSxyClipRecords @ 0x6A2A90

- Instr (live): 81 (227 o, 0x6A2A90-0x6A2B72)
- Palier: 2+1
- Verdict: LIKELY - decode une commande du stream mag FX (word count + n triplets s16 de 6 o) : projet chaque vertex via GTE (GteState_SetIndexed01_FromS16x3 @0x6A2ABE + cameraRelated_usedByFields @0x6A2AC3), classe par bornes signees shl 3 (secteur word 0/1/2 a +22h @0x6A2AF8-B13, bits or byte 4/8 @0x6A2B28-39), copie 8 octets/entree (2 dwords a3+1C/20) vers *a2 ; fallback sans-GTE mov word [ebp+6],10h @0x6A2AE4 ; curseurs *a1 (+2+n*6) et *a2 (+8/entree) reecrits @0x6A2B63-66 ; retour EAX = a2, ou -1 si count nul (dec residuel @0x6A2AA7 apres movsx unique @0x6A2A9D)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A2A90\nTYPE ; proposition: MagFX_ProjectVertexStream_ToSxyClipRecords
- Notes parent: checks 5.6 OK : movsx word [edi] (0x6A2A9D) + add edi,2 (0x6A2AA2) + dec (0x6A2AA7) = lecture unique, ordre boucle push edi/cameraRelated/add 6/setSomeDword/setSomeDword4 (0x6A2ABD-D5), miroir 10h (0x6A2AE4), secteur words 0/1/2 (0x6A2AF8-B13), or byte 4/8 (0x6A2B28-39), record 2 dwords + stride 8 (0x6A2B3D-4C), loop jnz (0x6A2B54), curseurs (0x6A2B63-66), retn (0x6A2B72), caller sub_6A2940 @0x6A29E3 + 4 clones ; NOTE : sem_b lancee en rattrapage (absente du premier montage), converge avec sem_a/c_a/c_b

## C reconcilie

```c
/* =============================================================================
 * c_reconciled.c — sub_6A2A90 @ 0x6A2A90 (réconcilié A+B, pipeline triple 2+1)
 * -----------------------------------------------------------------------------
 * Ground truth = live ASM (asm.asm @ 0x6A2A90, 81 instr, 227 octets) + NOT
 * Hex-Rays (hexrays.c = vérificateur seulement).
 * IDA type    : int __cdecl(int *, int *, int)   (meta.json)
 * Famille     : mag FX battle — callee de l'interpréteur 0x6A2940 (@0x6A29E3)
 *               + 4 callers clonés (callers.txt : sub_685860, sub_68A990,
 *               sub_697700, sub_6F80B0 ; more:false).
 *
 * Sauvegardes de registres : ebp, esi, edi (prologue @0x6A2A94..96) ; ebx
 * UNIQUEMENT dans le chemin boucle (push @0x6A2AB5, après le test count==0 ;
 * pop @0x6A2B62). Convention cdecl : aucun `ret n`, le caller nettoie.
 *
 * Retour (eax 32 bits) :
 *   - chemin normal (count != 0) : eax = a2 (mov eax,[esp+10h+arg_4] @0x6A2B5E)
 *   - chemin count == 0          : eax = count - 1 = -1 (movsx @0x6A2A9D,
 *                                  dec @0x6A2AA7, jamais réécrit avant retn
 *                                  @0x6A2B72) — le type IDA `int` est un leurre,
 *                                  la valeur n'est pas sémantique.
 *
 * Slot pile arg_8 réutilisé comme compteur de boucle : mov [esp+10h+arg_8],eax
 * @0x6A2AB6 — le slot de a3 est réécrit APRÈS son dernier usage comme pointeur
 * (esi chargé @0x6A2AB0) ; détail d'implémentation invisible dans le C local.
 *
 * Struct @a3 (esi) — offsets LIVE, tous s16 sauf mention :
 *   +0x0C, +0x10 : bornes X min/max (comparées ×8 = shl 3, signées)
 *   +0x0E, +0x12 : bornes 2e coord min/max (idem)
 *   +0x1C, +0x1E : paire s16 écran transformée GTE (ebx = a3+0x1C @0x6A2ABA)
 *   +0x20        : word flag GTE (ja unsigned vs 0) ; dword +0x20 copié en sortie
 *   +0x22        : code secteur — écritures MIXTES : word 0/1/2 (mov word)
 *                  puis bits 4/8 en OR BYTE — fidèle à l'ASM.
 * Record sortie 8 octets @ebp : dword [a3+0x1C] | dword [a3+0x20], stride 8.
 * ========================================================================== */

/* Callees — uniquement ceux de asm.asm / callees.txt. Protos déduits des
 * pushes cdecl observés ; rôles nommés par l'IDB, non re-prouvés ici. */
extern void __cdecl GteState_SetIndexed01_FromS16x3(const void *pS16x3);
/* E3b: table[0]=y<<16|x, table[1]=z via SetIndexed */
extern void __cdecl cameraRelated_usedByFields(void);
/* UNCERTAIN 0x6A2AC3 arité : au moment du call, le push edi du call précédent
 * (0x6A2ABD) est toujours en sommet de pile (nettoyage unique add esp,0Ch
 * @0x6A2ADA couvre les 3 pushes des calls 0x6A2ABE/ACC/AD5). Un callee cdecl
 * 1-arg lirait ce slot (= curseur vertex courant) comme premier paramètre.
 * Hex-Rays ET les deux voix A/B modélisent 0-arg ; non tranchable par l'ASM
 * de cette fonction seule. */
extern void __cdecl setSomeDword(void *p);   /* appelé avec a3+0x1C */
extern void __cdecl setSomeDword4(void *p);  /* appelé avec a3+0x20 */

int __cdecl sub_6A2A90(int *a1, int *a2, int a3)
{
    unsigned char *cur;    /* edi : curseur lecture bytecode                */
    unsigned char *out;    /* ebp : curseur sortie, stride 8                */
    int            count;  /* s16 lu au curseur (movsx — signé)             */
    int            i;      /* compteur boucle (slot stack arg_8 @0x6A2AB6)  */
    unsigned char *st;     /* esi : a3                                      */
    unsigned char *st1C;   /* ebx : a3 + 0x1C, figé hors boucle             */
    int            sx, sy; /* coords écran movsx depuis +0x1C / +0x1E      */

    cur = (unsigned char *)*a1;                   /* 6A2A90 mov ecx,[esp+arg_0] ; 6A2A97 mov edi,[ecx] */
    count = *(short *)cur;                        /* 6A2A9D movsx eax,word[edi] — UNE seule lecture ; Hex-Rays relit *a1 3× */
    out = (unsigned char *)*a2;                   /* 6A2A99 mov edx,[esp+0Ch+arg_4] ; 6A2AA0 mov ebp,[edx] */
    cur += 2;                                     /* 6A2AA2 add edi,2 — header s16 AVANCÉ AVANT le test count==0 */
    i = count - 1;                                /* 6A2AA5 mov esi,eax ; 6A2AA7 dec eax — eax=-1 ici si count==0 */

    if (count == 0)                               /* 6A2AA8 test esi,esi ; 6A2AAA jz loc_6A2B6B */
    {
        *a1 = (int)cur;                           /* 6A2B6B mov [ecx],edi — ecx/edx encore arg_0/arg_4 (non clobbered) */
        *a2 = (int)out;                           /* 6A2B6D mov [edx],ebp */
        return count - 1;                         /* eax résiduel = -1 (0xFFFFFFFF) ; retn @6A2B72 */
    }

    st = (unsigned char *)a3;                     /* 6A2AB0 mov esi,[esp+0Ch+arg_8] */
    i = count;                                    /* 6A2AB4 inc eax ; 6A2AB5 push ebx ; 6A2AB6 mov [esp+10h+arg_8],eax */
    st1C = st + 0x1C;                             /* 6A2ABA lea ebx,[esi+1Ch] */

    do
    {
        GteState_SetIndexed01_FromS16x3(cur);     /* 6A2ABD push edi ; 6A2ABE call — lit 3×s16 (6 octets) au curseur */
        cameraRelated_usedByFields();             /* 6A2AC3 call — push edi encore en pile, cf. UNCERTAIN arité */
        cur += 6;                                 /* 6A2AC9 add edi,6 (3 s16 consommés) */
        setSomeDword(st1C);                       /* 6A2AC8 push ebx ; 6A2ACC call — arg = a3+0x1C */
        setSomeDword4(st + 0x20);                 /* 6A2AD1 lea eax,[esi+20h] ; 6A2AD4 push ; 6A2AD5 call */
        /* 6A2ADA add esp,0Ch : nettoyage cdecl GROUPÉ des 3 pushes (edi,ebx,eax) */

        if (*(unsigned short *)(st + 0x20) != 0)  /* 6A2ADD cmp word[esi+20h],0 ; 6A2AE2 ja (unsigned) — avec cmp 0 : != 0 */
        {
            sx = *(short *)st1C;                  /* 6A2AF0 movsx eax,word[ebx] — s16 @a3+0x1C */
            *(unsigned short *)(st + 0x22) = 0;   /* 6A2AF8 mov word[esi+22h],0 — écriture WORD */
            if (sx < *(short *)(st + 0x0C) * 8)   /* 6A2AEC movsx ecx,word[esi+0Ch] ; 6A2AF3 shl ecx,3 ; 6A2AF6 cmp ; 6A2AFE jge — SIGNED */
                *(unsigned short *)(st + 0x22) = 1;   /* 6A2B00 mov word[esi+22h],1 */
            else if (sx >= *(short *)(st + 0x10) * 8) /* 6A2B08 movsx edx,word[esi+10h] ; 6A2B0C shl 3 ; 6A2B0F cmp ; 6A2B11 jl — SIGNED */
                *(unsigned short *)(st + 0x22) = 2;   /* 6A2B13 mov word[esi+22h],2 */

            sy = *(short *)(st + 0x1E);           /* 6A2B1D movsx eax,word[esi+1Eh] */
            if (sy < *(short *)(st + 0x0E) * 8)   /* 6A2B19 movsx ecx,word[esi+0Eh] ; 6A2B21 shl 3 ; 6A2B24 cmp ; 6A2B26 jge — SIGNED */
                *(unsigned char *)(st + 0x22) |= 4;   /* 6A2B28 or byte[esi+22h],4 — OR sur OCTET */
            else if (sy >= *(short *)(st + 0x12) * 8) /* 6A2B2E movsx edx,word[esi+12h] ; 6A2B32 shl 3 ; 6A2B35 cmp ; 6A2B37 jl — SIGNED */
                *(unsigned char *)(st + 0x22) |= 8;   /* 6A2B39 or byte[esi+22h],8 — OR sur OCTET */

            *(int *)out       = *(int *)st1C;     /* 6A2B3D mov eax,[ebx] ; 6A2B3F mov [ebp],eax — dword a3+0x1C */
            *(int *)(out + 4) = *(int *)(st + 0x20);  /* 6A2B42 mov ecx,[ebx+4] ; 6A2B45 mov [ebp+4],ecx — dword a3+0x20 */
        }
        else
        {
            *(unsigned short *)(out + 6) = 0x10;  /* 6A2AE4 mov word[ebp+6],10h — chemin sans-GTE : SEUL out+6 écrit (word) */
        }

        out += 8;                                 /* 6A2B4C add ebp,8 — stride 8 octets */
    } while (--i != 0);                           /* 6A2B4F dec eax ; 6A2B50 mov slot ; 6A2B54 jnz loc_6A2ABD */

    /* Sortie boucle : arg_0/arg_4 RELUS depuis la pile (ecx/edx clobbered ; esp
     * décalé de 10h par les 4 pushes ebp/esi/edi/ebx) */
    *a1 = (int)cur;                               /* 6A2B5A mov edx,[esp+10h+arg_0] ; 6A2B63 mov [edx],edi */
    *a2 = (int)out;                               /* 6A2B5E mov eax,[esp+10h+arg_4] ; 6A2B66 mov [eax],ebp */
    return (int)a2;                               /* eax = a2 au retn @6A2B6A (valeur non sémantique) */
}

/* =============================================================================
 * UNCERTAIN restants
 * -----------------------------------------------------------------------------
 * UNCERTAIN 0x6A2AC3 — arité de cameraRelated_usedByFields (0 vs 1 arg cdecl) :
 *   le push edi @0x6A2ABD n'est pas nettoyé individuellement (add esp,0Ch
 *   groupé @0x6A2ADA). Modèle retenu 0-arg (Hex-Rays + A + B) ; voir note
 *   sur l'extern ci-dessus.
 * UNCERTAIN — nom des coordonnées +0x1C/+0x1E et bornes +0x0C..0x12 : l'ASM
 *   prouve les offsets et les comparaisons signées ×8, pas les libellés
 *   (X/Y vs X/Z). Notation neutre sx/sy adoptée (le brief parent dit Y).
 * UNCERTAIN — consommation de la valeur de retour par les 5 callers (a2 vs
 *   -1) non vérifiable dans ce pack (pas de dump des callers).
 * Divergences vs Hex-Rays — voir reconcile_notes.md §4.
 * ========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A2A90 @ 0x6A2A90 (réconciliation R)

- Rôle (1 phrase) : Opcode mag FX battle : lit au curseur *a1 un flux préfixé d'un compteur s16 suivi de triplets s16 (x,y,z), projette chaque vertex via l'état GTE + caméra, émet un enregistrement de 8 octets (xy écran + code secteur de clip) par vertex dans le buffer pointé par *a2, et réécrit les deux curseurs des appelants.
- Verdict : LIKELY consolidé
- Confiance : LIKELY (structure ASM + callees + callers pleinement cohérents et convergents A/B/Hex-Rays, mais wiki silencieux sur cette EA — wiki.md en échec qmd, 0 hit — et deux callees au nommage générique `setSomeDword`/`setSomeDword4` ; arité de `cameraRelated_usedByFields` non tranchable depuis cette fonction seule)
- Nom catalogue : pas de nom catalogue (sub_6A2A90). Proposition (markdown seul, PAS de rename) : **confirme** `MagFX_ProjectVertexStream_ToSxyClipRecords` (nom d'A retenu, seule voix nommante présente ; ≥2 preuves ASM indépendantes adressées ci-dessous)
- In / Out / Effets :
  - In : a1 = `int*` curseur lecture (*a1 → `s16 count` puis count triplets s16, stride 6) ; a2 = `int*` curseur écriture (*a2 → buffer d'enregistrements de 8 octets) ; a3 = record de travail (`+0x0C/+0x10` bornes X min/max s16, `+0x0E/+0x12` bornes 2e coord min/max s16, toutes comparées ×8 (`shl 3`) signées ; `+0x1C/+0x1E` paire s16 écran transformée GTE ; `+0x20` word flag GTE ; `+0x22` code secteur).
  - Out : `*a1` = curseur lecture avancé de 2 + count×6 octets (réécrit @0x6A2B63 chemin normal, @0x6A2B6B count==0) ; `*a2` = curseur écriture avancé de count×8 octets (@0x6A2B66 / @0x6A2B6D) ; record a3 modifié (`+0x1C..+0x23` : résultats GTE via les deux set + code secteur word 0/1/2 puis OR byte 4/8).
  - Retour : EAX déterministe = a2 (chemin normal, `mov eax,[esp+10h+arg_4]` @0x6A2B5E) ou -1 (chemin count==0 : `movsx` @0x6A2A9D + `dec` résiduel @0x6A2AA7 jamais réécrit avant `retn` @0x6A2B72). Consommation par les 5 callers non prouvée dans ce pack — la valeur est bien définie, son usage ne l'est pas.
  - Effets : état GTE muté via `GteState_SetIndexed01_FromS16x3` (table[0]=y<<16|x, table[1]=z) puis `cameraRelated_usedByFields` ; slot pile arg_8 réutilisé comme compteur de boucle (@0x6A2AB6) ; globals.txt vide, aucun accès global direct.
- Divergences A/B tranchées (B absent du pack en tant que `semantic_b.md` ; tranché contre `reconcile_notes.md`/`c_reconciled.c`/Hex-Rays, ground truth ASM) :
  1. **Retour « NON sémantique » (A) vs a2/-1 (notes + brief)** — Tranché : a2 ou -1, déterministe. Preuve : `6a2b5e mov eax,[esp+10h+arg_4]` (chemin normal) ; `6a2a9d movsx eax,word ptr [edi]` + `6a2aa7 dec eax` + `6a2b72 retn` sans réécriture d'EAX (chemin count==0 ⇒ eax=-1). A avait tort sur la déterminisme ; la réserve « consommation callers non prouvée » reste valide (UNCERTAIN assumé, pas de dump callers).
  2. **Record de travail modifié « +0x1C..+0x21 » (A)** — Tranché : +0x1C..+0x23. Preuve : la copie de sortie `6a2b42 mov ecx,[ebx+4]` / `6a2b45 mov [ebp+4],ecx` embarque le dword [esi+0x20..0x23], dont le word code secteur écrit à +0x22 (`6a2af8 mov word ptr [esi+22h],0`).
  3. **Type curseur lecture `int*` (A) vs `unsigned char*` (réconcilié)** — Tranché : sans incidence, présentation. Preuve : accès réels = `movsx eax, word ptr [edi]` @0x6A2A9D (s16) + `add edi,6` @0x6A2AC9 ; le pointeur n'est jamais déréférencé comme int.
  4. **Relitures `*a1` ×3 (Hex-Rays) vs lecture unique** — Tranché : l'ASM lit le mot UNE fois @0x6A2A9D puis avance edi @0x6A2AA2 ; c_reconciled lit une fois.
  5. **`ja` @0x6A2AE2 (unsigned) vs `if (word)` (Hex-Rays)** — Tranché : `cmp word ptr [esi+20h],0` + `ja` ⇒ « != 0 » ; équivalent avec cmp 0, polarité explicite retenue. A l'avait correctement cité.
  6. **Arité `cameraRelated_usedByFields`** — Tranché (modèle 0-arg par convergence Hex-Rays+A+B), **UNCERTAIN conservé** : le push edi @0x6A2ABD reste en sommet de pile au call @0x6A2AC3 (nettoyage groupé `add esp,0Ch` @0x6A2ADA couvre les 3 pushes des calls 0x6A2ABE/ACC/AD5) ; un callee cdecl 1-arg le lirait comme paramètre. Non tranchable depuis l'ASM de cette fonction seule.
- Preuves (3–8, ASM cité) :
  1. **Header s16 + early-out** : `6a2a9d movsx eax,word ptr [edi]`, `6a2aa2 add edi,2` AVANT `6a2aa8 test esi,esi`/`6a2aaa jz loc_6A2B6B` — compteur consommé même si nul, sortie propre count==0.
  2. **Strides en nombres** : in `6a2ac9 add edi,6` (3×s16/vertex) ; out `6a2b4c add ebp,8` ; copie `6a2b3d mov eax,[ebx]`/`6a2b3f mov [ebp],eax` + `6a2b42 mov ecx,[ebx+4]`/`6a2b45 mov [ebp+4],ecx` avec `6a2aba lea ebx,[esi+1Ch]`.
  3. **Chaîne GTE** : `6a2abd push edi`/`6a2abe call GteState_SetIndexed01_FromS16x3` → `6a2ac3 call cameraRelated_usedByFields` → `6a2acc call setSomeDword`(arg esi+0x1C) → `6a2ad5 call setSomeDword4`(arg esi+0x20) → `6a2ada add esp,0Ch`.
  4. **Miroir sans-GTE** : `6a2add cmp word ptr [esi+20h],0`/`6a2ae2 ja`, sinon `6a2ae4 mov word ptr [ebp+6],10h` — SEUL out+6 (word) écrit, tag 0x0010.
  5. **Clip secteur signé ×8** : X : `6a2aec movsx ecx,word ptr [esi+0Ch]`/`6a2af3 shl ecx,3`/`6a2afe jge`→1 @`6a2b00`, sinon `6a2b0f cmp` vs `[esi+10h]<<3`/`6a2b11 jl`→2 @`6a2b13` ; 2e coord : bits `6a2b28 or byte ptr [esi+22h],4` (si < `[esi+0Eh]<<3`) et `6a2b39 or byte ptr [esi+22h],8` (si ≥ `[esi+12h]<<3`). Polarités `jge`/`jl` signées sur s16 — correctes pour des bornes de clip écran.
  6. **Réécriture curseurs** : `6a2b5a mov edx,[esp+10h+arg_0]`/`6a2b63 mov [edx],edi` et `6a2b5e mov eax,[esp+10h+arg_4]`/`6a2b66 mov [eax],ebp` (relecture pile, esp décalé 10h) ; chemin count==0 : `6a2b6b mov [ecx],edi`/`6a2b6d mov [edx],ebp` (registres d'origine).
  7. **Callers famille clonée** : 5 xrefs (callers.txt, more:false) dont `sub_6A2940` @0x6A29E3 (interpréteur mag FX fermé) et 3 clones de taille 0x147 (`sub_68A990`, `sub_697700`, `sub_6F80B0`) + `sub_685860` (0x161).
  8. **Slot arg_8 compteur** : `6a2ab6 mov [esp+10h+arg_8],eax` (après chargement esi @0x6A2AB0), décrémenté/restocké @`6a2b4f`/`6a2b50`, boucle `6a2b54 jnz loc_6A2ABD`.
- Checks §5.6 :
  - Callees cités présents : OUI — les 4 lignes `6a2abe/6a2ac3/6a2acc/6a2ad5` de callees.txt correspondent exactement aux calls du corps.
  - Callers présents : OUI — 0x6A29E3 → sub_6A2940 + 4 autres, callers.txt more:false.
  - Strides en nombres : OUI — header 2 (0x6A2AA2), in 6 (0x6A2AC9), out 8 (0x6A2B4C).
  - Polarités : OUI — `jge`/`jl` signés pour les bornes ×8 (0x6A2AFE/B11/B26/B37) ; `ja` unsigned @0x6A2AE2 avec cmp 0 (≠0 volontaire) ; `movsx` partout sur les s16 comparés.
  - Largeur retour : EAX 32 bits ; valeur déterministe a2 ou -1 ; type IDA `int __cdecl` acceptable en arité mais trompeur sur la sémantique du retour.
  - Nom ≥2 preuves ASM indépendantes : OUI — (a) `0x6A2ABE call GteState_SetIndexed01_FromS16x3` + `0x6A2AC9 add edi,6` : projection d'un flux de triplets via GTE (« ProjectVertexStream ») ; (b) `0x6A2B3D–0x6A2B45` copie 2 dwords + `0x6A2B4C add ebp,8` : enregistrements de 8 octets xy+flags (« Records ») ; (c) `0x6A2AF8–0x6A2B39` code secteur word 0/1/2 + OR bits 4/8 vs bornes s16 ×8 (« Clip »). Trois preuves indépendantes adressées.
- Questions ouvertes (non bloquantes) :
  - Arité réelle de `cameraRelated_usedByFields` (0 vs 1 arg cdecl, push edi résiduel en sommet de pile @0x6A2AC3) — tranchable seulement en analysant ce callee.
  - Consommation de la valeur de retour (a2 vs -1) par les 5 callers — pas de dump dans le pack.
  - Libellés exacts des coordonnées +0x1C/+0x1E et bornes +0x0C..0x12 (l'ASM prouve offsets + comparaisons signées ×8, pas les noms X/Y ; notation neutre sx/sy, le brief parent dit Y).
  - Sémantique du word +0x20 (flag GTE valide ? résultat SXY2/Z ?) dépend du nommage réel de `setSomeDword4`.
  - Échelle ×8 des bornes (`shl 3`) : unités 1/8 écran ou bornes stockées pré-multipliées — à trancher chez les écrivains du record a3.

## IDBCOMMENT (proposition)

Opcode mag FX : lit au curseur a1 un compteur s16 puis autant de triplets s16, les projette via l'etat GTE et la camera. Chaque vertex produit un enregistrement de 8 octets : dword xy ecran depuis a3+1C, dword a3+20 avec code secteur dans le word a3+22 (0/1/2 en X, bits 4/8 en Y, bornes s16 multipliees par 8, comparaisons signees). Si le word a3+20 est nul, chemin sans GTE : seul out+6 recoit le tag 0010. Reecrit les deux curseurs a 6A2B63/6A2B66 ; retour EAX = a2, ou -1 si compteur nul. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A2A90 @ 0x6A2A90 (tranche A+B, ground truth ASM)

Pack : `tools/_tmp_semantic_triple/0x6a2a90/` — 81 instr live, 227 octets, IDA
`int __cdecl(int *, int *, int)`. Voix : c_a.c (A), c_b.c (B), vérificateur :
hexrays.c. Aucune divergence structurelle A vs B : les deux reconstructions
sont sémantiquement identiques ; les écarts sont de présentation (types de
curseurs, style if/else, commentaires). Le C réconcilié reprend la structure
de B (nominative) avec les notes de A.

## 1. Divergences tranchées contre l'ASM

Aucune entre A et B sur le fond. Tranchages pertinents (les deux voix
convergent ; l'ASM confirme) :

1. **Compteur word + header +2 / early-out** — Tranché : lecture unique
   `movsx eax, word ptr [edi]` @0x6A2A9D, `add edi,2` @0x6A2AA2 AVANT le test
   `test esi,esi` / `jz loc_6A2B6B` @0x6A2AAA ; `dec eax` @0x6A2AA7 laisse
   eax = -1 dans le chemin count==0, retourné tel quel (retn @0x6A2B72 sans
   réécriture de eax). A, B et Hex-Rays d'accord. NB : Hex-Rays relit
   `*(_WORD *)*a1` 3 fois (l.14/15/17) — artéfact de décompilation, le C
   réconcilié lit une seule fois (l'ASM ne relit pas [edi]).
2. **Boucle vertex** — Tranché : ordre exact = push edi/call
   `GteState_SetIndexed01_FromS16x3` @0x6A2ABD/BE → call
   `cameraRelated_usedByFields` @0x6A2AC3 → `add edi,6` @0x6A2AC9 (incrément
   AVANT les deux set, mais le push edi a déjà copié le curseur pour le call
   1) → push ebx/call `setSomeDword` @0x6A2ACC (arg = a3+0x1C) → lea
   eax,[esi+20h]/push/call `setSomeDword4` @0x6A2AD1-D5 → `add esp,0Ch`
   @0x6A2ADA. Cible de boucle = 0x6A2ABD (jnz @0x6A2B54 → loc_6A2ABD), donc
   lea ebx + push ebx + store compteur hors boucle. A, B, Hex-Rays d'accord.
3. **Secteur X + bits Y** — Tranché : X (0/1/2, écritures WORD @0x6A2AF8/B00/
   B13) : 1 si `sx < 8*[a3+0x0C]` (cmp @0x6A2AF6, jge @0x6A2AFE — SIGNED),
   sinon 2 si `sx >= 8*[a3+0x10]` (jl @0x6A2B11 — SIGNED), sinon 0. Bits
   4/8 (OR BYTE @0x6A2B28/B39) sur `sy` = [a3+0x1E] vs [a3+0x0E]/[a3+0x12]
   ×8, mêmes polarités signées. `ja` @0x6A2AE2 est unsigned mais cmp avec 0
   ⇒ équivalent `!= 0`. Toutes les bornes en `shl 3` (×8). A, B, Hex-Rays
   d'accord.
4. **Record 8 octets, stride 8** — Tranché : `mov eax,[ebx]`/`mov [ebp],eax`
   @0x6A2B3D-3F (dword a3+0x1C → out+0) puis `mov ecx,[ebx+4]`/
   `mov [ebp+4],ecx` @0x6A2B42-45 (dword a3+0x20 → out+4) ; `add ebp,8`
   @0x6A2B4C. Le dword out+4 empaquette flag(+0x20) + code(+0x22) déjà
   écrits. A, B, Hex-Rays d'accord.
5. **Chemin sans-GTE** — Tranché : `cmp word [esi+20h],0` @0x6A2ADD / `ja`
   @0x6A2AE2, sinon `mov word ptr [ebp+6], 10h` @0x6A2AE4 : SEUL out+6
   (word) reçoit 0x0010 ; out+0..5 et out+7 inchangés. A, B, Hex-Rays
   d'accord.
6. **Curseurs réécrits / retour** — Tranché : chemin normal, arg_0/arg_4
   RELUS de la pile (`mov edx,[esp+10h+arg_0]` @0x6A2B5A, `mov eax,
   [esp+10h+arg_4]` @0x6A2B5E — ecx/edx clobbered, esp décalé 10h), puis
   `mov [edx],edi` @0x6A2B63, `mov [eax],ebp` @0x6A2B66 ; retour eax = a2.
   Chemin count==0 : `mov [ecx],edi` @0x6A2B6B / `mov [edx],ebp` @0x6A2B6D
   (registres d'origine non clobbered), retour eax = -1. A, B, Hex-Rays
   d'accord (Hex-Rays `return a2` / `return result`).
7. **Slot pile arg_8 réutilisé** — Tranché : `mov [esp+10h+arg_8], eax`
   @0x6A2AB6 réécrit le slot de a3 comme compteur de boucle (esi déjà
   chargé @0x6A2AB0) ; décrémenté/restocké @0x6A2B4F-50. Invisible dans le
   C local (variable `i`). A, B, Hex-Rays d'accord (v11 chez Hex-Rays).
8. **Doute d'arité cameraRelated_usedByFields** — Tranché (modèle) : 0-arg
   comme Hex-Rays, A et B. MAIS : le push edi @0x6A2ABD n'est pas nettoyé
   individuellement — `add esp,0Ch` @0x6A2ADA purges les 3 pushes d'args
   des calls 0x6A2ABE/ACC/AD5 groupés. Au call @0x6A2AC3, le curseur est
   donc en sommet de pile : un callee cdecl 1-arg le lirait comme
   paramètre. Non tranchable depuis l'ASM de cette fonction seule →
   **UNCERTAIN 0x6A2AC3** conservé.

## 2. Divergences A vs B (présentation uniquement)

- Types de curseurs : A `short*`/`int` out, B `unsigned char*` — sans
  incidence (arithmétique identique) ; réconcilié sur `unsigned char*`.
- A écrit le early-out `return counter` (=-1) avec commentaire explicite ;
  B `return (int *)(count - 1)`. Réconcilié : `return count - 1` + note.
- B note l'adressage des relecture de pile arg_0/arg_4 au exit normal ;
  A ne le mentionne pas. Réconcilié : notes B retenues (prouvé par
  0x6A2B5A/5E).
- Aucun écart de contrôle de flux, de polarité, de largeur d'écriture ou
  d'offset.

## 3. UNCERTAIN restants (dans c_reconciled.c)

- `UNCERTAIN 0x6A2AC3` — arité réelle de `cameraRelated_usedByFields`
  (0 vs 1 arg cdecl, push edi résiduel en sommet de pile, add esp,0Ch
  groupé @0x6A2ADA). Modèle 0-arg retenu par convergence Hex-Rays+A+B.
- Consommation de la valeur de retour par les 5 callers (a2 vs -1) — pas
  de dump des callers dans le pack.
- Libellés sémantiques des coordonnées +0x1C/+0x1E et bornes +0x0C..0x12
  (l'ASM prouve offsets + comparaisons signées ×8, pas les noms ; le brief
  parent dit Y, notation neutre sx/sy adoptée).

## 4. Divergences vs Hex-Rays (hexrays.c = vérificateur)

1. **Relitures de `*a1` / `[edi]`** : Hex-Rays lit `*(_WORD *)*a1` à 3
   reprises (l.14, 15, 17) ; l'ASM lit le mot UNE fois @0x6A2A9D. Le C
   réconcilié lit une fois (les callees ne peuvent pas écrire dans le flux
   — non prouvé, mais la relecture de Hex-Rays est un artéfact de
   représentation, pas une sémantique : edi est avancé de 2 @0x6A2AA2 alors
   que Hex-Rays teste `*(_WORD *)*a1` sur le curseur NON avancé — équivalent
   ici car aucune écriture entre les deux).
2. **Chemin count==0** : Hex-Rays `return result` où `result = *a1... - 1`
   (l.14) — fidèle mais masque que eax = -1 provient du `dec` résiduel
   @0x6A2AA7. Explicite dans le réconcilié.
3. **Polarité `ja`** : Hex-Rays `if (*(_WORD *)(a3 + 32))` (l.26) masque le
   `ja` unsigned @0x6A2AE2 ; équivalent avec cmp 0, mais le réconcilié
   explicite `u16 != 0`.
4. **Chemin sans-GTE** : Hex-Rays `*(_WORD *)(v3 + 6) = 16;` (l.55) correct ;
   il ne dit pas que c'est le SEUL octet écrit du record — explicite dans
   le réconcilié.
5. **Slot pile réutilisé** : Hex-Rays `v11` en `[esp+18h] [ebp+Ch]` (l.10) —
   c'est bien le slot arg_8 décalé (frame A/B : esp+10h après push ebx) ;
   cohérent, rien à corriger.
6. **Retour normal** : Hex-Rays `return a2` (l.63) — conforme à
   `mov eax,[esp+10h+arg_4]` @0x6A2B5E.

Aucune divergence de fond Hex-Rays vs ASM détectée sur cette fonction : les
écarts 1–4 sont des implicites de représentation, tous explicités dans le
C réconcilié.

## 5. Faits structurants (rappel)

- Callers (callers.txt, more:false) : sub_685860 @0x685909, sub_68A990
  @0x68AA33, sub_697700 @0x6977A3, sub_6A2940 @0x6A29E3 (interpréteur mag FX),
  sub_6F80B0 @0x6F8153. Quatre callers de taille 0x147 — famille clonée.
- Callees (callees.txt, sans PROTOS) : GteState_SetIndexed01_FromS16x3
  @0x6A2ABE, cameraRelated_usedByFields @0x6A2AC3, setSomeDword @0x6A2ACC,
  setSomeDword4 @0x6A2AD5 ; nettoyage groupé add esp,0Ch @0x6A2ADA.
- Strides : in 6 octets/vertex (add edi,6 @0x6A2AC9), out 8 octets/record
  (add ebp,8 @0x6A2B4C), header 2 octets (add edi,2 @0x6A2AA2).
- globals.txt vide : aucun accès global direct dans le corps.
