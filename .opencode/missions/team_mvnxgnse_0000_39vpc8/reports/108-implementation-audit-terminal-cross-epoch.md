# M2 — 108 : implémenter l'audit terminal sans recréditer les droits

## Décision et vérifications

Parent lit le contrat107 et les DATA/oracles : trois mêmes slots100000, [SPENT,BURNED,ENCUMBERED], engagement300000/restant0 ; source du non-envoi retenue avantbootstrap, retraite sans effet scientifique démontrée pour tous sous-intents, filleDEFER avantseal. Ces attentes sont ratifiées **comme contrat fixture à qualifier**, pas comme faits exécutés.

Deux hashes conformes : CONTRACT6661B/7513172e… ; DATA17756B/3861e27e… . Aucun import/fonction dans les DATA, huit sources104 intactes. Quota3 resteVÉRIFIÉ106 ; crossEpoch resteREQUIS/NONOBTENU.

GO code source borné de l'audit terminal historique et de son raccordT2. Aucun GOcompilation/runtime ; les bases/assets106 et tous échecs historiques restent intacts. Cette implémentation ferme DRAIN606–650 déjà prescrit, pas une architecture publique ou un moteur de publication.

## Ownership et préservation

Avant dégel, conserver huit sources105 et manifeste104 sous snapshots/s2-t2-106, readbacks/read-only ; protéger les deux entrées107. Allowlist candidate isolée, **neuf fichiers** :

- modifier src/graph-generation-store.ts, src/graph-generation-transition.ts, src/graph-final-inventory.ts, src/graph-generation-activation.ts ;
- créer src/graph-terminal-history.ts, helper privé de lecture/validation partagé sans IO externe ;
- adapter test/s2-author/t2-fixtures.ts et final-host-fixture.ts ;
- créer test/s2-author/cross-epoch-fixtures.ts et cross-epoch.test.ts.

Authority, resource-ledger/budget, seed/hôteorigine, tous116tests existants et helpersT1/inputs/base309/configs/typespublicsS1/canonique restent protégés. Produit sans imports tests/mission. Références/consommateurs des primitives extraites et callsites à examiner viaSerena avant changement ; absence d'index ne prouve pas absence d'usages. Besoin d'un autre fichier/typepublic/DDL/backend à escalader avant extension.

## Garanties de produit

