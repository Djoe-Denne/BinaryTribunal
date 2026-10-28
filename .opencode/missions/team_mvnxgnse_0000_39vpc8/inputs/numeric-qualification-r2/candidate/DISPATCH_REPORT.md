# Dispatch SOURCE fermé — local offline vert, qualification globale partielle

## Résultat

Le vrai seam consommé par `reconcileOrigins` et par le nouveau test pur accepte la relation RAW208 **seulement avec une preuve SOURCE fermée et un contexte d'itération propriétaire**. Tous les frames et indices sont conservés ; aucun frame648 inventé, aucune hypothèse tail-call.

- Rouge de référence : **46 succès / 1 échec**, rejet exact `baseline[3] candidate[3]`.
- **Même fixture**, après activation de la relation : **47 succès / 0 échec / 137 assertions**.
- Dernier impact renforcé : **49 succès / 0 échec / 140 assertions**, zéro SKIP. Deux négatifs ajoutés pour capture auto-déclarée et retrait du seul wrapper.
- **4/4** invocations pures consommées, en série, sous plafond30s. Première invocation16/31 : elle reproduisait le rejet exact mais un alias mutable du témoin partagé contaminait d'autres fixtures ; ce défaut de fixture a été isolé avant le rouge de référence, pas présenté comme31 défauts produit.
- Unique `node --check` du CJS modifié : exit0, corps non exécuté.

Les logs stdout/stderr, statuts et raisons de chaque invocation restent dans `evidence/DISPATCH-*`. Le typing final parent et la relecture indépendante du delta restent **requis**. Aucun nouveau run scientifique ou inspector.

## Localisation / impact

Dans ce nouveau namespace uniquement :

1. `qualification/native/numeric-native-proof.ts` porte désormais la relation extraite **réellement appelée** par le différentiel, ses types de contrat et capacités privées d'ownership. L'ancienne branche direct-call et toutes les conditions wrapper/row/callee/voisins restent présentes.
2. `qualification/native/numeric-native-ast.ts` dérive la preuve root depuis le test source réel, au moyen du TypeScript5.9.3 déjà pinné. Le test est analysé comme DATA, pas exécuté. Une révision source entière explicitement revue ferme les mutations lexicales et factories alternatives ; l'AST fournit les vrais points, imports et factory.
3. `qualification/test/numeric-differential.test.ts` transmet la chaîne effective : factory/add enregistre l'objet-case et son `make` ; boucle propriétaire ouvre l'itération ; `c.make` fournit le `work` dont l'action est liée avant appel ; `index` et `error-proof` réellement écrits puis relus alimentent les grants. Le pairing n'accepte que les deux tokens de la même itération.
4. `qualification/native/numeric-native-collector.cjs` dérive `dispatchSource` depuis les bytes approuvés, exige la nouvelle révision puis scelle catalogue/binding **v3**. Pas de transport ou lifecycle nouveau.
5. Nouveau `qualification/test/numeric-dispatch-proof.test.ts` : données RAW/source/nativeJSON + handles factices qui **ne sont jamais appelés**, seul seam de production testé.

La projection initiale89fichiers/1627051B a été vérifiée byte-exact avant modification. Les **seuls quatre fichiers existants modifiés** sont les quatre ci-dessus ; les85 autres, dont science6, neuf régressions, B1 lifecycle, B2 audit, fixtures et writer, sont inchangés. Aucun ancien W modifié, chmod ou réécrit.

## Domaine et fermeture de la preuve

Le contrat ratifié est décrit dans `DISPATCH_CONTRACT.md`. Les23IDs sont énumérés exactement, jamais acceptés par préfixe/suffixe. Config/seed/expected/oracle/specHash et index attendu de la même factory sont vérifiés pour chacun. Les imports BG/CG restent ceux de chaque branche.

Le témoin source a un type/version distincts d'un frame runtime. Il comprend source réelle, hash, outil AST, points, factory, imports et digest d'itération. En production, il vient uniquement du catalogue root déjà scellé et validé avec son binding same-run ; le consumer vérifie encore bytes source/points/hash et refuse l'ancien sourceRevision historique comme candidat live.

Les tokens privés en WeakMap lient les références d'objet-case, `make`, `work.action`, side, index, case/config et artifacts admis. Un JSON ressemblant à un token n'a aucune autorité. Substitution/réassignation/double admission et mélange d'itérations sont refusés. Le hash d'entrée d'action vient du snapshot effectif déjà encodé ; les artifacts sont reliés au chemin root/side/index/ordinal/bytes/text exacts.

