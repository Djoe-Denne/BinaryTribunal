# L8 A2 — plan correctif ciblé, à ratifier avant toute exécution

## 0. Statut, identité et permission effectivement utilisée

**PLAN PROPOSÉ ; aucun correctif, probe, import de code projet, test, typecheck,
SQLite ou full exécuté. L8 reste BLOCK, non accepté et non intégré.**

- Task : `task_mv6towrm_000c_24005n`, même auteur NONBLIND `l8-integration-r1`,
  session `ses_ec12fcc43ffeI6xXQ5rSTty2mV`, Sol/max existant selon le readback fourni.
- OWN : `C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l8-integration-r1`.
- Choix utilisateur : « Sol Max ciblé (Recommended) ». Il autorise la route des
  deux corrections et l'extension bornée à `client.ts`, **après plan ratifié**,
  pas l'écriture actuelle ni une commande de gate implicite.
- Permission actuelle : `PARENT_PLAN_GO.json`, 1114 B,
  SHA256 `0e8adb0ba40564e808f4be5d13e64925b7eac70525d3220fa8d4c17121c3623f`.
  Seul nouveau livrable autorisé et créé ici : ce `PLAN.md`.
- Aucun reviewer completed/shutdown rouvert ; aucun agent délégué, autre session,
  inbox, index partagé de code ou ancien chemin absolu de provenance consulté.
  Le manuel Serena a été lu ; sa connexion principale ne sert pas à lire une autre
  copie de ce worktree. Toute analyse de source ci-dessous porte sur OWN.
- La préparation séparée d'un full L7 annoncée par le parent est une information
  de coordination seulement : elle ne transforme pas le présent GO PLAN en GO gate.
  Les lectures statiques peuvent continuer pendant un créneau L7 autorisé ; aucune
  gate d'exécution concurrente n'est permise ni supposée en cours sans notification.

### État initial relu statiquement

Au `2026-10-16T12:38:55.777Z`, les 26 pins / 399374 B du paquet
`inputs/L8_A2_CORRECTIVE_USER_GO_20261016/` et les 15 fichiers runtime OWN /
321686 B correspondent aux pins fournis. Aucun DB n'a été ouvert ou rehashé pour
ce plan ; les chiffres et pins DB des anciens rapports restent de la provenance.

- Manifest d'entrée SHA256 :
  `787edd4790f947dc0eca1db8d1b5c95e6e66a7925ff6db6c4d8f11790ec2fbdb`.
- Receipt fingerprint :
  `60c3275c1d3dc8b78daadfb8431985f381bc1296b10611584c0e7ff7bdefc744`.
- `src/client.ts` : 14311 B,
  `af00b1198c8bd9b934481b9ffdd841d5738225c1e0b3a0612721b24b8f189498`.
- `src/graph-engine.ts` : 52195 B,
  `85b912589812af89f4e55ba5a8abb025eb7d2e091a3a0f1ce799b459803a9551`.
- `src/adapter.ts` reste readonly : 27495 B,
  `8da11235b4d54f2e2e1f6f5a6ec7d9b55a7e00df445deff268c187cb7cce3354`.
- Le nouveau test proposé n'existe pas à cette lecture. Le runtime15 inclut les
  deux bridges partiels hérités ; ce ne sont pas les versions des 398 inputs.
- Le full auteur historique 930 PASS / 1 SKIP et ses gels sont conservés. Il ne
  lève pas les deux contre-exemples et n'est pas relancé par ce plan.

## 1. Périmètre d'écriture proposé : exactement trois chemins

Tous les chemins ci-dessous sont relatifs à `tools/ff8-harness/` dans OWN.

1. **`src/client.ts`** : corps de `ExecutionClient.submit` et, si nécessaire,
   petits helpers locaux non exportés de capture/vérification du payload.
   Motif : le snapshot doit exister avant le premier callback configuré de ce
   client ; un correctif seulement dans le port L8 laisserait la faille héritée.
   Pas de nouvelle table, migration, méthode RPC, champ wire ou API publique.
