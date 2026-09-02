# Nouveau batch — G23 fin de combat, cleanup et handoff

Tu dois **commencer puis fermer G23**, mais seulement après avoir passé
le verrou d’entrée G22 ci-dessous. Il n’existe encore aucun domaine G23
commité : `run_end_check_stub` retourne vide, `ModuleHandoff` ne porte
que `result_code` / `end_type` / `requested`, il n’y a ni protocole
G23, ni bit suite, ni témoin après 4600.

G05–G22 existent. Compose dessus. Ne réécris ni le tick, ni les
familles de commandes, ni les readers, ni l’init.

Prépare hors jeu toute l’implémentation, les fixtures, les oracles, les
payloads, les collecteurs et la carte live. Travaille de façon autonome
jusqu’au premier geste réellement nécessaire dans FF8. À ce moment-là,
demande une action courte, précise et unique, en français.

Ne committe et ne pousse rien sans demande explicite.

## Verrou d’entrée — G22 doit être réellement promu

G23 dépend de G22. Avant tout fichier `core/` G23, vérifie ensemble :

1. `manifests/evidence-policy.toml` :
   `[promotion.G22].satisfied = true` et statut `live-promoted` ;
2. le rapport de promotion G22 et ses enveloppes portent **une même
   DLL**, un EXE authentifié, `refused_mask == 0`, zéro helper natif,
   zéro `import_legacy` comme source, restore exact et `Detached` ;
3. `ai-prompt/todo/g22-g23-extract-reports/REGISTER.md` :
   `P-SAT` est tranché et `P-G23` n’est plus interdit ;
4. les résiduels G22 de catégorie 3 sont fermés ou explicitement
   write-sealed selon leur propre contrat. G23 ne les absorbe pas.

État audité le **2026-09-02** (verrou passé) :

- `[promotion.G22].satisfied = true` ;
- statut `live-promoted` ;
- candidat v19
  `7f07f9000e01559096cb6199225c124e753d795cb009224169272061cb2a7cae` ;
- `refused_mask = 0` sur cinq enveloppes canoniques ;
- registre `P-SAT = appliqué` et `P-G23` autorisé.

Le stop ci-dessous ne s’applique plus. Ne ferme toujours pas les
8 stats, les 16 GF, un DAT ennemi ou une dette G22 sous un nom
`SQ-G23`.

État historique du **2026-08-31** (ne pas réutiliser comme verrou) :

- `[promotion.G22].satisfied = false` ;
- statut `constrained-live-anchor` ;
- candidat v17
  `8fba438709acf40a18a7caecd048db52b970cb95c6a71385f404b4830fa27b94` ;
- `refused_mask = 32` (`InitialEnqueue`).

Le présent brief est prêt pour l’état futur où G22 aura été promu ; il
ne constitue pas lui-même cette promotion.

## G vs P — ne les confonds pas

- **G22** = init : produire un `BattleState` canonique depuis les
  readers G21, sans snapshot post-init comme source. Il doit être clos
  avant G23.
- **G23** = terminal : détecter la fin, latcher le résultat, préserver
  l’ordre de la frame, calculer et committer les deltas persistants,
  puis remettre la main au module reward ou terrain.
- **P2 GameplayDomain** n’est pas à ouvrir ni à réparer ici. G23
  compose sur les gates de gameplay déjà livrés.
- **P3 BaseLoop** est la prétention débloquée par G23 : init →
  input/ATB scripté → domaine/Director → fin → commit/handoff pour le
  contenu supporté.
- Le profil `P3` d’un payload est un **candidat de test**, pas une
  promotion. N’ajoute aucun `claimed` / `satisfied` P3 avant la
  fermeture offline **et** live de G23.
- **G24+** possède input jouable, HUD et présentation complète. G23
  garde la présentation native comme une unité NCOMP scellée G14.

## Résultat attendu

À la fin de **ce** batch :

- U23.1 à U23.9 sont implémentées et testées pour le contenu supporté ;
  une incertitude devient une `SQ-G23-xxx` et un refuse typé, jamais
  un fallback natif silencieux ;
- l’ordre des cinq checks terminaux est exact et **le premier résultat
  latché gagne** : scripted, wipe/Phoenix, timer, victoire, escape ;
- les codes résultat `1/2/3/4`, les end-types, relays et countdowns
  prouvés restent distincts ; le résultat spécial `5` reste refusé
  tant que sa source gameplay n’est pas fermée ;
- le reste de la frame après le latch est exact : un dernier transfert
  pending, reset des trois groupes si requis, aucun tick périodique
  après résultat, callbacks/présentation selon le contrat existant ;
- le cleanup est une transaction sémantique G23, pas un appel à
  `Battle_EndCleanupAndTransition` ;
- HP/statuts party, stocks magie, items/EQUAL, GF, compteurs, XP/AP,
  drops et exceptions Card/Devour/Mug sont committés depuis des
  données canoniques, octet par octet là où l’hôte est écrit ;
- victoire/escape sélectionnent le handoff reward puis terrain ;
  wipe/timer prennent le chemin non-reward ; teardown et rollback sont
  exacts ;
- aucune remise à zéro globale n’est inventée : les transients que
  l’init suivante possède restent à l’init suivante ;
