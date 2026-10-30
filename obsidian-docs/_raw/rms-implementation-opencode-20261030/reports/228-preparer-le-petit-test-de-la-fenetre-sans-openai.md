# 228. Préparer le petit test de la fenêtre sans OpenAI

## But et portée

La syntaxe des deux fichiers d'interface passe227 ; leur comportement Windows reste à vérifier avant de recevoir un vrai code de connexion. Le parent prépare un seul script ponctuel de qualification sous `private-ui-qualification-228/`. Il utilise le relais candidat et un enfant Bun factice, pas RMS, son compte, sa base ou son serveur. Aucun appel OpenAI ou clic navigateur.

Deux scénarios bornés sont prévus : deux probes et livraison d'un code explicitement factice ; puis réutilisation volontaire d'un nonce pour vérifier le refus sans accusé de réception supplémentaire. Chaque scénario crée uniquement sa fenêtre possédée et son petit enfant de test. Leur sortie et leur fermeture doivent être réellement reçues ; le silence ou une demande de kill ne comptent pas comme fin observée.

Le script ne capture pas les messages privés de l'interface. Il conserve seulement statuts, compteurs et observations publiques du test. Il n'a aucun token ou code OpenAI réel ; le code factice ne doit pas être utilisé pour se connecter. Une fenêtre de test ne prouvera pas le raccord de la vraie invocation RMS, ni les ACL du futur dossier de credentials.

## Contrôles et limites

Le parent écrit le script, contrôle sa syntaxe sans exécution et demande la revue ciblée de son attribution et de ses bornes. Aucun lancement natif n'est autorisé avant réception de la revue des deux candidats d'interface et du dispositif de test. Les argv, pins, environnement et durée maximale seront fermés avant chaque commande réelle ; aucune réutilisation aveugle du receiver219, aucune suite générale ou diagnostic gelé.

Le dispositif est limité à ce seul test des deux nouveaux fichiers ; pas de nouveau framework, service, navigateur automatisé ou infrastructure générale. Les preuves227 et les QA produit précédentes sont réutilisées dans leur portée sans être rejouées. Le correctif d'enveloppe226 reste soumis à sa propre revue, et la vraie connexion reste fermée.

## Candidat de qualification et syntaxe

Le script ponctuel est écrit : `private-ui-qualification-228/qualify-private-ui-v1.mjs`,7964octets, SHA256 `8fa5b7982ac22d305ab3a09879e5e84e3052583e0bd94dce3b932564928e9196`. Sa syntaxe passe par Node --check en38ms, sans évaluation. Il utilise des fenêtres possédées, enfant Bun stdlib, données factices et sorties de compteurs seulement ; trois ACK attendus au positif, un seul puis refus au nonce dupliqué. Son résultat exige aussi les sorties réellement observées de l'enfant et de la fenêtre. Budget45secondes par scénario, avant garde extérieure distincte, sans retry si le reçu existe.

Le reviewer reçoit les trois fichiers interface/qualificateur, les pins et leurs contrats pour une lecture bornée avant lancement. Le contrôle extérieur réutilisera le mécanisme ProcessStartInfo à environnement fermé déjà qualifié, avec nouveaux argv et pins fixes, sans modifier les scripts219. Aucun candidat n'a encore été exécuté. Le correctif226 est désormais reçu séparément ; cela ne qualifie pas cette interface.

## Lanceur natif extérieur préparé

Le lanceur ponctuel est également écrit : `private-ui-qualification-228/launch-native-private-ui-v1.ps1`,5094octets, SHA256 `66880718a3c3b685121ec9161787e07100f12a362782c5e15c8007395025f4d7`. Il sélectionne uniquement positive ou duplicate et vérifie les pins du test, des deux fichiers UI et de Bun. Un marqueur d'essai neuf est écrit avant lancement ; aucune relance automatique. ProcessStartInfo conserve l'environnement fermé, les attentes et drains bornés du mécanisme déjà reçu219. Un contrôle syntaxique sans évaluation passe en28ms ; les cinq appels Wait/WaitForExit ont chacun une borne explicite.

Le statut de processus extérieur exige une sortie0, fermeture, drains et pins après ; il ne suffit pas à recevoir le test ou une connexion. Le FINALOUTCOME du test doit aussi prouver ses observations précises. Le reviewer reçoit ce complément pour contrôler les seules frontières affectées. Aucun processus ou fenêtre n'est encore lancé.
