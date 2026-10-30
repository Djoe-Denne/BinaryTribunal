# 1. Preuves, versions et livraisons conservées

Date : 28 octobre 2026. Mission documentaire `rms-static-documentation-20261028`.
**Accepté dans le dossier documentaire après revue indépendante et validation
parent. Aucune nouvelle qualification ou acceptation du produit.**

## Référentiel et lecture des statuts

Tous les chemins sont relatifs à la racine `re-ff8`. Abréviations :

- `D` : `docs/missions/re-graph-scheduler`.
- `M` : `.opencode/missions/team_mvnxgnse_0000_39vpc8` ; `E` : `M/evidence`.
- `C` : `.tmp/m2-s1-integration-r2/tools/ff8-harness`.
- `S` : `.tmp/m2-s1-candidate-r2/tools/ff8-harness`.
- `N` : `.opencode/missions/team_mvsebirm_000e_48pl3y`.

**Acquis réutilisable** signifie dans la version, les entrées, l’oracle et les
conditions indiqués. **Changé** demande une analyse d’impact avant transfert de
preuve. **Absent** signifie non établi dans le corpus examiné, pas absence
universelle de code ou de livraison. **Bloqué** conserve une condition explicite.

Le journal contient des états historiques non chronologiques : son état récent
est `M/REPRISE_JOURNAL.md:7–13`. Les anciens paragraphes P4/P5 ne rouvrent pas
les acceptations ultérieures. Le code présent n’est ni une preuve d’intégration
Git, ni une observation native, ni une autorisation d’exécution.

## Matrice des obligations et décisions

### 1. M1 et A09 — acquis réutilisable

Sources : ordre M2 `D/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md:43–157`
et `D/M1_RETRAIT_CSHARP_BILAN.md:128–150`. M1 reste
`ACCEPTED_INTEGRATED`, A09 clos ; manifeste et reçu T4 final conservés.
Q01/Q03/Q04 et Q09 partielle ne prouvent pas l’équivalence du helper entier.
Les 57 familles BLOCKED archivées ne sont pas un backlog de portage.

**Décision :** ne refaire ni la migration C#, ni l’inventaire M1. Les anciennes
mentions « A09 ouvert » et les états intermédiaires de T4 restent historiques.

### 2. Numeric/context 450 et neuf régressions — acquis dans leur portée

Sources : `M/reports/29-numeric-accepte-passage-s1.md:5–19` et
`E/dispatch-science-r1-adjudication.json:3–31`. Le run conservé
`numeric_m2_20261026_dispatch_001` comporte 450 paires : 224 valeurs et 226 refus,
avec adjudication exhaustive index/observations/stages, provenance RAW et
6 366 artefacts. Les neuf régressions ont une preuve distincte 9 PASS/0 FAIL,
31 860 assertions, reliée par le rapport 29 ; ne pas additionner les suites.

Le parent a relu l’adjudication : `QUALIFIED_NUMERIC_CONTEXT_DIFFERENTIAL_450_SCOPED`,
450 observations égales, sorties root/enfant à zéro, limites explicitement
distinctes des neuf régressions. Les deux invocations inspectées consommées
ne créent pas une permission pour une troisième.

**Décision :** conserver les identités, oracles et RAW ; aucun rejeu. Ne pas
déduire une qualification full44, native universelle, S1 intégré ou M2 clos.
Le premier échec ORIGIN208 reste conservé. Les 450 paires ne sont pas « 450 tests Bun ».

### 3. Planner — gel qualifié, canonique à rapprocher

Sources : `D/PLANNER_FIXED_PROJECTIONS_QUALIFICATION_20261019.md:3–48,58–69`,
`E/planner-parent-verification.json`, `M/REPRISE_JOURNAL.md:414,420–426`.
Le gel R2 sous `.tmp/mission-v2-20261018-continuous/planner-fixed-projections-r2-frozen/`
porte 415 tests/17 077 assertions/13 fichiers ; les sept petits oracles parent
ne font pas partie de ce total. Les contrôles antérieurs de fermeture ont trouvé
12/14 entrées conformes et deux modules absents du harness canonique.

**Décision :** réutiliser les preuves du gel, pas transférer leur compteur au
canonique ou à S1. Examiner les consommateurs modifiés ; ne pas retraiter les
traces de 593 Mo sans invalidation pertinente.

