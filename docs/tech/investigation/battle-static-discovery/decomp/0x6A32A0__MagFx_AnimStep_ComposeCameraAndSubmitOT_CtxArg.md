# MagFx_AnimStep_ComposeCameraAndSubmitOT_CtxArg @ 0x6A32A0

- Instr (live): 94 (352 o, 0x6A32A0-0x6A335F)
- Palier: 2+1
- Verdict: LIKELY - step de tick FX magie (variante parametree par contexte de la sœur 0x6A30F0, sans amortissement ; 3 wrappers poussant les constantes unk_1184174/11843DC/1184694) : scratch 0x98, rotX (s[1C] x16) buf+0x58 + bloc direction sub_6A3220 (s[1D] x16, rayon s[20]) buf+0x78, translation s+0C/0E/10 sign-extendee buf+0x6C/70/74, compose avec la vue camera dword_1D97778 (Mat_ComposeTwoThenCopy8), soumet dans l'OT battle g_BattleOTBase+0x44 couche 2 via sub_572200 (tete dword_2510258), puis integre pos+=delta, delta+=accel s8, angles+=incs byte ; compteur s[1B] byte dec/jnz ZF pur, retour EAX {0,2}
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A32A0\nTYPE ; proposition: MagFx_AnimStep_ComposeCameraAndSubmitOT_CtxArg
- Notes parent: checks 5.6 OK : shl 4 (0x6A32C1/0x6A32D2), stores buf+6Ch/70h/74h (0x6A32E7-FC), push ebx x2 aliasing compose (0x6A32EA-F2), add esp,44h = 17 pushes (0x6A3336), write-back dword_2510258 (0x6A3339), mov al/[esi+1Bh] + jnz ZF pur (0x6A3348-53), mov eax,2 (0x6A3358), 3 wrappers callers (callers.txt) ; convergence A/B ~99 %

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — 0x6A32A0 (réconcilié voix A + voix B, tranché contre ASM)
 * ----------------------------------------------------------------------------
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, NOT Hex-Rays
 *   (hexrays.c = vérificateur seulement).
 * EA          : 0x6A32A0  (.text @ 0x6a32a0)
 * Taille      : 277 octets (0x6A32A0..0x6A33B4), 94 instructions live
 * Type IDA    : int __cdecl(int, int)   [meta.json]
 * Sauvegardes : ebx, ebp, esi, edi (push @0x6A32A0-A3 / pop @0x6A3355-5E et
 *               @0x6A33AE-B4, symétriques sur les deux sorties)
 * Convention  : TOUS les helpers ci-dessous sont __cdecl (pousses arg
 *               droite->gauche, nettoyage appelant). Preuve : UN SEUL
 *               `add esp, 44h` @0x6A3336 solde 17 pushes cumulés (13 scratch
 *               + 4 pour sub_572200), et `add esp, 4` séparé @0x6A334B après
 *               BattleScratch_Unwind. Hex-Rays masque ces add esp (helpers
 *               typés stdcall) — divergence de rendu, ASM gagne.
 * Callers     : sub_6A3280 @0x6a328a, sub_6A33C0 @0x6a33ca, sub_6A33E0
 *               @0x6a33ea (thunks 0x13 octets, famille mag FX battle).
 * ========================================================================== */

/* ---- Externes : uniquement les callees présents dans asm.asm/callees.txt ---- */

extern int bs_modulo(unsigned int nbytes);
    /* 0x6A32A9 : bump allocator scratch battle (0x5082B0), retour EAX = base
     * du bloc. Inverse : BattleScratch_Unwind (bump dword_1D999C4). */
extern void sub_6A3220(int arg0, int arg1, void *dst);
    /* 0x6A32C5 : args prouvés par pushes @0x6A32BF/C0/C4 (droite->gauche :
     * ebp, eax, ecx) -> (ecx=angle*16, eax=mot signé, ebp=dst). */
extern void Mat3S16_MakeRotX_Q12(int angleScaled, void *dst);
    /* 0x6A32D7 : rotX Q12 : m00=0x1000, m11=m22=cos, m12=sin, m21=-sin. */
extern void Mat3S16_MulQ12_IntoArg0(void *arg0, void *arg1);
    /* 0x6A32DE : Mat3S16_MulQ12_Copy5 puis copie 5 dwords sur arg0. */
extern void Mat_ComposeTwoThenCopy8(void *arg0, void *arg1, void *arg2);
    /* 0x6A32FF : call 0x56C090 + call 0x56C600(arg+0x14) + add [arg+14/18/1C]
     * + rep movsd 8 dwords vers arg2. */
extern void Field_readCaPre(void *arg0);            /* 0x6A3305 */
extern void preCamReadVariables_Space(void *arg0);  /* 0x6A330B */
extern int sub_572200(void *arg0, void *arg1, int arg2, void *arg3);
    /* 0x6A3331 : 4 args cdecl (edi, edx, 2, ecx) ; retour EAX -> dword_2510258. */
