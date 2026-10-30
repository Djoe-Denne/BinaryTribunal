# Archive inactive de la voie isolée

Conservation pour la reprise, pas déploiement ni relance. Aucun chargement automatique. Droits, comptes, origines et baux historiques ne se transfèrent pas par copie.

- main-to-candidate340.patch : delta exact de main 9c1b6aa au candidat340, sources/tests/checkpoints suivis inclus.
- candidate340-to-final198.patch : delta non committé du candidat198.
- final198/ : six fichiers modifiés complets, avec hashes dans le manifeste.
- worker-uncommitted/ : 39 entrées publiques non committées de l'ancien worktree (inputs, candidats préparatoires et fixture JSONL), conservées avec provenance. Ses changements de profils étrangers restent intacts et ne sont pas importés.
- Les rapports/sources/reçus publics originaux restent sous .opencode/missions/team_mvshkwxs_000t_2fkx8e/ à la racine du dépôt ; le manifeste ferme leur sélection.

Reconstruction documentaire : deux deltas à partir de la base épinglée, dans un espace inactif seulement. Ne jamais les appliquer à une instance vivante ni à une base d'autorité. La revue de clôture vérifie la conservation, pas le prototype.

Archival natif désormais terminé : voir ../native-cleanup/FINALOUTCOME.json. Les 95 inputs restants sont sauvegardés dans main ; sept branches et sept stashes ont leurs références archive/rms-partial-20261030/. Les sept worktrees ont été retirés normalement, sans purge ni suppression forcée. La proposition de fusion du nettoyage a été rejetée exactement sur 42 fichiers, sans exécution. Cet archivage administratif ne signifie pas réussite M2.

Bases SQLite, dossiers Auth privés, dépendances, caches et binaires runtime exclus. Parmi les neuf petits fichiers .bin publics conservés, huit sont des sorties d'invocation historiques, pas des fixtures ni une preuve native autonome. Le manifeste les distingue par leur chemin et leur hash ; ils ne sont pas chargés ou exécutés. Aucun transfert d'autorité n'est impliqué.
