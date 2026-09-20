# MagFx_Stage1_SnapshotPresentationActorWords @ 0x6A1280

- Instr (live): 10 (34 o, 0x6A1280-0x6A12A1)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - snapshot stage 1 du stepper mag (sub_6A0DC0) : marche les records acteurs de g_BattlePresentationActors (stride 0x9C, sentinelle fin dword_1D97704), copie en miroir le word d'etat a l'offset 0 de chaque record (zero-extend xor edx/mov dx) vers le tableau moteur unk_25102A0 stride 4 ; retour EAX = pointeur src final ; boucle signee jl
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A1280\nTYPE ; proposition: MagFx_Stage1_SnapshotPresentationActorWords
- Notes parent: checks 5.6 OK (role P) : mov ecx, offset unk_25102A0 (0x6A1280), xor edx,edx (0x6A128A), add eax,9Ch (0x6A1292), cmp offset dword_1D97704 (0x6A129A), jl signe (0x6A129F) ; 10 instr integrales ; convergence c_a/sem_a (CERTAIN pose par la voix)

## C reconcilie

```c
// =============================================================================
// sub_6A1280 — copie compacte WORD->DWORD depuis g_BattlePresentationActors
// =============================================================================
// Ground truth = live ASM (asm.asm, 10 instructions @ 0x6A1280..0x6A12A1),
// PAS Hex-Rays (hexrays.c utilisé seulement comme vérificateur ; il est
// cohérent avec l'ASM ici, y compris `result += 39` en int* = 0x9C octets).
//
// Métadonnées :
//   Instr (live) : 10   |   Taille : 0x22 (34)   |   Palier : stub mode 1+P
//   Type IDA     : 'int *()'  (cdecl implicite, aucun arg pile, aucun push/pop)
//   Sauvegardes de registres : AUCUNE (eax/ecx/edx = caller-saved, retn nu)
//   Appels       : AUCUN (pas de call, pas de add esp)
//   Caller       : sub_6A0DC0 @ 0x6A0E72 (stepper mag FX battle, stage 1 —
//                  appel juste après les BS_Memset, avant l'enregistrement
//                  du ticker)
//
// Sémantique ASM (ordre exact) :
//   6a1280  mov ecx, offset unk_25102A0              ; dst = 0x25102A0
//   6a1285  mov eax, offset g_BattlePresentationActors ; src = base tableau
//   6a128a  xor edx, edx                             ; (tête de boucle) edx = 0
//   6a128c  add ecx, 4                               ; dst += 1 dword
//   6a128f  mov dx, [eax]                            ; lit WORD [src], zero-ext
//   6a1292  add eax, 9Ch                             ; src += 0x9C (156 octets)
//   6a1297  mov [ecx-4], edx                         ; store DWORD (16 bits + 0)
//   6a129a  cmp eax, offset dword_1D97704            ; borne fin du tableau src
//   6a129f  jl  short loc_6A128A                     ; signé
//   6a12a1  retn
//
// Points d'ancre :
//   - Stride source : 0x9C (156 octets) par élément de g_BattlePresentationActors.
//   - Le store écrit un DWORD complet mais les 16 bits hauts sont toujours 0
//     (xor edx,edx en tête de boucle + mov dx = zéro-extension).
//   - Comparaison de sortie SIGNED (jl) — les deux adresses < 0x80000000, ok.
//   - L'ordre ASM est add ecx,4 PUIS mov [ecx-4],edx : reproduit tel quel
//     ci-dessous (dst += 1 ; *(dst-1) = v).
//   - Valeur de retour : eax = pointeur src final après sortie de boucle.
// =============================================================================

// Externes : adresses live, rôles non prouvés au-delà de ce qui est visible.
extern unsigned int g_BattlePresentationActors; // base du tableau src, stride 0x9C
extern unsigned int dword_1D97704;              // borne de fin (1re adresse >= fin)

int *sub_6A1280(void)
{
    unsigned int *dst; // ecx — curseur d'écriture, démarre à unk_25102A0 (0x25102A0)
    unsigned int *src; // eax — curseur de lecture, démarre à g_BattlePresentationActors
    unsigned int v;    // edx — WORD zero-étendu

    dst = (unsigned int *)0x25102A0;             // mov ecx, offset unk_25102A0
    src = (unsigned int *)&g_BattlePresentationActors; // mov eax, offset ...

    do
    {
        v = *(unsigned short *)src;                    // xor edx,edx ; mov dx,[eax]
        dst += 1;                                      // add ecx, 4
        src = (unsigned int *)((char *)src + 0x9C);    // add eax, 9Ch
        *(dst - 1) = v;                                // mov [ecx-4], edx (DWORD, haut=0)
    }
    while ((int)src < (int)&dword_1D97704);            // cmp eax, dword_1D97704 ; jl (signé)

    return (int *)src;                                 // retn — eax = src final
}

// UNCERTAIN 0x6A129F la boucle sort sur le premier src >= dword_1D97704 ; la
//   valeur de retour n'est exactement &dword_1D97704 que si (fin - base) est un
//   multiple de 0x9C. Adresses réelles de g_BattlePresentationActors /
//   dword_1D97704 non fournies dans le pack : divisibilité non vérifiable ici.
// UNCERTAIN 0x6A1280 sémantique du champ WORD copié (id acteur ? flags ? index
//   presentation ?) et taille exacte du tableau destination unk_25102A0 :
//   non prouvable depuis ces 10 instructions seules.
```

