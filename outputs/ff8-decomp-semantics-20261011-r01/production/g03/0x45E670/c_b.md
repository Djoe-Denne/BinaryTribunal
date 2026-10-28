# 0x45E670 — production C, auteur B (c-b-45e670)

Mission `ff8-decomp-semantics-20261011-r01`, groupe g03, rôle B indépendant (2+1).
Production uniquement : pas de verdict final, pas de compilation, pas de test exécuté.

## Entrées lues (hashes tels que déclarés par le manifeste, non recalculés par moi)

| Entrée | sha256 déclaré |
|---|---|
| paquet natif `inputs/ff8-decomp-semantics-20261011-r01/g03/0x45E670.json` (autorité) | `06476e1094d6963e3532e19496a495b87b348503b4e79216e537b193aa571774` |
| `g03/common-compaction.md` | `9959dc7995e01db21518f4c15252096543ca53ec042a342d705dce6badf71572` |
| `0x45E670.readable/asm-001.txt` .. `asm-004.txt` | b2336cbb… / e5a64ec0… / e91a9043… / 75272f59… |
| `0x45E670.readable/bytes-001.txt` | `04145c36f690710c461b6ffce8f79b685c14b2e2dd4cfb2aa42e16b38f5f079a` |
| `0x45E670.readable/metadata.json` | `cc105c59533a2eb308e823314ae9445da07b2a9f2837dce565954cbdeaaf4b70` |

PE d'entrée : FF8_EN.exe sha256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
Non lus (consigne) : C antérieur de la cible, notes decomp, ledger, sorties voisines, IDB.

## Couverture

- 92/92 lignes ASM (asm-001 lignes 1-25, asm-002 1-25, asm-003 1-25, asm-004 1-17) couvertes.
- Chunk unique 0x45E670–0x45E81A (0x1AA = 426 octets ; bytes-001 = 13×32 + 10 = 426 octets) couvert.
- 15/15 blocs CFG (metadata.json:11-117) mappés dans le C (tableau en fin de document).
- Encodages contrôlés octet par octet sur les points sensibles :
  `D9 05 imm32` = `fld m32real` (float 32 bits) aux VA 0x01CA9244 / 0x01CA924C / 0x01CA923C ;
  `DC 05 D8 93 B6 00` = `fadd m64real [0x00B693D8]` (double) ;
  `DD 5C 24 00` = `fstp m64real [esp]` (QWORD) ; `DD D8` = `fstp st(0)` (pop simple) ;
  `DE E9` = `fsubp st(1),st` → ST(1) = ST(1) − ST(0), pop (SDM : DE E8+i) ;
  `D8 C9`/`D8 CB`/`D8 CA` = `fmul st,st(1|3|2)` ;
  `7D` = JGE, `7E` = JLE (comparaisons **signées**) ;
  `C7 05 F8 92 CA 01 00 00 00 81` = `mov dword [0x01CA92F8], 0x81000000` ;
  `0D 00 00 80 80` = `or eax,0x80800000` ; `0D 00 00 40 00` = `or eax,0x00400000` ;
  `A3 imm32` / `89 0D` / `89 15` = stores 32 bits pleins ; `C3` = `retn` sans immédiat.

## ABI / frame

- `sub esp,8` (0x45E670) : unique local = QWORD de transit x87 à `[esp+0]` (`var_8`), utilisé
  aussi pour l'ILD des entiers (stores DWORD 0x45E68B/0x45E6A0/0x45E6AB) puis pour le
  résultat double (fstp m64 0x45E6CB/0x45E6F5/0x45E723) relu en DWORD bas.
- Aucun accès `[esp+N]` au-delà de la frame locale → **0 argument**. `retn` (C3) sans imm,
  trois épilogues `add esp,8; retn` (0x45E7E7, 0x45E80C, 0x45E816) → nettoyage appelant,
  compatible cdecl `void(void)` (indiscernable de stdcall 0-arg).
- Registres touchés : EAX, ECX, EDX seulement (volatils). EBX/ESI/EDI/EBP intacts. Pas d'appel
  (`code_targets=[]`, metadata.json:186).