- la matrice de batailles répétées prouve qu’aucune génération, queue,
  latch, reward ou pointeur du combat précédent ne fuit ;
- zéro appel à un helper natif de détection, reward, persist ou
  cleanup ; seuls les endpoints de module/hôte explicitement
  allowlistés peuvent vivre dans l’adapter runtime ;
- contrats et CTest cumulatifs restent verts ; baseline observée :
  **55/55** le 2026-08-31 ;
- une campagne live P3, filtrée par nécessité mais conforme au
  milestone, couvre les cinq familles, Phoenix, deltas persistants,
  callback selection et répétitions ;
- chaque range écrit possède préimage complète, readback, comptage et
  restore de test ; shutdown finit `Detached`, processus vivant ;
- README, contrats, ownership, evidence policy, address map, ABI
  ledger, wiki Oxygen et journal sont à jour ;
- `[promotion.G23].satisfied` reste `false` jusqu’à la revue finale de
  toutes les preuves ; `P3` n’est pas claimé avant cette revue.

Un batch intermédiaire peut livrer des `SQ-G23` propres. Il ne peut pas
déclarer G23/P3 terminé si une famille terminale, U23.7, U23.8 ou
U23.9 reste seulement fail-closed.

## Préambule outillage — vérifie une fois, puis travaille

Lis avant tout code :

```text
ai-prompt/todo/_gate-layer-preamble.md
.agents/skills/implementing-iso-layer-boundary/SKILL.md
.agents/skills/ff8-live-necessity-filter/SKILL.md
obsidian-docs/projects/re-ff8/skills/ff8-live-validation-operations.md
```

### RTK

```powershell
rtk --version
```

Version observée dans les briefs G19–G22 : `0.42.4`. Si le hook
`preToolUse` est présent, ne l’invoque pas manuellement.

### QMD / Oxygen

Utilise la commande `qmd`, jamais un MCP QMD.

```powershell
qmd status
qmd get ff8-wiki/index.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:850:100 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/battle-lifecycle.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/battle-state-model.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/battle-loop-takeover-feasibility.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/battle-formulas.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/escape-mechanics.md --no-line-numbers
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation.md --no-line-numbers
```

Lis aussi directement :

```text
ai-prompt/todo/g22-battle-init-new-chat.md
ai-prompt/todo/g22-g23-extract-reports/REGISTER.md
ai-prompt/todo/g22-g23-extract-reports/vague-B0.md
ai-prompt/todo/g22-g23-extract-reports/vague-B1.md
ai-prompt/todo/g22-g23-extract-reports/vague-B2.md
ai-prompt/todo/g22-g23-extract-reports/vague-B3.md
ai-prompt/todo/g22-g23-extract-reports/vague-LIVE.md
obsidian-docs/_staging/investigations/battle_cleanup_and_reset.md
docs/tech/systems/battle_init.md
docs/tech/reference/address_catalog.md
C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g22-battle-init-offline-validation-2026-08-29.md
C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g22-battle-init-live-promotion-2026-08-29.md
```

La page staging cleanup corrige un drift de `battle_init.md` :
le cleanup efface `status_1 & ~0x20`, **pas** `status_2 & ~0x20`.

Si le reranker CUDA échoue : `qmd search` ou
`qmd query --no-gpu --no-rerank`.

### Context Mode, Serena et GrepAI

Le workspace Context Mode est la racine `re-ff8`. Pour le code :

1. active Serena sur
   `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated` ;
2. utilise l’index GrepAI **de ce repo** seulement ;
3. si Ollama/GrepAI est indisponible, utilise le fallback exact
   `rg` / Serena, sans réutiliser l’index `re-ff8` ;
4. réactive `re-ff8` avant de modifier la documentation.

Ne mélange jamais les deux projets Serena ni leurs index GrepAI.

### IDA / IDB autoritative

IDB :

```text
D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
```

EXE Steam 2013 SHA-256 :
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Autorité :

1. IDB authentifiée ;
2. fixtures kernel/save/DAT authentifiées ;
3. observations live hash-bound ;
4. code Reimaginated ;
5. wiki communautaire.

La campagne B0–B3 a précisément évité une redécouverte G23. N’ouvre
IDA que pour une contradiction ou une `SQ-G23` encore ouverte. Une
découverte va d’abord dans l’IDB (nom, type, commentaire), ensuite
seulement dans l’address map / ABI ledger / wiki.

## Dépôts et état de départ audité

Documentation :

```text
C:\Users\djden\source\repos\retro-eng\re-ff8
HEAD cf5cbb911a08904be4a3656d054c7fc7e35e2e9b
```

Implémentation :

```text
C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated
HEAD 90cd4e009ebda6010602d3c9a774242e6035c091
```

Injecteur :

```text
C:\Users\djden\source\repos\FFScriptLoader\build\bin\RelWithDebInfo\app_injector.exe
```

État observé le 2026-08-31, à revalider :

- worktrees propres ;
- `python .\tools\validate_contracts.py` → `ok: true` ;
- `ctest --preset debug-x86 --output-on-failure` → 55/55 ;
- snapshot schéma **27**, taille **4600** ;
- G22 protocole v3, evidence kind 34, bit `1u << 22`, témoin
  `[4344:4600]` ;
