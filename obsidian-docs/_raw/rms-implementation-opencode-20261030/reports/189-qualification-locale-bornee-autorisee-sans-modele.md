# 189. Qualification locale bornée autorisée, sans modèle

## Décision parent

La reprise de revue lève les deux défauts de capture sur le candidat corrigé, sans nouveau bloquant dans ce delta. Le parent accepte cette correction et les preuves réutilisées du plan et du code. Il autorise maintenant **une seule invocation** du runner épinglé, avec son plan corrigé.

Cette autorisation couvre explicitement les imports applicatifs et leurs effets natifs précoces connus, la création d'une base et de répertoires neufs dans le namespace possédé, l'ouverture temporaire du listener loopback et les quatorze contrôles HTTP fermés. Elle n'autorise ni session, prompt, modèle, provider, installation de dépendance, script lifecycle ou modification du desktop.

## Commande et bornes

Depuis le namespace180, le Node épinglé exécute `run-host.mjs` avec pour seul argument le SHA256 du plan `b4b7af49c367e8cb53b2edc16f4cc77f11d7ee029f05d4854e09c4dce6c43e00`. Le parent fournit un environnement réduit au runner ; celui-ci établit l'environnement enfant et vérifie les pins et la fermeture avant l'import.

Le budget total du runner est120secondes : annulation du travail à105s, secours limité à son enfant possédé à115s, borne totale120s. Aucun arrêt par port, processus tiers ou service desktop. Le temps JavaScript et les E/S synchrones ne sont pas présentés comme une garantie temps réel dure. Une fermeture incertaine impose HOLD et une intervention strictement attribuée, pas une preuve inventée.

## Contrôles fermés et refus

Deux lectures positives authentifiées : info et schéma ; une lecture info sans secret attend401. Les autres contrôles portent sur cibles encodée, absolue, query vide, double slash, dot segment, slash final, fragment, HEAD et GET avec corps ou transfer-encoding, attendus refusés. Le preflight OPTIONS204 est explicitement attendu sans dispatch métier. Les plafonds de corps et délais par requête sont ceux du plan épinglé. Aucun POST ou upgrade actif n'est envoyé.

La réussite de ces contrôles ne qualifiera pas les chargements natifs sans preuve positive distincte. Des erreurs de chargement, d'authentification, de capture ou d'arrêt bloqueront la réception appropriée. Un refus de l'allowlist ou une incompatibilité IPC/Bun reste un résultat à conserver, sans correction ou relance automatique.

## Provenance et décision de revue

- Runner20993octets/SHA `5e612e34df6cee059e31cde665c6f050e60a75298a649f13c21d242b987fcb3c`, plan13968octets/pin ci-dessus, bootstrap inchangé56c54141.
- Avis `result_mvv3576l_0000_zgfxa0`, message `msg_18d464bb9001zkNOBl0c5CivXH` : deux bloquants levés après lecture du delta ; aucune exécution reviewer. Syntaxe31ms et dix contrôles mémoire2ms réutilisés, non rejoués.
- La garde HTTP, les options et les chemins d'initialisation ciblés sont reçus dans le scénario borné, pas comme garantie universelle zéro-egress. Aucun mécanisme d'acquisition n'est autorisé durant cette qualification.
- Les preuves npm182, la fermeture32k fichiers et les identités Node/Bun sont distinctes de la provenance desktop158 et de toute équivalence mémoire.

Le résultat réel sera consigné même en échec. Aucune origine RMS n'est implicitement ajoutée ou remise à zéro par cet hôte technique. La qualification pré-modèle ne ratifie pas une custody de sessions futures, un résultat scientifique, D5 ou l'acceptation M2.
