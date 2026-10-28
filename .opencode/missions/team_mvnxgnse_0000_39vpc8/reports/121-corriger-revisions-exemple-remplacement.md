# M2 — 121 : corriger les révisions de l'exemple de remplacement

## Problème et décision

L'objectif reste le remplacement atomique d'un candidat sans lever la barrière. L'auteur signale une erreur numérique dans la table d'entrée119 : elle suppose une révision du head de1 aprèsT1. Le parent recoupe le baseline préservé116 : installBootstrapA initialise revision1, prepareInitial conserve cette révision (postimage par spread), requestDrain l'incrémente. AprèsT1 la révision vaut donc2 ; le swap donne3. La candidateRevision reste2 puis3.

Ratifier une correction des exemples uniquement : deux préimages/stage revision1→2, postimage revision2→3, CandidateReplacement.currentHeadRevision1→2 et libellé headRevision1→2 remplacé par2→3. Les incréments h+1/c+1, les autres champs de la table, les sources et les plafonds3/1/2 restent inchangés. Aucune modification du bootstrap qualifié pour accommoder un exemple faux.

## Permissions et vérification

Préserver les deux entrées119 byte-exactes readonly avant correction. Étendre temporairement le mandat source120 au seul fichier d'entrée replacement-fixtures.ts pour les cinq substitutions ci-dessus ; CONTRACT.md reste inchangé. Livrer le nouveau hash et le delta exact, puis protéger à nouveau l'entrée. Le parent vérifiera le diff ; la revue indépendante utilisera le nouveau pin explicite, jamais l'ancien hash silencieusement remplacé.

Les travaux source120 indépendants continuent. Aucun import, binding, replan, typing, test, thread, SQL/DB, asset ou Git autorisé. La qualification S1 et les comportements restent non observés. Aucun changement d'architecture, d'oracle comportemental ou de critère d'acceptation : c'est la correction d'un exemple vers les transitions déjà qualifiées. S2/M2 restent ouvertes.

## Références techniques

Baseline `snapshots/s2-cross-epoch-116/src/graph-generation-store.ts` : bootstrap revision1 ; prepareInitial589 conserve revision ; requestDrain680 applique revision+1. Entrée119 `FULL_HEAD_TABLE_118` lignes101/118/135, record161 et libellé172. Pins119 antérieurs : CONTRACT4dac2a87… ; DATA1e598336… .

## Correction livrée et vérifiée

Le parent a comparé le texte courant au texte119 préservé transformé par les cinq substitutions autorisées : égalité exacte, aucun autre delta. DATA28896B, SHA256 `2f4832526f730fe3736b67e8004aa9333e943b9c3b404540a5c6aa92583307c3`. CONTRACT reste au pin119 `4dac2a87…`. DATA reprotégée readonly par le parent. Ce nouveau pin remplace explicitement le pin DATA119 pour la prochaine revue ; la copie119 reste immuable. Le mandat source120 continue, sans nouvelle exécution ni acceptation du remplacement.
