# M2 — 34 : refus du worktree externe, destination de candidat dans R

## Constat précis

Le worker a tenté une lecture de `W/.git` et reçu `permission.rejected: external_directory`. Il n'a ni réessayé via un autre outil ni écrit. Le readback parent prouve l'existence du worktree, **pas un droit d'accès du worker**. Ne pas modifier permissions, session, racines MCP ou utiliser un autre canal pour ce chemin refusé.

## Décision de périmètre

Préparer le candidat dans un namespace temporaire neuf **à l'intérieur de R autorisé** : `C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/m2-s1-candidate-r2`. Le parent vérifie que R/.tmp existe et que ce chemin précis est absent. Aucun dossier encore créé par cette décision.

Ce choix change la destination de travail, pas les permissions ni l'architecture : candidat possédé à écritures disjointes de `tools/ff8-harness`, des gels, des preuves numeric et du WIP canonique. Le worktree externe reste inutilisé/préservé ; aucun nettoyage/merge. Les futures commandes devront avoir ce cwd exact, pas un cwd relatif implicite. Aucun accès supplémentaire à W n'est demandé au worker.

## Closure et gate d'écriture

Le worker annonce une fermeture statique de 39 fichiers TS/schémas, dont dix supports canoniques hors paquets ; ce nombre n'est pas encore une preuve parent. Terminer le plan depuis les seules sources sous R : liste exacte origines/destinations/hashes, distinction value/type-reachable DB/client et références de tests/fixtures, commandes bornées. Le parent contrôlera les dix supports et la sélection avant projection dans le nouveau namespace.

Aucune copie massive, source DB/client exécutée, duplication producteur ou permission supposée parce qu'un import est type-only. La closure d'imports ne démontre pas le comportement ; elle prépare le candidat qui devra être typé et qualifié après approbation du plan. Si les outils d'édition refusent ensuite aussi le namespace interne, signaler le refus exact : pas de fallback d'écriture caché.

## État

Contrat S1 ratifié, numeric450+9 accepté et réutilisé. Préparation lecture seule active ; aucun GO code/tests, aucun framework ajouté ou nouveau test numeric. Trois checks consolidés toujours NON EXÉCUTÉS. Cette résolution locale dans le périmètre approuvé ne nécessite pas de nouvelle question utilisateur.
