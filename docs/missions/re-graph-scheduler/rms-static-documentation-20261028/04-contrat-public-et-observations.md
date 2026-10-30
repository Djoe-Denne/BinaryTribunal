# 4. Contrat public et observations OpenCode

Date : 28 octobre 2026. **Accepté dans sa portée documentaire après revue
indépendante et validation parent. Aucun parcours natif exécuté.**

## Référentiel, états et livraison déjà disponible

Chemins relatifs à `re-ff8` : `H` = `tools/ff8-harness` ;
`C` = `.tmp/m2-s1-integration-r2/tools/ff8-harness` ;
`D` = `docs/missions/re-graph-scheduler` ;
`M` = `.opencode/missions/team_mvnxgnse_0000_39vpc8` ;
`S1` = `M/inputs/s1-contract-r2/proposal`.

**Fait** : source lue ; **inférence** : conséquence statique à vérifier dans sa
portée ; **proposition** : non ratifiée ; **inconnu** : non établi, pas absent
universellement. Les états de réutilisation gardent le sens de
[Preuves et versions](01-preuves-et-versions.md).

La préparation publique existe : rapports M2
`57-public-preparation-ro-et-politique-locale.md:17–25`,
`58-public-tdd-ajoute-et-clarification-ro.md:11–25`,
`62-plan-public-ro-recu-sans-go.md:5–22`.
L’auteur a retrouvé la restitution publique dans l’archive QMD `ff8-wiki`,
`_raw/rms-m2-opencode-20261028/ses_e856561f3ffe3wWOJlK5b1sUgv--001.md:4556–4594`,
message `msg_17aa2ac190018gvDkdPemmAjAM` : proposition de classification/redaction
des erreurs et validation snapshot/receipt, avec owner unique de `client.ts`.
Cette livraison est à reprendre ; ses commandes, budgets et fixtures ne sont
pas autorisés par leur présence dans l’archive. QMD ne remplace pas le contrat.

Le suffixe public historique ajoute 3 297 octets au préfixe GO de 7 167 octets,
soit un fichier test actuel de 10 464 octets ; ses 23 cas restent NON EXÉCUTÉS.
Le typing de composition excluait ce suffixe : rapport M2 64:25–37.
La coordination body/S2 historique ne rend pas S1 DATA ultérieurement accepté
« non ratifié » ; elle n’en élargit pas non plus la portée.

## 1. Route de code publique, preuve native RMS non acquise

**Fait, acquis de code :** `H/src/client.ts:182–195`, `connectPublic`, découvre
un service via `Service.discover`, construit le client authentifié puis appelle
`location.get`, `plugin.list`, `server.info` et le RPC `ensemble.execution.v1`
dans `location.directory`. La fonction ne démarre pas explicitement un service ;
les appels de découverte peuvent initialiser cette localisation. Le résultat
de `plugin.list` n’identifie pas par contrôle le bridge attendu. `serverVersion`
est conservé, sans preuve de compatibilité avec le plugin déployé.

Le SDK est épinglé à `2.0.26` (`H/package.json:17–18`).
`ExecutionClient.call` exige `response.version === 1`, et `capabilities` exige
`rpc`, `fresh`, `replay` (`client.ts:55–85`). Ne pas confondre ces versions avec
la version OpenCode, celle du plugin ou `l8-graph-run-v2`.

**Consommateurs lus :** `H/src/cli.ts:63–77` compose `ExecutionClient`,
`EnsembleBridge` et l’Engine historique. Les références symboliques parent
retrouvent aussi `scripts/probe-bridge.ts` et `scripts/native-canary.ts` : ce sont
des consommateurs de code, pas des scénarios autorisés ou relancés.
Le chemin GraphEngine consomme des ports explicitement fixture
(`H/src/engine.ts:78–87`, `graph-engine.ts:23–31,226–229`).

**Lacune :** les sources lues n’établissent pas le raccordement natif de ces
ports. La commande administrative S2 n’était pas envoyée à un agent
(rapport M2 73:7,23–25). Un renommage ne crée pas de contrat public agent.

## 2. Corps, identité, digest et permissions

**Fait :** `captureSubmission` détache une image canonique avant les callbacks
configurés, exige une `idempotencyKey` propre et refuse les champs d’autorité
fournis par l’appelant (`client.ts:11–35`). Les getters/traps peuvent toutefois
agir pendant la capture. Le digest client porte sur cette image ;
`boundRequestBody` compare le payload durable. Mission, directory, controller et
révision sont ajoutés à l’enveloppe (`client.ts:87–124`). Principal et token sont
ajoutés lors de l’appel, sans persistance dans le body par ce chemin
(`client.ts:55–65,118–123`). Cela ne prouve pas l’absence de secrets dans tout journal.

