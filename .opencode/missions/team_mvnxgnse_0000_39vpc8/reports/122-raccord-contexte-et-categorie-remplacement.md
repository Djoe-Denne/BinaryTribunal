# M2 — 122 : conserver les contrats de contexte et d'inventaire existants

## Décisions et preuves

Le remplacement reste une nouvelle préparation explicitement liée aux sources courantes, sans nouvelle allocation racine. L'auteur relève deux raccords ; le parent confirme le contrôle S1 `allocation.context===context` à graph-execution-envelope1326 et la catégorie historique `materializations` dans le baseline116 final-inventory14–16.

1. Recontextualiser l'allocation et la policy **courantes** ainsi que leurs fingerprints cohérents avec le nouveau planning est compris dans le raccord S1 autorisé120. Préserver les documents OLD, rootAllocationRef, rootLimits, grants et bootstrap acquis ; aucun crédit, hausse C/N/T ou nouvelle autorité. Les preuves HOST courantes doivent couvrir ces documents, pas seulement une copie de contexte dans la demande. La qualification S1 reste à exécuter après revue.
2. Corriger l'unique nom de catégorie `materializationWrites` en `materializations` dans les DATA121. Ni nouvelle catégorie, ni alias, ni modification du produit ou des attentes de contenu par cette correction. La sémantique des enregistrements et leurs joints restent à vérifier par la revue indépendante ; le libellé corrigé ne prouve pas leur validité.
3. Une tentative OLD après swap peut produire le résultat structuré existant REJECTED/STALE_CONTROL_PREIMAGE plutôt qu'une exception. Conserver l'oracle comportemental : aucun effet d'activation ni nouveau droit sous la préimage périmée ; la tentative fraîche reste sous le plafond racine2. Aucun résultat runtime anticipé.

## Préservation et limites

Préserver DATA121 avant la substitution nominale, vérifier le diff exact et publier le nouveau pin readonly. CONTRACT119 inchangé. L'auteur continue source120 dans l'allowlist existante, sans import, binding, replan exécuté, typing, test, thread, SQL/DB, asset ou Git. Les sources historiques, compteurs et critères restent intacts ; S2/M2 et la preuve du remplacement restent ouverts.

Correction parent effectuée : DATA121 conservée byte-exacte readonly sous `inputs/s2-replacement-121-before-category-fix/`. Comparaison exacte valide l'unique substitution du nom ; DATA12228891B/SHA256 `47673826fa1284323a1ebfdf170370a3ffde4b914a763a48163082d8c9add063`, reprotégée readonly. CONTRACT reste4dac2a87… . Ce nouveau pin est celui de la future revue, les pins antérieurs restent historiques.