2. **`src/graph-engine.ts`** : frontières de préparation/soumission de
   `prepareGraphExecution`, `submit`, `observe` et `fill`. Le contrôle de pause
   doit relire le journal durable et ne doit pas devenir un return global de
   `step`. Pas de nouveau compteur, refund ou protocole de preuve.
3. **`test/graph-integration/body-pause-regressions.test.ts`** : nouveau fichier
   regroupant les régressions publiques, contrôles et intercalages ci-dessous.
   Imports relatifs OWN seulement ; réutilisation readonly de `fixture-driver`.

Adapter, autres sources, les six fichiers des 60 anciens tests, fixture-driver,
L1–L6/Store/EventLog/leases/validation, schemas, package/config et tous les gels
restent readonly. L'ancien droit six sources + sept tests n'est pas réactivé.
Tout besoin d'un quatrième chemin ou d'une API L6 différente impose STOP et
extension explicite ; pas de contournement par accès privé ou SQL dans les tests.

## 2. Huit ancrages de preuve statique

Les numéros sont ceux du runtime gelé avant correction. Ce sont des constats
de lecture, pas de nouveaux résultats d'exécution.

1. **`src/client.ts:60–73`** : le digest vient de `canonical(input)` ligne 62,
   puis snapshot/renew sont attendus avant le spread de `input` ligne 70.
   Le row concurrent est relu après l'INSERT ; la receipt préexistante retourne
   ligne 65. C'est la double lecture exposée par RV8A2-01.
2. **`src/validation.ts:5–9`** : le codec courant trie les clés, filtre undefined
   dans les objets et traite les tableaux lui-même. Remplacer ce codec par
   `JSON.stringify(input)` ou par une politique arbitraire de structuredClone
   changerait potentiellement le contrat ; ce fichier ne sera pas modifié.
3. **`src/client.ts:74–94` ; `test/client.test.ts:22–27,62–65`** : les retries
   repartent du body durable, ne rafraîchissent que controller/CAS après absence
   publique et journalisent avant I/O. Le test existant a `key-1` différent de
   `exec-1` : ajouter ici leur égalité serait une nouvelle restriction injustifiée.
4. **`src/graph-engine.ts:295–339`** : `observe` appelle `submit` pour
   absent/PREPARED ; aucun guard paused à cette branche. Les autres états passent
   par l'observer, les observations liées au digest et la rétention des résultats.
5. **`src/graph-engine.ts:410–475`** : `fill` a un guard au début de sa boucle,
   mais attend `checkInputs` après ; `step` observe avant fill. Une pause peut
   donc apparaître après un journal déjà lu. Les contrôles pause/resume sont des
   événements persistants, pas seulement le texte de `view.status`.
6. **`src/graph-engine.ts:89–111,142–190`** : pin/claim/outbox sont composés
   sous le même `.immediate()`, avec fences finales ; le journal rejoue la dernière
   action de contrôle et contrôle N sur tous les intents. C'est le bon endroit
   pour refuser une préparation pausée avant ses effets, sans refaire L5/L6.
7. **`src/graph-store.ts:688–766`** : dispatch consomme un attempt et passe
   SENDING avant le callback submit ; une erreur non probante devient AMBIGUOUS.
   Une vraie receipt ou un readback positif est retenu même tardivement ;
   absent/unknown ne rouvrent pas le slot. Une fausse quota rejection pour
   représenter une pause locale serait donc incorrecte.
8. **`inputs/L8_A2_CORRECTIVE_USER_GO_20261016/PARENT/TWO_BLOCKS.md:9–43,45–63`** :
   contre-exemples publics FAKE et reproduction parent fournis : body muté sous
   l'ancien digest ; PREPARED quota réessayé et accepté sous pause avec le même
   executionId. Les contrôles restent verts. Ce sont deux BLOCK confirmés, pas
   une régression main prouvée, une preuve native ou une violation N=1 alléguée.

## 3. Invariants de correction et de non-régression

- Une invocation client possède une seule image logique détachée. Digest, key,
  executionId éventuel, payload envoyé, retry et receipt locale se rapportent à
  cette image, jamais à une relecture tardive de l'objet caller.
