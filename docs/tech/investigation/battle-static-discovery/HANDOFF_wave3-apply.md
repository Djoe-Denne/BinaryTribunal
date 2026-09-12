# Reprise — clôture statique du pipeline graphique battle FF8 (`re-ff8`)

> Prompt de redémarrage, rédigé le 2026-09-10 après les vagues 1–3 + ingest wiki.
> Coller tel quel dans un nouveau contexte ; première action attendue : §5, puis §6a–b.

## 1. Mission et état global

Tu reprends la campagne **battle-static-discovery** : fermer exhaustivement, en **statique uniquement** (PE + IDB, jamais de live), le pipeline graphique du mode battle de FF8 PC. Trois vagues d’analyse sont **terminées et arbitrées** (vagues 1–3). Le plan d’origine est suivi dans `C:\Users\djden\.cursor\plans\battle-static-discovery_8e547a9e.plan.md` (12 cases : 4 cochées, 8 en cours — voir §7).

**État exact à ta prise de poste :**
- `wave3-arbitrate` : **terminé** (18/18 rapports confrontés au PE/IDB par le parent).
- `wave3-apply` : **partiel**. Seul le sujet **MagicList** est appliqué (IDA + docs + wiki). Les **5 autres sujets** (Drivers, Caméra/HUD/Stages, C0M, Graphe, Attaques) sont arbitrés mais **ni l’IDB ni `docs/tech` ne les contiennent** — ils n’existent que dans les transcripts, ce prompt, et le wiki (qui devance les docs, assumé).
- 3 micro-vérifications read-only restent à faire avant l’application (§5).
- Wiki + QMD `ff8-wiki` : ingest complet fait le 2026-09-10 (4 pages créées, 10 mises à jour, 192 chunks / 18 docs, smoke tests au vert).

## 2. Règles inviolables

1. **Réponds toujours en français.**
2. **Délégations : analyses principales en `cursor-grok-4.6-xhigh` ; contre-revues en `cursor-grok-4.6-xhigh` OU `muse-spark-1.3-max`** (Muse Spark Max, autorisé pour les revues/contre-revues — voir note modèle ci-dessous ; aucun autre modèle).
3. **Chaque sujet = 1 analyse principale + 2 contre-revues indépendantes**, même tâche, en parallèle.
4. **Sous-agents strictement read-only** (ni IDB ni docs). Toi seul (parent) compares, arbitres au désassemblage, puis mutes.
5. **Ne fais jamais confiance aux rapports** : chaque divergence se tranche dans le PE/l’IDB avant écriture.
6. **Astra travaille en parallèle** (agent Codex séparé, ChatGPT 6 X-high) : avant toute écriture, relis `git status` + le fichier cible ; n’écrase jamais son travail.
7. **Serena** : projet actif `retro-eng` **ou** `re-ff8`, les deux sont acceptables ; ne t’arrête pas pour ça ; ne fais jamais `activate_project` (instance poolée partagée).
8. **Statique PE/IDB uniquement.** Ne transforme jamais un trou d’analyse en `runtime-only`.
9. **Ne revendique jamais 100 %** tant qu’il reste une inconnue statiquement résoluble.
10. **Aucun commit git** sans demande explicite. Ne poll jamais les sous-agents : lance-les et attends les notifications.

> **Note modèle.** L’autorisation utilisateur dit « muse spark max 1M » ; aucun slug ne porte littéralement ce nom. Slug valide à utiliser : `muse-spark-1.3-max` (Muse Spark Max). Si l’utilisateur visait un autre modèle, lui demander avant de lancer.

## 3. Références

