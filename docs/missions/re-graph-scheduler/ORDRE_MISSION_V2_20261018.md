# ORDRE DE MISSION V2 — re-graph-scheduler — 2026-10-18 (relais, contexte maximum)

Successeur opérationnel de ORDRE_MISSION.md (§15-18) et du graphe V3
(V3_RESUME_WORK_GRAPH_20261017.md). Ce document porte l'état complet au
2026-10-18 : tout ce qui est ÉTABLI (faits pinnés), tout ce qui RESTE (tâches
READY), les contrats de discipline, et les interdits permanents. Une session
fraîche peut reprendre ici sans relire les ~90 commits antérieurs.

## 1. Autorité et modèle de gouvernance

- Session superviseur existante : ses_eca40a8e2ffeanEKTBLiGjDNw8 (équipe
  re-graph-scheduler, team_mv6tmopg_0000_4urn3c). Pas de nouvelle équipe, pas de
  reset. Capacity 5, autoDispatch/autoScale=false, classification manuelle.
- Politique modèles rév. 6 : openai/gpt-6.1-sol high(90)/xhigh(80) réautorisés
  (Opus indisponible côté provider ; exposition catalogue null) ; GLM
  opencode-go max 50 / zai max 25 ; Grok XH 100 ; max Sol désactivé. Le
  superviseur est sur cursor/claude-opus-5-5 Max (conservé, GO utilisateur).
  Chaque spawn porte modèle+variante explicites ; Model.Ref natif vérifié au
  spawn (reçu JSON systématique).
- Dernier GO utilisateur : 2026-10-18 « Go et n'hésite pas à paralléliser tout
  ce qu'il est possible » + autorisation de créer cet ordre de relais.
- Interdits permanents : pas de run01/live/FF8 ; pas de nouveau GO G5/G6/G7 ;
  pas d'achat ; pas de fallback non autorisé ; pas de restauration
  Sol/Astra/Opus par réflexe ; pas de compilation-execution par les workers ;
  review fresh disjointe pour chaque livrable ; worker ne compile/jamais n'exécute ;
  last-close case6 = NOT_ESTABLISHED ; budget intégré = NOT_PROVEN ; DriverLoss
  forcé jamais un PASS ; tout succès est un FAIT borné, jamais une promotion.

## 2. ÉTABLI (faits, gels, receipts — tout pinné, tout hashé)

### 2.1 Sources V3 (toutes ACCEPTABLE_SOURCE_SCOPED, fresh reviews disjointes)
- ABI1 GuardV3.Contracts.cs bb4758cc/8016 (V3_CORE_ABI1_20261017/) — gelé.
- GuardianCore.cs 7d4d2c66/71132 + DESIGN 1d557952/18609
  (V3_GUARDIAN_CORE_R1_OUTPUT_20261017/) — noyau gelé ; contient
  GuardianWin32Owner :985-fin (JAMAIS construit par le harnais).
- KernelObserver.cs a419fc42/21557 (V3_KERNEL_OBSERVER_R1_OUTPUT/) — requêtes
  kernel réelles (classes 1/3, accounting 48, PID-list 72).
- BudgetedEvidence.cs 0944a3bb/11846 + DESIGN b54b561f/11294
  (V3_BUDGET_SOURCE_OUTPUT_R1_20261017/) — module budget ; slots
  262144/chunk 4096/HOLD collant/débit avant tentative.
- BudgetedEvidence.Tests.cs CORRIGÉ e24df773/32653
  (V3_BUDGET_RUNTIME_CORRECTION_OUTPUT_20261017/) — fixture ProbeStream seule
  (MemoryStream.Write→EnsureWriteable→CanWrite ; correction sans délégation).
- GuardianCore.Tests.cs CORRIGÉ aefc941e/38487 (V3_G_CORRECTIONS_R1_OUTPUT_20261017/)
  — C1 4 tests falsifiants EvaluatePair, C2 const-bound, C3 coin fail-closed,
  C4 droits créateur J/T (DESIGN).
