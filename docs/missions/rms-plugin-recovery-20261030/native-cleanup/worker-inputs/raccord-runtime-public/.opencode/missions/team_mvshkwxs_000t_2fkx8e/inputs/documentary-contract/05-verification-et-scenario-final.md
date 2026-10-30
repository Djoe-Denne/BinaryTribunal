# 5. Vérification et scénario final — contrat futur, non autorisant

Date : 28 octobre 2026. **Accepté dans sa portée documentaire après revue
indépendante et validation parent. Aucun contrôle produit exécuté ici.**

## Autorité des attentes et preuves réutilisables

Chemins relatifs à `re-ff8` : `D` = `docs/missions/re-graph-scheduler` ;
`M` = `.opencode/missions/team_mvnxgnse_0000_39vpc8` ; `E` = `M/evidence` ;
`H` = `tools/ff8-harness` ; `C` = `.tmp/m2-s1-integration-r2/tools/ff8-harness` ;
`L7` = `M/inputs/l7-scenarios-r2/PLAN_PHASE1.md`.

Les attentes viennent des contrats et de L7, pas des résultats du produit.
Les tests existants localisent ensuite les contrôles. Aucun golden scientifique,
attendu privé ou code d’oracle n’est publié. Références : ordre documentaire:237–265,
313–374 ; ordre M2:346–427 ; `D/contract/CONTRAT.md:430–538` et contrats S1 applicables.
Faits, inférences, propositions et inconnues restent distingués ; états de
réutilisation selon [D1](01-preuves-et-versions.md), sans absence universelle déduite.

Le plan L7 est une livraison indépendante déjà reçue, pas une réalisation à
recréer : `M/reports/47-l7-plan-independant-recu.md:5–19` conserve contexte frais
et absence de lecture producteur selon son retour, acceptés comme préparation.
Ses douze familles S01–S12 sont la base ; seules les frontières affectées évoluent.
Ses fichiers proposés, bases, processus et budgets ne sont pas des autorisations.

Plan : 8 753 octets, SHA-256
`27a7944b566970c1f40806169bd0c56319bd1d291101b8c809fae57326336aaa`,
conforme à `M/inputs/l7-scenarios-r2/RECEIPT.json:7–11`. Empreinte revérifiée par
l’auteur et le parent. Le parent a relu les 48 lignes du plan et les clauses
KnowledgeCommit/états/budgets du contrat, sans exécuter leurs exemples.

Conserver séparément M1/A09, 450 paires/neuf régressions, planner 415 tests/17 077
assertions, S1 DATA/pures et preuves fixture de D1. La composition actuelle et
l’overlay codec ne reçoivent aucune qualification par simple transfert de compteur.
Le sourceSet historique ne s’applique pas silencieusement à un nouvel emplacement.

## Matrice de vérification future

Pour toutes les lignes : **permission actuelle = lecture documentaire seulement**.
Les références de tests sont des sources lues, ni des oracles indépendants par
leur seul nom ni des PASS courants. Toute exécution exige le futur contrat logiciel.

### Transitions/préconditions — L7 S01

- Oracle : L7:4,17 ; CONTRAT:500–519, prérequis/révisions/contexte et recontrôle
  atomique au dispatch. Le plan reprend les 31 arêtes utiles du contrat et les
  négatifs ; pas d’état fabriqué par SQL ni retour QUARANTINED→READY inventé.
- Preuve : acquis L6 historiques à rapprocher selon L7:7,13 ; DATA S1 insuffisant.
  Contrôles localisés : `H/test/eventlog.test.ts:516,653,701,710`.
- Statut : **changé**, couverture intégrée non établie. La procédure explicite
  de libération QUARANTINED reste à contractualiser si nécessaire (L7:44).

### CAS, exclusivité et références périmées — S02/S09/S12

- Oracle : L7:5,18,25,28 ; CONTRAT:517, possession `fn:` indépendante des clusters,
  un seul gagnant durable, perdant périmé sans droit nouveau.
- Preuve : fixtures T1/T2 bornées ; deux handles séquentiels ne prouvent pas le
  chevauchement réel. Contrôles : `H/test/eventlog.test.ts:490,497`,
  `H/test/simulator/graph-interop-durability.test.ts:147`.
