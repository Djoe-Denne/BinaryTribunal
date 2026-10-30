# Archive inactive de la voie isolée

Conservation pour la reprise, pas déploiement ni relance. Aucun chargement automatique. Droits, comptes, origines et baux historiques ne se transfèrent pas par copie.

- main-to-candidate340.patch : delta exact de main 9c1b6aa au candidat340, sources/tests/checkpoints suivis inclus.
- candidate340-to-final198.patch : delta non committé du candidat198.
- final198/ : six fichiers modifiés complets, avec hashes dans le manifeste.
- worker-uncommitted/ : 39 entrées publiques non committées de l'ancien worktree (inputs, candidats préparatoires et fixture JSONL), conservées avec provenance. Ses changements de profils étrangers restent intacts et ne sont pas importés.
- Les rapports/sources/reçus publics originaux restent sous .opencode/missions/team_mvshkwxs_000t_2fkx8e/ à la racine du dépôt ; le manifeste ferme leur sélection.

Reconstruction documentaire : deux deltas à partir de la base épinglée, dans un espace inactif seulement. Ne jamais les appliquer à une instance vivante ni à une base d'autorité. La revue de clôture vérifie la conservation, pas le prototype. Le nettoyage natif de l'équipe n'est pas exécuté : son outil fusionne automatiquement les branches non intégrées, ce qui réintroduirait la voie écartée. Branches et worktrees restent préservés, sans suppression forcée ; leur conservation ne signifie pas que la mission a réussi.

Bases SQLite, dossiers Auth privés, dépendances, caches et binaires runtime exclus. Parmi les neuf petits fichiers .bin publics conservés, huit sont des sorties d'invocation historiques, pas des fixtures ni une preuve native autonome. Le manifeste les distingue par leur chemin et leur hash ; ils ne sont pas chargés ou exécutés. Aucun transfert d'autorité n'est impliqué.
