# Parent CODE GO tests R2 : cinq findings, scienceR2/fixtures immuables

Review result_mvfgws0d_00a8_mcc9bq CORRIGE confirméparent auxancres réelles.
Qualifier les tests/documents seulement ; ancien R1gels/CORRIGE conservés,
aucun test/import candidat évalué etaucuncompiler lancé. 4nouveaux../outputs
mêmesnoms, sourceproduitR2/originaltests/17fixtures/main/config inchangés.
Ledger450pairs(64/128/242/16),224value/226refusal+9regressions inchangé ; ne pas
supprimercas/modifierexpectkind pourobtenirvert. Pasnouveauframework.

## 1. Roundtrip oracle, pas égalité d'ordre constructeur/import

Remplacer uniquement observe(restored)===observe(graph) par réexport exact du
snapshot importé : observerbits/ordre de exportSparseGraph(restored) vs snapshot
exporté avant. C'estl'oracleexistantcluster.test.ts roundtrip ; ne pas modifier
productR2 ni normaliser/sort graph properties. Garder FULL originalgraph ET
snapshot ET restoredgraphs/caches/summands dans outputdiff commeactuellement.
Chaquegraphcontinueàêtrecomparéau mêmestadedel'autrebranche, aucuneomission.

## 2. Projection-underflow observe l'entrée consommée

Construire synthetic2input/classimport etconfig exact directMIN_VALUE/import.5/
Leidenseed dans make ; state contientcesobjets effectifs. action appelleces
mêmesobjets uniquement, pas un autreinput caché/allocationquehashstateignore.
Autresrangemodes/constants/casesinchangés.

## 3. Nonmutation avant PREMIÈRE opération scientifique

Regressionfixture : séparer construction DATA de prepare/bind ; avantPREMIER
prepare/bind de toutfixture concerné, capturer input/partition/config/adjacency/
graph/Maps/cache/aliasrefsappropriés. Vérifier chaqueétape prepare PUISbind PUIS
derive, success/refus, sans snapshotpost-hoc qui ignoremutationstabilisées.

Diff : make ne peut laisserprojectStructural/clusterGraph (ou autre préparation
scientifiqueconsommatriced'input) précéder touteobservation. Soitdéplacer préparation
dansactionavecguardinitialsurrawdata, soit petithelper typé capturebefore/call/
finallycompareafter pour CHAQUE préparation, avecpreuvesobservéespersistées sous
lesmêmesplafonds parcase. Pas frameworktransactionnouveau. Couvrir également
preparedmatrices/groupCases/numericgraphpreparation si lemakeappelleunproducteur.
Les mutations DATA volontairement faitesparfixturepourcorromprecaches avant
opération ne sontpasmutationproductrice ; capturer leurétatactuelconsommé après
construction, avantappel. No guardafterclaimtoutepréparationprotégée.
Gardesfailures sontfatalqualification, jamais refus scientifique appairable.

## 4. Error : formecomplète etcompatibilité TOUTEchaîne d'origine

Garder stack àsa positiondansownkeyssemantic : nom/présence/ordre/enum/config/
writable exacts comparés. Seulevaleurtechnique stackstring est séparée/taguée
explicitement danssemantic ; rawvaleur/descripteurENTIER gardéencoreparbranche.
Aucune autrepropriété/descriptor n'est supprimée ou reclasséeimplicitement.
Profil inconnu/accessor/unknownErrorproperty resteSTOProot, pasSDK/Bunprofilinventé.

Au pair, vérifier une preuveferméedecompatibilité deTOUSframes, pasframes[0]
seul. Lignes/colonnes/fichiers/hashes rawconservés,chaqueframe validé sourcepinnée.
Framesliteralementdéplacés : mapversbaselinesource/ligneETcolonne selonseule
diff 'export ' prouvée7caractères ; si coordonnée nonjustifiable =>STOP. Frames
testauthored doiventavoir hashcommun etligne/colonnecorrespondantes, pastoken
génériquequi cache une variationdechemin d'appel. Comparer lachaîne complète.

Les wrappersnouveaux de paramétrisation peuvent ajouterunframe, mais PAS filtre
'drop-wrapper' pourforceequality : si nécessaire produire tableFERMÉEproposée
depuislesseulsbytespinnés, rôle/callees/callsite/voisinsalignés explicitement
justifiés. Proof doit consommer chaqueindexdeframe desDEUXbranches (aligné ou
insertioncandidate connuedansgraphed'appelrevu), etretientindex/coordonnées/motif.
Table etpreuve soumisàfreshV/parent, pas whitelistinglibre de touthelper/range.
Origineinconnue/chainnonréconciliable =>STOP investigation, pasinventionruntime.
Si cesjustificationsnécessitentinputessentielabsent ou décisionstructurante
nouvelle, ESCALADERparentAVANTélargir. Aucun résultat de profileSDK/Bunprésumé.
Ajouter petitscontre-exemples de l'oracle : flags/position/presence stackdiff =>
nonégalité, frameadditionnelnonautorisé =>refus ; pas nouvellepairedcase450.

## 5. Provenance oracle mathématique

Rétablir movesOracle node<n EXACTcommeoriginal. Vérifier corpscopié avecunique
qualification Arc→B.Arc/documentedindentation/unusuedhelperomission ; corriger
DESIGN/MANIFEST honnêtement. Pas2èmealgorithmenumérique ni boundlabels.length.

## Deltas/acceptation

Limites2MiBcase/128MiBbranche/namespaceexclusive/STOP etimportsAPI/typesinchangés.
R2manifest/documents détaillent uniquement5correctifs+preuves/sourceprovenance/
inputbookends. Fulloutputeventsbits/Maps/keys/order/alias/errorraw/scientificcase
attentes restentcomplets. NOsourceproductfix pourmauvaisfixture ; aucunemiseà
égalitéparsort/crop/normalisation degraphes/throwingOriginonly/skippedcases.

GO CODEdirectaprès hashpacket OWN4nouveauxoutputsONLY, pasroutineACK→GO.
No compiler/typecheck/transpile/test/run/importcandidate/product/validator/Bun/
OSprobe/DB/git/IDA/live/network/originsnonpacket/delegation/teamtools/taskclosure/
main/globalconfigwrites. SourcePROPOSED final4hashsbytes/delta/bookend/risques.
FreshV puisroottypedgates/profileruntimeerreurs/suites etFULLdiffaprèsGO séparé.
