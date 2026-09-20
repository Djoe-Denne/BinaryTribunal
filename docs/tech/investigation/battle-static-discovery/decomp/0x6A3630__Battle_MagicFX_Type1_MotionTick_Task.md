# Battle_MagicFX_Type1_MotionTick_Task @ 0x6A3630

- Instr (live): 93 (412 o, 0x6A3630-0x6A3747)
- Palier: 2+1
- Verdict: LIKELY - tache tick du FX magie type '1' (enregistree par Battle_MagicFX_Type1_SpawnTimedTask 0x6A3510 @0x6A351F) : scratch 0x98, matrice rotX Q12 (s8[+1C] x16, buf+0x58) composee avec le bloc direction sub_6A3220 (s8[+1D] x16, rayon word[+20] -> buf+0x78, rotation Y scalee Q12), compose avec la vue camera dword_1D97778, soumet la prim 0x98 dans l'OT battle g_BattleOTBase+0x44 couche 2 via sub_572200 (tete dword_2510258), puis integre pos word +0x0C/0E/10 += deltas +0x12/14/16, deltas += accels s8 +0x18/19/1A, angles bytes +0x1C += +0x1E / +0x1D += +0x1F ; compteur +0x1B : dec -> 0 -> retour EAX=2, sinon EAX=0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A3630\nTYPE ; proposition: Battle_MagicFX_Type1_MotionTick_Task
- Notes parent: checks 5.6 OK : push 98h + bs_modulo (0x6A3634-39), shl 4 (0x6A3651/62), sub_6A3220 (0x6A3655), MakeRotX (0x6A3667), compose aliasing (0x6A368F), add ecx,44h (0x6A36B9), sub_572200 + write-back (0x6A36C0-C8), Unwind (0x6A36D2), dec al + mov eax,2 / xor (0x6A36DD-E7/0x6A3740), caller data xref sub_6A3510 @0x6A351F ; R a verifie sub_6A3220 en IDB live (rotation Y scalee, pas un lecteur camera)

## C reconcilie

