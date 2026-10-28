# M2 — 86 : implémenter la préparation initiale et la barrière T1

## Décision et préalables vérifiés

La règle utilisateur85 est intégrée aux deux artefacts83. Parent recalcule les hashes, lit le contrat corrigé et confirme que les sept sources82 sont inchangées. Le préalable contractuel identifié est fermé : octroi indépendant avant bootstrap, plafond3origines durables/bootstrap inclus, compteur et ensemble complets persistants, retry/rollback sans débit et aucune remise à zéro. Les docs seuls ne deviennent pas autorité.

GO source pour le delta **prepare initial + requestDrainT1** dans la candidate isolée. Cette autorisation n'inclut pas de test, compilation, import évalué ou DB ; elle n'inclut ni activationT2, remplacement, succession ni moteurS3. Pas nouvelle question utilisateur pour cette implémentation déjà prévue par M2.

Preuves : CONTRACT6615B/SHA5f6f8efd… ; transition-fixtures40079B/SHA51cb3329… ; aucune dérive des sept pins82. Serena trouve le consommateur connu installBootstrapA dans test/s2-author/fixtures.ts:30 ; les références des autres méthodes mutées devront être examinées avant édition. Ce résultat n'est pas une preuve universelle d'absence de consommateurs.

## Ownership et préservation

Avant dégel, parent conserve les sept sources82 et leur manifeste sous snapshots/s2-resource-82, puis protège readonly les deux entrées T1 corrigées. Dans `.tmp/m2-s1-integration-r2/tools/ff8-harness`, allowlist exacte :

- modifier src/graph-generation-store.ts et src/graph-trusted-authority.ts ;
- créer src/graph-generation-transition.ts, helper privé des formes/validations/cuts de préparation et T1 ;
- créer test/s2-author/t1-fixtures.ts et test/s2-author/t1-transition.test.ts ;
- adapter seulement test/s2-author/fixtures.ts pour enregistrer l'octroi avant les nouveaux bootstraps et fournir leurs témoins.

Les autres tests historiques, resource-ledger/budget, inputs/gels,309sources de base/configs et canonique restent intacts. Besoin précis d'un autre fichier/colonne/DDL/signature publique : remonter avant extension. Ne pas copier des oracles QA/L7, ni importer tests/inputs de mission dans le produit. Les types produit nécessaires restent dans le helper privé ; entrées synthétiques readonly utilisables par les tests seulement.

## Contrat source obligatoire

Appliquer le contrat83/85 corrigé et les choix85 : préimage(h,c,q), prepare(h,c+1,q+1), T1(h+1,c+2,q+2). Toutes mutations pertinentes comparent h **et** candidateRevision, pointeur candidat, barrière et fences. Pas de T0 réécrit, tolérance de mouvements inexpliqués, cast v3/v2 ou touch() augmentant sans raison budget/inventaire. En cas de contradiction de codec/callsite, donner la preuve avant de forcer.

L'octroi de préparation et son current/counter sont des sources hôte fixture privilégiées liées au véritable objet connexion/ownership et au root/lineage ; pas caller booléen/constante3 ou selfhash. Même transaction pour chaque nouvelle origine, compteur, pointeur et événement ; bootstrap compte1. Set exact des origines/commits en OWN, refus avant effet si absent/périmé/révoqué/épuisé/inexpliqué. Retry exact relit l'identité même à plafond atteint ; aucune origine durable perdante remboursée. Aucun octroi rétroactif aux DB82 ni nouveau OWN permettant reset.

La fille est qualifiée par les codecs/sources S1 déjà ratifiés, conserve parent/lineage/root/policy/sources exacts ; PREPARED n'est pas ACTIVE. Préparer sélectionne seulement le candidat initial si NULL. L'autorité transitionA/request-drain est un handle privé distinct du controller/bootstrap, lié au candidat et au T0/pré-postimage/source/case courant et ses révocations. CaseT1 ne peut servir àT2 ; bootstrap recyclé, B/native restent HOLD.

T1 relit toutes attentes/case/T0 et sources dans la même transaction/connexion, capture toutes familles réservées de l'active même sans outbox et le ledger physique82 audité, persiste BoundDocument cuts/DrainEntry/barrierRootId, passe PENDING_DRAIN/DRAIN_NEW_FAMILIES. Enumération indépendante et collections OWN exactes comparées au même cut ; aucune liste vide par défaut ou hash caller pris pour exhaustivité. Réservation et T1 partagent la même comparaison atomique ; avant cut inclus, après refus. Doublon exact zéro nouvelle charge/événement/cut, différent refuse.

