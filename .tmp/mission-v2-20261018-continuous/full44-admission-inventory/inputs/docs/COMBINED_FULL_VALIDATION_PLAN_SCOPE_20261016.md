# Plan de validation complète du candidat combiné — statique seulement

Même owner l8-integration-r1/SolMax/build, tâche ouverte
task_mv6towrm_000c_24005n, cycle de préparation1 conservé. Pas nouvelle mission,
pas changement de modèle/politiques4/2/budget5 ou reprise d'un reviewer completed.
SIM851/runtime16 et toutes les sources/tests gelés restent inchangés ; main non
intégré. Reviews composants, QA croisée et audit frais pré-intégration sont
recevables offline/scoped, pas validation complète ou acceptation scientifique.

## Admission

ACCÈS SEUL d'abord :lire scope/contrats/décisions/manifest/2reçus complets, hasher
les payloads physiques et ledger readonly séparé, ACK rôle/conditions/accès puisHOLD.
Helper8MiB inchangé, grande fixture par projection locale parent distincte ; aucun
parse/dump9MB au modèle. Pas droit à la provenance main/autreOWN/ancienDB/cache.
Après approbation ACK, GO statique distinct. Aucune exécution par la présente note.

## Livrables du plan statique

Uniquement dans le nouveau dossier OWN/COMBINED_FULL_VALIDATION_PLAN_20261016,
après GOstatique :PLAN.md/inventaire/effets/manifest, propositions déclaratives.
Pas de correction source/test, pas modification du paquet ni d'anciens gels.

1. Inventorier le candidat réel :301fichiers harness,45fichiers *.test.ts (dont
   scripts/role-sharing-offline.test.ts). Tsconfig inclut src/test/scripts.
   Ne pas supposer que les anciennes suites 977/1125 couvrent cette union ou que
   tout script/canary soit autorisé. Proposer liste explicite exécutée/exclue et
   raison, aucun exclusion silencieuse de non-régression. Role-sharing ancien et
   canary scientifique réel restent hors GO ; tests unitaires purs à qualifier.
2. Proposer les commandes exactes typecheck/noEmit, build CLI et suite complète
   pertinente, leurs argv/cwd/borne de temps et ordre conditionnel. Compte attendu
   peut être une hypothèse, jamais un résultat acquis ou un oracle à ajuster.
   Dépendances SDK existantes seulement, pas install/configglobal.
3. Concevoir une image d'exécution NEUVE et possédée, distincte des gels readonly,
   avec bytes de code/tests/configs identiques. Registre fixture-driver hardcodé
   doit écrire dans une zone explicitement possédée de cette nouvelle image,
   pas le gel/main. Interdit de patcher le helper, les tests ou les attentes pour
   faire passer la suite. Si l'image sans retouche ne suffit pas, escalader.
4. Auditer chaque hook/cleanup/chemin DB/cache/TEMP/registre effectif, path:line,
   ycompris imports transitifs et scripts sélectionnés. Préférence LOCALAPPDATA/
   Temp, SQLite Worker/Atomics/concurrence, éventuels ports/processus fixture et
   effets CLI doivent être explicités/bornés, jamais assimilés à du FF8 natif.
   Toute suppression potentielle doit être signalée avant autorisation. Aucune
   suppression/relecture de ressource ancienne ou d'un autre owner.
5. Distinguer SQL interne des tests de corruption/migration OWN que la suite
   demanderait de l'ouverture/SQL manuel de collecte (non autorisé). Proposer
   possession AVANT création, close/receipts/rawpostexit et conservation de chaque
   DB neuve/suffixe -wal/-shm/-journal, ycompris échec partiel. Si un cleanup existant
   empêche la rétention exigée, le dire :pas intercept/repair silencieux.
6. Environnement courant copié dans l'enfant, overrides exacts déclarés seulement.
   FF8_ENSEMBLE_SOURCE doit être déjà strictement absent, même vide présent=>HOLD,
   jamais clear. APPDATA/LOCALAPPDATA inchangées et uniques ;aucune fausse autorité
   de host. TEMP court neuf/opencode prêt proposé, caches nouveaux conservés raw
   opaques. Pas comparaison de digests entre sandboxes ou cache désérialisé.
7. Proposer plafonds réalistes temps/DB/connexions/threads/ports/disque, index des
   paths nouveaux et preuve d'exclusivité, résultats/logs/flags/version/pins à
   relire. Ne pas réutiliser runtime-xq-80920072 ni anciens TEMP/caches/DB.

## Gates suivantes, non accordées ici

Le parent qualifie ce plan, prépare/valide l'image et l'accès, réserve le créneau,
puis donne un GO dynamique distinct borné. Toute erreur/refus/drift/effet imprévu :
HOLD sans fix/rerun/reset/cleanup/bypass. Pas nouveau full/TSC/build automatique.
Les vieux rouges et metadata-reader échecs restent immuables.

Zéro création produit image/runtime/TEMP/DB/cache/port/thread, importproduit/TSC/test/build/
probe/CLI/générateur à ce stade. Aucun agent/LLM externe/Git/commit/install/IDA/live/
native/dispatch réel/autre mission. Pas ctx_search/sharedindex/inbox/board/results
ni autres sessions/OWN/anciens DB. Connaissance de ton ancien contexte ne donne
pas droit de relire physiquement ses artefacts en dehors des inputs nommés.
Le scratch normal de l'outil ContextMode est infrastructure, à déclarer, pas un
runtime produit ni permission d'en explorer/nettoyer les caches anciens.

L9global et L10 restent bloqués/ouverts selon dépendances. RégimeB/adopted,
shadow/nativeCLI, acquisitionfuture, limitesoracles/NONBLIND/standalone/Proxy/origine/
SIMpacking et couplage host non démontré demeurent visibles. Une non-régression
offline verte ne doit pas être renommée « mission complète » ou adoption native.
