# MagFx_SpawnRadialParticles_TaskRegistered @ 0x6A3400

- Instr (live): 83 (371 o, 0x6A3400-0x6A3512)
- Palier: 2+1
- Verdict: LIKELY - spawner de particules radiales mag FX (caller unique ticker sub_6A1660 @0x6a18cc) : boucle do-while sur count arg_0, 2x BdLinkTask_Register(&dword_2510218, callback) avec callback = arg pile arg_28 relu aux deux sites (PAS sub_6A3630), init node (dword +0x18=0 couvrant +0x1A, byte +0x19=0xEC, mot +0x20 = arg24+(rand*arg20)>>15, rayon 32 bits avant angle, X/Z cercle sin/cos Q12 sar 0Ch, Y = a3 copie brute, alpha +0x1B = arg6+(rand*arg5) sar 0Fh add al,dl, mots +0x12/14/16=0, bytes +0x1C-1F = 4 rand) ; retour EAX = a1_old-1 deja decremente au jz 0x6A34E9, ou 0 si echec Register (0x6A3418/0x6A34FF)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A3400\nTYPE ; proposition: MagFx_SpawnRadialParticles_TaskRegistered
- Notes parent: checks 5.6 OK : callback relu (0x6A3400/0x6A34EB), test esi,esi (0x6A3418), stores +0Ch/0Eh/10h (0x6A348C-94), sar 0Fh (0x6A34A8), dec eax + jz (0x6A34E2-E9), cmp esi,edi (0x6A34FF), caller unique sub_6A1660 @0x6a18cc (callers.txt) ; convergence A/B/C-R

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A3400 (0x6A3400, .text, 268 octets, 83 instr live)
 *
 * GROUND TRUTH = live ASM (asm.asm) + ida_dump_bytes, NOT Hex-Rays.
 * IDA type : 'int __cdecl(int, __int16, __int16, __int16, int, char, int, int, int, __int16, int callback)'
 * IDB : FF8_EN.exe - 9.3.i64
 *
 * Réconciliation voix A (c_a.c) / voix B (c_b.c) : les deux voix convergent
 * sur toute la sémantique ; l'ASM tranché le seul point de forme (ordre des
 * stores +0x0C/+0x0E/+0x10) et la valeur de retour exacte par chemin.
 *
 * Rôle : enregistre des nœuds FX battle sur la liste dword_2510218 via
 * BdLinkTask_Register, initialise chaque nœud (offsets 0x0C..0x21) :
 * position radiale autour d'un centre (sin/cos Q12), Y direct, alpha
 * aléatoire 8 bits, mot +0x20 aléatoire, 4 octets aléatoires 0x1C..0x1F.
 * Ré-enregistre (a1 + 1) fois après le premier nœud, puis retourne le
 * compteur décrémenté ; eax = 0 si un enregistrement échoue.
 *
 * Convention pile : cdecl. Après push ebx/ebp/esi/edi, args vus à
 * [esp+10h+argN] ; pendant les 2 pushes sin/cos, à [esp+18h+argN]
 * (cf. 6a3475 mov ecx,[esp+18h+arg_4]).
 * ==========================================================================*/

#include <stdint.h>

/* --- Externes : uniquement les callees réellement appelés (callees.txt) --- */

extern int  dword_2510218;   /* tête de liste des tâches liées battle (globals.txt) */

/* BdLinkTask_Register(list_head, callback) -> ptr nœud ou 0.
 * Pile ASM aux deux sites : push callback ; push offset dword_2510218 ;
 * call ; add esp,8 → arg1 = &dword_2510218, arg2 = callback. */
extern int  BdLinkTask_Register(void *list_head, void *callback);

/* CRT rand, cdecl, eax = 32 bits signés — 8 appels (callees.txt). */
extern int  _rand(void);

/* Trigonométrie fixed-point Q12, angle en 1/4096 tour :
 * fild ; *pi/2048 (flt_B6B980=0x3AC90FDB) ; fsin/fcos (D9FE/D9FF) ;
 * *4096.0 (flt_B69540) ; magic-double +0x80000000. Retour eax = Q12. */
extern int  Fixed_Sin4096_Q12(int angle);
extern int  Fixed_Cos4096_Q12(int angle);

