# M2 — 100 : préserver le type readonly du resolver de contrôleurs

## État et décision

La reprise99 valide logiquement B-SCOPE et son impact nominal/historique. Seul défaut résiduel : inventory145 promet BoundExecutionV1 mutable alors que bindExecutionSourcesV1 retourne ReadonlyData<BoundExecutionV1>. Parent recoupe import3/resolve145/binding151–152 et la déclaration codec. Le défaut est établi par types ; aucun tsc ou résultat runtime n'a été observé.

Correction minuscule par le parent : ajouter ReadonlyData à l'import TYPE existant et annoter le champ de retour interne bound:ReadonlyData<BoundExecutionV1>. Aucune conversion mutable, cast, changement de codec/publicS1, logique de join ou test attendu.

Avant édition, conserver inventory99 et manifeste98 byte-exacts readonly sous snapshots/s2-t2-type-99. Seul inventory est dégelé pour ces deux substitutions, puis re-gelé après contrôle. Les sept autres sources et29tests restent identiques. Aucun typing/test/import/SQL/DB/asset autorisé par ce seul correctif.

## Vérification proportionnée

Le reviewer indépendant confirme uniquement le petit delta de type et ses usages en lecture ; ses preuves logiques99, A/C97 et autres constats valides sont réutilisés. Pas de nouvelle campagne/worker/harnais. Après acceptation de la revue source, parent fermera le typing et les futures fixtures/assets réels sous un budget distinct ; pas de PASS anticipé de compilation.

Quota3 et crossEpochSPENT restent requis/non obtenus.000bownerlead/S2global/M2 ouverts ; pas de nouveau contrat scientifique, compteurs, modèle ou permissions. Anciens paquets clos, aucun Git/canonique/cleanup.

Correction réalisée : deux substitutions TYPE exactement, vérifiées par comparaison à la copie conservée ; inventory44553B/SHAb4078bd1… . Sept autres pins inchangés, sourceSet4b84f373… dans evidence/s2-t2-source-100.json ; inventory re-geléreadonly. Aucun cast, runtime ou modification des29cas. Reprise courte du type transmise au reviewer, pas nouveau contrôle général.
