# GO S1 auteur — sélection/projection contrôlée et plan approuvé

Autorité : mission M2 approuvée, rapport35 parent ; contrat ratifié en rapport33 (proposal01–06). Même tâche0009/session auteur. Ce GO ne change pas les permissions natives et ne vaut pas preuve de leur disponibilité. Passer au stade natif implementation avec reasoning high proposé, dans le catalogue gouverné, avant édition/exécution si requis. Si refus natif : rapport exact, aucun autre outil/canal pour contourner.

## Destination et entrées

D=`C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/m2-s1-candidate-r2` ; C=`D/tools/ff8-harness`. TOUJOURS chemins/cwd absolus. Worktree externe refusé : aucune nouvelle tentative ; aucune écriture dans les sources canoniques, gels, .git ou preuves numeric.

Projection parent : `projection-receipt.json`, 39 sources/schémas=1019711 octets, 3 tooling supplémentaires ; 42/42 pins/readbacks vérifiés, zéro écart. Dix supports correspondent au GO ; fermeture statique des imports relatifs vérifiée. Cette base n'est pas qualifiée S1, R4 reste proposition à adapter. Sources numeric/planner sélectionnées exactes, pas de rejeu de leurs campagnes. Aucun producteur DB/client ou import value supplémentaire au parse/bind/export.

## Écritures autorisées uniquement sous C

Produit : `src/graph-execution-envelope.ts`, `src/graph-b-projection.ts`, `src/graph-execution-prepare.ts`, `schemas/l8-execution-envelope-v1.schema.json`, `schemas/l8-graph-run-v3.schema.json`. Ne pas éditer artificiellement un fichier resté inchangé.

Auteur : `test/s1-author/fixtures.ts`, `test/s1-author/envelope.test.ts`, `test/s1-author/projection.test.ts`, `test/s1-author/prepare.test.ts`, `tsconfig.s1.json`. Pas d'autres helpers/interfaces publiques ou nouveau framework sans analyse/accord parent. Supports RO : aucune levée de protection, mutation, remplacement ou copie scientifique modifiée.

`tsconfig.s1.json` doit étendre `./tsconfig.s1-resolution.json` fourni parent : base GO strict/noEmit/skipLibCheck conservée, resolveJsonModule/typeRoots et paths vers vraies déclarations existantes. Inclure les trois entrées sources et les quatre fichiers auteur, avec leur fermeture transitive. Aucun node_modules dans C à copier/installer/lier ; aucun stub, suppression d'import obligatoire ou cast d'évitement pour verdir. Le CLI TS est lancé par chemin absolu via le runner, pas C/node_modules absent.

## Tests et commandes bornées

Runner parent `D/run-s1-check.mjs` (SHA d2bf81c5c85c9df25629be7bc5beff4621b249a0e6b2c808eea4188c59926fc6), syntaxe vérifiée seulement, **aucun test/typing produit encore lancé**. Ne pas modifier le runner, ses logs/compteurs, bunfig vide, résolution parent ou projection-receipt.

Commandes autorisées : `node "D/run-s1-check.mjs" envelope "motif précis"` ; idem avec `projection`, `prepare`, `all`, `typecheck`. Substituer D par chemin absolu réel, motif 8..500 caractères sans secret, cwd explicite C. Pas de lancement Bun/TS direct qui évite les compteurs/env. Runner fixe Bun absolu pinné, no-env/config vide, test concurrence1/timeout10s par test, et TS CLI existant, sans shell enfant ; environnement HOME/config/temp frais sous D, SystemRoot/WINDIR vérifiés, aucune option/preload/token hérité.

Maximum12 invocations test à30s wall et4 typings à60s wall, plafond600s cumulé. Pas utiliser tout le budget par défaut. Chaque reprise corrigée explique son impact dans le motif ; stdout/stderr/reçus/scénario/sourcehashs préservés sous D/evidence automatiquement. Timeout/erreur d'outil/signal bloque le runner pour décision parent, pas de retry/reset. Aucun test indépendant/QA, graph-contract/transport DB, global bun test/typecheck/q1, science450/9, FULL planner, inspector, process sentinel, installation, Git ou réseau autorisé ici.

Le runner n'est pas une preuve de confinement des imports ou d'arrêt OS universel : le code doit respecter la fermeture pure du plan et les refus d'observation restent FAIL, jamais refus scientifique attendu. Il exécute les tests statiques RMS autorisés, pas du code reconstruit du jeu. `prepare` est le seul producteur statique explicitement admis après bind, distinct des modules purs ; aucun store/client/DB évalué.

## TDD et critères

Appliquer scénarios du plan public persistant sous mission/inputs/s1-implementation-r2/plan/01–03 : primitives/UTF8 n-1/n/n+1, root/grants/labels/caps et six inégalités, knowledge/provenance/attestation/B1, contexts/groups/planner fixes, generations/refus/nonmutation/exportbytesexact. Attentes indépendantes des détails du candidat et pas goldens générés par ses producteurs ; tests auteur distincts de la QA API future.