- Pile x87 : 9 push (3 `fild` + 6 `fld`) / 9 pop (3 `fsubp` + 3 `fstp m64` + 3 `fstp st`),
  profondeur max 5 → pile x87 vide en sortie sur les trois chemins.
- EAX en sortie : résidu non garanti comme valeur de retour (voir §EAX). Le prototype
  retenu est `void`; le modèle exact de EAX est conservé dans `_impl`.

## Traçage pile x87 (preuve d'ordre des opérandes)

```
0x45E699 fild I1            ST: I1
0x45E6A4 fild I2            ST: I2 I1
0x45E6AF fild I3            ST: I3 I2 I1
0x45E6B3 fld  F(0x1CA9244)  ST: Y2 I3 I2 I1
0x45E6B9 fmul st,st(1)      ST: Y2*I3 I3 I2 I1
0x45E6BB fld  F(0x1CA924C)  ST: Z3 Y2*I3 I3 I2 I1
0x45E6C1 fmul st,st(3)      ST: Z3*I2 Y2*I3 I3 I2 I1
0x45E6C3 fsubp st(1),st     ST: (Y2*I3 - Z3*I2) I3 I2 I1
0x45E6C5 fadd m64 MAGIC ; 0x45E6CB fstp m64 [esp]       ST: I3 I2 I1
0x45E6CF fld  F(0x1CA924C)  ST: Z3 I3 I2 I1
0x45E6D5 fmul st,st(3)      ST: Z3*I1 I3 I2 I1
0x45E6D7 fld  F(0x1CA923C)  ST: X1 Z3*I1 I3 I2 I1
0x45E6DD fmul st,st(2)      ST: X1*I3 Z3*I1 I3 I2 I1
0x45E6E8 fsubp st(1),st     ST: (Z3*I1 - X1*I3) I3 I2 I1
0x45E6EF fadd MAGIC ; 0x45E6F5 fstp m64 [esp]           ST: I3 I2 I1
0x45E6FD fstp st            ST: I2 I1
0x45E6FF fld  F(0x1CA923C)  ST: X1 I2 I1
0x45E705 fmul st,st(1)      ST: X1*I2 I2 I1
0x45E707 fld  F(0x1CA9244)  ST: Y2 X1*I2 I2 I1
0x45E70D fmul st,st(3)      ST: Y2*I1 X1*I2 I2 I1
0x45E71B fsubp st(1),st     ST: (X1*I2 - Y2*I1) I2 I1
0x45E71D fadd MAGIC ; 0x45E723 fstp m64 [esp]           ST: I2 I1
0x45E72B fstp st            ST: I1
0x45E738 fstp st            ST: (vide)
```

`In = (int32)(int16)low16(dword_1CA8A3x) << 12` ; X1/Y2/Z3 = labels IDA (hypothèses de nom),
adresses primaires 0x01CA923C / 0x01CA9244 / 0x01CA924C (espacement 8 octets).

## C complet

