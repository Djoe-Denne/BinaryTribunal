# 180. Sélection ciblée d'une version peer compatible

## Décision parent avant nouvelle résolution

Le verrou179 reste conservé, non reçu pour acquisition. Le conflit est localisé à une dépendance imbriquée : platform-node4.0.1 admet platform-node-shared^4.0.1 ; le resolver a choisi4.1.0, qui exige Effect^4.1.0 alors que le projet utilise4.0.1.

Le parent retient un **nouveau candidat de métadonnées** avec une sélection transitive ciblée shared4.0.1 sous platform-node4.0.1. Cette version respecte la plage publiée et déclare un peer Effect^4.0.1. Il ne s'agit ni de changer les contraintes publiées ni de forcer un peer incompatible. Le choix sera visible dans overrides du nouveau package.json, pas caché dans l'ancien verrou.

La résolution utilise npm standard en mode offline, strict-peer-deps, package-lock-only et ignore-scripts. Le cache public possédé179 est réutilisé ; les nouveaux fichiers et logs vont dans un namespace180 neuf. Si le cache est insuffisant ou les peers restent incohérents, la commande refuse et conserve son état. Aucun retry permissif ni réseau implicite.

## Critères fermés de cette phase

Sortie0, aucune installation node_modules, aucun avertissement ERESOLVE, racines exactes et uniquement shared4.0.1 dans le graphe ; URL du registre et intégrités présentes. Le verrou179 et son descripteur ne sont pas modifiés. Le nouveau verrou n'autorise pas encore une acquisition ou un démarrage.

## Engines et choix de runtime distincts

Node24.11.1 sert seulement à exécuter npm ; l'avertissement Node>=26.4.0 de opentui ne sera pas masqué. Aucun code du paquet n'est exécuté sous Node à cette phase.

Le parent ne retient pas un téléchargement de Bun1.4.4 par principe. Les seules plages Bun déclarées dans le verrou179 sont >=1.0.0 pour fff-bun/bun-pty et >=1.3.14 pour opentui. Le Bun1.4.2 déjà installé satisfait ces déclarations ; il reste donc le candidat minimal à qualifier avant bootstrap, pas un runtime déjà déclaré compatible. Le packageManager source1.4.4 ne constitue pas, seul, une exigence moteur universelle. Toute incompatibilité réelle sera traitée avant effet natif, sans upgrade globale implicite.

## Autres gates conservées

Le poids, les fichiers natifs/WASM Windows réellement acquis, la provenance, le cycle de vie et la fermeture d'accès restent nécessaires avant lancement. Les sélections utilisent os/cpu, pas les noms seuls ; le paquet FFI ia32 annonçant aussi x64 ne sera pas ignoré dans les mesures.

Aucun npm ci, script lifecycle, build natif, import applicatif, listener, session ou modèle n'est autorisé ici. L'ACK170, l'origine déjà comptée et les droits expirés sont inchangés.

## Résolution et revue réellement reçues

La nouvelle résolution offline/strict-peer réussit en4,208s :429entrées, shared4.0.1 seul, Effect4.0.1, aucun avertissement ERESOLVE. Le verrou179 reste identique ; node_modules est toujours absent. L'avertissement EBADENGINE Node26 est conservé, pas masqué.

L'avis indépendant result_mvv10mi8_000f_csezgx (message msg_18d0f82e9001sGpkQczQ7yCMv7) confirme que seul le shared4.1.0 imbriqué a disparu : aucun ajout ni autre résolution/SRI modifié. Le choix respecte réellement les plages et peers. La gate de métadonnées180 est reçue dans cette portée, sans accepter le runtime ou l'acquisition par elle seule.

## Inventaire de plateforme partiel, non converti en mesure complète

Un inventaire distinct a lu uniquement les métadonnées du cache possédé, sans réseau ni import applicatif.429entrées verrouillées,381compatibles os/cpu Windows x64 ;366ont une taille décompressée publiée, somme331942306octets. Quinze versions anciennes ne publient pas ce champ. Le script a donc retourné sortie1 et conservé un inventaire **partiel**, pas un total complet ni une taille installée prouvée.

Les sept paquets optionnels Windows retenus par leurs champs comprennent aussi ffi-rs-win32-ia32-msvc, qui annonce cpu x64/ia32. Leur nom seul ne pilote pas la sélection. Le reçu platform-metadata-inventory.json sous le namespace180 contient204109octets/SHA694a9d8cc291e0d0d21bd89bac68c2a3a92013a95eb15c24c601c02d94611f82. Ces données serviront à mesurer l'acquisition réelle, pas à déclarer ses assets utilisables.
