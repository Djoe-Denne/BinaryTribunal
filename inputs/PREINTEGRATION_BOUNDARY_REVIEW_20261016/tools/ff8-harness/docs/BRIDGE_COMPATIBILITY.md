# Compatibilité du pont public

Client : `@opencode/client` **2.0.26**, Bun **1.4.2**, RPC
`ensemble.execution.v1`. Le serveur réellement interrogé lors du développement
est **2.0.27**; un catalogue ou un test unitaire ne prouve pas une exécution native.
Le contrat générique et ses tests sont dans le worktree Ensemble autorisé :
`src/execution-rpc.ts`, `docs/execution-bridge-v1.md`, `test/execution*.test.ts`.

`connectPublic` emploie `Service.discover`, `Service.headers`, `OpenCode.make`,
les appels RPC publics avec location explicite. Aucune URL locale non authentifiée,
aucune lecture/écriture d'`ensemble.db`, aucune dépendance aux API internes.
Le token opérateur vient d'une variable d'environnement et n'est pas enregistré
dans la base FF8. Le serveur vérifie aussi une autorité opérateur distincte de
l'authentification de transport, liée à la mission et au répertoire exact.

## Capacités et écarts vérifiés

- Un package local doit avoir `index.ts`/`index.js` ou `server.ts`/`server.js`.
  Sur le serveur testé, le simple fichier configuré et le répertoire avec
  seulement `isolated.ts` n'ont pas chargé le pont. La forme explicite
  `{ "package": "répertoire" }` et un point d'entrée conventionnel fonctionnent.
- Le SDK réserve le nom de méthode `events`; le journal se lit par `replay`.
- `SessionNotFoundError` a un `_tag` spécifique et peut avoir un message vide.
  Il ne faut pas le confondre avec une erreur de transport/contexte.
- Le client et le SDK publics acceptent un ID natif préalloué de session.
  Le pont journalise cet ID avant création et vérifie ensuite son appropriation.
- V1 du pont : fresh seulement, worktree false, une tentative par tâche.
  Fork/checkpoint/compact-fork sont refusés, **jamais** remplacés par fresh.
  Les API de continuité historiques restent inchangées.
- Aucun query `permission.evaluate` n'existe dans le SDK installé. `native-query`
  reste indisponible/fail-closed. `native-boundary-witness` est un mode **distinct
  explicitement choisi** : frontière restrictive au hook public `execute.before`
  sur les paramètres réels des outils fichiers supportés, sans forcer allow,
  puis témoins des opérations leaf effectivement réussies à `execute.after`.
  Un résultat terminé sans témoins requis est bloqué par le harnais.
- Les essais natifs ont montré que le hook public `permission.evaluate`, bien
  que disponible à l'enregistrement, n'est pas émis par les outils fichiers
  testés. Il n'est donc pas utilisé comme preuve de leur exécution. Les tuples
  `(messageID, callID, tool)` distinguent une opération leaf d'un succès Code Mode
  umbrella. Un call opaque ou non mappable n'obtient pas de preuve inventée.
- La récupération de callbacks manqués utilise uniquement les métadonnées
  natives structurées de la session possédée, liées à un before-check durable.
  Une preuve absente/ambiguë reste bloquante, sans renvoi aveugle ou nouvelle
  session. Les refus natifs de permissions restent des refus.
- Le contrôle de permissions n'est pas une isolation OS hostile parfaite.
  Code Mode reste soumis aux règles et outils exposés; pas de prétention de
  sandbox de sécurité générale ou d'« exactly once » distribué.

## Extensions publiques nécessaires pour la publication IDB autonome

Le binding FF8 `native-publication-rpc.ts` reste indisponible sans un cycle
d'invocation natif complet. Trouver `py_eval` dans `tool.list()` ne suffit pas;
appeler directement son callback ne doit pas contourner hooks/permissions.
Le minimum côté SDK OpenCode serait une opération publique d'invocation de
tool avec session appropriée, permission, hooks, identité de call/message et
résultat durable, accompagnée d'une évaluation de permissions publique si le
binding exige la pré-vérification. Ces capacités sont génériques et ne doivent
introduire aucune connaissance FF8 dans Ensemble. Aucun contournement privé
ou accès HTTP direct à IDA n'est livré.