### 4. S1 DATA et fonctions pures — acquis hors ligne, non intégré

Sources : `M/inputs/s1-contract-r2/proposal/01–07`,
`E/s1-final-manifest-r2.json`,
`M/reports/55-s1-qa-data-acceptee-et-preparation-integration.md:5–38`.
La qualification indépendante est `S1_QUALIFIED_OFFLINE_DATA_NOT_INTEGRATED` :
QA12 typing ; QA13/14/15 : 58, 47 et 2 PASS, soit le total propre S1 de
107 PASS/354 assertions. Ce total n’inclut pas les verts auteur ou d’autres suites.

Les 47 fichiers de `S` correspondent actuellement au manifeste, vérifiés par
l’auteur puis indépendamment par le parent. Les `codecBytes` restent des octets
opaques épinglés : type, UTF-8 et empreinte ne sont pas une authenticité native.
La frontière `actualBodyUTF8 ≤ CunitCourant ≤ CrootAcquired` sur le corps complet
émis reste à distinguer de la seule preuve DATA.

**Décision :** conserver acquisition/authentification, admission et émission comme
obligations distinctes ; pas de waiver DATA. Références contractuelles :
`01-root-envelope-t0.md:8,29`, `03-numeric-root-planner.md:26`,
`04-bases-versions-gates.md:26`, dans la proposition S1.

### 5. Composition S1 — acquis initial, overlay actuel changé et explicite

Sources : `M/reports/64-reprise-integration-isolee-sans-nouveau-contrat.md:9–37`,
`E/s1-integration-r2-composition.json`. Composition initiale : 300 chemins baseline
GO et 13 sélections S1, quatre remplacements, sept modules et deux schémas ajoutés,
suffixe public conservé ; 309 fichiers/3 181 343 octets, typing ciblé historique vert.

Le parent retrouve aujourd’hui **308/309 lignes conformes**. Seul
`src/graph-execution-envelope.ts` diffère, selon l’overlay diagnostic autorisé
par le rapport 146. Cela ne disqualifie pas les octets qualifiés conservés dans
`S`, mais interdit de les déclarer identiques au codec courant de `C`.

**Décision :** le typing initial ne qualifie pas l’overlay ultérieur, S2/S3 ou le
suffixe TDD public exclu. Transporter la composition exacte, pas seulement HEAD.

### 6. Persistance/admission et ressources — acquis fixture bornés

Sources : rapports M2 `73-persistance-fixture-premiers-tests-acceptes.md:5–25`
et `82-reservations-physiques-fixture-verifiees.md`, reçus
`E/s2-fixture-70-validation.json` et `E/s2-resource-81-validation.json`.
Les preuves historiques propres sont 14 PASS/177 assertions pour bootstrap/admission
et 60 PASS/436 assertions pour les ressources physiques, avec revue et vérification
parent dans leurs versions. Bases synthétiques neuves, commande administrative
non envoyée à un agent.

**Décision :** réutiliser les primitives hors impact ; ne pas en déduire route
agent, dispatch public, contention d’émission ou publication générale.

### 7. Préparation, T1/T2 minimal et plafond trois — acquis fixture

Sources : rapports M2 `85-borne-trois-origines-approuvee.md:5–23`,
`91-prepare-et-barriere-t1-verifies-partiellement.md:5–23`,
`106-t2-minimal-et-quota-trois-verifies.md:5–21`, reçus
`E/s2-t1-88-validation.json` et `E/s2-t2-105-validation.json`.
T1 : 87 PASS/592 assertions ; T2 : 116 PASS/763 assertions, incluant des cas
antérieurs affectés. Ne pas additionner ces totaux.

La preuve « trois origines commises puis quatrième refus spécifique » existe
au rapport 106 ; son absence encore mentionnée dans T1 est historique.
Bootstrap compris : nouvelle origine commit +1, retry exact +0, rollback avant
persistance +0 ; aucun remboursement/reset. Préparation, remplacement et activation
gardent leurs plafonds distincts ; provenance manquante ne signifie pas zéro.

**Décision :** ne pas généraliser le chemin minimal A→A avec inventaire vide
explicitement prouvé à toute quiescence après travail envoyé ou admission après activation.

