---
title: G11–G20 Static Uncertainty Red-Team Audit
category: references
tags: [ff8, battle-system, reverse-engineering, testing, reference]
aliases: [G11 G20 red-team audit, static uncertainty audit]
sources:
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - IDA IDB D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/62057468-455d-4d21-857f-18d8e039ff06/62057468-455d-4d21-857f-18d8e039ff06.jsonl
summary: Independent red-team audit of the 2026-08-18 G11–G20 static campaign. Not a live promotion. G12 player consume path is misidentified; G11 0.88 is too high; accept-as-draft.
provenance:
  extracted: 0.78
  inferred: 0.14
  ambiguous: 0.08
created: 2026-08-18T13:29:14+02:00
updated: 2026-08-18T13:44:22+02:00
---

# G11–G20 Static Uncertainty Red-Team Audit

Audit indépendant de la campagne statique du 2026-08-18. Les pages, le ledger, les renames et les commentaires IDB de cette campagne sont des **objets à auditer**, pas des preuves. Aucune promotion `Gxx.satisfied`. Aucune mutation IDB ni correction canonique pendant cet audit.

Autorité EXE: SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, image base `0x400000`, IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe.i64`, input `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`.

Compagnons audités (non corroborants entre eux): [[projects/re-ff8/references/g11-g20-static-readiness-ledger]], [[projects/re-ff8/references/g11-g20-static-open-questions]].

> [!danger] Verdict
> **`accept-as-draft`**. Pas `accept-for-offline-implementation` (U12.7 consume joueur non identifié; `kernel.bin` absent; G11 0.88 trop haut). Pas `accept-as-canonical`. Pas `reject` (une grande partie du graphe G11/G13/G15 est recoupée en `RAW_IDB`/`XREF` aujourd'hui).

## 1. Intégrité de campagne

Heure réelle de début d'audit (système): `2026-08-18T13:29:14+02:00` (`Get-Date -Format o` → `2026-08-18T13:29:14.0470982+02:00`).

### Outillage

| Outil | Résultat |
| --- | --- |
| RTK | `rtk=pass` — `0.42.4`, hook `preToolUse` → `rtk hook cursor` (matcher Shell) présent dans `%USERPROFILE%\.cursor\hooks.json`. Non répété ensuite. |
| QMD | CLI `qmd 2.5.2`, collection `ff8-wiki` (97 fichiers au début d'audit). **Pas de serveur MCP QMD** dans Cursor; fallback CLI uniquement. `qmd=pending` jusqu'au checkpoint ci-dessous. |
| Context Mode | `tooling_degraded=context-mode` pour l'inventaire PowerShell (le sandbox a exécuté bash). Contour: Shell natif + `py_eval` IDA. |
| IDA MCP | `user-ida-pro-mcp` prêt. Image base `0x400000`. Hash EXE **identique** au ledger. Hex-Rays OK. Lookup par nom `domain::` fonctionne; les adresses restent la racine. |

### Baseline implémentation

HEAD `FinalFantasy_VIII_Reimaginated` = `f959679bd2536648acad57321ecbd276965ab9be` (`2026-08-15 17:13:38 +0200`, « Add G10 status mechanics… »). **Aucune dérive** vs le ledger.

`kernel.bin` **absent** du dépôt, du dossier Steam FF8, et de `D:\Modding\ff8` sous ce nom. Un `kernel_bin_data.json` existe sous `D:\Modding\ff8\FF8GameData\Resources\json\` — **non utilisé** ici (authenticité vs `kernel.bin` non hashée). Claims de valeurs de table: `offline-resource-required`, plafond 0.79.

### Transcript et fichiers

Transcript: `62057468-455d-4d21-857f-18d8e039ff06.jsonl` (100 185 octets, 39 lignes JSONL, **aucun champ `timestamp` interne**).

| Horloge | Valeur |
| --- | --- |
| `ctime` transcript | `2026-08-18T09:57:39` |
| `mtime` transcript | `2026-08-18T10:28:56` |
| Writes vault campagne | `10:09:16`–`10:27:40` |
| `log.md` (lint préalable) | `10:40:42` |
| Frontmatter/log campagne | `created: 10:15:00`, `updated`/`STATIC_CHECKPOINT` **`12:00:00`** |

La campagne a duré ~31 minutes (09:57–10:28), pas deux heures. Ce n'est **pas** un défaut de preuve par principe. Le défaut est l'horodatage `12:00` recopié dans ledger, questions, index (`Last updated: 2026-08-18T12:00:00+02:00`), et `QMD_COMPILE` alors que les fichiers étaient déjà écrits vers 10:28. Le lint 10:40:23 est **postérieur** aux writes et **antérieur** à `12:00` affiché — le log n'est pas chronologique.

### Tool calls du transcript (familles)

Total 139 tool uses. Pas de timestamps internes; familles:

| Famille | n |
| --- | --- |
| StrReplace | 39 |
| Read | 36 |
| CallMcpTool | 35 |
| Grep | 13 |
| GetMcpTools | 10 |
| Glob / TodoWrite / Shell | 2 / 2 / 2 |

IDA dans ces 35 MCP: `py_eval` 17, `decompile` 9, `xrefs_to` 3, `lookup_funcs` 3, `set_comments` 2, `rename` 2, `find` 2, `read_struct` 2, `callees` 1. Context Mode: 4. **Aucune** attache `FF8_EN.exe` dans le transcript.

### Annotations IDA de la campagne (objets, pas preuves)

`ida_updates=15` du ledger est **comptable**: 11 commentaires `set_comments` + 4 `rename`. Pas 15 preuves indépendantes. Le commentaire à `0x484FD0` affirme `command_id=0x06` plus fermement que SQ-G13-001 (alerte 4).

### Compte SQ

Registre réel: **18** entrées — 12 `open`, 5 `live-required`, 1 `resolved`. Le checkpoint campagne `open_questions=16` est **faux**. Le lint 10:40 disait `question_records=18 non_resolved=17` (juste). Le résumé « 16 questions ouvertes » mélange `open` et `live-required`.

### Alertes initiales

| # | Alerte | Verdict d'audit |
| --- | --- | --- |
| 1 | 09:57/10:28 vs checkpoint 12:00 | **Confirmée.** Horodatage documentaire non reproductible. Ne disqualifie pas les bytes. |
| 2 | 16 vs 18 SQ | **Confirmée.** 12+5+1=18. |
| 3 | Group Routing confond switch `0x484838` et `COMMAND_TYPE_ID` | **Confirmée.** Le switch est `pending_triplet_base[v2].command_id` (`mov al, [ebx+esi*8+3]`). `COMMAND_TYPE_ID` est le global du resolver. |
| 4 | Commentaire `0x484FD0` trop ferme sur `0x06` | **Confirmée.** Bytes: copie de `a2`. Pas d'immédiat 6 dans QueueOrStore. |
| 5 | Deux titres `Open Questions` | **Confirmée.** [[projects/re-ff8/concepts/battle-lifecycle]] L225 et L229. |
| 6 | G11–G13 sans read/write/ownership | **Confirmée** dans les pages canoniques. Tables d'audit §4 ci-dessous (rapport seulement). |
| 7 | G16–G20 fausse implémentabilité | **Nuancée.** Scores `mapped` 0.42–0.62 sont honnêtes; G15 0.85 et G18 U18.2 « group 1 » / fixture jalon `command_id=0x06` sur-déclarent. |

### Checkpoints de cet audit

Remplis au fil des compilations QMD. Heures copiées de `Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"`; jamais arrondies.

