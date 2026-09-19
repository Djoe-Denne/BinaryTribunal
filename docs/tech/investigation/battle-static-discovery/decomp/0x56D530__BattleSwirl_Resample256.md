# BattleSwirl_Resample256 @ 0x56D530

- Instr (live): 66
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=221
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=538
- A==B: non
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=LIKELY, B=LIKELY, R=CERTAIN — convergence wiki fermée par QMD)
- Revue semantic-triple 2026-09-19: triple 2+1, C réconcilié (2 divergences A/B tranchées), 7 divergences closes contre ASM
- Push IDB: append-only [semantic-triple 2026-09-19] + save_database
- SetType: int __cdecl BattleSwirl_Resample256(int src, int pitch, int start_x, int start_y, int src_w, int src_h, int dest)
- Notes parent: 66-prefix WORD loads; DWORD dest pack (lo=px0, hi=px1). Inner 0x80×2, outer 0x100. Step = (x<<16 + sign*0xFF)>>8 after shl. Reload start_x<<16 each row (loc_56D585). EAX=0. Occupancy absente. Pas de call/add esp.

## C réconcilié

```c
// =============================================================================
// BattleSwirl_Resample256 @ 0x56D530 — C réconcilié (triple GLM, rôle R)
// =============================================================================
// Métadonnées :
//   Instr (live) : 66, plage [0x56D530 .. 0x56D5EE), taille 0xBE, base 0x400000.
//   Type IDA     : int __cdecl(int src, int pitch, int start_x, int start_y,
//                                int src_w, int src_h, int dest)
//   Palier       : swirl (BattleSwirl). Callers : BattleSwirl_CaptureFrame
//                  0x56D48E / 0x56D503 (cf. hexrays.c header).
//   Notes parent : aucun call dans le corps (callee set vide, aucun add esp à
//                  corriger). Pas de globale touchée. Occupancy 1+2 / slot
//                  0xD0 / F_CHAR 0x1D0 / GetRandomInt : absents (hors périmètre).
//
// PREAMBULE — Ground truth = live ASM (asm.asm) + ida_dump_bytes, NOT Hex-Rays.
//   hexrays.c n'est utilisé que comme vérificateur (divergences listées dans
//   reconcile_notes.md).
//
// Convention d'appel / cadre (prouvé par l'ASM) :
//   - __cdecl : retn nu @56D5ED, l'appelant nettoie les 7 args (28 octets).
//   - push ecx @56D530 = ALLOCATION du slot var_4 ([esp_entree-4]), PAS une
//     sauvegarde : le slot reçoit y_step @56D56F et est dépilé dans ecx
//     @56D5EC (ecx appelant non préservé — volatil en cdecl, sans impact).
//   - Sauvegardes réelles : ebx, ebp, esi, edi (@56D535/40/57/62, pop
//     edi/esi/ebp/ebx @56D5E8..56D5EB).
//   - Retour : EAX = 0 au retn — RÉSIDU du dernier dec (rows==1 -> dec -> 0),
//     pas une affectation. Sémantique réelle = void ; "int" IDA est trompeur.
//
// Sémantique : rééchantillonnage au plus proche voisin d'une région
// (start_x, start_y, src_w x src_h) d'une surface source 16 bpp (1 pixel =
// 1 WORD, pitch EN OCTETS, imul signé) vers un buffer dest LINÉAIRE 256x256
// px : 256 lignes x 128 dword = 0x8000 dword = 0x20000 octets écrits. ebp
// (ptr dest) n'est JAMAIS réinitialisé entre lignes -> stride sortie
// implicite 512 octets/ligne. AUCUN clamp : sar = plancher signé, un
// start_x/start_y négatif ou un balayage débordant lit hors bornes de src.
// =============================================================================

int __cdecl BattleSwirl_Resample256(int src, int pitch, int start_x, int start_y,
                                    int src_w, int src_h, int dest)
{
    // Slots pile à rôles multiples (offsets relatifs à esp à l'entrée, après
    // l'adresse de retour) — réutilisation prouvée instruction par instruction :
    //   var_4    [esp-04h] : alloué par push ecx @56D530 ; y_step 16.16 @56D56F.
    //   src_h    [esp+18h] : arg lu UNE fois @56D549 ; réécrit @56D573 = ACC_Y
    //                        16.16 (init start_y<<16), avancé @56D5DB.
    //   start_x  [esp+0Ch] : arg lu une fois @56D558 ; réécrit @56D577 = copie de
    //                        l'ACC_X initial, rechargée @56D585 à chaque ligne.
    //   start_y  [esp+10h] : arg lu une fois @56D55E ; réécrit @57B = compteur
    //                        de lignes = 0x100 (256).
    //   src_w    [esp+14h] : arg lu une fois @56D531 ; réécrit @56D595 = compteur
    //                        de colonnes = 0x80 (128), tenu EN MÉMOIRE
    //                        (pression registres), décrémenté @56D5C5.
    // Registres vivants : ebx = x_step 16.16 (constant), esi = ACC_X 16.16,
    // ebp = pointeur dest (court sur toute l'image), edi/ecx = échantillons.
    int eax, ebx, ecx, edx, esi, edi, ebp;
    int var_4;

    // ---- 56D530 push ecx (allocation var_4) ; push ebx ; push ebp ;
    // ---- push esi ; push edi ---------------------------------------------

    // 56D531  mov eax, [esp+4+src_w]
    // 56D536  shl eax, 10h             ; src_w -> fixe 16.16
    // 56D539  cdq ; 56D53A and edx, 0FFh ; 56D541 add eax, edx   (idiome /256)
    // 56D543  mov ebp, [esp+0Ch+dest]
    // 56D547  mov ebx, eax
    // 56D563  sar ebx, 8               ; x_step = src_w * 0x100 en 16.16
    eax = src_w;
    eax = eax << 16;                              // pixel -> 16.16
    edx = (eax >> 31) & 0xFF;                     // cdq+and : 0 si >=0, 0xFF sinon
    eax = eax + edx;                              // SANS EFFET : les bits 0..15 de
                                                  // (src_w<<16) sont nuls, +0/0xFF
                                                  // ne retient jamais sur le bit 16
                                                  // -> résultat EXACT src_w<<8 pour
                                                  // TOUT src_w (y compris négatif).
    ebp = dest;
    ebx = eax >> 8;                               // x_step = src_w*0x100 (16.16)

    // 56D549  mov eax, [esp+0Ch+src_h]
    // 56D54D  shl eax, 10h ; 56D550 cdq ; 56D551 and edx, 0FFh ; 56D55C add eax, edx
    // 56D566  sar eax, 8               ; y_step = src_h * 0x100 en 16.16
    eax = src_h;
    eax = eax << 16;                              // pixel -> 16.16
    edx = (eax >> 31) & 0xFF;
    eax = eax + edx;                              // même idiome, même nullité
    eax = eax >> 8;                               // y_step = src_h*0x100 (16.16)

    // 56D558  mov esi, [esp+10h+start_x]
    // 56D55E  mov edx, [esp+10h+start_y]
    esi = start_x;
    edx = start_y;

    // 56D569  shl edx, 10h             ; start_y -> 16.16 = ACC_Y initial
    // 56D56C  shl esi, 10h             ; start_x -> 16.16 = ACC_X initial
    edx = edx << 16;                              // pixel -> 16.16
    esi = esi << 16;                              // pixel -> 16.16

    // 56D56F  mov [esp+14h+var_4], eax ; var_4 = y_step
    // 56D573  mov [esp+14h+src_h], edx ; slot src_h := ACC_Y 16.16 (réutilisation)
    // 56D577  mov [esp+14h+start_x], esi ; slot start_x := ACC_X initial (copie)
    // 56D57B  mov [esp+14h+start_y], 100h ; slot start_y := compteur lignes = 256
    var_4 = eax;
    src_h = edx;
    start_x = esi;
    start_y = 0x100;

    // 56D583  jmp short loc_56D589     ; 1re entrée : esi tient déjà ACC_X
    goto loc_56D589;

loc_56D585:
    // 56D585  mov esi, [esp+14h+start_x] ; back-edge externe uniquement :
    //                                    ; RESET x par ligne (esi a été avancé
    //                                    ; 256 fois). ACC_Y n'est PAS réinitialisé :
    //                                    ; progression verticale purement incrémentale.
    esi = start_x;

loc_56D589:
    // 56D589  sar edx, 10h             ; ACC_Y -> index ligne source (plancher signé)
    // 56D58C  imul edx, [esp+14h+pitch]; x la stride source EN OCTETS (imul SIGNÉ)
    // 56D591  mov eax, [esp+14h+src]   ; base source (pointeur bytes)
    // 56D595  mov [esp+14h+src_w], 80h ; compteur colonnes = 128 (128 x 2 px = 256)
    // 56D59D  add edx, eax             ; edx = src + (ACC_Y>>16)*pitch
    edx = src_h >> 16;                            // 16.16 -> pixel (pas de clamp)
    edx = edx * pitch;                            // pitch en OCTETS
    eax = src;
    src_w = 0x80;
    edx = edx + eax;

loc_56D59F:
    // 56D59F  mov eax, esi             ; échantillon n : eax = ACC_X (AVANT avance)
    // 56D5A1  xor edi, edi             ; zéro-extension pour le chargement WORD
    // 56D5A3  sar eax, 10h             ; x_int(n) = ACC_X >> 16 (SAR signé)
    // 56D5A6  add esi, ebx             ; ACC_X += x_step   (avance 1/2)
    // 56D5A8  xor ecx, ecx             ; nullé AVANT le mov cx (bits 31..16 = 0)
    // 56D5AA  mov di, [edx+eax*2]      ; lo = pixel WORD à x_int(n)  (*2 : 16 bpp)
    eax = esi;
    edi = 0;
    eax = eax >> 16;                              // 16.16 -> index pixel (sar signé)
    esi = esi + ebx;                              // avance fixe 16.16
    edi = *(unsigned short *)(edx + eax * 2);     // zéro-extension

    // 56D5AE  mov eax, esi             ; eax = ACC_X (avancé une fois)
    // 56D5B0  sar eax, 10h             ; x_int(n+1)
    // 56D5B3  add esi, ebx             ; ACC_X += x_step   (avance 2/2)
    // 56D5B5  add ebp, 4               ; dest PRÉ-incrémenté (store vise [ebp-4])
    // 56D5B8  mov cx, [edx+eax*2]      ; hi = pixel WORD à x_int(n+1)
    eax = esi;
    eax = eax >> 16;
    esi = esi + ebx;
    ebp = ebp + 4;
    ecx = *(unsigned short *)(edx + eax * 2);     // bits 31..16 déjà nuls (xor @56D5A8)

    // 56D5BC  mov eax, [esp+14h+src_w] ; compteur tenu EN MÉMOIRE
    // 56D5C0  shl ecx, 10h             ; hi << 16   (hi = SECOND échantillon lu)
    // 56D5C3  or  ecx, edi             ; dword = (hi<<16) | lo -> 2 px consécutifs
    // 56D5C5  dec eax                  ; pose ZF
    // 56D5C6  mov [ebp-4], ecx         ; store dword (2 pixels) dans dest
    // 56D5C9  mov [esp+14h+src_w], eax
    // 56D5CD  jnz short loc_56D59F     ; 128 itérations -> 256 px par ligne
    eax = src_w;
    ecx = (ecx << 16) | edi;                      // mot HAUT = 2e sample, mot BAS = 1er
    eax = eax - 1;
    *(unsigned int *)(ebp - 4) = ecx;
    src_w = eax;
    if (eax != 0) goto loc_56D59F;

    // ---- queue de boucle externe (fin de ligne de sortie) ----
    // 56D5CF  mov edx, [esp+14h+src_h] ; edx = ACC_Y
    // 56D5D3  mov ecx, [esp+14h+var_4] ; ecx = y_step
    // 56D5D7  mov eax, [esp+14h+start_y] ; compteur lignes
    // 56D5DB  add edx, ecx             ; ACC_Y += y_step (incrémental, PAS de reset)
    // 56D5DD  dec eax                  ; pose ZF
    // 56D5DE  mov [esp+14h+src_h], edx
    // 56D5E2  mov [esp+14h+start_y], eax
    // 56D5E6  jnz short loc_56D585     ; 256 lignes -> sortie 256x256
    edx = src_h;
    ecx = var_4;
    eax = start_y;
    edx = edx + ecx;
    eax = eax - 1;
    src_h = edx;
    start_y = eax;
    if (eax != 0) goto loc_56D585;

    // ---- 56D5E8 pop edi ; 56D5E9 pop esi ; 56D5EA pop ebp ; 56D5EB pop ebx
    // ---- 56D5EC pop ecx   (dépile var_4 = y_step, valeur morte)
    // ---- 56D5ED retn
    // EAX = 0 : résidu du dernier dec (rows==1 -> 0). Sémantique = void.
    return 0;
}

// =============================================================================
// Contrôles de fidélité (réconciliation A/B vs asm.asm) :
//  - x_step = y_step = src*0x100 en 16.16, EXACT pour tout src 32 bits : le
//    +0/0xFF de l'idiome porte sur des bits bas déjà nuls, jamais de retenue
//    (56D539..56D541 / 56D550..56D55C). 256 pas de src_w*0x100 = src_w<<16 :
//    la ligne de sortie balaye exactement src_w px source (idem vertical).
//  - Ordre des échantillons : x_int(n) = (ACC_X0 + n*x_step) >> 16, n = 0..255.
//    Le 1er add esi,ebx (56D5A6) suit le sar qui charge eax (56D5A3) :
//    aucun décalage d'indice.
//  - Après une ligne : ACC_X = (start_x+src_w)<<16 -> rechargé depuis le slot
//    start_x sur le back-edge externe uniquement (56D585) ; la 1re entrée passe
//    par le jmp 56D583 SANS rechargement (esi déjà initialisé).
//  - Après l'image : ACC_Y = (start_y+src_h)<<16 (progression incrémentale pure).
//  - Divergences Hex-Rays restantes (voir reconcile_notes.md) : '/' natif au
//    lieu de l'idiome add-and-sar (équivalent en valeur), "return result" au
//    lieu de void/résidu, v10 = start_xa en fin de boucle (équivalent au
//    rechargement 56D585).
// =============================================================================
```

