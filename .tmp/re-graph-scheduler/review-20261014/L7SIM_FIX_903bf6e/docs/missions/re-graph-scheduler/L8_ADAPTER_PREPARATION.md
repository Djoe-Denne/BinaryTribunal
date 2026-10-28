# L8 — préparation de contrat, aucune activation d'intégration

2026-10-14. Inventory read-only `l8-api-inventory`, task `task_mv81apms_0002_0i24tb`, session `ses_ec5ccd254ffeN7781el3U74Hpy`, **GLM5.3Flash/max OpenCodeGo natif vérifié**. Livré sans writes/install/tests/nativeAPI/DB/config/Git ; SHA before=after, parent recheck des six fichiers conforme. Shutdown demandé après livraison. **Task d'inventaire seulement**, L8 original `task_mv6towrm_000c_24005n` reste non activé ; modules/L7/L9/L10 gates inchangés.

## Baseline centrale pinée

- engine.ts `7d002313295b0b47c6f3f9d98787a876851041c19ce748cd9212399e6108bc6f`
- domain.ts `608b5584ecb280c11bb2c804ebc73d300c555c8a347aa8b76b34ab10b3126454`
- adapter.ts `8da11235b4d54f2e2e1f6f5a6ec7d9b55a7e00df445deff268c187cb7cce3354`
- client.ts `e27ce1876e8a480fa633b7c32928e38ae9f2a1f4903b7c694a4bce7299546a6c`
- cli.ts `84fd0f114d5b06eadf2dc18071752341cf11de9fbeec749a7b22175039c844db`
- store.ts `e40958217aa7a170e8968dc214aa3d8d95a5ea2097de39468f5ba2d219dce1fe`

Parent a lu directement engine148–164,client1–47,adapter10–24 après vérification SHA. Résultat crucial : client BridgeAdmissionError ne conserve que message/category/recoverable ; perte du discriminant protocolaire `execution_rejected` constatée client36–37. Catalogue/ID de modèle demandé n'est pas nativeModelRef observé, inspection.effectiveModel/freshness restent à contrôler via API réellement supportée.

## Six questions d'inventaire — décisions parent

1. **Identité** : un Intent par sous-intent/fonction/exécution, pas Intent multifonction. WorkUnit agrège/plannifie/réserve la famille avec tous ownerships ; sous-intents A/B/R restent de la même fonction et sessions fresh indépendantes. Garder Intent.identity v1 fonctionnelle (CONTRAT16), liaison durable unit/snapshot/revision/attempt/sub/execution/pin dans OWN adaptateur. Le préparateur C éventuel reste fonctionnel, ne remplace pas l'attribution A/B/R ni un résultat unique d'unité. Engine153–157 lie inputFingerprint/executionId/idempotencyKey ; ne pas copier ces IDs entre sous-intents.
2. **Rejets** : ne jamais déduire preuve de non-admission/terminalité de category ou recoverable. Nouveau chemin graph conserve le vrai discriminant/enveloppe/identité/digest/génération d'admission de l'API disponible, puis atteste preuve négative exacte ; aucune propriété/nativeendpoint inventée. Inconnu/transport/I/Oambigu → claims bloquées jusqu'à reconciliation conforme, pas simple retry-exhaustion pour libérer. Catégories servent à la politique de retry **après** preuve définitive. Changements restent compatibles avec l'ancien harness ; le client courant n'est pas promu au contrat OWN6 par ces notes.
3. **Boucle** : nouveau chemin graph explicite event-driven READY/reservation/dispatch/réconciliation, avec CAS/fences/proofs/budgets ; garder le stage machine existant pour les chemins legacy. Un seul owner central L8 et integration gate avant édition, pas migration/reprise implicite des campagnes historiques.
4. **V6** : attendre livraison + re-review + parent gates de l'OWNv6 corrigé. Ne pas câbler production contre v5 bloqué, ni considérer des tables/APIs simplement approuvées comme validées. Parent authority/ArtifactBindings/PublicationEffects et L4ProposalEvidence doivent fournir exactes signatures stabilisées/pins avant integration.
5. **Output mode/providers** : respect mode explicitement choisi et capacités réellement implémentées. Adapter17 refuse strict-output non-openai, sans substitution. Provider différent : file mode seulement si explicitement sélectionné/autorisé et contrat de capture vérifié ; sinon unsupported mode failclosed. Pas fallback de format/modèle silencieux, pas extension L1 gelée pour faire passer la route.
6. **Planner** : entrée future = **dernier gel L5 corrigé accepté par parent**, pas vieux main ni L5REL actuellement en review avec candidate liveness externe. RelationView/version/sidecars/policies record-ID/rebinding explicite doivent être stabilisés ; aucun transfert de plans vivants/unités/fonctions implicite. Conserver guard partial-native/selfloops inconnues et receipts exacts G1.

## Ordre de préparation puis intégration

Contrat d'adaptateur dès L1 est maintenant préparé. Avant L8 writer : accepter/piner L2 corrigé, L3 avec son helper/tests interop, L5 corrigé, L6v6 ; régime B attend en plus L4receipt/sidecars stabilisés. Ensuite unique owner central peut relier WorkUnit/SubIntent ↔ Intent/InputBundle/outbox/leases/receipts/proofs/CLI, avec modes/scopes explicites et pas de vérité transport implicite. Public bridge/API disponibles seulement, aucune lecture de DB privée Ensemble ni live/IDA.

L7-INTEROP et L9 doivent exercer ces chemins réellement croisés avec oracles et incidents, avant L10 parent. Inventaire accepté comme navigation factuelle, **pas architecture exécutée ni gate native G4/G6**, aucune extension de scope développement GO.
