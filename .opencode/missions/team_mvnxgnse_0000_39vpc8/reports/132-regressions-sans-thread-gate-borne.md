# M2 — 132 : rejouer les régressions sans thread sur le produit modifié

## Préparation vérifiée

La compilation130 et les revues129/126/123 restent valides pour source128 gelée. La préparationRO131 recense50cas remplacement, dont47sans thread et3sous HOLD125. Parent corrobore indépendamment la fermeture des cinq fichiers historiques par analyse AST TypeScript, sans évaluer de source :43TS+10JSON, aucun import worker_threads/child_process, new Worker, import dynamique/require/eval ou dépendance relative inconnue ; contendeur absent. Cette preuve est bornée à cette fermeture et au sourceSet pinné, pas une absence universelle d'effet dans le dépôt.

## Gate A autorisé

Autoriser **une seule invocation runtime** des cinq fichiers explicites atomic-admission, resource-admission, t1-transition, t2-activation et cross-epoch sous test/s2-author.131cas attendus, concurrence1,15s/test inchangé, plafond de processus240s, zéro retry. Ce plafond borne le paquet, pas une estimation de durée ou un relèvement des seuils des tests. Rouge/timeout/signal ferme le paquet sans correction/rejeu intermédiaire.

Le rejeu est justifié par les modules et helpers partagés modifiés ; typingvert et revues sont réutilisés sans nouvelle compilation. Aucun cas remplacement ou thread n'est inclus dans cette commande. La condition de filtre Bun du futur lotB n'est pas encore observée et n'est pas requise pourA, qui n'a pas le lanceur dans sa fermeture. Aucun gateB n'est autorisé par ce rapport.

## Ressources et contrôleur

Adapter le contrôleur fini130 au seul argument resources/une invocation et au namespace neuf evidence/s2-replacement-128-baseline, environnement dédié homonyme. Refuser tout autre argument, exiger le reçu typing130vert/inchangé au même sourceSet et la revue source129acceptée. Vérifier12sources128+4baseline113, base309, extras, contrôles et dixinputs avant/après.

Avant runtime, réserver256cheminsDB/compagnons et128casesassets dans de nouveaux répertoires, sans adoption de fichiers existants. Bornes source attendues :143nouveaux OWN et44assets pourA ; réservations inutilisées ne sont jamais comptées créées. Même contrat parent de leases/dev:inoBigInt, chemins exclusifs, fichiers policy/readbacks autorisés et négatifs possédés que115. HOME/config/temp isolés, Bun/TypeScript pinnés, aucun environnement secret/options hérité ni preload.

Après invocation, conserver logs/reçus, inventaires complets/hashs/identités/manifest même rouge ; vérifier l'intégrité sans ouverture SQL de diagnostic. Aucune réutilisation ou suppression des bases/assets115 ou d'autres gates. Les branches du contrôleur qui écrivent les seules nouvelles ressources deA sont admises, aucun thread/provider natif.

## Acceptation et limites

Rapporter131cas réellement exécutés et assertions observées ; aucun échec/skip/todo ou diagnostic d'outil ne vaut PASS. Un vert qualifierait la non-régression de ce lot sur la version actuelle, **pas le remplacement ou la contention**. Les47cas remplacement sont toujours non lancés ; leurs trois autres cas demeurent HOLD125, sans waiver ou assimilation.

S2/M2 ouvertes ; aucune commande consolidée finale, commit/merge/push, live, exécution reconstruite, infrastructure externe ou nouveau framework. Le besoin de containment du thread reste une décision séparée, pas une raison de contourner HOLD125.
