# Parent — correction QA locale après rouge runtime, reprise autorisée utilisateur

Gate précédente conservée : l8-factoring-typefix-gate-receipt.json,
SHA2561f451b4eeb51d49d3530fb0a0c6d5f1701f9fbedf21d8b9ebc0d5a67e8e0a33c.
Typecheck vert ; pure/transport/numeric90PASS/1FAIL/1354assertions/3files.
Les autres suites n'ont pas démarré ; aucun DB créé, aucun nettoyage.

Cause : le négatif work-unit ne contient que schemaVersion et échoue sur
required.unitId avant de contrôler son type. Le produit respecte son ordre
legacy (graph-pure-codecs.ts:329–334), pas un défaut à affaiblir.

Delta parent borné : garder ce cas comme assertion explicite de missing unitId ;
ajouter le type négatif voulu à partir de partitionDoc COMPLET, déjà validé
positivement dans le même fichier (:706–737), avec seul schemaVersion="x".
La comparaison attend toujours document.schemaVersion: schema type mismatch
pour ce deuxième cas. Aucun changement de codec/schema/fixturebuilder ou filtre
permissif. Un assert ajouté, mêmes59tests ; expect<unknown> précédent conservé.

Le patch interrompu n'avait rien écrit ; parent a rehashé268guards et confirmé
la baseline avant cette petite correction. Rouge et snapshot intacts.
Vérification fresh étroite du delta avant nouvelle gate distincte/once-only,
qui commencera encore par typecheck. Pas relance automatique du gate rouge.
S1HOLD/full44/native/G5G7 et portabilité future restent inchangés.
