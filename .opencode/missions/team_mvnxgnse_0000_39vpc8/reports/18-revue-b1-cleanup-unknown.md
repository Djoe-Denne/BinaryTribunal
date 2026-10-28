# M2 — 18 : revue indépendante NON PRÊT, correction bornée B1

## Verdict reçu et contrôle parent

Reviewer indépendant `numeric-preflight-review-r2`, session fraîche `ses_e874d476dffe70l4sH5xCToLap`, a terminé sa revue en lecture seule : **NON PRÊT pour la commande scientifique**. Aucune science/processus/test exécuté par le reviewer. Un seul bloquant établi : B1 dans le lifecycle du collecteur.

Le parent a directement relu `W/qualification/native/numeric-native-collector.cjs:133–184` (W défini au rapport17). Confirmation : fail() se neutralise après premier échec, mais les listeners stdout/stderr continuent d'ajouter tous les chunks aux tableaux ; kill est tenté puis cleanupUnknown fixé après la réserve, sans destroy des streams ou unref de l'enfant. result.json porte néanmoins allRawRetained:true. Un enfant vivant après la tentative peut maintenir les handles du root actifs, continuer les sorties et faire croître les buffers au-delà des caps après écriture du préfixe des logs.

Scénario requis : timeout/cap, kill sans confirmation d'arrêt, enfant encore vivant/émetteur après réserve. Le root doit finaliser de manière bornée sans inventer un arrêt ; logs conservés comme préfixes limités, réception désormais terminale, handle propre libéré et lease/identité laissées UNKNOWN sans retry. Une libération de handles locaux ne prouve jamais la quiescence de l'enfant.

## Conclusions favorables réutilisables de la revue

- Frames/indices RAW, top point et six champs Error gardés et joints avant tags ; pas de suppression générique de frames constatée.
- Source maps/AST : hashes indépendants, identité scriptParsed/request-response, sourceContent/sourceURL et trous GLB/UTF16 conservés ; les deux voisins runtime vérifiés.
- Receiver/builtin fermable statiquement pour le corpus actuel sous guards et démarrage parent propre ; ne vaut pas authenticité initiale contre host/preload malveillant ou appels arbitraires.
- Publication nominale WX/RO/SEAL et readback liés dans le code, pas encore preuve native exécutée.
- Décodeur UTF8 physique partagé, budgets/readback avant admission ; aucune baisse de seuil/cas trouvée dans les lectures ciblées des450/9 et oracles rationnels.

Les conclusions de lecture ne sont pas des recalculs intégraux de hashes ; le parent a sa propre preuve36pins au rapport17. Le reviewer n'avait pas encore intégré le succès de typing parent03 dans son dernier énoncé de gates : **ce typing ciblé est acquis**, ne pas le rejouer au seul motif de cette formulation. Le CJS n'est pas couvert par la preuve TS.

## Décisions de supervision

1. Bloquer la commande scientifique. Corriger B1 dans la même session auteur admise, pas créer un deuxième auteur ou un nouveau framework.
2. Donner un budget distinct borné pour tests lifecycle purs/isolés de ce défaut : quatre invocations maximum,30s chacune, plus un check syntaxe du CJS modifié. Aucun budget science consommé, aucun rejeu450/9 ou des101/42 tests inchangés. Pas de body collector réellement lancé ni inspector par cette autorisation.
3. Tester terminalité/freeze des buffers et caps lors du premier échec, données tardives, nettoyage handles UNKNOWN, logs honnêtes et absence de retry ; conserver les anciens résultats et oracles.
4. Exiger rendu des diffs/pins et limites : tests d'interface simulée ne prouvent pas à eux seuls un arrêt OS réel. Si une fixture de processus sentinel possédée est nécessaire, fournir d'abord sa commande/ownership/borne/cleanup exacts au parent ; aucun enfant scientifique ou installation implicite.
5. Reprendre la même revue indépendante sur B1 et son impact uniquement. Conserver les évaluations favorables et typing valides ; retyper uniquement si TS/config/dépendances pertinentes changent.

## État

Les450 paires et neuf régressions, les trois checks globaux et la collecte native ne sont toujours pas exécutés. Aucun commit/push ou action sur services partagés ; aucun Docker. Le `completed` du reviewer est la fin de cette sous-revue, pas l'acceptation numeric/M2.

Reprise corrective envoyée avec force à l'auteur possédé ; `team_view` confirme ensuite **busy**, même session `ses_e8be6ee3bffeljmJoaQzS3bV02`. Le reviewer a reçu la consigne d'attendre le delta avant reprise limitée, sans nouveau test ou audit. Ce constat d'activité ne préjuge pas de la correction ou de ses résultats.