### 8. Droits consommés intergénérations — acquis dans la fixture jamais envoyée

Source : `M/reports/116-conservation-droits-consommes-verifiee.md:5–21`,
`E/s2-cross-epoch-115-validation.json`. Preuve : 131 PASS/880 assertions sur cinq
fichiers, dont quinze cas CrossEpoch ; droits SPENT/BURNED/ENCUMBERED conservés
après T2/reopen, refus et rollback LIVE atteints. Fille DEFER/BLOCKED, sans réassignation.
L’ancien 129 PASS/2 FAIL reste rouge conservé.

**Décision :** pas de qualification de travail envoyé, publication ou connaissance
reconstruite ; vérifier l’impact des sources de remplacement avant transfert de preuve.

### 9. Remplacement et contrôles locaux — bloqué, pas de nouveau PASS

Sources : `E/s2-replacement-source-176.json`,
`E/s2-measure-179-validation.json:2–28`, rapport M2 180:5–38 ; reçu primaire
`.tmp/m2-s1-integration-r2/evidence/s2-measure-176-runtime/resources.result.json`.
Le parent vérifie directement l’empreinte du reçu et ses champs : 0 PASS/1 FAIL,
7 assertions, processus 111 168 ms, diagnostic complet, `productTestAccepted:false`.
Le test de 110 956,53 ms dépasse quinze secondes. L’achèvement du diagnostic ne
compense pas cet échec. Arrêt des nouvelles exécutions conservé.

La copie ciblée mesurée prend 4,2234 ms/4 appels, environ 0,00446 % des deux
phases fraîches : ce constat ne couvre pas toutes les copies ou le coût restant.
Les temps inclusifs ne s’additionnent pas causalement. Pas d’attribution GC/SQL,
de gain promis, de seconde mesure ou de patch autorisé par ce dossier.

Contrôles locaux : rapports `162-mutations-vertes-mesurer-trajet-final.md:5–17`
et `168-refus-verts-diagnostic-cles-locales.md:3–9` : cinq mutations source158,
5 PASS/129 assertions ; sept refus source164, 7 PASS/35 assertions. Les rapports
161/167 sont les autorisations, non les résultats. Ces verts restent locaux,
réutilisables hors impact établi, sans couverture des cas non sélectionnés.

### 10. Threads et deux candidats distincts — deux blocages non levés

Sources : rapport M2 `125-sortie-thread-limite-avant-execution.md:5–21`,
`131-compilation-verte-preparer-tests-sans-thread.md:11–17`, rapport 180:32–34.
Les trois chemins threads restent NON EXÉCUTÉS/HOLD125. Timeout, fin de test ou
`Worker.terminate()` ne garantissent pas la fin native sans orphelin.
Bootstrap + OLD + deux NEW distincts exigent quatre origines sous plafond trois.
Une contention sur un même NEW n’est pas une preuve équivalente.

**Décision :** conserver les arbitrages séparés ; aucun nouveau root, plafond,
runner ou confinement implicitement autorisé.

### 11. L7 — livraison indépendante retrouvée, réalisation non acquise

Sources : `M/inputs/l7-scenarios-r2/PLAN_PHASE1.md:1–48` et
`M/reports/47-l7-plan-independant-recu.md:5–25`. Douze familles documentaires
finies et attentes contractuelles conservées ; préparation acceptée, pas runtime L7.
Le parent revérifie 8 753 octets et l’empreinte du plan indiqué ci-dessous.

**Décision :** reprendre ce plan sans recréation ; actualiser uniquement les
signatures, versions et frontières affectées. Ses propositions de fichiers,
bases, processus et budgets ne sont pas des autorisations actuelles.

### 12. Public OpenCode, récupération, publication et prochain travail — non clos

Préparation publique : rapports M2 `57-public-preparation-ro-et-politique-locale.md:17–25`,
`58-public-tdd-ajoute-et-clarification-ro.md:11–25`,
`62-plan-public-ro-recu-sans-go.md:5–28`. Le plan existe ; 23 cas proposés sont
conservés mais NON EXÉCUTÉS/non qualifiés. Leurs attentes proposées ne deviennent
pas un contrat ratifié. SDK déclaré 2.0.26, `client.ts` partagé avec body/idempotence S2.

