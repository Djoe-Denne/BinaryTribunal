# MagFX_Step_PosVel_PushOtNodeB4 @ 0x6A38B0

- Instr (live): 56 (183 o, 0x6A38B0-0x6A3966)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - stepper par-frame d'un node mag FX (2 xrefs data dans sub_6A1660 @0x6a22a1/0x6a232e) : alloue un buffer scratch 0xB4 (bs_modulo/Unwind), init +0x00 = &unk_11823C8, +0x24 = 0, +0x04 = (word)dword_11823D0 - (sext8)p[0x17], insere en tete (sub_571C80(buf, g_BattleOTBase+0x44, 2, dword_2510258), puis dword_2510258 = buf), decremente le compteur p[0x17] (0 -> retour 2), sinon ajoute 4 x sext8(p[0x14/15/16]) aux words +0x0C/0E/10 et retourne 0 ; appel initial sub_571BC0(p+0x0C, w12, -(w12 sar 2))
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A38B0\nTYPE ; proposition: MagFX_Step_PosVel_PushOtNodeB4
- Notes parent: checks 5.6 OK (role P) : mov edi,dword_11823D0 (0x6A38B7), sar ecx,2 (0x6A38C7), sub_571BC0 (0x6A38CF), push 0B4h (0x6A38D4), unk_11823C8 (0x6A38DE), movsx dx,[esi+17h] (0x6A38E4), add edx,44h (0x6A3902), sub_571C80 (0x6A3909), push 0B4h (0x6A390E), counter mov/dec/store (0x6A391D-25), shl x3 (0x6A3942-4A) ; divergence corrigee g_BattleOTBase+0x44 octets (pas +17) ; convergence c_a/sem_a CERTAIN

## C reconcilie