## Analyse semantique

# Sémantique sub_6A1280 @ 0x6A1280 (analyse A, mode aveugle)

- Rôle (1 phrase) : Snapshot en miroir — copie le mot 16 bits situé à l'offset 0 de chaque enregistrement acteur de `g_BattlePresentationActors` (stride 0x9C) vers le tableau moteur mag-FX `0x25102A0`, en dwords zéro-étendus (1 dword par acteur), boucle bornée par la fin du bloc acteurs `0x1D97704`.
- Confiance : CERTAIN (sur la mécanique structurale ci-dessus, intégralement prouvée par opcodes ; les deux sous-points non prouvés sont déclarés en questions ouvertes, ils ne portent pas sur le rôle mécanique).
- Nom catalogue : absent (stub `sub_6A1280`, type IDA `'int *()'` = artefact du EAX incidentel). Nom proposé (markdown seul, PAS de rename) : **`MagFx_Stage1_SnapshotPresentationActorWords`** — justifié par ≥2 preuves ASM adressées : (1) `0x6a1285 mov eax, offset g_BattlePresentationActors` + `0x6a1292 add eax, 9Ch` (marche par records acteurs 0x9C), (2) `0x6a129a cmp eax, offset dword_1D97704` (borne = mot caméra, fin du bloc acteurs, wiki battle-camera-architecture), (3) caller unique `0x6a0e72` dans le stepper mag `sub_6A0DC0`.

## In / Out / Effets

- **In (implicites, aucun argument stack)** : `g_BattlePresentationActors` — tableau de records acteurs de présentation, stride **0x9C** (156) octets ; champ lu = **u16 à l'offset +0** de chaque record.
- **Out** : `unk_25102A0` — tableau de **dwords** à stride **4** : `dest[i] = (uint32)word0(g_BattlePresentationActors[i])`, zéro-étendu. 7 entrées probables (0x25102A0..0x25102B8, 28 octets) — count déduit, voir ouvertes.
- **Effets** : feuille pure — 10 instructions, zéro callee, zéro accès stack frame, zéro autre global touché. Clobber EAX/ECX/EDX (caller-saved). EAX final = `0x1D97704` (pointeur de fin) : valeur incidentelle, pas un retour sémantique — le type IDA `'int *()'` est un leurre de ce point de vue.

## Preuves (ASM cité, adresses exactes)

