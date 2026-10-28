# Harnais déterministe FF8 — v1

Le métier est ici, dans **re-ff8**. Ensemble exécute les tâches génériques et
gère capacité/sessions; le harnais ne crée pas un deuxième scheduler de workers.
Les workers décident scientifiquement; le code contrôle les transitions.
**run01 reste arrêté et n'est ni repris ni techniquement déclaré clôturé.**

Extension opt-in : [accès par rôle et partage entre R](docs/ROLE_ACCESS.md).
La sortie finale stricte et les autorisations de communication sont deux
contrats distincts ; les profils de production restent à vérifier en natif.

## M1 — dépendances et couverture, 2026-10-20

Le paquet présent est **`@re-ff8/mission-harness`**, privé, Bun/TypeScript.
Ses entrées sont le CLI `src/cli.ts` et les scripts déclarés dans `package.json`.
Ce checkout ne démontre pas l'installation d'un **plugin RMS OpenCode V2
générique** ; Ensemble n'est pas ce plugin. Aucun nouvel orchestrateur ni
changement de configuration globale n'est introduit ici.

**M1 reste BLOCKED.** Le port data-only
`src/generic-target-primitives.ts` couvre les constantes Q1 et l'encodage argv
Windows (UTF-16, quoting, bornes et refus), ainsi que le comptage autonome des
octets de contrôle. Il ne construit pas un plan Q1, n'applique pas sa politique
de flags/allowlist et n'implémente ni le broker Q2a ni le coordinateur Q2b1.
Le golden canonique conservé dans les fixtures est une référence indépendante,
pas une sortie de codec ni une preuve d'autorisation ou de confinement OS.

```powershell
bun run test:q1-primitives
```

Cette suite autonome utilise seulement Bun/TS et ses littéraux de référence ;
elle ne lit pas les sources historiques, ne compile ni ne charge .NET, et ne
lance aucune cible. Elle ne remplace **pas** les contrats Q1/Q2 encore absents.
Les anciennes gates compile/run et préparations de `.tmp/` restent des preuves
gelées, inchangées ; ne pas les relancer comme une route M1 sans C#.
Un timeout OpenCode/Bun ne remplace jamais les garanties d'arrêt des descendants,
de Job/handles, de readback/ACK ou de progression native.

Le développement du helper Windows est conservé sur
`dev/windows-process-supervision`, commit
`9f789ff931a3dfe2aeb6497addd067368faffb88`, avec ses limites et preuves rouges.
Voir l'[index de conservation](../../docs/missions/re-graph-scheduler/M1_HELPER_PRESERVATION_20261020.md)
et le [mapping exhaustif ancien scénario → test/absence](../../docs/missions/re-graph-scheduler/M1_REMPLACEMENTS_20261020.md).
Aucune garantie requise sans équivalent vérifié n'est réputée différée ou acquise.

## Installation locale et contrôle

```powershell
cd C:/Users/djden/source/repos/retro-eng/re-ff8/tools/ff8-harness
bun install
bun run typecheck
bun test
bun run build
```

Préparer un exemple **synthétique**, sans admission native, avec un token choisi
dans votre shell (ne pas le mettre dans un fichier ni une commande journalisée) :

```powershell
# FF8_EXECUTION_TOKEN doit déjà exister dans l'environnement du shell.
bun scripts/configure-fixture.ts <worktree-Ensemble> <provider/model#variant>
```

Cette commande affiche les chemins `runtime` et `state` à reprendre ci-dessous.
Elle configure uniquement une location canary isolée et un wrapper générique
du plugin, pas l'installation globale. Elle ne touche ni run01 ni son registre.

```powershell
bun src/cli.ts init     --config <runtime.json> --state <harness.db>
bun src/cli.ts run      --config <runtime.json> --state <harness.db> --max-steps 600 --interval-ms 1000
bun src/cli.ts status   --config <runtime.json> --state <harness.db>
bun src/cli.ts pause    --config <runtime.json> --state <harness.db>
bun src/cli.ts diagnose --config <runtime.json> --state <harness.db>
bun src/cli.ts resume   --config <runtime.json> --state <harness.db>
bun src/cli.ts recover  --config <runtime.json> --state <harness.db>
bun src/cli.ts stop     --config <runtime.json> --state <harness.db>
```