extern void BattleScratch_Unwind(unsigned int nbytes);
    /* 0x6A3343 : inverse de bs_modulo (bump dword_1D999C4). */

extern unsigned int dword_1D97778;   /* 0x1D97778, passé par référence (offset) */
extern unsigned int dword_2510258;   /* 0x2510258 : lu en arg4 puis réécrit avec EAX @0x6A3339 */
extern unsigned int g_BattleOTBase;  /* lu @0x6A3323 puis `add edx, 44h` @0x6A332A
                                      * (offset OCTET 0x44 ; Hex-Rays rend "+17",
                                      * artefact d'arithmétique pointeur 4 octets) */

int __cdecl sub_6A32A0(int a1, int a2)
{
    unsigned char *st;    /* esi = a1 : état motion FX (struct non nommée)   */
    unsigned char *buf;   /* edi = bloc scratch 0x98 octets (bs_modulo)      */
    void          *mat;   /* ebp = buf+0x78 (dst sub_6A3220)                 */
    void          *mtx;   /* ebx = buf+0x58 (matrice, réutilisée partout)    */
    signed short  d12, d14, d16;

    st = (unsigned char *)a1;

    /* --- 0x6A32A4/A9 : push 98h ; call bs_modulo ; mov edi, eax --- */
    buf = (unsigned char *)bs_modulo(0x98);
    /* --- 0x6A32AE : mov esi, [esp+14h+arg_0] (= a1) --- */

    /* --- Bloc direction : 0x6A32B4 movsx ecx, byte [esi+1Dh] ;
     *     0x6A32B8 movsx eax, word [esi+20h] ; 0x6A32BC lea ebp, [edi+78h] ;
     *     0x6A32BF/C0/C4 push ebp, eax, ecx(shl 4) ; 0x6A32C5 call.
     * Ordre de pousses droite->gauche : arg1=ecx, arg2=eax, arg3=ebp. --- */
    mat = buf + 0x78;
    sub_6A3220((int)(signed char)st[0x1D] * 16,        /* shl ecx,4 @0x6A32C1 */
               (int)*(signed short *)(st + 0x20),      /* movsx eax, word     */
               mat);

    /* --- rotX : 0x6A32CA movsx dx, byte [esi+1Ch] ; 0x6A32D2 shl edx, 4 ;
     *     0x6A32CF lea ebx, [edi+58h] ; push ebx (arg2), push edx (arg1) --- */
    mtx = buf + 0x58;
    Mat3S16_MakeRotX_Q12((int)(signed char)st[0x1C] * 16, mtx);

    /* --- 0x6A32DC/DD : push ebp, push ebx ; 0x6A32DE call
     *     arg0 = ebx (buf+0x58) reçoit le produit, arg1 = ebp (buf+0x78) --- */
    Mat3S16_MulQ12_IntoArg0(mtx, mat);

    /* --- Translation : movsx word->reg32 puis store dword (sign-extend 16->32)
     *     0x6A32E3/E7 : [esi+0Ch] -> [edi+6Ch]
     *     0x6A32EB/EF : [esi+0Eh] -> [edi+70h]
     *     0x6A32F3/FC : [esi+10h] -> [edi+74h] --- */
    *(int *)(buf + 0x6C) = (int)*(signed short *)(st + 0x0C);
    *(int *)(buf + 0x70) = (int)*(signed short *)(st + 0x0E);
    *(int *)(buf + 0x74) = (int)*(signed short *)(st + 0x10);

    /* --- 0x6A32EA/F2/F7 : push ebx, push ebx, push offset dword_1D97778 ;
     *     0x6A32FF call. arg1=&dword_1D97778, arg2=arg3=buf+0x58 (MÊME pointeur,
     *     aliasing in-place prouvé par les deux pushes du même registre ebx).
     *     La translation buf+0x6C/70/74 (vue +0x14/18/1C de mtx) est consommée
     *     DANS le callee avant le rep movsd final vers arg2. --- */
    Mat_ComposeTwoThenCopy8(&dword_1D97778, mtx, mtx);

    /* --- 0x6A3304/A5 : push ebx ; call Field_readCaPre
     * --- 0x6A330A/B  : push ebx ; call preCamReadVariables_Space --- */
    Field_readCaPre(mtx);
    preCamReadVariables_Space(mtx);

    /* --- 0x6A3310 : mov eax, [esp+44h+arg_4] (= a2 ; esp = E-0x44 à ce point)
     *     0x6A3314 : mov dword ptr [edi+1Ch], 0   (DWORD, pas word)
     *     0x6A331B : mov [edi], eax               (dword en tête de buf) --- */
    *(unsigned int *)(buf + 0x1C) = 0;
    *(unsigned int *)(buf + 0x00) = (unsigned int)a2;

    /* --- 0x6A331D..0x6A3339 : enregistrement liste FX battle
     *     ecx = dword_2510258 (push @0x6A3329, arg4) ; edx = g_BattleOTBase ;
     *     add edx, 44h (offset octet 0x44) ; push 2 (arg3) ; push edx (arg2) ;
     *     push edi (arg1) ; call ; mov dword_2510258, eax (write-back). --- */
    dword_2510258 = (unsigned int)sub_572200(buf,
                                             (void *)((unsigned int)g_BattleOTBase + 0x44),
                                             2,
                                             (void *)dword_2510258);
    /* --- 0x6A3336 : add esp, 44h — solde exact des 17 pushes cdecl cumulés :
     *     bs_modulo(1) + sub_6A3220(3) + MakeRotX(2) + Mul(2) + Compose(3)
     *     + Field_readCaPre(1) + preCamReadVariables_Space(1) = 13 scratch,
     *     + sub_572200(4) = 17 dwords = 0x44. --- */

    /* --- 0x6A333E/43/4B : push 98h ; call BattleScratch_Unwind ; add esp, 4
     *     (soldé immédiatement, à part du add esp,44h). --- */
    BattleScratch_Unwind(0x98);

    /* --- Compteur de frames : 0x6A3348 mov al, [esi+1Bh] ; 0x6A334E dec al ;
     *     0x6A3350 mov [esi+1Bh], al ; 0x6A3353 jnz short loc_6A335F.
     *     BYTE, wrap 8 bits non signé ; test = ZF pur du dec.
     *     Compteur atteint 0 -> sortie A : mov eax, 2 ; retn (@0x6A3358/5E). --- */
    if (--st[0x1B] == 0)
        return 2;

    /* --- loc_6A335F..0x6A33AA : intégration position/vitesse/angles ---
     * Ordre ASM exact : les positions +0x0C/+0x0E/+0x10 reçoivent les ANCIENNES
     * valeurs des deltas +0x12/+0x14/+0x16 (lus @0x6A336F/8A/7D avant toute
     * écriture), puis chaque delta += accélération octet signé (movsx :
     * 0x18 -> +0x12 @0x6A3365/81/98, 0x19 -> +0x14 @0x6A3383/96/A6,
     * 0x1A -> +0x16 @0x6A339C/A1/AA), stockage word 16 bits (wrap 16 bits).
     * Angles : incrément BYTE (wrap 8 bits) — 0x1E pilote 0x1C
     * (@0x6A335F/62/6D/73), 0x1F pilote 0x1D (@0x6A3376/88/A3). --- */
    d12 = *(signed short *)(st + 0x12);                 /* 0x6A336F mov ax,[esi+12h] */
    d14 = *(signed short *)(st + 0x14);                 /* 0x6A338A mov cx,[esi+14h] */
    d16 = *(signed short *)(st + 0x16);                 /* 0x6A337D mov dx,[esi+16h] */

    *(signed short *)(st + 0x0C) = (signed short)(*(signed short *)(st + 0x0C) + d12); /* 0x6A3379 add [esi+0Ch], ax */
    *(signed short *)(st + 0x0E) = (signed short)(*(signed short *)(st + 0x0E) + d14); /* 0x6A338E add [esi+0Eh], cx */
    *(signed short *)(st + 0x10) = (signed short)(*(signed short *)(st + 0x10) + d16); /* 0x6A3392 add [esi+10h], dx */

    *(signed short *)(st + 0x12) = (signed short)(d12 + (signed char)st[0x18]); /* 0x6A3365 movsx di / 0x6A3381 add edi,eax / 0x6A3398 mov [esi+12h], di */
    *(signed short *)(st + 0x14) = (signed short)(d14 + (signed char)st[0x19]); /* 0x6A3383 movsx ax / 0x6A3396 add eax,ecx / 0x6A33A6 */
    *(signed short *)(st + 0x16) = (signed short)(d16 + (signed char)st[0x1A]); /* 0x6A339C movsx cx / 0x6A33A1 add ecx,edx / 0x6A33AA */

    st[0x1C] = (unsigned char)(st[0x1C] + st[0x1E]);    /* 0x6A335F/62/6D/73 : add cl, al ; mov [esi+1Ch], cl */
    st[0x1D] = (unsigned char)(st[0x1D] + st[0x1F]);    /* 0x6A336A/76/88/A3 : add bl, cl ; mov [esi+1Dh], bl */

    /* --- 0x6A33B1 : xor eax, eax ; 0x6A33B4 retn (sortie B) --- */
    return 0;
}

