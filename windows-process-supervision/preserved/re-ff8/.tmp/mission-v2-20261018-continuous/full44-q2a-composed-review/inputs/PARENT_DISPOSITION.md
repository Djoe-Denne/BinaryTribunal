# Parent — préflight Q2 accepté scoped, source suivante en deux sous-tranches

Rapport result_mvez2mlv_000w_10rc0r/session ses_eacd53e9affe0TCf315jqx7Z6m
accepté READONLY après21pins330327B rehashés. Ancrages parent confrontés aux
BudgetedEvidence119–297,WriterLedger114–140,HostLauncher216–249,
GuardianCore872–975 et DUAL_STREAM_BUDGET81–91. Ce n'est pas une review de codeQ2.

Décisions :
1. Source2a broker/permits/framing/readback local en premier ; source2b coordinateur
   des deux lecteurs après API2a figée. Pas nouveau host/RunAsync/mailbox native.
2. Un CaseBudgetV3 pour huit slots, pas WriterLedger+secondbudget. Owners/références
   exacts/identity/epoch préservés. Le sibling fera son propre readback du VRAI
   streamGR fourni, idle/exclusif ; jamais copiepublication promue en readback.
3. GTC1 header16/maxframe4096 restent inchangés. Une lecture réserve4096 couvrant
   deuxheaders, donc payloadRead<=4064 ; résultatpositif+EOF peut produire DATA
   puisEOF. Erreur sans comptefiable produit seulement terminalerreur borné,
   pas bytes partiels devinés, pas d'Exception.Message/ToString. Pas probegratuit.
4. Les gaps handles/provenance/cancellation/join et G-ownerACKthread sont réels,
   conservés pour slicehôte ; aucune implémentation native/callbackHOST accordée.
   Exposer des états/ports testables n'est pas une preuveHOST/quiescence/durabilité.
5. Source2a ne ferme/détruit/delete/release ni stream ni authority ni reservation ;
   FINALIZING→CLOSED signifie seulement fin locale du protocole, pas releaseCDB-1.
   Étatincertain/readbloqué/commitnonrevenu demeureHOLD ; aucun finallyautorise succès.

Tous caps/budgetsQ1 inchangés : total262144,capture114688,control32768,
5/20/30/55. Pré-réserves SR512/GR192/receipt192 et GE18432, débits irréversibles
avant effets, tokensopaques single-use/ownerepoch/instance, zéro remboursement.
Les garanties de ressources/exclusivité doivent venir du code proprement borné,
pas d'un booléen fourni par l'appelant. Exclusion relative aux appels CLR/Stream
normaux : source broker peut adapter des Streams injectés, PAS ouvrir des paths.

Prochaine admission auteur fresh : ACK/plan API exacte+importclosure/états/limites
d'abord, pas GOsource implicite. Trois artefactsproposésseulement
GenericEvidenceBroker.cs,DESIGN.md,MANIFEST.json. La source2b future reste dépendante.
QAindépendante puis freshV et gatesparent après code ; ni full44/native ni autre
profil125s/DBcache/Linux ni hostqualification autorisés par cette disposition.