`status` est offline, sans token ni accès Ensemble. `tick` fait une transition;
`run` est borné et exige cadence/budget explicites. Pause suspend les admissions,
pas les sessions déjà en cours. Stop demande l'arrêt des seules exécutions de
cette mission et conserve les branches avant abort. Un `controlPending` signifie
que l'arrêt/pause n'est pas encore confirmé; reprendre la commande ou `tick`,
pas modifier les bases à la main. Une mission stopped ne se réarme pas.

Après interruption : même config, mêmes bases propres et mêmes identifiants.
Le client retrouve l'intention immutable et sa réception; une répétition ne
créera pas un second worker. Révision et bail empêchent deux contrôleurs actifs.
`recover` exige un bail expiré; ne pas voler un bail actif. Les transports
ambigus non résolus sont conservés, sans nouveau fresh ou renvoi aveugle.

Pendant une opération externe, un heartbeat à `leaseMs / 3` maintient le bail
de la base **propre** du contrôleur. Il ne réacquiert jamais un bail expiré ou
fencé, ne change ni le token ni la révision CAS, et s'arrête au retour/échec de
l'opération. Un blocage de l'event loop au-delà du TTL échoue fermé. Ce heartbeat
local ne remplace pas le bail d'admission RPC, contrôlé séparément par le pont.

## Machine scientifique

Exploration incrémentale → regroupement → évaluation versionnée → sous-ensemble
easy-first figé → A/B fresh aveugles → R → validation → publication/consolidation.
Identité = SHA256 binaire + version + adresse normalisée. Difficulté > seuil est
différée; aucun groupe ne force un membre difficile dans le sous-ensemble.
La méthode/version, le seuil, taille **ou** budget, limites de cycles, stagnation
et `retryPolicy: {maxAttempts,retryDelayMs}` en mode réel doivent être explicitement
configurés. Les valeurs de la fixture ne calibrent
aucun seuil de production. Les évaluations et leurs preuves sont append-only;
une baisse exige des preuves nouvelles.

Chaque tâche reçoit une projection propre versionnée, hashes/provenance,
consignes scientifiques accessibles, références effectives et outputPath exact.
Les permissions du superviseur ne prouvent pas celles du worker. Les inputs
manquants/altérés, refus de lecture/listing et outils absents sont distincts.
Un hash seul ne prouve ni couverture ASM ni complétude scientifique.
Les sélections natives persistées/overrides explicites font autorité, pas une
ancienne mention de modèle dans un manifest ou un prompt historique.

Toutes les réconciliations sont conservées :
- **certain** : contrat établi dans le périmètre de preuve, contradictions
  pertinentes résolues; acquired seulement après publication et relecture;
- **likely** : conclusion privilégiée, obligations/preuves encore manquantes;
- **unlikely** : proposition réfutée ou insuffisamment étayée;
- **blocked** : cause précise empêchant le jugement ou la validation.

Ce ne sont pas des probabilités. likely/unlikely sont reportés au cycle suivant;
une exploration identique sans nouveaux faits/pistes est suspendue en stagnation,
sans hausse de seuil ou de permissions. Les empreintes sont suivies par fonction :
un fait acquis sans relation avec la cible, ou un changement de composition du
sous-ensemble, ne relance pas une analyse identique. Seules les conclusions R
explicitement publiées et relues deviennent faits communs ; pas les propositions
privées A/B. Publication en échec reprend la
publication/relecture, **pas** l'analyse. Un task completed sans résultat JSON
acceptable est bloqué; completed Ensemble n'est jamais acquis FF8.

## Cibles et limites

La cible canonique confirmée par l'utilisateur est **IDB IDA + docs**, pas une
« HDB » supposée. Voir [publication IDA](docs/IDA_PUBLICATION.md). L'adaptateur
IDB est testé offline et fail-closed : il exige attestation native §5.6,
appropriation/fencing parent et binding natif public sûr. Ce binding complet
n'est pas disponible dans le SDK installé. **Il ne faut pas déclarer la
publication IDB autonome opérationnelle.** Le mode fixture écrit/re-lit une base
locale propre, jamais une IDB; il refuse des findings réels.

