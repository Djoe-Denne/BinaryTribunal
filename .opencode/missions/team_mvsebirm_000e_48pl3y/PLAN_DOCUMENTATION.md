# Mission Documentation — proposition bornée avant lancement

## 1. Mandat et état

Cette nouvelle mission reprend exclusivement l’
[ordre documentaire du 28 octobre](../../../docs/missions/re-graph-scheduler/ORDRE_MISSION_DOCUMENTATION_RMS_STATIC_20261028.md).
Elle produit un dossier pour décider et préparer la réalisation future du
pipeline statique RMS. Elle ne réalise pas le logiciel et ne lance aucun test.

Statut : politique révision 1 approuvée ; dossier documentaire accepté après
revue indépendante et validation parent, mission terminée (rapport 009).
La nouvelle équipe est `mission-e113d505959a0fa7`. Sept tâches ont été ajoutées
une seule fois après approbation ; leurs identifiants et le contrôle du premier
modèle natif figurent dans `reports/002-demarrage-documentaire-et-controles-du-superviseur.md`.
L’ancienne préparation est archivée ; ses onze tâches annulées administrativement
ne sont ni réalisées, ni transférées, ni réactivées dans cette mission.

Les sept entrées ci-dessous décrivent les paquets documentaires désormais reliés
à la file native du rapport 002. Leurs noms restent des labels, pas des IDs.
Le mécanisme retenu est l’ajout normal par le superviseur après approbation,
sans préparation PM supplémentaire ni import. Ne pas créer une seconde file.

## 2. Politique proposée pour cette mission

- Fournisseur unique : OpenAI. Catalogue proposé : Luna low/medium et Sol
  medium/high/xhigh ; couples nativement présents dans la consultation du 28 octobre.
- Indices et coûts de référence hérités des métadonnées historiques : Luna low
  40/0,08 ; Luna medium 43/0,12 ; Sol medium 48/0,21 ; Sol high 50/0,32 ; Sol xhigh
  51/0,39. Ce ne sont ni des scores de difficulté de tâche ni un devis. L’API ne
  fournit pas de prix natifs ; accès et quota ne sont pas prouvés par le catalogue.
- Seuil de planification 50 conservé. Parcours standard v2 proposé, sans score
  de tâche ni classifier. Sol high est le candidat de moindre coût de référence
  atteignant ce seuil dans la grille ; la décision native d’admission fera foi.
- Une tâche garde sa session et son modèle. Variantes du même modèle seulement
  dans le catalogue approuvé ; aucun changement par message ou repli payant implicite.
- Long run proposé, avec vos priorités : respecter Ensemble existant, reprendre
  les preuves valides, produire un plan compréhensible et maintenable, QA bornée,
  poursuivre les décisions ordinaires autorisées sans requêtes répétitives.
- Toute expérimentation temporaire resterait soumise à permission et worktree
  dédié. Cette mission ne l’autorise pas ; aucune pollution des sources existantes.

Ce contrat est une nouvelle politique approuvée, pas une migration de l’ancienne.
Le `Model.Ref` effectif et les permissions sont contrôlés avant utilisation ;
le premier worker a une référence native Sol xhigh conforme, sans override.

## 3. Aperçu actionnable des travaux

Racine des futurs livrables :
`docs/missions/re-graph-scheduler/rms-static-documentation-20261028/`.
Chaque étude remet une projection bornée ; le superviseur possède la publication.
Profil proposé pour les lecteurs : `pm-rms`, nativement présent dans les acquis
de préparation, sans élargissement de droits ; `worktree:false`,
`report_mode:final_response`, contexte fresh. La confirmation d’admission demeure
nécessaire. Le consolidateur est le parent, pas un second orchestrator.

### Reprendre les preuves et livraisons (D1)

- Dépendances : aucune.
- Entrées : ordre M2, ordre initial, état récent du journal, rapports 180/181,
  manifestes et reçus nécessaires, candidat isolé et overlays.
- Lecture prioritaire : plan L7 déjà livré, préparation publique M2 et finale PM
  détaillée déjà conservée ; vérifier les fichiers avant toute réaffectation.
