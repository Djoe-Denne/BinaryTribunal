# Contrat dynamique préparé — ACCÈS SEUL, pas encore GO

Même tâche ouverte l7-interop-r1/cycle2/SolMax. Ce contrat et DYNAMIC_GATE.json
doivent être lus/hashés intégralement, puis ACK accès/rôle/conditions et HOLD.
Le parent doit encore réserver le créneau et envoyer un FINAL GO distinct.
Ne créer aucune racine runtime/DB/TEMP avant ce FINAL GO. Le reçu ne vaut ni
permission d'exécution ni preuve d'accès effectif.

## Qualification préalable et commandes seules envisagées

V2 5420398b, addendum caa438bd et manifeste correctif34a5211c remplacent uniquement
les trois défauts de draft explicitement demandés. Les six anciens fichiers sont
conservés, tous les424 inputs et deux reçus restent immuables. Le runner installé
Bun1.4.2 expose bail/test-name-pattern/timeout ; seule sa help a été appelée par
le parent, pas les tests. Aucun TSC/full/107/255 ancien à refaire ici.

DYNAMIC_GATE.json fixe argv ET cwd exacts. Deux commandes sérielles au plus :

1. D1 : une invocation, quatre callbacks L5 purs sélectionnés par leurs quatre
   noms exacts, bail1 et timeout30000 ; plafond30s et zéro DB/port. Les callbacks
   non sélectionnés ne sont pas exécutables par ce GO. Vérifier les comptes et
   noms réellement exécutés, pas supposer que le filtre est passé au runner.
2. D2 : SEULEMENT si D1 naturel exit0, exactement4 PASS/callbacks attendus, aucune
   exécution inattendue et postpins/guard conformes : une invocation du seul
   proposed/crossqa.v2.test.ts5420398b, bail1/timeout30000, plafond150s. Cinq cas
   déclarés, au plus3unités/cas,9exécutions fake/cas,28step cumulés,2DB physiques
   neuves, zéro port/processus/worker OS/provider dans les tests.

Budget global180s à partir du premier spawn ; garder un deadline et réduire le
timeout D2 au temps restant. Jamais relancer après un rouge/setup/drift/refus,
même si aucune DB n'a été créée. Pas D2 si le gate D1 échoue. Aucun changement
d'oracle/source/test/flags/cwd/runtimepath pendant la séquence. Pas preload.

## Oracles et portée

SIM A3/B7/R2/validation2, rôles parallèles, quatre workers : publication11 puis22,
travail utile24. Lease16, heartbeat0, horizon32 : événements positifs jusqu'à27,
pas un makespan de publication27 ; cas C bloqué : publication11, outcome stuck,
makespan=observationEndTick (frontière dérivée16), C zéro tentative. C60000/N3/
T180000 par unité, fermeture360000. Ce sont des calculs statiques antérieurs,
pas des attentes corrigées à partir d'un run observé.

Les ports FixtureHost sont fake ; aucun modèle/worker scientifique n'est lancé.
Event-unlock : commit/receipt P avant claim C pendant Q RUNNING. Fermer les handles
ne prouve pas libération/quiescence Q. Réouverture GraphStore dans le même Engine,
Store et lease seulement ; pas restart/crash contrôleur. CLI inspect/replay sur
la DB neuve cas05 après close, sans connectPublic. Régime B/adopted, shadow,
dispatch réel/adoption CLI et autorité native restent refusés/non démontrés.

## Possession, environnement et conservation

JSON fixe RUN_ID et chemin neuf sous OWN/CROSSQA-20261016/runtime-<RUN_ID>.
Après FINAL GO seulement, vérifier absence et créer ce chemin nonlink, OWNER.json
wx liant task/session/run/manifest, tmp/opencode et bun-cache. Ne pas réutiliser,
vider ou supprimer une racine existante. Verrous séquence/D1/D2 exclusifs wx,
conservés. Capturer argv/cwd/PID/start/end/exit/signal/durée/logs bruts séparés.

Guard FF8_ENSEMBLE_SOURCE : strictement ABSENT, recherche casefold, même vide
présent => HOLD ; jamais clear/delete. APPDATA/LOCALAPPDATA doivent être uniques
et exacts aux valeurs parent du JSON. Parent.env avant/après dans CHAQUE sandbox
doit rester identique ; ne pas comparer des digests entre sandboxes distincts.
Child.env est une copie de l'environnement courant avec SEULES six overrides
du JSON : XQA_RUN_ID, XQA_EXECUTION_GO, TEMP, TMP, TMPDIR,
BUN_RUNTIME_TRANSPILER_CACHE_PATH. Pas d'autre injection/effacement. Cache outil
éventuel conservé/raw-hashé opaque, jamais désérialisé, pas absence forcée.

Le registre registry.jsonl est absent avant D2 et créé wx par V2, pas par le
wrapper. Seulement deux paths DB réservés avant ouverture, dans les deux casedirs
nommées du JSON ; aucune ancienne DB42L7/636L8 ou Tempglob/SQL direct. Les hooks
FixtureHost importés doivent garder Set vide : aucun appel fixturePath,
missionFixture, graphHarness, preserveFixture ni sqliteContender. Toute écriture
au registre hardcodé de l'ancienne suite => HOLD ; pas d'ancienne107/full.

Les deux close calls doivent revenir ; tentatives/finally puis fin naturelle
doivent rester qualifiées, pas instrumentation native universelle. Lire les DB
neuves/suffixes -wal/-shm/-journal explicitement réservés seulement, conserver
tous les bytes et comparer receipts raw avec post-exit. Un sidecar même vide
=> HOLD sans delete. CLI peut écrire ses propres métadonnées/PRAGMA : ne pas
promettre immutabilité physique avant la fin des appels et fermetures.
Plafonds d'observation :20MiB/DB et64MiB/cache ; ce ne sont pas des limites du
backend, dépassement => HOLD et conservation, pas cleanup.

Avant/après chaque commande :424payloads/deuxreçus, supplément GO et reçu, neuf
sorties statiques et manifeste correctif, présent contrat JSON/MD et reçu exacts.
Ne rien modifier dans ces entrées. Fin naturelle et libération immédiate du
créneau annoncées AVANT collecte finale, puis manifeste/logs/registry/owner/
postpins/DB-retention avec résultats réels et limites, puis HOLD parent.

Pas sous-agent/LLM externe/Git/commit/install/configglobal/achat/ancien DB/cache/
ctx_search/shared-index/inbox/board/results/autreOWN/IDA/live/native/dispatch réel/
maintransfert/intégration. Native model/task/guard et permissions restent des
gates parent. Aucune science/globalQA/L9/L10 n'est acceptée par ces fixtures.
