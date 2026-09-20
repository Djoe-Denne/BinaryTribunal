# MAG213_TwinTick_SubmitPacketOT12F @ 0x6A0BE0

- Instr (live): 49 (152 o, 0x6A0BE0-0x6A0C77)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - tick par-frame d'une tache jumelle MAG213 (borne 12) : bump-alloc d'un packet scratch 0xB4 (bs_modulo), remplissage (descripteur unk_117DAF4 @+0, compteur +0x0C, zero +0x24), insertion dans l'OT g_BattleOTBase+0x44 (tete partagee dword_2510194) via sub_571C80, appel sub_571BC0(pos, w, -(w>>2)), unwind du scratch, avance position par deltas +0x18..1C ; retour EAX 0 tant que compteur < 12 sinon 2 (unlink au pump)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A0BE0\nTYPE ; proposition: MAG213_TwinTick_SubmitPacketOT12F
- Notes parent: checks 5.6 OK (role P) : caller unique data-xref sub_69EF60 sites 0x69F854/0x69F9AE (jumelle), 4 callees comptes (bs_modulo/sub_571BC0/sub_571C80/Unwind), wiki QMD aligne bump/unwind 0x1D999C4 + unlink bit 2 ; convergence c_a/sem_a (CERTAIN pose par la voix)

## C reconcilie

