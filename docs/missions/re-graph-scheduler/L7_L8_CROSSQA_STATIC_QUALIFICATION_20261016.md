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

## V2 qualifiée ; contrat dynamique en accès seul — 2026-10-16

Trois ajouts /32126B, neuf fichiers /88480B au total. V2 proposée16633B/
`5420398b28676ae8f2c0ebc72cf7d6d36ea64f1035f5b31b2959050e0c8bc878`,
addendum8774B/caa438bd, manifeste6719B/34a5211c. Le parent confirme exactement
quatre remplacements textuels : lease16/heartbeat0, horizon32, oracle XQA-02
publicationEnd11/stuck/makespan=observationEnd, et rétention-journal. Six anciens
fichiers intacts, cinq cas/bornes inchangés ; neuf sorties maintenant readonly.

Chronologie dérivée statiquement : durées3/7/2/validation2, latency11 ; heartbeat0
ne réenfile rien. Positif0,3,7,9,11,14,16,18,20,22,27 ; deux expirations initiales
16/27, dernière observation27<32, publication/makespan complet22 et travail24.
Cas C bloqué :0,3,7,9,11,16 ; publication11 et frontière16 distinctes. Aucun test
n'a servi à ajuster ces attentes. Le parent a relu les chemins source correspondants.

Bun1.4.2 `test --help` exit0 : bail/name-pattern/timeout exposés ; aucune découverte
ou exécution de tests demandée par cette commande. Reçu de qualification runner
`l7-l8-crossqa-runner-qualification-20261016.json` sous le répertoire `.tmp` parent.

Nouveau contrat matériel OWN/inputs/L7_L8_CROSSQA_DYNAMIC_GATE_20261016 :
MD5920B/3a6d205e et JSON7815B/28d4b1d8, deuxpayloads13735B readonly ; reçu884B/
18e245e8/fingerprinta693f91c. **ACCÈS SEUL**, lecture intégrale/hashs/ACK puisHOLD
avant réservation et FINALGO distinct. Future racine runtime-xq-80920072 absente.
Argv/cwd/env/OWNER/DBs/sidecars/logs/guard et stop sont écrits intégralement dans
ce contrat, pas laissés au texte potentiellement tronqué d'un réveil.

Séquence seulement envisagée : D1 quatre callbacks L5 purs filtrés,30s/0DB ; D2
cinq tests V2,150s/2DB seulement après D1 naturel0/quatrePASS exacts/postpins ;
deadline global180s. Aucune permission de créer/exécuter à ce stade. Main275,
424inputs et deuxreçus préservés, pas sourcefix/native/intégration/globalQA.
