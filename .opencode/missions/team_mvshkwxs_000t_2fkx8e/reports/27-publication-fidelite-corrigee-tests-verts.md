# 27. Publication : octets exacts conservés, tests affectés réussis

## Résultat concret

Les deux tests de fidélité passent désormais **sans avoir été modifiés pendant le correctif** : une normalisation présentée comme résultat stocké est refusée avant écriture ; les octets bruts indentés sont conservés dans le manifeste, le binding et la reprise, avec leurs empreintes distinctes. Les43 assertions ciblées sont atteintes.

Le parent a confirmé que seul graph-store.ts change depuis le test-seul : le validateur fournit les images brutes déjà vérifiées au garde et au resolver de binding prospectifs. Les contrôles d'attribution restent en place. Sans policy prospective, la branche historique conserve son comportement précédent ; aucun nouveau schéma, état durable ou changement de scientificCommitId.

## Contrôles réellement exécutés sur r3

- Deux cas de fidélité : **2 PASS, zéro échec,43 assertions**.
- Typecheck complet : **réussi, code0**.
- Seul fichier publication : **25 PASS, zéro échec,249 assertions** ; durée totale65,41 secondes, timeout explicite quinze secondes par test. Les deux cas ciblés sont inclus, pas additionnés une seconde fois.
- Deux régressions historiques précisément filtrées : **2 PASS,39 assertions**.

Les363 fichiers pinnés sont identiques après exécution ;3493 dépendances sont vérifiées. Aucun thread, suite globale ou preuve native. Le RED r2 reste conservé comme échec de sa version, pas comme un succès rétroactif.

## Suite

La même revue indépendante reprend uniquement le défaut d'octets et l'impact de la correction. L'intégration reste suspendue jusqu'à son verdict. Les preuves valides des frontières inchangées sont réutilisées : le cas vertical v2 sans policy prospective ne change pas, et son chemin de binding historique a été contrôlé par les deux régressions r3.

Projection du prochain contexte, garanties natives et acceptation globale toujours distinctes et non acquises. Aucun nouveau GO demandé.

## Preuves

- `../evidence/publication-r3-manifest.json`, SHA256 `6982f54bd4bfee58be7fdde9228b8a3ea6c21dd1856ae5bddce65ae0c8a83d1c` ; HEAD `7d3fae678032a86964a98ab09c12c330dadf9d50`.
- `../evidence/publication-r3-parent-checks.json` et reçus/captures `publication-raw-green-r3`, `publication-typecheck-r3`, `publication-tests-r3`, `publication-historical-r3`.
- Source corrigée SHA256 `dcea020a24bff8211b6fdd0ff887eac03d900cf31a73689b8bb992f5ef25f1db` ; test inchangé SHA256 `03b7b9d15299f8d894c6b482b6293f32b6f5bcff2c8da6d1940136fed16a9caf`.

Localisation : validation et binding prospectifs du store existant. Impact : correction bornée et vérification renouvelée sur ses consommateurs. Limites : verdict indépendant encore attendu, publication non intégrée, aucune clôture complète.
