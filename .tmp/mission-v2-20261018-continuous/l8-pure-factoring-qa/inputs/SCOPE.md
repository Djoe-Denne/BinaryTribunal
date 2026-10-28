# QA source indépendante — extraction pure, sans implémentation auteur

Objectif : test/graph-phase2/pure-codecs.test.ts, QA_PLAN.md, MANIFEST.json.
Entrées anciennes pinnées + décision/API de mapping parent seulement ; pas de
lecture des nouveaux outputs auteur/origins/autres workers. ACK_HOLD hash/NONBLIND
+ plan précis de tests avant GO source. Aucun run/compile/import produit worker.

API nouvelle fixée par mapping parent : graph-pure-codecs exports au moins tous
les anciens publics de graph-pipeline déplacés (graphCheck/Object/Keys/String/
Integer/Number/Array/Json/Copy/Freeze/Digest, assertReceiptCoherence,
validatePlannerPolicy, validateExecutionTemplate, validateInputSource,
parseAdmissionSource, admissionScopeKey), parsePreparedGraph, validatePlanning,
validateGraphDocument et assertAdmissionBudgetBinding. Lineage-pure-codecs
exporte compareFunctionIds/sortFunctionIds/communityContentId,
proposalEvidenceFingerprint/partitionProposalFingerprint/isSerializableProposalData/
inspectProposalEvidence. Semantic-config-codec exporte configFingerprint,
validConfig, provenanceReady, immutableSnapshot et constantes ALGORITHM,
ALGORITHM_VERSION, LEXICAL_RULESET_VERSION. Graph-persistence-errors exporte
GraphPersistenceError/invariant, mêmes définitions réexportées par eventlog.
Signatures existantes inchangées ; validatePlanning devient exportée depuis sa
définition ancienne privée. Les anciens entrypoints réexportent les mêmes fonctions.

QA tests sans créationDB/OS/process/réseau/dispatch ; données heap-only. Couvrir
identité === des exports anciens/nouveaux (pas wrappernouveau qui déroge mapping),
identité classe/instanceof/catégorie d'erreur, proxies/accessors/nonfinite et
nombres aux bons types sans widening, receipts level2/fixture-only refusés,
schémas legacy non élargis et validation contenu/erreur conservée. Utiliser les
références tests existantes comme exemples, pas un nouveau cluster run ou planner
run au chargement. Le parent couvre le graphe d'import PURE en check statique
séparé avant exécution ; des imports legacy nécessaires pour vérifier réexports
dans le test ne sont PAS une preuve qu'ils sont permis en closure du codec pur.

Les grands tests préexistants lineage/planner/admission et compat107/transport32
seront éventuellement sélectionnés par gate parent après revue, pas exécutés par
QA. Ne pas réécrire leurs algorithmes ou oracles pour faire passer la source.
Si un positif complet exige une fixture non fournie : remonter manque exact,
pas faux dataset/capability ou import runtime. Tests source = propositions, pas
coverage exécutée. Pas de tests SQL/store/leases réels dans ce fichier nouveau.

Seules écritures outputs/test/graph-phase2/pure-codecs.test.ts + deux docs.
Pas git/registre/IDA/live/DB/réseau/délégation/teamtools/claim/complete. Retour
NATIF final sourceproposée/tailles/hashes/3–8ancres/limites. Fresh V composé avant
intégration et parent compile/typecheck/tests séparés. S1source toujoursHOLD.