- Statut : **changé/bloqué** ; drivers, effets et éventuels rivaux exigent leur
  autorisation propre. Aucune contention réelle exécutée ici.

### Fraîcheur/révocation/barrières — S01/S02 et remplacement

- Oracle : ordre documentaire:344–348, ordre M2:302–307 et [D3](03-remplacement-options-et-arbitrages.md).
  Lectures LIVE pré/postappend, TTL et coupes originales restent opposables.
- Preuve : contrôles locaux source158/source164 seulement. Contrôles :
  `C/test/s2-author/t1-transition.test.ts:58,86`, `replacement.test.ts:76,129,204,212`.
- Statut : **acquis local/changé** ; impact à établir avant réutilisation, pas
  de rafraîchissement des preuves ou permission mémorisée.

### Budgets/quotas/provenance — S05/S10

- Oracle : L7:8,21,26 ; ordre documentaire:339–342 ; CONTRAT:521–525.
  Bootstrap compris, commit +1/retry identique +0/rollback +0, sans remboursement,
  plafonds distincts ; disponibilité/repacking ne crée pas un grant.
- Preuve : `E/s2-t2-105-validation.json:2–22`, quota trois dans sa fixture.
  Contrôles : `C/test/s2-author/t2-activation.test.ts:85,99`,
  `resource-admission.test.ts:92,201,215`.
- Statut : **acquis réutilisable borné** ; jonction native non établie. Provenance
  absente ≠ zéro ; budget en UTF-8 sur body complet, pas longueur de caractères.

### Admission ambiguë/réponse perdue — S03/S04

- Oracle : L7:6–7,19–20 ; CONTRAT:519 ; [D4](04-contrat-public-et-observations.md).
  Retry exact conserve identité/body/charge ; absence instantanée après envoi
  n’est pas un rejet définitif.
- Preuve : préparation publique reçue, 23 cas ajoutés NON EXÉCUTÉS.
  Contrôles : `H/test/eventlog.test.ts:562,571,973`,
  `graph-integration/recovery.test.ts:198,206`.
- Statut : **bloqué pour preuve publique** ; garanties serveur/observation/
  permissions à fermer. Réémission éventuelle identique ≠ seconde admission native.

### Digests/corps/refus typés — S03/S11

- Oracle : contrat S1 `07-historical-admission-projection.md:34–60`, D4.
  Digest payload client ≠ digest upstream du body historique complet.
- Preuve : DATA S1 n’authentifie pas l’admission. Contrôles :
  `H/test/client.test.ts:23,26,58,74,93,100`,
  `graph-integration/protocol.test.ts:5–25`.
- Statut : **changé/bloqué** ; handler RPC/version/formes à ratifier. Une catégorie
  générique ne fabrique pas `execution_rejected`, l’absence de worker ou un verdict scientifique.

### Terminalité/arrêt/résultat tardif — S04/S10

- Oracle : CONTRAT:452,514–519 ; L7:7,20 ; D4. Bail expiré, stop demandé,
  panne fournisseur ou notification absente ne prouvent pas la fin.
- Preuve : L6 offline borné, pas de terminalité native déduite d’une fixture.
  Contrôles : `H/test/eventlog.test.ts:530,591,739,757`,
  `graph-integration/recovery.test.ts:206–218`.
- Statut : **bloqué** ; événements/reçus exacts et garanties à établir. Claims
  retenus sans quiescence liée, résultat tardif conservé sans effet scientifique.

### Retrait/conservation intergénérations — S04/S05/S09

- Oracle : CONTRAT:452,517 ; L7:20–21,25 ; préparation non autorisante.
  Conserver identités/fences exactes, histoire et droits consommés.
- Preuve : `E/s2-cross-epoch-115-validation.json:2–23`, fixture jamais envoyée
  seulement. Contrôles : `C/test/s2-author/cross-epoch.test.ts:7,41,60,80,100`,
  `resource-admission.test.ts:133`.
- Statut : **acquis borné/bloqué au-delà** ; pas de retrait après envoi qualifié
  par cette preuve, pas de crédits recréés depuis SPENT/BURNED/ENCUMBERED.

