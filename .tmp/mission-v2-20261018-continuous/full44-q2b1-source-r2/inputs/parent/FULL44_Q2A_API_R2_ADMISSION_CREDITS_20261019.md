# Parent — R2 admission/crédits après V composée CORRIGE

Le rapport result_mvf1whcd_002n_dohbqp est accepté comme findings, PAS comme
validation source/QA. Parent a confronté source222–305/381–421,QA491–609 et
coreV3HostComplete275–317,contratDUAL64–78/112–128. Aucune exécutioneffectuée.
APIpubliqueC#4 f95cd66e et oracleERROR1b3873c5 demeurent inchangés en signatures/
layout/caps/timing. Ce complément fixe les ambiguïtés observables, sansinventer
d'artefactsauxiliaires ou élargir leplanQ1. Aucun GO utilisateur supplémentaire requis.

## Admission managed V3 complète avantallocation/sinks

TryCreate exige le prédicat qualifié EXISTANT GuardianPredicates.HostComplete(binding)
avant toutecopie/buffer/sink, en plus des comparaisonsplan/identity/pins/refs déjà
requises. Réutiliser ce prédicat purmanaged,pasdupliquer/modifiergelV3. Il couvre
notamment 5transferts exacts(kind/ordinal/autorité/handlevalide/handlesdistincts),
Supervisor.OriginalController référenceexacte auTransfer(0),Signalsnon-null et
Signals.Read()==0,ainsique lesautrescontrôlesV3existant. Un fauxcontrôleur ayant
la mêmevaleurhandle n'estpas l'original transféré. Refus → InvalidBinding,
broker=null et aucune invocationStream/production. Ce check de données/objets
deconfiance ne prouve PAS acquisitionHOST/durabiliténi étatstablepourtoujours.

## Deux grants internes déjà admis

A initial reste controlactual+19328. Les permitsGR192 etreceipt192 existent dès
création,donc OtherGrantsINITIAL=2. MaxOtherGrants256 inclut cesdeux : auplus254
grantsexternes successifs. Pas recomptage àla matérialisationGR/receipt finale.
Le 255eexterne est refuséGrantLimit sans nouvelA/copie/write etlatchHOLD ; un
autrefixtureavec254externes peut finalisersans dépasser256. Aucuneréservation
échouée ne rendcréditoucompteur àréutiliser ; nepasfaireunhelperqui supposeun
succès à255 puis tester unguardultérieur devenu inatteignable.

## Matrice normative des catégories/crédits

- ControlFiles Ordinary : pool PRÉPAYÉEXACT plan.ControlFileByteCount seulement.
  Pas d'admission fraîche après épuisement,même si capglobal32768 a de lamarge.
  Ce total est le contrôle effectivementencodéQ1. Un nouvelartefact demande un
  planratifié,nonduspoolgénérique. Excès → BudgetExceeded sansnouvelA/effet.
- GuardianEvidence Ordinary : poolprépayé18432 réservé àla mémoireGqualifiée.
  Pas d'ordinaire frais au-delà dans2a ; capGE24576 est plafond,paspromesse de
  remplissage. Excès → BudgetExceeded sansnouvelA/effet.
- GuardianEvidence DeferredFinal : créditsFRAIS seulement,dans l'enveloppeGE
  restante (24576−18432=6144) ettotalglobal. Ne consommeJAMAIS le poolprépayé
  destiné àOrdinary/Gmemory. Pas doubledebit ni détournementdebaseG18432.
- SupervisorResult Ordinary : frais seulement,préserve intégralement le pool
  terminal512 ; A_SR augmente pourchaquegrantordinaireadmis,Cpasavantwrite.
- SupervisorResult DeferredFinal : poolterminal PRÉPAYÉ512 seulement dans2a,
  pas d'extensionterminale nonspécifiée. Peutêtre staged,mais pascommittéen2a.
- FixtureMarkers et DriverEvidence : Ordinary frais seloncap/total seulement.
- DeferredFinal autorisé UNIQUEMENT GuardianEvidence et SupervisorResult.
  Control/Markers/Driver DeferredFinal → InvalidState ; aucunedette/copie/write.
- CapturedStreams : uniquement TryReserveCapture ; GR etReceipt : uniquement
  lesdeuxpermitsinternes. Aucun TryReserve externe surcestroisslots.

Tous pools irréversibles,octetsinutilisésbrûlés,A_s jamaisdiminué,C_s réel <=A_s,
capsslot/total/grants/3cellulesexternes+1interne inchangés. Un plafond ne garantit
pas de remplir un fichier(DUAL76–78) : pas d'oracleQAexigeant créditsnouveaux
parcequ'unepoolparticulière est épuisée. AutresauxiliairesGE/GR/receipt non
spécifiés restent futursscopehôte,pas accordés par argument générique d'enum.

## Positifs/négatifs QA requis souscette matrice

Maintenir les négatifsHostComplete existants,reconstruitController/nullSignals
et incidents,nepas lesdésactiver. Control/GEordinaryconsommerpoolexact puis
refus1byte séparément,SRordinaryfresh protège512 etSRdeferredtesteprépayé.
GEdeferreddoit augmenterA sans diminuer créditGEordinary encore disponible.
Scénario3externes+1interne : trois DeferredFinal VALIDES GE/SR,pasFixtureMarkers,
stagedsanswrite,EOF2 puisGR/readback/receipt atteignables ; Deferredrestent
outstanding/noncommittables,WaitingACKseulement. Tester aussi catégoriesrefusées,
range/cell/grantlimit sansconfondreguardprécédent. Conserver la force desassertions.

SourceR1 etQA_R1 gels/rapportCORRIGE restentintacts. CorrectionsR2 en siblings
possédés distincts,APIparentcommune transmiseauxdeuxownerssansimplétrangère.
NouvelleV/gatesparent encoreexigées ; aucun compiler/run/native/full44/125s/Linux.
