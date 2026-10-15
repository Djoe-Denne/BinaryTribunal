# Développement L7/L8 et revue du simulateur — 2026-10-15

Équipe existante, plafond cinq workers, politiques modèle/provider rev2/rev4,
classification manuelle, dispatch/scaling automatiques désactivés inchangés.
Modules acceptés commit `9a35cb9`, baseline de phase **e03e063**.

## Modèles et frontières

Grok a été tenté uniquement via **cursor/grok-4.7 / Grok 4.7 Extra High**.
Le harness a refusé sa présence/disponibilité dans la sélection opérateur : aucun
worker/claim créé ni quota global inféré. L'utilisateur a confirmé **Grok uniquement
via cursor** ; aucun autre provider Grok n'est une route. Sol Max déjà autorisé a
été annoncé puis employé, sans sélection/configuration/politique modifiée.

L8 `l8-integration-r1` : tâche existante `task_mv6towrm_000c_24005n`, session
`ses_ec12fcc43ffeI6xXQ5rSTty2mV`. L7 `l7-interop-r1` : tâche existante
`task_mv71y0s6_004q_ksbii0`, session `ses_ec12e19acffe3Ks6U1fc4l9zPK`.
Deux auteurs fresh/build distincts, **openai/gpt-6.1-sol / max natif relu**.
Les deux sessions naissaient en main ; parent les a déplacées dans leurs OWN
worktrees isolés puis a relu répertoire/HEAD avant analyse. Les worktrees Git sont
en detached HEAD enregistré, pas supposés avoir une branche checkout depuis leur nom.

## Paquet et accès réel

Baseline `MAIN_e03e063_OFFLINE` : **398 fichiers / 7 796 724 octets** ;
fingerprint L8 `a64f2dba5bca00275ff5f54a5b44cb6805e6fb885bec4a3c5c086277ab7fc5cc`,
L7 `1a1d78459bfdb132c116c28bc994ce9f984c09fdc08e185f09d22e2642085ceb`.
Binding natif session/tâche vérifié par helper. Chacun a ensuite effectivement
lu/hashé les 398 fichiers et les principaux sources de son OWN, puis parent a
approuvé accès/rôle. Les reçus préparés n'ont pas été altérés en fausse autorité.

Les 293 fichiers sélectionnés de HEAD + quatre références existaient exacts dans
chaque checkout : aucune source écrasée. Raw98 + manifeste original : 99 fichiers
explicitement projetés depuis les inputs dans chaque runtime OWN. Douze pins
modules vérifiés dans les deux. Ledger 8 943 882 octets hors helper 8 MiB, mais
**déjà présent et hashé séparément** dans les deux HEAD (`b5c9dfa1…10e4d4`).
Jonctions node_modules READONLY préinstallées, lock/deps compatibles, aucun install.

Les maintenances non committées de main ne sont pas dans ces HEAD. Parent a testé
le vrai OWN L8 avant tout code : **typecheck0, 792 PASS / 1 SKIP / 74 023 assertions**,
793 tests / 21 fichiers. Distinct de main818PASS qui comprend 26 cas de maintenance.
Même baseline/pins dans les deux OWN, pas deux runs complets dupliqués.

## Plans et permissions courants

**L8 : plan examiné et tranche A approuvée**, cinq centraux + trois nouveaux modules
et sept nouveaux tests, exacts dans `L8_PHASE_A_PLAN_APPROVAL_20261015.md`. DTOs et
façade additifs autorisés sans MissionConfig/L1 modifiés ; store/validation/autres
modules readonly. GO préparation/adaptateur/boucle/recovery + CLI offline, puis
livraison et PAUSE avant L4 régime B ou simulateur historique. Legacy, Intent
fonctionnel, OWNv6/proofs/fences et reçus complets restent opposables. Journal
générique/discriminant protocolaire seuls ne font jamais autorité. Zéro runtime réel.

**L7 : plan initial approuvé**, sept nouveaux fichiers uniquement :
`test/simulator/graph-interop-{support,relations.test,structure.test,adoption.test,planning.test,durability.test}.ts`
et `test/benchmarks/graph-interop-scale.test.ts`, sous tools/ff8-harness.
Oracles analytiques/brute-force et digest propre, vrais modules acceptés L2–L6,
aucune production/L1/anciens tests modifiés. DB SQLite fixture uniques autorisées
sous `%LOCALAPPDATA%/Temp/opencode/graph-interop-*`, fermer handles et préserver
les artefacts, aucun delete. Benchmarks bornés 64/256/1024, pas de timing couperet
ni performance universelle. Bug production → reproduction/escalade, pas test affaibli.
Livraison initiale **PARTIAL/post-L8 attendu**, aucune clôture L7 globale.

## Écart de projection corrigé et vrai simulateur récupéré

L7 a justement signalé simulator.ts et ses répertoires absents de HEAD/du paquet.
Parent a corrigé l'assignation : les douze fichiers intégrés ne comprennent pas le
simulateur historique ; aucun pin fabriqué. Les nouveaux répertoires QA peuvent
être créés après le plan approuvé. La tranche directe L2–L6 peut avancer sans lui.
L8 est informé de ne pas inventer un double simulateur ; son plan central n'attend
pas toute la clôture L7.

L'ancien `l7-qa-r3` conserve source **dcaa4ace0ead545469d0390921265b615b0eb6da743f0b7695e7c58219177df4**,
60 483 octets, plus dix tests/benchmarks/preuves. Auteur non réveillé ; onze fichiers
gelés sur dépendances actuelles dans `L7SIM_CURRENT_BASELINE`, manifest
`cba9fc64b9c8486c8772ccd969df504226c9e497fb82854eadcc148df30102a4`.
Parent actuel : **typecheck0, 35 focused PASS / 11 195 assertions**. Pas acceptation.

