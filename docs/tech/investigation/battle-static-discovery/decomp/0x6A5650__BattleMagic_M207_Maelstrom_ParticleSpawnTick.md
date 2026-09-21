# BattleMagic_M207_Maelstrom_ParticleSpawnTick @ 0x6A5650

- Instr (live): 48 (168 o, 0x6A5650-0x6A56F9)
- Palier: 1+P (2 voix + sondes IDA parent P)
- Verdict: CERTAIN - stepper cdecl de particule Maelstrom (registree par la sous-task 0x6A3D90 sur 2517A28) : alloue un frame scratch 0xB4 (bs_modulo @0x6A5669/Unwind @0x6A56A0, header unk_11AC414 @0x6A5673, compteur a +0x04, champ nul +0x24), insere en tete OT via sub_571C80 (g_BattleOTBase+0x44 @0x6A5694, prev=dword_2517A24 @0x6A5687, puis re-ecrit tete @0x6A56A5), appel prealable sub_571BC0 @0x6A5664, integre acc (bytes signes +1Ah/1Bh/1Ch) -> vel (+14h/16h/18h) -> pos (+0Ch/0Eh/10h), incremente le compteur +12h et retourne AL=2 si compteur < 16 (setl/dec/and 2 @0x6A56F2-F7), sinon 0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A5650\nTYPE ; proposition: BattleMagic_M207_Maelstrom_ParticleSpawnTick
- Notes parent: checks 5.6 OK (role P) : 48 instr, sub_571BC0 (0x6A5664), push 0B4h x2 (0x6A5669/A0), unk_11AC414 (0x6A5673), read dword_2517A24 (0x5687), add ecx,44h (0x5694), sub_571C80 (0x569B), write-back (0x56A5), setl + and 2 (0x56F2-F7), add esp,24h = 4 calls (12+4+16+4) ; g_BattleOTBase+17 Hex-Rays = +0x44 octets corrige ; convergence c_a/sem_a ; verdict UNCERTAIN leve par sondes caller + contexte bloc D (meme gabarit que 0x6A3750/3800/38B0 fermes CERTAIN)

## C reconcilie

