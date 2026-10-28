# QA transport — correction de typage des matchers, pas des oracles

GateQAfinal initial ROUGE au typecheck:11TS2769 surtoEqual,0testexécuté.
Les fixtures mutables infèrent schemaVersion:number/explicit:boolean,contre
typeslittérauxreadonly du transport.Bunexpect.toEqual estcontraintparletype
du sujet;ilnes'agitpasd'une différence runtime démontrée.

Parent change EXACTEMENT11appels `expect(value).toEqual(expected)` en
`expect<unknown>(value).toEqual(expected)` :comparaisonsstructurellesJSON,
sanscasterleproduitversun typeA/Bni changeraucunevaleur/condition/fixture.
Tousoracles,28déclarations/imports/helpers/R5 identiques. Typegenericerased;
comparaisonparent TypeScript5.9.3 targetES2023/moduleESNext produitJSBYTE-EXACT
avant/après (39359B/SHA84834a008ce62952b25de1633d2122435a6f043bfe49cd119f46240fc45010ed).
Insertionstotales99B:37516/caa3192f→37615/08d43c6f97763bff4d55c179494619468d57deee323318de05e4d615e965724b.

Fichiertestmain corrigéparpatch,ancienR5lotetgate/receipt/snapshotrouges intacts.
Vfresh ciblésyntaxe/erasure prévuavantréessai explicite sousNOUVEAUgate;
pasd'exécutioninférée,aucunPASSouwaiver. Code decoder/schemasinchangés.

Report_mode final_response pourceworkerreadonly:ACKfinalnatif puisGOparent,
verdictnatif candidatacceptéexplicitementparleadseulement;pasdeteam_message/
claim/completeworker. C'est unparamètreretourtypedunêmemissionEnsemble,
modèles/grille/permissions/harness/classification/globalconfig inchangés.
