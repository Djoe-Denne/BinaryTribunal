# Parent — première cause2b1 = première cause effectivement retenue par broker

R1review result_mvf6kzg4_005u_vuoq39 CORRIGE confirmeunevraiecourse de diagnostic.
Parent a relu coordinator134–166/208–210 etbroker313–318/549–555/854–879 :
coordinatorpeutretenirInvalidRangependantqu'unReadengagé a déjàpubliéReadFailed
au broker. Lespremièrescausesrestentdifférentesàcause duif(!held) ultérieur.
Systèmefailclosedmaiscontratéprouvéparcetécart,mêmepasdecallsbrokerillégaux.

Précision sanschangementsignature/API/caps/time/ports : la premièreraisoncanonique
est celle LINÉARISÉE dansle vrai brokerimmutable,pas le premierconstatlocal qui
n'apasencoreétépublié. HoldLocked doit normaliserrequestedreason,publierunHOLD
auvRAIbroker,puis obtenirlesnapshotmémoiredu broker etréfléchirSACAUSERETENUE.
Signals restentaprès lapublicationbroker,MarkCaptureHeld/MarkEvidenceIncomplete
séparés. Unefencelocaleheld peutêtreposéesouscoordinatorgateavantpublication,
maislacausevisibleau sortirdoitcorrespondreàcelle réellementretenueparbroker.
UnpreviousHeldne doitpasfigerpour toujoursunecause locale nonconcordante.

Preuvelinéarisation :
- si leReadconcurrent a gagnélebrokerGate avant leHOLDlocal,soncode(9/10/11/
  etc)resteinchangé,donc lesnapshotpostpublicationlecopie ;
- si leHOLDlocal agagné,il devientpremièrecausebroker,leReadultérieur n'ychange
  rien,donclocaletbrokermatchent ;
- coordinatormethodes/snapshots sontsérialiséspargatecourt etbrokerLatch/Snapshot
  nefontaucunportRead/Write/Seek/propriétécallback. Aucungate I/Oàajouter.

LaqualifiedimplementationbrokerLatch normalise lesraisonsinvalidesetimposeHOLD
avecFailure!=None. Ne pasinventerfallbackquietouignorerunceprintcanonical.
Toutobservedbrokerincidentdéjàheld doitconservercettecohérence,garderpremièrecause
backendimmuableetpasnouveaucapturegrant/Read/EOF. Pas besoinmodifierbroker/V3.

Race nonseamée resteanalyseSTATIQUE,horsQAheap sanshookapprouvé ; pasthreads
nouveaux/assertweakening/reflexiontesthook/clock commeproof. QA_R1inchangée.
R1source/QA/reviewgels etCORRIGE restentconservés,aucuncompiler/runR1.
