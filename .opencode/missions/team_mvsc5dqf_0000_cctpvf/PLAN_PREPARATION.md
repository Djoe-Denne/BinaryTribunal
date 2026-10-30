# Terminer le pipeline statique RMS — plan borné proposé

Date : 28 octobre 2026. Identifiant documentaire : `rms-static-closure-20261028`.
Statut : brouillon non approuvé ; aucun auteur ou classifier lancé, aucun test exécuté.

## Objectif et frontière du premier lancement

Achever la chaîne faits d’exécutable → graphe → groupes → plan → sessions
d’auteurs → revue/réconciliation → connaissance durable → prochain travail,
sans refaire M1 ni les qualifications M2 hors impact.

Le premier `start` proposé autorise seulement quatre livraisons de recherche
documentaire : reprendre les preuves, étudier le remplacement, définir le contrat
public et reprendre les oracles de machine d’état. Il ne lève pas le gel après
diagnostic. La suite logicielle reste dans l’objectif, mais ses tâches sont
**différées nativement** et non autorisées à l’exécution par ce premier lancement.

Les modifications et exécutions devront être nommées dans un contrat précis,
approuvé avant réalisation. Une architecture, un contrat public ou un harnais
important nouveau exige l’arbitrage préalable applicable. Ce sont des frontières
réelles d’autorisation, pas une demande de nouveau GO à chaque jalon ordinaire.

## Politique de modèles proposée

Continuité explicite avec le catalogue de M2, sans modifier sa politique ni ses
admissions : nouvelle politique v2 limitée à OpenAI, Luna low/medium et Sol
medium/high/xhigh. Seuil de planification 50 conservé, classification désactivée
dans le dispositif courant ; aucun score de tâche ni appel de classification.

- `openai/gpt-6-luna`, low : indice hérité 40, coût de référence par tâche 0,08.
- `openai/gpt-6-luna`, medium : indice 43, coût 0,12.
- `openai/gpt-6.1-sol`, medium : indice 48, coût 0,21.
- `openai/gpt-6.1-sol`, high : indice 50, coût 0,32.
- `openai/gpt-6.1-sol`, xhigh : indice 51, coût 0,39.

Ces nombres sont les métadonnées historiques de catalogue, pas une difficulté
inventée, une probabilité de succès, un devis ou une garantie de facturation.
Le catalogue natif consulté le 28 octobre expose ces modèles et variantes ;
coûts natifs non renseignés et accès catalogue ne prouvent ni authentification
ni quota. Aucun achat, fournisseur supplémentaire ou repli payant implicite.

Les tâches publiées restent en mode de planification standard v2, sans override :
Sol high est le candidat de moindre coût de référence atteignant 50 dans cette
grille. La sélection effective d’admission reste l’autorité ; le parent vérifiera
`Model.Ref={providerID,id,variant}` avant utilisation. Aucun `Model.Ref` de worker
n’existe encore. Une tâche garde sa session et son modèle ; le raisonnement peut
varier seulement entre les variantes approuvées de ce même modèle. Pas de
migration v3 ni de changement de modèle par message.

Mode `long_run` proposé à la demande de l’utilisateur, non actif avant approbation
de la politique exacte. Les priorités et limites corrigées figurent dans
`model-policy.json` et `reports/002-priorites-long-run-et-isolation-des-essais.md`.

## File native effectivement créée

Les identifiants ci-dessous proviennent des réponses de `team_tasks_add` ; ce
n’est pas un import par `prepare`. Toutes les acceptations sont réservées au
superviseur (`completion_policy: lead`). Chaque tâche porte `context: fresh`.
Les quatre études utilisent le profil généraliste disponible, sans worktree,
avec mandat lecture seule du produit et sorties documentaires disjointes. Le
parent doit vérifier ses permissions natives avant admission, sans les élargir.

1. **Reprendre les preuves et retrouver les livraisons (A)** —
   `task_mvsc891s_0001_z8achz`. Publiée, sans dépendance ; admission interdite
   avant approbation. Livrable `artifacts/A-carte-preuves.md` : matrice
   acquis réutilisable/changé/absent/bloqué, preuves primaires et versions,
   obligations restantes et chemins futurs. Aucun travail retrouvé relancé.
2. **Étudier la clôture du remplacement (B)** —
   `task_mvsc8lkl_0002_bb6mc6`. Publiée, dépend de A accepté. Livrable
   `artifacts/B-proposition-remplacement.md` : coût observé, correction minimale
   proposée, alternative rejetée, risques et contrôles affectés, deux arbitrages
   threads/origines isolés. Aucun nouveau diagnostic ni code.
