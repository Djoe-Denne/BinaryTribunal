# M2 — 82 : réservations physiques vérifiées sur bases isolées

## Résultats réellement observés

**Typing vert et60PASS/0FAIL/0SKIP,436assertions sur les deux fichiers prévus.** Les sources et contrôles sont restés identiques entre compilation et exécution. Paquet81 clos : deux invocations,13956ms, aucun timeout, signal ou erreur d'outil.

Le premier typing rouge80 est conservé :15diagnostics de compatibilité des tableaux readonly, une invocation1816ms,0DB. Six adaptations locales et leur revue d'impact ont précédé81 ; aucun compteur ni échec historique n'a été effacé. Les 60PASS ne sont pas additionnés aux14PASS73 pour fabriquer une couverture globale.

Le parent accepte le **complément fixture de réservation physique** dans les cas exercés, pas S2global ni000b/M2. Il empêche les conflits de workers et de quotas partagés testés, conserve les droits logiques après libération et refuse les corruptions ciblées à la reprise.

## Portée vérifiée

Les logs contiennent bien60nomsPASS et aucunFAIL/SKIP :14scénarios historiques adaptés,45cas de ressources et le scénario de corruption à quatre variantes. Les cas exercés incluent exclusivité worker malgré capacité numérique restante ; compte partagé borné séparément ; dimensions inconnues/insuffisantes ; sources révoquées et observations périmées ; tentative de pool/quota neuf ; concurrence ; rollback après append ; BURNED sans occupation ; retry sans nouveau droit ; Q puis réaffectation sans effacement par l'ancienne preuve ; reopen et corruption de l'image/pin/journal.

La nouvelle origine S1 synthétique a effectivement atteint le scellement et les admissions des cas nominaux. Ce résultat ferme sa précondition pour ces cas, sans prétendre refaire les107testsQA S1. Le rôle R sans worker reviewer a été refusé conformément au contrat ; aucune exécution R complète n'est déduite de ce refus.

Tests auteur, attentes/branches revues indépendamment puis contrôles exécutés par le parent : ces preuves restent distinctes. La suite indépendante plus large de machine d'état ne devient pas complète du seul fait de ces60PASS.

## Artefacts et intégrité

[Bilan machine et reçus](../evidence/s2-resource-81-validation.json). Typing1769ms ; runtime12187ms ; sourceSet exécuté16e3b483… (source revuee8305f78…). Hashes des logs/reçus vérifiés.

70basesSQLite neuves,101441536octets, toutes dans le namespace OWN réservé ; aucun fichier non possédé ni dérive de hash, processus terminé. Aucun nettoyage ou réouvertureSQL supplémentaire du parent ; les bases volontairement corrompues et les autres artefacts restent conservés. Les58réservations inutilisées ne sont pas annoncées comme des fichiers créés. Bases73 intactes et non réutilisées.

## Prochaine frontière et décision

QA_MATRIX132–161 attribue encore à S2 les origines et transitions générationnelles, T0/T1/ActivationAttempt/T2, remplacement sous barrière, inventaires et succession atomique. Ces garanties restent absentes/non prouvées ; ressources82 ne les remplace pas.

Continuer000b par une préparation **en lecture seule et bornée de la prochaine transaction T1** : fermeture durable de la barrière et entrée en drain. Identifier les champs/états S1 retenus, les ports d'autorité transitionA distincts du bootstrap, les opérations nouvelles à bloquer et celles des familles déjà engagées à conserver, ainsi que l'interaction avec les cuts de capacité globaux. Ne pas implémenter implicitement T2, remplacement, succession ou S3 pour contourner une précondition de T1.

L'auteur doit fournir le plus petit delta et les attentes finies de cette seule étape à partir des contrats existants, sans nouveau catalogue S2–S4 ni extension SQL silencieuse. Toutes sources82, entrées, bases et logs restent gelés ; aucun nouveau code/runtime autorisé par cette préparation. Le budget81 est clos, pas rouvert.

## Limites

000b/S2global/M2 restent ouverts. Pas de vrais droits provider, public/S3, commande scientifique/agent/RPC59, transition intergénérations positive, publication ou replay S4 global. Aucun Git, canonique/v6/client/global, C#/jeu/live/IDA ou nouveau service. Les trois commandes consolidéesM2 restent à exécuter au stade approprié.
