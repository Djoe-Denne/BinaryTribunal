# Rapport A — synthèse fidèle matérialisée par le parent

Provenance : résultat public terminal de l1-b1-analysis-r1,
session ses_eb1b998bdffe1UIItgakc7QAjU, tâche task_mvdlr82o_000t_adde4x.
Ceci est un digest du message public, pas un fichier écrit par A ni une preuve
d'exécution. Le message public original reste conservé dans l'équipe.

A conclut FOUND / FOUND, analyse statique seule. Rehash début/fin déclaré :
38/38, 1 051 621B, manifeste cba86fa601d401d3bd51b57c67e334635eaf3f27b25b5e0b63be4e227b6917ec.

## D1 revendiqué

gel/tools/ff8-harness/test/simulator/graph-interop-structure.test.ts:87-95 :
test original pinned bridges-rare correctly rejected, jamais réparé ;
lecture raw:88, SHA lié à RARE_BRIDGE_V1.rawSha256:89, pins de contenu/fingerprint
:90-92 ; validateGraphSnapshot(original) exactement une erreur « edge
instruction site is outside source function chunks »:93 ;
buildGraphSnapshot(partsOf(original)) toThrow même erreur:94 ; raw inchangé:95.
RARE_BRIDGE_V1 pins support.ts:47-49, canon raw 69278ee8…105c4.
Garde D1 dans constructeur positif support.ts:68-69.

## D2 revendiqué

Même test:98-125, constructeur :100 ; identité dérivée :101, fingerprint
bb3b194a9d51d181c61118a742223d91676983059a8ea8a549116a3627204630:102,
identité différente :103, edges/coverage inchangés :104, oracles natifs faux
:105, sizeBytes 17 :107, end exclusive 0x2111 :108, disjonction spans :109-111.
Delta inverse :114-117 restitue le document original. assertCrossedStructure
:118 appelle validateGraphSnapshot(snapshot)==[]:15 et fingerprint oracle :16.
Plan SCC/G1 :119-123, raw canon préservé :124-125.

## Chaîne revendiquée

support.ts:55-78 : raw+pins :56-62, préconditions caller/span/site+rejet :63-69,
clone puis mutations end 0x2110→0x2111 et size 16→17 :70-72, nouvelle identité
test-only via oracleDigest :73-75, fingerprint oracle :76. Encodage canonique
indépendant du code production revendiqué à support.ts:25-39.

graph-normalize.ts:73,76,149,157 et imports :5,11-12 cités pour build et
fingerprint. A précise que graph.ts et validation.ts ne sont PAS dans son paquet,
donc n'en revendique pas les corps. Pas d'exécution, les attentes sont des
littéraux/assertions lus statiquement, pas des résultats runtime observés.

Affirmation annexe A à contrôler : « edge-id format edge:${hash(canonical(
{sourceId,destinationId,kind,sites})).slice(0,40)} (graph-normalize.ts:92-93,
126-128) correspond au pin edgeId edge:b6d08bd4… (40 hex) ».

## Provenance revendiquée et limites

A interprète les mentions historiques « new L7 initial QA, not accepted » du
manifeste comme signifiant que les fichiers sont encore non acceptés. A cite
PARTIAL_POST_L8_PENDING / independentReviewPending de la proposition L1:49.
Cette inférence de statut présent doit être vérifiée contre les reçus parent
ultérieurs ; les labels du gel ne sont pas une chronologie d'acceptance.

A limite les résultats aux 38 copies du paquet. Il n'a pas suivi le test raw98
:128+ hors paquet, n'a rien écrit/exécuté, n'a pas clôtu L1. La découverte de la
paire dans ce corpus étendu ne contredit pas l'absence antérieure d'ancres dans
les quatre seuls documents de la proposition historique. Pas de compatibilité
globale L1↔L2, ni de preuve native déduite du positif synthétique.
