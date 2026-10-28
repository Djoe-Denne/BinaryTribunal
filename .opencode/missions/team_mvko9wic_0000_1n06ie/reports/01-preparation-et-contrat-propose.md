# 01 — M2 RMS : plan borné et contrat proposé

Date : 2026-10-23. Mission : `team_mvko9wic_0000_1n06ie`.
**État : préparation seulement, exécution en pause, politique non approuvée.**

## 1. Objectif et changement proposé

Reprendre le RMS statique sans C# selon [l'ordre M2](../../../../docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md), jusqu'aux livrables du §5 et à la condition d'arrêt du §8. Ne relancer ni M1 ni une campagne FF8.

Premier checkpoint de cette session. Le seul changement au brouillon est `verification` : passage proposé de `proportionate` à **`reinforced`**, commandes et critères explicites. L'ordre M2 §7.1, lignes 346–407, impose ce niveau ; light/proportionate nécessiteraient un amendement explicite de cet ordre, pas une dérogation silencieuse. Aucun profil ou pipeline QA universel n'est ajouté.

## 2. Résultats observés et preuves

- Lecture de l'ordre M2, de `AGENT.md`, du guide `docs/tech/RE_MULTI_PROVIDER_MISSIONS.md` et du skill Ensemble. Le guide lignes 52–58 exclut l'import automatique des pipelines RE par EA dans le RMS statique.
- Le bilan M1 §7 et le manifeste final enregistrent l'intégration `e1a97a0` et l'acceptation M1. A09 reste tranché : route statique `@re-ff8/mission-harness`, pas de port automatique des 57 familles historiques.
- Observation préparatoire Git : HEAD `90e24e78772f6eec51c0b685ca9fc25675047f81`, **497 entrées porcelain** modifiées/non suivies. Elles incluent notamment `tools/ff8-harness/src/{domain,engine,planner,client,cli}.ts` et des documents RMS. Aucun fichier utilisateur n'a été déplacé, intégré ou réécrit. Le relevé sera actualisé au GO, conformément à M2 §2.4.
- Scripts réels vérifiés dans `tools/ff8-harness/package.json:5–15` : `typecheck`, `test` et `test:q1-primitives`. Aucun de ces scripts n'a été exécuté.
- Readback du brouillon modifié : JSON valide, 27 couples modèle/variante, seuil 50, QA reinforced, trois commandes et neuf critères ; présence du rapport et de ses deux liens locaux vérifiée. Cela ne remplace pas la validation/présentation native de `/ensemble-mission config` et n'approuve rien.
- Les 1 209 PASS historiques, les 415 tests planner et la conformité des anciens pins sont des **preuves rapportées par les reçus**, pas des vérifications de ce HEAD/WIP par cette session. Leur applicabilité reste à établir.

## 3. Politique réellement proposée

Source : [brouillon local](../model-policy.json). Catalogue, métriques et réserves inchangés ; seuil de planification **50** ; classification **désactivée / opt-in**, aucun score de tâche ni classifieur à lancer. Une tâche conserve sa session et son modèle ; seul le reasoning peut varier dans l'enveloppe approuvée du même modèle. Les références natives seront vérifiées après admission, pas supposées depuis une chaîne de modèle.

Notation ci-dessous : `variante = intelligence / coût benchmark par tâche`. Ce ne sont ni des coûts facturés observés ni une estimation du total de M2.

- `opencode-go/gpt-6-luna` : medium = 30/0.02 ; max = 38/0.07 ; high = 33/0.03 ; low = 22/0.0045 ; none = 18/0.01 ; xhigh = 35/0.04.
- `opencode-go/claude-haiku-5-5` : high = 38/0.08 ; max = 43/0.21 ; low = 29/0.02 ; medium = 34/0.05 ; xhigh = 41/0.12.
- `opencode-go/deepseek-v4.1-flash` : max = 39/0.27.
- `zai-coding-plan/glm-5.3-flash` et `opencode-go/glm-5.3-flash` : max = 42/0.25 chacun.
- `openai/gpt-6.1-sol` : medium = 48/0.21 ; réserves : max = 52/0.72, high = 50/0.32, low = 42/0.13, xhigh = 51/0.39.
- `opencode/gemini-3.8-flash` : medium = 40/0.93 ; high = 41/1.24.
- `openai/gpt-6-astra` : high = 51/1.73 ; réserves : max = 53/3.26, low = 46/0.82, medium = 50/1.54, xhigh = 52/2.31.
- `cursor/grok-4.7` : `Grok 4.7 Extra High` = 46/3.74 ; le brouillon distingue aussi coût amorti et benchmark Cursor, sans les substituer au champ coût/tâche.

