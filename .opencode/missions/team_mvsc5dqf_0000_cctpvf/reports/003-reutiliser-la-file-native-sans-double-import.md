# 3. Réutiliser les onze tâches existantes, sans créer une seconde file

## Objectif et décision du superviseur

La mission doit achever l’orchestrator RMS en conservant Ensemble existant et
les preuves acquises. La préparation s’est arrêtée parce qu’elle a retrouvé une
file déjà créée, sans pouvoir vérifier elle-même son état natif. Importer à
nouveau le même découpage risquerait de dupliquer le travail et ses dépendances.

**Décision : réutiliser les onze tâches existantes sur leurs vrais identifiants.
Aucune nouvelle création ou suppression de tâche n’est nécessaire pour ce
rapprochement.** Les contrôles de publication, d’indépendance et d’acceptation
parent restent en place. Aucun démarrage n’est autorisé.

Le seul manque déclaré par le candidat PM est maintenant documenté côté
superviseur. Cela ne change pas automatiquement l’état enregistré de la
préparation : son dernier résultat reste **incomplete**, sans tâche importée.

## Ce qui a été vérifié

- La file native a été consultée avec `team_tasks_list` : onze tâches, une en
  attente et dix bloquées par dépendance, aucune en cours ou terminée dans cette
  vue. Quatre études sont publiées ; sept tâches ultérieures restent différées.
- Les onze tâches portent un contexte `fresh` et une acceptation réservée au
  superviseur. Une tâche publiée n’est pas une tâche autorisée à s’exécuter.
- La réponse finale complète du préparateur a été récupérée dans sa session
  native, et non reconstruite depuis la notification. Elle contient onze tâches,
  les mêmes identifiants et le même graphe que les demandes de création
  enregistrées. Sa seule question ouverte est le rapprochement de cette file.
- Deux livraisons signalées par le PM existent : le plan indépendant L7 et le
  reçu final du diagnostic. Leur existence n’est pas une nouvelle qualification.
- Le code d’import examiné génère de nouveaux identifiants de tâches : donner
  un identifiant natif comme identifiant PM ne suffit pas à réutiliser sa ligne.
  Le schéma examiné autorise une liste vide de nouvelles tâches.

Limite : l’affichage actuel de la file n’expose pas les tableaux de dépendances.
Leur concordance a été contrôlée contre les demandes/reçus natifs de création,
pas annoncée comme une nouvelle extraction de la base. Aucune base n’a été
ouverte ou modifiée pour ce rapprochement.

## Correspondance et réutilisation

1. **Reprendre les preuves et livraisons** —
   `task_mvsc891s_0001_z8achz` : en attente, publiée ; conserver.
2. **Étudier la clôture du remplacement** —
   `task_mvsc8lkl_0002_bb6mc6` : bloquée, publiée ; conserver après la première étude.
3. **Préciser le contrat public** —
   `task_mvsc8lkm_0003_vxsrb0` : bloquée, publiée ; conserver après la première étude.
4. **Reprendre les oracles indépendants** —
   `task_mvsc8lkm_0004_svqxn6` : bloquée, publiée ; maintenir explicitement cette
   publication documentaire. Les attentes privées ne sont pas à joindre aux
   descriptions publiques ni aux projections d’auteurs.
5. **Ratifier modifications et vérifications** —
   `task_mvsc8t32_0005_p5xj1q` : bloquée et différée ; conserver, parent seulement.
6. **Compléter persistance et remplacement** —
   `task_mvsc8zm9_0006_dfzsgo` : bloquée et différée ; conserver sous ratification.
7. **Implémenter le raccordement public ratifié** —
   `task_mvsc95cn_0007_izs9ec` : bloquée et différée ; conserver.
8. **Terminer publication durable et replay** —
   `task_mvsc9bmu_0008_7eyqc5` : bloquée et différée ; conserver.
9. **Exécuter les scénarios indépendants autorisés** —
   `task_mvsc9h48_0009_i1jzwd` : bloquée et différée ; conserver.
10. **Revue indépendante finale** —
    `task_mvsc9mlz_000a_vy2hzm` : bloquée et différée ; conserver en session distincte.