### Remplacement atomique/ressources — complément contractuel de L7

- Oracle : ordre documentaire:339–348, D3 ; OLD ABORTED/NEW PENDING_DRAIN,
  aucun RUNNING intermédiaire, seul worker-a vrai→faux.
- Preuve : dernier reçu source176 **FAIL**, `productTestAccepted:false`.
  Contrôles : `C/test/s2-author/replacement.test.ts:19,32,40,44,57,64,70,86`.
- Statut : **bloqué**. Délai, trois threads interdits et deux NEW/quatre origines
  sont trois questions séparées ; ni compte partagé, modèle, droits racine ou
  worker-b ne change pour fabriquer un succès.

### Familles/revue/autorité parent — S11

- Oracle : L7:11,27 ; CONTRAT:465–519. A/B indépendants, R de la fonction
  exacte, bulletin ou réconciliation incertaine non débloquants.
- Preuve : attestations et tests fixture bornés. Contrôles :
  `H/test/eventlog.test.ts:602,722,1123,1149`,
  `graph-integration/engine.test.ts:7,68`.
- Statut : **changé/bloqué natif** ; auteurs/session/Model.Ref et autorité parent
  restent nécessaires, sans validation scientifique implicite par Ensemble completed.

### Publication/readback/reprise — S06

- Oracle : L7:9,22,45 ; CONTRAT:465–502, sortie=entrée+1 et niveau/effet requis.
  Pending/mismatch/niveau insuffisant ne satisfont aucun prérequis.
- Preuve : fixtures, pas publication générale qualifiée. Contrôles :
  `H/test/eventlog.test.ts:616,632,682,1046`,
  `graph-integration/recovery.test.ts:163,173`.
- Statut : **changé/bloqué au-delà fixture** ; cible admissible et retry unique
  à fermer. COMMITTED appartient à la WorkUnit, jamais à l’attempt ou au commit Git.

### DAG/replay/prochain travail — S07/S08/S09

- Oracle : L7:10,23–25, DAG écrit indépendamment de `evaluateReadiness` produit.
  Reprendre les six ordres D/E/F, pas rechercher une seed favorable.
- Preuve : planner gelé et anciennes preuves L7 bornées ; contexte nouveau non
  acquis automatiquement. Contrôles :
  `H/test/simulator/graph-interop-planning.test.ts:34,71`,
  `graph-integration/engine.test.ts:38`.
- Statut : **changé/bloqué** ; audit replay ≠ reconstruction décisionnelle ;
  receipt débloquant ≠ nouveaux octets dans le `cycleKnowledge` gelé (D2).

### Mesures et comparaisons restant applicables

L7:12,46 distingue des mesures DTO synthétiques déjà acquises d’une preuve de
performance produit, CPU/pic ou comparaison. Rapprocher l’obligation encore
applicable et ses preuves, ou demander l’arbitrage précis ; ne transférer ni un
résultat DTO ni le diagnostic source176 comme benchmark contrôlé. Aucun benchmark
ou nouvelle campagne n’est créé ou autorisé par cette matrice.

## Scénario final proposé, non exécuté

Les noms D/E/F/B/C/A désignent les rôles du DAG public L7, pas des identifiants
natifs. Ce scénario est un contrat d’observation futur, pas un récit de PASS.

1. **Épingler les entrées :** faits/binaire/configuration, snapshot, versions,
   connaissance, droits et composition exacte ; provenance manquante bloque.
2. **Calculer :** RMS produit graphe/groupes/plan/bindings ; comparer identités,
   fermeture et invariants contractuels, sans nouveau golden scientifique.
3. **Fermer v2/v3 :** choisir explicitement la jonction ; produire une préparation
   DATA v3 ne prouve pas que `runtimeRun` la consomme.
4. **Préparer puis admettre :** préparation non autorisante, recontrôle atomique
   plan/révision/fence/claims/budgets, body exact durable avant effet externe.
5. **Perdre la réponse après admission :** conserver l’ambiguïté jusqu’au
   rapprochement faisant autorité ; pas de nouvelle identité ou origine.
6. **Reprendre exactement :** mêmes entrées et bindings, receipt de la même admission.
   Une réémission identique éventuellement nécessaire ne crée ni second worker,
   seconde charge, nouvelle origine ou double publication.
