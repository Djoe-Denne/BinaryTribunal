# Reprise — sémantique Grok 4.6 xhigh (1 analyse + review, escalade 2+1) → IDB + commit

> Prompt de redémarrage. Coller tel quel dans un **nouveau chat**.
> Première action : **§9**.
> Campagne **parallèle** à la décompilation GLM (`HANDOFF_glm-triple-review.md`)
> et à R1 (visionneur / `HANDOFF_R1-plan.md`).
> Pour **cette** campagne, ce document **prime** : QMD autorisé,
> commit après chaque fonction close, reviewers = sous-agents Grok.
> Ne pas mélanger avec la campagne GLM : ici on ne produit **pas** de C,
> on confirme le **sens sémantique**.
>
> Protocole révisé **2026-09-15** après 3 fonctions en 2+1 aveugle
> (`0x47CA90`, `0x47CCB0`, `0x47CE10`) : B n’a tranché un livrable
> qu’**une fois sur trois** ; le coût inutile = le second essai aveugle.
> Défaut = **1+V**. Le 2+1 reste le filet, pas le chemin normal.

## 1. Objectif

Pour chaque fonction de la file : une **analyse sémantique revue**,
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
2. **Reviewers = sous-agents `generalPurpose` / modèle `cursor-grok-4.6-xhigh`
   via `Task`.** Jamais de MCP `glm-decompile` pour l'analyse (aucun
   `glm_decompile_asm`). Fallback : slug Grok indisponible → **s'arrêter**,
   demander à l'opérateur (ne pas substituer Muse/GLM en douce).
3. **Orchestrateur = l'agent parent.** Il ne fait pas l'analyse sémantique
   initiale. Il **rassemble** arbre + ASM + proto + pile + callees + xrefs
   + wiki + Hex-Rays + C GLM, écrit le **pack** sur disque, lance les Tasks,
   fait la **vérif opcode live** (§5.6). En mode **1+P** seulement, il
   tient aussi lieu de review (pas un second essai narratif).
4. **Défaut = 1+V** : un Grok-A (pack seul) puis un Grok-V qui **voit A**
   et attaque A **contre l'ASM et l'arbre**, sans recopier le verdict nom.
   Les sous-agents **peuvent** approfondir via MCP (IDA, GrepAI, Serena
   lecture, context-mode) et QMD CLI ; ils **n'écrivent pas** l'IDB ni git.
5. **Pas de B aveugle en routine.** Le 2+1 (A ∥ B puis R) est une
   **escalade** (§5.5), pas le chemin par défaut.
6. Une fonction à la fois. Jamais 10 Grok xhigh d'un coup. File =
   **lots de 5** ; à la fin des 5, prendre les 5 suivantes.
7. **Commit git après chaque fonction close** (review V ou R + vérif
   parent + push IDB + `save_database` + fichier `semantic/`). Message :
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
    Relinker, ne pas analyser un vendor. Graphismes **Square** (OT, TIM,
    TPage, draw list, même préfixe `Gfx_*`) : **analyser** s'il y a un
    `decomp/` — voir [`PROMPT_semantic-triple-continue.md`](PROMPT_semantic-triple-continue.md).
12. **Serena** : ne jamais `activate_project`. GrepAI / IDA / context-mode
    du projet `re-ff8` uniquement.
13. PowerShell : pas de `head`/`tail`, `py -3` (pas `python -3`). Python
    inline fragile → script sous `tools/` si besoin, puis ne pas le
    committer s'il est `_tmp_*`.
14. Compteur dans le chat après chaque fonction :
    `sémantique k/N — <EA> <nom> — <confiance> (<mode 1+V|1+P|2+1>)`.

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
- EA battle / présentation battle : `0x47xxxx`–`0x51Bxxx` (sauf L3 vendor)
- Graphismes Square déjà en file Grok (`Gfx_Submit*`, draw-list/TIM/TPage
  **avec** `decomp/`) : **après** le lot battle en cours, ordre d'adresse
- **Avec** `decomp/<EA>__*.md` (C réconcilié obligatoire en Phase 1)

**Sauter**

