# 22. Publication durable : implémentation en cours, tests en préparation

## Objectif et avancement annoncé

Relier les octets des résultats retenus à une publication statique unique, relue et reprise sans double effet. Le développeur confirme avoir commencé l'implémentation autorisée dans son worktree et prépare maintenant les tests ciblés.

Il annonce deux modules hors ligne, la policy prospective figée avant le cycle, un consommateur du manifeste dans finish et les contrôles GraphStore sur evidence, attestation privée même au niveau1 prospectif, readback et bindings. Les empreintes du contenu brut, du document et du record sont distinguées. Une observation physique séparée doit conserver les effets éventuellement produits sans les promouvoir en commit accepté après révocation ou changement de fence.

Ces éléments sont **un état d'avancement du développeur**, pas encore une réception du code par le superviseur. Aucun candidat stable n'est livré, aucun test produit de publication n'est exécuté, aucune propriété n'est déclarée PASS sur cette seule annonce.

## Suite et limites

Le développeur termine les tests avec les fixtures et oracles existants. Après livraison stable, le parent vérifiera le périmètre, épinglera les octets, qualifiera imports et effets puis exécutera les sélections autorisées, avec quinze secondes par test. Revue indépendante et intégration suivront selon les impacts réels.

Le contrat du rapport21 reste inchangé : aucun codec historique modifié, pas de nouvel accès natif, pas de projection du contexte suivant dans cette tâche, aucun nouveau GO demandé. Les blocages natifs et de remplacement demeurent ; la mission n'est pas clôturée.

## Trace

Source : message récupéré via team_results de publication-durable, tâche de publication durable en cours. La transition native xhigh est annoncée par le worker ; le dernier Model.Ref parent relu est déjà Sol xhigh dans le worktree possédé. Aucune nouvelle preuve native du produit n'en découle.

Localisation : worktree publication possédé, modules et consommateurs annoncés. Impact : implémentation et préparation des tests en cours. Limites : octets encore mouvants, vérification et réception parent à venir.
