# Reprise — triple GLM `glm53-flash` (2 gens + 1 réconciliation) → IDB + commit

> Prompt de redémarrage, rédigé le 2026-09-12.
> Coller tel quel dans un **nouveau chat**. Première action : **§9**.
> Campagne **parallèle** à R1 (visionneur / `HANDOFF_R1-plan.md`).
> Pour **cette** campagne, ce document **prime** : QMD est autorisé,
> commit après chaque réconciliation, reviewers = GLM uniquement.
> Ne pas mélanger avec la vague Grok/GLM mixte du 12 sept.

## 1. Objectif

Pour chaque fonction de la file : un **C réconcilié fidèle à l’ASM live**,
**poussé dans l’IDB**, IDB **sauvegardée**, **livrable git commité** —
sans perdre l’avancement.

Le C poussé est le livrable (prototype `SetType` + listing C sur la
fonction). Hex-Rays reste un **vérificateur**, jamais une entrée GLM.
IDA n’accepte pas de remplacer le listing Hex-Rays : le prototype typé
est la vérité de type ; le C réconcilié va en **commentaire de fonction**.

## 2. Règles inviolables

1. **Français** dans le chat.
2. **Les trois reviewers sont `glm53-flash` via MCP `glm-decompile`.**
   Jamais Grok, jamais Muse, jamais un `Task` Cursor (aucun slug GLM
   dans les subagents). Fallback `glm53` seulement si `glm_health`
   échoue **et** que le user n’a pas dit d’arrêter.
3. **Orchestrateur = l’agent parent** (toi). Il ne décompile pas. Il
   **rassemble** ASM + proto + pile + callees + xrefs + wiki, puis émet
   **un prompt unique** (champs `asm` + `context_hints`).
4. **Même prompt aux deux premiers GLM.** Aucun des deux ne voit l’autre.
   Température **0.2** (temp 0 → copies identiques, la double gen ne sert
   à rien). `reasoning_effort: auto`. `max_tokens: 0`.
5. **Le troisième GLM** reçoit le **même contexte** (`asm` identique,
   mêmes hints de base) **plus** les deux C, avec l’ordre de réconcilier
   **contre l’ASM** (pas une moyenne esthétique). Température **0.0**.
6. **Deux jobs GLM en parallèle, puis le troisième.** Une fonction à la
   fois dans le pipeline 2+1. Jamais 10 GLM d’un coup. File = **lots de
   5 fonctions** ; à la fin des 5, prendre les 5 suivantes.
7. **Commit git après chaque troisième** (réconciliation + push IDB +
   `save_database` + fichier `decomp/`). Message :
   `decomp(battle): <EA> <nom-court>`. Pas de `--no-verify`. Pas de push
   remote. Pas d’amend. Ne **jamais** committer `tools/_tmp_wave_review/`
   (gitignore). Ne pas committer d’autres `M` user / benches.
8. **Pas de rename IDA** (catalogue / wiki / QMD). Pas de `patch` /
   `patch_asm`. N’écrase jamais un commentaire IDA existant : **append**
   du listing C avec le tag `[glm-triple YYYY-MM-DD]`. Si le tag
   `glm-triple` ou `reconstructed-C` est déjà là → **skip** (ne pas
   retravailler).
9. **QMD CLI uniquement** (`qmd search` / `qmd get`, collection `ff8-wiki`).
   Jamais MCP QMD. Ne pas `qmd update` / `embed` / toucher l’index.
10. **ASM Intel + labels IDA** (`loc_`, `def_`, `jpt_`). Jamais AT&T.
    Hex-Rays = vérif **après** coup, **pas** dans `context_hints`.
11. **L3 interdit** : CRT, `fopen`, intérieurs GL/DDraw/DSound, `nullsub`.
    Relinker, ne pas décompiler un vendor.
12. Skill : `.agents/skills/glm-decompile/SKILL.md`. Checklist strides /
    `setcc` / `add esp` / sentinelles **avant** le push.
13. **Serena** : ne jamais `activate_project`. GrepAI / IDA / GLM MCP
    du projet `re-ff8` uniquement.
14. PowerShell : pas de `head`/`tail`, `py -3` (pas `python -3`). Python
    inline fragile → script sous `tools/` si besoin, puis ne pas le
    committer s’il est `_tmp_*`.

## 3. Références

- Repo : `c:\Users\djden\source\repos\retro-eng\re-ff8`
- File d’attente :
  [`glm-mcp-function-budget.md`](glm-mcp-function-budget.md)
- Vague déjà faite (ne **pas** refaire) : `tools/_tmp_wave_review/`
  (local, gitignore) — 93 fonctions, 79 déjà poussées IDB
