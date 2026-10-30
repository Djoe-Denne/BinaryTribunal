# 19. Raccord statique intégré ; poursuite vers la publication

## Résultat concret

Le raccord statique revu est intégré dans tools/ff8-harness et committé par le superviseur. Les **360 fichiers relus sont identiques à la version acceptée dans sa portée**. Les onze modifications préexistantes du dépôt sont conservées à l'octet près et ne sont pas incluses dans le commit.

Cette intégration reçoit le livrable logiciel autorisé par le contrat ratifié : préparation v3 DATA consommée par Engine, jointure/body durables, corrections client et refus transactionnels anti-fallback. L'activation native reste explicitement inutilisable. Les critères portant sur le véritable body RPC, l'admission, les sessions/droits effectifs et la terminaison ne sont **pas satisfaits ni comptés PASS** : ils restent dans le journal et la tâche obligatoire de preuve native/scénario final, sans dérogation.

## Validation consolidée sur le dépôt intégré

Après transfert exact, nouvelle localisation et contrôle des dépendances :

- Typecheck complet : réussi, code0.
- Script test:q1-primitives : **55 PASS / 0 FAIL,125 assertions**.
- Client : **22 PASS / 0 FAIL,82 assertions**, les deux négatifs de concurrence inclus.
- Raccord DATA : **2 PASS / 0 FAIL,10 assertions**.

Quinze secondes par test ; fichiers inchangés après. Les contrôles protocole et vertical v2 déjà acquis restent réutilisés dans leur portée : pas d'append tacite dans le registre de fixtures historique du canonique. Les dépendances installées ont été rapprochées :3493 fichiers identiques au snapshot du candidat, sans réseau ou installation.

Les succès des différentes versions ne sont pas additionnés comme couverture. Les RED historiques restent des échecs sur leurs sources antérieures. La suite globale demeure interdite et non exécutée.

## Suite autorisée et limites

Le livrable du premier incrément logiciel est reçu ; la preuve native obligatoire n'est ni supprimée ni transférée en succès. Les interfaces ratifiées permettent maintenant de poursuivre les travaux logiciels de publication durable, puis de projection du contexte suivant, selon les tâches déjà importées. Ils restent sériels sur les fichiers communs et ne présument pas de droits natifs manquants.

La revue finale L9 et l'acceptation L10 de l'ensemble restent à obtenir. Le remplacement est toujours bloqué par ses obligations indépendantes de délai, threads et origines. Ce jalon n'est donc pas une clôture complète RMS.

## Incident de nettoyage, sans perte de l'intégration

team_merge a intégré les changements, mais n'a pas pu supprimer l'ancien worktree. L'intégration est confirmée par readback et commit ; **aucune seconde fusion n'a été relancée pour un problème de nettoyage**. Branche et worktree sont conservés, sans suppression forcée. Le dernier registre de fixtures a été snapshoté côté parent ; aucun artefact utile ou ressource tierce n'est nettoyé.

## Preuves techniques

- Commit parent : `87a933fafdbe7e94305d5de6d3aae66c806e94b5`,68 chemins source exacts ; aucun fichier de coordination, push distant, amend ou bypass de hooks.
- `../evidence/integration-r6.parent-readback.json`, `integration-r6.commit.json` et log de commit.
- Reçus `integrated-typecheck-r6`, `integrated-q1-r6`, `integrated-client-r6`, `integrated-runtime-r6`.
- Revue scoped indépendante r6 : verdict et références dans le rapport18 et bundle natif conservé.
- `../evidence/focused-fixtures-r6.snapshot.jsonl` ; hash `ec4e6168f2df97b5911d60209a78e132f4debff366ab7ecd4e14a0b57778b58a`.

Localisation : fichiers réels du canonique après fusion native, comparés au candidat et aux modifications préexistantes. Impact : intégration logicielle statique retenue, prochaine étape publication. Limites : route native fermée, obligations scientifiques/globales encore bloquées ou à réaliser.