| CP | Portée | Heure | qmd |
| --- | --- | --- | --- |
| 1 | Intégrité + 18 SQ | `2026-08-18T13:41:41+02:00` | `pass` — `qmd update` indexed_new=1 updated=2; embed 56 chunks / 3 docs; smokes: rapport en tête `search accept-as-draft`; contradiction `target_mask 0x4000` retourne SQ+ledger **et** ce rapport |
| 2 | G11–G14 profond | `2026-08-18T13:43:14+02:00` | `pass` — indexed_updated=2; embed 49 chunks / 2 docs; smokes: `refuted FindByCondition` → ce rapport; `static-strong` → ledger puis ce rapport |
| 3 | G15–G20 + verdict | `2026-08-18T13:44:22+02:00` | `pass` — indexed_updated=2; embed 49 chunks / 2 docs; smokes: `accept-as-draft` → ce rapport puis index; `GF group 1 pending 0x03` → layouts+audit+pipeline+ledger |

## 2. Matrice de claims

Indépendance: `SAME_CAMPAIGN_DOC` ne compte jamais comme seconde preuve. Commentaires IDA du 2026-08-18 = `SAME_CAMPAIGN_DOC`.

Confiance: +0.30 bytes/branches, +0.20 xrefs, +0.15 types/bounds, +0.15 table/2e chemin, +0.10 ordre mutations/RNG, +0.10 pas de cadence. Plafonds du prompt appliqués.