- `core::run_end_check_stub` ne lache aucun résultat ;
- `application::ModuleHandoff` est un placeholder à trois champs ;
- aucune suite, aucun témoin, aucune policy promotion G23 ;
- `content-matrix.toml [P3]` est
  `blocked_until = ["G21", "G22", "G23"]` ;
- `ownership-matrix.toml [P3]` décrit déjà :
  init replacement, frame native, HUD/input/ATB scripté replacement,
  Director/callbacks replacement, présentation native scellée,
  exit replacement-handoff.

`Invoke-IsoGroup` **n’existe pas**. Le test injecté historique du
milestone est une intention, pas une commande disponible. Flux réel :

```text
tools\make_bootstrap_payload.py
tools\make_suite_payload.py
app_injector.exe  (FF8Iso_Bootstrap / FF8Iso_RunInProcessSuite / FF8Iso_Shutdown)
tools\capture_runtime_evidence.py
tools\capture_live_canaries.py
```

## Contrats précédents à préserver

### G22 — prérequis, pas chantier G23

Consomme l’état canonique initialisé et le protocole G22. Ne change
aucune dérivation party/enemy/ATB/RNG, aucun reader, aucune policy
`InitialEnqueue`. Une régression G22 est terminale.

### G05 — ordre du tick

`core/src/active_tick.cpp` possède déjà le squelette d’ordre. G23
remplace le stub terminal, pas le tick entier.

Ordre actif à préserver :

1. refresh noms / logique active ;
2. cinq end checks si aucune action n’exécute ;
3. latch escape ;
4. transfert pending ;
5. counters ennemis ;
6. reset des trois groupes si fin latchée ;
7. arbitration / commit d’action si licite ;
8. ticks status + Angelo/Odin seulement si résultat zéro ;
9. callbacks + deferred callbacks ;
10. file callbacks + BdLink + countdown.

### G07 / G10 / G14

- G07 possède pending, exec, arbitration, action latches et reset des
  trois groupes. Réutilise ses types et son reset ; ne recrée pas des
  arrays natifs dans G23.
- G10 possède les timers/status et le decrement déjà prouvé.
  G23 détecte l’expiration ; il ne rouvre pas la cadence.
- G14 possède relays, barrières et l’unité de présentation native
  scellée. G23 émet des intents typés ; il ne met pas un pointeur
  replacement dans une liste native.

### G12 / G16 / G18 / G19 / G20

- G12 possède les transactions item/EQUAL existantes.
- G16 produit déjà des intents reward et scripted-end depuis l’AI.
- G18 possède l’état GF canonique.
- G19 connaît Card/Devour/Mug et leurs refuses persist historiques.
  **U23.7 est le gate qui porte le commit prouvé**, sans appeler leurs
  writers natifs.
- G20 reste propriétaire des Limits et de `compute_crisis_level`.

### G21

Les readers fournissent des données bornées. G23 ne relit pas
`scene.out`, kernel, save ou DAT depuis l’hôte pour reconstruire un
combat post-init.

### G24+

Input jouable, HUD, reward UI, caméra, effets et rendu ne deviennent
pas domaine G23. Le handoff peut sélectionner un module natif ; il ne
réimplémente pas sa présentation.

## Contrat G23 autoritatif

### Cinq familles terminales, dans cet ordre

| Priorité | Famille | Oracle natif | Résultat | End type | Travail avant countdown |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | scripted end | `0x4863F0 BattleTick_CheckScriptedBattleEnd` | 1 | 3 | pattern commun |
| 2 | party wipe | `0x486450 BattleTick_CheckPartyWipe` | 1 | 3 | Phoenix, texte misc 0 si perte |
| 3 | timer expiry | `0x486390 BattleTick_CheckTimerExpiry` | 3 | 3 | pattern commun |
| 4 | victoire | `0x486500 BattleTick_CheckAllEnemiesDead` | 4 | 0 ou 1 | reward calc, relay 115 ou 109 |
| 5 | escape | `0x4862A0 BattleTick_CheckEscapeSuccess` | 2 | 2 | texte misc 1, relay 116, reward calc |

Pattern commun prouvé :

- garde `BATTLE_RESULT_CODE == 0` ;
- `BYTE2(TARGET_SLOT_ID) = 1` ;
- relay `112` ;
- phase flag `10` ;
- résultat + end type ;
- callback sémantique équivalente à
  `Battle_EndSetTransitionTimer`.

Countdown `0x47DFC4` :

- end type 0 ou 3 → 60 ;
- end type 1 → 30 ;
- end type 2 → 40.

Le miroir `word_1D28C4C = countdown - 15` est présentation/inféré :
ne le mets pas dans `core`.

Le helper `0x4865C0` écrit résultat `5` et countdown `0`. Sa source
gameplay n’est pas fermée. Traite-le comme `UnsupportedImmediateExit5`
ou `SQ-G23` ; ne le glisse pas dans les cinq familles.

### Détails de détection

- Scripted : l’AI G16 peut produire l’intent ; le natif lit
  `unk_1D28E2D`. Les writers hors opcode `0x39` restent `L-PHXW` /
  live-only : n’invente pas une seconde source.
