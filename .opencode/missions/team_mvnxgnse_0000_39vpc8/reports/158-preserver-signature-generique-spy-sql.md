# M2 — 158 : préserver la signature générique du spy SQL

## Résultat réel

Compilation157 exit2, un diagnostic TS2345 à replacement.test338,4722ms, une invocation sans retry. Sources155 stables ; logs et reçu vérifiés, aucune base ni asset créé. Paquet clos rouge ; aucun test lancé. La revue156 reste valide sur le sens des compteurs, mais ne prouve pas la compatibilité TypeScript.

Le mockImplementation de Database.query doit préserver son contrat générique ReturnType/ParamsType. Le callback actuel infère un Statement de résultat unknown avec union de bindings plutôt que la signature originale. Ce diagnostic concerne le test, pas un défaut de mémo produit observé.

## Correctif autorisé

Après snapshot des quatorze sources155 et du manifeste, autoriser uniquement test/s2-author/replacement.test.ts. Préserver explicitement la signature générique réelle et son transfert d'arguments/retour natif, avec les types Bun existants si nécessaires. Aucun any, cast permissif, désactivation de diagnostic, faux Statement ou abandon du contrôle natif. Si le raccord exige une autre frontière, signaler avant édition.

Conserver les cinq variantes, la partition des parses acceptée156, les restaurations, les quatre/deux lectures natives, les causes précises et toutes les assertions. Aucun produit, API publique, configuration, framework ou autre fichier modifié. Livrer hash/diff et justification du contrat de type ; source seulement, pas de typing ou runtime worker.

Revue ciblée de ce raccord de type et son impact seulement ; réutiliser produit154 et oracle156 hors impact. Puis compilation neuve parent, sans retry157. Seuil15s inchangé, gain inconnu, trois threads HOLD125. Aucun import évalué/test/SQL/DB/asset/provider/Git/délégation ou campagne450+9 autorisé. S2/M2 restent non acceptés.

## Annexe preuve

Reçu157 SHA04d3af61df3b9f1396e50b0824cbedd9d4355c0075854b1ce86bfc6af5e9de44 ; sourceSet exécuté b059d160c2900ce3a40324336b06e396414cff174c5400be8aba45b0063dff82. Preuves conservées sous evidence/s2-measure-155-typing.
