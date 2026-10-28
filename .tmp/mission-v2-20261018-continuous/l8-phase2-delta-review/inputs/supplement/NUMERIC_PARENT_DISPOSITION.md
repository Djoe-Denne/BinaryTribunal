# L8 transport — correction numérique bornée du validateur partagé

Vfreshsource CORRIGE R1: validateStaticJsonSchema graph.ts:272 imposait safeInteger
aux valeurs finies intégrales même lorsque le schema attend number. Le sidecar
LosslessMetric autorise number fini sans plafond: numerator=denominator=1e20,
value=1 est une donnée transport autorisée;lineage.ts vérifie finitude/quotient,
pas safeInteger pour ces champs. Ce rejet de FORME n'est pas un gate scientifique.

Décision parent: extension exacte d'ownership à UNEcondition dans graph.ts et
nouveau test pur static-json-schema-number.test.ts. Conserver safety sur
integer/integer|null,nonfinite,-0,bornes,whitelist/enum/required/additionalProps.
Si schema autorise number,ne pas ajouter un plafond de safeInteger implicite.
Pasde second validateur,pas changement de schema ou de règles G1/site/span.

Graph.ts préimage2f597ede… du gel est conservée dans packets/guardhistoriques;
le fait8/8hashes L1 au checkpointprécédent reste daté,non réécrit en clean-tree
permanent. Le guard courant doit enregistrer la nouvelle image après correction.
Source transport87547323… reste inchangée;sa doc doit préciser le fix dépendance,
pas revendiquer une absence de surrestriction dans la préimage ancienne.

Vdelta fresh puis parent typecheck/tests numériques+transportQA et contrôles
de nonrégression sous gate séparée. Les107PASSphase1A précédents restent la
preuve d'avantcefix,non une validation rétroactive de sa nouvelle image.
Pas de promotion runtimeB/HOST/Q/C3-C5/globalL8/G7 par cette correction.

## Nouveau lot corrigé : vérifications effectivement faites

Vdeltafresh ACCEPTABLE_DELTA_SOURCE_SCOPED,24/24pins753429B exacts;delta29B
unique démontré,nouvelleimagegraph36515B/SHA2da7c877…. Effet surTOUT typenumber
explicite,pasuniquementL8;missionbudget est déjànumberpositiffini en validation
indépendante,aucune allocationcourante oucap relevée. Integer-only inchangé.

Gateparent séparée :tscmain0/4511ms,zérodiagnostic;4testsnumériques0fail/
22assertions/178ms;2testsL1pairefiltrés0fail/50assertions/337ms. Deuxinvocations
Bun distinctes sursnapshot261exacts,currentmainETsnapshot avant/après. Les
autrestestsstructureétaientskippés parfiltre,pas unevalidationglobale. Aucun
decodertransport/QA28cas exécutésparcettegate;ils attendent leur VsourceQA.
L'anomaliecanonL1resteouvertelargement;seulelarégressionD1D2 est recontrôlée.

Receipt `.tmp/mission-v2-20261018-continuous/l8-numeric-checks-receipt.json`;
raws conservésdansscratch désigné,aucunretry/cleanup/DB/natif/bridge. Pourle
runtypétypecheck,compteurs parsés-1 signifient NONAPPLICABLE(sansfooterBun),
pasdesrésultatsnégatifs de test. Le statutqualifié repose sur exit0/diagnostics,
les2runsBun possèdentleursvrais4/2pass,0fail,22/50assertions.
