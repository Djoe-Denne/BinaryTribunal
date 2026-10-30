# 50. Consolidation finale : validation normale du remplacement, sans diagnostic gelé

## Objectif et décisions

La politique native révision2 est approuvée et le candidat logiciel est intégré. Le superviseur a publié les tâches finales existantes, mais l'admission de la revue fresh est refusée parce que ses prérequis ne sont pas encore résolus. Aucun nouveau worker n'a démarré et aucune tâche parallèle équivalente n'est créée pour sauter ces dépendances.

La consolidation se poursuit sur le remplacement : aucun défaut ne justifie aujourd'hui un correctif de code. Le délai historique≈111s ne suffit plus à imposer une optimisation avec le plafond actuel de600s. Il faut néanmoins une preuve normale de fonctionnement sur les entrées actuelles, sans transformer le diagnostic historique en PASS.

## Sélection fermée autorisée par le parent

Un seul test existant est sélectionné : remplacement nominal conservant barrière, droits et travail actif, OLD archivé ABORTED et absence de RUNNING pour NEW. Il utilise les fixtures locales prescrites, au plafond de trois origines bootstrap compris. Pas de deuxième NEW, demande de quatrième origine ou rival concurrent.

Le parent a lu le test, les helpers stage/swap, le constructeur de fixture et son allocation de fichiers. L'import du module worker ne crée pas de thread ; la fonction de contention n'est pas appelée par ce cas. Le test de diagnostic gelé, qui appelle beginLocal145/phaseLocal145 et collect/activation finale, n'est pas sélectionné. Aucun statut/inspect du harness ou appel natif.

Une seule fixture neuve est réservée dans une racine possédée : bases, répertoire d'actifs et manifeste de bail explicitement fournis, aucun fallback ou réemploi d'anciennes bases. Le fournisseur de fixture fixe son plafond à trois et conserve sa provenance ; ce montage n'est pas une autorité native copiée ou un reset d'un ancien compte. Fichiers et bases sont conservés après test.

La borne est600000ms par test, marge de processus650000ms. Aucun préchargeur ou instrumentation ajoutée au produit. La commande sera lancée après vérification de syntaxe, avec reçu et durées distincts. En cas d'échec concret, traiter la cause dans les droits ; ne pas proposer une optimisation sans preuve.

## Limites

Ce positif ne pourra pas prouver à lui seul réponse perdue, révocation, activation finale ou concurrence native. Les preuves existantes correspondantes seront rapprochées selon leur validité ; threadsHOLD125, scénario nécessitant quatre origines et diagnostic gelé restent interdits. La revue globale et la clôture ne sont pas acquises par ce seul cas.

Sources : replacement.test.ts:44–55 ; replacement-fixtures.ts:80–98 ; t2-fixtures.ts:42–62 ; final-host-fixture.ts:62–81 ; fixtures.ts:16–19. Exécuteur parent : `../run-final-replacement-nominal.mjs`. Aucun résultat anticipé.

## Résultat et continuation

Le cas nominal termine avec **1 PASS,17 assertions**, exit0,14813 ms de processus (14,72 s Bun). Les365 sources sont identiques et les ressources sont conservées. Preuve : `../evidence/replacement-nominal-ten-minutes-r1.execution.json`. Cette durée ne se compare pas directement aux≈111s de l'ancien scénario de diagnostic, qui est différent et n'a pas été rejoué.

La lecture ciblée identifie aussi un cas existant d'activation fraîche normale, replacement.test.ts:157–165 : il stage et remplace le même NEW3 puis lie l'observation, le record de remplacement et l'inventaire à une activation COMMITTED. Il n'appelle pas beginLocal145/phaseLocal145 du diagnostic gelé, ne crée pas de thread et ne construit pas de quatrième origine. Une seule fixture neuve distincte est réservée selon le même protocole de bail et plafond trois. Ce cas est lancé séparément sous600000ms/test, handle `sh_1876f093f0017OliZE4YvmM48Q`, sans modification du produit. Aucun résultat anticipé pour lui.

## Recherche documentaire indépendante

Une recherche Internet publique du symbole `ensemble.execution.v1` et OpenCode a été effectuée sans données privées. Elle retrouve notamment le dépôt public hueyexe/opencode-ensemble, son README/package v0.18.0 et la documentation API OpenCode v2. Ces résultats ne fournissent ni correspondance épinglée avec le handler déployé localement, ni preuve de ses droits et de sa terminaison. L'absence de résultat exact exploitable n'est pas une preuve d'absence de handler. Aucun téléchargement exécutable, installation, configuration ou accès externe refusé n'a été contourné.

Liens documentaires publics : https://github.com/hueyexe/opencode-ensemble et https://opencode.ai/v2/docs/api . Ce sont des pistes documentaires, pas des preuves natives du produit. La lecture des sources autorisées et les résultats locaux restent opposables.
