# 184. Plan de qualification isolée sans session, en revue

## Objectif et état

Préparer une qualification de l'hôte local acquis, sans créer de session ni appeler un modèle. Le constructeur a livré un plan utilisant uniquement l'API publique du serveur et les dépendances déjà épinglées. Le parent le soumet à une revue ciblée avant réalisation. **Aucun bootstrap, import applicatif ou listener n'est encore autorisé.**

La phase proposée est bornée à120secondes au total : import, démarrage, lectures limitées et arrêt. Elle utiliserait un environnement non hérité, une base neuve, des répertoires propres et un secret transmis par canal privé, jamais dans les arguments ou les rapports. Le lifecycle serait omis pour éviter les démarrages explicites de reprise et de planification. Aucune découverte globale ou inscription de service n'est nécessaire à cette phase.

## Points à fermer avant réalisation

- Valider les options exactes du paquet publié, les configurations découvertes et les effets d'initialisation. Désactiver le téléchargement des modèles ne vaut pas pare-feu sortant universel.
- Définir la politique de lecture limitée aux chemins exacts d'information et de schéma, sans ouvrir les exceptions de pairing ou de tickets natifs. Le mot de passe seul ne ferme pas ces routes.
- Prévoir l'arrêt par interruption du scope possédé, puis attente de fin du processus. Le champ shutdown retourné est une attente, pas une commande d'arrêt.
- Définir les preuves de chargement réellement nécessaires : certains échecs DLL sont absorbés ; une fin d'import sans exception ne suffirait pas à les déclarer réussis.
- Ratifier la provenance du nouvel hôte npm : archive serveur réellement reçue, fermeture des dépendances et fichiers, binaire Bun et futur bootstrap distincts. Ne pas transférer les qualifications du desktop.

## Correction du contrat HTTP proposée par le parent

La lecture directe de `effect/dist/http/HttpMiddleware.js:326–335` montre que le middleware CORS répond204 aux requêtes OPTIONS avant d'appeler l'application enveloppée. La promesse initiale « toute méthode autre que GET est refusée » serait donc inexacte avec ce montage public.

Le parent propose de déclarer cette réponse sans transfert applicatif et de fermer les routes applicatives mutantes, plutôt que d'ajouter un proxy ou modifier le noyau pour supprimer un preflight sans effet métier. Cette distinction est transmise à la revue ; aucun test de comportement n'est compté exécuté. Les variantes de chemins, upgrades, autres méthodes et limites de corps restent à préciser dans le contrat exécutable.

## Preuves et limites

- Plan auteur : `PLAN_ONLY_BOOTSTRAP180_QUALIFICATION_NO_SESSION_120S_CONDITIONAL_NOT_IMPLEMENTED`, sources du paquet installé citées, aucune réalisation déclarée.
- Parent : lecture déjà corroborée de `@opencode/server/dist/process.js:92–142,176–184`, puis lecture ciblée du traitement OPTIONS ci-dessus.
- Avis statique182 favorable réutilisé, sans rejouer l'audit, npm ou les tests acquis. Il ne qualifie pas le runtime.
- Les120secondes sont une borne proposée pour cette qualification, pas une exécution déjà autorisée ou réussie. Aucun nouvel octet de bootstrap écrit, aucune session, origine ou requête fournisseur. Le parcours D5 et M2 reste ouvert.

## Complément final du plan reçu

Le constructeur a terminé la préparation. Il propose une comparaison de la cible HTTP brute `originalUrl`, avant toute normalisation, avec les deux chemins exacts. Les URL absolues, encodages équivalents, requêtes avec query, variantes de slash, corps et demandes d'upgrade ne seraient pas admis par cette politique. La réponse OPTIONS204 native reste déclarée séparément.

Le parent a aussi relu `@opencode/server/dist/options.js:6–36` : les options serveur proposées existent, notamment events.persist, les choix fs et les chemins de configuration ; **config.content est une chaîne**, pas directement un objet JSON. Le contenu de configuration doit encore être vérifié selon son propre schéma. Cette lecture statique n'importe pas le module.

Le plan identifie les chemins connus de récupération des modèles, des origines well-known et des plugins. Il ne prétend ni pare-feu universel ni audit exhaustif de tous les initialiseurs. Les ancrages finaux sont transmis à la revue pour décider si un effet de bootstrap non permis reste atteignable dans le scénario borné. L'auteur reste arrêté après son plan ; aucun nouveau chantier ni nouvel audit général n'est demandé.

La qualification éventuelle doit rester distincte de la future admission RMS : même si ces deux lectures et l'arrêt réussissent, aucune route de session, prompt ou publication ne sera ouverte implicitement. Le plan d'implémentation puis les commandes et oracles exacts devront être retenus avant exécution.

## Oracle de chargement précisé

L'amendement final de l'auteur sépare correctement la qualification HTTP du chargement de chaque composant natif. Le parent retient ce principe pour le contrat : capturer stdout et stderr attribuables au processus, mais conserver `nativeLoadEvidence=UNPROVEN` sans preuve positive autorisée. Des journaux vides, exit0 ou HTTP ready ne transformeront pas cette inconnue en PASS.

Une erreur native sur un chemin requis par la qualification bloquera sa réception. Un composant non requis gardera sa limite explicite, sans ajouter une exécution PTY ou un audit global des ABI. La borne reste120secondes au total. Cet amendement clôt la préparation de l'auteur ; il n'autorise pas l'import natif ni la réalisation, toujours dépendants de la revue du plan.

Référence finale de préparation : `result_mvv256ob_009n_dv4rmd`, message `msg_18d2d28c8001BFJkzQDPL6HbDh`. Elle confirme les choix déjà consignés, sans nouveau code ou effet. Le parent retient le livrable comme plan soumis à revue, pas comme validation du bootstrap.
