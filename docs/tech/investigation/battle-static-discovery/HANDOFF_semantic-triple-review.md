# Reprise — triple sémantique Grok 4.6 xhigh (2 analyses + 1 réconciliation) → IDB + commit

> Prompt de redémarrage, rédigé le 2026-09-15.
> Coller tel quel dans un **nouveau chat**. Première action : **§9**.
> Campagne **parallèle** à la décompilation GLM (`HANDOFF_glm-triple-review.md`)
> et à R1 (visionneur / `HANDOFF_R1-plan.md`).
> Pour **cette** campagne, ce document **prime** : QMD autorisé,
> commit après chaque réconciliation, reviewers = sous-agents Grok uniquement.
> Ne pas mélanger avec la campagne GLM : ici on ne produit **pas** de C,
> on confirme le **sens sémantique**.

## 1. Objectif

Pour chaque fonction de la file : une **analyse sémantique réconciliée**,
ancrée sur l'ASM live, l'arbre d'appel haut/bas, le pseudo-C Hex-Rays,
le C GLM réconcilié et la documentation — **poussée en résumé dans l'IDB**,
IDB **sauvegardée**, **livrable git commité** — sans perdre l'avancement.

Le livrable poussé est un **résumé sémantique** (rôle, confiance, preuves),
pas un listing C. Le C réconcilié `[glm-triple]` reste en place ; le résumé
sémantique s'ajoute avec le tag `[semantic-triple YYYY-MM-DD]`.
Hex-Rays est ici une **entrée** du pack (analyse de sens, pas reconstruction),
contrairement à la campagne GLM où il était exclu des hints.

## 2. Règles inviolables

1. **Français** dans le chat.
2. **Les trois reviewers sont des sous-agents `generalPurpose` / modèle
   `cursor-grok-4.6-xhigh` via `Task`.** Jamais de MCP `glm-decompile`
   pour l'analyse (aucun appel `glm_decompile_asm` dans cette campagne).
   Fallback : si le slug Grok est indisponible, **s'arrêter** et demander
   à l'opérateur (ne pas substituer Muse/GLM en douce).
3. **Orchestrateur = l'agent parent** (toi). Il ne fait pas l'analyse
   sémantique lui-même. Il **rassemble** arbre d'appel + ASM + proto +
   pile + callees + xrefs + wiki + Hex-Rays + C GLM, écrit le **pack**
   sur disque, puis émet **un prompt Task unique** par fonction.
4. **Même pack aux deux premiers Grok.** Aucun des deux ne voit l'autre.
   Les sous-agents **peuvent** approfondir via MCP (IDA, GrepAI, Serena,
   context-mode) et QMD CLI ; ils **n'écrivent pas** l'IDB ni git.
5. **Le troisième Grok** reçoit le **même pack** **plus** les deux analyses,
   avec l'ordre de réconcilier **contre l'ASM et l'arbre d'appel**
   (pas une moyenne esthétique).
6. **Deux Tasks Grok en parallèle, puis le troisième.** Une fonction à la
   fois dans le pipeline 2+1. Jamais 10 Grok xhigh d'un coup. File =
   **lots de 5 fonctions** ; à la fin des 5, prendre les 5 suivantes.
7. **Commit git après chaque troisième** (réconciliation + vérif parent +
   push IDB + `save_database` + fichier `semantic/`). Message :
   `semantic(battle): <EA> <nom-court>`. Pas de `--no-verify`. Pas de push
   remote. Pas d'amend. Ne **jamais** committer `tools/_tmp_semantic_triple/`
   (gitignore). Ne pas committer d'autres `M` user / benches.
8. **Pas de rename IDA** (catalogue / wiki / QMD). Pas de `patch` /
   `patch_asm`. Pas de `SetType` (déjà fait par la campagne GLM).
   N'écrase jamais un commentaire IDA existant : **append** du résumé
   avec le tag `[semantic-triple YYYY-MM-DD]`. Si le tag
   `semantic-triple` est déjà là → **skip** (ne pas retravailler).
