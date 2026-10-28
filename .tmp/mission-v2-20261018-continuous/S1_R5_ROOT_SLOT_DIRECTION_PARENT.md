# Décision parent : grants root explicites (option A), pas Cunit<=chaque Cf

Clarification result_mvfindeh_00b3_ttnblu confirméeparent auxlois DRAIN608–650
etadmissionUnitBudget479–500. La règleproposéeCunit<=chaqueCfROOT n'estPASretenue.
Lehelpermax resteinchangé. ExempleCf100/200,S80⇒Cunit200,N6,T1200 ; lesvaleurs
Cf100/200 seules neprouventni autorisation200sur6slots ni plafondindividuel100.

## Direction normative ratifiée, schéma exact encore à proposer

1. OptionA : bootstrapacquisitionEXPLICITEindépendante parslot
   (rootAccountId,functionIdentity,role,pass=1). Donnéesdegrant root immuables :
   bodyCapUtf8Bytes etreservedDebitUtf8Bytes =CrootAcquired pourchaqueslot,
   entier sûrpositif, provenance vers planning/bootstrapacquisition retenue.
   Le calculmax L5 n'estJAMAISl'acquisition. Ne pas fabriquer l'acquisition depuis
   Cfni une shapeJSONvalide. S1 purementcohérencededonnées ; auth/bootstrapledger/
   historique/transactionCAS restentpréconditionsS2, pas implémentésparceplan.
2. rootAccountId exactD5b=D('l8-budget-root-v1',{missionId,lineageId,rootAllocationRef}),
   pas nouveaucompteàchaqueepoch/unité. Rootallocation+slotgrantdocumentbytes
   fournisindépendamment/rootidentitycommune, claimeddescendantbyteidentique.
3. Àtoutegénération, courant Cunit etS/C/N/TL5 sontcalculésparhelperactuel.
   Pourchaqueslotréclamé : bodycourant<=Cunitcourant ET Cunitcourant<=CrootAcquired.
   AcquiredrootDebit immuableparslot, pasCunitcourantinférieur,resteàréserver/
   compter surroot. AinsiunrepackingCunit100necréePAScréditdepuisgrantroot200.
   LescomptesL5courants etrootrestant restentdeuxdimensionsvérifiéesséparément.
4. PrécisionD5b : dansl'entitlementroot, sonC/reservedDebit estCrootAcquired.
   Cunitcourant (s'il diffère) appartientaubudgetL5courant etdoitêtredistinctement
   conservéparprovenance, pas réécritureduCroot/SPENTterminal. Nouveauslotinconnu,
   historiqueincomplet,null =>UNKNOWN/HOLDinspectable,pas sélectionauthentifiée.
5. Rootdebitunique/slotpass1, SPENT/BURNEDterminal/encumberednonavailable,
   no refund/reset/reassign pargenerationoueffetconnaissance, comptesresources
   etconcurrencepasadditionnéscommebudgetd'octets. Retriesmêmebody/IDslot,
   maxAttempts/délais initiauxinchangés. TouspointsDRAINrestentopposables.

## Deux directions complémentaires ratifiées pour schéma public à raffiner

- labels↔ModelRef : rootmodelBindingsferméexplicite/unique, indépendant etimmuable,
  pasparsingdechaîneprovider/model#variant improvisé. Nulllegacyinspectablepas
  exécutable. Lesrefsmodel restentDATA, pasinjectionGOouauthentificationprovider.
- knowledgeprovenance : recordsupstreamexistantswhole-unit/results/pending-readback/
  publicationfacts/parentattestation nécessaires auxjoins deR2, BoundDocumentfermés
  ou résolutionexplicite deleursvraisrecordsreténus. Pasbackendevents/handles/
  authoritycallback/booleanauth,true ni payloadlibre. RAWhash/canonicalfingerprint/
  sourcebindingdigest/commitId etrootHashledgerDigest opaques distincts.

Cesdirections n'acceptentPASsourceS1/QA/schema : fournir TYPESFERMÉSchamp-à-champ,
relationsT0/commongrantrefs/nullinspectmode/pass1/dups/missing/excess+sourcepolicy
ByteRefs et limites réelles upstream, négatifspluspositifs. PassourceGOoubackend
migration. Parentfinalisera commoncontractaprèsqualificationdesdépendances.
