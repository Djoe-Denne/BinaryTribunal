# Reprise — du plan graphique au plan de réécriture Battle Loop (`re-ff8`)

> Prompt de redémarrage + nouveau plan, rédigé le 2026-09-11 après clôture E3c.
> Coller tel quel dans un nouveau chat ; première action attendue : §9.
> L'ancien plan (`battle-static-discovery`, 12 phases, borné graphique) est
> **terminé dans son périmètre** et **remplacé** par le plan R0–R4 ci-dessous (§5).

## 1. Objectif final et bornes (décision utilisateur, 2026-09-11)

1. **But final : réécrire le code de Final Fantasy VIII, uniquement la Battle
   Loop, de l'entrée en bataille jusqu'à la sortie.** Le plan graphique
   n'était qu'une jambe de ce projet.
2. **Le graphe élargi (7514 nœuds) est un filet de preuve, pas un livrable.**
   Lecture imposée en couches : **L0 strict** (~1527 nœuds, code
   battle/présentation) + **L1** (tables) + **L2** (callbacks typés,
   registre `55bc0b13…`) = périmètre de réécriture. **L3** (CRT, moteur
   partagé, vendor, spillover field/world) est **explicitement abandonné** :
   le typage de masse des feuilles indeg 0–4 (`ve4-strategy`) est annulé.
3. **Relinker, pas reproduire.** Tout backend extérieur (OpenGL, Direct3D,
   D3D9 injectée, DLL custom type 2, CRT, OS) se linke à la compilation.
   Ne jamais décompiler leurs intérieurs. Ce qu'on reproduit : **les formats
   de données côté FF + la logique de scheduling/submit + les signatures
   exactes aux coutures (seams ABI)**.
4. **Premier consommateur : un visionneur de modèles** (charge un C0M + son
   TIM, joue un clip avec le renderer du projet). Il valide les formats
   avant d'attaquer la Battle Loop complète.
5. Métrique honnête : le « 28 % » du chat précédent = couverture lexicale du
   graphe élargi, **pas** l'avancement du rewrite. Ne le citer que avec cette
   réserve. Le §5 définit des critères de sortie mesurables par phase.

## 2. Règles inviolables (reprises et mises à jour)

1. **Réponds toujours en français.**
2. **Délégations : analyses principales en `cursor-grok-4.6-xhigh` ;
   contre-revues en `cursor-grok-4.6-xhigh` OU `muse-spark-1.3-max`**
   (aucun autre modèle ; si le user visait un autre modèle, demander avant).
3. **Chaque sujet = 1 analyse principale + 2 contre-revues indépendantes**,
   même tâche, en parallèle. Gros désaccord → résolveur read-only
   (Muse Spark Max autorisé) qui réduit à ≤25 `PARENT_CHECK`.
4. **Sous-agents strictement read-only** (ni IDB ni docs ni QMD). Le parent
   seul compare, arbitre **au désassemblage** (`disasm`, jamais Hex-Rays
   seul), puis mute.
5. **Ne fais jamais confiance aux rapports** : chaque divergence se tranche
   dans le PE/l'IDB avant écriture. `runtime-only` interdit pour masquer un
   trou statique.
6. **QMD appartient au user.** Ne jamais lancer QMD, ni le déléguer, ni
   toucher à son index/cache. `.manifest.json` : ne l'éditer que si la
   convention l'exige et de façon déterministe ; il est actuellement sale,
   le user le rafraîchit dans son flux.
7. **Avant toute écriture, relis `git status` + le fichier cible.** L'arbre
   est très sale (travail user en cours, §6) ; n'écrase jamais son travail.
8. **Serena** : projet actif `retro-eng` **ou** `re-ff8`, les deux OK ; ne
   jamais `activate_project` (instance poolée partagée).
9. **Ne revendique jamais 100 %** tant qu'il reste une inconnue statiquement
   résoluble. **Aucun commit git** sans demande explicite. Ne poll jamais
   les sous-agents : lance-les et attends les notifications.

## 3. Références

