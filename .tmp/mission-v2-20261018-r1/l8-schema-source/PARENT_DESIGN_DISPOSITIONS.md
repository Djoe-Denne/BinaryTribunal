# Arbitrage parent L8 — candidats isolés, pas GO source

Le parent a vérifié directement les types InvestigationGroup/GroupMetrics,
ProposalEvidence, FrozenActiveUnit, UnitQuiescenceProof, validConfig et le strict
subset. Les choix ci-dessous sont de nouveaux choix de transport CANDIDAT,
pas des faits historiques ni une interface intégrée/ratifiée.

## D1 / D2 — enveloppe, pas une fausse partition v1

Retenir D1[c], enveloppe fermée `schemaVersion:3`, `partition`, `groups`, et
`proposalEvidence` optionnel (requis relationnellement pour régime B). $id =
https://re-ff8.local/schemas/l8-prepared-graph-v3 ; draft 2020-12 comme les
références. NE PAS mettre schemaVersion=3 sur une partition v1 plate : cela
contredirait le type/référence v1 et changerait le contenu hashé.

`partition` reste objet v1 inline : schemaVersion=1, regime=A|B, adopted=false.
Tous champs/contraintes v1 conservés, sauf ce resserrement adopted=false dans
ce candidat préparé (ne pas modifier le vieux schéma). Le wrapper n'est PAS un
ClusterPartition et ne sera pas passé tel quel au loader/putPartition.
Branch A : conformité supplémentaire au type L3 (régime A, parentLineageId=null,
maturity=structural selon les types réels) reste relationnelle.
Branch B : partition régime B, multiview-components/2/seed none, pas de cast L3 ;
proposalEvidence miroir du type réel lineage.ts:423-452 inclut source snapshot/
config/constraints/encoder/previous et result partition/sidecar/diagnostics/
constraints. Égalité root.partition==evidence.result.partition et liens de
snapshot/config restent des obligations relationnelles non prouvées par schema.
Préférer ce miroir à des champs `source`/`result` éclatés/mélangés à la partition.

## D3 — groupes v1 strictement inchangés

`groups` est requis pour A et B ; éléments inline EXACTEMENT conformes au schéma
investigation-group-v1 existant, sans ajouter kernelIds/externalContextIds.
Justification : schema additionalProperties=false ; InvestigationGroup:4-10 ne
possède pas ces champs. GroupMetrics:32 possède kernelIdsByGroupId, PAS un champ
externalContextIdsByGroupId. Ne pas inventer ce dernier.
Les kernelIds/externalContextIds requis par le binding restent à leur vrai
emplacement `partition.communities[]` ; jointure explicite group.communityContentId
vers community.contentId dans DESIGN. Les contextFunctionIds/ownedFunctionIds
restent dans le document group v1. La formulation historique « groups ... with
kernelIds/externalContextIds » est une association de données, pas un GO pour
élargir les documents v1. Aucun nouveau groupMetrics transport ni champ ajouté
aux groupes n'est autorisé dans cette tranche minimale.

## D4 / D5 / D8 — document d'adoption séparé

$id https://re-ff8.local/schemas/l8-partition-adoption-v1 ; schemaVersion=1.
Champs requis : schemaVersion, partitionId,lineageId,snapshotId,
snapshotFingerprint,configFingerprint,proposalFingerprint,observedDigest,
fromRevision,toRevision,quiescenceProofs,actor,inventory,explicit.
proposalFingerprint est le fingerprint de la partition avec adopted forcé false,
observedDigest est le digest observé en colonne ; ne pas déclarer leur égalité
automatique. Pas de deltaId inventé. Pas d'autre champ adopted : `explicit=true`
est une intention documentée, jamais une preuve d'acceptance/adoption effective.

actor={hostReceiptRef} seulement, champ string non vide ; authorityRef reste dans
chaque UnitQuiescenceProof. Fermer la forme interdit un objet localReceipt brut,
mais NE PROUVE PAS une autorité HOST : un string falsifié passe la forme, seul
le futur résolveur HOST peut authentifier. Aucun callback/objet d'autorité
scientifique désérialisé ne peut être traité comme une capacité.

## D6 / D9 — inventaire et périmètre minimal

inventory[] miroir de FrozenActiveUnit:88-100 SANS executionContext (unknown non
JSON). unitId,state,snapshotId,ownedFunctionIds requis ; attemptIds,claimIds,
workerStillExecutable,leaseHeld,attempts,claims optionnels exactement comme le
type. Absence des inventaires attempt/claim reste UNKNOWN, ne jamais remplacer
par [] ni prétendre une quiescence. Obligations relationnelles et verifyQuiescence
restent intégrales. quiescenceProofs[] miroir UnitQuiescenceProof:640-651.

Doc2 reste minimal binding : pas de migratableUnitIds/diagnostics/plan output
additionnels. Ces données restent dans la future décision application/L6, pas
dans ce candidat de transport nouvellement figé. Aucune migration d'unités.

## D7 / D10 / D11 — contexte et forme

D7[a] retenu : semantic-index.ts fourni en supplément, 67194B,
SHA bf04ce7c697b107ecc3da95c9574eb835a7d0ad984790f7ab267bcd3938b5cb1,
identique au pin accepted e03 baseline du manifeste L7QA_INITIAL_E03.
Types réels GraphSnapshotView/MultiviewConfig/LinkConstraint/FrozenEncoder et
validConfig maintenant disponibles ; ne pas remplacer GraphSnapshotView par
GraphSnapshotV1 complet ni encoder la méthode `encode`.
Si autre shape non définie, demander avant de générer un type générique inventé.

D10 manifeste proposé accepté : role,at,2 inputManifestRefs, bindingRef,
files[{path,bytes,sha256}],dispositions,limits/notClaims. Pas de faux hash du
manifest lui-même. Sorties : les deux schémas, DESIGN.md, MANIFEST.json seulement.

D11 subset strict exclusivement : pas de $ref/oneOf/if-then/pattern/const/format/
$defs. Inliner les sous-schémas. Énumérations autorisées, type union primitif
autorisé. Les contraintes non exprimables (A/B conditionnel, hex lowercase,
unicité/égalité crossdoc, config k1>0, autorité/quiescence) figurent dans DESIGN.
additionalProperties=false pour les objets transport dont les clés sont connues.

## Gate suivante

ACK du supplément + confirmation courte des choix ci-dessus (et toute nouvelle
ambiguïté réellement bloquante). Ne pas reproduire un long plan identique.
HOLD jusqu'à approbation native explicite GO WRITE. Les 16 inputs d'origine
restent inchangés ; le supplément a son propre manifeste. Aucune compilation,
exécution, import produit, DB, Git, registre, central, API native ou live.
