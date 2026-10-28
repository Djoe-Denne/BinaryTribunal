# Parent — interface commune S1 R2 pour QA indépendante, pas verdict produit

SourceR2 proposée/frozen,nonacceptée/noncompilée. API projetée AST par parent :
18fonctions publiques,types/interfaces etseulobjet de tagslittéraux ; aucun corps
de fonction/initializerexécutable/privatevalidator/schemaimplémentation exposé.
Les3déclarations sont byte-identiques àcellesextraitesdupriorpartiel,pas d'API
élargie pour lefix. Cette ratification fixe l'interface des tests,pas lajustesse
du source. Un compilertool ASTa été utilisé,aucunmoduleproduit chargé/évalué,
aucun typecheck/transpile/emit exécuté. Les imports des .d.ts sont TYPEONLY et
leurs références se résolvent conceptuellement dans reference/src/ du paquet.

Périmètre : enveloppe byte-exacte/sourcebinding/GraphRunV3/explicitprojectionB/
préparationproducer séparée. Types T0/T1/T2/ActivationAttempt/Head sont DATA,S2–S4
ne sontpas implémentés ici. Parse/bind/export n'importent ni ne rappellent le
producerplanMission ; prepareExecutionV1 reste le seulcheminvolontaire. A/v1/v2
legacy loader resteinchangé,aucun BcastA/fauxadmissionv1. JSON/hashes/records
n'octroient HOST/LOCAL,activationquiescenceoudelegation. Inspection doit garder
authorityVerified=false/activationState=not-established indépendammentdeslabels.

ByteRef/ValueRef/documentkindstagssontdansapi/*.d.ts. CANDIDATE_FILE_PINS.json
fournit seulement tailles/hashes des5fichiers candidats,pas leurcontenu.
Correspondances des ContractPinsV1 à employer pour fixturesconformes :
- envelopeCodec : candidate src/graph-execution-envelope.ts(metadataonly) ;
- fullSnapshotSchema : reference/schemas/graph-snapshot-v1.schema.json ;
- fullSnapshotModule : reference/src/graph.ts ;
- proposalCodec : reference/src/graph-transport.ts ;
- plannerCodec : reference/src/planner.ts(60760B/fd90abe4…) ;
- inputCodec ET admissionCodec : reference/src/graph-pure-codecs.ts ;
- preparedTransportSchema : reference/schemas/l8-prepared-graph-v3.schema.json ;
- adoptionTransportSchema : reference/schemas/l8-partition-adoption-v1.schema.json.
Ces upstreams sont des pinsraw-v1,leursbytes/SHA sontdansINPUT_MANIFEST. Ne pas
confondre l'entréecodec avec inputs.ts(externalFSsink). L'ownenvelopeCodec pin
ne peutpas prouver sonpropreloader ; code/moduleloadertrustedpiné côtéparent/
backend est la limite enregistrée. Deux documentsd'accord ne valent pas preuve
d'acquisitionnative ; unefixtureDATA neprometpas uneactivation.

Invariants àtester depuiscontratsR3 : fullsnapshotlossless+sourcesindépendantes,
bindingsemanticréelplanning→source(relations/sites/metadata/observations ycompris
sitesBySourceEdgeId,pas seulsdigests),policies/config/budgets/group/contextpins
cohérents ; Abootstrap/Atransition/Bproposaldistincts,BversArefusé ; shape/coherence/
proposalAdmissible/authority sontdesdimensions distinctes. Un Bwellformed mais
inadmissible n'est pas autorisant ; ne pas exigerunrefusparsequi contredirait les
contrats. Originimmutables/T0 rootlimits preserved,sources remplacéesrejetées,
pasreplanauLoad/export,runv3dérivé lié àorigin. Le commitknowledgeWitness J→K ou
emptyK→K reste contrôleultérieur,pas réapplicationT2dansS1.

Les goldens/fixtures ne doivent pas utiliserlesfonctionsprivées du candidatcomme
oracle. Réutiliser lesalgorithmesQUALIFIÉS pour fabriquerun vraiPlannerResult
ou desdocumentsdebaseestpermisdansletestsource ; tester séparémentlesprojections
etvuesattenduesàla main et desmutationsréalignantdigestspour atteindrele vrai
guardrelation. Toutefixtureinvalidedéjàaudépart n'est paspreuve dunégatifvisé.
APIgapréel→parent,pas hookprivé/fauxexports/loaderlegacywidening.
