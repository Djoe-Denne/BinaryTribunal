# Q1 — Arbitrage anomalie L1 (bridges-rare) — proposition parent, source seule

Fresh auteur, disjoint de tous les auteurs/reviewers L1-L8. NONBLIND déclaré.
ZÉRO code, ZÉRO test, ZÉRO exécution — une PROPOSITION d'arbitrage parent.

Contexte gelé (frontier task_mvc42mb4_0005, obligation L1-rare, Q1) :
l'anomalie canonique « bridges-rare » (fixture canonique 69278ee8 rejetée par
le validateur strict — fin exclusive [2100,2110) contre un span dérivé
[2100,2111), FP bb3b194a, size 17) est OUVERTE. La règle originelle de rejet
strict reste la régression exigée ; une variante synthétique positive (span
[2100,2111)) a été autorisée ET acceptée comme cas disjoint — mais le LIEN
entre original-rejet / variante-positive / tests-DÉJÀ-acceptés n'a jamais été
arbitré formellement, et la « limite de clôture » de l'anomalie non plus
(qu'est-ce qui fermerait L1-rare sans assouplissement ni whitelist ?).

TA TÂCHE : produire l'ARBITRAGE PROPOSÉ en lisant UNIQUEMENT les sources
pinnées (docs committés — preuves déjà acceptées, jamais rejouées) :

1. Ce que la règle stricte protège (fin-exclusive, identité, digests) et
   pourquoi le rejet original est une RÉGRESSION exigée, pas un bug.
2. Ce que la variante positive démontre réellement (couverture du positif sans
   affaiblir le strict) et ce qu'elle ne démontre pas.
3. Le LIEN manquant : les tests acceptés couvrent-ils déjà la paire
   rejet-strict/positif-disjoint ? Si oui citer test:ligne ; sinon préciser le
   cas disjoint minimal restant (sourceGO parent séparé).
4. La LIMITE DE CLÔTURE proposée : les conditions EXACTES sous lesquelles
   L1-rare pourrait être déclaré clos SANS whitelist/assouplissement (ex :
   rejet strict conservé + positif disjoint accepté + audit parent), et ce qui
   RESTE hors clôture quoi qu'il arrive.
5. Les gates impactés (G1 anomalie, L9/L10 lectures) et ce que ton arbitrage
   ne tranche PAS (le parent tranche).

LIVRABLE : EXACTEMENT 1 fichier — L1_ARBITRATION_PROPOSAL.md (ancrages
doc:ligne, options explicites, recommandation argumentée, jamais une décision).
Pas de git/IDB/native/écriture hors output/board-write/délégation/changement
de modèle/compile/test.

PHASES : 1 ACK pins puis HOLD ; 2 sur GO = écriture + rapport public, HOLD.

Modèle imposé : opencode-go/glm-5.3-flash max (complexité 50 ≤ 60, règle
utilisateur), spawn fresh, Model.Ref vérifié.
