# Correction runtime budget — diagnostic ownership-write, source seulement

Fresh auteur, disjoint de v3-budget-source-r1, des reviewers budget/composé, des
autres auteurs V3. NONBLIND déclaré. Objet : la PREMIÈRE exécution ever du module
budget (test mémoire parent LEAD ONLY 002r, reçu v3-budget-memory-execution-
receipt-20261017.json) a ÉCHOUÉ : RunAll interrompu à l'invocation 11/20
(CallerRetainsStreamOwnership, BudgetedEvidence.Tests.cs:289) —
Check(sink.TryWrite(new byte[] { 4, 5 }, 0, 2), "ownership-write") a levé
InvalidOperationException après 9ms, APRÈS que les invocations 1..10 du même run
aient passé (environnement donc favorable ; le 10e case
InactiveZeroByteCallsDoNotInvokeStream avait un sink ControlFiles neuf qui
répondait). Aucune exécution n'était permise aux reviews statiques — ce finding
est neuf, non couvert par les verdicts antérieurs.

Ta tâche : DIAGNOSTIQUER la cause racine en lisant la source gelée et les tests,
puis CORRIGER. Le module doit-il accepter ce write (2 octets, slot DriverEvidence
neuf, cap 8192) selon le contrat (corrections budget #6-#8 : ledger
catégorie→owner→sinks→sous-caps, débit AVANT tentative, HOLD réentrant/concurrent
collant sans charge, réservation avant Read ≤min(4096,restant)) — ou le TEST
exprime-t-il une attente erronée ? Deux responsabilités possibles ; tranche sur
preuve source:ligne, jamais une moyenne.

Livrables (répertoire output assigné, EXACTEMENT) :
- BudgetedEvidence.cs corrigé si le module est fautif — sinon inchangé (pin
  d'origine re-donné, « corrected: false » dans MANIFEST) ;
- BudgetedEvidence.Tests.cs corrigé si le test est fautif — sinon inchangé ;
- DESIGN.md corrigé SEULEMENT si la sémantique documentée doit changer ;
- MANIFEST.json (pins des livrables, statut corrected true/false par fichier,
  cause racine résumée avec ancrages).

ATTENDUS INVARIANTS : caps slots exacts (8 slots = 262144 : ControlFiles 32768,
FixtureMarkers 57344, CapturedStreams 114688, GuardianEvidence 24576,
DriverEvidence 8192, GuardianResult 8192, SupervisorResult 8192,
SupervisorReceipt 8192) ; chunk ≤4096 ; HOLD collant réentrant/concurrent sans
charge ; débit avant tentative ; réserve capturée AVANT Read ; UTF8 invalide brut
préservé. Toute correction ne doit PAS affaiblir ces garanties — les tests qui
les verifient (invocations 1..10) doivent rester passants TELS QUELS sauf preuve
d'erreur de test documentée.

Style C#5 strict, conventions existantes. PAS de compile, PAS de test exécuté
(le parent recompilera — NOUVEAU compileGO — et ré-exécutera le test mémoire sur
les octets corrigés). Pas de git/IDB/native/Job/Process/écriture hors output/
board-write/délégation/changement de modèle.

Phase 1 : ACK pins (8 inputs) puis HOLD. Phase 2 sur GO distinct : diagnostic
(root cause avec ancrages source:ligne dans le rapport public), corrections,
rapport public team_message (cause racine, corrections par fichier, refs), puis
HOLD pour review ciblée fresh avant recompile/exécution.
