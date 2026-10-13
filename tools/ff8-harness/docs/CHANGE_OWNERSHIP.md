# Périmètre de développement et état antérieur

Inspection initiale des trois racines Git avant édition; capture privée :
`.tmp/external-harness-20261012/baseline.json` et `ensemble-before.patch` dans
re-ff8. Aucun reset, stash, stage, commit, amend, push ou changement de branche.

## État antérieur Ensemble conservé

Worktree :
`C:/Users/djden/AppData/Local/Temp/opencode/ensemble-mission-graph-20261011`,
branche `feature/mission-graph-readonly`.

Modifiés avant cette tâche : `docs/task-pool.md`, `opencode.json`,
`src/capacity-delivery.ts`, `src/capacity-runtime.ts`, `src/dispatch.ts`,
`src/process.ts`, `src/tools/team-spawn.ts`, `src/v2-continuity.ts`,
`src/v2-events.ts`, `src/v2-setup.ts`, `test/tools/team-spawn.test.ts`,
`test/v2-continuity.test.ts`, `test/v2-setup.test.ts`.
Non suivis préexistants : `src/team-scope.ts`, `test/process.test.ts`,
`test/team-scope.test.ts`.

Le correctif de cloisonnement et ses tests restent dans ce worktree. Les fichiers
effectifs du worktree font autorité, pas les résultats d'un index du dépôt main.
Les points d'intégration ajoutés à des fichiers déjà modifiés sont génériques :
garde d'admission/exécution, service partagé et registration RPC. Le patch initial
est conservé séparément pour distinguer les deux couches de changement.

## Notre travail

FF8 : nouveaux fichiers uniquement sous `tools/ff8-harness/` (moteur, client,
adaptateurs, CLI, profils scientifiques, schémas, fixtures, tests, documentation,
preuves), plus evidence privée ignorée sous `.tmp/external-harness-20261012/`.
Les fixtures natives utilisent des répertoires nouveaux, identifiés, sous le
Temp/OpenCode approuvé; ce ne sont ni des worktrees du run01 ni ses données.

Ensemble : nouveaux `src/execution-*.ts`, tests génériques correspondants,
documentation du pont et intégrations minimales dans les services partagés,
types, export de contrat et setup V2. Aucune connaissance métier FF8 n'y est
implémentée. Les wrappers de canary, ignorés sous `.tmp/`, n'importent que le
setup **générique**, avec une base isolée et les SDK publics externes.

Le dépôt principal `C:/Users/djden/source/repos/opencode-ensemble-session`
(branche `feature/session-continuity`) n'a pas été modifié par cette tâche.
L'installation globale du plugin n'a pas été remplacée ou publiée.

## Frontière run01

L'arrêt décidé n'est pas une preuve de clôture RE. Cette tâche n'a demandé
aucune admission, reprise, tâche, mutation de registre ou politique pour run01.
Le chargeur runtime refuse son identifiant historique. Il n'y a eu ni dump du
jeu, campagne live, commande power, modification IDB ou publication scientifique
FF8 réelle. Les bases et artefacts initiaux FF8 sont laissés en place.
