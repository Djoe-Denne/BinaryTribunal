# M2 — 96 : tâche globale reprise par le superviseur, indépendance préservée

## Incident et conséquence

Après la revue94, le dispatch automatique a affecté l'implémentation globale000b au reviewer. Celui-ci a refusé toute écriture, handoff auteur, test ou SQL et a signalé le conflit. Sa revue livrée À_CORRIGER reste une preuve indépendante ; ce problème de routage ne la remplace pas et n'ajoute pas un défaut produit.

Le parent confirme l'affectation erronée par une lecture ciblée du tableau. Les outils exposés ne proposent pas de réaffectation arbitraire d'une tâche déjà assignée ; aucune édition directe de l'état interne ni changement de policy/configuration n'a été tenté.

## Correction effectuée

Demande d'arrêt normal du slot reviewer, sans force ni abort de travail utile, puis **team_claim000b réussi côté lead**. La tâche globale reste ouverte, possédée par le superviseur ; elle n'est plus disponible pour une affectation automatique à un reviewer. Aucun faux achèvement pour débloquer le pool.

Les correctifs source95 restent le seul mandat auteur. Pas de second auteur/fork concurrent lancé : une comparaison ciblée montre que graph-final-inventory a déjà commencé le correctif95 (verifyOwnEntry95/verifyFileEntry95), malgré les anciens états de slot. Cet écart est du travail autorisé95, pas une nouvelle livraison gelée ; aucune qualification ou attribution universelle d'absence d'autre changement n'en est déduite. L'auteur est explicitement informé de poursuivre ce paquet unique, sans retour à la baseline ni claim de000b.

Le reviewer reste réservé aux reprises RO bornées avec manifeste gelé. Sa fermeture normale ne détruit ni session/provenance ni fichiers ; une reprise corrective future devra porter uniquement sur ce rôle, pas sur le code global. Aucun changement de modèle, permission native, budget ou méthode de mission.

## État sûr et limites

Sources95 actuellement mutables dans leur allowlist de six, autres sources protégées. Aucun nouveau typing/test/DB/asset ou preuve quota3/crossEpoch.000b/S2global/M2 restent ouverts ; anciens paquets clos. Aucun commit/merge/cleanup/registre global ou réparation de harness engagé. La seule mutation de coordination est fermeture normale de slot et claim natif autorisé ; pas de commande de configuration ni start supplémentaire.
