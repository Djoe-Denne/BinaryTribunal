# MAG_Stepper_EmitScratchPacket_OT44 @ 0x6A3800

- Instr (live): 56 (172 o, 0x6A3800-0x6A38AB)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - stepper FX magie par-tick : pas signe via sub_571BC0 (pas = -(word[+12] sar 2), sar @0x6A3817), alloue un node 0xB4 (bs_modulo @0x6A3824/Unwind @0x6A385E) lie a unk_1182534 @0x6A382E + g_BattleOTBase+0x44 (layer 2, add edx,44h @0x6A3852) + liste dword_2510258 via sub_571C80 @0x6A3859, decremente le compteur ctx[0x17] (movsx signe @0x6A3834, dec @0x6A3873-75) ; 0 -> retour 2, sinon avance la position par pas signes x4 (shl) -> retour 0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A3800\nTYPE ; proposition: MAG_Stepper_EmitScratchPacket_OT44
- Notes parent: checks 5.6 OK (role P) : sar ecx,2 (0x6A3817), sub_571BC0 (0x6A381F), push 0B4h (0x6A3824), unk_1182534 (0x6A382E), movsx dx,[esi+17h] (0x6A3834), add edx,44h (0x6A3852), sub_571C80 (0x6A3859), push 0B4h (0x6A385E), counter mov/dec/store (0x6A386D-75), shl 2 (0x6A3892) ; convergence c_a/sem_a CERTAIN (wiki QMD battle-address-catalog l.210)

## C reconcilie