/* ----------------------------------------------------------------------------
 * Layout buf (scratch 0x98 octets) :
 *   +0x00 dword : a2 (écrit @0x6A331B)
 *   +0x1C dword : 0 (écrit @0x6A3314)
 *   +0x58..     : matrice 3x3 Q12 (rotX puis produit puis dst compose)
 *   +0x6C/70/74 : translation dword x/y/z (sign-extend 16->32)
 *   +0x78..     : dst sub_6A3220 (0x20 octets jusqu'à 0x98)
 * Layout a1 (état motion FX) :
 *   +0x0C/0E/10 s16 : position (intégrée par les deltas)
 *   +0x12/14/16 s16 : deltas (intégrés par les accélérations)
 *   +0x18/19/1A s8  : accélérations
 *   +0x1B      u8   : compteur de frames (dec/jnz, 0 -> retour 2)
 *   +0x1C/1D   s8   : angles (-> rotX / sub_6A3220, ×16)
 *   +0x1E/1F   u8   : incréments d'angle
 *   +0x20      s16  : arg2 de sub_6A3220
 * UNCERTAIN 0x6A32A9 : type de retour exact de bs_modulo (EAX utilisé comme
 *   base pointeur, void* supposé ; B le type int — équivalent machine).
 * UNCERTAIN 0x6A32C5 : prototype exact de sub_6A3220 (args prouvés par les
 *   pushes, retour et sémantique non prouvés ici).
 * UNCERTAIN 0x6A3331 : sémantique de sub_572200 (4 args cdecl prouvés ; le
 *   write-back EAX -> dword_2510258 suggère un head de liste chaînée, non
 *   prouvé dans ce seul call site).
 * ========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A32A0 @ 0x6A32A0 (réconciliation R)

- **Rôle (1 phrase)** : step de tick d'un FX magie battle (câblé derrière les 3 wrappers 0x6A3280/0x6A33C0/0x6A33E0 de la table du ticker sub_6A1660) : alloue un scratch 0x98 (`bs_modulo`), y compose la matrice rotX (angle `s[0x1C]`×16) × bloc direction sin/cos de `sub_6A3220` (angle `s[0x1D]`×16, rayon `s[0x20]`), copie la position sign-extendée `s[0x0C/0E/10]`, compose le tout avec le bloc vue caméra `dword_1D97778`, soumet l'objet dans l'OT battle (`g_BattleOTBase+0x44`, couche 2, tête `dword_2510258`) avec la constante de table `arg_4` stockée à `buf+0x00`, libère le scratch (`BattleScratch_Unwind`), avance linéairement pos/deltas/angles **sans amortissement** (contraste sœur 0x6A30F0) et retourne `2` quand le compteur de frames `s[0x1B]` atteint zéro, sinon `0`.

- **Verdict : LIKELY consolidé.** A et B aveugles convergent ~99 % (structures, offsets, séquences identiques, divergences purement de libellés/nommage). LIKELY, pas CERTAIN, car : libellés des champs de `s` déduits du flux (non prouvés par l'ASM seul), rôle interne de `sub_572200` inféré, contenu des constantes `unk_1184174/11843DC/1184694` non tranché — même barre que la cellule sœur 0x6A30F0 (fermée LIKELY). Ancorages forts : `sub_6A3220` fermée CERTAIN, wrapper 0x6A3280 fermé CERTAIN (data-xref 0x6A2141 dans le ticker sub_6A1660).
- **Confiance : LIKELY**

- **Nom catalogue** : `sub_6A32A0` non nommé dans l'IDB (meta.json) — rien à confirmer/infirmer. Proposition (markdown seul, **pas de rename**) :
  **`MagFx_AnimStep_ComposeCameraAndSubmitOT_CtxArg`** (B) — retenue : nom plus fidèle au pondéré ASM (bloc de composition matricielle + soumission OT = 60 des 94 instructions ; intégration = queue de ~20 instr), reflète le paramètre de contexte `arg_4` (3 wrappers poussant 3 constantes distinctes) et reste homogène avec la sœur 0x6A30F0 (déjà fermée sous ce gabarit, avec amortissement).
  > A enchaînait sur « ParticleTick_IntegrateAndSubmitOT » : le qualificatif Particle n'a aucune preuve ASM (aucune indication de particule vs sprite/fx générique), et l'intégration (pos += delta, delta += inc, angles += pas) est subordonnée à la soumission. Rejeté au profit de B.

- **In / Out / Effets**
  - In (cdecl 2 args, purge caller) :
    - `arg_0` (esi) = descripteur d'état `s` de 0x22+ octets :
      - `s[0x0C/0x0E/0x10]` : position s16 ×3 (movsx → `buf+0x6C/0x70/0x74` dwords @0x6A32E3-E7/EB-EF/F3-FC) ;
      - `s[0x12/0x14/0x16]` : deltas s16 ×3 (pos += delta 16 bits @0x6A3379/0x6A338E/0x6A3392), eux-mêmes += incs s8 `s[0x18/0x19/0x1A]` (movsx @0x6A3365/3383/339C, stores 16 bits @0x6A3398/A6/AA) ;
      - `s[0x1B]` : compteur de frames u8 (`dec al` @0x6A334E, `jnz` @0x6A3353) ;
      - `s[0x1C/0x1D]` : angles u8 ×2 (×16 : rotX → `buf+0x58` @0x6A32D7 ; sub_6A3220 → `buf+0x78` @0x6A32C5), pas d'angle u8 `s[0x1E/0x1F]` (@0x6A3373/33A3, wrap 8 bits) ;
      - `s[0x20]` : rayon s16 (movsx @0x6A32B8 → arg2 de `sub_6A3220`, cellule fermée CERTAIN).
    - `arg_4` = constante de table du wrapper (`mov eax,[esp+44h+arg_4]` @0x6A3310, stockée à `[edi]` @0x6A331B).
  - Out : EAX 32 bits ∈ {0, 2} — `mov eax,2` @0x6A3358 (compteur épuisé, détâcher) / `xor eax,eax` @0x6A33B1 (continuer).
  - Effets : alloc+unwind symétriques 0x98 octets sur `dword_1D999C4` (`bs_modulo` @0x6A32A9 / `BattleScratch_Unwind` @0x6A3343) ; réécriture de la tête `dword_2510258` avec le retour de `sub_572200` @0x6A3339 ; mutation in-place de `s` (avance) ; buf+0x58 = produit matriciel (0x14 dwords) aliasé dans `Mat_ComposeTwoThenCopy8` (double push ebx @0x6A32EA/F2, arg2 = arg3).

- **Preuves (ASM cité)**
  1. `0x6A32A4-0x6A32AE` : `push 98h; call bs_modulo; mov esi,[esp+14h+arg_0]; mov edi,eax` — scratch 0x98 transitoire (rendu @0x6A333E-0x6A334B, même taille, inverse de `bs_modulo`).
  2. `0x6A32B4-0x6A32DE` : `movsx ecx,byte [esi+1Dh]; shl ecx,4` → arg1 ; `movsx eax,word [esi+20h]` → arg2 ; `lea ebp,[edi+78h]` → arg3 (pushes droite→gauche @0x6A32BF/C0/C4, `call sub_6A3220`) ; `movsx dx,byte [esi+1Ch]; shl edx,4; lea ebx,[edi+58h]` → `Mat3S16_MakeRotX_Q12` @0x6A32D7 ; `push ebp; push ebx` → `Mat3S16_MulQ12_IntoArg0(buf+0x58, buf+0x78)` @0x6A32DE.
  3. `0x6A32E3-0x6A32FF` : pos `word [esi+0Ch/0Eh/10h]` movsx → dwords `[edi+6Ch/70h/74h]` ; `push offset dword_1D97778` @0x6A32F7 + `push ebx ×2` @0x6A32EA/F2 (aliasing) → `call Mat_ComposeTwoThenCopy8` @0x6A32FF — composition avec le bloc vue caméra.
  4. `0x6A3310-0x6A3339` : `[edi+1Ch]=0` @0x6A3314, `[edi]=arg_4` @0x6A331B, puis `mov edx,g_BattleOTBase; add edx,44h` @0x6A3323/2A (offset **octet** 0x44 — Hex-Rays « +17 », artefact ÷4), `push 2` @0x6A332D (couche 2), `call sub_572200` @0x6A3331, write-back `mov dword_2510258,eax` @0x6A3339.
  5. `0x6A3343` : `push 98h; call BattleScratch_Unwind; add esp,4` @0x6A334B — restitution exacte du scratch, hors du cleanup différé `add esp,44h` @0x6A3336 (= 17 pushes d'args exactement).
  6. `0x6A3348-0x6A33B1` : `mov al,[esi+1Bh]; dec al; mov [esi+1Bh],al; jnz short` (ZF pur, wrap 8 bits) → sortie `mov eax,2` @0x6A3358, sinon avance linéaire puis `xor eax,eax` @0x6A33B1. **Aucun** `test/jl/neg/sar` dans 0x6A3348-0x6A33AA : avance sans amortissement (sœur 0x6A30F0 amortit posY).
  7. Empilement du buf prouvé par l'arithmétique des adresses : `0x58+0x14=0x6C` (fin mat → pos), `0x6C+0x0C=0x78` (fin pos → mat direction).

- **Divergences A/B tranchées (une par une)**
  - **D1 — Libellés `s[0x12/14/16]` « vitesses » (A) vs « deltas » (B) et `s[0x18/19/1A]` « accélérations » (A) vs « incs » (B)**. Tranché **B** (delta/incer) : l'ASM ne prouve qu'une chaîne d'additions pos += w16 puis w16 += (s8) movsx (`add [esi+0Ch],ax` @0x6A3379 avec ax lu @0x6A336F ; `movsx di,byte [esi+18h]` @0x6A3365, store `[esi+12h],di` @0x6A3398). « Vitesse/accélération physique » est une habillage cinématique sans opcode distinctif — toutes deux en 16/8 bits signés, wrap modulaire. Sémantique machine identique chez les deux voies ; seul le libellé change.
  - **D2 — `s[0x20]` : « probable échelle, non prouvé » (A) vs « rayon du bloc direction sin/cos » (B)**. Tranché **B** : `sub_6A3220` est fermée CERTAIN (fait d'ancorage orchestrateur) et son arg2 = `movsx eax,word [esi+20h]` @0x6A32B8, poussé @0x6A32C0, dst = ebp = `edi+78h` @0x6A32BF — callee interprète ce mot comme rayon du bloc direction. L'annotation « échelle » de A n'a aucun call-site à l'appui.
  - **D3 — Résultat/ordre du produit matriciel**. Convergence de fond (les deux rendent rotX @buf+0x58 multiplié par la matrice direction @buf+0x78, produit dans buf+0x58) ; tranché sans effet : `Mat3S16_MulQ12_IntoArg0` @0x6A32DE avec `push ebp (=edi+78h)` puis `push ebx (=edi+58h)` — droite→gauche : arg1 = ebx = dst in-place, arg2 = ebp. Preuves adresse : lea ebx @0x6A32CF, lea ebp @0x6A32BC.
  - **D4 — empilement buf (A : mat 0x58-0x6B / pos 0x6C-0x77 / mat 0x78-0x8B)**. Identiques chez A et B, confirmé par les movsx du point 2 et par `mov dword ptr [edi+1Ch],0` @0x6A3314 (champ séparé du scratch, pas un chevauchement) : retenue telle quelle.
  - **D5 — Nom**. Tranché **B** — `MagFx_AnimStep_ComposeCameraAndSubmitOT_CtxArg` ; motivation et critiques de A en section Nom ci-dessus (2 preuves ASM indépendantes : `push offset dword_1D97778` @0x6A32F7 → ComposeTwoThenCopy8 @0x6A32FF pour ComposeCamera ; `g_BattleOTBase+0x44`+`push 2`+write-back tête @0x6A3323-0x6A3339 pour SubmitOT ; `arg_4`→`[edi]` @0x6A3310/0x6A331B + 3 wrappers distincts pour CtxArg).

- **Checks §5.6**
  - Callees : 9/9 cités présents dans callees.txt (`bs_modulo`, `sub_6A3220`, `Mat3S16_MakeRotX_Q12`, `Mat3S16_MulQ12_IntoArg0`, `Mat_ComposeTwoThenCopy8`, `Field_readCaPre`, `preCamReadVariables_Space`, `sub_572200`, `BattleScratch_Unwind`) — aucun libcall inventé ✓
  - Callers : 3/3 (`sub_6A3280` @0x6a328a, `sub_6A33C0` @0x6a33ca, `sub_6A33E0` @0x6a33ea, wrappers 0x13 octets) ✓
  - Strides en nombres : aucun stride multi-objets ; offsets 0x0C-0x20 / buf 0x00/0x1C/0x58/0x6C/0x70/0x74/0x78 ; `shl 4` = ×16 ; `add edx,44h` octets ✓
  - Polarités : `jnz` ZF pur (compteur u8, wrap 0→0xFF continue) ; aucune branche `ja/jb/jg/jl` dans la cellule ; `movsx` systématique sur s8/s16 ; `shl` logique aprés movsx ≡ ×16 signé ✓
  - Largeur retour : EAX 32 bits, valeurs {0,2} seulement ✓
  - Pile : 17 pushes d'args = 0x44 (`add esp,44h` @0x6A3336) + Unwind à part (`add esp,4` @0x6A334B) ; pops équilibrés sur les deux sorties ✓
  - Nom ≥2 preuves ASM indépendantes adressées ✓

- **Questions ouvertes (non bloquantes)**
  - Contenu exact des constantes `unk_1184174/11843DC/1184694` stockées à `buf+0x00` (bloc contexte/draw consommé par `sub_572200` ou par le rendu ?) et signification de `[edi+0x1C]=0` @0x6A3314.
  - Rôle interne de `sub_572200` (append en liste à tête `dword_2510258` vs copie de packets) et de `Field_readCaPre` / `preCamReadVariables_Space` sur `ebx = edi+0x58` @0x6A3305/0x6A330B.
  - Différence fonctionnelle voulue entre l'absence d'amortissement ici vs la sœur 0x6A30F0 (variante du descripteur ou famille d'effets distincte ?) — à trancher par le contenu des 3 tables de constantes.

- **IDBCOMMENT**
  Step de tick FX magie battle reference par les wrappers 0x6A3280/0x6A33C0/0x6A33E0 (table du ticker sub_6A1660), chacun poussant sa constante stockee a buf+0x00. Alloue un scratch 0x98 (bs_modulo), y compose rotX (s[1C]x16) avec le bloc direction sin/cos sub_6A3220 (s[1D]x16, rayon s[20]), copie la position s[0C/0E/10] puis compose avec la matrice vue camera dword_1D97778 avant de soumettre dans l'OT battle g_BattleOTBase+0x44 couche 2 via sub_572200 (tete dword_2510258), scratch rendu aussitot (BattleScratch_Unwind). Retour EAX 2 si le compteur s[1B] atteint zero (jnz ZF pur), sinon 0 apres avance lineaire pos/deltas/angles sans amortissement, contrairement a la soeur 0x6A30F0. Nom propose (markdown seul) : MagFx_AnimStep_ComposeCameraAndSubmitOT_CtxArg. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — 0x6A32A0

Voix A (c_a.c), voix B (c_b.c), tranchés contre l'ASM live (asm.asm, 94 instr).
hexrays.c = vérificateur seulement. Convergence A/B : ~99 % (mêmes structures,
mêmes offsets, mêmes conventions ; divergences = purement de rendu).

## Divergences tranchées

### D1 — Cleanup pile : `add esp,44h` = 17 pushes, BattleScratch_Unwind soldé à part
- A : note « 17 dwords d'args + 0 des regs » — compte juste mais formulation ambiguë.
- B : décompte détaillé en en-tête (1+3+2+2+3+1+1 = 13 scratch, +4 sub_572200 = 17 = 0x44).
- **Tranché B** : 17 pushes exactement. Preuve ASM : pushes @0x6A32A4 (1, bs_modulo), 0x6A32BF/C0/C4 (3, sub_6A3220), 0x6A32D5/D6 (2, MakeRotX), 0x6A32DC/DD (2, Mul), 0x6A32EA/F2/F7 (3, Compose), 0x6A3304/A5 (1, Field_readCaPre), 0x6A330A/B (1, preCamReadVariables_Space) = 13 ; puis 0x6A3329/2D/2F/30 (4, sub_572200) = 17 dwords ; `add esp, 44h` @0x6A3336. BattleScratch_Unwind : `push 98h` @0x6A333E + `add esp, 4` @0x6A334B, soldé immédiatement, HORS le 0x44. Hex-Rays masque tout (helpers typés stdcall) — rendu faux, ASM gagne.

### D2 — rotX et bloc direction : args et ordre
- A et B convergent ; **tranché unanimement** : `Mat3S16_MakeRotX_Q12((s8)[a1+0x1C] << 4, buf+0x58)` (movsx @0x6A32CA, shl 4 @0x6A32D2, lea ebx @0x6A32CF) et `sub_6A3220((s8)[a1+0x1D] << 4, (s16)[a1+0x20], buf+0x78)` — ordre des pushes droite->gauche : ebp @0x6A32BF (arg3=dst), eax @0x6A32C0 (arg2=mot signé), ecx @0x6A32C4 (arg1=angle*16, movsx @0x6A32B4 + shl @0x6A32C1). `shl` logique sur movsx signé = ×16 d'une valeur signée. Hex-Rays rend `(_DWORD *)v2 + 30` et `v2 + 44` pour buf+0x78 / buf+0x58 — arithmétique pointeur 2 octets, même adresse (0x3C×2=0x78, 0x2C×2=0x58) ; l'offset octet 0x58/0x78 fait foi.

### D3 — Translation sign-extend 16→32
- A/B convergent ; **tranché unanimement** : les trois stores sont des dwords issus de movsx word : `[esi+0Ch]→[edi+6Ch]` @0x6A32E3/E7, `[esi+0Eh]→[edi+70h]` @0x6A32EB/EF, `[esi+10h]→[edi+74h]` @0x6A32F3/FC. Hex-Rays `*((_DWORD *)v2 + 27/28/29)` = mêmes offsets octets 0x6C/70/74, cohérent.

### D4 — Mat_ComposeTwoThenCopy8 : adresse et aliasing
- A et B convergent ; **tranché unanimement** : `Mat_ComposeTwoThenCopy8(&dword_1D97778, buf+0x58, buf+0x58)` — arg1 = `push offset dword_1D97778` @0x6A32F7, arg2 = arg3 = DEUX pushes du même registre ebx @0x6A32EA/F2 (aliasing in-place, la translation +0x6C/70/74 = +0x14/18/1C de mtx est consommée dans le callee avant le rep movsd final vers arg3). Hex-Rays rend `(int)(v2 + 44), v2 + 44` — même adresse, cohérent.

### D5 — sub_572200 : 4 args, write-back
- A et B convergent ; **tranché unanimement** : `dword_2510258 = sub_572200(buf, g_BattleOTBase+0x44, 2, dword_2510258)`. Preuve ASM : `mov ecx, dword_2510258` @0x6A331D (push @0x6A3329, arg4), `mov edx, g_BattleOTBase ; add edx, 44h` @0x6A3323/2A (push @0x6A332F, arg2 — offset OCTET 0x44), `push 2` @0x6A332D (arg3), `push edi` @0x6A3330 (arg1), `mov dword_2510258, eax` @0x6A3339 (write-back). Hex-Rays `g_BattleOTBase + 17` = artefact (0x44/4 = 17, type pointeur 4 octets) — l'offset octet 0x44 fait foi.

### D6 — Compteur s[0x1B] byte : séquence exacte et retour
- A et B convergent ; **tranché unanimement** : `mov al, [esi+1Bh]` @0x6A3348 ; `dec al` @0x6A334E ; `mov [esi+1Bh], al` @0x6A3350 ; `jnz short loc_6A335F` @0x6A3353 — test = ZF pur du dec (pas de `test`/`cmp` supplémentaire), wrap 8 bits. Atteint 0 → sortie A : `pop edi/esi/ebp ; mov eax, 2 ; pop ebx ; retn` @0x6A3355-5E → retour 2. Sinon intégration puis `xor eax, eax` @0x6A33B1 → retour 0.

### D7 — Intégration pos += delta, delta += accél s8, angles += incrément byte
- A et B convergent sur la sémantique ; **tranché unanimement** :
  - positions += ANCIENNES valeurs des deltas : `add [esi+0Ch], ax` @0x6A3379 (ax lu @0x6A336F), `add [esi+0Eh], cx` @0x6A338E (cx lu @0x6A338A), `add [esi+10h], dx` @0x6A3392 (dx lu @0x6A337D) — adds 16 bits, wrap 16 bits.
  - deltas += accél octet signé (movsx) : 0x18→+0x12 (movsx di @0x6A3365, add edi,eax @0x6A3381, store low16 @0x6A3398), 0x19→+0x14 (movsx ax @0x6A3383, add eax,ecx @0x6A3396, store @0x6A33A6), 0x1A→+0x16 (movsx cx @0x6A339C, add ecx,edx @0x6A33A1, store @0x6A33AA).
  - angles : incrément BYTE, wrap 8 bits : 0x1E pilote 0x1C (`add cl, al` @0x6A336D, store @0x6A3373), 0x1F pilote 0x1D (`add bl, cl` @0x6A3388, store @0x6A33A3).
- Nuance de rendu : A modélise le store de +0x12 via un registre `di` 16-bit (fidèle à `mov [esi+12h], di`), B via `(signed short)(d12 + (s8))` — même résultat 16 bits. Tranché : formulation B (lisible) avec anchors A.

## Divergences vs Hex-Rays
1. **Conventions d'appel** : Hex-Rays type tous les helpers en stdcall (aucun `add esp` affiché). L'ASM prouve cdecl partout (un `add esp,44h` @0x6A3336 = 17 pushes + `add esp,4` @0x6A334B séparé).
2. **`g_BattleOTBase + 17`** (Hex-Rays) : arithmétique pointeur 4 octets ; l'ASM `add edx, 44h` @0x6A332A prouve l'offset **octet** 0x44.
3. **`(int)(v2 + 44)` / `(_DWORD *)v2 + 22`** : rendus Hex-Rays en unités de 2/4 octets ; offsets octets réels 0x58 et 0x58 (même adresse, rendus différents selon le type local).
4. **`16 * *(char *)(a1 + 29)`** : Hex-Rays omet le movsx signe (rendu identique, mais le `movsx`/`shl` de l'ASM = ×16 d'un octet **signé** ; noté explicitement dans le C réconcilié).
5. **Compteur** : Hex-Rays rend `v3 = ... - 1; if (!v3)` ; l'ASM = `dec al` + jnz ZF pur — équivalent, mais le wrap 8 bits et l'absence de cmp/test sont propres à l'ASM.

## UNCERTAIN restants
- UNCERTAIN 0x6A32A9 : type de retour exact de bs_modulo (EAX utilisé comme base pointeur ; void* supposé, B type int — équivalent machine, sémantique C non prouvée).
- UNCERTAIN 0x6A32C5 : prototype/sémantique de sub_6A3220 (args prouvés par pushes, retour et rôle non prouvés au seul call site).
- UNCERTAIN 0x6A3331 : sémantique de sub_572200 (4 args cdecl + write-back EAX→dword_2510258 prouvés ; hypothèse « head de liste chaînée FX » non prouvée ici).
