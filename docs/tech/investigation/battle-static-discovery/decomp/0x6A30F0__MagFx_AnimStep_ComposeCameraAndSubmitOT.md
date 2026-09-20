# MagFx_AnimStep_ComposeCameraAndSubmitOT @ 0x6A30F0

- Instr (live): 99 (294 o, 0x6A30F0-0x6A3215)
- Palier: 2+1
- Verdict: LIKELY - step de tick FX magie enregistre en callback dans sub_6A1660 (xref data 0x6A18AA) : alloue un scratch 0x98 (bs_modulo), y compose deux matrices Q12 (rotX sur s[1C] x16 et builder sub_6A3220 sur s[1D] x16), copie la position s[0C/0E/10] sign-extendee, puis compose le tout avec la matrice vue camera dword_1D97778 ; soumet l'objet dans l'OT battle g_BattleOTBase+0x44 couche 2 via sub_572200 (tete dword_2510258), libere le scratch, avance pos/deltas/angles avec amortissement neg+sar 1 si nouvelle posY >= 0 ; retour EAX : 2 si compteur s[1B] atteint 0 (jnz ZF pur), sinon 0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A30F0\nTYPE ; proposition: MagFx_AnimStep_ComposeCameraAndSubmitOT
- Notes parent: checks 5.6 OK : push dword_1D97778 + Mat_ComposeTwoThenCopy8 (0x6A3147-4F), add ecx,44h (0x6A3179), sub_572200 (0x6A3180), write-back dword_2510258 (0x6A3188), mov di,[esi+0Eh] clobber (0x6A31BF), movsx/neg/sar amortissement (0x6A31E5-EA), pop edi vrai restore (0x6A31F7), adds 16 bits (0x6A31F5/0x6A320A), caller data xref sub_6A1660 @0x6A18AA

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A30F0  (pipeline triple 2+1 : voix A + voix B,
 * réconciliées contre l'ASM live. Ground truth = live ASM (asm.asm), NOT
 * Hex-Rays (hexrays.c = vérificateur seulement).
 * ============================================================================
 * Instr (live) : 99
 * Plage        : 0x6A30F0 .. 0x6A3215  (size 0x126 = 294 octets)
 * Type IDA     : None (sub_6A30F0, pas de prototype IDB)
 * Hex-Rays     : int __cdecl sub_6A30F0(int a1) — vérificateur seulement.
 * Convention   : __cdecl, 1 arg (arg_0 @ [esp+14h] après les 4 pushes) =
 *                pointeur struct état `s`. Le caller nettoie son push (cdecl).
 * Sauvegardes  : ebx, ebp, esi, edi (push 0x6A30F0..0x6A30F3).
 * Retour       : int via EAX — 2 si compteur s[0x1B] atteint 0 après dec,
 *                0 sinon (xor eax,eax @0x6A320C).
 *
 * Cleanup pile : UNIQUE et différé — `add esp, 44h` @0x6A3185 purge exactement
 *   les 17 pushes d'args (17*4 = 0x44) effectués de 0x6A30F4 à 0x6A317F ;
 *   puis `add esp, 4` @0x6A319A pour le push 98h de BattleScratch_Unwind.
 *   Décompte des pushes d'args (0x6A30F4..0x6A317F) :
 *     98h(6a30f4), ebp(6a310f), eax(6a3110), ecx(6a3114), ebx(6a3125),
 *     edx(6a3126), ebp(6a312c), ebx(6a312d), ebx(6a313a), ebx(6a3142),
 *     offset 1D97778(6a3147), ebx(6a3154), ebx(6a315a), eax(6a3178),
 *     2(6a317c), ecx(6a317e), edi(6a317f)  = 17 → 0x44. Exact.
 *
 * Caller (callers.txt) : 1 seul xref, type DATA, depuis sub_6A1660 @0x6A18AA
 *   (entrée de table de pointeurs de fonction — dispatch FX mag battle).
 *
 * Layout buffer scratch (edi, 0x98 octets, bs_modulo/BattleScratch_Unwind) :
 *   +0x00 : dword = &unk_1183FA4            @0x6A3160
 *   +0x1C : dword = 0                       @0x6A3166
 *   +0x58 : matrice rotX Q12 puis produit   [ebx] (6a311f)
 *   +0x6C/+0x70/+0x74 : 3 dwords sign-extend de (int16)s[0x0C/0x0E/0x10]
 *   +0x78 : 2e matrice Q12                  [ebp] (6a310c)
 * ==========================================================================*/

#include <stdint.h>

/* Callees prouvés par asm.asm / callees.txt — aucun prototype IDA dispo. */
extern void *bs_modulo(uint32_t nbytes);              /* 0x6A30F9 bump scratch */
extern void  BattleScratch_Unwind(uint32_t nbytes);   /* 0x6A3192 inverse bump */
extern void  sub_6A3220(int a0, int a1, void *a2);    /* 0x6A3115 */
extern void  Mat3S16_MakeRotX_Q12(int angle, void *m);/* 0x6A3127 m00=0x1000, m11=m22=cos, m12=sin, m21=-sin */
extern void  Mat3S16_MulQ12_IntoArg0(void *dst, void *src); /* 0x6A312E résultat dans arg0 */
extern void  Mat_ComposeTwoThenCopy8(void *a0, void *a1, void *a2); /* 0x6A314F */
extern void  Field_readCaPre(void *a0);               /* 0x6A3155 */
extern void  preCamReadVariables_Space(void *a0);     /* 0x6A315B */
extern uint32_t sub_572200(void *buf, void *otSlot, int layer, uint32_t head); /* 0x6A3180 */

/* Globales (globals.txt + asm) */
extern const uint32_t unk_1183FA4;   /* adresse prise → buf+0x00 */
extern uint32_t dword_1D97778;       /* adresse prise, arg0 ComposeTwoThenCopy8 */
extern uint32_t dword_2510258;       /* lue puis réécrite (tête chaîne OT) */
extern uint32_t g_BattleOTBase;      /* lue ; slot = +0x44 OCTETS (add ecx,44h @6a3179) */

int __cdecl sub_6A30F0(int a1)
{
    uint8_t *s   = (uint8_t *)a1;
    uint8_t *buf = (uint8_t *)bs_modulo(0x98);   /* push 98h @6a30f4 ; edi=eax @6a3102 */
    uint8_t *m2  = buf + 0x78;                   /* lea ebp,[edi+78h] @6a310c */
    uint8_t *mrot= buf + 0x58;                   /* lea ebx,[edi+58h] @6a311f */

    /* --- 2 matrices Q12 --------------------------------------------------- */
    /* pushes ebp(6a310f)=arg2, eax(6a3110)=arg1, ecx(6a3114)=arg0 (droite→gauche) */
    sub_6A3220((int)(int8_t)s[0x1D] * 16,               /* movsx ecx,byte [esi+1Dh] @6a3104 ; shl ecx,4 @6a3111 */
               (int32_t)(int16_t)*(int16_t *)&s[0x20],  /* movsx eax,word [esi+20h] @6a3108 */
               m2);

    Mat3S16_MakeRotX_Q12((int)(int8_t)s[0x1C] * 16,     /* movsx dx,byte [esi+1Ch] @6a311a ; shl edx,4 @6a3122 */
                         mrot);                          /* push ebx(6a3125)=arg1, push edx(6a3126)=arg0 */

    /* push ebp(6a312c)=arg1, push ebx(6a312d)=arg0 → produit dans buf+0x58 */
    Mat3S16_MulQ12_IntoArg0(mrot, m2);                  /* call @6a312e */

    /* --- position caméra : 3 words signés → dwords (sign-extend au store) -- */
    *(int32_t *)&buf[0x6C] = (int32_t)(int16_t)*(int16_t *)&s[0x0C]; /* movsx @6a3133 ; mov [edi+6Ch] @6a3137 */
    *(int32_t *)&buf[0x70] = (int32_t)(int16_t)*(int16_t *)&s[0x0E]; /* movsx @6a313b ; mov [edi+70h] @6a313f */
    *(int32_t *)&buf[0x74] = (int32_t)(int16_t)*(int16_t *)&s[0x10]; /* movsx @6a3143 ; mov [edi+74h] @6a3147 */

    /* --- compose avec le bloc vue caméra dword_1D97778 --------------------- */
    /* pushes ebx(6a313a)=arg2, ebx(6a3142)=arg1, offset 1D97778(6a3147)=arg0 */
    Mat_ComposeTwoThenCopy8(&dword_1D97778, mrot, mrot); /* call @6a314f */

    Field_readCaPre(mrot);             /* push ebx @6a3154 */
    preCamReadVariables_Space(mrot);   /* push ebx @6a315a */

    *(uint32_t *)&buf[0x00] = (uint32_t)&unk_1183FA4;    /* @6a3160 */
    *(uint32_t *)&buf[0x1C] = 0;                          /* @6a3166 */

    /* --- append OT battle (couche 2), tête chaîne dword_2510258 ------------ */
    /* pushes eax(6a3178)=arg3, 2(6a317c)=arg2, ecx(6a317e)=arg1, edi(6a317f)=arg0.
     * arg1 = g_BattleOTBase + 0x44 OCTETS (add ecx,44h @6a3179). Hex-Rays écrit
     * "g_BattleOTBase + 17" — artefact de typage pointeur (17*4=0x44) ; le
     * déplacement brut ASM fait foi. */
    dword_2510258 = sub_572200(buf, (uint8_t *)g_BattleOTBase + 0x44, 2, dword_2510258);
    /* add esp, 44h @6a3185 — cleanup unique des 17 pushes cdecl */

    BattleScratch_Unwind(0x98);        /* push 98h @6a318d ; add esp,4 @6a319a */

    /* --- compteur d'frames s[0x1B] (byte) ---------------------------------- */
    /* mov al,[esi+1Bh] @6a3197 ; dec al @6a319d ; mov [esi+1Bh],al @6a319f ;
     * jnz @6a31a2. Test ZF pur : à 0 (exactement) → return 2 @6a31a7 (eax=2).
     * Aucune polarité signée ici (jnz, pas jg/jl) ; wrap 0→0xFF continue. */
    if (--s[0x1B] == 0)
        return 2;

    /* --- mise à jour per-frame (loc_6A31AE) -------------------------------- */
    {
        uint8_t b1E = s[0x1E];                    /* mov dl @6a31ae */
        uint8_t b1C = s[0x1C];                    /* mov al @6a31b1 */
        uint8_t b1D = s[0x1D];                    /* mov bl @6a31b4 */
        int16_t w14 = *(int16_t *)&s[0x14];       /* mov cx @6a31b7 (ancien delta Y) */
        int16_t w16 = *(int16_t *)&s[0x16];       /* mov dx @6a31c5 (ancien delta Z) */
        int16_t w12 = *(int16_t *)&s[0x12];       /* mov ax @6a31d5 (ancien delta X) */

        *(int16_t *)&s[0x0E] = (int16_t)(*(int16_t *)&s[0x0E] + w14); /* add [esi+0Eh],cx @6a31bb */
        int16_t w0E = *(int16_t *)&s[0x0E];       /* mov di,[esi+0Eh] @6a31bf (nouvelle valeur) */

        s[0x1C] = (uint8_t)(b1C + b1E);           /* add al,dl @6a31c3 ; mov [esi+1Ch] @6a31cd */
        *(int16_t *)&s[0x10] = (int16_t)(*(int16_t *)&s[0x10] + w16); /* add [esi+10h],dx @6a31c9 */
        s[0x1D] = (uint8_t)(b1D + s[0x1F]);       /* add bl,[esi+1Fh] @6a31d3 ; mov [esi+1Dh] @6a31dd */
        *(int16_t *)&s[0x0C] = (int16_t)(*(int16_t *)&s[0x0C] + w12); /* add [esi+0Ch],ax @6a31d9 */

        /* test di,di @6a31e0 ; jl @6a31e3 → comparaison SIGNÉE : si la nouvelle
         * posY (s+0x0E) < 0, sauter l'amortissement. */
        if (w0E >= 0) {
            /* Amortissement delta Y : movsx ecx,cx @6a31e5 (sign-extend 32 bits
             * de l'ANCIEN w14) ; neg ecx @6a31e8 (NEG 32 bits) ; sar ecx,1
             * @6a31ea (SAR ARITHMÉTIQUE, pas shr) ; mov [esi+14h],cx @6a31ec
             * (troncature 16 bits au store). */
            *(int16_t *)&s[0x14] = (int16_t)((-(int32_t)w14) >> 1);
        }

        /* Ordre live des stores (à préserver en cas de re-patch) :
         *  1) s[0x14] amorti ci-dessus (@6a31ec)
         *  2) s[0x14] += (int8)s[0x19]  : movsx ax,byte @6a31f8 ; add [esi+14h],ax @6a31fd (add 16 bits direct)
         *  3) s[0x12] = dX + incX       : movsx cx,byte [esi+18h] @6a31f0 ; add ecx,eax @6a31f5 ; mov [esi+12h],cx @6a3201
         *  4) s[0x16] = dZ + incZ       : movsx cx,byte [esi+1Ah] @6a3205 ; add ecx,edx @6a320a ; mov [esi+16h],cx @6a320e
         * (3)(4) : eax/edx hauts pollués — mov ax/dx ZÉRO les 16 bits hauts,
         * movsx ecx sign-extend incX/incZ. Addition 32 bits "mixte", mais seul
         * le store 16 bits bas compte : sémantique = addition 16 bits mod 2^16,
         * identique au C signé ci-dessous. */
        *(int16_t *)&s[0x14] = (int16_t)(*(int16_t *)&s[0x14] + (int16_t)(int8_t)s[0x19]);
        *(int16_t *)&s[0x12] = (int16_t)(w12 + (int16_t)(int8_t)s[0x18]);
        *(int16_t *)&s[0x16] = (int16_t)(w16 + (int16_t)(int8_t)s[0x1A]);
    }

    return 0;                                   /* xor eax,eax @6a320c ; retn @6a3215 */
}

/* ============================================================================
 * NOTES DE RÉCONCILIATION (voir reconcile_notes.md pour le détail A/B/ASM)
 * ----------------------------------------------------------------------------
 * 1. sub_572200 arg1 : g_BattleOTBase + 0x44 OCTETS (@6a3179 add ecx,44h).
 *    Hex-Rays "g_BattleOTBase + 17" = même adresse via typage pointeur.
 *    c_a écrivait `&g_BattleOTBase + 0x44` (mauvaise arithmétique C) — corrigé.
 * 2. Amortissement : NEG 32 bits (@6a31e8) puis SAR 32 bits (@6a31ea) sur le
 *    sign-extend 32 bits de l'ancien w14 (@6a31e5), tronqué 16 bits au store
 *    (@6a31ec). Jamais shr.
 * 3. rot : s[0x1D] ×16 (movsx @6a3104, shl 4 @6a3111) → arg0 de sub_6A3220 ;
 *    s[0x1C] ×16 (movsx @6a311a, shl 4 @6a3122) → arg0 de MakeRotX. shl LOGIQUE
 *    sur un movsx (résultat identique à ×16 sur int).
 * 4. pop edi @6a31F7 : PAS factice — c'est le vrai restore du edi sauvegardé
 *    à l'entrée (tous les pushes d'args déjà purgés par add esp,44h @6a3185 et
 *    add esp,4 @6a319a, donc [esp] = edi sauvé). Nécessaire car `mov di,
 *    [esi+0Eh]` @6a31bf a clobber edi. Les deux voix A et B le décrivaient à
 *    tort comme "pop factice d'équilibrage". Sortie 2 équilibrée :
 *    pop esi/ebp/ebx + retn.
 * 5. Ordre live des stores finaux : amort s[0x14] → s[0x14]+=incY → s[0x12]=dX
 *    → s[0x16]=dZ. Champs distincts, ordre sans effet sémantique, mais c'est
 *    l'ordre ASM qui fait foi (c_b listait dX avant dY).
 *
 * UNCERTAIN 0x6A30F0 rôle exact de sub_6A3220 (arg0 = 16*rot s[0x1D],
 *   arg1 = (int16)s[0x20] — vitesse/FOV ?, arg2 = sortie buf+0x78) : nom non
 *   résolu dans le pack, laissé en sub_.
 * UNCERTAIN 0x6A30F0 rôle de sub_572200 (insertion node OT battle, couche 2,
 *   write-back tête dword_2510258) — nom non résolu.
 * UNCERTAIN 0x6A30F0 sémantique des champs de la struct s (pos s+0x0C/0E/10,
 *   deltas s+0x12/14/16, incs s+0x18/19/1A, compteur s+0x1B, rot s+0x1C/1D,
 *   deltas rot s+0x1E/1F, mot s+0x20) : libellés déduits du flux (copie vers
 *   buf+0x6C/70/74 = position caméra), pas prouvés par l'ASM seul.
 * UNCERTAIN 0x6A30F0 rôle de unk_1183FA4 (stocké à buf+0x00 : vtable ou bloc
 *   param pour sub_572200 / draw callback) — non prouvé.
 * ==========================================================================*/
```

## Analyse semantique

# Sémantique sub_6A30F0 @ 0x6A30F0 (réconciliation R)

- **Rôle (1 phrase)** : step de tick d'un FX magie battle, enregistré comme callback dans la table de `sub_6A1660` : alloue un scratch 0x98 (`bs_modulo`), y compose deux matrices Q12 (rotX + builder `sub_6A3220`) avec la position du descripteur, compose le tout avec le bloc vue caméra `dword_1D97778`, soumet l'objet dans l'OT battle (`g_BattleOTBase+0x44`, couche 2, tête `dword_2510258`) via `sub_572200`, libère le scratch, avance l'état animé (pos/deltas/angles) et retourne 2 quand le compteur de frames `s[0x1B]` atteint zéro.

- **Verdict : LIKELY consolidé** — aucune divergence A/B ne survit face à l'ASM ; les libellés des champs de la struct et le rôle interne de `sub_6A3220`/`sub_572200`/`unk_1183FA4` restent déduits du flux, pas prouvés par l'ASM seul.
- **Confiance : LIKELY** — caller unique = xref data `sub_6A1660` @0x6A18AA (ticker MAG_212, fermé CERTAIN) + callees catalogués (`Mat3S16_MakeRotX_Q12`, `Mat_ComposeTwoThenCopy8`, paire `bs_modulo`/`BattleScratch_Unwind`) + `g_BattleOTBase+0x44`/`dword_1D97778` ancrés ; mais `sub_6A3220` et `sub_572200` non nommés, et wiki.md du pack en échec (erreur qmd) → CERTAIN non justifié.

- **Nom catalogue : absent** (sub_6A30F0 non nommé dans l'IDB). Proposition (markdown seul, pas de rename) : **`MagFx_AnimStep_ComposeCameraAndSubmitOT`** — confirme la proposition A.

  Preuves nom (≥2 indépendantes, adressées) :
  1. Composition caméra : `push offset dword_1D97778` @0x6A3147 avant `Mat_ComposeTwoThenCopy8` @0x6A314F — la matrice locale (rotX @0x6A3127, produit @0x6A312E) est composée avec le bloc vue caméra battle ; et `Mat3S16_MakeRotX_Q12` @0x6A3127 (callee nommé, m00=0x1000 Q12) prouve l'étape « compose ».
  2. Soumission OT battle : `mov ecx, g_BattleOTBase` @0x6A3172 + `add ecx, 44h` @0x6A3179 + `push 2` @0x6A317C + `push edi` @0x6A317F + `call sub_572200` @0x6A3180, write-back `mov dword_2510258, eax` @0x6A3188 — « SubmitOT » bucket +0x44, couche 2.
  3. « AnimStep » : caller unique = xref **data** @0x6A18AA (pointeur de fonction dans `sub_6A1660`, ticker MAG_212) + avance d'état per-frame (pos/deltas/angles @0x6A31AE–0x6A320E) + compteur de frames `s[0x1B]` avec retour 0/2 @0x6A319D–0x6A31A7 — protocole tick-callback.

## In / Out / Effets

**In** : un seul arg cdecl `arg_0 @ [esp+14h]` = pointeur descripteur d'état `s` (~0x22+ octets) :
- `s+0x0C/0x0E/0x10` : position s16 ×3 (copiée sign-extend → `buf+0x6C/0x70/0x74`) ;
- `s+0x12/0x14/0x16` : deltas s16 ×3 (pos += delta @0x6A31D9/0x6A31BB/0x6A31C9) ;
- `s+0x18/0x19/0x1A` : incs s8 ×3 (movsx, ajoutés aux deltas @0x6A31F5/0x6A31FD/0x6A320A) ;
- `s+0x1B` : compteur de frames u8 (dec @0x6A319D) ;
- `s+0x1C/0x1D` : angles u8 ×2 (×16 via `movsx`+`shl 4` → `Mat3S16_MakeRotX_Q12` / `sub_6A3220`) ;
- `s+0x1E/0x1F` : pas d'angle u8 ×2 (ajoutés aux angles @0x6A31C3/0x6A31D3) ;
- `s+0x20` : mot s16 passé arg1 à `sub_6A3220` (`movsx` @0x6A3108).

**Out** : EAX 32 bits = `2` si compteur épuisé (`mov eax,2` @0x6A31A7) sinon `0` (`xor eax,eax` @0x6A320C). Effets de bord : `s` muté (pos, deltas, angles, compteur) ; global `dword_2510258` réécrite @0x6A3188 avec le retour de `sub_572200` ; scratch 0x98 alloué puis unwindé (`BattleScratch_Unwind` @0x6A3192) — l'objet est transitoire, sérialisé dans l'OT, pas référencé.

**Effets (séquence live)** :
1. 0x6A30F4–0x6A3102 : `push 98h` + `bs_modulo` → `edi` (scratch 0x98, bump `dword_1D999C4`).
2. 0x6A3104–0x6A312E : `sub_6A3220((int8)s[0x1D]*16, (int16)s[0x20], buf+0x78)` puis `Mat3S16_MakeRotX_Q12((int8)s[0x1C]*16, buf+0x58)` puis `Mat3S16_MulQ12_IntoArg0(buf+0x58, buf+0x78)` — produit dans `buf+0x58`.
3. 0x6A3133–0x6A314F : pos s16 ×3 sign-extend → `buf+0x6C/0x70/0x74` (dwords) ; `Mat_ComposeTwoThenCopy8(&dword_1D97778, buf+0x58, buf+0x58)`.
4. 0x6A3154–0x6A315B : `Field_readCaPre(buf+0x58)` + `preCamReadVariables_Space(buf+0x58)`.
5. 0x6A3160–0x6A3188 : `[buf]=&unk_1183FA4`, `[buf+0x1C]=0`, puis `dword_2510258 = sub_572200(buf, g_BattleOTBase+0x44, 2, dword_2510258)` (offset +0x44 **octets**, `add ecx,44h` @0x6A3179).
6. 0x6A3185–0x6A319A : cleanup différé unique `add esp,44h` (17 pushes d'args = 0x44 exact) puis `BattleScratch_Unwind(0x98)` + `add esp,4`.
7. 0x6A319D : `dec al` sur `s[0x1B]`, `jnz` @0x6A31A2 (ZF pur) — à 0 → return 2. Sinon : pos += delta (0x6A31BB/0x6A31C9/0x6A31D9), angles += pas (0x6A31C3/0x6A31D3), deltas += incs s8 (0x6A31F5/0x6A31FD/0x6A320A), avec amortissement : si **nouvelle** `s[0x0E] >= 0` (`test di,di` @0x6A31E0 + `jl` signé @0x6A31E3) alors `s[0x14] = (int16)(-(int32)ancien_dY >> 1)` — `movsx ecx,cx` @0x6A31E5 → `neg` @0x6A31E8 → `sar` @0x6A31EA (arithmétique, jamais shr) → store 16 bits @0x6A31EC — puis `s[0x14] += incY` @0x6A31FD.

## Divergences A/B (tranchées une par une, preuve ASM adressée)

1. **arg1 de `sub_572200` (D1)** — A (c_a) : `&g_BattleOTBase + 0x44` (mauvaise arithmétique C) ; B : valeur de la globale + 0x44 octets. **Tranché : B.** `mov ecx, g_BattleOTBase` @0x6A3172 puis `add ecx, 44h` @0x6A3179 : la valeur est chargée puis incrémentée de 0x44 octets. Le « g_BattleOTBase + 17 » d'Hex-Rays (17×4=0x44) est un artefact de typage pointeur, même adresse.
2. **`pop edi` @0x6A31F7 (D2)** — A : non modélisé ; B : « pop factice d'équilibrage ». **Tranché : ni l'un ni l'autre — vrai restore.** `push edi` @0x6A30F3 ; edi clobber par `mov di, [esi+0Eh]` @0x6A31BF ; à 0x6A31F7 la pile d'args est déjà purgée (`add esp,44h` @0x6A3185, `add esp,4` @0x6A319A), donc `[esp]` = edi sauvé. Sortie 2 équilibrée (pop esi/ebp/ebx + retn).
3. **Ordre des stores finaux (D3)** — A : s[0x14]+=incY puis s[0x12] puis s[0x16] ; B : dX avant dY. **Tranché : ordre ASM live.** Amort s[0x14] @0x6A31EC → `add [esi+14h],ax` @0x6A31FD → `mov [esi+12h],cx` @0x6A3201 → `mov [esi+16h],cx` @0x6A320E. Champs distincts : ordre sans effet sémantique.
4. **Ordre des args de `sub_6A3220` (nouvelle divergence R, absente de la réconciliation C)** — A (prose) : `sub_6A3220(edi+0x78, s16, byte<<4)` (destination listée en arg0) ; B : `sub_6A3220(angle<<4, s[0x20], buf+0x78)`. **Tranché : B.** Pushes @0x6A310F (`ebp`=buf+0x78), @0x6A3110 (`eax`=s16), @0x6A3114 (`ecx`=angle<<4) ; cdecl droite→gauche → dernier push = arg0 → arg0 = angle<<4, arg1 = (int16)s[0x20], arg2 = buf+0x78.
5. **Additions 16 bits mod 2^16 (D5)** — concordance A/B. Preuve : `mov ax,[esi+12h]` @0x6A31D5 et `mov dx,[esi+16h]` @0x6A31C5 zéro les 16 bits hauts ; `movsx ecx, byte [esi+18h]` @0x6A31F0 sign-extend l'inc ; les stores `mov [esi+12h],cx` @0x6A3201 / `mov [esi+16h],cx` @0x6A320E ne gardent que le mot bas → sémantique = addition 16 bits mod 2^16.
6. **Compteur s[0x1B] (D6)** — concordance A/B : `dec al` @0x6A319D + `jnz` @0x6A31A2 = test **ZF pur** (pas jg/jl), return 2 à 0 exact, wrap 0→0xFF continue. La polarité signée ne concerne que le `jl` de l'amortissement.
7. **Amortissement signé (D7)** — concordance A/B : `test di,di` @0x6A31E0 + `jl` @0x6A31E3 sur la **nouvelle** `s[0x0E]` (chargée @0x6A31BF après le add @0x6A31BB) ; amortissement appliqué seulement si posY ≥ 0, sur l'**ancien** dY (`cx` de @0x6A31B7, non modifié entre-temps), avec NEG 32 bits + SAR 32 bits + troncature 16 bits au store, **puis** ajout incY @0x6A31FD (précision que la prose A omettait : ce n'est pas `vel = -vel/2` final, mais `vel = (-ancien_dY >> 1) + incY`).
8. **Typage buffer (D4)** — rien à arbitrer : buf+0x78 (Hex-Rays `+30` dwords) = `lea ebp,[edi+78h]` @0x6A310C ; buf+0x58 = `lea ebx,[edi+58h]` @0x6A311F. Trois sources concordent.

## Preuves (ASM cité)

1. **Paire alloc/unwind scratch** : `push 98h` @0x6A30F4 + `call bs_modulo` @0x6A30F9 vs `push 98h` @0x6A318D + `call BattleScratch_Unwind` @0x6A3192 — même taille 0x98, bump `dword_1D999C4` : objet transitoire sérialisé dans l'OT, pas persistant.
2. **Composition caméra** : `push offset dword_1D97778` @0x6A3147 avant `call Mat_ComposeTwoThenCopy8` @0x6A314F — la matrice produit (rotX @0x6A3127 × builder @0x6A3115, produit @0x6A312E dans buf+0x58) est composée avec le bloc vue caméra battle.
3. **Soumission OT battle** : `mov ecx, g_BattleOTBase` @0x6A3172 ; `add ecx, 44h` @0x6A3179 ; `push 2` @0x6A317C ; `push edi` @0x6A317F ; `call sub_572200` @0x6A3180 ; `mov dword_2510258, eax` @0x6A3188 — bucket +0x44 octets, couche 2, tête chaînée.
4. **Compteur et codes retour** : `mov al,[esi+1Bh]` @0x6A3197, `dec al` @0x6A319D, `mov [esi+1Bh],al` @0x6A319F, `jnz` @0x6A31A2 (ZF pur), `mov eax,2` @0x6A31A7 vs `xor eax,eax` @0x6A320C — EAX 32 bits, valeurs {0, 2}.
5. **Angles ×16** : `movsx ecx, byte [esi+1Dh]` @0x6A3104 + `shl ecx,4` @0x6A3111 (arg0 de `sub_6A3220`) ; `movsx dx, byte [esi+1Ch]` @0x6A311A + `shl edx,4` @0x6A3122 (arg0 de `Mat3S16_MakeRotX_Q12`).
6. **Amortissement signé** : `mov di,[esi+0Eh]` @0x6A31BF ; `test di,di` @0x6A31E0 ; `jl` @0x6A31E3 (comparaison **signée**) ; `movsx ecx,cx` @0x6A31E5 ; `neg ecx` @0x6A31E8 ; `sar ecx,1` @0x6A31EA (arithmétique) ; `mov [esi+14h],cx` @0x6A31EC — demi-delta Y négatif si nouvelle posY ≥ 0.
7. **Cleanup différé exact** : `add esp, 44h` @0x6A3185 purge les 17 pushes d'args (17×4 = 0x44) de 0x6A30F4 à 0x6A317F ; `add esp,4` @0x6A319A pour le push 98h — pile équilibrée, tous callees caller-cleaned, aucun libcall inventé.
8. **Caller unique data xref** : `sub_6A1660` @0x6A18AA (callers.txt, `more: false`) — pointeur de fonction en table (dispatch FX mag battle), pas d'appel direct.

## Checks §5.6

- Callees cités tous présents dans callees.txt : `bs_modulo`, `sub_6A3220`, `Mat3S16_MakeRotX_Q12`, `Mat3S16_MulQ12_IntoArg0`, `Mat_ComposeTwoThenCopy8`, `Field_readCaPre`, `preCamReadVariables_Space`, `sub_572200`, `BattleScratch_Unwind` — 9/9 ✓.
- Caller : `sub_6A1660` @0x6A18AA unique, présent dans callers.txt ✓.
- Strides/offsets en nombres : offsets descripteur 0x0C–0x20 ; offsets buffer 0x00/0x1C/0x58/0x6C/0x70/0x74/0x78 ; décalages `shl 4` cités ; aucun stride multi-objets ✓.
- Polarités : `jl` **signé** après `test di,di` (amortissement) ✓ ; `jnz` = ZF pur (compteur, pas de polarité signée) ✓ ; `movsx` systématique sur les s8 d'inc (0x6A31F0/0x6A31F8/0x6A3205) ✓ ; SAR @0x6A31EA jamais SHR ✓.
- Largeur retour : EAX 32 bits, {0, 2} ✓ ; cdecl — le caller purge son arg ✓.
- Nom : ≥2 preuves ASM indépendantes adressées (composition caméra + soumission OT + protocole tick data-xref) ✓.

## Questions ouvertes (non bloquantes)

- Rôle exact de `sub_6A3220` (arg0 = 16×(int8)s[0x1D], arg1 = (int16)s[0x20], arg2 = sortie buf+0x78) — builder de quelle rotation ? Non résolu.
- `sub_572200` : copie-t-elle l'objet 0x98 dans des nœuds OT (l'unwind juste après suggère une copie) ou référence-t-elle le pointeur ?
- Rôle de `unk_1183FA4` stocké à buf+0x00 @0x6A3160 (vtable ou bloc param pour le draw callback) — non prouvé.
- Libellés des champs de `s` (pos/deltas/incs/angles) : déduits du flux (copie vers buf+0x6C/70/74), pas prouvés par l'ASM seul.
- Sémantique de la borne posY ≥ 0 de l'amortissement (plan sol/écran dans l'espace composé ?) — signe d'axe à confirmer.
- wiki.md du pack en échec (erreur qmd) : l'alignement wiki cité par A (`dword_1D97778` bloc vue caméra émis par 0x5033E0) n'a pas été re-vérifié indépendamment dans cette passe — contribue à maintenir LIKELY plutôt que CERTAIN.

## IDBCOMMENT

Step de tick FX magie battle enregistre en callback dans sub_6A1660 (xref data 0x6A18AA). Alloue un scratch 0x98 (bs_modulo), y compose deux matrices Q12 (rotX sur s[1C] x16 et builder sub_6A3220 sur s[1D] x16), copie la position s[0C/0E/10] sign-extendee, puis compose le tout avec la matrice vue camera dword_1D97778. Soumet l'objet dans l'OT battle g_BattleOTBase+0x44 couche 2 via sub_572200 (tete dword_2510258), libere le scratch, avance pos/deltas/angles avec amortissement neg+sar 1 si nouvelle posY >= 0. Retour EAX : 2 si compteur s[1B] atteint 0 (jnz ZF pur), sinon 0. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A30F0 (0x6A30F0, 99 instr, 0x126 octets)

Pipeline triple 2+1 : voix A (c_a.c) + voix B (c_b.c) réconciliées contre
l'ASM live (asm.asm). Ground truth = ASM ; Hex-Rays (hexrays.c) = vérificateur
seulement. Aucune moyenne : chaque divergence tranchée avec preuve adressée.

---

## Divergences tranchées

### D1 — arg1 de sub_572200 : offset OT slot (c_a erreur d'arithmétique C)
- **A** : `&g_BattleOTBase + 0x44` (pointeur sur l'adresse de la globale, +0x44 dwords → faux en C).
- **B** : `(unsigned int)g_BattleOTBase + 0x44` (valeur de la globale + 0x44 octets).
- **Tranché : B.** Preuve ASM : `mov ecx, g_BattleOTBase` @0x6A3172 puis
  `add ecx, 44h` @0x6A3179 — la valeur de la globale est chargée puis
  incrémentée de 0x44 **octets**. Hex-Rays « g_BattleOTBase + 17 » est le même
  résultat via un typage pointeur (17×4=0x44), pas une divergence sémantique.

### D2 — pop edi @0x6A31F7 : les DEUX voix se trompent (« pop factice »)
- **A** : ne le mentionne pas explicitement mais ne le modélise pas.
- **B** : « pop edi factice d'équilibrage (edi sauvé est jeté avant la fin) ».
- **Tranché : ni l'un ni l'autre — le pop est le VRAI restore.** Preuve ASM :
  edi sauvegardé `push edi` @0x6A30F3 ; edi clobber par `mov di, [esi+0Eh]`
  @0x6A31BF ; à 0x6A31F7 tous les pushes d'args ont déjà été purgés
  (`add esp,44h` @0x6A3185, `add esp,4` @0x6A319A), donc `[esp]` = edi sauvé
  → `pop edi` @0x6A31F7 restaure le callee-save correctement. Aucun effet
  sémantique visible côté caller, mais ce n'est pas un pop de padding :
  les deux sorties sont équilibrées (sortie 2 : pop esi/ebp/ebx + retn).

### D3 — ordre des stores finaux (présentation)
- **A** : ordre commenté s[0x14] += incY, puis s[0x12] = dX, puis s[0x16] = dZ (avec note sur les registres pollués).
- **B** : liste dX @0x6A3201 puis dY @0x6A31FD puis dZ @0x6A320E (ordre éditorial).
- **Tranché : ordre ASM live.** Amortissement s[0x14] @0x6A31EC →
  `add [esi+14h], ax` @0x6A31FD → `mov [esi+12h], cx` @0x6A3201 →
  `mov [esi+16h], cx` @0x6A320E. Champs distincts : ordre sans effet
  sémantique, mais c'est l'ordre live documenté dans c_reconciled.c.

### D4 — typage du buffer / pointeurs des callees (présentation)
- **A** : `uint8_t *` partout, offsets octets explicites.
- **B** : idem mais note « Hex-Rays (__int16 *) v1 » et `sub_6A3220(..., (_DWORD *)v1 + 30)` côté Hex-Rays (= buf+0x78, cohérent).
- **Tranché : rien à arbitrer.** Hex-Rays buf+0x78 (30×4) = ebp @0x6A310C ;
  buf+0x58 (22×4=88, via `v1 + 44` words = 88 octets) = ebx @0x6A311F. Les
  trois sources concordent ; le C réconcilié garde l'arithmétique octets brute
  de l'ASM.

### D5 — sémantique 32 bits de `add ecx, eax` @0x6A31F5 / `add ecx, edx` @0x6A320A
- **A** : « eax/ecx hauts pollués (résidus dword_2510258 etc.) mais seuls les 16 bits bas sont stockés → sémantique addition 16-bit effective ».
- **B** : même conclusion, présentation plus courte.
- **Tranché : formulation A, précisée.** Preuve ASM : `mov ax, [esi+12h]`
  @0x6A31D5 ZÉRO les 16 bits hauts de eax (avant pollution par callees) ;
  `mov dx, [esi+16h]` @0x6A31C5 idem pour edx ; `movsx ecx, byte [esi+18h]`
  @0x6A31F0 sign-extend incX. L'addition 32 bits est « mixte » mais le store
  `mov [esi+12h], cx` @0x6A3201 ne conserve que les 16 bits bas → résultat
  identique à l'addition 16 bits mod 2^16. Aucune divergence de résultat avec
  Hex-Rays (`*(_WORD *)(a1 + 18) = v12 + v13`).

### D6 — polarité du compteur s[0x1B]
- **A** et **B** concordent : dec byte, jnz → return 2 à 0. Hex-Rays : `v2 = *(BYTE*)(a1+27) - 1; if (!v2) return 2;`
- **Tranché : concordance.** Preuve ASM : `mov al,[esi+1Bh]` @0x6A3197,
  `dec al` @0x6A319D, `mov [esi+1Bh],al` @0x6A319F, `jnz short loc_6A31AE`
  @0x6A31A2, `mov eax,2` @0x6A31A7. Test ZF pur (jnz, pas jg/jl) — pas de
  polarité signée ici ; wrap 0→0xFF continue la boucle. Le caractère « signé »
  demandé par le parent ne s'applique qu'au `test di,di ; jl` de
  l'amortissement (voir D7), pas au compteur.

### D7 — comparaison signée de l'amortissement
- **A** et **B** concordent : `test di,di` @0x6A31E0 + `jl` @0x6A31E3 → test
  signé sur la NOUVELLE valeur de s[0x0E] (mov di @0x6A31BF après le add
  @0x6A31BB). Hex-Rays : `v8 = *(_WORD *)(a1+14); if (v8 >= 0)`.
- **Tranché : concordance.** Amortissement appliqué seulement si la nouvelle
  posY ≥ 0.

---

## Points parent (1–8) — arbitrages

1. **Amortissement NEG/SAR 32 bits** : `movsx ecx, cx` @0x6A31E5 (sign-extend
   32 bits de l'ancien w14) → `neg ecx` @0x6A31E8 (NEG 32 bits) →
   `sar ecx, 1` @0x6A31EA (SAR **arithmétique**, jamais shr) →
   `mov [esi+14h], cx` @0x6A31EC (**troncature 16 bits au store**).
2. **rot s[0x1D]/s[0x1C] ×16** : s[0x1D] `movsx ecx, byte [esi+1Dh]` @0x6A3104
   puis `shl ecx, 4` @0x6A3111 (shl LOGIQUE sur sign-extend ≡ ×16 sur int) →
   arg0 de `sub_6A3220` @0x6A3115. s[0x1C] `movsx dx, byte [esi+1Ch]` @0x6A311A
   puis `shl edx, 4` @0x6A3122 → arg0 de `Mat3S16_MakeRotX_Q12` @0x6A3127.
3. **Copie caméra sign-extend** : `movsx eax, word [esi+0Ch]` @0x6A3133 →
   `mov [edi+6Ch], eax` @0x6A3137 ; `movsx ecx, word [esi+0Eh]` @0x6A313B →
   `mov [edi+70h], ecx` @0x6A313F ; `movsx edx, word [esi+10h]` @0x6A3143 →
   `mov [edi+74h], edx` @0x6A3147. Words 16 bits signés → dwords 32 bits.
4. **Matrices** : `Mat3S16_MakeRotX_Q12(16*s[0x1C], buf+0x58)` @0x6A3127 puis
   `Mat3S16_MulQ12_IntoArg0(buf+0x58, buf+0x78)` @0x6A312E (produit dans
   buf+0x58 ; pushes ebp@0x6A312C=arg1, ebx@0x6A312D=arg0). Puis
   `Mat_ComposeTwoThenCopy8(&dword_1D97778, buf+0x58, buf+0x58)` @0x6A314F
   (pushes ebx@0x6A313A=arg2, ebx@0x6A3142=arg1, offset@0x6A3147=arg0) :
   compose le bloc vue caméra dword_1D97778.
5. **sub_572200** @0x6A3180 : `dword_2510258 = sub_572200(buf,
   g_BattleOTBase+0x44, 2, dword_2510258)` — pushes eax@0x6A3178 (ancienne
   tête), 2@0x6A317C (couche 2), ecx@0x6A317E (g_BattleOTBase+0x44, add
   @0x6A3179), edi@0x6A317F (buf). Write-back `mov dword_2510258, eax`
   @0x6A3188.
6. **Compteur s[0x1B]** : dec byte @0x6A319D, `jnz` @0x6A31A2 — test ZF pur,
   **pas** de polarité signée. À 0 exactement → `return 2` @0x6A31A7/0x6A31AC ;
   sinon maj pos/deltas et `return 0` (`xor eax,eax` @0x6A320C).
7. **pop edi @0x6A31F7** : vrai restore du callee-save (edi clobber par
   `mov di,[esi+0Eh]` @0x6A31BF ; pile déjà purgée) — les deux voix le
   décrivaient à tort comme « factice » (voir D2).
8. **Cleanup différé** : `add esp, 44h` @0x6A3185 = purge unique des
   **17 pushes d'args** (17×4 = 0x44) de 0x6A30F4 à 0x6A317F ; décompte
   exhaustif dans le préambule de c_reconciled.c — exact. Puis `add esp, 4`
   @0x6A319A pour le push 98h de BattleScratch_Unwind.

---

## UNCERTAIN restants

- UNCERTAIN 0x6A30F0 rôle exact de `sub_6A3220` (arg0 = 16×(int8)s[0x1D],
  arg1 = (int16)s[0x20], arg2 = sortie matrice buf+0x78) — nom non résolu dans
  le pack.
- UNCERTAIN 0x6A30F0 rôle exact de `sub_572200` (append node OT battle couche
  2 ? write-back tête dword_2510258) — nom non résolu.
- UNCERTAIN 0x6A30F0 sémantique des champs de la struct état s
  (pos s+0x0C/0E/10, deltas s+0x12/14/16, incs s+0x18/19/1A, compteur s+0x1B,
  rots s+0x1C/1D, deltas rot s+0x1E/1F, mot s+0x20) : libellés déduits du flux
  (copie vers buf+0x6C/70/74 = position caméra), non prouvés par l'ASM seul.
- UNCERTAIN 0x6A30F0 rôle de `unk_1183FA4` (stocké à buf+0x00 @0x6A3160 :
  vtable ou bloc param pour sub_572200/draw callback) — non prouvé.

## Divergences vs Hex-Rays

- `g_BattleOTBase + 17` (Hex-Rays) vs `add ecx, 44h` @0x6A3179 : même adresse,
  mais le déplacement brut ASM = +0x44 **octets** fait foi (artefact de
  typage pointeur côté Hex-Rays). Aucune divergence de valeur.
- Amortissement `-v7 >> 1` (Hex-Rays, __int16) vs ASM : sign-extend 32 bits +
  NEG 32 bits + SAR 32 bits + troncature 16 bits au store — Hex-Rays conforme
  en résultat ; le C réconcilié documente la mécanique 32 bits exacte.
- `pop edi` @0x6A31F7 masqué par Hex-Rays (comme tout restore) : c'est un
  restore normal, pas un pop factice (correction vs voix B).
- Cleanup différé : Hex-Rays présente les pushes comme purgés par les callees
  stdcall ; l'ASM réel purge en un `add esp,44h` unique @0x6A3185. Tout
  re-patch doit conserver ce cleanup différé.
- Ordre visuel des stores finaux : Hex-Rays écrit `[a1+20] += [a1+25]` avant
  `[a1+18] = v12+v13` ; l'ASM store s[0x12] @0x6A3201 après l'ajout incY à
  s[0x14] @0x6A31FD. Champs distincts, aucune divergence de résultat.
