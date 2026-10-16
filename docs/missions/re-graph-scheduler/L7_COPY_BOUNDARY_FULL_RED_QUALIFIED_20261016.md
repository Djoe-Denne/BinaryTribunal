# L7 copie851 — full rouge qualifié, aucune nouvelle tentative autorisée

## Décision parent

La livraison finale est **conforme comme preuve d'un full échoué**, pas comme
validation du candidat. Le GO unique est consommé ; le créneau a été libéré avant
collecte. Auteur en HOLD : ni correction source/test/launcher, ni nouveau dossier
de test, ni relance, review de promotion ou intégration implicitement autorisés.

Full unique PID40332, 16:49:22.450Z → 16:52:06.387Z, exit1 naturel, 163936.2833ms :
**1033 PASS / 92 FAIL / 1 SKIP / 91154 assertions / 1126 tests / 36 fichiers**.
Pas de timeout, kill, autre typecheck/probe/full. Les résultats verts précédents
TSC/195 restent des preuves distinctes ; le full n'est pas reclassé GREEN.

## Qualification des échecs et limites

Les 92 cas primaires avant footer sont engine2 + eventlog90 :
- un `SQLITE_CANTOPEN` à la construction Store (`engine.test.ts:345`) ;
- un `ENOENT` au mkdir sans parent (`engine.test.ts:519–520`) ;
- 90 `ENOENT` au factory mkdtemp (`eventlog.test.ts:24`).

Le launcher a affecté TEMP/TMP à `FULL…/temp/opencode`, initialement vide selon le
préflight. Ces fixtures supposent le parent additionnel `${TEMP}/opencode` déjà
présent. Sa birthtime post-observée est 16:51:31.305Z, pendant le run et après les
échecs concernés. Une fixture ultérieure, `planner-admission-budget.test.ts:433`,
garantit récursivement ce parent avant son propre cas. Elle n'est **pas** présentée
comme son premier créateur physiquement instrumenté.

Le défaut de préparation du launcher est corroboré par les factories, erreurs,
préflight et chronologie. Cela n'établit ni 92 défauts indépendants du simulateur,
ni une régression de source851. L'effet éventuel des longs chemins Windows n'a
pas été expérimentalement exclu. Aucun mkdir, probe FS, changement d'environnement,
réouverture SQL ou essai de réparation n'a servi à cette qualification parent.

Le lecteur V1 a compté 92 échecs du footer une seconde fois : 184 records FAIL,
pas 184 tests échoués. V1 `full-failures.json`276274B/bd770c92…e913e est conservée
byte-exact, y compris sa copie parent ; les deux autres fichiers V1 restent pinés.
V2 est un supplément distinct : 1126 cas primaires, 93 lignes de footer répétées
exclues (92 FAIL + 1 SKIP), zéro parse issue. Les logs bruts n'ont pas été réécrits.
Le checker parent a corrigé son traitement des séparateurs Windows et des anciens
pins SHA-only sans taille déclarée ; les hashes restent tous vérifiés.

## Preuves vérifiées et préservées

- `ARTIFACTS.json`10913B/SHA256
  `88695448e860fd91af0ee9a74d02ac1c57386a62b9ba4c673b6b3dc4c781335e` ;
  26 artefacts2774952B vérifiés (incluant la DB L5 dans le child TEMP).
- 370 pins courants, ledger8943882B/b5c9, quatre candidats195451B live/copies,
  33 DTO, 50 preuves antérieures, 407 pins d'inputs/cinq receipts et 45 TS exacts.
  Source851e6ab2 et tests restent immuables ; main275 accepté inchangé.
- 10 DB graph-interop2936832B, seulement les chemins explicitement retournés par
  le stdout de CE run : hashes per-close = post-exit = readback parent. Nées pendant
  ce run, conservées en place, aucun WAL/SHM/journal présent au contrôle.
- Une DB L5 child385024B ; premier hash **post-exit**, pas de faux receipt per-close.
  Seul fichier restant du child TEMP, conservé. Total11DB3321856B, provenance L7
  distincte des 636 DB L8 auteur/reviewer et des anciennes DB L7 d'autres OWN.
- Guard interop strictement absent/inchangé ; le seul SKIP reste role-sharing réel.
  Les hooks12actifs/22calls legacy sont exacts, 13e inactif sans permission ; aucun
  posthash de fixture éphémère déjà supprimée n'est inventé.

Les 195 cas ciblés, dont 64 nouveaux ends uniques, passent dans CE full ; interop
simulée5fichiers54PASS et scale6PASS. Ce sont des preuves partielles positives,
pas une dispense des 92 échecs, ni une validation native, du régime B ou de QA globale.

Reçu parent local :
`.tmp/coordination-three-20261014/l7-copy-full-red-final-parent-verification-20261016.json`.
Le parent n'a ouvert aucune connexion SQLite ni exécuté le produit pour ce contrôle.
Natifs auteurAstraMAX/parentSolXHIGH, ownership et politiques4/2 relus inchangés.

## Suite proposée, pas GO

Demander à l'utilisateur une **tentative distincte launcher-seule**, même auteur
et mêmes pins source/tests : TEMP court neuf et dédié sous LocalTemp/opencode,
création/préflight de `${TEMP}/opencode` avant lancement ; uniquement TEMP/TMP de
l'enfant changeraient, jamais le guard, LOCALAPPDATA ou une configuration globale.
Aucune racine de cette future tentative n'a été créée par cette proposition.

Si autorisée : nouveau contrat/paquet piné, ACK d'accès, réservation exclusive et
GO final distinct ; un full≤420s, preuves rouges précédentes et11DB préservées,
pas de relance automatique. Nouveau full GREEN nécessiterait encore une review L7
fresh indépendante SolMAX et les gates parent/croisées avant intégration.
L8 reste ACCEPTABLE scoped offline/fixture, non intégré ; les autres missions,
campagne historique, IDB/live/native et actions d'alimentation restent intouchés.