| Claim ID | Gate/unit | Claim exact | Source actuelle | Vérification fraîche | Indépendance | Verdict | Confiance avant→après | Impact |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| CA-G11-001 | U11.1 | `K_MAGIC` @ `0x1CF4064`, stride `0x3C`, 57 rows via distance à `K_GF_JUNCTIONABLE` `0x1CF4DC0` | ledger U11.1 | Distance `0xD5C=57*60` recoupée. Type IDA `[57]` = campagne. Pas de check `<57` à l'index `uint16`. BSS non initialisée. | RAW_IDB, TYPE | confirmed-static-with-cap | 0.92→0.74 | Plafond 0.79 sur les **valeurs**; layout OK pour coder le reader si OOB fail-closed. |
| CA-G11-002 | U11.1 | Resolver Magic `{2,6,16,247}` charge element/enabler/statuses; **pas** `HIT_ATTACK_HITPERCENT` (reste `-1`/`0xFF`) | ledger, damage-status-pipeline | Reset `HIT_ATTACK_HITPERCENT=-1` puis case 2/6/16/247 sans écriture HITPERCENT. Item 4/13 **écrit** `attackParam`. | RAW_IDB | confirmed-static | 0.88→0.85 | Bloque la vieille note « magic always rolls accuracy ». |
| CA-G11-003 | U11.3/5 | `ATTACK_TYPE_MAGIC_ATTACK` → UNMISSABLE; `level % HITPERCENT` seulement `MAGIC_DAMAGE` / `LV_ATTACK` | SQ-G11-005 | Dispatcher case 2 → UNMISSABLE; case 26 (`LV_ATTACK`) → `MAGIC_DAMAGE`. Helper: `% HITPERCENT` uniquement dans ce case, puis `LABEL_21` formule. | RAW_IDB, XREF | confirmed-static | 0.88→0.86 | Quelles rows kernel sont `LV_ATTACK` reste SQ-G11-004. |
| CA-G11-004 | U11.4 | Formule MAG/SPR + `slot>=3 >>=1` + Shell si `(ATTACK_FLAG&3)==1` | battle-formulas + ledger | Recoupé dans `ComputeMagicAndGFDamage` LABEL_21/24. | RAW_IDB, OLDER_DOC | confirmed-static | 0.92→0.88 | G09/G10 déjà vivaient le commit; pas une nouvelle formule. |
| CA-G11-005 | U11.2 | Stock 32×5, cap 100, remove clear+rebuild, add full→1 | U11.2 | `BattleMagic_MutateStock` `0x486A10` conforme. Xrefs: PrepareTurn×2, GetText, StatusResult. | RAW_IDB, XREF, TYPE | confirmed-static | 0.86→0.86 | Suffisant pour un writer battle-local. |
| CA-G11-006 | U11.2 | Import SG→`F_CHARACTER_MAGIC_DATA` à l'init | SQ-G11-003 | Xrefs du label: MutateStock, GetText, `sub_4C8820` (getter `return &F_CHARACTER_MAGIC_DATA[464*a1]`, caller menu). **Pas** de memcpy d'init. | XREF | unsupported | 0.40→0.35 | Bloque le round-trip save; un test peut seeder le working copy. |
| CA-G11-007 | U11.2 | Persist seulement via `CopyMagicStocksToSave` au cleanup | U11.8 | Fonction `0x486CD0` copie 32 paires vers SG et nettoie junctions. Callers cleanup déjà listés. | RAW_IDB, XREF | confirmed-static | 0.86→0.82 | Pas d'écriture SG mid-battle sur ce chemin. |
| CA-G11-008 | U11.8 | GetText party: stock manquant ou Silence → `BOOL_LAST_COMMAND_FAILED`, pas de consume | U11.8 | Scan 32 ids; Silence `status_1&0x10`; rewrite fail family. Ennemis skip le scan. | RAW_IDB | confirmed-static | 0.84→0.84 | Rollback = never-subtract, vrai pour Magic. |
| CA-G11-009 | U11.8 | Consume `MutateStock(remove=1)` depuis PrepareTurn, skip Angel Wing / fail / Dual-Triple bits | U11.8 SQ-G11-001 | Angel Wing `status_2&0x02000000` skip. Consume si `COMMAND_TYPE_ID==MAGIC` et last pass. Bits `CHARA_ABILITIES&0x20` si launches==2; second bit Hex-Rays `MOVE_HP_UP` si launches==3 — **noms non prouvés**. Launches 2/3 viennent de `status_2` Double `0x20000` / Triple `0x40000`. | RAW_IDB | confirmed-static-with-cap | 0.84→0.68 | Single-cast Magic codeable; Dual/Triple exact **pas**. |
| CA-G11-010 | U11.6 | Cure type 7: `power*spread*((power+mag)/2)/256`; type 8 helper « unused » | SQ-G11-006 | Type 7: `push 7` case 3. Type 8: **`push 8` jumptable case 21** (`ATTACK_TYPE_UNKNOWN_1`) puis `jmp loc_492397`. Un seul CALL, deux immediates. Claim « dispatcher only passes 7 » **faux**. | RAW_IDB | refuted (partie unused) | 0.55→0.80 | Quelle row kernel a `attackType==21` reste offline. |
| CA-G11-011 | U11.7 | Med Data ×2 seulement Item/`0x0D`, party, `CHARA_ABILITIES&2`; Magic Life `max_hp/8` | SQ-G11-007 | Bytes: `cmp bl,4` / `cmp bl,0Dh` / `cmp edi,3` / `test CHARA_ABILITIES,2` puis `sar 2`. Hex-Rays « Mug\|Attack » = affichage de 13. | RAW_IDB, TYPE | confirmed-static | 0.92→0.90 | G11 Life sans Med Data est fermé. |
| CA-G11-012 | U11.2 | Blow-away `byte_1D28E11==2` → MutateStock loop | U11.2 | Xref StatusResult `0x493EE7` existe. Writer de `magic_to_blow_away` vs ce triple **pas** recoupé ici. | XREF, INFERENCE | unsupported | 0.50→0.45 | Hors chemin Fire/Cure. |
| CA-G12-001 | U12.1 | `K_ITEM` stride `0x18`, 33 rows jusqu'à `K_NON_BATTLE_ITEM` `0x1CF7A90` | U12.1 | Distance `0x318=33*24`. `cmp eax,21h` à `0x48C704`. | RAW_IDB, TYPE | confirmed-static-with-cap | 0.86→0.78 | Valeurs kernel plafonnées 0.79. |
| CA-G12-002 | U12.2 | Import `id!=0 && id<0x21` dans EQUAL via index `SG_ANGELO_POINTS[id+7]` | U12.2 | `BS_ParseItems` conforme. Nom de l'index **suspect** (même campagne). | RAW_IDB | confirmed-static-with-cap | 0.84→0.76 | Table d'index à nommer hors Hex-Rays. |
| CA-G12-003 | U12.1 | Resolver Item: `ATTACK_FLAG=unknown2`, anim=`attackFlags`, HITPERCENT=`attackParam` | SQ-G12-002 | Second switch cases 4/13: `unknown2` → ATTACK_FLAG; `attackFlags` → anim. Contrast Magic `attackFlags` → ATTACK_FLAG. | RAW_IDB | confirmed-static | 0.80→0.82 | Swap de **noms** Hex-Rays, pas de layout. |
| CA-G12-004 | U12.7 | Consume joueur = FindByCondition case 4 **quand `target_mask&0x4000`** | SQ-G12-001 | Unique caller FindByCondition = PrepareTurn `0x4858F7`. Gate: `WHEN_DOING!=0`, pas Angel Wing, pas Berserk, **`test dh,40h` sur `status_2`** = Confuse `0x4000`. `0x4000` masque cible est produit **dans** FindByCondition depuis `targetInfo&1`, pas le prédicat d'appel. GetText Item **ne consomme pas**. Autres `AdjustCount(remove=1)`: AI potion / DispatchSection. | RAW_IDB, XREF | refuted | 0.72→0.40 | **Bloque G12.** Chemin Potion confirmé introuvable dans ce graphe. |
| CA-G12-005 | U12.7 | Refund `AdjustCount(add)` depuis slot `+0xB8/+0xB9` | SQ-G12-004 | PrepareTurn / Berserk / ClearSlotQueue appellent `AdjustCount(id,0)` puis clear. QueueOrStore KO stash seulement `a2==4`. | RAW_IDB, XREF | confirmed-static-with-cap | 0.60→0.70 | Sans consume joueur, le refund ne clôt pas exactly-once. |
| CA-G12-006 | U12.4 | Curative item: HITPERCENT puis `50*power` (type 14), Med Data `(ATTACK_FLAG&3)==2`, Zombie flip | U12.4 | Helper `0x493450` (commentaire campagne = SAME). Dispatcher case 4 pousse 14. HITPERCENT roll en tête du helper: à recouper vs disasm si on code; accepté `confirmed-static-with-cap` (Hex-Rays + un caller). | RAW_IDB | confirmed-static-with-cap | 0.86→0.74 | Plafond Hex-Rays sans listing disasm du helper. |
| CA-G12-007 | U12.5 | Revive item partage `GetReviveHP`; Med Data **oui** pour cmd 4/13 | U12.5 | Même prédicat CA-G11-011. | RAW_IDB | confirmed-static | 0.88→0.88 | Phoenix Down-like si `attackType` REVIVE (kernel). |
| CA-G13-001 | U13.3 | Trois couches: pending menu-row, resolver 6, aux 9/10 | G13 roots | Resolver first+second switch case 6. `related==9` Cast scale `(rand8+10)/150`; `==10` damage 0. Pending byte = `v6=*command_row` via handler type 3, **pas** un immédiat 6. | RAW_IDB | confirmed-static-with-cap | 0.86→0.78 | Pending id reste live/offline table. |
| CA-G13-002 | U13.3 | QueueOrStore unique caller Draw menu; layout 8 bytes | U13.3 | XrefsTo `0x484FD0`: **1** (`0x4AF05F`). Writes attacker/cmd/arg/aux_5/aux_6/active/mask. KO: si `status_1&1` et `a2==4` stash item. | RAW_IDB, XREF | confirmed-static | 0.86→0.88 | Writer Draw ≠ `BattlePendingAction_Write`. |
| CA-G13-003 | SQ-G13-001 | Pending Draw `command_id` **est** `0x06` | commentaire IDA, jalon G13 | `OpenSelectedCommand` switch sur **`v2[1]&0x1F` (handler type)**. Case 3 = Draw submenu. `v6=*v2` = command_id de la row, passé à Open → `BYTE2(dword_1D768D8)`. `mov eax,6` @ `0x4ADF4E` = UI `dword_1D768D0`. Bytes **n'écrivent pas** 6 dans pending. | RAW_IDB | unsupported (candidate only) | 0.55→0.40 | Fixture jalon `command_id=0x06` = overclaim. |
| CA-G13-004 | U13.2 | Steal-count: `(rand8&0x1F)+1` puis formule clamp 0..9 | U13.2 | `getHowManyDraw` `0x48FD20` conforme, y compris amount=1 si id hors 4 slots. | RAW_IDB | confirmed-static | 0.88→0.86 | Un RNG avant Cast scale éventuellement second. |
| CA-G13-005 | U13.4/5 | Cast: Magic handoff sans MutateStock remove. Stock: GetText loop add | U13.4/5 | GetText Draw: Cast `param==9` steal≠0 puis metadata Magic. Stock `param==10` loop add jusqu'à fail/full. Resolver case 6 conforme. | RAW_IDB | confirmed-static | 0.84→0.84 | Full stock = MutateStock return 1 break. |
| CA-G13-006 | SQ-G13-002 | Source death n'est pas le stash `command_id==4` | SQ-G13-002 | QueueOrStore: seul `a2==4`. GetText Draw: `target status_1&1` **ou** caster Silence → fail. Mid-flight après GetText: live. | RAW_IDB | confirmed-static-with-cap | 0.30→0.62 | GetText-time KO source est fermé; lifetime restante live. |
| CA-G13-007 | U13.6 | Transfer `0x4847F0` route par **pending.command_id**; 6 et 3 sont default group 2; `0xFE` group 1; 4/13 group 2 | Group Routing | Jumptable: case 2 Magic g2; 4/13 Item g2; 16 Slot g1; 254 GF-resolve g1; **default inclut 1,3,6–10,12,23–253 → g2**. La page dit « par COMMAND_TYPE_ID » et « GF group 1 » pour pending `0x03`. | RAW_IDB | refuted (libellé) | 0.78→0.70 | GF pending `0x03` (LIVE_PRIOR table) irait en **group 2** à transfer. |
| CA-G14-001 | U14.5 | Dispatch `'p'/'q'/'t'` = 0x70/71/74 | U14.5 | Cases `'p'` → `BdLinkTask_1`; `'q'` → worker 71 return 8; `'t'` → worker 74 return 8. Unique xref Dispatch depuis Tick. | RAW_IDB, XREF | confirmed-static | 0.80→0.82 | Topologie. Cadence = live. |
| CA-G14-002 | U14.5 | Idle/busy frame-accurate 0x70 | SQ-G14-001 | Workers existent; `sub_508580` immediates ≠ horloge Director. G09 LIVE_PRIOR used 0x70 as signal, pas un runtime de remplacement. | RUNTIME_REQUIRED, LIVE_PRIOR | live-required | 0.40→0.40 | Ne pas inventer un idle runtime. |
| CA-G14-003 | U14.3/4 | Typed PresentationSignals / headless scheduler | U14.3/4 | **Absents de l'EXE.** Design replacement. | INFERENCE | out-of-scope-recognition | 0.60→0.50 | Ne pas coder comme contrat natif. |
| CA-G14-004 | U14.1/6 | LOCK/UNLOCK = action latch `TARGET_SLOT_ID+1`; distinct result latch | battle-lifecycle G14 | `0x4876D0` lock flag=0 latches=1; `0x4876B0` unlock flag=1 latches=0. Noms historiques `sub_497270` faux pour l'EA unlock. | RAW_IDB | confirmed-static | 0.70→0.72 | Ne pas fusionner avec `0x74`. |
| CA-G15-001 | U15.3 | VM stop = opcode 0 ou commit ciblé; pas de cap d'itération | SQ-G15-001, opcodes | Loop `0x487EBA`: `op=*esi++; test al; jz return`. JUMP `0x23` int16 signé. Switch 61 cases `op-1`. | RAW_IDB, OLDER_DOC | confirmed-static | 0.70→0.82 | Livelock = corpus/soak, pas un compteur natif. |
| CA-G16-001 | U16.4 | Spawn/remove codeables depuis les seuls noms d'opcodes | G16 table 0.62 | Reconnaissance. Pas de walker free-slot audité ici. | SAME_CAMPAIGN_DOC, OLDER_DOC | out-of-scope-recognition | 0.62→0.55 | Ne pas implémenter spawn. |
| CA-G17-001 | U17.3 | Cover trigger timing = G08 selector `0x48EB90` pre-G09 | SQ-G17-001 | CFG + capture G08 `g08-native-cover-redirect-pre-g09-2026-08-09.json`. Section 2 party n'est pas Cover. | RAW_IDB, LIVE_PRIOR | confirmed-static+live-prior | 0.40→0.90 | Session O fermée. |
| CA-G18-001 | U18.2 | GF pending `0x03`, resolver `0xFE`, **group 1** | G18 U18.2 | Transfer: `0x03` default **g2**; `0xFE` **g1**. GetText commente une réécriture vers `0xFE` **après** transfer. | RAW_IDB, LIVE_PRIOR | refuted (group au transfer) | 0.78→0.55 | Overclaim routing. |
| CA-G18-002 | U18.4 | Dégâts GF dans `ComputeMagicAndGFDamage` (Boost, level mods) | U18.4 | Cases GF_DAMAGE présents avec `GF_BOOST`/`GF_LEVEL`. Multiplicateur live. | RAW_IDB | confirmed-static-with-cap | 0.65→0.62 | Plafond cadence/Boost. |
| CA-G19-001 | U19.1 | Table resolver IDs = contrat d'implémentation G19 | G19 0.48 | Inventaire du switch `0x48FE20`. Card/Devour dans case 0. Pas de handlers row-level. | RAW_IDB | out-of-scope-recognition | 0.48→0.48 | SQ-G19-001 reste. |
| CA-G20-001 | U20.* | Familles Limit = state machines certifiées | G20 0.42 | Page Limit plus ancienne + inventaire. Selphie reroll encore ambiguous. | OLDER_DOC, RUNTIME_REQUIRED | out-of-scope-recognition | 0.42→0.40 | U20.8 live. |
| CA-HYG-001 | wiki | Checkpoint final 12:00 et `open_questions=16` | log/ledger | Filesystem 10:27; 18 SQ. | CODE (mtime) | refuted | — | Hygiène, pas bytes. |

