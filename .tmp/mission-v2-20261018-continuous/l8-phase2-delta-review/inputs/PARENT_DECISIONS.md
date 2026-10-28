# Décisions parent R1/R2 — correction du contrat phase2, pas code

Vfresh task_mvdtdyd3_007p_mnof17 CORRIGE,31/31pins947556B exacts. Ancienlot4docs
reste immuable. R1/R2 sont contractuels avant implémentation,aucunFAILruntime.
Les autres propriétés substantielles sont retenues source-scoped seulement.

## R1 — origine immuable, attentes T0/T1/T2 et décision finale séparées

1. Enveloppe d'origine et generationId demeurent immuables. Lesobservations de
   préparationT0 sont datées,non desattentesCASréutilisablesàtouteslesphases.
   Séparer le binding scientifique/knowledge/planning figé desobservations
   volatiles head/inventory/ledger/fence. Ne jamaismettre àjourle body d'origine
   pour recopierdesrévisions après T1 ou une nouvelle tentative.
2. T1 entre en PENDING_DRAIN parCAS avec attentesT0exactes et journalise lecut
   des familles engagées. Ce record possède sonattente/révision T1;lebarrièreroot
   continue de bloquer TOUTE nouvellefamille. A/Bengagés→R/pub/readback/release
   originaux font légitimementévoluer inventory/attempts/claims/knowledge/budget.
3. Aprèsdrain réelcomplet,créer un ActivationAttempt immuable append-only,
   IDENTITÉdistincte de l'enveloppe/generationId. Il référence EXACTEMENTle
   candidat,lebarrièreroot/T1cut,head/fence et révisions/digests COURANTS de
   knowledge/inventory/ledger/proofs/authority. T2 recompare atomiquement ces
   attentescourantes surmêmeconnexion avant activation. Aucun callback/await
   danstransaction. Staleattemptrefusé,jamaisréparé/rejouéavecanciensproofs;
   nouvelle tentative explicitement journalisée,capacités/retriesbornés.
4. Le transport d'adoption de l'origine est soitnull,soit INTENTPRÉ-DRAIN
   NONAUTORISANT (nom/champ explicite). Les inventory/proofs qu'ilcontient sont
   une déclarationhistorique,paslaquiescenceopposable. Le doc adoption FINALB
   requis est bounddans ActivationAttempt après R/claims/proofs finalisés,
   puis résolu HOST-only/L6trusted et revalidé àT2. fromRevision/toRevision
   restent desrévisionsdeconnaissance/transition selon leurscontrats upstream,
   jamais un alias implicite deheadCAS;décrire le mapping exact auxpreuves.
5. Si les SOURCESSCIENTIFIQUES/knowledge/planning/bytes/approvals contenus dans
   le candidat ne correspondentplus àl'état final aprèspub,un simpleattempt ne
   suffitpas. Nouveau candidat préparéexplicitement avec sourcescomplètes
   actuelles/nouveauxdigests/propositionvalide;CASReplaceCandidate SOUSla
   MÊMEbarrière PENDING_DRAIN continue. Journaliser old/newcandidate refs,
   jamaisréécrireoldorigin et jamaistransiterpar RUNNING/autoriseruneadmission
   entrelesdeux. Seule cette préparation explicite peut recluster/replan;
   load/replay/retry d'unmêmecandidat gardent zérorecompute. Définirguardcases.
6. Oracles Q1/Q2:headh→h+1 àT1,Rcréé ensuite,ledger/knowledge/inventory évoluent;
   finalisationcourante possibleaprèspreuvescomplètes,rejetstalesource/proof,
   remplacementcandidat conservantlabarrière,originbytes/IDs intactsetrestart
   depuischaquephase. Pas de succès par simplecopiedeversion.

## R2 — autorisations A et B discriminées, pas fausse evidence B

1. Nouvelles variantes explicites: bootstrap-a-fixture-v1,
   transition-a-fixture-v1 et proposal-b-host-fixture-v1. Elles sont des
   sélecteursJSONNONautorisants;lescapabilitiestrusted restent hors JSON.
2. BootstrapA:OWNv3 réellement NEUF/VIDE et source fixture complètevalidée,
   partitionAstructural/fullsource/group/planning vrais et identitéliée. Port
   d'autorisationbootstrapfixture trusted distinct,aucune callerboolean ni
   hostReceiptRef autoauthentifié. lineageRef et adoptionIntent/final sontNULL
   parcontrat quand inexistants,pas unsidecarBfabriqué. AucuneplanAdoptionB.
3. TransitionA→A:autorisationSTRUCTURELLEfixturedistincte etsourcesA valides,
   plusMÊMEdrain/completinventaire/Qtrusted/T2CAS/fencing/rootbudgetcommuns;
   pasd'exceptionquiescenceouexpiration=Q. Capabilityfixture en backendS2
   privé,boundàlapréimage/candidat/fence/caserevision et vérifiéeau pointCAS,
   jamais une simplefonctionécho ouunjsonselfhash. Pasappelau gateB.
4. B(freshrootB ouA→B/B→B):evidenceBadmissible+lineageexact+HOST-only/Sources+
   L6finales dansActivationAttempt obligatoires;localReceipt absente/refusée.
   Même sur rootBfresh,caractèrevide/OWN/fence/inventaire doiventêtreprouvés,
   pas présumés. A injected au gateB,fauxbootstrap surOWNnonvide ou handleforgé
   sontrefusés. Ne pas affaiblirles invariantslineageBexistants.
5. MVPscopé:bootstrapA/B,A→A,A→B,B→B. B→A est explicitementhorsMVP/refusé,
   pas supportimplicitementannoncé. Native/publicactivation resteFERMÉE pour
   toutescesvariants fauteportsautoritatifsréelsqualifiés. FakeHOST/fixtures
   n'établissent pasnative. LespositifsQ1/Q2suiventce périmètreexact.

## Livrable de correction

Nouveau4docs dansoutputsdelta seulement,aucunancienlotmodifié. Corriger R1/R2
champ-par-champ dans E/D/Q,mettreàjourmanifestprovenance/hashs/statutPROPOSED.
Pasrerédactiongratuitedesautrespropriétés;tableconceptuelleT0/T1/T2,records/
transitions/opérations/guards suffisammentprécis pourS1–S4. Vdeltafresh puis
ratificationparent avantcode;pas besoinGOuserderoutine,aucuncapbudgetrelevé.
