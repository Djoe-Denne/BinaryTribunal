# 185. Plan ratifié : réalisation locale sans exécution

## Décision et conséquence concrète

Préparer l'hôte isolé nécessaire au parcours RMS, sans modifier le serveur desktop. La revue indépendante du plan184 ne relève aucun bloquant supplémentaire dans le scénario fermé. Le parent ratifie cette architecture limitée et autorise **la création du candidat**, pas son lancement.

Le constructeur peut créer exclusivement trois nouveaux fichiers sous le namespace temporaire180 : `bootstrap-host.mjs`, `run-host.mjs`, `host-plan.json`. Aucun paquet, verrou, audit ou preuve existante n'est modifié. Les fichiers seront relus et vérifiés avant toute décision d'exécution. Une difficulté de permission reste une borne à rapporter, pas à contourner.

## Contrat retenu

- Environnement non hérité et chemins propres avant les imports, base native neuve, binaire Bun1.4.2 et entrées réelles épinglés. Pas de secrets fournisseurs ou de configuration externe héritée.
- API publique du serveur, lifecycle omis, sans découverte ou inscription de service. Secret parent par IPC privé, jamais dans les arguments, logs ou reçus.
- Garde sur les cibles HTTP brutes exactes ; deux lectures seulement, authentification conservée, refus des variantes/corps/upgrades. OPTIONS204 déclaré sans dispatch métier.
- Borne totale120secondes incluant démarrage, lectures et arrêt ; interruption du scope public possédé puis attente du processus exact. Pas d'arrêt du desktop, kill par port ou respawn.
- Qualification HTTP séparée de chaque chargement natif. Les erreurs absorbées ne deviennent pas PASS ; sans preuve positive, le chargement reste UNPROVEN. Aucun travail PTY ajouté.
- Nouvelle provenance npm explicitement définie par les octets de l'archive serveur acquise, avec fermeture et binaire distincts ; aucune équivalence mémoire ou copie de qualification158.

## Vérification prévue et limite d'autorisation

Le constructeur ne doit effectuer aucun import applicatif, test, appel API, accès à une base, ouverture de port ou acquisition. Il rend les trois fichiers, leurs pins et la liste finie des contrôles proposés.

Le parent prévoit d'abord des contrôles syntaxiques sans import, puis une lecture du code et une revue indépendante des frontières affectées. Avant un éventuel lancement, les commandes, requêtes et oracles exacts seront fermés. Aucune suite globale, POST de session, session canary, modèle ou nouvelle origine n'est autorisé par ce rapport. Le futur candidat ne doit pas ouvrir implicitement la route métier après sa qualification.

## Preuves et risques résiduels

- Avis `result_mvv26d0h_0002_28j6b0`, message `msg_18d2dbba30010ChUwiwjDjChJ2` : favorable à la réalisation, lecture source seule, aucun test ou effet.
- La revue confirme les deux routes et les chemins réseau ciblés ; aucune acquisition nécessaire au scénario n'a été identifiée. Cela ne constitue ni audit de tous les initialiseurs ni garantie universelle zéro-egress.
- Les preuves statiques182–183 et les contrôles de versions180 restent valides et sont réutilisés. Les effets FFI précoces restent à qualifier dans leurs seules propriétés requises.
- Origine déjà comptée et droits170 expirés inchangés. Résultat scientifique, publication, scénario D5 et acceptation M2 restent ouverts.