## 3. Audit des 18 entrées SQ

### SQ-G11-001 Dual/Triple consume vs CHARA_ABILITY bits

- Statut actuel: `open` 0.45. **Recommandé: `open`.**
- Preuves indépendantes: Double/Triple = `status_2` `0x20000`/`0x40000` → `number_magic_to_launch` 2/3 (disasm `0x485740`/`0x48576d`). Consume last-pass sauf bits `CHARA_ABILITIES` (`test al,20h` si launches==2).
- Absent: constantes réelles des bits; writer de launches hors status; compteur qty Dual vs Triple live.
- Décision: probe statique `small` — dump enum `CHARA_ABILITIES` / xrefs writers. Live Dual/Triple `medium`.
- Bloque? **Non** pour Fire single-cast. **Oui** pour U11.8 Dual/Triple.
- Pourquoi pas seulement live: les bits sont dans l'EXE.

### SQ-G11-002 `K_MAGIC` index bounds

- Actuel `open` 0.80. **Recommandé: `offline-resource-required`.**
- Preuves: distance 57×60. Pas de clamp.
- Absent: header `kernel.bin`.
- Décision: parser kernel `small`. Live inutile si sizes match.
- Bloque? OOB seulement. Reader fail-closed `id>=57` suffit pour G11 offline.