Revue fresh readonly `l7-simulator-review`, task `task_mv9bx661_001a_yo6gdp`,
session `ses_ec1221d76ffeWTBGUZfBaBDDFP`, Sol max natif vérifié. Paquet **409 fichiers /
8 034 297 octets**, fingerprint
`8aa23d04065ec6480832bf1131e5c8f295ae117418736be25f7e01204a674ee2`.
409 pins réellement lus/hashés par reviewer puis accès/rôle approuvés, GO analyse
donné. Trois rapports auteur omis ; benchmark JSONL = données, jamais oracle.
Un appel initial team_results avant lecture du HOLD a été déclaré : seul son propre
HOLD exposé selon reviewer, aucun autre rendu ; pas de prétention zéro inbox lifetime,
aucun restart imposé sur cette déviation déclarée. Aucun autre accès inbox autorisé.
Verdict final **BLOCK**, cinq findings dont deux P1 ; parent reproduit ressources
permissives et famine G2, ainsi que mauvaise attribution et chemin critique local.
Reviewer fermé, onze originaux intacts, simulateur toujours **non intégré**.
Contrat de correction renforcée fresh Sol max :
`L7_SIMULATOR_BLOCK_AND_FIX_CONTRACT_20261015.md`, plan avant toute édition.
Simulation mémoire ≠ L6 durable/native.

## Décisions supplémentaires livrées sans notification tronquée

L'arbitrage bridges-rare n'avait atteint L7 que sous un header tronqué. Parent a
préparé **3 fichiers / 17 492 octets** dans `OWN/inputs/BRIDGES_RARE_V1/`, fingerprint
`fe67243807dddf44bb13f054f126c88c8ee3bec6ecf672dfe32e369eeda11f46`.
L7 a effectivement lu/hashé les trois, puis a reçu un GO final court ; aucune
instruction devinée depuis un résumé, aucun usage inbox. Les tests portables
construisent le dérivé explicitement, sans dépendre de ces fichiers privés.

L8 a proposé l'ancre additive `CycleRecord.graph` avant write. Parent a relu
Store.load/commit et Engine.begin, puis livré la décision complète dans
`OWN/inputs/L8_CYCLE_ANCHOR_V1/DECISION.md`, **1 fichier / 3 928 octets**, fingerprint
`c7e2b3aa1c52e389c3787c2f29aa109d6d76327fb6b59cb72dbcc5c2e268bab0`.
Lecture/hash effectifs ACK, puis GO final court : champ optionnel, garde avant
attach/renew/control legacy, aucun effet activant avant CAS ancré, pas de Store/L1/
MissionConfig changé. Voir `L8_FROZEN_CYCLE_ANCHOR_GO_20261015.md`. Une présence
malformée n'est pas du legacy, un marker/hash n'est jamais une autorité. Code et
tests de cette extension restent à vérifier ; pas de signature anticipée.

Reçus : `.tmp/coordination-three-20261014/` admission pre/post, preparation,
runtime-readback, development-HEAD-baseline et l7-simulator-current. Aucun worker
ne délègue/commit, aucune mission réelle/LLM/dispatch/IDA/live/publication, nouvelle
équipe, config globale, achat, reset, suppression ou push.

## Suite : correcteur renforcé, livraison QA et blocage budget

Correcteur fresh `l7-simulator-fix-max`, task `task_mv9doihe_0028_o59w3v`, session
`ses_ec0f4f005ffeiESudi5ADo2QXH`, **Sol max natif/OWN relus**, HEAD903bf6e.
417 inputs / 8 077 481 octets, fingerprint
`355badfa38a36569df2cf089137e40aea3a16527fe9865ced602ba687d072297`.
Lecture/hash des 417 confirmée puis GO analyse/repros/plan, **pas encore de write GO**.
302 HEAD/refs exacts et 110 fichiers candidat+raw projetés sans overwrite ; libs
préinstallées par jonction OWN autorisées readonly, pas sources du parent.

L7 initial QA livré : 7 sources gelées aggregate b190378c…, 60 nouveaux cas,
auteur852PASS/1SKIP et504acceptedPASS, toujours PARTIAL/post-L8. Parent vérifie les
sept pins et les dix DB du dernier full (2 936 832 octets), puis exécute lui-même
typecheck0 et **60PASS/3 149 assertions**. Gel `L7QA_INITIAL_E03`, 422 fichiers /
10 936 101 octets, manifest
`4590f09af2c5d4a4f72ee281e8f0e28705e3a4b940a645578b27cc7534fe9b1e`.
Revue indépendante encore requise, aucune intégration des sept tests acquise.

L8 A est gelé sur un vrai blocage L5→L6 : enveloppe structurelle3073, Admission
complète A/B3578 et R13590, plafond global1M inchangé. Parent reproduit le paquet
pur validé localement, zéro submit et R **likely**, sans preuve scientifique.
Sources L5/L6 intactes, garde conservée. Paquet `L8_BUDGET_BOUNDARY_EVIDENCE`,
443 fichiers / 8 184 776 octets, manifest
`b682682a26c54f9828ca18ab0ad6ebe8e46f40a4403ba57fca26e80bac2df059` :
13 sources L8 intermédiaires et32 preuves, pas code accepté.
Voir `L8_ADMISSION_BUDGET_BOUNDARY_20261015.md` : analyse avant choix d'une API
pré-freeze versionnée, aucune permission d'élargir après gel ou padding scientifique.
