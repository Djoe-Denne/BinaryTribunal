# 62. Trois défauts du transport à corriger avant intégration

## Décision et conséquence

La revue indépendante est récupérée dans sa session native après un défaut de notification. Elle bloque l’intégration du candidat malgré les16 tests injectés réussis. Le parent accepte ses trois constats, vérifiés contre les corps lus : ces tests n’exercent pas suffisamment la liaison au véritable adaptateur. Le candidat reste dans son worktree, non accepté.

## Corrections retenues

1. **Ne pas transmettre la garde d’autorité à un binder quelconque.** Le callback actuel permet à un transport injecté de déverrouiller le transport natif et d’effectuer des créations hors des images et claims retenus. La liaison doit être réservée à une identité privée d’adaptateur, sans remettre de garde aux ports arbitraires, et liée aux identifiants et corps attendus.
2. **Conserver une réponse reçue après révocation.** Les contrôles du transport après réception peuvent convertir cette réponse en simple erreur inconnue. L’observation physique doit être conservée par empreinte avant le refus d’autorité, sans autoriser d’étape suivante. Le faux transport actuel ne reproduit pas ce défaut.
3. **Fermer aussi la lecture d’identité.** Le GET d’identité doit employer le même chemin HTTP borné à20s et refusant les redirections que les autres requêtes. Un signal seul ajouté au SDK ne ferme pas les redirections.

Ces corrections restent dans les quatre fichiers déjà possédés et le contrat ratifié ; aucun nouveau magasin, service, scénario scientifique ou port public d’autorité. Des tests hors ligne du véritable adaptateur, avec discovery et fetch simulés, doivent couvrir le binder hostile, la révocation après réception, les paramètres HTTP et l’absence de POST suivant un refus. Aucun réseau natif ou test exécuté par l’auteur.

## Preuves réutilisées et revalidation

Compilation et16 cas/115 assertions du pin e880a258 restent des preuves de leur portée, pas une validation de ces trois frontières. Les55 primitives inchangées restent acquises. Après gel du correctif, le parent rejouera les contrôles affectés ; la même revue indépendante examinera seulement les défauts et impacts corrigés, sans nouveau cycle complet ou chaîne de spécialistes.

## Trace technique

- Revue finale récupérée : `../evidence/ses_e782236a4ffeQSg60nGCm9uyn6-native-finals-bundle-r1.json`, message `msg_187e7583d001w7RYxLORv0M3iP`, SHA256 texte `98bc39c51472a156dfe3f6856318cc9a3d85cd421e1a599f40310ec61b86141a`.
- Références : `graph-store.ts:331–335`, `native-at-rest-transport.ts:21–33`, `graph-native-at-rest.ts:83–88`, test tardif114–120.
- Revue en lecture seule, sans test exécuté ni transcript privé d’auteur. Aucun nouveau fait d’exécution, droits exercés ou terminaison native.

## Correctifs livrés, compilation de test à reprendre

Le candidat `6272a6de60c6b7d673aa352a8a6f3bc8f22d600c` livre les trois corrections et six cas supplémentaires dans le fichier de tests existant. Le parent a lu les corps affectés et demandé la reprise ciblée à la même revue indépendante. Aucun port de déverrouillage de test ou nouveau harnais n’est annoncé.

La compilation parent échoue toutefois en3400ms sur le typage du mock `fetch` dans le test (TS2345, signature enrichie de Bun). Les nouveaux22 cas ne sont pas exécutés. Correction limitée au double de test demandée, sans supprimer assertions ou contrôle de type global. Les sources restent intactes pendant QA ; reçu `native-at-rest-r5-typecheck.execution.json`. Les trois défauts ne sont pas déclarés fermés avant compilation, tests et revue de leurs impacts.

Le pin suivant `0c6d228ae1d67ac54bf9e5d0b89cd74983febbfe` ajoute uniquement un cast local justifié au double de test pour les helpers statiques de fetch propres à Bun ; assertions et produit inchangés. Compilation et sélection ciblée r6 relancées ; aucun résultat anticipé. La revue est informée de ce delta borné.

## Résultats r6

Compilation sortie0/3449ms ; **22 PASS,251 assertions**,1923ms de processus, sans dérive des sources. Les six cas supplémentaires interceptent les accès du véritable adaptateur, sans serveur réel. Les55 primitives/125 assertions inchangées restent réutilisées depuis r2. Reçus r6 conservés ; reprise de revue indépendante encore attendue avant intégration. Aucun dépassement du plafond de dix minutes par test, aucune qualification native d’exécution déduite.