### SQ-G11-003 battle-init import

- Actuel `open` 0.40. **Recommandé: `open`.**
- Preuves: pas de xref d'écriture d'init vers le label. `sub_4C8820` = getter menu.
- Absent: memcpy `F_CHAR_DATA` / `setBattleSlotData`.
- Décision: xrefs `SG_ARRAY_CHARA_DATA[].Magic` dans init `medium`.
- Bloque? Round-trip save. Tests peuvent seeder `F_CHARACTER_MAGIC_DATA`.

### SQ-G11-004 spell → `attackType`

- Actuel `open` 0.35. **Recommandé: `offline-resource-required`.**
- Preuves: dispatcher existe; BSS vide.
- Décision: `kernel.bin` Magic dump `small`. JSON `kernel_bin_data.json` seulement après hash vs kernel.
- Bloque? **Oui** le pack de familles (Demi/Cure/Life mapping).

### SQ-G11-005 UNMISSABLE vs LV_ATTACK

- Actuel `open` 0.85. **Recommandé: `open` (claim algo `confirmed-static`; rows = 004).**
- Preuves: CA-G11-003.
- Ne pas garder « magic always rolls accuracy ».

### SQ-G11-006 curative `a4==8`

- Actuel `open` 0.55. **Recommandé: reclasser — branche **atteinte** (case 21); rows kernel `offline-resource-required`.**
- Preuves: `push 8` @ `0x49278A`. Claim « only 7 » **refuté**.
- Bloque? Non pour Cure type 7. Oui pour %-max heal Magic si une row 21 existe.

### SQ-G11-007 Med Data vs Magic Life

- Actuel `resolved` 0.92. **Recommandé: rester `resolved`.** Nuance: 4 et **13**, pas « Mug » sauf preuve que Mug utilise 13.
- Preuves: CA-G11-011. Live Phoenix = G12.

### SQ-G12-001 Item consume vs `target_mask 0x4000`

- Actuel `open` 0.55. **Recommandé: `open` + claim actuel `refuted`.**
- Preuves: CA-G12-004. Confuse `status_2&0x4000` dans le bloc auto (`WHEN_DOING`). Unique FindByCondition. GetText Item sans fail stock.
- Absent: **le consume Potion du joueur.**
- Décision: probe statique `large` — xrefs EQUAL qty, menus `sub_4C8220`, pending write Item. Puis live Potion `medium`.
- Bloque? **Oui, U12.7 / G12.**
- Live-required? **Non** tant que des writers statiques existent.