- La capture précède tout callback **configuré** token/transport/snapshot/renew
  et tout await de submit. Ni l'objet caller ni ses sous-objets ne sont gelés,
  normalisés, remplacés ou restaurés par le client.
- Le digest scientifique reste le digest du payload sans l'enveloppe d'autorité.
  Mission/directory/controller/CAS et token gardent leurs rôles actuels. Le token
  reste mémoire seulement ; une authority fraîche n'autorise pas un payload neuf.
- Identités, texte Unicode, métadonnées, tableaux, modèles et ordre canonique
  restent ceux capturés. Pas de troncature, nouveau format ou égalité key/ID ajoutée.
- Une pause observée avant la décision locale d'admission interdit nouveau
  pin/claim/outbox, dispatch ou port.submit. Un PREPARED déjà durable reste
  récupérable avec le même body/claim/ID et la même politique d'essais.
- La pause seule ne change pas attempts, prochain délai, génération, N dépensé,
  pin ou allocation. Aucun refund/replan/nouveau pass ou slot de remplacement.
- La pause n'est ni quiescence ni preuve d'absence. Elle ne coupe pas les vraies
  observations, receipts, résultats, preuves terminales, fences, stops en cours,
  rétentions tardives ou releases dont les conditions sont réellement établies.
- Aucun callback externe, await, constructeur/connexion, Store.commit/acquire/
  renew ou SQL nouveau n'entre dans une transaction de composition. Les fences
  controller/family sont toujours réaffirmées après les derniers appends.
- Une observation réelle d'un travail déjà envoyé peut établir ACCEPTED pendant
  une pause. C'est enregistrer un fait, pas créer une nouvelle exécution autorisée.
- Les historiques, receipts et DB d'evidence ne sont ni réparés, migrés, effacés
  ni réécrits. Tous les tests futurs utilisent des créations OWN nouvelles.

## 4. RV8A2-01 : design proposé, image canonique avant callbacks

### 4.1 Capture et construction

1. Garder la protection actuelle contre les champs d'autorité fournis par le
   caller, y compris leur **présence** via `in` (une valeur undefined ou héritée
   ne doit pas disparaître du contrôle en passant par JSON).
2. Avant tout appel options/token/transport ou await, matérialiser **une seule
   fois** l'image du payload avec le codec `canonical` existant. Décoder cette
   image en données détachées, et en dériver la key et le digest. Vérifier la key
   sur ces données capturées, pas sur une seconde lecture du caller.
3. Cette chaîne immuable est la source de vérité ; ses objets décodés ne partagent
   aucune référence imbriquée avec le caller. Un éventuel freeze récursif ne porte
   que sur ces nouvelles données JSON, jamais sur le caller. La protection ne
   repose donc pas sur un simple spread superficiel ni sur `Readonly<T>`.
4. Après les RPC de snapshot/renew, compléter **ce snapshot**, et seulement lui,
   avec les champs d'enveloppe actuels. Stocker le body canonique avant l'I/O,
   conserver l'INSERT concurrent et la relecture existants.
5. Après la capture, ne plus utiliser `input` pour key, digest, payload, retry ou
   attribution de receipt. `call` continue à envoyer un décodage neuf du body
   durable ; son token est ajouté comme aujourd'hui, sans persistance du secret.

Il n'y a ni nouvelle sérialisation wire ni digest d'autorité artificiel. Pour les
admissions JSON ordinaires supportées, la justification attendue est l'égalité
des bytes canoniques du payload stable avant/après, pas seulement un prompt égal.

### 4.2 Rows existants, concurrence et receipt

- Garder le refus local si une même key est présentée avec une autre image.
- **Proposition à ratifier :** vérifier aussi qu'un row utilisé (cached receipt,
  pending retry ou row gagné après ON CONFLICT) contient bien cette image dans
  son body, en retirant seulement les quatre champs ajoutés actuellement par
  le client : missionId, directory, controllerId, expectedRevision. Ce contrôle
  est possible sur les colonnes déjà lues, sans nouvelle query/table/migration.
  Il doit précéder la restitution d'une receipt ou un envoi.
