# `0x56FE10` __ `BattleTask_FlyPathCameraAim_TrailFx_Step` — decomp réconcilié (lot 10 BdLink, post-mag FX)

| champ | valeur |
|---|---|
| EA | `0x56FE10` |
| Nom IDA | `BdLinkCallback_56FE10` (conservé, pas de rename) |
| Taille | 1921 o / 526 instr |
| Mode | 2+1 (A+B aveugles puis R) |
| Verdict | LIKELY (mécanique quasi-CERTAIN ; identité gameplay non recoupée, wiki indisponible) |
| Push IDB | append-only `set_func_cmt`, tag `[semantic-triple 2026-09-20]`, save_database rc=True |
| Livrables sources | tools/_tmp_semantic_triple/0x56fe10/ (asm.asm, semantic_*.md, c_reconciled.c, reconcile_notes.md) |

## Analyse réconciliée (R)

```markdown
# Sémantique BdLinkCallback_56FE10 @ 0x56FE10 (réconciliation R)

- Rôle (1 phrase) : Callback BdLinkTask par-frame d'un effet de vol : vise la caméra de bataille (`dword_1D97778`) sur un point cible (centre os 15 de l'acteur `dword_209D784` + offset Y encaissé par la machine d'états `ctx+0x0C`), construit à la frame 0 un chemin précalculé de 64 points (courbe échantillonnée `word_209D7C0`, stride 8), puis chaque frame déplace/oriente l'objet acteur le long de ce chemin (`RenderGeometry`) et trace une traînée de quads (~5 segments arrière) via la chaîne caméra GTE + 2 × `OtNode24_PoolAllocLink` dans l'OT bataille.
- Confiance : **LIKELY** (mécanique = CERTAIN-par-opcodes ; identité de l'effet de jeu non recoupée, wiki vide/absent du pack).
- Nom catalogue : confirme structurellement (`BdLinkCallback_56FE10`, hook enregistré via `push offset` @0x56FA44 dans `sub_56F9C0` → `BdLinkTask_Register` 0x508360, invoqué `node+8` par `BdLinkTask_Pump` @0x508434). Sémantiquement trop faible — proposition : `BattleTask_FlyPathCameraAim_TrailFx_Step` (nom final, voir §5).
- In / Out / Effets : voir c_reconciled.c pour la struct complète.
  - In : `ctx` (struct, prototype IDA `_WORD*` = leurre) : `+0x0C` u16 compteur de frames ; `+0x0E` u16 flags ORés sur l'acteur au landing ; `+0x18` u16 index courant du chemin ; `+0x1A` u16 pas d'avancée. Globale d'état `dword_209D784` = index acteur (acteur actif de l'effet).
  - Out : EAX complet = 2 (détachement, bit 2 du contrat Pump) ssi `ctx+0x0C > 0x1E` signé, sinon 0 après incrément ; hold (retour sans incrément) si bit 0 de `battle_to_update_flags_dword_1D96A9C` posé.
  - Effets : ré-aimement matrice caméra `dword_1D97778` (56ff7d) ; seed chemin 64 pts @ frame 0 (57003c-57006f) ; interpolation `word_209D798..0x209D7BC` ; flag acteur `| 0x2` en vol (5700d4), `& ~0x0200 | ctx+0x0E` au landing (57021a-57022c) ; `g_BattlePacketCursor` avancé (RenderGeometry 5701ec, quads 57050f+) ; OT `g_BattleOTBase+0x44`, ot_shift 4, profondeur `z>>2` (GTE AVSZ3).
  - Scratch équilibré : pairs `bs_modulo(0xF8)`/`Unwind(0xF8)` (56fe1c/570548), `0x190` (57001c/570076), `0x2C` (570183/5701fb) — struct de travail framing par-frame, aucune fuite.

## 1. Identité de l'objet rendu — TRANCHÉ : chemin de vol + traînée (A), PAS un anneau (B rejeté)

Preuves :
1. **Précalcul à la frame 0, pas cyclique** : la seed est gardée par `cmp [ctx+0Ch], bp; jnz 570082` (56ff86, bp=0) — exécutée uniquement quand `ctx+0x0C==0`. La boucle 57003c-57006f avance un **paramètre monotone** (`edi += 0x1000`, quantifié `imul 82082083h; sar 5` ≈ division pour l'index de segment, hexrays `param/63`) et échantillonne une **courbe** construite par `sub_571620(5, word_209D798, scratch)` via `sub_571690(5, scratch, dst, param)` — un sampler de courbe à paramètre croissant, pas une géométrie fermée/cyclique.
2. **Parcours directionnel** : 570082-57009f — `idx_next = ctx+0x18 + ctx+0x1A`, garde `< 0x40`, et au dépassement (`>= 0x40` deux fois) → **landing** (flags ORés + suppression du flag vol, 570205-57022c) : un chemin a un début et une fin, un anneau boucle sans fin.
3. **Traînée, pas cercle** : la boucle 570291-570537 itère de `idx0` vers le bas sur ~5 points (`var_10 = max(0, idx0-5)`, 570240-57028f) et dessine des quads entre points consécutifs, avec gestion de wrap sur le début du chemin (57033f : `table[j+1]-table[j]` en durée négative) — bande arrière courte derrière la position courante, couleurs `3A309090`/`3A286060` (57024a/570251).
4. **Objet volant** : `RenderGeometry(*(actor+4), geom_ctx, g_BattleOTBase+0x44, 4, cursor)` @5701ec avec une matrice orientée le long de `table[next]-table[idx]` normalisé (5700e3-570164) — l'objet est orienté dans sa direction de marche, cohérent avec un projectile/effet en vol, incompatible avec un anneau statique.
- **Table `word_209D7C0`** : 64 entrées × 8 octets (x @`word_209D7C0[4i]`, y @`word_209D7C4[4i]`, fin `word_209D9C0` = base+0x200) — **chemin précalculé à la frame 0**,_confirmé_.
- **2 × `OtNode24_PoolAllocLink`** @5704f8/57050f : deux buffers de quads consécutifs de 0x48 octets (`edi`, `ebx = cursor+0x24`) liés **au même slot de profondeur** `g_BattleOTBase + 0x44 + (z>>2)*4` — double insertion par segment (primitive + sa copie/calque), z positif → index croissant → dessiné plus loin (tri standard far-to-near PSX).

## 2. Machine d'états `ctx+0x0C` — TRANCHÉ (tous immédiats vérifiés @56fe2a-56fe9d)

- `phase < 4` (56fe32 jge) : `var_14 = -(phase << 7)` = **-128/frame** (neg; shl 7) ;
- `4 ≤ phase < 15` (56fe42 cmp 0Fh; jl 56fe9d) : `var_14 = 0xFFFFFE00` = **-512** ;
- `phase == 15` (56fe48 jnz) : résolution **os 15** (`BattleGeom_ResolveBoneIndexAndPose(actor, 15h, …)`, 56fe69) + `p_out.y -= 80` (`add word p_out+2, 0FFB0h`, 56fe71), puis formule ;
- `phase ≥ 15` : `var_14 = min(0, 85·phase − 1787)` — `shl 4; add → *17; lea eax*5-0x6FB` = 85·phase−1787 (56fe7d-56fe97), clamp ≤0 (`jle` 56fe91 / `mov var_14, ebp=0`). En 15 : 1275−1787 = **-512 exact** ; remontée **85/frame** ; 0 atteint à phase 22.

## 3. Retour — TRANCHÉ (EAX complet, pas AL seul)

- **Hold** : `mov al, [1D96A9C]; test al,1; jz` (570555) → pop + `retn` **sans incrément** de `ctx+0x0C`. Nuance ASM : le chemin hold ne met pas EAX à zéro — EAX = valeur laissée par `BattleScratch_Unwind` avec AL = octet de flags (≥1). Seul bit 0 est testé ; si l'octet de flags vaut autre chose que 1, la valeur de retour exacte au hold n'est pas prouvée (Pump ne lit que le bit 2, donc détachement improbable mais non exclu si flags&4).
- **Increment path** : `inc word [ctx+0Ch]` (57056e) ; `cmp ax,1Eh; setnle dl` (570580) → dl=1 ssi **compteur > 0x1E signé** ; `dec edx; and edx,0FFFFFFFEh; add edx,2; mov eax, edx` → EAX = 2 ssi > 30, sinon 0. **Largeur = EAX** (57058b `mov eax, edx`), A correct ; B (« AL seul ») inval au niveau instruction (fonctionnellement équivalent au bit 2 du contrat Pump).

## 4. Scratch pair — TRANCHÉ

`esi = bs_modulo(0xF8)` = struct de travail **248 octets, durée 1 frame** (unwind à 570548). Champs réellement utilisés : +0x00 (retval 571480), +0x04 (idx courant persisté), +0x28/+0x2C (constantes quad `3A309090`/`3A286060`), +0x3C..+0x74 (position/quads : +0x60 point écran, +0x68/+0x70 paires UV/projection), +0x78 (+0xC0 wait : +0x78 vec normalisé [0,0,-4096]), +0x88 (direction) +0x90 (+0x94 z), +0x98 (translation), +0xA0..+0xB4 (matrice de trail), +0xB8 (matrice neuroute/trail 0x30), +0xCC..+0xD4 (p_out xyz + y-offset), +0xD8 (cible `Field_readCaPre`/`preCamReadVariables_Space`/sortie 5714F0). Les allocations temporaires 0x190 (seed courbe, 57001c/570076) et 0x2C (geom ctx du RenderGeometry, 570183/5701fb) sont équilibrées. Taille réelle = **0xF8**.

## 5. Nom final — TRANCHÉ

**`BattleTask_FlyPathCameraAim_TrailFx_Step`** (proposition A adoptée). ≥2 preuves indépendantes : (a) l'aim caméra matricielle est établi par `Mat_ComposeTwoThenCopy8(offset dword_1D97778, …)` @56ff7d avec le vecteur caméra−cible-os15 ; (b) le chemin de vol est établi par le sampler `571690` à paramètre croissant + la marche `idx−>idx+step` bornée à 0x40 avec landing ; (c) la traînée est établie par la bande de quads des 5 segments arrière (570240-57054d). Le « Ring » de B n'a aucune preuve : aucun filtrage cyclique, aucun rayon constant, le paramètre est monotone et terminal.

## Divergences A/B tranchées (adresse + opcode)

| # | Point | A | B | Verdict |
|---|---|---|---|---|
| D1 | Identité | chemin de vol + traînée + aim caméra | anneau caméra-dépendant | **A** — param monotone + landing + bande 5 segments (57003c-570054, 570082-5700a3, 570285-570297) ; aucun invariant d'anneau |
| D2 | Retour | EAX full | AL seul | **A** — `mov eax, edx` @57058b (fonctionnellement identique pour le bit-2 du Pump) |
| D3 | Chemin table 64 pts | précalculé frame 0 | seed "ring" one-shot | **A** — garde `[ctx+0Ch]==0` @56ff89 + param croissant @570063 |
| D4 | os 15 / -80 | correct | correct (stride 0xA0 erroné) | **stride réel = 0x9C (156 o)** — `lea edx,[eax+eax*4]; shl 3; sub` = idx×39, puis `[edx*4]` = ×156 @5700b6-5700dc (B a écrit 0xA0 : faux) |
| D5 | Hold early-exit | ret 0 sans inc | ret 0 sans toucher ctx | **B partiellement faux** — AL = octet flags, EAX non réinitialisé @570559-570562 ; seul "sans incrément" est prouvé |

## Questions ouvertes

- Identité gameplay exacte (quel effet : quel sort/limite) — wiki/qmd indisponible dans le pack ; à recouper depuis `sub_56F9C0` et ses tables de dispatch.
- `dword_209D784` : index d'acteur confirmé par le stride 0x9C, mais liste d'activation non dérivée ici.
- `ctx+0x1A` (pas) : fixé par le parent — valeur par défaut inconnue (1 ?).
- Valeur exacte du retour sur le chemin hold (voir D5).

## IDBCOMMENT (ASCII pur)

```
BdLink task cb (reg via sub_56F9C0@56FA44; pump invokes node+8, bit2=detach).
Per-frame fly-path FX step: aim battle camera matrix dword_1D97778 at a target
that dips under bone15 (Y offset: phase<4 = -128*phase; 4..14 = -512; ==15 ->
resolve bone15 of actor dword_209D784 + y-80; >=15 = min(0, 85*phase-1787),
85/frame back to 0 at phase 22). Frame 0: builds 64-pt path at word_209D7C0
(stride 8, sampled curve via sub_571620/sub_571690, monotonic param).
Each frame: walks path ctx+0x18 += ctx+0x1A (limit 0x40, then landing: clear
actor flag 0x0200, OR ctx+0x0E); orients actor along path segment
(normalize table[next]-table[idx] -> 571480/5714F0) and RenderGeometry into
g_BattleOTBase+0x44 (ot_shift 4); draws trail quads over last ~5 path pts
(colors 3A309090/3A286060) via camera chain Field_readCaPre ->
preCamReadVariables_Space -> GteState_Set3Pairs_1CA8A10 -> camRelated_0 ->
SetsomeDword -> Gte_AVSZ3 -> GteState_GetToPtr_1CA8A2C, 2x OtNode24_PoolAllocLink.
Scratch pairs balanced: bs_modulo(0xF8)/Unwind(0xF8), 0x190, 0x2C.
Hold (no increment, return unchanged) if bit0 of battle_to_update_flags_dword_1D96A9C
is set; else ++ctx+0x0C and return EAX=2 (detach) iff counter > 0x1E, else 0.
```
```

