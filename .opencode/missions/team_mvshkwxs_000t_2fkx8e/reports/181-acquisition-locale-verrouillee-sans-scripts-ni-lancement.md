# 181. Acquisition locale verrouillée, sans scripts ni lancement

## Décision et portée explicite

Le parent autorise maintenant **l'acquisition réseau et l'installation de fichiers dans le seul namespace temporaire180**, via npm ci sur le couple package.json/lock180 reçus. C'est une phase distincte de la résolution179–180, déclarée avant exécution. Aucun composant applicatif ne sera importé ou lancé.

Le conflit peer est corrigé et revu indépendamment. Les archives attendues sont épinglées par429SRI, avec URL du registre public. La sélection sera celle de npm pour Windows x64, sans suppression des optional indispensables et sans scripts lifecycle. Aucun changement des installations globales ou du serveur desktop.

## Commande et conditions

npm ci --ignore-scripts --strict-peer-deps --no-audit --no-fund --omit=dev --os=win32 --cpu=x64, registre/cache/configurations propres ou cache public possédé179. Le sous-processus reçoit l'environnement réduit déjà utilisé, sans token, proxy authentifié, NODE_OPTIONS ou configuration npm utilisateur héritée. Les versions et hashes des outils et les pins de l'entrée sont revérifiés avant appel.

Une invocation au plus,120secondes, sans retry permissif. Refus, timeout ou erreur : état conservé, pas de lancement. Un script ou build natif nécessaire ne sera pas exécuté en fallback. Aucun force ou legacy-peer-deps. Le lock180 doit rester byte-identique après acquisition.

## Poids et limites honnêtes

L'inventaire annonce331942306octets pour366entrées compatibles, avec15tailles absentes et des optional dont l'installation réelle reste à observer. Cette somme n'est pas un total réseau ou disque garanti. Le disque dispose d'environ72Go lors du préflight, pas une réservation.

Le parent fixe une condition d'acceptation après acquisition : croissance combinée des fichiers node_modules et du cache possédé inférieure ou égale à1Gio. **C'est une mesure après commande, pas un quota disque dur pendant l'extraction.** La borne de temps et le namespace isolé limitent l'opération ; tout dépassement bloque la réception et le bootstrap, en préservant les fichiers. Pas de copie de la base globale.

## Gate avant tout import ou listener

Après acquisition : mesurer les fichiers, vérifier pins/versions, archives réellement reçues et actifs Windows/WASM nécessaires sans les charger ; établir la fermeture de provenance et les limites. Le Bun1.4.2 existant reste candidat, non qualifié. L'EBADENGINE Node26 connu sera conservé : l'outil npm fonctionne sous Node24, sans exécuter les paquets, et cela ne prouve pas leur compatibilité runtime.

Un avis indépendant ciblé des assets et de la provenance précédera toute réalisation/exécution de bootstrap. Aucune session canary, requête de modèle, origine RMS ou autorité n'est créée par cette acquisition. Les champs de provenance du desktop158 ne seront pas copiés comme certificat du futur hôte.

## Résultat réel de l'acquisition

L'unique npm ci réussit en9,330s. Le verrou reste identique et aucun avertissement peer ne subsiste ; l'EBADENGINE connu est conservé. Les métadonnées des cinq racines installées correspondent aux versions attendues.

node_modules contient32227fichiers,332635368octets et aucun lien recensé. Le cache possédé passe de438051211 à501735063octets ; la croissance combinée mesurée vaut396319220octets, sous la condition d'acceptation1Gio. Cette mesure reste postérieure à la commande, pas un quota dur qui aurait été appliqué pendant son exécution.

Le reçu acquisition-receipt.json sous le namespace180 porte FILES_ACQUIRED_ONLY_NATIVE_ASSET_AND_BOOT_GATES_PENDING. Aucun code des paquets, script lifecycle, build natif, serveur ou modèle n'est lancé. L'audit statique des actifs réels et la capture de provenance sont les prochaines gates, pas une qualification implicite de chargement.
