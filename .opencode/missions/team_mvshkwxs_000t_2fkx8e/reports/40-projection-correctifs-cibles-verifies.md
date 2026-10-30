# 40. Projection : correctifs ciblés vérifiés, reprise indépendante demandée

## Résultats nouveaux

Le parent a vérifié le delta de quatre fichiers et la conservation textuelle des deux négatifs RED, puis épinglé le candidat r5. La compilation réussit.

Les deux tests inchangés passent désormais :

- Policy dangereuse A/B sans R : **1 PASS, six assertions** ; refus avant anchor et sans admission.
- Expiration provoquée par l'événement d'envoi : **1 PASS, dix assertions** ; aucun appel transport et préimages conservées par rollback.

Deux régressions existantes de transport simulé passent également : **2 PASS, douze assertions**, pour l'envoi après réouverture et la réponse perdue sans deuxième effet. Tous terminent sous la limite externe de quinze secondes. Les365 fichiers sont identiques après les contrôles.

## Ce qui reste bloqué

Le cas central n'a pas été relancé ; son obligation de quinze secondes n'est pas satisfaite. Le positif A+R/B+R avec union exacte autorisée pour R est écrit mais non exécuté. Le fichier complet de projection, l'approbation privée de bout en bout, v3 et natif ne sont pas qualifiés par ces succès ciblés.

Le même reviewer indépendant est repris uniquement sur les deux défauts et l'impact des corrections. Les preuves RED/GREEN et les régressions déjà valides sont réutilisées, sans nouveau tour de couverture générale. Les sources restent gelées et l'intégration reste interdite tant que les preuves obligatoires manquent.

## Preuves

- HEAD `f4e309aeed4ed25b8fd60e6dc0b46c50115a5810` ; manifeste `projection-r5-manifest.json`, SHA256 `affbc7b2291057dc8d577ababe4962229891fc3296da74df00792793ffd43957`.
- Synthèse : `../evidence/projection-r5-targeted-checks.json` ; reçus/captures `projection-typecheck-r5`, `projection-role-green-r5`, `projection-fence-green-r5`, `projection-dispatch-regression-r5`.
- Garde pur : graph-next-context.ts:85–91 ; démarrage/replay et origine actuelle le consomment. Postappend : graph-store.ts:971–977 ; les revalidations sont dans la transaction, avant le try du transport.

Localisation : politique de rôles et transaction d'envoi du candidat isolé. Impact : deux défauts corrigés et vérifiés dans leurs scénarios ; régressions de transport conservées. Limites : revue en reprise, acquisition centrale et délai toujours non prouvés, aucune intégration ou clôture globale.