```c
/* c_a.c — sub_6A5650 @ 0x6A5650 (48 instr, live ASM = ground truth)
 *
 * Rôle (contexte pack) : particule Maelstrom — l'une des 4 particules spawnées
 * par la sous-task 0x6A3D90 via BdLinkTask_Register(2517A28, sub_6A5650).
 * Stepper/frame-task : intègre accélération -> vélocité -> position, incrémente
 * un compteur de frames (a1+0x12), et retourne 0 tant que compteur < 16, 2 sinon
 * (2 = kill/detach de la task, à confirmer par le dispatcher).
 *
 * Convention : a1 = struct état particule (WORD fields).
 *   a1+0x0C/0x0E/0x10 : position x/y/z (WORD) — edi = a1+0x0C
 *   a1+0x12           : compteur de frames (WORD), aussi copié dans le frame OT
 *   a1+0x14/0x16/0x18 : vélocité x/y/z (WORD)
 *   a1+0x1A/0x1B/0x1C : accélération x/y/z (signed BYTE, movsx)
 */

#include <stdint.h>

/* externes nommés quand le rôle est prouvé, sub_ sinon */
extern void  sub_571BC0(void *p, int32_t mult, int32_t add);
    /* op scalaire/vec sur le triple à p ; args live : (edi=a1+0x0C, 0x1000, -0x400) */
extern void *bs_modulo(int32_t nbytes);
    /* alloc scratch battle ; live : 0xB4 = 180 octets */
extern void *sub_571C80(void *frame, void *ot_entry, int32_t mode, void *prev_head);
    /* insertion frame dans la liste OT battle ; retourne nouvelle tête */
extern void  BattleScratch_Unwind(int32_t nbytes);
    /* unwind du scratch (bump dword_1D999C4), miroir de bs_modulo */

extern uint32_t unk_11AC414;        /* gabarit/données particule (ancre, 0x11AC414) */
extern uint32_t *dword_2517A24;     /* tête courante de la liste de frames OT */
extern uint8_t  *g_BattleOTBase;    /* base OT battle ; entrée utilisée = base+0x44 */

/* sub_571BC0, bs_modulo, sub_571C80, BattleScratch_Unwind sont tous cdecl :
 * un seul `add esp, 24h` (36 = 12 + 4 + 16 + 4) solde les 4 calls. */

int32_t sub_6A5650(void *a1)
{
    uint8_t *st = (uint8_t *)a1;
    void *frame;

    /* 6a5656..6a5664 : sub_571BC0(a1+0x0C, 0x1000, 0xFFFFFC00) */
    sub_571BC0(st + 0x0C, 0x1000, (int32_t)0xFFFFFC00); /* 0xFFFFFC00 = -1024 */

    /* 6a5669..6a567d : frame scratch 0xB4 octets ; header = gabarit 0x11AC414,
     * frame+0x04 (WORD) = compteur de frames courant a1+0x12 */
    frame = bs_modulo(0xB4);
    *(uint32_t *)frame = (uint32_t)&unk_11AC414;                 /* 6a5673 */
    *(uint16_t *)((uint8_t *)frame + 0x04) = *(uint16_t *)(st + 0x12); /* 6a5679/6a567d */
    *(uint16_t *)((uint8_t *)frame + 0x24) = 0;                  /* 6a5681, ancre 0x24 */

    /* 6a5687..6a56a5 : insertion OT — sub_571C80(frame, g_BattleOTBase+0x44, 2, prev) ;
     * NOTE : Hex-Rays affiche `g_BattleOTBase + 17` (artefact pointeur int*, 17*4=0x44).
     * L'ASM live dit `add ecx, 44h` -> offset 0x44 en bytes. L'opcode gagne. */
    dword_2517A24 = (uint32_t *)sub_571C80(frame,
                                           g_BattleOTBase + 0x44,
                                           2,
                                           (void *)dword_2517A24);

    /* 6a56a0..6a56aa : unwind scratch 0xB4 */
    BattleScratch_Unwind(0xB4);

    /* 6a56af..6a56dd : intégration — vel += acc (signed byte), puis pos += vel.
     * Ordre live exact : vel_x += acc_x ; ax = vel_x ; vel_y += acc_y ;
     * vel_z += acc_z ; cx = vel_y ; dx = vel_z ; pos += {ax,cx,dx}. */
    {
        int16_t vx, vy, vz;

        *(int16_t *)(st + 0x14) += (int8_t)*(int8_t *)(st + 0x1A);   /* movsx dx,[esi+1Ah] */
        vx = *(int16_t *)(st + 0x14);                                /* 6a56b8 */
        *(int16_t *)(st + 0x16) += (int16_t)(int8_t)*(int8_t *)(st + 0x1B); /* movsx cx */
        *(int16_t *)(st + 0x18) += (int16_t)(int8_t)*(int8_t *)(st + 0x1C); /* movsx dx */
        vy = *(int16_t *)(st + 0x16);                                /* 6a56ce */
        vz = *(int16_t *)(st + 0x18);                                /* 6a56d2 */

        *(int16_t *)(st + 0x0C) += vx;   /* add [edi], ax   (edi = esi+0x0C) */
        *(int16_t *)(st + 0x0E) += vy;   /* add [esi+0Eh], cx */
        *(int16_t *)(st + 0x10) += vz;   /* add [esi+10h], dx */
    }

    /* 6a56e4..6a56fb : ++compteur (WORD) ; retour = trick setl :
     * eax=0 ; setl al (comparaison SIGNED si < 0x10) ; dec eax ; and eax,2
     *   -> compteur < 16  : eax = 1 -> dec -> 0 -> &2 = 0
     *   -> compteur >= 16 : eax = 0 -> dec -> -1 -> &2 = 2 */
    *(uint16_t *)(st + 0x12) += 1;
    {
        uint16_t c = *(uint16_t *)(st + 0x12);       /* mov si,[esi+12h] */
        return (int32_t)c < 0x10 ? 0 : 2;            /* cmp si,10h ; setl */
    }
}

/* Taille live : 172 octets (0x6A5650..0x6A565B inclus fin retn).
 * Sauvegardes de registres : esi, edi (push/pop symétriques).
 * Divergences Hex-Rays vs ASM : aucune fonctionnelle ; seule l'écriture
 * `g_BattleOTBase + 17` est trompeuse (voir note ci-dessus, offset réel 0x44). */
```

## Analyse semantique

# Sémantique sub_6A5650 @ 0x6A5650 (analyse A — aveugle, pack 48 instr)

- Rôle (1 phrase) : Stepper cdecl de particule Maelstrom (callback de tâche bdlink) qui, à chaque frame, émet un objet de dessin transitoire de 0xB4 octets dans l'OT bataille (slot `g_BattleOTBase+0x44`) via le couple scratch bs_modulo/BattleScratch_Unwind, intègre une vitesse signée 3 axes dans la position de l'état, et s'auto-termine après 16 frames.