- Si un row est incohérent, refuser localement sans UPDATE réparateur, nouveau
  payload, nouveau key ou effacement de receipt. Ne pas prétendre réhabiliter
  d'anciennes admissions. Aucun ancien DB d'evidence ne sera ouvert pour le faire.
- Une reprise pending part des bytes déjà stockés. Garder la règle actuelle de
  rafraîchissement controller/CAS seulement après absence publique ; ne pas
  rafraîchir le payload lorsque la receipt est perdue ou l'acceptation ambiguë.
- Concurrence même key/autre image : le gagnant durable reste unique, le perdant
  ne réécrit pas son body. Même image : réutiliser la receipt cohérente si elle
  est déjà visible ; sinon conserver l'idempotence native actuelle. **Pas de
  promesse nouvelle d'un seul paquet RPC**, pas de mutex/single-flight ajouté et
  pas de transformation de l'idempotence en preuve de N-host réel.
- La correction lie le cache client à son propre snapshot. Elle ne certifie pas
  la véracité d'un transport adversarial qui inventerait/modifierait une receipt
  ou réécrirait son propre paquet réseau ; aucune fausse autorité n'est ajoutée.

### 4.3 Compatibilité explicitée, sans durcissement généralisé

- Domaine positif : objet d'admission avec key chaîne présente dans ses données
  sérialisées, valeurs JSON, objets imbriqués et tableaux denses ; conserver
  également les comportements du codec actuel lorsque son image est un JSON
  objet valide (undefined omis dans un objet, normalisations scalaires existantes,
  notamment). Pas de nouveau schéma strict ni whitelist des champs métier.
- Le codec actuel ne consulte pas `toJSON` comme `JSON.stringify(input)` ; on ne
  le remplace pas. On ne choisit pas structuredClone comme nouvelle barrière qui
  rejetterait silencieusement d'autres valeurs jusque-là sérialisables.
- Accessors et Proxy : `canonical` peut déclencher leurs lectures/traps, parfois
  plus d'une lecture de propriété. L'image obtenue est ensuite détachée et n'est
  plus relue sur le caller. **Ce n'est pas un snapshot atomique de getters/Proxy
  hostiles pendant leur propre sérialisation**, ni une promesse d'absence de leurs
  effets. Aucun callback configuré du client n'a encore été appelé à ce stade.
- Ne pas ajouter de rejet global « pas un plain object », de getter, de Proxy,
  de prototype ou de champ hors JSON sans décision de compatibilité séparée.
- Cycles/BigInt ou une image non décodable (ex. tableau creux produisant un texte
  non JSON avec ce codec) ne constituent pas une nouvelle réussite supportée.
  Échec avant I/O, sans réparation ni normaliseur permissif. Ne pas affirmer une
  équivalence générale pour les valeurs JS hors du contrat d'admission, dont les
  tableaux racine dotés de propriétés additionnelles/non énumérables.
- `executionId === idempotencyKey` reste une exigence des couches qui l'imposent
  déjà (L6), pas une restriction nouvelle du client générique.

## 5. RV8A2-02 : pause à la frontière d'admission, observation maintenue

### 5.1 Éligibilité relue et préparation atomique

- Utiliser le dernier journal durable vérifié (`readGraphJournal`), pas le `j`
  d'entrée de step, une variable booléenne volatile ou seulement `view.status`.
- `submit` doit vérifier la pause à l'entrée et après les appels qui peuvent
  renouveler/obtenir l'autorité. Aucun PREPARED ancien ne doit contourner ce guard.
- Dans le `.immediate()` existant de `prepareGraphExecution`, relire la pause avec
  le snapshot/journal courant **avant** freezeAdmissionInputs/claim/prepareAdmission.
  Les écritures concurrentes ne peuvent intercaler un contrôle au milieu de cette
  même transaction SQLite. Réutiliser la lecture utile aux propositions ; ne pas
  ajouter un port, une connexion ou un Store write dans le callback.
- Si la pause est constatée là, abandonner sans effet. Pour que step reste une
  opération normale pendant pause, le runtime peut intercepter un signal local
  précis de préparation différée ; ne pas avaler toute erreur de garde. Ce signal
  ne doit jamais devenir une `BridgeAdmissionError`/execution_rejected/quota, ni
  passer dans la catch de L6 après passage SENDING.