```c
/* =============================================================================
 * c_a.c — sub_6A0BE0  (voix c_a, reconcilié depuis l'ASM live)
 * =============================================================================
 * Ground truth = live ASM (asm.asm @ 0x6A0BE0, 49 instr), PAS Hex-Rays.
 * EA      : 0x6A0BE0  (.text, taille 0x98)
 * Type IDA: int __cdecl sub_6A0BE0(int a1)   [Hex-Rays, à confirmer]
 * Sauvegardes: ebx, esi, edi (push au prologue, pop au retour)
 * Args    : 1 arg dword @ [esp+10h] apres prologue (arg_0 = 0)
 * Callee cleanup : les 4 calls internes sont stdcall (callee-cleanup) —
 *   total poussé par ce frame = 9 dwords = 0x24, exactement le
 *   `add esp, 24h` @ 0x6A0C5C. Aucun `add esp` après chaque call.
 * Retour  : eax 32 bits complet — 0 si (s16)[a1+0x0C] < 12 (cmp signé),
 *           sinon 2 (code stepper : 0 = continuer, 2 = tâche terminée).
 *
 * Rôle (contexte famille) : tâche mag FX battle, jumelle enregistrée par le
 * stepper MAG213 sub_69EF60 (liste 0x25101B8, facteur 0x100 vs 0x400 chez la
 * jumelle). Alloue un noeud scratch de 0xB4 octets, l'attache à l'OT battle
 * (g_BattleOTBase+0x44), avance la position de la FX de son delta, incrémente
 * le compteur de frames et rend 0/2.
 *
 * Divergence Hex-Rays vs ASM :
 *   - Hex-Rays affiche `g_BattleOTBase + 17` ; ASM live = `add ecx, 44h`.
 *     17 (décimal) × stride 4 = 0x44 : cohérent si g_BattleOTBase est typé
 *     pointeur stride 4, mais ground truth = +0x44 en octets.
 * =============================================================================
 */

/* ---- Externes (uniquement ceux présents dans asm.asm / callees.txt) ---- */
extern int  bs_modulo(int nbytes);            /* stdcall — scratch alloc, ret eax */
extern void sub_571BC0(void *node, short w, int scaled); /* stdcall, 3 args */
extern unsigned int sub_571C80(void *node, void *ot_entry, int n,
                               unsigned int prev); /* stdcall, 4 args, ret eax */
extern void BattleScratch_Unwind(int nbytes); /* stdcall — inverse de bs_modulo,
                                                 bump dword_1D999C4 */

extern unsigned int dword_2510194;            /* tête/prev de chaîne OT (liste 0x25101B8) */
extern unsigned int g_BattleOTBase;           /* base OT battle */
extern unsigned int dword_1D999C4;            /* bumpé par BattleScratch_Unwind */
extern const unsigned int unk_117DAF4;        /* handler/sprite ptr écrit dans node+0x00 */

/* Valeurs d'ancre */
#define SCRATCH_SIZE   0xB4u   /* 180 octets : bs_modulo(0xB4) / Unwind(0xB4) */
#define OT_GROUP       2       /* sub_571C80 arg2 = 2 */
#define OT_BASE_OFF    0x44    /* g_BattleOTBase + 0x44 (Hex-Rays dit "17" stride 4) */
#define FX_LIFETIME    0x0C    /* seuil de fin du compteur s16 [a1+0x0C], cmp signé */

int __cdecl sub_6A0BE0(int a1)
{
    unsigned char *fx;        /* esi = a1 (struct FX stepper) */
    unsigned char *node;      /* edi = scratch 0xB4 octets */
    unsigned char *pos;       /* ebx = a1 + 0x10 (position x,y,z en s16) */
    short w;                  /* ax */
    int scaled;               /* ecx */

    node = (unsigned char *)bs_modulo((int)SCRATCH_SIZE);          /* 6A0BE3 stdcall */
    fx  = (unsigned char *)a1;                                     /* [esp+10h] arg_0 */
    pos = fx + 0x10;                                               /* lea ebx,[esi+10h] */

    w      = *(short *)(fx + 0x16);                                /* mov ax,[esi+16h] */
    scaled = (int)w;                                               /* movsx ecx,ax */
    scaled = -(scaled >> 2);                                       /* sar ecx,2 ; neg ecx (signé) */

    sub_571BC0(pos, w, scaled);                                    /* 6A0C05 stdcall */

    *(unsigned int *)node = (unsigned int)&unk_117DAF4;            /* node+0x00 = handler */
    *(short *)(node + 0x04) = *(short *)(fx + 0x0C);               /* copie compteur frame */
    *(short *)(node + 0x24) = 0;                                   /* WORD node+0x24 = 0 */

    /* OT insert : sub_571C80(node, g_BattleOTBase+0x44, 2, dword_2510194)
     * args poussés droite->gauche @ 6A0C29..6A0C30 ; ret -> dword_2510194 */
    dword_2510194 = sub_571C80(node,
                               (void *)(g_BattleOTBase + OT_BASE_OFF),
                               OT_GROUP,
                               dword_2510194);

    BattleScratch_Unwind((int)SCRATCH_SIZE);                       /* 6A0C40 stdcall */

    /* Position += delta (3 s16 : 0x10,0x12,0x14 += 0x18,0x1A,0x1C) */
    *(short *)(pos + 0x00) += *(short *)(fx + 0x18);
    *(short *)(pos + 0x02) += *(short *)(fx + 0x1A);
    *(short *)(pos + 0x04) += *(short *)(fx + 0x1C);

    ++*(short *)(fx + 0x0C);                                       /* compteur++ */
    w = *(short *)(fx + 0x0C);                                     /* mov si,[esi+0Ch] */

    /* 6A0C69..6A0C73 : cmp si,0Ch ; setl al ; dec eax ; and eax,2
     * -> retour 0 si (s16)compteur < 12, sinon 2 (cmp SIGNED) */
    if ((short)w < (short)FX_LIFETIME)
        return 0;
    return 2;
}

/* -----------------------------------------------------------------------------
 * Notes struct FX (esi, offsets live ASM) :
 *   +0x0C : s16 compteur de frames (incrémenté, seuil 12 signé, copié node+4)
 *   +0x10 : s16[3] position (x,y,z) — stride 2, += deltas à +0x18
 *   +0x16 : s16 paramètre -> sub_571BC0(pos, w, -(w>>2))  [scaling ; facteur
 *           0x100 vs 0x400 géré côté stepper 0x69EF60, pas ici]
 *   +0x18 : s16[3] delta position
 * Noeud scratch (edi, 0xB4 octets) :
 *   +0x00 : u32 = &unk_117DAF4
 *   +0x04 : s16 copie du compteur
 *   +0x24 : s16 = 0
 *   inséré via sub_571C80 dans OT @ g_BattleOTBase+0x44, groupe 2
 * -----------------------------------------------------------------------------
 * UNCERTAIN 0x6A0C05 rôle exact de sub_571BC0(pos, w, -(w>>2)) — setup sprite/
 * transform ? (nom non résolu ; args prouvés par l'ASM seul)
 * UNCERTAIN 0x6A0C0A sémantique de unk_117DAF4 (handler de rendu ? vtable ?)
 * UNCERTAIN 0x6A0C31 sémantique exacte de sub_571C80 (insert OT vs liste
 *           0x25101B8) et du rôle de l'ancien dword_2510194 en arg4
 * ------------------------------------------------------------------------- */
```

