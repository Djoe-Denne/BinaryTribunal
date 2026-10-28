# M2 — 42 : codecBytes opaques, premiers nominaux auteur verts

## Vérifications parent sans rejeu

Le worker rapporte nominal projection A et refus fullsource verts, puis des rouges de préparation/enveloppe causés par la fixture initiale et une surinterprétation ajoutée de codecBytes. Parent lit les sources et les reçus existants ; aucune commande produit relancée.

Le schéma RO `schemas/l8-prepared-graph-v3.schema.json` est toujours byte-exact au pin de projection. Parsing AST de ses bytes comme données : trois propriétés `description` dupliquées, lignes1421/1777/2258, zéro diagnostic syntaxique. Ce n'est ni une mutation du gel ni une preuve d'un refus métier à supprimer.

## Décision de frontière

Le parent confirme la distinction du contrat04:23–26/codecBytes : les sources codec/schema fournies en BoundBytes sont des **bytes de loader opaques pinnés**, pas des BoundDocuments métier à décoder récursivement avec strictJson S1. Leur vérification bytes/base64/hash/longueur/UTF8/kind et résolution exacte des pins restent obligatoires. Ne pas réécrire un schéma RO ou ajouter une nouvelle gate de parsing du langage des sources pour rendre le candidat cohérent.

Code relu : `validateBoundBytes`512–522 conserve les contrôles bytes et UTF8 ; les documents métier passent toujours par strictJson (documentBytes368, stored.content450, run1303). Le binder1099–1114 lie l'ensemble exact des codecBytes aux pins attendus et refuse extra/dupliqué/absent. Cette lecture ciblée n'est pas une revue complète du candidat ; la QA indépendante vérifiera les comportements requis sur sa version finale.

Retirer la réinterprétation stricte ajoutée aux seuls sourceBytes n'assouplit pas les doublons/BOM/surrogates des documents métier et n'accorde aucun droit d'évaluer un codec fourni. Les fixtures restent des sources synthétiques indépendantes, pas des sorties producteur converties en golden.

## Résultats effectivement lus

- author04 projection : exit0,2PASS/0FAIL/18assertions.
- author05 prepare : exit1,1PASS/2FAIL ; author06 envelope : exit1,5PASS/7FAIL ; author07 prepare : exit1,1PASS/2FAIL. Rouges conservés, pas présentés tous comme défauts produit (fixtures et survalidation distinguées).
- author08 all, plus récent que le message worker : **exit0,17PASS/0FAIL/85assertions**, trois fichiers. Ce sont les tests auteur exécutés sur cette composition, pas une preuve exhaustive des clauses ni la QA API indépendante.

Ledger courant :6tests/12,2typings/4,7305ms cumulés, runner non bloqué. Typing final S1 non acquis (les deux anciens typings étaient rouges). Continuer les contrôles affectés et la livraison exacte dans le budget restant ; aucun compteur réinitialisé.

## Limites

Pas de nouveau framework ou parseur de langage schema exigé. Aucun support RO/canonique modifié, aucun rejeu numeric/planner qualifié. Trois checks consolidés M2 NON EXÉCUTÉS. Candidat auteur en cours, pas d'acceptation S1/intégration/M2 ni de Git final.