- Repo : `c:\Users\djden\source\repos\retro-eng\re-ff8`
- PE : `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`, SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, base `0x400000`
- IDB : `D:\Modding\ff8\retro-exe\FF8_EN.exe.i64` (sauvegardée après vagues 1-2 et après MagicList)
- Archives battle : `…\FINAL FANTASY VIII\Data\lang-en` (`battle.fi/fl/fs`, hashes épinglés dans `c0m-registry.json`)
- Sibling evidence (correct) : `c:\Users\djden\source\repos\retro-eng\FinalFantasy_VIII_Reimaginated\evidence` — le défaut du script (`repos/…`, sans `retro-eng/`) est **faux**, toujours passer `--evidence` explicite
- Transcripts : `agent-transcripts/9d143d47-8044-417b-a60c-ff3bd8ab02b6/` (+ `subagents/` : les 18 rapports vague 3, IDs §8). Chemin absolu : `C:\Users\djden\.cursor\projects\c-Users-djden-source-repos-retro-eng-re-ff8\agent-transcripts\9d143d47-8044-417b-a60c-ff3bd8ab02b6\`
- Registres (reproduits, sur disque, non versionnés) : `docs/tech/investigation/battle-static-discovery/` — `magic-registry.json` (SHA `30c9cea2…`, validateur `pass` 800 slots/686 chunks), `c0m-registry.json` (v1.2, SHA `7ef0ab55…`), `battle-graph-ledger.json` (v1.1, SHA `7b0063a4…`, regens post-PH9/PH10/VA)

## 4. Vérités arbitrées — ne pas re-débattre, appliquer

**Drivers (66 DWORD, `calloc(1,0x108)`).** Slots 9–14 = état inline (vec4 clear `+0x28–34`, DDraw `+0x24`/`+0x38`), seul 15 inerte. Slot 34 = hook vide (wrapper `0x41E7A5`, **pas une fonction**, 0 xref). Slot 36 (`0x41E803`, caller `0x416045`) = override avec fallback slot 35. Slot 29 : GL/DD = shadow `*(engine+2692)[type]`, seul Alt appelle D3D (commit GPU = slot 30). Slot 39 SelectTarget (Alt exige `engine+2300`), 40 Begin, 41 différencié (GL clear flag / DD unlock / Alt EndScene), 4 present (écrit après 5–8). Slot 6 = thunk `(1,1,1)`→slot 5. Slots 16/17 = alloc/écriture table draw-list (noms « SoundData » faux). Slot 19 DDraw = stub 5 octets (nom CRT faux). 21–24/65 = cases vtable Alt (corps 22/23 aussi appelés hors vtable). Binder unique `0x41619A` (caller unique `0x41730A`), type 16 non bindé. Backend type 2 : writer `0x409805` présent mais **0 caller statique**. Interdire la notation `+16` décimale ambiguë ; distinguer `drawlist[39/40]` vs `driver[39/40]`.

**Caméra/HUD/Stages.** 66 `or byte …,80h` (8 centraux + 58 = **1 opcode MAG cloné** takeover+IP+2, 14 promus + 44 à créer) + `0x50633D` (`or word …,cx`, `ecx=0x8000` constant — plus « variable »). Pool 2 nœuds×16 + 2 records `0x524` ; overflow latent → `0x1D981F0` (cache look-at **vivant**). Borne 32 = layout + `float v31[32]` (`0x50D060`) ; parseur sans clamp, pas d’encodeur CAM dans l’EXE. `ReturnBlendTick` 0→2 sur liste aux 16×44. Bits 0–6 = masque 7 acteurs (plus « low 5 bits »). `BYTE2∈{2,3}` sans writer ; `0x2000` exclu du test script-actif ; espace `0xFB` ; header FOV/roll. HUD : 32 calls slots 1–8 (17/9 **incluent des teardowns NULL**), `0x1D766F0` = QWORD flags (pas 10ᵉ callback). Stages : 163 wrappers = 156 même-CFG + famille 44/45/46 + 4 singletons ; 140 triviaux ; 23 IDs / 24 workers (147 double). Forme = CFG/mnémoniques, **jamais** bytes (163 hashes distincts).

**C0M.** Byte-exact, 0 écart. 200 noms / 144 câblés / 56 fillers. `C0M127` = overlay info-380 + IA-64 **réutilisant le record 142** (pas copie d’octets). H5 = séquences ; **H6 = collection caméra** (consommateurs `0x505F00`/`0x506190`/`0x5064F0`, record `+44`) ; H9 = table AKAO format-prouvé **sans consommateur direct** (`0x501C60` = reset global) ; H10 = AKAO extra ou vide ; H4 = 37 présents sans parseur. TIM : party H6, Edea H9, monstre H11, arme std H7, Zell/Kiros H5 (H1=mesh, inline type-1, pas de `0x507010`). Dispatch `0x507080` avec `sub ebx,0x1000` (Hex-Rays le cache). Pool `0x1D99768` = 11×`0x34` typé partagé (≠ 11 acteurs). Listes party = stream `u16` packé `0xB8B89C–914`.

**Graphe.** Ledger rejoué à l’identique. `code_edges=44249` **double-compte** (vrai code 42516). Racines explicites = **162 uniques** (pas 156 ; les 6 GF high exclues par erreur de calendrier). 599 sites = **169 IAT directs + 430 vrais**. Les 1733 `callback_candidate` sont tous vrais-positifs slot-corrects, mais l’heuristique est incomplète (40 hors-fenêtre, wrapper `0x506C10` manquant, 63 `push eax`, 709+190 hors-BFS, 58 completions `BattleFile_preLoad` + store `0x482870`, `off_C816A4`, HUD/draw-list/vtables, 14 `call [reg+8]` non-Pump). Couches imposées : L0 strict (~1527 nœuds / 165 non-IAT), L1 +tables, L2 callbacks typés, L3 récursion (7618, contaminé CRT/moteur). Bannir `156/1978/5035/1525/167` mélangés. IDB≠PE : `0x47D4AF`→`0x4868C0`, `0x47D539`→`0x48D0E0` (restaurer **uniquement** ces 2×5 octets ; les 502 octets / 87 plages globaux sont des patches historiques à ne pas toucher). 6 cibles code-as-data (`0x5857D0`, `0x5A5890`, `0x5A6D20` certaines + `0x5FFFE0`, `0x606DB0`, `0x56FE10` à vérifier §5). 8 indirects action fermés vers `MagicList_Logic`. [v1.1 regen 2026-09-10 : 7470 nœuds, 42561 code vrai (42519+42), 1765 candidats, 481+8 indirects (76 IAT + 405 vrais), stop-set CRT 66 ; dispatch-VM `0x504BB0`→`0x50DB40` documenté comme trou.]

**Attaques.** Payload 20 o : `+0` slot, `+1` route (snapshot GetText, ≠ pending ≠ `0x1D27AD9`), `+2` anim, `+3` caméra, `+4` cmd_arg, `+6` effect_id, `+8` events, `+0xC` texte, `+0x10` count, `+0x11` group_count−1 ; events stride `0x18`. Routes : `0x00`≠Attack (type 0 = fail ; Attack=1 → défaut), `0x26/0xF4/0xFE`=MiniMog/Chocobo/GF→cinématique sauf `+4∈{15,70}`→Generic+`0x0B`+`0x40000000`, `0x1C`=OR `0x10000000` puis défaut, défaut ordonné `0xFFFF→+6=0→+2`, `0xFC` direct. Resolver : 5 callers (C4×4 + C0), C8 = backup, F7/F1/ED/EE = **sticky C4**. Frontière : `0x494410` = commit HP à la résolution ; `0x493D80` = sync d’impact (F_CHAR/statuts/crisis/mug/blow-away/GF, **pas** rewrite HP slot ennemi) ; popup jamais mutagène ; opcodes script `0xAA/0xB2/0xB7`.

**MagicList (appliqué, pour mémoire).** 343+343, 686 distinctes, 0 thunk, groupes 94/14/17. 5 routes 82/58/111/84/8. Loaders : 265×1 (dont Phoenix étendu) / 58 paires / 17 `ret` / Tonberry 3 / Devour 5 / Cactuar alt. Fin de FamilyA/Atypical et du « byte-for-byte » Alexander/Meteor. 8 renoms + 12 commentaires posés, IDB sauvegardée ; cascade Angelo différée (collisions slots 8/13/84/85).

## 5. D’abord : 3 micro-vérifications read-only restantes

1. Scanner les **44 starts** stubs caméra : confirmer le pattern 21 o (`A1 …66810D…80 …83C002…A3…C3`) sur chacun avant création en masse (1 seul vérifié : `0x8E56F0` ; liste des 44 starts dans le transcript du principal caméra/HUD/stages).
2. Lire les premiers octets de `0x5FFFE0`, `0x606DB0`, `0x56FE10` : prologue → à créer, sinon data → à classer.
3. Gilgamesh : confirmer `sub_596B70`/`sub_592300` partagés par scan `push` (les `CodeRefsTo` sont vides) ; documenter 225 entries vs 305 sites comme unités différentes.

## 6. Ensuite : finir `wave3-apply` (5 sujets, une passe consolidée)

Ordre : (a) micro-vérifications §5 → (b) batch IDA unique + **une** sauvegarde via `idc.save_database(path)` (`ida_loader.save_database` échoue sous `py_eval`) → (c) docs (relire chaque cible : Astra) → (d) outils v1.1 + régénération registres → (e) validations (`py_compile`, validateur Magic vs PE, `git diff --check`, lints, recherche d’affirmations obsolètes) → (f) re-ingest wiki (hash-driven).

- **IDA** : créer 44 stubs + 3–6 callbacks ; `0x41E7A5`→hook slot 34 (créer la fonction d’abord) ; types `0x21DFEC0/C4/C8`, `node+8` au pump `0x508434`, `0x1D768D0` ; renoms attaques (`0x50A670`, `0x506BA0`, `0x50A690`, `0x50A6C0`, `0x50AE80`, `0x50AED0`, `0x50AFC0`, `0x505C00`, + `0x504BB0`/`0x504290`/`0x47ED00` si soutenus) ; renoms C0M (`0x5073D0` allocateur, `Battle_LoadWeaponry`→`BattleModel_*`) ; restaurer 2×5 octets §4 puis réanalyser le chunk ; commentaires d’arbitrage partout. Noms non arbitrés = tu décides, prudence > exhaustivité.
- **Docs** : `battle_loop_render_pipeline_entrypoints.md` (§4 matrice, §7 payload/routes, §11 HUD/caméra/stages, §12 C0M/armes, §14–15 limites/graphe), `closure-audit.md` (dettes soldées : 8 indirects, 74 positions, takeovers, C0M127, couches graphe), `address_catalog.md` + satellites (`render_bridge.md`, `battle-lifecycle.md`, readiness).
- **Outils** : `battle_c0m_registry.py` (rôles H5/H6/H9/H10, fillers `exe_unwired`, C0M127 info+AI, `useful_payloads` calculé, VA de preuve), `battle_static_graph_ledger.py` (compteurs séparés, split IAT, `jmp` comptés, stop-set CRT, lexique `table_named_unverified`).

## 7. Puis : ce qui reste à découvrir (campagne suivante)

Véritables inconnues statiques, par priorité : **(1) Phase 10 textures/transitions** (cache TIM/CLUT/TPage, VRAM, swirl params/durée, scanlines `0x559750`, sortie/récompenses/`btitle.ovl`) — la plus faible ; **(2) Phase 9 formats** (sections `.00`, opcodes `.01`, parsers H4/H6, lecteurs H9/H10, table `byte_B8B6EC`) ; **(3)** mapping table `SetRenderState`→enables GL, slot 33 cas 0/2/3, sémantique liste type 16, persistance `SubmitDisplayLists`, parité FVF Alt ; **(4)** ~120 noms `MagicList_*`, tables opcodes FamilyB sœurs, ticks SharedInit, assets des 17 FL `ret` ; **(5)** classification des 599 indirects + ~5900 nœuds, `BYTE2∈{2,3}`, `+04` HUD, corpus CAM (max réel, faisable via `battle.fs`) ; **(6)** corps `GetText` `0x48D200`, opcodes `0x504BB0<0x80`. Vraiment runtime : corps DLL type-2, D3D9, backend actif, contenu frame, état GPU/parité pixel, timings, hooks, BSS, RNG live. Protocole : triplets read-only + arbitrage parent, modèles §2 règle 2.

## 8. Transcripts vague 3 (lire les rapports via `Read`, jamais `ctx_execute_file` hors workspace)

Graphe : `15780168-fa26-494c-b933-95c4c303fd37` (principal), `e3db7d85-64a8-4781-bcbb-63a6f6f8c27e` (racines), `16a81894-de58-4309-a76a-592813095618` (callbacks). MagicList : `c9f288a9-8a23-42b9-a2dc-a190062ac7b9`, `35952b9a-9865-4596-a94b-e64ad6559f56`, `e5dcbad3-5976-4c60-8ab9-5e798f0147ba`. C0M : `ff7b8f7c-4f49-4a4d-a806-3e02e88ce55e`, `406fdfd2-4b58-48e2-9886-d04ddef537dd`, `5182845e-1667-4c86-b314-c034694c8299`. Drivers : `c47502b6-5465-4f72-bb93-7c89812d8a62`, `c84d7193-aba7-4012-aa58-2aed577c59a4`, `d359fde2-bcbf-451c-b9a5-ae90aca3ecc9`. Attaques : `eea110ba-da42-4615-8863-a7bf08a76ed6`, `86012a89-d9fa-42e2-bf9c-9883ced8aea6`, `3e754c31-d437-4099-90ee-ea9b3e1ebd27`. Caméra/HUD/Stages : `70f502d5-bfb5-4cc1-b226-513d1c451716`, `f4f611ed-cb9d-4d91-9c7c-464daf8fda97`, `b07bd7ab-f934-4cbf-bb44-c6b737a5f96a`. Dossier : `C:\Users\djden\.cursor\projects\c-Users-djden-source-repos-retro-eng-re-ff8\agent-transcripts\9d143d47-8044-417b-a60c-ff3bd8ab02b6\subagents\<id>.jsonl` (lire la fin du fichier : le rapport final est dans les derniers messages).

## 9. Pièges connus (ne pas retomber dedans)

Hex-Rays ment sur `0x507080` (`sub 0x1000` caché), `0x50633D` (`ecx` constant), les wrappers (faux clones rel32) : toujours confirmer au `disasm`. `lookup_funcs` avant tout rename (collisions, ex. Angelo) ; les batchs rename peuvent réussir partiellement — traiter les erreurs une par une. Manifest vault : JSON à BOM (`utf-8-sig`), clés dupliquées silencieuses — vérifier l’unicité après édition. PowerShell : pas de `head/tail`, `py -3` (pas `python -3`), Python inline fragile → script sous `.tmp/` puis suppression. QMD : passer par le script avec `--evidence` explicite ; pattern log `INGEST` puis `QMD_COMPILE`. `ctx_execute_file` confiné au workspace. Serena : `initial_instructions` + `get_current_config` puis usage normal. Git : 2 fichiers avec warnings CRLF (`magic_effect_table.md`, `battle_init.md`) — ne pas « corriger » les fins de ligne au passage.

## 10. Documents écrits — cross-références

- `docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md` (619 lignes, état vagues 1-2 — §5+§6 à appliquer)
- `docs/tech/investigation/battle-static-discovery/` : `closure-audit.md`, `corpus-audit.md` (MagicList à jour), `magic-registry.json`, `c0m-registry.json`, `battle-graph-ledger.json`, `magic-registry-validation.json`
- `docs/tech/reference/magic_effect_table.md`, `docs/tech/reference/address_catalog.md` (MagicList à jour)
- `docs/tech/gforce/gf_asset_loading.md`, `gf_families.md`, `gf_catalog.md` (MagicList à jour)
- `docs/tech/systems/battle_init.md`, `battle_loop.md`, `battle_slot_data.md`
- `tools/battle_static_registry.py`, `tools/validate_battle_static_registry.py`, `tools/battle_c0m_registry.py`, `tools/battle_static_graph_ledger.py` (non versionnés ; v1.1 C0M/graphe en attente)
- Wiki : nouvelles `references/battle-render-pipeline-entrypoints.md`, `references/c0m-monster-archives.md`, `references/battle-static-call-graph.md`, `concepts/battle-action-sequencing.md` ; mises à jour `battle-lifecycle.md`, `battle-camera-architecture.md`, `gforce-cinematic-architecture.md`, `gforce-catalog-and-families.md`, `gf-asset-loading-and-authoring.md`, `damage-status-pipeline.md`, `battle-address-catalog.md`, `battle-loop-iso-readiness.md`, `_staging/investigations/battle_camera.md`, `re-ff8.md`, `index.md`, `log.md`, `.manifest.json`

Première action attendue : exécuter §5, puis §6a–b. Rends compte en français, avec les preuves (VA + octets + xrefs).
