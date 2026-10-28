# L8 v2 — spike vérifié, GO d'adaptation source bornée

Même task task_mv6towrm_000c_24005n, Sol max ses_ec12fcc43ffeI6xXQ5rSTty2mV.
Lire/hash/ACK cette décision, puis attendre **GO FINAL WRITE parent distinct**.
Les conditions du spike6882B/SHA104a7d55 et du plan v2 ratifié restent opposables.
Cette décision n'accepte ni n'intègre le futur code L8, ni L7/globalL9/L10.

## Résultat réellement acquis

Parent vérifie livraison e59de3d0…13ff5, six fichiers finaux,36DB auteur10 702 848B,
13sources/398inputs/12transfert inchangés. Trois essais FAIL/historiques conservés ;
leurs hashes code sont historiques, pas une prétention que le code courant y match.
Il lit currentChecks/claimFor/validateClaim/atomicPrepare et la contention, constate
pas de SQL direct/network/delete dans le spike. Il **rejoue le code fb1b8073…4f8af
inchangé** dans une copie isolée :17/17PASS,exit0,13DB3 854 336B fermées/hashées/
conservées, aucun WAL/SHM. Manifest parent
17986500d3d00bc446ff853beacdbb95f8a36eb4d392ab422b8f3ef7da3ccc80.
Les receipts copiés y sont données de pinning, jamais approbation d'accès native.

Rollback pin/claim/outbox +curseur, pin différent ensuite, C±1 et expiration après
append, lostcommit/reopen/retry exact, deux connexions/ordres atomiques pendant le
lock et remplacement de contrôle ont des observations positives/négatives réelles.
**Composition publique same-db .immediate() approuvée pour l'adaptation**, pas SQL
direct/table/migration/édition L6. Garder guards avant ET après derniers append,
callback synchrone/throw outer, pas Store.commit/acquire/renew autreconnexion dedans.

## Ownership WRITE proposé autorisé après ACK/GO final

Sous tools/ff8-harness, six src seulement : domain.ts,engine.ts,cli.ts,
graph-pipeline.ts,graph-adapter.ts,graph-engine.ts. Sept paths test/graph-integration
déjà autorisés : fixture-driver.ts,pipeline.test.ts,engine.test.ts,protocol.test.ts,
authority.test.ts,recovery.test.ts,cli.test.ts. client.ts/adapter.ts actuels restent
byte-exacts sans nouveau besoin ratifié. Preuves OWN/.tmp/L8_PHASE_A_V2/.
Modules acceptés L1–L6/Store/validation/SCC/QA/fixtures/package/config/registre readonly.

Conserver tous gels/398inputs/12transfert/3073 et anciens essais ; produire nouvelle
version prospective, jamais widening/réécriture de l'ancien frozen ou preuve cachée.
Pas de second sélecteur, de Store/MissionConfig/schema modifié ou SQL privé.

## Généralisation et gates de l'implémentation, NON prouvées par le spike

- Le spike est un fixture rôleA,révision/cycle/epoch1 ; **pas le code générique à
  copier tel quel**. A/B/R et tous sous-intents réels, SCC/passes/générations,
  clés stables, tailles/C/N/T connus et ressources doivent être liés au vrai plan.
  Révisions/config/spec/inputs/epoch actuels sont relus/validés, pas des constantes.
- Corps FINAL mesuré UTF8 et C vérifié **avant tx**, guard L6 gardé aussi. Le sentinel
  sizeBody du test C±1 n'est pas du padding à adopter. R légal>C refusé avec evidence
  intacte, pas troncature/promesse universelle. N=1 par sous-intent durable, pas
  comptage trafic/retry ; rejet/absence/fence ne rembourse pas un slot committé.
- Claim exact : temps/record/policy retry originaux, pas token neuf/now réécrit.
  Aucune autorité/quiescence créée par claim ; fences et ambiguïtés v6 restent
  opposables après reprise. Aucun vieux handler ne peut créer un body/ID différent.
- Sources template/spec avant plan distinctes du dérivé après plan ; pas cycle de
  hashes, mode propre/contexte indépendant et strictreaders/tables S-C-N-T complets.
  Clones JSON sûrs/descripteurs avant callbacks, pas getters/proxies/héritage comme
  donnée implicite. Conservation réelle des projections CycleRecord.groups.
- Cycle graph v2 neuf seulement ; v1 inspectable read-only, jamais repris/replanifié
  v2. Marker présent invalide bloque legacy AVANT attach/renew/control/connect.
  Préparatoire non activant avant ancreCAS ; révision stale/commit perdu/reopen
  rechargent les bytes/IDs d'origine, jamais un nouveau cycle pour faire retry.
- Prévalidation niveau2/fixture-only avant satisfaction, pas relabel. Niveau2 exige
  vrais tuples/proofs/ports ; fake ports restent explicitement fixture et ne valent
  aucune science/native. API externe producer=null insuffisante → diagnostic/STOP,
  pas receipt importé inventé. compareGranularities reste legacy-only/failclosed.
- Blind A/B, R lié aux deux propositions exactes validées de **la même fonction**,
  body/pins réellement dérivés au sous-intent ; texte futur non supposé borné par
  l'ancien13590. Bulletin/Rpartiel/late result jamais COMMITTED. Famille complète
  validation/attest/publication/readback puis drain READY D/E→B pendant F.

Tests réels en reprenant les gates promises : nouveau contexte/C±1/Unicode/escape/
R agrandi et closure/SCC/callee partagé ; unknown/missing/strip/mutations ; N second
body/ID/passe/contrôleur et retry identique ; rollback/crash avant/après chaque
frontière/réponse perdue ; vieux claims/ancres/readers/cas concurrent ; ports/proofs/
revocations/double publication ; verticale complète et protocoles A+B→R→commit.
Typecheck/focused/pins avant/après, puis demander **réservation/GO full distinct**.
Ne pas annoncer956main sur OWN sans QA60/26maintenances absentes.

Après livraison : review indépendante et gates parent avant intégration, post-L8QA/
L9/L10 ouverts. Régime B L4 et simulationCLI/câblage simulateur toujours derrière
GO séparés ; le candidat L7 est BLOCK et n'est pas transféré.
Pas Git/commit worker/install/sous-agent/inbox/DB privée/réseau/LLM/dispatch réel/
IDA/live/suppression. Fixtures neuves propres fermées/hashées/conservées seulement,
cleanup historique borné ne s'élargit pas. Nouvelle décision/horsscope → parent.
