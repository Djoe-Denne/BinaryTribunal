# L5 budget — approbation parent du plan avec marqueur explicite

2026-10-15. Même task `task_mv9k1ikn_0000_bo44nq`, auteur fresh `l5-budget-astra`,
session `ses_ec051dad7ffeMZ5jqeWhGUzt3H`, exception utilisateur Astra max ciblée.
Plan reçu/repros approuvés **avec les amendements ci-dessous**. GO d'écriture
seulement après lecture/hash/ACK et message final parent. Pas acceptation du code.

## Ownership ratifié

Sous tools/ff8-harness : `src/planner.ts`, nouveau
`test/planner-admission-budget.test.ts` ; si nécessaire, additions de nouveaux tests
uniquement à `test/planner.test.ts`, aucun retrait/réécriture des anciens contrôles.
Pas de module séparé, autre fichier ou fixture canonique. Preuves OWN/.tmp/
L5_ADMISSION_BUDGET/. Tous autres lots, L6/store/validation, L8, L1/schémas,
package/config/registre readonly. Ne pas copier REFERENCE_L8 dans ROOT.

## Activation — modification impérative du plan proposé

**Le préfixe policy.version seul ne doit PAS activer le nouveau mode.** Ce champ
était opaque pour l'ancienne API : un ancien nom ressemblant au préfixe ne doit pas
être rétroactivement reclassifié ou rendu illisible.

Ajouter `PlannerPolicy.admissionBudgetMode?: "complete-admission-cap-v1"` comme
discriminant propre explicite, en plus de `admissionBudget?`. Règles :

- Mode absent + allocation/contexte absents : chemin ancien byte-exact, **quel que
  soit policy.version**, y compris un nom préfixé complete-admission-cap-v1:legacy.
  Aucun champ nouveau émis. Les anciens plans/readers/logs restent relisibles.
- Allocation ou contexte courant présents sans mode : rejet, pas donnée ignorée.
  Mode inconnu/malformé/hérité : rejet, pas fallback legacy.
- Mode exact : nouveau contrat ; policy.version doit être explicitement préfixé
  `complete-admission-cap-v1:` avec suffixe non vide. Contexte courant indépendant
  obligatoire. Allocation absente : diagnostics et zéro admission, jamais S en
  substitution. Si cette représentation diagnostique n'est pas compatible avec
  L6 readonly, escalader plutôt que contourner.
- Lecture/cohérence nouvelles s'appuient sur le mode/métadonnées versionnées et
  les fingerprints, pas une heuristique de préfixe. Retrait d'un champ nouveau ne
  doit jamais permettre de traiter son plan frozen comme ancien valide. Tester
  stripping/rehash/mode manquant/unknown, avec le binding attendu d'origine.

Le marqueur entre dans la policy hashée AVANT planId. Marqueurs sémantiques ajoutés
au planId seulement en nouveau mode ; toutes identités fonction/unité/sous-intent/
famille/conflit restent inchangées, ancien holder actif/quarantined toujours opposable.

## API et données ratifiées

Quatrième argument `expectedAdmissionBudgetContext?` de planMission, champ
`ReadinessInput.admissionBudgetContext?`, export pur
`assertAdmissionBudgetBinding(plan, sidecar, expectedContext)` approuvés. Ce dernier
vérifie le **binding d'allocation** ; ne pas prétendre qu'il remplace la vérification
du triple document binding ou toutes preuves L6 qu'il ne reçoit pas.

Context exact `planner-admission-context-v1` : missionId/snapshotId/
snapshotFingerprint/partitionId/knowledgeRevision, missionConfigFingerprint,
executionSpecFingerprint/inputManifestFingerprint/admissionCodecVersion/cycle/
budgetEpoch. Entrée `complete-admission-cap-v1`, scope one-immutable-run,
executionProfile one-execution-per-subintent-v1, context/capsByFunction/fingerprint.
Fingerprint canonique sans lui-même, aucun hash/ID futur plan/prepared/run/exécution.
L8 fournira le contexte dérivé de ses **vrais inputs**, pas recopié de l'allocation.
L5 valide engagements et snapshot, ne prétend pas avoir relu une config absente.

