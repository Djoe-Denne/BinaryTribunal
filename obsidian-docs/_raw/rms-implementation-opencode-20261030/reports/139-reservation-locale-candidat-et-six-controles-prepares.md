# 139. Réservation locale : candidat reçu et six contrôles préparés

## Objectif et état

Obtenir ultérieurement les vrais jetons de possession locale avant l'image finale, sans les présumer et sans créer d'autorité native. Le candidat de staging est reçu et ses empreintes ont été vérifiées ; sa syntaxe passe sans évaluation. Le produit782 et ses18fichiers protégés restent inchangés. La revue indépendante des nouvelles frontières SQLite et filesystem est en cours ; aucun avis favorable n'est encore revendiqué.

Le parent a relu la composition : contrôle des sources et références avant création, namespace exclusif, acquisition effective du contrôleur, APIs existantes de snapshot/unité/plan/READY/réservation, fermeture des writers puis readback SQLite séparé. Ce relevé n'est pas une preuve d'exécution réussie.

## Contrôles fermés avant toute base

Un petit runner parent est écrit et sa syntaxe seule est vérifiée. Il dérive les références attendues depuis les trois documents V3 réellement chargés et liés, sans token fourni par le caller. Le namespace QA neuf sera local-stage-qa-139, avec fichier qa-own.sqlite, contrôleur explicitement nommé QA et lease de300000ms au maximum.

Après revue du candidat, six cas ciblés pourront être exécutés : refus d'un pin contraire, refus des références run et planning contraires avant mkdir, refus d'un namespace partiel déjà présent, positif freshDB avec readback RESERVED et absence d'effets externes, puis refus d'un second appel sans modification de la base. Aucun framework de fautes, thread ou suite globale. Le processus aura une borne de dix minutes et les durées par cas seront enregistrées.

Une base positive serait exclusivement une preuve QA locale. Elle ne serait pas adoptée implicitement pour l'exécution native. Aucune lease QA ne satisfait les droits, acquisitions, inventaire ou attribution du canary. Un échec conservera fichiers et état partiel en HOLD, sans nettoyage, renouvellement, reset, adoption ou retry automatique.

## Preuves et limites

- Candidat : stage-local-reservation.mjs,25729octets, SHA2565bbea4d5bd9e88f36bbdbabebcbc8973577fe3d7d8a3c0c1a68f0022d4a09a72.
- Manifeste candidat :14741octets, SHA256ecceb90838be4b8d48f8a1acb6359a374fe5606e9d4d9cb2aa8abc8a6551ad62.
- Syntaxe candidat déjà acquise : node --check,42ms, sans import. Syntaxe du runner check-local-stage.mjs : exit0, sans évaluation.
- Source V3,14contrôles et recharge du rapport138 réutilisés ; pas de nouveau rejeu du produit.
- Aucun appel du runner, import du stage, namespace QA, base ou réservation créé à la rédaction. Admission native, corpus/wire concret, acquisition, droits et réception M2 restent ouverts.

## Complément : références calculées sans staging

Le parent a ensuite exécuté uniquement le mode descriptif du runner, qui retourne avant l'import du stage et toute création de namespace. Il réussit en184ms : mission/unité, sourceRequestRef, runRef et planningRef sont dérivés des documents pinnés après liaison et scellement, sans token ou date de lease présumé. [Reçu exact](../evidence/local-stage-request-derivation-v1.json). La première enveloppe Context Mode avait une erreur d'échappement avant lancement ; elle a été corrigée sans tentative de staging. Les six cas avec effets locaux restent non exécutés, en attente de l'avis indépendant.