1. `0x6a1285 mov eax, offset g_BattlePresentationActors` ; `0x6a128f mov dx, [eax]` ; `0x6a1292 add eax, 9Ch` — lecture **u16 à l'offset 0** de chaque record, **stride 0x9C** (converge avec le stride record acteurs de présentation : wiki « present/alive/visible per g_BattlePresentationActors record »).
2. `0x6a128a xor edx, edx` (tête de boucle) + `0x6a128f mov dx, [eax]` — les 16 bits hauts de EDX sont effacés à **chaque itération** → chaque dword écrit est le zéro-extend de l'u16 lu.
3. `0x6a128c add ecx, 4` + `0x6a1297 mov [ecx-4], edx` avec `0x6a1280 mov ecx, offset unk_25102A0` — destination `dest[i] = 0x25102A0 + 4*i`, **stride 4** (dwords).
4. `0x6a129a cmp eax, offset dword_1D97704` + `0x6a129f jl short loc_6A128A` — sentinelle de fin = `0x1D97704`. Le wiki (battle-camera-architecture) place à cette adresse exacte le mot de contrôle caméra/overlay dont les bits 0–6 sont le **masque 7 acteurs** re-dérivé par `sub_502020` depuis les mêmes records : l'array s'arrête donc exactement au début du bloc caméra. Convergence forte wiki↔ASM.
5. `0x6a129f jl` — comparaison **signée** : correcte ici (pointeurs .data < 0x80000000, SF==OF sur l'égalité finale), pas de piège unsigned/signed.
6. `callees.txt` vide + taille 34 octets (10 instr) — fonction feuille, aucun library call, aucun argument cdecl (rien de poussé).
7. `callers.txt` : xref code unique `0x6a0e72` dans `sub_6A0DC0` (0x46C) — le stepper mag FX, stage 1 selon contexte ; usage cohérent : figer un mot d'état par acteur avant de lancer la séquence d'effets.

## Checks

- Strides : source **0x9C** octets/record acteur ; destination **4** octets/dword. Aucun stride Hex-Rays fantôme ici (pas de ×232).
- Largeurs : lecture **u16** (`mov dx`), écriture **u32** zéro-étendue — miroir élargissant.
- Polarité : `jl` signé sur pointeurs < 2^31 — correct ; pas d'inversion.
- Largeur retour : EAX = `0x1D97704` (sentinelle de fin), incidentel ; EDX/ECX clobbered. Ne pas documenter de retour sémantique.
- Pas de bit `0x40`, pas d'occupancy groupes, pas de `Battle_GetRandomInt` impliqué — pièges §8 non applicables.

## Questions ouvertes

1. **Sémantique de l'u16 à record+0** : mot d'état acteur (visibilité/anim/modèle ?) non prouvé en aveugle — `sub_502020` lit ces records pour le masque caméra mais l'offset exact du champ présent/alive/visible n'est pas vérifiable depuis le pack.
2. **Nombre d'itérations** : 7 records fortement soutenu (masque bits 0–6 du wiki + sentinelle fin = mot caméra, base déduite `0x1D972C0 = 0x1D97704 − 7×0x9C`), mais l'adresse numérique de `g_BattlePresentationActors` n'est pas vérifiable en mode aveugle (candidates alignées 8, 9… existent arithmétiquement).
3. Rôle exact du miroir `0x25102A0` dans le moteur mag-FX (lecture par quel worker du stepper ?) — hors pack.

## IDBCOMMENT proposé

Snapshot miroir : copie le mot 16 bits d'etat (offset 0) de chaque record acteur de presentation (g_BattlePresentationActors, stride 0x9C) vers le tableau moteur 0x25102A0 en dwords zero-etendus, un par acteur, borne de fin 0x1D97704 (debut du bloc camera). Appele au stage 1 du stepper mag FX sub_6A0DC0 pour figer l'etat par acteur avant la sequence d'effets. EAX rend le pointeur de fin, valeur incidentelle sans semantique. [semantic-triple 2026-09-20]