- Skill GLM : `.agents/skills/glm-decompile/SKILL.md`
- IDA MCP : `project-0-re-ff8-ida-pro-mcp`
- GLM MCP : `project-0-re-ff8-glm-decompile` (`glm_health`, `glm_decompile_asm`)
- IDB : `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64` — confirmer via
  `idc.get_idb_path()` ; `idc.save_database(idc.get_idb_path())`
  **après chaque push** (l’IDB est **hors git**)
- PE : `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`,
  SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`,
  base `0x400000`
- Livrable git par fonction :
  `docs/tech/investigation/battle-static-discovery/decomp/<EA>__<Name>.md`
- Pièges Hex-Rays : `F_CHAR_DATA` / `BATTLE_SLOT_DATA` typés `__int16*`
  → strides 232/104 **faux** (vrais : 464 / `0xD0`)

Avant le premier appel : `GetDynamicTools` une fois par namespace
(`project-0-re-ff8-glm-decompile`, `project-0-re-ff8-ida-pro-mcp`),
puis `CallDynamicTool`. Ne pas inventer les schémas.

## 4. File d’attente

Source = tableau « Traitable en un appel (484) » du budget, **dans l’ordre
d’adresse**, avec filtres :

**Prendre**

- `domain::`, `EnemyAI_*`, `Battle*`, `FFBattle*`, `main::FFBattle*`
- EA battle / présentation battle : `0x47xxxx`–`0x51Bxxx` (sauf L3)

**Sauter**

- Colonne Vague = `oui`
- Dossier existant sous `tools/_tmp_wave_review/0x*`
- Fichier déjà présent sous `decomp/<EA>__*.md`
- Commentaire de fonction IDA contenant `reconstructed-C` ou `glm-triple`
- CRT / vendor GL-DDraw / `OutputDebugString` / `GetSingletonAddress` /
  `nullsub` / `fopen` / thunks IAT
- Les **14 chunk** (>600 instr.) : **hors cette campagne** tant que la
  file ≤600 n’est pas vide. (Protocole chunk plus tard = même triple,
  **par région**, une région = une « fonction » du pipeline.)

Les 498 du wiki **ne sont pas** tout le gisement (noms sans EA, sites
intérieurs, `docs/` hors QMD). **Cette campagne = la liste budget
traitable filtrée.** Ne pas élargir tout seul.

## 5. Pipeline d’une fonction (obligatoire)

```
orchestrateur (parent)
    → pack contexte (IDA + QMD) → prompt P
    → GLM-A et GLM-B en parallèle (même P, temp 0.2)
    → GLM-R réconciliation (P + C_A + C_B, temp 0.0)
    → parent vérifie 3–4 points ASM (strides, polarité, add esp, retour)
    → push IDB + save_database
    → écrire decomp/<EA>__<Name>.md
    → git add CE fichier + git commit
