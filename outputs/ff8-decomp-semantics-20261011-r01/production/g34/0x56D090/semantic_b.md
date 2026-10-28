# semantic B — 0x56D090 (g34, run01)

- **EA:** `0x56D090`
- **Volet:** B (aveugle, 2+1 sémantique)
- **Auteur:** pool-185 / re-semantic-ensemble
- **Tâche:** `task_mv44tmx1_00h4_1nk3to`
- **Packet SHA256:** `7bb9b2534bfc3019773f9afc75c646c12900602b494595a585455586a23c65d8`
- **Compaction SHA256:** `f25865201fc77a97e108274fe16be8da7e9055939c3ca5acb337f78101be03d3`
- **PE input SHA256:** `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
- **Export:** 2026-10-11T16:38:25.140966+00:00, PE32 `FF8_EN.exe`
- **Chunk / CFG:** un bloc `0x56D090`–`0x56D0F6`, 32 instructions, aucun Jcc, `successors: []`
- **Label IDA (métadonnée, pas une preuve de rôle):** `Mat3S16_MulByRotZ_Q12`

Les commentaires / noms d’opérandes IDA (`p_angle`, `Fixed_Cos4096_Q12`, `Fixed_Sin4096_Q12`, `var_*`) ne sont pas des preuves. Les corps x87 des callees `0x56D100` / `0x56D130` / `0x56C270` / `0x56C090` cités ci-dessous viennent de la compaction factuelle (paquet voisin gelé 2026-10-10), pas du paquet courant de `0x56D090`.

## Confiance

| Couche | Niveau | Périmètre |
|---|---|---|
| ABI / flux de cette fonction | **CERTAIN** | prologue, 2 args cdecl-like, stores WORD, 3 appels, `ADD ESP,10h`, retour `EAX` |
| Grille locale 9×int16 et motif c/−s/s/c/1 | **LIKELY** | motif mécanique + helpers FCOS/FSIN + littéral `1000h` |
| Combinaison avec `dst` via `0x56C270` (produit de deux grilles) | **LIKELY** | résumé compaction de `0x56C090` (3 itérations stride 6, produits x87) ; ordre gauche/droite non prouvé ici |
| Métier (repère Z, vecteurs ligne vs colonne, unité d’angle « GTE ») | **UNCERTAIN** | convention d’axes et contrat d’objets hors gel |

Pas de **CONFLICT** interne entre bytes, ASM verbatim et compaction pour cette EA.

## Nom proposé

**`mat3s16_combine_rotz_q12`**

Deux preuves indépendantes du fragment « rotZ Q12 » (le label IDA n’en est pas une) :

1. **Motif de stores** (cette fonction, bytes/ASM) : neuf WORD consécutifs `c, -s, 0, s, c, 0, 0, 0, 0x1000` — 2×2 de rotation 2D + scalaire `4096` en dernière cellule.
2. **Corps gelés des callees** : `0x56D100` contient `FCOS` (`D9FF`) après `FILD` DWORD puis `FMUL` float `0.0015339808305725455` (`[B6B980]`) et `FMUL` `4096.0` (`[B69540]`) ; `0x56D130` même forme avec `FSIN` (`D9FE`).

Le fragment « combine / mul » n’a **qu’une** famille de preuves (callee `0x56C270` → `0x56C090` à produits). Il n’est donc **pas** dans le nom comme fait certain. Alternative plus étroite si R refuse le combine : `mat3s16_build_rotz_q12_then_56C270`.

## Rôle

**Mécanique (CERTAIN).** Construit un tampon local de 32 octets, y écrit 18 octets (9 WORD), appelle `0x56D100` puis `0x56D130` avec le **même DWORD** d’entrée, puis `0x56C270(local, dst)`, et retourne `dst`.

**Interprétation (LIKELY).** Le tampon est une matrice 3×3 d’int16 à pas 2, motif de rotation du plan des deux premières lignes/colonnes, « 1 » Q12 = `0x1000` en (2,2). `0x56C270` combine ce motif avec la grille pointée par le second argument (produits + copie 5 DWORD / 20 octets vers `dst`).

**Hypothèse métier (UNCERTAIN).** Rotation autour d’un axe Z d’un espace XYZRHW / GTE ; le premier argument serait un angle entier dont le helper fait `fild(i32) * (π/2048)` radians. Non démontré par les xrefs (27 sites code type 17), qui ne portent pas de sémantique.

## In / out / effets

Convention d’appel observée : callee ne dépile pas ; quatre `PUSH` DWORD cumulés, un seul `ADD ESP,10h` à `0x56D0EB`.

| | Type mécanique | Provenance |
|---|---|---|
| Arg0 `[ESP+4]` à l’entrée | **DWORD entier**, lu `MOV EDI,[ESP+2Ch]` à `0x56D095` (`8B 7C 24 2C`), **pas** `MOVSX` WORD | bytes + compaction |
| Arg1 `[ESP+8]` | **pointeur 32-bit** `dst`, lu `MOV ESI,[ESP+38h]` à `0x56D0B5` (`8B 74 24 38`) | bytes |
| Retour | **`EAX` = ESI = dst** (32-bit, pas AX/AL) à `0x56D0EE` `8B C6` | bytes |
| Callees | `0x56D100`, `0x56D130`, `0x56C270` | rel32 + `code_targets` |
| Globals racine | aucun load/store | compaction + ASM |

**Tampon local** (base `LEA EDX,[ESP+10h]` à `0x56D0BE`, avant les deux derniers push : base = `orig_ESP-20h`) :

| off WORD | écriture | valeur |
|---:|---|---|
| +0 | `0x56D0A9` `66 89 74 24 10` | `SI` = low16(retour `0x56D100`) |
| +2 | `0x56D0B9` `66 89 4C 24 12` | `CX` = low16(`NEG` 32-bit du retour `0x56D130`) |
| +4 | `0x56D0C6` `66 89 4C 24 1C` | `0` (`XOR ECX,ECX` à `0x56D0C2`, **après** le store négatif) |
| +6 | `0x56D0CB` `66 89 44 24 1E` | `AX` = low16(retour `0x56D130` **non** négé ; `NEG` était sur `ECX`) |
| +8 | `0x56D0B0` `66 89 74 24 18` | `SI` = même low16 que +0 |
| +10 | `0x56D0D0` `66 89 4C 24 22` | `0` |
| +12 | `0x56D0D5` `66 89 4C 24 24` | `0` |
| +14 | `0x56D0DA` `66 89 4C 24 26` | `0` |
| +16 | `0x56D0DF` `66 C7 44 24 28 00 10` | littéral `0x1000` |

- Allocation `SUB ESP,20h` : 32 octets ; **seuls 18 octets** sont écrits. `local+18`/`+19` non initialisés ici.
- `NEG ECX` à `0x56D0AE` (`F7 D9`) est un négatif **32-bit** ; la troncature WORD est le store `CX`.
- Signedness des cellules : stores `66 89` (copie des 16 bits bas). Le signe de Arg0 n’est pas étendu ici ; les helpers gelés font `FILD` DWORD **signé**.
- Appel `0x56C270` : `[ESP]=EDX` (base locale) puis `[ESP+4]=ESI` (dst), plus deux DWORD d’angle résiduels sous la pile. Compaction : `0x56C270` recopie **5 DWORD / 20 octets** vers le second pointeur — l’empreinte écrite sur `dst` dépasse les 18 octets initialisés (octets +18/+19 = résidu local non écrit par cette fonction).

## Preuves (8)

1. **Arg0 DWORD, pas WORD.** `0x56D095` `8B7C242C` / `mov edi, [esp+2Ch]` ; même `EDI` poussé à `0x56D099` et `0x56D09F`. Contrasté dans la compaction avec `0x6D9510` / `0x6CF070` qui font `0FBF` MOVSX WORD — fait de largeur, pas de nom.
2. **Rel32 callees trig.** `0x56D09A` `E8 61 000000` → `0x56D100` ; `0x56D0A2` `E8 89 000000` → `0x56D130`. Premier retour gardé dans `ESI` (`8BF0` à `0x56D0A0`) ; second dans `EAX` puis `ECX` (`8BC8` à `0x56D0A7`).
3. **Négation du second retour seulement.** `NEG ECX` `0x56D0AE` ; `AX` encore le second retour au store `0x56D0CB`. Donc cellules +2 = −sin16, +6 = +sin16.
4. **Motif 3×3 WORD.** Stores ci-dessus → `[[c,−s,0],[s,c,0],[0,0,0x1000]]` si on lit 3 rangées de 3 int16 consécutifs (stride 6). Littéral `1000h` à `0x56D0DF`.
5. **Helpers FCOS/FSIN + échelle 4096 (paquet 2026-10-10).** `0x56D100` : `FILD` / `FMUL [B6B980]` / `FCOS` / `FMUL [B69540]` / `FADD [B693D8]` / `FSTP` / `MOV EAX,low` / `ADD EAX,80000000h`. `0x56D130` : `FSIN` à la place de `FCOS`. Constantes IEEE : float `≈0.00153398083` ≈ π/2048, float `4096`, double `2^52+2^31`. Arrondi x87 **non** figé (pas de modification de CW montrée).
6. **`0x56C270` (local, dst) puis nettoie 16 octets.** `PUSH ESI` `0x56D0C4`, `PUSH EDX` `0x56D0C5`, `CALL 0x56C270` `0x56D0E6` `E8 85 F1 FFFF`, `ADD ESP,10h` `0x56D0EB`. Quatre poussées au total, pas quatre arguments du dernier appel.
7. **Retour = pointeur dst.** `MOV EAX,ESI` `0x56D0EE` ; `ESI` n’est pas écrasé après `0x56D0B5`. `POP EDI/ESI`, `ADD ESP,20h`, `RETN` `0x56D0F5` `C3`.
8. **Xrefs code.** 27 sites type 17 / `iscode: true` (ex. `0x56CD50`, `0x6E9AB0` qui appelle aussi `0x6D9510` à `0x6E9ADC`). Prouve la réutilisation, **pas** le métier. Sortants : uniquement `0x56C270`, `0x56D100`, `0x56D130` ; pas d’appel entre les quatre EA possédées.

## Questions ouvertes

1. Ordre du produit dans `0x56C090` : `dst * R` vs `R * dst` vs autre contraction ; le gel courant de `0x56D090` ne contient pas le corps.
2. `dst` est-il un in/out déjà initialisé (d’où « mul by ») ou un buffer dont les cellules lues sont indéfinies ? Les 27 callers ne sont pas dans la projection.
3. Octets `dst+18..+19` : provenance résidu local vs copie DWORD interne à `0x56C090` ; non stables par construction.
4. Arg0 : domaine signé, wrap 4096, identité avec un angle GTE ; dépend de l’environnement x87.
5. Convention d’axes / vecteurs à gauche ou à droite ; le motif 2×2 est compatible rotZ **si** m22 est l’identité homogène, ce qui n’identifie pas l’espace métier.
6. Aliasing `dst` avec le tampon local ou avec le stockage de l’angle : non testé.

## Sources lues (bornées)

- `inputs/ff8-decomp-semantics-20261011-r01/g34/common-compaction.md`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.json`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.readable/{manifest.json,metadata.json,asm-001.txt,asm-002.txt,bytes-001.txt}`
- Guide mission déjà lu : `docs/tech/RE_MULTI_PROVIDER_MISSIONS.md` (§ livrable sémantique)

Non lus (interdit volet B) : `semantic_a.md`, volets C, ledger, IDB/live, index externe, autres EA production.
