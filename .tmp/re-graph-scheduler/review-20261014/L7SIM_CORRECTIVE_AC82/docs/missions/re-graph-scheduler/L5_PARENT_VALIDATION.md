# L5 — validation parent hors ligne

Mission `re-graph-scheduler-20261013`, 2026-10-13. **ACCEPTÉ après correctif parent**, pour intégration modulaire ; ni runtime L8, ni revue indépendante L9, ni preuve native/live validés par ce document.

## Entrée et contrôle de périmètre

- Worker `l5-planner-r2`, session `ses_ec9ebcb34ffegHRDbMX6u8vx4s`, Model.Ref natif relu `openai/gpt-6.1-sol/high`.
- Trois fichiers du lot : `src/planner.ts`, `src/scc.ts`, `test/planner.test.ts` sous `tools/ff8-harness`.
- Seul autre tracked M dans le worktree : `test/graph-contract.test.ts`, correctif **parent** préalablement transféré avec manifeste ; aucune édition worker des centraux/config/schémas/fixtures/IDB.
- SHA256 initiaux reproduits exactement : planner `0ad0c80e…25b31c`, scc `564967d8…250879`, tests `7620baa1…bddf07`.

## Gates reproduits par le parent

Dans le worktree L5, via Context Mode, cwd absolu ; commandes séquentielles, Bun 1.4.2 :

- `bun run typecheck` : exit 0.
- `bun test test/planner.test.ts` initial : 41 pass, 0 fail, exit 0.
- `bun test` initial : 372 pass, 1 skip, 0 fail, 373 tests / 17 fichiers, exit 0.
- Code relu : SCC itératif/lowlinks/condensation, inversion G1, fermeture avant budgets, receipts/invalidations, sidecars et binding, G2 direct/anciens plans, ressources restantes et priorités événementielles ; pas d'acceptation sur seule prose/tests.

## Contre-exemple parent et correction

Graphe natif confirmé `A↔B`, group owned = A uniquement, arête A→B optionnelle **ou** dispense valide : sélection initiale = A seul, SCC singleton non exclusive, A sélectionné sans diagnostic. Cause : SCC calculées après la sélection affaiblie par politique (`planner.ts` closure/SCC).

Correctif conservative du parent : SCC supplémentaires sur **tout le graphe natif confirmé** ; si une SCC n'est que partiellement possédée par la sélection, diagnostic `partial-native-scc` sur les unités concernées, puis defer/fail-closed avant dispatch. Ne pas ajouter silencieusement de nouvelles fonctions possédées hors scope. L'unité indépendante C reste sélectionnable. Aucun schéma/politique/identité modifié.

Régression ajoutée avec deux variantes (optional/dispensed), A refusé, B non possédé, C admis. Après correction :

- `bun run typecheck` : exit 0.
- `bun test test/planner.test.ts` : **42 pass, 0 fail**, 3925 expect, exit 0.
- `bun test` : **373 pass, 1 skip, 0 fail**, 19333 expect, 374 tests / 17 fichiers, exit 0.

## Empreintes après correction

- planner.ts : `6ed71229c67f01a08dfd6fffcc23205706f3437a5d2eb490e46ea48694707c89`
- scc.ts : `564967d8a694c635f1b876480158dd7c08df0700adf1fbdc4c61e61b7a250879`
- planner.test.ts : `68dbb98706c4e1d8fb3c29cb6542fd1e88ffc53c906bc270a3664557b9db02b7`

## Limites à préserver pour L8/L9

Intégration main effectuée via `team_shutdown` puis `team_merge` depuis branche parent `73211b8` (worktree propre). Les trois fichiers intégrés correspondent exactement aux SHA256 ci-dessus ; le correctif L1 déjà présent dans main reste identique. Gates main reproduits : **typecheck exit0 ; 373 pass / 1 skip / 0 fail, 374 tests / 17 fichiers, exit0**. Aucun central câblé à ce stade.

- Préflight pur : aucune réservation/admission réelle. CAS/fencing/recontrôles transactionnels L6/L8 obligatoires.
- Context envelopes planner : L8 doit aussi mesurer le dossier natif réel, enveloppes/métadonnées et 2000 caractères par ligne ; une mesure planner ne dispense pas ce contrôle.
- Benchmarks worker 10k/3.59 s et SCC/69 ms non reproduits comme benchmark indépendant par ce document ; stress couvert par les tests relancés, pas certification 100k ni absence de tous worst-cases.
- Projections de types compatibles contrat à converger avec types L2 lors de L8 ; sidecars/binding doivent devenir durables et vérifiés.
- Les hashes exigés d'artefacts futurs nécessitent un binding aux connaissances réellement validées avant admission du consommateur, pas de hash d'une sortie inconnue inventé par le scheduler.
- Les preuves d'isolation native A/B/R et la publication scientifique restent des gates séparées, jamais déduites des tests fixtures.