1. Remplacer les refus globaux de lignes historiques par un audit **positif** : familleRELEASED, unitéCANCELLED/RETIRED expliquées, outboxTERMINALattempt0receiptNULL et Q exacts, allocationrelease et claims absents. Conserver toutes lignes et événements ; famille/outbox/claim actif ou histoire sans preuve=>HOLD. Un labelTERMINAL ou l'absence de sender dans le code ne suffit pas.
2. Partager le contrôle privé existantQ/pin/outbox/release sans copie divergente. Vérifier bytesAdmission/command/SHA/requestDigest/IDs/attempt/sourceorigin/envelope/owner/fences, pinSPENT et événements vrais. Receipt courant si branche envoyée un jour autorisée ; **dans cette tranche seule jamais-envoyé** est acceptée avec sourceHOST fermée opposable. Ne pas étendre positivement aux exécutions envoyées/publications.
3. BURNED : vrai pin complet+événement/charge100000, pas d'outbox/allocation/envoi ; R : vrai engagementinitial, aucunpin/IO et pas réassignation. Missing/contradictorysource=>HOLD, pas valeurs déduites du futur plan. Les slots et leurs pins/compteurs/root demeurent byte-exacts àT2 et reopen ; Q/libération ne rembourse rien.
4. Deux temporalités explicites : LIVE pour nouvelle collecte/activation, sourcesQ/roster/journaux/current/révocations/lateACK revérifiées avant/aprèsappend ; COMMITTED-HISTORY pour audit de la preuve réellement consommée. Un cut immuable privé peut être retenu dans les documents de staging/activation déjà existants, sans cyclehash ou nouvelleDDL. Ref facultative permise pour l'ancien chemin vide **uniquement** si l'audit complet prouve réellement absence de travail ; jamais bypass permissif quand des lignes existent. Historique révoqué n'est pas autorité nouvelle, mais ne peut réécrire un commit ancien ou ressusciter un droit.
5. Inventaire20catégories et journauxprivés admis avantbootstrap : vrais records familiaux/slots/outbox/intent/attempt/Q/releases/allocations historiques et acteurs/unitId/sources/catégories exacts. Pas de producerinconnu légalisé après les faits ou collections[] par défaut. Garder B-SCOPEcontroller, sourceframeLIVE postappend, TTLstrict, fullCASpostimage104 et toutes contradictions opposables.
6. La filleDEFER/selected=[] doit qualifier les joinsS1 avantseal avec mêmesrootallocation/limits/grants/modelbindings/bootstrap/asset. Unité nonREADY, aucune nouvelle admission par activation ; une tentative d'admission distincte refuse faute d'entitlement. Ne pas replanifier en nouveauroot ou réduireC/N/T pour rendre le scénario atteignable. Si ces préconditions sont incompatibles avec un codec/source ratifié, remonter la cause précise avantcast/relâchement.
7. Helpers de test peuvent composer le travail AVANTT0 et renouveler les observations physiques courantes sous le mêmehost/case/asset ; aucune ouverture du gate105 ni bricolage de ses bases. Pas de callback/IOexterne/await dansTXT2. Une fonction de fixture avantprepare est un choix local horstransaction, pas un port d'autorité du produit.

## Tests source et garde de portée

Écrire d'abord les attentes manuelles107 dans les nouveaux fichiers, sans modifier les116cas existants. Nominal réelA_SPENT/B_BURNED/R_ENCUMBERED puisQ/release/T0/T1/T2/reopen ; retry0 ; blocagesQmanquante/révoquée/mauvaisbody/attempt/fences, lateACKcontradictoire, famille/workeractif, catégorie/source/producteur inexpliqué. Fencesmal liées peuvent donner audit_only, pas exception artificielle. TTL10000/F1000 isolent ces causes sans changer les casTTL/defaultproduit.

Vérifier que A tient réellementC et B le dépasse réellement par champAdmission externe permis, que le filsDEFER est cohérent et que tous risques ont leurs préconditions ; aucune évaluation de fixture pour le savoir dans ce GOsource. Une preuve obligatoire inatteignable est signalée, pas convertie enSKIP/PASS. Aucune publication scientifique fictive, nouveau sender/executor/S3 ou connaissance réappliquée. Nouvelle dépendanceS3 indispensable=>HOLD et escalade précise.

## Livraison, revue et exécution ultérieure

Livrer neuf fichiers/hashes/imports/API/records/joins/événements/tests écrits et limites. Pas de nouveaux contrôles, framework ou infrastructure importants. Parentdelta et revue indépendante des nouvelles frontières/impacts sur106 ; réutiliser preuves116/primitives horsimpact. OWN/assets/env/registre/commandes/budget d'exécution seront fermés après revue seulement.

SOURCE ONLY : zéroimportévalué/seal/bind/typing/test/SQL/DB/opener/asset/provider/native/service/Git/délégation/oraclesQA. Après livraison/gel aucune retouche sans GOparent.000bownerlead/S2global/M2 ouverts, remplacement/succession/S3public/S4global/L9L10/consolidation non acquis.

Préservation réalisée : huit sources106/manifeste104 byte-exacts readonly dans snapshots/s2-t2-106 ; inputs107 vérifiés et readonly. Six fichiers existants108 dégelés, trois nouveaux chemins vérifiés absents ; autres sources protégées. GO108 transmis à l'auteur retenu, sans nouveau profil/modèle ou worker. Aucun import/test/DB/asset exécuté pendant cette préparation.
