---
target: FF8_EN.exe (Steam 2013, sha256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570, base 0x400000)
source: FFNx (clone local `C:/Users/djden/AppData/Local/Temp/opencode/ffnx-clone/src/`, chemin FF8)
registre: docs/tech/investigation/battle-static-discovery/ (decomp/, semantic/, battle-graph-ledger.json, battle-indirect-registry.json)
date: 2026-09-22
---

# Crosswalk EAs FFNx ↔ registre re-ff8

## Summary

Crosswalk des **193 EAs uniques mesurés** (le "196" annoncé incluait 3 faux positifs de troncature hexadécimale,
voir méthodo) référencés en dur par les sources FFNx — chemin FF8 — contre le registre de campagne re-ff8
(bin hash-bound `064d466b…`, base 0x400000).

| Catégorie | EAs | Part |
|---|---:|---:|
| **Tableau 1 — déjà connus de nous** (ancrés dans notre registre) | **3** | 1,6 % |
| **Tableau 2 — nouveaux sémantisés** (candidats de décomp) | **166** | 86,0 % |
| **Tableau 3 — non résolus / ambigus** (offsets arène, EAs d'autres builds, flags, GUID) | **24** | 12,4 % |

Le recouvrement direct est **minime (3/193)**, mais la valeur du crosswalk est ailleurs : les **161 sites du
patch « battle effect layout »** de FFNx sont **tous validés par relecture dword de notre IDB** (160/160 exacts
+ 1 site `push` vérifié octet à octet). FFNx prouve donc, hash-bound, que ces EAs sont de vrais ancrages
d'instructions de notre binaire, et leur donne une sémantique précise : **chaque site hardcode un offset VRAM
d'upload des TIM d'effets de combat** (ou une référence au pointeur d'arène d'effets), que FFNx réécrit pour
aligner le layout « classic » sur le layout Remastered. La majorité de ces sites tombent **dans des fonctions
MAG_/GF_ déjà nommées ou adjacentes dans notre IDB** — c'est un plan de sémantisation prêt à l'emploi pour les
zones 0x58xxxx–0x6EDxxx que nos campagnes n'avaient pas encore couvertes.

## Méthodo

- **Extraction** : regex délimitée `(?<![0-9A-Fa-f])0x[456][0-9A-Fa-f]{5}(?![0-9A-Fa-f])` (EAs 0x400000–0x6FFFFF,
  rejets des runs hexadécimaux plus longs) sur le clone local `ffnx-clone/src/` — **40 fichiers scannés**
  (36 fichiers `src/ff8/**` récursifs `.cpp`/`.h` + `ff8_opengl.cpp`, `common.cpp`, `ff8_data.cpp`, `ff8_data.h`).
- **Couverture** : 216 occurrences, **193 EAs uniques**, sur **4 fichiers seulement** : `ff8_opengl.cpp` (196),
  `common.cpp` (17), `ff8/remaster.cpp` (2), `ff8_data.cpp` (1). Les 36 autres fichiers de `src/ff8/**`
  (battle/monsters.cpp, world/wmset.cpp, field/*, etc.) : **0 hit**.
- Contexte **±2 lignes** capturé pour chaque occurrence (dump de travail `ea_dump.txt`, hors livrable) ;
  les tableaux citent la ligne exacte (extrait compact).
- **Recoupement registre (read-only)** : noms des livrables `decomp/<EA>__<Name>.md` (542) et
  `semantic/<EA>__<Name>.md` (24) ; grep `battle-graph-ledger.json` (7 514 fonctions indexées) et
  `battle-indirect-registry.json` ; catalogue `obsidian-docs/projects/re-ff8/references/decomp-function-catalog.md`
  (0 hit direct).
- **Validation IDB (lecture seule, `py_eval`)** : fonction conteneur (`ida_funcs.get_func` + `get_func_name`)
  pour les 193 EAs ; **relecture des dwords de notre IDB** pour valider chaque site de patch FFNx : 160/160
  sites `direct` contiennent exactement le `classic_offset` attendu ; le site `effect_arena_push` 0x5926A2
  contient l'octet `0xA1` + imm32 `0x2200FB8` ; le hook BdLinkTask : octet `0xE8` @ 0x5083A9, disp signé
  `0xFFEFB9EB` → 0x5083AE − 0x104615 = **0x403D99** ✓.
- **Empreintes de version** : FFNx lit `*(uint32_t*)0x401004`, `0x401404`, `0x401010`. Relecture IDB :
  `0x401004 = 0x3885048D` (famille US ✓), `0x401404 = 0x1597C8` → **notre binaire = VERSION_FF8_12_US_NV**
  (« FF8 1.2 US English (Nvidia) ») ; `0x401010 = 0x909090C3` (`ret; nop; nop; nop`) ≠ `0x24AC` (discriminant JP) ✓.
  Conséquence : `ff8_externals.start = 0x55ADB7` pour notre binaire (point d'entrée process).
- **Hors périmètre du pattern** : la même table FFNx contient ~30 EAs hors 0x400000–0x6FFFFF (sites
  0x70EE36…0x1873E4C ; valeurs classic/remastered 0x25658C0, 0x278C7xx, 0x277AEC4, 0x2200FB8, 0xEECC30, …)
  — même sémantique (layout effets), non listés (périmètre pattern imposé).
- Faux positifs de troncature exclus après délimitation : `0x4000000`, `0x5000000`, `0x64000000`,
  `0x40000000`, `0x58C2B4D0` (GUID synthé MIDI) —cf. Tableau 3.

---

## Tableau 1 — EAs déjà connus de nous (confirmés)

| EA | Nom IDA / livrable re-ff8 | Contexte FFNx (fichier:ligne + extrait) | Cross-validation des noms |
|---|---|---|---|
| `0x403D99` | `OutputDebugString_1` — livrable `decomp/0x403D99__OutputDebugString_1.md` ; ledger: named_not_semantically_audited | `ff8_opengl.cpp:452` : `reinterpret_cast<void (*)(const char *)>(0x403D99)(message);` (dans `ff8_battle_link_task_failed`, hook du chemin d'échec BdLinkTask) | FFNx l'appelle comme **fonction de log avec un message** → cohérent avec le nom IDA ✓ |
| `0x5083A9` | site d'appel **dans** `BdLinkTask_Register` (0x508360, livrable `decomp/0x508360__BdLinkTask_Register.md` ; ledger: table_named_unverified) | `ff8_opengl.cpp:459-467` : `if (*reinterpret_cast<const uint8_t *>(0x5083A9) != 0xE8 || 0x5083A9 + 5 + *(int32_t*)0x5083AA != 0x403D99) … skip` puis `replace_call(0x5083A9, ff8_battle_link_task_failed);` | Edge du graph ledger : `direct_call site_va 0x5083A9 → 0x403D99` ✓ ; byte-IDB : `0xE8` ✓ + disp → `0x403D99` ✓ |
| `0x5083AA` | opérande imm32 (displacement) de l'appel ci-dessus — même ancrage | `ff8_opengl.cpp:460` : `0x5083A9 + 5 + *reinterpret_cast<const int32_t *>(0x5083AA) != 0x403D99` | Même preuve octet que ci-dessus ✓ (le disp lu par FFNx = celui de notre binaire) |

**Enrichissement sémantique pour le registre** : le call site 0x5083A9 est le **chemin de rapport d'échec** de
l'enregistrement des BdLinkTask — le message passé à 0x403D99 dit quel pool de tâches est saturé ; le hook FFNx
relit `caller` (stack[3]) et `descriptor` (stack[4]) pour diagnostiquer quel pool sature et dimensionner sa capacité.

---

## Tableau 2 — EAs nouveaux sémantisés (candidats de sémantique/décomp)

### 2.A — Les 161 sites du patch « battle effect layout » (ff8_opengl.cpp:178–380)

Format FFNx : `{ uint32_t address; uint32_t classic_offset; uint32_t remastered_offset; mode }` — le 1er champ
est l'EA d'un **site d'instruction** du binaire classic (dword immédiat hardcodé, ou `A1 imm32`), le 2e la
**valeur présente dans notre binaire** (validée par relecture IDB), le 3e la valeur de remplacement (offset
dans l'arène étendue FFNx = `extended_memory + 0x200000` + offset). Modes : `direct` (réécriture dword),
`effect_arena` (réécriture dword = base arène + offset), `effect_arena_push` (`A1 imm32` → `push imm32`+`nop`).
Chaque EA cite sa ligne FFNx exacte.

**Groupe site orphelin** — anomalie de boundaries IDB

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6C83F5` | `0x3F1FC` → `0xFF1FC` | direct | `ff8_opengl.cpp:332` : `{ 0x6C83F5, 0x3F1FC, 0xFF1FC, ff8_battle_effect_layout_patch_mode::direct },` |

Note : dword IDB @ 0x6C83F5 = `0x0003F1FC` **✓ correspond** ; bytes autour `fc f1 03 00 | 66 c7 40 06 ff ff | 8b 40`
(`…mov word [eax+6], 0xFFFF…`) — du **code**, mais IDA n'a défini aucune fonction englobante (île entre
`sub_6C7E30` et `sub_6C8850`). À corriger lors d'une future passe de nommage.

**Groupe `MAG_327_GILGAMESH_EXCALIPOOR`** — `0x58d760` — **hôte NON couvert** par un livrable — statut : ledger: table_named_unverified — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x58d770` | `0x2E000` → `0xCE000` | direct | `ff8_opengl.cpp:178` : `{ 0x58D770, 0x2E000, 0xCE000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x58d776` | `0x2F800` → `0xCF800` | direct | `ff8_opengl.cpp:179` : `{ 0x58D776, 0x2F800, 0xCF800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x58d77b` | `0x31800` → `0xD1800` | direct | `ff8_opengl.cpp:180` : `{ 0x58D77B, 0x31800, 0xD1800, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `MAG_328_GILGAMESH_EXCALIBUR`** — `0x58d930` — **hôte NON couvert** par un livrable — statut : ledger: table_named_unverified — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x58d940` | `0x2E000` → `0xCE000` | direct | `ff8_opengl.cpp:181` : `{ 0x58D940, 0x2E000, 0xCE000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x58d946` | `0x2F800` → `0xCF800` | direct | `ff8_opengl.cpp:182` : `{ 0x58D946, 0x2F800, 0xCF800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x58d94b` | `0x31800` → `0xD1800` | direct | `ff8_opengl.cpp:183` : `{ 0x58D94B, 0x31800, 0xD1800, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `MAG_329_GILGAMESH_ZANTETSUKEN`** — `0x58db10` — **hôte NON couvert** par un livrable — statut : ledger: table_named_unverified — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x58db20` | `0x2E000` → `0xCE000` | direct | `ff8_opengl.cpp:184` : `{ 0x58DB20, 0x2E000, 0xCE000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x58db26` | `0x2F800` → `0xCF800` | direct | `ff8_opengl.cpp:185` : `{ 0x58DB26, 0x2F800, 0xCF800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x58db2b` | `0x31800` → `0xD1800` | direct | `ff8_opengl.cpp:186` : `{ 0x58DB2B, 0x31800, 0xD1800, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `MAG_330_GILGAMESH_MASAMUNE`** — `0x58dcf0` — **hôte NON couvert** par un livrable — statut : ledger: table_named_unverified — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x58dd00` | `0x2E000` → `0xCE000` | direct | `ff8_opengl.cpp:187` : `{ 0x58DD00, 0x2E000, 0xCE000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x58dd06` | `0x2F800` → `0xCF800` | direct | `ff8_opengl.cpp:188` : `{ 0x58DD06, 0x2F800, 0xCF800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x58dd0b` | `0x31800` → `0xD1800` | direct | `ff8_opengl.cpp:189` : `{ 0x58DD0B, 0x31800, 0xD1800, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_592300`** — `0x592300` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 2 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x592605` | `0x22000` → `0x80000` | direct | `ff8_opengl.cpp:209` : `{ 0x592605, 0x22000, 0x80000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5926a2` | `0x2200FB8` → `0x60000` | effect_arena_push | `ff8_opengl.cpp:212` : `{ 0x5926A2, 0x2200FB8, 0x60000, ff8_battle_effect_layout_patch_mode::effect_arena_push },` |

**Groupe `sub_595EE0`** — `0x595ee0` — **hôte NON couvert** par un livrable — statut : absent du ledger — 1 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x595f8c` | `0x22000` → `0x80000` | direct | `ff8_opengl.cpp:210` : `{ 0x595F8C, 0x22000, 0x80000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_596710`** — `0x596710` — **hôte NON couvert** par un livrable — statut : absent du ledger — 1 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x596750` | `0x22000` → `0x80000` | direct | `ff8_opengl.cpp:211` : `{ 0x596750, 0x22000, 0x80000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_199Cactuar_InvokeSummonScript`** — `0x5a8750` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x5a877e` | `0x2A000` → `0xCA000` | direct | `ff8_opengl.cpp:190` : `{ 0x5A877E, 0x2A000, 0xCA000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5a8784` | `0x2B000` → `0xCB000` | direct | `ff8_opengl.cpp:191` : `{ 0x5A8784, 0x2B000, 0xCB000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5a8789` | `0x20000` → `0xC0000` | direct | `ff8_opengl.cpp:192` : `{ 0x5A8789, 0x20000, 0xC0000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_185Shiva_InvokeSummonScript`** — `0x5c0d50` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 5 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x5c0d5b` | `0x2C000` → `0xCC000` | direct | `ff8_opengl.cpp:193` : `{ 0x5C0D5B, 0x2C000, 0xCC000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c0d6c` | `0x2D000` → `0xCD000` | direct | `ff8_opengl.cpp:194` : `{ 0x5C0D6C, 0x2D000, 0xCD000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c0d78` | `0x33000` → `0xD3000` | direct | `ff8_opengl.cpp:195` : `{ 0x5C0D78, 0x33000, 0xD3000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c0d7e` | `0x2E000` → `0xCE000` | direct | `ff8_opengl.cpp:196` : `{ 0x5C0D7E, 0x2E000, 0xCE000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c0d83` | `0x30800` → `0xD0800` | direct | `ff8_opengl.cpp:197` : `{ 0x5C0D83, 0x30800, 0xD0800, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_185Shiva_ChargeTimelineTask`** — `0x5c0f30` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 4 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x5c0ff4` | `0x10000` → `0x40000` | direct | `ff8_opengl.cpp:198` : `{ 0x5C0FF4, 0x10000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c1025` | `0x10000` → `0x40000` | direct | `ff8_opengl.cpp:199` : `{ 0x5C1025, 0x10000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c11ef` | `0x10000` → `0x40000` | direct | `ff8_opengl.cpp:200` : `{ 0x5C11EF, 0x10000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c123f` | `0x10000` → `0x40000` | direct | `ff8_opengl.cpp:201` : `{ 0x5C123F, 0x10000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_5C7570`** — `0x5c7570` — **hôte NON couvert** par un livrable — statut : absent du ledger — 2 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x5c75a8` | `0x20000` → `0xC0000` | direct | `ff8_opengl.cpp:202` : `{ 0x5C75A8, 0x20000, 0xC0000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c75c4` | `0x24000` → `0xC4000` | direct | `ff8_opengl.cpp:203` : `{ 0x5C75C4, 0x24000, 0xC4000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_5C77C0`** — `0x5c77c0` — **hôte NON couvert** par un livrable — statut : absent du ledger — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x5c7851` | `0x20000` → `0xC0000` | direct | `ff8_opengl.cpp:204` : `{ 0x5C7851, 0x20000, 0xC0000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c78a6` | `0x24000` → `0xC4000` | direct | `ff8_opengl.cpp:205` : `{ 0x5C78A6, 0x24000, 0xC4000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c7a09` | `0x20000` → `0xC0000` | direct | `ff8_opengl.cpp:206` : `{ 0x5C7A09, 0x20000, 0xC0000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_185Shiva_SequenceTick`** — `0x5c7f50` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 2 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x5c7f61` | `0x10000` → `0x60000` | direct | `ff8_opengl.cpp:207` : `{ 0x5C7F61, 0x10000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x5c7f74` | `0x18000` → `0x40000` | direct | `ff8_opengl.cpp:208` : `{ 0x5C7F74, 0x18000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `MAG_326_BDLINK_RET`** — `0x62a7e0` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 5 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x62a7eb` | `0x30800` → `0xD0800` | direct | `ff8_opengl.cpp:213` : `{ 0x62A7EB, 0x30800, 0xD0800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62a7fc` | `0x31800` → `0xD1800` | direct | `ff8_opengl.cpp:214` : `{ 0x62A7FC, 0x31800, 0xD1800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62a802` | `0x32800` → `0xD2800` | direct | `ff8_opengl.cpp:215` : `{ 0x62A802, 0x32800, 0xD2800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62a807` | `0x38800` → `0xD8800` | direct | `ff8_opengl.cpp:216` : `{ 0x62A807, 0x38800, 0xD8800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62a83c` | `0xEECC30` → `0x80000` | effect_arena | `ff8_opengl.cpp:217` : `{ 0x62A83C, 0xEECC30, 0x80000, ff8_battle_effect_layout_patch_mode::effect_arena },` |

**Groupe `sub_62A9C0`** — `0x62a9c0` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 6 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x62aa6c` | `0x14800` → `0x60000` | direct | `ff8_opengl.cpp:218` : `{ 0x62AA6C, 0x14800, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62aacc` | `0x14800` → `0x60000` | direct | `ff8_opengl.cpp:219` : `{ 0x62AACC, 0x14800, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62abd2` | `0x14800` → `0x60000` | direct | `ff8_opengl.cpp:220` : `{ 0x62ABD2, 0x14800, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62ac03` | `0x14800` → `0x60000` | direct | `ff8_opengl.cpp:221` : `{ 0x62AC03, 0x14800, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62acf9` | `0x14800` → `0x60000` | direct | `ff8_opengl.cpp:222` : `{ 0x62ACF9, 0x14800, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x62ade8` | `0x14800` → `0x60000` | direct | `ff8_opengl.cpp:223` : `{ 0x62ADE8, 0x14800, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `MAG_218_UNK11`** — `0x6326d0` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6326e0` | `0x2D000` → `0xCD000` | direct | `ff8_opengl.cpp:224` : `{ 0x6326E0, 0x2D000, 0xCD000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6326e6` | `0x2E800` → `0xCE800` | direct | `ff8_opengl.cpp:225` : `{ 0x6326E6, 0x2E800, 0xCE800, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6326eb` | `0x2F800` → `0xCF800` | direct | `ff8_opengl.cpp:226` : `{ 0x6326EB, 0x2F800, 0xCF800, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_6328A0`** — `0x6328a0` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 6 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x632950` | `0x11000` → `0x60000` | direct | `ff8_opengl.cpp:227` : `{ 0x632950, 0x11000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x632981` | `0x11000` → `0x60000` | direct | `ff8_opengl.cpp:228` : `{ 0x632981, 0x11000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x632a9a` | `0x11000` → `0x60000` | direct | `ff8_opengl.cpp:229` : `{ 0x632A9A, 0x11000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x632acb` | `0x11000` → `0x60000` | direct | `ff8_opengl.cpp:230` : `{ 0x632ACB, 0x11000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x632ae7` | `0x11000` → `0x60000` | direct | `ff8_opengl.cpp:231` : `{ 0x632AE7, 0x11000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x632b1a` | `0x11000` → `0x60000` | direct | `ff8_opengl.cpp:232` : `{ 0x632B1A, 0x11000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_191Doomtrain_InvokeSummonScript`** — `0x63e730` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 7 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x63e73b` | `0x2E000` → `0xCE000` | direct | `ff8_opengl.cpp:233` : `{ 0x63E73B, 0x2E000, 0xCE000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63e741` | `0x2F000` → `0xCF000` | direct | `ff8_opengl.cpp:234` : `{ 0x63E741, 0x2F000, 0xCF000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63e753` | `0x30000` → `0xD0000` | direct | `ff8_opengl.cpp:235` : `{ 0x63E753, 0x30000, 0xD0000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63e759` | `0x31000` → `0xD1000` | direct | `ff8_opengl.cpp:236` : `{ 0x63E759, 0x31000, 0xD1000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63e770` | `0x32000` → `0xD2000` | direct | `ff8_opengl.cpp:237` : `{ 0x63E770, 0x32000, 0xD2000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63e776` | `0x33000` → `0xD3000` | direct | `ff8_opengl.cpp:238` : `{ 0x63E776, 0x33000, 0xD3000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63e77b` | `0x37000` → `0xD7000` | direct | `ff8_opengl.cpp:239` : `{ 0x63E77B, 0x37000, 0xD7000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_191Doomtrain_SequenceTaskDriver`** — `0x63f2d0` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 4 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x63f3ab` | `0x10000` → `0x40000` | direct | `ff8_opengl.cpp:240` : `{ 0x63F3AB, 0x10000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63f3dd` | `0x10000` → `0x40000` | direct | `ff8_opengl.cpp:241` : `{ 0x63F3DD, 0x10000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63f455` | `0x10000` → `0x40000` | direct | `ff8_opengl.cpp:242` : `{ 0x63F455, 0x10000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x63f6c5` | `0x10000` → `0x40000` | direct | `ff8_opengl.cpp:243` : `{ 0x63F6C5, 0x10000, 0x40000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_187Odin_InvokeSummonScript`** — `0x6472e0` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 4 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6472eb` | `0x30000` → `0xD0000` | direct | `ff8_opengl.cpp:244` : `{ 0x6472EB, 0x30000, 0xD0000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6472fc` | `0x31000` → `0xD1000` | direct | `ff8_opengl.cpp:245` : `{ 0x6472FC, 0x31000, 0xD1000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x647302` | `0x32000` → `0xD2000` | direct | `ff8_opengl.cpp:246` : `{ 0x647302, 0x32000, 0xD2000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x647307` | `0x38000` → `0xD8000` | direct | `ff8_opengl.cpp:247` : `{ 0x647307, 0x38000, 0xD8000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_6474C0`** — `0x6474c0` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 4 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x64756c` | `0x14000` → `0x60000` | direct | `ff8_opengl.cpp:248` : `{ 0x64756C, 0x14000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6475cc` | `0x14000` → `0x60000` | direct | `ff8_opengl.cpp:249` : `{ 0x6475CC, 0x14000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6476d4` | `0x14000` → `0x60000` | direct | `ff8_opengl.cpp:250` : `{ 0x6476D4, 0x14000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x647705` | `0x14000` → `0x60000` | direct | `ff8_opengl.cpp:251` : `{ 0x647705, 0x14000, 0x60000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_Diablo_SummonScript_FrameTick`** — `0x6545f0` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 56 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x654661` | `0xD94` → `0x80D94` | direct | `ff8_opengl.cpp:252` : `{ 0x654661, 0xD94, 0x80D94, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654817` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:260` : `{ 0x654817, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654826` | `0x3704C` → `0x417E0` | direct | `ff8_opengl.cpp:261` : `{ 0x654826, 0x3704C, 0x417E0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654833` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:262` : `{ 0x654833, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654842` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:263` : `{ 0x654842, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x65484f` | `0x3704C` → `0x417E0` | direct | `ff8_opengl.cpp:264` : `{ 0x65484F, 0x3704C, 0x417E0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x65485e` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:265` : `{ 0x65485E, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654880` | `0x4C244` → `0x569D8` | direct | `ff8_opengl.cpp:266` : `{ 0x654880, 0x4C244, 0x569D8, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6548c3` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:267` : `{ 0x6548C3, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6548e4` | `0x4AFAC` → `0x55740` | direct | `ff8_opengl.cpp:268` : `{ 0x6548E4, 0x4AFAC, 0x55740, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654909` | `0x4BBC4` → `0x56358` | direct | `ff8_opengl.cpp:269` : `{ 0x654909, 0x4BBC4, 0x56358, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x65492c` | `0x4B558` → `0x55CEC` | direct | `ff8_opengl.cpp:270` : `{ 0x65492C, 0x4B558, 0x55CEC, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x65494f` | `0x4BBC4` → `0x56358` | direct | `ff8_opengl.cpp:271` : `{ 0x65494F, 0x4BBC4, 0x56358, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654974` | `0x4AFAC` → `0x55740` | direct | `ff8_opengl.cpp:272` : `{ 0x654974, 0x4AFAC, 0x55740, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654994` | `0x3903C` → `0x437D0` | direct | `ff8_opengl.cpp:273` : `{ 0x654994, 0x3903C, 0x437D0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6549a3` | `0x3B02C` → `0x457C0` | direct | `ff8_opengl.cpp:274` : `{ 0x6549A3, 0x3B02C, 0x457C0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6549b2` | `0x3D01C` → `0x477B0` | direct | `ff8_opengl.cpp:275` : `{ 0x6549B2, 0x3D01C, 0x477B0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6549bf` | `0x3F00C` → `0x497A0` | direct | `ff8_opengl.cpp:276` : `{ 0x6549BF, 0x3F00C, 0x497A0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6549ce` | `0x40FFC` → `0x4B790` | direct | `ff8_opengl.cpp:277` : `{ 0x6549CE, 0x40FFC, 0x4B790, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6549dd` | `0x42FEC` → `0x4D780` | direct | `ff8_opengl.cpp:278` : `{ 0x6549DD, 0x42FEC, 0x4D780, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6549ea` | `0x44FDC` → `0x4F770` | direct | `ff8_opengl.cpp:279` : `{ 0x6549EA, 0x44FDC, 0x4F770, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6549f9` | `0x46FCC` → `0x51760` | direct | `ff8_opengl.cpp:280` : `{ 0x6549F9, 0x46FCC, 0x51760, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654a08` | `0x48FBC` → `0x53750` | direct | `ff8_opengl.cpp:281` : `{ 0x654A08, 0x48FBC, 0x53750, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654ad5` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:282` : `{ 0x654AD5, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654ae4` | `0x3704C` → `0x417E0` | direct | `ff8_opengl.cpp:283` : `{ 0x654AE4, 0x3704C, 0x417E0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654af3` | `0x3903C` → `0x437D0` | direct | `ff8_opengl.cpp:284` : `{ 0x654AF3, 0x3903C, 0x437D0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b00` | `0x3B02C` → `0x457C0` | direct | `ff8_opengl.cpp:285` : `{ 0x654B00, 0x3B02C, 0x457C0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b0f` | `0x3D01C` → `0x477B0` | direct | `ff8_opengl.cpp:286` : `{ 0x654B0F, 0x3D01C, 0x477B0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b1e` | `0x3F00C` → `0x497A0` | direct | `ff8_opengl.cpp:287` : `{ 0x654B1E, 0x3F00C, 0x497A0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b2b` | `0x40FFC` → `0x4B790` | direct | `ff8_opengl.cpp:288` : `{ 0x654B2B, 0x40FFC, 0x4B790, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b3a` | `0x42FEC` → `0x4D780` | direct | `ff8_opengl.cpp:289` : `{ 0x654B3A, 0x42FEC, 0x4D780, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b49` | `0x44FDC` → `0x4F770` | direct | `ff8_opengl.cpp:290` : `{ 0x654B49, 0x44FDC, 0x4F770, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b56` | `0x46FCC` → `0x51760` | direct | `ff8_opengl.cpp:291` : `{ 0x654B56, 0x46FCC, 0x51760, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b65` | `0x48FBC` → `0x53750` | direct | `ff8_opengl.cpp:292` : `{ 0x654B65, 0x48FBC, 0x53750, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b74` | `0x4AFAC` → `0x55740` | direct | `ff8_opengl.cpp:293` : `{ 0x654B74, 0x4AFAC, 0x55740, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654b81` | `0x4CF9C` → `0x57730` | direct | `ff8_opengl.cpp:294` : `{ 0x654B81, 0x4CF9C, 0x57730, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654c0f` | `0x51D40` → `0x5C4D4` | direct | `ff8_opengl.cpp:295` : `{ 0x654C0F, 0x51D40, 0x5C4D4, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654c3f` | `0xD94` → `0x80D94` | direct | `ff8_opengl.cpp:253` : `{ 0x654C3F, 0xD94, 0x80D94, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654cc1` | `0x51D40` → `0x5C4D4` | direct | `ff8_opengl.cpp:296` : `{ 0x654CC1, 0x51D40, 0x5C4D4, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654cf8` | `0x4EF8C` → `0x59720` | direct | `ff8_opengl.cpp:297` : `{ 0x654CF8, 0x4EF8C, 0x59720, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654d1e` | `0xD94` → `0x80D94` | direct | `ff8_opengl.cpp:254` : `{ 0x654D1E, 0xD94, 0x80D94, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x654e3a` | `0x35F7C` → `0x40710` | direct | `ff8_opengl.cpp:298` : `{ 0x654E3A, 0x35F7C, 0x40710, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6550ad` | `0x3B4E4` → `0x45C78` | direct | `ff8_opengl.cpp:299` : `{ 0x6550AD, 0x3B4E4, 0x45C78, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6550d5` | `0xD94` → `0x80D94` | direct | `ff8_opengl.cpp:255` : `{ 0x6550D5, 0xD94, 0x80D94, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x65524d` | `0xD94` → `0x80D94` | direct | `ff8_opengl.cpp:256` : `{ 0x65524D, 0xD94, 0x80D94, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x655285` | `0xD94` → `0x80D94` | direct | `ff8_opengl.cpp:257` : `{ 0x655285, 0xD94, 0x80D94, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6552cc` | `0xD94` → `0x80D94` | direct | `ff8_opengl.cpp:258` : `{ 0x6552CC, 0xD94, 0x80D94, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x65532a` | `0x31B5C` → `0x3C2F0` | direct | `ff8_opengl.cpp:300` : `{ 0x65532A, 0x31B5C, 0x3C2F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x655371` | `0xD94` → `0x80D94` | direct | `ff8_opengl.cpp:259` : `{ 0x655371, 0xD94, 0x80D94, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x655418` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:301` : `{ 0x655418, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x655563` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:302` : `{ 0x655563, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6555f7` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:303` : `{ 0x6555F7, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x655627` | `0x42E54` → `0x4D5E8` | direct | `ff8_opengl.cpp:304` : `{ 0x655627, 0x42E54, 0x4D5E8, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x655829` | `0x4BBC4` → `0x56358` | direct | `ff8_opengl.cpp:305` : `{ 0x655829, 0x4BBC4, 0x56358, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6560bf` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:306` : `{ 0x6560BF, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x656148` | `0x42620` → `0x4CDB4` | direct | `ff8_opengl.cpp:307` : `{ 0x656148, 0x42620, 0x4CDB4, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_659730`** — `0x659730` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x659784` | `0x397CC` → `0x43F60` | direct | `ff8_opengl.cpp:308` : `{ 0x659784, 0x397CC, 0x43F60, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6597ef` | `0x3505C` → `0x3F7F0` | direct | `ff8_opengl.cpp:309` : `{ 0x6597EF, 0x3505C, 0x3F7F0, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x659822` | `0x35F7C` → `0x40710` | direct | `ff8_opengl.cpp:310` : `{ 0x659822, 0x35F7C, 0x40710, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_116Quezacotl_SequenceTaskDriver`** — `0x6c3760` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 2 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6c3773` | `0x2E50` → `0xA0000` | direct | `ff8_opengl.cpp:311` : `{ 0x6C3773, 0x2E50, 0xA0000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c378d` | `0x15E50` → `0x80000` | direct | `ff8_opengl.cpp:312` : `{ 0x6C378D, 0x15E50, 0x80000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_116Quezacotl_ChargeTimelineTask`** — `0x6c3940` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 6 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6c3ce2` | `0x3C25C` → `0x4425C` | direct | `ff8_opengl.cpp:314` : `{ 0x6C3CE2, 0x3C25C, 0x4425C, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c3d17` | `0x3C27C` → `0x4427C` | direct | `ff8_opengl.cpp:315` : `{ 0x6C3D17, 0x3C27C, 0x4427C, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c3d27` | `0x3BA5C` → `0x43A5C` | direct | `ff8_opengl.cpp:316` : `{ 0x6C3D27, 0x3BA5C, 0x43A5C, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c3d43` | `0x3C27C` → `0x4427C` | direct | `ff8_opengl.cpp:317` : `{ 0x6C3D43, 0x3C27C, 0x4427C, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c3d61` | `0x3F200` → `0xFF200` | direct | `ff8_opengl.cpp:318` : `{ 0x6C3D61, 0x3F200, 0xFF200, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c51c6` | `0x2E50` → `0x80000` | direct | `ff8_opengl.cpp:313` : `{ 0x6C51C6, 0x2E50, 0x80000, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_6C7690`** — `0x6c7690` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 2 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6c769b` | `0x40200` → `0x48200` | direct | `ff8_opengl.cpp:319` : `{ 0x6C769B, 0x40200, 0x48200, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c76b2` | `0x43A00` → `0x4BA00` | direct | `ff8_opengl.cpp:320` : `{ 0x6C76B2, 0x43A00, 0x4BA00, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_6C7790`** — `0x6c7790` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 4 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6c779a` | `0x43A00` → `0x4BA00` | direct | `ff8_opengl.cpp:321` : `{ 0x6C779A, 0x43A00, 0x4BA00, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c77a4` | `0x43A00` → `0x4BA00` | direct | `ff8_opengl.cpp:322` : `{ 0x6C77A4, 0x43A00, 0x4BA00, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c77ad` | `0x40200` → `0x48200` | direct | `ff8_opengl.cpp:323` : `{ 0x6C77AD, 0x40200, 0x48200, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c77b4` | `0x40200` → `0x48200` | direct | `ff8_opengl.cpp:324` : `{ 0x6C77B4, 0x40200, 0x48200, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_6C7800`** — `0x6c7800` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 2 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6c78ec` | `0x43A00` → `0x4BA00` | direct | `ff8_opengl.cpp:325` : `{ 0x6C78EC, 0x43A00, 0x4BA00, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c796a` | `0x43A00` → `0x4BA00` | direct | `ff8_opengl.cpp:326` : `{ 0x6C796A, 0x43A00, 0x4BA00, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_6C7CC0`** — `0x6c7cc0` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 2 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6c7ccb` | `0x3CA02` → `0xFCA02` | direct | `ff8_opengl.cpp:327` : `{ 0x6C7CCB, 0x3CA02, 0xFCA02, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c7ce2` | `0x3F1FC` → `0xFF1FC` | direct | `ff8_opengl.cpp:328` : `{ 0x6C7CE2, 0x3F1FC, 0xFF1FC, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_6C7E30`** — `0x6c7e30` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 3 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6c7e38` | `0x3F1FC` → `0xFF1FC` | direct | `ff8_opengl.cpp:329` : `{ 0x6C7E38, 0x3F1FC, 0xFF1FC, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c7e42` | `0x3F1FC` → `0xFF1FC` | direct | `ff8_opengl.cpp:330` : `{ 0x6C7E42, 0x3F1FC, 0xFF1FC, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c7e4e` | `0x3C9FC` → `0xFC9FC` | direct | `ff8_opengl.cpp:331` : `{ 0x6C7E4E, 0x3C9FC, 0xFC9FC, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `sub_6C8850`** — `0x6c8850` — **hôte NON couvert** par un livrable — statut : ledger: non_investigated_static — 4 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6c8b55` | `0x3C25E` → `0x4425E` | direct | `ff8_opengl.cpp:333` : `{ 0x6C8B55, 0x3C25E, 0x4425E, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c8bb5` | `0x3C27A` → `0x4427A` | direct | `ff8_opengl.cpp:334` : `{ 0x6C8BB5, 0x3C27A, 0x4427A, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c8bf6` | `0x3C25C` → `0x4425C` | direct | `ff8_opengl.cpp:335` : `{ 0x6C8BF6, 0x3C25C, 0x4425C, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6c8c26` | `0x3C27C` → `0x4427C` | direct | `ff8_opengl.cpp:336` : `{ 0x6C8C26, 0x3C27C, 0x4427C, ff8_battle_effect_layout_patch_mode::direct },` |

**Groupe `GF_291Pandemona_SequenceTick`** — `0x6ed350` — hôte déjà couvert par un livrable decomp re-ff8 — statut : ledger: table_named_unverified — 2 site(s)

| EA (site) | classic → remastered | mode | Extrait FFNx (ligne exacte) |
|---|---|---|---|
| `0x6ed367` | `0x71D4` → `0xA0000` | direct | `ff8_opengl.cpp:337` : `{ 0x6ED367, 0x71D4, 0xA0000, ff8_battle_effect_layout_patch_mode::direct },` |
| `0x6ed37d` | `0x151D4` → `0x80000` | direct | `ff8_opengl.cpp:338` : `{ 0x6ED37D, 0x151D4, 0x80000, ff8_battle_effect_layout_patch_mode::direct },` |

### 2.B — EAs hors table patch (empreintes de version, entry point, worldmap)

| EA | Sémantique FFNx (extrait ±2 lignes + inférence) | Zone du binaire | Statut candidat |
|---|---|---|---|
| `0x401004` | `common.cpp:2792-2793` : `uint32_t version_check1 = version_check(0x401004);` / `version_check2 = version_check(0x401404);` — `version_check(offset)` lit `*(uint32_t*)offset` (empreinte de build) | CRT startup — 0x401004 ∈ `GetSingletonAddress` (0x401000) | Confirmé IDB : dword = `0x3885048D` **✓**. Ancre fingerprint version (launcher/hash-guard) |
| `0x401404` | même extrait (`common.cpp:2793`) — discriminant US vs US_NV | CRT startup — 0x401404 ∈ `sub_401200` | Confirmé IDB : dword = `0x1597C8` → **notre binaire = VERSION_FF8_12_US_NV** |
| `0x401010` | `common.cpp:2879-2881` : `uint32_t version_check3 = version_check(0x401010);` `if (version_check3 == 0x24AC)` → JP vs JP_NV | CRT startup — 0x401010 = `nullsub_960_unused` (début de fonction) | Confirmé IDB : dword = `0x909090C3` ≠ `0x24AC` **✓** (pas JP) |
| `0x55ADB7` | `common.cpp:3287` : `case VERSION_FF8_12_US_NV: ff8_externals.start = 0x55ADB7;` — `start` = **point d'entrée process** (`ff8_data.cpp:43` : `winmain = get_relative_call(start, 0xDB)` ; `common.cpp:3387` : `replace_function(getProcessEntryPoint(), (void*)ff8_externals.start)` sous macOS) | Point d'entrée process (0x55ADB7 — fonction non définie dans l'IDB) | Bytes IDB : `55 8B EC 6A FF` = prologue CRT **✓**. Ancre bootstrap haute valeur |
| `0x54A0D0` | `ff8_data.cpp:870` : `ff8_externals.sub_54A0D0 = 0x54A0D0;` (chaîne worldmap `worldmap_with_fog_sub_53FAC0` → `sub_545EA0`/`sub_545F10`/`sub_546100` → `sub_54A0D0`) ; usage `ff8_opengl.cpp:2155` : `patch_code_byte(ff8_externals.sub_54A0D0 + 0x151, 0x6E);` (bloc savefix FR) | Worldmap (voisin du trigger `battle_trigger_worldmap = sub_53FAC0 + 0x4EA`) | `sub_54A0D0` présent dans l'IDB (`push ebp`), absent du ledger → candidat nommage (save/worldmap, hors battle) |

---

## Tableau 3 — EAs non résolus / ambigus (constantes non-EA, EAs d'autres builds)

Ces valeurs correspondent au pattern mais **ne sont pas des ancrages code de notre binaire** :
offsets dans l'arène d'effets Remastered (3e champ de la table), flag de bits, et `start` d'autres
variantes de build. Les collisions avec des fonctions de notre IDB sont purement numériques.

| EA | Rôle FFNx réel | Extrait FFNx (ligne exacte) | Collision IDB (coïncidence numérique) |
|---|---|---|---|
| `0x400000` | flag bit (`flags \|= 0x400000`, remaster.cpp) **et** offset arène (3e champ effect_arena) | `remaster.cpp:302,306` : `flags \|= 0x400000;` ; `ff8_opengl.cpp:341-342,355,359,366,368` (3e champ) | image base du binaire (0x400000) |
| `0x400010` | offset arène (3e champ) | `ff8_opengl.cpp:358` : `{ 0x8D6ADA, 0x278C628, 0x400010, ::effect_arena }` | — (aucune fonction) |
| `0x400170` | offset arène | `ff8_opengl.cpp:361,367,376` | — (aucune fonction) |
| `0x400180` | offset arène | `ff8_opengl.cpp:360` | — (aucune fonction) |
| `0x402580` | offset arène | `ff8_opengl.cpp:369,371,379` | ∈ `World_UpdateCamera` (0x4023D0) |
| `0x402636` | offset arène | `ff8_opengl.cpp:370` | ∈ `sub_402620` |
| `0x403000` | offset arène | `ff8_opengl.cpp:357,364` | ∈ `sub_402F90` |
| `0x403004` | offset arène | `ff8_opengl.cpp:356,362` | ∈ `sub_402F90` |
| `0x403010` | offset arène | `ff8_opengl.cpp:363,365,372-375,377,380` | = début `ddrawerrorhandler` (ledger nommé) |
| `0x403014` | offset arène | `ff8_opengl.cpp:378` | ∈ `ddrawerrorhandler` |
| `0x420000` | offset arène | `ff8_opengl.cpp:354` | ∈ `sub_41FACF` |
| `0x55ab87` | `start` de **FF8 1.2 US (Eidos Patch)** (autre variante du binaire, pas la nôtre) | `common.cpp:3314` : `ff8_externals.start = 0x55AB87;` | ∈ sub_55AA40 |
| `0x55ac07` | `start` de **FF8 1.2 US** (autre variante du binaire, pas la nôtre) | `common.cpp:3284` : `ff8_externals.start = 0x55AC07;` | ∈ chunk 0x55ABD0 (zone CRT / `_sprintf`) |
| `0x55ad37` | `start` de **FF8 1.2 US (Eidos) (Nvidia)** (autre variante du binaire, pas la nôtre) | `common.cpp:3317` : `ff8_externals.start = 0x55AD37;` | ∈ __alloca_probe (0x55AD10) |
| `0x55b137` | `start` de **FF8 1.2 FR** (autre variante du binaire, pas la nôtre) | `common.cpp:3290` : `ff8_externals.start = 0x55B137;` | — (hors fonction définie) |
| `0x55b1b7` | `start` de **FF8 1.2 IT** (autre variante du binaire, pas la nôtre) | `common.cpp:3308` : `ff8_externals.start = 0x55B1B7;` | ∈ sub_55B13D |
| `0x55b227` | `start` de **FF8 1.2 SP** (autre variante du binaire, pas la nôtre) | `common.cpp:3302` : `ff8_externals.start = 0x55B227;` | ∈ sub_55B20D |
| `0x55b237` | `start` de **FF8 1.2 DE** (autre variante du binaire, pas la nôtre) | `common.cpp:3296` : `ff8_externals.start = 0x55B237;` | ∈ sub_55B20D |
| `0x55b2e7` | `start` de **FF8 1.2 FR (Nvidia)** (autre variante du binaire, pas la nôtre) | `common.cpp:3293` : `ff8_externals.start = 0x55B2E7;` | ∈ __getdcwd_lk (0x55B2D1) |
| `0x55b367` | `start` de **FF8 1.2 IT (Nvidia)** (autre variante du binaire, pas la nôtre) | `common.cpp:3311` : `ff8_externals.start = 0x55B367;` | ∈ __getdcwd_lk (0x55B2D1) |
| `0x55b3d7` | `start` de **FF8 1.2 SP (Nvidia)** (autre variante du binaire, pas la nôtre) | `common.cpp:3305` : `ff8_externals.start = 0x55B3D7;` | ∈ __validdrive (0x55B3A6) |
| `0x55b3e7` | `start` de **FF8 1.2 DE (Nvidia)** (autre variante du binaire, pas la nôtre) | `common.cpp:3299` : `ff8_externals.start = 0x55B3E7;` | ∈ _free (0x55B3DD) |
| `0x55f487` | `start` de **FF8 1.2 JP** (autre variante du binaire, pas la nôtre) | `common.cpp:3320` : `ff8_externals.start = 0x55F487;` | ∈ __input (0x55EBC5) |
| `0x55f6e7` | `start` de **FF8 1.2 JP (Nvidia)** (autre variante du binaire, pas la nôtre) | `common.cpp:3323` : `ff8_externals.start = 0x55F6E7;` | ∈ __openfile (0x55F676) |

**Exclusions de troncature (ni EA ni constante utile au crosswalk)** : `0x4000000`/`0x5000000` (codes de paquet
GPU PSX écrits dans `draw_infos->field_0`, `ff8_opengl.cpp:1223/1152`), `0x64000000` (masque OR du champ
`field_8`, `ff8_opengl.cpp:1156`), `0x40000000` (index de palette saveload, `common.cpp:1983`),
`0x58C2B4D0…` (GUID du synthé MIDI Microsoft, `common.cpp:3580`).

---

## Conclusions

### Ratio connu / nouveau

- **Connus** : 3/193 (1,6 %) — `0x403D99` (livrable decomp), `0x5083A9` + `0x5083AA` (call site couvert par
  l'edge du graph ledger dans `BdLinkTask_Register`/0x508360, lui-même livré).
- **Nouveaux sémantisés** : 166/193 (86,0 %) dont **161 ancrages d'instruction du patch layout effets**, tous
  byte-validés dans notre IDB, plus les 5 EAs hors table (empreintes version, entry point, worldmap).
- **Non-anchors** : 24/193 (12,4 %) — offsets arène (11), `start` d'autres builds (13).

### Les 10 EAs/groupes nouveaux les plus intéressants pour la campagne battle

1. **`0x6545F0 GF_Diablo_SummonScript_FrameTick` — 56 sites ancrés (0x654661…0x656148)** : le plus dense
   ancrage de tout le crosswalk ; la fonction est déjà livrée en decomp, les 56 sites (offsets `0xD94`,
   `0x31B5C`…`0x51D40`) cartographient **où** la FrameTick écrit ses offsets VRAM — sémantique de stepper
   d'effets Diablo complète, et recalage direct de notre decomp.
2. **`MAG_327/328/329/330_GILGAMESH_*` (0x58D760/0x58D930/0x58DB10/0x58DCF0) — 12 sites, 4 fonctions** :
   zone **0x58Dxxx jamais explorée** par nos campagnes (ledger table_named_unverified, pas de livrable).
   FFNx y prouve 4 hardcodes VRAM par attaque Gilgamesh (Excalipoor/Excalibur/Zantetsuken/Masamune) —
   candidats de nommage+décomp immédiats, famille MAG complète (326→330).
3. **`0x5926A2` (dans `sub_592300`)** — **l'unique site `effect_arena_push`** : instruction
   `mov eax, [0x2200FB8]` (confirmée IDB) — révèle le **global 0x2200FB8 = pointeur d'arène d'effets** du
   binaire classic. Sémantique structurale de premier ordre pour le modèle mémoire des effets.
4. **`sub_62A9C0` (6 sites, 0x62AA6C…0x62ADE8)** — runner de script d'effets collé à `MAG_326_BDLINK_RET`,
   ledger non_investigated_static : voisin direct d'un MAG livré, candidat de décomp pour boucler la famille.
5. **`sub_6328A0` (6 sites, 0x632950…0x632B1A)** + **`sub_6474C0` (4 sites)** — runners voisins de
   `MAG_218_UNK11` et `GF_187Odin_InvokeSummonScript` ; même schéma (offsets VRAM `0x11000`/`0x14000`),
   candidats de la même grappe.
6. **Cluster runners Quezacotl/Pandemona (`sub_6C7690/6C7790/6C7800/6C7CC0/6C7E30/6C8850`, 17 sites,
   0x6C769B…0x6C8C26)** — grappe non couverte autour de `GF_116Quezacotl_*` ; inclut l'anomalie de
   boundaries `0x6C83F5` (code non englobé) à résoudre.
7. **`GF_185Shiva` famille complète (0x5C0D50 Invoke + 0x5C0F30 ChargeTimelineTask + 0x5C7F50 SequenceTick —
   11 sites)** — la chaîne summon Shiva est déjà livrée : les sites recalent nos decomps (offsets `0x10000`,
   `0x18000`, `0x20000`…) ; les runners voisins `sub_5C7570`/`sub_5C77C0` (5 sites) restent à couvrir.
8. **`0x54A0D0` (`sub_54A0D0`, worldmap)** — funcptr FFNx dans la chaîne du trigger de combat worldmap
   (`worldmap_with_fog_sub_53FAC0 + 0x4EA`) + bloc savefix ; relie worldmap et battle-trigger — candidat
   nommage prioritaire hors battle.
9. **`0x401004` / `0x401404` / `0x401010` (empreintes CRT)** — dwords de fingerprint version **confirmés** dans
   notre IDB ; l'ancre `0x401004 = 0x3885048D` est un sanity-check indépendant du hash pour toute future
   campagne live (détection de build sans hash).
10. **`0x55ADB7` (entry point process)** — bytes `55 8B EC 6A FF` confirmés ; ancre bootstrap (entry →
    `winmain` via rel-call à +0xDB) pour documenter le démarrage du binaire.

### Zones du binaire éclairées

- **0x401000–0x401404** : startup CRT / empreintes de version (3 ancrages) — zone jamais touchée par nos campagnes.
- **0x55ADB7** : point d'entrée process (bootstrap).
- **0x54A0D0** : worldmap (chaîne trigger de combat + save).
- **0x58D760–0x58DCF0** : **Gilgamesh MAG_327–330** — zone entièrement neuve (4 fonctions, 12 sites).
- **0x592300–0x596750** : runners d'effets voisinage Cactuar/Shiva (4 fonctions, 5 sites) — non couvertes.
- **0x5A8750–0x5C7F74** : Cactuar + Shiva (hôtes couverts + 2 runners non couverts).
- **0x62A7E0–0x632B1A** : `MAG_326_BDLINK_RET`, `MAG_218_UNK11` + 2 runners (couverts + non couverts).
- **0x63E730–0x647705** : Doomtrain + Odin (invoke/task-driver + 2 runners).
- **0x6545F0–0x656148** : **Diablo FrameTick — cluster d'ancrage le plus dense (56 sites)**.
- **0x659730** : runner voisin Diablo, non couvert.
- **0x6C3760–0x6C8850** : Quezacotl + 6 runners (dont l'anomalie 0x6C83F5).
- **0x6ED350** : Pandemona SequenceTick (couvert).

### Bilan

FFNx couvre quasi exclusivement **la chaîne d'effets de combat** (loaders TIM + steppers MAG_/GF_) et **le
bootstrap** du binaire : c'est un don de sémantique pour nos campagnes. Répartition des 161 sites : 103 dans des
hôtes déjà couverts par un livrable decomp, 58 hors couverture (12 dans les 4 `MAG_327–330_GILGAMESH_*`,
45 dans 15 runners non couverts, + 1 site orphelin `0x6C83F5`). Priorité opérationnelle :
(1) corriger la boundaries IDB autour de `0x6C83F5` ; (2) décompiler/nommer les 4 `MAG_327–330_GILGAMESH_*`
(zone 0x58Dxxx) ; (3) décompiler les 15 runners non couverts (`sub_592300`, `sub_595EE0`, `sub_596710`,
`sub_5C7570`, `sub_5C77C0`, `sub_62A9C0`, `sub_6328A0`, `sub_6474C0`, `sub_659730`, `sub_6C7690`,
`sub_6C7790`, `sub_6C7800`, `sub_6C7CC0`, `sub_6C7E30`, `sub_6C8850`) — 45 sites ancrés cumulés ;
(4) enregistrer le global `0x2200FB8` (pointeur arène effets) dans le registre des data anchors.
