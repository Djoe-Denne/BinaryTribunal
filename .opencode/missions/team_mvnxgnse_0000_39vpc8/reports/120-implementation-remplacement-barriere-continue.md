# M2 — 120 : implémenter le remplacement sous barrière continue

## Contrat ratifié, pas preuve exécutée

Inputs119vérifiésparent : CONTRACT6569B/4dac2a87… ; DATA28896B/1e598336… . Comparaisontextuelle BEFORE→AFTER : seul le premieravailabletrue→false change ; baselineworker-a/bshared et rootTemplate préservés. Douze sources116intactes. Ratifier contrats118/119 et tablepré/post pour la fixture, sous qualificationréelle des codecs/sources ; aucunreplan/seal/bind exécuté.

GO SOURCE de prepareReplacement puis CASReplaceCandidateA, sans nouvelleallocation/root niRUNNINGintermédiaire. Compteurspréparation3/bootstrapinclus, remplacement1 etactivation2 indépendants, jamaisrechargés. Les substitutions de sourcescourantes sont autorisées comme réductionréelle uniquement, pas comme simplecopie de version pour sauverOLD.

## Ownership et préservation

Parent conserve12sources116 etmanifest113 sous snapshots/s2-cross-epoch-116 avantdégel et protège les deuxinputs119readonly. Allowlistcandidate isolée, **douze fichiers** :

- modifier src/graph-generation-store.ts, graph-trusted-authority.ts, graph-generation-transition.ts, graph-generation-activation.ts, graph-final-inventory.ts, graph-terminal-history.ts ;
- créer src/graph-generation-replacement.ts, helperprivé ;
- adapter test/s2-author/t2-fixtures.ts et final-host-fixture.ts ;
- créer test/s2-author/replacement-fixtures.ts, replacement.test.ts et replacement-contender.ts.

Le dernier fichier est uniquement le petitcontendeurSQLite local décritci-dessous, pas un harnaisgénéral. Si inutile, le laisserabsent et le signaler. Aucuntesthistorique131, seed/hôteorigine, helperbudget/resource-ledger/fixture-records, sourceS1/inputs/base309/config/typepublic/canonique/DB/asset existants modifiés. Besoin d'unautrefichier/DDL/contratpublic à remonteravantextension. Produit sansimports tests/mission.

## Obligations du produit

1. PortsHOSTsourcecourante etcapabilityREPLACE privés dans l'autorité existante, current/révocation opposables et distincts debootstrap/T1/finalA. Lier réellement OWN/path/owner/root/parent/OLD/NEW/stage/cut/barrière/fences/sourceBindings/policyT0/préimagecomplète. La demande ne s'authentifie pas par son JSON/hash. Préserver source OLD/currenthistorique ; toutepreuveinconnue=>HOLD.
2. prepareReplacement créeNEWdurablePREPARED nonpointé, unitésSTAGED/blobs/prepostimage/sourcebindings immuables et provenance de charge3. OLDtoujourscourant, activeparent/barrière/cutT1intacts. h/c/pointeurinchangés, prepCounterRef3 et inventory+1/exhaustivité/histoireglobale/cursor+1 expliqués. CAS surtoutepréimage, pas h/c seuls. Retryexact0/rollback0, stagedperdant conservé/chargé. Ni remplacement ni activation payésici.
3. Counterremplacement0 est retenu explicitement depuis la policyautoriséeT0/root, dans une transactiond'initialisationprovenable, pas inféré d'une absence à la première demande. Nouvellesfixtures/bootstrap peuvent le retenir sousleursourcescomplètes ; ancienétat sanspreuve resteauditable maisHOLDpour nouvelleopération. Aucune migration/réémission desbases116. Sourcecap1 ne vient pas d'uneconstantecaller.
4. CASswap mêmeactiveparent/head/OLDpointé/NEWstaged, régimeA/sourcecourante/K/ledger/inventory/proofs/counters. AppendrecordS1CandidateReplacement etpreuveprivée, OLDABORTEDsupersededmotif/NEWPENDING_DRAIN, h/c+1/inventory+1/remplacement+1≤1 atomiques ; barrièremode/cutT1inchangés. RelectureLIVE/TTLstrict/postimageaprèsvraiappend et rollbacktotal. Exactretry lié à la mêmeautorisation/source/old/new, différentrefuse.
5. drainResult et histoire expliquentNEW via chaîneimmutable, jamais en réécrivant DrainEntryOLD. PREPAREDnonpointés/ABORTED/stagesperdants ont uneprovenancepositivecomplète. Aucunload/replay ne choisit unstagedououvreuneadmission. Familles/claims/pins/bodies/SPENT/BURNED/ENCUMBERED/K et anciensrecords conservés, jamaistransférésàNEW.
6. AnciennesActivationAttempt/casesOLD inexploitables pourNEW, ycompris uneanciennecollection techniquementREADY. FinalA/current/collecte neufs et replacementRecordRefexact sous compteurroot2continu. Roster/journaux/20catégories incluentvraiesopérationsprepare/swap et histoirestaged/ABORTED, admisesavantfaits. Préserverles gardesQ/journaux/ordrevalidation114/cutsLIVEvsHISTORY/TTL/fullCAS/postimage104etrootconservation.
7. Nouvellehelperreplacement sans boucleVALUEvers les modulesqui leconsomment. Réutiliserlecteursbasniveau ettypesS1existants, orchestrerécriture dansstore/authority ; pasnouveaucallbackcaller ouIO/awaitdansTX. Références/implémentations et dépendances consommées à examiner avecSerena avantmodification ; couverturebornée àsignalersans«absenceuniverselle».

