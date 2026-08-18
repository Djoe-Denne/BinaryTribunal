# Marathon autonome — investigation statique G11–G20, sans live

## Directive principale

Travaille en autonomie pendant plusieurs heures sur le plus grand nombre de
jalons possible après G10. Cette mission est une **campagne d’investigation
statique**, pas une campagne d’implémentation ni de promotion live.

Tu dois produire de la connaissance réutilisable : graphes d’appels, contrats
de données, pseudocode exact, ordre des branches et des tirages RNG, listes de
writers/readers, limites d’ownership, fixtures possibles et lacunes qui
exigeront plus tard un test live. Persiste régulièrement cette connaissance
dans le vault Obsidian et recompile `ff8-wiki` afin que QMD devienne ta mémoire
entre les vagues de travail et après une éventuelle compaction de contexte.

Ne t’arrête pas parce qu’un point local est ambigu. Enregistre l’ambiguïté,
marque son niveau de confiance, définis le prochain probe discriminant, puis
continue sur une autre unité indépendante. Une découverte de G12, G13 ou G16
peut corriger rétroactivement une conclusion de G11 ou G14 : cette correction
est attendue et doit être explicitement tracée.

## Interdictions de cette campagne

- Aucun lancement ou pilotage de `FF8_EN.exe`.
- Aucun debugger live, breakpoint, attach, injection, payload ou suite live.
- Aucun write dans la mémoire d’un processus FF8.
- Aucune promotion `Gxx.satisfied = true` fondée sur cette campagne.
- Aucune déclaration « byte-exact live » lorsque seule l’IDA statique parle.
- Pas d’implémentation de production G11+ dans
  `FinalFantasy_VIII_Reimaginated`. Les petits scripts d’analyse jetables,
  tableaux, corpus et fixtures documentaires sont admis s’ils font gagner du
  temps, mais ne transforme pas cette mission en chantier C++.
- Aucun commit sans demande explicite.

Les modifications autorisées sont : annotations/types/renames dans l’IDB,
pages du wiki, index/log QMD, registres de recherche, et éventuellement outils
d’analyse statique clairement séparés du produit.

## Préambule outillage — une seule vérification

Ne gaspille pas plusieurs tours à redécouvrir les outils.

### RTK

RTK n’est pas un MCP. Exécute une seule fois :

```powershell
Get-Command rtk
rtk --version
Select-String -Path "$env:USERPROFILE\.cursor\hooks.json" -Pattern "rtk hook cursor|preToolUse" -Context 1,1
```

L’installation connue est `rtk 0.42.4`. Si la commande et le hook
`preToolUse`/Shell sont présents, RTK agit automatiquement : ne préfixe aucune
commande par `rtk` et passe à la suite. L’absence réelle du hook est un blocage
de sécurité ; une simple sortie abrégée par RTK n’en est pas un.

### QMD

QMD est la mémoire compilée du vault. Cible toujours `ff8-wiki`.

- Dans Codex : `mcp__qmd__status`, `mcp__qmd__query`, `mcp__qmd__get`,
  `mcp__qmd__multi_get`.
- Dans Cursor : découvre une seule fois le serveur QMD avec
  `GetMcpTools`, puis utilise `query/get/multi_get`.
- Si le transport MCP tombe, passe immédiatement au CLI déjà installé :

```powershell
qmd status
qmd search "..." -c ff8-wiki -n 8 --files
qmd vsearch "..." -c ff8-wiki -n 8 --files
qmd get <page>:<ligne> -l <nombre>
```

Combine lexical et sémantique, puis ne récupère que les sections utiles. Si
MCP et CLI QMD sont tous deux indisponibles, arrête : la mémoire périodique
exigée par cette mission n’est plus garantie.

### Context Mode