## Analyse semantique

# Sémantique sub_6A0BE0 @ 0x6A0BE0 (analyse A, mode 1+P aveugle)

- Rôle (1 phrase) : tick par-frame d'une tâche jumelle du stepper MAG213 (0x69EF60) — soumet chaque frame un packet de rendu scratch 0xB4 à la chaîne OT `g_BattleOTBase+0x44`, avance la position de l'effet par deltas, et retourne 0 pendant 12 frames puis 2 (unlink).

- Confiance : **CERTAIN** (contrat mécanique complet : caller unique aligné, 4 callees tous présents et comptés, wiki QMD aligné sur bs_modulo/Unwind et unlink-bit-2, opcodes cités). Résidu non prouvé, sans impact sur le contrat : le détail interne de `sub_571BC0` (cf. questions ouvertes).

- Nom catalogue : absent (sub_6A0BE0 non répertorié dans le QMD ff8-wiki, aucun hit sur `6A0BE0`/`25101B8`/`2510194`/`117DAF4`).
- Nom proposé (markdown seul, PAS de rename) : **`MAG213_TwinTick_SubmitPacketOT12F`** — justifié par ≥2 preuves adressées : (1) `6a0c31 call sub_571C80` avec `g_BattleOTBase+0x44` + tête chaîne `dword_2510194` = soumission OT de rendu ; (2) `6a0c69..6a0c73` (`cmp si,0Ch` / `setl al` / `dec eax` / `and eax,2`) = contrat stepper 0/2 à 12 frames ; (3) appelant unique data-xref `sub_69EF60` (MAG213) aux sites `0x69f854` et `0x69f9ae` = enregistrement en callback des deux jumelles.

## In / Out / Effets

Prototype reconstruit (cdecl, 1 arg) :
`int __cdecl sub_6A0BE0(void *rec)` — rec = contexte de la tâche (alloué par le stepper).

In (offsets du record `rec` = [esp+14h], développés) :
- `[rec+0x0C]` (word) : compteur de frames (lu, copié dans le packet, incrémenté, comparé à 12).
- `[rec+0x10]` (word) = `ebx` : coordonnée X de l'effet (accueillie aussi par `sub_571BC0` arg1).
- `[rec+0x12]` / `[rec+0x14]` (words) : coordonnées Y / Z.
- `[rec+0x16]` (word) : paramètre w passé à `sub_571BC0` ; hauteur dérivée `h = -([rec+0x16] >>s 2)` (sar puis neg — arithmétique signée).
- `[rec+0x18]` / `[rec+0x1A]` / `[rec+0x1C]` (words) : deltas par-frame ajoutés à X/Y/Z.

Out :
- Retour **EAX 32-bit complet = 0 ou 2** (pas AL only) : 0 tant que `[rec+0x0C] < 12` (continue), 2 dès que ≥ 12 → bit 2 = unlink par le pump BdLink (catalogue 0x508420 : « unlink on return bit 2 »). Chaîne d'opcodes : `6a0c67 xor eax,eax` / `6a0c6d setl al` / `6a0c71 dec eax` / `6a0c73 and eax,2` (signé `setl`, counter 0..11 → 1→0→0 ; à 12 → 0→-1→2).
- Globales : `dword_2510194` = nouvelle tête de chaîne OT (retour de `sub_571C80`, écrit à `6a0c3b`) ; bump/unwind de `dword_1D999C4` via `bs_modulo`/`BattleScratch_Unwind`.