- HostLauncher.cs 1cc9cca0/15729, CaptureWiring.cs d08beba3/6029,
  Host.Tests.cs c5770e35/29049 (V3_HOST_SOURCE_OUTPUT_20261017/) +
  WriterLedger.cs CORRIGÉ 67e9b21c/8889 (TryReadBackGuardianResult :114, 192B
  exacts depuis la destination, aucun octet source, fail-closed)
  (V3_HOST_CORRECTION_OUTPUT_20261017/) — hôte S/G-loss-HOLD/ledger #6/capture
  #7/compteurs #8 ; review delta ACCEPTABLE ratifiée (écart de phase déclaré,
  disposition option i).
- RealNative.cs e58eef0c/15934, RunnerReal.cs 8e8bb623/20530, DESIGN 0cf2057a,
  MANIFEST 06a1b8bf (V3_REALNATIVE_OUTPUT_20261017/) — owner natif RÉEL
  (14/14 membres, arbitrages A/B/C tranchés) + harnais slice-2 parent-only.
- Reviews : composée CORRIGE→corrigé (7 ancrages) ; budget CORRIGE→corrigé
  (finding runtime réel ownership-write) ; host CORRIGE→corrigé
  (TryReadBackGuardianResult) ; realnative ACCEPTABLE (8 ancrages A1-A8).

### 2.2 Exécutions (faits bornés, rien promu)
- Batch slice 1 (mémoire pure, fakes) : 4/4 suites vertes — BudgetedEvidence
  17ms, GuardianCore 30ms, KernelObserver 19ms, Host 14ms (V3ASM2-77be4f35f8,
  receipts + v3-batchrun-receipt-20261017.json). CS0649×2 consignés.
- **Slice 2 real-Job (PREMIER real-Job de la mission)** : exit 0 184ms,
  FAITS = AcknowledgedSealed/Sealed/NaturalQuiescent/QUIET/JOB_RETAINED=false/
  SEALED/RESERVED + 8 fichiers de cas pinnés (WINEXE1-b8a9c88660, receipts +
  v3-slice2-receipt-20261017.json). Essai 1 exit 2 honnête (parent avait
  pré-créé le répertoire). Le vertical complet tourne sur l'OS réel.
- L7 mesures (parent run, bun pure-TS) : exit 0 274ms, 3 bras × 4 seeds × 2
  tailles, warmup+5 reps déterministes, DTO hash-pinné
  (l7-measures-run-receipt-20261017.json). Bench source ACCEPTABLE.
- L8 acquisition : les 3 schémas (cluster-partition-v1 6730B,
  investigation-group-v1 4172B, knowledge-delta-v1 3957B) EXISTENT dans
  tools/ff8-harness/schemas/ (loaders lineage.ts:16-17,
  investigation-groups.ts:45) — acquisition parent in-place
  (l8-schemas-parent-acquisition-20261017.json) ; parser-B ratifiable.

### 2.3 Non établi (bornage — JAMAIS présenté autrement)
S/D/G-loss matrix réelle non exercée (slice 2 = chemin propre self-exit ;
driver-loss jamais forcé, jamais un PASS) ; multi-rép ; multi-process S/G ;
budget intégré cross-process ; durée de lease ; reparse/canonique ; readback
0x2208 au-delà de la run observée ; case6 last-close NOT_ESTABLISHED ;
FixtureMarkers/ledger cross-process NOT_PROVEN ; L8 central non intégré ;
L9/L10 non engagés.

## 3. RESTE (tâches READY, ordre de priorité)

### T1 — V3 matrix slices S/D/G-loss réels (auteur fresh, Grok XH, ~75)
Étendre RunnerReal en variantes de cas (fichier matrix séparé, RunnerReal gelé) :
(1) driver-loss : signaler l'event D pendant Run → DriverLost non permanent →
stop owned → ForcedQuiescent — FAITS jamais PASS ; (2) S-loss : tuer S in-process
impossible (co-locaté) → variante signalled ; (3) G-loss : crash du thread G →
GuardianLostBeforeProof, réservation tenue ; (4) ACK mismatch 1 octet ;
(5) attestation incohérente. Exigences : RunnerReal gelé intouché OU extension
déclarée ; les faits publiés par variante ; le parent exécute sous gate séparée.
Deps : rien. Output : V3_MATRIX_SLICES_*. Puis parent-exécution + publication.