- Repo : `c:\Users\djden\source\repos\retro-eng\re-ff8`
- PE : `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`,
  SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`,
  base `0x400000`
- IDB : `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64` (**nouveau nom IDA 9.3**,
  ne plus supposer `FF8_EN.exe.i64` ; sauvegarder via
  `idc.save_database(idc.get_idb_path())`, une seule fois par apply)
- IDA MCP : namespace projet `project-0-re-ff8-ida-pro-mcp`
- Archives battle : `…\FINAL FANTASY VIII\Data\lang-en` (`battle.fi/fl/fs`)
- Sibling evidence : `c:\Users\djden\source\repos\retro-eng\FinalFantasy_VIII_Reimaginated\evidence`
  (toujours `--evidence` explicite, le défaut du script est faux)
- Ancien plan (archivé, ne plus suivre) :
  `C:\Users\djden\.cursor\plans\battle-static-discovery_8e547a9e.plan.md`
  (12 cases : 4 cochées, 8 en cours — voir §4 pour l'état réel)
- Registres (sur disque, **non versionnés**, `docs/tech/investigation/battle-static-discovery/`) :
  - `battle-graph-ledger.json` SHA `4bfb14965dddbf713435c961dd7858c4cb4a692ee0f40f07ed7af6882f125a38`
    (7514 nœuds, 5392 NIS, 1183 `table_named_unverified`, `code_edges_true` 42761,
    1771 `callback_candidate`, regen E3c)
  - `battle-indirect-registry.json` SHA `55bc0b13ae82694302eb26853924d095ccea4721c36a6f445f49a748b5a68de9`
    (493 sites, 0 PENDING, figé depuis E2 — hors périmètre E3)
  - `magic-registry.json` SHA `2815045b891e9543dcff4c2ec432d8fa24e329b35ff4ed1820e1cfc7fc2b472a`
    + `magic-registry-validation.json` (800 slots / 686 chunks, `pass`)
  - `c0m-registry.json` v1.2 SHA `7ef0ab55…` (filler partagé `90422600…41c`)
- Vérité opérationnelle : `docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md`
  (§12 acteurs/armes/anims pour le visionneur), `closure-audit.md`
  (audit + KEEP E3a/E3b/E3c + limites runtime), `corpus-audit.md`,
  `docs/tech/reference/address_catalog.md`, `docs/tech/systems/` (`battle_loop.md`,
  `battle_init.md`, `battle_slot_data.md`, `render_bridge.md`),
  `docs/tech/gforce/`, `docs/tech/reference/magic_effect_table.md`
- Wiki miroir : `obsidian-docs/projects/re-ff8/` (call graph, address catalog,
  pipeline rendu, ISO readiness, concepts battle) + `index.md` / `log.md`

## 4. État hérité — ce que l'ancien plan a clos (ne pas refaire)

**Fermeture structurelle ~90 % sur les corpus bornés :** 66 slots driver × 3
backends (52/52/57 écrites, matrice wrapper→impl = la couture à relinker) ;
9 records HUD `0x14` + 1 callback ; 163 stages (156 même-forme + 7 outliers),
23 IDs / 24 workers ; 400 Logic + 400 TextureLoad, 686 pointeurs distincts ;
200 C0M (144 utiles + 56 filler) ; 11 workers de séquence ; têtes OT reliées
au walker ; TIM 32 slots + flush VRAM ; swirl 72/82 ; mag.00/01 + 4 tables
MAG_331 ; parseur H4 ; H6 `+0x2C` ×2 ; AKAO stagée + latch.

**Typage des hubs terminé (269 renames + commentaires, 0 collision) :**
E3a 57 (GTE `GteState_*`, `Gte_NCLIP`/`AVSZ3`/`AVSZ4`, `BattleScratch_Unwind`
= inverse de `bs_modulo`), E3b 38+2 (`Gte_SQR`/`LZCS`, `Mat3S16_*`, LCG×2,
`Ot_EmitPolyF4_320x216`, re-bornage `MenuSprite_DrawCallback`
`0x4A0C00–0x4A0C7B`), E3c 174+174 commentaires (familles GTE/Q12, OT/GPU,
BattleUI/action/caméra, DSound vtable corrigée, `Gte_MVMVA` `0x460860`,
`MusicPerformance_IsSegmentPlaying` `0x46FA10`).

**Détail des vérités arbitrées :** inchangé depuis
[`HANDOFF_wave3-apply.md`](HANDOFF_wave3-apply.md) §4 (drivers, caméra/HUD/stages,
C0M, graphe, attaques, MagicList) + `closure-audit.md` (§E3a/E3b/E3c, errata
Widget, reports clôture). Ne pas re-débattre : appliquer/consulter.

**NIS restants : 5392**, dont indeg ≥5 : **68** (KEEP arbitrés, §6), indeg 1–4 :
3742, indeg 0 : 1582, racines NIS : 3 (`0x5088A0`, `0x5106E0`, `0x62C820`).
Tous les hubs traitables sont traités ; le reste est **hors périmètre par §1.2**.

**Domaine battle préexistant** (hors ancien plan, à inventorier en R0) :
`docs/tech/systems/battle_loop.md`, `battle_init.md`, `battle_slot_data.md`,
`render_bridge.md`, `battle_cleanup_and_reset.md`, expiration des statuts —
état exact à auditer, pas supposé.

## 5. Nouveau plan R0–R4 (remplace l'ancien)

### R0 — Figer le périmètre de réécriture (spéc, pas de RE de masse)

- Extraire le sous-graphe **L0 strict + L1 + L2** comme périmètre officiel :
  liste des fonctions, tables et callbacks à reproduire, avec VA et statut.
  L3 et feuilles indeg 0–4 hors L0 sont documentées comme exclues, pas typées.
- **Recensement entrée→sortie** : tracer la chaîne complète (transition in →
  init battle → loop → ATB/commandes → IA → dégâts/statuts → récompenses →
  transition out), marquer chaque maillon `documenté / typé / trou`.
- **Gap-analysis du domaine** : auditer `docs/tech/systems/` (init, ATB,
  commandes/menus/ciblages, VM IA, dégâts/statuts/popup, loot/XP,
  timers/RNG, chargement fichiers) et lister les trous bloquants pour un rewrite.
- Critère de sortie : périmètre L0/L1/L2 figé + recensement complet avec
  trous nommés + **premier pourcentage du rewrite qui veut dire quelque chose**.

### R1 — Fixtures golden + visionneur de modèles (premier binaire qui tourne)

- Fixtures byte-exactes : 1 corps générique + 1 monstre + 1 arme (layout
  sommets H2, canaux du bitstream clip, timing de lecture, patch TPage/CLUT
  via H11, queue slot-32 UV H4), + cas Edea et Zell/Kiros.
- Spéc visionneur : charge C0M + TIM, joue un clip, renderer projet
  (OpenGL/Vulkan à nous). Entrées = formats FF (§12 pipeline) :
  pose header `0x10` + os `0x30`, FK `0x508C90`, skinning rigide, état clip
  8 o, largeurs racine `{3,6,9,16}` / rotations `{3,6,8,12}`.
- Critère de sortie : visionneur qui affiche et anime les fixtures golden
  sans toucher aux backends FF.

### R2 — Seams ABI + specs de réécriture

- Figer les coutures : matrice 66 slots (appelables, pas intérieurs),
  champs draw-list, nœuds OT 24 o / paquets 32/40 o, formats caméra/stage,
  tables MagicList/DRAW, signatures des callbacks L2.
- Promouvoir dans `address-map.toml` **uniquement** les seams prouvés ;
  aucune RVA dans `ff8iso_core` sans preuve.
- Critère de sortie : un tiers peut implémenter un seam sans ouvrir IDA.

### R3 — Réécriture incrémentale de la Battle Loop

- Ordre : scheduling/submit (Director, BdLink, file de tâches, séquences)
  → présentation (OT, HUD, caméra, stages, acteurs, magie) → domaine
  (init, ATB, commandes, IA, dégâts, récompenses, sortie).
- Chaque module : spec → implémentation → tests contre fixtures/registres.
- Critère de sortie : Battle Loop complète entrée→sortie sur fixtures.

### R4 — Validation et clôture

- Comparaison comportementale vs originaux (traces, registres, fixtures
  malformed/fail-closed), audit indépendant final, archivage des plans.
- Critère de sortie : registre des écarts connus + zéro trou silencieux.

## 6. Dette restante explicite (à ne pas confondre avec des oublis)

- **68 hubs KEEP** (volontaires) : E3a 27 + E3b 6 + E3c 38 (dont racines
  `0x5088A0`, `0x5106E0`, `0x62C820`) — gros corps ou callee opaque, voir
  `closure-audit.md`. À rouvrir uniquement si R0 les déclare bloquants.
- **1183 `table_named_unverified`** : noms systématiques non audités un par un.
- **1771 `callback_candidate`** : à typer avant promotion en preuves (dans le
  périmètre L2 uniquement).
- **Ouverts bornés** : scanlines 490 DWORD sans clamp, cas 3 blend sans
  wrapper, layouts CAM globaux, writers A2 exhaustifs, Angelo/Moogle,
  `0x1852750`, producteur IP négatif, `+8`, walker corpus, HUD 2/6
  multiplexés, fixtures C0M/mag (reprises en R1).
- **Limites réellement runtime** (ne jamais chercher en statique) : DLL
  type 2, D3D9 injectée, backend actif, contenu frame, état GPU, gamma/
  color-key, parité pixel, timings exacts, hooks, BSS/RNG live.
- **Arbre sale au 2026-09-11** : ~28 fichiers `M` (docs, wiki, `.manifest.json`,
  `.cursor/mcp.json`), non versionnés `??` (`battle-static-discovery/`,
  pipeline, `tools/battle_*.py`, `ai-test/`, `.tmp/`, `.agents/skills/`).
  **Aucun commit sans demande explicite.**
- **QMD/manifest** : propriété du user (§2.6).

## 7. Transcripts (lire via `Read`, jamais hors workspace)

- Chat vague 3 (18 rapports) : `C:\Users\djden\.cursor\projects\c-Users-djden-source-repos-retro-eng-re-ff8\agent-transcripts\9d143d47-8044-417b-a60c-ff3bd8ab02b6\`
  (IDs des 18 subagents : [`HANDOFF_wave3-apply.md`](HANDOFF_wave3-apply.md) §8).
- Chat campagnes VA→E3c (compacté) : `…\agent-transcripts\8fe1607d-95ab-4404-8f0b-a043f4bc706e\`
  + `subagents/` : E3c principal `2090d8ea-…`, CR familles `8de8c8c8-…`,
  CR comptes `8877deef-…`, résolveur `2060b50b-…` (table 170 ACCEPT / 38 KEEP /
  4 PARENT_CHECK + 8 erreurs du principal réfutées), apply `94eebc1e-…`.
  Lire la fin des `.jsonl` (le rapport final est dans les derniers messages).

## 8. Pièges (anciens + nouveaux, ne pas retomber dedans)

Hex-Rays ment (`0x507080` cache `sub ebx,0x1000`, `0x50633D` a `ecx=0x8000`
constant, faux clones rel32 sur les wrappers) : toujours confirmer au `disasm`.
`lookup_funcs` recopie parfois l'adresse / échoue sans namespace
(`main::FFBattleModule`, `domain::BattleAction_GetText` : requêter par VA).
`xrefs_to` rate des LEA, `find_bytes` a des faux négatifs. Batchs rename
partiels : traiter les erreurs une par une. `0x48D200` reste
`domain::BattleAction_GetText` (ne pas restaurer `GetText`). Interdits de
rename : `setSomeDword*`, `bs_modulo`, `0x45F270`, `0x56C600`, `0x56C270`,
`0x701270` et KEEP du §6. Indeg ledger = sites BFS `direct_call|tail`
(≠ `XrefsTo` IDA ≠ callers uniques). IDB 9.3 : chemin avec ` - 9.3` ;
sauvegarde unique via `idc.save_database`. Manifest vault : JSON à BOM
(`utf-8-sig`), clés dupliquées silencieuses. PowerShell : pas de `head/tail`,
`py -3` (pas `python -3`), Python inline fragile → script sous `.tmp/` puis
suppression. Git : warnings CRLF sur `magic_effect_table.md` / `battle_init.md`
— ne pas « corriger » les fins de ligne. Clones : forme = CFG/mnémoniques,
jamais bytes bruts (hash relocation-aware).

## 9. Première action attendue dans le nouveau chat

1. Lire ce document + `closure-audit.md` + §12 du pipeline, vérifier
   `git status`, PE SHA et chemin IDB réel via `idc.get_idb_path()`.
2. Lancer **R0** : extraction du périmètre L0/L1/L2, recensement
   entrée→sortie, gap-analysis du domaine — puis proposer le découpage
   opérationnel (triplets read-only + arbitrage parent, modèles §2.2).
3. Rendre compte en français, avec preuves (VA + octets + xrefs), sans commit,
   sans QMD.