Caps par fonction : UnknownableInteger positif strict si connu, unknown=false/null,
maxNewExecutionsPerRole exactement A/B/R=1. Counts>1, zéro/fraction/-0/nonfini/
overflow/extra roles refusés dans ce profil. Table propre à clés exactes de fonctions
admissibles du snapshot ; caps hors fermeture admissibles permis mais non facturés.
Propriétés héritées, getters ou objets non JSON ne fournissent jamais un mode,
un cap ou un contexte implicite. Ne pas muter/geler les objets fournis par l'appelant.

## S/C/N/T, sélection et sidecar

Mesurer S avec l'objet scientifique existant inchangé, pas padding. C=max(S,caps des
fonctions possédées) est le **plafond commun d'unité**, pas une promesse que chaque
cap par fonction est contrôlé individuellement par L6. N compte une exécution par
sous-intent, pas pipelineCost ni compte monétaire. T=C×N sur entiers sûrs.
Ne pas rendre N inconnu si les rôles/counts immuables sont effectivement connus ;
cap unknown peut laisser N connu et C/T inconnus. Absence d'allocation nécessaire
→ diagnostic, pas entrée numérique de secours pour C.

Avant include : C≤plafond unitaire et somme T des unités nouvelles de la fermeture
≤total, callee partagé déjà sélectionné non recompté, SCC indivisible. Somme qui ne
tient pas est refusée proprement avant débordement/arrondi. Aucun root partiellement
admis si sa fermeture obligatoire est invalide/inconnue. Aucun prix S avant sélection
suivi d'un rehash à C. Contexte non possédé n'a pas de sous-intent facturé.

En mode nouveau seulement, plan.units.contextEnvelopeUtf8Bytes et
sidecar.envelopeBytesByUnit portent C (unknown/map absent si non allouable).
Sidecar schema1 extensible reçoit `admissionBudget` version
planner-admission-accounting-v1, context, allocationFingerprint nullable en cas
diagnostique, byUnit avec S/C/N/T distincts, selectedTotalAdmissionUtf8Bytes.
Les ensembles/valeurs exposées, versions/empreintes et sélection doivent être
vérifiés à la lecture et en readiness avec contexte courant obligatoire.

Parent a relu L6 freezePlan384–407 : schéma du plan, binding et unités sélectionnées
vérifiés ; sidecar extensible. Plan schema1 permet known=false/value=null pour
budget inconnu. Pas de champ L1 ajouté, guard L6 body≤C≤plafond inchangé.

## Gates supplémentaires opposables

Ancien vecteur complet byte-exact + ancien nom de version ressemblant au préfixe ;
nouveaux modes/contexts et stripping, champs mutés, missing/unknown/prototype/extra/
overflow, immutabilité input/output ; budget C et total seuil exact/±1 UTF8/escapes,
fermetures callee partagé/SCC/selfloop/multifonction/contexte, IDs/claims interplans.
Ne pas importer les données privées REFERENCE_L8 dans les tests portables intégrés.

En plus de validateGraphDocument/types, faire un **petit positif réel GraphStore
SQLite fixture via ses APIs publiques** pour freeze du nouveau plan/sidecar et
relecture, puis guard d'admission C/oversize sans bypass. Pas SQL fabriquant des
preuves, pas réception/publish scientifique revendiquée. DB propre unique sous
Temp/opencode/l5-admission-budget-*, fermer/conserver, zéro delete ; pas changer
TEMP global. Si setup d'autorité/API insuffisant, escalader, pas faux reçu.

N=1 toutes générations/passes confondues reste une obligation **durable L8 à venir**,
pas une garantie de L5 seul. Retry du même body/executionId n'est pas nouveau budget.
Le lecteur L8 strict aura une branche/version prospective dédiée ; son auteur seul
l'adaptera après review/gates/transfert/GO, anciens lecteurs préservés.

Typecheck/focused/full, anciennes régressions intactes, vrais codes/comptes/pins,
nouvelle review indépendante puis gates parent. Pas Git/install/réseau/LLM/dispatch/
IDA/live/DB privée/sous-agent/inbox/reset/suppression. Toute nouvelle décision ou
besoin hors paths → STOP ciblé/parent avant write. Pas clôture L8 ou autorité native.
