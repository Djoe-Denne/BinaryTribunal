# 132. Modèle fermé V2 ratifié : énumération à prouver

## Objectif et décision fondée sur le contrat

Résoudre le refus de réservation sans retirer un diagnostic légitime ou inventer des tails connus. L'auteur et le reviewer concluent séparément qu'une fixture explicitement fermée peut être énumérée sans prétendre une extraction machine. Le superviseur a relu ChunkSpan au contrat115 et ADR008:16, qui prévoit la provenance d'extracteur fixture ; ADR006 reste opposable aux parties non parcourues.

Le parent ratifie donc une **nouvelle définition V2** avec univers explicite de fonctions, parties, tails et liens. Q1 n'est pas réinterprété : ses relations vides ne prouvaient pas la fermeture des parties. D1, Q1, le bundleV1 partiel et tous leurs résultats sont conservés.

## Données matérialisées et limites

- [Décision D2](../native-preparation-132/source-decision-v2.json) : convention de spans virtuels, sémantique de tail, parcours et preuves exigées.
- [Définition Q2](../native-preparation-132/closed-function-model-v2.json) : une fonction-modèle et une partie entry, tous les tableaux et liens explicitement fermés. Q2 référence les octets D2 ; aucune référence cyclique.
- [Configuration V2](../native-preparation-132/source-config-v2.json) : mêmes décisions de modèle, profils, limites et tentatives que124 ; seuls les chemins de destination changent vers un namespace neuf.

Les spans comptent des unités logiques déclarées, jamais des bytes machine observés. InstructionCount, sizeBytes, basicBlockCount et divergence machine restent inconnus s'ils ne sont pas mesurés ; oracle reste false, format et architecture inconnus. Le comportement return du modèle n'est pas exécuté ou compilé par son parcours.

Ces écritures définissent un modèle fini ; **elles ne prouvent pas encore son énumération**. Aucun tailsIterated:true n'est attribué au snapshot existant ou à V2 aujourd'hui.

## Preuve exigée avant projection

Un petit extracteur fixture versionné devra lire les bytes exacts, refuser les formes inconnues, énumérer toutes les fonctions et parties, vérifier unicités et spans positifs non chevauchants, résoudre tous les liens, dériver les tails des rôles et comparer cette liste au tableau explicite. La preuve doit consigner les visites et la fin de tous les tableaux, y compris vides, et référencer le hash du modèle et du code de parcours.

Seul un parcours achevé autorise la projection d'une couverture complète **de ce modèle fermé**. Une partie ou cible inconnue doit refuser, pas devenir zéro. Les producteurs et guards de planning/réservation demeurent inchangés. Les vérifications ciblées du parcours devront comporter le cas valide et des refus de fermeture rompue, lien inconnu et définition ambiguë.

## Suite et frontière native

Autoriser la réalisation candidate de ce petit parcours et l'adaptation de construction V2, sans framework ou nouveau codec produit, avant inspection parent et revue d'impact. Aucun calcul, import ou test auteur ni accès base n'est autorisé à cette étape. Le staging reste suspendu tant que V2 n'est pas effectivement vérifiée et réservable.

Les nouvelles références concernent uniquement une autre source de modèle avant son éventuel ancrage natif. Elles ne créent, remplacent ou réinitialisent aucun compte natif et ne lèvent ni l'attribution historique du canary, ni les plafonds d'origines, budgets ou droits manquants. Tous restent HOLD.

## Références

- Auteur : READ_ONLY_CLOSED_MODEL_SOURCE_V2_POSSIBLE_CONDITIONALLY_NOT_RATIFIED_OR_EXECUTED.
- Avis indépendant : result_mvuc61i3_0000_qr435u, message msg_18a92e623001PeKcZd7DlsZ5I4.
- Lectures parent : CONTRAT112–147,529–538 ; ADR006 ; ADR0081–16.
- Aucun script de parcours, fichier opérationnel V2, réservation, session ou octroi exécuté par ce rapport.