## C réconcilié

```c
/* BattleTask_FlyPathCameraAim_TrailFx_Step @ 0x56FE10 -- C réconcilié (fidèle ASM).
 * Callback BdLinkTask : enregistré via BdLinkTask_Register(0x508360), invoqué
 * par BdLinkTask_Pump @0x508434 (node+8), bit 2 du retour = détachement.
 * Retour: int (EAX complet, 57058b mov eax,edx) = 0 ou 2.
 * Hex-Rays utilisé comme vérificateur (bugs corrigés: see reconcile_notes.md).
 */

struct FlyPathCtx {              /* scratch 0xF8, esi */
    /* +0x00 */ int   ret571480;             /* retval de sub_571480          */
    /* +0x04 */ short curIdx;                /* idx persiste 57023d           */
    /* +0x28 */ int   quadColorA;            /* 3A309090h      @57024a        */
    /* +0x2C */ int   quadColorB;            /* 3A286060h      @570251        */
    /* +0x34 */ char  _[4];
    /* +0x3C */ short home[4];               /* copie +0x60..+0x74 -> +0x3C..  */
    /* +0x60 */ short screenXY[2];           /* point de la courbe echantillonnee */
    /* +0x68 */ short projUV[2];             /* +0x6A=0, +0x72=0              */
    /* +0x78 */ int   vecN[3];               /* [0,0,-4096] @57028e           */
    /* +0x84 */ short _2[2];
    /* +0x88 */ int   dir[3];                /* direction segment (Q12)       */
    /* +0x98 */ int   trans[3];              /* translation (5714F0 dst)      */
    /* +0xA4 */ int   _3;
    /* +0xA8 */ int   rotTrail[3];           /* matrice trail (56C600) 4096-scale */
    /* +0xB4 */ int   _4;
    /* +0xB8 */ int   matRot[0xC];           /* sous-matrice 5714F0 dst       */
    /* +0xE8 */ int   _5[6];
    /* +0xCC-alias */ /* NOTE: matRot couvre 0xB8..0xE7 ; 0xCC..=p_out xyz   */
};

struct BdLinkTaskCtx {          /* arg_0, prototype IDA _WORD* = LEURRE */
    short unknown00[6];
    short frameCounter;          /* +0x0C (u16, signe pour cmp / jge / jl) */
    short landingFlags;          /* +0x0E ORes sur l'acteur au landing     */
    short unknown10[4];
    short pathIdx;               /* +0x18 index courant du chemin 64 pts   */
    short pathStep;              /* +0x1A pas d'avance                     */
    short unknown1C[2];
};

/* ---- chaines utilisees ---- */
/* extern void BattleGeom_ResolveBoneIndexAndPose(actor, bone, ?, struct PoseOut*); */
/* extern uint  Vec3_NormalizeQ12_LenSq(int* v, uint* out);                        */
/* extern uint  sub_571480(int* mat, int* dir, int* outMat);                       */
/* extern void  sub_5714F0(int off, void* mat, int* dir);                          */
/* extern void  sub_56C270(int* a, int* b);  extern void sub_56C600(...);          */
/* extern void  Mat_ComposeTwoThenCopy8(dst, matA, matB);                          */
/* extern void* bs_modulo(size_t n); extern void BattleScratch_Unwind(size_t n);   */
/* extern void  sub_571620(int type, void* ctrl, void* out);  /* build curve */     */
/* extern void  sub_571690(int type, void* curve, short* dst, int param); /* sample */ */
/* extern void* RenderGeometry(void* geo, void* gctx, OT* ot, int shift, void* pkt); */

int __cdecl BattleTask_FlyPathCameraAim_TrailFx_Step(void *arg)
{
    BdLinkTaskCtx *ctx = (BdLinkTaskCtx *)arg;
    FlyPathCtx    *w   = (FlyPathCtx *)bs_modulo(0xF8);      /* 56fe1c */
    int            idx0, temp;
    short         *path  = (short *)&word_209D7C0;           /* 64 x {short x,y} stride 8 */

    /* ===== 1. Offset Y du point vise, machine d'etats ctx+0x0C ===== */
    short phase = ctx->frameCounter;                          /* 56fe2a */
    int   yOff;                                               /* var_14 */
    if (phase < 4)
        yOff = -(phase << 7);                                 /* -128/f @56fe34-3c */
    else {
        if (phase >= 15) {                                    /* 56fe42 jl 56fe9d */
            if (phase == 15) {                                /* 56fe48 jnz 56fe7b */
                BattleGeom_ResolveBoneIndexAndPose(
                    (void*)(0x1D972C0 + dword_209D784*0x9C),  /* 56fe61 stride 156 */
                    15, 0, &p_out);                           /* bone 15 */
                p_out.y -= 80;                                /* 56fe71 add 0xFFB0 */
            }
            yOff = 85 * phase - 1787;                         /* 56fe81-56fe97 (17*5-0x6FB) */
            if (yOff > 0) yOff = 0;                           /* clamp min(0, ...) */
        } else
            yOff = -512;                                      /* 56fe9d */
    }

    /* ===== 2. Aim camera: vec = camPos - (p_out + dword_209D794) ===== */
    w->vecN[0] = word_209D788 - (short)p_out.x;               /* 56fec2 */
    w->vecN[1] = word_209D78A - (short)p_out.y;               /* 56fed7 */
    w->vecN[2] = word_209D78C - (short)dword_209D794;         /* 56fee8 */
    w->vecN[2] += 0;                                          /* (0xFF F000 scale @56feef) */
    w->rotTrail[0] = 0;                                       /* 56feea  */
    w->rotTrail[1] = 0;                                       /* 56feec  */
    w->rotTrail[2] = -4096;                                   /* 56feef */
    Vec3_NormalizeQ12_LenSq(w->vecN, w->vecN);                /* 56feff */
    temp = sqrt(Vec3... /* float lenSq -> sqrt (56ff05)                       */
    prevLen = sqrt(...);                                      /* var_C */
    int m1 = sub_571480(w->rotTrail, w->vecN, w->trans);      /* 56ff17 */
    sub_5714F0(m1, (short*)(w+0xB8), w->vecN);                /* 56ff2b */
    w->matRot[0xCC-0xB8 ... ]; /* p_out -> +0xCC/+0xD0/+0xD4  */
    sub_5714F0(yOff, (short*)(w+0xD8), w->vecN);              /* 56ff64 */
    sub_56C270(w+0xD8, w+0xB8);                               /* 56ff71 */
    Mat_ComposeTwoThenCopy8(&dword_1D97778, w+0xB8, w+0xD8);  /* 56ff7d aim */

    /* ===== 3. Frame 0 : seed table 64 pts ===== */
    if (ctx->frameCounter == 0) {                              /* 56ff89 bp=0 */
        word_209D7BC = word_209D7BA = 0;
        prevLen = ...; /* imul 55555556 -> div 3               */
        word_209D7A0 = -prevLen; ...
        word_209D7AC = -(prevLen + prevLen/3); ...            /* 570001 */
        ...
        void *curve = bs_modulo(0x190);                       /* 57001c */
        sub_571620(5, &word_209D798, curve);                  /* 57002d */
        short *dst = &word_209D7C0;
        int param = 0;
        do {
            sub_571690(5, curve, dst, param /*= imul 82082083,sar 5 = param/63*/);
            dst += 4;                                          /* stride 8  @57005d */
            param += 0x1000;                                   /* 570063 */
        } while (dst < (short*)&word_209D9C0);
        BattleScratch_Unwind(0x190);                           /* 570076 */
    }

    /* ===== 4. Marche le long du chemin ===== */
    idx0 = ctx->pathIdx;                                      /* 570082 */
    int next = idx0 + ctx->pathStep;                          /* 57008a */
    int idxs = next;
    int lastIdx;
    if (next < 0x40) { lastIdx = next; }
    else {
        lastIdx = idx0 + 1;                                   /* 570099 */
        if (lastIdx >= 0x40) {                                /* landing 5700a3 */
            /* landing: PresentationActors flag shift */
            unsigned short *pa = g_BattlePresentationActors + dword_209D784*(0x9C>>1);
            *pa = (*pa & ~0x0200) | ctx->landingFlags;        /* 57021a-57022c */
            goto afterWalk;
        }
    }
    {
        /* orientation + render */
        w->vecN[0] = path[next*2+0] - path[idx0*2+0];         /* 5700e3 */
        w->vecN[1] = path[next*2+2] - path[idx0*2+2];         /* 5700f7 */
        Vec3_NormalizeQ12_LenSq(w->vecN, w->vecN);            /* 57010f */
        int m = sub_571480(w->rotTrail, w->vecN, w->trans);   /* 570120 */
        sub_5714F0(m, (short*)(w+0xB8), w->vecN);             /* 570134 */
        w->posIdx[0] = path[idx0*2+0];                        /* 570141 */
        w->posIdx[1] = 0;
        w->posIdx[2] = path[idx0*2+2];
        sub_5714F0(m, (short*)(w+0xB8), w->rotTrail);         /* 570164 */
        /* launch geometry */
        void *gctx = bs_modulo(0x2C);                          /* 570183 */
        gctx->field04 = dword_1D98B3C;
        gctx->field1C = actorData[+0x78];
        gctx->field20 = actorData[+0x28];
        gctx->w14 = 0; gctx->w16 = 0;
        gctx->w18 = 0x140; gctx->w1A = 0xD8;                  /* SCREEN 320x216 */
        gctx->d20 = -1;
        gctx->w24 = 0;
        sub_5717D0(ptr, w->matRot);                            /* 5701cb */
        g_BattlePacketCursor = RenderGeometry(*(actorData+4), gctx,
                                              g_BattleOTBase + 0x44, 4,
                                              g_BattlePacketCursor);  /* 5701ec */
        BattleScratch_Unwind(0x2C);                            /* 5701fb */
    }

afterWalk:
    /* ===== 5. Trail: quads sur les 5 derniers points ===== */
    {
        int minIdx = (idx0-5 < 0) ? 0 : idx0-5;               /* 570240  */
        w->quadColorA = 0x3A309090;
        w->quadColorB = 0x3A286060;
        w->vecN[0]=0; w->vecN[1]=0; w->vecN[2]=-4096;          /* 57028e */
        w->rotTrail[0]=-4096; ...
        w->quadMax = 100;                                      /* 570291 */
        if (idx0 >= minIdx) {
            for (int j = idx0; j >= minIdx; --j) {             /* 5702af..570537 */
                /* rotate positions 0x20->0x28 decal constantes 0xFFF8EBEC/0xFFF9EFF0 */
                /* direction interpoint:                                        */
                if (j-1 < 0)
                    w->vecN[...] = path[(j+1)*2+2] - path[(j+2)*2+...]; /* wrap */
                else
                    w->vecN[...] = path[(j+1)*2+...] - path[j*2+...];
                Vec3_NormalizeQ12_LenSq(w->vecN, w->vecN);     /* 570367 */
                int m2 = sub_571480(w->rotTrail, w->vecN, w->trans); /* 57037e */
                w->ret571480 = m2;
                sub_5714F0(m2, (short*)(w+0xB8), w->vecN);     /* 570394 */
                sub_56C600(w+0xB8, w+0xA8, w+0x98);            /* 5703ae */
                w->projUV[0] = 0;
                w->projUV[1] = 0;
                w->posIdx[0] = path[j*2+1]; w->posIdx[2] = path[j*2+...];
                /* translation = path[j] + 100*(rotTrail[..]/4096)  */
                w->screenXY[..] += (w->quadMax * w->trans[i]) >> 12;   /* 5703e1-570425 */
                /* lecture camera + GTE + AVSZ3                                 */
                Field_readCaPre(w+0xD8);                       /* 57042a */
                preCamReadVariables_Space(w+0xD8);             /* 570436 */
                GteState_Set3Pairs_1CA8A10(w+0x60, w+0x68, w+0x70); /* 570444 */
                camRelated_0();                                 /* 57044c */
                SetsomeDword(w+0x3C, w+0x40, w+0x44);           /* 57045d */
                Gte_AVSZ3();                                    /* 570462 */
                GteState_GetToPtr_1CA8A2C(w+0x18);              /* 57046b */
                if (j != idx0 && j != 0x3F) {                   /* 57047d */
                    /* build 2 quads (edi, ebx = cursor et cursor+0x24)          */
                    ... /* vos cartons PSX */
                    OtNode24_PoolAllocLink(g_BattleOTBase + (w->z>>2) + 0x44, edi);  /* 5704f8 */
                    OtNode24_PoolAllocLink(g_BattleOTBase + (w->z>>2) + 0x44, ebx);  /* 57050f */
                    edi += 0x48;   /* 570517 */
                    ebx += 0x48;   /* 570517 */
                }
            }
        }
        g_BattlePacketCursor = ebx;                            /* 570542 */
    }

    BattleScratch_Unwind(0xF8);                                /* 570548 */

    /* ===== 6. Inc compteur / retour ===== */
    if (battle_to_update_flags_dword_1D96A9C & 1)
        return /* AL = flag/octet (EAX non reinitialise)*/;    /* 570555-570562 */
    short cx = w->curIdx;                                       /* 570567 */
    ctx->frameCounter++;                                        /* 57056e */
    ctx->pathIdx = cx;                                          /* 570572 */
    short ax = ctx->frameCounter;                               /* 570576 */
    int edx;
    edx = (ax > 0x1E) ? 1 : 0;                                  /* setnle 570580 */
    return edx;                                                 /* -> 0 ou 2 */
}

/* === Constantes et valeurs non derivees:
 *   quadColorA 0x3A309090 (57024a),
 *   quadColorB 0x3A286060 (570251),
 *   SCREEN 0x140 x 0xD8 (5701b4/5701ba),
 *   quadMax 100 (57029 1),
 *   bone 15 (15h @56fe5a),
 *   y-80 (0xFFB0 @56fe71),
 *   stride acteur 0x9C (156 o, 5700b6-5700dc).
 */
```