### SQ-G12-002 `unknown2` vs `attackFlags`

- Actuel `open` 0.80. **Recommandé: `open` bas (noms) — algo `confirmed-static`.**
- Preuves: CA-G12-003.
- Bloque? Non si on charge par offset, pas par nom Hex-Rays.

### SQ-G12-003 `unknown4` usable bit

- Actuel `open` 0.35. **Recommandé: `open`.** `xrefs_to_field` non fait ici (`small`).
- Bloque? Non pour resolve.

### SQ-G12-004 refund vs never-subtract

- Actuel `open` 0.60. **Recommandé: `open`.** Refund add est réel; exactly-once dépend de 001.
- Bloque? Couplé à G12 consume.

### SQ-G13-001 pending Draw authentique

- Actuel `live-required` 0.55. **Recommandé: `live-required` pour le record authentique; table command-set = probe statique `medium` d'abord.**
- IDB **prouve**: handler type 3 → Draw menu; payload = byte de row; QueueOrStore unique; UI state 6 ≠ pending. IDB **ne prouve pas** que la row Draw vaut 6.
- Pourquoi live peut rester nécessaire: même une table statique ne certifie pas le record 8-byte après confirm (aux, mask).
- Bloque? Fixture G13 « dump 8 bytes ». On peut stubber aux 9/10 sans certifier le command_id menu.

### SQ-G13-002 Draw source death

- Actuel `live-required` 0.30. **Recommandé: `live-required` (mid-flight) ; GetText-time = `confirmed-static`.**
- Preuves: GetText Draw fail si source `status_1&1`. Stash QueueOrStore seulement cmd 4.
- Pourquoi live: mort entre confirm et GetText, ou pendant Cast, n'est pas un bit test unique.
- Bloque? Pas Cast/Stock happy path.

### SQ-G14-001 barrier idle cadence

- Actuel `live-required` 0.40. **Recommandé: inchangé.**
- Topologie `confirmed-static`. Compteurs de frames = présentation.
- Pourquoi aucune lecture statique ne suffit: idle vs busy est une durée runtime vs Director/NCOMP.
- Bloque? Pas G11. Bloque U14.5 ownership live.

### SQ-G15-001 AI VM loop guard

- Actuel `open` 0.70. **Recommandé: `open` (algo stop `confirmed-static`).**
- Preuves: CA-G15-001.
- Corpus JUMP arrière = U16.8 offline. Soak seulement si script livelock.
- Bloque? Interface G15 non. Harness malformé oui.

### SQ-G17-001 Cover trigger timing

- Actuel `confirmed-static+live-prior` 0.90. **Fermé 2026-08-27.**
- Selector `0x48EB90` xref `0x48E8E1` avant G09. Capture G08 existante.
- Session O non ouverte. Return Damage follow-up = SQ-G17-005 fail-closed.
- Bloque? Non pour l'offline G17. Session P = Counter, pas Cover.

### SQ-G19-001 Card/Devour/Mug

- Actuel `open` 0.40. **Recommandé: `open` / recognition.**
- Case 0 resolver + `K_DEVOUR` visibles. Pas de carte transaction.
- Bloque? G19 only.

### SQ-G20-001 Limit authentic records

- Actuel `live-required` 0.30. **Recommandé: inchangé.**
- Ordinary pending + follow-ups divergents: architecture ancienne, pas six SM.
- Bloque? G20 only.

## 4. Audit profond G11–G14

### G11 Magic

Score campagne 0.88 `static-strong`. **Recalcul médiane prudente des claims nécessaires: 0.74.** Kernel cap 0.79; import 0.35; Dual/Triple 0.68. Ne pas coder G11 « complet » à 0.88.

| Read-set | Write-set | RNG | Error/rollback | Ownership | Static holes | Live holes |
| --- | --- | --- | --- | --- | --- | --- |
| `K_MAGIC[action_id]` fields listés U11.1 **sauf** HITPERCENT; `F_CHARACTER_MAGIC_DATA` 32×(id,qty); `COMMAND_TYPE_ID`; Silence `status_1&0x10`; Angel Wing `status_2&0x02000000`; `CHARA_ABILITIES`; Double/Triple status_2; `HIT_*` reset resolver | GetText: `BOOL_LAST_COMMAND_FAILED`, `unk_1D28E2A`, hitCount/magicID/compat ptr. PrepareTurn: `MutateStock` qty/id, junction rebuild. Cleanup: SG Magic 32 paires | 1× spread MAG/SPR et Cure type7. 0 Demi `PERCENT`. Zombie Life → UNMISSABLE spread. Status G10 mental si bits | GetText fail: jamais MutateStock. MutateStock 255 → LABEL_66 abort tail. Pas d'add-back Magic | Stock battle-local: MutateStock. Persist: CopyMagic au cleanup seulement. Resolver ne possède pas le stock | Import init; kernel rows; bits Dual/Triple; blow-away writer; `attackType==21` mapping | Pending Magic `0x02` authentique; Dual/Triple counts; Fire vs HITPERCENT (devrait 0 draw accuracy) |

Must-fix G11: kernel Magic matrix; décision Dual/Triple defer ou bits; politique seed vs import.

### G12 Item

Score campagne 0.82. **Recalcul: 0.58.** U12.7 nécessaire et **refuté**.