- Après préparation et calcul du backoff, capturer l'autorité finale hors
  transaction, relire pause et état durable de l'admission, puis appeler dispatch
  immédiatement si toujours PREPARED/éligible. Pas de callback configuré ni await
  ajouté entre cette dernière lecture et l'entrée dans dispatch.
- Préserver le temps initial du claim, les événements de retry, le maxAttempts,
  les delays et les checks L6 finaux ; ne pas reset le délai à pause/resume.

### 5.2 Frontières de fill et liveness

- Conserver le guard de début de boucle, et relire après le callback inputs,
  après `await checkInputs`, après la dernière acquisition/renouvellement
  d'autorité et avant réserve/préparation/soumission ou refus surdimensionné.
- Si pause découverte après cet await, sortir de **fill**, sans pin/claim/envoi,
  sans marquer scheduled à vide et reboucler indéfiniment. Les données calculées
  localement ne deviennent pas un nouveau dossier durable autorisé par la pause.
- Réévaluer le contrôle avant chaque nouvelle réserve. L'expiration réelle d'une
  lease et les contrôles de fence ne sont pas suspendus ou remboursés.
- Aucune attente active, sleep magique, nouveau timer de scheduling, lock global
  ou boucle de polling ajoutée. Après resume, le prochain step réutilise les
  dossiers déjà durables ; s'il n'y en a pas encore, il suit le plan gelé normal.

### 5.3 Comportement par état durable

- **Pas encore de claim/outbox** : pas de création pendant pause. Un journal v2
  prétendant déjà un claim sans outbox reste une incohérence fail-closed, pas une
  opportunité de recréer l'admission. Le cas interne pré-claim passe par fill.
- **PREPARED** : ne jamais appeler dispatch/submit pendant pause constatée.
  Recommandation : autoriser un passage observation seule du record déjà durable
  si nécessaire pour ne pas masquer un fait externe réel ; un pending/absent/
  unknown ne vaut jamais preuve de rejet/quiescence ou permission de renvoi.
- **SENDING / AMBIGUOUS** : continuer observer/réconcilier, sans renvoi sous pause.
  Conserver une vraie receipt reçue/readback positif et les faits tardifs ;
  absent/unknown ne réouvrent pas une admission tentée.
- **ACCEPTED** : continuer inspection, terminalProof, résultat et publication
  autorisée par les contrôles existants. Si A+B terminent sous pause, pas de
  nouvelle admission R ; si toute la famille était déjà acceptée, sa validation/
  publication/release peut finir sur preuves normales.
- **TERMINAL** : conserver résultats et readbacks utiles. **REJECTED** : pas de
  resoumission ; retraite/release seulement si L6 établit vraiment sa sûreté.
- **Fences/quarantaine/STOP_PENDING** : `checkFamilies`, attribution à la réserve
  d'origine, rétention tardive inéligible et contrôles de quiescence restent
  exécutés. Aucun return global sur paused dans step ; aucun stop simulé.
- Reopen : rejouer la dernière pause/résume durable ; les claims dépensés restent
  dépensés après fermeture, nouvelle génération, absence ou autre passage SCC.

### 5.4 Limite de concurrence à ratifier, pas une garantie réseau inventée

Les guards ci-dessus couvrent le contre-exemple PREPARED et les pauses visibles
après un callback/await et avant la décision locale. Le callback graph-store
dispatch est synchrone jusqu'à son passage SENDING et l'appel du port ; on ne
l'enferme pas dans une transaction extérieure async.

**L'API L6 actuelle ne permet pas de rendre atomiques le dernier read du contrôle
L8, la transaction SENDING et une acceptation réseau externe.** Une autre connexion
peut committer pause après le dernier read ; un appel entré dans dispatch/port
peut déjà être en vol quand pause devient visible. Sa receipt/résultat doit être
retenu comme fait, pas rejeté ni transformé en faux échec/no-worker.

