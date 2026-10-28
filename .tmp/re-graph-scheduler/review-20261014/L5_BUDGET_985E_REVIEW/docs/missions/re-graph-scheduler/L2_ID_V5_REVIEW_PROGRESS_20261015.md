# L2 v5 — reprise, gel et revue ciblée

2026-10-15. GO de reprise appliqué à l'équipe existante uniquement. **Livraison
v5 non encore acceptée** : la nouvelle revue indépendante est en cours. Aucun
transfert de production vers main, aucune activation L8 et aucune preuve native.

## Gel vérifié par le parent

- `L2IDSV5`, 345 fichiers ; manifest SHA256
  `50088914a177b83ca31bd7935e0fcf6283a36c908358ab0bfec068717fd910f7`.
- `capabilities.ts` :
  `05cb2155d5b0a543762c87dcacc23adf985f241cbcd7aaa0f768e8135cc66934`.
- `graph-extract.test.ts` :
  `82e1d12a245912c70af2edf4ec0eccc72b11b16ac824919eb0dc6e8285f9fc0f`.
- Graphe `2f597ede…` et normalizer `a4a3677f…` inchangés. Comparaison réelle
  OLD343/NEW345 : seuls capabilities et son test changent ; deux documents
  d'arbitrage s'ajoutent. Les autres empreintes communes sont identiques.
- Les 87 254 octets des 146 anciens tests sont un préfixe exact (SHA256
  `30513ec260f1a50a4c89e9ce8c8181972f15bf57529f7ff05fbedba12d7df57f`).
  Inversion des sept hunks Git en mémoire : restauration byte-exact de
  capabilities `121352d7f7e0dde5167aebfbd0e112b1d0f62f117aef2acc06a2632b7123d003`.

## Préflight et gates parent

`review:preflight` exécuté sur le gel exact : **52 cas / 481 assertions PASS**,
fingerprint module
`845540432bf821aa70e7222d3eb560747777c5555dc5c4211f8f4964eed74509`,
fingerprint rapport
`e8110fcd8ddf18e46cb857c23f587bbf73ef29dd7b4105c7ae32caee196015ad`.
C'est une preuve bornée offline, ni review indépendante ni acceptation.

Avant admission de la revue, le parent a exercé les régressions affectées sur le
worktree livré, avec les **220 fichiers harnais du gel vérifiés avant/après** :

- typecheck : exit 0 ;
- focused graph-extract + contract : 220 PASS / 12 181 assertions, exit 0 ;
- full : 643 PASS / 1 SKIP / 22 969 assertions, 644 tests, exit 0.

Le typecheck global du **gel projeté** échoue sur les scripts canary non inclus
dans ce gel ; ce n'est pas présenté comme un PASS. Les gates complètes ci-dessus
ont réellement tourné dans le worktree source avec ses scripts préexistants.
La jonction de dépendances du gel vers les dépendances main préinstallées est
READONLY, après vérification du lock et des dépendances ; aucun install/config.
Le skip existant nécessite `FF8_ENSEMBLE_SOURCE` et n'est pas une preuve d'interop.

## Revue fraîche admise, pas réouverture d'une ancienne revue

- Task `task_mv99m9ka_0000_mo4o4v`, membre `l2-ids-final-review`, session
  `ses_ec15d2241ffe4VO0s2Zmv08j31`. Native Model.Ref relu :
  `openai/gpt-6.1-sol`, variante `max` ; contexte fresh, profil plan, sans worktree.
- `review:scope` recommande delta ; parent endosse les contrôles explicitement
  exercés dans l'ancienne revue indépendante, **sans accepter son unique défaut**.
  Référence de couverture SHA256
  `6a8bd3fe4cc31c99c02ff52a8428bc46d810ef9bf4a6fcfbf6b44d04535f9a5c`.
  Scope = deux fichiers modifiés et deux documents ajoutés, aucune suppression.
- `prepare:transfer` : binding session/tâche vérifié ; 356 fichiers / 7 314 651
  octets ; fingerprint
  `85965e4443b50507c9bcd7c8f1a91cd69b9e2c6a23b56d0d7ab806b9ced36414`.
  Le reçu `prepared-not-approved` ne prouvait pas l'accès. Le reviewer a ensuite
  effectivement lu/hashé les deux nouveaux fichiers, l'ancien capabilities,
  le contrat, le préflight et le scope ; accès/rôle approuvés avant GO d'analyse.
- Omission explicite : le ledger inchangé de 8 943 882 octets dépasse la limite
  8 MiB du helper ; il n'a **pas** été transféré. Son original gelé et sa SHA
  `b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4`
  restent préservés. Aucune limite du helper contournée. Le reviewer est informé
  de cette projection et ne doit pas prétendre disposer de tout le gel.
- Probes propres attendues sur alias/collisions/Unicode, citations et mapping
  original→région→fonction, validation raw/miss/hit, poisons shape-valid, namespace
  v5, clones/stats/invalidation. Le hit réexécute les règles locales pour contrôler
  le cache public : **aucune économie de calcul des règles revendiquée au hit**.

Les tentatives de préparation refusées pour `role=review` (enum attend `reviewer`)
puis fichier trop grand sont conservées ; ce sont des refus d'entrée corrigés,
pas une panne ou un motif de repli de modèle. Le premier script de récupération
native a également été corrigé pour utiliser les vrais cursors publics ; aucun
accès à ensemble.db, aucune réexécution d'une ancienne review.

## L7 et suites inchangées

Le rapport natif de `l7-qa-r3` a été récupéré : portion scheduler 35 PASS,
full 408 PASS / 1 SKIP à sa livraison ; il déclarait explicitement attendre L2/L3/L4
pour §17.1 et **ne pas clôturer L7**. Son claim in_progress est cohérent ; idle
n'est pas un résultat de QA globale. Pas de réveil/rejeu inutile.

L4/L5 restent acceptés offline dans leur périmètre ; L6 déjà intégré. L2 attend
le verdict frais et le jugement parent. Ensuite seulement : transferts avec tests,
gates main et inter-lots, tranche L7 interop puis propriétaire central L8 selon ses
gates, sans attendre la clôture L7 post-L8. Aucun IDB/live, reset, nettoyage,
nouvelle équipe, repli, changement global ou push remote.

Reçus et logs locaux : `.tmp/coordination-three-20261014/l2idsv5-*`.
