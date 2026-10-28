# Transcription parent du verdict final de v3-host-review-r1 — 2026-10-17

Message public intégral dans le DB team (5 partiels + final). Extraction fidèle
de la partie finale ; c'est le CONTRAT de la correction — ni amplifié ni réinterprété.

VERDICT FINAL : CORRIGE. Portée source seule. Ni compile, ni test, ni
qualification 000c, ni PASS hôte. Noyau non édité. Re-hash fin 18/18 (279040,
manifeste 378432b8…). Gels GuardianCore 7d4d2c66 / ABI1 bb4758cc /
BudgetedEvidence 0944a3bb / KernelObserver a419fc42.

Ancres (intégrales) :
1. Défaut : HostLauncher.cs:231-243 écrit le record, appelle
   TryReadBackGuardianResult(readback), puis WriteSupervisorReceipt et
   Acknowledge sur ce readback. WriterLedger.cs:78-91 n'a que des Write*/Snapshot.
   Aucun autre livrable ne définit la méthode. Le readback durable exigé par le
   PLAN et par Matches :407-413 n'est pas implémenté ; HostLauncher.cs ne
   compile pas.
2. Ledger conforme : WriterLedger.cs:50-57 owners GuardianEvidence/GuardianResult,
   CapturedStreams, SupervisorResult/SupervisorReceipt ; :19-20 réserve 18432/192
   via les const que HostComplete :303-304 et :312-316 comparent. Écritures
   seulement TryWrite :71-76 → BudgetedEvidence.cs:113-116, débit :272 avant
   Write :283.
3. Capture conforme : CaptureWiring.cs:79-89 attempts++ et reservedCumulative
   avant Read(≤min(4096,remaining)) ; UTF8 brut :98 ; épuisement sans EOF :81-84
   + Mark EvidenceIncomplete :67-70. Cap 114688 = HostCaptureReservation :18 =
   const gelée :126.
4. Tests lus, non exécutés : Host.Tests.cs:417 (48, listBytes 8, total 1,
   active/assigned/inList 0) est le cas Quiescent d'EvaluatePair :348-349.
   :172-181 exige ReservedCumulative>Charged sans dépasser le plafond, cohérent
   avec remaining basé sur charged. RunAll :19-38, Check :14, pas de Main. Les
   Launch() qui scellent dépendent du défaut 1 ; le crash avant Run :244-252 ne
   l'appelle pas.
5. G-loss : HostLauncher.cs:213-219, :237-238, :245-247 → GuardianLostBeforeProof,
   ReservationHeld true, PublicationSealed false. Seul :249-252 (Phase==Sealed)
   scelle. Pas d'état PASS. Réservation jamais relâchée :128-130.
6. HostAuthority :16-23 passe les const AbiPin/ContractPin gelées :221-222. Cinq
   handles :174-176 Kind ordinal n, ordinal n+1, supervisor=transfers[0] exigé
   par HostComplete :305. Signaux créés à 0 :157 ; pump après Run donc
   HostComplete :317 voit 0.
7. C#5 sur les quatre .cs : pas d'interpolation, pas de ?., pas d'async.
   IGuardBorrowSource non réimplémenté.

Pourquoi pas BLOCK : le découpage, les owners, la capture, les fakes et la
matrice G-loss suivent le PLAN. Un seul seam manque, local au ledger, plus trois
phrases de DESIGN.
Pourquoi pas ACCEPTABLE : sans readback il n'y a pas de receipt durable distinct
des octets source, et le sous-gate ACK de DESIGN.md:155 est faux.

PLUS PETIT TRAVAIL SUIVANT : un auteur frais, delta seul, noyau gelé intouché.
(a) WriterLedger.TryReadBackGuardianResult relit EXACTEMENT 192 octets depuis la
destination du slot GuardianResult déjà écrite, échoue si court ou illisible, ne
recopie pas le buffer source.
(b) DESIGN : ajouter HeldCaptureIncomplete ; retirer « prouvé » tant que le
readback n'est pas là ; « signalled to G » devient latch post-Run observé par S.
Puis review fraîche du delta. Pas de compileGO dans ce verdict.

Limites inchangées : multi-process NOT_PROVEN, case6 last-close NOT_ESTABLISHED,
case8 non qualifié, budget intégré NOT_PROVEN, lease fichier NOT_PROVEN.
Partiels 1–4 déjà envoyés ; le partiel 1 est amendé par le défaut 1.

DETAILS DESIGN (du partiel 5/5) : publié et exact — co-located conforme
(DESIGN.md:28-34, Matches gelé :409, DESIGN G:150-157), multi-process NOT_PROVEN
(:36-39), case6 NOT_ESTABLISHED (:22), case8 et budget intégré non qualifiés
(:23-24), FixtureMarkers et ledger cross-process NOT_PROVEN (:135-137), lease
durable NOT_PROVEN (:158), matrice G-loss never PASS (:115-116), réservation
toujours tenue (:108-110), caps et sinks-only (:129-134), reserve-before-Read et
remaining=charged (:141-144). Trous : la matrice :112-121 omet
HeldCaptureIncomplete, état réel HostLauncher.cs:105 et :226. Les lignes :90-96
et :155-156 déclarent le readback durable 192B et le chemin ACK « prouvés »
alors que la méthode n'existe pas. :146 dit EvidenceIncomplete « signalled to G »
; le Mark est après Run (HostLauncher.cs:225) et Acknowledge gelé :969 ne relit
pas les flags. :117 attribue à ControllerLost un KernelQuiescenceObserved
conservé ; avant quiescence le flag reste faux (Hold ControllerLost + pas de
WritePublication).
