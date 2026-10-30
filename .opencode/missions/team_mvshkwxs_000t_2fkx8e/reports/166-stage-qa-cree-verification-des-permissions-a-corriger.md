# 166. Stage QA créé ; vérification des permissions à corriger

## Résultat réel

La dépendance source manquante a été copiée et vérifiée, sans import ni régénération. La QA locale autorisée a ensuite été exécutée une seule fois.

Les quatre refus préalables passent. Le raccord crée ensuite le stage QA et les fichiers, ferme la connexion et retourne son statut local non adoptable avec une observation après fermeture et une marge de239608ms. **La vérification parent échoue ensuite** avec le message « Session restrictions changed ». L'exécution globale reste donc en échec, et le sixième contrôle de refus d'un second appel n'a pas encore été exécuté.

## Diagnostic corroboré

Les permissions observées et attendues ont les mêmes trois valeurs : action*, ressource*, effetdeny. Le test utilisait JSON.stringify et comparait aussi l'ordre d'insertion des clés d'objet. Le fichier canonique les trie ; cet ordre de clés n'est pas la sémantique des permissions.

La correction proposée doit vérifier strictement la longueur de la liste, l'ensemble exact des champs et leurs valeurs, **sans réordonner les règles de la liste**, ignorer un champ ou affaiblir le contrôle des octets du wire. Une revue indépendante ciblée est demandée avant cette reprise.

## Conservation et suite

L'échec, la requête, le résultat et les fichiers créés restent conservés. Le parent ne recrée pas de stage, ne reprend ni ne renouvelle le bail et n'adopte pas cette base comme opérationnelle.

Après revue, seuls les mêmes artefacts seront relus et les contrôles restants terminés. Une ancienne marge positive constitue une observation historique, pas une preuve de possession encore valide. Le contrôle du second appel devra refuser sur le namespace existant sans modifier la base ou initialiser quoi que ce soit.

Cette reprise ne transformera pas rétroactivement le premier run en succès : elle aura son propre reçu et sa portée explicite. Les branches de fermeture forcée ou d'exception non exercées resteront non exécutées. Aucun droit, session de modèle, préparation native ou origine RMS n'a été créé.

## Preuves et durées

- Revue préalable du raccord : result_mvuwb3ti_003u_085srv ; seul manque de composition réparé par copie23695octets/SHA26c0c4f987be393645ca7dacf30adf4f161d2b0491cfe48f7a1a1b99e24d7c74.
- Runner parent : native-preparation-136/check-local-materializer-166.mjs, syntaxe vérifiée avant exécution ; sélection fermée de six contrôles, pas de suite globale.
- [Échec conservé](../qa-local-materializer-166/failure.json) : quatre refus PASS, cinquième contrôle FAIL, sixième non exécuté ;642ms interne/690ms processus.
- [Résultat du raccord](../qa-local-materializer-166/result.json) : QA_NONADOPTABLE_LOCAL_INPUTS_ONLY, postCloseObservedAt1793361316838, remainingWallMs239608, nativeAuthorityNONE_ISSUED_BY_RUNNER.
- Sorties : qa-local-materializer-166-output ; OWN : qa-local-materializer-166-own/qa-own.sqlite. Ce sont des ressources de test à préserver, jamais des fences opérationnelles à réutiliser.
- Permissions réellement lues dans wire.create : liste unique avec champs action*, effectdeny, resource*. Le défaut concerne l'oracle parent, pas une différence observée de valeurs.