- Classe `CERTAIN` (ledger) — déjà prouvée
- Classe `SKIP_L3` : CRT / vendor GL-DDraw / `OutputDebugString` /
  `GetSingletonAddress` / `nullsub` / `fopen` / thunks IAT / backend PC
- Classe `SKIP_CHUNK` : les **14 chunk** (>600 instr.), protocole par
  région plus tard (même 1+V, une région = une « fonction »)
- Classe `SKIP_NODECOMP` : pas de C réconcilié `decomp/`
- Dossier existant sous `tools/_tmp_semantic_triple/0x*` **avec**
  `semantic_v.md` ou `semantic_r.md` finalisé (reprendre sinon)
- Fichier déjà présent sous `semantic/<EA>__*.md`
- Commentaire de fonction IDA contenant `semantic-triple`

Les 498 du wiki **ne sont pas** tout le gisement. **Cette campagne = la
file ledger filtrée.** Ne pas élargir tout seul.

## 5. Pipeline d'une fonction (obligatoire)

```
orchestrateur (parent)
    → pack contexte (IDA + GrepAI + QMD + Hex-Rays + GLM) sur disque
    → choisir le mode (§5.2)
    → Grok-A (pack seul)
    → [défaut] Grok-V (pack + A)  OU  review parent 1+P  OU  escalade 2+1
    → parent vérifie ancrages live (§5.6)
    → append IDA [semantic-triple] + save_database
    → écrire semantic/<EA>__<Name>.md
    → git add CE fichier + git commit
```

Le parent **persiste** `semantic_a.md` / `semantic_v.md` / `semantic_b.md`
si le Task n'écrit pas le fichier (vu au pilote).

Ne **pas** lancer la fonction N+1 avant d'avoir commité (ou dumpé
UNCERTAIN) la fonction N.

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
le dossier pack (chemin absolu) et le contrat de sortie.

### 5.2 Choix de mode (avant A, révisé après A)

**Défaut : 1+V** (un analyste + une review adversariale). Deux Tasks
Grok, pas trois.

**1+P** (A puis **seulement** la vérif parent §5.6, pas de Grok-V) —
**tous** les critères :

- ≤ 80 instructions **et** une seule plage IDA (pas de chunks `jmp` hors
  fonction, contrairement à `0x47CCB0`)
- après A : confiance CERTAIN **et** nom = confirme
- §5.6 tout vert du premier coup
- aucune question ouverte qui change le rôle