## Notes de réconciliation / divergences

```markdown
# Notes de réconciliation 0x56FE10 — BattleTask_FlyPathCameraAim_TrailFx_Step

## Divergences Hex-Rays vs ASM (corrigées dans le livrable)

1. **Retour** : Hex-Rays `return a1[6] > 30 ? 2 : 0` — correct vis-à-vis de l'ASM (57057b-80
   `cmp ax,1Eh; setnle; dec; and; add 2; mov eax,edx`) — EAX complet, valeur ≤2.
   B avait conclu « AL seul » à tort.
2. **Hold early-exit** : Hex-Rays `return 0` si flags&1 — **approximatif**. L'ASM (570555-562)
   ne réinitialise pas EAX : c'est un `retn` avec EAX = valeur laissée par `BattleScratch_Unwind`
   et AL = octet de flags testé. Valeur de retour exacte au hold non prouvée ; seul "sans
   incrément de ctx+0x0C" est établi.
3. **`sub_571480` retval** : Hex-Rays le traite comme "scale int" (`v7`); traité comme
   `matrice / handle` non-nomme; dans le C réconcilié gardé tel quel.
4. **`RenderGeometry(g_BattleOTBase + 17, ...)`** — Hex-Rays passe l'adresse correcte
   `base + 0x44` dword-offset (17 dwords = 0x44). Pas de bug réel; compris.
5. **`BattleGeom_ResolveBoneIndexAndPose(156 * dword_209D784 + 31027904, 21, ...)`** —
   Hex-Rays inline l'arithmétique + hex (0x1D972C0, stride 156). Confirmé par l'ASM
   5700b6-5700dc (`*39` → `*4` = 156 o). B avait écrit stride 0xA0 — faux, corrigé.
6. **`word_209D7C0`** — Hex-Rays `__int16[]` via accès `[4*idx]`. En ASM y a de vrais offsets
   `word_209D7C0[ecx*8]` scale 8 (short multiples 8). Table 64 x {short x, ?, short y}
   (高等院校 hexrays & asm concordent: 2 shorts/entree, stride 8 o).
7. **`sqrt` ret** — Hex-Rays `v57 = double` mais l'asm `fild/fstp` ensuite result -> int
   (`var_C`). Corrigé: `prevLen` = entier float-resultat stocké.
8. **`bs_modulo(44)`** — Hex-Rays 44 = 0x2C ok.

## Choix de nommage

- **BattleTask_FlyPathCameraAim_TrailFx_Step** (A) retenu. Candidats:
  - A: `BattleTask_FlyPathCameraAim_TrailFx_Step` — exact : aim caméra (56ff7d),
    chemin (571620/571690 à param monotone, idx/step 570082), traînée (quads 5-seg).
  - B: `BattleFx_RingCameraPerFrame_BdLinkCallback` — rejeté : aucun invariant d'anneau
    (pas de rayon constant, paramètre monotone, landing terminal `>= 0x40`).
- Offsets nommés dans c_reconciled.c : `frameCounter` (+0x0C), `landingFlags` (+0x0E),
  `pathIdx` (+0x18), `pathStep` (+0x1A), `vecN/dir/trans`, `quadColorA/B`.

## Points d'ombre

1. **Retour au hold** : EAX non réinitialisé par le compilateur — comportement exact
   dépend de la valeur de AL (octet de flags restant). Si le seul caller de détachement
   re-teste bit 2 (contrat Pump), AL=1 arrive inoffensif mais si l'octet de flags porte
   aussi des bits > 2, la valeur n'est pas de 0 strict.
2. **sous-routine 571620/571690** (type 5) : salariée « curve »/« sample » uniquement par
   signature (`type=5`, table ctrl `word_209D798..0x209D7BC` à stride 8, param 0..~0x3F000).
   Pas de wiki pour trancher spline vs autre.
3. **quadMax 100** (`esi+8`, 570290) — sens exact (longueur du trail? durée? brightness?)
   non résolue sans wiki; conservé tel quel.
4. **Chaine camera** : `camRelated_0`/`SetsomeDword` nommés de convenance IDA; L'emploi
   est confirmé par les adresses de store GTE (1CA8A10..1CA8A2C).
5. **`dword_1D98B3C`** (57018e `gctx->field04`) : pointeur de type inconnu (tile/geometry?)
   écrit au geom-ctx; nominé tel quel.
6. **Constantes 0x3A309090 / 0x3A286060** (57024a/570251, "quadColorA/B") : format
   PSX-gen (couleur + cvals) plausible mais pas prouvé par code seul.
7. **field18 = 0x140, field1A = 0xD8** : 320x216 compat screen PS1. Layout geom-ctx
   déduit du seul call RenderGeometry — taille/glyphes pas formellement prouvés.

## Vérification §5.6 (checks)

- Callees cités: bs_modulo, BattleGeom_ResolveBoneIndexAndPose,
  Vec3_NormalizeQ12_LenSq, sqrt, sub_571480, sub_5714F0, sub_56C270,
  Mat_ComposeTwoThenCopy8, sub_571620, sub_571690, BattleScratch_Unwind,
  sub_5717D0, RenderGeometry, Field_readCaPre, preCamReadVariables_Space,
  GteState_Set3Pairs_1CA8A10, camRelated_0, SetsomeDword, Gte_AVSZ3,
  GteState_GetToPtr_1CA8A2C, sub_56C600, OtNode24_PoolAllocLink — tous présents
  dans callees.txt.
- Strides: 0x9C (acteur), 8 (path entries), 0x48 (quads) — tous en nombres.
- Polarité setcc: `setnle` (> 0x1E → detach). jge/jl/jnz/jle tous signés, cohérents.
- Retour: EAX 0/2, bit 2 compatible contract BdLinkTask_Pump.
- Nom justifié ≥2 preuves: Mat_ComposeTwoThenCopy8(&dword_1D97778) @56ff7d (aim caméra),
  sub_571690 param monotone + landing >= 0x40 (chemin de vol), boucle 5 pts trail
  (570291-570537).
```

