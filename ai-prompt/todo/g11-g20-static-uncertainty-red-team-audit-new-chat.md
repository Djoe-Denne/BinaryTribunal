# Audit red-team — incertitudes et qualité de la documentation statique G11–G20

## Mission

Évalue indépendamment la documentation produite par la campagne statique
G11–G20. Il ne s'agit ni de continuer l'investigation vers G21, ni de réécrire
immédiatement les pages, ni de promouvoir un jalon. Ton objectif est de dire,
claim par claim, ce qui est réellement démontré, ce qui est seulement recopié,
ce qui reste statiquement fermable, ce qui exige une ressource offline et ce
qui ne pourra être tranché qu'en live.

Travaille comme un reviewer red-team. Les noms, types et commentaires ajoutés
à l'IDB pendant la campagne du 2026-08-18 sont des **objets à auditer**, pas des
preuves indépendantes. Les pages modifiées par cette même campagne ne se
corroborent pas entre elles.

Il n'existe aucune durée minimale à simuler. Ne travaille pas « pendant deux
heures » parce qu'un texte le demande et n'invente jamais un timestamp futur.
Termine uniquement lorsque les critères de couverture mesurables de ce prompt
sont satisfaits.

## Mode strictement audit

Autorisé :

- lectures ciblées du vault, du transcript Cursor et des dépôts ;
- QMD lexical et sémantique ;
- IDA MCP en lecture seule : bytes, disassembly, decompile, xrefs, call graph,
  globals, structures et types existants ;
- lecture et parsing offline de `kernel.bin` et des `.dat` si ces fichiers sont
  disponibles sans lancer FF8 ;
- création du rapport d'audit et de ses checkpoints ;
- mise à jour de l'index et du log uniquement pour rendre le rapport trouvable.

Interdit pendant cet audit :

- lancer, attacher, piloter ou injecter `FF8_EN.exe` ;
- écrire dans la mémoire d'un processus ;
- modifier le code de production de `FinalFantasy_VIII_Reimaginated` ;
- corriger les pages canoniques, le ledger ou le registre SQ pendant que tu les
  évalues ;
- ajouter, modifier ou supprimer noms, types ou commentaires dans l'IDB ;
- prendre un commentaire IDA, un nom Hex-Rays ou un résumé QMD pour une preuve ;
- déclarer `Gxx.satisfied`, `closed`, `byte-exact live` ou équivalent ;
- committer.

Si tu trouves une erreur certaine, inscris-la dans le rapport avec un patch
recommandé, mais ne l'applique pas. Cette séparation empêche l'audit de masquer
ses propres constats.

## Préambule outillage — une vérification, pas de redécouverte

### RTK

RTK n'est pas un MCP. Vérifie une seule fois :

```powershell
Get-Command rtk
rtk --version
Select-String -Path "$env:USERPROFILE\.cursor\hooks.json" -Pattern "rtk hook cursor|preToolUse" -Context 1,1
```

La version connue est `0.42.4`. Si la commande et le hook sont présents, note
`rtk=pass` et n'y reviens plus. Ne préfixe pas les commandes avec `rtk` : le
hook agit automatiquement. Si le hook est réellement absent, arrête avec le
diagnostic exact.

### QMD

La collection est toujours `ff8-wiki`. Dans Cursor, découvre le serveur une
seule fois avec `GetMcpTools`. N'appelle pas dix fois la découverte. Utilise
ensuite `query/get/multi_get`, ou immédiatement le CLI en cas de panne MCP :

```powershell
qmd status
qmd search "..." -c ff8-wiki -n 8 --files
qmd vsearch "..." -c ff8-wiki -n 8 --files
qmd get <page>:<ligne> -l <nombre>
```

QMD sert à trouver les sources et contradictions. Retrouver le ledger dans QMD
ne corrobore pas le ledger.

### Context Mode

Context Mode est facultatif. Utilise-le pour comprimer un inventaire de dépôt
ou un gros résultat de corpus, pas pour aspirer des pages entières déjà
accessibles par QMD. Une sortie massive de centaines de kilo-octets est un
échec d'économie de contexte. Si Context Mode échoue mais que les lectures
natives fonctionnent, note `tooling_degraded=context-mode` et continue.

### IDA MCP

Le serveur requis est `user-ida-pro-mcp`. Vérifie une seule fois :

