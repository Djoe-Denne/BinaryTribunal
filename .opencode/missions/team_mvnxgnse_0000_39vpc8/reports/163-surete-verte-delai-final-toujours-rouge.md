# M2 — 163 : sûreté ciblée verte, délai final toujours rouge

## Résultats observés

Compilation160 verte et cinq mutations161 vertes (129assertions) sont acquises à source158. Diagnostic162 : **0PASS/1FAIL,7assertions**,91598ms processus, test91289,10ms, une invocation sans retry, exit1 sans signal. Le dépassement15s reste FAIL ; le paquet est clos, aucun lot complet autorisé.

Diagnostic complet : sept phases atteintes, incomplete:null, valeursfinies, source stable. Totalphases91288,76ms ; freshCollect44998,04ms et freshActivate33651,07ms. Stage185appels/34151,57ms inclusifs/29278,77ms résiduels instrumentés ; finalDocument537appels/8729,43ms ; bind280appels/8519,52ms. Rootunion46527,72ms et44761,04ms noncouverts, sans attribution spéculative àGC/SQL. Volumes par occurrence : stage1126143342octets, finalDocument1256388066, bind18214598 ; ni volumeunique ni mémoirepic.

Le total observé est inférieur aux107109,73ms du diagnostic151 sur148, et les spansstage baissent de47471,51à34151,57ms. Cela reste une comparaison de deux runs/versions, pas un benchmark causal contrôlé ou une garantie de gain reproductible. Surtout, cela n'approche pas le seuil15s. Les métriques instrumentées inclusives ne sont pas additionnées pour expliquer le total.

## Intégrité

UneDB/40751104octets et unasset/troisentrées conservés ;0unowned/0hashdrift/manifeststable/processExited. Logs/reçu/diagnostic vérifiés sans SQLdiagnostic oucleanup. SourceSet bde924de… inchangé ;308base+overlaycodec exact restent vérifiés. Aucun thread lancé. Les cas filtrés ne sont pas PASS.

## Prochaine décision : préparation en lecture seule, pas nouveau patch

Autoriser l'auteur à analyser les deux diagnostics151/162 et les sources connues, message seulement. Objectif : proposer le plus petit changement suivant avec une justification de sûreté, ou établir la frontière d'architecture nécessitant arbitrage. Le doublon interne de décodage153 est fermé ; ne pas le retravailler sans défaut nouveau. Les185audits,537parsesfinal et temps noncouverts ne justifient pas à eux seuls d'en supprimer.

Examiner prioritairement les calculs de contenu encore répétés **dans une même phase**, en distinguant metadata SQL/HOST/Q/epoch/proofs réellement à relire des calculs purs sur bytes exacts. Une proposition doit préciser les valeurs réutilisées, leur clé complète, ownership, durée de vie, invalidations et contrôles toujours exécutés. Aucun cache d'autorité global/intertransaction, résultatLIVE réutilisé, refseule, formatpersisté réduit, final rafraîchi ou APIpublique modifiée implicitement.

Ne pas attribuer44761ms noncouverts sans preuve. Une nouvelle mesure ne peut être proposée que pour trancher une décision concrète indispensable, avec coût et limite ; aucune instrumentation/exécution autorisée maintenant. Si atteindre15s paraît exiger une représentation persistée différente, une frontière d'autorité/cache ou un nouveau harnais important, exposer cette nécessité et les options au parent **avant** implémentation. Pas de promesse numérique déduite d'un compte d'appels.

## Frontières

RO sources/helpers auteur et JSON/logs connus uniquement ; aucun write/importévalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Sources158 et inputs122 gelés, aucun artefact rouvert ou nettoyé. Revues154/156/159 et preuves160/161 réutilisées hors impact ; pas de réauditcatalogue66/131 ou450+9.

Seuil15s/300s inchangé, trois threads HOLD125 intégral/nonwaived, deuxNEWdistincts inatteignables souscap3. S2/M2/remplacement/S1concret global/contention non acceptés, trois commandes consolidées non lancées.

## Annexe

Reçu162 SHAd4636f165940ff5eda2a1e3689a106fc90af17bd911c6a62e5039f30be8de8e1 ; diagnosticSHA22ea64be83fec6ad0aed77816f8517e75263692b379e0c82806cd79fa788977f. Evidence s2-measure-158-runtime, ancien151 sous s2-measure-148-runtime.
