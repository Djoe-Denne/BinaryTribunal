# Vec2Batch_ApproxSqrtNormalize_PackXY10_Mag @ 0x69E9A0

- Instr (live): 92 (273 o, 0x69E9A0-0x69EAB0)
- Palier: 2+1
- Verdict: LIKELY - normalise en place un lot de vecteurs 2D {i16 x, i16 y, u32 packe} stride 8 (count a1+4, tableau a1+8) : norme approx via Gte_LZCS + LUT1 word_1178A50 (demi-exposant sar 1), coefficient LUT2 word_1178C50 movsx (index 400h-(scaled>>2) clamp signe), re-pack bits 0-9 x / 10-19 y / 20-31 scaled>>1, retour EAX=0, do-while sans garde
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_69E9A0\nTYPE ; proposition: Vec2Batch_ApproxSqrtNormalize_PackXY10_Mag
- Notes parent: checks 5.6 OK : and ~1 (0x69E9EA), sar 1 (0x69E9FB), jg signe (0x69E9FF), lea [edx+18h] recharge shift (0x69EA01), LUT1 [esi*2] (0x69EA0C), scaled&~1 shl 13h (0x69EA29-2C), 400h-sar2 (0x69EA31-39), clamp jns/cmp 3FFh/jle (0x69EA3E-A4B), movsx LUT2 (0x69EA50), masque 0FFF003FFh (0x69EA7A), q2 and 3FFh shl 0Ah (0x69EA8B-90), idiv signes (0x69EA62/85), stride 8 (0x69EA9C), add esp,8 (0x69E9E7), caller sub_69E940 @0x69E946

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_69E9A0 (0x69E9A0, .text, 92 instr. live / 273 octets)
 * Cellule C-R — réconciliation c_a × c_b contre asm.asm (GROUND TRUTH).
 * Type IDA (meta.json) : int __cdecl sub_69E9A0(int)
 * Sauvegardes : ebx, esi, edi (push 0x69e9a7..0x69e9a9 / pop 0x69eaaa..0x69eaac).
 * Cadre : sub esp,8 → var_8 (compteur de boucle), var_4 (temporaire) ;
 *         arg_0 = paramètre pile a1, nettoyage appelant (cdecl).
 * Appels (les seuls de la fonction ; 1 seul 'add esp,8' à 0x69e9e7 pour les
 *         DEUX pushes — cdecl nettoyé une fois) :
 *   Gte_LZCS(norm)                     0x69e9d3 push / 0x69e9d4 call
 *   GteState_GetToPtr_1CA8A8C(&slot)   0x69e9dd push / 0x69e9de call
 *   EAX des deux calls jamais consommé : la valeur transite par dword_1CA8A8C
 *   (rempli par Gte_LZCS, relu par le getter vers *slot).
 * Alias : le out-param du getter EST le slot arg_0 lui-même
 *   (0x69e9d9 lea edx,[esp+18h+arg_0]) → le pointeur a1 d'origine est DÉTRUIT
 *   dans son slot pile, mais il a déjà été consommé avant tout call :
 *   compteur lu à 0x69e9ad (var_8), curseur edi = a1+8 à 0x69e9aa.
 *   arg_0 est ensuite réécrit à 0x69e9ef (compteur LZCS pair) — store MORT,
 *   jamais relu ensuite.
 * Boucle : do-while SANS garde (tête 0x69e9b4, seule arête retour 0x69eaa4
 *   jnz). count==0 à l'entrée → dec → 0xFFFFFFFF → ~2^32 itérations.
 * Retour : EAX = var_8 après le dec final = 0 après une exécution complète
 *   (0x69ea98 mov eax,[var_8] ; 0x69ea9f dec ; 0x69eaa4 jnz).
 *
 * Enregistrements balayés : stride 0x08 depuis a1+8
 *   { __int16 x @+0x00 (movsx 0x69e9b8) ; __int16 y @+0x02 (movsx 0x69e9b4) ;
 *     int32 field @+0x04 (recomposé par masques) }. [a1+0x00] jamais lu.
 * ============================================================================ */

extern int Gte_LZCS(int value);                 /* E3b : écrit le compte dans dword_1CA8A8C */
extern void GteState_GetToPtr_1CA8A8C(int *out); /* E3a : *out = dword_1CA8A8C */

extern __int16 word_1178A50[];   /* 0x1178A50, __int16[256] — collé à word_1178C50 (0x1178A50+0x200) */
extern __int16 word_1178C50[];   /* 0x1178C50, __int16[4096] — seules entrées 0..0x3FF adressées */
extern int dword_1CA8A8C;        /* 0x1CA8A8C — compteur LZCS (relais Gte_LZCS → getter) */

