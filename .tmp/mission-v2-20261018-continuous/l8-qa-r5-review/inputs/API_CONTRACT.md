# L8 phase1B — QA source fresh indépendante (pas l'implémentation)

Ownership: outputs/graph-transport.test.ts,DESIGN.md,MANIFEST.json uniquement.
Pas de codecentral,schémas,implémentation transport ou paquet voisin. Le parent
déploiera test sous tools/ff8-harness/test/graph-transport.test.ts après review.
Sources décrivent transport réel (schéma admis) distinct des types centraux.

ACKpins/NONBLIND+plan bref puis GOcode distinct, pas clôture surACK.
Écrire code comme texte,aucun import/eval/compile/validator/test/run/DB/native/
processOS/git/registre/IDA/live/réseau/délégation; ne pas lire outputs de l'auteur.
Hash/parsing JSON données permis. Le parent fera compilation/tests focalisés,
Vfresh source plus evidence; pas de PASS de votre part sans exécution.

## Contrat API parent ratifié (indépendant de l'implémentation future)

Imports ../src/graph-transport:
- decodePreparedGraphV3(value:unknown),decodePartitionAdoptionV1(value:unknown)
  retournent {ok:true,value deeplyreadonly}|{ok:false,errors:readonlystring[]}.
  Décodage FORME uniquement; objets JSON, pas parse string implicite. Clone/
  freeze sans normalisation ni mutation; pas clustering/connexion/activation.
- inspectPreparedGraphV3(value:unknown),inspectPartitionAdoptionV1(value:unknown,
  prepared?:unknown) retournent wellFormed,coherent,schemaErrors,coherenceErrors,
  stats(null si forme invalide),evidence:{status,present,wellFormed:boolean|null,
  admissible:boolean|null},authority:"untrusted",adoptionReady:false.
- status="not-present"|"not-applicable-A"|"inspected-B"|"not-applicable-adoption".
  Préparé branch="A"|"B"|null. Adoption preparedBinding="not-requested"|
  "invalid-prepared"|"matched"|"mismatched".
- Statspreparé:communityCount/groupCount/memberIdCount/kernelIdCount/
  externalContextIdCount/ownedFunctionIdCount/groupContextIdCount/uncoveredIdCount/
  snapshotNodeCount/snapshotEdgeCount(deuxderniersnull sans evidence).
- Statsadoption:inventoryUnitCount/quiescenceProofCount/ownedFunctionIdCount/
  attemptIdCount/claimIdCount/unknownAttemptInventoryCount/unknownClaimInventoryCount.
  Compteurs bruts, pas déduplication ou mesure perf.

## Attentes discriminantes, sans surrestriction

A/Bv3 et adoption formes fermées,version-strip/v1v2pasalias; deepdetachfreeze,
pas getters autoexécutés (objets JSON sûrs) ou mutation entrée. B sans evidence
= decodeforme OK mais inspection incoherent. A+evidence optionnelle conservée,
pas nouveau refusdeprésence (statusnot-applicable-A/flagsnull).
Transport groups permet granularity function|family|scc|group|subgroup même si
typecentral plus étroit. Groupsvide/kernelsvides possibles;owned crosscommunity
permis par attach-adjacent,uncovered peut chevaucherowned. Pas couverturetotale
inventée. IDs/jointures/digestroot/result incohérents doivent être distingués
des erreurs de FORME; lowerhex contrôlé là où contrat code requis.

B négatifs bien formés: raw10strings/diagnostics lossless,previous.adopted
historique boolean,true permis,partition primaire/resultfalse. Decoder les
conserve;wellFormed/admissiblefalse ne devient ni succès d'autorité ni rejet
de forme. Inspection peut recomputer via inspectProposalEvidence existant,
contrairement au decode. Capturer cette distinction dans les tests si possible.

Adoption forme != HOST/Q/inventaire authentifiés. FauxhostReceiptRef nonvide
peut decoder;authorityuntrusted/adoptionReadyfalse toujours. LocalReceipt brut
échoue formeactorfermée. UNKNOWN attemptIds/claimIds absents resteUNKNOWN,
flagsQ négatifs ne sont pas des erreurs deforme. Inventaire historique pas
forcé au nouveau snapshot; aucune mutation partition ni stockage/adoptedflip.
prepared optionnel ne fait que jointures documentaires, jamais HOSTtrusted.

Construire fixtures via sources gelées/tiny objets exacts conformes, sans
reproduire le decoder (aucune implémentation fournie). Importer uniquement
modules purs du harness dans futur test; pas helper SQLite/fixture-driver.
Éviter tests fragiles sur message exact non contractuel ou sur erreurs d'ordre.
Rapport types d'oracles positifs/négatifs/limites,3fichiershashés,rehash final.
