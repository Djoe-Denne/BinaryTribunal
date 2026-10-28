# Parent GO extraction source R1 — extension stricte explicitement autorisée

Plan result_mvdyt1rs_001d_gaw6dg lu, native msg_14f9140cc001FeVbYhUwwWmiew.
37pins1052093B exacts déclarés, Model.Ref Sol/xhigh vérifié rev2.
Le parent confirme l'option STRICTE : la closure codecs pure ne charge ni module
producer planner/semantic-index/cluster, ni module DB/eventlog/store. Ne pas
waiver ces imports sous prétexte qu'aucune fonction n'est appelée au chargement.

GO SOURCE ISOLÉE pour le mapping exact proposé, avec deux paths supplémentaires
explicitement attribués : outputs/src/eventlog.ts et outputs/src/planner.ts.
Les deux anciennes références sont déjà dans les37pins ; aucun nouveau fichier
d'origine ne doit être lu, hash initial reste inchangé. Ce supplément est hashé
et référencé dans MANIFEST. Pas droit d'éditer le dépôt principal.

Possession candidats fermée :
- nouveaux graph-pure-codecs.ts, lineage-pure-codecs.ts,
  semantic-config-codec.ts, graph-persistence-errors.ts ;
- modifiés graph-pipeline.ts, graph-store.ts, graph-transport.ts, lineage.ts,
  semantic-index.ts, eventlog.ts, planner.ts ; tous sous outputs/src/.
- DESIGN.md et MANIFEST.json. Pas de tests worker ni de fichier supplémentaire
  non déclaré ; QA source sera séparée. S1 source demeure HOLD jusqu'aux gates.

Mapping approuvé : liste exhaustive du plan natif pour primitives/validators/
helpers/admission binding/constants, lineage inspect+ancestry closure et config
fingerprint/validConfig/provenance/immutableSnapshot. Functions déplacées une
seule fois, imports des mêmes implémentations aux call sites anciens, exports
historiques conservés. Helpers privés rendus exportés uniquement pour callers
internes historiques nécessairement séparés, pas nouveau proof/authority API.

Points non négociables :
- planMission/defaultMultiviewConfig/index/cluster, LOCAL_PROPOSALS privé/mint/
  readLocalProposalReceipt, verifyProposalWitness/planAdoption et ports trusted
  restent historiques. Ni certification arbitraire ni registry publique nouvelle.
- GraphPersistenceError et invariant sont déplacés, jamais réimplémentés :
  eventlog réexporte EXACTEMENT la même classe, instanceof et catégories intacts.
- Pas remplacement de validateSchema legacy par validateStaticJsonSchema ou un
  autre moteur. Préserver exactes acceptations/refus et erreurs existantes ;
  graph.ts numeric correction, safe integers aux vrais champs et reçus level2
  fixture-only failclosed restent inchangés. Pas nouveau plafond générique.
- Bodies/métriques/IDs/fingerprints/upstream constantes restent identiques,
  hormis remplacement FS/schema par table d'imports JSON explicite. Ce delta
  de timing échec/missing-schema est déclaré, pas présenté byte-identique.
- Imports d'erreurs/type-only doivent éviter cycles valeur vers anciens modules.
  Les deux modules pure lineage/config ne doivent pas dépendre d'une registry,
  callback authority ou producer. Aucun nouveau wrapper cachant une invocation.

Manifest inclut mapping oldfile/symbol→newfile/symbol et liste des bodies
inchangés versus seuls changements requis (import/export/schema resolution).
DESIGN expose le graphe des imports valeur pure et les limites. Pas réaudit
global ni nettoyage opportuniste. Tout besoin hors ces11candidats→parent avant
écriture. Aucun test/compile/import produit/validator/run/DB/OS/git/réseau/live.

Après source : V fresh + QA indépendante, puis intégration parent sérialisée,
pins, typecheck/tests ciblés et vérification import closure, avant repin/GO S1.
Ce GO n'est ni intégration/source acceptance ni full44/native/G5–G7 promotion.