11. **Intégration et validation finales** —
    `task_mvsc9tpm_000b_juhoxs` : bloquée et différée ; conserver, parent seulement.

## Écarts du candidat : pas d’application automatique

Le PM propose le profil `pm-rms` pour les études et la revue, et une recherche
directe pour les études de preuves et d’oracles. La file existante indique le
profil généraliste pour les tâches worker et conserve la planification standard.
Ces suggestions ne constituent pas une mutation native ni une obligation de
recréer les tâches. Je conserve la file actuelle ; les références précises,
critères et projections du candidat enrichiront les paquets de travail remis
après approbation, sans élargir leurs permissions ou leur périmètre.

Le candidat explicite aussi les worktrees des futurs écrivains. Les tâches
existantes conservent leur défaut natif d’isolation, à vérifier avant admission.
La validation finale est une tâche parent non dispatchable, même si sa métadonnée
actuelle indique `worktree:false` : les essais temporaires restent obligatoirement
dans un worktree dédié selon la politique proposée. Aucune isolation ni permission
n’est déclarée qualifiée à partir du seul nom d’un profil.

Le plan L7 retrouvé est à reprendre, pas à refaire. Le raccordement public réel
et les effets scientifiques restent à démontrer ; les sources trouvées par le PM
ne ferment pas ces obligations.

## Reprise recommandée de la préparation

Ne pas importer à nouveau les onze lignes. Je recommande une reprise du même PM
pour qu’il référence cette décision, conserve le découpage sourcé et produise un
document sans **nouvelles** tâches : `tasks: []`, `parallelGroups: []`, avec liens
vers la file existante et le candidat complet dans son contexte/handoff autorisé.
Le schéma permet ce cas ; il ne faut pas ajouter un champ de réutilisation inventé.

Si le PM confirme que le rapprochement était son seul manque, il peut déclarer
la préparation prête, sans prétendre avoir créé ou importé ces onze tâches.
S’il constate une autre information indispensable manquante, il doit la nommer
et rester incomplet. Les arbitrages threads, origines, contrat public et les
autorisations de code/tests restent des portes d’exécution, pas des raisons de
faire tourner ces scénarios pendant la préparation.

**Aucune nouvelle décision de fond de l’utilisateur n’est nécessaire pour
conserver cette file.** La prochaine commande proposée est une clarification
`/ensemble-mission prepare --resume ...`, pas un `start`. Elle n’a pas été lancée
automatiquement. Une fois la préparation recevable, l’approbation utilisateur
de la politique exacte restera nécessaire avant toute admission.

## Annexe technique et preuves

- [Rapprochement structuré et identifiants](../evidence/queue-reconciliation.json).
- [Plan existant](../PLAN_PREPARATION.md).
- Session PM : `ses_e7c960e08ffedHMLFaxorVahbm` ; finale visible
  `msg_1836e8b04001qvDbpR5YgmDGTl`, `finish:stop` ; référence native du modèle
  `{providerID:openai,id:gpt-6.1-sol,variant:high}`.
- SHA-256 de la finale visible complète :
  `7702db4d3b9cffc417020868bf946bf56b614b489091550f9c33ebeee47c1445`.
- Lecture native via `Service.discover()` sans démarrer de service, puis GET du
  contexte de la seule session indiquée ; authentification gardée en mémoire,
  aucun secret ni raisonnement privé reproduit.
- Import examiné : paquet installé `20261028-task-publication-a9868de8ce5c`,
  `index.js:21032–21072`, notamment génération des nouveaux IDs ligne 21048 ;
  acceptation de zéro tâche ligne 20645. Sources correspondantes :
  `opencode-ensemble-session/src/preparation-import.ts:202–229` et
  `src/preparation-document.ts:282–304`. Aucun import de module du produit,
  test de l’import ou changement de plugin n’a été exécuté.

Localisation / impact / limites : lecture de la file et du candidat natifs,
inspection ciblée du mécanisme d’import, compte rendu documentaire seulement.
Aucun changement de tâche, politique, source produit, archive ou état M2 ;
aucun auteur, test, import, reprise PM automatique ou `start` lancé.
