# 4. Préparation recevable, file existante conservée, lancement toujours non approuvé

## Objectif et conclusion de supervision

La mission doit achever le pipeline statique RMS sans refaire les acquis ni
dupliquer Ensemble. Le préparateur devait résoudre le rapprochement avec les
onze tâches déjà créées avant tout import.

**La préparation révisée est recevable côté superviseur.** Son document natif
est `ready`, sans question ouverte, et ne demande aucune nouvelle tâche.
La notification annonce son import ; une nouvelle lecture de la file native
confirme les onze identifiants existants, sans doublon.

Ce résultat clôt le blocage de préparation, **pas la mission logicielle**.
La politique reste proposée et non approuvée ; aucune admission n’est autorisée
avant le `start` utilisateur.

## Vérifications réellement effectuées

- Lecture de la finale visible révisée dans la même session native PM : document
  version 2, `readiness.status: ready`, listes de raisons et d’informations
  manquantes vides, catalogue déclaré vérifié, aucune question ouverte.
- `tasks: []` et `parallelGroups: []` signifient zéro nouvelle création, pas
  abandon de la file. Le contexte référence le découpage complet antérieur,
  le rapport de rapprochement et ses preuves.
- La file native contient toujours onze tâches : une en attente, dix bloquées ;
  quatre études publiées et sept tâches ultérieures différées. Les identifiants
  sont les mêmes que ceux du rapport précédent. Tous les contextes restent
  `fresh` et toutes les acceptations sont réservées au parent.
- La référence native du modèle PM reste
  `{providerID:openai,id:gpt-6.1-sol,variant:high}`.

Aucun test, auteur, modification de tâche ou de politique, import manuel,
commande de reprise supplémentaire ou `start` n’a été lancé par le superviseur.
Les lectures natives ont filtré les parties de texte visibles ; aucun secret
ou raisonnement privé n’est reproduit.

## Portée du lancement proposé

La politique déjà présentée reste inchangée : OpenAI uniquement, long run,
respect maximal d’Ensemble existant, code maintenable, QA reinforced bornée,
essais temporaires dans un worktree dédié.

Le premier lancement autoriserait seulement les quatre études documentaires :
preuves et livraisons, correction du remplacement, contrat public et oracles
indépendants. La ratification précise des modifications et exécutions reste
requise avant les tâches ultérieures. Les interdictions threads, le plafond
d’origines, la limite de quinze secondes par test et les autres garanties ne
changent pas. Le remplacement reste non accepté ; les trois commandes
consolidées restent non exécutées.

## Prochaine décision utilisateur

Je recommande le contrat déjà présenté pour démarrer uniquement ces études.
L’utilisateur peut conserver la pause sans effet sur le produit, demander une
correction suivie d’un nouveau `config`, ou approuver la révision inchangée
avec `/ensemble-mission start`. Aucun nouveau `config` n’est nécessaire du seul
fait de cet import sans modification de politique, sous réserve des contrôles
natifs de validité de la présentation. Aucun coût ou délai supplémentaire n’est
estimé dans ce bilan.

## Références techniques

- Session PM : `ses_e7c960e08ffedHMLFaxorVahbm`.
- Finale révisée : `msg_183776210001SOb3kFt02vjaV4`, `finish:stop`.
- SHA-256 du texte visible complet :
  `d7a3924f9324fbbe7cf6cdb30a1c4ec86f1ebae41b27c46f105bc35356adcc00`.
- [Décision de réutilisation de la file](003-reutiliser-la-file-native-sans-double-import.md).
- [Preuves du rapprochement](../evidence/queue-reconciliation.json).
- [Priorités long run et isolation](002-priorites-long-run-et-isolation-des-essais.md).

Localisation / impact / limites : lecture de la seule finale PM et de la file
native pour la revue de préparation ; seul ce compte rendu a été écrit.
Aucune requalification produit, inspection de base, mutation d’archive ou
modification de M2 ; l’import n’est ni un démarrage ni une acceptation scientifique.
