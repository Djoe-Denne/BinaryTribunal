# PRODUCE C — volet A — g21 / 0x508540 (`sub_` selon IDA)

- **Mission** : `ff8-decomp-semantics-20261011-r01`
- **Rôle** : PRODUCE C, volet A, fork indépendant (2+1) depuis la session explorateur gelée (héritage projeté) — CONTRAT.md §5.
- **Statut** : production soumise pour validation lead / réconciliation. **Aucun verdict sémantique.** Aucune compilation/exécution (validation non exécutée, appartenant au lead).
- **Périmètre d'écriture** : ce fichier uniquement. Aucune lecture de volet frère (c_b), de pairs, de ledger ou d'index de résultats.

## 1. Sources du gel (ground truth = octets/ASM)

| Élément | Valeur | Provenance |
|---|---|---|
| IDB | `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64` | packet `native` |
| Exe d'entrée | `FF8_EN.exe`, sha256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` | packet `native` |
| Export gel | `2026-10-11T16:38:25.140966+00:00` | packet `native` |
| Packet cible | `.tmp/ff8-decomp-semantics-20261011-r01/native/0x508540.json` | manifeste `native-groups.json:522` |
| sha256 packet (manifeste, **cité non recalculé**) | `a6f4b030c04283a9013f249b947d0f57a2340a543f132445026e53522ea44e92` | `native-groups.json:523` |
| Dimensions | `instructions=20, asm_chars=862, blocks=6` | `native-groups.json:519–521` |

Références internes au packet : chunk hex `:11–16` ; listing ASCII `:18` ; CFG `:19–61` ; xrefs `:63–94` ; graphe hors-appels `native-groups.json:2428–2437` (out = aucun ; callers `0x502F30`, `0x5044B0`, `0x508580`, `0x50AE00`, `0x50AE20`).

## 2. Verbatim du gel

Chunk unique `[0x508540, 0x508575)` — 53 octets (packet `:15`) :

