# 201. Typecheck corrigé et sélection offline fermée

## Résultat reçu

Le mock fetch porte maintenant une fonction preconnect elle aussi refusante ; le compteur nul et la restauration du spy sont conservés, sans as-any ou ts-ignore. Le parent a relu ce delta et recalculé les cinq pins du candidat courant.

`bun run typecheck` corrigé réussit sortie0 en4091ms. Les cinq pins ont été vérifiés avant **et après** la commande. L'échec initial4440ms reste conservé séparément, pas transformé rétroactivement en PASS.

Les notifications retardées ont aussi confirmé des deltas de custody199 déjà présents dans la livraison courante : lease_until entier sûr, refus d'une capability abortée et son cas négatif offline. Les pins initiaux200 sont donc historiques ; le reçu corrigé contient les cinq pins réellement vérifiés pour cette nouvelle exécution.

## Autorisation parent : tests fermés, pas suite globale

Le parent autorise, dans le harness candidat épinglé :

1. `bun run test:q1-primitives` : fichier unique generic-target-primitives, fixture JSON et primitives pures, sans imports de processus ou réseau.
2. `bun test test/client.test.ts --test-name-pattern` limité exactement aux deux nouveaux cas RMSN-OWNED-RO et au cas existant d'absence d'issuer/composer public.
3. `bun test test/runtime-binding.test.ts --test-name-pattern` limité exactement aux trois nouveaux cas RMSN-OWNED-RO de provenance, refus et faits de vie.

Les deux regex ancrées sont celles de la livraison gelée et seront conservées avec les argv des reçus. Six cas sont attendus dans ces deux sélections ; tout autre cas filtré sera déclaré non exécuté, jamais compté PASS. Chaque invocation est bornée à dix minutes, sans retry automatique ou élargissement implicite de sélection.

## Contrôle des imports et effets possibles

Le parent a lu les nouveaux corps, les imports et les hooks pertinents. Le fichier client importe le fixture-driver existant, lequel référence worker_threads ; le spawn est dans sqliteContender, non appelé par ces six cas. Sa branche worker est conditionnelle à !isMainThread, et son afterAll retourne immédiatement si aucun fixture n'a été créé. Les cas sélectionnés n'appellent ni ce helper, ni fixture/graphHarness, ni constructeur Store ou GraphStore.

Le client a sa branche CLI sous import.meta.main ; elle n'est pas l'entrée du runner de tests. Les nouveaux cas vérifient des données pures, de faux caps refusés avant FS/DB et un guard de requêtes ; aucun cap positif natif n'est fabriqué. Le spy réseau refuse et est restauré. Ces tests ne qualifient donc pas Bun→Bun, une autorité native ou un chargement DLL.

## Preuves et limites

- Reçu `qa-owned-runtime-200/typecheck-corrected.json` avec les cinq pins et contrôle après commande ; stdout vide, stderr limité à la commande tsc.
- Pins courants : client `c16a51be…`, transport `54d35747…`, binding `42655227…`, tests client `35d881db…`, tests binding `7875999c…` ; les valeurs complètes sont dans le reçu.
- Aucun `bun test` global, HOLD125, thread de contention, diagnostic gelé, quatrième origine, hôte, session ou modèle autorisé.
- La revue du code reçoit ce rattachement courant et continue indépendamment, sans rejouer les tests. Aucun résultat de tests ou de composition native n'est encore déclaré dans ce rapport préparatoire.
