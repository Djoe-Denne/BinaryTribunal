# M2 — 05 : GO reçu et contrôle d'entrée

## Autorité et étape

L'utilisateur a transmis l'approbation de la politique révision 1, hash `e40e9c12822baac19052c218db03eb672abf30f9ceadbe49fef2e612af365787`. Démarrage limité aux tâches importées selon leurs dépendances ; aucun élargissement live/G5–G7, Git ou runtime partagé. Le backend de présentation reste arrêté.

## Résultats observés

Reçu parent : `../evidence/go-base-observation.json`, observé le 2026-10-25 à 16:46:30 UTC ; liste complète du statut conservée dans `../evidence/go-status-porcelain.txt`.

- Branche `main`, HEAD `c1de250979cf8c419003035eb6e1ccefd38cc311`.
- L'historique lu contient les commits M1 `e1a97a0` et `54c689c`, puis les adaptations documentaires `90e24e7` et `c1de250`.
- 59 347 chemins sales : 107 suivis modifiés et 59 240 non suivis ; ce nombre porte sur le dépôt entier, pas uniquement le produit RMS.
- 95 chemins sales dans le périmètre harness/documentation de mission ; 44 dans le harness, dont des sources centrales modifiées et des modules/tests non suivis.
- 351 fichiers pertinents empreintés. Observation, pas sauvegarde ; aucun changement existant modifié, indexé, nettoyé ou committé.
- Aucun test produit exécuté. Les résultats historiques ne sont pas promus au candidat courant.

## Décisions de supervision

1. Commencer uniquement `base-post-m1` : rapprochement documentaire et matrice bornée, avec le reçu Git parent. Le rôle PM ne reçoit aucun droit Git ou test.
2. Garder le WIP intégralement intact. Aucun worktree HEAD seul ne sera présumé contenir ce candidat scientifique ; préparer des projections possédées seulement lorsque leurs entrées et gates seront identifiées.
3. Sol high choisi via décision d'exécution autorisée (catalogue révision 1), sans override de spawn/message. Ce rapprochement contractuel et de provenance n'est pas une tâche mécaniquement simple pour Luna. La tentative pm-rms avec restitution `final_response` a été refusée par le harness (`Autonomous workers require claim_task and collaborative reporting`), sans session créée. Aucun changement de permissions n'a été tenté. La recherche a été confiée au profil `general`, en lecture seule par mandat, avec restitution collaborative, sans worktree ni droit d'écriture délégué. pm-rms demeure le conseiller de domaine, pas un rôle de tests ou d'implémentation.
4. L'annotation S1 50/51 pins est permise comme proposition documentaire après comparaison, jamais comme réécriture de gel.
5. La preuve publique reste conditionnée à un préflight décrivant point exact, fixture possédée, permissions et budget. Aucun appel natif concerné n'est encore autorisé par une hypothèse sur ces paramètres.
6. L'implémentation reste bloquée jusqu'à fermeture des obligations pertinentes, décisions V01/V04 et gates contractuelles. Aucun PASS sur la seule complétion d'un worker.

## Limites et prochaine étape

La version scientifique n'est pas identifiée par HEAD seul. Le rapprochement doit établir l'applicabilité de T3/T4 et des paquets planner/numeric/S1. La grande quantité de fichiers non suivis n'autorise aucun nettoyage. La suite utile attend ce livrable ; ne pas remplir des slots sans tâches prêtes.

## Admission et readback natif

`base-post-m1-r1` possède `task_mvo1ayx4_0002_zbtym9`, session fraîche `ses_e8c09580cffeoWxNpfwtQS4YPG`. La réponse native `GET /api/session/ses_e8c09580cffeoWxNpfwtQS4YPG`, lue via le CLI OpenCode et son contexte de connexion, confirme `Model.Ref = {providerID: openai, id: gpt-6.1-sol, variant: high}`, agent `general`. Le modèle n'est donc pas déduit de la seule chaîne demandée au harness.

Une seule tâche prête a été admise. Planner et V01/V04 attendent la base ; aucune implémentation parallèle prématurée. Réception événementielle du livrable, sans polling de progression.
