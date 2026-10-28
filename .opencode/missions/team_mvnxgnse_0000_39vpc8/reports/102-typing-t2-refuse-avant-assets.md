# M2 — 102 : typing T2 refusé, aucun asset ou runtime engagé

## Résultat observé

Gate101 : typing exit2, six diagnostics,4749ms, sources inchangées. Une invocation seulement ; paquet clos après rouge. Aucun test SQL, aucune base ni asset créé. Les deux preuves quota3 et conservation crossEpoch restent obligatoires/non obtenues.

Source revue4b84f373… ; sourceSet exécuté432ff6f7fb14d8669cc35405f6ce566a6f0a20f37477bd6d9bab3de85648c3da. Reçus/logs conservés dans `.tmp/m2-s1-integration-r2/evidence/s2-t2-100`. Le contrôleur neuf est `evidence/check-s2-t2-100.mjs` ; aucun prédécesseur modifié ou rouvert.

## Causes et décision

1. Deux accès `child.bound.body.planning` (store414/458) sont invalides : le body de préparation exclut planning, alors que l'origine scellée le conserve. C'est un défaut du document critique stagé, pas seulement une annotation. Utiliser le document exact `child.bound.origin.envelope.planning` aux deux sites, sans reconstruire le planning décodé ni changer l'ensemble attendu.
2. Le helper d'entrée `materializationPlan92` décode sans préciser GraphInputSource, donnant unknown (trois diagnostics151/154). Fournir ce type existant au décodage, sans cast ni validation supprimée.
3. Le test129 initialise une variable scalaire à null puis la modifie dans un callback ; TypeScript ne suit pas ce changement et l'assertion Bun exige null. Employer une cellule typée pour conserver exactement la séquence réellement observée par le spy et l'égalité àE6 ; aucun remplacement de l'observation par la valeur attendue.

Autoriser le correctif source parent sur ces trois fichiers seulement, après préservation byte-exacte de chacun, du manifeste100 et du contrôleur101. L'entrée gelée est conservée avant correction et doit recevoir un nouveau pin explicite ; jamais modifier silencieusement un input ratifié. Les autres sources/tests, compteurs/policies/TTL/default, oracles et artefacts historiques restent intacts.

Revue indépendante ciblée obligatoire sur le document stagé et l'impact des deux adaptations de types/tests. Preuves logiques valides précédentes réutilisées hors impact. Aucun nouveau harnais ni extension scientifique, aucune permission de runtime par cette décision. Un paquet distinct devra être matérialisé après correction et revue : ne pas réessayer gate101 ni compter ce rouge comme PASS.

000b appartient au superviseur et reste ouverte ; S2/M2 non clos. Aucun commit, merge, push, nettoyage, service, native/public ou commande consolidée exécuté.

## Correction effectuée, revue attendue

Trois fichiers corrigés et re-gelés. SourceSet e8825ed5… ; store103718B/3fd6d676… ; test15702B/616ed976… ; entrée activation481d7fb6… . Six autres sources100 inchangées. Comparaison requise avec snapshots/s2-t2-typecheck-101 (trois fichiers+manifest+contrôleur conservés byte-exacts readonly). Nouveau manifeste evidence/s2-t2-source-102.json ; aucun ancien pin réécrit.

Le reçu rouge101 et les deux logs sont vérifiés par hashes ; répertoires owned-databases et owned-assets inexistants. Nouvelle compilation toujours non exécutée, runtime verrouillé sur revue puis nouveau paquet distinct.
