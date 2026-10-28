# M2 — 48 : plan QA API indépendant reçu et moyens bornés

## Livraison récupérée, pas de nouveau diagnostic produit

Le retour failed de la QA décrit une phase1 terminée sans accord d'écriture/exécution reçu, pas un défaut du candidat. Le parent a récupéré le plan public complet dans [PLAN_PHASE1.md](../inputs/s1-api-qa-r2/PLAN_PHASE1.md),9174octets/SHA9f5784c0… ; provenance native/AST sans eval ni raisonnement privé dans RECEIPT.json. Aucune reprise de préparation déjà faite n'est demandée.

Le worker a lu contrat01–07 et signatures/types publics avant corps, sans fixture/test/golden auteur. Plan retenu : ledger clause→entrée→mutation→attente→preuve, données synthétiques manuelles, hashes/oracles indépendants du SUT. Un négatif de join rafraîchit les hashes requis et possède un nominal atteignant réellement la frontière ; un rejet précoce de digest ne prouve pas un join sémantique.

## Contrôle proportionné approuvé

Cinq groupes : wire/run, root/sources, knowledge, fixed-projection, isolation. Primitives/UTF8/domaines, indépendants exacts, grants et six capacités, provenance historique/receipt/attestation/publication, contextes et dérivations fixes, pureté des imports producteur/backend. Pas d'authentification/préimagebody/CAS/publication effective déduits de DATA S1. Les limites et preuves externes de01–07 demeurent.

La matrice du plan fixe les attentes avant lecture des corps. Enregistrer les cas concrets dans le ledger QA avant cette lecture ; ensuite, seuls des corps ciblés nécessaires à une preuve ou à la localisation d'un défaut peuvent être examinés. Ne pas retourner l'attente pour accepter l'implémentation. Pas de gate supplémentaire de reviewer : la QA est déjà l'obligation indépendante prévue.

## Destination, inputs et droits

Q=`R/.tmp/m2-s1-qa-r2`, harness sous Q/tools/ff8-harness ; parent projette les42fichiers produit/support/tooling du candidat47pinné, **sans les cinq extras auteur**. Tous ces inputs restent RO. Aucun changement C/canonique/gels, aucun test/fixture/golden auteur lu ou copié pour l'oracle. Config parent de résolution types vers les dépendances existantes, pas de node_modules copié/lien/install.

Écritures QA proposées retenues uniquement : cinq tests `test/s1-qa/{wire-run,root-sources,knowledge,fixed-projection,isolation}.test.ts`, quatre fixtures `fixtures/{manual-base,manual-root,manual-knowledge,manual-context}.ts` et deux oracles `oracle/{cases,wire}.ts` sous ce même dossier ; `tsconfig.s1-qa.json` et Q/reports/{plan-and-cases.md,verdict.md}. Runner parent seul possède Q/evidence et les environnements/logs. Pas de nouveau framework, driver DB ou helper producteur.

`mock.module` Bun existant autorisé **dans le seul processus du test isolation** pour des gardes qui échouent si un producteur/backend est appelé/importé par le chemin purement testé ; jamais un stub permissif qui fabrique la valeur attendue. Aucun mock global partagé entre groupes, aucun processus enfant lancé par les tests eux-mêmes, DB/client/native évalué ou réseau. Les cinq groupes sont lancés séparément par le runner parent, process frais.

## Commandes et budget

Runner parent fini Q/run-s1-qa-check.mjs : `node <runner> <wire-run|root-sources|knowledge|fixed-projection|isolation|typecheck> <motif précis>`, cwd absolu Q/tools/ff8-harness. Bun absolu pinné, no-env/config vide, concurrence1/timeout10s par test ; typing CLI TS existant absolu, strict/noEmit conservés. Env fermé HOME/config/temp possédés, pas options/preloads/tokens hérités.

Initial : un typing60s et cinq groupes30s ; **au plus deux reprises ciblées justifiées, huit invocations au total et300s cumulées**. Pas de retry automatique, rejeu valide inchangé ou compteur réinitialisé. Un incident outil/signal/timeout bloque pour décision parent. Un défaut produit doit être rapporté : la QA ne modifie pas le candidat RO pour obtenir un vert. La reprise après correction portera sur le défaut et son impact.

## Gates et résultats non acquis

Projection/readbacks/syntaxe du runner et approbation native du plan doivent précéder l'exécution ; passage worker en implementation/high proposé selon politique native, sans changement de permission/modèle imposé. Le GO effectif sera confirmé après ces préparatifs. À ce stade aucun test QA exécuté, pas de verdict S1. Numeric/planner/typing auteur et tests auteur valides restent réutilisés dans leurs portées, non des oracles QA.

Trois checks consolidés M2 NON EXÉCUTÉS ; pas de replay450/9/FULL, de Git/merge/cleanup, DB/native/live/IDA/G5–G7 ou pipeline ajouté.

## Moyens effectivement préparés et GO

Projection réalisée sous Q :42fichiers/1098088octets, readbacks conformes, cinqextras auteur exclus. Reçu [s1-api-qa-r2-projection.json](../evidence/s1-api-qa-r2-projection.json) ; résolution TS parent et config Bun vide fournies, aucun node_modules copié/installé/lié.

Runner parent `Q/run-s1-qa-check.mjs` : node --check PASS/SHA0b32d0073c3e676d45a01fd21845f7a1ae3acd369d2eb403fd85d128476b0d86 ; aucun test/typing QA lancé pour cette vérification. Il lie42inputs immuables, sources QA/caseledger et logs aux invocations, borne huitruns/deuxreprises/300s, process frais par groupe.

**Le parent approuve le plan et autorise l'écriture/exécution QA ciblée sous Q/QA_AUTHORIZATION.md**, après l'étape native implementation/high proposée et sans changement de permissions. Les attentes du plan sont acceptées comme base indépendante ; ledger concret à écrire avant lecture des corps ciblés, pas de nouvelle gate d'approbation pour chaque cas. Cette décision n'est pas un verdict S1 ou un PASS de test non lancé.

Approbation native et messageforce effectivement envoyés à `s1-api-qa-r2`, même session `ses_e860de5e7ffeDhHeTIN1I7ijp7` ; team_view confirme busy. Le statut failed de la préparation attendue n'est donc pas le verdict courant d'un produit échoué ni un blocage d'accord persistant. Aucun test encore observé à cet instant.