```c
// c_a.c — voix c_a, reconstruction C depuis l'ASM live.
// Ground truth = live ASM (asm.asm @ 0x6a38b0..0x6a395b, 56 instr, taille 0xAC = 172 octets), PAS Hex-Rays.
// Type IDA : sub_6A38B0, __cdecl, 1 arg (a1 = ptr état FX, esi).
// Sauvegardes de registres : ebx, esi, edi (push à l'entrée, pop sur les DEUX épilogues).
// Retour : eax 32 bits, valeurs 0 (en cours) ou 2 (compteur écoulé).
// Stack des calls : 9 dwords poussés au total (3 pour sub_571BC0, 1 pour bs_modulo,
//   4 pour sub_571C80, 1 pour BattleScratch_Unwind) — nettoyage en bloc par `add esp, 24h`
//   @ 0x6a3920, AVANT le dec/jnz → présent sur les deux chemins de retour. Tous les callees
//   sont donc appelés en cdecl (callee ne nettoie pas), args poussés droite→gauche.

#include <stdint.h>

// ---- Externes (noms IDA conservés : rôles non prouvés ici) ----
extern uint32_t dword_11823D0;      // global 32 bits ; seul DI (16 bits bas) est utilisé ici
extern uint32_t dword_2510258;      // tête de liste (liée) — mise à jour avec le nouveau buffer
extern uint32_t g_BattleOTBase;     // base OT battle
extern uint32_t unk_11823C8;        // ancre stockée en premier dword du buffer alloué
extern uint32_t sub_571BC0(uint32_t a1, uint32_t a2, uint32_t a3); // (ptr, word, delta) — rôle inconnu
extern uint32_t bs_modulo(uint32_t nbytes);                        // 0x5082B0 : alloc scratch, retourne ptr
extern uint32_t sub_571C80(uint32_t a1, uint32_t a2, uint32_t a3, uint32_t a4); // (buf, otEntry, 2, prevHead)
extern uint32_t BattleScratch_Unwind(uint32_t nbytes);             // inverse de bs_modulo (bump dword_1D999C4)

// ---- Struct état FX pointée par a1 (esi) ----
// +0x0C : word (axe 1, probablement X)   <- cible des deltas, aussi passée à sub_571BC0
// +0x0E : word (axe 2, probablement Y)
// +0x10 : word (axe 3, probablement Z)
// +0x12 : word — lu au départ, passé à sub_571BC0 avec -(val >> 2)
// +0x14 : int8 — delta axe 1 (x4 par frame)
// +0x15 : int8 — delta axe 2 (x4 par frame)
// +0x16 : int8 — delta axe 3 (x4 par frame)
// +0x17 : uint8 — compteur de frames restantes (décrémenté chaque appel ; ==0 -> retour 2)

int __cdecl sub_6A38B0(void *a1)
{
    uint8_t *p = (uint8_t *)a1;                    // esi
    uint32_t edi = dword_11823D0;                  // 6a38b7 : chargé 32 bits, seul DI sert ensuite

    // 6a38bd..6a38cf : sub_571BC0(p+0x0C, word[a1+0x12], -(word[a1+0x12] SAR 2))
    uint16_t w12 = *(uint16_t *)(p + 0x12);        // mov ax, [esi+12h]
    int32_t  sx12 = (int16_t)w12;                  // movsx ecx, ax
    int32_t  shr2 = sx12 >> 2;                     // SAR (arithmétique, plancher) — PAS une division C exacte
                                                   //   ex : sx12 = -6 -> SAR 2 = -2, mais -6/4 == -1 en C
    int32_t  arg3 = -shr2;                         // neg ecx
    sub_571BC0((uint32_t)(p + 0x0C), (uint32_t)w12, (uint32_t)arg3);
    // UNCERTAIN 0x6a38cd : arg2 poussé en 32 bits avec les 16 bits hauts de eax STALE
    //   (mov ax, [esi+12h] ne touche que ax). Le callee lit-il un word ou un dword ?

    // 6a38d4..6a38e4 : alloc scratch 180 octets + init
    uint32_t buf = bs_modulo(0xB4);                // 0xB4 = 180
    *(uint32_t *)buf = (uint32_t)(uintptr_t)&unk_11823C8; // 6a38de : ancre/tête en +0x00
    *(uint16_t *)(buf + 0x24) = 0;                 // 6a38eb : word à +0x24 = 0
    // 6a38e4..6a38f1 : edi (32 bits) -= sext8(p[0x17]) ; SEUL DI (16 bits bas) est stocké
    *(uint16_t *)(buf + 0x04) = (uint16_t)(edi - (int32_t)(int8_t)p[0x17]);

    // 6a3901..6a3913 : insertion en tête de liste + OT
    uint32_t otEntry = g_BattleOTBase + 0x44;      // add edx, 44h
    // NOTE Hex-Rays : HR écrit « g_BattleOTBase + 17 » — FAUX. ASM live = 0x44 (= 68).
    sub_571C80(buf, otEntry, 2, dword_2510258);    // args poussés : ecx(prev), 2, edx(ot), eax(buf) -> droite->gauche
    dword_2510258 = buf;                           // 6a3913 : le nouveau buffer devient la tête
    BattleScratch_Unwind(0xB4);                    // 6a3918 : libère le scratch 180 (bump dword_1D999C4)

    // 6a391d..6a3932 : décompte du compteur de frames
    uint8_t cnt = p[0x17];                         // mov al, [esi+17h]
    cnt = (uint8_t)(cnt - 1);                      // dec al
    p[0x17] = cnt;
    if (cnt == 0)                                  // jnz saute si != 0 ; si == 0 on termine
        return 2;                                  // eax = 2 (mov eax, 2 explicite)

    // 6a3933..6a3957 : application des deltas, x4 (SHL logique 2, signe conservé via movsx)
    int32_t d15 = (int8_t)p[0x15];                 // movsx cx, byte [esi+15h]
    *(uint16_t *)(p + 0x0E) = (uint16_t)(*(uint16_t *)(p + 0x0E) + (uint16_t)(d15 << 2)); // shl ecx,2 ; add [esi+0Eh], cx
    int32_t d16 = (int8_t)p[0x16];                 // movsx dx, byte [esi+16h]
    *(uint16_t *)(p + 0x10) = (uint16_t)(*(uint16_t *)(p + 0x10) + (uint16_t)(d16 << 2)); // shl edx,2 ; add [esi+10h], dx
    int32_t d14 = (int8_t)p[0x14];                 // movsx ax, byte [esi+14h]
    *(uint16_t *)(p + 0x0C) = (uint16_t)(*(uint16_t *)(p + 0x0C) + (uint16_t)(d14 << 2)); // ebx = esi+0Ch ; shl eax,2 ; add [ebx], ax

    return 0;                                      // xor eax, eax
}

// ---- Convergence Hex-Rays vs ASM ----
// Conforme : ordre des writes buf+0x00 / buf+0x24 / buf+0x04, valeur 2 du 3e arg de
//   sub_571C80, compteur p[0x17] dec/test, deltas x4 sur p+0x0C/0x0E/0x10, retours 0/2.
// Divergence corrigée : HR « g_BattleOTBase + 17 » -> ASM = +0x44.
// HR masque la staleness des 16 bits hauts de eax (arg2 de sub_571BC0) et le fait que
//   seul DI (16 bits) de dword_11823D0 est effectivement stocké.
```

