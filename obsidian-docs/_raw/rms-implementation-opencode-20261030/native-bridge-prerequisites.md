# Prérequis du pont natif — consultation architecte existant uniquement

## Objectif

Continuer la réalisation RMS déjà autorisée : établir la jonction native manquante sans prétendre qu'un port de fixture est natif, sans modifier la configuration globale ou installer un service important implicitement. Le parent garde les décisions et l'acceptation. Aucun code ou déploiement autorisé par ce fichier.

## Observation nouvelle et autorisée

L'API documentée OpenCodeV2 GET `/api/plugin`, avec `location[directory]` du canonique, rapporte le plugin `ensemble` actif, source locale `C:/Users/djden/.config/opencode/local-plugins/ensemble/20261028-longrun-no-pm-timeout-ae4ed85a4709/index.js`. Le parent a ensuite lu package.json et les extraits ci-dessous par les outils fichiers ordinaires : lecture réussie, pas refus courant contourné. L'ancien refus d'un worker demeure historique et ne constitue plus à lui seul une absence de source actuelle pour le parent.

Version du package : `0.19.0-local.20261028.longrun.shaae4ed85a4709`. Hash présent index.js : `ae4ed85a4709b8dbf371c950b589cdb1c8e5eae2e9c859eec71cf46cad74e57e`,1553581 octets. Métadonnées et limites dans `evidence/native-plugin-current-source-r1.json`. Ce hash n'est pas une extraction de la mémoire exécutée ; aucun reload ou appel d'exécution.

## Extraits lus par le parent

Définition index.js:19679–19731, structure exacte réduite aux noms :

```js
// src/rpc.ts
var EnsembleRpc = define2({
  id: "ensemble",
  methods: {
    summary: { /* input {team}, output {text} */ },
    teamContext: { /* input {sessionID}, output {team,members,tasks} */ }
  },
  // events follow
});
```

Enregistrement index.js:22707–22729 :

```js
let rpc = null;
try {
  rpc = await ctx.rpc.register(EnsembleRpc, {
    summary: async (input) => { /* reads team summary */ },
    teamContext: async (input) => { /* reads associated team members/tasks */ }
  });
} catch (err) { /* logs failure */ }
```

Les commentaires résument les corps, pas une copie complète ; les bornes source permettent de contrôler. La recherche exacte de `ensemble.execution.v1` dans cette entrée n'a aucun résultat. Pas de conclusion universelle pour tous les plugins ou un RPC dynamique inconnu.

RMS, tools/ff8-harness/src/client.ts:109–110,242, appelle au contraire `ensemble.execution.v1`, vérifie capabilities `{rpc,fresh:true,replay:true}` et attend capabilities/ensureTeam/submit/snapshot/control/stop/inspect/bulletinSnapshot/replay. Les méthodes prospectives submitRuntime/observeRuntime refusent actuellement la route non qualifiée. Les sept fichiers projection et les preuves hors ligne restent intégrés au commit05c3c532.

## Question bornée de conception

Conseiller une jonction **minimale et honnête** à partir de l'existant autorisé : peut-on mapper ce contrat au noyau public V2 et aux mécanismes Ensemble actuels sans second ordonnanceur/store, nouveau handler important ou modification globale ? Sinon, préciser quel composant réellement manquant devrait être construit et pourquoi il constitue ou non une extension importante à arbitrer, avant toute réalisation.

Examiner les garanties requises : idempotence durable avant effet, compare-and-swap/version/ownership, sessions fraîches avec Model.Ref et permissions effectives, observations terminales réellement natives, résultats tardifs sans autorité. Le provider de test et les callbacks parent ne suffisent pas. Pas de dérivation d'autorité depuis un simple statut completed. Le budget10min/test ne lève pas HOLD125/diagnostic gelé/quatreorigines/scientifique ou liveFF8.

## Périmètre consultatif

Même architecte que la consultation initiale, pas second conseiller ou chaîne de spécialistes. Lecture/recherche Internet autorisée sur sources publiques sans secrets ; documentation V2 officielle et API locale GET seulement si les permissions du profil le permettent. Pas de RPC d'exécution, écriture de DB, installation, reload, changement de configuration/source globale, lancement d'agent natif de test ou contournement d'un refus. Si source externe refusée, utiliser ces extraits et signaler précisément la limite ; pas d'autre outil pour accéder au même fichier refusé.

Retour court : option recommandée, vrais prérequis/surfaces à modifier, garanties réalisables/manquantes, portée et étape suivante testable. Ne pas proposer un projet complet ou annoncer une fonctionnalité disponible par simple analogie avec les outils team_*.
