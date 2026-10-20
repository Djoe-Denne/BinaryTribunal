# Parent — oracle ERROR et publication négative sous HOLD

Précision demandée par QAindépendante result_mvf0ry3q_001t_x9sk7e, sans lecture
implémentation auteur. Complément partagé à API_FIXED_R1 immuable f95cd66e ;
aucune modification du layoutGTC1,des caps/timings/DTO ou de l'autorité.

## Codes exacts, pas de nouveau domaine d'enum

Le payloadERROR(kind3) est u32LE de4octets représentant GenericBrokerFailure :
- exception de Read OU du getterAtEof : ReadFailed=9 → 09 00 00 00 ;
- countRead négatif OU supérieur au nombre demandé4064 : InvalidRead=10 → 0A 00 00 00 ;
- countRead0 avec AtEof=false : EofUnestablished=11 → 0B 00 00 00.
Une plage de count invalide est rejetée AVANT de consulterAtEof ; sinonAtEof
est consulté aprèsRead. Si AtEof lance après une lecturepositive, ERROR9 seul,
aucune DATApartielle ni EOF deviné. SiRead lance,on neconsultepasAtEof.
HeaderERROR16 +payload4 =20B,flags0/streamId1ou2/seqsuivantepropreauflux.

## Résultat et état

Pour les trois cas ci-dessus, TryReadReservedCapture retourne FALSE,
State=Hold et Failure=9/10/11(respectivement). HOLD est sticky/premièreerreur
conservée. EOF n'est jamais établi/committed par une ERROR.
Le permit capture déjàadmis4096 prépare une seule commandeERROR20B dans sa
cellule privée déjàpayée. A reste intégralementdébité4096,aucunrefund/grant/
réservation/allocationpayloadnouveaux ; aucun crédit supplémentaire sousHOLD.

TryCommitNext sousHOLD peut sélectionner UNIQUEMENT une telle ERROR négative
déjàprépayée. Si le vrai BudgetedSink accepte son write,la méthode retourne
TRUE et outcommitted est ce permit ; Ccapture augmente20,permitSpent,State
resteHold,Failureinitiale inchangée,EOF=false. TRUE signifie uniquement que
cette commande a étéécrite, JAMAIS succèscapture/activation/quiescence/release.
Une commande ordinairepositive/DATAready ne devient pas committable sousHOLD.
Un secondRead du mêmepermit ne prépare pas une secondeERROR ; aprèscommit le
permitspent ne peut plusécrire. DeuxERROR déjàpayées par deuxReadsoutstanding
avantHOLD peuvent être publiées chacununefois ; aucun nouveauRead/grantautorisé.

Si aucun ERRORprépayé n'estready : TryCommitNext retourneFALSE sansI/O et sans
effacerHOLD. Si le sinkestdéjàheld ou lewriteéchoue : FALSE,outcommitted=null,
pasretrycaché ni refund,éventueldébitC selonvraiCaseBudget conservé. La Failure
broker reste sa premièrecause ; le budgetpeut signalersonpropreHOLD/writefailure.
En règle générale outcommitted n'est nonnull que si TryCommitNext retourneTRUE.

Cette autorisation limitée de journalisationnégative ne permet PAS d'atteindre
FINALIZING/WaitingACK/Closed depuisHOLD, de transformeruneexception enEOF,ni de
proclamer un succèsglobal aprèsHOLD. Pas d'Exception.Message/ToString,ni probe.

GOsource/GOQA précédents restent valides sousce complément. Lesdeuxowners doivent
lire/hash ce fichier et ajouter son pin auMANIFEST final, puis poursuivre sans
autreGOde routine. Si une contradictionstructurante réelle apparaît→parent avant
invention. Aucun compiler/test/run/validator/importproduit/OS/native/full44.