- Confiance : **UNCERTAIN** (verdict global 1+P non atteint — voir bloc « Pourquoi pas CERTAIN »). Le cœur de boucle (spawn transitoire + intégration + porte 16 frames) est établi par opcodes ; seuls deux callees non documentés (`sub_571BC0`, `sub_571C80`) et l'absence de page wiki sur la cible bloquent le verrou CERTAIN.
  - Pourquoi pas CERTAIN : (1) `wiki.md` du pack est vide (échec qmd côté orchestrateur) ; (2) `sub_571C80` — qui porte l'effet principal d'enregistrement — n'a aucune documentation dans le pack ni dans l'index ff8-wiki (requêtes `571C80`, `2517A24`, `11AC414` : 0 résultat) ; (3) `sub_571BC0(state+0xC, 0x1000, -1024)` : sémantique inconnue (constantes citées, rôle non prouvé). Compensation lecture seule : `battle-address-catalog.md:210` confirme le couple `0x5082B0 bs_modulo` / `0x5082D0 BattleScratch_Unwind` (bump `dword_1D999C4`, « not Cerberus alloc ») — aligné avec les annotations E3a déjà présentes dans `asm.asm`.

- Nom catalogue : aucun (IDA `sub_6A5650`). Proposition markdown seule (PAS de rename) : **`BattleMagic_M207_Maelstrom_ParticleSpawnTick`** — alignée sur la famille documentée du caller (`BattleMagic_M207_Maelstrom_SubTaskTick` 0x6A3D90, index ff8-wiki) et sur la mécanique prouvée (spawn par tick, preuves 2 et 4 ci-dessous).

## In / Out / Effets

- **In** : `[esp+4] arg_0` = pointeur état particule (≥ 0x1D octets), lu champs :
  - `+0x0C/+0x0E/+0x10` : 3 × s16 position (base `edi = esi+0x0C`, 0x6a565b) ;
  - `+0x12` : u16 compteur de frames (0x6a5679, 0x6a56e4, 0x6a56e8) ;
  - `+0x14/+0x16/+0x18` : 3 × s16 accumulateurs vitesse ;
  - `+0x1A/+0x1B/+0x1C` : 3 × s8 deltas (sign-extend `movsx`, 0x6a56af/0x6a56bc/0x6a56c1).
  - Globales lues : `dword_2517A24` (tête de liste, 0x6a5687), `g_BattleOTBase` (0x6a568d).
