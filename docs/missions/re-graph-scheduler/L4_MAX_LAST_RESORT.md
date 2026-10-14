# L4 — re-review Max bloquante, correcteur Astra

2026-10-14. **NON ACCEPTÉ** après correcteur/reviewer Sol max malgré50 tests verts. Gel L4FIX manifest `1b57b0db4407a38b5ecef1fe1231b3b0a247cab79af8884beacab5a717dc8b01`,35/35 SHA avant/après. Reviewer `l4-rv-max`, task completed = revue livrée seulement, session `ses_ec6444404ffen9xxIhV4kpD7Kf` ; code+probes mémoire+contrat, aucune native ni IDB/Git/config modifiée.

## Cinq contre-exemples, deux familles

- **RV4M-01 config mutable** : semantic-index381–388/456/475–515/737. Fixture communities-obvious L2 valide, configlexicalfalse/encodeurfixture2D/metadataSHAcorrects. Hook verifyEncoderFreeze modifie config.hubMinDegree=1 :2→4 communautés PASS avec même configFingerprint, différent de la config utilisée. Capture par référence, pas copie autoritative.
- **RV4M-01 contraintes mutables** : même frontière, cannot-link avec vraie arête/provenance validée. Normalement FAIL constraint-final-partition ; hook constraints.length=0 : PASS, applied0, même empreinte. Toutes entrées scientifiques/config/constraints/previous/sidecars à capturer avant FP/validation/hook, pas seulement metadata/vecteurs encodeur. Ne pas geler/muter les objets possédés par le caller.
- **RV4M-02 ascendance fabriquée** : lineage409–416 croit le sidecar précédent parce que projectionFingerprint/contentIDs concordent, mais parentContentIds/proposalPass/v1Compatible non liés. Ajouter parent fictif `11*32` → nextPASS etadoptedtrue ; deepcopy/relecture même erreur.
- **RV4M-02 précédent inadmissible blanchi** :4singletons,2mustlinks valides → fusion3parents FAIL lineage-v1-parent-limit/fullsidecar3parents. Effacer les3parents du sidecar précédent et mettre v1Compatible/proposalPass=true, même projectionFingerprint/partitionId → replayPASS/no parents/adoptedtrue. Ne pas reset silencieusement l'histoire refusée ni confondre projection v1 avec ascendance lossless.
- **RV4M-02b falsePASS actuel** : cannot réel donne failedpartition+sidecar.proposalPass=false ; clone et flip uniquement ce boolean → planAdoption({partition:failed.partition,lineageSidecar:clone,units:[],explicit:true}) adoptedtrue sans diagnostics. Effet limité gate de proposition, pas admission native/L6 prouvée, mais obligation fail-closed violée.

Positifs reviewer :50tests/713assertions,35 contrôles positifs et8/9 probes delta/adoption/schema/Q ; oracle étoile4nodes Q=-1/3 conforme. Ils ne compensent pas les contre-exemples. Hypothèse exploratoire delta fixture-mode clarifiée, pas défaut additionnel retenu.

## Correction

Task `task_mv8038uj_003a_ftf7tj`, fresh writer **l4-last-astra**, session `ses_ec5e931aeffeWP917zdzU2crRw`, **Astra max dernier recours** après échecSolMax persistant. Model.Ref natif vérifié, location main déplacée vers son worktree avant édition ; aucun bypass sélection opérateur.

Own3 semantic-index/lineage/lineage.test. Copies défensives de toutes données avant callbacks, garde full content/diagnostics/parents/admissibilité avec preuve ou receipt host autoritative immutable. Hash recomputable seul ou boolean payload ne prouvent pas pass ; absence proof default non-adoptable/non-reusable comme précédent accepté. Concordance projection-v1/sidecarfull et conservation des précédents refusés. **Proposition d'API de witness/verify receipt avant changement structurant**, autorité scientifique/adoption L6/L8 toujours séparée. Aucun L1/schema/central/registry/config/Gitworker/IDA/live, nouvelle revue+gates parent obligatoires.

## API ProposalEvidence arbitrée

Le correcteur a proposé après lecture/transfert : evidence sérialisable v1 (source snapshot/config/constraints/encoder/previous witness-binding ; résultat partition/FULLsidecar/diagnostics), receipt local opaque, ou import via host `{receiptRef, verify(frozenRequest): authoritativeEvidence|null}`. **APPROUVÉ parent** après prototype clones52tests, pas acceptance.

Receipt local : mint **uniquement depuis l'évaluation interne validée**, pas factorypublique attestant payload arbitraire. WeakMap privée permise comme capability éphémère de proposition, **pas stockage scientifique durable ni numericSource L3** ; clone/forge/JSONreload sans preuve host nontrusted. Evidence lie full lossless et cohérence projection-v1/parents/diagnostics ; selfhash ou proposalPass transport ne prouvent pas le PASS.

Import : verifier configuré host/L8, jamais payload ; request copie gelée avant callback, résultat copié/postvalidé intégralement et égalité lossless/binding/versions, boolean/retourpartiel refusés. Absence host default failclosed, aucune prétention science/native durable. Un précédent refused/unverified reste lossless/nonadoptable avec failurehéritée, pas3parents effacés/rootreset. Sourcewitnessbinding précédent peut être digest/ref versionné, pas chaîne récursive quadratique implicite. Callerobjects non gelés ; toutes copies privées avant hooks. Régressions cinq probes/receiptforge/reload/hostmutations/previousnegative et nouvelle review obligatoires.