- Wipe : tous les membres party éligibles sont morts, puis Phoenix
  intercepte avant le loss. Phoenix `0x483270` exige le bit masque
  `0x04`, échoue en scène 317 (`0x13D`), et utilise un roll
  authentique 64/255. Le domaine produit un intent revive ; G14 gère
  la présentation.
- Timer : `ENCOUTER_BATTLE_FLAG & 0x04`, timer expiré, scène différente
  de 317. Le decrement reste G10.
- Victoire : tous les ennemis existants ont `status_1 & 5`. Ferme
  l’aiguillage end type 0/1 et `NO_EXP_SCREEN` depuis la preuve ; ne
  choisis pas au feeling.
- Escape : consomme l’état G06, dont le poll toutes les 60 frames et
  le blocage dynamique `ENCOUTER_BATTLE_FLAG & 0x01`. Ce n’est pas
  une commande normale.

### Même frame puis cleanup

Une fin ne fait pas `return` immédiatement :

1. le résultat est latché ;
2. le transfert pending tourne encore une fois ;
3. la branche G07 reset les groupes 1, 2, 0 ;
4. status et Angelo/Odin ne tickent plus car résultat non nul ;
5. callbacks et présentation gardent leur contrat ;
6. le countdown conduit `mode3_subsub_step = 2` ;
7. le tick suivant entre dans le cleanup.

La première famille vraie gagne. Une famille de priorité plus basse
ne peut pas écraser un résultat déjà latché.

### Cleanup / persist

Oracle `0x4868C0 Battle_EndCleanupAndTransition`, **interdit
d’appeler**. Sémantique prouvée :

- party slots 0..2 ;
- writeback HP halfword vers CharacterData stride 152 ;
- clear `status_1 &= ~0x20` puis persist ;
- flush des deux ids transients slot `+0xB8/+0xB9` vers EQUAL, puis
  zéro de ces octets ;
- merge EQUAL dans l’inventaire save ;
- commit stocks magie, GF et deltas reward prouvés ;
- compteur escaped pour résultat 2, victory pour 4, unused pour 1/3 ;
- mode 5 pour victoire/escape avec reward, sinon mode 100 ;
- stop SFX ; animation battle à 0.

Ne renomme pas `+0xB8/+0xB9` sans preuve : leur nom sémantique exact
reste ambigu. Leur comportement de flush/zero est l’oracle.

Le cleanup natif ne blanket-zero pas pending/exec/latches/dead-timer.
L’init suivante possède leur reset. G23 doit seulement garantir qu’une
nouvelle génération ne les interprète pas comme courants.

### Reward / handoff

Chaîne statique :

```text
end check
→ countdown
→ cleanup transaction
→ mode 5 reward packaging (victoire / escape)
→ FFBattleExitSystem
→ BattleRewardMenu_MainLoop (0x4A2690)
→ mode 100 / terrain
```

Wipe et timer sautent le mode reward.

`0x4A6680` et `0x4A2690` sont présentation/UI, pas des formules
XP/AP. `0x47CEF0` restaure des états de sortie. Le choix exact du
callback Director case 5 reste `B2-DIR5 = G23-impl` et doit être
prouvé dans le runtime, pas codé dans `core`.

## Preuves déjà extraites — ne redécouvre pas

| Élément | Preuve |
| --- | --- |
| XP `0x1CFF574`, GF AP `0x1CFF520`, result `0x1CFF6E7`, EQUAL `0x1D28E78` | B0-LAY |
| `BattleEnd_DistributeXpAp 0x494D40`, cap 60000 | B0-DIST |
| `ComputeGFLevelAndApAfterKill 0x494AF0` | B0-GFAP |
| Mug proba/qty `0x486650` / `0x4867C0` | B0-MUGP/Q |
| Card command drop `0x48FBA0`, call historique `0x534840` | B0-CCMD |
| Devour persist oracle `0x492220` | B0-DEV |
| cleanup `0x4868C0`, party `0x1CFE74C`, CharacterData `0x1CFE0E8` | B1-CLEAN |
| HP/magic `0x48B8B0` / `0x486CD0`, known magic `0x1CFE95C` | B1-HPMC/MAG |
| GF persist `0x1CFF082` + `0x4954B0` | B1-GFP |
| mode 5 / menu / exit `0x4A6680` / `0x4A2690` / `0x47CEF0` | B2 |
| Phoenix `0x483270`, bit 4, scène 317 | B3-PHX |

`D:\Modding\ff8\kernel.bin` hash `f7db5cf6…` est rejeté. Utilise
uniquement la fixture kernel authentifiée
`e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`.

## État de confiance — ne le maquille pas

| Unité | Départ | Plafond avant nouveau live |
| --- | --- | --- |
| U23.1 scripted | static-partial : check + opcode connu | writers alternatifs live-only |
| U23.2 wipe/Phoenix | static-strong | wipe/Phoenix authentique live requis |
| U23.3 timer | static-strong | handoff réel live requis |
| U23.4 victoire | static + ancien live natif | replacement live requis |
| U23.5 escape | static/inferred | relay→transition et delta live requis |
| U23.6 same-frame | ordre statique + victoire native live | quatre autres familles live requises |
| U23.7 persist | static-partial | deltas save byte-exact live requis |
| U23.8 handoff | static/inferred | callback Director case 5 live requis |
| U23.9 repeat | non prouvé G23 | matrice live obligatoire |

