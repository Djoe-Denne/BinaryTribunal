# M2 — 123 : remplacement livré en source, revue avant exécution

## Objectif et état

Le remplacement doit échanger un candidat devenu périmé sans rouvrir les admissions, recréditer les droits ou réécrire la barrière initiale. La livraison contient les deux opérations distinctes de préparation puis échange atomique, et un petit contendeur SQLite local destiné à vérifier deux demandes sur le même candidat préparé.

Le parent a vérifié les tailles et empreintes des douze fichiers livrés, les a protégés readonly, puis vérifié les quatre autres pins du manifeste116 et les deux entrées122. **28 cas sont écrits selon l'auteur ; aucun n'est exécuté.** Compilation, qualification S1 concrète et concurrence réelle restent inconnues. Les 131 PASS précédents restent attachés au baseline116, pas au produit modifié.

## Décision : revue indépendante des frontières modifiées

Reprendre le reviewer indépendant retenu. Contrats finaux DRAIN386–426, QA_MATRIX226–249 et ENVELOPE216–221 ; décisions118–122 et données122 sont les attentes. Les tests auteur ne sont pas un oracle indépendant. Comparer au snapshot116, réutiliser les preuves encore valides hors impact ; pas de réaudit universel ni nouveau pipeline.

Risques requis, chacun avec preuve distincte :

1. Autorité réelle : sources HOST indépendantes conservées avant exposition au demandeur, current/révocation/connexion/path/owner/root vérifiés ; capability REPLACE privée distincte ; aucune demande auto-authentifiée par JSON/hash. Réduction concrète de worker-a seulement ; replan et recontextualisation courants cohérents S1, racine et anciennes sources immuables.
2. Préparation et compteurs : stage durable non pointé/non autorisant, préimage complète même si h/c inchangés ; charge préparation3, retry0 et rollback0. Compteur remplacement0 explicitement retenu depuis la policy autorisée au bootstrap des nouvelles fixtures ; état ancien inconnu HOLD, sans migration ou constante caller. Préparation3, remplacement1, activation2 indépendants sans reset.
3. Échange et histoire : OLD ABORTED et NEW PENDING expliqués positivement par records, sources et événements exacts ; même parent/barrière/cutsT1, pas RUNNING ou réécriture de DrainEntry. Comparaison atomique complète, relecture LIVE/TTL après append, rollback total et retry strict. Aucune suppression d'histoire ni transfert des droits engagés.
4. Activation et inventaire : ancien attempt/case refusé sans effet ; nouveau final et attempt sous compteur continu, lien exact de remplacement. Vingt catégories et journaux exhaustifs réellement admis avant faits, sémantique vérifiée avant histoire terminale. Conservation des gardes Q, lateACK, LIVE contre histoire consommée et conservation116 ; pas acceptation de nouveaux événements par leur seul nom.
5. Concurrence et périmètre : contendeur sur même OWN/NEW, identités et capacités distinctes ; vrai SQLITE_BUSY sur BEGIN pendant verrou, ordre commit/retour et rejet du perdant, pas sérialisation présentée comme course. Sources current effectivement invalidables entre connexions, pas cache donnant autorité. Threads, erreurs, délais et sortie bornés/joints. Option existingOnly de l'opener strictement deny-only avant création, défaut existant préservé. Deux NEW distincts restent inatteignables sous cap3 ; aucune assimilation ou waiver.
6. Compatibilité et dépendances : absence de nouveau cycle VALUE vers les modules consommateurs, lecteurs bas niveau uniques, pas import produit vers tests/mission ou callback/IO externe en transaction. Schéma et autres gardes inchangés, sauf option privée deny-only annoncée ; vérifier le diff réel et ses références. Les préconditions des 28 cas doivent atteindre les risques visés, sans refus précoce masquant ni oracles recopiés du produit.

## Permissions et suite

Revue strictement en lecture seule : lectures, hashes, analyse statique et références seulement. Aucun import évalué, replan/seal/bind, typing, test, thread, SQL/DB/opener, asset, provider/native, Git ou délégation. Aucun oracle QA S1/L7 ni recherche dans leurs tests. Tâche globale S2 reste propriété du lead ; le reviewer ne la claim/termine pas.

Retour PRÊT_FIXTURE ou défaut bloquant précis avec contrat/source/scénario et risque observable ; suggestions différables séparées. L'absence de preuve runtime à ce stade est une limite, pas un PASS ou une demande d'exécution. Après revue et corrections éventuelles, le parent définira un gate fini distinct avec nouveaux OWN/assets/env et budget. Pas de nouveau harnais important autorisé.

## Annexe technique

[Manifeste des fichiers gelés](../evidence/s2-replacement-source-120.json). Baseline : snapshots/s2-cross-epoch-116 et manifeste s2-cross-epoch-source-113. DATA12247673826… ; CONTRACT4dac2a87… . Les quatre autres pins116 vérifiés sont fixture-records, cross-epoch-fixtures, cross-epoch.test et t2-activation.test. Les autres affirmations de préservation de l'auteur sont à corroborer proportionnellement ; le contrôle parent n'est pas présenté comme vérification exhaustive de tout le dépôt.

S2/M2 restent ouvertes ; remplacement non obtenu. Pas de commit, merge, push, nettoyage, live ou exécution reconstruite. Les trois commandes consolidées restent non lancées et ne seront pas remplacées par les futurs contrôles ciblés.
