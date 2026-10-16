# QA combinée — qualification statique, dynamique non autorisée

Owner `l7-interop-r1`, même tâche ouverte `task_mv71y0s6_004q_ksbii0`/cycle2,
natif Sol Max/build conservé. Sources combinées424 et supplément GO inchangés.

## Livraison recevable comme proposition, pas comme test PASS

Sous OWN/CROSSQA-20261016 : six nouveaux fichiers / 56354B, dont cinq payloads /
51335B. Manifeste5019B,
SHA `792ee36981ff6bb3fab63cff42502b19db728e640e1a8e5a5fb56302151db4f2`.
Agrégat des cinq `path:sha256` triés/joints par `|` :
`11503043a5832ddc5957039532bf508ed8158d8f6c3865d17506da20bd5e4d2c`.
Le parent a rehashé ces fichiers et les424 inputs ; aucune exécution produit.

L'inventaire distingue les chemins publics effectivement reliés et les limites
régime B/adopted, shadow/dispatch/adoption CLI et autorité externe. Il ne clôture
pas global L7/L8/L9/L10. Proposition : D1 quatre callbacks L5 purs filtrés ; D2
cinq nouveaux tests croisés, au plus3unités,2DB neuves,28steps,0port/subprocess,
180s cumulés. Ces bornes et commandes ne sont pas encore autorisées ni exécutées.

Risque statique confirmé : `test/graph-integration/fixture-driver.ts:46–66` écrit
son registre dans le paquet et préfère LOCALAPPDATA/Temp. Aucun réemploi des107
tests ou full n'est admis. Le draft n'utilise que FixtureHost ; l'afterAll doit
retourner avec Set vide. Ce point et les effets/cleanup sont à revérifier avant
un éventuel GO dynamique. Pas de clearing du guard FF8, même présent vide.

## Trois corrections du draft demandées avant exécution

Draft original `proposed/crossqa.test.ts`16486B,
SHA `5fcd60667f54b19a86a3a6685e5e67bfe45a6068776a5f6d99f134c2d880ef46` :

1. **Timers/horizon**, lignes79–80 : leaseTicks1000 avec maxTicks80. Source SIM
   gelée1021/1031/1288 met les expirations initiales et heartbeat dans la file ;
   1301–1307 draine les événements et refuse au-delà de maxTicks avant même de
   vérifier l'état actif. Les expirations obsolètes ne disparaissent pas après
   commit. Cette configuration n'établit pas une exécution légale ; corriger la
   fixture et dériver une borne pour tous les événements, pas modifier SIM.
2. **Oracle XQA-02**, ligne114 : makespan11 ne suit pas du seul commit P à11
   lorsque C reste BLOCKED. Source1313–1314/1333–1336 : publicationEndTick est
   l'instant du dernier commit, makespan d'un résultat stuck est la frontière
   d'observation. Tester publication11/stuck/C0attempt, garder le makespan séparé
   et justifié ; aucune assertion de PASS après lecture d'un run à ajuster.
3. **Rétention**, lignes150–155 : inclure aussi `-journal`, avec DB/WAL/SHM,
   pour qualifier/conserver tous les sidecars éventuels, sans suppression.

Ce sont des défauts du test proposé détectés **avant toute exécution**, pas des
échecs observés ni des défauts de SIM/runtime16. Les rapports et le draft restent
byte-exacts. Parent autorise19:53:52.163Z seulement trois nouveaux fichiers :
`proposed/crossqa.v2.test.ts`, `STATIC_QUALIFICATION_ADDENDUM.md`,
`CORRECTIVE_MANIFEST.json`, même cinq cas et bornes, puis HOLD.

Reçus parent sous `.tmp/coordination-three-20261014/` :
`l7-l8-crossqa-static-parent-qualification-hold-20261016.json` et
`l7-l8-crossqa-static-correction-go-20261016.json`.
Aucun import/TSC/test/build/probe/CLI/SQLite/DB/port/TEMP runtime, source centrale,
main transfert, intégration ou native autorisé. Qualification V2, flags du runner,
environnement/ownership/bornes et GO dynamique distinct restent requis.