```c
/* 0x0045E670  Gte_Cross3Float_SatS16 (label IDA, hypothèse de nom)
 * Fidélité : ordre des écritures mémoire, largeurs, signedness, wrap et EAX résiduel
 * reproduits ; aucun appel de bibliothèque, aucune garde ajoutée.
 * Hypothèse d'environnement x87 : voir "Risques" (PC / RC). */
#include <stdint.h>

#pragma STDC FP_CONTRACT OFF      /* pas de FMA : produits et soustraction séparés */

/* --- globals (adresses primaires du paquet natif) ---------------------------- */
extern uint32_t dword_1CA8A34;   /* lu : low16 signé (movsx word) ; écrit : dword plein */
extern uint32_t dword_1CA8A38;   /* idem */
extern uint32_t dword_1CA8A3C;   /* idem */
extern uint32_t dword_1CA8A74;   /* écrit seulement (dword) */
extern uint32_t dword_1CA8A78;   /* écrit seulement (dword) */
extern uint32_t dword_1CA8A7C;   /* écrit seulement (dword) */
extern uint32_t dword_1CA92F8;   /* écrit (=0, =imm, |=imm) */
extern float    Cam_xyz1_x_float; /* VA 0x01CA923C, fld m32 */
extern float    Cam_xyz2_y_float; /* VA 0x01CA9244, fld m32 */
extern float    Cam_xyz3_z_float; /* VA 0x01CA924C, fld m32 */
/* VA 0x00B693D8, fadd m64 ; valeur = label IDA 4.503601774854144e15 = 2^52 + 2^31 */
extern const double CONST_4_503601774854144e15;

/* Modèle d'un registre x87 ST(i). double <=> PC=53 bits ; mettre long double pour PC=64. */
typedef double x87_t;

/* movsx r32, word ptr [g] : 16 bits bas (little-endian) signés.
 * Note largeur : l'ASM n'accède qu'au WORD ; la troncature ici est équivalente en valeur. */
#define LOW16S(g) ((int32_t)(int16_t)(uint16_t)(g))

/* fadd m64 MAGIC ; fstp qword [esp] ; mov r32, dword [esp]  -> DWORD bas du double */
static uint32_t x87_magic_lo32(x87_t st0)
{
    union { double d; uint32_t u[2]; } q;          /* [esp+0] QWORD, little-endian */
    q.d = (double)(st0 + (x87_t)CONST_4_503601774854144e15); /* fadd puis arrondi m64 au fstp */
    return q.u[0];                                  /* mov reg, dword ptr [esp+0] */
}

static uint32_t Gte_Cross3Float_SatS16_impl(void)  /* retourne le EAX résiduel exact */
{
    uint32_t eax, ecx, edx;
    x87_t    i1, i2, i3;

    eax = (uint32_t)LOW16S(dword_1CA8A34);          /* 0x45E673 movsx eax */
    ecx = (uint32_t)LOW16S(dword_1CA8A38);          /* 0x45E67A movsx ecx */
    edx = (uint32_t)LOW16S(dword_1CA8A3C);          /* 0x45E681 movsx edx */

    eax <<= 12;                                     /* 0x45E688 shl eax,0Ch (logique, 32 bits) */
    dword_1CA92F8 = 0;                              /* 0x45E68F */
    i1 = (x87_t)(int32_t)eax;                       /* 0x45E68B/0x45E699 fild dword signé */
    ecx <<= 12;                                     /* 0x45E69D */
    i2 = (x87_t)(int32_t)ecx;                       /* 0x45E6A0/0x45E6A4 */
    edx <<= 12;                                     /* 0x45E6A8 */
    i3 = (x87_t)(int32_t)edx;                       /* 0x45E6AB/0x45E6AF */

    /* terme 1 : ST(1)-ST(0) = Y2*I3 - Z3*I2           0x45E6B3..0x45E6CB */
    eax  = x87_magic_lo32((x87_t)Cam_xyz2_y_float * i3 - (x87_t)Cam_xyz3_z_float * i2);
    eax += 0x80000000u;                             /* 0x45E6E3 add (wrap mod 2^32) */
    dword_1CA8A74 = eax;                            /* 0x45E6EA */

    /* terme 2 : Z3*I1 - X1*I3                         0x45E6CF..0x45E6F9 */
    ecx  = x87_magic_lo32((x87_t)Cam_xyz3_z_float * i1 - (x87_t)Cam_xyz1_x_float * i3);
    /* 0x45E6FD fstp st : pop I3 (sans effet mémoire) */
    ecx += 0x80000000u;                             /* 0x45E70F */
    dword_1CA8A78 = ecx;                            /* 0x45E715 */

    /* terme 3 : X1*I2 - Y2*I1                         0x45E6FF..0x45E727 */
    edx  = x87_magic_lo32((x87_t)Cam_xyz1_x_float * i2 - (x87_t)Cam_xyz2_y_float * i1);
    /* 0x45E72B / 0x45E738 fstp st x2 : pop I2, I1 -> pile x87 vide */
    edx += 0x80000000u;                             /* 0x45E72D */
    dword_1CA8A7C = edx;                            /* 0x45E73A */

    /* --- composante 1 : comparaisons signées, FLAG par MOV (écrasement) --- */
    if ((int32_t)eax < -0x8000) {                   /* 0x45E733 cmp eax,0FFFF8000h ; jge */
        dword_1CA92F8 = 0x81000000u;                /* 0x45E742 */
        dword_1CA8A34 = 0xFFFF8000u;                /* 0x45E74C (dword plein) */
    } else if ((int32_t)eax > 0x7FFF) {             /* 0x45E758 cmp eax,7FFFh ; jle */
        dword_1CA92F8 = 0x81000000u;                /* 0x45E75F */
        dword_1CA8A34 = 0x00007FFFu;                /* 0x45E769 */
    } else {
        dword_1CA8A34 = eax;                        /* 0x45E775 */
    }
    /* EAX non modifié par les chemins de la composante 1 */

    /* --- composante 2 : FLAG |= 0x80800000 via EAX --- */
    if ((int32_t)ecx < -0x8000) {                   /* 0x45E77A ; jge */
        eax = dword_1CA92F8;                        /* 0x45E782 */
        dword_1CA8A38 = 0xFFFF8000u;                /* 0x45E787 */
        eax |= 0x80800000u;                         /* 0x45E791 */
        dword_1CA92F8 = eax;                        /* 0x45E796 */
    } else if ((int32_t)ecx > 0x7FFF) {             /* 0x45E79D ; jle */
        eax = dword_1CA92F8;                        /* 0x45E7A5 */
        dword_1CA8A38 = 0x00007FFFu;                /* 0x45E7AA */
        eax |= 0x80800000u;                         /* 0x45E7B4 */
        dword_1CA92F8 = eax;                        /* 0x45E7B9 */
    } else {
        dword_1CA8A38 = ecx;                        /* 0x45E7C0 */
    }

    /* --- composante 3 : FLAG |= 0x00400000 via EAX ; trois retn --- */
    if ((int32_t)edx < -0x8000) {                   /* 0x45E7C6 ; jge */
        eax = dword_1CA92F8;                        /* 0x45E7CE */
        dword_1CA8A3C = 0xFFFF8000u;                /* 0x45E7D3 */
        eax |= 0x00400000u;                         /* 0x45E7DD */
        dword_1CA92F8 = eax;                        /* 0x45E7E2 */
        return eax;                                 /* 0x45E7E7 add esp,8 ; 0x45E7EA retn */
    }
    if ((int32_t)edx > 0x7FFF) {                    /* 0x45E7EB ; jle */
        eax = dword_1CA92F8;                        /* 0x45E7F3 */
        dword_1CA8A3C = 0x00007FFFu;                /* 0x45E7F8 */
        eax |= 0x00400000u;                         /* 0x45E802 */
        dword_1CA92F8 = eax;                        /* 0x45E807 */
        return eax;                                 /* 0x45E80C ; 0x45E80F retn */
    }
    dword_1CA8A3C = edx;                            /* 0x45E810 */
    return eax;                                     /* 0x45E816 ; 0x45E819 retn */
}

/* Prototype exporté : cdecl, 0 argument ; EAX non prouvé consommé par les appelants. */
void Gte_Cross3Float_SatS16(void)
{
    (void)Gte_Cross3Float_SatS16_impl();
}
```