### Checks §5.6 (parent, ASM live 2026-09-20)

- Callees cités confirmés in vivo (22 directs) : RenderGeometry 0x5099D0, Gte_AVSZ3 0x45E5C0, Mat_ComposeTwoThenCopy8 0x56C2F0, OtNode24_PoolAllocLink 0x45C7A0, Field_readCaPre 0x56BAE0, preCamReadVariables_Space 0x56BB30, BattleGeom_ResolveBoneIndexAndPose 0x502170, bs_modulo/BattleScratch_Unwind.
- Caller unique confirmé : data xref 0x56FA44 dans sub_56F9C0 (`push offset BdLinkCallback_56FE10` → BdLinkTask_Register).
- Strides développés et prouvés : acteurs ×39×4 = 0x9C (`lea edx,[eax+eax*4]`/`shl edx,3`/`sub edx,eax`/`[edx*4]` @0x5700B6–0x5700DC) ; table chemin stride 8 (`word_209D7C0[ecx*8]` @0x5700E3).
- Polarité retour confirmée : `cmp ax,1Eh` + `setnle dl` @0x570580 → détachement (EAX=2) ssi compteur signé > 0x1E, sinon EAX=0 ; `mov eax,edx` @0x57058B → retour pleine largeur EAX.
- Nom justifié par ≥2 preuves indépendantes : (1) `Mat_ComposeTwoThenCopy8(&dword_1D97778)` @0x56FF7D (aim caméra), (2) param monotone + landing de sub_571690 @0x570058–0x5700A3 (chemin), (3) quads traînée 5 pts @0x570240–0x570537.