Sinon rester en 1+V. Si A sort déjà trop large / mensonger / UNCERTAIN /
CONFLICT → **escalader en 2+1 sans passer par V** (B n'a pas vu A).

**Escalade 2+1** (§5.5) si **l'un** de :

- > 200 instr. **ou** plusieurs chunks IDA (`jmp` vers une plage qui
  n'est pas la fonction)
- A : nom trop large | mensonger, ou confiance UNCERTAIN | CONFLICT
- V désaccord avec A sur le **rôle**, le **nom**, ou la **confiance**
- §5.6 KO (callee/caller inventé, stride faux, polarité, AL vs EAX)
- V rend `ESCALADE_2+1`

Ne pas lancer A et B en parallèle **sauf** escalade 2+1.

### 5.3 Grok-A (analyse)

Un `Task` : `generalPurpose` / `cursor-grok-4.6-xhigh`. Pack seul.
Ne pas écrire l'IDB ni git. Français.

Contrat (écrire `<pack>/semantic_a.md`, recopier dans la réponse) :

```markdown
# Sémantique <Name IDA> @ <EA> (analyse A)
- Rôle (1 phrase) : …
- Confiance : CERTAIN | LIKELY | UNCERTAIN | CONFLICT
- Nom catalogue : confirme | trop large | mensonger (+ proposition, markdown seul)
- In / Out / Effets : …
- Preuves (3–8) : caller / callee / stride / wiki / divergence Hex-Rays vs GLM
- Questions ouvertes : …
```

Le nom catalogue n'est **pas** une preuve. CERTAIN seulement si callers +
callees + wiki alignés **et** opcodes cités.

### 5.4 Grok-V (review adversariale — défaut)

**Après** A. Même pack **plus** `semantic_a.md`. Ordre : **attaquer A
contre l'ASM et l'arbre**, pas reformuler A. Interdiction de copier le
verdict nom de A : le **re-dériver** depuis callers / callees (au moins
2 preuves). Si A et l'opcode divergent, l'opcode gagne.

Contrat (écrire `<pack>/semantic_v.md`, recopier dans la réponse) :

```markdown
# Sémantique <Name IDA> @ <EA> (review V)
- Verdict : ACCEPTE | CORRIGE | ESCALADE_2+1
- Rôle (1 phrase, le tien) : …
- Confiance : CERTAIN | LIKELY | UNCERTAIN | CONFLICT
- Nom catalogue : confirme | trop large | mensonger (+ proposition)
- Désaccords avec A (0–n, chacun un EA + opcode) : …
- Preuves (3–8) : …
- Questions ouvertes : …
```

- `ACCEPTE` : A collé à l'ASM ; `semantic_r.md` = A, éventuellement
  précisions mineures de V (constante, cmt IDA trompeur).
- `CORRIGE` : V écrit le livrable ; `semantic_r.md` = V (rôle / nom /
  faits corrigés).
- `ESCALADE_2+1` : ne pas pousser ; enchaîner §5.5.

V n'est **pas** un second essai aveugle : plus court, ciblé, hostile.

### 5.5 Escalade 2+1 (filet, pas le défaut)

Grok-B : **même pack que A**, **aveugle** (ne voit ni A ni V). Contrat
identique à §5.3, fichier `semantic_b.md`.

Puis Grok-R : pack + `semantic_a.md` + `semantic_b.md` (+ V si elle
existe). Réconcilier **contre l'ASM**, pas une moyenne. Sortie
`semantic_r.md` (contrat A + section `Divergences A/B` tranchées une
par une, opcodes). Si A et B sont identiques mais contredisent un
opcode, corriger.

Échantillon 2026-09-15 : le 2+1 n'a été **nécessaire** que pour
`0x47CCB0` (nom + occupancy). Ne pas y revenir par habitude.

### 5.6 Vérif parent avant push (court, obligatoire)

Pas un Grok de plus. Checks ASM **live** (`disasm` / `py_eval`) + arbre :

- [ ] chaque callee cité existe dans `callees` / `add esp` cohérent
- [ ] chaque caller cité existe dans `xrefs_to` (noter DATA vs code)
- [ ] stride `lea`/`shl` développé en nombre (pas `*232` si `*0x1D0`)
- [ ] polarité `setcc` et `ja`/`jb` vs `jg`/`jl` cohérente avec le rôle
- [ ] valeur de retour (AL vs AX vs EAX) compatible avec l'usage
- [ ] verdict nom justifié par ≥2 preuves (pas le nom IDA tout seul)

Échec **bloquant** → ne pas pousser l'IDB ; si pas déjà en 2+1,
**escalader** ; sinon écrire `semantic/` en `UNCERTAIN`, **commit
quand même** le dump, passer à la suivante.

La review utile = ces opcodes, pas une reformulation d'A.

### 5.7 Push IDB (append only)

Via `py_eval` IDA, **après** §5.6 OK. **Pas** `set_comments`
(risque d'écrasement), **pas** `SetType`, **pas** de rename :

1. `idc.get_func_cmt(ea, 0)` ; si déjà `semantic-triple` → stop
2. Append : `\n[semantic-triple YYYY-MM-DD]\n` + résumé V ou R
   (rôle + confiance + 3–8 preuves, 5–15 lignes) — **pas** de listing C
3. `idc.save_database(idc.get_idb_path())`

### 5.8 Fichier `semantic/` (git)

```markdown
# <Name IDA> @ <EA>

- Confiance: CERTAIN|LIKELY|UNCERTAIN|CONFLICT
- Nom catalogue: confirme | trop large | mensonger (+ proposition)
- Mode: 1+V | 1+P | 2+1
- A==V: oui|non|n/a (1+P)
- Push IDB: oui|UNCERTAIN
- Preuves: <3–8 puces>
- Notes parent: <1–5 lignes, checks arbre/ASM, pourquoi ce mode / escalade>

## Analyse réconciliée

<contenu de semantic_r.md>
```

Ne pas coller Hex-Rays ni l'ASM entier (l'IDB est la source).

### 5.9 Commit (PowerShell)

Après `git status` + `git diff` du **seul** fichier `semantic/` :

```
git add docs/tech/investigation/battle-static-discovery/semantic/<EA>__<Name>.md
git commit -m @"
semantic(battle): <EA> <nom-court>

"@
git status
```

N'ajouter **que** ce fichier (+ `semantic-certainty.md` si la classe
change après review). Si d'autres `M` apparaissent, les laisser.

## 6. Cadence « 5 par 5 »

1. Choisir **5** EA de la file filtrée (§4), dans l'ordre d'adresse.
2. Pour **chacune**, **en série** : pack → A → V (ou 1+P / 2+1) →
   §5.6 → push → commit.
3. Rapport des 5 (tableau EA | mode | confiance | nom | 1 phrase |
   A==V).
4. Enchaîner les 5 suivantes **sans** redemander, jusqu'à fin de session
   ou file vide.

Ne pas lancer cinq analyses en parallèle.

## 7. Premier lot (issu du ledger)

Ne pas recalculer à la main : file Grok dans
[`semantic-certainty.md`](semantic-certainty.md), ordre d'adresse,
filtre bataille, avec `decomp/`. État et tête de file : voir
[`PROMPT_semantic-triple-continue.md`](PROMPT_semantic-triple-continue.md).

Les trois premières (`0x47CA90`, `0x47CCB0`, `0x47CE10`) ont été faites
en **2+1** (protocole d'origine). À partir de `0x47CEF0` : **1+V**
(22 instr. : 1+P autorisé si A sort CERTAIN / confirme et §5.6 vert).

## 8. Pièges (vague du 12 sept. — ne pas retomber)

- Mêmes pièges que la campagne GLM (§8 du HANDOFF GLM) : noms menteurs,
  bit `0x40` inversé selon l'accesseur, `Battle_GetRandomInt` AL only,
  occupancy exec groupes 1+2, `lookup_funcs` par VA, strides Hex-Rays faux.
- Sémantique : un nom `domain::Battle*` n'est **pas** une preuve ;
  exiger callers + callees + wiki alignés avant `CERTAIN`.
- Review V : **biais de confirmation** si elle recopie le nom de A.
  D'où l'interdiction de copier le verdict nom. Occupancy « 3 ennemis »
  à `0x47CCB0` était dans A — V doit **chercher** le libellé des slots.
- `callgraph` IDA peut exploser (ventilateur) : borner
  (`max_depth: 2`, `max_nodes` petit) et noter `TRUNCATED`.
- Les packs GLM `prompt_hints.txt` contiennent déjà des hints wiki :
  les **reciter** comme source, ne pas les prendre pour des faits.

## 9. Première action dans le nouveau chat

1. Lire ce document + [`semantic-certainty.md`](semantic-certainty.md)
   + [`PROMPT_semantic-triple-continue.md`](PROMPT_semantic-triple-continue.md).
2. `idc.get_idb_path()` + `git status` (ne pas toucher aux
   `_tmp_wave_review`, `_tmp_semantic_triple`, ni aux `M` user).
3. Orchestrer **la tête de file** : pack §5.1 → mode §5.2 → A → V
   (ou 1+P / 2+1) → §5.6 → push + save + `semantic/` + **commit**.
4. Enchaîner le lot. Rapport des 5. Puis lot suivant.

Si IDA MCP down : s'arrêter, ne pas « pousser plus tard ».
Si le slug Grok est indisponible : s'arrêter, demander à l'opérateur.

## 10. Ce que ce plan n'est pas

- Pas une décompilation (aucun `glm_decompile_asm`, aucun C produit).
- Pas R1 (visionneur / fixtures golden) — ne pas exécuter `HANDOFF_R1-plan.md`.
- Pas un rename de masse, pas un ingest wiki (`qmd update` interdit).
- Pas un élargissement aux 14 chunk ni aux starts `docs/` hors QMD.
- Pas « le parent résume A » à la place d'une review opcode.
