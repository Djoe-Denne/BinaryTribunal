# R0 — Périmètre de réécriture Battle Loop (spec figée)

Date : 2026-09-12. Arbitrage parent après triplet R0.1 **unanime**
(analyse + 2 contre-revues indépendantes, lecture seule).
Données machine : [`r0-scope.json`](r0-scope.json),
SHA-256 `04601fdb2b57651e8cae931e63713dc49dba07e3f1d2300902fe543853f960cd`.

Binaire : `FF8_EN.exe`, SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`,
base `0x400000`. IDB : `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`.

## 1. Sources (toutes vérifiées par SHA avant extraction)

| Registre | SHA-256 |
|---|---|
| `battle-graph-ledger.json` | `4bfb14965dddbf713435c961dd7858c4cb4a692ee0f40f07ed7af6882f125a38` |
| `battle-indirect-registry.json` | `55bc0b13ae82694302eb26853924d095ccea4721c36a6f445f49a748b5a68de9` |
| `magic-registry.json` | `2815045b891e9543dcff4c2ec432d8fa24e329b35ff4ed1820e1cfc7fc2b472a` |
| `c0m-registry.json` (v1.2.0) | `7ef0ab554f232b03c92a2806df76244ef460e76a415ff38ba2277bc478eed5df` |

## 2. Définitions opposables

- **L0 strict (variante C2, 1594 nœuds)** : BFS depuis les **162 VA uniques**
  de `root_definition.explicit_categories` (163 listées, doublon `0x56DD70`
  `BattleUI_GFBoost_Update` présent en `hud` **et** `magic_gf`, dédupliqué),
  arêtes `kind ∈ {direct_call, tail}` **hors `stopped`**, nœuds
  `table_named_unverified` non-graines exclus (ni inclus ni traversés),
  **17 graines TNU incluses et traversées**. **Pas de fenêtre VA.**
  Composition : 792 `named_not_semantically_audited` + 785
  `non_investigated_static` + 17 `table_named_unverified`.
- **L1 (686 cibles)** : union des `table_edges.target_va` (MagicList
  Logic + TextureLoad), **sans BFS** dans leurs callees. 4 duals aussi
  dans L0 : `0x6298A0`, `0x680C50`, `0x680C60`, `0xB25780`.
  L1 seul = 682. **L0 ∪ L1 = 2276 nœuds.**
- **L2** : 1771 arêtes `callback_candidate` (1647 cibles distinctes,
  **candidats à typer avant promotion**) + `battle-indirect-registry.json`
  (493 sites : 485 `call` + 8 `jmp` ; IAT 82, DRAW 116, HUD_DRAW_FILE 27,
  LOT2 263, GHOST 5 ; 0 PENDING). IAT et `runtime_com` = **coutures à
  relinker, jamais à décompiler**. 5 GHOST exclus (`ghost_not_indirect`).
- **L3 exclu (5238 nœuds)** : `7514 − L0 − L1_only`. Documenté comme
  exclu, **non typé** (CRT, moteur partagé, vendor, spillover
  field/world, feuilles indeg 0–4 hors L0).
- **indeg** : nombre de **sites** BFS (arêtes `direct_call|tail` entrantes,
  hors `stopped`). Ni `XrefsTo` IDA ni callers uniques.

## 3. Décisions d'arbitrage

1. **C2 (1594) adopté**, unanimité du triplet. `(b)=1528` reste la mesure
   historique de contrôle. `(a)=2057` rejetée (449 TNU avalées, overlap
   L1 227). C1=2025 rejetée (même overlap). B ⊂ C2 ; C2−B = 66
   (17 graines TNU + 40 NIS + 9 named via graines, dont le cœur BdLink).
2. **Écart +67 vs ~1527 assumé** : le ~1527 historique n'a **aucune
   fenêtre VA gelée** (vérifié : ni ledger, ni script, ni docs). Adopter
   `(b)` pour coller au chiffre éjecterait 17 entrypoints battle
   (BdLink Register/Pump, stages, workers GF) dont 13 hors L1.
   `1528 − _vsprintf = 1527` n'est pas une règle.
3. **`code_edges_true` 42761 inclut les 339 arêtes `stopped`**
   (66 cibles CRT hors nœuds). Le BFS L0 les exclut (42422 suivies).
4. **Dérive `source_ledger` documentée, non réécrite** : registre figé
   sur `eb5c5635…` (485+8) contre ledger actuel (482+6) ; delta = 5 GHOST.
   Hors périmètre E3, figé par décision.
5. **Arithmétique KEEP fermée** : 71 bruts (27+6+38) → 70 uniques
   (`0x5088A0` en E3a+E3b) → **68 indeg ≥ 5** + 2 racines indeg 0
   (`0x5106E0` `ot_submit`, `0x62C820` `magic_gf`). `0x5088A0` est une
   graine **indeg 40**, dans les 68. `keep68 − E3uniques = ∅`.
   40/68 KEEP dans L0 ; 28 vivent dans le filet L3 (travailleurs
   MagicList/GF) — le 68 est une dette du graphe 7514, pas une liste L0.

## 4. Les 68 KEEP (`non_investigated_static`, indeg ≥ 5)

| VA | indeg | lot | VA | indeg | lot |
|---|---|---|---|---|---|
| `0x4074F7` | 6 | E3c | `0x50CBA0` | 58 | E3a |
| `0x40F52C` | 6 | E3c | `0x50D6B0` | 5 | E3c |
| `0x4166EF` | 5 | E3c | `0x56C270` | 101 | E3a |
| `0x416C1E` | 13 | E3c | `0x56C4F0` | 172 | E3a |
| `0x417E52` | 5 | E3c | `0x56C600` | 106 | E3a |
| `0x41B1C1` | 5 | E3c | `0x56CE30` | 255 | E3a |
| `0x41E1AF` | 6 | E3c | `0x571480` | 117 | E3a |
| `0x425DD4` | 7 | E3c | `0x5714F0` | 140 | E3a |
| `0x45E9D0` | 110 | E3a | `0x571620` | 63 | E3a |
| `0x45EBF0` | 53 | E3a | `0x571690` | 63 | E3a |
| `0x45F270` | 261 | E3a | `0x571BC0` | 324 | E3a |
| `0x45F4C0` | 84 | E3a | `0x571C80` | 373 | E3a |
| `0x49B300` | 7 | E3c | `0x572200` | 346 | E3a |
| `0x49C660` | 12 | E3c | `0x5BC770` | 11 | E3c |
| `0x49D6F0` | 12 | E3c | `0x64E080` | 11 | E3c |
| `0x49E9C0` | 5 | E3c | `0x64F0A0` | 5 | E3c |
| `0x4A1020` | 20 | E3b | `0x650720` | 7 | E3c |
| `0x4A29A0` | 34 | E3b | `0x662C00` | 23 | E3b |
| `0x4AA1D0` | 5 | E3c | `0x673810` | 10 | E3c |
| `0x4AC0A0` | 5 | E3c | `0x67E550` | 8 | E3c |
| `0x4AF340` | 8 | E3c | `0x68AEE0` | 7 | E3c |
| `0x4B6530` | 7 | E3c | `0x693170` | 6 | E3c |
| `0x4B6A80` | 12 | E3c | `0x6C0160` | 7 | E3c |
| `0x4B7210` | 41 | E3b | `0x6CE880` | 6 | E3c |
| `0x4B77C0` | 7 | E3c | `0x6DFD90` | 7 | E3c |
| `0x4BDB30` | 15 | E3c | `0x6F1C10` | 8 | E3c |
| `0x5022C0` | 58 | E3a | `0x6F2A30` | 9 | E3c |
| `0x503AE0` | 12 | E3c | `0x6FC9E0` | 8 | E3c |
| `0x5088A0` | 40 | E3a+E3b | `0x701270` | 105 | E3a |
| `0x509CD0` | 8 | E3c | `0x7016B0` | 281 | E3a |
| `0x50A070` | 5 | E3c | `0x701970` | 246 | E3a |
| `0x50A750` | 5 | E3c | `0x701DD0` | 29 | E3b |
| — | — | — | `0x8DC740` | 82 | E3a |
| — | — | — | `0xB65160` | 58 | E3a |
| — | — | — | `0xB651E0` | 58 | E3a |
| — | — | — | `0xB65270` | 58 | E3a |

Racines NIS indeg 0 (hors 68) : `0x5106E0`, `0x62C820`.
NIS total : 68 (≥5) + 3742 (1–4) + 1582 (0) = 5392.

## 5. Les 17 graines TNU (entrypoints conservés en L0)

`0x500DD0` `au_re_BdLinkTask`, `0x506C30` `BdLinkTask_PumpStageList`,
`0x508360` `BdLinkTask_Register`, `0x508420` `BdLinkTask_Pump`,
`0x50DF10` `BS_Stage137`, `0x50DFF0` `BS_Stage137_RenderTick`,
`0x6298A0` `MAG_002_FIRE`, `0x680C50` / `0x680C60` / `0x6812E0`
(Carbuncle), `0x8DC540` `BdLinkTask_CreateAndInitContext`,
`0xB00310` / `0xB06E00` (Alexander), `0xB25780` / `0xB25DF0` /
`0xB2BA10` / `0xB2BB40` (Ifrit). 4 duals L1 : `0x6298A0`,
`0x680C50`, `0x680C60`, `0xB25780`.

## 6. Divergences résiduelles (signalées, non bloquantes)

- D1 : HANDOFF §6 additionne 27+6+38=71 bruts ; lire §3 décision 5.
- D2 : `closure-audit.md` E3a : NIS 5663→5605 = −58 pour 57 renames
  (−1 inexpliqué ; E3b −38=38 et E3c −175=174+thunk sont exacts).
- D3 : `counts{}` n'expose ni les 933 named ni les 6 `clone_trivial`.
- D4 : `MenuSprite_DrawCallback` `0x4A0C00`–`0x4A0C7B` absent des 7514
  (connu) ; `code_edges` 44532 double-compte les callbacks (connu).

## 7. Mode d'emploi

- `r0-scope.json` : `L0` (1594 `{va,name,status}`), `L1_only` (682 VA),
  `L2_callback_targets` (1647 VA), `KEEP68` (68 `{va,indeg,lot,in_L0}`),
  `seeds_TNU`, `counts`, `definitions`, `decisions`.
- Régénération : relire les 4 SHAs du §1 ; tout écart invalide ce scope.
- R2 (seams) part de L0+L1 comme nœuds à reproduire et L2 comme
  signatures aux coutures ; L3 reste exclu sauf décision R0 contraire
  sur un KEEP bloquant.