### EAX en sortie (exact)

- composante 2 **ou** 3 saturée → EAX = valeur finale de `dword_1CA92F8` ;
- sinon → EAX = MAC1 entier **brut non clampé** (0x45E6E3), même si la composante 1 a saturé
  (les chemins 0x45E742/0x45E75F écrivent FLAG par `C7 05` sans recharger EAX).
- AL/AX : aucune opération partielle de registre ; aucun SETcc/MOVZX de résultat.
  Interprétation de ce résidu comme retour : **non établie** (aucun appelant lu).

## Correspondance blocs CFG ↔ C

| Bloc (metadata.json) | C |
|---|---|
| 0x45e670–0x45e742 | prologue, 3 termes, test comp1 bas |
| 0x45e742–0x45e758 | comp1 < −0x8000 |
| 0x45e758–0x45e75f | test comp1 haut |
| 0x45e75f–0x45e775 | comp1 > 0x7FFF |
| 0x45e775–0x45e77a | comp1 in-range |
| 0x45e77a–0x45e782 | test comp2 bas |
| 0x45e782–0x45e79d | comp2 < −0x8000 |
| 0x45e79d–0x45e7a5 | test comp2 haut |
| 0x45e7a5–0x45e7c0 | comp2 > 0x7FFF |
| 0x45e7c0–0x45e7c6 | comp2 in-range |
| 0x45e7c6–0x45e7ce | test comp3 bas |
| 0x45e7ce–0x45e7eb | comp3 < −0x8000 + retn |
| 0x45e7eb–0x45e7f3 | test comp3 haut |
| 0x45e7f3–0x45e810 | comp3 > 0x7FFF + retn |
| 0x45e810–0x45e81a | comp3 in-range + retn |