int __cdecl sub_69E9A0(int a1)
{
    int count;      /* var_8 — compteur de boucle, lu UNE fois à 0x69e9ad */
    int tmp;        /* var_4 — dword partiel pendant la recomposition */
    int slot;       /* copie du slot arg_0, réutilisée comme out-param du getter */
    __int16 *rec;   /* edi — curseur, +8 octets/itération (0x69ea9c add edi,8) */
    int x, y, norm;
    int lz, shift_l, t;
    int scaled, idx, coef, q1, q2;

    slot  = a1;
    count = *(int *)(a1 + 4);               /* 0x69e9ad : mov eax,[eax+4] */
    rec   = (__int16 *)(a1 + 8);            /* 0x69e9aa : lea edi,[eax+8] */

    do
    {
        x    = rec[0];                      /* 0x69e9b8 : movsx esi, word ptr [edi]   (signé) */
        y    = rec[1];                      /* 0x69e9b4 : movsx eax, word ptr [edi+2] (signé) */
        norm = x * x + y * y;               /* 0x69e9bd..0x69e9c3 : imul,imul,add — toujours >= 0 */

        if (norm == 0)                      /* 0x69e9c5 : jnz short loc_69E9D3 */
        {
            *(int *)((char *)rec + 4) = 0;  /* 0x69e9c7 : mov dword ptr [edi+4], 0 */
        }
        else
        {
            /* --- compte LZCS → slot arg_0 (aliasing), forcé pair --- */
            Gte_LZCS(norm);                     /* 0x69e9d4 — remplit dword_1CA8A8C */
            GteState_GetToPtr_1CA8A8C(&slot);   /* 0x69e9de — slot = dword_1CA8A8C */
            lz      = slot;                     /* 0x69e9e3 : mov ecx,[esp+1Ch+arg_0] */
            lz     &= 0xFFFFFFFE;               /* 0x69e9ea : and ecx,0FFFFFFFEh — bit 0 forcé à 0 */
            slot    = lz;                       /* 0x69e9ef : mov [esp+14h+arg_0],ecx — store MORT */

            /* --- normalisation par pivot 0x18 (les deux branches rechargent cl) --- */
            /* 0x69e9f5 neg edx (= -lz) ; 0x69e9f8/0x69e9fb : eax = (0x1F - lz) sar 1 */
            t       = (0x1F - lz) >> 1;         /* SAR eax,1 à 0x69e9fb — arithmétique ; >= 0 pour lz <= 30 */
            shift_l = lz - 0x18;                /* 0x69e9f5 : add ecx,0FFFFFFE8h */
            if (shift_l > 0)                    /* 0x69e9ff : test ecx,ecx ; JG — comparaison SIGNÉE
                                                   (lz pair, donc lz >= 26 ici) */
                norm = norm << shift_l;         /* 0x69ea08 : shl esi,cl — cl = lz-0x18 (2, 4 ou 6) */
            else
            {
                /* 0x69ea01 : lea ecx,[edx+18h] → cl = 0x18 - lz (0..24), PAS lz-0x18 mod 32 :
                   aucun enroulement de count de shift, pivot 0x18 exact. */
                norm = norm >> (0x18 - lz);     /* 0x69ea04 : sar esi,cl — arithmétique (signe préservé ;
                                                   neutre ici car norm >= 0) */
            }

            /* --- LUT 1 : word_1178A50, zéro-extend (xor ecx,ecx + mov cx, 0x69ea0a..0x69ea0c) --- */
            scaled  = (int)(unsigned __int16)word_1178A50[norm]; /* 0x69ea0c : index esi*2, AUCUNE garde de borne */
            scaled <<= t;                       /* 0x69ea16/0x69ea18 : shl esi,cl — cl = (0x1F-lz)>>1 */
            scaled  = ((int)scaled) >> 0x0C;    /* 0x69ea22 : SAR esi,0Ch — arithmétique. Bit 31 inatteignable
                                                   (16 bits << 15 max = 0x7FFF8000) donc == shr en pratique,
                                                   mais l'ASM dit SAR → SAR retenu. */

            /* --- store #1 : bits 0-19 = anciens bits 0-19 ; bit 19 de la partie magnitude = 0 --- */
            /* 0x69ea1a/0x69ea1d : eax = [edi+4] & 0FFFFFh ; 0x69ea27 : and edx,0FFFFFFFEh ;
               0x69ea2c : shl edx,13h ; 0x69ea2f : or ; 0x69ea3b : mov [edi+4],edx */
            *(int *)((char *)rec + 4) =
                (((scaled & 0xFFFFFFFE) << 0x13) | (*(int *)((char *)rec + 4) & 0x000FFFFF));
            /* bits 20-31 = scaled bits 1..12 (scaled >> 1) ; scaled bit 0 (effacé) aurait atterri
               au bit 19 — le &~1 l'empêche de fuiter dans la zone q2 au OR final. */

            /* --- index LUT 2 : 0x400 - (scaled >> 2), saturé SIGNÉ [0, 0x3FF] --- */
            idx = 0x400 - (((int)scaled) >> 2); /* 0x69ea31 mov eax,400h ; 0x69ea36 SAR ecx,2 ; 0x69ea39 sub */
            if (idx < 0)                        /* 0x69ea3e : jns non pris */
                idx = 0;                        /* 0x69ea40 : xor eax,eax */
            else if (idx > 0x3FF)               /* 0x69ea44/0x69ea49 : cmp eax,3FFh ; jle — SIGNÉ */
                idx = 0x3FF;                    /* 0x69ea4b : mov eax,3FFh */

            /* --- LUT 2 : word_1178C50, MOVSX (signé) puis SAR 2 --- */
            coef = ((int)word_1178C50[idx]) >> 2;
            /* 0x69ea50 : movsx ecx, word_1178C50[eax*2] — SIGNÉ (≠ zéro-extend de la LUT 1) ;
               0x69ea5b : sar ecx,2 — arithmétique. */

            /* --- q1 = composante depuis x, insérée bits 0-9 ; division SIGNÉE (cdq+idiv) --- */
            q1 = (x * coef) / scaled;           /* 0x69ea5e imul ; 0x69ea61 cdq ; 0x69ea62 idiv esi
                                                   (esi = scaled, reste edx ignoré) ; 0x69ea67 mov edx,eax */

            /* 0x69ea64 : ebx = [edi+4] — relit le dword VENANT d'être stocké
               (bits 20-31 = scaled>>1, bits 0-19 = anciens bits 0-19). */
            /* remplacement bits 0-9 : 0x69ea70 xor edx,ebx ; 0x69ea72 and edx,3FFh ;
               0x69ea78 xor edx,ebx ; 0x69ea7a and edx,0FFF003FFh ; 0x69ea80 mov var_4,edx */
            tmp = ((((q1 ^ *(int *)((char *)rec + 4)) & 0x3FF)
                     ^ *(int *)((char *)rec + 4)) & 0xFFF003FF);
            /* 0xFFF003FF : préserve bits 0-9 et 20-31, EFFACE bits 10-19 (0x0A..0x13) —
               pas « 18-19 » (c_a) ni « 0x0A..0x15 » (c_b). Les anciens bits 10-19 sont
               perdus ici ; ils sont refillés par q2 juste après. */

            /* --- q2 = composante depuis y, insérée bits 10-19 ; division SIGNÉE --- */
            q2 = (y * coef) / scaled;           /* 0x69ea69 movsx eax,[edi+2] ; 0x69ea6d imul ;
                                                   0x69ea84 cdq ; 0x69ea85 idiv esi */
            q2 = (q2 & 0x3FF) << 0x0A;          /* 0x69ea8b and eax,3FFh ; 0x69ea90 shl eax,0Ah */

            *(int *)((char *)rec + 4) = tmp | q2; /* 0x69ea93 or edx,eax ; 0x69ea95 mov [edi+4],edx */
            /* LAYOUT FINAL PROUVÉ PAR MASQUES (store #1 + remplacement + OR) :
               bits 0x00-0x09 = q1 & 0x3FF   (composante x)
               bits 0x0A-0x13 = q2 & 0x3FF   (composante y)   [bit 0x13 = q2 bit 9]
               bits 0x14-0x1F = scaled >> 1  (magnitude, 12 bits, via (scaled&~1)<<0x13)
               AUCUN bit de padding forcé à 0 entre y et la magnitude. */
        }

        rec = (__int16 *)((char *)rec + 8);     /* 0x69ea9c : add edi,8 — stride 0x08 */
        --count;                                /* 0x69ea9f : dec eax ; 0x69eaa0 mov [var_8],eax */
    } while (count != 0);                       /* 0x69eaa4 : jnz loc_69E9B4 — pas de garde initiale */

    return count;                               /* 0x69ea98 : mov eax,[var_8] — 0 après boucle complète */
}

