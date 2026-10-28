# L7 6d00 — P1 copie/validation confirmé, routage correctif NON autorisé

Fresh review NONBLIND Sol/max `l7-namespace-review`, session
`ses_ebb3cde8dffeG2EQhIteowOhWK`, task `task_mvayt47j_000e_gx1ukb` : **BLOCK**.
Task completed, reviewer arrêté ; aucun prochain wake ne vaut droit de le rouvrir.
Source 6d00, nouveau test 74f052d4, README 5ed73b73 restent gelés/non intégrés.

## P1 : namespace présent à la validation, perdu dans la copie consommée

Chemins relatifs au package figé `tools/ff8-harness/` :

- `src/simulator.ts:180–191` lit l'ID du prérequis par accès ordinaire ; un ID hérité
  ou propre non énumérable peut satisfaire les joins vers l'archive fournie.
- `src/simulator.ts:598–602` valide le caller avant `structuredClone`, puis exécute
  une copie non revalidée. Ces deux formes d'ID disparaissent à la copie.
- `src/simulator.ts:928–936` : sans ID, le besoin original n'est plus trouvé ; le
  `requirement` local absent emprunte alors le chemin level-only permissif.
- `test/simulator/simulator-identity-replan-regressions.test.ts:154–176` ne combine
  pas ID destructivement copié et besoin manquant. Les 131 tests verts et le full
  1061PASS/1SKIP ne réfutent donc pas ce contre-exemple.

Parent exécute quatre cas via API publiques dans une COPIE propre des 386 pins :
baseline → 2 commits/consommateur COMMITTED ; besoin absent seul → 1 commit/
consommateur BLOCKED, attempts0 ; absence + ID hérité OU non énumérable → **2 commits/
consommateur COMMITTED, attempts1**. L'archive/source est identique pour chaque cas,
sans rehash ni suppression d'origine. Dans les deux attaques l'ID copié vaut absent.
Contraire : copie préalable puis validation → diagnostics et `plan_non_conformant`.
386 pins exacts avant/après, aucun SQL/full/native/source patch.

Preuves publiques du reviewer archivées, sans reasoning privé. Ses TC0/131PASS/
14004 assertions sont conservés. Un oracle erroné de SON contrôle cancel/FIFO a été
qualifié et corrigé dans sa probe uniquement ; ce n'est pas un second défaut source.
Ses contrôles HARD/adoption/releases séparés n'établissent pas de nouveau BLOCK.
Profil Plan : rapport/repros inline, pas fichiers créés ni bypass de permissions.

## Décision et suite

`L7_NAMESPACE_REPLAN_USER_GO_20261015.md:69–70` n'autorise pas de correction
supplémentaire après échec de cette étape. **WAIT accord utilisateur** : nouvelle
exception Astra/max fresh bornée à cette classe copie/validation, ou gel de L7.
Pas continuation automatique d'un auteur/reviewer terminé, nouveau modèle, fallback,
changement de profil/politique, achat ou relabellisation en tâche mécanique.

Une éventuelle correction devra faire valider les données réellement consommées
sans blanchiment d'archive, préserver le contrôle consommateur/producteur, manualv2,
les 100 anciens et 31 nouveaux contrôles, l'invalidation monotone et les releases.
Choix rejet des descriptors horscontrat ou copie avant validation à proposer dans
un PLAN, pas imposé ici ; classes voisines/getters et immutabilité à qualifier.
Puis RED qualifié, permissions distinctes, nouveau gel, review fresh et gates parent.

L8 est indépendant : sa correction Sol/max déjà autorisée continue sous ses gates.
Pas intégration L7/post-L8 QA/L9/L10 ni preuve scientifique/native implicite.

Evidence parent : `.tmp/coordination-three-20261014/`
`l7-copy-boundary-parent-reproduction-20261016.json`,
`l7-namespace-review-completed-public-archive-20261016.json` et
`L7_NAMESPACE_COPY_BOUNDARY_PARENT_REPLAY_20261016/`.
