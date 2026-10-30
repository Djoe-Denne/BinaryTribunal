# 57. Primitives natives : collisions explicites et qualification sans exécution de modèle

## Faits vérifiés dans la source épinglée

La qualification a identifié le tag public officiel v2.1.4, commit `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824`. Le parent a vérifié la référence du tag et la version du packagecore, puis capturé cinq fichiers nécessaires et leurs empreintes sans les importer ou les exécuter.

Lectures parent directes :

- Session.create:275–324 retourne la session déjà présente, y compris après une course perdante, sans comparer les nouveaux paramètres. Une réponse existante ne prouve donc pas la fraîcheur ou l'égalité du body demandé.
- Inbox.reconcile/admit:163–210 conserve la première admission correspondant à session/type, sans comparer le nouveau contenu.
- Session.prompt:155–185 peut appeler wake même après rapprochement d'un message existant, sauf si resume:false est explicite.
- Restart:35–61 annonce une reprise **at-least-once** : elle ne promet pas l'absence d'effets externes répétés après crash.

Ces faits empêchent de qualifier naïvement l'API comme « exactement une fois ». L'adaptateur devra vérifier ses propres images et collisions et garder les ambiguïtés, non s'appuyer seulement sur les IDs optionnels.

## Identité actuelle du service

Le parent a aussi lié la réponse2.1.4 au processus existant et au fichier exécutable présent, sans lire sa ligne de commande, ses credentials ou sa mémoire. L'empreinte du fichier est conservée ; le même PID/version est retrouvé après lecture. Cela identifie l'exécutable observé, pas une correspondance de compilation prouvée avec le tag.

La requête publique de métadonnées de release GitHub v2.1.4 répond404, alors que la référence de tag répond200 et pointe le commit ci-dessus. Ce404 ne prouve pas l'absence générale d'artefact publié ; aucun fichier binaire n'est téléchargé ou installé pour contourner cette inconnue.

## Étape suivante autorisée par le parent : canary au repos

Le parent autorise une qualification native **bornée aux enregistrements**, nécessaire pour vérifier ces primitives sur le service actuel :

1. Une seule session neuve, choisie par un ID réservé avant effet, avec modèle du catalogue approuvé, profil existant, permissions deny-all et sans parent.
2. Relecture et double création identique puis divergente sous le même ID ; aucun nouveau nom et aucune réparation d'attributs.
3. Un seul message de qualification synthétique, sans contenu RE, admis avec ID retenu et **resume:false** ; doublon identique/divergent sous cet ID, toujours sans reprise.
4. Relecture de la file et vérification qu'aucun message assistant n'est observé. Aucun wake, prompt avec resume:true, outil de worker, stop/interrupt ou invocation du bridgeRMS non qualifié.

Le plan, les IDs et les bodies exacts seront écrits dans les preuves parent **avant les POST**. Les réponses ne seront pas conservées brutes : seulement attributs vérifiés, empreintes et statuts des données de ce canary possédé. Pas de lecture de sessions étrangères, héritage de contexte, ouverture de base partagée ou suppression des enregistrements après test.

Cette étape teste les primitives d'admission natives **sans lancer de travail de modèle**. Ce n'est ni un worker scientifique ni une origine générationRMS ; aucun compteur d'origine n'est créé, copié ou remis à zéro. Elle ne contourne pas le catalogue : les attributs de modèle sont des données de création parmi les références déjà approuvées et aucune exécution n'est demandée. Les anciennes gardes natives RMS restent fermées.

Toute erreur d'autorisation, collision préalable, changement de serveur, attribut inattendu ou apparition d'une exécution non demandée arrête cette qualification, conserve le plan et les IDs, sans nouveau retry ni élargissement de droits. Dix minutes maximum pour l'ensemble de ce canary, requêtes courtes bornées. Il n'installe aucun service et ne constitue pas un nouveau harnais d'exécution général.

## Limites et suite

Un résultat conforme établira des comportements d'enregistrement/collision observés, pas la terminaison, les droits exercés par un worker, le fencing natif d'une requête en transit ou l'exécution unique après crash. Ces obligations restent distinctes. Un enregistrement divergent silencieusement réutilisé sera consigné comme limite native à compenser, pas comme succès de détection par le serveur.

À réception, arrêter le contrat d'adaptateur versionné et ses refus sur ces observations. Pas de nouveau service global ou de remplissage automatique des références de qualification actuellement nulles. Aucune nouvelle autorisation utilisateur n'est sollicitée pour ce petit contrôle nécessaire dans le mandat ; les arrêts HOLD125/diagnostic gelé/quatreorigines/science/liveFF8 restent inchangés.

## Preuves et recherche

- `../evidence/public-core-v2.1.4-r1/manifest.json` et cinq sources capturées, non exécutées.
- `../evidence/native-service-identity-r1.json` : exécutable présent SHA256 `404110f618d557de383044de86aafb1126bd69fdc312c5a3e6e7aba137568e3c`, version rapportée2.1.4. Ne pas confondre avec le SDK2.0.26 ou le pluginEnsemble épinglé séparément.
- Finale de qualification `msg_187b1d707001M9AhCD2jyzl9q1`, texte SHA256 `ea35fdd5884c7cf988dcd3b3c2225c1d7f5aa0005635ad1547c1044f3f7031e2`, bundle natif de la session originale qualification-runtime r2. Aucune mutation ou test effectué par ce worker.
- Les schémas du serveur courant confirment Session.ID pattern ^ses, Message.ID pattern ^msg_, les règles de permission action/resource/effect et la réponse de prompt Session.Inbox.User. Ils ne prouvent pas à eux seuls le comportement du canary.
