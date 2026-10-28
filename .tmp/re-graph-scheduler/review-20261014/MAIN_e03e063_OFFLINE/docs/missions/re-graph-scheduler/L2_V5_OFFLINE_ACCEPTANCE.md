# L2 v5 — acceptation parent hors ligne

2026-10-15. **Le parent accepte la livraison L2 v5 offline**, par composition de
la revue finale L2 précédente (dont l'unique finding RV2FINAL-01 était bloquant),
de la correction bornée approuvée, de sa nouvelle revue indépendante et des gates
parent sur les mêmes octets. Cela autorise le transfert des quatre fichiers L2
avec leurs tests puis les gates inter-lots ; pas une clôture L8/L9/L10 ou native.

## Sources et contrôles parent

Gel `L2IDSV5`, 345 fichiers, manifest
`50088914a177b83ca31bd7935e0fcf6283a36c908358ab0bfec068717fd910f7`.
Pins complets et préparation : `L2_ID_V5_REVIEW_PROGRESS_20261015.md`.

Parent : tous les OLD343/NEW345 pins vérifiés ; seuls capabilities et son test
changent, deux documents s'ajoutent. Les 146 anciens tests restent un préfixe
byte-exact de 87 254 octets ; inverse de la production vers `121352d7…` exact.
Préflight du gel : 52 cas / 481 assertions PASS, fingerprint `84554043…`.
Gates réels du worktree source, 220 pins harnais du gel alignés avant/après :
typecheck exit0, 220 focused PASS / 12 181 assertions, 643 full PASS / 1 SKIP /
22 969 assertions. Le gel projeté sans scripts canary n'a pas un typecheck global
PASS ; cette limite de projection est conservée, pas masquée par les gates source.

Après revue, le parent a de nouveau vérifié tous les 345 pins gel et les 356 pins
du paquet reviewer. Digest de contenu reviewer reproduit par le parent :
`a0be6c1eac23eadf91283808bc4677fc459e705f5fedeccdfaa033cc39823183`.
Il est distinct du fingerprint de préparation `85965e44…`.

## Revue fraîche indépendante

Task `task_mv99m9ka_0000_mo4o4v`, session `ses_ec15d2241ffe4VO0s2Zmv08j31`,
Sol **max** natif vérifié, auteur Astra distinct, contexte fresh. Verdict final :
**ACCEPTABLE OFFLINE TARGETED**, aucun contre-exemple bloquant dans le périmètre.
Reviewer arrêté normalement après sa livraison ; aucune réouverture d'un ancien V.

- 31 tests ajoutés réellement exécutés : PASS / 1 186 assertions.
- Probes mémoire propres : **96 cas / 1 332 contrôles PASS**, avec canonicalisation
  et SHA256 indépendants : Unicode/identité 56/980, collisions 2/64, mapping seed
  1/38, six poisons cache shape-valid 6/77, cache/guards 24/67, multiples identités
  et repacking 65/129 sites 7/106.
- Réservations naturelles nonmatching base/:1/:2, allocation forcée :3 et :49,
  ordres inversés/mélangés. Pour N réservations, N+1 candidats distincts suffisent ;
  alias ASCII bornés. Courts sujets inchangés à 128 points Unicode.
- Citations JSON originales récupérées exactement, hashes des records complets,
  modules et source-fonctions distincts ; cas ASCII/astral/NUL/combining jusqu'à
  160 points, noms matching 256 points. IDs complets/domain-separated contrôlés.
- Raw/candidate/miss/hit passent le vrai L1. Six poisons ont d'abord passé le
  schéma strict avec hashes reconstruits, puis ont tous été refusés au binding.
- Clones, stats, invalidation multi-module, v5/legacy v4 et guards préservés.
  Le hit **réexécute les règles et la validation** : aucune garantie d'économie
  de calcul ni performance universelle n'est acceptée.
- 356/356 fichiers et tailles vérifiés avant/après, sans extras/liens. Aucun
  recours SDK/types main, aucun accès worktree auteur, aucune mutation de projet.
  Erreurs de développement de probes corrigées et exclues des PASS finaux.

## Limites qui restent opposables

Le ledger inchangé de 8 943 882 octets était explicitement hors paquet pour la
limite 8 MiB ; le reviewer ne l'a pas lu. Sa couverture antérieure n'est pas une
nouvelle extraction. Préflight et tests sont offline. Le skip réel d'interop reste
non vérifié. Capa = métadonnées, pas analyseur exécuté. Import-use = référence
déclarée/citée, pas exécution ni IAT corroborée. PE positif historique reste unknown,
quatre divergences restent en quarantaine, graphe historique PARTIAL,
`selfLoopsPreserved:false`, `admissibleAsOracle:false`.

Aucune migration des identités historiques, aucune promotion science/native/IDB,
aucun GO live/shadow/adoption. Transferts L3 avec tests, puis L4/L5 et gates main
obligatoires ; L7/L8/L9/L10 gardent leurs propres critères. Reçus locaux complets :
`.tmp/coordination-three-20261014/l2idsv5-*`.
