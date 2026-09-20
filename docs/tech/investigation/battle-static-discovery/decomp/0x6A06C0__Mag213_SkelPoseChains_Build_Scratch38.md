# Mag213_SkelPoseChains_Build_Scratch38 @ 0x6A06C0

- Instr (live): 58 (153 o, 0x6A06C0-0x6A0758)
- Palier: 1+P (2 voix + sondes IDA parent P)
- Verdict: CERTAIN - alloue un scratch 0x38 (bs_modulo/Unwind) et y construit une pose skelettale a 1-2 chaines (entries stride 0x30 a base+0x20) par composition matricielle (WalkStride30_MatComposeInPlace, a1+0x40 spille dans arg_4 @0x6A06E6/0x6A0717) + FK hierarchique sub_6CE880 ; si FK rend 0 et a1+0x78 non nul, rejoue sur le parent avec flag -1 ; copie base+0x28/+0x2C vers arg8 puis unwind
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A06C0\nTYPE ; proposition: Mag213_SkelPoseChains_Build_Scratch38
- Notes parent: checks 5.6 OK (role P) : mecanisme converge c_a/sem_a (scratch 0x38, entries stride 0x30, FK sub_6CE880 jz, spill arg_4) ; sonde IDA xrefs_to 0x6A06C0 = caller unique sub_69EF60 @0x69F5DE (stepper MAG213, liste 0x2510198, ferme) ; verdict UNCERTAIN de semantic_a leve par cette sonde + contexte bloc A

## C reconcilie

