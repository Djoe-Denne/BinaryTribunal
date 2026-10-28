# S1 — factoring nécessaire avant GO code, ownership parent explicite

Plan S1 result_mvdyeet2_000x_jjdkfg lu. ACK38pins exact. Le parent confirme le
blocage technique et le résout offline ; aucune intervention utilisateur requise.
S1 source reste HOLD jusqu'aux nouveaux codecs revus/intégrés/pinnés. Pas de
promotion, pas de fausse API ou copie indépendante des cores.

Preuves parent : graph-transport imports valeur lineage ; lineage lit schema JSON
par readFileSync au chargement et importe semantic-index. graph-pipeline utilise
validatePlanning privé et validateGraphDocument depuis graph-store ; ce dernier
lit schema par fs et importe store. Ces imports sont incompatibles avec le
contrat source pur voulu. Attention : readLocalProposalReceipt dans semantic-index
est un lookup WeakMap mémoire, PAS une lecture filesystem ; ne pas le supprimer,
publier une registration arbitraire ou inventer une autorité sérialisée.

Autoriser une extraction source minimale avec anciens entrypoints reexportant/
déléguant aux mêmes implémentations, sans deux bodies divergents. Nouvelle closure
pure : aucune IO/DB/runtime client ni import value cluster/semantic-index producer ;
schemas JSON importés statiquement, pas node:fs au chargement ni dans codecs purs.
Type-only imports conservent les contrats existants. Les callbacks trusted et
le WeakMap privé restent où ils sont, pas exposés au nouveau codec.

Possession proposée, à préciser par plan exact avant source :
- nouveaux src/graph-pure-codecs.ts, src/lineage-pure-codecs.ts,
  src/semantic-config-codec.ts (un petit module erreurs pur supplémentaire peut
  être proposé si préserver GraphPersistenceError exige extraire sa définition) ;
- candidats de modification src/graph-pipeline.ts, graph-store.ts,
  graph-transport.ts, lineage.ts, semantic-index.ts ; aucun autre chemin sans
  escalade. Outputs isolés seulement, pas droit d'éditer le dépôt principal.
Exporter les validateurs nécessaires à S1 (planning complet/admission et graphe
document réel, codec prepared transport, inspectors evidence/lineage pures).
Les règles legacy v1/v2, numerical fix, refus receipt2/fixture-only et checks
schema/graph/errors restent inchangés ; pas de nouveau B executable legacy.
Pas de renommage ou nettoyage opportuniste, aucun SQL ou ABI modifié.

La closure exacte des fonctions/helpers est décision du plan worker puis du
parent, pas extraction arbitraire de tout semantic-index ni nouveau framework.
Si un helper scientifique pure est partagé, le déplacer une fois et réexporter,
ne pas modifier son algorithme. Les anciennes lectures de schema remplacées par
imports JSON sont un delta explicite à revoir, pas byte-identité prétendue.
Pas de readLocalProposalReceipt/planAdoption/trusted callback requis dans le
nouveau inspector structural ; son bien-formé/admissible n'accorde pas authority.

Ordre : ACK+plan extraction/imports/paths → GO source → V fresh source delta et
QA indépendante → intégration parent sérialisée/pins → gate typecheck/tests
ciblés (dont transport32 et compat107 si impact) → repin S1 → GO S1. Ne pas
completer le task S1 sur son ACK/plan. Les gates de compile/exécution restent
au parent exclusivement, pas de full44 implicite ni native/FF8/live/G5–G7.
