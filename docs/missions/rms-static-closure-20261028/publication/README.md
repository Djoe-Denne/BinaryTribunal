# Périmètre du checkpoint autorisé le 28 octobre 2026

L'utilisateur a demandé un commit et un push du dépôt, puis a retenu la publication du contenu versionnable après audit, sans suppression des artefacts locaux. Ce checkpoint conserve du travail en cours ; **il ne vaut pas acceptation scientifique ou logicielle de RMS/M2**.

Les fichiers `included.jsonl`, `excluded.jsonl` et `summary.json` décrivent la coupe auditée avant ajout de ces manifestes et des derniers reçus de l'opération. Ils ne sont donc pas un inventaire auto-référentiel du commit final. Le reçu final et l'arbre Git complètent cette coupe.

Chaque fichier présent inventorié possède une taille et un SHA-256 ; les gros fichiers sont identifiés sans être téléversés. Aucun fichier source ou artefact exclu n'a été supprimé, déplacé ou réécrit.

Le réglage local Git `core.autocrlf=input` aurait normalisé trois sources d'archive épinglées en CRLF et invalidé leurs empreintes. Le fichier racine `.gitattributes` désactive donc la normalisation des fins de ligne dans les arbres gelés et les archives explicitement listés. Aucun fichier existant n'est renormalisé ou réécrit ; aucune configuration globale n'est modifiée. Cette règle de préservation n'est pas une modification du contrat logiciel RMS.

## Exclusions

- Captures brutes, exécutables, bibliothèques, bases, images et autres artefacts locaux binaires ; fichiers atteignant 100 MiB.
- Dépendances et caches, notamment `node_modules` et `__pycache__`.
- Trois réglages propres à la machine : `.codex/config.toml`, `.cursor/mcp.json`, `opencode.jsonc`.
- Contenu nécessitant une revue avant publication : quatre fichiers contenant des motifs de code managé, dix-huit fichiers non UTF-8 et les chemins binaires recensés.
- Le dépôt imbriqué `FF8ModdingWiki/`, qui possède son propre historique et n'est pas transformé implicitement en sous-module ou en copie vendue.

Les huit copies du test historique `v2-classification.test.ts` ont été examinées : le signal de secret provient d'un message d'erreur fabriqué dans une fixture. Elles ont le même SHA-256 `01b6eaa3615336ca4eda7f15a1e8af1a6fd07c3f277dfef0e4dfe5eaf303ebbe` et sont conservées. Aucune exception par nom de fichier n'autorise un autre contenu.

Les empreintes du premier audit sont réutilisées uniquement pour les fichiers dont la taille et les horodatages sont antérieurs à cette coupe ; les nouveaux fichiers ou changements potentiels sont relus. Les règles d'exclusion par chemin restent réévaluées. Un audit intermédiaire devenu inutilement coûteux a été interrompu à sa borne ; il n'a produit ni commit ni résultat de test. Les manifestes finaux viennent de l'audit terminé, pas de cette tentative.

Les fichiers déjà ignorés par Git ne sont pas ajoutés de force. Les sources, tests, documents, projections textuelles et petits reçus retenus restent distincts des grosses preuves locales référencées par empreinte. Le dépôt peut donc rester sale après publication : ce n'est pas un nettoyage ou une sauvegarde distante de chaque octet.

## Vérification et autorisations

Aucun test produit, jeu, IDA, thread de remplacement ou exécution de code reconstruit n'a été lancé pour ce checkpoint. Aucun hook Git actif n'a été trouvé lors du préflight ; aucun contournement de hook n'est autorisé.

La mise à jour textuelle QMD des neuf collections a été explicitement autorisée après constat que cette version ne filtre pas `update`. Les huit autres collections n'ont eu aucun document modifié. La vectorisation a été limitée à `ff8-wiki` ; voir `../receipts/qmd-ingest.json`.

Le journal de vectorisation brut est en UTF-16 et reste conservé localement. Sa copie `qmd-embed-decoded.log` est une conversion de lecture, pas un original byte-exact. Le message PowerShell associé aux seuls codes d'affichage du curseur n'est pas un échec du calcul : le processus est sorti à zéro, a terminé les 77 documents et QMD ne signale plus de document en attente.
