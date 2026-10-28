# L7 full2 — seule correction launcher autorisée, mêmes pins produit

Accord utilisateur : `L7_COPY_BOUNDARY_LAUNCHER_ONLY_USER_GO_20261016.md`.
Le full1 reste ROUGE1033P92F1SKIP/1126tests ; preuves88695448/V1bd770/V2 et11DB
immuables. Défaut de parent TEMP corroboré, pas régression produit établie ; effet
longueur Windows non expérimentalement exclu. Cette tentative est DISTINCTE.

## Accès et gates

Paquet actuel = **ACCÈS SEUL** : lecture complète/hash7payloads etreceipt,
rôle/conditionsACK puis HOLD. Les chemins BASELINE/OLD_FULL_DB_PINS sont des données
à ce stade, pas permission de lecture physique supplémentaire. RéservationEXCLUSIVE
neuve et **GO FINAL FULL2** distinct sont requis avant préflight physique, création
de proofdir/TEMP/fixture ou exécution. Même task/session/auteurAstraMAX existants.

Après FINALGO seulement : nouveau proofdir OWN/.tmp/L7_COPY_BOUNDARY_20261016/FULL2-…
et TEMP court exact `tempRoot` fixé par BASELINE, sous LocalTemp/opencode, tous deux
absents avant création. Aucun réemploi/effacement de root ; conflit→HOLD.
Créer `tempRoot` puis son sous-dossier `tempRoot/opencode` **avant le full**.
Mesurer/loguer les deux chemins, longueurs, existence, types et absence de fichiers
et fixtures ; le TEMP racine contient alors ce seul sous-dossier vide. Ne plus
affirmer TEMP racine vide. Pas de smoke test/module/DB ou probe FS supplémentaire.

TEMP/TMP du spawn enfant valent `tempRoot` (pas son sous-dossier). LocalAppData et
config restent hérités ; ne jamais modifier/vider process.env. Comparer avant/après
et strictement refuser toute clef FF8_ENSEMBLE_SOURCE case-insensitive, même vide.
Un guard présent impose STOP avant full, pas une suppression pour forcer SKIP.

## Préflight et seul run

370current/ledger8943882+4candidats195451B/33DTO, 45TS test+scripts, anciens50proofs,
full1artefacts26+manifest, anciens407inputs/5receipts + cette gate7 =414 pins d'inputs
protégés. Ledger déjà OWN, hash seulement : pas transfert/copie/parse scientifique.
Les 11 DB explicitement nommées full1 sont lues en bytes avant/après (3321856B),
tailles/SHA et absence de WAL/SHM/journal comparées ; jamais connexion SQLite.
Nul droit d'aller lire636DBL8, ancien11L7 autreOWN, Temp global ou reviewertranscripts.

Depuis OWN/tools/ff8-harness : UNE `bun test --timeout 30000`, global≤420s,
borne enfant≤415s pour finir/rapporter. Aucun TSC/probe/CLIbench supplémentaire.
Sanity1125P1SKIP1126/36 est une attente, jamais oracle ni résultat acquis.
Rapporter vrais PID/start/end/exit/signal/durée/comptes. Rouge/setup/drift→HOLD,
aucune correction source/launcher ou deuxième commande automatique.
FIN naturelle ou échec : LIBÉRATION immédiate avant collecte détaillée, même FAIL.
Timeout uniquement ce processus enfant possédé ; pas kill d'un concurrent.

## Fixtures, collecte, conservation

Inventaire actuel45TS36testfiles fourni : 12activelegacyfiles/22calls exactement
inchangés, seulement leurs propres créations NEUVES de ce run. 13e hook
scripts/role-sharing-offline.test.ts:146 INACTIF/non autorisé sous guardabsent.
Les deux escapes LocalTemp/opencode ff8-re-policy-* et ff8-runtime-test-* gardent
leurs seuls retours mkdtemp de CE run ; aucun cleanup manuel/helperpatch/interception.
Pas de posthash/conservation inventés d'éphémères déjà supprimés par ces hooks.

Graph-interop : seuls retours NEUFS explicites stdout
`evidence:graph-interop-owned-offline-db`, close receipts et DB/sidecars présents
conservés en place, per-close vs post-exit raw qualifiés. Aucun ancien préfixe glob.
L5 child `own.db` et TOUTES DB/sidecars restantes du TEMP neuf sont retenus,
premier hash L5 post-exit seulement si aucun receipt per-close réel fourni.
En cas de chemin imprévu/non possédé : STOP avant élargissement, pas delete/SQL.

Le parseur primaire exclut les sections récap `tests skipped:` / `tests failed:` ;
rapporter cas/fichiers/comptes réellement observés. Erreur lecteur→conserver V1/
snapshots/chronologie puis supplément neuf seulement, pas réécriture ni rerun full.
Postpins mêmes protections et ancien11DB, gel4candidats, logs/manifests/sources
immutables/HOLD parent. Root TEMP court conservé, pas cleanup final manuel.

Aucune intégration/acceptation globale/native n'est accordée. Après éventuel full2
GREEN : fresh review L7 NONBLIND SolMAX indépendante puis gates parent/croisées.
L8 scopedACCEPTABLE, globalQA/régimeB/simCLI/L9L10 restent ouverts ; pasGit/install/
inbox/autreworker/LLM/live/IDA/power/configglobal ou autre mission par cette gate.