## Arithmétique — points vérifiés

- `movsx` + `shl 0Ch` : |int16| ≤ 2^15 → |In| ≤ 2^27, pas de débordement 32 bits ; C fait le
  shift en `uint32_t` (évite l'UB du shift d'un négatif signé), réinterprété `int32_t` pour `fild`.
- `fild` int32 et `fld` m32 : chargements exacts. Produits float×int ≤ ~2^51 en grandeur pour
  floats finis modérés ; arrondi selon PC.
- Conversion « magique » : `low32(double(x + 2^52 + 2^31)) + 0x80000000` (mod 2^32).
  Pour x ∈ [−2^31, 2^31) avec RC=nearest → `round_half_even(x)` en int32. Hors plage : wrap /
  motif binaire — le C reproduit **le motif binaire exact** (union), pas une conversion idéalisée,
  donc reste fidèle aussi pour |x| ≥ 2^31, NaN, Inf (sous réserve du même double intermédiaire).
- Clamps : `jge`/`jle` signés vs −0x8000 et 0x7FFF ; écriture dword plein (0xFFFF8000 =
  −32768 étendu signé), et les valeurs in-range écrites sont l'int32 complet (∈ [−32768, 32767]).
- Les sorties clampées sont réécrites dans les **mêmes** globals que les entrées 16 bits ;
  toutes les lectures d'entrée précèdent toutes les écritures (pas d'alias intra-fonction :
  adresses 1CA8A34/38/3C, 1CA8A74/78/7C, 1CA92F8, 1CA923C/44/4C toutes distinctes).

## Sémantique (contrat, hypothèses justifiées)

**Rôle (hypothèse, confiance moyenne)** : émulation logicielle d'une opération GTE de type
« OP » (produit extérieur) : `MAC1 = D2·IR3 − D3·IR2`, `MAC2 = D3·IR1 − D1·IR3`,
`MAC3 = D1·IR2 − D2·IR1`, avec D1/D2/D3 = floats 0x01CA923C/0x01CA9244/0x01CA924C, IR =
low16 signé des globals 1CA8A34/38/3C ×4096, puis `IRn = sat_s16(MACn)` et bits FLAG.

**Effets** : écrit 1CA8A74/78/7C (MAC entiers, non clampés), réécrit 1CA8A34/38/3C (clamp
[−0x8000, 0x7FFF], dword plein), FLAG 1CA92F8 = 0 puis bits de saturation. Pas d'appel,
pas d'argument, pile x87 restituée vide.

Preuves ASM / xref :
1. Structure cyclique a·b − c·d sur les trois termes (trace x87 ci-dessus, 0x45E6B3–0x45E71B).
2. `fld m32` (D9 05) sur trois floats + `fild` des entiers ×4096 (shl 0Ch) — calcul flottant.
3. Clamp signé [0xFFFF8000, 0x7FFF] ×3 (0x45E733/0x45E758, 0x45E77A/0x45E79D, 0x45E7C6/0x45E7EB).
4. Motifs FLAG : comp1 `0x81000000`, comp2 `|0x80800000`, comp3 `|0x00400000`
   (0x45E742/0x45E75F, 0x45E791/0x45E7B4, 0x45E7DD/0x45E802).
