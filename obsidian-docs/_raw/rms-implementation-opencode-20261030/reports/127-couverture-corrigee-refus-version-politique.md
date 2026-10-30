# 127. Couverture corrigée, refus du nom de version de politique

## Objectif et progression vérifiée

Construire la source fixture sans prétendre une couverture machine. Le parent confirme les nouvelles empreintes et prouve que la correction source consiste exactement en la seule ligne de couverture autorisée ; l'assembleur est inchangé. Les contrôles de syntaxe passent sans évaluation.

Le second calcul en mémoire franchit le contrôle précédent puis refuse en149ms : le nom de version de politique n'appartient pas à l'espace requis par le mode d'admission. Il s'agit d'un refus de données de préparation, pas d'un appel de service natif.

## Cause et correction bornée

Le superviseur a lu graph-pure-codecs371,414–432 : le mode complete-admission-cap-v1 exige une version préfixée par ce nom suivi de deux-points, avec suffixe non vide et longueur totale d'au plus32unités UTF16. Le constructeur utilisait un autre nom.

Seul changement autorisé : version complete-admission-cap-v1:q122, de longueur30, plus la mise à jour du manifeste. Aucun budget, statut, règle, parser, codec, produit ou décision D/Q modifié. Le calcul sera rejoué sur cette donnée corrigée après vérification du delta ; pas de rejeu des cent tests produit.

## Bornes et preuves

Les deux refus restent enregistrés séparément ; aucun PASS de préparation n'est revendiqué. Aucun fichier opérationnel, accès base, session, origine ou octroi créé. Corps/prompt exacts, wire et recharge indépendante restent à établir au bon stade ; ces corrections ne ferment aucune obligation native.

- [Reçu du second calcul](../evidence/preparation-source-memory-attempt-2.json).
- Le premier échec est conservé dans le rapport126.
- La fermeture d'imports du reviewer reste réutilisable pour les dépendances inchangées ; le prochain rapprochement portera sur les petits deltas de données et leurs impacts.