```c
/* c_reconciled.c — sub_6A3630 — réconcilié c_a ⊕ c_b contre ASM live
 *
 * Ground truth = live ASM (asm.asm @ 0x6A3630, 93 instr, plage 0x6A3630..0x6A3743,
 * taille 0x114 = 276 octets) + meta.json, PAS Hex-Rays (hexrays.c = vérificateur).
 * IDA type: None — prototype déduit: int __cdecl sub_6A3630(void *a1).
 *
 * Sauvegardes de registres: push ebx, ebp, esi, edi (0x6A3630-33). Pas de frame ebp.
 * arg_0 = [esp+0x14] (ret + 4 regs).
 *
 * Pile cdecl à cleanup différé : 17 pushes d'arguments cumulés (0x6A3634..0x6A36BF)
 * soldés par UN SEUL `add esp, 44h` @0x6A36C5 (après sub_572200) ; puis
 * `add esp, 4` @0x6A36DA (après BattleScratch_Unwind). Aucun retn N.
 *
 * Struct a1 (esi) — champs :
 *   +0x0C/+0x0E/+0x10 : s16 pos XYZ   — += deltas +0x12/+0x14/+0x16 (add WORD)
 *   +0x12/+0x14/+0x16 : s16 deltas    — += s8 signés +0x18/+0x19/+0x1A (16 bits bas)
 *   +0x1B             : u8 compteur frames (dec; 0 → retour 2)
 *   +0x1C/+0x1D       : s8 angles     — shl 4 (= ×16) en passage matrices
 *   +0x1E/+0x1F       : s8 incréments d'angle
 *   +0x20             : s16 paramètre sub_6A3220
 *
 * Scratch 0x98 octets via bs_modulo (0x6A3639), rendu par BattleScratch_Unwind
 * (0x6A36D2) — paire alloc/libérer (inverse bump dword_1D999C4) :
 *   buf+0x00 : dword <- &unk_1183FA4
 *   buf+0x1C : dword <- 0
 *   buf+0x58 : matrice A (rotX puis MulQ12 résultat)
 *   buf+0x6C/70/74 : dwords <- movsx s16 de a1+0x0C/0E/10
 *   buf+0x78 : matrice B (construite par sub_6A3220)
 */

#include <stdint.h>

/* Callees — uniquement ceux de asm.asm / callees.txt. */
extern void *bs_modulo(unsigned int nbytes);                          /* 0x6A3639 */
extern void  sub_6A3220(int angle16, int val16, void *dst);           /* 0x6A3655 */
extern void  Mat3S16_MakeRotX_Q12(int angle16, void *m);              /* 0x6A3667 ; m00=0x1000, m11=m22=cos, m12=sin, m21=-sin */
extern void  Mat3S16_MulQ12_IntoArg0(void *dst, const void *src);     /* 0x6A366E ; résultat dans ARG0 */
extern void  Mat_ComposeTwoThenCopy8(const void *gA, void *m, void *m2); /* 0x6A368F ; interne 0x56C090 + 0x56C600(edi+0x14) + rep movsd 8 dwords → arg8 */
extern void  Field_readCaPre(void *p);                                /* 0x6A3695 */
extern void  preCamReadVariables_Space(void *p);                      /* 0x6A369B */
extern int   sub_572200(void *a, void *b, int c, int d);              /* 0x6A36C0 */
extern void  BattleScratch_Unwind(unsigned int nbytes);               /* 0x6A36D2 */

extern uint32_t dword_2510258;   /* 0x2510258 ; chaîne OT (arg4 in + write-back du retour) */
extern uint32_t g_BattleOTBase;  /* +0x44 OCTETS (add ecx,44h @0x6A36B9) ; Hex-Rays écrit +17 (unités _DWORD*) */
extern uint32_t dword_1D97778;   /* 0x1D97778 ; matrice globale source */

int __cdecl sub_6A3630(void *a1)
{
    uint8_t *t   = (uint8_t *)a1;                 /* esi */
    uint8_t *buf = (uint8_t *)bs_modulo(0x98);    /* 6A3634-3E: push 98h; call; edi=eax */
    uint8_t *m78 = buf + 0x78;                    /* lea ebp,[edi+78h] @6A364C */
    uint8_t *m58 = buf + 0x58;                    /* lea ebx,[edi+58h] @6A365F */
    uint16_t w12, w14, w16;

    /* 6A3644-55 : movsx ecx,b[+1Dh]; shl ecx,4; movsx eax,w[+20h];
     * push ebp(dst) ; push eax ; push ecx ; call  — ordre droite→gauche :
     * (16*(s8)t[0x1D], (s16)t[0x20], buf+0x78). */
    sub_6A3220(((int)(int8_t)t[0x1D]) * 16,       /* shl ecx,4 */
               (int)(int16_t)(t[0x20] | (t[0x21] << 8)),
               m78);                              /* // UNCERTAIN 0x6A3655 rôle exact de sub_6A3220 (matrice construite en buf+0x78 ?) */

    /* 6A365A-67 : movsx dx,b[+1Ch]; shl edx,4; push ebx ; push edx ; call
     * (16*(s8)t[0x1C], buf+0x58). */
    Mat3S16_MakeRotX_Q12(((int)(int8_t)t[0x1C]) * 16, m58);

    /* 6A366C-6E : push ebp ; push ebx ; call → arg0=ebx=m58 (reçoit le produit),
     * arg1=ebp=m78. Destination = ARG0 = buf+0x58. */
    Mat3S16_MulQ12_IntoArg0(m58, m78);

    /* 6A3673-8C : translation, movsx s16 → dword */
    *(uint32_t *)(buf + 0x6C) = (uint32_t)(int32_t)(int16_t)(t[0x0C] | (t[0x0D] << 8)); /* @6A3673/6A3677 */
    *(uint32_t *)(buf + 0x70) = (uint32_t)(int32_t)(int16_t)(t[0x0E] | (t[0x0F] << 8)); /* @6A367B/6A367F */
    *(uint32_t *)(buf + 0x74) = (uint32_t)(int32_t)(int16_t)(t[0x10] | (t[0x11] << 8)); /* @6A3683/6A368C */

    /* 6A367A-368F : push ebx ; push ebx ; push offset dword_1D97778 ; call
     * → (&dword_1D97778, buf+0x58, buf+0x58) : arg1 == arg2 == m58, composition
     * EN PLACE avec aliasing (source lut après écriture: 8 dwords copiés à partir
     * d'une matrice globale, voir notes). */
    Mat_ComposeTwoThenCopy8(&dword_1D97778, m58, m58); /* // UNCERTAIN 0x6A368F sémantique interne 0x56C090/0x56C600 avec arg1==arg2 */

    /* 6A3694-9B : push ebx ; call ×2 — les deux readers preCam sur buf+0x58 */
    Field_readCaPre(m58);
    preCamReadVariables_Space(m58);

    /* 6A36A0-6A36A6 */
    *(uint32_t *)(buf + 0x00) = 0x1183FA4u;   /* mov dword ptr [edi], offset unk_1183FA4 — // UNCERTAIN nature de unk_1183FA4 (vtable/handler ?) */
    *(uint32_t *)(buf + 0x1C) = 0;            /* mov dword ptr [edi+1Ch], 0 */

    /* 6A36AD-36C5 : push eax(=dword_2510258) ; ecx = g_BattleOTBase ; add ecx,44h ;
     * push 2 ; push ecx ; push edi ; call sub_572200 → args (edi, +0x44, 2, dword)
     * droite→gauche. add esp,44h ; mov dword_2510258, eax (write-back). */
    dword_2510258 = (uint32_t)sub_572200(buf,
                                         (uint8_t *)g_BattleOTBase + 0x44,
                                         2,
                                         dword_2510258); /* // UNCERTAIN 0x6A36BF sémantique sub_572200 (chaînage OT), arg2=2 = couche/priorité ? */

    /* 6A36CD-36DA : push 98h ; call BattleScratch_Unwind ; add esp,4 */
    BattleScratch_Unwind(0x98);

    /* 6A36D7-36ED : compteur — mov al,[esi+1Bh] ; dec al ; mov [esi+1Bh],al ; jnz
     * → si ZF=1 (compteur 0 après dec) : mov eax,2 ; retn */
    t[0x1B] = (uint8_t)(t[0x1B] - 1u);
    if (t[0x1B] == 0)
        return 2;                             /* 6A36E7: mov eax,2 */

    /* --- Stepper (loc_6A36EE..0x6A3743), retour 0 --- */
    /* Ordre ASM : al=t[0x1C], dl=t[0x1E], bl=t[0x1D] lus avant écriture 0x6A36FE. */
    t[0x1C] = (uint8_t)(t[0x1C] + t[0x1E]);   /* 6A36EE/6A36F1/6A36F7/6A36FE : add al,dl (8 bits) */

    /* Lectures des deltas AVANT toute écriture +0x12/+0x14/+0x16 */
    w12 = (uint16_t)(t[0x12] | (t[0x13] << 8));  /* mov ax,[esi+12h] @6A370A */
    w14 = (uint16_t)(t[0x14] | (t[0x15] << 8));  /* mov cx,[esi+14h] @6A3704 */
    w16 = (uint16_t)(t[0x16] | (t[0x17] << 8));  /* mov dx,[esi+16h] @6A3716 */

    /* Position += deltas — add WORD, wrap sur 16 bits */
    {   /* 6A370E: add [esi+0Eh],cx */
        uint16_t v = (uint16_t)((t[0x0E] | (t[0x0F] << 8)) + w14);
        t[0x0E] = (uint8_t)v; t[0x0F] = (uint8_t)(v >> 8);
    }
    {   /* 6A3712: add [esi+0Ch],ax */
        uint16_t v = (uint16_t)((t[0x0C] | (t[0x0D] << 8)) + w12);
        t[0x0C] = (uint8_t)v; t[0x0D] = (uint8_t)(v >> 8);
    }
    {   /* 6A371C: add [esi+10h],dx */
        uint16_t v = (uint16_t)((t[0x10] | (t[0x11] << 8)) + w16);
        t[0x10] = (uint8_t)v; t[0x11] = (uint8_t)(v >> 8);
    }

    /* Deltas += s8 signés — les additions 32 bits intermédiaires
     * (add edi,eax @6A371A ; add eax,ecx @6A3725 ; add ecx,edx @6A3730) mélangent
     * des moitiés hautes périmées, mais seuls les 16 bits bas sont stockés
     * (mov [esi+12h],di ; mov [esi+14h],ax ; mov [esi+16h],cx) → résultat 16 bits
     * déterministe = (delta16 + sext(s8)) & 0xFFFF. */
    {   /* 6A36F9 movsx di,b[+18h] ; 6A371A add edi,eax ; 6A3727 mov [esi+12h],di */
        uint16_t v = (uint16_t)(w12 + (uint16_t)(int16_t)(int8_t)t[0x18]);
        t[0x12] = (uint8_t)v; t[0x13] = (uint8_t)(v >> 8);
    }
    {   /* 6A3720 movsx ax,b[+19h] ; 6A3725 add eax,ecx ; 6A3735 mov [esi+14h],ax */
        uint16_t v = (uint16_t)(w14 + (uint16_t)(int16_t)(int8_t)t[0x19]);
        t[0x14] = (uint8_t)v; t[0x15] = (uint8_t)(v >> 8);
    }
    {   /* 6A372B movsx cx,b[+1Ah] ; 6A3730 add ecx,edx ; 6A3739 mov [esi+16h],cx */
        uint16_t v = (uint16_t)(w16 + (uint16_t)(int16_t)(int8_t)t[0x1A]);
        t[0x16] = (uint8_t)v; t[0x17] = (uint8_t)(v >> 8);
    }

    /* 6A36F4/6A3701/6A3708/6A3732 : bl = t[0x1D] ; al = t[0x1F] ; add bl,al (8 bits) */
    t[0x1D] = (uint8_t)(t[0x1D] + t[0x1F]);

    /* 6A373D-43 : xor eax,eax ; retn → retour 0 = continuer */
    return 0;
}
```

