# M2 — 104 : runtime refusé sur l'audit de préparation, correctif local

## Résultats réels et conséquence

Gate103 : typingvert2028ms puis runtime exit1/29062ms ; **75PASS/41FAIL/0SKIP,517assertions,116tests sur4fichiers**. Deux invocations/31090ms, paquet clos sans retry, sources stables11168f6d… . Reçu runtime SHA6c5e7d80… et hashes de logs vérifiés.

Les41échecs rapportent tous `HOLD: unpointed candidate/staged origin unsupported` lors de prepareInitial. Les nomsFAIL sont répétés par le résumé Bun dans le log ; ce ne sont pas82échecs distincts. Douze scénariosT1 et les29T2 sont concernés ; leurs assertions en aval ne sont pas qualifiées. Aucun PASS T2, quota3 ou nouvelle conservation crossEpoch ne peut être revendiqué.

128basesSQLite neuves/177356800octets et87entréesassets (29fichiers,58dossiers) inventoriées ; aucun chemin non possédé et manifest inchangé selon contrôleur. Tout est conservé, sans cleanup/réouvertureSQL supplémentaire. Le contrôle des hashes d'artefacts après collecte reste à consigner distinctement ; pas d'acceptation de comportement fichier déduite du seul nombre de fichiers.

## Cause recoupée et correction autorisée

Store570–580 inscrit le candidatPREPARED, avance son compteur/pointeur puis append. Store587 capture ensuite l'état opérationnel avec **view antérieure**, dont candidateGenerationId=null. Depuis T2, captureOperational179–182 appelle auditGenerationHistory196–206 qui exige légitimement que toute originePREPARED soit le candidat pointé. Cette garde voit donc les données nouvelles et la vueancienne, et refuse à tort toute préparation nominale.

Modifier **un seul argument** à store587 : captureOperational(...,after) au lieu de(...,view). Le contenu opérationnel reste celui de la même génération active/root ; les nouveaux champs de contrôle ne sont pas inclus dans la photographie comparée. T0 reste immuable, l'égalité à observation.operational et le contrôle strict du head réel===after/counterRef à588–589 restent intacts. Ne pas retirer la garde d'histoire, exclure l'origine nouvelle, réécrire T0 ou accepter n'importe quelle vue courante.

Avant édition, préserver le store103/manifeste102/contrôleur103 byte-exacts readonly. Seul store est dégelé pour cette substitution puis re-gelé. Aucun input/test/policy/compteur/TTL/DDL/autrehelper modifié. Revue indépendante ciblée sur le choix de postimage et l'impact des contrôles postappend ; preuves valides102/100/99/97 hors impact réutilisées.

## Suite et limites

Pas de nouvelle exécution par cette décision source. Après revue, un nouveau paquet propre et ownership/assets distincts devront être matérialisés ;103 reste rouge/clos et ses données intactes. Aucun retry automatique, cas supprimé, seuil abaissé ou SKIP→PASS.

000bownerlead/S2global/M2 ouverts. Quota3 et crossEpoch effectivement dépensé toujours requis/non obtenus. Pas de Git/merge/cleanup/native/public/S3/S4global ou infrastructure nouvelle.

Correctif effectué et re-gelé : un seul argument diffère du snapshot103 ; store103719B/SHA62c014f1… , sept autres pins/tests/inputs inchangés ; sourceSetae1b4ecc… dans manifeste104. Hashes de toutes les128DB et des29fichiersassets recontrôlés conformes aux inventaires, sans ouvertureSQL. Inventaires DB01a7ba6a… et assets36a89345… conservés. Revue d'impact ciblée transmise avant nouvelle exécution.

[Bilan machine du paquet rouge](../evidence/s2-t2-103-validation.json). Le reviewer existant reprend uniquement le raccord de postimage et son impact ; verdict attendu. Aucun runtime104 ni nouvelle autorisation d'assets à cet instant.