5. Feuille : `code_targets=[]`, 11 sites d'appel near (type 17) depuis 9 fonctions
   (metadata.json:118-185) ; 0 argument (aucun `[esp+N>0]`), `retn` C3.
6. Globals partagés avec voisins GTE (compaction:36-38, secondaire) : FLAG 1CA92F8 effacé
   aussi par Gte_AVSZ4 ; 1CA8A34/38/3C lus en movsx word par Gte_MVMVA.

Preuves de nom (`Gte_Cross3Float_SatS16`) :
- « Cross3 » : forme de produit vectoriel cyclique (preuve 1) — mais **pas** un produit de
  deux vecteurs arbitraires : un vecteur se réduit à trois scalaires espacés de 8 octets
  (diagonale D), cohérent avec « OP ».
- « Float » : opérandes m32real + conversion magique double (preuve 2, `DC 05` m64).
- « SatS16 » : clamp signé 16 bits (preuve 3).
- « Gte_ » : globals partagés avec les fonctions Gte_* (preuve 6, secondaire) et motifs FLAG
  qui correspondent bit pour bit à la spécification PSX GTE (bit31 récapitulatif + bit24 IR1,
  bit23 IR2 ; bit22 IR3 **sans** bit31, car bit22 est hors du masque récapitulatif PSX) —
  correspondance externe, hypothèse et non preuve native.
- Nom alternatif plausible (non promu) : `Gte_OP_FloatDiag_lm0`.

Inconnues explicites :
- Signification réelle des floats (labels « Cam_xyz* » = hypothèses) ; la compaction:39 dit
  « dernier float de chaque rangée de stride 0xC » — avec les adresses citées (rangées
  34/38/3C, 40/44/48, 4C/50/54) 0x44 est au milieu et 0x4C en tête de rangée : énoncé
  incohérent, à arbitrer par le lead.
- Absence de facteur `sf`/shift et de test d'overflow MAC 44 bits / flag lm (vs GTE réel).
- Consommation de EAX par les appelants ; contexte des 9 appelants non lu.

## Risques / incertitudes

1. **Environnement x87** : le résultat dépend du mot de contrôle à l'appel. RC≠nearest change
   l'arrondi ; PC=24 bits (p.ex. si un runtime D3D force la simple précision) rend la
   conversion magique non fonctionnelle (ulp de 2^52 en 24 bits = 2^29). Le C modélise
   PC=53/RC=nearest (`x87_t=double`) ; PC=64 → `long double` + double arrondi au `fstp m64`.
2. Compilation C sous SSE2 vs x87 : utiliser FP_CONTRACT OFF et des opérandes double pour
   coller au modèle ; non vérifié par compilation (aucune compilation exécutée).
3. Accès 16 bits de l'ASM modélisé par troncature 32→16 (équivalence de valeur, pas de largeur
   d'accès mémoire).
4. `dword_1CA92F8 = 0x81000000` (MOV) en comp1 vs `|=` ailleurs : équivalent ici car FLAG = 0
   depuis 0x45E68F (mono-thread supposé) ; le C garde l'affectation littérale.
5. Valeur du double à 0xB693D8 : prise du label IDA (2^52+2^31 = 4503601774854144) ;
   octets non présents dans mes entrées (attribution g04 via compaction:40).

## Validations non exécutées (demandes au lead)

- Compilation (MSVC x86 /arch:IA32 ou clang -m32 -mfpmath=387) et diff comportemental
  contre l'ASM sur vecteurs : saturations ±, bornes −32768/32767, |x| ≥ 2^31, NaN/Inf,
  et chemins EAX (comp2/comp3 saturées vs aucune).
- Lecture du CW x87 au moment des appels (PC/RC) côté runtime.
- Réconciliation A/B et §5.6 par le lead.