## Analyse semantique

# Sémantique sub_6A38B0 @ 0x6A38B0 (analyse A, mode B aveugle)

- Rôle (1 phrase) : Stepper par-frame d'un node mag FX battle (famille 0x6A3xxx, appelé via table de données par `sub_6A1660`) qui avance la position s16 du node par vélocités byte×4, décrémente un compteur de frames, et à chaque frame alloue un bloc scratch de 0xB4 octets, l'initialise et le passe à `sub_571C80` avec la racine OT `g_BattleOTBase+0x44` et l'ancienne tête `dword_2510258` (réécrite ensuite = chaînage/push d'un node OT par frame) ; retourne 0 (continuer) ou 2 (compteur épuisé → fin/détachement).
- Confiance : CERTAIN (pour la mécanique steppée, les offsets, les retours et le pattern d'accrochage OT — tous établis par opcodes adressés ; voir Question ouverte n°1 pour la qualification exacte de `sub_571C80`).
- Nom catalogue : aucun (sub_6A38B0 non nommé). Proposition markdown seule : `MagFX_Step_PosVel_PushOtNodeB4`.
- In / Out / Effets :
  - In : 1 arg cdecl → `esi` = ptr struct node FX. Champs lus/écrits : `+0x0C` s16 (ebx=esi+0xC, mis à jour à la fin : `add [ebx],ax`), `+0x0E` s16, `+0x10` s16 (les trois = position s16 xyz), `+0x12` s16 (lu seulement, passé à `sub_571BC0` avec `-(val sar 2)`), `+0x14`/`+0x15`/`+0x16` s8 (vélocités, `shl 2` avant addition — additions signées via movsx), `+0x17` u8 compteur de frames restantes (décrémenté à chaque frame).
  - Out : retour EAX 32 bits complet — `xor eax,eax` → 0 (continue) @0x6A3958, `mov eax,2` → 2 (fin) @0x6A392C. `jnz` sur le décrément de `[esi+0x17]` @0x6A3928.
  - Effets : (1) appel `sub_571BC0(&s->0xC, AX=[s+0x12], -([s+0x12] sar 2))` @0x6A38CF ; (2) alloc 0xB4 octets via `bs_modulo` @0x6A38D9 (scratch `dword_1D999C4`) ; (3) init bloc : `[+0]=offset unk_11823C8` @0x6A38DE, `[+0x24]=0` (word) @0x6A38EB, `[+4]=word(dword_11823D0 - (s8)[s+0x17])` @0x6A38F1 ; (4) appel `sub_571C80(bloc, g_BattleOTBase+0x44, 2, ancien dword_2510258)` @0x6A3909 puis `dword_2510258 = eax` @0x6A3913 ; (5) `BattleScratch_Unwind(0xB4)` @0x6A3918 recule le bump scratch (paire documentée avec bs_modulo) ; (6) si compteur ≠ 0 : `+0xC += (s8)[+0x14]<<2`, `+0xE += (s8)[+0x15]<<2`, `+0x10 += (s8)[+0x16]<<2` @0x6A3942–0x6A3955, retour 0.
- Preuves (ASM cité) :
  1. 0x6A38BD–0x6A38CF : `mov ax,[esi+12h]` / `lea ebx,[esi+0Ch]` / `movsx ecx,ax` / `sar ecx,2` / `neg ecx` / push ecx,eax,ebx / `call sub_571BC0` — args cdecl droite→gauche (arg1=&+0xC, arg2=AX, arg3=négatif signé), division signée (sar, pas shr).
  2. 0x6A38D4–0x6A38D9 : `push 0B4h` / `call bs_modulo` — alloc scratch de 180 octets ; callees.txt ligne 6a38d9 confirme. Wiki (battle-address-catalog 0x5082D0) : BattleScratch_Unwind = « unwind of dword_1D999C4 ; inverse of bs_modulo » — paire alloc/unwind alignée.
  3. 0x6A38F5–0x6A3913 : `mov ecx,dword_2510258` / `mov edx,g_BattleOTBase` / `add edx,44h` / push ecx / push 2 / push edx / push eax / `call sub_571C80` / `mov dword_2510258,eax` — l'ancien valeur de dword_2510258 est passée en arg4 et la nouvelle tête est écrite après le call : push-front chaîné accroché à l'OT base+0x44 (constante 2 = 3e arg, rôle exact non déterminé — probablement index/type de liste).
  4. 0x6A390E–0x6A3920 : `push 0B4h` / `call BattleScratch_Unwind` / `add esp,24h` — le bump scratch est rendu après usage ; 0x24h = 9×4 = les 9 pushes de la fonction (comptage vérifié : 0x6A38CC/CD/CE/D4, 0x6A3901/05/07/08, 0x6A390E), cohérence cdecl.
  5. 0x6A391D–0x6A3931 : `mov al,[esi+17h]` / `dec al` / `mov [esi+17h],al` / `jnz loc_6A3933` ; branche non prise → `mov eax,2` / `retn` — compteur u8 de frames, retour 2 quand épuisé (écho de « BdLinkTask_Pump : unlink on return bit 2 » du catalogue).
  6. 0x6A3933–0x6A3955 : trois `movsx` s8 de +0x14/+0x15/+0x16, chacun `shl 2` (×4) puis `add` signé dans les s16 à [esi+0xC] (via ebx), +0xE, +0x10 — intégration position = vélocité×4 par frame, polarités signées partout (movsx, pas movzx).
  7. Callers (callers.txt) : 2 xrefs de type **data** @0x6A22A1 et 0x6A232E depuis `sub_6A1660` (0x10F9 instr, CERTAIN dans decomp-function-catalog, famille mag FX 0x6A3xxx) — la fonction est référencée comme donnée (pointeur de callback stepper stocké dans les nodes), jamais appelée en direct. Aligné avec le contexte orchestrator (steppers retours 0/2).
- Checks : callees cités (sub_571BC0 @0x6A38CF, bs_modulo @0x6A38D9, sub_571C80 @0x6A3909, BattleScratch_Unwind @0x6A3918) tous présents dans callees.txt ✓ ; strides en nombres (0xB4=180, shl 2=×4, offsets 0xC/0xE/0x10/0x12/0x14–0x17, bloc +0x0/+0x4/+0x24) ✓ ; polarités signées (movsx/sar/neg/dec) ✓ ; largeur retour EAX 32 bits complet (0 ou 2, pas AL only) ✓.
- Questions ouvertes :
  1. `sub_571C80` et `sub_571BC0` (0x571BC0 indeg 324 dans le ledger, aucun des deux nommés dans le wiki ni le catalogue) : le rôle « insertion en tête de chaîne OT » est déduit du pattern d'arguments (ancien dword_2510258 en arg4, réécriture post-call, racine OT+0x44 en arg2) et non du corps du callee — à confirmer par une cellule dédiée. Idem pour la signification de l'arg3=2 et du word `[bloc+4] = dword_11823D0 - (s8)[+0x17]` (probablement un compteur global de frame/temps lu en tête de fonction @0x6A38B7).
  2. Le champ s16 `+0x12` et son passage à `sub_571BC0` avec `-(v sar 2)` : fonction inconnue, possiblement une correction/atténuation appliquée à la position — non résolu en aveugle.
  3. `unk_11823C8` (stocké à [bloc+0]) vs `dword_11823D0` (8 octets plus loin, lu comme valeur) : vraisemblablement descripteur statique + état courant du même objet global, rôle exact non tranché.

IDBCOMMENT: Stepper par-frame des nodes mag FX de la famille 0x6A3xxx (reférence data depuis sub_6A1660). Avance la position s16 a +0C/+0E/+0x10 par les velocities s8 a +14/+15/+16 fois 4, decremente le compteur de frames a +17, et pousse chaque frame un bloc scratch de 180 octets chaine sur dword_2510258 avec la racine OT g_BattleOTBase+0x44. Retourne 0 pour continuer, 2 quand le compteur atteint zero (retrait du node). [semantic-triple 2026-09-20]