Frontière recommandée pour cette correction fixture bornée : aucun nouvel envoi
dont le dernier contrôle local constate pause ; les appels déjà engagés conservent
leur gestion in-flight/lost-reply. **Pas** de promesse « aucune acceptation après
l'heure de pause » ni de quiescence instantanée. Si le parent demande plutôt
« toute pause committée avant admission_sending interdit l'envoi, même entre deux
connexions », il faut une composition/API publique L6 différente, explicitement
autorisée hors des trois chemins. Dans ce cas : STOP, pas d'interception du DB,
de fake rejection, de réécriture d'attempt ou de faux test atomique pour passer.

## 6. Matrice de régression proposée — jamais exécutée à ce stade

Les assertions sont des critères futurs, pas des PASS annoncés. Tests par API
publique avec transports/ports FAKE explicitement étiquetés, données nouvelles et
barrières Promise contrôlées. Pas de vrais workers, modèle/LLM, réseau externe,
autorité native ou oracle reproduisant les seules expressions de l'implémentation.

### 6.1 RED minimal, contrôle positif et provenance

- Sans mutation : ORIGINAL est envoyé, receipt retrouvée sur retry identique.
  Doit être vert sur baseline et candidat.
- Mutation caller pendant le faux snapshot : body attendu ORIGINAL, pas MUTATED.
  C'est le RED RV8A2-01 attendu sur baseline, hors erreur de setup.
- Pause avant tout step : aucun submit. Contrôle vert attendu sur les deux versions.
- Quota explicite recoverable puis pause, délai atteint et step : aucun nouveau
  submit/acceptation créée, outbox toujours PREPARED. RED RV8A2-02 attendu sur
  baseline ; même executionId dans le contre-exemple, sans allégation refund/N1.
- Reprendre la logique probante fournie, pas ses chemins d'import absolus.
  Les logs baseline ratifiés restent conservés, y compris les échecs voulus.

### 6.2 Client : bytes, mutations imbriquées, callbacks et reprise

- Muter séparément prompt, metadata/dossier imbriqués, éléments/ordre d'un tableau,
  modèle, idempotencyKey et executionId pendant les callbacks fake snapshot.
  Vérifier l'intégralité du payload transport et le roundtrip/retry d'origine.
- Même matrice aux callbacks token et renouvellement (y compris snapshot interne
  au renew) ; faire aussi une mutation entre invocation et résolution d'un await
  contrôlé. La key des données capturées reste celle de l'invocation, pas la nouvelle.
- Vérifier que le client n'a pas gelé/modifié les références caller ; les mutations
  volontaires du fake restent celles du fake et ne sont pas restaurées/masquées.
- Changer le payload sous key existante : refus sans second envoi. Restituer les
  données initiales : même receipt canonique, y compris après close/reopen d'un
  **nouveau** fixture DB corrigé. Retourner/muter un objet response ne réécrit pas
  les bytes de receipt déjà persistés.
- Accepted puis réponse perdue : reprise sur body original, même key/executionId,
  pas deux exécutions dans le fake idempotent. Absence explicitement lue avant
  première acceptation : controller/CAS peut suivre la règle actuelle, pas le
  payload. Pas de preuve de terminalité déduite d'une simple absence.
- Deux appels concurrents même key : contrôler l'ordre par barrières, avec images
  identiques puis contradictoires. Le perdant contradictoire ne modifie pas le
  row gagnant ; aucun nouveau mutex ni promesse d'un seul submit RPC.
- Compatibilité : key distincte d'executionId, Unicode/escaping/ordre de clés,
  nested/dense arrays et valeurs normalisées par le codec courant ; présence de
  champ d'autorité même undefined/hérité toujours refusée. Ne pas convertir ces
  contrôles en nouveau schéma métier.
- Getter/Proxy benign produisant un JSON valide : image capturée puis cohérente,
  sans prétendre une capture atomique du JS arbitraire ; exceptions de sérialisation
  sans I/O. Les cas exotiques ne deviennent pas prétexte à assouplir le codec.
- Si la vérification de row incohérent est ratifiée : son scénario négatif doit
  venir d'un état créé par les API publiques du baseline dans une fixture fraîche,
  jamais d'UPDATE SQL privé. Toute copie scratch/relecture de cette preuve rouge
  avec un autre code requiert permission explicite ; l'original reste fermé/pinné.
  Ne pas introduire un seed SQL ni exécuter le vieux package du reviewer.

