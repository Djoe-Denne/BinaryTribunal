# Raffinement de la route full — décision statique, pas nouvelle exécution

Même tâcheL8 ouverte/cycle1/SolMax, auteur inchangé. TC/build **parent** conformes
sur le candidat inchangé, pas réalisés par le launcher worker refusé. Celui-ci
reste NODE_OPTIONS présent=>HOLD dynamique ;aucun effacement ni loaderwaiver.
Ni la compilation ni le présent travail ne lèvent B01/B02/B03 full.

## Inputs et sorties

Inputs autorisés en lecture :paquet436 nommé COMBINED_FULL_VALIDATION_PLAN_20261016,
ses deux reçus et les quatre documents45415B du plan statique déjà gelé. Le nouveau
supplément ne contient que ce scope et le résumé parent TC/build ;son helper ne
couvre PAS ces anciens inputs ni une nouvelle image. Aucun ancien DB/cache ou
bundle à lire/importer, aucun passage par main/autreOWN/provenance.

GO accès seul au supplément, lecture/hashs/ACK puisHOLD ;GO statique distinct
ensuite. Sorties nouvelles uniquement OWN/FULL_ROUTE_REFINEMENT_20261016 :
REFINEMENT.md, ROOTS_AND_CLEANUP.json, CHILD_TREE_PLAN.md, MANIFEST.json.
Ancien plan4docs et sources/images/reçus inchangés. Aucun patch de tests ou helper.

## Travail précis et borné

1. B01 :classer chaque cleanup des44fichiers proposés, pas le script exclu.
   Pour DBphysiques éphémères uniquement :nom des tests/callbacks, origine des
   paths neufs, création exclusive ou mkdtemp, handles/échec et assertions dépendant
   de disparition, fichiers/sidecars pouvant disparaître, evidence réellement
   perdue si on laissait le comportement historique. Distinguer durablefixtures
   retenues, :memory:, nonDBstaging transactionnel et liens négatifs.
   Proposer une **exception prospective candidate** minimale pour les SEULES
   fixtures synthétiques neuves de ces callbacks, pas une exception déjà autorisée.
   Aucune suppression d'ancienDB/evidence, pas interposition/copie-au-vol/skip.
2. B02 :table des bases réelles, préfixes et constructeurs, y compris LOCALAPPDATA,
   WindowsTemp hardcodé, childTEMP/opencode, image registry et outputdirectories.
   Quels paths peuvent être possédés avant création, enregistrés atomiquement
   pendant création par le code existant, ou collectés après échec ? Peut-on
   séparer strictement des anciennes42L7/636L8/+2crossQA DB sans en lire le contenu
   ou faire un glob destructif ? Si une garantie manque, le dire, pas la simuler.
3. B03 :décrire une route **parent-only** possible avec un JobObject Windows neuf
   bornant UNIQUEMENT son arbre de test. Aucun helper Job créé/compilé/testé ici,
   ni dépendance/outil externe installé. Proposition :root suspendu/assigné au
   job avant reprise, no-breakaway/kill-on-close, logsProcessId/creationtimes/
   root-exit ET jobactif0, timeout arbreowned seulement, jamais killglobal/LSP/FF8.
   Évaluer ce qu'il faut qualifier par fixture inoffensive séparée avant adoption ;
   proposer alternative sûre ou HOLD si droits/nestedJob non établis. Prouver
   par source quels enfants Bun/Python et Worker SQLite sont effectivement utiles,
   quels compteurs/ports/disque sont seulement observables versus imposables.
4. Membership44 unchanged proposé ;aucun TSC/build à refaire sans changement de
   code. Donner un plus petit contrat futur exécutable :argv/cwd/env exacts,
   bornes réalistes, lifecycle collecte/DB-receipts/registry/opaque-caches et arrêt.
   Les exceptions et limites doivent être écrites, pas inventées dans un launcher.
   Ne pas baptiser 44 fichiers « fullglobal » si scriptinterop/B/native restent ouverts.

## Interdits et escalade

Zéro nouveau runtime/image/Job/cache/DB/port/Worker/processus de tests ou compilateur,
importproduit/TSC/build/test/probe/CLI ;scratch normal ContextMode de lecture seulement.
Pas accèspréload NodeOptions, nouveau launcher worker/clearingenv, désérialisation
cache/SQLdirect/install/configglobal/LLM externe/sous-agent/Git/IDB/live/native.
Pas ctx_search/index/inbox/board/results/autres sessions/OWN. Les commandes et
les exceptions sont des PROPOSITIONS ;le parent seul arbitre prospectivement,
prépare/qualifie les moyens et l'accès, réserve et signe un éventuel GO distinct.
Rapport court avec paths:lines et manifest, puisHOLD. Si aucune route correcte
sans sourcechange n'est établie, livrer le blocage précis au lieu d'une promesse.