## Preuves et validation parent

Reprises des 5 preuves de la réconciliation R (semantic_r.md, vérifiées contre asm.asm live + IDB lecture seule) :

1. **0x56D57B** `mov [esp+14h+start_y], 100h` → boucle externe de **256 lignes** (`dec eax` 0x56D5DD / `jnz` 0x56D5E6).
2. **0x56D595** `mov [esp+14h+src_w], 80h` → boucle interne de **128 dwords = 256 texels/ligne** (`dec` 0x56D5C5 / `jnz` 0x56D5CD).
3. **Pitch en octets** : ligne source = `sar edx,10h` + `imul edx, pitch` (0x56D589/0x56D58C, imul SIGNÉ), lectures **16 bpp** `mov di/cx, [edx+eax*2]` (0x56D5AA/0x56D5B8) — le `*2` est sur l'index pixel, pas sur pitch.
4. **0x56D5C0/0x56D5C3** `shl ecx,10h` / `or ecx,edi` → pack dword **(px(x+1)<<16) | px(x)** ; store `mov [ebp-4],ecx` + `add ebp,4` (0x56D5C6/0x56D5B5) → dest contiguë.
5. **Callers byte-vérifiés** : `e8 9d 00 00 00` @0x56D48E (→ +0x9D = 0x56D530) et `e8 28 00 00 00` @0x56D503 (→ +0x28 = 0x56D530), tous deux dans `BattleSwirl_CaptureFrame` (0x56D390–0x56D523, FUNCATTR relu) ; ordre des arguments prouvé par les pushes du caller (livrable parent 0x56D390, noyau CERTAIN).