```

Une fonction = **trois** appels `glm_decompile_asm`, pas plus, pas moins
(retry **une** fois si `finish_reason=length` et sortie vide, skill).
Si A et B sont **byte-identiques**, le noter dans le `decomp/` ; R
tourne **quand même** (copie commune ≠ vérité ASM).

Ne **pas** lancer les dual-gen de la fonction N+1 avant d’avoir commité
(ou dumpé UNCERTAIN) la fonction N.

### 5.1 Orchestrateur — contexte à packer (ordre imposé)

C’est **le** travail du parent. Les GLM ne voient que le prompt.

1. `lookup_funcs` **par VA** (jamais le nom `domain::` seul) + `disasm`
   (paginer si >400 instr. ; `include_total`) — listing Intel + labels
2. Prototype IDA (`export_funcs` / `lookup_funcs`)
3. `stack_frame`
4. `callees` + prototypes des callees + `add esp` après chaque `call`
5. `xrefs_to` : 2–5 callers (noms + EA)
6. 2–3 globaux / structs touchés : **noms + strides + offsets connus**
   (`F_CHAR` 0x1D0, slot 0xD0, magie 32×5, occupancy groupes 1+2)
7. Wiki : `qmd search "<nom ou EA>" -c ff8-wiki -n 5 --files` puis
   `qmd get` des hits utiles — **sémantique in-game**, pas le C Hex-Rays
   du wiki recopié dans GLM
8. **Ne pas** coller `decompile` Hex-Rays dans `context_hints`. Le parent
   peut le lire **après** R, pour la vérif, pas avant.

Champs MCP :

- `asm` = listing Intel brut (tout le corps, ou pagination concaténée)
- `context_hints` = texte libre, ordre ci-dessous
- `model` = `glm53-flash`
- `reasoning_effort` = `auto` (high si <200 lignes ASM non vides, sinon low)
- `max_tokens` = `0`

Gabarit `context_hints` (deux premiers) :

```
Prototype: <signature IDA exacte, convention>
Callees:
- 0x........ Name (__cdecl, add esp = N, retour = AL|AX|EAX) — 1 ligne
Globals/strides:
- F_CHAR stride 0x1D0 ; BATTLE_SLOT 0xD0 ; ...
Callers:
- 0x........ Name
Semantics (wiki, in-game, pas Hex-Rays):
- ...
Contraintes:
- Ne pas inventer les cases d'une jump table dont le contenu n'est pas dans l'ASM.
- Labels IDA (loc_/def_/jpt_) = ancrage ; ne pas les dropper.
- Décrire le comportement des opcodes, même si le nom catalogue ment.
```

### 5.2 Deux premiers GLM (même prompt, parallèle)

**Un seul message parent**, deux `CallDynamicTool` :

- namespace `project-0-re-ff8-glm-decompile`
- toolName `glm_decompile_asm`
- arguments : `asm`, `context_hints` **identiques** ; `temperature: 0.2` ;
  `model: "glm53-flash"` ; `reasoning_effort: "auto"` ; `max_tokens: 0`

Aucun des deux n’a le C de l’autre. Ne pas « améliorer » le prompt entre A et B.

### 5.3 Troisième GLM (réconciliation)

**Après** les deux retours. Même `asm`. `temperature: 0.0`.
`context_hints` = le pack §5.1 **plus** :

```
VERSION_A:
```c
<sortie brute A, fence intérieure OK>
```
VERSION_B:
```c
<sortie brute B>
```
Réconcilie. Ground truth = l'ASM fourni dans `asm`, pas Hex-Rays, pas le nom catalogue.
Pour chaque divergence (stride, polarité setcc / ja vs jg, largeur store,
ordre cdecl, sentinelle, valeur de retour AL vs EAX), garde ce qui colle aux opcodes.
Un seul C, compilable, sans idents fantômes, sans préfixes de segment.
Si A et B sont identiques mais contredisent un opcode, corrige.
```

### 5.4 Vérif parent avant push (court, obligatoire)

Pas un quatrième GLM. Checks ASM **live** (`disasm`), au moins :

- [ ] stride `lea`/`shl` développé en nombre (pas `*232` si `*0x1D0`)
- [ ] polarité `setz`/`setnz` et `ja`/`jb` vs `jg`/`jl`
- [ ] `add esp` = nombre d’args cdecl
- [ ] valeur de retour (AL vs AX vs EAX) ; `GetRandomInt` = AL only
- [ ] jump table : pas de cases inventées si la table n’était pas dans `asm`
- [ ] stores à la bonne largeur (byte vs DWORD)

Échec d’un check **bloquant** → **ne pas pousser l’IDB**, écrire `decomp/`
en `UNCERTAIN`, **commit quand même** le dump (pour ne pas perdre),
passer à la suivante. Ne pas « arranger » le C à la main au-delà d’une
correction opcode-évidente d’une ligne (et la noter dans le `decomp/`).

### 5.5 Push IDB

Via `py_eval` IDA, **après** §5.4 OK :

1. `idc.SetType(ea, prototype)` — proto du C réconcilié, préfixe
   `domain::` / `main::` / `presentation::` **retiré** du nom
2. `idc.get_func_cmt(ea, 0)` ; si déjà `glm-triple` / `reconstructed-C`
   → stop, ne pas écraser
3. Append : `\n[glm-triple YYYY-MM-DD]\n` + listing C (fence inutile)
4. `idc.save_database(idc.get_idb_path())`
5. **Pas de rename**, pas de `set_name`

Le script local `tools/_tmp_push_resolved_c.py` est un **précédent**
(vague 79 fonctions), pas à réutiliser tel quel : ici on pousse **une**
fonction à la fois, tag `glm-triple`, pas `reconstructed-C`.

### 5.6 Fichier `decomp/` (git)

Créer le dossier au premier fichier. Un markdown par fonction :

```markdown
# <Name IDA> @ <EA>

- Instr (live): N
- Palier: high|low
- GLM A: fence_found=… finish_reason=… reasoning_tokens=…
- GLM B: …
- A==B: oui|non
- Push IDB: oui|UNCERTAIN
- SetType: `<proto>` | échec
- Notes parent: <1–5 lignes, checks ASM, divergences A/B>

## C réconcilié

```c
...
```
```

Ne pas coller Hex-Rays. Ne pas coller l’ASM entier (l’IDB est la source).

### 5.7 Commit (PowerShell)

Après `git status` + `git diff` du **seul** fichier `decomp/` :

```
git add docs/tech/investigation/battle-static-discovery/decomp/<EA>__<Name>.md
git commit -m @"
decomp(battle): <EA> <nom-court>

