PLAN S1 1/3 — sélection fermée, lecture seule ; 0009 reste ouverte. R=canonique, P=paquet51, S=M/inputs/s1-contract-r2/supplement. Destination proposée C=R/.tmp/m2-s1-candidate-r2/tools/ff8-harness (donc D=R/.tmp/m2-s1-candidate-r2). Aucun accès W après refus ; readback W reçu parent seulement. Aucun fichier/produit/test/Git/handoff exécuté.
BASE : 39 fichiers, 1 019 711 octets (29 TS +10 JSON), hors tooling/tests nouveaux. Les 21 entrées P ci-dessous et 8 entrées S sont à copier avec leurs imports relatifs sous C ; les 10 supports GO sont en partie2. Aucun MANIFEST R4 à traiter comme source ou preuve du candidat. Les hashes ci-dessous sont RAW SHA256 ; les futurs changements des cinq cibles recevront de nouveaux pins.
Origines P et destinations :
• P/qualified/numeric-context-R2-frozen/src/{nom} → C/src/{nom} :
cluster.ts 51921 09c2035a16c1d4a1bfe03fc00807920d0af5202b290b0a68d7172a33319a3542
group-context-codecs.ts 18955 37ef5a09f4d4e6b8172b3962e30cf1442566cef4607295ef493fe4cce6774986
investigation-groups.ts 10684 162c979a5c65a6c08625f255d33aba7cb16ba3bb85ddfc7937925b95073d3b1a
sparse-graph-codecs.ts 16517 4ca2bed30e2609d87ef499a0b1ad5c0f2d687565161059ae7e6049db25b0f718
• P/qualified/planner-R2-frozen/src/{nom} → C/src/{nom} :
function-order.ts 571 8c87b7094d8bc280836fc609699af2d0b2045e59509a4a23f1fab1eaaa809415
planner-derived-codecs.ts 19899 27cc82acb9808ba6aca7307109f7ee0c9158d417df0c08bc4d79444cf9d3dd4c
planner.ts 48999 68c486ed6c5461ba6008d2b942555eb2c18f54b2cdbb51da65221ecfe27848a3
scc.ts 4763 94597e9dbf693959200ad0238a0a76db2a48b8c8aee734c4270a584e57743280
• P/reference-R4/{chemin} → C/{chemin}, BASE PROPOSÉE À ADAPTER :
src/graph-b-projection.ts 23529 9eff6beff94b72a6777dcd9655eb64b87b7e5a92fd08e2c0d579f07005ac5d8c
src/graph-execution-envelope.ts 79223 a928a96239ed9568544bdef83b5405d0d79d410884eb16a57ee2a91f8db52afe
src/graph-execution-prepare.ts 2717 28c9cfceecaf22d19a03a0e76321c67c237e88e52c571e62ae09dd2941c16b12
schemas/l8-execution-envelope-v1.schema.json 29582 3f541a03b84dba35788680c316fc4f2aa539467cfd06506d5b2512738d48e316
schemas/l8-graph-run-v3.schema.json 3115 a566ed5857b4725c600c506141f14cbd82ee83a78e09e1951cbfceacfd1ec16b
• P/upstream-qualified/{nom} → C/src/{nom} :
domain.ts 15444 3f49fa05a228549ed626b4f269818385fd23f32d7cc600eda84a1cd9cb42dbe7
graph-pure-codecs.ts 46607 7e618cf57373a79ac5b7aad384ef80f020876fa69a4c4d96dae394533481d5cf
graph-store.ts 129770 7dd20a9051b99a9324c550c4bb682653bfcdf2d8caa23823394acc454312201f
graph-transport.ts 22680 0b81fc928053f8fd602196bbf25500a53373d85a32dd450fa4bcce5643f6e40a
graph.ts 36515 2da7c8778833097b43f23be3e878b352b7d71fc89d3b9daf0aa5478aad96ef6f
planner-relation-codecs.ts 8164 afe9d66d3db8c457385f83fbe306075a935349ef49e993210e8b6aad7794bd50
re-policy.ts 12912 c3714c3120d3e8f87a044ef6857ca40c41900a6c74647d1bfdc6205371dfc365
validation.ts 22511 9f15f63c8c5b7ca39a3729be59b866f68f7ff6dc1f15655b0cb569d1498acb50
• S/{chemin} → C/{chemin}, huit pins reçus parent :
src/lineage-pure-codecs.ts 29225 48880953cbd4a3cdb0becf9d360dd964fcbedf30f72b379cdff72665cf3f5bbf
src/graph-persistence-errors.ts 469 5c61d9416b2b52debb2422134c19e857a3f5cf32b25d8c5189f7a5da6adeef70
schemas/graph-snapshot-v1.schema.json 47133 e62f78b47b610e40a701203d4750025161d8ccb787224e650d1fe5b18d7c8bea
schemas/cluster-partition-v1.schema.json 6730 199d505c44e0551d96ec9fafb9510571f056c13017a5d61bb5d114c2cbc4ee1b
schemas/work-unit-v1.schema.json 10218 3762f0507c081520b042e0b8ad28e777c214aebc6ec39a2e6011992259d796e5
schemas/knowledge-commit-v1.schema.json 4527 1298b80fbc62553375c20517f58a5a07fb198e4ab946c9e1feac9a0318753761
schemas/mission-plan-v1.schema.json 15810 916ce329c1d7a67c3b5eb4affc015e7e4e02abe1ff2bd0acfa431a053e6f097d
schemas/investigation-group-v1.schema.json 4172 732ca008ddf8e55f807bf0a1e19b77d2245048bfc5d8bf57155cea95598c6ffb
Origines Git/WIP : base GO reçue c1de250979cf8c419003035eb6e1ccefd38cc311, PAS équivalence HEAD. Dans les upstream gelés, domain/graph/graph-store viennent du suivi modifié ; graph-pure/transport/relation et les deux codecs S sont WIP non suivis ; validation/re-policy non sales au GO. Les feuilles numeric/planner sont les gels qualifiés, pas les versions MAIN. Manifeste51 a81b74… et supplement sont réutilisés comme bookends ; leurs couches ne deviennent pas une qualification du nouveau candidat.