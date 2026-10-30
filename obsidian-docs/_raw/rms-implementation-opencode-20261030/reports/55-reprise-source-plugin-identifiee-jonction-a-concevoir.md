# 55. Reprise : source du plugin actif identifiée, jonction native à concevoir

## Objectif et découverte concrète

L'utilisateur demande de poursuivre les tâches non clôturées. Le parent commence par le prérequis serveur plutôt que rejouer les tests hors ligne : lecture de la documentation officielle OpenCodeV2, puis découverte et GET en lecture seule du service existant, sans le démarrer ou recharger.

Le plugin Ensemble actif et son chemin source sont maintenant identifiés. Les lectures ordinaires du parent réussissent pour package.json et l'entrée réelle ; aucun refus courant n'a été contourné. Cette observation nouvelle remplace l'ancien état « source non établie », sans effacer le refus historique du worker.

Le code de ce plugin définit et enregistre un RPC `ensemble` avec les méthodes `summary` et `teamContext`. RMS attend `ensemble.execution.v1` et ses méthodes d'exécution. Le namespace attendu n'est pas trouvé dans l'entrée lue. **Le plugin Ensemble actif identifié ne fournit donc pas par ce contrat le pont attendu par RMS.** Ce n'est pas une preuve universelle d'absence d'un fournisseur différent ou dynamique, ni une preuve native d'exécution.

## Décision et suite

Avant code ou déploiement, consulter le **même architecte** sur la jonction minimale réalisable : adaptation du contrat aux primitives V2 existantes ou nécessité d'un composant serveur manquant. Le conseil doit distinguer un raccord local compatible d'une nouvelle infrastructure importante à arbitrer. Aucun second ordonnanceur/store, fallback fixture, installation ou modification globale implicitement autorisé.

Les opérations réalisées sont lecture de métadonnées, lecture de source et empreintes. Aucune requête d'exécution, changement de permissions, agent natif de test ou écriture dans la base partagée. Les garanties de droits, idempotence et terminalité restent à prouver. Les47 tests de projection et les autres preuves intégrées restent valables ; aucune régression ne les invalide par cette découverte.

## Preuves et limites

- `../evidence/native-plugin-current-source-r1.json` : plugin actif, version et empreintes des fichiers présents ; aucun secret ou réponse API brute persisté.
- Bundle : définition19679–19731, enregistrement22707–22729 ; clientRMS:109–110,242.
- Documentation officielle consultée : https://opencode.ai/v2/docs/build/plugins/rpc et https://opencode.ai/v2/docs/api ; OpenAPI du serveur courant confirme GET `/api/plugin`, paramètre location en deepObject.
- Paquet consultatif : `../native-bridge-prerequisites.md`, extraits source autorisés pour éviter de demander au worker un accès externe éventuellement refusé.

Une identité de source et un hash de fichier présent ne sont pas un dump des octets exécutés en mémoire. Ni la documentation publique ni les fonctions de coordination ne prouvent encore les garanties du trajet RMS natif.

## Piste minimale vérifiée dans le schéma public actuel

Le parent a aussi extrait les seuls contrats pertinents de l'OpenAPI courant : session.create accepte un identifiant de session choisi par le caller, avec parent, agent, Model.Ref, location et permissions ; session.prompt accepte un identifiant de message choisi, texte et métadonnées. Les sessions sont relisibles par GET. Cette possibilité de fixer les identités rend une adaptation au noyau public V2 plausible sans installer un nouveau RPC global.

Le schéma ne promet pas à lui seul la déduplication, l'atomicité, les permissions effectives ou la terminaison native. Aucune création ou interruption de session n'est appelée ; ces méthodes ne sont ici que des contrats lus. La piste et ses limites sont transmises au même architecte, Model.Ref natif relu OpenAI Sol xhigh dans la session originale, sans second conseiller.

Résumé normalisé : `../evidence/native-core-api-contract-r1.json`. Il ne contient ni credentials, adresse privée du service ni contenu de session. La consultation est en cours ; aucun code ou déploiement autorisé par anticipation.