Classification inactive : paramètres fournis manual, helper/general non définis, fallbacks 0, retries 1, maxAttempts 3, timeout 30 s ; ils ne sont pas une autorisation de relancer les workers ou des tests. Aucun contournement par override ou changement global.

**Budget/accès :** aucun plafond monétaire global n'est défini dans le brouillon. Les accès `unknown` ne prouvent ni quota ni gratuité. Aucun achat ni repli payant implicite ; si une route implique une dépense non autorisée ou si aucune route admissible ne fonctionne, rendre un diagnostic et demander décision avant dispatch. Ne pas inventer de budget total depuis ces métriques.

## 4. Aperçu des tâches — non admises

Ces labels sont un plan, pas des IDs Ensemble. Aucune ancienne tâche n'est reprise automatiquement. Proposition : au plus **deux workers utiles simultanément**, seulement sur entrées/sorties disjointes ; un owner d'intégration des interfaces centrales, le lead intégrant en série. Pas de pool historique ni de workers artificiels.

1. **P1 — Entrée et journal canonique.** Relever HEAD/WIP/gels et préserver leur provenance ; établir les preuves réutilisables et l'applicabilité de chaque obligation M2. Décider V01/V04 par consommateur statique réel et contrat existant. Rattacher les portes des §§16–18 de l'ordre initial sans les rejouer globalement. Sortie : journal unique, ownership, matrice observable/preuve/manque et file READY. Pas d'implémentation avant fermeture de cette matrice ; aucune réduction unilatérale des livrables ci-dessous.
2. **P2 — Numeric/context.** Après P1, réexaminer R4 et les sources R2 ; corriger uniquement les défauts établis, geler le candidat et qualifier les **450 paires (224 valeurs/226 refus) et neuf régressions** avec leurs oracles, puis review indépendante. Revue/fix/recontrôle bornés aux bloquants et à l'impact. Aucun PASS d'import/typecheck en remplacement d'exécution.
3. **P3 — Contrat public S1.** Après les dépendances qualifiées, types/joins minimaux fermés et provenance post-M1 ; **review fraîche avant implémentation**, puis décision de ratification du lead. Ne pas confondre cohérence S1 et authentification/acquisition S2.
4. **P4 — S1 intégré.** Après P3 ratifié, implémentation et contrôle des codecs/dependencies planner/numeric ; **QA indépendante fondée sur l'API**, avec propriétaire de tests distinct. Les éléments planner inchangés peuvent réutiliser leurs preuves après contrôle de validité.
5. **P5 — S2–S4.** Après leurs prérequis : persistance et acquisition/CAS ; exécution native OpenCode ; conflits/ressources ; reprise/replay ; consolidation et publication durable. Avancer selon les contrats ratifiés, avec preuves nominaux/refus/limites/transitions. Aucun second scheduler ni standalone concurrent.
6. **P6 — Complément L7 et parcours observable.** Réutiliser la couverture acquise, compléter les manques applicables ; fixture statique maîtrisée montrant faits → graphe → groupes → plan → sessions/revue → connaissance durable → prochain travail, avec incident/reprise. Préparer les scénarios disjoints dès que leurs contrats sont stables ; ne pas attendre inutilement la toute fin.
7. **P7 — L9 indépendant.** Après candidat et mesures disponibles, reviewer non auteur : sens des arêtes, grants/budgets/bindings, CAS/fencing, indépendance des contextes, arrêt ambigu/résultats tardifs et publication. Pas de réaudit des zones inchangées sans risque distinct.
8. **P8 — L10 parent et bilan.** Intégration/relecture sérielles, validation consolidée du candidat final et références de preuves ; handoff post-M1 et bilan pour acceptation finale. Aucun commit/push final sans autorisation explicite.