### 6.3 Pause : états, vrais faits et intercalages

- PREPARED quota : comparer avant/après pause les attempts/digest/claim/IDs/body,
  policy/backoff et nombre de soumissions/receipts. Plusieurs steps pausés ne
  créent pas un nouvel essai. Les seules nouvelles lignes permises sont de vraies
  observations/contrôles ; pas d'admission_sending artificiel.
- Resume avant échéance : toujours différé. Resume après échéance, fences encore
  valides : un retry du même dossier, claim time et N inchangés. Close/reopen
  pendant pause, puis resume : mêmes propriétés ; aucun replan/cycle nouveau.
- Une observation acceptée d'un autre record déclenche pause avant l'itération
  suivante sur PREPARED : la seconde branche doit relire, pas utiliser le vieux j.
- Pause pendant `checkInputs` ou dans le callback inputs/authority avant préparation :
  aucun pin/claim/outbox/submit/refus durable de ce nouvel intent. Pas de spin.
- Pause après préparation durable mais avant la décision dispatch : garder ce
  PREPARED exact sans consommer d'attempt réseau ; reprendre uniquement après resume.
- Pour les barrières qui ne sont pas accessibles via une API de port publique,
  ne pas monkey-patcher les méthodes privées/transactions pour fabriquer la race.
  Décrire la couverture statique restante ou escalader le besoin de testabilité.
- Port submit déjà appelé, pause pendant sa réponse différée : receipt réelle et
  résultat restent retenus, mais aucun auteur/R suivant n'est lancé. Variante
  réponse perdue : AMBIGUOUS observé sous pause ; accepted positif conservé,
  absent/unknown restent sans réouverture. Pas de prétendu abort réseau.
- ACCEPTED + résultat pendant pause : observer appelé, preuve terminale et résultat
  exacts ; A+B prêts n'autorisent pas R. Famille entièrement acceptée : peut finir
  publication/readback/release sur les preuves existantes, pas sur le flag pause.
- Contradiction/late/fence/quarantaine : données conservées et inéligibles comme
  aujourd'hui ; ni pause ni resume ne redonnent N. STOP_PENDING continue à attendre
  une vraie fermeture ; REJECTED n'autorise jamais un remplacement.
- Pause/résume intercalés : utiliser la dernière action durable au point de
  décision. Ne pas « coller » une pause levée à un booléen en mémoire. Une lease
  réellement expirée peut bloquer la reprise ; pas de prolongation implicite.
- Course interconnexion/acceptation externe : seulement la frontière honnête du
  §5.4, pas un test FAKE présenté comme preuve d'une atomicité L6/native absente.

## 7. Gates futures proposées, chacune exige son GO propre

1. **Maintenant** : livraison et ratification du plan, dont les arbitrages §8.
   Aucun test/source write ne découle du simple ACK de ce document.
2. **GO test-write/RED explicite** : créer uniquement le nouveau test ; commande
   ciblée proposée, à confirmer :
   `bun test --timeout 30000 test/graph-integration/body-pause-regressions.test.ts`,
   depuis OWN harness.
   Baseline15 exact relu avant source write ; aucune importation d'anciennes
   racines absolues. Résultats RED qualifiés, contrôles, exit/durée/logs et toutes
   fixtures réservées/fermées/pinnées conservés. Bornes/TEMP/commande à ratifier.
3. **GO source-write borné** après plan ratifié et baseline qualifié : les deux
   seules sources ci-dessus ; pas de correctif opportuniste si un autre défaut
   apparaît. Les anciennes 60 assertions/scénarios ne sont pas affaiblis pour vert.
4. **GO focused/SQLite/typecheck distinct** : 60 anciens tests + nouveaux cas,
   typecheck selon commande parent confirmée, fake clients/ports seuls ; ordre,
   timeout et réservation explicités avant lancement. Aucun full implicite.
