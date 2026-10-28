# M2 — 169 : délai toujours rouge, cibler la preuve manquante

## Résultat et décision

Compilation166 et sept refus167 sont verts (35assertions). Diagnostic168 : **0PASS/1FAIL,7assertions**,94047ms processus/test93816,85ms,1run0retry,exit1sanssignal,sources164stables. Paquet clos rouge, aucun lot complet lancé. Le diagnostic est complet : septphases atteintes,incomplete:null,valeursfinies.

Totalphases93816,51ms ;freshCollect45316,35ms/freshActivate35612,64ms. Stage185calls34487,49ms inclusifs/29811,42ms résiduels instrumentés ;finalDocument537calls9215,20ms ;bind280calls8153,27ms. Rootunion47179,89ms,46636,62ms noncouverts sans attributionàGC/SQL. Volumes par occurrence inchangés depuis162 :stage1126143342,finalDocument1256388066,bind18214598octets.

La nouvelle mesure94s contre91s précédemment ne démontre aucun gain du delta164 ; ce ne sont pas des runs contrôlés permettant d'établir une régression causale non plus. Le calcul dédupliqué reste accepté en sûreté, mais ses13clés évitées n'ont pas établi un bénéfice net. **Ne pas poursuivre un autre microcorrectif sur la seule répétition statique.** Seuil15s inchangé ; les assertions terminées ne rendent pas le test PASS.

## Preuves conservées

UneDB/40751104octets,unasset/troisentrées,0unowned/0hashdrift/manifeststable/processExited. Logs/reçuSHA153cc922…/diagnosticSHAf472b162…vérifiés sans SQLdiagnostic/cleanup. SourceSet1d212ee9… stable ;308base+overlaycodec exact et toutes entrées protégées. Les cas thread sont toujours nonlancés/HOLD125.

## Préparation RO autorisée

Demander à l'auteur de proposer la **mesure minimale qui tranche le prochain choix concret**, pas une nouvelle optimisation. Relier la décision à un coût encore nonisolé : par exemple sous-opérations pures du stage ou calculs hors spans actuels. Nommer ce qu'il faut distinguer, comment un résultat choisirait entre deux deltas possibles, le petit nombre de sites/fichiers nécessaires et l'overhead attendu comme inconnu. Réutiliser le collecteur local existant si adapté ; ne pas concevoir un nouveau framework/profiler/runner ni multiplier les métriques sans décision associée.

Une réutilisation d'un résultatLIVE/stockagecompact/APIpublique/cacheautoritéglobal constitue une frontière distincte nécessitant arbitrage : rien de tel n'est autorisé par cette préparation. L'impossibilité d'atteindre15s sans changementarchitectural n'est pas encore démontrée ; ne pas la déduire des46636ms noncouverts. Si le besoin devient prouvé, en exposer les options et limites avant implémentation.

Retour message compact : décision à trancher,hypothèses,mesure indispensable et delta minimal de diagnostic,critères d'interprétation,limites. Aucun patch, instrumentation ou RUN maintenant. Revues165 et preuves166/167 réutilisées horsimpact ; mutations161 nonrépétées gratuitement. Pas de réauditcatalogue66/131/450+9.

StrictRO sources/helpers auteur et JSON/logs connus,aucun write/importévalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Sources164/inputs122/artefactsgelés,HOLD125intégral,seuils15s/300sinchangés,S2/M2/remplacementnonacceptés,commandesconsolidéesnonlancées.