/* ---------------------------------------------------------------------------
 * Layout nœud déduit des stores esi+off (ordre ASM live) :
 *   +0x0C word X        +0x0E word Y (copie brute)   +0x10 word Z
 *   +0x12/+0x14/+0x16 words = 0 (xor edi,edi)
 *   +0x18 dword = 0 (couvre 0x18..0x1B), +0x19 byte réécrit à 0xEC,
 *   +0x1A reste 0 (jamais réécrit), +0x1B byte alpha,
 *   +0x1C..+0x1F 4 octets rand, +0x20 word scale.
 * --------------------------------------------------------------------------*/

int __cdecl sub_6A3400(int     a1_count,       /* arg_00 : nb de ré-enregistrements après le 1er nœud ; copie pile décrémentée */
                       int16_t a2_centerX,     /* arg_04 : centre X                                                 */
                       int16_t a3_y,           /* arg_08 : Y copié tel quel                                         */
                       int16_t a4_centerZ,     /* arg_0C : centre Z                                                 */
                       int     a5_alphaSpread, /* arg_10 : amplitude alpha                                          */
                       char    a6_alphaBase,   /* arg_14 : base alpha (DL)                                          */
                       int     a7_radiusSpread,/* arg_18 : amplitude rayon                                          */
                       int     a8_radiusBase,  /* arg_1C : base rayon                                               */
                       int     a9_scaleSpread, /* arg_20 : amplitude mot +0x20                                      */
                       int16_t a10_scaleBase,  /* arg_24 : base mot +0x20                                           */
                       void   *callback)       /* arg_28 : passé tel quel à BdLinkTask_Register                     */
{
    void *task;     /* esi */
    int   radius;   /* edi — 32 bits signés, jamais tronqué avant usage */
    int   angle;    /* ebx — rand() brut, non masqué, non mod 4096 */
    int   sx;       /* ebp — sin Q12 */
    int   cz;       /* eax — cos Q12 */

    /* 0x6A3400-0x6A341A : premier enregistrement (callback lu à [esp+callback]). */
    task = (void *)BdLinkTask_Register(&dword_2510218, callback);   /* 0x6A3409 */
    /* 0x6A3418 test esi,esi ; jz loc_6A3507 → échec, eax = 0. */

    /* Le corps s'exécute une première fois AVANT tout test de compteur
     * (0x6A34EB test arrive après le corps) : avec a1_count==0, un nœud est
     * quand même créé et configuré, puis sortie avec eax = -1 (décrément). */
    while (task != NULL)                      /* check 0x6A3418 (1er) / 0x6A34FF cmp esi,edi (suivants) */
    {
        /* ---- init nœud (ordres registres ASM exacts) ---- */
        *(int *)(task + 0x18) = 0;            /* 0x6A3420 dword [esi+18h] = 0 (couvre +18..+1B) */
        *(unsigned char *)(task + 0x19) = 0xEC; /* 0x6A3427 byte [esi+19h] = 0ECh ; +0x1A reste 0 */

        /* 0x6A342B-0x6A3441 : +0x20 word = a10 + (rand*a9 >> 15)  [imul signé, sar 0Fh]. */
        *(int16_t *)(task + 0x20) = (int16_t)(a10_scaleBase
                                  + ((_rand() * a9_scaleSpread) >> 15));

        /* 0x6A3442-0x6A3456 : rayon 32 bits = a8 + (rand*a7 >> 15) ; tiré AVANT l'angle. */
        radius = a8_radiusBase + ((_rand() * a7_radiusSpread) >> 15);

        /* 0x6A3457-0x6A3488 : angle unique ; sin puis cos (même ebx pushé 2x) ;
         * ebp = (radius*sin)>>12 (imul edi / sar 0Ch), eax = (radius*cos)>>12. */
        angle = _rand();                                    /* 0x6A3457 */
        sx = Fixed_Sin4096_Q12(angle);                       /* 0x6A345F ; ebp = eax */
        sx = (sx * radius) >> 12;                            /* 0x6A3467 imul ebp,edi / 0x6A346A sar ebp,0Ch */
        cz = Fixed_Cos4096_Q12(angle);                       /* 0x6A346D (push ebx) */
        cz = (cz * radius) >> 12;                            /* 0x6A3472 imul eax,edi / 0x6A3484 sar eax,0Ch */

        /* Stores dans l'ordre ASM : +0x0C (bp), +0x0E (dx brut), +0x10 (ax). */
        *(int16_t *)(task + 0x0C) = (int16_t)(a2_centerX + sx); /* 0x6A348C mov [esi+0Ch], bp */
        *(int16_t *)(task + 0x0E) = a3_y;                       /* 0x6A3490 mov [esi+0Eh], dx — Y direct, sans offset ni randomisation */
        *(int16_t *)(task + 0x10) = (int16_t)(a4_centerZ + cz); /* 0x6A3494 mov [esi+10h], ax */

        /* 0x6A3498-0x6A34AB : +0x1B byte = AL = (byte)((rand*a5 >> 15) & 0xFF) + a6,
         * somme tronquée 8 bits (add al,dl, mod 256). MOV dl,arg_14 AVANT le sar. */
        *(unsigned char *)(task + 0x1B) =
            (unsigned char)((unsigned char)((_rand() * a5_alphaSpread) >> 15)
                            + (unsigned char)a6_alphaBase);

        /* 0x6A34AD-0x6A34B8 : xor edi,edi puis stores words dans l'ordre +0x16, +0x14, +0x12. */
        *(int16_t *)(task + 0x16) = 0;        /* 0x6A34AD */
        *(int16_t *)(task + 0x14) = 0;        /* 0x6A34B4 */
        *(int16_t *)(task + 0x12) = 0;        /* 0x6A34B8 */

        /* 0x6A34BC-0x6A34D9 : 4 octets aléatoires bruts (AL only, un rand chacun). */
        *(unsigned char *)(task + 0x1C) = (unsigned char)_rand(); /* 0x6A34BC */
        *(unsigned char *)(task + 0x1D) = (unsigned char)_rand(); /* 0x6A34C4 */
        *(unsigned char *)(task + 0x1E) = (unsigned char)_rand(); /* 0x6A34CC */
        *(unsigned char *)(task + 0x1F) = (unsigned char)_rand(); /* 0x6A34D4 */

        /* 0x6A34DC-0x6A34E9 : contrôle de boucle sur l'ANCIENNE valeur.
         * mov eax,[arg_0] ; mov edx,eax (old) ; dec eax ; test edx,edx ;
         * mov [arg_0],eax ; jz loc_6A3507.
         * → à la sortie jz, eax = valeur déjà décrémentée (a1-1) : c'est le retour. */
        if (a1_count == 0)
            return a1_count - 1;              /* eax = -1 quand a1_count == 0 (décrément déjà dans eax) */
        a1_count = a1_count - 1;              /* 0x6A34E5 mov [esp+10h+arg_0], eax */

        /* 0x6A34EB-0x6A3501 : ré-enregistrement (même callback, relu de la pile).
         * edi == 0 ici (xor edi,edi à 0x6A34A6). cmp esi,edi ; jnz → nouveau tour. */
        task = (void *)BdLinkTask_Register(&dword_2510218, callback);
        /* Échec : esi == 0 → sortie épilogue avec eax = 0. */
    }

    /* 0x6A3507 : pop edi/esi/ebp/ebx ; retn — eax laissé tel quel :
     * 0 si BdLinkTask_Register a échoué (un des deux sites), sinon a1_count-1
     * au moment du test. Aucun autre set de eax. */

    /* UNCERTAIN 0x6A350B : valeur de retour exploitée par les callers non confirmée
     * ici (1 xref : sub_6A1660 @ 0x6a18cc, cf. callers.txt) — a1-1 (-1 si a1==0)
     * vs 0 (échec register) : le pattern du caller n'a pas été lu dans ce pack. */
}
```

## Analyse semantique

# Sémantique sub_6A3400 @ 0x6A3400 (réconciliation R)

- Rôle (1 phrase) : Spawner d'effets magiques — enregistre `count` nœuds de tâche FX via `BdLinkTask_Register(&dword_2510218, callback)` en boucle do-while et initialise chacun : position radiale aléatoire en disque XZ (rayon = base + rand*spread>>15, direction sin/cos Q12 sur un rand brut), Y constant, mot +0x20 aléatoire, octet +0x1B base+spread>>15, état 0xEC en +0x19, dword chrono +0x18 = 0, mots +0x12/+0x14/+0x16 = 0, 4 octets rand +0x1C..+0x1F.
- Verdict : LIKELY consolidé
- Confiance : LIKELY
- Nom catalogue : aucun (`sub_6A3400`, IDA type `int __cdecl(int, __int16, __int16, __int16, int, char, int, int, int, __int16, int callback)`). Proposition markdown seule : **`MagFx_SpawnRadialParticles_TaskRegistered`** (synthèse A/B, voir divergences).

## In / Out / Effets

In (cdecl, 11 args) :
- `arg_0` (int) : nombre de nœuds à spawner ; compteur do-while, décrémenté dans la copie pile à `0x6A34E5`. Le corps s'exécute AVANT le premier test → `arg_0==0` crée quand même 1 nœud, sortie eax=−1 (pas de boucle infinie).
- `arg_4` (s16) : centre X (`0x6A347E add ebp,[arg_4]` → `0x6A348C mov [esi+0Ch],bp`).
- `arg_8` (s16) : Y copié tel quel (`0x6A3479 mov dx,[arg_8]` → `0x6A3490 mov [esi+0Eh],dx`), aucune randomisation.
- `arg_C` (s16) : centre Z (`0x6A3487 add eax,[arg_C]` → `0x6A3494 mov [esi+10h],ax`).
- `arg_10` (int) : spread alpha ; `arg_14` (char) : base alpha → `+0x1B = (byte)((rand*arg_10)>>15) + arg_14`, troncature 8 bits (`0x6A34A8 sar 0Fh`, `0x6A34AB add al,dl`, `0x6A34B1 mov [esi+1Bh],al`).
- `arg_18` (int) : spread rayon ; `arg_1C` (int) : rayon de base → rayon 32 bits signés = `arg_1C + (rand*arg_18)>>15` (`0x6A3442–0x6A3455`), conservé dans edi, JAMAIS tronqué avant usage, tiré AVANT l'angle.
- `arg_20` (int) : spread du mot `+0x20` ; `arg_24` (s16) : base → `+0x20 (word) = arg_24 + (rand*arg_20)>>15` (`0x6A342B–0x6A343E`).
- `arg_28` = `callback` : relu de la pile aux deux sites (`0x6A3400 mov eax,[esp+callback]`, `0x6A34EB mov eax,[esp+10h+callback]`) et poussé tel quel — PAS sub_6A3630.

Out : EAX 32 bits contractuel — **0 si un enregistrement échoue** (esi==0 : `0x6A3413 mov esi,eax` + `0x6A341A jz` au 1er site ; `0x6A34FA mov esi,eax` + `0x6A34FF cmp esi,edi` tombe à l'épilogue au 2e), sinon **a1_old−1** déjà décrémenté au `jz` (`0x6A34E0 mov edx,eax` old / `0x6A34E2 dec eax` / `0x6A34E3 test edx,edx` / `0x6A34E5 mov [arg_0],eax` / `0x6A34E9 jz` → eax = valeur post-décrément). Usage downstream par sub_6A1660 non lu dans ce pack.

Effets : nœuds chaînés sur la liste statique `dword_2510218` (globals.txt, 'int') ; layout écrit : `+0x0C` word X = centreX + (sin_Q12(rand)·rayon)>>12, `+0x0E` word Y = arg_8, `+0x10` word Z = centreZ + (cos_Q12(rand)·rayon)>>12 ; `+0x12/+0x14/+0x16` words = 0 (`xor edi,edi` 0x6A34A6, stores 0x6A34AD/B4/B8) ; `+0x18` dword = 0 (0x6A3420, couvre +0x18..+0x1B donc +0x1A reste 0), `+0x19` byte = 0xEC (0x6A3427) ; `+0x1B` byte alpha calculé ; `+0x1C..+0x1F` = 4 octets `_rand` consécutifs (0x6A34BC/C4/CC/D4) ; `+0x20` word aléatoire. Deux sites `BdLinkTask_Register` (0x6A340E, 0x6A34F5), mêmes arguments, `add esp,8` cdecl à chaque.

## Preuves (ASM cité, adresses)

1. `0x6A3408 push eax(callback) ; 0x6A3409 push offset dword_2510218 ; 0x6A340E call BdLinkTask_Register ; 0x6A3415 add esp,8` et identique `0x6A34EF–0x6A34FC` : double enregistrement `Register(list_head, callback)` — convention confirmée wiki (battle-static-call-graph.md : « `BdLinkTask_Register(list_head, callback)` (`0x508360`, callback = arg idx 1, stored at `node+8`) »).
2. `0x6A3418 test esi,esi ; 0x6A341A jz loc_6A3507` et `0x6A34FF cmp esi,edi (edi=0 via 0x6A34A6) ; 0x6A3501 jnz loc_6A3420` : le retour de Register est un pointeur vérifiable-NULL → échec = eax 0, succès = boucle d'init.
3. `0x6A3420 mov dword ptr [esi+18h],0 ; 0x6A3427 mov byte ptr [esi+19h],0ECh` : chrono dword nul + tag d'état/type 0xEC propre à ce spawner.
4. `0x6A3442 call _rand → 0x6A344D imul edi,[arg_18] → 0x6A3452 sar edi,0Fh → 0x6A3455 add edi,ebx(arg_1C)` : rayon 32 bits signés tiré avant l'angle ; puis `0x6A3457 rand` brut → `0x6A345F Fixed_Sin4096_Q12 / 0x6A346D Fixed_Cos4096_Q12`, `0x6A3467 imul ebp,edi` / `0x6A3472 imul eax,edi`, `sar 0Ch` (Q12) : direction circulaire, produit rayon × sin/cos.
5. `0x6A348C mov [esi+0Ch],bp ; 0x6A3490 mov [esi+0Eh],dx ; 0x6A3494 mov [esi+10h],ax` : position vec3 s16 (X/Z dispersés, Y constant) — signature de particules projetées en anneau/disque.
6. `0x6A34DC mov eax,[arg_0] ; 0x6A34E0 mov edx,eax ; 0x6A34E2 dec eax ; 0x6A34E3 test edx,edx ; 0x6A34E5 mov [arg_0],eax ; 0x6A34E9 jz loc_6A3507` : boucle do-while comptée ; le décrément précède le test → eax = a1−1 sur la sortie compteur, corps exécuté même avec a1==0.
7. `0x6A34A8 sar eax,0Fh ; 0x6A34AB add al,dl ; 0x6A34B1 mov [esi+1Bh],al` et `0x6A34BC..0x6A34D9` 4× `call _rand` → `mov [esi+1Ch..1Fh],al` : octet alpha borné 8 bits + 4 octets rand par particule (init aléatoire d'animation/couleur).

## Divergences A/B (tranchées une par une)

1. **Nom** — A `BattleFx_SpawnRadialParticles_TaskRegistered` vs B `MagFx_SpawnRandomFxNodes_BdLink` → **synthèse `MagFx_SpawnRadialParticles_TaskRegistered`**. Préfixe `MagFx` tranché pour B : le caller unique `sub_6A1660` @ 0x6a18cc est le ticker MAG_212 (fait d'ancorage, CERTAIN au catalogue decomp-function-catalog l.102) et la famille 0x6Axxxx est peuplée de `MagFx_*`/`MAG_*` (0x6A6360 MAG_140_PHOENIX_FL_Callback, 0x6A79B0 MagFx_RenderComposedFK_Alloc4C) ; le cœur « radial particles » vient de A (preuve ASM n°4/n°5), le suffixe « TaskRegistered » de A (preuve n°1). Rien dans l'ASM lui-même ne dit « magic » — le préfixe est contextuel (caller), assumé.
2. **Largeur/contractualité du retour** — A : « void utilisable, EAX non contractuel » vs B : « EAX 32 bits contractuel » → **tranché B contre l'ASM** : `0x6A34E2 dec eax` exécuté avant `0x6A34E9 jz` → eax = a1_old−1 sur la sortie normale ; `0x6A3413/0x6A341A` et `0x6A34FA/0x6A34FF` laissent eax = esi = 0 sur échec Register. La remarque de A « ou 0 du test esi,esi » captait le chemin d'échec mais concluait à tort au non-contrat.
3. **« Boucle infinie si arg_0==0 » (B)** → **rejeté, tranché contre l'ASM** : le test de compteur (`0x6A34E3 test edx,edx`) arrive APRÈS le corps → avec arg_0==0 un nœud est créé puis sortie immédiate avec eax = 0xFFFFFFFF. A ne faisait pas cette erreur. (B se contredisait d'ailleurs lui-même entre son In/Out et son verdict.)
4. **Callback = arg pile vs sous-routine** — convergence : les deux sites lisent le MÊME arg de pile `arg_28` (`0x6A3400`, `0x6A34EB`), poussé tel quel ; PAS sub_6A3630. Point fermé, pas une divergence réelle.
5. **Ordre des stores +0x0C/+0x0E/+0x10** — déjà tranché côté C (reconcile_notes §1) : ordre ASM `0x6A348C/0x6A3490/0x6A3494` = X, Y, Z ; sans effet fonctionnel.
6. **Sémantique du word +0x20** — A l'appelle « angle » (de la particule), B hésite (scale/durée/délai) → **non tranchable par l'ASM** : le code prouve uniquement `word +0x20 = arg_24 + (rand*arg_20)>>15` (0x6A342B–0x6A343E). Laissé en question ouverte.

## Checks §5.6

- Callees cités tous présents dans callees.txt : `BdLinkTask_Register` (0x6A340E, 0x6A34F5), `Fixed_Sin4096_Q12` (0x6A345F), `Fixed_Cos4096_Q12` (0x6A346D), `_rand` ×8 (0x6A342B/0x6A3442/0x6A3457/0x6A3498/0x6A34BC/0x6A34C4/0x6A34CC/0x6A34D4). Aucune library call inventée (les `add esp,8` à 0x6A3415/0x6A3489/0x6A34FC sont les nettoyages cdecl). ✓
- Caller cité présent dans callers.txt : unique xref code `0x6a18cc` dans `sub_6A1660` (size 0x10f9), fait d'ancorage confirmé. ✓
- Strides/scalings en nombres : `sar 0Fh` = ÷0x8000 (normalisation rand 15 bits, ×3 : +0x20, rayon, alpha), `sar 0Ch` = >>12 (Q12 sin/cos ×4096) ; offsets nœud explicites en mots/bytes (0x0C/0x0E/0x10/0x12/0x14/0x16/0x18/0x19/0x1B/0x1C..0x1F/0x20) ; aucun stride tableau. ✓
- Polarités : `imul`/`sar` signés partout (aucun `shr`/`ja`/`jb`/`jg`/`jl`) ; `test/jz` sur pointeur NULL et compteur, `cmp esi,edi / jnz` — cohérentes. Le `add al,dl` (0x6A34AB) est une addition 8 bits volontaire, pas un leurre. ✓
- Largeur retour : EAX 32 bits ; 0 si échec Register (2 sites), sinon a1_old−1 (déjà décrémenté au jz) ; eax = −1 si arg_0==0 à l'entrée. Compatible avec le type IDA `int __cdecl`. ✓
- Nom ≥2 preuves ASM indépendantes adressées : preuves n°1 (double Register bouclé) et n°4/n°5 (dispersion radiale sin/cos Q12 × rayon aléatoire) — voir aussi n°3/n°7 (init aléatoire par nœud). ✓

## Questions ouvertes (non bloquantes)

1. Sémantique exacte du tag `0xEC` en node+0x19 et de la sémantique du word +0x20 (angle ? scale ? durée ?) — à trancher par lecture du callback consommateur / du pump 0x508420.
2. Les mots nuls +0x12/+0x14/+0x16 : vitesse vec3 que le callback animera, ou autre triplet ?
3. Les 4 octets +0x1C..+0x1F : RGBA/paramètres de rendu ou graines d'animation ?
4. Le retour (0 = échec, sinon a1−1) est-il lu par sub_6A1660 @ 0x6a18cc ? Non lu dans ce pack.
5. Liste `dword_2510218` : non documentée dans le wiki (absente du battle-address-catalog) ; son lien supposé avec `g_BattleOTBase+0x44` (fait d'ancorage) reste à prouver par xref.

IDBCOMMENT: Spawner d'effets magiques : boucle do-while qui enregistre count noeuds de tache via BdLinkTask_Register sur la liste dword_2510218 avec le callback arg_28 relu aux deux sites d'appel. Chaque noeud recoit une position radiale aleatoire autour de (arg_4, arg_8, arg_C) : rayon 32 bits = base + rand*spread>>15, direction sin/cos Q12 sur un rand brut, plus un word aleatoire +0x20, un octet alpha +0x1B, quatre octets rand +0x1C..1F, le tag 0xEC en +0x19 et un chrono dword nul +0x18. Retour EAX : 0 si l'enregistrement echoue, sinon count-1 deja decremente au jz 0x6A34E9 (un noeud est cree meme si count vaut zero). Verdict LIKELY : mecanisme pleinement prouve par l'ASM mais aucun wiki direct sur 0x6A3400. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — 0x6A3400 (sub_6A3400, 83 instr, 268 octets)

Ground truth = asm.asm (live). C réconcilié : `c_reconciled.c`.

## Divergences A vs B tranchées contre l'ASM

1. **Ordre des stores coordonnées** : c_b stocke +0x0C, +0x10, puis +0x0E (correspondance math), c_a stocke +0x0C, +0x0E, +0x10. **→ tranché c_a (ordre ASM)**. Preuve : 0x6A348C `mov [esi+0Ch],bp`, 0x6A3490 `mov [esi+0Eh],dx`, 0x6A3494 `mov [esi+10h],ax`. Sans effet fonctionnel, mais le C réconcilié suit l'ordre live.

2. **Expression alpha +0x1B** : c_a `(unsigned char)(a6 + (char)(((rand*a5)>>15)&0xFF))` vs c_b `(uint8)((uint8)((rand*a5)>>15) + (uint8)a6)`. **→ tranché c_b**. Preuve : 0x6A34A8 `sar eax,0Fh` puis 0x6A34AB `add al,dl` — somme des deux octets, troncature à 8 bits sur le résultat ; le masque de B sur chaque opérande donne le même octet final, mais la ligne de A masque puis add signé `char` : même résultat 8 bits. Forme la plus proche : `add al,dl` (B). Nota ASM : `mov dl,[arg_14]` à 0x6A34A2 arrive AVANT le `sar` — arg_14 = a6 (base), arg_10 = a5 (spread), mapping identique dans A et B.

3. **Forme de la boucle** : c_a = `for(;;)` avec returns explicites ; c_b = `while(task!=NULL)` + break + return ternaire final. **→ tranché c_b** (structure fidèle : jz à 0x6A3418, cmp esi,edi à 0x6A34FF), avec la valeur de retour exacte tranchée contre l'ASM (voir suivant).

4. **Retour EAX par chemin** : les deux voix annotaient différemment (A : « valeur post-décrément du dernier tour » ; B : return ternaire `task==0 ? 0 : a1-1`). **→ tranché, les deux chemins confirmés par ASM** :
   - Sortie `jz loc_6A3507` (0x6A34E9) : 0x6A34DC `mov eax,[arg_0]`, 0x6A34E0 `mov edx,eax` (old), 0x6A34E2 `dec eax`, 0x6A34E3 `test edx,edx`, 0x6A34E5 `mov [arg_0],eax` — le `dec eax` a déjà exécuté quand le `jz` part → **eax = a1_old - 1** (donc -1 si a1==0 : le corps s'exécute une fois même avec a1==0 puisque le test n'arrive qu'après le corps).
   - Échec `BdLinkTask_Register` : au 1er site, `test esi,esi ; jz` → eax = esi = **0** (0x6A3418-0x6A341A) ; au 2ᵉ site, `cmp esi,edi` (edi=0) `jnz` sinon tombe à l'épilogue → eax = **0** (0x6A34FF-0x6A3501).
   - Donc : retour 0 ⇔ échec d'enregistrement ; retour a1-1 ⇔ compteur épuisé. Adopté dans c_reconciled.c.

## Points écrits dans le cahier des charges (tous conformes A=B, prouvés)

- **2× BdLinkTask_Register(&dword_2510218, callback)** : callback = arg de pile `arg_28`, lu à 0x6A3400 (`mov eax,[esp+callback]`) pour le 1er appel et 0x6A34EB (`mov eax,[esp+10h+callback]`) pour le 2ᵉ — **même arg, pas sub_6A3630**. Le 1er appel crée le premier nœud avant toute décrémentation ; le 2ᵉ (en fin de boucle) crée le suivant quand le compteur ne vaut pas 0. Deux sites d'appel, une même paire d'arguments (push eax/callback ; push offset dword_2510218 ; add esp,8 aux deux sites 0x6A340E/0x6A34F5).
- **Init nœud** : dword +0x18 = 0 (0x6A3420), byte +0x19 = 0xEC (0x6A3427), puis mot +0x20 : `call _rand` (0x6A342B) → `imul eax,[arg_20]` (a9) → `mov ecx,[arg_24]` (a10) → `sar eax,0Fh` → `add eax,ecx` → `mov [esi+20h],ax`. Ordre registre : rand dans eax, base a10 dans ecx ; le produit signé décalé s'ajoute à la base, store word tronqué.
- **Rayon** : tiré AVANT l'angle. 0x6A3442 `call _rand` → edi ; `mov ebx,[arg_1C]` (a8) → 0x6A344D `imul edi,[arg_18]` (a7) → `sar edi,0Fh` → `add edi,ebx`. Rayon **32 bits signés**, conservé dans edi, multiplie sin puis cos (imul edi, ebp/eax), aucun store word intermédiaire du rayon. Sin/cos Q12 : `call Fixed_Sin4096_Q12` 0x6A345F, `imul ebp,edi` 0x6A3467, `sar ebp,0Ch` ; `call Fixed_Cos4096_Q12` 0x6A346D, `imul eax,edi` 0x6A3472, `sar eax,0Ch` ; angle = rand** brut** (non masqué, non mod 4096), push ebx 2×.
- **Y** : `mov dx,[esp+18h+arg_8]` 0x6A347E puis `mov [esi+0Eh],dx` 0x6A3490 — copie brute, aucune randomisation.
- **Mots +0x12/+0x14/+0x16 = 0** : `xor edi,edi` 0x6A34A6, stores di ordre +0x16 (0x6A34AD), +0x14 (0x6A34B4), +0x12 (0x6A34B8). Note : le dword +0x18=?, écrit d'abord à 0x6A3420, couvre +0x18..+0x1B — +0x1A reste 0 (jamais réécrit), +0x1B réécrit ensuite.
- **Bytes +0x1C..+0x1F = 4 rand** : 0x6A34BC/C4/CC/D4, AL only, un `call _rand` chacun.
- **Retour EAX** : voir divergence 3 ci-dessus — 0 si registr fail (2 sites), sinon a1-1 (déjà décrémenté au moment du jz).

## Divergences vs Hex-Rays (hexrays.c = vérificateur)

- Hex-Rays l.30 : `v15 = (int)(v13 * Fixed_Sin4096_Q12(v14)) >> 12` — le `imul ebp,edi` live (0x6A3467) fait **radius × sin** (edi=radius, ebp=sin) : identique mathématiquement (commutatif), mais Hex-Rays réordonne (le mul live est exécuté AVANT le call Cos, parenthèse parenthèse, ok).
- Hex-Rays l.27 : `*(_WORD *)(i + 32) = a10 + ((a9 * rand()) >> 15)` — operands `a9*rand()` vs live `rand()*a9` (0x6A3430 `imul eax,[arg_20]`) : commutatif, équivalent.
- Hex-Rays l.45 : `if (a1-- == 0)` avec `result = a1 - 1` avant — rend le fait que **eax à la sortie du jz est déjà décrémenté** (a1-1, pas 0) ; notre formulation plus directe est plus fidèle au `dec eax` + `test edx,edx`.
- Hex-Rays masque le piège : il nomme `v16 = Fixed_Cos4096_Q12(v14)` non signé (`unsigned int v16`) — l'ASM est un `imul` signé (0x6A3472). Tranché : **signé**, `imul`.
- Hex-Rays nforce pas l'ordre d'instances d'appel rand() entre +0x20 et alpha — l'ASM montre l'ordre exact (rand rayon → rand angle → rand alpha → 4 rand bytes) qui a été conservé tel quel.

## UNCERTAIN restants

- `// UNCERTAIN 0x6A350B` : le retour a1-1 / 0 est-il exploité par le caller (1 xref : sub_6A1660 @ 0x6a18cc, callers.txt) — valeur non lue dans ce pack ; sémantique de retour tranchée par l'ASM, mais l'usage downstream non vérifié.
- Rôle précis du callback (nom de la fonction de callback réelle passée par sub_6A1660) : hors périmètre (l'arg de pile est transféré tel quel ; pas d'analyse de sub_6A1660 dans ce pack).