- Sortie : `01-preuves-et-versions.md`, matrice obligation/source/version/entrées/
  oracle/conditions/statut/manque/décision.
- Acceptation : aucune qualification transférée entre versions sans impact,
  aucun compteur additionné ou réinitialisé, absence de résultat distinguée d’une
  source non retrouvée, travail achevé non proposé à refaire.
- Validation : parent confronte les références déterminantes aux reçus primaires,
  sans ouvrir une base ni exécuter de module.

### Cartographier le parcours statique complet (D2)

- Dépendance : D1 accepté dans sa portée documentaire.
- Entrées : carte D1, interfaces et consommateurs existants du graphe, groupes,
  plan, sessions, revue, publication/readback et déblocage.
- Sortie : `02-parcours-et-frontieres.md`, propriétaire/entrée/sortie/identité/
  version/preuve/lacune pour chaque passage de la chaîne.
- Acceptation : aucun maillon omis ; code présent, intégration et preuve native
  restent distincts. RMS/OpenCode/Ensemble gardent leurs responsabilités.
- Validation : références de source et de contrat ; les frontières inconnues
  deviennent des propositions localisées, pas une architecture inventée.

### Étudier le remplacement et ses arbitrages (D3)

- Dépendances proposées : D1 et D2, pour disposer des frontières concernées.
- Entrées : rapports et mesures conservés, reçu `resources.result.json`, sources
  du candidat `graph-trusted-authority.ts`, `graph-generation-store.ts` et
  `graph-generation-replacement.ts`.
- Cibles statiques déjà localisées : `consumeReplacementActivation124`,
  `GraphGenerationStoreV1.validateFinalCase` et `activateA`.
- Sortie : `03-remplacement-options-et-arbitrages.md`, option minimale ou frontière
  à arbitrer, alternative rejetée, invariants/risques/contrôles affectés.
- Acceptation : coût observé séparé d’un comptage d’appels ; pas d’attribution
  GC/SQL ni de promesse de quinze secondes. Threads et quatre origines contre
  plafond trois traités séparément, sans dérogation.
- Validation : parent vérifie le lien source/mesure/invariant. Si une mesure
  nouvelle est indispensable, proposer son mandat précis sans la réaliser.

### Préciser le contrat public et les observations OpenCode (D4)

- Dépendance : D1 ; indépendant de l’étude du remplacement au départ.
- Entrées : préparation publique existante, `client.ts`, `graph-adapter.ts`,
  `graph-engine.ts` et tests client lus sans exécution.
- Cibles : `connectPublic`, `ExecutionClient.submit`, RPC `ensemble.execution.v1`
  et exigences de `GraphEngine.observe`.
- Sortie : `04-contrat-public-et-observations.md`, acquis/proposé, corps/identité/
  idempotence/versions/droits, réponse perdue, ambiguïté et refus, préflight futur.
- Acceptation : commande administrative non assimilée à une route agent ;
  mécanismes Ensemble non assimilés à une qualification RMS ; aucun appel de
  démonstration et aucun nouveau système de récupération.
- Validation : sources et consommateurs précis, portée des tests existants et
  preuve native manquante explicitement séparées.

### Reprendre les oracles et préparer la vérification future (D5)

- Dépendances proposées : D2, D3 et D4 pour consolider une matrice finale cohérente.
- Entrées : ancien `PLAN_PHASE1.md` L7, rapport M2 47, contrat commun et preuves
  valides ; aucun nouvel oracle exécutable.
- Sortie : `05-verification-et-scenario-final.md`, matrice risque/oracle/preuve/
  version/contrôle affecté/autorisation/statut ; scénario complet avec échec/reprise,
  publication unique et déblocage du prochain travail.
- Acceptation : attentes indépendantes du produit, pas de cas affaibli, SKIP non
  compté PASS, quinze secondes conservées et scénarios interdits visibles.
  Les suites futures sont seulement proposées, aucune commande n’est lancée.
- Validation : rapprochement avec contrats et oracles existants. Protéger les
  attentes privées dans les projections, sans réauditer les zones hors impact.

### Consolider le plan détaillé et les décisions (D6, parent)