## Analyse semantique

# Sémantique sub_6A3630 @ 0x6A3630 (réconciliation R)

- Rôle (1 phrase) : tick d'une tâche FX magie battle (type 1) — intègre position/vitesse/accélération et deux rotations du record passé en argument, compose la matrice locale avec le bloc vue caméra `dword_1D97778`, inscrit l'objet de rendu 0x98 octets dans l'OT battle (`g_BattleOTBase+0x44` via `sub_572200`, chaînage `dword_2510258`), et retourne 0 tant que le compteur de frames `+0x1B` n'est pas épuisé, 2 à l'échéance.

- Verdict : LIKELY consolidé
- Confiance : LIKELY — callers + callees + wiki (QMD ff8-wiki côté B) alignés sur le rôle, opcodes cités ; **pas** CERTAIN car la sémantique interne de `sub_572200` (arg2=2 : priorité ? couche ?) et la nature de `unk_1183FA4` (marqueur/vtable à buf+0x00) restent non élucidées, et le wiki.md du pack lui-même est vide (échec qmd, compensé par QMD externe côté B).

- Nom catalogue : absent (IDA `sub_6A3630`, CMT vide). Proposition (markdown seul, pas de rename) : `Battle_MagicFX_Type1_MotionTick_Task`
  - P1 : data-xref unique @`0x6A351F` depuis `sub_6A3510` = `Battle_MagicFX_Type1_SpawnTimedTask` — l'adresse 0x6A3630 est stockée comme callback de tâche d'une famille FX magie, pas appelée directement.
  - P2 : intégrateur de mouvement complet @`0x6A36EE–0x6A3739` (pos += vel @0x6A370E/12/1C, vel += accel s8 @0x6A3727/35/39, angles += incs @0x6A36FE/0x6A3732) — c'est un tick de motion, pas un simple pas de caméra.
  - P3 : inscription OT @`0x6A36C0` `sub_572200(buf, g_BattleOTBase+0x44, 2, dword_2510258)` avec write-back @`0x6A36C8` — enfilage dans la draw-list battle.