Une trace native est un **oracle**, pas une preuve que le replacement
possède le chemin. Une victoire live 2026-07-12 ne promeut pas G23.

## Architecture à poser

### `core`

Possède les règles pures :

- priorité et predicates terminales ;
- `BattleEndDecision` / `BattleResult` / `BattleEndType` ;
- Phoenix et intents de relays/présentation ;
- countdown sémantique ;
- `RewardPlan` et `PersistentBattleDelta` canoniques ;
- mutations de `BattleState` et validation de génération.

Remplace `run_end_check_stub` par une API explicite. Réutilise
`EndCheckKind`, `BattleState.result_code`, `end_type`, `dead_timer`,
`known_magic_bits`, `gf_persist` et les transactions G12/G18/G19.

Pas de RVA, `find_symbol`, `abi::`, `LegacyBattleImage`, offsets save,
callback natif, pack POD ou writer hôte.

### `application`

`BattleSession` orchestre :

1. évaluation terminale au bon endroit ;
2. latch first-wins ;
3. dernier transfert + reset G07 ;
4. gel des ticks après résultat ;
5. countdown ;
6. construction du plan reward/persist ;
7. transaction copie → commit ou rollback ;
8. `ModuleHandoff` typé.

Étends le placeholder `ModuleHandoff` avec un résultat sémantique,
destination (`Reward` / `Field` / `GameOver`), état teardown et erreur.
Il ne contient ni callback address ni POD natif.

### `abi`

POD / address map seulement :

- result/end/countdown/phase ;
- reward accumulators ;
- save/SG layouts déjà prouvés ;
- callback/global addresses après IDB.

Les codecs n’entrent pas dans `abi`. `ff8iso_abi` n’inclut pas
`core/` et `ff8iso_core` ne linke pas `ff8iso_abi`.

### `runtime-x86`

Possède :

- codecs canonical save/reward ↔ POD natif ;
- préimage/write/readback/restore ;
- application mécanique du `PersistentBattleDelta` ;
- sélection mécanique du callback/module depuis `ModuleHandoff` ;
- protocole et témoin G23.

Il ne calcule aucune règle XP/AP/drop, aucun predicate terminal et
aucune exception Card/Devour/Mug.

Un `TemporaryG23NcompAdapter` n’est licite que pour les endpoints
hôte réellement NCOMP (sortie module, SFX, callback install), avec
`Removal target: U14.x`. Aucun helper domaine ne peut y entrer.

Présentation G14 : unité scellée entière. Ne garde jamais seulement un
file callback, une task, une caméra ou un busy flag à moitié possédé.

### Snapshot

Append-only. État audité :

| Témoin | Intervalle | Schéma |
| --- | --- | ---: |
| G19 | `[3576:3832]` | 23+ |
| G20 | `[3832:4088]` | 24+ |
| G21 | `[4088:4344]` | 25+ |
| G22 | `[4344:4600]` | 26/27 |

G23 ajoute **256 octets** `[4600:4856]`, schéma **28**, sans
réinterpréter les réserves G22. `static_assert` C et C++ obligatoire.

Bit : `FF8ISO_SUITE_G23_BATTLE_END = 1u << 23`.
Evidence kind : `FF8ISO_EVIDENCE_G23_BATTLE_END = 35`.

Si un commit plus récent a déjà pris 28/4856/35, avance proprement ;
ne collisionne pas et documente la nouvelle valeur.

## Travail restant par unité

### U23.1 — Scripted end

- consommer l’intent G16 / source prouvée ;
- préserver la priorité 1 ;
- résultat 1, end type 3, relay commun, countdown 60 ;
- fixture AI opcode `0x39` ;
- source alternative inconnue → `SQ-G23-001`, pas lecture hôte
  opportuniste.

Tests : request absent, présent, déjà latché, action active, collision
avec wipe/victory, first-wins.

### U23.2 — Party wipe / Phoenix

- predicate sur party canonique et slots existants ;
- Phoenix avant loss ;
- mask `0x04`, scène 317 interdit, roll 64/255 depuis RNG canonique ;
- succès Phoenix : revive intent, pas résultat 1, pas reward de perte ;
- échec : résultat 1/end 3/non-reward.

Ne call pas `Battle_PhoenixAutoReviveCheck` ni `0x484720`. L’intent
présentation passe par G14.

Tests : aucune party, membre vivant, tous morts, bit absent, scène
317, rolls 63/64/254, résultat déjà latché.

### U23.3 — Timer expiry

- gate encounter `0x04` ;
- timer 0 et scène !=317 ;
- résultat 3/end 3/countdown 60 ;
- non-reward et mode 100 après cleanup ;
- aucune duplication du decrement G10.

Tests : flag off, timer 1/0, scène 317, action active, collision.

### U23.4 — Victoire

- considérer uniquement les ennemis existants/chargés ;
- predicate `status_1 & 5` prouvé ;
- résultat 4 ;
- fermer end type 0/1, relay 115/109 et `NO_EXP_SCREEN` ;
- construire `RewardPlan` avant cleanup ;
- mode 5 sauf no-exp prouvé.