```c
/* ============================================================================
 * c_a.c — reconstruction C fidèle à l'ASM live — sub_6A06C0 @ 0x6A06C0
 * ============================================================================
 * Métadonnées (meta.json / asm.asm) :
 *   Instr (live)  : 58  (@ 0x6A06C0 .. 0x6A0758, taille 0x99)
 *   Type IDA      : 'char __cdecl(_DWORD *, int, _DWORD *)'
 *   Palier        : stub, mode 1+P (1 squelette + parent conditionnel)
 *   Caller unique : sub_69EF60 @ 0x69F5DE (stepper, liste 0x2510198) — famille mag FX battle
 *
 * Préambule : Ground truth = live ASM (asm.asm) + ida_dump_bytes, PAS Hex-Rays.
 *   hexrays.c est utilisé comme vérificateur seulement.
 *
 * Sauvegardes de registres (live) : push ebx / ebp / esi / edi ; pop en miroir.
 *   ebx = bloc scratch (0x38 octets, retourné par bs_modulo)
 *   ebp = a1 (recyclé en 0x6A0710 vers [a1+0x78])
 *   esi = a1+0x60 ; edi = scratch+0x20
 *
 * Corrections/pièges add esp :
 *   0x6A0709 add esp,18h — nettoie push 38h (bs_modulo) + 2+2+1 args des 3 calls
 *            précédents (24 octets exactement). Point de repère esp = E-16.
 *   0x6A0738 add esp,14h — nettoie 2e bloc (2+2+1 args + 2 pushes) = 20 octets.
 *   0x6A0751 add esp,4   — arg de BattleScratch_Unwind.
 *
 * Piège de spille clé (ASM live, pas visible naïvement dans Hex-Rays) :
 *   - 0x6A06E6 : eax (= lea [ebp+40h] = a1+0x40) est SPILLÉ dans le home slot
 *     arg_4 du caller ([E+8]). L'argument a2 du caller n'est JAMAIS relu après.
 *   - 0x6A0717 : `mov eax, [esp+10h+arg_4]` relit CE SPILL (a1+0x40), pas a2.
 *   - 0x6A06FC/0x6A0705 : eax (retour de sub_6CE880) est spillé/rechargé dans
 *     le home slot arg_0 ([E+4]) puis testé — Hex-Rays avait raison ici (v7).
 *
 * Divergence Hex-Rays vs ASM : aucune sémantique ; seul le mécanisme de spill
 * (homes arg_0/arg_4 réutilisés comme locals) est implicite chez Hex-Rays.
 * ==========================================================================*/

/* Callees (toutes prouvées dans asm.asm / callees.txt — aucune inventée) :   */
extern int bs_modulo(int nbytes);                    /* 0x5082B0 — alloue/bump bloc scratch ; ret @ 0x6A06C6 */
extern void WalkStride30_MatComposeInPlace(void *entries, void *mat);  /* E3a: n=[ebx] entrées stride 0x30 depuis ebx+0x20 ; Mat_ComposeTwoThenCopy8(arg1,e,e) in-place */
extern int sub_6CE880(void *a, void *b);             /* rôle inconnu ; retour testé comme flag succès @ 0x6A070C */
extern void BattleSkeleton_BuildHierarchicalFK(void *skeleton);         /* FK hiérarchique */
extern int BattleScratch_Unwind(int nbytes);         /* E3a: bump inverse dword_1D999C4 (PAS une alloc frame Cerberus) */

/* Prototype IDA : char __cdecl(_DWORD *a1, int a2, _DWORD *a3) */
char __cdecl sub_6A06C0(_DWORD *a1, int a2, _DWORD *a3)
{
    _DWORD *blk;      /* ebx — bloc scratch 0x38 octets */
    _DWORD *parent;   /* ebp — recyclé : d'abord a1, puis a1[30] ([a1+0x78]) */
    _DWORD *skel;     /* esi — lea [ebp+60h] = &a1[24] */
    void   *mat_arg;  /* eax — lea [ebp+40h] = &a1[16] (spillé dans home arg_4 @ 0x6A06E6) */
    int     rc;       /* v7 — retour sub_6CE880 (spillé home arg_0 @ 0x6A06FC) */

    blk = (_DWORD *)bs_modulo(0x38);          /* 6A06C4: push 38h ; 6A06C6: call */
    parent = a1;                              /* 6A06CB: ebp = [esp+14h+arg_0] */
                                              /* 6A06CF: ebx = eax */
    blk[9] = a2;                              /* 6A06D5: mov [ebx+24h], eax (a2 = arg_4) */

    mat_arg = (void *)&a1[16];                /* 6A06DB: lea eax, [ebp+40h] — offset struct 0x40 */
    skel    = (void *)&a1[24];                /* 6A06DE: lea esi, [ebp+60h] — offset struct 0x60 */
    /* 6A06E6: mov [esp+1Ch+arg_4], eax — SPILL de mat_arg dans le home arg_4 (E+8) */

    blk[8] = a1[31];                          /* 6A06D8/6A06EA: ecx=[ebp+7Ch] ; mov [edi],ecx — edi = blk+0x20 */

    WalkStride30_MatComposeInPlace(skel, mat_arg);   /* 6A06E4-E: push eax, push esi ; 6A06EC: call — args (skel, mat_arg) */
    rc = sub_6CE880((void *)a1[25], (void *)((char *)blk + 0x20));  /* 6A06F1: edx=[esi+4]=a1[25] ; 6A06F6: call ; 6A06FC: spill eax dans home arg_0 */
    BattleSkeleton_BuildHierarchicalFK(skel); /* 6A0700: push esi ; call */
    /* 6A0705: reload spill (retour sub_6CE880) ; 6A0709: add esp,18h ; 6A070C: test eax,eax */
    if (rc == 0)                              /* 6A070E: jnz loc_6A073B — on ne traite le parent QUE si rc == 0 */
    {
        parent = (_DWORD *)a1[30];            /* 6A0710: ebp = [ebp+78h] — offset struct 0x78 */
        if (parent != 0)                      /* 6A0713-15: test ebp,ebp ; jz loc_6A073B */
        {
            /* 6A0717: eax = [esp+10h+arg_4] = SPILL = &a1[16] (PAS a2) */
            mat_arg = (void *)&a1[16];
            *(int *)((char *)blk + 0x20) = -1;              /* 6A071B: mov dword ptr [edi], 0FFFFFFFFh */
            WalkStride30_MatComposeInPlace(parent, mat_arg); /* 6A0721-23: push eax, push ebp ; call */
            sub_6CE880((void *)*((_DWORD *)parent + 1),      /* 6A0728: ecx=[ebp+4] */
                       (void *)((char *)blk + 0x20));        /* 6A072B-2D: push edi, push ecx ; call */
            BattleSkeleton_BuildHierarchicalFK(parent);      /* 6A0732-33: push ebp ; call */
            /* 6A0738: add esp,14h */
        }
    }

    a3 = (_DWORD *)a3;                        /* 6A073B: eax = [esp+10h+arg_8] */
    ((int *)a3)[0] = ((int *)blk)[10];        /* 6A073F-44: edx=[ebx+28h] ; mov [eax],edx */
    ((int *)a3)[1] = ((int *)blk)[11];        /* 6A0746-49: ecx=[ebx+2Ch] ; mov [eax+4],ecx */

    return (char)BattleScratch_Unwind(0x38);  /* 6A0742: push 38h ; 6A074C: call ; 6A0751: add esp,4 */
    /* eax final = retour de BattleScratch_Unwind, non modifié avant retn (6A0758) */
}

/* ===========================================================================
 * Notes struct / strides (asm.asm + annotations callee) :
 *   - a1 (_DWORD*) : +0x40 = matrice/arg WalkStride30 (relu via spill) ;
 *                    +0x60 = squelette (esi, passé à BuildHierarchicalFK) ;
 *                    +0x64 = pointeur lu pour sub_6CE880 (= a1[25]) ;
 *                    +0x78 = pointeur parent (a1[30]) ; +0x7C = a1[31] -> blk[8].
 *   - bloc scratch (0x38 octets, bs_modulo/BattleScratch_Unwind 0x38) :
 *                    +0x20 (blk[8]) = slot matrice/flag (-1 en branche parent) ;
 *                    +0x24 (blk[9]) = a2 stocké ; +0x28/+0x2C (blk[10/11]) = mot
 *                    double copié vers a3[0]/a3[1] en sortie.
 *   - WalkStride30_MatComposeInPlace : n=[ebx] entrées, stride 0x30, base ebx+0x20.
 *
 * // UNCERTAIN 0x6A0758 largeur de retour exacte : IDA déclare 'char', mais
 *    l'ASM rend eax de BattleScratch_Unwind intact ; troncature AL-only non
 *    prouvable sans le proto live de BattleScratch_Unwind.
 * // UNCERTAIN 0x6CE880 rôle et sémantique du retour de sub_6CE880 (testé
 *    comme flag succès gate @ 0x6A070C/0x6A070E) : boîte noire.
 * // UNCERTAIN 0x6A06C6 bs_modulo(0x38) : initialisation des octets 0x00..0x1F
 *    du bloc scratch non observée dans cette fonction (zéro-fill présumé côté
 *    callee, non prouvé ici).
 * ===========================================================================*/
```