## Divergences

Résumé de reconcile_notes.md (rôle R, 8 points testés instruction par instruction contre asm.asm ; indécises : 0) :

**Divergences A/B tranchées : 2**

1. **Expression exacte des steps 16.16** — A : idiome `shl 16; cdq; and 0xFF; add; sar 8` **SANS EFFET**, exact `src_w<<8` pour tout src_w, y compris négatif ; B : `(src_w<<16)/256` round-to-zero. Tranché : **A sur le mécanisme, B sur le qualificatif** — les bits 0..15 de `src_w<<16` sont nuls, `+0/0xFF` ne retient jamais sur le bit 16 → `sar 8` @0x56D563 = `src_w<<8` exact même pour src_w négatif. C réconcilié : code de l'idiome + commentaire « SANS EFFET ».
2. **Forme du retour** — A : `return eax`, résidu du dec, sémantique réelle = void, type IDA `int` trompeur ; B : `return 0` littéral « RÉSIDU, pas une affectation ». Tranché : **B (forme) / A (diagnostic)** — aucun `mov eax, imm` de retour dans l'ASM ; dernier chemin @0x56D5DD `dec eax` → EAX=0 avant `retn` @0x56D5ED. C réconcilié : `return 0` + commentaire « résidu du dernier dec, sémantique = void ».