Le grant réencode le **record error-proof complet admis**, vérifie run/RAW et toutes les frames, puis conserve leur digest. Cette vérification a lieu avant tout alignement : supprimer C3 ne peut pas contourner la garde en ne laissant que des paires alignées. La preuve explicite consomme B`[0,1,2,3]`, C`[0,1,2,3,4]`, avec C3 justifié séparément.

Les six valeurs techniques Error ne sont pas modifiées ou normalisées plus tôt ; le chemin original ne les remplace qu'après preuve complète. Les comparaisons sémantiques/stages/index et attentes scientifiques restent inchangées.

## Ancienne preuve ≠ nouveau candidat

Les données208 viennent exclusivement du run raté `numeric_m2_20261026_r2_001` : source SHA`33f586…`, dispatch998:28, factory629:74, cible648:9. Les vrais binding/catalogue/SEAL ont été projetés par le parent ; leurs hashes, runId, lien du SEAL et module-source réel sont vérifiés dans les tests. Ils ne sont pas fabriqués, ni réécrits vers W2.

Le nouveau source a SHA`dba3557f04b81efca6c0042159391250cbdac3b79fe4894071a695e6c94aeb15`, dispatch **961:28**, factory **589:74**, cible **608:9**. Le même mécanisme AST dérive ces coordonnées et refuse l'ancien témoin appliqué aux nouveaux bytes. Aucun RAW n'est déplacé/recomposé pour prétendre un nouveau run. Les handles des tests modélisent l'ownership ; ils ne reconstituent pas des capacités d'exécution historiques.

## Schéma, imports et pins

- Nouveau manifeste `DISPATCH_RUN_INPUTS.json` : **37 pins vérifiés / zéro écart**, SHA`1ee16314d47c6e638437c806d7c50d2092a3a1f73c184ef1d31acd3aeee0f544`.
- Binding/catalogue : v3 ; nouveau champ catalogue `dispatchSource`. Producteur natif v2 et SEAL v1 inchangés, leurs garanties ne sont pas abaissées. Relation `full-origin-pair-source-dispatch-v1` ; preuve source et paire de capacités ont leurs versions explicites.
- Runtime enfant reste **13 modules** : les ajouts sont dans le seam existant. Il importe seulement `node:crypto`, `node:path` et le writer déjà présent. Aucun compiler/fs/inspector/science nouveau dans le seam enfant.
- Root reste37pins. L'AST root utilise son outil existant pinné, jamais importé par le consumer enfant. Aucun nouveau module/framework/coordinator/SDK/tracer.
- L'ancien manifesteB2 SHA`984deec…` est conservé dans `inputs/previous-version` et l'ancien W. B1/B2 hashes inchangés : preuves/revues réutilisées, pas de rejeu16/57.

## Contrôles et limites

Commande exécutée uniquement depuis W2 :

```text
C:/Users/djden/.bun/bin/bun.exe --no-env-file --config=./bunfig.toml test --max-concurrency=1 ./qualification/test/numeric-dispatch-proof.test.ts
```

Les négatifs couvrent témoin absent/JSON, hash/outil/points/imports/cible/factory, side/run, contexte case/config/seed/expected/oracle/spec/index/artifact, callback remplacé, autre factory/itération, double admission, wrapper/row/callee/voisins et frames ajoutées/manquantes/dupliquées/réordonnées/faux648. Oracles relationnels littéraux issus des RAW, pas copie d'algorithme. Les23 admissions de données ne sont **pas23 exécutions scientifiques**.

**Bloquants restants** : typing final parent des TS modifiés, puis acceptation du même reviewer sur contrat/code/delta/preuves. Le contrat pré-implémentation avait son OUI conditionné et sa ratification parent ; cela ne remplace pas la revue finale.

**Preuves non exécutées** : aucun collecteur/inspector/science450/9/subset209+, aucun global `bun run typecheck`, `bun run test:q1-primitives` ou `bun test`. Aucune preuve OS physique supplémentaire. Aucun refus natif nouveau, Git/install/config globale/process traceur/Docker.

Les9PASS antérieurs restent dans la portée science/source/entrées/oracles inchangés, pas comme PASS du nouvel observateur ni450. Le run inspecté **1/1 reste consommé** ; les0..207 ont416pairfiles, pas de PASS global ;208 demeure historiquement incomplet ;209..449 ne sont pas réputés exécutés/qualifiés. Tout nouveau lancement exige **arbitrage distinct après livraison/typing/revue**. Global numeric NON CLOS.