V1 fournit un pipeline scientifique 2+1 par mission, configurable par ses
consignes (sémantique ou C). Les doubles pipelines séparés C puis sémantique,
la continuité crash-safe et les worktrees ne sont pas automatisés ici. Pas de
fallback payant, d'installation globale, de lancement live, de git commit/push.

Contrats : `src/domain.ts`, `src/validation.ts`, `schemas/`. Les validations
cross-field exécutées par le code complètent les schémas JSON. Configuration
runtime : `src/runtime.ts`; exemple généré : `configure-fixture.ts`.

## Canary natif isolé

**2026-10-13 — PASS natif strict complet, essai 16** : cinq sessions fresh
`openai/gpt-6-astra#high`, schémas transmis et captures vérifiées, reprise,
sentinelle refusée, une publication fixture/readback et clôture confirmée.
Voir [l'état et les preuves](docs/RESUME_STATUS.md). Il ne s'agit pas d'une
publication IDA/IDB réelle ; aucun plugin global n'a été remplacé.

`durationSeconds` fixe le budget global en temps monotone (défaut 600, maximum
1200 secondes). Une relance à 20 minutes doit passer explicitement `1200`.
Le budget ne repart pas à zéro lors de la reprise du contrôleur. L'expiration
est contrôlée entre les ticks et à leur retour : un appel externe déjà engagé
est attendu avant la collecte d'échec/arrêt, jamais abandonné sous une base fermée.
La preuve enregistre `durationMs` ainsi que le temps effectivement écoulé.

```powershell
bun scripts/probe-bridge.ts <worktree-Ensemble> <provider/model#variant>
bun scripts/native-canary.ts <worktree-Ensemble> <provider/model#variant> <preuve.json> [durationSeconds] [outputMode=json-schema-strict]
```

Le probe ne lance aucun worker. Le canary utilise de **vraies** sessions/modèles
via RPC public authentifié, cinq étapes scientifiques synthétiques, coupure
de réponse injectée **après création native vérifiée**, réouverture des bases,
rejeu, validation et une sauvegarde locale relue. Il échoue plutôt que de cacher
une capacité manquante ou de présenter un mock comme opérationnel. Ce n'est pas
une publication scientifique FF8 réelle ni une validation live du jeu.

Le nouveau canary et `configure-fixture.ts` exigent par défaut une sortie à
**JSON Schema strict**. La route implémentée est OpenAI Responses ; un flag
catalogue `structured_output` ou le mode `json_object` ne suffit pas. Route
inconnue, hook manquant, schéma non supporté ou capture invalide : refus sans
changement de modèle ni repli silencieux. `file` reste un mode legacy explicitement
distinct, pas une stratégie de secours. Voir [STRICT_OUTPUT](docs/STRICT_OUTPUT.md).

En mode strict, les workers n'écrivent plus de fichier : ils lisent leurs inputs,
rendent le payload schema-bound, puis le contrôleur valide, ajoute le header
immuable et sérialise avec readback. Les preuves conservent les schémas, les hashes
et les références natives de requête/capture. Aucune fake attestation `edit`.
Créer `STOP_REQUESTED` dans la racine du canary permet son arrêt contrôlé sans
perdre le token éphémère ; la clôture est relue via le pont et enregistrée séparément.

Avenant canary autorisé le 2026-10-12 : ses profils isolés peuvent autoriser
`read/edit` au niveau outil, **uniquement** derrière les guards publics
`execute.before/after` qui imposent chaque chemin exact. Un fichier sentinelle
hors frontière doit être refusé nativement ; sans cette preuve négative, aucun
PASS n'est émis. Ce mode ne change aucun profil de production. Le générateur
`configure-fixture.ts` conserve par défaut les profils à ressources bornées ;
il ne transforme pas l'avenant de diagnostic en autorisation permanente.
En mode strict l'exception canary porte seulement sur `read` ; `edit` reste refusé.

Compatibilité et écarts vérifiés : [BRIDGE_COMPATIBILITY](docs/BRIDGE_COMPATIBILITY.md).
Périmètre et changements préexistants : [CHANGE_OWNERSHIP](docs/CHANGE_OWNERSHIP.md).
Tests/evidence parent : `evidence/` quand présents; logs complets privés restent
dans `.tmp/external-harness-20261012/` du dépôt et dans la location canary.