| Read-set | Write-set | RNG | Error/rollback | Ownership | Static holes | Live holes |
| --- | --- | --- | --- | --- | --- | --- |
| `K_ITEM` offsets resolver; EQUAL pairs; `SG_ITEM` 198; `ITEM_TENT` 0x21; LOCKED_ITEM; cmd 4/13 | ParseItems zero+import EQUAL. AdjustCount add/remove. Cleanup merge EQUAL→SG **même escape**. FindByCondition case4 remove=1 (auto Confuse seulement, preuve actuelle). Refund add +0xB8/+0xB9 | Curative item: HITPERCENT puis enabler. Revive: 0 sauf Zombie | GetText Item **pas** fail-closed empty. Refund ≠ never-subtract | EQUAL ≠ Magic stock. AI `0x11`/`0x15` écrivent SG (exception persist) | **Consume joueur**; `unknown4` xrefs; kernel attackType items; index import name | Potion qty PrepareTurn; mask dump; Phoenix Med Data |

Must-fix G12: retrouver le writer `AdjustCount(remove=1)` du confirm joueur **avant** tout port.

### G13 Draw

Score 0.74. **Recalcul: 0.70** (pending id cap 0.74). Formules Cast/Stock plus solides que le byte menu.

| Read-set | Write-set | RNG | Error/rollback | Ownership | Static holes | Live holes |
| --- | --- | --- | --- | --- | --- | --- |
| Draw table LowLvlDraw; `K_MAGIC.drawResist`; aux_5/6; source slot; handler type 3; `COMMAND_TYPE_ID==6` | QueueOrStore 8-byte pending (pas Write default). Stock: MutateStock add. Cast: pas remove Magic | Steal 1× `&0x1F`. Cast extra `(rand8+10)/150` | GetText: source KO, Silence, steal 0, id mismatch → fail family. Full stock: add s'arrête | Stock = Magic writer add. Transfer: pending.command_id (6 ∈ default g2) | Command-set byte Draw; GF Draw `id>=0x40` (branche GetText vue, non marchée) | 8-byte pending; mort mid-flight; qty 0 Cast scale |

### G14 Callbacks

Score 0.68. **Recalcul: 0.62** topology; U14.3/4 recognition.

| Read-set | Write-set | RNG | Error/rollback | Ownership | Static holes | Live holes |
| --- | --- | --- | --- | --- | --- | --- |
| Node +1/+2/+4/+8; camera busy bytes; actor idle; LOCK/UNLOCK latches | Alloc BdLink; Dispatch return 8 persist / 15 done; child `+1=0xFF` unlink | Aucun domain | Mixte native/replacement **indémontrable** statiquement | HUD/action = domain. File/BdLink/0x70–74 = présentation. U14.3/4 = design | Allocator exact / retenue liste (Tick vu, pas un walk complet ici) | Cadence 0x70/71/74; detector half-ownership |

## 5. Contrôle G15–G20

### G15 — sept lignes du crosswalk

Autorité opcodes: [[projects/re-ff8/references/enemy-ai-opcodes]] (`extracted` 0.92, 2026-06-14) = `OLDER_DOC`. Crosswalk campagne = mapping, pas une redécouverte. Extrait VM frais:

| Unit | Claim ledger | Contrôle frais | Verdict |
| --- | --- | --- | --- |
| U15.1 parser §8 | offsets AI/text | Non reparsé `.dat` (hors EXE). Cohérent opcodes page. | out-of-scope-recognition pour corpus; modèle `OLDER_DOC` |
| U15.2 context | args slot/pc/cmd/mask | Prologue VM: difficulty `BMI71_*`, scratch 0, command_type 0, berserk sec1 fallback. | confirmed-static-with-cap |
| U15.3 stop/jump | 0x00 / 0x23 / commit | `test al,al; jz ret`. JUMP int16 LE signé @ `0x4897C5`. | confirmed-static |
| U15.4 vars | 0x0E/0x12 local, 0x0F/0x13 global, 0x11/0x15 SG_ITEM | Table opcodes OLDER_DOC; pas re-décompilé 61 ops (consigne G15). | confirmed-static-with-cap (autorité page 2026-06-14) |
| U15.5 subjects | IF 0x00 HP% … | Table sujets page opcodes. | same |
| U15.6 compare | signed 16-bit | Page opcodes `EnemyAI_CompareValues`. | same |
| U15.7 selectors | 0x04 / 0x2B / 0x26 | Page opcodes. | same |

G15 0.85 est **haut** pour un crosswalk. Technique recoupé: ~0.80 si on fait confiance à la page opcodes; ~0.70 si on refuse OLDER_DOC. **Pas un contrat d'implémentation 61 opcodes cette campagne.**

### G16 — trois claims fort impact + tout >0.70

Aucun claim G16 n'est >0.70 (score jalon 0.62). Contrôlés:

1. **U16.4 spawn/remove** — `out-of-scope-recognition`. Ne pas coder.
2. **U16.6 rewards / SG_ITEM** — opcodes `0x11`/`0x15`/`0x37`/`0x38` page opcodes; exception persist G12 réelle si 0x11/0x15. Recognition.
3. **U16.7 relays 0x70/0x71** — `0x33`/`0x1B` → ActivateRelay; topologie G14. Pas Dispatch depuis domain. Recognition + CA-G14-001.

### G17 — trois claims + Cover

1. **U17.5 group 0** — EnqueueSpecialAction only: déjà G07/G10 `LIVE_PRIOR` + transfer never fills g0. `confirmed-static` 0.80 inchangé.
2. **U17.3 Cover timing** — `live-required` CA-G17-001.
3. **U17.1 on-hit section 4** — `mapped` recognition; ordre multi-hit live.

Pas de claim G17 >0.70 hors U17.5 (déjà antérieur).

### G18 — trois claims + U18.2 0.78

1. **U18.2 routing group 1** — **refuted au transfer** CA-G18-001. Overclaim.
2. **U18.1 metadata `K_GF_JUNCTIONABLE`** — base/stride 0.80 layout; rows kernel offline. `confirmed-static-with-cap`.
3. **U18.4 damage Boost** — helper GF cases `confirmed-static-with-cap`; Boost live.

U18.3 charge lifetime: `mapped` / live — rester recognition.

### G19–G20 overclaim

Marquer **`out-of-scope-recognition`**:

