# Review ciblée source hôte — 5 sources vs PLAN approuvé et noyau gelé

Fresh reviewer indépendant, disjoint de v3-host-source-r1 et de tous les auteurs/
reviewers V3. NONBLIND déclaré. Objet : les 5 sources livrées par l'auteur hôte
(HostLauncher.cs 15729B, WriterLedger.cs 5411B, CaptureWiring.cs 6029B,
Host.Tests.cs 29049B, DESIGN.md 11058B) contre le PLAN approuvé (PARENT/
HOST_PLAN.md — transcription parent de son message public, intégration map
source:ligne incluse) et le noyau gelé re-hashé par le parent (GuardianCore.cs
7d4d2c66, ABI1 bb4758cc, BudgetedEvidence.cs 0944a3bb, KernelObserver.cs
a419fc42).

Contexte de provenance (à connaître, pas à re-juger) : l'auteur a subi une panne
provider (cursor capacity_limit) AVANT d'écrire MANIFEST.json et son rapport —
le MANIFEST livré est une complétion mécanique PARENT (reçu host-source-parent-
intake-20261017.json : pins des 5 sources, noyau re-hashé 4/4, C#5 sanity) ; le
PLAN parent-approuvé fait foi comme contrat d'intégration. Tu review les
SOURCES, pas le MANIFEST (bookkeeping parent).

Vérifier (minimum) :

- Chaque seam déclaré dans le PLAN est réellement implémenté dans les sources,
  avec la sémantique annoncée : HostAuthority (Identity, DurableReservation,
  pins hex, AbiPin/ContractPin exacts bb4758cc/bb69e0ad, Mode≤64) ; 5 transferred
  handles (Kind==ordinal, TransferOrdinal==n+1, distincts valides,
  Transfer(0)=ControllerProcess) ; LaunchIntent (DosPath, cmdline≤32766, env,
  pins == Authority) ; HostCaptureReservation (CapacityBytes==114688) ;
  HostGlobalLedgerReservation (8 owners, 8 pins, TargetPin) ;
  HostSupervisorBinding (OriginalController==Transfer(0)) ; HostSignals
  (Read/Mark ; CaptureHeld=1, EvidenceIncomplete=2, AdmissionRevoked=4) ;
  HostBinding (5 transfers) satisfaisant HostComplete (cap :300, 18432/192 ==
  const :354/:382, ownership croisé :312-317 exactement comme le PLAN) ;
  IGuardianProcessHost (cycle de vie objet G) ; ACK : construction
  GuardianSupervisorAcknowledgement avec exactReadback[192], persistence du
  receipt durable AVANT l'appel Acknowledge :961-976 ; décisions S sur
  GuardianRunResult :416-432 ; G-loss → réservation tenue + HOLD jamais PASS ;
  sortie ordonnée vs perte avant preuve.
- WriterLedger : mapping catégorie→owner unique→sink, ownership croisé exact,
  écriture via BudgetedSink.TryWrite seulement (:113-116), caps jamais
  contournés, débit avant tentative.
- CapturePump : réservation AVANT Read ≤min(4096,restant), raw UTF8 byte-exact,
  compteurs #8 cumulatifs, épuisement sans EOF → HOLD/EvidenceIncomplete,
  réservation inutilisée ≠ crédit.
- Host.Tests.cs : chaque test annoncé dans le PLAN présent et COHÉRENT avec le
  noyau gelé (raisonnement de chemins, jamais exécution) ; FakeNative/FakeObserver
  pilotant un VRAI GuardianCore avec le binding hôte réel ; conventions
  Check/RunAll des gels ; aucun entry point ; C#5 strict.
- DESIGN.md : sous-gates résultats/limites publiées (exigence 000c), droits/
  durées de vie, matrice S/D/G-loss côté hôte, limites NOT_PROVEN publiées
  (co-located vs multi-process, lease durable, FixtureMarkers, cross-process
  ledger, case6, case8).
- Intégrité : aucun edit du noyau (pins parent) ; aucun membre du noyau
  réimplémenté côté hôte (IGuardBorrowSource référencé, pas réimplémenté) ;
  cohérence inter-fichiers (les sous-classes référencées existent) ; C#5 partout
  (pas d'interpolation, pas de ?., pas de syntaxe postérieure) ; conventions
  conservées.

Verdict : ACCEPTABLE_SOURCE_SCOPED | CORRIGE | BLOCK, 3–8 ancrages
source:ligne, contraires précis, limites, plus petit travail suivant. Rapport
PUBLIC team_message ; aucun fichier ; re-hash début ET fin. Interdits :
compile/transpile/test exécuté/Bun.test/run natif/Job/Process/DB/git/IDB/
board-write/indexquery/délégation/changement de modèle/autre OWN. Bootstrap
NONBLIND déclaré.

Après acceptation parent : NOUVEAU compileGO assemblage (avec tests corrigés
budget + host tests) puis qualificationGO 000c (gates séparées). Ce verdict n'est
ni le compile ni la qualification. Modèle : cursor/grok-4.7 Grok 4.7 Extra High
(61–80), spawn fresh, Model.Ref vérifié.
