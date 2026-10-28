# L5 — revue finale relations et correction ciblée

2026-10-14. Rapport final `task_mv8038uj_0039_d6aa5v`, reviewer indépendant
Sol Max `ses_ec5ea2703ffehbkO0FhECwNWTl`, récupéré via API publique authentifiée
`message.list`, message `msg_13b0f3358001ru7ZgzVGWBMrKz`. « No unread messages »
n'était pas absence de rapport. Verdict **BLOQUANT API L5**, gel L5REL
`b589ad7227e25c2411650266f22b098f9ee49a306051acb4f3be453caf1cfcb8`,
33/33SHA inchangés. Source planner.ts `e735129277c7f6c771bd942902b0decd8fb6dd44623d02aff9a78ad64fc30abc`.

## Deux défauts reproduits aussi par le parent

**RV5REL-01 P1**, planner.ts:466–489,629–633. Vrai normalizer gelé puis transport
strict JSON roundtrip, A→B interne,65sites en shards64/1, toutes policies
external_satisfied et receipt externe valide producerUnitId=null. A seul READY.
A+B groupes séparés sélectionnés : prereq conserve external_satisfied mais
producerUnitId devient unit(B), receipt sidecar conserve null ; READYfalse.
Receipt local B à commit DISTINCT/revision suivante satisfait la requirement via
receiptSatisfies mais READY reste false : branche external ne consomme que le
receipt sidecar. Blocage impossible à réparer par publication locale.

**RV5REL-02 P2**, planner.ts:176–180,216–219. Snapshot transportstrict valide,
recordID=constructor : edgeKinds absent accepté, dictionnaire vide{} rejeté
invalid legacy edgeKind, propriété explicite constructor:obligatory acceptée.
Lookup hérité Object.prototype ≠ déclaration propre. Les variantes toString,
hasOwnProperty doivent aussi être testées ; ne pas bannir ces identifiants.

Probe parent `.tmp/re-graph-scheduler/l5-relation-parent-probe-20261014.ts`,
dernier run **exit0** reproduit les deux défauts. Trois premiers essais avaient
des erreurs de construction de probe (GraphParts collections/result, siteRva,
resourcesByFunction), corrigées : ils ne sont pas des preuves contre L5 ni pannes
du MCP. Tous sites synthétiques65 sont dans les chunks caller connus.

## Contrat de correction

- Auteur source `l5-shard-max` natif public get confirmé
  `ses_ec68f34b6ffehhjHKhC8isdSMm`, openai/gpt-6.1-sol/**max**, ownWT attendu.
  Après correctionMax et reviewMax encore bloquantes, effortSol maximal épuisé :
  **Astra max dernier recours préautorisé**, nouvelle session corrective fresh.
  Pas de changement des modèles/préférences de mission ni du modèle ancien.
- Own seulement `tools/ff8-harness/src/planner.ts` et `test/planner.test.ts`.
  Initialiser depuis L5REL, deps gelées readonly ; préserver baseline main51cbc6e
  et ancien gel. Pas remplacement d'une continuation interrompue : nouvelle étape
  de correction après rapport final, pas reprise du reviewer achevé.
- Producteur externe/prérequis/consommation cohérents dès émission. Un receipt
  externe null ne devient jamais un receipt local par relabel. Combinaison valable
  interne avec preuve externe préexistante doit être READY indépendamment de la
  sélection locale de B ; API nouvelle/non-support diagnostique : escalader au
  parent avantwrite. Préserver invalidation, dispense, niveaux1/2 et binding exact.
- ByEdge propres seulement pour edgeKinds/dispensations/externalReceipts, pas
  prototype hérité. Propriété propre explicite valide reste admissible ; schémaL1
  inchangé. Regressions absence/{}/own/inherited pour chacun des dictionnaires.
- Régressions A seul/A+B, shards64/65/129/repacking, commits externes/locaux
  distincts, sameunit/closure/G1/conflicts/contextbudget/oldsidecar. Nouvelles
  sorties hashées sans réécriture de plans/unités/fonctions déjà possédés.
- Typecheck/focused/full et hashes avant/après. Aucune édition L1/central/config,
  aucun Git/registre/IDA/live/install/newdep/subagent/team_results. Re-review
  fraîche ciblée + gates parent avant intégration. Ne pas rouvrir arbitrairement
  tout planner sans nouvelle preuve ; escalader tout nouveau défaut réel.

Plan writer approuvé : sameunit A+B conserve un prérequis externe **null** vérifié
(sans dépendance locale autoréférente), pour que requirement/invalidation restent
effectives. Marqueur privé de sémantique dans le **nouveau planId** approuvé ;
aucun champ transportL1/sidecarv1 ajouté, anciennes identités et bindings ne migrent
pas. Toute modification des guards d'anciens bindings demanderait nouvelle décision.
Prérequis locaux des tests readonlyL2 copiés :98raw + manifeste original SHA79790bef…,
junction node_modules READONLY vers main package/lock identiques, aucun install.

## Positifs et limites de la revue finale

Union/proof associations64/65/129, conflitsmetadata/policy avantfiltre,
repacking/budgets exacts,320plans DAG ×budget/oracle reachability (653assertions),
new-plan marker relationViewVersion, legacyfixture/receipt, callbackDATA et SCC
partielle exercés indépendamment. Aucun fullsuite dans gel initial sanspackage,
ni benchmark100k/commit scientifique/native/limite2000. Dépendance L2 nonacceptée,
gate L8 et review globale L9 restent obligatoires.
