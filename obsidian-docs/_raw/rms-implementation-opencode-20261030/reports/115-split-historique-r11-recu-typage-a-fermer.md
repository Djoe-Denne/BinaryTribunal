# 115. Split historique r11 reçu : typage à fermer

## Objectif et choix réalisé

La correction doit permettre une préparation valide et des lectures historiques sans transformer une image conservée en autorité actuelle. L'auteur a livré la variante de séparation pure : pas de host temporel pour les vérifications historiques, mais maintien des comparaisons d'images, pins et sources retenues ; les chemins courants gardent le host et les sources indépendantes actuelles.

Cette variante reprend la direction initiale du rapport114 plutôt que l'argument optionnel d'autorité proposé ensuite. Le superviseur ne demande pas une réécriture par principe : elle reste conditionnée à la vérification des comparaisons non circulaires et au maintien de toutes les gardes avant effet. Aucun document historique n'est déclaré preuve d'indépendance ou droit actuel.

## Résultat de compilation

Le pin et les 18 empreintes sont conformes. La compilation échoue en 3 690 ms sur cinq diagnostics locaux : les lectures de planning, spec et template sont typées unknown, d'où deux paramètres implicitement any.

Le superviseur a relu le corps ajouté et les types du contrat existant. La correction autorisée est limitée à leurs types exacts après validation de l'enveloppe : PlannerResult, GraphExecutionSource et GraphExecutionTemplate. Aucun broad any, comparaison supprimée ou parser affaibli. Aucun test r11 n'a été exécuté.

## Vérification et suite

Le reviewer reprend uniquement la frontière historique/courante et ses impacts. Il vérifie l'origine indépendante du pin, les jointures de rôle, plan et admission et l'absence de validation circulaire à partir du seul body. Le prochain pin de typage sera rapproché sans recommencer les acquis inchangés.

Les deux expirations pendant await restent à atteindre réellement, après un start valide. Les nouveaux tests annoncés couvrent également la lecture historique après échéance et les corruptions de pin, événement, image et rôle. Aucun PASS de ces cas n'est encore revendiqué.

Une confirmation auteur a ensuite réagi au steering antérieur proposant currentAuthority, malgré la décision plus récente de conserver le split pur pour examen. Le superviseur a immédiatement précisé l'ordre actuel : arrêter toute réécriture de variante, limiter la correction aux types et identifier tout delta fonctionnel déjà commencé, sans reset ou restauration générale. Le reviewer s'appuie sur les blobs épinglés plutôt que sur un worktree potentiellement transitoire. Aucun changement de variante n'est accepté ou testé par cette notification.

L'avis indépendant détaillé sur les blobs ca85 est depuis récupéré : `msg_18a24a255001sAYF5cvg02hCDK`, confirmé par `result_mvu7uxp0_000n_f8dk3n`. Il est favorable sur le split pur dans cette portée : pas de circularité B4, pin indépendant créé avant outbox, comparaisons exactes conservées et usage courant toujours soumis au host/source indépendante. Il ne couvre ni une autre variante ni la correction de typage encore attendue ; aucune exécution de test déduite de cet avis.

## Preuves et limites

- Pin : `ca85f41c7f2aa9ef2a58e508c768fe3ec18042a8`.
- [Reçu de compilation parent](../evidence/native-runtime-r11-typecheck-parent.json).
- Lectures parent : graph-store2180–2225 ; types d'enveloppe planning/template/spec et imports domain/planner.
- Aucun effet natif, octroi, programme direct, intégration ou qualification acquis.
