# L8 A2 — review indépendante du runtime complet15 après full gelé

Source livrée492f9f83…8ac05b : **runtime15/321 686B**,13deltas v2 plus deux bridges
clientaf00b119/adapter8da11235 issus du candidat partiel, non déjà intégrés au main.
Auteur Sol/max même taskL8 en HOLD, pas fermeture de sa tâche globale ni reprise
d'un ancien reviewer. Nouveau reviewer **fresh Sol/max indépendant NON aveugle**,
contrats parent autorisés, aucune analyse/auteur/ancien verdict utilisé comme oracle.
Full930+1SKIP et vérification de hashes ne remplacent pas cette review.

## Périmètre technique et invariants à attaquer

Lire SCOPE et décisions APPROVED_BOUNDARIES intégralement. Les15fichiers source/test
forment un seul runtime à revoir : domain/engine/cli,graph-pipeline/graph-adapter/
graph-engine,client/adapter,fixture-driver et six fichiers de tests graph-integration.
Modules acceptés L1–L6/Store/validation sont les dépendances readonly, pas à corriger.

- **Entrée/contextes** : vraie source config/template/input/cycle/epoch avant unique
  sélection/fermeture L5 opt-in ; dérivé après plan, pas boucle de fingerprints,
  constantefixture ou copie de l'allocation comme preuve du contexte courant.
  Unknown/missing/strip/mutations et mauvais version/suffixe UTF16 échouent fermés.
  Parseurs/readers propres, bornés/stricts ; clones/descripteurs/extrafields/proxies
  et inheritedkeys ne deviennent pas données autorisées. Règles S/C/N/T conservées,
  compareGranularities legacy-only, ancien plan3073 jamais élargi/migré/réautorisé.
- **Body et slot N durable** : FINALcodec/canonicalUTF8 àC−1/C/C+1, Unicode/escapes,
  vrais sous-intents A/B/R/fonction/SCC et callee partagé. Rlégal>C conserve les
  propositions/evidence intacts mais pas pin/claim/outbox/submit. C≠S, pas padding/
  troncature ni promesse toutR≤C. Clé scope/unit/sub-intent stable sans pass/fence/
  controller : deuxième ID/body/génération/passe, retry lostreply et rejet/ambiguïté
  ne remboursent/réautorisent pas un slot. Temps/IDs/body/backoff originaux gardés.
- **Atomicité du vrai code** : public same-db outer.immediate synchrone, pas await/
  I/O/Storewrite autreconnexion/SQLdirect ; pin+claim+PREPARED ensemble. Guards
  ancre/config/contexte/réservation/fences avant ET après derniers append (lease
  expire par eventsequence). Throw après chaque vraie API, pin différent ensuite,
  cursor/outbox/claim rollback ; close DEUXconnexions/reopen ànowdifférent. Vraie
  contention deux connexions/contrôleurs : au plus un bodydistinct, pas simple test
  séquentiel renommé concurrent ni stub remplaçant l'effet vérifié. Pas cache stale
  comme autorité, suppression de doubles reads ne retire aucune vérification.
- **Ancres/v1/CLI** : graphv2 seulement cycle neuf, marqueur présent invalide bloque
  legacy AVANT attach/renew/control/connect ; v1 inspectable read-only sans reprise.
  CAS stale/orphelin/lostreply recharge originaux, pas nouveau cycle de confort.
  groups/fingerprints/identity preserved, marqueur pas auto-attestation. CLIoffline
  normalize/prepare/inspect/replay ne crée ni client/lease ni dispatch ; shadow/
  adopt/simulate/runréel restent refusés. Pas câblage L7 ou régimeB caché.
