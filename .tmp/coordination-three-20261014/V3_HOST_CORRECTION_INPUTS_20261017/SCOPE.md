# Correction hôte delta — readback durable + DESIGN, auteur fresh

Fresh auteur, disjoint de v3-host-source-r1 et de tous les auteurs/reviewers V3.
NONBLIND déclaré. Objet : CORRIGE final de la review hôte (PARENT/
HOST_REVIEW_VERDICT.md — contrat intégral, ancrages source:ligne). Delta SEUL :
aucune autre édition, noyau gelé intouché (GuardianCore.cs 7d4d2c66, ABI1
bb4758cc, BudgetedEvidence.cs 0944a3bb, KernelObserver.cs a419fc42 — re-hash
parent avant review).

Corrections EXACTES prescrites :

(a) WriterLedger.cs — AJOUTER TryReadBackGuardianResult : la méthode relit
EXACTEMENT 192 octets depuis la destination du slot GuardianResult DÉJÀ écrite
(le stream/récepteur du sink GuardianResult), échoue (false/HOLD raison
explicite) si court ou illisible, et NE RECOPIE PAS le buffer source (le readback
est une relecture de la destination, pas une copie). Signature cohérente avec le
style du fichier ; utilisée telle quelle par HostLauncher.cs:231-243 (record →
TryReadBackGuardianResult(readback) → WriteSupervisorReceipt → Acknowledge).
Aucun autre comportement de WriterLedger ne change ; owners/caps/pins restent
exacts.

(b) DESIGN.md — TROIS corrections, rien d'autre :
1. La matrice d'états :112-121 ajoute HeldCaptureIncomplete (état réel de
   HostLauncher.cs:105 et :226).
2. Les lignes :90-96 et :155-156 cessent de déclarer le readback durable 192B et
   le chemin ACK « prouvés » tant que le readback n'existe pas — reformulés
   comme implémentés-avec-la-correction-(a) ; le sous-gate ACK :155 devient vrai
   seulement avec (a).
3. :146 « signalled to G » devient « latch post-Run observé par S » (le Mark est
   après Run — HostLauncher.cs:225 — et Acknowledge gelé :969 ne relit pas les
   flags). :117 : avant quiescence, ControllerLost laisse
   KernelQuiescenceObserved faux (Hold ControllerLost + pas de WritePublication)
   — corriger l'attribution.

LIVRABLES (répertoire output assigné, EXACTEMENT 4) : WriterLedger.cs corrigé,
DESIGN.md corrigé, Host.Tests.cs re-pin SANS changement sauf si un test existant
doit référencer la nouvelle méthode — alors SEULEMENT l'ajout minimal nécessaire
(justifié ligne par ligne dans le rapport), MANIFEST.json (pins, statuts
corrected par fichier, racine = défaut 1 de la verdict transcription). HostLauncher.cs
et CaptureWiring.cs restent aux pins de l'intake (INCHANGÉS — vérifiés par le
parent au re-hash).

INVARIANTS : noyau gelé intouché ; C#5 strict (pas d'interpolation, pas de ?.,
pas d'async) ; conventions Check/RunAll/FakeNative ; caps 262144/chunk 4096/HOLD
collant/débit avant tentative/réserve avant Read jamais affaiblis ; G-loss →
réservation tenue jamais PASS ; last-close NOT_ESTABLISHED. PAS de compile, PAS
de test exécuté (le parent recompilera l'assemblage complet sur le delta
accepté). Pas de git/IDB/native/Job/Process/DB/écriture hors output/board-write/
délégation/changement de modèle.

PHASES : 1 ACK pins puis HOLD ; 2 sur GO distinct : écrire les livrables +
rapport public (delta par fichier, ancrages), puis HOLD pour review du delta.
Modèle imposé : opencode-go/glm-5.3-flash max (complexité 55 ≤ 60, règle
utilisateur), spawn fresh, Model.Ref vérifié.
