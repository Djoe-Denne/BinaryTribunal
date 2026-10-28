# M2 — 133 : régressions vertes, vérifier le filtre sans lancer de thread

## Résultat132 observé

**131PASS/0FAIL,880assertions**, aucun cas ignoré signalé, cinq fichiers historiques réellement exécutés sur source128. Une invocation161086ms, zéro retry/timeout/signal, sources stables au même sourceSet que typing130. Paquet132 clos vert. Reçus/logs/inventaires vérifiés.

143DB/528142336octets et44casesassets/132entrées/44fichiers neufs :0unowned/0hashdrift, manifest inchangé, processus terminé. Artefacts conservés, aucune réouvertureSQL de diagnostic ou cleanup. Cela qualifie la non-régression du lotA, pas les tests du remplacement encore non lancés ni la contention.

## Condition avant lotB

Les47cas sans thread partagent un fichier avec3cas sous HOLD125. La partition source et l'absence de lancement à l'import sont établies par la préparationRO131 ; il reste à observer que le Bun pinné applique bien le filtre proposé, y compris test.each. Une sélection supposée ne suffit pas pour autoriser ce fichier tant que le lancement thread est interdit.

Autoriser un **minuscule canary local de filtre**, pas un framework : un fichier autonome sans import produit, filesystem, DB, asset, worker ou provider. Un test sûr doit passer ; les trois noms exacts HOLD sont reproduits avec des corps qui échoueraient immédiatement s'ils étaient exécutés, sans aucun lancement. Les deux variantes each gardent le template exact du test source. Le filtre est `^replacement (?!two genuinely overlapping |contender ).+$`.

Une invocation Bun test,10s maximum, zéro retry, environnement neuf isolé/no-env/configvide, même Bun pinné. Exiger exactement1PASS et3exclus/non exécutés ; aucune exécution d'un corps interdit, aucune erreur de parsing. Les3exclus ne sont jamais PASS. Conserver source du canary, commande/env/logs/reçu/hash. Un échec ferme la sonde et bloque lotB ; pas d'adaptation du produit ou du filtre en boucle implicite.

Cette sonde vérifie le runner et le filtre uniquement ; ses résultats ne sont pas des tests produit ou une preuve anti-orphelin. Aucun thread ne peut être créé par ce canary. Elle ne lance ni n'autorise encore lotB ; un gate séparé sera fermé après résultat. Aucun nouveau runner/preload/hook/framework, confinement ou droit global.

## Preuves et limites

Reçu132 SHA7f9053c74507e093bdf6cf4ba559f7a33b53e2c9de8eebc72a8a96603369770b ; inventaireDBb92f1b8a… etassets53eac629… . Evidence s2-replacement-128-baseline. Les3tests thread réels restent HOLD125/non exécutés, aucune garantie native levée. Les trois commandes consolidées restent non lancées ; S2/M2/remplacement/S1concret/contention restent ouverts.