Context Mode sert uniquement à comprimer les gros outputs du dépôt cible.
Teste `ctx_doctor`, puis un `ctx_execute_file` minimal sur :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\README.md`

S’il fonctionne, emploie-le pour les gros fichiers, recherches groupées et
sorties de corpus. S’il échoue mais que les outils natifs peuvent lire les
fichiers, inscris `tooling_degraded=context-mode` dans le premier checkpoint
et continue avec des lectures ciblées. Context Mode est une optimisation ;
QMD et IDA sont les prérequis de fond.

### IDA MCP

Le serveur attendu est `user-ida-pro-mcp`. Vérifie une seule fois les métadonnées
de l’IDB, le hash/image base, puis décompile une fonction connue. Utilise les
outils natifs `lookup_funcs`, `decompile`, `disasm`, `xrefs_to`,
`xrefs_to_field`, `callees`, `callgraph`, `find`, `find_regex`, `list_globals`,
`get_bytes`, `read_struct`, `set_comments`, `rename`, `set_type` et
`declare_type`. N’utilise ni curl ni transport HTTP artisanal.

Si IDA est indisponible, arrête avec un diagnostic exact : sans IDB, la mission
statique n’a plus son autorité principale.

## Dépôts et autorité

Implémentation à inspecter, sans chantier de production :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Vault, recherches antérieures et prompts :

`C:\Users\djden\source\repos\retro-eng\re-ff8`

Injecteur, uniquement comme référence de frontières :

`C:\Users\djden\source\repos\FFScriptLoader`

Baseline connue au 2026-08-18 :

- `FinalFantasy_VIII_Reimaginated` : `main`, HEAD
  `f959679bd2536648acad57321ecbd276965ab9be` ;
- G10 est live-promu pour la slice Status-Atk Slow ;
- G11 Magic est le premier jalon non implémenté ;
- l’EXE supporté reste celui de SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Vérifie le HEAD au démarrage et adapte cette baseline si le dépôt a avancé.

Ordre d’autorité :

1. bytes, xrefs et contrôle de flux de l’IDB correspondant à l’EXE supporté ;
2. code, contrats et manifests actuels du dépôt d’implémentation ;
3. preuves hash-bound G09/G10 ;
4. pages canoniques actuelles de `ff8-wiki` ;
5. staging, anciens prompts, transcripts et hypothèses historiques.

Une vieille page ne l’emporte jamais sur des xrefs ou un code actuels. Une
décompilation lisible n’est pas automatiquement une preuve de cadence, de
durée de vie ou d’authenticité runtime.

Lis aussi les `AGENT(S).md` applicables. Pour toute fonction ou donnée comprise
avec forte confiance, pousse la connaissance dans l’IDB : nom, commentaire,
signature, type, structure ou champ. Un résultat uniquement écrit dans le chat
n’est pas considéré comme livré.

## Objectif réaliste et niveaux de profondeur

Ne promets pas de « fermer G11–G20 » en trois heures. Le contrat réaliste est :

### Périmètre obligatoire

1. **G11 Magic — dossier profond.** Toutes les unités U11.1–U11.8 doivent être
   triées et leurs racines/xrefs/formules/transactions cartographiées.
2. **G12 Item — dossier profond.** Toutes les unités U12.1–U12.7 doivent être
   triées, en distinguant strictement inventaire Item et stock Magic.
3. **G13 Draw — dossier profond avec réserves explicites.** Ferme autant que
   possible quantité, Cast/Stock, `aux_5/aux_6` et handoff Magic. Le
   `command_id` pending authentique reste live-required tant que l’IDB ne peut
   pas lever le conflit `0x06`/anciens artefacts.
4. **G14 callbacks/barrières — carte d’ownership.** Produis la topologie
   callback/deferred/relay/scheduler, les allocateurs, durées de vie et
   conditions d’unlink. N’invente pas un idle runtime à partir d’un nom.
5. **G15 AI contrôle — crosswalk statique.** Réutilise le catalogue déjà fort
   des 61 opcodes pour relier parser, context, PC, variables, conditions,
   selectors et corpus aux unités U15.1–U15.7.

### Périmètre extensible

Après le périmètre obligatoire, continue sans demander la permission :

6. **G16** — actions AI, mutations, spawn/remove, texte, rewards et relays ;
7. **G17** — reactions, Counter, Cover/Return Damage, auto-recover, specials,
   Angelo et intégration Regen/Doom ;
8. **G18** — gameplay GF, charge, Boost, absorb pool, support/special profiles ;
9. **G19** — inventaire de commandes et commandes à impact reward ;
10. **G20** — inventaire des six familles Limit et leurs trous statiques.

G19/G20 sont de la reconnaissance structurée si le temps ou le contexte se
réduit. Il vaut mieux un inventaire honnête à 45 % qu’un faux pseudocode à 90 %.

## Modèle de confiance — la distance n’est qu’un prior

Utilise une confiance par **claim**, puis une moyenne prudente par unité et par
jalon. La confiance peut monter ou descendre après une découverte ultérieure.

- **0.90–1.00 — statique prouvé :** bytes/branches/xrefs concordants, largeur
  et signedness fermées, readers/writers exhaustifs dans le périmètre, aucune
  hypothèse runtime nécessaire.
- **0.75–0.89 — statique fort :** algorithme et layout solides, mais une
  authenticité de record, cadence, ressource ou condition runtime reste à
  observer.
- **0.55–0.74 — reconstruction probable :** plusieurs indices concordent,
  mais lifetime, routing, side effect ou table reste partiel.
- **0.30–0.54 — reconnaissance :** racines et dépendances identifiées, contrat
  non suffisant pour coder sans risque.
- **<0.30 — hypothèse :** à conserver uniquement dans le registre
  d’incertitudes, jamais comme conclusion canonique.

Plafonds de planification, à ne pas forcer artificiellement :

| Jalon | Cible statique raisonnable | Pourquoi |
| --- | ---: | --- |
| G11 | 0.90 | formules et tables Magic déjà bien exposées |
| G12 | 0.85 | chemins proches de Magic, stockage distinct à fermer |
| G13 | 0.75 | Draw Cast/Stock fort, record pending encore ambigu |
| G14 | 0.70 | callbacks/relays statiques, idle et lifetime partiellement dynamiques |
| G15 | 0.85 | exception à la décroissance : VM/opcodes déjà très documentés |
| G16 | 0.70 | side effects nombreux, corpus disponible |
| G17 | 0.60 | déclencheurs et ordre inter-systèmes difficiles |
| G18 | 0.60 | gameplay GF récupérable, charge/presentation plus couplées |
| G19 | 0.50 | grand inventaire hétérogène |
| G20 | 0.45 | six state machines input/presentation très différentes |

Ne marque jamais un jalon statiquement « closed » sur la seule base de cette
table. Utilise les états : `mapped`, `static-strong`, `static-partial`,
`live-required`, `contradicted`, `superseded`.

## Documents de mémoire obligatoires

Crée au premier checkpoint, puis maintiens sans duplication :

1. `obsidian-docs/projects/re-ff8/references/g11-g20-static-readiness-ledger.md`
2. `obsidian-docs/projects/re-ff8/references/g11-g20-static-open-questions.md`

Le ledger est l’état compilé. Pour chaque jalon, il contient :

- unités couvertes/non couvertes ;
- fonctions et globals racines ;
- call graph réduit ;
- read-set/write-set et ownership ;
- pseudocode/ordre RNG/transactions établis ;
- propositions de fixtures offline ;
- résidus explicitement live-required ;
- score de confiance avec justification ;
- corrections rétroactives appliquées à des jalons antérieurs ;
- prochaine action exacte.

Le registre d’incertitudes utilise des identifiants stables :

```markdown
### SQ-G13-001 — command_id pending Draw authentique

