# 81. Reprise : approbation de la révision toujours nécessaire

## Objectif et résultat

La complétion du parcours RMS reste préparée, mais non lancée. À la notification de reprise, le superviseur a récupéré le message persistant et vérifié l'état natif : la révision modifiée attend toujours son aperçu et son approbation par `config` puis `start`.

Le tableau contient toujours 28 tâches : 20 terminées, une en attente et sept bloquées. Aucun nouveau résultat de worker n'était livré par le message de reprise. Aucun worker n'a été recréé et aucune tâche du brouillon n'a été admise.

## Limite et suite

Le message de reprise précise lui-même qu'il n'admet pas les travaux non approuvés. Il ne remplace donc pas l'approbation de politique requise par le système natif. Les travaux antérieurs sont conservés ; la préparation bornée est achevée selon le rapport80. Aucun nouveau travail indépendant nécessaire n'a été identifié dans ce contrôle ; il ne justifie pas de rejouer les vérifications produit ou les études acquises.

La condition de progression reste l'affichage utilisateur `/ensemble-mission config`, puis `/ensemble-mission start` si la révision convient. Il s'agit de l'approbation de la révision, pas d'un GO intermédiaire supplémentaire. Après cette approbation, la coordination reprend sans nouvelle demande de routine. Aucun test, effet natif ou changement de politique supplémentaire n'a été effectué.

## Preuves

- Message persistant récupéré avec `team_results` : notification de reprise uniquement, sans nouvelle autorité.
- Readback `team_status` : « Mission policy changed after approval; run /ensemble-mission config then start », QA reinforced.
- Préparation et critères : [bilan du brouillon et des huit tâches](80-brouillon-ensemble-et-taches-prepares.md).
