# 104. Régressions ciblées réussies, préparation de la qualification réelle

## Objectif et étape atteinte

Le raccord logiciel doit être vérifié sans confondre simulations et exécution native réelle. Sur r8, les régressions affectées des commandes, de l'obsolescence, de la publication et du contexte réussissent : 20 cas et 120 assertions. Huit cas existants de migration et de refus de versions/schémas incompatibles réussissent également, avec 60 assertions.

Avec les contrôles du rapport103, cela représente **75 cas exécutés et 821 assertions, sans échec**, sur des sélections fermées. Ce n'est pas la suite complète. Les primitives inchangées conservent leur preuve séparée de 55 cas et 125 assertions, sans nouvelle exécution.

## Vérification et limites

Les corps des cas de migration sélectionnés ont été relus : migration sans réécriture scientifique ni autorisation implicite, puis refus d'une version future ou table incompatible. Les tests d'obsolescence exécutés restent les cas existants déjà inspectés. Les durées par sélection sont conservées ; aucune sélection entière n'atteint dix minutes, donc aucun de ses cas n'a atteint cette borne. Aucun thread, réseau natif, test gelé ou suite globale.

La revue indépendante r8 est favorable dans la portée des défauts et impacts. Le superviseur ne confond pas cet avis logiciel et ces simulations avec les preuves de serveur, droits, continuité des origines, effets, résultats et fin native exigées par la tâche.

## Suite autonome et réception

La tâche reste ouverte et le candidat reste épinglé. Le même auteur est chargé d'un complément borné en lecture seule : cartographier le point d'entrée host réel actuellement utilisable, les preuves encore manquantes et le plus petit parcours autorisé de qualification de ce code exact. Une interface injectable seule ne sera pas déclarée provider opérationnel. Ni faux provider, métadonnées copiées ni absence d'activité ne pourront combler une preuve native.

Ce complément réutilise les contrats94/95 et les sources acquises. Aucun nouveau grand harnais, installation, mutation SDK, effet natif ou relance d'expérience arrêtée n'est autorisé à l'auteur. Le superviseur tranchera la réalisation minimale nécessaire dans le mandat existant. Aucun nouveau GO utilisateur de routine n'est requis ; les permissions, budgets, plafond d'origines et gates scientifiques restent opposables.

## Preuves

- [Régressions parent et réutilisation des primitives](../evidence/native-runtime-r8-regressions-parent.json).
- [QA et revue r8](103-raccord-r8-controles-cibles-et-revue-favorables.md).
- Pin vérifié : `43d2e1f2219ad2fff64e23b4892c7035dfd216ea`.
- Aucune intégration de ce raccord, qualification native ou clôture complète de mission à cette étape.
