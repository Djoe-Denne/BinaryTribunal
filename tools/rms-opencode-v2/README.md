# RMS OpenCode V2 — premier raccord statique

Ce package utilise le SDK officiel OpenCode et les exports publics d'exécution
Ensemble. OpenCode porte la sécurité et les permissions ; RMS n'ajoute ni acteur
d'autorisation ni grants.

Le plugin prépare une fabrique sans inventer de mission active et sans appel RPC
spontané. Un futur consommateur métier doit fournir explicitement son scope.
Seules les capacités vides sont projetées. `submit`, `observe`, `reconcile` et
`control` refusent localement avec `not yet implemented: <opération>` avant tout
appel RPC, même si le serveur accepterait la demande. Aucun reçu métier de refus
avant effet n'est fabriqué. Les réponses de capacités inattendues restent conservées
intégralement dans `ExecutionResponseNotProjected` ; aucun audit durable ni
projection d'exécution n'est livré.
Ce package n'est pas une livraison d'exécution durable ou une preuve de chargement
natif. HTTP reste différé dans le harness.

## Préparation et contrôles ciblés

Depuis ce répertoire, après inspection des imports :

```powershell
bun install --offline --ignore-scripts
bun run typecheck
bun test test/plugin-lifecycle.test.ts test/adapter-parity.test.ts --timeout 15000
```

Aucun script d'installation, réseau, hôte ou modèle n'est nécessaire aux tests.
Les doubles SDK prouvent uniquement les contrats et le cycle de vie statique.

## Dépendance locale Ensemble

La copie Bun d'une dépendance `file:` vers le dossier frère échoue sous Windows.
L'archive standard versionnée sous `vendor/` remplace uniquement ce format local.
Elle provient du commit accepté décrit par `vendor/ensemble-source.json`, pas
des modifications non committées du dépôt frère. Les deux modules publics gardent
leurs octets exacts et aucun module privé Ensemble n'est importé par RMS.

Pour la renouveler, exporter uniquement les racines publiables du commit retenu
avec `git archive`, puis utiliser `bun pm pack --ignore-scripts` depuis cet export
isolé. Vérifier la licence, les chemins, les octets des deux modules publics et
l'empreinte de l'archive ; actualiser ensuite le manifeste et le verrou. Ne pas
copier de dossier de travail, de configuration, de base vivante ou de dépendances
installées. Ne pas publier l'archive à distance implicitement.
