# M2 — 79 : correctif d'intégrité livré, reprise ciblée de revue

## Livraison vérifiée

Le correctif78 est livré dans les deux fichiers autorisés. Le parent recalcule les sept pins : seuls ledger et resource-admission.test changent ; les cinq autres fichiers77, les 309 sources de composition, ses contrôles et les entrées corrigées restent identiques. [Manifeste source corrigée](../evidence/s2-resource-source-78.json), sourceSet3e8ed7f7… ; baseline77 conservée sous snapshots/s2-resource-source-77.

L'auteur annonce une jointure complète outbox/imageSPENT/événementprepared dans readResourceInventoryV1 et un test fini à quatre variantes : bytes JSON valides altérés, requestDigest, commandSHA, puis image localement cohérente mais différente du pin durable. Il prépare le témoin de B avant corruption pour éviter un faux refus sur une autre précondition. Ces points sont des corrections **à revoir**, pas un verdict de fermeture.

**Aucun import évalué, typing, test, SQL ou DB exécuté.** La nouvelle origine S1 reste non qualifiée. Le nombre de scénarios écrits n'est pas une preuve d'exécution.

## Décision

Re-geler les sept fichiers et reprendre avec le même reviewer indépendant le seul défaut R1 et l'impact du delta : vérification des bytes/hashes/digest, imageSPENT et événement exact, comportement à reopen et avant nouvelle consommation. Relire les nouveaux imports et l'ordre des appels pour exclure cycle runtime, recopie de validation permissive ou garde inatteignable. Réutiliser les constats2–6 inchangés de sa précédente revue ; ne pas rouvrir le catalogue global de ressources.

Le test doit atteindre le contrôle du contenu et du pin, pas seulement une erreur JSON/hash local ou un témoin B déjà périmé. Les assertions doivent garder les effets de la corruption elle-même tout en prouvant l'absence d'effet supplémentaire, sans « réparer » la base. Une histoire de source ultérieurement révoquée ne doit pas devenir une nouvelle autorité ; le correctif ne doit pas casser l'audit de cette histoire.

Revue strictement readonly : lectures/hashes/AST autorisés, aucune évaluation fixture/produit, typing/test/SQL/opener/DB/native/service/Git/write/délégation. Retour PRÊT_FIXTURE ou blocage précis avec source/scénario. Pas d'accès aux oracles QA S1/L7 indépendants.

## Suite et limites

Gate runtime fermée jusqu'au verdict puis préparation parent des OWN/registre/env/commandes et budget fini propre. Ni240s proposés ni paquets66/72 clos ne sont un droit d'exécution. Aucun nouveau framework ou changement de contrat.

000b/S2/M2 restent ouverts ; aucune commande publique/native, transition/crossgen ou qualification S4 globale ajoutée. Les preuves73 restent attachées à la source70 conservée. Trois commandes consolidées M2 toujours non exécutées pour ce nouveau complément.

Re-gel effectivement réalisé après vérification des sept pins3e8ed7f7… ; reprise79 transmise au reviewer indépendant existant. Auteur informé de ne plus retoucher le courant. Aucun droit runtime accordé par cette reprise de revue.
