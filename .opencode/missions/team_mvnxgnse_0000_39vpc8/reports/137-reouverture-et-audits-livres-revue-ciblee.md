# M2 — 137 : réouverture et audits livrés, revue des garanties conservées

## Livraison vérifiée

Quatre fichiers136 modifiés, tailles et hashes vérifiés par le parent ; huit autres pins128 et les deux entrées122 inchangés. Les douze fichiers sont gelés. [Manifeste136](../evidence/s2-replacement-source-136.json) ; baseline exacte et contrôleur134 conservés sous snapshots/s2-replacement-134.

58cas écrits annoncés, dont50préservés+8variantes de réouverture ;55sans thread et3HOLD. Aucun nouveau typing, test, thread, SQL/DB ou asset exécuté. Le typing130 et les131PASS132 attachés à128 ne sont pas transférés sans contrôle d'impact. Le lot134 reste rouge partiel et clos.

## Revue indépendante ciblée

Reprendre le reviewer retenu sur les quatre fichiers seulement, décisions136 et contrats existants. Réutiliser ses preuves129/126/123 hors impact ; pas de réaudit général ou framework.

### Compteur absent ou strict

Vérifier la complétude de finalActivationHistory136 dans le helper : absence uniquement sans aucun fait final/activation, y compris versions/ref/kind/key altérés ou record orphelin ; absence≠0 et≠autorité. Au premier fait, lecteur strict et joins/métadonnées/digests restent obligatoires. Snapshot avant fermeture/après reopen garde les mêmes bytes/état et n'initialise rien. Les deux anciens cas stage/swap doivent atteindre ce risque sans masquer une corruption ; huit variantes exigent bien strictness après final, disparition/révocation/digest/orphelin ou seul faitstaging/cut/événement. Les autres utilisateurs cross-epoch/T2 restent compatibles.

### Deux audits dupliqués

Store doit ne retirer que les appels immédiatement doublés par captureOperational qui inclut le même audit strict, dans la même phase sans effet OWN/append/callback/port externe intermédiaire. La fermeture des sources et toutes postconditions distinctes, drain/counter/LIVE/TTL restent évaluées. Vérifier la chaîne réelle, pas le seul commentaire de l'auteur. Ne pas fusionner des contrôles pré/postappend distincts.

### Décodages locaux immuables

Map interne à assertFinalOwn, créée après les lectures HOST/OWN réelles ; aucun paramètre public ou cache global. Clé couvre document complet exact utf8/ref/kind/encoding/length/sha ; entrées réellement immuables et résultats non exposés/mutables. Chaque invariant/énumération/ref/métadonnée actuelle doit toujours être évalué. Le contexte est purgé avant frontière Q/proof/terminal et avant relecture événement ; toute invocation pré/postappend a sa propre portée. Un changement de source/epoch/revocation ne doit pas réutiliser une ancienne permission.

Comparer les corps/expressions de gardes au baseline : ni format persisté, gros document, preuve consommée, oracle ou source supprimé. Le gain statique annoncé40→27décodages dans assertFinalOwn ne prouve pas une accélération :40clés canonical et rétention supplémentaire peuvent coûter. Dominance, gain net et respect15s ne sont pas mesurés ; aucun verdict de performance demandé par prose.

## Permissions et retour

RO : lectures/hash/AST/refs bornées, aucun write/import évalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Aucun claim/complétion de la tâche globale lead. Retour source accepté ou défaut précis avec contrat/source/scénario ; suggestions différables à part. Signaler les risques de cache/absence qui exigent une preuve distincte, sans inventer une obligation de refactor plus large.

Après revue et corrections éventuelles, parent fermera compilation et mesures/tests ciblés dans un paquet neuf. Aucun profiling ou gate runtime actuel. Delais15s/test et300s/process ne sont pas relevés ; HOLD125 sur les trois lancements thread reste intégral. S2/M2/remplacement/S1concret global/contention non acceptés, commandes consolidées non lancées.
