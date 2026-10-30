# 76. Directive utilisateur : obsolescence ordonnée, sans relance automatique

## Nouvelle règle fonctionnelle

L’utilisateur précise que les tâches sont normalement petites. Un agent peut continuer à travailler un peu après une demande d’arrêt, voire finir : cela est acceptable si son résultat est identifiable et peut être invalidé. Le superviseur prend l’ordre utilisateur et peut émettre une commande d’annulation ou un message demandant à la tâche/à l’agent de se déclarer obsolète. Les ordres doivent être reçus dans l’ordre où ils ont été émis. Une interruption volontaire de ce type **ne doit pas déclencher de retry automatique**.

Cette directive prime sur l’hypothèse antérieure d’un rejet natif instantané de toute requête en transit ou d’une clôture empêchant physiquement toute continuation. Le blocage décrit au rapport74 doit être réévalué contre ce besoin, pas conservé comme exigence automatique plus forte.

## Questions transmises aux deux build

1. Définir le protocole le plus simple d’ordres ordonnés et d’obsolescence : périmètre de l’ordre, identité des commandes/tâches/exécutions, persistance, réponse perdue/doublons, annulation avant démarrage ou pendant le travail, et distinction d’une panne susceptible de retry.
2. Définir la clôture logique et le traitement des résultats tardifs : autorité du superviseur, exclusion de sélection/publication, résultat déjà arrivé ou déjà retenu, message à l’agent reçu tard ou jamais lu, et état d’arrêt sans retry.

Le statut RMS doit être autoritaire : un simple texte libre « je suis obsolète » ne remplace pas la décision conservée du superviseur. Les conseillers doivent proposer les états et témoins minimaux sans présupposer leur implantation. L’ordre entre tâches indépendantes n’a pas à être global si cela ne sert pas le besoin ; la portée recommandée doit être explicitée.

## Limites préservées

Laisser un calcul finir ne signifie pas effacer les ressources ou coûts encore consommés. Les recommandations doivent distinguer tâche logiquement obsolète et exécution physiquement terminée, et préserver les protections sur les effets partagés, la publication et les budgets. Ne pas convertir l’obsolescence en preuve de quiescence ni annuler rétroactivement des effets irréversibles.

La directive ne lève pas les arrêts HOLD125, diagnostic gelé, quatrième origine, G5–G7 ou les permissions natives. Aucune origine, allocation ou autorité n’est remise à zéro. Le niveau QA reinforced et le catalogue restent inchangés. Les gardes de code actuels restent fermés tant que le contrat correspondant n’est pas arrêté et vérifié.

## Exécution de la demande

Le build chargé de la révocation reçoit cette nouvelle direction comme prioritaire. Le second build est chargé de la clôture logique et des résultats tardifs sous la même directive. Aucun architecte, code, test produit, mutation native, installation ou changement global. Le parent rapprochera les recommandations et mettra à jour le diagnostic de blocage avant toute réalisation.

Les deux transmissions sont effectivement faites. Sessions fresh de type build, recherche seule : `conseil-revocation-build` (`ses_e7788a8c8ffeUaP50uzCw35U24`, OpenAI Sol xhigh relu) et `conseil-cloture-build` (`ses_e7782688dffefbVWl2bQdeuGdU`, OpenAI Sol high relu). Pas de worktree d’écriture. La politique Context Mode est livrée en copie locale possédée, sans contournement d’accès externe. Les deux tâches restent à réception parent, aucun avis n’est anticipé.