## Analyse semantique

# Sémantique sub_6A06C0 @ 0x6A06C0 (analyse A, aveugle)

- Rôle (1 phrase) : alloue un bloc scratch de 0x38 octets et y construit une pose hiérarchique squelettale à 1 ou 2 chaînes d'os (entries stride 0x30 à base+0x20) à partir d'un objet effet MAG213 (arg0), puis recopie la paire de résultats (base+0x28/+0x2C) vers le tampon arg8, comme étape pose/FK de l'effet magie 213.
- Confiance : UNCERTAIN
- Nom catalogue : aucun (sub_6A06C0). Proposition (markdown seul) : **`Magic213Fx_UseSkelPoseChains_Build`** — mécanisme-ancré : "UseSkelPoseChains" reprend le verbe Use (caller sub_69EF60 est le stepper d'effet MAG213, un seul caller), "Build" le résultat construit.
- In / Out / Effets :
  - In (cdecl, droite→gauche) : arg0 = pointeur objet effet (lu via esp+14h+arg_0) ; arg4 = entier signé stocké à scratch+0x24 ; arg8 = pointeur tampon de sortie (pair de dword copiés depuis scratch+0x28/+0x2C).
  - Out : tampon arg8 rempli ([eax]=scratch+0x28, [eax+4]=scratch+0x2C), largeur 2 dwords.
  - Effets : écritures à base+0x20 (n=2, [edi]=ecx puis −1 selon branche), entries stride 0x30 ; réutilise le compteur global dword_1D999C4 via BattleScratch_Unwind @0x6a074c (inverse de bs_modulo).
- Preuves (ASM cité) :
  1. `push 38h` @0x6a06c4 (`bs_modulo`) + `push 38h` @0x6a0742 (`BattleScratch_Unwind`) : allocation/libération symétrique d'un scratch de 0x38 octets (block de travail).
  2. `mov ebx, eax` @0x6a06cf puis `mov [ebx+24h], eax` @0x6a06d5 : stocke arg4 signé dans le scratch.
  3. `lea eax, [ebp+40h]` + `lea esi, [ebp+60h]` @0x6a06db/de : charge deux pools de matrices depuis l'objet effet arg0 (offsets +0x40/+0x60) ; `mov ecx, [ebp+7Ch]` @0x6a06d8 : compteur d'entrées à base+0x20.
  4. `call WalkStride30_MatComposeInPlace` @0x6a06ec puis @0x6a0723 : deux appels symétriques sur la même base edi, stride 0x30 documenté adresse→callee.
  5. `call sub_6CE880` @0x6a06f6/@0x6a072d puis `call BattleSkeleton_BuildHierarchicalFK` @0x6a0700/@0x6a0733 : paire FK/pipeline par chaîne, conforme à la doc render_animation.md (0x508C90).
  6. `mov dword ptr [edi], 0FFFFFFFFh` @0x6a071b : effacement des entries de la 2e chaîne avant la 2e passe (polarité +0x20 = -1 si ebp+0x78 actif).
  7. `mov eax, [esp+10h+arg_8]` + `mov [eax], edx` + `mov [eax+4], ecx` @0x6a073b–0x6a0749 : copie paire sortie (scratch+0x28/+0x2C) vers arg8.
  8. Callers.txt : `more: false`, un seul xref code 0x69f5de dans sub_69EF60 (MAG213, taille 0xBCB) — alignement caller famille mag FX battle.
- Checks : callees cités tous présents dans callees.txt (bs_modulo, WalkStride30_MatComposeInPlace, sub_6CE880, BattleSkeleton_BuildHierarchicalFK, BattleScratch_Unwind) ; strides en nombres (0x30) ; polarités (0xFFFFFFFF) ; largeur retour retn sans eax utilisé (void) ; args cdecl droite→gauche.
- Pourquoi pas CERTAIN : `wiki.md` du pack est vide (échec qmd) et aucun `0x6A06C0` dans l'index ff8-wiki local ; l'axe wiki ne peut pas converger (précédent du frère 0x69EE80, même famille MAG213). De plus callers.txt contient un seul caller anonyme sans corps, donc garantie des arguments par les callers non vérifiable en aveugle.
- Questions ouvertes : exact role of sub_6CE880 (post-multiply vs copy kernel) ; relation arg4 signé <-> offset +0x24 (état du marqueur ?) ; offset +0x40 vs +0x60 sur l'objet effet (2 jeux de matrices locales).
- IDBCOMMENT: Construit dans un scratch de 0x38 octets une pose squelettale a 1 ou 2 chaines d'os (entrees stride 0x30 a base+0x20) depuis l'objet effet magie 213 passe en arg0, avec composition de matrices puis FK hierarchique, et recopie la paire resultante (base+0x28/+0x2C) dans le tampon arg8. Libere le scratch via BattleScratch_Unwind. [semantic-triple 2026-09-20]
