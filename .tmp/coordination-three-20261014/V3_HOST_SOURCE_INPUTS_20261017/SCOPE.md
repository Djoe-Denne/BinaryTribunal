# Source hôte V3 — lanceur S, G-loss HOLD, ledger writer, capture — plan puis écriture

Fresh auteur, disjoint de TOUS les auteurs/reviewers V3 antérieurs (guardian,
observer, budget, corrections, reviews). NONBLIND déclaré. Objet : implémenter
les seams hôte ABSTRAITS que le noyau gelé exige pour devenir exécutable en
qualification (gate 000c). Le noyau est GELÉ et INTOUCHÉ : GuardianCore.cs
7d4d2c66/71132B, ABI1 GuardV3.Contracts.cs bb4758cc/8016B, BudgetedEvidence.cs
0944a3bb/11846B, KernelObserver.cs a419fc42/21557B. Si un seam requis manque à
l'ABI (interface absente, signature impossible), HOLD + rapport — AUCUNE
modification ABI/core/budget ; l'arbitrage ABI est une gate parent.

Responsabilités hôte (à confirmer par TA lecture des sources gelées, pas par ce
document seul) :

- Lanceur S : contrôle de processus original, lancement de G, attente du handle
  G ; G-loss détecté côté S → réservation tenue + HOLD (jamais PASS) — la
  matrice « G-loss = réservation tenue » du DESIGN Guardian (142-149) est
  implémentée ICI ; distinction sortie ordonnée vs perte avant preuve ;
  réception de l'ACK unique du superviseur (readback 192B exact + S vivant,
  record avant close J) côté S.
- Ledger writer global (#6) : catégorie→owner→sinks→sous-caps sur CaseBudgetV3,
  intégration stricte des 8 slots 262144, aucune écriture hors sinks.
- Capture (#7) : réservation capturée AVANT Read (≤min(4096, restant)), UTF8
  invalide conservé brut, capture détenue par le parent ; tuer G d'abord perd
  l'oracle — l'ordre d'arrêt S respecte l'oracle.
- #8 : compteurs cumulatifs par cas/époques gelés côté hôte, débit avant
  tentative.

LIVRABLES FINAUX (si plan approuvé) : HostLauncher.cs, WriterLedger.cs,
CaptureWiring.cs, Host.Tests.cs (conventions Check/RunAll/FakeNative des gels —
voir GuardianCore.Tests.cs aefc941e comme référence de style), DESIGN.md
(publication des sous-gates résultats/limites exigée par 000c ; droits/durées de
vie ; matrice S/D/G-loss côté hôte), MANIFEST.json. Si TA lecture du noyau gelé
montre qu'une autre décomposition est requise, propose-la dans le PLAN.

PHASES (strictes) :
1. ACK pins (inputs du manifeste) puis HOLD.
2. Sur GO parent : PLAN SEULEMENT en message public — décomposition fichiers,
   carte d'intégration aux seams du noyau (interface/méthode consommée avec
   source:ligne du noyau gelé), liste des tests, limites. AUCUNE écriture.
3. Sur plan-GO parent : écriture des livrables dans l'output assigné + rapport
   public (pins livrés, intégration par seam), puis HOLD pour review fresh.

INVARIANTS : noyau gelé intouché (re-hash par le parent avant review) ; C#5
strict (pas d'interpolation, pas de ?.) ; conventions des gels ; PAS de compile,
pas de test exécuté, pas de run natif/Job/Process réel — les SEULS process
manipulés sont dans le CODE (le parent compilera et qualifiera) ; pas de
filesystem réel hors output ; pas de git/IDB/board-write/délégation/changement
de modèle. Caps 262144/chunk 4096/HOLD collant/débit avant tentative jamais
affaiblis. Last-close case6 reste NOT_ESTABLISHED — rien ne le qualifie.

Modèle imposé : cursor/claude-opus-5-5 Claude Opus 5.5 Max (complexité 82 > 80,
règle utilisateur), spawn fresh, Model.Ref vérifié.