## Scénarios source et contention bornée

Écrire d'abordlesattentesmanuelles118/119 dans les nouveauxfichiers : nominal/stage-reopennonautorisant/swap/barrièrecontinuemêmesdroits, retry/perteréponse, rollbackaprèsvraiappend, préimageh/cégauxmaisprepRefinventorypérimés, capcurrentforgedrevokedunknown/exhausted, TTLstrict/Bnative, oldattempt/case refusé puisfreshfinal. Sourceworker-a indisponible doit passer réellement un replanexplicite puisS1futur ; ne pascopierOLDplanningcontexte ou inventeruneconnaissance/publication.

Parent a examiné les **mécaniquesconnues** de contention existante : canonical recovery.test107–132 distingue sérialisation et chevauchementBEGIN ; fixture-driver186–195 utilise threadSQLitelocal+SharedArrayBuffer/Atomics etjoint ses résultats. Le contendeur existant est couplé àGraphStorev2 et n'est pas directement une preuvev3. Autoriser **seulement une petite adaptationlocale de ce mécanisme**, dans replacement-contender.ts et lesdeuxnouveauxhelpers/tests, pour deuxconnexions du **mêmeOWNneuf futur** et deuxidentités/capRefs distinctes sur le **mêmeNEW3**. Pas de dépendance/framework/service/runnergénéral, pas d'Ensembleagent ou d'action jeu/live. Les assertions/oracles restent ceuxdesinputsratifiés, pas copiés des testsQA.

Le futurtest doit prouver tentative du secondBEGINpendantverroudétenu et ordrescommit/retour, unseulswap/charge1 et rejet duperdantstale, indépendamment du retryexact. Threadborné, timeouts/erreurs/exit toujourscollectés, aucunworkerorphelin ni cheminDBfallback. Coderles appels seulement, **aucunthread lancé maintenant**. Si ce raccord nécessiteun harnaisimportant ou desdroitsnonprévus, arrêter le point et remonter lebesoinprécisavantextension.

DeuxNEWdistincts demanderaient4préparations : interdits sousplafond3. Aucunrefund/nouveauOWN pourcontourner, aucuneprétentionque la coursedemêmeNEWprouvecellede2stagesdistincts. La limite118 resteexplicite ; contentionréelle nonobtenue tantque nonexécutée. Deuxappels séquentiels ne sont pasPASSsurcetaxe.

## Droits et suite

Autorisation **SOURCE SEULEMENT**, zéroimportévalué/replan/seal/bind/typing/test/SQL/DB/opener/asset/provider/native/thread/Git/délégation/oracleQA. L'auteur ne relit pas les testsinterdits pourchercher unpattern ; la descriptionmécaniqueparent suffit, besoinprécis àescalader. Incident117 ne doit pasêtre reproduit.

Livrer fichiers/hashs/imports/API/records/prépostimages/scénarios/risquesetlimites, pas nouveaucatalogue. Parentdelta, revueindépendantedesnouvellesfrontières et impacts116 puis futurOWN/assets/env/budgetcommandesbornés. Aucunancienpaquet réouvert, aucuneéditionaprèsgel sansGO.000bownerlead/S2global/M2 ouverts, succession/S3public/S4global/L9L10/consolidationfinale nonacquis.

## Préservation et mise en œuvre du mandat

Les douze sources116 et le manifeste113 ont été conservés avec vérification byte-exacte dans `snapshots/s2-cross-epoch-116/`, puis rendus readonly. Les deux entrées119 ont été vérifiées contre leurs hashes complets et protégées readonly. Les quatre nouveaux chemins sont absents ; seuls les huit fichiers existants de l'allowlist120 sont dégelés. Le mandat source est transmis à l'auteur retenu, sans changement de politique ou de modèle. Aucun import, test, thread, SQL, accès aux assets ou opération Git exécuté.