- Dépendances : D1 à D5 dans leurs portées acceptées.
- Sorties : `06-plan-et-decisions.md` et index du dossier.
- Pour chaque futur travail : objectif/nécessité, historique et entrées épinglées,
  preuves réutilisées, fichiers/ownership, actions/sorties/exclusions/arrêt,
  dépendances, décision architecturale ou choix local, critères observables,
  contrôles affectés, permissions et transfert candidat/overlays aux worktrees.
- Acceptation : faits, inférences, propositions et inconnues distincts ; chaque
  décision relie objectif, risque, correction permise et preuve attendue. Ne pas
  annoncer une autorisation logicielle ou créer une seconde file d’implémentation.
- Validation : parent contrôle la cohérence des six documents et remet un
  candidat documentaire à la revue, sans accepter encore le dossier final.

### Revue indépendante documentaire bornée (R-doc)

- Dépendance : candidat D6 disponible ; contexte fresh et session distincte des
  auteurs, exigence portée par la tâche avant admission.
- Entrées : six documents, contrats et reçus déterminants autorisés, pas les
  conversations intégrales ou raisonnements privés des auteurs.
- Risques distincts : transferts de preuves injustifiés, autorité/droits élargis,
  ambiguïté entre propositions et contrats, disparition d’un blocage, incohérence
  entre parcours, oracles et fiches de réalisation.
- Sortie : revue ciblée avec références, bloquants et suggestions séparés.
- Acceptation : aucune source ou revue indispensable absente ; les reprises
  portent sur les défauts bloquants et l’impact des corrections seulement.
- Parent seul publie et accepte le bilan final ; aucun pipeline QA supplémentaire.

## 4. Concurrence et circuit d’exécution proposés

D1 précède les dépendants. D2 et D4 peuvent avancer en parallèle ; D3 suit D2,
puis D5 consolide les frontières des trois études. D6 et R-doc suivent en série.
Ce choix conservatoire n’impose pas une taille de pool ; le parent pourra affiner
les dépendances locales selon les sources réellement nécessaires, sans étendre
le périmètre ni contourner une entrée requise.

Pas de réutilisation de contexte auteur pour la revue. Pas de remplacement
automatique d’une session silencieuse : retrouver ses résultats et établir le
problème précis. Un worktree HEAD ne représente pas forcément le candidat WIP ;
les lecteurs utilisent les sources identifiées sans les modifier.

## 5. Contrat de vérification proposé

Niveau **reinforced**, conformément au §7 de l’ordre documentaire. Le défaut
technique proportionate choisirait les contrôles selon le risque ; light serait
limité à des contrôles ciblés. Ici, reinforced ajoute un plan explicite et une
revue indépendante bornée des affirmations critiques, pas une suite logicielle.

`verification.commands` est vide : aucune commande de tests produit ou nouveau
harnais n’est proposée. Les contrôles sont documentaires, par lecture/comparaison
de sources, présence/pertinence des références, vérification des versions quand
elles conditionnent une preuve, cohérence croisée et revue ciblée. Les outils et
les résultats réels seront rapportés ; un simple lien présent ne prouve pas son
contenu. Aucune exécution avant approbation.

Clôture : six documents utiles et index sourcés/cohérents, revue requise recevable,
acceptation parent, chaque question indispensable répondue ou blocage précisément
documenté. Une preuve logicielle impossible peut rester ouverte sans invalider
un dossier documentaire qui l’explique ; une source documentaire indispensable
absente laisse ce dossier partiel. Arrêt après acceptation, sans mise en œuvre.

## 6. Éléments qui ne changent pas

Les échecs et archives restent conservés. Aucun changement M2, code, oracle,
compteur ou actif. Les 450 paires/neuf régressions ne sont pas rejouées ; preuves
planner et S1 gardent leur portée. Plafond trois origines, trois chemins threads
interdits et limite quinze secondes restent intacts. Pas de C#, helper obligatoire,
jeu, IDA, live, run01, G5–G7, achat ou repli payant implicite. Les priorités long run
ne donnent pas une permission d’expérimenter ou d’implémenter.