Le rapport M2 181:23–29,45–71,90–97 établit historiquement récupération/réveil
d’Ensemble et paquet actif à cette observation, pas le raccordement RMS aux
événements natifs. Une commande administrative, fixture RPC ou SKIP cross-project
ne prouve pas le parcours public. Notification, récupération, lecture, acceptation
et publication restent distinctes ; rechercher les livraisons avant remplacement.

Contrat de publication : `D/contract/CONTRAT.md:465–519` et ordre initial:288–301.
KnowledgeCommit, révision sortie = entrée +1, readback vérifié et effet requis :
COMMITTED appartient à la WorkUnit, pas à l’attempt, au commit Git ou à une tâche
Ensemble completed. Publication unique, reprise complète et déblocage du prochain
travail restent à rapprocher dans les études suivantes, pas déclarés inexistants.

**Décision :** S2–S4, L7 runtime, L9/L10, preuve publique et consolidation restent
ouverts ; aucune clôture logicielle par un dossier documentaire.

## Composition actuelle et futur transfert, sans exécution

Observations auteur sur les 309 lignes de composition : canonique 296 identiques,
quatre différents (`cluster.ts`, `investigation-groups.ts`, `planner.ts`, `scc.ts`),
neuf ajouts du composé absents du canonique. Ce n’est pas un inventaire de tous
les fichiers du dépôt. Aucun HEAD courant ni intégration Git n’est affirmé.

Vérification parent actuelle : S1 **47/47 pins**, composition **308/309** avec
exception codec déclarée, source176 **14/14 pins**. Auteur : quatre fichiers
protégés de source113 également conformes. Les quatorze pins ne couvrent pas à
eux seuls tous les extras, contrôles et entrées du candidat.

Recette à détailler sans la réaliser : 308 lignes inchangées + exception codec
exacte + sources176 + quatre fichiers protégés source113 + extras/contrôles et
dix entrées épinglés dans `E/check-s2-measure-176-runtime.mjs:18–62`.
Ce script a été lu, jamais exécuté. Les chemins absolus participent au sourceSet :
un futur worktree nécessite une correspondance des emplacements et de nouvelles
preuves de composition, pas la réutilisation silencieuse du digest. Aucun transfert
de base, actif ou autorisation d’exécution n’en découle.

## Empreintes déterminantes et limites de vérification

- Original codec : 137 324 octets,
  `92478d02fa089b48dc54c5c3c13694c3c8c543ad9fb436629ae94d989f8344fc`.
- Overlay codec courant : 137 844 octets,
  `edd6facbe1d44cf988f6da6739818fe0366cf0ceeec16136f0418b7d7791b714`.
- Plan L7 : `27a7944b566970c1f40806169bd0c56319bd1d291101b8c809fae57326336aaa`.
- Reçu final runtime :
  `e90ef0f90a51059de7f8ed8d7559b43fe198277529ba152c78b6e8c36c8dd5c2`.
- SourceSet exécuté historique :
  `ef5e7588f723b1a8f72ad91e47c02645b57a96730446f0703308e5d1ddc8aa99`.

La comparaison d’octets actuelle confirme les fichiers ciblés, pas leur succès
fonctionnel actuel. Les 6 366 payloads RAW n’ont pas été intégralement rehachés
dans cette mission ; ledger et manifeste RAW ont été retrouvés par l’auteur.
Les logs S1 et reçus ont été rapprochés par l’auteur, sans rejouer les tests.
Le contrôle parent est consigné dans `N/evidence/parent-receipt-readback.json`
et `N/evidence/parent-d1-file-comparison.json`.

La réponse D1 a été retrouvée dans la session native après un défaut de
récupération Ensemble ; aucun nouvel auteur n’a été créé pour ce travail.
Les anciennes onze tâches archivées ne sont ni importées ni réactivées.
La revue indépendante D1–D6 a conclu sans bloquant documentaire ; le parent a
accepté le dossier, sans acceptation logicielle (voir index et rapport 008).

**NON EXÉCUTÉS :** `bun run typecheck`, `bun run test:q1-primitives`, `bun test`.
Aucun module produit évalué, base ouverte, test, processus cible, IDA/live ou
modification de source. Les blocages logiciels restent documentés, pas levés.
