# M2 — 67 : tranche source de persistance fixture S2, legacy intact

## Acquis et rectification du périmètre d'arbitrage

Helper65 accepté après contrôles66 : typing exit0 et6PASS/111assertions ; paquet clos, preuves conservées. Composition64 et QA S1DATA55 réutilisées dans leurs portées, aucune suite scientifique relancée.

Rapprochement d'autorité : M2§5.5 ordonne S2–S4 selon les contrats mis à jour ; QA_MATRIX132–161 prescrit explicitement OWNv3 et modules génération/authority/budget, sans interpréter les tablesv6 comme génération-aware. **Cette architecture de tranche est déjà prévue** ; le67 corrige la sur-escalade du59 qui en faisait un nouveau choix global utilisateur. Un opener privé strict du OWNv3 est son adaptation locale, pas un GO pour un second scheduler/backend natif ni une migration de v6. Pas de changement du contrat projet ou des permissions du runtime.

Ce rapprochement **ne ratifie pas les exclusions protocole/auth ni l'image RPC finale proposées59**. La tranche n'émet rien, n'appelle pas client et capture l'Admission fournie sans filtrer ses champs. Les garanties natives/globales restent non prouvées et interdites à la promotion sur seule fixture.

## Tranche fermée autorisée : code seulement

Dans la candidate64, ajouter src/graph-generation-store.ts et src/graph-trusted-authority.ts ; étendre src/graph-generation-budget.ts uniquement pour calculs/validations root purs. Conserver inchangées les trois API capture vérifiées66 et leur sémantique. Tests auteur nouveaux test/s2-author/{atomic-admission.test.ts,fixtures.ts} ; body.test.ts inchangé. Aucun autre fichier ni configuration écrit par l'auteur.

Entrée : source S1 acceptée/BoundExecution, bootstrapA offline-fixture seulement et autorité fixture explicitement distincte JSON. Réutiliser l'instance Database OWN injectée et EventLog sur la même connexion, canonical/fingerprint/immutableCopy/integer/invariant et codecs qualifiés. Aucun appel v6 reserve/prepareAdmission/quiescence sur des clés déguisées. Pas de reconstitution d'algorithme ou de sourcecap native.

Surface de tranche conforme à la révision56 : installBootstrapA, reserveFamily, prepareAdmissionV3, reconcileAdmissionV3, proveTerminalV3, releaseProvenV3, lecture/audit/replay de cette tranche. Signatures explicites/fermées, handles d'autorité privés liés à leur fixture/connexion/révision/génération et vérifiés, aucun booléen JSON devenant autorité. Un import de source DATA S1 n'active pas seul une admission.

Tables privées g3_meta/head/origins/units/families/claims/root/slots/outbox/authority/fence, version explicite et liste fermée ; tables EventLog partagées via la même connexion. Ne pas ajouter d'autres familles sans raison de contrat remontée au parent. L'opener refuse Ensemble (alias compris), bases étrangères/legacy, schéma inconnu ; aucun élargissement de store.ts/GraphStorev6. Ne jamais exécuter cet opener pendant la source/compilation.

Invariants prioritaires :
- génération/head/source/knowledge/plan/owner/fences/ledger/grant exacts relus atomiquement ; CAS concurrent ne gagne qu'une fois ; claims ressources et slots uniques au OWN/lineage ;
- slot execution logique distinct du slot concurrence, caps/débits acquis immuables, R encumbered, aucune baisse de débit au repacking ; SPENT/BURNED terminaux ;
- image entière/pin/débit/outbox/EventLog dans même transaction sans await/callback utilisateur ; échec append/CAS provoque rollback entier ;
- retry exact body/ID/slot/policy relit le même résultat sans nouveau débit/effet après reopen/heure différente ; autre body/identité/génération refuse ;
- pré-engagement refus sans effet ; post-engagement over-cap BURNED durable sans dispatch/crédit ;
- expiration lease/absence après IO ne prouvent pas arrêt ; preuve terminale liée aux lignes, receipt, génération et fences ; tardif audit-only ; inconnu/source manquante=HOLD.

Transition/drain/replacement/succession/publication non implémentés restent HOLD/non autorisants. Ne pas déclarer « cross-generation no-credit prouvé » si seule la génération bootstrap existe ou si les tests ont injecté une table privée ; la preuve complète restera pour la phase applicable. Deux connexions séquentielles ne sont pas une preuve de contention multiprocessus.

## Inputs et ownership parent

Avant extension, parent conserve un gel des deux fichiers65 et leurs hashes sous snapshots/s2-pure-65. Il fournit readonly une copie exacte de **fixture auteur S1** déjà livrée (test/s1-author/fixtures.ts du manifeste47), sous test/s2-author/s1-source-fixtures.ts. Ce n'est ni un oracleQA indépendant ni une autorité native ; réutilisation de données synthétiques, pas nouvelle qualification S1. Aucun accès à .tmp/m2-s1-qa-r2 ou aux scénarios/oracles L7 indépendants.

309sources/config64, snapshots et input fixture sont readonly/intacts ; v6/client/engine/adapter/canonique interdits. Parent seul contrôle la future intégration et les OWNfixtures. Sans input exact, citer le manque avant de générer des préconditions arbitraires ou de lire QA.

## Gate et vérification

GO **écriture source/tests**, aucun test/typing/import produit, SQL/DB/IOfixture/processus/native/Git maintenant. L'auteur écrit des cas finis manuels pour intégrité/refus, atomiques rollback/CAS, exact retry/reopen, BURNED, Q et schéma/authority ; livrer fichiers/hashes/imports/interfaces/SQL/risques, sans nouveau catalogue abstrait.

Avant toute DBfixture, une revue indépendante fraîche des nouvelles frontières SQL/fences/autorité sera obtenue (gate QA_MATRIX159, risque nouveau distinct de la QA S1). Pas pipeline universel en plus de cette obligation. Parent ferme ensuite chemins OWN neufs/registre, outils/config/env et budget proposé de tranche (au plus4runs ciblés+2typings/300s,une reprise diagnostiquée incluse) ; **budget non exécutable tant que runner/ownership ne sont pas matérialisés**. Ni ledgers QAclos ni gate66 ne sont réouverts.

Stop source sur manque structurel précis ; pas changement de contrat, framework ou permissions pour l'éviter. La livraison n'est pas clôture000b/S2. Les trois commandes consolidées M2 restent NON EXÉCUTÉES ; pas de native/public/jeu/IDA/C#/configglobal/Git/cleanup.

## Inputs effectivement préparés par le parent

Gel65 sous snapshots/s2-pure-65 : source budget et body.test copies readonly, hashes identiques aux reçus66. Fixture auteur S1 fournie sous test/s2-author/s1-source-fixtures.ts,49616B/SHA6c7401cbc90e51870c0b761223b7858d6aaea9910748cecd7de6cc8618a4180a, copie readonly conforme à la ligne du manifeste47. Aucun oracle QA indépendant copié. Reçu snapshots/s2-pure-65/RECEIPT.json SHA **f035294c23ff5d90721b1220139069f30f108f75c0c9e4489ec2a9a0d1c4320e**. Originals inchangés, aucun test/SQL/DB exécuté pour ces copies. Les fixtures S1 restent des inputs auteur synthétiques, pas autorité de bootstrap native.