Les reviews exigées ci-dessus vérifient des risques distincts de l'ordre M2 ; elles n'imposent ni profil particulier ni chaîne d'agents fixe.

## 5. Contrat QA renforcé proposé

Les critères détaillés sont persistés dans `verification.acceptance` du brouillon, avec les six livrables M2 et les invariants du §6. Commandes proposées depuis `tools/ff8-harness` :

- `bun run typecheck` — borne initiale 60 s ; candidat corrigé puis intégré.
- `bun test` — borne initiale 300 s ; suites ciblées pendant les corrections, consolidation finale sur une implantation cohérente des fixtures.
- `bun run test:q1-primitives` — 60 s, seulement si Q1 ou ses dépendances/conditions sont affectés ou incertains ; sinon preuve M1 référencée.

Les commandes précises des sous-ensembles numeric/S1 et du parcours natif seront issues des tests/API réellement reçus, consignées dans P1 avant l'implémentation concernée ; aucun nom de script futur n'est inventé ici. Si un nouveau moyen important est nécessaire, demander arbitrage. Les versions, entrées, oracles, codes de sortie et conditions d'exécution accompagnent chaque preuve ; SKIP reste SKIP. Un dépassement se diagnostique, il ne déclenche pas une relance inchangée automatique.

Condition d'arrêt : livrables intégrés et relus ; chaque obligation approuvée prouvée ; vérifications exigées satisfaites ; zéro bloquant ; reports contractuels explicitement acceptés. Présenter le bilan pour acceptation, puis arrêter. Une preuve obligatoire indisponible donne PARTIAL/BLOCKED, pas une clôture acceptée. Pas de course au taux de couverture.

## 6. Inconnues et frontières

- La validité actuelle du WIP et des gels, les consommateurs V01/V04 et le raccordement public RMS/OpenCode ne sont pas encore examinés au niveau symbole : c'est P1, pas une conclusion de cette préparation documentaire.
- Le parcours exige des faits natifs lorsque le contrat le requiert, mais ce plan **n'autorise pas G5–G7**, un canary historique, une réparation du runtime partagé ou une nouvelle campagne. Une permission manquante bloque la preuve concernée et donne lieu à arbitrage, jamais à un faux PASS simulé.
- Hors périmètre : C# réintroduit, live/IDA/jeu, exécution du code reconstruit, migration de langage générale, portabilité non testée, configuration globale, nettoyage et achats implicites. Aucun Docker ni serveur de présentation créé.
- Localisation : ordre M2 et reçus M1, guide de mission, `tools/ff8-harness/package.json`. Impact actuel : uniquement brouillon QA et ce rapport. Limites : pas d'analyse de consommateurs/code, pas de worker/classifieur, pas de test, pas de preuve native, pas d'intégration ni de commit.

## 7. Décision demandée

**Recommandation : conserver le catalogue et le seuil 50, adopter la QA renforcée exigée par M2, et valider ce plan borné.** Cette option conserve les garanties obligatoires tout en évitant les rejeux/revues sans impact. Réduire à light/proportionate nécessiterait d'amender explicitement l'ordre M2 et ses obligations ; ne pas le faire implicitement via un défaut du plugin. Vous pouvez également corriger le découpage, la concurrence, le catalogue ou préciser un plafond de coût avant lancement.

Pour afficher la proposition exacte corrigée et son nouveau hash : **`/ensemble-mission config`**. Le hash de la proposition initiale n'approuve pas le brouillon modifié. Après lecture de cette nouvelle présentation, **vous seul pouvez lancer `/ensemble-mission start`**. Sinon, indiquez les corrections dans le chat ; elles seront persistées avant une nouvelle présentation. Aucun start ne sera invoqué à votre place.
