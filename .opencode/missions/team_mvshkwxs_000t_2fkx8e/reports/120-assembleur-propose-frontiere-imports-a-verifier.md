# 120. Assembleur proposé : imports resserrés, exécution non autorisée à ce stade

## Objectif et livraison

Préparer des documents prospectifs sans base, réseau ou autorité implicite. L'auteur a livré le texte d'un assembleur, sans écrire ou exécuter de fichier. Il prend les sources, l'admission et leurs provenances comme entrées explicites ; les absences doivent provoquer HOLD, jamais une valeur de fixture par défaut. La cartographie des paramètres vers des fichiers concrets ou des manques reste annoncée séparément et attendue.

## Rectification de la procédure précédente

Le module graph-execution-prepare importe aussi graph-runtime-binding, qui importe graph-adapter. Le superviseur a confirmé ces deux liens par lecture aux lignes2–7 et2–4 respectivement. Il ne faut donc pas qualifier toute la fermeture de ce module de strictement pure sur la seule foi du nom de sa fonction.

La proposition appelle directement les étapes de liaison, planning, scellement et production du run, depuis les modules d'enveloppe et planner. Leur ordre correspond aux étapes relues de prepareExecutionV1:23–42. La proposition ne dérive pas l'admission via graph-adapter et n'importe pas le transport HTTP.

Ces constats d'import ne démontrent pas qu'une base est ouverte au chargement : atteindre un module n'est pas exécuter toutes ses fonctions. Aucun nouvel incident d'I/O n'est allégué. L'ensemble des dépendances du petit assembleur devra encore être inspecté avant toute exécution.

## Statut et limites

Le texte reste une proposition, ni compilée, ni exécutée, ni reçue comme outil validé. Sa provenance déclarée n'est pas une lecture indépendante automatique des fichiers ; une admission fournie par le parent n'est pas encore prouvée conforme aux vues gelées et aux fences opérationnels. Les sorties HOLD et les intentions ne peuvent donner aucun droit natif.

Le prochain examen rapprochera les paramètres des sources concrètes et fermera les imports, les chemins et les contrôles nécessaires, sans créer un harnais général ou relancer les cent tests du candidat inchangé. Les modèles/profils déclarés et les conditions d'octroi réelles restent distincts de ce calcul de documents.

## Traçabilité

- Livraison : `PURE_ASSEMBLER_PROPOSAL_TEXT_ONLY_NOT_WRITTEN_NOT_EXECUTED` par raccord-native-runtime.
- Lectures parent : graph-execution-prepare1–46 ; graph-runtime-binding1–24 au pin782ec396.
- Aucun fichier d'assembleur créé, import produit exécuté, accès base, appel distant, octroi ou effet natif.
- Le rapport119 est précisé par cette fermeture d'imports plus étroite ; la QA du candidat782 demeure inchangée.
