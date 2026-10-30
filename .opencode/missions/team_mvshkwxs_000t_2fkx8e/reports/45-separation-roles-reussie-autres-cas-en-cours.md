# 45. Séparation des rôles réussie ; autres scénarios en cours

## Résultats vérifiés

Le second positif normal réussit : **1 PASS,44 assertions**,232456 ms de processus, soit environ3 min52 s. Il démontre les exclusions de chemins et de métadonnées entre A/B, l'union exacte explicitement autorisée pour R et la conservation des propositions A+B intégrales. Les365 fichiers sont inchangés après exécution.

Le cas central acquis au rapport44 reste valide :1 PASS/66 assertions,183105 ms. Ces deux cas utilisent le même candidat r6 et ne sont pas répétés dans la sélection suivante.

Contrôles indépendants du parcours de fixtures, exécutés sur r6 : compilation complète réussie (3977 ms), primitives **55 PASS/125 assertions** (34 ms Bun,58 ms de processus). Ces contrôles n'accèdent pas aux bases du parcours en cours.

## Vérification en continuation

Les autres cas du seul fichier next-context.test.ts sont lancés, hors les deux positifs déjà prouvés. Chaque cas a sa borne600000 ms et les exécutions sont sérielles. L'option bail1, vérifiée dans l'aide locale Bun, interrompt cette sélection au premier échec pour permettre une correction ciblée ; elle ne vaut pas succès des cas restants.

La durée totale du processus peut dépasser dix minutes puisque plusieurs cas sont enchaînés. Sa borne de sécurité distincte couvre l'ensemble des cas ; elle ne modifie pas les dix minutes individuelles. Aucune modification de source ou d'oracle pendant la validation.

La sélection couvre notamment approbation privée, faux événements, révocations, corruption des cibles, reprise et cache pur. Elle reste hors ligne, sur des ressources neuvesOWN ; ni suite globale, diagnostic de remplacement gelé, scénario de quatre origines, thread ou action native.

## Trace et suite

- Union : `../evidence/projection-union-ten-minutes-r6.execution.json`, exit0,44 assertions, sourceDrift vide.
- Compilation/primitives : reçus `projection-typecheck-r6.execution.json` et `projection-q1-r6.execution.json`.
- Autres scénarios : handle `sh_186c424e500180hVkYtzE2FytE`, commande `run-projection-validation.mjs r6 projection-remaining-ten-minutes-r6 remaining`. Résultats attendus, aucun PASS anticipé.
- Même lecteur indépendant informé des nouveaux résultats ; pas de nouvel audit général ni de chaîne de spécialistes. Les preuves antérieures valides restent réutilisées selon impact.

À réception, traiter les défauts concrets ou consolider les preuves et l'intégration si les critères sont satisfaits. Le bilan final recensera les durées, sans remettre une barrière arbitraire à quinze secondes. La projection n'est pas encore intégrée et les garanties natives et finales restent distinctes.