Le binding graphe relie unité, fonction, sous-intent, attempt, exécution, versions
d’entrée, plan/snapshot/knowledge et tokens (`graph-adapter.ts:172–208`).
Intent et WorkUnit restent distincts ; une identité calculée n’est pas un ID
natif. Les commandes de ce chemin portent encore `fixture:true` et un prompt
fixture : pas un prompt public déjà admissible.

**Contrat acquis à préserver :**
`S1/07-historical-admission-projection.md:34–60` exige une projection indépendante
de la même admission historique et de son receipt. Son `requestDigest` est le
digest upstream du body historique complet, pas le hash client du seul payload,
un hash de vue ou de publication. S1 compare des DATA ; il n’authentifie pas
l’auteur ou l’admission native.

**Proposition / décision requise :** fermer le mapping Admission → commande
persistée → entrée RPC réellement émise, sans nouvelles exclusions implicites.
Conserver `actualBodyUTF8 ≤ CunitCourant ≤ CrootAcquired` sur le body complet.
L’égalité canonique ne prouve pas l’identité des octets HTTP/SDK. Ne pas persister
des credentials pour tenter d’obtenir cette preuve.

**Permissions : preuve publique bloquée.** L’adaptateur contrôle des capacités
déclarées par route (`H/src/adapter.ts:106–119`). `permissionPreflight`,
`resourceBoundary` ou `nativeAccessWitness` ne prouvent pas seuls les droits
effectivement exercés par le worker. Le contrat exige ceux de la session worker,
pas ceux du contrôleur (`H/src/domain.ts:207–215`). Profil, `Model.Ref` et droits
positifs/négatifs effectifs sont à prouver sous autorisation, sans fallback implicite.

## 3. Réponse perdue et admission ambiguë

**Fait :** `ExecutionClient.submit`, `client.ts:87–124`, persiste body et tentative
avant l’envoi. Un receipt local peut être réutilisé après contrôle de l’image.
Sans receipt, un snapshot est consulté ; le rapprochement utilise `executionId`.
Si cette exécution paraît absente, controller/CAS peuvent être actualisés.
L’absence transactionnelle est une hypothèse commentée du code, pas une propriété
serveur démontrée par cette lecture. Une réponse perdue n’autorise ni nouvelle
identité ni nouvelle origine.

GraphStore conserve une barrière plus stricte
(`H/src/graph-store.ts:659–690,717–739`) : après envoi, absence/unknown restent
des observations instantanées ; elles ne rouvrent pas automatiquement l’admission
et ne libèrent pas le travail. Un refus définitif requiert un discriminant
protocolaire et un binding de génération. Un receipt tardif peut être retenu
sans ressusciter la génération (`:691–713`).

**Inférences statiques, pas tests :** le premier envoi ne contrôle pas explicitement
`paused`, la finitude du bail ou toutes les formes malformées proposées
(`client.ts:93–115`) ; l’enregistrement du receipt ne vérifie pas localement tous
ses champs executionId/state (`:121–123`). GraphStore ajoute d’autres contrôles.
Des attentes correspondantes existent dans `test/client.test.ts:88–106`, mais
formes et politiques ne sont pas toutes ratifiées (rapport M2 62:13–19).

**Décision :** reprendre les cas après fermeture du contrat serveur, sans
annoncer un défaut natif confirmé, un PASS ou un oracle indépendant nouveau.

## 4. Refus typés : infrastructure distincte de la science

**Fait :** `client.ts:55–67` conserve `type:"execution_rejected"` seulement si
le discriminant est reçu. Une catégorie générique ne le fabrique pas. Le token
courant est masqué dans le message traité ; une redaction exhaustive n’est pas
prouvée. Le mapping spécifique des `_tag` SDK proposé dans le suffixe n’est pas
implémenté dans ce chemin lu.

Attentes auth/permission/input/schema/transport/quota à confirmer :
`test/client.test.ts:67–87`, rapport M2 62:11–17. Réutiliser les négatifs pertinents
de `test/graph-integration/protocol.test.ts:5–25` selon l’impact, sans les exécuter ici.
Panne, quota et refus de permission ne sont pas des verdicts scientifiques ;
une erreur générique ne prouve ni rejet sans worker ni arrêt du worker.

## 5. Observation terminale, récupération et publication

`FixtureExecutionPort.observe` est explicitement un observateur configuré, pas
un RPC natif inventé (`H/src/graph-adapter.ts:22–31`). Il fournit Inspection et
éventuellement terminalProof/admissionObservation.
`GraphEngine.observe` (`graph-engine.ts:327–360`) vérifie les bindings d’admission
et ne retient un résultat achevé qu’après preuve terminale. Les autres statuts
ne produisent pas automatiquement cette preuve.

