# L8 — transfert borné d'ownership phase1

Décision parent sous reprise continue utilisateur. Ancien l8-integration-r1 idle
natif confirmé, jamais repris/modifié ; ses gels et receipts restent historiques.
Préflight fresh Sol/xhigh READY_FOR_PARENT_OWNERSHIP:16/16runtime365568B exacts,
10/10dépendances main exactes. Pas de décision utilisateur supplémentaire requise.

## Phase1A: parent seul intégrateur des artefacts déjà revus

Sous tools/ff8-harness:4fichiers existants src/{domain,engine,cli,client}.ts,
3nouveaux src/{graph-pipeline,graph-adapter,graph-engine}.ts,
8nouveaux test/graph-integration/{fixture-driver,pipeline.test,engine.test,
protocol.test,authority.test,recovery.test,cli.test,body-pause-regressions.test}.ts
(les noms .test ci-dessus sont les basenames, sans ajouter un second suffixe).
Les4préimages main et les hunks vérifiés sont gardés; images finales attendues
pins runtime16. adapter.ts=16e pin de contrôle identique, aucune écriture.
Ajout des11artefacts déjà acceptés par déploiement byte-exact, pas de réécriture
de leur code. Pas de merge du worktree historique. Garde247 hors allowlist,
package/tsconfig/bun.lock et maintenance/15nouveaux restent byte-exacts.

Review fresh du transfert/diff, puis parent typecheck et tests bornés sous gate
fixtures/OWN/retention/lease distincte;107PASS historique n'est pas le résultat
main. Aucune fixture/DB historique,full implicite ou nettoyage anticipé.

## Phase1B: source et QA séparées, intégration parent

Deux schémas transport déjà revus fd4cdd41…/c6c60ab6… déployés exacts sous schemas/.
Nouvel auteur fresh possède uniquement sa sortie graph-transport.ts+DESIGN+
MANIFEST; QA fresh possède graph-transport.test.ts distinct après contrat API
ratifié. Aucune écriture main par les workers, aucun git/run/import produit.
V fresh et contrôles parent avant promotion. Module séparé, pas de widening des
loaders/domain/v1v2/graph-store ou d'activationB/adoption/HOST fabriquée.

## Hors tranche, prochaine phase non abandonnée

C3-C5/runtimeB requièrent contrat runV3 versionné, snapshot complet/L5/admission,
trustedHOST/L6,drain des familles engagées sans changer anchor/originaux,budgets
SPENT cumulatifs cross-epochs,pub vrais octets/context caps/blindness,CLI explicite.
Préparation puis revue de ce contrat suivront sans GO utilisateur de routine.
QA L7/L8 substantielle puis L9/L10 restent requises;full44/000d distincts.
run01/live/FF8 et G5-G7 ne sont pas autorisés par cette disposition.
