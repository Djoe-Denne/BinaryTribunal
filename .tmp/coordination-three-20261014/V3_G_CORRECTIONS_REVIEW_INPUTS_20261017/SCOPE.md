# Review ciblée des corrections G — Tests + DESIGN corrigés vs verdict et source gelée

Fresh reviewer indépendant, disjoint de v3-g-corrections-r1 (auteur), de
v3-composed-review-r1 et des auteurs originaux. NONBLIND déclaré. Objet : les 3
livrables corrigés gelés de V3_G_CORRECTIONS_R1_OUTPUT_20261017 (GuardianCore.Tests.cs
aefc941e/38487B, DESIGN.md cd2827d9/19089B, MANIFEST.json d817b770/4193B) contre
les exigences C1-C4 du verdict composé (extrait parent-curaté pinné) et la source
gelée GuardianCore.cs 7d4d2c66.

Vérifier (minimum) :

- C1 — les quatre tests falsifiants correspondent bien aux quatre branches de
  rejet EvaluatePair (GuardianCore.cs:329-334) : admissionSealed=false →
  Rejected+InvalidBorrow ; witness.Sequence>=permit.Sequence → Rejected+
  IncoherentObservation (>= à :333) ; witness.Elapsed>permit.Elapsed → Rejected
  (> strict à :333) ; permit.Elapsed>elapsed → Rejected (> strict à :334). Chaque
  test doit avoir un contrôle quiescent à un seul écart (cas valide → Quiescent)
  et le latch commun (paire rejetée = HOLD permanent jamais retenté, :802-803,
  :830-831 — vérifier le test du latch et son exactitude sémantique contre la
  source gelée).
- C2 — la tautologie :275 est absente du fichier corrigé (vérifié parent au
  grep) ; les nouvelles assertions sont liées aux CONST réelles :
  GuardianMemoryEvidence.CapacityBytes (GuardianCore.cs:355) ≤
  CaseBudgetV3.GuardianEvidenceCapacityBytes (BudgetedEvidence.cs:127) et
  GuardianTerminalPublication.RecordBytes (GuardianCore.cs:382) ≤
  GuardianResultCapacityBytes (BudgetedEvidence.cs:129) ; HostComplete compare
  aux const de G (:303-304) — l'assertion doit refléter CETTE sémantique.
- C3 — le test du coin fail-closed (Assign=TRUE puis IsProcessInJob member=FALSE)
  doit figer le comportement GELÉ tel quel : Hold MembershipFailed avant Resume,
  resumeAttempted=false/ResumeCalls==0, RootStops==0 (TerminateProcess seulement
  si !assigned, :735), JobStops==1 sur J vivant (:727-731, ne vise pas T hors J),
  Setup false, pas de boucle normale, CleanupRootWaits==MaxCleanupRootWaitAttempts,
  paires 0, Phase Quarantined/Outcome HoldQuarantined, JobRetained, CloseCounts
  10/11/12 à zéro, pas de quiescence, publication null, AUCUNE fausse libération.
  Vérifier chaque compte contre la source gelée ligne par ligne.
- C4 — DESIGN.md : les droits créateur J/T sont énoncés (JOB_OBJECT_ALL_ACCESS
  pour le handle créateur de J ; PROCESS_ALL_ACCESS et THREAD_ALL_ACCESS pour T ;
  accès créateur implicite d'un SD NULL incluant SYNCHRONIZE ; non dupliqués ni
  rétrécis ; T non héritables) SANS qu'aucun autre paragraphe DESIGN n'ait changé
  (différer contre l'original gelé 1d557952).
- Intégrité : GuardianCore.cs/KernelObserver*/ABI1/budget intouchés (re-hash) ;
  originaux Tests 529a5d8f/DESIGN 1d557952 intacts ; C#5 strict maintenu (pas
  d'interpolation, pas de ?.) ; conventions fixtures/Check/Pair conservées ;
  flags de seam par défaut inchangés (ProcessIsJobMember=true,
  ZeroAfterRejectedPair=false, SuspendedRootStaysPending=false) ; MANIFEST.json
  pins corrects et MANIFEST exclu de ses propres pins.
- Cohérence sémantique : chaque nouveau test doit PASSER contre la source gelée
  telle quelle (raisonner les chemins d'exécution, sans exécuter) ; signaler tout
  test qui échouerait à la compilation C#5 ou contredirait la source gelée.

Verdict : ACCEPTABLE_SOURCE_SCOPED | CORRIGE | BLOCK, 3–8 ancrages
source:ligne, contraires précis, limites, plus petit travail suivant. Rapport
PUBLIC via team_message au lead seulement ; aucun fichier produit ; aucune
écriture. Bootstrap NONBLIND déclaré. Interdits : compile/transpile/test
exécuté/Bun.test/run natif/Job/Process/DB/git/IDB/board-write/indexquery/
délégation/changement de modèle/autre OWN. Re-hash de tout au début et à la fin.

Cette review n'est ni la qualification ni le GO compile : après acceptation, le
parent fait un SEUL GO compile 000c sur les octets corrigés (tests compilés non
exécutés). Modèle du reviewer : cursor/grok-4.7 Grok 4.7 Extra High, spawn fresh,
Model.Ref vérifié.