3. **Définir le contrat public et les observations OpenCode (étude D)** —
   `task_mvsc8lkm_0003_vxsrb0`. Publiée, dépend de A accepté. Livrable
   `artifacts/D-contrat-public-propose.md` : route exacte, droits, événements,
   prérequis, propositions non ratifiées et préflight futur borné. Aucun appel
   natif de démonstration ; une fixture ne qualifie pas une intégration native.
4. **Reprendre les oracles indépendants de machine d’état (préparation F)** —
   `task_mvsc8lkm_0004_svqxn6`. Publiée, dépend de A accepté. Livrable
   `artifacts/F-matrice-oracles.md` : obligation → source/oracle → preuve/version
   → statut. Réutilisation du plan retrouvé avant toute réaffectation.
5. **Ratifier le contrat précis de modifications et d’exécutions** —
   `task_mvsc8t32_0005_p5xj1q`. Différée, réservée au parent, dépend de B,
   étude D et préparation F acceptés. Ne pas dispatcher cette tâche à un worker.
   Ne la terminer qu’après autorisation explicite recevable, et `config/start`
   si la politique change. Threads et origines ne sont pas levés implicitement.
6. **Compléter persistance, acquisition et remplacement (C)** —
   `task_mvsc8zm9_0006_dfzsgo`. Différée, dépend de la ratification. Seulement
   manques prouvés, sources possédées et contrôles précisément autorisés.
7. **Raccorder le parcours public ratifié (implémentation D)** —
   `task_mvsc95cn_0007_izs9ec`. Différée, dépend de C et du contrat D accepté.
   La sérialisation avec C est conservatoire pour les modules centraux ; la
   granularité sera confirmée par les références réellement consommées.
8. **Consolider et publier la connaissance, avec reprise déterministe (E)** —
   `task_mvsc9bmu_0008_7eyqc5`. Différée, dépend de C et implémentation D.
   Résultats acceptés seulement ; aucune publication implicite ou double effet.
9. **Compléter les preuves indépendantes de machine d’état (exécution F)** —
   `task_mvsc9h48_0009_i1jzwd`. Différée, dépend de E et de la matrice F ;
   C/D sont des dépendances transitives. Oracles non copiés depuis le produit,
   contrôles autorisés seulement ; preuves impossibles explicitement bloquantes.
10. **Revue finale indépendante de sûreté (L9)** —
    `task_mvsc9mlz_000a_vy2hzm`. Différée, dépend des preuves F ; session distincte
    des auteurs, projection bornée. Reprises limitées aux bloquants et impacts.
11. **Intégration et validation finale parent (L10)** —
    `task_mvsc9tpm_000b_juhoxs`. Différée, réservée au parent, dépend de L9.
    Ne pas dispatcher à un worker. Candidat final, validation consolidée sous
    autorisations, bilan avec inventaire des archives et acceptation finale.

Concurrence utile proposée : une recherche A, puis au plus trois études B/D/F
réellement indépendantes. Quatre affectations initiales au total, pas une cible
permanente de pool. Aucun remplacement ou retry automatique d’auteur : rechercher
le résultat conservé, ses finales natives visibles et ses fichiers, puis établir
un motif précis. Réexaminer la concurrence de la phase logicielle au vu des
frontières et capacités réelles ; jamais deux écrivains sur les modules centraux.

## Projections de contexte

- A reçoit les ordres, le préplan, les dernières décisions M2 et les pointeurs de
  preuves nécessaires, pas l’archive intégrale des conversations.
- B reçoit la carte A acceptée, les mesures conservées et les corps de code
  nécessaires à son étude, pas une permission d’exécuter ou d’instrumenter.
- L’étude D reçoit les contrats publics/permissions et les livraisons retrouvées,
  ainsi que les prérequis C, sans hypothèse de route publique déjà ratifiée.
- La préparation F reçoit les obligations, oracles indépendants et reçus utiles,
  sans héritage des conversations d’auteurs ; l’inventaire A est une carte,
  pas un verdict scientifique à recopier.
- Les futures implémentations recevront un candidat et ses overlays épinglés,
  avec manifeste et chemins exclusifs. Un worktree à HEAD seul n’est pas le
  candidat qualifié. Les transferts seront vérifiés avant admission.
- Les futures revues F/L9 reçoivent seulement les contrats, sources, oracles et
  preuves requis. `fresh` figure déjà sur les tâches ; aucune reprise d’une
  session d’auteur, aucun raisonnement privé ni secret dans les projections.

## Vérification renforcée et critères fermés

Le champ `verification` du brouillon porte les commandes et critères opposables.
Le niveau proposé est **reinforced**, imposé par l’ordre M2 §7.1 et le préplan,
et non le défaut technique `proportionate` initial. Light cible des contrôles
ponctuels ; proportionate choisit selon le risque ; reinforced explicite les
obligations et la revue indépendante. Les deux premiers ne remplacent pas ici
l’exigence explicite sans arbitrage changeant le mandat.