- **Lifecycle, blinding et nativeproofports** : A/B réellement distincts, R lié aux
  deux propositions exactes de LA même fonction/famille/version ; mauvaise attribution,
  rôles et modèles, résultats tardifs/partiels/likely/bulletins ne commitent pas.
  Quarantaine v6 change réellement le token : ancien lease comme AUDIT seulement,
  pas autorité courante. Categoryseule→AMBIGUOUS/claims retenus ; rejet natif prouvé
  seulement peut retirer. État/timeout/fencing ≠ quiescence. Stop/result callbacks
  et retry restent attribués sous mêmes bytes/IDs/revision/contextes.
- **Publication/reprise** : A+B→R→review/attest/validate/effect/readback/receipt→commit,
  pertes avant/après chaque frontière, doublepublish/revocation et retour perdu.
  D/E→B immédiatement après CHAQUE commit/receipt sans attendre F, fill des slots,
  SCC/totaux et budgets conservateurs sans second scheduler. Prévalidation receipt2/
  fixture-only AVANT satisfaction, jamais relabel ; externe producer=null/import
  non supporté STOP avantactivation. Tous ports positifs sont FAKEFIXTURES, pas
  acceptation native/scientifique par booleans ou sqlite persistante.

## Validation indépendante bornée

Après Model.Ref/paquet/lecture réelle approuvés : typecheck puis **60tests attendus**,
avec --timeout30000 : pipeline/engine/protocol/authority/recovery/cli sous
test/graph-integration. Ce60 est L8, pas QA60parent. Puis petites probes propres
sur les jonctions ci-dessus via API PUBLIQUES, pas oracles/helperlogique auteur
repris comme attendu. Les fixtures/helper existants peuvent fournir les entrées,
pas l'oracle d'atomicité/ordres/IDs. Coûts/gros journals/cache/latences qualifiés,
pas benchmark universel. Pas full ou100k demandé, pas nouveau L2preflight à payer.

Read-only du source/projet ; tests/probes ont permission de créer seulement des
fixtures SQLite **neuves possédées** via APIs publiques : root TEMP/TMP enfant neuf
dans le proofdir parent et seuls retours mkdtemp l8-central-v2-* des tests figés sous
LocalTemp/opencode. Pas SQLdirect ou connexion à un auteur/Ensemble/ancienne DB,
pas migration/réutilisation d'un artefact historique. Fermer les connexions, conserver
DB/sidecars/receipts/chemins/tailles/hashes ; aucun delete manuel. Erreur/setup et
WAL inattendus conservés/qualifiés, pas de hash antérieur prétendu.

Exception d'écriture automatique précise : le fixture-driver inchangé crée/append
**paquet/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl** et ses receipts propres ; parent
prépare ce répertoire vide. C'est metadata des NOUVELLES fixtures, pas modification
des fichiers manifestés. TaskId hardcodé dans les receipts du helper =fixturedata,
pas identité native/ownership de la session reviewer. Proofs propres uniquement
dans le dossier parent donné, logs filtrés ContextMode bornés au paquet, pas recall
partagé. Si profilPlan refuse l'écriture de preuves : rapport explicite public et
commandes/repros inline récupérables, pas contournement source/perms silencieux.

## Livrable et interdits

ACCEPTABLE ou BLOCK scoped avec path:line, scénarios complets minimaux/contraires,
codes/comptes/fichierspins avant/après/DBretained et limites ; distinguer échec de
setup/outil de source. Consolider dès blockers certains, pas campagne sans borne.
Pas source/test/projet/Git/install/modèle/provider/globalconfig/sous-agent/inbox/
team_results/dispatch réel/LLM/IDA/live/réseau externe ; seuls faux serveurs loopback
et threadsSQLite de fixtures explicitement permis. FF8/Ensemble réel reste SKIP.
Ledger9MB non transféré ; vieux JSON de budget sont références immuables, chemins
absolus archivés NON permissions d'accès. Pas autre source L7 en cours/copier.

Parent seul accepte/intègre après verdict recevable et gates croisées. Pas modèle
plus cher/correcteur ou sourcefix de review autorisé implicitement. Nhostréel,
science/native/L9/L10,post-L8QA,régimeB/L4 etsimulationCLI restent hors cette clôture.
