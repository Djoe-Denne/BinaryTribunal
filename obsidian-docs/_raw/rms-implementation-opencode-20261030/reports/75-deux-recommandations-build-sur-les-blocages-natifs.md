# 75. Deux analyses build demandées sur les blocages natifs

## Objectif et demande utilisateur

L’utilisateur demande deux recommandations indépendantes, chacune par un agent de type **build**, et non par un architecte. Première question : que doit-il se passer si une autorisation est retirée avant ou pendant le traitement d’une commande ? Seconde : comment établir une clôture qui permette de libérer les ressources sans continuation indue ?

Les agents peuvent consulter les documents locaux, les sources déjà épinglées, Serena et les ressources documentaires/intranet accessibles dans leurs permissions. Les recherches publiques pertinentes restent autorisées par le mandat général ; aucun secret ou artefact privé ne doit être transmis à un service externe. Aucun refus d’accès ne sera contourné.

## Répartition fermée

- **Révocation pendant le traitement** : identifier les étapes réelles, la décision atomique d’admission et le cas déjà démarré ; distinguer annulation coopérative, barrières sur les effets, résultat tardif et effets irréversibles. Vérifier notamment quelles garanties RMS exige réellement et si le bilan74 a formulé une garantie plus forte que nécessaire.
- **Clôture et continuations** : distinguer fin d’un message, période d’exécution, successeur en attente et ressources externes ; proposer un témoin et un protocole de clôture minimaux, sans exiger une interdiction globale et permanente de tout futur travail légitime.

Chaque analyse doit donner une recommandation exploitable avec preuves, options réalistes, limites et critères de vérification proportionnés. Les constats74 sont des éléments à attaquer, pas des conclusions à recopier. Le parent rapprochera les deux avis et rendra la décision technique ; aucun modèle plus cher ou profil architecte n’est ajouté.

## Permissions et livrables

Deux sessions fresh de type build, sans worktree d’écriture : recherche et lecture seulement. Aucun code, commit, installation, configuration, mutation API/DB, test produit, modèle exécuté ou réveil de session. Les livraisons intégrées et leurs preuves restent inchangées. Aucun nouveau GO demandé pour les analyses ; une recommandation ne vaut pas permission de réaliser ou déployer sa solution.

Références initiales : rapports66/72/74, contrats68/69 et sources officielles2.1.4 capturées dans les evidence. Les deux agents doivent préserver l’attribution de leurs observations et signaler ce qui n’est pas vérifié sur le binaire courant.