"@
git status
```

N’ajouter **que** ce fichier. Si d’autres `M` apparaissent, les laisser.

## 6. Cadence « 5 par 5 »

1. Choisir **5** EA de la file filtrée (§4), dans l’ordre d’adresse
   (premier lot = §7, ne pas le recalculer).
2. Pour **chacune**, **en série** : §5 complet (2 GLM // → R → vérif →
   push → commit).
3. Rapport des 5 (tableau EA | push | A==B | 1 phrase).
4. Enchaîner les 5 suivantes **sans** redemander, jusqu’à fin de session
   ou file vide. Le user n’est pas dans la boucle ASM.

Le « deux jobs puis le troisième » est **par fonction**. Ne pas lancer
cinq dual-gen en parallèle.

## 7. Premier lot (ne pas le recalculer)

Sauter Vague / déjà poussées. Premier lot battle, ordre adresse :

| # | EA | Nom | Instr | Palier |
|---|---|---|---:|---|
| 1 | `0x47CA90` | `Field_Encounter_RollAndSelectScene` | 115 | high |
| 2 | `0x47CCB0` | `main::FFBattleDirector_battleLoop` | 413 | low |
| 3 | `0x47CE10` | `FFBattleInitSystem` | 56 | high |
| 4 | `0x47CEF0` | `FFBattleExitSystem` | 22 | high |
| 5 | `0x47CF50` | `BattleSwirl_ArmOneShot` | 4 | high |

Si l’un a déjà le tag IDA `glm-triple` / `reconstructed-C` ou un
`decomp/` existant, le remplacer par le suivant non sauté du budget
(`0x47CF60` `FFBattleModule` 209 low, `0x47D890`, `0x47D8A0`, …).

Lot 2 probable (après skip Vague) : `0x47CF60`, `0x47D890`,
`0x47D8A0`, `0x47D8E0`, `0x47E250` — à confirmer au moment du lot.

## 8. Pièges (vague du 12 sept. — ne pas retomber)

- Noms catalogue menteurs : `CountAlive*` = find-first, pas un count ;
  `SelectRandomMagicFromStock` = get-qty, le RNG est `0x4837E0` ;
  `LookupAbilityByIndex` = registraire de callback ;
  `ResetExecState` = thunk masque Party/Monster ;
  `SetPhaseFlag` = switch 5–10, pas un bitset.
  Décrire le comportement ; ne pas « corriger » l’ASM pour coller au nom.
- Bit `0x40` : `GetMaskFromInfoField` SET = ennemi ;
  `GetTargetMaskFromMask` SET = party (inversés).
- `Battle_GetRandomInt` `0x48F020` : **AL only**, `inc al` wrap.
- `GetRandomPartyMask` 255→0 ; `GetRandomMonsterMask` 255→8.
- Occupancy exec : groupes **1+2**, pas 0.
- Ne pas fusionner `0x497270` avec `0x4876B0`.
- `lookup_funcs` : requêter par **VA**.
- Hex-Rays type souvent `__int16*` sur `F_CHAR` / slot → stride faux.
- `ida_loader.save_database` échoue sous `py_eval` : utiliser
  `idc.save_database(idc.get_idb_path())`.

## 9. Première action dans le nouveau chat

1. Lire ce document + le skill `glm-decompile` + les 5 lignes du §7.
2. `glm_health` + `idc.get_idb_path()` + `git status` (ne pas toucher aux
   `_tmp_wave_review`, ni aux `M` user, ni au `.gitignore` déjà posé).
3. Orchestrer **la fonction 1** (`0x47CA90`) : pack contexte (IDA + QMD) →
   deux `glm_decompile_asm` **dans le même tour** (`temperature: 0.2`) →
   puis R (`temperature: 0.0`) → vérif ASM → push + save + `decomp/` +
   **commit**.
4. Enchaîner 2–5 du §7. Rapport des 5. Puis lot suivant.

Si GLM MCP down : **s’arrêter**, ne pas substituer Grok/Muse pour la gen.
Si IDA MCP down : s’arrêter, ne pas « pousser plus tard ».

## 10. Ce que ce plan n’est pas

- Pas R1 (visionneur / fixtures golden) — ne pas exécuter `HANDOFF_R1-plan.md`.
- Pas une relecture des 93 `resolved.md` Grok.
- Pas un rename de masse, pas un ingest wiki (`qmd update` interdit).
- Pas un élargissement aux 14 chunk ni aux ~422 starts `docs/` hors QMD.