Tests : ennemi vivant, dead/petrify/eject combinations, aucun ennemi,
no-exp, cap XP/AP, multi-ennemi, ordre déterministe.

### U23.5 — Escape

- consommer le succès G06, pas repoller l’input dans G23 ;
- résultat 2/end 2/countdown 40 ;
- relay 116 + intents texte ;
- appliquer l’état escape canonique ;
- trancher `L-ESC` : `DistributeXpAp` commit réel vs no-op, par preuve
  offline + live ;
- sélectionner reward puis retour terrain.

Ne call pas `BattleEscape_BeginTransition 0x47DF60`. Porte ses
mutations sémantiques prouvées et exporte-les via runtime.

### U23.6 — Same-frame latch

- première famille vraie seulement ;
- exactement un transfert pending final ;
- reset G07 groupes 1, 2, 0, sans blanket-zero ajouté ;
- zéro status/special tick après latch ;
- callbacks puis file/BdLink restent cohérents avec G14 ;
- cleanup au tick suivant, jamais dans la fenêtre du latch.

Le témoin doit compter **des effets observés**, pas seulement un bit
`pumped` auto-déclaré.

### U23.7 — Persistent commit

Implémente une transaction sémantique et bornée :

1. party HP halfword et statut corrigé ;
2. stocks magie 32 paires + known magic ;
3. flush `+0xB8/+0xB9` vers EQUAL puis inventory ;
4. GF state / AP ;
5. outcome counters ;
6. XP/AP/drop/item/card ;
7. Card/Devour/Mug exceptions depuis intents G19 ;
8. commit atomique ou rollback complet.

Porte les formules ; n’appelle pas `0x494D40`, `0x494AF0`,
`0x486650`, `0x4867C0`, `0x48FBA0`, `0x492220`, `0x48B8B0`,
`0x486CD0`, `0x534840` ou `0x4868C0`.

Une formule/offset non prouvé = `SQ-G23` + contenu non supporté.
Ne compare pas uniquement des hashes : le collecteur produit aussi
une liste de deltas adresse/offset/avant/après.

### U23.8 — Module handoff

- destination typée : reward, field, game-over/non-reward ;
- mode 5 vs 100 ;
- stop SFX et reset animation ;
- sélection du callback exacte ;
- adapter runtime réduit aux services hôte ;
- erreur à chaque phase → restore et retour sûr ;
- aucun pointeur de contexte replacement dans une liste native.

Ferme `B2-DIR5` par trace Director + callback, puis encode le mapping.

### U23.9 — Repeated battles

Pour chaque famille supportée :

- deux combats consécutifs ;
- nouvelle `source_generation` ;
- init G22 du second combat ;
- aucun reward/delta/callback/pointeur obsolète ;
- pas d’hypothèse « tout zéro » entre combats ;
- résultat final et handoff exacts deux fois.

La matrice offline est obligatoire ; la matrice live du milestone
reste promotion-tier et ne peut pas être remplacée par un replay de
snapshot.

## Ordre de fermeture

1. **Preflight G22** — stop si le verrou n’est pas vert.
2. **Audit du squelette** — `active_tick`, `BattleState`,
   `BattleSession`, G07/G10/G14, transactions G12/G18/G19.
3. **Terminal pur** — U23.1–U23.5, priorité et fixtures.
4. **Ordre frame** — U23.6 avec trace déterministe.
5. **Reward + persist** — U23.7, oracles B0/B1, deltas byte-exact.
6. **Handoff** — U23.8, adapter runtime, failpoints/rollback.
7. **Répétitions** — U23.9 offline.
8. **Protocole** — payload, witness, collecteur, negatives.
9. **Filtre live** — ledger de waivers puis carte opérateur.
10. **Campagne live** — aucune action avant que tout le reste soit
    vert et préparé.

## Hors scope strict

- toute correction G22 / `InitialEnqueue` ;
- P2 et les dettes Limit ;
- résultat 5 non expliqué ;
- nom sémantique inventé pour `+0xB8/+0xB9` ;
- UI reward, HUD, input jouable, caméra, effets, renderer (G24+) ;
- réimplémenter `FFBattleExitSystem` ou `BattleRewardMenu_MainLoop` ;
- I/O de fichier/save depuis `core` ;
- appels natifs pour obtenir le résultat attendu ;
- blanket-zero des buffers parce que « cleanup » ;
- certifier un persist à partir d’un hash global sans delta ;
- utiliser `import_legacy` comme source de vérité G23 ;
- fusionner des preuves de PID/DLL différents.

Toute branche hors scope retourne une erreur typée et, si nécessaire,
une `SQ-G23-xxx`. Aucun fallback natif silencieux.

## Protocole runtime G23 — à créer

Avant FF8 :

- protocole `g23-battle-end-v1` ;
- bit `1u << 23` ;
- evidence kind 35 ;
- témoin 256 o append-only ;
- `tools/make_suite_payload.py --group G23 --profile P3` ;
- `tests/in-process/G23.suite.toml` ;
- `tests/offline/test_g23.cpp` ;
- `tests/offline/test_g23_payload.py` ;
- décodeur dans `capture_runtime_evidence.py` ;
- assertions dans `validate_evidence_envelope.py` ;
- collector/schema JSON ;
- `[P3.G23]` ownership ;
- `[promotion.G23]` avec `satisfied = false`.

