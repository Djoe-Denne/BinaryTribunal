# Disposition parent full44 T — R1 lifecycle et R2 CDB-1

Vfresh task_mvdtsb5c_0088_h9hxny CORRIGE. Ancienlot4docs immuable. Correction
parent mécanique bornée avant toute ratification;aucuncode/budgettemps modifié.

R1:fin des pumps/producteurs ORDINAIRES != fermeture du broker. Après EOFdeuxflux
etcommitsordinaires,brokeridleexclusif sous FINALIZING garde le monopole8slots.
Ordre:GuardianResultwrite→barrièreidleexclusive→readbackdepuisdestinationréelle
→SupervisorReceiptwrite viaMÊMEbroker→ACKunique surGownerthread→éventuels
derniersrecordsterminaux déjàdéclarés/pré-réservés→fermeturefinale CLOSED.
AucunwriteaprèsCLOSED,niréanimation/2ewriter/sink/crédit. Écrituresdefinalisation
bornées autoriséesuniquementdanscettephase;lectureexclusiveniwriteenconcurrence.
SiACK/terminalIO/join échouent:reservationHOLD,pasfaussecasnormal. C11vérifie
l'ordre,readbackvrai,receiptvrai etrefustoutwriteaprèsCLOSED. Gstop reste
indépendantdebroker/read/sink bloqué;aucuneattentedelogsurcheminstop.

R2:séparerlesdeuxautorisations CDB-1 existantes,sansnouvelleperte/waiver:
- hooks/finally desSEULESfixtures synthétiques etroots E01–E09 déjàlistés
  peuvent effacerleursnouveauxartefacts mêmeaprèsassertionFAIL;
- COLLECTEparent normale seulement aprèsrootexit0 ETJob0 etinventaire/receipts
  completsdeCErun;nonzero/crash/timeout/incomplet resteHOLD,pascleanup/scan
  globalparent. Cela n'abroge PASlesfinally antérieurementautorisés.
Raws stdoutstderr/errors/pins/OWNER/wrapperlogs/registry/receipts/caches et
durablesR18/R19/R21/préexistants restenthorsrootsephémères/retenus.

Autrescaps/garanties/inconnus inchangés:Q1 5/20/30/55,262144/114688,
125spropositionNONratifiée,DBcachestiersHOLDavantfull44,normalexitcollecte,
lastclose/crossprocessbudgetnonprouvés. Nouveau4docs dans outputsdelta,
Vdeltafresh avantratification PARTIELLE éventuellesourcepureQ1. Pasrun/code
central/Job/DLL/IOCP/DB/git oumutationdetâchehistorique.