/* ============================================================================
 * TABLES & GLOBALS (globals.txt) :
 *   word_1178A50   0x1178A50  __int16[256]  — indexée par `norm` normalisé (zéro-extend)
 *   word_1178C50   0x1178C50  __int16[4096] — indexée par idx saturé [0,0x3FF] (movsx)
 *     NB : 0x1178A50 + 0x200 = 0x1178C50 — les deux tables sont ADJACENTES ; un
 *     débordement d'index de la LUT 1 lirait dans word_1178C50.
 *   dword_1CA8A8C  0x1CA8A8C — compteur LZCS (Gte_LZCS → GteState_GetToPtr_1CA8A8C)
 *
 * DIVERGENCES vs HEX-RAYS (hexrays.c, vérificateur seulement) :
 *   - 0x69ea22/0x69ea36/0x69ea5b/0x69e9fb : HR rend '>>' ; l'ASM dit SAR partout.
 *     Équivalent en pratique pour 0x69ea22 (bit 31 inatteignable) et norm >= 0,
 *     SAR explicite conservé comme ground truth.
 *   - 0x69ea50 : HR 'word_1178C50[v5] >> 2' omet le MOVSX explicite — restauré.
 *   - HR omet le store mort 0x69e9ef (a1 &= ~1u couvre le mask, le store pile est
 *     élidé) — restauré en commentaire.
 *   - HR ligne 39-44 : bloc xor/and reformulé avec casts unsigned __int16 —
 *     équivalence bit à bit vérifiée contre 0x69ea70..0x69ea95.
 *   - HR 'v1 += 4' sur __int16* = +8 octets ✓ (stride 0x08 confirmé par add edi,8).
 *   - HR 'return result' : result = compteur décrémenté = 0 après exécution complète ✓.
 *
 * UNCERTAIN 0x69e9d4 : convention exacte de Gte_LZCS (zéros de tête attendus, norm > 0
 *   ici) — le compte lui-même n'est pas prouvable par ce seul ASM ; seuls ses effets
 *   (mask bit 0, constantes 0x18/0x1F) le sont.
 * UNCERTAIN 0x69ea0c : word_1178A50 indexé par esi*2 sans AUCUNE garde de borne ; si
 *   lz n'est pas cohérent avec norm, lecture hors table (tombe dans word_1178C50,
 *   adjacentes). Comportement reproduit tel quel.
 * UNCERTAIN 0x69ea62/0x69ea85 : scaled == 0 n'est pas gardé — idiv lèverait #DE.
 *   Aucune preuve d'impossibilité depuis ce seul ASM.
 * UNCERTAIN 0x69e9a0 : [a1+0x00] jamais lu (rôle en-tête inconnu) ; sémantique
 *   métier des champs 10 bits (normales ?) — hors périmètre C-R, seul 1 caller
 *   (sub_69E940 @ 0x69e946, fan-in 1).
 * ============================================================================ */
