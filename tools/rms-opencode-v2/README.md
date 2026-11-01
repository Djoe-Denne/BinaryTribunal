# RMS OpenCode V2 — client d'exécution public

Ce package utilise le SDK officiel OpenCode et les exports publics d'exécution
Ensemble. OpenCode porte la sécurité et les permissions ; RMS n'ajoute ni acteur
d'autorisation ni grants.

Le plugin prépare une fabrique sans inventer de mission active et sans appel RPC
spontané. Un futur consommateur métier doit fournir explicitement son scope.
Le client implémente `submit`, `observe` et `reconcile` sur le protocole V2 existant :
une requête capturée, un seul appel SDK, une réponse capturée et liée aux octets
de la requête. Les capacités vides restent valides ; seules les offres composées
de ces trois opérations sont projetables, sans filtrage silencieux de `control`.
`control` reste `not yet implemented: control` localement avant toute inspection
des entrées ou RPC, même fermé. Aucun refus « avant effet » n'est fabriqué.

La même fabrique retourne un port enrichi localement de `submitCaptured`,
`observeCaptured` et `reconcileCaptured`. Ils renvoient `{request,response,observation}`
ou `{request,response,observations}` ; les dispositions et enveloppes intégrales
restent dans `response`. Les méthodes V1 utilisent ces mêmes appels, jamais un
second envoi. Submit/reconcile ne projettent que `current` ; une admission
`audit-only` reste dans une erreur `ExecutionResponseNotProjected`. Observe garde
toutes les observations, y compris étrangères/audit-only, sans filtre.

Entrée invalide ou fermeture avant envoi : aucun RPC. Une erreur SDK conserve son
identité et n'est jamais retentée. Une réponse mal formée, mal liée, non projetable
ou arrivée après fermeture reste entière (brute ou capturée) dans
`ExecutionResponseNotProjected`, avec la requête et la cause. Les images RMS V1
Unicode/CRLF sont préservées ; les limites d'image V2 et le cap d'observation de la
commande submit sont contrôlés. Il n'existe ici ni store/cache/journal ni callback
d'audit : le futur consommateur persistera ces enveloppes dans son outbox existante.

Le plugin possède un `AbortController` dont le signal est passé dans les options
RPC officielles. `dispose` idempotent l'aborte et ferme les ports. Un serveur qui
ignore ce signal peut répondre tard ; la réponse est conservée dans une erreur,
sans réentrée. Fermer/abandonner ne prouve ni absence d'effet ni quiescence.
Ce chemin codé n'est pas encore branché au consommateur durable GraphStore ni
qualifié dans l'hôte natif ; aucune activation ou preuve native n'est revendiquée.
Le serveur sans binding continue d'annoncer des capacités vides. HTTP reste différé
dans le harness.

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