Le témoin doit au minimum porter :

- version, scénario, error, runtime state, génération ;
- terminal family, result code, end type, countdown ;
- latch count et first-wins ;
- transfert pending final et masque reset groupes ;
- compteurs status/special après latch (attendu 0) ;
- Phoenix attempted/eligible/roll/intercepted ;
- hashes reward plan / persistent delta ;
- liste ou hash structuré des deltas attendus/réels ;
- destination/callback de handoff ;
- native domain/helper calls ;
- preimage/write/readback/failure/restore counts ;
- hooks/ranges restaurés ;
- second battle generation et stale-state count.

Scénarios payload minimaux :

1. `scripted-end` ;
2. `wipe-loss` ;
3. `wipe-phoenix` ;
4. `timer-expiry` ;
5. `victory-reward` ;
6. `escape-handoff` ;
7. `refuse-result5` ;
8. `repeat-terminal` paramétré par famille ;
9. `fault-before-commit` ;
10. `fault-before-handoff`.

Ils sont réarmables sans rebuild. `--profile P3` ne modifie pas seul
`content-matrix.toml`.

## Audit des appels et écritures

### Appels interdits

Interdis depuis `core`, `application` et le seam G23 :

- les cinq `BattleTick_Check*` natifs ;
- `Battle_PhoenixAutoReviveCheck` ;
- `Battle_EndSetTransitionTimer` ;
- `Battle_EndCleanupAndTransition` ;
- `BattleEnd_DistributeXpAp` ;
- les helpers HP/magic/GF/item/Card/Devour/Mug listés U23.7 ;
- `import_legacy` comme source ;
- tout helper G22 init ;
- tout callback presentation G24+ appelé pour « finir » le domaine.

Les seuls appels natifs potentiellement licites sont des services
hôte de **handoff** explicitement prouvés et isolés dans
`TemporaryG23NcompAdapter` : sortie module, SFX, installation d’un
callback connu. Par défaut l’allowlist est vide.

### Writes

Établis une allowlist par scénario :

- latch résultat/end/phase/countdown ;
- reset mécanique G07 prouvé ;
- party/save/magic/item/GF/counters/rewards selon `PersistentBattleDelta` ;
- escape state prouvé ;
- mode/callback/animation de handoff ;
- scratch/témoin du harness.

Chaque range : adresse résolue, taille, préimage complète, write
attendu, readback immédiat, échec compté.

Le live de test capture :

1. préimage ;
2. delta persistant attendu ;
3. état post-handoff avant shutdown ;
4. restore exact des ranges possédés par le harness.

Un delta gameplay voulu est d’abord observé et validé, puis la session
de test peut restaurer sa préimage pour laisser le processus sûr.
Ne confonds pas « delta G23 correct » et « hook restauré ».

## Politique live — filtre de nécessité obligatoire

Avant de demander d’ouvrir FF8 :

1. lis `[promotion.G23].required`, ownership et dernier review ;
2. classe chaque ligne :
   `LIVE-REQUIRED`, `SET-ASIDE-VERIFIED` ou
   `SET-ASIDE-CERTAIN-UNKNOWN` ;
3. écris le waiver ledger avec preuve/SQ pour chaque set-aside ;
4. prépare la carte live minimale ;
5. montre ledger + carte à l’opérateur.

Jamais waivable :

- process frais, aucun debugger ;
- EXE/DLL SHA-256, aucune fusion de hashes ;
- contrats + build x86 + DLL PE32 avant injection ;
- zéro helper domaine / zéro `import_legacy` source ;
- write guard et readback ;
- préimages complètes ;
- restore exact, `Detached`, processus vivant ;
- observation directe des effets same-frame ;
- collector qui rejette les témoins incomplets ;
- une action utilisateur à la fois, en français.

Les formules, mappings et tests déterministes déjà fermés sur le même
commit sont `SET-ASIDE-VERIFIED`. Leurs **couplages hôte** ne le sont
pas.

## Stratégie live de promotion

G23 est plus large que G19–G22 : le milestone exige les cinq familles,
Phoenix et la répétition. Le filtre réduit les gestes, pas ce contrat.

Prépare toutes les suites avant la première session. Pour chaque
enveloppe :

1. process FF8 frais, pas d’IDA/debugger ;
2. bootstrap P3 candidat, canaries et préimages ;
3. un geste opérateur vers un combat supporté, si le harness ne peut
   pas le préparer sans interaction ;
4. scénario terminal ;
5. capture immédiate résultat/end/same-frame/deltas/callback ;
6. handoff ;
7. shutdown et restore ;
8. `Detached` + survie.

Carte promotion minimale :

- scripted end ;
- wipe sans Phoenix ;
- wipe avec Phoenix authentique ;
- timer ;
- victoire reward ;
- escape ;
- deux combats consécutifs pour chacune des cinq familles.

Le harness peut utiliser `InputFrame` scripté et seeds contrôlés. Il
ne peut pas stamper une réussite ni appeler le natif pour produire
l’oracle.