**Points unanimes A/B (6)**, concordance re-testée contre l'ASM : #2 reset x par ligne via back-edge externe (0x56D585) / ACC_Y purement incrémental ; #3 packing dword (hi = 2e sample lu) ; #5 pitch en octets + `imul` signé + lecture WORD `*2` ; #6 compteur colonnes tenu EN MÉMOIRE (slot `src_w` réécrit @0x56D595) ; #7 `push ecx` = allocation du scratch `var_4` (ecx appelant non préservé) ; #8 aucun clamp (lectures `sar` hors bornes possibles).

**Divergences Hex-Rays résiduelles (3)** — non corrigibles dans le C sans trahir Hex-Rays, documentées :

1. `v8 = (src_w << 16) / 256` : le `/` natif n'est pas l'idiome `cdq/and 0xFF/add/sar 8` — équivalent en valeur pour tout src_w 32 bits **sauf overflow du `shl`** (src_w ≥ 0x8000), non observable en pratique ; le live ASM est l'idiome.
2. `return result` : présente le résidu EAX=0 comme une affectation explicite ; le live ASM n'a aucun mov de retour.
3. Ne matérialise pas la distinction `jmp`/back-edge (`while(1)` avec `v10 = start_xa` en fin de boucle) — équivalent sémantiquement, mais masque que le rechargement `start_x` n'arrive pas à la 1re itération.

Taille du livrable : 66 instructions → pas de découpage par région nécessaire (< 600 instr.).
