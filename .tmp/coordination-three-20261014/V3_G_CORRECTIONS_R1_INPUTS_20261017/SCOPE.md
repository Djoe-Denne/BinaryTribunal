# Corrections G — GuardianCore.Tests.cs + DESIGN.md seulement, auteur fresh

Fresh auteur, disjoint de v3-guardian-core-r1, v3-kernel-observer-r1 et
v3-composed-review-r1. Objet : TROIS fichiers livrés dans le répertoire output
assigné — GuardianCore.Tests.cs corrigé, DESIGN.md corrigé (celui de GuardianCore),
MANIFEST.json. GuardianCore.cs lui-même est gelé et INTOUCHÉ : les tests doivent
passer contre le code existant tel quel. KernelObserver*, ABI1, BudgetedEvidence*
gelés intouchés. Pas de compile, pas de test exécuté, pas de Bun.test, pas de run ;
le parent compile plus tard via la gate 000c sur les octets corrigés.

Corrections requises (verdict review composée ACCEPTABLE_SOURCE_SCOPED, admis
parent, commit 95b2825) :

- C1 — tests falsifiants pour les quatre branches de rejet de EvaluatePair
  (GuardianCore.cs:329-334) : admissionSealed=false ; witness.Sequence>=permit.Sequence ;
  witness.Elapsed>permit.Elapsed ; permit.Elapsed>elapsed. Chaque cas doit montrer
  le rejet (HOLD permanent, paire jamais retentée, GuardianCore.cs:802-803, 830-831)
  et falsifier la branche correspondante. Style des tests existants (fixtures
  witness/permit des lignes 98-129) à réutiliser.
- C2 — remplacer la tautologie littérale GuardianCore.Tests.cs:275
  (Check(96*192==18432 && 18432<24576 && 192<=8192)) par des assertions LIÉES aux
  const : GuardianMemoryEvidence.CapacityBytes (GuardianCore.cs:355) ≤
  CaseBudgetV3.GuardianEvidenceCapacityBytes (BudgetedEvidence.cs:127) et RecordBytes
  (GuardianCore.cs:382) ≤ GuardianResultCapacityBytes (BudgetedEvidence.cs:129).
  La sous-capacité doit être liée au code (HostComplete 303-304 compare aux const de G).
- C3 — AUTORISÉ par le parent : test du coin fail-closed non couvert — Assign=TRUE
  puis IsProcessInJob member=FALSE (GuardianCore.cs:700) : T jamais repris, hors de J,
  non visé par TerminateJobObject ni TerminateProcess → attentes cleanup épuisées →
  HoldQuarantined, J tenu, T suspendu survit, AUCUNE fausse libération. Comportement
  attendu = tel quel (politique DESIGN.md:94-97), le test le fige.
- C4 — DESIGN.md : énoncer les droits créateur tenus sur les handles de création J/T
  (draft2 correction #4 — publication typed handles/rights ; les droits S/D
  SYNCHRONIZE sont déjà à DESIGN.md:46).

Style : C#5 strict comme les sources existantes (pas d'interpolation, pas de ?.),
même conventions de fixtures/pins. Aucun renommage, aucune édition opportuniste
hors des quatre corrections. MANIFEST.json liste les 3 livrables avec tailles/SHA.

Bootstrap NONBLIND déclaré. Phase 1 : ACK pins (tailles/SHA de chaque input pinné)
puis HOLD. Phase 2 sur GO distinct : écrire les 3 fichiers dans l'output assigné
seulement, rapport public team_message au lead (pins livrés, corrections réalisées
une par une avec refs), puis HOLD pour review ciblée. Interdits : compile/test run/
native/Job/Process/DB/git/IDB/écriture hors output/board-write/délégation/changement
de modèle/autre OWN/édition des sources gelées.