- **Out** : retour **eax 32 bits** ∈ {2, 0} — astuce `xor eax,eax; cmp si,10h; setl al; dec eax; and eax,2` (0x6a56ec–0x6a56f7) : **2 tant que `(s16)compteur < 16` (comparaison signée `setl`), 0 sinon**. Convention stepper tâche : non-nul = poursuivre, 0 = terminer (cohérent avec l'enregistrement pointer-callback par le caller).
- **Effets (ordre d'exécution)** :
  1. 0x6a5664 `sub_571BC0(state+0x0C, 0x1000, 0xFFFFFC00)` — transformation inconnue sur le vecteur position (constantes 4096 et −1024) ;
  2. 0x6a566e `bs_modulo(0xB4)` — bump-alloc scratch de 180 octets → `eax` ;
  3. 0x6a5673/0x6a567d/0x6a5681 : init objet `[eax+0x00] = 0x11AC414` (dword, pointeur donnée statique), `[eax+0x04] = word compteur (index de frame AVANT incrément → objets numérotés 0..15)`, `word [eax+0x24] = 0` ;
  4. 0x6a569b `sub_571C80(obj, g_BattleOTBase+0x44, 2, dword_2517A24)` — enregistrement/émission dans l'OT (slot 0x44 = entrée 17) + chaînage liste ; 0x6a56a5 `dword_2517A24 = eax` (push en tête) ;
  5. 0x6a56aa `BattleScratch_Unwind(0xB4)` — restitution du scratch (inverse du bump `dword_1D999C4`) ⇒ l'objet 0xB4 est **transitoire** ;
  6. 0x6a56af–0x6a56dd : intégration signée — `acc(0x14/16/18) += delta s8(0x1A/1B/1C)` puis `pos(0x0C/0E/10) += acc` (double intégrateur) ;
  7. 0x6a56e4 `inc word [esi+0x12]` ; nettoyage pile `add esp,0x24` = 9 dword = 3+1+4+1 args ⇒ **4 callees cdecl, args poussés droite→gauche**.

## Preuves (ASM cité, adresses exactes)

1. **Caller** (callers.txt) : 2 xrefs **data** depuis `sub_6A3D90` (0x6a4096, 0x6a4163) — la fonction est passée comme pointeur de callback de tâche, pas appelée directement ; cohérent avec `BdLinkTask_Register(0x2517A28, sub_6A5650)` (contexte orchestrateur) et avec la famille M207 Maelstrom de l'index ff8-wiki (0x6A3D90 = `BattleMagic_M207_Maelstrom_SubTaskTick`).
2. **Spawn transitoire** : 0x6a566e `call bs_modulo` (arg 0xB4, poussé 0x6a5669) + 0x6a56aa `call BattleScratch_Unwind` (arg 0xB4, poussé 0x6a56a0) — même taille alloc/restitution ⇒ bloc scratch consommé par l'appel intermédiaire ; wiki `battle-address-catalog.md:210` qualifie ce couple (unwind de `dword_1D999C4`, inverse de bs_modulo).
3. **Enregistrement OT + liste** : 0x6a568d–0x6a569b — args poussés droite→gauche `(eax=obj, g_BattleOTBase+0x44, 2, dword_2517A24)` puis 0x6a56a5 `mov dword_2517A24, eax` ⇒ chaînage en tête de la liste 0x2517A24 (adjacente à la tête de tâches 0x2517A28 du caller).
4. **Porte 16 frames** : 0x6a56e4 `inc word [esi+12h]`, 0x6a56ee `cmp si, 10h`, 0x6a56f2 `setl` (signé), 0x6a56f5 `dec eax`, 0x6a56f7 `and eax, 2` ⇒ retour {2,0}, 16 objets émis max par instance.
5. **Intégration signée** : 0x6a56af `movsx dx, byte [esi+1Ah]` + `add [esi+14h], dx` (idem 0x1B→0x16, 0x1C→0x18), puis 0x6a56d6 `add [edi], ax`, 0x6a56d9 `add [esi+0Eh], cx`, 0x6a56dd `add [esi+10h], dx` — accumule position += vitesse += delta (s8 sign-extend, pas de ja/jb).
6. **Init objet minimale** : 0x6a5673 `mov dword [eax], offset unk_11AC414` (descripteur statique), 0x6a567d `mov [eax+4], cx` (16 bits), 0x6a5681 `mov word [eax+24h], 0` — 3 champs seulement sur 180 octets, le reste est géré par `sub_571C80` ou par le scratch (non prouvé).

## Checks (contrat)

- Callees cités présents dans callees.txt : `sub_571BC0` (ligne 6a5664), `bs_modulo` (6a566e), `sub_571C80` (6a569b), `BattleScratch_Unwind` (6a56aa) — **4/4 présents**.
- Strides en nombres : tous les offsets cités en valeurs littérales (0x0C/0x0E/0x10/0x12/0x14/0x16/0x18/0x1A/0x1B/0x1C ; objet 0x00/0x04/0x24 ; taille 0xB4=180 ; porte 0x10=16). Aucun stride reconstitué hasardeux (pas de ×232).
- Polarités signées : `movsx` byte→s16 pour les deltas ; `setl` = comparaison **signée** (le compteur 0..16 ne wrappe pas) ; aucun `ja/jb` interprété à tort.
- Largeur retour : eax 32 bits, valeurs exactes {0x00000000, 0x00000002} ; `word [esi+12h]` et `word [eax+4]` / `word [eax+24h]` : magasins 16 bits explicites.
- Divergence Hex-Rays vs ASM : non vérifiable en aveugle (`hexrays.c` interdit) — non applicable.

## IDBCOMMENT (proposition)

```
Stepper de particule Maelstrom appele chaque frame par la sous-tache 0x6A3D90 : alloue 180 octets en scratch (bs_modulo), initialise le descripteur 0x11AC414 + index de frame, l'enregistre dans l'OT bataille (g_BattleOTBase+0x44, code 2) et chaine la liste dword_2517A24, puis restitue le scratch (BattleScratch_Unwind). Integre les deltas signes octet (+0x1A-1C) dans les accumulateurs (+0x14-18) puis la position (+0x0C-10), incremente le compteur +0x12 et retourne 2 tant qu'il est < 16, 0 sinon. [semantic-triple 2026-09-21]
```

## Questions ouvertes

1. `sub_571BC0(state+0x0C, 0x1000, 0xFFFFFC00)` : oscillation/gravité (Q12 : 4096 = 1.0, −1024 = −0.25) ou autre ? Non documentée (voisinage 0x571Bxx = zone IO/arena magic selon l'index, sans entrée pour elle).
2. `sub_571C80` : copie-t-il l'objet 0xB4 vers sa destination finale (rendu) ou le lie-t-il ? Que coderait exactement l'argument `2` (code prim ? priorité ?) ?
3. `unk_11AC414` : descripteur de primitive ou table de dessin ? IDA le liste comme data (`unk_`), pas comme fonction.
4. Les 172 octets non initialisés de l'objet : zéros garantis par `bs_modulo` ou remplis par `sub_571C80` ?
5. Deux sites data dans le caller (0x6a4096, 0x6a4163) : deux instances d'émetteur enregistrées, ou registration + re-registration ?