### T2 — 000c publication des sous-gates (parent)
Après T1 : publier résultats/limites complets (000c « Subgates results/limits
must be published ») — slice 1 + slice 2 + matrix. Puis task_mvc44d90_000c peut
être complétée sur ce périmètre exact (compile slice1/slice2 + matrix), ce qui
débloque task_mvc44d91_000d (full validation admission — context-pending lié).

### T3 — L8 parser-B ratification (reviewer fresh, Grok XH, ~65)
Inputs : les 3 schémas acquis (pins + lecture in-place), matrice L8
(l8-command-b-matrix-r1-PUBLIC-REPORT-20261017.md, C1-C5), sources centrales
lineage.ts/investigation-groups.ts (loaders), report C1 l8-prepared-graph-v3/
C2 l8-partition-adoption-v1. Verdict : le contrat B proposé est-il cohérent avec
les schémas réels (JSON exact) ? Verdict ACCEPTABLE|CORRIGE|BLOCK + design
versionné de la tranche centrale suivante (proposition, pas de code central).

### T4 — L8 tranche centrale (après T3, owner question à arbitrer)
l8-integration-r1 est inactif sur modèle désactivé ; réactivation exige bascule
explicite de modèle (consignée) OU nouveau owner avec décision parent (les
fichiers centraux étaient exclusifs). Ne pas engager sans arbitrage ownership.

### T5 — L7 mesures : adjudication optionnelle (analyste fresh, GLM, ~45)
Le DTO capturé contient les chiffres réels ; un analyste peut produire la
lecture interprétée (mêmes faits, jamais au-delà). Optionnel — le reçu parent
suffit au traceability.

### T6 — L9 (audit indépendant) après L8 substantiel ; L10 après L7+L8+L9.
Gates existantes inchangées (task_mv6towry/task_mv6towsa).

### T7 — full44 : TOUJOURS gated (déps 000d) ; run01/live/FF8 : jamais sans GO
utilisateur séparé explicite.

## 4. Discipline worker (inchangée, prouvée)

Paquets in-place pinnés (INPUT_MANIFEST + PARENT_ACCESS_RECEIPT détaché,
manifeste hashé, fichiers gelés readonly) ; phases ACK-HOLD → GO → livraison →
review fresh → corrections delta si CORRIGE → re-review delta ; anti-saturation
(partiels publics par livrable, jamais un tour sans message ; déclaration
explicite de saturation) ; NONBLIND déclaré à chaque ACK ; re-hash début/fin par
le reviewer ; Model.Ref natif vérifié au spawn (reçu JSON) ; model imposé
explicit, aucun fallback ; le parent fait TOUTES les compilations/exécutions
(gates séparées, receipts frozen readonly).

## 5. Index receipts (répertoires)

- .tmp/coordination-three-20261014/ : packets/outputs/receipts V3 ( tout),
  ENSEMBLE_MODEL_ACTIVATION_20261017/, mission-model-sync-20261017/.
- .tmp/V3_BUDGET_PARENT_ORACLE_20261017/cases.json (ad67adf0).
- Temp/opencode/ : BMC-0944a3bbf9 (budget dll), V3ASM-a7cda4f9a6 (asm 1),
  V3ASM2-77be4f35f8 (asm 2 + batch), WINEXE1-b8a9c88660 (winexe + slice 2),
  V3MEM-9c1ae2d7b4 + V3MEM2-* (memory runs).
- Docs : CORRECTIVE_FINAL_GATES_20261014.json (clés par tranche — LA référence
  accumulée), MISSION_JOURNAL.md, MODEL_BANDS_USER_REQUEST_20261017.md,
  FOLLOWUP_PACKET_EPERM_DISPOSITION_20261017.md, V3_RESUME_WORK_GRAPH_20261017.md.

