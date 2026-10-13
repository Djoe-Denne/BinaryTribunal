# L6 — gates parent et revue indépendante en cours

Mission `re-graph-scheduler-20261013`, 2026-10-13. **NON ACCEPTÉ à ce stade** : gates unitaires verts ne valident pas l'interopérabilité ni la sûreté complète.

## Gel de revue vérifié par le parent

Worktree `ensemble-re-ff8-re-graph-scheduler#4urn3c-l6-persist-r2`, fichiers non commités ; quatre fichiers own + seul tracked M = correctif test L1 parent.

- eventlog.ts SHA256 `5dad943a6c3edc6c3045dd2e91715953db6eb1aff85d74915d5811bb7e02d31e`
- unit-lease.ts SHA256 `406acb243c427b10024b0e5aebadc0f9567dfbb77748a91bb10eacaf6a99f6c5`
- graph-store.ts SHA256 `d2b259ed43be0a173716c0011368427672a801d903710503d464a5c21eb58958`
- eventlog.test.ts SHA256 `ba991ec08e0fb69e971742f1bcf82b60188d4310b8b2b30cea4dafbf8510def4`

Gates relancés par le parent dans ce worktree, séquentiels via Context Mode :

- `bun run typecheck` : exit 0.
- `bun test test/eventlog.test.ts` : **27 pass / 0 fail**, 143 expect, exit 0.
- `bun test` : **358 pass / 1 skip / 0 fail**, 359 tests / 17 fichiers, 15551 expect, exit 0. Worktree n'inclut pas L5 intégré après sa création.

Revue indépendante L6-RV : task `task_mv6xt1p7_0030_wg3h0k`, membre `l6-review`, profil read-only `plan`, worktree false, contexte fresh, session `ses_ec9c14912ffeimQ8egFrHmLRtp`. Model.Ref natif vérifié `cursor/grok-4.7/Grok 4.7 High`. Gel des quatre sources ci-dessus, contrat/schémas et dépendances existantes ; aucun verdict auteur donné au reviewer, aucune édition autorisée. Ne remplace pas L9 finale.

## Contre-exemple parent d'interopérabilité L5→L6

Graphe confirmé A appelle B, WorkUnit agrégée qui possède A et B. `planMission` L5 produit un sous-intent A et B auteur de la fonction appelante attendant R de la fonction callee, puis R de la même fonction attendant ses A+B. C'est la granularité locale explicite prévue par la mission.

`GraphStore.addUnit` L6 rejette cette unité avant toute transaction/auth : **`input: invalid blind-family prerequisites`** (`graph-store.ts:197`). La garde `ab.every(s => s.waitsForSubIntentIds.length === 0)` interdit également les attentes légitimes de R d'une autre fonction, pas seulement une dépendance A↔B des auteurs de la même fonction.

Repro parent en mémoire : unité **réellement générée par L5 intégré**, pas recopie de son algorithme ; rôles callee A/B waits0 et R waits2, rôles caller A/B waits1 (R callee) et R waits2. Le rejet est invariant à l'autorité parce qu'il intervient avant la vérification de celle-ci.

Blocage à corriger après la revue sur gel : distinguer indépendance scientifique des deux auteurs d'une même fonction et dépendance locale sur R d'une autre fonction, en gardant références valides/attribution/DAG local/gates 2+1 et whole-unit publication. Ajouter un test croisé L5→L6, pas seulement des familles fabriquées à waits vides. Aucun fichier du gel L6 modifié pendant la revue.

Autres vérifications restent en cours : voie primitive `UnitLeaseStore.reserve`, invalidations futures, publication, mesures de budget réelles, cohérence de migrations/replay et limites de complexité des scans de journal/receipts. Ne pas inférer leur validation des 27 tests.