Conserver rouge concret sur comportement modifié puis vert du groupe concerné, typing ciblé et composition finale quand pertinent. Pas réexécution des preuves inchangées pour remplir un rapport. Les limites/risques ou défauts ratifiés restent visibles ; pas de `SKIP` compté PASS ni baisse de bornes/suppression de cas.

## Livraison

Retour fichiers/diff/contrats réellement consommés, résultats et budgets, rouges, limites, nouveau manifeste/pins identifiant le candidat. Les preuves sont conservées par runner ; livrer rapport final via team_message, parent persiste si besoin. Ne pas écrire outputs ou nouveaux scripts hors allowlist sans accord. Ne pas clore0009 avant livraison examinable ; pas de commit/merge/push/cleanup même si defaults du harness le suggèrent.

La QA API S1 indépendante, l'intégration et les trois checks consolidés M2 sont ultérieurs. Ce GO est code/tests ciblés uniquement, pas acceptation S1 ou M2.

## Reprise après blocage d'admission historique — rapport39

Le manque signalé est résolu par un **nouvel amendement contractuel07 ratifié**, à lire dans `R/.opencode/missions/team_mvnxgnse_0000_39vpc8/inputs/s1-contract-r2/proposal/07-historical-admission-projection.md`. Il complète 01–06 : vue historique DATA fermée et indépendante, y compris receiptIdentity et ses identités optionnelles réellement absentes/présentes. Aucun body tronqué hashé, commande inventée depuis l'auteur/candidat ou claim d'authentification native ; comparer l'ensemble à la source knowledge indépendante, digest historique opaque.

Reprendre code/tests dans les mêmes cinq cibles + cinq extras ; cette correction ne donne aucun droit de modifier un support RO ou d'ajouter un helper/API/DB. Budget utilisé annoncé :1 test/2 typings/6347ms ; **reste au plus11 tests et2 typings**, plafond600s cumulé inchangé et compteurs runner conservés. Ne pas rejouer les primitives inchangées pour remplir les logs. Ajouter les négatifs/positifs07, fermer schémas/joins/nominaux et identifier le candidat final pour QA API indépendante. Un nouveau manque source/contrat/permission reste à escalader précisément, pas à masquer par comparaison auto-cohérente.

Précision rapport41 : les trois primitives importent directement le module envelope, dont les bytes ont changé depuis leur ancien PASS. Leur inclusion dans une invocation envelope enrichie est donc une non-régression affectée autorisée, sans suppression/SKIP/filtrage ou budget supplémentaire. La composition all finale est permise si l'intégration/entrées/code/conditions pertinentes ont changé depuis la preuve précédente ; pas de répétition identique pour bilan ou nouveau reviewer. Aucun changement du runner requis.

## Correction ciblée TS2589 — extension unique rapport44

Après author12 rouge (4e typing), le parent autorise le helper privé de gel à surcharge BoundPreparationV1→ReadonlyData<BoundPreparationV1>, implémentation unknown déléguant au freeze récursif existant, seul appel avec DTO explicitement typé/validé. Restaurer le ReadonlyData upstream exact ; aucun any/cast d'évitement/ts-ignore/affaiblissement public ou runtime.

Runner parent modifié uniquement pour un **cinquième typing maximum60s**, après correction. Les compteurs et reçus existants ne sont ni supprimés ni réinitialisés. Plafond12tests/600s cumulés inchangé ; aucune sixième invocation typing autorisée. La nouvelle empreinte runner sera consignée au rapport44 (l'ancien SHA de cette consigne désigne la version historique avant cette seule correction de budget). Tests affectés par le nouveau helper peuvent être rejoués dans les quatre invocations test restantes constatées après author11 ; pas un nouveau budget de tests. Si le contrôle supplémentaire échoue, rapport au parent avant toute extension.

## Extension explicite suivante — rapport45

author13 a supprimé la première frontière et découvert TS2589 au retour historique mutable de bindExecutionSourcesV1. Parent autorise le correctif local `attempt<ReadonlyData<BoundExecutionV1>>`, DTO `bound` explicitement readonly construit depuis prepared readonly + origin/planning, puis freeze(bound), supprimant `as BoundExecutionV1` sans nouveau cast/helper. Examiner les retours liés avant contrôle, pas de types permissifs.

**Exactement un sixième typing60s** est maintenant autorisé après cette correction ; la phrase précédente « aucune sixième » décrit la borne historique avant l'arbitrage45. Aucun septième implicite, ledger conservé, maximum12tests/600s cumulé inchangé. Composition all avec le nouveau témoin de gel/détachement/FailureCause autorisée dans les quatre tests encore disponibles, sans revendication JS byte-exact ou réutilisation automatique des71PASS de l'ancienne version. En cas d'échec, retour parent et preuve partielle, pas de relance supplémentaire directe/reset.