Stop au premier rouge safety. Ne reconstruis jamais une DLL chargée.
Ne recycle pas les DLL G22 v1/v15/v16/v17 comme preuve G23.

## Instructions à l’opérateur

Une consigne par message :

- « Ferme FF8 ; je construis et vérifie la DLL. »
- « Lance FF8 avec le save de test indiqué et reste sur le terrain. »
- « Entre dans la rencontre indiquée, puis réponds “en combat”. »
- « N’appuie plus sur rien pendant la capture. »
- « Le scénario est capturé ; attends mon verdict avant la suite. »

N’emploie pas `Invoke-IsoGroup`. Donne le payload exact, le PID et le
hash attendu avant chaque injection.

## Vérifications avant promotion

```powershell
python .\tools\validate_contracts.py
cmake --preset debug-x86
cmake --build --preset debug-x86 --parallel --target battle_iso_tests
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G22
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G23
ctest --preset debug-x86 --output-on-failure
```

Puis payloads G23, collecteurs et negatives de schéma. Vérifie DLL
PE32 et SHA-256.

Promotion interdite si :

- G22 n’est pas `live-promoted` ;
- une U23.1–U23.9 requise n’est pas fermée ;
- result/end/countdown diffère de l’oracle ;
- un second check écrase le premier latch ;
- un tick périodique survient après latch ;
- un helper domaine natif est appelé ;
- delta save/reward incomplet ou non expliqué ;
- write hors allowlist, readback absent ou restore incomplet ;
- callback reward/field est deviné ;
- une génération obsolète survit au second combat ;
- présentation native et replacement sont half-owned ;
- le hash DLL change ;
- G00–G22 régressent ;
- une enveloppe historique est réécrite ;
- G24 commence pour faire passer G23.

## Manifestes et documentation

Minimum :

- `manifests/ownership-matrix.toml` : `[P3.G23]` ;
- `manifests/evidence-policy.toml` : `[promotion.G23]` ;
- `manifests/content-matrix.toml` : ne claim P3 qu’après promotion ;
- contrats, schema, payload, suite et collecteurs G23 ;
- CMake / tests / README ;
- address map / ABI ledger si symbole nouveau prouvé ;
- milestone U23.1–U23.9 et commande injectée réelle ;
- ledger `SQ-G23-xxx` ;
- page Oxygen
  `projects/final-fantasy-viii-reimaginated/references/p3-g23-battle-end-validation.md` ;
- journal du jour.

Preuves attendues :

```text
evidence/g23-battle-end-offline-draft-YYYY-MM-DD.md
evidence/g23-battle-end-offline-validation-YYYY-MM-DD.md
evidence/g23-battle-end-live-promotion-YYYY-MM-DD.md
evidence/g23-live-necessity-waiver-YYYY-MM-DD.md
evidence/battle-iso/p3-g23-*-post-suite-*.json
evidence/battle-iso/p3-g23-*-post-handoff-*.json
evidence/battle-iso/p3-g23-*-post-shutdown-*.json
```

Ingest avec `ff8-evidence-wiki-ingest` seulement quand ledger,
captures et manifestes concordent, puis compile QMD.

## Stop conditions

Arrête et rapporte le diagnostic si :

- le verrou G22 reste rouge ;
- l’IDB contredit B0–B3 ;
- résultat 5 est nécessaire pour un cas supporté mais reste sans source ;
- une formule/offset/writer « à peu près » serait nécessaire ;
- un helper natif de terminal/reward/persist/cleanup serait nécessaire ;
- le callback Director case 5 ne peut pas être prouvé ;
- `+0xB8/+0xB9` doivent être renommés pour que le modèle tienne ;
- le jeu tourne au moment d’un link ;
- PID ou hash DLL change en session ;
- write guard, readback ou call audit faute ;
- rollback n’est pas byte-for-byte ;
- `Detached` ou survie échoue ;
- une bataille répétée voit un état de génération précédent ;
- les contrats G22 ou antérieurs sont menacés.

Ne promeus pas « avec dette » une violation de frontière, une famille
terminale manquante, un persist incomplet ou un handoff inféré.

## Rapport final attendu

1. verdict du verrou G22 et SHA des deux repos ;
2. fichiers créés / modifiés ;
3. frontières `core/application/abi/runtime` ;
4. matrice U23.1–U23.9 ;
5. matrice cinq familles : predicate/result/end/relay/countdown ;
6. trace same-frame ;
7. reward plan et deltas persistants champ par champ ;
8. appels natifs et allowlist writes ;
9. protocole, schéma, taille snapshot, bit et evidence kind ;
10. contrats / tests G22+G23 / CTest et nouveau total ;
11. ledger live-necessity et waivers ;
12. hash DLL, PID et enveloppes live ;
13. callback/handoff reward vs field ;
14. repeated-battle matrix et générations ;
15. rollback / `Detached` / survie ;
16. confiance et `SQ-G23` restantes ;
17. statut `[promotion.G23].satisfied` et claim P3 ;
18. pages Oxygen, journal et QMD.

Ne conclus jamais « G23 terminé » ni « P3 ouvert » si le rapport ne
distingue pas :

- prouvé hors-ligne ;
- prouvé live sur le replacement ;
- seulement observé sur le natif ;
- encore inféré / live-only / refusé.
