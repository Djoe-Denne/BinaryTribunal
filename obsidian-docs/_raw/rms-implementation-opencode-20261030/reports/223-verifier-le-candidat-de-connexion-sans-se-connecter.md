# 223. Vérifier le candidat de connexion sans se connecter

## Objectif et livraison

Le petit essai avec les données IDA exige encore une connexion OpenAI et une voie d'envoi autorisée. Le candidat reçu réalise seulement la première partie logicielle : connexion au compte existant, sans mission, modèle ou nouveau crédit RMS. Le parent a recalculé les huit empreintes annoncées : elles correspondent. La livraison n'est pas encore acceptée ni déployée.

Le delta touche les six sources/tests autorisés et les deux candidats bootstrap/plan sous le dossier de mission. Les différences ont été localisées par comparaison avec la baseline222. La connexion et ses nouveaux fichiers restent distincts de la preuve historique219.

## Contrôles fermés avant exécution

Le parent autorise depuis le harness candidat198 :

1. `bun run typecheck`.
2. `bun test test/client.test.ts --test-name-pattern` avec l'alternative ancrée des cinq noms Auth OFFLINE livrés.
3. `bun test test/runtime-binding.test.ts --test-name-pattern` avec l'alternative ancrée des quatre noms Auth livrés.

Les noms exacts, arguments, huit pins, durées et sorties seront conservés dans `qa-owned-auth-223`. Chaque invocation est limitée à dix minutes, sans retry automatique. Critères : sortie0, exactement cinq puis quatre tests attendus, zéro échec et zéro timeout. Les cas filtrés sont non exécutés, jamais comptés PASS. Un échec arrête cette sélection ; pas de suite globale, HOLD125, diagnostic gelé, quatrième origine ou test scientifique.

Le parent a lu les neuf corps, leurs imports et le helper partagé. Les tests client utilisent une base temporaire OFFLINE, un transport simulé et des callbacks refusant les routes scientifiques ; ils ne démarrent pas de travail natif. Le test de faux objets remplace fetch et exige zéro appel. Les quatre tests binding sont des données et horloges simulées. Le MAIN du client est protégé par import.meta.main ; les commandes de connexion ne s'exécutent pas par import. Aucun import du bootstrap natif n'est autorisé par ces tests.

## Revue et limites

Une revue indépendante du delta est engagée en parallèle sur les risques requis : autorité parent et comparaisons atomiques, claim unique avant effet, réponse perdue/reprise, révocation/expiration, routes et corps exacts, séparation Auth/lecture/travail, confidentialité et fermeture bornée. Elle ne rejoue pas les tests et ne refait pas la qualification219. Les preuves valides sont réutilisées pour les frontières inchangées ; les effets du delta restent à contrôler.

Le relais privé vers l'interface utilisateur n'est pas fourni par les huit fichiers. Il reste indispensable avant toute connexion native, ainsi que la vérification des droits d'accès Windows du dossier privé. Aucun callback simulé, permission Unix 0700 ou résultat de test ne suffira à prouver ces propriétés. Le parent doit encore réaliser ce raccord limité après réception du code ; aucun nouveau service d'interface n'est décidé ici.

Les nouveaux logs Auth jetés ne sont pas des captures exactes : leur contenu ou l'absence d'erreur ne sera pas déduit de leurs compteurs. La base native d'authentification ne doit être ni copiée, ni hashée intégralement, ni ingérée. Aucun challenge ou token réel n'existe dans cette QA.

## Localisation, impact et preuves

- Candidat : `C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-runtime-readonly-198/tools/ff8-harness` ; baseline : `qa-owned-runtime-218/baseline-before-auth-222`.
- Client : hunks494–563,856–1070 et MAIN1308 ; transport85–128 ; binding48–131 ; GraphStore784–849 ; nouveaux tests client382–467 et binding26–105.
- Candidats non déployés : `auth-bootstrap-222/bootstrap-auth-v1.mjs` et `host-plan-auth-v1.json`.
- Pins abrégés : client617c934d, transportfeb9338e, bindingc911682c, GraphStore8969c150, testclientc64568d2, testbinding9854011a, bootstrap398a184a, plan2fdeb0e5 ; pins complets dans les reçus.
- Serena est confirmé sur la racine commune retro-eng. Le candidat temporaire est hors de cette couverture : lecture et différences des fichiers possédés, aucune réactivation du serveur partagé.

Aucun effet OAuth, session, modèle, entrée IDA ou mutation de la base RMS réelle. L'acceptation du candidat, sa qualification native, le parcours complet et M2 restent ouverts.

## Résultats et changement du candidat après les contrôles

Les contrôles223 ont réellement réussi sur les huit pins initiaux, tous vérifiés avant et après chaque commande :

- Typecheck : sortie0,4058ms.
- Client : cinq tests,80assertions,1153ms de collecte parent ;117cas filtrés non exécutés.
- Binding : quatre tests,71assertions,62ms ;14cas filtrés non exécutés.

Zéro échec ou timeout. Les reçus et logs existent dans `qa-owned-auth-223`. Aucune connexion ou exécution native.

Une lecture ultérieure a constaté quatre fichiers modifiés après ces contrôles : client130278/e8fbc762, transport30130/adaea927, binding39299/7e1333ad et testbinding31445/0ba39ea9. Les deux autres sources/test gardent leurs pins. Le parent demande l'arrêt des éditions, une livraison finale complète et l'explication du delta post-gel ; aucune modification n'est annulée ou acceptée implicitement. La revue est informée de suspendre son acceptation et d'identifier les octets réellement examinés.

Les succès223 restent des preuves historiques du premier gel, **pas des derniers octets**. Les contrôles affectés par le delta final seront rejoués après gel confirmé ; les autres preuves valides ne seront pas répétées par principe. Le raccord utilisateur et l'accès privé Windows restent à fermer avant tout OAuth réel.