```c
/* =============================================================================
 * c_a.c — sub_6A3800 @ 0x6A3800 (cellule 0x6A3800, stub, mode 1+P)
 * =============================================================================
 * Instr (live) : 56 (asm.asm, GROUND TRUTH) — taille 0xAC (172)
 * Palier       : famille mag FX battle (plage 0x6A3xxx)
 * Type IDA     : int __cdecl sub_6A3800(int a1)  [prototype Hex-Rays, non vérifié
 *                par un type IDA — meta.json: TYPE None]
 * Sauvegardes  : push ebx / esi / edi (restaurés sur les DEUX chemins de retour)
 * Purge pile   : cdecl intégral — un seul `add esp, 24h` @0x6A3870 couvre les
 *                9 dwords poussés (3 args sub_571BC0 + 1 bs_modulo + 4
 *                sub_571C80 + 1 BattleScratch_Unwind). Aucune callee stdcall.
 *
 * Préambule : Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays.
 * Hex-Rays (hexrays.c) utilisé en vérificateur uniquement ; conforme sur tous
 * les points vérifiables (movsx/sar/neg, largeurs WORD, ordre des stores).
 *
 * Rôle apparent (à confirmer par A/V/R) : step de particule FX magie. Chaque
 * appel : (1) update via sub_571BC0 d'un état 3-mots à ctx+0x0C, (2) alloue un
 * noeud de rendu 0xB4 octets (bs_modulo), l'initialise, l'accroche à l'OT
 * battle (g_BattleOTBase+0x44, layer 2) et à la liste dword_2510258, (3)
 * décrémente un compteur de vie ctx[0x17] ; compteur à 0 => retour 2 (fin),
 * sinon avance la position 3-mots par des pas *4 et retour 0.
 *
 * Référencé en DATA (pas en call) depuis sub_6A1660 (0x6A1FD2, 0x6A21F7,
 * 0x6A2285) → probable pointeur de fonction dans une table FX.
 * ========================================================================== */

#include <stdint.h>

/* ---- Globales (noms IDA) ---- */
extern uint32_t dword_118253C;  /* base (?) lue AVANT sub_571BC0 (snapshot edi)  */
extern uint32_t unk_1182534;    /* pointé par le 1er dword du noeud 0xB4         */
extern uint32_t dword_2510258;  /* tête de liste des noeuds 0xB4 (liée par
                                   sub_571C80, arg 4 = ancienne tête)           */
extern uint32_t g_BattleOTBase; /* OT battle ; entrée utilisée : base + 0x44     */
extern uint32_t dword_1D999C4;  /* bumpé par BattleScratch_Unwind (E3a)          */

/* ---- Callees (toutes cdecl, args poussés droite→gauche) ---- */
/* 0x571BC0 — 3 args : ptr état 3-mots, mot @+0x12, pas = -(mot sar 2)          */
extern void sub_571BC0(int16_t *pState, int16_t w12, int step);
/* 0x5082B0 — alloc scratch ; retour = buffer de 0xB4 octets                    */
extern void *bs_modulo(uint32_t nbytes);
/* 0x571C80 — 4 args : noeud, entrée OT, layer, prev ; retour stocké dans
   dword_2510258 (liste)                                                        */
extern void *sub_571C80(void *node, void *otEntry, int layer, void *prevHead);
/* Unwind bump dword_1D999C4 — inverse de bs_modulo (cf. commentaire ASM E3a)   */
extern void BattleScratch_Unwind(uint32_t nbytes);

/* Retour : eax 32 bits — 2 = terminé (compteur épuisé), 0 = continuer.        */
int __cdecl sub_6A3800(void *a1)
{
    uint8_t  *ctx  = (uint8_t *)a1;
    int16_t  *pPos = (int16_t *)(ctx + 0x0C);       /* ebx = esi+0Ch           */

    int32_t base = (int32_t)dword_118253C;          /* edi — snapshot AVANT
                                                       l'appel sub_571BC0      */
    int32_t w12 = (int32_t)*(int16_t *)(ctx + 0x12);/* ax = movsx word @+12h   */

    /* 6a381c: push ecx / push eax / push ebx → sub_571BC0(ebx, eax, ecx)      */
    sub_571BC0(pPos,
               (int16_t)w12,       /* push eax : seul le mot bas ([+0x12]) est
                                      défini ; demi-haut = détruit (voir
                                      UNCERTAIN 6a381f)                        */
               -(w12 >> 2));       /* movsx ; sar ecx,2 (ARITHMÉTIQUE, signé) ;
                                      neg — pas = -(mot/4) vers -l'infini      */

    /* 6a3824: push 0B4h ; call bs_modulo → eax = noeud 0xB4 octets            */
    uint8_t *node = (uint8_t *)bs_modulo(0xB4u);
    *(uint32_t *)node = (uint32_t)&unk_1182534;     /* [eax] = offset 1182534  */

    int32_t dx17 = (int32_t)*(int8_t *)&ctx[0x17];  /* movsx (signed char)     */
    base -= dx17;                                   /* edi -= dx               */
    *(uint16_t *)(node + 0x24) = 0;                 /* word store              */
    *(uint16_t *)(node + 0x04) = (uint16_t)base;    /* word store (di)         */

    /* 6a3845..6a3859: sub_571C80(node, g_BattleOTBase+44h, 2, dword_2510258)  */
    sub_571C80(node,
               (uint8_t *)g_BattleOTBase + 0x44,    /* edx = base + 44h ('D')  */
               2,
               (void *)dword_2510258);

    /* 6a385e: push 0B4h ; 6a3863: mov dword_2510258, eax ; 6a3868: call unwind */
    dword_2510258 = (uint32_t)node;                 /* nouvelle tête de liste  */
    BattleScratch_Unwind(0xB4u);

    /* 6a3870: add esp, 24h — purge des 9 pushes cdecl (voir en-tête)          */

    /* Compteur de vie : dec al ; [esi+17h] ; jnz → continuation               */
    uint8_t counter = (uint8_t)(ctx[0x17] - 1);
    ctx[0x17] = counter;
    if (counter == 0)
        return 2;                                   /* eax = 2 : séquence finie */

    /* loc_6A3883 — avance position 3-mots : += 4 * pas (signed char)          */
    /* shl (LOGIQUE) x2 sur valeurs movsx signées : équivalent *4 ici          */
    *(int16_t *)(ctx + 0x0E) += (int16_t)((int32_t)(int8_t)ctx[0x15] << 2);
    *(int16_t *)(ctx + 0x10) += (int16_t)((int32_t)(int8_t)ctx[0x16] << 2);
    pPos[0]                  += (int16_t)((int32_t)(int8_t)ctx[0x14] << 2); /* [ebx] = ctx+0Ch */
    return 0;                                       /* xor eax, eax            */
}

/* =============================================================================
 * UNCERTAIN 6a381f — demi-haut de eax poussé vers sub_571BC0 indéterminé
 *   (seul ax = word signé @ctx+0x12 est chargé) ; hypothèse : la callee ne
 *   lit que le mot bas. Signature exacte de sub_571BC0 non prouvée (pas de
 *   proto dans callees.txt).
 * UNCERTAIN sémantique — rôle de dword_118253C / unk_1182534 (base Y ? vtable
 *   de type de noeud ?) non prouvé depuis ce seul stub ; à trancher par A/V/R.
 * UNCERTAIN sémantique — signification exacte de la valeur de retour 2 vs 0
 *   (convention de la table de fx appelante dans sub_6A1660, références DATA).
 * ========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A3800 @ 0x6A3800 (analyse A, mode 1+P aveugle)

- Rôle (1 phrase) : stepper FX magie appelé à chaque tick : il alloue un packet de 0xB4 octets dans le scratch frame (bs_modulo), le remplit depuis l'état FX passé en argument, l'enregistre via sub_571C80 dans la chaîne OT à `g_BattleOTBase+0x44` (tête suivie dans `dword_2510258`), restitue le scratch (`BattleScratch_Unwind`), décrémente le compteur de vie à `[esi+0x17]`, avance trois pas signés, et retourne 0 (continuer) ou 2 (terminé).

- Confiance : CERTAIN (mécanique ASM complète ; seules les sémantiques internes de sub_571BC0/sub_571C80 restent opaques, voir Questions ouvertes)

- Nom catalogue : `sub_6A3800` = non nommé ; proposition (markdown seul, PAS de rename) :
  **`MAG_Stepper_EmitScratchPacket_OT44`** — justifié par :
  1. `6a3829 call bs_modulo` avec `push 0B4h` (packet 0xB4 alloué au scratch) et `6a3868 call BattleScratch_Unwind` (restitution, paire documentée au wiki battle-address-catalog l.210) ;
  2. `6a3852 add edx, 44h` sur `g_BattleOTBase` puis `6a3859 call sub_571C80` avec l'OT en 2e argument et `6a386d mov dword_2510258, eax` (tête de chaîne mise à jour) ;
  3. retours 0/2 (`6a387c mov eax, 2` / `6a38a8 xor eax, eax`) typiques d'un stepper enregistré comme callback — et le caller `sub_6A1660` n'y référence que par data (0x6a1fd2/0x6a21f7/0x6a2285), donc adresse stockée en table de callbacks, pas appel direct.

- In / Out / Effets :
  - **In** : `arg_0` = `esi` = pointeur état FX (stack `+8+arg_0`, `6a3802`). Layout déduit :
    - `+0x0C` / `+0x0E` / `+0x10` : trois s16 de position (steppés) ;
    - `+0x12` : s16 passé à `sub_571BC0` avec `-(v >> 2)` (sar arithmétique → signé) ;
    - `+0x14` / `+0x15` / `+0x16` : trois s8 de pas (movsx, `shl 2` = ×4) appliqués respectivement à `+0x0C` / `+0x0E` / `+0x10` ;
    - `+0x17` : u8 compteur de vie (décrémenté à chaque tick).
  - **Out** : retour EAX 32 bits : `0` = continuer, `2` = fini (vie épuisée). Largeur : dword constant, pas de partie haute parasite (`xor eax, eax` / `mov eax, 2`).
  - **Effets** :
    1. `6a381f call sub_571BC0(esi+0xC, [esi+0x12], -([esi+0x12] sar 2))` (args cdecl droite→gauche : push ecx, push eax, push ebx) ;
    2. `6a3829 call bs_modulo` avec `push 0B4h` → eax = packet 0xB4 ; `[eax+0] = offset unk_1182534`, `word[eax+4] = (u16)(dword_118253C - (s8)[esi+0x17])` (valeur dérivée de la vie restante), `word[eax+0x24] = 0` ;
    3. `6a3859 call sub_571C80(eax, g_BattleOTBase+0x44, 2, dword_2510258)` puis `dword_2510258 = eax` (chaînage tête) ;
    4. `6a3868 call BattleScratch_Unwind` (bump `dword_1D999C4` restitué, inverse de bs_modulo) ;
    5. `6a3875 [esi+0x17]--` ; si 0 → retour 2, sinon les trois s16 += (s8 pas × 4) et retour 0.
  - Globals touchées/ lues : `dword_118253C` (lu, base), `unk_1182534` (constante stockée en tête de packet), `dword_2510258` (lu puis réécrit), `dword_1D999C4` (via BattleScratch_Unwind), `g_BattleOTBase` (lu, +0x44).

- Preuves (ASM cité, adresses exactes) :
  1. `6a3802 mov esi, [esp+8+arg_0]` — l'unique argument est un pointeur d'état FX persistant (modifié in place à `+0x0E/+0x10/+0x0C/+0x17`).
  2. `6a3824 push 0B4h` + `6a3829 call bs_modulo` + `6a3868 call BattleScratch_Unwind` — paire alloc/restitution du scratch frame ; le wiki (`battle-address-catalog.md` l.210) documente `BattleScratch_Unwind` `0x5082D0` comme « unwind of dword_1D999C4; inverse of bs_modulo ». Convergence ASM ↔ wiki.
  3. `6a384b mov edx, g_BattleOTBase` / `6a3852 add edx, 44h` / `6a3857 push 2` / `6a3859 call sub_571C80` — soumission du packet dans l'OT à +0x44 avec l'argument 2 (ordre cdecl : eax, OT+0x44, 2, `dword_2510258`).
  4. `6a386d mov dword_2510258, eax` — l'ancien contenu de `dword_2510258` est passé en 4e argument (`6a3845/6a3851 push ecx`) avant d'être remplacé : chaînage en liste, pas simple écrasement.
  5. `6a3873 dec al` / `6a3875 mov [esi+17h], al` / `6a3878 jnz` / `6a387c mov eax, 2` — compteur de vie à +0x17, terminaison = 2.
  6. `6a388d movsx ax, byte ptr [esi+14h]` / `6a3892 shl eax, 2` / `6a38a5 add [ebx], ax` (avec ebx = esi+0xC depuis `6a3811`) — pas signés ×4 sur trois s16 ; tous les movsx/sar sont signés, aucune polarité ambiguë (pas de ja/jb).
  7. Callers : `sub_6A1660` (0x10F9 octets, dispatcher FX magie de la plage 0x6A3xxx) référence 0x6A3800 uniquement en data (0x6a1fd2 / 0x6a21f7 / 0x6a2285) — adresse en table de callbacks/steppers, cohérent avec les retours 0/2.
  8. `6a382e mov dword ptr [eax], offset unk_1182534` — champ en tête de packet = constante globale fixe (tag/type de packet), pas un pointeur de fonction (aucune indirection `call [eax]` dans le corps).

- Checks :
  - Callees cités présents dans callees.txt : `sub_571BC0` (l.8), `bs_modulo` (l.9), `sub_571C80` (l.10), `BattleScratch_Unwind` (l.11). ✓
  - Strides en nombres : 0xB4 (packet), ×4 (`shl 2` explicite), offsets struct 0x0C/0x0E/0x10/0x12/0x14/0x15/0x16/0x17, OT +0x44. Aucun stride Hex-Rays faux (`*232` etc.) impliqué ici. ✓
  - Polarités signées : `movsx` systématique pour les pas (+0x14/+0x15/+0x16) et `[esi+0x12]` ; `sar` arithmétique ; aucun jump conditionnel unsigned. ✓
  - Largeur retour : EAX 32 bits, valeurs 0/2 constantes. ✓
  - Aucun library call inventé ; aucun bit 0x40 ni accesseur ambigu impliqué.

- Questions ouvertes :
  1. Sémantique interne de `sub_571BC0` (init ? interpolation sur esi+0xC..0x12 ?) et de `sub_571C80` (copie du packet dans la chaîne OT ? rendu direct ?) — opaques depuis le pack, non requises pour le verdict mécanique.
  2. `BattleScratch_Unwind` restitue le bump juste après l'enregistrement : le buffer 0xB4 est donc réutilisé au tick suivant ; cela implique que `sub_571C80` copie les données (sinon la chaîne pointerait sur de la mémoire réécrite) — à confirmer en lisant sub_571C80.
  3. Signification exacte de `word[eax+4] = dword_118253C - vie_restante` (fondu ? index d'anim ?) et du s16 `[esi+0x12]` (angle ? échelle ?) : dérivés de la vie mais non résolus.
  4. Le wiki du pack (`wiki.md`) est vide (échec qmd) ; la convergence a été obtenue via QMD ff8-wiki (battle-address-catalog.md, lecture seule).

- IDBCOMMENT (proposition) :
  « Stepper FX magie : alloue a chaque tick un packet de 0xB4 octets dans le scratch frame (bs_modulo), le remplit depuis l'etat [esi+0C..17h] puis l'enregistre via sub_571C80 dans la chaine OT g_BattleOTBase+0x44 (tete dword_2510258, arg 2) avant de restituer le scratch (BattleScratch_Unwind). Decremente le compteur de vie a +17h ; renvoie 2 quand il atteint zero, sinon avance les trois pas signes +14h/+15h/+16h (x4) sur +0Ch/+0Eh/+10h et renvoie 0. [semantic-triple 2026-09-20] »