- status: open | resolved | superseded | live-required
- confidence: 0.00–1.00
- affects: G11, G13
- claim:
- evidence_for:
- evidence_against:
- missing_discriminator:
- next_static_probe:
- eventual_live_probe:
- resolution:
```

Ne supprime jamais une incertitude résolue : marque-la `resolved` ou
`superseded`, indique quelle découverte l’a fermée et corrige les pages
canoniques concernées. Le registre n’est pas une décharge de notes ; chaque
entrée doit avoir un discriminator concret.

Mets à jour les pages canoniques existantes lorsque la connaissance leur
appartient réellement, notamment :

- `battle-formulas.md` et `damage-status-pipeline.md` pour Magic/Item ;
- `draw-magic-and-render-bridge.md` pour Draw ;
- `command-action-pipeline.md` pour routing/transactions ;
- `battle-lifecycle.md` et `enemy-ai-vm.md` pour callbacks/AI ;
- `gforce-cinematic-architecture.md` pour G18 ;
- `limit-break-architecture.md` pour G20 ;
- `battle-iso-migration-milestones.md` seulement pour un **checkpoint
  statique**, jamais pour cocher un gate live.

Toute page créée ou modifiée respecte le format Obsidian existant : frontmatter,
`summary` court, sources, provenance `extracted/inferred/ambiguous`, wikilinks,
date `updated` et tags de la taxonomie. Les dumps bruts volumineux restent hors
du wiki ; le wiki reçoit la connaissance distillée et traçable.

## Cadence des checkpoints

Effectue un checkpoint après chaque jalon étudié **ou toutes les 30–40 minutes
de travail utile**, selon ce qui arrive en premier. Ne laisse jamais plus de
deux jalons uniquement dans le contexte du chat.

À chaque checkpoint :

1. fusionne les résultats dans le ledger et les pages canoniques ;
2. mets à jour le registre d’incertitudes ;
3. applique les corrections rétroactives aux pages et annotations IDA ;
4. mets à jour `obsidian-docs/index.md` pour toute page nouvelle ou résumé
   devenu faux ;
5. ajoute dans `obsidian-docs/log.md` une ligne de cette forme :

```text
- [TIMESTAMP] STATIC_CHECKPOINT range="G11-G13" units="..." confidence="G11=.88,G12=.72" open_questions=7 resolved_questions=2 ida_updates=14 qmd=pass next="exact next action"
```

6. recompile QMD depuis `re-ff8` :

```powershell
python .agents/skills/ff8-evidence-wiki-ingest/scripts/evidence_ingest.py compile
```

7. lance au moins deux smoke queries : une sur la dernière conclusion, une sur
   une incertitude ; elles doivent retrouver le ledger ou le registre ;
8. avant la vague suivante, demande à QMD le checkpoint précédent et les
   questions encore ouvertes au lieu de relire tout le chat.

Si une compaction de contexte survient, reprends depuis le dernier
`STATIC_CHECKPOINT`, le champ `next` et le registre. Ne recommence pas la
découverte d’outillage ni les xrefs déjà documentés.

## Boucle d’investigation par unité

Pour chaque unité `Uxx.y` :

1. **Récupération QMD ciblée.** Cherche le nom du jalon, les fonctions, les
   tables et les contradictions connues. Lis les sections, pas les pages
   entières par défaut.
2. **Inventory du code actuel.** Vérifie ce qui existe déjà dans
   `core/application/runtime-x86/contracts/tests` sans supposer que le nom d’un
   test prouve la parité native.
3. **Racines IDA.** Établis fonctions, callers/callees, xrefs de tables et
   globals, branches terminales et chemins d’erreur.
4. **Contrat exact.** Ferme largeurs, signedness, sentinelles, bounds, ordre
   des mutations, RNG, consume/rollback, clear/unlink et ownership.
5. **Écriture de preuve.** Distingue `extracted`, `inferred`, `ambiguous` et
   `live-required`. Cite les adresses/racines utiles sans copier des centaines
   de lignes de décompilation.
6. **IDA pushback.** Pour une conclusion forte, renomme/commente/type dans
   l’IDB. N’applique pas un nom définitif à une hypothèse faible ; utilise un
   commentaire `candidate` si nécessaire.
7. **Fixture design.** Décris au moins un cas positif, un cas négatif, un cas
   bounds/rollback et les RNG cursors attendus si la fonction en consomme.
8. **Réconciliation.** Cherche si la conclusion invalide une page ou une unité
   précédente. Corrige, ne juxtapose pas deux versions incompatibles.
9. **Checkpoint ou unité suivante.** Une ambiguïté locale ne justifie pas une
   question à l’utilisateur.

## Foyers prioritaires par vague

### Vague A — G11 Magic

Ferme le reader `K_MAGIC`, les layouts et bounds, la classification offensive/
%HP/status/curative/revive, le stock battle-local, la consommation transactionnelle,
les formules MAG/SPR, Shell, éléments, miss gates, Cure/Life/Full-Life, Zombie
et l’ordre exact des tirages. Relie les helpers partagés à G09/G10 sans appeler
un resolver natif dans le futur contrat.

Livrable minimum : matrice famille → metadata → targeting → RNG → HP/status →
stock commit/rollback, avec chaque branche live-required identifiée.

### Vague B — G12 Item

Ferme `K_ITEM`, equal-item/inventory state, disponibilité et consommation,
classifications damage/curative/revive/status/special, Med Data, Zombie,
invalid targets et rollback. Prouve où Item partage la résolution et où son
stock doit rester indépendant de Magic.

Livrable minimum : matrice Item, read/write set d’inventaire et transaction
exactement-once.

### Vague C — G13 Draw

Ferme disponibilité source, résistance, quantité, RNG, full stock, source death,
Cast/Stock, caps et événements. Trace `aux_5=9/10`, `aux_6=source slot` de leur
writer à leur consumer. Ne promeut pas le vieux `command_id` injecté : sépare
pending `command_id`, discriminator resolver-time et opcode/auxiliaires.

Livrable minimum : tableau des trois couches d’identifiants et question
`SQ-G13-*` live-required si l’authenticité pending reste indémontrable.

### Vague D — G14 callbacks et barrières

Cartographie callback chain, deferred callbacks, allocateurs, ownership des
nodes, unlink/cancel, contexts retenus, relays `0x70/0x71/0x74`, latch et busy
flags. Distingue domaine, scheduler et présentation NCOMP. Recherche les
half-ownership hazards : pointer, allocator ou context d’un propriétaire dans
la liste de l’autre.

Livrable minimum : state machine de barrier, tableau owner/read/write/clear et
liste exacte des observations qui ne peuvent être prouvées qu’en live.

### Vague E — G15/G16 AI

Réutilise les pages `enemy-ai-opcodes.md` et `enemy-ai-vm.md` : ne redécompile
pas mécaniquement 61 opcodes déjà fermés. Vérifie plutôt les racines parser,
section 8, code/text offsets, PC/loop guards, variable spaces, subject readers,
signedness, selectors, puis action emission, mutation, spawn/remove, texte,
rewards et relay requests. Si le corpus `.dat` est disponible, produis un
rapport de couverture statique par opcode/branche sans lancer FF8.

Livrable minimum : crosswalk opcode family → typed replacement interface →
side effects → RNG → barrier, plus malformed/bounds cases.

### Vague F — G17/G18

Pour G17, ferme autant que possible timing réaction/death, last attacker,
Counter, Cover/Return Damage, auto-recover, group 0, Odin/Gilgamesh/Phoenix,
Angelo et raccord G10 Regen/Doom. Pour G18, ferme metadata GF, group-1 routing,
charge cadence, Boost, damage/support/special profiles et absorb pool.

Ici, la confiance doit rester prudente : trigger timing, callback ordering,
charge lifetime et presentation completion peuvent rester `live-required`.

### Vague G — G19/G20 si le temps le permet

Fais d’abord des inventaires exhaustifs. G19 : command IDs, table-driven,
state-only, Card/Devour/Mug/rewards, targeting exceptions. G20 : infrastructure
crisis commune puis Squall/Zell/Irvine/Quistis/Selphie/Rinoa, records, input
windows, resources et cleanup. Ne transforme pas un nom de fonction ou une
page ancienne en state machine certifiée.

## Parallélisme autorisé

Si les subagents sont disponibles, utilise-les pour des sous-tâches bornées :

- audit QMD/wiki et contradictions ;
- inventory du dépôt/corpus ;
- analyse statique d’une vague indépendante ;
- revue de confiance et recherche des interprétations trop fortes.

Le coordinateur principal reste l’unique écrivain des pages communes et du
registre. Un seul agent à la fois effectue des renames/types IDA afin d’éviter
les collisions. Les subagents rendent des dossiers, pas des commits.

## Arrêts et autonomie

Ne demande pas à l’utilisateur de choisir une spell, un item, un monstre ou un
scénario live : le live est volontairement reporté.

Un point est un **blocage local**, pas un arrêt global, si :

- une authenticité pending exige un run ;
- une durée de vie dépend d’un timing dynamique ;
- une table n’est pas présente dans l’IDB ;
- une branche rare manque de corpus ;
- une interprétation a deux lectures plausibles.

Dans ces cas : registre l’incertitude, donne le discriminator, marque
`live-required` si nécessaire, puis continue.

Arrête la campagne seulement si :

- IDA MCP est réellement indisponible ;
- QMD échoue par MCP **et** CLI ;
- le hook RTK requis est absent ;
- des modifications concurrentes rendent les pages ou l’IDB non conciliables ;
- toutes les vagues jusqu’à G20 ont reçu au moins leur profondeur prévue et le
  checkpoint final est compilé.

## Critère de fin minimum

Ne termine pas après G11. Avant de rendre la main, sauf blocage dur :

- G11–G14 ont chacun une section complète dans le ledger ;
- G15 possède le crosswalk U15.1–U15.7 ;
- G16–G18 ont au moins une reconnaissance avec racines, dépendances, risques et
  prochains probes ;
- G19/G20 sont inventoriés si le temps restant le permet ;
- toutes les incertitudes ont un identifiant et un prochain discriminator ;
- les corrections rétroactives ont été appliquées aux pages et à l’IDB ;
- le dernier checkpoint QMD est compilé et les smoke queries passent ;
- aucune promotion live ou implémentation produit n’a été revendiquée.

Le rapport final doit donner : plage réellement couverte, unités non visitées,
confiance par jalon, IDA updates, pages créées/modifiées, questions ouvertes/
résolues, corrections rétroactives et ordre recommandé des futures captures
live. Commence maintenant et poursuis jusqu’à ce critère, sans attendre de
validation intermédiaire.