```

## Analyse semantique

# Sémantique sub_69E9A0 @ 0x69E9A0 (réconciliation R)

- Rôle (1 phrase) : Pour un lot de N records de 8 octets `{int16 x, int16 y, u32 packed}` (N = `[ptr+4]`, tableau à `ptr+8`), calcule la norme `x²+y²`, en approxime la racine carrée via LZCS GTE + LUT mantisse 256 + demi-exposant, module chaque composante par une seconde LUT 4096 indexée par `0x400 − (s>>2)` clampé [0,0x3FF], divise par s, puis re-packe le dword : bits 0-9 qx, bits 10-19 qy, bits 20-31 `s&~1 >>1`.

- Verdict : LIKELY consolidé
- Confiance : LIKELY
  - Mécanique interne 100 % adrésée par opcodes et confirmée par le C-R (c_reconciled.c convergeant). Blocages vers CERTAIN : wiki.md vide (échec qmd, aucune convergence wiki possible), contenu réel des deux LUT non lu (racine sinusoïdale vs facteur d'échelle indécidable), fan-in 1 via le thunk `sub_69E940` (0x26 octets, contexte MAG famille mais usage exact non prouvé), et `scaled==0` non gardé devant `idiv` (0x69ea62/0x69ea85).

- Nom catalogue : `sub_69E9A0` (non nommé, rien à corriger) ; prototype IDA `int __cdecl(int)` trop précis — EAX = 0 résiduel.

- Nom proposé (markdown seul, PAS de rename) : **`Vec2Batch_ApproxSqrtNormalize_PackXY10_Mag`** (position A)
  - TRANCHÉ pour A contre B : « ApproxSqrt » et « Normalize » sont mécanisme-ancrés (preuves 1-3 ci-dessous) ; la partie « SinModulated » de B suppose le *contenu* de `word_1178C50` sinus, non prouvé — seule la formule d'index `0x400 − (s>>2)` est prouvée. « PackXY10 » est prouvé par les masques ; « Mag » par le champ bits 20-31. Aucun tag famille (MAG) non prouvé n'est ajouté au nom.
  1. `0x69e9f8`–`0x69e9fb` : `(31 − (lz&~1)) ; sar eax,1` → **exposant divisé par deux** = signature racine carrée ; `0x69ea0c` LUT `word_1178A50[esi*2]` (mantisse, MSB de s placé en [128,255] par la normalisation 0x69ea04/0x69ea08) ; `0x69ea18 shl esi,cl` ; `0x69ea22 sar esi,0Ch`.
  2. `0x69ea5e`–`0x69ea62` et `0x69ea6d`–`0x69ea85` : `x*(k>>2) ; cdq ; idiv esi` puis `y*(k>>2) ; idiv esi` → composantes **divisées par la magnitude approchée** = normalisation.
  3. `0x69ea2c`–`0x69ea2f` (`shl edx,13h` du `s&~1`) + `0x69ea72`/`0x69ea8b` (`and …,3FFh`) → packing 10+10 bits + champ magnitude.

- In / Out / Effets :
  - In (cdecl, 1 arg, poussé droite→gauche) : `a1` = pointeur : `+0` dword jamais lu (rôle inconnu), `+4` int32 count, `+8` tableau de records stride 8 `{int16 x, int16 y, u32 packed}`. x/y lus signés (`movsx` 0x69e9b4/0x69e9b8).
  - Out : aucune valeur utile — EAX = 0 systématique (compteur après le dernier `dec` 0x69ea9f ; prototype IDA = artefact). do-while **sans garde** : count=0 → ~2³² itérations (0x69eaa4 seule arête retour, jamais de chemin avec EAX ≠ 0).
  - Effets : re-pack en place de `[record+4]` : `0` si `x²+y²==0` (0x69e9c7), sinon bits 0-9 = `(x·k)>>…/s & 0x3FF`, bits 10-19 = `(y·k)/s & 0x3FF`, bits 20-31 = `(s&~1)>>1`, avec `k = movsx word_1178C50[clamp(0x400 − (s>>2),0,0x3FF)] ; sar 2`. Slot pile arg_0 muté en scratch par le getter (store mort 0x69e9ef). Lit `dword_1CA8A8C` (LZCR GTE) via `GteState_GetToPtr_1CA8A8C`.

- Preuves (ASM cité) :
  1. `0x69e9bd`–`0x69e9c5` : `imul esi,esi ; imul ecx,eax ; add esi,ecx` → norme² = x²+y² ; `jnz` 0x69e9c5 / `[edi+4]=0` 0x69e9c7 (cas dégénéré, pas de garde count).
  2. `0x69e9d4`/`0x69e9de` : `call Gte_LZCS` puis `call GteState_GetToPtr_1CA8A8C` (les deux seuls callees, présents dans callees.txt) → LZCR relu via le getter ; `add esp,8` 0x69e9e7 (cdecl inline).
  3. `0x69e9ea`–`0x69ea08` : `and ecx,0FFFFFFFEh` (pairage LZ), pivot `add ecx,0FFFFFFE8h ; test ; jg` **signé** ; SHL si `lz_even−0x18 > 0` (`cl` rechargé proprement, aucun shift <32 possible — `lea ecx,[edx+18h]` 0x69ea01 recharge SAR).
  4. `0x69e9f8`+`0x69ea0c`+`0x69ea18`+`0x69ea22` : demi-exposant `(31−lz)>>1`, LUT1 zéro-étendue (`xor ecx,ecx ; mov cx`), `sar esi,0Ch` → s ≈ sqrt.
  5. `0x69ea31`–`0x69ea4b` : `eax=0x400 − (s>>2)`, clamp signé double (`jns` 0x69ea3e, `cmp 3FFh ; jle` 0x69ea49) ; `movsx word_1178C50` (signé, contrasté avec LUT1) ; `sar ecx,2` 0x69ea5b.
  6. `0x69ea00`–`0x69ea95` (bloc pack) : `(q1^old)&3FF ^ old`, masque `0xFFF003FF` (0x69ea7a) efface bits 10-19, `q2&3FF << 0Ah` (0x69ea90) ; bits 20-31 = `scaled&~1 << 13h` (0x69ea2c-0x69ea2f). Layout confirmé par le C-R (divergence 1).
  7. `0x69ea9c add edi,8` + `0x69eaa0/0x69eaa4 dec/jnz` : stride 8, boucle do-while, EAX=0.

- Divergences A/B (tranchées une par une) :
  1. **Nom de fonction** : A = mécanisme (approx-sqrt + normalize + pack) ; B = « SinModulated ». **Tranché A** — le mécanisme sqrt est prouvé par opcodes (demi-exposant 0x69e9fb + LUT + idiv), le caractère sinusoïdal du contenu de `word_1178C50` n'est pas prouvé (aucune donnée LUT dans le pack). La partie « Normalize »/« Batch » de B est équivalente à A, seule la qualification de la LUT2 les sépare → A.
  2. **Bornes LUT1 index** : B affirme « esi ∈ [128,255], dans bornes ✓ » dans ses checks, mais son propre § effets le liste en supposition. **Tranché ALIGNÉ SUR LE C-R** : AUCUNE garde ASM (`0x69ea0c` indexé librement) — admis UNCERTAIN ; note du C-R : word_1178A50 (0x1178A50+0x200) est adjacente à word_1178C50 (0x1178C50 @0x1178A50+0x200), un débordement lirait la LUT2.
  3. **Sémantique du champ bits 20-31** : A « champ magnitude 12 bits », B « norme/2 ». **Tranché convergent** : C-R divergence 1 → `scaled>>1` sur bits 20-31 (12 bits), `scaled = s>>12` en fixed-point ; les deux formulations désignent le même fait ; formulation retenue = « magnitude scaled>>1 ».
  4. **Gestion du slot arg_0** : A dit « lit via le getter », B décrit le slot pile muté en scratch avec store mort 0x69e9ef. **Tranché B** (C-R divergence 5 : le getter écrit dans le slot arg_0, le `mov ecx,[esp+…arg_0]` 0x69e9e3 est la seule relecture, le store 0x69e9ef est mort).
  5. **Retour** : A « compteur épuisé = 0 » / B « eax=0 résiduel, do-while sans garde ». **Tranché B** (C-R divergence 5/6 : EAX = 0 systématique, do-while sans garde reproduit tel quel).

- Checks §5.6 :
  - Callees cités présents dans callees.txt : `Gte_LZCS` @0x69e9d4 ✓, `GteState_GetToPtr_1CA8A8C` @0x69e9de ✓ — aucun appel inventé.
  - Callers cités présents dans callers.txt : `sub_69E940` @0x69e946 (unique, code, 0x26) ✓ — fan-in 1 corroboré par le C-R (wrapper scratch 0x58, contexte MAG).
  - Strides en nombres : record 8 octets (`add edi,8` @0x69ea9c), LUT word ×2 (@0x69ea0c, @0x69ea50), offset base +8, count +4 ✓.
  - Polarités : aucun `setcc`, aucun `ja/jb` ; `jg` @0x69e9ff (pivot LZCS, signé), `jns` @0x69ea3e et `jle` @0x69ea49 (clamp index LUT2, signé) — toutes signées et correctes ✓.
  - Largeur retour : `retn` nu, EAX 32 bits = 0 (pas de retour AL/AX partiel) ✓ ; do-while sans garde documenté sans garde inventée.
  - Nom : ≥2 preuves ASM indépendantes adresées (demi-exposant + LUT ; idiv par la norme ; masques 10 bits) ✓.

- Questions ouvertes (non bloquantes) :
  1. Contenu réel de `word_1178A50[256]` (mantisse sqrt ?) et `word_1178C50[4096]` (sinus ?) — déciderait du « SinModulated » de B ; hors pack.
  2. Garantie `scaled ≠ 0` devant `idiv` (0x69ea62/0x69ea85) non prouvée depuis cet ASM seul.
  3. Rôle du dword `a1+0` jamais lu et identité du porteur (seul caller = thunk ; contexte famille MAG suggéré par le C-R, non prouvé au niveau de cette fonction).
  4. wiki.md vide (échec qmd) : convergence wiki à rattraper quand l'index est disponible.

- IDBCOMMENT: Normalise en place un lot de vecteurs 2D : compteur d elements a +4, records de 8 octets int16 x,y + dword packe a +8. Pour chaque record calcule x*x+y*y, obtient le LZCS GTE via Gte_LZCS, approxime la racine carree par une LUT 256 word_1178A50 combinee a un demi-exposant, module les composantes par une seconde LUT 4096 word_1178C50 indexee par 1024 - s/4 clampe en signe, divise par s puis re-packe le dword : bits 0-9 qx, bits 10-19 qy, bits 20-31 magnitude s>>1 ; dword a zero si la norme est nulle. Retour EAX = 0 residuel, do-while sans garde, appelé uniquement par sub_69E940. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_69E9A0 (0x69E9A0, 92 instr. / 273 o)

Cellule C-R — tranchage c_a × c_b contre `asm.asm` (GROUND TRUTH). Hex-Rays = vérificateur seulement.

---

## Divergence 1 — Layout bits du dword re-packé [edi+4]

**Position c_a** : « 10 bits x, 10 bits y, bits 20-31 magnitude, bits 18-19 effacés » (le commentaire ligne 84 dit bits 10..17 utilisés pour la composante 1).

**Position c_b** : « bits 0-9 x, 0x0A-0x13 y, 0x14-0x15 = 0, 0x16-0x1F = scaled ».

**TRANCHÉ : c_b, avec deux corrections.**

Preuve ASM adressée :
- `0x69ea70..0x69ea78` : `xor edx,ebx ; and edx,3FFh ; xor edx,ebx` — remplacement des bits **0-9** uniquement (masque 0x3FF, pas de shift avant) → q1 dans bits 0-9.
- `0x69ea7a..0x69ea80` : `and edx,0FFF003FFh` — préserve bits 0-9 et 20-31, **efface bits 10-19** (0x0A..0x13). Ni « 18-19 » (c_a, faux : 0xFFF003FF efface 0x000FFC00) ni « 0x14-0x15 = 0 » (c_b : le masque ne touche pas 0x14-0x15).
- `0x69ea8b..0x69ea90` : `and eax,3FFh ; shl eax,0Ah` — q2 dans bits **10-19**.
- `0x69ea27..0x69ea2c` : `and edx,0FFFFFFFEh ; shl edx,13h` — magnitude = `scaled & ~1` décalée de 19 → occupe bits **20-31** (scaled bits 1..12). Le `&~1` empêche le bit 0 de scaled d'atterrir au bit 19 (zone q2).
- Le bit 19 de scaled, ayant été forcé à 0 avant le shift, ne fuit pas dans la zone q2 — mais il n'y a **aucun bit de padding forcé à 0 à 0x14-0x15** : la magnitude commence au bit 20 (scaled bit 1), pas au bit 22.

Layout final prouvé : **bits 0-9 = q1&0x3FF (x), bits 10-19 = q2&0x3FF (y), bits 20-31 = scaled>>1 (magnitude 12 bits)**.

---

## Divergence 2 — LUT word_1178C50 : présence, sign-extend, index et clamp

**Position c_a** : LUT 2 présente, `movsx` puis `>>2`, index saturé [0, 0x3FF].

**Position c_b** : idem, précise « index 0..0x3FF serré, movsx » ; sem voie B évoque `0x400 − norme/4`.

**TRANCHÉ : consensus confirmé (c_a = c_b, et l'ASM tranche le détail 0x400−…).**

Preuve ASM adressée :
- Présence : `0x69ea50 movsx ecx, word_1178C50[eax*2]` — **MOVSX explicite**, lecture 16 bits SIGNÉE. (Contraste avec la LUT 1 : `0x69ea0a/0x69ea0c xor ecx,ecx ; mov cx, word_1178A50[esi*2]` = zéro-extend.)
- Index : `0x69ea31 mov eax,400h` ; `0x69ea36 sar ecx,2` ; `0x69ea39 sub eax,ecx` → `idx = 0x400 − (scaled >> 2)` — la formule « 0x400 − norme/4 » est exacte.
- Clamp : `0x69ea3e jns` → sinon `0x69ea40 xor eax,eax` (idx<0 → 0) ; `0x69ea44 cmp eax,3FFh` ; `0x69ea49 jle` → sinon `0x69ea4b mov eax,3FFh` (idx>0x3FF → 0x3FF). Comparaisons **signées** (jns/jle). Serrage [0, 0x3FF] confirmé.
- `0x69ea5b sar ecx,2` — SAR (arithmétique) après le movsx.

---

## Divergence 3 — Convention du compte LZCS (pairage, pivot 0x18, SHL/SAR)

**Position c_a** : `c = a1 & ~1` ; pivot 0x18, `jg` signé ; branche SHL si `c−0x18 > 0`, sinon SAR de `0x18−c`. Convention exacte de Gte_LZCS non prouvable.

**Position c_b** : identique ; note que `lea eax,[edx+1Fh] ; sar` = `(31−lz_even)>>1 ≥ 1` pour lz ≤ 30, et que SHL a `cl = lz_even−0x18 ≥ 1 < 32`.

**TRANCHÉ : consensus A/B, avec une précision de c_b retenue et une vérification clé.**

Preuve ASM adressée :
- Pairage : `0x69e9ea and ecx,0FFFFFFFEh` — bit 0 du compte forcé à 0 ; re-stocké `0x69e9ef` (store mort, arg_0 jamais relu ensuite).
- Pivot : `0x69e9f5 add ecx,0FFFFFFE8h` (c−0x18) ; `0x69e9ff test ecx,ecx ; jg` — **JG signé** (c_a et c_b d'accord, contrairement à Hex-Rays `a1-24 > 0` qui est bien le même JG signé).
- **Enroulement de shift écarté** : dans la branche SAR, `0x69ea01 lea ecx,[edx+18h]` **recharge cl = 0x18−c** (edx = −c depuis `0x69e9f3 neg edx`). Ce n'est PAS `c−0x18` tronqué à 5 bits. Aucun shift d'un compte ≥ 32 n'est possible dans les deux branches.
- SHL : `0x69ea08 shl esi,cl` avec cl = c−0x18 ∈ {2,4,6,…} (c pair, > 24).
- SAR : `0x69ea04 sar esi,cl` avec cl = 0x18−c ∈ [0,24] — arithmétique.
- Décalage inverse : `0x69e9f8 lea eax,[edx+1Fh]` ; `0x69e9fb sar eax,1` → `(0x1F−c)>>1`, utilisé à `0x69ea18 shl esi,cl` sur la valeur de LUT 1.
- Convention Gte_LZCS elle-même (zéros de tête) **non prouvable** par ce seul ASM → UNCERTAIN (seuls ses effets sont prouvés).

---

## Divergence 4 — sar vs shr partout

**Position c_a** : SAR explicite restauré aux 4 sites, note que Hex-Rays rend `>>` logique.

**Position c_b** : idem, précise que pour 0x69ea22 SAR ≡ SHR en pratique (bit 31 inatteignable : 16 bits << au plus 15).

**TRANCHÉ : SAR partout (l'ASM gagne), la nuance pratique de c_b est exacte.**

Preuve ASM adressée — les 5 sites de shift droit sont tous SAR :
- `0x69e9fb sar eax,1` (calcul `(0x1F−c)>>1`)
- `0x69ea04 sar esi,cl` (normalisation, branche pivot)
- `0x69ea22 sar esi,0Ch` (après LUT 1 + SHL — bit 31 impossible : max 0xFFFF<<15 = 0x7FFF8000)
- `0x69ea36 sar ecx,2` (index LUT 2)
- `0x69ea5b sar ecx,2` (après MOVSX LUT 2 — valeur signée, SAR ≠ SHR **sémantiquement** ici)

Hex-Rays rend `>>` (logique en C pour signed → implémentation-defined, en pratique arithmétique sur MSVC, mais l'ASM dit SAR : restauré explicite).

---

## Divergence 5 — Compteur/retour : écriture arg_0 (0x69e9ef) et valeur de retour EAX

**Position c_a** : arg_0 réutilisé comme compteur, re-stocké à 0x69e9ef ; retour = compteur de boucle final décrémenté.

**Position c_b** : store 0x69e9ef MORT (arg_0 jamais relu ensuite) ; retour = compteur après dec final = **0**.

**TRANCHÉ : c_b.**

Preuve ASM adressée :
- `0x69e9d9 lea edx,[esp+18h+arg_0]` → le getter écrit dans le slot arg_0 ; `0x69e9e3 mov ecx,[esp+1Ch+arg_0]` est la SEULE relecture (juste après le call, avant le mask) ; `0x69e9ef mov [esp+14h+arg_0],ecx` n'est jamais relu après — **store mort**, à documenter (aliasing destructif du paramètre, inoffensif car a1 déjà consommé à 0x69e9aa/0x69e9ad).
- Retour : `0x69ea98 mov eax,[esp+14h+var_8]` ; `0x69ea9f dec eax` ; `0x69eaa0` re-store ; `0x69eaa4 jnz loc_69E9B4`. Quand la boucle sort, EAX = compteur après le dernier dec = **0** (c_a disait « compteur final décrémenté » sans trancher la valeur ; c_b précise 0 — correct, et identique à `return result` de Hex-Rays).
- NB : `return 0` constant n'est valable que pour une sortie par décrément complet ; avec le do-while sans garde (divergence 6), un count=0 en entrée donnerait ~2^32 itérations puis retour 0 également — pas de chemin de retour avec valeur ≠ 0.

---

## Divergence 6 — do-while sans garde count=0

**Position c_a** : do-while, pas de garde (implicite).

**Position c_b** : do-while explicite, note count==0 → 0xFFFFFFFF itérations.

**TRANCHÉ : consensus — do-while SANS garde confirmé.**

Preuve ASM adressée :
- Tête de boucle unique : `0x69e9b4 movsx eax, word ptr [edi+2]` ; la SEULE arête de retour est `0x69eaa4 jnz loc_69E9B4` (queue). Aucun `jz`/`jle` de garde avant le corps, aucun test de count avant 0x69eaa4.
- Structure : `do { ... } while (--count != 0)` — `dec` à 0x69ea9f, test ZF à 0x69eaa4. Un count=0 en entrée décrémente à 0xFFFFFFFF et boucle ~4·10⁹ fois : comportement reproduit tel quel (pas de garde inventée).

---

## UNCERTAIN restants

- **UNCERTAIN 0x69e9d4** — convention exacte de Gte_LZCS / dword_1CA8A8C (zéros de tête attendus ; le commentaire IDA « leading-bit scan » est un indice, pas une preuve). Seuls les effets (mask bit 0, constantes 0x18/0x1F, relais via le getter) sont prouvés.
- **UNCERTAIN 0x69ea0c** — word_1178A50 indexé par `esi*2` sans AUCUNE garde de borne ; l'index de la LUT 1 est supposé rester dans [0,0xFF] si le compte LZCS est cohérent. NB : word_1178A50 (0x1178A50+0x200) est **adjacente** à word_1178C50 (0x1178C50) — un débordement lirait dans la LUT 2.
- **UNCERTAIN 0x69ea62 / 0x69ea85** — `scaled == 0` non gardé ; `idiv esi` lèverait #DE. Aucune preuve d'impossibilité depuis ce seul ASM (la normalisation devrait garantir scaled ≠ 0 si la LUT 1 ne renvoie jamais 0 — non prouvé).
- **UNCERTAIN 0x69e9a0** — [a1+0x00] jamais lu (rôle de l'en-tête inconnu) ; sémantique métier du dword (normales 2×10 bits + magnitude ?) : hors périmètre C-R. Fan-in = 1 (sub_69E940 @ 0x69e946 seulement).

## Divergences vs Hex-Rays

- **0x69e9fb / 0x69ea04 / 0x69ea22 / 0x69ea36 / 0x69ea5b** : HR rend tous les shifts droits `>>` ; l'ASM dit **SAR** sur les 5 sites. SAR explicite restauré (sémantiquement significatif à 0x69ea5b où l'opérande est signée après MOVSX).
- **0x69ea50** : HR `word_1178C50[v5] >> 2` omet le **MOVSX** explicite — restauré (lecture 16 bits signée).
- **0x69ea0c** : HR `(unsigned __int16)word_1178A50[...]` ✓ (zéro-extend correct) — confirmé par `xor ecx,ecx ; mov cx`.
- **0x69e9ef** : store mort du slot arg_0 élidé par HR (`a1 &= ~1u` couvre le mask mais pas le store pile) — documenté, sans effet sémantique.
- **0x69e9ff** : HR `if (a1 - 24 > 0)` = JG **signé** ✓ (cohérent ASM).
- **0x69ea70..0x69ea95** : bloc xor/and reformulé par HR avec casts `unsigned __int16` — équivalence bit à bit vérifiée contre les masques ASM (0x3FF, 0xFFF003FF, shl 0Ah).
- **`v1 += 4`** (sur `__int16*`) = +8 octets ✓ — stride 0x08 confirmé par `0x69ea9c add edi,8`.
- **Retour** : HR `return result` ; result = compteur décrémenté = 0 en sortie normale ✓.