- chemin de l'input et de l'IDB ;
- image base `0x400000` ;
- hash de l'EXE supporté
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` ;
- décompilation d'une fonction connue.

Utilise les adresses comme racines. Un lookup par nom peut échouer à cause du
namespace `domain::`; cela ne prouve pas l'absence de la fonction.

Pour vérifier un claim, privilégie :

1. bytes/disassembly et branches à l'adresse exacte ;
2. xrefs entrants et sortants ;
3. largeur, signedness, bounds et writers ;
4. pseudocode Hex-Rays, après confrontation au désassemblage ;
5. ressource offline authentique (`kernel.bin`, `.dat`) ;
6. seulement ensuite, pages, transcript, noms et commentaires existants.

## Baseline à auditer

Vault :

`C:\Users\djden\source\repos\retro-eng\re-ff8`

Implémentation, lecture seule :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Transcript de la campagne :

`C:\Users\djden\.cursor\projects\c-Users-djden-source-repos-retro-eng-re-ff8\agent-transcripts\62057468-455d-4d21-857f-18d8e039ff06\62057468-455d-4d21-857f-18d8e039ff06.jsonl`

Documents principaux :

- `obsidian-docs/projects/re-ff8/references/g11-g20-static-readiness-ledger.md`
- `obsidian-docs/projects/re-ff8/references/g11-g20-static-open-questions.md`
- `obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md`
- `obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md`
- `obsidian-docs/projects/re-ff8/concepts/draw-magic-and-render-bridge.md`
- `obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md`
- `obsidian-docs/projects/re-ff8/concepts/enemy-ai-vm.md`
- `obsidian-docs/projects/re-ff8/references/battle-formulas.md`
- `obsidian-docs/projects/re-ff8/references/battle-iso-migration-milestones.md`
- `docs/tech/reference/command_id_table.md`
- `docs/tech/reference/kernel_tables.md`

Baseline d'implémentation revendiquée : HEAD
`f959679bd2536648acad57321ecbd276965ab9be`. Vérifie-la et note toute dérive.

## Alertes initiales à contrôler, pas à accepter aveuglément

L'audit précédent a signalé les points suivants. Vérifie chacun à nouveau :

1. la campagne Cursor a commencé vers 09:57 et les fichiers ont été écrits
   vers 10:28, alors que le ledger/log portent un checkpoint final à 12:00 ;
2. le rapport annonce 16 questions ouvertes, tandis que le registre semble
   contenir 18 entrées : 12 `open`, 5 `live-required`, 1 `resolved` ;
3. la section Group Routing peut confondre le switch sur
   `pending_triplet_base[v2].command_id` à `0x484838` avec le
   `COMMAND_TYPE_ID` du resolver ;
4. le commentaire IDA à `0x484FD0` semble écrire `command_id=0x06` plus
   fermement que le statut live-required de SQ-G13-001 ;
5. `battle-lifecycle.md` contient possiblement deux titres `Open Questions` ;
6. G11–G13 possèdent des transactions narratives, mais pas toujours des
   read-set/write-set/ownership explicites ;
7. G16–G20 sont annoncés comme reconnaissance : vérifier que leurs scores et
   formulations ne donnent pas une fausse impression d'implémentabilité.

Ces alertes peuvent être confirmées, nuancées ou réfutées.

## Modèle d'indépendance des preuves

Pour chaque claim, indique l'origine de chaque support :

- `RAW_IDB` — bytes, désassemblage ou contrôle de flux observé maintenant ;
- `XREF` — caller/callee ou reader/writer observé maintenant ;
- `TYPE` — largeur, signedness ou structure recoupée ;
- `RESOURCE` — donnée authentique offline (`kernel.bin`, `.dat`) ;
- `CODE` — contrat actuel du dépôt d'implémentation ;
- `LIVE_PRIOR` — ancienne preuve hash-bound déjà promue ;
- `SAME_CAMPAIGN_DOC` — ledger/page/comment du 2026-08-18 ;
- `OLDER_DOC` — page antérieure ;
- `INFERENCE` — reconstruction ;
- `RUNTIME_REQUIRED` — cadence, durée de vie ou record authentique impossible
  à certifier statiquement.

`SAME_CAMPAIGN_DOC` ne compte jamais comme une deuxième preuve. Un commentaire
IDA ajouté dans le transcript audité reste `SAME_CAMPAIGN_DOC`, même s'il est
visible dans la décompilation.

## Statuts de verdict par claim

Utilise exactement ces verdicts :

- `confirmed-static` — contrôle de flux et données suffisants pour coder ;
- `confirmed-static-with-cap` — algorithme solide, mais exhaustivité/lifetime
  non close ;
- `refuted` — contradiction avec bytes/xrefs/code actuel ;
- `unsupported` — seulement recopié ou nommé, sans preuve indépendante ;
- `offline-resource-required` — `kernel.bin`, `.dat` ou autre fichier suffit ;
- `live-required` — record authentique, cadence ou lifetime dynamique requis ;
- `out-of-scope-recognition` — inventaire honnête, pas encore un contrat.

## Confiance reproductible

Ne donne pas un score « au feeling ». Pour chaque claim, documente les éléments
présents :

- +0.30 : bytes/désassemblage et branches recoupés ;
- +0.20 : xrefs/readers/writers suffisamment exhaustifs ;
- +0.15 : types, largeurs, signedness, sentinelles et bounds ;
- +0.15 : table/ressource authentique ou second chemin indépendant ;
- +0.10 : ordre des mutations/RNG/erreurs fermé ;
- +0.10 : aucune hypothèse de cadence ou de lifetime nécessaire.

Applique aussi ces plafonds :

- commentaire, rename ou vieille page seuls : maximum 0.30 ;
- pseudocode Hex-Rays sans disassembly/xrefs : maximum 0.65 ;
- writers non inventoriés : maximum 0.74 ;
- cadence/lifetime seulement statiques : maximum 0.69 ;
- record pending authentique non capturé : maximum 0.74 ;
- table BSS dont les bytes `kernel.bin` ne sont pas extraits : maximum 0.79
  pour les claims dépendant de ses valeurs, même si son layout est fort.

Le score du jalon est la médiane prudente des claims nécessaires pour
l'implémenter, pas la moyenne des claims faciles.

## Livrable unique

Crée :

`obsidian-docs/projects/re-ff8/references/g11-g20-static-uncertainty-red-team-audit.md`

Ce document doit contenir :

### 1. Intégrité de campagne

- heure réelle système obtenue avec `Get-Date -Format o` ;
- timestamps du transcript et métadonnées des fichiers ;
- ordre réel des checkpoints et compilations QMD ;
- nombre réel de tool calls par famille ;
- vérification RTK/QMD/Context Mode/IDA ;
- compte exact des questions et des annotations IDA ;
- toute donnée de log invérifiable ou fabriquée.

Ne transforme pas une campagne rapide en défaut par principe. Le défaut est
l'écart entre les preuves produites et les affirmations, pas le nombre de
minutes.

### 2. Matrice de claims

Une ligne par claim significatif :

| Claim ID | Gate/unit | Claim exact | Source actuelle | Vérification fraîche | Indépendance | Verdict | Confiance avant→après | Impact |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- |

Utilise des IDs stables `CA-G11-001`, `CA-G11-002`, etc. Relie chaque claim aux
lignes du ledger ou de la page canonique.

### 3. Audit des 18 entrées SQ

Audite **toutes** les entrées du registre, y compris la résolue. Pour chacune :

- statut actuel et statut recommandé ;
- preuves indépendantes trouvées ;
- ce qui est encore absent ;
- décision : prochain probe statique, ressource offline ou capture live ;
- coût estimé `small`, `medium`, `large` ;
- valeur : l'incertitude bloque-t-elle réellement l'implémentation ?

Une question marquée `live-required` doit expliquer pourquoi aucune lecture
statique ne peut raisonnablement suffire.

### 4. Audit profond G11–G14

Audite au minimum tous les claims qui conditionnent l'implémentation :

#### G11

- layout, cardinalité et bounds `K_MAGIC` ;
- dispatcher par `attackType` et UNMISSABLE/LV_ATTACK ;
- stock battle-local, import, persist et blow-away ;
- consume Magic, erreur, Silence, Angel Wing, Dual/Triple ;
- ordre RNG des familles ;
- Cure, Life, Full-Life, Zombie et Med Data.

#### G12

- layout/cardinalité `K_ITEM` et `ITEM_TENT` ;
- EQUAL import/mutate/persist ;
- signification réelle de `target_mask & 0x4000` ;
- exactly-once consume et refund ;
- `unknown2`, `attackFlags`, `attackParam` ;
- Med Data, Zombie et ordre RNG.

#### G13

- trois couches d'identifiants : pending, resolver, aux ;
- writer et unique caller de `PendingCmd_QueueOrStore` ;
- switch de transfer à `0x4847F0` ;
- formule de quantité et ordre RNG ;
- Cast, Stock, full stock, source death et GF Draw ;
- préciser exactement ce que l'IDB prouve ou non sur le candidat `0x06`.

#### G14

- allocateur, node layout, retenue et unlink ;
- relays `0x70/0x71/0x74` ;
- read/write/clear et ownership ;
- distinction latch action, result latch, busy presentation ;
- ce qui relève d'un futur design replacement plutôt que du natif observé.

Pour chaque gate, produis un tableau explicite :

| Read-set | Write-set | RNG | Error/rollback | Ownership | Static holes | Live holes |
| --- | --- | --- | --- | --- | --- | --- |

### 5. Contrôle G15–G20 proportionné

- G15 : audite les sept lignes du crosswalk contre la page opcode canonique et
  au moins un extrait frais de la VM ;
- G16–G18 : contrôle au moins les trois claims ayant le plus fort impact par
  jalon, plus tout claim présenté au-dessus de 0.70 ;
- G19–G20 : cherche surtout les formulations qui ressemblent à un contrat
  alors qu'elles ne sont qu'un inventaire ; ne tente pas de fermer six state
  machines en passant.

Marque explicitement les lignes qui doivent rester
`out-of-scope-recognition`.

### 6. Contradictions et hygiène du wiki

- liens cassés et pages orphelines nouvelles ;
- headings dupliqués ;
- résumé/frontmatter/provenance ;
- liens importants supprimés au lieu d'être complétés ;
- contradictions entre ledger, questions, pages canoniques, docs techniques et
  IDA ;
- assertions propagées dans plusieurs pages depuis une seule source faible ;
- exactitude des comptes et timestamps du log.

Fournis des patchs recommandés courts, mais ne les applique pas.

### 7. Verdict final

Donne :

- score documentaire séparé du score technique ;
- confiance recalculée par jalon ;
- liste `must-fix before G11 implementation` ;
- liste `can wait` ;
- ordre des probes offline à meilleur rendement ;
- ordre minimal des futures captures live ;
- recommandation explicite : `reject`, `accept-as-draft`,
  `accept-for-offline-implementation`, ou `accept-as-canonical`.

## Checkpoints réels et QMD

Utilise trois checkpoints événementiels, sans heure arrondie inventée :

1. après intégrité + inventaire des 18 SQ ;
2. après audit profond G11–G14 ;
3. après contrôle G15–G20 et verdict.

Immédiatement avant chaque entrée de log, récupère l'heure avec :

```powershell
Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"
```

Copie exactement cette valeur. N'écris jamais `11:30` ou `12:00` pour faire
croire à une durée future.

À chaque checkpoint :

1. écris l'état réel dans le rapport d'audit ;
2. ajoute une ligne `REDTEAM_CHECKPOINT` au log avec les vrais comptes ;
3. compile `ff8-wiki` ;
4. exécute deux recherches : une conclusion confirmée et une contradiction ;
5. vérifie que QMD retourne le rapport, pas seulement le ledger source.

Ne marque `qmd=pass` qu'après la commande et les deux résultats. Si la
compilation n'a pas encore eu lieu, écris `qmd=pending` et ne prétends pas que
le checkpoint est consolidé.

## Critères de fin vérifiables

Ne termine que lorsque :

- les 18 entrées SQ ont chacune un verdict et une prochaine action ;
- tous les claims nécessaires de G11–G14 sont dans la matrice ;
- les read/write/RNG/rollback/ownership tables G11–G14 existent ;
- G15 a sept lignes contrôlées ;
- G16–G18 ont au moins trois claims contrôlés chacun ;
- G19/G20 ont reçu un audit d'overclaim ;
- les alertes initiales sont toutes confirmées, nuancées ou réfutées ;
- aucune correction canonique ni mutation IDA n'a été appliquée ;
- le dernier checkpoint QMD et ses deux smokes sont réellement passés ;
- le rapport sépare clairement ce qui bloque G11 de ce qui peut attendre G17+
  ou un test live.

Le rapport final dans le chat reste bref : verdict, nombre de claims audités,
erreurs certaines, incertitudes reclassées, confiance par gate et lien vers le
rapport. Commence maintenant sans demander de scénario in-game.
