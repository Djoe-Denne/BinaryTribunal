# R1 — Synthèse : logique de rendu battle extraite (2026-09-12)

Parent : arbitrage après 6 triplets read-only (R1.1–R1.5 RE + R1.6
validation fixtures) + spot-checks parent au désassemblage/octets.
Méthode §2 HANDOFF respectée, avec un avenant opérateur en cours de
route : **Muse Spark interdit à partir de R1.5** — triplets R1.1–R1.4
= 1 analyse Grok + 1 CR Grok + 1 CR Spark (exécutés, conservés),
R1.5–R1.6 = 3x Grok. Sous-agents strictement read-only (ni IDB, ni
docs, ni QMD, ni exécution). IDB **non mutée** de tout R1 (aucun
rename/commentaire : disasm/get_bytes/xrefs/list_funcs/py_eval
`get_idb_path` seuls). Aucun commit. QMD jamais touché.
`tools/_tmp_*` et docs d'autrui (`M .gitignore`, HANDOFF_glm*,
`glm-mcp-function-budget.md`) intacts — seul un bloc `fixtures/`
a été AJOUTÉ en fin de `.gitignore`.

Périmètre R0 rappelé (clos, jamais refait) : L0 C2 1594 + L1 686
(= 2276), L2 493 sites + 1771 `callback_candidate`, L3 exclu,
[`r0-scope.md`](r0-scope.md) / [`r0-scope.json`](r0-scope.json)
(SHA `04601fdb…`), [`r0-arbitrage.md`](r0-arbitrage.md).
Registres re-vérifiés §9.1 le 2026-09-12 : 5/5 SHA OK
(ledger `4bfb1496…`, indirects `55bc0b13…`, magic `2815045b…`,
c0m `7ef0ab55…`, scope `04601fdb…`). PE `064d466b…`, base
`0x400000`, IDB `…FF8_EN.exe - 9.3.i64` : conformes.

## 1. Livrables R1

Docs (nouveaux, `docs/tech/systems/`, anglais, preuves
VA+octets+xrefs, verdicts + décisions parent + PARENT_CHECK) :

- `render_pipeline_scheduling_submit.md` (R1.1) : timeline
  `FFBattleModule`, Director/BdLink, file tâches, chaîne OT,
  draw-lists, matrice driver 66 DWORD, seams à relinker.
- `render_hud.md` + `render_camera.md` + `render_stages.md` (R1.2).
- `render_models.md` + `render_animation.md` +
  `render_action_sequences.md` (R1.3).
- `render_textures_tim.md` (R1.4).
- `render_magic_gf.md` + `render_effects_vm.md` +
  `render_transitions.md` (R1.5).

Fixtures (`fixtures/<famille>/<id>.meta.json` versionnés,
`<id>.dat` NON versionnés via `.gitignore`, 18/18 OK, 0 échec) :

| Fixture | SHA-256 (début) | Taille | Fait figé |
|---|---|---|---|
| c0m060 | `6f182632…` | 77460 | monstre golden : H4=88, H6=276, 21 os |
| c0m001 | `0474598c…` | 119328 | corps générique H6=612, 36 os |
| c0m034 | `b3f0b8af…` | 176660 | H4 max 324 |
| c0m088 | `7610bc2c…` | 111852 | H4 min 16, H6=952 |
| c0m126 | `fa000ada…` | 277068 | hôte Griever, H4=196, 71 os |
| c0m127 | `5573f0dc…` | 460 | overlay 2 sections, actor 143 |
| c0m144 | `90422600…` | 63412 | témoin filler EXCLU |
| d0c000 | `eab480f5…` | 79284 | party Squall, 7 sect, 23 os, H6≠∅/H7 |
| d0w000 | `fc809f9b…` | 37628 | arme Squall, 8 sect |
| d7c016 | `41c382c0…` | 120544 | Edea, 10 sect, 35 os, TIM H9 + arme H10 |
| d1c003 | `5cc8a8b6…` | 82088 | corps Zell (hôte fusion) |
| d1w008 | `6bfd6608…` | 33260 | arme Zell, **5 sections**, TIM H5 |
| d9c019 | `794be388…` | 90004 | corps Kiros (hôte fusion) |
| d9w037 | `12fcefa8…` | 31468 | arme Kiros, **5 sections** |
| mag203_b_00 | `cc9293eb…` | 73444 | header `[0]=0,[1]=[7],[5]=0x30` ✓ |
| mag203_b_01 | `c7bef01c…` | 205056 | stream opcodes (pas de contrat header) |
| mag330_b_00 | `c58448c2…` | 5968 | template slot 330/id 331, header ✓ |
| mag330_b_01 | `2b30cf93…` | 159824 | stream template |

Outil : `tools/extract_battle_fixtures.py` (FI/FL/FS générique +
LZS frais/fichier + `parse_sections` réutilisé de
`battle_c0m_registry`, cross-check C0M contre le registre R0,
`--archive-dir` explicite obligatoire).
Nouveaux pins : magic.fi `7b05cc82…`, magic.fl `092ea929…`,
magic.fs `bb2c2d2b…` (enregistrés dans les metas mag).