- In / Out / Effets :
  - In (cdecl, 1 arg) : `a1` (esi) = record d'état du FX :
    - `+0x0C/+0x0E/+0x10` : position XYZ (s16, pas 2)
    - `+0x12/+0x14/+0x16` : deltas/vitesse XYZ (s16, pas 2)
    - `+0x18/+0x19/+0x1A` : accélération XYZ (s8 signés, pas 1)
    - `+0x1B` : compteur de frames de vie (u8, décrémenté à chaque tick)
    - `+0x1C/+0x1D` : angles (s8, ×16 en passage matrice)
    - `+0x1E/+0x1F` : incréments d'angle (s8)
    - `+0x20` : s16 = facteur d'échelle passé brut à `sub_6A3220` (résolu en lecture : scalé dans cos/sin de la matrice, voir preuve 3)
  - Alloc : `bs_modulo(0x98)` @`0x6A3639` → buf (edi) ; `buf+0x58` matrice rotX puis produit ; `buf+0x78` matrice sub_6A3220 ; `buf+0x6C/70/74` translation ; `buf+0x00` = `&unk_1183FA4`, `buf+0x1C` = 0.
  - Effets : mutation du record a1 (compteur, angles, pos, vel) ; `dword_2510258` mis à jour @`0x6A36C8` (chaînage OT partagé par la famille FX 0x6A0DC0..0x6A3913) ; scratch 0x98 libéré par `BattleScratch_Unwind` @`0x6A36D2` (paire exacte avec bs_modulo) ; lecture seule de `dword_1D97778` (bloc vue caméra, en argument de compose @`0x6A368F`).
  - Out : **EAX entier** = 0 (tick suivant, `xor eax,eax` @`0x6A3740`) ou 2 (fin, `mov eax,2` @`0x6A36E7`) — pas AL-only : les deux chemins écrivent EAX complet, mais le protocole tâche ne consomme que la valeur 0/2.

