# 41. Projection : une observation de phases bornée pour localiser le blocage

## Pourquoi cette observation maintenant

Les deux défauts de sûreté ont des reproductions et correctifs ciblés, mais n'expliquent pas le délai du parcours central. La lecture statique a révélé du travail redondant sans établir la phase atteinte pendant l'interruption. Continuer des optimisations sans cette information reviendrait à inventer une cause.

Le superviseur autorise **une seule observation locale bornée**, pas une relance dans l'espoir d'obtenir PASS : le même cas central reçoit un préchargeur qui indique les entrées/retours synchrones et compteurs de quelques méthodes existantes. Aucun argument, résultat, contenu privé ou timing détaillé n'est enregistré. Les messages sont plafonnés et espacés par puissances de deux.

## Limites fermées

- Source, oracle, dataset et candidat r5 restent gelés ; aucune modification de fichier produit ou de fixture existante.
- Le préchargeur délègue chaque appel avec les mêmes arguments et renvoie exactement sa valeur ou sa Promise d'origine. Il ne pose pas de timer, callback supplémentaire sur Promise, SQL ou effet d'autorisation. Les marqueurs de retour ne sont pas des preuves de terminaison asynchrone.
- Une invocation parent seulement, timeout Bun et limite externe de quinze secondes. Les anciennes ressources interrompues ne sont pas rouvertes, modifiées ou effacées ; le driver crée ses nouvelles fixturesOWN.
- Les traces sont des données de diagnostic hors ligne, **pas une qualification fonctionnelle ou de performance**. Même si l'oracle termine, le parcours instrumenté n'est pas substitué à la preuve normale requise.
- Aucune campagne scientifique, diagnostic de remplacement gelé, thread, nouveau framework de profilage, service ou action native. Ce petit outil local ne modifie ni le contrat QA ni les critères d'acceptation.

Si cette unique observation n'apporte pas de défaut ou hypothèse précisément discriminable dans les permissions, le blocage est conservé ; pas de boucle de diagnostic ou allongement de délai. Toute correction qui en découlerait sera justifiée séparément avant exécution.

## Préparation et état

Outil local : `../trace-projection-phases.mjs`, limité au GraphStore du worktree possédé. Syntaxe à vérifier avant exécution. Le parent contrôle les pins avant observation et conserve les captures distinctement. Les deux tests GREEN et régressions transport acquis restent la preuve r5 ciblée ; la revue indépendante peut poursuivre sans accepter cette observation comme un PASS.

Localisation : observation des phases du seul parcours RMS hors ligne de projection. Impact : recherche bornée d'information manquante, aucune autorité ni état durable nouveau. Limites : observation pas encore exécutée, cause et preuve centrale toujours manquantes, aucune réception/intégration globale.