Effets (séquence, args cdecl poussés droite→gauche) :
1. `6a0be3 push 0B4h` → `6a0be8 call bs_modulo` : bump-alloc scratch de 0xB4 (180) octets → `edi`.
2. `6a0c05 call sub_571BC0(rec+0x10, w, -w/4)` (3 pushes : ecx, eax, ebx) : pas d'initialisation du packet (appelé AVANT les écritures `[edi]`) — opère sur le triplet de coordonnées `rec+0x10` avec (w, -w/4).
3. Remplissage packet : `6a0c0a mov dword ptr [edi], offset unk_117DAF4` (descripteur statique), `6a0c10/6a0c14 mov [edi+4], dx` (dx = word `[rec+0x0C]`), `6a0c18 mov word ptr [edi+24h], 0`.
4. `6a0c31 call sub_571C80(edi, g_BattleOTBase+0x44, 2, dword_2510194)` (4 pushes : eax, 2, ecx, edi) : insertion du packet dans l'OT rendu, entrée +0x44, clé/type 2, chaînage sur la tête persistée `dword_2510194` — partagée entre les deux jumelles.
5. `6a0c36 push 0B4h` → `6a0c40 call BattleScratch_Unwind` : libération du scratch (inverse exact du bump ; wiki : « unwind of dword_1D999C4 ; inverse of bs_modulo », 0x5082D0).
6. `6a0c51..6a0c58` : `add [ebx], dx` / `add [esi+12h], ax` / `add [esi+14h], cx` — X += `[rec+0x18]`, Y += `[rec+0x1A]`, Z += `[rec+0x1C]` (mouvement appliqué APRÈS soumission : la frame 0 rend la position initiale).
7. `6a0c5f inc word ptr [esi+0Ch]` ; `add esp, 24h` (9 dwords d'args : 1+3+4+1 — callees cdecl, nettoyage caller).

## Preuves (adresses exactes)

1. **Caller unique** (callers.txt) : `0x69f854` et `0x69f9ae`, type **data**, dans `sub_69EF60` (MAG213, taille 0xbcb) — la fonction est stockée comme callback (deux sites = les deux tâches jumelles), pas appelée en direct. Cohérent avec l'enregistrement BdLink (callback à `node+8`, catalogue 0x508360).
2. **Contrat retour stepper** : `6a0c69 xor eax,eax` / `6a0c6d cmp si, 0Ch` / `6a0c6e setl al` / `6a0c71 dec eax` / `6a0c73 and eax,2` → EAX = 0 (< 12 frames) ou 2 (≥ 12) ; aligné sur le pump BdLink 0x508420 « unlink on return bit 2 » (wiki QMD) et sur le contexte « retours 0/2 steppers ».
3. **Soumission OT rendu** : `6a0c23 mov ecx, g_BattleOTBase` / `6a0c2a add ecx, 44h` / `6a0c31 call sub_571C80` avec (packet `edi`, OT+0x44, `2`, tête `dword_2510194`) ; nouvelle tête écrite à `6a0c3b mov dword_2510194, eax` — les jumelles partagent la même chaîne via cette globale.
4. **Cycle scratch alloc/lib** : `6a0be3 push 0B4h` + `6a0be8 call bs_modulo` puis `6a0c36 push 0B4h` + `6a0c40 call BattleScratch_Unwind` — mêmes 0xB4 ; wiki QMD confirme la paire bump/unwind sur `dword_1D999C4` (bs_modulo = misnomer, pas un modulo ; « Cerberus Frame-memory-allocation claim is false »).
5. **Packet de rendu** : `6a0c0a mov dword ptr [edi], offset unk_117DAF4` (descripteur statique), `6a0c14 mov [edi+4], dx` avec `dx = [esi+0Ch]` (index de frame), `6a0c18 mov word ptr [edi+24h], 0` — remplissage minimal 0xB4 caractéristique d'un packet soumis à l'OT.
6. **Mouvement par deltas** : `6a0c45..6a0c4d` chargent `[esi+18h]`, `[esi+1Ah]`, `[esi+1Ch]` puis `6a0c51/54/58` les ajoutent à `[ebx]` (= `[rec+0x10]`), `[esi+12h]`, `[esi+14h]` — triple position animée sur la durée de vie de 12 frames.
7. **Nettoyage cdecl** : `6a0c5c add esp, 24h` = somme exacte des 9 pushes d'args (0xB4 ; 3 pour 571BC0 ; 4 pour 571C80 ; 0xB4) — pas de `ret n`, callee cdecl.

## Checks demandés

- Callees cités présents dans callees.txt : `bs_modulo` @6a0be8 ✓, `sub_571BC0` @6a0c05 ✓, `sub_571C80` @6a0c31 ✓, `BattleScratch_Unwind` @6a0c40 ✓. Aucun library call inventé.
- Strides : aucun stride structurel ici (pas de 0x1D0/0xD0) ; uniquement offsets de champs du record (0x0C, 0x10, 0x12, 0x14, 0x16, 0x18, 0x1A, 0x1C) et taille littérale 0xB4 — tous en nombres depuis l'ASM.
- Polarités : `sar`+`neg` = arithmétique **signée** (h = -(w>>2)) ; `cmp si,0Ch` + `setl` = comparaison **signée** (counter word) ; retour 2 = bit 2 = unlink (polarité confirmée wiki), retour 0 = poursuivre.
- Largeur retour : **EAX complet** (0 ou 2 via `dec eax`/`and eax,2`) — pas un retour AL-only (piège Battle_GetRandomInt non applicable ici).
- wiki.md du pack en échec (WinError 2) ; compensation QMD ff8-wiki en lecture seule : alignement (bs_modulo/Unwind 0x5082B0/0x5082D0 ; unlink bit 2 au pump 0x508420), aucune divergence trouvée.

## Questions ouvertes

- Sémantique exacte de `sub_571BC0(rec+0x10, w, -w/4)` : init/dérivée de géométrie ou de dégradé sur le triplet de coordonnées ? Non documentée (ni QMD ni callees.txt) — n'affecte pas le contrat du tick, mais reste non prouvée (sous-hypothèse LIKELY : préparation de la primitive dessinée à partir de la taille w).
- Contenu du descripteur statique `unk_117DAF4` (pointé par packet+0) : texture/forme de l'effet MAG213 — non lisible dans ce pack.
- Rôle précis du facteur jumelle 0x100 vs 0x400 : côté stepper 0x69EF60 (hors pack), probablement échelle/vitesse des deux instances partageant ce tick.
- Remarque ASM : `6a0bf3 mov ax, [esi+16h]` ne charge que le mot bas d'EAX (le haut reste celui du retour de bs_modulo) avant `push eax` @6a0c03 — l'arg2 effectif de sub_571BC0 est donc un **16-bit** (bits hauts négligés par le callee), à confirmer côté callee.

## IDBCOMMENT

Tick des taches jumelles du stepper MAG213 : alloue un packet scratch de 0xB4 via bs_modulo, le remplit (descripteur 117DAF4, compteur de frame +0Ch, zero +24h), l'insere dans la chaine OT g_BattleOTBase+0x44 (tete partagee dword_2510194) puis le libere via BattleScratch_Unwind. Avance la position (mots +10h/+12h/+14h) des deltas (+18h/+1Ah/+1Ch), incremente le compteur +0Ch et retourne 0 (EAX) tant qu'il est < 12, sinon 2 = unlink par le pump BdLink. [semantic-triple 2026-09-20]