- Divergences A/B tranchées (une par une, contre l'ASM) :
  1. **Nom** — A `BattleCamera_MotionStep_Task` vs B `MagFX_TaskTick_IntegrateRotateEnqueueBattleOT`. Tranché : synthèse `Battle_MagicFX_Type1_MotionTick_Task`. L'objet opéré est le record FX, pas la caméra : `dword_1D97778` n'apparaît qu'en **lecture** comme source de compose @`0x6A3687` (`push offset dword_1D97778`), alors que le record esi est intégré en écriture (pos/vel/angles @`0x6A370E–0x6A3739`) et le scratch edi est celui enfilé dans l'OT @`0x6A36C0`. Le data-xref @`0x6A351F` depuis `Battle_MagicFX_Type1_SpawnTimedTask` fixe la famille. Le nom de B décrit juste le flux mais le lie à "MagFX" sans le caller ; le nom de A inverse sujet/outil. Synthèse retenue : famille (caller) + intégration (ASM) + protocole tâche (retour 0/2 @`0x6A36E7`/`0x6A3740`).
  2. **Retour AL-only vs EAX** — A écrivait « Retour : AL only ». Tranché : EAX entier. Preuve : `mov eax,2` @`0x6A36E7` et `xor eax,eax` @`0x6A3740` écrivent les 32 bits dans les deux chemins de retour ; aucun code ne lit seulement AL. B avait raison ; point corrigé dans le livrable.
  3. **Rôle de sub_6A3220** (question ouverte des deux voix, UNCERTAIN `0x6A3655`) — résolu en lecture seule (désassemblage 0x6A3220–0x6A327B) : `push ebp` @`0x6A3230` → `Fixed_Sin4096_Q12` @`0x6A323F` et `Fixed_Cos4096_Q12` @`0x6A3251`, produits `imul esi,ebx`/`sar esi,0Ch` @`0x6A324A-0x6A324E` avec `ebx`=(s16)[esi+20h] ; matrice posée @`0x6A3259–0x6A3270` : r0c0=cos·v, r0c1=−sin·v, r0c2=v, r1c1=v, r2c0=+sin·v, r2c2=cos·v. C'est une **rotation Y Q12 scalée par [esi+20h]** (composante brute v en r0c2 = contribution sur l'axe X), pas un lecteur caméra ni une projection. L'hypothèse « rotY » de B était la bonne direction ; A n'avait pas tranché.
  4. **Statut du word +0x20** — A : « angle mot passé en arg » ; B : « roulis ? angle Z ? ». Tranché par la lecture ci-dessus : ce n'est pas un angle de rotation mais un **facteur d'échelle** (multiplié dans cos/sin et posé brut en r0c2). Rôle fonctionnel exact (amplitude du FX ?) = UNCERTAIN, mais la nature scalaire est établie par `imul` @`0x6A324A/0x6A3256`.
  5. **Signification de dword_2510258** — B hésitait (tête de liste vs curseur de chaînage). Tranché par xrefs lecture seule : 14 accès dans 13 fonctions du cluster FX battle 0x6A0DC0–0x6A3913, toutes en motif lecture (arg4 de sub_572200) + write-back immédiat du retour (ex. @`0x6A316D`/`0x6A3188`, @`0x6A331D`/`0x6A3339`, @`0x6A36AD`/`0x6A36C8`). C'est un **curseur de chaînage partagé** par toute la famille FX, pas une tête propre à cette tâche. Cohérent avec les deux voix.
  6. ** wiki.md pack vide** — les deux voix l'ont signalé ; B a compensé par QMD ff8-wiki (convergence : dword_1D97778 = bloc vue, protocole 0/2). Adopté, mais compté comme convergence indirecte (pas de re-vérification R), d'où LIKELY et non CERTAIN.

- Preuves (ASM cité) :
  1. `0x6A3634` `push 98h` + `0x6A3639` `call bs_modulo` → buf=eax ; libération symétrique `0x6A36CD` `push 98h` + `0x6A36D2` `call BattleScratch_Unwind` : scratch 0x98 aller-retour, pas d'état persistant.
  2. `0x6A365A` `movsx dx,[esi+1Ch]` / `0x6A3662` `shl edx,4` / `0x6A3667` `call Mat3S16_MakeRotX_Q12` (dest `ebx=buf+0x58` @`0x6A365F`) : angle s8 ×16 en Q12, rotation X de l'objet.
  3. Lecture 0x6A3220–0x6A327B (read-only) : `Fixed_Sin4096_Q12` @`0x6A323F` + `Fixed_Cos4096_Q12` @`0x6A3251` + `imul/sar 0Ch` avec (s16)[esi+20h] → rotation Y Q12 scalée en `buf+0x78` ; compose en place `0x6A366E` `Mat3S16_MulQ12_IntoArg0(buf+0x58, buf+0x78)` (résultat ARG0).
  4. `0x6A3687` `push offset dword_1D97778` + `0x6A368F` `call Mat_ComposeTwoThenCopy8` (args = &view, buf+0x58, buf+0x58 — aliasing) : composition locale ∘ vue caméra, caméra en lecture seule.
  5. `0x6A36B2` `mov ecx, g_BattleOTBase` / `0x6A36B9` `add ecx,44h` / `0x6A36C0` `call sub_572200` (args droite→gauche : buf, OT+0x44, 2, dword_2510258) / `0x6A36C8` `mov dword_2510258, eax` : enfilage OT battle + write-back chaînage. ~300 callers de sub_572200 = primitive générique d'insertion OT.
  6. `0x6A36D7` `mov al,[esi+1Bh]` / `0x6A36DD` `dec al` / `0x6A36DF` `mov [esi+1Bh],al` / `0x6A36E2` `jnz loc_6A36EE` → `0x6A36E7` `mov eax,2` (échéance) sinon stepper puis `0x6A3740` `xor eax,eax` : compteur de vie, retour EAX 0/2.
  7. `0x6A370E/0x6A3712/0x6A371C` `add [esi+0Eh/0Ch/10h], cx/ax/dx` (pos += vel, WORD) puis `0x6A3727/0x6A3735/0x6A3739` `mov [esi+12h/14h/16h], di/ax/cx` après `movsx` des s8 `+0x18/19/1A` (vel += accel) : intégrateur Euler, toutes polarités additives, aucun ja/jb.

