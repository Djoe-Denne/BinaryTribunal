# M2 — 81 : typing refusé, adaptation locale des tableaux de tests

## Résultat réellement observé

Le parent exécute le typing du paquet80 : exit2,15diagnostics,1816ms, sources inchangées, aucun signal/erreur d'outil. Tous les diagnostics désignent resource-admission.test.ts. Le SQL n'est pas lancé, aucune base créée. Paquet80 clos après une invocation rouge, pas de retry implicite.

SourceSet exécuté31bee695… pour source revue3e8ed7f7… ; reçus/logs sous evidence/s2-resource-78. Aucun résultat de compilation ou de fixture nominale n'est acquis pour ce complément.

## Cause et correction bornée

Le log détaillé confirme six appels incompatibles avec les types Bun installés : deux tables test.each readonly (lignes48/59) ne correspondent pas à leur overload ; les paramètres déduits deviennent unknown et provoquent les diagnostics en cascade. Quatre expect.toEqual attendent des tableaux mutables alors que leurs valeurs attendues sont readonly (42/309–311).

Le parent peut corriger directement ces six sites du seul resource-admission.test.ts : passer une copie par spread `[...table]` à test.each et une copie `[...attendu]` aux quatre assertions. Les objets, valeurs, ordre, cardinalités et comparaisons restent identiques. Aucun cast any/unknown, suppression de cas, filtrage, nouvelle dépendance ou seuil relâché. Les entrées readonly et le produit ne changent pas.

Avant modification, conserver ce test, le manifeste78 et le contrôleur80 exacts en snapshot pour reproduire le typing rouge. Seul le test est rendu éditable ; les six autres fichiers source78 restent protégés. Après patch, recalculer les hashes, vérifier le delta fini puis re-geler.

## Vérification affectée et suite

La modification étant limitée à l'adaptation typée de tableaux, aucune nouvelle revue générale du ledger n'est justifiée. Le reviewer indépendant reçoit les six changements pour confirmer l'absence d'impact sur les cas/attentes déjà examinés ; ses preuves produit et R1 restent valides. Typing et tests affectés auront un paquet propre après source figée et contrôle parent, pas un reset de80. La correction reste dans le mandat QA M2 ; ni framework ni arbitrage architectural nouveau.

Les futures commandes runtime et leur budget sont à matérialiser ; le runner80 rouge ne doit pas accepter une nouvelle invocation. Aucune base ou service autorisé par cette seule décision, aucun Git ou changement canonique. 000b/S2global ouverts ; les trois contrôles consolidés M2 restent non exécutés.

## Correction réalisée et nouveau paquet fermé

Parent conserve test/manifeste/contrôleur80 byte-exacts readonly sous snapshots/s2-typecheck-80, puis applique les six copies. Comparaison ligne à ligne : exactement42/48/59/309–311 changées, mêmes nombres de lignes, six substitutions prévues seulement ; six autres fichiers source78 identiques. Test26259B/SHA3f10f558… ; sourceSet corrigée **e8305f78…**, manifeste s2-resource-source-81.json. Aucun diagnostic n'est présumé résolu avant nouveau typing.

Matérialiser maintenant un paquet distinct evidence/s2-resource-81, contrôleur check-s2-resource-81.mjs adapté du contrôleur80 conservé. Mêmes commandes/config et limites : typing60s puis deux fichiers de tests90s,2invocations/150scumul,0retry ; nouveaux env/OWN/réservations neufs et mêmes règles80 d'inventaire. Le changement d'entrée de compilation justifie ce typing, pas un changement de reviewer. Aucun ancien compteur réinitialisé :80 conserve son run rouge1816ms,81 a son ledger propre lié aux sources corrigées.

Le typing peut procéder pendant la courte revue d'impact des six copies. **Le runtime exige les deux préconditions : typing vert et retour indépendant accepté sur e8305f78…**, matérialisé dans un reçu parent s2-resource-81-source-review.json vérifié par le contrôleur avant réservation/création des DB. Source produit et preuveR1 inchangées réutilisées ; aucune nouvelle campagne de revue. Un nouveau rouge ferme ce paquet sans retry. Aucun changement d'oracle ni de contrat métier.

## Typing de la version corrigée observé

Typing81 exit0, zéro diagnostic,1769ms ; sourceSet exécuté16e3b483… et sources inchangées. Logs vérifiés contre leurs hashes et reçu SHAb74a4f5c… . Ancien reçu rouge80 SHA17061dd7… et son ledger1run1816ms conservés ;81 a1run1769ms, pas de fusion/reset de compteurs. Les répertoires de bases n'existent dans aucun de ces deux paquets :0SQL/0DB à ce stade.

La courte revue d'impact a été transmise au reviewer existant. Le runtime reste verrouillé sur son retour accepté ; la réussite du typing ne qualifie pas l'origine/scellement S1 ni les assertions SQL. Les deux erreurs de syntaxe de message et la première erreur du script de comparaison statique ont été corrigées sans exécution produit ni nouvelle invocation de typing80.

Revue d'impact reçue **PRÊT_FIXTURE** : comparaison exacte six lignes, valeurs/cardinalité/ordre et références internes conservés ; aucune assertion affaiblie ni cas retiré. Parent accepte ce verdict et matérialise evidence/s2-resource-81-source-review.json. Typing vert et revue acceptée satisfont les deux préconditions81 : GO pour la seule seconde invocation runtime de ce paquet, sous ses plafonds/OWN déjà fermés. Aucun résultat SQL encore observé à cet instant.