5. **Gel correctif neuf** : conserver runtime15 et toutes anciennes deliveries
   intactes. Le nouvel ensemble comprendrait les 15 chemins existants (deux
   changés) **plus le nouveau test**, donc runtime16 ; bytes/hashes/comptes futurs
   seulement après lecture réelle. Inclure adapter readonly, les deux bridges,
   preuves RED/vertes/registrytail et limites, pas seulement les deux sources.
6. **GO full unique exclusif ultérieur** : nouvelle réservation/process-check,
   scope/borne/commande/TEMP et amendement cleanup revalidés. Aucun réemploi du
   GO déjà consommé ou de la libération L7. Pas de rerun/patch dans le créneau si
   rouge ; fin/exit/comptes/libération signalés même en échec. Le futur compte ne
   sera pas arbitrairement « 930 » : distinguer anciens et nouveaux tests réels.
7. **Freshreview indépendante du runtime complet**, nouveau mandat/session
   autorisés par le parent, puis gates croisées parent avant acceptance/intégration.
   Le reviewer précédent reste completed/shutdown. Post-L8 QA/L9/L10,
   receipt-coherence OPEN/B-L4/simulatorCLI et preuves host/native/science restent
   des gates séparées, jamais closes par ces ports synthétiques.

Les fixtures futures passent par les helpers publics readonly avec finally close
et per-close pin/registrytail lorsque déjà prévu ; les réservations sans DB sont
comptées séparément. Tout WAL/SHM/journal inattendu, nouvelle classe/path non
autorisée ou hash tardif est conservé et signalé, pas nettoyé ou requalifié pour
vert. Les exceptions cleanup historiques n'autorisent pas une suppression manuelle
ou celle d'une preuve retenue. Aucun DB historique existant n'est réutilisé/migré
pour le test ; une éventuelle copie scratch neuve de la future preuve RED exige
la permission distincte mentionnée ci-dessus, original toujours intact.

## 8. Décisions demandées à la ratification et conditions STOP

**A — Snapshot/compatibilité.** Ratifier l'image issue du codec canonique existant
avant callbacks configurés, les données détachées et l'absence de durcissement
général. La limite getters/Proxy pendant leur propre sérialisation doit être
acceptée explicitement ; promettre plus exigerait une autre décision de contrat.

**B — Pause/concurrence.** Ratifier la frontière locale et les limites in-flight
§5.4, ou demander une extension publique L6 pour la linéarisation interconnexion.
La seconde option n'est pas réalisable honnêtement en modifiant seulement les
trois chemins ; elle impose STOP avant code et nouvelle autorisation. La pause
ne doit pas empêcher de constater une acceptation/résultat déjà réel.

**C — Cache historique contradictoire.** Recommandation : vérification locale du
body/row avant cache/retry, fail-closed sans réparation (§4.2), dans le même
client.ts. Ratifier cette inclusion et, pour sa preuve négative dédiée, la méthode
future de fixture baseline fraîche/copie scratch explicitement autorisée ; à
défaut signaler la couverture manquante, jamais seed SQL ni lecture d'ancien DB.

**D — Observation PREPARED pausée.** Recommandation : observation publique seule
possible sur un record déjà durable, avec la même attribution/proofs actuels ;
aucune soumission, pas de faux rejet ni preuve d'absence fabriquée. Le port
existant doit rester un observer, pas un créateur de travail. Toute extension au
transport réel ou besoin d'un nouveau contrat readonly est un STOP de périmètre.

**E — Tests et scope.** Ratifier les trois chemins et la matrice, puis fournir
séparément les permissions test-write/RED, DB, source-write, focused/typecheck,
gel/full et review. Toute race nécessitant monkey-patch privé, nouveau Store/API,
nouvelle authority/JSON policy, modification d'un ancien test ou config impose
escalade, pas une preuve fabriquée ni un quatrième chemin implicite.

**HOLD après livraison :** aucun src/test write, import exécutable, probe, test,
typecheck, SQLite, full, Git, install, suppression, dispatch réel, sous-agent,
globalconfig, IDA/live/native/science ou reprise de reviewer sur la seule base
de ce plan. Aucune modification L7/régimeB/simCLI/L9/L10 autorisée ici.