## 2. Concordance docs ↔ fixtures (ce que les blobs ont tranché)

- C0M : cross-check registre 7/7 (SHA fichier + offsets/tailles/
  SHA par section identiques au JSON R0 pin). Invariant
  `H1 = 0x10+N×0x30` vérifié sur d0c000 (23 os), d7c016 (35 os)
  + tous C0M utiles (division exacte).
- Comptages : d0c000=7, d0w000=8, d7c016=10, d1w008=5, d9w037=5 —
  **PC-13 modèles CLOS** (Zell/Kiros = 5 sections, pas 4).
- TIM parse-vs-copy (raffinement R1.3 D3, parent octets + blobs) :
  `0x507400` PARSE l'intervalle N−1 (party [+18]=H6 29776 o,
  arme [+1C]=H7 4652 o, Edea [+24]=H9, monstre [+2C]=H11,
  Zell [+14]=H5), tandis que le MEMCPY prend le dernier
  intervalle (party [+1C]=H7 2036 o, arme [+20]=H8 336 o,
  Edea arme [+28]=H10). H6 party et H7 arme sont NON vides :
  parse ≠ copy, les deux spans sont hashés. R1.3 parlait du
  memcpy ; les labels uniques "TIM H7/H8" sont incomplets sans
  cette split — corrigé ici, pas une réfutation.
- mag.00 : header 8 DWORD + taille 73444 + `[1]==[7]` + `[5]=0x30`
  confirmés sur 2 blobs (203 : `[1]=[7]=0xC8` ; 330 :
  `[1]=[7]=0x50`). PC-04 magie CLOS côté fichier.
- Edea intervalle 8 ([+20], case-2 `xorEAX_0`) = 19536 o NON vide
  sur disque (zéroté au LOAD, pas dans le fichier) : fixture =
  avant, correct.
- Registre C0M : JAMAIS régénéré in-place (le `generated_at_utc`
  casserait le SHA pin R0). Les triplets qui proposaient de le
  relancer ont été écartés sur ce point précis.

## 3. Métriques (honnêtes, définitions R0 inchangées)

- **rewrite = 0 %** (0/2276 modules réécrits — R1 = extraction,
  pas de code Battle Loop produit ; revendiquer plus serait faux).
- **spec** : +10 docs rendu preuve-niveau (scheduling/submit,
  HUD, caméra, stages, modèles, animation, séquences, textures,
  magie/GF, effets/VM, transitions) + 18 fixtures oracles +
  `tools/extract_battle_fixtures.py`. L0 nommés 792/1594
  inchangé (0 rename R1, volontaire) ; la preuve change de
  nature (layouts byte-exact + blobs hashés), pas le compteur.
- Le « 28 % » historique reste lexical (graphe 7514), cité
  uniquement avec cette réserve.

## 4. Errata portés contre les docs antérieures (preuves en docs R1)

- Pipeline §12 / wiki : FOV `>>6` → mode 2 bits ; ParseCamera
  2+1 → 2+2 ; « low 5 bits » → masque 0–6 ; TIM party H6 → H7,
  arme H7 → H8 (1-based uniforme, H1=`[+4]`) ; `0x493D80` HP →
  sync sans commit (`0x494410`) ; « OR `0x10000000` » dans
  `0x506690` → test+clear (OR producteur hors site) ;
  `BattleFilesArray[166..309] @ 0xB84CCC` → base = `[0]` ;
  `0xFFFF` enchaîne → header-fin vs durée-enchaîne ;
  `0x62C820` Fire worker → cluster `0x62Cxxx` hors Fire ;
  Gilgamesh 328–330 → 327–330 ; OBJ0 « 13 utiles » → 11+2 NULL ;
  `0x1D97BE0`/`0x9B88` OT → `0x1D924E0`/`0x4488` ;
  `0x49B120` (0,0.0005,0.001) → (0.001,0.0,0.0005) ;
  CLR VRAM focus-loss → sleep-path ; indices GL U32 → U16 ;
  `0xF0` magic TIM → taille lue (+ test `==2`) ;
  `0x41730A`/`0x4076FC`/`0x419DC0` starts → sites internes ;
  `0x509B30`/`0x509520`/`0x509B50`/`<0x80`/record-`0x30`-libération
  attributions → bons nœuds ; `0x5077B0` vs `sub_507740` (party
  vs clone-helper) ; `BattleUI_RenderHud` callee direct →
  indirect ; `0x56D720` → capture seule ; `==4` dans `0x4A2690`
  → dans le module appelant ; `0x1B4A018` → `0x1B47818` ;
  IDA « IDB≠PE `0x465455`/`0x4657D3` » → PE brut = IDB.
