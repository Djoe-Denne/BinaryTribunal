# Accès au catalogue partagé — 17 modèles

Source canonique : `C:/Users/djden/.config/opencode/ensemble.json`, section
`modelRouting.models`. Ce catalogue existe dans la configuration globale
d'Ensemble et n'appartient ni au projet FF8 ni à la documentation du plugin.
Le fichier `examples/ensemble.model-routing.json` du plugin est un exemple,
pas la source canonique des missions. Il n'y a pas de copie JSON propre à FF8.

Le superviseur consulte cette source par une lecture autorisée. Si Context Mode
refuse ce chemin hors projet, demander une autorisation de lecture limitée à
ce fichier exact ; ne pas contourner le refus avec un autre outil, un lien
symbolique ou une copie effectuée par la session bloquée. L'existence du fichier
ne prouve pas que cette permission a été accordée à la session de mission.

Ne pas ajouter `modelRouting.models` dans la configuration projet pour rendre
la liste visible : cela remplacerait le catalogue global. Une mission peut
archiver un snapshot de provenance dans son ledger après lecture autorisée,
sans en faire un catalogue de configuration indépendant.

Les 17 entrées portent les variantes, scores et coûts établis précédemment.
`available: true` est une déclaration historique du catalogue, **pas une preuve
d'accès effectif**, d'authentification, de quota ou d'autorisation de dépense.
Les coûts sont des données de routage fournies, pas un devis actuel.

Avant dispatch, le superviseur rapproche ces références du catalogue natif,
vérifie les accès et variantes par des moyens autorisés, consigne le `Model.Ref`
effectif et fige les routes admissibles pour la mission. Les références Cursor
ou autres non exposées au runtime restent exclues tant que leur accès n'est pas
confirmé. `paidFallback` ne donne aucune autorisation de repli payant.

Ce document n'effectue aucun test d'accès, appel payant ou changement de service.
