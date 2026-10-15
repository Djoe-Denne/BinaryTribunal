# L7 interop — portée de revue indépendante de la tranche initiale

Livraison fresh `l7-interop-r1`, task `task_mv71y0s6_004q_ksbii0`, Sol max,
**PARTIAL_POST_L8_PENDING**, pas clôture de tâche/L7. Sept fichiers nouveaux seulement,
aggregate `b190378cd9bd2a250029f6e122cc5760092ff5ff500f2e7023e2e1512914bec7`.
Les sources et L1 préexistants sont inchangés ; le simulateur historique est absent.

Parent a vérifié les sept SHA et l'aggregate, les dix DB du dernier full livrées
(2 936 832 octets, paths temp propres, SHA exactes), puis exécuté lui-même le
typecheck et les **60 nouveaux tests / 3 149 assertions PASS**, mêmes sept pins
après. Le full852PASS/1SKIP et accepted504PASS restent des preuves auteur jusqu'aux
gates main parent. Aucun de ces résultats ne remplace cette revue.

## Cible

Sous tools/ff8-harness :

- test/simulator/graph-interop-support.ts ;
- graph-interop-relations.test.ts, graph-interop-structure.test.ts,
  graph-interop-adoption.test.ts, graph-interop-planning.test.ts,
  graph-interop-durability.test.ts dans le même répertoire ;
- test/benchmarks/graph-interop-scale.test.ts.

Reviewer fresh distinct de l'auteur, lecture seule de code/contrat, sondes propres.
Ne pas recopier ses oracles ni considérer son manifest/gates comme verdict.

Vérifier que les vraies APIs L2–L6 et leurs bindings sont exercés : sites et
provenances, PPR/cut et fermeture SCC indépendante, must/cannot/maturité/lineage,
receipts/quiescence/claims, vrai Store/GraphStore/EventLog SQLite/fences/reopen/
publication et prérequis durables. Assertions/oracles non circulaires, négatifs
non triviaux et métriques de benchmark limitées au corpus 64/256/1024.

Les callbacks d'autorité sont des fixtures explicites, pas de nouveaux faits
scientifiques/native ni de preuve d'arrêt hôte. Un receipt externe L5 déclaratif
ne devient pas attestation L6. L'historique raw98 PARTIAL/selfLoopsfalse reste
non admissible ; le vrai rejet planning doit être observé sans flip de flags.

## Cas bridge et budgets à regarder spécialement

L1 bridges-rare demeure invalide au L2 actuel : rejet original exact conservé,
pas skip/whitelist. Dérivé test-only explicitement nommé : span17 et nouvelle
identité/fingerprint, inverse/sourcebytes/topologie/provenance/unknown/nonoracle
contrôlés. Voir PARENT/BRIDGES_DECISION.md ; aucune réparation canonique admise.

Le parent a reçu un **autre blocage L8 non encore résolu** : le L5 actuel mesure
son enveloppe structurelle, tandis que L6 mesure une Admission fonctionnelle
complète. Cette tranche n'a pas reçu L8 et ne prétend pas prouver sa verticale.
Vérifier précisément ce que les tests de durabilité couvrent : pas de padding
scientifique, rehash/widening d'un plan frozen ou SQL d'autorité pour fabriquer
le budget/les preuves. Déclarer la portée lower-layer réellement exercée et les
trous, sans rejeter un test valide pour ne pas couvrir un L8 encore absent.

## Exécution et limites

Le parent peut fournir un checkout readonly enregistré contenant le ledger
tracked de 8 943 882 octets, vérifié séparément b5c9dfa1…10e4d4 : il n'est pas
prétendu transféré par le helper 8 MiB. Les sources/runtime explicitement projetés
doivent être hashés ; zéro modifications de sources du reviewer.

Exécuter les 60 tests ciblés et petites probes indépendantes utiles. Les tests
créent des **DB SQLite fixture propres** sous Temp/opencode/graph-interop-* :
c'est autorisé pour cette revue, fermer/hasher/conserver les artefacts, aucun
delete. Les dix DB auteur peuvent être consultées readonly comme artefacts,
jamais comme oracle indépendant ; pas d'accès à la DB privée Ensemble.

Pas d'install, Git/commit worker, réseau/dispatch/LLM/IDA/live, autres sourceWT,
sous-agent ou inbox/team_results. Pas de full harness/native claim sans exécution
effective. Rapport final scoped acceptable ou défaut avec repro/path:line,
oracles/probes propres, pins avant/après et limites. Parent seul juge/intègre ;
post-L8 et L9/L10 restent requis même si cette tranche est acceptable.
