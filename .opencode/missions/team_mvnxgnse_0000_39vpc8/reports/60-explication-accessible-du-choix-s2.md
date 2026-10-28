# Où nous en sommes et quelle décision est nécessaire

## Le but de la mission

Nous construisons l'automatisation d'un travail de recherche sur FF8 : prendre des faits déjà collectés, organiser les fonctions à étudier, préparer des tâches pour les agents, vérifier leurs résultats, conserver la connaissance validée et choisir le travail suivant. Cela doit aussi résister aux interruptions, sans lancer deux fois la même tâche ni redépenser un budget déjà consommé. Il ne s'agit pas ici de lancer le jeu ou le code reconstruit.

## Ce qui est déjà acquis

Les calculs numeric/context ont été qualifiés avec450paires et9régressions. Le composant qui vérifie la cohérence des dossiers de travail a maintenant passé une QA indépendante : vérification des types réussie et107tests runtime réussis, sur une version identifiée. Le parent a vérifié les reçus, fichiers et résultats au rapport55 ; ils ne sont pas à rejouer parce que le serveur a redémarré.

Ce n'est pas encore un système complet intégré. Il reste notamment à enregistrer durablement les droits et budgets d'exécution, assurer la reprise après incident, raccorder le client public et prouver la publication durable des résultats. Les validations globales finales ne sont pas exécutées.

## Le problème concret qui bloque l'étape suivante

Pour chaque tâche, le système doit vérifier une limite de taille **avant de l'autoriser**. Mais il existe deux objets différents :

1. Le dossier scientifique complet : consignes, dossier, contexte, connaissance, propositions, modèle demandé, accès nécessaires et identité attendue du résultat.
2. La requête complète de communication : ce dossier, plus l'adresse du projet, les informations de contrôle et d'authentification, puis l'emballage ajouté par le client réseau.

Le logiciel actuel mesure/enregistre une image d'admission, puis le client ajoute des informations avant l'envoi. On ne peut donc pas affirmer que les octets mesurés sont ceux de toute la requête finale. Les tests DATA acquis ne résolvent pas cette différence.

Il faut choisir ce que signifie exactement la limite avant d'enregistrer des identités et débits durables. Ce n'est pas une question de diminuer les seuils ou de couper le contexte pour faire entrer une tâche.

## Les choix et leurs conséquences

### A. Limiter le dossier scientifique complet — recommandé

Mesurer l'admission entière, qui contient le dossier complet, puis vérifier avant l'envoi que le client n'a ajouté, retiré ou changé aucune information scientifique. Les informations strictement techniques de communication/authentification restent séparées : elles sont contrôlées, mais pas comptées dans ce plafond scientifique. Aucun secret d'authentification n'est stocké ou journalisé pour comparer les requêtes.

Conséquence : on peut avancer sur l'enregistrement et la reprise des tâches avec une règle précise. On garantit la limite du dossier scientifique, **pas celle de toute la requête réseau finale**. Le contrôle avant émission reste à implémenter et tester ; il n'est pas déjà acquis par cet accord. Cette définition est celle que le superviseur recommande parce que le contrat décrit explicitement le body scientifique complet et que le client ajoute séparément l'authentification/protocole.

### B. Limiter toute la requête finale

Inclure aussi l'emballage technique dans le plafond. C'est une garantie différente et plus large sur la taille de la communication. Il faut d'abord définir où obtenir sa représentation finale exacte et comment la vérifier sans enregistrer de secrets ; le client actuel ne fournit pas cette preuve.

Conséquence : l'implémentation de cette frontière attend un cadrage supplémentaire, avec modifications de transport potentiellement plus importantes. Aucun délai ou coût fiable n'est établi et aucune extension de harnais/permission n'est approuvée implicitement. Cela ne remet pas en cause les tests acquis, mais ne débloque pas immédiatement le plan proposé.

### C. Mettre cette étape en pause

Conserver tous les résultats et les plans sans engager cette implémentation. Aucun acquis n'est perdu, aucun résultat non obtenu n'est annoncé comme réussi ; le parcours intégré et ses garanties de reprise restent à terminer.

## Protection des données existantes, commune au plan proposé

La nouvelle gestion doit reconnaître les générations successives de travail. Le stockage existant ne le fait pas sous cette forme et refuse volontairement les schémas inconnus. Le plan propose une **base locale neuve et isolée, réservée à cette nouvelle version**, avec un ouvreur privé qui refuse les bases étrangères ou incompatibles. Les bases et tables existantes restent inchangées ; on réutilise les primitives de transaction et de journal, pas un deuxième ordonnanceur ou service.

Cette isolation limite le risque de casser l'existant ; elle ne prouve pas encore que le nouveau stockage fonctionne. Les tests commenceront sur des bases de fixture neuves possédées, avec droits, chemins et budget fermés par le parent avant exécution. Si l'utilisateur refuse aussi ce choix de stockage, il peut le préciser séparément : ce n'est pas une migration silencieuse autorisée.

## Décision demandée

Choisir A, B ou C. Choisir A ratifie la définition scientifique ci-dessus et la base isolée du plan proposé ; le parent peut ensuite fermer et autoriser la tranche de code/tests locaux dans le contrat renforcé existant. **Cela n'autorise aucun appel natif, lancement du jeu, changement de base existante, Git, nettoyage ou modification globale.** Le travail complet n'est pas accepté à l'avance.

La demande de clarification de l'utilisateur n'est pas une ratification. Aucune décision de59 n'est appliquée avant sa réponse.

## Références techniques facultatives

Rapports55 (preuves QA),56–58 (frontières/état du WIP) et59 (proposition détaillée). Contrats DRAIN575–588/625–636 et QA_MATRIX132–161 ; code client55–68/87–124, store8–21 et GraphStore219–255 relus par le parent. Aucun nouveau test exécuté pour cette reformulation.