## 6. Commit anchors (au moment de l'ordre)

f19f2e6/65be22d realnative ; 4ff1ee6 batch vert ; 22297bc mesures L7 ; 720d727
plan RealNative ; c293b3a **slice 2 real-Job faits** ; e18fda2/27f8894/09645c3
chaîne host ; ea789f3 complétion parent hôte ; 80f1c80/0e2247c migration
modèles ; bca2260 sync catalogue ; 0c2f9b4 cet ordre V2. Suivants : voir
`git log --oneline -15`.

## 7. AUDIT vs ORDRE initial (2026-10-18) — AUCUNE DÉVIATION MATÉRIELLE

Lecture directe de ORDRE_MISSION.md §15-19 contre les faits §2 :

- **L0-L6** : hérités acceptés (L2 9a35cb9, L3/L6 23b92b6, L4 accepté corrigé,
  L5 613218f, L1 immuable G1) — hors périmètre de reprise.
- **L7 (§17.1-17.3)** : initial QA / SIM851 / runtime16 / copy851 / crossQA
  acceptés scoped ; sparse bench ACCEPTABLE ; §17.3 respecté À LA LETTRE
  (mesures 1k/10k exécutées parent-run ; **100k conditionnel jamais touché** ;
  bornes jamais présentées comme mesures ; seeds/versions/brans équitables).
  Ouvert : §17.1 couverture globale (complément held) + adjudication DTO.
- **L8 (§16 + full44 routing)** : runtime16 review accepted scoped
  (unintégré) ; matrice command-B livrée (C1-C5) ; schemas acquis (demande de
  la matrice elle-même) ; parser-B ratification prête ; tranche centrale
  ensuite (ownership à arbitrer). **Chaîne V3 guardian = route explicite de
  L8-full** (frontier task_mvc42mb4_0005 : « V3 ratification→sources/reviews
  →qualification ») — pas une déviation : slices 1/2 exécutées bornées,
  matrix S/D/G-loss restante.
- **L9/L10** : non engagés, gates inchangées (L9 après L8 substantiel ; L10
  après L7+L8+L9 ; full44 gated par 000d).
- **G0-G7** : G0/G1 acquis ; G2 acquis (tranche verticale offline) ; G3
  PARTIAL explicite ; G4 scoped reviews accumulées ; G5/G6/G7 jamais engagés
  (le guardian V3 est le harnais de sécurité de la mission, pas une adoption
  native du produit — aucune confusion).
- **Q1 anomalie L1 (frontier)** : READY, pas encore engagée — pont
  originel-rejet/variante positive à lier aux tests déjà acceptés, arbitrage
  anomalie canonique/limite de clôture. **REPRISE MAINTENANT** (spawn ci-après).
- **Q3 L8 parser-B** : schemas acquis → **ratification MAINTENANT** (spawn).
- Aucune tâche du frontier contredite ; aucune fabrication ; les succès
  restent des faits bornés (§19 : implémenté/vérifié offline distingués).

## 8. REPRISE ALIGNÉE — prochains spawns (ordre du frontier)

- SP1 **Q1-L1-ARBITRATION** (GLM max, ~50) : lire les preuves L1 gèlées
  (L1_BRIDGES_RARE_INCOMPATIBILITY_20261015.md, canonical 69278ee8, dérivé
  bb3b194a) + les tests DÉJÀ acceptés ; produire l'ARBITRAGE proposé
  (original-rejet/variante-positive liés aux tests, limite de clôture) —
  proposition parent, zéro code.
- SP2 **L8-PARSER-B-RATIFICATION** (Grok XH, ~65) : pinner/lire les 3 schémas
  acquis in-place + les loaders centraux (lineage.ts:16-17,
  investigation-groups.ts:45) + C1-C5 du rapport matrice ; verdict de
  cohérence contrat-B ↔ schémas réels (JSON exact) + design versionné de la
  tranche centrale (proposition). Zéro écriture centrale.
- SP3 (wake suivant) **V3-MATRIX-SLICES** (Grok XH) — T1 ci-dessus.
