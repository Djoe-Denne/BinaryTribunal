# Correction parent QA R5 — ne pas supprimer l'oracle

VQA fresh task_mvdt3p4q_007b_9rpwr1 CORRIGE unseulcas(test16,ligne470),27/28
déclarationsstatiquementconformes. Ancienlot3fichiers conservéintact,aucune
exécutiondu28cas encore. Contrat:présenceevidenceA optionnelle maismiroir
root.partition==result.partition requis;flags evidence A restentnonapplicables.

Parent corrige seulementtest16:
- avecrootA etresultBde makeRawNegativeB,formevalide maiscoherent=false est
  l'oracleréelducontrat;conserverl'assertionenlarectifiant,paslasupprimer;
- souscaspositifdansceMÊMEtest:clonerinput,copier EXACTEMENTpartitionA en
  evidence.result.partition,recalculerevidenceFingerprint parhelperexistant
  refreshEvidence;puisformevalide/coherenttrue/A/not-applicable-A/nullflags,
  toujoursauthorityuntrusted/adoptionReadyfalse. Ne pasinterpréterlesdonnées
  internescommeevidenceBadmissiblepourcepositifA.
Tousles27autrestests/imports/helpers/famillesAPI inchangés,28déclarations restent.
DESIGN sectioncorrectifprécis,MANIFESTpayloadhashs/provenancedelta actualisés.
Paspatchdecoder/schema/sourcebackend pourfairepasser,aucunrun/gittest/DB/native.
Vdelta indépendant avantdéploiementtest/compilation/exerciceparent.