- Toute ligne G19 U19.2–U19.6 « handler plan ».
- G20 U20.2–U20.7 présentés comme SM (fenêtres, Duel, Shot, Slot weights).
- Jalon G13: « authentic Draw `command_id = 0x06` » dans [[projects/re-ff8/references/battle-iso-migration-milestones]] — **contrat de test trop ferme**.
- Index/summary command-action « resolver Draw is 6 not 0x0D » est **vrai** (resolver); le coller au pending 0x06 ne l'est pas.
- `enemy-ai-vm.md` `updated: 12:00` et « G15 crosswalk »: mapping, pas fermeture 61 ops.

Formulations honnêtes à garder: G16–G20 `mapped`; « Names of functions are not certified state machines. »

## 6. Contradictions et hygiène

### Erreurs certaines (patch recommandé, **non appliqué**)

1. **U12.7 / SQ-G12-001:** remplacer « `target_mask & 0x4000` » par le prédicat observé (`status_2` Confuse dans le bloc auto) et marquer consume joueur **inconnu**.
2. **SQ-G11-006:** noter case 21 `push 8`; retirer « dispatcher only passes 7 ».
3. **Group Routing:** « switch sur `pending.command_id` », pas `COMMAND_TYPE_ID`. Lister default {1,3,6,…} → g2; `0xFE` → g1.
4. **Commentaire IDA `0x484FD0`:** retirer l'assertion `command_id=0x06` ou la qualifier candidate (mutation IDB hors scope audit).
5. **Comptes:** `open_questions=16` → 12 open + 5 live-required + 1 resolved. Timestamps `12:00` → mtimes réels ~10:27 ou « unknown ».
6. **battle-lifecycle:** fusionner les deux `## Open Questions` (L225 est un paragraphe Wicked orphelin sous un titre dupliqué).
7. **Jalon G13 test:** « pending Draw byte still SQ-G13-001 » au lieu de `= 0x06`.
8. **G18 U18.2 group 1:** pending `0x03` = default g2 jusqu'à preuve de rewrite **avant** transfer.
9. **Hex-Rays Med Data « Mug\|Attack »:** documenter `COMMAND_TYPE_ID ∈ {4,13}`.

### Hygiène wiki

| Item | Constat |
| --- | --- |
| Liens cassés nouveaux | Non audités exhaustivement (pas de lint de graphe complet). Le lint 10:40: `broken_links=0`. |
| Headings dupliqués | `battle-lifecycle` ×2 `Open Questions`. |
| Frontmatter 12:00 | ledger, SQ, plusieurs concepts, `re-ff8.md`, index. |
| Log non chrono | `12:00` puis `10:40:23` lint. |
| Propagation source faible | `0x06` pending: commentaire IDA → SQ → command_id_table → jalon G13. Une seule inférence. |
| `command_id_table.md` | Mélange pending/resolver sur la ligne Draw `0x06`. Item `0x04` OK vs vieux Draw. |
| Pages orphelines | Ce rapport doit être indexé (fait au checkpoint). |

## 7. Verdict final

### Scores

| | Documentaire | Technique (médiane prudente) |
| --- | ---: | ---: |
| Campagne globale | 0.52 (timestamps, comptes, overclaim 0x06/0x4000/group) | — |
| G11 | 0.60 | **0.74** (pas 0.88) |
| G12 | 0.45 | **0.58** (pas 0.82) |
| G13 | 0.62 | **0.70** (pas 0.74 comme « mapped with live id ») |
| G14 | 0.70 | **0.62** |
| G15 | 0.75 | **0.78** crosswalk / pas 0.85 contrat |
| G16 | 0.70 | **0.55** recognition |
| G17 | 0.70 | **0.50** |
| G18 | 0.55 | **0.55** (routing refuté) |
| G19 | 0.70 | **0.48** |
| G20 | 0.70 | **0.40** |

### Must-fix before G11 implementation

- Parser `kernel.bin` Magic (`attackType`, power, element, hitCount) — offline.
- Décider Dual/Triple: defer fixtures **ou** fermer les bits `CHARA_ABILITIES`.
- Politique stock init: seeder battle-local **ou** trouver l'import (SQ-G11-003).
- Ne pas partir du score 0.88 / `static-strong` comme contrat d'implémentation.
- Layer law ISO inchangée: pas d'appel resolver Magic natif.

### Can wait

- G12 jusqu'au writer consume joueur (mais **bloque G12**, pas G11).
- G16 spawn, G19 rows, G20 SM, Cover, GF charge/Boost live, cadence 0x70, Card/Devour.

### Offline probes (rendement)

1. `kernel.bin` Magic + Item matrices (SQ-G11-004, G12 analogue, case 21).
2. Table command-set (byte Draw row) — SQ-G13-001 sans combat.
3. Writers `EQUAL_ITEM_QUANTITY` / menus Item — SQ-G12-001.
4. Enum `CHARA_ABILITIES` — SQ-G11-001 / Med Data `&2`.
5. `xrefs_to_field` `K_ITEM.unknown4`.
6. Vérifier rewrite GF `0x03`→`0xFE` **avant** vs **après** transfer.

### Live minimal (après offline)

1. Potion: EQUAL qty + pending/exec + `AdjustCount` hits.
2. Draw confirm: dump 8 bytes pending (SQ-G13-001).
3. Dual/Triple qty (si non defer).
4. 0x70 idle vs Director (G14).
5. Cover HP order (G17).
6. U20.8 familles Limit.

### Recommandation

**`accept-as-draft`.**

Utiliser le ledger comme **carte de racines EA**, pas comme spécification d'implémentation G11–G12. Recoder U11.1/U11.4/U11.5/U11.7/U13.2/U13.4 depuis les bytes ci-dessus. Reprendre U12.7 à zéro.

## Related

- [[projects/re-ff8/references/g11-g20-static-readiness-ledger]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/draw-magic-and-render-bridge]]
- [[projects/re-ff8/references/enemy-ai-opcodes]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
- [[docs/tech/reference/command_id_table]]