```
8b442404 f60008 7529
8b4c2408 8b5008 85d1 751e
8a4805 84c9 7511
8b5074 8b4c240c 33c0 668b422c
85c8 7506
b801000000 c3
33c0 c3
```
(chaîne d'origine exacte : `8b442404f6000875298b4c24088b500885d1751e8a480584c975118b50748b4c240c33c0668b422c85c87506b801000000c333c0c3`)

Listing (packet `:18`, commentaires IDA d'origine) :

```
00508540: mov     eax, [esp+arg_0]
00508544: test    byte ptr [eax], 8; Logical Compare
00508547: jnz     short loc_508572; Jump if Not Zero (ZF=0)
00508549: mov     ecx, [esp+arg_4]
0050854D: mov     edx, [eax+8]
00508550: test    ecx, edx; Logical Compare
00508552: jnz     short loc_508572; Jump if Not Zero (ZF=0)
00508554: mov     cl, [eax+5]
00508557: test    cl, cl; Logical Compare
00508559: jnz     short loc_50856C; Jump if Not Zero (ZF=0)
0050855B: mov     edx, [eax+74h]
0050855E: mov     ecx, [esp+arg_8]
00508562: xor     eax, eax; Logical Exclusive OR
00508564: mov     ax, [edx+2Ch]
00508568: test    eax, ecx; Logical Compare
0050856A: jnz     short loc_508572; Jump if Not Zero (ZF=0)
0050856C: mov     eax, 1
00508571: retn; Return Near from Procedure
00508572: xor     eax, eax; Logical Exclusive OR
00508574: retn; Return Near from Procedure
```

## 3. ABI factuelle

- **Arguments** `[esp+4]=arg0`, `[esp+8]=arg1`, `[esp+0Ch]=arg2` (pas de cadre ; jamais `[ebp]`).
- **Nettoyage côté appelant** : `retn` seul (callee ne poppe rien) ; les deux sites d'appel visibles dans le groupe nettoient 3×4=12 octets (`add esp,0Ch` à `0x50AE0F` et `0x50AE5B`, packets `0x50AE00.json:18` / `0x50AE20.json:18`) → forme **cdecl** 32 bits (convention non déclarée par le binaire ; constat ABI, pas un choix).
- **Retour** : EAX ∈ {0, 1} par littéraux (`xor eax,eax` / `mov eax,1`). Type C neutre : `int` 32 bits (constat : tenter `bool` changerait l'ABI de retour MSVC x86 de bas niveau ; `int` est le mappage exact).
- **Registres** : feuille, aucun `call`/`push` interne ; clobber EAX/ECX/EDX uniquement ; EBX/ESI/EDI/EBP jamais touchés → aucune sauvegarde nécessaire.
- **Vitesses d'accès** : `arg0` pointeur 32 bits ; `arg1`/`arg2` masques 32 bits.

## 4. Reproduction C (livrable)

```c
#include <stdint.h>

typedef unsigned char  u8;
typedef unsigned short u16;
typedef unsigned int   u32;

/* 0x508540..0x508575 — 20 instructions, 6 blocs, 1 chunk, feuille.
 * Convention constatée : callee ne nettoie pas la pile (retn nu) ;
 * les appelants de ce groupe libèrent 12 octets (add esp,0Ch).
 * Retour : EAX = 0 | 1 (int 32 bits). */
int sub_508540(u8 *obj, u32 arg1_mask, u32 arg2_mask)
{
    u32 field_at_08;
    u32 ptr_at_74;
    u16 word_at_2c;

    /* 00508540 mov eax,[esp+arg_0] — arg0 reçu directement comme paramètre. */
    /* 00508544 test byte ptr [eax],8 / 00508547 jnz loc_508572 (ret0) */
    if (obj[0x00] & 0x08u)
        return 0;

    /* 00508549 mov ecx,[esp+arg_4] ; 0050854D mov edx,[eax+8] */
    field_at_08 = *(const u32 *)(const void *)(obj + 0x08);
    /* 00508550 test ecx,edx / 00508552 jnz loc_508572 (ret0) */
    if (arg1_mask & field_at_08)
        return 0;

    /* 00508554 mov cl,[eax+5] ; 00508557 test cl,cl / 00508559 jnz loc_50856C (ret1) */
    if (obj[0x05] != 0)
        return 1;

    /* 0050855B mov edx,[eax+74h] */
    ptr_at_74 = *(const u32 *)(const void *)(obj + 0x74);
    /* 00508562 xor eax,eax ; 00508564 mov ax,[edx+2Ch]
     * zéro-extension explicite : EAX = (u16)lu, bits 16..31 = 0. */
    word_at_2c = *(const u16 *)(const void *)(ptr_at_74 + 0x2C);
    /* 00508568 test eax,ecx / 0050856A jnz loc_508572 (ret0) */
    if ((u32)word_at_2c & arg2_mask)
        return 0;

    /* 0050856C mov eax,1 / 00508571 retn */
    return 1;
    /* loc_508572: 00508572 xor eax,eax / 00508574 retn → matérialisé par chaque `return 0`. */
}
```

**Variante strict-C (lectures non alignées).** `obj+0x74` et `ptr_at_74+0x2C` peuvent être non alignés ; le Gel x86 l'admet, C strict ne le garantit pas. Équivalent byte-exact pour compilation portable :

```c
/* substitutions stricte-conformité (largeurs/endianness x86 LE identiques) :
 *   field_at_08 : memcpy(&field_at_08, obj + 0x08, sizeof field_at_08);   // little-endian imposée par le Gel x86
 *   word_at_2c  : memcpy(&word_at_2c,  (const u8 *)ptr_at_74 + 0x2C, sizeof word_at_2c);
 */
```

## 5. Couverture instruction → C (20/20, 6/6 blocs)

| # | Adresse | Instruction | Correspondance C |
|---|---|---|---|
| 1 | 0x508540 | `mov eax,[esp+arg_0]` | paramètre `obj` |
| 2 | 0x508544 | `test byte ptr [eax],8` | `obj[0x00] & 0x08u` |
| 3 | 0x508547 | `jnz loc_508572` | `return 0` (branche if#1) |
| 4 | 0x508549 | `mov ecx,[esp+arg_4]` | paramètre `arg1_mask` |
| 5 | 0x50854D | `mov edx,[eax+8]` | `field_at_08 = *(u32*)(obj+0x08)` |
| 6 | 0x508550 | `test ecx,edx` | `arg1_mask & field_at_08` |
| 7 | 0x508552 | `jnz loc_508572` | `return 0` (if#2) |
| 8 | 0x508554 | `mov cl,[eax+5]` | `obj[0x05]` (largeur 8, via CL) |
| 9 | 0x508557 | `test cl,cl` | `obj[0x05] != 0` |
| 10 | 0x508559 | `jnz loc_50856C` | `return 1` court-circuit |
| 11 | 0x50855B | `mov edx,[eax+74h]` | `ptr_at_74 = *(u32*)(obj+0x74)` |
| 12 | 0x50855E | `mov ecx,[esp+arg_8]` | paramètre `arg2_mask` |
| 13 | 0x508562 | `xor eax,eax` | zéro-extension : bits 16..31 d'EAX = 0 |
| 14 | 0x508564 | `mov ax,[edx+2Ch]` | `word_at_2c = *(u16*)(ptr_at_74+0x2C)` |
| 15 | 0x508568 | `test eax,ecx` | `(u32)word_at_2c & arg2_mask` |
| 16 | 0x50856A | `jnz loc_508572` | `return 0` (if#3) |
| 17 | 0x50856C | `mov eax,1` | `return 1` |
| 18 | 0x508571 | `retn` | fin `return 1` |
| 19 | 0x508572 | `xor eax,eax` | queues `return 0` (×3 sites de saut) |
| 20 | 0x508574 | `retn` | fin `return 0` |

**20/20 instructions mappées, 6/6 blocs CFG (`0x508540`, `0x508549`, `0x508554`, `0x50855B`, `0x50856C`, `0x508572` ; successeurs identiques au packet `:19–61`), chunk hex décodé intégralement (53 octets, taille vérifiée).**

## 6. Arithmétique, largeurs, signedness

- **Aucune opération arithmétique** (pas d'add/sub/mul/imul, pas d'inc/dec) → **aucun overflow/wrap possible**.
- **Aucun shift** (pas de shl/shr/sar) → aucune question de saturate/carry.
- **ET logique/TEST uniquement**, en largeurs 8 (`test cl,cl`; `test byte [eax],8`), 16 (`mov ax,` lecture), 32 (`test eax,ecx`). Conséquence : la lecture `mov ax,[edx+2Ch]` suivie de `test eax,ecx` compare **arg2 contre un u16 zéro-étendu** — `arg2_mask` ne peut influencer les bits 16..31 que via zéro ; reproduit par `(u32)word_at_2c & arg2_mask`.
- **Signedness** : aucune comparaison signée ; tous les champs accédés sont traités non signés (`u8/u16/u32`). `int` de retour ne porte que les littéraux {0,1}.

## 7. Contexte d'appel (faits, hors périmètre de production)

- xrefs_to (packet `:63–94`, type 17) : `0x502f5c` (fn `0x502F30`), `0x504753` (fn `0x5044B0`), `0x508598` (fn `0x508580`), `0x50ae0a` (fn `0x50AE00`), `0x50ae56` (fn `0x50AE20`).
- Constantes aux sites des deux thunks du groupe (0x50AE00 : arg1=0x1A, arg2=0x40, arg0=`dword_1D99A40` ; 0x50AE20 : arg1=0x1A, arg2=0x140, arg0=élément itéré de pas 0x9C) : **constat de gel cité**, hors production de cette EA, aucune reconstruction de ces thunks ici.
- Les six callants ne font pas partie des 98 EA de la mission (`native-groups.json:functions`).

## 8. Incertitudes et hypothèses

1. **Aucun verdict sémantique** : noms internes (`obj`, `arg1_mask`, `arg2_mask`, `field_at_08`, `ptr_at_74`, `word_at_2c`) sont paramétriques, décrits par l'opération ET observée — pas des affirmations de rôle.
2. **Layout** : seuls les champs atteints par le code sont mappés (+0x00 u8, +0x05 u8, +0x08 u32, +0x74 u32; objet secondaire +0x2C u16). Chevauchements possibles inconnus ; aucun struct fictif n'est inventé.
3. **Déréférencement `+0x74`** : le gel ne montre aucun test de nullité ; reproduction fidèle sans garde inventée.
4. **Endianité** : x86 32 bits little-endian du gel ; la variante strict-C s'appuie explicitement sur cette hypothèse (déclarée §4).
5. **Codes xref 17** : interprétation ida_xref standard (`call near`), non confirmée contre la doc d'export.
6. **sha256 du packet** : cité depuis le manifeste, **non recalculé** (aucune écriture/exécution autorisée pour ce rôle).
7. **Validations non exécutées** : compilation, lint, diff comportemental, réconciliation A/B — toutes réservées au lead (CONTRAT §6). **Aucun test n'a été exécuté et aucun PASS n'est affirmé.**

## 9. Inventaire des sources citées

- `docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md` (lignes 1–40) — autorité mission.
- `docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json` — `:166–173` (groupe g21), `:516–524` (entrée manifeste 0x508540 + sha256), `:2428–2437` (graphe).
- `.tmp/ff8-decomp-semantics-20261011-r01/native/0x508540.json` — `:2–10` métadonnées, `:11–16` chunk, `:18` listing, `:19–61` CFG, `:63–94` xrefs.
- `.tmp/ff8-decomp-semantics-20261011-r01/native/0x50AE00.json`, `0x50AE20.json` — constantes des thunks citées aux sections 7 (contexte factuel seulement).