- Commentaires IDA faux relevés (non corrigés en R1, read-only) :
  `0x49B120` ordre dest, `+4 userdata` (registreur widgets),
  `AllocateTexturePages` (`0x507400` n'alloue pas),
  `0x1D27944` fold events, `latch=[a1+1]`, `0x47D1E5`-zone,
  symboles Op33/43/49 mid-body, `someUnknownBSCameraOperations`
  (stale), `Gfx_CreateDrawList`/`InitHud` sites confondus.

## 5. Dette R1 — PARENT_CHECK par doc (bornés, méthodes jointes)

- scheduling_submit : PC-01…PC-25 (§10 du doc).
- hud : PC-01/02/03/04/06/08/09/11/13/16/18/20/21 (registre,
  curseur, DRAWENV-92, projection, +04, bump-256, task-10 soldé
  par composition, LEA FindTexture, tuilage, disque).
- camera : PC-04…PC-25 (mesure DRAWENV, projection, playback
  2-pts, 0xFB, FOV numérique, CFG-156, 23 IDs, corpus,
  0-encodeur, BYTE2-LEA, clones MAG, bits acteur, 0x45D7F0,
  VM mod-4, pump aux, misc, return1, variant 7, passes-aux,
  collection 2e voix, startup-1003, ChangeStage).
- stages : PC-09/10/11/25 (CFG, 23 IDs, corpus, ChangeStage).
- models : PC-01…PC-25 (os+2/matrice, header, taille H1,
  H3-count, clip+1, masque 7C, 8o projeté, GL +0C/+14, Alt/DD,
  record+04, C0M count/EOF, TIM arme 2e voix, Zell H2–H4,
  IDs 11–15, 0xB8B7D8 4W/156R, flag musique, H5, H6 2e voix,
  H7-380, H9 format, GetText corps, switch-2 2e voix,
  +0x10/+0x11 + 32 slots, 8 indirects + C4/C8 + handlers).
- animation : PC-03/04/05/06/07/08/08b/09 (taille H1, count H3,
  clip+1, masque, 8o, passes 3–4, GL pads, Alt/DD).
- action_sequences : PC-18/19/22/23/24/25 (H5, H6 corpus,
  GetText, switch-2, payload/events, indirects/handlers).
- textures_tim : PC-01…PC-17 (magic H11, offsets[1..], bpp,
  CLUT-4bpp, H2 avant-patch, corpus H4, champs H4, VRAM-512,
  1CB602C, tuiles, xrefs LEA, Alt 22/23 tranché §8, enum BA8,
  type 0, type 2, FormatCallback, 8o TIM).
- magic_gf : PC-01…PC-25 (§9 zooms : scan 400+17ret, Alt
  CaptureFrame, census 116+slots, header mag, +8, clones A2,
  writers A2, 0x27973B8, PARTICULE, mini-drawers, Ifrit+ticks,
  OR writer, 0x493D80 exhaustif, 490 confirm, 0x1CFF6E4,
  0x681250, Op labels R2, 0x1852750, IP négatif, walker,
  15/2 TIM, stubs+0x465CB0, chaîne 62C820, Mode5, latch AKAO).
- effects_vm : mêmes PC mag + VM (voir §5 du doc).
- transitions : PC-02/14/15/24 (Alt capture, 490, GF queue,
  Mode5) + 1-voix (cas btitle, latch1 caller, filtre 2e liste).
- fixtures R1.6 : résiduels = census H4 37e liste (10 indices),
  golden monstre arbitré c0m060 (+ alts), D0C/D0W/Zell choix
  arbitrés index-0, TIM Zell H5 clos (count=5), mag hors-203
  (MAG330 ajouté), SHA magic pins ci-dessus, file_id u16→noms
  (1–2 voix, à finir), D0W007 orphelin (documenté, pas de meta),
  H2 avant/après TPage (runtime, PC-05 textures).

Zéro trou silencieux : tout ce qui n'est pas PROUVÉ ci-dessus est
nommé dans exactement une liste PC ci-dessus, avec sa méthode.

## 6. Règles et conventions reconduites pour R2

- Triplets read-only + arbitrage parent au `disasm`, 3x Grok
  (Spark révoqué par l'opérateur le 2026-09-12).
- `find`/`find_bytes`/`xrefs_to`/`lookup_funcs` : résultats
  négatifs ou arrondis TOUJOURS recroisés (faux négatifs
  documentés dans chaque vague R1).
- Registres R0 : lecture seule, SHA pins ; ne jamais régénérer
  `c0m-registry.json` in-place (timestamp).
- `fixtures/` : metas versionnés, blobs gitignorés ; extraction
  reproductible via `tools/extract_battle_fixtures.py
  --archive-dir <explicite>`.
- L3 exclu, KEEP 68 fermés (ouverts : aucun en R1 — `0x62C820`
  documenté 1 voix, pas typé), `runtime-only` interdit hors
  vrais runtime (listés HANDOFF §6), aucun commit sans demande.