9. **QMD CLI uniquement** (`qmd search` / `qmd get`, collection `ff8-wiki`).
   Jamais MCP QMD. Ne pas `qmd update` / `embed` / toucher l'index.
10. **ASM Intel + labels IDA** (`loc_`, `def_`, `jpt_`). Jamais AT&T.
11. **L3 interdit** : CRT, `fopen`, intérieurs GL/DDraw/DSound, `nullsub`,
    `GetSingletonAddress`, `OutputDebugString`, thunks IAT.
    Relinker, ne pas analyser un vendor.
12. **Serena** : ne jamais `activate_project`. GrepAI / IDA / context-mode
    du projet `re-ff8` uniquement.
13. PowerShell : pas de `head`/`tail`, `py -3` (pas `python -3`). Python
    inline fragile → script sous `tools/` si besoin, puis ne pas le
    committer s'il est `_tmp_*`.
14. Compteur dans le chat après chaque fonction :
    `sémantique k/N — <EA> <nom> — <confiance R>`.

## 3. Références

- Repo : `c:\Users\djden\source\repos\retro-eng\re-ff8`
- File d'attente : [`glm-mcp-function-budget.md`](glm-mcp-function-budget.md)
  (498 EA wiki) + ledger de certitude :
  [`semantic-certainty.md`](semantic-certainty.md)
- Packs GLM déjà faits (ne **pas** refaire) :
  `tools/_tmp_wave_review/glm_triple/` (local, gitignore) — ~300 fonctions,
  `c_a.c` / `c_b.c` / `c_c.c` / `c_reconciled.c` / `prompt_hints.txt`
- C réconciliés git :
  `docs/tech/investigation/battle-static-discovery/decomp/<EA>__<Name>.md`
- IDA MCP : `project-0-re-ff8-ida-pro-mcp`
  (`lookup_funcs`, `disasm`, `stack_frame`, `callees`, `xrefs_to`,
  `callgraph`, `decompile`, `py_eval`)
- GrepAI : `project-0-re-ff8-grepai`
  (`grepai_search`, `grepai_trace_callers`, `grepai_trace_callees`)
