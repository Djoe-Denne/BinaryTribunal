# M2 — 80 : revue source acceptée, contrôles réels des réservations

## État et décision

La revue indépendante79 rend **PRÊT_FIXTURE** sur source78 (3e8ed7f7…). Le défaut R1 est fermé statiquement : audit de chaque image complète outbox/SPENT/événement avant reprise ou nouvelle consommation. L'impact sur les états postérieurs, BURNED, l'histoire des sources révoquées et les imports a été examiné ; les constats inchangés77 ont été réutilisés. Aucun nouveau bloquant statique identifié.

Accepter cette gate source et autoriser maintenant le paquet ciblé ci-dessous. Il doit observer la compilation, la nouvelle origine S1 et les comportements SQL ; aucun de ces résultats n'est présumé acquis. Pas d'approbation utilisateur supplémentaire requise pour ces contrôles déjà dans M2.

## Contrôles fermés et ordre

1. Une invocation de typing ciblé,60s maximum, sur les quatre modules S2 et les deux fichiers de tests atomic/resource et leurs imports transitifs, y compris les nouvelles entrées synthétiques.
2. Seulement si vert : une invocation Bun exécutant **les deux fichiers** atomic-admission.test.ts et resource-admission.test.ts,90s maximum, concurrence1,10s/test.

Deux invocations maximum,150s cumulées, aucun retry ou modification intermédiaire. Les 14 scénarios historiques sont affectés par les nouvelles préconditions/claims/events ; leur rejeu est donc justifié par le delta et non par un nouveau reviewer. Les45cas ressources et le nouveau scénario à quatre variantes sont à observer réellement ; compter les résultats effectifs, jamais leurs seuls titres. Un SKIP ne vaut pas PASS et empêche l'acceptation du paquet prévu.

Une erreur de typing bloque le runtime : aucune base n'est créée. Un échec/timeout/signal ferme ce paquet ; conserver la cause exacte et les résultats partiels. Une précondition de fixture non atteinte ne prouve pas le comportement en aval. Aucun retry automatique ni utilisation des places du budget240s précédemment proposé. Paquets66/72 restent clos.

## Sources et isolation

Le contrôleur parent réutilise le mécanisme fini existant de pins, environnement fermé, timeout et reçus. Source78/manifeste,309sources, anciens contrôles, helper/body65/inputS1, entrées corrigées et nouveaux contrôles sont vérifiés avant/après ; même sourceSet entre les deux invocations. Aucun produit importé par le contrôleur lui-même. Pas nouveau framework ou nouvel oracle.

Parent réserve avant runtime un répertoire neuf exclusif evidence/s2-resource-78/owned-databases et le namespace fini s2-author-1..128.db avec compagnons SQLite. Les chemins sont consignés avant création ; le test exige FF8_S2_FIXTURE_DIRECTORY et n'a pas de fallback. Lecture parent fixtures:13–33 : nouvelles origines synthétiques avant seal, chemins persistants par ownedPath, opener sur ces seuls chemins. Le négatif R1 altère uniquement sa propre fixture neuve ; les bases73 ne sont jamais réutilisées. Fixtures :memory: de connexion admises, pas des services ou bases existantes.

Inventaire de tous fichiers produits/hash/taille après runtime, rouge compris. Garder les bases, compagnons, logs et reçus ; aucune purge, réparation, migration ou réouverture SQL cachée dans le contrôleur. Réservations inutilisées distinctes des fichiers réellement créés. Aucun fichier inconnu autorisé par défaut.

Bun/TypeScript pinnés, no-env/config Bun vide et HOME/config/temp dédiés ; aucun secret ou option hérité. Les imports de fixtures/input auteur sont les seuls inputs synthétiques qualifiables dans cette invocation. Aucun accès aux oracles QA S1/L7.

## Acceptation et limites

Typing vert, tests prévus réellement exécutés sans fail/skip et sources stables permettraient d'accepter ce complément fixture dans sa portée observée. Le résultat ne prouverait ni un vrai provider, ni S3/public/native, transition/crossgen, publication ou replay S4 global. R sans worker compatible est un refus vérifié attendu, pas une exécution R complète.

000b et S2/M2 restent ouverts jusqu'à leurs autres obligations. Aucun Git/canonique/v6/client/SDK/global, jeu/live/IDA/C# ou nouveau service. Les trois commandes consolidées M2 ne sont pas remplacées par ce paquet ciblé ; leurs résultats restent à obtenir au stade applicable.
