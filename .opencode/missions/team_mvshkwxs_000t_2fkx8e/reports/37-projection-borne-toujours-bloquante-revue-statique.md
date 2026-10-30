# 37. Projection : délai toujours bloquant, revue indépendante statique engagée

## Résultats actuels

Le correctif de parsing est reçu sur deux fichiers et épinglé :365 fichiers,3493 dépendances identiques. Le parent a relu le résolveur : origine courante relue et vérifiée avant cache, seuls parsing et contrôles purs mémorisés ; les contrôles d'autorité restent distincts. Cette inspection ne prouve pas encore toute la sûreté du cache.

Le typecheck réussit, code0, environ3,6 secondes. Mais le **même unique cas central** est interrompu à la borne externe stricte de quinze secondes, sans résumé d'assertions ni exit code enfant. Les captures contiennent uniquement la bannière Bun. Le correctif ne démontre donc pas la conformité de délai ou l'acquisition effective.

Aucun processus Bun correspondant ne subsiste au contrôle. Les365 fichiers sont identiques après interruption. Quatre chemins de fixtures sont désormais réservés sur les deux tentatives, sans pin de fermeture ; ils sont conservés, sans réouverture, suppression ou reset.

## Travaux indépendants utiles

Le parent a vérifié les effets et exécuté seulement les **huit tests historiques filtrés** touchés par les attentes de schéma : **8 PASS, zéro échec,72 assertions**,456 ms rapportées par Bun. Le filtre exclut les autres cas, notamment les subprocess. Les fixtures sont neuves et possédées ; leur cleanup existant ne touche que leurs propres fichiers. L'ensemble de cette commande termine sous la borne externe de quinze secondes.

Ces huit succès qualifient leurs oracles historiques de migration/refus, pas l'approbation privée ou la projection centrale. Ni46 PASS, ni suite complète, ni preuve native ne sont déclarés.

Une revue indépendante en contexte fresh est engagée sur les sept changements et les risques32, y compris le cache pur. Elle distingue défaut de code, preuves comportementales obligatoires manquantes et suggestions différables. Elle ne lance aucun test/profilage/instrumentation ni campagne et ne peut lever le manque central par sa seule lecture. Toute cause de délai avancée devra être étayée ; pas de promesse de gain.

## Décision

Code, tests et configurations restent gelés. Pas de nouvelle correction ou relance du cas central sans défaut justifié et décision d'impact ; aucune hausse de timeout ni réduction de l'oracle. La revue peut faire avancer les questions statiques indépendantes, mais **l'intégration est bloquée** tant que les preuves requises manquent.

Les acquis de publication et de raccord restent intégrés sur leurs versions ; aucune extension implicite vers v3/natif ou clôture globale.

## Références

- `../evidence/projection-r3-manifest.json`, SHA256 `63e24600451bc31063f1fdbf6d516fb937f9a96307a7064a29041f5d48f8e58d`, HEAD `1fb5fd2b9b9979b1883fc43749578bfc6368163c`.
- `projection-typecheck-r3.execution.json` et `projection-core-r3.interrupted.json`, captures associées.
- `projection-eventlog-r3.execution.json` : sélection historique exacte et ressources possédées.
- Revue : tâche `task_mvss27e3_0026_pv10yp`, lecteur fresh revue-projection-statique ; identité de session et Model.Ref seront relus dans la réception du résultat.

Localisation : worktree de projection exact et tests historiques filtrés. Impact : compilation et régressions de métadonnée vérifiées, questions statiques en revue. Limites : approbation privée dynamique et acquisition effective non prouvées, délai requis non satisfait.