- IDB : `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64` — confirmer via
  `idc.get_idb_path()` ; `idc.save_database(idc.get_idb_path())`
  **après chaque push** (l'IDB est **hors git**)
- PE : `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`,
  SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`,
  base `0x400000`
- Livrable git par fonction :
  `docs/tech/investigation/battle-static-discovery/semantic/<EA>__<Name>.md`
- Preuve extra cluster modèles :
  `fixtures/edea_body/d7c016.meta.json`
  (`loader_va` = `0x5079B0` = `BattleModel_LoadEdeaBodyWithIntegratedWeapon`)
- Gap wiki : `tools/_tmp_wiki_func_gap_classified.json`
  (`name_only_known` = 37 candidats CERTAIN forts)
- Pièges Hex-Rays : `F_CHAR_DATA` / `BATTLE_SLOT_DATA` typés `__int16*`
  → strides 232/104 **faux** (vrais : 464 / `0xD0`)
- Pièges noms menteurs (vague 12 sept.) : `CountAlive*` = find-first ;
  `SelectRandomMagicFromStock` = get-qty, RNG = `0x4837E0` ;
  `LookupAbilityByIndex` = registraire de callback ;
  `ResetExecState` = thunk masque Party/Monster ;
  `SetPhaseFlag` = switch 5–10. Décrire le comportement ;
  ne pas tordre l'ASM pour coller au nom.

Avant le premier pack : `GetDynamicTools` une fois par namespace
(`project-0-re-ff8-ida-pro-mcp`, `project-0-re-ff8-grepai`),
puis `CallDynamicTool`. Ne pas inventer les schémas.

## 4. File d'attente

Source = [`semantic-certainty.md`](semantic-certainty.md), classes
**LIKELY / UNCERTAIN / CONFLICT**, **dans l'ordre d'adresse**, avec filtres :

**Prendre**

- `domain::`, `EnemyAI_*`, `Battle*`, `FFBattle*`, `main::FFBattle*`
- EA battle / présentation battle : `0x47xxxx`–`0x51Bxxx` (sauf L3)
- **Avec** `decomp/<EA>__*.md` (C réconcilié obligatoire en Phase 1)

**Sauter**

- Classe `CERTAIN` (ledger Phase 0) — déjà prouvée par la doc
- Classe `SKIP_L3` : CRT / vendor GL-DDraw / `OutputDebugString` /
  `GetSingletonAddress` / `nullsub` / `fopen` / thunks IAT
- Classe `SKIP_CHUNK` : les **14 chunk** (>600 instr.), protocole par
  région plus tard (même triple, une région = une « fonction »)
- Classe `SKIP_NODECOMP` : pas de C réconcilié `decomp/`
- Dossier existant sous `tools/_tmp_semantic_triple/0x*` **avec**
  `semantic_r.md` finalisé (reprendre sinon)
- Fichier déjà présent sous `semantic/<EA>__*.md`
- Commentaire de fonction IDA contenant `semantic-triple`

Les 498 du wiki **ne sont pas** tout le gisement (noms sans EA, sites
intérieurs, `docs/` hors QMD). **Cette campagne = la file ledger filtrée.**
Ne pas élargir tout seul.

## 5. Pipeline d'une fonction (obligatoire)

```
orchestrateur (parent)
    → pack contexte (IDA + GrepAI + QMD + Hex-Rays + GLM) sur disque
    → Grok-A et Grok-B en parallèle (même pack, aveugles)
    → Grok-R réconciliation (pack + semantic_a.md + semantic_b.md)
    → parent vérifie 3–4 ancrages (appels, strides, retour, polarité)
    → append IDA [semantic-triple] + save_database
    → écrire semantic/<EA>__<Name>.md
    → git add CE fichier + git commit
```

Une fonction = **trois** Tasks Grok, pas plus, pas moins.
Si A et B sont **quasi-identiques**, le noter dans le `semantic/` ; R
tourne **quand même** (copie commune ≠ vérité ASM).

Ne **pas** lancer les analyses de la fonction N+1 avant d'avoir commité
(ou dumpé UNCERTAIN) la fonction N.

### 5.1 Orchestrateur — pack à écrire (ordre imposé)

C'est **le** travail du parent. Les Grok reçoivent le dossier pack.

Dossier : `tools/_tmp_semantic_triple/<ea>/` (minuscules, ex. `0x47ca90/`).

1. `lookup_funcs` **par VA** (jamais le nom `domain::` seul) + `disasm`
   (paginer si >400 instr.) — listing Intel + labels → `asm.asm`
2. Prototype IDA + `stack_frame` → `meta.json`
3. **Bas** : `callees` + prototypes + `add esp` après chaque `call`
   (réutiliser `add_esp.txt` du pack GLM s'il existe) → `callees.txt`
4. **Haut** : `xrefs_to` (2–5 callers min ; plus si fan-in faible) ;
   `callgraph` profondeur 2 si le sens dépend du voisinage
   → `callers.txt`, `callgraph.json`
5. GrepAI `trace callers` / `trace callees` sur le **nom**
   (complément repo, pas vérité IDA) → `grepai.txt`
6. 2–3 globaux / structs touchés : **noms + strides + offsets connus**
   (`F_CHAR` 0x1D0, slot 0xD0, magie 32×5, occupancy groupes 1+2)
   → `globals.txt`
7. Wiki : `qmd search "<nom ou EA>" -c ff8-wiki -n 5 --files` puis
   `qmd get` des hits utiles + extraits `docs/` pertinents
   → `qmd_search.txt`, `wiki.md`
8. Hex-Rays (`decompile` IDA) → `hexrays.c`
9. GLM : copier `c_a.c` / `c_b.c` / `c_c.c` / `c_reconciled.c` +
   `decomp/<EA>__*.md` + `prompt_hints.txt` depuis le pack GLM
10. Fixtures DAT si cluster modèles (`d7c016.meta.json` pour
    `0x5079B0` / `0x507E20`) → `fixtures/`

Le parent ne colle pas l'ASM entier dans le chat. Le prompt Task pointe
le dossier pack (chemin absolu) et le contrat de sortie §5.2.

### 5.2 Deux premiers Grok (même pack, parallèle)

**Un seul message parent**, deux `Task` :

- `subagent_type`: `generalPurpose`
- `model`: `cursor-grok-4.6-xhigh`
- `run_in_background`: `false` pour le pilote ; `true` en cadence si
  l'opérateur veut paralléliser (2 max)
- Prompt : chemin pack + contrat de sortie ci-dessous + règles :
  ne pas écrire l'IDB ni git, ne pas voir l'autre analyse,
  MCP autorisés (IDA lecture, GrepAI, Serena lecture, context-mode,
  QMD CLI), français dans le rapport.

Contrat de sortie A/B (écrire `<pack>/semantic_a.md` resp. `semantic_b.md`,
puis rendre le même contenu dans la réponse) :

```markdown
# Sémantique <Name IDA> @ <EA> (analyse A|B)
- Rôle (1 phrase) : …
- Confiance : CERTAIN | LIKELY | UNCERTAIN | CONFLICT
- Nom catalogue : confirme | trop large | mensonger (+ proposition, markdown seul)
- In / Out / Effets : …
- Preuves (3–8) : caller / callee / stride / wiki / divergence Hex-Rays vs GLM
- Questions ouvertes : …
```

Aucun des deux n'a l'analyse de l'autre. Ne pas « améliorer » le pack
entre A et B.

### 5.3 Troisième Grok (réconciliation)

**Après** les deux retours. Même pack **plus** `semantic_a.md` et
`semantic_b.md`. Ordre : réconcilier **contre l'ASM et l'arbre d'appel**.
Sortie : `<pack>/semantic_r.md` (même contrat + section `Divergences A/B`
tranchées une par une). Si A et B sont identiques mais contredisent un
opcode, corriger.

### 5.4 Vérif parent avant push (court, obligatoire)

Pas un quatrième Grok. Checks ASM **live** (`disasm`) + arbre, au moins :

- [ ] chaque callee cité existe dans `callees` / `add esp` cohérent
- [ ] chaque caller cité existe dans `xrefs_to`
- [ ] stride `lea`/`shl` développé en nombre (pas `*232` si `*0x1D0`)
- [ ] polarité `setcc` et `ja`/`jb` vs `jg`/`jl` cohérente avec le rôle
- [ ] valeur de retour (AL vs AX vs EAX) compatible avec l'usage
- [ ] verdict nom (confirme / trop large / mensonger) justifié par ≥2 preuves

Échec d'un check **bloquant** → **ne pas pousser l'IDB**, écrire `semantic/`
en `UNCERTAIN`, **commit quand même** le dump (pour ne pas perdre),
passer à la suivante.

### 5.5 Push IDB (append only)

Via `py_eval` IDA, **après** §5.4 OK. **Pas** `set_comments`
(risque d'écrasement), **pas** `SetType`, **pas** de rename :

1. `idc.get_func_cmt(ea, 0)` ; si déjà `semantic-triple` → stop
2. Append : `\n[semantic-triple YYYY-MM-DD]\n` + résumé R
   (rôle + confiance + 3–8 preuves, 5–15 lignes) — **pas** de listing C
3. `idc.save_database(idc.get_idb_path())`

### 5.6 Fichier `semantic/` (git)

Un markdown par fonction :

```markdown
# <Name IDA> @ <EA>

- Confiance R: CERTAIN|LIKELY|UNCERTAIN|CONFLICT
- Nom catalogue: confirme | trop large | mensonger (+ proposition)
- A==B: oui|non
- Push IDB: oui|UNCERTAIN
- Preuves: <3–8 puces>
- Notes parent: <1–5 lignes, checks arbre/ASM, divergences A/B>

## Analyse réconciliée

<contenu de semantic_r.md>
```

Ne pas coller Hex-Rays ni l'ASM entier (l'IDB est la source).

### 5.7 Commit (PowerShell)

Après `git status` + `git diff` du **seul** fichier `semantic/` :

```
git add docs/tech/investigation/battle-static-discovery/semantic/<EA>__<Name>.md
git commit -m @"
semantic(battle): <EA> <nom-court>

"@
git status
```

N'ajouter **que** ce fichier (+ `semantic-certainty.md` si la classe
change après Grok). Si d'autres `M` apparaissent, les laisser.

## 6. Cadence « 5 par 5 »

1. Choisir **5** EA de la file filtrée (§4), dans l'ordre d'adresse.
2. Pour **chacune**, **en série** : §5 complet (2 Grok // → R → vérif →
   push → commit).
3. Rapport des 5 (tableau EA | confiance R | nom | 1 phrase).
4. Enchaîner les 5 suivantes **sans** redemander, jusqu'à fin de session
   ou file vide.

Le « deux Tasks puis le troisième » est **par fonction**. Ne pas lancer
cinq dual-analyses en parallèle.

## 7. Premier lot (issu du ledger Phase 0)

Ne pas recalculer à la main : le premier lot = les 5 premières EA de la
file Grok dans [`semantic-certainty.md`](semantic-certainty.md),
ordre d'adresse, filtre bataille, avec `decomp/`.
Le pilote (§9.3) valide le contrat sur **une seule** fonction avant
d'enchaîner le lot.

## 8. Pièges (vague du 12 sept. — ne pas retomber)

- Mêmes pièges que la campagne GLM (§8 du HANDOFF GLM) : noms menteurs,
  bit `0x40` inversé selon l'accesseur, `Battle_GetRandomInt` AL only,
  occupancy exec groupes 1+2, `lookup_funcs` par VA, strides Hex-Rays faux.
- Sémantique : un nom `domain::Battle*` n'est **pas** une preuve ;
  exiger callers + callees + wiki alignés avant `CERTAIN`.
- `callgraph` IDA peut exploser (ventilateur) : borner
  (`max_depth: 2`, `max_nodes` petit) et noter `TRUNCATED`.
- Les packs GLM `prompt_hints.txt` contiennent déjà des hints wiki :
  les **reciter** comme source, ne pas les prendre pour des faits.

## 9. Première action dans le nouveau chat

1. Lire ce document + [`semantic-certainty.md`](semantic-certainty.md)
   + le §7 (tête de file).
2. `idc.get_idb_path()` + `git status` (ne pas toucher aux
   `_tmp_wave_review`, `_tmp_semantic_triple`, ni aux `M` user).
3. Orchestrer **la tête de file** : pack §5.1 sur disque → deux Tasks
   Grok **dans le même tour** → puis R → vérif §5.4 → push + save +
   `semantic/` + **commit**. Compteur `sémantique 1/N`.
4. Enchaîner 2–5 du lot. Rapport des 5. Puis lot suivant.

Si IDA MCP down : s'arrêter, ne pas « pousser plus tard ».
Si le slug Grok est indisponible : s'arrêter, demander à l'opérateur.

## 10. Ce que ce plan n'est pas

- Pas une décompilation (aucun `glm_decompile_asm`, aucun C produit).
- Pas R1 (visionneur / fixtures golden) — ne pas exécuter `HANDOFF_R1-plan.md`.
- Pas un rename de masse, pas un ingest wiki (`qmd update` interdit).
- Pas un élargissement aux 14 chunk ni aux starts `docs/` hors QMD.