7. **Conserver le cas dangereux :** lease expiré/arrêt ambigu ⇒ claims et tardifs
   conservés ; pas de réassignation sans preuve terminale ni d’arête QUARANTINED inventée.
8. **Joindre les faits natifs :** sessions/Model.Ref/droits/terminalité OpenCode,
   livrables restitués par Ensemble, joins contrôlés RMS ; événements précis à établir.
9. **Réconcilier puis valider :** R reçoit A/B exacts ; parent valide faits et
   attestation. Une tâche Ensemble completed n’en tient pas lieu.
10. **Publier avec les coupures S06 :** après prepare, write/réponse perdue,
    readback avant commit et commit/réponse perdue ; même cible/body/digest,
    un seul effet durable et retry exact, sans publier un résultat retiré.
11. **Constater le commit :** readback exact/niveau/effet requis, un KnowledgeCommit,
    sortie=entrée+1 puis WorkUnit COMMITTED ; pending/mismatch ne débloquent rien.
12. **Débloquer le DAG :** commits D/E permettent B même si F reste actif ; C
    attend F, A attend B/C. Pas de barrière entre branches indépendantes.
13. **Prouver séparément le nouveau contexte :** octets publiés, matérialisation,
    approbation et projection versionnée ; readiness/receipt ne suffisent pas.
    Ne pas modifier le cycle gelé pour faire réussir cette observation.
14. **Rejouer décisionnellement :** mêmes entrées/configuration/journal ⇒ mêmes
    décisions/identités/charges/effets, pas les mêmes PID ou temps muraux.

Fixture, transport contrôlé et observation native prouvent chacun leur propre
frontière. Aucun de ces niveaux, isolément, ne qualifie toute la chaîne.

## Futur contrat d’exécution : permissions, bornes et arrêt

`bun run typecheck`, `bun run test:q1-primitives` et `bun test` sont définis dans
`H/package.json:5–8`, mais **NON EXÉCUTÉS et hors mandat actuel**.
Un futur `bun test` reste bloqué s’il atteint les trois chemins HOLD125
(`C/test/s2-author/replacement.test.ts:112–113,235–237`). Un filtre éventuellement
autorisé ne devient pas la suite complète. Timeout/`Worker.terminate()` ne
fournit pas la garantie native anti-orphelin manquante.

Quinze secondes par test inchangées. Les enveloppes L7:30–38 et anciens timeouts
de tests ne ratifient aucune exception. Le diagnostic de 110 956,53 ms reste FAIL.
Aucune optimisation sélectionnée, seconde mesure ou nouvelle instrumentation
autorisée par D3. Deux NEW distincts/quatre origines restent bloqués sous plafond
trois même si la garantie threads est obtenue ; pas de nouvelle racine/reset.

Avant toute exécution future : pins, impact, interfaces, droits, ownership,
budgets, effets, ressources neuves et arrêt explicitement approuvés. L9 indépendant
et L10 parent restent à rapprocher, pas une chaîne fixe de nouveaux agents ni
une permission accordée par ce document.

## QA documentaire et limites

L’auteur a lu D1–D4, contrats, L7/reçu/rapport47, localisé les contrôles existants
et relu `GraphEngine.observe` via Serena sur `retro-eng`. Le parent a relu le plan
L7 original et les clauses de KnowledgeCommit/états/budgets. Aucun handler RPC
déployé ou provenance native n’est qualifié par ces lectures.

La revue indépendante fresh/session distincte doit vérifier transferts de preuves,
indépendance L7, v2/v3, digest/body, terminalité/retrait, trois blocages distincts,
publication et nouveau contexte. Réutiliser les reviews valides ; reprise sur
bloquants/impacts seulement. Acceptation et publication restent parent.

Les manques logiciels peuvent rester explicitement bloqués dans un dossier
documentaire recevable. Une source essentielle manquante, incohérence critique,
revue requise absente ou acceptation parent manquante bloque sa clôture.
Aucun test/module produit, base, processus, mesure, patch, Git, IDA/live,
démonstration native, oracle/driver/fixture/harnais nouveau ou historique modifié.
