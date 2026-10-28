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
