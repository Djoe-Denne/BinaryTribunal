# Nouvelle mission préparée ; deux décisions avant indexation et publication

## Objectif et étape actuelle

La demande est de préparer la suite du pipeline statique RMS à partir du travail restant, conserver cette conversation et tous ses sous-agents dans la base consultable par QMD, puis committer et pousser le dépôt.

Le nouvel [ordre de mission](../../../../docs/missions/rms-static-closure-20261028/MISSION.md) est écrit. Il reprend les acquis sans relancer la migration, les 450 paires ou les neuf régressions ; il distingue les travaux restants, les dépendances, les revues et les interdictions non levées. Il intègre la récupération des livrables avant remplacement des auteurs.

Il s'agit d'un **préplan documentaire**, pas d'une nouvelle mission native déjà importée ou démarrée. La mission future devra être préparée dans un contexte distinct, sans écraser l'équipe M2 actuelle. Le contrat de vérification renforcée et les modèles devront être présentés avant le `start` utilisateur. Aucun test du produit n'a été relancé.

## Ce qui est vérifié

- L'état Git observé avant création du nouvel ordre comportait **60 391 chemins modifiés ou non suivis**, dont 107 modifications suivies, une suppression suivie et 60 283 fichiers non suivis.
- Les fichiers présents concernés totalisent environ **16,65 Go**, avant compression et hors fichiers déjà ignorés. Deux captures font à elles seules environ **9,65 Go** et **2,14 Go**. Ce ne sont pas seulement des sources ou des rapports.
- La branche est `main`, avec suivi `origin/main`. La destination configurée est le dépôt GitHub `Djoe-Denne/BinaryTribunal`.
- Une publication GitHub ordinaire de l'ensemble brut ne peut pas transporter ces fichiers géants. Aucun indexage Git, commit, push, installation de stockage ou changement d'exclusions n'a été effectué.
- La collection QMD pertinente est bien `ff8-wiki`, attachée à `obsidian-docs`. La configuration globale du wiki pointe actuellement vers un autre projet : elle ne doit pas être utilisée ou modifiée pour cette opération.
- QMD annonce 202 documents dans cette collection et une dernière mise à jour ancienne de huit jours. Le manifeste local du vault est lisible avec son encodage existant ; l'historique conserve déjà des ingestions non recompilées à cause de l'interdiction d'exécuter `qmd update` / `qmd embed`.
- Seize sessions d'auteurs directement rattachées à cette conversation ont été identifiées dans l'API native. L'inventaire complet, pagination et descendants compris, reste à fermer avant de prétendre à une archive intégrale. Aucune session n'a été relancée.

## Archivage prévu

Inclure le nouvel ordre, cette conversation et les sessions de ses sous-agents, y compris les échecs et les résultats retrouvés. Conserver un inventaire de couverture et des empreintes, puis une synthèse distinguant acquis, propositions et blocages. Les raisonnements privés et secrets ne seront pas publiés ; toute omission ou source inaccessible sera signalée.

L'archive n'est pas une nouvelle preuve d'acceptation et ne doit pas contaminer les futurs auteurs ou reviewers aveugles. Les sources primaires existantes restent en place.

## Décision 1 — Que publier dans Git ?

**Recommandation : publier les sources, documents, tests, archives textuelles assainies et preuves de taille compatible, avec des références et empreintes pour les gros artefacts conservés localement.** Cela fournit un état distant exploitable sans tenter de faire de Git un stockage de captures de plusieurs gigaoctets. Il faudra rendre la liste exacte des inclusions et exclusions, vérifier l'absence de secrets et ne pas présenter ce checkpoint comme une acceptation du produit.

Si l'objectif est réellement une sauvegarde distante de chaque octet, il faut d'abord choisir un stockage adapté et sa destination. Le dépôt Git peut garder les manifestes, mais une simple commande push ne remplit pas cet objectif. Aucun budget, service de stockage ou changement d'historique n'est autorisé implicitement. Le coût et le temps d'une telle sauvegarde ne sont pas établis.

Différer la publication laisse tout en local et permet de terminer la préparation documentaire sans transfert distant.

## Décision 2 — Autoriser l'indexation QMD nécessaire ?

Une règle projet interdit explicitement `qmd update` et `qmd embed`, tandis que la demande actuelle exige de rendre le nouvel archivage consultable dans QMD. Écrire les fichiers du vault sans rafraîchir l'index ne suffit pas à promettre leur présence dans les recherches.

**Recommandation : autoriser une exception bornée à cette ingestion et à la collection `ff8-wiki`, après vérification du support effectif du filtrage.** Ne pas mettre à jour les collections des autres projets, modifier la configuration globale, installer des modèles ou utiliser `--pull` / une reconstruction forcée. La recherche devra retrouver les nouvelles pages avant d'annoncer l'ingestion achevée.

Sans cette exception, l'archive et les pages peuvent être préparées sur disque, mais la publication dans l'index QMD doit rester explicitement non exécutée. La durée et le coût en ressources d'une vectorisation intégrale ne sont pas encore mesurés ; aucun appel payant n'est proposé.

## Frontières conservées

Cette demande autorise les opérations Git finales, sous réserve des choix ci-dessus ; elle n'autorise ni une reprise des diagnostics arrêtés, ni un nettoyage, ni une levée des interdictions de threads, ni une remise à zéro des compteurs. Aucun `start` logiciel ne sera exécuté à la place de l'utilisateur.

## Annexe de traçabilité

- Ordre créé : `docs/missions/rms-static-closure-20261028/MISSION.md`.
- Références : ordre M2 du 20 octobre amendé, journal de reprise, rapports 180 et 181.
- Conversation native : `ses_e8c853715ffdpywoSQ7gbvu0Eo` ; seize enfants directs observés via `GET /api/session?parentID=...`, sans clôture de pagination annoncée.
- Inventaire Git : `git status --porcelain=v1 -z --untracked-files=all`, statistiques de taille des fichiers présents seulement ; une erreur de stat correspond au chemin supprimé suivi.
- Captures bloquantes observées : `tools/_tmp_af3dn_drop/captures/lot25-pre/gfx_passthrough.csv` (9 646 793 684 octets) et `tools/_tmp_af3dn_drop/captures/gfx_passthrough_v7_campaign.csv` (2 137 292 690 octets).
- Configuration de collection relue : `C:/Users/djden/.config/qmd/index.yml`, collection `ff8-wiki` → vault de ce dépôt. Aucun réglage modifié.
