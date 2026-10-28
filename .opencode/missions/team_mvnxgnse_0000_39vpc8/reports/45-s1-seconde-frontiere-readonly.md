# M2 — 45 : seconde frontière readonly identifiée, correction sans nouveau helper

## Résultat et diagnostic vérifiés

author13-typecheck : échec exit2,1932ms, unique TS2589 à1391 dans bindExecutionSourcesV1 ; le parent a lu ce diagnostic. La première frontière bindExecutionPreparationV1 n'est plus signalée. Ce résultat ne vaut pas typing complet réussi.

Lecture parent de la construction : BoundExecutionV1 étend BoundPreparationV1 (201–209) ; la fonction reçoit désormais un prepared déjà readonly mais termine à1440 par un cast mutable historique `as BoundExecutionV1`. Elle oblige donc encore une comparaison récursive mutable→readonly au retour. Les seuls deux DTO publics contenant directement missionSnapshot récursif sont ces deux interfaces ; ParsedEnvelope/GraphRun retiennent des documents et ne rajoutent pas ce Snapshot décodé. Ce diagnostic statique explique le défaut suivant révélé, sans revendiquer une compilation isolée des champs.

## Correction autorisée

Dans bindExecutionSourcesV1 uniquement : `attempt<ReadonlyData<BoundExecutionV1>>`, construction explicitement annotée `const bound:ReadonlyData<BoundExecutionV1>={...clone(prepared),origin:parsed,planning}`, puis `return freeze(bound)`. Supprimer le cast mutable de ce retour, sans nouveau cast/helper, sans élargir une API ou changer les validations. Le compilateur vérifiera réellement les champs restants origin/planning contre le DTO readonly ; pas de commentaire suppressif ou any.

Préparer ce correctif et examiner statiquement les autres retours liés pour éviter une relance à seule fin de découvrir la même conversion connue. Si une incompatibilité réelle de champ apparaît, la rapporter plutôt que substituer un type permissif.

## Contrôle exceptionnel borné

Le parent autorise exactement **un sixième typing** après ce correctif (60s maximum), et la composition all avec le test de gel/détachement/FailureCause ajouté mais non encore exécuté, dans le budget test existant. La modification locale de construction justifie le contrôle runtime affecté ; les71PASS précédents restent historiques, pas automatiquement ceux du nouveau helper.

Runner borne typing5→6 seulement ; ledger et tous rouges intacts,12tests/plafond600s cumulés inchangés. Situation déclarée avant reprise :8tests/5typings/15187ms. Pas de septième typing implicite, nouveau framework, campagne de sondes, reset ou CLI directe. Si l'échec persiste : arrêt et rapport de preuve partielle avant une autre décision, sans acceptation S1.

La raison de cette seconde extension est précise : le compilateur a désormais pu atteindre un second retour mutable historique du même DTO, et la correction supprime ce cast avec une annotation vérifiée. Ce n'est pas un rejeu inchangé ni un élargissement fonctionnel.

## Limites

Typing final, version du candidat testée, QA API indépendante et intégration restent requis. Trois checks consolidés M2 NON EXÉCUTÉS ; numeric450+9 réutilisé, aucun support RO/contrat/gels changé. Aucun Git/DB/native/live/IDA ou nouvelle permission.

Runner révisé : node --check PASS, SHA `7974f5966a3dcdd059b637ced5df9e2726dcd1224fa1d99c22b81af9d0816bab` ; ledger parent relu8tests/5typings/15187ms/nonbloqué, aucune exécution produit pendant ce contrôle.