Conserver observation/Q/release et seules continuations des familles engagées sous leur origine et droits initiaux. PremierR ne contourne ni profil/prédécesseurs ni preuves : en l'état reviewer absent reste HOLD. Pas de sorties RUNNING-only qui rendent le drain une pause globale. Candidat nonACTIVE et famille absente du cut n'autorisent rien. T1 périme workCuts ; nouvelle observation indépendante pour une prochaine occupation, même acquisition/set/poolRevision/demande, aucun quota neuf ou double débit. Retry identité ne donne pas redispatch.

Préserver l'audit d'intégrité R1, les sources historiques révoquées comme histoire mais non autorité et les sorties sûres82. Une impossibilité de raccord aux helpers resource-ledger intacts doit être explicitée, pas résolue en les court-circuitant.

## Tests source et gates

Écrire avant produit des attentes manuelles pour les scénarios83/85 : octroi avant bootstrap/compteur1, prepare+1/retry0/rollback0, borne et sources/current invalides, candidat immuable, famille réservée sans outbox, doublonT1, CAS/source/case révoqués, rollback après append, ordre réserve/cut, continuation engagée/famille absente, ressources workCuts périmés/renouvelés et mauvais types d'autorité. Les préconditions d'épuisement doivent être réellement atteintes avec une histoire durable cohérente ; un refus plus précoce sur pointeur candidat ne prouve pas le plafond. Ne pas introduire une API de remplacement/staging hors périmètre pour produire un test positif artificiel.

Les60tests82 restent attachés au snapshot conservé. Leur éventuelle adaptation/rejeu courant sera décidé selon l'impact, pas supprimée ou assouplie pour ce delta. Aucun maximum de couverture ou nouveau framework imposé.

Livrer six fichiers/hashes/imports/API/records/SQL/événements/attentes et risques. Aucun import/scellement/bind exécuté, typing/test/SQL/opener/DB/native/service/Git ou délégation dans ce GO source. Ensuite delta parent et revue indépendante de T0/T1/fences/counters/continuations ; tests runtime uniquement après OWN/env/registre/budget distinct matérialisés. Tous anciens paquets clos ; aucun240s implicite.

000b/S2global/M2 ouverts ; pas de commande publique/RPC, activation/replace/succession/S3/S4 global, cleanup ou changement global.

Préparation parent effectivement réalisée : sept sources82 et manifeste conservés sous snapshots/s2-resource-82, readbacks byte-exacts et readonly. Deux entrées T1 corrigées vérifiées et readonly. Seuls store/authority/fixtures existants sont dégelés ; les autres sources restent protégées. GO86 transmis à l'auteur existant, aucun import/DB exécuté.

## Limite d'atteignabilité du plafond, signalée pendant l'implémentation

L'auteur signale correctement que le seul parcours autorisé bootstrap+prepareInitial atteint deux origines, puis conserve un candidat pointé. Sans activation/remplacement/staging, il ne produit pas une histoire valide de trois origines suivie d'une quatrième tentative avec pointeur libre. Un refus du second candidat au pointeur occupé ne prouverait donc pas le plafond de trois.

Décision parent : ne pas étendre cette tranche pour fabriquer ce parcours, ni injecter une histoire incohérente. Continuer le garde de plafond et les preuves réellement atteignables (bootstrap1, nouvelleorigine+1, retry0, rollback0). La preuve runtime spécifique d'épuisement après trois commits cohérents reste **requise mais non obtenue**, à rattacher au futur chemin de cycle de vie autorisé ; aucun waiver ni SKIP/PASS de substitution. L'acceptation éventuelle de T0/T1 sera explicitement partielle sur cette dimension et ne fermera pas la vérification globale du budget de préparation ni S2. Si une fixture d'histoire complète indépendante devient nécessaire, son admission/ownership et sa gate seront fermés avant usage, sans nouvelle API silencieuse.

## Précision sur la course réservation/T0/T1

Trois branches distinctes, sans rafraîchissement implicite : réservation avant captureT0 => famille incluse dans le cut complet d'un T1 nominal ; réservation aprèsT0 mais avantT1 => attentes head/inventory/ledger périmées et T1 refuse atomiquement, sans cut/barrière/charge de préparation supplémentaire ; réservation aprèsT1 réussi => nouvelle famille refusée. Dans le second cas, conserver la réservation et les engagements déjà commis, ainsi que le candidat/T0 historique ; ne pas présenter ce refus comme un T1 réussi ni ouvrir un remplacement hors périmètre pour le contourner. La formule antérieure « avant cut incluse » vaut pour une photographie T0 encore exacte, pas une permission d'actualiser T0 à T1. DRAIN327–331 fait autorité.
