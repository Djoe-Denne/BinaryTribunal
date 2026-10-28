# Parent — réconciliation mécanique de pins R4, aucun changement d'algorithme

QA native result_mvf42z17_003u_ttwndb reste PROVISOIRE : son owncodec utilise
encoreR2. Geler ses3artefacts103899B avant touteédition,68inputs/2suppléments
bookend conservés. RuntimeNONOBSERVÉ(155casintendus/45sitestextuels,pasPASS).

Parent constate uneautre incohérence danslesourceS1R3 : UPSTREAM_PINS.proposalCodec
attend29225B/48880953cbd4a3cdb0becf9d360dd964fcbedf30f72b379cdff72665cf3f5bbf,
mais lespacketsSourceR3etQAainsiquela référencequalifiée graph-transport.ts valent
22680B/0b81fc928053f8fd602196bbf25500a53373d85a32dd450fa4bcce5643f6e40a.
Les7autrespinsupstream ontétécomparésetconcordent. Garder l'oracleQA correct,
pas le changer pourmasquercette garde sourceobsolète.

Correctionminuscule entièrementdéterministe,faiteparparentennewsiblings,pas
nouveauworker/replan :
1. SourceR4parent = sourceR3frozen avec SEULEMENT cettepairelength/SHA corrigée.
   Aucuneautrelignecode,type/API/schema ni règleknowledge/policy/relation changée.
   Reversiondece blocrestaureR3byte-exact,4autressources-schemas identiques.
2. QAmetadataR4parent = QAr2provisoiregelée avec SEULEMENTowncodec length/SHA
   remplacés parlesmétadonnées réellesR4(etsoncommentairemetadatamisàjour).
   Aucuntest/helper/fixture/oracle/compteur ni import algorithmique n'esttouché.
   QA logiquetoujoursauthoredindependently,candidatcodejamaisfourni àl'auteurQA.
3. DESIGN/QA_PLAN/MANIFESTparent séparés explicitent ledelta,versionsnatives
   préservées etnonendorséesstandalone. Aucunmodèle/stratégie changé.

Lesnouveauxartefacts sont PROPOSÉS sous réserve Vfortecomposée intégrale
sourceR4+QAmetar4etgatesparent. Aucuncompilateur/run/intégration/main/host/full44.
Cette correctionnepeutpas devenir unepermission de faiblesassertions/skip.
