# HANDOFF MISSION — re-graph-scheduler (pause 2026-10-20, reprise en session neuve)

Mission mise en pause à la demande de l'opérateur. Ce document rend une nouvelle
session autonome sur la reprise. Lire aussi le dernier checkpoint
`.tmp/mission-v2-20261018-continuous/CONTINUATION_STATE_20261020_STRUCTURAL_BLOCKER_REPORT.json`
(et sa chaîne `supersedes`), le journal `MISSION_JOURNAL.md` et
`CORRECTIVE_FINAL_GATES_20261014.json`.

## État acquis (fiable, vérifié, non intégré à MAIN)

- **Planner complétion R2 qualifiée offline** : 415 tests / 17 077 assertions /
  13 fichiers. FULL RAW identique (593 912 596 B par trace, SHA
  `e5090d756ba3c475b75e868e4f415270d72834f4fe9117ac7f729896140fafa0`, 567
  fenêtres, deux EOF, 0 diff), 701 appels / 594 retours / 107 refus, footers
  privés `afterAll`, typecheck strict complet exit 0. Readbacks parent :
  `planner-fixed-r2-parent-green-verification.json` (5 970 comparaisons) et
  `planner-fixed-r2-regressions-parent-verification.json` (936 comparaisons,
  custody 97 DB / 96 receipts / 82 absentes / 5 JSON CLI).
  Rapport : `PLANNER_FIXED_PROJECTIONS_QUALIFICATION_20261019.md`.
- **Numeric/context** : source scientifique R2 gelée et acceptée statiquement
  (`s1-r5-numeric-context-extraction-r2-frozen/`, 6 fichiers / 147 157 B) ;
  source de tests R4 gelée en PROPOSÉ (`numeric-qualification-r4-frozen/`,
  4 fichiers / 178 504 B). **Les 450 paires (224 valeurs / 226 refus) et les
  9 régressions n'ont JAMAIS été typées/importées/exécutées.**
- **Preuve frames natifs (synthétique)** : buffers émis réels + maps V3 capturés
  et audités ; `native:1:11` est un token runtime, jamais une coordonnée source.
  Contrat d'extension NON ratifié
  (`NUMERIC_NATIVE_FRAME_PLAN_PARENT_ADJUDICATION.json`,
  `numeric-native-frame-r3-homologue-audit.json`).
- **S1** : recherche complète acceptée (résultats `result_mvfhmdpx`,
  `result_mvfidupq`, `result_mvfixg0l`) — schéma final NON ratifié ; directions
  root option A / model bindings / provenance knowledge ratifiées comme
  DIRECTION uniquement (`S1_R5_ROOT_SLOT_DIRECTION_PARENT.md`,
  `PARENT_ROOT_ADJUDICATION`, `s1-final-public-plan-parent-research-acceptance.json`).
- Interdits permanents respectés : aucun commit/push, aucun changement global,
  aucun nettoyage, pas d'intégration MAIN/S1, pas de live FF8/full44.

## File de reprise — 3 tâches prêtes (packets gelés, prompts à recréer)

1. **R4 partie A** — packet `numeric-qualification-r4-full-review/inputs`
   (77 pins / 1 315 076 B, RAW `fc3193e9711a5e9eaaf3e637c057d7013e7031c0c446b78f25babbd7dcdf5213`).
   Périmètre : F1 fragments/preuves (budgets 2 MiB cas / 128 MiB branche,
   réserve 1 024, ordinal après écriture, fatal indépendant, FS partiel honnête),
   observateur/non-mutation, préservation ledger 9 régressions + 450 paires.
   Verdict : `ACCEPTABLE_F1_OBSERVER_LEDGER_SCOPED|CORRIGE|BLOCK`.