- Checks §5.6 :
  - Callees cités ⊆ callees.txt : bs_modulo (0x6A3639), sub_6A3220 (0x6A3655), Mat3S16_MakeRotX_Q12 (0x6A3667), Mat3S16_MulQ12_IntoArg0 (0x6A366E), Mat_ComposeTwoThenCopy8 (0x6A368F), Field_readCaPre (0x6A3695), preCamReadVariables_Space (0x6A369B), sub_572200 (0x6A36C0), BattleScratch_Unwind (0x6A36D2) — tous présents, aucun library call inventé ✔
  - Caller présent dans callers.txt : data-xref 0x6A351F depuis sub_6A3510, more:false ✔ (identité « SpawnTimedTask type 1 » = fait d'ancorage orchestrator, cité comme tel)
  - Strides en nombres : pos pas 2 (s16), vel pas 2 (s16), accel pas 1 (s8 movsx), angles pas 1 (s8), compteur pas 1 (u8) — aucun stride Hex-Rays hérité ✔
  - Polarités : compteur `dec`/`jnz` (0 ⇒ retour 2) ✔ ; intégrations additives, `movsx` signés, aucun branchement unsigned ✔ ; `shl 4` = ×16 (pas de sar ambigu) ✔
  - Largeur retour : EAX complet 0/2 dans les deux chemins (`xor eax,eax` @0x6A3740 / `mov eax,2` @0x6A36E7) — divergence A « AL only » corrigée ✔
  - Nom ≥2 preuves ASM indépendantes adressées : data-xref 0x6A351F (famille FX type 1) + intégrateur 0x6A370E–0x6A3739 (motion tick) + enfilage OT 0x6A36C0 (tâche battle) ✔
  - C_reconciled.c conforme : contrats sub_6A3220/MulQ12/ComposeTwoThenCopy8/sub_572200 et stepper 16 bits vérifiés contre asm.asm ; les UNCERTAIN de ligne (0x6A3655/0x6A368F/0x6A36BF/0x6A36A0) restent posés en commentaire, celui de 0x6A3655 est levé au niveau sémantique par la présente (rotation Y scalée).

- Questions ouvertes (non bloquantes) :
  - Sémantique interne de `sub_572200` : arg2=2 (priorité OT ? couche rendu ?) et arg4/retour `dword_2510258` (position d'insertion vs nouveau curseur) — nécessiterait une analyse dédiée du callee.
  - Nature de `unk_1183FA4` (posé à buf+0x00 @0x6A36A0) : vtable, marqueur de type d'objet, ou handler de draw — pas de xref exploitable dans le pack.
  - Rôle exact de `Field_readCaPre`/`preCamReadVariables_Space` sur buf+0x58 (lecture d'état caméra dans la matrice avant compose ? aucun effet visible dans cette fonction).
  - Amplitude/unité du facteur d'échelle `[esi+20h]` (Q12 ? pixels ?) et qui l'initialise (probablement le spawner sub_6A3510).
  - `dword_1D999C4` (bump par BattleScratch_Unwind, cf. callees.txt) non étudié ici — hors périmètre.

- IDBCOMMENT: Tache tick d un FX magie battle type 1 (callback enregistre par sub_6A3510 @6A351F) : elle alloue un scratch de 98h octets, construit rotX Q12 en buf+58 et une rotation Y scalee par word +20 en buf+78, compose avec la vue dword_1D97778 puis inscrit l objet dans l OT battle g_BattleOTBase+44 via sub_572200 (chainage dword_2510258 mis a jour). Elle integre ensuite pos += vel, vel += accel s8 et angles += incs du record esi, et rend 0 tant que le compteur +1B n est pas epuise, 2 a l echeance. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — 0x6A3630 (c_a ⊕ c_b → c_reconciled)

Ground truth = live ASM `asm.asm` (93 instr, 0x6A3630..0x6A3743, taille 0x114/276 octets). Hex-Rays = vérificateur. Aucune moyenne : chaque point tranché par une adresse d'inscription.

## Points tranchés contre l'ASM

1. **Scratch 0x98 bs_modulo/Unwind** — Alloué @`0x6A3634` (`push 98h`) → `call bs_modulo` @`0x6A3639`, edi = eax ; libéré @`0x6A36CD` (`push 98h`) → `call BattleScratch_Unwind` @`0x6A36D2`, suivi de `add esp,4` @`0x6A36DA`. A et B concordent, kernel adopté tel quel.

2. **rotX + bloc sub_6A3220 — ordre pushes et destinations** —
   - `sub_6A3220` @`0x6A3644-55` : `movsx ecx,b[esi+1Dh]`, `shl ecx,4` (@`0x6A3651`), `movsx eax,w[esi+20h]`, `push ebp`(=`buf+0x78`, @`0x6A364C/6A364F`), `push eax`, `push ecx`, call → args droite→gauche **(16×(s8)a1[0x1D], (s16)a1[0x20], buf+0x78)**. Destination = buf+0x78.
   - `Mat3S16_MakeRotX_Q12` @`0x6A365A-67` : `movsx dx,b[esi+1Ch]`, `shl edx,4` (@`0x6A3662`), `push ebx`(=`buf+0x58`), `push edx` → **(16×(s8)a1[0x1C], buf+0x58)**. Destination = buf+0x58.
   - `Mat3S16_MulQ12_IntoArg0` @`0x6A366C-6E` : `push ebp` puis `push ebx`, call → arg0=**ebx=buf+0x58** (reçoit le produit), arg1=ebp=buf+0x78. Destination = ARG0 (d'où prototype `(dst, src)`).
   A et B concordent (c_a §extraits, c_b lignes 36-47) ; c_reconciled adopte ce contrat.

3. **Mat_ComposeTwoThenCopy8 — aliasing** — pushes @`0x6A367A/6A3682/6A3687` : `push ebx`, `push ebx`, `push offset dword_1D97778`, call @`0x6A368F` → `(&dword_1D97778, buf+0x58, buf+0x58)` : **arg1 == arg2 == buf+0x58 (composition en place, aliasing)**. Conforme aux deux voix. Point 5 ENTRÉE NOTÉE : le commentaire callee (callees.txt) décrit `rep movsd 8 dwords` vers arg8 du corps 0x56C090/0x56C600 — copie de 8 dwords à partir de la matrice globale, source non confondue avec la destination visible ici. Rôle interne exact = UNCERTAIN.

4. **Translation pos word** — `movsx eax,w[esi+0Ch]` @`0x6A3673` → `mov [edi+6Ch]` @`0x6A3677` ; `movsx ecx,w[esi+0Eh]` @`0x6A367B` → `mov [edi+70h]` @`0x6A367F` ; `movsx edx,w[esi+10h]` @`0x6A3683` → `mov [edi+74h]` @`0x6A368C`. movsx word→dword (sign-extend) dans les 3 dwords buf+0x6C/70/74. Concordance A/B.

5. **sub_572200** — pushes @`0x6A36AD-6A36BF` : `mov eax,dword_2510258` @`0x6A36AD` ; `mov ecx,g_BattleOTBase` @`0x6A36B2` ; `push eax` @`0x6A36B8` ; `add ecx,44h` @`0x6A36B9` (**+0x44 OCTETS**) ; `push 2` @`0x6A36BC` ; `push ecx` @`0x6A36BE` ; `push edi` @`0x6A36BF` ; call @`0x6A36C0` → args droite→gauche **(buf, g_BattleOTBase+0x44, 2, dword_2510258)** ; write-back `mov dword_2510258,eax` @`0x6A36C8`. Le commentaire callee mentionne dword_2510258 en arg4 (chaînage / write-back) — celà est cohérent avec `push eax` (arg4) + `mov dword_2510258,eax`. Sémantique exacte de sub_572200 = UNCERTAIN.

6. **Compteur a1+0x1B — séquence exacte** — `mov al,[esi+1Bh]` @`0x6A36D7` ; `dec al` @`0x6A36DD` ; `mov [esi+1Bh],al` @`0x6A36DF` ; `jnz loc_6A36EE` @`0x6A36E2`. Si ZF=1 (compteur atteint 0 après dec, *pas* avant) : pops puis **`mov eax,2`** @`0x6A36E7` / retn @`0x6A36ED`. Sinon → stepper → **`xor eax,eax`** @`0x6A3740` / retn @`0x6A3743` (retour 0). Retour EAX entier (0/2), pas AL-only. Les deux voix concordent.

7. **Stepper — adresses et largeurs** —
   - Angles : `dl=[esi+1Eh]` @`0x6A36EE`, `al=[esi+1Ch]` @`0x6A36F1`, `bl=[esi+1Dh]` @`0x6A36F4`, `add al,dl` @`0x6A36F7`, `mov [esi+1Ch],al` @`0x6A36FE` (**BYTE**)→ angle X += incrément ; `al=[esi+1Fh]` @`0x6A3701`, `add bl,al` @`0x6A3708`, `mov [esi+1Dh],bl` @`0x6A3732` (**BYTE**)→ angle 2 += incrément.
   - Position : `cx=[esi+14h]` @`0x6A3704`, `ax=[esi+12h]` @`0x6A370A`, `dx=[esi+16h]` @`0x6A3716` — deltas lus AVANT toute écriture ; `add [esi+0Eh],cx` @`0x6A370E`, `add [esi+0Ch],ax` @`0x6A3712`, `add [esi+10h],dx` @`0x6A371C` (**WORD**, wrap 16 bits).
   - Deltas += s8 : `movsx di,b[esi+18h]` @`0x6A36F9` + `add edi,eax` @`0x6A371A` → `mov [esi+12h],di` @`0x6A3727` ; `movsx ax,b[esi+19h]` @`0x6A3720` + `add eax,ecx` @`0x6A3725` → `mov [esi+14h],ax` @`0x6A3735` ; `movsx cx,b[esi+1Ah]` @`0x6A372B` + `add ecx,edx` @`0x6A3730` → `mov [esi+16h],cx` @`0x6A3739` (**movsx BYTE → stock WORD**).
   - Subtilité 32 bits : les additions `add edi/eax/ecx` @`0x6A371A/6A3725/6A3730` mélangent des moitiés hautes périmées, mais seules les 16 bits bas sont stockés (`mov [esi+12h],di` etc.) → résultat 16 bits déterministe = (delta16 + sext(s8)) & 0xFFFF. c_b suivait la micro-séquence registre pas-à-pas ; c_a le formulait en 16 bits. **Les formulations sont équivalentes**, mais c_a est le plus proche du booléen de sortie — c'est sa forme qui est adoptée.

## Divergences A vs B (toutes tranchées)

| # | A | B | Tranché |
|---|---|---|---|
| 1 | Micro-séquence 16/32 bits expliquée en commentaire | Reproduction ligne-à-ligne des registres (eax_, ecx intermédiaires) | Forme c_a (16 bits déterministes) — preuve `mov [esi+12h],di` @`0x6A3727` (stock WORD, 16 bits bas seulement) |
| 2 | `0x001183FA4u` (préfixe 0 superflu) | `&unk_1183FA4` | Valeur identique @`0x6A36A0` ; forme B (littéral offset, sans arithmétique) retenue |
| 3 | Prototype avec `w12/w14/w16` explicites | Registres latents (`cx/dx/ax/di`) | Pseudocode (A) retenu, précision B ajoutée en commentaire inline |

## Divergences vs Hex-Rays

- `hexrays.c:27` : `g_BattleOTBase + 17` — Hex-Rays typé `_DWORD*`, +17 dwords = +0x44 octets ⇒ identique à `add ecx,44h` @`0x6A36B9` (divergence de typing, pas de sémantique).
- `hexrays.c:16` : `(_DWORD *)v1 + 30` = octet offset 0x78 = buf+0x78 ✓ ; `v1+44` (WORD*) = 0x58 ✓ ; `v1+60` (WORD*) = 0x78 ✓ — cohérent.
- `hexrays.c` masque le cumul 17 pushes (0x44) soldé par un seul `add esp,44h` @`0x6A36C5` + `add esp,4` @`0x6A36DA` — invisible en pseudo-C mais critique pour la fidélité cdecl.
- `16 * *(char*)(...)` (hexrays:16-17) ≡ movsx+shl 4 @`0x6A3651/6A3662` ✓.
- Stepper hexrays:33-49 correspond (ordres/masques corrects), v5=sext(s8[+0x18]), v7=v4+inc etc. Pas de divergence sémantique trouvée.
- Aucun ja/jb/jg/jl (uniquement jnz @`0x6A36E2`) ; pas de sar ; retour EAX complet (0/2), pas AL-only.

## UNCERTAIN restants

- UNCERTAIN 0x6A3655 : rôle exact de sub_6A3220 — quelle matrice/op est construite en buf+0x78 à partir de (16×(s8)[+1Dh], (s16)[+20h]).
- UNCERTAIN 0x6A368F : sémantique interne de Mat_ComposeTwoThenCopy8 (0x56C090 / 0x56C600(edi+0x14) / rep movsd 8 dwords) avec arg1==arg2 == buf+0x58.
- UNCERTAIN 0x6A36BF : sémantique de sub_572200 (chaînage/insertion en liste OT ?), arg2=2 (couche/priorité ?), arg4 dword_2510258 write-back.
- UNCERTAIN 0x6A36A0 : nature de unk_1183FA4 (vtable ? marqueur ? handler ?).
