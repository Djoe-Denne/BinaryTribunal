# L5 — allocation acceptée par le parent après review et gates

2026-10-15. Candidat planner985e5ead…c858988/84 699B et nouveau test
8d02cbec…ff3edb/39 066B. **Parent accepte l'intégration de cette correction
d'allocation seulement**, après review indépendante et toutes gates ci-dessous.
Pas acceptation globale de l'autorité des receipts ou de l'intégration L8.

## Revue et vérification du parent

Fresh Sol max `l5-budget-review`, task `task_mv9ntc9a_001m_ahmspg`, session
`ses_ebff13ea5ffeqgqh2NPnl1FL6i`, native relue, completed pour sa review seulement,
fermé normalement. Indépendante **non aveugle**, exposition initiale rectifiée et
continuation conservées ; pas reprise d'un auteur/ancien reviewer ou rerun imposé.

Parent récupère huit rapports explicitement envoyés au lead via API publique,
vérifie474 pins/10 470 218B et4 pins/20 208B additionnels, quatre DB auteur intactes,
trois DB propres reviewer **974 848B** sans WAL/SHM restants. La première sonde L6
avait un authorId/executionId incohérent : son refus est conservé, pas compté comme
succès ni défaut source. Huit contrôles finaux passent après correction de fixture.

Reviewer : typecheck0,143PASS/13 583 assertions ;106 probes mémoire propres
(32 OLD-différentiels,42 closures par reachability indépendante,15 seuils BigInt,
4 accounting/immutabilité,11 contexte/readiness,unknownN/IDs/holders),20 lectures
adversariales,8 gates publics L6,17 qualifications receipts. Nouveau fixture gate :
S3061/C10817/N3/T32451, freeze diagnostic puis freeze valide/reopen exact,
body UTF8 C−1/C PREPARED, C+1 refusé avant événement/outbox ; retry même body sans
nouvel événement, aucun sending/result/publication scientifique.

Parent compare aussi l'AST aux bytes OLD : dix fonctions ajoutées, seules fonctions
existantes modifiées planMission/coherentDocuments. Il lit le calcul C/N/T, l'opt-in
propre, la soustraction avant somme/fermeture et la vérification de contexte/readiness.
receiptSatisfies/conflits/ranking/selectors/granularity restent textuellement inchangés.
Cela complète la review, pas un auto-hash traité comme preuve comportementale.

## Limites opposables

- **OPEN** : receipt niveau2/fixture-only est incohérent selon CONTRAT§4 mais le
  prédicat L5 ancien et nouveau l'accepte, y compris readiness en nouveau mode.
  Pas allocation-régression, pas publication réelle valide. Guard SIM distinct non
  revu par ce reviewer ; prévalidation L8 +vrais proofs/disposition L9/L10 nécessaires.
- compareGranularities est **legacy-only** par son API trois arguments ; policy
  opt-in y échoue fermée faute de contexte indépendant. Ne pas annoncer son support
  nouveau mode ou contourner via suppression du mode. API ratifiée planMission/
  readiness/assertAdmissionBudgetBinding testée séparément.
- Allocation limitée, pas garantie universelle R. L8 doit lier ses vrais inputs,
  mesurer body final et imposer N=1 durable toutes générations/passes/recovery ;
  retry du même body n'est pas nouveau budget. T n'est pas trafic réseau.
- Pas full/QA60/native par le reviewer ; ledger9MB absent de son paquet. L8 strict
  reader/verticale, post-L8 QA, §17 global et L9/L10 restent ouverts.

## Parent main — deux sources transférées, toutes gates franchies

Transfert strict du candidat hashé : planner attendu OLD377 avant remplacement,
nouveau test absent avant ajout, **273 autres fichiers harness byte-exacts**.
Aucune modification L1/L6/L8/config/registre/fixtures ou maintenance de l'utilisateur.
Parent reproduit **typecheck0,143focusedPASS/13 583 assertions,60 QA croisés PASS/
3 149 assertions** et rehash après chaque gate. Aucun simulateur source dans main.

Le message de coordination indiquait idle/completed pour la session L7 mais sa
tâche reste in_progress : parent récupère ses publications explicites, dernière
=STOP avant full, pas livraison finale. Diagnostic natif0running et recherche de
process tests nulle. Il réserve donc le full parent, notifie HOLD full temporaire
au même auteur L7, sans arrêt, nouvelle tâche/session ou modèle. Ne pas attendre
un full L7 prétendument actif sur la seule ambiguïté d'un message de transport.

**Full parent terminé naturellement exit0 :956PASS/1SKIP/0FAIL/77 509 assertions**,
957tests30files,151.889s, borne420s. Child TEMP/TMP frais/opencode, exceptions
préexistantes déclarées. Le compte878baseline+78nouveaux est effectivement observé.
273autres fichiers+2candidats encore byte-exacts après full et avant commit ;
vieux planning complet rejoué dans main **8f5a36ff…8d7c8 byte-exact**.

Parent vérifie22 DB fixtures créées dans ses gates focused/crossQA/full,
**6 643 712B** : chemins/tailles/hashes conformes aux logs, handles fermés,
aucun WAL/SHM restant, artefacts conservés. Les anciens hooks de nettoyage de leurs
propres fixtures restent ceux explicitement autorisés, pas du nettoyage d'evidence.

Les conditions de commit parent sont donc franchies : deux fichiers source/test
seulement, plus notes de décisions associées ; L1/L6/L8/config/registre, anciennes
fixtures/tests et maintenance non committée restent exclus. Pas remote push.
Le simulateur demeure absent du main et doit encore livrer/être revu séparément.
L8 reste gelé jusqu'au transfert explicite du contrat accepté et un plan/GO parent.

Preuves `.tmp/coordination-three-20261014/l5-budget-final-review-parent-verification.json`,
`l5-budget-main-transfer-before.json`, `l5-budget-main-crossed-gates.json`,
`l5-budget-main-full-start.json` puis résultat/log full séparés.
Rapports/source/OLD/gels/worktrees et DB conservés. Aucune autorité native/IDB ou
science/promesse L8 déduite, aucune intégration automatique de L8/L7.