2. **R4 partie B** — même packet. Périmètre : ErrorEnvelope (première capture
   RAW avant stack, WeakMap, forme/ordre exacts), catalogue/SEAL d'émission
   natif (publication RO atomique en dernier, ENV préconnues, binding SHA
   préconnu, rejet ENV legacy), chaîne d'origines complète (5 clés natives,
   TAG seulement après preuve tuple→source + chaîne entière, export 7,
   wrapper 20..185), `native:1:11` = STOP opérationnel.
   Verdict : `ACCEPTABLE_ERROR_NATIVE_SEAL_SCOPED|CORRIGE|BLOCK`.
3. **Contrat public S1 final (PLAN ONLY)** — packet
   `s1-common-contract-final-plan/inputs` (51 pins / 985 343 B, RAW
   `a81b74f4e1e36c9eaf81fbd1e71c1aa3c5a2be62fec2f383e3a7b9be916ebf5b`).
   Périmètre : types fermés RootSlotGrantsV1 / RootModelBindingsV1 /
   KnowledgeMaterializationV1.provenance, placement exact (RootLimitsV1, T0,
   enveloppe), joins ByteRef vers dépendances qualifiées, table
   DÉCIDÉ/PROPOSÉ/BLOCK (acquisition S2 + qualification numérique restent BLOCK).

Règles de relance : workers `plan` fresh, `worktree:false`,
`report_mode:'final_response'`, lecture seule, **sans rehash** (bookends parent
autoritaires), verdict unique final ; vérifier `Model.Ref` natif au spawn
(script `read-native-ref-v2.mjs`). Les tâches peuvent être recréées telles
quelles ; les anciens IDs bloqués par des claimants morts ne sont pas
réclamables (recréer sous nouvel ID et noter le lien).

## Suite de la mission (après les 3 livrables)

1. Si un verdict R4 est CORRIGE/BLOCK : correction bornée de la source de
   tests → nouveau packet → fresh V. Pas d'exécution avant acceptation.
2. Gateway d'émission natif (producteur ROOT, interface SEAL déjà ratifiée) :
   source → revue indépendante → probes → SDK strict TSC complet → GO distinct
   → 450 paires (900 actions) en une invocation sérialisée parentale.
3. Ratification S1 : V de contrat fraîche puis GO source S1 et QA API-aveugle
   disjoints ; jamais avant dépendances qualifiées + contrat final.
4. Ensuite : S2 (persistance/CAS/ledger root), S3 (runtime/drain/fichiers/
   récupération), S4 (wrappers/replay), L7 global, L9, L10 — voir
   `ORDRE_MISSION_V2_20261018.md` et la chaîne de checkpoints.

## Leçons de l'incident (à appliquer en session neuve)

- Épuisement de crédit → morts silencieuses de workers (pas de deliverable,
  session `ready`/inactive). 9 sessions mortes consignées dans le checkpoint
  bloquant. Aucune reprise de contexte enfant : recréer fresh.
- Une tâche claimée par un membre mort n'est pas réclamable : recréer la tâche.
- Vérifier `Model.Ref` natif à chaque spawn ; ne jamais croire l'override seul.
- Rester en `long_run` : ne pas attendre de GO utilisateur pour les étapes déjà
  autorisées ; escalader uniquement vrai bloqueur (crédit, provider, structurel).

## Index rapide des preuves (sous `.tmp/mission-v2-20261018-continuous/`)

`planner-fixed-projections-r2-parent-qualification.json`,
`planner-fixed-r2-parent-green-verification.json`,
`planner-fixed-r2-regressions-parent-verification.json`,
`planner-fixed-r2-public-api-closure-readback.json`,
`planner-fixed-r2-hand-oracles-receipt.json`,
`numeric-qualification-r4-parent-delivery-audit.json`,
`NUMERIC_NATIVE_FRAME_PLAN_PARENT_ADJUDICATION.json`,
`numeric-native-frame-r3-homologue-audit.json`,
`native-emitter-inspector-r3-parent-audit.json`,
`s1-r5-root-slot-refinement-plan/inputs/` (direction root + contrats upstream),
`s1-r5-public-contract-r2-plan/inputs/` (packet R2 S1),
`docs/missions/re-graph-scheduler/PLANNER_FIXED_PROJECTIONS_QUALIFICATION_20261019.md`.
