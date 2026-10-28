# L1 B1 — lien statique de la paire établi, aucune clôture globale

Décision du superviseur du relais sous politique r1 :
**STATIC_PAIR_LINK_ESTABLISHED / SOURCE_SCOPED, NOT_RUNTIME, NOT_L1_CLOSURE**.
La paire cherchée par B1 existe dans le gel L7QA_INITIAL_E03. Aucune nouvelle
fixture, whitelist, règle, source ou test n'a été écrit/modifié/exécuté.

## Provenance et contrôles

- A : l1-b1-analysis-r1, ses_eb1b998bdffe1UIItgakc7QAjU,
  task_mvdlr82o_000t_adde4x ; GLM Flash/max natif vérifié. Continuation forkée
  de notre auteur d'accès seulement, aucune indépendance A/ACK revendiquée.
- V : l1-b1-review-r1, ses_eb1b71de3ffe3pyOD06Nfoefui,
  task_mvdlxba1_0013_s774o8 ; GLM Flash/max natif vérifié, session fresh
  disjointe, voit A par conception. V a revu le digest parent de A et les
  sources, pas le message original intégral. Cette limite est conservée.
- V rend ACCEPTABLE_SCOPED pour D1/D2, CORRIGE pour prose annexe edge-id.
- Parent : lecture directe des deux tests/helpers et de graph-normalize.ts,
  comptage du literal edgeId et lecture du reçu QA ; rehash fin indépendant
  38/38 (1051621B) et 40/40 (1068209B), aucun mismatch.
- Manifestes A cba86fa601d401d3bd51b57c67e334635eaf3f27b25b5e0b63be4e227b6917ec,
  V 59cb50d6299a302405b759af666069238f793a35a6cdf37d3aca35c8b330f339.

## Six ancrages retenus

Préfixe des sources ci-dessous :
`l1-b1-search/inputs/gel/tools/ff8-harness/` dans le présent relais.

1. `test/simulator/graph-interop-support.ts:47-53` lie explicitement canon raw
   69278ee8…105c4, contenu21e7adc6, fingerprint21e42bba et dérivé bb3b194a.
2. `test/simulator/graph-interop-structure.test.ts:87-95` : assertion de rejet
   exact du validateur et toThrow du build, raw canon inchangé. C'est D1.
3. `test/simulator/graph-interop-support.ts:55-78` : préconditions canon+rejet,
   clone, seules mutations span end0x2110→0x2111 et size16→17, identité test-only
   et fingerprint distinct ; le positif ne répare pas le canon.
4. `test/simulator/graph-interop-structure.test.ts:98-118` : identité et
   fingerprint attendus, edges/coverage préservés, spans disjoints, delta inverse
   exact. D2 appelle le contrôle strict via assertCrossedStructure.
5. Même test `:13-16,119-125` : validation attendue [], fingerprint oracle,
   assertions SCC/G1 et re-pin du fichier canon. Attentes statiques, pas PASS.
6. `src/graph-normalize.ts:90-93,122-128` : distinction ids générés40hex / id
   explicite préservé dans le chemin non-shardé et non-generated.

## Corrections parent obligatoires, A et V originaux préservés

**Edge-id :** l'id canon utilisé par le helper est explicitement `edge:` suivi
de **64** hex (support.ts:51 et fixture content.json:262). Le format généré40hex
ne lui est pas égal ; dans le chemin non-generated/non-shardé le build conserve
edge.id. Aucune égalité d'un hash recomputé avec le pin64 n'est établie ici.
La phrase annexe de A affirmant40hex/correspondance est rejetée ; aucun effet
sur les assertions D1/D2, qui trouvent l'edge d'entrée par son id explicite.

**Statut QA :** le label ancien « new L7 initial QA, not accepted » est une
provenance au gel, pas une preuve d'absence de review ultérieure. Le reçu
`l1-b1-review/inputs/PARENT_INITIAL_QA_REVIEW_RECEIPT.json:17-18,98-99` établit
une review initiale ACCEPTABLE OFFLINE SCOPED, tout en excluant transfert/main
et clôture post-L8/globale. L'affirmation originale A « les ancres existent donc
dans le gel projeté, dans des fichiers non encore acceptés » ne doit pas être
reprise comme statut global présent. Le digest parent avait déjà signalé que
cette inférence devait être vérifiée ; cela ne transforme pas rétroactivement
le message original A en formulation prudente. La lecture indulgente P5 de V
ne dispense pas de cette correction. Aucun statut global n'est déduit du label.

## Limites qui restent opposables

- Les corps graph.ts/validation.ts et les dépendances cluster/planner n'étaient
  pas dans le paquet L1. Les assertions sont directement visibles ; leurs
  résultats runtime ne sont pas re-prouvés. Les reçus historiques restent des
  faits documentés distincts, jamais des runs de cette tranche.
- bb3b194a et l'identité dérivée sont des pins cohérents entre sources/docs,
  pas une exécution ou un recalcul produit de ce relais.
- Le test raw98 :128+ et les sources hors paquet n'ont pas été suivis.
- Aucun schéma absent n'est déclaré validé par inférence de l'erreur attendue.
- Pas de compatibilité globale L1↔L2 ou native, G1 non rouvert, canon inchangé.
- Les conditions cumulatives C1-C5 et le verbe de clôture historique restent
  au propriétaire historique. L1BridgesRare20261015 n'est pas modifié/clôturé.
- Aucun registre, tâche historique, IDB, code central, git, run ou gate modifié.

Livrable de relais uniquement : preuves et limites à disposition du parent
historique. Ne pas employer « L1 clos », « test PASS » ou « mission terminée ».
