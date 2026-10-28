# M2 — 08 : reprise bornée du préflight V01/V04

## Fait observé

Le worker V01/V04 a rendu `failed` avant analyse de consommateur : lecture de `C:/Users/djden/.agents/context-mode-script-policy.md` refusée (`permission.rejected: external_directory`) et plan de lecture en attente d'approbation. Aucun fichier modifié, aucune commande/test/import/DB/API de contrôle exécuté, aucun résultat scientifique ou PASS.

## Correction dans le mandat

Le plan borné de recherche a été approuvé explicitement, sans autoriser d'implémentation ou d'écriture. Le parent disposait déjà du contenu applicable de la politique, lu dans son contexte ; il en a transmis les règles dans le briefing. Aucun réessai du chemin refusé, changement de permission, contournement d'un refus d'action ou repli fournisseur. Réactivation demandée à la même session/tâche/modèle via `team_message force`, dont l'envoi est confirmé ; ce reçu d'envoi ne démontre pas encore la réussite de la recherche.

La distinction est conservée : échec de préflight, pas panne OpenAI, ni défaut produit, ni preuve de saturation. Aucun nouveau reviewer de recherche imposé ; les reviews indépendantes obligatoires de numeric/S1/L9/L10 ne sont pas modifiées.

## Suite et limites

Attendre le résultat événementiel V01/V04 et celui de planner-proof-reuse. Le contrat d'implémentation reste non fermé jusqu'à leurs décisions pertinentes. Aucun test produit supplémentaire pour ce diagnostic, aucun nettoyage/worktree ou backend de présentation relancé.