`graph-store.ts:914–936` exige notamment executionId, requestDigest, état,
`quiescent:true`, source et receipt accepté lié. Une absence après envoi reste
audit-only ; un bail expiré n’est pas une preuve de fin.
`graph-adapter.ts:268–275` exige aussi session/auteur, fraîcheur, modèle exact,
absence de réutilisation et résultat validé. L’Inspection legacy n’est pas une
preuve équivalente : `adapter.ts:174–202` rapproche notamment `stop_requested`
de `failed`, sans démontrer une quiescence native.

**Inconnu indispensable au futur contrat public :** quels événements/reçus natifs,
versions et garanties permettent ces joins et attestent réellement la fin ?
Relier admission, session, `Model.Ref`, résultat, preuve terminale et provenance.
Les noms exacts d’événements et leur sémantique ne sont pas établis ici.
L’indisponibilité d’un fournisseur ne prouve pas l’interruption d’une exécution.
L’adaptation au remplacement conserve le seul delta worker-a vrai → faux,
sans changer worker-b, compte partagé, modèle ou droits racine.

Le rapport M2 181:23–29,45–53,63–71 établit historiquement récupération/réveil
Ensemble, pas leur raccordement RMS. La notification, la récupération, la lecture,
l’acceptation et la publication sont distinctes. Le paquet observé avec OpenCode
2.1.4 ne prouve pas à lui seul le contrat RPC.
COMMITTED appartient à la WorkUnit après KnowledgeCommit/readback requis
(`D/contract/CONTRAT.md:465–502`). Ni session completed ni tâche Ensemble terminée
ne débloque par elle-même le prochain travail scientifique.

## 6. Proposition minimale et futur préflight, non autorisants

**Proposition :** conserver client, transport public et coordination Ensemble ;
préciser un raccord d’observation borné aux ports et consommateurs existants.
Un port natif distinct ou une modification du contrat public est une décision
de frontière à arbitrer avant implémentation, pas un simple renommage.

**Alternative rejetée :** second récupérateur/watcher RMS, ou terminalProof déduite
de l’inactivité/team_results : autorité concurrente sans preuve de fin. Ne pas
non plus étiqueter un port fixture « natif » pour franchir son garde.

Le futur préflight devra fermer, avant toute exécution :

1. Sources/pins du client, du serveur RPC et du paquet actif, compatibilité/capacités.
2. Formes et portée des snapshots, receipts, erreurs et observations terminales.
3. Body/idempotence/CAS, owner unique de `client.ts`, transfert exact depuis `C`.
4. Autorisations natives explicites, ownership des sessions et état OWN neuf permis.
5. Budget fini, négatifs pertinents, preuves attendues et conditions d’arrêt.

Réutiliser client/protocol/L7 selon l’impact ; les budgets historiques ne migrent
pas. Quinze secondes, origines et trois chemins threads interdits restent intacts.
Une source ou garantie native indispensable manquante bloque la preuve concernée,
pas une permission d’inventer un test plus faible.

## 7. Contrôles parent, provenance et limites

Les quatre fichiers H/C suivants sont égaux octet pour octet, constat auteur
indépendamment reproduit par le parent :

- `src/client.ts`, 16 526 octets,
  `620c690b1dca3c4f47e9e428d6441df331b1b39c576ebd6545fa74e4d685656d`.
- `src/graph-adapter.ts`, 36 895 octets,
  `4099bc81c057b69a45aacfe37a99fe0d5a66e3e49505685a5495d2639798807a`.
- `src/graph-engine.ts`, 54 464 octets,
  `1b305b78c104db94f98858f6013d955959b4797bbc894a1529efa20ee16da554`.
- `test/client.test.ts`, 10 464 octets,
  `0d1100e1671aeea648bd5593887424c2b8d65595f935272a1a8deb12a2d1e5d0`.

Le parent a relu symboliquement `submit`, `connectPublic`, le port fixture et
`GraphEngine.observe`, ainsi que les références de `connectPublic`. Serena est
attaché à `retro-eng`, sans réactivation. La couverture n’est pas une preuve
d’exhaustivité de tous les consommateurs, notamment hors racine commune.

L’auteur a subi un refus `external_directory` pour les sources du plugin externe
et ne l’a pas contourné. Le parent a effectué une recherche exacte de
`ensemble.execution.v1` dans le dépôt local `opencode-ensemble-session`, sans
résultat : cela ne prouve pas l’absence globale d’un handler, ni l’identité du
code déployé. Le handler serveur et ses garanties restent non vérifiés dans ce
dossier ; fournir une source autorisée épinglée avant leur future ratification.

La livraison a été retrouvée nativement après un défaut de récupération, sans
réaffectation. La revue indépendante a couvert notamment les digests, ambiguïtés,
terminalité et frontières d’autorité, sans bloquant documentaire.

**NON EXÉCUTÉS :** tests client/protocol, `bun run typecheck`,
`bun run test:q1-primitives`, `bun test`. Aucun module produit évalué, base ouverte,
service ou événement natif de démonstration appelé, fichier source modifié.
Ce document ne clôt pas les lacunes publiques ni le logiciel.