### Premier lancement documentaire

Acceptation : quatre livrables ci-dessus complets, sources et versions reliées,
aucun travail terminé relancé, aucune preuve transférée sans analyse d’impact,
aucun compteur modifié, aucune exécution interdite. Les décisions réellement
nécessaires doivent être isolées, pas masquées par une proposition d’optimisation.

### Validation logicielle ultérieure, encore non autorisée

Conserver depuis `tools/ff8-harness` :

```text
bun run typecheck
bun run test:q1-primitives
bun test
```

Ces trois commandes sont **non exécutées** dans cette préparation. Le premier
`start` proposé ne les autorise pas. Avant exécution, nommer versions, bornes,
ressources possédées et exclusions dans le contrat ratifié. Quinze secondes
par test inchangées ; zéro retry par défaut, sans relance identique inexpliquée.
Les bornes de processus seront fixées à cette porte, avant toute commande.
Ne pas reprendre les 300 secondes historiques comme permission actuelle.

Les trois chemins avec threads restent interdits sans garantie native de fin
sans orphelin et permission explicite. Une attente bornée ou `Worker.terminate()`
ne suffit pas. Si `bun test` peut les atteindre, ne pas le lancer ; un filtrage
éventuellement autorisé reste une suite partielle, jamais la commande complète.
L’obligation globale demeure ouverte plutôt que supprimée.

Les 450 paires et neuf régressions, la qualification historique du planificateur
(415 tests, 17 077 assertions), S1 et les preuves partielles restent dans leurs
versions et périmètres. Pas de nouvelle invocation scientifique par défaut ;
rejeu selon impact, jamais parce qu’un auteur ou reviewer a changé.

Clôture finale : obligations approuvées prouvées sur candidat identifié intégré,
aucun bloquant, chaîne statique observable avec échec/reprise et connaissance
durable, replay déterministe, revue L9 indépendante et validation L10 parent.
Preuve indispensable impossible : bilan partiel/bloqué et arbitrage précis.
Arrêt après satisfaction des critères et acceptation du bilan, pas recherche
de couverture maximale.

## Arbitrages futurs réellement nécessaires

1. **Remplacement trop lent** : sélectionner une correction et ses exécutions
   précises après étude B. La mesure terminée n’est pas rejouée ; la copie
   ciblée n’explique pas le coût restant.
2. **Fin des threads** : preuve native anti-orphelin manquante ; ne pas proposer
   un simple timeout ou un abandon de thread comme garantie équivalente.
3. **Deux candidats distincts** : quatre origines requises contre plafond trois ;
   aucune remise à zéro ni concurrence sur un même candidat comme substitut.
4. **Route publique et preuve OpenCode** : contrat et permissions exacts à ratifier
   avant implémentation ou démonstration native, sans rouvrir G5–G7.

Ces choix ne sont pas demandés maintenant sans leurs études. À ce stade, seule
la politique de préparation est proposée à l’utilisateur.

## Sources et limites de cette préparation

- `docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md`,
  notamment §7.1 lignes 346–407 et §8 lignes 409–431.
- `docs/missions/re-graph-scheduler/ORDRE_MISSION.md`, définitions L9/L10
  lignes 715–727, sûreté/replay lignes 752–777 et gates lignes 794–825.
- `.opencode/missions/team_mvnxgnse_0000_39vpc8/REPRISE_JOURNAL.md`, dernières
  décisions lignes 7–21, carte de versions et qualifications lignes 400–418.
  Ses paragraphes historiques plus anciens ne supersèdent pas son état récent.
- Rapports M2 `180-bilan-copie-negligeable-arret-convenu.md:5–34` et
  `181-historique-ensemble-messages-recuperation.md:63–71`.
- Politique M2 consultée en lecture seule pour proposer la continuité du
  catalogue ; aucun champ, compteur ou état M2 modifié.

Les reçus RAW et toutes les sources du candidat n’ont pas été requalifiés ici :
c’est le travail documentaire A après approbation. Les observations des rapports
restent des preuves historiques dans leur portée, pas des tests refaits.

Localisation : fichiers d’autorité et brouillon connus, outils fichiers et
Context Mode. Impact : nouvelle politique, file et documentation de cette mission
seulement. Limites : aucune exploration symbolique, source modifiée, preuve native
du produit, exécution de test ou ressource Docker ; Serena/IDA non nécessaires
à cette préparation. La conformité des permissions et `Model.Ref` sera vérifiée
avant admission réelle, pas déduite du nom d’un profil.
